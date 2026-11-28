# Rest timer: decisions

The floating rest timer: the tab and the card the athlete drags (`_rtWireDrag`, wired by `_rtInit`), and the rest
stopwatch. Tests: `tests/integration/rest-timer.test.ts`.

**D233 P-ISLAND (V239, Mario).** In the native iOS app the rest stopwatch runs on the wall clock and mirrors to an iOS
Live Activity; the PWA stopwatch is unchanged. Full ruling and amendments: handoff §11f and `tests/measure/v239_rulings/`.
Tests: the island and PWA clock tests in `tests/integration/rest-timer.test.ts` (moved from the legacy gate in phase 2).

## D235 P-TIMERDRAG: a tap never strands the timer, and a cancelled drag docks to an edge

- **Date:** 2026-10-11. **Ruled by:** Mario (not a coaching question). **Shipped:** v0.239.1 (PATCH).
- **Finding:** pointermove wrote `top` and `left` on every move, below the 5 px threshold too, so a tap with finger
  jitter stranded the timer mid-screen (reproduced at 375 px). pointercancel only cleared the drag, so a drag iOS
  cancelled was left where the finger was, never docked.
- **Changes:** below the 5 px threshold pointermove writes nothing, neither `top` nor `left`. pointercancel ends a drag
  the way pointerup does: it restores the snap transition and, when the drag moved, docks the timer to the nearer edge.
  A cancel never runs a tap action (no expand, no collapse). A cancel with no drag in flight only clears the flag.
- **Does not change:** the 5 px threshold; the tab tap expands and the card tap collapses during the intro; the
  touchmove guard; `_rtApplySide`; every other timer path; program output.
- **Expected values (hand geometry):** a 375 px frame, an 852 px window, a 40 x 60 anchor at top 300. Dragged to x 100
  and cancelled, it docks left at top 310 px; dragged from the left edge to x 300 and cancelled, it docks right at
  top 305 px.
- **Source:** `tests/measure/v0.239.1_rulings/v0.239.1_ruling_d235_d236.md`.

## D233 and D235 in the Expo app: the rest timer, without its Live Activity (Post-v0.262.4, the migration's phase 3, row 3)

- **Date:** 2026-11-17. **Ruled by:** no new ruling. The timer's words and behaviour are today's, so its rulings
  keep their D-codes (V221 D179: a status set stops it at zero, an open zeroes it while idle; V239 D233: the wall
  clock; D235: the drag). Part of the cut Mario took for row 3 ("Concur, build it",
  `docs/decisions/session-sheet.md`, the cardio sheet's entry). **Bump:** none.
- **The finding (`tests/measure/native-cardio-sheet_today.md`, section C):** the timer writes no key. Start, Stop,
  Reset, the idle reset and the card opened and folded leave the store as it was: the time, the side and the open
  card live in memory, and a launch starts at 0:00, folded, on the right. The app calls it in five places.
- **What is built** (`frontends/native/src/rest-timer/`): `rest-timer-model.ts`, a copy of today's held equal to the
  byte; `rest-clock.ts`, the Angular component's stopwatch half over that model; `RestTimer.tsx`, the tab on the
  edge with the time stacked, the card with Rest Timer, the readout, Start or Stop and Reset, a drag past 5 points
  that docks to the nearer edge, a tap on the tab that opens the card. It floats over This Week, Bugs, the deck and
  the day's sheet while a program is held. Mark the day done, Done and Skip stop it at zero; an open and each
  redraw of the day's sheet zero it while idle; an undo leaves it.
- **The clock is the wall clock,** as on today's iOS app, where the Live Activity is there to share it (D233). The
  Live Activity is phase 4's: until then a stand-in is told nothing (`NO_ISLAND`), and its presence keeps the clock
  the wall clock, so a rest counts through a locked phone.
- **Not built:** the Live Activity (phase 4); the first program's opening motion, which plays after the wizard
  generates a program and comes with the wizard; the card's nub; the glide when it docks (it docks at once). Motion
  is built once and judged on Mario's phone (`MIGRATION.md` section 6, decision 14).
- **Tests:** `tests/unit/native-cardio-sheet.test.ts`, the six rest timer tests (the clock, the wall clock, what a
  Live Activity is told, where it shows, who stops it, the screen), and the model's copy held to the byte. Of the
  147 breaks of `tests/measure/native-cardio-sheet_breaks.md`, 18 are of the timer's own three files, each red.
- **Seen on the simulator:** the tab on the right edge over This Week and over the sheet; the card opened, Start,
  the clock running (0:02, 0:05.16), Stop's outline; the card dragged to the left and docked there, still running.
- **Release:** Post-v0.262.4, no build of today's app; on the phone with the next IA Next build once merged.

## On Mario's phone, IA Next build 119 (2026-11-17)

- The timer was the fifth of five steps put to him (the tab, its card, Start, Stop, Reset, a drag to the other edge,
  stopped by Done). **His report:** "All good, also I'm good with taking out the rest timer entirely, we'll be shifting to the Dynamic Island later, keep it in the PWA though since we can't use Dynamic Island on that one". Nothing differed and no motion
  was named, so nothing was fixed from it (`docs/decisions/session-sheet.md`, the build 119 entry).

## D295 P-ISLANDONLY: the Expo app has no floating rest timer, and its rest timer comes back on the Dynamic Island

- **Date:** 2026-11-17. **Ruled by:** Mario, unasked, in his phone report on IA Next build 119: "I'm good with
  taking out the rest timer entirely, we'll be shifting to the Dynamic Island later, keep it in the PWA though since
  we can't use Dynamic Island on that one". **Bump:** none (the page and `ia-version` do not move).
- **The finding:** nothing measured. A product call, made on a timer that worked on his phone ("All good").
- **What changes, in the Expo app only:** the floating rest timer comes out: the tab on the edge, its card, Start,
  Stop and Reset, the drag, and the calls that stop or zero it (Mark the day done, Done, Skip, an open and a redraw
  of the day's sheet). Until phase 4 the Expo app has no rest timer. Phase 4 builds its rest timer on the Dynamic
  Island (the Live Activity), not as a floating tab.
- **What deliberately does not change:** the page, which is the PWA, keeps its floating timer and its stopwatch as
  they are, since a web page has no Dynamic Island; D233 and D235 stand there. Today's iOS app is not touched by this
  ruling: it stays as it is until cutover. No stored key (the timer never wrote one). What a program prescribes.
- **The session's reading, his to overrule:** "the rest timer" is the Expo app's floating timer, and it comes out in
  the session he said it in; "the PWA" is the page as Pages serves it.
- **Open for phase 4, not ruled:** what in the Expo app starts, stops and resets a rest once no floating tab is
  there. The Dynamic Island shows a rest that is running; something on a screen has to start it. Raised when phase 4
  is measured.
- **Amends:** "D233 and D235 in the Expo app" above, as far as it built the floating timer; `MIGRATION.md` section
  6, decision 15, and phase 4's entry gate.
- **Built the same session** (Progress's, `chat/progress`): `frontends/native/src/rest-timer/` is gone (the model's
  copy, the clock, the screen); `App.tsx` and `SessionSheet.tsx` name no timer (the clock, where it showed, and the
  five calls that stopped or zeroed it). Today's model and its test stay with today's app.
- **Tests:** `tests/unit/native-cardio-sheet.test.ts`, "native rest timer: there is none (D295 P-ISLANDONLY)": no
  file of it, and neither the app, the day's sheet nor the deck names one; the page's timer and today's model are
  still there. Its first test fails on the commit before (the folder is there). The timer's six tests and the
  model's copy check left that file with it, and its 25 breaks left `tests/measure/native-cardio-sheet_breaks.md`,
  run again whole: 122 breaks, none let through. One break of the session sheet's list named a line the removal
  changed (the sheet's Back) and was pointed at the line as it stands, its rule unchanged, and run again alone: red.
- **Seen on the simulator:** no tab on the edge of This Week, Progress or Bugs.
- **Release:** Post-v0.262.4, no build of today's app; on the phone with the next IA Next build once merged.

## On Mario's phone, IA Next build 120 (2026-11-18)

- D295 as built reached his phone with build 120. No rest timer on any tab was the last of eight things put to
  him. **His report:** "All good!" (`docs/decisions/progress.md`, the build 120 entry).

## D295 amended: the Expo app's rest timer waits until after the migration (2026-11-28)

- **Date:** 2026-11-28. **Ruled by:** Mario, in phase 4's first build session (`chat/rest-island`), which was to
  build the rest timer on the Dynamic Island. **Bump:** none. No new D-code: it moves when D295's last line is
  built and changes no behaviour of any app (`MIGRATION.md`, section 6 decision 19).
- **The finding (`tests/measure/native-rest-island_today.md`):** today three taps start, stop and reset a rest, all
  on the floating card; nothing a set does starts one, and in the beta a Log comes once a move, so no tap that is
  already there marks the end of a set. The island and the lock screen draw the rest and take no tap but the one
  that opens the app (D233 R5). And, seen on the simulator with a rest running in today's app: **iOS never shows
  an app's own Live Activity on the island while that app is in front.** The island was plain inside the app and
  showed the rest at once from the home screen.
- **D295's open call, as it went:** a mockup of the beta's deck with a rest button in three places was put to him,
  the session recommending beside Done. **His answer:** "i only want the timer on the dynamic island. nowhere else
  and it should be on the lock screen too". With the iOS rule above that means: no clock and no way to start a rest
  while the beta is open; Start, Stop and Reset as buttons on the lock screen and on the island held open (app
  intents, from iOS 17, which would amend D233 R5's display only), the rest put up ready when a session opens.
  Put to him with the mockup redrawn. He asked whether the island can show the timer while the app is open. It
  cannot. **His ruling:** the timer waits, "we will build it later after the migration".
- **What changes:** the last line of D295's "What changes" ("Phase 4 builds its rest timer on the Dynamic Island")
  no longer holds. The Expo app's rest timer is built after the migration, and phase 4 builds none of it:
  `IAIsland.swift`, `RestTimerAttributes.swift` and `RestTimerWidget.swift` stay with today's app, the beta's
  widget target stays empty, and `NSSupportsLiveActivities` is not set in the beta.
- **What deliberately does not change:** the rest of D295 (the beta has no floating rest timer); D233 and D235 on
  the page and in today's iOS app, which keep the floating timer and the island as they are; no stored key; what a
  program prescribes.
- **What follows, his to overrule:** the beta has no rest timer at cutover, so from cutover until it is built his
  phone has none. Phase 5 settles what becomes of the rest timer's tests when today's app goes.
- **Open for when it is built, not ruled:** what starts, stops and resets a rest. His word so far is the island
  and the lock screen and nowhere else; the iOS rule above stands against seeing it with the app open.
- **Tests:** none written or changed. **Release:** none; nothing built.
