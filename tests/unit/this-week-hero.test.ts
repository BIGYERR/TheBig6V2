// This Week's redesign (D276 P-WEEKSCREEN, docs/decisions/this-week.md) and D272's run and lift cards
// (docs/decisions/gps-recording.md): the screen's own logic, apart from the app. Every expected value is typed by hand:
// the week titles and the day words from the ruling, the dates by calendar arithmetic from HALF_MANNY's Monday start
// (2026-08-31, so week 10 opens Mon Nov 2 and the race is Sun Dec 6), the card words from the engine's own session text
// quoted below, and the grow out of the card from P-DECK call 16's numbers (168 ms lift, 420 ms open, 357 ms close).
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import {
  cardioLogged, clock, columnDate, columnDay, dayWord, liftGoesFirst, liftSummary, liveTitle, raceRow, runBlurb, runLine, runMeta, runName,
  weekTitles, whenText, type WeekDay,
} from '../../frontends/app/src/app/screens/week-view/week-view-model.ts';
import { growFx } from '../../frontends/app/src/app/screens/deck/grow-motion.ts';

const MON = new Date(2026, 7, 31);
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const iso = (d: Date | null) => (d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : null);
/** The legacy helpers dayWord leans on, standing in with names that say what they were given. */
const words = { liftFocus: (t: string | undefined) => 'FOCUS(' + t + ')', runChip: (s: string, k: string | undefined, t: string | undefined) => 'CHIP(' + s + '|' + k + '|' + t + ')' };
const run = (subtype: string, title = 'Strength Support'): WeekDay => ({ title, cardio: { type: 'run', subtype } });

describe('the week titles', () => {
  test('Week 1 to the last week, then Race Day on a race plan and Last day on any other', () => {
    assert.deepEqual(weekTitles(14, true), ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Race Day']);
    assert.deepEqual(weekTitles(6, false), ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Last day']);
  });

  test('the title holding today runs Sunday first: a program week\'s Sunday sits in the next title', () => {
    assert.equal(liveTitle(MON, day(2026, 11, 2), 14, 10), 10, 'Monday of week 10');
    assert.equal(liveTitle(MON, day(2026, 11, 7), 14, 10), 10, 'Saturday of week 10');
    assert.equal(liveTitle(MON, day(2026, 11, 8), 14, 10), 11, 'Sunday of week 10 opens title 11');
    assert.equal(liveTitle(MON, day(2026, 8, 30), 14, 1), 1, 'the Sunday before the program is title 1');
    assert.equal(liveTitle(MON, day(2026, 8, 20), 14, 1), 1, 'before the program, title 1');
    assert.equal(liveTitle(MON, day(2026, 12, 6), 14, 14), 15, 'race day is the Race Day title');
    assert.equal(liveTitle(MON, day(2026, 12, 20), 14, 14), 15, 'past the program, the last title');
    assert.equal(liveTitle(null, day(2026, 11, 8), 14, 5), 5, 'no start date, no dates: the program\'s own count');
  });

  test('a title\'s Sunday is the week before\'s, its Monday to Saturday its own; week 1\'s Sunday and the last title\'s weekdays are empty', () => {
    assert.deepEqual(columnDay(11, 0, 14), { week: 10, key: 'sun' });
    assert.deepEqual(columnDay(11, 4, 14), { week: 11, key: 'thu' });
    assert.equal(columnDay(1, 0, 14), null);
    assert.deepEqual(columnDay(15, 0, 14), { week: 14, key: 'sun' });
    assert.equal(columnDay(15, 1, 14), null);
    assert.deepEqual([0, 1, 6].map((c) => iso(columnDate(MON, 11, c))), ['2026-11-08', '2026-11-09', '2026-11-14']);
    assert.equal(iso(columnDate(MON, 15, 0)), '2026-12-06');
    assert.equal(columnDate(null, 11, 0), null);
  });
});

describe('the day strip\'s one word', () => {
  test('a run day wears its run\'s word: SPEED, RECOV, LONG, SHAKE, RACE, and WALK for an incline walk', () => {
    assert.equal(dayWord(run('Speed Run — Intervals', 'Posterior Chain'), words), 'SPEED');
    assert.equal(dayWord(run('Recovery Run'), words), 'RECOV');
    assert.equal(dayWord(run('Recovery Run', 'Shakeout'), words), 'SHAKE');
    assert.equal(dayWord(run('Long Run — Peak', 'Post-Run Mobility'), words), 'LONG');
    assert.equal(dayWord(run('Long Run — RACE DAY', 'Race Day'), words), 'RACE');
    assert.equal(dayWord(run('Incline Walk'), words), 'WALK');
  });

  test('a test plan\'s run keeps the strip\'s chip, a ride and a swim their sport', () => {
    assert.equal(dayWord({ title: 'Push', cardio: { type: 'run', subtype: 'Short Interval (SI)', dose: { key: 'int' } } }, words), 'CHIP(Short Interval (SI)|int|run)');
    assert.equal(dayWord({ title: 'Legs', cardio: { type: 'bike', subtype: 'Sweet Spot (CHI)' } }, words), 'BIKE');
    assert.equal(dayWord({ title: 'Legs', cardio: { type: 'swim', subtype: 'Long Slow Distance (LSD)' } }, words), 'SWIM');
  });

  test('a lift only day wears its focus, Posterior Chain HINGE and Recovery Lift LIGHT, never a title cut at five letters', () => {
    assert.equal(dayWord({ title: 'Posterior Chain' }, words), 'HINGE');
    assert.equal(dayWord({ title: 'Recovery Lift' }, words), 'LIGHT');
    assert.equal(dayWord({ title: 'Leg Strength + Mobility' }, words), 'FOCUS(Leg Strength + Mobility)');
    assert.equal(dayWord({ rest: true }, words), 'REST');
    assert.equal(dayWord(undefined, words), 'REST');
  });
});

describe('the run card\'s words, from the engine\'s own session', () => {
  // HALF_MANNY week 11, as the engine writes it (v0.257.0).
  const SPEED = { type: 'run', subtype: 'Speed Run — Intervals', detail: '5 × 5:00 at 10K Pace — 25:00 of work\n5:00 warm up\n5 × 5:00 at 10K Pace (11:35/mi)\n2:00 easy recovery between efforts',
    note: 'INTERVALS: Hard efforts, easy running between. Each pace is the middle of a range. Slightly faster or slower is fine, you are not a robot.' };
  const RECOVERY = { type: 'run', subtype: 'Recovery Run', dose: { k: 'time', mins: 15, tgt: 800, cap: 760 },
    detail: '15 min recovery run at Recovery Pace (13:20/mi). 4–5/10 effort, easy enough to talk, laugh, or argue freely. Start a touch slower than that, finish a touch faster. Do not run faster than 12:40/mi.',
    note: 'RECOVERY RUN: Just as important as the hard days. This is where your body absorbs the training.' };
  const LONG = { type: 'run', subtype: 'Long Run — Peak', dose: { k: 'dist', mi: 12.5, tgt: 800, cap: 760 },
    detail: '20K Run: 12.5 mile run, run as a progression. Start slower than Recovery Pace, finish faster than it, and average Recovery Pace (13:20/mi) across the run. Comfortable the whole way. Average no faster than 12:40/mi.',
    note: 'PEAK LONG RUN: Your longest run of the plan. Run it easy and patient.' };
  const RACE = { type: 'run', subtype: 'Long Run — RACE DAY', dose: { k: 'dist', mi: 13.1, tgt: 730 },
    detail: '13.1 miles. Half Marathon race day. Target pace 12:10/mi. Trust your training, start controlled, finish strong.',
    note: 'RACE DAY: This is what every week built toward. Hold your goal pace, fuel early and often, and run your own race.' };

  test('the name: the session\'s own, the race as Race Day, the shakeout as a Shakeout Run', () => {
    assert.equal(runName({ title: 'Posterior Chain', cardio: SPEED }), 'Speed Run');
    assert.equal(runName({ title: 'Strength Support', cardio: RECOVERY }), 'Recovery Run');
    assert.equal(runName({ title: 'Shakeout', cardio: RECOVERY }), 'Shakeout Run');
    assert.equal(runName({ title: 'Post-Run Mobility', cardio: LONG }), 'Long Run');
    assert.equal(runName({ title: 'Race Day', cardio: RACE }), 'Race Day');
    assert.equal(runName({ title: 'Legs', cardio: { type: 'bike' } }), 'Ride');
  });

  test('the meta line: its kind, its dose or the work of a speed session, and its target pace (800 s is 13:20, 730 s 12:10)', () => {
    assert.equal(runMeta(SPEED), 'Intervals · 25:00 of work');
    assert.equal(runMeta(RECOVERY), '15 min · 13:20/mi');
    assert.equal(runMeta(LONG), 'Peak · 12.5 mi · 13:20/mi');
    assert.equal(runMeta(RACE), '13.1 mi · 12:10/mi');
    assert.equal(clock(800), '13:20');
    assert.equal(clock(6384), '1:46:24');
  });

  test('the coaching line: the note\'s first sentence without its label, then the ceiling the session names', () => {
    assert.equal(runBlurb(SPEED), 'Hard efforts, easy running between.');
    assert.equal(runBlurb(RECOVERY), 'Just as important as the hard days. Do not run faster than 12:40/mi.');
    assert.equal(runBlurb(LONG), 'Your longest run of the plan. Average no faster than 12:40/mi.');
    assert.equal(runBlurb(RACE), 'This is what every week built toward.');
    assert.equal(runBlurb({ detail: 'Easy run. Keep it conversational.' }), 'Easy run.');
  });

  test('a logged run counts only for the sport it is credited to, and reads its miles, time and pace', () => {
    assert.equal(cardioLogged({ run_dist: '3.1' }, 'run'), true);
    assert.equal(cardioLogged({ run_dist: '', run_mins: '0' }, 'run'), false);
    assert.equal(cardioLogged({ bike_mins: '40' }, 'bike'), true);
    assert.equal(cardioLogged({ run_dist: '3', swapTo: 'bike' }, 'run'), false, 'D213: a swap to the bike credits the bike');
    assert.equal(cardioLogged(null, 'run'), false);
    // 106.4 min is 6,384 s, 1:46:24.
    assert.equal(runLine({ run_dist: '8', run_mins: '106.4', run_pace: '13:18' }), '8 mi · 1:46:24 · 13:18/mi');
    assert.equal(runLine({ run_dist: '3.104' }), '3.1 mi');
  });
});

describe('the rest of the card', () => {
  test('the when line: today, tomorrow and yesterday by name, else the day and its date', () => {
    const thu = day(2026, 11, 12);
    assert.equal(whenText(day(2026, 11, 12), thu, 'Thursday', 11), 'Today · Thursday');
    assert.equal(whenText(day(2026, 11, 13), thu, 'Friday', 11), 'Tomorrow · Friday');
    assert.equal(whenText(day(2026, 11, 11), thu, 'Wednesday', 11), 'Yesterday · Wednesday');
    assert.equal(whenText(day(2026, 11, 20), thu, 'Friday', 12), 'Friday, Nov 20');
    assert.equal(whenText(null, thu, 'Friday', 3), 'Week 3 · Friday');
  });

  test('the race row counts the days to the race and says so on the day and after', () => {
    assert.deepEqual(raceRow(28, 'Sun, Dec 6'), { big: '28 days out', small: 'Race day Sun, Dec 6' });
    assert.deepEqual(raceRow(1, 'Sun, Dec 6'), { big: '1 day out', small: 'Race day Sun, Dec 6' });
    assert.deepEqual(raceRow(0, 'Sun, Dec 6'), { big: 'Race day today', small: 'Sun, Dec 6' });
    assert.deepEqual(raceRow(-3, 'Sun, Dec 6'), { big: 'Raced', small: 'Sun, Dec 6' });
  });

  test('the lift card\'s line is the legacy summary\'s first line; lifting goes first only when it is the program\'s priority', () => {
    assert.equal(liftSummary('Barbell Romanian deadlift + 4 more<br>Speed Run — Intervals run'), 'Barbell Romanian deadlift + 4 more');
    assert.equal(liftGoesFirst({ name: 'x', weeks: {}, primaryPath: 'event', liftingFocus: 'strength' }), false);
    assert.equal(liftGoesFirst({ name: 'x', weeks: {}, primaryPath: 'fitness', liftingFocus: 'support_prevention' }), false);
    assert.equal(liftGoesFirst({ name: 'x', weeks: {}, primaryPath: 'fitness', liftingFocus: 'strength' }), true);
  });

  test('Record run grows the recorder out of the run card with the deck\'s numbers (D272 Amendment 2, P-DECK call 16)', () => {
    // A card 358 px wide at (16, 300), 200 px tall, on a 390 by 844 screen: 16 px to its right, 344 px below it.
    const box = { t: 300, l: 16, w: 358, h: 200 };
    const lift = growFx('lift', box, 390, 844);
    assert.match(lift.frame, /inset\(290\.0px 8\.0px 334\.0px 8\.0px round 28px\)/, 'lifted 10 px at top and bottom, 8 px at each side, corners 28 px');
    assert.match(lift.frame, /168ms/);
    assert.match(lift.scrim, /opacity:\.3/);
    const open = growFx('in', box, 390, 844);
    assert.match(open.frame, /inset\(0px 0px 0px 0px round 0px\).*420ms cubic-bezier\(\.05,\.7,\.1,1\)/);
    assert.match(open.week, /scale\(\.96\)/);
    const close = growFx('out', box, 390, 844);
    assert.match(close.frame, /inset\(300\.0px 16\.0px 344\.0px 16\.0px round 24px\).*357ms/);
    assert.equal(growFx('open', box, 390, 844).ghost, 'display:none');
    assert.equal(growFx('pre', null, 390, 844).frame, 'clip-path:none;-webkit-clip-path:none;background-color:var(--bg)', 'reduced motion and no card: no clip');
  });
});
