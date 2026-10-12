// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Cardio sessions, the lattice. The same Short Interval claims as tests/integration/cardio-sessions.test.js, which runs
// them on a sample; this file runs them whole. CI runs it, the 60-second check does not.
//   - the pace lattice: six entered miles (5:30 to 12:00) x three goal distances (1, 1.5, 3 mi) x three seeds, plus the
//     6:46 mile at seed 76308 that reaches the minute carry (55 programs);
//   - the SI card rule over that lattice, PRT TING's own goal, and PRT TING's athlete on all 35 three-training-day
//     calendars (7 spacer calendars, 28 two-quality).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock } from '../support/app.ts';
import * as X from '../support/cardio-sessions.ts';
const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
const build = cfg => ({ cfg, prog: IA.buildProgram(X.clone(cfg)) });
const LAT = X.paceLattice().map(build);
const AUD = X.intDoctrineAudit(LAT);

test('the pace lattice builds 55 programs', () => {
  assert.equal(LAT.length, 55);
});

test('every SI card\'s pace is exactly 16 s/mi under its printed goal pace, and the logged target agrees, cutbacks included', () => {
  // D1, D3
  assert.ok(AUD.d1n > 0); assert.deepEqual(AUD.d1, []);
  assert.ok(AUD.d3blocks > 0 && AUD.d3cut > 0 && AUD.d3steps > 0);
  assert.deepEqual(AUD.d3, []);
});

test('every block opens on 4 repeats, none passes 8, the cap the note states is the highest prescribed', () => {
  // D3b, D9d
  assert.ok(AUD.d3bBlocks > 0 && AUD.d3bTop > 0);
  assert.deepEqual(AUD.d3b, []);
  assert.equal(AUD.maxReps, X.REPS_CEILING);
  assert.ok(X.RULED_SI_NOTE.indexOf('Hard cap at ' + AUD.maxReps) >= 0);
});

test('every recovery band is 2 to 2.5 x the work by hand, every card carries guide B\'s warm-up, no card a dash', () => {
  // D4, D4b, D5, D5b, D6b
  assert.ok(AUD.d4n > 0); assert.deepEqual(AUD.d4, []);
  assert.ok(AUD.ratioLo >= X.REC_LO_X - 0.01 && AUD.ratioHi <= X.REC_HI_X + 0.01);
  assert.equal(AUD.d5old, 0); assert.equal(AUD.d5oldWarm, 0); assert.equal(AUD.d5warm, AUD.d5n);
  assert.deepEqual(AUD.d6, []);
});

test('the SI card count is a rule on every build: 56 four-run blocks, and 35 three-run calendars, 7 spacer and 28 two-quality', () => {
  // D7
  const three = X.threeRunCalendars().map(c => build(c.cfg));
  const T = X.intCardRuleAudit(LAT.concat([build(X.PINNED())], three));
  assert.deepEqual(T.bad, []);
  assert.deepEqual([T.four, T.three, T.spacer, T.twoq], [56, 35, 7, 28]);
});
