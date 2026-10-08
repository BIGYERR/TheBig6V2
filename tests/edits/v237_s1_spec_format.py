#!/usr/bin/env python3
# V237 slice 1 of 5 (D220 P-DISTZERO), ruling tests/measure/v237_rulings/v237_ruling_d220_d222.md.
# Edits: (1) _IAW_SPEC dist column 0 nil:true -> wrap:false; (2) _IAW_SPEC rept column 0
# nil:true -> wrap:false; (3) the D5 comment names whole miles and rep minutes beside hours;
# (4) _iawFormat: dist and rept zero-total faces store ''. No version bump in this slice (stays 236).
# Not this slice: _iawParse and the cardioFieldHTML seed (slice 2), bump and era rows (slice 3).
# Every anchor is asserted count==1 before any write; all or nothing.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Pre-conditions: this slice has not run, and the version is still 236.
if src.count('V237 (D220)') != 0:
    sys.exit('ABORT: V237 (D220) already present (%d)' % src.count('V237 (D220)'))
if src.count('<meta name="ia-version" content="236">') != 1:
    sys.exit('ABORT: ia-version is not 236')

R = []

# -- Edit 1 (C1): dist column 0, nil:true -> wrap:false ----------------------
R.append((
"""  dist:{fmt:'dec3',  cap:'Miles',        cols:[{min:0,max:99,nil:true},{min:0,max:9,dot:true},{min:0,max:9}]},
""",
"""  dist:{fmt:'dec3',  cap:'Miles',        cols:[{min:0,max:99,wrap:false},{min:0,max:9,dot:true},{min:0,max:9}]},
"""))

# -- Edit 2 (C1): rept column 0, nil:true -> wrap:false (hms row's alignment) ---
R.append((
"""  rept:{fmt:'clock', cap:'Typical rep',  cols:[{min:0,max:9, nil:true},{min:0,max:59,pad:2}]},
""",
"""  rept:{fmt:'clock', cap:'Typical rep',  cols:[{min:0,max:9, wrap:false},{min:0,max:59,pad:2}]},
"""))

# -- Edit 3 (C2): the D5 comment gains whole miles and rep minutes by name -----
R.append((
"""// ceiling (D199), not a cycle, so a flick off the floor must not turn 0:45:00 into 9:45:00.
// It carries wrap:false, honoured first; every other column derives from nil as above.
""",
"""// ceiling (D199), not a cycle, so a flick off the floor must not turn 0:45:00 into 9:45:00.
// V237 (D220): whole miles and rep minutes join it by name, no dash and no wrap: 99 miles and
// 0 miles, 9 minutes and 0 minutes, are ceilings, not neighbours, and the same flick must not
// turn a 0:45 rep into 9:45. The three carry wrap:false, honoured first; every other column
// derives from nil as above.
"""))

# -- Edit 4 (C3): _iawFormat, dist and rept zero faces store '' ---------------
R.append((
"""  if(sp.fmt==='dec3'){ var c=vals[2]===''||vals[2]==null?'0':vals[2]; return vals[0]+'.'+b+c; }
  return sp.fmt==='dec' ? (vals[0]+'.'+b) : (vals[0]+':'+('00'+b).slice(-2));
""",
"""  // V237 (D220): the same for the miles wheel's 0.00 and the rep time wheel's 0:00, each checked
  // on its total ahead of its arithmetic. Pace keeps its dash (D222): its first column starts at 4,
  // so its total is never zero, and the dash returns '' through the guard above.
  if(sp.fmt==='dec3'){ var c=vals[2]===''||vals[2]==null?'0':vals[2];
    if((+vals[0])*100+(+b)*10+(+c)===0) return '';
    return vals[0]+'.'+b+c; }
  if(kind==='rept'&&(+vals[0])*60+(+b)===0) return '';
  return sp.fmt==='dec' ? (vals[0]+'.'+b) : (vals[0]+':'+('00'+b).slice(-2));
"""))

for i, (old, new) in enumerate(R, 1):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: edit %d anchor count %d (want 1)' % (i, n))

out = src
for old, new in R:
    out = out.replace(old, new, 1)

open(PATH, 'w', encoding='utf-8').write(out)
print('OK: %d edits written' % len(R))
