'use strict';
// The run session's class: D103a. Every NSW run session carries a class key on its dose (int, chi, steady, long, easy,
// bench, trial). The chip and the run history read it, and print today's codes (the LI and SI rename: keyed chi wears
// LI, keyed int SI, the test TEST); the readers go key-first (the week shape, the interference cost, the halfstep and
// easy mode sweeps), so renaming a label moves no program. NRC, bike and swim sessions carry no key and keep the label
// scan. Slice 2b: in easy mode an easy run keeps its minutes and parks its strides finisher.
// The record is in the handoff and tests/measure/ (v206 to v208).
//
// Oracles, typed by hand (tests/support/run-session-class.js): the label each key goes with, the chip each key wears,
// the halfstep and park sets, the strides text rule, the V176 interference arithmetic; and, for the rename, the same
// app with one label swapped by source surgery. This file runs each claim on a sample of each lattice;
// tests/sweeps/run-session-class.test.js runs the three lattices whole.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, fixtures } = require('../support/app.js');
const X = require('../support/run-session-class.js');
const { clone } = X;

const NOON = new Date(2026, 9, 11, 12, 0, 0);
const IA = loadApp();
pinClock(IA, NOON);
const R = X.chipReaders(IA);
const build = (fam, cfg) => ({ fam, cfg, prog: IA.buildProgram(clone(cfg)) });

// ── the chip and the run history ────────────────────────────────────────────────────────────────────────────────────
test('both label eras of the LI and the SI, plain, Taper and re-entry, wear one chip and class as one in the run history', () => {
  // A1, A2
  const ERAS = [{ old: 'Continuous High Intensity (CHI)', now: 'Long Interval (LI)', chip: 'LI', cls: 'Tempo' },
    { old: 'Interval (INT)', now: 'Short Interval (SI)', chip: 'SI', cls: 'Interval' }];
  for (const e of ERAS) for (const sfx of ['', ' — Taper', ' (re-entry)', ' — Taper (re-entry)']) for (const lab of [e.old + sfx, e.now + sfx]) {
    for (const t of [undefined, 'run']) assert.equal(R.CODE(lab, null, t), e.chip, lab + ' ' + t);
    assert.equal(R.RC(lab), e.cls, lab);
  }
});

test('a bike or swim CHI or INT, plain or Taper, keeps its CHI or INT chip', () => {
  // A3
  for (const t of ['bike', 'swim']) for (const sfx of ['', ' — Taper'])
    for (const [lab, w] of [['Continuous High Intensity (CHI)', 'CHI'], ['Interval (INT)', 'INT']]) assert.equal(R.CODE(lab + sfx, null, t), w, t + ' ' + lab + sfx);
});

test('NRC keeps its codes: Speed Run — Intervals wears INT, and both Speed Runs class as Interval', () => {
  // C1
  assert.equal(R.CODE('Speed Run — Intervals'), 'INT');
  assert.equal(R.RC('Speed Run — Intervals'), 'Interval');
  assert.equal(R.RC('Speed Run — Tempo'), 'Interval');
});

test('the test and the benchmark stay out of the run history', () => {
  // D2
  for (const s of ['1.5 Mile Test — TIME TRIAL', '1 Mile Test — TIME TRIAL', 'Benchmark Run', 'Benchmark Run — Retest']) assert.equal(R.RC(s), null, s);
});

// the chip sample: per injury mode (none, halfstep, easy) a dated pace goal, a mile goal with a swim, run_base on the
// frequency plan, run_base 55+, and an NRC 10K with a bike
const CHIP = [];
for (const inj of [null, X.INJ.halfstep, X.INJ.easy]) {
  const put = (fam, c) => { if (inj) c.injury = clone(inj); CHIP.push(build(fam, c)); };
  put('pace', X.paceCfg('C', X.PACE, '', ['sun', 'wed'], 3, 3, true));
  put('pace', X.paceCfg('C', X.MILE, 'swim', ['sun'], 1, 3, true));
  put('run_base freq', X.runBaseFreq('C', '', 'intermediate', ['sun', 'wed'], 24865, false, true));
  put('run_base 55+', X.runBase55('event', '0.1', '', ['sun', 'wed'], true));
  put('NRC', Object.assign(clone(fixtures.HALF_MANNY), { cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_10k', label: 'run_10k' },
    bike: { id: 'bike_base', label: 'Bike' } }, restDays: ['sun'], seed: 76308 }));
}
const CA = X.chipAudit(R, CHIP);

test('every keyed NSW run wears its ruled chip on the day and on the planned dose strip', () => {
  // B0, B1, B2
  assert.ok(CA.nsw > 0 && CA.unkeyed > 0, CA.nsw + ' keyed, ' + CA.unkeyed + ' unkeyed');
  assert.deepEqual(CA.day, []);
  assert.deepEqual(CA.strip, []);
  for (const k of ['chi LI', 'int SI', 'trial TEST']) assert.ok(CA.byKey[k] > 0, k + ' reached');
});

test('a keyed LI or SI renamed to the other\'s name, either era, or to a name no scan knows keeps its key\'s chip', () => {
  // B4
  assert.ok(CA.relabels > 0);
  assert.deepEqual(CA.relabel, []);
});

// ── the key on the dose ─────────────────────────────────────────────────────────────────────────────────────────────
// the key sample: a dated pace goal (the test), an undated mile goal with a swim, run_base on the frequency plan (the
// budgeted long easy run, the benchmark), run_base 55+ (the Steady Aerobic Run), NRC half with a bike
const KEY = [
  build('pace dated', X.paceCfg('K', X.PACE, '', ['sun', 'wed'], 3, 3)),
  build('pace mile+swim', X.paceCfg('K', X.MILE, 'swim', ['sun'], 0, 0)),
  build('run_base freq plan', X.runBaseFreq('K', '', 'intermediate', ['sun', 'wed'], 24865, false)),
  build('run_base 55+', X.runBase55('event', '0.1', '', ['sun', 'wed'], true)),
  build('NRC run_half+bike', Object.assign(clone(fixtures.HALF_MANNY), { cardioTypes: ['run', 'bike'],
    cardioGoals: { run: { id: 'run_half', label: 'run_half' }, bike: { id: 'bike_base', label: 'Bike base' } }, restDays: ['sun'], seed: 76308, raceDate: '2026-12-26' })),
];
const KA = X.keyAudit(KEY);

test('the sample reaches every key, the budgeted long easy run, and both LI and SI heads plain and Taper', () => {
  // K0, K2b
  for (const k of X.VOCAB) assert.ok(KA.seen[k] > 0, k);
  assert.ok(KA.budgetLong > 0);
  for (const [h, n] of Object.entries(KA.heads)) assert.ok(n > 0, h);
});

test('every NSW run card carries the key its label goes with', () => {
  // K1, K2
  assert.ok(KA.nsw > 0);
  assert.deepEqual(KA.unkeyed, []);
  assert.deepEqual(KA.disagree, []);
  assert.equal(KA.agree, KA.nsw);
});

test('NRC run, bike and swim cards carry no key', () => {
  // K3
  assert.ok(KA.other > 0);
  assert.deepEqual(KA.otherKeyed, []);
});

// ── the readers go key-first ────────────────────────────────────────────────────────────────────────────────────────
// the readers' sample: dated pace goals (the test in week 3 and week 1), an undated pace goal, run_base on the frequency
// plan and run_base 55+ both paths
const RLAT = [
  { fam: 'pace', dated: 3, cfg: X.paceCfg('R', X.PACE, '', ['sun'], 3, 3) },
  { fam: 'pace', dated: 1, cfg: X.paceCfg('R', X.MILE, 'bike', ['sat', 'sun'], 1, 3) },
  { fam: 'pace', dated: 0, cfg: X.paceCfg('R', X.PACE, '', ['sun', 'wed'], 0, 0) },
  { fam: 'run_base freq', dated: 0, cfg: X.runBaseFreq('R', '', 'beginner', [], 24865, false) },
  { fam: 'run_base 55+', dated: 0, cfg: X.runBase55('fitness', '0.1', '', ['sun', 'wed'], false) },
  { fam: 'run_base 55+', dated: 0, cfg: X.runBase55('event', '1', '', [], true) },
];
const RA = X.readersAudit(IA, RLAT);

test('halfstep cuts a keyed NSW run exactly when its key is int, chi, long or steady; never an easy run, the test or the benchmark', () => {
  // H1, H2, H3
  const { H } = RA;
  assert.deepEqual(H.bad, []);
  for (const k of ['easy', 'trial', 'bench']) { assert.ok(H.byKey[k] > 0, k + ' reached'); assert.ok(!H.hit[k], k + ' never halved'); }
});

test('easy mode parks a keyed NSW run exactly when its key is int, chi, long, steady, bench or trial, so no test survives', () => {
  // E1, E2
  const { E } = RA;
  assert.deepEqual(E.bad, []);
  for (const k of ['int', 'chi', 'long', 'steady', 'bench', 'trial', 'easy']) assert.ok(E.total[k] > 0, k + ' reached');
  assert.ok(E.dated > 0 && E.total.trial > 0);
  assert.deepEqual(E.trialsLeft, []);
});

test('in easy mode an easy run is left as dealt but for its strides finisher, which goes whole, minutes and dose kept', () => {
  // E3, E5, E6
  const { E } = RA;
  assert.deepEqual(E.kept, []);
  assert.ok(E.stridesDealt > 0);
  assert.deepEqual(E.stridesLeft, []);
  assert.deepEqual(E.plusLeft, []);
  assert.deepEqual(E.dose, []);
});

test('in easy mode a training-day test eve is a rest day: no shakeout, no card, no lift', () => {
  // E3e
  assert.ok(RA.E.eves > 0);
  assert.deepEqual(RA.E.eveBad, []);
});

test('every protected easy run that carries a key carries easy, in easy and reduce mode', () => {
  // E4
  assert.deepEqual(RA.E.protectKey, []);
});

test('without an injury every " + Strides" run carries the whole finisher', () => {
  // E7a
  assert.ok(RA.E.plainStrides > 0);
  assert.deepEqual(RA.E.plainBad, []);
});

test('a keyed SI costs 1.4 and a keyed LI 1.05 plus the distance bump, by hand, whatever its label says', () => {
  // I1, I4
  assert.ok(RA.I.n > 0);
  assert.deepEqual(RA.I.bad, []);
  assert.deepEqual(RA.I.relabel, []);
});

test('the week shape reads the speed days by key: the test is in no role, and a week whose only leg-load card is the test has no long run', () => {
  // S1, S1b, S1c
  const SH = IA.eval('_nrcRunShape');
  const card = (sub, key, legLoad) => ({ type: 'run', subtype: sub, goalId: 'run_pace_goal', legLoad, dose: { k: 'dist', mi: 1.5, key } });
  const wk = { mon: card('Long Slow Distance (LSD) — Taper', 'long', true), wed: card('Interval (INT)', 'int', true),
    fri: card('Long Slow Distance (LSD)', 'easy', false), sat: card('1.5 Mile Test — TIME TRIAL', 'trial', true) };
  const s = SH(clone(wk), ['mon', 'wed', 'fri', 'sat']);
  assert.ok(s);
  assert.equal(s.long, 'mon'); assert.deepEqual([...s.speed], ['wed']); assert.deepEqual([...s.easy], ['fri']);
  assert.equal(SH(clone({ fri: wk.fri, sat: wk.sat }), ['fri', 'sat']), null);
  const lb = { mon: card('Long Interval (LI)', 'chi', true), thu: card('Zqy Session (ZQY)', 'int', true),
    sat: card('Long Slow Distance (LSD)', 'long', true), sun: card('Long Slow Distance (LSD)', 'easy', false) };
  const s3 = SH(clone(lb), ['mon', 'thu', 'sat', 'sun']);
  assert.equal(s3.long, 'sat'); assert.deepEqual([...s3.speed].sort(), ['mon', 'thu']);
});

test('swapping either quality label, to the other era\'s name or to a name no scan knows, moves no pace program', () => {
  // L:0b3d9a6a (LI swaps), L:6a421523 (SI swaps)
  const RN = X.renameAudit(IA, IA.html, RLAT, RA.get, V => pinClock(V, NOON));
  assert.deepEqual(RN.labels, ['Long Interval (LI)', 'Short Interval (SI)']);
  assert.ok(RN.cells > 0);
  for (const s of RN.swaps) assert.deepEqual(s.moved, [], s.slot + ' "' + s.from + '" to "' + s.to + '"');
});
