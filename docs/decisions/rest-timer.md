# Rest timer: decisions

The floating rest timer: the tab and the card the athlete drags (`_rtWireDrag`, wired by `_rtInit`), and the rest
stopwatch. Tests: `tests/integration/rest-timer.test.js`.

**D233 P-ISLAND (V239, Mario).** In the native iOS app the rest stopwatch runs on the wall clock and mirrors to an iOS
Live Activity; the PWA stopwatch is unchanged. Full ruling and amendments: handoff §11f and `tests/measure/v239_rulings/`.
Tests: the island and PWA clock tests in `tests/integration/rest-timer.test.js` (moved from the legacy gate in phase 2).

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
