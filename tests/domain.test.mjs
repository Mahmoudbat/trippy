// Node is only a test runner here. The deployed site has no Node backend or build step.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  filterPlaces,
  distanceKm,
  achievements,
  explorerLevel,
  escapeHTML,
  safeURL,
  validPlace,
  cleanEntry,
} from "../public/js/domain.js";
const catalog = JSON.parse(
  readFileSync(new URL("../public/data/catalog.json", import.meta.url), "utf8"),
);
const places = catalog.places;
test("all catalog records validate, have unique IDs and include the original destinations", () => {
  assert.equal(places.length, 27);
  assert.ok(places.every(validPlace));
  assert.equal(new Set(places.map((p) => p.id)).size, places.length);
  for (const id of [
    "petra",
    "wadi-rum",
    "jerash",
    "dead-sea",
    "ajloun",
    "mount-nebo",
    "wadi-mujib",
    "umm-qais",
    "dana",
    "baptism-site",
    "main-hot-springs",
    "madaba",
    "wadi-bin-hammad",
    "dana-villages",
    "wadi-al-hasa",
    "umm-qais-viewpoints",
  ])
    assert.ok(
      places.some((p) => p.id === id),
      id,
    );
});
test("English and Arabic search find the same place", () => {
  assert.deepEqual(
    filterPlaces(places, { q: "PETRA" }).map((p) => p.id),
    ["petra"],
  );
  assert.deepEqual(
    filterPlaces(places, { q: "البتراء" }).map((p) => p.id),
    ["petra"],
  );
  assert.ok(
    filterPlaces(places, { q: "ام قيس" }).some((p) => p.id === "umm-qais"),
  );
});
test("category, region and visited filters compose rather than replace each other", () => {
  const entries = { jerash: { visited: true }, petra: { visited: true } };
  assert.deepEqual(
    filterPlaces(
      places,
      { category: "Culture", region: "North Jordan", status: "visited" },
      entries,
    ).map((p) => p.id),
    ["jerash"],
  );
  assert.equal(filterPlaces(places, { q: "no-such-place" }).length, 0);
});
test("reset filters includes all places; hidden filter excludes ordinary places", () => {
  assert.equal(filterPlaces(places, {}).length, places.length);
  assert.ok(filterPlaces(places, { hidden: true }).every((p) => p.isHiddenGem));
});
test("unscored places cannot pass a minimum score filter", () => {
  const found = filterPlaces(places, { rating: "4.5" });
  assert.ok(found.length > 0);
  assert.ok(found.every((p) => p.rating >= 4.5));
});
test("distance uses geographic coordinates, and cannot silently run without a location", () => {
  assert.equal(distanceKm({ lat: 30, lng: 35 }, { lat: 30, lng: 35 }), 0);
  assert.ok(
    Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 111.195) <
      0.1,
  );
  assert.equal(filterPlaces(places, { distance: "50" }, {}).length, 0);
  const found = filterPlaces(
    places,
    { distance: "50" },
    {},
    { lat: 30.3285, lng: 35.4444 },
  );
  assert.ok(found.some((p) => p.id === "petra"));
  assert.ok(!found.some((p) => p.id === "jerash"));
});
test("favorites and visit status are independent", () => {
  const entries = {
    petra: { favorite: true, visited: false },
    jerash: { favorite: false, visited: true },
  };
  assert.deepEqual(
    filterPlaces(places, { status: "saved" }, entries).map((p) => p.id),
    ["petra"],
  );
  assert.deepEqual(
    filterPlaces(places, { status: "visited" }, entries).map((p) => p.id),
    ["jerash"],
  );
});
test("badges are earned from actual visits and reverse when a visit is removed", () => {
  assert.equal(achievements(places, {}).filter((b) => b.unlocked).length, 0);
  const entries = {
    "wadi-rum": { visited: true },
    petra: { visited: true },
    jerash: { visited: true },
    ajloun: { visited: true },
  };
  const earned = achievements(places, entries)
    .filter((b) => b.unlocked)
    .map((b) => b.title);
  assert.ok(earned.includes("History Explorer"));
  assert.ok(earned.includes("Desert Explorer"));
  entries.petra.visited = false;
  assert.equal(
    achievements(places, entries).find((b) => b.title === "History Explorer")
      .unlocked,
    false,
  );
});
test("levels respect real catalog size and thresholds", () => {
  assert.equal(explorerLevel(0, 27), "Seeker");
  assert.equal(explorerLevel(3, 27), "Bronze Explorer");
  assert.equal(explorerLevel(27, 27), "Jordan Master");
});
test("experience stops reference existing destinations", () => {
  assert.equal(catalog.experiences.length, 4);
  for (const route of catalog.experiences) {
    assert.equal(route.route.length, route.placeIds.length);
    for (const id of route.placeIds)
      assert.ok(
        places.some((p) => p.id === id),
        id,
      );
  }
});
test("catalog images exist locally and attribution accompanies photographs", () => {
  for (const p of places) {
    assert.ok(
      existsSync(
        fileURLToPath(new URL("../public/" + p.image, import.meta.url)),
      ),
      p.image,
    );
    for (const image of p.images) {
      assert.ok(image.credit);
      assert.match(image.license, /CC|Public domain/i);
      assert.match(image.source, /^https:\/\//);
    }
  }
});
test("HTML escaping and URL validation reject executable content", () => {
  assert.equal(escapeHTML('<script>"&'), "&lt;script&gt;&quot;&amp;");
  assert.equal(safeURL("javascript:alert(1)"), "assets/landscape.svg");
  assert.equal(safeURL("assets/../../secret"), "assets/landscape.svg");
  assert.equal(
    safeURL("https://example.com/photo.jpg"),
    "https://example.com/photo.jpg",
  );
});
test("entry normalization limits memory and rejects malformed values", () => {
  assert.deepEqual(
    cleanEntry({ favorite: "true", visited: 1, visitedAt: "bad", memory: "x" }),
    { favorite: false, visited: false, visitedAt: "", memory: "x" },
  );
  assert.equal(cleanEntry({ memory: "a".repeat(3000) }).memory.length, 2000);
});
