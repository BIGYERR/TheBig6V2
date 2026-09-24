#!/usr/bin/env python3
# V218 slice 1 — D157 (coach): "The sizer reads the same clock as the engine."
# calcProgramLength's two swim gates keyed on the MINUTES box; the engine (buildSwimSession, D110a)
# keys on the TOTAL. Blank or "0" minutes with "55" seconds is 55 seconds. Both gates now read the
# total with the engine's parse (+m||0)*60+(+s||0) > 0; a 0:00 still falls to the volume / default path.
# Mirrors measure's surgery exactly (tests/measure/v218_d157_swim_sizer.js, anchors A1/R1 and A2/R2).
# The arithmetic lines after each gate already read the total and are not touched.
# No version bump in this slice (Mario owns the bump; brief says do not bump).
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
  # E1: the target gate reads the total.
  ("var swimTimeEntered = isSwimTimeGoal && goal.targetMins !== undefined && goal.targetMins !== '';",
   "var swimTimeEntered = isSwimTimeGoal && ((+goal.targetMins||0)*60 + (+goal.targetSecs||0)) > 0;"),
  # E2: the current gate reads the total. The inner if(bTotal > 0) is the engine's parse, so the
  # minutes-box condition goes and the block stays (measure's R2, byte for byte).
  ("if(goal.baseMins !== undefined && goal.baseMins !== '') {\n          var bTotal = (+goal.baseMins||0)*60 + (+goal.baseSecs||0);",
   "{\n          var bTotal = (+goal.baseMins||0)*60 + (+goal.baseSecs||0);"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor E%d count %d: %r' % (i + 1, n, a[:80])); sys.exit(2)
for i, (a, b) in enumerate(EDITS):
    src = src.replace(a, b, 1)
    print('applied E%d' % (i + 1))
if src.count("((+goal.targetMins||0)*60 + (+goal.targetSecs||0)) > 0;") != 1 \
   or src.count("goal.baseMins !== undefined && goal.baseMins !== ''") != 0 \
   or src.count("goal.targetMins !== undefined && goal.targetMins !== ''") != 0:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
