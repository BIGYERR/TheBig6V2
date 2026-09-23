#!/usr/bin/env python3
# V205 slice 11 — D132. The fourth run is granted to a week that carries quality.
# EDIT 1 (index.html, 3 replacements): the solo-run pace ceiling falls to 3 on a
#   noimpact / noimpact_swim week.  EDIT 3 (handoff, 1 replacement): the D-code registry.
# ia-version does NOT move: 205 is already the working number for this session.
# Every anchor asserted count==1 before anything is written; first miss aborts the script.
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
DOC  = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f: return f.read()
def write(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

html = read(HTML)
doc  = read(DOC)

# ── guard: this slice is written against ia-version 205 and must not move it ──────────
assert html.count('<meta name="ia-version" content="205">') == 1, 'ia-version is not 205'

EDITS_HTML = []

# ── EDIT 1a — the signature. sportDayTargets has no cfg, and it must not acquire one:
# it is called by the wizard nudge from a DRAFT that has no cfg at all. cardioMode is
# passed in as a plain value so the helper stays a pure function of its arguments.
EDITS_HTML.append((
"function sportDayTargets(cardioTypes, cardioGoals, totalDays, liftGoal) {",
"function sportDayTargets(cardioTypes, cardioGoals, totalDays, liftGoal, cardioMode) {"
))

# ── EDIT 1b — the ceiling itself, and the reasoning on the KEY. ──────────────────────
EDITS_HTML.append((
"""    const _ceil = (PACE_GOALS.has(goalId) && cardioTypes.length !== 1) ? Math.min(ceiling, 3) : ceiling;
""",
"""    // V205 (D132): THE FOURTH RUN IS GRANTED TO A WEEK THAT CARRIES QUALITY. D125's
    // argument for the fourth run was the guide's four-session week: two LSDs, an SI and
    // an LI. On a noimpact or noimpact_swim week with no bike or swim to fall back on,
    // the sweep rewrites every run to a pain-free incline walk. No SI, no LI, no long
    // run, no shape to protect. A fourth walk is not that week, so the ceiling is 3.
    // ON THE KEY, AND WHY IT IS THE CAUSE AND NOT THE EFFECT. This ceiling is read
    // BEFORE the sweep runs, so "speedless" is not knowable at the decision point and
    // cardioMode is. With a bike or swim present the sweep reroutes rather than walks,
    // and such a week is multi-sport, already held at 3 by the consumer clause beside it.
    // The two keys are therefore deliberately different, and g205_d132_walkweek asserts
    // the property of the WEEK rather than mirroring this line, so that a future
    // divergence between cause and effect fails by name instead of shipping quietly.
    const _walkOnly = (cardioMode === 'noimpact' || cardioMode === 'noimpact_swim');
    const _ceil = (PACE_GOALS.has(goalId) && (cardioTypes.length !== 1 || _walkOnly)) ? Math.min(ceiling, 3) : ceiling;
"""
))

# ── EDIT 1c — the engine caller hands the mode across. The OTHER caller (the rest-days
# wizard nudge, getDayAdvisories) deliberately passes nothing: the wizard draft carries
# no injury field at all (there is no WD.injury anywhere in the file), injury arrives
# later as an overlay on a built program, so cardioMode is unreachable at draft time and
# omitting it is the honest value, not a divergence between the two callers.
EDITS_HTML.append((
"  const _alloc = sportDayTargets(cardioTypes, cardioGoals, cardioTrainDays.length, cfg.goal);   // V187 (F2): resolved lift goal\n",
"""  // V205 (D132): the injury plan is read here, once, and only its cardioMode crosses the
  // call. injuryPlan is a pure function of cfg and builds a fresh object every time, so
  // this reads cfg and mutates nothing.
  const _d132Plan = injuryPlan(cfg);
  const _alloc = sportDayTargets(cardioTypes, cardioGoals, cardioTrainDays.length, cfg.goal, _d132Plan && _d132Plan.cardioMode);   // V187 (F2): resolved lift goal; V205 (D132): cardioMode
"""
))

# ── EDIT 3 — the D-code registry. D131 was assigned and then WITHDRAWN as unreachable;
# it stays consumed and is never reused.
EDITS_DOC = [(
"highest assigned = D130. Next free = D131.",
"highest assigned = D132. Next free = D133."
)]

# ── assert every anchor BEFORE writing a byte ────────────────────────────────────────
bad = []
for i, (old, new) in enumerate(EDITS_HTML):
    n = html.count(old)
    print('index.html anchor %d: count=%d' % (i + 1, n))
    if n != 1: bad.append('index.html anchor %d count=%d (need 1): %r' % (i + 1, n, old[:70]))
for i, (old, new) in enumerate(EDITS_DOC):
    n = doc.count(old)
    print('handoff anchor %d: count=%d' % (i + 1, n))
    if n != 1: bad.append('handoff anchor %d count=%d (need 1): %r' % (i + 1, n, old[:70]))
if bad:
    for b in bad: print('ABORT ' + b)
    sys.exit(1)

for old, new in EDITS_HTML: html = html.replace(old, new, 1)
for old, new in EDITS_DOC:  doc  = doc.replace(old, new, 1)

# the version meta is the last thing checked and it must NOT have moved
assert html.count('<meta name="ia-version" content="205">') == 1, 'ia-version moved'

write(HTML, html)
write(DOC, doc)
print('OK: 3 replacements in index.html, 1 in IRON_ASYLUM_HANDOFF_1_1.md, ia-version held at 205')
