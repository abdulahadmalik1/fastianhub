import { SITE_NAME } from './site-config';

export type PageEvent = { type: 'view'; page: string; timestamp: number };
export type QuestionEvent = { type: 'question'; project: string; question: string; timestamp: number };

const eventTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi',
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function slackPayload(event: PageEvent) {
  const time = `${eventTime.format(event.timestamp)} PKT`;
  const text = `${SITE_NAME} · Page view\nPage: ${event.page}\n${time}`;
  return {
    text,
    // Plain text prevents paths from injecting Slack mentions or formatting.
    blocks: [{ type: 'section', text: { type: 'plain_text', text, emoji: false } }],
    unfurl_links: false,
    unfurl_media: false,
  };
}

export function slackQuestionPayload(event: QuestionEvent) {
  const time = `${eventTime.format(event.timestamp)} PKT`;
  const question = event.question.replace(/[\r\n]+/g, ' ').trim();
  const text = `${SITE_NAME} · New question\nProject: ${event.project}\nQuestion: ${question}\nSubmitted: ${time}`;
  return { text, blocks: [{ type: 'section', text: { type: 'plain_text', text, emoji: false } }], unfurl_links: false, unfurl_media: false };
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

export async function sendSlackQuestionEvent(webhook: string, event: QuestionEvent) {
  try {
    await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slackQuestionPayload(event)), signal: AbortSignal.timeout(8000), redirect: 'error' });
  } catch { /* Notifications must never affect question submission. */ }
}
