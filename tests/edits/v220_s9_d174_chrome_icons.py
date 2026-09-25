#!/usr/bin/env python3
# V220 slice 9: D174 P-EMOJI section 4, the inline chrome emoji outside the pop-up.
# Each emoji becomes a named ASY icon via asyIcon(name, line font-size + 1). No new icon drawn.
# Inline idiom copied: the wizard's asyIcon(name,N)+' text' (L2514), no wrapper style;
# asyIcon already carries vertical-align:middle.
# The source stores the emoji as backslash-u escape TEXT; build it without typing the sequence.
import re, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
BS = chr(92)
def u(*cps): return ''.join(BS + 'u' + c for c in cps)
CHART = u('D83D', 'DCC8')
CLIP_LC = u('d83d', 'dccb')          # the log nudge stores its escape in lower case
CABINET = u('D83D', 'DDC4')
LQ, RQ, EMD = u('201C'), u('201D'), u('2014')

m = re.search(r'const ASY_ICON_PATHS=\{', src)
assert m, 'ASY_ICON_PATHS not found'
line = src[m.start():src.index('\n', m.start())]
for k in ('chart', 'notebook', 'history'):
    assert ('"%s":' % k) in line, 'icon key missing: ' + k

EDITS = [
    # 1. wizard seed caption, 11px line: icon 12, plus the D174 dash fix
    (CHART + " Estimated from " + LQ + "${s.progName}" + RQ + " " + EMD + " edit if you know better.</div>`;",
     "${asyIcon('chart',12)} Estimated from " + LQ + "${s.progName}" + RQ + ". Edit if you know better.</div>`;"),
    # 2. wizard seed header, 12px line: icon 13
    (CHART + " Seed from " + LQ + "${s.progName}" + RQ + "?</div>",
     "${asyIcon('chart',13)} Seed from " + LQ + "${s.progName}" + RQ + "?</div>"),
    # 3. day-card log nudge, 13px flex row: icon 14; icon and sentence stay ONE flex child
    ("""'<div class="log-nudge">""" + CLIP_LC + """ You logged this one but never marked it.<button class="log-nudge-btn" """,
     """'<div class="log-nudge"><span>'+asyIcon('notebook',14)+' You logged this one but never marked it.</span><button class="log-nudge-btn" """),
    # 4. progress program chip, 12px: icon 13
    ("const label=(p.archived?'" + CABINET + " ':'')+(p.name||'Program');",
     "const label=(p.archived?asyIcon('history',13)+' ':'')+(p.name||'Program');"),
]
for old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT: anchor count %d: %r' % (c, old[:100])); sys.exit(1)
for old, new in EDITS:
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('s9: 4 chrome icons (chart x2, notebook, history) + caption dash fix')
