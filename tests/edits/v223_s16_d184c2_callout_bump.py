#!/usr/bin/env python3
# V223 build 3, slice (c2) of D184 (P-TESTLEN): the step 3 callout holdsTest branch, plus the ia-version bump.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md, "## D184 (c')" Q3 (verbatim branch) and R4;
# MARIO DECISION on (c'): SHIP in this build. Mario named V223 as this build's version.
# Rides on (c1a)/(c1b) (tests/edits/v223_s14_d184c1a_resolver.py, v223_s15_d184c1b_callers.py): wizardTestPin()
# copies the resolver's holdsTest onto progTestPin's return, so the callout reads the resolver's own answer.
#   E1 (D184-c-callout) updateRaceDateFeedback's pin card: a new branch ordered BEFORE `p.tw === 1`:
#      else if(p.tw === 1 && p.holdsTest) -> card('var(--signal)', Q3 sentence + reach). The `p.tw === 1` row keeps
#      its V222 sentence for its honest population. The callout is NOT repainted from the name step (ruled).
#   E2 (version-bump) <meta name="ia-version" content="222"> -> "223". Last replacement in the script.
# Anchors asserted count==1; the first miss aborts and nothing is written. Asserts ia-version reads 222 before
# writing and 223 after.
import re
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, 'r', encoding='utf-8').read()

def meta_version(s):
    m = re.findall(r'<meta name="ia-version" content="(\d+)"', s)
    return m

pre = meta_version(src)
if pre != ['222']:
    print('ABORT: ia-version before writing reads %r (want [\'222\']); nothing written' % (pre,))
    sys.exit(1)
print('pre: ia-version reads 222')

def rep(label, old, new):
    global src
    n = src.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('%s: anchor count 1, replaced' % label)

# ── E1 the step 3 callout holdsTest branch ───────────────────────────────────────────────
rep('E1 callout holdsTest branch',
"""    if(p.tw >= 2) feedback.innerHTML = card(_f ? 'var(--accent)' : 'var(--run)', 'Your test is in week '+p.tw+'. The program ends on it. The taper lands in front of it.'+reach);
    else if(p.tw === 1) feedback.innerHTML = card('var(--accent)', 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.'+reach);
""",
"""    if(p.tw >= 2) feedback.innerHTML = card(_f ? 'var(--accent)' : 'var(--run)', 'Your test is in week '+p.tw+'. The program ends on it. The taper lands in front of it.'+reach);
    // D184 (P-TESTLEN c' Q3): the entered week holds the test (the resolver's holdsTest, carried by
    // wizardTestPin), so week 1 has no training day before it. Ordered before the tw 1 row, whose
    // primer and shakeout sentence is false here. "In week 1", not "this week": true for a future start.
    else if(p.tw === 1 && p.holdsTest) feedback.innerHTML = card('var(--signal)', 'Your test is in week 1. Nothing is left to train before it. You get the test week only.'+reach);
    else if(p.tw === 1) feedback.innerHTML = card('var(--accent)', 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.'+reach);
""")

# ── E2 version bump (last) ───────────────────────────────────────────────────────────────
rep('E2 ia-version 222 -> 223',
"""<meta name="ia-version" content="222">""",
"""<meta name="ia-version" content="223">""")

post = meta_version(src)
if post != ['223']:
    print('ABORT: ia-version after replacement reads %r (want [\'223\']); nothing written' % (post,))
    sys.exit(1)

open(PATH, 'w', encoding='utf-8').write(src)
print('post: ia-version reads 223; written')
