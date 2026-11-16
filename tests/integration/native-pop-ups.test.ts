// The Expo app's pop-ups are today's (MIGRATION.md phase 3, the deck's fourth session; docs/decisions/swipe-deck.md,
// the pop-ups' entry): the completion pop-up with its workout, streak and season tiers, the day-after reminder and its
// answer, and the coach's nudge. Over HALF_MANNY (the ten seeded programs are tests/sweeps/native-pop-ups.test.ts):
//
// 1. The lines, the tier config, the button's words and the confetti's colours are the page's own, value for value.
// 2. A whole program, from its first whole week to the day after its last, on both apps (support/native-pop-ups.ts
//    popLife): every pop-up raised is the same pop-up, whole, on every day it fires, and after every step the beta's
//    store holds every ia_ key equal to today's page's, value for value, with no family left out.
// 3. The nudge: its words, Leave the plan alone, and Make the change, after which the program in hand and the store
//    are today's (the deck's walk, support/native-deck-logging.ts, answers every nudge that comes due the same way).
// 4. A backup loaded after a pop-up and after an accepted nudge leaves the store the file's, key for key and hash for
//    hash.
//
// The reference is today's page, on purpose: the page stays the reference until the cutover. The hand-typed values
// are in tests/unit/native-pop-ups.test.ts.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { POP_CFG, POP_DISMISS, POP_KNICKS, POP_POOLS } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { importBackup, misses } from '../../frontends/native/src/store/backup-import.ts';
import { fixtures } from '../support/app.ts';
import { held, tally } from '../support/native-deck-logging.ts';
import { both, swapDay } from '../support/native-deck-swap.ts';
import { popLife, popTally } from '../support/native-pop-ups.ts';
import { Phone, life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

test('the lines, the tiers, the button\'s words and the confetti\'s colours are the page\'s own', () => {
  const P = new Phone().launch(CREATED);
  const page = JSON.parse(P.ev('JSON.stringify({pools:POP_POOLS,cfg:POP_CFG,dismiss:POP_DISMISS,knicks:POP_KNICKS})') as string) as Record<string, unknown>;
  assert.deepStrictEqual(plain({ pools: POP_POOLS, cfg: POP_CFG, dismiss: POP_DISMISS, knicks: POP_KNICKS }), page);
  // The page holds something to compare: four pools, each with lines, four tiers, seven ways to wave it off.
  assert.deepStrictEqual(Object.keys(POP_POOLS).sort(), ['reminder', 'season', 'streak', 'workout']);
  assert.ok(Object.values(POP_POOLS).every((p) => p.length >= 3) && POP_DISMISS.length === 7 && Object.keys(POP_CFG).length === 4);
});

test('HALF_MANNY from its first week to the day after race day: every pop-up is today\'s on every day it fires, and every ia_ key is equal after every step', () => {
  const T = popTally();
  const { phone, store } = popLife(fixtures.HALF_MANNY, CREATED, T);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.pops', JSON.stringify(T));
  // Each kind was raised and compared. The floors sit under what was measured when this was written.
  assert.ok(T.launches >= 45 && T.checks >= 90, 'launches and checks: ' + JSON.stringify(T));
  assert.ok(T.marks >= 30 && (T.tiers['workout'] || 0) >= 25 && (T.tiers['streak'] || 0) >= 3, 'days marked, workout and streak pop-ups: ' + JSON.stringify(T));
  assert.equal(T.tiers['season'], 1, 'the season pop-up, once: ' + JSON.stringify(T.tiers));
  assert.ok(T.reminders >= 8 && T.done >= 4 && T.skipped >= 1 && T.left >= 1 && T.longGaps >= 1, 'reminders: asked, Done, Skip, left alone, and after more than a week: ' + JSON.stringify(T));
  assert.ok(T.mornings >= 8 && Object.keys(T.lines).length >= 12, 'morning launches, and the lines drawn: ' + JSON.stringify(T));
  // What the two stores hold at the end: every pop-up family, on both.
  const keys = Object.keys(held(store));
  for (const f of ['ia_pop_idx_', 'ia_pop_dismiss_', 'ia_season_shown_', 'ia_remind_last_', 'ia_reminded_']) assert.ok(keys.some((k) => k.startsWith(f)), 'the beta holds ' + f);
  assert.deepStrictEqual(held(store), phone.dump(), 'at the end the two stores are one');
});

test('a backup loaded after a pop-up and after an accepted nudge leaves the beta\'s store the file\'s, key for key and hash for hash', () => {
  let done = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week') return;
    const text = JSON.stringify(P.ev('backupSnapshot()'));
    const data = (JSON.parse(text) as { data: Record<string, string> }).data;
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    const T = tally();
    // n = 0: the day ends with one pair picked three times running, the nudge answered Make the change, then marked.
    const d = training(Q, week)[0]!;
    assert.ok(swapDay(Q, store, grid, week, d, 0, T));
    assert.ok(T.nudges >= 1 && T.accepted >= 1 && T.marks >= 1 && T.popups >= 1, 'a nudge accepted and a pop-up raised in the beta: ' + JSON.stringify(T));
    const differ = misses(store, data);
    assert.ok(differ.some((k) => /^ia_programs\b/.test(k)) && differ.some((k) => /^ia_swapct_/.test(k)) && differ.some((k) => /^ia_pop_idx_/.test(k)), 'the program, the count and the pop-up\'s pick are no longer the file\'s: ' + differ.join(', '));
    const prefs = (JSON.parse(store.get('ia_programs')!) as { id: string; cfg: { exSwapPrefs?: Record<string, string> } }[]).find((p) => p.id === grid.id)!.cfg.exSwapPrefs || {};
    assert.equal(Object.keys(prefs).length, 1, 'the preference is in the stored program: ' + JSON.stringify(prefs));
    const r = importBackup(store, text);
    assert.equal(r.ok, true, 'the backup loads');
    assert.deepStrictEqual(misses(store, data), [], 'no key differs from the file by value or by sha256');
    assert.deepStrictEqual(held(store), Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]])), 'the store holds the file\'s keys and no other');
    done++;
  });
  assert.equal(done, 1);
});
