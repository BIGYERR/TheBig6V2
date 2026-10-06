# V233 P-BIKEWHEEL — measure (before-picture), returned 2026-10-05, tree ia-version 232, HEAD 6ee30ea, clock 2026-10-03

Saved verbatim by the main session from measure's return.

MODE     B (before-picture). Tree: ia-version 232, HEAD 6ee30ea, clock pinned 2026-10-03.
METHOD   tests/measure/v233_bikewheel_code.js (+ .out.txt): source scan with comments stripped, form renders, hms parse table. tests/measure/v233_bikewheel_lattice.js (+ .out.txt): part B is measure B's lattice verbatim (10,080 configs, 0 crashes); B0 is the same lattice with clean bike/swim goals; X is multi-sport (6,930 configs, 0 crashes); M is HALF_MANNY plus bike. Oracles: field kind is read off the rendered HTML. Faces come from hand decimal arithmetic. The bound is the hand constant 599.98 min (9:59:59).

PREMISES (D205), each checked on the 232 tree
(a) TRUE. One emitter of id="log_bike_mins", at index.html:13794 (bike branch of cardioFieldHTML, 13793-13794).
(b) TRUE. It is in both listener arrays, :14150 (openDetail) and :14758 (setCardioSwap). Both are followed by iaWheelInit().
(c) TRUE. The bike branch has no #doseDerived. doseDerived (13464) and updateDoseDerived (13503) read only log_run_* fields. updateDoseDerived returns early when #doseDerived is absent. persistLogFields' doseDerived call with a bike dose returns {} for both the time and reps_time doses, so it writes nothing.
(d) TRUE. No reader treats blank bike_mins as "as planned". All 9 code lines touching bike_mins are listed below; each does a truthy check or a sum with >0. The only as-planned wording in the file is the run doseDerived "assuming planned" (13472/13477/13488).

FORM TODAY (bike, every dose shape): an optional plan strip, then label "Bike — actual duration", then `<input type="number" id="log_bike_mins" placeholder="minutes" value="${e.bike_mins||''}" min="0" class="input-field">`. There is no inputmode, no RPE in the cardio block (RPE is the shared slider), no distance field and no sub-label. Minutes is the FIXED dimension on dosed forms, because the strip prints the planned value. Shapes on measure B's lattice (n bike forms):
- time, strip "Bike — LSD · Planned | N min": 65,160
- time, "Bike — CHI · Planned | N min": 13,500
- time, "Bike · Planned | N min" (Active Recovery Spin): 12,960
- reps_time, "Bike — CHI · Planned | R × M min": 17,100
- reps_time, "Bike · Planned | R × M min" (Sweet Spot): 7,560
- null dose, no strip, Interval (INT): 12,600. Emitter 4686 leaves INT undosed on purpose, and doseFromCardio 13447 refuses bike intervals.
The reps_time strip never prints a single total. reps × mins ranges 22-60.
HALF_MANNY is run-only, so it has 0 bike forms. HALF_MANNY plus any of the 5 bike goals gives 28 bike forms over 14 weeks (e.g. W1 tue LSD {time,20}, W1 thu Long Ride {time,45}; with bike_ftp, W1 tue Sweet Spot {reps_time,2,15}).

FINDING (lattice)
- Measure B reproduced exactly: 128,880 of 622,650 log forms (20.70%) are bike number boxes, with 0 wheels. Dose kinds: time 91,620 (71.09%), reps_time 24,660 (19.13%), null 12,600 (9.78%). Every dose was emitted; none came from the parse.
- By goal: bike_century 50,400, bike_50 26,460, bike_base 18,360, bike_ftp 18,360, bike_cals 15,300. Experience is flat at 42,960 each. Week runs W1-W7 9,000-ish and tails to W20.
- Caveat on the denominator: measure B's mkCfg put baselineDist:'3' on every goal, and a bike goal reads that as its baseline (3356). With clean bike/swim goals (B0) the count is 102,810 of 544,950 (18.87%): time 72,900, reps_time 19,410, null 10,500.
- Cross-training: the single-sport lattice has 0 bike forms on run or swim goals by construction. Multi-sport (X: 30 run+bike pairs and 25 swim+bike pairs) gives 171,708 of 478,590 forms (35.88%) as bike boxes: time 151,440, reps_time 20,268, null 0.
- Rest-day sheet (P-RESTWHEEL, parked, report only): 85,680 of 249,060 rest days sit in configs with bike in cardioTypes. The sheet input at :1408 is type=number, inputmode=numeric, min 1, max 600, default 30. applyRestCardio :1438 ADDS minutes to e.bike_mins as a NUMBER, so stored values can pass 600 (2 × 600 = 1,200). Its key is completedKey; completedKey(1,"mon") equals logKey(1,"mon") equals "w1_mon".

BOUNDS: planned bike minutes are min 11, p50 36, p90 82, p99 240, max 240 (bike_century Long Ride (LSD) W19). All are integers. >59 on 26,040 forms, >179 on 2,520, >599.98 on 0. Multi-sport max is also 240, with 0 above 9:59:59. INT detail text carries only "3 min" (the warm-up).

LEGACY SEED (V232 _iawParse('hms') against the hand face): 8 of 12 match.
- '' gives the dash. '0' gives 0:00:00. '45' gives 0:45:00. '45.5' gives 0:45:30. '.5' gives 0:00:30. '90' gives 1:30:00. Numeric 30 gives 0:30:00. '-1' gives the dash. All match.
- MISMATCH '600' shows 9:00:00 (seed face 540.00); the hand face is 10:00:00.
- MISMATCH '601' shows 9:01:00; the hand face is 10:01:00. Above 599 the parse caps the hours column at 9 but keeps the minutes left over, so it shows an hour short. It does not clamp to 9:59:59.
- MISMATCH '1e1' shows 0:01:00, while +'1e1' reads 10.
- MISMATCH '3,5' shows 0:03:00 against hand NaN, i.e. the dash. A number input sanitizes '3,5' to '', and no non-form writer was found.
- The seed-face guard means opening never writes, so every mismatch is display-only until the athlete scrolls.
- Reachability: >599 bike_mins is reachable only through the rest-sheet sum. 0 prescribed doses go above 240.

WIRING (Q6): the hms kind is generic. iaWheelInit, _iawCommit, _iawParse, _iawFormat, iaWheelHTML and iaWheelFlush mention log_run 0 times and _curLogDose 0 times. They key on data-kind, data-for and data-plan only. The stacked layout is the CSS class `.iaw-solo{max-width:178.2px;}` (one rule, :340). The run wheel's plan face came from the 5th iaWheelHTML argument (dose.mins, at :13764). For bike: the time dose has dose.mins (91,620 forms). reps_time has no single strip value (24,660 forms). Null INT has no plan at all (12,600). Which face, if any, seeds those two is coach's call.

READERS of bike_mins (complete, comments stripped, 9 lines)
- W :1438 applyRestCardio (number, accumulates)
- R :1536 unmarked-day list (truthy)
- E :13794 the emitter (value=e.bike_mins||'', so numeric 0 shows blank and string '0' shows 0)
- R :14142 _hasLog (truthy)
- L :14150 listener array
- W :14707 persistLogFields (string from the field)
- L :14758 listener array
- R :17459 progress weekly bike sum (>0)
- R :17465 sessions count (truthy)
There is no reader in buildExportHTML (13852), the journal or the benchmark.

GATES/SABOTAGE PINS (Q7): 14 matching lines over 185 files. 12 are cfg setups (cardioTypes ['bike']) in g205_bike_unmoved, g205_d125_ceiling, g205_pace_eve, g206_d109_copy, g208_d103a_chip, g217, g218, g221, g223 ×3 and g225. None of them calls cardioFieldHTML or buildLogHTML. The only assertion that renders the bike form is g232_d199_runwheel.js:486-491, row D-untouched u-markup (bike null and BK {time,40}, byte-identical to baseline). It is scoped `VER !== ERA` (232), so at 233 it is a skipRow and does not trip. g232 rowForms (256, 393) counts only log_run_(mins|dist) number boxes, and its lattice is run-goal only. g232 D199-width requires exactly 1 `.iaw-solo{max-width:…}` rule, so a second such rule would trip it. No sabotage spec references the bike form.

UNKNOWN: not swept. The injury cross-train path (:7893 "Easy spin, N minutes", which parses to a time dose; a single synthetic render was printed). The setCardioSwap run→bike path (null dose, generic form). Swapped entries. Stored logs on device. Whether a rest-day key ever opens the log form, which decides whether >599 rest sums reach a bike wheel. How iOS handles keypad entry of '1e1' in a number box with no inputmode.
