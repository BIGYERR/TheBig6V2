#!/usr/bin/env python3
# V238 slice 2 of 5: the sum and max readers of P-RESTMOVELOG. NO version bump here (slice 3 bumps
# 237 -> 238); no gates here (slices 4-5). Runs on the slice-1 tree (tests/edits/v238_s1_restlog_core.py:
# restNorm lens in getLogs/getLogsFor, applyRestCardio writes restLog[type], persistLogFields carries it).
# Ruling: tests/measure/v238_rulings/v238_ruling_d223_d227.md, D224 "Weekly sums credit the jog" as
# amended by A4 (and A5's deletion of the ladderWeekly fragment), D224 "Max readers" as amended by A5.
#   E4  C-READ-SUM  week MILES tile: every day's run_dist + every day's restLog.run.dist. Walk and row
#                   credit nothing (MILES is a run tile).
#   E5  C-READ-SUM  renderProgressScreen weekly totals: run += restLog.run.dist, bike += restLog.bike.mins,
#                   swim += restLog.swim.dist; average RPE folds each jog type's rpe as one more effort,
#                   after the day's session rpe. weeklyData.sessions (no reader, dead write) left as is.
#   E6  C-READ-MAX  ladderWeekly: restLog.run.dist is one more candidate for the week's longest single
#                   run against each day's run_dist, never added to it.
#   E7  C-READ-MAX  seedFromPriorPrograms maxDist: restLog.run.dist is its own candidate on entries inside
#                   the existing ts window (window unchanged; a legacy jog with no ts stays outside, A3).
#                   The pace seeds and every run_pace/run_mins reader stay blind.
#   C-COMMENT       a V238 (D224 ...) comment at each seam.
# Not touched: plannedVsLogged (pair reader), _hasLog, cardioEntryLive, cardioLive, the form seeds, the
# journal and the rest hero _rcLine and restMoveCandidates (slice 3), the rest sheet.
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')


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


def die(msg):
    print('ABORT premise %s; nothing written' % msg)
    sys.exit(1)


html = open(HTML, encoding='utf-8').read()

# ---- premise guards ------------------------------------------------------------------------------
# P0: still 237 (slice 3 bumps), slice 1 landed (the lens is on both reads of ia_logs_).
m = re.search(r'<meta name="ia-version" content="(\d+)">', html)
if not m or m.group(1) != '237':
    die('ia-version is %r, want 237' % (m.group(1) if m else None))
if html.count('return restNormAll(l);}') != 2:
    die('restNormAll is not on both getLogs and getLogsFor (slice 1 not landed?)')


def span_src(fn_head, anchor, want_src, label):
    """Between fn_head and anchor: no top-level function starts, and the only `logs` binding is want_src."""
    if html.count(fn_head) != 1 or html.count(anchor) != 1:
        die('%s: fn head %d / anchor %d' % (label, html.count(fn_head), html.count(anchor)))
    a, b = html.index(fn_head), html.index(anchor)
    if b < a:
        die('%s: anchor precedes function head' % label)
    seg = html[a + len(fn_head):b]
    if '\nfunction ' in seg:
        die('%s: a top-level function starts between head and anchor' % label)
    binds = re.findall(r'(?:const|let|var)\s+logs\s*=[^;,]*', seg)
    if binds != [want_src]:
        die('%s: logs bindings %r, want [%r]' % (label, binds, want_src))
    print('ok source %s: %s' % (label, want_src))


MILES_OLD = """  let miles=0; order.forEach(d=>{ const v=parseFloat((logs[logKey(currentWeek,d)]||{}).run_dist); if(!isNaN(v)) miles+=v; });
"""
PROG_OLD = """    if(entry.run_dist && +entry.run_dist > 0) weeklyData[w].run += +entry.run_dist;
    if(entry.bike_mins && +entry.bike_mins > 0) weeklyData[w].bike += +entry.bike_mins;
    if(entry.swim_yards && +entry.swim_yards > 0) weeklyData[w].swim += +entry.swim_yards;
    if(entry.rpe && +entry.rpe > 0) {
      weeklyData[w].rpe = weeklyData[w].rpe ? (+weeklyData[w].rpe + +entry.rpe)/2 : +entry.rpe;
    }
"""
LADDER_CALL = 'ladderWeekly(logs, totalWeeks, _cut, _skip1)'
LADDER_OLD = """    const d=+e.run_dist; if(!(d>0)) return;
    wk[w]=Math.max(wk[w]||0, d);
"""
MAXD_OLD = """      if(e.run_dist&&+e.run_dist>0) maxDist=Math.max(maxDist,+e.run_dist);
"""

span_src('function renderWeekView(', MILES_OLD, 'const logs=getLogs()', 'E4 week MILES')
span_src('function renderProgressScreen() {', PROG_OLD, 'const logs = getLogsFor(_vid)', 'E5 Progress totals')
span_src('function renderProgressScreen() {', LADDER_CALL, 'const logs = getLogsFor(_vid)', 'E6 ladderWeekly caller')
if html.count('ladderWeekly(') != 2:
    die('ladderWeekly( count %d, want 2 (definition + the one Progress call)' % html.count('ladderWeekly('))
span_src('function seedFromPriorPrograms(now){', MAXD_OLD, 'const logs=getLogsFor(p.id)', 'E7 maxDist')
print('ok premise guards')

# ---- E4: C-READ-SUM, week MILES tile -------------------------------------------------------------
html = rep('E4 week MILES', html, MILES_OLD,
"""  // V238 (D224, weekly sums credit the jog): MILES is every day's session run_dist plus every
  // day's rest-day jog, restLog.run.dist. Walk and row jogs credit nothing (MILES is a run tile).
  let miles=0; order.forEach(d=>{ const e=logs[logKey(currentWeek,d)]||{}; const v=parseFloat(e.run_dist); if(!isNaN(v)) miles+=v; const j=+((e.restLog||{}).run||{}).dist; if(j>0) miles+=j; });
""")

# ---- E5: C-READ-SUM, Progress weekly totals and average RPE --------------------------------------
html = rep('E5 Progress totals + RPE', html, PROG_OLD, PROG_OLD +
"""    // V238 (D224, Amendment 1 A4): the rest-day jog (restLog) is its own record on the day and the
    // weekly sums credit it: run adds restLog.run.dist, bike adds restLog.bike.mins, swim adds
    // restLog.swim.dist (yards). Walk and row credit no total. Each jog type with an RPE is one
    // more effort in the average, after the day's session RPE when that is set.
    const _rl = (entry.restLog && typeof entry.restLog === 'object') ? entry.restLog : {};
    if(_rl.run && +_rl.run.dist > 0) weeklyData[w].run += +_rl.run.dist;
    if(_rl.bike && +_rl.bike.mins > 0) weeklyData[w].bike += +_rl.bike.mins;
    if(_rl.swim && +_rl.swim.dist > 0) weeklyData[w].swim += +_rl.swim.dist;
    Object.keys(_rl).forEach(t => {
      const r = _rl[t] ? +_rl[t].rpe : 0;
      if(r > 0) weeklyData[w].rpe = weeklyData[w].rpe ? (+weeklyData[w].rpe + r)/2 : r;
    });
""")

# ---- E6: C-READ-MAX, ladderWeekly ----------------------------------------------------------------
html = rep('E6 ladderWeekly', html, LADDER_OLD,
"""    // V238 (D224 max readers, Amendment 1 A5): the rest-day jog is one more candidate for the
    // week's longest single run, never added to the day's session: a double day's longest run is
    // max(session, jog).
    const d=+e.run_dist, j=+((e.restLog||{}).run||{}).dist;
    const top=Math.max(d>0?d:0, j>0?j:0); if(!(top>0)) return;
    wk[w]=Math.max(wk[w]||0, top);
""")

# ---- E7: C-READ-MAX, seedFromPriorPrograms maxDist -----------------------------------------------
html = rep('E7 seedFromPriorPrograms maxDist', html, MAXD_OLD, MAXD_OLD +
"""      // V238 (D224 max readers, Amendment 1 A3): a rest-day jog inside the ts window is its own
      // candidate for the longest run, never summed with the day's session. The pace seeds stay
      // blind: a jog has no pace.
      const _jd=+((e.restLog||{}).run||{}).dist; if(_jd>0) maxDist=Math.max(maxDist,_jd);
""")

open(HTML, 'w', encoding='utf-8').write(html)
print('wrote %s' % HTML)
