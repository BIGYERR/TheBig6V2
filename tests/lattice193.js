// SHARED LATTICE — V193. The config axes every V193 gate sweeps.
// Lives at tests/ root next to harness.js, NOT in tests/gates/, because tests/gate.sh
// globs gates/*.js and runs every file it finds as a gate. A module that prints no
// 'PASS n FAIL n' summary would fail the runner's 'a gate that prints nothing has failed'
// rule, and the right answer to that is to keep the helper out of the glob, not to teach
// the runner to skip files.
//
// WHY THIS FILE EXISTS, and it is the lesson V193 paid for. g193_budget_floor and
// g193_gear_gates each swept ONE goal, ONE focus, ONE experience, healthy only:
// HALF MANNY x 6 tiers x 5 seeds, about 30 builds. Both passed honestly. Every defect
// V193 actually shipped sat OUTSIDE that lattice — 128 'Assisted pullups' main-lift
// collisions on lowback/protect, 70 new non-optional trunk deletions on shoulder and
// elbow protect, 10 'Rehab + Trunk' days with no trunk, four same-card duplicate classes
// on hypertrophy. A gate that passes honestly on a lattice too narrow to contain the
// defect is worse than no gate, because it reads as coverage.
//
// g193_samecard had already widened for exactly this reason and proved the cost is small
// (864 builds / ~59k day-builds in about 7.5 s). Rather than let a third hand-rolled axis
// list drift out of step with the other two, the axes live here.
//
// READ THIS BEFORE YOU EDIT ANYTHING BELOW. A shared helper is a shared failure mode: a
// gate that silently narrows because somebody trimmed an axis here is the V193 defect
// again, one level up. So:
//   * Every consumer PRINTS the cell count it swept, and asserts it against CELLS.length
//     (or its own documented subset). A lattice that shrank shows up as a failed
//     assertion in every gate at once, not as a quiet drop in coverage.
//   * Nothing in here is derived from the engine. These are config inputs, hand typed.
//   * Removing an axis value is a RULING, not a tuning. Add the reason inline.
//
// The floor Mario and gatekeeper set for V193 gate work:
//   {healthy, shoulder/protect, lowback/protect, elbow/protect}
//   x {support_prevention, hypertrophy} x {intermediate, advanced}
//   x all six equipment tiers x multiple seeds.
// WIDE below is that floor exactly. FULL is the g193_samecard superset, kept here so a
// gate that wants the knee / hip / ankle and beginner paths does not re-type them.

'use strict';

// Six tiers, in the order the wizard lists them. Never a subset.
const EQUIP = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];

// Injury cells. tag is what a failure message prints; injury is the cfg value.
// The four in WIDE are the ones V193's defects lived on: lowback/protect owns the
// pull-day rewrite, shoulder and elbow protect own the trunk-deletion counts, healthy is
// the control that proves an assertion is not injury-only.
const INJ_WIDE = [
  { tag: 'healthy',          injury: null },
  { tag: 'shoulder/protect', injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'lowback/protect',  injury: { region: 'lowback',  tier: 'protect' } },
  { tag: 'elbow/protect',    injury: { region: 'elbow',    tier: 'protect' } },
];
const INJ_EXTRA = [
  { tag: 'knee/protect',       injury: { region: 'knee',    tier: 'protect' } },
  { tag: 'hip/workaround',     injury: { region: 'hip',     tier: 'workaround' } },
  { tag: 'ankle/workaround',   injury: { region: 'ankle',   tier: 'workaround' } },
  { tag: 'lowback/workaround', injury: { region: 'lowback', tier: 'workaround' } },
];
const INJ_FULL = INJ_WIDE.concat(INJ_EXTRA);

const FOCUS_WIDE = ['support_prevention', 'hypertrophy'];
const EXPER_WIDE = ['intermediate', 'advanced'];
const EXPER_FULL = ['beginner', 'intermediate', 'advanced'];

// Seeds are PINNED, never null (V182: a null seed makes a gate non-reproducible).
// Three for the wide sweeps, five for anything that stays narrow.
const SEEDS_WIDE   = [1013, 3039, 76308];
const SEEDS_NARROW = [1013, 3039, 6078, 10130, 76308];

function cells(inj, equip, focus, exper, seeds){
  const out = [];
  for (const i of inj) for (const equipment of equip) for (const liftingFocus of focus)
  for (const experience of exper) for (const seed of seeds){
    out.push({
      tag: i.tag + ' ' + equipment + ' ' + liftingFocus + ' ' + experience + ' seed=' + seed,
      key: [i.tag, equipment, liftingFocus, experience, seed].join('|'),
      inj: i.tag, equipment, liftingFocus, experience, seed,
      over: { equipment, seed, liftingFocus, experience, injury: i.injury },
    });
  }
  return out;
}

// WIDE: 4 injuries x 6 tiers x 2 foci x 2 experiences x 3 seeds = 288 cells.
const WIDE = cells(INJ_WIDE, EQUIP, FOCUS_WIDE, EXPER_WIDE, SEEDS_WIDE);
// FULL: the g193_samecard lattice. 8 x 6 x 2 x 3 x 3 = 864 cells.
const FULL = cells(INJ_FULL, EQUIP, FOCUS_WIDE, EXPER_FULL, SEEDS_WIDE);
// NARROW: the old one-goal one-focus healthy sweep, 6 x 5 = 30 cells. Kept ONLY so the
// hand-transcribed V192 censuses that were typed against it stay checkable. It is never
// the lattice a claim is made on any more.
const NARROW = cells([INJ_WIDE[0]], EQUIP, ['support_prevention'], ['intermediate'], SEEDS_NARROW)
  .map(c => { delete c.over.liftingFocus; delete c.over.experience; delete c.over.injury; return c; });

module.exports = {
  EQUIP, INJ_WIDE, INJ_FULL, FOCUS_WIDE, EXPER_WIDE, EXPER_FULL,
  SEEDS_WIDE, SEEDS_NARROW, cells,
  WIDE, FULL, NARROW,
  WIDE_N: WIDE.length, FULL_N: FULL.length, NARROW_N: NARROW.length,
};
