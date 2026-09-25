# FastianHub production SEO

Canonical domain: **https://fastianhub.com**.

## Local validation completed

- Production build and TypeScript checks passed; ESLint passed.
- All six canonical pages, campus-specific initial rendering, JSON-LD, Open Graph/Twitter metadata, sitemap, robots rules, alias/www redirects and unknown-campus 404 behavior passed automated HTTP checks.
- A separate non-indexable build passed the staging checks; the final build was restored to production indexing.
- Real PDF previews and downloads passed for one sample from each of the four campuses.
- Browser checks confirmed campus switching, search, semester filtering, course drawers and saved-course persistence. A Lahore landing URL correctly took precedence over a saved Karachi preference.
- The visible browser markup and CSS were preserved. External form submissions were not sent, and public-domain DNS, HTTPS, Search Console ownership and indexing must be verified after deployment.

## Build and verify

Use Node.js 22.18+ (or Node.js 24 LTS) so the SEO verification script can load the shared TypeScript configuration. Next.js itself requires Node.js 20.9+.

```sh
npm ci
npm run lint
npm run build
npm start
```

In another terminal:

```sh
npm run check:seo
# Use a different port or check the deployed site:
npm run check:seo -- https://fastianhub.com
# Also fetch a small real PDF in preview/download mode from each campus:
npm run check:seo -- https://fastianhub.com --papers
```

The build refreshes the archive using the existing pipeline. If GitHub is unreachable, it uses the checked-in snapshot/caches. Review build warnings; a successful fallback does not mean new papers were fetched.

## Hosting settings before launch

- Deploy as a Next.js app with a Node.js/serverless runtime. Static-only hosting cannot serve the existing `/api/papers` proxy.
- Connect `fastianhub.com` and `www.fastianhub.com`, enable HTTPS, and set the apex domain as primary. The app permanently redirects www to the apex. Configure HTTP-to-HTTPS redirects at the host/CDN.
- Production is indexable by default. Leave `SITE_INDEXABLE` unset or set it to `true` on production. Set `SITE_INDEXABLE=false` on non-Vercel staging hosts. Development and Vercel previews are always non-indexable, including when the override is accidentally true.
- These settings and verification tags are evaluated **at build time**. Rebuild after changing them; do not promote a preview-built artifact directly to production.
- Optional: set `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` to your real verification tokens before building. DNS verification is also available; no invented tokens are included.
- The host must allow the existing GitHub/raw.githubusercontent.com requests. Confirm that the existing Formspree endpoint accepts submissions from the production domain.
- Keep preview deployments behind host authentication when possible. `robots.txt` and `noindex` are search controls, not access controls.

## After the domain is live

1. Verify the domain in [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Submit `https://fastianhub.com/sitemap.xml` to both. The sitemap currently contains the homepage, credits, and the four campus pages.
3. Run the production SEO check above. Inspect the homepage and each campus URL in Search Console; request indexing and verify Google can render them.
4. Check one paper preview and download from each campus, bookmark persistence, search, filters, and the two existing submission forms. Form submissions require an intentional manual test because they send a message to the owner.
5. Monitor indexing, campus query impressions/clicks, and field Core Web Vitals after traffic arrives. Search visibility requires ongoing useful archives and relevant links; technical SEO cannot promise a position or permanent immunity to search changes.

## Campus URLs and maintenance

| Campus | Canonical path |
| --- | --- |
| Islamabad | `/campus/islamabad` |
| Karachi | `/campus/karachi` |
| Lahore | `/campus/lahore` |
| Chiniot-Faisalabad / CFD | `/campus/chiniot-faisalabad` |

These URLs use the existing browser UI with the named campus selected on the server. A stored preference cannot replace the campus on initial arrival from search. The homepage continues to restore the saved campus. Search, filters, bookmarks, course drawers and file actions keep their existing behavior.

The sitemap and selector share `lib/campuses.ts`. Add a campus only after its real archive is available, then rebuild and run the checks. Do not add unsupported campuses, empty course pages, filter combinations, legacy aliases or individual proxy downloads to the sitemap. Campus discovery currently uses the sitemap because the existing campus selector is not a set of HTML navigation links; no new navigation UI has been added.

Search titles/descriptions target FAST NUCES past papers, campus names, sessionals, finals, quizzes and course resources. Structured data identifies the site and actual collection pages without claiming official university ownership. There are no hidden keyword blocks, fabricated reviews, unsupported search actions or meta-keyword stuffing. Individual courses remain in the existing interactive drawers; ranking separate course pages would require a future navigation/content change.

Sitemaps omit `lastmod` because the archive's generation timestamp changes even when content does not. Introduce modification dates only when they track real content changes. API responses use `X-Robots-Tag: noindex, nofollow` while remaining accessible for previews and downloads.

To validate staging, build with `SITE_INDEXABLE=false`, start that build, and run `npm run check:seo -- --noindex`. Rebuild with production settings before release.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [site names](https://developers.google.com/search/docs/appearance/site-names), and the installed Next.js documentation in `node_modules/next/dist/docs/`.
