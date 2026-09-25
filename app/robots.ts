import type { MetadataRoute } from 'next';
import { isSiteIndexable, SITE_URL } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) return { rules: { userAgent: '*', disallow: '/' } };
  // Let crawlers read API X-Robots-Tag headers; disallowing those URLs would
  // prevent crawlers from seeing their noindex directive. Assets stay crawlable.
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` };
}
