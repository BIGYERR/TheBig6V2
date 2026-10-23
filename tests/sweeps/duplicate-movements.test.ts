// One card, one movement, on the full lattices (CI only; tests/integration/duplicate-movements.test.js runs samples).
// Rulings: D52 slice 5, D159, D164, D165, D166, D198. Helpers and lattices: tests/support/duplicate-movements.js.
//
// The three counts the D164 ruling pinned as equalities on the WIDE lattice (Chest + knee sections, those with no
// chest movement, one-item Biceps on elbow/workaround) are current golden values in tests/snapshots/duplicate-movements.json.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, progDigest } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import * as D from '../support/duplicate-movements.ts';
const IA = loadApp();

// ── one card, one movement: 8 injury paths x 6 tiers x 2 foci x 3 experience levels x 3 seeds ──────────────────
let SC: D.SamecardSurvey | undefined;
const samecard = () => SC || (SC = D.surveySamecard(IA, D.samecardLattice([1013, 3039, 76308])));

test('the same-card lattice builds whole (864 builds)', () => {
  assert.deepEqual(samecard().errors, []);
  assert.equal(samecard().builds, 864);
});

test('no movement prints twice on one card, by name for every ruled class', () => {
  const S = samecard();
  for (const n of ['Assisted pullups', 'Farmer carry', 'Suitcase carry', 'Bird dogs', 'Dumbbell lateral raise', 'Dumbbell bench press', 'Dumbbell decline press', 'Pushups (slow tempo)', 'Kettlebell swing'])
    assert.equal(S.dupByName[n] || 0, 0, n);
  assert.deepEqual(S.dupExamples, [], 'no name twice on any of ' + S.days + ' cards');
});

test('no card repeats its Main movement in another section', () => {
  assert.deepEqual(samecard().mainDupByName, {});
});

test('the lowback/protect pull day never repeats its main and draws its vertical pull from the hand pool', () => {
  const S = samecard();
  assert.ok(S.lbPullDays > 0, 'the lattice holds lowback/protect vertical-pull main days');
  assert.ok(S.lbRowSlots > 0);
  assert.equal(S.lbRowEqualsMain, 0);
  assert.deepEqual(S.lbRowOffTable, []);
});

test('the subtraction selects another name and never deletes a section', () => {
  const S = samecard();
  assert.equal(S.lbPullBeyondMain, S.lbPullDays, 'every lowback/protect vertical-pull day still pulls beyond its main');
  assert.ok(S.carryFinishers > 0, 'the loaded carry finisher still prints');
  assert.ok(S.deltFinishers > 0, 'the Delt finisher still prints');
  assert.ok(S.chestKnees > 0, 'Chest + knee still prints');
  assert.ok(S.accessories > 0, 'the Accessory or Pump block still prints');
  assert.deepEqual(S.mainOnlyPush, [], 'no push card is left with its Main and nothing else');
});

// ── the draw-site twins on the WIDE lattice (13,104 configs) ────────────────────────────────────────────────
let WT: D.DrawSurvey | undefined;
const WIDE = D.wideLattice();
const wide = () => WT || (WT = D.surveyDraws(IA, WIDE));

test('the WIDE lattice is 13,104 configs, 1,008 of them shoulder/workaround and 1,008 elbow/workaround', () => {
  assert.equal(WIDE.length, 13104);
  assert.equal(WIDE.filter((x) => x.ik === 'shoulder/workaround').length, 1008);
  assert.equal(WIDE.filter((x) => x.ik === 'elbow/workaround').length, 1008);
});

test('every WIDE config builds', () => {
  const T = wide();
  assert.deepEqual(T.crash.slice(0, 3), []);
  assert.equal(T.n, 13104);
  assert.equal(T.nCK, 1008);
  assert.equal(T.nEW, 1008);
});

test('no name prints twice on any WIDE card, and no ruled twin class prints (D159, D164, D165, D166)', () => {
  const T = wide();
  assert.equal(T.dup, 0, T.dupEx.join(' | '));
  assert.equal(T.li, 0, 'Leg isolation holding an on-card name');
  assert.equal(T.tgt, 0, 'the shoulder/workaround swap target twice');
  assert.equal(T.c165, 0, 'the Main in Leg superset A or Leg circuit');
  assert.equal(T.c166, 0, 'the Main in Pull superset B');
});

test('the D164 counts on the WIDE lattice match tests/snapshots/duplicate-movements.json', () => {
  const T = wide();
  matchSnapshot('duplicate-movements', {
    'wide lattice': { chestKneeSections: T.ck, chestKneeWithoutChest: T.ckNo, elbowWorkaroundOneItemBiceps: T.bic1 },
  });
});

// ── D198 on the deload lattice's 576 `sun` cells, the app and the pre-D198 copy ─────────────────────────────
const HEP_CELLS = D.hepLattice();
let HT: { trees: ReturnType<typeof D.hepTrees>; cand: D.HepSurvey; pre: D.HepSurvey } | undefined;
function hep(): { trees: ReturnType<typeof D.hepTrees>; cand: D.HepSurvey; pre: D.HepSurvey } {
  if (HT) return HT;
  const trees = D.hepTrees();
  HT = { trees, cand: D.surveyHep(trees.cand, HEP_CELLS), pre: D.surveyHep(trees.pre, HEP_CELLS) };
  return HT;
}
const dayKey = (x: D.HepDay) => x.key + ' W' + x.w + ' ' + x.d;

test('a full-lower day never holds its hinge in both Lower strength and Hip extension + push', () => {
  const H = hep();
  assert.equal(HEP_CELLS.length, 576);
  assert.ok(H.cand.hepDays > 0, 'the lattice prints days carrying both sections');
  assert.deepEqual(H.cand.doubled.map(dayKey), []);
});

test('a reused app builds every probe cell exactly as a fresh one does', () => {
  const H = hep();
  for (const i of [0, 97, 194, 291, 388, 485]) {
    const fresh = D.pinDate(D.loadText(H.trees.text, 'fresh'), D.HEP_CLOCK).buildProgram(D.clone(HEP_CELLS[i].cfg));
    assert.equal(progDigest(H.cand.progs[HEP_CELLS[i].key]), progDigest(fresh), HEP_CELLS[i].key);
  }
});

test('the pre-D198 copy repeats the hinge on 70 days of 20 loaded lowback/protect programs, W9 to W12 Saturdays', () => {
  const dq = hep().pre.doubled;
  assert.equal(dq.length, 70);
  assert.equal(new Set(dq.map((x) => x.key)).size, 20);
  for (const x of dq) {
    assert.ok(['commercial', 'crossfit', 'home_basic', 'home_full', 'minimal'].includes(x.eq), dayKey(x));
    assert.equal(x.inj, 'lowback/protect', dayKey(x));
    assert.ok(['9', '10', '11', '12'].includes(x.w) && x.d === 'sat', dayKey(x));
  }
});

test('the pre-D198 copy collapses Hip extension + push to one item on the 21 typed days', () => {
  const pre = new Set(hep().pre.oneItem.map(dayKey));
  assert.equal(D.COLLAPSE_21.length, 21);
  assert.equal(new Set(D.COLLAPSE_21.map((k) => k.split(' ')[0])).size, 5);
  for (const k of D.COLLAPSE_21) assert.ok(pre.has(k), k);
});

test('D198 adds no one-item Hip extension + push: every one the app prints, the pre-D198 copy prints too', () => {
  const H = hep();
  const pre = new Set(H.pre.oneItem.map(dayKey));
  assert.deepEqual(H.cand.oneItem.map(dayKey).filter((k) => !pre.has(k)), []);
});

test('on all 91 days the app prints a two-item Hip extension + push without the hinge, landing the ruled name', () => {
  const H = hep();
  const days = H.pre.doubled.map((x) => [dayKey(x), D.SLHT]).concat(D.COLLAPSE_21.map((k) => [k, D.BRIDGE]));
  assert.equal(days.length, 91);
  for (const [k, land] of days) {
    const [key, wk, d] = k.split(' ');
    const p = H.cand.progs[key], w = wk.slice(1);
    const ls = D.liveSec(p, w, d, D.LS), he = D.liveSec(p, w, d, D.HEP);
    const hn = D.namesOf(he);
    assert.ok(he && he.superset && hn.length === 2, k + ' ' + D.cardOf(he));
    assert.ok(!hn.includes(D.hingeOf(D.namesOf(ls))), k + ' holds the hinge');
    assert.equal(hn[0], land, k);
  }
});
