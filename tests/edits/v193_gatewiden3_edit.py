#!/usr/bin/env python3
# V193 gate widening, part 3 — g193_gear_gates.js only. Does NOT touch index.html.
#
# THE BUG THIS FIXES, and it is the counter-lesson to the whole widening.
# Widening a lattice STRENGTHENS a universal claim ("this movement never prints on a tier
# that owns no implement for it") and WEAKENS an existential one ("this slot still gets
# filled somewhere"). G6 is existential: `countBy(LOWBACK.per[e], VPULL) > 0` per tier.
# Going from 5 builds per tier to 12 gave it seven more chances to find one vertical pull,
# so it stopped failing. PROOF, not inference: sabotage mutation S10 replaces the whole
# vertical-pull array with ['Dumbbell row'] and, after part 1 and part 2 of this widening,
# the mutated file scored PASS 164 FAIL 1 — byte-identical to the unmutated candidate,
# because the only failure left was the pre-existing G3b. S10 was a FALSE TRIP.
#
# THE FIX: an existential claim is asked PER CELL. The doctrine is per program anyway —
# "this athlete keeps a pull" is a statement about one athlete's 14 weeks, not about a pool
# of twelve athletes' programs pooled together. Per cell, more builds is more evidence and
# never a lower bar. Anchors asserted count==1 before writing.

import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_gear_gates.js'
src = io.open(P, encoding='utf-8').read()
orig = src
reps = []
def rep(old, new, tag): reps.append((old, new, tag))

rep(
"""const VPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i;
let pullFilled = 0, pullMissing = [];
for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  const n = countBy(LOWBACK.per[e], VPULL);
  if (n > 0) pullFilled++; else pullMissing.push(e);
}""",
"""const VPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i;
// PER BUILD, not per tier. An existential claim gets WEAKER as the lattice widens: pooling
// twelve programs per tier and asking "did any of them contain a pull" is a lower bar than
// asking it of five. The doctrine is per athlete anyway — this branch's promise is that
// THIS athlete keeps a pull, over THESE fourteen weeks. Asked per build, more builds is
// more evidence and never a lower bar. (Sabotage S10 proved the pooled form had gone
// no-op: it emptied the vertical-pull array outright and G6 still passed.)
let pullFilled = 0, pullMissing = [], pullEmptyBuilds = 0, pullSample = '';
for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  let bad_e = 0;
  for (const r of LOWBACK.per[e]){
    if (r.items.filter(x => VPULL.test(x.name)).length === 0){
      bad_e++; pullEmptyBuilds++;
      if (!pullSample) pullSample = `${e} ${r.seed}`;
    }
  }
  if (!bad_e) pullFilled++; else pullMissing.push(e + ' (' + bad_e + '/' + LOWBACK.per[e].length + ' builds)');
}""",
'G6 per build')

rep(
"""if (pullMissing.length === 0) ok(`G6 every cable-less tier still gets a vertical pull under lowback/protect (${pullFilled} tiers)`);
else bad(`G6 lowback/protect leaves NO vertical pull on: ${pullMissing.join(', ')} — the slot was emptied, not substituted`);
// O4 on the other two protect paths as well. A shoulder or elbow overlay that leaves an
// athlete with no pull at all is the same deletion under a different overlay.
for (const t of ['shoulder/protect', 'elbow/protect']){
  const miss = EQUIP.filter(e => countBy(BYINJ[t].per[e], VPULL) === 0);
  if (!miss.length) ok(`G6b every tier still gets a vertical pull under ${t}`);
  else bad(`G6b ${t} leaves NO vertical pull on: ${miss.join(', ')} — the slot was emptied, not substituted`);
}""",
"""if (pullMissing.length === 0) ok(`G6 EVERY lowback/protect build on a cable-less tier gets a vertical pull (${pullFilled} tiers, 0 empty builds)`);
else bad(`G6 lowback/protect leaves NO vertical pull in ${pullEmptyBuilds} build(s) on: ${pullMissing.join(', ')} (first ${pullSample}) — the slot was emptied, not substituted`);
// O4 on the other two protect paths as well, same per-build form. A shoulder or elbow
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
}
// The same weakening applies to every other "still reaches" claim in this file. G2, G5, G9,
// G9b and G12b are all pooled existentials and all got easier when the lattice tripled.
// They are kept pooled ON PURPOSE and the reason is written here rather than left implied:
// each of those is a tripwire against a movement being DELETED FROM THE APP, not against it
// being missing from one athlete's fourteen weeks, and a movement can legitimately be absent
// from any single build without anything being wrong. G6 is different because its subject
// is one athlete's programme, not the inventory. If a future ruling makes any of the others
// a per-athlete promise, it moves to the per-build form above.""",
'G6/G6b per build reporting')

for old, new, tag in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (want 1)\n' % (tag, n)); sys.exit(1)
    src = src.replace(old, new, 1)
if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('OK %d replacements in %s' % (len(reps), P))
