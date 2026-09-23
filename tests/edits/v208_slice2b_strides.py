#!/usr/bin/env python3
# V208 slice 2b — strides in easy protect mode (coach-ruled). In the knee-workaround easy sweep an
# easy run keeps its minutes, but its strides finisher is speed work and is parked: the appended
# block goes whole, from the line break before "Finish with 4 x 20 sec strides" through "while the
# engine builds.", and " + Strides" leaves the subtype. Note unchanged; key stays `easy`; dose
# unchanged. (Reduce mode already rewrites every run, so the block is gone there by construction.)
# Usage: python3 tests/edits/v208_slice2b_strides.py [target.html]   (default: index.html)
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
  ("E1 easy mode strips the strides finisher from the easy run it leaves alone",
   "        if(!isHard&&mode==='easy') return;   // already easy, leave it alone\n",
   "        // already easy, leave it alone. V208 (2b): except its strides finisher, which is speed work\n"
   "        // and is parked with the rest: the block goes whole, the minutes stay.\n"
   "        if(!isHard&&mode==='easy'){ s.detail=(s.detail||'').replace(/\\nFinish with 4 x 20 sec strides\\.[\\s\\S]*?while the engine builds\\./,''); s.subtype=(s.subtype||'').replace(' + Strides',''); return; }\n"),
]
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (want 1); nothing written' % (name, n))
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d edits to %s' % (len(EDITS), P))
