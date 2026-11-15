# The Expo screen's unit tests against a break of each of core's date readers

Written by `node tests/measure/native-this-week_readers-break.mjs <a copy of the tree>` (read-only here). Each
break is one edit to `core/src/engine/state-overlays.ts` in the copy, then `tests/unit/native-this-week.test.ts` run there.

- Unbroken: 46 tests, 0 red.
- **`weekOfDate`**, every date reads one week late: **3 red**.
  - overlays the week a date falls in
  - overlays the weeks an overlay covers: open ended runs to the program's end, and past the end is nothing
  - overlays the injury still open: not one that has ended, not a bridge back
- **`overlayWeekRange`**, no overlay covers any week: **3 red**.
  - overlays the weeks an overlay covers: open ended runs to the program's end, and past the end is nothing
  - overlays the injury still open: not one that has ended, not a bridge back
  - the launch what failed is counted and logged in the page's words: an overlay the engine cannot build, a config it cannot build
- **`_progDayDate`**, every program day reads one day late: **4 red**.
  - dates a program day's date counts from the Monday of the start's week
  - dates the days of week 1 before a midweek start are before the start (V174 D24)
  - dates days before the block opened are before the start too (V188 D14a)
  - the Wildcard and the streak the scheduled days are the training days up to the cutoff, oldest first
- **`dayOverlayInfo`**, no day says which overlay built it: **1 red**.
  - overlays a travel day is one built under a substitute overlay on anything but a commercial gym

**Every break turns a test red: 4 of 4.**
