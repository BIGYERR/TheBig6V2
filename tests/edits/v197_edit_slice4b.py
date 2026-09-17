#!/usr/bin/env python3
# V197 slice 4b — g193_budget_floor.js, D81 amendment proper.
#   E1  fill V192_RULED_DEL_WIDE from the V192 artifact (harvested 4a) + sum check
#   E2  carry baseNonEx through the baseline branch
#   E3  B4 gates on the EX-CLASS per-tier ratchet; the gross table stays printed, ungated
#   E4  B4g: Leg superset A + B deletions must be STRICTLY BELOW the baseline
# index.html IS NOT TOUCHED.
import io

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(anchor, new):
    global src
    n = src.count(anchor)
    print('anchor count=%d  %r' % (n, anchor[:72]))
    assert n == 1, 'ANCHOR MISS (count=%d), aborting whole script: %r' % (n, anchor[:200])
    src = src.replace(anchor, new, 1)

# ── E1 ──────────────────────────────────────────────────────────────────────
rep("""const V192_RULED_DEL_WIDE = { bodyweight:null, minimal:null, home_basic:null, home_full:null, commercial:null, crossfit:null };
""",
"""const V192_RULED_DEL_WIDE = { bodyweight:72, minimal:72, home_basic:72, home_full:72, commercial:72, crossfit:72 };
{
  const s = Object.keys(V192_RULED_DEL_WIDE).reduce((a,k)=>a+V192_RULED_DEL_WIDE[k], 0);
  const t = RULED_DELETABLE.reduce((a,k)=>a+(V192_NONOPT_CLASSES_WIDE[k]||0), 0);
  if (s !== t) { console.error('ORACLE TYPO: V192_RULED_DEL_WIDE sums to ' + s + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + ']. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
  const miss = Object.keys(V192_RULED_DEL_WIDE).filter(k => typeof V192_RULED_DEL_WIDE[k] !== 'number');
  if (miss.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE has no number for ' + miss.join(', ')); process.exit(2); }
}
""")

# ── E2 ──────────────────────────────────────────────────────────────────────
rep("""  let baseNon = V192_NONOPT_WIDE, baseKinds = null, basePerCell = null, baseSrc = 'hand-transcribed V192 wide table';
  if (BASE_OFF && BASE){
    const B = tally(BASE_OFF, BASE);
    baseNon = {}; for (const e of EQUIP) baseNon[e] = B.perTier[e].non;
    baseKinds = B.kinds; basePerCell = B.perCell; baseSrc = 'live baseline ' + path.basename(BASEFILE);""",
"""  let baseNon = V192_NONOPT_WIDE, baseNonEx = null, baseKinds = null, basePerCell = null, baseSrc = 'hand-transcribed V192 wide table';
  if (BASE_OFF && BASE){
    const B = tally(BASE_OFF, BASE);
    baseNon = {}; for (const e of EQUIP) baseNon[e] = B.perTier[e].non;
    // D81: BOTH SIDES OR NEITHER. The baseline's own ex-class total is measured by the same
    // tally() on the same lattice, so the exclusion cannot quietly become one-sided.
    baseNonEx = {}; for (const e of EQUIP) baseNonEx[e] = B.perTier[e].nonEx;
    baseKinds = B.kinds; basePerCell = B.perCell; baseSrc = 'live baseline ' + path.basename(BASEFILE);""")

# ── E3 ──────────────────────────────────────────────────────────────────────
rep("""  let rose = [], totC = 0, totB = 0;
  for (const e of EQUIP){
    totC += C.perTier[e].non; totB += baseNon[e];
""",
"""  // D81 AMENDMENT. The per-tier RATCHET now runs on non-optional deletions EXCLUDING the
  // coach-ruled-deletable classes, on BOTH sides. The GROSS per-tier numbers are still
  // computed and still printed on every run, ungated, so nobody loses the raw shape behind
  // the exclusion — but the gross total is NOT what fails the build, because coach has
  // ruled the excluded class deletable by contract. The per-tier ratchet was NOT relaxed
  // from 792 to 861 or to any other number: V194 refused that weakening on B3 and it is
  // refused here too. The bar is still "no tier rises", on a narrower and named base.
  let roseEx = [], totCEx = 0, totBEx = 0;
  if (!baseNonEx){
    // No live baseline (every sabotage run). Fall back to the hand tables, subtracting the
    // TRANSCRIBED V192 ruled-class deletions from the TRANSCRIBED V192 totals — the same
    // exclusion on the same side of the ledger, never the candidate alone.
    baseNonEx = {}; for (const e of EQUIP) baseNonEx[e] = V192_NONOPT_WIDE[e] - V192_RULED_DEL_WIDE[e];
  }
  let rose = [], totC = 0, totB = 0;
  for (const e of EQUIP){
    totC += C.perTier[e].non; totB += baseNon[e];
    totCEx += C.perTier[e].nonEx; totBEx += baseNonEx[e];
    if (C.perTier[e].nonEx > baseNonEx[e]) roseEx.push(e + ' ' + C.perTier[e].nonEx + ' > ' + baseNonEx[e]);
""")

rep("""    if (C.perTier[e].non > baseNon[e]) rose.push(e + ' ' + C.perTier[e].non + ' > ' + baseNon[e]);
  }""",
"""    if (C.perTier[e].non > baseNon[e]) rose.push(e + ' ' + C.perTier[e].non + ' > ' + baseNon[e]);
  }
  console.log('       EX-CLASS per-tier deletion table (the ratchet B4 gates on), excluding [' + RULED_DELETABLE.join(', ') + ']:');
  for (const e of EQUIP)
    console.log('         ' + e.padEnd(11) + ' candidate ' + String(C.perTier[e].nonEx).padStart(5) +
      '   baseline ' + String(baseNonEx[e]).padStart(5) + '   delta ' + ((C.perTier[e].nonEx - baseNonEx[e]) >= 0 ? '+' : '') + (C.perTier[e].nonEx - baseNonEx[e]));
  console.log('         aggregate    candidate ' + String(totCEx).padStart(5) + '   baseline ' + String(totBEx).padStart(5) +
    '   delta ' + ((totCEx - totBEx) >= 0 ? '+' : '') + (totCEx - totBEx));
  console.log('       REPORT ONLY — GROSS (ruled-deletable classes INCLUDED) aggregate ' + totB + ' -> ' + totC +
    ' (delta ' + ((totC - totB) >= 0 ? '+' : '') + (totC - totB) + '), rose on ' + rose.length + '/' + EQUIP.length +
    ' tiers' + (rose.length ? ': ' + rose.join(', ') : '') + '. Ungated by D81, printed so the raw shape stays visible.');""")

rep("""  if (!rose.length) ok('B4 non-optional section deletions ' + totC + '/' + totB + ' vs V192 — no tier rose (6/6 tiers)');
  else bad('B4 non-optional section deletions ROSE vs V192 on ' + rose.length + '/' + EQUIP.length + ' tiers: ' + rose.join(', '));""",
"""  if (!roseEx.length) ok('B4 non-optional section deletions EXCLUDING the coach-ruled-deletable classes [' + RULED_DELETABLE.join(', ') +
    '] ' + totCEx + '/' + totBEx + ' vs ' + baseSrc + ' — no tier rose (' + EQUIP.length + '/' + EQUIP.length + ' tiers). Gross, ungated: ' + totC + '/' + totB + '.');
  else bad('B4 non-optional section deletions EXCLUDING [' + RULED_DELETABLE.join(', ') + '] ROSE vs ' + baseSrc + ' on ' +
    roseEx.length + '/' + EQUIP.length + ' tiers: ' + roseEx.join(', ') +
    ' \\— this is NOT the ruled class being trimmed, it is work nobody ruled deletable going missing');""")

# ── E4: B4g ─────────────────────────────────────────────────────────────────
rep("""  if (C.added === 0) ok('B4e the budget pass only removes, never adds (0 sections appeared in ' + C.days + ' day-builds)');""",
"""  // ── B4g (D81, GATED): the ruling's POSITIVE claim ──────────────────────────
  // D81 does not only permit a deletion, it asserts a gain: with the isolation band taking
  // the trim the way the docstring always said it would, the LEG COMPOUNDS are better
  // protected than they were. 'Leg superset A' is the lunge/knee-stability pair and
  // 'Leg superset B' is the second compound pair; both are the day's real leg work. This is
  // STRICT inequality on purpose. `<=` would pass on a version that changed nothing, and no
  // engine satisfies a strict fall by accident — it is the one claim here that cannot be met
  // by the budget simply doing less.
  const LEG_COMPOUND_CLASSES = ['Leg superset A', 'Leg superset B'];   // D81
  {
    const cSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + (C.kinds[k]||0), 0);
    const bSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + ((baseKinds ? baseKinds[k] : V192_NONOPT_CLASSES_WIDE[k])||0), 0);
    const bWho = baseKinds ? baseSrc : 'hand-transcribed V192 wide class census';
    const per = LEG_COMPOUND_CLASSES.map(k => k + ' ' + ((baseKinds ? baseKinds[k] : V192_NONOPT_CLASSES_WIDE[k])||0) + ' -> ' + (C.kinds[k]||0)).join(', ');
    console.log('       B4g leg-compound deletions: ' + per);
    if (cSum < bSum) ok('B4g leg-compound section deletions FELL strictly vs ' + bWho + ': ' + bSum + ' -> ' + cSum +
      ' (' + (cSum - bSum) + '). D81\\'s positive claim: the compounds are better protected than they were.');
    else bad('B4g leg-compound section deletions did not fall strictly vs ' + bWho + ': ' + bSum + ' -> ' + cSum +
      '. D81 claims the isolation band takes the trim SO THAT the compounds stop taking it; ' + per);
  }

  if (C.added === 0) ok('B4e the budget pass only removes, never adds (0 sections appeared in ' + C.days + ' day-builds)');""")

assert src != orig
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE ' + P)
