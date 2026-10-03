#!/usr/bin/env python3
# V229 slice 3 of the app slices (D193 Amendment 3 section 4, as sited by D194 Amendment 1 R6 and adopted by D194
# Amendment 2 R7): the boot keep and the undo restore. Rulings: tests/measure/v229_rulings/d194_injlens_ruling.md
# (Amendment 1 R2(3)' and R6, Amendment 2 R7); background tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 3 s4.
# Reference: measure's CF5 surgery (tests/measure/v229_slice3_cf5.js PART=tree, measured as M10); the two hunks below are
# CF5's text byte for byte. Dormant behind cfg.injury (R2(3)'): on overlay and uninjured programs nothing writes _preHold.
#   U  undoSwap's restore block: the kept dose comes back from the record's `ph` with the card, else `delete it._preHold`
#      (delete, not undefined: the restored item's key set equals the pre-hop item's). No cfg guard, per R6's text.
#   B  applySessionSwaps: an identity list of the items each replay pass renamed (`_renamed`, taken around the unchanged
#      applySwapPrefs call); inside the existing `if(hit && prog.cfg && prog.cfg.injury){`, before applyInjuryFilter,
#      each renamed item is stamped with its unfiltered replay detail. A native twin on a collide day is never renamed,
#      so it stays unstamped.
# Not touched: slices 1 and 2, applySwapPrefs (boolean contract; build-path and undo callers), recordSwap's same-from
# filter, swapOriginOf, undoSwap's first match by `from`, the tap and boot guards (still cfg.injury), buildProgram.
# NO ia-version bump. All or none: ia-version exactly 228, _capRpeClamp x2, `item._preHold=_preF;` x1 (slice 2 in),
# `_renamed` absent, every anchor count==1, before anything is written.
import sys, re, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

m = re.findall(r'<meta name="ia-version" content="(\d+)"', src)
if m != ['228']:
    die('ia-version must be exactly 228, found %r' % (m,))
if src.count('_capRpeClamp') != 2:
    die('slice 1 not in: _capRpeClamp count %d != 2' % src.count('_capRpeClamp'))
if src.count('item._preHold=_preF;') != 1:
    die('slice 2 not in: item._preHold=_preF; count %d != 1' % src.count('item._preHold=_preF;'))
if '_renamed' in src:
    die('_renamed already present')

EDITS = []

# U (undoSwap): the kept dose from the record, or nothing.
EDITS.append((
    "      if(it){it.detail=p.d;_put.push(it);}\n",
    "      // V229 D193 (Amendment 3 section 4) / D194 R6: the kept dose comes back from the record with the card, or nothing is kept.\n"
    "      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}\n",
))

# B (applySessionSwaps): identity list of the items each replay pass renamed; stamped inside the existing injury guard.
EDITS.append((
    "    let hit=false;\n"
    "    list.forEach(e=>{\n"
    "      const m1=Object.create(null); m1[e.from]=e.to;\n"
    "      if(applySwapPrefs(day.sections,m1)) hit=true;\n"
    "    });\n"
    "    if(hit && prog.cfg && prog.cfg.injury){\n"
    "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n",
    "    let hit=false;\n"
    "    const _renamed=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity\n"
    "    list.forEach(e=>{\n"
    "      const m1=Object.create(null); m1[e.from]=e.to;\n"
    "      const _was=[]; day.sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&it.name===e.from) _was.push(it); }));\n"
    "      if(applySwapPrefs(day.sections,m1)) hit=true;\n"
    "      _was.forEach(it=>{ if(it.name!==e.from&&_renamed.indexOf(it)<0) _renamed.push(it); });\n"
    "    });\n"
    "    if(hit && prog.cfg && prog.cfg.injury){\n"
    "      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n"
    "      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n"
    "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n",
))

for i, (old, new) in enumerate(EDITS):
    c = src.count(old)
    print('%s anchor count %d' % (['U', 'B'][i], c))
    if c != 1:
        die('%s anchor count %d != 1: %r' % (['U', 'B'][i], c, old[:90]))

out = src
for old, new in EDITS:
    out = out.replace(old, new, 1)

if '\\u' in ''.join(n for _, n in EDITS):
    die('a \\u escape was typed into replacement text')
checks = [
    ('_capRpeClamp unchanged', out.count('_capRpeClamp'), 2),
    ('slice 2 tap keep unchanged', out.count('item._preHold=_preF;'), 1),
    ('_preHold writers (=, not ==): tap, undo, boot', len(re.findall(r'_preHold\s*=(?!=)', out)), 3),
    ('delete it._preHold (undo only)', out.count('delete it._preHold'), 1),
    ('applySwapPrefs call sites unchanged', len(re.findall(r'applySwapPrefs\(', out)), len(re.findall(r'applySwapPrefs\(', src))),
    ('boot guard still cfg.injury', out.count('    if(hit && prog.cfg && prog.cfg.injury){\n'), 1),
    ('ia-version meta 228 unchanged', len(re.findall(r'<meta name="ia-version" content="228"', out)), 1),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want:
        die('post-check %s: %d != %d' % (nm, got, want))

P.write_text(out, encoding='utf-8')
print('OK: 2 edits written to %s (ia-version stays 228)' % P)
