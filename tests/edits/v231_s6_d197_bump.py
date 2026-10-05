#!/usr/bin/env python3
# V231 slice 6 of 6: D197 P-FILTERLAST (engine) + ia-version bump 230 -> 231.
# Ruling: tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md (D197),
# amended by v231_reruling_d195a2_d196a1_d197a1.md (class D197-2, no code change).
# After bodyweightSweep, inside the bodyweight branch and only when cfg.injury is set,
# every day is re-filtered once with the whole-day call the core re-filter already uses.
# The braced form keeps the following `else { unloadableRxSweep...; accessoryGrammarSweep...; }`
# attached to the bodyweight `if` (comments only between the closing brace and `else`).
# Every anchor asserted count==1 before any write; abort on first miss. Version bump LAST.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

EDITS = [
    (
        'D197 P-FILTERLAST: re-filter every day after bodyweightSweep when cfg.injury is set',
        "  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n",
        "  if(cfg.equipment==='bodyweight'){ bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n"
        "    if(cfg.injury) Object.keys(weeks).forEach(_w=>Object.keys(weeks[_w]||{}).forEach(_d=>{ const _day=weeks[_w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); })); }\n",
    ),
    # LAST: version meta bump.
    (
        'ia-version 230 -> 231',
        '<meta name="ia-version" content="230">',
        '<meta name="ia-version" content="231">',
    ),
]

# Assert every anchor count==1 against the pristine source before any write.
for label, old, new in EDITS:
    n = src.count(old)
    print('anchor count=%d :: %s' % (n, label))
    if n != 1:
        print('ABORT: anchor count %d != 1 for %r' % (n, label))
        sys.exit(1)

out = src
for label, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        print('ABORT (sequential): anchor count %d != 1 for %r' % (n, label))
        sys.exit(1)
    out = out.replace(old, new, 1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(out)
print('WROTE %s (%d -> %d bytes)' % (PATH, len(src.encode('utf-8')), len(out.encode('utf-8'))))
