#!/usr/bin/env python3
# V193 slice 4 — D48, amending D47.
# The D47 clause "if(s&&s.optional) return false;" made every optional section unprotected
# outright, which deleted 62 of 540 core sections. Coach amended it: an optional section is
# unprotected only while it still has something to give. Literal bytes only, anchors asserted.
import io, sys

P = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(P, encoding="utf-8").read()

edits = []

# 1) The clause itself.
edits.append((
    "    if(s&&s.optional) return false;\n",
    "    if(s && s.optional && ((s.items||[]).length>1)) return false;\n",
))

# 2) The rationale comment: fold D48's amendment onto the tail of the D47 block.
old_tail = (
    "    // lets it be reached. Nothing else moves: the budget value, the cost model, the barbell\n"
    "    // tier-3 guard and every non-optional protection are untouched.\n"
)
new_tail = (
    "    // lets it be reached. Nothing else moves: the budget value, the cost model, the barbell\n"
    "    // tier-3 guard and every non-optional protection are untouched.\n"
    "    // V193 (D48, amending D47): the bare optional test went too far and deleted 62 of 540\n"
    "    // core sections. An optional section is unprotected only while it still has something\n"
    "    // to give. Taking from a section with one item left is not trimming it, it is deleting\n"
    "    // it, and deleting a training quality is the exact disease D47 was written to cure,\n"
    "    // just relocated from prehab to trunk. length>1 is not a tunable: 1 is the boundary\n"
    "    // between nonempty and empty, not a chosen constant. A floor expressed in SETS was\n"
    "    // considered and rejected as a genuinely invented constant with no table behind it.\n"
    "    // Thin core is an acceptable outcome: one hard trunk piece done properly on a tight\n"
    "    // day is a coachable prescription. Zero trunk is not.\n"
)
edits.append((old_tail, new_tail))

for old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write("ANCHOR MISS (count=%d):\n%s\n" % (n, old))
        sys.exit(1)

for old, new in edits:
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("v193_d48_edit: %d replacements applied" % len(edits))
