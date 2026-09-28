#!/usr/bin/env python3
# V223 build 3, D183 (P-SAFEPACE) slice S7: R5 pace lines, amendment 2 (d) swim unit, amendment 2
# brought in (2) km lens.
# Ruling: tests/measure/v223_rulings/p_safepace_ruling.md
#   R5   paceDisplayLine '12:00 — 8:00/mi per mile' -> '12:00 is 8:00 per mile.' (one unit word, once);
#        swimPaceLine, same shape -> '<time> is <pace> per 100.'
#   A2d  swim keeps the unit: '<time> is <pace> per 100 <unit>.' -> '7:00 is 1:24 per 100 yd.'
#        (unit g.swimUnit||'yd'), both the handler and the inline render. _clkMS(per100) at the call
#        site; formatPacePer100 unchanged.
#   A2+2 the run line reads paceGoalTarget(g).tPacePerMile (the engine's lens) -> '12:00 is 9:40 per
#        mile.' for 2 km in 12:00 (720 s / 1.242 mi). One lens for pool and post-filter.
# Session decision on plan flag F1: formatPacePer100 and formatPacePerMile stay byte-identical with 0
# callers after this slice (dead-code debt, §12). Not removed here.
# Kept byte-identical: paceGoalTarget, formatPacePer100, formatPacePerMile, buildProgram, every NRC
# string, updatePaceDisplay's minutes-box guard (outside the E3 anchor). NO version bump (stays 222).
# Every anchor is asserted count==1 on the in-memory text before it is replaced; the first miss aborts
# the whole script and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
orig = src

def rep(label, old, new):
    global src
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count=%d (expected 1). Nothing written.' % (label, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('OK    %s: anchor count=1, replaced' % label)

# ── E1  updateSwimPaceDisplay: R5 shape + A2d unit. dist is SWIM_GOAL_DIST[g.id] || 500, always > 0,
#        so the formatPacePer100 '' guard had no reachable case and goes with its caller.
E1_OLD = """  const pace = formatPacePer100(totalSecs, dist);
  if(!pace) { el.style.display = 'none'; return; }
  el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(totalSecs) + ' — ' + pace + ' (' + unit + ')';   // V218 (D157): label from the total
"""
E1_NEW = """  // D183 (P-SAFEPACE R5, amendment 2 (d)): '<time> is <pace> per 100 <unit>.' One unit word, once.
  el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(totalSecs) + ' is ' + _clkMS(totalSecs/(dist/100)) + ' per 100 ' + unit + '.';   // V218 (D157): label from the total
"""
rep('E1 updateSwimPaceDisplay line', E1_OLD, E1_NEW)

# ── E2  swim inline render (inside the swim_500_time||swim_100_time branch, so SWIM_GOAL_DIST[g.id] is set)
E2_OLD = """${_clkMS(((+g.targetMins||0)*60)+(+g.targetSecs||0))} — ${formatPacePer100(((+g.targetMins||0)*60)+(+g.targetSecs||0),SWIM_GOAL_DIST[g.id])||''} (${g.swimUnit||'yd'})</div>"""
E2_NEW = """${_clkMS(((+g.targetMins||0)*60)+(+g.targetSecs||0))} is ${_clkMS((((+g.targetMins||0)*60)+(+g.targetSecs||0))/(SWIM_GOAL_DIST[g.id]/100))} per 100 ${g.swimUnit||'yd'}.</div>"""
rep('E2 swim inline fragment', E2_OLD, E2_NEW)

# ── E3  updatePaceDisplay: R5 shape through paceGoalTarget (A2 brought in (2)). The minutes-box guard
#        above this anchor is untouched.
E3_OLD = """  const totalSecs = (+(g.targetMins||0)*60) + (+(g.targetSecs||0));
  const pace = formatPacePerMile(totalSecs, +(g.targetDist||1.5));
  if(!pace) { el.style.display='none'; return; }
  el.innerHTML = asyIcon('🎯',13)+' ' + g.targetMins + ':' + String(g.targetSecs||0).padStart(2,'0') + ' — ' + pace + ' per mile';
"""
E3_NEW = """  // D183 (P-SAFEPACE R5, amendment 2 brought in (2)): the engine's lens. A km target reads as its pace per
  // mile, because sessions print /mi. '<time> is <pace> per mile.' One unit word, once.
  const _t = paceGoalTarget(g);
  if(!_t.tPacePerMile) { el.style.display='none'; return; }
  el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(_t.tTotalSecs) + ' is ' + _clkMS(_t.tPacePerMile) + ' per mile.';
"""
rep('E3 updatePaceDisplay via paceGoalTarget', E3_OLD, E3_NEW)

# ── E4  run inline render: the same lens through an inline IIFE (the file's idiom)
E4_OLD = """${asyIcon('🎯',13)} ${WD.cardioGoals['run']?.targetMins||''}:${String(WD.cardioGoals['run']?.targetSecs||0).padStart(2,'0')} — ${formatPacePerMile(((+WD.cardioGoals['run']?.targetMins||0)*60)+(+WD.cardioGoals['run']?.targetSecs||0),+(WD.cardioGoals['run']?.targetDist||1.5))||''} per mile</div>"""
E4_NEW = """${asyIcon('🎯',13)} ${(()=>{ const _t=paceGoalTarget(WD.cardioGoals['run']); return _t.tPacePerMile ? _clkMS(_t.tTotalSecs)+' is '+_clkMS(_t.tPacePerMile)+' per mile.' : ''; })()}</div>"""
rep('E4 run inline fragment via paceGoalTarget', E4_OLD, E4_NEW)

if src == orig:
    print('ABORT: no change produced. Nothing written.')
    sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d -> %d bytes)' % (PATH, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
