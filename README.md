# Discover Jordan

**Beyond the famous places.** A vanilla tourism field guide and personal travel journal for PixelSite 2.0 Phase 2.

## Delivery status

The website is connected and deployed through the Firebase project `discover-jordan-pixelsite`. Firestore, Email/Password Authentication, owner-only security rules, the 27-place cloud catalog and Firebase Hosting are active at **[discover-jordan-pixelsite.web.app](https://discover-jordan-pixelsite.web.app/)**. Automated checks cover private/public trip access, route validation and a real client-generated PDF container. Browser checks verified Arabic RTL, guest preferences, action-triggered sign-in and Arabic PDF generation.

Runtime: **HTML, CSS, JavaScript and Firebase only.** No React, Vue, Angular, Next.js, Tailwind, Vite or custom backend. There is no bundling or build step. Node, Python or the Firebase CLI may be used as local development tools, but none runs as the deployed backend.

## Features

- Optional sign-in: visitors browse immediately. Guest favorites, visits, filters, language and preferences persist in LocalStorage. Account onboarding asks for interests once after the first successful login and remains editable later. Cloud save, sync and share prompt for sign-in only at the action.
- Every place includes practical-information fields under `practical`: entryPrice, openingHours, bestTime, publicTransport, privateCar, tips, sourceUrl, optional priceSourceUrl and verification. Published prices link to their sources; unavailable information is marked unverified. Confirm current access before travel.
- For You downloads `discover-jordan-itinerary.pdf` directly in the browser. Each PDF includes the site, trip length, days, place names, descriptions and areas; Arabic is rendered RTL through Canvas before being embedded in the PDF. It also offers private saved trips, public links, retrieval and revocation.
- The itinerary ranks matches, groups each day within one geographic region, caps estimated within-day driving near three hours, orders stops by proximity and sequences region groups in one direction to reduce backtracking. Haversine distance × 1.35 and 50 km/h remain clearly labeled planning estimates.
- EN/AR switching is stored locally. Arabic uses Cairo, sets `lang`/`dir`, mirrors directional layout and supplies Arabic place names, descriptions, visit guidance, planner, map, journey and PDF content.

### Trip storage and verification

Private routes: `users/{uid}/trips/{id}`. Public snapshots: `sharedPlans/{id}`. Rules allow only owners to write, disallow public listing, and limit route payloads. Deleting a saved trip revokes its corresponding share. Guest sync merges favorites/visits and keeps existing account memories, then copies the device's guest preferences. Guest and account journals remain separate.

Run `node --test tests/*.test.mjs` for catalog, filtering, profile, route and snapshot checks. Before competition submission, test authenticated save/share/revoke and cross-account denial with two user-owned test accounts. No new framework or paid routing API is required.

- All seven original views: Home, Explore, Destination Details, Hidden Jordan, Jordan Experiences, Map and My Journey.
- 27 unified destinations, five categories, three regions, four curated experiences and original optional stops.
- English/Arabic search, combined filters, guide-score filter, visited/saved filters, sorting and optional 50/100 km distance filters.
- Shareable hash routes, reload support and browser Back/Forward.
- Favorites, visited places, editable dates, private memories, earned achievements, region progress and JSON journal export.
- Interest onboarding and a transparent smart planner that ranks matching places and groups nearby stops into a personalized 1–7 day itinerary.
- Guest local storage; Firebase email/password accounts and per-user Firestore journals after setup.
- Framework-free interactive SVG orientation map and Google Maps links.
- Mobile-first layouts, semantic controls, keyboard focus, native dialogs, reduced-motion support, loading and error states.
- Admin-only seed tool; trusted catalog editing through Firebase Console.

Scores are **demo editorial data from the original design**, not real user reviews. Map positions are approximate. Some locations use labeled illustrations pending verified photos. See the credits and audit before submission.

## Quick local preview

Serve `public/` using any static web server. Do not double-click `index.html`: browser module and JSON loading require HTTP.

Example with Python (development only):

```sh
python -m http.server 5173 --bind 127.0.0.1 --directory public
```

Open `http://127.0.0.1:5173`. Browsing and the guest journal work without Firebase. The top status strip explicitly identifies this mode.

## Firebase setup and deployment

1. The Firebase project and Web app are registered as `discover-jordan-pixelsite`.
2. The project's **public web configuration** is connected in `public/js/config.js`. Never replace it with an Admin SDK service-account key.
3. In Authentication → Sign-in method, enable **Email/Password**. Configure an appropriate password policy. Add your actual production domains under authorized domains. Add `localhost` and `127.0.0.1` only if needed for local cloud tests.
4. Create a **Cloud Firestore Standard** database in production mode. Choose a location appropriate to the owner/audience before creating it; location selection is a project decision.
5. Install the official [Firebase CLI](https://firebase.google.com/docs/cli). Its Node runtime is deployment tooling, not a Node backend for this project.
6. From this project folder, log in, select the project and deploy:

```sh
firebase login
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

The supplied `firebase.json` already points Hosting at `public/`. Do not overwrite it by accepting a generated index page. Hosting serves static files over HTTPS. Hash routes do not require SPA rewrites.

7. Open the printed Hosting URL. Create your admin user's account using the website. Copy that user's UID from Authentication → Users. In Firestore Console create `admins/USER_UID` with `active: true` (boolean). Client users cannot grant themselves this role.
8. Open `/admin.html` on the same site and sign in. Click **Add missing catalog places**. It creates missing `places/{id}` documents and preserves existing data. Return to the home page and reload; the preview/cloud-catalog warning should disappear.
9. Edit tourism records in Firestore Console as needed. Keep the documented schema and stable IDs. New cloud records appear after reload. New bundled places or experiences require updating `public/data/catalog.json` and redeploying.
10. Test sign-up, sign-in, sign-out, password reset, favorites, visits and private memories. Use a second browser session to verify cloud persistence. Test two different accounts for isolation. The deployed URL is `https://discover-jordan-pixelsite.web.app/`.

On default `*.web.app` / `*.firebaseapp.com` Hosting domains, the app can discover Firebase's `/__/firebase/init.json` automatically. Explicit configuration is still needed for local cloud use and custom domains. Configuration identifies a project; **Firestore Security Rules enforce access**.

Images ship with Hosting, so Cloud Storage is not needed. No user image uploads, Cloud Functions, paid API keys, booking or payment services are used.

## Data and security

| Path | Read | Write |
|---|---|---|
| `places/{placeId}` | Public | Authenticated admin; validated fields |
| `users/{uid}/journey/{placeId}` | Owner only | Owner only; known place, field/type/length validation, server timestamp |
| `users/{uid}/profile/preferences` | Owner only | Owner only; validated interests, trip length, pace and region |
| `admins/{uid}` | The account can read its own role | Firebase Console / trusted administrator only |
| Everything else | Denied | Denied |

Each journey entry has `favorite`, `visited`, `visitedAt` (`YYYY-MM-DD` or empty), `memory` (max 2,000 characters) and server-generated `updatedAt`. Guest entries and account entries are separate. The explicit account action copies guest-only entries and never overwrites existing account entries. Sign-out returns to the guest journal. Signing in does not automatically upload guest memories.

The site escapes dynamic text and validates destination data/URLs before rendering. Hosting adds security headers. Do not publish secrets or weaken rules to `allow read, write: if true` to fix setup errors.

## Tests

Run the framework-free domain tests with Node 20+ as a development tool:

```sh
node --test tests/domain.test.mjs
```

See [test results](docs/TEST-RESULTS.md) for what was actually verified and what remains blocked. Use [the judge checklist](docs/SUBMISSION-CHECKLIST.md) for browser and cloud acceptance testing. These unit tests do not prove that deployed Firestore rules work; rules must be tested against an emulator or live test project before submission.

## Project structure

```text
public/
  index.html              Semantic shell and account dialogs
  admin.html              Authenticated catalog seed interface
  css/styles.css          Responsive styles and motion preferences
  js/app.js               Routing, views and event handling
  js/startup.js           Startup errors and direct-file guidance
  js/domain.js            Search, filtering, validation and achievements
  js/journey.js           Guest storage and date helpers
  js/firebase.js          Firebase Auth / Firestore service boundary
  js/config.js            Public web app configuration
  js/admin.js             Admin seeding controller
  data/catalog.json       Bundled places and curated experiences
  assets/                 Local photographs and original SVG artwork
docs/                     Audit, design, credits, test and submission notes
tests/domain.test.mjs      Business-logic and data-integrity tests
firebase.json             Hosting headers and deployment paths
firestore.rules           Owner/admin access controls
firestore.indexes.json    Index configuration
```

## GitHub submission

Create a repository for this folder, then push it. Avoid accidentally committing the original React export or scratch files:

```sh
git init
git add .
git commit -m "Build Discover Jordan with vanilla JavaScript and Firebase"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Include the public Firebase Hosting URL, repository URL, a short screen recording, responsive screenshots, credits and documentation. There are no production package dependencies to install. Preserve photo attribution and license notices. Do not apply a blanket source-code license to third-party photography.

## References

- [Firebase web CDN modules](https://firebase.google.com/docs/web/alt-setup)
- [Firebase Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart)
- [Firestore security conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Original-project audit](docs/PROJECT-AUDIT.md)
- [Design and behavior specification](docs/DESIGN-AND-FLOWS.md)
- [Photography credits](docs/IMAGE-CREDITS.md)
