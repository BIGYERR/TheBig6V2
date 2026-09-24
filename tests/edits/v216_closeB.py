# v216_closeB.py — V216 close, part B (4 edits), coach's text verbatim.
#   1-3  tests/gates/g199_deload_arbitration.js: DELOAD_ARB / E6 / DELOAD_HINGE rows for 216 (references to 215;
#        coach printed C1 364 C3 364 C5 32 D2 19 I3 496, E6 28, E1a 12384 E1b 9319 E3 44 G1 1290 G5 44 on the V216 tree).
#        Inserted as a group under the 215 group, same order as the 215 rows; each anchor is the line the row goes
#        under, asserted count==1 at the moment of insertion.
#   4    index.html: <meta name="ia-version"> 215 -> 216, LAST (Mario authorized the bump).
# Every anchor is checked before anything is written; a miss aborts with nothing written.
#   python3 tests/edits/v216_closeB.py
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
G199 = 'tests/gates/g199_deload_arbitration.js'
ROWS = [  # (anchor = the line this row goes under, row)
 ("DELOAD_HINGE_BY_VERSION[215] = { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12384, G1: 1290 };",
  "DELOAD_ARB_BY_VERSION[216] = DELOAD_ARB_BY_VERSION[215];   // D154/D156: ruled UNMOVED (C1 364, C5 32, D2 19, I3 496 printed identical)"),
 ("DELOAD_ARB_BY_VERSION[216] = DELOAD_ARB_BY_VERSION[215];",
  "E6_BY_VERSION[216] = E6_BY_VERSION[215];   // D154/D156: ruled UNMOVED (28 printed)"),
 ("E6_BY_VERSION[216] = E6_BY_VERSION[215];",
  "DELOAD_HINGE_BY_VERSION[216] = DELOAD_HINGE_BY_VERSION[215];   // D154/D156: ruled UNMOVED (E1a 12384, E1b 9319, E3 44, G1 1290, G5 44 printed; a Delts finisher is not posterior and a triceps rename is not a hinge)"),
]
META = ('<meta name="ia-version" content="215">', '<meta name="ia-version" content="216">')
s = io.open(ROOT + G199, encoding='utf-8').read()
h = io.open(ROOT + 'index.html', encoding='utf-8').read()
for a, row in ROWS:
    tag = row.split(' = ')[0]
    if tag in s: sys.exit(f"ABORT: g199 already holds {tag}, nothing written")
# first anchor must exist once in the untouched file; the others are the rows this script writes
c = s.count(ROWS[0][0]); print(f"g199 anchor 1 count={c}")
if c != 1: sys.exit(f"ABORT: g199 anchor 1 count {c}, nothing written")
c = h.count(META[0]); print(f"index.html meta anchor count={c}")
if c != 1: sys.exit(f"ABORT: meta anchor count {c}, nothing written")
for k, (a, row) in enumerate(ROWS):
    c = s.count(a)
    if c != 1: sys.exit(f"ABORT: g199 anchor {k+1} count {c} during insertion, nothing written")
    i = s.index(a); j = s.index('\n', i) + 1
    s = s[:j] + row + '\n' + s[j:]
h = h.replace(META[0], META[1], 1)   # LAST
if h.count(META[1]) != 1: sys.exit("ABORT: meta post-condition, nothing written")
io.open(ROOT + G199, 'w', encoding='utf-8').write(s); print('written', G199)
io.open(ROOT + 'index.html', 'w', encoding='utf-8').write(h); print('written index.html (ia-version 216)')
