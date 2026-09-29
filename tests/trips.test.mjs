import test from 'node:test';
import assert from 'node:assert/strict';
import { tripMetrics, tripSnapshot, restoreTrip, visitHours } from '../public/js/trips.js';
import { createPdfFromJpegs } from '../public/js/pdf.js';
const a = { id:'a', name:'A', coordinates:{lat:31,lng:35}, recommendedDuration:'Half Day' };
const b = { id:'b', name:'B', coordinates:{lat:32,lng:35}, recommendedDuration:'2 Hours' };
const days = [{ number:1, stops:[{place:a}] }, { number:2, stops:[{place:b}] }];
test('metrics include transfers between days and visit time', () => {
  const m = tripMetrics(days);
  assert.equal(m.stops,2); assert.equal(m.legs.length,1);
  assert.ok(m.km > 149 && m.km < 151);
  assert.equal(m.totalHours, 6 + m.travelHours);
  assert.equal(tripMetrics([days[0]]).km,0);
  assert.equal(visitHours({recommendedDuration:'Half to full day'}),8);
});
test('Firestore-safe snapshots round-trip without private data', () => {
  const snapshot = tripSnapshot(days);
  assert.deepEqual(snapshot,{version:1,days:[{stops:['a']},{stops:['b']}]});
  assert.equal(restoreTrip(snapshot,[a,b])[1].stops[0].place,b);
});
test('shared route validation rejects unknown, duplicate and oversized data', () => {
  for (const value of [{version:1,days:[]},{version:1,days:[{stops:['x']}]},{version:1,days:[{stops:['a','a']}]},{version:1,days:Array(8).fill({stops:['a']})}]) assert.throws(() => restoreTrip(value,[a,b]));
});
test('client PDF writer creates a downloadable PDF container', async () => {
  const blob = createPdfFromJpegs([new Uint8Array([255,216,255,217])], 1, 1);
  assert.equal(blob.type, 'application/pdf');
  const text = new TextDecoder().decode(await blob.arrayBuffer());
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.match(text, /\/Type \/Page/);
  assert.ok(text.endsWith('%%EOF'));
});
