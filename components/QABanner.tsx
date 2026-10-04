'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import styles from './QABanner.module.css';

const STORAGE_KEY = 'fastianhub_qa_banner_dismissed';

export default function QABanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* no-op */ }
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* no-op */ }
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="status">
      <div className={styles.inner}>
        <span className={styles.badge} aria-hidden="true">
          <span className={styles.dot} />
          New
        </span>
        <p className={styles.text}>
          Student Q&amp;A — Got a question about FAST? A group of 3.8+ CGPA seniors answer for free, usually within a few hours.
        </p>
        <Link href="/qa" className={styles.cta} onClick={dismiss}>
          Check it out <Icon name="arrow" size={12} />
        </Link>
        <button className={styles.close} onClick={dismiss} aria-label="Dismiss">
          <Icon name="close" size={13} />
        </button>
      </div>
    </div>
  );
}
