'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function SlackPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const lastLocation = useRef<string | null>(null);

  useEffect(() => {
    function track() {
      const body = JSON.stringify({
        type: 'view',
        page: window.location.pathname,
        timestamp: Date.now(),
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
