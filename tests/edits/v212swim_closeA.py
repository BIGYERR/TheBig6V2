#!/usr/bin/env python3
# V212 closing, part A (coach's exact text). HALF_MANNY printed by coach on the final V212 tree:
# ON 0ac7da6b1691a8e1, DELOAD_OFF 1069cd7f86eed204, CORE_OFF 9d14801a63111081 (swim only diff).
#   1  tests/harness.js: the three HALF_MANNY era rows for 212, REFERENCE rows (ruled UNMOVED).
#   2  g199: DELOAD_ARB / E6 / DELOAD_HINGE rows for 212 (DELOAD_HINGE_ROW_FOR maps v > 210 to its
#      own row, so 212 needs one; DELOAD_HINGE_EXCLUDES_TIER_B is +v >= 211, so 212 stays excluded).
#   3  g197b: HF_LEAK row for 212.
# Aborts on the first anchor miss, before writing anything.
import io, sys
T = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'
WHY = "   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)"
EDITS = [
 (T + 'harness.js', '1 harness MANNY rows',
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[211] = MANNY_CORE_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)\n",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[211] = MANNY_CORE_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)\n"
  "MANNY_DIGEST_BY_VERSION[212] = MANNY_DIGEST_BY_VERSION[211];" + WHY + "\n"
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211];" + WHY + "\n"
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[212] = MANNY_CORE_OFF_DIGEST_BY_VERSION[211];" + WHY + "\n"),
 (T + 'gates/g199_deload_arbitration.js', '2 g199 rows',
  "E6_BY_VERSION[211] = E6_BY_VERSION[210]; // D155: ruled UNMOVED (28 printed)\n",
  "E6_BY_VERSION[211] = E6_BY_VERSION[210]; // D155: ruled UNMOVED (28 printed)\n"
  "DELOAD_ARB_BY_VERSION[212] = DELOAD_ARB_BY_VERSION[211];   // D110a: ruled UNMOVED, no lift section touched\n"
  "E6_BY_VERSION[212] = E6_BY_VERSION[211];   // D110a: ruled UNMOVED, no lift section touched\n"
  "DELOAD_HINGE_BY_VERSION[212] = DELOAD_HINGE_BY_VERSION[211];   // D110a: ruled UNMOVED, no lift section touched\n"),
 (T + 'gates/g197b_sweep.js', '3 g197b row',
  "HF_LEAK_BY_VERSION[211] = HF_LEAK_BY_VERSION[210];   // D153/D155: ruled UNMOVED (both only remove or choose among already-drawn items; neither draws a machine or cable item)\n",
  "HF_LEAK_BY_VERSION[211] = HF_LEAK_BY_VERSION[210];   // D153/D155: ruled UNMOVED (both only remove or choose among already-drawn items; neither draws a machine or cable item)\n"
  "HF_LEAK_BY_VERSION[212] = HF_LEAK_BY_VERSION[211];   // D110a: ruled UNMOVED, no lift section touched\n"),
]
srcs = {}
for f, tag, a, b in EDITS:
    s = srcs.get(f) or io.open(f, encoding='utf-8').read()
    n = s.count(a)
    if n != 1: print('ABORT:', tag, 'anchor count', n); sys.exit(1)
    if '[212]' in b.split(a, 1)[-1] and s.count(b.replace(a, '', 1).split('=')[0]) != 0:
        print('ABORT:', tag, '212 row already present'); sys.exit(1)
    srcs[f] = s.replace(a, b, 1); print('OK', tag)
for f, s in srcs.items(): io.open(f, 'w', encoding='utf-8').write(s)
print('WROTE', len(srcs), 'files')
