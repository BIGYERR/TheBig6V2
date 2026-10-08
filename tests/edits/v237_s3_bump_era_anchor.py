#!/usr/bin/env python3
# V237 slice 3 of 5: C7 (stale cardioFieldHTML comment amended to D202's V237 wording), the two
# v232_d199.json mutations whose anchors V237 rewrote (S6-D203, S17-D202), and C8 the ia-version
# bump 236 -> 237 (last replacement). Era rows are NOT written here: they come from
# `python3 tests/era_bump.py 237 --ruling tests/measure/v237_rulings/v237_ruling_d220_d222.md`.
# Ruling: tests/measure/v237_rulings/v237_ruling_d220_d222.md (D220 "Amendments, explicit" and
# "Sabotage"). Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v232_d199.json')


def rep(label, text, old, new):
    n = text.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    if old == new:
        print('ABORT %s: replacement equals anchor; nothing written' % label)
        sys.exit(1)
    print('ok %s' % label)
    return text.replace(old, new, 1)


html = open(HTML, encoding='utf-8').read()
spec = open(SPEC, encoding='utf-8').read()

# ---- C7: index.html cardioFieldHTML comment (comment bytes only) -------------------------------
html = rep('C7 cardioFieldHTML comment', html,
"""    // V232 (D199, D201, D202, D206): two wheels, stacked (two three-column wheels side by side
    // are six columns, under the 44pt target at 375pt). The fixed dimension comes first and is
    // seeded from the plan for display; the free dimension parks on its blank face. V235 (D215):
    // the free time wheel (dist form) parks on zero, 0:00:00, which stores ''; the free miles
    // wheel (time form) stays on the dash.
""",
"""    // V232 (D199, D201, D202, D206): two wheels, stacked (two three-column wheels side by side
    // are six columns, under the 44pt target at 375pt). The fixed dimension comes first and is
    // seeded from the plan for display. V237 (D220, amending D202): a blank fixed wheel shows the
    // plan, a blank free wheel its zero face (0:00:00, 0.00, 0:00); only the pace wheel keeps the
    // dash. The free time wheel (dist form, V235 D215) parks on 0:00:00 and the free miles wheel
    // (time form, was the dash) on 0.00; each zero face stores ''.
""")

# ---- spec: S6-D203 re-anchored (the empty match lands on the dash again) -----------------------
spec = rep('spec S6-D203', spec,
"""  "name": "S6-D203 dec3 empty-match test removed",
  "anchor": "if(!m3||m3[0]==='') return ['','',''];",
  "replacement": "if(!m3) return ['','',''];",
  "gate": "gates/g232_d199_runwheel.js",
  "note": "NAMED TRIP: row D203. Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md with v232_session_calls.md items 7, 8, 12."
""",
"""  "name": "S6-D203 dec3 empty-match test removed",
  "anchor": "if(!m3||m3[0]==='') return ['0','0','0'];",
  "replacement": "if(!m3||m3[0]==='') return ['','',''];",
  "gate": "gates/g232_d199_runwheel.js",
  "note": "NAMED TRIP: row D203. Re-anchored V237 (D220/D221): D220 rewrote the line to land on zero, and removing the empty-match test is now an equivalent mutant (it falls through to 0,0,0), so the mutation is the empty match landing on the dash again; the V232 name is kept. g237 row D220-zero also defends this line (ruled pin; the gate field runs one gate). In the V237 build it trips D203 only from g232's D203 flip (slice 5) and D220-zero only once g237 lands (slice 4). Ruling: tests/measure/v237_rulings/v237_ruling_d220_d222.md (Sabotage); first ruled tests/measure/v232_rulings/v232_ruling_d199_d206.md with v232_session_calls.md items 7, 8, 12."
""")

# ---- spec: S17-D202 re-anchored (same intent: the plan arguments dropped) ----------------------
spec = rep('spec S17-D202', spec,
"""  "name": "S17-D202 dist form fixed wheel loses its plan",
  "anchor": "${iaWheelHTML('dist','log_run_dist',e.run_dist||'',null,dose.mi)}",
  "replacement": "${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}",
  "gate": "gates/g232_d199_runwheel.js",
  "note": "NAMED TRIP: row D202-open. Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md with v232_session_calls.md items 7, 8, 12."
""",
"""  "name": "S17-D202 dist form fixed wheel loses its plan",
  "anchor": "${iaWheelHTML('dist','log_run_dist',e.run_dist===String(dose.mi)?'':(e.run_dist||''),null,dose.mi)}",
  "replacement": "${iaWheelHTML('dist','log_run_dist',e.run_dist===String(dose.mi)?'':(e.run_dist||''))}",
  "gate": "gates/g232_d199_runwheel.js",
  "note": "NAMED TRIP: row D202-open. Re-anchored V237 (D220/D221): D221 rewrote the seed argument; the mutation is unchanged in intent, the plan arguments (null,dose.mi) dropped from the dist form fixed wheel. Ruling: tests/measure/v237_rulings/v237_ruling_d220_d222.md; first ruled tests/measure/v232_rulings/v232_ruling_d199_d206.md with v232_session_calls.md items 7, 8, 12."
""")

try:
    rows = json.loads(spec)
except Exception as e:
    print('ABORT spec no longer parses as JSON: %s; nothing written' % e)
    sys.exit(1)
for r in rows:
    if r['name'].startswith(('S6-D203', 'S17-D202')):
        if html.count(r['anchor']) != 1:
            print('ABORT %s: new anchor count %d in index.html; nothing written' % (r['name'], html.count(r['anchor'])))
            sys.exit(1)

# ---- C8: version meta bump, LAST replacement --------------------------------------------------
html = rep('C8 ia-version 236 -> 237', html,
           '<meta name="ia-version" content="236">',
           '<meta name="ia-version" content="237">')

open(HTML, 'w', encoding='utf-8').write(html)
open(SPEC, 'w', encoding='utf-8').write(spec)
print('wrote index.html and tests/sabotage/v232_d199.json')
