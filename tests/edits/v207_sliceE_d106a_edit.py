#!/usr/bin/env python3
# V207 slice E of D106a (fix for gatekeeper's red, coach option 2): the trial takes the test
# week's HARDEST run by one hierarchy: CHI, else INT, else the LONG LSD, else the only LSD.
# Multi-sport pace weeks deal no quality run, so before this they were pinned with no trial.
# One hunk (B2c): the slot pick, and the easy-LSD capture excludes the trial's own slot.
# No version bump (already 207). Every anchor count==1 or abort.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
EDITS = []
E1_OLD = (
"      // D106a (V207): the test IS the week's quality slot: the CHI when the week has one, else\n"
"      // the INT (a three-run block at one or two weeks still deals the INT). The card is the\n"
"      // goal's own trial: distance fixed, the log takes the time, the pace derives. TIME TRIAL\n"
"      // in the subtype is what the finder below moves onto the test weekday.\n"
"      const _sl = _pin.slots || [];\n"
"      const _q = _sl.find(s => s.w === _pin.w && s.t === 'chi') || _sl.find(s => s.w === _pin.w && s.t === 'int');\n"
)
E1_NEW = (
"      // D106a (V207): the test takes the week's HARDEST run, by one hierarchy: the CHI, else the\n"
"      // INT (a three-run block at one or two weeks still deals the INT), else the long LSD (a\n"
"      // multi-sport week deals no quality run), else the only LSD. The long card, never the easy\n"
"      // one: the easy LSD stays free to be the shakeout. Tied to the slot, not the name. The card\n"
"      // is the goal's own trial: distance fixed, the log takes the time, the pace derives. TIME\n"
"      // TRIAL in the subtype is what the finder below moves onto the test weekday.\n"
"      const _sl = _pin.slots || [];\n"
"      const _inW = t => _sl.find(s => s.w === _pin.w && s.t === t);\n"
"      const _lsdW = _sl.filter(s => s.w === _pin.w && s.t === 'lsd_easy');\n"
"      const _q = _inW('chi') || _inW('int') || _inW('lsd_long') || (_lsdW.length === 1 ? _lsdW[0] : null);\n"
)
EDITS.append(('E1 hierarchy', E1_OLD, E1_NEW))
E2_OLD = "      const _ez = {}; _sl.forEach(s => { if(s.t === 'lsd_easy' && !_ez[s.w] && schedule[s.w][s.d]) _ez[s.w] = schedule[s.w][s.d]; });\n"
E2_NEW = "      const _ez = {}; _sl.forEach(s => { if(s.t === 'lsd_easy' && s !== _q && !_ez[s.w] && schedule[s.w][s.d]) _ez[s.w] = schedule[s.w][s.d]; });\n"
EDITS.append(('E2 easy capture excludes the trial slot', E2_OLD, E2_NEW))
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT: anchor for %s count=%d (need 1). Nothing written.' % (name, n)); sys.exit(1)
out = src
for name, old, new in EDITS:
    out = out.replace(old, new, 1); print('applied', name)
for tok, want in [("_inW('lsd_long')", 1), ('s !== _q && !_ez[s.w]', 1), ('name="ia-version" content="207"', 1)]:
    if out.count(tok) != want:
        print('ABORT: post-condition %r count=%d want %d. Nothing written.' % (tok, out.count(tok), want)); sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: slice E written to', PATH)
