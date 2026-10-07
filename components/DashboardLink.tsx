'use client';

import Link from 'next/link';
import Icon from './Icon';
import { useQAUpdates } from './QAUpdatesProvider';
import styles from './QAStatus.module.css';

export default function DashboardLink() {
  const { unread } = useQAUpdates();
  const message = unread ? `${unread} new ${unread === 1 ? 'reply' : 'replies'}` : '';
  return <Link href={unread ? '/dashboard#your-qa' : '/dashboard'} className={`dashboard-entry${unread ? ` ${styles.navUnread}` : ''}`} title={message || undefined} aria-label={unread ? `My dashboard, ${message}` : undefined}>
    <Icon name={unread ? 'message' : 'bookmark'} size={16} />
    <span className={styles.navLabel}>{unread ? message : 'My dashboard'}</span>
  </Link>;
}
