# v0.240.0 m5 — before-picture: P-SHEETCLOSE inventory and the rest sheet's current surface. Numbers only; no ruling, no fix.

> Renamed 2026-10-11 under semver (Mario): this build was called V239, then V240, and is v0.240.0. Its version labels and file paths below were updated to match; nothing else in this file changed.

Mode: B (before-picture). `index.html` ia-version 238, HEAD ff23706. HALF_MANNY seed 76308 (`cardioTypes ["run"]`, rest WED + SUN), start Mon 2026-09-28.
Script `tests/measure/v0.240.0_restsheet_m5.js`, output `tests/measure/v0.240.0_restsheet_m5.out.txt` (224 lines, ends `DONE`).
- **Clocks:** Thu 2026-10-08 noon (W2 THU, a training day) and Wed 2026-10-07 noon (W2 WED, today a rest day). Date pinned in the VM.
- **Gestures:** every button is run through the onclick string its sheet rendered. Second calls run the same onclick again with no reopen, which is what a second touch on a closing sheet runs.
- **Oracles:** the CSS text, a hand calendar, hand constants (3.1 mi, 25 min, RPE 7), and RPE_LABELS as printed.
- **Instrument fix:** m4's `applyOverlayDraft` throw was the stub, not the app. `renderChangeChips` :15775 sets `.onclick` on `div.querySelector(...)` of a `createElement` node, and the stub returned null. `document.createElement` now returns a node whose `querySelector` returns a child stub, so `applyOverlayDraft` and `applyInjuryDraft` are driven, with no throw.
- **Failed measurement (A2b):** in this DOM stub, `toggleSets` and `stepSet` hit a 3 s vm timeout, and `skipSuperset` ran the heap out twice. The detail sheet's non-closing writers are therefore code-read only.

## A. P-SHEETCLOSE inventory

### A1. Overlays (static, from the file)
| Element(s) | Class | Close | Window still hit-testable after close |
|---|---|---|---|
| detailOverlay :1058, swapOverlay :1084, addOverlay :1095 | `.overlay` | `classList.remove('open')` | **360 ms** |
| randOverlay :1132, restOverlay :1141, changeOverlay :1148, goalOverlay :1155, mileOverlay :1165, mileLockOverlay :1183 | `.rand-overlay` | same | **360 ms** |
| swapNudgeOverlay :1106, popOverlay :18536 | `.pop-overlay` | `remove('show')` → `display:none` (:455-:456) | 0 ms (the :891-:892 animation is entry only) |
| rpeInfoOverlay :1114 | `.rpe-overlay` | `remove('show')` → `display:none` (:921-:922) | 0 ms |
| toast :505 | — | opacity .2 s | not tappable (`pointer-events:none`) |

- **The 360 ms:** the closed state at :885-:886 is `transform:translateY(100%)` over .36 s and `visibility 0s linear .36s`. The `display:block !important` at :885 overrides the `display:none` base rules (:283, :490).
- **Under `prefers-reduced-motion`,** :899 sets `transition:none`, so the window is 0.
- **No overlay selector has a `pointer-events` rule:** 0 of the 8 `pointer-events` sites in the file.
- **9 sheets carry the window.**
- **Close functions:**
  - closeDetail :14745 (also calls `renderWeekView`)
  - closeSwapSheet :14495 (also nulls `_swapCtx`)
  - closeAddSheet :14661
  - closeRandom :11619
  - closeRestSheet :1391
  - closeOverlaySheet :15860
  - closeGoalSheet :15219
  - closeMileSheet :15400 (closes both mile sheets)
  - dismissSwapNudge :14720
  - popClose :18273
  - hideRpeInfo :14749
- None of the 11 clears its sheet's body or resets its draft. The one exception is closeSwapSheet, which nulls `_swapCtx`.

### A2. Second call of each state-writing or closing handler (driven, 16 handlers)
| Sheet | Handler (rendered onclick) | Closes | Second call | Detail |
|---|---|---|---|---|
| rest | `applyRestCardio()` :1470 | yes | **sum** | `{mins:30,dist:3.1,rpe:5}` → `{mins:60,dist:6.2,rpe:5}`; toast `30 min logged ✓` ×2 |
| rest | `applyRestMove()` :1458 | yes | idempotent | ia_moves_ unchanged; the toast repeats |
| rest | `_rdSet(...)` | no | writes nothing | draft only |
| detail | `handleDayStatus(…,'complete')` Done :14764 | yes | **toggle** | ia_comp_ back to before; ia_logs_/ia_hist_ from call 1 kept; toasts `Done ✓` then `Unmarked` |
| detail | `handleDayStatus(…,'skipped')` Skip | yes | **toggle** | `Skipped ✕ …` then `Unmarked` |
| detail | log-nudge `Mark Done ✓` (same function) | yes | **toggle** | same |
| swap | `applySwapChoice('Barbell bench press')` :14496 | yes | idempotent | `_swapCtx` is null after close, so the guard returns with no toast |
| add | `applyAddChoice('Dumbbell front raise')` :14662 | yes | idempotent | the bucket dedupes (ia_edits_ 105 bytes both times); the toast repeats |
| rand | `completeWildcard('Hangover Cure')` :11608 | yes | idempotent | dedupes by title; the toast repeats, and code-read says a second popup timer (`setTimeout(fireWildcardPopup,380)`) is queued |
| change | `applyOverlayDraft()` :16090 | yes | **duplicate record** | overlays 0 → 1 → 2; `Change applied ✓` ×2; id `'ov_'+Date.now()` with no dedupe |
| change | `applyInjuryDraft()` :15980 | yes | **duplicate record** | overlays 0 → 1 → 2 |
| goal | `commitGoalChange()` :15307 | yes | idempotent | cfg is identical; the rebuild and toast repeat |
| mile | `commitMileChange()` :15407 | yes | **rewrite** | same mile, but `mileBestSrc.from` goes from `{10:30, entered}` to `{9:45, edited}`, so the original provenance is lost |
| nudge (pop) | `acceptSwapNudge()` | yes | idempotent | 0 ms window anyway |
| nudge (pop) | `dismissSwapNudge()` | yes | writes nothing | — |
| rand header | `resetWildcardCounter()` :11622 | no | two-tap confirm | call 1 arms, call 2 wipes ia_wild_. Not a closing sheet: a second tap is its designed confirm |

- **Count, over the 12 handlers that close a 360 ms sheet and write:**
  - sum: 1
  - duplicate: 2
  - toggle: 3
  - rewrite: 1
  - idempotent: 5 (4 of the 5 repeat their toast)
- **Navigation-only closers:** the `‹ Back` buttons, `Got it` (:15941, :15958, :15387), `Keep what I have` and `Stay the course`. Each is a no-op on a second call.

### A2b. Detail-sheet writers that do not close (code-read; the drive failed)
- **Handlers:** the detail sheet renders 15 handler names. The two that close are `handleDayStatus` and `showRpeInfo` (opens the RPE card).
- **Non-closing writers:** `toggleSets`, `stepSet` (30), `setDelta` (15), `onSetWeight` (15), `cascadeSetWeights`, `saveExWeight`, `skipExercise`, `skipSuperset`, `setCardioSwap`, `logCardio`, `updateRPEDisplay`, `toggleCardioPicker`, `openSwapSheet`.
- **randOverlay renders the same set controls** through `buildSectionsHTML`: `stepSet` 54, `saveExWeight` 7, `skipExercise` 6.
- **Second call not measured.** These matter to P-SHEETCLOSE only if a second touch lands on them while the sheet slides under the finger after Done.

### A3. Outside a sheet
- **Detail status foot:** on a Done day the foot reads `Done ✓ tap to undo / Skip`, driven.
  - The undo tap (`wasSame`, :14773-:14784) re-renders the foot in place and keeps the sheet open. The button under the finger is still a live `handleDayStatus`, so a second tap re-sets it (code-read).
- **Week-view hero `Training anyway?` / `Log cardio` / `Log more`:** these only open a sheet (navigation).
- **Every other re-render** replaces `innerHTML` synchronously, so the old node is detached and not hit-testable (code-read).

## B. The rest sheet's current surface

### B1. Inputs per type (driven; `cardioTypes` set to all four so every chip renders; walk is always appended :1434)
| Type | Time box | Distance box | Typed 25 + 3.1 stores |
|---|---|---|---|
| run | `TIME`, unit `min`, placeholder `minutes`, `inputmode=numeric min=1 max=600`, no step, prefilled `30`, onchange `_restDraft.mins=+this.value\|\|0` | `Distance (miles) optional`, placeholder `miles`, `inputmode=decimal step=0.1 min=0`, no max, value `''` | `restLog.run {mins:25,dist:3.1,rpe:5}` |
| bike | same | **Distance (miles)**, placeholder miles | `restLog.bike {mins:25,dist:3.1,rpe:5}` |
| swim | same | **Distance (yards)**, placeholder `yards`, **step 0.1** | `restLog.swim {mins:25,dist:3.1,rpe:5}` |
| row | same | **Distance (miles)**, placeholder miles | `restLog.row {mins:25,dist:3.1,rpe:5}` |
| walk | same | no box (:1442) | `restLog.walk {mins:25,rpe:5}` |

- **The toast is always `<mins> min logged ✓`.**
- **Which stored distances have a reader (code-read):**
  - Progress credits run.dist, bike.mins and swim.dist (:17697-:17700).
  - `restLog.bike.dist` and `restLog.row.dist` are stored and read by none of the m3 SPREAD readers.

### B2. RPE chips vs RPE_LABELS (driven)
| Chip | Sheet word | RPE_LABELS (:13482) |
|---|---|---|
| RPE 5 (default selected) | Easy | Hard |
| RPE 7 | Steady | Very Hard |
| RPE 9+ | Hard | Max Effort |

- **0 of 3 agree.**
- The RPE info card (:1114) bands are a third vocabulary: 1–3 Easy, 4–6 Moderate, 7–8 Hard, 9–10 Max.
- The journal prints the sheet's RPE number with no word (D224, :17859).

### B3. Session-card wheels (code-read; pure parts driven)
- **Builder:** `iaWheelHTML(kind, hiddenId, val, capOverride, plan)` :13748, specs in `_IAW_SPEC` :13640:
  - `dist`: 0–99 . 0–9 0–9 miles
  - `hms`: 0–9 h : 0–59 : 0–59, stored as decimal minutes
  - `pace`
  - `rept`
- **Run (`cardioFieldHTML` :13863):**
  - time form :13885: `hms→log_run_mins` with plan `dose.mins` (fri Recovery: plan 35), then `dist→log_run_dist`.
  - dist form :13895: `dist→log_run_dist` with plan `dose.mi` (sat Long Run: plan 4), then `hms→log_run_mins`.
  - generic form :13915 (NRC speed days mon/thu): `dist` + `pace`.
- **Bike:** `hms→log_bike_mins` :13924.
- **Swim:** no wheel. It is `<input type="number" id="log_swim_yards" placeholder="yards" min="0" step="25">` (:13926).
- **What a wheel needs (code-read):**
  - `iaWheelHTML` is a pure string and takes any hidden id (driven).
  - It comes alive only through `iaWheelInit(root)` :13825. That needs real `querySelectorAll`, scroll events and `requestAnimationFrame`, and it marks `_iawOn`.
  - Commit is `_iawCommit` :13797: it writes the hidden input and dispatches `input`.
  - The only `input` listeners are wired inside `openDetail` (:14284-:14290) to `persistLogFields(dayKey)`.
  - `iaWheelFlush(root)` :13818 is root-scoped.
- **Can a wheel render inside the rest sheet as written?** The markup can. Nothing would listen to it.
- **The hidden ids are fixed strings, and the detail sheet keeps its markup after close:**
  - After `closeDetail`, detailBody still holds `id="log_run_dist"` and `id="log_run_pace"` (driven).
  - detailOverlay :1058 precedes restOverlay :1141 in the document.
  - So a rest-sheet wheel that reused `log_run_mins`/`log_run_dist` would lose `getElementById` to the stale detail node.
- **hms ceiling (driven):** `_iawParse('hms','800')` gives 9:59:59, i.e. 599.98 min.

### B4. D226's sum against `max="600"` (driven)
- **The sum passes 600:** 400 + 400 stores `run.mins 800`. Toasts `400 min logged ✓` ×2.
- **One typed 900 also stores `{mins:900}`.** The onchange `+this.value||0` does not clamp, and `max` is an attribute that nothing checks. Toast `900 min logged ✓`.
- **Readers of 600:** 0 compare a rest-day mins to 600. The single line hit is the input itself (:1451).
- **What each reader does with 800 run + 800 bike:**
  - journal: `800 min run logged · RPE 5` and `800 min ride logged · RPE 5`
  - Progress bike total: adds 800
  - MILES: 6
  - ladder: `{2:6}`
  - seed maxDist: 6
  - Only the card's hms wheel would peg the display at 9:59:59. No rest-day reader is a wheel.

### B5. The move sheet, verbatim (driven), with a 30 min / 3.1 mi jog logged on WED
`WEDNESDAY · TRAINING ANYWAY / Move a session here / Nothing gets added. Whatever you pick moves to Wednesday, and its old day becomes your rest. / NOT LOGGED THIS WEEK / Strength Support Monday · not logged / Leg Strength + Mobility Tuesday · not logged / Posterior Chain Thursday · not logged / Recovery Lift Friday · not logged / Full Body Support Saturday · not logged`
- **It says nothing about the jog:** no "min", "logged jog" or "3.1".
- **The menu is byte-identical** with and without the jog.
- **The cardio view** shows `minutes=30 miles=''` and no logged text.
- **No-candidates branch (:1411-:1413, code-read):** `Nothing left to move / Every session this week is logged or done. Take the rest, or log some cardio instead.`

### B6. Which rest days open the sheet (driven; expected values from the hand calendar)
- **Hand calendar, start Mon 09-28:**
  - W1: WED 09-30, SUN 10-04
  - W2: WED 10-07, SUN 10-11
  - W3: WED 10-14, SUN 10-18
- **Result:** 12/12 agree, over 2 clocks × 6 rest days.
  - Past week, and past this week: **opens**.
  - Today (clock Wed): **opens**.
  - Future this week, and future weeks: **silent** (no sheet, no toast; `openDayKey` :11869 checks eligibility before calling `openRestSheet`).
- **Before start** (start Thu 10-01, W1 WED 09-30): toast `Before your start date` (:11866).
- **`That rest day has not come around yet` (:1384, 1 site) is reachable on one path, and the day it names has already come:**
  - Move today's THU session onto WED. THU becomes `{rest:true, moved:true}`.
  - The hero switches to rest mode and renders `Training anyway?` and `Log cardio`.
  - Both buttons give that toast, because `restDayEligible` :1567 refuses `day.moved`.
  - Tapping THU on the strip is silent.
  - There are 3 callers of `openRestSheet`: :11869, :12238, :12239.

## C. Clear and edit, the before-picture

### C1. W2 WED entry shapes through every reader (driven; clock Thu, and clock Wed for the hero)
| Reader (line) | S0 no key | S1 jog {run:{mins 30, dist 3.1, rpe 5}} | S2 `{restLog:{},week,ts}` | S3 `{week,ts}` |
|---|---|---|---|---|
| Week MILES :12277 | 0 | 3.1 | 0 | 0 |
| Strip cell | `WED — 7 REST` | same | same | same |
| Hero `_rcLine` :12223-:12239 (clock Wed) | no line, `Log cardio` | line, `Log more` | no line, `Log cardio` | no line, `Log cardio` |
| Progress :17735 | empty card A (`Start logging…`, hasAnyData false) | renders | **empty card B** (`Log sessions to see…` :17908; hasAnyData **true** by key presence) | **empty card B** |
| Journal :17835 | no row | `Wed 30 min run logged · RPE 5` | no row | no row |
| seed maxDist :16511 (6 recovery runs of 2 mi planted) | 2 | 3.1 | 2 | 2 |
| ladderWeekly :16766 | {} | {2:3.1} | {} | {} |
| restMoveCandidates :1578 | mon,tue,thu,fri,sat | same | same | same (rest days are skipped at :1583) |
| **Freeze**: refreshProgram `_touched` :16228 (marker planted on stored W2 WED) | rebuilt | **frozen** | **frozen** | **frozen** |
| Sheet re-entry | blank, 30 | blank, 30 | blank, 30 | blank, 30 |

- **Presence-only readers:**
  - Progress `hasAnyData = Object.keys(logs).length>0` (:17735).
  - The refreshProgram freeze, which merges the raw `ia_logs_` keys (:16228) and raises `_maxTouched`/`_curTouched` (:16242-:16251).
- **S2 and S3 diverge from S0 on exactly these two readers.** Every other reader keys on a field.
- `restNorm` :1242 passes S2 through as is, because `{}` is truthy.
- **The only remover of `ia_logs_` is still `purgeProgData` :16406** (m3).

### C2. Partial jog records through the m3 SPREAD readers (driven, clock Thu; hero from clock Wed)
| Record `restLog.run` | MILES | Progress mi | Journal Wed row | Hero (today WED) | seed maxDist | ladder | Then one sheet log with the defaults |
|---|---|---|---|---|---|---|---|
| T1 `{dist:3.1,rpe:7}` (no mins) | 3.1 | 3.1 | **row printed with no line** (passes :17835, `restLogLines` :12012 drops a type with no mins) | **no line, `Log cardio`** | 3.1 | {2:3.1} | `{mins:30,dist:3.1,rpe:7}` |
| T3 `{mins:0,dist:3.1,rpe:7}` | 3.1 | 3.1 | row, no line | no line, `Log cardio` | 3.1 | {2:3.1} | `{mins:30,dist:3.1,rpe:7}` |
| T2 `{mins:25}` (no rpe) | 0 | — | `Wed 25 min run logged · RPE —` | `25 min run logged · RPE —`, `Log more` | 2 | {} | `{mins:55,rpe:5}` |
| T4 control `{mins:25,dist:3.1,rpe:7}` | 3.1 | 3.1 | `Wed 25 min run logged · RPE 7` | line, `Log more` | 3.1 | {2:3.1} | `{mins:55,dist:3.1,rpe:7}` |

- **No reader double-counts a mins-less record.**
- **Two readers hide one while three count it:**
  - Hidden: the journal and the hero.
  - Counted: MILES, Progress, seed and ladder.
- **Reachability today:** `applyRestCardio` refuses `mins<=0` (:1473), so T1 can only arrive through `restNorm` of a V237 entry with `run_dist` and no `rest_mins` (:1246-:1250, code-read).
- **The seed rows under clock Wed are an artifact.** The planted jog ts (Wed 18:00) is after that clock, so the `e.ts>now` window drops it. Only the clock-Thu seed rows are read.

## ROOT (V238 lines)
- **The close window:** `.overlay,.rand-overlay` :885-:886 delays `visibility` by .36 s. There is no `pointer-events` rule, and none of the 11 close functions clears a body or resets a draft (except `_swapCtx` :14495).
- **The draft is reset only by `openRestSheet` :1387.** `renderRestSheet`/`_renderRestCardio` :1393/:1432 read `_restDraft` only.
- **Clear and edit:** no writer deletes a `restLog` type or an `ia_logs_` day key (m3). The freeze (:16228) and Progress (:17735) read the key's mere presence.
- **The reachable "not come around yet":** `restDayEligible` :1567 refuses `day.moved`, but the hero :12216 treats a moved-from today as a rest day.

## SPREAD
- **Second-call writers beyond m4:** `applyInjuryDraft` (duplicate) and `commitMileChange` (provenance rewrite) are new. `applyOverlayDraft` is now driven (duplicate).
- **Toast repeats:** `applyAddChoice`, `completeWildcard`, `commitGoalChange` and `applyRestMove` repeat their toast with no store change.
- **Readers of a day key by presence:** Progress hasAnyData and the refreshProgram freeze.
- **Readers that drop a mins-less jog:** the journal and the hero (`restLogLines`).
- **RPE vocabularies:** three disagree (sheet chips, RPE_LABELS, the RPE info card).

## UNKNOWN
- **A2b:** the second call of the detail sheet's 13 non-closing writers, and which element sits under the finger during a 360 ms slide-down after Done. The stub cannot run them, and the geometry needs a device.
- **iOS:** whether `visibility` delayed by a transition still hit-tests on WebKit exactly as the spec says, and whether a second `click` within 360 ms is delivered. This needs a device repro.
- **Moved-today hero:** the "not come around yet" path was driven, but not checked against `Training anyway?` on a day whose session moved away in a past week.
- **Bike/row distance:** whether any reader outside the m3 SPREAD list reads `restLog.bike.dist` or `restLog.row.dist`. The static check was limited to the SPREAD list.

## For coach (questions only)
1. Of the 12 closing handlers on 360 ms sheets, 7 change state on a second call (1 sum, 2 duplicates, 3 toggles, 1 rewrite). Does P-SHEETCLOSE cover all 9 sheets or the rest sheet only?
2. Is `resetWildcardCounter`'s designed second tap a precedent or an exception?
3. A cleared day as `{restLog:{}}` or `{week,ts}` still freezes the day and flips Progress to its other empty card. Is "clear" a key deletion or an emptied record?
4. Should the jog be credited to MILES and Progress when its time is absent (T1), given the journal and hero hide it?
5. The sheet says Easy / Steady / Hard at RPE 5 / 7 / 9. RPE_LABELS says Hard / Very Hard / Max Effort. The info card says 1–3 Easy, 4–6 Moderate, 7–8 Hard, 9–10 Max. Which vocabulary does the rest sheet speak?
6. A swim distance box in yards steps 0.1 and bike/row boxes take miles that no reader reads. Should each type have a box at all?
7. `max="600"` is not enforced, and the sum passes it (800 stored). Is 600 a ceiling?
8. "That rest day has not come around yet" fires on today when today's session moved away. Should a moved-from today accept a jog?
9. A wheel in the sheet cannot reuse the card's hidden ids (stale detail markup wins `getElementById`). Is a wheel ruled in for the sheet?
