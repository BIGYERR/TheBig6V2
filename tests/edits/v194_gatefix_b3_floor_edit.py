#!/usr/bin/env python3
# V194 gate fix — g193_budget_floor.js ONLY. Does NOT touch index.html, does NOT bump
# ia-version (stays 194). Two rulings, this session:
#
#   1. B3 becomes a FLOOR, not a delta. "prehab aggregate delta > 0" asserted that every
#      future version GROWS prehab. It passed exactly once, against the V192 baseline the
#      D46 expansion was written against, and fails any version whose prehab merely holds —
#      V193 against V193 fails it identically, which is the proof it is a change-detector and
#      not a claim about the artifact. The permanent coaching claim is "prehab never
#      regresses below the V192 census", asserted against the hand-transcribed tables this
#      file already carries. The live-baseline delta is demoted to REPORT ONLY, the same
#      treatment B4d and B5 already have here.
#   2. The gate may not report the same shape of green whether or not it was handed the
#      baseline it was written to use. Every claim that needs a baseline is now DEFERRED BY
#      NAME and counted, the run exits non-zero in that mode, and a NAMED baseline that does
#      not exist on disk is a refusal instead of a silent fallback.
#
# Nothing else is weakened: B1, B2, B4, B4b, B4c, B4d, B4e, B4f, B5, B6 are untouched.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')
src = open(TARGET, encoding='utf-8').read()
orig = src

EDITS = []

# ── 1. THE BAR, B3 line in the header block ────────────────────────────────
EDITS.append((
"""//   B3 Prehab items vs V192: per-tier delta >= 0, aggregate delta > 0. Aggregate printed.
//      The aggregate is NOT pinned to a number: a future ruling that legitimately trades
//      prehab must fail on the per-tier floor, not on a magic constant.""",
"""//   B3 Prehab items vs the V192 census: a FLOOR, per tier and in aggregate. Never a delta.
//      The claim is "prehab never regresses below V192", which is permanent and holds on
//      every future version. The old claim was "prehab GREW this release" (aggregate delta
//      > 0) and that is a change-detector: it can only pass against the one baseline the
//      D46 expansion was measured against, and V193 against V193 fails it exactly the way
//      V194 against V193 does. Growth is a per-release measure question and has no business
//      in a permanent gate. The floor is the hand sum of the transcribed census (22,671
//      wide / 2,697 narrow); the sum is cross-checked against the table on every run so a
//      typo in either cannot pass. The live-baseline delta is REPORTED, never gated — the
//      same treatment B4d and B5 already carry below.""",
))

# ── 2. under-invocation accounting, right after ok/bad/info ────────────────
EDITS.append((
"""const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const info = m => console.log('  --   ' + m);

const EQUIP = LAT.EQUIP;""",
"""const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const info = m => console.log('  --   ' + m);

// ── UNDER-INVOCATION ACCOUNTING ────────────────────────────────────────────
// This gate used to print the same SHAPE of green whether or not it was handed the baseline
// it was written to use: `PASS 20 FAIL 0` with no argument, `PASS 30 FAIL 0` with one, and
// the only trace of the ten missing claims was a single `--` line. A gate that quietly
// reports green on less work than it was written to do is the one failure mode a gate cannot
// have. So: every claim that can only be made against a baseline is DEFERRED BY NAME, the
// names are counted and reprinted as their own block above the summary, and the process
// exits non-zero (3) in that mode. Nothing is skipped silently any more.
//
// REQUIRES_BASELINE is the hard branch. Put a claim's name in it and the gate REFUSES TO RUN
// without a baseline: exit 2, no PASS/FAIL summary at all, because a refusal that prints a
// summary is just another way of reading as a pass. As of V194 the list is EMPTY ON PURPOSE,
// and that is a finding, not an oversight: once B3 became a census floor, every GATED claim
// in this file stands on a hand table, on doctrine arithmetic or on the candidate alone. A
// baseline only ever ADDS finer differential claims (per cell instead of per injury path)
// plus the identity checks on the baseline artifact itself. tests/sabotage.py invokes gates
// with the mutated file and nothing else, so a hard requirement here would turn every
// sabotage mutation against this gate into a CRASH, which is not a trip.
const REQUIRES_BASELINE = [];
let DEFER = 0;
const defers = [];
const defer = (claim, why) => { DEFER++; defers.push(claim + ' \— ' + why); console.log('  DEFER ' + claim + ' \— ' + why); };
if (!BASEFILE && REQUIRES_BASELINE.length){
  console.error('REFUSING TO RUN: ' + path.basename(__filename) + ' was given no baseline argument and these claims cannot be stated without one:');
  REQUIRES_BASELINE.forEach(c => console.error('   - ' + c));
  console.error('usage: node tests/gates/g193_budget_floor.js <candidate.html> <baseline.html>');
  console.error('No PASS/FAIL summary is printed: this run proved nothing, and must not be readable as a pass.');
  process.exit(2);
}
if (BASEFILE && !fs.existsSync(BASEFILE)){
  console.error('REFUSING TO RUN: the baseline ' + BASEFILE + ' was named on the command line and does not exist.');
  console.error('A named baseline that silently falls back to a hand table is the exact defect this guard exists to stop.');
  console.error('No PASS/FAIL summary is printed.');
  process.exit(2);
}

const EQUIP = LAT.EQUIP;""",
))

# ── 3. the no-baseline branch: name every claim that is not being made ─────
EDITS.append((
"""} else {
  info('no baseline file supplied; B3 and B4 fall back to their hand-transcribed V192 tables');
}""",
"""} else {
  info('no baseline file supplied. The gated claims below stand on the hand-transcribed V192 tables and on the candidate alone. Every claim that needs a live baseline is deferred BY NAME and counted; see the DEFERRED block above the summary.');
  defer('B6c baseline artifact is self-stable before any diff', 'no baseline file supplied');
  defer('B1b per-CELL core-section differential vs the live baseline (all ' + CELLS.length + ' cells)', 'no baseline file supplied; the per-injury-path floor against the transcribed V192 census runs in its place, which is coarser');
  defer('B1b the carve-out covers the same day-builds on both versions', 'no baseline file supplied');
  defer('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)', 'no baseline file supplied');
  defer('B4b per-CELL non-optional deletions (REPORT ONLY)', 'no baseline file supplied');
  defer('B4d per-CLASS non-optional deletion growth (REPORT ONLY)', 'no baseline file supplied');
  defer('B4f trim order for non-optional sections unchanged vs the baseline engine', 'no baseline file supplied; the hand-derived D48 and plain trim orders are still asserted against the candidate');
}""",
))

# ── 4. B3 itself: floor against the census, live delta report-only ─────────
EDITS.append((
"""  let aggC = 0, aggB = 0, below = [];
  for (const e of EQUIP){
    const c = cand.tiers[e].prehab, b = basePrehab[e];
    aggC += c; aggB += b;
    console.log('       prehab items [' + tag + '] ' + e.padEnd(11) + ' V192 ' + String(b).padStart(5) + ' -> ' + String(c).padStart(5) + '  delta ' + (c-b>=0?'+':'') + (c-b));
    if (c - b < 0) below.push(e + ' ' + (c-b));
  }
  if (!below.length) ok('B3 ' + tag + ': prehab delta >= 0 on 6/6 tiers');
  else bad('B3 ' + tag + ': prehab LOST items on ' + below.length + '/' + EQUIP.length + ' tiers: ' + below.join(', '));
  console.log('       prehab aggregate [' + tag + '] ' + aggB + ' -> ' + aggC + ' (delta ' + (aggC-aggB>=0?'+':'') + (aggC-aggB) + ' of ' + aggB + '). Threshold is > 0, never a pinned number.');
  if (aggC - aggB > 0) ok('B3 ' + tag + ': prehab aggregate delta ' + (aggC-aggB) + ' > 0');
  else bad('B3 ' + tag + ': prehab aggregate delta ' + (aggC-aggB) + ' is not > 0');
}""",
"""  // THE FLOOR IS THE V192 CENSUS, NEVER THE LIVE BASELINE. FLOOR_AGG is the hand sum of the
  // transcribed tables at the top of this file and is asserted to equal that sum on every
  // run, so a typo in the table or in this constant fails rather than lowering the bar.
  const FLOOR_AGG = { wide: 22671, narrow: 2697 };
  let aggC = 0, aggT = 0, aggB = 0, below = [], belowBase = [];
  for (const e of EQUIP){
    const c = cand.tiers[e].prehab, t = handTable[e], b = basePrehab[e];
    aggC += c; aggT += t; aggB += b;
    console.log('       prehab items [' + tag + '] ' + e.padEnd(11) + ' V192 census ' + String(t).padStart(5) + '  ->  ' + String(c).padStart(5) +
      '   vs census ' + (c-t>=0?'+':'') + (c-t) + (base ? '   vs live V' + BASE_VER + ' ' + (c-b>=0?'+':'') + (c-b) : ''));
    if (c - t < 0) below.push(e + ' ' + c + ' < ' + t);
    if (base && c - b < 0) belowBase.push(e + ' ' + (c-b));
  }
  if (!tableApplies){
    defer('B3 ' + tag + ': prehab FLOOR vs the V192 census, per tier and in aggregate',
      'the census was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. A table applied to the wrong lattice is a lower bar, not a higher one, so it is not applied at all');
  } else {
    if (aggT === FLOOR_AGG[tag]) ok('B3 ' + tag + ': the floor constant ' + FLOOR_AGG[tag] + ' is the hand sum of the six transcribed V192 tier censuses (arithmetic cross-check, no engine involved)');
    else bad('B3 ' + tag + ': the floor constant ' + FLOOR_AGG[tag] + ' does not equal the sum of the transcribed V192 tier censuses (' + aggT + ') \— one of the two was edited without the other and the bar is no longer the number it claims to be');
    if (!below.length) ok('B3 ' + tag + ': prehab is at or above the V192 census on 6/6 tiers (a floor, not a delta \— holding is a pass, growing is a pass, losing an item is not)');
    else bad('B3 ' + tag + ': prehab is BELOW the V192 census on ' + below.length + '/' + EQUIP.length + ' tiers: ' + below.join(', '));
    console.log('       prehab aggregate [' + tag + '] candidate ' + aggC + ' vs V192 census floor ' + FLOOR_AGG[tag] + ' (' + (aggC-aggT>=0?'+':'') + (aggC-aggT) + ' of ' + aggT + ' above the floor).');
    if (aggC >= FLOOR_AGG[tag]) ok('B3 ' + tag + ': prehab aggregate ' + aggC + ' >= the V192 census floor ' + FLOOR_AGG[tag]);
    else bad('B3 ' + tag + ': prehab aggregate ' + aggC + ' has fallen BELOW the V192 census floor ' + FLOOR_AGG[tag] + ' (' + (aggC-FLOOR_AGG[tag]) + ')');
  }
  // THE LIVE-BASELINE DELTA IS REPORT ONLY. "Prehab grew since the last version" is a
  // per-release measure question, and a permanent gate that asserts it fails every release
  // that legitimately holds prehab steady. The per-tier losses vs the live baseline are
  // printed too, so nothing that used to be visible here stops being visible.
  if (base){
    console.log('       REPORT ONLY \— B3 prehab vs the live baseline [' + tag + '] V' + BASE_VER + ' ' + aggB + ' -> ' + aggC +
      ' (delta ' + (aggC-aggB>=0?'+':'') + (aggC-aggB) + ' of ' + aggB + '), ' + belowBase.length + '/' + EQUIP.length + ' tiers below the live baseline' +
      (belowBase.length ? ': ' + belowBase.join(', ') : '') + '. Never gated: the gated bar is the V192 census floor above.');
    ok('B3 ' + tag + ': prehab delta vs the live baseline reported (' + aggB + ' -> ' + aggC + ', ' + belowBase.length + '/' + EQUIP.length + ' tiers down), not gated');
  } else {
    defer('B3 ' + tag + ': prehab delta vs the live baseline (REPORT ONLY)', 'no baseline file supplied');
  }
}""",
))

# ── 5. the summary: deferred claims are named above it, exit code says so ──
EDITS.append((
"""if (fails.length){ console.log('\\nfailures:'); fails.forEach(f => console.log('  ' + f)); }
console.log('\\nPASS ' + PASS + ' FAIL ' + FAIL);
process.exit(0);""",
"""if (fails.length){ console.log('\\nfailures:'); fails.forEach(f => console.log('  ' + f)); }
if (defers.length){
  console.log('\\nDEFERRED (' + defers.length + ') \— claims this run did NOT make:');
  defers.forEach(d => console.log('  ' + d));
  console.log('  This run was under-invoked. Hand it a baseline (argv[3]) to make these claims.');
  console.log('  It is NOT a full pass of this gate and the exit code (3) says so, whatever the PASS line below reads.');
}
// The summary line itself is byte-shaped for the summary regex in tests/sabotage.py and for
// tests/gate.sh, which both anchor on the end of that line, so the deferral block goes ABOVE
// it and is never appended to it.
console.log('\\nPASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : (defers.length ? 3 : 0));""",
))

for i, (old, new) in enumerate(EDITS, 1):
    n = src.count(old)
    print('anchor %d count=%d' % (i, n))
    if n != 1:
        print('ABORT: anchor %d matched %d times, expected 1. Nothing written.' % (i, n))
        sys.exit(1)
    src = src.replace(old, new)

if src == orig:
    print('ABORT: no change'); sys.exit(1)
open(TARGET, 'w', encoding='utf-8').write(src)
print('wrote %s (%d -> %d bytes)' % (TARGET, len(orig), len(src)))
