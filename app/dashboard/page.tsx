import type { Metadata } from 'next';
import StudentDashboard from '@/components/StudentDashboard';
import StructuredData from '@/components/StructuredData';
import { pageMetadata } from '@/lib/seo';
import { isSiteIndexable, SITE_NAME, SITE_URL } from '@/lib/site-config';

const DASHBOARD_TITLE = 'FAST Student Dashboard | Saved Courses & Papers | FastianHub';
const DASHBOARD_DESCRIPTION = 'Keep your FAST NUCES courses, past papers, quizzes and notes together. Sign in with Google to save your course list and access it on any device.';
const DASHBOARD_URL = `${SITE_URL}/dashboard`;

export const metadata: Metadata = {
  ...pageMetadata(DASHBOARD_TITLE, DASHBOARD_DESCRIPTION, '/dashboard'),
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
