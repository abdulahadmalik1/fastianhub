import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from './site-config';

export const HOME_TITLE = 'FAST NUCES Past Papers & Study Resources | FastianHub';
export const HOME_DESCRIPTION = 'Browse FAST NUCES past papers, sessionals, finals, quizzes and course resources for Islamabad, Karachi, Lahore and Chiniot-Faisalabad (CFD) campuses.';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = new URL(path, SITE_URL).href;
  const image = { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'FastianHub — FAST NUCES past papers across four campuses' };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'en_PK', siteName: SITE_NAME, title, description, url, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export function collectionSchema(title: string, description: string, path: string, campusName?: string) {
  const url = new URL(path, SITE_URL).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(campusName ? { about: { '@type': 'Thing', name: `FAST NUCES ${campusName} past papers` } } : {}),
  };
}
