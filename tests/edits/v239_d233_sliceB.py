#!/usr/bin/env python3
# V239 slice B of the web side: D233 P-ISLAND R3 boot end, and the 238 -> 239 bump (Mario named V239).
# Ruling: tests/measure/v239_rulings/v239_ruling_d233.md (R3: "Reset, Done/Skip, the day-open zeroing of a stopped
# clock, and boot all END the activity"; Mario's concurrence: no boot call on the PWA, which _ruIsland already makes
# a no-op when window.iaIsland is absent).
#   E5  C3  init() calls _ruIsland() as its first statement, once per page load (sole caller: the readyState line
#           at the foot of the script), before anything in init can throw. At boot the stopwatch holds its
#           initials (_ruRunning=false, _ruElapsed=0), so the native app sends end() and the PWA does nothing.
#   E6  C4  <meta name="ia-version"> 238 -> 239, the only version site V238 moved in index.html. LAST replacement.
#   E7  C4  era rows: NOT here. Run `python3 tests/era_bump.py 239 --ruling <ruling>` after this script.
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')


def rep(label, text, old, new):
    n = text.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    if old == new:
        print('ABORT %s: replacement equals anchor; nothing written' % label)
        sys.exit(1)
    print('ok %s' % label)
    return text.replace(old, new, 1)


html = open(HTML, encoding='utf-8').read()

# ---- premise guards: slice A landed, init has one definition and one call site, still V238 -----------
for tok, want in (('<meta name="ia-version" content="238">', 1), ('_ruIsland();', 4), ('function _ruIsland(){', 1),
                  ('function init(){', 1),
                  ("if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}", 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)
code = '\n'.join(l for l in html.split('\n') if not l.lstrip().startswith('//'))   # comments stripped (L1894 prose)
calls = re.findall(r'(?<![A-Za-z0-9_$.])init(?![A-Za-z0-9_$])', code)
if len(calls) != 3:   # the definition, the DOMContentLoaded listener, the direct call
    print('ABORT premise init references: %d (want 3); nothing written' % len(calls))
    sys.exit(1)

# ---- E5 -------------------------------------------------------------------------------------------
html = rep('E5 init boot end', html,
    "function init(){\n  const _bv=document.getElementById('bugVersion');",
    "function init(){\n"
    "  // V239 (D233 R3): boot ends every island activity the app owns, so a reload and the island agree. First, so no\n"
    "  // later throw in init can skip it; the stopwatch holds its initials here, so this is end() in the native app\n"
    "  // and a no-op on the PWA (no window.iaIsland).\n"
    "  _ruIsland();\n"
    "  const _bv=document.getElementById('bugVersion');")

# ---- E6 (last) ------------------------------------------------------------------------------------
html = rep('E6 ia-version 238 -> 239', html,
    '<meta name="ia-version" content="238">',
    '<meta name="ia-version" content="239">')

# ---- post guards ------------------------------------------------------------------------------------
for tok, want in (('_ruIsland();', 5), ('<meta name="ia-version" content="239">', 1), ('content="238"', 0)):
    n = html.count(tok)
    if n != want:
        print('ABORT post %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

open(HTML, 'w', encoding='utf-8').write(html)
print('WROTE %s' % HTML)
