#!/usr/bin/env python3
# V222 build 2b, slice 1 of 3 code slices. Ruling D181 (P-SWAPDURABLE), R1 only.
# Ruling file: tests/measure/v212_rulings/p_swapdurable_ruling.md (original section; R1 stands as
# worded in the RE-RULING ON V221 section).
#
# R1. Swap and undo fold into the day's record the way add and skip do. applySwapChoice and undoSwap
# call resnapshotDayEdit(currentWeek,currentDayKey) after their mutation, before openDetail.
# resnapshotDayEdit, never snapshotDay: it returns without writing when no ia_hist_ snapshot exists
# (`if(!h[k]) return;`), so a swap alone never freezes a day and never moves _cut.
#
#   E1 applySwapChoice: one success path (both early returns close the sheet and change nothing).
#      The call sits after recordSwap/bumpSwapCount/closeSwapSheet, before openDetail, which is the
#      _afterEdit order (resnapshot, then openDetail).
#   E2 undoSwap: one success path (all three early returns change nothing). The call sits after
#      clearSwap, before openDetail.
#   E3 resnapshotDayEdit's comment: "called ONLY from the add/skip handlers" becomes "called only from
#      the athlete's own edit handlers: add, skip, swap, undo". The phrase is kept on one line so a
#      grep finds it; the rest of the comment is byte-identical.
#
# NO version bump in this slice (ia-version stays 221). The meta bump is the last replacement of the
# build and lands in a later slice.
# Every anchor is asserted count==1 on the pre-edit text before anything is written; the first miss
# aborts the whole script with the file untouched.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

EDITS = [
    ('E1 applySwapChoice resnapshot',
     "  recordSwap(activeProgId,currentWeek,currentDayKey,from,to,_undoRx);\n"
     "  const nudge=bumpSwapCount(activeProgId,from,to);\n"
     "  closeSwapSheet();\n"
     "  openDetail(currentDayKey,day);\n",
     "  recordSwap(activeProgId,currentWeek,currentDayKey,from,to,_undoRx);\n"
     "  const nudge=bumpSwapCount(activeProgId,from,to);\n"
     "  closeSwapSheet();\n"
     "  resnapshotDayEdit(currentWeek,currentDayKey);\n"
     "  openDetail(currentDayKey,day);\n"),
    ('E2 undoSwap resnapshot',
     "  clearSwap(activeProgId,currentWeek,currentDayKey,from);\n"
     "  openDetail(currentDayKey,day);\n"
     "  showToast(from+' is back on the card.');\n",
     "  clearSwap(activeProgId,currentWeek,currentDayKey,from);\n"
     "  resnapshotDayEdit(currentWeek,currentDayKey);\n"
     "  openDetail(currentDayKey,day);\n"
     "  showToast(from+' is back on the card.');\n"),
    ('E3 resnapshotDayEdit comment',
     "// preserving nothing else: it is called ONLY from the add/skip handlers, never from the\n"
     "// five normal hook points, so an untouched prescription can still never be rewritten.\n"
     "function resnapshotDayEdit(week,dayKey){\n",
     "// preserving nothing else: it is\n"
     "// called only from the athlete's own edit handlers: add, skip, swap, undo, never from the\n"
     "// five normal hook points, so an untouched prescription can still never be rewritten.\n"
     "function resnapshotDayEdit(week,dayKey){\n"),
]


def die(msg):
    print('ABORT ' + msg + '; index.html not written')
    sys.exit(1)


src = open(P, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="221">') != 1:
    die('ia-version is not 221')

for label, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        die(label + ': anchor count ' + str(n) + ' (want 1)')
    if src.count(new) != 0:
        die(label + ': replacement already present')

out = src
for label, old, new in EDITS:
    if out.count(old) != 1:
        die(label + ': anchor count changed mid-script')
    out = out.replace(old, new, 1)
    print('OK ' + label)

if out.count('resnapshotDayEdit(currentWeek,currentDayKey);') != 3:
    die('expected 3 resnapshotDayEdit call sites after edit (_afterEdit, applySwapChoice, undoSwap)')
if 'called ONLY from the add/skip handlers' in out:
    die('old comment phrase survived')

open(P, 'w', encoding='utf-8').write(out)
print('WROTE ' + P + ' (' + str(len(EDITS)) + ' edits, ia-version unchanged at 221)')
