#!/usr/bin/env python3
# V206 slice 4c — sabotage upkeep only (D109, coordinator-approved). Re-anchors tests/sabotage/v203.json
# M8 on the D109 form of the distance-based recovery-run detail line. D109 (tests/measure/v206_d109_table.txt)
# swept "recovery run — ${_mi} mi" to "recovery run. ${_mi} mi" and "4–5/10 effort — easy enough" to
# "4–5/10 effort, easy enough", so the V203-era anchor reads count 0 on V206 (NOT-APPLIED).
# Only M8's anchor, replacement and note move. The replacement is still the anchor minus the ceiling
# sentence, so the mutation M8 was written for is unchanged and trips the same g203 rows.
# Every raw-text anchor asserted count==1 before anything is written; abort on the first miss.
import json, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
P = ROOT + 'tests/sabotage/v203.json'
SRC = open(ROOT + 'index.html', encoding='utf-8').read()

def die(msg):
    sys.exit('ABORT: ' + msg)

OLD_ANCHOR = "detail = `${_pick.label} recovery run — ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;"
OLD_REPL   = "detail = `${_pick.label} recovery run — ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog}`;"
NEW_ANCHOR = "detail = `${_pick.label} recovery run. ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort, easy enough to talk, laugh, or argue freely. ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;"
NEW_REPL   = "detail = `${_pick.label} recovery run. ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort, easy enough to talk, laugh, or argue freely. ${_prog}`;"
CEILING = " Do not run faster than ${fmt(steadyCapSec(chartRow))}."
NOTE_TAIL = "run_base never reaches this branch, it has its own sentence."
NOTE_ADD = (" V206 UPKEEP (D109, coach-approved, not a change to D117): anchor and replacement are both re-sited on the"
    " D109 form of the distance-based recovery line ('recovery run. ${_mi} mi' and '4–5/10 effort, easy enough')."
    " The replacement keeps that form, so the ceiling sentence is still the ONLY thing this mutant removes and the"
    " named trip, the dose.cap rows that stay green and the expected collateral are all unchanged.")

# the mutation itself is unchanged: both pairs differ by exactly the ceiling sentence
if OLD_ANCHOR.replace(CEILING + '`;', '`;') != OLD_REPL: die('old pair is not anchor minus the ceiling sentence')
if NEW_ANCHOR.replace(CEILING + '`;', '`;') != NEW_REPL: die('new pair is not anchor minus the ceiling sentence')
if SRC.count(NEW_ANCHOR) != 1: die('new anchor count %d in index.html, want 1' % SRC.count(NEW_ANCHOR))
if SRC.count(OLD_ANCHOR) != 0: die('old anchor still in index.html')

raw = open(P, encoding='utf-8').read()
J = json.loads(raw)
m8 = [m for m in J if m.get('name', '').startswith('M8 ')]
if len(m8) != 1: die('M8 entries: %d' % len(m8))
m8 = m8[0]
if m8['anchor'] != OLD_ANCHOR or m8['replacement'] != OLD_REPL: die('M8 does not carry the V203-era pair')
if not m8['note'].endswith(NOTE_TAIL): die('M8 note tail moved')

enc = lambda s: json.dumps(s, ensure_ascii=False)
pairs = [(enc(OLD_ANCHOR), enc(NEW_ANCHOR)), (enc(OLD_REPL), enc(NEW_REPL)),
         (enc(m8['note']), enc(m8['note'] + NOTE_ADD))]
for old, new in pairs:
    if raw.count(old) != 1: die('raw anchor count %d, want 1: %s' % (raw.count(old), old[:80]))
out = raw
for old, new in pairs:
    out = out.replace(old, new, 1)

J2 = json.loads(out)
if len(J2) != len(J): die('mutation count moved')
for a, b in zip(J, J2):
    if a is m8: continue
    if a != b: die('a mutation other than M8 moved: %s' % a.get('name', '')[:40])
n8 = [m for m in J2 if m.get('name', '').startswith('M8 ')][0]
if (n8['anchor'], n8['replacement'], n8['gate'], n8['name']) != (NEW_ANCHOR, NEW_REPL, m8['gate'], m8['name']):
    die('M8 did not land as intended')
open(P, 'w', encoding='utf-8').write(out)
print('v203.json M8 re-anchored on the D109 form; %d mutations, only M8 moved' % len(J2))
