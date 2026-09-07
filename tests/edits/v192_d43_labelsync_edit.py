# -*- coding: utf-8 -*-
# V192 fix pass (no version bump — same unreleased build).
#
# Fix 1 — the label latch in applyInjuryFilter.
#   applyInjuryFilter rewrites an item's NAME (P.swapNames, SPINE_SWAP) and then
#   re-emits the section with `{...s,items}`, never touching `s.label`. Section
#   labels embed the drawn movement ('Main — '+ex.chestMain), so a shoulder/
#   workaround athlete read 'Main — Dumbbell bench press' over a prescribed
#   'Dumbbell floor press', and 'Primer — Dumbbell bench press' in race week.
#   bodyweightSweep already solved this at the same seam; this mirrors its shape.
#   Scope: swap paths ONLY. The dropNames class ('Main — Pike pushups' with the
#   item deleted) is a different mechanism and is parked to §12 by Mario.
#
# Fix 2 — g192_shoulder_side's equipment lattice named three tiers that do not
#   exist ('full','home','travel'); all three fell through to hasBarbell=false,
#   so the gate exercised exactly one barbell tier. Replaced with the real six.
import io, sys

def edit(path, pairs):
    src = io.open(path, encoding='utf-8').read()
    for i, (old, new) in enumerate(pairs):
        n = src.count(old)
        if n != 1:
            sys.exit('ABORT %s replacement %d: anchor count==%d (need 1)\n---\n%s' % (path, i + 1, n, old[:200]))
        src = src.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(src)
    print('OK %s: %d replacement(s)' % (path, len(pairs)))

# ── index.html ───────────────────────────────────────────────────────────────
A1_OLD = """  sections.forEach(s=>{
    if(!s||!Array.isArray(s.items)){out.push(s);return;}
    const seen=new Set();
    const items=[];
"""
A1_NEW = """  sections.forEach(s=>{
    if(!s||!Array.isArray(s.items)){out.push(s);return;}
    const seen=new Set();
    const items=[];
    // Section-local copy of the heading. Rewritten below when a swap renames the
    // item the heading names; s itself is never mutated (this pass runs several
    // times per day and must stay idempotent).
    let label=s.label;
"""

A2_OLD = """      if(seen.has(name)) return;  // swaps can collide with an existing pick
      seen.add(name);
      items.push({...it,name,detail});
    });
    if(items.length) out.push({...s,items});
"""
A2_NEW = """      if(seen.has(name)) return;  // swaps can collide with an existing pick
      seen.add(name);
      // Labels embed the drawn movement ('Main — Dumbbell bench press'), so a
      // swapped item used to leave the heading naming a lift the athlete is not
      // prescribed — and on the no-gear tier, naming a dumbbell he does not own.
      // §10b: a conditional write with no else branch is a latch. The claim belongs
      // to the item, so the heading follows the item it describes. Covers both
      // rename paths above (P.swapNames and SPINE_SWAP); applied only once the item
      // survives, and only after the collision check, so a dropped swap leaves the
      // heading alone. bodyweightSweep runs the same sync for its substitutions.
      if(name!==it.name && label && label.indexOf(it.name)>=0) label=label.split(it.name).join(name);
      items.push({...it,name,detail});
    });
    if(items.length) out.push(label===s.label?{...s,items}:{...s,label,items});
"""

edit('index.html', [(A1_OLD, A1_NEW), (A2_OLD, A2_NEW)])

# ── tests/gates/g192_shoulder_side.js ────────────────────────────────────────
G_OLD = "const EQUIP = ['crossfit', 'full', 'home', 'minimal', 'bodyweight', 'travel'];"
G_NEW = ("// The six real equipment tiers (index.html: hasBarbell = home_full|commercial|\n"
         "// crossfit). 'full', 'home' and 'travel' are not tier ids — they fell through to\n"
         "// hasBarbell=false, so this lattice used to exercise exactly ONE barbell tier.\n"
         "const EQUIP = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];")

edit('tests/gates/g192_shoulder_side.js', [(G_OLD, G_NEW)])
