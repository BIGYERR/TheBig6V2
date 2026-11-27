// The pop-ups in the Expo app (MIGRATION.md phase 3, the deck's fourth session): the pure logic of
// frontends/native/src/pop-up/pop-ups.ts and the nudge's writes in deck-writes.ts. Every expected value here is typed
// by hand: from the rulings (V181 D1 to D4: a status takes the day, the streak alone under the line; V195 D71; V220
// D174 and D175: a tagged line asks the trained day; D238 and D240: the reminder never chases missed work; D284), from
// the page's own lines as they stand in popups-streaks-reminders.ts, and from the calendar (2 November 2026 is a
// Monday). None is asked of the app: the comparison with today's page is tests/integration/native-pop-ups.test.ts.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { type Session, acceptNudge, dismissNudge, nudgeWords } from '../../frontends/native/src/deck/deck-writes.ts';
import {
  POP_CFG, POP_DISMISS, POP_KNICKS, POP_POOLS, type PopSession, fireCompletionPopup, labelParts, maybeShowReminder, popContext, popDismissText, popEligible,
  popOf, popPick, resolveReminder, streakMilestone,
} from '../../frontends/native/src/pop-up/pop-ups.ts';

const filled = (keys: Record<string, unknown>): StateStore => { const s = memoryStore(); for (const [k, v] of Object.entries(keys)) s.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return s; };
const held = (s: StateStore): Record<string, unknown> => Object.fromEntries(s.keys().sort().map((k) => { const v = s.get(k)!; try { return [k, JSON.parse(v)]; } catch { return [k, v]; } }));
const at = (y: number, m: number, d: number, h = 18, min = 0): Date => new Date(y, m - 1, d, h, min, 0);
/** A draw that hands back each number in turn. */
const draws = (...xs: number[]): (() => number) => { let i = 0; return () => { const x = xs[i++]; assert.notEqual(x, undefined, 'the code drew more often than this test expects'); return x!; }; };
const never = (): number => { throw new Error('nothing should be drawn here'); };

// Two weeks from Monday 2 November 2026. Each week: Monday a lift, Wednesday a run alone, Thursday a mobility day,
// Saturday a lift with a run; Tuesday, Friday and Sunday rest.
const lift = (title: string) => ({ title, sections: [{ label: 'Main lift', items: [{ name: 'Back squat', detail: '3×5' }] }] });
const week = () => ({
  mon: lift('Lower'), tue: { rest: true }, wed: { title: 'Easy Run', cardio: { type: 'run' }, sections: [] },
  thu: { title: "Coach's Pick", sections: [{ label: 'Post-run mobility', items: [{ name: 'Couch stretch', detail: '2×60 sec' }] }] },
  fri: { rest: true }, sat: { ...lift('Upper'), cardio: { type: 'run' } }, sun: { rest: true },
});
const PID = 'prog_1';
const prog = () => ({ id: PID, startDate: '2026-11-02', totalWeeks: 2, weeks: { 1: week(), 2: week() } }) as unknown as PopSession['prog'];
const session = (keys: Record<string, unknown> = {}): PopSession => ({ store: filled(keys), prog: prog() });
const done = (...days: string[]): Record<string, unknown> => Object.fromEntries(days.map((k) => [k, { title: 'x', ts: 1, status: 'complete' }]));

describe('native pop-ups: the two models are today\'s files', () => {
  for (const [f, from, to] of [
    ['pop-up-model.ts', 'frontends/app/src/app/screens/pop-up', 'frontends/native/src/pop-up'],
    ['swap-nudge-model.ts', 'frontends/app/src/app/screens/swap-nudge', 'frontends/native/src/swap-nudge'],
  ] as const) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(REPO, from, f)), copy = readFileSync(join(REPO, to, f));
      assert.ok(today.length > 500, 'today\'s file holds something');
      assert.ok(today.equals(copy), 'the copy differs from today\'s ' + f + ': copy it again');
    });
  }
});

describe('native pop-ups: the lines and who may draw one', () => {
  test('the pools hold the page\'s lines, and the tiers their look', () => {
    assert.equal(POP_POOLS['workout']![0], 'Congrats... you actually showed up. Just, you know, faster next time. 🎉');
    assert.deepStrictEqual(POP_POOLS['workout']![1], { t: 'Hangover said stay down. You told it to go fuck itself. Respect. 🍺🪦', when: 'weekend' });
    assert.deepStrictEqual(POP_POOLS['reminder'], [
      'Yo, you ghosted a session. Mark it or own the skip.', 'Left a day hanging unmarked. Did you train or nah?', 'Unfinished business sitting on your calendar. Settle up.',
      'That day didn\'t log itself, champ. Complete it or call it.', 'You disappeared on a workout. Your record, your call. Fix it.',
    ]);
    assert.deepStrictEqual(POP_DISMISS, ['yeah yeah...', 'good looks 😒', 'ok i get it...', '...tato', 'i don\'t need your approval... but ok', 'save it 🫳', '...moving on']);
    assert.deepStrictEqual(POP_KNICKS, ['#006BB6', '#F58426', '#BEC0C2']);
    assert.deepStrictEqual(Object.fromEntries(Object.entries(POP_CFG).map(([k, v]) => [k, [v.icon, v.kicker, v.confetti, v.shake]])), {
      workout: ['🎉', 'Workout complete', 72, false], reminder: ['notebook', 'Unfinished business', 0, false], streak: ['🔥', 'Streak alive', 100, false], season: ['🏆', 'Season complete', 200, true],
    });
  });

  test('a tagged line asks the trained day: weekend by its date, morning by the clock on the day itself, cardio and lift by what it holds', () => {
    const s = session();
    // Saturday 7 November, marked at six in the evening: a weekend, not a morning, a run, and a lift.
    assert.deepStrictEqual(popContext(s, 1, 'sat', at(2026, 11, 7)), { known: true, weekend: true, morning: false, cardio: true, lift: true });
    // The same Saturday before nine: a morning. Marked the next morning, it is not: the trained day is not today.
    assert.equal(popContext(s, 1, 'sat', at(2026, 11, 7, 8, 59)).morning, true);
    assert.equal(popContext(s, 1, 'sat', at(2026, 11, 8, 8, 0)).morning, false);
    // Monday: a lift, no run. Wednesday: a run, no lift. Thursday: mobility is not lifting.
    assert.deepStrictEqual(popContext(s, 1, 'mon', at(2026, 11, 2)), { known: true, weekend: false, morning: false, cardio: false, lift: true });
    assert.deepStrictEqual(popContext(s, 1, 'wed', at(2026, 11, 4)), { known: true, weekend: false, morning: false, cardio: true, lift: false });
    assert.equal(popContext(s, 1, 'thu', at(2026, 11, 5)).lift, false);
    // No day to read: unknown.
    assert.deepStrictEqual(popContext(s, undefined, undefined, at(2026, 11, 7)), { known: false });
    assert.deepStrictEqual(popContext(s, 9, 'mon', at(2026, 11, 7)), { known: false });

    const weekend = { t: 'w', when: 'weekend' }, both = { t: 'b', when: 'morning', type: 'lift' };
    assert.equal(popEligible('plain', null), true, 'an untagged line, always');
    assert.equal(popEligible(weekend, { known: false }), false, 'a tagged line sits out an unknown day');
    assert.equal(popEligible(weekend, null), false, 'and a day with nothing read of it at all');
    assert.equal(popEligible({ t: 'l', type: 'lift' }, undefined), false);
    assert.equal(popEligible(weekend, { known: true, weekend: true }), true);
    assert.equal(popEligible(weekend, { known: true, weekend: false }), false);
    assert.equal(popEligible(both, { known: true, morning: true, lift: true }), true, 'both tags pass');
    assert.equal(popEligible(both, { known: true, morning: true, lift: false }), false, 'one tag fails');
    assert.equal(popEligible({ t: 'c', type: 'cardio' }, { known: true, cardio: false }), false);
  });

  test('a pick is never the tier\'s last line while another may be drawn, and it is kept', () => {
    const s = session();
    // No day given: the tagged lines sit out. The first draw of nothing picks the first line.
    assert.equal(popPick(s, 'workout', undefined, undefined, at(2026, 11, 2), draws(0)), 'Congrats... you actually showed up. Just, you know, faster next time. 🎉');
    assert.deepStrictEqual(held(s.store), { ['ia_pop_idx_' + PID]: { workout: 0 } });
    // Again with the same draw: the first line was the last one, so the next untagged line (the second is a weekend's).
    assert.equal(popPick(s, 'workout', undefined, undefined, at(2026, 11, 2), draws(0)), 'Look at you. Vertical, sweaty, and useful. Goddamn miracle. 🫡');
    assert.deepStrictEqual(held(s.store), { ['ia_pop_idx_' + PID]: { workout: 2 } });
    // On the Saturday the weekend's line may be drawn: with the first line last, a draw of nothing picks it.
    s.store.set('ia_pop_idx_' + PID, JSON.stringify({ workout: 0, streak: 4 }));
    assert.equal(popPick(s, 'workout', 1, 'sat', at(2026, 11, 7), draws(0)), 'Hangover said stay down. You told it to go fuck itself. Respect. 🍺🪦');
    assert.deepStrictEqual(held(s.store), { ['ia_pop_idx_' + PID]: { workout: 1, streak: 4 } }, 'each tier keeps its own last line');
    // The reminder's pool: five lines, the third drawn by a draw of a half with none drawn before.
    assert.equal(popPick(session(), 'reminder', 1, 'mon', at(2026, 11, 3), draws(0.5)), 'Unfinished business sitting on your calendar. Settle up.');
    assert.equal(popPick(s, 'no such tier', 1, 'mon', at(2026, 11, 3), never), '');
  });

  test('the button\'s words: one flavor a calendar day, another the next day', () => {
    const s = session();
    assert.equal(popDismissText(s, at(2026, 11, 7), draws(0)), 'yeah yeah...');
    assert.deepStrictEqual(held(s.store), { ['ia_pop_dismiss_' + PID]: { date: '2026-11-7', idx: 0 } }, 'the day is stamped without leading zeros');
    assert.equal(popDismissText(s, at(2026, 11, 7, 23, 0), never), 'yeah yeah...', 'held all day, nothing drawn');
    // The next day: a draw of the same one is drawn again; two sevenths is the second.
    assert.equal(popDismissText(s, at(2026, 11, 8, 6, 0), draws(0, 0.2)), 'good looks 😒');
    assert.deepStrictEqual(held(s.store), { ['ia_pop_dismiss_' + PID]: { date: '2026-11-8', idx: 1 } });
  });
});

describe('native pop-ups: what a day marked done raises', () => {
  test('a streak of 3, 7, 14, 30 and every 30 after is a milestone, and no other', () => {
    assert.deepStrictEqual([0, 1, 2, 3, 4, 6, 7, 8, 13, 14, 29, 30, 31, 45, 60, 61, 90, 120].filter(streakMilestone), [3, 7, 14, 30, 60, 90, 120]);
  });

  test('the workout line, with the streak alone under it', () => {
    const s = session({ ['ia_comp_' + PID]: done('w1_mon') });
    const call = fireCompletionPopup(s, 1, 'mon', at(2026, 11, 2));
    assert.equal(call.tier, 'workout');
    assert.deepStrictEqual([call.opts.week, call.opts.dayKey], [1, 'mon']);
    assert.equal(call.opts.stats!.length, 1);
    assert.deepStrictEqual([call.opts.stats![0]!.n, call.opts.stats![0]!.cls], ['1', 'streak']);
    assert.match(call.opts.stats![0]!.l, /^Day Streak <svg width="12" height="12" /, 'the flame is the app\'s own icon, at 12');
    assert.deepStrictEqual(held(s.store), { ['ia_comp_' + PID]: done('w1_mon') }, 'deciding what to raise stores nothing');
    // What it shows: the line and the button's words drawn in that order, the party icon as text, 72 pieces.
    const v = popOf(s, call, at(2026, 11, 2), draws(0, 0));
    assert.deepStrictEqual([v.icon, v.kicker, v.kickerClass, v.msg, v.sub, v.actionsClass, v.modalClass, v.confetti],
      [{ name: '🎉', svg: false }, 'Workout complete', 'pop-kicker ', 'Congrats... you actually showed up. Just, you know, faster next time. 🎉', '', 'pop-actions', 'pop-modal', 72]);
    assert.deepStrictEqual(v.actions, [{ label: 'yeah yeah...', cls: 'go', onclick: 'popClose()' }]);
    assert.deepStrictEqual(Object.keys(held(s.store)).sort(), ['ia_comp_' + PID, 'ia_pop_dismiss_' + PID, 'ia_pop_idx_' + PID]);
  });

  test('the third day running is the streak pop-up; a skip breaks the run, a day not yet marked does not', () => {
    // Monday, Wednesday and Thursday done, marked on Thursday: three.
    const s = session({ ['ia_comp_' + PID]: done('w1_mon', 'w1_wed', 'w1_thu') });
    const call = fireCompletionPopup(s, 1, 'thu', at(2026, 11, 5));
    assert.deepStrictEqual(call, { tier: 'streak', opts: { kicker: '3-day streak 🔥', stats: [{ n: '3', l: 'Day Streak', cls: 'streak' }] } });
    const v = popOf(s, call, at(2026, 11, 5), draws(0, 0));
    assert.deepStrictEqual([v.icon.name, v.kicker, v.kickerClass, v.confetti], ['🔥', '3-day streak 🔥', 'pop-kicker streak', 100]);
    assert.equal(v.msg, POP_POOLS['streak']![0]);
    // Wednesday skipped: Thursday's run is one. Wednesday not marked at all: it is passed over, and the run is two.
    const skipped = session({ ['ia_comp_' + PID]: { ...done('w1_mon', 'w1_thu'), w1_wed: { title: 'x', ts: 1, status: 'skipped' } } });
    assert.equal(fireCompletionPopup(skipped, 1, 'thu', at(2026, 11, 5)).opts.stats![0]!.n, '1');
    const pending = session({ ['ia_comp_' + PID]: done('w1_mon', 'w1_thu') });
    assert.equal(fireCompletionPopup(pending, 1, 'thu', at(2026, 11, 5)).opts.stats![0]!.n, '2');
  });

  test('the last scheduled day is the season, once: its mark is stored, and the next time it is the workout line', () => {
    const comp = { ...done('w1_mon', 'w2_sat'), w1_wed: { title: 'x', ts: 1, status: 'skipped' }, w1_thu: { title: 'x', ts: 1, status: 'partial' } };
    const s = session({ ['ia_comp_' + PID]: comp });
    const call = fireCompletionPopup(s, 2, 'sat', at(2026, 11, 14));
    // Three done (a partial is a done), one skipped, two weeks.
    assert.deepStrictEqual(call, { tier: 'season', opts: { stats: [{ n: '3', l: 'Workouts' }, { n: '1', l: 'Skips' }, { n: '2', l: 'Weeks' }] } });
    assert.equal(s.store.get('ia_season_shown_' + PID), '1');
    const v = popOf(s, call, at(2026, 11, 14), draws(0, 0));
    assert.deepStrictEqual([v.icon.name, v.kicker, v.modalClass, v.confetti], ['🏆', 'Season complete', 'pop-modal shake', 200]);
    assert.equal(fireCompletionPopup(s, 2, 'sat', at(2026, 11, 14)).tier, 'workout', 'once ever');
    // Another day is never the season.
    assert.equal(fireCompletionPopup(session({ ['ia_comp_' + PID]: done('w2_thu') }), 2, 'thu', at(2026, 11, 12)).tier, 'workout');
  });
});

describe('native pop-ups: the day-after reminder', () => {
  test('it asks about the latest past day not marked, once a calendar day, with today\'s words and both buttons', () => {
    const s = session({ ['ia_comp_' + PID]: done('w1_mon') });
    // Tuesday 10 November: the latest past training day is Monday of week 2. Four days stand unmarked since the last
    // marked one (Wednesday, Thursday, Saturday, Monday): under seven, so a line of the pool, and the doctrine line.
    const r = maybeShowReminder(s, at(2026, 11, 10, 9, 0), draws(0.5))!;
    assert.deepStrictEqual([r.week, r.dayKey, r.title], [2, 'mon', 'Lower']);
    assert.deepStrictEqual(r.call, { tier: 'reminder', opts: {
      msg: 'Unfinished business sitting on your calendar. Settle up.',
      sub: 'Monday, Wk 2 · Lower. The week ahead stays as written.',
      actions: [
        { label: '✓ Done', cls: 'go', onclick: "resolveReminder(2,'mon','Lower','complete')" },
        { label: '✕ Skip', cls: 'skip', onclick: "resolveReminder(2,'mon','Lower','skipped')" },
      ],
      triple: true,
    } });
    assert.deepStrictEqual(held(s.store), {
      ['ia_comp_' + PID]: done('w1_mon'), ['ia_pop_idx_' + PID]: { reminder: 2 }, ['ia_remind_last_' + PID]: '2026-11-10', ['ia_reminded_' + PID]: { w2_mon: true },
    });
    // What it shows: the notebook the app draws, no confetti, the two buttons side by side, and nothing more drawn.
    const v = popOf(s, r.call, at(2026, 11, 10, 9, 0), never);
    assert.deepStrictEqual([v.icon, v.kicker, v.actionsClass, v.confetti, v.stats], [{ name: 'notebook', svg: true }, 'Unfinished business', 'pop-actions triple', 0, []]);
    // The same day again: nothing. The next day: the day before the one already asked about.
    assert.equal(maybeShowReminder(s, at(2026, 11, 10, 20, 0), never), null);
    const next = maybeShowReminder(s, at(2026, 11, 11, 9, 0), draws(0))!;
    assert.deepStrictEqual([next.week, next.dayKey, next.call.opts.sub], [1, 'sat', 'Saturday, Wk 1 · Upper. The week ahead stays as written.']);
  });

  test('a marked day ends the walk: the days before it are never asked about (D240)', () => {
    // Monday of week 1 was never marked; Thursday was. On Friday there is nothing to ask.
    const s = session({ ['ia_comp_' + PID]: done('w1_thu') });
    assert.equal(maybeShowReminder(s, at(2026, 11, 6, 9, 0), never), null);
    assert.deepStrictEqual(Object.keys(held(s.store)), ['ia_comp_' + PID], 'and nothing is stored');
    // A program with no start date asks nothing.
    const bare = session();
    (bare.prog as { startDate?: string | null }).startDate = null;
    assert.equal(maybeShowReminder(bare, at(2026, 11, 6, 9, 0), never), null);
  });

  test('seven days or more unmarked: the fixed guidance, no line drawn, and no doctrine tail', () => {
    // Nothing marked in two weeks: on Sunday 15 November eight training days stand unmarked.
    const s = session();
    const r = maybeShowReminder(s, at(2026, 11, 15, 9, 0), never)!;
    assert.equal(r.call.opts.msg, 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.');
    assert.equal(r.call.opts.sub, 'Saturday, Wk 2 · Upper');
    assert.deepStrictEqual(Object.keys(held(s.store)).sort(), ['ia_remind_last_' + PID, 'ia_reminded_' + PID], 'no line is picked, so no pick is kept');
  });

  test('six days unmarked is still a line of the pool; the seventh is the long gap', () => {
    // Week 1's Monday done, then nothing: on Friday 13 November six training days stand unmarked (Wednesday, Thursday
    // and Saturday of week 1, Monday, Wednesday and Thursday of week 2). On Sunday 15 November, with Saturday, seven.
    const six = session({ ['ia_comp_' + PID]: done('w1_mon') });
    const r6 = maybeShowReminder(six, at(2026, 11, 13, 9, 0), draws(0))!;
    assert.deepStrictEqual([r6.call.opts.msg, r6.call.opts.sub], ['Yo, you ghosted a session. Mark it or own the skip.', 'Thursday, Wk 2 · Coach\'s Pick. The week ahead stays as written.']);
    const seven = session({ ['ia_comp_' + PID]: done('w1_mon') });
    const r7 = maybeShowReminder(seven, at(2026, 11, 15, 9, 0), never)!;
    assert.deepStrictEqual([r7.call.opts.msg, r7.call.opts.sub], ['More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.', 'Saturday, Wk 2 · Upper']);
  });

  test('a title with an apostrophe rides in the button\'s handler code as the page writes it, and comes back whole', () => {
    const s = session({ ['ia_comp_' + PID]: done('w1_wed') });
    const r = maybeShowReminder(s, at(2026, 11, 6, 9, 0), draws(0))!;
    assert.deepStrictEqual([r.week, r.dayKey, r.title], [1, 'thu', "Coach's Pick"]);
    assert.equal(r.call.opts.actions![0]!.onclick, "resolveReminder(1,'thu','Coach\\'s Pick','complete')");
  });

  test('its answer takes the day whole: the snapshot, the day\'s skipped parts cleared, the status, the day marked as asked', () => {
    const s = session({ ['ia_parts_' + PID]: { w1_sat: ['run'], w2_mon: ['lift'] } });
    const NOW = at(2026, 11, 10, 9, 0).getTime();
    assert.equal(resolveReminder(s, 1, 'sat', 'Upper', 'complete', NOW), 'Locked in ✓');
    const k = held(s.store) as Record<string, Record<string, unknown>>;
    assert.deepStrictEqual(k['ia_comp_' + PID], { w1_sat: { title: 'Upper', ts: NOW, status: 'complete' } });
    assert.deepStrictEqual(k['ia_parts_' + PID], { w2_mon: ['lift'] }, 'that day\'s skipped part is gone, another day\'s stays');
    assert.deepStrictEqual(k['ia_reminded_' + PID], { w1_sat: true });
    assert.deepStrictEqual(Object.keys(k['ia_hist_' + PID]!), ['w1_sat'], 'the day is snapshotted on this first touch');
    assert.equal(resolveReminder(s, 2, 'mon', 'Lower', 'skipped', NOW), 'Skipped ✕ — the week moves on');
    assert.equal((held(s.store) as Record<string, Record<string, { status: string }>>)['ia_comp_' + PID]!['w2_mon']!.status, 'skipped');
  });
});

describe('native pop-ups: the coach\'s nudge', () => {
  test('its two paragraphs are today\'s words, lower case, with the lift\'s job', () => {
    assert.deepStrictEqual(nudgeWords('Barbell Romanian deadlift', 'Deadlift'), {
      noticed: 'That is three sessions running you have traded barbell romanian deadlift for deadlift.',
      offer: 'Want me to make deadlift your hinge from here on? I will rebuild the rest of the block around it.',
    });
    // A lift the engine gives no pattern is the main one.
    assert.equal(nudgeWords('Bird dogs', 'Dead bugs').offer, 'Want me to make dead bugs your main from here on? I will rebuild the rest of the block around it.');
  });

  test('Leave the plan alone marks the pair offered and writes nothing else; a lift never counted writes nothing', () => {
    const store = filled({ ['ia_swapct_' + PID]: { 'Front squat': { to: 'Back squat', n: 3, offered: false } } });
    const s = { store, prog: { id: PID, weeks: {} } as DeckProgram, week: 1, dayKey: 'mon' } as Session;
    dismissNudge(s, 'Front squat');
    assert.deepStrictEqual(held(store), { ['ia_swapct_' + PID]: { 'Front squat': { to: 'Back squat', n: 3, offered: true } } });
    dismissNudge(s, 'Deadlift');
    assert.deepStrictEqual(Object.keys(held(store)), ['ia_swapct_' + PID]);
  });

  test('Make the change on a program the store no longer holds writes nothing, hands back no program, and still says today\'s words', () => {
    const store = filled({ ['ia_swapct_' + PID]: { 'Front squat': { to: 'Back squat', n: 3, offered: false } }, ia_programs: [] });
    const before = held(store);
    const r = acceptNudge({ store, prog: { id: PID, weeks: {} } as DeckProgram, week: 1, dayKey: 'mon' } as Session, 'Front squat', 'Back squat', 1, { overlay: () => {}, freeze: () => {}, rebuild: () => {} });
    assert.deepStrictEqual(r, { prog: null, toast: 'Done. Back squat is your squat from here.' });
    assert.deepStrictEqual(held(store), before);
  });
});

describe('native pop-ups: which files write, and what the screens say', () => {
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const read = (f: string): string => strip(readFileSync(join(REPO, 'frontends/native/src', f), 'utf8'));
  const popUps = read('pop-up/pop-ups.ts'), card = read('pop-up/PopUp.tsx'), nudge = read('swap-nudge/SwapNudge.tsx'), app = read('App.tsx'), deck = read('deck/Deck.tsx');

  test('the two folders hold the screen, its model\'s copy and, for the pop-ups, their logic', () => {
    assert.deepStrictEqual(readdirSync(join(REPO, 'frontends/native/src/pop-up')).sort(), ['PopUp.tsx', 'pop-up-model.ts', 'pop-ups.ts']);
    assert.deepStrictEqual(readdirSync(join(REPO, 'frontends/native/src/swap-nudge')).sort(), ['SwapNudge.tsx', 'swap-nudge-model.ts']);
  });

  test('pop-ups.ts alone names the pop-ups\' five key families, and writes each one itself; the reminder\'s answer ends in core\'s writers', () => {
    assert.deepStrictEqual([...new Set([...popUps.matchAll(/'(ia_[a-z_]+_)'/g)].map((m) => m[1]!))].sort(), ['ia_pop_dismiss_', 'ia_pop_idx_', 'ia_remind_last_', 'ia_reminded_', 'ia_season_shown_']);
    assert.equal([...popUps.matchAll(/\bs\.store\.set\(/g)].length, 5, 'five writes by hand: the button\'s words, the pick, the season\'s mark, the reminder\'s day, the days asked about');
    assert.equal([...popUps.matchAll(/\.store\.remove\(/g)].length, 1, 'one is removed here: the season\'s mark, let go when the last day is unmarked (the session sheet\'s undo)');
    assert.ok(popUps.includes("export function releaseSeasonShown(s: PopSession): void { try { s.store.remove('ia_season_shown_' + s.prog.id); }"));
    assert.deepStrictEqual([...new Set([...popUps.matchAll(/\b(recordDaySnapshot|clearDayParts|setDayStatus)\(s\.store/g)].map((m) => m[1]!))].sort(), ['clearDayParts', 'recordDaySnapshot', 'setDayStatus']);
    for (const [name, text] of [['PopUp.tsx', card], ['SwapNudge.tsx', nudge], ['App.tsx', app], ['Deck.tsx', deck]] as const) {
      assert.doesNotMatch(text, /ia_(pop|remind|season)/, name + ' names no pop-up key');
      assert.doesNotMatch(text, /\b\w*[sS]tore\.(set|remove)\(/, name + ' writes no key by hand');
    }
    assert.doesNotMatch(popUps + card + nudge, /Math\.random\(\)/, 'no draw is made but the one handed in');
    assert.ok(app.includes('maybeShowReminder(s, now, Math.random)') && app.includes('fireCompletionPopup(s, week, dayKey, now), now, Math.random)') && card.includes('confetti(view.confetti, Math.random, POP_KNICKS)'), 'the app hands in the real draw');
  });

  test('the screens carry today\'s words, and each pop-up is raised when today\'s is', () => {
    assert.ok(card.includes('>The Asylum<') && nudge.includes('>Noticed something<') && nudge.includes('>Make the change<') && nudge.includes('>Leave the plan alone<'));
    assert.ok(nudge.includes("{text.noticed + '\\n\\n' + text.offer}"), 'the two paragraphs, a blank line between');
    // The reminder 600 ms after a launch, the completion pop-up 380 ms after its Done, the nudge 1.4 s after the pick.
    assert.ok(app.includes('}, 600));') && app.includes('setTimeout(() => complete(was.s, ask.week, ask.dayKey), 380)'));
    assert.ok(deck.includes('if (r.nudge) later(() => setNudge({ from, to }), 1400);'));
    // Mark the day done hands the day to the app, which closes the deck and raises the pop-up; no toast stands in.
    assert.ok(deck.includes('onDone(prog, open.week, open.dayKey);') && !deck.includes("say('Done ✓')"));
    assert.ok(app.includes('setDeck(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey);'));
    // Make the change: the program handed back is the one the deck and This Week hold from then on.
    assert.ok(deck.includes('setProg(r.prog);') && deck.includes('onProgram(r.prog);') && deck.includes('redraw(r.prog);') && app.includes('onProgram={setHeld}'));
  });

  // Every control of the two cards, and every hand-off between the screens, by the code that makes it. A break of
  // any one of these was let through by every other test (tests/measure/native-deck-popups_breaks.md).
  test('each button of the two cards does its own thing, and each screen hands on what the next one needs', () => {
    // The pop-up: a button answers with its place in the row, a tap on the scrim closes the card unanswered, and the
    // reminder's two buttons stand side by side.
    assert.ok(card.includes("testID={'pop-act-' + k} accessibilityRole=\"button\" onPress={() => onAct(k)}"));
    assert.ok(card.includes('<Pressable testID="pop-scrim" accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />'));
    assert.ok(card.includes("const triple = view.actionsClass.includes('triple');") && card.includes('style={[s.actions, triple && s.actionsRow]}'));
    // The nudge: each button its own answer.
    assert.ok(nudge.includes('testID="nudge-yes" accessibilityRole="button" onPress={onYes}') && nudge.includes('testID="nudge-no" accessibilityRole="button" onPress={onNo}'));
    // The app: the reminder is raised when there is one to raise; its first button is Done and its second Skip.
    assert.ok(app.includes('const ask = maybeShowReminder(s, now, Math.random);\n      if (ask) raise(s, popOf(s, ask.call, now, Math.random), ask);'));
    assert.ok(app.includes('const done = index === 0, ask = was.ask;') && app.includes("say(resolveReminder(was.s, ask.week, ask.dayKey, ask.title, done ? 'complete' : 'skipped', Date.now()));"));
    assert.ok(app.includes('if (!was || !was.ask) return;'), 'a card that asks nothing is only closed');
    // The deck: the nudge handed to the app to draw over the toast, with its two answers; Leave the plan alone
    // stores its mark; Make the change says today's toast after the day is drawn again.
    assert.ok(deck.includes('onOver(nudge ? <SwapNudge palette={p} text={nudgeWords(nudge.from, nudge.to)} calm={calm} onYes={changePlan} onNo={leavePlan} /> : null);') && deck.includes('return () => onOver(null);'));
    assert.ok(deck.includes('    if (nudge) dismissNudge(session, nudge.from);\n    setNudge(null);'));
    assert.ok(deck.includes('      redraw(r.prog);\n    }\n    say(r.toast);'));
    // This Week: each launch told to the app, and the program Make the change handed back held in place of the launch's.
    const week = read('this-week/ThisWeek.tsx');
    assert.ok(week.includes('useEffect(() => { onLaunch(launched.prog as unknown as DeckProgram | null); }, [launched]);'));
    assert.ok(week.includes('const prog = held && launched.prog && held.id === launched.prog.id ? (held as unknown as typeof launched.prog) : launched.prog;'));
    assert.ok(app.includes('held={held} hand={hand} inHand={inHand} resets={resets} onAsk={asked} onDeck={(open, from) => setDeck({ open, from })} onSheet={(s) => { setGoing(false); setSheet(s); }} onRest={(ask) => askRest(ask)} onLaunch={launched}') && app.includes("if (t === 'week' && tab !== 'week') { setTick((n) => n + 1); setHeld(null); }"), 'and let go at the next launch');
  });

  test('the motions are today\'s numbers: the card and the scrim still under Reduce Motion, the icon and the confetti not', () => {
    for (const t of [card, nudge]) {
      assert.ok(t.includes('duration: 220, easing: Easing.bezier(0.25, 0.1, 0.25, 1)') && t.includes('duration: 280, easing: Easing.bezier(0.34, 1.56, 0.64, 1)') && t.includes('outputRange: [0.9, 1]'), 'the scrim fades in 220 ms, the card comes in from nine tenths in 280');
      assert.equal(t.split('new Animated.Value(calm ? 1 : 0)').length - 1, 2, 'the scrim and the card both stand at once under Reduce Motion');
    }
    assert.ok(card.includes('duration: 600, delay: 120, easing: Easing.bezier(0.16, 1.4, 0.4, 1)') && card.includes("outputRange: ['-18deg', '0deg']"), 'the icon bounces in');
    assert.ok(card.includes('outputRange: [0, height * 1.05]') && card.includes("outputRange: ['0deg', '640deg']") && card.includes('outputRange: [0, 1, 0.9]'), 'a piece of confetti falls the screen and a twentieth, turning 640 degrees');
    assert.doesNotMatch(card, /shake/i, 'today\'s season card does not shake (motion.css wins over detail-sheet.css), and this one does not');
  });

  test('a stat\'s label: its words, and the icon\'s markup when it ends in one', () => {
    assert.deepStrictEqual(labelParts('Workouts'), { text: 'Workouts', svg: null });
    assert.deepStrictEqual(labelParts('Day Streak <svg width="12" style="display:inline-block"><path d="M1 1"/></svg>'), { text: 'Day Streak', svg: '<svg width="12"><path d="M1 1"/></svg>' });
  });
});
