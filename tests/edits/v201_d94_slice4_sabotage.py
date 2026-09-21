#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V201 / D94 — SLICE 4 of 4, part 2: emit tests/sabotage/v201.json.

Every anchor is READ OUT OF index.html rather than retyped, so no anchor can drift on a
transcription error (the '×5–6' detail string carries a multiplication sign and an EN dash).
Each anchor is asserted count==1 here; the first miss aborts with NOTHING written. That is
the same guarantee the runner enforces, taken one step earlier so a NOT-APPLIED row can
never reach gatekeeper.

index.html is NOT modified by this script. It is read only.

WHAT IS NOT IN THIS SPEC, AND WHY. The ruling asked for two further mutations against
tests/harness.js (the V201 era row deleted; the V201 reference replaced with a wrong
literal). tests/sabotage.py mutates the CANDIDATE HTML ONLY: it reads `src` from argv[1],
counts the anchor in `src`, and writes one mutated .html. There is no "file" key in the
schema and no spec in tests/sabotage/ uses one. A harness-anchored row would therefore
read NOT-APPLIED, which is a mutation defect and fails the sweep. They are reported to
§12 instead of being papered over. M4 below is the APPLICABLE stand-in for the first of
them and is labelled as such; it is for coach/gatekeeper to accept or reject.
"""
import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'index.html')
OUT = os.path.join(ROOT, 'tests', 'sabotage', 'v201.json')
src = io.open(APP, encoding='utf-8').read()


def anchor(start, end):
    """Lift the exact bytes between two unique landmarks, inclusive."""
    i = src.find(start)
    j = src.find(end, i)
    if i < 0 or j < 0:
        print('LANDMARK MISS %r / %r' % (start[:40], end[:40]))
        sys.exit(1)
    return src[i:j + len(end)]


MAINPOST = anchor('  const __mainPost=sections.some(', '_isPostChain(it.name)));')
FORLOOP = '  for(let i=0;i<sections.length&&!__mainPost;i++){'
CLAUSE = MAINPOST + '\n' + FORLOOP
# NOT `{name:_sp.b,...}` on its own: `_sp` is the name EVERY superset pair in buildSections
# uses, and the first match of that fragment is the PRESS pair (×15, _isOneArmPress), which
# is count==1 for its own detail string and would have mutated the wrong block silently.
# The landmark is the Pull superset A push line itself, so the anchor cannot be anything else.
VPULL_ITEM = anchor("        s.push({label:'Pull superset A'", "});")
VPULL_REPL = VPULL_ITEM.replace("{name:_sp.b,", "{name:_sp.a,", 1)
if 'Pull superset A' not in VPULL_ITEM or '_sp.b' not in VPULL_ITEM:
    print('ABORT: the Pull superset A landmark did not capture the b-slot.')
    sys.exit(1)
META = '<meta name="ia-version" content="201">'

# the narrowed regex: ^main\b is dropped, so 'Main — Deadlift' stops matching
MAINPOST_NARROW = MAINPOST.replace('/^main\\b|^primer|^power\\b|^strength\\b/',
                                   '/^primer|^power\\b|^strength\\b/', 1)

MUTS = [
 {
  "name": "M1 -> the D94 clause is deleted outright: __mainPost goes away and the posterior pre-pass runs unsuppressed again, exactly as V200 and V199 run it. A conditioning Kettlebell swing in Pull superset B once more outscores Pull superset A on a day whose Main is already a deadlift variant, and the day loses its only vertical pull",
  "anchor": CLAUSE,
  "replacement": FORLOOP.replace('&&!__mainPost', ''),
  "gate": "gates/g200_pull_arbitration.js",
  "note": "NAMED TRIPS: g200 P2, which must read EXACTLY 150 violations of 210 both-enter deload pull cards, AND g200 P4, which must read 0 of 150 reaching the shipped card. Those two numbers are the acceptance property at the head of the gate: this mutant IS the V200 artifact as far as the pull arbitration is concerned, and g200 already declares what V200 reads. A PASS here, or a FAIL by any count other than 150, means the gate cannot tell D94 from its predecessor and the re-pin has failed. EXPECTED COLLATERAL, DISCLOSED SO THE LIST IS NOT MISTAKEN FOR EXHAUSTIVE: g200 P7 also goes red at 0 of 150, because the whole point of the defect is that Pull superset B carries no vertical pull; that is M1 being the defect, not a leak between pins, and M3 below is the narrow probe that reaches P7 without touching the arbitration. STAYING GREEN, AND THEY MUST: P1 (family conservation holds at 1,470 either way; V199 splits it A 690 / B 780), P2c and P6 (read off p1, upstream of the arbitration), P2d (same, read off p1), A1-A6, B1 (the clause does not fire on HALF_MANNY). GATEKEEPER: confirm P2 BY ITS COUNT, not merely that the gate went red."
 },
 {
  "name": "M2 -> the __mainPost label regex is narrowed so it no longer matches the Main-class labels it must: the ^main\\b alternative is dropped and 'Main — Barbell deadlift' stops reading as Main-class. The clause, the loop guard and the suppression wiring all survive and read correct on sight; only the set of labels the test recognises is wrong",
  "anchor": MAINPOST,
  "replacement": MAINPOST_NARROW,
  "gate": "gates/g200_pull_arbitration.js",
  "note": "NAMED TRIP: g200 P2, again EXACTLY 150 violations of 210. WHY THIS EXISTS ALONGSIDE M1: M1 removes the clause and any source-text check would catch it on sight. M2 leaves a clause that a reader scanning the diff would sign off, and breaks only the label set it recognises. On a deload pull day the Main is labelled 'Main — <backMain>' and nothing else in the positive-limb cards carries a primer, power or strength label, so __mainPost collapses to false on all 150 and the pre-pass runs. This is the mutation that says P2 tests the RULE and not the presence of the line. IT IS ALSO THE SPLIT-LENS PROBE: the gate keeps its OWN copy of KMAIN in cls(), proved by A5 against a hand-typed probe, so a narrowing of the APP's copy moves the app and leaves the gate's lens where it was. If the gate called the app's predicate instead of carrying its own, this mutation would move both sides together and P2 would survive. EXPECTED COLLATERAL, DISCLOSED: P4 (0 of 150) and P7 (0 of 150) go red for the same downstream reason as M1. P2d stays GREEN by construction, which is the split-lens point restated. GATEKEEPER: confirm the count is 150 and not some partial figure; a partial figure would mean some other label is standing in for the Main and the clause is load-bearing somewhere unruled."
 },
 {
  "name": "M3 -> the vertical pull is emptied out of Pull superset A at the point of construction: the pair's b-slot (ex.backPull, the day's only overhead pull) is replaced by a second copy of the a-slot row. The arbitration is untouched, D94 still fires, Pull superset A still wins and still reaches the shipped card, and the card the athlete holds still has no vertical pull on it",
  "anchor": VPULL_ITEM,
  "replacement": VPULL_REPL,
  "gate": "gates/g200_pull_arbitration.js",
  "note": "NAMED TRIP: g200 P7, which must read 0 of 150 positive-limb cards shipping a vertical pull, with the V_PULL name census printed EMPTY and the P7 MISS examples showing a Pull superset A holding the same row twice. THIS IS THE MUTATION P7 EXISTS FOR AND NO OTHER PIN IN THE FILE CAN SEE IT: P1 counts labels, P2 and P4 track WHICH BLOCK survives, P2c, P2d and P6 read p1 posterior items. Every one of them stays GREEN here, because the block, the label and the arbitration are all exactly as D94 leaves them and only the MOVEMENT is gone. D94 is a ruling about a movement, so a suite that could not see this could not see the ruling. EXPECTED COLLATERAL, DISCLOSED: g200 B1 goes red, because HALF_MANNY builds pull days and its progDigest moves off the V201 row of MANNY_DIGEST_BY_VERSION. That collateral is not noise, it is the SECOND ruled harness mutation arriving by the only route this runner has: 'the V201 reference replaced with a wrong literal' and 'the program moved under a correct literal' are the same observable at B1, a digest mismatch printed with both sides. GATEKEEPER: the trip must be P7 BY NAME. If P7 survives this mutation it is not reading the shipped card and it is to be rewritten, not accepted."
 },
 {
  "name": "M4 -> the candidate declares ia-version 202, a version no era row exists for, so every gate that keys a fixture digest to the artifact's own version looks its row up and finds nothing. STAND-IN, NOT THE RULED MUTATION: the ruling asked for the harness's V201 row to be DELETED; tests/sabotage.py can only mutate the candidate HTML, and this is the same observable reached from the candidate side",
  "anchor": META,
  "replacement": META.replace('"201"', '"202"'),
  "gate": "gates/g199_deload_arbitration.js",
  "note": "NAMED TRIPS: g199 B1 and g199 B2, both of which must print NO ROW — literally 'matches the V202 row of MANNY_DIGEST_BY_VERSION (NO ROW)' plus the tail 'an unruled digest move' — and NOT a digest mismatch. The distinction is the whole claim: B1 and B2 are written so that a MISSING row fails loudly and cannot be satisfied by accident, and this is the only mutation in the suite that exercises the missing-row limb rather than the mismatch limb. B2 must trip alongside B1; B2 is what stops B1 being vacuous, and a B2 that survived a missing row would mean the deload-off row is not actually keyed to the artifact. THE COLLATERAL IS FIVE GATES WIDE AND THIS LIST IS THE WHOLE OF IT, ENUMERATED SO NO READER TAKES THE DECLARED TARGET FOR THE FULL BLAST RADIUS (the §12 entry against tests/sabotage/v200.json M2 is exactly the defect of not doing this): MANNY_DIGEST_BY_VERSION is read by FIVE gate files — gates/g197a_pool_static.js, gates/g197b_sweep.js, gates/g198_posterior_floor.js, gates/g199_deload_arbitration.js and gates/g200_pull_arbitration.js — and every one of them goes red on this mutant for the same single reason. It was left as ONE mutation rather than split into five: splitting would need five identical mutants differing only in the 'gate' field, which would report five trips for one defect and make the sweep's tripped-count read as five independent proofs when it is one. One mutation with the radius written out is the honest shape. g199 is the DECLARED target because B1/B2 there carry the deload-off pair, which is the strongest form of the claim. NOTHING ELSE IN g199 MOVES: the program is byte-identical, only the declared version string changed."
 },
]

bad = [(m['name'][:12], src.count(m['anchor'])) for m in MUTS if src.count(m['anchor']) != 1]
if bad:
    for t, n in bad:
        print('ANCHOR MISS  %-14s count=%d' % (t, n))
    print('ABORT: nothing written.')
    sys.exit(1)
for m in MUTS:
    if m['replacement'] == m['anchor']:
        print('ABORT: %s replacement identical to anchor.' % m['name'][:12])
        sys.exit(1)

io.open(OUT, 'w', encoding='utf-8').write(json.dumps(MUTS, ensure_ascii=False, indent=2) + '\n')
print('WROTE %s  (%d mutations, every anchor count==1)' % (OUT, len(MUTS)))
for m in MUTS:
    print('  %-4s %-46s -> %s' % (m['name'].split(' ')[0], m['anchor'].strip()[:46].replace('\n', ' '), m['gate']))
