'use strict';
// The long-run day: what the lifting looks like on the day that carries the week's long run. Rulings:
//   D18, D140  the run is the day, by time on feet: 75 minutes and up is post-run mobility only (tier A); 45 to 75 is
//              upper body and trunk, no hinge, leg or plyo item, no power, explosive or carry section, 8 working sets
//              or fewer (tier B); under 45 is a normal day (tier C). No tier carries a carry. D140 extended it from NRC
//              long runs to NSW run cards keyed 'long';
//   D153       tier B bans the pattern, not the load: no hinge or hip extension prints on a tier B long-run day;
//   D155       no tier B long-run day ends with no lifting: a recovery week's loaded full-body day keeps its Upper
//              superset;
//   D156       the long day is a class: the loaded full-body finisher (Arms or Delts) never prints on a long day;
//   D187, D188 the stand-in's minutes moved with the pace clock (W11 crosses 75 minutes), and a beginner who enters a
//              mile is read, so the carry case's W6 Friday moved from tier B to C.
// The record is in the handoff and tests/measure/v209_rulings/ to v216_rulings/ and v225_rulings/, v226_rulings/.
//
// The tiers, the hinge list, the set count and the stand-in's grid are typed in tests/support/long-run-day.js and
// below. This file runs the hand fixtures and a sample of each lattice; tests/sweeps/long-run-day.test.js runs the
// lattices whole (D140's 672 programs; D153's 8,040; D156's further 1,200).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { progDigest } = require('../support/app.js');
const R = require('../support/run-week-layout.js');
const T = require('../support/long-run-day.js');

let STAND_P = null;
const stand = () => STAND_P || (STAND_P = R.build(T.STAND));

test('the stand-in, an NRC tier program and a multi-sport NSW program each equal themselves built twice', () => {
  const cfgs = [T.STAND, T.tierLattice().find(x => x.limb === 'NRC').cfg, T.finisherLattices().multi[0].c];
  for (const c of cfgs) assert.equal(progDigest(R.build(c)), progDigest(R.build(c)), c.cardioGoals.run.id);
});

test("the stand-in's Saturday long runs, by dose arithmetic: 33.0 38.3 43.5 30.5 48.5 53.7 58.8 40.6 63.5 69.5 76.5 minutes, tiers C C C C B B B C B B A", () => {
  // W1 is the 8:15 mile's recovery column (659 s/mi); each non-cutback week steps 3 s/mi faster (intermediate, 18 to 35);
  // the cutback weeks W4 and W8 hold; the distance ladder is 3, 3.5, 4, 2.8, 4.5, 5, 5.5, 3.8, 6, 6.6, 7.3 miles.
  const p = stand();
  assert.equal(p.totalWeeks, 11);
  const mins = [], tiers = [];
  for (let w = 1; w <= 11; w++) { const c = p.weeks[w].sat.cardio; mins.push(+T.minutesOf(c && c.dose).toFixed(1)); tiers.push(T.handTier(c) || '-'); }
  assert.deepEqual(mins, [33.0, 38.3, 43.5, 30.5, 48.5, 53.7, 58.8, 40.6, 63.5, 69.5, 76.5]);
  assert.equal(tiers.join(''), 'CCCCBBBCBBA');
});

test("the stand-in's tier B Saturdays (W5 W6 W7 W9 W10) keep the strength pair at 6 sets and lose the explosive finisher", () => {
  const DIPS = 'Dips', PUSH = 'Pushups (slow tempo)', ROWR = 'Inverted rows (rings)', ROWB = 'Inverted rows (bodyweight)';
  const WANT = { 5: [DIPS, ROWR], 6: [DIPS, ROWR], 7: [PUSH, ROWB], 9: [PUSH, ROWR], 10: [PUSH, ROWR] };
  for (const w of Object.keys(WANT)) {
    const d = stand().weeks[w].sat;
    assert.equal(T.shape(d), '[Strength] ' + WANT[w].join(', '), 'W' + w);
    assert.equal(T.daySets(d), 6, 'W' + w);
  }
});

test("the stand-in's W11 long run crosses 75 minutes: tier A, titled Post-Run Mobility, mobility only", () => {
  const d = stand().weeks[11].sat;
  assert.equal(T.handTier(d.cardio), 'A');
  assert.equal(d.title, 'Post-Run Mobility');
  assert.equal(T.shape(d), '[Post-run mobility] Standing calf stretch, Couch stretch, Hip 90/90 stretch, T-spine mobility, Foam roll');
});

test("the stand-in's tier C Saturdays (W1 W2 W3 W4 W8) keep a normal day", () => {
  const S = 'Dips', PU = 'Pushups (slow tempo)', RB = 'Inverted rows (bodyweight)', EXP = 'Explosive finisher';
  const WANT = {
    1: '[Strength] ' + S + ', ' + RB + ' ; [' + EXP + '] Ball slams, Kettlebell swing',
    2: '[Strength] ' + S + ', ' + RB + ' ; [' + EXP + '] Ball slams, Kettlebell swing',
    3: '[Strength] ' + PU + ', ' + RB + ' ; [' + EXP + '] Broad jumps, Ball slams',
    4: '[Strength] ' + PU + ', ' + RB,
    8: '[Strength] ' + PU + ', ' + RB,
  };
  for (const w of Object.keys(WANT)) assert.equal(T.shape(stand().weeks[w].sat), WANT[w], 'W' + w);
});

test('the carry case (crossfit, balanced, rest Saturday and Sunday) W6 Friday: with an 8:15 mile it is tier C under 45 minutes, without a mile 56.4 minutes tier B with the strength pair; never a carry', () => {
  const cc = Object.assign(R.clone(T.STAND), { equipment: 'crossfit', liftingFocus: 'balanced', experience: 'beginner', restDays: ['sat', 'sun'] });
  const day = R.build(cc).weeks[6].fri;
  const m = +T.minutesOf(day.cardio && day.cardio.dose).toFixed(1);
  assert.equal(T.handTier(day.cardio), 'C');
  assert.ok(m < 45, m + ' minutes');
  assert.equal(T.carryN(day), 0);
  const nm = R.clone(cc);
  nm.cardioGoals.run.mileBestMins = '';
  nm.cardioGoals.run.mileBestSecs = '';
  delete nm.cardioGoals.run.mileBestSrc;
  const d0 = R.build(nm).weeks[6].fri;
  assert.equal(+T.minutesOf(d0.cardio && d0.cardio.dose).toFixed(1), 56.4);
  assert.equal(T.handTier(d0.cardio), 'B');
  assert.equal(T.carryN(d0), 0);
  assert.equal(T.shape(d0), '[Strength] Dips, Inverted rows (rings)');
});

test("D140's lattice, every eighth program: tier A is post-run mobility titled so; tier B has no leg item, no power, explosive or carry section, no power core pillar and 8 sets or fewer; no tier carries a carry", () => {
  const X = T.tierTally(8);
  assert.equal(X.progs, 84);
  for (const t of ['A', 'B', 'C']) for (const limb of ['NSW', 'NRC']) assert.ok(X.n[t][limb] > 0, 'tier ' + t + ' ' + limb + ' ' + JSON.stringify(X.n));
  assert.ok(X.n.cPowerCore > 0, 'tier C days still deal a power core pillar');
  for (const k of Object.keys(X.bad)) assert.deepEqual(X.bad[k], [], k);
});

test('the hinge hand list catches every hinge it names and passes every movement that is not one', () => {
  for (const n of ['Cable pull-through', 'Bodyweight back extension', 'Romanian deadlift', 'Single-leg RDL', 'Kettlebell swing', 'Good morning',
    'Glute-ham raise', 'GHR', 'Hip thrust', 'Single-leg glute bridge', 'Nordic curl', 'Reverse hyper', '45° back extension',
    'Hyperextension', 'Cable hip extension', 'Trap bar deadlift']) assert.match(n, T.HINGE);
  for (const n of ['Goblet squat', 'Dumbbell bench press', 'Pull-up', 'Plank', 'Walking lunge', 'Face pull', 'Band pull-apart', 'Hip 90/90 stretch',
    'Dumbbell row', 'Overhead press']) assert.doesNotMatch(n, T.HINGE);
});

const L = T.hingeLattices();
/** The D153 and D155 claims on one lattice sample, with how many tier B days and recovery-week loaded Full Body days it must reach. */
function hingeClaims(name, list, reach) {
  const X = T.hingeTally(list);
  assert.equal(X.cfg, list.length, name + ' builds');
  assert.ok(X.tb >= reach.tb && X.recFullBody >= reach.rec, name + ': ' + X.tb + ' tier B days, ' + X.recFullBody + ' recovery-week loaded Full Body days');
  assert.deepEqual(X.zero, [], name + ': tier B days with no lift section');
  assert.deepEqual(X.hinge, {}, name + ': hinges on tier B days');
  assert.ok(X.hingeElse > 0, name + ': the hand list sees hinges off tier B');
  assert.deepEqual(X.over8, [], name + ': over 8 sets');
  assert.ok(X.maxSets <= 8);
  assert.ok(X.g6n > 0, name + ': D155 days reached');
  assert.deepEqual(X.g6bad, [], name + ': D155 days without an Upper superset');
  return X;
}

/** The loaded full-body slice, where D155's recovery-week day lives: commercial or home_full, strength or hypertrophy. */
const loaded = x => /^(commercial|home_full)$/.test(x.c.equipment) && /^(strength|hypertrophy)$/.test(x.c.liftingFocus);

test('NRC, every hundredth config of 4,200 and every fourteenth of its loaded full-body slice: no tier B long-run day without lifting or with a hinge, 8 sets at most, and the recovery-week loaded full-body day keeps its Upper superset', () => {
  hingeClaims('NRC', R.every(L.NRC.filter(x => !loaded(x)), 100).concat(R.every(L.NRC.filter(loaded), 14)), { tb: 50, rec: 1 });
});

test('NSW, every fiftieth config of 3,600: no tier B long-run day without lifting or with a hinge, 8 sets at most, the Upper superset kept, and no Arms or Delts finisher on a long day', () => {
  const X = hingeClaims('NSW', R.every(L.NSW, 50), { tb: 100, rec: 1 });
  assert.deepEqual(X.finisher, []);
});

test("D153's population, every fourth config (where Cable pull-through once printed on a tier B day): no hinge, no empty tier B day, the Upper superset kept", () => {
  hingeClaims('D153', R.every(L.D153, 4), { tb: 50, rec: 5 });
});

test('the loaded full-body slice on two more seeds and with a bike or a swim: no Arms or Delts finisher on a long day, and every tier B long day lifts, at 8 sets or fewer', () => {
  const F = T.finisherLattices();
  for (const [name, list] of [['seeds', R.every(F.seeds, 40)], ['multi', R.every(F.multi, 10)]]) {
    const X = T.hingeTally(list);
    assert.deepEqual(X.finisher, [], name);
    assert.ok(X.tb > 0, name + ' tier B days');
    assert.deepEqual(X.zero, [], name);
    assert.deepEqual(X.over8, [], name);
  }
});
