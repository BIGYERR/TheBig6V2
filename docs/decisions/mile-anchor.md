# Mile anchor: decisions

The run anchor (the athlete's mile time, entered at onboarding or by the pencil on the program card, D189 in the handoff) and
what the app does when the logged runs disagree with it. Measure: `tests/measure/mile-anchor_logged-pace.md`. Mockup:
`docs/design/mile-anchor-nudge.html` (https://claude.ai/artifact/N1hCwfhuQiSVZvvngeF3jY, private to Mario).

## D274 P-ANCHORNUDGE: two easy runs in a row off the plan offer the pencil, pre-filled (Mario concurred 2026-11-08)

- **Date:** 2026-11-08. **Ruled by:** the main session in the coach hat; Mario chose placement B ("1. concur") on the first
  mockup (2026-11-07) and concurred with the rule as the loop shows it ("1 concur i like the sheet", 2026-11-08).
- **Finding (the measure):** Mario's live anchor is an 8:00 mile edited in week 5, so his program prescribed recovery at
  10:30/mi; his last two long runs came in at 11:01 and 11:03/mi, 31 and 33 s/mi slower, at 88 to 92% of maximum heart
  rate, and his tempo 58 s/mi slower than prescribed. The anchor is about two chart rows too fast for him (the tempo column
  reads his 10:23 tempo as an 8:54 mile). The app computed and printed the gap each time ("Your pace … 33s/mi slower than
  target", V191 D40) and did nothing with it afterwards. A chart row is 30 s of mile; on a recovery card about 35 s/mi of
  logged pace. Only recovery and long run cards carry a pace the whole run holds (a speed card's logged pace averages work
  and recovery); a race program hands the rule three such cards a week. The pencil locks in the last three weeks (D189).
- **What changes:**
  1. **The trigger.** After a cardio log is saved on a run card whose frozen `ia_hist_` snapshot is a recovery run or a long
     run with a prescribed pace (`dose.tgt`), the app reads the last two such cards that carry a logged distance and time
     (a card with no log, a skipped run, or a swapped sport is passed over, not counted). When **both** are more than one
     chart row off their prescribed pace **in the same direction** (faster or slower), and the program is not in its last
     three weeks, the sheet opens once, over the day, after the "Run logged." toast.
  2. **A row.** The implied anchor of a logged run is `paceChartLookup('recovery', loggedSecPerMile).mile`; a run is "a row
     off" when that implied anchor differs from the program's anchor by 30 seconds or more. The number offered is the
     implied anchor of the **less extreme** of the two runs (the slower implied mile when the runs were faster than the plan,
     the faster when slower), rounded **toward the current anchor** to the nearest 30-second row. Mario: 11:01 and 11:03 →
     8:31 and 8:33 → 8:33 → offered 9:00 (the current anchor is 8:00, so rounding toward it would give 8:30; the ruling rounds
     to the slower row, 9:00, because the honest column, tempo, reads 8:54 and a slower anchor is the safe error).
     **Rule: round to the slower 30-second row in both directions.**
  3. **The sheet (placement B).** Label "Coach". Title "Two easy runs in a row off the plan." Body: "<pace 1> and <pace 2> a
     mile against <prescribed>. Your runs say your mile is nearer <offer> than <anchor>. Change it and every run ahead of you
     rebuilds. The mile locks from week <totalWeeks − 2>." Two buttons: **Update mile time** (live) opens the existing pencil
     sheet (`openMileSheet`) with the offer in its minute and second fields; **Keep <anchor>** closes it. Copy rule: no
     mid-sentence dash, short sentences, the coach's voice. The app never writes the anchor itself.
  4. **Quiet after a dismissal.** Keep records the two cards it judged (on the program, not the log); the sheet does not
     open again until two new qualifying cards exist. A commit through the pencil clears the record (the anchor moved).
  5. **Silent when locked.** In the last three weeks (`totalWeeks − week < 3`, D189's lock) nothing opens.
  6. **One run never speaks**, whatever the gap.
- **What deliberately does not change:** the pencil, its lock popup, its validator and its toast (D189); the "Your pace"
  readout (D40); no pace, no run, no lifting moves; the anchor is only ever written by the athlete; speed cards and
  benchmark runs are never read; no heart rate is read (the app has none).
- **The strongest counter-arguments, for Mario:** (a) three runs instead of two, a week's worth, to ride out a one-off:
  rejected because two in a row at a row or more is already two signals and the lock leaves little time. (b) faster-only, as
  the first mockup had it: rejected because Mario's own case was slower, an anchor set too hopefully. (c) placement A (the
  program card) or C (the next run card): Mario chose B, the moment the athlete holds the evidence.
- **Expected values (typed by hand):** Mario's two runs 11:01 (661 s) and 11:03 (663 s) read on the recovery column → mile
  511 s (8:31) and 513 s (8:33); less extreme 8:33; slower row 9:00 (540 s); offer 9:00; the sheet's body "11:01 and 11:03 a
  mile against 10:30. Your runs say your mile is nearer 9:00 than 8:00. Change it and every run ahead of you rebuilds. The
  mile locks from week 12." Faster case (fixture anchor 10:30, recovery 13:20): logged 12:40 and 12:30 → implied 9:59 and
  9:50 → less extreme 9:59 → slower row 10:00 → offer 10:00. One row off at 15 s/mi: no fire. Two runs off in opposite
  directions: no fire. Week 12 of 14: no fire.
- **Release:** v0.259.0 (2026-11-08), with Amendment 1 (below). Bump: MINOR (Mario, 2026-11-08), its number set when it is slotted: v0.257.0, named here
  first, went to the swipe deck (D275), which builds before it (Mario, 2026-11-08). Build order (Mario): after his UI/UX pass merges
  into `main`; the loop mockup is then redone inside the new UI and he picks again before the build, so the sheet lands
  on the buttons as he leaves them.
- **Tests at build time:** `tests/integration/mile-anchor.test.ts` (the feature's existing file): the trigger on two slow
  runs (Mario's values), on two fast runs (the fixture), no fire on one run, on 15 s/mi, on opposite directions, on a
  speed card, in week 12; the offer arithmetic from the hand table above; the sheet's text; Update opens the pencil with
  9:00 in the fields; Keep records the pair and a third qualifying run does not reopen it until a fourth; a pencil commit
  clears the record. Each failing on v0.256.0 except the guards named as such.

## D274 Amendment 1: the sheet rises over This Week's run card, and the offer comes from the slower run (Mario, 2026-11-08)

- **Date:** 2026-11-08, Post-v0.258.1. **Ruled by:** Mario. The loop was redone inside the new This Week as two clickable
  builds of the real app, his Saturday seeded (an 8:00 mile, last Saturday 11:01, today 11:03): A, the sheet over the
  session sheet right after Log; B, the sheet over This Week once the run card is back on its done row. Seeing them, he
  asked for D278 first (the run card carries its own workout, the cardio's own sheet; v0.258.1), then answered both
  calls, each put with a recommendation: "For the nudge (v0.259.0): placement B and the slower-run offer?" "Yes, both".
  **Bump:** MINOR, v0.259.0 (Mario, 2026-11-08, asked again when slotted).
- **Amends item 3's placement.** The sheet no longer opens over the day after the toast: it rises over This Week 0.7 s
  after the run card is back on screen with nothing over it (the cardio's sheet closed, the week screen showing), its
  done row reading the run just logged. A log made with This Week already showing (the recorder's Save, when it lands)
  raises it as soon as the card shows. Why: since D276 and D278 the run card is where every way of logging a run ends;
  the recorder's Save closes into the card and never passes a sheet. The counter-argument Mario weighed: the sheet is
  the moment the number is in hand, and with B the coach waits for Back (a run logged and the lift started from the
  sheet waits until This Week shows).
- **Amends item 2's wording.** "The less extreme of the two runs (the slower implied mile when the runs were faster than
  the plan, the faster when slower)" contradicted the ruling's own hand example (8:31 and 8:33 → 8:33) and the measure
  ("stated from the slower of the two runs"). Ruled: **the slower of the two runs' implied miles, in both directions,
  rounded up to the slower 30-second row** (the safe error). The expected values stand: 9:00 for Mario's runs, 10:00 for
  the faster fixture. The two readings differ only when the runs fall either side of a row line, by one row.
- **Expected values corrected against the chart (the measure, while the tests were written).** The faster case's implied
  miles were typed by hand and are 3 s off: PACE_CHART's recovery column reads 12:40 (760 s) as **9:56** (596) and 12:30
  (750 s) as **9:47** (587), not 9:59 and 9:50 (the 10:00 row's recovery pace is 12:45). The offer stands at 10:00. Mario's
  whole-second values stand (11:01 reads 8:31, 11:03 reads 8:33, the measure script's own figures); his logged 1:00:59
  over 5.52 mi is 662.83 s a mile, printed 11:03 and read 8:32, and the offer stands at 9:00. No behaviour moves, so
  the coach hat corrects the numbers here and reports them to Mario; the tests type the corrected values.
- **Item 4 as built (siting, recorded here):** the record sits on the program (`ia_programs`) as `mileNudge: {cards,
  anchor}`, the two cards judged and the mile they were judged against. A pencil commit moves the mile, so the record no
  longer applies (item 4's "a commit through the pencil clears the record"); either answer records the pair, so the
  sheet opens once for it.
- **Tests (moved from the plan):** the judge lives in the iOS app's model (`frontends/app/src/app/screens/mile-nudge/`,
  Angular only, as D276 and D278), so its tests are the app's: `frontends/app/test/unit/mile-nudge.test.ts`, in place
  of `tests/integration/mile-anchor.test.ts`.
- **Release:** v0.259.0 (2026-11-08). The page Pages serves changes only by its version (`tools/same-script.mjs`: the
  same 172,655 script tokens); `frontends/app/test/unit/mile-nudge.test.ts` 16/16, its 14 judge and sheet tests unable to
  load on v0.258.1 (`mile-nudge-model.ts` is new) and its two wiring tests, run on v0.258.1's sources, each failing.
