// The exercise bench: how the movements Mario's screenshot harvest added are read by the rules that judge a name.
// Rulings (docs/decisions/exercise-bench.md):
//   D239 (P-BENCH-PREHAB, v0.241.0) thirteen prehab movements join the foot & ankle and hip blocks. Every one is
//        prehab, so the movement classifier (_pattern) returns null for it by an explicit rule (V178), never by
//        falling through: three of them would otherwise read as training patterns ('Split-squat heel-raise hold' and
//        'Cossack squat shift' as squat, 'Glute bridge hold' as hip extension).
//
// Oracles are typed by hand from the ruling. The timed-or-counted table guards behaviour that must not change: the
// classifier for timed holds (isTimeExercise) is keyword based and was not edited, so it passes on v0.240.1 too.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction } from '../support/app.ts';

const _pattern = appFunction<(n: string) => string | null>('_pattern');
const isTimeExercise = appFunction<(n: string) => boolean>('isTimeExercise');

const PREHAB = [
  'Single-leg balance hold (eyes closed)', 'Single-leg KB pass-around', 'Kettlebell tibialis raise (seated)',
  'Split-squat heel-raise hold', 'Knee-to-wall ankle rocks', 'Towel scrunches', 'Tiptoe walks',
  'Copenhagen plank (bent knee)', 'Side plank (top leg raised)', 'Glute bridge hold',
  'Cossack squat shift', 'Half-kneeling hip flexor stretch', 'Pigeon lift-offs',
];

test('every one of the thirteen prehab names is prehab to the movement classifier, never a training pattern', () => {
  for (const n of PREHAB) assert.equal(_pattern(n), null, n);
});

test('the three names the classifier used to misread are null, and the movements they resemble keep their pattern', () => {
  assert.equal(_pattern('Split-squat heel-raise hold'), null);
  assert.equal(_pattern('Cossack squat shift'), null);
  assert.equal(_pattern('Glute bridge hold'), null);
  // the exemption is by name, so the loaded movements beside them are untouched
  assert.equal(_pattern('Dumbbell goblet squat'), 'squat');
  assert.equal(_pattern('Single-leg glute bridge'), 'hip_ext');
  assert.equal(_pattern('Dumbbell Bulgarian split squat'), 'lunge');
});

test('the holds and planks are timed, the drills counted in reps or yards are not (guards behaviour that must not change)', () => {
  const TIMED = ['Single-leg balance hold (eyes closed)', 'Split-squat heel-raise hold', 'Copenhagen plank (bent knee)',
    'Side plank (top leg raised)', 'Glute bridge hold'];
  for (const n of PREHAB) assert.equal(isTimeExercise(n), TIMED.includes(n), n);
});
