// The wizard and Generate in the Expo app, against today's page (MIGRATION.md phase 3, row 6, both sessions). Each
// walk runs both apps over one stored state and holds them equal after every tap (support/native-wizard.ts): the
// step, the draft, the bar, the step's markup, the lines the page repaints in place, the toast and every ia_ key;
// and after Generate the pop-up, the lines, the program in hand, the store and This Week. The cardio goals are
// walked whole here on both paths; the ten seeded configs, the second program and the wider drafts are
// tests/sweeps/native-wizard.test.ts.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { PROGRAMS } from '../support/programs.ts';
import { runsLife } from '../support/native-progress.ts';
import { Phone } from '../support/stored-state.ts';
import {
  type WizardTally, addOnThenRaceWalk, fillOf, goalToGenerate, goalsWalk, hybridWalk, raceWalk, reachWalk, refusedWalk, seedWalk, seededGoalsWalk, strengthWalk, testWeekWalk, wholeWalk, wizardTally,
} from '../support/native-wizard.ts';

const NOW = '2026-08-29T09:00:00';   // a Saturday: a start of today makes a short first week
const fresh = (at = NOW): Phone => { const P = new Phone().launch(at); P.settle(); return P; };

describe('the Expo app\'s wizard, tap for tap against today\'s page', () => {
  test('the strength path: every tap of its six steps, Back out, and a lift only program generated', () => {
    const T = wizardTally();
    const g = strengthWalk(fresh(), T, 'an empty phone');
    assert.equal(g.popUp, false, 'a lift only program raises no pop-up');
    assert.equal(g.refused, null);
    // What the walk drew, each kind at least once.
    for (const k of ['primary: draws', 'profile: draws', 'equipment: draws', 'lifting_focus: draws', 'days: draws', 'name: draws', 'lifting_focus: add-on, Lift Only chosen', 'lifting_focus: add-on, a sport chosen',
      'days: floor box, three days', 'days: no floor box', 'toast: the floor, three days', 'name: start field: a short first week', 'name: start field: a whole first week', 'name: start field: moved to the next Monday',
      'name: start row: short first week', 'name: start row: the date alone', 'name: race date row: none', 'start date repaints', 'left by Back', 'generated', 'landing: the title holding today']) assert.ok((T[k] || 0) >= 1, k + ' was drawn (' + JSON.stringify(T) + ')');
    assert.equal(T['cardio_goal: draws'], undefined, 'the strength path never draws the cardio goals');
    assert.equal(T['toast: the floor, three days'], 3, 'each of the three days left training answers with the toast');
    assert.ok(T['taps']! >= 60, 'the walk made ' + T['taps'] + ' taps');
  });

  test('the race path with no goal: the cardio goals open and shut their sports, and a program is generated', () => {
    const T = wizardTally();
    const g = raceWalk(fresh(), T, 'an empty phone');
    assert.equal(g.refused, null);
    for (const k of ['cardio_goal: draws', 'cardio_goal: sport open', 'cardio_goal: sport shut', 'lifting_focus: no add-on', 'name: race date row: a date, race day', 'generated']) assert.ok((T[k] || 0) >= 1, k + ' was drawn (' + JSON.stringify(T) + ')');
    assert.equal(T['cardio_goal: a goal chosen'] || 0, 0, 'this walk picks no goal');
    assert.equal(T['cardio_goal: no box under the cards'], T['cardio_goal: whole draws'], 'and with no goal the box under the cards is never drawn');
  });

  test('the hybrid path: no taper goals among a sport\'s goals, and a program is generated', () => {
    const T = wizardTally();
    const g = hybridWalk(fresh(), T, 'an empty phone');
    assert.equal(g.refused, null);
    assert.ok(T['cardio_goal: sport open']! >= 1 && T['generated'] === 1);
  });

  test('a sport from the strength path\'s add-on opens its card when the path changes', () => {
    const T = wizardTally();
    addOnThenRaceWalk(fresh(), T, 'an empty phone');
    assert.equal(T['left by Back'], 1);
  });
});

describe('the Expo app\'s cardio goals, tap for tap against today\'s page', () => {
  const kinds = (T: WizardTally, ks: string[]): void => { for (const k of ks) assert.ok((T['cardio_goal: ' + k] || 0) >= 1, k + ' was drawn (' + JSON.stringify(T) + ')'); };

  test('the race path: every goal picked, every field of its form typed into, the units, a race day picked, Reset, both race buttons', () => {
    const T = wizardTally();
    goalsWalk(fresh(), T, 'an empty phone', 'event', ['', '25', '60'], [-3, 0, 7, 28, 119]);
    kinds(T, ['form: baseline, run', 'form: baseline, bike', 'form: baseline, swim', 'form: run pace goal', 'form: swim 500', 'form: swim 100 (the 500 row too)', 'race block: the date field', 'race block: the holds copy',
      'race block: the time trial copy', 'the line for more than one sport', 'no box under the cards', 'repaints in place', 'whole draws', 'pace line shown', 'pace line hidden', 'swim pace line shown', 'swim pace line hidden',
      'mile help: required', 'mile help: optional, a N mile', 'mile advisory: required', 'mile advisory: none', 'mile advisory: not a real time', 'mile advisory: the chart\'s fastest row', 'mile advisory: the chart\'s slowest row',
      'swim advisory: required, the 500', 'swim advisory: required, the 100', 'swim advisory: not a real time', 'swim advisory: 500 pace faster than the 100', 'swim advisory: none',
      'length line: set by the longest goal', 'length line: the test sets it', 'length line: the test sets it (1 week)',
      'card under the date: the date has passed [red]', 'card under the date: less than a week away [red]', 'card under the date: race plan starts later [run]', 'card under the date: short for this goal [red]',
      'card under the date: finishes before race day [run]', 'card under the date: empty', 'card under the date: none on the step',
      'card under the date: race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal]', 'card under the date: test this week, with the reach sentence [accent]']);
    assert.equal(T['cardio_goal: a goal chosen']! >= 16, true, 'each of the race path\'s sixteen goals was picked');
    assert.equal(T['race date Reset'], 16, 'Reset on the race date, once under each goal');
    assert.ok(T['values typed']! >= 300 && T['race days handed back']! >= 100, T['values typed'] + ' values typed, ' + T['race days handed back'] + ' race days');
    assert.ok(T['the shorter plan link tapped, on cardio_goal']! >= 3 && T['toast: switched to the shorter plan']! >= 3, 'the 10K, the half and the marathon each offer a shorter plan a week out, and the link switches');
    // A typed bike or swim field leaves the length line as the last whole draw gave it: held equal either way, and counted here as typed.
    assert.equal(T['cardio_goal: seed banner: the offer'], undefined, 'an empty phone has no seed to offer');
  });

  test('the hybrid path: twelve goals, no race date, and the pace goal dated today by the step', () => {
    const T = wizardTally();
    goalsWalk(fresh(), T, 'an empty phone', 'both', ['', '5'], [], 'beginner');
    kinds(T, ['race block: none (not the race path)', 'form: run pace goal', 'mile help: optional, an N mile', 'length line: the test sets it (1 week)', 'card under the date: none on the step', 'pace reach: hidden']);
    assert.equal(T['cardio_goal: race block: the date field'], undefined, 'the hybrid path draws no race date');
    assert.equal(T['race days handed back'], undefined);
  });

  test('the pace goal\'s reach where no race date owns it, and a week that holds the test', () => {
    const T = wizardTally();
    reachWalk(fresh(), T, 'an empty phone', 'event', 'intermediate', '18-35');
    reachWalk(fresh(), T, 'an empty phone', 'both', 'beginner', '55+');
    testWeekWalk(fresh(), T, 'an empty phone', ['sat', 'sun'], null);
    testWeekWalk(fresh(), T, 'an empty phone', ['sat', 'sun'], null, '13');
    testWeekWalk(fresh(), T, 'an empty phone', [], 3, '13');
    kinds(T, ['pace reach: from the mile entered', 'pace reach: from the level default', 'pace reach: hidden', 'length line: your mile time sets it',
      'card under the date: test in week 1, nothing left to train, with the reach sentence [signal]', 'card under the date: test in week 1, nothing left to train [signal]',
      'card under the date: test in week 2 or later, with the reach sentence [accent]', 'card under the date: test in week 2 or later [run]', 'card under the date: test this week [accent]',
      'card under the date: test before the first training day [signal]', 'card under the date: test past the test block [accent]']);
  });

  test('the seed offer on a phone with logged recovery paces: Use this data, Start fresh, and what Generate stores of it', () => {
    const T = wizardTally();
    const P = runsLife(PROGRAMS['half-manny (Mario, NRC half, crossfit)'], NOW).phone.launch('2026-09-23T09:00:00'); P.settle();
    const g = seedWalk(P, T, 'a phone with three weeks of runs', 'event');
    kinds(T, ['seed banner: the offer', 'seed banner: applied line', 'seed banner: none']);
    assert.equal(g.refused, null);
    const cfg = (JSON.parse(P.dump()['ia_programs']!) as { cfg: Record<string, unknown> }[]).slice(-2).map((x) => x.cfg);
    assert.equal(cfg[0]!['_seedApplied'], true, 'the program made after Use this data stores that it was applied');
    assert.equal(cfg[1]!['_seedDismissed'], true, 'and the one made after Start fresh that it was turned down');
    assert.ok(cfg[0]!['_seed'] && cfg[1]!['_seed'], 'both store what the reader found');
  });

  test('goals by taps to Generate: the start a race sets, the shorter plan\'s link under it, the pop-up with Go Back, a refusal', () => {
    const T = wizardTally();
    const tenK = goalToGenerate(fresh(), T, 'an empty phone', 'event', 'run', 'run_10k', fillOf('run', 'run_10k'), 10);
    assert.equal(tenK.popUp, true);
    assert.equal(tenK.prog.totalWeeks, 8, 'the 10K plan is eight weeks');
    assert.equal(T['the shorter plan link tapped, on name'], 1, 'ten days out the name step offers the 5K plan under the start, and the link switches the goal');
    const half = goalToGenerate(fresh(), T, 'an empty phone', 'event', 'run', 'run_half', fillOf('run', 'run_half'), 119, true);
    assert.equal(half.prog.totalWeeks, 14);
    assert.ok(T['pop-up: Go Back']! >= 1 && T['name: start set by race date: starts later']! >= 1);
    assert.equal(goalToGenerate(fresh(), T, 'an empty phone', 'both', 'run', 'run_pace_goal', [], null).refused, 'Required. Enter your most recent timed mile.');
    // The hybrid path's pace goal is dated today by the step, so it builds its test week alone (found by the measure, carried as today's).
    assert.equal(goalToGenerate(fresh(), T, 'an empty phone', 'both', 'run', 'run_pace_goal', fillOf('run', 'run_pace_goal'), null).prog.totalWeeks, 1);
    assert.equal(goalToGenerate(fresh(), T, 'an empty phone', 'event', 'swim', 'swim_100_time', fillOf('swim', 'swim_100_time'), null).refused, null);
  });

  test('The Half Manny\'s goal made by taps: the same program as its config set whole, grid and all', () => {
    const T = wizardTally();
    const cfg = PROGRAMS['half-manny (Mario, NRC half, crossfit)'];
    const taps = seededGoalsWalk(fresh(), cfg, T, 'half-manny');
    const whole = wholeWalk(fresh(), cfg, wizardTally(), 'half-manny');
    assert.equal(taps.prog.totalWeeks, 14);
    assert.equal(JSON.stringify(taps.prog.weeks), JSON.stringify(whole.prog.weeks), 'the grid built from the goal made by taps is the grid built from the seeded config');
    assert.equal(taps.prog.startDate, whole.prog.startDate);
    assert.ok(T['values typed']! >= 3 && T['race days handed back'] === 1 && T['generated'] === 1);
  });
});

describe('the Expo app\'s Generate, against today\'s page', () => {
  test('The Half Manny\'s config set whole: every step, the pop-up with Go Back then Build, and the program equal, grid and all', () => {
    const T = wizardTally();
    const g = wholeWalk(fresh(), PROGRAMS['half-manny (Mario, NRC half, crossfit)'], T, 'half-manny', true);
    assert.equal(g.popUp, true, 'the half marathon\'s length raises the pop-up');
    assert.equal(g.refused, null);
    for (const k of ['pop-up raised', 'pop-up: Go Back', 'pop-up: Build', 'generated', 'start: set by race date', 'day readers compared', 'programs stored: 1']) assert.ok((T[k] || 0) >= 1, k + ' (' + JSON.stringify(T) + ')');
    assert.ok(T['name: start set by race date: starts later']! >= 1, 'the name step shows the start the race sets');
    assert.equal(g.prog.totalWeeks, 14);
  });

  test('a mile that is not a time, and a swim goal with no current time, are refused with today\'s words and store nothing', () => {
    const T = wizardTally();
    const run = (mile: object): object => ({ primaryPath: 'event', eventTargeted: false, raceDate: '', name: 'X', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', baseline: '', ...mile } } });
    assert.equal(refusedWalk(fresh(), run({ mileBestMins: '2', mileBestSecs: '30' }), T, 'a mile under three minutes'), 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.');
    assert.equal(refusedWalk(fresh(), run({ mileBestMins: '26', mileBestSecs: '0' }), T, 'a mile over twenty five'), 'Over 25:00 reads as a walk, not a run. Check the entry.');
    assert.equal(refusedWalk(fresh(), run({ mileBestMins: '8', mileBestSecs: '75' }), T, 'seventy five seconds'), 'That mile time is not a real time. Check the minutes and seconds.');
    const swim = { primaryPath: 'event', eventTargeted: false, raceDate: '', name: 'X', cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_500_time', label: 'Improve 500 Time', baseline: '' } } };
    assert.equal(refusedWalk(fresh(), swim, T, 'a swim 500 with no time'), 'Required. Enter your most recent timed 500yd.');
    assert.equal(T['generated'], undefined, 'none of them generated');
  });
});
