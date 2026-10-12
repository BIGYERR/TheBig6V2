// Leg lift placement, every lattice whole: the claims tests/integration/leg-lift-placement.test.js runs on one seed and a
// sample (D36, D127, D104a), here on every seed and every config the rulings were measured on. CI runs it, the
// 60-second check does not.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as L from '../support/leg-lift-placement.ts';
test('the pace family on 64 calendars by two seeds (1,408 weeks): no leg role on the long run or its eve at any training-day count, every first-week placement cost-minimal, a speed day in every shaped week', () => {
  const T = L.paceEveTally([1001, 2002]);
  assert.deepEqual(Object.keys(T.byDays).map(n => [n, T.byDays[n].weeks, T.byDays[n].eve]), [['4', 770, 0], ['5', 462, 0], ['6', 154, 0], ['7', 22, 0]]);
  assert.deepEqual(T.eveHits, []);
  assert.deepEqual(T.dayHits, []);
  assert.ok(T.couldHit > 200, T.couldHit + ' weeks where a hit was possible');
  assert.equal(T.placements, 128);
  assert.deepEqual(T.offMin, []);
  assert.deepEqual({ shaped: T.shaped, speedless: T.speedless }, { shaped: 1408, speedless: 0 });
});

test('run_base on every two- and three-rest-day calendar by two seeds (112 programs): placed by its run shape with the run_base note, never the D36 note', () => {
  const T = L.runBaseNotes([1001, 2002]);
  assert.equal(T.total, 112);
  assert.ok(T.long > 0);
  assert.equal(T.d36, 0);
  assert.deepEqual(T.bad, []);
});

test('the run_base lattice whole (1,560 programs): every class reached, label and key agree on every card, no lower body Main on a long run or its eve, the notes, and no steady run note', () => {
  const T = L.runBaseTally(1);
  assert.equal(T.progs, 1560);
  assert.deepEqual(T.cls, { 'first long run in week 1': 1020, 'first long run in a later week': 270, 'placement week has no legLoad card': 270, 'no long run anywhere': 270 });
  assert.ok(T.cardsN > 40000, T.cardsN + ' run cards');
  assert.deepEqual(T.disagree.slice(0, 5), []);
  assert.deepEqual(T.hits.slice(0, 5), []);
  assert.deepEqual({ r2: T.r2, r3: T.r3 }, { r2: 1290, r3: 270 });
  assert.deepEqual(T.r2bad.slice(0, 5), []);
  assert.deepEqual(T.r3bad.slice(0, 5), []);
  assert.deepEqual([...T.notes].filter(n => typeof n === 'string' && n.includes(L.STEADY_DEAD)), []);
});

test('T-1 and T-2 of every dated pace or mile test (336 programs, 624 days) carry no section with items', () => {
  const T = L.testEveTally(1);
  assert.deepEqual({ progs: T.progs, days: T.days }, { progs: 336, days: 624 });
  assert.deepEqual(T.bad, []);
});

test('every short dated program with no lift day (140 of 620) prints no lift placement note', () => {
  const T = L.liftFreeTally(1);
  assert.deepEqual({ free: T.free, withLift: T.withLift }, { free: 140, withLift: 480 });
  assert.deepEqual(T.bad, []);
});
