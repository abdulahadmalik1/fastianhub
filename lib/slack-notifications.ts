import { SITE_NAME } from './site-config';

export type PageEvent = { type: 'view'; page: string; timestamp: number };

const eventTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi',
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function slackPayload(event: PageEvent) {
  const time = `${eventTime.format(event.timestamp)} PKT`;
  const text = `Website activity\nProject: ${SITE_NAME}\nEvent type: Page view\nPage: ${event.page}\nTime: ${time}`;
  return {
    text,
    // Plain text prevents paths from injecting Slack mentions or formatting.
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '👀 Website activity', emoji: true } },
      { type: 'section', fields: [
        { type: 'plain_text', text: `Project: ${SITE_NAME}` },
        { type: 'plain_text', text: 'Event type: Page view' },
      ] },
      { type: 'section', text: { type: 'plain_text', text: `Page: ${event.page}\nTime: ${time}` } },
    ],
    unfurl_links: false,
    unfurl_media: false,
  };
}

export async function sendSlackPageEvent(webhook: string, event: PageEvent) {
  const deadline = Date.now() + 45_000;
  for (let attempt = 0; attempt < 3; attempt++) {
    let delay = 1000 * 2 ** attempt;
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload(event)),
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
      if (response.ok) return;
      if (response.status !== 429 && response.status < 500) {
        console.error('Slack page notification rejected:', response.status);
        return;
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      if (response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
        delay = Math.max(delay, retryAfter * 1000);
      }
    } catch {
      // Never log the exception: fetch errors may contain the secret webhook URL.
    }
    if (attempt === 2 || Date.now() + delay + 8000 > deadline) break;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('Slack page notification failed after bounded retries.');
}
