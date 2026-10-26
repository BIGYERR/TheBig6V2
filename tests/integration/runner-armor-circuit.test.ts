// The runner armor circuit: on a runner's prevention leg day the circuit (lunge, hold, hinge) gains a fourth item, the
// prevention hip extension, and the trims know it. Ruling D195 Amendment 2, part A (V231):
//   A1x the prevention hip extension subset is drawn after the reservation and the whole pool is registered in the swap
//       universe (no name leaves it);
//   A2r the fourth item, on runners only (race and test families), never twice the hinge;
//   A3c the regional move cap allows the four-item circuit one more move on a legs day;
//   A5, A6 the fourth item ranks 3 in the regional trim and in the session budget, so it leaves before the hold or calf.
// With part B (the budget prices the prehab rails at half, tests/integration/session-budget.test.js) HALF_MANNY moved by
// this ruling only (2d35e8f743680cfa, held by tests/integration/program-output.test.js). Floor (b) of D149 fires on
// home_full only. The record is in the handoff and tests/measure/v231_rulings/.
//
// The counterfactuals are the app with part A taken out, part B taken out, or both (tests/support/session-budget.js).
// This file runs HALF_MANNY, the hand lists and days, the typed cells, and samples of the two lattices;
// tests/sweeps/runner-armor-circuit.test.js runs the floor (b) lattice (630 configs) and the prevention shard (272) whole.
//
// Oracles are typed by hand (tests/support/runner-armor-circuit.js): the ruling's strings and digests, HALF_MANNY's
// universe and leg day circuits (Tuesday until D243, Thursday since), the hand lists and their verdicts, the hand days and their trim walks, the cell cards.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import * as SB from '../support/session-budget.ts';
import type { AppDay } from '../support/session-budget.ts';
import * as RA from '../support/runner-armor-circuit.ts';
const { clone, clean, DAYS } = SB;

const C = SB.twice(null, fixtures.HALF_MANNY), N = SB.twice(SB.noHipExtA(), fixtures.HALF_MANNY);
const p = C.prog, q = N.prog;

test("HALF_MANNY's W1 to W12 leg day circuit (Thursday since D243) carries Single-leg hip thrust 2×6–10 each @ RPE 7 after its three", () => {
  // D195-A-a: a-tue (the fourth item and items 1 to 3). D243 (v0.243.0) moved his leg day from Tuesday to Thursday,
  // the card the same in all 14 weeks.
  assert.ok(C.self && N.self);
  for (let w = 1; w <= 12; w++) {
    const it = RA.circuitItems(p.weeks[w].thu)!;
    assert.equal(it.length, 4, 'W' + w);
    assert.deepEqual(it[3], RA.FOURTH, 'W' + w);
    assert.deepEqual(it.slice(0, 3), RA.TUE[w], 'W' + w);
  }
});

test('without the fourth item every HALF_MANNY day is byte-identical: each W1 to W12 leg day (Thursday) less item 4, and every other day whole', () => {
  // D195-A-a: a-tue (the day otherwise unchanged), a-other (W13, W14 and every other day)
  assert.equal(SB.weekKeys(p).length, 14);
  let other = 0;
  for (let w = 1; w <= 14; w++) for (const d of DAYS) {
    const a = clone(p.weeks[w][d]);
    if (d === 'thu' && w <= 12) {
      const si = a.sections.findIndex((s: AppDay) => RA.CIRCUIT_RE.test(clean(s.label)));
      a.sections[si].items.splice(3, 1);
    } else other++;
    assert.equal(SB.dayJ(a), SB.dayJ(q.weeks[w][d]), 'W' + w + ' ' + d);
  }
  assert.equal(other, 86);
});

test('the leg day\'s calf and carry strings (Thursday since D243) read YYY-YYY-YYY--- over the 14 weeks', () => {
  // D195-A-a: a-calf, a-carry
  let calf = '', carry = '';
  for (let w = 1; w <= 14; w++) { calf += RA.hasSec(p.weeks[w].thu, /^Calf — achilles/) ? 'Y' : '-'; carry += RA.hasSec(p.weeks[w].thu, /carry/i) ? 'Y' : '-'; }
  assert.equal(calf, RA.CALF_STR);
  assert.equal(carry, RA.CARRY_STR);
});

test("HALF_MANNY's swap universe is the 107 names, with the fourth item and without it", () => {
  // D195-A-a: a-uni (86 names; D239 adds the thirteen prehab names its pools register, D241 the eight more)
  for (const prog of [p, q]) {
    const U = Array.from(prog._swapUniverse || []);
    assert.equal(U.length, 107);
    assert.deepEqual(U.slice().sort(), RA.UNIVERSE.slice().sort());
  }
});

test('part A without part B is 3c253c3fd440dad5, part B without part A is df75a47fc8917305 (the ruling printed both, moved by D239, D241, D243 and D251)', () => {
  // D195-A-a: a-cfA, a-cfB. D239 (v0.241.0) moved both (were f5ed630033ebe3db, 0ac7da6b1691a8e1), D241 (v0.242.0) again
  // (were 3e88e365246858f3, b1b15c80f1a703f1): their draws reach his Tuesdays and his core days. D243 (v0.243.0) again
  // (were 93fd2d1d3a43f192, c17e854e54e86f57): one speed day moves his leg day to Thursday. D251 (v0.247.0) again
  // (were b8a8aabf561bfc44, 895bb404a809927b): his week 10 speed day is Nike's tempo session.
  const A = SB.twice(SB.noCostLens(), fixtures.HALF_MANNY);
  assert.ok(A.self);
  assert.equal(A.dig, '3c253c3fd440dad5');
  assert.equal(N.dig, 'df75a47fc8917305');
  assert.equal(Array.from(A.prog._swapUniverse || []).length, 107);
});

// ── the regional trim (A3c, A5) ──────────────────────────────────────────────────────────────────────────────────
// List (i) is HALF_MANNY's W6 Tuesday: Main 3 sets, the four-item circuit at 2 each, the calf at 2. Five moves (squat,
// lunge, hinge, hip_ext, calf; the hold has no pattern) against a legs move cap of 4 plus the circuit's one; 11 sets.
const L1 = [
  { label: 'Main — Front squat', items: [{ name: 'Front squat', detail: '3×8 — RPE 7' }] },
  { label: 'Leg circuit — runner armor', superset: true, rounds: 2, items: [
    { name: 'Dumbbell Bulgarian split squat', detail: '2×8–12 each @ RPE 7' }, { name: 'Spanish squat hold (KB)', detail: '2×25 sec' },
    { name: 'Kettlebell swing', detail: '2×8' }, { name: 'Single-leg hip thrust', detail: '2×6–10 each @ RPE 7' }] },
  { label: 'Calf — achilles armor', items: [{ name: 'Dumbbell seated calf raise', detail: '2×12–15 each, slow 3-sec lower' }] },
];
// A hard run read by hand off _cardioInterference: run base 1.0 x 'speed run' intensity 1.4 + no distance = 1.4, so the
// legs set cap falls by round(1.4 x 3) = 4, from 14 to 10, under list (i)'s 11 sets.
const HARD_RUN = { type: 'run', subtype: 'Speed Run — Intervals', detail: '' };
const IA = SB.page();
function crf(list: AppDay[], cardio: AppDay): AppDay[] {
  const inp = clone(list), before = JSON.stringify(inp);
  const out = IA.eval('capRegionalFatigue')(inp, 'legs', cardio, 'support_prevention');
  assert.equal(JSON.stringify(inp), before, 'the input list is not mutated');
  return JSON.parse(JSON.stringify(out));
}
const live = (L: AppDay[]): AppDay[] => L.filter((s) => (s.items || []).length);

test('the regional trim reads a hard run at 1.4 interference', () => {
  // D195-A-c: c-hand
  assert.equal(IA.eval('_cardioInterference')(clone(HARD_RUN)), 1.4);
});

test('a four-item circuit and the calf pass the regional trim untouched with no cardio', () => {
  // D195-A-c: c-i
  assert.deepEqual(crf(L1, null), L1);
});

test('a three-item circuit with a leg isolation item (five moves, no four-item circuit) loses exactly one item', () => {
  // D195-A-c: c-ii
  const L2 = clone(L1);
  L2[1].items.pop();
  L2.push({ label: 'Leg isolation', items: [{ name: 'Leg extension', detail: '2×12–15' }] });
  const out = crf(L2, null);
  let one = 0;
  for (let si = 0; si < L2.length; si++) for (let ii = 0; ii < L2[si].items.length; ii++) {
    const e = clone(L2);
    e[si].items.splice(ii, 1);
    if (JSON.stringify(live(e)) === JSON.stringify(live(out))) one++;
  }
  assert.equal(one, 1);
});

test("on a hard run day the circuit's fourth item leaves, and the lunge, hold, hinge and calf stay", () => {
  // D195-A-c: c-iii
  const want = clone(L1);
  want[1].items.splice(3, 1);
  assert.deepEqual(crf(L1, clone(HARD_RUN)), want);
});

// ── the session budget (A6 with B's pricing) ─────────────────────────────────────────────────────────────────────
const key = (s: AppDay): string => (s && (s.label || s.coreHeader)) || '';
const proj = (L: AppDay[]) => live(L).map((s) => [key(s), s.items.map((i: AppDay) => [i.name, i.detail])]);

test('the hand legs days total 20.5, 22 and 23.5 against a cap of 20', () => {
  // D195-A-d: d-fix
  assert.deepEqual(RA.LEGS_DAYS.map((c) => c.day.hand), [20.5, 22, 23.5]);
  assert.deepEqual(RA.LEGS_DAYS.map((c) => c.total), [20.5, 22, 23.5]);
});

for (const c of RA.LEGS_DAYS) {
  test('at ' + c.total + ' the budget takes ' + c.gone.map((g) => g[1]).join(', then ') + ', never the hold or the calf', () => {
    // D195-A-d: d-20.5, d-22, d-23.5
    const inp = clone(c.day.L), before = JSON.stringify(inp);
    const out = IA.eval('capSessionBudget')(inp, null);
    assert.equal(JSON.stringify(inp), before, 'the input is not mutated');
    const want = clone(c.day.L);
    for (const [k, n] of c.gone) { const s = want.find((x) => key(x) === k); s.items.splice(s.items.findIndex((i: AppDay) => i.name === n), 1); }
    assert.deepEqual(proj(JSON.parse(JSON.stringify(out))), proj(want));
  });
}

test('the two typed cells print the cards coach printed: a four-item circuit with the calf, and since D243 the carry finisher; Wall sit second of three', () => {
  // D195-A-d: d-cellA, d-cellB
  const a = SB.twice(null, RA.CELL_F1.cfg).prog.weeks[RA.CELL_F1.w][RA.CELL_F1.d];
  const b = SB.twice(null, RA.CELL_FH.cfg).prog.weeks[RA.CELL_FH.w][RA.CELL_FH.d];
  assert.deepEqual(SB.cardLines(a), RA.CARD_F1);
  assert.equal(RA.circuitItems(a)!.length, 4);
  assert.ok(RA.hasSec(a, /^Calf — achilles/) && RA.hasSec(a, /carry/i));
  assert.deepEqual(SB.cardLines(b), RA.CARD_FH);
  assert.deepEqual(RA.circuitItems(b)!.map((x) => x.join(' '))[1], 'Wall sit 2×25 sec');
  assert.equal(RA.circuitItems(b)!.length, 3);
});

test('without D195 the same two cells print the cards before it: three items, no carry, and on the second the hold cut (the calf too, until D239)', () => {
  // D195-A-d: d-inst (the before cards, read on the app with parts A and B taken out)
  const f = SB.noD195();
  assert.deepEqual(SB.cardLines(SB.twice(f, RA.CELL_F1.cfg).prog.weeks[RA.CELL_F1.w][RA.CELL_F1.d]), RA.CARD_F1_THREE);
  assert.deepEqual(SB.cardLines(SB.twice(f, RA.CELL_FH.cfg).prog.weeks[RA.CELL_FH.w][RA.CELL_FH.d]), RA.CARD_FH_THREE);
});

// ── floor (b), on a sample (the 630 are in the sweep) ────────────────────────────────────────────────────────────
test('on a sample of the knee protect lattice floor (b) fires on home_full only, and never on a prevention config', () => {
  // D195-A-e: e-anchor, and e-home_full, e-others, e-prev on every 15th of the 630
  assert.equal(SB.countIn(RA.FB_FROM), 1);
  const rows = RA.floorBLattice().filter((_, i) => i % 15 === 0);
  const r = RA.floorBFires(rows);
  assert.deepEqual(r.crashed, []);
  assert.equal(r.built, 42);
  assert.ok(r.fire.home_full > 0);
  for (const t of RA.FB_TIERS.filter((x) => x !== 'home_full')) assert.equal(r.fire[t], 0, t);
  assert.equal(r.prevFire, 0);
});

// ── the prevention shard, on a sample (the 272 are in the sweep) ─────────────────────────────────────────────────
test("on a sample of the prevention shard part A only appends one item to a runner's circuit, takes only from the carry or core block, and moves no universe", () => {
  // D195-A-b: b-notA, b-shard, b-fourth, b-add, b-rem, b-circ, b-calf, b-nonrun, b-knee; D195-A-f: f-shard, f-nonbw,
  // f-bwlb, f-other (every 12th program of the 272)
  const S = RA.shardBuild(RA.preventionShard().filter((_, i) => i % 12 === 0));
  assert.equal(S.length, 23);
  assert.deepEqual(S.filter((r) => r.crash.length).map((r) => r.x.tag), []);
  assert.ok(S.every((r) => r.self && r.hasU));
  const D: RA.AnalysedDay[] = [];
  S.forEach((r) => r.days.forEach((z) => D.push(Object.assign({ r, a: RA.analyse(z) }, z))));
  const run = D.filter((z) => z.r.runner), non = D.filter((z) => !z.r.runner), knee = D.filter((z) => z.r.x.inj === 'knee/protect');
  assert.ok(run.length > 0 && non.length > 0);
  assert.ok(run.some((z) => z.a.appended), 'a runner circuit carries the fourth item');
  assert.deepEqual(non.concat(knee).filter((z) => z.a.grew).map((z) => z.tag), []);
  assert.deepEqual(run.filter((z) => !z.a.addOK).map((z) => z.tag), []);
  assert.deepEqual(run.filter((z) => z.a.remBad.length || z.a.coreEmptied).map((z) => z.tag), []);
  assert.deepEqual(run.filter((z) => !z.a.lit12 || !z.a.rounds).map((z) => z.tag), []);
  assert.deepEqual(D.filter((z) => z.calfN && !z.calfC).map((z) => z.tag), []);
  assert.deepEqual(non.filter((z) => !z.same).map((z) => z.tag), []);
  assert.deepEqual(knee.filter((z) => z.Ci.length !== z.Ni.length).map((z) => z.tag), []);
  for (const r of S) assert.deepEqual([...r.uC].sort(), [...r.uN].sort(), r.x.tag);
});
