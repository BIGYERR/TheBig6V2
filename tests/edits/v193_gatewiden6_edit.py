#!/usr/bin/env python3
# V193 gate widening, part 6 — g193_budget_floor.js only. Does NOT touch index.html.
#
# BUG FOUND BY RUNNING IA_LATTICE=full: the two hand-transcribed V192 censuses are typed
# against the 288-cell WIDE lattice, and part 5 let the FULL run apply them anyway. The gate
# then reported two failures that say nothing about the artifact — "baseline claims v192 but
# its prehab census disagrees with the hand table, live 11388 vs table 3775" is a table
# applied to the wrong population, which is the precise error this whole widening exists to
# stop, committed by the gate itself. The gate's own header already says "Do not cross them:
# the same engine gives different numbers on different lattices."
#
# FIX: the cross-check runs only when the lattice it was transcribed against is the lattice
# in use. Under IA_LATTICE=full it prints an info line saying so. The DIFFERENTIAL claims are
# untouched and still run on whichever lattice is selected — they are taken against the live
# baseline, which is measured on the same cells as the candidate, so they are lattice-safe by
# construction. Only the transcription cross-check is lattice-bound.
#
# Anchors asserted count==1 before writing.

import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read(); orig = src
reps = [
(
"""function prehabClaim(tag, cand, base, handTable){
  const basePrehab = {};
  for (const e of EQUIP) basePrehab[e] = base ? base.tiers[e].prehab : handTable[e];
  if (base && BASE_VER === '192'){""",
"""function prehabClaim(tag, cand, base, handTable, tableApplies){
  const basePrehab = {};
  for (const e of EQUIP) basePrehab[e] = (base && !(!tableApplies && !base)) ? base.tiers[e].prehab : handTable[e];
  if (base && !tableApplies){
    info('B3 ' + tag + ': hand-table cross-check skipped — the table was transcribed against the ' +
      LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The delta below is taken against the live baseline on the SAME cells, so it stands.');
  } else if (base && BASE_VER === '192'){""",
'B3 table gating'),
(
"""prehabClaim('wide', CAND, BASE, V192_PREHAB_WIDE);
prehabClaim('narrow', CAND_N, BASE_N, V192_PREHAB_NARROW);""",
"""prehabClaim(USE_FULL ? 'full' : 'wide', CAND, BASE, V192_PREHAB_WIDE, !USE_FULL);
prehabClaim('narrow', CAND_N, BASE_N, V192_PREHAB_NARROW, true);""",
'B3 call sites'),
(
"""    if (BASE_VER === '192'){
      const mism = EQUIP.filter(e => baseNon[e] !== V192_NONOPT_WIDE[e]);
      if (!mism.length) ok('B4 live V192 baseline agrees with the hand-transcribed WIDE non-optional-deletion table on all six tiers');
      else bad('B4 baseline claims v192 but its wide non-optional deletions disagree with the hand table on: ' +
        mism.map(e => e+' live '+baseNon[e]+' vs table '+V192_NONOPT_WIDE[e]).join(', '));""",
"""    if (BASE_VER === '192' && USE_FULL){
      info('B4 hand-table cross-check on the wide sweep skipped — the table was transcribed against the ' +
        LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The narrow cross-check below still runs, and the differential is against the live baseline on the same cells.');
      const BN0 = tally(BASE_N_OFF, BASE_N);
      const mismN0 = EQUIP.filter(e => BN0.perTier[e].non !== V192_NONOPT_NARROW[e]);
      if (!mismN0.length) ok('B4 baseline still agrees with the historical NARROW table (the 30-build sweep the old gate used)');
      else bad('B4 baseline disagrees with the historical narrow table on: ' + mismN0.map(e => e+' live '+BN0.perTier[e].non+' vs table '+V192_NONOPT_NARROW[e]).join(', '));
    } else if (BASE_VER === '192'){
      const mism = EQUIP.filter(e => baseNon[e] !== V192_NONOPT_WIDE[e]);
      if (!mism.length) ok('B4 live V192 baseline agrees with the hand-transcribed WIDE non-optional-deletion table on all six tiers');
      else bad('B4 baseline claims v192 but its wide non-optional deletions disagree with the hand table on: ' +
        mism.map(e => e+' live '+baseNon[e]+' vs table '+V192_NONOPT_WIDE[e]).join(', '));""",
'B4 table gating'),
]
for old, new, tag in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d (want 1)\n' % (tag, n)); sys.exit(1)
    src = src.replace(old, new, 1)
if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('OK %d replacements' % len(reps))
