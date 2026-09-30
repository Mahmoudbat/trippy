# Discover Jordan — original project audit

Prepared 28 September 2026 for PixelSite 2.0 Phase 2. Requirements are those supplied by the project owner; no official competition rubric was included. The uploaded ZIP is preserved separately and is not part of the deployable website.

## 1. Current project status

The original is a high-fidelity frontend prototype exported from Figma Make. Its identity is a warm, cinematic travel journal: “Beyond the famous places.” The intended flow is discover → explore → experience → remember, with Culture, Religion, Adventure, Nature and Wellness categories. Preserve this identity rather than adding bookings, payments or a social network.

The archive has 32 files: seven page components, navigation, application entrypoints, a data module, CSS, one design brief and development/export configuration. There are no local photos, separate design files, backend, Firebase configuration, tests or README. The design brief is reference material, not permission to follow its development instructions over the owner's constraints.

**Stack:** React 19, React DOM, TypeScript, Tailwind CSS 4 and Vite 8. The lockfile resolves React 19.2.4, TypeScript 5.9.3 and Tailwind 4.2.2. This does not comply with the supplied HTML/CSS/JavaScript/Firebase-only requirement.

| Original area | Implemented | Gaps or defects |
|---|---|---|
| Home | Cinematic hero, search input, five categories, featured places, CTAs | Search text and category selection never reach Explore. Promotional counts are hardcoded and disagree with the data. |
| Explore | Grid; region, category, rating, hidden-gem and visit filters | Clear filters leaves hidden-gem and search state intact. No distance filter or geolocation. Arabic name not searched. Controls often use clickable divs instead of native inputs. |
| Details | Hero, descriptions, tags, quick facts, related places, Google Maps link, visit toggle | No working gallery, favorite action, durable visit or memory. |
| Hidden Jordan | Four editorial stories | Separate from destination records, no detail links or visit actions. Discover All Destinations merely scrolls to the top. Unsupported claims include visitor percentages and “zero tour buses.” |
| Experiences | Four routes, difficulty, duration, highlights, suggested stops, detail modal | Stops are not navigable despite “Tap stops” text. No itinerary saving. Modal lacks native focus management. |
| Map | Custom SVG diagram, category and hidden-gem filters, search, selectable pins and cards | Positions are percentages rather than latitude/longitude; the border is stylized despite a source comment calling it accurate. Not suitable for directions or distance calculation. |
| Journey | Progress, levels, region coverage and visit list | Visits are React state initialized with fake visits. Refresh loses changes. Achievements are preset booleans. No dates, memories, favorites, accounts or cloud sync. |

There are 12 main destinations, four separate hidden stories and four experiences. Several destinations named in the brief are absent (including Aqaba, Al Salt, Umm Al Jimal, Karak, Shobak, forests and hot springs). Some photos are reused for different locations; others are search-engine thumbnails or third-party hotlinks without attribution records. Ratings are unsourced sample values, not real traveler reviews. Some copy makes unsupported superlative or healing claims.

Navigation only changes component state: no shareable destination URL or browser history. Page metadata describes a generic productivity app. The source contains no Firebase or network data access. Figma export scripts depend on the Figma environment and cannot serve as Firebase deployment instructions.

## 2. Missing competition requirements

- Allowed-stack implementation; Firebase Hosting and an actual public URL.
- Firestore-backed place records and secure per-user persistence.
- Documentation matching the delivered behavior, setup steps and repository structure.
- Complete discovery flows across all original views.
- Tested mobile, keyboard and error-state behavior.
- Verified and attributable destination imagery; honest data labels.
- GitHub submission package, deployment procedure and demonstrable test evidence.

## 3. Improvements and reasons

1. Rebuild all views using semantic HTML, plain CSS and browser JavaScript modules. This removes prohibited frameworks and reduces installation/build complexity.
2. Use hash URLs with search parameters. Judges can reload, bookmark and use Back/Forward without server-side routing.
3. Unify all locations in one catalog, preserving original places and adding the brief's missing entries. Hidden stories become actionable places.
4. Preserve the sand/terracotta/dark-stone palette, cinematic photography and editorial typography. Add mobile-first grids, readable contrast, native controls, visible focus and reduced-motion support.
5. Make search and filters composable and resettable. Label approximate distances and sample editorial scores clearly.
6. Save favorites, visits and dated private memories. Derive badges from actual visit records. Guests can try the journey locally; signed-in users use Firestore with owner-only access.
7. Keep the map framework-free: an accessible SVG orientation map with selectable, categorized destinations and external directions. Explicitly distinguish it from a road-navigation service.
8. Use Firebase Authentication, Firestore and Hosting. Keep photos as static Hosting assets where possible; Storage is optional and unnecessary for a catalog without user uploads.
9. Use the Firebase Console for trusted data editing and an authenticated admin-only seed page, avoiding a complex CMS or custom backend.
10. Keep reviews out of the first release: the existing rating filter remains, labeled as demo guide scores. Public reviews would require moderation and are optional under the supplied requirements.

## 4. Competition-readiness gates

- Run local functionality and responsive checks; record results in TEST-RESULTS.md.
- Create the owner's Firebase project, register the web app, enable email/password authentication and create Firestore in production mode.
- Deploy restrictive rules and the catalog; verify that one user cannot read or modify another user's journey.
- Deploy Hosting and verify the public HTTPS site, authentication, reloads and cloud persistence on two sessions.
- Confirm image licenses and catalog content; record sources and unresolved editorial limitations.
- Push the final folder to the owner's GitHub repository and include the live URL in README.
- Run the judge demonstration checklist. Until the live Firebase checks pass, call this a deployment-ready implementation, not a completed online submission.

## Source-file review inventory

- `src/App.tsx`, `src/main.tsx`, `src/vite-env.d.ts`: app state, component mounting and TypeScript environment.
- `src/components/Navbar.tsx`: navigation and mobile menu; scroll state never changes.
- All seven `src/pages/*.tsx`: flows and presentation assessed above.
- `src/data.ts`: all records, experiences, suggested stops, static achievements, map pin derivation and category metadata reviewed.
- `src/index.css`: palette, external fonts, Tailwind theme, scrollbar, image overlays and grain.
- `src/imports/pasted_text/discover-jordan-brief.md`: product/design reference, including original required catalog.
- `index.html`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`: shell, dependencies, resolution records and Figma-specific build plugins.
- `.figma/make/`: analyze-routes, deploy, deploy-preview, dev, dev.json, format, import-assets.mjs, install, langserver and site.json are export/development tooling, not product functionality.
- `.gitattributes`, `.gitignore`, `.mise.toml`, `AGENTS.md`, `CLAUDE.md`: generated environment instructions and repository metadata. Instructions to use React/Tailwind are superseded by the owner's explicit request.

Firebase implementation references: [Web SDK CDN setup](https://firebase.google.com/docs/web/alt-setup), [Firestore access conditions](https://firebase.google.com/docs/firestore/security/rules-conditions), [Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart).
