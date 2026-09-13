#!/usr/bin/env python3
# V194 gate fix, second pass, follow-on. The DEFERRED epilogue told every under-invoked run
# to "hand it a baseline (argv[3])". After EDIT 2 a run CAN be handed a baseline and still
# defer, because the deferred claims need a baseline of a SPECIFIC version (V192). The
# epilogue now names the axis it is actually on, or the announcement is itself misleading.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = open(P, encoding='utf-8').read()

reps = [(
'DEFERRED epilogue names the axis',
r"""  console.log('  This run was under-invoked. Hand it a baseline (argv[3]) to make these claims.');""",
r"""  console.log('  This run was under-invoked. ' + (BASEFILE
    ? 'A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '); the claims above need one this run does not have — a V192 artifact, or the lattice the hand tables were transcribed against.'
    : 'Hand it a baseline (argv[3]) to make these claims.'));""")]

for name, old, new in reps:
    n = src.count(old)
    print('anchor %-40s count=%d' % (name, n))
    if n != 1:
        sys.exit('ABORT: anchor "%s" matched %d times, expected 1. No bytes written.' % (name, n))
    src = src.replace(old, new, 1)

open(P, 'w', encoding='utf-8').write(src)
print('wrote ' + P)
