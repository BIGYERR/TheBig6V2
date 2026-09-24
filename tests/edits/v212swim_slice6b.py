#!/usr/bin/env python3
# V212 slice 6b — coach ruled builder's three slice 6 findings. Runs on slices 1-6. Two edits:
#   1  the ENGINE goal-time reader: total > 0 under the same limb rule as the current time (the
#      minutes box is a limb), so a 0:55 goal builds a progression. _swimTot moves up to serve it.
#      The SIZER's current and goal readers stay on the minutes box, queued as D157 (measure
#      first); the code comment says the two readers differ on purpose until then. Cards change,
#      program length does not.
#   2  the D144 floor: when gap100 >= E (the anchor pace) the target is E, so the E7 hold fires
#      (hold at E, goal met note). A card never carries a target that is not a swim.
# (Finding 1, the D1 block target, is gate only: the line oracle stays and a dampened pin is added.)
# No ia-version bump. Aborts on the first anchor miss, before writing anything.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
EDITS = [
 ('1 goal reader, total > 0 (D157 note)',
  """    if(swimGoal.targetMins !== undefined && swimGoal.targetMins !== '') {
      const tTotal = (+swimGoal.targetMins||0)*60 + (+swimGoal.targetSecs||0);
      if(tTotal > 0) targetPace100 = tTotal / (fixedDist / 100);
    }
    // D110a (V212, coach): the minutes box is a limb, not the time. A current time is entered when
    // its total (minutes*60 + seconds, a missing limb as 0) is above 0, never by the minutes box.
    const _swimTot = (m, s) => (+m||0)*60 + (+s||0);
""",
  """    // D110a (V212, coach): the minutes box is a limb, not the time. A time is entered when its total
    // (minutes*60 + seconds, a missing limb as 0) is above 0, never by the minutes box. The goal time
    // and every current time read through _swimTot.
    // D157 (queued, measure first): the SIZER (calcProgramLength's swim branch) still reads the goal
    // and the current time by the minutes box. The two readers differ ON PURPOSE until D157, so a
    // seconds-only entry changes the cards here and never the program length.
    const _swimTot = (m, s) => (+m||0)*60 + (+s||0);
    const _tgtTotal = _swimTot(swimGoal.targetMins, swimGoal.targetSecs);
    if(_tgtTotal > 0) targetPace100 = _tgtTotal / (fixedDist / 100);
"""),
 ('2 D144 floor',
  "      targetPace100 = initialPace100 - gap100;\n",
  """      // D144 floor (coach, V212): a 100 gap at or past the anchor pace would put the target at or
      // below zero. A card never carries a target that is not a swim, so hold at E (goal met).
      targetPace100 = gap100 >= initialPace100 ? initialPace100 : initialPace100 - gap100;
"""),
]
src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
if src.count('swimPace._dist = 500;') != 1:
    print('ABORT: slice 6 (D144) is not on the tree'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1: print('ABORT:', tag, 'anchor count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1); print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
