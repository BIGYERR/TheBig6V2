// Deload weeks, the slow half: the D91 census over its whole 1,728-config lattice (6 tiers x 2 foci x 2 experiences x
// 3 goals x 4 injuries x 3 rest patterns x 2 seeds), both arms: the app as shipped and the counterfactual with the
// deload pass off (globalThis.__DELOAD_OFF). About a minute; CI runs it, the 60-second check does not.
//
// Two kinds of expected value. Counts the ruling fixed by hand (the denominators, the block conservation, the trap and
// swap populations) are typed below. Counts later rulings moved and pinned per release (the legacy era tables
// DELOAD_ARB_BY_VERSION, E6_BY_VERSION and DELOAD_HINGE_BY_VERSION) are golden values in tests/snapshots/deload.json
// under "D91 lattice counts"; a ruling that moves one rewrites it with UPDATE_SNAPSHOTS=1.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import * as D from '../support/deload.ts';

const ST = D.loadStaged();
const LAT = D.deloadLattice();
const R = D.deloadCensus(ST, LAT);
const N = R.on;
const F = R.off;
const g = (o: any, k: any) => (o && o[k]) || 0;

test('the lattice is the ruled 1,728 configs: 17,856 weeks, 2,880 of them deload weeks, 15,360 deload day builds', () => {
  assert.equal(LAT.length, 1728);
  assert.equal(N.weeks, 17856);
  assert.equal(N.deloadWeeks, 2880);
  assert.equal(N.nonDeloadWeeks, 14976);
  assert.equal(N.dlDayBuilds, 15360);
});

test('the counts later rulings pinned per release hold their golden values', () => {
  D.matchSnapshotKey('deload', 'D91 lattice counts', {
    'zero-posterior weeks on the shipped card': N.zeroWeeks,
    'zero-posterior weeks that are not deload weeks': N.zeroWeeksNonDeload,
    'zero-posterior deload weeks with the deload off': F.zeroWeeksDeload,
    'deload weeks byte-identical with the deload off': R.dlIdentical,
    'Leg superset B sections the regional cap removes': N.capLSBkilled,
    'deload day builds that ship zero posterior where the deload-off arm ships some': R.endToEnd,
    'posterior items entering the deload': N.postInP1,
    'posterior items leaving the deload, tier B long-run days excluded': N.postOutP2X,
    'deload day builds taken from some posterior to none, tier B long-run days excluded': N.killedByDeloadX,
    'sections holding the posterior on those days': N.killHoldX,
    'Leg isolation blocks the deload drops': g(N.dropped, 'Leg isolation'),
  });
});

test('no deload week ships zero posterior chain; the zero weeks are all non-deload weeks and none goes the wrong way', () => {
  assert.equal(N.zeroWeeksDeload, 0);
  assert.equal(N.zeroWeeksNonDeload, N.zeroWeeks);
  assert.equal(R.wrongWay, 0);
  assert.ok(N.zeroWeeksDeload <= F.zeroWeeksDeload);
});

test('non-deload weeks are byte-identical with the deload on and off; deload weeks almost all differ', () => {
  assert.equal(R.ndIdentical, 14976);
  assert.equal(R.ndTotal, 14976);
  assert.equal(R.dlTotal, 2880);
  assert.ok(R.dlIdentical < 100);
});

test('the deload still cuts: the off arm cuts nothing, the on arm cuts every cut from an Explosive finisher, keeping its Main', () => {
  assert.equal(F.postInP1, N.postInP1);
  assert.equal(F.postOutP2, N.postInP1, 'the deload-off control cuts nothing');
  assert.ok(N.postOutP2X < N.postInP1X);
  assert.equal(N.killedHeldByFinisher, 60, 'days the deload empties whose posterior sat only in an Explosive finisher');
  assert.equal(N.killedKeepsMain, 60, 'those days keep their main or strength section');
  assert.deepEqual(Object.keys(N.killHoldX), ['Explosive finisher']);
  assert.equal(N.killHoldX['Explosive finisher'], N.killedByDeloadX);
});

test('accessory-block conservation: the deload swaps which leg block survives and adds no sets', () => {
  assert.equal(g(N.lblP2all, 'Leg superset A'), 14544);
  assert.equal(g(N.lblP2all, 'Leg superset B'), 15702);
  assert.equal(g(N.lblP2all, 'Leg superset A') + g(N.lblP2all, 'Leg superset B'), 30246);
  assert.equal(g(N.lblP1all, 'Leg superset A'), 16704);
  assert.equal(g(N.lblP2, 'Leg superset A') + g(N.lblP2, 'Leg superset B'), 2880, 'one leg block per deload card');
  assert.equal(N.survCandViol, 0);
  assert.equal(N.survCandGt1, 0);
});

test('Leg isolation and Explosive finisher: what the deload drops, and what it was holding', () => {
  assert.equal(g(N.droppedPost, 'Leg isolation'), g(N.dropped, 'Leg isolation'), 'every Leg isolation block dropped held posterior work');
  assert.equal(g(N.killHold, 'Leg isolation'), 0);
  assert.equal(g(N.dropped, 'Explosive finisher'), 1744);
  assert.equal(g(N.droppedPost, 'Explosive finisher'), 84);
  assert.equal(g(N.killHold, 'Explosive finisher'), 60);
});

test('the trap (a posterior Main, no posterior accessory) and the swap (A gives way to B) are two disjoint populations', () => {
  assert.equal(N.trapAnyE, 2166, 'the engine lens');
  assert.equal(N.trapAny, 2214, 'the hand lens');
  assert.equal(N.trapCandE, 2160);
  assert.equal(N.trapCand, 2160);
  assert.equal(N.trapSurvViolE + N.trapSurvViol, 0);
  assert.deepEqual([N.trapNoCandE, N.trapNoCandSurvViolE, N.trapNoCand, N.trapNoCandSurvViol], [6, 0, 54, 0]);
  assert.equal(N.swapPop, 2160);
  assert.equal(N.trapAndSwap, 0);
});

test('nothing downstream of the deload takes back a swap card\'s posterior chain', () => {
  assert.equal(N.swapReCap, 0);
  assert.equal(N.swapReBudget, 0);
  assert.equal(N.swapReBudgetWeekZero, 0);
});

test('the deload cuts in place on every deload card, and does cut some', () => {
  assert.equal(N.orderViol, 0);
  assert.ok(N.orderNonVac > 0);
  assert.equal(N.legAfterHipViol, 0);
});

test('this lattice cannot see the pull swap: no deload card here enters with a posterior Pull superset B', () => {
  // a recorded blindness, not coverage: the pull side is held by the mini lattice in tests/integration/deload.test.js
  assert.equal(N.pullBothP1, 1440);
  assert.deepEqual(N.pullSwapCensus, { 'enterPost=none surv=A': 1440 });
});
