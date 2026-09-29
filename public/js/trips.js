import { distanceKm } from './domain.js';

export function visitHours(place) {
  const text = (place.recommendedDuration || '').toLowerCase();
  if (/full/.test(text)) return 8;
  if (/half/.test(text)) return 4;
  if (/day|full/.test(text)) return 8;
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number);
  return numbers?.length ? Math.max(...numbers) : 2;
}
export function tripMetrics(days) {
  let previous, km = 0, visit = 0, stops = 0;
  const legs = [];
  for (const day of days) for (const { place } of day.stops) {
    if (previous) {
      const distance = distanceKm(previous.coordinates, place.coordinates) * 1.35;
      km += distance;
      legs.push({ from: previous.name, to: place.name, km: distance, hours: distance / 50 });
    }
    visit += visitHours(place);
    previous = place;
    stops++;
  }
  return { km, travelHours: km / 50, totalHours: visit + km / 50, stops, legs };
}
export function tripSnapshot(days) {
  return { version: 1, days: days.map(day => ({ stops: day.stops.map(({ place }) => place.id) })) };
}
export function restoreTrip(value, places) {
  if (value?.version !== 1 || !Array.isArray(value.days) || !value.days.length || value.days.length > 7) throw new Error('Invalid trip');
  const used = new Set();
  return value.days.map((day, index) => {
    const ids = day?.stops;
    if (!Array.isArray(ids) || !ids.length || ids.length > 3) throw new Error('Invalid day');
    return { number: index + 1, stops: ids.map(id => {
      const place = places.find(p => p.id === id);
      if (!place || used.has(id)) throw new Error('Unknown or repeated stop');
      used.add(id);
      return { place, matchReasons: [] };
    }) };
  });
}
