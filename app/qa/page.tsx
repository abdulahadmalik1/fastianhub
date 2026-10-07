import Link from 'next/link';
import type { Metadata } from 'next';
import Icon from '@/components/Icon';
import QAForm from './QAForm';
import QAThreadList from './QAThreadList';
import { getAnsweredQuestions } from '@/lib/qa-server';
import { qaPath, serializeJsonLd } from '@/lib/qa-content';
import { SITE_URL } from '@/lib/site-config';
import styles from './qa.module.css';

// Read fresh published answers for every request. Open tabs receive live updates.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAST-NUCES Student Q&A: GPA, Attendance & Exams | FastianHub',
  description:
    'Find answers to FAST-NUCES student questions about GPA, attendance, Programming Fundamentals and sessional exams. Browse study advice or ask anonymously.',
  alternates: { canonical: `${SITE_URL}/qa` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/qa`,
    title: 'FAST-NUCES Student Q&A: GPA, Attendance & Exams | FastianHub',
    description:
      'Community answers on GPA, attendance, PF exams, sessionals and student life at FAST-NUCES.',
    siteName: 'FastianHub',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAST-NUCES Student Q&A: GPA, Attendance & Exams | FastianHub',
    description:
      'Community answers on GPA, attendance, PF exams, sessionals and student life at FAST-NUCES.',
    images: [{ url: `${SITE_URL}/qa/opengraph-image`, alt: 'FAST-NUCES Student Q&A — FastianHub' }],
  },
};

export default async function QAPage() {
  // Fetch answered questions server-side so Google gets real <a> links in HTML
  const questions = await getAnsweredQuestions();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/qa#webpage`,
    url: `${SITE_URL}/qa`,
    name: 'FAST-NUCES Student Q&A',
    description: metadata.description,
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: questions.length,
      itemListElement: questions.map((item, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: item.question, url: `${SITE_URL}${qaPath(item.id)}`,
      })),
    },
  };

  return (
    <div className={`app-shell ${styles.page}`}>
      <a className="skip-link" href="#qa">Skip to questions</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" prefetch={false} className="brand" aria-label="FastianHub home">
            <span className="brand-mark"><Icon name="book" size={22} /></span>
            <span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span>
          </Link>
          <Link href="/" prefetch={false} className="text-button">Past papers <Icon name="arrow" size={18} /></Link>
        </div>
      </header>

      <main id="qa" className={`container ${styles.main}`}>
        {/* ── Intro ─────────────────────────────────── */}
        <section className={styles.intro} aria-labelledby="qa-title">
          <p className="eyebrow"><span /> THE STUDENT Q&amp;A</p>
          <h1 id="qa-title">FAST-NUCES Q&amp;A.<br /><em>We&apos;ve got you.</em></h1>
          <p className={styles.lead}>Answers about GPA, attendance, Programming Fundamentals, sessional exams and student life at FAST.</p>
          <div className={styles.guarantee}>
            <span className={styles.guaranteeDot} />
            Student questions · answers curated by FastianHub
          </div>
        </section>

        {/* ── Ask form (client component — interactive) ── */}
        <QAForm />

        <a href="#answered-questions" className={styles.browseQuestions}>
          Browse questions &amp; answers
          <span aria-hidden="true"><Icon name="arrow" size={15} /></span>
        </a>

        {/* ── Fresh server HTML for crawlers, live updates for open tabs ── */}
        <QAThreadList initialQuestions={questions.map(({ id, question, createdAt }) => ({ id, question, createdAt }))} />
      </main>

      <footer className={`container site-footer ${styles.footer}`}>
        <p>By Fastians, for Fastians.</p>
        <Link href="/" prefetch={false}>Back to past papers <Icon name="arrow" size={15} /></Link>
      </footer>
    </div>
  );
}
