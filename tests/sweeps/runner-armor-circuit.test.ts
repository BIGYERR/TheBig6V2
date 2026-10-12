// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The runner armor circuit, the lattices: the same claims as tests/integration/runner-armor-circuit.test.js, which runs
// them on samples; this file runs them whole. CI runs it, the 60-second check does not.
//   - floor (b): g215's knee protect lattice, 630 configs (five tiers x six goals x seven foci x three experiences), each
//     built on the app and on the app with floor (b) written out. Ruled: it fires on home_full 84 of 126, on every other
//     tier 0 of 126, on the 90 prevention configs never.
//   - the prevention shard: 264 programs (216 FULL prevention, 48 injured prevention) read against the app without
//     part A, and 8 bodyweight low back programs for the universe. Counts today are golden values in
//     tests/snapshots/runner-armor-circuit-lattice.json (how many runner leg days carry the fourth item, what part A
//     took off them, by section).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { matchSnapshot } from '../support/snapshot.ts';
import * as RA from '../support/runner-armor-circuit.ts';
// ── floor (b) ────────────────────────────────────────────────────────────────────────────────────────────────────
const LAT = RA.floorBLattice();
const FB = RA.floorBFires(LAT);

test('the knee protect lattice is 630 configs, 126 per tier, 90 of them prevention, and every one builds on both apps', () => {
  // D195-A-e: e-anchor, e-lattice
  assert.equal(LAT.length, 630);
  assert.deepEqual(FB.crashed, []);
  assert.equal(FB.built, 630);
  for (const t of RA.FB_TIERS) assert.equal(FB.count[t], 126, t);
  assert.equal(FB.prevN, 90);
});

test('floor (b) fires on home_full 84 of 126 and on no other tier', () => {
  // D195-A-e: e-home_full, e-others
  assert.equal(FB.fire.home_full, 84);
  for (const t of RA.FB_TIERS.filter((x) => x !== 'home_full')) assert.equal(FB.fire[t], 0, t);
});

test('floor (b) never fires on a prevention config', () => {
  // D195-A-e: e-prev
  assert.equal(FB.prevFire, 0);
});

// ── the prevention shard ─────────────────────────────────────────────────────────────────────────────────────────
const SH = RA.preventionShard();
const S = RA.shardBuild(SH);
const AB = S.filter((r) => r.x.ab);
const D = [];
AB.forEach((r) => r.days.forEach((z) => D.push(Object.assign({ r, a: RA.analyse(z) }, z))));
const run = D.filter((z) => z.r.runner), non = D.filter((z) => !z.r.runner), knee = D.filter((z) => z.r.x.inj === 'knee/protect');

test('the shard is 264 programs (216 FULL, 48 injured) plus 8 bodyweight low back, each built on both apps, the before twice and equal', () => {
  // D195-A-b: b-notA (built and self-identical), b-shard; D195-A-f: f-shard
  assert.equal(AB.length, 264);
  assert.equal(AB.filter((r) => r.x.L === 'FULL').length, 216);
  assert.equal(AB.filter((r) => r.x.L === 'INJ').length, 48);
  assert.equal(S.filter((r) => r.x.L === 'INJ-LB').length, 8);
  assert.deepEqual(S.filter((r) => r.crash.length).map((r) => r.x.tag), []);
  assert.ok(S.every((r) => r.self && r.hasU));
  assert.ok(AB.every((r) => RA.RUNNER[r.x.fam] === ((r.x.c.cardioTypes || []).indexOf('run') >= 0)), 'the hand runner table agrees with every config');
  assert.ok(run.length > 0 && non.length > 0 && knee.length > 0);
});

test("part A appends one item to a runner's circuit and grows no circuit on a non-runner or knee protect day", () => {
  // D195-A-b: b-fourth, b-add, b-knee
  assert.ok(run.some((z) => z.a.appended));
  assert.deepEqual(non.concat(knee).filter((z) => z.a.grew).map((z) => z.tag), []);
  assert.deepEqual(run.filter((z) => !z.a.addOK).map((z) => z.tag), []);
  assert.deepEqual(knee.filter((z) => z.Ci.length !== z.Ni.length).map((z) => z.tag), []);
});

test('part A takes only from the loaded carry finisher or the core block, and never empties the core block', () => {
  // D195-A-b: b-rem
  assert.deepEqual(run.filter((z) => z.a.remBad.length || z.a.coreEmptied).map((z) => z.tag), []);
});

test("the circuit's first two names and its rounds stay, the calf stays wherever it was, and non-runner leg days are byte-identical", () => {
  // D195-A-b: b-circ, b-calf, b-nonrun
  assert.deepEqual(run.filter((z) => !z.a.lit12 || !z.a.rounds).map((z) => z.tag), []);
  assert.deepEqual(D.filter((z) => z.calfN && !z.calfC).map((z) => z.tag), []);
  assert.deepEqual(non.filter((z) => !z.same).map((z) => z.tag), []);
});

test('part A moves no name in any swap universe, and the bodyweight low back programs carry the bed hip thrust', () => {
  // D195-A-f: f-nonbw, f-bwlb, f-other
  for (const r of S) assert.deepEqual([...r.uC].sort(), [...r.uN].sort(), r.x.tag);
  const lb = S.filter((r) => r.x.L === 'INJ-LB');
  assert.ok(lb.length >= 1);
  for (const r of lb) assert.ok(r.uC.has(RA.BED_THRUST), r.x.tag);
});

test('the shard counts match tests/snapshots/runner-armor-circuit-lattice.json', () => {
  const remIt = run.flatMap((z) => z.a.remIt);
  const by = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
  matchSnapshot('runner-armor-circuit-lattice', {
    floorB: { fires: FB.fire, configsPerTier: FB.count },
    shard: {
      legDays: D.length, runnerLegDays: run.length, nonRunnerLegDays: non.length, kneeProtectLegDays: knee.length,
      runnerDaysWithTheFourthItem: run.filter((z) => z.a.appended).length,
      fourthItemByFamily: by(run.filter((z) => z.a.appended), (z) => z.r.x.fam),
      itemsRemovedBySection: by(remIt, (i) => (/^Loaded carry finisher/.test(i.lab) ? 'carry finisher' : i.core ? 'core block' : i.lab)),
      calfDays: D.filter((z) => z.calfN).length,
    },
  });
});
