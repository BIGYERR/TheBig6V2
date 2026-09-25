#!/usr/bin/env python3
# V220 test slice T1b: [220] era rows, ruled UNMOVED, in g197b_sweep.js (HF_LEAK, B5C), g199_deload_arbitration.js
# (DELOAD_ARB, E6, DELOAD_HINGE, one anchor carrying all three) and g193_samecard.js (OPEN_UNRULED).
# Test files only; index.html is not touched.
# Basis: V220 ships D173/D174/D175/D176, all zero-engine (display, copy and pop-up only); no V220 hunk touches
# buildProgram or anything it calls, so no drawn item, deload cut or same-card count can move. Gatekeeper proves the
# rows on the built artifact. Every row is a reference to [219], so a missing row still fails its consumer
# ("NO ERA ROW" / "NO ROW" / the g193 throw): no default, no fallback.
# Every anchor asserted count==1 and every new row asserted absent before anything is written; first miss aborts all.
import sys
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'
V = "V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls"

JOBS = [
  ('g197b_sweep.js', [
    ("\nHF_LEAK_BY_VERSION[219] = HF_LEAK_BY_VERSION[218];",
     "HF_LEAK_BY_VERSION[220] = HF_LEAK_BY_VERSION[219];   // " + V + "; the [219] 0/0 carries)\n"),
    ("\nB5C_BY_VERSION[219] = 0;",
     "B5C_BY_VERSION[220] = B5C_BY_VERSION[219];   // " + V + "; the [219] 0 carries)\n"),
  ]),
  ('g199_deload_arbitration.js', [
    ("\nDELOAD_HINGE_BY_VERSION[219] = { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12369, G1: 1275 };",
     "DELOAD_ARB_BY_VERSION[220] = DELOAD_ARB_BY_VERSION[219];   // " + V + "; C1 264 C3 264 C5 0 D2 19 I3 18 carry)\n"
     "E6_BY_VERSION[220] = E6_BY_VERSION[219];   // " + V + "; E6 28 carries)\n"
     "DELOAD_HINGE_BY_VERSION[220] = DELOAD_HINGE_BY_VERSION[219];   // " + V + "; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)\n"),
  ]),
  ('g193_samecard.js', [
    ("\nOPEN_UNRULED_BY_VERSION[219] = { 'Kettlebell swing': 0 };",
     "OPEN_UNRULED_BY_VERSION[220] = OPEN_UNRULED_BY_VERSION[219];   // " + V + "; the swing class stays a ruled 0)\n"),
  ]),
]

out = {}
for f, edits in JOBS:
    s = open(G + f, encoding='utf-8').read()
    for i, (a, rows) in enumerate(edits):
        n = s.count(a)
        print('%s anchor %d count %d :: %r' % (f, i, n, a.strip()[:70]))
        if n != 1:
            print('ABORT: %s anchor %d count %d' % (f, i, n)); sys.exit(2)
        for ln in rows.rstrip('\n').split('\n'):
            head = ln.split('   //')[0]
            if s.count(head) != 0:
                print('ABORT: %s row already present: %r' % (f, head)); sys.exit(3)
        k = s.index(a) + 1                      # skip the leading newline that pins the anchor to a line start
        e = s.index('\n', k) + 1                # insert after the whole [219] line, comment included
        s = s[:e] + rows + s[e:]
    out[f] = s
for f in out:
    open(G + f, 'w', encoding='utf-8').write(out[f])
print('written ' + ', '.join(out))
