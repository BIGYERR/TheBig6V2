# V234 P-SWAPKEEP — measure m2: D213/D214 prerequisites (a)-(e). Numbers only; no ruling, no fix.

Artifact index.html ia-version 233 (HEAD 750d9b7). Script `tests/measure/v234_swapkeep_prereq.js` (parts A B C D E W), same VM
DOM-registry stub as m1 (plus appendChild/removeChild no-ops; 0 throws in every part). Clock pinned 2026-10-03.
Planted counterfactual (hand constant): `parked:{run:{run_dist:'5',run_pace:'9:00/mi',run_mins:'45',run_reps:'4',run_rep_time:'1:30'},
bike:{bike_mins:'40'},swim:{swim_yards:'1000'}}`. "Kept" = JSON.stringify of `parked` equal before and after.

## (a) Rest and moved days: PARTLY REFUTED
- Rest days: 0 of 83,020 rest days opened through openDetail render `cardioSwapWrap` (v233 B lattice at seed 76308: 3,360 configs,
  41,510 weeks, 0 crash, 0 throws). HOLDS.
- Moved-in days: 11,250 of 16,800 moved-in days render `cardioSwapWrap` (dynamic: W1, first rest day x every restMoveCandidates day,
  applyRestMove then openDetail). Static: 286,560 of 415,100 rest-day x candidate pairs bring single-sport cardio (run 107,760,
  bike 85,920, swim 92,880). The moved day's log key is the REST key (`w1_wed`). REFUTED for "no moved day renders the picker".
- rest_cardio x swapTo: 0 entries carry both. The only swapTo writer is persistLogFields :14714, which rebuilds from scratch and
  drops rest_cardio. Path driven: a rest-sheet run (30 min, 3 mi) on W1 wed gives `{rest_cardio,rest_type:run,rest_mins:30,rpe:5,
  run_dist:3}`. A run day moved onto wed (no destination check) renders the picker. setCardioSwap('bike') leaves
  `{...run_dist:'',swapFrom:run,swapTo:bike}`: rest_cardio/rest_type/rest_mins dropped and the rest-sheet run_dist 3 erased.
  The same rebuild runs on any input event on that form. rest_cardio writer L1433 only. saveRestMoves callers L1420 (applyRestMove), L1459 (def).
  No rest move is ever deleted.

## (b) logs[key] writers with `parked` planted: 4 kept, 2 dropped (6 driven)
| writer | site | parked |
|---|---|---|
| writeSetDraft | :1273 (rmw, :1275-1279) | KEPT byte-identical |
| clearSetDraft | :1281 | KEPT byte-identical |
| saveLogs(getLogs()) round trip | :1234 | KEPT byte-identical |
| applyRestCardio | :1430 (Object.assign :1432) | KEPT byte-identical |
| persistLogFields | :14691, rebuild :14708-14716, only `sets` carried (:14707/:14717) | DROPPED |
| setCardioSwap | :14740 via :14769 persistLogFields | DROPPED |
Untruncated grep of `logs[...]=` / `saveLogs(` / `'ia_logs_'`: the 4 entry writers above (+ saveLogs) are the only ones. No other
setItem on ia_logs_. purgeProgData :16186 removes the whole key.

## (c) Mark Done with `parked` planted (HALF_MANNY W1 sat, after typing 45/5): before-picture = DROPPED
ia_comp_ complete. Entry after vs before differs in exactly one key: `parked` (removed). ts was equal because the clock is pinned.
Every other field is identical.

## (d) Reader counterfactual: 15 of 15 readers identical with vs without `parked`
Slice: HALF_MANNY + 6 run goals x 3 seeds + swim_base + bike_base (21 configs, balanced/intermediate/commercial), 642 cardio-day
entries W1-W9, alternating credited / blank-swapped; 321 swapped entries carry `parked`; ia_hist_ snapshots written per day.
Each reader output with `parked` == without, per config (21/21 each). The control puts the parked values at TOP level of the swapped
entries; the instrument sees it as:
renderWeekView MILES 21/21 differ; seedFromPriorPrograms 13/21; ladderWeekly 21/21; renderProgressScreen (sums, has-entry, journal)
21/21; openDetail _hasLog + form 21/21; applyRestCardio entry 21/21; persistLogFields derivation 21/21; restMoveCandidates 0/21
(control insensitive: the slice entries carry rpe '6', which already marks the day logged). The 7 swapTo-aware readers
(_benchmarkEntryFor, _recoveryPaceEntry, runsByClass, easyEffortWeekly, plannedVsLogged, easyVsPrescribed, journal chip in
renderProgressScreen) show 0/21 control differences (they skip swapped entries), as does refreshProgram(stored).weeks.

## (e) Wheels seed from the entry
cardioFieldHTML('run', {run_mins:'45', run_dist:'5', run_pace:'9:00/mi'}, dose):
- dist (Long Run): hidden log_run_dist value "5", log_run_mins value "45"; wheel `data-kind=dist data-for=log_run_dist data-plan=3.1`.
- time (Recovery Run): hidden log_run_mins "45", log_run_dist "5"; wheel `data-kind=hms data-for=log_run_mins data-plan=25`.
- generic (Speed Run — Intervals): hidden log_run_dist "5", log_run_pace "9:00/mi".
- openDetail on HALF_MANNY W1 sat from stored 45/5: hidden log_run_mins "45", log_run_dist "5"; ia_logs_ unchanged.

## Whole-entry readers (static scan of 29 log-touching functions, comments stripped)
Entry-level: applyRestCardio :1432 Object.assign copies every key (carries unknown keys). saveLogs :1234 JSON.stringify of the whole map.
Map-level only (iterate keys of logs, then read named fields): _benchmarkEntryFor :13041, seedFromPriorPrograms :16285,
recoveryPaceWeekly :16325, ladderWeekly :16533, runsByClass :16552, easyEffortWeekly :16573, easyVsPrescribed :17022,
renderProgressScreen :17458 / :17591, hasAnyData :17495 (count of keys), refreshProgram :16008 (Object.assign of log KEYS into
`_touched`; parked adds no key). clearSetDraft :1285 Object.keys(e.sets) only. No export/import, backup or migration reads ia_logs_
(buildExportHTML :13857 has no log token; copyExport :14771 copies rendered text).

## UNKNOWN
Wheel face/scroll position on device (iaWheelInit not driven past hidden values). (a) moved-in dynamic covered W1 only and seed
76308 only; the static count covers every week. recoveryPaceWeekly was not driven directly; its per-entry predicate
_recoveryPaceEntry was, at 21/21 identical. restMoveCandidates control was insensitive on this slice.
