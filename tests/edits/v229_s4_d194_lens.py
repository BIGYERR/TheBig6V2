#!/usr/bin/env python3
# V229 slice 4 of the app slices: D194 P-INJLENS part 1, candidate legality reads the day's plan.
# Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md -- D194 R1 (the plan that governs a card is the plan of the
# day the card is on; for V229 the lens carries the injury only), R2(2) (the three _swapInjuryOK callers hand the filter
# the day's cfg), "What deliberately does NOT change"; Mario: "D194 V229 SCOPE: Build half + sheet".
# Reference: measure's CF4 surgery (tests/measure/v229_lens_cf4.js PART=trees, M9; siting in
# tests/measure/v229_rulings/measure_lens_cf4_m9.md "Surgery siting choices"). The helper and the three caller lines
# below are CF4's text byte for byte.
#   L1  _dayPlanCfg(prog,day) above _swapInjuryOK's heading comment: prog.cfg itself (same reference, same falsy-prog
#       fallback `(prog&&prog.cfg)||{}`) when the day has no stamp or the stamp's patch has no own `injury` key (a travel
#       stamp); else Object.assign({}, prog.cfg, {injury: patch.injury}).
#   L2  swapCandidates, L3 auxSwapCandidates (feeds _powerAllowed and _swapInjuryOK), L4 addCandidates:
#       `const cfg=(prog&&prog.cfg)||{};` -> `const cfg=_dayPlanCfg(prog,day);`. That line occurs 3 times, so each anchor
#       is widened with its own function's header line(s) to count==1; no replace-all.
# Not touched: _swapInjuryOK, swapUniverseFor, applyOverlays, buildProgram, the tap guard (activeProg.cfg.injury) and the
# applySessionSwaps guard (V230's part 2, row (q)). NO ia-version bump (stays 228).
# All or none: ia-version exactly 228, `_renamed` on 3 lines / 4 occurrences (slice 3 in), `_dayPlanCfg` absent, every anchor count==1.
import sys, re, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

m = re.findall(r'<meta name="ia-version" content="(\d+)"', src)
if m != ['228']:
    die('ia-version must be exactly 228, found %r' % (m,))
# Slice 3's `_renamed` sits on 3 lines (the brief's x3, a grep -c line count) and occurs 4 times (one line holds two).
_rl = sum(1 for l in src.split('\n') if '_renamed' in l)
if _rl != 3 or src.count('_renamed') != 4:
    die('slice 3 not in: _renamed on %d lines (want 3), %d occurrences (want 4)' % (_rl, src.count('_renamed')))
if '_dayPlanCfg' in src:
    die('_dayPlanCfg already present')
OLD_CFG = "  const cfg=(prog&&prog.cfg)||{};\n"
if src.count(OLD_CFG) != 3:
    die('expected the caller cfg line 3 times, found %d' % src.count(OLD_CFG))

HELPER = (
    "// D194 R1 (P-INJLENS), measure CF4 reading: the plan that governs a card is the plan of the day the card is on.\n"
    "// Outside buildProgram the injury is read off the day's own overlay stamp (_ovKey via dayOverlayInfo, the carrier\n"
    "// swapUniverseFor already keys on). A day whose stamp carries no injury key (no stamp, or a travel stamp) keeps\n"
    "// prog.cfg's injury, which is what that day's build used. Injury only: every other field is prog.cfg's.\n"
    "function _dayPlanCfg(prog,day){\n"
    "  const base=(prog&&prog.cfg)||{};\n"
    "  const ov=dayOverlayInfo(day);\n"
    "  if(!ov||!ov.patch||!Object.prototype.hasOwnProperty.call(ov.patch,'injury')) return base;\n"
    "  return Object.assign({},base,{injury:ov.patch.injury});\n"
    "}\n"
)

EDITS = [
    ('L1 helper', "// Survives the athlete's injury plan? Wrapped as a throwaway section so the real\n",
     HELPER + "// Survives the athlete's injury plan? Wrapped as a throwaway section so the real\n"),
    ('L2 swapCandidates', "function swapCandidates(outName,day,week,prog){\n" + OLD_CFG,
     "function swapCandidates(outName,day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"),
    ('L3 auxSwapCandidates', "function auxSwapCandidates(outName,day,prog){\n  const fam=_auxFamily(outName); if(!fam) return [];\n" + OLD_CFG,
     "function auxSwapCandidates(outName,day,prog){\n  const fam=_auxFamily(outName); if(!fam) return [];\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1 (equipment unchanged: injury only)\n"),
    ('L4 addCandidates', "function addCandidates(day,week,prog){\n" + OLD_CFG,
     "function addCandidates(day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"),
]

for nm, old, new in EDITS:
    c = src.count(old)
    print('%s anchor count %d' % (nm, c))
    if c != 1:
        die('%s anchor count %d != 1: %r' % (nm, c, old[:90]))

out = src
for nm, old, new in EDITS:
    out = out.replace(old, new, 1)

if '\\u' in ''.join(n for _, _, n in EDITS):
    die('a \\u escape was typed into replacement text')
checks = [
    ('_dayPlanCfg (definition + 3 callers)', out.count('_dayPlanCfg'), 4),
    ('old caller cfg line', out.count('const cfg=(prog&&prog.cfg)||{};'), 0),
    ('_swapInjuryOK definition unchanged', out.count('function _swapInjuryOK(name,cfg){\n  if(!cfg||!cfg.injury) return true;\n'), 1),
    ('tap guard unchanged (cfg.injury)', out.count('  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n'), 1),
    ('boot guard unchanged (cfg.injury)', out.count('    if(hit && prog.cfg && prog.cfg.injury){\n'), 1),
    ('_renamed unchanged (occurrences)', out.count('_renamed'), 4),
    ('ia-version meta 228 unchanged', len(re.findall(r'<meta name="ia-version" content="228"', out)), 1),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want:
        die('post-check %s: %d != %d' % (nm, got, want))

P.write_text(out, encoding='utf-8')
print('OK: 4 edits written to %s (ia-version stays 228)' % P)
