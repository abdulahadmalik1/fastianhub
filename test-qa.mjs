const API_KEY = 'AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w';
const PROJECT_ID = 'fastiflex';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function parseDoc(doc) {
  const f = doc.fields;
  if (!f) return null;
  const question = f.question?.stringValue?.trim();
  const answer = f.answer?.stringValue?.trim();
  if (!question || !answer) return null;
  const id = doc.name.split('/').pop();
  const createdAt = f.createdAt?.timestampValue ?? new Date(0).toISOString();
  return { id, question, answer, createdAt };
}

async function test() {
  const url = new URL(`${FIRESTORE_BASE}/questions`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('pageSize', '5');

  console.log("Fetching: " + url.toString());
  const res = await fetch(url.toString());
  console.log("Status: " + res.status);
  
  if (!res.ok) {
     console.error(await res.text());
     return;
  }

  const json = await res.json();
  console.log("Total docs: " + (json.documents ? json.documents.length : 0));
  
  for (const doc of json.documents ?? []) {
    console.log("Doc name:", doc.name);
    console.log("Parsed:", parseDoc(doc));
  }
}

test();
