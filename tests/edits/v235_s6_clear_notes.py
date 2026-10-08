#!/usr/bin/env python3
# V235 slice 6: the three sabotage-spec notes D215 Amendment 1 restates ("Spec note text, so the files say what is true").
# Ruling: tests/measure/v235_rulings/v235_ruling_d215_d217.md, section "D215 Amendment 1". Tests only: no index.html byte.
# The new note texts are read VERBATIM out of the amendment's three bullets (never retyped); every anchor is asserted
# count==1 before anything is written; both specs must still parse and every mutation's anchor must still apply exactly
# once to the candidate, or nothing is written.
#
# Diff classes:
#   tests/sabotage/v235_d215.json   S2-D215 note, S4-D215 note (replaced whole)
#   tests/sabotage/v232_d199.json   S1-D199 note: the V235 sentence replaced (the V232 sentence before it untouched)
import sys, re, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
RULING = (ROOT / 'tests/measure/v235_rulings/v235_ruling_d215_d217.md').read_text(encoding='utf-8')
AMEND = RULING[RULING.index('# D215 Amendment 1'):]
def bullet(pat):
    m = re.findall(pat, AMEND)
    if len(m) != 1: sys.exit('ABORT: amendment bullet %r found %d times' % (pat, len(m)))
    return m[0]
NEW_S2 = bullet(r"`v235_d215\.json` S2-D215 note: `([^`]*)`")
NEW_S4 = bullet(r"`v235_d215\.json` S4-D215 note: `([^`]*)`")
NEW_S1 = bullet(r"`v232_d199\.json` S1-D199 note, the V235 sentence: `([^`]*)`")

def note_line(v): return '"note": ' + json.dumps(v, ensure_ascii=False)
def swap(text, old, new, label):
    n = text.count(old)
    if n != 1: sys.exit('ABORT: %s anchor count=%d (want 1); nothing written' % (label, n))
    return text.replace(old, new, 1)

P235 = ROOT / 'tests/sabotage/v235_d215.json'; P232 = ROOT / 'tests/sabotage/v232_d199.json'
t235 = P235.read_text(encoding='utf-8'); t232 = P232.read_text(encoding='utf-8')
spec235 = {m['name'].split()[0]: m for m in json.loads(t235)}
o235 = t235
o235 = swap(o235, note_line(spec235['S2-D215']['note']), note_line(NEW_S2), 'S2-D215 note')
o235 = swap(o235, note_line(spec235['S4-D215']['note']), note_line(NEW_S4), 'S4-D215 note')
OLD_S1 = ("V235 re-anchor: tests/measure/v235_rulings/v235_ruling_d215_d217.md Sabotage, 'S1-D199 becomes hours regains the "
          "dash row (must trip D215-rows and D215-tail)'; this pin stays on g232 D199-spec (V235 era: 10 rows, no dash).")
o232 = swap(t232, OLD_S1, NEW_S1, 'S1-D199 V235 sentence')

cand = (ROOT / 'index.html').read_text(encoding='utf-8')
for label, txt in (('v235_d215.json', o235), ('v232_d199.json', o232)):
    for m in json.loads(txt):
        if cand.count(m['anchor']) != 1: sys.exit('ABORT: %s %r anchor no longer applies once; nothing written' % (label, m['name']))
chk = {m['name'].split()[0]: m['note'] for m in json.loads(o235)}
assert chk['S2-D215'] == NEW_S2 and chk['S4-D215'] == NEW_S4
assert NEW_S1 in {m['name'].split()[0]: m['note'] for m in json.loads(o232)}['S1-D199']
P235.write_text(o235, encoding='utf-8'); P232.write_text(o232, encoding='utf-8')
print('v235_s6_clear_notes: 3 notes written verbatim from D215 Amendment 1; both specs parse; every anchor applies once')
