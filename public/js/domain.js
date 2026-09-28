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
