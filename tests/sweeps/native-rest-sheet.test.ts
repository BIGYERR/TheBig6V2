// The Expo app's rest day sheet and the coach's mile nudge against today's page (MIGRATION.md phase 3, row 5, its
// second session), on each of the ten seeded programs: the two doors asked on every day of the weeks around the one
// in view at each stretch of the standard history; before anything is trained, and again in the second week (an
// injury flagged, a move already stored) and the third (travel, the injury gone), every move the sheet offers made on
// a phone of its own and read at the next launch, and every sport's Log cardio with its efforts, Edit, Clear, a
// second sport, the double day and nothing left to move; the warning that names both neighbours; and the nudge: no
// offer after one run, the offer after two, both answers, and its silences. After every tap the page's draft, every
// byte of the sheet's markup, each toast, whether the sheet closed, the grid in hand, This Week under the sheet and
// every ia_ key is equal to today's page, value for value (support/native-rest-sheet.ts). Every expected value here
// is today's page, on purpose.
//
// Each kind of thing the sheet can draw, say or write has a floor in the last test, read off the model's builders
// (rest-sheet-model.ts moveView and cardioView, rest-writes.ts, nudge-screen.ts), not off what a walk happened to draw.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { bothNeighboursWalk, cardioWalk, doorWalk, moveWalk, nudgeWalk, restTally } from '../support/native-rest-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { firstWeek, life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
// A swim program's baseline as a walker can log it (support/native-deck.ts walkable).
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const names = Object.keys(PROGRAMS);
const D = restTally(), M = restTally(), C = restTally(), N = restTally();
const seen = { moves: 0, cardioWeeks: 0, both: 0, nudged: 0, tooFewEasy: 0 };

for (const name of names) {
  const cfg = walkable(PROGRAMS[name]!);
  test(name + ': the doors, Move, Log cardio and the nudge through the standard history, the sheets and the stores equal', () => {
    let stages = 0;
    life(cfg, CREATED, undefined, (stage, P) => {
      const first = firstWeek(P, CREATED).first;
      doorWalk(P, D, name + ', ' + stage + ', the doors');
      const w = stage === '0 generated' ? first : stage === '2 second week' ? first + 1 : stage === '3 third week' ? first + 2 : 0;
      if (w) {
        seen.moves += moveWalk(P, w, M, name + ', ' + stage + ', move');
        if (cardioWalk(P, w, C, name + ', ' + stage + ', cardio')) seen.cardioWeeks++;
      }
      if (stage === '0 generated') {
        for (let k = first, drew = false; k < first + 4 && !drew; k++) { drew = bothNeighboursWalk(P, k, M, name + ', both neighbours'); if (drew) seen.both++; }
        if (nudgeWalk(P, first, N, name + ', the nudge') >= 2) seen.nudged++; else seen.tooFewEasy++;
      }
      stages++;
    });
    assert.equal(stages, 5);
  });
}

test('what the ten programs showed: every kind the sheet draws, every toast, every write, and the nudge', () => {
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ doors: D, move: M, cardio: C, nudge: N, seen }, null, 1));
  const floor = (T: Record<string, number>, k: string, n: number): void => assert.ok((T[k] || 0) >= n, k + ' drawn ' + (T[k] || 0) + ' times, floor ' + n);
  // The doors: 2,028 asks at five stretches. Opened on each view, opened on Log cardio where Move was asked (a day a
  // session moved away from), refused on a day that has not come, and on a day whose every session is done.
  floor(D, 'taps', 2000); floor(D, 'door opened on move', 60); floor(D, 'door opened on cardio', 60); floor(D, 'door opened on cardio, asked move', 5);
  floor(D, 'door refused: That rest day has not come around yet', 1500); floor(D, 'move: Nothing left to move', 5);
  // Move a session here: 270 moves, each on a phone of its own. Every piece of the view, both warnings, the two
  // toasts, the write, This Week on both days, and the next launch.
  assert.equal(seen.moves, 270, 'moves made');
  assert.ok(M['move stored'] === 270 && M['toast: Moved.'] === 270 && M['move kept at the next launch'] === 270 && M['This Week compared'] === 540, 'every move stored, said, kept and seen under the sheet: ' + JSON.stringify(M));
  floor(M, 'move view', 600); floor(M, 'move: a session row', 3000); floor(M, 'move: a row picked', 270); floor(M, 'move: Move it here', 270);
  floor(M, 'move: the warning names one day', 50); floor(M, 'move: the warning names two days', 5);
  floor(M, 'toast: Pick a session', 30); floor(M, 'door opened on cardio, asked move', 30); floor(M, 'door refused: That rest day has not come around yet', 30);
  // Log cardio: both titles, every sport's face and control, the efforts and Noted, the button's two words, Clear's two.
  for (const k of ['cardio: What did you do?', 'cardio: Your <jog> on <day>', 'cardio: a chip with a check', 'cardio: the time wheel', 'cardio: the miles wheel', 'cardio: no distance (a walk)',
    'cardio: effort RPE 5 picked', 'cardio: effort RPE 7 picked', 'cardio: effort RPE 9+ picked', 'cardio: Noted', 'cardio: Log it', 'cardio: Logged ✓', 'cardio: Clear this <jog>', 'cardio: Tap again to clear',
    'cardio: face of run', 'cardio: face of walk', 'cardio: face of bike', 'cardio: face of swim', 'cardio: face of row', 'cardio: the yards box', 'cardio: the meters box', 'a button rewritten by hand compared', 'cardio: a face set']) floor(C, k, 60);
  floor(C, 'cardio: a chip of a sport the program does not train', 30);
  floor(C, 'cardio: a record above the dial', 30);
  // Its toasts and its writes, each way a log and a clear can land.
  for (const k of ['toast: Nothing to log yet. Add a time or a distance.', 'toast: Nothing to log yet. Add a time.', 'toast: To remove it, use Clear.', 'toast: <minutes> <jog> logged', 'toast: <distance> <jog> logged', 'toast: <Jog> cleared',
    'Logged ✓ unchanged: closed, nothing written', 'log stored: the day\'s first jog', 'log stored: over the sport\'s record', 'log stored: a second sport beside the first', 'log stored: mins dist rpe', 'log stored: mins rpe', 'log stored: dist',
    'clear armed', 'clear: the day\'s entry goes', 'clear: another jog stays', 'clear: the jog goes, the day\'s entry stays']) floor(C, k, 30);
  // The double day and what stands around Move on a day that holds a jog.
  for (const k of ['move: Already logged here', 'move: Nothing left to move', 'move: Log cardio instead', 'door opened on a double day', 'the session sheet drawn again']) floor(C, k, 30);
  assert.ok(seen.cardioWeeks === 30 && seen.both >= 5, JSON.stringify(seen));
  // The nudge: four of the ten programs prescribe two easy runs with a pace in their first three weeks. Each draws
  // both offers, both answers, and each silence.
  assert.ok(seen.nudged === 4 && seen.tooFewEasy === 6, JSON.stringify(seen));
  // The slower offer is drawn twice a program: against one pace, and against two once the mile moved between the runs.
  assert.ok(N['nudge: an offer to go slower'] === 8 && N['nudge: against one pace'] === 8 && N['nudge: against two paces'] === 4, JSON.stringify(N));
  for (const k of ['nudge: an offer to go faster', 'nudge: Keep', 'nudge: Update mile time', 'nudge: the pencil opened on the offer',
    'nudge: no offer, the first easy card', 'nudge: no offer, a record in the way', 'nudge: no offer, off the plan in opposite ways']) assert.equal(N[k], seen.nudged, k + ': ' + JSON.stringify(N));
  floor(N, 'nudge: no offer, the pencil locked', 4);
});
