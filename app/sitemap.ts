import type { MetadataRoute } from 'next';
import { campusOptions } from '@/lib/campuses';
import { isSiteIndexable, SITE_URL } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable()) return [];
  // No fabricated lastModified: the archive's lastGenerated changes on every build,
  // even when the content is unchanged. Include only canonical, indexable pages.
  return ['/', '/dashboard', '/credits', '/motivation', ...campusOptions.map(campus => `/campus/${campus.slug}`)]
    .map(path => ({ url: new URL(path, SITE_URL).href }));
}
