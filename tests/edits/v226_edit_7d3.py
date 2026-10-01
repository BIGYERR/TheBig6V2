#!/usr/bin/env python3
"""V226 build 5, slice 7d3: sabotage upkeep for D188 (tests only).

Ruling: tests/measure/v226_rulings/d188_d189_gate_amendment.md section (f).
  - v203 #3: RETIRE under D188 E10. Successor S8 in tests/sabotage/v226.json.
  - v225 #5: RE-KEY onto the full R3 line; the replacement keeps D188's
    beginner exemption so the fault stays "goal scoping dropped".

Edits the JSON by structure (json.loads -> mutate -> json.dumps in the file's
own round-tripping format). Every anchor and premise is asserted count==1 (or
the stated count) before anything is written; both files are written or
neither is.
"""
import json, os, shutil, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/builder_7d3'
CAND = os.path.join(ROOT, 'index.html')
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/base_v225.html'
V203 = os.path.join(ROOT, 'tests/sabotage/v203.json')
V225 = os.path.join(ROOT, 'tests/sabotage/v225.json')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def need(cond, msg):
    if not cond: die(msg)

def load(path):
    raw = open(path, encoding='utf-8').read()
    data = json.loads(raw)
    fmts = []
    for ind in (1, 2, 4):
        for ea in (False, True):
            for nl in ('', '\n'):
                if json.dumps(data, indent=ind, ensure_ascii=ea) + nl == raw:
                    fmts.append((ind, ea, nl))
    need(len(fmts) >= 1, path + ': no json.dumps format round-trips the file byte-for-byte')
    return raw, data, fmts[0]

def dump(data, fmt):
    ind, ea, nl = fmt
    return json.dumps(data, indent=ind, ensure_ascii=ea) + nl

def one_row(rows, key, val, label):
    hits = [i for i, r in enumerate(rows) if r.get(key) == val]
    need(len(hits) == 1, label + ': expected exactly 1 row with ' + key + ' match, got ' + str(len(hits)))
    return hits[0]

cand = open(CAND, encoding='utf-8').read()
base = open(BASE, encoding='utf-8').read()

# ---------------------------------------------------------------- v203 #3
V203_3_ANCHOR = "Run paces${s.runAnchor.kind!=='beginner'?"
need(base.count(V203_3_ANCHOR) == 1, 'premise: v203 #3 anchor live at V225 (count ' + str(base.count(V203_3_ANCHOR)) + ')')
need(cand.count(V203_3_ANCHOR) == 0, 'premise: v203 #3 anchor gone at V226 (count ' + str(cand.count(V203_3_ANCHOR)) + ')')

raw203, d203, fmt203 = load(V203)
need(isinstance(d203, list), 'v203.json is not a top-level array')
i3 = one_row(d203, 'anchor', V203_3_ANCHOR, 'v203 #3')
need(i3 == 2, 'v203 #3 is not at 1-based index 3 (found ' + str(i3 + 1) + ')')
need(d203[i3]['name'].startswith('M3 -> the beginner exclusion is dropped from the pencil'), 'v203 #3 name mismatch')
need(d203[i3]['gate'] == 'gates/g203_mile_pencil.js', 'v203 #3 gate mismatch')
i2 = one_row(d203, 'anchor', d203[1]['anchor'], 'v203 #2 carrier')
need(i2 == 1 and d203[i2]['name'].startswith('M2 -> '), 'v203 carrier is not M2')
need(d203[i2]['gate'] == 'gates/g203_mile_pencil.js', 'v203 carrier is not on the same gate')
need('RETIRED AT V226' not in d203[i2]['note'], 'v203 carrier already carries the retirement (re-run?)')

RETIRE_203 = (" RETIRED AT V226 (D188 E10): M3, the sibling mutation on this same gate, is gone from this spec. "
  "It rewrote `Run paces${s.runAnchor.kind!=='beginner'?` to `Run paces${true?`, dropping the beginner exclusion from the pencil. "
  "D188 E10 makes the pencil unconditional, so that anchor occurs 0 times in the V226 candidate (it read NOT-APPLIED there) "
  "and the fault M3 planted, a beginner seeing the pencil, is now the ruled behaviour; section 4 of gates/g203_mile_pencil.js "
  "carries a D188 era row (beginner experience, 1 pencil) in its place. Its successor is S8 in tests/sabotage/v226.json, "
  "which hides the pencil on `exp` (`s.runAnchor.exp!=='beginner'`) and trips g226_d188 G4. "
  "WHAT WOULD MAKE M3 LIVE AGAIN: any ruling that puts a beginner exclusion back on the pencil, at which point a beginner's "
  "pencil count is observable as 0 again. Restore it then, against whichever gate row owns the beginner pencil count.")

d203[i2]['note'] = d203[i2]['note'] + RETIRE_203
del d203[i3]
need(len(d203) == 14, 'v203 should keep 14 rows after retirement, has ' + str(len(d203)))
need(not any(r.get('anchor') == V203_3_ANCHOR for r in d203), 'v203 #3 still present')
out203 = dump(d203, fmt203)

# ---------------------------------------------------------------- v225 #5
V225_5_OLD = "if(g.id==='run_pace_goal') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};"
V225_5_OLD_REPL = "return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};"
V225_5_NEW = "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};"
V225_5_NEW_REPL = "if(exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};"
need(base.count(V225_5_OLD) == 1, 'premise: v225 #5 old anchor live at V225')
need(cand.count(V225_5_OLD) == 0, 'premise: v225 #5 old anchor gone at V226')
need(cand.count(V225_5_NEW) == 1, 'v225 #5 new anchor count==1 in candidate (got ' + str(cand.count(V225_5_NEW)) + ')')
need(V225_5_NEW_REPL != V225_5_NEW, 'v225 #5 replacement is a no-op')
need(cand.count(V225_5_NEW_REPL) == 0, 'v225 #5 replacement line must not already exist in the candidate (got ' + str(cand.count(V225_5_NEW_REPL)) + ')')

raw225, d225, fmt225 = load(V225)
need(isinstance(d225, list), 'v225.json is not a top-level array')
i5 = one_row(d225, 'anchor', V225_5_OLD, 'v225 #5')
need(i5 == 4, 'v225 #5 is not at 1-based index 5 (found ' + str(i5 + 1) + ')')
need(d225[i5]['name'].startswith("M5 -> D187 R3's goal-scoping dropped"), 'v225 #5 name mismatch')
need(d225[i5]['gate'] == 'gates/g225_d187_pacerate.js', 'v225 #5 gate mismatch')
need(d225[i5]['replacement'] == V225_5_OLD_REPL, 'v225 #5 replacement is not the V225 form')
need('V226 UPKEEP' not in d225[i5]['note'], 'v225 #5 already carries the upkeep (re-run?)')

UPKEEP_225 = (" V226 UPKEEP (D188, not a change to D187 R3): D188 E6 folded the beginner exemption into the R3 line itself, "
  "so the V225 anchor `if(g.id==='run_pace_goal') return ...` occurs 0 times at V226 and read NOT-APPLIED. "
  "The anchor is re-sited on the full R3 line `if(g.id==='run_pace_goal' && exp!=='beginner') return ...` and the replacement "
  "drops ONLY the goal scoping, keeping `exp!=='beginner'`, so the fault is still exactly 'goal scoping dropped' and D188's "
  "beginner exemption survives the mutant. The 'beginner check sits one line above' clause above describes V225; at V226 it is "
  "the second conjunct of this same line. g226_d188 G3 beginner blank mile stays GREEN by design, because the exemption is kept. "
  "Observed on V226 with the V225 baseline as argv[3]: control PASS 10 FAIL 0, mutant PASS 9 FAIL 1 naming only "
  "'MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected'. Under sabotage.py, which passes no baseline, "
  "CONFINEMENT fails closed on the control and the mutant alike, so read this row's discrimination from the named "
  "MILE-REQUIRED row and not from the trip count. EXPECTED unchanged: MILE-REQUIRED non-beginner NON-pace run goal only.")

d225[i5]['anchor'] = V225_5_NEW
d225[i5]['replacement'] = V225_5_NEW_REPL
d225[i5]['note'] = d225[i5]['note'] + UPKEEP_225
need(len(d225) == 5, 'v225 row count changed')
out225 = dump(d225, fmt225)

# ---------------------------------------------------------------- write all or none
need(out203 != raw203 and out225 != raw225, 'an edit produced no change')
os.makedirs(SCRATCH, exist_ok=True)
shutil.copyfile(V203, os.path.join(SCRATCH, 'v203.json.pre7d3'))
shutil.copyfile(V225, os.path.join(SCRATCH, 'v225.json.pre7d3'))
try:
    open(V203, 'w', encoding='utf-8').write(out203)
    open(V225, 'w', encoding='utf-8').write(out225)
except Exception as e:
    shutil.copyfile(os.path.join(SCRATCH, 'v203.json.pre7d3'), V203)
    shutil.copyfile(os.path.join(SCRATCH, 'v225.json.pre7d3'), V225)
    die('write failed, both files restored: ' + repr(e))
print('OK v203: retired #3 (14 rows remain, note on M2); v225: re-keyed #5. formats', fmt203, fmt225)
