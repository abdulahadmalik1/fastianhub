import { fetchAnsweredQuestions } from '@/lib/qa-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const questions = await fetchAnsweredQuestions();
    return Response.json(questions.map(({ id, question, createdAt }) => ({ id, question, createdAt })), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Published questions are temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
