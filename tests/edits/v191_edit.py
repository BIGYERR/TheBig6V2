#!/usr/bin/env python3
# V191 / D40 — derived pace delta: m:ss at or above one minute.
#
# Ruling (D40, Mario concurred): the delta line under the log card's derived pace
# prints a raw second count. At 73s/mi it reads "73s/mi faster than target", which
# makes the athlete convert to see that the gap is over a minute per mile. Seconds
# stay below a minute (runner-native at that scale); at or above 60s the magnitude
# switches to m:ss with zero-padded seconds.
#
#   ad < 60   ->  "43s/mi faster than target"     (unchanged)
#   ad >= 60  ->  "1:13/mi faster than target"    (new)
#
# The |df| < 5 "on target" branch and the faster/slower wording are unchanged.
# Sole call site: index.html:11633 (updateDoseDerived), grep-confirmed count == 1.
#
# Standing rules honoured: literal bytes for em-dashes, every anchor asserted
# count == 1 before any write, version meta bump is the LAST replacement, no map
# whose keys are old names is touched (this build renames nothing).
import io, sys, os

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
PATH = os.path.abspath(PATH)

src = io.open(PATH, encoding='utf-8').read()
reps = []

# ── 1. the delta formatter itself ─────────────────────────────────────────────
OLD_DELTA = "    if(d.tgt&&d.sec){ const df=Math.round(d.sec-d.tgt); delta=Math.abs(df)<5?'on target':(Math.abs(df)+'s/mi '+(df<0?'faster than target':'slower than target')); }"
NEW_DELTA = (
    "    // V191 (D40): a gap of a minute or more prints m:ss. \"73s/mi\" makes the athlete\n"
    "    // do the conversion to see it is over a minute; \"1:13/mi\" reads as a gap on sight.\n"
    "    // Under a minute stays in seconds — that is the runner-native unit at that scale.\n"
    "    if(d.tgt&&d.sec){ const df=Math.round(d.sec-d.tgt), ad=Math.abs(df); const mag=ad<60?(ad+'s/mi'):(Math.floor(ad/60)+':'+String(ad%60).padStart(2,'0')+'/mi'); delta=ad<5?'on target':(mag+' '+(df<0?'faster than target':'slower than target')); }"
)
reps.append(('D40 delta formatter (updateDoseDerived)', OLD_DELTA, NEW_DELTA))

# ── 2. version bump — ALWAYS LAST ─────────────────────────────────────────────
reps.append(('ia-version 190 -> 191',
             '<meta name="ia-version" content="190">',
             '<meta name="ia-version" content="191">'))

# assert every anchor exactly once BEFORE writing anything; abort on the first miss
fail = False
for label, old, new in reps:
    n = src.count(old)
    print('  anchor %-44s count=%d' % (label, n))
    if n != 1:
        print('ABORT: anchor count != 1 for: ' + label)
        fail = True
if fail:
    sys.exit(1)

for label, old, new in reps:
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE ' + PATH)
