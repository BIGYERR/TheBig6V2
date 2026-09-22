#!/usr/bin/env python3
# V202 slice 5 — E7 + E12. The pace clock HOLDS at current; it never drops to a slower goal.
#
# E7  the progression builder works on min(goalPace, initialPace). _originalTarget keeps the
#     ENTERED goal so copy can still compare the two. _dampened stays false for this class:
#     the goal is not out of reach, it is already met.
# E12 the class gets its own note, coach's ruled string verbatim.
#
# NOT TOUCHED by this script: ia-version (the final slice owns the bump), the INT branch
# (slice 3 is final), the anchor arithmetic (slices 1/1b are final), the D101 dampened note
# from slice 2, the D2b-iii PACE CLOCK appendix.
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PATH = os.path.join(ROOT, 'index.html')
src = io.open(PATH, encoding='utf-8').read()

EDITS = []
def sub(name, old, new):
    EDITS.append((name, old, new))

# ── E7a — the working target is clamped to the anchor ─────────────────────────
sub('E7a working target = min(entered goal, anchor)',
"""    const initialPace  = buildRunProgressionForLength._initialPace  || expPaceDefaults[exp] || 570;
    const targetPace   = buildRunProgressionForLength._targetPace   || initialPace * 0.85;
""",
"""    const initialPace  = buildRunProgressionForLength._initialPace  || expPaceDefaults[exp] || 570;
    // E7 (V202): THE CLOCK HOLDS AT CURRENT, IT NEVER DROPS TO A SLOWER GOAL.
    // An athlete whose entered goal is at or slower than the pace they already run AT THE
    // GOAL DISTANCE used to have the whole block parked on the GOAL, which prescribed them
    // slower work than they already do (beginner/km, mile 11:30, goal 2 km in 16:00 read
    // 772.9 s/mi for all six weeks against an anchor of 698.6). The working target is the
    // faster of the two. The ENTERED goal is kept separately so copy can still name it.
    const enteredTarget  = buildRunProgressionForLength._targetPace   || initialPace * 0.85;
    const goalAlreadyMet = enteredTarget >= initialPace;
    const targetPace   = Math.min(enteredTarget, initialPace);
""")

# ── E7b — meta: _originalTarget keeps the ENTERED goal, _goalMet flags the class ──
# rawImprovement is 0 for this class, so weeklyImprovement is 0 and _dampened is false by
# the existing expression: the goal is not out of reach, it is already met. The flat array
# therefore sits on initialPace, not on the goal.
sub('E7b _originalTarget keeps the entered goal; _goalMet published',
"""    paceProgression._originalTarget  = +targetPace.toFixed(1);
""",
"""    paceProgression._originalTarget  = +enteredTarget.toFixed(1);
    paceProgression._goalMet         = goalAlreadyMet;
""")

# ── E12 — the note for the class ──────────────────────────────────────────────
# Placed ABOVE the dampened branch, not below it: the two are mutually exclusive on
# _dampened (false here by construction) but the dampened branch also fires on _psShift,
# and its sentence "your full goal needs more weeks than this block has" is false for an
# athlete whose goal is already met. The dampened branch and its PACE CLOCK appendix are
# otherwise untouched.
sub('E12 goal-already-met note',
"""          } else if(pp._dampened || _psShift > 0) {
""",
"""          } else if(pp._goalMet) {
            note = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
          } else if(pp._dampened || _psShift > 0) {
""")

# ── assert every anchor count==1 BEFORE writing anything ──────────────────────
fail = False
for name, old, new in EDITS:
    n = src.count(old)
    print('  anchor %-52s count=%d' % (name, n))
    if n != 1:
        fail = True
        print('    ABORT: expected exactly 1 occurrence')
if fail:
    sys.exit('ABORTED: no bytes written')

for name, old, new in EDITS:
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d replacements)' % (PATH, len(EDITS)))
