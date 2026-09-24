#!/usr/bin/env python3
# V213 close, part A — the era rows for ia-version 213, all RULED UNMOVED and written as REFERENCES
# to the 212 rows (the D94-t convention: a reference row asserts ruled UNMOVED). The numbers in the
# comments were PRINTED BY COACH on the V213 tree with g199's and g200's methods before this close;
# none is read back off the artifact here.
#   1. tests/harness.js: MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
#      MANNY_CORE_OFF_DIGEST_BY_VERSION [213] = [212].
#   2. tests/gates/g199_deload_arbitration.js: DELOAD_ARB_BY_VERSION, E6_BY_VERSION,
#      DELOAD_HINGE_BY_VERSION [213] = [212].
#   3. tests/gates/g197b_sweep.js: HF_LEAK_BY_VERSION[213] = [212].
# Each row is inserted after the WHOLE 212 line, found by its prefix, which must occur exactly once.
# No index.html change. No ia-version change (that is close B, last).
import io, sys

T = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'
HM = ("// D113a/D146/injury key: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by "
      "coach on the V213 tree with g199's and g200's methods; HALF_MANNY is a solo NRC half, and neither the pace "
      "routing, the NRC multi-sport arm nor the injury key reaches a solo uninjured week)")
G199 = "// D113a: ruled UNMOVED, no lift section touched (printed: C1 364 C3 364 C5 32 D2 19 I3 496; E6 28; E1b 9334 E3 44 G5 44)"

PLAN = {
  'harness.js': [
    ('MANNY_DIGEST_BY_VERSION[212] = MANNY_DIGEST_BY_VERSION[211];',
     'MANNY_DIGEST_BY_VERSION[213] = MANNY_DIGEST_BY_VERSION[212];   ' + HM),
    ('MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211];',
     'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212];   ' + HM),
    ('MANNY_CORE_OFF_DIGEST_BY_VERSION[212] = MANNY_CORE_OFF_DIGEST_BY_VERSION[211];',
     'MANNY_CORE_OFF_DIGEST_BY_VERSION[213] = MANNY_CORE_OFF_DIGEST_BY_VERSION[212];   ' + HM),
  ],
  'gates/g199_deload_arbitration.js': [
    ('DELOAD_ARB_BY_VERSION[212] = DELOAD_ARB_BY_VERSION[211];',
     'DELOAD_ARB_BY_VERSION[213] = DELOAD_ARB_BY_VERSION[212];   ' + G199),
    ('E6_BY_VERSION[212] = E6_BY_VERSION[211];',
     'E6_BY_VERSION[213] = E6_BY_VERSION[212];   ' + G199),
    ('DELOAD_HINGE_BY_VERSION[212] = DELOAD_HINGE_BY_VERSION[211];',
     'DELOAD_HINGE_BY_VERSION[213] = DELOAD_HINGE_BY_VERSION[212];   ' + G199),
  ],
  'gates/g197b_sweep.js': [
    ('HF_LEAK_BY_VERSION[212] = HF_LEAK_BY_VERSION[211];',
     'HF_LEAK_BY_VERSION[213] = HF_LEAK_BY_VERSION[212];   // D113a: ruled UNMOVED (0/0 printed)'),
  ],
}

out = []
for f, rows in PLAN.items():
    src = io.open(T + f, encoding='utf-8').read()
    for prefix, row in rows:
        c = src.count(prefix)
        key = row.split(' = ')[0]
        print('%-36s %-46s prefix count=%d  213 already present=%d' % (f, prefix[:46], c, src.count(key + ' =')))
        if c != 1 or src.count(key + ' =') != 0:
            sys.exit('ABORT: %s prefix count %d or its 213 row already exists. Nothing written.' % (f, c))
        i = src.index(prefix)
        j = src.index('\n', i) + 1           # after the WHOLE 212 line, comment included
        src = src[:j] + row + '\n' + src[j:]
    out.append((T + f, src))
for p, s in out:
    io.open(p, 'w', encoding='utf-8').write(s)
    print('WROTE', p)
