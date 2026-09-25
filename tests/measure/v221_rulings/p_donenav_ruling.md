# P-DONENAV — Done closes the day and lands on This Week (coach, provisional, V219 baseline 920fa0a)

Persisted by the orchestrator from coach's return, 2026-09-24 (coach is read-only).
Mario: "when you hit 'done' at the bottom I want it to close out the workout page for the day, then hit the home screen of the app."
Measure: tests/measure/v221_done_nav.js (V219, HALF_MANNY, 70 Done taps).

## Summary (Mario's calls first)
1. Which taps close: every status-setting tap closes the day: Done, Skip, and Mark Done ✓. The two undo taps stay on the day. Landing is This Week via the existing `closeDetail` exit. Counter: Skip is the small button under Done, so a mis-Skip now also navigates; reversal is open-the-day, tap undo.
2. Pop-up sequence: close first, pop-up sits over This Week (the boot reminder already does this; none of the three completion pop-ups navigates; `popClose` needs no new logic). No hold cases: V181/V183 removed the Done nudge; an unlogged run gets no guilt gate; a mis-tap is handled by undo, not a confirm. Counter: the athlete loses sight of the form under the celebration; the pop-up covered it anyway.
3. Undo after leaving: no new surface. Tap the day on This Week; footer reads "Done ✓ tap to undo" on every reopen. A toast undo is a new pattern with a 2.2 s window. Companion (Mario's call): the Today hero shows the mark took (today its CTA reads START SESSION regardless of status).
4. Wheel gap: it is the three run wheels, not RPE (RPE is a range slider).
Measure needed: strip cell and hero print for a Done day; rest-timer float after close; toast under pop-up.

## Finding (V219)
`handleDayStatus` (index.html:14374) saves the log, writes the status, rebuilds the footer, toasts, fires the pop-up, and leaves the overlay open: 70/70 Done taps on HALF_MANNY stayed on the day; pop-up 70/70. The only exit is ‹ Back (`closeDetail`, :14355). Nothing that navigates touches `popOverlay`; the three completion pop-ups (:17763, :17775, :17788) render the default single `popClose()` button.

## Coaching argument
V183 put Done at the bottom so the page reads: do the work, log it, close it out. Closing it out now closes it out. Skip carries the same verb with the opposite grade (its toast already says "the week moves on"). Mark Done ✓ (:13950) is the same handler on a revisited day. Undo taps are "not finished", so they stay where the work is. The pop-up is the closing ceremony and belongs over the week with the DONE tile already advanced (:12063). No hold for an unlogged run (V181 "no hint copy, there is nothing to grade"; V183 refused a cue at Done). A confirm dialog on Done is the guilt button V181 deleted.

## What changes
- `handleDayStatus`, set branch only: after the status write and `renderWeekView`, close the overlay (the `closeDetail` path), then toast, then `fireCompletionPopup` for complete. Skip: same, no pop-up.
- Wheel requirement: on any status-setting tap, a V182 wheel (`log_run_dist`, `log_run_pace`, `log_run_rep_time`; timer :13538, reset on every scroll so a coasting wheel is uncommitted until 90 ms after it stops) still inside its settle window is committed before `persistLogFields` reads the hidden inputs. The saved log at the moment of close is the log. RPE (`<input type="range">`, :13635) is synchronous, out of scope. Mechanism is builder's.
- Landing companion (Mario's call, recommended): on a Done or Skipped day the Today hero prints the status and its CTA reads OPEN SESSION (existing string) instead of START SESSION (:12042 reads no status). That line is the undo signpost.

## Does not change
Engine; HALF_MANNY digest. Toggle semantics and `releaseSeasonShown` (V181 D2). Pop-up precedence season > streak > workout, and copy. ‹ Back still does not save (Done does). Reminder pop-up. Footer layout (V183). `ia_hist_` first touch. No confirm dialog, no toast undo, no Partial. Rest days (no footer).

## Before / After
Before: Done → log saved → status → footer "Done ✓ tap to undo" → toast → pop-up over the open day → dismiss → still on the day → ‹ Back → This Week.
After: Done → wheels flushed → log saved → status → overlay closes, This Week re-rendered, DONE tile +1 → toast → pop-up over This Week → dismiss → This Week. Skip: same, no pop-up. Mark Done ✓: as Done. Undo: tap the day on This Week → "Done ✓ tap to undo" → stays on the day.

## Blast radius
UI only, every goal/focus/calendar/week: every training day's footer and the log nudge. Callers :13950, :14403-14412. Not touched: Wildcard (D64 path), `acceptSwapNudge` reopen, injury check-in pop (:15562), rest sheet. Gates: identity fuzz clean by construction; new gate scrolls a wheel, taps Done inside the window, reads `ia_logs_` for the settled value; a second asserts overlay closed and `popOverlay` shown after Done on the lattice (70/70 stays open today, so it must fail on V219).

**Recommendation:** Done, Skip and Mark Done ✓ close to This Week with the pop-up over the week, wheel flush as a hard requirement, hero status line as the undo signpost.
**Counter:** closing on Skip turns the small button's mis-tap into navigation, and Mario asked only for Done; if he wants Skip to stay put, the ruling holds with Skip removed from the closing set.

## MARIO DECISION (2026-09-24)
- Closing set: Done, Skip and Mark Done ✓ all close to This Week (coach recommendation accepted). Pop-up over This Week.
- Today hero companion: YES, show status and CTA reads OPEN SESSION on a Done/Skipped day.
- Measures pending before build: strip cell + hero print for a Done day; rest-timer float after close; toast under pop-up.
- Ship slot: HOLD with the batch; the whole queue re-baselines on current HEAD (V219+) first.

## AMENDMENT ON V220 (pending measures)

Coach (fresh spawn), 2026-09-24, on `tests/measure/v221_donenav_pending.out.txt` (V220, HEAD 8ee4385, HALF_MANNY, 224 strip/hero cases, one rest-timer sequence, 70 Done taps). Every premise of the ruling held from V219 to V220 (`v221_done_nav.js` identical bar line numbers). Each pending measure returned a case the ruling did not decide. Three amendments follow; the ruling's closing set, landing, pop-up sequence and no-confirm/no-toast-undo decisions are untouched.

Decisive reads: `popFire` (:17678) ends with an unconditional `classList.add('show')` and `fireCompletionPopup` (:17819) has no empty branch, so every Done through `handleDayStatus` raises a pop-up by construction. `ruResetIfIdle`'s comment (:13700) states "a running rest survives navigation; a cold open starts fresh", and `ruReset()` (:13699) exists. `renderWeekView` (:11977) ranks the cell centre complete ✓ > Wildcard mark > date, with no skipped branch; `resolveReminder` (:17834, V181 D3) is a second skipped writer that already lands on This Week, so a past-day Skip with no strip trace predates this ruling.

### (a) Hero status copy, and the past-day Skip that leaves no trace

**Finding.** After the close, the Today hero is the tapped day only when the tapped day is today (56/56 today, 0/56 past). It prints no status word in any of 224 cases; CTA START SESSION 224/224. A Done day gets a ✓ in its strip cell (112/112). A Skipped day's strip cell is byte-identical to an unmarked one (112/112). The DONE tile does not move on a skip, correctly. A Skip on a past day lands on a screen that says nothing happened. Same gap already exists through `resolveReminder`; this ruling widens it from one path to every Skip.

**Hero copy (recommended strings).** One line on the hero, printed when the day the hero shows carries a status, above the CTA.
- Done: `Done ✓ Closed out. Open the session to undo.`
- Skipped: `Skipped ✕ The week moves on. Open the session to undo.`
- CTA on either: `OPEN SESSION` (:12042, string exists). Pending: unchanged, `START SESSION` on today.
The line prints wherever the hero shows a training day with a status, today or browse (`heroKey` is the day either way; the browse CTA already reads OPEN SESSION). Siting inside the hero is the session's.

**Signpost claim narrows to today, and the strip carries the past day.** A past-day mark never reaches the hero (heroKey stays today 112/112, and it should). A past day's undo is found by reopening the day (footer "Done ✓ tap to undo" / "Skipped ✕ tap to undo"). Enough for Done (strip prints ✓), not for Skip (strip prints nothing).

**Strip mark for a skipped day: in scope, licensed by this ruling, recommended; MARIO'S CALL.** The strip is the week's ledger; the app already treats skipped as a different fact from pending (streak breaks on it :17774, reminder nags only pending past days, the record freezes the day). V181 removed the self-grade, not the record; "the week moves on" is the app's own line. Precedent for a non-check mark: V195 D64 ("a Wildcard is marked, never checked").
- Prints: `✕` (U+2715, the glyph footer and reminder already use) in `.wk-day-num`, in the cell's own number colour (dim on a past day, on-signal on today). Never signal orange, never the ✓ green.
- Precedence, one branch added after the Wildcard branch: complete ✓ > Wildcard mark > skipped ✕ > date (D71b: a Wildcard rescues a skipped day).
- Covers `resolveReminder`'s skips for free (strip reads status, not the writer).
Recommendation: ship in this build as its own slice. Counter: V181's no-shame stance; a ✕ on the week is the first place a skip is visible without opening the day. If declined, the rest of the amendment stands and a past-day Skip's trace is the toast plus reopen-the-day.

**Before / After.**
- Before: Skip on a past day → strip cell prints the date, hero today / START SESSION / no status, DONE tile unmoved (112/112). Done on today → strip ✓, hero START SESSION, no status word.
- After: Done on today → strip ✓ → hero `Today · Tuesday` / title / `Done ✓ Closed out. Open the session to undo.` / OPEN SESSION → DONE tile +1. Skip on today → strip ✕ → hero `Skipped ✕ The week moves on. Open the session to undo.` / OPEN SESSION → DONE tile unmoved. Done or Skip on a past day → that cell dimmed ✓ or dimmed ✕; hero stays on today, unchanged, START SESSION. Undo → cell back to the date, hero status line gone, CTA back to START SESSION on today.
- Measured, HALF_MANNY W1: `today/skipped tapped=tue today=tue: cell center "22", hero cta START SESSION, tile 0 /5 DONE` → after `cell center ✕, hero status "Skipped ✕ The week moves on. Open the session to undo.", cta OPEN SESSION, tile 0 /5 DONE`. `past/skipped tapped=mon today=tue: cell {"cls":"wk-day dim","center":"21"}` → after `{"cls":"wk-day dim","center":"✕"}`, hero unchanged.

**Gates.** (a1) Hero, lattice of today-days: after Done the hero contains the exact Done string and CTA `OPEN SESSION` with `is-today` retained; after Skip the Skipped string; after undo no status string and `START SESSION`. Must fail on V220. (a2) Past-day pin: after a past-day mark the hero is today, no status string, START SESSION (true on V220; negative control keyed to this ruling). (a3) Strip: after Skip, today or past, the tapped cell's `.wk-day-num` contains `✕` and no `.chk`; after Done `.chk`; after undo the date; a Wildcard plus skipped day prints `.wc-mark`. Must fail on V220. Sabotage: drop the skipped branch → a3 trips; revert the CTA condition → a1 trips.

### (b) A running rest timer on a status-setting close

**Finding.** `#restFloat` stays `display:block` after `closeDetail`; the same interval keeps ticking over This Week (0:11 → 0:23 in 12 s). Nothing on the close path touches `_ru*`. `updateRestFloat` (:13797) keys visibility on the screen, not the overlay.

**Ruling: stop and zero it; do not touch its visibility. Session's call.** Done means the session is closed; a rest clock running over This Week counts nothing and its orange running pill claims a live session. The `ruResetIfIdle` contract stands: ‹ Back and tab moves are navigation and a running rest survives them; Done, Skip and Mark Done ✓ end the session. Mechanism: `ruReset()` in the set branch of `handleDayStatus`, before the close. Skip: same. Mark Done ✓: same (no-op on an idle timer). Undo taps: untouched. Not changed: `updateRestFloat`, float siting, expanded card state, intro sequence, `ruResetIfIdle`. Counter: a mis-tapped Done now also costs the rest count; V181 D2 is about records, a rest clock is not one.

**Before / After.** Before: Done with timer at 0:11 → keeps running over This Week, 0:23 at +12 s, pill orange. After: Done with timer at 0:11 → `ruReset()` → float on This Week, idle, `0:00`, toggle reads Start → overlay closes → pop-up. ‹ Back / undo with a running timer: unchanged.

**Gates.** (b1) Start the timer, tap Done, Skip and Mark Done ✓ in turn: `_ruRunning===false`, `_ruId===null`, `_ruElapsed===0`, `#rtMini` reads `0:00`, `#rtToggle` reads Start, `#restFloat` display unchanged (`block` on screenWeek). Must fail on V220. (b2) Negative controls: undo tap and ‹ Back with a running timer leave `_ruRunning===true` and the same `_ruId`. Sabotage: remove the `ruReset()` call → b1 trips.

### (c) The Done toast under the pop-up

**Finding.** Pop-up fires on 70/70 Done taps by construction. The toast (z 999) is under the veil (z 2000) from the instant the pop-up opens and hides at +2200 ms while the pop-up is up, 70/70. The `Done ✓` toast is never readable. Skip fires no pop-up; its toast is readable.

**Ruling: on Done, no toast when a pop-up is showing; Skip keeps its toast. Session's call.** Form: fire the pop-up, then toast only if `popOverlay` is not showing (the guard encodes the reason, readability, and leaves Skip's toast untouched). No deferred toast on `popClose`. Not changed: pop-up precedence and copy; the `Unmarked` toast; `resolveReminder`'s toasts (its `Locked in ✓` under its own pop-up is pre-existing; §12 note, do not fix here).
Copy fix in passing (session's call, the line is edited anyway): `Skipped ✕ — the week moves on` (:14387) becomes `Skipped ✕ The week moves on`. Its twin in `resolveReminder` is parked for §12.

**Before / After.** Before: Done → toast `Done ✓` under the veil, unreadable 70/70 → pop-up → dismiss. After: Done → pop-up over This Week, no toast → dismiss → hero reads the status. Skip → toast `Skipped ✕ The week moves on` over This Week, no pop-up.

**Gates.** (c1) After Done on the lattice, `#toast` lacks `.show` at every tick through +2200 ms and `popOverlay` has `.show`; after Skip, `#toast.show` with the Skip label and `popOverlay` not shown. Must fail on V220. Sabotage: restore the Done toast → c1 trips.

### Blast radius of the amendment
UI only, every goal, focus, calendar and week: every training day's strip cell (new ✕ state), the Today and browse hero (status line, CTA condition), `handleDayStatus` set branch (`ruReset`, toast guard). Engine untouched, `HALF_MANNY` digest unchanged, identity fuzz clean by construction. Not touched: `resolveReminder`, `updateRestFloat`, `ruResetIfIdle`, `popClose`, pop-up copy, footer strings, streak and DONE tile logic, Wildcard mark.

**Recommendation:** ship all three: the two hero strings with OPEN SESSION, a dim ✕ on a skipped strip cell, `ruReset()` on every status-setting close, and no Done toast when the pop-up is up.
**Counter:** the ✕ is the one piece with a doctrine cost (V181's no-shame stance); if Mario declines it, the rest stands.

## MARIO DECISION ON THE AMENDMENT
- 2026-09-24, build-2 chat: SHIP the skipped-day ✕ on the strip (coach recommendation accepted). USE coach's two hero strings verbatim. Rest timer (b) and toast guard (c) are session calls, ruled as written. Version: V221.
