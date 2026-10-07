# V234 P-SWAPKEEP — measure m1 (Mode A: prove + before-picture). Numbers only; no ruling, no fix.

Artifact: index.html ia-version 233, HEAD 750d9b7. Script: `tests/measure/v234_swapkeep.js` (parts D, M, S, G, L).
Clock pinned 2026-10-03; startDate 2026-09-28; VM with the DOM-registry stub of `v233_bikewheel_reach.js` part D.
Typing is simulated as setting the hidden input then calling `persistLogFields(dk)`, which is the body of the `input`
listener (:14157, :14765). Oracle: hand constants (45, 5, 9:00, 4, 1:30, 40, 1000); "survives" = stored string equals the constant.

## 1. Reproduction (HALF_MANNY, seed 76308, W1 sat "Long Run", dose {k:dist, mi:3.1}; key `ia_logs_p_manny`.`w1_sat`)
| step | form | stored ia_logs_ entry (non-blank fields) |
|---|---|---|
| open | run_dist "", run_mins "" | none |
| type 45 / 5 | run_dist 5, run_mins 45 | run_mins 45, run_dist 5, run_pace 9:00/mi (derived, :14725) |
| render only (cardioFields innerHTML = bike field) | bike_mins "" ; log_run_mins gone from DOM | unchanged |
| persistLogFields after render | | swapFrom run, swapTo bike; run_mins/run_dist/run_pace = '' |
| setCardioSwap('bike') (real fn) | bike_mins "" | swapFrom run, swapTo bike; run fields '' |
| setCardioSwap('run') back | run_dist "", run_mins "" | all blank, swapFrom/swapTo '' |
| reopen | run_dist "", run_mins "" | all blank |
| tap the already-active chip 'run' | | unchanged (45/5/9:00 kept): erasure needs a sport change |

Erasing line: `persistLogFields` :14708-14716 rebuilds `logs[key]` from scratch out of `document.getElementById(id).value||''`
(:14697); it is called by `setCardioSwap` :14769 after :14750 replaced `cardioFields`, so the old sport's ids are absent and read ''.
Swap-back re-renders from the already-blanked entry (:14745 `e=getLogs()[...]`), so nothing can be restored.
The code comment at :14736-14739 states the erasure as intent ("Clearing the old sport's fields ... keeps volume credited to the
sport actually done — a swapped bike never lands on the run chart").
The erased record is THE log: `ia_logs_<pid>` is the only store of run_mins/run_dist; there is no separate draft.
`ia_hist_` (snapshotDay :1326) snapshots the program DAY, not the log, first touch wins; the swap does not change it.
SAVED path: after Mark Done (`ia_comp_` status complete), reopen + swap bike erases the same fields; ia_comp_ stays "complete".

## 2. Swap matrix (96 rows: 6 planned cells x 2 targets x {typed, saved} x {back, 3-hop, reopen-while-swapped, type-target-then-back})
Cells: run:generic (Speed Run — Intervals), run:time (Recovery Run), run:dist (Long Run), run:reps_dist (Short Interval),
bike:dosed (LSD), swim:none (Recovery Swim). Not covered: run:reps_time and bike:none cells (none in the 6 source configs).
- every typed field erased on the swap: 96/96. Any typed field restored on return: 0/96.
- target-sport value typed after the swap (bike_mins 40 / swim_yards 1000), then swap back: kept 0/20 non-run targets
  (run targets: run_dist+run_pace typed, also erased). So erasure is symmetric: whichever sport is left loses its fields.
- 3-hop (P>T>T2>P): 0 restored. Reopen while swapped: form opens on the swapped sport (swapTo, :13818) with its field blank.
- SAVED rows 48: ia_comp_ still "complete" 48/48, typed fields erased 48/48 (a done day ends with a blank log).
- Fields at risk per planned form: run generic [run_dist, run_pace]; run time/dist [run_dist, run_mins] (+ derived run_pace);
  run reps_dist [run_reps, run_rep_time]; bike [bike_mins]; swim [swim_yards].
VM caveat: handleDayStatus threw in the stub (`wscroll.appendChild`) 48/48 after its writes; ia_comp_ was written in 48/48.

## 3. Readers of the fields and of the swap flag (comment-stripped, enclosing top-level fn)
swapTo-aware (skip swapped entries): `_benchmarkEntryFor` :13042, `_recoveryPaceEntry` :16310, `runsByClass` :16553,
`easyEffortWeekly` :16574, `plannedVsLogged` :16608, `easyVsPrescribed` :17034 region, `renderProgressScreen` journal chip :17617.
NOT swapTo-aware (would read kept run fields on a swapped entry): `renderWeekView` :12206 (week miles sum run_dist),
`seedFromPriorPrograms` :16287 (maxDist), `ladderWeekly` :16539 (run_dist), `renderProgressScreen` :17463-17465 (weekly
run/bike/swim sums) and :17470 (has-entry), `restMoveCandidates` :1536 (logged-day test), `openDetail` :14147 (`_hasLog` nudge),
`applyRestCardio` :1437-1439 (sum writer), `persistLogFields` :14723-14726 (derives run_pace/run_dist from whatever run ids exist),
`cardioFieldHTML` :13750-13801 and `setCardioSwap` :14745 (render from entry), `buildLogHTML` :13818 (reads swapTo for active sport).
Writers of ia_logs_: saveLogs, persistLogFields, applyRestCardio, writeSetDraft, clearSetDraft. refreshProgram/purgeProgData name
'ia_logs_' only as a key. Export: no direct reader found (no getLogs/run_ field token in an export fn).

## 4. Reach (v233 measure B lattice, 10,080 configs, 0 crash, 622,650 log forms)
Picker offered (single-sport cardio day): 429,840 (69.03%); arrays 0; no cardio 192,810.
By planned sport: run 161,640, bike 128,880, swim 139,320 (run+swim = 300,960 = handoff figure).
Run fields at risk: run_dist+run_mins 107,460 (time 62,100, dist 45,360); run_dist+run_pace 47,250; run_reps+run_rep_time 6,930.
bike_mins 128,880; swim_yards 139,320. "Long Run*" subtype forms 30,240 (Long Run 18,270 + Taper/Peak/RACE DAY/Cutback/Dress).

## 5. Gates (v233_gate_reach.json, 97 gates; map predates the Post-V233 conversions)
setCardioSwap 1 (g233_d207_bikewheel); persistLogFields 4 (g221_d179, g222_d181_durable, g232_d199, g233_d207);
buildLogHTML 6; cardioFieldHTML 3; handleDayStatus 2; openDetail 6; snapshotDay 4; saveLogs 4; getLogs 17; getLogsFor 3;
cardioSwapChip 3; toggleCardioPicker 0; renderWeekView 12; renderProgressScreen 2; seedFromPriorPrograms 4; _benchmarkEntryFor 1;
_recoveryPaceEntry/ladderWeekly/runsByClass/easyEffortWeekly/plannedVsLogged/easyVsPrescribed 0; refreshProgram 17. None > 20.
Hand values touching swap (96 gate files scanned, g219_d167_pairs.js excluded by brief):
- g233_d207_bikewheel.js:313/:355 `forms-swap-live`: live setCardioSwap('bike') on HALF_MANNY run host with NO stored log; pins
  bike face == DASH_HMS and no strip. Moves only if a fix seeds the bike field from run values.
- g233_d207_bikewheel.js:330 lattice-c fixture: stored `{swapTo:'bike', bike_mins:'', run_mins:'', run_dist:'', swim_yards:''...}`
  hand-builds today's post-swap entry shape (blank run fields). Input fixture, not an assertion; cannot trip.
- g232_d199_runwheel.js:335, g233:302 stored-blank fixtures; :410-426 / :400-414 move rows read stored run_*/bike_mins after
  wheel moves (no swap in path).
- No gate row asserts a run field is '' after setCardioSwap. No gate references swapFrom except g233:285 (fixture input).
- g191_pacedelta and g221_d179 contain no swap tokens; g221_d179 reads ia_logs_ run_pace (:290) with no swap in path.
- g222_d181_chain.js:301 `swapTo` is a local exercise-swap helper name, unrelated.

## 6. Stored format
The entry already carries run_*, bike_mins, swim_yards, swapFrom, swapTo as sibling flat fields under `ia_logs_<pid>`.`w<N>_<day>`.
Keeping run fields across a swap is representable with the same key and same field names (no new key needed); cfg and
prog.weeks are not involved (swap state lives only in ia_logs_). Readers in section 3 that are not swapTo-aware would then
see the kept values on swapped entries.

## UNKNOWN
Dynamic before/after of each non-swapTo-aware reader on a counterfactual kept entry (static only). run:reps_time and bike:none
cells not driven (reach 0 and 12,600 respectively in lattice). Device behaviour of the wheel hidden inputs on swap (VM stub only).
Rest-day sheet (`applyRestCardio`) and moved days not crossed with swaps. Reach map staleness (predates conversions).
