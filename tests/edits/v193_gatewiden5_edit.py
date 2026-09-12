#!/usr/bin/env python3
# V193 gate widening, part 5 — gate files only. Does NOT touch index.html.
#
# WHY. The ruled floor for this pass was 4 injuries x 2 foci x 2 experiences x 6 tiers x 3
# seeds = 288 cells, and that is what the gates now run by default. But the FULL lattice
# g193_samecard already uses (adds beginner, knee/protect, hip/workaround, ankle/workaround
# and lowback/workaround; 864 cells) does not merely find MORE of the same, it finds a
# different order of magnitude. Measured V192 -> V193, same census, two lattices:
#     core sections lost        288 cells:   3      864 cells: 108
#     new non-optional deletes  288 cells:   4      864 cells:  20
#     thin core V193            288 cells: 67.68%   864 cells: 51.87%
# Thirty-six times as many core-section losses. Reporting that and doing nothing about it
# would repeat this pass's own lesson one level up.
#
# WHAT THIS DOES, and what it deliberately does NOT do. It does NOT change the default: the
# ruled 288-cell lattice is still what a bare `node tests/gates/...` and tests/gate.sh run,
# because switching the default is a scope and runtime decision that is Mario's, not the
# builder's. It adds an opt-in: IA_LATTICE=full runs the 864-cell sweep with no edit. The
# lattice actually used is PRINTED in the header and the 288-cell floor is asserted either
# way, so a run can never be quietly narrower than the ruling and can never be silently
# wider than the reader thinks. Cost measured: budget_floor 10 s -> about 40 s.
#
# Anchors asserted count==1 before writing.

import io, sys

def apply(path, reps):
    src = io.open(path, encoding='utf-8').read(); orig = src
    for old, new, tag in reps:
        n = src.count(old)
        if n != 1:
            sys.stderr.write('ABORT: %s anchor %r matched %d times (want 1)\n' % (path, tag, n)); sys.exit(1)
        src = src.replace(old, new, 1)
    if src == orig:
        sys.stderr.write('ABORT: no change in %s\n' % path); sys.exit(1)
    io.open(path, 'w', encoding='utf-8').write(src)
    print('OK %d replacements in %s' % (len(reps), path))

BF = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
apply(BF, [
(
"""const EQUIP = LAT.EQUIP;
const INJS  = LAT.INJ_WIDE.map(i => i.tag);""",
"""const EQUIP = LAT.EQUIP;
// OPT-IN WIDER SWEEP. Default is the ruled 288-cell WIDE lattice. IA_LATTICE=full runs the
// 864-cell FULL lattice (beginner, knee/protect, hip/workaround, ankle/workaround,
// lowback/workaround as well), which finds 108 lost core sections where WIDE finds 3.
// The default is NOT changed here: that is a runtime and scope call for Mario, and this
// pass was authorised to widen to the 288-cell floor, not past it.
const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';
const CELLS = USE_FULL ? LAT.FULL : LAT.WIDE;
const INJS  = (USE_FULL ? LAT.INJ_FULL : LAT.INJ_WIDE).map(i => i.tag);""",
'BF cells selector'),
(
"""console.log('  WIDE   lattice: ' + LAT.WIDE_N + ' cells = ' + LAT.INJ_WIDE.length + ' injury x ' + EQUIP.length + ' tiers x ' +
  LAT.FOCUS_WIDE.length + ' foci x ' + LAT.EXPER_WIDE.length + ' experiences x ' + LAT.SEEDS_WIDE.length + ' seeds (HALF MANNY, 14 weeks)');""",
"""console.log('  lattice in use: ' + (USE_FULL ? 'FULL' : 'WIDE') + ', ' + CELLS.length + ' cells' +
  (USE_FULL ? ' (IA_LATTICE=full: 8 injury paths, 3 experience levels)' : ' = ' + LAT.INJ_WIDE.length + ' injury x ' + EQUIP.length + ' tiers x ' +
  LAT.FOCUS_WIDE.length + ' foci x ' + LAT.EXPER_WIDE.length + ' experiences x ' + LAT.SEEDS_WIDE.length + ' seeds') + ' (HALF MANNY, 14 weeks)');
if (!USE_FULL) console.log('  set IA_LATTICE=full for the 864-cell sweep (about 4x the runtime; it finds strictly more)');""",
'BF header'),
(
"""if (LAT.WIDE_N === 288) ok('L0 WIDE lattice is the ruled 288 cells (4 x 6 x 2 x 2 x 3)');
else bad('L0 WIDE lattice is ' + LAT.WIDE_N + ' cells, not the ruled 288 — lattice193.js was narrowed and every claim below is weaker than it reads');""",
"""if (LAT.WIDE_N === 288) ok('L0 WIDE lattice is the ruled 288 cells (4 x 6 x 2 x 2 x 3)' + (USE_FULL ? ', and this run uses the ' + CELLS.length + '-cell superset' : ''));
else bad('L0 WIDE lattice is ' + LAT.WIDE_N + ' cells, not the ruled 288 — lattice193.js was narrowed and every claim below is weaker than it reads');
if (CELLS.length >= LAT.WIDE_N) ok('L0a the lattice in use (' + CELLS.length + ' cells) is at or above the ruled floor of ' + LAT.WIDE_N);
else bad('L0a the lattice in use is ' + CELLS.length + ' cells, BELOW the ruled floor of ' + LAT.WIDE_N);""",
'BF L0'),
(
"""    BASE = census(IB_BASE, false, LAT.WIDE); BASE_OFF = census(IB_BASE, true, LAT.WIDE);""",
"""    BASE = census(IB_BASE, false, CELLS); BASE_OFF = census(IB_BASE, true, CELLS);""",
'BF base census'),
(
"""const CAND = census(IA, false, LAT.WIDE);
const CANDOFF = census(IA, true, LAT.WIDE);""",
"""const CAND = census(IA, false, CELLS);
const CANDOFF = census(IA, true, CELLS);""",
'BF cand census'),
(
"""if (CAND.cellsSwept === LAT.WIDE_N) ok('L1 the wide sweep actually ran all ' + LAT.WIDE_N + ' cells (no build was silently skipped)');
else bad('L1 the wide sweep covered ' + CAND.cellsSwept + '/' + LAT.WIDE_N + ' cells');""",
"""if (CAND.cellsSwept === CELLS.length) ok('L1 the sweep actually ran all ' + CELLS.length + ' cells (no build was silently skipped)');
else bad('L1 the sweep covered ' + CAND.cellsSwept + '/' + CELLS.length + ' cells');""",
'BF L1'),
])

# every remaining LAT.WIDE / LAT.WIDE_N reader inside the claims
src = io.open(BF, encoding='utf-8').read()
for old, new in [
  ("const healthy = LAT.WIDE.filter(c => c.inj === 'healthy');", "const healthy = CELLS.filter(c => c.inj === 'healthy');"),
  ("for (const c of LAT.WIDE){\n      const nc = CAND.cells[c.key].coreSec", "for (const c of CELLS){\n      const nc = CAND.cells[c.key].coreSec"),
  ("' over ' + LAT.WIDE_N + ' cells')", "' over ' + CELLS.length + ' cells')"),
  ("' cells / ' + totB + ' baseline core sections)')", "' cells / ' + totB + ' baseline core sections)')"),
  ("in ' + lost.length + '/' + LAT.WIDE_N + ' cells", "in ' + lost.length + '/' + CELLS.length + ' cells"),
  ("(0 lost over ' + LAT.WIDE_N + ' cells", "(0 lost over ' + CELLS.length + ' cells"),
  ("' sections swept over ' + LAT.WIDE_N + ' cells", "' sections swept over ' + CELLS.length + ' cells"),
]:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: BF sweep-ref %r matched %d\n' % (old[:50], n)); sys.exit(1)
    src = src.replace(old, new, 1)
io.open(BF, 'w', encoding='utf-8').write(src)
print('OK 7 sweep-reference rewrites in %s' % BF)

GG = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_gear_gates.js'
apply(GG, [
(
"""const SEEDS = LAT.SEEDS_WIDE;""",
"""const SEEDS = LAT.SEEDS_WIDE;
// OPT-IN WIDER SWEEP, same switch and same reasoning as g193_budget_floor: default is the
// ruled 288-cell lattice, IA_LATTICE=full runs the 864-cell superset. The default is not
// changed here.
const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';
const CELLS = USE_FULL ? LAT.FULL : LAT.WIDE;
if (CELLS.length >= LAT.WIDE_N) ok('L0d lattice in use: ' + (USE_FULL ? 'FULL' : 'WIDE') + ', ' + CELLS.length + ' cells, at or above the ruled floor of ' + LAT.WIDE_N);
else bad('L0d lattice in use is ' + CELLS.length + ' cells, BELOW the ruled floor of ' + LAT.WIDE_N);""",
'GG cells selector'),
(
"""  for (const c of LAT.WIDE){
    const slot = byInj[c.inj] || (byInj[c.inj] = { per:{}, total:0 });""",
"""  for (const c of CELLS){
    const slot = byInj[c.inj] || (byInj[c.inj] = { per:{}, total:0 });""",
'GG sweep cells'),
(
"""const BYINJ    = sweepWide();
const HEALTHY  = BYINJ['healthy'];
const LOWBACK  = BYINJ['lowback/protect'];
const SHOULDER = BYINJ['shoulder/protect'];
const ELBOW    = BYINJ['elbow/protect'];""",
"""const BYINJ    = sweepWide();
const HEALTHY  = BYINJ['healthy'];
const LOWBACK  = BYINJ['lowback/protect'];
const SHOULDER = BYINJ['shoulder/protect'];
const ELBOW    = BYINJ['elbow/protect'];
for (const t of ['healthy','shoulder/protect','lowback/protect','elbow/protect'])
  if (!BYINJ[t]) bad(`L0e the ${t} slice is missing from the sweep — a claim below would be made about nothing`);""",
'GG slice presence'),
(
"""console.log(`  swept ${SWEPT_CELLS}/${LAT.WIDE_N} cells, ${ALL.total} items, injury slices: ${Object.keys(BYINJ).join(', ')}`);
if (SWEPT_CELLS === LAT.WIDE_N) ok(`L0b every one of the ${LAT.WIDE_N} wide cells built (no build was silently skipped)`);
else bad(`L0b only ${SWEPT_CELLS}/${LAT.WIDE_N} wide cells built`);""",
"""console.log(`  swept ${SWEPT_CELLS}/${CELLS.length} cells, ${ALL.total} items, injury slices: ${Object.keys(BYINJ).join(', ')}`);
if (!USE_FULL) console.log('  set IA_LATTICE=full for the 864-cell sweep (about 3x the runtime; it finds strictly more)');
if (SWEPT_CELLS === CELLS.length) ok(`L0b every one of the ${CELLS.length} cells built (no build was silently skipped)`);
else bad(`L0b only ${SWEPT_CELLS}/${CELLS.length} cells built`);""",
'GG sweep report'),
(
"""for (const e of EQUIP) CELLS_BY_TIER[e] = LAT.WIDE.filter(c => c.equipment === e);
if (CELLS_BY_TIER[EQUIP[0]].length === LAT.WIDE_N / EQUIP.length)
  ok(`L0c the draw sweeps see ${CELLS_BY_TIER[EQUIP[0]].length} cells per tier (${LAT.WIDE_N} / ${EQUIP.length})`);
else bad(`L0c per-tier cell count is ${CELLS_BY_TIER[EQUIP[0]].length}, not ${LAT.WIDE_N / EQUIP.length} — the wide lattice is not balanced across tiers`);""",
"""for (const e of EQUIP) CELLS_BY_TIER[e] = CELLS.filter(c => c.equipment === e);
if (CELLS_BY_TIER[EQUIP[0]].length === CELLS.length / EQUIP.length)
  ok(`L0c the draw sweeps see ${CELLS_BY_TIER[EQUIP[0]].length} cells per tier (${CELLS.length} / ${EQUIP.length})`);
else bad(`L0c per-tier cell count is ${CELLS_BY_TIER[EQUIP[0]].length}, not ${CELLS.length / EQUIP.length} — the lattice is not balanced across tiers`);""",
'GG per-tier cells'),
(
"""for (const t of LAT.INJ_WIDE.map(i => i.tag)){ thinByInj[t] = 0; blocksByInj[t] = 0; }""",
"""for (const t of Object.keys(BYINJ)){ thinByInj[t] = 0; blocksByInj[t] = 0; }""",
'GG thin-by-inj keys'),
])
