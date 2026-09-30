# Google sign-in and personal dashboard

The new `/dashboard` page lets students sign up or sign in with Google, choose courses from any supported campus, and filter their combined materials. Selections support up to 50 underlying campus collections. Existing public-page metadata, canonical URLs, sitemap, and robots configuration are unchanged. The dashboard's public sign-in page has its own production-indexable metadata, canonical URL, social previews, and structured data; development and preview deployments remain `noindex`. Personal course selections still require authentication.

## Firebase setup

The app reuses the existing `fastiflex` Firebase web configuration. No client secret or service-account key is needed.

1. Enable **Authentication → Sign-in method → Google** (already confirmed enabled).
2. In **Authentication → Settings → Authorized domains**, add `localhost` for local testing and the exact public hostname, such as `fastianhub.com`, for production. Include any preview hostname you intend to test. Enter hostnames, without a protocol or port.
3. In **Firestore Database → Rules**, publish the `studentDashboards` rule from `firestore.rules` alongside your current rules. Keep the existing `siteStats/public` rule. If other applications share this database, preserve their rules too; do not replace them blindly.

Until the dashboard rules are published, Google sign-in can work but the course list will show an access error. The UI will not claim to have saved data when Firebase rejects a write.

## Stored data and account behavior

- One private document per student: `studentDashboards/{Firebase UID}`.
- Fields: `courseIds` (a list of course identifiers) and `updatedAt` (server timestamp).
- Google Authentication maintains the account identity. The dashboard document does not duplicate names, emails, or photos.
- Course identifiers include campus, semester or outline group, and course title. Course materials come from the existing archive and are not copied into Firestore.
- Changes are saved in a transaction, preserving unrelated course additions or removals made on another device. The dashboard listens for changes while it is open.
- Signing out clears the visible account list. Another account does not inherit it.
- The simple picker starts with **Islamabad** and also offers **All campuses**. Matching course names and explicit common aliases (such as PF / Programming Fundamentals) appear once, and selecting one gathers its matching campus collections. Labs remain separate. Students can narrow by campus and search for a course name; no semester is requested.
- Existing device bookmarks continue to work separately in the public archive.
- Google credentials use Firebase's default browser persistence. Students can use **Sign out** on shared computers.

## Local verification

The `/dashboard-check` and `/dashboard-loading-check` preview routes are available during local development and return 404 in production.

Run the existing development server and open `/dashboard`. Check the signed-out page and Google popup, then complete sign-in yourself. Choose courses from two campuses, save, filter by type and course, reload, and confirm the selection returns. Sign out and check the account's courses disappear. A second browser signed into the same account should receive the saved list.

`node --experimental-strip-types scripts/checkDashboard.mjs` checks course identity, multi-campus filtering, solutions, duplicate handling, selection limits, and concurrent course edits against both fixtures and the real archive. It does not replace the live Firebase sign-in and permissions checks.

References: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Firestore security rules](https://firebase.google.com/docs/firestore/security/rules-conditions).
