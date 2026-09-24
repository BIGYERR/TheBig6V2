#!/usr/bin/env python3
# V212 slice 5b — coach ruled: "the minutes box is a limb, not the time." Runs on slices 1-5.
#   1  the swim base reader in buildSwimSession keys on the total (minutes*60 + seconds, a missing
#      limb as 0) > 0, never on the minutes box. The total is named (_baseTotal) through one helper
#      (_swimTot) so slice 6 reads every swim time through the same rule.
#   2  _baseEntered = _baseTotal > 0 (same rule, same number).
#   3  the slice 3 goal sheet carry: "present" is the stored total > 0, and both limbs are carried
#      as stored (a limb that is not stored is not written).
# No ia-version bump. Aborts on the first anchor miss, before writing anything.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
EDITS = [
 ('1 base reader',
  """    if(swimGoal.baseMins !== undefined && swimGoal.baseMins !== '') {
      const bTotal = (+swimGoal.baseMins||0)*60 + (+swimGoal.baseSecs||0);
      if(bTotal > 0) initialPace100 = bTotal / (fixedDist / 100);
    }
""",
  """    // D110a (V212, coach): the minutes box is a limb, not the time. A current time is entered when
    // its total (minutes*60 + seconds, a missing limb as 0) is above 0, never by the minutes box.
    const _swimTot = (m, s) => (+m||0)*60 + (+s||0);
    const _baseTotal = _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
    if(_baseTotal > 0) initialPace100 = _baseTotal / (fixedDist / 100);
"""),
 ('2 _baseEntered',
  "swimPace._baseEntered = swimGoal.baseMins !== undefined && swimGoal.baseMins !== '' && ((+swimGoal.baseMins||0)*60 + (+swimGoal.baseSecs||0)) > 0;",
  "swimPace._baseEntered = _baseTotal > 0;"),
 ('3 sheet carry present = total',
  """    const _has=m=>m!==undefined&&m!=='';
    const _put=(k,t)=>{ next[k+'Mins']=t[0]; if(t[1]!==undefined) next[k+'Secs']=t[1]; };
    if(prev.swimUnit) next.swimUnit=prev.swimUnit;
    let _t500=null, _t100=null;
    if(prev.id==='swim_500_time'&&_has(prev.baseMins)) _t500=[prev.baseMins,prev.baseSecs];
    if(prev.id==='swim_100_time'&&_has(prev.base500Mins)) _t500=[prev.base500Mins,prev.base500Secs];
    if(prev.id==='swim_100_time'&&_has(prev.baseMins)) _t100=[prev.baseMins,prev.baseSecs];
""",
  """    const _has=(m,s)=>((+m||0)*60+(+s||0))>0;
    const _put=(k,t)=>{ if(t[0]!==undefined) next[k+'Mins']=t[0]; if(t[1]!==undefined) next[k+'Secs']=t[1]; };
    if(prev.swimUnit) next.swimUnit=prev.swimUnit;
    let _t500=null, _t100=null;
    if(prev.id==='swim_500_time'&&_has(prev.baseMins,prev.baseSecs)) _t500=[prev.baseMins,prev.baseSecs];
    if(prev.id==='swim_100_time'&&_has(prev.base500Mins,prev.base500Secs)) _t500=[prev.base500Mins,prev.base500Secs];
    if(prev.id==='swim_100_time'&&_has(prev.baseMins,prev.baseSecs)) _t100=[prev.baseMins,prev.baseSecs];
"""),
]
src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
if src.count('function _swimEntryState(g){') != 1:
    print('ABORT: slice 5 (M2) is not on the tree'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1: print('ABORT:', tag, 'anchor count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1); print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
