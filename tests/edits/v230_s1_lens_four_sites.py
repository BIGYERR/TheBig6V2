#!/usr/bin/env python3
# V230 slice 1 of 5 — D194 P-INJLENS Amendment 1 R3′: the lens alone, four sites.
# (L1) tap guard + filter cfg (applySwapChoice) onto _dayPlanCfg(activeProg,day)
# (L2) boot guard + filter cfg (applySessionSwaps) onto _dayPlanCfg(prog,day)
# No ia-version bump in this slice (slice 2 bumps 229 → 230).
# Oracle: measure CF6 (scratchpad/measure/v230/cf6.html) — result must cmp identical.
# Every anchor asserted count==1 before anything is written; one write at the end.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

EDITS = [
    # E1 :10358 applySessionSwaps guard (L2)
    ('E1 boot guard',
     "    if(hit && prog.cfg && prog.cfg.injury){\n",
     "    if(hit && _dayPlanCfg(prog,day).injury){\n"),
    # E2 :10361 applySessionSwaps filter cfg (L2)
    ('E2 boot filter cfg',
     "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n",
     "      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));\n"),
    # E3 :14347 applySwapChoice guard (L1)
    ('E3 tap guard',
     "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n",
     "  if(activeProg&&_dayPlanCfg(activeProg,day).injury){\n"),
    # E4 :14350 applySwapChoice filter cfg (L1)
    ('E4 tap filter cfg',
     "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n",
     "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],_dayPlanCfg(activeProg,day));\n"),
]

# Pass 1: assert every anchor against the untouched source.
for tag, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1)' % (tag, n))
        sys.exit(1)
    if src.count(new) != 0:
        print('ABORT %s: replacement already present' % tag)
        sys.exit(1)

# Pass 2: apply, re-asserting each anchor is still unique at its turn.
out = src
for tag, old, new in EDITS:
    if out.count(old) != 1:
        print('ABORT %s: anchor count drifted to %d' % (tag, out.count(old)))
        sys.exit(1)
    out = out.replace(old, new, 1)
    print('OK %s' % tag)

# Post: the two guarded sites read no prog.cfg injury and pass no bare prog cfg to the filter.
for bad in ("if(hit && prog.cfg && prog.cfg.injury){",
            "applyInjuryFilter(day.sections,prog.cfg)",
            "if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){",
            "}]}],activeProg.cfg)"):
    if bad in out:
        print('ABORT post: residual %r' % bad)
        sys.exit(1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(out)
print('WROTE %s (4 edits)' % PATH)
