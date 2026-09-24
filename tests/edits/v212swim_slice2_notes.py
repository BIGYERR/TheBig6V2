#!/usr/bin/env python3
# V212 slice 2 — D110a swim notes (coach ruled). Runs on the slice 1 tree (v212swim_slice1_clock.py).
#   F   S2b fix (coach ruled after slice 1): _baseEntered = baseMins entered AND bTotal > 0. The
#       slice 1 text was also true for an entered 0:00, which the engine treats as blank (it keeps
#       the experience default), so that athlete would not be told. bTotal is block scoped in the
#       base reader, so the same sum is written inline here.
#   S4a, S4b, S5/S7/S8, S5b: VERBATIM from coach's surgery (scratchpad d110_grid2.js), applied in
#       the surgery's order. S5b's anchor is S4a's output, so they are one site in the file: the
#       note block (anchor line, reach split, goal met / dampened / default limbs) is S4a + S5/S7/S8
#       + S5b, and the distance goal note is S4b. Three sites, five replacements.
# No ia-version bump. Aborts on the first anchor miss, before writing anything.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

EDITS = [
 ('F S2b _baseEntered',
  "swimPace._baseEntered = initialPace100 !== expPace100 || (swimGoal.baseMins !== undefined && swimGoal.baseMins !== '');",
  "swimPace._baseEntered = swimGoal.baseMins !== undefined && swimGoal.baseMins !== '' && ((+swimGoal.baseMins||0)*60 + (+swimGoal.baseSecs||0)) > 0;"),
 ('S4a copy',
  "note = 'INT: 100 repeats at your target split. Start at 4, build to 10. Hard cap at 10. If your split slips, end the session. Consistency between reps matters.';",
  "note = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';"),
 ('S4b copy',
  "note = 'INT: 100 yard repeats. Start at 4, build to 10. Hard cap at 10. If pace drops significantly, end the session. Consistency between reps matters.';",
  "note = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8. If pace drops significantly, end the session. Consistency between reps matters.';"),
 ('S5/S7/S8 notes',
  "      if(swimPace._dampened) {\n        note = `INT: Split capped at +${swimPace._weeklyGain}s/100/week (safe progression limit). Full goal of ${fmt(swimPace._originalTarget)}/100 needs more time. The realistic target for this block is ${fmt(swimPace._realisticTarget)}/100. Hit the prescribed split precisely.`;\n      } else {",
  "      const _anchorLine = swimPace._baseEntered ? '' : `No current ${swimPace._dist}${u} time was entered. This split starts from the ${exp} default of ${fmt(swimPace._expDefault)}/100, not from your own time. `;\n      const _reachSplit = (_qph && _qph.intSpan) ? swimPace[Math.min(_qph.intSpan, tw) - 1] : swimPace._realisticTarget;\n      if(swimPace._goalMet) {\n        note = _anchorLine + 'INT: Your goal split is already within your current split. This block holds your split and builds your reps.';\n      } else if(swimPace._dampened) {\n        note = _anchorLine + `INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. That is the safe rate for your experience and age. Your full goal of ${fmt(swimPace._originalTarget)}/100 needs more weeks than this block has. The target for this block is ${fmt(_reachSplit)}/100. Hit the prescribed split precisely.`;\n      } else {\n        note = _anchorLine;"),
 ('S5b else-tail',
  "        note = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';\n      }",
  "        note += 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';\n      }"),
]

src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
if src.count('const intPace = weekPace - 2;') != 1:
    print('ABORT: slice 1 (v212swim_slice1_clock.py) is not on the tree'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        print('ABORT:', tag, 'anchor count', n); sys.exit(1)
    src = src.replace(a, b, 1)
    print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
