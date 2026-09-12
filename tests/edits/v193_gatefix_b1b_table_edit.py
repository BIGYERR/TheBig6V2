#!/usr/bin/env python3
# V193 gate-file amendment, part 2. Adds the V192 fallback census B1b needs when no baseline
# file is handed in (the sabotage runner never hands one in). GATE FILE ONLY.
# Transcribed off the V192 artifact the same way V192_PREHAB_WIDE and V192_NONOPT_WIDE were,
# and cross-checked against the live baseline on every run that supplies one.
import sys, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')
src = io.open(TARGET, encoding='utf-8').read()
orig = src
edits = []

edits.append(('core-nonlr-table', r"""const V192_NONOPT_NARROW = { bodyweight:3, minimal:6, home_basic:5, home_full:9, commercial:9, crossfit:9 };""",
r"""const V192_NONOPT_NARROW = { bodyweight:3, minimal:6, home_basic:5, home_full:9, commercial:9, crossfit:9 };
// Core sections OFF the NRC long-run tiers, per injury path, on the 288-cell WIDE lattice,
// transcribed off the V192 artifact (git show HEAD:index.html at V192, ia-version 192).
// This is the fallback B1b uses when no baseline file is supplied — which is every sabotage
// run, because the sabotage runner invokes a gate with the mutated file and nothing else. An
// assertion no mutation can reach is not proof, so B1b gets a floor it can be held to with
// one argument. It is a FLOOR, never an equality: V193 legitimately gains core sections.
// Typed against WIDE only; on IA_LATTICE=full the fallback is skipped, not rescaled.
const V192_CORE_NONLR_WIDE = { 'healthy':1296, 'shoulder/protect':648, 'lowback/protect':1224, 'elbow/protect':576 };"""))

edits.append(('core-nonlr-crosscheck', r"""    if (CAND.lrDays === BASE.lrDays) ok('B1b the carve-out covers the SAME ' + CAND.lrDays + ' day-builds on both versions — V193 did not move which days the run owns');""",
r"""    // The transcribed fallback and the live baseline must agree, or the table is a fossil
    // and the sabotage runs that lean on it are testing a number nobody maintains.
    if (BASE_VER === '192' && !USE_FULL){
      const bInj = {};
      for (const t of INJS) bInj[t] = 0;
      for (const c of CELLS) bInj[c.inj] += BASE.cells[c.key].coreSecNL;
      const mism = INJS.filter(t => bInj[t] !== V192_CORE_NONLR_WIDE[t]);
      if (!mism.length) ok('B1b the transcribed V192 off-long-run core census matches the live V192 baseline on all ' + INJS.length + ' injury paths (' + INJS.map(t => bInj[t]).join('/') + ')');
      else bad('B1b the transcribed V192 off-long-run core census disagrees with the live baseline on: ' + mism.map(t => t + ' live ' + bInj[t] + ' vs table ' + V192_CORE_NONLR_WIDE[t]).join(', '));
    }
    if (CAND.lrDays === BASE.lrDays) ok('B1b the carve-out covers the SAME ' + CAND.lrDays + ' day-builds on both versions — V193 did not move which days the run owns');"""))

for tag, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (need exactly 1). Nothing written.\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new)

if src == orig:
    sys.stderr.write('ABORT: no change produced.\n'); sys.exit(1)
io.open(TARGET, 'w', encoding='utf-8').write(src)
print('wrote %s (%d replacements, %d -> %d bytes)' % (TARGET, len(edits), len(orig), len(src)))
