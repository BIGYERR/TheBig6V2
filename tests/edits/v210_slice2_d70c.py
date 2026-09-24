# v210_slice2_d70c.py — V210 slice 2 of D70c (coach-ruled, Mario concurred; handoff §12 "D70c").
# The Secondary compound and the Arms/Delts finisher pass the lens. Anchors and replacements are
# coach's surgery VERBATIM (tests/measure/v209_d70c_surgery.py, D70c-B1 two anchors, D70c-B2 two
# anchors). Applies on top of slice 1 (tests/edits/v210_slice1_d70c.py). With B1 wrapped in _gear,
# slice 1's barbell clause (A1) now binds: home_basic 18 to 35 hypertrophy loses Incline barbell
# press and Close-grip bench press from the Secondary compound (Mario: the one dumbbell press the
# main did not take; accepted, watch).
#   python3 tests/edits/v210_slice2_d70c.py index.html
# No ia-version bump in this slice.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
 # D70c-B1: the Secondary compound's loaded ternary passes the lens (open)
 ("          isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']",
  "          _gear(isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']"),
 # D70c-B1: (close)
 ("                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press']\n        ).filter(x=>x!==ex.chestMain);",
  "                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press'])\n        ).filter(x=>x!==ex.chestMain);"),
 # D70c-B2: the finisher's first pick (biceps on arms days, delts otherwise)
 ("const _fA=_armsDay?EXLIB.biceps.filter(_noBar):EXLIB.shoulder_iso;",
  "const _fA=_armsDay?(isBW?EXLIB.biceps:bicepsAccPool).filter(_noBar):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"),
 # D70c-B2: the finisher's second pick (triceps on arms days, delts otherwise)
 ("const _fB=_armsDay?EXLIB.triceps:EXLIB.shoulder_iso;",
  "const _fB=_armsDay?(isBW?EXLIB.triceps:_gear(EXLIB.triceps)):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"),
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
