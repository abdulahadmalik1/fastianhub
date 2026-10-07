import { after } from 'next/server';
import { sendSlackPageEvent, type PageEvent } from '@/lib/slack-notifications';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  // Reject cross-origin browser submissions. This is not bot authentication.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return new Response(null, { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > 4096) {
    return new Response(null, { status: 413 });
  }

  let event: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) return new Response(null, { status: 413 });
    event = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!event || typeof event !== 'object' || !('type' in event) || !('page' in event)
    || event.type !== 'view'
    || !('timestamp' in event) || typeof event.timestamp !== 'number'
    || !Number.isFinite(event.timestamp) || event.timestamp <= 0
    || event.timestamp > 8.64e15
    || typeof event.page !== 'string' || !event.page.startsWith('/')
    || event.page.length > 2048 || /[\r\n\u0000-\u001f]/.test(event.page)) {
    return new Response(null, { status: 400 });
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return new Response(null, { status: 503 });
  const pageEvent: PageEvent = { type: event.type, page: event.page, timestamp: event.timestamp };
  after(() => sendSlackPageEvent(webhook, pageEvent));
  return new Response(null, { status: 202 });
}
