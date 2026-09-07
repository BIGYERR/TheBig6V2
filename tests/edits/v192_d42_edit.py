#!/usr/bin/env python3
# V192 D42 slice 2 — 'Landmine rotational press': the NAME, its CLASSIFICATION and its
# INJURY behaviour. No version bump (a later slice owns the bump). A later slice owns the
# equipment gate and the side-print; nothing here touches EX_MIN_EXP, REP_AFFINITY,
# _REP_FLOOR, _BW_SUBS, shoulderAccPool, _isCompound, CORE_PILLARS or powerPool.
#   1) EXLIB.shoulder  — pool gains the name (append, last position).
#   2) _pattern        — exact-anchored /^landmine rotational press$/ -> 'hpress',
#                        inserted ABOVE the /rotation/ core-exempt alternation.
#   3) dropNames @ lowback/protect     — gains |landmine rotational
#   4) dropNames @ lowback/workaround  — gains |landmine rotational
# Every anchor asserted count==1 before any write; first miss aborts the whole script.
import io, sys

SRC = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
NEW = 'Landmine rotational press'

with io.open(SRC, encoding='utf-8') as f:
    s = f.read()
orig = s

edits = []

# ── 1. EXLIB.shoulder ─────────────────────────────────────────────────────────
a1 = ("  shoulder:['Barbell overhead press','Dumbbell Arnold press',"
      "'Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press'],")
b1 = ("  // V192 (D42): landmine rotational press — a pressing movement that starts at the\n"
      "  // shoulder and finishes forward at chest height, driven by hip rotation. It lives in\n"
      "  // the shoulder pool because the pattern is a press, not a core drill; _pattern reads\n"
      "  // it as 'hpress' for exactly that reason.\n"
      "  shoulder:['Barbell overhead press','Dumbbell Arnold press',"
      "'Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press',"
      "'" + NEW + "'],")
edits.append(('EXLIB.shoulder', a1, b1))

# ── 2. _pattern ───────────────────────────────────────────────────────────────
# Anchor is the core-exempt alternation itself. The new rule is inserted ABOVE it.
a2 = ("  if(/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation|curl-up/"
      ".test(N)) return null; // core, exempt")
b2 = ("  // V192 (D42): the landmine rotational press is a PRESS, not a rotational core drill.\n"
      "  // This line sits ABOVE the core-exempt alternation below on purpose, and it is\n"
      "  // exact-anchored (^...$) precisely so that placing it above costs the core drills\n"
      "  // nothing: no rotational core movement can reach it. 'Landmine rotations', 'Pallof\n"
      "  // press', 'Windshield wipers' and 'Thoracic rotations' all fail the exact match and\n"
      "  // classify exactly as they did before this line existed. Do NOT generalise it to\n"
      "  // /landmine.*press/ or /rotational press/ — that is the one-token-two-meanings trap\n"
      "  // this file has paid for twice (V119 incline, V162 l-sit chinup).\n"
      "  // 'hpress', not 'vpress': the bar path finishes FORWARD at chest height, not\n"
      "  // overhead. V185 (D1) ruled the horizontal default of the bare /press/ catch-all\n"
      "  // deliberate, and this movement is the horizontal case.\n"
      "  // Without this classification the movement is _pattern-null: invisible to all three\n"
      "  // region caps, and KEPT by applyInjuryFilter even at shoulder/protect.\n"
      "  if(/^landmine rotational press$/.test(N)) return 'hpress';\n"
      "  if(/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation|curl-up/"
      ".test(N)) return null; // core, exempt")
edits.append(('_pattern core-exempt', a2, b2))

# ── 3. dropNames @ lowback / protect ──────────────────────────────────────────
a3 = ("      P.dropNames=/good morning|swing|deadlift|pendlay|back extension|hyperextension"
      "|pull-through|pull through/i;")
b3 = ("      // V192 (D42): the landmine rotational press is dropped by NAME here. Its pattern\n"
      "      // is 'hpress', which this plan neither drops nor caps, so pattern gives a low\n"
      "      // back no protection at all. And a generated caption cannot guarantee the\n"
      "      // athlete rotates from the hip rather than the lumbar spine. Matches\n"
      "      // 'landmine rotational', which does not touch 'Landmine rotations' (no 'al')\n"
      "      // or 'Landmine reverse lunge'.\n"
      "      P.dropNames=/good morning|swing|deadlift|pendlay|back extension|hyperextension"
      "|pull-through|pull through|landmine rotational/i;")
edits.append(('dropNames lowback/protect', a3, b3))

# ── 4. dropNames @ lowback / workaround ───────────────────────────────────────
a4 = "      P.dropNames=/good morning|swing|pendlay/i;"
b4 = ("      // V192 (D42): same reason as the protect tier above. 'hpress' is uncapped here\n"
      "      // too, so the only lever that reaches this movement is the name.\n"
      "      P.dropNames=/good morning|swing|pendlay|landmine rotational/i;")
edits.append(('dropNames lowback/workaround', a4, b4))

fail = False
for name, a, _ in edits:
    n = s.count(a)
    print('anchor %-30s count==%d' % (name, n))
    if n != 1:
        fail = True
if fail:
    sys.stderr.write('ABORT: anchor count != 1, no bytes written\n')
    sys.exit(1)

for name, a, b in edits:
    s = s.replace(a, b, 1)

assert s != orig, 'ABORT: no change produced'
n_name = s.count("'" + NEW + "'")
assert n_name == 1, "expected exactly 1 quoted occurrence of the new name (EXLIB.shoulder), got %d" % n_name
assert s.count('/^landmine rotational press$/') == 1, 'ABORT: _pattern rule not written once'
assert s.count('|landmine rotational/i') == 2, 'ABORT: expected 2 dropNames additions'
assert orig.count('ia-version" content="191"') == s.count('ia-version" content="191"') == 1, \
    'ABORT: version meta must be untouched at 191'

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('WROTE %s (+%d bytes)' % (SRC, len(s) - len(orig)))
