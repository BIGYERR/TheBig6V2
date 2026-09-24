#!/usr/bin/env python3
# V212 slice 3 — D110a goal-sheet carry, coach's D144-aware mapping (SUPERSEDES the surgery's S6,
# which carried the current time only between goals of the same distance). Runs on slices 1-2.
# Coach's ruling, in commitGoalChange's next={...} (one site):
#   * swimUnit is always carried from prev when the new goal is a swim goal.
#   * a 500 time carries to wherever a 500 lives: prev.baseMins/Secs on swim_500_time, or
#     prev.base500Mins/Secs on swim_100_time -> next.baseMins/Secs on swim_500_time, or
#     next.base500Mins/Secs on swim_100_time.
#   * a current 100 (prev.baseMins/Secs on swim_100_time) carries only to swim_100_time.
#   * anything absent is not written (the card then prints the "No current ... time" line).
#   * _goalInputsValid stays target only (D143 is queued). base500* has no reader until slice 6.
# "Present" is the surgery's own predicate (minutes field defined and not empty). Seconds are
# written only when prev holds them. No ia-version bump. Aborts on the first anchor miss.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

A = "        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{})};\n"
B = A + """  // D110a (V212, coach ruled, D144 aware): a swim goal switch keeps the pool unit and every current
  // time that still means something. A 500 time carries to wherever a 500 lives (the 500 goal's
  // base, or a 100 goal's base500); a current 100 carries only to a 100 goal. Absent is not written.
  if(sport==='swim'){
    const _has=m=>m!==undefined&&m!=='';
    const _put=(k,t)=>{ next[k+'Mins']=t[0]; if(t[1]!==undefined) next[k+'Secs']=t[1]; };
    if(prev.swimUnit) next.swimUnit=prev.swimUnit;
    let _t500=null, _t100=null;
    if(prev.id==='swim_500_time'&&_has(prev.baseMins)) _t500=[prev.baseMins,prev.baseSecs];
    if(prev.id==='swim_100_time'&&_has(prev.base500Mins)) _t500=[prev.base500Mins,prev.base500Secs];
    if(prev.id==='swim_100_time'&&_has(prev.baseMins)) _t100=[prev.baseMins,prev.baseSecs];
    if(g.id==='swim_500_time'&&_t500) _put('base',_t500);
    if(g.id==='swim_100_time'&&_t500) _put('base500',_t500);
    if(g.id==='swim_100_time'&&_t100) _put('base',_t100);
  }
"""

src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
for pre in ('const intPace = weekPace - 2;', "const _anchorLine = swimPace._baseEntered ? '' : "):
    if src.count(pre) != 1:
        print('ABORT: slices 1-2 are not on the tree (missing ' + pre[:40] + ')'); sys.exit(1)
n = src.count(A)
if n != 1:
    print('ABORT: S6 anchor count', n); sys.exit(1)
src = src.replace(A, B, 1)
print('OK slice 3 goal sheet carry')
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
