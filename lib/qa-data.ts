export type QAItem = {
  id: string;
  question: string;
  answer: string;
  createdAt?: string;
  updatedAt?: string;
};

type FirestoreDocument = {
  name?: string;
  createTime?: string;
  updateTime?: string;
  fields?: Record<string, { stringValue?: string; timestampValue?: string }>;
};

const QUERY_URL = 'https://firestore.googleapis.com/v1/projects/fastiflex/databases/(default)/documents:runQuery';
// Public web-app identifier, not an admin credential. Reads still obey rules.
const API_KEY = 'AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w';

function validTimestamp(value?: string): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function parseDocument(document: FirestoreDocument): QAItem | null {
  const fields = document.fields;
  const id = document.name?.split('/').pop();
  const question = fields?.question?.stringValue?.trim();
  const answer = fields?.answer?.stringValue?.trim();
  if (!id || !question || !answer) return null;

  return {
    id, question, answer,
    createdAt: validTimestamp(fields?.createdAt?.timestampValue) ?? validTimestamp(document.createTime),
    // Firestore maintains updateTime even when answers are edited in Console.
    // Never pretend the question's submission time is the answer's publication.
    updatedAt: validTimestamp(document.updateTime),
  };
}

export async function fetchAnsweredQuestions(fetcher: typeof fetch = fetch): Promise<QAItem[]> {
  const response = await fetcher(`${QUERY_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'questions' }],
        where: { fieldFilter: { field: { fieldPath: 'answer' }, op: 'GREATER_THAN', value: { stringValue: '' } } },
      },
    }),
    cache: 'force-cache',
    next: { revalidate: 3600, tags: ['qa-answers'] },
    signal: AbortSignal.timeout(15000),
  });

  // Let ISR retain the last successful page on outages. Returning []/null here
  // would publish a false empty archive, drop sitemap URLs, or create false 404s.
  if (!response.ok) throw new Error(`Unable to load published Q&A (HTTP ${response.status}).`);

  const rows: { document?: FirestoreDocument; error?: unknown }[] = await response.json();
  if (!Array.isArray(rows) || rows.some(row => !row || row.error)) {
    throw new Error('Invalid published Q&A response.');
  }

  // runQuery returns the full matching result set, unlike the paginated list API.
  // No client-side filtering of private/unanswered documents is required.
  return rows.flatMap(row => {
    const item = row.document ? parseDocument(row.document) : null;
    return item ? [item] : [];
  }).sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
    || a.id.localeCompare(b.id));
}
