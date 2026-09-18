#!/usr/bin/env python3
# V198 (D85) gate slice 1: g193_budget_floor.js
#   1. census() collects the prehab count split two ways (hip:true vs by-name)
#   2. census() item loop feeds that split
#   3. B3 gets the D85 displacement licence (equality + confinement) and the permanent D47 rail claim
#   4. B4c gets the D85 class licence, the two counter-claims, and the failure-text fix
# index.html is NOT touched by this script. ia-version stays 198.
import io, sys, os

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
F = os.path.join(ROOT, 'tests', 'gates', 'g193_budget_floor.js')
src = io.open(F, encoding='utf-8').read()
orig = src
reps = []


def rep(old, new, tag):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ANCHOR MISS [%s]: count==%d, expected 1\n' % (tag, n))
        sys.exit(2)
    src = src.replace(old, new)
    reps.append(tag)


# ── 1. per-tier accumulators ───────────────────────────────────────────────
rep(
    "  for (const e of EQUIP) out.tiers[e] = { coreSec:0, thinCore:0, emptySec:0, emptyDetail:[], sections:0, items:0, prehab:0, optSec:0, nonOptSec:0 };",
    "  for (const e of EQUIP) out.tiers[e] = { coreSec:0, thinCore:0, emptySec:0, emptyDetail:[], sections:0, items:0, prehab:0, prehabHip:0, prehabName:{}, optSec:0, nonOptSec:0 };",
    'census tier init',
)

# ── 2. the split itself ────────────────────────────────────────────────────
rep(
    "          for (const it of (s.items||[])) if (isPrehabItem(s.hip, clean(it.name))) T.prehab++;",
    """          for (const it of (s.items||[])){
            // D85 (V198): the SAME prehab total, split by the two lenses that disagree.
            // isPrehabItem is true for an item in a hip:true section OR for a name on the
            // prehab list. D47's rail protects the first lens (by SECTION); B3 counts the
            // second (by NAME). A fall in one is not a fall in the other, and the licence
            // below can only say WHERE a fall landed if the census keeps them apart.
            const nm = clean(it.name);
            if (!isPrehabItem(s.hip, nm)) continue;
            T.prehab++;
            if (s.hip) T.prehabHip++;
            else T.prehabName[nm] = (T.prehabName[nm]||0) + 1;
          }""",
    'census prehab split',
)

# ── 3. B3: the D85 licence tables + claim functions ────────────────────────
rep(
    """// ── B3: prehab delta vs V192, on both lattices ─────────────────────────────
function prehabClaim(tag, cand, base, handTable, tableApplies){""",
    """// ── D85 DISPLACEMENT LICENCE (V198) — READ THE EXPIRY NOTE BEFORE COPYING IT ──
// V198 ships D85, the posterior floor: the day's LAST hinge/hip_ext is not budget fodder.
// Protecting it DISPLACES the trim onto the next thing the budget can still reach, and on
// the wide lattice that is four knee-prehab NAMES living inside 'Leg superset A', a rank-1
// accessory section. This is not D47's rail giving way. _protected returns true for s.hip
// and for /hip|mobility|stretch/, _secRank returns -1, and the budget loop skips those
// sections entirely, so the budget structurally cannot reach a hip-prehab section. B3
// counts prehab BY NAME, D47 protects prehab BY SECTION: two lenses on one word, and the
// 661-item fall is the gap between them. Coach ruled the DISPLACEMENT licensed. The RAIL
// was not relaxed and is asserted below as an equality that never expires.
//
// THIS LICENCE EXPIRES BY ITSELF AND IS NOT A CARVE-OUT. It keys off BASE_VER === '197'
// and nothing else. At V199 the baseline handed in is V198, the displacement is already
// inside it, and this whole block goes dark: the bare per-tier ratchet runs again with no
// exception left in the file and nobody has to remember to delete anything. Do NOT
// re-point it at a later baseline — a fall measured against V198 is a NEW regression, not
// this one. Do NOT relax the equality to an inequality: a licence that permits "up to"
// hides the second regression that walks in behind the first. Mario was explicit.
//
// WIDE LATTICE ONLY. The table is hand-typed from coach's D85 displacement census on the
// 288-cell sweep and is never applied under IA_LATTICE=full, for the same reason every
// other table in this file is fenced: a census applied to the wrong lattice is not a bar.
const D85_DISPLACEMENT_WIDE = { bodyweight:97, minimal:121, home_basic:126, home_full:107, commercial:103, crossfit:107 };   // D85
const D85_DISPLACEMENT_SUM  = 661;                                                                                          // D85
// The four names the fall is confined to. CONFINEMENT IS WHAT GIVES THE LICENCE TEETH:
// the licence says these four moved, so any prehab lost OUTSIDE them is an unruled
// regression riding in on a ruled one, and it fails.
const D85_DISPLACED_NAMES = ['Spanish squat hold (KB)', 'Terminal knee extension (band)', 'Wall sit', 'Single-leg wall sit'];  // D85
// D47's rail, per tier, on the wide lattice. Items inside hip:true sections.
const D47_RAIL_PER_TIER = 3072;                                                                                             // D47

// ── B3 (D47, PERMANENT): items inside hip:true sections are EQUAL on both artifacts ──
// Not licence-bound and it does not expire. D47's rail is the thing the displacement
// licence exists to defend, so from V198 on it is asserted as a rail and not inferred from
// an aggregate that a by-name fall can move underneath it.
function railClaim(tag, cand, base){
  const off = [], perTier = [];
  for (const e of EQUIP){
    const c = cand.tiers[e].prehabHip, b = base.tiers[e].prehabHip;
    perTier.push(e + ' ' + b + ' -> ' + c);
    if (c !== b) off.push(e + ' ' + b + ' -> ' + c + ' (' + (c-b>=0?'+':'') + (c-b) + ')');
  }
  console.log('       D47 rail [' + tag + '] items inside hip:true sections: ' + perTier.join(', '));
  if (!off.length) ok('B3 ' + tag + ' (D47 RAIL, permanent): items inside hip:true sections are EQUAL on the candidate and V' + BASE_VER +
    ' on ' + EQUIP.length + '/' + EQUIP.length + ' tiers — the budget cannot reach a protected section and did not');
  else bad('B3 ' + tag + ' (D47 RAIL, permanent): items inside hip:true sections MOVED vs V' + BASE_VER + ' on ' + off.length + '/' + EQUIP.length +
    ' tiers: ' + off.join(', ') + ' — this is the rail itself, not the licensed displacement, and no licence covers it');
}

// ── B3 (D85, LICENCE): the displacement, asserted as an equality and confined by name ──
function d85LicenceClaims(tag, cand, base){
  const handSum = EQUIP.reduce((a,e) => a + D85_DISPLACEMENT_WIDE[e], 0);
  if (handSum === D85_DISPLACEMENT_SUM) ok('B3 ' + tag + ' (D85): the licensed displacement table sums to ' + D85_DISPLACEMENT_SUM +
    ', the ruled total (arithmetic cross-check, no engine involved)');
  else bad('B3 ' + tag + ' (D85): the licensed displacement table sums to ' + handSum + ', not the ruled ' + D85_DISPLACEMENT_SUM +
    ' — the per-tier table and the ruled total were edited apart and neither may be used');

  const off = [];
  for (const e of EQUIP){
    const want = base.tiers[e].prehab - D85_DISPLACEMENT_WIDE[e], got = cand.tiers[e].prehab;
    console.log('       D85 licensed displacement ' + e.padEnd(11) + ' V' + BASE_VER + ' ' + String(base.tiers[e].prehab).padStart(5) +
      '  -  ' + String(D85_DISPLACEMENT_WIDE[e]).padStart(3) + '  =  ' + String(want).padStart(5) + '   candidate ' + String(got).padStart(5) +
      (got === want ? '   exact' : '   OFF BY ' + (got-want>=0?'+':'') + (got-want)));
    if (got !== want) off.push(e + ' want ' + want + ' got ' + got + ' (' + (got-want>=0?'+':'') + (got-want) + ')');
  }
  if (!off.length) ok('B3 ' + tag + ' (D85): prehab is EXACTLY the V' + BASE_VER + ' census minus the licensed displacement on ' +
    EQUIP.length + '/' + EQUIP.length + ' tiers (equality, not a bound: the licence buys the ruled ' + D85_DISPLACEMENT_SUM + ' items and not one more)');
  else bad('B3 ' + tag + ' (D85): prehab does not equal V' + BASE_VER + ' minus the licensed displacement on ' + off.length + '/' + EQUIP.length +
    ' tiers: ' + off.join(', ') + ' — a fall larger than the licence is an unruled regression, and a fall smaller than it means the ruled table is no longer the truth');

  const resid = [];
  let residN = 0;
  for (const e of EQUIP){
    const bN = base.tiers[e].prehabName || {}, cN = cand.tiers[e].prehabName || {};
    let r = 0; const who = [];
    for (const n of Object.keys(bN)){
      if (D85_DISPLACED_NAMES.indexOf(n) >= 0) continue;
      const d = bN[n] - (cN[n]||0);
      if (d > 0){ r += d; who.push(n + ' -' + d); }
    }
    if (r){ residN += r; resid.push(e + ' ' + r + ' [' + who.join('; ') + ']'); }
  }
  console.log('       D85 confinement [' + tag + '] prehab lost OUTSIDE [' + D85_DISPLACED_NAMES.join(', ') + ']: ' + residN + ' items');
  if (!resid.length) ok('B3 ' + tag + ' (D85 CONFINEMENT): the fall is confined to the ' + D85_DISPLACED_NAMES.length +
    ' licensed names — 0 prehab items lost outside them on ' + EQUIP.length + '/' + EQUIP.length + ' tiers');
  else bad('B3 ' + tag + ' (D85 CONFINEMENT): ' + residN + ' prehab items lost OUTSIDE the licensed names on ' + resid.length + '/' + EQUIP.length +
    ' tiers: ' + resid.join(' ; ') + ' — the licence covers four names on one section, nothing else, and this is an unruled regression riding in behind a ruled one');

  const railOff = EQUIP.filter(e => base.tiers[e].prehabHip !== D47_RAIL_PER_TIER);
  if (!railOff.length) ok('B3 ' + tag + ' (D85): the V' + BASE_VER + ' baseline carries the transcribed D47 rail of ' + D47_RAIL_PER_TIER +
    ' hip-section items on ' + EQUIP.length + '/' + EQUIP.length + ' tiers (the number the licence was measured against)');
  else bad('B3 ' + tag + ' (D85): the V' + BASE_VER + ' baseline hip-section census disagrees with the transcribed ' + D47_RAIL_PER_TIER +
    ' on ' + railOff.map(e => e + ' ' + base.tiers[e].prehabHip).join(', ') +
    ' — the displacement table was typed against a different artifact and cannot be applied to this one');
}

// ── B3: prehab delta vs V192, on both lattices ─────────────────────────────
function prehabClaim(tag, cand, base, handTable, tableApplies){""",
    'B3 licence tables + claims',
)

# ── 3b. dispatch: licence replaces the bare ratchet, rail runs either way ───
rep(
    "    if (!belowBase.length) ok('B3 ' + tag + ': prehab is at or above the live V' + BASE_VER + ' baseline on '",
    """    railClaim(tag, cand, base);
    // D85 (V198): on the wide lattice against the V197 baseline the bare ratchet below is
    // known-red by ruling, and the licence takes its place — same axis, stricter shape
    // (equality plus confinement, where the ratchet was a one-sided bound). Every other
    // combination, including the narrow sweep and every baseline that is not V197, runs the
    // ratchet untouched. When BASE_VER stops being '197' this branch disappears on its own.
    if (D85_LICENCE_ON && tag === 'wide'){
      d85LicenceClaims(tag, cand, base);
    }
    else if (!belowBase.length) ok('B3 ' + tag + ': prehab is at or above the live V' + BASE_VER + ' baseline on '""",
    'B3 licence dispatch',
)

# ── 3c. the licence switch, declared once, next to the lattice switch ──────
rep(
    "const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';",
    """const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';
// D85 (V198) licence switch. Read the long note above prehabClaim before touching it. It is
// true only while the baseline handed in is V197 and only on the wide lattice; at V199 the
// baseline is V198 and every D85 exception in this file goes dark without an edit.
var D85_LICENCE_ON = false;""",
    'licence switch declaration',
)

# ── 3d. the licence switch is set once, where BASE_VER becomes known ──────
rep(
    "  IB_BASE = load(BASEFILE); BASE_VER = IB_BASE.version;",
    """  IB_BASE = load(BASEFILE); BASE_VER = IB_BASE.version;
  // D85 (V198): the licence is armed HERE and nowhere else, from the baseline's own
  // ia-version. No env var, no flag, no argument: the only way to arm it is to hand this
  // gate a V197 artifact, which stops being a thing anyone does after V198 ships.
  D85_LICENCE_ON = (String(BASE_VER) === '197' && !USE_FULL);""",
    'licence switch armed from BASE_VER',
)

# ── 4. B4c: class licence, oracle-honest failure text, counter-claims ──────
rep(
    """  const allowed = baseKinds ? Object.keys(baseKinds) : Object.keys(V192_NONOPT_CLASSES_WIDE);
  const newKinds = Object.keys(C.kinds).filter(k => allowed.indexOf(k) < 0);
  if (!newKinds.length) ok('B4c the budget empties no non-optional class V192 left alone (' + Object.keys(C.kinds).length + ' classes, all within the ' + allowed.length + ' V192 emptied)');
  else bad('B4c the budget emptied non-optional section classes V192 never touched: ' + newKinds.join(', '));""",
    """  const allowed = baseKinds ? Object.keys(baseKinds) : Object.keys(V192_NONOPT_CLASSES_WIDE);
  // WHICH ORACLE ACTUALLY RAN (V198). `allowed` is the LIVE baseline's class list whenever a
  // baseline is supplied and the hand-transcribed V192 census only when one is not. The old
  // failure text said "classes V192 never touched" on both branches, which is false on every
  // ship invocation: V192 emptied 'Leg' 8 times on this lattice and V192_NONOPT_CLASSES_WIDE
  // two hundred lines up says so. The claim now names the oracle it ran against. WHAT IS
  // TESTED IS UNCHANGED — only what it claims. Same species as the g196_ledger G5 naming
  // defect in §12.
  const oracleName = baseKinds
    ? 'the live baseline ' + path.basename(BASEFILE) + ' (v' + BASE_VER + ')'
    : 'the hand-transcribed V192 wide class census';
  // ── D85 CLASS LICENCE (V198) ───────────────────────────────────────────────
  // 'Leg' is a class the live V197 baseline never empties, so under D85 it reads as new
  // fodder. It is not new to the app and it is not new to the ruling: V192 emptied it 8
  // times on this same lattice, and the posterior floor displaces the trim onto whatever
  // the budget can still reach, which on some cells is a bare 'Leg' section. The class is
  // licensed AT ITS RULED COUNT and is NOT widened silently — 18 emptyings, asserted as an
  // equality, not "'Leg' is now allowed". Expires by itself: at V199 the baseline is V198,
  // which empties 'Leg', so the class is in `allowed` and this exception is already inert.
  const D85_NEW_CLASSES_WIDE = { 'Leg': 18 };                                  // D85, against V192's own 8
  const D85_LICENSED_CLS = D85_LICENCE_ON ? Object.keys(D85_NEW_CLASSES_WIDE) : [];
  const newKinds = Object.keys(C.kinds).filter(k => allowed.indexOf(k) < 0 && D85_LICENSED_CLS.indexOf(k) < 0);
  if (!newKinds.length) ok('B4c the budget empties no non-optional class outside ' + oracleName + ' (' + Object.keys(C.kinds).length +
    ' classes, all within the ' + allowed.length + ' that oracle emptied' +
    (D85_LICENSED_CLS.length ? ' plus the D85-licensed [' + D85_LICENSED_CLS.join(', ') + ']' : '') + ')');
  else bad('B4c the budget emptied non-optional section classes ' + oracleName + ' never touched: ' + newKinds.join(', '));
  if (D85_LICENCE_ON){
    const wrongCls = Object.keys(D85_NEW_CLASSES_WIDE).filter(k => (C.kinds[k]||0) !== D85_NEW_CLASSES_WIDE[k]);
    const shape = Object.keys(D85_NEW_CLASSES_WIDE).map(k => '"' + k + '" V192 ' + (V192_NONOPT_CLASSES_WIDE[k]||0) +
      ', V' + BASE_VER + ' ' + ((baseKinds && baseKinds[k])||0) + ', ruled ' + D85_NEW_CLASSES_WIDE[k] + ', live ' + (C.kinds[k]||0)).join('; ');
    console.log('       D85 licensed class census: ' + shape);
    if (!wrongCls.length) ok('B4c1 (D85): the licensed class census is EXACTLY the ruled count — ' + shape +
      '. The licence is a number, not a permission: one more emptying than ruled fails here');
    else bad('B4c1 (D85): the licensed class census is not the ruled count on ' + wrongCls.join(', ') + ' — ' + shape +
      '. D85 licensed a measured count; a larger one is a different, unruled fact');
  } else {
    na('B4c1 (D85): the licensed non-optional class census equals its ruled count',
      'the D85 class licence is keyed to a V197 baseline on the wide lattice and this run is neither, so the bare B4c novelty test above is the whole claim');
  }
  // ── D85 COUNTER-CLAIMS: class novelty measured against a denominator ────────
  // A new class in the deletion census only matters if the census GREW. Both of these MUST
  // FALL and both are strict: `<=` passes a version that changed nothing.
  // Ruled figures, coach's D85 census: total non-optional emptyings 5,649 -> 5,147 and
  // leg-family emptyings 896 -> 394. Coach's two candidate-side aggregates were taken with
  // the 'Leg' class OUT, which is the class B4c licenses immediately above; the live tally
  // here counts it IN, so both read exactly 18 higher. That gap is not left to be
  // rediscovered next session — it is asserted below as an identity, which pins the ruled
  // numbers, the live numbers and the licensed 'Leg' count to each other in one line.
  const D85_RULED_TOTAL  = { base: 5649, cand: 5147 };                         // D85
  const D85_RULED_LEGFAM = { base: 896,  cand: 394  };                         // D85
  const D85_LEG_FAMILY   = ['Leg superset A', 'Leg superset B', 'Leg'];        // D85
  if (D85_LICENCE_ON && baseKinds){
    const legC = D85_LEG_FAMILY.reduce((a,k) => a + (C.kinds[k]||0), 0);
    const legB = D85_LEG_FAMILY.reduce((a,k) => a + (baseKinds[k]||0), 0);
    const legPer = D85_LEG_FAMILY.map(k => k + ' ' + (baseKinds[k]||0) + ' -> ' + (C.kinds[k]||0)).join(', ');
    console.log('       D85 counter-claims: total non-optional emptyings ' + totB + ' -> ' + totC +
      ' (ruled ' + D85_RULED_TOTAL.base + ' -> ' + D85_RULED_TOTAL.cand + '), leg family ' + legB + ' -> ' + legC +
      ' (ruled ' + D85_RULED_LEGFAM.base + ' -> ' + D85_RULED_LEGFAM.cand + '); per class ' + legPer);
    if (totC < totB) ok('B4c2 (D85): total non-optional section emptyings FELL strictly vs ' + oracleName + ': ' + totB + ' -> ' + totC +
      ' (' + (totC-totB) + '). The new class is composition inside a shrinking census, not new loss');
    else bad('B4c2 (D85): total non-optional section emptyings did not fall strictly vs ' + oracleName + ': ' + totB + ' -> ' + totC +
      ' — D85 claims the floor costs the budget a displacement, not a bigger appetite');
    if (legC < legB) ok('B4c3 (D85): leg-family section emptyings [' + D85_LEG_FAMILY.join(', ') + '] FELL strictly vs ' + oracleName +
      ': ' + legB + ' -> ' + legC + ' (' + (legC-legB) + '), with the licensed class counted IN. ' + legPer);
    else bad('B4c3 (D85): leg-family section emptyings did not fall strictly vs ' + oracleName + ': ' + legB + ' -> ' + legC +
      ' (' + legPer + ') — the licensed class is not being paid for by the family it belongs to');
    const okTot = (totB === D85_RULED_TOTAL.base) && (totC - (C.kinds['Leg']||0) === D85_RULED_TOTAL.cand);
    const okLeg = (legB === D85_RULED_LEGFAM.base) && (legC - (C.kinds['Leg']||0) === D85_RULED_LEGFAM.cand);
    if (okTot && okLeg) ok('B4c4 (D85): the live census reconciles with the ruled figures exactly through the licensed class — ' +
      totC + ' - ' + (C.kinds['Leg']||0) + ' = ' + D85_RULED_TOTAL.cand + ' and ' + legC + ' - ' + (C.kinds['Leg']||0) + ' = ' + D85_RULED_LEGFAM.cand +
      ', baselines ' + totB + ' and ' + legB + ' unchanged');
    else bad('B4c4 (D85): the live census does NOT reconcile with the ruled figures through the licensed class — live ' + totB + ' -> ' + totC +
      ' and ' + legB + ' -> ' + legC + ', licensed class ' + (C.kinds['Leg']||0) + ', ruled ' + D85_RULED_TOTAL.base + ' -> ' + D85_RULED_TOTAL.cand +
      ' and ' + D85_RULED_LEGFAM.base + ' -> ' + D85_RULED_LEGFAM.cand + '. One of the two censuses is not the one D85 was ruled on');
  } else {
    na('B4c2/B4c3/B4c4 (D85): the two counter-claims (total and leg-family non-optional emptyings both fall) and their reconciliation with the ruled figures',
      baseKinds ? 'the D85 counter-claims are keyed to a V197 baseline on the wide lattice and this run is not that pair'
                : 'no baseline file supplied, so there is no census to fall from');
  }""",
    'B4c licence + counter-claims + oracle-honest text',
)

if src == orig:
    sys.stderr.write('NO CHANGE WRITTEN\n')
    sys.exit(2)
io.open(F, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d replacements)' % (F, len(reps)))
for t in reps:
    print('  - ' + t)
