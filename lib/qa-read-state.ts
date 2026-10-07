// Keep only a small answer fingerprint in this browser, scoped to the account.
export function answerVersion(answer: string): string {
  const text = answer.trim();
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(36)}`;
}

export function readAnswers(uid: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`qa-read:${uid}`) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, version]) => typeof version === 'string'));
  } catch { return {}; }
}
