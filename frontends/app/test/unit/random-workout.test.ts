// Random Workout (src/app/screens/random-workout/random-workout-model.ts, architecture phase E step 11), against the
// legacy getActivePool, reroll and updateRandCounter it replaces: the pool for a goal and filter, the draw that never
// repeats the last workout, the weekday key, the sheet for a workout, and This Week's counter. Every expected value is
// typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayKeyOf, randCount, randDraw, randPool, randView } from '../../src/app/screens/random-workout/random-workout-model.ts';

const POOLS = {
  strength: [{ title: 'Heavy Day' }, { title: 'Grip Day' }],
  balanced: [{ title: 'Mixed Day' }, { title: 'Carry Day' }, { title: 'Swim Day', cardio: { type: 'Swim', detail: '20 min easy' } }],
};

describe('Random Workout', () => {
  it('draws from the goal\'s own pool, the balanced one for a goal without, or every pool in order', () => {
    assert.deepEqual(randPool(POOLS, 'strength', 'mine').map((w) => w.title), ['Heavy Day', 'Grip Day']);
    assert.deepEqual(randPool(POOLS, 'fatloss', 'mine').map((w) => w.title), ['Mixed Day', 'Carry Day', 'Swim Day']);
    assert.deepEqual(randPool(POOLS, 'strength', 'all').map((w) => w.title), ['Heavy Day', 'Grip Day', 'Mixed Day', 'Carry Day', 'Swim Day']);
  });

  it('draws again while the draw repeats the last workout, and only when there is another', () => {
    const draws = [0.5, 0.55, 0.9];
    let i = 0;
    assert.equal(randDraw(3, 1, () => draws[i++]!), 2);
    assert.equal(i, 3, 'two repeats of index 1 drawn again, then index 2');
    assert.equal(randDraw(1, 0, () => 0.3), 0, 'a pool of one keeps its only workout');
  });

  it('names the weekday a Wildcard drawn now stands in for', () => {
    assert.deepEqual([new Date(2026, 9, 4), new Date(2026, 9, 7), new Date(2026, 9, 10)].map(dayKeyOf), ['sun', 'wed', 'sat']);
  });

  it('badges a workout in the goal\'s colour, says when it was done before, and shows its cardio and note', () => {
    assert.deepEqual(randView({ title: 'Heavy Day' }, [], 'strength'), {
      title: 'Heavy Day', done: false, badgeStyle: 'background:rgba(var(--lift-rgb),0.133);color:var(--lift)', cardio: null, note: null,
    });
    const swim = randView({ title: 'Swim Day', cardio: { type: 'Swim', detail: '20 min easy' }, note: 'Sometimes showing up is the workout.' }, [{ title: 'Swim Day' }], 'balanced');
    assert.deepEqual([swim.done, swim.badgeStyle, swim.cardio, swim.note], [true, 'background:rgba(var(--accent-rgb),0.133);color:var(--accent)', { blockCls: 'swim-block', labelCls: 'cardio-label-swim', type: 'Swim', detail: '20 min easy' }, 'Sometimes showing up is the workout.']);
    assert.deepEqual(randView({ title: 'Row', cardio: { type: 'Rower', detail: '10 min' } }, [], 'mystery').cardio, { blockCls: 'cardio-block', labelCls: 'cardio-label-general', type: 'Rower', detail: '10 min' });
    assert.equal(randView({ title: 'Row' }, [], 'mystery').badgeStyle, '', 'a goal with no colour gets none');
    // D262: the badge sits on its goal colour's tint, 34/255 as the old 22 alpha (docs/decisions/wildcard.md)
    assert.equal(randView({ title: 'Long Run' }, [], 'endurance').badgeStyle, 'background:rgba(var(--run-rgb),0.133);color:var(--run)');
  });

  it('counts the goal\'s own Wildcards done, out of the goal\'s pool', () => {
    assert.equal(randCount([{ title: 'Grip Day' }, { title: 'Mixed Day' }], POOLS, 'strength'), '1/2');
    assert.equal(randCount([{ title: 'Grip Day' }, { title: 'Mixed Day' }], POOLS, 'athletic'), '1/3');
    assert.equal(randCount([], POOLS, 'balanced'), '0/3');
  });
});
