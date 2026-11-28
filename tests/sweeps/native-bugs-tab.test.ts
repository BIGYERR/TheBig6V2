// The Expo app's Bugs tab is today's, on the ten seeded programs (tests/integration/native-bugs-tab.test.ts has
// HALF_MANNY at each stretch, and the proofs' list). Each program's phone on its third week is walked whole on both
// apps (support/native-bugs-tab.ts), and loads the next program's backup, saved by today's page: after every tap the
// stores hold each ia_ key equal, and every load is followed by its start afresh on both.
//
// The reference is today's page, on purpose. No key is left out. No report is sent: the form is a stand-in.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { type Keys, bugsTally, keysOf, todaysBackup, walkBugs } from '../support/native-bugs-tab.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const J = JSON.stringify;
// The swim goals of the seeded programs carry no base time, which the standard history's walk needs (as the other sweeps).
const walkable = (seeded: any): any => (seeded.cardioGoals && seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);

test('the ten seeded programs: the Bugs tab worked through on both apps, each loading the next one\'s backup', async () => {
  const names = Object.keys(PROGRAMS);
  assert.equal(names.length, 10);
  const thirds: Keys[] = [];
  for (const cfg of Object.values(PROGRAMS)) {
    life(walkable(cfg), CREATED, undefined, (stage, P) => { if (stage === '3 third week') thirds.push(keysOf(P)); });
  }
  assert.equal(thirds.length, 10);
  const T = bugsTally();
  for (const [i, from] of thirds.entries()) await walkBugs(from, todaysBackup(thirds[(i + 1) % 10]!, 'day'), T, names[i]!);
  // A program's walk, typed in the integration file: 11 looks, 5 launch reads, 9 reports, 3 saves, 22 picks, 21 taps
  // of Load it, 5 starts afresh.
  assert.deepStrictEqual([T.looks, T.launches, T.sends, T.saves, T.shareFails, T.picks, T.cancels, T.loads, T.refused, T.restarts, T.crossed],
    [11, 5, 9, 3, 1, 22, 1, 21, 1, 5, 2].map((n) => n * 10), J(T));
  for (const k of ['look on: auto', 'look on: day', 'look on: night', 'save: a file', 'save: nothing to back up', 'load: afresh', 'load: refused', 'afresh: week', 'afresh: home',
    'status: sent', 'status: failed', 'status: network', 'report: a program', 'report: no program', 'pick: the beta\'s own kind']) {
    assert.ok((T.kinds[k] || 0) >= 10, k + ': ' + J(T.kinds));
  }
  assert.ok(T.checks >= 700, 'the stores were held equal after every tap: ' + T.checks);
}, 300000);
