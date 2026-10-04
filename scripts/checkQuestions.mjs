import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore,
  collection, query, serverTimestamp, setDoc, setLogLevel, Timestamp, updateDoc, where,
} from 'firebase/firestore';

// Disposable emulator project only. Never runs these checks against live Firestore.
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(localhost|127\.0\.0\.1):\d+$/.test(host)) {
  throw new Error('Start the Firestore emulator and set FIRESTORE_EMULATOR_HOST to its loopback host:port.');
}
const projectId = 'demo-fastiflex-qa';
const origin = `http://${host}`;
const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const loaded = await fetch(`${origin}/emulator/v1/projects/${projectId}:securityRules`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } }),
});
assert.ok(loaded.ok, `Rules compile: ${await loaded.text()}`);
setLogLevel('silent');
const apps = [];
function client(name, authenticated = false) {
  const app = initializeApp({ projectId, apiKey: 'emulator-only' }, name);
  apps.push(app);
  const db = getFirestore(app);
  const [hostname, port] = host.split(':');
  connectFirestoreEmulator(db, hostname, Number(port), authenticated ? { mockUserToken: { sub: 'qa-test-user' } } : {});
  return db;
}
const db = client('qa-public');
const signedIn = client('qa-signed-in', true);
const prefix = `check-${Date.now()}`;
const question = value => ({ question: value, answer: '', createdAt: serverTimestamp() });
const denied = operation => assert.rejects(operation, error => error.code === 'permission-denied');
async function seed(id, answer, createdAt) {
  const response = await fetch(`${origin}/v1/projects/${projectId}/databases/(default)/documents/questions/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: {
      question: { stringValue: id }, answer: { stringValue: answer }, createdAt: { timestampValue: createdAt },
    } }),
  });
  assert.ok(response.ok, `Seed: ${await response.text()}`);
}
try {
  const pending = doc(db, 'questions', `${prefix}-pending`);
  await setDoc(pending, question('How can I prepare for the semester?'));
  await setDoc(doc(db, 'questions', `${prefix}-limit`), question('a'.repeat(500)));
  for (const [index, data] of [
    question(''), question(' \t\n '), question('a'.repeat(501)), question(123),
    { ...question('Can I publish this myself?'), answer: 'No' },
    { ...question('Extra field?'), email: 'not-stored@example.com' },
    { ...question('Fake date?'), createdAt: Timestamp.fromMillis(0) },
    { question: 'Missing date?', answer: '' },
    { question: 'Missing answer?', createdAt: serverTimestamp() },
  ].entries()) {
    await denied(setDoc(doc(db, 'questions', `${prefix}-invalid-${index}`), data));
  }
  console.log('PASS anonymous create, 500-character limit, nonblank text, exact fields, empty answer and server timestamp');

  await denied(getDoc(pending));
  await denied(getDocs(collection(db, 'questions')));
  await denied(updateDoc(pending, { answer: 'Not allowed' }));
  await denied(deleteDoc(pending));
  await denied(getDoc(doc(signedIn, 'questions', pending.id)));
  await denied(updateDoc(doc(signedIn, 'questions', pending.id), { answer: 'Still not allowed' }));
  console.log('PASS unanswered reads and all public edits/deletes denied, including signed-in clients');

  const newer = `${prefix}-newer`, older = `${prefix}-older`;
  await seed(newer, 'An answer.', '2026-10-04T12:00:00.000Z');
  await seed(older, 'Another answer.', '2026-10-03T12:00:00.000Z');
  const snapshot = await getDocs(query(collection(db, 'questions'), where('answer', '>', '')));
  assert.ok(snapshot.docs.every(item => item.data().answer !== ''));
  const relevant = snapshot.docs.filter(item => item.id.startsWith(prefix));
  relevant.sort((a, b) => b.data().createdAt.toMillis() - a.data().createdAt.toMillis());
  assert.deepEqual(relevant.map(item => item.id), [newer, older]);
  await getDoc(doc(db, 'questions', newer));
  await denied(setDoc(doc(db, 'questions', newer), question('Cannot replace an answer')));
  await denied(deleteDoc(doc(db, 'questions', newer)));
  await seed(newer, '', '2026-10-04T12:00:00.000Z');
  const afterUnpublish = await getDocs(query(collection(db, 'questions'), where('answer', '>', '')));
  assert.ok(afterUnpublish.docs.every(item => item.id !== newer));
  await denied(getDoc(doc(db, 'questions', newer)));
  console.log('PASS answered-only query, newest-first sorting, immutable answers and hiding cleared answers');
} finally {
  await Promise.all(apps.map(app => deleteApp(app)));
}
