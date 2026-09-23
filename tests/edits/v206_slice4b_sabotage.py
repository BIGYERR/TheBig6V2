#!/usr/bin/env python3
# V206 slice 4b — sabotage specs only (D109). Touches tests/sabotage/v202.json (M7, M24 re-anchor,
# coach-approved upkeep) and writes tests/sabotage/v206_d109.json. Every anchor asserted count==1
# against the CURRENT index.html before anything is written; abort on the first miss.
import json, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
SRC = open(ROOT + 'index.html', encoding='utf-8').read()

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def one(s, label):
    n = SRC.count(s)
    if n != 1: die(f'{label} anchor count {n} in index.html, want 1: |{s[:90]}|')
    print(f'ok   {label} anchor count 1')

# ── v202.json M7 / M24 ────────────────────────────────────────────────────────
M7_OLD_ANCHOR = "            note = `INT — Interval: Pace moves ${pp._weeklyGain} seconds per mile each week. That is the safe rate for your experience and age. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;"
M7_NEW_ANCHOR = "            note = `INT: Pace moves ${pp._weeklyGain} seconds per mile each week. That is the safe rate for your experience and age. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;"
M7_NOTE_TAIL = "B2 stays GREEN, and that is the sharpest thing about this mutant: HALF_MANNY's digest cannot see it."
M7_NOTE_ADD = (" V206 UPKEEP (D109, coach-approved, not a change to E4): the anchor is re-sited on the 'INT: ' head D109 ruled."
    " The replacement is unchanged, so the revert now also restores the old 'INT — Interval:' label. C1's first miss still begins"
    " 'W1 reads |INT — Interval: Pace capped at'. C3 goes red on both dashes, because from ia-version 206 no label is exempt.")

M24_OLD_ANCHOR = "          } else {\n            note = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';\n          }\n          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about"
M24_OLD_REPL   = "          } else {\n            note = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 10. Quality over quantity. If pace drops, stop.';\n          }\n          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about"
M24_NEW_ANCHOR = M24_OLD_ANCHOR.replace("note = 'INT — Interval: Zone 5", "note = 'INT: Zone 5")
M24_NEW_REPL   = M24_OLD_REPL.replace("note = 'INT — Interval: Zone 5", "note = 'INT: Zone 5")
assert M24_NEW_ANCHOR != M24_OLD_ANCHOR and M24_NEW_REPL != M24_OLD_REPL
assert 'Hard cap at 10' in M24_NEW_REPL and "'INT: Zone 5" in M24_NEW_REPL and 'Build from 4 reps to 8.' in M24_NEW_REPL
M24_NOTE_TAIL = "This mutation is why the set replacement is asserted as a count, not as four independent anchors."
M24_NOTE_ADD = (" V206 UPKEEP (D109, coach-approved, not a change to D9): anchor and replacement are both re-sited on the"
    " 'INT: ' head D109 ruled. The replacement keeps that head, so the cap is still the ONLY thing this mutant changes."
    " D9 reads 4 -> 3 ruled, 0 legacy, 0 in another era's form. D9c stays GREEN because the mutant carries no dash.")

one(M7_NEW_ANCHOR, 'v202 M7')
one(M24_NEW_ANCHOR, 'v202 M24')

P202 = ROOT + 'tests/sabotage/v202.json'
raw = open(P202, encoding='utf-8').read()
d = json.loads(raw)
if not d[6]['name'].startswith('M7 ->') or not d[23]['name'].startswith('M24 ->'):
    die('v202.json index 6/23 are not M7/M24')
if d[6]['anchor'] != M7_OLD_ANCHOR: die('v202 M7 current anchor is not the V202 form')
if d[23]['anchor'] != M24_OLD_ANCHOR or d[23]['replacement'] != M24_OLD_REPL: die('v202 M24 current anchor/replacement not the V202 form')
if not d[6]['note'].endswith(M7_NOTE_TAIL) or not d[23]['note'].endswith(M24_NOTE_TAIL): die('M7/M24 note tails moved')

def enc(s):
    a = json.dumps(s, ensure_ascii=False)
    return a if raw.count(a) >= 1 else json.dumps(s)
subs = [
    (d[6]['anchor'], M7_NEW_ANCHOR, 'M7 anchor'),
    (d[6]['note'], d[6]['note'] + M7_NOTE_ADD, 'M7 note'),
    (d[23]['anchor'], M24_NEW_ANCHOR, 'M24 anchor'),
    (d[23]['replacement'], M24_NEW_REPL, 'M24 replacement'),
    (d[23]['note'], d[23]['note'] + M24_NOTE_ADD, 'M24 note'),
]
for old, new, label in subs:
    eo = enc(old)
    ascii_mode = eo != json.dumps(old, ensure_ascii=False)
    en = json.dumps(new) if ascii_mode else json.dumps(new, ensure_ascii=False)
    n = raw.count(eo)
    if n != 1: die(f'v202.json {label} encoded count {n}, want 1')
    raw = raw.replace(eo, en)
    print(f'ok   v202.json {label} re-written ({"ascii" if ascii_mode else "literal"} encoding)')
d2 = json.loads(raw)
assert d2[6]['anchor'] == M7_NEW_ANCHOR and d2[6]['replacement'] == d[6]['replacement']
assert d2[23]['anchor'] == M24_NEW_ANCHOR and d2[23]['replacement'] == M24_NEW_REPL
assert [m['anchor'] for i, m in enumerate(d2) if i not in (6, 23)] == [m['anchor'] for i, m in enumerate(d) if i not in (6, 23)]
assert len(d2) == len(d) == 26

# ── v206_d109.json ────────────────────────────────────────────────────────────
A_ANCHOR = "m:400, tgt:Math.round(_chartRow.fiveK)};\n        note = 'INT: Zone 5 (95%+ max HR) on work efforts."
A_REPL   = "m:400, tgt:Math.round(_chartRow.fiveK)};\n        note = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts."
B_ANCHOR = ("Strides keep your legs fast while the engine builds.';\n      note = 'EASY RUN: The aerobic engine builds at conversational effort."
    " Time in the zone is the dose, not miles and not speed. If it feels almost too easy, it is working.' + (isCardioCutbackWeek(week, tw) ?"
    " ' CUTBACK WEEK: less time on purpose this week so the training absorbs. Same effort. Do not add minutes.' : '');")
B_REPL = B_ANCHOR.replace("Do not add minutes.' : '');", "Do not add minutes. Trust the cutback — it is the plan.' : '');")
C_ANCHOR = "note = 'LSD: Recovery and base building. These runs feel almost too easy. That is correct. Do not push the pace here.';"
C_REPL   = "note = '';"
D_ANCHOR = "note = `INT: Pace moves ${pp._weeklyGain} seconds per mile each week."
D_REPL   = "note = `INT — Interval: Pace moves ${pp._weeklyGain} seconds per mile each week."
assert B_REPL != B_ANCHOR
for s, l in ((A_ANCHOR, 'v206 M1'), (B_ANCHOR, 'v206 M2'), (C_ANCHOR, 'v206 M3'), (D_ANCHOR, 'v206 M4')):
    one(s, l)

spec = [
  {
    "name": "M1 -> one of the four generic INT notes takes the old label back: the test goal copy (mile and 1.5 mile under ten) reads 'INT — Interval: Zone 5' again. The other three read the D109 head, and D9b's generic pace cfg never reaches this limb, so only a source count can see it",
    "anchor": A_ANCHOR,
    "replacement": A_REPL,
    "gate": "gates/g202_int_doctrine.js",
    "note": "NAMED TRIP: g202_int_doctrine D9. The source count falls 4 -> 3 on the D109 head, and 0 -> 1 in another era's form (the V202 head plus the ruled tail). That second count is the reason the D9 era row carries srcOther, and this mutation is what proves it. D9b, D9c and D9d stay GREEN: the generic pace cfg renders the progression path copy (the one v202 M24 mutates), not this one. EXPECTED: D9 only. OUTSIDE THE NAMED GATE (the sweep does not run it): g206_d109_copy S-run and T-run (#22 new 3/4, old 1) would also go red. The sweep does not run that gate, so this is disclosed, not proven."
  },
  {
    "name": "M2 -> new copy puts an em-dash back into a run note without touching any table text: the run_base cutback easy run note gains 'Trust the cutback — it is the plan.' after the ruled sentence. Every table entry still sits its @@ n times and no old text returns, so the T row cannot see it",
    "anchor": B_ANCHOR,
    "replacement": B_REPL,
    "gate": "gates/g206_d109_copy.js",
    "note": "NAMED TRIP: S-run (one em-dash line in buildRunSession) and R-run_base (the run_base cutback weeks render the note). T-run stays GREEN: entry 9 still reads 2/2 and its old text 0. That is what separates this from M3. It proves S and R defend copy the table does not know about. The other R rows stay GREEN, because the branch is run_base only. EXPECTED: S-run, R-run_base."
  },
  {
    "name": "M3 -> a ruled note is deleted instead of rewritten: the non base easy run note in buildRunSession becomes empty. An empty string carries no dash, so every copy rule predicate passes it",
    "anchor": C_ANCHOR,
    "replacement": C_REPL,
    "gate": "gates/g206_d109_copy.js",
    "note": "NAMED TRIP: T-run, entry 14 reads new 0/1. This is the row the gate header names as the thing that stops a deletion passing. S-run stays GREEN because no dash is added, and the body still carries literals. Every R row stays GREEN because R skips an empty note rather than auditing it. EXPECTED: T-run only."
  },
  {
    "name": "M4 -> the pace clock note keeps D101's sentence and restores only the old head: 'INT — Interval: Pace moves ...'. The body is still E4's ruled sentence and it is still a rate, not a cap, so a partial revert of D109 leaves nothing wrong except the label dash",
    "anchor": D_ANCHOR,
    "replacement": D_REPL,
    "gate": "gates/g202_pace_copy.js",
    "note": "NAMED TRIP: C1. At ia-version 206 the era row's ruled head is 'INT: ', so every dampened note misses and the first miss reads |INT — Interval: Pace moves|. C3 goes red with it because V206 retires the label exemption and the note now carries a dash. C1a stays GREEN (the regex still matches 'Pace moves', so the branch is still exercised), and C2 stays GREEN (no physiological claim). That is what separates this from v202 M7, which reverts the whole sentence and reddens C2. The limb classes stay GREEN, because limbOf still reads 'dampened'. EXPECTED: C1, C3."
  }
]
P206 = ROOT + 'tests/sabotage/v206_d109.json'
out = json.dumps(spec, indent=2, ensure_ascii=False) + '\n'
json.loads(out)
open(P202, 'w', encoding='utf-8').write(raw)
open(P206, 'w', encoding='utf-8').write(out)
print('WROTE', P202, P206)
