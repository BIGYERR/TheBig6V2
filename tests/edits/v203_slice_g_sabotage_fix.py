#!/usr/bin/env python3
# V203 slice G, second pass on tests/sabotage/v203.json.
# The first draft of M11 and M13 were MUTATION DEFECTS, caught by running them: each
# deleted a substring the gate's section-0 version predicate greps for, so the gate
# SKIPPED every row and reported PASS 4 FAIL 1 on 'the D117/D118/D119 surface MUST
# exist'. That is a trip on the wrong row — the substantive claim was never evaluated,
# and a spec that accepted it would read as proof of a gate that never ran. Rewritten
# so the SURFACE TEXT survives and only the BEHAVIOUR moves. Three notes are also
# corrected against the measured FAIL rows: a note that overstates which rows go red is
# the same defect as a mutation that trips nothing, one step later.
import io, json, os, sys

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPEC = os.path.join(R, 'tests', 'sabotage', 'v203.json')
html = io.open(os.path.join(R, 'index.html'), encoding='utf-8').read()
spec = json.load(io.open(SPEC, encoding='utf-8'))
by = {m['name'].split(' ')[0]: m for m in spec}
for k in ('M7','M11','M12','M13','M15'):
    if k not in by: sys.exit('ABORT: %s missing from the spec' % k)

# ── M11 rewritten: the carry is keyed to the wrong sport ──────────────────────
by['M11']['name'] = ("M11 -> D118's carry is keyed to the wrong sport: the run switch no longer matches, so the mile fields "
  "are rebuilt for a sport that never has one and dropped for the sport that does. Nothing throws and nothing looks broken. "
  "The athlete switches from the half to a 10K and the mile time they typed in week 3 is silently gone, so every pace in the "
  "new program falls back to the experience default and the whole plan re-paces without a word on screen")
by['M11']['anchor'] = "    ...(sport==='run'&&prev.mileBestMins!==undefined&&prev.mileBestMins!==''"
by['M11']['replacement'] = "    ...(sport==='bike'&&prev.mileBestMins!==undefined&&prev.mileBestMins!==''"
by['M11']['note'] = (
  "NAMED TRIP: g203_ceiling section 3, row 'mileBestMins PRESERVED across the switch', with 'mileBestSecs PRESERVED across "
  "the switch' and 'mileBestSrc PRESERVED across the switch' red beside it, and section 3d's 'ROUND TRIP: half -> 1.5mi pace "
  "goal -> half rebuilds the ORIGINAL program' and 'back on run_half the anchor survived both hops' red as the coaching "
  "consequence rather than the storage shape. "
  "WHY IT IS SHAPED THIS WAY, AND IT IS THE LESSON OF THIS SWEEP: the first draft deleted the carry outright, which also "
  "deleted the string section 0 greps for ('commitGoalChange carries mile'). The gate then SKIPPED and reported PASS 4 FAIL "
  "1 on the version predicate — a trip, and a worthless one, because not one D118 row had run. A mutation must leave the "
  "surface predicate satisfied and move the BEHAVIOUR, or it tests the grep instead of the ruling. "
  "WHAT DISCRIMINATES: section 3b must STAY GREEN IN FULL — it is the goal with no prior mile, where carrying nothing is the "
  "right answer, so it cannot tell mutant from artifact and section 3 can. Section 3c (the bike switch) stays GREEN too, "
  "including 'the bike goal gains no mileBestMins': the bike cfg has no mile to carry, so the misrouted guard is still false "
  "there and no phantom field appears. 'baseline still DROPPED as D5 wrote it' stays GREEN, pinning the trip on the D118 "
  "addition rather than on a wholesale rewrite of next. "
  "EXPECTED COLLATERAL: none. Sections 1, 2, 2b, 2c, 2d, 2e, 4, 5 stay GREEN: no card is built differently, this is a "
  "cfg-write path only.")

# ── M13 rewritten: the guard tests undefined instead of truthiness ────────────
by['M13']['name'] = ("M13 -> the edited guard tests `a.from !== undefined` instead of truthiness, so a null `from` walks "
  "straight into a branch that dereferences it and the provenance line throws. This is the null-versus-undefined slip in its "
  "most ordinary form, and in the app it is a render that dies rather than a sentence that lies: a different failure from M12 "
  "and one that has to be caught by a different row")
by['M13']['anchor'] = "  if(a.kind === 'edited' && a.from){"
by['M13']['replacement'] = "  if(a.kind === 'edited' && a.from !== undefined){"
by['M13']['note'] = (
  "NAMED TRIP: g203_ceiling section 4b, row 'edited with no from RENDERS (the sentence did not throw)', with 'edited with no "
  "from falls to the plain entered sentence' and 'edited with from undefined behaves the same' red beside it. The third row "
  "is red because the two degenerate shapes now DIVERGE: from:null throws, from:undefined still falls through cleanly, and "
  "the ruling says both are the same anchor with the same sentence. "
  "WHY IT IS SHAPED THIS WAY: the first draft dropped the `&& a.from` conjunct outright, which deleted the exact substring "
  "section 0 greps for ('edited provenance branch') and made the gate SKIP — PASS 4 FAIL 1 on the version predicate, with "
  "every D119 row unevaluated. The rewritten form keeps the surface text and moves only the semantics. "
  "WHAT DISCRIMINATES, AND READ THIS ONE CAREFULLY: 'edited with no from does NOT print \"no mile time was entered\"' must "
  "STAY GREEN here, and it is green for a HOLLOW reason — a sentence that threw prints nothing at all, so it cannot print "
  "that phrase either. That is exactly why the RENDERS row was added beside it: without it, a thrown render would have "
  "scored as a pass on the negative row, and a render that crashes reads as 'no failures' to anything that only asks what a "
  "string does not contain. M12 and M13 are the two halves of one guard and they trip different rows, which is why both are "
  "in the spec. Section 4 stays GREEN: every row there supplies a real `from`, so nothing dereferences null. "
  "EXPECTED COLLATERAL: none. Sections 1, 2, 2b, 2c, 2d, 2e, 3, 4c, 4d, 5 stay GREEN.")

# ── notes corrected against the MEASURED fail rows ────────────────────────────
by['M7']['note'] = by['M7']['note'].replace(
  "EXPECTED COLLATERAL, DISCLOSED AND MEASURED, NOT NOISE: section 2d goes red too — all twelve run_base ceiling and dose.cap rows across both anchors.",
  "MEASURED: 29 rows red in total. The four sweeps also take 'no card anywhere prints a ceiling that is not 9:58/mi' (and its 12:40 twin), which is the row that says the ceiling belongs to THIS athlete's row. "
  "EXPECTED COLLATERAL, DISCLOSED AND MEASURED, NOT NOISE: section 2d goes red too — the four '_steadySecL:'/'_steadySec:' ceiling rows and the four dose.cap rows across both anchors, plus section 2e's '8:00 run_base cards print 9:58/mi and 10:30 run_base cards print 12:40/mi'. The four 2d PAIRING rows stay GREEN: the Around pace is the row's Recovery column and this mutant does not touch Recovery.")
by['M7']['note'] = by['M7']['note'].replace(
  "Sections 2b, 2c, 3, 4 and 5 stay GREEN", "Sections 2b, 2c, 3, 4 and 5 stay GREEN")

by['M12']['note'] = by['M12']['note'].replace(
  "with 'edited with no from falls to the plain entered sentence' and 'edited with from undefined behaves the same' red beside it.",
  "with 'edited with no from falls to the plain entered sentence' red beside it. MEASURED: exactly those two rows and no others. "
  "'edited with from undefined behaves the same' stays GREEN and is named here so nobody reads it as a pin on this mutant: both degenerate shapes fall through the same narrowed branch to the same wrong sentence, so a row that compares them to EACH OTHER cannot see it. That is what the typed-out expected sentence is for.")

by['M15']['note'] = by['M15']['note'].replace(
  "and 'mile 8:00 _steadySec: the Around pace is the SAME row\\'s Recovery (10:30/mi)' — that last one is the pairing row, and it is the one that would catch a wrong row even if the wrong row happened to produce a plausible number. The 10:30 counterparts go red with them (760 -> 695).",
  "and their 10:30 counterparts (760 -> 695). MEASURED: exactly four rows red. "
  "The two '_steadySec: the Around pace is the SAME row\\'s Recovery' rows stay GREEN, and they are named here so they are not mistaken for pins on this mutant: the Around pace is read straight off _row and this mutation does not touch it. They pin the OTHER half of the sentence, and together with the cap rows they are what make the pairing claim — both numbers are tied to the same hand-table row, so the two cannot drift apart unnoticed in either direction.")

for k in ('M11','M13'):
    c = html.count(by[k]['anchor'])
    print('%s anchor count=%d %s' % (k, c, 'OK' if c == 1 else 'NOT-APPLIED RISK'))
    if c != 1: sys.exit('ABORT: %s anchor is not unique' % k)

io.open(SPEC, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE %s (%d mutations)' % (SPEC, len(spec)))
