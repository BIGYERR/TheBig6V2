// The Expo app's Bugs tab is today's (MIGRATION.md phase 3, row 7, the second session; the rulings are today's and
// keep their D-codes: D261, docs/decisions/night-mode.md; D264 and D289, docs/decisions/data-backup.md; and one of
// its own, D297 P-NEXTKIND: the file the beta saves carries a kind of its own, which today's app turns away). Proofs
// over HALF_MANNY's standard history (the ten seeded programs are tests/sweeps/native-bugs-tab.test.ts):
//
// 1. The tab worked through on both apps at each of the five stretches (support/native-bugs-tab.ts): after every tap
//    the stores hold each ia_ key equal, the toasts are the same, and the look, the line under Your data, its
//    question and the bug report read the same. Every load is followed by its start afresh on both.
// 2. A phone with nothing on it: nothing to save, a report with no program, and a backup loaded onto it.
// 3. D297 on today's page, by itself: the file the beta saves is turned away with no question and no key changed,
//    and the same file under today's kind is asked about and loads.
//
// The reference is today's page, on purpose. No key is left out. No report is sent: the form is a stand-in.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { VERSION } from '@ia/core';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import { saveBackup } from '../../frontends/native/src/bugs/bugs-writes.ts';
import { fixtures } from '../support/app.ts';
import { type Keys, bugsTally, keysOf, todaysBackup, walkBugs, walkEmpty } from '../support/native-bugs-tab.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const J = JSON.stringify;

/** Each stretch of a program's standard history, as keys a walk is handed. */
function stretches(cfg: unknown): Record<string, Keys> {
  const out: Record<string, Keys> = {};
  life(cfg as never, CREATED, undefined, (stage, P) => { out[stage] = keysOf(P); });
  return out;
}
/** Another phone's backup, saved by today's page under the Day look: a second seeded program on its third week. */
function another(): { text: string; from: Keys } {
  const other = Object.values(PROGRAMS).find((c) => J(c) !== J(fixtures.HALF_MANNY))!;
  const from = stretches(other)['3 third week']!;
  return { text: todaysBackup(from, 'day'), from };
}

test('HALF_MANNY: the Bugs tab worked through on both apps at each stretch, every load followed by its start afresh', async () => {
  const T = bugsTally();
  const half = stretches(fixtures.HALF_MANNY), other = another();
  const names = Object.keys(half);
  assert.deepStrictEqual(names, ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away']);
  for (const stage of names) await walkBugs(half[stage]!, other.text, T, stage);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.bugs', J(T));
  // Typed from the walk's own list of steps, a stretch at a time: 8 looks tapped, 2 more around the beta's own
  // save and 1 at the end; 5 launch reads; 9 reports (2 with nothing typed, 5 answers, 1 after a load, 1 with no
  // program); 2 saves and one with nothing to save; one share that fails; 22 picks (13 files turned away, the other
  // phone's backup 4 times with one bad file between, and 4 more files loaded) and 21 taps of Load it (13 after a
  // file turned away, 1 after Cancel, 1 refused, 1 after the bad file, and 5 that load); 5 starts afresh; each
  // app shown the other's file at both saves.
  assert.deepStrictEqual([T.looks, T.launches, T.sends, T.saves, T.shareFails, T.picks, T.cancels, T.loads, T.refused, T.restarts, T.crossed],
    [11, 5, 9, 3, 1, 22, 1, 21, 1, 5, 2].map((n) => n * 5), J(T));
  const K = T.kinds;
  // Every kind of thing the screen can draw, drawn and compared. The floors sit under what was measured.
  for (const k of ['look on: auto', 'look on: day', 'look on: night',
    'block: no line', 'block: That file is not an Asylum backup.', 'block: This backup is from a newer app. Update the app first.',
    'block: Backup from a day. N programs. Loading it replaces everything on this phone., asked', 'pick: the beta\'s own kind',
    'save: a file', 'save: nothing to back up', 'load: afresh', 'load: refused', 'load: nothing waiting', 'afresh: week', 'afresh: home',
    'status: empty, nothing sent', 'status: sent', 'status: failed', 'status: network', 'report: a program', 'report: no program']) {
    assert.ok((K[k] || 0) >= 5, k + ' was drawn fewer than five times: ' + J(K));
  }
  // What each tap wrote, by family: a look writes its one key or nothing, a load every family, and nothing else writes.
  for (const k of Object.keys(T.wrote)) assert.ok(/^(look|Load it)/.test(k), 'only a look and a load write: ' + k);
  assert.ok(T.wrote['look night → ia_theme']! >= 5 && T.wrote['look auto → ia_theme']! >= 5 && T.wrote['look another word → ia_theme']! >= 5, J(T.wrote));
  assert.ok(T.wrote['look night → nothing']! >= 5, 'the look tapped twice writes nothing the second time: ' + J(T.wrote));
  assert.equal(T.wrote['Load it, refused → nothing'], 5, J(T.wrote));
  assert.ok(T.checks >= 350, 'the stores were held equal after every tap: ' + T.checks);
}, 120000);

test('a phone with nothing on it: nothing to save, a report with no program, then a backup loaded onto it', async () => {
  const T = bugsTally(), other = another();
  await walkEmpty(new Date(2026, 10, 27, 12, 0, 0), other.text, T, 'an empty phone');
  assert.deepStrictEqual([T.looks, T.sends, T.saves, T.picks, T.loads, T.restarts], [3, 2, 1, 1, 1, 1], J(T));
  assert.equal(T.kinds['report: no program'], 1, J(T.kinds));
  assert.equal(T.kinds['report: a program'], 1, J(T.kinds));
  assert.equal(T.kinds['afresh: week'], 1, J(T.kinds));
  // Day is drawn on twice: at its own tap, and again as the tab opens after the load, from the file's own look.
  assert.equal(T.kinds['look on: day'], 2, 'the look the file carries is the look after the load: ' + J(T.kinds));
});

test('D297 on today\'s page: the beta\'s file is turned away with no question and no key changed; the same file under today\'s kind loads', async () => {
  const half = stretches(fixtures.HALF_MANNY)['3 third week']!, other = another();
  // The beta's own save of the other phone's keys, from a plain store: core's snapshot under the beta's kind.
  const mine = saveBackup(memoryStore(other.from.keys), VERSION, other.from.at);
  assert.equal(mine.how, 'file');
  if (mine.how !== 'file') return;
  const P = new Phone();
  for (const [k, v] of Object.entries(half.keys)) P.damage(k, v);
  P.launch(CREATED.replace('08-29', '09-20'));
  const before = P.dump();
  const shown: [string, boolean][] = [], reloads: number[] = [];
  (P.IA.ctx as Record<string, unknown>)['__seen'] = { show: (m: unknown, a: unknown) => { shown.push([String(m), !!a]); }, reload: () => { reloads.push(1); } };
  P.ev('_backupShow=(function(o){return function(m,a){__seen.show(m,a);return o.apply(this,arguments);};})(_backupShow);location.reload=function(){__seen.reload();};');
  const pick = async (text: string): Promise<void> => {
    (P.IA.ctx as Record<string, unknown>)['__in'] = { files: [{ text: () => Promise.resolve(text) }] };
    P.ev('backupFileChosen(__in)');
    await new Promise((r) => setTimeout(r, 0));
  };
  await pick(mine.text);
  // Typed by hand: today's words for a file that is not its own, and no question.
  assert.deepStrictEqual(shown, [['That file is not an Asylum backup.', false]]);
  P.ev('backupLoadIt()');
  assert.deepStrictEqual(P.dump(), before, 'Load it after the beta\'s file changes no key');
  assert.equal(reloads.length, 0);
  // The control: the same file under today's kind is asked about, and Load it replaces every key with the file's.
  await pick(J({ ...(JSON.parse(mine.text) as object), kind: 'asylum-backup' }));
  assert.equal(shown[shown.length - 1]![1], true, 'the same file under today\'s kind draws the question');
  P.ev('backupLoadIt()');
  assert.deepStrictEqual(P.dump(), Object.fromEntries(Object.entries(other.from.keys).sort()), 'and loads, every key the file\'s');
  assert.equal(reloads.length, 1);
});
