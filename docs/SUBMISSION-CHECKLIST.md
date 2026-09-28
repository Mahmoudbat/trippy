# Competition submission checklist

The owner supplied the competition constraints. Compare against the official rubric when available.

## Required before calling the submission complete

- [ ] Firebase project created under the owner's account.
- [ ] Public web configuration recorded; email/password authentication enabled.
- [ ] Firestore production database created, restrictive rules deployed, catalog seeded.
- [ ] Firebase Hosting deployed, actual HTTPS URL added to README.
- [ ] Live sign-up/sign-in/sign-out and password-reset flows verified.
- [ ] Favorites, visit dates and memories persist across two signed-in sessions.
- [ ] Account B cannot read/write account A's journal. Anonymous users cannot write places or admin roles.
- [ ] Invalid/oversized entries rejected by Firestore rules; ordinary users cannot seed the catalog.
- [ ] Test output recorded, mobile/desktop browser checks completed and screenshots attached.
- [ ] Verify remaining destination photos, content and approximate coordinates; retain license credits.
- [ ] Repository pushed to GitHub without credentials or original prohibited framework files.
- [ ] Competition documentation, feature list and demo match this actual implementation.

## Judge demonstration (about four minutes)

1. Open the public Hosting URL on a phone-sized screen. Show navigation and the original desert visual identity.
2. Search `البتراء`; open Petra. Show facts, attribution, full photo and a working map link.
3. Combine northern region and Culture filters; reset and show that the full catalog returns.
4. Open Hidden Jordan, choose a hidden gem and save it. Mark a place visited, add a date and memory.
5. Open a curated experience, follow a route stop and save the route's places.
6. Open the interactive map, filter a category and select a numbered pin/list entry.
7. Open My Journey; show actual progress, earned achievements and private memories.
8. Reload and verify persistence. Sign in on a second session and show the same cloud journal.
9. Show the repository's plain HTML/CSS/JS files, Firebase rules, README and audit.

## Browser regression checks

- [ ] 360 px phone, 768 px tablet, 1,440 px desktop: no horizontal overflow; readable text and controls.
- [ ] Keyboard: skip link, navigation, filters, cards, dialogs, Escape and focus return.
- [ ] Back/Forward, direct destination URL, unknown route and reload.
- [ ] Search empty state, Arabic search, score filter with unrated locations, complete reset.
- [ ] Geolocation granted, denied and unavailable; no claim of road distance.
- [ ] Blocked storage and failed cloud requests produce clear errors, not success feedback.
- [ ] Slow/offline loading and broken photo fallback remain understandable.
- [ ] Account A/B isolation, sign-out privacy, guest-copy collision handling.
- [ ] Reduced-motion setting disables decorative transitions.

## Useful submission narrative

“We preserved the seven-view discovery concept, rebuilt the React prototype using only permitted technologies, and connected destination discovery to a real personal travel journal. Firebase handles identity, private storage and hosting; native browser APIs handle the interaction.”

Use that wording only after Firebase deployment and verification are complete. Until then, describe the cloud integration as implemented but awaiting configuration and live testing.
