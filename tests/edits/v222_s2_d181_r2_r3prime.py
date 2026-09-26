#!/usr/bin/env python3
# V222 build 2b, slice 2 of 3 code slices. Ruling D181 (P-SWAPDURABLE), R2 and R3'.
# Ruling file: tests/measure/v212_rulings/p_swapdurable_ruling.md. The "RE-RULING ON V221 (measure
# refutations)" section supersedes R3 (now R3') and corrects R2's caller line.
#
# R2. The per-exercise Log is a first touch. logExerciseWeight calls snapshotDay on its own resolved
# week and day key before its ia_exw_ write, when the day key is a real one. snapshotDay is
# first-touch-wins (`if(h[k]) return;`), so this is a no-op on a day already snapshotted. Two direct
# callers: selectKBSize (KB chip, via selectKBByKey) and saveExWeight (Log button, and the quiet
# re-save on a card already logged). Every path is a gesture on the viewed day; 0 boot callers.
# D108's "selectKBSize is deliberately NOT changed" stands and is not touched.
#
#   E4 logExerciseWeight: `if(dk) snapshotDay(w, dk);` right after `dk` is resolved, which is after
#      both early returns (so it fires only when a write follows) and before saveExWeights, the
#      function's only ia_exw_ write. "Real day key" is snapshotDay's own notion: a truthy key
#      (its `!dayKey` return) naming a day present in activeProg.weeks[week] (its `if(!day) return`).
#      The `if(dk)` guard states the first half at the call site; snapshotDay enforces both.
#
# R3'. The pruneSwaps call and function go. _swapCut, its writer and pruneDayEdits stay.
#
#   E5 refreshProgram: delete the pruneSwaps call inside the swaps try block. The try block and its
#      other two statements stay. The comment above the block explains the re-apply, not the prune,
#      so no comment line goes with it.
#   E6 delete function pruneSwaps with its three-line comment (the false "baked into the stored week"
#      premise). The pruneDayEdits comment that cites pruneSwaps is slice 3's rewrite; left as is.
#   E7 the `_swapCut = _cut` writer's comment now says what the variable does: it carries the freeze
#      cut to pruneDayEdits and nothing else. The name _swapCut is kept (session's call).
#
# NO version bump in this slice (ia-version stays 221). The meta bump is the last replacement of the
# build and lands in slice 3.
# Slice 1's three lines are asserted present first. Every anchor is asserted count==1 on the pre-edit
# text before anything is written; the first miss aborts the whole script with the file untouched.
import re
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
BS = chr(92)

SLICE1 = [
    ('S1 applySwapChoice resnapshot',
     "  closeSwapSheet();\n"
     "  resnapshotDayEdit(currentWeek,currentDayKey);\n"
     "  openDetail(currentDayKey,day);\n"),
    ('S1 undoSwap resnapshot',
     "  clearSwap(activeProgId,currentWeek,currentDayKey,from);\n"
     "  resnapshotDayEdit(currentWeek,currentDayKey);\n"
     "  openDetail(currentDayKey,day);\n"),
    ('S1 resnapshotDayEdit comment',
     "// called only from the athlete's own edit handlers: add, skip, swap, undo, never from the\n"),
]

EDITS = [
    ('E4 logExerciseWeight first-touch snapshot',
     "  const w = week||currentWeek;\n"
     "  const dk = dayKey||(typeof currentDayKey!=='undefined'?currentDayKey:'')||'';\n"
     "  const entries = store[key].entries;\n",
     "  const w = week||currentWeek;\n"
     "  const dk = dayKey||(typeof currentDayKey!=='undefined'?currentDayKey:'')||'';\n"
     "  // V222 D181 (R2). The per-exercise Log is a first touch. D108 counts this ia_exw_ write\n"
     "  // as touching the day, so without a snapshot the day freezes with no record of what it\n"
     "  // was frozen ON. snapshotDay is first-touch-wins, so this is a no-op on a day already\n"
     "  // snapshotted, and it returns without writing when the day is not in the week.\n"
     "  if(dk) snapshotDay(w, dk);\n"
     "  const entries = store[key].entries;\n"),
    ('E5 pruneSwaps call',
     "    try{\n"
     "      if(typeof _swapCut==='number') pruneSwaps(prog.id,_swapCut);\n"
     "      const _sw=getSwaps(prog.id);\n"
     "      if(_sw&&Object.keys(_sw).length) applySessionSwaps(rebuilt,_sw);\n"
     "    }catch(e){}\n",
     "    try{\n"
     "      const _sw=getSwaps(prog.id);\n"
     "      if(_sw&&Object.keys(_sw).length) applySessionSwaps(rebuilt,_sw);\n"
     "    }catch(e){}\n"),
    ('E6 pruneSwaps function and comment',
     "// Prune swaps for weeks that have gone frozen — the swap is baked into the stored\n"
     "// week at that point, so keeping the record risks re-applying it against a week the\n"
     "// engine has since reshaped.\n"
     "function pruneSwaps(pid,cutWeek){\n"
     "  const s=getSwaps(pid); let changed=false;\n"
     "  Object.keys(s).forEach(k=>{const m=/^w(" + BS + "d+)_/.exec(k);if(m&&+m[1]<cutWeek){delete s[k];changed=true;}});\n"
     "  if(changed) saveSwaps(pid,s);\n"
     "}\n"
     "// ── COACH NUDGE ",
     "// ── COACH NUDGE "),
    ('E7 _swapCut writer comment',
     "        _swapCut = _cut;   // frozen weeks bake the swap in; the record is then dead weight\n",
     "        _swapCut = _cut;   // carries the freeze cut to pruneDayEdits at the end of refreshProgram, and nothing else\n"),
]


def die(msg):
    print('ABORT ' + msg + '; index.html not written')
    sys.exit(1)


def strip_comments(s):
    # line comments only when not inside a string/regex is overkill here; the scan below is for
    # identifiers that never appear in strings, so a plain // and /* */ strip is enough.
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return re.sub(r'(^|[^:' + BS + BS + r'"\'])//[^\n]*', r'\1', s)


src = open(P, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="221">') != 1:
    die('ia-version is not 221')

for label, text in SLICE1:
    n = src.count(text)
    if n != 1:
        die(label + ': slice 1 line count ' + str(n) + ' (want 1)')
if src.count('resnapshotDayEdit(currentWeek,currentDayKey);') != 3:
    die('slice 1: expected 3 resnapshotDayEdit call sites')

for label, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        die(label + ': anchor count ' + str(n) + ' (want 1)')
# A re-run aborts above: every one of the four old anchors is gone once applied.

out = src
for label, old, new in EDITS:
    if out.count(old) != 1:
        die(label + ': anchor count changed mid-script')
    out = out.replace(old, new, 1)
    print('OK ' + label)

code = strip_comments(out)
if code.count('pruneSwaps') != 0:
    die('pruneSwaps still in code after strip')
if code.count('snapshotDay(w, dk)') != 1:
    die('E4 call not present exactly once in code')
_sc_lines = [ln.strip() for ln in code.split('\n') if re.search(r'\b_swapCut\b', ln)]
if _sc_lines != ['let _swapCut=null;',
                 '_swapCut = _cut;',
                 "if(typeof _swapCut==='number') pruneDayEdits(prog.id,_swapCut);"]:
    die('_swapCut code sites are not exactly declaration, writer, pruneDayEdits reader: ' + repr(_sc_lines))
if out.count('<meta name="ia-version" content="221">') != 1:
    die('ia-version moved')

open(P, 'w', encoding='utf-8').write(out)
print('WROTE ' + P + ' (' + str(len(EDITS)) + ' edits, ia-version unchanged at 221)')
