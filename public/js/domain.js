export const categories = [
  "Culture",
  "Religion",
  "Adventure",
  "Nature",
  "Wellness",
];
export const regions = ["North Jordan", "Central Jordan", "South Jordan"];
export const icons = {
  Culture: "⌂",
  Religion: "☼",
  Adventure: "△",
  Nature: "❋",
  Wellness: "≈",
};
export const colors = {
  Culture: "#bd9064",
  Religion: "#89aedb",
  Adventure: "#e8995a",
  Nature: "#8eba88",
  Wellness: "#c1a0d8",
};
export const interestOptions = [
  { id: "history", label: "History & archaeology", icon: "⌂" },
  { id: "nature", label: "Nature & wildlife", icon: "❋" },
  { id: "adventure", label: "Adventure & hiking", icon: "△" },
  { id: "spiritual", label: "Spiritual places", icon: "☼" },
  { id: "wellness", label: "Wellness & relaxation", icon: "≈" },
  { id: "photography", label: "Photography", icon: "◎" },
  { id: "culture", label: "Local culture", icon: "✦" },
  { id: "hidden", label: "Hidden gems", icon: "◇" },
];
const interestRules = {
  history: {
    categories: ["Culture"],
    tokens: ["history", "historic", "ancient", "roman", "ruins", "castle", "mosaic", "medieval", "byzantine", "unesco"],
  },
  nature: {
    categories: ["Nature"],
    tokens: ["nature", "forest", "wildlife", "biosphere", "waterfall", "landscape"],
  },
  adventure: {
    categories: ["Adventure"],
    tokens: ["adventure", "hiking", "canyon", "canyoning", "swimming", "desert"],
  },
  spiritual: {
    categories: ["Religion"],
    tokens: ["religion", "spiritual", "sacred", "biblical", "christian", "moses"],
  },
  wellness: {
    categories: ["Wellness"],
    tokens: ["wellness", "relaxation", "thermal", "hot springs", "slow travel"],
  },
  photography: {
    categories: [],
    tokens: ["photography", "panorama", "landscape", "stargazing"],
  },
  culture: {
    categories: ["Culture"],
    tokens: ["culture", "village", "bedouin", "architecture", "local discovery"],
  },
  hidden: {
    categories: [],
    tokens: ["hidden gem", "discovery", "local discovery"],
    hidden: true,
  },
};
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function safeURL(value) {
  if (typeof value !== "string") return "assets/landscape.svg";
  if (/^assets\/[a-zA-Z0-9._/-]+$/.test(value) && !value.includes(".."))
    return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "assets/landscape.svg";
  } catch {
    return "assets/landscape.svg";
  }
}
export function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLowerCase()
    .trim();
}
export function distanceKm(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat),
    dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function filterPlaces(places, filters, entries = {}, location = null) {
  const q = normalize(filters.q);
  return places
    .filter((p) => {
      const entry = entries[p.id] || {};
      if (
        q &&
        !normalize(
          [
            p.name,
            p.arabicName,
            p.region,
            p.regionCity,
            p.category,
            ...p.tags,
          ].join(" "),
        ).includes(q)
      )
        return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.region && p.region !== filters.region) return false;
      if (filters.hidden && !p.isHiddenGem) return false;
      if (
        filters.rating &&
        (p.rating == null || p.rating < Number(filters.rating))
      )
        return false;
      if (filters.status === "visited" && !entry.visited) return false;
      if (filters.status === "unvisited" && entry.visited) return false;
      if (filters.status === "saved" && !entry.favorite) return false;
      if (
        filters.distance &&
        (!location ||
          distanceKm(location, p.coordinates) > Number(filters.distance))
      )
        return false;
      return true;
    })
    .sort((a, b) =>
      filters.sort === "name"
        ? a.name.localeCompare(b.name)
        : filters.sort === "distance" && location
          ? distanceKm(location, a.coordinates) -
            distanceKm(location, b.coordinates)
          : filters.sort === "rating"
            ? (b.rating || 0) - (a.rating || 0)
            : 0,
    );
}
export function achievements(places, entries) {
  const visited = places.filter((p) => entries[p.id]?.visited);
  const count = (category) =>
    visited.filter((p) => p.category === category).length;
  const north = places.filter((p) => p.region === "North Jordan");
  return [
    {
      title: "History Explorer",
      icon: "⌂",
      description: "Visit 3 cultural places",
      unlocked: count("Culture") >= 3,
    },
    {
      title: "Desert Explorer",
      icon: "△",
      description: "Visit Wadi Rum",
      unlocked: !!entries["wadi-rum"]?.visited,
    },
    {
      title: "Sea Explorer",
      icon: "≈",
      description: "Visit the Dead Sea or Aqaba",
      unlocked: !!(entries["dead-sea"]?.visited || entries.aqaba?.visited),
    },
    {
      title: "Spiritual Traveler",
      icon: "☼",
      description: "Visit 2 religious places",
      unlocked: count("Religion") >= 2,
    },
    {
      title: "Hidden Jordan",
      icon: "✦",
      description: "Visit a hidden gem",
      unlocked: visited.some((p) => p.isHiddenGem),
    },
    {
      title: "Northern Trails",
      icon: "❋",
      description: "Visit every northern destination",
      unlocked: north.length > 0 && north.every((p) => entries[p.id]?.visited),
    },
  ];
}
export function explorerLevel(count, total) {
  return count === total && total > 0
    ? "Jordan Master"
    : count >= 10
      ? "Gold Explorer"
      : count >= 6
        ? "Silver Explorer"
        : count >= 3
          ? "Bronze Explorer"
          : count > 0
            ? "Wanderer"
            : "Seeker";
}
export function cleanProfile(raw = {}) {
  if (!raw || typeof raw !== "object") raw = {};
  const allowed = new Set(interestOptions.map((item) => item.id));
  const selected = Array.isArray(raw.interests)
    ? [...new Set(raw.interests.filter((id) => allowed.has(id)))].slice(0, 8)
    : [];
  const days = Math.max(1, Math.min(7, Number.parseInt(raw.days, 10) || 3));
  const pace = ["relaxed", "balanced", "full"].includes(raw.pace)
    ? raw.pace
    : "balanced";
  const region = regions.includes(raw.region) ? raw.region : "Any region";
  return { interests: selected, days, pace, region };
}
export function recommendPlaces(places, rawProfile, entries = {}) {
  const profile = cleanProfile(rawProfile);
  const chosen = profile.interests.length ? profile.interests : ["culture", "nature"];
  return places
    .map((place) => {
      const text = normalize(
        [place.category, ...place.tags, ...place.perfectFor].join(" "),
      );
      let matchScore = (place.rating || 0) * 0.25;
      const matchReasons = [];
      for (const id of chosen) {
        const rule = interestRules[id];
        if (!rule) continue;
        let matched = false;
        if (rule.categories.includes(place.category)) {
          matchScore += 5;
          matched = true;
        }
        const tokenMatches = rule.tokens.filter((token) => text.includes(token));
        if (tokenMatches.length) {
          matchScore += Math.min(3, tokenMatches.length * 1.25);
          matched = true;
        }
        if (rule.hidden && place.isHiddenGem) {
          matchScore += 4;
          matched = true;
        }
        if (matched)
          matchReasons.push(
            interestOptions.find((item) => item.id === id)?.label || id,
          );
      }
      if (profile.region !== "Any region" && place.region === profile.region) {
        matchScore += 3;
        matchReasons.push(profile.region);
      }
      if (entries[place.id]?.favorite) matchScore += 1.5;
      if (entries[place.id]?.visited) matchScore -= 5;
      return {
        place,
        matchScore,
        matchReasons: [...new Set(matchReasons)].slice(0, 3),
      };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        (b.place.rating || 0) - (a.place.rating || 0) ||
        a.place.name.localeCompare(b.place.name),
    );
}
export function buildItinerary(places, rawProfile, entries = {}) {
  const profile = cleanProfile(rawProfile);
  const stopsPerDay = { relaxed: 1, balanced: 2, full: 3 }[profile.pace];
  const candidateCount = Math.min(places.length, profile.days * stopsPerDay);
  const regionIndex = { "North Jordan": 0, "Central Jordan": 1, "South Jordan": 2 };
  const selected = recommendPlaces(places, profile, entries).slice(0, candidateCount);
  const reverse = regionIndex[selected[0]?.place.region] === 2;
  const remaining = selected.sort((a, b) =>
    (reverse ? regionIndex[b.place.region] - regionIndex[a.place.region] : regionIndex[a.place.region] - regionIndex[b.place.region]) || b.matchScore - a.matchScore,
  );
  const visitHours = place => {
    const text = place.recommendedDuration.toLowerCase();
    if (text.includes('full')) return 8;
    if (text.includes('half')) return 4;
    if (text.includes('day')) return 8;
    return Number(text.match(/\d+/)?.[0] || 2);
  };
  const days = [];
  for (let number = 1; number <= profile.days && remaining.length; number++) {
    const stops = [remaining.shift()];
    while (stops.length < stopsPerDay && remaining.length) {
      const current = stops.at(-1).place;
      let bestIndex = -1;
      let bestValue = Infinity;
      remaining.forEach((candidate, index) => {
        if (candidate.place.region !== stops[0].place.region) return;
        const visitTime = stops.reduce((sum, stop) => sum + visitHours(stop.place), 0) + visitHours(candidate.place);
        const routeStops = [...stops, candidate];
        const travelTime = routeStops.slice(1).reduce((sum, stop, i) => sum + distanceKm(routeStops[i].place.coordinates, stop.place.coordinates) * 1.35 / 50, 0);
        if (travelTime > 3) return;
        if (visitTime + travelTime > ({ relaxed: 8, balanced: 10, full: 12 }[profile.pace])) return;
        const routeValue = distanceKm(current.coordinates, candidate.place.coordinates) - candidate.matchScore * 2;
        if (routeValue < bestValue) {
          bestValue = routeValue;
          bestIndex = index;
        }
      });
      if (bestIndex < 0) break;
      stops.push(remaining.splice(bestIndex, 1)[0]);
    }
    days.push({ number, stops });
  }
  return days;
}
export function validPlace(p) {
  return (
    p &&
    /^[a-z0-9-]{1,80}$/.test(p.id) &&
    [
      "name",
      "arabicName",
      "regionCity",
      "description",
      "whyVisit",
      "bestTime",
      "recommendedDuration",
    ].every((k) => typeof p[k] === "string" && p[k].length < 5000) &&
    categories.includes(p.category) &&
    regions.includes(p.region) &&
    Array.isArray(p.tags) &&
    p.tags.every((t) => typeof t === "string") &&
    Array.isArray(p.perfectFor) &&
    p.perfectFor.every((t) => typeof t === "string") &&
    typeof p.image === "string" &&
    Array.isArray(p.images) &&
    p.images.every(
      (im) =>
        im &&
        ["src", "credit", "license", "source"].every(
          (k) => typeof im[k] === "string",
        ),
    ) &&
    (p.rating === null ||
      (Number.isFinite(p.rating) && p.rating >= 0 && p.rating <= 5)) &&
    Number.isFinite(p.coordinates?.lat) &&
    p.coordinates.lat >= 29 &&
    p.coordinates.lat <= 34 &&
    Number.isFinite(p.coordinates?.lng) &&
    p.coordinates.lng >= 34 &&
    p.coordinates.lng <= 40
  );
}
export function cleanEntry(raw = {}) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    favorite: raw.favorite === true,
    visited: raw.visited === true,
    visitedAt: /^\d{4}-\d{2}-\d{2}$/.test(raw.visitedAt || "")
      ? raw.visitedAt
      : "",
    memory: String(raw.memory || "").slice(0, 2000),
  };
}
