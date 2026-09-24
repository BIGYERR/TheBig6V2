#!/usr/bin/env python3
# V214 close, part A (4 edits) — era rows for ia-version 214, RULED UNMOVED, written as REFERENCES to
# the 213 rows (D94-t convention). Numbers in the comments were PRINTED BY COACH on the V214 tree with
# g199's and g200's methods before this close; none is read back off the artifact here.
#   1-3. tests/harness.js: MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
#        MANNY_CORE_OFF_DIGEST_BY_VERSION [214] = [213].
#   4.   tests/gates/g197b_sweep.js: HF_LEAK_BY_VERSION[214] = [213].
# Part A2 (v214_closeA2.py) writes the three g199 rows. Census (builder, V214): the exact-version
# tables are these 7 rows plus g210's two licences (close B); every range table is open-ended.
# Each row is inserted after the WHOLE 213 line, found by its prefix, which must occur exactly once.
# No index.html change. No ia-version change (close B, last).
import io, sys
T = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'
HM = ("// D158: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the "
      "V214 tree with g199's and g200's methods; HALF_MANNY is an NRC race program and the eve rule is NSW "
      "dated only, NRC race pins 0/792 moved)")
PLAN = {
  'harness.js': [
    ('MANNY_DIGEST_BY_VERSION[213] = MANNY_DIGEST_BY_VERSION[212];',
     'MANNY_DIGEST_BY_VERSION[214] = MANNY_DIGEST_BY_VERSION[213];   ' + HM),
    ('MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212];',
     'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213];   ' + HM),
    ('MANNY_CORE_OFF_DIGEST_BY_VERSION[213] = MANNY_CORE_OFF_DIGEST_BY_VERSION[212];',
     'MANNY_CORE_OFF_DIGEST_BY_VERSION[214] = MANNY_CORE_OFF_DIGEST_BY_VERSION[213];   ' + HM),
  ],
  'gates/g197b_sweep.js': [
    ('HF_LEAK_BY_VERSION[213] = HF_LEAK_BY_VERSION[212];',
     'HF_LEAK_BY_VERSION[214] = HF_LEAK_BY_VERSION[213];   // D158: ruled UNMOVED (0/0 printed)'),
  ],
}
out, bad = {}, False
for f, rows in PLAN.items():
    src = io.open(T + f, encoding='utf-8').read(); lines = src.split('\n')
    for pre, new in rows:
        hits = [i for i, l in enumerate(lines) if l.startswith(pre)]
        new_pre = new.split('   //')[0]
        dup = sum(1 for l in lines if l.startswith(new_pre))
        print('%-26s %-72s count=%d new-row-present=%d' % (f, pre[:72], len(hits), dup))
        if len(hits) != 1 or dup != 0: bad = True; continue
        lines.insert(hits[0] + 1, new)
    out[f] = '\n'.join(lines)
if bad: sys.exit('ABORT: an anchor did not appear exactly once (or the 214 row exists). Nothing written.')
for f, s in out.items():
    io.open(T + f, 'w', encoding='utf-8').write(s); print('WROTE', T + f)
