// The Expo app's cardio sheet against today's page (MIGRATION.md phase 3, row 3), on the ten seeded programs through
// the standard history: every training day of the week in view, at each stretch, has its cardio log worked through on
// both apps, and after every tap every ia_ key is equal, value for value, no family left out, with the form, the
// fields on show, the dose, the readout, each wheel's place and every toast. The runs' two rep forms, the rides and the
// swims are here; tests/integration/native-cardio-sheet.test.ts is HALF_MANNY's part of this, in the fast run.
// Every expected value is today's page, on purpose (support/native-cardio-sheet.ts).
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { cardioTally, workCard } from '../support/native-cardio-sheet.ts';
import { tally, workDay } from '../support/native-deck-logging.ts';
import { both } from '../support/native-deck-swap.ts';
import { sheetTally } from '../support/native-session-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
/** The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it. */
const walkable = (seeded: Cfg): Cfg => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);

test('the ten seeded programs: every cardio of the week in view, at each stretch, logged by hand on both apps', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const T = sheetTally(), C = cardioTally(), D = tally();
  let stages = 0;
  for (const seeded of Object.values(PROGRAMS)) {
    let n = 0;
    life(walkable(seeded), CREATED, undefined, (_stage, P) => {
      const { Q, store, grid } = both(P);
      const week: number = Q.ev('calcCurrentWeek()');
      for (const d of training(Q, week)) {
        // Every third day its lift is worked through the deck first and left unmarked, so the cardio's saves carry set drafts.
        if (n % 3 === 0) workDay(Q, store, grid, week, d, n, D, false);
        workCard(Q, store, grid, week, d, n++, T, C);
      }
      stages++;
    });
  }
  assert.equal(stages, 50);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ sheet: T, cardio: C }));
  // The floors sit under what was measured: 173 days, 3,906 taps, 2,255 rests of a wheel (2,087 wrote, 168 did not,
  // 156 jumped back toward the middle), 35 steps of the stepper, 375 Log taps (135 on an empty card), 516 chips (173
  // on the sport the card was on), and the forms drawn 238 times: 77 time, 72 distance, 23 miles and pace, 12 reps,
  // 33 rides, 21 swims.
  assert.ok(T.days >= 160 && T.taps >= 3500 && T.checks >= T.taps, 'days and taps: ' + JSON.stringify({ T, C }));
  assert.ok(C.rolls >= 2000 && C.rollsWritten >= 1800 && C.rollsHeld >= 120 && C.recentres >= 120 && C.steps >= 25, 'the wheels and the stepper: ' + JSON.stringify(C));
  assert.ok(C.logs >= 330 && C.logsEmpty >= 110 && (C.toasts['Run logged ✓'] || 0) >= 90 && (C.toasts['Ride logged ✓'] || 0) >= 40 && (C.toasts['Swim logged ✓'] || 0) >= 60, 'Log: ' + JSON.stringify(C));
  assert.ok(C.pickers >= 300 && C.chips >= 450 && C.chipsSame >= 150 && C.parked >= 200 && C.returned >= 90, 'the picker: ' + JSON.stringify(C));
  assert.ok(C.alone >= 160 && C.readouts >= 3500, 'sheets drawn for the cardio alone, and readouts compared: ' + JSON.stringify(C));
  for (const [form, floor] of Object.entries({ time: 60, dist: 60, run: 18, reps_dist: 10, bike: 25, swim: 15 })) assert.ok((C.forms[form] || 0) >= floor, form + ': ' + JSON.stringify(C.forms));
  assert.ok(T.dones >= 30 && T.skips >= 15 && T.undone >= 50 && T.popups >= 30 && T.carried >= 30 && T.parts >= 3, 'Done and Skip over the card, each undone, saves that carried set drafts, a day\'s skipped parts cleared: ' + JSON.stringify(T));
});
