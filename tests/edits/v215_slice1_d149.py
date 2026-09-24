# v215_slice1_d149.py — V215 slice 1: D149 (coach-ruled; Mario: no GHD at a home gym).
# THE GHD IS A STATION. hasGHD = commercial || crossfit.
# Edits 1-3 are the parked V210 slice 4 VERBATIM (scratchpad parked_v210_slice4_d149.py; coach's
# surgery D149-D1..D3). Edits 4-5 are the parked slice 5 literals (D149-D4a ankle/protect, D149-D4b
# hip/protect). Measure verified every anchor count==1 on V214 (tests/measure/v215_d149_remeasure.js);
# the result must be byte-equal to measure's cf0 arm (scratchpad v215d149/arm_cf0.html).
#   python3 tests/edits/v215_slice1_d149.py index.html
# No ia-version bump (Mario owns it; not in this slice).
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
 # D149-D1: the cell
 ("  const hasCables=equip==='commercial';",
  "  const hasCables=equip==='commercial';\n  const hasGHD=equip==='commercial'||isCrossfit;"),
 # D149-D2: the GHD tokens leave the barbell clause for their own
 ("|close-grip bench|glute-ham/i.test(N)) return false;",
  "|close-grip bench/i.test(N)) return false;\n    if(!hasGHD && /glute-ham|\\bghr\\b|45° back extension/i.test(N)) return false;"),
 # D149-D3: the sidecar lens agrees
 ("  if(/cable|pec deck/.test(N)) return equip==='commercial';",
  "  if(/glute-ham|\\bghr\\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';\n  if(/cable|pec deck/.test(N)) return equip==='commercial';"),
 # D149-D4a: ankle/protect literal goes through the gear gate on the barbell tiers
 ("squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?['Barbell hip thrust','45° back extension']:['Banded hip thrust','Single-leg glute bridge'];",
  "squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];"),
 # D149-D4b: hip/protect hip extension reads the station
 ("        hipExtPool = ['45° back extension'];",
  "        hipExtPool = hasGHD?['45° back extension']:['Bodyweight back extension'];"),
]
for i, (a, b) in enumerate(EDITS, 1):
    c = src.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1:
        sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print("written", P)
