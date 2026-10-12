'use strict';
// Leg lift placement: which training days take the hinge day (pull) and the squat day (legs), given the run week.
// Rulings:
//   D36   hard days hard: on an NRC race program the long run and its eve are off limits to both leg roles, the hinge
//         rides a speed day, and every other day is priced by one cost table;
//   D127  the NSW pace family (run_pace_goal, run_mile_time, run_15_under10) places by the same table, its INT and CHI
//         being the speed days and the LSD that loads the legs the long run;
//   D104a run_base places by its own run week: the long run is the long-keyed run, read from the first week that has
//         one; a program with no long-keyed run keeps the 48 hour rule; a program with no lift day prints no note.
// The record is in the handoff and tests/measure/v205_rulings/ and v208_rulings/.
//
// The cost table, the notes, the role names and the test-week arithmetic are typed in
// tests/support/leg-lift-placement.js. This file runs each claim on one seed of each lattice and a sample of the
// run_base and dated lattices; tests/sweeps/leg-lift-placement.test.js runs them whole.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { progDigest } = require('../support/app.js');
const R = require('../support/run-week-layout.js');
const L = require('../support/leg-lift-placement.js');

test('a pace program, a run_base program and a dated mile test each equal themselves built twice', () => {
  const cfgs = [R.paceCfg(R.MARIO_REST, 1001), L.runBaseLattice()[0].cfg, L.datedTestCfg(L.MILE_TEST, 'bike', ['sun'], 2, 3)];
  for (const c of cfgs) assert.equal(progDigest(R.build(c)), progDigest(R.build(c)), c.cardioGoals.run.id);
});

test('the source: the pace family predicate is declared once with its three ids, isNRC is set in one place, the speed arm names INT and CHI, one shape feeds the placement and the region guard', () => {
  const src = R.code();
  assert.equal((src.match(/_paceFam\s*=/g) || []).length, 1);
  assert.match(src, /_paceFam\s*=\s*g\s*=>[^;]*run_pace_goal[^;]*run_mile_time[^;]*run_15_under10/);
  assert.equal((src.match(/isNRC\s*:\s*true/g) || []).length, 1, 'only the NRC session builder sets isNRC');
  assert.match(src, /Interval \\\(INT\\\)[^\n]*Continuous High Intensity \\\(CHI\\\)[^\n]*speed\.add/);
  assert.equal((src.match(/_nrcRunShape\s*\(/g) || []).length, 3, 'the declaration, the placement and the region guard');
});

let EVE = null, BASE = null;
const eve = () => EVE || (EVE = L.paceEveTally([1001]));
const base = () => BASE || (BASE = L.runBaseTally(20));

test('no leg role lands on the long run\'s eve at four, five, six or seven training days, nor on the long run itself, in a lattice where a hit was possible in more than 200 weeks', () => {
  const T = eve();
  assert.deepEqual(Object.keys(T.byDays).map(n => [n, T.byDays[n].weeks]), [['4', 385], ['5', 231], ['6', 77], ['7', 11]]);
  assert.deepEqual(T.eveHits, []);
  assert.deepEqual(T.dayHits, []);
  assert.ok(T.couldHit > 200, T.couldHit + ' weeks with the eve a training day and both leg roles in the week');
});

test('every first-week placement is cost-minimal under the D36 table, and the hand shape sees a speed day in every shaped week', () => {
  const T = eve();
  assert.equal(T.placements, 64);
  assert.deepEqual(T.offMin, []);
  assert.equal(T.shaped, 704);
  assert.equal(T.speedless, 0);
});

test("the pace family prints the D36 note, verbatim on Mario's calendar; a bike or a swim goal never does", () => {
  for (const g of R.PACE_IDS) assert.ok((R.build(R.paceCfg(R.MARIO_REST, 1001, g)).legRecoveryNote || '').includes(L.D36_NOTE), g);
  assert.ok((R.build(R.paceCfg(R.MARIO_REST, R.MARIO_SEED)).legRecoveryNote || '').includes(L.D36_NOTE));
  const bike = R.paceCfg(R.MARIO_REST, 1001);
  bike.cardioTypes = ['bike'];
  bike.cardioGoals = { bike: R.clone(R.BIKE_BASE) };
  const swim = R.paceCfg(R.MARIO_REST, 1001);
  swim.cardioTypes = ['swim'];
  swim.cardioGoals = { swim: { id: 'swim_base', label: 'Base', baselineDist: '1000', baseline: '1000yd' } };
  for (const c of [bike, swim]) assert.ok(!(R.build(c).legRecoveryNote || '').includes(L.D36_NOTE), c.cardioTypes[0]);
});

test('run_base places by its run week: a long-keyed run prints the run_base note, never the D36 note; no long-keyed run keeps the 48 hour rule', () => {
  const T = L.runBaseNotes([1001], 2);
  assert.equal(T.total, 28);
  assert.ok(T.long > 0);
  assert.equal(T.d36, 0);
  assert.deepEqual(T.bad, []);
});

test('week 1 carries CHI, and every hinge day that carries a run carries INT or CHI, CHI among them', () => {
  const T = L.hingeRuns();
  assert.ok(T.chiWk1 > 0, 'week 1 CHI cards');
  assert.ok(T.onRun > 0, 'hinge days on a run');
  assert.equal(T.onSlow, 0, 'hinge days on an easy or long run');
  assert.ok(T.onChi > 0, 'hinge days on CHI');
});

test('the run_base lattice, every twentieth config: every class reached, the label and the key name the same long run, no lower body Main on a long run or its eve, and the notes', () => {
  const T = base();
  assert.equal(T.progs, 78);
  for (const c of ['first long run in week 1', 'first long run in a later week', 'placement week has no legLoad card', 'no long run anywhere']) assert.ok(T.cls[c] > 0, c + ' ' + JSON.stringify(T.cls));
  assert.ok(T.cardsN > 0);
  assert.deepEqual(T.disagree, []);
  assert.deepEqual(T.hits, []);
  assert.ok(T.r2 > 0 && T.r3 > 0);
  assert.deepEqual(T.r2bad, []);
  assert.deepEqual(T.r3bad, []);
});

test('the run_base note obeys the copy rule: two short sentences, no dash or hyphen, no brand', () => {
  const N = L.BASE_NOTE;
  assert.doesNotMatch(N, /-/);
  assert.doesNotMatch(N, /[–—]/);
  assert.doesNotMatch(N, /Nike/i);
  assert.equal(N.split('.').filter(s => s.trim()).length, 2);
});

test('the steady run note is gone: no printed run_base note carries it, and the source does not', () => {
  const T = base();
  assert.deepEqual([...T.notes].filter(n => typeof n === 'string' && n.includes(L.STEADY_DEAD)), []);
  assert.equal(R.code().indexOf(L.STEADY_DEAD), -1);
});

test('T-1 and T-2 of a dated pace or mile test carry no section with items', () => {
  const T = L.testEveTally(7);
  assert.equal(T.progs, 48);
  assert.ok(T.days > 60, T.days + ' days');
  assert.deepEqual(T.bad, []);
});

test('a program with no lift day prints no lift placement note', () => {
  const T = L.liftFreeTally(9);
  assert.ok(T.free >= 10 && T.withLift > 0, JSON.stringify(T));
  assert.deepEqual(T.bad, []);
});
