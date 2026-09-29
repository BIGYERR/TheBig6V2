#!/usr/bin/env python3
# D181 5L licence re-ruling (V224): extend LIC5L_ERAS by one era.
# Ruling: tests/measure/v224_rulings/d181_5l_extension_v224.md
# Touches exactly one file: tests/gates/g222_d181_chain.js. Two edits only.

import sys

PATH = "tests/gates/g222_d181_chain.js"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

def replace_once(text, old, new, label):
    c = text.count(old)
    if c != 1:
        print("ABORT: anchor for %s found %d times (expected 1)" % (label, c))
        sys.exit(1)
    return text.replace(old, new, 1)

# Edit 1: header comment ~:50 — extend the era list in prose.
old_comment = "is a predicate on ia-version, LIC5L_ERAS.includes(VER): eras 222, 223 (each added by a re-ruling that"
new_comment = "is a predicate on ia-version, LIC5L_ERAS.includes(VER): eras 222, 223, 224 (each added by a re-ruling that"
src = replace_once(src, old_comment, new_comment, "header comment ~:50")

# Edit 2: line 86 — extend the LIC5L_ERAS array literal.
old_line = "const LIC5L_ERAS = [222, 223], LIC5L_MAX = 70, LIC5L_OF = 15545;"
new_line = "const LIC5L_ERAS = [222, 223, 224], LIC5L_MAX = 70, LIC5L_OF = 15545;"
src = replace_once(src, old_line, new_line, "LIC5L_ERAS array literal :86")

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("OK: 2 edits applied to %s" % PATH)
