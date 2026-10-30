// The change-a-goal sheet (src/app/screens/goal-sheet/goal-sheet-model.ts, architecture phase E step 7), against the
// legacy renderGoalSheet it replaces: the heading, which options show and how, and the decision panel for a step up, a
// step down and a goal that needs targets typed. Every expected value is typed here from the legacy code and its tables.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type GoalInput, goalSheetView } from '../../src/app/screens/goal-sheet/goal-sheet-model.ts';

/** The legacy run goals, ranks and tables, typed here. */
const RUN = [
  { id: 'run_5k', label: 'Run a 5K', desc: '3.1 miles without stopping' },
  { id: 'run_half', label: 'Half Marathon', desc: '13.1 miles. Serious endurance.' },
  { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', desc: 'A distance and a time.' },
  { id: 'run_base', label: 'Build Running Base', desc: 'Get consistent, increase mileage safely' },
];
const BASE: GoalInput = {
  draft: { progId: 'p1', sport: 'run', sel: null, inputs: {} },
  sportLabel: 'Run',
  current: { id: 'run_5k', label: 'Run a 5K' },
  path: 'strength',
  choices: RUN,
  excluded: new Set(['run_half', 'run_marathon']),
  rank: { run_half: 5, run_5k: 3, run_pace_goal: 2, run_base: 1 },
  needsInputs: new Set(['run_pace_goal', 'swim_100_time']),
  started: true,
  week: 4,
};

describe('the change-a-goal sheet', () => {
  it('heads the sheet with the sport, greys the current goal and marks the bigger ones', () => {
    const v = goalSheetView(BASE);
    assert.equal(v.heading, 'Change run goal');
    assert.deepEqual(v.options.map((o) => [o.id, o.current, o.selected, o.up]), [
      ['run_5k', true, false, false],
      ['run_half', false, false, true],
      ['run_pace_goal', false, false, false],
      ['run_base', false, false, false],
    ]);
    assert.equal(v.decision, null);
  });

  it('leaves the peaking goals out of a hybrid program', () => {
    assert.deepEqual(goalSheetView({ ...BASE, path: 'both' }).options.map((o) => o.id), ['run_5k', 'run_pace_goal', 'run_base']);
  });

  it('warns on a step up, with the week the athlete would drop into and the keep button first', () => {
    const d = goalSheetView({ ...BASE, draft: { ...BASE.draft, sel: 'run_half' } }).decision;
    assert.deepEqual(d, {
      up: true,
      title: 'Half Marathon is a step up',
      body: 'You would drop into week 4 of a bigger build without the early weeks under you. That is a real jump in training load. If the goal matters, a fresh program builds it right.',
      inputs: null,
      values: { targetDist: '', paceUnit: 'mi', targetMins: '', targetSecs: '' },
      commitLabel: 'Switch anyway',
      keepLabel: 'Stay the course',
    });
    const fresh = goalSheetView({ ...BASE, started: false, draft: { ...BASE.draft, sel: 'run_half' } }).decision!;
    assert.match(fresh.body, /^You would drop into a bigger build without/);
  });

  it('confirms a step down plainly, and asks a pace goal for its distance and time', () => {
    const d = goalSheetView({ ...BASE, draft: { ...BASE.draft, sel: 'run_pace_goal', inputs: { targetDist: '1.5', paceUnit: 'km', targetMins: '9' } } }).decision!;
    assert.deepEqual([d.up, d.title, d.inputs, d.commitLabel, d.keepLabel], [false, 'Switch to Hit a Pace / Time Goal', 'pace', 'Make the switch', 'Keep Run a 5K']);
    assert.equal(d.body, 'Past weeks stand as trained. Your run work rebuilds from this week forward. This week may finish mixed. Next week is fully on the new goal.');
    assert.deepEqual(d.values, { targetDist: '1.5', paceUnit: 'km', targetMins: '9', targetSecs: '' });
  });

  it('reads a program with no goal as rank 2, asks a time goal for its time only, and keeps "current"', () => {
    const swim = [{ id: 'swim_100_time', label: '100 Time', desc: 'x' }, { id: 'swim_base', label: 'Swim Base', desc: 'y' }];
    const v = goalSheetView({ ...BASE, sportLabel: 'Swim', current: null, choices: swim, rank: { swim_100_time: 2, swim_base: 1 }, started: false, draft: { ...BASE.draft, sport: 'swim', sel: 'swim_100_time' } });
    assert.equal(v.heading, 'Change swim goal');
    assert.deepEqual(v.options.map((o) => [o.current, o.selected, o.up]), [[false, true, false], [false, false, false]]);
    const d = v.decision!;
    assert.deepEqual([d.up, d.inputs, d.keepLabel, d.body], [false, 'time', 'Keep current', 'Past weeks stand as trained. Your swim work rebuilds from this week forward.']);
  });

  it('shows no decision for a pick the sheet does not offer', () => {
    assert.equal(goalSheetView({ ...BASE, path: 'both', draft: { ...BASE.draft, sel: 'run_half' } }).decision, null);
  });
});
