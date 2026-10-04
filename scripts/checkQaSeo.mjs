import assert from 'node:assert/strict';
import { campusOptions } from '../lib/campuses.ts';
import { SITE_URL } from '../lib/site-config.ts';

// Read-only checks against a production server. Does not submit questions.
const base = process.argv.find(arg => /^https?:\/\//.test(arg)) || 'http://localhost:3100';
const indexable = !process.argv.includes('--noindex');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])));
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
async function request(path, options = {}) {
  return fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20000), ...options });
}
async function checkPage(path) {
  const start = performance.now();
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const head = html.split('</head>')[0];
  const metadata = tags(head, 'meta');
  assert.deepEqual(tags(head, 'link').filter(tag => tag.rel === 'canonical').map(tag => tag.href), [`${SITE_URL}${path}`]);
  assert.equal(metadata.find(tag => tag.property === 'og:url')?.content, `${SITE_URL}${path}`);
  assert.ok(metadata.find(tag => tag.property === 'og:image')?.content.startsWith(`${SITE_URL}/qa/opengraph-image`));
  assert.equal(metadata.find(tag => tag.name === 'twitter:card')?.content, 'summary_large_image');
  assert.ok(metadata.find(tag => tag.name === 'twitter:image')?.content.startsWith(`${SITE_URL}/qa/opengraph-image`));
  assert.equal(metadata.find(tag => tag.name === 'robots')?.content.includes('noindex'), !indexable);
  const description = metadata.find(tag => tag.name === 'description')?.content;
  assert.ok(description?.length > 30 && description.length <= 160, `Description length: ${path}`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `Single visible H1: ${path}`);
  assert.ok(!html.includes('schema.org/QAPage'), 'No duplicate/ineligible microdata');
  assert.ok(schemas(html).every(schema => schema['@type'] !== 'QAPage'), 'No ineligible QAPage schema');
  console.log(`PASS ${path}: HTML, metadata, schema, indexing (${Math.round(performance.now() - start)} ms local, ${Buffer.byteLength(html)} bytes HTML)`);
  return { html, metadata, response };
}

const hub = await checkPage('/qa');
const collection = schemas(hub.html).find(schema => schema['@type'] === 'CollectionPage');
assert.ok(collection);
const items = collection.mainEntity.itemListElement;
assert.equal(collection.mainEntity.numberOfItems, items.length);
assert.ok(items.length > 0, 'Published answers must be available for a release');
const titles = new Set();
const descriptions = new Set();
const modified = new Map();
for (const item of items) {
  const path = new URL(item.url).pathname;
  assert.ok(tags(hub.html, 'a').some(link => link.href === path), `Crawlable hub link: ${path}`);
  const { html, metadata } = await checkPage(path);
  const schema = schemas(html).find(value => value['@type'] === 'FAQPage');
  assert.equal(schema.mainEntity.length, 1);
  const question = schema.mainEntity[0];
  assert.equal(question.name, item.name);
  assert.ok(question.acceptedAnswer.text.length > 0);
  assert.equal(question.acceptedAnswer.url, `${item.url}#answer`);
  assert.ok(!('upvoteCount' in question.acceptedAnswer), 'Do not invent votes');
  assert.ok(!('author' in question.acceptedAnswer), 'Do not invent authors');
  assert.ok(html.includes('id="answer"'));
  // The whole answer must be in the initial HTML, not just the RSC payload.
  const body = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  for (const paragraph of question.acceptedAnswer.text.split(/\r?\n\s*\r?\n/).filter(Boolean)) {
    assert.ok(decode(body).includes(paragraph), `Server-rendered answer text: ${path}`);
  }
  const breadcrumb = schemas(html).find(value => value['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement.at(-1).item, item.url);
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.ok(tags(html, 'a').filter(link => link.href?.startsWith('/qa/') && link.href !== path).length >= Math.min(3, items.length - 1));
  titles.add(decode(html.match(/<title>(.*?)<\/title>/)?.[1] ?? ''));
  descriptions.add(metadata.find(tag => tag.name === 'description')?.content);
  if (schema.dateModified) {
    assert.ok(Number.isFinite(Date.parse(schema.dateModified)));
    assert.ok(tags(html, 'time').some(time => time.dateTime === schema.dateModified || time.datetime === schema.dateModified));
    modified.set(item.url, schema.dateModified);
  }
  assert.ok(!metadata.some(tag => tag.property === 'article:published_time'), 'No invented answer publication dates');
}
assert.equal(titles.size, items.length);
assert.equal(descriptions.size, items.length);

const sitemapResponse = await request('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const entries = [...sitemap.matchAll(/<url>(.*?)<\/url>/gs)].map(match => ({
  url: decode(match[1].match(/<loc>(.*?)<\/loc>/)?.[1] ?? ''),
  updated: match[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
}));
const existingPaths = ['/', '/dashboard', '/credits', '/motivation', ...campusOptions.map(campus => `/campus/${campus.slug}`)];
const expected = indexable ? [...existingPaths.map(path => new URL(path, SITE_URL).href), `${SITE_URL}/qa`, ...items.map(item => item.url)] : [];
assert.deepEqual(entries.map(entry => entry.url).sort(), expected.sort(), 'Existing sitemap URLs preserved and every published Q&A included');
for (const entry of entries) {
  if (modified.has(entry.url)) assert.equal(entry.updated, modified.get(entry.url));
  else assert.equal(entry.updated, undefined, 'No fabricated timestamps');
}
const missing = await request('/qa/qa-seo-check-missing-document');
assert.equal(missing.status, 404, 'Actual 404 status for missing/unpublished questions');
assert.ok((await missing.text()).includes('noindex'));
for (const suffix of ['?utm_source=qa-check', '?page=2', '?q=attendance']) {
  const query = await request(`/qa${suffix}`);
  assert.equal(tags(await query.text(), 'link').find(tag => tag.rel === 'canonical')?.href, `${SITE_URL}/qa`);
}
const bot = await request(new URL(items[0].url).pathname, { headers: { 'User-Agent': 'Googlebot' } });
assert.equal(bot.status, 200);
assert.ok((await bot.text()).split('</head>')[0].includes('rel="canonical"'));
const imageResponse = await request('/qa/opengraph-image');
assert.equal(imageResponse.status, 200);
assert.ok(imageResponse.headers.get('content-type')?.includes('image/png'));
const image = Buffer.from(await imageResponse.arrayBuffer());
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log(`PASS ${items.length} published answers: unique metadata, sitemap dates, unchanged existing sitemap entries, 404, query canonicals, Googlebot and 1200×630 social image`);
