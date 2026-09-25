#!/usr/bin/env python3
# V221 build 2, slice S8: all of D180 (P-BLOCKOPEN). refreshProgram's copy-back carries blockOpen.
# Ruling: tests/measure/v221_rulings/p_active_ruling.md, "RE-RULING ON V220 (parked S4: blockOpen,
# boot)" subsections 1 and 2, and "MARIO DECISION ON P-BLOCKOPEN" (SHIP in V221, device read skipped).
# Evidence: tests/measure/v221_blockopen.out.txt (script tests/measure/v221_blockopen.js).
#   B1 (T) one copy-back line, rebuilt.blockOpen = prog.blockOpen;, after rebuilt.startDate
#   B1 (D) one comment line citing D180 and D14a §2
# Unconditional like startDate: rebuilt is a fresh buildProgram object on every call and buildProgram
# never writes blockOpen, so an if-guard would not latch, but the ruling names the plain line. An
# undefined own property serialises away (JSON.stringify), and no app code reads program keys by
# iteration, 'in' or hasOwnProperty, so non-aligned storage stays byte-identical.
# Not touched: the writer (_applyWizardStart), dayBeforeStart and its call sites, setProgRace,
# setProgStart, the engine. No ia-version bump in this slice (stays 220).
# Every anchor asserted count==1 before anything is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# the line this slice introduces must be new
for tok in ('rebuilt.blockOpen',):
    if src.count(tok) != 0:
        sys.exit('ABORT: %s already present (%d)' % (tok, src.count(tok)))

EDITS = []

B1_OLD = """    rebuilt.created = prog.created;
    rebuilt.startDate = prog.startDate;
    rebuilt.seed = prog.seed;
"""
B1_NEW = """    rebuilt.created = prog.created;
    rebuilt.startDate = prog.startDate;
    // D180 (V221): blockOpen is where the block opened (D14a §2); a rebuild keeps pre-signup days outside.
    rebuilt.blockOpen = prog.blockOpen;
    rebuilt.seed = prog.seed;
"""
EDITS.append(('B1 refreshProgram copy-back carries blockOpen', B1_OLD, B1_NEW))

out = src
for name, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %s count=%d (need 1); nothing written' % (name, n))
    out = out.replace(old, new, 1)
    print('ok  %s' % name)

# post-flight counts
checks = [('rebuilt.blockOpen = prog.blockOpen;', 1), ('D180 (V221)', 1),
          ('prog.blockOpen = _isoOf(t)', 1), ('<meta name="ia-version" content="220">', 1)]
for tok, want in checks:
    got = out.count(tok)
    if got != want:
        sys.exit('ABORT: post-flight %r count=%d (want %d); nothing written' % (tok, got, want))

open(PATH, 'w', encoding='utf-8').write(out)
print('wrote %s (%d anchors, %d bytes delta)' % (PATH, len(EDITS), len(out.encode('utf-8')) - len(src.encode('utf-8'))))
