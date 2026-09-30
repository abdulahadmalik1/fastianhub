import type { Metadata } from 'next';
import StudentDashboard from '@/components/StudentDashboard';
import StructuredData from '@/components/StructuredData';
import { pageMetadata } from '@/lib/seo';
import { isSiteIndexable, SITE_NAME, SITE_URL } from '@/lib/site-config';

const DASHBOARD_TITLE = 'FAST NUCES Student Dashboard | Past Papers & Courses | FastianHub';
const DASHBOARD_DESCRIPTION = 'Keep FAST NUCES courses, past papers, quizzes, notes, and study resources in one place. Sign in to save your courses and study across every campus.';
const DASHBOARD_URL = `${SITE_URL}/dashboard`;

export const metadata: Metadata = {
  ...pageMetadata(DASHBOARD_TITLE, DASHBOARD_DESCRIPTION, '/dashboard'),
  keywords: [
    'FAST NUCES student dashboard',
    'FAST NUCES past papers',
    'FAST courses and notes',
    'FAST quizzes and study resources',
  ],
  // Index the public sign-in page only on the production site.
  robots: isSiteIndexable()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }
    : { index: false, follow: false },
};

export default function DashboardPage() {
  return <>
    <StructuredData data={{
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${DASHBOARD_URL}#webpage`,
      url: DASHBOARD_URL,
      name: DASHBOARD_TITLE,
      description: DASHBOARD_DESCRIPTION,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: {
        '@type': 'WebApplication',
        '@id': `${DASHBOARD_URL}#application`,
        name: `${SITE_NAME} Student Dashboard`,
        url: DASHBOARD_URL,
        description: DASHBOARD_DESCRIPTION,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web browser',
        browserRequirements: 'Requires JavaScript and Google sign-in.',
      },
    }} />
    <StudentDashboard />
  </>;
}
