// Set logging on a lift card: what Log stores for a move (D290 P-OWNROWS, docs/decisions/set-logging.md).
//
// A set row's field is `exset_<key>_<set>`, where <key> is the move's store key. Four pairs of moves the engine puts
// on one day have keys where one is the start of the other (`split_squat` and `split_squat_heel_raise_hold`), and the
// session sheet and the swipe deck hold every card of the day on the page at once. Log (saveExWeight) stores the
// move's own rows and no other move's.
//
// The page is driven on the test phone of support/stored-state.ts: both moves' fields are placed as the page holds
// them, then the app's own saveExWeight and commitSetsLive run. Every expected value is typed by hand: the numbers put
// in a move's own rows, in order. The keys are typed by hand too, and held against the app's exStoreKey so the pairs
// stay the ones the ruling names.
//
// The first two tests are the changed behaviour: on v0.262.2 each stores the other move's rows after the move's own.
// The last three guard what D290 must not change (a blank row, a move with a load and no rows, nothing to log), and
// pass on both releases on purpose.
import { beforeAll, test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import { Phone, training } from '../support/stored-state.ts';

interface Move { name: string; key: string; detail: string; typed: number[] }
/** The four pairs the shared lattice holds (tests/measure/set-logging_shared-rows.md), each with the numbers typed in its rows. */
const PAIRS: [Move, Move][] = [
  [{ name: 'Split squat', key: 'split_squat', detail: '3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 2–3 min rest', typed: [8, 8, 7] },
    { name: 'Split-squat heel-raise hold', key: 'split_squat_heel_raise_hold', detail: '2×30 sec each', typed: [31, 32] }],
  [{ name: 'Pike pushups', key: 'pike_pushups', detail: '2 sets — RPE 7 (leave 3 or more in reserve)', typed: [9, 6] },
    { name: 'Pike pushups (feet elevated)', key: 'pike_pushups__feet_elevated_', detail: '2 sets — RPE 7 (leave 3 or more in reserve)', typed: [5, 4] }],
  [{ name: 'Single-leg hip thrust', key: 'single_leg_hip_thrust', detail: '3×10–15 @ RPE 6–7', typed: [12, 11, 10] },
    { name: 'Single-leg hip thrust (shoulders on bed)', key: 'single_leg_hip_thrust__shoulders_on_bed_', detail: '2 sets — RPE 7 (leave 3 or more in reserve)', typed: [14, 13] }],
  [{ name: 'Side plank', key: 'side_plank', detail: '3×30–45 sec each', typed: [40, 35, 30] },
    { name: 'Side plank (top leg raised)', key: 'side_plank__top_leg_raised_', detail: '2×20 sec each', typed: [21, 22] }],
];

const J = JSON.stringify;
let P: Phone;
let week = 0;

/** A field of the page with a value and a placeholder, as an input holds them. */
function put(id: string, value: string, placeholder = ''): void {
  const fields = (P as unknown as { fields: Map<string, unknown> }).fields;
  fields.set(id, { id, value, placeholder, dataset: {}, textContent: '', classList: { add() {}, remove() {}, contains: () => false, toggle: () => false } });
}
/** A move's rep rows, each holding a typed number. */
function rows(m: Move): void {
  m.typed.forEach((n, s) => put('exset_' + m.key + '_' + s, String(n)));
}
/** The app's Log on a move, quietly, as Done, next one calls it. */
function log(m: Pick<Move, 'name' | 'key' | 'detail'>): void {
  P.ev(`saveExWeight(${J(m.key)},${J(m.name)},${J(m.detail)},true);`);
}
/** The move's stored entry for the day in hand, or null. */
function entry(key: string): { setsDone: number[]; weight: number } | null {
  return P.ev(`(function(){var r=getExWeights()[${J(key)}];var e=((r&&r.entries)||[]).filter(function(x){return +x.week===+currentWeek&&entryDay(x)===currentDayKey;})[0];return e?JSON.parse(JSON.stringify(e)):null;})()`);
}

beforeAll(() => {
  P = new Phone().launch('2026-09-21T10:00:00');
  P.generate(fixtures.HALF_MANNY);
  week = P.ev('calcCurrentWeek()');
  const day = training(P, week)[0];
  assert.ok(day, 'the program has a training day this week');
  P.open(week, day);
  assert.equal(P.ev('currentDayKey'), day, 'the day is in hand');
});

test('Log stores a move\'s own sets when another move on the page has a key that starts with its key', () => {
  for (const [a, b] of PAIRS) {
    assert.equal(P.ev(`exStoreKey(${J(a.name)})`), a.key, a.name + ': its store key');
    assert.equal(P.ev(`exStoreKey(${J(b.name)})`), b.key, b.name + ': its store key');
    assert.ok(b.key.startsWith(a.key + '_'), b.key + ' starts with ' + a.key + '_');
    P.clearFields();
    rows(a);
    rows(b);
    log(a);
    assert.deepEqual(entry(a.key)?.setsDone, a.typed, a.name + ' beside ' + b.name + ': its own ' + a.typed.length + ' sets');
    log(b);
    assert.deepEqual(entry(b.key)?.setsDone, b.typed, b.name + ': its own ' + b.typed.length + ' sets');
    assert.deepEqual(entry(a.key)?.setsDone, a.typed, a.name + ': unchanged by the other move\'s Log');
  }
});

test('a set changed after Log rewrites the entry with the move\'s own sets', () => {
  const [a, b] = PAIRS[0]!;
  P.clearFields();
  rows(a);
  rows(b);
  log(a);
  // The first set stepped from 8 to 9: the page commits a logged move straight through (commitSetsLive).
  put('exset_' + a.key + '_0', '9');
  P.ev(`commitSetsLive(${J(a.key)});`);
  assert.deepEqual(entry(a.key)?.setsDone, [9, 8, 7]);
});

test('a blank row logs its placeholder, and 0 where the placeholder is no number', () => {
  const m = { name: 'Goblet squat', key: P.ev('exStoreKey("Goblet squat")') as string, detail: '3×10' };
  P.clearFields();
  put('exset_' + m.key + '_0', '', '10');
  put('exset_' + m.key + '_1', '7', '10');
  put('exset_' + m.key + '_2', '', 'max');
  log(m);
  assert.deepEqual(entry(m.key)?.setsDone, [10, 7, 0]);
});

test('a move with a load and no rows logs its load with no sets', () => {
  const m = { name: 'Farmer carry', key: P.ev('exStoreKey("Farmer carry")') as string, detail: 'heavy' };
  P.clearFields();
  put('exw_' + m.key, '135');
  log(m);
  const e = entry(m.key);
  assert.deepEqual(e?.setsDone, []);
  assert.equal(e?.weight, 135);
});

test('a move with no rows and no load says there is nothing to log, and stores nothing', () => {
  const m = { name: 'Box breathing', key: P.ev('exStoreKey("Box breathing")') as string, detail: '' };
  P.clearFields();
  const before = J(P.dump());
  log(m);
  assert.equal(P.toasts[P.toasts.length - 1], 'Nothing to log here');
  assert.equal(J(P.dump()), before);
  assert.equal(entry(m.key), null);
});
