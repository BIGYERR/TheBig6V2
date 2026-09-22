#!/usr/bin/env python3
# V202 handoff part 4d — repoint the stale :1260 citation to :1261.
#
# RULING: the part-4 §12 bullet ("THE HANDOFF STILL STATES A REFUTED INVARIANT
# IN FOUR PLACES") cites the prog.weeks open item as `:1260`. The insertion of
# that very bullet pushed the item from 1260 to 1261. A record whose entire
# subject is stale citations may not itself carry a knowingly stale citation.
#
# DEVIATION FROM THE BRIEF, DISCLOSED: the brief expected ONE `:1260`. The
# bullet carries THREE, all naming the same open item. The brief's stated
# contingency is "widen it with surrounding words rather than guessing";
# picking one of three would be guessing, so each of the three gets its own
# widened anchor, each asserted count==1. Scope is unchanged: one citation,
# one number, one file.
#
# Touches IRON_ASYLUM_HANDOFF_1_1.md and nothing else. Literal bytes.

import sys, io

PATH = "IRON_ASYLUM_HANDOFF_1_1.md"

with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

orig = src

# --- Preconditions on the target line -------------------------------------
lines = orig.split("\n")

# 1-indexed line 1261 must genuinely be the prog.weeks open item.
if len(lines) < 1261:
    sys.exit("ABORT: file has %d lines, expected >= 1261" % len(lines))
target = lines[1260]
if not target.startswith("- **`prog.weeks` is still never persisted"):
    sys.exit("ABORT: line 1261 is not the prog.weeks open item:\n  %s" % target[:160])

# Line 1260 must NOT be it (proves the item moved off 1260).
if lines[1259].startswith("- **`prog.weeks` is still never persisted"):
    sys.exit("ABORT: prog.weeks item is still on line 1260; nothing to repoint")

# All three `:1260` citations must live on the part-4 bullet, line 1068.
hits = [i + 1 for i, ln in enumerate(lines) if ":1260" in ln]
if hits != [1068]:
    sys.exit("ABORT: `:1260` appears on lines %r, expected only [1068]" % hits)
if "THE HANDOFF STILL STATES A REFUTED INVARIANT IN FOUR PLACES" not in lines[1067]:
    sys.exit("ABORT: line 1068 is not the part-4 bullet")
if lines[1067].count(":1260") != 3:
    sys.exit("ABORT: expected 3 `:1260` citations on line 1068, found %d"
             % lines[1067].count(":1260"))

# --- Replacements: three widened anchors, each count==1 -------------------
REPL = [
    ("`:1260` is an open item whose headline",
     "`:1261` is an open item whose headline"),
    ("which is the nuance that keeps `:1260` from being simply deleted",
     "which is the nuance that keeps `:1261` from being simply deleted"),
    ("**Priority: `:1260` first**",
     "**Priority: `:1261` first**"),
]

for old, new in REPL:
    n = src.count(old)
    if n != 1:
        sys.exit("ABORT: anchor count==%d (expected 1) for: %s" % (n, old))
    src = src.replace(old, new, 1)
    print("OK  count==1  %s" % old)

if src == orig:
    sys.exit("ABORT: no change produced")

# --- Postconditions --------------------------------------------------------
out = src.split("\n")
if ":1260" in src:
    sys.exit("ABORT: `:1260` survives after rewrite")
if out[1067].count(":1261") != 3:
    sys.exit("ABORT: expected 3 `:1261` on line 1068, found %d" % out[1067].count(":1261"))
if len(out) != len(lines):
    sys.exit("ABORT: line count changed %d -> %d" % (len(lines), len(out)))
if out[1260] != target:
    sys.exit("ABORT: line 1261 was modified; it must be untouched")
if src.count("never persisted") != orig.count("never persisted"):
    sys.exit("ABORT: 'never persisted' instance count moved")

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("WROTE %s  (3 citations repointed :1260 -> :1261, line count %d unchanged)"
      % (PATH, len(out)))
