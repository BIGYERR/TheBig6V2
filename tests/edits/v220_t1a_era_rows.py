#!/usr/bin/env python3
# V220 test slice T1a: [220] era rows, ruled UNMOVED, in tests/harness.js (the three HALF_MANNY digest tables)
# and tests/gates/g200_pull_arbitration.js (SWAP_BY_VERSION). Test files only; index.html is not touched.
# Basis: V220 ships D173/D174/D175/D176, all zero-engine (display, copy and pop-up only); no V220 hunk touches
# buildProgram or anything it calls. Coach's P-BARERX re-baseline (tests/measure/v220_rulings/p_barerx_ruling.md,
# RE-BASELINE ON V219) states MANNY_DIGEST_BY_VERSION[<next>] = the [219] row, UNMOVED. Standing ruling 5: the
# builder printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 (HALF_MANNY / deload-off / core-off, by
# v219_chain_rebaseline.js's method) from base_V219.html BEFORE writing, equal to the [219] rows.
# Every row is a reference to [219], so row existence stays a conjunct in every consumer: no default, no fallback.
# Every anchor asserted count==1 and every new row asserted absent before anything is written; first miss aborts all.
import sys
R = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'
CITE_H = ("V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only, no hunk reaches "
          "buildProgram; standing ruling 5: coach's P-BARERX re-baseline states MANNY_DIGEST_BY_VERSION[<next>] = the [219] row; "
          "0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed from base_V219 before the build)")
CITE_G200 = ("V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches "
             "buildProgram or the pull-day swap draw, so the p1 population stays 138)")

JOBS = [
  ('harness.js', [
    ("\nMANNY_DIGEST_BY_VERSION[219] = MANNY_DIGEST_BY_VERSION[218];",
     "MANNY_DIGEST_BY_VERSION[220] = MANNY_DIGEST_BY_VERSION[219];   // " + CITE_H + "\n"),
    ("\nMANNY_DELOAD_OFF_DIGEST_BY_VERSION[219] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218];",
     "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[220] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[219];   // " + CITE_H + "\n"),
    ("\nMANNY_CORE_OFF_DIGEST_BY_VERSION[219] = MANNY_CORE_OFF_DIGEST_BY_VERSION[218];",
     "MANNY_CORE_OFF_DIGEST_BY_VERSION[220] = MANNY_CORE_OFF_DIGEST_BY_VERSION[219];   // " + CITE_H + "\n"),
  ]),
  ('gates/g200_pull_arbitration.js', [
    ("\nSWAP_BY_VERSION[219] = 138;   // D166: ruled MOVE (150 -> 138)\n",
     "SWAP_BY_VERSION[220] = SWAP_BY_VERSION[219];   // " + CITE_G200 + "\n"),
  ]),
]

out = {}
for f, edits in JOBS:
    s = open(R + f, encoding='utf-8').read()
    for i, (a, row) in enumerate(edits):
        n = s.count(a)
        print('%s anchor %d count %d :: %r' % (f, i, n, a.strip()[:70]))
        if n != 1:
            print('ABORT: %s anchor %d count %d' % (f, i, n)); sys.exit(2)
        head = row.split('   //')[0]
        if s.count(head) != 0:
            print('ABORT: %s row %d already present: %r' % (f, i, head)); sys.exit(3)
        k = s.index(a) + 1                      # skip the leading newline that pins the anchor to a line start
        e = s.index('\n', k) + 1                # insert after the whole [219] line, comment included
        s = s[:e] + row + s[e:]
    out[f] = s
for f in out:
    open(R + f, 'w', encoding='utf-8').write(out[f])
print('written ' + ', '.join(out))
