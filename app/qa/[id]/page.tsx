import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  getAnsweredQuestion,
  getAnsweredQuestions,
} from '@/lib/qa-server';
import { qaPath, relatedQuestions, serializeJsonLd, trimDescription } from '@/lib/qa-content';
import { SITE_URL } from '@/lib/site-config';
import { qaReferences } from '@/lib/qa-references';
import styles from './answer.module.css';

// Answers and metadata must reflect Firebase Console edits on the next visit.
export const dynamic = 'force-dynamic';

// ── Metadata ───────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getAnsweredQuestion(id);

  if (!item) notFound();

  // Keep the question's meaning; don't cut it at 60 characters and then append
  // a second keyword-heavy suffix. The visible H1 always retains the full text.
  const title = `${trimDescription(item.question, 110)} | FastianHub`;

  const description = trimDescription(item.answer);
  const url = `${SITE_URL}${qaPath(id)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Inherit the root's production/preview robots policy.
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'FastianHub',
      locale: 'en_PK',
      images: [{ url: `${SITE_URL}/qa/opengraph-image`, width: 1200, height: 630, alt: 'FAST-NUCES Student Q&A — FastianHub' }],
      modifiedTime: item.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: `${SITE_URL}/qa/opengraph-image`, alt: 'FAST-NUCES Student Q&A — FastianHub' }],
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Karachi',
    });
  } catch {
    return '';
  }
}

function linkifyAnswer(text: string) {
  const parts: React.ReactNode[] = [];
  const urls = /https?:\/\/[^\s<>"']+/g;
  let cursor = 0;

  for (const match of text.matchAll(urls)) {
    const start = match.index;
    const url = match[0].replace(/[.,!?;:]+$/, '');
    parts.push(text.slice(cursor, start));
    parts.push(<a key={start} href={url}>{url}</a>);
    cursor = start + url.length;
  }

  parts.push(text.slice(cursor));
  return parts;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function AnswerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch current question + all answered questions (for related block)
  const [item, allQuestions] = await Promise.all([
    getAnsweredQuestion(id),
    getAnsweredQuestions(),
  ]);

  // 404 if missing or unanswered
  if (!item) notFound();

  // Split answer into paragraphs
  const paragraphs = item.answer.split(/\r?\n\s*\r?\n/).filter(Boolean);

  const related = relatedQuestions(item, allQuestions);
  const references = qaReferences[id] ?? [];

  // Structured data
  const pageUrl = `${SITE_URL}${qaPath(id)}`;

  const qaPageSchema = {
    '@context': 'https://schema.org',
    // Answers are publisher-curated: visitors cannot submit alternative answers.
    // FAQPage describes this accurately; Google QAPage eligibility does not apply.
    '@type': 'FAQPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: item.question,
    inLanguage: 'en',
    dateModified: item.updatedAt,
    isPartOf: { '@type': 'CollectionPage', '@id': `${SITE_URL}/qa#webpage`, url: `${SITE_URL}/qa`, name: 'FAST-NUCES Student Q&A' },
    mainEntity: [{
      '@type': 'Question',
      '@id': `${pageUrl}#question`,
      name: item.question,
      text: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
        dateModified: item.updatedAt,
        url: `${pageUrl}#answer`,
      },
    }],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Student Q&A', item: `${SITE_URL}/qa` },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.question,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className={`app-shell ${styles.page}`}>
      <a className="skip-link" href="#answer-content">Skip to answer</a>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(qaPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" prefetch={false} className="brand" aria-label="FastianHub home">
            <span className="brand-mark"><Icon name="book" size={22} /></span>
            <span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span>
          </Link>
          <Link href="/qa" prefetch={false} className="text-button">All Q&amp;A <Icon name="arrow" size={18} /></Link>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main id="answer-content" className={`container ${styles.main}`}>

        {/* Breadcrumb nav */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/qa" prefetch={false} className={styles.backLink}>
            <span className={styles.backArrow}><Icon name="arrow" size={13} /></span>
            Student Q&amp;A
          </Link>
        </nav>

        <article className={styles.article}>

          {/* ── Question header ───────────────────────────────────────────── */}
          <div className={styles.articleHeader}>
            <span className={styles.tag}>Student Q&amp;A</span>
            <h1 id="question" className={styles.question}>{item.question}</h1>
          </div>

          {/* ── Answer divider ────────────────────────────────────────────── */}
          <h2 className={styles.divider} id="answer">Answer</h2>

          {/* ── Last updated ─────────────────────────────────────────────── */}
          <p className={styles.lastUpdated}>
            Curated by FastianHub
            {item.updatedAt && <> · Updated <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time></>}
          </p>

          {/* ── Answer body ───────────────────────────────────────────────── */}
          <div className={styles.answerBody}>
            {paragraphs.map((para, i) => (
              <p key={i}>{linkifyAnswer(para)}</p>
            ))}
          </div>

          {references.length > 0 && (
            <section className={styles.references} aria-labelledby="references-title">
              <h2 id="references-title">Official policy references</h2>
              <p>Check the university&apos;s current rules and your course outline for requirements that apply to you.</p>
              <ul>
                {references.map(reference => <li key={reference.url}><a href={reference.url}>{reference.label}</a></li>)}
              </ul>
            </section>
          )}

          {/* ── Related questions ─────────────────────────────────────────── */}
          {related.length > 0 && (
            <section className={styles.relatedSection} aria-labelledby="related-title">
              <h2 id="related-title" className={styles.relatedHeading}>Related questions</h2>
              <ul className={styles.relatedList} role="list">
                {related.map(q => (
                  <li key={q.id}>
                    <Link href={qaPath(q.id)} prefetch={false} className={styles.relatedLink}>
                      <span className={styles.relatedDot} aria-hidden="true" />
                      <span>{q.question}</span>
                      <span className={styles.relatedArrow} aria-hidden="true">
                        <Icon name="arrow" size={13} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Footer CTA ───────────────────────────────────────────────── */}
          <div className={styles.footer}>
            <Link href="/qa" prefetch={false} className={styles.backBtn}>
              <span className={styles.backArrow}><Icon name="arrow" size={14} /></span>
              All questions
            </Link>
          </div>

        </article>
      </main>

      <footer className="container site-footer">
        <p>By Fastians, for Fastians.</p>
        <Link href="/" prefetch={false}>Back to past papers <Icon name="arrow" size={15} /></Link>
      </footer>
    </div>
  );
}
