import io, json, sys
src = io.open('index.html', encoding='utf-8').read()
spec = json.load(io.open('tests/sabotage/v202.json', encoding='utf-8'))
existing = set(m['anchor'] for m in spec)

NEW = [
 {
  "name": "M8 -> D111 (E8) is reverted to the proportion it replaced: the interval pace goes back to weekPace x 0.95. Nothing looks missing — every card still prints a target a little faster than the goal — but the gap is no longer guide A's 4 seconds per 400m, and it drifts with the athlete's speed: about 3.75 s per 400 at a 5:00 mile and about 9 s per 400 at a 12:00 mile, more than twice what A prescribes for exactly the population this guide serves",
  "anchor": "        const intPace    = weekPace ? Math.max(pp._realisticTarget - INT_PACE_GAIN_SEC_PER_MILE, weekPace - INT_PACE_GAIN_SEC_PER_MILE) : null;",
  "replacement": "        const intPace    = weekPace ? Math.max(pp._realisticTarget * 0.95, weekPace * 0.95) : null;",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D1, which measures the gap between the two numbers the card itself prints (the prescribed interval pace and the goal pace beside it) and requires it to be exactly 16 s/mi across goals from about 6:00 to 12:39/mi. A proportion cannot hold a constant gap across that span; D1b proves the two rules disagree at 5 of 6 hand goal paces, so D1 cannot be satisfied by both. D7 goes red with it (the pinned after-grid reads 484 again, not 493) and g202_pace_anchor Q8 goes red on the same two cards. D2 stays GREEN and MUST: it is pure hand arithmetic in A's units and the app is not in it — a suite that only checked D2 would ship this mutant. D4 follows the target, so the recovery band moves with it and stays self-consistent: the recovery rows do NOT catch this."
 },
 {
  "name": "M9 -> the 16 s/mi is replaced by 4, the per-400m number used as if it were per mile. This is the transcription slip D111 is one conversion away from: guide A states the rule in seconds per 400m and the engine prescribes in seconds per mile",
  "anchor": "        const INT_PACE_GAIN_SEC_PER_MILE = 16;   // 4 s per 400m x 4 quarters",
  "replacement": "        const INT_PACE_GAIN_SEC_PER_MILE = 4;   // 4 s per 400m x 4 quarters",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D1 — the printed gap becomes 4 s/mi instead of 16. The gate's own 16 is built from two typed factors (4 seconds per 400m, 4 quarters per mile) and never read from the app, so moving the app's constant moves one side only. D7 red. D2 stays GREEN for the same reason as M8. Recovery (D4) stays self-consistent and does not catch it."
 },
 {
  "name": "M10 -> D105's sequencing (E9) is dropped: the INT pace index goes back to reading the calendar week directly, so the pace clock tightens every week while the athlete is still building from 4 repeats to 8. Both dimensions move at once, which is the defect the ruling names",
  "anchor": "        const _intIdx = _int8Wk ? Math.max(0, _ppIdx - (_int8Wk - 1)) : 0;",
  "replacement": "        const _intIdx = _ppIdx;",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D3, which applies A 259-263 to the rep grid the build reports and requires every INT week up to and including the first 8-rep week to carry the WEEK-1 target. Under the mutation week 2 is already faster while reps are still 4. D7 red (the pinned grid reads 493,493,493,493,493,493) and g202_pace_anchor Q8 red on W6. D1 stays GREEN and must: the gap between the printed pace and the printed goal is still exactly 16 s/mi, because E8 is untouched — this mutation is invisible to the pace rule and only the sequencing row sees it. D4 stays self-consistent too. NOTE the loop above it survives, so _int8Wk is still computed and the file still reads as if the rule were live: that is the point of this mutation."
 },
 {
  "name": "M11 -> the recovery band collapses to the ratio the fixed 200m literal actually delivered. Measure found the old 'walk or jog 200m' was 0.685x the work interval across 11,880 of 11,880 INT sessions; this mutation keeps the new m:ss sentence and the new dose field and simply prescribes that measured ratio, so the card still LOOKS like it obeys guide A",
  "anchor": "      const lo = Math.round(work * 2), hi = Math.round(work * 2.5);",
  "replacement": "      const lo = Math.round(work * 0.685), hi = Math.round(work * 0.685);",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D4, which recomputes the band by hand from the session's own target and the typed 2 and 2.5 multipliers, and D4b, which requires every printed band to sit inside A's 2 to 2.5 x the work interval (A 248-249, A 268-270, and both hand-transcribed table headers at doctrine/ptg2020_tables_p13_14_16_17.txt lines 9 and 41). D7 red on the pinned 4:05 to 5:06. D5 stays GREEN: the 200m literal really is gone, the sentence really does print m:ss to m:ss, and only the arithmetic lies. A gate that only asked whether the old string had been removed would ship this mutant."
 },
 {
  "name": "M12 -> the rec band is dropped from the dose while the sentence keeps printing it. The athlete still reads the right recovery in the card, but every downstream reader of the structured dose (the log form, anything that later wants to compare prescribed against actual) sees an INT session with no recovery prescription at all",
  "anchor": "          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgt, rec:{lo:_rec.lo, hi:_rec.hi}};",
  "replacement": "          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgt};",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D4 ('dose carries no rec band') and D7 (the pinned band on all six weeks). D5/D5b stay GREEN because the printed sentence is untouched, which is exactly the asymmetry this mutation exists to expose: the ruling put the band on the ITEM as well as in the prose, and a gate reading only the prose cannot tell."
 },
 {
  "name": "M13 -> E11 is reverted: the warm-up goes back to the '5 min easy warmup + cooldown' fragment that appears in neither guide. Guide A is silent on warm-up, so under D112 limb 2 guide B p8 governs, and B asks for 10-15 minutes or more plus 4-5 bursts of 15 to 30 seconds. Five minutes is a third of the floor before a Zone 5 session",
  "anchor": "    const _INT_WARMUP = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';",
  "replacement": "    const _INT_WARMUP = '5 min easy warmup + cooldown.';",
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D5b, which requires B p8's sentence verbatim on every INT card and the old fragment on none. The expected sentence is typed in the gate from coach's ruling, never read from the app. A0d cross-checks that B p8 still carries the source when the gitignored doctrine text is present. D4 and D7 stay GREEN: the recovery arithmetic is untouched, so only the warm-up row sees this."
 },
]

bad = False
for m in NEW:
    c = src.count(m['anchor'])
    print('anchor %-4s count=%d (want 1)' % (m['name'].split(' ')[0], c))
    if c != 1: bad = True
    if m['anchor'] in existing:
        print('  DUPLICATE anchor with an existing mutation'); bad = True
    if src.count(m['replacement']) != 0:
        print('  NO-OP: replacement text already present'); bad = True
if bad:
    sys.stderr.write('ABORT: anchors not clean. Nothing written.\n'); sys.exit(1)

spec.extend(NEW)
io.open('tests/sabotage/v202.json','w',encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE tests/sabotage/v202.json — %d mutations total (%d new)' % (len(spec), len(NEW)))
