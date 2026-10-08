#!/usr/bin/env python3
# V235 slice 2 of 5: the version bump, the D199 sabotage re-anchor, and two call-site comments.
# Ruling: tests/measure/v235_rulings/v235_ruling_d215_d217.md (D215 amendments to D202 and D207;
# "Sabotage." paragraph). Mario said bump (234 -> 235). Era rows are NOT written here: they come
# from `python3 tests/era_bump.py 235 --ruling <ruling>`, run after this script (never by hand).
#
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole
# script and no file is touched. Both files are computed and checked first, then written. The
# version meta is the last replacement in index.html.
#
# Diff classes this script produces:
#   index.html
#     (C1) D215 comment  cardioFieldHTML V232 call-site comment: free time wheel parks on 0:00:00
#     (C2) D215 comment  cardioFieldHTML V233 (D207) bike comment: parks on zero, not the dash
#     (V)  version bump  <meta name="ia-version"> 234 -> 235 (the only in-file version token;
#                        IA_VERSION and the update check read the meta at runtime)
#   tests/sabotage/v232_d199.json
#     (S1) S1-D199 re-anchored on the V235 hms spec line; now "hours regains the dash row"
#     (S2) S2-D199 re-anchored on the V235 hms spec line; same intent (hours ceiling 9 -> 8)
import sys, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = ROOT / 'index.html'
SAB = ROOT / 'tests' / 'sabotage' / 'v232_d199.json'
src = HTML.read_text(encoding='utf-8')
sab = SAB.read_text(encoding='utf-8')

def apply(text, edits, label):
    out = text
    for name, old, new in edits:
        n = out.count(old)
        if n != 1:
            sys.exit('ABORT: %s anchor %r count=%d (want 1); nothing written' % (label, name, n))
        out = out.replace(old, new, 1)
    if out == text:
        sys.exit('ABORT: %s unchanged' % label)
    return out

# ── index.html ───────────────────────────────────────────────────────────────────────────────
H = []
H.append(('C1 run call-site comment',
"""    // seeded from the plan for display; the free dimension parks on the dash.
""",
"""    // seeded from the plan for display; the free dimension parks on its blank face. V235 (D215):
    // the free time wheel (dist form) parks on zero, 0:00:00, which stores ''; the free miles
    // wheel (time form) stays on the dash.
"""))
H.append(('C2 bike comment',
"""  // form's markup. No plan argument, so every bike shape parks on the dash until a ride is
  // stored; the strip above carries the plan. No sub-label (Mario). The hidden input keeps
""",
"""  // form's markup. No plan argument, so every bike shape parks on zero, 0:00:00, which stores ''
  // (V235, D215; it was the dash), until a ride is stored; the strip above carries the plan.
  // No sub-label (Mario). The hidden input keeps
"""))
# The version meta is LAST.
H.append(('V ia-version meta',
"""<meta name="ia-version" content="234">""",
"""<meta name="ia-version" content="235">"""))
out_html = apply(src, H, 'index.html')

# ── tests/sabotage/v232_d199.json ────────────────────────────────────────────────────────────
NOTE = "NAMED TRIP: row D199-spec. Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md with v232_session_calls.md items 7, 8, 12."
S = []
S.append(('S1-D199 block',
"""  "name": "S1-D199 hms hours column loses nil:true (no dash, wraps)",
  "anchor": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},",
  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9},",
""",
"""  "name": "S1-D199 hms hours column regains the dash row (nil:true back, wrap:false dropped)",
  "anchor": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, wrap:false},",
  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},",
"""))
S.append(('S2-D199 block',
"""  "name": "S2-D199 hms hours max 9 -> 8",
  "anchor": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},",
  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:8, nil:true},",
""",
"""  "name": "S2-D199 hms hours max 9 -> 8",
  "anchor": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, wrap:false},",
  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:8, wrap:false},",
"""))
# S1's note carries the ruling's re-anchor (V235) beside the original D199-spec trip.
S.append(('S1-D199 note',
"""  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},",
  "gate": "gates/g232_d199_runwheel.js",
  "note": \"""" + NOTE + """"
""",
"""  "replacement": "hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},",
  "gate": "gates/g232_d199_runwheel.js",
  "note": \"""" + NOTE + """ V235 re-anchor: tests/measure/v235_rulings/v235_ruling_d215_d217.md Sabotage, 'S1-D199 becomes hours regains the dash row (must trip D215-rows and D215-tail)'; this pin stays on g232 D199-spec (V235 era: 10 rows, no dash)."
"""))
out_sab = apply(sab, S, 'v232_d199.json')

# The spec must still parse, and every mutation in it must apply exactly once to the candidate.
spec = json.loads(out_sab)
for m in spec:
    n = out_html.count(m['anchor'])
    if n != 1:
        sys.exit('ABORT: candidate anchor count for %r is %d (want 1); nothing written' % (m['name'], n))
    if out_html.replace(m['anchor'], m['replacement']) == out_html:
        sys.exit('ABORT: %r replacement identical to anchor; nothing written' % m['name'])

HTML.write_text(out_html, encoding='utf-8')
SAB.write_text(out_sab, encoding='utf-8')
print('v235_s2_bump: %d index.html replacements, %d v232_d199.json replacements; %d spec anchors count==1 in the candidate'
      % (len(H), len(S), len(spec)))
