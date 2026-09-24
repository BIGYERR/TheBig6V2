# v216_closeA.py — V216 close, part A (4 edits): the era rows D154/D156 leave UNMOVED, coach's text verbatim.
#   1-3  tests/harness.js: MANNY_DIGEST / MANNY_DELOAD_OFF / MANNY_CORE_OFF rows for 216 (references to 215;
#        coach printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 on the V216 tree).
#   4    tests/gates/g197b_sweep.js: HF_LEAK row for 216 (reference to 215; 0/0 printed).
# Each row is inserted directly under its 215 row; the anchor is the 215 row's prefix, asserted count==1.
# Part B (the three g199 rows, then the ia-version meta LAST) follows in v216_closeB.py.
#   python3 tests/edits/v216_closeA.py
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
EDITS = [
 ('tests/harness.js', "MANNY_DIGEST_BY_VERSION[215] = MANNY_DIGEST_BY_VERSION[214];",
  "MANNY_DIGEST_BY_VERSION[216] = MANNY_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED (printed by coach on the V216 tree)"),
 ('tests/harness.js', "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214];",
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[216] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED"),
 ('tests/harness.js', "MANNY_CORE_OFF_DIGEST_BY_VERSION[215] = MANNY_CORE_OFF_DIGEST_BY_VERSION[214];",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[216] = MANNY_CORE_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED"),
 ('tests/gates/g197b_sweep.js', "HF_LEAK_BY_VERSION[215] = HF_LEAK_BY_VERSION[214];",
  "HF_LEAK_BY_VERSION[216] = HF_LEAK_BY_VERSION[215];   // D154/D156: ruled UNMOVED (D154 swaps to a pushup, D156 draws less; neither adds a machine or cable item)"),
]
src = {}
for f, a, row in EDITS:
    if f not in src: src[f] = io.open(ROOT + f, encoding='utf-8').read()
    c = src[f].count(a)
    print(f"{f}: anchor {a[:48]}... count={c}")
    if c != 1: sys.exit(f"ABORT: {f} anchor count {c}, nothing written")
    tag = row.split(' = ')[0]
    if tag in src[f]: sys.exit(f"ABORT: {f} already holds {tag}, nothing written")
for f, a, row in EDITS:
    s = src[f]; i = s.index(a); j = s.index('\n', i) + 1
    src[f] = s[:j] + row + '\n' + s[j:]
for f in src:
    io.open(ROOT + f, 'w', encoding='utf-8').write(src[f])
    print('written', f)
