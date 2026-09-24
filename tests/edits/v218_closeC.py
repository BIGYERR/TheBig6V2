#!/usr/bin/env python3
# V218 closeC — g217 K-limb era rows for D157 (coach's comments verbatim), then the ia-version bump
# 217 -> 218 (Mario authorized the bump in order after green; the bump is the LAST replacement).
# Each [218] row goes directly after its [217] sibling (D160_MULTI's [217] lives in the object literal,
# so its [218] row follows the literal's closing line). Guards: anchors count==1; no [218] row exists yet.
import re, sys
G217 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g217_d160_dedupe_view.js'
HTML = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
g = open(G217, encoding='utf-8').read()
h = open(HTML, encoding='utf-8').read()

ROWS = [
  ("  repeats: { gk:[28,17], multi:[78,16] } } };\n",
   "D160_MULTI_BY_VERSION[218] = D160_MULTI_BY_VERSION[217];   // D157: ruled UNMOVED (phantoms 124/163/141/59/0 -> 0, events gk P124 A18 B8 C16 D0 multi P363 A8 B30 C58 D0, repeats gk 28->17 multi 78->16 printed by coach on the V218-stamped tree against V216)\n"),
  ("\nconst SAMEDAY_TWIN_BY_VERSION = {}; SAMEDAY_TWIN_BY_VERSION[217] = ",
   "SAMEDAY_TWIN_BY_VERSION[218] = SAMEDAY_TWIN_BY_VERSION[217];   // D157: ruled UNMOVED (gk add 1 remove 3, multi add 4 remove 0 printed)\n"),
  ("\nconst FWD_MAIN_BY_VERSION = {}; FWD_MAIN_BY_VERSION[217] = 609;",
   "FWD_MAIN_BY_VERSION[218] = FWD_MAIN_BY_VERSION[217];   // D157: ruled UNMOVED (609 printed)\n"),
]
META_OLD = '<meta name="ia-version" content="217">'
META_NEW = '<meta name="ia-version" content="218">'

for t in ('D160_MULTI_BY_VERSION', 'SAMEDAY_TWIN_BY_VERSION', 'FWD_MAIN_BY_VERSION'):
    if g.count(t + '[218]') != 0:
        print('ABORT: %s[218] already exists' % t); sys.exit(2)
if re.search(r'(?m)^\s*218\s*:|\{\s*218\s*:', g):
    print('ABORT: a 218 literal key already exists in g217'); sys.exit(2)
for i, (a, row) in enumerate(ROWS, 1):
    if g.count(a) != 1:
        print('ABORT: E%d anchor count %d: %r' % (i, g.count(a), a[:70])); sys.exit(2)
if h.count(META_OLD) != 1 or h.count(META_NEW) != 0:
    print('ABORT: E4 meta anchor count %d / 218 count %d' % (h.count(META_OLD), h.count(META_NEW))); sys.exit(2)

for i, (a, row) in enumerate(ROWS, 1):
    p = g.index(a) + (1 if a.startswith('\n') else 0)
    eol = g.index('\n', p)
    g = g[:eol + 1] + row + g[eol + 1:]
    print('applied E%d after: %s...' % (i, g[p:p + 60]))
for t in ('D160_MULTI_BY_VERSION', 'SAMEDAY_TWIN_BY_VERSION', 'FWD_MAIN_BY_VERSION'):
    if g.count(t + '[218]') != 1:
        print('ABORT: post-condition %s' % t); sys.exit(3)
h = h.replace(META_OLD, META_NEW, 1)          # the version meta bump is the last replacement
if h.count(META_NEW) != 1 or h.count(META_OLD) != 0:
    print('ABORT: post-condition meta'); sys.exit(3)
open(G217, 'w', encoding='utf-8').write(g)
open(HTML, 'w', encoding='utf-8').write(h)
print('applied E4 ia-version 217 -> 218; written')
