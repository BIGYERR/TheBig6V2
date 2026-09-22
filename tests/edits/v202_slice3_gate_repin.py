#!/usr/bin/env python3
# V202 slice 3 — re-pin the two INT cards in tests/gates/g202_pace_anchor.js.
# Both moved by RULING, not by drift:
#   E8 (D111, A 251-252): the interval pace is base minus 16 s/mi, not base x0.95.
#   E9 (D105, A 259-263): the pace index holds at the START pace until reps first reach 8.
# The new numbers are re-derived by hand from the gate's OWN pinned progression array
# (PIN.arr[0] = 509.3) and the rep grid, NOT read off the engine:
#   the rep grid on this cfg is 4,4,5,3,7,8 and reps first reach 8 in week 6, which is the
#   LAST INT week, so the held index never leaves 0 and every INT week reads
#   509.3 - 16 = 493.3 s/mi -> dose 493 -> printed 8:13/mi.
#   W1 484 (8:04/mi) -> 493 (8:13/mi);  W6 460 (7:40/mi) -> 493 (8:13/mi).
# The doctrine derivation itself lives in tests/gates/g202_int_doctrine.js.
import io, sys

SRC = 'tests/gates/g202_pace_anchor.js'
with io.open(SRC, encoding='utf-8') as f:
    s = f.read()

EDITS = []
def rep(tag, old, new):
    EDITS.append((tag, old, new))

rep('PIN.cards W1 and W6 INT', """  cards: [ { w:1,  st:/Interval/,                tgt:484, pace:'8:04/mi'  },
           { w:6,  st:/Interval/,                tgt:460, pace:'7:40/mi'  },""",
"""  // V202 slice 3 re-pin, by RULING not by drift. D111 (A 251-252) makes the interval pace
  // the base pace LESS 16 s/mi instead of x0.95, and D105 (A 259-263) holds the pace index at
  // the start pace until reps first reach 8. On this cfg reps run 4,4,5,3,7,8 and first reach 8
  // in week 6, the LAST INT week, so the index never leaves 0: every INT week reads
  // PIN.arr[0] 509.3 less 16 = 493.3 s/mi, which the dose rounds to 493 and the card prints as
  // 8:13/mi. Both rows are hand arithmetic on the array above, not a reading of the artifact.
  // The doctrine derivation and the recovery band live in tests/gates/g202_int_doctrine.js.
  cards: [ { w:1,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },
           { w:6,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },""")

rep('Q8 message', """ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 484 (8:04/mi), W6 INT 460 (7:40/mi), `""",
"""ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 493 (8:13/mi), W6 INT 493 (8:13/mi) — both held at `
  + `509.3 less D111's 16 s/mi because D105 keeps the pace clock parked until reps reach 8 — `""")

fail = False
for tag, old, new in EDITS:
    c = s.count(old)
    print('anchor %-28s count=%d (want 1)' % (tag, c))
    if c != 1:
        fail = True
if fail:
    sys.stderr.write('ABORT: an anchor did not match exactly once. Nothing written.\n')
    sys.exit(1)

for tag, old, new in EDITS:
    s = s.replace(old, new, 1)

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('WROTE %s' % SRC)
