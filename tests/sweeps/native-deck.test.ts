// The swipe deck in the Expo app against today's deck, over the ten seeded programs (tests/integration/native-deck.test.ts
// holds HALF_MANNY alone, inside the 60-second check; this is the same comparison across every kind of program the
// suite seeds: the four race plans, the two test goals, the base, the bike, the swim and the two-sport program). Each
// one through the standard history, and at each of its five launches every training day of every week: the Expo app's
// cards equal to today's, whole, and Start opening the same deck or none. CI only.
//
// The grid each draw stands on is the Expo app's own, from its own launch (liveProgram, core's refreshStoredProgram).
// Measured before the build (tests/measure/native-deck_days.md): 50 launches, 2,755 training days, 2,628 decks, 95 days
// whose only card is the cool down, 9,582 cards.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { type DayDeck, everyDeck, seen } from '../support/native-deck.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';

test('the ten seeded programs through the standard history: every training day of every week, the Expo app\'s deck is today\'s', () => {
  assert.equal(Object.keys(PROGRAMS).length, 10);
  const tally = seen();
  let launches = 0;
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The swim goal gets a timed 500, as tests/sweeps/stored-state.test.ts gives it: the wizard requires one.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    life(cfg, CREATED, undefined, (stage, P) => {
      launches++;
      const before = P.dump();
      everyDeck(P, (native: DayDeck, page: DayDeck, what: string) => {
        assert.deepStrictEqual(native.cards, page.cards, name + ', ' + stage + ', ' + what + ': the cards');
        assert.deepStrictEqual(native.view, page.view, name + ', ' + stage + ', ' + what + ': the deck Start opens');
      }, tally);
      assert.deepStrictEqual(P.dump(), before, name + ', ' + stage + ': drawing today\'s deck left the phone\'s keys as they were');
    });
  }
  assert.equal(launches, 50);
  // The measure's counts, as floors: a comparison that stopped drawing is red, a ruling that moves a card is not.
  assert.ok(tally.days >= 2700 && tally.decks >= 2600 && tally.coolOnly >= 90, 'days, decks and cool down only days: ' + JSON.stringify(tally));
  assert.ok(tally.cards >= 9500 && tally.lift >= 4500 && tally.round >= 3200 && tally.block >= 1700 && tally.cool >= 110, 'each kind of card: ' + JSON.stringify(tally));
  assert.ok(tally.logged >= 200 && tally.skipped >= 20 && tally.swapped >= 25 && tally.added >= 35, 'logged, skipped, swapped in and added: ' + JSON.stringify(tally));
  assert.ok(tally.reuse >= 1200 && tally.stale >= 240 && tally.warned >= 180, 'reuse pills, stale ones and the warning: ' + JSON.stringify(tally));
});
