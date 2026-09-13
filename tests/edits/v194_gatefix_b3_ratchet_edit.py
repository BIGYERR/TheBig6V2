#!/usr/bin/env python3
# V194 gate fix, second pass. Gatekeeper rejected the first pass on one named ground:
# B3 carried TWO assertions and only ONE of them was defective.
#
#   defective  : aggregate `delta > 0` vs the live baseline. A change-detector. It fails
#                V193 against itself. Removed in the first pass and it stays removed.
#   NOT defective: the PER-TIER `candidate >= baseline` comparison. That is a RATCHET. It
#                passes on both versions today and it catches a prehab regression that fits
#                inside the V192 census floor's headroom (168 to 241 items per wide tier,
#                0 to 16 per narrow). Demoting it to REPORT ONLY alongside the aggregate was
#                a ruling that SELECTS executed as a ruling that DELETES (§10b).
#
# EDIT 1  restore the per-tier live-baseline comparison as a GATED assertion, wide and narrow,
#         when and only when a baseline is supplied; DEFER BY NAME when one is not.
# EDIT 2  the wrong-version-baseline axis. Every claim that needs a V192-SPECIFIC baseline now
#         announces itself through the same named DEFER mechanism when it is not made. Three
#         sites: B3 (printed a `--` skip marker), B4 and B1b (printed NOTHING AT ALL).
#
# Touches tests/gates/g193_budget_floor.js only. index.html is byte-frozen at V194.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = open(P, encoding='utf-8').read()
orig = src

reps = []

# ── 1. the header bar description: B3 is TWO bars now, say so ──────────────────
reps.append((
'B3 header: floor + ratchet',
r'''//      typo in either cannot pass. The live-baseline delta is REPORTED, never gated — the
//      same treatment B4d and B5 already carry below.''',
r'''//      typo in either cannot pass. The AGGREGATE live-baseline delta is REPORTED, never
//      gated — the same treatment B4d and B5 already carry below. The PER-TIER live-baseline
//      comparison is a different animal and is GATED: candidate >= baseline on every tier is
//      a RATCHET, not a change-detector. It costs a version that holds prehab steady nothing
//      (V193 against V193 passes it; V194 against V193 passes it at +0 on 6/6 tiers), and it
//      catches a real regression that fits inside the floor's headroom — 168 to 241 items of
//      slack per wide tier and 0 to 16 per narrow is room enough to lose a whole draw and
//      still clear the census. Two bars, not one: the census floor is permanent and
//      version-independent, the ratchet is against the version this one ships after. The
//      ratchet is DEFERRED BY NAME when no baseline is supplied, never silently passed.'''))

# ── 2. B3: the V192 hand-table cross-check announces itself on every path ──────
reps.append((
'B3 hand-table cross-check: defer on both unmade axes',
r'''  if (base && !tableApplies){
    info('B3 ' + tag + ': hand-table cross-check skipped — the table was transcribed against the ' +
      LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The delta below is taken against the live baseline on the SAME cells, so it stands.');
  } else if (base && BASE_VER === '192'){
    const mism = EQUIP.filter(e => base.tiers[e].prehab !== handTable[e]);
    if (!mism.length) ok('B3 ' + tag + ': live V192 baseline agrees with the hand-transcribed prehab census on all six tiers');
    else bad('B3 ' + tag + ': baseline claims v192 but its prehab census disagrees with the hand table on: ' +
      mism.map(e => e+' live '+base.tiers[e].prehab+' vs table '+handTable[e]).join(', '));
  } else if (base){
    info('B3 ' + tag + ': baseline is v' + BASE_VER + ', not v192 — hand-table cross-check skipped');
  }''',
r'''  // THE V192-SPECIFIC CROSS-CHECK. This claim needs a baseline that IS V192; it cannot be
  // made against any other version and it cannot be made with no baseline at all. It used to
  // print a `--` line in those modes, which reads as commentary next to a wall of `ok`. It
  // now DEFERS BY NAME on every axis on which it is not made, same mechanism as the
  // no-baseline block above: a claim that announces nothing is indistinguishable from a claim
  // that passed, and that is the hole this whole pass exists to close.
  const XCHK = 'B3 ' + tag + ': live-baseline cross-check of the hand-transcribed V192 prehab census';
  if (base && !tableApplies){
    info('B3 ' + tag + ': hand-table cross-check skipped — the table was transcribed against the ' +
      LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The delta below is taken against the live baseline on the SAME cells, so it stands.');
    defer(XCHK, 'the census was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells, so the table is not comparable to this baseline');
  } else if (base && BASE_VER === '192'){
    const mism = EQUIP.filter(e => base.tiers[e].prehab !== handTable[e]);
    if (!mism.length) ok('B3 ' + tag + ': live V192 baseline agrees with the hand-transcribed prehab census on all six tiers');
    else bad('B3 ' + tag + ': baseline claims v192 but its prehab census disagrees with the hand table on: ' +
      mism.map(e => e+' live '+base.tiers[e].prehab+' vs table '+handTable[e]).join(', '));
  } else if (base){
    info('B3 ' + tag + ': baseline is v' + BASE_VER + ', not v192 — hand-table cross-check skipped');
    defer(XCHK, 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the hand table is still the V192 truth');
  } else {
    defer(XCHK, 'no baseline file supplied; the table is applied as the floor below but nothing on this run confirms it is still the V192 truth');
  }'''))

# ── 3. B3: the per-tier ratchet, restored as a GATED assertion ─────────────────
reps.append((
'B3 per-tier ratchet restored',
r'''  if (base){
    console.log('       REPORT ONLY \— B3 prehab vs the live baseline [' + tag + '] V' + BASE_VER + ' ' + aggB + ' -> ' + aggC +
      ' (delta ' + (aggC-aggB>=0?'+':'') + (aggC-aggB) + ' of ' + aggB + '), ' + belowBase.length + '/' + EQUIP.length + ' tiers below the live baseline' +
      (belowBase.length ? ': ' + belowBase.join(', ') : '') + '. Never gated: the gated bar is the V192 census floor above.');
    ok('B3 ' + tag + ': prehab delta vs the live baseline reported (' + aggB + ' -> ' + aggC + ', ' + belowBase.length + '/' + EQUIP.length + ' tiers down), not gated');
  } else {
    defer('B3 ' + tag + ': prehab delta vs the live baseline (REPORT ONLY)', 'no baseline file supplied');
  }''',
r'''  if (base){
    console.log('       REPORT ONLY \— B3 prehab AGGREGATE vs the live baseline [' + tag + '] V' + BASE_VER + ' ' + aggB + ' -> ' + aggC +
      ' (delta ' + (aggC-aggB>=0?'+':'') + (aggC-aggB) + ' of ' + aggB + '), ' + belowBase.length + '/' + EQUIP.length + ' tiers below the live baseline' +
      (belowBase.length ? ': ' + belowBase.join(', ') : '') + '. The AGGREGATE is never gated; the PER-TIER ratchet below is.');
    ok('B3 ' + tag + ': prehab AGGREGATE delta vs the live baseline reported (' + aggB + ' -> ' + aggC + ', ' + belowBase.length + '/' + EQUIP.length + ' tiers down), not gated');
    // THE PER-TIER RATCHET IS GATED, and it is not the aggregate delta wearing a hat. The
    // aggregate `delta > 0` was a change-detector: it fails a version that holds prehab
    // steady, V193 against V193 included. `candidate >= baseline` per tier is a ratchet:
    // holding passes, growing passes, LOSING AN ITEM ON ANY TIER FAILS. It is not redundant
    // with the V192 census floor above, because the floor's headroom is the entire V192->V193
    // growth: a regression that removes fewer items than that slack clears the floor and is
    // caught only here. tests/sabotage.py hands in no baseline, so this claim DEFERS there.
    if (!belowBase.length) ok('B3 ' + tag + ': prehab is at or above the live V' + BASE_VER + ' baseline on ' + EQUIP.length + '/' + EQUIP.length + ' tiers (the RATCHET: a loss small enough to fit inside the V192 floor headroom still fails here)');
    else bad('B3 ' + tag + ': prehab FELL vs the live V' + BASE_VER + ' baseline on ' + belowBase.length + '/' + EQUIP.length + ' tiers: ' + belowBase.join(', ') +
      ' \— still above the V192 census floor, and still a regression against the version this one ships after');
  } else {
    defer('B3 ' + tag + ': prehab AGGREGATE delta vs the live baseline (REPORT ONLY)', 'no baseline file supplied');
    defer('B3 ' + tag + ': prehab per-tier RATCHET vs the live baseline (candidate >= baseline on all ' + EQUIP.length + ' tiers)',
      'no baseline file supplied; the V192 census floor above runs in its place, which is coarser by the whole of the V192->V193 growth');
  }'''))

# ── 4. B1b: the V192 census cross-check announces itself when unmade (with a baseline) ──
reps.append((
'B1b census cross-check: defer when the baseline is not V192 / not the table lattice',
r'''      else bad('B1b the transcribed V192 off-long-run core census disagrees with the live baseline on: ' + mism.map(t => t + ' live ' + bInj[t] + ' vs table ' + V192_CORE_NONLR_WIDE[t]).join(', '));
    }''',
r'''      else bad('B1b the transcribed V192 off-long-run core census disagrees with the live baseline on: ' + mism.map(t => t + ' live ' + bInj[t] + ' vs table ' + V192_CORE_NONLR_WIDE[t]).join(', '));
    } else {
      // A baseline WAS handed in, but not one this claim can be made against. It printed
      // nothing at all before — no ok, no skip marker, no defer — which is the one thing a
      // gate may never do with a claim it did not make.
      defer('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
        BASE_VER === '192'
          ? 'the baseline is v192 but the table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells'
          : 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the fallback table is still the V192 truth');
    }'''))

# ── 5. B1b: same claim, no-baseline path ──────────────────────────────────────
reps.append((
'B1b census cross-check: defer on the no-baseline path',
r'''    if (USE_FULL){
      info('B1b no baseline and IA_LATTICE=full''',
r'''    defer('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
      'no baseline file supplied; the table is applied as a floor below but nothing on this run confirms it is still the V192 truth');
    if (USE_FULL){
      info('B1b no baseline and IA_LATTICE=full'''))

# ── 6. B4: the WIDE table cross-check announces itself on the full lattice ────
reps.append((
'B4 wide table cross-check: defer on the full-lattice skip',
r'''      info('B4 hand-table cross-check on the wide sweep skipped — the table was transcribed against the ' +
        LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The narrow cross-check below still runs, and the differential is against the live baseline on the same cells.');''',
r'''      info('B4 hand-table cross-check on the wide sweep skipped — the table was transcribed against the ' +
        LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The narrow cross-check below still runs, and the differential is against the live baseline on the same cells.');
      defer('B4 baseline-identity cross-check against the transcribed V192 WIDE non-optional-deletion table',
        'the table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells; the narrow cross-check below still runs');'''))

# ── 7. B4: both table cross-checks announce themselves on a non-V192 baseline ─
reps.append((
'B4 table cross-checks: defer when the baseline is not V192',
r'''      else bad('B4 baseline disagrees with the historical narrow table on: ' + mismN.map(e => e+' live '+BN.perTier[e].non+' vs table '+V192_NONOPT_NARROW[e]).join(', '));
    }''',
r'''      else bad('B4 baseline disagrees with the historical narrow table on: ' + mismN.map(e => e+' live '+BN.perTier[e].non+' vs table '+V192_NONOPT_NARROW[e]).join(', '));
    } else {
      // Same hole as B1b above: with a V193 baseline these two cross-checks silently did not
      // happen and nothing on the run said so. The no-baseline block defers this claim by
      // name already; the wrong-version axis now uses the identical name and mechanism.
      defer('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)',
        'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms either table is still the V192 truth');
    }'''))

for name, old, new in reps:
    n = src.count(old)
    print('anchor %-62s count=%d' % (name, n))
    if n != 1:
        sys.exit('ABORT: anchor "%s" matched %d times, expected exactly 1. No bytes written.' % (name, n))
    src = src.replace(old, new, 1)

if src == orig:
    sys.exit('ABORT: no change')
open(P, 'w', encoding='utf-8').write(src)
print('wrote %s (%d -> %d bytes, %d replacements)' % (P, len(orig), len(src), len(reps)))
