# Queue item P-LSDPACE: measure m1 (before-picture), measured on V237 as shipped

Reported by Mario, 2026-10-08: an LSD card prints a pace followed by "(zone 2)". If that pace is not the
athlete's real zone 2, the athlete chases the number and overextends. He is not sure the card should print a pace at all.

Script: `tests/measure/queue_lsd_pace.js`, output `tests/measure/queue_lsd_pace.out.txt`.
Lattice: 1,920 builds, 0 crashes. That is 10 goal configs (pace 1.5mi 12:00 and 10:30, pace 1mi 8:00, run_mile_time,
run_15_under10, run_base, 5K, 10K, half, marathon) × 3 experience levels × 4 mile anchors (none, 7:00, 9:00, 10:30)
× 4 rest patterns × event on/off × 2 seeds. 28,396 LSD/long run sessions. The oracle is PACE_CHART's mile→recovery
rows typed in by hand and interpolated, never via paceChartLookup.

## Headline
- "(Zone 2)" sits next to a pace on 16,492/16,492 NSW pace-family LSD sessions (pace goal, mile, 1.5-mile). It
  appears on 0/3,360 run_base and 0/8,544 NRC long runs. All 16,492 also print "60–70% max HR".
- No heart-rate input exists: 0 cfg or wizard HR fields in comment-stripped code. "Zone 2" is a label only.
- The pace is a target with no ceiling: 16,492/16,492 carry dose.tgt and 0 carry dose.cap. run_base prints
  "Around X" + "Do not run faster than Y" (cap on 3,360/3,360). NRC prints "average Recovery Pace (X)" +
  "Average no faster than Y" (cap on 7,968/8,544; the remaining 576 are race day or time trial and print race pace).
- Against the recovery pace on the athlete's own mile-best chart row, the pace-family LSD pace is equal on
  2,324/16,492, FASTER on 6,356 and slower on 7,812. When it is faster, the mean gap is 7.1 to 12.9 s/mi and the max is 28 s/mi (1mi 8:00 goal).
  The cause: on run_pace_goal the row comes from the pace clock (`paceProgression[idx]`), not the mile best
  (handoff V225 note 1). run_base and NRC match the athlete's own row on 100% (3,360/3,360 and 7,968/7,968).
- HALF_MANNY (run_half, mile 10:30, digest 2d35e8f743680cfa): 14 long runs, all paced, 0 Zone 2. The reported card
  cannot come from this fixture. Mario's live program is unconfirmed.

## Q1 What prints (pace family, mile 9:00, intermediate)
- Card: openDetail (:14202) → buildCardioHTML (:13098). Long: "3 mi at Recovery Pace: 11:52/mi (Zone 2). /
  60–70% max HR. You must be able to speak in full sentences the entire time…". Easy: "2.1 mi at Recovery Pace:
  11:52/mi (Zone 2). / 60–70% max HR. Full sentences, no gasping…". Both are titled "Run — Long Slow Distance (LSD)".
- Log strip, _doseStripHTML (:13525): "Run — LSD · Planned 3 mi @ 11:52/mi". Derived readout (:13542):
  "Ns/mi faster than target / slower than target / on target", measured against that pace.
- Today hero, buildHeroPreview (:11786): truncated detail. Week grid, dayCode (:11866) → runSessionCode: "LSD" chip, no pace.
- Journal: ia_hist_ snapshot re-renders through openDetail. Not traced further.

## Root
buildRunSession, base_v237.html:3975 (lsd_long, `recPace=_fmtPace(_row.recovery)`) and :3996 (lsd_easy); the strings
are at :3990 and :4029. `_row = paceChartLookup('mile', anchor)` (:3832), with the anchor being the mile best or the
experience default {690,570,450} (:3829–3831). On run_pace_goal it is overridden by
`paceChartLookup('mile', paceProgression[idx])` (:3948–3951). PACE_CHART :4976, steadyCapSec :4998. NRC:
buildNRCSession :4396 (paces), :4443 (long-run detail).

## Q4 Prescribe vs log
- Pace family: dose dist. Miles are fixed, time is free, pace is derived. The card prescribes miles AND pace (2 of 3 fixed).
- run_base: dose time. Minutes are fixed; "Around" pace is an anchor and the cap is a ceiling.
- NRC: dist, or time on minute entries. It prescribes distance + average pace + cap.
- A log_rpe field exists (:14222). Not verified to render on LSD cards.

## Q5 Doctrine (doctrine/ present). 0 hits for "zone 2", "max HR" or "% of max" in all 7 files: both labels are app-written.
- NSW PTG 2020 p11 (physicaltrainingguide2020.txt:218–229): LSD is low to moderate and should feel relaxed. Use
  the Talk Test (short sentences). Duration over intensity; about 40 min is typical. **No pace given.**
- NSW 11pg (nsw_ptg_sealswcc_11pg.txt:12, pp2–3): the same Talk Test wording.
- NRC half: long runs at a comfortable pace, run as Progression Runs (:78, p5). A Progression Run averages Recovery Run
  pace (:240–247, p11). Recovery Pace is 4–5/10 effort, easy enough to talk (:298, p13). A numeric chart is on
  pp8–9 in all 4 plans.
- App additions on NRC long runs that Nike does not print: the D117 cap, "Comfortable the whole way. Average no faster
  than X" (:4443). The pace number itself is Nike's chart.

## Q6 Other readers of dose.tgt / _row.recovery
- Code: doseDerived :13498/:13503; _doseStripHTML :13525; updateDoseDerived :13542; _longRunTier :11085
  (NSW long tier = mi×tgt/60, tiers A/B/C on 4,240 NSW long runs); sessionTimeEst :11776 (parses pace out of the
  detail); d189DefaultAnchorNote :11112 (needs `\d:\d\d/mi` in the detail); doseFromCardio :13475.
- _runClass puts NSW LSD easy days in the "Long" class (16,492/16,492), so easyVsPrescribed (:17181) and
  recoveryPaceWeekly (:16471) do not read NSW pace-family LSD today.
- Tests: "Zone 2" in 0 files. "Recovery Pace" in 4 (g203_ceiling_and_anchor, g226_d188_beginnermile, sabotage
  v203/v207_d106a). dose.tgt in 15 (incl. g191_pacedelta, g202_pace_anchor, g209_d140_tier, g216_d156_longday,
  g225_d186_clockend). "max HR" in 6, only for the SI/LI Zone 5 and Zone 3–4 copy.

## V238 working tree
14 hunks (getPrograms, applyRestCardio, restMoveCandidates, _wkScoot, renderWeekView, persistLogFields,
seedFromPriorPrograms, ladderWeekly, renderProgressScreen). None touches the LSD pace path.

## Unknown
Bike and swim "Zone 2" cards (:4652–4672, :4850; static read only, not swept). Whether log_rpe shows on LSD cards.
Journal render path. Mario's live config.
