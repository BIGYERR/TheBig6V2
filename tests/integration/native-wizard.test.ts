// The wizard and Generate in the Expo app, against today's page (MIGRATION.md phase 3, row 6, the first of two
// sessions). Each walk runs both apps over one stored state and holds them equal after every tap
// (support/native-wizard.ts): the step, the draft, the bar, the step's markup, the toast and every ia_ key; and after
// Generate the pop-up, the lines, the program in hand, the store and This Week. The Half Manny's config is set whole
// here; the ten seeded configs, the second program and the wider drafts are tests/sweeps/native-wizard.test.ts.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { PROGRAMS } from '../support/programs.ts';
import { Phone } from '../support/stored-state.ts';
import { addOnThenRaceWalk, hybridWalk, raceWalk, refusedWalk, strengthWalk, wholeWalk, wizardTally } from '../support/native-wizard.ts';

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
    assert.equal(T['cardio_goal: not compared, the draft holds a goal (the second session\'s)'], undefined, 'every draw of the cardio goals was compared');
    assert.equal(T['cardio_goal: a goal chosen'] || 0, 0, 'no goal is picked by this session\'s taps');
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
