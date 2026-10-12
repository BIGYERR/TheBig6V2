// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The compound tier: _compoundTier ranks a movement 0 to 3, and tier 3 is a loaded compound the session budget never
// trims, the swap sheet tags HEAVY COMPOUND and the load note measures a swap against. Ruling D89 (V200): a drill
// declared family 'core' in _AUX_FAMILY is a core drill, never a loaded compound (the clause in _compoundTier returns
// 0). _isCompound is untouched, so _itemCost still prices Pallof press as a compound; only the skip and the two copy
// readers moved. D96's tier-3 controls hold. The record is in the handoff and tests/measure/v200_rulings/.
//
// The counterfactual is the app with the one clause line removed (tests/support/session-budget.js variant()). Its
// HALF_MANNY digest is a golden value in tests/snapshots/compound-tier.json (the legacy MANNY_CORE_OFF_DIGEST_BY_VERSION
// row, current).
//
// Oracles are typed by hand: the 23 declared-core names, the D96 control tiers, the load note sentence, the ruled card
// shape on the 49-config lattice (one cell: HALF_MANNY W11 Monday, Pallof press to Plank shoulder taps).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock, fixtures, weekGrid, progDigest } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import * as SB from '../support/session-budget.ts';
const { clone, DAYS, countIn } = SB;

const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
const IA = SB.page();
const MO = SB.page(SB.variant('no-core-clause', [[CLAUSE, '']]));
const fn = (X, n) => X.eval(n);
const T = (n) => fn(IA, '_compoundTier')(n), MT = (n) => fn(MO, '_compoundTier')(n);
const LN = (a, b) => fn(IA, 'swapLoadNote')(a, b), MLN = (a, b) => fn(MO, 'swapLoadNote')(a, b);
const note = (out) => 'Much lighter than ' + out.toLowerCase() + '. Volume holds, top-end strength does not.';

// Typed off the _AUX_FAMILY literal once: the names the author filed as family 'core'.
const CORE23 = ['Ab wheel rollouts', 'Bird dogs', 'Dead bugs', 'Dead bug (slow tempo)', 'Garhammer raises', 'Hanging knee raises',
  'Hanging leg raises', 'Hanging hold', 'L-sit hold', 'McGill curl-up', 'Pallof press', 'Plank hold', 'RKC plank', 'Side plank',
  'Superman', 'Toes-to-bar', 'Windshield wipers', 'Cable woodchoppers', 'Landmine rotations', 'Medicine ball rotary toss',
  'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Band woodchopper (door anchor)'];

test('the 23 names declared core in _AUX_FAMILY are the hand table, and every one is tier 0', () => {
  // A0a, A0b, A1, A2
  const fam = IA.eval('_AUX_FAMILY');
  const declared = Object.keys(fam).filter((n) => fam[n] === 'core');
  assert.equal(declared.length, 23);
  assert.deepEqual(declared.slice().sort(), CORE23.slice().sort());
  assert.deepEqual(CORE23.filter((n) => T(n) !== 0), []);
  assert.equal(T('Pallof press'), 0);
});

test("D96's controls keep their tiers: the ruling selects a family, it deletes no tier", () => {
  // B1, B2, B3
  const CTRL = [['Jump squats', 3], ['TRX row (if available)', 3], ['Straight-arm pulldown', 3], ['Back squat', 3], ['Bench press', 3],
    ['Overhead press', 3], ['Barbell row', 3], ['Barbell deadlift', 3], ['Dumbbell bench press', 2], ['Chinups', 1], ['Band pull-apart', 1]];
  for (const [n, t] of CTRL) assert.equal(T(n), t, n);
});

test('the clause lives in _compoundTier, not _isCompound: Pallof press is still a compound to _isCompound', () => {
  // C1, C2a, C2b, C2c
  assert.equal(!!IA.eval('_isCompound')('Pallof press'), true);
  assert.equal(countIn(CLAUSE), 1);
  assert.ok(String(IA.eval('_compoundTier')).includes(CLAUSE.trim()));
  assert.ok(!String(IA.eval('_isCompound')).includes('_auxFamily'));
});

test('the load note speaks from a two-tier drop, and never on a swap off Pallof press', () => {
  // D0a, D0b (the threshold, read from behaviour), D1a, D1b, D1c
  assert.equal(LN('Back squat', 'Dumbbell bench press'), '', 'one tier down says nothing');
  assert.equal(LN('Back squat', 'Chinups'), note('Back squat'), 'two tiers down says so');
  assert.equal(T('Plank shoulder taps'), 0);
  assert.notEqual(IA.eval('_auxFamily')('Plank shoulder taps'), 'core');
  assert.equal(LN('Pallof press', 'Plank shoulder taps'), '');
  assert.equal(LN('Pallof press', 'Chinups'), '');
});

test('without the clause Pallof press is tier 3 and the same swap reads the old load note', () => {
  // D2a, D2b, F0
  assert.equal(MT('Pallof press'), 3);
  assert.equal(MLN('Pallof press', 'Plank shoulder taps'), note('Pallof press'));
});

/** The swap sheet's tags for one item on a built day (a fresh page that keeps its document). */
function swapTags(file, sections, si, ii) {
  const X = loadApp(file ? { file, dom: true } : { dom: true });
  pinClock(X, SB.CLOCK);
  const cfg = clone(fixtures.HALF_MANNY), p = X.buildProgram(clone(cfg));
  p.cfg = cfg;
  p.weeks[1].mon = Object.assign({}, p.weeks[1].mon, { rest: false, sections: clone(sections) });
  X.ctx.__P = p;
  X.eval("activeProg=__P;activeProgId='P1';currentWeek=1;currentDayKey='mon';");
  X.eval('openSwapSheet(' + si + ',' + ii + ')');
  return String(X.els.swapTags.innerHTML);
}
const DAY = [
  { label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '5×5' }] },
  { label: 'Accessory', items: [{ name: 'Back squat', detail: '3×8' }, { name: 'Dumbbell bench press', detail: '3×10' }, { name: 'Pallof press', detail: '3×10' }] },
];

test('the swap sheet tags HEAVY COMPOUND from tier 3 outside the main slot, never on Pallof press; MAIN LIFT wins the main slot', () => {
  // E0a, E0b (the predicate and its threshold, read from the sheet), E1, E2, E3
  const H = '<span class="swap-tag">HEAVY COMPOUND</span>', M = '<span class="swap-tag">MAIN LIFT</span>';
  const squat = swapTags(null, DAY, 1, 0), bench = swapTags(null, DAY, 1, 1), pallof = swapTags(null, DAY, 1, 2), main = swapTags(null, DAY, 0, 0);
  assert.ok(squat.includes(H), squat);
  assert.ok(!bench.includes(H), 'a tier 2 lift is not tagged: ' + bench);
  assert.ok(!pallof.includes(H), pallof);
  assert.ok(main.includes(M) && !main.includes(H), main);
});

test('without the clause the sheet tags Pallof press HEAVY COMPOUND', () => {
  // E4
  assert.ok(swapTags(SB.variant('no-core-clause', [[CLAUSE, '']]), DAY, 1, 2).includes('<span class="swap-tag">HEAVY COMPOUND</span>'));
});

test("HALF_MANNY without the clause matches tests/snapshots/compound-tier.json", () => {
  // F1a (the legacy MANNY_CORE_OFF_DIGEST_BY_VERSION row, current)
  const a = progDigest(MO.buildProgram(clone(fixtures.HALF_MANNY))), b = progDigest(SB.page(SB.variant('no-core-clause', [[CLAUSE, '']])).buildProgram(clone(fixtures.HALF_MANNY)));
  assert.equal(a, b, 'the counterfactual equals itself on two pages');
  matchSnapshot('compound-tier', { halfMannyWithoutTheCoreClause: a });
});

// ── the 49-config lattice: HALF_MANNY plus six tiers x two foci x two experiences x two seeds, lift only ───────────
const CFGS = [clone(fixtures.HALF_MANNY)];
for (const e of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal']) for (const f of ['balanced', 'support_prevention'])
  for (const x of ['intermediate', 'advanced']) for (const sd of [4242, 9001]) {
    CFGS.push({ name: 'L', primaryPath: 'lift', cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, liftingFocus: f, experience: x,
      ageBracket: '18-35', equipment: e, unit: 'lbs', restDays: ['sun'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: sd });
  }
const BEFORE = 'Core — Anti-Rotation[Pallof press]', AFTER = 'Core — Anti-Rotation[Plank shoulder taps]';
const HOOK = "var __CRF=function(j){ return JSON.stringify(capRegionalFatigue(JSON.parse(j),null,null,'base')); };"
  + "var __DED=function(wj,cj,s,t){ var w=JSON.parse(wj); var m=deconflictAdjacentDupes(w,JSON.parse(cj),s,t); return JSON.stringify([m,w]); };"
  + "var __SC=function(n,dj,w,pj){ return JSON.stringify(swapCandidates(n,JSON.parse(dj),w,JSON.parse(pj))); };"
  + "var __AC=function(dj,w,pj){ return JSON.stringify(addCandidates(JSON.parse(dj),w,JSON.parse(pj))); };";
IA.eval(HOOK); MO.eval(HOOK);
const L = { lines: 0, changed: [], pallof: 0, coreLost: 0, lenMismatch: 0, other: [], r1: [0, 0], r2: [0, 0], r3: [0, 0], r4: [0, 0] };
CFGS.forEach((cfg, ci) => {
  const pc = IA.buildProgram(clone(cfg)), pm = MO.buildProgram(clone(cfg));
  const gc = weekGrid(pc).split('\n'), gm = weekGrid(pm).split('\n');
  if (gc.length !== gm.length) L.lenMismatch++;
  L.lines += gm.length;
  for (let i = 0; i < Math.min(gc.length, gm.length); i++) {
    if (/Pallof press/.test(gm[i])) L.pallof++;
    if (gc[i] === gm[i]) continue;
    const [hb, rb] = gm[i].split(' :: '), [ha, ra] = gc[i].split(' :: ');
    const bb = (rb || '').split(' | '), aa = (ra || '').split(' | ');
    const diff = [];
    for (let k = 0; k < Math.max(bb.length, aa.length); k++) if (bb[k] !== aa[k]) diff.push(k);
    const ruled = hb === ha && bb.length === aa.length && diff.length === 1 && bb[diff[0]] === BEFORE && aa[diff[0]] === AFTER;
    if (!ruled) L.other.push('cfg' + ci + ' :: ' + gm[i] + '  -->  ' + gc[i]);
    L.changed.push('cfg' + ci + ' ' + hb.split(' ').slice(0, 2).join(' '));
    if (aa.filter((s) => /^Core/.test(s)).length < bb.filter((s) => /^Core/.test(s)).length) L.coreLost++;
  }
  // R1 to R4 read off the counterfactual's own days, on both apps
  const tw = Object.keys(pm.weeks).length, wj = JSON.stringify(pm.weeks), cj = JSON.stringify(pm.cfg || cfg), pj = JSON.stringify(pm);
  L.r2[1]++; if (IA.eval('__DED')(wj, cj, cfg.seed, tw) !== MO.eval('__DED')(wj, cj, cfg.seed, tw)) L.r2[0]++;
  for (const wk of Object.keys(pm.weeks)) for (const dk of DAYS) {
    const day = pm.weeks[wk][dk];
    if (!day || !day.sections || !day.sections.length) continue;
    const sj = JSON.stringify(day.sections);
    L.r1[1]++; if (IA.eval('__CRF')(sj) !== MO.eval('__CRF')(sj)) L.r1[0]++;
    const nm = [].concat(...day.sections.map((s) => (s.items || []).map((i) => i.name)));
    if (nm.indexOf('Pallof press') < 0) continue;
    const dj = JSON.stringify(day);
    L.r4[1]++; if (IA.eval('__AC')(dj, +wk, pj) !== MO.eval('__AC')(dj, +wk, pj)) L.r4[0]++;
    for (const n of nm) { L.r3[1]++; if (IA.eval('__SC')(n, dj, +wk, pj) !== MO.eval('__SC')(n, dj, +wk, pj)) L.r3[0]++; }
  }
});

test('on the 49-config lattice exactly one cell moves, HALF_MANNY W11 Monday, in the ruled shape, and no day loses a core section', () => {
  // F2a, F2b, F2c, F3, F4a, F4b, F4c, F5
  assert.equal(CFGS.length, 49);
  assert.equal(L.lines, 1798);
  assert.equal(L.lenMismatch, 0);
  assert.equal(L.pallof, 35, 'cells carrying Pallof press without the clause');
  assert.deepEqual(L.changed, ['cfg0 W11 MON']);
  assert.deepEqual(L.other, []);
  assert.equal(L.coreLost, 0);
});

test('regional fatigue, the adjacent-day dedupe, the swap candidates and the add candidates decide the same with or without the clause', () => {
  // G0 (Pallof press has no pattern, so R3 and R4 drop it before ranking), G1, G1d, G2, G3, G3d, G4, G4d
  assert.equal(IA.eval('_pattern')('Pallof press') == null, true);
  assert.deepEqual(L.r1, [0, 1796]);
  assert.deepEqual(L.r2, [0, 49]);
  assert.deepEqual(L.r3, [0, 213]);
  assert.deepEqual(L.r4, [0, 35]);
});
