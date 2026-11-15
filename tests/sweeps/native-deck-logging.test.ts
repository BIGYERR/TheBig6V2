// The Expo deck's logging against today's, swept (the integration file of this name walks HALF_MANNY; this walks the
// ten seeded programs of support/programs.ts). Each program goes through the standard history (support/stored-state.ts
// life), and at each of its five stretches every training day of the week in view is worked through its deck on both
// apps, the stores, the fields and the toasts held equal after every tap (support/native-deck-logging.ts). Every
// launch a phone makes here is a launch of the beta's seam too (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { held, tally, workDay } from '../support/native-deck-logging.ts';
import { launches } from '../support/native-launch.ts';
import { launchNow, nativeGrid } from '../support/native-this-week.ts';
import { PROGRAMS } from '../support/programs.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const pad = (n: number): string => String(n).padStart(2, '0');
const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

test('the ten seeded programs: every training day of the week in view, at each stretch, worked through its deck on both apps', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const T = tally();
  let stages = 0;
  const before = launches.compared;
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    let n = 0;
    life(cfg, CREATED, undefined, (stage, P) => {
      const pre = P.dump();
      const Q = new Phone();
      for (const [k, v] of Object.entries(pre)) Q.damage(k, v);
      Q.launch(iso(launchNow(P)));
      const store = sqliteTestStore();
      for (const [k, v] of Object.entries(pre)) store.set(k, v);
      const grid = nativeGrid(Q, store) as unknown as DeckProgram;
      assert.deepStrictEqual(held(store), Q.dump(), name + ', ' + stage + ': after its own launch the beta holds the keys today\'s launch left');
      const week: number = Q.ev('calcCurrentWeek()');
      for (const d of training(Q, week)) workDay(Q, store, grid, week, d, n++, T);
      Q.launch(iso(new Date(launchNow(Q).getTime() + 86400000)));
      stages++;
    });
  }
  assert.equal(stages, 50);
  assert.ok(launches.compared - before >= 150, 'each launch here was a launch of the beta\'s seam too: ' + JSON.stringify(launches));
  // HALF_MANNY alone makes 24 days and 1,246 taps (the integration file); ten programs make several times that.
  assert.ok(T.days >= 100 && T.taps >= 4000 && T.checks >= T.taps, JSON.stringify(T));
  assert.ok(T.logs >= 60 && T.dones >= 200 && T.commits >= 150 && T.skips >= 80 && T.undos >= 60 && T.marks >= 100 && T.pills >= 30 && T.popups >= 60, JSON.stringify(T));
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ walk: T, launches }));
});
