#!/usr/bin/env python3
# V226 slice 1 of 7: D188 P-BEGINNERMILE engine reads (E1, E3, E4 + comment, E5).
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (Mario "all yes", 2026-09-30).
# ia-version is NOT bumped in this slice (stays 225; slice 6 bumps it to 226).
# Every anchor asserted count==1 before anything is written; all four edits or none.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

EDITS = [
    # E1 :2433 assessRunPaceCeiling
    ("const mileBest = (exp !== 'beginner' && g.mileBestMins",
     "const mileBest = (g.mileBestMins"),
    # E3 :3179 calcProgramLength
    ("var _mileBestSecs = (experience !== 'beginner' && goal.mileBestMins",
     "var _mileBestSecs = (goal.mileBestMins"),
    # E4 :3812 comment + :3815 buildRunSession (one hunk)
    ("  // otherwise fall back to experience-based defaults. Beginner always uses default (11:30/mi).\n"
     "  // mileBestSecs pre-converted and passed as arguments[12] from the schedule builder.\n"
     "  const _expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience||'intermediate'] || 570;\n"
     "  const _mileBestSecs = (experience !== 'beginner' && arguments[12]) ? arguments[12] : null;\n",
     "  // otherwise fall back to experience-based defaults. A beginner's entry is read like anyone's (D188).\n"
     "  // mileBestSecs pre-converted and passed as arguments[12] from the schedule builder.\n"
     "  const _expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience||'intermediate'] || 570;\n"
     "  const _mileBestSecs = arguments[12] ? arguments[12] : null;\n"),
    # E5 :4376 buildNRCSession
    ("(experience !== 'beginner' && mileBestSecs) ? mileBestSecs : expCurrentPace",
     "mileBestSecs ? mileBestSecs : expCurrentPace"),
]

with open(PATH, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

for old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor count %d != 1: %r' % (n, old[:90]))

out = src
for old, new in EDITS:
    assert out.count(old) == 1
    out = out.replace(old, new, 1)

if out == src:
    sys.exit('ABORT: no change')

with open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(out)
print('v226_edit_1: 4 edits written')
