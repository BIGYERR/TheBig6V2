#!/usr/bin/env python3
# v0.239.1 slice 2 of 3 (PATCH, Mario). D236 P-SEMVERLABEL, Mario's.
# Ruling: tests/measure/v0.239.1_rulings/v0.239.1_ruling_d235_d236.md
# Slice 1 (tests/edits/v0.239.1_edit_s1.py) landed D235 and iaVersionLabel plus the bug-report page label.
#   E5  D236-label  report context: 'build: '+iaVersionLabel(IA_VERSION) (D236.2, the report-context half).
#   E6  D236-meta   line 8: <meta name="ia-version" content="0.239.1">, and its comment says the version is
#                   MAJOR.MINOR.PATCH, picked by Mario every release (D236.3). The LAST replacement of the build.
# Era rows come after this script from tests/era_bump.py 0.239.1 --ruling <ruling>, never by hand.
# Untouched: the update check (remote !== IA_VERSION), IA_VERSION itself, every other string.
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, sys

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

# ---- premise guards: slice 1 landed (helper declared once), the meta still reads exactly 239 ----------------
for tok, want in (('<meta name="ia-version" content="239">', 1),
                  ('<meta name="ia-version" content=', 1),
                  ('function iaVersionLabel(ver){', 1),
                  ("_bv.textContent='BUILD '+iaVersionLabel(IA_VERSION);", 1),
                  ("+'build: v'+IA_VERSION+'\\n'", 1),
                  ('remote !== IA_VERSION', 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

# ---- E5 D236.2 (report-context half) -----------------------------------------------------------------------
html = rep('E5 report context label', html,
    "      +'build: v'+IA_VERSION+'\\n'\n",
    "      +'build: '+iaVersionLabel(IA_VERSION)+'\\n'\n")

# ---- E6 D236.3: the version meta, LAST replacement ---------------------------------------------------------
html = rep('E6 ia-version meta 0.239.1', html,
    '<meta name="ia-version" content="239"><!-- SINGLE SOURCE OF TRUTH for update-check. Bump this one number every release. -->\n',
    '<meta name="ia-version" content="0.239.1"><!-- SINGLE SOURCE OF TRUTH for the update check and the version label. '
    'The version is MAJOR.MINOR.PATCH, and Mario picks PATCH, MINOR or MAJOR every release. -->\n')

with open(HTML, 'w', encoding='utf-8') as f:
    f.write(html)
print('WROTE %s' % HTML)
