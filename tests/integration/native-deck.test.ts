// The swipe deck in the Expo app (MIGRATION.md phase 3, the first screen; D275 and D283 carried over,
// docs/decisions/swipe-deck.md) against today's deck, on the booted page. The reference is today's on purpose: the
// Angular deck's own models fed by the legacy page's own functions (support/native-deck.ts pageDay), which the Expo
// app's deck must equal until the cutover deletes the page. The Expo side is frontends/native/src/deck/deck-screen.ts
// over core's store and over the grid its own launch hands back.
//
// 1. HALF_MANNY through the standard history (support/stored-state.ts life): at each of its five launches, every
//    training day of every week draws the same cards, whole (each card's words, its moves, every set row, the load
//    field, the reuse pill), and Start opens the same deck or none.
// 2. What that history never holds (tests/measure/native-deck_days.md: no set draft, no load from another program):
//    a draft, a day done with its effort and notes, loads gone stale, a second program in kilograms reusing the
//    first one's loads, each built on the page by the app's own handlers.
// 3. A lift log holding an old key: today's page folds it into today's key as it launches and stores that; the Expo
//    app, which writes nothing, draws the same cards from the keys as they stood before.
// 4. Nothing is written: the store's keys are the phone's, to the byte, after every draw.
// The ten seeded programs are tests/sweeps/native-deck.test.ts (CI).
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { liveProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { fixtures } from '../support/app.ts';
import { DAYS7, type DayDeck, everyDeck, nativeDay, pageDay, seen } from '../support/native-deck.ts';
import { launchNow } from '../support/native-this-week.ts';
import { Phone, at, cards, firstWeek, life, trainDay, training } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';
const QUIET = { overlay: () => {}, freeze: () => {}, rebuild: () => {} };
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));
const same = (stage: string) => (native: DayDeck, page: DayDeck, what: string): void => {
  assert.deepStrictEqual(native.cards, page.cards, stage + ', ' + what + ': the cards');
  assert.deepStrictEqual(native.view, page.view, stage + ', ' + what + ': the deck Start opens');
};

test('HALF_MANNY through the standard history: every training day of every week, the Expo app\'s deck is today\'s', () => {
  const tally = seen();
  const stages: string[] = [];
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    stages.push(stage);
    const before = P.dump();
    everyDeck(P, same(stage), tally);
    assert.deepStrictEqual(P.dump(), before, stage + ': drawing today\'s deck left the phone\'s keys as they were');
  });
  assert.deepStrictEqual(stages, ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away']);
  // 14 weeks of five training days, five launches: 350 days, of which 308 open a deck and 34 hold the cool down alone
  // (1,110 cards, 4,148 set rows, 136 reuse pills, as first run). The floors sit under those counts, so a comparison
  // that stopped drawing is red and a ruling that moves a card is not.
  assert.equal(tally.days, 350);
  assert.ok(tally.decks >= 300 && tally.coolOnly >= 30, 'days, decks and cool down only days: ' + JSON.stringify(tally));
  assert.ok(tally.lift >= 500 && tally.round >= 300 && tally.block >= 200 && tally.cool >= 20, 'each kind of card: ' + JSON.stringify(tally));
  assert.ok(tally.rows >= 4000 && tally.loads >= 1000, 'set rows and load fields: ' + JSON.stringify(tally));
  assert.ok(tally.logged >= 20 && tally.skipped >= 4 && tally.swapped >= 4 && tally.added >= 4, 'logged, skipped, swapped in and added: ' + JSON.stringify(tally));
  assert.ok(tally.reuse >= 100 && tally.stale >= 20 && tally.warned >= 20, 'reuse pills, stale ones and the warning: ' + JSON.stringify(tally));
  assert.ok(tally.done >= 15 && tally.noted >= 5, 'days done and days with notes: ' + JSON.stringify(tally));
});

test('a set draft, a day done with its effort and notes, stale loads, and a second program in kilograms reusing the first one\'s loads', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const day0 = 7 * (first - 1);
  const days = training(P.launch(at(start, day0, '06:30')), first);
  assert.ok(days.length >= 2, 'the first week holds two training days');

  // The first day trained and marked done, its notes typed; then a draft on the second day: reps typed, nothing logged.
  P.launch(at(start, day0 + DAYS7.indexOf(days[0]!)));
  trainDay(P, first, days[0]!, 1);
  P.open(first, days[1]!);
  const c = cards(P.day(first, days[1]!))[0]!;
  const key: string = P.ev(`exStoreKey(${JSON.stringify(c.name)})`);
  P.ev(`writeSetDraft(${JSON.stringify(key)},['5','','4'],['135','',''],'135');`);
  const a = everyDeck(P, same('a draft'));
  assert.ok(a.drafts >= 1, 'a deck was drawn from a set draft: ' + JSON.stringify(a));
  assert.ok(a.logged >= 1 && a.done >= 1 && a.noted >= 1, 'a card logged, the day done and noted: ' + JSON.stringify(a));
  assert.equal(a.cross, 0, 'one program: no load from another');
  const done = pageDay(P, first, days[0]!).view!;
  assert.deepStrictEqual([done.dayDone, done.rpe, done.notes], [true, 7, 'Felt strong 💪, slept 7 h'], 'the day trainDay marked: done, effort 7 as typed, its notes');
  const drafted = pageDay(P, first, days[1]!).cards.flatMap((x) => x.views.flatMap((v) => (v.kind === 'section' ? v.body.items : []))).find((x) => x.kind === 'card' && x.exKey === key);
  assert.ok(drafted && drafted.kind === 'card' && drafted.log && drafted.log.sets && drafted.log.load);
  assert.deepStrictEqual([drafted.logged, drafted.log.sets.rows[0]!.value, drafted.log.sets.rows[2]!.value, drafted.log.load.value], [false, '5', '4', '135'], 'the draft\'s reps and load are on the card, not logged');

  // Thirty days on, the loads have gone stale (past 21 days): the pill says so and the warning speaks once a deck.
  P.launch(at(start, day0 + 30, '08:00'));
  const b = everyDeck(P, same('thirty days on'));
  assert.ok(b.stale >= 1 && b.warned >= 1, 'stale reuse pills and the warning: ' + JSON.stringify(b));

  // A second program, in kilograms: its cards reuse the first program's loads, shown in kilograms, the warning naming it.
  const second = P.generate({ ...fixtures.HALF_MANNY, unit: 'kg', programName: 'SECOND BLOCK' } as typeof fixtures.HALF_MANNY);
  assert.equal(P.prog.id, second);
  assert.equal(P.prog.cfg.unit, 'kg');
  // A lift logged in it, its sets typed in kilograms: the card shows them in kilograms again (stored in pounds between).
  // Its first whole week, since a day before the program's start does not open.
  const kgWeek = firstWeek(P, at(start, day0 + 30, '08:00')).first;
  const kgDay = training(P, kgWeek)[0]!;
  P.open(kgWeek, kgDay);
  const kc = cards(P.day(kgWeek, kgDay))[0]!;
  P.logLift(kc.name, kc.detail, [kc.reps, kc.reps], [60, 62.5]);
  const k = everyDeck(P, same('a second program in kilograms'));
  assert.ok(k.cross >= 1 && k.reuse >= 1 && k.warned >= 1, 'loads reused from the other program: ' + JSON.stringify(k));
  const kgKey: string = P.ev(`exStoreKey(${JSON.stringify(kc.name)})`);
  const kgCard = pageDay(P, kgWeek, kgDay).cards.flatMap((x) => x.views.flatMap((v) => (v.kind === 'section' ? v.body.items : []))).find((x) => x.kind === 'card' && x.exKey === kgKey);
  assert.ok(kgCard && kgCard.kind === 'card' && kgCard.logged && kgCard.log && kgCard.log.sets);
  assert.deepStrictEqual(kgCard.log.sets.rows.slice(0, 2).map((r) => r.weight && [r.weight.value, r.weight.unit]), [['60', 'kg'], ['62.5', 'kg']], 'the logged sets read in kilograms');
  const pills = DAYS7.flatMap((d) => pageDay(P, 1, d).cards).flatMap((x) => x.views.flatMap((v) => (v.kind === 'section' ? v.body.items : [])))
    .flatMap((x) => (x.kind === 'card' && x.log && x.log.load && x.log.load.reuse ? [x.log.load] : []));
  assert.ok(pills.length >= 1 && pills.every((l) => l.unit === 'kg' && / kg$/.test(l.reuse!.text)), 'every reuse pill of week 1 reads in kilograms');
});

test('a lift log holding an old key: the page folds and stores it as it launches, the Expo app draws the same cards from the keys as they stood', () => {
  // Old keys that fold into today's (core's EX_KEY_ALIAS), typed here by hand for HALF_MANNY's first lifts.
  const OLD: Record<string, string> = {
    barbell_romanian_deadlift: 'romanian_deadlift', close_grip_bench_press: 'close_grip_bench', front_squat: 'barbell_front_squat',
    dumbbell_bench_press: 'dumbbell_flat_press', kettlebell_single_arm_press: 'kettlebell_press', ball_slams: '10_ball_slams',
  };
  const P = new Phone().launch(CREATED);
  const id = P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const day0 = 7 * (first - 1);
  const days = training(P.launch(at(start, day0, '06:30')), first);
  P.launch(at(start, day0 + DAYS7.indexOf(days[0]!)));
  trainDay(P, first, days[0]!, 2);

  const log = JSON.parse(P.dump()['ia_exw_' + id]!) as Record<string, unknown>;
  const renamed = Object.keys(log).filter((k) => OLD[k]);
  assert.ok(renamed.length >= 1, 'a logged lift with an old key: ' + Object.keys(log).join(', '));
  const aged = Object.fromEntries(Object.entries(log).map(([k, v]) => [OLD[k] || k, v]));
  P.damage('ia_exw_' + id, JSON.stringify(aged));
  const pre = P.dump();

  P.launch(at(start, day0 + DAYS7.indexOf(days[0]!), '20:00'));
  const folded = JSON.parse(P.dump()['ia_exw_' + id]!) as Record<string, unknown>;
  for (const k of renamed) assert.ok(folded[k] && !folded[OLD[k]!], 'the page\'s launch folded ' + OLD[k] + ' into ' + k + ' and stored it');

  // The Expo app on the keys as they stood before that launch: its own launch folds the log and stores it, as the
  // page's did (D289), and the cards are drawn from it.
  const store = memoryStore();
  for (const [k, v] of Object.entries(pre)) store.set(k, v);
  const now = launchNow(P).getTime();
  const grid = JSON.parse(JSON.stringify(liveProgram(store, now, QUIET))) as DeckProgram;
  let logged = 0;
  for (const d of days) {
    const page = pageDay(P, first, d), native = nativeDay(store, grid, first, d, now);
    same('an old key')(native, page, 'week ' + first + ', ' + d);
    logged += page.cards.filter((x) => x.logged).length;
  }
  assert.ok(logged >= 1, 'a card drawn logged from the folded key');
  assert.notDeepStrictEqual(held(store), pre, 'the launch stored the folded log');
  assert.deepStrictEqual(held(store), P.dump(), 'the Expo app\'s launch left every key as the page\'s launch left it');
});

test('the Expo app\'s deck writes nothing: after every draw of every day the store holds the phone\'s keys, to the byte', () => {
  let checks = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week') return;
    const store = memoryStore();
    for (const [k, v] of Object.entries(P.dump())) store.set(k, v);
    const before = held(store);
    const now = launchNow(P).getTime();
    const grid = JSON.parse(JSON.stringify(liveProgram(store, now, QUIET))) as DeckProgram;
    for (const w of Object.keys(grid.weeks)) for (const d of DAYS7) nativeDay(store, grid, +w, d, now);
    assert.deepStrictEqual(held(store), before, stage + ': the store after every deck was drawn');
    assert.deepStrictEqual(before, P.dump());
    checks++;
  });
  assert.equal(checks, 1);
});
