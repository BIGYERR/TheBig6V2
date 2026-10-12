# Group 10: pace clock and the mile anchor

Phase 2 parity record (`docs/test-migration.md`, the parity rule). The legacy gates stay in `tests/gates/` and keep
running in CI until phase 3 deletes the machinery; this file is what explains their rows when the manifest drops them.

- **Gates (10, 348 rows):** `g202_pace_anchor.js` (33), `g202_pace_copy.js` (16), `g203_ceiling_and_anchor.js` (95),
  `g203_mile_pencil.js` (70), `g204_clock_limb.js` (21), `g223_d183_safepace.js` (60), `g225_d186_clockend.js` (10),
  `g225_d187_pacerate.js` (9), `g226_d188_beginnermile.js` (16), `g226_d189_pacedisclose.js` (18).
- **New tests.** The group's map named two files; the claims split further by feature, so each file stays near a
  second and the slow lattices sit in `tests/sweeps/` (CI only), with a seeded sample of each in its integration file:

  | File | Tests | Wall (alone) | Holds |
  |---|---|---|---|
  | `tests/unit/clock-format.test.js` | 6 | 0.1 s | `_clkMS`, the one m:ss owner (D126) |
  | `tests/integration/clock-format.test.js` | 15 | 0.8 s | every clock printed on tempo, NSW interval, NRC and swim cards, the seeded mile |
  | `tests/integration/pace-clock.test.js` | 25 | 1.0 s | the pace goal's clock: anchor, target, rate, block end, notes, injury appendix (D100, D101, D186, D187, E7, E12, D2b-iii) |
  | `tests/integration/easy-run-ceiling.test.js` | 10 | 0.2 s | the easy-day ceiling on NRC and run_base cards (D117) |
  | `tests/integration/mile-anchor.test.js` | 34 | 1.0 s | the anchor sentence and clipboard line, a goal change carrying the mile, the beginner's mile, the default disclosed (E5, E6, D118, D119, D188, D189) |
  | `tests/integration/mile-pencil.test.js` | 12 | 0.2 s | the mile pencil, its lock and its validator (D116) |
  | `tests/integration/pace-wizard.test.js` | 54 | 1.0 s | the wizard's cardio goal step (D183 under TZ=America/New_York and TZ=UTC, D188, D189) |
  | `tests/sweeps/pace-clock.test.js` | 10 | 3.3 s | the anchor lattice (360 builds) and the appendix lattice (55 cfgs) |
  | `tests/sweeps/mile-anchor.test.js` | 12 | 12.4 s | D188 over 20 seeds, long-run tiers over 384 cfgs, D189 S1 over 640 and 720 cells |

  Helpers: `tests/support/pace-clock.js` (a boot with the clock pinned from its first line, card readers, a DOM
  registry, the comment stripper), `tests/support/pace-clock-lattices.js` (the lattice claims an integration sample and
  its sweep share, with their hand tables), `tests/support/pace-wizard.js` (the cardio goal step rig lifted from g223).
- **Clocks.** Every app is booted with its clock pinned: 2026-10-11 12:00 local (the today of the other program tests),
  or the gate's own pin where it had one (2026-09-22 21:16 for g223, g225 D186 and g226 D189; 2026-09-30 09:00 for g226
  D188). g203_mile_pencil read the host clock; its start dates and its days-out count are now worked out from the pin.
- **Time zones.** g223 spawned one child per zone. `pace-wizard.test.js` runs its D183 rows twice in one process, a
  `describe` per zone that sets `process.env.TZ` and boots its own app, and its first test proves the zone took
  (offsets 240/300 in New York, 0/0 in UTC) and the clock reads 2026-09-22 21:16.
- **Version predicates.** The gates' era tables and `VER >= ERA` arms are gone: each test asserts today's arm only
  (the D187 rate {3,3,2}, the D109 and D103a labels, the D183, D188 and D189 copy, the D110a swim terms).
- **Oracles.** Unchanged from the gates and typed by hand: the NRC pace chart rows (doctrine/nikerunclub5k.txt page 8,
  re-checked row by row for this move), the D100 reading of a row at a distance, the rates and age scalers, Guide A's
  16 s/mi and PTG's 2x to 2.5x recovery, the swim progression, every ruled sentence, date arithmetic by Date.UTC and
  days-from-civil. No test asks the app what its answer should be.

## Rows

Held-by cells name `<file> › "<test name>"`; a sample test and its sweep share one name after the lattice label
(`sample lattice (...)` in the integration file, `full lattice (...)` in the sweep).

### `g202_pace_anchor.js` (33)

| Row | Held by |
|---|---|
| `P1` | `integration/pace-clock` and `sweeps/pace-clock` › "the anchor is the athlete's own chart row read at the goal distance, beginners included" |
| `P1b` | the same test (no beginner sits on the 690 row); `integration/pace-clock` › "a 6:00 mile at a 1.5 mi goal anchors at 370.73 s/mi for a beginner exactly as for an intermediate" |
| `P1c` | › "no build falls back to its experience default row while a mile time is on file" |
| `P1d` | › "at or below a mile the anchor is the mile column; past a mile it is strictly slower" |
| `P2` | › "the target is the entered time over the entered distance, km converted once at 0.621" |
| `P3`, `P3b` | › "the block is sized and paced on one number (paceGoalTarget equals the progression's target)" |
| `P4`, `P4b`, `P4c`, `P4d` | › "no build improves faster than the age-scaled rate, and every dampened build improves at exactly that rate" |
| `P5` | › "an improving block starts at the anchor and falls by the weekly rate, never past the realistic target" |
| `P5b`, `P5c`, `P5d`, `P5e` | › "a goal at or slower than the athlete's own pace holds the anchor all block, undampened, the entered goal kept" (P5c: this test and the one above each assert their class is reached) |
| `P5f`, `P5g` | › "every non-cutback interval week of a goal-met block reads the ruled sentence verbatim, with no dash" |
| `Q1`, `Q2`, `Q2b`, `Q3`, `Q4`, `Q5`, `Q6`, `Q7` | `integration/pace-clock` › "the pinned PRT TING block: 11 weeks, anchored on the 8:15 row at 1.5 mi, walking 3 s/mi a week to 8:05/mi" |
| `Q8` | `integration/pace-clock` › "the pinned block prints its clock on the cards: W1 SI 8:13, W6 SI 7:58, W10 LI 8:44, W1 long slow distance 10:59" |
| `R1`, `R2`, `R3`, `R4`, `R5` | `integration/pace-clock` › "the chart row reader returns the mile column at one mile, converts the beginner default, holds the running maximum and both clamps" |
| `B1` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |

### `g202_pace_copy.js` (16)

| Row | Held by |
|---|---|
| `C1a`, `C1`, `C2`, `C3` | `integration/pace-clock` › "the pinned block's dampened interval note is the ruled sentence, with no safety claim and no dash" |
| `C4`, `C5`, `C9` | `integration/mile-anchor` › "a pace goal's card says the anchor sets week 1 only; HALF_MANNY's chart card keeps the program-wide claim" |
| `C6`, `C7`, `C8` | `integration/mile-anchor` › "every provenance form on every chart goal takes its own tail, never the other's, with no dash; the clipboard mirrors the card" |
| `C10a`, `C10`, `C11`, `C12`, `C13` | `integration/pace-clock` and `sweeps/pace-clock` › "an injury pace shift appends the PACE CLOCK sentence once, as the tail, to every interval note in every class; no shift, no sentence" |
| `B2` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |

### `g203_ceiling_and_anchor.js` (95)

D117, `integration/easy-run-ceiling` ›:

| Row | Held by |
|---|---|
| `8` (the 8:00 row's arithmetic), `9`, `10`, `L:a7e18be5`, `L:886b1e4f`, `L:9b804b7a`, `L:32669e27`, `L:21b42c67` | "the hand rows match PACE_CHART, and the ceiling is the midpoint of tempo and recovery" |
| `L:eda70022`, `L:f4576af2`, `L:b7348670`, `L:1fd8d639`, `L:ba2946f3`, `L:20e8e2a6`, `L:0db407f3`, `L:097c0131`, `L:1773c035`, `L:5f623d67`, `L:ea745e35`, `L:f8fe6fbc` | the four "<goal> at <mile>, ...: recovery and long runs print <ceiling> and carry dose.cap <n>; speed, race day and the time trial carry none" tests |
| `L:db1c6440`, `L:fafe6f82`, `L:2a512334`, `L:f47d9604`, `L:42a90888`, `L:4cf22f11`, `L:c66cc496`, `L:3f9aecc0`, `L:68716095` | "the NRC sweep reached intervals, tempo, fartlek, hills, a race day, a time trial and enough of each card" |
| `L:965ceaec`, `L:ef9a9b94`, `L:1c54b669`, `L:2996b944`, `L:748731e1` | "the two ceiling sentences carry no mid-sentence dash and no Nike, and ship in the app as typed" |
| `L:e5165fe3`, `L:dd0752a2`, `L:72f55bc2`, `L:71847e0e`, `L:6972e695`, `L:ae4d3244`, `L:c2c0f7ef`, `L:c7b27f0c`, `L:eb890382`, `L:c59c0d60`, `L:ca0170eb` | the two "run_base at <mile>: both easy-run sites print Around <recovery> and the ceiling <cap> from the same row; benchmarks carry none" tests |
| `L:c23c4359`, `8` (the run_base 9:58 and 12:40 row) | "run_base's ceiling moves with the anchor: 9:58/mi at an 8:00 mile, 12:40/mi at 10:30" |

D118, `integration/mile-anchor` ›:

| Row | Held by |
|---|---|
| `L:6e0b5e1a`, `L:46df241f`, `L:8631d052`, `L:27aeb833`, `L:851680ed`, `L:eb5d9556`, `L:628e2414`, `L:92fb1f1a`, `L:e4f81ada` | "switching the run goal keeps the mile and its provenance, still drops the baseline, and writes no target the goal does not need" |
| `L:73a75273`, `L:f2ead1b9`, `L:c8b0c1a5` | "a run goal with no mile gains no phantom anchor when switched" |
| `L:2fd94643`, `L:d1b3ffca`, `L:15bb6ab8`, `L:6e651d66`, `L:a575c014` | "switching the bike goal leaves the run goal byte-identical and gives the bike no mile" |
| `L:28aa744e`, `L:ebf5bc79`, `L:beac687d`, `L:17bb1f79`, `L:075a7b01`, `L:7c70467a`, `L:1adaf29b`, `L:2923e72e`, `L:cadf8c98`, `L:06b88cf5` | "half, then a 1.5 mi pace goal, then half again rebuilds the original program" |

D119, `integration/mile-anchor` ›:

| Row | Held by |
|---|---|
| `L:5a2de7f0`, `L:c9acbdfc`, `D189` (edited from default) | "an edited anchor names the week and what it replaced: a prior time, padded, or the level default" |
| `L:c8726d67`, `L:ada2c122`, `L:b6be86e9`, `L:f36d242e`, `L:e70496af` | "an edited anchor with no record of what it replaced reads as entered, renders, and never says no mile was entered" |
| `L:e9b72a02`, `L:ab65473b`, `L:b35c8167`, `L:dc47a6b2`, `L:e1019438`, `D189` (the intermediate default), `L:5160f916`, `L:bc3b7db3`, `L:78cc8041` | "the entered, seeded, default and clamped forms read as typed; a clamp beats every kind" |

The rest:

| Row | Held by |
|---|---|
| `L:ef98c129` | `tests/integration/program-output.test.js` › "every program equals itself when built twice" (HALF_MANNY is its first config; held there, not repeated) |
| `L:35b804da`, `L:b856f7d9`, `L:a703b5b1`, `L:ccea86cd`, `L:a544b0fb` | DROPPED: version predicate (the "at ia-version >= 203 the D117/D118/D119 surface MUST exist" rows); each surface is exercised by the behaviour tests above |

### `g203_mile_pencil.js` (70)

`integration/mile-pencil` ›:

| Row | Held by |
|---|---|
| `L:dc265488`, `L:84ca9fde`, `L:e2ef29b9`, `L:46251a22`, `L:431bff0a`, `L:bd3a5289`, `L:044c8c64` | "the pencil's sheet, its lock popup and their fields are in the app" |
| `L:e4b34f8c`, `L:1858cb39`, `L:d733090a`, `L:37e0e7a1`, `L:3bcd7a5e` | "the last three weeks lock the mile: the hand table of weeks" |
| `L:39eb3747`, `L:0c678c2d`, `L:01153c7d`, `L:38b8271d`, `D182` (days out, race day), `L:50a5414d` | "the lock popup reads the ruled header, body and button, with the days out, the race day and the week" |
| `L:c4d2626b`, `L:fd13b52c`, `L:bd5dabf7`, `L:dc6dd877` | "with no race date the lock popup drops the two date lines and keeps the week and the body" |
| `L:75c0b1b4`, `L:85386118`, `D189` (run_base pencil, aria-label, Run paces group), `D188` (beginner pencil, aria-label, Run paces group) | "every run goal's card carries one pencil labelled "Change mile time" and a Run paces group, at every level" |
| `L:fb8baf73`, `L:e214c6ef`, `L:400dbc84`, `L:439d793f`, `L:3925d215`, `L:8bca4eaf`, `L:3f97ad9c`, `L:6d12c0a6` | "a commit over the default stores the mile as typed, kind edited in week 3, and records the default it replaced" |
| `L:2259761b`, `L:6a877a57`, `L:0fd51fd5`, `L:e4a2ef88`, `L:9464d455`, `L:6982f920`, `L:1d372617`, `L:0c192cd6` | "a commit over an entered mile records the prior time, toasts the ruled sentence, and the card names what it replaced" |
| `L:82fe46e0`, `L:4f270e5f`, `L:2b9e93a7`, `2`, `26`, `4`, `13` | "the sheet uses the wizard's validator: a blank field or an impossible time blocks, an edge time advises and commits" |
| `L:ef8638ec`, `L:dbb58e95`, `L:08931529`, `L:93d10a42`, `L:384e4491` | "the validator still reads the wizard draft when called with no arguments" |
| `8`, `L:57569fb4` | "an edited mile is read as typed and interpolated, never snapped to a chart row" |
| `L:b8ed7517`, `L:816bb730`, `L:6dfdd5ad`, `L:191b9681`, `L:ef269095` | "the lock body and the toast carry no mid-sentence dash and no Nike, and ship in the app as typed" |
| `L:06b88cf5` | "building a program leaves its cfg byte-identical" |
| `L:75c2c89a`, `L:f4eb80e8`, `L:5a755c5c`, `L:333307e0`, `L:3c8ce141`, `L:d7ca5489` | DROPPED: version predicate (the "at ia-version >= 203 the D116 surface MUST exist" rows); the surface test and the behaviour tests above exercise each |
| `L:fc93f26f` | DROPPED: era-row existence check (`MANNY_DIGEST_BY_VERSION` has a row) |
| `L:18e053af` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |

### `g204_clock_limb.js` (21)

| Row | Held by |
|---|---|
| `C1` | `unit/clock-format` › "the clock helper is a function" |
| `C2` | `unit/clock-format` › "the hand table: whole seconds round first, then split, so 59.5 s carries into the minute" |
| `C3` | `unit/clock-format` › "every tenth of a second from 0 to 1200 s prints a two digit seconds limb in 00..59" |
| `C4`, `C4b` | `unit/clock-format` › "the helper differs from the old idiom only where the old idiom printed a malformed clock" |
| `C8a` | `unit/clock-format` › "the rounding edges print as typed: x.5, m:59.5, 3599.5 and past the hour"; "every half second from 0 to 7200 s prints the round-then-split clock, seconds 00..59" |
| `C5` | `integration/clock-format` › "the tempo card at week 11 prints the clock of its dose: 494.306 - 3 x 10 = 464.306, x 1.08 = 501.44 -> 8:21/mi" |
| `C5b` | `integration/clock-format` › "the week 1 tempo card carries 479.52 s to 8:00/mi (a 7:24 mile x 1.08; the old idiom printed 7:60)" |
| `C6`, `C6b` | `integration/clock-format` › "every tempo card over a lattice of mile anchors prints the clock of its own dose.tgt" |
| `C7a` | `integration/clock-format` › "every NSW interval card prints its pace, the 16 s/mi rule, the 2x-2.5x recovery band and clean note clocks"; "an interval note quotes a 2 mi goal of 13:59 (419.5 s/mi) as 7:00/mi (the old idiom printed 6:60)" |
| `C7b` | `integration/clock-format` › "the NRC half plan at an 8:00 mile prints exactly the chart row and its steady ceiling, and nothing else per mile"; "the NRC formatter is only ever handed whole seconds (so it can never meet a :60)" |
| `C7c` | `integration/clock-format` › "every swim interval card prints the split re-derived from the cfg, 2 s faster than the week"; "a swim base of 10:08 carries week 1 to 2:00/100 (608 / 5 - 2 = 119.6; the old idiom printed 1:60)" |
| `C8b` | `integration/clock-format` › "pace: mile anchors whose week 1 tempo lands on m:59.5 or past print the carried clock" |
| `C8c` | `integration/clock-format` › "interval notes quote an odd 2 mi goal time (x.5 s/mi) as the carried clock" |
| `C8d` | `integration/clock-format` › "swim bases whose week 1 interval lands on m:59.6 or m:59.8 print the carried clock on every interval card" |
| `C8e` | `integration/clock-format` › "the wizard seeds a mile from logged runs as carried minutes and seconds" |
| `C8f` | `integration/clock-format` › "no clock on any card of the edge programs has a seconds field of 60 or more" |
| `L:34edaea2` | `integration/clock-format` › "building a program leaves its cfg byte-identical" |
| `L:46c86bfd` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |
| `L:fc93f26f` | DROPPED: era-row existence check (`MANNY_DIGEST_BY_VERSION` has a row) |

### `g223_d183_safepace.js` (60)

Every row prints once per zone (`<row>.NY`, `<row>.UTC`). `[X]` is the zone's `describe` in
`integration/pace-wizard` ("[NY] the cardio goal step under TZ=America/New_York", "[UTC] ... under TZ=UTC"); rows
with no zone in their claim are held once, by a zone-free test of the same file.

| Rows (`.NY` and `.UTC`) | Held by (`integration/pace-wizard` ›) |
|---|---|
| `Z0` | `[X]` › "the zone is the one asked for and the app's clock reads 2026-09-22 21:16" |
| `Z1` | "the hand oracles reproduce the ruling's printed numbers and coach's sentences" (zone free) |
| `T1`, `T2` | `[X]` › "one render of Mario's dated step paints the header, the card and the pace line in the same tick and queues no timer" |
| `H168` | `[X]` › "168 edits of the mile and goal fields, then the date: the header and the card both say week 5, no red, no Recommended, no button" |
| `S1` | `[X]` › "a dated test with a gap: the accent card says week 5 and what the block reaches from the mile" |
| `S2` | `[X]` › "a dated intermediate test with no mile is required and blank: the card says week 5 and quotes no reach" |
| `S3` | `[X]` › "a dated beginner test reads the beginner default with no mile, and his 8:00 mile (no gap) quotes no reach" |
| `S4` | `[X]` › "Mario's case, an 8:00 mile and a 12:00 goal, has no gap: the run card reads the week sentence alone" |
| `S5` | `[X]` › "a test this week (Friday 2026-09-25): a 1 week header and "In 1 week that reaches about 1.5 mi in 12:00"" |
| `S6` | `[X]` › "a test before the first training day: the signal card says so and quotes no reach" |
| `S8` | `[X]` › "undated, the feasibility frame reads the ruled sentence in accent with no button and no "safe"; a required blank mile leaves it empty" |
| `S9` | `[X]` › "a 2 km goal in 8:30 reads "2 km" in the reach sentence, with the km lens at 0.621" |
| `NS1` | `[X]` › "the name step's Program length reads "5 weeks" for Mario and "1 week" for a test this week" |
| `RN0` | `[X]` › "a dated bike century reads the ruled sentence and colour at +2, +1, 0, -1 weeks and 1 week out, and red under a week"; `[X]` › "HALF_MANNY's half reads the plan start and race week, in progress and from a future date, by Monday arithmetic" |
| `L1`, `L1C` | `[X]` › ""In N weeks" is the header's N, dated and undated with a swim goal (where a run-only length would differ)" |
| `K1` | `[X]` › "a 2 km goal in 12:00 reads "12:00 is 9:40 per mile." as rendered, repainted and after the distance handler; 1.5 mi reads 8:00" |
| `SW1` | `[X]` › "a 500 in 7:00 reads "7:00 is 1:24 per 100 yd." (and m) as rendered and from updateSwimPaceDisplay" |
| `BL1`, `BL1C` | `[X]` › "an undated beginner's run baseline handler repaints the header, 9 weeks at a 1 mi baseline to 6 at 4, as a fresh render would" |
| `A3E` | `[X]` › "a past date and a non-test date under a week read one red line with one icon, unframed" |
| `B1` | `[X]` › "over the whole sweep: no button on the card or frame, ..."; "the button is gone: no applySuggestedPace, achievablePacePerMile, secsToMMSS or "Use this pace" in the source" (zone free) |
| `M2` | "one repaint, one caller each: updatePaceFeasibility, updatePaceDisplay and assessRunPaceCeiling once, updateRaceDateFeedback 13 times" (zone free) |
| `M6`, `A3S`, `A3F` | `[X]` › "the sweep's other screens render: ..." (fills the sweep) and `[X]` › "over the whole sweep: no button on the card or frame, no dash in the step's text, no "safe progression", no icon or bare check in a frame" |
| `M6C` | "the dash predicate trips typed dashes and passes compound numerals and en dash ranges" (zone free) |
| `HM0` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |
| `CHILD0` | DROPPED: legacy machinery (the parent's check that its spawned per-zone child printed every row and its summary). The new file runs both zones in one process; node:test reports every test, and a zone whose setup fails fails its `describe` |

### `g225_d186_clockend.js` (10)

| Row | Held by (`integration/pace-clock` ›) |
|---|---|
| `L:357b988a`, `L:772dc64e`, `L:601da633` | "a dated pace goal tapers max(2, round(0.12 L)) weeks and an undated one none; a goal at or slower than week 1 is met" (every cell builds through doGenerate, which asserts a program and a progression) |
| `G1a`, `G1b`, `G2` | "the block target is the last build week's pace, the note names it, and the taper holds it" |
| `G3`, `G4` | "an undampened block lands on the entered goal by its last build week; a met goal holds week 1 all block" |
| `L:c0b0230c` | "a dampened note drops "needs more weeks" exactly when the goal and the block target print the same clock" |
| `L:dca20133` | "an intermediate 55+ goal of 1.5 mi in 13:45 with no mile never prints the goal twice in the long form" (pin (b)); the test above (pin (c): a short form is printed) |

### `g225_d187_pacerate.js` (9)

| Row | Held by (`integration/pace-clock` ›) |
|---|---|
| `CENSUS1`, `CENSUS2`, `CENSUS3` | "the rate has one owner: PACE_IMPROVE is declared once, read on four lines, and the old 3/5/7 table is gone" |
| `RATE1` | "the rate is {beginner 3, intermediate 3, advanced 2} s/mi a week" |
| `COPY1`, `COPY2` | "neither the run interval note nor the swim interval note calls a rate safe" |
| `MILE1`, `MILE2`, `MILE3` | "a blank mile is refused on an intermediate pace goal, and only there" |

### `g226_d188_beginnermile.js` (16)

| Row | Held by |
|---|---|
| `G1` | `integration/mile-anchor` and `sweeps/mile-anchor` › "a beginner's 13:00 mile on run_5k / run_half prints every week 1 labelled pace off the 12:00 chart row, 5K and Recovery included"; › "a beginner's 13:00 mile on run_base prints the 12:00 row's recovery, 14:30, as the easy run's Around pace"; › the four "a beginner with a 9:00 mile on <goal> paces week 1 exactly as an intermediate with the same mile and seed"; `integration/mile-anchor` › "a beginner's 1.5 mi pace goal in 13:30 runs 9 weeks from a 9:00 mile and 11 weeks with none" |
| `G1g` | `integration/mile-anchor` and `sweeps/mile-anchor` › "a beginner's 13:00 mile on a 1.5 mi pace goal prints week 1's short intervals at 11:58/mi off a 12:14/mi goal pace" |
| `G1f` | `integration/mile-anchor` › "a beginner's 9:00 mile reaches the pace ceiling: 1.5 mi in 10:30 runs 11 weeks and the sentence reads his mile"; `integration/pace-wizard` › "a beginner's 9:00 mile reaches the undated feasibility frame: 1.5 mi in 10:30 reads his mile and 13:08 in 11 weeks" |
| `G2` | `integration/mile-anchor` and `sweeps/mile-anchor` › "a beginner with no mile builds the same program twice on every run goal" (the current app's own self-equality; the V225 baseline it was the precondition for left with the G1h diff rows) |
| `G3` | `integration/mile-anchor` › "the mile validator judges a beginner's mile like anyone's, on every run goal, and the pace goal still requires one past beginner" |
| `G4` | `integration/pace-wizard` › "a beginner sees the "Current mile time" field and its advisory slot on every run goal"; `integration/mile-pencil` › "every run goal's card carries one pencil labelled "Change mile time" and a Run paces group, at every level" |
| `G5` | `integration/mile-anchor` › "no engine read sets a beginner's mile aside: the beginner gates are gone from the source" |
| `G1h-P3`, `G1h-P4` | `integration/mile-anchor` and `sweeps/mile-anchor` › "every long run's tier worked out from its minutes is the tier printed on its day, and each tier holds its content rules" (today's half of each row: the tier and content rules on the current build; the sweep also requires tiers A, B and C to be reached). The V225 side of each row left with the rows below |
| `G1h-P0`, `G1h-P1`, `G1h-A1L`, `G1h-P2`, `G1h-L1`, `G1h-L2`, `G1h-L3` | DROPPED: build-scoped claim. Each compares the build with the V225 artifact (`git show 3591994:index.html`): V225 equals itself, nothing moved for intermediates and no-mile beginners, lengths and tiers moved only toward sign(mile - 690), and the moves happened (liveness). That is D188's licence against the release before it (standing ruling 3: the previous-version run replaced it) |

### `g226_d189_pacedisclose.js` (18)

| Row | Held by |
|---|---|
| `G6a` | `integration/mile-anchor` › "the hand defaults format to 11:30, 9:30 and 7:30, and a no-mile build equals itself" (its V225 baseline self-equality half is build-scoped, dropped with G6b's V225 half) |
| `G6b` | `integration/mile-anchor` and `sweeps/mile-anchor` › "every no-mile program carries the default sentence once, appended to week 1's first paced run card (intermediate and advanced pace goals are refused first)" (the sweep asserts the 640 cells). The site is picked on the build's own week 1 by the gate's typed predicate; the gate's V225 halves (the note is V225's note plus one space, and 640 cells' lifting days differ from V225) are build-scoped claims against the release before and are not carried |
| `G6c` | `integration/mile-anchor` and `sweeps/mile-anchor` › "a program with a mile entered carries no default sentence anywhere" (the sweep asserts the 720 cells) |
| `G6d` | `integration/mile-anchor` › "an intermediate or advanced pace goal with no mile is refused with the required-mile string" |
| `G7a` | `integration/mile-anchor` › "a no-mile card names the level default and points at the pencil, on 5K, half, base and a beginner pace goal" |
| `G7b` | `integration/mile-anchor` › "a no-mile clipboard line names the level default and the chart row it reads" |
| `G7c` | `integration/mile-anchor` › "run_base's card shows a Run paces group of Mile and Recovery with one pencil, at every level" |
| `G7d` | `integration/mile-anchor` › "HALF_MANNY's card and clipboard read the entered form verbatim" |
| `G7e` | `integration/mile-anchor` › "seeded, clamped and edited forms keep their wording, and a beginner's entered or seeded mile is read as his" |
| `G7f` | `integration/mile-anchor` › "a mile edited over the default names "the <level> default" as what it replaced" |
| `G8a` | `integration/pace-wizard` › "the mile field's helper says required on an intermediate or advanced pace goal, and names the level default everywhere else" |
| `G8b` | `integration/pace-wizard` › "a mile over 25:00 asks for a check, in the validator and in the advisory under the field" |
| `G8c`, `G8d` | `integration/pace-wizard` › "a blank mile on an intermediate or advanced pace goal leaves the header asking for it and the feasibility frame empty" |
| `G8e` | `integration/pace-wizard` › "a 9:00 mile on an intermediate or advanced pace goal reads "Your mile is 9:00." with a numeric header" |
| `G8f` | `integration/pace-wizard` › "a beginner pace goal with no mile takes the generic feasibility form from the beginner default" |
| `G9` | `integration/mile-anchor` › "every athlete-facing string this file asserts carries no mid-sentence dash and no Nike"; `integration/pace-wizard` › "every mile field string asserted above carries no mid-sentence dash and no Nike" |
| `G10` | DROPPED: HALF_MANNY digest, held by `tests/integration/program-output.test.js` |

## Totals

348 rows over 10 gates: **319 mapped** (317 to the new tests, 2 to `tests/integration/program-output.test.js`'s
self-equality), **29 dropped**:

| Reason | Rows |
|---|---|
| HALF_MANNY digest, held by `program-output.test.js` | 7 (`g202_pace_anchor` B1, `g202_pace_copy` B2, `g203_mile_pencil` L:18e053af, `g204_clock_limb` L:46c86bfd, `g223_d183_safepace` HM0.NY and HM0.UTC, `g226_d189_pacedisclose` G10) |
| Version predicate (a surface that MUST exist at ia-version >= 203) | 11 (5 in `g203_ceiling_and_anchor`, 6 in `g203_mile_pencil`) |
| Era-row existence check | 2 (`g203_mile_pencil` and `g204_clock_limb` L:fc93f26f) |
| Build-scoped claim against V225 | 7 (`g226_d188_beginnermile` G1h-P0, P1, A1L, P2, L1, L2, L3) |
| Legacy machinery (the per-zone child check) | 2 (`g223_d183_safepace` CHILD0.NY and CHILD0.UTC) |

Per gate (mapped / dropped): `g202_pace_anchor` 32/1, `g202_pace_copy` 15/1, `g203_ceiling_and_anchor` 90/5,
`g203_mile_pencil` 62/8, `g204_clock_limb` 19/2, `g223_d183_safepace` 56/4, `g225_d186_clockend` 10/0,
`g225_d187_pacerate` 9/0, `g226_d188_beginnermile` 9/7, `g226_d189_pacedisclose` 17/1.

## Mutations

Mutations: not run (sabotage off). Mario switched every sabotage run and script off during this move, so parity rests
on the row mapping above and the new tests passing.

## The release before

These tests hold behaviour that rulings shipped from V202 to V226; none was written for a change in this move, and
each passes on today's `index.html`.
