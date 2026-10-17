# The NSW long slow distance card and the run log's planned miles: decisions

The LSD cards of the NSW test programs (`lsd_long` and `lsd_easy` in `core/src/engine/nsw-cardio.ts`), the strip and
readout their log form prints (`doseDerived` and `updateDoseDerived` in `frontends/app/src/legacy/src/js/log-entries.ts`,
and the Angular `cardio-fields-model.ts` that draws the same form since v0.239.40), and what a run entry stores when a
wheel was never touched (`persistLogFields` in `frontends/app/src/legacy/src/js/day-status.ts`, the one writer every run
card shares). Tests: none yet; the build writes them.

## P-LSDPACE-1 to -6: the LSD card prints Zone 2 and no pace, and untouched planned miles never store (not built)

- **Date:** reported by Mario 2026-10-09 (the queue-review chat, off a card on PRT TING); measured m1 on V237 and m2 on
  V238 (code reads only); coach r1 2026-10-09, Mario pushed back, coach r2 the same day; Mario answered r2's three
  calls 2026-10-16, with every premise re-read on v0.240.0 that day. **Ruled by:** coach (r2) on Mario's pushback, with
  his answers. **D-codes:** assigned from the registry when the build is slotted. **Bump:** not picked yet (Mario,
  before builder). **Shipped:** not yet.
- **The ruling, whole:** `tests/measure/queue_rulings/coach_lsd_pace_r2.md` (supersedes r1 where they conflict; its
  Status line predates the answers below), Mario's pushback verbatim in `mario_lsd_pace_decision.md` with his answers at
  its foot. Measures: `measure_lsd_pace_m1.md`, `measure_lsd_log_m2.md`; r1's lattice driver `coach_lsd_pace_r1.js`.
- **The finding:** every LSD card on the NSW test programs (`run_pace_goal`, `run_mile_time`, `run_15_under10`) prints
  `X mi at Recovery Pace: 11:52/mi (Zone 2).` and `60–70% max HR.` The pace is a target that walks with the goal clock,
  faster than the athlete's own easy pace on 6,356 of 16,492 cards by up to 28 s/mi (m1); the HR label is in neither
  doctrine, and the app reads no heart rate. NSW p11 gives LSD no pace, only the talk test. The log then grades the
  run against that pace, and a run logged by time alone stores the plan's miles as the athlete's: `doseDerived` falls
  back to `dose.mi` and `persistLogFields` writes it (`day-status.ts:221`, re-read on v0.240.0).
- **Mario's words:** 2026-10-09, "i only want the zone 2 no pace recommendation" (whole quote in
  `mario_lsd_pace_decision.md`). 2026-10-16, on r2's three calls: the log form stays miles + time with the pace derived
  (r2's A); the planned-miles stamp goes, app-wide (P-LSDPACE-3, yes); base programs' easy runs keep their ceiling
  (P-LSDPACE-5, keep). Each was coach's recommendation.
- **What changes:**
  - **P-LSDPACE-1, the card:** `lsd_long` reads `{dist} mi at Zone 2 effort.[ Taper week. Distance reduced
    intentionally.]` then `Zone 2 is the Talk Test. Short sentences, a breath between phrases. If you cannot speak, slow
    down. Bring water if over 5 miles.`; `lsd_easy` reads `{dist} mi at Zone 2 effort.` then `Zone 2 is the Talk Test.
    Short sentences, a breath between phrases. This is your recovery run. Not a tempo, not a push. If in doubt, go
    slower.` No pace, no ceiling, no max HR.
  - **P-LSDPACE-2, the log form:** miles + time, as today. The strip reads `Run — LSD · Planned 3 mi`, keyed on a dose
    flag (`noPace`), never on a missing `tgt`. The readout drops "faster/slower than target" and "on target": miles
    untouched prints `Pace — derived · enter miles`, both rolled prints `Pace — derived 11:37/mi`.
  - **P-LSDPACE-3, the stamp, app-wide:** `doseDerived` returns no `dist` and no `pace` on a dist form until the miles
    are the athlete's, and no `pace` on a time form until the minutes are; a value derived from the athlete's own
    entries (reps × rep length on `reps_dist`) still stores. This covers NSW LSD, NRC long and dist recovery runs and
    `run_base`. Accepted cost: a run logged by time alone counts 0 miles on the week's MILES, Progress mileage, the
    ladder, the wizard seed and `plannedVsLogged` until the miles are rolled. D221's tests retire or are rewritten.
  - **P-LSDPACE-4, the hidden pace:** `dose.tgt` stays on the dose, unprinted, for `_longRunTier` and
    `sessionTimeEst`, and comes from the athlete's own mile row, not the goal clock. Some long-run tiers move (r1
    counted 120 of 9,424 long-run days on V237; measure recounts).
- **What deliberately does not change:** NRC cards (Nike verbatim); `run_base` easy and benchmark cards (P-LSDPACE-5);
  bike and swim Zone 2 cards (the bike card's "60-70% max HR" goes only in a copy pass Mario asks for); both LSD notes;
  `prog.long` and `prog.easy`; `_longRunTier`'s thresholds; D202's plan face on the miles wheel (a placeholder that
  stores nothing).
- **Expected values (r2, printed on V238; re-print on the build's tree):** pace goal 1.5 mi 12:00, intermediate, mile
  9:00, rest Sun and Wed, seed 76308, event off. W1 SAT card `3 mi at Zone 2 effort.` then the talk test line; dose
  `{k:dist, mi:3, tgt:695, noPace:true}`, tier C, the same words every week; W10 SAT 6.6 mi moves tier B to A; W11 SAT
  stays tier A. Logging 3.10 mi at 36:00 stores `run_dist` "3.10", `run_mins` "36", `run_pace` "11:37/mi"; time alone
  stores `run_mins` alone. HALF_MANNY (NRC) does not move; standing ruling 5 applies if it does.
- **Before builder:** measure runs r2's P-LSDPACE-6 list on the current tree, with the Angular cardio fields model in
  scope beside the legacy form, and a fresh coach re-checks r2 against it (the ruling was cut on V238).
