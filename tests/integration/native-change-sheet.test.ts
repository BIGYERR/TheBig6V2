// The Expo app's Hurt? and Traveling?, its chips with I'm back and the check in, This Week's two dates and the copy
// button against today's page (MIGRATION.md phase 3, row 5, its third session), on The Half Manny and on a program
// with a start date. After every tap the draft, every byte of the sheet's markup, every byte of the chips, each
// toast, each pop-up whole, whether the sheet closed, the program in hand whole, This Week under it and every ia_
// key are equal to today's page (support/native-change-sheet.ts). Every expected value here is today's page, on
// purpose; the ten programs through the standard history are tests/sweeps/native-change-sheet.test.ts. Kept light:
// the 60-second check runs this file.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { describe, test } from 'vitest';
import { TwoChanges, betterBackWalk, changeTally, datesWalk, hurtWalk, injuryLife, secondInjuryWalk, spansWalk, travelWalk } from '../support/native-change-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const names = Object.keys(PROGRAMS);
const HALF = PROGRAMS[names[0]!]!;

/** A phone with one program made the wizard's way at CREATED, launched on the Wednesday of its first whole week. */
function made(cfg: unknown): Phone {
  const P = new Phone().launch(CREATED);
  P.generate(cfg as never);
  const { first, start } = firstWeek(P, CREATED);
  return P.launch(at(start, 7 * (first - 1) + 2, '07:30'));
}

describe('native change sheet: The Half Manny', () => {
  const T = changeTally();
  const n = (k: string): number => T[k] || 0;
  const P = made(HALF);
  const need = (keys: string[]): void => { for (const k of keys) assert.ok(n(k) > 0, k + ': ' + JSON.stringify(T)); };

  test('Hurt?: every region and both tiers drawn, the one the app does not train around, the refusals, Apply change', () => {
    hurtWalk(P, T, 'half manny, hurt');
    need(['opened: Hurt?', 'Hurt?: no region picked', 'Hurt?: no button', 'Hurt?: other picked', 'Hurt?: effect, above my pay grade', 'Hurt?: Got it', 'Hurt?: effect, Protected', 'Hurt?: effect, Working around it',
      'Hurt?: the From date box', 'toast: Pick a region', 'toast: That date falls outside your program', 'toast: Working around it ✓', 'applied: injury', 'refused: injury', 'Back', 'set: from, blank',
      'This Week: the pill names a region', 'This Week: the pill reads Hurt?', 'chip: Injury', 'chip: I’m back', 'chip line: an injury, tap I’m back', 'chip line: working around it']);
    for (const r of ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle', 'calf']) for (const t of ['workaround', 'protect']) assert.ok(n('Hurt?: effect of ' + r + ', ' + t) > 0, r + ' ' + t);
  });

  test('Traveling?: each gear, each span of the effect, the dates carried and refused, Got it, Apply change', () => {
    travelWalk(P, T, 'half manny, travel');
    need(['opened: Traveling?', 'Traveling?: Mini gym picked', 'Traveling?: Room only picked', 'Traveling?: Full gym picked', 'Traveling?: no date boxes (Full gym)', 'Traveling?: effect, You’re set', 'Traveling?: Got it',
      'Traveling?: effect, one day', 'Traveling?: effect, days in words', 'Traveling?: effect, days in figures', 'Traveling?: effect, onward (no Through)', 'Traveling?: effect, the range falls outside the program',
      'Traveling?: back line, runs to the end of the program', 'Traveling?: back line, a day picks the program back up', 'Traveling?: back line, none', 'Traveling?: holds line, Room only', 'Traveling?: holds line, gear',
      'Traveling?: Through reads Set date', 'Traveling?: From reads Set date', 'Traveling?: Through has an earliest day', 'toast: Pick both dates', 'toast: “Through” can’t be before “From”',
      'toast: That range is outside your program', 'toast: Change applied ✓', 'applied: travel', 'refused: travel', 'chip: Travel', 'chip line: Mini gym', 'chip line: back to normal on a day']);
  });

  test('an injury\'s life: the check in at fourteen days and its three answers, I\'m back, the return week, each chip removed', () => {
    assert.equal(injuryLife(P, T, 'half manny, a knee worked around', 'knee', 'workaround', 43), 2, 'a knee took running away: two weeks back');
    assert.equal(injuryLife(P, T, 'half manny, an elbow protected', 'elbow', 'protect', 3), 1, 'an elbow never touched running: one week back');
    betterBackWalk(P, T, 'half manny, better and back', 'ankle');
    need(['chip: the check in', 'chip: the check in names its region', 'check in: same', 'check in: worse', 'check in: better', 'Good sign: More time', 'Good sign: I’m back', 'pop-up: Check in, Good sign.', 'pop-up: two answers',
      'pop-up: Check in, Two weeks and trending worse.', 'pop-up: Back in, Good. One week to prove it.', 'pop-up: Back in, Good. Two weeks to full send.', 'toast: Staying on the plan. It will ask again in two weeks.',
      'toast: Change removed ✓', 'chip: Return week', 'chip line: a return week', 'chip line: back to normal on a day', 'chip line: protected', 'removed', 'I’m back', 'chips: none']);
  });

  test('carried as today\'s: a second injury is stored beside the first, and changes of one instant leave together', () => {
    secondInjuryWalk(P, T, 'half manny, a second injury');
    need(['changes of one instant removed together']);
  });

  test('a trip of every span: a whole week, two whole weeks, one day, days in a month, days across two', () => {
    spansWalk(P, T, 'half manny, spans');
    need(['chip span: Week N', 'chip span: Weeks N–M', 'chip span: one day', 'chip span: days in one month', 'chip span: days across two months', 'chip span: From a day', 'chip line: Room only']);
  });

  test('the race date: set again, a week on, a week back, three days on, and a blank box', () => {
    assert.equal(datesWalk(P, T, 'half manny, the race date'), 'race');
    need(['race date set', 'race date: a blank box does nothing', 'This Week: the row is the race date', 'toast: Race day <day> — plan starts <day> ✓']);
  });

  test('the copy button: the text handed to the clipboard and the toast once it answers', async () => {
    const two = new TwoChanges(P, T, 'half manny, copy');
    const text = await two.copy();
    assert.match(text, /^THE ASYLUM — Program selections\nName: /);
    need(['copied', 'copied: a line of Seed:', 'copied: a line of Run anchor:']);
    if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify(T, null, 1));
  });
});

describe('native change sheet: two programs stored, the active one second', () => {
  test('a change, I\'m back and a date land on the active program, and the first program stays as it was', () => {
    const T = changeTally();
    const P = made(HALF);
    const first: string = P.ev('activeProgId');
    P.generate(Object.values(PROGRAMS)[5] as never);
    P.settle();
    const ids: string[] = JSON.parse(P.ev('JSON.stringify(getPrograms().map(function(p){return p.id;}))'));
    assert.ok(ids.length === 2 && ids[0] === first && P.ev('activeProgId') === ids[1], 'the active program is the second of two');
    const before: string = P.ev('JSON.stringify(getPrograms()[0])');
    const two = hurtWalk(P, T, 'two programs, hurt');
    assert.equal(two.P.ev('JSON.stringify(getPrograms()[0])'), before, 'the first program is as it was');
    assert.equal(JSON.parse(two.store.get('ia_programs')!)[1].overlays.length, 1, 'the active program holds the injury');
    assert.equal(injuryLife(P, T, 'two programs, a knee', 'knee', 'workaround', 3), 2);
    datesWalk(P, T, 'two programs, the row\'s date');
    assert.ok((T['wrote ia_programs alone'] || 0) > 10, JSON.stringify(T));
  });
});

describe('native change sheet: a program with a start date', () => {
  const T = changeTally();
  const n = (k: string): number => T[k] || 0;
  const cfg = Object.values(PROGRAMS).find((c) => { const P = made(c); return !P.ev('progAlignment(activeProg)'); });

  test('Program Start: set again, moved, each day of the week holding today, and a blank box', () => {
    assert.ok(cfg, 'one of the ten programs has a start date');
    assert.equal(datesWalk(made(cfg), T, 'a start date'), 'start');
    for (const k of ['start date set', 'start date: a blank box does nothing', 'This Week: the row is Program Start', 'toast: Start date set ✓', 'toast: Start date set. Short first week ✓']) assert.ok(n(k) > 0, k + ': ' + JSON.stringify(T));
  });
});
