// The wizard and Generate in the Expo app against today's page, wide (MIGRATION.md phase 3, row 6, both sessions).
// support/native-wizard.ts holds the two apps equal after every tap; here it runs over the ten seeded programs, each
// generated on an empty phone and beside a program with three weeks of history, set whole and with its goals made by
// taps; over the cardio goals by taps (every goal of both paths at each level, every field typed into, the race day
// from behind today to thirty weeks out, the seed offer, the pace reach, a dated test); and over the drafts that draw
// every kind a step holds: every set of rest days under each goal and focus, the start date over two weeks under each
// kind of goal, race plans from behind to weeks ahead, and each refusal. The floors at the end say what was drawn,
// kind by kind, so a walk that stops drawing a kind fails here.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { PROGRAMS } from '../support/programs.ts';
import { runsLife } from '../support/native-progress.ts';
import { Phone, life } from '../support/stored-state.ts';
import { twinAt } from '../support/native-program-list.ts';
import {
  TwoWizards, type WizardTally, addOnThenRaceWalk, day, draftOf, fillOf, goalToGenerate, goalsWalk, hybridWalk, raceWalk, reachWalk, refusedWalk, sameDayReaders, seedWalk, seededGoalsWalk, strengthWalk, testWeekWalk,
  wholeWalk, wizardTally,
} from '../support/native-wizard.ts';

const NOW = '2026-08-29T09:00:00';   // a Saturday
const TODAY = NOW.slice(0, 10);
const fresh = (at = NOW): Phone => { const P = new Phone().launch(at); P.settle(); return P; };
/** The swim 500 config carries no timed 500, which the wizard has required since it asked for one (MIGRATION.md): the sweep gives it one. */
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const NAMES = Object.keys(PROGRAMS);
const CFGS = Object.values(PROGRAMS).map(walkable);
const ALL = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const GOALS: Record<string, [string, string][]> = {
  run: [['run_5k', 'Run a 5K'], ['run_10k', 'Run a 10K'], ['run_half', 'Half Marathon'], ['run_marathon', 'Full Marathon'], ['run_pace_goal', 'Hit a Pace / Time Goal'], ['run_base', 'Build Running Base']],
  bike: [['bike_century', 'Century Ride (100mi)'], ['bike_50', '50-Mile Ride'], ['bike_ftp', 'Improve FTP / Power'], ['bike_cals', 'Hit Calorie Targets'], ['bike_base', 'Build Cycling Base']],
  swim: [['swim_tri', 'Triathlon Swim'], ['swim_mile', 'Swim a Mile'], ['swim_100_time', 'Improve 100 Time'], ['swim_500_time', 'Improve 500 Time'], ['swim_base', 'Build Swim Base']],
};
const HYB = new Set(['run_half', 'run_marathon', 'bike_century', 'swim_tri']);
const goal = (id: string, more: object = {}): object => {
  const label = Object.values(GOALS).flat().find((g) => g[0] === id)![1];
  return { id, label, baseline: '', ...more };
};
const T: WizardTally = wizardTally();
const floor = (k: string, n: number): void => assert.ok((T[k] || 0) >= n, k + ': ' + (T[k] || 0) + ' drawn, at least ' + n + ' looked for');

describe('the Expo app\'s wizard on the ten seeded programs', () => {
  test.each(NAMES.map((n, i) => [n, i] as const))('%s: every step, and the program generated on an empty phone equal to today\'s, grid and all', (name, i) => {
    const g = wholeWalk(fresh(), CFGS[i], T, name, i % 2 === 0);
    assert.equal(g.refused, null);
    assert.ok((g.prog.totalWeeks || 0) >= 6);
  });
  test.each(NAMES.map((n, i) => [n, i] as const))('%s: generated as a second program beside three weeks of history, a day later', (name, i) => {
    const P = twinAt(life(CFGS[i], NOW).phone, 1); P.settle();
    const before = P.dump();
    const g = wholeWalk(P, { ...CFGS[i], name: 'Second' }, T, name + ', a second program', false);
    const after = P.dump();
    const changed = Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]).sort();
    assert.deepEqual(changed, ['ia_active', 'ia_programs'], 'Generate writes the list and the active program, and no other key');
    const list = JSON.parse(after['ia_programs']!) as { id: string; name: string }[];
    assert.deepEqual([list.length, list[1]!.name, after['ia_active']], [2, 'Second', g.id]);
    assert.equal(JSON.stringify(list[0]), JSON.stringify(JSON.parse(before['ia_programs']!)[0]), 'the first program is as it was');
  });
});

describe('the Expo app\'s wizard by taps alone', () => {
  test('every walk on an empty phone', () => {
    strengthWalk(fresh(), T, 'an empty phone');
    raceWalk(fresh(), T, 'an empty phone');
    hybridWalk(fresh(), T, 'an empty phone');
    addOnThenRaceWalk(fresh(), T, 'an empty phone');
  });
  test('every walk beside a program with three weeks of history', () => {
    const P = life(CFGS[0], NOW).phone;
    for (const w of [strengthWalk, raceWalk, hybridWalk]) { const Q = twinAt(P, 1); Q.settle(); w(Q, T, 'a walked phone'); }
  });
  test('the walks on each day of a week: the start resolves from a Monday through a Sunday', () => {
    for (let n = 2; n < 9; n++) { strengthWalk(fresh(day(TODAY, n) + 'T07:30:00'), T, 'the day ' + day(TODAY, n)); raceWalk(fresh(day(TODAY, n) + 'T21:15:00'), T, 'the day ' + day(TODAY, n)); }
  });
});

describe('the Expo app\'s wizard on drafts set whole', () => {
  test('the rest days: every set of them under each goal and each focus, and a tap on every training day', () => {
    const two = new TwoWizards(fresh(), T, 'the rest days');
    two.open();
    const sets: object[] = [{ primaryPath: 'body', cardioTypes: [], cardioGoals: {} }, { primaryPath: 'body', cardioTypes: ['run', 'swim'], cardioGoals: {} }];
    for (const path of ['event', 'both']) {
      for (const s of ['run', 'bike', 'swim']) for (const [id] of GOALS[s]!) if (!(path === 'both' && HYB.has(id))) sets.push({ primaryPath: path, cardioTypes: [s], cardioGoals: { [s]: goal(id) } });
      sets.push({ primaryPath: path, cardioTypes: ['run', 'bike'], cardioGoals: { run: goal('run_pace_goal'), bike: goal('bike_ftp') } });
      sets.push({ primaryPath: path, cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: goal('run_10k'), bike: goal('bike_ftp'), swim: goal('swim_100_time') } });
    }
    for (const s of sets as { primaryPath: string }[]) {
      const foci = s.primaryPath === 'event' ? ['support_strength', 'support_athletic', 'support_prevention'] : ['strength', 'hypertrophy', 'fatloss', 'balanced'];
      for (const focus of foci) for (let m = 0; m < 128; m++) {
        const rest = ALL.filter((_, i) => m & (1 << i));
        const d = draftOf(two, { ...s, liftingFocus: focus, restDays: rest, days: ALL.filter((x) => !rest.includes(x)) });
        two.whole(d, 'days');
        sameDayReaders(two, 'the rest days');
        // A tap on each training day of every seventh set (each rests the day or answers with the toast), then the draft again.
        if (focus === foci[0] && m % 7 === 0) for (const x of ALL) if (!rest.includes(x)) { two.day(x); two.whole(d, 'days'); }
      }
    }
  });
  test('the name step: the start date over two weeks under each set of rest days and each kind of goal, and its repaint', () => {
    const two = new TwoWizards(fresh(), T, 'the name step');
    two.open();
    const RESTS = [[], ['sun'], ['sat', 'sun'], ['fri', 'sat', 'sun'], ['mon', 'wed'], ['thu', 'fri', 'sat', 'sun']];
    const pace = goal('run_pace_goal', { targetDist: '1.5', targetMins: '14', targetSecs: '0', paceUnit: 'mi', mileBestMins: '8', mileBestSecs: '0' });
    for (const rest of RESTS) for (let n = 0; n < 14; n++) {
      const start = day(TODAY, n);
      two.whole(draftOf(two, { restDays: rest, startDate: start, name: 'X' }), 'name');
      two.whole(draftOf(two, { primaryPath: 'event', eventTargeted: false, raceDate: '', restDays: rest, startDate: start, name: 'X', liftingFocus: 'support_strength', cardioTypes: ['run'], cardioGoals: { run: goal('run_base') } }), 'name');
      for (const off of [1, 8, 30, 70]) two.whole(draftOf(two, { primaryPath: 'event', eventTargeted: true, raceDate: day(start, off), restDays: rest, startDate: start, name: 'X', liftingFocus: 'support_strength', cardioTypes: ['run'], cardioGoals: { run: pace } }), 'name');
      // The calendar's picks on a lift only draft: a day, then blank.
      two.whole(draftOf(two, { restDays: rest, startDate: TODAY, name: 'X' }), 'name');
      two.start(start); two.start('');
    }
    for (const path of ['event', 'both']) for (const id of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) {
      if (path === 'both' && HYB.has(id)) continue;
      const base = { primaryPath: path, name: 'X', liftingFocus: path === 'event' ? 'support_strength' : 'balanced', cardioTypes: ['run'], cardioGoals: { run: goal(id, { mileBestMins: '8', mileBestSecs: '0' }) } };
      for (const off of [-3, 0, 1, 3, 8, 10, 28, 35, 49, 56, 63, 77, 84, 100, 112, 119, 126, 140, 160, 210]) two.whole(draftOf(two, { ...base, eventTargeted: true, raceDate: day(TODAY, off) }), 'name');
      two.whole(draftOf(two, { ...base, eventTargeted: true }), 'name');
      two.whole(draftOf(two, { ...base, eventTargeted: false, raceDate: '' }), 'name');
    }
    two.whole(draftOf(two, { name: '' }), 'name');
    two.whole(draftOf(two, { name: 'X', primaryPath: 'both', cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: goal('run_base'), bike: goal('bike_base'), swim: goal('swim_base') } }), 'name');
  });
  test('the small steps at each of their answers, and the cardio goals with every set of sports open', () => {
    const two = new TwoWizards(fresh(), T, 'the small steps');
    two.open();
    for (const path of ['event', 'body', 'both']) {
      two.whole(draftOf(two, { primaryPath: path }), 'primary');
      for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '36-54', '55+']) for (const unit of ['lbs', 'kg']) two.whole(draftOf(two, { primaryPath: path, experience: exp, ageBracket: age, unit }), 'profile');
      for (const types of [[], ['run'], ['run', 'swim']]) two.whole(draftOf(two, { primaryPath: path, liftingFocus: path === 'event' ? 'support_athletic' : 'fatloss', cardioTypes: types }), 'lifting_focus');
    }
    for (const eq of ['home_full', 'home_basic', 'commercial', 'crossfit', 'bodyweight']) two.whole(draftOf(two, { equipment: eq }), 'equipment');
    for (const path of ['event', 'both']) for (let m = 0; m < 8; m++) {
      two.whole(draftOf(two, { primaryPath: path, cardioTypes: ['run', 'bike', 'swim'].filter((_, i) => m & (1 << i)) }), 'cardio_goal');
      two.whole(draftOf(two, { primaryPath: path, eventTargeted: false, raceDate: '', raceDateWeeks: 5, cardioTypes: ['swim', 'run'].filter((_, i) => m & (1 << i)) }), 'cardio_goal');
    }
  });
  test('race plans generated: opened weeks in (the first title), under their floor, and the hybrid path\'s 5K, whose race is today', () => {
    const five = (path: string, race: string | undefined): object => ({ primaryPath: path, name: 'R', liftingFocus: path === 'event' ? 'support_strength' : 'balanced', cardioTypes: ['run'], cardioGoals: { run: goal('run_5k', { mileBestMins: '8', mileBestSecs: '0' }) }, ...(race ? { raceDate: race } : {}) });
    const behind = wholeWalk(fresh(), five('event', day(TODAY, 21)), T, 'a 5K three weeks out');
    assert.deepEqual([(behind.prog as unknown as { startDate: string }).startDate, (behind.prog as unknown as { blockOpen: string }).blockOpen], ['2026-07-27', TODAY]);
    // The hybrid path's own taps leave the race date today's (the measure's finding): set whole here, held equal to today's.
    const hybrid = wholeWalk(fresh(), five('both', TODAY), T, 'the hybrid path\'s 5K');
    assert.equal((hybrid.prog as unknown as { startDate: string }).startDate, '2026-07-06', 'seven Mondays before this week\'s, as today\'s builds it');
    wholeWalk(fresh(), { primaryPath: 'event', name: 'T', liftingFocus: 'support_strength', cardioTypes: ['run'], eventTargeted: true, raceDate: day(TODAY, 30),
      cardioGoals: { run: goal('run_pace_goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0', paceUnit: 'mi', mileBestMins: '8', mileBestSecs: '15' }) } }, T, 'a dated test goal');
    // The same test goal from a start with nothing left to train that week (the start moves to Monday, and the pin with it),
    // and with the test tomorrow in that week (the week holds the test: the start stays, and week 1 is the test week).
    const pace = { run: goal('run_pace_goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0', paceUnit: 'mi', mileBestMins: '8', mileBestSecs: '15' }) };
    const moved = wholeWalk(fresh(), { primaryPath: 'event', name: 'T', liftingFocus: 'support_strength', cardioTypes: ['run'], eventTargeted: true, raceDate: day(TODAY, 30), restDays: ['sat', 'sun'], cardioGoals: pace }, T, 'a dated test goal, the start moved');
    assert.equal((moved.prog as unknown as { startDate: string }).startDate, '2026-08-31');
    const held = wholeWalk(fresh(), { primaryPath: 'event', name: 'T', liftingFocus: 'support_strength', cardioTypes: ['run'], eventTargeted: true, raceDate: day(TODAY, 1), restDays: ['sat', 'sun'], cardioGoals: pace }, T, 'a dated test goal, the week holds the test');
    assert.deepEqual([(held.prog as unknown as { startDate: string }).startDate, held.prog.totalWeeks], [TODAY, 1]);
  });
  test('each refusal: the mile\'s four and the swim\'s four', () => {
    const run = (id: string, mile: object): object => ({ primaryPath: 'event', eventTargeted: false, raceDate: '', name: 'X', cardioTypes: ['run'], cardioGoals: { run: goal(id, mile) } });
    const swim = (id: string, t: object): object => ({ primaryPath: 'event', eventTargeted: false, raceDate: '', name: 'X', cardioTypes: ['swim'], cardioGoals: { swim: goal(id, t) } });
    const said = [
      refusedWalk(fresh(), run('run_base', { mileBestMins: '2', mileBestSecs: '30' }), T, 'under three'),
      refusedWalk(fresh(), run('run_5k', { mileBestMins: '26', mileBestSecs: '0' }), T, 'over twenty five'),
      refusedWalk(fresh(), run('run_10k', { mileBestMins: '8', mileBestSecs: '75' }), T, 'not a time'),
      refusedWalk(fresh(), run('run_pace_goal', { targetDist: '1.5', targetMins: '9', targetSecs: '0' }), T, 'a pace goal with no mile'),
      refusedWalk(fresh(), swim('swim_500_time', {}), T, 'no 500'),
      refusedWalk(fresh(), swim('swim_100_time', { base500Mins: '10', base500Secs: '30' }), T, 'no 100'),
      refusedWalk(fresh(), swim('swim_100_time', { baseMins: '2', baseSecs: '30', base500Mins: '9', base500Secs: '0' }), T, 'the 500 faster'),
      refusedWalk(fresh(), swim('swim_500_time', { baseMins: '1', baseSecs: '75' }), T, 'not a time'),
    ];
    assert.equal(new Set(said).size, 8, 'eight refusals, each its own words: ' + JSON.stringify(said));
  });
});

describe('the Expo app\'s cardio goals by taps, wide', () => {
  const VALUES = ['', '0', '4', '5', '25', '60', '1.5', '007', '-1', '1e2'];
  const DAYS_OUT = [-3, 0, 1, 3, 6, 7, 8, 10, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 112, 119, 126, 140, 210];
  const runs = (): Phone => { const P = runsLife(CFGS[0], NOW).phone.launch('2026-09-23T09:00:00'); P.settle(); return P; };

  test('every goal of the race path at each level: every field typed into with ten values, twenty four race days, Reset, the buttons', () => {
    goalsWalk(fresh(), T, 'an empty phone', 'event', VALUES, DAYS_OUT);
    goalsWalk(fresh(), T, 'an empty phone', 'event', ['', '9', '59'], [0, 7, 14, 56, 126], 'beginner');
    goalsWalk(fresh(), T, 'an empty phone', 'event', ['', '9', '59'], [0, 7, 14, 56, 126], 'advanced');
  });
  test('every goal of the hybrid path at each level', () => {
    for (const exp of ['beginner', 'intermediate', 'advanced']) goalsWalk(fresh(), T, 'an empty phone', 'both', VALUES, [], exp);
  });
  test('every goal on other days of the week, and beside a program with three weeks of history', () => {
    for (const n of [2, 4, 6]) goalsWalk(fresh(day(TODAY, n) + 'T07:30:00'), T, 'the day ' + day(TODAY, n), 'event', ['', '9'], [0, 5, 8, 30, 120]);
    const Q = twinAt(life(CFGS[0], NOW).phone, 1); Q.settle();
    const before = JSON.stringify(Q.dump());
    goalsWalk(Q, T, 'a walked phone', 'event', ['', '9'], [0, 8, 56]);
    assert.equal(JSON.stringify(Q.dump()), before, 'the cardio goals store nothing, whatever is tapped or typed');
  });
  test('the pace goal\'s reach on both paths at each level and age', () => {
    for (const path of ['event', 'both'] as const) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '36-54', '55+']) reachWalk(fresh(), T, 'an empty phone', path, exp, age);
  });
  test('a dated test: the days rested, the start moved, a target far and one in reach', () => {
    for (const rest of [[], ['sat'], ['sat', 'sun'], ['sat', 'sun', 'mon']]) for (const start of [null, 3, 9]) for (const mins of ['9', '13']) testWeekWalk(fresh(), T, 'an empty phone', rest, start, mins);
  });
  test('the seed offer on both paths, on a phone with logged recovery paces', () => {
    for (const path of ['event', 'both'] as const) {
      const P = runs();
      const before = P.dump();
      seedWalk(P, T, 'a phone with three weeks of runs', path);
      const after = P.dump();
      assert.deepEqual(Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]).sort(), ['ia_active', 'ia_programs'], 'the two programs generated change the list and the active program alone');
      const made = (JSON.parse(after['ia_programs']!) as { cfg: Record<string, unknown> }[]).slice(-2).map((x) => x.cfg);
      assert.deepEqual([made[0]!['_seedApplied'], made[1]!['_seedDismissed']], [true, true]);
    }
  });
  test('each goal by taps to Generate: the race path with a race day from today to seventeen weeks out and with none, the hybrid path, and time goals left blank', () => {
    const goals = (path: string): [string, string][] => Object.entries(GOALS).flatMap(([sport, ids]) => ids.filter(([id]) => path === 'event' || !HYB.has(id)).map(([id]) => [sport, id] as [string, string]));
    let n = 0;
    for (const [sport, id] of goals('event')) for (const race of [0, 10, 28, 56, 119, null]) goalToGenerate(fresh(), T, 'an empty phone', 'event', sport, id, fillOf(sport, id), race, n++ % 7 === 0);
    for (const [sport, id] of goals('both')) goalToGenerate(fresh(), T, 'an empty phone', 'both', sport, id, fillOf(sport, id), null);
    for (const [sport, id] of [['run', 'run_pace_goal'], ['swim', 'swim_500_time'], ['swim', 'swim_100_time']] as [string, string][]) {
      assert.ok(goalToGenerate(fresh(), T, 'an empty phone', 'event', sport, id, [], 56).refused, id + ' with its times blank is refused');
      assert.ok(goalToGenerate(fresh(), T, 'an empty phone', 'both', sport, id, [], null).refused);
    }
  });
  test.each(NAMES.map((n, i) => [n, i] as const))('%s: its goals made by taps build the program its config set whole builds, on an empty phone and as a second program', (name, i) => {
    const taps = seededGoalsWalk(fresh(), CFGS[i], T, name);
    const whole = wholeWalk(fresh(), CFGS[i], wizardTally(), name);
    assert.equal(taps.refused, null);
    assert.equal(JSON.stringify(taps.prog.weeks), JSON.stringify(whole.prog.weeks), name + ': the grid from the goals made by taps is the grid from the seeded config');
    assert.deepEqual([taps.prog.totalWeeks, taps.prog.startDate], [whole.prog.totalWeeks, whole.prog.startDate]);
    const P = twinAt(life(CFGS[i], NOW).phone, 1); P.settle();
    const before = P.dump();
    seededGoalsWalk(P, { ...CFGS[i], name: 'Second' }, T, name + ', a second program');
    const after = P.dump();
    assert.deepEqual(Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]).sort(), ['ia_active', 'ia_programs']);
  });
});

describe('the Expo app\'s wizard: what the walks drew', () => {
  test('every kind a step holds was drawn and compared, each at least this many times', () => {
    // IA_TALLY=1 prints what was drawn, for setting a floor after a walk changes.
    if (process.env['IA_TALLY']) console.log(JSON.stringify(T, Object.keys(T).sort(), 1));
    floor('opened', 40); floor('taps', 2000); floor('drafts set whole', 10000); floor('left by Back', 10); floor('start date repaints', 150);
    for (const s of ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name']) floor(s + ': draws', 50);
    floor('profile: experience beginner', 6); floor('profile: experience advanced', 6); floor('profile: Age 36-54', 6); floor('profile: Age 55+', 6); floor('profile: kg', 9);
    floor('cardio_goal: sport open', 20); floor('cardio_goal: sport shut', 20); floor('cardio_goal: goal options', 100);
    floor('lifting_focus: add-on, Lift Only chosen', 5); floor('lifting_focus: add-on, a sport chosen', 5); floor('lifting_focus: no add-on', 20);
    floor('days: floor box, a goal named', 2000); floor('days: floor box, three days', 300); floor('days: no floor box', 2000); floor('days: days locked', 5000); floor('days: days resting', 20000);
    floor('toast: the floor, a goal named', 300); floor('toast: the floor, three days', 30);
    floor('day readers compared', 10000); floor('advisories read', 5000);
    floor('name: start field: a whole first week', 50); floor('name: start field: a short first week', 200); floor('name: start field: moved to the next Monday', 50); floor('name: start field: the week holds the test', 6);
    floor('name: start set by race date: starts later', 20); floor('name: start set by race date: opens in a week', 2); floor('name: start set by race date: opens in a week, weeks behind', 8);
    floor('name: start set by race date: opens in a week, weeks behind, under the floor', 6); floor('name: start set by race date: opens in a week, weeks behind, under the floor, the shorter plan\'s link', 10);
    floor('name: pips drawn', 20); floor('name: no pips', 20);
    floor('name: race date row: a date, N away', 100); floor('name: race date row: a date, race day', 4); floor('name: race date row: a date, behind you', 4); floor('name: race date row: no date set', 50); floor('name: race date row: none', 100);
    floor('name: start row: set by race date', 40); floor('name: start row: short first week', 100); floor('name: start row: the date alone', 100);
    floor('pop-up raised', 20); floor('pop-up: Go Back', 5); floor('pop-up: Build', 20); floor('no pop-up', 20);
    floor('generated', 40); floor('landing: the title holding today', 35); floor('landing: the first title, today is a later week', 2); floor('start: set by race date', 8); floor('start: resolved', 30);
    floor('programs stored: 1', 30); floor('programs stored: 2', 13);
    for (const r of ['Required. Enter your most recent timed mile.', 'Required. Enter your most recent timed 500yd.', 'Required. Enter your most recent timed 100yd.', 'Your 500 pace is faster than your 100 time. Check both entries.']) floor('refused: ' + r, 1);
    // Drawn by no draft a path offers, on either app (tests/measure/native-wizard_today.md): the advisory box.
    assert.equal(T['days: advisory box'] || 0, 0, 'the advisory box is drawn by none of these drafts, as on today\'s');
    // The cardio goals (the second session): every kind the step's model and its repaints can draw, by taps.
    const cg = (k: string, n: number): void => floor('cardio_goal: ' + k, n);
    cg('whole draws', 1400); cg('repaints in place', 6000); floor('values typed', 5000); floor('race days handed back', 1100); floor('race date Reset', 80);
    cg('a goal chosen', 1000); cg('a sport open with no goal picked', 250); cg('no box under the cards', 400); cg('the line for more than one sport', 40);
    cg('form: baseline, run', 2000); cg('form: baseline, bike', 900); cg('form: baseline, swim', 500); cg('form: run pace goal', 2400); cg('form: swim 500', 500); cg('form: swim 100 (the 500 row too)', 700);
    cg('race block: the date field', 4000); cg('race block: the holds copy', 800); cg('race block: the time trial copy', 20); cg('race block: none (not the race path)', 2300);
    cg('seed banner: the offer', 4); cg('seed banner: applied line', 8); cg('seed banner: none', 5000);
    cg('mile help: required', 1800); cg('mile help: optional, a N mile', 1600); cg('mile help: optional, an N mile', 900);
    for (const [k, n] of [['none', 3000], ['required', 350], ['not a real time', 130], ['under 3:00', 50], ['over 25:00', 190], ['the chart\'s fastest row', 100], ['the chart\'s slowest row', 280]] as [string, number][]) cg('mile advisory: ' + k, n);
    for (const [k, n] of [['none', 800], ['required, the 500', 200], ['required, the 100', 10], ['not a real time', 100], ['500 pace faster than the 100', 70]] as [string, number][]) cg('swim advisory: ' + k, n);
    cg('length line: set by the longest goal', 5000); cg('length line: the test sets it', 100); cg('length line: the test sets it (1 week)', 1500); cg('length line: your mile time sets it', 130);
    cg('pace reach: hidden', 1400); cg('pace reach: from the mile entered', 900); cg('pace reach: from the level default', 120);
    cg('pace line shown', 2200); cg('pace line hidden', 180); cg('swim pace line shown', 1100); cg('swim pace line hidden', 50);
    for (const [k, n] of [['none on the step', 3500], ['empty', 150], ['the date has passed [red]', 28], ['less than a week away [red]', 2300], ['finishes before race day [run]', 90], ['peaks on race day [run]', 24],
      ['short for this goal [accent]', 40], ['short for this goal [red]', 220], ['race plan starts later [run]', 60], ['race plan opens in a week [run]', 4], ['race plan opens in a week, weeks behind [run]', 40],
      ['race plan opens in a week, weeks behind, under the floor [signal]', 24], ['race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal]', 130],
      ['test this week [accent]', 210], ['test this week, with the reach sentence [accent]', 320], ['test in week 2 or later [run]', 36], ['test in week 2 or later, with the reach sentence [accent]', 68],
      ['test in week 1, nothing left to train [signal]', 6], ['test in week 1, nothing left to train, with the reach sentence [signal]', 4], ['test before the first training day [signal]', 78], ['test past the test block [accent]', 17]] as [string, number][]) cg('card under the date: ' + k, n);
    floor('the shorter plan link tapped, on cardio_goal', 40); floor('the shorter plan link tapped, on name', 7); floor('toast: switched to the shorter plan', 47);
    floor('seeded programs whose goals were made by taps', 20);
    // Named by the page's builders and drawn by no walk, on either app (tests/measure/native-wizard_cardio-goals.md): a mile's help with no anchor to name, and a race plan under its floor with no week behind it.
    assert.equal(T['cardio_goal: mile help: optional, bare'] || 0, 0);
    assert.equal(T['cardio_goal: card under the date: race plan opens in a week, under the floor [signal]'] || 0, 0);
    assert.deepEqual(Object.keys(T).filter((k) => /UNNAMED/.test(k)), [], 'every line drawn is one of the kinds named here');
  });
});
