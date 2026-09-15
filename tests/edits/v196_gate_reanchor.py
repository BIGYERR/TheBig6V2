#!/usr/bin/env python3
# V196 follow-up — re-anchor the D53 block of tests/gates/g194_implement_and_range.js.
#
# NOT an index.html edit. ia-version stays 196. This script touches ONE file: the gate.
#
# WHY. Two V196 rulings moved the ground under V194's D53 oracle, and nothing else:
#   D57  the plotted value on a main-lift model was renamed `wt` -> `v` (it is no longer
#        always a weight), `first` gained `week`, `hidden` was replaced by the four
#        accounting fields plotted/accessoryDay/noLoad/entries, and `mode` was added.
#        The V195-shaped fixture therefore renders "NaN×12 ... in week undefined".
#   D59  the honesty rider requires "Opened at" to name the week of the FIRST PLOTTED
#        session. No artifact satisfying D59 can emit the old hand-typed string.
#
# SCOPE LOCK. Only the two expected strings, the two hand-built D53 fixtures, and the
# comment that documents O1 change. No assertion is added, removed, weakened or renamed.
# D54 and D55 are untouched. Assertion count before == assertion count after.

import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g194_implement_and_range.js'
src = io.open(P, encoding='utf-8').read()

EDITS = []

# 1. O1 oracle comment. The hand-rendered line it quotes must be the D59 line, or the
#    document describing the oracle contradicts the oracle. Comment only, no assertion.
EDITS.append((
"""//   O1  THE HAND-RENDERED LINE. The expected progress line is typed here by hand from the
//       ruling's after-grid: "Opened at 60×12 · up 20 lbs · heaviest in week 3". The kg
//       variant is computed by hand off the file's own rounding rule (round(w*0.453592*2)/2:
//       80 lbs -> 36.5 kg, 60 lbs -> 27 kg, gain 9.5 kg) and typed as a literal, not read
//       back out of disp().
""",
"""//   O1  THE HAND-RENDERED LINE. The expected progress line is typed here by hand from the
//       ruling's after-grid: "Opened at 60×12 in week 1 · up 20 lbs · heaviest in week 3".
//       The "in week 1" is V196 D59's honesty rider: "Opened at" must name the week of the
//       FIRST PLOTTED session, so an athlete who trained from week 1 and first wrote a
//       weight in week 6 is never told they opened in week 6. The kg variant is computed by
//       hand off the file's own rounding rule (round(w*0.453592*2)/2: 80 lbs -> 36.5 kg,
//       60 lbs -> 27 kg, gain 9.5 kg) and typed as a literal, not read back out of disp().
"""))

# 2. The D53 fixture, restated in the D57 model shape. Still hand built; still nothing
#    out of buildProgram. `first.week` is new because D59 reads it; the four accounting
#    fields are carried so the fixture is a faithful ledgerModel main row, not a subset.
EDITS.append((
"""const MODEL = {
  name: 'Bench press',
  series: [{ w: 1, wt: 60 }, { w: 3, wt: 80 }],
  heavy: { wt: 80, reps: 12, week: 3 },
  first: { wt: 60, reps: 12 },
  hidden: 0
};
""",
"""const MODEL = {
  name: 'Bench press',
  mode: 'load',
  series: [{ w: 1, v: 60 }, { w: 3, v: 80 }],
  heavy: { v: 80, reps: 12, week: 3 },
  first: { v: 60, reps: 12, week: 1 },
  plotted: 2, accessoryDay: 0, noLoad: 0, entries: 2
};
"""))

# 3. The lbs expectation.
EDITS.append((
"""  const want = 'Bench press 80×12 Opened at 60×12 · up 20 lbs · heaviest in week 3';
""",
"""  const want = 'Bench press 80×12 Opened at 60×12 in week 1 · up 20 lbs · heaviest in week 3';
"""))

# 4. The kg twin.
EDITS.append((
"""  const wantKg = 'Bench press 36.5×12 Opened at 27×12 · up 9.5 kg · heaviest in week 3';
""",
"""  const wantKg = 'Bench press 36.5×12 Opened at 27×12 in week 1 · up 9.5 kg · heaviest in week 3';
"""))

# 5. The O4 no-gain control fixture, same shape change. Its ASSERTION is unchanged:
#    no " up " clause, and "heaviest in week 2" still present.
EDITS.append((
"""  const flat = { name: 'Bench press', series: [{ w: 1, wt: 60 }, { w: 2, wt: 60 }],
                 heavy: { wt: 60, reps: 10, week: 2 }, first: { wt: 60, reps: 10 }, hidden: 0 };
""",
"""  const flat = { name: 'Bench press', mode: 'load',
                 series: [{ w: 1, v: 60 }, { w: 2, v: 60 }],
                 heavy: { v: 60, reps: 10, week: 2 }, first: { v: 60, reps: 10, week: 1 },
                 plotted: 2, accessoryDay: 0, noLoad: 0, entries: 2 };
"""))

for i, (old, new) in enumerate(EDITS, 1):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %d matched %d times (expected 1):\n%s\n' % (i, n, old[:120]))
        sys.exit(1)
    src = src.replace(old, new)

io.open(P, 'w', encoding='utf-8').write(src)
print('v196_gate_reanchor: %d anchors applied to %s' % (len(EDITS), P))
