'use strict';
// Core and trunk blocks: the rotational power pillar's own turn counter (D46-a), the protect-tier upper-limb trunk
// block and its gear gate (D46-c, D49), the trunk floor on the day (D48, D50), and the core-off counterfactual of
// Mario's program (D89: a drill the app files as family core is never a loaded compound in the session budget).
//
// Oracles are typed here: the pillar member lists and their rotation order, the tier inventories from the wizard copy,
// the rotation arithmetic, the session cost model and the long-run tiers by hand. The engine is asked what it drew and
// compared with the hand draw; it is never asked what it should have drawn. The one golden value is the core-off digest
// in tests/snapshots/core-trunk.json (the engine with the family-core clause removed, a counterfactual no other test
// holds). The 288-cell trunk-floor lattice runs in tests/sweeps/core-trunk.test.js.
//
// Seeds are pinned on every config, and a program equals itself built twice before anything is compared.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, appScript, fixtures, progDigest } = require('../support/app.js');
const { appCopy } = require('../support/app-copy.js');
const { matchSnapshot } = require('../support/snapshot.js');
const CT = require('../support/core-trunk.js');

const IA = loadApp();
const clean = CT.clean;

// ── the rotational power pillar (D46-a) ─────────────────────────────────────────────────────────────────────────────

test('the rotational power pillar holds its seven members in the hand-typed rotation order', () => {
  const live = CT.host(IA.eval('CORE_PILLARS').rotational_power.items.map((i) => i.name));
  assert.deepEqual(live, CT.ROT_ORDER);
});

test('on a hot-tomorrow day the rotational pair walks the pillar by its own turn count (hand table, commercial)', () => {
  for (const [R, want] of Object.entries(CT.ROT_HOT_TABLE)) {
    const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, true, 0, 'commercial')`);
    assert.equal(b.pillar, 'rotational_power', `R=${R} selects the rotational pillar`);
    assert.deepEqual(CT.host((b.items || []).map((i) => clean(i.name))), want, `R=${R}`);
  }
});

test('on a clear-runway day the rotational pair walks the pillar on its three-way clock (hand table, commercial)', () => {
  for (const [R, want] of Object.entries(CT.ROT_RUN_TABLE)) {
    const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, false, 0, 'commercial')`);
    assert.equal(b.pillar, 'rotational_power', `R=${R} selects the rotational pillar`);
    assert.deepEqual(CT.host((b.items || []).map((i) => clean(i.name))), want, `R=${R}`);
  }
});

test('the hot-tomorrow pair takes every value its tier legal list allows over twelve weeks, never one frozen pair', () => {
  for (const tier of ['commercial', 'home_full', 'home_basic']) {
    const pairs = new Set();
    for (const R of [2, 4, 6, 8, 10, 12]) {
      const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, true, 0, '${tier}')`);
      pairs.add((b.items || []).map((i) => clean(i.name)).sort().join(' + '));
    }
    const want = CT.expectedRotPairs(CT.ROT_LEGAL[tier].length);
    assert.ok(want >= 2, `${tier}: the hand table leaves a rotating pair`);
    assert.equal(pairs.size, want, `${tier}: distinct pairs over R=2..12`);
  }
});

test('every gear legal rotational member is reachable on its tier, and the cable chop prints on the cable tier', () => {
  const seen = {};
  const chop = {};
  for (const e of CT.EQUIP) {
    seen[e] = new Set();
    chop[e] = 0;
    for (const seed of [1013, 3039, 6078, 10130, 76308]) {
      const prog = IA.buildProgram({ ...fixtures.HALF_MANNY, equipment: e, seed });
      CT.forEachDay(prog, (day) => {
        for (const s of day.sections || []) {
          if (!s || !s.core) continue;
          const names = (s.items || []).map((i) => clean(i.name));
          if (s.pillar === 'rotational_power') names.forEach((n) => seen[e].add(n));
          chop[e] += names.filter((n) => n === 'Cable woodchoppers').length;
        }
      });
    }
  }
  // bodyweight renames the pillar's names after the draw, so only the ruling's floor of three applies there
  assert.ok(seen.bodyweight.size >= 3, `bodyweight reaches ${seen.bodyweight.size} distinct rotational movements (floor 3)`);
  for (const e of CT.EQUIP.filter((x) => x !== 'bodyweight')) {
    const missing = CT.ROT_LEGAL[e].filter((n) => !seen[e].has(n));
    assert.deepEqual(missing, [], `${e} reaches every gear legal member`);
  }
  assert.ok(chop.commercial > 0, 'Cable woodchoppers prints on commercial');
});

test('the rotational draw is not the first two members forever, and both own-turn clocks are in the draw (source)', () => {
  const js = appScript();
  const fn = js.slice(js.indexOf('function getDynamicCoreBlock'));
  const body = fn.slice(0, fn.indexOf('\n}') + 2).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(body.length > 100, 'getDynamicCoreBlock is in the app');
  assert.doesNotMatch(body, /_pi\(\s*[A-Za-z_$][\w$]*\s*\)\s*\.slice\(0,2\)/);
  assert.doesNotMatch(body, /P\[[^\]]+\]\.items\.slice\(0,2\)/);
  const clocks = (body.match(/Math\.floor\(R\/2\)/g) || []).length + (body.match(/Math\.floor\(\(R-1\)\/3\)/g) || []).length;
  assert.equal(clocks, 2);
});

// ── the protect-tier upper-limb trunk block (D46-c third reader, D49 collision) ─────────────────────────────────────

test('the anti-rotation and anti-extension pillars hold the hand-typed members in rotation order', () => {
  const P = IA.eval('CORE_PILLARS');
  assert.deepEqual(CT.host(P.anti_rotation.items.map((i) => i.name)), CT.AR_MEMBERS.map((m) => m.name));
  assert.deepEqual(CT.host(P.anti_extension.static.map((i) => i.name)), CT.AE_MEMBERS);
});

test('every tier keeps at least two anti-rotation names the anti-extension section cannot claim (hand count)', () => {
  for (const e of CT.EQUIP) {
    const legal = CT.arLegal(e);
    const distinct = legal.filter((n) => !CT.AE_MEMBERS.includes(n)).length;
    assert.ok(legal.length >= 2 && distinct >= 2, `${e}: ${legal.length} legal, ${distinct} distinct`);
  }
});

const TRUNK = CT.protectTrunkRows(IA);

test('the protect-tier trunk lattice is thick enough to see the seam, and no card prints either trunk section twice', () => {
  assert.equal(TRUNK.doubled.length, 0, TRUNK.doubled.slice(0, 2).join('; '));
  assert.ok(TRUNK.rows.length >= 100, `${TRUNK.rows.length} trunk blocks`);
});

test('a band movement never prints on a tier without bands, and still reaches every tier that owns one', () => {
  const per = {};
  CT.EQUIP.forEach((e) => (per[e] = TRUNK.rows.filter((r) => r.equipment === e)));
  for (const m of CT.AR_MEMBERS) {
    if (m.need === null || /carry/i.test(m.name)) continue;
    for (const e of CT.EQUIP) {
      const n = per[e].reduce((a, r) => a + r.ar.filter((x) => x === m.name).length, 0);
      if (CT.TIER_GEAR[e][m.need]) assert.ok(n > 0, `"${m.name}" reaches ${e}, which owns its implement`);
      else assert.equal(n, 0, `"${m.name}" on ${e}, which owns no ${m.need}`);
    }
  }
  const pallofNoBand = ['bodyweight', 'minimal'].reduce((a, e) => a + per[e].reduce((b, r) => b + r.ar.filter((x) => x === 'Pallof press').length, 0), 0);
  assert.equal(pallofNoBand, 0, 'Pallof press on bodyweight and minimal');
});

test('the protect-tier anti-rotation draw carries no loaded carry on any tier', () => {
  const carries = TRUNK.rows.reduce((a, r) => a + r.ar.filter((x) => /carry/i.test(x)).length, 0);
  assert.equal(carries, 0);
});

test('one card, one movement: no trunk name prints twice across the two trunk sections or anywhere else on the day', () => {
  const twice = [];
  const elsewhere = [];
  for (const r of TRUNK.rows) {
    const union = r.ar.concat(r.ae);
    if (new Set(union).size !== union.length) twice.push(`${r.key} ar=${r.ar} ae=${r.ae}`);
    const cnt = {};
    r.all.forEach((n) => (cnt[n] = (cnt[n] || 0) + 1));
    if (Object.keys(cnt).some((n) => cnt[n] > 1 && union.includes(n))) elsewhere.push(r.key);
  }
  assert.deepEqual(twice, []);
  assert.deepEqual(elsewhere, []);
});

test('the trunk block never prints a hole, an empty section, or loses its anti-rotation section', () => {
  let holes = 0;
  let empty = 0;
  let noAR = 0;
  let thinAR = 0;
  for (const r of TRUNK.rows) {
    if (!r.hasAR) noAR++;
    if (r.hasAR && r.ar.length === 0) empty++;
    if (r.hasAE && r.ae.length === 0) empty++;
    if (r.ar.concat(r.ae).some((n) => !n)) holes++;
    if (r.hasAR && r.ar.length < 2) thinAR++;
  }
  assert.equal(holes, 0, 'holes');
  assert.equal(empty, 0, 'empty trunk sections');
  assert.equal(noAR, 0, 'blocks without the anti-rotation section');
  // the draw always hands over two; downstream injury and budget passes may thin one, never most (8% ceiling)
  assert.ok(thinAR / TRUNK.rows.length <= 0.08, `one-item anti-rotation sections ${thinAR}/${TRUNK.rows.length}`);
});

test('the trunk block is drawn from the hand-derived rotation in order, and a collision moves the anti-rotation pick', () => {
  let off = [];
  let contested = 0;
  let moved = 0;
  let ruleMoves = 0;
  for (const r of TRUNK.rows) {
    const dv = CT.derivedTrunk(r.equipment, r.wk);
    if (!CT.isSub(r.ar, dv.ar) || !CT.isSub(r.ae, dv.ae)) off.push(`${r.key} ar=${r.ar} ae=${r.ae} hand ar=${dv.ar} ae=${dv.ae}`);
    if (!dv.collided) continue;
    contested++;
    const shared = dv.plain.filter((n) => dv.ae.includes(n));
    if (!shared.some((n) => r.ar.includes(n))) moved++;
    if (JSON.stringify(dv.ar) !== JSON.stringify(dv.plain)) ruleMoves++;
  }
  assert.deepEqual(off.slice(0, 3), []);
  assert.ok(contested > 0, 'the lattice holds collision weeks');
  assert.equal(moved, contested, 'the shared movement stays with anti-extension');
  assert.equal(ruleMoves, contested, 'the hand rule itself moves the pick on every collision week');
});

// ── the trunk floor on the day (D50), at the function contract ──────────────────────────────────────────────────────

const trim = (secs, cardio) => IA.eval('capSessionBudget')(secs, cardio);

test('the session budget is the published 20 sets the hand cost model is typed against', () => {
  assert.equal(IA.eval('SESSION_SET_BUDGET'), 20);
});

test('a day over budget keeps exactly one trunk item: the floor holds the last one and no more', () => {
  const day = CT.trunkDay(CT.AR2(), CT.AE2());
  assert.ok(CT.handTotal(day) > 20, `the fixture is over cap by hand: ${CT.handTotal(day)}`);
  const out = trim(day, null);
  assert.equal(CT.trunkItems(out), 1);
});

test('trunk relocated into one section is still floored by items, not labels', () => {
  const day = CT.trunkDay(CT.AR2().concat(CT.AE2()), []);
  day.splice(day.findIndex((s) => s.label === 'Trunk — anti-extension'), 1);
  const out = trim(day, null);
  assert.ok(CT.trunkItems(out) >= 1);
  assert.equal(CT.trunkSecs(out), 1);
});

test('the floor is inert on an NRC long-run tier day: the run owns the day', () => {
  const lr = { isNRC: true, subtype: 'Long Run', dose: { k: 'time', mins: 60 }, detail: '' };
  assert.equal(CT.handLongRunTier(lr), 'B');
  assert.equal(CT.trunkItems(trim(CT.trunkDay(CT.AR2(), CT.AE2()), lr)), 0);
});

test('the floor is inert on race day and on the time trial that is race day', () => {
  for (const st of ['RACE DAY — Half Marathon', 'Time Trial — 5K']) {
    assert.equal(CT.trunkItems(trim(CT.trunkDay(CT.AR2(), CT.AE2()), { subtype: st, isNRC: true })), 0, st);
  }
});

test('a day under budget comes back unchanged: the floor adds nothing and removes nothing', () => {
  const day = [
    { label: 'Main — Bench press', items: [{ name: 'Bench press', detail: '3×5' }] },
    { label: 'Trunk — anti-rotation', items: CT.AR2() },
  ];
  assert.ok(CT.handTotal(day) <= 20);
  const shape = (secs) => JSON.stringify(secs.map((s) => [s.label, (s.items || []).map((i) => i.name)]));
  assert.equal(shape(trim(day, null)), shape(day));
});

test('a day whose only trunk section is anti-extension is floored too: the floor reads the whole trunk family', () => {
  const day = CT.trunkDay([], CT.AE2());
  day.splice(day.findIndex((s) => s.label === 'Trunk — anti-rotation'), 1);
  assert.ok(CT.handTotal(day) > 20);
  assert.equal(CT.trunkItems(trim(day, null)), 1);
});

// ── the core-off counterfactual (D89) ────────────────────────────────────────────────────────────────────────────────

test('with the family-core clause removed, Mario\'s program builds the core-off digest, and the clause moves it', () => {
  const off = loadApp({ file: appCopy('core-off', [[CT.CORE_CLAUSE, '']]) });
  const a = progDigest(off.buildProgram(structuredClone(fixtures.HALF_MANNY)));
  assert.equal(progDigest(off.buildProgram(structuredClone(fixtures.HALF_MANNY))), a, 'the counterfactual equals itself');
  const shipped = progDigest(IA.buildProgram(structuredClone(fixtures.HALF_MANNY)));
  assert.notEqual(a, shipped, 'the clause reaches Mario\'s program');
  matchSnapshot('core-trunk', { 'half-manny core-off digest': a });
});

test('the trunk-floor sample: no trunk-titled day prints zero trunk, no empty trunk section, the race and the run win', () => {
  // the seed 76308 slice of the ruled 288-cell lattice; the full lattice runs in tests/sweeps/core-trunk.test.js
  const cells = CT.wideLattice().filter((c) => c.cfg.seed === 76308);
  assert.equal(cells.length, 96);
  for (const c of cells.slice(0, 4)) assert.equal(progDigest(IA.buildProgram(c.cfg)), progDigest(IA.buildProgram(c.cfg)), `${c.tag} is self-stable`);
  const s = CT.trunkFloorScan(IA, cells);
  assert.deepEqual(s.zeroTrunk.slice(0, 3), [], 'days titled for trunk with no trunk item');
  assert.deepEqual(s.emptySec.slice(0, 3), [], 'empty trunk sections');
  assert.deepEqual(s.liftInWindow.slice(0, 3), [], 'lifting inside the race window');
  assert.deepEqual(s.tierALift.slice(0, 3), [], 'trunk on a tier A long-run day');
});
