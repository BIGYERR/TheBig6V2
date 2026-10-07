#!/usr/bin/env python3
# post_v233_d212_s2_docs_survivors.py — Post-V233 D212 follow-up, slice 2 of 2 (TESTS ONLY: index.html untouched, ia-version stays 233).
#
# Ruling: tests/measure/v233_rulings/post_v233_ruling_d212.md (coach D212; Mario concurred 2026-10-07). Slice 1
# (tests/edits/post_v233_d212_s1_g219_row.py) landed the D212 row in g219_d167_pairs.js; this slice makes the gate's docs,
# v219 S4-D167's note and the survivors list say what that row now does.
#   1  g219 header: title line, THE RULINGS THIS DEFENDS (a D212 entry quoting the forward claim), ARMS, VERSION PREDICATE
#   2  g219 report: the stale "R2's ... is parked, see the header" comment above the lwErr block
#   3  tests/sabotage/v219.json: S4-D167's "note" field only (name, anchor, replacement, gate untouched); JSON must parse
#   4  tests/sabotage/known_survivors.txt: the `v219.json S4-D167 -> ...` line deleted (the list only shrinks; the gate is
#      re-armed this pass, so its line goes the same pass). Nothing else in that file changes.
# Every anchor is asserted count==1 on every file before anything is written; the first miss aborts the whole script.
import sys, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
G = ROOT / 'tests' / 'gates' / 'g219_d167_pairs.js'
SPEC = ROOT / 'tests' / 'sabotage' / 'v219.json'
KS = ROOT / 'tests' / 'sabotage' / 'known_survivors.txt'

def refuse(msg):
    sys.exit('REFUSED: ' + msg + '; nothing written')

def apply(name, text, edits):
    for label, a, _ in edits:
        n = text.count(a)
        print(f'anchor {name} {label}: count {n}')
        if n != 1:
            refuse(f'anchor {name} {label} count {n} (want 1)')
    for label, a, b in edits:
        if text.count(a) != 1:
            refuse(f'anchor {name} {label} not unique in the running text')
        text = text.replace(a, b, 1)
    return text

g_src = G.read_text(encoding='utf-8')
s_src = SPEC.read_text(encoding='utf-8')
k_src = KS.read_text(encoding='utf-8')

# ── 1 g219 header docs ───────────────────────────────────────────────────────────────────────────
E1 = []
E1.append(('1.title',
  '// g219_d167_pairs.js — GATE for D167 (+ D167a) and D171 (coach): THE ADJACENT-DAY DEDUPE WALKS THE CALENDAR THE WEEK RENDERS.\n',
  '// g219_d167_pairs.js — GATE for D167 (+ D167a), D171 and D212 (coach): THE ADJACENT-DAY DEDUPE WALKS THE CALENDAR THE WEEK RENDERS.\n'))
A_RUL = r'''//          buildProgram's inline `hotNext` (the `_ISO_ORDER.length-1` form) is UNDEFENDED: not a callable unit, and
//          reverting it is inert on all 15,180 lattice configs.
'''
E1.append(('1.rulings', A_RUL, A_RUL + r'''//   D212   (Post-V233, Mario concurred 2026-10-07) the forward form of R2, S4-D167's guard: "A loaded delt-isolation
//          accessory may print on two consecutive training days (outside Main/Primer/Power on the second) only when every
//          other gear-legal member of the delt-isolation family already prints on one of those two cards; and > 0 such
//          licensed repeats exist on the lattice (liveness)." Pool exhausted is a claim about the athlete's gear, not
//          about the build's draw; healthy configs are graded, injured configs are a watch.
'''))
E1.append(('1.arms',
  "shipped program, never by the engine's pair coordinates. D1 and D171.T read CAND.\n",
  "shipped program, never by the engine's pair coordinates. D1, D171.T and D212 read CAND.\n"))
A_VP = r'''// VERSION PREDICATE (standing rulings 2 and 4). D167/D171 ship on ia-version 219.
//   below 219: REFUSED, every row FAILS by name (never a vacuous pass). 219 and above: every row runs.
'''
B_VP = r'''// VERSION PREDICATE (standing rulings 2 and 4). D167/D171 ship on ia-version 219; D212 (tests only, Post-V233) claims
//   every build >= 219. Below 219: REFUSED, every row FAILS by name, D212 included (never a vacuous pass). 219 and
//   above: every row runs.
'''
E1.append(('1.predicate', A_VP, B_VP))

# ── 2 g219 stale comment above the lwErr block ───────────────────────────────────────────────────
E2 = [('2.lwErr comment',
  "  // the forward rows below (standing ruling 3 as amended); R2's (S4-D167's only guard) is parked, see the header.\n",
  "  // the forward rows below (standing ruling 3 as amended); R2's claim (S4-D167's only guard) is carried by the D212 row below.\n")]

g_out = apply('g219', g_src, E1 + E2)

# ── 3 v219.json S4-D167 note (the note field only) ───────────────────────────────────────────────
OLD_NOTE = '"note": "NAMED TRIP in g219_d167_pairs.js row R2 only (sat>sun/sun>mon 92/14 vs 28/6). The loop body is not transplanted, so K2a stays green. Needs ia-version 219: pair rows run only on 219 (SKIP above), every row is REFUSED below. Pair rows read V218 from git 44fd483 when no baseline is passed, as sabotage.py runs it."'
NEW_NOTE = '"note": "NAMED TRIP in g219_d167_pairs.js row D212 (V233+S4: 138 healthy violations 80/8/50 sat>sun/sun>mon/interior on 28 configs; R2 retired Post-V233). Every other g219 row stays green. Needs ia-version 219 or later: every row runs on 219 and above, every row is REFUSED below. The gate reads V218 from git 44fd483 when no baseline is passed, as sabotage.py runs it."'
s_out = apply('v219.json', s_src, [('3.S4-D167 note', OLD_NOTE, NEW_NOTE)])
try:
    before, after = json.loads(s_src), json.loads(s_out)
except Exception as e:
    refuse('v219.json does not parse after the edit: ' + str(e))
rows = lambda d: d if isinstance(d, list) else (d.get('mutations') or d.get('specs'))
rb, ra = rows(before), rows(after)
if len(rb) != len(ra):
    refuse('v219.json row count moved')
for x, y in zip(rb, ra):
    if x['name'].startswith('S4-D167'):
        if {k: v for k, v in x.items() if k != 'note'} != {k: v for k, v in y.items() if k != 'note'}:
            refuse('S4-D167 moved outside its note')
        if 'row D212' not in y['note']:
            refuse('S4-D167 note did not land')
    elif x != y:
        refuse('a v219.json row other than S4-D167 moved: ' + x['name'][:40])

# ── 4 known_survivors.txt: delete the v219.json S4-D167 line ─────────────────────────────────────
PREFIX = 'v219.json S4-D167 -> '
lines = k_src.splitlines(keepends=True)
hit = [i for i, l in enumerate(lines) if l.startswith(PREFIX)]
print(f'anchor known_survivors 4.S4-D167 line: count {len(hit)}')
if len(hit) != 1:
    refuse(f'survivor line count {len(hit)} (want 1)')
victim = lines[hit[0]]
if 'gate went dead' not in victim or not victim.rstrip('\n').endswith('(mS)'):
    refuse('the S4-D167 survivor line does not read as expected')
k_out = ''.join(lines[:hit[0]] + lines[hit[0] + 1:])
if len(k_out.splitlines()) != len(lines) - 1 or k_out.count('S4-D167') != 0:
    refuse('known_survivors did not shrink by exactly the S4-D167 line')

# ── write (only after every anchor on every file held) ───────────────────────────────────────────
for k in ('D171 and D212 (coach)', 'D1, D171.T and D212 read CAND', 'D212 included', 'carried by the D212 row below'):
    if g_out.count(k) != 1:
        refuse(f'{k!r} did not land once in g219')
if 'parked, see the header' in g_out:
    refuse('the stale parked comment survived')
G.write_text(g_out, encoding='utf-8')
SPEC.write_text(s_out, encoding='utf-8')
KS.write_text(k_out, encoding='utf-8')
print(f'wrote {G.name} ({len(g_src)} -> {len(g_out)}), {SPEC.name} ({len(s_src)} -> {len(s_out)}), {KS.name} ({len(lines)} -> {len(lines) - 1} lines)')
