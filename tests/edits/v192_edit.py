#!/usr/bin/env python3
# V192 D41 — first loaded frontal-plane movement: 'Dumbbell goblet side lunge'.
# Three edits, no version bump (a later slice owns the bump).
#   1) EXLIB.lunge          — barbell-branch lunge pool gains the name (append).
#   2) lungePool non-barbell literal — the _bw() SECOND argument (loaded, non-barbell)
#      gains the name. The FIRST argument is the bodyweight rung list, ordered
#      EASY->HARD and windowed by _bwRung: it is NOT touched.
#   3) _BW_SUBS             — room-only fallback to 'Side lunge (bodyweight)'.
# Every anchor asserted count==1 before any write; first miss aborts the whole script.
import io, sys

SRC = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
NEW = 'Dumbbell goblet side lunge'

with io.open(SRC, encoding='utf-8') as f:
    s = f.read()
orig = s

edits = []

# ── 1. EXLIB.lunge ────────────────────────────────────────────────────────────
a1 = ("  lunge:['Dumbbell Bulgarian split squat','Reverse lunge (KB)',"
      "'Walking lunge (KB)','Step-ups (KB)','Landmine reverse lunge'],")
b1 = ("  // V192 (D41): dumbbell goblet side lunge — the first LOADED frontal-plane movement\n"
      "  // in the file. The app trained two planes; NSW asks for three. Goblet, not Zercher:\n"
      "  // the anterior counterweight makes the pattern self-coaching and leaves a bail path.\n"
      "  // The name deliberately avoids the word 'lateral' — _isCompound's exclusion regex\n"
      "  // vetoes any name containing it, which would strip this of compound status.\n"
      "  lunge:['Dumbbell Bulgarian split squat','Reverse lunge (KB)',"
      "'Walking lunge (KB)','Step-ups (KB)','Landmine reverse lunge','" + NEW + "'],")
edits.append(('EXLIB.lunge', a1, b1))

# ── 2. lungePool, non-barbell branch (second _bw arg only) ────────────────────
a2 = ("  let lungePool=hasBarbell?EXLIB.lunge:_bw(['Reverse lunge','Walking lunge',"
      "'Step-ups (chair)','Bulgarian split squat (foot on chair)'],"
      "['Reverse lunge (KB)','Walking lunge (KB)','Step-ups (KB)',"
      "'Dumbbell Bulgarian split squat']);")
b2 = ("  // V192 (D41): the frontal-plane lunge reaches the no-barbell tier through the LOADED\n"
      "  // list only. The bodyweight list beside it is a rung ladder (easy->hard, windowed by\n"
      "  // _bwRung); a goblet needs a bell, and inserting it there would also shift the window.\n"
      "  let lungePool=hasBarbell?EXLIB.lunge:_bw(['Reverse lunge','Walking lunge',"
      "'Step-ups (chair)','Bulgarian split squat (foot on chair)'],"
      "['Reverse lunge (KB)','Walking lunge (KB)','Step-ups (KB)',"
      "'Dumbbell Bulgarian split squat','" + NEW + "']);")
edits.append(('lungePool non-barbell literal', a2, b2))

# ── 3. _BW_SUBS ───────────────────────────────────────────────────────────────
a3 = "  'Slow goblet squat (KB)':'Squat (slow 3s tempo)'\n};"
b3 = ("  'Slow goblet squat (KB)':'Squat (slow 3s tempo)',\n"
      "  // V192 (D41): keep the PLANE when the bell disappears. The generic _bwFallback reads\n"
      "  // the pattern, not the plane, and would land this back in the sagittal plane.\n"
      "  '" + NEW + "':'Side lunge (bodyweight)'\n};")
edits.append(('_BW_SUBS tail', a3, b3))

# ── assert every anchor first, write nothing until all pass ───────────────────
fail = False
for name, a, _ in edits:
    n = s.count(a)
    print('anchor %-32s count==%d' % (name, n))
    if n != 1:
        fail = True
if fail:
    sys.stderr.write('ABORT: anchor count != 1, no bytes written\n')
    sys.exit(1)

for name, a, b in edits:
    s = s.replace(a, b, 1)

assert s != orig, 'ABORT: no change produced'
assert s.count("'" + NEW + "'") == 3, \
    "expected 3 occurrences of the new name (EXLIB, pool, _BW_SUBS key, and none else), got %d" % s.count("'" + NEW + "'")

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('WROTE %s (+%d bytes)' % (SRC, len(s) - len(orig)))
