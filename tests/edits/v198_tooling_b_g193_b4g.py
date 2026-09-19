#!/usr/bin/env python3
# V198 TOOLING PASS, slice B of 3. §12 NEXT TOOLING PASS item 2 of 3.
# NOT an app change. index.html is NOT touched and ia-version stays 198.
#
# PROBLEM (V198 gatekeeper). g193_budget_floor's B4g demands that leg-compound section
# emptyings fall STRICTLY against the live baseline on every release. No engine falls
# strictly forever, so that bar reds a correct build the first time a release merely holds
# the gain — which is V199. Under a simulated V198-vs-V198 baseline it was the single FAIL
# (394 -> 394), an artifact of comparing a file to itself and incidentally the proof that
# B4g is not vacuous.
#
# FIX. Re-express B4g as the two-bar shape B3 already uses: a PINNED V197 census (permanent,
# WIDE only) plus a NON-STRICT live ratchet, with an arithmetic self-check on the pinned
# table and a live cross-check whenever the baseline actually is v197.
#
# MEASURED 2026-09-18 on the 288-cell WIDE lattice:
#   V192 census (hand table)      Leg superset A  478 + Leg superset B 1104 = 1582
#   V196 (baselines/V196.html)    A 321 + B 1060 = 1381
#   V197 (/tmp/base_V197.html)    A  41 + B  855 =  896   <- PINNED
#   V198 (index.html, live)       A 394 + B    0 =  394
#
# Surface: tests/gates/g193_budget_floor.js ONLY. B3, its D85 displacement licence, the
# confinement assertion, the hip:true rail claims and B4c/B4c1-B4c4 are NOT touched, and the
# D85 licence still arms only at String(BASE_VER)==='197' && !USE_FULL.
import io, sys

P = 'tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read()
BEFORE = src

reps = []
def rep(old, new, tag):
    reps.append((old, new, tag))

OLD_B4G = r'''  // ── B4g (D81, GATED): the ruling's POSITIVE claim ──────────────────────────
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
      ' (' + (cSum - bSum) + '). D81\'s positive claim: the compounds are better protected than they were.');
    else bad('B4g leg-compound section deletions did not fall strictly vs ' + bWho + ': ' + bSum + ' -> ' + cSum +
      '. D81 claims the isolation band takes the trim SO THAT the compounds stop taking it; ' + per);
  }
'''

NEW_B4G = r'''  // ── B4g (D81, GATED): the ruling's POSITIVE claim ──────────────────────────
  // D81 does not only permit a deletion, it asserts a gain: with the isolation band taking
  // the trim the way the docstring always said it would, the LEG COMPOUNDS are better
  // protected than they were. 'Leg superset A' is the lunge/knee-stability pair and
  // 'Leg superset B' is the second compound pair; both are the day's real leg work.
  //
  // RE-EXPRESSED AT V198 (tooling pass, §12 NEXT TOOLING PASS item 2 of 3). This used to be
  // `cSum < bSum` against whatever baseline was handed in, defended as "no engine satisfies
  // a strict fall by accident". That is true and it is also why the bar fails V199 BY
  // CONSTRUCTION: no engine falls strictly FOREVER either, so a ratchet that demands
  // monotonic improvement on every release reds the first correct build that merely holds
  // the gain. It was the single FAIL under a simulated V198-vs-V198 baseline (394 -> 394),
  // an artifact of comparing a file to itself, and incidentally the proof that this claim
  // is reachable and not vacuous.
  // The claim is now the TWO-BAR shape B3 already uses for prehab: a PINNED CENSUS that
  // never moves, plus a LIVE RATCHET that does. Mind the direction — an emptying is a LOSS,
  // so a floor on protection is a CEILING on deletions. Rising fails. Holding passes.
  // Falling passes.
  //
  // WHICH CENSUS IS PINNED, AND WHY NOT THE OTHER TWO. The pin is V197's 896, the count the
  // D81 claim was last measured at.
  //   * V192's 1582 (V192_NONOPT_CLASSES_WIDE: 478 + 1104) and V196's 1381 are both real
  //     numbers and both looser bars, by 686 and by 485. Neither buys anything the tighter
  //     pin does not already buy.
  //   * V198's live 394 is tighter still, and is REFUSED as a PERMANENT bar: it reds the
  //     V197-vs-V196 invocation (896 > 394), which §10b requires to stay green ("run every
  //     gate against the PREVIOUS version first"), and a bar re-typed to the newest artifact
  //     every release is the ratchet again wearing a floor's clothes. The live ratchet below
  //     holds V199 to 394 without pinning it.
  //   * 896 is already in this file as D85_RULED_LEGFAM.base, reconciled by B4c4, so the pin
  //     inherits a transcription cross-check instead of adding an unverified constant.
  //
  // WHAT THIS ADMITS THAT THE STRICT BAR CAUGHT, stated and not buried: exactly one value,
  // equality. Against V197 the old bar was cSum <= 895 and the new pair is cSum <= 896, so a
  // candidate that reverted D85 whole, back to 896, now passes HERE where it used to fail.
  // That is the ruled relaxation and nothing wider: 897 still fails, and a D85 revert is
  // still caught by name by B3's licence equality, by B4c1 and by B4c2/B4c3/B4c4.
  //
  // WIDE ONLY, like every other transcribed table in this file. On IA_LATTICE=full the
  // pinned bar is not rescaled, it is not applied at all; the ratchet is lattice-free
  // (both sides are censused on the same cells) and still runs.
  // Transcribed 2026-09-18 off /tmp/base_V197.html (ia-version 197) on the 288-cell WIDE
  // lattice. Same lattice, for the record: V192 1582, V196 1381, V197 896, V198 394.
  const LEG_COMPOUND_CLASSES = ['Leg superset A', 'Leg superset B'];                // D81
  const V197_LEG_COMPOUND_WIDE = { 'Leg superset A': 41, 'Leg superset B': 855 };   // D81, V198 tooling pass
  const V197_LEG_COMPOUND_SUM  = 896;                                               // D81, V198 tooling pass
  {
    const cSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + (C.kinds[k]||0), 0);
    const bSum = baseKinds ? LEG_COMPOUND_CLASSES.reduce((a,k) => a + (baseKinds[k]||0), 0) : null;
    const handSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + (V197_LEG_COMPOUND_WIDE[k]||0), 0);
    const handPer = LEG_COMPOUND_CLASSES.map(k => k + ' ' + (V197_LEG_COMPOUND_WIDE[k]||0)).join(' + ');
    const per = LEG_COMPOUND_CLASSES.map(k => k + ' pinned ' + (V197_LEG_COMPOUND_WIDE[k]||0) + ' -> live ' + (C.kinds[k]||0)).join(', ');
    console.log('       B4g leg-compound deletions vs the pinned V197 census: ' + per +
      ', total ' + V197_LEG_COMPOUND_SUM + ' -> ' + cSum + ' (' + (cSum - V197_LEG_COMPOUND_SUM >= 0 ? '+' : '') + (cSum - V197_LEG_COMPOUND_SUM) + ')');

    // B4g0 — the pinned table checked against itself and against the OTHER transcription of
    // the same V197 fact. Arithmetic only, no engine on either side.
    if (handSum === V197_LEG_COMPOUND_SUM && V197_LEG_COMPOUND_SUM === D85_RULED_LEGFAM.base)
      ok('B4g0 (D81): the pinned V197 leg-compound census is arithmetic, not an engine echo — ' + handPer + ' = ' +
        handSum + ', which is the constant ' + V197_LEG_COMPOUND_SUM + ' and the same number D85_RULED_LEGFAM.base carries ' +
        'for the V197 leg family (V197 empties the "Leg" class zero times, which is exactly why D85 licenses it as new)');
    else bad('B4g0 (D81): the pinned V197 leg-compound census disagrees with itself — ' + handPer + ' = ' + handSum +
      ', constant ' + V197_LEG_COMPOUND_SUM + ', D85_RULED_LEGFAM.base ' + D85_RULED_LEGFAM.base +
      '. Two transcriptions of one V197 fact disagree; one of them is wrong and neither may be used as a bar');

    // B4g — BAR 1, the pinned ceiling. Permanent, WIDE only, never re-typed per release.
    if (USE_FULL) na('B4g (D81, PINNED CEILING): leg-compound section emptyings at or below the transcribed V197 census',
      'the census was transcribed against the ' + LAT.WIDE_N + '-cell WIDE lattice and this run uses ' + CELLS.length +
      ' cells. A table applied to the wrong lattice is a lower bar, not a higher one, so it is not applied at all');
    else if (cSum <= V197_LEG_COMPOUND_SUM) ok('B4g (D81, PINNED CEILING, permanent): leg-compound section emptyings ' + cSum +
      ' are at or below the pinned V197 census ' + V197_LEG_COMPOUND_SUM + ' (' + (V197_LEG_COMPOUND_SUM - cSum) +
      ' of protection in hand). A ceiling, not a delta: holding is a pass, protecting more is a pass, emptying one more ' +
      'leg compound than V197 did is not');
    else bad('B4g (D81, PINNED CEILING, permanent): leg-compound section emptyings have RISEN to ' + cSum +
      ', above the pinned V197 census ' + V197_LEG_COMPOUND_SUM + ' (+' + (cSum - V197_LEG_COMPOUND_SUM) + '): ' + per +
      '. D81 claims the isolation band takes the trim SO THAT the compounds stop taking it, and this is the compounds taking it again');

    // B4g1 — BAR 2, the live ratchet. NON-STRICT by ruling: it is the bar that tracks the
    // release, so it must be satisfiable by a build that holds a gain it did not make.
    if (baseKinds){
      const basePer = LEG_COMPOUND_CLASSES.map(k => k + ' ' + (baseKinds[k]||0) + ' -> ' + (C.kinds[k]||0)).join(', ');
      console.log('       B4g1 live ratchet vs ' + baseSrc + ': ' + basePer + ', total ' + bSum + ' -> ' + cSum +
        ' (' + (cSum - bSum >= 0 ? '+' : '') + (cSum - bSum) + ')');
      if (cSum <= bSum) ok('B4g1 (D81, RATCHET): leg-compound section emptyings are at or below the live ' + baseSrc + ': ' +
        bSum + ' -> ' + cSum + '. NON-STRICT on purpose: holding the gain is a pass, and a rise small enough to fit inside ' +
        'the pinned V197 headroom still fails here');
      else bad('B4g1 (D81, RATCHET): leg-compound section emptyings ROSE vs the live ' + baseSrc + ': ' + bSum + ' -> ' + cSum +
        ' (+' + (cSum - bSum) + ') — under the pinned V197 ceiling, and still a regression against the version this one ships after');
    }
    else na('B4g1 (D81, RATCHET): leg-compound section emptyings at or below the live baseline',
      'no baseline file supplied; the pinned V197 census ceiling above runs in its place, which is coarser by the ' +
      (V197_LEG_COMPOUND_SUM - cSum) + ' of headroom the candidate currently holds');

    // B4g2 — the pin is a transcription of a real artifact, so it is re-proved against that
    // artifact on every run that hands it in. This is what stops the ceiling drifting off
    // the file it was typed from.
    if (baseKinds && String(BASE_VER) === '197' && !USE_FULL){
      const mism = LEG_COMPOUND_CLASSES.filter(k => (baseKinds[k]||0) !== V197_LEG_COMPOUND_WIDE[k]);
      if (!mism.length) ok('B4g2 (D81): the live V197 baseline still carries the pinned leg-compound census on both classes (' +
        handPer + ' = ' + V197_LEG_COMPOUND_SUM + ') — the pin is a transcription of THIS artifact and is re-proved on every run that supplies it');
      else bad('B4g2 (D81): the baseline claims v197 but its leg-compound census disagrees with the pinned table on: ' +
        mism.map(k => k + ' live ' + (baseKinds[k]||0) + ' vs table ' + V197_LEG_COMPOUND_WIDE[k]).join(', ') +
        ' — the pinned ceiling is no longer the number it claims to be and must not be used as a bar');
    }
    else na('B4g2 (D81): live-baseline cross-check of the pinned V197 leg-compound census',
      baseKinds ? ('the baseline supplied is v' + BASE_VER + ' on the ' + CELLS.length + '-cell ' + (USE_FULL ? 'FULL' : 'WIDE') +
        ' lattice; the pinned table is a v197 transcription on the ' + LAT.WIDE_N + '-cell WIDE lattice, so nothing on this run confirms it is still the V197 truth')
        : 'no baseline file supplied, so there is no artifact on this run to cross-check the pinned table against');
  }
'''

rep(OLD_B4G, NEW_B4G, 'B4g: strict per-release fall -> pinned V197 ceiling + non-strict live ratchet')

# ── apply: every anchor count==1 asserted BEFORE any write, abort on the first miss ──
fail = False
for old, new, tag in reps:
    n = src.count(old)
    print(('  count=%d  %s' % (n, tag)))
    if n != 1:
        sys.stderr.write('ANCHOR MISS (%d occurrences, wanted 1): %s\n' % (n, tag))
        fail = True
if fail:
    sys.stderr.write('ABORT: nothing written.\n')
    sys.exit(1)
for old, new, tag in reps:
    src = src.replace(old, new, 1)

# NOT an app change: prove this script never had index.html in its hands.
assert P == 'tests/gates/g193_budget_floor.js'
assert src != BEFORE
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes, %d replacement(s))' % (P, len(BEFORE), len(src), len(reps)))
