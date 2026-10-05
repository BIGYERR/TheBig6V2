#!/usr/bin/env python3
# V231 slice 1 of 6 (engine): D195 P-HIPEXT part B.
# The budget's cost lens is brought to the V100 docstring (cost side):
# _cost prices an item at 0.5x when _isHalf(name) matches OR the name is a
# member of EXLIB.hip_stability, knee_stability, foot_ankle or foot_ankle_bw.
# Membership, not a longer regex. Nothing else in capSessionBudget moves.
# No ia-version bump in this slice (slice 6 bumps).
import sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"

with open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

REPLS = [
    (
        "  const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
        "  const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };",
    ),
]

for i, (old, new) in enumerate(REPLS):
    n = src.count(old)
    print("anchor %d count=%d" % (i, n))
    if n != 1:
        print("ABORT: anchor %d count %d != 1" % (i, n))
        sys.exit(1)
    src = src.replace(old, new, 1)

with open(PATH, "w", encoding="utf-8", newline="") as f:
    f.write(src)
print("WROTE", PATH)
