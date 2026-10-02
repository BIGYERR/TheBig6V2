#!/usr/bin/env python3
# V228 slice 1 of D193 P-CAPRPE (ruling: tests/measure/v228_rulings/d193_caprpe_ruling.md, Amendment 1 live).
# App edits to index.html only. NO ia-version bump in this slice (a later slice bumps 227 -> 228).
#   E1 (R1)  INJ_CAP_CUE says three: ' — hold RPE 7, three in the tank'.
#   E2 (R4)  _stripCapCue recognises the cue by shape: one regex, both wordings (two|three); identity elsewhere.
#   E3 (R2)  _capRpeClamp: a named RPE above 7 (a range by its top) becomes 7; the reserve gloss it carried is
#            restated by the file's own RPE 7 line for that shape (Amendment 1 section 3): bwsets ->
#            '(leave 3 or more in reserve)', wave -> '(leave ~3 reps in reserve)', loadCapped 'heaviest pair' ->
#            '(leave ~3 in reserve)'; grammar '@ RPE N' carries no gloss and gets none. At or under 7: byte-identical.
#   E4 (R2)  applyInjuryFilter's capped branch: no RPE named -> append the cue (unchanged); RPE named -> clamp.
# All or none: every anchor asserted count==1 and every new name asserted absent before anything is written.
import sys, re, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

m = re.findall(r'<meta name="ia-version" content="(\d+)"', src)
if m != ['227']:
    die('ia-version must be exactly 227, found %r' % (m,))

for nm in ['_capRpeClamp']:
    if nm in src:
        die('name already exists in file: ' + nm)

EDITS = []

# E1 (R1): the literal.
EDITS.append((
    "const INJ_CAP_CUE=' — hold RPE 7, two in the tank';",
    "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';",
))

# E2 (R4): the stripper reads the cue by shape, both wordings.
EDITS.append((
    "function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }\n",
    "// V228 D193 P-CAPRPE (R4): the stripper recognises the cue by shape, not by today's spelling: V227 stored 'two in the\n"
    "// tank', V228 writes 'three'. One regex, both wordings, no constant to expire; every other detail comes back unchanged.\n"
    "function _stripCapCue(d){ if(typeof d!=='string') return d; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n",
))

# E3 (R2, Amendment 1 section 3): the clamp helper, read only by applyInjuryFilter's capped branch.
EDITS.append((
    "function applyInjuryFilter(sections,cfg){\n",
    "// V228 D193 P-CAPRPE (R2): on a capped pattern a named RPE above 7 (a range by its top) is held at 7, and the reserve\n"
    "// gloss it carried is restated by the file's own RPE 7 line for that shape: bwsets (_bwSetsFromDetail's RPE 7 branch),\n"
    "// wave (rpeFromWave at 7, rir 3), loadCapped (scheme()'s _effEase line). The @ RPE grammar never glosses and gets none.\n"
    "// A detail at or under 7 comes back byte-identical. Read only by applyInjuryFilter, the plan's single writer (D190).\n"
    "function _capRpeClamp(d){\n"
    "  if(typeof d!=='string') return d;\n"
    "  return d.replace(/RPE\\s*(\\d+(?:\\.\\d+)?)(?:[–-](\\d+(?:\\.\\d+)?))?\\+?( \\((?:stop 2 reps short of failure|leave ~\\d+ reps? in reserve|heaviest pair you can find)\\))?/g,function(t,lo,hi,g){\n"
    "    if(!(Math.max(+lo,hi?+hi:0)>7)) return t;\n"
    "    if(!g) return 'RPE 7';\n"
    "    return 'RPE 7'+(/^ \\(stop/.test(g)?' (leave 3 or more in reserve)':/^ \\(heaviest/.test(g)?' (leave ~3 in reserve)':' (leave ~3 reps in reserve)');\n"
    "  });\n"
    "}\n"
    "function applyInjuryFilter(sections,cfg){\n",
))

# E4 (R2): the capped branch writes both ways (no latch): cue when no RPE is named, clamp when one is.
EDITS.append((
    "      if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;\n",
    "      if(pat&&P.cap.has(pat)&&detail) detail=/RPE/.test(detail)?_capRpeClamp(detail):detail+INJ_CAP_CUE;   // V228 D193 (R2)\n",
))

for i, (old, new) in enumerate(EDITS, 1):
    c = src.count(old)
    if c != 1:
        die('E%d anchor count %d != 1: %r' % (i, c, old[:90]))

out = src
for i, (old, new) in enumerate(EDITS, 1):
    out = out.replace(old, new, 1)

if '\\u' in ''.join(n for _, n in EDITS):
    die('a \\u escape was typed into replacement text')
if out.count('_capRpeClamp') != 2:
    die('_capRpeClamp should appear exactly twice (definition + one reader), got %d' % out.count('_capRpeClamp'))

P.write_text(out, encoding='utf-8')
print('OK: 4 edits written to %s (ia-version stays 227)' % P)
