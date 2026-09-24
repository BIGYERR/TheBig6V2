# v210_closeB.py — V210 close, part B: the version meta bump, 209 -> 210 (Mario authorized).
# The LAST replacement of the V210 build. The artifact carries D70c (slices 1, 2), 2b and D150
# (slice 3); D149 is HELD out of V210 (coach), its parked slice is not in this artifact.
#   python3 tests/edits/v210_closeB.py index.html
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
a = '<meta name="ia-version" content="209">'
b = '<meta name="ia-version" content="210">'
c = src.count(a)
print(f"meta anchor count={c}")
if c != 1:
    sys.exit(f"ABORT: meta anchor count {c}, nothing written")
open(P, 'w', encoding='utf-8').write(src.replace(a, b, 1))
print("written", P)
