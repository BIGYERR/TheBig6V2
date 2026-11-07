# Leg day volume: decisions

How much the squat-and-armor leg day carries against the week's long run. Placement (which day) is ruled in
`leg-lift-placement.md` (D36, D243); the long-run day itself in the handoff (D18, D33, D34, D140, D153, D155); the taper
in D37 and D38. Measure: `tests/measure/leg-day-volume_peak-week.md`.

## D273 P-PEAKLEGS: the leg day inside two days of a tier A long run is a maintenance day (PROPOSED, awaiting Mario's concurrence)

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
- **Coaching call for Mario himself (not a rule):** the long run was run 2:17 a mile faster than prescribed, at 88 to
  92% of maximum heart rate from mile two, which COROS classed as a tempo. The 10:30 mile anchor is two chart rows slow
  for his week 10 tempo; re-enter it from a recent effort (the pencil on the program card, D189; about a 9:00 mile fits
  the watch) and run every remaining long run at talking pace, heart rate in the 140s. Four weeks out the missed 20K is
  not made up: week 12's 60-minute cutback as written, at easy effort.
- **Release:** not yet built. Bump: MINOR (it changes what a program prescribes), Mario's pick before the first edit.
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
