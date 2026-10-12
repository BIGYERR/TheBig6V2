# Group 1: rest timer and rest sheet

Phase 2 parity record (`docs/test-migration.md`, the parity rule). The legacy gates stay in `tests/gates/` and keep
running in CI until phase 3 deletes the machinery; this file is what explains their rows when the manifest drops them.

- **Gates:** `g239_d233_island.js` (12 rows, D233 P-ISLAND) and the three D235 rows of `g0.239.1_timer_label.js`
  (its four D236 rows are group 2, `02-version-label.md`).
- **New tests:** `tests/integration/rest-timer.test.js` (21 tests: the 6 D235 tests from phase 1 and 15 for the
  stopwatch and the island), with the rig in `tests/support/rest-timer.js` (fake wall and performance clocks, a
  scheduler, a document that keeps its elements, the island plugin stub, a page load with the plugin present).
- **Rest sheet:** neither gate tests the rest sheet. Its rulings (D228 to D232) ship in v0.240.0, so
  `tests/integration/rest-sheet.test.js` is written with that release, not here.
- **Version predicates:** every row of both gates carries a version conjunct (REFUSED below its era). The new tests
  assert today's behaviour only, so that conjunct is dropped from each row; it was never a row of its own.

## Rows

| Gate | Row | Held by (`tests/integration/rest-timer.test.js` ›) |
|---|---|---|
| `g0.239.1_timer_label.js` | `D235-jitter` | "a jittery tap under 5 px writes neither top nor left, and the tab tap still expands"; "a jittery tap on the open card collapses it during the intro and does nothing outside it" (phase 1) |
| `g0.239.1_timer_label.js` | `D235-cancel` | "a drag past 5 px that ends in pointercancel docks to the nearer edge"; "a jitter that ends in pointercancel writes nothing and runs no tap action" (phase 1) |
| `g0.239.1_timer_label.js` | `D235-idlecancel` | "a cancel outside a drag never re-docks" (phase 1) |
| `g239_d233_island.js` | `D233-pwa` | "on the PWA the stopwatch follows performance.now, never the wall clock"; "on the PWA Done and a day open zero the stopwatch, and Home hides the tab while it keeps counting" |
| `g239_d233_island.js` | `D233-native-clock` | "inside the native app the stopwatch follows the wall clock, never performance.now" |
| `g239_d233_island.js` | `D233-start` | "Start tells the island run with the wall-clock time of the tap" |
| `g239_d233_island.js` | `D233-stop` | "Stop tells the island stop with the frozen elapsed time" |
| `g239_d233_island.js` | `D233-resume` | "Start after a Stop tells the island run with the start moved on by the pause" |
| `g239_d233_island.js` | `D233-reset` | "the reset button ends the island and zeroes the clock, running or stopped" |
| `g239_d233_island.js` | `D233-donestatus` | "Done and Skip end the island and zero the clock" |
| `g239_d233_island.js` | `D233-dayopen-stopped` | "opening a day on a stopped clock zeroes it and ends the island" |
| `g239_d233_island.js` | `D233-dayopen-running` | "opening a day on a running clock leaves it running and tells the island nothing" |
| `g239_d233_island.js` | `D233-hidden` | "Home and the wizard hide the tab and tell the island nothing while the clock keeps counting" |
| `g239_d233_island.js` | `D233-boot` | "a page load with the island plugin present ends the island and reaches Home" |
| `g239_d233_island.js` | `D233-throw` | "an island plugin that throws on every call never breaks the stopwatch or the page load" |

The gate's hand-oracle self-check and its rig setup are held by "the stopwatch hand values are self-consistent" and
"the rig starts on a training day at 10:00 with no plugin and a zeroed stopwatch".

**Totals:** 15 rows; 15 mapped, 0 dropped.

## Mutations

Every mutation naming either gate, applied once to a scratch copy of `index.html` (each anchor occurs exactly once),
with `IA_APP=<copy> node --test tests/integration/rest-timer.test.js`:

| Spec | Mutations | Caught |
|---|---|---|
| `tests/sabotage/v0.239.1.json` S1 to S3 (D235) | 3 | 3 |
| `tests/sabotage/v239_d233.json` S1 to S13 (D233) | 13 | 13 |

**16 of 16 caught.** S1 to S3 (D235) by the phase 1 tests named for each. For D233: S1 (the clock is always Date.now)
by both PWA tests; S2 and S3 (always performance.now; the clock choice cached at load) by the native clock test and six
more that read a wall-clock value; S4 to S12 by the island tests named for each seam; S13 (no try/catch around the
plugin) by the throwing plugin test.

## The release before each ruling

`IA_APP=<that body> node --test tests/integration/rest-timer.test.js`:
- **V239** (before D235): the four D235 tests for changed behaviour fail; "a cancel outside a drag never re-docks"
  passes there, as it guards behaviour D235 kept (a cancel with no drag only clears the flag), and the geometry
  self-check reads no app. Every stopwatch test passes (D233 shipped in V239).
- **V238** (before D233): every native island test fails (no plugin call, the clock on performance.now). The two PWA
  tests pass by design: D233 left the PWA's stopwatch as V238 had it, and mutation S1 shows they still discriminate.
