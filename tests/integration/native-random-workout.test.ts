// The Expo app's Random Workout is today's (MIGRATION.md phase 3, row 7; D289 P-NATIVEWRITES,
// docs/decisions/data-backup.md; the rulings are today's and keep their D-codes: V195 D64 and D71, v0.246.0 D250,
// docs/decisions/wildcard.md). Proofs over HALF_MANNY's standard history (the ten seeded programs are
// tests/sweeps/native-random-workout.test.ts):
//
// 1. The pools the beta holds are the pools today's page boots with.
// 2. Every workout of See All, shown on both apps: the same head and the same cards, whole, on a phone in its third
//    week and on one two weeks unopened, where a load last logged has gone stale.
// 3. The sheet worked through on both apps at each of the five stretches, with no day opened since the launch and
//    with one opened first: after every tap the stores hold each ia_ key equal, the toasts are the same, and every
//    draw is the same sheet (support/native-random-workout.ts).
// 4. Complete on each day of a week and off the program's calendar: the same record, the same pop-up, whole.
// 5. A kilogram program: a Wildcard's cards read pounds until a day has been opened, on both.
//
// The reference is today's page, on purpose. No key is left out.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key.
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { RAND_POOLS } from '../../frontends/native/src/random-workout/random-pools.ts';
import type { RandProgram } from '../../frontends/native/src/random-workout/random-screen.ts';
import { fixtures } from '../support/app.ts';
import { both, iso } from '../support/native-deck-swap.ts';
import { TwoRandoms, randTally, walkRandom } from '../support/native-random-workout.ts';
import { launchNow } from '../support/native-this-week.ts';
import { life, Phone } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const J = JSON.stringify;
/** A phone on the same keys, launched `days` on at noon. */
function later(P: Phone, days: number): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  const d = new Date(launchNow(P).getTime() + days * 86400000);
  d.setHours(12, 0, 0, 0);
  return Q.launch(iso(d));
}

test('the pools the beta holds are the pools today\'s page boots with', () => {
  const P = new Phone().launch(CREATED);
  const page = JSON.parse(P.ev('JSON.stringify(RAND_POOLS)') as string) as Record<string, { title: string }[]>;
  assert.deepStrictEqual(JSON.parse(J(RAND_POOLS)), page);
  // Typed from the page's table: five pools, 149 workouts (the fat loss pool holds 29).
  assert.deepStrictEqual(Object.keys(page), ['strength', 'hypertrophy', 'fatloss', 'athletic', 'balanced']);
  assert.deepStrictEqual(Object.values(page).map((p) => p.length), [30, 30, 29, 30, 30]);
});

test('HALF_MANNY: every workout of See All is the same sheet on both apps, in the third week and two weeks unopened', () => {
  const T = randTally();
  let stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week' && stage !== '4 after two weeks away') return;
    const { Q, store, grid } = both(P);
    const R = new TwoRandoms(Q, store, grid as RandProgram, 4242, T, stage);
    for (let i = 0; i < 149; i++) R.show(i);
    for (const type of ['Bike', 'Swim', 'Rower']) {
      const w = { title: 'Made up ' + type, cardio: { type, detail: '20 min easy' }, note: 'A note', sections: [{ label: 'Main', items: [{ name: 'Back squat', detail: '3×5' }] }] };
      R.showWorkout(JSON.parse(J(w)), JSON.parse(J(w)), 'a made up workout');
    }
    stages++;
  });
  assert.equal(stages, 2);
  assert.equal(T.shown, 304, J(T));
  // The pools' cardio is a run in every workout that has one; the other three blocks the model can hand back are
  // drawn from a workout made up here, on both apps.
  for (const k of ['cardio: bike-block', 'cardio: swim-block', 'cardio: cardio-block']) assert.equal(T.kinds[k], 2, k + ': ' + J(T.kinds));
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.shown', J(T));
  const K = T.kinds;
  // Every kind the model's builders can hand back, drawn and compared. The floors sit under what was measured.
  for (const k of ['head: not done', 'cardio: none', 'cardio: run-block', 'note', 'section: block', 'section: round',
    'item: card', 'card: offers a swap', 'card: offers a minus', 'card: a log', 'card: set rows', 'card: a load field', 'card: a reuse pill', 'card: a stale reuse pill', 'card: the stale warning spoken']) {
    assert.ok((K[k] || 0) >= 1, k + ' was never drawn: ' + J(K));
  }
  assert.ok((K['item: card'] || 0) >= 1300, J(K));
  // The warning is the app's one: it speaks on the first stale load drawn, and no later workout speaks it again.
  assert.equal(K['card: the stale warning spoken'], 1, J(K));
});

test('HALF_MANNY through the standard history: Random Workout worked through on both apps at each stretch, the stores equal after every tap', () => {
  const T = randTally();
  let n = 0, stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    for (const day of [false, true]) {
      const { Q, store, grid } = both(P);
      walkRandom(Q, store, grid as RandProgram, n++, T, stage + (day ? ', a day opened first' : ', no day opened'), { day });
    }
    stages++;
  });
  assert.equal(stages, 5);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], J(T));
  // Each kind of tap was made and compared. The floors sit under what was measured when this was written.
  assert.ok(T.checks >= T.taps && T.taps >= 150, J(T));
  assert.ok(T.opens >= 15 && T.filters >= 30 && T.draws >= 60, J(T));
  assert.ok(T.daysOpened >= 5, 'a day opened before the Wildcard: ' + J(T));
  assert.ok(T.sheets >= 8 && T.picks >= 8 && T.unswaps >= 4, 'swaps: ' + J(T));
  assert.ok(T.skips >= 10 && T.undos >= 5, 'a minus and its put back: ' + J(T));
  assert.ok(T.steps >= 10 && T.typed >= 10 && T.logs >= 12, 'set logging: ' + J(T));
  assert.ok(T.resets >= 4 && T.completes >= 8 && T.weeks >= 8, 'the reset and Complete: ' + J(T));
  const K = T.kinds;
  for (const k of ['head: not done', 'section: a skipped round', 'item: skipped', 'card: swapped in', 'card: logged on the day in hand']) assert.ok((K[k] || 0) >= 1, k + ' was never drawn: ' + J(K));
  // What each tap stored, on both apps (the measure's table, tests/measure/native-row7_today.md): a draw, a filter,
  // a swap, a minus and each put back store nothing; Complete and the reset store the Wildcard's record alone.
  const W = T.wrote;
  for (const k of Object.keys(W)) {
    const [tap, keys] = k.split(': ') as [string, string];
    if (['open', 'a filter', 'a swap', 'a swap put back', 'a minus', 'a put back'].includes(tap)) assert.equal(keys, 'nothing', k);
    if (tap === 'Complete') assert.equal(keys, 'ia_wild_<id>', k);
    if (tap === 'the reset') assert.ok(keys === 'ia_wild_<id>' || keys === 'nothing', k);
    if (tap === 'Log') assert.ok(/ia_exw_<id>/.test(keys), k);
  }
  // A step stores a draft only under a day last opened (today's own, carried as it stands).
  assert.ok((W['a step: nothing'] || 0) >= 1 && Object.keys(W).some((k) => /^a step: .*ia_logs_<id>/.test(k)), J(W));
});

test('HALF_MANNY: Complete on each day of a week and a year on stores the same record and raises the same pop-up on both', () => {
  const T = randTally();
  let third: Phone | null = null;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week') return;
    const Q = new Phone();
    for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
    third = Q.launch(iso(launchNow(P)));
  });
  assert.ok(third);
  for (const days of [0, 1, 2, 3, 4, 5, 6, 400]) {
    const { Q, store, grid } = both(later(third, days));
    const R = new TwoRandoms(Q, store, grid as RandProgram, 99 + days, T, 'Complete ' + days + ' days on');
    R.open();
    R.complete();
    R.weekAfter();
    // The same workout shown again reads Done Before on both, with no Complete.
    const last = (JSON.parse(store.get('ia_wild_' + grid.id)!) as { title: string }[]).pop()!;
    R.show(Object.values(RAND_POOLS).flat().findIndex((w) => w.title === last.title));
    assert.equal(R.sheet.head.done, true);
  }
  assert.equal(T.completes, 8);
  // Typed from the page's fireWildcardPopup: a training day names the streak, a rest day and a day off the calendar do not.
  assert.deepStrictEqual(Object.keys(T.landed).sort(), ['a rest day → Streak holds.', 'a training day → Streak: N.', 'no day of the program → Streak holds.']);
  assert.ok((T.kinds['head: done before'] || 0) >= 8, J(T.kinds));
});

test('a kilogram program: a Wildcard\'s cards read pounds until a day has been opened, on both apps', () => {
  const T = randTally();
  const kinds: Record<string, number> = {};
  const P = new Phone().launch(CREATED);
  P.generate({ ...fixtures.HALF_MANNY, unit: 'kg' });
  const first = new Phone();
  for (const [k, v] of Object.entries(P.dump())) first.damage(k, v);
  first.launch('2026-09-09T18:00:00');
  for (const day of [false, true]) {
    const { Q, store, grid } = both(first);
    const R = walkRandom(Q, store, grid as RandProgram, day ? 2 : 1, T, 'kilograms' + (day ? ', a day opened first' : ''), { day });
    assert.equal(R.hand.unit, day ? 'kg' : 'lbs');
    // A load of 60 typed on a card that has a load field, then Log. Typed by hand from the page's saveExWeight: the
    // load field is turned by the program's unit (60 kilograms is round(60 × 2.20462), 132 pounds) and the toast
    // names that unit; where the card has set rows the entry's weight is its heaviest set, and each set is turned by
    // the unit on the card, pounds until a day has been opened (60 stays 60).
    let x = R.moves().find((m) => m.log && m.log.load && !m.logged);
    for (let i = 0; !x && i < 20; i++) { R.filter(i % 2 ? 'mine' : 'all'); x = R.moves().find((m) => m.log && m.log.load && !m.logged); }
    assert.ok(x, 'a card with a load field was drawn');
    const rows = !!(x.log!.sets && x.log!.sets.rows.some((r) => r.weight));
    R.typeLoad(x.exKey, '60');
    const t0 = Q.toasts.length;
    R.log(x);
    assert.deepStrictEqual(Q.toasts.slice(t0), ['60 kg logged ✓']);
    const row = (JSON.parse(store.get('ia_exw_' + grid.id)!) as Record<string, { entries: { weight: number }[] }>)[x.exKey]!;
    assert.equal(row.entries[row.entries.length - 1]!.weight, day || !rows ? 132 : 60);
    kinds[(day ? 'a day opened' : 'no day opened') + (rows ? ', set rows' : ', a load field alone')] = 1;
  }
  assert.ok(T.logs >= 4 && T.daysOpened === 1, J(T));
  assert.ok(kinds['no day opened, set rows'], 'the case the two units part on was walked: ' + J(kinds));
});
