#!/usr/bin/env python3
# V209 close 2 — two test-only upkeep edits after gatekeeper's V209 run. No index.html change.
#   1. tests/sabotage/v193_b1b_carveout.json S21: its anchor was _longRunTier's old two-line guard
#      (NRC-only), which D140 rewrote, so S21 went NOT-APPLIED. Re-anchored on the new first guard
#      `  if(!cardio || !cardio.dose) return null;` (count 1 in V209) with the same `return 'B'`
#      intent: every day is a long run, so g193_budget_floor B1b's carve-out swallows the whole
#      assertion and B1b must still go red. "why" gains a V209 UPKEEP (D140) sentence.
#   2. tests/gates/g208_d103a_chip.js B3: its pair predicate accepted ANY ia-version 208 baseline,
#      so the shipped V208 run against itself read every frozen INT/CHI as SI/LI through the
#      baseline's own slice-3 reader and found only the trial move (48 "trial: RUN -> TEST").
#      B3's premise is a baseline whose chip reader predates slice 3. It now runs only when the
#      baseline's source still carries slice 3's own E1 anchor, the one-argument
#      `function runSessionCode(sub){` (V207, or the V208 pre-slice tree), and SKIPs BY NAME
#      otherwise (standing ruling 4). C2 and D1 keep BASE_OK unchanged.
# JSON is edited as text (json.dumps of the exact old value, count==1) so the other entry keeps its
# bytes, then re-parsed. Every anchor asserted count==1 before anything is written.
import sys, json, pathlib

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')
def die(m): print('ABORT ' + m); sys.exit(1)

# ── 1. S21 ────────────────────────────────────────────────────────────────────────────
SP = ROOT / 'tests/sabotage/v193_b1b_carveout.json'
stxt = SP.read_text(encoding='utf-8')
spec = json.loads(stxt)
s21 = [e for e in spec if e.get('name', '').startswith('S21 ')]
if len(s21) != 1: die('S21 entries: %d' % len(s21))
s21 = s21[0]
OLD_ANCHOR = "  if(!cardio || !cardio.isNRC || !cardio.dose) return null;\n  if(!/^long run/i.test(cardio.subtype||'')) return null;"
NEW_ANCHOR = "  if(!cardio || !cardio.dose) return null;"
if s21['anchor'] != OLD_ANCHOR or s21['replacement'] != "  return 'B';": die('S21 is not the entry this upkeep was written for')
idx = (ROOT / 'index.html').read_text(encoding='utf-8')
if idx.count(NEW_ANCHOR) != 1: die('new S21 anchor count %d in index.html' % idx.count(NEW_ANCHOR))
if idx.count(OLD_ANCHOR) != 0: die('old S21 anchor still present in index.html')
NEW_WHY = (s21['why'] + " V209 UPKEEP (D140): D140's NSW limb rewrote _longRunTier's two-line NRC-only guard,"
           " so the old anchor went NOT-APPLIED. Re-anchored on the new first guard,"
           " `  if(!cardio || !cardio.dose) return null;`, with the same `return 'B'` intent: every day"
           " is still a long run and B1b must still go red.")
S_EDITS = [(json.dumps(OLD_ANCHOR, ensure_ascii=False), json.dumps(NEW_ANCHOR, ensure_ascii=False)),
           (json.dumps(s21['why'], ensure_ascii=False), json.dumps(NEW_WHY, ensure_ascii=False))]
for i, (o, n) in enumerate(S_EDITS, 1):
    if stxt.count(o) != 1: die('S21 text edit %d: count %d' % (i, stxt.count(o)))
    stxt = stxt.replace(o, n, 1)
chk = json.loads(stxt)
if [e for e in chk if e['name'].startswith('S21 ')][0]['anchor'] != NEW_ANCHOR or len(chk) != len(spec): die('S21 re-parse mismatch')

# ── 2. chip B3 ────────────────────────────────────────────────────────────────────────
GP = ROOT / 'tests/gates/g208_d103a_chip.js'
gtxt = GP.read_text(encoding='utf-8')
G_EDITS = [
("// Rows reading a baseline (argv[3]) run when the baseline is V207 or the V208 pre-slice tree.\n",
 "// Rows reading a baseline (argv[3]) run when the baseline is V207 or the V208 pre-slice tree.\n"
 "// B3 needs more than the version: its premise is a baseline whose chip reader PREDATES slice 3, so it\n"
 "// runs only when the baseline's source still carries slice 3's own E1 anchor, the one-argument\n"
 "// `function runSessionCode(sub){` (V207, or the V208 pre-slice tree). Against a baseline that already\n"
 "// carries slice 3 (the shipped V208) the baseline reads every frozen INT/CHI as SI/LI itself and only\n"
 "// the trial moves, so B3 SKIPs by name there (V209 UPKEEP, gatekeeper).\n"),
("const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';\n",
 "const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';\n"
 "const BASE_PRE_S3 = !!BASEFILE && /function runSessionCode\\(sub\\)\\{/.test(require('fs').readFileSync(BASEFILE, 'utf8'));\n"
 "const B3_OK = BASE_OK && BASE_PRE_S3;\n"
 "const B3_WHY = !BASE_OK ? BASE_WHY : 'baseline ia-version ' + IB.version + ' already carries slice 3\\'s runSessionCode(sub, key), so it is not the pre-slice tree B3 was written against';\n"),
("  if(!BASE_OK) skip('B3 ' + BASE_WHY);\n",
 "  if(!B3_OK) skip('B3 ' + B3_WHY);\n"),
]
for i, (o, n) in enumerate(G_EDITS, 1):
    if gtxt.count(o) != 1: die('chip edit %d: count %d: %r' % (i, gtxt.count(o), o[:70]))
    gtxt = gtxt.replace(o, n, 1)

SP.write_text(stxt, encoding='utf-8'); print('wrote tests/sabotage/v193_b1b_carveout.json (S21 re-anchored)')
GP.write_text(gtxt, encoding='utf-8'); print('wrote tests/gates/g208_d103a_chip.js (B3 pair predicate)')
