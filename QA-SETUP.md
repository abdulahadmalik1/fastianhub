# Anonymous Q&A

Run `npm run dev` and visit `http://localhost:3000/qa`. The page reuses the existing `fastiflex` Firestore connection. No signup or additional app configuration is needed.

## One-time Firestore setup

1. Open [Firestore for fastiflex](https://console.firebase.google.com/project/fastiflex/firestore).
2. In **Rules**, merge only the `match /questions/{questionId}` block from `firestore.rules` inside your existing `match /databases/{database}/documents` block, then publish. Preserve all other deployed collection rules. Check that no broader existing allow rule grants access to unanswered questions or edits to questions: Firestore allow rules are additive.
3. Publish the rules, then run `node scripts/seedQuestions.mjs` with an owner OAuth access token in `FIRESTORE_ACCESS_TOKEN`. The script reads the five exact records from `fastiflex_qa_seeds_rewritten.json`, creates missing records, and preserves existing documents by default. Do not put that token in source files or a `NEXT_PUBLIC_` variable. The existing public Firebase API key is not an admin credential and cannot publish rules or create answered documents.

To intentionally remove every existing `questions` document and replace the collection with only those five records, run `node scripts/seedQuestions.mjs --replace`. This is destructive and requires the owner token. Verify the target project and collection before using it.

## Answering questions

Edit a question's **answer** string in Firebase Console. Once it contains text, the entry becomes eligible for `/qa`, its individual `/qa/[id]` page, and `/sitemap.xml`. Clear it to hide the entry again. Pages and data revalidate hourly, on the next request; the first request may receive the cached version while it refreshes. Publishing and hiding are not instantaneous. Entries sort by `createdAt`, newest first; answering does not change their original submission date. Displayed update dates and sitemap `lastmod` use Firestore's automatic document `updateTime`.

The public form stores only `question`, an empty `answer`, and a server timestamp. Questions are limited to 500 characters in both the form and Firestore rules. The hidden honeypot discards filled submissions without saving anything. It deters simple form bots, but is not server-side rate limiting.

The server uses Firestore REST `runQuery` with `answer > ''`, matching the read rule. Unanswered questions are never fetched. The hub, individual pages and sitemap share this cached query. No composite index, admin dashboard, or new authentication is needed. Data failures throw instead of publishing empty lists or false 404s; ISR retains the last successful content on revalidation errors. A first build without working data access fails visibly. The browser loads Firebase only when submitting a valid question.

Existing non-Q&A pages, functionality, canonical URLs and sitemap entries are preserved. The sitemap adds Q&A URLs automatically. Preview deployments inherit the existing noindex policy. Answers use safe FAQPage and breadcrumb JSON-LD; QAPage markup is ineligible because visitors cannot submit alternative answers. No votes, answer publication dates or author identities are invented. FAQPage markup does not promise a Google rich result or a ranking.

## Release verification

- `node scripts/checkQaData.mjs`: isolated query, outage, timestamp and JSON-LD checks; no live writes.
- `node node_modules/next/dist/bin/next build`: production build, including all currently answered pages.
- Start the production server, then run `node scripts/checkQaSeo.mjs http://localhost:3100` (use its actual port). Add `--noindex` when checking a preview build.
- Before release, publish only the restrictive Q&A rules block as described above and check for broader overlapping allow rules. On 4 October 2026 the live API accepted an unfiltered collection read, which the repository's intended Q&A rules deny. The code audit did not publish Firestore rules or write test questions to production.
- After deployment, submit the existing `/sitemap.xml` in Search Console and inspect `/qa` and an answer URL. Check real-user Core Web Vitals after traffic arrives; local timings cannot establish production rankings or field performance.

Read-only production SEO checks passed for the hub and all five published answers, including complete server-rendered text, unique metadata, canonical URLs, correct sitemap dates, social images, Googlebot HTML and a genuine missing-page 404. Production build, Q&A lint, data checks, preview noindex, and mobile/desktop layout checks passed. The Firebase chunk is deferred from the initial Q&A load (about 175.7 kB gzip in the audited build).

References: [Firestore query rules](https://firebase.google.com/docs/firestore/security/rules-query), [Firestore queries](https://firebase.google.com/docs/firestore/query-data/queries).
