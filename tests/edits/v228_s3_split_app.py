#!/usr/bin/env python3
# V228 build, slice 3: the split app edits. Mario, round 2 (tests/measure/v228_rulings/d193_caprpe_ruling.md,
# "Mario's decisions, round 2"): "V228 ships R1 ... and R4 ... only, with D192"; the clamp family (R2, R3, R7, R8)
# moves to V229 and tests/edits/v228_s1_d193_caprpe.py is PARKED (kept, not applied). D192 re-ruling
# (tests/measure/v228_rulings/d192_undokey_ruling.md): "`swapOriginOf` :14179 takes the most recent record whose `to`
# is the card's name (`.filter(...).pop()`). Nothing else."
#   E1 (D193 R1)  INJ_CAP_CUE says three: ' — hold RPE 7, three in the tank'.
#   E2 (D193 R4)  _stripCapCue strips / — hold RPE 7, (?:two|three) in the tank$/, identity otherwise
#                 (same bytes as slice 1's E2).
#   E3 (D192)     swapOriginOf: [0] -> .pop(); the sabotage anchor
#                 'const hit=list.filter(e=>e&&e.to===name).pop();' must land exactly once, on one line.
#   E4            <meta name="ia-version"> 227 -> 228, the last write.
# Refuse unless index.html reads 227 and _capRpeClamp is absent; every anchor count==1 before any write; all or none.
import sys, re, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

def die(msg):
    print('REFUSED: ' + msg); sys.exit(1)

m = re.findall(r'<meta name="ia-version" content="(\d+)"', src)
if m != ['227']: die('ia-version must be exactly 227, found %r' % (m,))
if '_capRpeClamp' in src: die('_capRpeClamp is present: the parked clamp (slice 1) is on this tree')

POP = 'const hit=list.filter(e=>e&&e.to===name).pop();'
if POP in src: die('the D192 .pop() line is already present')

EDITS = [
  # E1 (R1)
  ("const INJ_CAP_CUE=' — hold RPE 7, two in the tank';\n",
   "// V228 D193 P-CAPRPE R1 (split, Mario round 2): the cue says three, rpeFromWave's rir at RPE 7 and _bwSetsFromDetail's RPE 7 line.\n"
   "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';\n"),
  # E2 (R4)
  ("function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }\n",
   "// V228 D193 P-CAPRPE (R4): the stripper recognises the cue by shape, not by today's spelling: V227 stored 'two in the\n"
   "// tank', V228 writes 'three'. One regex, both wordings, no constant to expire; every other detail comes back unchanged.\n"
   "function _stripCapCue(d){ if(typeof d!=='string') return d; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n"),
  # E3 (D192)
  ("  const hit=list.filter(e=>e&&e.to===name)[0];\n",
   "  // V228 D192 P-UNDOKEY: the most recent record whose `to` is the card's name, so the chip names the lift that just left.\n"
   "  " + POP + "\n"),
  # E4 meta, last
  ('<meta name="ia-version" content="227">', '<meta name="ia-version" content="228">'),
]
for i, (old, new) in enumerate(EDITS, 1):
    c = src.count(old)
    if c != 1: die('E%d anchor count %d != 1: %r' % (i, c, old[:90]))

out = src
for old, new in EDITS:
    out = out.replace(old, new, 1)

if out.count(POP) != 1: die('the D192 sabotage anchor lands %d times, want 1' % out.count(POP))
if "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';" not in out: die('E1 did not land')
if '_capRpeClamp' in out: die('_capRpeClamp appeared')
if re.findall(r'<meta name="ia-version" content="(\d+)"', out) != ['228']: die('meta did not land at 228')
if '\\u' in ''.join(n for _, n in EDITS): die('a \\u escape was typed into replacement text')

P.write_text(out, encoding='utf-8')
print('OK: E1 cue three, E2 stripper both wordings, E3 swapOriginOf .pop(), E4 meta 227->228')
