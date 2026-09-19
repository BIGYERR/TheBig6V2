#!/usr/bin/env python3
# V198 TOOLING PASS, slice B of 3 — follow-up to v198_tooling_b_g193_b4g.py.
# Four copy defects in the text B4g EMITS, found by running all six invocations. No claim,
# no bar and no number changes here; only the sentences the gate prints.
#   1/2. baseSrc already reads "the live baseline <file>", so 'the live ' + baseSrc printed
#        "the live live baseline base_V197.html" in the B4g1 pass and fail lines.
#   3.   B4g1's fail line asserted the rise was "under the pinned V197 ceiling". When BOTH
#        bars trip (the regression mutant: 896 -> 1488 against a ceiling of 896) that
#        sentence is false. A failure message that states a falsehood is a failure message
#        nobody can act on.
#   4.   The no-baseline DEFER reason computed headroom as SUM - cSum and printed "-592 of
#        headroom" on the mutant. Headroom below a ceiling is not negative; print both
#        numbers instead of a signed difference dressed as a quantity.
# NOT an app change. index.html is NOT touched and ia-version stays 198.
import io, sys

P = 'tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read()
BEFORE = src
reps = []

reps.append((
  """      if (cSum <= bSum) ok('B4g1 (D81, RATCHET): leg-compound section emptyings are at or below the live ' + baseSrc + ': ' +""",
  """      if (cSum <= bSum) ok('B4g1 (D81, RATCHET): leg-compound section emptyings are at or below ' + baseSrc + ': ' +""",
  'B4g1 pass line: "the live live baseline" -> baseSrc alone'))

reps.append((
  """      else bad('B4g1 (D81, RATCHET): leg-compound section emptyings ROSE vs the live ' + baseSrc + ': ' + bSum + ' -> ' + cSum +
        ' (+' + (cSum - bSum) + ') — under the pinned V197 ceiling, and still a regression against the version this one ships after');""",
  """      else bad('B4g1 (D81, RATCHET): leg-compound section emptyings ROSE vs ' + baseSrc + ': ' + bSum + ' -> ' + cSum +
        ' (+' + (cSum - bSum) + ') — this is the bar that tracks the release, so a rise fails here whatever the pinned V197 ceiling (' +
        V197_LEG_COMPOUND_SUM + ') has to say about it');""",
  'B4g1 fail line: "the live live baseline", and it no longer claims the rise is under the pinned ceiling'))

reps.append((
  """    else na('B4g1 (D81, RATCHET): leg-compound section emptyings at or below the live baseline',
      'no baseline file supplied; the pinned V197 census ceiling above runs in its place, which is coarser by the ' +
      (V197_LEG_COMPOUND_SUM - cSum) + ' of headroom the candidate currently holds');""",
  """    else na('B4g1 (D81, RATCHET): leg-compound section emptyings at or below the live baseline',
      'no baseline file supplied; the pinned V197 census ceiling (' + V197_LEG_COMPOUND_SUM + ') runs in its place, and it is ' +
      'coarser by the whole of the fall since V197 (this candidate: ' + cSum + ')');""",
  'B4g1 no-baseline reason: stop printing a signed difference as a quantity of headroom'))

reps.append((
  """      baseKinds ? ('the baseline supplied is v' + BASE_VER + ' on the ' + CELLS.length + '-cell ' + (USE_FULL ? 'FULL' : 'WIDE') +
        ' lattice; the pinned table is a v197 transcription on the ' + LAT.WIDE_N + '-cell WIDE lattice, so nothing on this run confirms it is still the V197 truth')""",
  """      baseKinds ? ('the baseline supplied is v' + BASE_VER + ' on the ' + CELLS.length + '-cell ' + (USE_FULL ? 'FULL' : 'WIDE') +
        ' lattice, not v197 on the ' + LAT.WIDE_N + '-cell WIDE lattice the pinned table was transcribed against, so nothing on this run confirms it is still the V197 truth')""",
  'B4g2 N/A reason: name the mismatch instead of restating the same lattice twice'))

fail = False
for old, new, tag in reps:
    n = src.count(old)
    print('  count=%d  %s' % (n, tag))
    if n != 1:
        sys.stderr.write('ANCHOR MISS (%d occurrences, wanted 1): %s\n' % (n, tag))
        fail = True
if fail:
    sys.stderr.write('ABORT: nothing written.\n')
    sys.exit(1)
for old, new, tag in reps:
    src = src.replace(old, new, 1)

assert P == 'tests/gates/g193_budget_floor.js'
assert src != BEFORE
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes, %d replacement(s))' % (P, len(BEFORE), len(src), len(reps)))
