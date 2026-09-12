#!/usr/bin/env python3
# V193 gate widening, part 4 — g193_gear_gates.js only. Does NOT touch index.html.
#
# ORACLE CORRECTION, named exactly as the standing rule requires.
# WHICH LINE: the G6b block added by tests/edits/v193_gatewiden2_edit.py, which asserted
#   "every tier still gets a vertical pull under shoulder/protect and elbow/protect"
# using the VPULL predicate /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i.
#
# WHY IT IS WRONG, measured not argued. VPULL was written for ONE branch. The comment above
# it in the V193 gate says so in the file's own words: "Vertical-pull vocabulary, hand-listed
# (no row: lowback/protect drops the row pattern)". lowback/protect drops the row, so on THAT
# branch a vertical pull is the only pull left and its absence is the slot being emptied.
# Nowhere else. Measured over the 288-cell wide lattice, builds containing no vertical pull:
#     healthy 10/72   shoulder/protect 19/72   lowback/protect 0/72   elbow/protect 9/72
# — identical in V192 and V193. A predicate that reports ten HEALTHY builds in violation is
# not describing a defect, it is describing a movement family the engine legitimately does
# not draw in every programme. Extending it to shoulder and elbow invented a doctrine claim
# no ruling makes, and on those branches the vertical pull is plausibly the contraindicated
# pattern rather than the required one.
#
# THE CORRECTED TABLE. The claim that IS defensible without a new ruling is that no athlete
# goes fourteen weeks with no pulling at all. Predicate widened to the whole pull vocabulary
# (vertical plus row plus the scap-pull accessories), and it holds:
#     healthy 0/72   shoulder/protect 0/72   lowback/protect 0/72   elbow/protect 0/72
# on BOTH V192 and V193. The vertical-only counts stay in the output as a REPORT with
# denominators, so that if coach ever wants to rule on vertical-pull coverage per branch the
# before-picture is already printed and nobody has to re-measure it.
#
# Anchors asserted count==1 before writing.

import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_gear_gates.js'
src = io.open(P, encoding='utf-8').read()
orig = src

OLD = """// O4 on the other two protect paths as well, same per-build form. A shoulder or elbow
// overlay that leaves an athlete with no pull at all is the same deletion under a
// different overlay.
for (const t of ['shoulder/protect', 'elbow/protect']){
  let empty = 0, miss = [], s0 = '';
  for (const e of EQUIP){
    let n = 0;
    for (const r of BYINJ[t].per[e]) if (r.items.filter(x => VPULL.test(x.name)).length === 0){ n++; empty++; if(!s0) s0 = `${e} ${r.seed}`; }
    if (n) miss.push(e + ' (' + n + '/' + BYINJ[t].per[e].length + ')');
  }
  if (!miss.length) ok(`G6b every ${t} build on every tier gets a vertical pull`);
  else bad(`G6b ${t} leaves NO vertical pull in ${empty} build(s) on: ${miss.join(', ')} (first ${s0}) — the slot was emptied, not substituted`);
}"""

NEW = """// G6b, ON EVERY PATH INCLUDING HEALTHY, with the CORRECT predicate. VPULL above is
// branch-specific by construction: the file's own comment says it carries no row because
// lowback/protect drops the row pattern, so on that one branch the vertical pull is the
// only pull left. It is NOT a general "does this athlete pull" test, and using it as one
// reports ten healthy builds as violations. The general claim, which needs no new ruling,
// is that no athlete goes fourteen weeks with no pulling at all: vertical, horizontal or
// scapular. That is ANYPULL, hand-listed from the movement vocabulary.
const ANYPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm|\\brow\\b|face pull|pull-?apart|\\blat\\b/i;
for (const t of Object.keys(BYINJ)){
  let empty = 0, miss = [], s0 = '', builds = 0;
  for (const e of EQUIP){
    let n = 0;
    for (const r of BYINJ[t].per[e]){
      builds++;
      if (r.items.filter(x => ANYPULL.test(x.name)).length === 0){ n++; empty++; if(!s0) s0 = `${e} ${r.seed}`; }
    }
    if (n) miss.push(e + ' (' + n + '/' + BYINJ[t].per[e].length + ')');
  }
  if (!miss.length) ok(`G6b every ${t} build pulls something (0/${builds} builds with no pull of any kind)`);
  else bad(`G6b ${t} leaves ${empty}/${builds} build(s) with NO pull of any kind on: ${miss.join(', ')} (first ${s0})`);
}
// REPORT ONLY, with denominators, and deliberately not asserted. Vertical-pull coverage per
// branch is a coaching question nobody has ruled on. The numbers are printed so that a
// ruling can be made against a before-picture instead of a fresh measure pass. On V192 and
// V193 alike these read healthy 10/72, shoulder/protect 19/72, lowback/protect 0/72,
// elbow/protect 9/72 — the zero on lowback is the branch doctrine G6 above asserts.
{
  const rep = {};
  for (const t of Object.keys(BYINJ)){
    let n = 0, b = 0;
    for (const e of EQUIP) for (const r of BYINJ[t].per[e]){ b++; if (r.items.filter(x => VPULL.test(x.name)).length === 0) n++; }
    rep[t] = n + '/' + b;
  }
  console.log('  REPORT ONLY — builds with no VERTICAL pull, by injury path ' + JSON.stringify(rep) +
    ' (not asserted: no ruling covers vertical-pull coverage outside the lowback branch)');
}"""

n = src.count(OLD)
if n != 1:
    sys.stderr.write('ABORT: G6b anchor matched %d times (want 1)\n' % n); sys.exit(1)
src = src.replace(OLD, NEW, 1)
if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('OK 1 replacement in %s' % P)
