'use strict';
// Swim, the lattices. The same claims as tests/integration/swim.test.js, which runs them on samples; this file runs
// them whole. CI runs it, the 60-second check does not.
//   - the swim time lattice (504 programs): 500 and 100 goals x three experiences x three ages x five current times
//     (blank first) x five targets, units, seeds and the 100 goal's 500 rotated, plus the 0:00, "0:" and seconds-only
//     anchor entries; the distance and untimed swim goals at three seeds; the other goals beside a swim (78 programs);
//   - the sizer lattice (7,560 seconds-only entries against their m:ss twins, every experience and age) and the full
//     build lattice (192 seconds-only builds against 48 twins).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock } = require('../support/app.js');
const S = require('../support/swim.js');
const { clone } = S;

const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
const LAT = S.swimLattice();
const CK = S.clockAudit(IA, LAT);

test('the swim time lattice builds 504 programs and reaches every kind of goal, at the counts the ruling measured', () => {
  // L0
  const { R } = CK;
  assert.equal(LAT.length, 504);
  assert.equal(R.builds, 504);
  assert.ok(R.ints >= R.builds * 3 && R.faster >= 100 && R.slower >= 100 && R.damp >= 50 && R.blank >= 50 && R.steps >= 500, JSON.stringify(R));
});

test('week 1 is the anchor split, every split is on the hand model within the rate, every repeat is the split less 2 s', () => {
  // R1, R2, R3a, R3b, R3c
  assert.ok(CK.R.w1F >= 100 && CK.R.w1S >= 100);
  for (const k of ['r1', 'r2', 'r3a', 'r3b', 'r3c']) assert.deepEqual(CK.bad[k], [], k);
});

test('goals at or slower than current hold at the anchor with the goal met note; out-of-reach notes quote a printed split', () => {
  // R4, N1, N2
  assert.ok(CK.R.met >= 100);
  assert.deepEqual(CK.bad.r4, []);
  assert.deepEqual(CK.nbad.n1, []); assert.equal(CK.N.dampNote, CK.R.damp);
  assert.deepEqual(CK.nbad.n2, []); assert.equal(CK.N.metNote, CK.R.met);
});

test('every blank or 0:00 anchor opens its notes with the default line; an entered one never says "No current"', () => {
  // N3
  assert.deepEqual(CK.nbad.n3, []);
  assert.equal(CK.N.anchorProgs, CK.R.blank);
  assert.equal(CK.N.zeroEntry, LAT.filter(o => o.raw && !S.anchorEntered(o)).length);
});

test('no swim note says build to 10 or cap at 10 or carries a dash, over the lattice and the distance goals', () => {
  // N4, N5
  const N = clone(CK.N), nbad = { n4: CK.nbad.n4.slice(), n5: CK.nbad.n5.slice() };
  for (const [lbl, c] of S.distanceGoals([76308, 1234, 99991])) S.auditNotes(IA.buildProgram(c), lbl, N, nbad);
  assert.deepEqual(nbad.n4, []); assert.deepEqual(nbad.n5, []);
  assert.ok(N.cap8Time >= 100 && N.cap8Dist >= 20 && N.swimNotes >= 1000, JSON.stringify(N));
});

test('the 100 goal\'s cards say "500 pace" and the 500 goal\'s "goal split", on the first 30 of each', () => {
  // D6
  const all100 = LAT.filter(o => o.goal === 'swim_100_time').slice(0, 30).flatMap(o => S.intCards(IA.buildProgram(S.swimCfg(o))).map(x => x.c));
  const all500 = LAT.filter(o => o.goal === 'swim_500_time').slice(0, 30).flatMap(o => S.intCards(IA.buildProgram(S.swimCfg(o))).map(x => x.c));
  assert.ok(all100.length >= 50 && all500.length >= 50);
  const MAIN100 = /^\d+ x 100(?:yd|m) at \d+:\d\d\/100\. Two seconds under this week's 500 pace of \d+:\d\d\/100\. /;
  for (const c of all100) {
    const m = (c.segments || []).find(z => /main/i.test(z.label || ''));
    assert.ok(m && MAIN100.test(m.text || '') && !S.DASH(m.text || '') && String(c.detail).indexOf("Two seconds under this week's 500 pace of") >= 0 && !/goal split/.test(c.detail));
  }
  for (const c of all500) assert.ok(String(c.detail).indexOf("Slightly faster than this week's goal split of") >= 0 && !/500 pace/.test(c.detail));
});

test('every distance swim INT note beside every other goal, three experiences and two seeds, is the distance note', () => {
  // P1n
  const A = S.distanceNoteAudit(IA, S.otherGoals(['beginner', 'intermediate', 'advanced'], [76308, 1234]));
  assert.ok(A.n >= 20);
  assert.deepEqual(A.bad, []);
});

test('the sizer lattice: all 7,560 seconds-only entries size as their m:ss twins, weeks and warning byte for byte', () => {
  // L1 (both rows)
  const LEN = S.sizer(IA);
  let n = 0, bad = [], label = 0;
  for (const goal of Object.keys(S.SIZER_TIMES)) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '36-54', '55+'])
    for (const t of S.SIZER_TIMES[goal].T) for (const c of S.SIZER_TIMES[goal].C) {
      const lt = LEN(S.sizerGoal(goal, t, c, 'mss', 'mss'), exp, age);
      for (const tf of S.FORMS) for (const cf of S.FORMS) {
        if (tf === 'mss' && cf === 'mss') continue;
        n++;
        const le = LEN(S.sizerGoal(goal, t, c, tf, cf), exp, age);
        if (le.weeks !== lt.weeks) bad.push(`${goal} ${exp} ${age} ${t}/${c} ${tf}/${cf}`);
        if (le.warning !== lt.warning) label++;
      }
    }
  assert.equal(n, 9 * 8 * (63 + 42));
  assert.deepEqual(bad.slice(0, 4), []);
  assert.equal(label, 0);
});

test('the build lattice: all 192 seconds-only builds equal their m:ss twins, and no cfg is mutated', () => {
  // L2 (both rows)
  const PAIRS = { swim_100_time: [[55, 59], [75, 90]], swim_500_time: [[420, 480], [540, 600]] };
  const F2 = [['undef', 'mss'], ['mss', 'undef'], ['undef', 'undef'], ['empty', 'empty']];
  const run = cfg => { const c = clone(cfg), before = JSON.stringify(c), p = IA.buildProgram(c); return { p, pure: JSON.stringify(c) === before }; };
  let n = 0, impure = 0; const bad = [];
  for (const goal of Object.keys(PAIRS)) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '55+']) for (const [t, c] of PAIRS[goal]) for (const mix of ['swim', 'run+swim']) {
    const tw = run(S.sizerCfg({ g: S.sizerGoal(goal, t, c, 'mss', 'mss'), exp, age, mix }));
    if (!tw.pure) impure++;
    for (const [tf, cf] of F2) {
      n++;
      const e = run(S.sizerCfg({ g: S.sizerGoal(goal, t, c, tf, cf), exp, age, mix }));
      if (!e.pure) impure++;
      if (e.p.totalWeeks !== tw.p.totalWeeks || JSON.stringify(e.p.weeks) !== JSON.stringify(tw.p.weeks)) bad.push(`${goal} ${exp} ${age} ${mix} ${t}/${c} ${tf}/${cf}`);
    }
  }
  assert.equal(n, 192);
  assert.deepEqual(bad, []);
  assert.equal(impure, 0);
});
