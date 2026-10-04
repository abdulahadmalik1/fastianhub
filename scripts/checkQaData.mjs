import assert from 'node:assert/strict';
import { fetchAnsweredQuestions } from '../lib/qa-data.ts';
import { plainText, qaPath, relatedQuestions, serializeJsonLd, trimDescription } from '../lib/qa-content.ts';

// No live reads/writes. Test the production data loader against controlled API responses.
const document = (id, overrides = {}) => ({
  name: `projects/demo/databases/(default)/documents/questions/${id}`,
  createTime: '2026-09-01T08:00:00Z', updateTime: '2026-10-04T10:32:52.660472Z',
  fields: { question: { stringValue: `Question ${id}?` }, answer: { stringValue: 'Published answer.' }, createdAt: { timestampValue: '2026-10-01T12:00:00Z' } },
  ...overrides,
});
const newer = document('newer');
const older = document('older', { fields: { ...newer.fields, createdAt: { timestampValue: '2026-09-30T12:00:00Z' } } });
const blank = document('blank', { fields: { ...newer.fields, answer: { stringValue: ' \n ' } } });
const missing = document('missing', { fields: { answer: { stringValue: 'Answer without a question.' } } });
let request;
const data = await fetchAnsweredQuestions(async (url, options) => {
  request = { url, options };
  return Response.json([{ document: older }, { document: blank }, { document: missing }, { document: newer }]);
});
assert.deepEqual(data.map(item => item.id), ['newer', 'older']);
assert.equal(data[0].updatedAt, '2026-10-04T10:32:52.660Z');
assert.notEqual(data[0].updatedAt, data[0].createdAt);
assert.equal(request.options.method, 'POST');
assert.equal(request.options.cache, 'force-cache');
assert.equal(request.options.next.revalidate, 3600);
assert.deepEqual(JSON.parse(request.options.body).structuredQuery.where, {
  fieldFilter: { field: { fieldPath: 'answer' }, op: 'GREATER_THAN', value: { stringValue: '' } },
});

for (const status of [403, 429, 500, 503]) {
  await assert.rejects(() => fetchAnsweredQuestions(async () => new Response('', { status })), new RegExp(`HTTP ${status}`));
}
await assert.rejects(() => fetchAnsweredQuestions(async () => { throw new Error('Network offline'); }), /Network offline/);
await assert.rejects(() => fetchAnsweredQuestions(async () => Response.json({ error: 'invalid response' })), /Invalid/);
await assert.rejects(() => fetchAnsweredQuestions(async () => Response.json([{ error: { code: 503 } }])), /Invalid/);
await assert.rejects(() => fetchAnsweredQuestions(async () => new Response('not JSON')));
assert.deepEqual(await fetchAnsweredQuestions(async () => Response.json([{ readTime: '2026-10-04T12:00:00Z' }])), []);

const all = await fetchAnsweredQuestions(async () => Response.json(Array.from({ length: 350 }, (_, i) => ({ document: document(`question-${i}`) }))));
assert.equal(all.length, 350, 'No silent list-endpoint page truncation');
const [undated] = await fetchAnsweredQuestions(async () => Response.json([{ document: document('no-date', {
  createTime: undefined, updateTime: 'bad date', fields: { ...newer.fields, createdAt: { timestampValue: 'bad date' } },
}) }]));
assert.equal(undated.createdAt, undefined);
assert.equal(undated.updatedAt, undefined);

const hostile = '</script><script>alert("injection")</script>';
assert.ok(!serializeJsonLd({ text: hostile }).includes('<'));
assert.deepEqual(JSON.parse(serializeJsonLd({ text: hostile })), { text: hostile });
assert.equal(qaPath('question?# &'), '/qa/question%3F%23%20%26');
assert.equal(plainText('## **Study** [rules](https://example.com)\n`code` and _practice_'), 'Study rules code and practice');
const description = trimDescription('Practise the questions in your course outline and review each mistake carefully before your next examination. '.repeat(4));
assert.ok(description.length <= 155);
assert.ok(!description.includes('\n'));
const current = { id: 'current', question: 'How does FAST attendance affect final exams?', answer: '' };
const others = [{ id: 'unrelated', question: 'Where are FAST past papers?', answer: '' }, { id: 'related', question: 'How are attendance records checked?', answer: '' }, current];
assert.equal(relatedQuestions(current, others)[0].id, 'related');
assert.ok(relatedQuestions(current, others).every(item => item.id !== current.id));
console.log('PASS Q&A data: answered-only queries, caching, outage propagation, full results, timestamps, safe JSON-LD, metadata and related links');
