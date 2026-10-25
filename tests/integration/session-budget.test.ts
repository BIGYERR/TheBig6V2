// The session budget: capSessionBudget trims a day that costs more than the cap (20 sets, less for a hard cardio day)
// and the floors that say what it may never take. Rulings:
//   D47, D48 an optional section is budget fodder only while it has more than one item (the core finisher keeps one);
//   D50 the day's last trunk item is a floor;
//   D84 the trim's tie-break goes to the later position (so the section pushed second leaves first);
//   D85 the budget may not spend the day's last posterior chain item (hinge or hip extension; leg isolation is not
//       posterior chain);
//   D81 the isolation band is the budget's to trim; the leg compounds are protected by it;
//   D195-B the budget prices the prehab rails (hip stability, knee stability, foot and ankle) at half;
//   D195-A6 the runner armor circuit's fourth item ranks with the optional blocks.
// The record is in the handoff and tests/measure/v193_rulings/ to v231_rulings/.
//
// This file runs the hand sessions, the frozen budget corpus, the counterfactuals the rulings printed, and a sample of
// each lattice. tests/sweeps/session-budget.test.ts runs the 288-cell census and the 650-config D195-B shard whole.
//
// Oracles are typed by hand: the hand sessions and their hand-derived trims, the ruling digests (PRT TING and
// HALF_MANNY with and without each part of D195), the PRT cards the ruling printed, the hand posterior regex. The
// corpus digests are golden values in tests/snapshots/session-budget.json (the legacy era rows, current).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { progDigest, fixtures } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import * as SB from '../support/session-budget.ts';
import type { AppDay, LooseCfg, Sections } from '../support/session-budget.ts';
const { clone, page, variant, countIn, DAYS } = SB;

const IA = page();
const csb: (s: Sections, cardio: unknown) => Sections = IA.eval('capSessionBudget');
const TIER = (n: string): number => IA.eval('_compoundTier')(n);
const PAT = (n: string): string | null => IA.eval('_pattern')(n);
const run = (secs: Sections, cardio?: unknown): Sections => csb(clone(secs), cardio === undefined ? null : cardio);
const names = (out: Sections): string[] => ([] as string[]).concat(...(out || []).map((s: AppDay) => (s.items || []).map((i: AppDay) => i.name)));
const sets = (d: unknown): number => { const m = String(d || '').match(/(\d+)\s*[×x]/); return m ? parseInt(m[1] || '3', 10) : 3; };
const cost = (out: Sections): number => ([] as AppDay[]).concat(...(out || []).map((s: AppDay) => s.items || [])).reduce((a: number, i: AppDay) => a + sets(i.detail), 0);

// ── the trim order, by hand ──────────────────────────────────────────────────────────────────────────────────────
test('the cap is 20 sets, declared once', () => {
  // E4a, E4b, E4k
  assert.equal(countIn('const SESSION_SET_BUDGET = '), 1);
  assert.equal(IA.eval('SESSION_SET_BUDGET'), 20);
});

test('an optional core block keeps its last item: the D48 hand session trims as hand-derived', () => {
  // L:0b5eb763 (B4f/O5 under D48)
  IA.eval('globalThis.__BUDGET_OFF = false; globalThis.__CAP_OFF = false;');
  assert.equal(SB.shape(csb(SB.handSession(true), null)), SB.EXPECT_D48);
});

test('with no optional flag the same session trims in the hand-derived non-optional order', () => {
  // L:28c176a1 (B4f/O5 plain)
  assert.equal(SB.shape(csb(SB.handSession(false), null)), SB.EXPECT_PLAIN);
});

test('a tie in score goes to the later position, whatever the label', () => {
  // E4c: three rank-2 sections of one 4-set curl each; 22 against 20, one item has to go, and it is the last one
  const main = { label: 'Main lift', items: [{ name: 'Back squat', detail: '10×5' }] };
  const a = { label: 'Accessory', items: [{ name: 'Dumbbell curl', detail: '4×12' }] };
  const i = { label: 'Isolation', items: [{ name: 'Hammer curl', detail: '4×12' }] };
  const p = { label: 'Pump', items: [{ name: 'Cable fly', detail: '4×12' }] };
  assert.deepEqual(names(run([main, a, i, p])), ['Back squat', 'Dumbbell curl', 'Hammer curl']);
  assert.deepEqual(names(run([main, p, a, i])), ['Back squat', 'Cable fly', 'Dumbbell curl']);
});

test('the trim stops at the first total at or under the cap: a day at 20 is untouched, 21 loses one item', () => {
  // E4m (the trim is a threshold loop, not a minimiser)
  const day = (n: number): Sections => [{ label: 'Main lift', items: [{ name: 'Back squat', detail: n + '×5' }] },
    { label: 'Accessory', items: [{ name: 'Dumbbell curl', detail: '3×12' }, { name: 'Hammer curl', detail: '3×12' }] }];
  const at = day(14);
  assert.equal(csb(at, null), at, 'a day at the cap comes back as it went in');
  assert.deepEqual(names(run(day(15))), ['Back squat', 'Dumbbell curl']);
  assert.equal(cost(run(day(15))), 18);
});

// ── the posterior floor (D85) ────────────────────────────────────────────────────────────────────────────────────
const MAIN = { label: 'Main — Lower', items: [{ name: 'Back squat', detail: '5×5' }] };
const fin = (list: [string, string][]) => ({ label: 'Finisher', items: list.map((n) => ({ name: n[0], detail: n[1] })) });
const BASE5: [string, string][] = [['Dumbbell lateral raise', '4×12'], ['Cable triceps pushdown', '4×12'], ['Hammer curl', '4×12'], ['Face pull', '4×15']];

test('the movements the floor cases rest on: tiers and patterns', () => {
  // A0a to A0e
  assert.equal(TIER('Back squat'), 3);
  assert.notEqual(TIER('Dumbbell Romanian deadlift'), 3);
  assert.equal(PAT('Dumbbell Romanian deadlift'), 'hinge');
  assert.equal(PAT('Back extension'), 'hip_ext');
  assert.equal(PAT('Leg extension'), 'leg_iso');
});

test("the day's only hinge survives a three-item trim (29 sets against 20)", () => {
  // A1a, A1b, A1c: rank-3 finisher, latest first: RDL, Cable fly, Face pull; the floor holds the RDL, so the third
  // removal falls on the Hammer curl
  const out = run([MAIN, fin(BASE5.concat([['Cable fly', '4×12'], ['Dumbbell Romanian deadlift', '4×10']]))]);
  assert.deepEqual(names(out), ['Back squat', 'Dumbbell lateral raise', 'Cable triceps pushdown', 'Dumbbell Romanian deadlift']);
  assert.equal(cost(out), 17);
});

test('with two hinges the later one is trimmed and the last is held: the count is re-read every pass', () => {
  // A2a, A2b, A2c
  const out = run([MAIN, fin(BASE5.concat([['Kettlebell swing', '4×12'], ['Dumbbell Romanian deadlift', '4×10']]))]);
  assert.deepEqual(names(out), ['Back squat', 'Dumbbell lateral raise', 'Cable triceps pushdown', 'Kettlebell swing']);
});

test('leg isolation is not posterior chain: a leg extension and a lying leg curl are trimmed like any finisher', () => {
  // A3a, A3b
  const out = run([MAIN, fin(BASE5.concat([['Lying leg curl', '4×12'], ['Leg extension', '4×12']]))]);
  assert.deepEqual(names(out), ['Back squat', 'Dumbbell lateral raise', 'Cable triceps pushdown', 'Hammer curl']);
});

test("the day's only hip extension survives a three-item trim", () => {
  // A4a, A4b
  const out = run([MAIN, fin(BASE5.concat([['Cable fly', '4×12'], ['Back extension', '4×12']]))]);
  assert.deepEqual(names(out), ['Back squat', 'Dumbbell lateral raise', 'Cable triceps pushdown', 'Back extension']);
});

test('when only the last hinge and a barbell compound are left, the day ships over the cap and nothing spins', () => {
  // A5a to A5d; E4n (the trim bails out when only protected work is left)
  assert.equal(TIER('Barbell bench press'), 3);
  const t0 = Date.now();
  const out = run([MAIN, { label: 'Accessory', items: [{ name: 'Barbell bench press', detail: '8×5' }, { name: 'Dumbbell Romanian deadlift', detail: '8×5' }] }]);
  assert.ok(Date.now() - t0 < 2000);
  assert.deepEqual(names(out), ['Back squat', 'Barbell bench press', 'Dumbbell Romanian deadlift']);
  assert.equal(cost(out), 21);
});

// The budget's one call site in buildProgram, and the same line recording what went in and what came out.
const CALLSITE = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const CALLSITE_REC = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __gb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__GREC) globalThis.__GREC.push({b:__gb,a:_day.sections}); } });\n";
/** Six tiers x {healthy, low back, shoulder, knee protect}, lift only, balanced advanced, seed 1013 (24 configs). */
function floorLattice(): { tag: string; cfg: LooseCfg }[] {
  const out: { tag: string; cfg: LooseCfg }[] = [];
  for (const t of ['commercial', 'home_full', 'home_basic', 'bodyweight', 'crossfit', 'minimal']) {
    for (const inj of [null, { region: 'lowback', tier: 'protect' }, { region: 'shoulder', tier: 'protect' }, { region: 'knee', tier: 'protect' }]) {
      const cfg: LooseCfg = { name: 'M', primaryPath: 'lift', cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, liftingFocus: 'balanced',
        experience: 'advanced', ageBracket: '18-35', equipment: t, unit: 'lbs', restDays: ['sun'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 1013 };
      if (inj) cfg['injury'] = inj;
      out.push({ tag: t + '/' + (inj ? inj.region : 'healthy'), cfg });
    }
  }
  return out;
}
// HAND regexes: {hinge, hip_ext} by name (leg_iso and calf_iso deliberately absent), and the three leg_iso machines.
const POST = /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull|hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i;
const ISO = /leg extension|lying leg curl|seated leg curl/i;
const countIf = (secs: Sections, re: RegExp): number => ([] as string[]).concat(...(secs || []).map((s: AppDay) => (s.items || []).map((i: AppDay) => String(i.name || '')))).filter((n) => re.test(n)).length;

test('on built programs, a day that reaches the budget with posterior chain leaves with it, and the floor is exercised', () => {
  // B0 to B4, A6b: the budget's call site recorded on 24 configs
  assert.equal(countIn(CALLSITE), 1, 'the call site is one line');
  const R = page(variant('budget-recorder', [[CALLSITE, CALLSITE_REC]]));
  let calls = 0, entered = 0, lost = 0, held = 0, iso = 0;
  for (const { cfg } of floorLattice()) {
    R.eval('globalThis.__GREC=[];');
    R.buildProgram(cfg);
    for (const r of R.eval('globalThis.__GREC')) {
      calls++;
      const pb = countIf(r.b, POST), pa = countIf(r.a, POST);
      if (countIf(r.b, ISO) > 0) iso++;
      if (pb > 0) { entered++; if (pa === 0) lost++; if (pb === 1 && pa === 1 && JSON.stringify(r.b) !== JSON.stringify(r.a)) held++; }
    }
  }
  assert.ok(calls > 500, 'budget calls ' + calls);
  assert.ok(entered > 200, 'days entering with posterior chain ' + entered);
  assert.equal(lost, 0, 'days that lost their posterior chain');
  assert.ok(held > 0, 'days that kept their one posterior item while the trim took something else');
  assert.equal(iso, 0, 'budget calls offered a leg isolation machine (a new one makes the leg_iso record below stale)');
});

test('the leg_iso exclusion: _pattern agrees with the hand table, and folding leg_iso into the floor moves no program here', () => {
  // A6a, A6b0, A6c: the lens is _isPostChain, one writer; folding leg_iso in changes 0 of 24 programs (doctrine-only)
  const LENS = "function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }";
  assert.equal(countIn(LENS), 1);
  const HAND: Record<string, boolean> = { 'Leg extension': true, 'Lying leg curl': true, 'Seated leg curl': true, 'Leg press': false };
  for (const [n, isIso] of Object.entries(HAND)) assert.equal(PAT(n) === 'leg_iso', isIso, n);
  const V = page(variant('leg-iso-posterior', [[LENS, "function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'||p==='leg_iso'; }"]]));
  const moved = floorLattice().filter(({ cfg }) => progDigest(IA.buildProgram(clone(cfg))) !== progDigest(V.buildProgram(clone(cfg)))).map((x) => x.tag);
  assert.deepEqual(moved, []);
});

// ── the frozen budget corpus ─────────────────────────────────────────────────────────────────────────────────────
test('capSessionBudget, _itemCost and _setCount replay the frozen corpus to the digests in tests/snapshots/session-budget.json', () => {
  // E5 (the legacy era rows: capSessionBudget D195 (V231), _itemCost and _setCount V196)
  const r = SB.replayCorpus(IA);
  assert.equal(r.days, 3708);
  assert.ok(r.trimmed > 0);
  matchSnapshot('session-budget', { budgetCorpus: r });
});

// ── the census, on a sample (the 288 cells are in the sweep) ─────────────────────────────────────────────────────
test('a program equals itself when built twice: HALF_MANNY on commercial and an injured wide cell', () => {
  // B6, B6b
  for (const over of [{ equipment: 'commercial', seed: 76308 },
    { equipment: 'commercial', seed: 76308, liftingFocus: 'hypertrophy', experience: 'advanced', injury: { region: 'shoulder', tier: 'protect' } }]) {
    const cfg: LooseCfg = Object.assign(clone(fixtures.HALF_MANNY), over);
    assert.equal(progDigest(IA.buildProgram(clone(cfg))), progDigest(IA.buildProgram(clone(cfg))));
  }
});

test('on the census sample: 18 core sections on every healthy program, no empty section, and the budget only removes', () => {
  // B1a, B2, B4e, B4c (48 cells: seed 76308, every injury path and tier)
  const P = page();
  const on = SB.census(P, false, SB.SAMPLE), off = SB.census(P, true, SB.SAMPLE);
  assert.equal(on.cellsSwept, 48);
  for (const c of SB.SAMPLE.filter((x) => x.inj === 'healthy')) assert.equal(on.cells[c.key]?.coreSec, SB.CORE_PER_BUILD, c.tag);
  for (const e of SB.EQUIP) assert.equal(on.tiers[e]?.emptySec, 0, e);
  const T = SB.tally(off, on);
  assert.equal(T.added, 0, 'sections that appeared after the budget');
  assert.ok(Object.keys(T.kinds).length > 0, 'the budget deleted something on the sample');
  for (const k of Object.keys(T.kinds)) assert.ok(k in SB.V192_NONOPT_CLASSES, 'class outside the V192 census: ' + k);
});

// ── D195-B: the cost lens ────────────────────────────────────────────────────────────────────────────────────────
const TUE_9 = [
  // D241 (v0.242.0) drew the pin squat into the squat main and the KB hip flexor raise into the hip block.
  'Main — Barbell pin squat :: Barbell pin squat 4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest',
  'Leg superset A (SS 3) :: Dumbbell Bulgarian split squat 3×8–12 each @ RPE 8 | Terminal knee extension (band) 3×25 sec',
  'Leg superset B (SS 3) :: Kettlebell single-leg deadlift 3×6–10 @ RPE 8 | 45° back extension 3 sets — RPE 8 (stop 2 reps short of failure)',
  // D239 (v0.241.0) moved these two prehab blocks, nothing else on the card.
  'Hip stability :: Kettlebell hip flexor raise 2×10 each | Hip airplane (light KB) 2×6 each, slow | Weighted 90/90 hip switch 2×6 each',
  'Foot & ankle :: Split-squat heel-raise hold 2×30 sec each | Single-leg KB pass-around 2×5 each direction, each leg',
  'Loaded carry finisher :: Overhead carry 3×40 yards each, heavy',
];
// D239: without the lens the day now keeps the Terminal knee extension it used to cut: the two new holds cost half
// under the older hold rule (_isHalf's \bhold\b) where the drills they replaced cost full.
const TUE_9_WITHOUT = [TUE_9[0], TUE_9[1],
  'Leg superset B :: Kettlebell single-leg deadlift 3×6–10 @ RPE 8', TUE_9[3], TUE_9[4]];
const INC = 'Main — Incline barbell press :: Incline barbell press 4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest | Barbell overhead press 3×6–10 @ RPE 8';
const CK = 'Chest + knee (SS 3) :: Dumbbell incline press 3×10–15 @ RPE 8 | Terminal knee extension (band) 3×25 sec';
const CORE = 'Core — Anti-Rotation :: Bird dogs 3×12 each';
const MON_9 = [INC, 'Conditioning :: Burpees 3×12', CK, CORE];
const MON_9_WITHOUT = [INC, CK, CORE];

test('the cost lens prices the prehab rails at half, so PRT TING keeps what the ruling printed (W9 Tuesday and Monday)', () => {
  // D195-B-a: a-digest, a-tue, a-mon
  const C = SB.twice(null, SB.PRT);
  assert.ok(C.self, 'PRT TING equals itself');
  assert.equal(C.dig, '997add753ad41179');   // 1119727db3f37832 until D239, f61dab1548de2a20 until D241
  assert.deepEqual(SB.cardLines(C.prog.weeks[9].tue), TUE_9);
  assert.deepEqual(SB.cardLines(C.prog.weeks[9].mon), MON_9);
});

test('without the cost lens PRT TING is the program the ruling measured before it, and 9 of 77 days differ', () => {
  // D195-B-a: a-cells, and the before half of a-v230/a-before on the app without the lens
  const N = SB.twice(SB.noCostLens(), SB.PRT), C = SB.twice(null, SB.PRT);
  assert.ok(N.self);
  assert.equal(N.dig, '81742326331d5c5b');   // 3a053a2ac8cb2b44 until D239, c6f054bee6f8b22b until D241
  assert.deepEqual(SB.cardLines(N.prog.weeks[9].tue), TUE_9_WITHOUT);
  assert.deepEqual(SB.cardLines(N.prog.weeks[9].mon), MON_9_WITHOUT);
  const differ: string[] = [];
  let cells = 0;
  for (const w of SB.weekKeys(N.prog)) for (const d of DAYS) { cells++; if (SB.daySig(N.prog.weeks[w][d]) !== SB.daySig(C.prog.weeks[w][d])) differ.push('W' + w + ' ' + d); }
  assert.equal(cells, 77);
  assert.deepEqual(differ, ['W1 mon', 'W1 tue', 'W2 tue', 'W3 tue', 'W5 tue', 'W6 tue', 'W7 tue', 'W9 mon', 'W9 tue']);
});

test("the cost lens alone is PRT TING whole, and moves no byte of HALF_MANNY", () => {
  // D195-B-a: a-cfB; D195-B-c: c-cfB, c-bytes (B alone = the app without D195-A; neither = without A and B)
  assert.equal(SB.twice(SB.noHipExtA(), SB.PRT).dig, '997add753ad41179');
  const B = SB.twice(SB.noHipExtA(), fixtures.HALF_MANNY), V = SB.twice(SB.noD195(), fixtures.HALF_MANNY);
  assert.ok(B.self && V.self);
  assert.equal(B.dig, '895bb404a809927b');   // 0ac7da6b1691a8e1 until D239, b1b15c80f1a703f1 until D241, c17e854e54e86f57 until D243
  assert.equal(V.dig, '895bb404a809927b');
  assert.equal(SB.dayJ(B.prog.weeks), SB.dayJ(V.prog.weeks));
  assert.equal(SB.weekKeys(V.prog).length * 7, 98);
});

test('on a sample of the shard the lens only adds back what the budget had cut, plus the ruled B-2 change', () => {
  // D195-B-b on 12 shard configs and the typed B-3 and B-2 cells (the 650 are in the sweep). D239 (v0.241.0) moved the
  // B-3 cell's prehab draw, and without the lens that day now keeps the Glute-ham raise and its partner, so the one
  // removal D195-B printed there (the good morning re-picked away) no longer happens: the lens removes nothing.
  assert.equal(countIn(SB.BUDGET_OFF_SWITCH), 1);
  const rows = SB.costLensShard().filter((_, i) => i % 54 === 0).concat([SB.B3, SB.B2]);
  const r = SB.costLensDiff(rows);
  assert.deepEqual(r.crashed, []);
  assert.equal(r.built, 14);
  assert.ok(r.boDiff > 0 && r.changed > 0 && r.added > 0);
  assert.deepEqual(r.removed.map((x) => [x.row.tag, x.w, x.d, x.lab, x.n]), []);
  assert.equal(r.addedOff, r.added, 'added items the budget-off card does not carry: ' + r.novel.join('; '));
  assert.deepEqual(r.details.filter((x) => !x.isB2).map((x) => x.s), []);
  assert.equal(r.b2, 1);
  assert.deepEqual(r.other, []);
  const b3 = r.b3;
  assert.ok(b3, 'the B-3 cell changed');
  const secA = b3.a.filter((x) => x[2] === SB.B3.label).map((x) => x[0]), secB = b3.b.filter((x) => x[2] === SB.B3.label).map((x) => x[0]);
  assert.deepEqual(secA.slice().sort(), [SB.B3.partner, SB.B3.restored].sort(), 'without the lens the cell keeps the Glute-ham raise and its partner');
  assert.deepEqual(secB.slice().sort(), [SB.B3.partner, SB.B3.restored].sort());
  assert.ok(SB.HINGE_HAND.test(SB.B3.gone) && SB.HINGE_HAND.test(SB.B3.partner));
  assert.ok(b3.bo.map((x) => x[0]).includes(SB.B3.restored));
});
