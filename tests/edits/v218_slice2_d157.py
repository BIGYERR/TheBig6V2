#!/usr/bin/env python3
# V218 slice 2a — D157 (coach), the label half. "The sizer reads the same clock as the engine."
# Coach, on builder's two findings from slice 1:
#   - a zero-total target routes to volume (a D157 class; the engine's reader keys on _tgtTotal > 0);
#   - every swim target label is formatted from the TOTAL with the file's single seconds-limb owner
#     _clkMS(sec), never by concatenating the minutes box and the seconds box ("0:75", ":55").
# Sites: the wizard pace line (updateSwimPaceDisplay: gate + label), its initial render in renderWizardStep
# (gate + label), and the sizer warning in calcProgramLength (label). The sizer arithmetic, _swimEntryState,
# _goalInputsValid and the run-side readers are not touched. renderWizardStep owns a local `const total`
# (the step count), so the template inlines the engine's parse instead of naming a variable.
# No version bump in this slice (Mario owns the bump; brief says do not bump).
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
  # E3: updateSwimPaceDisplay gates on the total; totalSecs hoisted above the gate, engine's parse.
  ("  if(!el || !g) return;\n"
   "  if(g.targetMins === undefined || g.targetMins === '') { el.style.display = 'none'; return; }\n"
   "  const dist = SWIM_GOAL_DIST[g.id] || 500;\n"
   "  const unit = g.swimUnit || 'yd';\n"
   "  const totalSecs = (+(g.targetMins||0)*60) + (+(g.targetSecs||0));\n",
   "  if(!el || !g) return;\n"
   "  const totalSecs = (+g.targetMins||0)*60 + (+g.targetSecs||0);   // V218 (D157): the target is its total, the engine's parse\n"
   "  if(!(totalSecs > 0)) { el.style.display = 'none'; return; }\n"
   "  const dist = SWIM_GOAL_DIST[g.id] || 500;\n"
   "  const unit = g.swimUnit || 'yd';\n"),
  # E4: the pace line label is the total, formatted by _clkMS.
  ("el.innerHTML = asyIcon('🎯',13)+' ' + (g.targetMins||0) + ':' + String(g.targetSecs||0).padStart(2,'0') + ' — ' + pace + ' (' + unit + ')';",
   "el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(totalSecs) + ' — ' + pace + ' (' + unit + ')';   // V218 (D157): label from the total"),
  # E5: the initial render in renderWizardStep: display gate and label read the total.
  ("display:${(g.targetMins!==undefined&&g.targetMins!=='')?'block':'none'}\">${asyIcon('🎯',13)} ${g.targetMins||''}:${String(g.targetSecs||0).padStart(2,'0')} — ${formatPacePer100(((+g.targetMins||0)*60)+(+g.targetSecs||0),SWIM_GOAL_DIST[g.id])||''}",
   "display:${(((+g.targetMins||0)*60)+(+g.targetSecs||0))>0?'block':'none'}\">${asyIcon('🎯',13)} ${_clkMS(((+g.targetMins||0)*60)+(+g.targetSecs||0))} — ${formatPacePer100(((+g.targetMins||0)*60)+(+g.targetSecs||0),SWIM_GOAL_DIST[g.id])||''}"),
  # E6: the sizer warning label is the total the sizer just read (tTotal, var in the same block).
  ("var sTimeLbl = (goal.targetMins||0)+':'+(String(goal.targetSecs||0).padStart(2,'0'));",
   "var sTimeLbl = _clkMS(tTotal);   // V218 (D157): label from the total the sizer just read"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor E%d count %d: %r' % (i + 3, n, a[:80])); sys.exit(2)
for i, (a, b) in enumerate(EDITS):
    src = src.replace(a, b, 1)
    print('applied E%d' % (i + 3))
bad = [s for s in ["g.targetMins === undefined || g.targetMins === ''",
                   "(g.targetMins||0) + ':' + String(g.targetSecs||0).padStart(2,'0')",
                   "${g.targetMins||''}:${String(g.targetSecs||0)",
                   "(goal.targetMins||0)+':'+(String(goal.targetSecs||0)"] if src.count(s) != 0]
if bad or src.count('_clkMS(totalSecs)') != 1 or src.count('var sTimeLbl = _clkMS(tTotal);') != 1:
    print('ABORT: post-condition', bad); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
