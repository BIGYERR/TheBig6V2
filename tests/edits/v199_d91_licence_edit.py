#!/usr/bin/env python3
# V199 D91 (amendment, no new D-code) — B3 displacement licence in g193_budget_floor.js.
# Edit surface: tests/gates/g193_budget_floor.js ONLY. index.html is NOT touched.
# Five anchored replacements, each asserted count==1, abort on the first miss.
import io, sys

P = 'tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(old, new, label):
    global src
    n = src.count(old)
    assert n == 1, 'ANCHOR %s: count==%d, expected 1' % (label, n)
    src = src.replace(old, new, 1)

# ── 1. the licence switch, declared beside D85's ────────────────────────────
rep(
"var D85_LICENCE_ON = false;\n",
"""var D85_LICENCE_ON = false;
// D91 (V199) licence switch, same mechanism and same expiry discipline as D85 above. True
// only while the baseline handed in is V198 and only on the wide lattice; at V200 the
// baseline is V199, the displacement is already inside it, and every D91 exception in this
// file goes dark without an edit.
var D91_LICENCE_ON = false;
""",
"1 declare D91_LICENCE_ON")

# ── 2. arm it from the baseline's own ia-version, nowhere else ──────────────
rep(
"  D85_LICENCE_ON = (String(BASE_VER) === '197' && !USE_FULL);\n",
"""  D85_LICENCE_ON = (String(BASE_VER) === '197' && !USE_FULL);
  // D91 (V199): armed HERE and nowhere else, from the baseline's own ia-version. No env
  // var, no flag, no argument. The only way to arm it is to hand this gate a V198 artifact,
  // which stops being a thing anyone does after V199 ships.
  D91_LICENCE_ON = (String(BASE_VER) === '198' && !USE_FULL);
""",
"2 arm D91_LICENCE_ON")

# ── 3. the hand-typed tables ────────────────────────────────────────────────
rep(
"const V197_PREHAB_OTHER_SUM  = 2107;                                                                                         // D85\n",
"""const V197_PREHAB_OTHER_SUM  = 2107;                                                                                         // D85

// ── D91 DISPLACEMENT LICENCE (V199) — READ THE EXPIRY NOTE BEFORE COPYING IT ──
// V199 ships D91, deload arbitration: when a deload trims the day, 'Leg superset A' (a lunge
// plus a knee-stability hold) gives way to 'Leg superset B' (the day's hinge/hip_ext). The
// swap is BY PATTERN. B3 counts prehab BY NAME, and the knee-stability hold that leaves the
// card is on B3's name list, so a ruled swap of one accessory block for another reads here
// as a prehab fall. IT IS THE SAME DEFECT A FOURTH TIME and it is D47's rail untouched
// again: _protected returns true for s.hip, _secRank returns -1, the budget loop skips those
// sections, so hip prehab is structurally unreachable and is NOT what fell. Measured on the
// final V199 artifact against the live V198 baseline, hip-section items are 3072 on 6/6
// tiers on both, unchanged. The fall is entirely inside 'Leg superset A' by name.
//
// THIS LICENCE EXPIRES BY ITSELF AND IS NOT A CARVE-OUT. It keys off BASE_VER === '198' and
// nothing else. At V200 the baseline handed in is V199, the displacement is already inside
// it, and this whole block goes dark: the bare per-tier ratchet runs again with no exception
// left in the file and nobody has to remember to delete anything. Do NOT re-point it at a
// later baseline — a fall measured against V199 is a NEW regression, not this one. Do NOT
// relax the equality to an inequality: a licence that permits "up to" hides the second
// regression that walks in behind the first. Mario was explicit, twice.
//
// WIDE LATTICE ONLY. The table is hand-typed from the D91 displacement census on the
// 288-cell sweep and is never applied under IA_LATTICE=full, for the same reason every other
// table in this file is fenced: a census applied to the wrong lattice is not a bar.
const D91_DISPLACEMENT_WIDE = { bodyweight:72, minimal:71, home_basic:64, home_full:64, commercial:64, crossfit:64 };        // D91
const D91_DISPLACEMENT_SUM  = 399;                                                                                          // D91
// The names the fall is confined to, and CONFINEMENT IS WHAT GIVES THE LICENCE TEETH: any
// prehab lost OUTSIDE this set is an unruled regression riding in on a ruled one, and it
// fails. All four live inside 'Leg superset A'. The set is the same four D85 used because
// the same two slots are being read through six equipment tiers: on tiers with a bell and a
// band the hold is 'Spanish squat hold (KB)' / 'Terminal knee extension (band)', and on
// bodyweight it substitutes to 'Wall sit' / 'Single-leg wall sit'. Per tier, measured:
//   bodyweight  Wall sit -48, Single-leg wall sit -24
//   minimal     Spanish squat hold (KB) -48, Terminal knee extension (band) -23
//   the other four tiers  Spanish squat hold (KB) -47, Terminal knee extension (band) -17
const D91_DISPLACED_NAMES = ['Spanish squat hold (KB)', 'Terminal knee extension (band)', 'Wall sit', 'Single-leg wall sit'];  // D91
""",
"3 D91 tables")

# ── 4. the licence claims, in D85's exact shape ─────────────────────────────
rep(
"""    ' — the displacement table was typed against a different artifact and cannot be applied to this one');
}
""",
"""    ' — the displacement table was typed against a different artifact and cannot be applied to this one');
}

// ── B3 (D91, LICENCE): the displacement, asserted as an equality and confined by name ──
// Same four claims D85 made, against the V198 baseline: the table's own arithmetic, the
// per-tier EQUALITY, the zero-residual confinement, and the D47 rail on the baseline side.
function d91LicenceClaims(tag, cand, base){
  const handSum = EQUIP.reduce((a,e) => a + D91_DISPLACEMENT_WIDE[e], 0);
  if (handSum === D91_DISPLACEMENT_SUM) ok('B3 ' + tag + ' (D91): the licensed displacement table sums to ' + D91_DISPLACEMENT_SUM +
    ', the ruled total (arithmetic cross-check, no engine involved)');
  else bad('B3 ' + tag + ' (D91): the licensed displacement table sums to ' + handSum + ', not the ruled ' + D91_DISPLACEMENT_SUM +
    ' — the per-tier table and the ruled total were edited apart and neither may be used');

  const off = [];
  for (const e of EQUIP){
    const want = base.tiers[e].prehab - D91_DISPLACEMENT_WIDE[e], got = cand.tiers[e].prehab;
    console.log('       D91 licensed displacement ' + e.padEnd(11) + ' V' + BASE_VER + ' ' + String(base.tiers[e].prehab).padStart(5) +
      '  -  ' + String(D91_DISPLACEMENT_WIDE[e]).padStart(3) + '  =  ' + String(want).padStart(5) + '   candidate ' + String(got).padStart(5) +
      (got === want ? '   exact' : '   OFF BY ' + (got-want>=0?'+':'') + (got-want)));
    if (got !== want) off.push(e + ' want ' + want + ' got ' + got + ' (' + (got-want>=0?'+':'') + (got-want) + ')');
  }
  if (!off.length) ok('B3 ' + tag + ' (D91): prehab is EXACTLY the V' + BASE_VER + ' census minus the licensed displacement on ' +
    EQUIP.length + '/' + EQUIP.length + ' tiers (equality, not a bound: the licence buys the ruled ' + D91_DISPLACEMENT_SUM + ' items and not one more)');
  else bad('B3 ' + tag + ' (D91): prehab does not equal V' + BASE_VER + ' minus the licensed displacement on ' + off.length + '/' + EQUIP.length +
    ' tiers: ' + off.join(', ') + ' — a fall larger than the licence is an unruled regression, and a fall smaller than it means the ruled table is no longer the truth');

  const resid = [];
  let residN = 0;
  for (const e of EQUIP){
    const bN = base.tiers[e].prehabName || {}, cN = cand.tiers[e].prehabName || {};
    let r = 0; const who = [];
    for (const n of Object.keys(bN)){
      if (D91_DISPLACED_NAMES.indexOf(n) >= 0) continue;
      const d = bN[n] - (cN[n]||0);
      if (d > 0){ r += d; who.push(n + ' -' + d); }
    }
    if (r){ residN += r; resid.push(e + ' ' + r + ' [' + who.join('; ') + ']'); }
  }
  console.log('       D91 confinement [' + tag + '] prehab lost OUTSIDE [' + D91_DISPLACED_NAMES.join(', ') + ']: ' + residN + ' items');
  if (!resid.length) ok('B3 ' + tag + ' (D91 CONFINEMENT): the fall is confined to the ' + D91_DISPLACED_NAMES.length +
    ' licensed names — 0 prehab items lost outside them on ' + EQUIP.length + '/' + EQUIP.length + ' tiers');
  else bad('B3 ' + tag + ' (D91 CONFINEMENT): ' + residN + ' prehab items lost OUTSIDE the licensed names on ' + resid.length + '/' + EQUIP.length +
    ' tiers: ' + resid.join(' ; ') + ' — the licence covers one accessory block by name, nothing else, and this is an unruled regression riding in behind a ruled one');

  const railOff = EQUIP.filter(e => base.tiers[e].prehabHip !== D47_RAIL_PER_TIER);
  if (!railOff.length) ok('B3 ' + tag + ' (D91): the V' + BASE_VER + ' baseline carries the transcribed D47 rail of ' + D47_RAIL_PER_TIER +
    ' hip-section items on ' + EQUIP.length + '/' + EQUIP.length + ' tiers (the number the licence was measured against)');
  else bad('B3 ' + tag + ' (D91): the V' + BASE_VER + ' baseline hip-section census disagrees with the transcribed ' + D47_RAIL_PER_TIER +
    ' on ' + railOff.map(e => e + ' ' + base.tiers[e].prehabHip).join(', ') +
    ' — the displacement table was typed against a different artifact and cannot be applied to this one');
}
""",
"4 d91LicenceClaims")

# ── 5. wire the branch, D85 first, D91 second, bare ratchet otherwise ───────
rep(
"""    if (D85_LICENCE_ON && tag === 'wide'){
      d85LicenceClaims(tag, cand, base);
    }
""",
"""    if (D85_LICENCE_ON && tag === 'wide'){
      d85LicenceClaims(tag, cand, base);
    }
    // D91 (V199): on the wide lattice against the V198 baseline the bare ratchet below is
    // known-red by ruling, and the licence takes its place — same axis, stricter shape
    // (equality plus zero-residual confinement, where the ratchet was a one-sided bound).
    // Every other combination, including the narrow sweep and every baseline that is not
    // V198, runs the ratchet untouched. When BASE_VER stops being '198' this branch
    // disappears on its own and nothing has to be deleted by hand.
    else if (D91_LICENCE_ON && tag === 'wide'){
      d91LicenceClaims(tag, cand, base);
    }
""",
"5 wire D91 branch")

assert src != orig, 'no change produced'
io.open(P, 'w', encoding='utf-8').write(src)
print('OK 5/5 anchors applied to ' + P)
