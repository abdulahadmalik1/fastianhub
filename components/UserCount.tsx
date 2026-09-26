'use client';

import { useEffect, useState } from 'react';

const formatter = new Intl.NumberFormat('en-US');

export default function UserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    // Load Firestore after hydration so the archive and SEO content render first.
    void Promise.all([import('@/lib/firebase'), import('firebase/firestore')])
      .then(([{ db }, { doc, onSnapshot }]) => {
        if (disposed) return;
        unsubscribe = onSnapshot(doc(db, 'siteStats', 'public'), snapshot => {
          if (disposed) return;
          const value: unknown = snapshot.data()?.userCount;
          setCount(typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null);
        }, () => {
          if (!disposed) setCount(null);
        });
      })
      .catch(() => {
        // Missing permissions or a blocked connection must never interrupt browsing.
        if (!disposed) setCount(null);
      });

    return () => { disposed = true; unsubscribe?.(); };
  }, []);

  return <div className="user-count-slot" role="status" aria-live="polite" aria-atomic="true">
    {count !== null && <span className="user-count">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        <circle cx="9" cy="7" r="4" />
      </svg>
      <span><strong>{formatter.format(count)}</strong> {count === 1 ? 'user' : 'users'}</span>
    </span>}
  </div>;
}
