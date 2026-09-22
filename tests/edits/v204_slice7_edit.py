#!/usr/bin/env python3
# V204 slice 7 — GATE AND SABOTAGE ONLY. index.html is NOT touched; ia-version stays 203.
#
# Ruling (Mario, recorded under D126): the three oracle corrections landed in slice 6 were
# latent hardening. The reason the ":60" defect survived g202_int_doctrine.js on V203 is a
# LATTICE COVERAGE GAP: no config in that gate's lattice reaches a goal pace that carries
# across the minute, so split-then-round and round-then-split print the same string on every
# point it tests. A gate that cannot fail on the defect it was just fixed for is exactly the
# failure D126 names.
#
# TASK 1 — add the fractional-pace config as an explicitly NAMED row (mile anchor 6:46 =
#   406 s, seed 76308), whose INT cards read "4x400m at 6:44/mi. This week's goal pace is
#   6:60/mi." on V203 and "... 7:00/mi." on the current artifact.
# TASK 2 — add sabotage M4/M5/M6 alongside M1-M3.
#
# Every anchor is asserted count == 1 before a byte is written; the first miss aborts the
# whole script and nothing is written.

import json, os, sys

ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO  = os.path.dirname(ROOT)
GATE  = os.path.join(ROOT, 'gates', 'g202_int_doctrine.js')
SPEC  = os.path.join(ROOT, 'sabotage', 'v204.json')
HTML  = os.path.join(REPO, 'index.html')

src = open(GATE, encoding='utf-8').read()
BEFORE_MD5 = None
import hashlib
BEFORE_MD5 = hashlib.md5(open(HTML, 'rb').read()).hexdigest()
assert BEFORE_MD5 == '6ae8149c733b61c76e4e0db37749788a', 'index.html is not the V203 baseline: ' + BEFORE_MD5

edits = []
def rep(old, new, why):
    edits.append((old, new, why))

# ── EDIT 1 — the named fractional-pace config, appended to the lattice ────────
A1 = """      LAT.push(paceGoal({ targetDist:dist, targetMins:'10', targetSecs:'30', targetTime:'10:30',
        mileBestMins:mm, mileBestSecs:ss, mileBestSrc:{kind:'entered'} }, { seed }));
"""
B1 = A1 + """
// ── the fractional-pace row (D126, V204 slice 7) ─────────────────────────────
// COVERAGE, stated out loud rather than smuggled in as one more lattice point. Every
// config above lands on a goal pace a whole second away from the minute, so a formatter
// that splits the minutes off BEFORE it rounds the seconds prints exactly what one that
// rounds first prints. That is why the ":60" defect D126 names survived this gate on
// V203: not because a row was wrong, but because nothing here could reach the carry.
// This config reaches it. A 6:46 mile (406 s) at seed 76308 walks the INT goal pace onto
// 419.5 s/mi. Rounded first, 419.5 -> 420 s/mi -> "7:00/mi". Split first, it prints
// floor(419.5/60) = 6 and round(59.5) = 60, which is "6:60/mi" — the string V203 shipped
// on this very config, and not a time at all.
// Its purpose is written down in D10 at the foot of this file, and D10c fails loudly if
// the config ever stops reaching the carry.
const FRACTIONAL = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'6', mileBestSecs:'46', mileBestSrc:{kind:'entered'} }, { seed:76308 });
LAT.push(FRACTIONAL);
"""
rep(A1, B1, 'lattice gains the named fractional-pace config')

# ── EDIT 2 — the D10 block, ahead of the summary line ────────────────────────
A2 = "console.log(`PASS ${PASS} FAIL ${FAIL}`);"
B2 = """// ═════════════════════════════════════════════════════════════════════════════
// D10 — the fractional-pace row: the seconds limb and the parser are load-bearing
// ═════════════════════════════════════════════════════════════════════════════
// ORACLE — the clock contract, TYPED HERE and read from no formatter in the app: an m:ss
// clock carries a seconds limb of exactly two digits in 00..59. "6:60" is not a time.
// That contract plus the 16 s/mi hand arithmetic already typed at the top of this file is
// the whole oracle below.
//   D10a makes the parser at line 131 load-bearing on EVERY artifact, well-formed or not.
//   D10b/D10c/D10d make the config above load-bearing, and go red if it drifts off the carry.
const D10_MAL = '6:60', D10_GOOD = '7:00';
ok(toSec(D10_MAL) === null && toSec(D10_GOOD) === 420 && toSec('6:59') === 419 && toSec('6:5') === null,
  `D10a the goal-pace parser REJECTS "${D10_MAL}" instead of normalising it to 420 s: a clock's seconds limb `
  + `is two digits in 00..59, so "${D10_MAL}" is not a time and must not parse (got ${toSec(D10_MAL)}), while `
  + `"${D10_GOOD}" parses to ${toSec(D10_GOOD)} s and the one-digit "6:5" does not (got ${toSec('6:5')})`);

const CLOCK_TOK = /(\\d+):(\\d+)/g;
const fCards = ints(IA.buildProgram(JSON.parse(JSON.stringify(FRACTIONAL))));
let d10bad = [], d10carry = 0, d10goals = 0;
for(const c of fCards){
  CLOCK_TOK.lastIndex = 0; let m;
  while((m = CLOCK_TOK.exec(c.detail)))
    if(m[2].length !== 2 || +m[2] > 59) d10bad.push(`W${c.w} token "${m[0]}" in |${c.detail.slice(0,62)}|`);
  const g = /This week's goal pace is (\\d+:\\d\\d)\\/mi/.exec(c.detail);
  if(g){
    d10goals++;
    if(toSec(g[1]) === null) d10bad.push(`W${c.w} goal pace "${g[1]}" does not parse as a clock`);
    if(/:00$/.test(g[1])) d10carry++;
  }
}
ok(fCards.length > 0 && d10bad.length === 0,
  `D10b every clock printed on all ${fCards.length} INT cards of the 6:46 mile / seed 76308 config has a `
  + `two-digit seconds limb in 00..59; V203 printed "6:60/mi" on this config`
  + (d10bad.length ? ' — first miss: ' + d10bad[0] : ''));
ok(d10carry > 0,
  `D10c the config still REACHES the carry: ${d10carry} of its ${d10goals} goal-pace sentences land on the `
  + `minute, which is the one place split-then-round prints ":60". A zero here means this row went vacuous `
  + `and the lattice stopped covering the defect D126 names`);

const D10_TGT = 404, D10_GOAL = D10_TGT + INT_SUB;   // hand: 404 + 16 = 420 s/mi
const f1 = fCards[0];
ok(!!(f1 && f1.dose && f1.dose.tgt === D10_TGT
     && f1.detail.indexOf(`at ${clk(D10_TGT)}/mi`) >= 0
     && f1.detail.indexOf(`This week's goal pace is ${clk(D10_GOAL)}/mi`) >= 0),
  `D10d the reproducing card itself: its first INT week logs ${D10_TGT} s/mi and prints `
  + `"at ${clk(D10_TGT)}/mi. This week's goal pace is ${clk(D10_GOAL)}/mi." by hand, since ${D10_TGT} + `
  + `${INT_SUB} = ${D10_GOAL} s/mi and ${D10_GOAL} s is ${clk(D10_GOAL)} (got tgt `
  + `${f1 && f1.dose && f1.dose.tgt}, detail |${f1 ? f1.detail.slice(0,60) : 'no card'}|)`);

""" + A2
rep(A2, B2, 'D10 fractional-pace block ahead of the summary')

# ── EDIT 3 — the header says what the new row is for ─────────────────────────
A3 = """// Usage: node tests/gates/g202_int_doctrine.js [artifact]
"""
B3 = """// V204 slice 7 (D126): the lattice gains ONE named config, a 6:46 mile at seed 76308, and
// D10 at the foot of this file. Until that config existed nothing here reached a goal pace
// that carries across the minute, so this gate could not fail on the ":60" defect D126
// fixed. It fails on V203 now, which is the point of the row.
//
// Usage: node tests/gates/g202_int_doctrine.js [artifact]
"""
rep(A3, B3, 'header records why the fractional row exists')

for old, new, why in edits:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor count=%d (want 1) for: %s\n  %r' % (n, why, old[:90]))
    src = src.replace(old, new, 1)
    print('ok   gate anchor 1/1 — %s' % why)

open(GATE, 'w', encoding='utf-8').write(src)
print('wrote %s' % GATE)

# ── EDIT 4 — sabotage M4/M5/M6 ───────────────────────────────────────────────
html = open(HTML, encoding='utf-8').read()
muts = json.load(open(SPEC, encoding='utf-8'))
if len(muts) != 3 or [m['name'][:2] for m in muts] != ['M1', 'M2', 'M3']:
    sys.exit('ABORT: v204.json is not the M1-M3 spec this slice extends')

IDIOM = "`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`"

M4_A = "      const fmt = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/100'."
M5_A = "          const fmt = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/mi'."
M1_A = "  const t = Math.round(sec);\n  return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0');"
M1_R = "  const t = sec;\n  return Math.floor(t/60) + ':' + String(Math.round(t%60)).padStart(2,'0');"

NEW = [
 {
  "name": "M4 -> the SWIM interval formatter is re-pointed off the single owner and back to the inline idiom. _clkMS still exists, is still correct, and is still called by every other surface; only the swim INT card builds its own clock again. This is the shape D126 was built to make impossible, and it is the shape a careless merge reintroduces, because the line reads like ordinary local formatting",
  "anchor": M4_A,
  "replacement": "      const fmt = s => " + IDIOM + ";",
  "gate": "gates/g204_clock_limb.js",
  "note": "NAMED TRIP: C7c, the swim wiring row, and it is C7c by name because the swim progression is the one surface whose domain is genuinely fractional. The rows that go red are 'C7c every swim INT prints weekPace x 0.97 as the clock this gate computes', 'C7c every swim INT prints this week's goal split as the clock of weekPace' and 'C7c every clock on a swim INT card has a seconds limb in 00..59', plus the carry row where 119.504 s/100 must print 2:00 and the idiom prints 1:60. The gate re-derives the swim progression from the cfg, so the expectation is independent of the formatter being mutated. C1-C4 must STAY GREEN: the helper itself is untouched by this mutation, and a red there would mean the anchor caught more than the swim call site."
 },
 {
  "name": "M5 -> the NSW INT formatter is re-pointed off the single owner and back to the inline idiom. Same shape as M4 on the other doctrine path: the helper survives, the wiring does not. A gate that only proved _clkMS exists and is correct would ship this, which is why the wiring rows are separate rows",
  "anchor": M5_A,
  "replacement": "          const fmt = s => " + IDIOM + ";",
  "gate": "gates/g204_clock_limb.js",
  "note": "NAMED TRIP: C7a, the NSW INT wiring row. 'C7a every INT `Nx400m at X/mi` limb is the clock of its own dose.tgt' goes red, and so does the C7a KILLER row, 'C7a INT note prints 419.5 s/mi as the carried clock (the idiom prints 6:60 here)', which is the hand-picked carrying value 419.5 s/mi where the two formatters disagree by a whole minute. C7b and C7c must STAY GREEN: this anchor is the NSW branch only, and a red on the NRC or swim rows would mean the replacement leaked."
 },
 {
  "name": "M6 -> the same revert as M1, inside _clkMS itself, but judged by g202_int_doctrine.js instead of g204_clock_limb.js. This is the mutation the slice-7 lattice row makes possible: on V203 this gate could not see this defect at all, because no config it built reached a goal pace that carries across the minute. With the 6:46 mile at seed 76308 in the lattice it can. A survivor here would mean the coverage gap D126 names is still open in the doctrine gate",
  "anchor": M1_A,
  "replacement": M1_R,
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: D10b ('every clock printed on all N INT cards of the 6:46 mile / seed 76308 config has a two-digit seconds limb in 00..59'), D10c (the carry is no longer reached, because the goal pace now prints 6:60 rather than 7:00), D10d (the reproducing card no longer prints the hand-computed 7:00/mi) and D3 (the card prints neither the goal-pace sentence nor the cutback sentence, because the tightened parser refuses 6:60). Note the SHAPE of the failure: it surfaces as a malformed-pace failure, not as wrong arithmetic. The numbers were never wrong; the string was. D1, D2, D4, D5, D7, D8 and D9 must STAY GREEN, because every other lattice point sits a whole second from the minute and the two formatters agree there. D7's pinned PRT TING grid staying green is the specific proof that this mutation is discriminating rather than broad.",
  "deviation": "The ruling asked for M6 to revert one tightened seconds limb inside tests/gates/g202_int_doctrine.js itself. tests/sabotage.py cannot express that: it reads `src` from the CANDIDATE ARTIFACT only (sabotage.py main(), `src = open(cand).read()`), mutates that string, and runs an UNMUTATED gate against it. A mutation is therefore always a mutation of index.html. M6 keeps the ruling's intent - prove that the slice-7 lattice row turned g202_int_doctrine.js into a gate that can fail on the defect D126 names - by pointing the SAME defect at THIS gate. The gate's own regex tightness is instead made load-bearing behaviourally by D10a, which asserts the line-131 parser rejects the literal '6:60' and accepts '7:00'; loosening [0-5]\\d to \\d\\d there reds D10a on any artifact."
 },
 {
  "name": "NOTE-ONLY (not a mutation) -> why there is no M7 for the NRC formatter and no M8 for _intClk",
  "anchor": "",
  "replacement": "",
  "gate": "",
  "note": "DO NOT 'fix' this omission. Both surfaces were measured in slice 5 and neither can be caught behaviourally: PACE_CHART is typed in whole seconds and every NRC column the plan prints is an integer, and _intClk is only ever handed Math.round'ed recovery bounds. Re-pointing either back to the idiom produces a byte-identical program, so the mutation would be NOT-APPLIED at best and a silent survivor at worst - and a survivor there would be a MUTATION defect, not a gate defect. Their coverage is the C8 source census, which is an inventory check rather than a behaviour check; a mutation whose only trip is C8 tells us nothing about what the athlete reads. This row carries no anchor on purpose and must be removed from the spec before the sweep is run, or moved into a sidecar notes file; it exists here so the reasoning travels with the spec."
 },
]

# The NOTE-ONLY row carries no anchor and would score NOT-APPLIED. Keep the reasoning,
# drop the row: it is written into a sidecar the runner never reads.
note_row = NEW.pop()
for m in NEW:
    if m['anchor']:
        n = html.count(m['anchor'])
        if n != 1:
            sys.exit('ABORT: sabotage anchor count=%d (want 1) for %s\n  %r' % (n, m['name'][:12], m['anchor'][:90]))
        print('ok   sabotage anchor 1/1 — %s' % m['name'][:12])

muts.extend(NEW)
open(SPEC, 'w', encoding='utf-8').write(json.dumps(muts, indent=1, ensure_ascii=False) + '\n')
print('wrote %s (%d mutations)' % (SPEC, len(muts)))

NOTES = os.path.join(ROOT, 'sabotage', 'v204_notes.md')
open(NOTES, 'w', encoding='utf-8').write(
  '# v204 sabotage — what is deliberately NOT mutated\n\n' + note_row['note'] + '\n\n'
  '## M6 deviation from the ruling\n\n' + NEW[-1]['deviation'] + '\n')
print('wrote %s' % NOTES)

after = hashlib.md5(open(HTML, 'rb').read()).hexdigest()
assert after == BEFORE_MD5, 'index.html CHANGED: ' + after
print('ok   index.html md5 unchanged: ' + after)
