#!/usr/bin/env python3
# V212 slice 1 — D110a swim clock (coach ruled, Mario concurred, incl. the 4/3/2 s/100/wk x age
# scale as an app ruling). Anchor and replacement text is VERBATIM from coach's proven surgery
# (scratchpad d110_grid2.js, S1/S2/S2b/S3), re-verified by measure on V211
# (tests/measure/v212swim_remeasure.js: every anchor count 1, athlete A 0401b2c3caa741f2 -> 402d3dde836e875c).
#   S1  one rate on one clock: the weekly gain ceiling IS the 4/3/2 x age rate (the 2.5x / 6 s cap goes).
#   S2  E7 mirror: a goal slower than the current split holds at the current split.
#   S2b metadata: _originalTarget reports the ENTERED target; _goalMet/_baseEntered/_expDefault/_dist
#       are written for the slice 2 notes (no reader in this slice).
#   S3  Guide A p12: the INT rep split is this week's goal split minus 2 s, not x0.97.
# No ia-version bump in this slice (Mario owns the bump). Aborts on the first anchor miss.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

EDITS = [
 ('S1 cap',
  "const maxImprove = Math.min(6, baseImprove * 2.5); // physiological ceiling",
  "const maxImprove = baseImprove;"),
 ('S2 E7 hold',
  "    if(targetPace100) {\n      const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;",
  "    if(targetPace100) {\n      const enteredTarget100 = targetPace100; const goalAlreadyMet = enteredTarget100 >= initialPace100; targetPace100 = Math.min(enteredTarget100, initialPace100);\n      const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;"),
 ('S2b meta',
  "swimPace._originalTarget = +targetPace100.toFixed(1);",
  "swimPace._originalTarget = +enteredTarget100.toFixed(1); swimPace._goalMet = goalAlreadyMet; swimPace._baseEntered = initialPace100 !== expPace100 || (swimGoal.baseMins !== undefined && swimGoal.baseMins !== ''); swimPace._expDefault = expPace100; swimPace._dist = fixedDist;"),
 ('S3 -2s',
  "const intPace = Math.max(swimPace._realisticTarget * 0.97, weekPace * 0.97); // slightly faster than goal",
  "const intPace = weekPace - 2;"),
]

src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        print('ABORT:', tag, 'anchor count', n); sys.exit(1)
    src = src.replace(a, b, 1)
    print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
