'use client';

import { useState } from 'react';
import Link from 'next/link';
import { qaPath } from '@/lib/qa-content';
import { useQAUpdates } from './QAUpdatesProvider';
import Icon from './Icon';
import styles from './QAStatus.module.css';

export default function QAStatus() {
  const { questions, unread, seen, error } = useQAUpdates();
  const [expanded, setExpanded] = useState<boolean | null>(null);
  if (!questions.length && !error) return null;

  const isNew = (item: typeof questions[number]) => item.status === 'answered' && seen[item.id] !== item.version;
  const pending = questions.filter(item => item.status === 'pending').length;
  const checking = questions.some(item => item.status === 'checking');
  const ready = questions.filter(item => item.status === 'answered').length;
  const summary = error ? 'Updates unavailable' : unread ? `${unread} new ${unread === 1 ? 'reply' : 'replies'}`
    : pending ? `${pending} waiting` : checking ? 'Checking…' : ready ? `${ready} answered` : 'Status unavailable';
  const open = expanded ?? unread > 0;
  const sorted = [...questions].sort((a, b) => Number(isNew(b)) - Number(isNew(a)) || b.createdAt - a.createdAt);

  return <section className={styles.panel} id="your-qa" aria-label="Your questions">
    <button type="button" className={styles.heading} aria-expanded={open} aria-controls="your-qa-list" onClick={() => setExpanded(!open)}>
      <Icon name="message" size={15} />
      <span className={styles.label}>Questions</span>
      <span className={unread ? styles.ready : styles.summary} role="status">{summary}</span>
      <span className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}><Icon name="chevron" size={14} /></span>
    </button>
    <div id="your-qa-list" hidden={!open} className={styles.list}>
      <div className={styles.rows}>
        {sorted.map(item => <div className={styles.row} key={item.id}>
          {item.status === 'answered'
            ? <Link href={qaPath(item.id)} prefetch={false} className={styles.answer}>
              <span className={styles.question}>{item.question}</span>
              <span className={isNew(item) ? styles.newAnswer : styles.read}>{isNew(item) ? 'New reply' : 'View reply'}<Icon name="arrow" size={13} /></span>
            </Link>
            : <div className={styles.pending}>
              <span className={styles.question}>{item.question}</span>
              <span className={styles.status}>{item.status === 'pending' ? 'Waiting for a reply' : item.status === 'checking' ? 'Checking for a reply…' : 'Status unavailable'}</span>
            </div>}
        </div>)}
      </div>
      <Link href="/qa" className={styles.browse}>Ask a question<Icon name="arrow" size={12} /></Link>
    </div>
  </section>;
}
