# Live user count and analytics

The small green user-count badge appears beneath the homepage/campus introduction. It reads the default Cloud Firestore database in project `fastiflex`. This is a manually maintained total, not an online-user counter and not a Vercel Analytics metric.

## One-time Firebase setup

1. Open [Cloud Firestore for fastiflex](https://console.firebase.google.com/project/fastiflex/firestore). Create the default database if it does not exist.
2. Create collection **siteStats**, document **public**.
3. Add field **userCount**, select type **number**, and enter your real count as a whole number (zero is supported).
4. Open the Rules tab. For a new database dedicated to this site, publish the contents of `firestore.rules`. For an existing database, merge just the `/siteStats/public` match into your reviewed rules; do not overwrite rules required by other apps. Make sure no broader rule grants writes to this document: overlapping Firestore allow rules are additive.
5. Deploy the website once. Future edits to `siteStats/public.userCount` appear automatically on open pages without redeployment.

Only this public aggregate document is intended to be readable. Do not store personal data or secrets in it. The web app never writes to Firestore; edit the number through Firebase Console using your own project access.

While loading, or if the document is missing, invalid, deleted or inaccessible, the badge stays hidden. It never invents a count. A small reserved space prevents content from jumping when the initial count arrives. Whole, nonnegative safe integers are accepted; strings, fractions and negative numbers are hidden.

The Firebase configuration in `lib/firebase.ts` is public web configuration, not an administrative credential. This integration does not initialize Firebase Analytics; the requested analytics integration is Vercel Web Analytics.

## Vercel Analytics

`@vercel/analytics/next` is included once in the root layout, including campus, course and credits pages. In the Vercel project's **Analytics** tab, click **Enable**, deploy, and visit the production site. Check the dashboard after navigating between pages. Ad blockers can prevent analytics events. The package does not require a secret or analytics ID in the source code.

References: [Firestore live listeners](https://firebase.google.com/docs/firestore/query-data/listen), [Firestore rules](https://firebase.google.com/docs/firestore/security/rules-conditions), [Vercel Analytics setup](https://vercel.com/docs/analytics/quickstart).
