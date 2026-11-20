// The Expo app's rest day sheet and the coach's mile nudge against today's page (MIGRATION.md phase 3, row 5, its
// second session), on The Half Manny: the two doors, Move a session here, Log cardio with Clear, and the nudge.
// After every tap the page's draft, every byte of the sheet's markup, each toast, whether the sheet closed, the grid
// in hand, This Week under the sheet and every ia_ key are equal to today's page (support/native-rest-sheet.ts).
// Every expected value here is today's page, on purpose; the ten programs through the standard history are
// tests/sweeps/native-rest-sheet.test.ts. Kept light: the 60-second check runs this file.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { describe, test } from 'vitest';
import { openRest } from '../../frontends/native/src/rest-sheet/rest-sheet-model.ts';
import { bothNeighboursWalk, cardioWalk, doorWalk, moveWalk, nudgeWalk, restTally } from '../support/native-rest-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, firstWeek } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const names = Object.keys(PROGRAMS);
const HALF = PROGRAMS[names[0]!]!;

/** A phone with one program made the wizard's way at CREATED, and its first whole week. */
function made(cfg: unknown): { P: Phone; w: number } {
  const P = new Phone().launch(CREATED);
  P.generate(cfg as never);
  return { P, w: firstWeek(P, CREATED).first };
}

describe('native rest sheet: The Half Manny', () => {
  const T = restTally();
  const at = (k: string): number => T[k] || 0;
  const { P, w } = made(HALF);

  test('the doors: both views asked on every day of the first two weeks, each refused or opened as today\'s', () => {
    doorWalk(P, T, 'half manny, the doors', [w, w + 1]);
    assert.ok(at('door refused: That rest day has not come around yet') > 0 && at('taps') >= 28, JSON.stringify(T));
  });

  test('Move: two sessions moved onto a rest day, the store, the grid and This Week equal, and kept at the next launch', () => {
    assert.equal(moveWalk(P, w, T, 'half manny, move', 2), 2);
    assert.ok(at('move stored') === 2 && at('move kept at the next launch') === 2 && at('toast: Pick a session') === 1 && at('door opened on cardio, asked move') === 1, JSON.stringify(T));
  });

  test('Log cardio: every sport\'s face, the efforts, Log, Edit, Clear, a second sport, a double day, nothing left to move', () => {
    assert.ok(cardioWalk(P, w, T, 'half manny, cardio'), 'the week has a rest day that takes a move');
    for (const k of ['cardio: What did you do?', 'cardio: Your <jog> on <day>', 'cardio: Noted', 'cardio: Logged ✓', 'cardio: Tap again to clear', 'Logged ✓ unchanged: closed, nothing written',
      'toast: To remove it, use Clear.', 'toast: <minutes> <jog> logged', 'toast: <distance> <jog> logged', 'toast: <Jog> cleared', 'clear: another jog stays', 'clear: the day\'s entry goes',
      'move: Already logged here', 'move: Nothing left to move', 'door opened on a double day', 'the session sheet drawn again', 'a button rewritten by hand compared',
      'clear: the jog goes, the day\'s entry stays', 'cardio: a chip of a sport the program does not train', 'cardio: a record above the dial']) assert.ok(at(k) > 0, k + ': ' + JSON.stringify(T));
  });

  test('the spacing warning names both neighbours when both train the moved session\'s region', () => {
    let drew = false;
    for (let k = w; k < w + 4 && !drew; k++) drew = bothNeighboursWalk(P, k, T, 'half manny, both neighbours');
    assert.ok(drew && at('move: the warning names two days') === 1, JSON.stringify(T));
  });

  test('the coach\'s mile nudge: no offer after one run, the offer after two, Keep, Update mile time, and the three silences', () => {
    assert.ok(nudgeWalk(P, w, T, 'half manny, the nudge') >= 2, 'the program has two easy cards');
    if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify(T, null, 1));
    for (const k of ['nudge: an offer to go slower', 'nudge: an offer to go faster', 'nudge: against one pace', 'nudge: against two paces', 'nudge: Keep', 'nudge: Update mile time', 'nudge: the pencil opened on the offer',
      'nudge: no offer, the first easy card', 'nudge: no offer, a record in the way', 'nudge: no offer, off the plan in opposite ways', 'nudge: no offer, the pencil locked']) assert.ok(at(k) > 0, k + ': ' + JSON.stringify(T));
  });
});

describe('native rest sheet: with no program', () => {
  test('a door asked with no program in hand says today\'s words and opens nothing', () => {
    const P = new Phone().launch(CREATED);
    P.ev("openRestSheet(1,'mon','cardio')");
    const r = openRest(null, {}, 1, 'mon', 'cardio', new Date(2026, 7, 29, 9));
    assert.deepEqual(P.toasts.slice(-1), ['No active program. Tap Set Active or build a new one.']);
    assert.deepEqual(r, { toast: 'No active program. Tap Set Active or build a new one.' });
  });
});
