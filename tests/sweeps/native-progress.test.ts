// The Expo app's Progress against today's page (MIGRATION.md phase 3, row 4), on each of the ten seeded programs:
// the screen opened and the estimator worked at each stretch of the standard history; then three weeks of runs
// logged with a pace, an effort, a swap and a jog, and one and two weeks of the same (the standard history stores no
// pace, so of the run cards only the ladder shows on it; fewer weeks draw the cards that stand in for a trend); then a second program beside it, the first archived, restored, archived again and deleted
// forever. After every tap every word and number of the screen, what is kept between draws, each toast and every
// ia_ key is equal to today's page, value for value, no family left out (support/native-progress.ts). Every
// expected value here is today's page, on purpose.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { chipsWalk, openBoth, progressTally, runsLife } from '../support/native-progress.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
// A swim program's baseline as a walker can log it (support/native-deck.ts walkable).
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const names = Object.keys(PROGRAMS);
const S = progressTally(), R = progressTally(), C = progressTally();

for (const [i, name] of names.entries()) {
  const cfg = walkable(PROGRAMS[name]!);
  test(name + ': Progress at each stretch of the standard history, the screens and the stores equal', () => {
    let stages = 0;
    const { phone } = life(cfg, CREATED, undefined, (stage, P) => { openBoth(P, S, name + ', ' + stage); stages++; });
    assert.equal(stages, 5);
    // The same phone with a second program beside it: the next of the ten.
    chipsWalk(phone, walkable(PROGRAMS[names[(i + 1) % names.length]!]!), C, name + ' and a second program');
  });
  test(name + ': one, two and three weeks of runs with a pace, a swap and a jog, the run cards and the journal equal', () => {
    for (const weeks of [1, 2, 3]) openBoth(runsLife(cfg, CREATED, weeks).phone, R, name + ', ' + weeks + ' weeks of runs');
  });
}

test('what the ten programs showed: every kind of chart, the ledger\'s three cards, the journal\'s four lines, both writes', () => {
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ standard: S, runs: R, chips: C }));
  assert.ok(S.draws === 250 && S.empties === 50 && S.ledgers === 200, 'the standard history: 50 screens, five taps on each: ' + JSON.stringify(S));
  assert.ok(S.mains >= 400 && S.lines >= 20 && S.ladder >= 600 && S.other >= 200 && S.dots >= 350, 'the ledger and the dot charts: ' + JSON.stringify(S));
  assert.ok(S.journalEntries >= 900 && S.notes >= 300 && S.estimates >= 150 && S.estimatesEmpty >= 50, 'the journal and the estimator: ' + JSON.stringify(S));
  // Each of today's eight run cards, by the walk that draws it: one week of runs (the easy effort's empty state), two
  // (the easy bands), three (the zone chart, the trend, the drift), and a run base program (the easy effort chart and
  // where it is heading).
  for (const k of ['Long Run Ladder', 'Is Your Easy Actually Easy?', 'Is Your Easy Actually Easy? (the easy bands)', 'Recovery Pace — Easy-Effort Trend', 'Same Effort, More Speed',
    'Same Effort, More Speed (its empty state)', 'Where This Is Heading', 'Mileage — Drift From Plan']) assert.ok((R.cardKinds[k] || 0) >= 5, 'the run card ' + k + ': ' + JSON.stringify(R.cardKinds));
  assert.ok(R.swaps >= 30 && R.jogs >= 100 && R.notes >= 30, 'the journal\'s swap, jog and note lines: ' + JSON.stringify(R));
  assert.ok(C.restores === 10 && C.deletes === 10 && C.confirms === 20 && C.warned >= 2 && C.removed >= 100 && C.chips >= 200 && C.bars >= 50, 'the chips, the bar and the two writes: ' + JSON.stringify(C));
});
