import {
  categories,
  regions,
  icons,
  colors,
  escapeHTML as esc,
  safeURL,
  filterPlaces,
  distanceKm,
  achievements,
  explorerLevel,
  interestOptions,
  cleanProfile,
  recommendPlaces,
  buildItinerary,
  validPlace,
  cleanEntry,
} from "./domain.js";
import { connectFirebase, friendlyError } from "./firebase.js";
import { tripMetrics, tripSnapshot, restoreTrip } from "./trips.js";
import { practicalInfo } from "./practical.js";
import { initI18n, language, placeText, setLanguage, t, translateRendered, translateStatic } from './i18n.js';
import { downloadItineraryPDF } from './pdf.js';
import {
  readGuest,
  writeGuest,
  readProfile,
  writeProfile,
  today,
} from "./journey.js";

const main = document.querySelector("#main");
const state = {
  places: [],
  experiences: [],
  entries: readGuest(),
  profile: readProfile(),
  user: null,
  cloud: null,
  accountReady: false,
  location: null,
  busy: false,
  authEpoch: 0,
  authKnown: false,
};
let toastTimer;
const byId = (id) => state.places.find((p) => p.id === id);
const pn = p => placeText(p, 'name');
const pf = (p, field) => placeText(p, field);
const categoryName = value => t(`category.${value}`, value);
const regionName = value => t(value === 'North Jordan' ? 'north' : value === 'Central Jordan' ? 'central' : value === 'South Jordan' ? 'south' : '', value);
const interestName = item => t(`interest.${item.id}`, item.label);
const reasonName = value => {
  const interest = interestOptions.find(item => item.label === value);
  return interest ? interestName(interest) : categoryName(value);
};
const entry = (id) => state.entries[id] || cleanEntry();
const placeURL = (id) => `#/place/${encodeURIComponent(id)}`;
const mapsURL = (p) =>
  `https://www.google.com/maps/search/?api=1&query=${p.coordinates.lat},${p.coordinates.lng}`;
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4500);
}
function status(message) {
  const el = document.querySelector("#connection");
  el.textContent = message;
  el.hidden = !message;
}
function route() {
  const [path, query = ""] = (location.hash.slice(1) || "/").split("?");
  return { path, params: new URLSearchParams(query) };
}
function picture(p, extra = "") {
  return `<img src="${esc(safeURL(p.image))}" alt="${p.images?.length ? esc(pn(p)) : (language() === 'ar' ? 'رسم توضيحي للمنظر الطبيعي؛ لا تتوفر صورة موثقة' : 'Landscape illustration; photograph not available')}" loading="lazy" decoding="async" ${extra}>`;
}
function photoCredit(p) {
  const im = p.images?.[0];
  return im
    ? `<p class="credit">${language() === 'ar' ? 'الصورة:' : 'Photo:'} ${esc(im.credit)} · ${esc(im.license)} · ${esc(im.modifications || "")} <a href="${esc(safeURL(im.source))}" target="_blank" rel="noopener noreferrer">Source & license ↗</a></p>`
    : `<p class="credit">${language() === 'ar' ? 'رسم أصلي للمنظر الطبيعي؛ لا تتوفر بعد صورة موثقة للموقع.' : 'Original landscape illustration. A verified location photograph is not yet available.'}</p>`;
}
function score(p) {
  return p.rating
    ? `<span class="score" title="Sample editorial score from the original prototype; not visitor reviews">★ ${p.rating.toFixed(1)} <span class="sr-only">demo guide score</span></span>`
    : "";
}
function card(p) {
  const e = entry(p.id);
  return `<article class="place-card"><div class="card-image"><a href="${placeURL(p.id)}" aria-label="${language() === 'ar' ? 'استكشف' : 'Explore'} ${esc(pn(p))}">${picture(p)}</a><span class="badge">${icons[p.category]} ${esc(p.category)}</span><button class="favorite" data-favorite="${p.id}" aria-label="${e.favorite ? (language() === 'ar' ? 'إزالة' : 'Unsave') : (language() === 'ar' ? 'حفظ' : 'Save')} ${esc(pn(p))}" aria-pressed="${e.favorite}">${e.favorite ? "♥" : "♡"}</button>${!p.images?.length ? '<span class="photo-placeholder">Illustration</span>' : ""}</div><div class="card-body"><div class="card-title"><div><h3><a href="${placeURL(p.id)}">${esc(pn(p))}</a></h3>${language() === 'en' ? `<span class="arabic" lang="ar" dir="rtl">${esc(p.arabicName)}</span>` : ''}</div>${score(p)}</div><p class="location">⌖ ${esc(pf(p,'regionCity'))}${state.location ? ` · ${Math.round(distanceKm(state.location, p.coordinates))} km` : ""}</p><p class="card-description">${esc(pf(p,'description'))}</p><div class="tags">${p.tags
    .slice(0, 3)
    .map((t) => `<span>${esc(t)}</span>`)
    .join(
      "",
    )}</div><div class="card-bottom"><button class="visit-small" data-visit="${p.id}" aria-label="${e.visited ? "Mark unvisited" : "Mark visited"}: ${esc(pn(p))}" aria-pressed="${e.visited}">${e.visited ? "✓ Visited" : "○ Not visited"}</button><a href="${placeURL(p.id)}">View details ↗</a></div></div></article>`;
}
function heading(eyebrow, title, description = "") {
  return `<div class="container page-heading"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${description ? `<p>${description}</p>` : ""}</div>`;
}
function home() {
  const petra = byId("petra") || state.places[0],
    dana = byId("dana") || petra;
  const descriptions = [
    "Ancient cities. Living stories.",
    "Sacred places. Quiet moments.",
    "Take the road less traveled.",
    "Find your kind of wilderness.",
    "Slow down. Breathe it in.",
  ];
  return `<section class="hero"><img src="${esc(safeURL(petra.heroImage))}" alt="${petra.images?.length ? "Petra, Jordan" : "Illustrated desert landscape"}" fetchpriority="high"><div class="container hero-content"><span class="eyebrow">A JOURNEY BEYOND THE EXPECTED</span><h1>Discover<br><em>Jordan.</em></h1><p class="intro">Beyond the famous places.</p><p class="description">Ancient cities. Hidden valleys. Stories that stay with you.<br>Find a Jordan you haven’t met yet.</p><form class="hero-search" id="home-search"><label class="sr-only" for="home-query">Search destinations</label><input id="home-query" name="q" type="search" placeholder="Where will your curiosity take you?"><button class="button primary" type="submit">Explore <span aria-hidden="true">↗</span></button></form><a class="text-link" href="#/experiences">Find your next experience &nbsp; →</a></div><div class="hero-foot"><a href="#/explore">SCROLL INTO YOUR NEXT ADVENTURE ↓</a><div class="hero-coordinate">PETRA · THE ROSE CITY<br>30.3285° N &nbsp; 35.4444° E</div></div></section><div class="container stats-strip">${[
    [state.places.length, "Places to discover"],
    [categories.length, "Ways to explore"],
    [state.experiences.length, "Curated experiences"],
    [state.places.filter((p) => p.isHiddenGem).length, "Hidden gems"],
  ]
    .map(
      ([n, label]) =>
        `<div class="stat"><strong>${n.toString().padStart(2, "0")}</strong><span>${label}</span></div>`,
    )
    .join(
      "",
    )}</div><section class="container section"><div class="section-head"><div><span class="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>There’s a Jordan <em>for you.</em></h2></div><p class="small">Five ways to begin. Endless stories to find.</p></div><div class="category-grid">${categories.map((c, i) => `<a class="category-card" href="#/explore?category=${c}"><span class="symbol" aria-hidden="true">${icons[c]}</span><span class="arrow" aria-hidden="true">↗</span><h3>${c}</h3><p>${descriptions[i]}</p></a>`).join("")}</div></section><section class="section section-alt"><div class="container"><div class="section-head"><div><span class="eyebrow">THE PLACES THAT STAY WITH YOU</span><h2>Extraordinary, <em>by nature.</em></h2></div><a class="text-link" href="#/explore">All destinations ↗</a></div><div class="grid">${["petra", "wadi-rum", "jerash", "dead-sea", "ajloun", "dana"].map(byId).filter(Boolean).map(card).join("")}</div><p class="small muted">★ Demo guide scores from the original design, not traveler reviews.</p></div></section><section class="container section story-split"><div>${picture(dana)}${photoCredit(dana)}</div><div><span class="eyebrow">THE OTHER SIDE OF JORDAN</span><h2>Most travelers visit.<br><em>Few truly discover.</em></h2><p>Beyond Petra and the Dead Sea, another Jordan unfolds. Stone villages above deep valleys. Forest trails in the north. A new perspective around every bend.</p><blockquote>Leave a little room in your itinerary<br>for the unexpected.</blockquote><a class="button" href="#/hidden">Discover Hidden Jordan ↗</a></div></section><section class="container section"><div class="cta"><span class="eyebrow">MORE THAN A PIN ON A MAP</span><h2>Make it <em>your journey.</em></h2><p>Tell us what you love and receive a personal route, then save the places and memories that make the trip your own.</p><div class="actions"><a class="button primary" href="#/planner">Build my smart plan ↗</a><a class="button" href="#/journey">Open my journal</a><a class="button" href="#/map">Explore the map</a></div></div></section>`;
}
function options(values, selected, first) {
  return (
    `<option value="">${first}</option>` +
    values
      .map(
        (v) =>
          `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`,
      )
      .join("")
  );
}
function getFilters(params) {
  if (params.has('category')) {
    try { const remembered = new URLSearchParams(params); remembered.delete('pin'); localStorage.setItem('discover-jordan-filters', remembered.toString()); } catch {}
  }
  if (!params.size) {
    try { params = new URLSearchParams(localStorage.getItem('discover-jordan-filters') || ''); } catch {}
  }
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    region: params.get("region") || "",
    rating: params.get("rating") || "",
    status: params.get("status") || "",
    distance: params.get("distance") || "",
    hidden: params.get("hidden") === "1",
    sort: params.get("sort") || "",
  };
}
function explore(params, hidden = false) {
  const f = getFilters(params);
  f.hidden = hidden || f.hidden;
  return `${heading(hidden ? "BEYOND THE GUIDEBOOK" : "YOUR FIELD GUIDE", hidden ? "Hidden <em>Jordan.</em>" : "Find your <em>next story.</em>", hidden ? "Discover places locals love. These quieter chapters are part of the same journey." : "From the forested north to the desert south. Explore at your own pace.")}<div class="container explore-layout"><details class="filters" open><summary>Filter destinations</summary><form id="filter-form" class="filter-fields"><label>Category<select name="category">${options(categories, f.category, "All categories")}</select></label><label>Region<select name="region">${options(regions, f.region, "All Jordan")}</select></label><label>Minimum demo guide score<select name="rating"><option value="">Any score</option><option value="4" ${f.rating === "4" ? "selected" : ""}>4.0+</option><option value="4.5" ${f.rating === "4.5" ? "selected" : ""}>4.5+</option></select></label><label>Your journey<select name="status"><option value="">All places</option>${[
    ["visited", "Visited"],
    ["unvisited", "Not visited"],
    ["saved", "Saved favorites"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${f.status === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></label>${!hidden ? `<label class="check"><input type="checkbox" name="hidden" ${f.hidden ? "checked" : ""}>Hidden gems only</label>` : ""}<label>Distance from your location<select name="distance" ${!state.location ? "disabled" : ""}><option value="">Any distance</option><option value="50" ${f.distance === "50" ? "selected" : ""}>Within 50 km</option><option value="100" ${f.distance === "100" ? "selected" : ""}>Within 100 km</option></select></label><button class="button" type="button" data-locate>Use my location ⌖</button><small class="muted">Optional. Used only on this page to estimate straight-line distance; never saved or sent to Firebase.</small><button class="text-button" type="button" data-clear-filters>Reset all filters</button></form></details><div class="results"><div class="search-row"><label class="sr-only" for="explore-query">Search places in English or Arabic</label><input id="explore-query" type="search" placeholder="Search places, tags, or اسم المكان…" value="${esc(f.q)}"><label class="sr-only" for="sort">Sort destinations</label><select id="sort"><option value="">Recommended order</option><option value="name" ${f.sort === "name" ? "selected" : ""}>Name A–Z</option><option value="rating" ${f.sort === "rating" ? "selected" : ""}>Demo guide score</option>${state.location ? `<option value="distance" ${f.sort === "distance" ? "selected" : ""}>Nearest first</option>` : ""}</select></div><div id="explore-results">${results(f)}</div><p class="small muted">★ Scores are sample editorial data, not public reviews. Unscored places are included when no minimum is selected.</p></div></div>`;
}
function results(f) {
  const matches = filterPlaces(state.places, f, state.entries, state.location);
  return `<p class="result-count" role="status">${matches.length} ${matches.length === 1 ? "destination" : "destinations"} to discover${state.location ? " · distances are approximate straight-line estimates" : ""}</p>${matches.length ? `<div class="grid">${matches.map(card).join("")}</div>` : '<div class="empty"><span class="eyebrow">A DIFFERENT DIRECTION</span><h2>No places match just yet.</h2><p>Try another search or reset your filters.</p><button class="button" data-clear-filters>Reset all filters</button></div>'}`;
}
function updateExplore() {
  const params = new URLSearchParams();
  const form = document.querySelector("#filter-form");
  for (const [k, v] of new FormData(form))
    if (v) params.set(k, k === "hidden" ? "1" : v);
  const q = document.querySelector("#explore-query").value.trim(),
    sort = document.querySelector("#sort").value;
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  try { localStorage.setItem('discover-jordan-filters', params.toString()); } catch { toast('Browser storage unavailable; filters last for this visit.'); }
  history.replaceState(
    null,
    "",
    `${location.pathname}${location.search}#${route().path}${params.size ? "?" + params : ""}`,
  );
  const f = getFilters(params);
  if (route().path === "/hidden") f.hidden = true;
  document.querySelector("#explore-results").innerHTML = results(f);
}
function memoryForm(p) {
  const e = entry(p.id);
  return `<form class="memory-form" data-memory="${p.id}"><label>Visit date<input type="date" name="date" required value="${esc(e.visitedAt || today())}" max="${today()}"></label><label>Your private memory<textarea name="memory" maxlength="2000" placeholder="A view, a conversation, a moment worth keeping…">${esc(e.memory)}</textarea></label><button class="button" type="submit">Save memory</button><small class="muted">${state.user ? "Private to your account." : "Saved on this browser. Sign in to save across devices."}</small></form>`;
}
function detail(id) {
  const p = byId(id);
  if (!p) return notFound();
  const e = entry(id);
  return `<section class="detail-hero"><img src="${esc(safeURL(p.heroImage || p.image))}" alt="${esc(pn(p))}"><a class="back-link" href="#/explore">← Explore destinations</a><div class="container"><span class="badge">${icons[p.category]} ${esc(p.category)}${p.isHiddenGem ? " · Hidden gem" : ""}</span><h1>${esc(pn(p))}</h1>${language() === 'en' ? `<span class="arabic" lang="ar" dir="rtl">${esc(p.arabicName)}</span>` : ''}</div></section><div class="container detail-layout"><div class="detail-story"><section><span class="eyebrow">WHY THIS PLACE</span><blockquote>${esc(pf(p,'whyVisit'))}</blockquote></section><section><h2>${language() === 'ar' ? `تعرّف إلى ${esc(pn(p))}.` : `Meet ${esc(pn(p))}.`}</h2><p>${esc(pf(p,'description'))}</p><div class="tags">${p.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div></section><section class="actions"><button class="button primary" data-favorite="${p.id}" aria-pressed="${e.favorite}">${e.favorite ? "♥ Saved" : "♡ Save place"}</button><button class="button" data-visit="${p.id}" aria-pressed="${e.visited}">${e.visited ? "✓ Visited · undo" : "Mark as visited"}</button><a class="button" href="${mapsURL(p)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></section><section><h3>A closer look</h3><button class="gallery-button" data-gallery="${p.id}" aria-label="${esc(pn(p))}">${picture(p)}<span>View full photograph ↗</span></button>${photoCredit(p)}</section>${e.visited ? `<section><h3>A memory from here</h3>${memoryForm(p)}</section>` : ""}<section><h3>Before you go</h3><p class="small">These are planning ideas, not bookings or live access information. Check opening times, seasonal trail access and local guidance before traveling.</p><a class="text-link" href="${esc(safeURL(p.sourceUrl))}" target="_blank" rel="noopener noreferrer">Read more about this destination ↗</a></section></div><aside class="facts"><span class="eyebrow">YOUR FIELD NOTES</span><h3>The essentials</h3><dl>${[
    ["Location", pf(p,'regionCity')],
    ["Region", regionName(p.region)],
    ["Suggested season", pf(p,'bestTime')],
    ["Allow yourself", pf(p,'recommendedDuration')],
    ["History / landscape", p.historicalPeriod || categoryName(p.category)],
    ["Perfect for", p.perfectFor.join(" · ")],
    [
      "Demo guide score",
      p.rating ? `★ ${p.rating} / 5 — not traveler reviews` : "Not scored",
    ],
    [
      "Distance",
      state.location
        ? `${Math.round(distanceKm(state.location, p.coordinates))} km straight-line from your location`
        : p.distance
          ? `About ${p.distance} km from Amman (original estimate)`
          : "Use the map to plan your route",
    ],
  ]
    .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
    .join(
      "",
    )}</dl></aside></div><section class="container section"><div class="section-head"><h2>Keep <em>exploring.</em></h2><a class="text-link" href="#/explore?category=${p.category}">More ${p.category.toLowerCase()} ↗</a></div><div class="grid">${state.places
    .filter((d) => d.category === p.category && d.id !== p.id)
    .slice(0, 3)
    .map(card)
    .join("")}</div></section>`;
}
function experiences() {
  return `${heading("THOUGHTFULLY CURATED", "Jordan <em>Experiences.</em>", "A little inspiration for the road ahead. Four journeys, each with a different rhythm.")}<section class="container section"><div class="grid experience-grid">${state.experiences.map((e) => `<article class="experience-card"><img src="${esc(safeURL(e.coverImage))}" alt="Landscape on the ${esc(e.title)} route" loading="lazy"><div class="content"><div class="tags"><span>${esc(e.duration)}</span><span>${esc(e.difficulty)}</span></div><h2 style="font-size:2rem;margin-top:22px">${esc(e.title)}</h2><p>${esc(e.subtitle)}</p><div class="route-preview">${e.route.map(esc).join(" → ")}</div><a class="button" href="#/experience/${e.id}">Explore this journey ↗</a></div></article>`).join("")}</div></section>`;
}
function experience(id) {
  const e = state.experiences.find((e) => e.id === id);
  if (!e) return notFound();
  return `${heading("JORDAN EXPERIENCES", esc(e.title), esc(e.description))}<section class="container section"><div class="itinerary"><a class="text-link" href="#/experiences">← All experiences</a><div class="facts"><div class="tags"><span>${esc(e.duration)}</span><span>${esc(e.difficulty)}</span><span>${esc(e.bestFor)}</span></div><p>This is a suggested itinerary. Choose your pace and check access before departure.</p><button class="button primary" data-save-route="${e.id}">♡ Save all route places</button></div><h2>Your route</h2><ol class="route-list">${e.route
    .map(
      (name, i) =>
        `<li><h3><a href="${placeURL(e.placeIds[i])}">${esc(name)} ↗</a></h3>${(
          e.suggestedStops || []
        )
          .filter((s) => s.between[0] === name)
          .map(
            (s) =>
              `<div class="optional-stop"><span class="eyebrow">OPTIONAL STOP</span><h4>${esc(s.name)}</h4><p>${esc(s.description)}</p><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " Jordan")}" target="_blank" rel="noopener noreferrer">Find this stop ↗</a></div>`,
          )
          .join("")}</li>`,
    )
    .join(
      "",
    )}</ol><h2>Moments to make time for</h2><ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div></section>`;
}
const jordanMap = {
  minLng: 34.950781,
  maxLat: 33.372217,
  longitudeScale: 0.8546279085,
  scale: 126.7415606,
  offsetX: 64.844498,
  offsetY: 50,
  width: 600,
  height: 630,
};
function mapPoint({ lat, lng }) {
  const x =
    jordanMap.offsetX +
    (lng - jordanMap.minLng) * jordanMap.longitudeScale * jordanMap.scale;
  const y = jordanMap.offsetY + (jordanMap.maxLat - lat) * jordanMap.scale;
  return {
    left: Math.max(2, Math.min(98, (x / jordanMap.width) * 100)),
    top: Math.max(2, Math.min(98, (y / jordanMap.height) * 100)),
  };
}
function mapPage(params) {
  const f = getFilters(params);
  const matches = filterPlaces(state.places, f, state.entries);
  const selected =
    matches.find((p) => p.id === params.get("pin")) || matches[0];
  return `${heading("A DIFFERENT PERSPECTIVE", "One country. <em>So much to find.</em>", "Select a numbered pin or a destination in the list. Open its story, then plan directions in Google Maps.")}<div class="container"><form id="map-filters" class="search-row"><label class="sr-only" for="map-q">Search map destinations</label><input id="map-q" name="q" type="search" value="${esc(f.q)}" placeholder="Search the map…"><label class="sr-only" for="map-category">Map category</label><select id="map-category" name="category">${options(categories, f.category, "All categories")}</select><label class="check"><input type="checkbox" name="hidden" ${f.hidden ? "checked" : ""}>Hidden gems</label><button class="button" type="submit">Apply</button><a class="text-link" href="#/map">Reset</a></form><div class="map-legend">${categories.map((c) => `<span style="color:${colors[c]}">${icons[c]} ${c}</span>`).join("")}</div><div class="map-layout"><div class="map-canvas"><img class="map-outline" src="assets/jordan-map.svg" alt="Geographic outline of Jordan, north at the top">${matches
    .map((p, i) => {
      const { left, top } = mapPoint(p.coordinates);
      return `<button class="map-pin" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;color:${colors[p.category]}" data-pin="${p.id}" aria-label="${i + 1}. ${esc(pn(p))}" aria-pressed="${p.id === selected?.id}">${i + 1}</button>`;
    })
    .join(
      "",
    )}<span class="map-note">Geographic outline · destination positions are approximate · not for navigation</span></div><div class="map-select"><p class="result-count">${matches.length} destinations on your map</p>${selected ? card(selected) : '<div class="empty"><h2>No matching places</h2><a href="#/map">Reset the map</a></div>'}<div class="map-list" aria-label="Map destinations">${matches.map((p, i) => `<button data-pin="${p.id}" aria-pressed="${p.id === selected?.id}"><span>${i + 1}. ${esc(pn(p))}</span><span style="color:${colors[p.category]}">${icons[p.category]}</span></button>`).join("")}</div></div></div></div>`;
}
function planner() {
  const profile = cleanProfile(state.profile);
  const ranked = recommendPlaces(state.places, profile, state.entries);
  const plan = buildItinerary(state.places, profile, state.entries);
  const labels = profile.interests
    .map((id) => interestOptions.find((item) => item.id === id))
    .filter(Boolean);
  const paceLabel =
    { relaxed: "Relaxed", balanced: "Balanced", full: "Full" }[profile.pace] ||
    "Balanced";
  const intro = labels.length
    ? `<div class="planner-profile"><div><span class="eyebrow">YOUR TRAVEL DNA</span><h2>Built around what you love.</h2><div class="profile-chips">${labels.map((item) => `<span>${item.icon} ${esc(interestName(item))}</span>`).join("")}</div><p>${profile.days}-day trip · ${paceLabel} pace · ${esc(profile.region)}</p></div><button class="button" data-account>Tune preferences</button></div>`
    : `<div class="notice planner-onboarding"><strong>Make this plan yours.</strong> Choose your interests, pace and trip length to replace these starter recommendations. <button class="text-button" data-account>Tell us what you love ↗</button></div>`;
  return `${heading(t('plannerEyebrow'), t('plannerTitle'), t('plannerIntro'))}<div class="container section">${intro}<section class="smart-plan"><div class="section-head"><div><span class="eyebrow">YOUR ROUTE</span><h2>${profile.days} ${t('days')}, <em>made for you.</em></h2></div><a class="text-link" href="#/map">See every stop on the map ↗</a></div><div class="smart-days">${plan
    .map(
      (day) =>
        `<article class="smart-day"><div class="day-number"><span>DAY</span><strong>${day.number}</strong></div><div>${day.stops
          .map(
            ({ place, matchReasons }, index) =>
              `<div class="smart-stop"><span class="route-dot">${index + 1}</span><div><h3><a href="${placeURL(place.id)}">${esc(pn(place))} ↗</a></h3><p>${esc(pf(place,'regionCity'))} · ${esc(pf(place,'recommendedDuration'))}</p>${index ? `<small class="muted">≈ ${Math.round(distanceKm(day.stops[index - 1].place.coordinates, place.coordinates) * 1.35)} ${language() === 'ar' ? 'كم' : 'km'} · ${(distanceKm(day.stops[index - 1].place.coordinates, place.coordinates) * 1.35 / 50).toFixed(1)} ${language() === 'ar' ? 'س' : 'h'}</small>` : ''}<div class="profile-chips">${(matchReasons.length ? matchReasons : [place.category]).map((reason) => `<span>${esc(reasonName(reason))}</span>`).join("")}</div></div></div>`,
          )
          .join("")}</div></article>`,
    )
    .join("")}</div></section><section class="section"><div class="section-head"><div><span class="eyebrow">TOP MATCHES</span><h2>Places that fit <em>your style.</em></h2></div><button class="button" data-account>Adjust interests</button></div><div class="grid">${ranked
    .slice(0, 6)
    .map(({ place }) => card(place))
    .join("")}</div></section></div>`;
}
function mountTripTools() {
  const container = document.createElement('section');
  container.className = 'container trip-tools section';
  main.querySelector('.page-heading').after(container);
  let current = buildItinerary(state.places, state.profile, state.entries);
  if (state.planOverride) {
    try { current = restoreTrip(state.planOverride, state.places); } catch { state.planOverride = null; }
  }
  const epoch = state.authEpoch;
  function display(plan, label = 'Your current route') {
    current = plan;
    const generated = main.querySelector('.smart-plan');
    if (generated) generated.hidden = label !== 'Your current route';
    const m = tripMetrics(plan);
    const longTransfer = m.legs.some(leg => leg.hours > 2);
    container.innerHTML = `<div class="trip-print"><h2>${esc(label === 'Your current route' ? t('currentRoute') : label)}</h2><div class="profile-chips"><span>${m.stops} ${t('stops')}</span><span>≈ ${Math.round(m.km)} ${t('distance')}</span><span>≈ ${m.travelHours.toFixed(1)} ${t('driving')}</span><span>≈ ${m.totalHours.toFixed(1)} ${t('active')}</span></div><p class="small muted">${t('estimateNote')}</p>${longTransfer ? `<p class="notice distance-warning">${t('tooFar')}</p>` : ''}<div class="trip-route">${plan.map(day => `<article><h3>${t('day')} ${day.number}</h3><ol>${day.stops.map(({place}) => `<li><a href="${placeURL(place.id)}">${esc(pn(place))}</a> · ${esc(pf(place,'recommendedDuration'))} · <a href="${mapsURL(place)}" target="_blank" rel="noopener noreferrer">Maps ↗</a></li>`).join('')}</ol></article>`).join('')}</div></div><div class="actions trip-actions"><button class="button" data-trip-action="pdf">${t('downloadPdf')}</button><button class="button" data-trip-action="save">${t('saveAccount')}</button><button class="button" data-trip-action="share">${t('share')}</button><button class="button" data-trip-action="list">${t('savedTrips')}</button><button class="button" data-trip-action="sync">${t('sync')}</button></div><p class="small">Sharing publishes the stops to anyone with the link; your email, interests and journal memories stay private.</p><p class="trip-message" role="status" aria-live="polite"></p><div class="saved-trips"></div>`;
    translateRendered(container);
  }
  display(current);
  const shared = route().params.get('shared');
  if (shared && !/^[A-Za-z0-9]{20}$/.test(shared)) {
    container.querySelector('.trip-print').textContent = 'Invalid shared trip link.';
    container.querySelectorAll('[data-trip-action]').forEach(button => button.disabled = true);
    return;
  }
  if (shared && /^[A-Za-z0-9]{20}$/.test(shared)) {
    container.querySelector('.trip-print').textContent = 'Loading shared route…';
    container.querySelectorAll('[data-trip-action]').forEach(button => button.disabled = true);
    container.querySelector('.trip-message').textContent = 'Loading shared route…';
    connectFirebase().then(cloud => cloud.sharedTrip(shared)).then(value => {
      if (container.isConnected) display(restoreTrip(value, state.places), 'Shared Jordan route');
    }).catch(() => { if (container.isConnected) { container.querySelector('.trip-print').textContent = 'Shared route unavailable'; container.querySelector('.trip-message').textContent = 'This shared trip is unavailable or has been removed. Check your connection or ask its owner for a new link.'; } });
  }
  container.addEventListener('click', async event => {
    const button = event.target.closest('[data-trip-action]');
    if (!button) return;
    const action = button.dataset.tripAction;
    if (action === 'pdf') {
      const message = container.querySelector('.trip-message'); button.disabled = true; button.setAttribute('aria-busy','true'); message.textContent = t('pdfLoading');
      try {
        await downloadItineraryPDF(current, { lang: language(), placeText: place => ({ name: pn(place), description: pf(place,'description'), area: pf(place,'regionCity'), region: language() === 'ar' ? t(place.region === 'North Jordan' ? 'north' : place.region === 'Central Jordan' ? 'central' : 'south') : place.region }), labels: { site: t('siteName'), title: t('plannerTitle'), length: t('tripLength'), days: t('days'), day: t('day') } });
        message.textContent = t('pdfDone');
      } catch (error) { console.error('PDF export failed', error); message.textContent = t('pdfError'); }
      finally { button.disabled = false; button.removeAttribute('aria-busy'); }
      return;
    }
    if (!state.user) { state.pendingTrip = tripSnapshot(current); account(); document.querySelector('#auth-message').textContent = 'Sign in, then select this action again. Your selected route is kept. Browsing and PDF export are free to use as a guest.'; return; }
    const message = container.querySelector('.trip-message');
    if (!state.accountReady || epoch !== state.authEpoch) { message.textContent = 'Wait for your account to finish loading, then retry.'; return; }
    button.disabled = true;
    message.textContent = 'Working…';
    try {
      if (action === 'sync') {
        const uid = state.user.uid;
        for (const [id, value] of Object.entries(readGuest())) {
          if (byId(id)) await persist(id, { ...entry(id), favorite: entry(id).favorite || value.favorite, visited: entry(id).visited || value.visited, visitedAt: entry(id).visitedAt || value.visitedAt, memory: entry(id).memory || value.memory });
        }
        if (epoch !== state.authEpoch) throw new Error('Account changed');
        await state.cloud.saveProfile(uid, readProfile());
        state.profile = readProfile();
        render(); toast('Guest favorites, visits and preferences copied to your account.');
      } else if (action === 'list') {
        const trips = await state.cloud.trips(state.user.uid);
        if (!container.isConnected) return;
        const list = container.querySelector('.saved-trips');
        list.replaceChildren();
        for (const trip of trips) {
          let plan;
          try { plan = restoreTrip(trip, state.places); } catch { continue; }
          const row = document.createElement('p');
          const open = document.createElement('button');
          open.className = 'button'; open.textContent = `Open ${plan.length}-day trip · ${trip.updatedAt?.toDate?.().toLocaleDateString() || 'saved'}`;
          open.onclick = () => { state.planOverride = tripSnapshot(plan); display(plan, 'Saved Jordan route'); };
          const remove = document.createElement('button');
          remove.className = 'button'; remove.textContent = 'Delete trip & revoke link';
          remove.onclick = async () => {
            if (epoch !== state.authEpoch) return;
            remove.disabled = true;
            try { await state.cloud.deleteTrip(state.user.uid, trip.id); row.remove(); message.textContent = 'Trip removed; its public link is revoked.'; }
            catch (error) { message.textContent = friendlyError(error); remove.disabled = false; }
          };
          row.append(open, ' ', remove); list.append(row);
        }
        message.textContent = trips.length ? 'Your private saved trips.' : 'No saved trips yet.';
      } else {
        const id = await state.cloud.saveTrip(state.user.uid, tripSnapshot(current), action === 'share');
        if (!container.isConnected) return;
        message.textContent = action === 'share' ? 'Public link: ' : 'Trip saved. Open “My saved trips” to retrieve it.';
        if (action === 'share') {
          const link = document.createElement('a');
          link.href = `${location.origin}${location.pathname}#/planner?shared=${id}`;
          link.textContent = link.href; message.append(link);
        }
      }
    } catch (error) { message.textContent = friendlyError(error); }
    finally { button.disabled = false; }
  });
}
function journey() {
  const visited = state.places
    .filter((p) => entry(p.id).visited)
    .sort((a, b) => entry(b.id).visitedAt.localeCompare(entry(a.id).visitedAt));
  const saved = state.places.filter((p) => entry(p.id).favorite);
  const badges = achievements(state.places, state.entries);
  const pct = Math.round((visited.length / state.places.length) * 100);
  return `${heading("YOUR PERSONAL EXPLORER JOURNAL", "My Jordan <em>Journey.</em>", "Some places become part of your story. Keep them here.")}<div class="container section"><div class="notice">${state.user ? `Signed in as ${esc(state.user.email)}. ${state.accountReady ? "Your entries are saved to your private cloud journal." : "Your cloud journal is loading or unavailable; changes are paused."}` : "Guest journal · stored only in this browser. Sign in to keep your journey across devices."} <button class="text-button" data-account>${state.user ? "Manage account" : "Sign in / create account"}</button> · <a href="#/planner">Open your smart plan ↗</a></div><div class="journey-stats" style="margin-top:25px">${[
    [`${visited.length} / ${state.places.length}`, "Places visited"],
    [explorerLevel(visited.length, state.places.length), "Explorer level"],
    [saved.length, "Saved places"],
    [
      `${badges.filter((b) => b.unlocked).length} / ${badges.length}`,
      "Achievements",
    ],
  ]
    .map(
      ([v, k]) =>
        `<div class="journey-stat"><strong>${v}</strong><span>${k}</span></div>`,
    )
    .join(
      "",
    )}</div><div class="progress-panel"><h2>Your Jordan, one place at a time.</h2><p>${pct}% explored</p><progress value="${visited.length}" max="${state.places.length}" aria-label="Jordan exploration">${pct}%</progress><div class="region-grid">${regions
    .map((r) => {
      const all = state.places.filter((p) => p.region === r),
        n = all.filter((p) => entry(p.id).visited).length;
      return `<div><p>${r} · ${n}/${all.length}</p><progress value="${n}" max="${all.length}" aria-label="${r} exploration"></progress></div>`;
    })
    .join(
      "",
    )}</div></div><h2>Little milestones. <em>Real memories.</em></h2><div class="achievement-grid">${badges.map((b) => `<div class="achievement ${b.unlocked ? "unlocked" : ""}"><span class="symbol" aria-hidden="true">${b.icon}</span><h3>${b.title}</h3><p>${b.description}</p><small>${b.unlocked ? "✓ Unlocked" : "Not yet unlocked"}</small></div>`).join("")}</div><div class="section-head"><h2>On your <em>wishlist.</em></h2><a class="text-link" href="#/explore">Find somewhere new ↗</a></div>${saved.length ? `<div class="grid">${saved.map(card).join("")}</div>` : '<div class="empty"><h3>Your next adventure starts with a heart.</h3><p>Tap ♡ on a destination to save it here.</p><a class="button" href="#/explore">Explore destinations ↗</a></div>'}<section class="section"><div class="section-head"><h2>Your travel <em>memories.</em></h2><button class="button" data-export>Export journal ↓</button></div>${visited.length ? visited.map((p) => `<article class="timeline-item"><div class="timeline-head">${picture(p)}<div><h3><a href="${placeURL(p.id)}">${esc(pn(p))} ↗</a></h3><time datetime="${esc(entry(p.id).visitedAt)}">${esc(entry(p.id).visitedAt)}</time></div></div>${memoryForm(p)}<button class="text-button" data-visit="${p.id}">Mark ${esc(pn(p))} as unvisited</button></article>`).join("") : '<div class="empty"><h3>A blank page, full of possibility.</h3><p>Mark a place as visited to add a date and a memory. Your achievements will grow with your journey.</p></div>'}</section></div>`;
}
function about() {
  return `${heading("THE IDEA BEHIND THE JOURNEY", "Beyond the <em>famous places.</em>")}<div class="container about section"><section><h2>A field guide, and a journal.</h2><p>Discover Jordan is a tourism discovery project for PixelSite 2.0 Phase 2. It brings together places, quieter discoveries, curated experiences and a private travel journal.</p><p>Browse as a guest, save favorites and mark visits. An account lets you keep entries across devices when the cloud service is connected.</p></section><section><h2>About this guide</h2><ul><li>Demo guide scores come from the original design. They are not collected traveler reviews.</li><li>Distances and map positions are approximate. The map is an orientation aid, not a navigation service.</li><li>Season and duration suggestions are general planning guidance. Confirm access and current conditions with the destination or local guide.</li><li>Some catalog entries use a clearly labeled illustration until a verified photograph is available.</li></ul></section><section><h2>Your data</h2><p>Guest entries stay in this browser’s local storage. Account entries are private to your Firebase-authenticated user. Optional location access is used in memory for distance calculations; it is never stored in your journal. Export your journal from My Journey.</p><p>No payments, tracking analytics or public social feed are included.</p></section><section><h2>Photography credits</h2><p>Photographs are credited individually below and on destination pages. Original placeholder artwork is labeled as illustration.</p><ul class="credits-list">${state.places
    .filter((p) => p.images?.length)
    .map((p) => `<li><strong>${esc(pn(p))}</strong>${photoCredit(p)}</li>`)
    .join("")}</ul></section></div>`;
}
function notFound() {
  return `${heading("AN UNEXPECTED DETOUR", "This page isn’t on the map.")}<div class="container section"><a class="button primary" href="#/explore">Find a destination ↗</a></div>`;
}
function render({ focus = false } = {}) {
  const active = document.activeElement;
  const restore = active?.dataset?.favorite
    ? `[data-favorite="${active.dataset.favorite}"]`
    : active?.dataset?.visit
      ? `[data-visit="${active.dataset.visit}"]`
      : active?.dataset?.pin
        ? `[data-pin="${active.dataset.pin}"]`
        : null;
  const { path, params } = route();
  const routes = {
    "/": home,
    "/explore": () => explore(params),
    "/hidden": () => explore(params, true),
    "/experiences": experiences,
    "/map": () => mapPage(params),
    "/planner": planner,
    "/journey": journey,
    "/about": about,
  };
  let content;
  if (path.startsWith("/place/")) content = detail(path.slice(7));
  else if (path.startsWith("/experience/"))
    content = experience(path.slice(12));
  else content = (routes[path] || notFound)();
  main.innerHTML = content;
  const resetMap = [...main.querySelectorAll('a')].find(a => a.textContent === 'Reset the map');
  if (resetMap) resetMap.addEventListener('click', event => {
    event.preventDefault();
    try { localStorage.removeItem('discover-jordan-filters'); } catch {}
    history.replaceState(null, '', `${location.pathname}${location.search}#/map`);
    render();
  });
  if (path.startsWith('/place/')) {
    const p = byId(path.slice(7));
    if (p) main.querySelector('.detail-story').insertAdjacentHTML('beforeend', practicalInfo(p));
  }
  if (path === '/planner') mountTripTools();
  translateRendered(main);
  if (language() === 'ar' && path.startsWith('/place/')) {
    const back = main.querySelector('.back-link');
    if (back) back.textContent = 'استكشف الوجهات →';
  }
  if (language() === 'ar' && path === '/journey') {
    const title = main.querySelector('h1');
    if (title) title.textContent = t('journalTitle');
  }
  translateStatic();
  if (path === '/planner' && state.authKnown && !state.user && !cleanProfile(state.profile).interests.length) {
    const key = 'discover-jordan-guest-planner-onboarding';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, 'shown');
      setTimeout(() => account(true), 100);
    }
  }
  main.classList.remove("fade-in");
  requestAnimationFrame(() => main.classList.add("fade-in"));
  document.title = `${main.querySelector("h1")?.textContent.trim() || "Explore"} | Discover Jordan`;
  document.querySelectorAll("#navigation a").forEach((a) => {
    const current = a.hash === "#" + path;
    a.toggleAttribute("aria-current", current);
    if (current) a.setAttribute("aria-current", "page");
  });
  document.querySelector("#navigation").classList.remove("open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
  if (focus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  } else if (restore)
    main.querySelector(restore)?.focus({ preventScroll: true });
}
async function persist(id, next) {
  const epoch = state.authEpoch;
  if (state.user) {
    if (!state.cloud || !state.accountReady)
      throw new Error("journal-not-ready");
    if (!navigator.onLine)
      throw Object.assign(new Error("offline"), { code: "unavailable" });
    await state.cloud.saveEntry(state.user.uid, id, next);
  } else {
    writeGuest({ ...state.entries, [id]: next });
  }
  // A different tab may sign out or switch accounts while the write is pending.
  if (epoch !== state.authEpoch)
    throw Object.assign(new Error("account-changed"), {
      code: "auth/account-changed",
    });
  state.entries = { ...state.entries, [id]: next };
}
async function changeEntry(id, patch) {
  if (!byId(id) || state.busy) return;
  state.busy = true;
  try {
    await persist(id, { ...entry(id), ...patch });
    render();
    toast("Your journey is updated.");
  } catch (error) {
    toast(
      error.message === "journal-not-ready"
        ? "Your cloud journal is not ready. Try signing in again."
        : error.name === "QuotaExceededError"
          ? "Browser storage is full. Export your journal or sign in."
          : error.name === "SecurityError"
            ? "Browser storage is blocked. Allow storage or sign in to keep your journal."
            : friendlyError(error),
    );
  } finally {
    state.busy = false;
  }
}
function fillPreferenceForm() {
  const form = document.querySelector("#preferences-form");
  const profile = cleanProfile(state.profile);
  document.querySelector("#interest-options").innerHTML = interestOptions
    .map(
      (item) =>
        `<label class="interest-option"><input type="checkbox" name="interests" value="${item.id}" ${profile.interests.includes(item.id) ? "checked" : ""}><span aria-hidden="true">${item.icon}</span><strong>${esc(interestName(item))}</strong></label>`,
    )
    .join("");
  form.elements.days.value = String(profile.days);
  form.elements.pace.value = profile.pace;
  form.elements.region.value = profile.region;
}
function preferenceFromForm() {
  const form = document.querySelector("#preferences-form");
  const data = new FormData(form);
  return cleanProfile({
    interests: data.getAll("interests").map(String),
    days: data.get("days"),
    pace: data.get("pace"),
    region: data.get("region"),
  });
}
function account(preferencesOnly = false) {
  preferencesOnly = preferencesOnly === true;
  const dialog = document.querySelector("#account-dialog");
  fillPreferenceForm();
  document.querySelector('#preferences-form').hidden = !preferencesOnly;
  document.querySelector("#auth-form").hidden = preferencesOnly || !!state.user || !state.cloud;
  document.querySelector("#account-divider").hidden = true;
  document.querySelector("#signed-in").hidden = preferencesOnly || !state.user;
  document.querySelector('#account-title').textContent = preferencesOnly ? 'Your travel preferences' : 'Save your journey across devices';
  document.querySelector("#account-email").textContent =
    state.user?.email || "";
  document.querySelector("#account-info").textContent = state.cloud
    ? "Sign in to keep your favorites and memories across devices."
    : "Cloud accounts are not connected yet. You can explore and keep a guest journal on this browser.";
  document.querySelector("#auth-message").textContent = "";
  if (preferencesOnly) document.querySelector('#account-info').textContent = 'Plan freely as a guest. No account needed.';
  document.querySelector('#account-title').textContent = preferencesOnly ? t('preferencesTitle') : t('authTitle');
  document.querySelector('#account-info').textContent = preferencesOnly ? t('guestPreferenceInfo') : (state.cloud ? t('authInfo') : document.querySelector('#account-info').textContent);
  translateStatic(); translateRendered(dialog);
  if (!dialog.open) dialog.showModal();
}
async function locate() {
  if (!navigator.geolocation)
    return toast("This browser does not support location.");
  toast("Your browser will ask for location access.");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      render();
      toast("Distances are now available.");
    },
    () => toast("Location was not available. You can still filter by region."),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
}
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.close) {
    document.getElementById(button.dataset.close).close();
    return;
  }
  if (button.hasAttribute("data-account")) {
    account(route().path === '/planner');
    return;
  }
  if (button.hasAttribute("data-locate")) {
    locate();
    return;
  }
  if (button.hasAttribute("data-clear-filters")) {
    try { localStorage.removeItem('discover-jordan-filters'); } catch {}
    const path = route().path;
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#${path}`,
    );
    render();
    return;
  }
  if (button.dataset.favorite) {
    const id = button.dataset.favorite;
    await changeEntry(id, { favorite: !entry(id).favorite });
  }
  if (button.dataset.visit) {
    const id = button.dataset.visit;
    const was = entry(id).visited;
    await changeEntry(id, {
      visited: !was,
      visitedAt: was ? "" : entry(id).visitedAt || today(),
    });
  }
  if (button.dataset.pin) {
    const { params } = route();
    params.set("pin", button.dataset.pin);
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#/map?${params}`,
    );
    render();
  }
  if (button.dataset.gallery) {
    const p = byId(button.dataset.gallery);
    document.querySelector("#gallery-content").innerHTML =
      `<figure>${picture(p)}<figcaption>${photoCredit(p)}</figcaption></figure>`;
    document.querySelector("#gallery-dialog").showModal();
  }
  if (button.dataset.saveRoute) {
    if (state.busy) return;
    state.busy = true;
    button.disabled = true;
    let done = 0;
    try {
      const e = state.experiences.find(
        (e) => e.id === button.dataset.saveRoute,
      );
      for (const id of e.placeIds) {
        if (byId(id)) {
          await persist(id, { ...entry(id), favorite: true });
          done++;
        }
      }
      toast(`${done} route places saved to your wishlist.`);
    } catch (error) {
      toast(`${done} places saved. ${friendlyError(error)}`);
    } finally {
      state.busy = false;
      render();
    }
  }
  if (button.hasAttribute("data-export")) {
    const payload = {
      exportedAt: new Date().toISOString(),
      entries: Object.entries(state.entries).map(([id, value]) => ({
        place: id,
        name: byId(id)?.name || id,
        ...value,
      })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-jordan-journey.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form.id === "home-search") {
    event.preventDefault();
    location.hash =
      "/explore?q=" + encodeURIComponent(new FormData(form).get("q"));
  }
  if (form.id === "filter-form") {
    event.preventDefault();
    updateExplore();
  }
  if (form.id === "map-filters") {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form))
      if (v) params.set(k, k === "hidden" ? "1" : v);
    try { localStorage.setItem('discover-jordan-filters', params.toString()); } catch {}
    location.hash = "/map" + (params.size ? "?" + params : "");
  }
  if (form.dataset.memory) {
    event.preventDefault();
    const data = new FormData(form);
    const date = String(data.get("date"));
    if (!date || date > today())
      return toast("Choose a valid visit date, no later than today.");
    await changeEntry(form.dataset.memory, {
      visited: true,
      visitedAt: date,
      memory: String(data.get("memory")).trim(),
    });
  }
});
document.addEventListener("change", (event) => {
  if (event.target.closest("#filter-form") || event.target.id === "sort")
    updateExplore();
});
document.addEventListener("input", (event) => {
  if (event.target.id === "explore-query") updateExplore();
});
document.addEventListener(
  "error",
  (event) => {
    if (
      event.target instanceof HTMLImageElement &&
      !event.target.src.endsWith("/assets/landscape.svg")
    ) {
      event.target.src = "assets/landscape.svg";
      event.target.alt = "Landscape illustration — image could not load";
    }
  },
  true,
);
document.querySelector("#menu-toggle").addEventListener("click", () => {
  const nav = document.querySelector("#navigation");
  const open = nav.classList.toggle("open");
  document
    .querySelector("#menu-toggle")
    .setAttribute("aria-expanded", String(open));
});
document.querySelector("#account-button").addEventListener("click", account);
document.querySelector('#edit-preferences').addEventListener('click', () => account(true));
document.querySelector('#language-toggle').addEventListener('click', () => setLanguage(language() === 'ar' ? 'en' : 'ar'));
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
document.querySelector("#auth-form").addEventListener("submit", (event) => {
  event.preventDefault();
  authenticate(false);
});
document
  .querySelector("#preferences-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const profile = preferenceFromForm();
    state.planOverride = null;
    const message = document.querySelector("#auth-message");
    if (!profile.interests.length) {
      message.textContent = "Choose at least one interest to personalize your plan.";
      return;
    }
    try { state.profile = state.user ? profile : writeProfile(profile); }
    catch { message.textContent = 'Browser storage is unavailable. Allow storage to remember preferences.'; return; }
    if (state.user && state.cloud) {
      try {
        await state.cloud.saveProfile(state.user.uid, profile);
        message.textContent = "Your travel preferences are saved to your account.";
      } catch (error) {
        message.textContent = friendlyError(error);
        return;
      }
    }
    document.querySelector("#account-dialog").close();
    location.hash = "/planner";
    render({ focus: true });
    toast("Your personal Jordan plan is ready.");
  });
document
  .querySelector("#register")
  .addEventListener("click", () => authenticate(true));
async function authenticate(register) {
  const form = document.querySelector("#auth-form");
  if (!form.reportValidity() || !state.cloud) return;
  const data = new FormData(form);
  const registrationProfile = register ? cleanProfile(state.profile) : null;
  form.querySelectorAll("button").forEach((b) => (b.disabled = true));
  const message = document.querySelector("#auth-message");
  message.textContent = register ? "Creating your account…" : "Signing in…";
  try {
    const credential = await state.cloud[register ? "register" : "signIn"](
      String(data.get("email")).trim(),
      String(data.get("password")),
    );
    if (register) {
      state.profile = registrationProfile;
      if (state.profile.interests.length)
        try {
          await state.cloud.saveProfile(credential.user.uid, state.profile);
        } catch {
          toast("Account created. Preferences are saved on this device until Firestore is ready.");
        }
    }
    form.reset();
    document.querySelector("#account-dialog").close();
    toast(register ? "Your account is ready." : "Welcome back.");
  } catch (error) {
    message.textContent = friendlyError(error);
  } finally {
    form.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
}
document
  .querySelector("#reset-password")
  .addEventListener("click", async () => {
    const email = document.querySelector("#auth-form [name=email]");
    if (!email.reportValidity()) return;
    try {
      await state.cloud.reset(email.value.trim());
      document.querySelector("#auth-message").textContent =
        "If an account exists, a reset email will arrive shortly.";
    } catch (error) {
      document.querySelector("#auth-message").textContent =
        friendlyError(error);
    }
  });
document.querySelector("#sign-out").addEventListener("click", async () => {
  if (state.busy) return;
  try {
    await state.cloud.signOut();
    document.querySelector("#account-dialog").close();
    toast("Signed out. Your guest journal is separate.");
  } catch (error) {
    toast(friendlyError(error));
  }
});
document.querySelector("#import-guest").addEventListener("click", async () => {
  if (state.busy || !state.accountReady) return;
  state.busy = true;
  let count = 0;
  try {
    for (const [id, value] of Object.entries(readGuest()))
      if (byId(id) && !state.entries[id]) {
        await persist(id, value);
        count++;
      }
    document.querySelector("#auth-message").textContent =
      `Copied ${count} new places. Existing account entries were kept.`;
    render();
  } catch (error) {
    document.querySelector("#auth-message").textContent =
      `Copied ${count} places. ${friendlyError(error)}`;
  } finally {
    state.busy = false;
  }
});
window.addEventListener("hashchange", () => render({ focus: true }));
window.addEventListener("storage", (event) => {
  if (!state.user && event.key === "discover-jordan-guest-v1") {
    state.entries = readGuest();
    render();
  }
  if (!state.user && event.key === 'discover-jordan-profile-v1') {
    state.profile = readProfile(); render();
  }
});
window.addEventListener("offline", () =>
  status(
    "You are offline. Loaded places remain available; account changes require a connection.",
  ),
);
window.addEventListener("online", () => {
  status(
    state.cloud
      ? "Connection restored. Reload if your cloud journal did not finish loading."
      : "Preview catalog · cloud accounts are not connected. Guest journal stays on this browser.",
  );
});
async function boot() {
  try {
    await initI18n();
    const response = await fetch("data/catalog.json");
    if (!response.ok) throw new Error("catalog");
    const catalog = await response.json();
    if (!catalog.places?.length || !catalog.places.every(validPlace))
      throw new Error("catalog");
    state.places = catalog.places;
    state.experiences = catalog.experiences;
    render();
    try {
      state.cloud = await connectFirebase();
      if (!state.cloud) {
        status(
          "Preview catalog · cloud accounts are not connected. Guest journal stays on this browser.",
        );
        return;
      }
      state.cloud.observeUser(async (user) => {
        const epoch = ++state.authEpoch;
        state.user = user;
        state.authKnown = true;
        state.planOverride = user ? state.pendingTrip || null : null;
        state.pendingTrip = null;
        state.accountReady = false;
        state.entries = user ? {} : readGuest();
        state.profile = user ? cleanProfile() : readProfile();
        document.querySelector("#account-button").textContent = user
          ? (language() === 'ar' ? 'حسابي ↖' : 'My account ↗')
          : t('signIn');
        render();
        if (user) {
          try {
            const entries = await state.cloud.entries(user.uid);
            if (epoch !== state.authEpoch) return;
            state.entries = entries;
            try {
              const cloudProfile = await state.cloud.profile(user.uid);
              if (epoch !== state.authEpoch) return;
              if (cloudProfile) state.profile = cleanProfile(cloudProfile);
              else {
                // Creating the default profile makes this account-level onboarding a one-time step across devices.
                await state.cloud.saveProfile(user.uid, state.profile);
                const key = `discover-jordan-onboarding-${user.uid}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, 'shown');
                  setTimeout(() => {
                    if (state.user?.uid === user.uid) {
                      account(true);
                      document.querySelector('#auth-message').textContent = t('accountOnboarding');
                    }
                  }, 100);
                }
              }
            } catch {
              // Keep the device profile if cloud preferences are unavailable.
            }
            state.accountReady = true;
            render();
          } catch (error) {
            if (epoch === state.authEpoch) {
              status(
                "Your cloud journal could not load. Sign out and sign in to retry.",
              );
              toast(friendlyError(error));
            }
          }
        }
      });
      try {
        state.places = (await state.cloud.places()).map(p => ({ ...p, practical: p.practical || catalog.places.find(local => local.id === p.id)?.practical }));
        status("");
        render();
      } catch {
        status(
          "Cloud catalog unavailable. Showing the bundled guide; account saves still require a connection.",
        );
      }
    } catch {
      status(
        "Cloud connection unavailable. Explore the bundled guide and use your guest journal.",
      );
    }
  } catch {
    main.innerHTML =
      '<div class="empty"><h1>The guide could not load.</h1><p>Check your connection and reload this page.</p><button class="button" id="retry">Try again</button></div>';
    document.querySelector("#retry").onclick = boot;
  }
}
boot();
