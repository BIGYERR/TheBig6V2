#!/usr/bin/env python3
# V202 slice 5 — gate + sabotage for E7/E12.
# Extends tests/gates/g202_pace_anchor.js (NOT a new file): P5b lives there, it is the row
# the ruling moves, and the 360-build lattice it needs is already built there. A second file
# would re-sweep 360 builds to re-derive rows this one already holds.
import io, os, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g202_pace_anchor.js')
SAB  = os.path.join(ROOT, 'tests', 'sabotage', 'v202.json')

src = io.open(GATE, encoding='utf-8').read()
EDITS = []
def sub(name, old, new): EDITS.append((name, old, new))

# ── G1 — runSessions must carry the note (E12 is read off the built program) ──
sub('G1 runSessions carries note',
"""    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', dose:s.dose||null }); });
""",
"""    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', note:s.note||'', dose:s.dose||null }); });
""")

# ── G2 — the scope comment and the class branch of the P5 loop ──
sub('G2 P5 scope comment + at-or-slower branch',
"""// SCOPE, and it is a real one: D100 and D101 govern an athlete whose entered goal is FASTER
// than the mile they entered. When the entered goal is SLOWER, the engine's unchanged formula
// (index.html: max(realistic, initial - gain*w), gain negative) parks the whole array on the
// slower target. That behaviour predates this build and no ruling covers it, so it gets its own
// row (P5b) rather than being folded into the improving case, where it would read as a defect.
let p5bad = [], p5flatBad = [], p5improving = 0, p5slower = 0;
for(const r of rows){
  const a = r.pp.arr;
  const handTarget = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  if(handTarget >= r.handIP){
    p5slower++;
    if(new Set(a).size !== 1 || a.some(v => v < r.pp.ip - 1e-9))
      p5flatBad.push(`${r.exp}/${r.age}/${r.unit} goal ${handTarget.toFixed(1)} slower than anchor ${r.pp.ip}: ${a.join(' ')}`);
    continue;
  }
""",
"""// SCOPE. D100 and D101 govern an athlete whose entered goal is FASTER than the pace they
// already run at the goal distance; E7 governs the other half. Two segments, two rows.
//
// E7 (V202 slice 5): THE CLOCK HOLDS AT CURRENT, IT NEVER DROPS TO A SLOWER GOAL. Until this
// build, an athlete whose entered goal was at or slower than their own distance-converted
// anchor had the whole block parked on the GOAL, which prescribes slower work than they
// already run. The working target is now min(goal, anchor), so the array is flat AT THE
// ANCHOR. _originalTarget still carries the ENTERED goal and _dampened is false: the goal is
// not out of reach, it is already met.
//
// WHY THIS ROW CAN NOW FAIL. The V202 P5b it replaces compared the engine's array against
// the ENGINE's own _initialPace and then printed its census from the gate's hand values only,
// so no mutation inside the app could move either. The expectation below is HAND-derived —
// handRowPaceAt(handRow(anchorMile), goalDistance), the gate's own chart and its own log
// interpolation — and it is compared against the ENGINE's published array. One side moves.
let p5bad = [], p5flatBad = [], p5improving = 0, p5slower = 0;
for(const r of rows){
  const a = r.pp.arr;
  const handTarget = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  r.handTarget = handTarget;
  r.goalMetClass = handTarget >= r.handIP;
  if(r.goalMetClass){
    p5slower++;
    // E7's after-grid: one pace all block, and that pace is the HAND anchor, not the goal.
    const wantFlat = +r.handIP.toFixed(1);
    if(new Set(a).size !== 1 || a.some(v => Math.abs(v - wantFlat) > 1e-9))
      p5flatBad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} goal ${r.goal.targetDist}${r.unit} `
        + `(${handTarget.toFixed(1)} s/mi, at or slower than the ${wantFlat} anchor): got [${a.join(' ')}], `
        + `want ${wantFlat} every week`);
    continue;
  }
""")

# ── G3 — the P5b assertion, the class rows, and the census ──
sub('G3 P5b rewrite + P5c..P5f',
"""ok(p5flatBad.length === 0, `P5b when the entered goal is SLOWER than the athlete's own `
  + `distance-converted anchor the engine invents no improvement and holds one pace all block: `
  + `${p5slower - p5flatBad.length} of ${p5slower} such builds flat, none faster than the anchor `
  + `(unruled behaviour, pinned so a later ruling can move it deliberately)`
  + (p5flatBad.length ? ' — first miss: ' + p5flatBad[0] : ''));
// The COUNT is a property of this lattice, computed entirely from the gate's own hand values, so it
// is printed and not asserted: a mutation inside the app cannot move it, and a row that cannot move
// is not a test. Measure reported 138 of these 360 parked flat under the first cut of E1, which
// anchored on the mile pace itself; converting the anchor to the goal distance leaves 114, and those
// are lattice rows whose entered goal is genuinely undemanding (a 21:30 3 km against an 8:15 mile).
console.log(`  note  FLAT-PARK CENSUS: ${p5slower} of ${rows.length} builds in this lattice enter a goal `
  + `slower than their own distance-converted anchor (measure counted 138 under the first cut of E1). `
  + `${p5improving} builds improve. Both segments are exercised, so neither P5 nor P5b is vacuous.`);
""",
"""ok(p5flatBad.length === 0, `P5b E7 — when the entered goal is at or SLOWER than the athlete's own `
  + `distance-converted anchor the block holds ONE pace and that pace is the ANCHOR, never the `
  + `slower goal: ${p5slower - p5flatBad.length} of ${p5slower} such builds flat at the gate's own `
  + `hand anchor (before E7 they were flat at the entered goal, which prescribes slower work than `
  + `the athlete already runs)`
  + (p5flatBad.length ? ' — first miss: ' + p5flatBad[0] : ''));
const p5cls = rows.filter(r => r.goalMetClass);
ok(p5slower > 0 && p5improving > 0, `P5c both segments are exercised by this sweep, so neither P5 `
  + `nor P5b is vacuous: ${p5slower} of ${rows.length} builds enter a goal at or slower than their own `
  + `distance-converted anchor, ${p5improving} improve (measure counted 138 of these under the FIRST `
  + `cut of E1, which anchored on the mile pace itself; the amended anchor leaves ${p5slower}, and `
  + `those are rows whose entered goal is genuinely undemanding — a 21:30 3 km against an 8:15 mile)`);
// E7 keeps the two metas honest: the goal is not out of reach, it is already met, so nothing is
// dampened; and the ENTERED goal survives on _originalTarget so copy can still name both numbers.
const p5dampBad = p5cls.filter(r => r.pp.dampened !== false)
  .map(r => `${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} dampened=${r.pp.dampened}`);
ok(p5dampBad.length === 0, `P5d E7 — nothing in this class is dampened; the goal is already met, not `
  + `out of reach: ${p5cls.length - p5dampBad.length} of ${p5cls.length}`
  + (p5dampBad.length ? ' — first miss: ' + p5dampBad[0] : ''));
const p5origBad = p5cls.filter(r => Math.abs(r.pp.orig - +r.handTarget.toFixed(1)) > 0.06)
  .map(r => `${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} _originalTarget ${r.pp.orig} `
    + `want the ENTERED goal ${r.handTarget.toFixed(1)}`);
ok(p5origBad.length === 0, `P5e E7 — clamping the WORKING target does not overwrite the ENTERED one: `
  + `_originalTarget still equals the goal the athlete typed, divided by the distance they typed, `
  + `in ${p5cls.length - p5origBad.length} of ${p5cls.length} builds`
  + (p5origBad.length ? ' — first miss: ' + p5origBad[0] : ''));

// ── E12 — the note for the class, TYPED HERE from coach's ruling ──
const E12 = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
let e12seen = 0, e12bad = [];
for(const r of p5cls){
  for(const s of runSessions(r.prog)){
    if(!/Interval/i.test(s.st)) continue;
    if(s.note === E12){ e12seen++; continue; }
    // A cutback week owns its own note by an older ruling and is not E12's business.
    if(/^CUTBACK WEEK:/.test(s.note)) continue;
    if(e12bad.length < 3) e12bad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} W${s.w} reads |${s.note.slice(0, 80)}|`);
  }
}
ok(e12bad.length === 0 && e12seen > 0, `P5f E12 — every non-cutback interval week in this class carries `
  + `coach's ruled sentence verbatim and nothing else: ${e12seen} interval weeks across ${p5cls.length} `
  + `builds (0 carrying the dampened branch's "needs more weeks" text, which is false for an athlete `
  + `whose goal is already met, and 0 carrying the generic Zone 5 text this class used to get)`
  + (e12bad.length ? ' — first miss: ' + e12bad[0] : (e12seen ? '' : ' — the sentence never appeared')));
// The copy rule, applied to the string the athlete actually reads, not to the literal above.
const E12_SEEN = (() => { for(const r of p5cls) for(const s of runSessions(r.prog))
  if(/Interval/i.test(s.st) && !/^CUTBACK WEEK:/.test(s.note)) return s.note; return ''; })();
const MIDDASH = /\\s[—–-]\\s/;
ok(E12_SEEN !== '' && !MIDDASH.test(E12_SEEN) && E12_SEEN === E12,
  `P5g E12 obeys the standing copy rule: no mid-sentence hyphen or dash in the sentence this class `
  + `reads (/\\\\s[—–-]\\\\s/ finds nothing), and the rendered string is byte-identical to the ruling`
  + (MIDDASH.test(E12_SEEN) ? ' — reads: |' + E12_SEEN + '|' : ''));
""")

fail = False
for name, old, new in EDITS:
    n = src.count(old)
    print('  gate anchor %-46s count=%d' % (name, n))
    if n != 1:
        fail = True
        print('    ABORT: expected exactly 1 occurrence')
if fail:
    sys.exit('ABORTED: no bytes written')
for name, old, new in EDITS:
    src = src.replace(old, new, 1)
io.open(GATE, 'w', encoding='utf-8').write(src)
print('WROTE %s' % GATE)

# ── sabotage: one mutation per ruled behaviour of E7/E12 ──────────────────────
muts = json.loads(io.open(SAB, encoding='utf-8').read())
before = len(muts)
NEW = [
{
  "name": "M14 -> E7 is reverted: the clamp is dropped and the progression works on the ENTERED goal again, so an athlete whose goal is at or slower than the pace they already run at the goal distance is parked on the goal for the whole block. _originalTarget and _goalMet are untouched and still read correctly, so the metas look right and only the prescribed seconds are wrong",
  "anchor": "    const targetPace   = Math.min(enteredTarget, initialPace);",
  "replacement": "    const targetPace   = enteredTarget;",
  "gate": "gates/g202_pace_anchor.js",
  "note": "NAMED TRIP: g202_pace_anchor P5b, the row that says the class holds ONE pace and that pace is the gate's own HAND anchor. It must go red across the whole class (114 of 360 builds in this lattice) with a first miss of the form 'got [420 420 420 420 420 420], want 370.7 every week'. P5b is the declared target and not P5: P5 scopes itself to the IMPROVING segment and is untouched by this mutation, which is exactly why E7 needed its own row. EXPECTED COLLATERAL, DISCLOSED: none. P5d stays GREEN, and that is the point of listing it separately — _dampened is false on both sides of this mutation (rawImprovement is negative, weeklyImprovement is the same negative number, and the strict less-than is false either way), so a gate that only asserted the dampener would ship this mutant with an athlete prescribed slower work than they already run. P5e GREEN (_originalTarget reads enteredTarget directly). P5f and P5g GREEN: _goalMet is computed above the clamp and still true, so the note is still correct while the numbers under it are not. P1..P4 GREEN, Q1..Q8 GREEN (the pinned PRT TING cfg's goal is FASTER than its anchor, so E7 never reaches it). B1 GREEN: HALF_MANNY is NRC."
},
{
  "name": "M15 -> E12 is reverted: the goal-already-met branch is removed, so the class falls through to the generic Zone 5 interval note. Every prescribed second is untouched. The athlete is told to build from 4 reps to 10 and given no word about the goal they entered being one they already beat",
  "anchor": "          } else if(pp._goalMet) {\n            note = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';\n",
  "replacement": "          } else if(false) {\n",
  "gate": "gates/g202_pace_anchor.js",
  "note": "NAMED TRIP: g202_pace_anchor P5f, which compares every non-cutback interval note in the class against coach's E12 sentence TYPED IN THE GATE. It must go red with a first miss beginning 'W1 reads |INT — Interval: Zone 5 (95%+ max HR)'. P5g must go red with it and is listed as the second half of the same claim rather than as collateral: P5g asserts the RENDERED string is byte-identical to the ruling and carries no mid-sentence dash, and the generic note this mutation restores contains ' — ' twice, so a revert that merely reworded E12 would be caught by P5f while a revert that dropped it entirely is caught by both. P5b, P5d and P5e stay GREEN: this mutant ships a correct program described wrongly, and a suite that only checked the seconds would pass it. B1 GREEN — HALF_MANNY's digest cannot see a run_pace_goal note."
},
{
  "name": "M16 -> _dampened is forced true for the goal-already-met class. The clamp still holds and every prescribed second is correct, but the engine now says the athlete's goal is out of reach when in fact they have already met it, and the dampened branch takes the note back",
  "anchor": "    paceProgression._dampened        = weeklyImprovement < rawImprovement;",
  "replacement": "    paceProgression._dampened        = goalAlreadyMet || weeklyImprovement < rawImprovement;",
  "gate": "gates/g202_pace_anchor.js",
  "note": "NAMED TRIP: g202_pace_anchor P5d, the row that says nothing in this class is dampened because the goal is already met rather than out of reach. It must go red across all 114 class builds with a first miss of the form 'dampened=true'. WHY THIS MUTATION EXISTS SEPARATELY FROM M14: M14 breaks the NUMBERS and leaves the metas right; M16 breaks a META and leaves the numbers right. Only a mutation in this direction shows that P5d is a live row rather than a restatement of P5b. EXPECTED COLLATERAL, DISCLOSED: P5f and P5g stay GREEN, because E12's branch is tested ABOVE the dampened branch and still wins — which is the branch ORDER being proved by a mutation rather than by reading the source. P4b must go red: 'every dampened build improves at EXACTLY the table rate' now takes in 114 builds whose weekly gain is 0, and P4c's dampened count jumps by the same 114, so gatekeeper should read P4c's printed count as the confirmation that this mutant landed where it claims. P5b GREEN (Math.min is untouched). Q1..Q8 GREEN: the pinned cfg is already dampened for the right reason. B1 GREEN."
},
]
have = set(m['name'] for m in muts)
for m in NEW:
    if m['name'] in have: sys.exit('ABORTED: duplicate mutation name ' + m['name'])
muts.extend(NEW)
io.open(SAB, 'w', encoding='utf-8').write(json.dumps(muts, indent=2, ensure_ascii=False) + '\n')
print('WROTE %s  (%d -> %d mutations)' % (SAB, before, len(muts)))
