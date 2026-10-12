// One card, one movement: no movement prints twice on a card, and none repeats the day's Main in another section.
// Rulings: D52 slice 5 (the lowback/protect row slot, the carry and pillar subtraction, the Delt finisher, the chest
// accessories, the light-press chain), D159, D164, D165, D166 (the draw-site twins), D198 (the full-lower hip-extension
// pick never repeats the day's hinge).
//
// Oracles: hand tables of what each tier owns and what each pool holds, the cards themselves, typed cards from the
// rulings, and a counterfactual copy of the app with the D198 line written out. Nothing asks the engine what a card
// should be. This file runs samples; tests/sweeps/duplicate-movements.test.js runs the full lattices.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, progDigest } from '../support/app.ts';
import * as D from '../support/duplicate-movements.ts';
const IA = loadApp();
const EXLIB = D.clone(IA.eval('EXLIB'));   // plain data: arrays from the app's realm never deep-equal host arrays

// ── hand tables: every floor the subtraction leaves is at least what a section needs ─────────────────────────
test('the lowback/protect row slot keeps at least two vertical pulls once the drawn main is excluded', () => {
  for (const e of D.EQUIP) {
    const pool = D.LB_ROWPOOL(e);
    if (D.TIERS[e].cables) {
      assert.deepEqual(pool, ['Straight-arm pulldown'], e + ' keeps the straight-arm pulldown, a name the main pool cannot hold');
      continue;
    }
    assert.ok(pool.length - 1 >= 2, e + ': ' + pool.join(', '));
  }
});

// Anti-rotation membership and what each member needs, hand typed. Only the two carries can also be on a lift card.
const AR_MEMBERS = [
  { name: 'Bird dogs', need: null }, { name: 'Side plank', need: null }, { name: 'Plank shoulder taps', need: null },
  { name: 'Pallof press', need: 'band' }, { name: 'Dumbbell renegade rows', need: 'load' },
  { name: 'Farmer carry', need: 'load' }, { name: 'Suitcase carry', need: 'load' },
];
const BANDS: Record<string, boolean> = { bodyweight: false, minimal: false, home_basic: true, home_full: true, commercial: true, crossfit: true };

test('the anti-rotation pillar keeps two members on every tier even when the card holds both carries', () => {
  for (const e of D.EQUIP) {
    const legal = AR_MEMBERS.filter((m) => m.need === null || (m.need === 'band' ? BANDS[e] : D.TIERS[e][m.need as keyof D.RowTier])).map((m) => m.name);
    const worst = legal.filter((n) => n !== 'Farmer carry' && n !== 'Suitcase carry').length;
    assert.ok(legal.length >= 2 && worst >= 2, e + ': ' + worst + ' left of ' + legal.length);
  }
  assert.deepEqual(D.clone(IA.eval('CORE_PILLARS').anti_rotation.items).map((i: { name: string }) => i.name), AR_MEMBERS.map((m) => m.name), 'the live pillar is the hand list, in rotation order');
});

test('the Delt finisher keeps a member on every tier once the card\'s own shoulder pick is subtracted', () => {
  const LOADED = [['Dumbbell lateral raise', 'db'], ['Cable lateral raise', 'cable'], ['Dumbbell front raise', 'db'], ['Dumbbell rear delt fly', 'db'], ['Face pull', 'cable']];
  const NOLOAD = ['Prone Y-T-W raises', 'Wall slides'];
  for (const e of D.EQUIP) {
    const legal = e === 'bodyweight' ? NOLOAD : LOADED.filter(([, need]) => need !== 'cable' || D.TIERS[e].cables).map(([n]) => n);
    const collider = e === 'bodyweight' ? 'Prone Y-T-W raises' : 'Dumbbell lateral raise';
    assert.ok(legal.filter((n) => n !== collider).length >= 1, e);
  }
  assert.deepEqual(EXLIB.shoulder_iso, LOADED.map(([n]) => n));
  assert.deepEqual(EXLIB.shoulder_iso_bw, NOLOAD);
});

test('the chest accessories leave the Accessory two names and Chest + knee one on every tier', () => {
  const CHEST_ACC = ['Dumbbell incline press', 'Dumbbell bench press', 'Dips', 'Pushups (slow tempo)', 'Diamond pushups', 'Dumbbell decline press', 'Dumbbell floor press'];
  const SHOULDER_ACC = ['Barbell overhead press', 'Dumbbell Arnold press', 'Kettlebell single-arm press', 'Dumbbell lateral raise', 'Barbell push press', 'Landmine rotational press'];
  assert.deepEqual(CHEST_ACC.filter((n) => SHOULDER_ACC.includes(n)), [], 'the Main pairing can take at most one chest accessory name');
  for (const e of D.EQUIP) {
    const size = e === 'bodyweight' ? 3 : CHEST_ACC.length;   // bodyweight reads a three-name window of its ladder
    assert.ok(size - 1 >= 2 && size - 2 >= 1, e);
  }
  assert.deepEqual(EXLIB.chest_acc, CHEST_ACC);
});

test('the light-press fallback chain always leaves two names and has no unguarded terminal', () => {
  const src = D.appText();
  const line = src.split('\n').find((l) => /const _lpFallback=\[/.test(l)) || '';
  const names = line.match(/'[^']+'/g) || [];
  assert.deepEqual(names, ["'Dumbbell incline press'", "'Dumbbell bench press'", "'Pushups (slow tempo)'", "'Close-grip pushups'", "'Diamond pushups'"]);
  assert.ok(names.length - 3 >= 2, 'the guard names three movements (the chest main and two accessories)');
  assert.doesNotMatch(src, /_lpFallback[\s\S]{0,400}?\[0\]\s*\|\|/, "no '||' fallback to an unfiltered name");
});

// ── the same-card sample: every other cell of one seed of the 864-cell lattice ──────────────────────────────
const SC = D.surveySamecard(IA, D.samecardLattice([1013]).filter((_, i) => i % 2 === 0));
const RULED = ['Assisted pullups', 'Farmer carry', 'Suitcase carry', 'Bird dogs', 'Dumbbell lateral raise', 'Dumbbell bench press', 'Dumbbell decline press', 'Pushups (slow tempo)', 'Kettlebell swing'];

test('no movement prints twice on one card (same-card sample)', () => {
  assert.deepEqual(SC.errors, []);
  assert.equal(SC.builds, 144);
  for (const n of RULED) assert.equal(SC.dupByName[n] || 0, 0, n);
  assert.deepEqual(SC.dupExamples, [], 'no name twice on any card');
  assert.deepEqual(SC.mainDupByName, {}, "no card repeats its Main movement");
});

test('the lowback/protect pull day never repeats its main and draws only from the hand pool (sample)', () => {
  assert.ok(SC.lbPullDays > 0, 'the sample holds vertical-pull main days');
  assert.equal(SC.lbRowEqualsMain, 0);
  assert.deepEqual(SC.lbRowOffTable, []);
  assert.equal(SC.lbPullBeyondMain, SC.lbPullDays, 'every such day still pulls beyond the main');
});

test('the subtraction selects another name and never deletes the section (sample)', () => {
  assert.ok(SC.carryFinishers > 0, 'loaded carry finisher');
  assert.ok(SC.deltFinishers > 0, 'Delt finisher');
  assert.ok(SC.chestKnees > 0, 'Chest + knee');
  assert.ok(SC.accessories > 0, 'Accessory or Pump');
  assert.deepEqual(SC.mainOnlyPush, [], 'no push card left with its Main and nothing else');
});

// ── the draw-site twins: the D164 repro and a sample of the WIDE lattice ────────────────────────────────────
const WIDE = D.wideLattice();

test('the D164 repro is on the WIDE lattice once and builds identically twice', () => {
  const fx = WIDE.filter(D.isD164Repro);
  assert.equal(fx.length, 1);
  assert.equal(fx[0].c.ageBracket, '55+');
  assert.equal(progDigest(IA.buildProgram(D.clone(fx[0].c))), progDigest(IA.buildProgram(D.clone(fx[0].c))));
});

test('the D164 repro\'s W1 Monday Chest volume is a pec deck, and no name prints twice on that card', () => {
  const card = IA.buildProgram(D.clone(WIDE.find(D.isD164Repro)!.c)).weeks[1].mon;
  const cv = D.live(card).filter((s) => s.label === 'Chest volume');
  assert.equal(cv.length, 1);
  assert.deepEqual(D.clone(cv[0].items).map((i: { name: string; detail: string }) => D.clean(i.name) + ' ' + i.detail), ['Pec deck 3×12–15 @ RPE 6–7']);
  assert.deepEqual(D.cardInfo(card).dup, []);
});

test('no draw-site twin class prints on a sample of the WIDE lattice', () => {
  const T = D.surveyDraws(IA, WIDE.filter((_, i) => i % 96 === 0));
  assert.deepEqual(T.crash, []);
  assert.equal(T.dup, 0, 'a name on two items of one card: ' + T.dupEx.join(' | '));
  assert.equal(T.li, 0, 'Leg isolation holding an on-card name (D159)');
  assert.equal(T.tgt, 0, 'the shoulder/workaround swap target twice (D164)');
  assert.equal(T.c165, 0, 'the Main in Leg superset A or Leg circuit (D165)');
  assert.equal(T.c166, 0, 'the Main in Pull superset B (D166)');
});

// ── D198: the full-lower hip-extension pick ───────────────────────────────────────────────────────────────
const TREES = D.hepTrees();

test('the app carries the D198 line and the hipExtBW pool it draws from, once each', () => {
  assert.equal(D.count(TREES.text, D.D198_LINE), 1);
  assert.equal(D.count(TREES.text, D.HIPEXT_LITERAL), 1);
});

test('the typed full-lower cards read the after-cards, and the pre-D198 copy the before-cards', () => {
  const cells = Object.fromEntries(D.hepLattice().map((c) => [c.key, c.cfg]));
  for (const X of D.HEP_CARDS) {
    const cand = TREES.cand.buildProgram(D.clone(cells[X.key]));
    const pre = TREES.pre.buildProgram(D.clone(cells[X.key]));
    for (const [w, d] of X.at) {
      assert.deepEqual([D.LS, D.HEP].map((l) => D.cardOf(D.liveSec(cand, w, d, l))), X.after, X.tag + ' W' + w + ' ' + d);
      assert.deepEqual([D.LS, D.HEP].map((l) => D.cardOf(D.liveSec(pre, w, d, l))), X.pre, X.tag + ' W' + w + ' ' + d + ' (pre-D198)');
    }
  }
});
