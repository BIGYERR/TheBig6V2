#!/usr/bin/env python3
"""V226 slice 7d2: tests/sabotage/v202.json upkeep under D188/D189.

Ruling: tests/measure/v226_rulings/d188_d189_gate_amendment.md section (f), v202 lines.
  #2  RETIRE under D188 E4 (shipped after-state is its replacement; S1 in v226.json is its inverse)
  #8  RE-KEY on the full four-line runAnchorSentence tail ternary; replacement unchanged; must trip C8
  #9  RE-KEY on the F10 scope line; replacement unchanged; must trip C9
  #11 RETIRE under D189 F10 (beginner takes the scope on card and clipboard alike); successor S20

The JSON is edited by STRUCTURE (load, mutate the list, dump), never by string splice.
The dump format is proven to round-trip the original byte for byte before anything is
changed, so the only diff is the structural one. All or none: every assertion runs
before the single write.
"""
import json, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SPEC = ROOT + '/tests/sabotage/v202.json'
HTML = ROOT + '/index.html'

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def dump(d):
    return json.dumps(d, indent=2, ensure_ascii=False) + '\n'

raw = open(SPEC, encoding='utf-8').read()
src = open(HTML, encoding='utf-8').read()
muts = json.loads(raw)
if dump(muts) != raw:
    die('v202.json does not round-trip at indent=2 ensure_ascii=False; a structural dump would reformat it')
if len(muts) != 26:
    die('expected 26 rows in v202.json, found %d' % len(muts))

# ---- old anchors, each identifying exactly one row ----------------------------------
OLD_M1  = '    buildRunProgressionForLength._initialPace  = rowPaceAt(_chartRow, rawTargetDist);'
OLD_M2  = "  const _mileBestSecs = (experience !== 'beginner' && arguments[12]) ? arguments[12] : null;"
OLD_M8  = ("  const tail = (a.goalId === 'run_pace_goal')\n"
           "    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'\n"
           "    : ' Every pace in this program comes from this row.';")
OLD_M9  = "  const scope = (a.goalId === 'run_pace_goal' && a.kind !== 'beginner') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';"
OLD_M11 = "(a.goalId === 'run_pace_goal' && a.kind !== 'beginner')"

# ---- new anchors, as index.html reads at 226 -----------------------------------------
NEW_M8 = ("  const tail = (a.goalId === 'run_pace_goal')\n"
          "    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'\n"
          "    : (a.goalId === 'run_base') ? ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'\n"
          "    : ' Every pace in this program comes from this row.';")
REP_M8 = "  const tail = ' Every pace in this program comes from this row.';"
NEW_M9 = "  const scope = (a.goalId === 'run_pace_goal') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';"
REP_M9 = "  const scope = '';"
SHIPPED_E4 = "  const _mileBestSecs = arguments[12] ? arguments[12] : null;"

def row(anchor, label):
    hits = [i for i, m in enumerate(muts) if m.get('anchor') == anchor]
    if len(hits) != 1:
        die('%s: expected exactly one row with its anchor, found %d' % (label, len(hits)))
    return hits[0]

i1, i2, i8, i9, i11 = (row(OLD_M1, 'M1'), row(OLD_M2, 'M2'), row(OLD_M8, 'M8'),
                       row(OLD_M9, 'M9'), row(OLD_M11, 'M11'))
for i, pfx in ((i1, 'M1 ->'), (i2, 'M2 ->'), (i8, 'M8 ->'), (i9, 'M9 ->'), (i11, 'M11 ->')):
    if not muts[i]['name'].startswith(pfx):
        die('row %d name does not start %r' % (i + 1, pfx))
# measure's 1-based numbering
if (i2 + 1, i8 + 1, i9 + 1, i11 + 1) != (2, 8, 9, 11):
    die('row numbering differs from measure map: %r' % ((i2 + 1, i8 + 1, i9 + 1, i11 + 1),))

# ---- premises against the candidate --------------------------------------------------
for a, label in ((OLD_M2, 'M2 old'), (OLD_M8, 'M8 old'), (OLD_M9, 'M9 old'), (OLD_M11, 'M11 old')):
    if src.count(a) != 0:
        die('%s anchor still present in index.html (count %d); premise refuted' % (label, src.count(a)))
for a, label in ((NEW_M8, 'M8 new'), (NEW_M9, 'M9 new'), (SHIPPED_E4, 'E4 shipped'), (OLD_M1, 'M1 host')):
    if src.count(a) != 1:
        die('%s anchor count %d in index.html, need 1' % (label, src.count(a)))
for a, r, label in ((NEW_M8, REP_M8, 'M8'), (NEW_M9, REP_M9, 'M9')):
    if src.replace(a, r) == src:
        die('%s re-keyed mutation is a no-op' % label)
if muts[i8]['replacement'] != REP_M8 or muts[i9]['replacement'] != REP_M9:
    die('M8/M9 replacement is not the one the ruling says stays unchanged')
for i in (i1, i8, i9):
    if 'V226' in muts[i]['note']:
        die('row %d already carries a V226 sentence; script already ran' % (i + 1))

# ---- notes ---------------------------------------------------------------------------
RET_M2 = (" RETIRED AT V226 SLICE 7D2: M2, the sibling mutation on the entered mile read, is gone"
          " from this spec. It dropped the beginner guard from _mileBestSecs so that a beginner's"
          " typed mile would win over the 690 default. D188 E4 shipped exactly that as the ruled"
          " after-state ('const _mileBestSecs = arguments[12] ? arguments[12] : null;', a"
          " beginner's entry is read like anyone's), so its anchor reads count 0 and its fault is"
          " now the build. Its inverse is S1 in tests/sabotage/v226.json, which puts the guard back"
          " and trips G1g, G1c and G1d. WHAT WOULD MAKE M2 LIVE AGAIN: any ruling that again denies"
          " a beginner the entered mile, at which point the guard returns to the source and"
          " dropping it is a defect again.")
UPK_M8 = (" V226 UPKEEP (D188/D189): the three-line tail ternary this row anchored on no longer"
          " exists (count 0, NOT-APPLIED). The D188/D189 build gave run_base its own tail, so the"
          " ternary is now four lines with a run_base middle branch. Re-keyed on the full"
          " four-line ternary (count 1) per the V226 gate amendment (f); the replacement is"
          " unchanged, so the card again tells every goal the program-wide claim. That also"
          " drops run_base's own tail, which is the same fault on one more goal; its ruled"
          " collateral is G7a in the g226 gates, not a row here. D189 F10 gave the beginner the"
          " week-1 scope, so the run_pace_goal set is now all six provenance forms, not five."
          " Amendment (f) names C8 as the row this mutation must trip. Re-verified at 226: C8"
          " red with 6 bad, first 'run_pace_goal/entered/intermediate: card false line true'; C7"
          " red with 6 bad, first run_pace_goal/entered/intermediate; C4 red. C5, C6, C9 and"
          " C1..C3 stay GREEN. EXPECTED: C4 C7 C8.")
UPK_M9 = (" V226 UPKEEP (D188/D189): D189 F10 dropped \"&& a.kind !== 'beginner'\" from this"
          " scope test, so the old anchor reads count 0 (NOT-APPLIED). Re-keyed on the F10 line"
          " as it now reads (count 1) per the V226 gate amendment (f); the replacement"
          " \"  const scope = '';\" is unchanged. Re-verified at 226: C9 red on the pinned"
          " clipboard line; C8 red with 6 bad, first 'run_pace_goal/entered/intermediate: card"
          " true line false' (six forms now, the beginner included, since F10 gives the beginner"
          " the scope). C4..C7 stay GREEN. EXPECTED: C8 C9."
          " RETIRED AT V226 SLICE 7D2: M11, the sibling mutation on this same line, is gone from"
          " this spec. It dropped \"&& a.kind !== 'beginner'\" from this scope test to show a"
          " beginner's clipboard taking a scope the beginner's card did not. D189 F10 shipped"
          " exactly that as the ruled after-state: a beginner now takes the scope on card and"
          " clipboard alike, so M11's anchor reads count 0 and its fault is now the build. Its"
          " successor is S20 in tests/sabotage/v226.json, which puts the beginner exclusion back"
          " on the clipboard keyed on a.exp and trips G7b beginner run_pace_goal. WHAT WOULD MAKE"
          " M11 LIVE AGAIN: any ruling that again withholds the week-1 scope from a beginner's"
          " card, at which point the exclusion returns to the source and dropping it from the"
          " clipboard alone is a defect again.")

muts[i1]['note'] = muts[i1]['note'] + RET_M2
muts[i8]['anchor'] = NEW_M8
muts[i8]['note'] = muts[i8]['note'] + UPK_M8
muts[i9]['anchor'] = NEW_M9
muts[i9]['note'] = muts[i9]['note'] + UPK_M9
# retirements last, highest index first so the earlier index stays valid
for i in sorted((i2, i11), reverse=True):
    del muts[i]

if len(muts) != 24:
    die('expected 24 rows after retirement, have %d' % len(muts))
for m in muts:
    if src.count(m['anchor']) != 1:
        die('post-edit anchor count %d for %r' % (src.count(m['anchor']), m['name'][:60]))

open(SPEC, 'w', encoding='utf-8').write(dump(muts))
print('OK v202.json: 26 -> 24 rows; re-keyed M8, M9; retired M2 (note on M1), M11 (note on M9)')
