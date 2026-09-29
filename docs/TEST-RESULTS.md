# Verification results

Date: 28 September 2026.

## Passed

Command: `node --test tests/domain.test.mjs`

**15 tests passed; 0 failed.**

1. All 27 destination records validate, IDs are unique, and the 12 original destinations plus four hidden stories are preserved.
2. English and Arabic search find the expected places, including Arabic letter normalization.
3. Category, region and visited filters compose correctly.
4. Empty filters restore the full catalog; hidden-gem filtering excludes ordinary places.
5. Unscored locations cannot pass a numeric minimum score.
6. Haversine distance and nearby filtering behave correctly and require a location.
7. Favorites and visited state remain independent.
8. Achievements derive from real visit records and reverse when a visit is removed.
9. Explorer levels use actual thresholds and catalog size.
10. All four experiences reference valid destination IDs in the expected route order.
11. Every referenced local photo exists and includes attribution/license metadata.
12. Text escaping and URL validation reject executable markup/protocols and path traversal.
13. Journey data normalization rejects malformed values and limits memory length.
14. Traveler-profile normalization rejects unsupported values and enforces trip limits.
15. Smart recommendations respond to interests and create unique itinerary stops for every planned day.

Additional checks completed:

- `node --check` on every shipped JavaScript file: no syntax errors.
- The local HTTP server returned `200 OK` with the expected content types for `/`, `/js/app.js`, and `/data/catalog.json`.
- Added `startup.js` to explain direct `file://` opening, report failed module loading and replace an initial loading screen after 15 seconds. The owner confirmed that the site renders when opened at `http://127.0.0.1:5173/`; automated interaction testing remains unavailable.
- All shipped JSON parsed successfully; relative JavaScript imports resolve.
- All 26 referenced destination photographs decode successfully; their contact sheet was inspected. Photos are delivered as local optimized WebP assets with credits and modification notices.
- Al Himma Hot Springs intentionally uses a labeled illustration; its photo remains an editorial task.
- No JSX/TSX, React, Tailwind, Vite, third-party frontend framework or backend application is in the final source folder.
- The static preview server started, but browser access was blocked (see below).

An initial Arabic search test exposed Windows text-decoding corruption during data migration. The import was changed to explicit UTF-8, the catalog regenerated, and the suite then passed.

## Not verified — do not represent as passed

### Browser behavior and visual layout

The deployed desktop site was opened at `https://discover-jordan-pixelsite.web.app/`. The home catalog loaded from Firestore without the fallback warning, the account/preferences dialog rendered, and a Nature + Adventure + Hidden Gems profile generated a three-day route with six unique stops. Phone/tablet layout, complete keyboard journeys, account persistence and browser-console regression checks remain pending.

### Firebase / deployment

Firebase Console initially opened to Google sign-in. Project provisioning could not proceed without the owner's authenticated session. A later console check was also blocked by a saved browser permission setting.

The Firebase project `discover-jordan-pixelsite` is live. Firestore was created, the supplied rules and indexes compiled and deployed, all 27 place documents were seeded, Email/Password Authentication was confirmed enabled, and 40 static files were released through Firebase Hosting. The public URL and key assets returned `200 OK`. Account creation, password reset, cloud journal persistence, rule rejection cases and two-user isolation still require a manual credential-based acceptance test.

## Required follow-up

1. Run the browser regression checklist at phone and tablet widths.
2. Create two test accounts and run isolation, password-reset and multi-session persistence tests.
3. Add the repository URL and final responsive screenshots before submission.
