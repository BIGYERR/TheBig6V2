# Leg day volume: decisions

How much the squat-and-armor leg day carries against the week's long run. Placement (which day) is ruled in
`leg-lift-placement.md` (D36, D243); the long-run day itself in the handoff (D18, D33, D34, D140, D153, D155); the taper
in D37 and D38. Measure: `tests/measure/leg-day-volume_peak-week.md`.

## D273 P-PEAKLEGS: the leg day inside two days of a tier A long run is a maintenance day (Mario concurred 2026-11-07; Amendment 1 below)

- **Date:** 2026-11-07. **Ruled by:** the main session in the coach hat, on Mario's report of the week 11 peak long run
  (HALF_MANNY, 12.5 miles) stopped at 5.5 miles with heavy legs, two days after the 25-set Thursday leg day, with
  Friday's 45-minute recovery run skipped. Mario concurs or pushes back on the card below before a line of code moves;
  the release line is filled in at ship time.
- **Finding (the measure):** the leg day is 25 sets (15 loaded leg sets, 3 heavy carries, 10 drill sets) in every
  non-deload, non-taper week of the program, the same in week 1 (3.1-mile long run) as in week 11 (12.5 miles); the
  deload falls every fourth week by count and never on the peak long-run week (0 of 1,728 race programs); on 510 of
  1,296 race programs whose peak long run is tier A (≥75 min) the leg day sits exactly two days before it, 474 of them
  with a recovery run of 30 minutes or more on the day between. The run's size is read by `_longRunTier` and reaches
  only the long-run day. Doctrine (Doma 2013, 2017; Beattie 2017; Blagrove 2018; Bosquet and Mujika 2007; Centenari,
  Norris, RunnersConnect) agrees on the shape: a lift's fatigue lasts days, lower-body work sits 48 to 72 hours before
  the long run, and as the running climbs the lifting's volume falls while its intensity holds.
- **What changes:** on any program, a lifting day whose role is `legs` that falls within two days before a long run
  `_longRunTier` reads as **A** is a maintenance day:
  1. **Eight working sets**, counted in document order the way D140's tier B counts (`N×` and `N sets` forms), the
     main squat first, then the runner-armor circuit (two rounds of three is six). A block that does not fit whole is
     dropped whole.
  2. **Hip stability and foot & ankle drills are free**, as stretches are in tier B: they are the armor the day is
     named for and carry no load the long run has to pay for.
  3. **No loaded carry finisher**, the long-run day's carry ban moved up two days.
  4. **No eccentric-cue calf block** (the `slow 3-sec lower` line): soreness from eccentric work peaks at 24 to 72
     hours, on the long run.
  5. **The main lift keeps its load, reps and RPE.** Volume falls, intensity holds (Bosquet and Mujika 2007; Centenari).
  The pass runs beside `d18LongRunDayPass`, reads the same `_longRunTier` predicate for the long-run day, and finds the
  leg day by the day's role, not its title.
- **What deliberately does not change:** the leg day stays where D36 puts it (Mario, 2026-10-24: "not a move"); the pull
  day on the speed day (D36) is untouched; a leg day three or more days before the long run is untouched (doctrine's
  48 to 72 hours is met); tier B and tier C weeks are untouched (HALF_MANNY weeks 1 to 3 and the week 12 cutback);
  the deload (`isRecoveryWeek`) and the taper (D37, D38, `inTaper`) keep their own rules and the cap applies on top
  where a deload week is also tier A (HALF_MANNY weeks 4 and 8); every other focus keeps its template beyond the cap;
  no run moves and no pace changes; the pace anchor is Mario's own entry and is a coaching call, below, not a rule.
- **Before and after, HALF_MANNY week 11 Thursday (typed by hand from the v0.255.2 card):**

  Before (25 sets): Main, Back squat 2×8 RPE 6.5 · Leg circuit, 2 rounds: Goblet side lunge to knee drive 2×8–12 each,
  Wall sit 2×25 sec, Kettlebell single-leg deadlift 2×6–10 · Glute, Single-leg hip thrust 2×6–10 each · Calf, Dumbbell
  standing calf raise 2×12–15 each, slow 3-sec lower · Hip stability, Seated banded hip flexion 2×15 each, Hip airplane
  (light KB) 2×6 each, Weighted 90/90 hip switch 2×6 each · Foot & ankle, Knee-to-wall ankle rocks 2×10 each,
  Single-leg bent-knee soleus raise 2×12 each · Loaded carry finisher, Overhead carry 3×40 yards each, heavy.

  After (8 working sets + 10 drill sets): Main, Back squat 2×8 RPE 6.5 · Leg circuit, 2 rounds: Goblet side lunge to
  knee drive 2×8–12 each, Wall sit 2×25 sec, Kettlebell single-leg deadlift 2×6–10 · Hip stability, the same three
  drills · Foot & ankle, the same two drills. Gone: the single-leg hip thrust (set nine and ten; the circuit's
  single-leg deadlift already loads the hip), the eccentric calf raise, the heavy overhead carry. Loaded leg sets 15 → 8,
  carries 3 → 0.

  Blast radius on HALF_MANNY: the Thursday card in weeks 4 to 11 (tier A long runs of 6.2 to 12.5 miles), eight cards;
  week 13's primer (3 sets) already sits under the cap and does not change; weeks 1 to 3, 12 and 14 do not change.
  Lattice: 510 of 1,728 race programs change; the HALF_MANNY digest and the program-output snapshots move, printed
  before the build (standing ruling 5).
- **The strongest counter-arguments, for Mario:** (a) a cap of ten would keep the hip thrust (D254 put it back on
  purpose) and drop only the calf block and the carry; the ruling takes eight because doctrine says roughly half, and
  the circuit's single-leg deadlift is a loaded hip extension already. (b) The threshold could be 90 minutes (Norris)
  instead of D18's 75; the ruling keeps 75 so one doctrine line governs the long run and the days before it. (c) The
  cleaner fix is the day: a leg day on Tuesday, four days out, beside the 15-minute recovery run, would cost one line in
  `_nrcLegCost` (price the day two before the long run); Mario held moves on 2026-10-24 and the measure then showed how
  few calendars have room.
- **Coaching call for Mario himself (not a rule), corrected 2026-11-07 against his live program:** the first draft of this
  paragraph read his paces off the test fixture, which carries a 10:30 mile; his live program carries an **8:00 mile, edited
  in week 5** (his Program selections copy: recovery 10:30, tempo 9:25, 10K 9:00, half 9:30). So the week 11 long run was
  prescribed at 10:30/mi, and he ran 11:03/mi, 33 s/mi SLOWER than prescribed, at 88 to 92% of maximum heart rate. His
  week 10 tempo ran 10:23/mi against a prescribed 9:25. The anchor is too fast for him by about two chart rows, not too
  slow: the tempo column reads his 10:23 as an 8:54 mile. Re-enter about 9:00 (recovery 11:35, tempo 10:30, 10K 10:00)
  with the pencil before the week 12 lock, and run the remaining long runs by heart rate (140s to low 150s), accepting
  whatever pace that is. Four weeks out the missed 20K is not made up: week 12's 60-minute cutback as written. On his live
  program the cap reaches weeks 6 to 11 (the 6.2-mile runs at 10:30 are 65 minutes, tier B); the fixture's weeks 4 and 5
  are tier A only because of its slower anchor. Lesson: ask for the Program selections copy before framing anything
  about his paces (the fixture's anchor is stale against his program).
- **Release:** v0.256.0 (MINOR, Mario's pick 2026-11-07: it changes what a program prescribes). Threshold confirmed at 75 minutes (Mario asked; coach: one line for a big run, used everywhere; the cap steps back by itself when the mile anchor is corrected, since the tier reads the prescribed pace).
- **Tests at build time:** `tests/integration/leg-day-volume.test.ts` (the week 11 Thursday card after the cap, typed
  from the After above; a tier B week's leg day untouched; a leg day three days out untouched; the deload week 8 card
  under both rules; the hip and foot & ankle drills kept whole; no carry and no `slow 3-sec lower` line on a capped
  day), each failing on v0.255.2; the program-output snapshots regenerated under this ruling and every sweep run before
  the release commit.
- **Sources read for this ruling:** Doma and Deakin 2013, Applied Physiology, Nutrition, and Metabolism 38(6):651–656;
  Doma, Deakin and Bentley 2017, Sports Medicine 47:2187–2200 (and James Cook University's release, ScienceDaily
  2017-07-26); Beattie, Carson, Lyons, Rossiter and Kenny 2017, Journal of Strength and Conditioning Research
  31(1):9–23; Blagrove, Howatson and Hayes 2018, Sports Medicine 48(5):1117–1149; Bosquet, Montpetit, Arvisais and
  Mujika 2007, Medicine and Science in Sports and Exercise 39(8):1358–1365; Runner's World South Africa, "The right way
  to fit leg day into marathon training" (Centenari, Milton); Laura Norris Running, "How to schedule strength training
  around running"; RunnersConnect, "Customizing resistance training for specific race distances"; the half marathon
  source plan's own text (pages 4, 5 and 14).

## D273 Amendment 1: the main lift whole and the first accessory block, not a flat eight (Mario concurred 2026-11-07)

- **Date:** 2026-11-07. **Ruled by:** the main session in the coach hat, mid-build, before any edit; Mario chose it from
  three options ("Squat whole + first block", "Eight sets, trim the squat", "Eight sets, drop what does not fit") and
  asked whether it cuts the hip work (it does not: both hip-flagged blocks stay whole; the one hip item that goes is
  the single-leg hip thrust block).
- **Finding:** D273 item 1 counted eight working sets in card order and dropped whole any block that did not fit. The
  after-card was typed from week 11, where the squat is 2×8, so squat (2) plus circuit (6) is eight. The squat is not
  always two sets: the wave writes 3×8 in weeks 9 and 10 and 3×13 in the deload weeks 4 and 8 (HALF_MANNY, v0.255.2),
  4×3 on support_strength, 4×4 on balanced and up to 5×10 on hypertrophy. Under the letter of item 1 a three-set squat
  plus the six-set circuit is nine, so the circuit would drop whole and those Thursdays would be the squat and the
  drills alone: not the card Mario concurred to, and a Thursday that changes shape week to week for no coaching reason.
- **What changes (replaces item 1):** on a maintenance day the card keeps, in order, **the main lift exactly as
  written** (its sets, reps, load and RPE) and **the first accessory block after it, whole** (the runner-armor circuit on
  prevention; Leg superset A on the other templates). Every other loaded block is dropped whole. Items 2 to 5 stand:
  hip stability and foot & ankle (the engine's `hip` flag) are free and untouched; trunk sections are free; an
  informational section (the taper note) stays; no carry section or carry item; the eccentric calf block and the
  glute block go because they sit after the first accessory block. Coach: the squat is the stimulus the ruling
  promised to keep, the circuit is the armor; one sentence to the athlete, the same shape every week.
- **The numbers (typed from the v0.255.2 cards):** HALF_MANNY Thursdays in weeks 4 to 11 carry 8 loaded sets (2-set
  squat weeks 5, 6, 7, 11) or 9 (3-set squat weeks 4, 8, 9, 10), against 15 before; support_strength 8 (4×3 squat and
  the four-set superset A, superset B gone) against 15; balanced and athletic 10 against 19 and 22; hypertrophy 9 to 11
  against 15 to 17; bodyweight 9 against 13. Week 13's primer has no accessory block and does not change.
- **What deliberately does not change:** everything D273 lists, and the threshold (75 minutes, confirmed).
- **Tests:** `tests/integration/leg-day-volume.test.ts` carries the week 9 card (3×8 squat kept whole, circuit kept) and
  the deload week 8 card (3×13 recovery squat kept, circuit kept, glute block gone) as the amendment's own tests.
- **Release:** v0.256.0, with D273.
- **Where the pass sits (builder, 2026-11-07):** `d273PeakLegsPass` in `core/src/engine/budget-engine-d.ts`, called right
  before `deconflictAdjacentDupes`, after the session budget and the swap preferences. The first draft ran it beside
  `d18LongRunDayPass`, after the dedupe, and the dedupe sweep (D167's invariant) went red on NSW multi-sport programs:
  a rename on the day after the leg day answered to a block the cap then removed. Settling the maintenance day first
  lets the dedupe judge the leg day as it ships. The HALF_MANNY digest is the same in either position.
- **Blast radius, as built (every golden file regenerated under this ruling, in the release commit):** program-output
  (HALF_MANNY `147f083be4e04e34`; the marathon athletic-support program, Friday leg day with a recovery run before a
  Sunday long run, `a01b89a7f5dc45ff`; the 1.5-mile test program whose W11 Saturday crosses 75 minutes, `86fef027fd390de6`);
  program-output-lattice, 216 of 864 programs; compound-tier and core-trunk (HALF_MANNY's digest); deload (zero-posterior
  weeks 240 → 396, deload-off digest `d30129f464b47586`: the glute block was the only posterior item on many leg days);
  leg-accessory-lattice (leg isolation sections 2,020 → 1,948); leg-accessory-trim-order (over-cap days 6,320 → 5,576);
  runner-armor-circuit-lattice (runner days with the fourth item 1,164 → 944, calf days 1,290 → 1,108); session-budget-
  lattice (sections and items per tier, about 2% fewer). Tests amended with the ruling named in each: runner-armor-
  circuit (the fourth item prints on W1 to W3 and W12; the calf and carry strings read `YYY-----------`; the part A and
  part B digests `093dc6c47c697d03` and `5d061b2ad525a435`), session-budget (the same part B digest), and the
  injury-overlays sweep's three lite-lattice counts (W5 sheet rows 4,626 → 4,567 and aux 1,875 → 1,860, fewer leg rows on
  the maintenance day; Main and Power swap pairs 156,872 → 156,892; every other tally held, no rejected name, no pair
  differing from its fixture). Each amended test fails on v0.255.2.
- **The digest, printed before the snapshots were regenerated (standing ruling 5):** HALF_MANNY `e47eb1012ab04bff` →
  `147f083be4e04e34` (14 weeks, taper 13 and 14, deloads 4, 8 and 12 unchanged). The Thursday cards after, from the
  surgery build, every one: the main squat as written, the circuit, the three hip drills, the two foot & ankle drills,
  nothing else. Week 4: Back squat 3×13 RPE 6 (recovery), Dumbbell goblet side lunge / Wall sit / Kettlebell swing.
  Weeks 5 and 6: Front squat 3×8 RPE 7; week 7: Front squat 3×10 RPE 6.5; week 11: Back squat 2×8 RPE 6.5, each with the
  week's circuit. Week 8: Front squat 3×13 RPE 6, Step-downs (KB) / Wall sit /
  Kettlebell single-leg deadlift. Week 9 and 10: Back squat 3×8 RPE 7, Dumbbell goblet side lunge / Spanish squat hold
  (KB) / Dumbbell split-stance deadlift. Loaded sets 9 in weeks 4 to 10 (three-set squats) and 8 in week 11 (2×8), against 15.
  Weeks 1 to 3, 12, 13 and 14 are byte-identical to v0.255.2. The leg day three days out (run_10k, beginner, seed 1013,
  rest Sunday and Thursday) is untouched: digest `086840410c1ed62a` before and after. support_strength (run_10k, beginner,
  seed 1013) week 5: Back squat 4×3 RPE 7 and Leg superset A (Goblet side lunge to knee drive / Wall sit); superset B,
  the hip drills' neighbours and the Farmer carry gone, 18 sets against 25. balanced week 5: Front squat 4×4 RPE 9 and
  Leg superset A (Step-downs / Spanish squat hold), 20 sets against 29.
