import PastPapersView from '@/components/PastPapersView';
import StructuredData from '@/components/StructuredData';
import { collectionSchema, HOME_DESCRIPTION, HOME_TITLE, pageMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

export const metadata = pageMetadata(HOME_TITLE, HOME_DESCRIPTION, '/');

export default function Home() {
  return <>
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, alternateName: 'Fastian Hub', description: HOME_DESCRIPTION, inLanguage: 'en' }} />
    <StructuredData data={collectionSchema(HOME_TITLE, HOME_DESCRIPTION, '/')} />
    <PastPapersView />
  </>;
}
