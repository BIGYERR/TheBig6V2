// The Expo deck's swap sheet against today's, swept (the integration file of this name walks HALF_MANNY; this walks
// the ten seeded programs of support/programs.ts). Each program goes through the standard history
// (support/stored-state.ts life), and at each of its five stretches: every swap sheet of every day of the live grid
// is today's, whole; and every training day of the week in view is worked through its deck on both apps with swaps
// among the logging, the stores, the fields, the cards and the toasts held equal after every tap
// (support/native-deck-swap.ts). Every launch a phone makes here is a launch of the beta's seam too
// (support/native-launch.ts), so each launch after swapped days is compared as well.
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { tally } from '../support/native-deck-logging.ts';
import { both, everySheet, iso, swapDay } from '../support/native-deck-swap.ts';
import { launches } from '../support/native-launch.ts';
import { launchNow } from '../support/native-this-week.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';

test('the ten seeded programs: every swap sheet of the live grid at each stretch, and every training day of the week in view worked through its deck with swaps on both apps', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const S = tally(), T = tally();
  let stages = 0;
  const before = launches.compared;
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    let n = 0;
    life(cfg, CREATED, undefined, (stage, P) => {
      const { Q, store, grid } = both(P);
      everySheet(Q, store, grid, S, name + ', ' + stage);
      const week: number = Q.ev('calcCurrentWeek()');
      for (const d of training(Q, week)) swapDay(Q, store, grid, week, d, n++, T);
      Q.launch(iso(new Date(launchNow(Q).getTime() + 86400000)));
      stages++;
    });
  }
  assert.equal(stages, 50);
  assert.ok(launches.compared - before >= 150, 'each launch here was a launch of the beta\'s seam too: ' + JSON.stringify(launches));
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ sheets: S, walk: T, launches }));
  // tests/measure/native-deck-swap_writes.md counts 12,131 moves that offer a swap over these fifty launches, 46 of
  // them with no row to pick. The floors sit under what was measured when this was written.
  assert.ok(S.sheets >= 12000 && S.rows >= 120000 && S.empty >= 40, 'every sheet: ' + JSON.stringify({ sheets: S.sheets, rows: S.rows, empty: S.empty }));
  assert.ok(T.days >= 100 && T.checks >= T.taps && T.picks >= 400 && T.unswaps >= 250 && T.nudges >= 30, 'the walk: ' + JSON.stringify(T));
  // Measured: 1,083 picks that keep their numbers, 59 onto a lift with no load, 12 onto a lift whose window moves the
  // reps, and 1 held by an injury plan.
  assert.ok((T.swapToasts['same'] || 0) >= 300 && (T.swapToasts['no load'] || 0) >= 10 && (T.swapToasts['window'] || 0) >= 5, 'the toasts: ' + JSON.stringify(T.swapToasts));
  assert.ok(Object.keys(T.swapToasts).some((k) => / held$/.test(k)), 'a pick held by an injury plan: ' + JSON.stringify(T.swapToasts));
});
