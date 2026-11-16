// The Expo app's pop-ups against today's, swept (the integration file of this name walks HALF_MANNY; this walks the
// ten seeded programs of support/programs.ts). Each program goes from its first whole week to the day after its last
// (support/native-pop-ups.ts popLife): every scheduled day opened on both apps at its own date, the reminder compared
// and answered at each launch, each day whose deck opens marked done through it, with a seventh of the days and two
// whole weeks left unopened. Every pop-up raised is the same pop-up, whole, and after every step the beta's store
// holds every ia_ key equal to today's page's, value for value, with no family left out. The beta's store is its own
// from each program's first day: it is never copied from the page again, only compared with it.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { held } from '../support/native-deck-logging.ts';
import { popLife, popTally } from '../support/native-pop-ups.ts';
import { PROGRAMS } from '../support/programs.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';

test('the ten seeded programs, each from its first week to the day after its last: every pop-up is today\'s on every day it fires, and every ia_ key is equal after every step', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const T = popTally();
  const seasons: Record<string, number> = {};
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The seeded swim goal gets the timed 500 the wizard asks for, as tests/sweeps/stored-state.test.ts gives it.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    const before = T.tiers['season'] || 0;
    const { phone, store } = popLife(cfg, CREATED, T);
    seasons[name] = (T.tiers['season'] || 0) - before;
    assert.deepStrictEqual(held(store), phone.dump(), name + ': at the end the two stores are one');
    const id: string = phone.ev('activeProgId');
    assert.equal(store.get('ia_season_shown_' + id), '1', name + ': the season\'s mark is stored, in the beta as on the page');
  }
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ pops: T, seasons }));
  // The season fires once on every program: through the deck's Mark the day done where the last day opens one, and
  // through the reminder's Done the day after where it does not (a race day, a day whose only card is its cool down).
  assert.deepStrictEqual(Object.values(seasons), Array.from({ length: 10 }, () => 1), 'the season pop-up, once a program: ' + JSON.stringify(seasons));
  // Each kind was raised and compared. The floors sit under what was measured when this was written.
  assert.ok(T.launches >= 350 && T.checks >= 700 && T.marks >= 250, 'launches, checks and days marked: ' + JSON.stringify({ ...T, lines: undefined }));
  assert.ok((T.tiers['workout'] || 0) >= 200 && (T.tiers['streak'] || 0) >= 25 && (T.tiers['reminder'] || 0) >= 60, 'the tiers: ' + JSON.stringify(T.tiers));
  assert.ok(T.done >= 30 && T.skipped >= 8 && T.left >= 8 && T.longGaps >= 5 && T.mornings >= 70, 'the reminder\'s answers, the long gap, the mornings: ' + JSON.stringify({ ...T, lines: undefined }));
  assert.ok(Object.keys(T.lines).length >= 40, 'the lines drawn: ' + Object.keys(T.lines).length);
});
