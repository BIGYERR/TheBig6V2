#!/usr/bin/env python3
# v230_s6b_reanchor_v229_d194.py — V230 slice 6b: tests/sabotage/v229_d194.json after D194 part 2 (the lens).
# Session call: tests/measure/v230_rulings/v230_session_calls.md item 10. V230 moved four lines onto _dayPlanCfg
# (the boot guard and its filter cfg in applySessionSwaps, the tap guard and its filter cfg in applySwapChoice), so
# three shipped mutations whose anchors carry those lines count 0 on the V230 candidate and one is a no-op:
#   S18-D194 A1  re-anchored, same gate (gates/g228_d192_undokey.js, row d2-BOOT-U)
#   S21-D194 A1  re-anchored, same gate (gates/g229_d193_build.js, row b)
#   S27-D194 A1  re-anchored, gate moves gates/g229_d194_lens.js (row q, retired at 230) -> gates/g229_d193_build.js (row b,
#                the second trip D194 Amendment 1 names for S27); its note's NAMED TRIP is rewritten, the old text kept as history
#   S25-D194     RETIRED (entry removed): its replacement is the V230 build itself, so on V230 it is a no-op; its row (q) is
#                retired; its inverse is v230 S28 (tap guard) and S29 (tap filter cfg). The session-calls line is the record.
# Each new anchor / replacement is built in code from the old one by the four exact substring swaps the build made (nothing
# retyped), so the V230 mutant makes the same semantic change the V229 mutant made. All-or-none: every check runs before
# the one write. Checks: index.html reads ia-version 230; each V229 form counts 0 and each V230 form 1 on the candidate;
# each entry is found by its exact name (count 1); each old anchor counts 0 (stale), each new anchor counts 1, the
# replacement differs from the anchor; S25's lensed anchor (V230's tap lines) counts 1 and equals S25's replacement but for
# the shipped guard's `activeProg&&` null check (the no-op proof, read on the run: not byte-identical); the JSON round-trips
# (indent 1, real UTF-8). Literal bytes; no escapes.
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'index.html')
SAB = os.path.join(ROOT, 'tests', 'sabotage', 'v229_d194.json')
SRC = open(ART, encoding='utf-8').read()
if SRC.count('<meta name="ia-version" content="230">') != 1:
    sys.exit('REFUSED: index.html is not the V230 candidate (ia-version 230 not found once); nothing written')
print('candidate sha256 ' + hashlib.sha256(SRC.encode('utf-8')).hexdigest()[:12])

# the four lines D194 part 2 moved, V229 form -> V230 form (L1 boot guard, L1 boot filter cfg, L2 tap guard, L2 tap filter cfg)
SWAPS = [
  ('if(hit && prog.cfg && prog.cfg.injury){', 'if(hit && _dayPlanCfg(prog,day).injury){'),
  ('applyInjuryFilter(day.sections,prog.cfg)', 'applyInjuryFilter(day.sections,_dayPlanCfg(prog,day))'),
  ('if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){', 'if(activeProg&&_dayPlanCfg(activeProg,day).injury){'),
  ('}]}],activeProg.cfg)', '}]}],_dayPlanCfg(activeProg,day))'),
]
for o, n in SWAPS:
    if SRC.count(o) != 0 or SRC.count(n) != 1:
        sys.exit('ABORT: moved form ' + repr(o) + ' counts ' + str(SRC.count(o)) + ', V230 form counts ' + str(SRC.count(n)) + '; nothing written')
def lens(s):
    for o, n in SWAPS: s = s.replace(o, n)
    return s

SUFFIX = ' (re-anchored at V230: D194 part 2 moved the guard / filter cfg onto _dayPlanCfg)'
N18 = 'S18-D194 A1 -> the boot replay keeps no dose: the _renamed stamp inside the injury guard is dropped'
N21 = 'S21-D194 A1 -> the tap keeps a dose on an uninjured program: the keep is written outside the cfg.injury guard'
N27 = 'S27-D194 A1 -> the boot keep is written outside the prog.cfg.injury guard'
N25 = 'S25-D194 -> the tap guard and its filter cfg read the lens (premature activation of D194 part 2)'
OLD_GATE = {N18: 'gates/g228_d192_undokey.js', N21: 'gates/g229_d193_build.js', N27: 'gates/g229_d194_lens.js', N25: 'gates/g229_d194_lens.js'}
NEW_GATE = {N18: 'gates/g228_d192_undokey.js', N21: 'gates/g229_d193_build.js', N27: 'gates/g229_d193_build.js'}
S27_HEAD = ('NAMED TRIP: row b (tests/measure/v229_rulings/d194_injlens_ruling.md, Amendment 1 Sabotage S27: '
  '"boot keep written outside the `prog.cfg.injury` guard → (q) (an overlay program\'s booted item carries `_preHold`) and (b)"; '
  'row (q) is retired at V230, so the trip is (b), tests/measure/v230_rulings/v230_session_calls.md item 10): '
  'the boot replay stamps _preHold on the renamed items of an uninjured program, so an uninjured item carries _preHold '
  'after a boot replay. EXPECTED: b. History (was row q until V230): ')

raw = open(SAB, encoding='utf-8').read(); d = json.loads(raw)
if json.dumps(d, indent=1, ensure_ascii=False) + '\n' != raw:
    sys.exit('ABORT: v229_d194.json does not round-trip (indent 1, ensure_ascii False); nothing written')
names = [e.get('name') for e in d]
for nm in (N18, N21, N27, N25):
    if names.count(nm) != 1: sys.exit('ABORT: entry ' + repr(nm)[:70] + ' found ' + str(names.count(nm)) + ' times; nothing written')
    e = d[names.index(nm)]
    if e.get('gate') != OLD_GATE[nm]: sys.exit('ABORT: ' + nm[:20] + ' gate is ' + repr(e.get('gate')) + '; nothing written')
    if 're-anchored at V230' in e.get('note', ''): sys.exit('ABORT: ' + nm[:20] + ' already re-anchored; nothing written')
    if SRC.count(e['anchor']) != 0: sys.exit('ABORT: ' + nm[:20] + ' old anchor counts ' + str(SRC.count(e['anchor'])) + ' (not stale); nothing written')

for nm in (N18, N21, N27):
    e = d[names.index(nm)]
    a, r = lens(e['anchor']), lens(e['replacement'])
    if a == e['anchor']: sys.exit('ABORT: ' + nm[:20] + ' anchor carries no moved line; nothing written')
    if SRC.count(a) != 1: sys.exit('ABORT: ' + nm[:20] + ' new anchor counts ' + str(SRC.count(a)) + '; nothing written')
    if a == r: sys.exit('ABORT: ' + nm[:20] + ' replacement == anchor; nothing written')
    e['anchor'] = a; e['replacement'] = r; e['gate'] = NEW_GATE[nm]
    e['note'] = (S27_HEAD + e['note'] if nm == N27 else e['note']) + SUFFIX
    print('re-anchored ' + nm[:12] + ' -> ' + e['gate'])

e25 = d[names.index(N25)]
# S25's replacement is the shipped V230 text but for the shipped guard's activeProg&& null check: the lensed S25 anchor
# (= V230's four tap lines) counts 1 on the candidate and equals S25's replacement once that null check is dropped.
_s25v230 = lens(e25['anchor'])
if SRC.count(_s25v230) != 1 or _s25v230.replace('  if(activeProg&&_dayPlanCfg(', '  if(_dayPlanCfg(', 1) != e25['replacement']:
    sys.exit('ABORT: S25 replacement is not the shipped V230 tap lines (less the activeProg&& null check); nothing written')
print('RETIRED S25 (removed; its replacement is the shipped V230 tap lines but for the activeProg&& null check, which counts 1):')
print(json.dumps(e25, indent=1, ensure_ascii=False))
d = [x for x in d if x.get('name') != N25]

out = json.dumps(d, indent=1, ensure_ascii=False) + '\n'
with open(SAB, 'w', encoding='utf-8', newline='\n') as fh: fh.write(out)
print('wrote ' + SAB + ' (' + str(len(d)) + ' entries)')
