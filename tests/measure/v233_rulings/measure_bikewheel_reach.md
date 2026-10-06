# V233 P-BIKEWHEEL — measure follow-up (reach), returned 2026-10-05, tree ia-version 232, HEAD 6ee30ea, clock 2026-10-03

Saved verbatim by the main session from measure's return.

MODE     B (before-picture). Tree ia-version 232, HEAD 6ee30ea, clock pinned to 2026-10-03.
METHOD   tests/measure/v233_bikewheel_reach.js, output in v233_bikewheel_reach.out.txt (all 6 parts printed DONE, 0 crashes).
- D is a dynamic VM run. It uses a DOM-registry stub that parses ids and values out of the rendered HTML and drops nodes when their container is replaced.
- S and R run on measure B's lattice (10,080 configs) plus X (6,930 multi-sport configs).
- IB and IX sweep cfg.injury: 6 regions × {protect, workaround} plus knee halfstep, which is 13 states.
- V checks base rest keys against the injured variant.
- Oracles: field kind and seeded value come off the rendered HTML. The stored sum is the hand value 600+30.5. Cross-train minutes are checked against the uninjured same-day emitted time dose.

VERDICTS
1. Rest-day reach: YES. The path is the rest sheet's "Training anyway?" move. The other paths:
   - The rest day's own view: NO. openDayKey :11813 sends rest days to openRestSheet, never openDetail.
   - Schedule edit: NO. The only restDays writer is the wizard (:2594), and a new program gets a new store.
   - Cardio swap on its own: NO. It applies only to a day that already opens the form.
   - Plain freeze: NO. A touched rest key restores from the stored grid as rest (:16104).
   - Injury overlay plus freeze carve-out: CONDITIONAL YES, not driven dynamically. Details below.
   - Travel: same splice as the injury overlay, but the carve-out at :16103 is injury-only, so the freeze keeps a touched rest key as rest.
2. Injury cross-train (:7893, and the swimout branch at :7848): bike cross-train appears ONLY when bike is in cardioTypes, because pickAlt (:7834) reads cfg.cardioTypes. On measure B's single-sport lattice the count is 0.
3. setCardioSwap run→bike: the bike field is a plain number box with no strip and dose null (:14744). Nothing carries from run_mins into bike_mins. The swap ERASES the stored run_mins and run_dist, and swapping back does not restore them.

NUMBERS
Q1 reproduction (D):
- Config: cfg run_10k+bike_base | balanced | intermediate | commercial | rest sun,wed | seed 76308 | startDate 2026-09-28 | W1. The W1 rest day is Wed (eligible), Mon/Tue are bike, Fri/Sat are run.
- Steps: rest sheet, Bike, 600, Log it. Then "Log more", Bike, 30.5. Stored w1_wed.bike_mins = 630.5 (a number, matching the hand value).
- restMoveCandidates(1) returns [mon,tue,thu,fri,sat]. The destination's existing log is not checked (:1525 checks the sources only).
- Path A: move Mon bike LSD onto Wed. openDetail(wed) renders the bike box with value="630.5", the plan strip, and the "logged but never marked" nudge. The same render comes back after refreshProgram from the persisted program.
- Any input or status tap then runs persistLogFields, which rewrites the entry with bike_mins "630.5" as a string and drops rest_cardio, rest_type and rest_mins.
- Path B: move Fri run onto Wed, then swap to bike. The box shows "630.5" with no strip, and the swap persists it with swapTo:'bike'.
- Lattice reach (R): every rest day sits in a week with a movable bike day, on both lattices: 85,680/85,680 (B, bike goals) and 191,436/191,436 (X). The X weeks all also have a run or swim day reachable through the swap route (191,436/191,436). All are dosed, so the strip shows.
- Correction to my prior report: the current bike box has min="0" and no max, so typing >599 directly is also reachable. The rest-sheet sum is not the only route.
- Injury carve-out (V): an injured variant has a training day on a base rest key in 20,160 of 3,567,928 key×state cases, 14,400 of them bike (example: run_5k+bike_base, knee/protect, W8 fri). These counts are not segmented further.
  - The mechanism: applyOverlays (:15460) skips only rest days in the variant, so it overwrites a rest day in the base with a variant training day. The freeze carve-out at :16103 then takes that live day for a touched key that has no ia_hist_ snapshot, and applyRestCardio writes no snapshot.
  - The splice is date-gated to on or after ov.from, so this needs rest cardio logged on a day and an injury overlay starting that same day.
Q2 (IX, 90,090 injured builds):
- 654,696 bike Cross-Train forms, all on run+bike or swim+bike configs. Every one is a number box with a strip, dose `time(parsed)`.
- Minutes: min 12, p10 33, p50 35, p90 45, max 120. Exactly 35 on 478,848 (the minsOf fallback constant at :7837 or a genuine 35; this pass does not split them). >59 on 39,648. 0 non-integer.
- Oracle: 86,616 of 91,152 comparable days equal the uninjured time dose. Mismatches are LI days, e.g. base 16 vs cross-train 15.
- By state: shoulder protect and shoulder workaround (swim to bike) 103,680 each. Knee, ankle, hip and lowback protect: 68,274 each from replaced runs, plus 43,560 each on days where the base had bike or no cardio (the calendar re-places them).
- The other 7 states give 0. IB (43,680 builds) gives 0 Cross-Train days.
Q3 (S): 300,960 of 622,650 log forms (48.34%) are run or swim days where the picker offers bike (it always offers run, bike and swim, :13840). All 300,960 swapped bike fields are number boxes, with strip 0 and wheel 0.
- Swapping away from a planned bike day and back restores the strip on 116,280 of 128,880. The other 12,600 are the null-dose INT days.
- Dynamic run: on w1_sat Long Run {dist 3.1} I typed 45 min / 5 mi and they were stored. Swapping to bike gave a box with value "", and stored run_mins and run_dist became "". Swapping back left both "".
- Reopening after a saved bike swap of 40 shows the box with "40", no strip, and _curLogDose null (:13817).

ROOT/SITES  writer :1438 (applyRestCardio). The move is applyRestMove :1415 and applyRestDayMoves :1462, re-applied in refreshProgram at ~:16115. The destination guard is only day.rest/!moved in restDayEligible :1509. The form opens through openDetail :14089, buildLogHTML :13806, and the emitter :13794. The swap is :14735, and its rewrite is persistLogFields :14686.
UNKNOWN  The injury carve-out was not driven end to end in the VM, and the 20,160 is not segmented. The exactly-35 count is not split into fallback versus genuine. Three-sport configs (run+swim+bike, where noimpact_swim prefers swim) were not swept. On-device stored values are unknown.
