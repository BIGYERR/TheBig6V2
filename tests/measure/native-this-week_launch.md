# This Week in the Expo app: the seam on core's launch, against the page's

Written by `node tests/measure/native-this-week_launch.ts` (read-only). The seam is not changed yet: this runs
`refreshStoredProgram` as `liveProgram` would call it, over the Expo app's SQLite store, beside today's page.

## 1. The standard history, the ten seeded programs

### 1a. Every launch the histories make, the seam over the keys as they stood before the page launched

- Launches: **114** (10 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **104 of 104**. Days that differ: **0 of 7854**, in the week holding today **0 of 728**.
- The seam wrote a key on **10** launches: `ia_edits_<id>` 10. Left as the page's own launch left the same key: **10 of 10**.
- Keys the page's launch changed and the seam did not: none.
- Through a store that drops every write, the grid is the writing store's on **104 of 104** launches.
- Failure reports the seam made: overlay 0, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 0.
- The seam's launch under Node, median: 5 ms (largest 26 ms). Hermes is timed on the simulator, apart from this.

### 1b. Every record (the 50 of native-this-week_reads.md), against a second phone launched on the same keys

- Launches: **50** (0 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **50 of 50**. Days that differ: **0 of 3745**, in the week holding today **0 of 350**.
- The seam wrote a key on **0** launches: none. Left as the page's own launch left the same key: **0 of 0**.
- Keys the page's launch changed and the seam did not: none.
- Through a store that drops every write, the grid is the writing store's on **50 of 50** launches.
- Failure reports the seam made: overlay 0, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 0.
- The seam's launch under Node, median: 10 ms (largest 27 ms). Hermes is timed on the simulator, apart from this.

### 1c. Every record, against the grid the page holds in session (what native-this-week_reads.md compared the stored grid to)

- Records: **50**. The whole program equal: **50 of 50**. Days that differ: **0 of 3745**, in the week holding today **0 of 350** (the stored grid: 806 of 3745, and 127 of 350).
- The control, so the zero above is read off an instrument that fires: the same comparison with the STORED grid in the seam's place counts **806 of 3745** days, in the week holding today **127 of 350**, whole on 0 of 50.

## 2. The backup corpus (17 backups), each loaded and launched on the day it was made

### Every backup

- Launches: **17** (0 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **17 of 17**. Days that differ: **0 of 1666**, in the week holding today **0 of 119**.
- The seam wrote a key on **0** launches: none. Left as the page's own launch left the same key: **0 of 0**.
- Keys the page's launch changed and the seam did not: none.
- Through a store that drops every write, the grid is the writing store's on **17 of 17** launches.
- Failure reports the seam made: overlay 0, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 0.
- The seam's launch under Node, median: 4 ms (largest 5 ms). Hermes is timed on the simulator, apart from this.

## 2b. The cases of tests/integration/stored-state.test.ts (25 tests: older and damaged programs, the dated pace test, a trip, swaps and edits laid back)

### Every launch those tests make, the seam over the keys as they stood before the page launched

- Launches: **192** (43 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **149 of 149**. Days that differ: **0 of 13880**, in the week holding today **0 of 1043**.
- The seam wrote a key on **8** launches: `ia_edits_<id>` 5, `ia_programs` 3. Left as the page's own launch left the same key: **8 of 8**.
- Keys the page's launch changed and the seam did not: `ia_exw_<id>` 1.
- Through a store that drops every write, the grid is the writing store's on **149 of 149** launches.
- Failure reports the seam made: overlay 1, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 1.
- The seam's launch under Node, median: 4 ms (largest 21 ms). Hermes is timed on the simulator, apart from this.

### Every record, against a second phone launched on the same keys

- Launches: **78** (0 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **78 of 78**. Days that differ: **0 of 7153**, in the week holding today **0 of 546**.
- The seam wrote a key on **1** launches: `ia_programs` 1. Left as the page's own launch left the same key: **1 of 1**.
- Keys the page's launch changed and the seam did not: none.
- Through a store that drops every write, the grid is the writing store's on **78 of 78** launches.
- Failure reports the seam made: overlay 1, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 1.
- The seam's launch under Node, median: 5 ms (largest 21 ms). Hermes is timed on the simulator, apart from this.

- The page's own launch stopped on 2 of those second phones (a stored config whose sports are not a list: its program list throws, the finding not yet ruled), so the seam was not compared there; the seam itself threw on 0.
- Every record, against the grid the page holds in session: whole on **79 of 80**, days that differ **1 of 7279** (a day's swaps and edits made and undone before the next launch, and th record 41 at 2026-08-31T18:00:00: 1 of 98 days differ [w1_mon seam title "Posterior Chain" moved [null,null] session title "Posterior Chain" moved [null,null]]). Where it differs, the second phone above shows the page's own next launch is the seam's grid: the difference is between the page in session and the page relaunched.
- The control there: the stored grid differs from the session's on 1151 of 7384 days.

## 3. A phone's own backup (the file is not in the repo; nothing of its values is printed)

Saved by version 0.262.1, 36 keys, launched at 2026-11-14T19:05:00.

### The active program

- Launches: **1** (0 with no program on either side, 0 where the page holds a program and the seam none).
- The whole program equal, every field: **1 of 1**. Days that differ: **0 of 98**, in the week holding today **0 of 7**.
- The seam wrote a key on **0** launches: none. Left as the page's own launch left the same key: **0 of 0**.
- Keys the page's launch changed and the seam did not: none.
- Through a store that drops every write, the grid is the writing store's on **1 of 1** launches.
- Failure reports the seam made: overlay 0, freeze 0, rebuild 0. The page's toast "A plan change failed to apply. Flag it in Bugs.": 0.
- The seam's launch under Node, median: 5 ms (largest 5 ms). Hermes is timed on the simulator, apart from this.

- The active program: 14 weeks, week 12 today, its config holds its seed, `_testWeek` not set, 0 overlays stored (0 distinct kinds, so at most 0 variant builds beside the rebuild).
- The seam writes no key on this data today.
- The launch under Node, ten runs: median 4 ms.
- Its keys by family: `ia_active` 1, `ia_comp_<id>` 3, `ia_edits_<id>` 3, `ia_exw_<id>` 3, `ia_hist_<id>` 3, `ia_logs_<id>` 3, `ia_parts_<id>` 1, `ia_pop_<id>` 6, `ia_programs` 1, `ia_remind_<id>` 3, `ia_reminded_<id>` 3, `ia_swapct_<id>` 3, `ia_swaps_<id>` 3.

### The same backup opened later, never saved again (the beta's copy as the weeks pass)

| Opened | Week | Grid the page's | The seam writes |
|---|---|---|---|
| today | 12 | yes, whole | none |
| in 1 days | 12 | yes, whole | none |
| in 2 days | 13 | yes, whole | none |
| in 7 days | 13 | yes, whole | none |
| in 14 days | 14 | yes, whole | none |
| in 21 days | 14 | yes, whole | none |
| in 28 days | 14 | yes, whole | none |

## 4. The launch under Hermes (the iOS simulator, iPhone 17 Pro, iOS 26.5, the Release build of the Expo app)

Timed by a probe added to the app for this measure and never committed: at start it read the active program from
the app's own SQLite store and called `refreshStoredProgram` through a store that drops writes, seven times, on
`performance.now()`, then one plain `buildProgram` of the same config. The store held a copy of the phone's backup
of section 3 (36 keys, three programs, the active one 14 weeks with no overlay), written into the simulator's
database file with `node:sqlite`.

- Reading `ia_active` and `ia_programs` (three stored grids parsed): 1.7 to 3.1 ms.
- The launch: **54.3 to 57.6 ms** over seven runs (57.6, 56.1, 54.8, 55.1, 56.0, 54.3, 56.0), no failure reported.
- One `buildProgram` of the same config: 52.6 to 55.1 ms. So the rebuild is the launch; the freeze, the reads of
  the other keys and the moves, swaps and edits laid back are 1 to 4 ms of it.
- The corpus backup of v0.261.0 (one program) read the same: launch 51.8 to 58.2 ms, build 51.2 to 52.3 ms.
- No overlay is stored on that program, so no variant was built. Each distinct overlay kind in range adds one more
  build, about 53 ms here. The engine check ran about 1.5 times faster on the phone than on this simulator (106 ms
  a build against 155 ms, docs/decisions/engine-check.md), which is not a timing of this launch on the phone.

