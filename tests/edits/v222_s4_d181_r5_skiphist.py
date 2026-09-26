#!/usr/bin/env python3
# V222 slice 4 (R5), the last code slice — D181 (P-SWAPDURABLE), SECOND RE-RULING.
# Ruling: tests/measure/v212_rulings/p_swapdurable_ruling.md, "SECOND RE-RULING ON V222 PARKED SLICE 3
# (chain detail, snapshot re-apply)", MARIO DECISION (second re-ruling): ship R1 + R2 + R3' + R4' + R5,
# the up_ts trade accepted.
# R5: session swaps are never re-applied to a day the freeze restored from ia_hist_. The record is
# skipped, never deleted and never saved. Branch 2 (touched, no snapshot) and branch 3 (past
# untouched, stored grid) still get the replay.
#   E15 (C6) refreshProgram: a boot-local Set declared beside _swapCut (function scope, so the tail
#            of refreshProgram can read it), filled by the freeze's _snap branch with its key
#            k = _dk(w,d) = 'w'+w+'_'+d, the same shape recordSwap writes.
#   E16 (C6) refreshProgram tail: applySessionSwaps is handed a shallow copy of the store with every
#            marked key omitted; the store is never mutated or saved. Call-site comment rewritten.
#   E17 (C6) swap-store header comment: "prunes itself once the week freezes" replaced by the ruled text.
# ia-version is already 222 (slice 3's E11); this script does not touch it.
# Every anchor asserted count==1 before anything is written; the first miss aborts the script.
import re, sys, pathlib

P = pathlib.Path(__file__).resolve().parents[2] / 'index.html'
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    s = re.sub(r'(?m)^\s*//.*$', '', s)
    s = re.sub(r'(?m)(?<=[;{})\s])\s*//(?!/).*$', '', s)
    return s

# ── precondition: slices 1, 2, 3 (E10, E11) and 3' are in the tree ──
code = strip_comments(src)
pre = [
    ('<meta name="ia-version" content="222">', 1, src),
    ('<meta name="ia-version" content="221">', 0, src),
    ("V222 D181 (R4')", 2, src),
    ('pruneSwaps', 0, src),
    ('resnapshotDayEdit(currentWeek,currentDayKey);', 3, code),
    ('_histRestored', 0, src),
]
for tok, n, hay in pre:
    c = hay.count(tok)
    if c != n:
        die('precondition %r count %d, expected %d' % (tok, c, n))

EDITS = []

# E15a (C6): the boot-local set, declared in refreshProgram's scope before the restore loop.
EDITS.append(('E15a',
"  let _swapCut=null;\n",
"  let _swapCut=null;\n"
"  const _histRestored=new Set();   // V222 D181 (R5): day keys the freeze restored from ia_hist_ this boot\n"))

# E15b (C6): the _snap branch marks its key. k is _dk(w,d) = 'w'+w+'_'+d, recordSwap's key shape.
EDITS.append(('E15b',
"            if(_snap){ _merged[d] = _snap; return; }\n",
"            if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }\n"))

# E16 (C6): withhold every marked key from a shallow copy; the store itself is never touched.
EDITS.append(('E16',
"    // one. Idempotent by name match — a frozen week already carrying the swap has no\n"
"    // name left to match, so this is a no-op rather than a double-apply.\n"
"    try{\n"
"      const _sw=getSwaps(prog.id);\n"
"      if(_sw&&Object.keys(_sw).length) applySessionSwaps(rebuilt,_sw);\n"
"    }catch(e){}\n",
"    // one. V222 D181 (R5): session swaps are never re-applied to a day the freeze\n"
"    // restored from ia_hist_, because that snapshot already carries them (R1). Those\n"
"    // keys are left out of a shallow copy handed to applySessionSwaps; the store is\n"
"    // neither changed nor saved, so the record stays for undo on that day. Days the\n"
"    // freeze took from the stored grid (touched with no snapshot, or past and\n"
"    // untouched) still get the replay.\n"
"    try{\n"
"      const _sw=getSwaps(prog.id)||{}, _swLive={};\n"
"      Object.keys(_sw).forEach(k=>{ if(!_histRestored.has(k)) _swLive[k]=_sw[k]; });\n"
"      if(Object.keys(_swLive).length) applySessionSwaps(rebuilt,_swLive);\n"
"    }catch(e){}\n"))

# E17 (C6): swap-store header. The first two sentences of the paragraph stay; the window claim goes.
EDITS.append(('E17',
"// while you are standing over the new one. The store covers exactly that window,\n"
"// from the swap until the first logged set, and prunes itself once the week freezes.\n",
"// while you are standing over the new one. A record lives until the athlete undoes it\n"
"// (V222 D181); it is replayed in recording order on days the freeze did not restore\n"
"// from ia_hist_ and left alone on days it did.\n"))

for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        die('%s anchor count %d, expected 1' % (name, c))
for name, old, new in EDITS:
    src = src.replace(old, new, 1)

post = [
    ('_histRestored', 3, src),
    ('prunes itself', 0, src),
    ('Idempotent by name match', 0, src),
    ('<meta name="ia-version" content="222">', 1, src),
]
for tok, n, hay in post:
    c = hay.count(tok)
    if c != n:
        die('postcondition %r count %d, expected %d' % (tok, c, n))

P.write_text(src, encoding='utf-8')
print('OK: ' + ', '.join(n for n, _, _ in EDITS) + ' applied to ' + str(P))
