#!/usr/bin/env python3
# V206 slice 4d — sabotage upkeep only (coordinator-approved, gatekeeper's proof copies
# /tmp/v205_m3_reanchor.json and /tmp/v202_m10_reanchor.json are the reference).
#   * tests/sabotage/v205.json M3: D137 rewrote the reader line it anchors on
#     ("const at = w => chiFromTable6(w);" -> the _rowCap form). Anchor re-sited; the
#     replacement is UNCHANGED, so the mutant still reverts D128's calendar-week reader.
#   * tests/sabotage/v202.json M10: dark since V203, when D119 widened the branch to
#     "a.kind === 'entered' || a.kind === 'edited'". Anchor AND replacement re-sited on that
#     form, as in gatekeeper's copy: an unchanged replacement would also drop the 'edited'
#     arm and change what the mutant does. The replacement still restores only the em-dash.
# Each touched mutation gets a "V206 UPKEEP" note line; names and gate paths do not move.
# Every raw-text anchor asserted count==1 before anything is written; abort on the first miss.
import json, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
SRC = open(ROOT + 'index.html', encoding='utf-8').read()

def die(msg):
    sys.exit('ABORT: ' + msg)

EDITS = [
  dict(path='tests/sabotage/v205.json', tag='M3', gate='gates/g205_chi_table6.js',
       old_anchor='  const at = w => chiFromTable6(w);',
       new_anchor='  const at = w => chiFromTable6(_rowCap ? Math.min(w, _rowCap) : w);',
       old_repl=None, new_repl=None,     # replacement unchanged
       note_add=(" V206 UPKEEP (D137, not a change to D128): the anchor is re-sited on the D137 reader line"
                 " (_rowCap ? Math.min(w, _rowCap) : w). The replacement is unchanged, so the mutant still"
                 " puts back the V115 phase-window rescale D128 removed, and the named trips are the same.")),
  dict(path='tests/sabotage/v202.json', tag='M10', gate='gates/g202_pace_copy.js',
       old_anchor="  if(a.kind === 'entered')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;",
       new_anchor="  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;",
       old_repl="  if(a.kind === 'entered')  return `Anchored on ${art} <b>${m} mile</b> — the time you entered.` + tail;",
       new_repl="  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b> — the time you entered.` + tail;",
       note_add=(" V206 UPKEEP: dark since V203, re-anchored V206. V203 (D119) widened the branch to"
                 " a.kind === 'entered' || a.kind === 'edited', so the old anchor read count 0. Anchor and"
                 " replacement are both re-sited on that form; the replacement still restores only the"
                 " em-dash, so the mutation and its named trips are unchanged.")),
]

plans = []
for e in EDITS:
    if SRC.count(e['new_anchor']) != 1: die('%s new anchor count %d in index.html' % (e['tag'], SRC.count(e['new_anchor'])))
    if SRC.count(e['old_anchor']) != 0: die('%s old anchor still in index.html' % e['tag'])
    raw = open(ROOT + e['path'], encoding='utf-8').read()
    J = json.loads(raw)
    hit = [m for m in J if m.get('name', '').startswith(e['tag'] + ' ')]
    if len(hit) != 1: die('%s entries: %d' % (e['tag'], len(hit)))
    m = hit[0]
    if m['anchor'] != e['old_anchor'] or m['gate'] != e['gate']: die('%s does not carry the expected anchor/gate' % e['tag'])
    if e['old_repl'] is not None and m['replacement'] != e['old_repl']: die('%s replacement is not the expected one' % e['tag'])
    if e['old_repl'] is not None and (e['old_anchor'].replace(', the time', ' — the time') != e['old_repl']
                                      or e['new_anchor'].replace(', the time', ' — the time') != e['new_repl']):
        die('%s: the pair does not differ by exactly the em-dash' % e['tag'])
    new = dict(m); new['anchor'] = e['new_anchor']; new['note'] = m['note'] + e['note_add']
    if e['new_repl'] is not None: new['replacement'] = e['new_repl']
    pairs = [(k, m[k], new[k]) for k in ('anchor', 'replacement', 'note') if m[k] != new[k]]
    out = None
    for ea in (False, True):                       # match the file's own string encoding
        enc = lambda s: json.dumps(s, ensure_ascii=ea)
        if all(raw.count(enc(o)) == 1 for _, o, _ in pairs):
            out = raw
            for _, o, n in pairs:
                out = out.replace(enc(o), enc(n), 1)
            break
    if out is None: die('%s: a raw field is not count==1 in %s under either encoding' % (e['tag'], e['path']))
    J2 = json.loads(out)
    if len(J2) != len(J): die('%s: mutation count moved' % e['path'])
    for a, b in zip(J, J2):
        if a is m:
            if b != new: die('%s did not land as intended' % e['tag'])
        elif a != b: die('%s: a mutation other than %s moved' % (e['path'], e['tag']))
    plans.append((e['path'], out, e['tag'], [k for k, _, _ in pairs]))

for path, out, tag, keys in plans:
    open(ROOT + path, 'w', encoding='utf-8').write(out)
    print('%s %s re-anchored (%s)' % (path, tag, ', '.join(keys)))
