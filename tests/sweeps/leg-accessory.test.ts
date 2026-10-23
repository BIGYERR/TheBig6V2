// The leg accessory blocks, the lattice: the same claims as tests/integration/leg-accessory.test.js, which runs them on
// a 56-config sample; this file runs all 3,528 configs (six tiers plus travel Room-only x seven foci x three
// experiences x four goals x three seeds x two rest patterns). CI runs it, the 60-second check does not.
// Golden values, current, in tests/snapshots/leg-accessory-lattice.json: the denial census per tier (machine and cable
// items a tier does not own; 0 everywhere since D70c), the same-card duplicates (0 since D165), the section, Wall sit
// and bodyweight name counts. A ruling that moves them regenerates the file.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { matchSnapshot } from '../support/snapshot.ts';
import * as LA from '../support/leg-accessory.ts';
const L = LA.fullLattice();
const S = LA.legSweep(LA.page(), L);

test('the lattice is 3,528 configs and every one builds', () => {
  // B0
  assert.equal(L.length, 3528);
  assert.deepEqual(S.threw, []);
  assert.equal(S.builds, 3528);
});

test('no item on any card lacks a name', () => {
  // B1
  assert.equal(S.undef, 0);
});

test('the Leg isolation section still opens, and carries a harvested name', () => {
  // B2, B3
  assert.ok(S.secTotal > 0);
  assert.ok(S.secWithHarvest > 0);
});

test('no tier prints a machine or cable item it does not own, and no leg machine reaches a tier without cables', () => {
  // B4a to B4h (the ruling's after-grid: 0), B4m
  for (const t of LA.TIERS_PLUS) { assert.equal(S.census[t].machine, 0, t + ' machine'); assert.equal(S.census[t].cable, 0, t + ' cable'); }
  for (const t of ['crossfit', 'home_basic', 'home_full', 'bodyweight', 'minimal', 'travel_room_only']) for (const m of LA.MACHINES) assert.ok(!S.census[t].names[m], t + ' ' + m);
});

test('no name prints twice on one card, a harvested name least of all', () => {
  // B5a, B5b (ceiling 415), B5d (nowhere near 955); the exact count is B5c in the snapshot
  assert.equal(S.harvestedDup, 0);
  assert.ok(S.dup <= 415 && S.dup < 955, String(S.dup));
});

test('Wall sit reaches the section and always prints n×25 sec, never a rep count', () => {
  // B6a, B6b
  assert.ok(S.wallInSection > 0);
  assert.equal(S.wallBadDose, 0);
});

test('the bodyweight section prints leg movements only, none of the old fallback substitutes', () => {
  // B7a, B7b, B7c
  const bw = Object.keys(S.bwNames);
  assert.ok(bw.length > 0);
  for (const n of bw) assert.ok(LA.LEG_WORDS.test(n), n);
  assert.ok(!bw.some((n) => /pushup|inverted row|burpee|y-t-w/i.test(n)), bw.join(', '));
});

test('the lattice counts match tests/snapshots/leg-accessory-lattice.json', () => {
  // B4i, B4j, B4k, B4l (home_full machine and cable items and their names: the legacy era rows, 0 and none), B5c (the
  // same-card duplicate era row, 0)
  matchSnapshot('leg-accessory-lattice', {
    builds: S.builds, dayCells: S.dayCells, legIsolationSections: S.secTotal, sectionsWithAHarvestedName: S.secWithHarvest,
    wallSitsInTheSection: S.wallInSection, sameCardDuplicates: S.dup, bodyweightSectionNames: S.bwNames, denials: S.census,
  });
});
