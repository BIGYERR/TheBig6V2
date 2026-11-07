# Measure: the leg day against the peak long run (Post-v0.255.2, 2026-11-07)

**Question.** Mario (HALF_MANNY, seed 76308, intermediate, support_prevention, crossfit, rest Sunday and Wednesday)
did the week 11 Thursday leg day, skipped Friday's recovery run, and stopped Saturday's peak long run (20K, 12.5 miles)
at 5.5 miles with heavy legs, four weeks from the race. Is the leg day's volume too high, is it placed too close to the
long run, and does the lifting taper with the running? Script: `tests/measure/leg-day-volume_peak-week.js`
(`node tests/measure/leg-day-volume_peak-week.js index.html`, 11 s; the per-program table is
`leg-day-volume_peak-week.csv`). Everything below was read off v0.255.2 (`ia-version` 0.255.2, HEAD 8642560).

## The week as the app prescribes it (HALF_MANNY week 11)

| Day | Run | Lifting | Sets |
|---|---|---|---|
| Mon | Speed Run, 5 × 5:00 at 10K pace (25:00 of work) | Posterior Chain: RDL 2×8 RPE 6.5, rows and chinups 2 rounds, DB row + jump squats 2 rounds | 10 |
| Tue | Recovery Run 15 min | Strength Support: incline press and shoulder work, wall sit, anti-rotation core | 18 |
| Wed | rest | | |
| Thu | none | **Leg Strength + Mobility**: Back squat 2×8 RPE 6.5 (≤61% by the prevention cap); Leg circuit, 2 rounds of Goblet side lunge to knee drive 2×8–12 each, Wall sit 2×25 s, KB single-leg deadlift 2×6–10; Glute, Single-leg hip thrust 2×6–10 each; Calf, DB standing calf raise 2×12–15 each, slow 3-sec lower; Hip stability, 3 drills × 2; Foot & ankle, 2 drills × 2; Overhead carry 3×40 yd each, heavy | **25** (15 loaded leg sets + 3 heavy carries + 10 drill sets) |
| Fri | Recovery Run **45 min** | Recovery Lift: upper only, rotational core | 15 |
| Sat | **Long Run, Peak: 20K / 12.5 mi**, average Recovery Pace 13:20/mi (2 h 47 at that pace) | Post-run mobility only (D18 tier A) | mobility |
| Sun | rest | | |

The three days Thursday to Saturday are a loaded leg day, a 45-minute run and a near-three-hour run, back to back.
The leg day is **two days (48 h) before the peak long run**, the closest day D36's cost table allows (the long run and
its eve are forbidden; Thursday costs 0 because no run sits on it). D243 (v0.243.0) moved his leg day from Tuesday to
Thursday when the intermediate week went to one speed day.

## Volume across the program

Weekly lift sets (all days) and the Thursday leg day, HALF_MANNY:

| Week | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lift sets | 77 | 71 | 73 | 55 | 78 | 78 | 78 | 54 | 75 | 75 | **77** | 47 | 30 | 13 |
| leg day sets | 25 | 25 | 25 | 20 | 25 | 25 | 25 | 20 | 25 | 25 | **25** | 20 | 8 | 7 |
| long run | 3.1 mi | 4 | 5 | 6.2 | 6.2 | 8 | 9.5 | 10 | 10 | 8 (rehearsal) | **12.5** | 60 min | 7 | race |
| long-run tier | C | B | B | A | A | A | A | A | A | A | **A** | B | A | race |

- The leg day is 25 sets in every week that is not a deload (`liftRecoveryWeeks` = 4, 8, 12, where the load drops to
  RPE 6 and the calf and carry blocks go, 20 sets) or a taper week (`taperWeeks` = 13, 14, primers). It is the same
  count in week 1 (long run 3.1 miles) and week 11 (12.5 miles). **The lifting does not read the running's build**: the
  deload falls every fourth week by count, never on the peak long-run week (0 of 1,728 race programs below).
- The taper itself matches doctrine: two weeks (Bosquet, Montpetit, Arvisais and Mujika 2007: two weeks, volume down
  41 to 60%, intensity and frequency kept), weeks 13 and 14 at 30 and 13 sets, primers at RPE 5–6, no lifting from two
  days out (D38).
- The main lifts are already light on a prevention build: the squat is capped at 61% of the entered max, RPE 6.5, two
  sets. The load is not the problem; the **count of loaded leg movements two days before the long run** is: squat,
  lateral lunge, isometric hold, single-leg hinge, single-leg hip thrust, eccentric calf raise and a heavy loaded
  carry, seven loaded patterns on one day.

## How often the shape occurs (1,728 race programs)

Sweep: run_5k, run_10k, run_half, run_marathon × 6 rest-day calendars × 4 lifting foci × 3 experiences × 3 equipment
tiers × 2 seeds, each built once from HALF_MANNY's fixture with those fields replaced.

- Every program has a leg day and a long run (1,728 of 1,728).
- Leg day to long run gap in the peak week: 2 days in 666, 3 days in 630, 4 in 144, 5 in 288.
- The peak long run is tier A (≥75 min at the prescribed pace) in 1,296 of 1,728 (75%; every 10K, half and marathon
  program; no 5K). Of those, the leg day sits **exactly two days before it in 510 (39%)**, and in 474 of the 510 the day
  between carries a recovery run of 30 minutes or more.
- The peak-week leg day carries at least the median non-deload leg-day count in 1,417 of 1,728 (82%); the median is
  25 sets on every focus (support_prevention 25, support_strength 24, support_athletic 25, hypertrophy 25) and every
  experience (beginner 25, intermediate 25, advanced 23).
- The peak long-run week is a lift deload week in **0 of 1,728**.

## What the watch recorded (COROS Pace 4, read 2026-11-07)

| Date | Session | Time | Distance | Pace | Avg HR |
|---|---|---|---|---|---|
| Mon 26 Oct | week 10 tempo | 36:24 | 5.64 km (3.5 mi) | 6:27/km (10:23/mi) | 165 |
| Fri 30 Oct | recovery run | 34:45 | 4.91 km | 7:04/km (11:22/mi) | 167 |
| Sat 31 Oct | week 10 long run (8 mi rehearsal prescribed) | 1:00:10 | 8.79 km (5.5 mi) | 6:51/km (11:01/mi) | 165 |
| Mon 2 Nov | indoor bike (speed day swapped) | 25:04 | | | 136 |
| Wed 4 Nov | run on the rest day | 20:14 | 3.24 km | 6:15/km (10:03/mi) | 168 |
| Thu 5 Nov | leg day (no watch record) | | | | |
| Fri 6 Nov | recovery run 45 min: **skipped** | | | | |
| Sat 7 Nov | week 11 long run (12.5 mi prescribed) | 1:00:59 | 8.88 km (5.5 mi) | 6:52/km (11:03/mi) | 167, max 184 |

Saturday's mile splits: 11:15 at HR 152, 10:49 at 165, 10:49 at 169, 11:01 at 171, 10:58 at 172, then a closing half
mile at 10:21/mi, HR 180 to 184. COROS classed both Saturdays as **Tempo** (aerobic training effect 4.0), not as easy
runs. Mario is 33: estimated maximum about 185 to 190, so the long run sat at 88 to 92% of maximum from mile two.

The prescription says average Recovery Pace **13:20/mi** (the chart row of a 10:30 mile, the anchor entered at
onboarding). He ran **11:03/mi**, 2:17 a mile faster than prescribed, within 30 seconds of the row's 10K pace
(11:35). His week 10 tempo ran 10:23/mi for 36 minutes, which the chart puts on the 8:30 to 9:00 mile rows (tempo 9:55
to 10:30, recovery 11:00 to 11:35). **The 10:30 anchor is two rows slow for his current fitness**, so every pace the
app prints reads slow, he runs by feel, and by feel his long runs land at tempo effort. The watch cannot show the leg
day, so its share of the heavy legs cannot be separated from the pace; both were present. COROS training load for the
week was "Optimized" or "Maintaining" every day (ratio 0.81 to 1.22), recovery 74% after the run.

## Root cause and every reader of the same value

1. **The leg day's volume is fixed by template, not by the week's run.** `engine-c.ts` (role `legs`, prevention branch)
   writes the main squat, the two-round runner-armor circuit, the glute block (D254), the calf block (D4) and the carry
   finisher on every week; `budget-engine-d.ts` deloads by `isRecoveryWeek` (every fourth week) and tapers by
   `inTaper` (the last two). Nothing reads the long run's size on any day but the long-run day itself.
2. **The long run's size is read by one predicate, `_longRunTier` (`budget-engine-d.ts`)**, and its readers are
   `d18LongRunDayPass` (the run is the day: tier A mobility only, tier B eight upper sets, no carries), the D155 tier B
   accessory pick, and `capSessionBudget`'s trunk floor carve-out. None reaches the day before the eve.
3. **The leg day's placement** is `nrcLegLiftPlacement` and `_nrcLegCost` (`core-legs.ts`): the long run and its eve
   forbidden, a lift-only day costs 0, so the day two before the long run is the preferred home whenever the calendar
   has one. `deconflictSameRegion` reads the same table. Mario held a spacing rule and a lighter-main swap on
   2026-10-24 ("If I revisit this later it will be a set cap on hard-run days, not a move"; `leg-lift-placement.md`).
4. **The pace anchor** is `cardioGoals.run.mileBestMins/Secs`, read by `runAnchorInfo` (`cardio-progression.ts`) and
   the chart lookup; the pencil on the program card re-enters it (D189) and every run ahead rebuilds off it.

## What professional doctrine says (read 2026-11-07; sources at the foot of the ruling)

- **Residual fatigue from one lifting session impairs the next endurance session for hours to days.** Doma and Deakin
  2013 (running economy and time to exhaustion the day after a lower-body session); Doma, Deakin and Bentley 2017
  (Sports Medicine review: a 40 to 60 minute resistance bout stresses the body for several days while an endurance
  session is recovered within about 24 hours; they name order, the recovery period between modes and intensity as the
  levers, and give no fixed window).
- **Lower-body lifting goes 48 to 72 hours before the longest or hardest run** (RunnersConnect, "two to three days is
  ideal"); **all lifting before Thursday for a weekend long run** (Runner's World, Centenari); **two nights of sleep
  between a lift and a speed workout** (Norris). The app's 48 hours is the floor of that range, with a 45-minute run in
  between.
- **As the running volume climbs, strength volume drops and intensity stays** (Centenari); **frequency drops from two
  or three sessions to one or two as the race nears** (RunnersConnect); Beattie 2017: two sessions a week in the
  pre-season, one in-season, running economy and vVO2max still improved; Blagrove, Howatson and Hayes 2018: two to
  three sessions a week, heavy beats muscular-endurance work. The last four weeks: one heavy session, few exercises,
  low reps (Centenari); the final week no eccentric work.
- **The source plan carries no lifting at all** and says: use the recovery runs and rest days to break up the speed and
  long runs; "sometimes the best speed run or long run will be no run."
- **Onboarding was not misaligned.** `primaryPath: event`, `liftingFocus: support_prevention` is the right priority and
  already caps the mains at 61% and RPE 6.5; the gap is that the leg day's count never bends to the week's run.
