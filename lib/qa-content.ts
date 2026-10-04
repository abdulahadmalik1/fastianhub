import type { QAItem } from './qa-data';

export function qaPath(id: string): string {
  return `/qa/${encodeURIComponent(id)}`;
}

export function plainText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, '$1')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

export function trimDescription(text: string, maxLength = 155): string {
  const plain = plainText(text);
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength - 1);
  const sentence = [...cut.matchAll(/[.!?](?=\s|$)/g)].at(-1)?.index ?? -1;
  if (sentence > maxLength * 0.6) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > maxLength * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

// Escape user-supplied </script> sequences before embedding JSON in HTML.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const STOP_WORDS = new Set('a an and are as at be can do for from how i if in is it me my of on or should still than that the their them there these this to was we what when where which who why will with you your fast nuces fastianhub'.split(' '));
function terms(text: string): Set<string> {
  return new Set((plainText(text).toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter(word => word.length > 2 && !STOP_WORDS.has(word)));
}

export function relatedQuestions(item: QAItem, questions: QAItem[], count = 3): QAItem[] {
  const subject = terms(item.question);
  return questions.filter(question => question.id !== item.id)
    .map(question => ({ question, score: [...terms(question.question)].filter(word => subject.has(word)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count).map(result => result.question);
}
