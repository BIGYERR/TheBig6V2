// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Equipment tiers on the full lattices (CI only; tests/integration/equipment-tiers.test.js runs samples and every
// hand table). Rulings: D42-c, D44, D46-c, D47, D49, D70c, D150, D149, D196. Helpers: tests/support/equipment-tiers.js.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp } from '../support/app.ts';
import * as D from '../support/duplicate-movements.ts';
import * as E from '../support/equipment-tiers.ts';
const IA = loadApp();
const once = (f) => { let v; return () => (v === undefined ? (v = f()) : v); };

// ══ D42-c: the shoulder slot prints a side (6 tiers x 4 foci x 40 seeds) ═══════════════════════════════════════
const side = once(() => E.surveyShoulderSide(IA, E.shoulderLattice(40)));

test('the shoulder-side lattice builds whole (960 programs)', () => {
  assert.deepEqual(side().errors, []);
  assert.equal(side().builds, 960);
});

for (const [site, what] of [['S1', 'the heavy push Main pairing'], ['S2', 'the light push Main pairing'], ['S3', 'the push Accessory superset']]) {
  test(what + ': every one-hand press prints a side, every time, and no two-hand movement claims one', () => {
    const t = side().seen[site];
    const one = E.ONE_HAND.filter((n) => t[n]), two = E.TWO_HAND.filter((n) => t[n]);
    assert.ok(one.length > 0, 'a one-hand press reaches the slot');
    assert.ok(two.length > 0, 'a two-hand movement reaches the slot');
    for (const n of one) assert.equal(t[n].plain, 0, n + ' printed no side');
    for (const n of two) assert.equal(t[n].each, 0, n + ' printed a side');
  });
}

// ══ D44 / D46-c / D47 / D49 on the 288-cell gear lattice ════════════════════════════════════════════════════════
const gear = once(() => {
  const off = loadApp();
  off.eval('var __BUDGET_OFF = true;');
  return E.surveyGear(IA, off, E.gearLattice([1013, 3039, 76308]));
});

test('every gear-lattice cell builds, no item slot comes back empty, and each injury path is thick enough to judge', () => {
  const S = gear();
  assert.deepEqual(S.errors, []);
  assert.equal(S.built, 288);
  assert.equal(S.holes, 0);
  for (const t of ['healthy', 'shoulder/protect', 'lowback/protect', 'elbow/protect']) assert.ok(S.byInj[t] && S.byInj[t].total > 3000, t + ': ' + (S.byInj[t] && S.byInj[t].total) + ' items');
});

test('no gated core movement prints on a tier without its implement, on any injury path', () => {
  const S = gear();
  for (const g of E.GATED) for (const e of E.GEAR_EQUIP) if (!E.GEAR_TIERS[e][g.need]) assert.equal(E.countEq(S.all[e], g.name), 0, g.name + ' on ' + e);
  for (const e of E.GEAR_EQUIP) {
    if (E.GEAR_TIERS[e].barbell) continue;
    for (const t of Object.keys(S.byInj)) assert.equal(E.countBy(S.byInj[t].per[e], /landmine/i), 0, 'landmine on ' + e + ' under ' + t);
  }
});

test('every gated movement still prints on a tier that owns its implement, and every gear-free member prints on all six', () => {
  const S = gear();
  for (const g of E.GATED) assert.ok(E.GEAR_EQUIP.filter((e) => E.GEAR_TIERS[e][g.need]).reduce((n, e) => n + E.countEq(S.all[e], g.name), 0) > 0, g.name);
  for (const n of E.UNGATED_CORE) for (const e of E.GEAR_EQUIP) assert.ok(E.countEq(S.all[e], n) > 0, n + ' on ' + e);
});

test('every core finisher draws at least one item, and each tier draws at least three rotational members it may own', () => {
  const S = gear();
  assert.ok(S.core.blocks > 3000, S.core.blocks + ' core blocks');
  assert.deepEqual(S.core.empty, []);
  for (const e of E.GEAR_EQUIP) { const n = S.core.rot[e].size; assert.ok(n >= 3 && n <= E.ROT_LEGAL[e], e + ' ' + n); }
});

test('a pulldown is a cable movement, and the lowback/protect pull slot is filled on every cable-less build', () => {
  const S = gear(), LB = S.byInj['lowback/protect'].per;
  for (const e of E.GEAR_EQUIP) {
    if (E.GEAR_TIERS[e].cables) continue;
    assert.equal(E.countEq(LB[e], 'Straight-arm pulldown'), 0, e);
    assert.equal(E.countBy(S.all[e], /\bpulldown\b/i), 0, e + ': ' + E.firstBy(S.all[e], /\bpulldown\b/i));
    for (const r of LB[e]) assert.ok(r.items.some((x) => /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i.test(x.name)), r.tag + ' has a vertical pull');
  }
  assert.ok(E.countEq(LB.commercial, 'Straight-arm pulldown') > 0, 'commercial keeps it');
});

test('every build on every injury path pulls something', () => {
  const S = gear(), ANYPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm|\brow\b|face pull|pull-?apart|\blat\b/i;
  for (const t of Object.keys(S.byInj)) for (const e of E.GEAR_EQUIP) for (const r of S.byInj[t].per[e]) assert.ok(r.items.some((x) => ANYPULL.test(x.name)), r.tag);
});

test('a tier prescribed band work names bands on its card; the banded prehab rail stays on home_full and crossfit', () => {
  const S = gear(), cards = E.wizardCards(D.appText()), IS_BAND = /(?<!\bIT )\bband(ed|s)?\b/i;
  for (const e of E.GEAR_EQUIP) {
    if (!E.GEAR_TIERS[e].card || e === 'commercial') continue;
    if (E.countBy(S.all[e], IS_BAND) > 0) assert.match(cards[e], /\bbands\b/i, e);
  }
  for (const nm of ['Clamshells w/ band', 'Banded side steps', 'Banded monster walks', 'Standing band hip abduction', 'Seated banded hip flexion', 'Banded dorsiflexion'])
    assert.ok(E.countEq(S.all.home_full, nm) + E.countEq(S.all.crossfit, nm) > 0, nm);
  for (const e of ['home_full', 'crossfit']) assert.ok(E.countBy(S.all[e], IS_BAND) > 0, e);
});

test('the Pallof press prints on every tier that owns bands', () => {
  const S = gear();
  for (const e of E.GEAR_EQUIP) if (E.GEAR_TIERS[e].bands) assert.ok(E.countEq(S.all[e], 'Pallof press') > 0, e);
});

test('the anti-rotation draw stays legal, never freezes on one pair, and mixes static with dynamic work on every tier', () => {
  const S = gear();
  for (const e of E.GEAR_EQUIP) {
    const ar = S.core.ar[e];
    assert.ok(ar.blocks > 120, e + ' ' + ar.blocks + ' blocks');
    const illegal = [...ar.seen].filter((n) => { const m = E.AR_MEMBERS.find((x) => x.name === n); return m && m.need && !E.GEAR_TIERS[e][m.need]; });
    assert.deepEqual(illegal, [], e);
    assert.ok(ar.seen.size <= E.AR_LEGAL[e], e);
    assert.ok(ar.pairs.size >= 3, e + ' ' + ar.pairs.size + ' pairings');
    assert.ok(ar.statik > 0 && ar.statik < ar.blocks, e);
  }
});

test('no card spells a D49 member in the singular', () => {
  const S = gear();
  for (const e of E.GEAR_EQUIP) assert.equal(E.countBy(S.all[e], /\bBird dog\b(?!s)|\bPlank shoulder tap\b(?!s)/), 0, e);
});

// ══ D70c / D150 on the 3,000-config inventory lattice ═══════════════════════════════════════════════════════════
const INV = E.inventoryLattice();
const inv = once(() => E.surveyInventory(IA, INV, { swapSeeds: 2 }));

test('the inventory lattice is 3,000 configs and builds whole', () => {
  assert.equal(INV.length, 3000);
  assert.deepEqual(inv().errors.slice(0, 3), []);
  assert.equal(inv().built, 3000);
});

test('every printed name carrying an implement token has a class, and no name prints undefined', () => {
  assert.deepEqual(inv().unclassed, {});
  assert.equal(inv().undefinedNames, 0);
});

test('no tier prints an item of a class it does not own, on any surface, injury cells included', () => {
  const S = inv();
  for (const t of E.DENYING_TIERS) {
    const n = Object.keys(S.denied).filter((k) => k.split('|').length === 2 && k.startsWith(t + '|')).reduce((a, k) => a + S.denied[k], 0);
    assert.equal(n, 0, t + ': ' + S.deniedEx[t]);
  }
  for (const [n, c] of [['Machine chest press', 'MACHINE'], ['Leg press', 'MACHINE'], ['Hack squat (machine)', 'MACHINE'], ['Pec deck', 'MACHINE'], ['Cable crossover', 'CABLE']])
    for (const t of E.DENYING_TIERS.filter((x) => E.denies(x, c))) assert.equal(S.denied[t + '|*|' + n] || 0, 0, n + ' on ' + t);
});

test('every program\'s swap universe and the swap sheet carry no name the tier does not own', () => {
  const S = inv();
  assert.equal(S.sheet.crash, 0);
  for (const t of E.DENYING_TIERS) {
    assert.ok((S.universe.size[t] || 0) > 0, t + ' universe is non-empty');
    assert.equal(S.universe.bad[t] || 0, 0, t + ': ' + S.universe.ex[t]);
    assert.ok((S.sheet.calls[t] || 0) > 0 && (S.sheet.cands[t] || 0) > 0, t + ' sheet asked');
    assert.equal(S.sheet.bad[t] || 0, 0, t + ': ' + S.sheet.ex[t]);
  }
});

test('a travel variant\'s universe carries no name the tier does not own', () => {
  const T = E.surveyTravel(IA);
  assert.deepEqual(T.errors, []);
  for (const t of E.DENYING_TIERS) {
    assert.ok((T.acc.size[t] || 0) > 0, t);
    assert.equal(T.acc.bad[t] || 0, 0, t + ': ' + T.acc.ex[t]);
  }
});

test('the denial selects: the removed names still print on commercial, the named replacements on older hypertrophy', () => {
  const S = inv();
  for (const n of ['Machine chest press', 'Leg press', 'Hack squat (machine)', 'Pec deck', 'Cable crossover']) assert.ok((S.names['commercial|' + n] || 0) > 0, n);
  for (const t of ['crossfit', 'home_full'])
    for (const n of ['Dumbbell goblet squat', 'Dumbbell bench press', 'Dumbbell incline press', 'Close-grip bench press']) assert.ok((S.olderHyp[t][n] || 0) > 0, t + ' ' + n);
  assert.ok(S.hbSecond.n > 0);
  assert.deepEqual(S.hbSecond.bad, [], 'home_basic 18 to 35 hypertrophy: the Secondary compound is a dumbbell press');
});

test('advanced 55+ hypertrophy on crossfit and home_full draws one squat per program, goblet or front squat, both across seeds', () => {
  for (const t of ['crossfit', 'home_full']) {
    const seen = {};
    for (const sd of E.INV_SEEDS) {
      const ks = Object.keys(E.squatMains(IA.buildProgram(E.seedCfg(t, 'hypertrophy', 'advanced', '55+', sd))));
      assert.equal(ks.length, 1, t + ' seed ' + sd + ': ' + ks.join(', '));
      assert.ok(['Dumbbell goblet squat', 'Front squat'].includes(ks[0]), ks[0]);
      seen[ks[0]] = 1;
    }
    assert.deepEqual(Object.keys(seen).sort(), ['Dumbbell goblet squat', 'Front squat'], t);
  }
});

test('older hypertrophy below advanced 55+ on crossfit and home_full squats the goblet only; commercial never draws a front squat', () => {
  for (const t of ['crossfit', 'home_full']) {
    const other = {};
    for (const [e, a] of [['beginner', '55+'], ['intermediate', '55+'], ['beginner', '36-54'], ['intermediate', '36-54'], ['advanced', '36-54']])
      for (const sd of E.INV_SEEDS) Object.keys(E.squatMains(IA.buildProgram(E.seedCfg(t, 'hypertrophy', e, a, sd)))).forEach((k) => { other[k] = 1; });
    assert.deepEqual(Object.keys(other), ['Dumbbell goblet squat'], t);
  }
  const com = {};
  for (const e of E.INV_EXPS) for (const a of ['36-54', '55+']) for (const sd of E.INV_SEEDS)
    Object.keys(E.squatMains(IA.buildProgram(E.seedCfg('commercial', 'hypertrophy', e, a, sd)))).forEach((k) => { com[k] = 1; });
  assert.ok(Object.keys(com).length > 0 && !com['Front squat'], JSON.stringify(com));
});

test('under a shoulder or elbow plan no front squat prints, sits in the universe or is offered, and the squat slot is kept', () => {
  const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
  let n = 0, calls = 0;
  for (const eq of ['commercial', 'crossfit', 'home_full']) for (const r of ['shoulder', 'elbow']) for (const tr of ['workaround', 'protect'])
    for (const [f, e, a] of [['strength', 'intermediate', '18-35'], ['balanced', 'advanced', '18-35'], ['hypertrophy', 'beginner', '18-35'], ['hypertrophy', 'advanced', '55+']])
      for (const sd of E.INV_SEEDS) {
        const tag = eq + ' ' + r + '/' + tr + ' ' + f + ' seed ' + sd;
        const ph = IA.buildProgram(E.seedCfg(eq, f, e, a, sd)), pi = IA.buildProgram(E.seedCfg(eq, f, e, a, sd, { region: r, tier: tr }));
        n++;
        const mi = E.squatMains(pi), mh = E.squatMains(ph);
        assert.ok(!mi['Front squat'], tag + ': a front squat main');
        const sum = (o) => Object.values(o).reduce((x, y) => x + y, 0);
        assert.equal(sum(mi), sum(mh), tag + ': the squat slot is kept');
        assert.ok(!(pi._swapUniverse || []).includes('Front squat'), tag + ': universe');
        for (const w of Object.keys(pi.weeks)) for (const d of D.DAYS) for (const s of ((pi.weeks[w][d] && pi.weeks[w][d].sections) || [])) {
          const it = (s.items || [])[0];
          if (!/^Main — /.test(s.label || '') || !it || !/squat|leg press/i.test(D.clean(it.name))) continue;
          calls++;
          assert.ok(!E.candNames(swapCandidates(it.name, pi.weeks[w][d], w, pi)).includes('Front squat'), tag + ': sheet');
        }
      }
  assert.equal(n, 384);
  assert.ok(calls > 0);
});

// ══ D149: the GHD is a station ════════════════════════════════════════════════════════════════════════════════
const station = once(() => E.surveyStation(IA, E.ghdLattice(), E.ghdTravelLattice()));

test('the GHD lattice and its travel variants build whole', () => {
  const S = station();
  assert.deepEqual(S.errors, []);
  assert.equal(S.built, 760);
  assert.equal(S.tBuilt, 110);   // 5 tiers x (8 seeds x 2 foci + 2 seeds x 3 protect plans)
  assert.equal(S.sheetCrash, 0);
});

test('no tier without a GHD prints, keeps in its universe, offers or travels with a station name', () => {
  const S = station();
  for (const t of E.GHD_DENIED) {
    assert.equal(S.items[t] || 0, 0, t + ': ' + S.ex[t]);
    assert.equal(S.tItems[t] || 0, 0, t + ' travel items');
    assert.ok((S.uniSize[t] || 0) > 0 && (S.tUniSize[t] || 0) > 0, t + ' universes are non-empty');
    assert.equal(S.uni[t] || 0, 0, t + ' universe');
    assert.equal(S.tUni[t] || 0, 0, t + ' travel universe');
    assert.ok((S.calls[t] || 0) > 0 && (S.cands[t] || 0) > 0, t + ' sheet asked');
    assert.equal(S.sheet[t] || 0, 0, t + ' sheet');
  }
});

test('commercial and crossfit still print, carry and offer the station', () => {
  const S = station();
  for (const t of E.GHD_HAS) {
    assert.ok((S.items[t] || 0) > 0, t + ' prints');
    assert.ok((S.uni[t] || 0) > 0, t + ' universe');
    assert.ok((S.sheet[t] || 0) > 0, t + ' sheet');
  }
});

test('hip/protect\'s universe carries 45° back extension where the station is owned, Bodyweight back extension where it is not', () => {
  const S = station();
  for (const t of E.GHD_HAS) assert.ok((S.hip[t + '|45° back extension'] || 0) > 0, t);
  for (const t of E.GHD_DENIED) {
    assert.ok((S.hip[t + '|Bodyweight back extension'] || 0) > 0, t);
    assert.equal(S.hip[t + '|45° back extension'] || 0, 0, t);
  }
});

const knee = once(() => E.surveyKnee(E.kneeTrees(IA), E.kneeLattice()));

test('each knee/protect floor fires on home_full and on no other tier (copies with the floor written out)', () => {
  const K = knee();
  assert.deepEqual(K.crash, []);
  for (const t of E.GHD_TIERS) {
    assert.equal(K.cfg[t], 126, t + ' configs');
    assert.equal((K.fa[t + '|crash'] || 0) + (K.fb[t + '|crash'] || 0), 0, t);
    if (E.floorA(t).fires) assert.ok((K.fa[t] || 0) > 0, 'floor (a) fires on ' + t); else assert.equal(K.fa[t] || 0, 0, 'floor (a) on ' + t);
    if (E.floorB(t).fires) assert.ok((K.fb[t] || 0) > 0, 'floor (b) fires on ' + t); else assert.equal(K.fb[t] || 0, 0, 'floor (b) on ' + t);
  }
});

test('the knee/protect legs Main and Leg superset B hip extension stay in the hand sets, and home_full reaches both floors', () => {
  const K = knee();
  assert.deepEqual(K.mainBad.slice(0, 3), []);
  assert.deepEqual(K.lsbBad.slice(0, 3), []);
  for (const t of E.GHD_TIERS.filter((x) => E.GHD_OWNS[x].BARBELL)) assert.ok(Object.keys(K.main).some((k) => k.startsWith(t + '|')), t + ' prints a legs Main');
  assert.ok((K.main['home_full|Single-leg glute bridge'] || 0) > 0, 'floor (a) prints');
  assert.ok((K.lsb['home_full|2'] || 0) > 0, 'floor (b) prints');
});

test('the knee/protect hip-extension reservation empties only on support_prevention reads, where no Leg superset B is built', () => {
  const K = knee();
  assert.equal(K.probeMismatch, 0, 'the probe changes no program');
  for (const t of E.GHD_TIERS) {
    const prev = K.reads[t + '|prev'] || 0, other = K.reads[t + '|other'] || 0;
    assert.ok(prev + other > 0, t + ' reads');
    assert.equal(K.reads[t + '|empty|other'] || 0, 0, t + ': another focus read empty');
    assert.ok((K.reads[t + '|empty|prev'] || 0) > 0, t + ': a support_prevention read is empty');
  }
});

test('no knee/protect day prints the same movement twice', () => {
  assert.deepEqual(knee().dupEx, []);
});

// ══ D196 on the bodyweight cells (324) and the race injury lattice (1,008) ═══════════════════════════════════════
const BW = E.bwLattice(), RACE = E.raceLattice();
const bw = once(() => E.surveyBodyweight(E.d196App(), BW, RACE));

test('the D196 lattices are 108 + 216 bodyweight cells and 1,008 race builds', () => {
  assert.equal(BW.filter((x) => x.L === 'L432').length, 108);
  assert.equal(BW.filter((x) => x.L === 'LBW').length, 216);
  assert.equal(RACE.length, 1008);
  assert.equal(RACE.filter((x) => x.eq === 'bodyweight').length, 168);
});

test('no bodyweight Main and no race Primer is Burpees, and no capped hip extension lands on an uncapped name', () => {
  const S = bw();
  assert.equal(S.mains, 0, S.mainsEx.join(' | '));
  assert.deepEqual(S.primer.slice(0, 3), []);
  assert.deepEqual(S.a2.slice(0, 3), []);
});

test('a stamped, reused app builds every probe cell as a plain fresh one does', () => {
  const X = E.d196App();
  const J = (p) => JSON.stringify(p, (k, v) => (k === '__pre' || k === 'id' || k === 'created' ? undefined : v));
  for (const i of [0, 37, 74, 111, 148, 185, 222, 259, 296]) {
    X.eval('__BUILD++');
    X.ctx.__C = D.clone(BW[i].c);
    const a = X.eval('buildProgram(__C)');
    const b = D.pinDate(D.loadText(D.appText(), 'fresh'), E.D196_CLOCK).buildProgram(D.clone(BW[i].c));
    assert.equal(J(a), J(b), BW[i].k);
  }
});

test('no card on the four D196 plans holds both thrusts, the 82 older both-thrust days are unchanged, and no two adjacent days share the bridge', () => {
  const S = bw();
  for (const pl of E.D196_PLANS) assert.equal(S.thrust[pl] || 0, 0, pl);
  assert.deepEqual(S.thrustSet, E.THRUST82_SET);
  assert.equal(E.THRUST82_SET.length, 82);
  assert.deepEqual(S.adj.slice(0, 3), []);
});

test('each D196 plan prints its landing name', () => {
  const S = bw();
  for (const pl of E.D196_PLANS) assert.ok((S.land[pl] || 0) > 0, pl + ' ' + E.LANDING[pl]);
});
