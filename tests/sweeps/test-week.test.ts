// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The test week lattices whole (CI only): tests/integration/test-week.test.js runs each claim on a sample. Rulings:
// D106a (the trial week, slice E, and the V208 fix-forward at T-1 and T-2) and D158 (the eve shakeout, and the
// protect-park injury modes it skips). Oracles as in the integration file: date arithmetic, the pre-pin week of the
// same cfg, the card text. tests/snapshots/test-week.json pins the eve under the protect-park modes: every cell matched
// V213's eve (the build before D158, git bc3cccc, the ruling's named oracle) when the snapshot was written.
process.env.TZ = 'America/New_York';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as X from '../support/test-week.ts';
import { matchSnapshot } from '../support/snapshot.ts';
const IA = X.engine('2026-09-21');

test('every cell of the trial week lattice carries one trial on the test day, titled Test Day, and the week around it is clean', () => {
  // P1 to P6 and P5z on all 108 cells: run, run+bike, run+swim x three rest sets x test weeks 3, 6, 9 x Mon, Tue, Thu, Sat
  const T = X.trialWeek(IA, X.TRIAL_CELLS);
  assert.equal(T.n, 108);
  assert.equal(T.p4reach, 72, 'cells whose test week dealt no quality run');
  assert.ok(T.hardSeen > 0 && T.p5reach > 0);
  for (const k of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']) assert.deepEqual(T[k], [], k);
});

for (const goal of Object.keys(X.EVE_GOALS)) {
  for (const mix of ['run', 'run+bike', 'run+swim']) {
    test(`${goal}, ${mix}: T-1 is the shakeout, T-2 the week easy run, no leg load, no lift, every Shakeout an easy run`, () => {
      // Q0, Q1, Q2, Q3, Q8 for one goal and mix: 60 programs, five rest sets x test weeks 2, 3, 5 x Mon, Tue, Thu, Sat
      const A = X.eveWeek(IA, X.EVE_CELLS.filter(x => x.goal === goal && x.mix === mix));
      assert.equal(A.progs, 60);
      assert.ok(A.reach > 0 && A.shk > 0 && A.eveDays > 0, JSON.stringify({ reach: A.reach, shk: A.shk }));
      for (const k of ['Q1', 'Q2', 'Q3', 'Q8']) assert.deepEqual(A[k], [], k);
    });
  }
}

test('no hard run two days before the test, on every mix, rest set, test week and weekday', () => {
  // Q9: 3 mixes x 8 rest sets x test weeks 1, 2, 5 x 7 weekdays, 456 with a day two before the test
  const B = X.b4Week(IA, X.B4_CELLS);
  assert.equal(B.n, 456);
  assert.ok(B.reach > 0);
  assert.deepEqual(B.bad, []);
});

test('every training-day eve of the shakeout lattice carries the shakeout at the week easy distance; every rest-day eve rests', () => {
  // D0, D1, D2, D2v, D3, D4: pace and mile x 4 mixes x 7 rest sets x test weeks 2, 5 x 7 weekdays = 784 programs
  const A = X.eveShakeout(IA, X.SHAKEOUT_CELLS);
  assert.equal(A.n, 784);
  assert.ok(A.te > 0 && A.re > 0 && A.tePrev > 0);
  for (const k of ['bike', 'swim', 'run', 'lift']) assert.ok(A.pre[k] > 0, k);
  assert.ok(A.d2reach * 2 >= A.te, `${A.d2reach} of ${A.te}`);
  for (const k of ['D1', 'D2', 'D3', 'D4']) assert.deepEqual(A[k], [], k);
});

test('under the protect-park injury modes every training-day eve matches tests/snapshots/test-week.json', () => {
  // D8: 3 mixes x 8 rest sets x 4 test placements x 7 injury modes; every protect-park mode reached
  const { sigs, reach } = X.protectParkEves(IA, X.PARK_CELLS);
  for (const m of X.PROTECT_PARK) assert.ok(reach[m] > 0, m + ' ' + JSON.stringify(reach));
  matchSnapshot('test-week', { protectParkEves: sigs });
});
