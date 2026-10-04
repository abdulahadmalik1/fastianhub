import type { MetadataRoute } from 'next';
import { campusOptions } from '@/lib/campuses';
import { isSiteIndexable, SITE_URL } from '@/lib/site-config';
import { getAnsweredQuestions } from '@/lib/qa-server';
import { qaPath } from '@/lib/qa-content';

// Rebuild the sitemap hourly so new answered questions appear promptly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) return [];

  // ── Existing non-Q&A pages (unchanged) ──────────────────────────────────────
  const staticPaths = [
    '/',
    '/dashboard',
    '/credits',
    '/motivation',
    ...campusOptions.map(campus => `/campus/${campus.slug}`),
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(path => ({
    url: new URL(path, SITE_URL).href,
  }));

  // ── Q&A section ──────────────────────────────────────────────────────────────
  // Only answered questions are indexable; unanswered drafts are excluded.
  const answeredQuestions = await getAnsweredQuestions();

  const qaEntries: MetadataRoute.Sitemap = [
    // /qa listing page
    { url: new URL('/qa', SITE_URL).href },
    // Individual answer pages
    ...answeredQuestions.map(q => ({
      url: new URL(qaPath(q.id), SITE_URL).href,
      ...(q.updatedAt ? { lastModified: q.updatedAt } : {}),
    })),
  ];

  return [...staticEntries, ...qaEntries];
}
