'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_KEY = 'fastianhub_last_page_view';
const SESSION_TIMEOUT = 30 * 60 * 1000;

export default function SlackPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const lastLocation = useRef<string | null>(null);
  const lastView = useRef(0);

  useEffect(() => {
    function track() {
      const now = Date.now();
      let previous = lastView.current;
      try {
        previous = Number(localStorage.getItem(SESSION_KEY)) || previous;
        localStorage.setItem(SESSION_KEY, String(now));
      } catch { /* Tracking still works when storage is unavailable. */ }
      lastView.current = now;
      const body = JSON.stringify({
        type: !previous || now - previous >= SESSION_TIMEOUT ? 'visit' : 'view',
        page: window.location.pathname,
      });
      // Keep the request alive during navigation without waiting for Slack.
      void fetch('/api/slack/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => { /* Network failures must never affect navigation. */ });
    }

    // Suppress React's repeated effect setup, not genuine repeat page views.
    if (lastLocation.current !== locationKey) {
      lastLocation.current = locationKey;
      track();
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) track();
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [locationKey]);

  return null;
}
