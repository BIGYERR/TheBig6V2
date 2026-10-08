#!/usr/bin/env python3
# V235 slice 1 of 5: D215 (P-HMSZERO) and D216 (hours does not wrap), the four code edits.
# Ruling: tests/measure/v235_rulings/v235_ruling_d215_d217.md (D215, D216, D217; Mario concurred
# 2026-10-07). Every anchor is asserted count==1 before anything is written; the first miss
# aborts the whole script and the file is left untouched.
#
# NO version bump in this slice: ia-version stays 234 here; the bump rides a later slice of V235
# and is the last replacement of that slice's script.
#
# Diff classes this script produces in index.html (each with its comment in the same hunk):
#   (1) D215/D216  _IAW_SPEC.hms.cols[0]: nil:true -> wrap:false; D199 comment amended
#   (2) D216       _iawWraps honours wrap:false first, then derives from nil; D5 comment extended
#   (3) D215       _iawFormat hms: the zero face (total 0 s) returns '' ahead of the D200 arithmetic
#   (4) D215       _iawParse hms: '' and malformed return ['0','0','0'] instead of dashes
# Deliberately untouched (ruling): the shared column-0 guard in _iawFormat, _iawCommit,
# iaWheelInit, the three call sites, D208's clamp, the dist/rept/pace specs, _IAW_REPS.
import sys, pathlib

PATH = pathlib.Path(__file__).resolve().parents[2] / 'index.html'
src = PATH.read_text(encoding='utf-8')

EDITS = []

# ── (1) the hms spec row and the D199 comment above it ──────────────────────────────────────
EDITS.append(('1 hms spec row',
"""  // V232 (D199): run time as a clock with hours. 0..9 hours covers every finish under 10:00:00,
  // the file's one ceiling on logged cardio minutes (max="600" on the rest-day sheet). Hours
  // carries the dash and does not wrap; minutes and seconds wrap (derived from nil, D5).
  hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},{min:0,max:59,pad:2},{min:0,max:59,pad:2}]}
""",
"""  // V232 (D199): run time as a clock with hours. 0..9 hours covers every finish under 10:00:00,
  // the file's one ceiling on logged cardio minutes (max="600" on the rest-day sheet). V235
  // (D199 as amended by D215, D216): hours has no dash and does not wrap (D216), so the column
  // is the ten rows 0..9, and "nothing logged yet" is the zero face 0:00:00, which stores ''
  // (D215). Minutes and seconds wrap (derived from nil, D5).
  hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, wrap:false},{min:0,max:59,pad:2},{min:0,max:59,pad:2}]}
"""))

# ── (2) _iawWraps: wrap:false first, then the D5 derivation; reason beside the D5 comment ────
EDITS.append(('2 _iawWraps',
"""// either: 9:59 wraps to 9:00, so a flick on seconds cannot rewrite the minutes.
const _IAW_REPS=5;
function _iawWraps(c){ return !c.nil; }
""",
"""// either: 9:59 wraps to 9:00, so a flick on seconds cannot rewrite the minutes.
// V235 (D216): one column says otherwise, by name. The hms hours column has no dash (D215)
// and still never wraps: 9 hours and 0 hours are not neighbours on any clock, and 0..9 is a
// ceiling (D199), not a cycle, so a flick off the floor must not turn 0:45:00 into 9:45:00.
// It carries wrap:false, honoured first; every other column derives from nil as above.
const _IAW_REPS=5;
function _iawWraps(c){ if(c.wrap===false) return false; return !c.nil; }
"""))

# ── (3) _iawFormat hms: the zero face stores '' ahead of D200's arithmetic (expression untouched)
EDITS.append(('3 _iawFormat zero face',
"""  if(sp.fmt==='hms'){ var sx=vals[2]===''||vals[2]==null?'0':vals[2]; return ((+vals[0])*60+(+b)+(+sx)/60).toFixed(2); }
""",
"""  // V235 (D215): the zero face 0:00:00 is "nothing logged yet" (V182 D4) and stores '', checked
  // ahead of the D200 arithmetic, so the truthy readers (_hasLog, the session counter) agree with
  // the face. Tested on the total in seconds, not the strings, since a padded column may carry '00'.
  if(sp.fmt==='hms'){ var sx=vals[2]===''||vals[2]==null?'0':vals[2];
    if((+vals[0])*3600+(+b)*60+(+sx)===0) return '';
    return ((+vals[0])*60+(+b)+(+sx)/60).toFixed(2); }
"""))

# ── (4) _iawParse hms: blank and malformed land on 0:00:00; D208's clamp untouched ───────────
# Two replacements, one hunk: the D208 comment's last line, and the early return three lines down.
EDITS.append(('4a _iawParse comment',
"""  // maxes), for display only. Empty or malformed lands on the dash.
""",
"""  // maxes), for display only. V235 (D215): empty or malformed (nothing at the front that reads as
  // digits or a leading-dot decimal: '', 'abc', '-1') lands on 0:00:00, the zero face that stores ''.
"""))
EDITS.append(('4b _iawParse hms blank',
"""    if(!mh||mh[0]==='') return ['','',''];
""",
"""    if(!mh||mh[0]==='') return ['0','0','0'];
"""))

out = src
for name, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (want 1); index.html untouched' % (name, n))
    out = out.replace(old, new, 1)

if out == src:
    sys.exit('ABORT: no change produced')
PATH.write_text(out, encoding='utf-8')
print('v235_s1_hmszero: %d replacements written to %s' % (len(EDITS), PATH))
