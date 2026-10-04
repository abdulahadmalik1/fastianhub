'use client';

import Link from 'next/link';
import styles from './qa.module.css';

export default function QAError({ retry }: { retry: () => void }) {
  return (
    <main className={`container ${styles.main} ${styles.state}`}>
      <h1>Questions are temporarily unavailable</h1>
      <p>We couldn&apos;t load the published answers. Please try again.</p>
      <button type="button" className="primary-button" onClick={retry}>Try again</button>
      <p><Link href="/qa">Back to student Q&amp;A</Link></p>
    </main>
  );
}
