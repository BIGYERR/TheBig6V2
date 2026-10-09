# V238 P-RESTMOVELOG: measure m1, the before-picture on V237. Numbers only; no ruling, no fix.

Mode: B (before-picture), with item 1 driven as Mode A at the live seed first.
Artifact: `index.html` ia-version 237, HEAD 49c36f9. HALF_MANNY seed 76308 digest 2d35e8f743680cfa, reproduced this session (seeds 24865 / 1234 give 94d13cd7e59bacaf / e0be605f96412de3, same W1 layout TTRTTTR).
Script: `tests/measure/v238_restmovelog.js` (parts R C O S L LM). Output kept: `tests/measure/v238_restmovelog.out.txt`.
Driving: the v234 VM DOM registry stub, real `applyRestCardio`, `applyRestMove`, `openDetail`, `persistLogFields` (via the listener bodies), `logCardio`, `handleDayStatus`, `setCardioSwap`, `renderWeekView`, `renderProgressScreen`, `plannedVsLogged`, `refreshProgram`. Start date Mon 2026-09-28; the clock is set to the rest day (noon) for each case, so the rest day is today and the hero is the rest hero. 0 throws in every part.
Oracle: hand constants. Jog = 37 min, 3.7 mi / 1370 yd, RPE 7 (bike jog: 37 min). Session typed = 5.2 mi, 45 min, 1500 yd, RPE 8. "Kept" = the stored value equals the constant.
Failed run, recorded: the first full lattice in one process hit a V8 heap abort with no summary. Rerun split by seed (three processes, `--max-old-space-size=8192`) and merged (part LM). The three per-seed tables are identical, as the identical W1 layouts predict.

## 1. Loss paths, driven on V237

### Reporter shape, seed 76308 (HALF_MANNY W1, rest Wed, candidates mon tue thu fri sat)
Rest sheet run 37 min, 3.7 mi, RPE 7 stores `{rest_cardio:true, rest_type:"run", rest_mins:37, rpe:7, run_dist:3.7}`. The raw entry has no `ts` and no `week`, and a run jog writes no `run_mins`, so the minutes exist only in `rest_mins`. Hero: `37 min run logged · RPE 7`, week MILES 3.7. "Training anyway?" is offered with the jog logged (:12176 is unconditional).
- After the move: the entry is byte-identical. The hero line is gone, because the hero now shows the moved session. Its only reader (:12164) renders on a rest hero only.
- After opening the moved-in form: the entry is unchanged. Run forms seed the jog's 3.7 on the miles wheel. The card reads `Logged ✓` (regime LIVE) and the nudge "You logged this one but never marked it" shows.
- Wed <- Sat (run:dist, plan 3.1), Done untouched: `{rpe:7, run_dist:"3.7"}`. rest_* are gone; the jog's 3.7 is now this session's distance. plannedVsLogged W1 goes from null to `{presc:3.1, act:3.7}`.
- Wed <- Mon (run:generic), typing 5.2: `{rpe:7, run_dist:"5.2"}`. MILES goes 3.7 -> 5.2, so the jog's 3.7 is gone.
- Wed <- Tue (lift), Done: `{rpe:7}`. MILES 3.7 -> 0. RPE touch: `{rpe:"8"}`, MILES 0.

### Which events now trigger the rebuild (persistLogFields :14794, rebuild :14817-:14827)
| Event | Call site | When it rebuilds |
|---|---|---|
| RPE slider or notes input | openDetail listener :14225 (`free`) | Always |
| Cardio node input | :14225 and :14917 | Only when LIVE (`cardioLive`, :14774) |
| doseRep stepper | :13559 | Only when LIVE |
| Done / Skip | handleDayStatus :14710 | Commit if the status changes |
| Log tap | logCardio :14859 | Commit; nothing is written if every active field is blank |
| Sport chip | setCardioSwap :14882, :14921 | Always (non-commit) |

The rebuild carries only `rpe` (D219 carry), `sets` (:14812) and `parked` (:14814). It rebuilds the seven cardio keys from the DOM (or '' on a DRAFT card), plus notes, swapFrom/swapTo, week and ts. `rest_cardio`, `rest_type` and `rest_mins` are named nowhere, so the first rebuild drops them. On a form with no node for the jog's sport key (lift, reps_dist, cross-sport), it also writes that key ''.

### Form-kind matrix (part R2: 7 kinds x 6 jogs x 7 sequences, first cell per kind across 7 configs at 76308)
Jog keys lost at the end of each sequence ("open" = after opening only):

| Moved-in form | Same-sport jog: open | Done | RPE touch | Type session value + Log | Log as seeded |
|---|---|---|---|---|---|
| lift | nothing (nudge on) | rest_* + sport key | rest_* + rpe + sport key | (no node) nothing | (no Log button) nothing |
| run dist / time / generic | nothing; jog 3.7 on the wheel, `Logged ✓` | rest_* (3.7 becomes the session's) | rest_* + rpe | rest_* + run_dist (replaced by 5.2) | rest_* (3.7 committed as the session's) |
| run reps_dist | nothing; `Logged ✓`, no dist field | rest_* + run_dist | rest_* + rpe + run_dist | rest_* + run_dist | nothing |
| bike (bike jog) | bike_mins 37 on the wheel, `Logged ✓` | rest_* | rest_* + rpe | rest_* + bike_mins (45) | rest_* |
| swim (swim jog) | yards 1370 in the box, `Logged ✓` | rest_* | rest_* + rpe | rest_* + swim_yards | rest_* |

Cross-sport (multi-sport config): a run jog under a bike or swim form, a swim jog under bike, a bike jog under swim. Done, RPE and type each lose rest_* and the jog's sport key; MILES 3.7 -> 0 for the run jog. Log is a no-op (card DRAFT, "Nothing to log yet").
A run jog with no distance (and a walk) writes no sport key: the nudge stays off and the card stays `Log`. Done or RPE loses rest_* (the jog's only record).

### Lattice (part L + LM)
Lattice: 16 single-sport goals x 7 focuses x 3 experience levels x 2 equipment (commercial, bodyweight) x 2 rest patterns (sun+wed, sat+sun) x 3 seeds = 4,032 configs, 0 crash. W1, first rest day, every candidate: 20,160 pairs, all offered. 13,500 moved-in forms render the picker (the same ratio as m2's 11,250/16,800). The jog is the config's own sport, so every picker form here is same-sport. Cross-sport is R2 only.
- Open: the nudge fires on 20,160 / 20,160, including 6,660 lift days where nothing of the session was logged. `Logged ✓` before any input: 13,500 / 13,500 picker forms. The jog value is seeded on the session's own field on 13,248 / 13,500 (the 252 reps_dist forms have no dist field).
- Done untouched: rest_* lost 20,160 / 20,160. Jog sport key lost 6,912 / 20,160 (lift 6,660: run 1,800, bike 2,700, swim 2,160; reps_dist 252). The jog's RPE becomes the session's RPE on 20,160 / 20,160 (rpe kept at 7; the journal shows the session at RPE 7).
- RPE touch: rest_* lost 20,160 / 20,160; jog RPE overwritten 20,160 / 20,160; sport key lost 6,912 / 20,160 (same segments).
- Typing the session's value: on run forms the jog's miles are replaced in 5,760 / 5,760 (run dist 1,764, generic 1,764, time 1,980, reps_dist 252). Week MILES reads 5.2 instead of 8.9. bike_mins replaced 3,600 / 3,600, swim_yards 4,140 / 4,140. rest_* lost 13,500 / 13,500 where a node exists. Lift: 0 (no node). The script's `milesDrop` on the lift row (1,800) is an instrument artifact (nothing typed); disregard it.
- Log tap as seeded: rest_* lost 13,248 / 20,160 (every seeded form). The jog value is committed as the session's own.

### (b) The jog's distance on a run form
The jog's 3.7 seeds `log_run_dist` on the dist, time and generic forms (5,508 / 5,508 run cases) and the card opens LIVE. Any wheel input rebuilds and replaces it: 5,760 / 5,760 lose it from the store, and week MILES, Progress and plannedVsLogged undercount by the jog. D221's stamp test (`e.run_dist===String(dose.mi)`, :13831) never matches a rest-sheet value, because applyRestCardio stores a number (3.7) and the test compares a string.

### (c) Swapped away with nothing on the arriving sport (part C, 7 configs W1, 22 days x 2 modes = 44)
- Offered by restMoveCandidates: 44 / 44. Mode "logged-then-swap" stores `{swapFrom, swapTo, parked:{run:{run_dist:"5.2",...}}}` (22). Mode "swap-blank" stores `{swapFrom, swapTo}` (22).
- After "Move it here": the entry stays at the origin key (44 / 44). The origin becomes `{rest:true, moved:true, movedTo}`. `restDayEligible(origin)` is false and `openDayKey` returns on a rest day (:11820), so no surface opens the origin form. `setCardioSwap` is the only thing that restores `parked`, and nothing can now reach it.
- The moved-in form opens on the planned sport: `{planned:X, active:X, logged:"0"}`, form empty, 44 / 44. The swap choice and the parked numbers do not follow the session.
- The journal still shows "Swapped A -> B" for the orphan, both before and after the move (44 / 44). After the move, refreshProgram keeps the origin as the rest stub and the destination as `movedFrom` (44 / 44). No duplicate.
- Credits: none move. `parked` is read by no aggregate (m2), and a swapped entry's top-level fields are ''.

### (d) Other orders
- Jog AFTER the move: impossible. `restDayEligible` is false for the destination (not rest) and for the origin (moved). The week view shows no "Training anyway?", and `openRestSheet` renders nothing.
- Undo or clear of a move: none exists. `ia_moves_` has one writer (`applyRestMove` :1424, via `saveRestMoves` :1463), one reader in refreshProgram (:16279), and purge (:16338). There is no delete.
- "Log more" before a move: see NEW 1 below.

## 2. Readers, before and after each loss
| Reader | Site | After jog | After move | After first rebuild |
|---|---|---|---|---|
| Hero rest line (only reader of rest_cardio/rest_type/rest_mins) | renderWeekView :12164-:12166 | `37 min run logged · RPE 7` | not rendered (destination not rest) | keys gone |
| Week MILES | :12213 (run_dist, every key of the week) | 3.7 | 3.7 | lift / reps_dist / cross-sport Done or RPE: 0; run form typed: 5.2 (should read 8.9 by the oracle); Done untouched: 3.7, credited to the session |
| Progress weekly run/bike/swim | :17615-:17617 | "Total logged: 3.7 mi" | 3.7 | follows the store, as MILES does. Printed only for generic + RPE: 3.7 kept |
| Progress journal | rpe/notes skip; swap rows :17745/:17770/:17778 | RPE 7 row | RPE 7 row | RPE touch: RPE 8 (the jog's 7 is gone); Done: the session carries RPE 7 |
| plannedVsLogged | :16748 (hist snapshot required, swapTo skip :16760, run_dist :16761) | null (rest day has no hist) | null | Done on run:dist: `{presc:3.1, act:3.7}`, the jog credited against the moved session's plan |
| _hasLog nudge | openDetail :14211-:14214 | n/a | 20,160 / 20,160 at open | off after Done |
| cardioEntryLive / Log label | :14770, buildLogHTML regime | n/a | `Logged ✓` 13,500 / 13,500 | stays live |
| restMoveCandidates | :1529-:1547 | n/a (rest days are excluded) | the moved-in day is excluded (`movedFrom`) | n/a |
| seedFromPriorPrograms maxDist | :16439 (needs `e.ts`) | excluded: the rest entry has no ts (raw entry printed) | excluded | counted once the rebuild stamps ts (code-read) |
| ladderWeekly | :16691 (run_dist) | code-read only, not driven | | |
| runsByClass, easyEffortWeekly, _recoveryPaceEntry, easyVsPrescribed, _benchmarkEntryFor | require run_pace or run_mins (:13049-:13056, :16462, :16705, :16726, :17175) | a rest jog has neither, so 0 credit (code-read) | | |
| Session counter `weeklyData.sessions` | :17622 | 0 readers (m2) | | |

## 3. Writers: data layer vs rest-sheet UI (V237 lines)
| Writer | What it writes | Called from (surface) |
|---|---|---|
| applyRestCardio :1431-:1447 | merge :1435-:1436; `rest_cardio`, `rest_type`, `rest_mins`, `rpe` :1437 (overwrite); `run_dist` :1441 (sum, dist>0); `bike_mins` :1442 (sum); `swim_yards` :1443 (sum); saveLogs :1444 | UI: the "Log it" button in `_renderRestCardio` :1417; reads `_restDraft`. Tail is UI (closeRestSheet, renderWeekView, toast) |
| applyRestMove :1419-:1430 | `ia_moves_[dest]={from,ts}` :1423-:1424; applyRestDayMoves :1425; savePrograms. Does not read logs[dest] or logs[origin] | UI: "Move it here" :1391. Tail is UI |
| applyRestDayMoves :1466-:1479 | prog.weeks dest/origin stub | Data: applyRestMove :1425, refreshProgram :16280 |
| restMoveCandidates :1529-:1547 | (predicate) logged test :1543 | Data function; its one UI consumer is `_renderRestMove` :1368 |
| restDayEligible :1515 | (predicate) | openRestSheet, openDayKey :11820 |
| persistLogFields :14794-:14845 | rebuilds the entry: 7 cardio keys, rpe, notes, swapFrom/swapTo :14825, week, ts; carries sets and parked; V148 stamp :14837-:14840 | Data function; triggers listed in §1 (detail sheet UI, not the rest sheet) |
| setCardioSwap :14873-:14922 | parks/unparks :14886-:14894 | UI: chip :13869 |
| writeSetDraft :1270 / clearSetDraft :1285 | read-modify-write (rest_* kept, m2) | autoSaveSets :12567 / saveExWeight :14313 |
| Hero reader :12164-:12176 | (reader) rest_* line; the "Training anyway?" and "Log more" buttons | renderWeekView markup (rest-sheet UI entry point) |

Line as it stands: the rest-sheet UI is `openRestSheet`, `renderRestSheet`, `_renderRestMove`, `_renderRestCardio`, `_rdSet`, `_restDraft`, the hero block :12164-:12177, and the tails of applyRestCardio and applyRestMove. The data layer is the entry merge inside applyRestCardio (:1434-:1444), the move-store write (:1422-:1425), applyRestDayMoves, restMoveCandidates, restDayEligible, persistLogFields, cardioEntryLive, buildLogHTML/cardioFieldHTML seeding, and the readers in §2. applyRestCardio and applyRestMove each mix both in one function body.

## 4. Losing typed data today?
- (a) rest_mins / rest_type / jog RPE: yes. The minutes of a run, swim or walk jog exist only in `rest_mins`. After the move no surface shows them (hero not rendered), and the first rebuild deletes them: 20,160 / 20,160 Done, 20,160 / 20,160 RPE, 13,500 / 13,500 typed, 13,248 / 20,160 Log. The jog's RPE is overwritten by a session RPE (20,160 / 20,160) or silently becomes the session's RPE (Done).
- (a) Jog distance on lift / reps_dist / cross-sport forms: yes. It is erased at Done or RPE, 6,912 / 20,160 (lattice) plus every R2 cross-sport cell.
- (b) Jog distance on same-sport forms: yes when the athlete enters the session's own number, 5,760 / 5,760 run forms, 3,600 / 3,600 bike, 4,140 / 4,140 swim. On Done or Log untouched the number survives, but it is credited to the moved session as its own.
- (c) Swap-away: the 22 / 44 cases with typed numbers keep them in storage, but they are unreachable (no surface opens the origin; only setCardioSwap restores parked). The 22 / 44 swap-blank cases lose only the swap choice. No credit moves.
- (d) No move undo and no jog after a move: nothing lost through those paths.

## NEW (outside P-RESTMOVELOG's scope; flagged separately)
1. **"Log more" overwrites** (applyRestCardio :1437). A second rest-sheet log replaces `rest_mins`, `rest_type` and `rpe`, while the sport keys sum. Run 37 min 3.7 mi RPE 7, then 20 min 2 mi RPE 5, gives `rest_mins:20, rpe:5, run_dist:5.7`, and the hero reads "20 min run logged · RPE 5". Run then bike 20 gives `rest_type:"bike", rest_mins:20, run_dist:3.7, bike_mins:20` ("20 min ride"). **Losing typed data today, no move needed:** the first jog's minutes (its only record for run, swim and walk) and its RPE. One seed case driven; not swept.
2. **Chip tap on a DRAFT run card discards the typed numbers** (setCardioSwap :14882 persists non-commit, so the leaving set stores '' and nothing parks). HALF_MANNY W1 Mon: rolling 5.2 on a draft card, then bike, gives `{swapFrom:run, swapTo:bike}`; back to run gives an empty form and `{}`. The numbers were typed but never Logged. Whether that counts as "logged data" is coach's call; it is not a loss of a committed value. One case driven; not swept.

## Unknown (not measured)
Device wheel faces and scroll positions. Weeks other than W1 (the dynamic lattice is W1, first rest day only; m2's static 286,560 / 415,100 covers every week). Cross-sport jogs in the lattice (single-sport configs only; R2 covers each pair once). Progress totals printed for one path only. ladderWeekly not driven. Lift set drafts (writeSetDraft) on a moved-in lift day: not driven, read-modify-write per m2. NEW 1 and NEW 2: one case each. iOS memory: none.

## For coach (questions the numbers raise, not answers)
1. A moved-in session over a logged jog: is that one day's two efforts (a brick), or one session that the jog's numbers should never seed? Today the jog's 3.7 opens as the session's own miles, `Logged ✓`, in 13,248 / 13,500 picker forms.
2. Should the jog's minutes and type have a home that survives a rebuild? Their only reader stops rendering at the move, and coach's D213 Amendment 1 reason ("a flag no screen shows") is measured true from the move onward.
3. Should the jog's RPE become the session's RPE on a Done untouched (20,160 / 20,160 today), given D219's rule that an untouched slider is not a number?
4. Should a day that carries swapTo or parked count as logged for restMoveCandidates? 44 / 44 are offered, and the move leaves their parked numbers unreachable.
5. Should "Training anyway?" be offered at all over a logged jog, or offered with a different consequence? The button at :12176 is unconditional.
6. Does NEW 1 ("Log more" overwrites the first jog's minutes) ride this build as data layer, or queue? It loses typed data today.
7. With P-RESTWHEEL going first: does a separate rest-sheet distance key belong to the data layer, given the readers in §2 (MILES, Progress, plannedVsLogged, maxDist) all read the shared `run_dist` / `bike_mins` / `swim_yards`?
