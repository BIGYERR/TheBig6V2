// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The session budget, the lattices. The same claims as tests/integration/session-budget.test.js, which runs them on a
// sample; this file runs them whole. CI runs it, the 60-second check does not.
//   - the census: HALF_MANNY on 288 cells ({healthy, shoulder, low back, elbow protect} x six tiers x two foci x two
//     experiences x three seeds) and the older 30-cell healthy sweep, each built with the budget on and off (D47, D48,
//     D50, D81, D85);
//   - D195-B's shard: 648 configs (three foci x three families x six tiers x three experiences x two seeds x two rests)
//     and the typed B-3 and B-2 cells, each built without the cost lens, with it, and without it with the budget off.
// Floors are V192 and V197 transcriptions (tests/support/session-budget.js), each applied to the lattice it was typed
// on. Golden values, current, in tests/snapshots/session-budget-lattice.json: the per-tier census, what the budget
// deletes per tier and per class, the thin core shares and the long-run carve-out, and the shard's tallies. A ruling
// that moves them regenerates the file.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { progDigest } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import * as SB from '../support/session-budget.ts';
const { EQUIP, clone } = SB;

const P = SB.page();
const ON = SB.census(P, false, SB.WIDE), OFF = SB.census(P, true, SB.WIDE);
const ON_N = SB.census(P, false, SB.NARROW), OFF_N = SB.census(P, true, SB.NARROW);
const DEL = SB.tally(OFF, ON);
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

test('the census lattice is the ruled 288 cells and the narrow sweep 30, and every cell built', () => {
  // L0, L0a, L0b, L1
  assert.equal(SB.WIDE.length, 4 * 6 * 2 * 2 * 3);
  assert.equal(SB.WIDE.length, 288);
  assert.equal(SB.NARROW.length, 30);
  assert.equal(ON.cellsSwept, 288);
  assert.equal(OFF.cellsSwept, 288);
  assert.equal(ON_N.cellsSwept, 30);
});

test('every healthy cell carries 18 core sections', () => {
  // B1a
  const healthy = SB.WIDE.filter((c) => c.inj === 'healthy');
  assert.equal(healthy.length, 72);
  assert.deepEqual(healthy.filter((c) => ON.cells[c.key].coreSec !== SB.CORE_PER_BUILD).map((c) => c.tag), []);
});

test("core sections off the long-run days stay at or above the V192 census on every injury path (the run's days carved out by _longRunTier)", () => {
  // B1b
  assert.equal(typeof P.eval('_longRunTier'), 'function');
  assert.ok(ON.lrDays > 0 && ON.lrDays < ON.dayBuilds);
  for (const [inj, floor] of Object.entries(SB.V192_CORE_OFF_LONG_RUN)) assert.ok(ON.byInj[inj].coreOffLongRun >= floor, inj + ' ' + ON.byInj[inj].coreOffLongRun + ' < ' + floor);
});

test('no section renders with no items, on either lattice', () => {
  // B2
  for (const e of EQUIP) { assert.equal(ON.tiers[e].emptySec, 0, e); assert.equal(ON_N.tiers[e].emptySec, 0, e); }
});

test('prehab never falls below the V192 census, per tier and in aggregate, on both lattices', () => {
  // B3 (the V192 floor; the hand sum cross-checked)
  for (const [lat, cen] of [['wide', ON], ['narrow', ON_N]]) {
    assert.equal(sum(SB.V192_PREHAB[lat]), SB.V192_PREHAB_SUM[lat], lat + ': the transcribed table sums to its floor constant');
    for (const e of EQUIP) assert.ok(cen.tiers[e].prehab >= SB.V192_PREHAB[lat][e], lat + ' ' + e + ' ' + cen.tiers[e].prehab);
    assert.ok(EQUIP.reduce((a, e) => a + cen.tiers[e].prehab, 0) >= SB.V192_PREHAB_SUM[lat], lat);
  }
});

test('prehab outside the four D85 names stays at or above V197, and the D47 rail inside hip sections holds, on every tier', () => {
  // B3 (D85 confinement, D47 rail)
  assert.equal(sum(SB.V197_PREHAB_OTHER), SB.V197_PREHAB_OTHER_SUM);
  for (const e of EQUIP) {
    const byName = ON.tiers[e].prehabName;
    const other = Object.keys(byName).filter((n) => SB.D85_DISPLACED_NAMES.indexOf(n) < 0).reduce((a, n) => a + byName[n], 0);
    assert.ok(other >= SB.V197_PREHAB_OTHER[e], e + ' off-licence prehab ' + other);
    assert.ok(ON.tiers[e].prehabHip >= SB.D47_RAIL_PER_TIER, e + ' rail ' + ON.tiers[e].prehabHip);
  }
});

test('non-optional deletions outside the isolation band stay at or under V192 on every tier', () => {
  // B4 (D81: Leg isolation is excluded on both sides; V192's 432 split 72 per tier)
  assert.equal(SB.RULED_DELETABLE.length, 1);
  assert.equal(sum(SB.V192_RULED_DEL), SB.V192_NONOPT_CLASSES['Leg isolation']);
  for (const e of EQUIP) assert.ok(DEL.perTier[e].nonEx <= SB.V192_NONOPT[e] - SB.V192_RULED_DEL[e], e + ' ' + DEL.perTier[e].nonEx);
});

test('the budget empties no non-optional class outside the V192 class census', () => {
  // B4c
  assert.ok(Object.keys(DEL.kinds).length > 0);
  assert.deepEqual(Object.keys(DEL.kinds).filter((k) => !(k in SB.V192_NONOPT_CLASSES)), []);
});

test('the budget only removes: no section appears after it on any day', () => {
  // B4e
  assert.equal(DEL.days, 28224);
  assert.equal(DEL.added, 0);
});

test('the leg compounds are emptied no more often than V197 emptied them (D81)', () => {
  // B4g, B4g0
  assert.equal(sum(SB.V197_LEG_COMPOUND), SB.V197_LEG_COMPOUND_SUM);
  const live = SB.LEG_COMPOUND_CLASSES.reduce((a, k) => a + (DEL.kinds[k] || 0), 0);
  assert.ok(live <= SB.V197_LEG_COMPOUND_SUM, String(live));
});

test('the census matches tests/snapshots/session-budget-lattice.json (per tier, per class, thin core, the long-run carve-out)', () => {
  // B3 and B4 (the per-tier values the release-to-release ratchets compared), B4g1, B5 (thin core, both lattices),
  // B1b (the carve-out's denominators)
  const tierView = (cen) => Object.fromEntries(EQUIP.map((e) => {
    const t = cen.tiers[e];
    const other = Object.keys(t.prehabName).filter((n) => SB.D85_DISPLACED_NAMES.indexOf(n) < 0).reduce((a, n) => a + t.prehabName[n], 0);
    return [e, { sections: t.sections, items: t.items, coreSections: t.coreSec, thinCore: t.thinCore, prehab: t.prehab, prehabInHipSections: t.prehabHip, prehabOutsideD85Names: other }];
  }));
  const C = {
    wide: {
      dayBuilds: ON.dayBuilds, longRunDays: ON.lrDays, longRunTiers: ON.lrTiers, longRunCoreSections: ON.lrCore,
      byInjury: ON.byInj, tiers: tierView(ON),
      budgetDeletes: { perTier: DEL.perTier, perClass: Object.fromEntries(Object.keys(DEL.kinds).sort().map((k) => [k, DEL.kinds[k]])) },
    },
    narrow: { tiers: tierView(ON_N), budgetDeletes: SB.tally(OFF_N, ON_N).perTier },
  };
  matchSnapshot('session-budget-lattice', { census: C, costLens: lensView() });
});

// ── D195-B's shard ───────────────────────────────────────────────────────────────────────────────────────────────
const SHARD = SB.costLensShard();
const R = SB.costLensDiff(SHARD.concat([SB.B3, SB.B2]));
function lensView() {
  return { configs: R.built, dayCells: R.cells, budgetOffDiffers: R.boDiff, changedByLens: R.changed, itemsAdded: R.added, itemsRemoved: R.removed.length, detailChanges: R.details.length };
}

test('the shard is 648 configs plus the two typed cells, every one built on all three apps', () => {
  // b-built, b-bo (the budget-off switch is live), b-nonempty
  assert.equal(SHARD.length, 648);
  assert.deepEqual(R.crashed, []);
  assert.equal(R.built, 650);
  assert.equal(SB.countIn(SB.BUDGET_OFF_SWITCH), 1);
  assert.ok(R.boDiff > 0 && R.changed > 0 && R.added > 0);
});

test('every program in the shard equals itself on a second page, with and without the lens (every eighth config and the typed cells)', () => {
  // b-self
  const rows = SHARD.filter((_, i) => i % 8 === 0).concat([SB.B3, SB.B2]);
  for (const f of [SB.noD195(), SB.noHipExtA()]) {
    const A = SB.page(f), B = SB.page(f);
    for (const r of rows) assert.equal(progDigest(A.buildProgram(clone(r.c))), progDigest(B.buildProgram(clone(r.c))), r.tag);
  }
});

test('the lens removes one item on the whole shard: B-3, a superset partner re-picked beside the restored Glute-ham raise', () => {
  // b-removed, b-B3
  assert.deepEqual(R.removed.map((x) => [x.row.tag, x.w, x.d, x.lab, x.n]), [[SB.B3.tag, SB.B3.w, SB.B3.d, SB.B3.label, SB.B3.gone]]);
  const secA = R.b3.a.filter((x) => x[2] === SB.B3.label).map((x) => x[0]), secB = R.b3.b.filter((x) => x[2] === SB.B3.label).map((x) => x[0]);
  assert.deepEqual(secA, [SB.B3.gone]);
  assert.deepEqual(secB.slice().sort(), [SB.B3.partner, SB.B3.restored].sort());
  assert.ok(SB.HINGE_HAND.test(SB.B3.gone) && SB.HINGE_HAND.test(SB.B3.partner));
  assert.ok(R.b3.bo.map((x) => x[0]).includes(SB.B3.restored));
});

test('every item the lens adds is on the same day of the budget-off card (B-1)', () => {
  // b-added
  assert.ok(R.added > 0);
  assert.deepEqual(R.novel, []);
  assert.equal(R.addedOff, R.added);
});

test('the one detail the lens changes is B-2, and no day changes any other way', () => {
  // b-detail, b-B2, b-other
  assert.deepEqual(R.details.filter((x) => !x.isB2).map((x) => x.s), []);
  assert.equal(R.b2, 1);
  assert.deepEqual(R.other, []);
});
