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
//   added   the sheet's second session: the add sheet both apps open for every day is the same sheet, whole; a pick
//           and a remove are taps of the walk above; then, each on its own program, the test week's 1RM card and its
//           save, a double day's jog, and an added move across the launches that keep it and then let it go.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { fixtures } from '../support/app.ts';
import { DAYS7 } from '../support/native-deck.ts';
import { tally, workDay } from '../support/native-deck-logging.ts';
import { both } from '../support/native-deck-swap.ts';
import { TwoSheets, everySheetDrawn, removable, sheetTally, sheetsSeen, workSheet } from '../support/native-session-sheet.ts';
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
  // The second session. Measured: 350 add sheets with 5,337 rows, 4 sheets holding the move the history added, and
  // 3 with the Wildcard tag (the history's Wildcard, from the launch after it on).
  assert.ok(seen.addSheets === seen.days && seen.addRows >= 5000, 'the add sheet compared for every day: ' + JSON.stringify(seen));
  assert.ok(seen.added >= 3 && (seen.kinds['wildcard'] || 0) >= 3, 'sheets with an added move, and with the Wildcard tag: ' + JSON.stringify(seen));
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
  // The second session. Measured: 19 add sheets (73, 95 and 114 rows by tier), 19 picks (13 on the fallback dose, 6
  // on a donor's), 12 removes, 36 sheets drawn holding an added move.
  assert.ok(T.addSheets >= 15 && T.adds >= 15 && T.removes >= 8 && T.addedDrawn >= 25, 'add sheets, picks, removes: ' + JSON.stringify(T));
  assert.ok((T.addRows['gap'] || 0) >= 50 && (T.addRows['more'] || 0) >= 50 && (T.addRows['off'] || 0) >= 50, 'rows of each tier: ' + JSON.stringify(T.addRows));
  assert.ok((T.addDoses['fallback'] || 0) >= 5 && (T.addDoses['a donor\'s'] || 0) >= 3, 'picks on the fallback dose and on a donor\'s: ' + JSON.stringify(T.addDoses));
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

// ── The sheet's second session ─────────────────────────────────────────────────────────────────────────────────────
// The one program of the wizard's goal and focus cross that holds a test week (tests/measure/native-sheet-add_today.md):
// no cardio, a strength focus, six weeks. Its last week tests the bench on Monday, the deadlift on Tuesday and the
// squat on Wednesday.
const TEST_WEEK: Cfg = {
  name: 'SWEEP', primaryPath: 'body', cardioTypes: [], cardioGoals: {}, eventTargeted: false, liftingFocus: 'strength', experience: 'intermediate', ageBracket: '18-35',
  equipment: 'minimal', unit: 'lbs', restDays: ['sun'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed: 1001,
} as unknown as Cfg;

test('a test week\'s day: the 1RM card prefilled from the logged test set, the day\'s note, and the card\'s save writing the same max on both', () => {
  const P = new Phone().launch(CREATED);
  P.generate(TEST_WEEK);
  const { start } = firstWeek(P, CREATED);
  assert.deepStrictEqual(['mon', 'tue', 'wed'].map((d) => P.day(6, d as never).testLift), ['bench', 'deadlift', 'squat']);
  P.launch(at(start, 35 + DAYS7.indexOf('mon')));
  // The test set is logged on today's page before the beta takes the keys: 225 for 3 on the day's first move.
  P.open(6, 'mon');
  const main = P.day(6, 'mon').sections[0].items[0];
  P.logLift(main.name, main.detail, [3], [225]);
  const { Q, store, grid } = both(P);
  const T = sheetTally();
  const S = new TwoSheets(Q, store, grid, 6, 'mon', T, 'the bench test');
  assert.ok(S.open());
  assert.deepStrictEqual(S.maxCard(), { lift: 'bench', liftLabel: 'bench', unit: 'lbs', weight: '225', reps: 3 });
  const kinds = S.view.body.map((b) => b.kind);
  assert.equal(kinds.indexOf('e1rm'), kinds.indexOf('sections') + 1, 'the card stands after the first section: ' + kinds.join(', '));
  assert.deepStrictEqual(S.view.body.find((b) => b.kind === 'note'), { kind: 'note', html: 'This is what the block built toward. Test it, log it, and the next block anchors off the number you hit.' });
  // 225 × (1 + 3 / 30) = 247.5, rounded.
  assert.equal(S.saveMax('225', '3'), 'Saved. Your next block anchors off 248 lbs.');
  const cfg = (JSON.parse(store.get('ia_programs')!) as { id: string; cfg: Record<string, number> }[]).find((x) => x.id === grid.id)!.cfg;
  assert.deepStrictEqual([cfg['bench'], cfg['squat'], cfg['deadlift']], [248, 155, 185], 'the bench alone moved');
  assert.equal(S.saveMax('', '3'), null, 'no weight: nothing saved, nothing said, on either');
  assert.equal(S.saveMax('250', '1'), 'Saved. Your next block anchors off 250 lbs.', 'a single is itself');
  assert.equal(T.maxSaves, 3);
  // The next morning both launch on what was saved (support/native-launch.ts holds the two launches equal), and
  // every sheet of the program is still the same sheet.
  Q.launch(at(start, 36 + DAYS7.indexOf('mon'), '06:30'));
  const seen = everySheetDrawn(Q);
  assert.ok((seen.kinds['e1rm'] || 0) === 3 && (seen.kinds['note'] || 0) === 3, 'three test days, each with its card and its note: ' + JSON.stringify(seen.kinds));
});

test('a double day: a jog logged on a rest day, then a session moved onto it, stands above the work on both', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const J = JSON.stringify;
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  const rest = DAYS7.find((d) => { const x = P.day(first, d as never); return x && x.rest && days.some((t) => DAYS7.indexOf(t) > DAYS7.indexOf(d)); });
  assert.ok(rest, 'a rest day with a session after it');
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(rest!), '10:00'));
  // The rest sheet's own handlers, on today's page: a 25 minute walk at RPE 3, then the week's last session moved here.
  P.ev(`openRestSheet(${first},${J(rest)},'cardio');_rdSet('type','walk');_restDraft.mins='25';_restDraft.rpe=3;applyRestCardio();`);
  P.settle();
  const later = days.filter((t) => DAYS7.indexOf(t) > DAYS7.indexOf(rest!));
  P.ev(`openRestSheet(${first},${J(rest)},'move');_rdSet('pick',${J(later[later.length - 1])});applyRestMove();`);
  P.settle();
  assert.ok(!P.day(first, rest as never).rest, 'the rest day trains now');
  const { Q, store, grid } = both(P);
  const T = sheetTally();
  const S = new TwoSheets(Q, store, grid, first, rest!, T, 'a double day');
  assert.ok(S.open());
  const dayName = ({ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' } as Record<string, string>)[rest!];
  assert.deepStrictEqual(S.view.body[0], { kind: 'also', label: 'Also on ' + dayName, lines: ['25 min walk logged · RPE 3'], week: first, dayKey: rest });
  // The jog rides the sheet's own saves and an add: it is still the first block after each.
  S.notes('A walk this morning');
  const a = S.addSheet();
  S.add([...a.gap, ...a.more, ...a.off][0]!.name);
  S.status('complete');
  S.reopen();
  assert.equal(S.view.body[0]!.kind, 'also');
  assert.deepStrictEqual(JSON.parse(store.get('ia_logs_' + grid.id)!)['w' + first + '_' + rest].restLog, { walk: { mins: 25, rpe: 3 } });
});

test('an added move on a day touched in no other way: both apps hold it the next morning, and both have let it go once its week has passed', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  const d = days[0]!, at0 = 7 * (first - 1) + DAYS7.indexOf(d);
  P.launch(at(start, at0, '06:30'));
  let { Q, store, grid } = both(P);
  const T = sheetTally();
  let S = new TwoSheets(Q, store, grid, first, d, T, 'the day of the add');
  assert.ok(S.open());
  const a = S.addSheet();
  const name = [...a.gap, ...a.more, ...a.off][0]!.name;
  S.add(name);
  assert.equal(store.get('ia_hist_' + grid.id), null, 'no snapshot: the day was touched in no other way');
  assert.equal((JSON.parse(store.get('ia_edits_' + grid.id)!)['w' + first + '_' + d].add as { name: string }[])[0]!.name, name);
  // The next morning: each app launches on its own keys, and the move is on the card of both.
  Q.launch(at(start, at0 + 1, '06:30'));
  ({ Q, store, grid } = both(Q));
  S = new TwoSheets(Q, store, grid, first, d, T, 'the morning after');
  assert.ok(S.open());
  assert.equal(removable(S.view, name), name);
  // A week on: the launch has dropped the day's record, no snapshot holds the move, and it is on neither card.
  // Today's behaviour, carried as it is (docs/decisions/session-sheet.md).
  Q.launch(at(start, at0 + 7, '06:30'));
  ({ Q, store, grid } = both(Q));
  S = new TwoSheets(Q, store, grid, first, d, T, 'a week on');
  assert.ok(S.open());
  assert.equal(removable(S.view, name), null);
  assert.equal(store.get('ia_edits_' + grid.id), '{}');
});
