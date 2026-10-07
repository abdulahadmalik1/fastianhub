'use client';

import { useEffect } from 'react';
import { useQAUpdates } from './QAUpdatesProvider';

export default function QAAnswerRead({ id, version }: { id: string; version: string }) {
  const { markRead } = useQAUpdates();
  // This mounts only once an actual answer renders, never on link prefetch or a 404.
  useEffect(() => { markRead(id, version); }, [id, version, markRead]);
  return null;
}
