#!/usr/bin/env python3
# V229 slice 1 of 4 (app slice) of D193 P-CAPRPE, the clamp family Mario approved and parked from V228.
# Ruling: tests/measure/v228_rulings/d193_caprpe_ruling.md -- R2 (re-stated in Amendment 2), Amendment 1 section 3 (the
# four-shape table), R7 (D193-HELDTEST, Mario: yes), Amendment 3 section 2 (the stripper reads beneath R7's text and
# returns _testRx's text), Amendment 4 "Siting: one conflict, one note" and the "Session decisions (V229 chat)" block.
# App edits to index.html only. NO ia-version bump in this slice (stays 228; slice 4 bumps 228 -> 229 as its last write).
#   E1 (A3 s2 + session siting #1/#2)  hoist TEST_RX_TEXT (the _testRx literal, moved byte for byte) and INJ_HELD_TEST
#        (R7's text) to top level beside the stripper; _stripCapCue recognises R7's text BY SHAPE (fixed clauses, RPE number
#        free) and returns TEST_RX_TEXT. The cue regex (both wordings) is kept. Identity on TEST_RX_TEXT and on every
#        non-cue detail.
#   E2 (session siting #1)  _testRx reads TEST_RX_TEXT: one text, no duplicated literal. Its three readers are untouched.
#   E3 (R2 + R7)  _capRpeClamp: the parked V228 E3 body verbatim, plus R7's fifth shape checked first (a detail of
#        _testRx's shape, any RPE number, returns INJ_HELD_TEST).
#   E4 (R2)  parked V228 E4: the capped branch writes both ways (no latch): no RPE named -> cue; RPE named -> clamp.
# The parked script tests/edits/v228_s1_d193_caprpe.py is the record of E3/E4 and is neither run nor edited.
# All or none: ia-version must be exactly 228, every new name absent, every anchor count==1, before anything is written.
import sys, re, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

m = re.findall(r'<meta name="ia-version" content="(\d+)"', src)
if m != ['228']:
    die('ia-version must be exactly 228, found %r' % (m,))

for nm in ['TEST_RX_TEXT', 'INJ_HELD_TEST', '_capRpeClamp']:
    if nm in src:
        die('name already exists in file: ' + nm)

# The strength test-week text, typed from index.html :8939 (asserted byte-equal by E2's count==1 anchor below).
TEST_LIT = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.'
# R7 (D193-HELDTEST), typed from the ruling, Amendment 2 R7.
R7_LIT = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.'

EDITS = []

# E1 (Amendment 3 section 2 + V229 session siting): the two top-level texts and the stripper that reads beneath R7.
EDITS.append((
    "// V228 D193 P-CAPRPE (R4): the stripper recognises the cue by shape, not by today's spelling: V227 stored 'two in the\n"
    "// tank', V228 writes 'three'. One regex, both wordings, no constant to expire; every other detail comes back unchanged.\n"
    "function _stripCapCue(d){ if(typeof d!=='string') return d; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n",
    "// V229 D193 P-CAPRPE (Amendment 3 section 2, V229 siting): the strength test-week text is one top-level string, read by\n"
    "// _testRx in the build and returned by the stripper below; INJ_HELD_TEST is R7's text (D193-HELDTEST): a held pattern\n"
    "// does not test. The filter writes it on a capped Main; the stripper reads beneath it, so it appears only on a held lift.\n"
    "const TEST_RX_TEXT='" + TEST_LIT + "';\n"
    "const INJ_HELD_TEST='" + R7_LIT + "';\n"
    "// V228 D193 P-CAPRPE (R4): the stripper recognises the cue by shape, not by today's spelling: V227 stored 'two in the\n"
    "// tank', V228 writes 'three'. One regex, both wordings, no constant to expire; every other detail comes back unchanged.\n"
    "// V229 D193 (Amendment 3 section 2): it also reads beneath R7's held-test text, matched by shape (its fixed clauses, the\n"
    "// RPE number free) and returned as TEST_RX_TEXT. The test text itself and every non-cue detail still come back unchanged.\n"
    + r"function _stripCapCue(d){ if(typeof d!=='string') return d; if(/^Work up to one working set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/.test(d)) return TEST_RX_TEXT; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }" + "\n",
))

# E2 (V229 siting #1): one text; _testRx reads the hoisted constant. Readers :9115, :9197, :9244 untouched.
EDITS.append((
    "    const _testRx = '" + TEST_LIT + "';\n",
    "    const _testRx = TEST_RX_TEXT;   // V229 D193: one text, hoisted beside the cue stripper, which returns it beneath R7\n",
))

# E3 (R2, Amendment 1 section 3, + R7 fifth shape): the clamp helper, read only by applyInjuryFilter's capped branch.
EDITS.append((
    "function applyInjuryFilter(sections,cfg){\n",
    "// V229 D193 P-CAPRPE (R2, R7): on a capped pattern a named RPE above 7 (a range by its top) is held at 7, and the reserve\n"
    "// gloss it carried is restated by the file's own RPE 7 line for that shape: bwsets (_bwSetsFromDetail's RPE 7 branch),\n"
    "// wave (rpeFromWave at 7, rir 3), loadCapped (scheme()'s _effEase line). The @ RPE grammar never glosses and gets none.\n"
    "// R7 (D193-HELDTEST), checked first: a detail of the strength test's shape (TEST_RX_TEXT, any RPE number) becomes\n"
    "// INJ_HELD_TEST, the hold in words. Any other detail at or under 7 comes back byte-identical. Read only by\n"
    "// applyInjuryFilter, the plan's single writer (D190).\n"
    "function _capRpeClamp(d){\n"
    "  if(typeof d!=='string') return d;\n"
    + r"  if(/^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/.test(d)) return INJ_HELD_TEST;" + "\n"
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
    "      if(pat&&P.cap.has(pat)&&detail) detail=/RPE/.test(detail)?_capRpeClamp(detail):detail+INJ_CAP_CUE;   // V229 D193 (R2, R7)\n",
))

for i, (old, new) in enumerate(EDITS, 1):
    c = src.count(old)
    print('E%d anchor count %d' % (i, c))
    if c != 1:
        die('E%d anchor count %d != 1: %r' % (i, c, old[:90]))

out = src
for i, (old, new) in enumerate(EDITS, 1):
    out = out.replace(old, new, 1)

if '\\u' in ''.join(n for _, n in EDITS):
    die('a \\u escape was typed into replacement text')
checks = [
    ('_capRpeClamp (definition + one reader)', out.count('_capRpeClamp'), 2),
    ('test literal (TEST_RX_TEXT only)', out.count(TEST_LIT), 1),
    ('R7 literal (INJ_HELD_TEST only)', out.count(R7_LIT), 1),
    ('const TEST_RX_TEXT=', out.count('const TEST_RX_TEXT='), 1),
    ('const INJ_HELD_TEST=', out.count('const INJ_HELD_TEST='), 1),
    ('const _testRx = TEST_RX_TEXT;', out.count('const _testRx = TEST_RX_TEXT;'), 1),
    ('ia-version meta 228 unchanged', len(re.findall(r'<meta name="ia-version" content="228"', out)), 1),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want:
        die('post-check %s: %d != %d' % (nm, got, want))

P.write_text(out, encoding='utf-8')
print('OK: 4 edits written to %s (ia-version stays 228)' % P)
