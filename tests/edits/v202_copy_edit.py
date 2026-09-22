#!/usr/bin/env python3
# V202 slice 2 of 5 — COPY ONLY (D100/D101 athlete-facing strings).
# E4  the dampened pace-clock note  (D101's number, D101's sentence)
# E5  runAnchorSentence             (scope claim + copy-rule dash)
# E6  runAnchorLine                 (clipboard mirror of E5)
# No engine arithmetic. No ia-version bump (slice 5 owns it).
# Literal bytes throughout: the anchors CONTAIN real em-dashes.
import sys, io

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(PATH, encoding='utf-8').read()
orig = src
reps = []

def rep(tag, old, new, n=1):
    reps.append((tag, old, new, n))

# ── E4 ── dampened pace-clock note ────────────────────────────────────────────
rep('E4 note',
"""            note = `INT — Interval: Pace capped at +${pp._weeklyGain}s/mi/week (physiological safety limit). Full goal of ${goalFmt}/mi requires more time — realistic target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;""",
"""            note = `INT — Interval: Pace moves ${pp._weeklyGain} seconds per mile each week. That is the safe rate for your experience and age. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;""")

# ── E5 ── runAnchorSentence: goal-scoped tail, comma for the em-dash ──────────
rep('E5 tail',
"""  const tail = ' Every pace in this program comes from this row.';""",
"""  const tail = (a.goalId === 'run_pace_goal')
    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'
    : ' Every pace in this program comes from this row.';""")

rep('E5 clamped',
"""    return `Anchored on ${art} <b>${m} mile</b> — ${raw} ${why}, so its ${a.clamped==='fast'?'fastest':'slowest'} row is used.` + tail;""",
"""    return `Anchored on ${art} <b>${m} mile</b>, ${raw} ${why}, so its ${a.clamped==='fast'?'fastest':'slowest'} row is used.` + tail;""")

rep('E5 seeded',
"""  if(a.kind === 'seeded')   return `Anchored on ${art} <b>${m} mile</b> — worked back from ${a.n>0?a.n:'the'} recovery run${a.n===1?'':'s'} you logged in ${a.prog||'your last program'}.` + tail;""",
"""  if(a.kind === 'seeded')   return `Anchored on ${art} <b>${m} mile</b>, worked back from ${a.n>0?a.n:'the'} recovery run${a.n===1?'':'s'} you logged in ${a.prog||'your last program'}.` + tail;""")

rep('E5 entered',
"""  if(a.kind === 'entered')  return `Anchored on ${art} <b>${m} mile</b> — the time you entered.` + tail;""",
"""  if(a.kind === 'entered')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;""")

rep('E5 beginner',
"""  if(a.kind === 'beginner') return `Anchored on ${art} <b>${m} mile</b> — the beginner default. A mile time starts being used at intermediate.`;""",
"""  if(a.kind === 'beginner') return `Anchored on ${art} <b>${m} mile</b>, the beginner default. A mile time starts being used at intermediate.`;""")

rep('E5 default',
"""  return `Anchored on ${art} <b>${m} mile</b> — estimated from experience; no mile time was entered.` + tail;""",
"""  return `Anchored on ${art} <b>${m} mile</b>, estimated from experience; no mile time was entered.` + tail;""")

# ── E6 ── runAnchorLine: clipboard mirrors the card's scope claim ─────────────
# Separator is ' | ', the separator every other progSelLines field already uses.
# The beginner form is excluded for the same reason E5 excludes it: the beginner card ends on
# its own sentence and takes NEITHER tail, so a clipboard that appended one would stop mirroring.
rep('E6 line',
"""  return `Run anchor: ${m} mile (${prov}) → ${chips}`;""",
"""  const scope = (a.goalId === 'run_pace_goal' && a.kind !== 'beginner') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';
  return `Run anchor: ${m} mile (${prov}) → ${chips}${scope}`;""")

# ── assert every anchor BEFORE writing anything ───────────────────────────────
fail = False
for tag, old, new, n in reps:
    c = src.count(old)
    print('%-14s count==%d (want %d)' % (tag, c, n))
    if c != n:
        fail = True
if fail:
    sys.exit('ABORT: anchor count mismatch, nothing written.')

for tag, old, new, n in reps:
    src = src.replace(old, new)

assert src != orig
io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes)' % (PATH, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
