// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Deload weeks: recoveryDeload keeps its one accessory block by PATTERN, not push order (D91); on the pull side a deload
// pull day keeps Pull superset A, the day's vertical pull, because its Main is already a deadlift variant (D93 as
// narrowed by D94). Rulings: docs/decisions/deload.md when one is written; the parity table is
// docs/test-migration/14-deload.md.
//
// Oracles: the hand posterior table E_PAT and the hand vertical-pull table, each with a blindness probe; the deload
// loop's four candidacy tests re-run from the ruling text; the per-card expected survivor typed from the ruling. The
// stage snapshots come from a copy of the app with the day-assembly statement split in three (tests/support/deload.js),
// proved inert below. Golden values (tests/snapshots/deload.json): the deload-off digest of Mario's program and the
// pull lattice's positive-limb count. The 1,728-config D91 lattice runs in tests/sweeps/deload.test.js; this file runs
// a 76-config sample of it.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { loadApp, fixtures, progDigest } from '../support/app.ts';
import * as D from '../support/deload.ts';

const IA = loadApp();
const ST = D.loadStaged();

test('the hand posterior oracle reads its 17-name probe as typed, four of the negatives pull-side', () => {
  const bad = D.POST_PROBE.filter(([n, e]) => (D.isPost(n) ? 1 : 0) !== e).map((x) => x[0]);
  assert.deepEqual(bad, []);
});

test('the hand vertical-pull oracle reads its 14-name probe as typed: rows, face pulls and pullovers are not pulls from overhead', () => {
  const bad = D.VPULL_PROBE.filter(([n, e]) => (D.isVPull(n) ? 1 : 0) !== e).map((x) => x[0]);
  assert.deepEqual(bad, []);
});

test('the four candidacy tests read the hand-typed sections as typed, and the pull family lands on candidate', () => {
  const bad = D.CLS_PROBE.filter(([s, e]) => D.cls(s) !== e).map(([s, e]) => `${s.l} => ${D.cls(s)} want ${e}`);
  assert.deepEqual(bad, []);
});

test('the stage recorder is inert: the staged copy builds the same programs as the app', () => {
  const lat = D.deloadLattice().filter((_, i) => i % 211 === 0);
  for (const L of lat) {
    const a = progDigest(IA.buildProgram(structuredClone(L.cfg)));
    assert.equal(progDigest(IA.buildProgram(structuredClone(L.cfg))), a, `${L.key} is self-stable`);
    assert.equal(progDigest(D.stagedBuild(ST, L.cfg, false).prog), a, L.key);
  }
});

test('Mario\'s program with the deload pass off builds the deload-off digest, and the deload moves it', () => {
  const on = progDigest(IA.buildProgram(structuredClone(fixtures.HALF_MANNY)));
  IA.eval('globalThis.__DELOAD_OFF=true;');
  try {
    const off = progDigest(IA.buildProgram(structuredClone(fixtures.HALF_MANNY)));
    assert.equal(progDigest(IA.buildProgram(structuredClone(fixtures.HALF_MANNY))), off, 'the counterfactual equals itself');
    assert.notEqual(off, on, 'Mario\'s program passes through the deload');
    D.matchSnapshotKey('deload', 'half-manny deload-off digest', off);
  } finally {
    IA.eval('globalThis.__DELOAD_OFF=false;');
  }
});

// ── the pull side (D93 narrowed by D94), on the 60-config mini lattice built to contain the positive limb ──────────
const PULL = D.pullCensus(ST, D.pullLattice());

test('the pull lattice is 60 configs, 5,120 day builds, 1,120 of them deload day builds', () => {
  assert.equal(PULL.configs, 60);
  assert.equal(PULL.dayCells, 5120);
  assert.equal(PULL.dlDayBuilds, 1120);
});

test('the deload swaps which pull block survives and adds none: 1,470 pull-family sections after the deload', () => {
  assert.equal(PULL.famP2, 1470, JSON.stringify(PULL.famP2ByLabel));
});

test('on every deload day offering both pull blocks exactly one survives, and it is A unless B holds posterior and the Main does not', () => {
  assert.equal(PULL.bothEnter, 210);
  assert.equal(PULL.viol, 0, JSON.stringify(PULL.census));
  assert.equal(PULL.mainPostCards, 210, 'a deload pull day draws its Main from the deadlift family');
  assert.ok(PULL.swapCards >= 1, 'the positive limb is exercised');
});

test('the positive limb is one movement, the conditioning swing, and every such card keeps its vertical pull to the shipped card', () => {
  const n = PULL.swapCards;
  D.matchSnapshotKey('deload', 'pull lattice positive-limb cards', n);
  assert.equal(PULL.mainPostSwap, n, 'the Main clause fires on every card it decides');
  assert.deepEqual(Object.keys(PULL.swapItems), ['Kettlebell swing']);
  assert.equal(PULL.swapItems['Kettlebell swing'], n);
  assert.equal(PULL.p4Survive, n, 'Pull superset A (or its bare rename) reaches the shipped card');
  assert.equal(PULL.p7VPull, n, 'the shipped card carries a vertical pull');
});

// ── a 76-config sample of the D91 lattice (every 23rd key); the whole lattice runs in tests/sweeps/deload.test.js ──
const SAMPLE = D.deloadLattice().filter((_, i) => i % 23 === 0);
const R = D.deloadCensus(ST, SAMPLE);
const N = R.on;

test('the sample holds deload weeks, swap cards and cards the deload cut', () => {
  assert.equal(SAMPLE.length, 76);
  assert.ok(N.deloadWeeks > 0 && N.swapPop > 0 && N.orderNonVac > 0 && N.trapCand > 0, JSON.stringify({ dl: N.deloadWeeks, swap: N.swapPop, cut: N.orderNonVac, trap: N.trapCand }));
});

test('no deload week ships zero posterior chain, and none ships less than it would with the deload off', () => {
  assert.equal(N.zeroWeeksDeload, 0);
  assert.equal(R.wrongWay, 0);
  assert.ok(N.zeroWeeksDeload <= R.off.zeroWeeksDeload);
});

test('weeks that are not deload weeks are byte-identical with the deload on and off', () => {
  assert.equal(R.ndIdentical, R.ndTotal);
  assert.ok(R.ndTotal > 0);
});

test('every deload card keeps exactly one accessory block where one was offered, and never two', () => {
  assert.equal(N.survCandViol, 0);
  assert.equal(N.survCandGt1, 0);
});

test('a posterior Main with no posterior accessory still keeps one accessory block, under both lenses', () => {
  assert.equal(N.trapSurvViol, 0);
  assert.equal(N.trapSurvViolE, 0);
  assert.equal(N.trapNoCandSurvViol, 0);
  assert.equal(N.trapNoCandSurvViolE, 0);
  assert.equal(N.trapAndSwap, 0, 'the trap and the swap are disjoint');
});

test('the deload cuts sections in place: nothing reordered, nothing appended, no leg block moved behind hip work', () => {
  assert.equal(N.orderViol, 0);
  assert.equal(N.legAfterHipViol, 0);
});

test('a swap card the deload keeps is not emptied downstream, and never leaves its week without posterior', () => {
  assert.equal(N.swapReCap, 0);
  assert.equal(N.swapReBudget, 0);
  assert.equal(N.swapReBudgetWeekZero, 0);
});

test('the deload-off arm cuts nothing, and outside tier B long-run days the deload empties posterior only from an Explosive finisher', () => {
  assert.equal(R.off.postInP1, R.off.postOutP2);
  assert.ok(N.postOutP2 < N.postInP1, 'the deload still cuts');
  assert.deepEqual(Object.keys(N.killHoldX).filter((k) => k !== 'Explosive finisher'), []);
});
