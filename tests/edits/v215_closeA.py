# v215_closeA.py — V215 close, part A (4 edits): the era rows D149 leaves UNMOVED, coach's text verbatim.
#   1-3  tests/harness.js: MANNY_DIGEST / MANNY_DELOAD_OFF / MANNY_CORE_OFF rows for 215 (references to 214;
#        coach printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 on the V215 tree, and the
#        builder's g199 / g200 runs on the slice 2 tree read the same three).
#   4    tests/gates/g197b_sweep.js: HF_LEAK row for 215 (reference to 214; 0/0).
# Each row is inserted directly under its 214 row; the anchor is the 214 row's prefix, asserted count==1.
# Part A2 (g199) and part B (g199 G1/G2, g210 D154 licence, the ia-version meta LAST) follow.
#   python3 tests/edits/v215_closeA.py
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
EDITS = [
 ('tests/harness.js', "MANNY_DIGEST_BY_VERSION[214] = MANNY_DIGEST_BY_VERSION[213];",
  "MANNY_DIGEST_BY_VERSION[215] = MANNY_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V215 tree; HALF_MANNY draws no GHD name)"),
 ('tests/harness.js', "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213];",
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED"),
 ('tests/harness.js', "MANNY_CORE_OFF_DIGEST_BY_VERSION[214] = MANNY_CORE_OFF_DIGEST_BY_VERSION[213];",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[215] = MANNY_CORE_OFF_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED"),
 ('tests/gates/g197b_sweep.js', "HF_LEAK_BY_VERSION[214] = HF_LEAK_BY_VERSION[213];",
  "HF_LEAK_BY_VERSION[215] = HF_LEAK_BY_VERSION[214];   // D149: ruled UNMOVED (0/0 printed by coach on the V215 tree)"),
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
