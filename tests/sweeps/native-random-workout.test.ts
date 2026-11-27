// The Expo app's Random Workout against today's, swept (the integration file of this name walks HALF_MANNY; this
// walks the ten seeded programs of support/programs.ts, whose goals draw from all five pools and, for the two
// endurance programs, from the balanced pool a goal with none of its own falls back to). Each program goes through
// the standard history (support/stored-state.ts life), and at each of its five stretches the sheet is worked through
// on both apps twice, with no day opened since the launch and with one opened first: the stores, the fields, the
// sheet and the toasts held equal after every tap, and each Complete raising the same pop-up on both
// (support/native-random-workout.ts). On each program's third week every workout of See All is shown on both.
// Every launch a phone makes here is a launch of the beta's seam too (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import type { RandProgram } from '../../frontends/native/src/random-workout/random-screen.ts';
import { both } from '../support/native-deck-swap.ts';
import { TwoRandoms, randTally, walkRandom } from '../support/native-random-workout.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const J = JSON.stringify;

test('the ten seeded programs: Random Workout worked through on both apps at each stretch, and every workout of See All shown on both in the third week', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const T = randTally(), S = randTally();
  const goals: Record<string, number> = {};
  let stages = 0, n = 0;
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    life(cfg, CREATED, undefined, (stage, P) => {
      for (const day of [false, true]) {
        const { Q, store, grid } = both(P);
        walkRandom(Q, store, grid as RandProgram, n++, T, name + ', ' + stage + (day ? ', a day opened first' : ', no day opened'), { day });
      }
      if (stage === '3 third week') {
        const { Q, store, grid } = both(P);
        const R = new TwoRandoms(Q, store, grid as RandProgram, 31 + n, S, name + ', every workout');
        for (let i = 0; i < 149; i++) R.show(i);
        goals[String((grid as RandProgram).goal)] = (goals[String((grid as RandProgram).goal)] || 0) + 1;
      }
      stages++;
    });
  }
  assert.equal(stages, 50);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], J({ walk: T, shown: S, goals }));
  // Typed from the seeded programs' goals (tests/measure/native-row7_today.md, section B): two of the ten have no
  // pool of their own.
  assert.deepStrictEqual(goals, { athletic: 2, balanced: 3, endurance: 2, fatloss: 1, hypertrophy: 1, strength: 1 });
  assert.equal(S.shown, 1490, J(S));
  // Each kind of tap was made and compared. The floors sit under what was measured when this was written.
  assert.ok(T.checks >= T.taps && T.taps >= 1500, J(T));
  assert.ok(T.opens >= 180 && T.filters >= 300 && T.draws >= 800 && T.daysOpened >= 50, J(T));
  assert.ok(T.sheets >= 90 && T.picks >= 90 && T.unswaps >= 45, 'swaps: ' + J(T));
  assert.ok(T.skips >= 140 && T.undos >= 80 && T.steps >= 150 && T.typed >= 140 && T.logs >= 160, 'the minus and set logging: ' + J(T));
  assert.ok(T.resets >= 50 && T.completes >= 90 && T.weeks >= 90, 'the reset and Complete: ' + J(T));
  for (const k of ['a training day → Streak: N.', 'a rest day → Streak holds.']) assert.ok((T.landed[k] || 0) >= 10, k + ': ' + J(T.landed));
  for (const k of ['head: not done', 'cardio: run-block', 'note', 'section: block', 'section: round', 'section: a skipped round', 'item: skipped', 'card: swapped in', 'card: logged on the day in hand',
    'card: a reuse pill', 'card: a stale reuse pill', 'card: the stale warning spoken']) assert.ok((T.kinds[k] || 0) + (S.kinds[k] || 0) >= 1, k + ' was never drawn: ' + J(T.kinds));
});
