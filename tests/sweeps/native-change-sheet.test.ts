// The Expo app's Hurt? and Traveling?, its chips with I'm back and the check in, This Week's two dates and the copy
// button against today's page (MIGRATION.md phase 3, row 5, its third session), on each of the ten seeded programs
// at each stretch of the standard history: the launch's chips and This Week, the copy button, and the changes the
// phone already holds (Hurt? on the live injury, I'm back and the ✕ on each chip); before anything is trained and
// again in the first and third weeks, Hurt? on every region and tier with its refusals, Traveling? on every gear
// and span with its refusals, and the row's date moved; before anything is trained, two whole injuries (the check in
// at fourteen days and its three answers, I'm back, the return week, each chip removed), Better answered I'm back, a
// second injury beside the first, a trip of every span, and the changes no tap stores. Then a dated test goal, whose
// start date pins its test week again. After every tap the draft, every byte of the sheet and of the chips, each
// toast, each pop-up whole, the program in hand whole, This Week under it and every ia_ key is equal to today's
// page, value for value (support/native-change-sheet.ts). Every expected value here is today's page, on purpose.
//
// Each kind of thing the screens can draw, say or write has a floor in the last test, read off the builders
// (change-sheet-model.ts travelView and injuryView, overlay-readers.ts overlayChips, overlay-writes.ts,
// week-dates.ts, list-readers.ts progSelLines), not off what a walk happened to draw.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { TwoChanges, betterBackWalk, changeTally, datesWalk, hurtWalk, injuryLife, noStartWalk, phoneAfter, secondInjuryWalk, spansWalk, storedWalk, strangeWalk, travelWalk } from '../support/native-change-sheet.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek, life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
// A swim program's baseline as a walker can log it (support/native-deck.ts walkable).
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const names = Object.keys(PROGRAMS);
const REGIONS = ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle', 'calf'];
const GEARS = ['home_basic', 'bodyweight'];
// S: the launches, the copy button and the stored changes. H: Hurt?. V: Traveling?. L: an injury's life. D: the dates. X: the changes no tap stores.
const S = changeTally(), H = changeTally(), V = changeTally(), L = changeTally(), D = changeTally(), X = changeTally();
const seen = { stages: 0, stored: 0, race: 0, start: 0, oneWeekBack: 0, twoWeeksBack: 0, strange: 0, noStart: 0 };

names.forEach((name, i) => {
  const cfg = walkable(PROGRAMS[name]!);
  test(name + ': Hurt?, Traveling?, the chips, the dates and the copy button through the standard history, the screens and the stores equal', async () => {
    const stages: [string, Phone][] = [];
    life(cfg, CREATED, undefined, (stage, P) => { stages.push([stage, phoneAfter(P, 0)]); });
    assert.equal(stages.length, 5);
    for (const [stage, P] of stages) {
      const what = name + ', ' + stage;
      seen.stages++;
      await new TwoChanges(phoneAfter(P, 0), S, what + ', copy').copy();
      seen.stored += storedWalk(P, S, what + ', the stored changes');
      if (stage === '0 generated' || stage === '1 first week' || stage === '3 third week') {
        const k = i + stage.charCodeAt(0);
        hurtWalk(P, H, what + ', hurt', REGIONS[k % 7]!, k % 2 ? 'protect' : 'workaround');
        travelWalk(P, V, what + ', travel', GEARS[k % 2]!, 1 + (k % 3), 2 + (k % 4) * 6);
        if (datesWalk(P, D, what + ', the row\'s date') === 'race') seen.race++; else seen.start++;
      }
      if (stage === '0 generated') {
        // Two whole injuries a program, so the ten cover every region on both tiers: a long one with the check in
        // asked three times, and a short one. A pace goal takes one that stops its running, long and short, so the
        // pace clock speaks of one week and of more.
        const pace = /1\.5 mile test goal/.test(name);
        const a = pace ? 'knee' : REGIONS[i % 7]!, b = pace ? 'ankle' : REGIONS[(i + 3) % 7]!;
        for (const [region, tier, days] of [[a, i % 2 ? 'protect' : 'workaround', 43], [b, i % 2 ? 'workaround' : 'protect', 3]] as [string, 'workaround' | 'protect', number][]) {
          if (injuryLife(P, L, what + ', ' + region + ' ' + tier, region, tier, days) === 2) seen.twoWeeksBack++; else seen.oneWeekBack++;
        }
        betterBackWalk(P, L, what + ', better and back', REGIONS[(i + 5) % 7]!);
        secondInjuryWalk(P, L, what + ', a second injury');
        spansWalk(P, V, what + ', spans');
        seen.strange += strangeWalk(P, X, what + ', the changes no tap stores');
        if (noStartWalk(P, D, what + ', no start date')) seen.noStart++;
      }
    }
  });
});

test('a dated test goal: its start date pins the test week again and rebuilds, a short week can hold the test, and race day does not move', () => {
  const dated = { ...(PROGRAMS['1.5 mile test goal, commercial, balanced'] as object), primaryPath: 'event', eventTargeted: true, raceDate: '2026-10-25' };
  const P = new Phone().launch(CREATED);
  P.generate(dated as never);
  const { first, start } = firstWeek(P, CREATED);
  const Q = P.launch(at(start, 7 * (first - 1) + 2, '07:30'));
  assert.equal(datesWalk(Q, D, 'a dated test goal, the start date'), 'start');
  // The test's own Sunday, and the Saturday before it with Sunday the one rest day: the week holds the test.
  const two = new TwoChanges(phoneAfter(Q, 0), D, 'a dated test goal, the test\'s week');
  assert.equal(two.date('start', '2026-10-25'), 'That week holds your test. Nothing left to train before it ✓');
  two.week();
  two.date('start', '2026-10-19'); two.week();
  two.date('start', '2026-11-01');
  assert.equal(injuryLife(Q, L, 'a dated test goal, a knee', 'knee', 'workaround', 3), 2);
  assert.equal(injuryLife(Q, L, 'a dated test goal, a calf', 'calf', 'protect', 43), 2);
});

test('a pace goal with an event and no date: the pace clock speaks of the weeks, since no race day holds', () => {
  const undated = { ...(PROGRAMS['1.5 mile test goal, commercial, balanced'] as object), primaryPath: 'event', eventTargeted: true };
  const P = new Phone().launch(CREATED);
  P.generate(undated as never);
  const before = (L['pop-up: the pace clock, one more week'] || 0), fixed = (L['pop-up: the pace clock, race day does not move'] || 0);
  assert.equal(injuryLife(P, L, 'an undated event, a knee', 'knee', 'workaround', 3), 2);
  assert.ok((L['pop-up: the pace clock, one more week'] || 0) > before && (L['pop-up: the pace clock, race day does not move'] || 0) === fixed, 'the weeks, never race day');
});

test('a lifter with no cardio and no lifts entered: the copied text names the lifts as estimates and the cardio as lift only', async () => {
  const lifter = { ...(PROGRAMS['bike ftp, home full, strength support, advanced'] as object), primaryPath: 'body', cardioTypes: [], cardioGoals: {}, bench: 0, squat: 0, deadlift: 0 };
  const P = new Phone().launch(CREATED);
  P.generate(lifter as never);
  const text = await new TwoChanges(phoneAfter(P, 0), S, 'a lifter, copy').copy();
  assert.match(text, /\nStarting 1RM \(est\. from experience\): squat 275 \/ bench 225 \/ deadlift 315 lbs\nCardio: lift only\nSeed: 76308$/, 'an advanced lifter\'s defaults');
  hurtWalk(P, H, 'a lifter, hurt', 'lowback', 'protect');
  travelWalk(P, V, 'a lifter, travel', 'bodyweight', 2, 3);
});

test('what the ten programs showed: every kind the screens draw, every toast, every pop-up, every write', () => {
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ S, H, V, L, D, X, seen }, null, 1));
  // Every floor is read before any is asserted, so one run names every kind that fell short.
  const short: string[] = [];
  const floor = (T: Record<string, number>, k: string, n: number): void => { if ((T[k] || 0) < n) short.push(k + ' drawn ' + (T[k] || 0) + ' times, floor ' + n); };
  const all = (T: Record<string, number>, keys: string[], n: number): void => { for (const k of keys) floor(T, k, n); };
  assert.equal(seen.stages, 50, 'ten programs at five stretches');

  // ── Hurt? (injuryView): 30 walks. The sheet with no region and no button; each of the eight cards picked; both
  // tiers; each region's words on each tier; the one the app does not train around; the From box, blank and set.
  all(H, ['opened: Hurt?', 'Hurt?: no region picked', 'Hurt?: no button', 'Hurt?: other picked', 'Hurt?: effect, above my pay grade', 'Hurt?: Got it', 'Got it', 'Back', 'Hurt?: From reads Set date', 'applied: injury', 'refused: injury'], 30);
  for (const r of REGIONS) { floor(H, 'Hurt?: ' + r + ' picked', 90); for (const t of ['workaround', 'protect']) floor(H, 'Hurt?: effect of ' + r + ', ' + t, 25); }
  all(H, ['Hurt?: workaround tier picked', 'Hurt?: effect, Working around it', 'Hurt?: the From date box', 'Hurt?: Apply change'], 400);
  all(H, ['Hurt?: protect tier picked', 'Hurt?: effect, Protected'], 200);
  all(H, ['applied: a blank From is today'], 30);
  all(H, ['Hurt? opened on a live injury'], 10);
  floor(H, 'Hurt?: a region card', 8 * 700); floor(H, 'Hurt?: a tier card', 2 * 600);
  all(H, ['toast: Pick a region'], 50);
  all(H, ['toast: That date falls outside your program'], 30);
  all(H, ['toast: Working around it ✓', 'toast: Protected. Train around it ✓'], 10);
  all(H, ['This Week: the pill reads Hurt?', 'This Week: the pill names a region', 'chip: Injury', 'chip: I’m back', 'chip span: From a day', 'chip line: an injury, tap I’m back', 'chip line: working around it', 'chip line: protected'], 10);

  // ── Traveling? (travelView): 30 walks and 50 trips of the spans' walk. The two date boxes, each blank; Through's
  // earliest day; each gear; each effect; each back line; both holds lines; both buttons; each refusal.
  all(V, ['opened: Traveling?', 'Traveling?: no date boxes (Full gym)', 'Traveling?: Full gym picked', 'Traveling?: effect, You’re set', 'Traveling?: Got it', 'Traveling?: effect, one day', 'Traveling?: effect, onward (no Through)',
    'Traveling?: back line, none', 'Traveling?: From reads Set date', 'Traveling?: Through reads Set date', 'toast: “Through” can’t be before “From”', 'toast: That range is outside your program', 'applied: travel'], 30);
  all(V, ['Traveling?: Mini gym picked', 'Traveling?: Room only picked', 'Traveling?: effect, days in words', 'Traveling?: effect, days in figures', 'Traveling?: effect, the range falls outside the program',
    'Traveling?: back line, a day picks the program back up', 'Traveling?: back line, runs to the end of the program', 'Traveling?: holds line, Room only', 'Traveling?: holds line, gear', 'Traveling?: Apply change',
    'Traveling?: Through has an earliest day', 'toast: Pick both dates', 'toast: Change applied ✓', 'refused: travel'], 60);
  floor(V, 'Traveling?: a date box', 2 * 600); floor(V, 'Traveling?: a gear card', 3 * 700);
  all(V, ['chip: Travel', 'chip line: Mini gym', 'chip line: Room only', 'chip line: back to normal on a day', 'chip span: one day', 'chip span: days in one month', 'chip span: days across two months', 'chip span: Week N'], 10);
  // Two whole weeks ahead run past the end of one of the ten programs at this stretch, where the sheet refuses the trip.
  floor(V, 'chip span: Weeks N–M', 8);

  // ── An injury's life (overlayChips, overlay-writes.ts): 22 lives, 10 Betters answered I'm back, 10 second injuries.
  // The chip, the check in and each answer, each pop-up, the return week and the week after it, each ✕.
  all(L, ['chip: the check in', 'chip: the check in names its region', 'check in: same', 'check in: worse', 'check in: better', 'Good sign: More time', 'Good sign: I’m back', 'pop-up: Check in, Good sign.', 'pop-up: two answers',
    'pop-up: Check in, Two weeks and trending worse.', 'toast: Staying on the plan. It will ask again in two weeks.', 'changes of one instant removed together'], 10);
  all(L, ['I’m back', 'removed', 'toast: Change removed ✓', 'chip: Return week', 'chip line: a return week', 'chip line: back to normal on a day', 'chips: none'], 30);
  // A shoulder and an elbow never stop the running, so they come back in one week; every other region in two.
  floor(L, 'pop-up: Back in, Good. One week to prove it.', 5); floor(L, 'pop-up: Back in, Good. Two weeks to full send.', 40);
  // The pace clock speaks for a pace goal alone. It counts the weeks still stored: after I'm back that is the return
  // week, so an injury of any length reads one more week (today's, carried), and a second I'm back, on the week
  // after, reads two.
  all(L, ['pop-up: the pace clock, one more week', 'pop-up: the pace clock, more weeks', 'pop-up: the pace clock, race day does not move'], 2);
  floor(L, 'I’m back on the week after a return week', 12);
  assert.ok(seen.oneWeekBack >= 3 && seen.twoWeeksBack >= 12, 'both ways back: ' + JSON.stringify(seen));
  floor(L, 'wrote ia_programs alone', 200);

  // ── The launches and the stored changes: the chips each stretch draws, Hurt? on the live injury, the copy button.
  assert.ok(seen.stored >= 50, 'chips the standard history left: ' + seen.stored);
  all(S, ['copied'], 51);
  all(S, ['copied: 1RM from experience', 'copied: lift only'], 1);
  all(S, ['copied: a line of Seed:', 'copied: 1RM as entered'], 50);
  all(S, ['copied: a line of Run anchor:', 'copied: a line of Event:'], 15);
  all(S, ['chip: Travel', 'chip: Injury', 'chip: Return week', 'chip: I’m back', 'chip line: Minimal / Travel', 'chips: none', 'I’m back', 'removed', 'Hurt?: knee picked', 'Hurt?: no region picked', 'This Week: an injury week'], 10);

  // ── The row's date (week-dates.ts): 30 walks on the ten and the dated test goal's.
  assert.ok(seen.race === 12 && seen.start === 18, 'four of the ten are laid back from a race: ' + JSON.stringify(seen));
  all(D, ['race date set', 'race date: a blank box does nothing', 'toast: Race day <day> — plan starts <day> ✓', 'This Week: the row is the race date'], 12);
  all(D, ['start date set', 'start date: a blank box does nothing', 'toast: Start date set ✓', 'toast: Start date set. Short first week ✓', 'This Week: the row is Program Start'], 18);
  all(D, ['toast: Nothing to train that week. Starts <day> ✓'], 10);
  all(D, ['toast: That week holds your test. Nothing left to train before it ✓'], 1);
  all(D, ['start date set to the day it held: the same bytes'], 3);
  // A stored program with no start date (no tap leaves one): the row reads Set date until a date is picked.
  assert.ok(seen.noStart >= 6, 'programs whose row read Set date: ' + seen.noStart);
  floor(D, 'This Week: the row reads Set date', 6);

  // ── The changes no tap stores (overlayChips' other kinds), on each of the ten: held equal at a launch and through the taps the page offers on them.
  assert.ok(seen.strange >= 80, 'chips drawn from them: ' + seen.strange);
  all(X, ['chip: Less time', 'chip: Suspended', 'chip: Change', 'chip line: Modified', 'chip line: open-ended', 'chip line: CrossFit Box', 'chip line: Home Full', 'chip line: Minimal / Travel', 'chip line: Full gym',
    'chip: the check in names no region', 'check in: worse', 'I’m back', 'removed', 'pop-up: Back in, Good. One week to prove it.', 'chip line: a gear with no name, as stored'], 10);
  assert.deepEqual(short, [], 'kinds drawn fewer times than their floor');
});
