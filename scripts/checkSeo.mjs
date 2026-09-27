import assert from 'node:assert/strict';
import { get } from 'node:http';
import { readFileSync } from 'node:fs';
import { campusOptions } from '../lib/campuses.ts';
import { isSiteIndexable, SITE_URL } from '../lib/site-config.ts';

// Node 22.18+ supports the shared TypeScript configuration without a test dependency.
// Run against npm start, or pass the public deployment URL after release.
const base = process.argv.find(arg => /^https?:\/\//.test(arg)) || 'http://localhost:3000';
const indexable = !process.argv.includes('--noindex');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])));

async function request(path, options = {}) {
  return fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(15000), ...options });
}

// Preview guards take precedence over an explicit true setting.
assert.equal(isSiteIndexable({ NODE_ENV: 'development', SITE_INDEXABLE: 'true' }), false);
assert.equal(isSiteIndexable({ NODE_ENV: 'production', VERCEL_ENV: 'preview', SITE_INDEXABLE: 'true' }), false);
assert.equal(isSiteIndexable({ NODE_ENV: 'production', VERCEL_ENV: 'production' }), true);
assert.equal(isSiteIndexable({ NODE_ENV: 'production', SITE_INDEXABLE: 'false' }), false);
assert.equal(isSiteIndexable({ NODE_ENV: 'production' }), true);

const routes = ['/', '/credits', '/motivation', ...campusOptions.map(campus => `/campus/${campus.slug}`)];
const titles = new Set();
const descriptions = new Set();
for (const path of routes) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const head = html.split('</head>')[0];
  const meta = tags(head, 'meta');
  const canonicals = tags(head, 'link').filter(tag => tag.rel === 'canonical');
  const canonical = new URL(path, SITE_URL).href;
  assert.deepEqual(canonicals.map(tag => new URL(tag.href).href), [canonical], `Canonical: ${path}`);
  const title = decode(head.match(/<title>(.*?)<\/title>/)?.[1] || '');
  const description = meta.find(tag => tag.name === 'description')?.content;
  assert.ok(title.includes('FastianHub') && title.length < 90, `Title: ${path}`);
  assert.ok(description?.length > 50, `Description: ${path}`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(new URL(meta.find(tag => tag.property === 'og:url')?.content).href, canonical);
  assert.equal(meta.find(tag => tag.property === 'og:title')?.content, title);
  assert.equal(meta.find(tag => tag.name === 'twitter:card')?.content, 'summary_large_image');
  const ogImage = meta.find(tag => tag.property === 'og:image')?.content;
  assert.ok(ogImage?.startsWith(`${SITE_URL}/opengraph-image`));
  const robots = meta.find(tag => tag.name === 'robots')?.content || '';
  assert.equal(robots.includes('noindex'), !indexable, `Robots: ${path}`);
  assert.equal(response.headers.get('x-robots-tag')?.includes('noindex') || false, !indexable);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `One original H1: ${path}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  if (path !== '/credits' && path !== '/motivation') {
    assert.equal(schemas.find(schema => schema['@type'] === 'CollectionPage')?.url, canonical);
    assert.equal([...html.matchAll(/<article class="course-card">/g)].length, 12, `Prerendered courses: ${path}`);
  }
  if (path === '/') assert.equal(schemas.find(schema => schema['@type'] === 'WebSite')?.name, 'FastianHub');
  if (path === '/') assert.ok(html.includes('href="/motivation"'), 'Crawlable footer link to our motivation');
  if (path === '/motivation') {
    assert.equal(schemas.find(schema => schema['@type'] === 'AboutPage')?.url, canonical);
    assert.ok(html.includes('Looking for wondar.site past papers?'), 'Visible story content');
    assert.ok(tags(html, 'a').some(link => link.href === '/' && link.class?.split(' ').includes('primary-button')), 'Return to the papers browser');
    for (const campus of campusOptions) assert.ok(html.includes(`href="/campus/${campus.slug}"`), `Working campus path: ${campus.slug}`);
  }
  const campus = campusOptions.find(campus => path === `/campus/${campus.slug}`);
  if (campus) {
    assert.ok(html.includes(`<option value="${campus.id}" selected="">`), `Initial campus: ${path}`);
    assert.ok(title.includes(campus.searchName));
  }
  console.log(`PASS ${path}: metadata, canonical, indexing and server-rendered content`);
}
assert.equal(titles.size, routes.length, 'Unique titles');
assert.equal(descriptions.size, routes.length, 'Unique descriptions');

const sitemapResponse = await request('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
assert.ok(sitemapResponse.headers.get('content-type')?.includes('xml'));
const sitemap = await sitemapResponse.text();
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
assert.deepEqual(locations.sort(), (indexable ? routes.map(path => new URL(path, SITE_URL).href) : []).sort());
assert.ok(!sitemap.includes('<lastmod>'), 'Do not invent modification dates');

const robotsResponse = await request('/robots.txt');
assert.equal(robotsResponse.status, 200);
const robots = await robotsResponse.text();
assert.ok(indexable ? robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`) && robots.includes('Allow: /') && !robots.includes('Disallow: /') : robots.includes('Disallow: /') && !robots.includes('Sitemap:'));

const imageResponse = await request('/opengraph-image');
assert.equal(imageResponse.status, 200);
assert.ok(imageResponse.headers.get('content-type')?.includes('image/png'));
const png = Buffer.from(await imageResponse.arrayBuffer());
assert.equal(png.subarray(1, 4).toString(), 'PNG');
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);

for (const [path, destination] of Object.entries({ '/contributors': '/credits', '/past-papers': '/', '/pastpapers': '/', '/campus/cfd': '/campus/chiniot-faisalabad', '/campus/faisalabad': '/campus/chiniot-faisalabad', '/campus/central': '/campus/lahore' })) {
  const response = await request(`${path}?utm_source=seo-check`);
  assert.equal(response.status, 308, path);
  const location = new URL(response.headers.get('location'), base);
  assert.equal(location.pathname, destination);
  assert.equal(location.searchParams.get('utm_source'), 'seo-check');
}
// Verify the www redirect locally without requiring production DNS.
if (new URL(base).hostname === 'localhost' || new URL(base).hostname === '127.0.0.1') {
  // Fetch normalizes Host; use HTTP for this virtual-host check.
  const response = await new Promise((resolve, reject) => {
    get(new URL('/credits?utm_source=seo-check', base), { headers: { host: 'www.fastianhub.com' }, timeout: 15000 }, response => {
      response.resume();
      resolve(response);
    }).on('error', reject).on('timeout', function () { this.destroy(new Error('www redirect timed out')); });
  });
  assert.equal(response.statusCode, 308);
  assert.equal(response.headers.location, `${SITE_URL}/credits?utm_source=seo-check`);
}
const unknown = await request('/campus/not-a-campus');
assert.equal(unknown.status, 404);
assert.ok((await unknown.text()).includes('noindex'));
const api = await request('/api/papers');
assert.equal(api.status, 400, 'Original missing-path API response');
assert.ok(api.headers.get('x-robots-tag')?.includes('noindex'));
const queryPage = await request('/?utm_source=seo-check');
assert.equal(new URL(tags(await queryPage.text(), 'link').find(tag => tag.rel === 'canonical')?.href).href, `${SITE_URL}/`);
console.log('PASS sitemap, robots, social image, redirects, query canonical, 404 and API indexing');

if (process.argv.includes('--papers')) {
  const archive = JSON.parse(readFileSync(new URL('../data/pastPapers.json', import.meta.url), 'utf8'));
  for (const campus of campusOptions) {
    const files = archive.campuses[campus.id].semesters.flatMap(semester => semester.courses.flatMap(course => course.files));
    const file = files.filter(file => /\.pdf$/i.test(file.path) && file.size > 0).sort((a, b) => a.size - b.size)[0];
    assert.ok(file, `PDF sample for ${campus.id}`);
    for (const download of [false, true]) {
      const query = new URLSearchParams({ source: campus.id, path: file.path, download: String(download) });
      const response = await request(`/api/papers?${query}`);
      assert.equal(response.status, 200, `${campus.id}: ${file.path}`);
      assert.ok(response.headers.get('content-type')?.includes('application/pdf'));
      assert.ok(response.headers.get('content-disposition')?.startsWith(download ? 'attachment;' : 'inline;'));
      assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'));
      assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
    }
    console.log(`PASS ${campus.name}: actual PDF preview and download`);
  }
}
