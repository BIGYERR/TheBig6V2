// The Expo session sheet against today's, swept (the integration file of this name walks HALF_MANNY; this walks the
// ten seeded programs of support/programs.ts). Each program goes through the standard history (support/stored-state.ts
// life), and at each of its five stretches: every training day of every week is drawn as a sheet by both apps and
// compared whole; then every training day of the week in view is worked through its sheet on both, the stores, the
// form and the toasts held equal after every tap (support/native-session-sheet.ts). Every launch a phone makes here is
// a launch of the beta's seam too (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { tally, workDay } from '../support/native-deck-logging.ts';
import { both } from '../support/native-deck-swap.ts';
import { everySheetDrawn, sheetTally, sheetsSeen, workSheet } from '../support/native-session-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
/** Floors for the second session's counts, each under what was measured. */
// Measured: 2,755 add sheets holding 41,093 rows; 40 sheets with the move the history added, 30 with the Wildcard tag;
// in the walk 198 add sheets (706, 950 and 1,188 rows by tier), 198 picks (89 on the fallback dose, 87 on a donor's,
// 22 as open sets), 127 removes, 354 sheets drawn holding an added move.
const ADD_ROWS_FLOOR = 40000, ADDED_FLOOR = 30, WILD_FLOOR = 25;
/** The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it. */
const walkable = (seeded: Cfg): Cfg => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);

test('the ten seeded programs: every day\'s sheet drawn by the beta is today\'s, whole, at every launch of the standard history', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const seen = sheetsSeen();
  let stages = 0;
  for (const seeded of Object.values(PROGRAMS)) life(walkable(seeded), CREATED, undefined, (_stage, P) => { everySheetDrawn(P, seen); stages++; });
  assert.equal(stages, 50);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.drawn', JSON.stringify(seen));
  // The ten programs hold 551 training days as generated; five launches of each make 2,755 sheets.
  assert.ok(seen.days >= 2700, 'sheets drawn: ' + JSON.stringify(seen));
  assert.ok(seen.kinds['log'] === seen.days && (seen.kinds['sections'] || 0) >= 2600, 'every sheet has its log, and its sections where it lifts: ' + JSON.stringify(seen));
  assert.ok(seen.cardio >= 1800 && seen.live >= 30, 'sheets with a run, a ride or a swim, and with it logged: ' + JSON.stringify(seen));
  assert.ok(seen.done >= 100 && seen.skipped >= 30 && (seen.kinds['nudge'] || 0) >= 10, 'sheets of a day done, of a day skipped, with the range nudge: ' + JSON.stringify(seen));
  // The sheet's second session: the add sheet of every day, on both, whole. The floors sit under what was measured.
  assert.ok(seen.addSheets === seen.days && seen.addRows >= ADD_ROWS_FLOOR, 'the add sheet compared for every day: ' + JSON.stringify(seen));
  assert.ok(seen.added >= ADDED_FLOOR && (seen.kinds['wildcard'] || 0) >= WILD_FLOOR, 'sheets with an added move, and with the Wildcard tag: ' + JSON.stringify(seen));
});

test('the ten seeded programs: every training day of the week in view, at each stretch, worked through its sheet on both apps', () => {
  const T = sheetTally(), D = tally();
  let stages = 0;
  for (const seeded of Object.values(PROGRAMS)) {
    let n = 0;
    life(walkable(seeded), CREATED, undefined, (_stage, P) => {
      const { Q, store, grid } = both(P);
      const week: number = Q.ev('calcCurrentWeek()');
      for (const d of training(Q, week)) {
        // Every other day its cards are worked through the deck first, on both, and left unmarked.
        if (n % 2 === 0) workDay(Q, store, grid, week, d, n, D, false);
        workSheet(Q, store, grid, week, d, n++, T);
      }
      stages++;
    });
  }
  assert.equal(stages, 50);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ sheet: T, deck: D }));
  // HALF_MANNY alone makes 25 days and 128 taps (the integration file); ten programs make several times that.
  assert.ok(T.days >= 150 && T.taps >= 800 && T.checks >= T.taps, JSON.stringify(T));
  assert.ok(T.slides >= 100 && T.notes >= 150 && T.edits >= 60 && T.dones >= 100 && T.skips >= 50 && T.undone >= 100 && T.reopens >= 150, JSON.stringify(T));
  assert.ok(T.popups >= 100 && T.cardio >= 200 && T.live >= 20 && T.carried >= 15 && T.logNudges >= 30 && T.drawnDone >= 60 && T.drawnSkipped >= 30, JSON.stringify(T));
  // The sheet's second session: add sheets, picks of every kind of dose, removes.
  assert.ok(T.addSheets >= 100 && T.adds >= 100 && T.removes >= 60 && T.addedDrawn >= 150, JSON.stringify(T));
  assert.ok((T.addRows['gap'] || 0) >= 300 && (T.addRows['more'] || 0) >= 300 && (T.addRows['off'] || 0) >= 300, JSON.stringify(T.addRows));
  assert.ok((T.addDoses['fallback'] || 0) >= 30 && (T.addDoses['a donor\'s'] || 0) >= 20 && (T.addDoses['open sets'] || 0) >= 5, JSON.stringify(T.addDoses));
});
