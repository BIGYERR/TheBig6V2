// This Week in the Expo app against today's screen, over the ten seeded programs (tests/integration/native-this-week.test.ts
// holds HALF_MANNY alone, inside the 60-second check; this is the same comparison across every kind of program the
// suite seeds: the four race plans, the two test goals, the base, the bike, the swim and the two-sport program). Each
// one through the standard history, and at each of its five launches every week title, with the launch's own pick and
// with each column picked: the Expo app's draw equal to today's, whole. CI only.
//
// The grid each draw stands on is the Expo app's own, from its own launch (liveProgram, core's refreshStoredProgram),
// held equal to the page's at each of the 50 launches. And every launch tests/sweeps/stored-state.test.ts makes (the
// ten programs, the three time zones, the lattice sample; its tests run here too, under the import of
// support/native-launch.ts) is a launch of the seam as well: the same program as the page's, nothing written.
process.env['TZ'] = 'America/New_York';
import { launches as seamLaunches } from '../support/native-launch.ts';
import './stored-state.test.ts';
import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { everyDraw, nativeGrid, pageGrid, seen } from '../support/native-this-week.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';

// First among this file's own tests, so it reads what the stored-state sweeps launched above it. The ten programs
// alone make 114 launches a walk, 104 with a program, and a key written on 10 (tests/measure/native-this-week_launch.md,
// section 1a); that file walks them twice, then the zones and the lattice sample. The floors are one walk's numbers.
test('every launch of the stored-state sweeps was a launch of the Expo app\'s seam too, and each one agreed', () => {
  assert.ok(seamLaunches.compared >= 104, 'launches with a program, the seam\'s equal to the page\'s: ' + JSON.stringify(seamLaunches));
  assert.ok(seamLaunches.none >= 10, 'launches with no program on either side: ' + JSON.stringify(seamLaunches));
  assert.ok(seamLaunches.wrote >= 10, 'launches where core\'s launch wrote a key, each left as the page left it: ' + JSON.stringify(seamLaunches));
});

test('the ten seeded programs through the standard history: every title and every picked day, the Expo app\'s screen is today\'s', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const tally = seen();
  let launches = 0, expected = 0;
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The swim goal gets a timed 500, as tests/sweeps/stored-state.test.ts gives it: the wizard requires one.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    life(cfg, CREATED, undefined, (stage, P) => {
      launches++;
      expected += ((P.prog.totalWeeks || 6) + 1) * 9;
      assert.deepStrictEqual(nativeGrid(P), pageGrid(P), name + ', ' + stage + ': the launch\'s grid is the page\'s');
      everyDraw(P, (native, page, what) => assert.deepStrictEqual(native, page, name + ', ' + stage + ', ' + what), tally);
    });
  }
  assert.equal(launches, 50);
  assert.equal(tally.draws, expected);
  // Every kind of thing the screen shows was drawn somewhere: a start row too, on the programs with no race.
  for (const k of ['cards', 'rests', 'done', 'skipped', 'wild', 'injury', 'travel', 'race'] as const) {
    assert.ok(tally[k] > 0, 'the draws held ' + k + ': ' + JSON.stringify(tally));
  }
  assert.ok(tally.race < tally.draws, 'some programs have no race: the Program start row was drawn');
});
