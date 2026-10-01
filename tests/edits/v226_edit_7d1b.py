#!/usr/bin/env python3
# V226 slice 7d1b: d189 gate summary line must match tests/sabotage.py:99
# (^PASS (\d+) FAIL (\d+)\s*$). Move NA onto its own line, matching
# g226_d188_beginnermile.js:70. Tests only. Anchor-asserted count==1, all or none.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g226_d189_pacedisclose.js'
src = open(P, encoding='utf-8').read()
REPL = [
    ("  console.log('\\nPASS ' + pass + ' FAIL ' + fail + ' NA ' + na); process.exit(fail ? 1 : 0);\n",
     "  console.log('NA ' + na); console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0);\n"),
]
out = src
for old, new in REPL:
    n = out.count(old)
    if n != 1:
        sys.exit('ABORT: anchor count %d != 1: %r' % (n, old[:80]))
    out = out.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(out)
print('ok: %d replacement(s)' % len(REPL))
