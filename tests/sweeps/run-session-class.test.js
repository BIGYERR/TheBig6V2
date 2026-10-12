'use strict';
// The run session's class, the lattices. The same claims as tests/integration/run-session-class.test.js, which runs
// them on samples; this file runs them whole. CI runs it, the 60-second check does not.
//   - the key lattice (354 programs): pace and mile goals undated and dated to a test in week 3 or 5 on three weekdays,
//     run only and with a bike or a swim, four rest patterns; run_base on the frequency plan (three experiences, five
//     rest patterns, two seeds, dated or not, with or without a bike); run_base 55+ on a low baseline; NRC 5K, 10K and half;
//   - the chip lattice (180 programs): pace, run_base and NRC (marathon too) under no injury, halfstep and easy;
//   - the readers' lattice (96 configs, 60 of them pace goals, under no injury, halfstep, easy and reduce), and the rename surgery on every pace
//     program of it under no injury, halfstep and easy (180 programs per swap, four swaps).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock } = require('../support/app.js');
const X = require('../support/run-session-class.js');

const NOON = new Date(2026, 9, 11, 12, 0, 0);
const IA = loadApp();
pinClock(IA, NOON);
const buildAll = L => L.map(e => ({ fam: e.fam, cfg: e.cfg, prog: IA.buildProgram(X.clone(e.cfg)) }));

test('the key lattice: every key reached, every NSW run card keyed by its label, NRC, bike and swim unkeyed', () => {
  // K0, K1, K2, K2b, K3
  const L = X.keyLattice(), KA = X.keyAudit(buildAll(L));
  assert.equal(L.length, 354);
  assert.equal(KA.progs, 354);
  for (const k of X.VOCAB) assert.ok(KA.seen[k] > 0, k);
  assert.ok(KA.budgetLong > 0);
  for (const [h, n] of Object.entries(KA.heads)) assert.ok(n > 0, h);
  assert.deepEqual(KA.unkeyed, []);
  assert.deepEqual(KA.disagree, []);
  assert.ok(KA.other > 0);
  assert.deepEqual(KA.otherKeyed, []);
});

test('the chip lattice: every keyed NSW run wears its ruled chip on the day and the strip, renamed or not', () => {
  // B0, B1, B2, B4
  const L = X.chipLattice(), CA = X.chipAudit(X.chipReaders(IA), buildAll(L));
  assert.equal(L.length, 180);
  assert.ok(CA.nsw > 0 && CA.unkeyed > 0);
  assert.deepEqual(CA.day, []);
  assert.deepEqual(CA.strip, []);
  assert.ok(CA.relabels > 0);
  assert.deepEqual(CA.relabel, []);
});

const RLAT = X.readersLattice();
const RA = X.readersAudit(IA, RLAT);

test('the readers\' lattice: halfstep and easy mode act by key, strides park whole, the test eve rests, interference by key', () => {
  // H1, H2, H3, E1, E2, E3, E3e, E4, E5, E6, E7a, I1, I4
  const { H, E, I } = RA;
  assert.equal(RLAT.length, 96);
  assert.deepEqual(H.bad, []);
  for (const k of ['easy', 'trial', 'bench']) { assert.ok(H.byKey[k] > 0, k); assert.ok(!H.hit[k], k); }
  assert.deepEqual(E.bad, []);
  for (const k of ['int', 'chi', 'long', 'steady', 'bench', 'trial', 'easy']) assert.ok(E.total[k] > 0, k);
  assert.ok(E.dated > 0); assert.deepEqual(E.trialsLeft, []);
  assert.deepEqual(E.kept, []);
  assert.ok(E.eves > 0); assert.deepEqual(E.eveBad, []);
  assert.ok(E.stridesDealt > 0); assert.deepEqual(E.stridesLeft, []); assert.deepEqual(E.plusLeft, []); assert.deepEqual(E.dose, []);
  assert.deepEqual(E.protectKey, []);
  assert.ok(E.plainStrides > 0); assert.deepEqual(E.plainBad, []);
  assert.ok(I.n > 0); assert.deepEqual(I.bad, []); assert.deepEqual(I.relabel, []);
});

test('the rename surgery: no swap of either quality label moves any of the 180 pace programs', () => {
  // L:0b3d9a6a, L:6a421523
  const RN = X.renameAudit(IA, IA.html, RLAT, RA.get, V => pinClock(V, NOON));
  assert.equal(RN.cells, 180);
  for (const s of RN.swaps) assert.deepEqual(s.moved, [], s.slot + ' "' + s.from + '" to "' + s.to + '"');
});
