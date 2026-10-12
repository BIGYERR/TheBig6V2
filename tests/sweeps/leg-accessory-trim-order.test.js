'use strict';
// D84, Calves is pushed before Leg isolation, the whole comparison. The same claims as the D84 tests in
// tests/integration/leg-accessory.test.js, which run on 72 configs; this file runs all 1,728 (six tiers x two foci x two
// experiences x lift only, pace, half x healthy, shoulder, low back and knee protect x three rest patterns x two seeds),
// each built on the app and on the app with the two pushes swapped back. CI runs it, the 60-second check does not.
// Every difference between the two is the push order and nothing else.
// Ceilings typed from the ruling's census (V197, tests/measure/v197_d84_census.js): the order made 120 cells over 18
// config keys posterior-free, 186 over 33 in all, every one carrying low back protect. They are down-only; the counts
// today are golden values in tests/snapshots/leg-accessory-trim-order.json with the label delta and the cap census.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchSnapshot } = require('../support/snapshot.js');
const LA = require('../support/leg-accessory.js');

const L = LA.trimLattice();
const R = LA.trimCompare(L);

test('the comparison lattice is the full 1,728-config product, every tier and injury state built on both apps', () => {
  // E0 (the lattice enumeration), E1a, E1b, E1c, E1d
  assert.equal(L.length, 6 * 2 * 2 * 3 * 4 * 3 * 2);
  assert.equal(L.length, 1728);
  assert.deepEqual(R.threw, []);
  assert.equal(R.configs, 1728);
  assert.ok(R.cells > 0);
  assert.equal(Object.keys(R.inj).length, 4);
  assert.equal(Object.keys(R.tiers).length, 6);
});

test('Calves falls on no day and rises on some: D84 is in the app', () => {
  // E1e, E1f
  assert.deepEqual(R.fell, []);
  assert.ok(R.rose > 0);
});

test('exactly two labels move, Calves up and Leg isolation down', () => {
  // E2a, E2b, E2c
  const moved = Object.keys(R.labelDelta).filter((l) => R.labelDelta[l] !== 0).sort();
  assert.deepEqual(moved, ['Calves', 'Leg isolation']);
  assert.ok(R.labelDelta.Calves > 0 && R.labelDelta['Leg isolation'] < 0);
});

test('every posterior-free leg cell the order creates is bodyweight, hypertrophy and low back protect, inside the ruling ceilings', () => {
  // E3b, E3c, E3d
  const found = Object.keys(R.zeroNew);
  const out = found.filter((k) => { const p = k.split('|'); return !(p[0] === 'bodyweight' && p[1] === 'hypertrophy' && p[4] === 'lowback/protect'); });
  assert.deepEqual(out, []);
  assert.ok(found.reduce((a, k) => a + R.zeroNew[k], 0) <= 120);
  assert.ok(found.length <= 18);
});

test('every posterior-free leg cell in the app, caused or not, carries low back protect, inside the ruling ceilings', () => {
  // E3e, E3f, E3g
  const all = Object.keys(R.zeroAll);
  assert.deepEqual(all.filter((k) => k.split('|')[4] !== 'lowback/protect'), []);
  assert.ok(R.zeroAllCells <= 186);
  assert.ok(all.length <= 33);
});

test('a day the order changes costs 0 to 4 sets more, one Calves slot at most, never less', () => {
  // E4d, E4l
  assert.deepEqual(R.costOut, []);
  assert.deepEqual(R.costDown, []);
});

test('days over the cap are older than D84: some are untouched by it, and they outnumber every day it changed', () => {
  // E4o, E4p
  assert.ok(R.overUnchanged > 0);
  assert.ok(R.overA > R.changed);
});

test('the comparison counts match tests/snapshots/leg-accessory-trim-order.json', () => {
  matchSnapshot('leg-accessory-trim-order', {
    configs: R.configs, dayCells: R.cells, changedByTheOrder: R.changed, labelDelta: R.labelDelta, calvesRises: R.rose,
    costMaxDelta: R.costMax, overCap: R.overA, overCapUntouched: R.overUnchanged, overCapCrossedByTheOrder: R.overIntroduced,
    posteriorFreeCausedCells: Object.values(R.zeroNew).reduce((a, b) => a + b, 0), posteriorFreeCells: R.zeroAllCells,
  });
});
