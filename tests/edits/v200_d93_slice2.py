#!/usr/bin/env python3
# V200 D93 slice 2 of 3 — TOOLING ONLY. index.html is NOT touched and ia-version stays 199.
#
# ONE edit, two assertions, into tests/gates/g199_deload_arbitration.js:
#   P1  pull-block conservation, FAMILY-counted, pinned to the PREDECESSOR artifact (V198).
#   P2  per-card expected survivor on the p1/p2 STAGE records, with a self-expiring licence
#       naming D94 as the ruling that re-pins it.
#
# Inserted at the tail of section F (under F's existing header) on purpose: a new
# `console.log('── P. ...')` header would move a console.log line, and the V200 slice-1 diff
# proof requires that `git diff -U0 | grep -E '^[-+].*(ok\(|console.log)'` show ONLY the new
# ok( lines. LABELS at :118 and lblP1all/lblP2all/lblP1/lblP2 are not touched, so every
# F/G/H/I number stays byte-identical.
#
# Anchor asserted count==1; a miss aborts before anything is written.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')

with open(GATE, 'r', encoding='utf-8') as f:
    SRC = f.read()

OLD = "\n  console.log('── G. Leg isolation and Explosive finisher, BOTH denominators pinned ──');"

BLOCK = r"""
  // ══ D93 (V200) PULL SIDE — P1 conservation, P2 per-card expected survivor ══════════
  // Printed under F's header deliberately. P1 is the pull-side twin of F3, and a new section
  // header would move a printed header line the slice-1 diff proof pins byte-identical. These two
  // read PLABELS / pull* counters only; LABELS and lblP* are a separate census and untouched.
  //
  // ── P1 ORACLE, and why it is not a change-detector ──────────────────────────────────
  // 23,592 is read off the PREDECESSOR artifact, not the candidate. `git show V198:index.html`
  // run through THIS gate reads pullP2all {Pull superset A: 16,704, Pull superset B: 6,888,
  // Pull: 0}, family total 23,592, and V199 reads the same three numbers. That is the identical
  // standing F3s 30,264 has: V198s own total, plus the claim that the ruling moved zero blocks.
  // D91 SWAPPED which leg block survives and ADDED NO BLOCKS, so the pull family total must not
  // have moved. If a future build makes these two totals differ, that is a finding about the
  // ruling, not a number to re-pin.
  // Bare `Pull` is inside the family on purpose: singletonSupersetSweep (index.html:10010)
  // renames a superset trimmed to one item, so a conservation claim that omitted it could be
  // satisfied by a block LEAVING the family rather than surviving. It reads 0 in the STAGE
  // census by construction, because that sweep runs post-build (index.html:9895) downstream of
  // p1/p2/p3. What it carries on the SHIPPED card is a separate claim, not this one.
  const PFAM_P2ALL = g(N.pullP2all,'Pull superset A') + g(N.pullP2all,'Pull superset B') + g(N.pullP2all,'Pull');
  ok(PFAM_P2ALL===23592,
    'P1 PULL-BLOCK CONSERVATION, FAMILY-COUNTED: {Pull superset A, Pull superset B, Pull} present after the deload == 23,592, the identical family total V198 ships (16,704 + 6,888 + 0 read off git show V198:index.html through this same gate). The ruling SWAPS which block survives, it ADDS NO BLOCKS. '
    + 'DENOMINATOR: all ' + N.dayCells + ' day builds, the same all-day-builds denominator F1 and F2 state (non-deload cards pass through recoveryDeload untouched, so they belong in this total). '
    + 'ROUGHLY HALF THE LATTICE CAN NEVER CONTRIBUTE A B, AND THAT IS STRUCTURAL, NOT A SHORTFALL: E_FOCUS on this lattice is [hypertrophy, balanced], and Pull superset B exists only on the else branch of the goal===strength || goal===hypertrophy guard at index.html:8223. On hypertrophy the section is labelled Row volume, which is NOT in PLABELS, so those configs cannot contribute a B at all. B accordingly enters on only ' + g(N.pullP1all,'Pull superset B') + ' of ' + N.dayCells + ' day builds. '
    + 'got ' + PFAM_P2ALL + ' (A ' + g(N.pullP2all,'Pull superset A') + ' + B ' + g(N.pullP2all,'Pull superset B') + ' + bare Pull ' + g(N.pullP2all,'Pull') + ')');

  // ── P2 SELF-EXPIRING LICENCE — READ THIS BEFORE FIXING A TRIP ───────────────────────
  // Same expiry discipline as the D85 and D91 licence switches in g193_budget_floor.js:180-189,
  // written as a pin rather than a switch because this gate takes no baseline argv to arm one
  // from. P2 is a correct description of the engine at V199 and it is NOT a coaching endorsement.
  // Coach has ruled the direction P2 pins COACHING-WRONG on pull days under D94: the deload keeps
  // a hinge drawn from the conditioning pool while the Main is already a deadlift variant, and
  // deletes the days only vertical pull. D94 IS THE RULING THAT RE-PINS P2. A TRIP ON P2 AFTER
  // D94 SHIPS IS EXPECTED, NOT A REGRESSION: re-derive the expected survivor from D94s after-grid
  // and rewrite this assertion. Until D94 ships, a trip here is a real defect.
  //
  // Keyed on pullSwapCensus, which is the p1/p2 STAGE record and never the shipped card:
  // g193_samecard.js:374 already rules that the Pull superset A label is not asserted to survive
  // to the card, and P2 must not collide with that ruling. Posterior is secPost, the E_PAT hand
  // table; _isPostChain and _pattern are never consulted.
  const pEnter = k => (String(k).match(/enterPost=(\S+)/) || [null,'none'])[1];
  const pSurv  = k => (String(k).match(/surv=(\S+)/)      || [null,'none'])[1];
  const pExp   = k => pEnter(k).indexOf('B') >= 0 ? 'B' : 'A';
  const P2_VIOL = Object.keys(N.pullSwapCensus||{})
    .reduce((a,k) => a + (pSurv(k)===pExp(k) ? 0 : N.pullSwapCensus[k]), 0);
  ok(P2_VIOL===0 && N.pullBothP1>0,
    'P2 PER-CARD EXPECTED SURVIVOR (D93, re-pinned by D94): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is B if and only if B holds an E_PAT posterior item on p1, else A. '
    + 'VIOLATIONS ' + P2_VIOL + ' of ' + N.pullBothP1 + ' deload day builds offering both blocks. The denominator is stated because a zero with no denominator is the vacuity defect this repo has caught three times; surv=AB and surv=none are BOTH scored as violations, so the exactly-one-survives claim sits inside this same number. '
    + 'CENSUS ' + JSON.stringify(N.pullSwapCensus) + '. On this lattice all ' + N.pullBothP1 + ' such cards enter with NEITHER block holding posterior, so the positive limb of the iff (B holds posterior, therefore B survives) is UNEXERCISED here: what P2 is presently pinning is the else limb, no posterior anywhere therefore A survives. That limb is exactly what a reverted push order or a last-posterior-wins rewrite moves, so P2 is not vacuous against either. '
    + 'D94 REVERSES THE DIRECTION THIS PINS. A trip on P2 once D94 has shipped is EXPECTED and is not a regression.');

  console.log('── G. Leg isolation and Explosive finisher, BOTH denominators pinned ──');"""

n = SRC.count(OLD)
if n != 1:
    sys.exit('ABORT: anchor G-header count==%d, expected 1' % n)
SRC = SRC.replace(OLD, BLOCK)

with open(GATE, 'w', encoding='utf-8') as f:
    f.write(SRC)
print('OK  g199_deload_arbitration.js: P1 + P2 inserted at the tail of section F')
