# Post-V238 m3 — Mario's device report: rest-sheet "Log cardio" on a non-today rest day. Numbers only; no ruling, no fix.

Mode: A (prove), V238 (HEAD 2fbc98c, ia-version 238) against V237 (`base_v237.html`, ia-version 237). HALF_MANNY seed 76308, `cardioTypes ["run"]`, rest WED + SUN.
Script `tests/measure/post_v238_restsheet.js`, output `tests/measure/post_v238_restsheet.out.txt`.
- **Clock:** Thu 2026-10-08 noon, two starts. Start Mon 2026-09-28 makes today W2 THU; start Mon 2026-10-05 makes it W1 THU. The hero prints `Today · Thursday` (Posterior Chain) under both.
- **The gesture, through the real chain:** the WED strip cell's own `onclick` (`openDayKey('wed')`) → `restDayEligible` → `openRestSheet` → `renderRestSheet`. Then the menu row's onclick (`_rdSet('view','cardio')`), the chip onclick, each input's own `onchange` attribute run with the typed string, and the `Log it` button's onclick (`applyRestCardio()`). No planted entries.
- **Oracle:** hand constants (3.1 mi, 25 min) and a hand calendar.
- **Instrument fixes, kept in the script:** the today key is hand-set to `thu` (`isTodayKey` is local to renderWeekView), and the week view is re-rendered before re-entry (the first run re-entered against a blank DOM and printed nothing, so it is discarded).

## REPRO (his gesture, V238, start 09-28)
- **Tap:** on a training day (THU), tapping WED in the strip opens the sheet, `WEDNESDAY · REST DAY / Not resting?` with the rows "Train a session here" and "Log cardio". Tapping SUN (future) does nothing: `restDayEligible` is false, no sheet, no toast. `openDayKey` :11869 returns before `openRestSheet`'s "not come around yet" toast. Neither version shows "Training anyway?" on a non-rest today (`false` on both).
- **Log cardio → Run:** the sheet opens with minutes prefilled `30` and miles blank. He types 3.1 in miles, taps Log it:
  - Toast `"30 min logged ✓"`, the sheet closes.
  - Stored `{"w2_wed":{"restLog":{"run":{"mins":30,"dist":3.1,"rpe":5}},"week":2,"ts":…}}`. The 3.1 is saved; the 30 min and RPE 5 are the sheet's defaults, not his.
- **Going back in:** the menu is identical, and Log cardio shows `minutes="30" miles=""`, no "logged" text and no "Log more". The sheet never shows the stored entry.
- **Same on V237:** stored `{rest_cardio:true, rest_type:"run", rest_mins:30, rpe:5, run_dist:3.1}`; re-entry `minutes="30" miles=""`.
- **Under start 10-05 (W1):** both versions behave the same (W1 keys).

## FINDING (V238 vs V237, 2 starts × 7 entry cases each = 14 drives per version)
| Case | Toast | Sheet closes | Stored (V238) | Typed number kept | Re-entry shows it |
|---|---|---|---|---|---|
| a1 distance only (minutes left at prefill 30) | 30 min logged ✓ | yes | run {mins:30, dist:3.1, rpe:5} | 3.1 yes (30 min stored that he did not type) | no |
| a2 distance only, minutes cleared | **How long did you go?** | **no** | nothing | 3.1 **not saved** | no (blank) |
| b minutes 25 + 3.1 | 25 min logged ✓ | yes | {mins:25, dist:3.1, rpe:5} | yes | no |
| c minutes 25 only | 25 min logged ✓ | yes | {mins:25, rpe:5} | yes | no |
| walk, prefill / 25 | 30 / 25 min logged ✓ | yes | walk {mins, rpe:5} (no distance box) | yes | no |
| d re-entry: a1 twice | 30 min logged ✓ ×2 | yes | **{mins:60, dist:6.2}**; MILES 6.2 | doubled | no |

V237 gives the same toasts, the same closes and the same re-entry for every case. Its stores differ only in shape, plus case d, where V237 sums dist (6.2) and overwrites mins (30) while V238 sums both (60, 6.2).

**Where a logged non-today jog shows, by surface:**
- Strip cell: `WED — 7 REST`, with no jog mark on either version.
- Hero: it shows today (THU), so no rest line is rendered on either version (`_rcLine` renders only on a rest hero, V238 :12227).
- Week MILES: 3.1 on both.
- Progress run total: `3.1 mi` on both.
- Journal: V238 `Wed 30 min run logged · RPE 5`, V237 `Wed RPE 5 — Hard`. This is a ruled change (D224).
- The sheet itself: nothing, on both.

**Classification:**
- **Regressions:** none found. Every surface Mario named (re-entry blank, no undo, no visible hero for a non-today day) is identical on V237.
- **Pre-existing:**
  - The sheet never reads the store (14/14 per version).
  - Minutes prefill to 30 and RPE defaults to 5 on every open (14/14).
  - Clearing minutes blocks the log with the sheet left open, losing the typed distance on close (2/2 per version).
  - A re-log doubles the record (2/2 per version).
  - A future rest day is inert with no message.

**Undo:**
- No path exists on either version to clear or edit a rest-day jog.
- Static scan, comments stripped:
  - `restLog` cleared or deleted: 0 sites (V238).
  - `rest_*` cleared: 0 sites (V237 and V238).
  - `removeItem` of `ia_logs_`: 0.
  - The 6 `delete` hits in each version are the swap/edit stores and `ia_comp_` (V238 :10305, :10316, :10373, :10396, :14753, :14778), not logs.
- The only remover of `ia_logs_` is `purgeProgData` (V238 :16406), which deletes the whole program.
- No sheet function reads `getLogs`: openRestSheet, renderRestSheet, _renderRestCardio and _renderRestMove return false for both versions.

**Is a typed number lost?**
- a1: no. The 3.1 is stored and credited to MILES and Progress, but nothing on the sheet shows it, so it looks lost.
- a2: yes, typed distance lost. Both versions.

## ROOT (V238 lines)
- **The sheet never reads the stored entry:** `openRestSheet` :1382 resets `_restDraft.mins=30; _restDraft.dist=''; _restDraft.rpe=5` (:1387) on every open, and `_renderRestCardio` :1432 renders inputs from `_restDraft` only.
- **The only rest-jog reader on the week view is today-only:** `_rcLine` :12227-:12228 (and its "Log more" label) reads `_heroCardio`, which is non-null only when the hero day is today's rest day.
- **The minutes guard:** `applyRestCardio` :1470 refuses `mins<=0` with "How long did you go?" (:1473) and leaves the sheet open. The distance is held only in `_restDraft`.
- **The toast names minutes only:** `m+' min logged ✓'` (:1495).
- **Re-log sums:** D226 :1483-:1490.

## SPREAD (readers of a non-today rest jog, V238)
- Week MILES :12277 (`restLog.run.dist`).
- Progress sums :17697-:17701.
- Journal :17835 / :17864 (`restLogLines` :12010).
- `seedFromPriorPrograms` maxDist :16511.
- `ladderWeekly` :16766.
- Hero `_rcLine` :12227, today only.
- Strip cell: none. Sheet: none.

## UNKNOWN
- iOS event order: whether the miles input's `onchange` (the only thing that copies the typed value into `_restDraft.dist`) fires before `Log it`'s click when he taps Log with the field still focused. The VM fires it by construction. If it does not fire, case a1 stores `{mins:30}` with no distance, and the toast is the same `30 min logged ✓`. That would match "didn't save what I entered" and cannot be told apart from the toast. **Device check needed:** read his `ia_logs_` W2 WED entry.
- Which of a1 or a2 he did ("i enterned a distance… i hit log").

## For coach (questions only)
1. Should the rest sheet show what is already logged on that day when it reopens? On both versions it never reads the store.
2. "Distance only" stores a 30 min and an RPE 5 he did not enter (prefill and default). Is a prefilled number a record?
3. Clearing minutes blocks the log and keeps the typed distance only in an unsaved draft. Is minutes required when a distance is given?
4. Should a rest-day jog be undoable or editable? No path exists on either version.
5. A re-log after a blank re-entry doubles the record (60 min / 6.2 mi on V238). Is D226's sum the right behaviour when the sheet gave him no sign the first log landed?
6. Should a future rest day tell the athlete why nothing opens? It is inert and silent today.

## m4 — can one tap on "Log it" store the jog twice? (V238 HEAD 21c8eeb, `index.html` unchanged since 2fbc98c)

Mario's facts: no prior W2 WED log, he opened the sheet once, Log cardio, Run, typed 1 mile, tapped Log once. His journal reads `Wed 60 min run logged · RPE 7`.
Script: `tests/measure/post_v238_doublefire.js`, output `tests/measure/post_v238_doublefire.out.txt`. It runs a VM drive of the real button onclick, V238 and V237. The applyOverlayDraft drive threw in the stub (a null `onclick` target), so that row is code-read only.

### 1. Ways one tap can reach `applyRestCardio` twice
**Certain from the code (V238 lines):**
- **The button's only handler** is the inline `onclick="applyRestCardio()"` (:1456). Nothing else is bound to it:
  - Whole-file count of `touchend`, `touchstart`, `ontouch`, `.click()`, `addEventListener('click'`: 0.
  - `pointerup`/`pointerdown` (:14084, :14104) belong only to the rest-timer drag handle (`_rtWireDrag`).
  - `dispatchEvent` (:13811) only fires `input` on a run-wheel node.
  - `document.addEventListener` appears once, `touchmove` for the timer drag (:14125). There is no click delegate.
  - The overlay (:1141-:1146) has only the "← Back" onclick.
- **No repeated binding:** `renderRestSheet`/`_renderRestCardio` replace `innerHTML` with inline handlers each time, and bind no listeners.
- **No re-entrancy:** `applyRestCardio` (:1470) calls `closeRestSheet` (removes `open`) and `renderWeekView`. It does not re-render or reopen the sheet, and does not call itself. So one click event = one call.
- **But the sheet stays tappable after the call.** The `.rand-overlay` CSS (:885-:886) slides the sheet down for 0.36 s and delays `visibility:hidden` by 0.36 s, so the closing sheet is visible and hit-testable for 360 ms. In that window the `Log it` button is still in the DOM (restBody is not cleared; printed true after every call). `_restDraft` is also not reset (printed `{mins:30, dist:"1", rpe:7}` after the call; only `openRestSheet` :1387 resets it). A second click in that window re-runs the call with the same values.

**Depends on the device, and on the hand:**
- With `touch-action:manipulation` (:35) and `user-scalable=no` (:5), iOS Safari has no double-tap zoom, so one physical tap delivers one `click`. The code holds nothing that turns one tap into two clicks.
- Two calls therefore need two click events: a second touch, a finger bounce, or a quick double tap within roughly 360 ms while the button slides down under the finger. Whether his "once" included that cannot be read from code.

### 2. Routes to `60 min · RPE 7` from his session
RPE 7 = he tapped the Steady chip (default 5; on V238 the RPE takes the max). Drive (V238) by route:

| Route | Stored `restLog.run` | W2 MILES contribution | Journal |
|---|---|---|---|
| One call, minutes left at the 30 prefill | {mins:30, dist:1, rpe:7} | 1 | `30 min run…` (does not match his screen) |
| **Two calls**, prefill 30 (double-fire) | **{mins:60, dist:2, rpe:7}** | 2 | `60 min run logged · RPE 7` |
| One call, minutes typed 60 | **{mins:60, dist:1, rpe:7}** | 1 | `60 min run logged · RPE 7` |
| Two calls, minutes typed 60 | {mins:120, dist:2, rpe:7} | 2 | `120 min…` (does not match) |

V237, for comparison: two calls overwrite minutes (30 stays 30) and sum `run_dist` to 2, and the journal prints `RPE 7 — Very Hard` with no minutes. So `60 min` on his screen is either a V238 double call or minutes he set to 60 himself.

**The discriminating fact is the distance:** 2 means a double call, 1 means one call with 60 entered.
- No surface shows Wednesday's miles on their own. The journal and the hero print minutes and RPE only (`restLogLines` :12010), and the hero shows only on today's rest day.
- **Cheapest read:** the Week 2 **MILES** tile (:12277 = every W2 day's `run_dist` + Wednesday's `restLog.run.dist`), minus the miles of any W2 run sessions he logged (each readable on its own card). The remainder is Wednesday: 2 means double-fire, 1 means single call. If he logged no other W2 run, the tile is Wednesday's distance directly.

### 3. Blast radius if a double-fire is real
- **Shared mechanism:** every inline-onclick button on an `.overlay` / `.rand-overlay` sheet that closes the sheet is still hit-testable for 0.36 s with its draft unreset. The sheets are detailOverlay, swapOverlay, addOverlay, randOverlay, restOverlay, changeOverlay, goalOverlay, mileOverlay, mileLockOverlay.
- **Second call, by writer:**

  | Writer | V238 | V237 | Basis |
  |---|---|---|---|
  | `applyRestCardio` | sums mins + dist, max rpe (D226) | overwrites mins, sums `run_dist` | driven |
  | `applyRestMove` | idempotent: `ia_moves_` byte-identical | same | driven |
  | `handleDayStatus` (Done) | toggle: the second call deletes the completion (`wasSame`, :14764 ff.), so Done undoes itself | same | driven |
  | `applyOverlayDraft` | pushes a second overlay with a new `ov_`+Date.now() id, no dedupe (:16101-:16102) | same | code-read; the drive threw in the stub |

- Unchanged by V238: everything except `applyRestCardio`. On `applyRestCardio`, V238 only changes which field doubles (minutes and distance, rather than distance alone).

### Unknown
- Whether his tap produced two clicks. That needs the MILES read above, or an on-device repro: tap Log it, then tap again within 0.36 s.
- Other overlay buttons not listed above were not driven.

### For coach (questions only)
1. Should a closing sheet's apply button stay live during its 0.36 s slide-out, with its draft unreset?
2. Is a second Log within that window the same jog or a "Log more"? D226 sums it.
3. Does the Done toggle's second-tap undo inside the same window count as the same class?
