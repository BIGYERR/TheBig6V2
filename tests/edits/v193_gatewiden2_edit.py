#!/usr/bin/env python3
# V193 gate-file widening, part 2 — g193_gear_gates.js only. Does NOT touch index.html.
# The two remaining narrow inner sweeps (G3 core-finisher draw, G13 anti_rotation draw) and
# every claim still counted off the healthy slice. Anchors asserted count==1 before writing.

import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_gear_gates.js'
src = io.open(P, encoding='utf-8').read()
orig = src
reps = []
def rep(old, new, tag): reps.append((old, new, tag))

# cells indexed by tier, used by both inner draw sweeps
rep(
"""// ── O4: the core finisher still fills its slot on every tier ────────────────""",
"""// The two draw-time sweeps below build their own programs (they need the budget bypassed,
// which the item sweep above does not). They now walk the SAME wide lattice, indexed by
// tier. CELLS_BY_TIER is the one place that indexing lives, so the two sweeps cannot drift
// apart from each other or from the item sweep.
const CELLS_BY_TIER = {};
for (const e of EQUIP) CELLS_BY_TIER[e] = LAT.WIDE.filter(c => c.equipment === e);
if (CELLS_BY_TIER[EQUIP[0]].length === LAT.WIDE_N / EQUIP.length)
  ok(`L0c the draw sweeps see ${CELLS_BY_TIER[EQUIP[0]].length} cells per tier (${LAT.WIDE_N} / ${EQUIP.length})`);
else bad(`L0c per-tier cell count is ${CELLS_BY_TIER[EQUIP[0]].length}, not ${LAT.WIDE_N / EQUIP.length} — the wide lattice is not balanced across tiers`);

// ── O4: the core finisher still fills its slot on every tier ────────────────""",
'CELLS_BY_TIER')

# G3 sweep -> wide
rep(
"""let coreBlocks = 0, thinCore = 0, thinSample = '';
const rotSeen = {};
for (const e of EQUIP){
  rotSeen[e] = new Set();
  for (const seed of SEEDS){
    // A gate that crashes reports nothing, and nothing is not "no failures" (V167). An
    // emptied pillar throws inside the draw, so catch it here and NAME it.
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment: e, seed })); }
    catch (err){ bad(`G3 build threw on ${e} seed=${seed} with the budget bypassed: ${err.message}`); continue; }
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections||[])) if (s && s.core){
          coreBlocks++;
          const names = (s.items||[]).filter(Boolean).map(i => clean(i && i.name));
          if (names.length !== 2){ thinCore++; if(!thinSample) thinSample = `${e} seed=${seed} W${wk} ${d} n=${names.length} [${names.join(', ')}]`; }
          if (s.pillar === 'rotational_power') names.forEach(n => rotSeen[e].add(n));
        }
      }
  }
}""",
"""let coreBlocks = 0, thinCore = 0, thinSample = '';
const rotSeen = {};
// thin blocks split by injury path, because a rehab overlay and a healthy build are two
// different claims and a single aggregate would let one hide inside the other.
const thinByInj = {}, blocksByInj = {};
for (const t of LAT.INJ_WIDE.map(i => i.tag)){ thinByInj[t] = 0; blocksByInj[t] = 0; }
for (const e of EQUIP){
  rotSeen[e] = new Set();
  for (const c of CELLS_BY_TIER[e]){
    // A gate that crashes reports nothing, and nothing is not "no failures" (V167). An
    // emptied pillar throws inside the draw, so catch it here and NAME it.
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); }
    catch (err){ bad(`G3 build threw on ${c.tag} with the budget bypassed: ${err.message}`); continue; }
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections||[])) if (s && s.core){
          coreBlocks++; blocksByInj[c.inj]++;
          const names = (s.items||[]).filter(Boolean).map(i => clean(i && i.name));
          if (names.length !== 2){ thinCore++; thinByInj[c.inj]++; if(!thinSample) thinSample = `${c.tag} W${wk} ${d} n=${names.length} [${names.join(', ')}]`; }
          if (s.pillar === 'rotational_power') names.forEach(n => rotSeen[e].add(n));
        }
      }
  }
}
console.log('  draw-time core blocks by injury ' + JSON.stringify(Object.fromEntries(
  Object.keys(blocksByInj).map(t => [t, thinByInj[t] + '/' + blocksByInj[t] + ' not-a-pair']))));""",
'G3 sweep wide')

rep(
"""if (coreBlocks > 300) ok(`G3 core finishers observed across all six tiers: ${coreBlocks}`);""",
"""if (coreBlocks > 3000) ok(`G3 core finishers observed across all six tiers and all four injury paths: ${coreBlocks}`);""",
'G3 volume floor')

# G4/G5/G6: also assert the cable claim on every injury path, not only lowback
rep(
"""for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  if (sapLow[e] === 0) ok(`G4 no "Straight-arm pulldown" on ${e} (tier owns no cable)`);
  else bad(`G4 ${sapLow[e]} "Straight-arm pulldown" items on ${e}, which owns no cable: ${sampleBy(LOWBACK.per[e], /^Straight-arm pulldown$/)}`);
}""",
"""for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  if (sapLow[e] === 0) ok(`G4 no "Straight-arm pulldown" on ${e} under lowback/protect (tier owns no cable)`);
  else bad(`G4 ${sapLow[e]} "Straight-arm pulldown" items on ${e}, which owns no cable: ${sampleBy(LOWBACK.per[e], /^Straight-arm pulldown$/)}`);
  // A cable movement on a cable-less tier is illegal on every path, not just this one.
  const nAll = countBy(ALL.per[e], IS_PULLDOWN);
  if (nAll === 0) ok(`G4b no pulldown-named movement at all on ${e} across all four injury paths`);
  else bad(`G4b ${nAll} pulldown-named items on ${e}, which owns no cable: ${sampleBy(ALL.per[e], IS_PULLDOWN)}`);
}""",
'G4b all-paths pulldown')

# G6: every cable-less tier keeps a vertical pull, on each protect path that drops the row
rep(
"""if (pullMissing.length === 0) ok(`G6 every cable-less tier still gets a vertical pull under lowback/protect (${pullFilled} tiers)`);
else bad(`G6 lowback/protect leaves NO vertical pull on: ${pullMissing.join(', ')} — the slot was emptied, not substituted`);""",
"""if (pullMissing.length === 0) ok(`G6 every cable-less tier still gets a vertical pull under lowback/protect (${pullFilled} tiers)`);
else bad(`G6 lowback/protect leaves NO vertical pull on: ${pullMissing.join(', ')} — the slot was emptied, not substituted`);
// O4 on the other two protect paths as well. A shoulder or elbow overlay that leaves an
// athlete with no pull at all is the same deletion under a different overlay.
for (const t of ['shoulder/protect', 'elbow/protect']){
  const miss = EQUIP.filter(e => countBy(BYINJ[t].per[e], VPULL) === 0);
  if (!miss.length) ok(`G6b every tier still gets a vertical pull under ${t}`);
  else bad(`G6b ${t} leaves NO vertical pull on: ${miss.join(', ')} — the slot was emptied, not substituted`);
}""",
'G6b other protect paths')

# band counts over ALL
rep(
"""const bandCount = {};
for (const e of EQUIP) bandCount[e] = countBy(HEALTHY.per[e], IS_BAND);""",
"""const bandCount = {};
for (const e of EQUIP) bandCount[e] = countBy(ALL.per[e], IS_BAND);""",
'G8 band count over ALL')

rep(
"""  else bad(`G8 ${e} prescribes ${bandCount[e]} band-named items but its card names no bands: "${desc}" :: ${sampleBy(HEALTHY.per[e], IS_BAND)}`);""",
"""  else bad(`G8 ${e} prescribes ${bandCount[e]} band-named items but its card names no bands: "${desc}" :: ${sampleBy(ALL.per[e], IS_BAND)}`);""",
'G8 sample over ALL')

rep(
"""  const n = ['home_full','crossfit'].reduce((a,e) => a + countEq(HEALTHY.per[e], nm), 0);""",
"""  const n = ['home_full','crossfit'].reduce((a,e) => a + countEq(ALL.per[e], nm), 0);""",
'G9 banded prehab over ALL')

# G12b Pallof reach over ALL
rep(
"""  const nP = countEq(HEALTHY.per[e], 'Pallof press');""",
"""  const nP = countEq(ALL.per[e], 'Pallof press');""",
'G12b over ALL')

# G13 sweep -> wide
rep(
"""  arSeen[e] = new Set(); arPairs[e] = new Set(); arBlocks[e] = 0; arStatic[e] = 0;
  for (const seed of SEEDS){
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment: e, seed })); }
    catch (err){ bad(`G13 build threw on ${e} seed=${seed}: ${err.message}`); continue; }""",
"""  arSeen[e] = new Set(); arPairs[e] = new Set(); arBlocks[e] = 0; arStatic[e] = 0;
  for (const c of CELLS_BY_TIER[e]){
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); }
    catch (err){ bad(`G13 build threw on ${c.tag}: ${err.message}`); continue; }""",
'G13 sweep wide')

rep(
"""  if (arBlocks[e] > 20) ok(`G13 ${arBlocks[e]} anti_rotation blocks observed on ${e}`);
  else bad(`G13 only ${arBlocks[e]} anti_rotation blocks on ${e} — the pillar claims below are untested`);""",
"""  if (arBlocks[e] > 120) ok(`G13 ${arBlocks[e]} anti_rotation blocks observed on ${e} across all four injury paths`);
  else bad(`G13 only ${arBlocks[e]} anti_rotation blocks on ${e} — the pillar claims below are untested`);""",
'G13 volume floor')

# G15 / doseless over ALL
rep(
"""for (const e of EQUIP) for (const r of HEALTHY.per[e]) for (const x of r.items)
  if (SING.test(x.name)){ singHits++; if(!singSample) singSample = `${e} ${x.name}`; }""",
"""for (const e of EQUIP) for (const r of ALL.per[e]) for (const x of r.items)
  if (SING.test(x.name)){ singHits++; if(!singSample) singSample = `${e} ${r.seed} ${x.name}`; }""",
'G15 over ALL')

rep(
"""for (const e of EQUIP) for (const r of HEALTHY.per[e]) for (const x of r.items) if (!x.name) doseless.push(e);""",
"""for (const e of EQUIP) for (const r of ALL.per[e]) for (const x of r.items) if (!x.name) doseless.push(e);""",
'doseless over ALL')

for old, new, tag in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (want 1)\n' % (tag, n)); sys.exit(1)
    src = src.replace(old, new, 1)

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('OK %d replacements in %s' % (len(reps), P))
