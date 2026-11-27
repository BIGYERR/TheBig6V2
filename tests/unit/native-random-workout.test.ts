// Random Workout in the Expo app (MIGRATION.md phase 3, row 7): the pure logic of frontends/native/src/random-workout
// and the Wildcard source of the deck's writes. Every expected value here is typed by hand: from the rulings (V195
// D64 and D71: a Wildcard is a substitute, never a completion, and rescues a skipped day's streak; v0.246.0 D250: an
// edit on a Wildcard's card lives on its own working day and is never stored; docs/decisions/wildcard.md), from the
// page's own words as they stand in random-wildcard.ts and the Angular screen, from the measure
// (tests/measure/native-row7_today.md) and from the calendar (2 November 2026 is a Monday). None is asked of the app:
// the comparison with today's page is tests/integration/native-random-workout.test.ts.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import type { ExCard, ExSection, SectionView } from '../../frontends/native/src/day-detail/session-sections-model.ts';
import { sheetView } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import { type DeckProgram, newDayInHand, openedDay } from '../../frontends/native/src/deck/deck-screen.ts';
import { swapSheetOf, swapSheetOn } from '../../frontends/native/src/deck/deck-swaps.ts';
import { type Session, type WildDay, act, swapMove, tapLog, undoSwap } from '../../frontends/native/src/deck/deck-writes.ts';
import { RAND_POOLS } from '../../frontends/native/src/random-workout/random-pools.ts';
import {
  RAND_WORDS, RESET_ASK_MS, type RandProgram, type WildDraw, drawRandom, goalOf, inUnit, newRandState, openRandom, randCounter, wildFields, wildMoves, wildOrigin,
  wildSections, wildSession,
} from '../../frontends/native/src/random-workout/random-screen.ts';
import { WILD_POP_MS, completeWildcard, fireWildcardPopup, resetWildcards, wildcardDayFor } from '../../frontends/native/src/random-workout/random-writes.ts';

const filled = (keys: Record<string, unknown>): StateStore => { const s = memoryStore(); for (const [k, v] of Object.entries(keys)) s.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return s; };
const held = (s: StateStore): Record<string, unknown> => Object.fromEntries(s.keys().sort().map((k) => { const v = s.get(k)!; try { return [k, JSON.parse(v)]; } catch { return [k, v]; } }));
const at = (y: number, m: number, d: number, h = 18, min = 0): Date => new Date(y, m - 1, d, h, min, 0);
/** A draw that hands back each number in turn. */
const draws = (...xs: number[]): (() => number) => { let i = 0; return () => { const x = xs[i++]; assert.notEqual(x, undefined, 'the code drew more often than this test expects'); return x!; }; };

// Two weeks from Monday 2 November 2026. Each week: Monday and Saturday a lift, Wednesday a run alone; Tuesday,
// Friday and Sunday rest; Thursday a mobility day.
const lift = (title: string) => ({ title, sections: [{ label: 'Main lift', items: [{ name: 'Back squat', detail: '3×5 @ RPE 8' }] }] });
const week = () => ({
  mon: lift('Lower'), tue: { rest: true }, wed: { title: 'Easy Run', cardio: { type: 'run' }, sections: [] },
  thu: { title: "Coach's Pick", sections: [{ label: 'Post-run mobility', items: [{ name: 'Couch stretch', detail: '2×60 sec' }] }] },
  fri: { rest: true }, sat: lift('Upper'), sun: { rest: true },
});
const PID = 'prog_1';
const prog = (more: Record<string, unknown> = {}): RandProgram => ({ id: PID, goal: 'strength', startDate: '2026-11-02', totalWeeks: 2, weeks: { 1: week(), 2: week() }, ...more }) as unknown as RandProgram;
/** A Wildcard's working day made by hand: one lift alone, then a round of two. */
const wildDay = (): WildDraw => ({
  w: { title: 'Made up' },
  sections: [
    { label: 'Main', items: [{ name: 'Back squat', detail: '3×5 @ RPE 8' }] },
    { label: 'Round', superset: true, items: [{ name: 'Chinups', detail: '3×8' }, { name: 'Dips', detail: '3×8' }] },
  ] as ExSection[],
  swaps: [],
});
const cards = (v: SectionView[]): ExCard[] => wildMoves(v);
/** A value as plain data, so a comparison does not narrow the type of what it compared. */
const plainOf = (x: unknown): unknown => JSON.parse(JSON.stringify(x));
const NATIVE = join(REPO, 'frontends', 'native', 'src');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const read = (f: string): string => strip(readFileSync(join(NATIVE, f), 'utf8'));

describe('native Random Workout: the model and the pools are today\'s files', () => {
  test('random-workout-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/random-workout/random-workout-model.ts')), copy = readFileSync(join(NATIVE, 'random-workout/random-workout-model.ts'));
    assert.ok(today.length > 500, 'today\'s file holds something');
    assert.ok(today.equals(copy), 'the copy differs from today\'s random-workout-model.ts: copy it again');
  });

  test('every line of the page\'s table stands in random-pools.ts as the page holds it', () => {
    const table = (file: string, first: string): string[] => {
      const lines = readFileSync(join(REPO, file), 'utf8').split('\n');
      const a = lines.findIndex((l) => l.startsWith(first)), b = lines.findIndex((l, i) => i > a && l === '};');
      assert.ok(a >= 0 && b > a, file + ': the table was not found');
      return lines.slice(a + 1, b);
    };
    const page = table('frontends/app/src/legacy/src/js/random-wildcard.ts', 'const RAND_POOLS'), copy = table('frontends/native/src/random-workout/random-pools.ts', 'export const RAND_POOLS');
    assert.equal(page.length, 159);
    assert.deepStrictEqual(copy, page, 'a workout changed on the page is copied into random-pools.ts again');
  });

  test('the table: five pools, 149 workouts, its first four as the page lists them', () => {
    assert.deepStrictEqual(Object.keys(RAND_POOLS), ['strength', 'hypertrophy', 'fatloss', 'athletic', 'balanced']);
    assert.deepStrictEqual(Object.values(RAND_POOLS).map((p) => p.length), [30, 30, 29, 30, 30]);
    assert.deepStrictEqual(RAND_POOLS['strength']!.slice(0, 4).map((w) => w.title), ['Max Effort Bench', 'Max Effort Squat', 'Deadlift PR Day', 'Heavy 5x5']);
  });

  test('the folder holds the screen, the pools, the model\'s copy, the view and the writes', () => {
    assert.deepStrictEqual(readdirSync(join(NATIVE, 'random-workout')).sort(), ['RandomWorkout.tsx', 'random-pools.ts', 'random-screen.ts', 'random-workout-model.ts', 'random-writes.ts']);
  });
});

describe('native Random Workout: the draw', () => {
  test('My Goal draws from the goal\'s pool, again while it lands on the last draw, and keeps the index', () => {
    const st = newRandState();
    assert.deepStrictEqual(st, { filter: 'mine', lastIdx: -1 });
    st.lastIdx = 15;
    // 0.5 of 30 is 15, the last draw, twice; 0.1 of 30 is 3.
    const o = drawRandom(st, memoryStore(), prog(), draws(0.5, 0.5, 0.1));
    assert.equal(o.head.title, 'Heavy 5x5');
    assert.equal(st.lastIdx, 3);
    assert.equal(o.wild.w, RAND_POOLS['strength']![3]);
    assert.deepStrictEqual(o.wild.swaps, []);
  });

  test('the working day is a copy: an edit on it never reaches the pool', () => {
    const o = drawRandom(newRandState(), memoryStore(), prog(), draws(0.1));
    const was = JSON.stringify(RAND_POOLS['strength']![3]);
    assert.notEqual(o.wild.sections, RAND_POOLS['strength']![3]!.sections);
    o.wild.sections[0]!.items![0]!.name = 'Changed';
    assert.equal(JSON.stringify(RAND_POOLS['strength']![3]), was);
  });

  test('See All draws from every pool laid end to end; a goal with no pool of its own draws from balanced', () => {
    const st = newRandState();
    st.filter = 'all';
    // 148 of 149 is the last workout of the last pool; 30 is the first of the second.
    assert.equal(drawRandom(st, memoryStore(), prog(), draws(148.5 / 149)).wild.w, RAND_POOLS['balanced']![29]);
    assert.equal(drawRandom(st, memoryStore(), prog(), draws(30.5 / 149)).wild.w, RAND_POOLS['hypertrophy']![0]);
    assert.equal(drawRandom(newRandState(), memoryStore(), prog({ goal: 'endurance' }), draws(0)).wild.w, RAND_POOLS['balanced']![0]);
    assert.equal(goalOf(prog({ goal: undefined })), 'balanced');
    assert.equal(goalOf(null), 'balanced');
  });

  test('the head: the badge in the goal\'s colour, Done Before once the title is in the record', () => {
    const fresh = drawRandom(newRandState(), memoryStore(), prog(), draws(0.1)).head;
    assert.deepStrictEqual(fresh, { title: 'Heavy 5x5', done: false, badgeStyle: 'background:rgba(var(--lift-rgb),0.133);color:var(--lift)', cardio: null, note: null });
    const done = drawRandom(newRandState(), filled({ ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: 1, week: null, dayKey: null }] }), prog({ goal: 'hypertrophy' }), draws(0.1)).head;
    assert.equal(done.done, false, 'the hypertrophy pool\'s fourth workout is another title');
    const st = newRandState();
    st.filter = 'all';
    const seen = drawRandom(st, filled({ ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: 1, week: null, dayKey: null }] }), prog({ goal: 'hypertrophy' }), draws(3.5 / 149)).head;
    assert.deepStrictEqual([seen.title, seen.done, seen.badgeStyle], ['Heavy 5x5', true, 'background:rgba(var(--hip-rgb),0.133);color:var(--hip)']);
  });

  test('the counter: the goal\'s own Wildcards done, out of how many its pool holds', () => {
    assert.equal(randCounter(memoryStore(), prog()), '0/30');
    assert.equal(randCounter(memoryStore(), prog({ goal: 'fatloss' })), '0/29');
    const s = filled({ ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: 1 }, { title: 'Max Effort Bench', ts: 2 }, { title: 'A title no pool holds', ts: 3 }] });
    assert.equal(randCounter(s, prog()), '2/30');
    // The same record counts nothing toward another goal's pool.
    assert.equal(randCounter(s, prog({ goal: 'endurance' })), '0/30');
    assert.equal(randCounter(s, null), '0/30');
  });

  test('a draw reads the store and writes nothing', () => {
    const s = filled({ ['ia_wild_' + PID]: [] });
    const before = JSON.stringify(held(s));
    const o = openRandom(newRandState(), s, prog(), newDayInHand(), 1, draws(0.1), at(2026, 11, 3).getTime());
    assert.equal(o.sections.length, 1);
    assert.equal(JSON.stringify(held(s)), before);
  });
});

describe('native Random Workout: the cards are read off the working day, under the day last opened', () => {
  const now = at(2026, 11, 3).getTime();

  test('each section is the working day\'s, never the program\'s day in hand', () => {
    const hand = newDayInHand();
    hand.dayKey = 'thu';
    const v = wildSections(memoryStore(), prog(), hand, 1, wildDay(), now);
    assert.deepStrictEqual(cards(v).map((x) => x.name), ['Back squat', 'Chinups', 'Dips']);
    assert.deepStrictEqual(v.map((s) => (s.kind === 'section' ? s.body.kind : s.kind)), ['block', 'round']);
    assert.deepStrictEqual(Object.keys(wildFields(v)).sort(), ['back_squat', 'chinups', 'dips']);
  });

  test('the swap chip names the lift the newest of the working day\'s own swaps took the name from', () => {
    const wild = wildDay();
    assert.equal(wildOrigin(wild, 'Back squat'), null);
    wild.swaps.push({ from: 'Front squat', to: 'Back squat', rx: [] }, { from: 'Goblet squat', to: 'Back squat', rx: [] });
    assert.equal(wildOrigin(wild, 'Back squat'), 'Goblet squat');
    assert.equal(cards(wildSections(memoryStore(), prog(), newDayInHand(), 1, wild, now))[0]!.swappedFrom, 'Goblet squat');
    // A record the program's day holds is not a Wildcard's.
    const s = filled({ ['ia_swaps_' + PID]: { w1_mon: [{ from: 'Deadlift', to: 'Back squat', rx: [], ts: 1 }] } });
    const hand = newDayInHand();
    hand.dayKey = 'mon';
    assert.equal(cards(wildSections(s, prog(), hand, 1, wildDay(), now))[0]!.swappedFrom, null);
  });

  test('the unit is the last opened day\'s, pounds until one opens, whatever the program\'s is', () => {
    const kg = prog({ cfg: { unit: 'kg' } });
    const hand = newDayInHand();
    assert.equal(cards(wildSections(memoryStore(), kg, hand, 1, wildDay(), now))[0]!.log!.load!.unit, 'lbs');
    hand.unit = 'kg';
    assert.equal(cards(wildSections(memoryStore(), prog(), hand, 1, wildDay(), now))[0]!.log!.load!.unit, 'kg');
    assert.deepStrictEqual(inUnit(kg, newDayInHand()).cfg, { unit: 'lbs' });
    assert.equal(kg.cfg!.unit, 'kg', 'the program in hand is left as it was');
  });

  test('a card reads as logged where the lift log holds its move on the week in hand and the day last opened', () => {
    const s = filled({ ['ia_exw_' + PID]: { back_squat: { name: 'Back squat', entries: [{ weight: 225, setsReps: '3×5', setsDone: [5, 5, 5], setsW: [], week: 1, day: 'mon', ts: at(2026, 11, 2).getTime() }] } } });
    const hand = newDayInHand();
    assert.equal(cards(wildSections(s, prog(), hand, 1, wildDay(), now))[0]!.logged, false, 'no day opened');
    hand.dayKey = 'mon';
    assert.equal(cards(wildSections(s, prog(), hand, 1, wildDay(), now))[0]!.logged, true);
    assert.equal(cards(wildSections(s, prog(), hand, 2, wildDay(), now))[0]!.logged, false, 'another week in hand');
    hand.dayKey = 'sat';
    assert.equal(cards(wildSections(s, prog(), hand, 1, wildDay(), now))[0]!.logged, false, 'another day last opened');
  });

  test('the stale warning is the app\'s one: a draw here never starts it afresh', () => {
    const old = at(2026, 9, 1).getTime();
    const s = filled({ ['ia_exw_' + PID]: { back_squat: { name: 'Back squat', entries: [{ weight: 225, setsReps: '3×5', setsDone: [5, 5, 5], setsW: [], week: 1, day: 'mon', ts: old }] } } });
    const hand = newDayInHand();
    const first = cards(wildSections(s, prog(), hand, 2, wildDay(), now))[0]!.log!.load!;
    assert.ok(first.warn && /^That 225 lbs is /.test(first.warn) && / Still where you are\?$/.test(first.warn), String(first.warn));
    assert.equal(hand.warn.shown, true);
    assert.equal(cards(wildSections(s, prog(), hand, 2, wildDay(), now))[0]!.log!.load!.warn, null, 'the next draw of the cards does not speak it again');
  });
});

describe('native Random Workout: Complete, its pop-up and the reset', () => {
  test('the day a Wildcard lands on is read from the date, and is none off the program\'s calendar', () => {
    assert.deepStrictEqual(wildcardDayFor(prog(), at(2026, 11, 11)), { week: 2, dayKey: 'wed' });
    assert.deepStrictEqual(wildcardDayFor(prog(), at(2026, 11, 2, 0, 5)), { week: 1, dayKey: 'mon' });
    assert.deepStrictEqual(wildcardDayFor(prog(), at(2026, 11, 15, 23, 55)), { week: 2, dayKey: 'sun' });
    assert.equal(wildcardDayFor(prog(), at(2026, 11, 1)), null, 'the day before the first Monday');
    assert.equal(wildcardDayFor(prog(), at(2026, 11, 16)), null, 'the Monday after the last week');
    assert.equal(wildcardDayFor(prog({ startDate: null }), at(2026, 11, 3)), null);
    assert.equal(wildcardDayFor(null, at(2026, 11, 3)), null);
    // A program that starts on a Wednesday: its Monday and Tuesday are before the start.
    assert.equal(wildcardDayFor(prog({ startDate: '2026-11-04' }), at(2026, 11, 3)), null);
    assert.deepStrictEqual(wildcardDayFor(prog({ startDate: '2026-11-04' }), at(2026, 11, 4)), { week: 1, dayKey: 'wed' });
  });

  test('the program\'s length is the one it states, else the weeks it holds; a day its grid does not hold is no day', () => {
    assert.equal(wildcardDayFor(prog({ totalWeeks: 1 }), at(2026, 11, 11)), null, 'a second week held past a stated length of one');
    assert.deepStrictEqual(wildcardDayFor(prog({ totalWeeks: undefined }), at(2026, 11, 11)), { week: 2, dayKey: 'wed' });
    assert.equal(wildcardDayFor(prog({ totalWeeks: undefined }), at(2026, 11, 18)), null);
    assert.equal(wildcardDayFor(prog({ totalWeeks: 3 }), at(2026, 11, 18)), null, 'a third week stated and not held');
    assert.equal(wildcardDayFor(prog({ weeks: { 1: week(), 2: { ...week(), wed: undefined } } }), at(2026, 11, 11)), null);
    assert.deepStrictEqual(wildcardDayFor(prog({ weeks: { 1: week(), 2: { ...week(), wed: undefined } } }), at(2026, 11, 12)), { week: 2, dayKey: 'thu' });
  });

  test('the day count is rounded: the Monday after the clocks go forward is still seven days on', () => {
    // New York's clocks go forward on Sunday 14 March 2027, so that week is an hour short.
    assert.deepStrictEqual(wildcardDayFor(prog({ startDate: '2027-03-08' }), at(2027, 3, 15, 0, 30)), { week: 2, dayKey: 'mon' });
    assert.deepStrictEqual(wildcardDayFor(prog({ startDate: '2027-03-08' }), at(2027, 3, 14, 12)), { week: 1, dayKey: 'sun' });
  });

  test('Complete stores the title once in the Wildcard\'s record alone, stamped with today\'s day of the program', () => {
    const s = memoryStore(), tue = at(2026, 11, 3);
    assert.deepStrictEqual(completeWildcard(s, prog(), 'Heavy 5x5', tue), { toast: 'Heavy 5x5 logged ✓', isTraining: false });
    assert.deepStrictEqual(held(s), { ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: tue.getTime(), week: 1, dayKey: 'tue' }] });
    // The same title again, another day: the record keeps its one entry and its first stamp.
    assert.deepStrictEqual(completeWildcard(s, prog(), 'Heavy 5x5', at(2026, 11, 7)), { toast: 'Heavy 5x5 logged ✓', isTraining: true });
    assert.deepStrictEqual(held(s), { ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: tue.getTime(), week: 1, dayKey: 'tue' }] });
    // A lift day is a training day; a run alone is one too; a day off the calendar stamps no day.
    assert.equal(completeWildcard(s, prog(), 'Max Effort Bench', at(2026, 11, 9)).isTraining, true);
    assert.equal(completeWildcard(s, prog(), 'Max Effort Squat', at(2026, 11, 11)).isTraining, true);
    const far = at(2027, 3, 1);
    assert.equal(completeWildcard(s, prog(), 'Deadlift PR Day', far).isTraining, false);
    assert.deepStrictEqual((held(s)['ia_wild_' + PID] as unknown[]).slice(1), [
      { title: 'Max Effort Bench', ts: at(2026, 11, 9).getTime(), week: 2, dayKey: 'mon' },
      { title: 'Max Effort Squat', ts: at(2026, 11, 11).getTime(), week: 2, dayKey: 'wed' },
      { title: 'Deadlift PR Day', ts: far.getTime(), week: null, dayKey: null },
    ]);
    assert.deepStrictEqual(s.keys(), ['ia_wild_' + PID], 'a Wildcard never marks a day done (D64)');
  });

  test('the pop-up is the Wildcard\'s own: the streak on a training day, which the Wildcard itself rescues (D71)', () => {
    const s = memoryStore(), mon = at(2026, 11, 2);
    const r = completeWildcard(s, prog(), 'Heavy 5x5', mon);
    assert.deepStrictEqual(fireWildcardPopup(s, prog(), r.isTraining, mon), { tier: 'workout', opts: { kicker: 'Wildcard done', msg: 'You showed up. That is the whole game.', sub: 'Streak: 1.' } });
    assert.equal(fireWildcardPopup(memoryStore(), prog(), true, mon).opts.sub, 'Streak: 0.', 'with no record the unmarked Monday is no streak');
    assert.equal(fireWildcardPopup(s, prog(), false, mon).opts.sub, 'Streak holds.');
    assert.equal(WILD_POP_MS, 380);
  });

  test('the reset empties the record and says so', () => {
    const s = filled({ ['ia_wild_' + PID]: [{ title: 'Heavy 5x5', ts: 1, week: null, dayKey: null }], ia_active: PID });
    assert.equal(resetWildcards(s, prog()), 'Wildcard counter reset ✓');
    assert.deepStrictEqual(held(s), { ia_active: PID, ['ia_wild_' + PID]: [] });
    assert.equal(RESET_ASK_MS, 3000);
  });
});

describe('native Random Workout: an edit on a Wildcard\'s card stores nothing (D250)', () => {
  const session = (s: StateStore, dayKey = ''): Session => ({ store: s, prog: prog() as DeckProgram, week: 1, dayKey });
  const CTX = { secIdx: 0, itemIdx: 0, name: 'Back squat', detail: '3×5 @ RPE 8' };

  test('a swap lives on the working day: no record, no count, no snapshot, no nudge; put it back takes it off again', () => {
    const s = memoryStore(), wild: WildDay = wildDay();
    const r = swapMove(session(s, 'mon'), CTX, 'Barbell box squat', 5, wild);
    assert.deepStrictEqual(r, { toast: 'Barbell box squat in, back squat out. Same job, same numbers.', nudge: false });
    assert.deepStrictEqual(s.keys(), []);
    assert.deepStrictEqual(wild.swaps, [{ from: 'Back squat', to: 'Barbell box squat', rx: [{ s: 0, i: 0, d: '3×5 @ RPE 8' }] }]);
    assert.deepStrictEqual(wild.sections![0]!.items![0], { name: 'Barbell box squat', detail: '3×5 @ RPE 8' });
    assert.equal(undoSwap(session(s, 'mon'), 'Back squat', wild), 'Back squat is back on the card.');
    assert.deepStrictEqual(wild.swaps, []);
    assert.deepStrictEqual(wild.sections![0]!.items![0], { name: 'Back squat', detail: '3×5 @ RPE 8' });
    assert.deepStrictEqual(s.keys(), []);
    assert.equal(undoSwap(session(s, 'mon'), 'Back squat', wild), null, 'nothing left to put back');
  });

  test('the program\'s Monday is untouched by a Wildcard\'s swap of the same lift', () => {
    const s = memoryStore(), g = prog() as DeckProgram, wild: WildDay = wildDay();
    swapMove({ store: s, prog: g, week: 1, dayKey: 'mon' }, CTX, 'Barbell box squat', 5, wild);
    assert.equal(g.weeks[1]!['mon']!.sections![0]!.items![0]!.name, 'Back squat');
  });

  test('no edit on a Wildcard\'s card renews the snapshot of the day last opened', () => {
    // A snapshot that is not the day as it stands now: an edit on the program's own day would write the day over it.
    const kept = { ['ia_hist_' + PID]: { w1_mon: { title: 'As first touched', sections: [] } } };
    const s = filled(kept), wild: WildDay = wildDay();
    assert.ok(swapMove(session(s, 'mon'), CTX, 'Barbell box squat', 5, wild));
    assert.deepStrictEqual(held(s), kept, 'after a swap');
    assert.equal(undoSwap(session(s, 'mon'), 'Back squat', wild), 'Back squat is back on the card.');
    assert.deepStrictEqual(held(s), kept, 'after its put back');
    act(session(s, 'mon'), { kind: 'exercise', name: 'Back squat' }, true, wild);
    act(session(s, 'mon'), { kind: 'round', secIdx: 1 }, true, wild);
    act(session(s, 'mon'), { kind: 'exercise', name: 'Back squat' }, false, wild);
    act(session(s, 'mon'), { kind: 'round', secIdx: 1 }, false, wild);
    assert.deepStrictEqual(held(s), kept, 'after a minus, a round\'s minus and each put back');
    // Guard: the same swap on the program's own Monday does renew it.
    swapMove({ store: s, prog: prog() as DeckProgram, week: 1, dayKey: 'mon' }, CTX, 'Barbell box squat', 5);
    assert.equal((held(s)['ia_hist_' + PID] as { w1_mon: { title: string } }).w1_mon.title, 'Lower');
  });

  test('a minus on a card and on a round mark the working day alone, and each is put back', () => {
    const s = memoryStore(), wild: WildDay = wildDay();
    assert.equal(act(session(s, 'mon'), { kind: 'exercise', name: 'Back squat' }, true, wild), 'Back squat is off today. Tap to put it back.');
    assert.equal(wild.sections![0]!.items![0]!._skipped, true);
    assert.equal(act(session(s, 'mon'), { kind: 'round', secIdx: 1 }, true, wild), 'Round is off today. Tap to put it back.');
    assert.equal(wild.sections![1]!._skipped, true);
    assert.deepStrictEqual(s.keys(), []);
    assert.equal(act(session(s, 'mon'), { kind: 'exercise', name: 'Back squat' }, false, wild), 'Back squat is back on the card.');
    assert.equal(act(session(s, 'mon'), { kind: 'round', secIdx: 1 }, false, wild), 'Round is back on the card.');
    assert.deepStrictEqual([wild.sections![0]!.items![0]!._skipped, wild.sections![1]!._skipped], [undefined, undefined]);
    assert.deepStrictEqual(s.keys(), []);
    assert.equal(act(session(s, 'mon'), { kind: 'exercise', name: 'A move the card does not hold' }, true, wild), null);
  });

  test('guard: without the Wildcard\'s day the same taps still store on the program\'s day, as before', () => {
    const s = memoryStore(), g = prog() as DeckProgram;
    assert.ok(swapMove({ store: s, prog: g, week: 1, dayKey: 'mon' }, CTX, 'Barbell box squat', 5));
    assert.ok(s.keys().includes('ia_swaps_' + PID) && s.keys().includes('ia_swapct_' + PID), s.keys().join());
    assert.equal(act({ store: s, prog: g, week: 1, dayKey: 'sat' }, { kind: 'exercise', name: 'Back squat' }, true), 'Back squat is off today. Tap to put it back.');
    assert.ok(s.keys().includes('ia_edits_' + PID), s.keys().join());
  });

  test('guard: the swap sheet of a program\'s day is the sheet of that day handed over as it is', () => {
    const g = prog() as DeckProgram;
    assert.deepStrictEqual(swapSheetOn(g, g.weeks[1]!['mon'], 0, 0), swapSheetOf(g, 1, 'mon', 0, 0));
    assert.equal(swapSheetOn(g, wildDay(), 0, 0)!.ctx.name, 'Back squat');
    assert.equal(swapSheetOn(g, wildDay(), 5, 0), null);
    assert.equal(swapSheetOn(g, null, 0, 0), null);
  });
});

describe('native Random Workout: a card\'s Log goes under the week in hand and the day last opened', () => {
  const now = at(2026, 11, 3).getTime();
  const logOn = (s: StateStore, dayKey: string | null): void => {
    const hand = newDayInHand();
    hand.dayKey = dayKey;
    const v = wildSections(s, prog(), hand, 2, wildDay(), now), x = cards(v)[0]!;
    const r = tapLog(wildSession(s, prog(), hand, 2), wildFields(v), x, now);
    assert.equal(r.toast, 'Logged ✓');
  };

  test('with no day opened the entry\'s day is blank, and nothing else is stored', () => {
    const s = memoryStore();
    assert.equal(wildSession(s, prog(), newDayInHand(), 2).dayKey, '');
    logOn(s, null);
    assert.deepStrictEqual(s.keys(), ['ia_exw_' + PID]);
    const e = (held(s)['ia_exw_' + PID] as { back_squat: { entries: Record<string, unknown>[] } }).back_squat.entries[0]!;
    assert.deepStrictEqual([e['week'], e['day'], e['setsDone'], e['setsReps']], [2, '', [5, 5, 5], '3×5 @ RPE 8']);
  });

  test('the load field is turned by the program\'s unit, each set\'s load by the unit on the card', () => {
    // A kilogram program with no day opened: the card reads pounds. 100 typed in the load field alone is stored as
    // round(100 × 2.20462) = 220 and the toast says kg; 100 typed in each set is stored as 100, and the entry's
    // weight is its heaviest set.
    const kg = prog({ cfg: { unit: 'kg' } });
    const hand = newDayInHand();
    const s = memoryStore();
    const session = wildSession(s, kg, hand, 2);
    assert.deepStrictEqual([session.prog, session.label, session.dayKey, session.week], [kg, 'lbs', '', 2]);
    const v = wildSections(s, kg, hand, 2, wildDay(), now), x = cards(v)[0]!;
    const F = wildFields(v), f = F[x.exKey]!;
    const field = tapLog(session, { ...F, [x.exKey]: { ...f, load: { ...f.load!, value: '100' }, loads: [] } }, x, now);
    assert.equal(field.toast, '100 kg logged ✓');
    const entries = (): { weight: number; setsW: number[] }[] => (held(s)['ia_exw_' + PID] as { back_squat: { entries: { weight: number; setsW: number[] }[] } }).back_squat.entries;
    assert.deepStrictEqual([entries()[0]!.weight, entries()[0]!.setsW], [220, []]);
    const sets = tapLog(session, { ...F, [x.exKey]: { ...f, load: { ...f.load!, value: '100' }, loads: f.loads.map((c) => ({ ...c, value: '100' })) } }, x, now + 1);
    assert.equal(sets.toast, '100 kg logged ✓');
    const last = entries()[entries().length - 1]!;
    assert.deepStrictEqual([last.weight, last.setsW], [100, [100, 100, 100]]);
    // Once a day has been opened the card reads kilograms too, and both are turned.
    hand.unit = 'kg';
    const both = tapLog(wildSession(s, kg, hand, 2), { ...F, [x.exKey]: { ...f, load: { ...f.load!, value: '100' }, loads: f.loads.map((c) => ({ ...c, value: '100' })) } }, x, now + 2);
    assert.equal(both.toast, '100 kg logged ✓');
    const turned = entries()[entries().length - 1]!;
    assert.deepStrictEqual([turned.weight, turned.setsW], [220, [220, 220, 220]]);
  });

  test('with a day opened the entry carries that day, which is snapshotted as a logged day is', () => {
    const s = memoryStore();
    logOn(s, 'sat');
    const e = (held(s)['ia_exw_' + PID] as { back_squat: { entries: Record<string, unknown>[] } }).back_squat.entries[0]!;
    assert.deepStrictEqual([e['week'], e['day']], [2, 'sat']);
    assert.deepStrictEqual(s.keys().sort(), ['ia_exw_' + PID, 'ia_hist_' + PID]);
    assert.deepStrictEqual(Object.keys(held(s)['ia_hist_' + PID] as object), ['w2_sat']);
  });
});

describe('native Random Workout: what a day\'s open leaves behind', () => {
  test('it starts with no day, pounds and a silent warning; an open sets all three', () => {
    const hand = newDayInHand();
    assert.deepStrictEqual(plainOf(hand), { dayKey: null, unit: 'lbs', warn: { shown: false, src: '' } });
    hand.warn.shown = true;
    hand.warn.src = 'An older program';
    const warn = openedDay(hand, prog({ cfg: { unit: 'kg' } }) as DeckProgram, 'wed');
    assert.equal(warn, hand.warn);
    assert.deepStrictEqual(plainOf(hand), { dayKey: 'wed', unit: 'kg', warn: { shown: false, src: '' } });
    openedDay(hand, prog() as DeckProgram, 'mon');
    assert.deepStrictEqual([hand.dayKey, hand.unit], ['mon', 'lbs']);
  });

  test('a session sheet drawn with the app\'s day in hand sets it; one drawn without leaves it alone', () => {
    const hand = newDayInHand();
    assert.ok(sheetView(memoryStore(), prog() as never, 1, 'mon', at(2026, 11, 3).getTime()));
    assert.equal(hand.dayKey, null);
    assert.ok(sheetView(memoryStore(), prog({ cfg: { unit: 'kg' } }) as never, 1, 'sat', at(2026, 11, 3).getTime(), hand));
    assert.deepStrictEqual([hand.dayKey, hand.unit], ['sat', 'kg']);
    // A rest day draws no sheet and opens no day.
    assert.equal(sheetView(memoryStore(), prog() as never, 1, 'tue', at(2026, 11, 3).getTime(), hand), null);
    assert.equal(hand.dayKey, 'sat');
  });
});

describe('native Random Workout: which files write, and what the screens say', () => {
  const screen = read('random-workout/RandomWorkout.tsx'), view = read('random-workout/random-screen.ts'), writes = read('random-workout/random-writes.ts');
  const app = read('App.tsx'), weekScreen = read('this-week/ThisWeek.tsx');
  const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));

  test('random-writes.ts alone writes the Wildcard\'s record, through core\'s writer; no file of the folder names a key or the store\'s set', () => {
    const writers = sources(NATIVE).filter((f) => /writeWildcardDone\(/.test(strip(readFileSync(f, 'utf8')))).map((f) => f.slice(NATIVE.length + 1));
    assert.deepStrictEqual(writers, ['random-workout/random-writes.ts']);
    for (const [name, text] of [['RandomWorkout.tsx', screen], ['random-screen.ts', view], ['random-writes.ts', writes]] as const) {
      assert.ok(!/['"`]ia_/.test(text), name + ' names a key');
      assert.ok(!/\.(set|remove)\(/.test(text.replace(/\bm\.set\(/g, '')), name + ' writes to the store itself');
    }
    assert.ok(!/writeWildcardDone|completeWildcard\(|resetWildcards\(/.test(view), 'random-screen.ts writes nothing');
  });

  test('the words are today\'s: the Angular screen\'s template and the page\'s own', () => {
    const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/random-workout/random-workout.ts'), 'utf8');
    const page = readFileSync(join(REPO, 'frontends/app/src/legacy/src/js/random-wildcard.ts'), 'utf8');
    assert.deepStrictEqual(RAND_WORDS, {
      back: '← Back', reset: '↺ Reset', again: 'Tap again', resetLabel: 'Reset wildcard counter', badge: 'Wildcard', badgeDone: 'Done Before ✓',
      doneBlock: '✓ You\'ve done this one before', complete: ' Complete — Mark Done', completeIcon: '✅',
    });
    for (const w of ['>← Back<', "'Tap again' : '↺ Reset'", 'aria-label="Reset wildcard counter"', "'Done Before ✓' : 'Wildcard'", '>✓ You\'ve done this one before<', "'✅', 14) + ' Complete — Mark Done'", "'Wildcard counter reset ✓'", '}, 3000);']) {
      assert.ok(today.includes(w), 'today\'s screen no longer says ' + w);
    }
    for (const w of ["kicker:'Wildcard done'", "msg:'You showed up. That is the whole game.'", "'Streak holds.'", "showToast(title+' logged ✓')", 'fireWildcardPopup(isTraining),380)']) assert.ok(page.includes(w), 'today\'s page no longer says ' + w);
  });

  test('the screen draws today\'s pieces, and its cards are the session sheet\'s own', () => {
    for (const id of ['rand-filters', "'rand-filter-' + f.id", 'rand-reset', 'rand-badge', 'rand-title', 'rand-cardio', 'rand-note', 'rand-done', 'rand-complete']) assert.ok(screen.includes(id), id);
    assert.ok(/<SheetSections sections=\{sections\}/.test(screen) && /unit=\{hand\.unit\}/.test(screen));
    // Each section is a piece of the sheet's column, 16 apart (measured beside today's own page in the simulator's Safari).
    assert.ok(screen.includes('unit={hand.unit} h={h} gap={SECTION_GAP} />') && screen.includes('const SECTION_GAP = 16;'));
    assert.ok(/<SwapSheet /.test(screen));
    // Every edit of a card is handed the working day; the cards' Log and drafts go through the Wildcard's session.
    assert.ok(/act\(session, a, off, open\.wild\)/.test(screen) && /swapMove\(session, swap\.ctx, to, Date\.now\(\), open\.wild\)/.test(screen) && /undoSwap\(session, from, open\.wild\)/.test(screen) && /swapSheetOn\(prog, open\.wild, secIdx, itemIdx\)/.test(screen));
    assert.ok(/const session: Session = wildSession\(store, prog, hand, week\)/.test(screen));
    // The reset's timer is never taken back, as the page's is not.
    assert.ok(!/clearTimeout/.test(screen));
    assert.ok(screen.includes('if (!reset.pending) {\n      reset.pending = true;') && screen.includes('setTimeout(() => { reset.pending = false; if (alive.current) setAsked((n) => n + 1); }, RESET_ASK_MS);'), 'the first tap asks again for three seconds');
    assert.ok(screen.includes('reset.pending = false;\n    const toast = resetWildcards(store, prog);\n    setAsked((n) => n + 1);\n    onWrote();\n    say(toast);'), 'the second empties the record, has This Week read its counter again, and says so');
    assert.ok(screen.includes("{reset.pending ? RAND_WORDS.again : RAND_WORDS.reset}") && screen.includes('color: reset.pending ? p.red : p.muted'));
    // A filter is kept, then a fresh draw is made where the tap lands; Complete writes, speaks and hands on before the sheet slides away.
    assert.ok(screen.includes('st.filter = f;\n    const o = openRandom(st, store, prog, hand, week, Math.random, Date.now());\n    setOpen(o);\n    drawn(o.sections);'));
    assert.ok(screen.includes('away(() => {\n      const r = completeWildcard(store, prog, open.head.title, new Date());\n      say(r.toast);\n      onComplete(r);\n    });'));
    assert.ok(screen.includes('{v.done ? RAND_WORDS.badgeDone : RAND_WORDS.badge}') && screen.includes('{v.done ? (') && screen.includes('{RAND_WORDS.doneBlock}') && screen.includes('{RAND_WORDS.complete}') && screen.includes('asyIcon(RAND_WORDS.completeIcon, 14)'));
    assert.ok(screen.includes("const on = st.filter === f.id;") && screen.includes('{RAND_FILTERS.map((f) => {') && screen.includes('{f.label}'));
    // Each redraw after an edit reads the cards off the working day again and starts every field afresh.
    assert.ok(screen.includes('const redraw = (): void => drawn(wildSections(store, prog, hand, week, open.wild, Date.now()));') && screen.includes('setSections(next);\n    apply(wildFields(next));\n    setSetsOpen({});'));
  });

  test('This Week\'s button carries the counter and asks the app; the app opens the sheet on a fresh draw and raises the pop-up 380 ms after Complete', () => {
    assert.ok(/testID="week-random" accessibilityRole="button" onPress=\{\(\) => onAsk\(\{ kind: 'random' \}\)\}/.test(weekScreen));
    assert.ok(weekScreen.includes('<Text testID="week-random-counter" style={[s.counter, { color: p.muted }]}>{randCounter(store, prog as unknown as RandProgram | null)}</Text>'), 'the counter is read for the program in hand, at each draw');
    assert.ok(!/accessibilityState=\{\{ disabled: true \}\}/.test(weekScreen), 'the button is no longer drawn as off');
    // Today's button stands its words on two centred lines between its mark and its counter at this width.
    assert.ok(weekScreen.includes('<Text style={[s.actionText, s.randomText, { color: p.text }]}>Random Workout</Text>') && weekScreen.includes("randomText: { flex: 1, textAlign: 'center', lineHeight: 19.85 },"));
    assert.ok(/ask\.kind === 'random'/.test(app) && /openRandom\(randState, phoneStore, prog, inHand, week, Math\.random, /.test(app));
    assert.ok(/fireWildcardPopup\(phoneStore, prog, r\.isTraining, now\)/.test(app) && /\}, WILD_POP_MS\)/.test(app));
    assert.ok(app.includes('const prog = s.prog as unknown as RandProgram, week = hand.own || 1;'), 'the week in hand is This Week\'s own');
    assert.ok(app.includes('const prog = random.prog;\n            setWrites((n) => n + 1);\n            timers.current.push(setTimeout(() => {'), 'Complete draws This Week again before the pop-up\'s wait');
    assert.ok(app.includes('onClose={() => setRandom(null)} onWrote={() => setWrites((n) => n + 1)}'), 'the reset has This Week read its counter again');
    assert.ok(app.includes("<RandomWorkout key={'random' + random.n} palette={p} store={phoneStore} prog={random.prog} week={random.week} hand={inHand} opened={random.opened} state={randState} reset={randReset} calm={calm} say={say}"));
    assert.ok(app.includes('const inHand = useRef(newDayInHand()).current;') && app.includes('const randState = useRef(newRandState()).current;') && app.includes('const randReset = useRef<ResetAsk>({ pending: false }).current;'), 'each is kept for the app\'s life');
    // A day's open sets the app's day in hand, and a program made active clears its day.
    assert.ok(/openedDay\(inHand, grid, key\)/.test(weekScreen) && /sheetView\(store, grid, week, key, Date\.now\(\), inHand\)/.test(weekScreen));
    assert.ok(/sheetView\(store, g, open\.week, open\.dayKey, Date\.now\(\), inHand\)/.test(read('day-detail/SessionSheet.tsx')));
    assert.equal((app.match(/inHand\.dayKey = null/g) || []).length, 3, 'a switch, the active program gone, and Generate');
  });
});
