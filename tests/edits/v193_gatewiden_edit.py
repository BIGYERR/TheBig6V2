#!/usr/bin/env python3
# V193 gate-file widening — g193_gear_gates.js only. Does NOT touch index.html.
#
# Gatekeeper recommendation 3, Mario concurring: g193_gear_gates swept one goal, one focus,
# one experience, healthy only (6 tiers x 5 seeds = 30 builds) and passed honestly while
# every V193 defect sat outside that lattice. This script repoints the sweep at the shared
# WIDE lattice in tests/gates/_lattice193.js:
#   {healthy, shoulder/protect, lowback/protect, elbow/protect}
#   x {support_prevention, hypertrophy} x {intermediate, advanced} x 6 tiers x 3 seeds.
#
# Every anchor is asserted count==1 before anything is written. First miss aborts the whole
# script and nothing is saved.

import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_gear_gates.js'
src = io.open(P, encoding='utf-8').read()
orig = src
reps = []

def rep(old, new, tag):
    reps.append((old, new, tag))

# 1. require the shared lattice, and stop using a private seed list
rep(
"""const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));""",
"""const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '_lattice193.js'));""",
'require shared lattice')

rep(
"""const EQUIP = Object.keys(TIERS);
const SEEDS = [1013, 3039, 6078, 10130, 76308];""",
"""const EQUIP = Object.keys(TIERS);
// The tier table above is this gate's own hand oracle and must agree with the shared
// lattice's tier list, or half the claims below are made about tiers nobody swept.
if (EQUIP.join(',') === LAT.EQUIP.join(',')) ok('L0 the gate\\'s hand tier table and the shared lattice list the same six tiers');
else bad('L0 tier lists disagree: gate ' + EQUIP.join(',') + ' vs lattice ' + LAT.EQUIP.join(','));
if (LAT.WIDE_N === 288) ok('L0a WIDE lattice is the ruled 288 cells (4 injuries x 6 tiers x 2 foci x 2 experiences x 3 seeds)');
else bad('L0a WIDE lattice is ' + LAT.WIDE_N + ' cells, not the ruled 288 — _lattice193.js was narrowed and every claim below is weaker than it reads');
const SEEDS = LAT.SEEDS_WIDE;""",
'tier-table / lattice agreement')

# 2. one wide sweep, sliced per injury, replacing the two narrow lattice() calls
rep(
"""function lattice(extra){
  const per = {};
  let total = 0;
  for (const equipment of EQUIP){
    per[equipment] = [];
    for (const seed of SEEDS){
      const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, seed }, extra || {});
      let prog;
      try { prog = IA.buildProgram(cfg); }
      catch (e){ bad(`build threw equipment=${equipment} seed=${seed} ${JSON.stringify(extra||{})}: ${e.message}`); continue; }
      const its = itemsOf(prog);
      total += its.length;
      per[equipment].push({ seed, items: its });
    }
  }
  return { per, total };
}""",
"""// WIDENED. One sweep of the shared WIDE lattice, then sliced by injury, instead of two
// narrow healthy-only sweeps. Every claim that used to read "on 5 healthy builds per tier"
// now reads "on 12 builds per tier across two foci and two experience levels", and the
// lowback slice is no longer the only injury path this gate can see.
// Row shape is unchanged ({ seed, items }) so every countEq / countBy / sampleBy claim
// below keeps working; `seed` is widened to the full cell tag so a failure sample names the
// focus and experience it came from and is reproducible without guessing.
let SWEPT_CELLS = 0;
function sweepWide(){
  const byInj = {};
  for (const c of LAT.WIDE){
    const slot = byInj[c.inj] || (byInj[c.inj] = { per:{}, total:0 });
    for (const e of EQUIP) if (!slot.per[e]) slot.per[e] = [];
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); SWEPT_CELLS++; }
    catch (e){ bad(`build threw ${c.tag}: ${e.message}`); continue; }
    const its = itemsOf(prog);
    slot.total += its.length;
    slot.per[c.equipment].push({ seed: c.liftingFocus + '/' + c.experience + '/' + c.seed, items: its });
  }
  return byInj;
}""",
'wide sweep replaces lattice()')

rep(
"""// ── lattices ─────────────────────────────────────────────────────────────────
const HEALTHY = lattice(null);
const LOWBACK = lattice({ injury: { region: 'lowback', tier: 'protect' } });

if (HEALTHY.total > 3000) ok(`healthy lattice ${HEALTHY.total} items over ${EQUIP.length}x${SEEDS.length} builds`);
else bad(`healthy lattice too thin: ${HEALTHY.total} items — the gate is blind`);
if (LOWBACK.total > 3000) ok(`lowback/protect lattice ${LOWBACK.total} items`);
else bad(`lowback/protect lattice too thin: ${LOWBACK.total} items — the gate is blind`);""",
"""// ── lattices ─────────────────────────────────────────────────────────────────
const BYINJ    = sweepWide();
const HEALTHY  = BYINJ['healthy'];
const LOWBACK  = BYINJ['lowback/protect'];
const SHOULDER = BYINJ['shoulder/protect'];
const ELBOW    = BYINJ['elbow/protect'];
// ALL: the union, used by every claim of the form "this movement must never print on a tier
// that owns no implement for it". That claim has nothing to do with injury, so restricting
// it to the healthy slice was the narrowness itself: an overlay that substitutes a movement
// is exactly the code path most likely to reach past the gear filter.
const ALL = { per:{}, total:0 };
for (const e of EQUIP){ ALL.per[e] = []; }
for (const t of Object.keys(BYINJ)){
  ALL.total += BYINJ[t].total;
  for (const e of EQUIP) for (const r of BYINJ[t].per[e]) ALL.per[e].push({ seed: t + ' ' + r.seed, items: r.items });
}
console.log(`  swept ${SWEPT_CELLS}/${LAT.WIDE_N} cells, ${ALL.total} items, injury slices: ${Object.keys(BYINJ).join(', ')}`);
if (SWEPT_CELLS === LAT.WIDE_N) ok(`L0b every one of the ${LAT.WIDE_N} wide cells built (no build was silently skipped)`);
else bad(`L0b only ${SWEPT_CELLS}/${LAT.WIDE_N} wide cells built`);
for (const t of Object.keys(BYINJ)){
  if (BYINJ[t].total > 3000) ok(`${t} lattice ${BYINJ[t].total} items over ${EQUIP.length} tiers x ${BYINJ[t].per[EQUIP[0]].length} builds`);
  else bad(`${t} lattice too thin: ${BYINJ[t].total} items — the gate is blind on that path`);
}""",
'wide lattice slices')

# 3. the tier legality table (G1/G2) now reads the UNION, not the healthy slice
rep(
"""const tbl = {};
for (const g of GATED){
  tbl[g.name] = {};
  for (const e of EQUIP) tbl[g.name][e] = countEq(HEALTHY.per[e], g.name);
}
for (const n of UNGATED_CORE){
  tbl[n] = {};
  for (const e of EQUIP) tbl[n][e] = countEq(HEALTHY.per[e], n);
}""",
"""// COUNTED OVER ALL FOUR INJURY PATHS, not the healthy one. A gear filter that an overlay
// bypasses is still a gear filter that leaked, and the healthy slice cannot see it.
const tbl = {};
for (const g of GATED){
  tbl[g.name] = {};
  for (const e of EQUIP) tbl[g.name][e] = countEq(ALL.per[e], g.name);
}
for (const n of UNGATED_CORE){
  tbl[n] = {};
  for (const e of EQUIP) tbl[n][e] = countEq(ALL.per[e], n);
}""",
'G1/G2 table over ALL')

rep(
"""    if (tbl[g.name][e] === 0) ok(`G1 no "${g.name}" on ${e} (tier owns no ${g.why})`);
    else bad(`G1 ${tbl[g.name][e]} "${g.name}" items on ${e}, which owns no ${g.why}: ${sampleEq(HEALTHY.per[e], g.name)}`);""",
"""    if (tbl[g.name][e] === 0) ok(`G1 no "${g.name}" on ${e} (tier owns no ${g.why}) across all four injury paths`);
    else bad(`G1 ${tbl[g.name][e]} "${g.name}" items on ${e}, which owns no ${g.why}: ${sampleEq(ALL.per[e], g.name)}`);""",
'G1 sample from ALL')

rep(
"""for (const e of EQUIP){
  if (TIERS[e].barbell) continue;
  const n = countBy(HEALTHY.per[e], IS_LANDMINE);
  if (n === 0) ok(`G1b no landmine-named movement at all on ${e}`);
  else bad(`G1b ${n} landmine-named items on ${e}, which owns no barbell: ${sampleBy(HEALTHY.per[e], IS_LANDMINE)}`);
  const nl = countBy(LOWBACK.per[e], IS_LANDMINE);
  if (nl === 0) ok(`G1c no landmine on ${e} under lowback/protect`);
  else bad(`G1c ${nl} landmine items on ${e} under lowback/protect: ${sampleBy(LOWBACK.per[e], IS_LANDMINE)}`);
}""",
"""for (const e of EQUIP){
  if (TIERS[e].barbell) continue;
  const n = countBy(ALL.per[e], IS_LANDMINE);
  if (n === 0) ok(`G1b no landmine-named movement at all on ${e} (all four injury paths)`);
  else bad(`G1b ${n} landmine-named items on ${e}, which owns no barbell: ${sampleBy(ALL.per[e], IS_LANDMINE)}`);
  // per injury path, named, so a leak that only one overlay opens is not averaged away
  for (const t of Object.keys(BYINJ)){
    const nl = countBy(BYINJ[t].per[e], IS_LANDMINE);
    if (nl === 0) ok(`G1c no landmine on ${e} under ${t}`);
    else bad(`G1c ${nl} landmine items on ${e} under ${t}: ${sampleBy(BYINJ[t].per[e], IS_LANDMINE)}`);
  }
}""",
'G1b/G1c per injury')

for old, new, tag in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (want 1)\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new, 1)

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('OK %d replacements in %s' % (len(reps), P))
