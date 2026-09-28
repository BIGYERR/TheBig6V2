# P-SAFEPACE — THE GOAL IS THE ATHLETE'S. THE COACH SAYS WHAT THE BLOCK REACHES. (coach, provisional, V207 baseline)

Measured this session: `node tests/measure/v223_safe_pace_offer.js scratchpad/base.html` (ia-version 207, clock
2026-09-22 21:16). Every number below is from that run. Reads: `base.html` :2229 to :2264, :2276 to :2365,
:2396 to :2500, :2672, :2750 to :2925, :3061 to :3215, :4200, :4231; doctrine Guide A p.11 to 12, Guide B
Table 6; handoff §11f (D9 :942, D106a :1159, D110a :751, D116 :771).

## Mario's question, answered in one breath
"Use this pace instead" overwrites the goal you typed with the number on the button. It keeps your original
nowhere and there is no way back except retyping. It ignores your mile: the number is computed from the
intermediate default of 9:30 per mile, so an 8:00 miler is offered a slower goal than he already runs. And
re-entering the mile does not touch the goal because the mile field repaints only its own advisory.

## Before (Mario's screen: 1.5 mi in 12:00, mile 8:00, intermediate, test 2026-10-20, run only)
```
header   Program length: 6 weeks — based on your longest cardio goal and experience level.
callout  4 weeks isn't enough time to hit this pace safely. Recommended: at least 6 weeks.
         Your program ends on your test. 5 weeks. The taper lands in front of it.
         In 4 weeks you can safely reach 1.5mi in 14:15 (9:30/mi) without exceeding safe progression limits.
         [Use this pace instead]        button #0a0a0a on --accent, contrast 1.10:1
after tap  goal 12:00 -> 14:15, targetTime "12:00" -> "14:15"; original kept nowhere; offer still 14:15;
           build totalWeeks 5 both ways, W1 paces identical, digest fce833db -> dc45da1a
21:17 screen  header 6, callout "Recommended: at least 11", red, offer 14:15   (45/168 edit sequences)
```

## Findings
**F1. The tap is a silent, irreversible overwrite.** `applySuggestedPace` (:2251) writes `targetMins`,
`targetSecs`, `targetTime`. Revert paths: 0. Ten writers of `targetMins` in the file, none a restore.

**F2. The dated offer is blind to the athlete.** `achievablePacePerMile` (:2229) seeds from `expCurrentPace`
(:2236, 690/570/450) and never reads the entered mile or the goal. Offer identical after the tap 2,592/2,592;
slower than the athlete's own mile 1,296/2,592 (beginner 720, intermediate 432, advanced 144); recommended
weeks rose after the tap 248/2,592. The undated surface, `assessRunPaceCeiling` (:2427), already inverts the
same model seeded `mileBest || expCurrentPace` and refuses to flag a target slower than current or within
45 s/mi (:2461). Two inversions of one model, one of them blind. On Mario's inputs the seeing one returns
null: 8:00/mi target against an 8:00 mile is not a gap.

**F3. None of this is doctrine.** Guide A p.11: "total work be increased no more than 10% per week. Think of
that as a maximum, with 5-8% being more ideal" (volume, not pace). SI pace: "slightly faster than the pace
of your most recent 1.5-mile run… about 4 seconds faster [per 400m]"; LI: "90-95% of the maximal pace you
could hold for that duration"; and "As your fitness and experience improve, you can go faster." Guide B
Table 6 week 0 is a timed 1.5-mile run. The guide keys every pace to the athlete's most recent test and gives
no rate of improvement and no formula for a reachable time N weeks out. The 3/5/7 s/mi/week `paceImprove`
table and the 0.65/0.85 age scalers carry no §11f ruling (0 hits on `paceImprove`, `weeksToPace`; D9 is
mile-entry validation and the 690 fold; D110a ruled the swim rate and says it "disagrees with run's D9
because the sports differ"). So the model is the app's planning heuristic, useful for sizing an undated
block, and the words "safely" and "without exceeding safe progression limits" claim an authority the
doctrine does not carry. Doctrine does carry one thing the offer violates: paces come from the athlete's own
recent time. V202 built the whole NSW run path on that.

**F4. Three inputs, three repaint sets, one timer.** Goal min/sec oninput repaints `#paceDisplayLine` and
`#paceFeasLine` (:2850, `updatePaceTime`, `updatePaceDisplay`). Mile oninput repaints `#paceFeasLine` (which
hides itself on event+dated, :2484) and `#mileAdvisory` (:2885, :2890). Date oninput repaints
`#raceDateFeedback` only (:2917). The header line is inline in `renderWizardStep` (:2760, :2903) and
repaints on a full render only. Returning to the step fires `setTimeout(updateRaceDateFeedback, 80)`
(:2672). The 21:17 screen is a goal or mile edit (no header repaint) followed by the date field's
callout-only repaint: 45/168 sequences.

**F5. Two week counts on one card.** `weeksUntil` = floor(28/7) = 4 is calendar weeks; `testWeekIndex` = 5
is program weeks (week 1 holds the start; it rounds Monday differences at :4234, so it is DST-safe). D106a
ruled the program ends on the test week, and the athlete will see "Week 5 of 5". The header's 6 is
`calcProgramLength` with its `max(6, …)` floor (:3208), which D106a's writer overrides at build.

**F6. Label contrast** 1.10:1 (#0a0a0a on `--accent` #181712, :2356); 2.79:1 on `--red`; the sibling button
in `paceCeilingOfferHTML` prints `var(--on-ink)` at 15.89:1.

**F7. Eleven mid-sentence em-dashes** on the screen; four more in states the measure did not screenshot.

## Ruling

**R1 (Mario's call). The button goes, on both surfaces. The sentence stays and reads the athlete.**
Remove the button from the dated card (:2356) and from `paceCeilingOfferHTML` (:2470); retire
`applySuggestedPace` (:2251) and `achievablePacePerMile` (:2229) once measure confirms no other caller
(analog of standing ruling 3: a function with no caller is a dead pin). One inversion survives,
`assessRunPaceCeiling`'s, seeded `mileBest || expCurrentPace`, with `L = _tw` on a dated test goal and
`L = calcProgramLength(...).weeks` otherwise; the 45 s/mi tolerance at :2461 stays as is (it is the file's
own number). The coaching argument: the goal is the athlete's statement of intent. The coach's job is to tell
him what the block reaches from where he is and let him decide. Silently rewriting his goal is not coaching,
and rewriting it from a default he never was is worse. On a dated test the length is already fixed by the
date (D106a), so a kept goal costs him nothing in structure. Whether it should still drive the late-week
ramp is M1 below; if it does, the cap belongs in the engine under its own D-code, never in a button that
edits the goal.
Counter: a one-tap accept saves retyping and guarantees the build aims at a reachable number; keep it,
store the entered goal, and add "Put my goal back". Why not: two more wizard states, a second button, and
the goal field is one tap away on the same screen.

Sentence, dated test goal, gap ≥ 45 s/mi from the entered mile (copy rule applied):
```
From your 8:00 mile, five weeks reaches about 1.5 mi in 12:00. Your goal is 10:30. Keep it or change it above.
```
No mile entered (or beginner, where the mile is not read):
```
You have not entered a mile time. From the intermediate default of 9:30 per mile, five weeks reaches about
1.5 mi in 14:15. Enter your mile above and this updates.
```
No gap: no sentence. Mario's own screen prints nothing here.

**R2 (session). One repaint.** One function, name builder's (`paintRunGoalPanel()`), computes `_tw`,
`recommended`, the ceiling and the countdown once from WD and repaints, synchronously, in one tick: the
header line (:2903, given an id), `#paceDisplayLine`, `#raceDateFeedback`, `#paceFeasLine`. Callers: goal
min/sec oninput, mile min/sec oninput, date oninput, the event/no-event toggle, and the tail of
`renderWizardStep` for `cardio_goal` in place of the 80 ms timer at :2672 (the DOM exists by then, as the
:2925 comment already relies on). No timers. `updatePaceFeasibility` and `updateRaceDateFeedback` become
its internals or are folded into it. Gate: over the measure's 168 sequences, header weeks == callout weeks
in 168/168 and the 21:17 screen reproduces 0/168.

**R3 (session). One number, the program's.** On a dated test goal every week number on the screen is
`_tw`: the header, the callout, the ceiling sentence. `weeksUntil` (P-RACEDATE's `raceCountdown().weeks`)
survives only for dated non-test goals. The header at :2903 reads `_tw` when a dated test goal is present,
else `calcProgramLength`; the :2758 comment ("the race date never…") predates D106a and is rewritten.
Card copy and colour, dated test goal:
```
_tw >= 2, no gap     (--run)     Your test is in week 5. The program ends on it. The taper lands in front of it.
_tw >= 2, gap        (--accent)  same sentence, then the R1 sentence.
_tw == 1             (--accent)  Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.
```
Never red on a test goal: red said "not enough weeks", and the weeks are not his to change. The D106a
under-a-week sentence keys on `_tw === 1`, not `weeksUntil < 1`: six days out across a Monday builds two
weeks (M3 confirms the lattice). "Recommended: at least 6 weeks" and "isn't enough time to hit this pace
safely" leave the test-goal card entirely; the 6 is the undated floor and means nothing to a man with a date.
Dated non-test goals keep their sentences, dashes removed:
```
diff > 0    Your 6-week program finishes 2 weeks before race day. Use the extra time to stay sharp.
diff == 0   Perfect timing. Your 6-week program peaks on race day.
diff < 0    4 weeks is short for this goal. The floor is 6. Your full 6-week program stays intact. Your race lands in week 4.
< 1 week    Less than a week away. Not enough time to train.
```

**R4. Label colour.** Moot under R1. If Mario keeps the button: `color:var(--on-ink)` on both card colours,
gate contrast ≥ 4.5:1 with the measure's WCAG oracle (M4 supplies the red number).

**R5. The dashes, copy for each** (source anchor, before, after):
```
:2753  run   'Outdoor or treadmill — pace, distance, race goals'      -> 'Outdoor or treadmill. Pace, distance and race goals.'
:2754  bike  'Spin bike or outdoor — intervals, FTP, distance'        -> 'Spin bike or outdoor. Intervals, FTP and distance.'
:2755  swim  'Lap pool or open water — structured sets'               -> 'Lap pool or open water. Structured sets.'
:2043  10K   '6.2 miles — solid aerobic base'                         -> '6.2 miles. A solid aerobic base.'
:2044  half  '13.1 miles — serious endurance'                         -> '13.1 miles. Serious endurance.'
:2045  full  '26.2 miles — the full distance'                         -> '26.2 miles. The full distance.'
:2046  pace  'Target distance + time — 1.5mi under 10 min, mile under 6, etc.'
                                                                      -> 'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.'
:2413  paceDisplayLine  '12:00 — 8:00/mi per mile'                    -> '12:00 is 8:00 per mile.'   (one unit word, once; today it prints "/mi per mile")
:2861, :2882  '(optional — personalizes your training paces)'         -> 'Optional. It sets your training paces.'
:2903  'Program length: 6 weeks — based on your longest cardio goal and experience level.'
                                                                      -> 'Program length: 6 weeks. Set by your longest cardio goal and your experience.'
                                                                         dated test goal: 'Program length: 5 weeks. Your test sets it.'
:2904  'Sessions rotate across training days — each sport gets dedicated days.'
                                                                      -> 'Sessions rotate across training days. Each sport gets its own days.'
:2920  'Tap to open calendar — the final weeks taper so you arrive fresh.'
                                                                      -> 'Tap to open the calendar. The final weeks taper so you arrive fresh.'
:2817  swimPaceLine, same shape as :2413                              -> same shape: '<time> is <pace> per 100.'
```
Spec separators inside a prescription stay (the copy rule exempts them). None of these strings is in a
doctrine transcription.

## AMENDMENT (standing ruling 7: two premises refuted by `v223_safepace_m.js`, Mario decided R1)

**Mario decided: the button goes (R1).** "Drop safely" is undecided; R1's sentence copy is HELD until measure's
pace-math archaeology (`v212_pace_math_origin.txt`) answers "who owns the pace math". R2 and R3 wiring stand.

**R1, re-ruled.** Two premises were wrong and the conclusion survives them.
Premise "a kept goal costs nothing in structure": refuted. Goal time changes `totalWeeks` in 20/243 paired
dated builds through D106a's gate at :7283 (`_testWeek <= totalWeeksPreview`): intermediate, no mile, test
41 days out, 12:00 builds 7 weeks ending on the test, 14:15 builds 6 with `_testWeek` null and the test
outside the program. That is not a reason to rewrite the goal; it is the gate reading the wrong dimension.
The date is the fixed dimension and the goal-derived length is a heuristic, so the length must follow the
date, never the goal. The button made it worse: its tap moved the example from pinned to unpinned. **Own
D-code, provisional P-TESTLEN**, because it re-rules a D106a gate Mario concurred with and moves
`totalWeeks` on athlete programs: on a dated test goal `_raceDateCappedWeeks = _testWeek` whenever
`_testWeek >= 1`, extending past the goal length up to the doctrine's 26-week table (Guide B Table 6);
beyond 26, the current "ends before the test" state stays and the copy says so. Counter: D106a's "within
the goal length" was deliberate; a 6-week block stretched to a test 20 weeks out is a base-then-block
shape, not a longer ramp. Measure first: distribution of `_twz - recommended` on the lattice, and what the
ramp does over an extended length.
Premise "if the goal drives the ramp, cap it in the engine": refuted, the cap exists (D101, :3759 to
:3776). On Mario's cfg 12:00 against 10:30 moves paces 1 s/mi; the goal also writes the INT note and the
test-day line and touches 1,788/5,240 sessions. Struck from R1. M1 closed: the goal legitimately shapes
paces under a ruled cap, which is exactly why it stays the athlete's.

**R3, null rows added.** `_tw` is null on two paths and the card must not say "test week only" on either:
```
_twz null (start snapped past the test by the D25 guard, :1910; 10/294 under a week)
    (--signal)  Your test is before your first training day. This program starts after it and does not include it.
_twz > recommended (test beyond the goal length, unpinned under today's gate)
    (--accent)  Your test is in week 8. This program is 6 weeks and ends before it.
```
Both are P-TESTLEN's to close (the D25 snap must not skip a test week; the length must reach the test).
Until then the card prints the truth of the build. `_tw` matched the date oracle 392/392; at 1 to 6 days
out it is 1 in 193, 2 in 91, null in 10, so the "this week" sentence keys on `_tw === 1` as ruled.
M5 closed: the header disagrees with the built length in 249/480 dated test builds and the name-step row
:3017 in the same 249 (beginner, test 2026-09-27: header 11, built 1). Both read `_tw` under R3; :3017
joins the list.

**R2, callers folded.** The one repaint function KEEPS the name `updateRaceDateFeedback`:
`gates/g207_test_calendar.js` reads it, and `offerShorterPlan` (:1984) and `applySeedData` (:2652) call it.
Zero caller churn, gate intact. `updatePaceFeasibility` and `updatePaceDisplay` become its internals; the
goal, mile, date and toggle handlers and the `renderWizardStep` tail call it; the 80 ms timer at :2672 goes.

## P-TESTLEN — COACH AUDIT OF THE M7 GRIDS (V209 baseline, `coach_testlen_doses.js`, clock 2026-09-22)

Printed this session from `base.html` (209) and `testlen_surgery.html`: 1 mi 6:00, beginner, 18-35, no mile,
test Thu 2027-02-04 (program week 20), recommended 9, rest sun/wed.

**Before (9 weeks, `_testWeek` null).** SI 4,4,5,5,6,6,7 ×400 then taper 4,4; interval pace 11:14 to 10:53;
LI 15 to 18 min continuous, taper 11; LSD 1.5/2 to 4.5/5 mi, taper 3.9/4.3, 3.3/3.7. No test day. The
block tapers into nothing and the athlete has eleven empty weeks before his test.

**After (20 weeks, `_testWeek` 20).** W1 to W3 identical. Cutback every fourth week (W4, W8, W12, W16: SI
3, 4, 5, 5 ×400 at the held pace, LI 11 to 14 min, LSD about 30% down). SI 4,4,5,(3),6,6,7,(4),8,8,8,(5),
8,8,8,(5),8,8, taper 4,4; interval pace 11:14 to 10:20, three seconds a week through the plateau. LI 15 to
20 min continuous through W11, then 2×12 (W13 to W15), 2×14 (W17, W18), taper 10. LSD 1.5/2 to 5.2/8
(W15), held at 8, taper 4.5/6.9. Test Thursday W20, "1 mi. Goal 6:00", rest after. Saturday long runs tier
to Post-Run Mobility from W10 (over 75 min on feet, D18).

**Verdict: the stretched progression is the doctrine's own progression, not padding.** Guide B Table 6 is
one concurrent 26-week schedule, LSD + CHI + INT from week 1, no base phase in front: LSD 3, 3.25, 3.5 …
building a quarter mile a week; CHI 15,15,16,16 … 20,20 then 2×12, 2×14, 2×16; INT 4,4,5,5,6,6,7,7,8,8,9,
9,10 … The after grid IS that table: CHI matches column for column (V205 D114 transcribed it), INT matches
to 8 and holds there because D135 caps it at Guide A's "Do not run or swim more than 8 intervals", and
Guide A says what to do on the plateau: "When you can complete all 8 intervals at high intensity, work on
gradually performing the intervals a little faster each week" (p.12), which the grid does (10:50 to 10:23
across W9 to W18). Beyond 26: "do not increase INT or CHI distances. Rather, focus on gradually and
progressively increasing intensity" (Table 6 note). The LSD ceiling of 8 mi is Guide A's "build up to
comfortably running 8-10 miles" (p.11). The before grid was the same table cut off at week 9 with a taper
stapled on; P-TESTLEN lets it run to the test. Base-in-front is a periodisation model the NSW guide does not
use for its test, and maintenance-in-front leaves a beginner idle for eleven weeks. An athlete who wants a
base block first builds one: "the detour is two programs" (§11f :765), never a padded head on this one.

**Two things the grid shows that are not this ruling's.** (a) The test-day line prints "Goal 6:00 (6:00/mi)"
under a week whose goal pace is 10:36; D101 caps the ramp but the card says nothing. P-SAFEPACE's R1
sentence (held for the archaeology) is where the truth about reach belongs; the test-day line should carry
the week's goal pace too. (b) The two-week taper on a one-mile test is D139's (queued).

**Recommendation for Mario (doctrine, his call).** Ship P-TESTLEN: a dated test goal pins to its test week
whenever `1 <= _testWeek <= 26` (`Math.max(totalWeeksPreview, 26)` at the D106a gate, anchor count 1). 2,439
of 4,320 lattice builds get longer, all end on the test, 0 mismatches; 576 past week 26 stay as they are,
with the R3 "ends before it" sentence; HALF_MANNY and 210 race/run_base builds unmoved. Apply D106a's own
one-time backfill to stored dated test programs whose `_testWeek` is null and whose test is inside 26 weeks
(freeze is per day, so nothing trained moves), because the alternative leaves an athlete with a program that
ends before his test. Counter: twenty weeks of the same three sessions can go stale for a speed event, and
extending an existing program mid-block re-pins its untrained weeks; the answer to the first is the pace
progression and the cutbacks the grid already carries, and to the second that D106a set the precedent.

**Measures before build (M8).** (i) Rest patterns 3, 4, 6 days and the sun/wed lattice: ends on test,
0 mismatches. (ii) The backfill path (:15263) and resume (:14192) on stored programs with `_testWeek` null,
test inside 26: how many re-pin, and that trained days stay byte-identical. (iii) Starts that snap past the
test (D25 guard): the same pin must not produce a program with the test before week 1. (iv) Header,
callout and name-step copy after the gate change (P-SAFEPACE R3 rows). (v) Beyond-26 builds: what the
athlete sees between program end and test.

## P-TESTLEN — SCOPE RE-RULING (standing ruling 7, M8 `v223_testlen_m8.js`, V209 3b98a0c; Mario accepted the rule)

The rule Mario accepted is one predicate: a dated test goal pins to its test week whenever `1 <= tw <= 26`.
M8 showed it is written in THREE places that disagree (doGenerate :7310, `progTestPin` :14266, the backfill
guard :15338), so a one-line surgery at :7310 is a third copy, not the rule. Re-ruled scope:

**(a) One owner: `progTestPin`.** The predicate lives in `progTestPin(cfg, startIso)` alone: `tw` pins when
`1 <= tw <= NSW_TABLE6_INT.length - 1` (`var` at :3436, index 0 unused, rows 1 to 26: the doctrine's
table the file already carries, V205 D135; no new constant, and NOT `.length`, which is 27). doGenerate :7308 to :7312 calls `progTestPin(WD, resolveStartDate(...).start)` instead of
carrying its own gate; `setProgStart` already calls it, so re-dating keeps the extension (S2: 176/192; the
16 that shrink moved a week-26 test to 27 and are correct under the rule). Backfill: the guard becomes
`_testWeek == null` (null or undefined, S3), it WRITES only when the re-derivation pins (tw in range, test not
past), and otherwise touches nothing, so a program that never pins costs one pure call per boot and no
write. The :15333 comment stops saying "one-time" and says what it does. Yes, a stored program extends on
its next boot: trained days are proven frozen (0/1,688 moved, no week before the current one), and the
alternative is an athlete whose program ends before his test. Mario accepted this backfill.

**(b) One length number.** `wizardTestPin()` beside `wizardAlignment()` (:1949, the same WD wrapper
pattern) returns `progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[]).start)`. Every wizard
surface reads it: header :2903 and name step :3017/:3034 print `tw || len`; the callout's `_twz`/`_tw` at
:2333 and R3's `_tw` are its `tw`; doGenerate's `totalWeeksPreview` is `tw || len`. Closes 827/827.
Sabotage: put the old `<= recommended` gate back in the callout must trip; a second copy of the predicate
anywhere must trip (grep count of `NSW_TABLE6_INT.length - 1` in a pin context == 1).

**(c) D25 snap (21/392).** The test is a session, so a week that holds it is trainable. `resolveStartDate`
gains an optional `raceIso`; when the entered date's partial week contains the test, it does not snap:
week 1 is the test week, `tw` 1, and the sentence is "Your test is this week. Week 1 holds it and nothing
else." Own slice, M9 first: the 21 cases under no-snap print the trial on its weekday with zero train days
before it, and the D21/D25 copy gate still passes on the other 371. If M9 refutes, R3's null row ships as
the interim and the snap case goes to §12.

**Beyond 26 (576/4,320).** Table 6's own note: past 26 weeks, do not increase INT or CHI, increase
intensity and LSD. A 26-week block ending on the test is the longest the doctrine prescribes, so the block
counts back from the test the way D14a races do: `startDate = testWeekMonday - 25 weeks`, tw 26, len 26.
Copy: "Your test is 30 weeks out. The test block is 26 weeks and starts Mon Oct 19. Run easy until then."
Own slice, M10 first: a start in the future on a test goal (calcCurrentWeek :11074 returns 1 for diff < 0,
the D14a `futureWeeks` path, freeze, the Programs card). Interim if M10 refutes: goal length with honest
copy, "Your test is 30 weeks out. The test block is 26 weeks. This program builds 11 weeks now. Start a
test block 26 weeks out."

Slices, in order: (a)+(b) with the backfill; (c) after M9; beyond-26 after M10. Held numbers stand:
HALF_MANNY `0ac7da6b1691a8e1`, 0/210 race and run_base builds, 34,560 rest-pattern builds ending on the
test.

## What does not change
`buildProgram`, `calcProgramLength`, `weeksToPace`, the 3/5/7 table and age scalers (unruled, but in use for
undated length; leave them and record the gap in §12), `testWeekIndex`, D106a's writer, every grid.
`HALF_MANNY` is NRC and never reaches this card; digest unchanged, no era row owed.

## What moves between P-RACEDATE and P-SAFEPACE
P-SAFEPACE owns `updateRaceDateFeedback` wholesale, so P-RACEDATE (vi)'s :2279 to :2280 substitution and
its gate move here. The offer gate in (vi) is void: the sentence reads `_tw` and writes nothing. (vi)'s
"existing cfgs untouched" stands. P-RACEDATE's note on `testWeekIndex` is satisfied by inspection (:4234
rounds). P-RACEDATE keeps `raceCountdown`, :4202, the four parse sites, :10510, and its slice lands before
this one because R3 reads the helper for dated non-test goals.

## Blast radius
Wizard cardio_goal step only, every path and goal that renders it: the eleven strings on every athlete, the
card and header on every dated goal, the ceiling sentence on every run_pace_goal. Zero grid change on any
program not built through a tap. Sabotage: restore the button markup must trip; restore the 80 ms timer must
trip the repaint gate; seed the ceiling from `expCurrentPace` with a mile present must trip; print
`weeksUntil` on a test-goal card must trip.

## Measures still needed (not gathered here)
M1. CLOSED (D101 is the cap; readers :3178, :7283, :5926, :5975, :14179).
M2. Non-comment caller counts after the rewrite: `achievablePacePerMile`, `applySuggestedPace`,
    `updatePaceFeasibility`, `updateRaceDateFeedback`.
M3. Under a week: daysUntil 1..6 × 7 weekdays × rest patterns, `_tw` (1 or 2) against the D106a sentence.
M4. `--on-ink` on `--red` contrast, only if the button stays.
M5. CLOSED (249/480 disagree; R3 covers header and :3017).
M7. P-TESTLEN: distribution of `_twz - recommended` on dated test goals; ramp shape over an extended length.
M6. Dash sweep of the cardio step in every state after the copy lands: 0 mid-sentence em-dashes.

Recommendation: ship R1 to R5 as one ruling in three slices (repaint + weeks, button removal + sentence,
copy), after P-RACEDATE's helper slice.
Counter: keep the button, made reversible, because a tap that fixes the goal is faster than retyping; I
would not, because the number it applies is a heuristic the doctrine does not back, and the goal is his.

## MARIO DECISION (2026-09-23)
- P-SAFEPACE R1: remove the USE THIS PACE INSTEAD button (decided earlier).
- "safely": goes (via P-PACERATE decision).
- P-TESTLEN: ACCEPTED. Dated test programs run to the test date (pin when 1 <= _testWeek <= 26), plus D106a one-time backfill for stored dated tests with _testWeek null. M8 measures pending.
- Existing cfgs from a wrong safe-pace offer (P-RACEDATE item): still pending; recommend leave.

## MARIO DECISION (2026-09-24, build-1 chat)
- Existing cfgs from a wrong safe-pace offer: LEAVE ALONE (decided). No repair of stored cfgs.
- Re-baselined on V219: P-SAFEPACE and P-TESTLEN still reproduce exactly (P-TESTLEN 2,439/4,320 builds lengthen; >26 wk 576). Overlaps: queued D163 shares P-SAFEPACE's readers (whichever builds second re-anchors); queued D138 asks P-TESTLEN's question (fold D138 into P-TESTLEN). M9/M10 unscripted, M8 status ambiguous in this file.

## D183 AMENDMENT 2 — V223 session, fresh coach (saved verbatim by the main session)

Real D-code at dispatch: **D183** (P-SAFEPACE R1–R5 + AMENDMENT + this). Context: builder's read-only slice plan (`scratchpad/builder/d183_plan.md`, 7 slices) flagged six items that could not land as written; this amendment answers them.

D183 AMENDMENT 2 — P-SAFEPACE: digits, the beginner line, where the reach sentence sits, the swim unit, the dash sweep widened, and one length number (coach, fresh spawn, V222 baseline)

Measured this session: `node tests/measure/v223_safe_pace_offer.js index.html` (ia-version 222, clock 2026-09-22 21:16) and a coach probe (`scratchpad/coach/probe_L2.js`: run-only vs run+swim, 1.5 mi 10:30, mile 8:00, intermediate, undated). Reads: index.html :1947–:1971, :2043–:2060, :2262–:2365, :2386–:2413, :2420–:2493, :2864–:2905, :3190–:3225, :3646–:3662, :7497–:7501, :15343; g203_mile_pencil :56–:57; doctrine Guide A p.11 (line 236: "total work be increased no more than 10% per week").

Before (Mario's screen, V222): header `Program length: 6 weeks — based on your longest cardio goal and experience level.` / card `4 weeks isn't enough time to hit this pace safely. Recommended: at least 6 weeks. Your program ends on your test. 5 weeks. The taper lands in front of it. In 4 weeks you can safely reach 1.5mi in 14:15 (9:30/mi) without exceeding safe progression limits. [BTN Use this pace instead]` / pace line `12:00 — 8:00/mi per mile`. Offer shown 2,592/2,592, slower than the athlete's own mile 1,296/2,592.

(a) Digits, never words. The card already counts in digits (R3 "Your test is in week 5", D182 "5 weeks out", the header); one grammar per card, and `_DAY_WORDS` (:15343) is D29's day table, not a week table. Singular handled: `L + (L===1 ? ' week' : ' weeks')`. No new table. The R1 sentence, re-shaped so no numeral opens a clause (`_clkMS` for every time; distance `targetDist + ' ' + (paceUnit||'mi')`):
  mile entered:  `Your mile is 8:00. In 5 weeks that reaches about 1.5 mi in 12:00. Your goal is 10:30. Keep it or change it above.`
  no mile, non-beginner (`exp` word from WD.experience): `You have not entered a mile time. The intermediate default is 9:30 per mile. In 5 weeks that reaches about 1.5 mi in 14:15. Your goal is 12:00. Enter your mile above and this updates.`
(b) Beginner (no field, :2872/:2893; `_mileEntryState` ignores the entry): `Your paces start from the beginner default of 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Keep it or change it above.` 690 is the D9 table the ceiling already seeds. No "enter your mile" for a field that does not exist; whether beginners get the field is P-BEGINNERMILE's, untouched.
(c) The sentence attaches exactly where `tw` is set: `tw >= 2` gap (R3) and `tw === 1` gap (including D184 (c)'s `holdsTest` row). It states what the block reaches AT THE TEST, so it never prints on `week === null` (the program does not contain the test) or on D184's `week > len` row (a 26-week statement over an 11-week program would read as the test result). On `tw === 1` the honest number is the current pace (improvingWeeks 0) and the athlete four days out deserves it. The undated `#paceFeasLine` keeps its hide rule.
(d) Swim keeps the unit; it is the prescription's fixed dimension and yd vs m is a 9% lie without it: `<time> is <pace> per 100 <unit>.` → `7:00 is 1:24 per 100 yd.` (unit `g.swimUnit||'yd'`), both :2396 and :2820. `_clkMS(per100)` at the call site; `formatPacePer100` unchanged.
(e) R5 extends; M6 stands as written and gets a predicate. M6 = rendered text of the cardio step, every state of the 168-sequence lattice plus the NRC dated card (HALF_MANNY WD), the swim panel, and the four mile-advisory states (2:00, 4:10, 13:00, 30:00): zero U+2014 and zero spaced hyphen ` - `. Compound numerals ("11-week", the prior ruling's own "6-week program") and digit ranges ("30–45", "Weeks 1–3") are structural and exempt, like `4×5 — RPE 8`. Added strings (before → after):
  :2060 `Open water race — 750m to 1.9km` → `Open water race. 750 m to 1.9 km.`
  :1964 `…starts <b>Mon Sep 28</b> — 2 weeks from now — so it peaks on race week, not early.` → `…starts <b>Mon Sep 28</b>, 2 weeks from now, so it peaks on race week and not early.` (rest of the sentence unchanged)
  :1966 `…so race week is week 11 — you open in <b>week 3</b>.` → `…so race week is week 11. You open in <b>week 3</b>.`
  :7497 `That mile time isn’t a real time — check the minutes and seconds.` → `That mile time is not a real time. Check the minutes and seconds.`
  :7498 `Under 3:00 isn’t a mile time — the world record is 3:43. Check the entry.` → `Under 3:00 is not a mile time. The world record is 3:43. Check the entry.`
  :7499 `Over 25:00 reads as a walk, not a run — leave it blank and the program anchors on your experience level instead.` → `Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.`
  :7500 `…the chart’s fastest row (5:00) — it tops out there.` → `…the chart’s fastest row, 5:00. It tops out there.`
  :7501 `…from the 12:00 row — the chart’s slowest. Consider a base-building block first.` → `…from the 12:00 row, the chart’s slowest. Consider a base block first.`
  `startSummaryVal` :1948–:1949 ("— set by race date", "— short first week") is the name step, not this step: §12 under P-RACEDATE's "seen in passing". The `_mileEntryState` strings are D116's and shared with the mid-program mile sheet; `g203_mile_pencil` MSG_UNDER_3/MSG_OVER_25 (:56–:57) re-key to the new text, same predicate; the `/fastest row/` toast row still matches.
  "safely": :2342, :2358, :2476 leave with the card and button under D183. run_base :2050 "increase mileage safely" STAYS: Guide A p.11 gives a rate for mileage (10%/week) and the word describes volume, not the pace rate; P-PACERATE's decision is the pace rate. :7467 "safely progresses toward your goal" and :2997 "build the volume safely" are other steps: :7467 is P-PACERATE's (build 4), :2997 is doctrine-backed and stays.
(f) One length number, and it is the program's. Proven: run+swim built 12 weeks (all-sports `calcProgramLength` 12, run-only 11) and the interval ramp ran to W12 7:03/mi against run-only W11 7:08/mi; the engine ramps over `totalWeeks` (:3646, buildWeeks :3662), never the run in isolation. So `assessRunPaceCeiling(L)` takes the fold's `L = tw || len` (len = all-sports calcProgramLength, the header's number) on every path and its own `calcProgramLength(['run'], …)` line (:2452) goes. Dated test goal with `tw` null needs no L: (c) prints nothing there. Blast radius: undated multi-sport pace goals whose other sport is longer see a larger L and a closer reach; some drop under the 45 s threshold. That is the truth of the build.
Not-for-this-build items: (1) run baseline inputs :2868/:2889 come IN, two handler edits appending `updateRaceDateFeedback()`: calcProgramLength reads `baselineDist` (:3204 no-time fallback, :3213 beginner base build), so a beginner editing distance moves the header today; gate row: beginner 1.5 mi 12:00, baselineDist 1 → 4, header == callout after oninput. Swim inputs (:2811–:2836) go to §12 by name ("swim target and baseline inputs feed the sizer; header repaints on full render only"). (2) km label comes IN on the line R5 already rewrites: `updatePaceDisplay` reads `paceGoalTarget(g).tPacePerMile` (the engine's lens, :3190) → `12:00 is 9:40 per mile.` for 2 km in 12:00 (720 s / 1.242 mi); sessions print /mi, so per mile converted is the honest unit. One lens for pool and post-filter.
Deliberately unchanged: `buildProgram`, `calcProgramLength`, `paceGoalTarget`, `formatPacePer100`, the 45 s tolerance (:2463), the 3/5/7 table, `_DAY_WORDS`, every NRC string, `HALF_MANNY` digest `0ac7da6b1691a8e1` (alignedStartCopy is copy only; numbers and D14a structure intact; no gate pins its text).
After (Mario's screen, 1.5 mi 12:00, mile 8:00, tw 5, no gap): header `Program length: 5 weeks. Your test sets it.` / card (--run) `Your test is in week 5. The program ends on it. The taper lands in front of it.` / pace line `12:00 is 8:00 per mile.` Same screen with goal 10:30 (gap 60 s/mi, L 5, improvingWeeks 0): card (--accent) adds `Your mile is 8:00. In 5 weeks that reaches about 1.5 mi in 12:00. Your goal is 10:30. Keep it or change it above.`
Doctrine calls for Mario: none new; run_base "safely" staying is a reading of his P-PACERATE decision (recommend stay, Guide A p.11 in hand; counter: one word everywhere reads cleaner).
Recommendation: build as amended, with (e)'s eight strings and the two brought-in items, M6 as a whole-step sweep under the predicate above.
Counter: narrow M6 to R5's list and leave `_mileEntryState` and alignedStartCopy for a copy pass; I would not, because a gate that sweeps only the strings builder wrote proves nothing about the step.

## D183 AMENDMENT 3 — V223 session, fresh coach on builder plan flags F3/F4 (saved verbatim by the main session)

**D183 AMENDMENT 3 — the undated frame loses its heading and its siren; no glyph on any framed card row; the past-date line stays red on every goal** (coach, fresh spawn, V222 tree; R2 already landed: `updatePaceFeasibility(f)` takes the ceiling from `updateRaceDateFeedback`, which is why a bare call hides the frame)

Measured this session: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0f257927-9d1c-4e52-aa95-54774c4b9ec8/scratchpad/coach/probe_f3f4.js` and `probe_f3_direct.js` on `/Users/CanasBangin/Desktop/TheBig6V2/index.html` (ia-version 222, clock 2026-09-22 21:16), 11 states; `ASY_EMOJI` :1207 (`⚠`→`warning`, `🚨`→`siren`, `✅`→`check`; all three paths exist, so `asyIcon` renders SVG for them); grep of `tests/gates` + `tests/sabotage`: 0 pins on `✓`, `🚨`, `⚠`, the F3 heading or "already passed" (only g207 `RED_OLD` :167 pins the old non-test under-a-week text, already R3's). `doGenerate` (:7574) has no past-date or under-a-week guard; neither red line blocks a build.

**F3 — YES, the heading goes.** "faster than safe progression allows" is F3's struck claim in noun form (Guide A p.11 gives 10%/week for volume and no pace rate; Mario struck "safely"); it missed amendment 2 (e) because that list was keyed on the token, not the finding. The frame's whole content is the R1 sentence (amendment 2 (a)/(b), L = len per (f)); a heading above it is a second voice calling the goal wrong before the coach speaks, and the same sentence prints on the dated card with no heading (R3 gap row), so one sentence must read the same on both surfaces. `paceCeilingOfferHTML(f)` returns the `var(--accent)` frame (R3 card styling) around the R1 sentence and nothing else: no `asyIcon('🚨',14)`, no bold span, no body line (:2476, already listed), no button.

**F4(i) — NO glyph on any framed row, test or non-test.** Colour is this card's state channel (`--run` / `--accent` / `--signal` / `--red` as R3 and the amendment rule); a glyph is a second channel saying the same thing, and a coach does not tick or siren his own sentences. The bare `✓` (HEAD :2353, :2360) is a raw text character, not `asyIcon` (printed: `bare✓=yes svgIcons=0`), which the design system forbids in chrome; R3's ruled strings for those rows begin "Your…" and "Perfect timing…", so it leaves inside the R3 rewrite at zero extra edits. The `asyIcon('🚨',14)` prefix at HEAD :2365 goes for the test rows AND the non-test diff<0 row: a siren over "Your full 6-week program stays intact" is the wrong register; a program builds. D184's `holdsTest` row and R3's `--signal` null row: no glyph.
**F4(ii) — the past-date line stays `var(--red)` with `asyIcon('⚠',13)` on every goal, test included**, copy unchanged: `That date has already passed.` R3's "never red on a test goal" was reasoned on the weeks not being his to change; a past date is his to change and is the only wrong thing on the screen. It scopes R3 to the framed card rows, which is where R3 spoke. The same rule keeps `⚠` + `--red` on the non-test under-a-week line: both are unframed entry-error lines, not coaching states. The test-goal `tw === 1` rows are `--accent`, no glyph, as R3 ruled.

**Before (printed):** A2 undated 1.5 mi 9:30, mile 8:00, intermediate: `(--accent) [siren] That pace is faster than safe progression allows from your current fitness. Over a realistic 11-week build, the fastest you can safely reach is 1.5mi in 11:24 (7:36/mi). [BTN Use this pace instead]` | E dated test 10-20, 10:30: `(--red) [siren] 4 weeks isn't enough time to hit this pace safely… [BTN]` | F run_base dated diff>0: `(--run) ✓ Your 10-week program finishes 7 weeks before race day — use the extra time to stay sharp.` | C/H past date, test and non-test identical: `(--red) [warning] That date has already passed.` | G non-test 4 days out: `(--red) [warning] Less than a week away — not enough time to train.`
**After:** A2: `(--accent, no icon, no heading) Your mile is 8:00. In 11 weeks that reaches about 1.5 mi in 11:24. Your goal is 9:30. Keep it or change it above.` | A3 no mile, intermediate: `You have not entered a mile time. The intermediate default is 9:30 per mile. In 11 weeks that reaches about 1.5 mi in 13:39. Your goal is 10:30. Enter your mile above and this updates.` | A4 beginner: `Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Keep it or change it above.` (numbers are today's `assessRunPaceCeiling` return, safeTotal 684 / 819 / 1013; run-only len == today's L 11, so they do not move) | E: amendment 2's after, `--accent`, no icon | F: `(--run) Your 10-week program finishes 7 weeks before race day. Use the extra time to stay sharp.` | C/H: unchanged | G: `(--red) [warning] Less than a week away. Not enough time to train.`

**Deliberately unchanged:** the accent frame and its 12px/1.55 styling; the event+dated hide rule; the 45 s tolerance; every R3 and amendment 2 string and colour (including non-test diff<0's `diff >= -2 ? accent : red`); `ASY_EMOJI`, `ASY_ICON_PATHS`; `'✓ Done'` at :18059 (a button label on another screen); every NRC string; `HALF_MANNY` (its card is `alignedStartCopy`; `assessRunPaceCeiling` is null on NRC ids so the frame never printed there), digest `0ac7da6b1691a8e1`.
**Gate rows** (M6 predicate extends, same lattice plus A2/A3/A4): rendered step text contains 0 `safe progression`; `#raceDateFeedback` framed cards and `#paceFeasLine` contain 0 `<svg` and 0 bare `✓`; the past-date and non-test under-a-week lines contain exactly 1 `<svg` and `var(--red)`. Sabotage: restore the heading string; restore `asyIcon('🚨'` in `paceCeilingOfferHTML`; flip the past-date line to `--accent`; each must trip.
**Doctrine calls for Mario:** none. F3 is a reading of his "safely goes" decision; F4 is presentation, the session's.
**Recommendation:** build S4 as amended: heading and siren out, the R1 sentence alone in the accent frame; no glyph on any framed row; `⚠` + red only on the two entry-error lines.
**Counter:** keep `⚠` on every red or accent row as a cue for athletes who cannot rely on colour; I would not, because every row already names its state in words, and the design system routes chrome through `asyIcon` only where the icon adds meaning the sentence lacks.

## D183 AMENDMENT 4 (BL1) — V223 session, fresh coach under standing ruling 7 (saved verbatim by the main session)

D183 amendment 4 (BL1) — gate row stub: **beginner, 1.5 mi, no time entered, undated, baselineDist 1 → 4**. Before (bd1, tree and V222 alike): `Program length: 9 weeks. Set by your longest cardio goal and your experience.` After oninput (bd4, tree): `Program length: 6 weeks. Set by your longest cardio goal and your experience.` == fresh full render at bd4 (6). Control holds: on V222 the same handler leaves the header at 9 while a fresh render says 6 (stale), so the row fails on the previous version as it must. Printed this session from /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0f257927-9d1c-4e52-aa95-54774c4b9ec8/scratchpad/coach/bl1_pick.js against index.html and builder/head_V222.html.
Why this stub: "no time" is the state every athlete passes through (fields start empty) and it is the :3204 reader the premise names first; the header's only input is the distance, so the distance must move it. 18:00 (also 9 → 6) exercises :3213 only for a goal slower than the beginner default (18:00/1.5 = 12:00 per mile vs 690 s = 11:30), a fringe athlete. 3.1 mi no time (12 → 6) is a bigger swing but 1.5 mi is the NSW test distance and Mario's screen.
Why 12:00 went flat (not a defect, do not touch calcProgramLength): 480 s/mi against 690 gives a 92-week pace term capped by `distCap` 10 for ≤2.0 mi, +1 beginner grace = 11; the base build from any baseline 1–8 mi tops out at 6, under the cap, so `Math.max` never lets distance show. Record as the reason the example changed.
Row stays **undated**: dated pins the header to the race date (5 for 2026-10-20) for every baselineDist 1–8, so a dated row would prove alignment, not the sizer; card-week equality is S4/g223's business.
Optional second row, same harness, no new constant: beginner 1.5 mi 18:00, bd 1 → 4, 9 → 6, if gatekeeper wants :3213 covered with a time present. Not required for the premise.
Deliberately unchanged: `calcProgramLength`, `weeksToPace`, `distCap`/`paceCap` tables, the beginner 690 default (D9), the premise text of amendment 2.
Recommendation: ship the row as beginner 1.5 mi no time, undated, 1 → 4, header 9 → 6 and equal to a fresh render, with the V222 stale-9 as the row's control.
Counter: use 3.1 mi no time (12 → 6) for the larger delta; I would not, because 1.5 mi is the doctrine distance and a 3-week move already discriminates a stale header from a live one.
