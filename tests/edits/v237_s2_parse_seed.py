#!/usr/bin/env python3
# V237 slice 2 of 5 (D220 item 3 P-DISTZERO, D221 P-REOPENSTAMP),
# ruling tests/measure/v237_rulings/v237_ruling_d220_d222.md (Mario concurred 2026-10-08).
# Edits: (1) _iawParse blank line: dist and rept land on their zero faces, pace keeps the dash
# (keyed on the kind, since rept and pace share fmt 'clock'); (2) _iawParse dec3 empty-match line
# lands on ['0','0','0'], and the D203 comment's "still lands on the dash" becomes "lands on zero";
# (3) _iawParse no-match line: rept lands on ['0','0'], pace and anything else as today;
# (4) cardioFieldHTML dist form: the miles wheel's hidden seed is '' when the stored run_dist is
# byte-equal to the V148 stamp String(dose.mi), else e.run_dist as today.
# Not touched: the time form, reps_time and generic miles seeds; persistLogFields; doseDerived.
# No version bump in this slice (stays 236). Every anchor is asserted count==1 before any write.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Pre-conditions: slice 1 landed, this slice has not, the version is still 236.
if src.count('V237 (D220)') != 2:
    sys.exit('ABORT: expected slice 1 (two V237 (D220) notes), found %d' % src.count('V237 (D220)'))
if src.count('V237 (D221)') != 0:
    sys.exit('ABORT: V237 (D221) already present (%d)' % src.count('V237 (D221)'))
if src.count('<meta name="ia-version" content="236">') != 1:
    sys.exit('ABORT: ia-version is not 236')

R = []

# -- Edit 1 (C4): blank string, dist and rept to zeros, pace keeps the dash ----------
R.append((
"""  if(!s) return sp.fmt==='dec3'?['','','']:['',''];
""",
"""  // V237 (D220): a blank or malformed miles or rep time string lands on the zero face (0.00,
  // 0:00), which stores '', as hms does since D215. Pace alone keeps its dash (D222).
  if(!s) return kind==='pace'?['','']:(sp.fmt==='dec3'?['0','0','0']:['0','0']);
"""))

# -- Edit 2 (C4 line, C5 comment): dec3 empty match lands on zero --------------------
R.append((
"""    // V232 (D203): the whole is optional, so a keypad's .86 seeds 0 . 8 6 rather than the
    // dash; an empty whole reads 0. A string with no digits at the front still lands on the dash.
    var m3=s.match(/^(\\d*)(?:\\.(\\d)(\\d)?)?/);
    if(!m3||m3[0]==='') return ['','',''];
""",
"""    // V232 (D203): the whole is optional, so a keypad's .86 seeds 0 . 8 6 rather than the
    // dash; an empty whole reads 0. V237 (D220): a string with no digits at the front lands on
    // zero, 0.00 (it was the dash).
    var m3=s.match(/^(\\d*)(?:\\.(\\d)(\\d)?)?/);
    if(!m3||m3[0]==='') return ['0','0','0'];
"""))

# -- Edit 3 (C4): clock no-match, rept to zeros, pace as today ------------------------
R.append((
"""  if(!m) return ['',''];
""",
"""  if(!m) return kind==='rept'?['0','0']:['',''];
"""))

# -- Edit 4 (C6): dist form seed, the stamp is derived and never read back -----------
R.append((
"""    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('dist','log_run_dist',e.run_dist||'',null,dose.mi)}</div>
""",
"""    // V237 (D221): on the dist form a stored run_dist byte-equal to String(dose.mi) is the V148
    // stamp persistLogFields writes; it is derived, so the miles wheel seeds '' (the plan face)
    // and every rebuild re-derives it from what the form holds. Any other bytes (a rolled 3.10,
    // 4.20, a typed legacy value) are the athlete's and seed as before.
    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('dist','log_run_dist',e.run_dist===String(dose.mi)?'':(e.run_dist||''),null,dose.mi)}</div>
"""))

# Assert every anchor first; abort on the first miss.
for i, (a, _) in enumerate(R, 1):
    n = src.count(a)
    if n != 1:
        sys.exit('ABORT: anchor %d count %d (want 1)' % (i, n))
    print('anchor %d count 1' % i)

out = src
for a, b in R:
    out = out.replace(a, b, 1)

# Post-conditions.
assert out.count('V237 (D221)') == 1
assert out.count("if(!m3||m3[0]==='') return ['0','0','0'];") == 1
assert out.count("iaWheelHTML('dist','log_run_dist',e.run_dist||'')") == 3
assert out.count('<meta name="ia-version" content="236">') == 1

open(PATH, 'w', encoding='utf-8').write(out)
print('wrote %s (%d -> %d bytes)' % (PATH, len(src.encode('utf-8')), len(out.encode('utf-8'))))
