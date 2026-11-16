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
});
