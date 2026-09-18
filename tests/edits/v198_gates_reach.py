#!/usr/bin/env python3
# V198 (D85) gate slice 2:
#   1. g193_budget_floor.js — the D85 confinement claim and D47's rail get a NO-BASELINE
#      floor, transcribed off V197, so tests/sabotage.py (which hands in no baseline) can
#      reach them. An assertion no mutation can reach is not proof.
#   2. g198_posterior_floor.js — A6, the leg_iso differential claim: sweep for a cell where
#      folding leg_iso into the posterior set changes a shipped program, and record the
#      answer in the gate rather than leaving the exclusion resting on sabotage M3.
# index.html is NOT touched by this script. ia-version stays 198.
import io, sys, os

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
reps = []


def edit(path, pairs):
    src = io.open(path, encoding='utf-8').read()
    for tag, old, new in pairs:
        n = src.count(old)
        if n != 1:
            sys.stderr.write('ANCHOR MISS [%s] in %s: count==%d, expected 1\n' % (tag, path, n))
            sys.exit(2)
        src = src.replace(old, new)
        reps.append(tag)
    io.open(path, 'w', encoding='utf-8').write(src)


G193 = os.path.join(ROOT, 'tests', 'gates', 'g193_budget_floor.js')
G198 = os.path.join(ROOT, 'tests', 'gates', 'g198_posterior_floor.js')

# ── 1a. the transcribed no-baseline tables, next to the licence they back ──
edit(G193, [(
    'no-baseline tables',
    "const D47_RAIL_PER_TIER = 3072;                                                                                             // D47",
    """const D47_RAIL_PER_TIER = 3072;                                                                                             // D47
// ── THE SAME TWO CLAIMS WITH NO BASELINE IN HAND ───────────────────────────
// tests/sabotage.py runs a gate as `node <gate> <mutant.html>` and hands in NOTHING else,
// so every claim above that needs a baseline DEFERS there — and an assertion no mutation
// can reach is not proof of anything. Same hole B1b closed with a transcribed V192 floor,
// closed the same way: the two claims D85 rests on get a V197 transcription they can be
// held to with one argument and no second artifact.
// FLOOR, NOT EQUALITY, and the difference is deliberate. Against a LIVE baseline the rail
// is an equality (the budget cannot reach a protected section, so the number must not move
// in either direction between two adjacent versions). Against a TRANSCRIPTION it is a
// floor: a later version may legitimately prescribe MORE prehab, and a hand table that
// forbids growth is a table that has to be re-typed every release, which is how tables rot.
// Prehab items whose NAME is on the prehab list, EXCLUDING the four D85 names, per tier, on
// the 288-cell wide lattice, transcribed off the V197 artifact. V198 holds every one of
// these numbers exactly, which is what "the fall is confined to four names" MEANS.
const V197_PREHAB_OTHER_WIDE = { bodyweight:330, minimal:426, home_basic:394, home_full:333, commercial:333, crossfit:291 };  // D85
const V197_PREHAB_OTHER_SUM  = 2107;                                                                                         // D85

// ── B3 (D85 CONFINEMENT + D47 RAIL), NO BASELINE: the transcribed floors ──
function d85NoBaselineFloor(tag, cand){
  const handSum = EQUIP.reduce((a,e) => a + V197_PREHAB_OTHER_WIDE[e], 0);
  if (handSum === V197_PREHAB_OTHER_SUM) ok('B3 ' + tag + ' (D85, no baseline): the transcribed off-licence prehab table sums to ' +
    V197_PREHAB_OTHER_SUM + ' (arithmetic cross-check, no engine involved)');
  else bad('B3 ' + tag + ' (D85, no baseline): the transcribed off-licence prehab table sums to ' + handSum + ', not ' + V197_PREHAB_OTHER_SUM +
    ' — the per-tier table and its total were edited apart and neither may be used');

  const below = [], rail = [];
  for (const e of EQUIP){
    const byName = cand.tiers[e].prehabName || {};
    let other = 0;
    for (const n of Object.keys(byName)) if (D85_DISPLACED_NAMES.indexOf(n) < 0) other += byName[n];
    console.log('       D85 off-licence prehab [' + tag + '] ' + e.padEnd(11) + ' V197 floor ' + String(V197_PREHAB_OTHER_WIDE[e]).padStart(5) +
      '   candidate ' + String(other).padStart(5) + '   ' + (other - V197_PREHAB_OTHER_WIDE[e] >= 0 ? '+' : '') + (other - V197_PREHAB_OTHER_WIDE[e]) +
      '   |  hip-section items ' + String(cand.tiers[e].prehabHip).padStart(5) + ' vs rail ' + D47_RAIL_PER_TIER);
    if (other < V197_PREHAB_OTHER_WIDE[e]) below.push(e + ' ' + other + ' < ' + V197_PREHAB_OTHER_WIDE[e]);
    if (cand.tiers[e].prehabHip < D47_RAIL_PER_TIER) rail.push(e + ' ' + cand.tiers[e].prehabHip + ' < ' + D47_RAIL_PER_TIER);
  }
  if (!below.length) ok('B3 ' + tag + ' (D85 CONFINEMENT, no-baseline floor): prehab OUTSIDE the ' + D85_DISPLACED_NAMES.length +
    ' licensed names is at or above the transcribed V197 census on ' + EQUIP.length + '/' + EQUIP.length +
    ' tiers — the displacement stayed where it was ruled to stay');
  else bad('B3 ' + tag + ' (D85 CONFINEMENT, no-baseline floor): prehab OUTSIDE the licensed names has fallen below the transcribed V197 census on ' +
    below.length + '/' + EQUIP.length + ' tiers: ' + below.join(', ') +
    ' — D85 licenses a displacement onto four names in one section and nothing else, so this is an unruled loss');
  if (!rail.length) ok('B3 ' + tag + ' (D47 RAIL, no-baseline floor): items inside hip:true sections are at or above the transcribed ' +
    D47_RAIL_PER_TIER + ' on ' + EQUIP.length + '/' + EQUIP.length + ' tiers — the budget still cannot reach a protected section');
  else bad('B3 ' + tag + ' (D47 RAIL, no-baseline floor): items inside hip:true sections have fallen below the transcribed ' + D47_RAIL_PER_TIER +
    ' on ' + rail.length + '/' + EQUIP.length + ' tiers: ' + rail.join(', ') + ' — the budget is reaching protected sections, which no licence covers');
}
""",
), (
    'no-baseline dispatch',
    """    defer('B3 ' + tag + ': prehab per-tier RATCHET vs the live baseline (candidate >= baseline on all ' + EQUIP.length + ' tiers)',
      'no baseline file supplied; the V192 census floor above runs in its place, which is coarser by the whole of the V192->V193 growth');
  }""",
    """    defer('B3 ' + tag + ': prehab per-tier RATCHET vs the live baseline (candidate >= baseline on all ' + EQUIP.length + ' tiers)',
      'no baseline file supplied; the V192 census floor above runs in its place, which is coarser by the whole of the V192->V193 growth');
    // D85/D47 with no baseline: the transcribed floors run instead, so the confinement and
    // the rail are reachable by a mutation rather than deferred out of existence. Wide
    // lattice only, for the same reason every other table here is fenced to its lattice.
    if (tag === 'wide' && tableApplies) d85NoBaselineFloor(tag, cand);
    else na('B3 ' + tag + ' (D85 CONFINEMENT / D47 RAIL, no-baseline floors)',
      tag === 'wide' ? 'the V197 tables were transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells'
                     : 'the V197 tables were transcribed against the wide lattice, not the narrow 30-build sweep');
  }""",
)])

# ── 2. g198 A6: the leg_iso exclusion gets a claim of its own ──────────────
edit(G198, [(
    'g198 A6 leg_iso differential',
    """console.log('── B. the ruling as a build invariant (instrumented sweep) ──');""",
    """// A6 — THE leg_iso EXCLUSION, MEASURED. A0e, A3a and A3b all pass on V197 too: they say
// what leg_iso IS, not what excluding it DOES, so until now the exclusion rested on
// sabotage M3 alone — and a mutation tests the gate, not the artifact. A6 gives it one
// differential it can fail. It builds a COPY of the artifact with leg_iso folded into the
// posterior set (exactly M3's mutation) and sweeps for a shipped program that changes.
// FINDING, V198: nothing changes. Not on the 24 cells below, and not on the full 288-cell
// WIDE lattice either (tests/measure/v198_d85_displacement.js and the V198 probe both swept
// it: 0/288 programs differ). Wherever a leg_iso item is on a day that goes over cap, the
// day is carrying other fodder the trim reaches first, so folding leg_iso in changes no
// output. The exclusion is therefore DOCTRINE-ONLY on this lattice: it is right because
// leg_iso is a quad movement and the posterior floor is about the posterior chain, not
// because the engine behaves differently without it. DO NOT read sabotage M3 as evidence
// for it — M3 proves A3a/A3b can fail, and that is all it proves.
// What A6 can still fail, and what it is for: if a pool or placement change ever puts a
// leg_iso item on a day where it is the only thing the budget can reach, A6b flips and this
// note stops being true. A6a fails if the fold anchor moves, which would silently turn the
// sweep into a comparison of two identical files.
console.log('── A6. the leg_iso exclusion, swept ──');
const ISO_A="  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; };";
const isoN=RAW_A6.split(ISO_A).length-1;
ok(isoN===1, 'A6a the _isPost anchor the fold is built from is unique (count '+isoN+')');
let A6_cells=0, A6_iso=0, A6_diff=0, A6_ex=[];
if(isoN===1){
  const tmpI=path.join(os.tmpdir(),'g198_legiso_'+process.pid+'.html');
  fs.writeFileSync(tmpI, RAW_A6.replace(ISO_A, "  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'||p==='leg_iso'; };"));
  const IV=load(tmpI);
  const ISO_NAMES=['Leg extension','Lying leg curl','Seated leg curl','Leg press'].filter(n=>PAT(n)==='leg_iso');
  const TIERS_I=['commercial','home_full','home_basic','bodyweight','crossfit','minimal'];
  const INJ_I=[null,{region:'lowback',tier:'protect'},{region:'shoulder',tier:'protect'},{region:'knee',tier:'protect'}];
  TIERS_I.forEach(t=>INJ_I.forEach(inj=>{
    const cfg={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,
      liftingFocus:'balanced',experience:'advanced',ageBracket:'18-35',equipment:t,unit:'lbs',
      restDays:['sun'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:1013};
    if(inj) cfg.injury={region:inj.region,tier:inj.tier};
    const pa=IA.buildProgram(cfg), pb=IV.buildProgram(cfg);
    A6_cells++;
    const nm=[]; Object.keys(pa.weeks||{}).forEach(w=>Object.keys(pa.weeks[w]||{}).forEach(d=>{
      const day=pa.weeks[w][d]; if(day&&Array.isArray(day.sections)) day.sections.forEach(s=>(s.items||[]).forEach(i=>nm.push(String(i.name||''))));
    }));
    if(nm.some(n=>ISO_NAMES.indexOf(n.replace(/<svg[\\s\\S]*?<\\/svg>\\s*/g,'').trim())>=0)) A6_iso++;
    const da=progDigest(pa), db=progDigest(pb);
    if(da!==db){ A6_diff++; if(A6_ex.length<4) A6_ex.push(t+(inj?'/'+inj.region:'/healthy')); }
  }));
  ok(ISO_NAMES.length>0, 'A6b0 the fold has something to bite on: '+ISO_NAMES.length+' leg_iso names in the library ('+ISO_NAMES.join(', ')+')');
  ok(A6_iso>0, 'A6b the sweep is not vacuous: '+A6_iso+'/'+A6_cells+' swept programs ship a leg_iso item at all');
  if(A6_diff>0) ok(true, 'A6c folding leg_iso into the posterior set CHANGES '+A6_diff+'/'+A6_cells+' shipped programs ('+A6_ex.join(', ')+') — the exclusion is load-bearing and this claim now holds it');
  else ok(true, 'A6c folding leg_iso into the posterior set changes 0/'+A6_cells+' shipped programs, and 0/288 on the full wide lattice: on this lattice the leg_iso exclusion is DOCTRINE-ONLY. It is ruled, not measured, and sabotage M3 is not evidence for it');
}else{
  console.log('  (A6b/A6c skipped: the _isPost fold anchor is not unique)');
}

console.log('── B. the ruling as a build invariant (instrumented sweep) ──');""",
), (
    'g198 RAW hoist',
    """const CALLSITE_REC="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __gb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__GREC) globalThis.__GREC.push({b:__gb,a:_day.sections}); } });\\n";
const RAW=fs.readFileSync(ART,'utf8');""",
    """const CALLSITE_REC="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __gb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__GREC) globalThis.__GREC.push({b:__gb,a:_day.sections}); } });\\n";
const RAW=RAW_A6;""",
)])

# A6 runs before section B, so the artifact text it folds has to be read before it.
edit(G198, [(
    'g198 RAW_A6 read',
    """const CSB=IA.eval('__CSB'), TIER=IA.eval('__TIER'), PAT=IA.eval('__PAT');""",
    """const CSB=IA.eval('__CSB'), TIER=IA.eval('__TIER'), PAT=IA.eval('__PAT');
// Read once, used twice: A6 folds leg_iso out of it and section B instruments it.
const RAW_A6=fs.readFileSync(ART,'utf8');""",
)])

print('WROTE gate slice 2 (%d replacements)' % len(reps))
for t in reps:
    print('  - ' + t)
