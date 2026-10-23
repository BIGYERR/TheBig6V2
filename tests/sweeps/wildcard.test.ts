// The day a Wildcard is stamped on, across daylight saving changes in seven time zones: New York, London, Sydney, Lord
// Howe (a half hour change), Chatham (a 12:45 offset), UTC and Kolkata (no change at all). Rulings D64 and D71: the
// day is resolved from the date, never from the week the athlete is browsing.
//
// Each zone runs in its own child process (`TZ=<zone> node tests/support/wildcard.js --dst`), so the zone is in force
// before Node reads the clock. Fourteen hand-built blocks put a change inside the block or on its start date, or start
// mid week, on a Saturday, across a new year and in a leap February; every day from ten days before the block's Monday
// to ten days after its end is resolved by wildcardDayFor and compared with calendar arithmetic (Date(y, m, d + n),
// never a millisecond division), then mapped back through dayDateFor. Eleven edges follow: the Sunday wrap, rest days,
// the first and last days, the days outside the block, and programs with a missing day, no start date or no program.
// tests/integration/wildcard.test.js runs the same lattice in New York.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { TZ_LATTICE, DST_CASES, dstLatticeIn } from '../support/wildcard.ts';
const ROWS = DST_CASES.map((c) => c[0]).concat([
  'dst15-sunday-wrap', 'dst16-rest-resolves', 'dst17-sched-drops-rest', 'dst18-before-start', 'dst19-week1-monday',
  'dst20-first-day', 'dst21-last-day', 'dst22-after-end', 'dst23-missing-day', 'dst24-no-start', 'dst25-no-prog',
]);

for (const zone of TZ_LATTICE) {
  test(`in ${zone} every day of every block resolves to the hand calendar and back, edges and odd programs included`, () => {
    const r = dstLatticeIn(zone);
    assert.ok(r.ran, 'the lattice child ran to its end: ' + r.error);
    assert.deepEqual(Object.keys(r.rows).sort(), ROWS.slice().sort(), 'one result for each of the 25 cases');
    assert.deepEqual(ROWS.filter((id) => !r.rows[id].ok).map((id) => id + ': ' + r.rows[id].detail), []);
  });
}
