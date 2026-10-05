#!/usr/bin/env python3
# V232 P-RUNWHEEL, builder slice 3 of 4: the stacked-wheel width and the version bump.
# Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md D199 "Layout consequence" (a max-width on each
#         stacked wheel so a three-column wheel alone in its row keeps cells near the generic form's measured
#         width) and "Diff classes licensed" 5 (a width rule, no new column-count class); hook class
#         `iaw-solo` is the session's call; Mario named the build V232.
#   E9   cardioFieldHTML: the five stacked wraps (time x2, dist x2, reps_time x1) gain class iaw-solo.
#   E10  CSS: .iaw-solo{max-width:178.2px} beside the .iaw-cell flex rules (derivation in the CSS comment).
#   E11  ia-version 231 -> 232, last.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
F = ROOT / 'index.html'
src = F.read_text(encoding='utf-8')

OLD_WRAP = '<div class="iaw-wrap">'
NEW_WRAP = '<div class="iaw-wrap iaw-solo">'

# ---- E9a: the time + dist branches, four wraps in one contiguous anchor ----
E9A_OLD = r"""    if(dose.k==='time') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap">${iaWheelHTML('hms','log_run_mins',e.run_mins||'',null,dose.mins)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;
    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'',null,dose.mi)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap">${iaWheelHTML('hms','log_run_mins',e.run_mins||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;"""
assert E9A_OLD.count(OLD_WRAP) == 4, 'E9a: expected four wraps inside the anchor'
E9A_NEW = E9A_OLD.replace(OLD_WRAP, NEW_WRAP)

# ---- E9b: the reps_time wrap ----
E9B_OLD = r"""        <label>Miles in the work reps</label>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>"""
E9B_NEW = E9B_OLD.replace(OLD_WRAP, NEW_WRAP)

# ---- E10: CSS width rule ----
E10_OLD = r""".iaw-cell.iaw-f3{flex:3;}
.iaw-cell.iaw-f2{flex:2;}
"""
E10_NEW = r""".iaw-cell.iaw-f3{flex:3;}
.iaw-cell.iaw-f2{flex:2;}
/* V232 (D199): a run wheel alone in its row (the stacked dosed forms) is held to the width
   of the generic run form's three-column Miles cell, so its columns match that row instead
   of sprawling to the full card. At a 375pt viewport: 375 - 2×16 .detail-body - 2×1
   .log-section border - 2×16 .log-body = 309 for the row; 309 - 12 gap = 297 to flex;
   the f3 cell takes 3/5 of it, 178.2. */
.iaw-solo{max-width:178.2px;}
"""

# ---- E11: version bump, last ----
E11_OLD = '<meta name="ia-version" content="231">'
E11_NEW = '<meta name="ia-version" content="232">'

EDITS = [('E9a time+dist wraps', E9A_OLD, E9A_NEW),
         ('E9b reps_time wrap', E9B_OLD, E9B_NEW),
         ('E10 css iaw-solo', E10_OLD, E10_NEW),
         ('E11 ia-version 232', E11_OLD, E11_NEW)]

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (expected 1); nothing written' % (name, n))
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('applied', name)
assert out.count(E11_NEW) == 1 and out.count(E11_OLD) == 0, 'version meta'
assert out.count('iaw-solo') == 6, 'expected five wraps and one CSS rule'   # 5 markup + 1 css selector
F.write_text(out, encoding='utf-8')
print('wrote', F, len(src), '->', len(out))
