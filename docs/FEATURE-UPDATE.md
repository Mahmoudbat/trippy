# Guest and trip-planner update — 2026-09-28

The existing vanilla application and dark/gold design were extended without a rebuild or framework. The affected source files are app.js, domain.js, journey-related app behavior, firebase.js, index.html, styles.css, catalog.json and firestore.rules. trips.js and practical.js isolate route calculations/validation and practical-information rendering.

Guest browsing is the default. Preferences are separate from authentication. Categories/filters, interests, trip preferences, favorites and visited places persist locally. Account profiles do not overwrite guest preferences. Cloud actions explicitly prompt for authentication and preserve the selected guest route during sign-in. The user then selects the save/share action again.

For You supports private saved route retrieval, public share URLs and deletion that revokes a share. PDF export now creates and downloads a real PDF client-side with Canvas and a small framework-free PDF writer. The itinerary includes the title, trip length, day-by-day stops, descriptions and areas; Canvas handles Arabic shaping and RTL before the pages are embedded as images. Generation exposes loading, success and friendly error states.

Daily planning groups destinations within one region, caps estimated driving inside each day at roughly three hours and chooses each next stop by proximity. Multi-region days follow a north-to-south or south-to-north sequence to reduce backtracking. The UI shows leg estimates and suggests more days when inter-day transfers are long.

The EN/AR switch persists in LocalStorage and defaults from the browser language. Arabic applies `lang="ar"`, `dir="rtl"`, Cairo typography, logical spacing and translated destination content for all 27 places. Account onboarding appears once after the first profile-less login; guest onboarding appears only in For You and never blocks the first visit.

All 27 catalog records have practical fields. Specific admission values use the [Ministry of Tourism listing](https://www.mota.gov.jo/EN/Pages/Entrance_Fees); Petra schedules use the [official Petra page](https://visitpetra.jo/en/Openinghours), and Jerash schedules use the [official visitor guide](https://jerash.visitjordan.com/en/page/10/Jerash-Visiting-Information). Many destinations do not have verified current timetables or fixed fees; the UI explicitly says so. Transport suggestions are planning guidance, not confirmed schedules.

Validation: 19 Node tests pass, including geographic sequencing, same-region days, the three-hour drive cap and PDF container structure. Live Firebase integration checks passed for account creation, owner save/read, anonymous and cross-user private-read denial, public share retrieval, ownership restrictions, payload rejection and revocation. Browser checks verified RTL, Arabic place/planner content, remembered language and successful Arabic PDF generation.

Firebase configuration contains public web identifiers, not server credentials. Access control resides in Firestore rules. No server-side key, additional framework, AI service, paid routing API or custom backend was added.
