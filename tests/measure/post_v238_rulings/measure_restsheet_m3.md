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
