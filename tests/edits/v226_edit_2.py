#!/usr/bin/env python3
# V226 slice 2 of 7: D188 P-BEGINNERMILE validator and anchor (E6, E7, E2) + D189 F6.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (Mario "all yes", 2026-09-30).
# ia-version is NOT bumped in this slice (stays 225; slice 6 bumps it to 226).
# Every anchor asserted count==1 before anything is written; all four edits or none.
# E6 and E7 are block anchors: the whole block must be count==1 in the file, and every
# sub-replacement inside it must be count==1 in the block.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

def die(msg):
    sys.exit('ABORT: ' + msg)

with open(PATH, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

# ── E6 :7484 + :7488 _mileEntryState, one block ──
E6_OLD = (
    "  if(!g||exp==='beginner') return {ok:true};\n"
    "  if(g.mileBestMins===undefined||g.mileBestMins===''){\n"
    "    // D187 R3 (V225): a run_pace_goal with no mile has no anchor to build the clock from --\n"
    "    // D110a's swim gate is the model. Every OTHER run goal type still passes through blank.\n"
    "    if(g.id==='run_pace_goal') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};\n"
)
E6_SUBS = [
    ("  if(!g||exp==='beginner') return {ok:true};\n",
     "  if(!g) return {ok:true};\n"),
    ("Every OTHER run goal type still passes through blank.\n",
     "Every OTHER run goal type still passes through blank.\n"
     "    // D188: beginners stay optional on every goal.\n"),
    ("    if(g.id==='run_pace_goal') return {ok:false, blank:true,",
     "    if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true,"),
]

# ── E7 :14708-:14723 runAnchorInfo, one block ──
E7_OLD = (
    "  // Same rule as both engines: a beginner's entry is ignored; a falsy entry falls to the default.\n"
    "  const rawSec = (exp !== 'beginner' && entered) ? entered : expDef;\n"
    "  const row = paceChartLookup('mile', rawSec);\n"
    "  // The chart CLAMPS: anything at or under its fastest row trains at that row, anything at\n"
    "  // or over its slowest trains there. row.mile is the anchor the engines actually use, so\n"
    "  // that is the number stated; when it differs from the entry, the sentence says so.\n"
    "  const anchorSec = row.mile;\n"
    "  const clamped = (exp !== 'beginner' && !!entered && Math.round(row.mile) !== Math.round(rawSec)) ? (rawSec < row.mile ? 'fast' : 'slow') : null;\n"
    "  const src = g.mileBestSrc || null;\n"
    "  const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default' : (src && src.kind === 'seeded') ? 'seeded' : (src && src.kind === 'edited') ? 'edited' : 'entered';\n"
    "  const race = g.id === 'run_half' ? 'half' : g.id === 'run_marathon' ? 'marathon' : null;\n"
    "  // V176 (D10): the fixed target for pace-goal programs. The chip is the prescription;\n"
    "  // the measure of progress is the projection card walking toward it.\n"
    "  const goalT = (g.id === 'run_pace_goal' && g.targetDist && g.targetMins !== undefined && g.targetMins !== '')\n"
    "    ? {dist:+g.targetDist, sec:(+g.targetMins||0)*60 + (+g.targetSecs||0)} : null;\n"
    "  return {anchorSec, rawSec, clamped, row, kind, prog:"
)
E7_SUBS = [
    ("  // Same rule as both engines: a beginner's entry is ignored; a falsy entry falls to the default.\n",
     "  // Same rule as both engines: a falsy entry falls to the default (D188: every level).\n"),
    ("const rawSec = (exp !== 'beginner' && entered) ? entered : expDef;",
     "const rawSec = entered ? entered : expDef;"),
    ("(exp !== 'beginner' && !!entered && Math.round(row.mile) !== Math.round(rawSec))",
     "(!!entered && Math.round(row.mile) !== Math.round(rawSec))"),
    ("const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default'",
     "const kind = !entered ? 'default'"),
    ("{anchorSec, rawSec, clamped, row, kind,",
     "{anchorSec, rawSec, clamped, row, kind, exp,"),
]

# ── E2 :2459 paceCeilingSentence: delete the beginner line ──
E2_OLD = ("  if(f.exp === 'beginner') return 'Your paces start from the beginner default of '"
          "+_clkMS(f.cur)+' per mile.'+reach+' Keep it or change it above.';\n")
E2_NEW = ""

# ── F6 :2280 updateRaceDateFeedback ──
F6_OLD = "  const _f = assessRunPaceCeiling((p && p.tw) || len);"
F6_NEW = "  const _f = _mileEntryState().blank ? null : assessRunPaceCeiling((p && p.tw) || len);"

def sub_block(name, block, subs):
    out = block
    for old, new in subs:
        n = block.count(old)
        if n != 1:
            die('%s sub-anchor count %d != 1 in block: %r' % (name, n, old[:90]))
        out = out.replace(old, new, 1)
    if out == block:
        die(name + ' block unchanged')
    return out

EDITS = [
    ('E6', E6_OLD, sub_block('E6', E6_OLD, E6_SUBS)),
    ('E7', E7_OLD, sub_block('E7', E7_OLD, E7_SUBS)),
    ('E2', E2_OLD, E2_NEW),
    ('F6', F6_OLD, F6_NEW),
]

# Assert every anchor count==1 in the untouched source before writing anything.
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        die('%s anchor count %d != 1: %r' % (name, n, old[:90]))

out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        die('%s anchor count moved during apply' % name)
    out = out.replace(old, new, 1)

if out == src:
    die('no change')

with open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(out)
print('v226_edit_2: 4 edits written (E6, E7, E2, F6)')
