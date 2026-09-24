# v210_slice1_d70c.py — V210 slice 1 of D70c (coach-ruled, Mario concurred; handoff §12 "D70c").
# THE INVENTORY'S DENIAL BINDS: the pools that bypassed _gearOK now pass it.
# Anchors and replacements are coach's surgery (tests/measure/v209_d70c_surgery.py, edits 1, 3, 4, 5),
# re-verified count==1 on V209 by tests/measure/v210_d70c_remeasure.js. One deliberate difference, and
# it is scope, not design: edit 1 KEEPS 'glute-ham' in the barbell clause (moved to the tail). Its exit
# into a GHD clause of its own is D149 (slice 4), which the queue holds last so it can be held alone;
# dropping the token here would unblock it on no-barbell tiers before the GHD clause exists.
# Slice 4 deletes '|glute-ham' from this line and the result is byte-equal to the surgery's.
#   python3 tests/edits/v210_slice1_d70c.py index.html
# No ia-version bump in this slice (the bump is Mario's, on the final slice).
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
 # D70c-A1: the barbell clause sees a mid-name barbell and the close-grip bench (token from _BW_GEAR)
 ("if(!hasBarbell && /^barbell |^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|glute-ham/i.test(N)) return false;",
  r"if(!hasBarbell && /\bbarbell\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench|glute-ham/i.test(N)) return false;"),
 # D70c-A2: the older hypertrophy chest compound passes the lens
 ("let chestCompoundPool=hasBarbell?(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):",
  "let chestCompoundPool=hasBarbell?_gear(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):"),
 # D70c-A3: the squat pool (squat_joint included) passes the lens
 ("let squatPool=hasBarbell?(olderHyp?EXLIB.squat_joint:EXLIB.squat):",
  "let squatPool=hasBarbell?_gear(olderHyp?EXLIB.squat_joint:EXLIB.squat):"),
 # D70c-A4: the hypertrophy chest accessory pool passes the lens (bodyweight keeps its own sweep)
 ("const chestPoolRaw=isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc;",
  "const chestPoolRaw=isBW?(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc):_gear(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc);"),
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
