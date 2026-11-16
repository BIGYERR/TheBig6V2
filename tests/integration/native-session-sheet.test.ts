// The Expo session sheet is today's session sheet (MIGRATION.md phase 3, the session sheet's first session; the
// record is docs/decisions/session-sheet.md; D289 P-NATIVEWRITES, docs/decisions/data-backup.md). Two proofs, both
// against today's page, on purpose: the page stays the reference until the cutover.
//
//   drawn   every training day of every week, at every launch of the standard history: the beta's sheet is today's,
//           whole (the header, the counter, every block of the body in order, the log, the foot), and the form each
//           draw leaves holds the same value in every field. Nothing is tapped.
//   tapped  at each of the five stretches of the history a second phone is launched on the keys as they stand, the
//           beta launches on the same keys into its own SQLite store, and every training day of the week in view is
//           worked through its sheet on both (support/native-session-sheet.ts): after every tap each ia_ key is
//           equal, value for value, no family left out, and so is every toast and every pop-up.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { fixtures } from '../support/app.ts';
import { DAYS7 } from '../support/native-deck.ts';
import { tally, workDay } from '../support/native-deck-logging.ts';
import { both } from '../support/native-deck-swap.ts';
import { TwoSheets, everySheetDrawn, sheetTally, sheetsSeen, workSheet } from '../support/native-session-sheet.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';

test('HALF_MANNY through the standard history: every day\'s sheet drawn by the beta is today\'s, whole, at every launch', () => {
  const seen = sheetsSeen();
  let stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (_stage, P) => { everySheetDrawn(P, seen); stages++; });
  assert.equal(stages, 5);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.drawn', JSON.stringify(seen));
  // Measured when this was written: 350 sheets (70 a launch), every one with its sections, its cardio card where
  // the day has one, and its log. The floors sit under what was measured.
  assert.ok(seen.days >= 340, 'sheets drawn: ' + JSON.stringify(seen));
  assert.ok((seen.kinds['sections'] || 0) >= seen.days && seen.kinds['log'] === seen.days, 'every sheet has its log, and sections where it lifts: ' + JSON.stringify(seen));
  assert.ok(seen.cardio >= 250 && seen.live >= 3, 'sheets with a run beside the lift, and with the run logged: ' + JSON.stringify(seen));
  assert.ok(seen.done >= 10 && seen.skipped >= 3 && seen.counters >= 300, 'sheets of a day done, of a day skipped, with a counter: ' + JSON.stringify(seen));
  assert.ok((seen.kinds['nudge'] || 0) >= 1, 'the range nudge drawn: ' + JSON.stringify(seen));
});

test('HALF_MANNY through the standard history: every training day of the week in view worked through its sheet on both apps, the stores equal after every tap', () => {
  const T = sheetTally(), D = tally();
  let n = 0, stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (_stage, P) => {
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    for (const d of training(Q, week)) {
      // Every other day its cards are worked through the deck first, on both, and left unmarked: the sheet then
      // opens on drafts, logged lifts and skipped moves, and its saves carry them.
      if (n % 2 === 0) workDay(Q, store, grid, week, d, n, D, false);
      workSheet(Q, store, grid, week, d, n++, T);
    }
    stages++;
  });
  assert.equal(stages, 5);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ sheet: T, deck: D }));
  assert.ok(T.days >= 20 && T.taps >= 100 && T.checks >= T.taps, 'days and taps: ' + JSON.stringify(T));
  assert.ok(T.slides >= 15 && T.notes >= 20 && T.edits >= 10, 'the slider, the notes, skips and put backs: ' + JSON.stringify(T));
  assert.ok(T.dones >= 15 && T.skips >= 8 && T.undone >= 15 && T.reopens >= 20, 'Done, Skip, each undone, the sheet opened again: ' + JSON.stringify(T));
  assert.ok(T.popups >= 15 && T.toasts >= 40, 'the pop-up after Done and the toasts: ' + JSON.stringify(T));
  assert.ok(T.cardio >= 30 && T.live >= 3 && T.carried >= 3, 'sheets with a run, with the run logged, and saves that carried set drafts: ' + JSON.stringify(T));
  assert.ok(T.drawnDone >= 10 && T.drawnSkipped >= 5 && T.logNudges >= 1, 'sheets drawn on a day done, on a day skipped, with the never marked nudge: ' + JSON.stringify(T));
});

test('a day with a part skipped on This Week: the sheet\'s Done takes the day whole, on both', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  const two = days.find((d) => (P.ev(`dayPartsOf(${first},${JSON.stringify(d)})`) as string[]).length > 1);
  assert.ok(two, 'a day of two parts in the first week');
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(two!)));
  P.ev(`skipPart(${first},${JSON.stringify(two)},'lift');`);
  const { Q, store, grid } = both(P);
  assert.ok(store.get('ia_parts_' + grid.id), 'the part\'s skip is stored before the sheet opens');
  const T = sheetTally();
  const S = new TwoSheets(Q, store, grid, first, two!, T, 'a part skipped');
  assert.ok(S.open());
  S.status('complete');
  assert.equal(JSON.parse(store.get('ia_parts_' + grid.id)!)['w' + first + '_' + two], undefined, 'the day\'s parts are cleared');
  assert.equal(JSON.parse(store.get('ia_comp_' + grid.id)!)['w' + first + '_' + two].status, 'complete');
  assert.equal(JSON.parse(store.get('ia_comp_' + grid.id)!)['w' + first + '_' + two].parts, undefined, 'the status is the athlete\'s, not the parts\'');
  assert.equal(T.parts, 1);
});

test('the program\'s last day: Done raises the season\'s pop-up once, its undo lets it go, and Done raises it again, on both', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { start } = firstWeek(P, CREATED);
  const fin = P.ev('finalScheduledDay()') as { week: number; d: string };
  P.launch(at(start, 7 * (fin.week - 1) + DAYS7.indexOf(fin.d)));
  const { Q, store, grid } = both(P);
  const T = sheetTally();
  const S = new TwoSheets(Q, store, grid, fin.week, fin.d, T, 'the last day');
  assert.ok(S.open());
  S.status('complete');
  assert.equal(store.get('ia_season_shown_' + grid.id), '1', 'the season\'s pop-up is marked shown');
  S.reopen();
  S.status('complete');
  assert.equal(store.get('ia_season_shown_' + grid.id), null, 'the undo lets it go');
  assert.equal(T.seasons, 1);
  S.status('complete');
  assert.equal(store.get('ia_season_shown_' + grid.id), '1', 'and Done marks it again');
  assert.equal(T.popups, 2);
});
