// Seed or replace the public Q&A entries from the exact checked-in JSON file.
//
// Normal run: creates only missing documents and keeps existing documents.
// Replace run: `node scripts/seedQuestions.mjs --replace` deletes every existing
// question document, then creates the five records from the JSON file.
// Use --replace only for an intentional content reset.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const project = 'fastiflex';
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const token = process.env.FIRESTORE_ACCESS_TOKEN;
const replace = process.argv.includes('--replace');
const seedPath = fileURLToPath(new URL('../fastiflex_qa_seeds_rewritten.json', import.meta.url));

if (emulator && !/^(localhost|127\.0\.0\.1):\d+$/.test(emulator)) {
  throw new Error('The seed script only allows a loopback Firestore emulator.');
}
if (!emulator && !token) {
  throw new Error('Set FIRESTORE_ACCESS_TOKEN to an owner OAuth token, or FIRESTORE_EMULATOR_HOST for a loopback emulator.');
}

const seeds = JSON.parse(await readFile(seedPath, 'utf8'));
if (!Array.isArray(seeds) || seeds.length !== 5) {
  throw new Error('The exact seed file must contain exactly five records.');
}
for (const seed of seeds) {
  if (!seed || typeof seed.id !== 'string' || typeof seed.question !== 'string' || typeof seed.answer !== 'string'
    || !seed.id || !seed.question.trim() || !seed.answer.trim()) {
    throw new Error('Every seed must contain a non-empty id, question and answer string.');
  }
}

const origin = emulator ? `http://${emulator}` : 'https://firestore.googleapis.com';
const auth = { ...(emulator || token ? { Authorization: `Bearer ${emulator ? 'owner' : token}` } : {}) };
const request = async (url, init = {}) => fetch(url, {
  ...init,
  headers: { ...auth, ...(init.headers || {}) },
  signal: AbortSignal.timeout(15000),
});

async function listQuestionIds() {
  const response = await request(`${origin}/v1/projects/${project}/databases/(default)/documents/questions`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Could not list existing questions: ${response.status} ${await response.text()}`);
  const result = await response.json();
  return (result.documents || []).map(document => document.name.split('/').pop());
}

async function deleteQuestion(id) {
  const response = await request(`${origin}/v1/projects/${project}/databases/(default)/documents/questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Could not delete questions/${id}: ${response.status} ${await response.text()}`);
  }
}

async function createQuestion(seed, index) {
  const response = await request(`${origin}/v1/projects/${project}/databases/(default)/documents/questions/${encodeURIComponent(seed.id)}?currentDocument.exists=false`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {
      question: { stringValue: seed.question },
      answer: { stringValue: seed.answer },
      createdAt: { timestampValue: new Date(Date.now() + index).toISOString() },
    } }),
  });
  if (response.ok) {
    console.log(`Created questions/${seed.id}`);
    return;
  }
  const result = await response.json();
  if (result.error?.status === 'ALREADY_EXISTS') {
    console.log(`Kept existing questions/${seed.id}`);
    return;
  }
  throw new Error(`Could not seed questions/${seed.id}: ${result.error?.status || response.status}.`);
}

const existingIds = await listQuestionIds();
if (replace) {
  for (const id of existingIds) await deleteQuestion(id);
  console.log(`Removed ${existingIds.length} existing question document(s).`);
}
for (const [index, seed] of seeds.entries()) await createQuestion(seed, index);
console.log(replace ? 'Replacement complete: five exact Q&A seeds are live.' : 'Seed complete. Existing documents were preserved.');
