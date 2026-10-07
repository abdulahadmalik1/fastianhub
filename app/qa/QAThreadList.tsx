'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import type { QAItem } from '@/lib/qa-data';
import { qaPath } from '@/lib/qa-content';
import styles from './qa.module.css';

type QAThread = Pick<QAItem, 'id' | 'question' | 'createdAt'>;

export default function QAThreadList({ initialQuestions }: { initialQuestions: QAThread[] }) {
  const [questions, setQuestions] = useState(initialQuestions);

  useEffect(() => {
    let active = true;
    let loading = false;
    let unsubscribe: (() => void) | undefined;
    let fallbackInterval: number | undefined;

    async function refreshFallback() {
      if (!active || loading || document.visibilityState !== 'visible') return;
      loading = true;
      try {
        const response = await fetch('/api/qa/answered', { cache: 'no-store' });
        if (!response.ok) return;
        const latest: QAThread[] = await response.json();
        if (active && Array.isArray(latest)) setQuestions(latest);
      } catch {
        // Keep the server-rendered list during a temporary network failure.
      } finally {
        loading = false;
      }
    }

    function startFallback() {
      if (!active || fallbackInterval !== undefined) return;
      void refreshFallback();
      fallbackInterval = window.setInterval(() => void refreshFallback(), 60_000);
      document.addEventListener('visibilitychange', refreshFallback);
    }

    async function listen() {
      try {
        // Load the SDK after hydration so the initial HTML stays small and fast.
        const [{ collection, onSnapshot, query, where }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('@/lib/firebase'),
        ]);
        if (!active) return;

        const published = query(collection(db, 'questions'), where('answer', '>', ''));
        unsubscribe = onSnapshot(published, { includeMetadataChanges: true }, snapshot => {
          // A local snapshot can be stale. Keep SSR data until Firestore confirms
          // the current server state, then apply each subsequent change.
          if (!active || snapshot.metadata.fromCache) return;
          const latest = snapshot.docs.flatMap(doc => {
            const data = doc.data();
            const question = typeof data.question === 'string' ? data.question.trim() : '';
            if (!question || typeof data.answer !== 'string' || !data.answer.trim()) return [];
            const createdAt = typeof data.createdAt?.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : undefined;
            return [{ id: doc.id, question, createdAt }];
          }).sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
            || a.id.localeCompare(b.id));
          setQuestions(latest);
        }, startFallback);
      } catch {
        startFallback();
      }
    }

    void listen();
    return () => {
      active = false;
      unsubscribe?.();
      if (fallbackInterval !== undefined) window.clearInterval(fallbackInterval);
      document.removeEventListener('visibilitychange', refreshFallback);
    };
  }, []);

  return (
    <section id="answered-questions" className={styles.answers} aria-labelledby="answers-title" tabIndex={-1}>
      <div className={styles.answersHeading}>
        <h2 id="answers-title">Answered questions</h2>
        {questions.length > 0 && <span className={styles.count2}>{questions.length} threads</span>}
      </div>

      {questions.length === 0 ? (
        <p className={styles.state}>No answered questions yet. Ask above!</p>
      ) : (
        <div className={styles.threadList}>
          {questions.map((item, index) => (
            <Link key={item.id} href={qaPath(item.id)} prefetch={false} className={`${styles.thread}${index === 0 ? ` ${styles.threadNew}` : ''}`}>
              <span className={styles.threadDot} aria-hidden="true" />
              <span className={styles.threadTitle}>
                {index === 0 && <span className={styles.newBadge}>New answer</span>}
                {item.question}
              </span>
              <span className={styles.threadChevron} aria-hidden="true">
                <Icon name="arrow" size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
