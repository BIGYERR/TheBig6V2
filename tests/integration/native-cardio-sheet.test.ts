// The Expo app's cardio sheet against today's page (MIGRATION.md phase 3, row 3), on HALF_MANNY through the standard
// history: every training day of the week in view has its cardio log worked through on both apps (the wheels, Log,
// the sport picker, Done over an unlogged card), and after every tap every ia_ key is equal, value for value, no
// family left out, with the form, the fields on show, the dose, the readout, each wheel's place and every toast.
// Every expected value here is today's page, on purpose (support/native-cardio-sheet.ts). The reps stepper is on no
// day of HALF_MANNY: tests/sweeps/native-cardio-sheet.test.ts walks it on the test goal programs.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { fixtures } from '../support/app.ts';
import { cardioTally, workCard } from '../support/native-cardio-sheet.ts';
import { DAYS7 } from '../support/native-deck.ts';
import { tally, workDay } from '../support/native-deck-logging.ts';
import { both } from '../support/native-deck-swap.ts';
import { sheetTally } from '../support/native-session-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';

test('HALF_MANNY through the standard history: every run of the week in view logged by hand on both apps, the stores equal after every tap', () => {
  const T = sheetTally(), C = cardioTally(), D = tally();
  let n = 0, stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (_stage, P) => {
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    for (const d of training(Q, week)) {
      // Every third day its lift is worked through the deck first and left unmarked: the log then opens on set
      // drafts and logged lifts, and every save of the cardio carries them.
      if (n % 3 === 0) workDay(Q, store, grid, week, d, n, D, false);
      workCard(Q, store, grid, week, d, n++, T, C);
    }
    stages++;
  });
  assert.equal(stages, 5);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ sheet: T, cardio: C }));
  // The floors sit under what was measured: 20 days, 503 taps, 317 rests of a wheel (293 wrote, 24 did not, 22 jumped
  // back toward the middle), 44 Log taps (16 on an empty card), 61 chips (20 on the sport the card was on).
  assert.ok(T.days >= 18 && C.sheets >= 20 && T.taps >= 400 && T.checks >= T.taps, 'sheets and taps: ' + JSON.stringify({ T, C }));
  assert.ok(C.rolls >= 250 && C.rollsWritten >= 220 && C.rollsHeld >= 15 && C.recentres >= 15, 'wheels rolled, rests that wrote, rests that did not, columns jumped back: ' + JSON.stringify(C));
  assert.ok(C.logs >= 35 && C.logsEmpty >= 10 && (C.toasts['Run logged ✓'] || 0) >= 10 && (C.toasts['Ride logged ✓'] || 0) >= 3 && (C.toasts['Swim logged ✓'] || 0) >= 5, 'Log: ' + JSON.stringify(C));
  assert.ok(C.pickers >= 30 && C.chips >= 50 && C.chipsSame >= 15 && C.parked >= 20 && C.returned >= 10, 'the picker: ' + JSON.stringify(C));
  assert.ok(C.alone >= 18 && C.readouts >= 400, 'sheets drawn for the cardio alone, and readouts compared: ' + JSON.stringify(C));
  assert.ok((C.forms['time'] || 0) >= 8 && (C.forms['dist'] || 0) >= 6 && (C.forms['run'] || 0) >= 3, 'the forms drawn: ' + JSON.stringify(C.forms));
  assert.ok(T.dones >= 3 && T.undone >= 5 && T.popups >= 3 && T.carried >= 2, 'Done over an unlogged card, its undo, and saves that carried set drafts: ' + JSON.stringify(T));
});

/** A phone on the first day of `cfg`'s program that `want` picks, both apps over its keys. */
function onDay(cfg: Cfg, want: (day: { cardio?: { type?: string; dose?: { k?: string } | null } | null; sections?: { items?: unknown[] }[] }) => boolean) {
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  const { start } = firstWeek(P, CREATED);
  for (let w = 1; w <= P.prog.totalWeeks; w++) for (const d of DAYS7) {
    const day = P.day(w, d as never);
    if (!day || day.rest || !day.cardio || !want(day)) continue;
    P.launch(at(start, 7 * (w - 1) + DAYS7.indexOf(d)));
    return { ...both(P), week: w, d };
  }
  throw new Error('no such day');
}

test('a day that is only its run: its sheet keeps Done and Skip, and Done over the rolled card logs the run on both', () => {
  const T = sheetTally(), C = cardioTally();
  const { Q, store, grid, week, d } = onDay(fixtures.HALF_MANNY, (day) => !(day.sections || []).some((s) => (s.items || []).length > 0));
  // The turn 4 walk: the card rolled, then Done with no Log tap, the sheet opened again, and the undo.
  assert.ok(workCard(Q, store, grid, week, d, 4, T, C));
  assert.equal(C.aloneWithFoot, 1, 'the one cardio alone keeps the day\'s Done and Skip: ' + JSON.stringify(C));
  assert.ok(T.dones >= 1 && T.undone >= 1 && T.popups >= 1 && C.rolls >= 4, JSON.stringify({ T, C }));
});

test('a rep session: the stepper and the rep clock on both apps, the stores equal after every tap', () => {
  const T = sheetTally(), C = cardioTally();
  const cfg = PROGRAMS['1.5 mile test goal, commercial, balanced']!;
  const { Q, store, grid, week, d } = onDay(cfg, (day) => !!day.cardio && !!day.cardio.dose && day.cardio.dose.k === 'reps_dist');
  assert.ok(workCard(Q, store, grid, week, d, 6, T, C));
  assert.equal(C.forms['reps_dist'], 1);
  // Turn 6: two reps fewer on the draft, one more once logged, one more on the way back from the other sport.
  assert.ok(C.steps >= 4 && C.rolls >= 4 && C.logs >= 2 && C.chips >= 3, JSON.stringify(C));
});
