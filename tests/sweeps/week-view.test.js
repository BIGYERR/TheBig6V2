'use strict';
// Closing a day, every training day of HALF_MANNY (the D179 ruling's "70 Done taps"). The same claims as
// tests/integration/week-view.test.js, which runs them on a sample; this file runs the whole lattice. CI runs it, the
// 60-second check does not.
process.env.TZ = 'America/New_York';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const W = require('../support/week-view.js');

const RULING_TRAIN = 70;
const E = W.weekEnv();
const SUB = E.TRAIN.filter((_, i) => i % 7 === 0);
const allPass = (q, k, n) => {
  const t = q.get(k);
  assert.equal(t.fail, 0, k + ' failed: ' + t.examples.join(' | '));
  assert.equal(t.pass, n, k + ' ran ' + t.pass + ' cases, want ' + n);
};

test('HALF_MANNY has the ruling\'s 70 training days', () => {
  assert.equal(E.TRAIN.length, RULING_TRAIN);
});

E.setup();
const CLOSE = W.closeTaps(E, E.TRAIN);

test('every training day: Done, Skip and Mark Done ✓ close to This Week, undo stays, pop-up and toast as ruled', () => {
  for (const k of ['C1', 'C2', 'C3', 'C6', 'T1', 'T2']) allPass(CLOSE, k, RULING_TRAIN);
  allPass(CLOSE, 'C4', 2 * RULING_TRAIN);
  allPass(CLOSE, 'C5', 2 * RULING_TRAIN);
});

const TIMER = W.timerTaps(E, SUB);

test('every seventh training day: the rest timer stops on a close and keeps running on undo and ‹ Back', () => {
  for (const k of ['B1d', 'B1s', 'B1m', 'B2u', 'B2b']) allPass(TIMER, k, SUB.length);
});

const weeks = Object.keys(E.p.weeks).map(Number).sort((a, b) => a - b);
const HS = W.heroAndStrip(E, weeks);

test('every training day as today: the hero status, the strip marks and the Wildcard mark', () => {
  assert.equal(HS.todays, RULING_TRAIN);
  assert.equal(HS.pairs, RULING_TRAIN - weeks.length);
  allPass(HS.q, 'A1a', RULING_TRAIN);
  allPass(HS.q, 'A1b', RULING_TRAIN);
  allPass(HS.q, 'A1c', 3 * RULING_TRAIN);
  for (const k of ['A2', 'A3a', 'A3b', 'A3d']) allPass(HS.q, k, 2 * HS.pairs);
  allPass(HS.q, 'A3c', 4 * HS.pairs);
});

test('no render shows a day as before signup', () => {
  assert.ok(E.PRE.renders > 0);
  assert.equal(E.PRE.n, 0);
});
