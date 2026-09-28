# Design and behavior specification

## Identity

Discover Jordan: “Beyond the famous places.” A premium, warm travel field guide that turns into the explorer's own journal. Preserve the original idea and all seven views. The implementation uses dark stone `#0C0A07`, cream `#F6E7CC`, sand `#D8B27C`, desert orange `#C4762A`, gold `#D4A853` and warm brown surfaces. Playfair Display provides editorial headings; DM Sans provides readable interface text, with system fallbacks. Arabic destination names use an Arabic-capable system font and explicit language/direction attributes.

Photography, generous spacing, restrained borders, serif headlines and soft hover transitions retain the cinematic desert identity. The delivery is a functional interpretation of the supplied source design, not a pixel-exact reproduction of a separate Figma file (none was supplied).

## Views and flows

| View / URL | Behavior |
|---|---|
| `#/` | Hero search submits to Explore with the query; categories apply their category; counts reflect the real catalog. |
| `#/explore` | Search name, Arabic name, region, city, tags and category; combine region/category/score/visit/hidden/distance filters. Reset clears every filter. |
| `#/place/petra` | Story, facts, photo enlargement and credit, related places, favorites, visit toggle, private dated memory, Google Maps. |
| `#/hidden` | The same functional discovery grid scoped to hidden gems, including all four original hidden stories. |
| `#/experiences` | Four original curated experiences with duration, difficulty and route preview. |
| `#/experience/desert-adventure` | Navigable route stops, optional stops via Google Maps, highlights and save-all action. |
| `#/map` | Search/category/hidden filtering, numbered pins with matching accessible list, selected destination preview. |
| `#/journey` | Real visited/saved counts, earned badges, level, region progress, favorites, dated memory editor and JSON export. |
| `#/about` | Project identity, data limitations, guest/account privacy explanation and image credits. |
| `/admin.html` | Admin verification and non-overwriting catalog seed operation. |

Hash routes are bookmarkable and work on static Hosting without server routing. Query parameters preserve discovery filters. Updates to filter typing replace the current history entry; full view navigation adds an entry. Page titles and main focus follow navigation.

## Persistence

Guests use the `discover-jordan-guest-v1` localStorage key. New guests start with no visits or unlocked badges. A memory is limited to 2,000 characters. Removing a visit removes it from the timeline and achievement calculation; the text is retained in the record if the place is later marked visited again. Favorites are independent of visited state.

Signed-in users load private Firestore entries before account mutations are enabled. Writes update the interface only after acknowledgement. Failed reads/writes display an error instead of reporting success. Guest-to-account copying is explicit and preserves any existing account record for the same place. Export produces a local JSON file, including memories.

No public reviews are implemented. Existing numeric values are labeled demo guide scores. They remain available for filtering to preserve the original behavior without claiming real review provenance.

## Map and distance

The map is an original SVG orientation graphic, explicitly simplified. Place latitude/longitude values are approximate attraction/general-area coordinates; colored numbered buttons and the destination list carry the same selection. Nearby filtering uses the Haversine great-circle distance from a location voluntarily provided through the browser. It is not road distance. Location stays in memory and is not saved to Firebase.

## Accessibility and responsive behavior

- Native anchors, buttons, labels, checkboxes, selects, dates and dialogs; visible keyboard focus and skip link.
- Navigation collapses below 1,000 px. Cards grow from one to two to three columns. Filters appear above results on narrow screens and at the side on desktop.
- Touch targets are generally 44–48 px; dense map pins also have a full-size list alternative.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
- Native dialogs support Escape and browser-managed focus containment. Status messages use live regions.
- Images have alt text; missing images become explicitly identified illustrations.

## Deliberate limits

No hotel/flight bookings, payments, marketplace, chatbot or public feed. No invented visitor statistics or preset personal history. Cloud Storage is unnecessary because images are static assets. Catalog administration uses Firebase Console instead of a second application. Curated experiences are maintained in the bundled catalog while place records can be edited through Firestore.
