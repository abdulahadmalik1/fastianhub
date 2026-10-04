import 'server-only';
import { cache } from 'react';
import { fetchAnsweredQuestions } from './qa-data';

// React deduplicates metadata/page calls; fetch's Data Cache persists for an hour.
export const getAnsweredQuestions = cache(fetchAnsweredQuestions);

export const getAnsweredQuestion = cache(async (id: string) => {
  // Use the same answered-only query as the hub and sitemap. A direct document
  // read cannot distinguish an unpublished answer from a rules/permission error.
  const questions = await getAnsweredQuestions();
  return questions.find(question => question.id === id) ?? null;
});
