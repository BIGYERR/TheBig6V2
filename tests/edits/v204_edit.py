#!/usr/bin/env python3
# V204 slice 1 — D126: one carrying clock helper owns every seconds limb.
# Edit 1: D-code registry line in the handoff (D120 -> D126).
# Edit 2: add _clkMS(), the single owner of the seconds limb.
# Edit 3: re-point _fmtPace at it, preserving the /mi suffix.
# NOTE: ia-version is NOT bumped in this slice; it stays 203 until the final slice of V204.
import io, sys, os

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HTML = os.path.join(ROOT, 'index.html')
DOC  = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def load(p):
    with io.open(p, encoding='utf-8') as f:
        return f.read()

def rep(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT %s: anchor count==%d (expected 1)' % (label, n))
    print('ok   %s: anchor count==1' % label)
    return src.replace(old, new)

# ── EDIT 1 — registry, before index.html is touched ──
doc = load(DOC)
doc = rep(doc,
  'highest assigned = D120. Next free = D121.',
  'highest assigned = D126. Next free = D127.',
  'E1 registry')

# ── EDIT 2 — the helper ──
html = load(HTML)
SITE = 'function formatPacePerMile(totalSecs, distMiles) {'
HELPER = (
  "// D126 (V204): _clkMS is the SINGLE OWNER of the seconds limb. It rounds the WHOLE value before\n"
  "// splitting, so a ':60' limb is structurally impossible rather than corrected after the fact\n"
  "// (the technique _fmtHMS already uses). Suffixes belong to the caller: '/mi', '/100', or bare.\n"
  "function _clkMS(sec){\n"
  "  const t = Math.round(sec);\n"
  "  return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0');\n"
  "}\n"
)
html = rep(html, SITE, HELPER + SITE, 'E2 helper')

# ── EDIT 3 — _fmtPace re-pointed, /mi suffix preserved ──
OLD_FP = "  const _fmtPace = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}/mi`;"
NEW_FP = "  const _fmtPace = s => _clkMS(s) + '/mi';   // D126 (V204): seconds limb owned by _clkMS"
html = rep(html, OLD_FP, NEW_FP, 'E3 _fmtPace')

with io.open(DOC, 'w', encoding='utf-8') as f:
    f.write(doc)
with io.open(HTML, 'w', encoding='utf-8') as f:
    f.write(html)
print('WROTE index.html + IRON_ASYLUM_HANDOFF_1_1.md')
