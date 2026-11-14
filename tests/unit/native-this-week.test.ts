// This Week in the Expo app (MIGRATION.md phase 2, session 4): the screen's pure logic in frontends/native/src/this-week.
// Every expected value here is typed by hand, from the rulings the page's readers carry (D103a's chips, D229's rest
// day lines, D71's Wildcard words and streak, V174's before-start days, V190's set counts), from date arithmetic, or
// from the screen's own rulings (D276, D278, D284, docs/decisions/this-week.md). None is asked of the app: the
// comparison with today's screen is tests/integration/native-this-week.test.ts.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import {
  type ReadDay, type ReadProgram, computeStreak, currentWeek, dayBeforeStart, dayIsTravel, fmtStartDay, heroSummary, itemSets,
  liftFocusCode, liveInjuryOverlay, overlayWeekRange, progAlignment, progDayDate, restDayTip, restLogLines, runSessionCode,
  scheduledDays, secRounds, sessionTimeEst, weekOfDate, wildcardOn,
} from '../../frontends/native/src/this-week/week-readers.ts';
import { BLANK, type ScreenProgram, liveProgram, midnight, pillParts, tokenOf, weekScreen, wildcardSub } from '../../frontends/native/src/this-week/week-screen.ts';

const day = (y: number, m: number, d: number): Date => new Date(y, m - 1, d);
const iso = (d: Date | null): string | null => (d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : null);

describe('native This Week: the screen\'s model and strip are today\'s files', () => {
  // The Expo app draws from a copy of the Angular screen's model and of its strip placer. A copy can drift, so the
  // two are held equal to the byte: a change to today's model turns this red until the copy is made again.
  for (const f of ['week-view-model.ts', 'week-strip.ts']) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/week-view', f));
      const copy = readFileSync(join(REPO, 'frontends/native/src/this-week', f));
      assert.ok(today.length > 1000);
      assert.ok(copy.equals(today), f + ' differs from today\'s: copy it again (cp), never edit the copy');
    });
  }
});

describe('native This Week: read only, and drawn with Expo SDK 58\'s own packages', () => {
  const dir = join(REPO, 'frontends/native/src/this-week');
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f));
  const all = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

  test('the folder holds the screen, its marks, its readers and the two copies', () => {
    assert.deepStrictEqual(files.sort(), ['ThisWeek.tsx', 'marks.tsx', 'week-readers.ts', 'week-screen.ts', 'week-strip.ts', 'week-tips.ts', 'week-view-model.ts']);
  });

  test('no file of the screen writes or removes a stored key', () => {
    // The one `.set(` in the folder is the screen's own map of picked days, never the store.
    assert.doesNotMatch(all, /\b\w*[sS]tore\.(set|remove)\(/, 'no store write');
    assert.deepStrictEqual(all.match(/\b[\w.]+\.(set|remove)\(/g), ['picks.current.set(']);
    assert.doesNotMatch(all, /\b(write|record|clear|set)[A-Z]\w*\(store/, 'none of core\'s writers is called');
  });

  // The versions Expo SDK 58.0.25 names for them (its bundledNativeModules.json, read 2026-11-13): 15.16.0 and ~5.11.1.
  test('the drawing and the safe area packages are SDK 58\'s own, pinned exactly', () => {
    const pkg = JSON.parse(readFileSync(join(REPO, 'frontends/native/package.json'), 'utf8')) as { dependencies: Record<string, string> };
    assert.equal(pkg.dependencies['react-native-svg'], '15.16.0');
    assert.equal(pkg.dependencies['react-native-safe-area-context'], '5.11.1');
  });

  test('the screen draws today\'s words for the parts the model leaves to it', () => {
    const screen = readFileSync(join(dir, 'ThisWeek.tsx'), 'utf8');
    for (const words of ['>Rest day<', 'Recovery is where the work sets in. Move easy, refuel, sleep.', '>Training anyway?<', '>No sessions<',
      'This week has no scheduled training.', '>Wildcard done<', '>This week<', '>Done<', '>Miles<', '>Day streak<', '>Reopen<', "'Skipped'",
      '>Program Start<', "'Set date'", '>Random Workout<', '>Traveling?<']) {
      assert.ok(screen.includes(words), 'ThisWeek.tsx carries ' + words);
    }
  });
});

describe('native This Week: dates', () => {
  // 2026-09-02 is a Wednesday; its week's Monday is 2026-08-31.
  const prog: ReadProgram = { startDate: '2026-09-02', totalWeeks: 14 };

  test('a program day\'s date counts from the Monday of the start\'s week', () => {
    assert.equal(iso(progDayDate(prog, 1, 'mon')), '2026-08-31');
    assert.equal(iso(progDayDate(prog, 1, 'sun')), '2026-09-06');
    assert.equal(iso(progDayDate(prog, 3, 'thu')), '2026-09-17');
    assert.equal(progDayDate({ totalWeeks: 6 }, 1, 'mon'), null, 'no start, no dates');
    assert.equal(progDayDate(prog, 1, 'someday'), null);
  });

  test('the days of week 1 before a midweek start are before the start (V174 D24)', () => {
    assert.equal(dayBeforeStart(prog, 1, 'mon'), true);
    assert.equal(dayBeforeStart(prog, 1, 'tue'), true);
    assert.equal(dayBeforeStart(prog, 1, 'wed'), false);
    assert.equal(dayBeforeStart(prog, 2, 'mon'), false);
    assert.equal(dayBeforeStart({ totalWeeks: 6 }, 1, 'mon'), false, 'no start: nothing is before it');
  });

  test('days before the block opened are before the start too (V188 D14a)', () => {
    const aligned: ReadProgram = { startDate: '2026-08-31', blockOpen: '2026-09-10', totalWeeks: 14 };
    assert.equal(dayBeforeStart(aligned, 2, 'wed'), true, '2026-09-09 is before the block opened');
    assert.equal(dayBeforeStart(aligned, 2, 'thu'), false, '2026-09-10 is the day it opened');
  });

  test('the week holding today: 1 before the start, capped at the last week', () => {
    const p: ReadProgram = { startDate: '2026-08-31', totalWeeks: 14 };
    assert.equal(currentWeek(p, day(2026, 8, 30)), 1);
    assert.equal(currentWeek(p, day(2026, 8, 31)), 1);
    assert.equal(currentWeek(p, day(2026, 9, 6)), 1, 'the Sunday still belongs to week 1');
    assert.equal(currentWeek(p, day(2026, 9, 7)), 2);
    // 30 days of September, 31 of October and 13 of November: 74 days, so week 11, across the clocks going back.
    assert.equal(currentWeek(p, day(2026, 11, 13)), 11);
    assert.equal(currentWeek(p, day(2027, 1, 1)), 14);
    assert.equal(currentWeek({ totalWeeks: 6 }, day(2026, 11, 13)), 1, 'no start: week 1');
    assert.equal(currentWeek({ startDate: '2026-08-31' }, day(2026, 12, 25)), 6, 'no length stored: six weeks');
  });

  test('a day prints as the app prints it', () => {
    assert.equal(fmtStartDay('2026-12-06'), 'Sun, Dec 6');
    assert.equal(fmtStartDay('2026-12-06', true), 'Sun, Dec 6, 2026');
    assert.equal(fmtStartDay('not a date'), 'not a date');
  });

  test('midnight is today with no time, and leaves the clock it was given alone', () => {
    const now = new Date(2026, 10, 13, 22, 0, 30);
    const m = midnight(now);
    assert.equal(m.getTime(), new Date(2026, 10, 13).getTime());
    assert.equal(now.getHours(), 22);
  });
});

describe('native This Week: overlays', () => {
  const prog: ReadProgram = { startDate: '2026-08-31', totalWeeks: 14 };

  test('the week a date falls in', () => {
    assert.equal(weekOfDate(prog, '2026-09-14'), 3);
    assert.equal(weekOfDate(prog, '2026-09-20'), 3);
    assert.equal(weekOfDate(prog, '2026-08-01'), 1, 'before the start reads as week 1');
    assert.equal(weekOfDate(prog, 'nope'), null);
    assert.equal(weekOfDate({ totalWeeks: 6 }, '2026-09-14'), null);
  });

  test('the weeks an overlay covers: open ended runs to the program\'s end, and past the end is nothing', () => {
    assert.deepStrictEqual(overlayWeekRange(prog, { from: '2026-09-14', to: '2026-09-18' }, 14), { fromWeek: 3, toWeek: 3 });
    assert.deepStrictEqual(overlayWeekRange(prog, { from: '2026-09-14', to: null }, 14), { fromWeek: 3, toWeek: 14 });
    assert.deepStrictEqual(overlayWeekRange(prog, { from: '2026-09-14', to: '2027-06-01' }, 14), { fromWeek: 3, toWeek: 14 });
    assert.equal(overlayWeekRange(prog, { from: '2027-06-01', to: null }, 14), null);
    assert.equal(overlayWeekRange(prog, { from: null }, 14), null);
    assert.equal(overlayWeekRange(prog, { from: '2026-09-14' }, 0), null);
  });

  test('a travel day is one built under a substitute overlay on anything but a commercial gym', () => {
    assert.equal(dayIsTravel({ _ovKey: JSON.stringify(['substitute', { equipment: 'minimal' }]) }), true);
    assert.equal(dayIsTravel({ _ovKey: JSON.stringify(['substitute', { equipment: 'bodyweight' }]) }), true);
    assert.equal(dayIsTravel({ _ovKey: JSON.stringify(['substitute', { equipment: 'commercial' }]) }), false);
    assert.equal(dayIsTravel({ _ovKey: JSON.stringify(['injury', { injury: { region: 'knee' } }]) }), false);
    assert.equal(dayIsTravel({ _ovKey: '{broken' }), false);
    assert.equal(dayIsTravel({ title: 'Upper Body' }), false);
    assert.equal(dayIsTravel(undefined), false);
  });

  test('the injury still open: not one that has ended, not a bridge back', () => {
    const inj = { type: 'injury', from: '2026-09-14', to: '2026-09-20', patch: { injury: { region: 'knee' } } };
    const p: ReadProgram = { ...prog, overlays: [{ type: 'substitute', from: '2026-09-14', to: null }, inj] };
    assert.equal(liveInjuryOverlay(p, day(2026, 9, 16)), inj);
    assert.equal(liveInjuryOverlay(p, day(2026, 9, 20)), inj, 'its last day still counts');
    assert.equal(liveInjuryOverlay(p, day(2026, 9, 21)), null);
    const bridge: ReadProgram = { ...prog, overlays: [{ ...inj, patch: { injury: { region: 'knee', bridge: true } } }] };
    assert.equal(liveInjuryOverlay(bridge, day(2026, 9, 16)), null);
    assert.equal(liveInjuryOverlay(prog, day(2026, 9, 16)), null, 'no overlays at all');
  });

  test('a race plan is aligned to its race; a base goal, a bike program or an untargeted race is not', () => {
    const cfg = { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half' } }, raceDate: '2026-12-06', eventTargeted: true };
    assert.equal(progAlignment({ cfg })?.raceIso, '2026-12-06');
    assert.equal(progAlignment({ cfg: { ...cfg, eventTargeted: false } }), null);
    assert.equal(progAlignment({ cfg: { ...cfg, cardioGoals: { run: { id: 'run_base' } } } }), null);
    assert.equal(progAlignment({ cfg: { ...cfg, cardioTypes: ['bike'] } }), null);
    assert.equal(progAlignment({ cfg: { ...cfg, raceDate: null } }), null);
    assert.equal(progAlignment({}), null);
  });
});

describe('native This Week: the day\'s words', () => {
  test('the strip\'s word for a lift day is its focus', () => {
    assert.equal(liftFocusCode('Full Body Strength'), 'FULL');
    assert.equal(liftFocusCode('Upper Body Push'), 'UPPER');
    assert.equal(liftFocusCode('Lower Body'), 'LOWER');
    assert.equal(liftFocusCode('Leg Strength + Mobility'), 'LEGS');
    assert.equal(liftFocusCode('Deadlift + Pull'), 'PULL');
    assert.equal(liftFocusCode('Bench Press'), 'PUSH');
    assert.equal(liftFocusCode('Runner Armor'), 'RUNNE', 'no focus named: the first word, five letters');
    assert.equal(liftFocusCode(''), 'LIFT');
    assert.equal(liftFocusCode(undefined), 'LIFT');
  });

  test('a run\'s chip is its key\'s, whatever its label says (D103a)', () => {
    assert.equal(runSessionCode('Anything at all', 'int', 'run'), 'SI');
    assert.equal(runSessionCode('Anything at all', 'chi', 'run'), 'LI');
    assert.equal(runSessionCode('Anything at all', 'steady', 'run'), 'STDY');
    assert.equal(runSessionCode('Anything at all', 'bench', 'run'), 'TEST');
    assert.equal(runSessionCode('Anything at all', 'trial', 'run'), 'TEST');
  });

  test('an unkeyed run\'s chip is its label\'s; bike and swim keep CHI and INT', () => {
    assert.equal(runSessionCode('Long Interval (LI)', undefined, 'run'), 'LI');
    assert.equal(runSessionCode('Short Interval (SI)', undefined, 'run'), 'SI');
    assert.equal(runSessionCode('Continuous High Intensity', undefined, 'run'), 'LI');
    assert.equal(runSessionCode('Continuous High Intensity', undefined, 'bike'), 'CHI');
    assert.equal(runSessionCode('Intervals (INT)', undefined, undefined), 'SI');
    assert.equal(runSessionCode('Intervals (INT)', undefined, 'swim'), 'INT');
    assert.equal(runSessionCode('Speed Run — Intervals', undefined, 'run'), 'INT');
    assert.equal(runSessionCode('Steady Aerobic', undefined, 'run'), 'STDY');
    assert.equal(runSessionCode('Easy Run', undefined, 'run'), 'EASY');
    assert.equal(runSessionCode('Benchmark 1.5 mi', undefined, 'run'), 'TEST');
    assert.equal(runSessionCode('Long Slow Distance', undefined, 'run'), 'LSD');
    assert.equal(runSessionCode('LSD', undefined, 'run'), 'LSD');
    assert.equal(runSessionCode('Tempo', undefined, 'run'), 'RUN');
    assert.equal(runSessionCode(undefined, undefined, undefined), 'RUN');
  });

  test('an item\'s set count is what its detail opens with, in either grammar (V190 D39)', () => {
    assert.equal(itemSets('4×5 — RPE 8'), 4);
    assert.equal(itemSets('3 x 10'), 3);
    assert.equal(itemSets('2 sets of 30 s'), 2);
    assert.equal(itemSets('45 s hold'), null);
    assert.equal(itemSets(undefined), null);
  });

  test('a section\'s rounds: its own field, then its label, then its items\' smallest count', () => {
    assert.equal(secRounds({ rounds: null, label: '3 rounds' }), null, 'null says no rounds, whatever the label');
    assert.equal(secRounds({ rounds: 4, label: '3 rounds' }), 4);
    assert.equal(secRounds({ label: 'Circuit, 3 rounds' }), 3);
    assert.equal(secRounds({ label: 'Accessory', items: [{ detail: '4×8' }, { detail: '2×12' }, { detail: '30 s' }] }), 2);
    assert.equal(secRounds({ label: 'Mobility', items: [{ detail: '30 s' }] }), null);
    assert.equal(secRounds(undefined), null);
  });

  test('the session\'s minutes, to the nearest five', () => {
    const lift: ReadDay = {
      sections: [
        { label: 'Main Lift', items: [{ name: 'Back Squat', detail: '4×5' }] },
        { label: 'Accessory', items: [{ name: 'Farmer Carry', detail: '3×40 m' }, { name: 'Side Plank', detail: '2×30 s' }] },
      ],
    };
    // 8 to warm up, 4 main sets at 3.2, 3 carries at 1.2, 2 planks at 1.0: 26.4, so 25.
    assert.equal(sessionTimeEst(lift), 25);
    // Three main sets alone: 8 + 9.6 = 17.6, so 20. (At three minutes a set it would be 17, so 15.)
    assert.equal(sessionTimeEst({ sections: [{ label: 'Main Lift', items: [{ name: 'Back Squat', detail: '3×5' }] }] }), 20);
    // The same with 30 minutes of running and 4 to change over: 60.4, so 60.
    assert.equal(sessionTimeEst({ ...lift, cardio: { detail: '30 min easy' } }), 60);
    // A run alone, 3 miles at 9:30 a mile: 8 + 28.5 + 4 = 40.5, so 40.
    assert.equal(sessionTimeEst({ cardio: { detail: '3 mi at 9:30 /mi' } }), 40);
    // Miles with no pace count ten minutes each: 8 + 30 + 4 = 42, so 40. No figure at all counts twenty: 32, so 30.
    assert.equal(sessionTimeEst({ cardio: { detail: '3 mi easy' } }), 40);
    assert.equal(sessionTimeEst({ cardio: { detail: 'Easy spin' } }), 30);
    // A superset's sets at 1.4, an item with no count taking its section's rounds: 8 + 3 × 1.4 + 3 × 1.4 = 16.4, so 15.
    assert.equal(sessionTimeEst({ sections: [{ label: 'Superset, 3 rounds', items: [{ name: 'Row', detail: '10 reps' }, { name: 'Push Up', detail: '12 reps' }] }] }), 15);
    assert.equal(sessionTimeEst({}), 10, 'the warm up alone, 8, rounds to 10');
  });

  test('the lift\'s summary is its first movement and how many more, then the cardio\'s line', () => {
    const sections = [{ items: [{ name: 'Back Squat' }, { name: 'Split Squat' }] }, { items: [{ name: 'Plank' }] }];
    assert.equal(heroSummary({ sections }), 'Back Squat + 2 more');
    assert.equal(heroSummary({ sections: [{ items: [{ name: 'Back Squat' }] }] }), 'Back Squat');
    assert.equal(heroSummary({ sections, cardio: { type: 'run', subtype: 'Recovery Run', detail: '45 min easy\nsecond line' } }), 'Back Squat + 2 more<br>45 min Recovery Run');
    // Minutes are read before miles, and "min" is never read as "mi" (V146).
    assert.equal(heroSummary({ cardio: { type: 'bike', detail: '72 min continuous' } }), '72 min bike');
    assert.equal(heroSummary({ cardio: { type: 'run', detail: '3.1 mile run' } }), '3.1 mi run');
    assert.equal(heroSummary({ cardio: { type: 'bike', subtype: 'long_ride', detail: 'Easy spin' } }), 'long ride bike');
    assert.equal(heroSummary({ cardio: { detail: '' } }), 'cardio');
    assert.equal(heroSummary({}), '');
  });
});

describe('native This Week: the rest day', () => {
  test('one line per sport that holds a time or a distance, the distance after the time, the RPE last (D229)', () => {
    assert.deepStrictEqual(restLogLines({ run: { mins: 37, rpe: 7 } }), ['37 min run logged · RPE 7']);
    assert.deepStrictEqual(restLogLines({ run: { mins: '37.4', dist: '3.1', rpe: 7 } }), ['37 min run logged · 3.1 mi · RPE 7']);
    assert.deepStrictEqual(restLogLines({ bike: { dist: 12 } }), ['12 mi ride logged · RPE —']);
    assert.deepStrictEqual(restLogLines({ swim: { mins: 15, dist: 800, rpe: 5 }, row: { dist: 2000, rpe: 6 } }), ['15 min swim logged · 800 yd · RPE 5', '2000 m row logged · RPE 6']);
    assert.deepStrictEqual(restLogLines({ walk: { mins: 20 } }), ['20 min walk logged · RPE —']);
    assert.deepStrictEqual(restLogLines({ walk: { dist: 2 }, run: null }), [], 'a walk carries no distance, and an empty record no line');
    assert.deepStrictEqual(restLogLines(null), []);
  });

  test('the tip turns with the day: a stretch one day, fuel the next, each list in order', () => {
    const DAY = 86400000;
    const first = restDayTip(0);
    assert.deepStrictEqual(first, {
      label: 'Mobility · rest-day stretch',
      text: 'Strength and flexibility are interdependent — every muscle you train hard should get stretched, and the reverse holds too.',
      src: 'NSW Physical Fitness Guide',
    });
    assert.deepStrictEqual(restDayTip(DAY), {
      label: 'Fuel · recovery nutrition',
      text: 'Carbohydrate refills the muscle glycogen you burned — make it the backbone of recovery-day meals.',
      src: 'NSW Physical Fitness Guide',
    });
    assert.equal(restDayTip(DAY - 1).text, first.text, 'the whole day reads one tip');
    assert.notEqual(restDayTip(2 * DAY).text, first.text, 'the next stretch day reads the next stretch tip');
    assert.equal(restDayTip(40 * DAY).text, first.text, 'twenty stretch tips, so the first comes round on the fortieth day');
  });
});

describe('native This Week: the Wildcard and the streak', () => {
  // Week 1 of a program that starts Monday 2026-08-31: Monday to Thursday train, the rest rest.
  const train = { title: 'Session', sections: [] };
  const prog: ReadProgram = {
    startDate: '2026-08-31', totalWeeks: 1,
    weeks: { 1: { mon: train, tue: train, wed: train, thu: train, fri: { rest: true }, sat: { rest: true }, sun: { rest: true } } },
  };
  const store = (wild: unknown[]): StateStore => memoryStore({
    ia_comp_p1: JSON.stringify({ w1_mon: { status: 'complete' }, w1_tue: { status: 'skipped' }, w1_wed: { status: 'partial' } }),
    ia_wild_p1: JSON.stringify(wild),
  });

  test('a Wildcard stands in the day it was done in', () => {
    const s = store([{ week: 1, dayKey: 'tue', name: 'Wildcard' }]);
    assert.deepStrictEqual(wildcardOn(s, 'p1', 1, 'tue'), { week: 1, dayKey: 'tue', name: 'Wildcard' });
    assert.equal(wildcardOn(s, 'p1', 1, 'wed'), null);
    assert.equal(wildcardOn(s, 'p1', 1, null), null);
    assert.equal(wildcardOn(s, 'another', 1, 'tue'), null, 'another program\'s Wildcards are its own');
  });

  test('the scheduled days are the training days up to the cutoff, oldest first', () => {
    assert.deepStrictEqual(scheduledDays(prog, day(2026, 9, 2)).map((x) => x.d + ' ' + iso(x.date)), ['mon 2026-08-31', 'tue 2026-09-01', 'wed 2026-09-02']);
    assert.equal(scheduledDays(prog).length, 4);
    assert.deepStrictEqual(scheduledDays({ totalWeeks: 1 }), []);
  });

  test('the streak counts done days back from today, a pending day passed over, a skip ending it (V195 D71)', () => {
    // Thursday: pending, passed over. Wednesday partial counts. Tuesday skipped ends it. One.
    assert.equal(computeStreak(store([]), prog, 'p1', day(2026, 9, 3)), 1);
  });

  test('a Wildcard rescues a skipped day, so the streak runs on through it (V195 D71b)', () => {
    assert.equal(computeStreak(store([{ week: 1, dayKey: 'tue' }]), prog, 'p1', day(2026, 9, 3)), 3);
  });

  test('the words under WILDCARD DONE', () => {
    assert.equal(wildcardSub({ week: 1 }, { rest: true }), 'Rest day. The streak sits this one out.');
    assert.equal(wildcardSub({ week: 1 }, { title: 'Leg Strength' }), 'Leg Strength is still on the board.');
    assert.equal(wildcardSub({ week: 1 }, null), 'Your session is still on the board.');
    assert.equal(wildcardSub(null, { title: 'Leg Strength' }), null);
  });
});

describe('native This Week: what React Native draws from the model', () => {
  test('the phase pill\'s markup splits into its icon and its plain words', () => {
    const svg = '<svg width="13" height="13" viewBox="0 0 24 24"><path d="M5 21V4"/></svg>';
    assert.deepStrictEqual(pillParts(svg + ' Race Week'), { icon: svg, text: 'Race Week' });
    assert.deepStrictEqual(pillParts('Phase 3 — Peak'), { icon: null, text: 'Phase 3 — Peak' });
    assert.deepStrictEqual(pillParts('Injury Week · Foot &amp; Ankle'), { icon: null, text: 'Injury Week · Foot & Ankle' });
    assert.deepStrictEqual(pillParts('↓ Recovery Week'), { icon: null, text: '↓ Recovery Week' });
    assert.deepStrictEqual(pillParts(''), { icon: null, text: '' });
  });

  test('a colour the model names as the web does reads as its token', () => {
    assert.equal(tokenOf('var(--run)'), 'run');
    assert.equal(tokenOf('var(--signal)'), 'signal');
    assert.equal(tokenOf('var(--dim)'), 'dim');
    assert.equal(tokenOf('#ff0000'), 'dim');
  });
});

describe('native This Week: the screen from a store', () => {
  // Two weeks from Monday 2026-11-09: Monday lifts, Wednesday runs, Friday lifts, the rest rest. Today is Friday the 13th.
  const week = {
    mon: { title: 'Upper Body', sections: [{ label: 'Main Lift', items: [{ name: 'Bench Press', detail: '4×5' }] }] },
    tue: { rest: true },
    wed: { title: 'Easy Run', sections: [], cardio: { type: 'run', subtype: 'Easy Run', detail: '30 min easy.', dose: { k: 'time', mins: 30, tgt: 600 } } },
    thu: { rest: true },
    fri: { title: 'Leg Strength', sections: [{ label: 'Main Lift', items: [{ name: 'Back Squat', detail: '4×5' }, { name: 'Split Squat', detail: '3×8' }] }] },
    sat: { rest: true },
    sun: { rest: true },
  };
  const program = { id: 'p1', name: 'TEST PLAN', totalWeeks: 2, startDate: '2026-11-09', weeks: { 1: week, 2: week } };
  const keys = { ia_active: 'p1', ia_programs: JSON.stringify([program]), ia_comp_p1: JSON.stringify({ w1_mon: { status: 'complete' } }) };
  const now = new Date(2026, 10, 13, 22, 0, 0);

  /** A store that reads and refuses every write, so a draw that wrote anything would throw. */
  const readOnly = (): StateStore => {
    const m = memoryStore(keys);
    return { get: (k) => m.get(k), keys: () => m.keys(), set: () => { throw new Error('the screen wrote a key'); }, remove: () => { throw new Error('the screen removed a key'); } };
  };

  test('the active program is the one the store names', () => {
    assert.deepStrictEqual(liveProgram(readOnly()), program as unknown as ScreenProgram);
  });

  test('the launch draws the week holding today, today picked, and writes nothing', () => {
    const s = weekScreen(readOnly(), now, { shown: null, picked: null }, true)!;
    assert.equal(s.shown, 1);
    assert.equal(s.totalWeeks, 2);
    assert.equal(s.programId, 'p1');
    const v = s.view;
    assert.equal(v.overline, 'TEST PLAN');
    assert.deepStrictEqual(v.titles, [{ n: 1, title: 'Week 1', active: true }, { n: 2, title: 'Week 2', active: false }, { n: 3, title: 'Last day', active: false }]);
    assert.deepStrictEqual(v.row, { kind: 'start', shown: 'Nov 9, 2026', iso: '2026-11-09' });
    assert.deepStrictEqual(v.pill, { html: 'Phase 1 — Rebuild', cls: '' });
    assert.deepStrictEqual(v.hurt, { injured: false, label: 'Hurt?' });
    const d = v.days!;
    // Sunday first: the Sunday before week 1 is no program day; then the 9th to the 14th.
    assert.deepStrictEqual(d.strip.map((c) => c.letter + c.num + (c.empty ? ' empty' : ' ' + c.word + ' ' + c.mark)), [
      'S8 empty', 'M9 UPPER check', 'T10 REST num', 'W11 EASY num', 'T12 REST num', 'F13 LEGS num', 'S14 REST num',
    ]);
    assert.equal(d.picked, 5);
    assert.deepStrictEqual(d.cards, [{
      kind: 'lift', week: 1, key: 'fri', first: true,
      label: 'Today · Friday', title: 'Leg Strength',
      // 8 to warm up and 7 main sets at 3.2: 30.4, so 30.
      meta: '~30 min', blurb: 'Back Squat + 1 more',
      button: { text: 'Start session', act: 'deck', glow: true, sunk: false },
      done: null,
      skip: { label: 'Skip lift', on: false },
    }]);
    assert.equal(d.rest, null);
    // Three training days in the strip, Monday done; no miles logged; Monday the one day of the streak.
    assert.deepStrictEqual(d.stats, { done: 1, of: 3, miles: 0, streak: 1 });
  });

  test('a picked run day draws the run card, Record run on the phone and the hand log without the recorder', () => {
    const run = weekScreen(readOnly(), now, { shown: 1, picked: 3 }, true)!.view.days!.cards;
    assert.deepStrictEqual(run, [{
      kind: 'run', week: 1, key: 'wed', first: true,
      label: 'Wednesday, Nov 11', title: 'Easy Run', meta: '30 min · 10:00/mi', blurb: '30 min easy.',
      button: { text: 'Record run', act: 'record', glow: true, sunk: false },
      done: null,
      skip: { label: 'Skip run', on: false },
    }]);
    assert.deepStrictEqual(weekScreen(readOnly(), now, { shown: 1, picked: 3 }, false)!.view.days!.cards[0]!.button, { text: 'Log the run', act: 'log', glow: true, sunk: false });
  });

  test('a done day draws its done row and no button; a rest day its rest card', () => {
    const mon = weekScreen(readOnly(), now, { shown: 1, picked: 1 }, true)!.view.days!;
    assert.deepStrictEqual(mon.cards[0]!.done, { title: 'Upper Body', line: 'Closed out' });
    assert.equal(mon.cards[0]!.button, null);
    assert.equal(mon.cards[0]!.skip, null);
    const tue = weekScreen(readOnly(), now, { shown: 1, picked: 2 }, true)!.view.days!;
    assert.deepStrictEqual(tue.rest, { week: 1, key: 'tue', when: 'Tuesday, Nov 10', lines: [], logLabel: 'Log cardio', anyway: true });
    assert.deepStrictEqual(tue.cards, []);
  });

  test('the last title is past the program: its Sunday is the last week\'s, and a title out of range is brought back in', () => {
    const last = weekScreen(readOnly(), now, { shown: 99, picked: null }, true)!;
    assert.equal(last.shown, 3);
    assert.deepStrictEqual(last.view.days!.strip.map((c) => (c.empty ? '-' : c.key)), ['sun', '-', '-', '-', '-', '-', '-']);
    assert.equal(weekScreen(readOnly(), now, { shown: -4, picked: null }, true)!.shown, 1);
  });

  test('before any program the screen is the Angular screen\'s blank', () => {
    assert.equal(weekScreen(memoryStore(), now, { shown: null, picked: null }, true), null);
    assert.deepStrictEqual(BLANK.titles, [{ n: 1, title: 'Week 1', active: true }]);
    assert.deepStrictEqual(BLANK.row, { kind: 'start', shown: null, iso: '' });
    assert.equal(BLANK.days, null);
    assert.equal(BLANK.hurt.label, 'Hurt?');
  });
});
