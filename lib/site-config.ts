export const SITE_URL = 'https://fastianhub.com';
export const SITE_NAME = 'FastianHub';

// These values are evaluated during the build. Rebuild when changing deployment
// indexing settings. Preview deployments must never become indexable by accident.
export function isSiteIndexable(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV !== 'production') return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return false;
  return env.SITE_INDEXABLE !== 'false';
}
