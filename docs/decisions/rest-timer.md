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
