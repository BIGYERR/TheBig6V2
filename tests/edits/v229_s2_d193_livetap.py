#!/usr/bin/env python3
# V229 slice 2 of 4 (app slice) of D193 P-CAPRPE: the live tap's kept dose (R3), the record field (Amendment 3 sec.4) and
# the hold toasts (R8). Ruling: tests/measure/v228_rulings/d193_caprpe_ruling.md -- Amendment 2 R3 (re-stated) and R8,
# Amendment 3 sec.4 (live tap; undo record field; scope guard), Amendment 4 "The rules" first bullet (R8 trigger restated).
# Builds on slice 1 (tests/edits/v229_s1_d193_clamp.py). All four edits are inside applySwapChoice (the live swap handler).
# App edits to index.html only. NO ia-version bump (stays 228; slice 4 bumps 228 -> 229 as its last write).
#   B1 (A3 sec.4)  the undo record's rx entry gains an optional `ph` (the from-card's kept dose), written only when the
#        from-card carries one; otherwise the entry is byte-identical to today's {s,i,d}.
#   B2 (R3)  the carry reads the kept pre-hold dose when the card has one, else the card as it stands.
#   B3 (R3 + R8 detect)  _preF = the _swapDetailFor result before the re-filter; on an injured program only, the item keeps
#        it as _preHold, and _held records whether the plan's clamp changed the RPE of the dose it was handed.
#   B4 (R8)  when _held, the toast is the hold variant of the same branch (win -> _reRx -> verbatim); otherwise the three
#        existing toasts are byte-identical (D190 R4: a cue alone moves no toast).
# All or none: ia-version exactly 228, slice 1 in (_capRpeClamp x2), _preHold x0, _held/_preF absent, every anchor
# count==1, before anything is written.
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
if src.count('_preHold') != 0:
    die('_preHold already present (%d)' % src.count('_preHold'))
for nm in [r'\b_held\b', r'\b_preF\b']:
    if re.search(nm, src):
        die('name already exists in file: ' + nm)

HOLD = ' Your injury plan holds this one at RPE 7.'

EDITS = []

# B1 (Amendment 3 sec.4): the record keeps the from-card's kept dose beside its detail, only when it has one.
EDITS.append((
    "    if(it&&it.name===from&&typeof it.detail==='string') _undoRx.push({s:si,i:ii,d:it.detail});\n",
    "    // V229 D193 (Amendment 3 section 4): the from-card's kept dose rides beside its detail as `ph`, only when it has one.\n"
    "    if(it&&it.name===from&&typeof it.detail==='string'){ const _e={s:si,i:ii,d:it.detail}; if(typeof it._preHold==='string') _e.ph=it._preHold; _undoRx.push(_e); }\n",
))

# B2 (R3): the carry reads the dose beneath the hold.
EDITS.append((
    "  const _base=_stripCapCue(_wasDetail);\n",
    "  // V229 D193 (R3): the dose that travels is the dose beneath the hold: the kept pre-hold dose when this card has one,\n"
    "  // else the card as it stands, read beneath the cue or the held-test text.\n"
    "  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);\n",
))

# B3 (R3 keep + R8 detect, injured only).
EDITS.append((
    "  const _reRx=(item.detail!==_base);\n"
    "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n"
    "    try{\n"
    "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
    "      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n"
    "      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n",
    "  const _reRx=(item.detail!==_base);\n"
    "  // V229 D193 (R3, R8; Amendment 3 section 4): on an injured program the tap keeps the dose before the re-filter beside the\n"
    "  // card (never printed, never in a sheet row, a digest or a toast), and _held says the plan's clamp changed the RPE of the\n"
    "  // dose it was handed. Nothing is kept on an uninjured program: the card is its own beneath.\n"
    "  const _preF=item.detail; let _held=false;\n"
    "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n"
    "    item._preHold=_preF;\n"
    "    try{\n"
    "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
    "      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n"
    "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n",
))

# B4 (R8): the hold variants, same branch order; the three existing toasts untouched when _held is false.
EDITS.append((
    "  showToast(_rx.win\n",
    "  // V229 D193 (R8): when the plan's clamp changed the number, the toast names the hold in the same branch's words.\n"
    "  showToast(_held\n"
    "    ? (_rx.win\n"
    "      ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'." + HOLD + "'\n"
    "      : _reRx\n"
    "      ? to+' in, '+from.toLowerCase()+' out. No load to add here." + HOLD + "'\n"
    "      : to+' in, '+from.toLowerCase()+' out. Same sets, same reps." + HOLD + "')\n"
    "    : _rx.win\n",
))

for i, (old, new) in enumerate(EDITS, 1):
    c = src.count(old)
    print('B%d anchor count %d' % (i, c))
    if c != 1:
        die('B%d anchor count %d != 1: %r' % (i, c, old[:90]))

out = src
for i, (old, new) in enumerate(EDITS, 1):
    out = out.replace(old, new, 1)

if '\\u' in ''.join(n for _, n in EDITS):
    die('a \\u escape was typed into replacement text')
checks = [
    ('_capRpeClamp unchanged', out.count('_capRpeClamp'), 2),
    ('item._preHold=_preF (one writer, the tap)', out.count('item._preHold=_preF;'), 1),
    ('_preHold writers anywhere (=, not ==)', len(re.findall(r'_preHold\s*=(?!=)', out)), 1),
    ('hold sentence x3', out.count(HOLD), 3),
    ('existing verbatim toast intact', out.count("    : to+' in, '+from.toLowerCase()+' out. Same job, same numbers.');\n"), 1),
    ('existing unloadable toast intact', out.count("    ? to+' in, '+from.toLowerCase()+' out. No load to add here, so take the sets to the same effort.'\n"), 1),
    ('existing window toast intact', out.count("    ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Same sets, same effort. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'.'\n"), 1),
    ('ia-version meta 228 unchanged', len(re.findall(r'<meta name="ia-version" content="228"', out)), 1),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want:
        die('post-check %s: %d != %d' % (nm, got, want))

P.write_text(out, encoding='utf-8')
print('OK: 4 edits written to %s (ia-version stays 228)' % P)
