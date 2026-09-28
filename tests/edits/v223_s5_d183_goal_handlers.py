#!/usr/bin/env python3
# V223 slice S5 (D183 slice S2) of D183 (P-SAFEPACE), per tests/measure/v223_rulings/p_safepace_ruling.md
# R2 (as re-ruled): "The one repaint function KEEPS the name `updateRaceDateFeedback` ... `updatePaceFeasibility`
# and `updatePaceDisplay` become its internals; the goal, mile, date and toggle handlers and the
# `renderWizardStep` tail call it". This slice re-points the three run GOAL handlers and decouples the internals.
#   E1  D183-handler-repoint(goal)  targetDist oninput: updatePaceDisplay() -> updateRaceDateFeedback()
#       (plan flag 1g: the distance input also called updatePaceDisplay, so it routes through the fold too).
#   E2  D183-handler-repoint(goal)  targetMins oninput: ...updatePaceTime('run');updatePaceDisplay() -> ...;updateRaceDateFeedback()
#   E3  D183-handler-repoint(goal)  targetSecs oninput: the same.
#   E4  D183-internal-decouple      updatePaceDisplay's tail `updatePaceFeasibility();` goes, so the internals stop
#       cross-calling; the fold calls updatePaceDisplay() then updatePaceFeasibility(_f) itself. The guard lines
#       at the head of updatePaceDisplay (D163's minutes-box check) are outside the anchor and stay byte-identical.
# No athlete-facing string lands. No ia-version bump (stays 222). Every anchor is asserted count==1 before
# anything is written; the first miss aborts and nothing is written.
# Usage: v223_s5_d183_goal_handlers.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: ia-version is not 222; nothing written'); sys.exit(1)
# S1 must be on the tree: the fold calls both internals, and updatePaceFeasibility takes the ceiling.
for tok in ('function wizardTestPin(', 'function progLenLineHTML(',
            '  updatePaceDisplay();\n  updatePaceFeasibility(_f);\n  const feedback = document.getElementById(\'raceDateFeedback\');',
            'function updatePaceDisplay() {', 'function updateRaceDateFeedback() {'):
    if src.count(tok) != 1:
        print('ABORT: precondition %r not found exactly once; nothing written' % tok); sys.exit(1)

EDITS = []

E1_OLD = "oninput=\"WD.cardioGoals['run'].targetDist=this.value;updatePaceDisplay()\""
E1_NEW = "oninput=\"WD.cardioGoals['run'].targetDist=this.value;updateRaceDateFeedback()\""
EDITS.append(('E1 handler-repoint(goal) targetDist', E1_OLD, E1_NEW))

E2_OLD = "oninput=\"WD.cardioGoals['run'].targetMins=this.value;updatePaceTime('run');updatePaceDisplay()\""
E2_NEW = "oninput=\"WD.cardioGoals['run'].targetMins=this.value;updatePaceTime('run');updateRaceDateFeedback()\""
EDITS.append(('E2 handler-repoint(goal) targetMins', E2_OLD, E2_NEW))

E3_OLD = "oninput=\"WD.cardioGoals['run'].targetSecs=this.value;updatePaceTime('run');updatePaceDisplay()\""
E3_NEW = "oninput=\"WD.cardioGoals['run'].targetSecs=this.value;updatePaceTime('run');updateRaceDateFeedback()\""
EDITS.append(('E3 handler-repoint(goal) targetSecs', E3_OLD, E3_NEW))

E4_OLD = "  el.style.display = 'block';\n  updatePaceFeasibility();\n}\n"
E4_NEW = "  el.style.display = 'block';\n}\n"
EDITS.append(('E4 internal-decouple', E4_OLD, E4_NEW))

for name, old, new in EDITS:
    n = src.count(old)
    print('%s anchor count: %d' % (name, n))
    if n != 1:
        print('ABORT: %s anchor count %d != 1; nothing written' % (name, n)); sys.exit(1)

out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        print('ABORT: %s anchor drifted during apply; nothing written' % name); sys.exit(1)
    out = out.replace(old, new, 1)

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE %s (%d -> %d bytes)' % (PATH, len(src.encode('utf-8')), len(out.encode('utf-8'))))
