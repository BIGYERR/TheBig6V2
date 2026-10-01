#!/usr/bin/env python3
# V226 slice 3b of 7: D188 P-BEGINNERMILE class F (comments only). Two comments stated the
# pre-D188 beginner gate on the mile and are false after slices 1-3. Session-ruled text.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (Mario "all yes", 2026-09-30).
# No ia-version bump in this slice (stays 225). All anchors count==1 or nothing is written.
import sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = open(PATH, encoding="utf-8").read()

EDITS = [
    # C1: assessRunPaceCeiling mile-read comment
    ("C1",
     "present (non-beginner), otherwise the experience-default",
     "present (any level since D188), otherwise the experience-default"),
    # C2: V176 (D9) comment above _mileEntryState
    ("C2",
     "// clamp will do BEFORE the build. Beginners never see the field; their entry is\n"
     "// ignored by every consumer, so they pass clean.\n"
     "function _mileEntryState(g, exp){",
     "// clamp will do BEFORE the build. D188: beginners see the field too and their\n"
     "// entry is read, so D9 judges it at every level; a blank stays optional for them.\n"
     "function _mileEntryState(g, exp){"),
]

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit("ABORT %s: anchor count %d != 1; nothing written" % (name, n))

out = src
for name, old, new in EDITS:
    out = out.replace(old, new, 1)
    print("applied", name)

open(PATH, "w", encoding="utf-8").write(out)
print("wrote", PATH)
