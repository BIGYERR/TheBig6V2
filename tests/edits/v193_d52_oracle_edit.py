#!/usr/bin/env python3
# V193 D52 — g193_samecard's O4 hand table encoded the pre-D52 pool, so G4c failed on the
# fixed artifact. The oracle line is provably wrong, not the build: it (i) lists 'L-sit
# chinups' as a legal member of a pool whose own overlay nulls that name, and (ii) derives
# the accessory pool by subtracting the WHOLE main pool, which is error (b) D52 removes.
# Only the hand table moves. Every assertion built on it is untouched.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_samecard.js'
s = io.open(P, encoding='utf-8').read()
reps = []

reps.append(('vpull-list', """// The five cable-free vertical pulls, hand typed, with what each one needs.
const VPULL = [
  { name: 'Assisted pullups',     need: null   },
  { name: 'Neutral-grip chinups', need: null   },
  { name: 'Chinups',              need: null   },
  { name: 'L-sit chinups',        need: null   },
  { name: 'Weighted chinups',     need: 'load' },
];""", """// The cable-free vertical pulls this branch may offer, hand typed, with what each needs.
// 'L-sit chinups' is NOT one of them and this is the whole of D52's first error: an L-sit
// is loaded lumbar flexion, so the same overlay maps it to null in SPINE_SWAP — delete
// with no substitute. A pool may not offer a movement its own filter removes, so the
// membership is EXLIB.back_pull minus that null, plus the assisted regression.
const VPULL = [
  { name: 'Assisted pullups',     need: null   },
  { name: 'Neutral-grip chinups', need: null   },
  { name: 'Chinups',              need: null   },
  { name: 'Weighted chinups',     need: 'load' },
];"""))

reps.append(('rowpool-derivation', """// The pool the row slot should be left with, derived by hand from the two lists above.
const LB_ROWPOOL = e => TIERS[e].cables
  ? ['Straight-arm pulldown']
  : VPULL.filter(m => m.need === null || TIERS[e][m.need])
         .map(m => m.name)
         .filter(n => LB_MAIN(e).indexOf(n) < 0);""", """// The pool the row slot should be left with. D52's second error was subtracting the whole
// main pool here to prevent ONE duplicate, which starved home_full to two members. Only
// the name the day actually DRAWS can collide, and that exclusion now lives at the
// row-slot draw site where backMain exists. So the hand pool is the gear-legal family,
// and G4b below is what proves the drawn main is never the name that comes back.
const LB_ROWPOOL = e => TIERS[e].cables
  ? ['Straight-arm pulldown']
  : VPULL.filter(m => m.need === null || TIERS[e][m.need])
         .map(m => m.name);"""))

reps.append(('o4-message', """  if (pool.length >= 2) ok(`O4 ${e}: ${pool.length} vertical pulls survive the main-lift subtraction [${pool.join(', ')}]`);
  else bad(`O4 ${e}: the row pool is left with ${pool.length} member(s) [${pool.join(', ')}] — a one-item pool is the defect this fix exists to remove, not a smaller version of it`);""",
"""  // The floor is checked against the pool MINUS one drawn main, which is the worst case
  // the draw site can produce. Two is D44's number.
  if (pool.length - 1 >= 2) ok(`O4 ${e}: ${pool.length} vertical pulls legal, ${pool.length - 1} left once the drawn main is excluded [${pool.join(', ')}]`);
  else bad(`O4 ${e}: the row pool is left with ${pool.length - 1} member(s) once the drawn main is excluded [${pool.join(', ')}] — a one-item pool is the defect this fix exists to remove, not a smaller version of it`);"""))

for tag, old, new in reps:
    c = s.count(old)
    if c != 1:
        sys.stderr.write('ABORT %s: count==%d\n' % (tag, c))
        sys.exit(1)
    s = s.replace(old, new, 1)

io.open(P, 'w', encoding='utf-8').write(s)
print('OK %d replacements' % len(reps))
