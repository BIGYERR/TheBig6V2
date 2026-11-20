// The Expo app's Programs tab against today's page (MIGRATION.md phase 3, row 5), on each of the ten seeded programs:
// the list at each stretch of the standard history (the card opened, renamed four ways, the two confirm tiers); the
// goal sheet on every sport, every option but the current one switched to on a phone of its own, and the mile pencil
// with its refusals, a save and the chart's two edges, before anything is trained and after three weeks; then a
// second program beside it: Set Active, Archive and Delete Forever of the active one and of the other, down to both
// empty lists. After every tap every word and number of the list, what is kept between draws, the open sheet, each
// toast, the active program, the grid in hand after a switch or a rebuild and every ia_ key is equal to today's
// page, value for value, no family left out (support/native-program-list.ts). Every expected value here is today's
// page, on purpose.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { goalWalk, listTally, listWalk, mileWalk, twoWalk } from '../support/native-program-list.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
// A swim program's baseline as a walker can log it (support/native-deck.ts walkable).
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const names = Object.keys(PROGRAMS);
const L = listTally(), G = listTally(), M = listTally(), W = listTally();
const opened = { lock: 0, edit: 0, none: 0 };
let switches = 0;

for (const [i, name] of names.entries()) {
  const cfg = walkable(PROGRAMS[name]!);
  test(name + ': the list, the goal sheet and the mile pencil through the standard history, then a second program, the screens and the stores equal', () => {
    let stages = 0;
    const { phone } = life(cfg, CREATED, undefined, (stage, P) => {
      listWalk(P, L, name + ', ' + stage);
      if (stage === '0 generated' || stage === '3 third week') { switches += goalWalk(P, G, name + ', ' + stage); opened[mileWalk(P, M, name + ', ' + stage)]++; }
      if (stage === '4 after two weeks away') opened[mileWalk(P, M, name + ', ' + stage)]++;
      stages++;
    });
    assert.equal(stages, 5);
    twoWalk(phone, walkable(PROGRAMS[names[(i + 1) % names.length]!]!), W, name + ' and a second program');
  });
}

test('what the ten programs showed: every card, both sheets, every write', () => {
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ list: L, goal: G, mile: M, two: W, opened, switches }));
  const at = (T: Record<string, number>, k: string): number => T[k] || 0;
  // The list: 50 screens, 14 taps on each (listWalk), one card on every draw.
  assert.ok(at(L, 'taps') === 700 && at(L, 'card') === 700 && at(L, 'card: active') === 700, 'the list: ' + JSON.stringify(L));
  assert.ok(at(L, 'card: open') === 450 && at(L, 'card: being renamed') === 200 && at(L, 'card: confirm tier 1') === 50 && at(L, 'card: confirm tier 2') === 50, 'the open card, the rename, the two tiers: ' + JSON.stringify(L));
  // Three Saves a walk. A name cut at forty can end on a space, which the next Save trims off and stores: so more
  // than one Save in three stores, and the blank one never does.
  assert.ok(at(L, 'rename stored') + at(L, 'rename left as it was') === 150 && at(L, 'rename stored') >= 50 && at(L, 'rename left as it was') >= 50, 'the renames: ' + JSON.stringify(L));
  assert.ok(at(L, 'detail row') === 7000 && at(L, '1RM chip') === 2100 && at(L, 'seed printed') === 700 && at(L, 'meta icon') >= 1400, 'the detail: ' + JSON.stringify(L));
  assert.ok(at(L, 'pace group') === 560 && at(L, 'no pace group') === 140 && at(L, 'pace chip Goal') === 140 && at(L, 'pace chip Half') === 70 && at(L, 'pace chip Marathon') === 70 && at(L, 'pace chip with an effort') >= 1400, 'the paces: ' + JSON.stringify(L));
  assert.ok(at(L, 'sentence tail: every pace') === 280 && at(L, 'sentence tail: the pace goal') === 140 && at(L, 'sentence tail: the base') === 140, 'the sentence\'s three tails: ' + JSON.stringify(L));
  assert.ok(at(L, 'event group') === 280 && at(L, 'event: Time out in weeks') === 280 && at(L, 'cardio row') === 770, 'the event and the cardio rows: ' + JSON.stringify(L));
  // The goal sheet: 11 sheets a stretch and 52 switches (the measure's count), each on a phone of its own.
  assert.equal(switches, 104, 'every option but the current one, at two stretches');
  assert.ok(at(G, 'goal switched: rebuilt') === 104 && at(G, 'a program in hand compared') === 104 && at(G, 'goal sheet') === 126 && at(G, 'goal option') === 726, 'the goal sheets, every switch\'s grid compared: ' + JSON.stringify(G));
  assert.ok(at(G, 'goal decision: a step up') === 78 && at(G, 'goal decision: a plain switch') === 48 && at(G, 'goal decision: pace typed') === 12 && at(G, 'goal decision: time typed') === 2, 'the decisions: ' + JSON.stringify(G));
  assert.ok(at(G, 'goal decision: started') === 63 && at(G, 'goal decision: not started') === 63 && at(G, 'goal switch: the tap did nothing') === 14 && at(G, 'goal switch greyed') === 14, 'started or not, and a target missing: ' + JSON.stringify(G));
  // The mile pencil: 8 programs show it; the lock stands on 4 of them after two weeks away (the measure).
  assert.deepEqual(opened, { lock: 4, edit: 20, none: 6 }, 'what the pencil opened');
  assert.ok(at(M, 'mile saved: rebuilt') === 60 && at(M, 'mile saved with the chart\'s advice') === 40 && at(M, 'mile: the lock') === 4 && at(M, 'mile lock: the week alone') === 2 && at(M, 'mile lock: with the race') === 2, 'the mile: ' + JSON.stringify(M));
  assert.ok(at(M, 'mile refused: Put in both the minutes and the seconds.') === 40 && at(M, 'mile refused: That mile time is not a real time. Check the minutes and seconds.') === 20
    && at(M, 'mile refused: Under 3:00 is not a mile time. The world record is 3:43. Check the entry.') === 20 && at(M, 'mile refused: Over 25:00 reads as a walk, not a run. Check the entry.') === 20, 'the refusals: ' + JSON.stringify(M));
  assert.ok(at(M, 'sentence: edited from a time') === 60 && at(M, 'sentence: clamped fast') === 20 && at(M, 'sentence: clamped slow') === 20, 'the sentence after a save: ' + JSON.stringify(M));
  // Two programs: Set Active (and again on the one already active), the three ways out by Archive and by Delete Forever.
  assert.ok(at(W, 'switch: Set Active') === 20 && at(W, 'Set Active refused') === 20 && at(W, 'switch: past days marked as asked') === 10, 'Set Active: ' + JSON.stringify(W));
  assert.ok(at(W, 'archive: not the active program') === 10 && at(W, 'archive: the active one hands on') === 10 && at(W, 'archive: the last one, no active program left') === 10, 'Archive: ' + JSON.stringify(W));
  assert.ok(at(W, 'delete: not the active program') === 10 && at(W, 'delete: the active one hands on') === 10 && at(W, 'delete: the last one, no active program left') === 10 && at(W, 'delete: keys removed') >= 120, 'Delete Forever: ' + JSON.stringify(W));
  assert.ok(at(W, 'a program in hand compared') === 40 && at(W, 'no program left in hand') === 20, 'each switch\'s grid compared: ' + JSON.stringify(W));
  assert.ok(at(W, 'tab opened') === 20 && at(W, 'tab refused: no active program') === 20, 'This Week and Progress, with an active program and with none: ' + JSON.stringify(W));
  assert.ok(at(W, 'empty: archived') === 40 && at(W, 'empty: none') === 10 && at(W, 'card: not active') >= 170 && at(W, 'goal switched: stored alone') === 10 && at(W, 'mile saved: stored alone') === 4, 'the empty lists, and a program that is not active: ' + JSON.stringify(W));
});
