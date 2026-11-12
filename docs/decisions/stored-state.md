# Stored state: decisions

Everything the app keeps under its `ia_` keys (programs and their grid, logs, history, completion, parts, lift
weights, swaps, edits, moves, overlays, pop-up picks, the theme), and the logic that reads and writes it. This logic
is moving out of the legacy page into `@ia/core`, a slice a release, as phase 1 of the move to React Native
(`MIGRATION.md`). Tests: `tests/unit/stored-state.test.ts`, `tests/integration/stored-state.test.ts`,
`tests/sweeps/stored-state.test.ts`, `tests/sweeps/data-backup.test.ts`.

## The rule for every slice: the golden records come out the same, to the byte (Post-v0.261.1)

- **Date:** 2026-11-11. **Ruled by:** Mario (`MIGRATION.md`, his six constraints and his GO for phase 1); the form is the
  session's.
- **The records.** `tests/support/stored-state.ts` drives whole histories through the page by the app's own entry
  points and holds every `ia_` key by size and sha256, with the grid in hand: HALF_MANNY and 12 hostile cases
  (integration), the 10 seeded programs, three time zones and 24 lattice configs (sweeps), and a backup written by each
  of the 17 tagged releases since v0.253.0, each loaded on the page under test.
- **What a slice may change:** where code lives and how it is reached. **What it may not change:** one byte of any
  record, any other test's result, the engine's output, anything the athlete sees.
- **Proof of a slice:** the three stored-state files and the backup corpus green with no golden file touched; the
  60-second check; `tests/measure/stored-state_red-on-break.mjs` still red on every break (its break texts follow the
  code when a slice rewrites the line they name).
- **A defect a record holds is held, not fixed, by a slice.** One is known: every Monday after the clocks go forward
  reads as the week before (`MIGRATION.md`, decision 12). Its fix is its own ruling and regenerates that record.

## Release scope: v0.261.2 puts every storage call behind one store

- **Date:** 2026-11-11. **Ruled by:** Mario ("GO" for the first lift slice); **bump:** PATCH, by his standing rule for
  migration steps that change the page and no behaviour (2026-10-12). **Shipped:** v0.261.2.
- **The finding (`tests/measure/rn-migration_inventory.md`, v0.261.1):** 59 direct `localStorage` calls in 8 legacy
  files (29 reads, 22 writes, 6 removes, and the backup's scan by `length` and `key(i)`), none in the engine, the rest
  of core or the Angular screens. React Native has no `localStorage`, so every one has to go through something a
  phone store can stand behind.
- **What changes:**
  1. `core/src/engine/state-store.ts`: the `StateStore` interface (`get`, `set`, `remove`, `keys`: string keys, string
     values, synchronous) and its two makers. `storageStore(source)` stands on anything shaped like the browser's
     storage and asks `source()` for it at every call, so a page whose storage is swapped or patched after launch is
     followed. `memoryStore(seed)` is a plain map for tests and, later, for core's own tests of the lifted logic.
  2. `storage.ts` makes the page's one store, `iaStore`, over `localStorage`. Every direct call in the 8 files
     becomes `iaStore.get`, `.set` or `.remove`; the backup's scan becomes `iaStore.keys()`.
  3. `storage.ts` moves to the front of the page's script, after the store's file and before `theme.ts`, which reads
     the theme at load.
- **Sited in `core/src/engine` for now.** It is the one core folder today's page build reads (`build-index`,
  `module-blocks`, `legacy-bundle`, the dev watcher and three more tools are keyed to it). The lifted logic takes the
  prefix `state-` there and moves to `core/src/app-state/` at cutover, when the page build is deleted and a folder
  move is only a change of imports. The engine's own 17 files are not touched. Rejected: teaching six tools a second
  folder now, a tooling pass of its own that the page's remaining life does not repay.
- **What deliberately does not change:** every key, every value, the order keys are scanned in (storage order, as
  before), which errors are caught and which are thrown (a refused write still throws from `set` to the same callers),
  and every function's name and arguments. No golden file moves.
- **Expected values (typed from the ruling):** a memory store returns null for a key never set, the string set for one
  that was, and null again after `remove`; `set` stores `String(value)`; `keys()` lists keys in the order first set; a
  seed is copied, not kept. A storage store reads, writes and removes on the object `source()` returns at that call,
  lists `key(0)` to `key(length - 1)` skipping a null, and lets a throwing `setItem` throw. The page's script names
  `localStorage` once outside comments, where `iaStore` is made.
- **Tests:** `tests/unit/stored-state.test.ts` (the two makers from `@ia/core/engine`; the page's one mention). The
  golden records and the backup corpus, unchanged.

## Release scope: v0.261.3 moves the lift log into core

- **Date:** 2026-11-11. **Ruled by:** Mario ("go" for the second slice); **bump:** PATCH, by his standing rule for
  migration steps that change the page and no behaviour. **Shipped:** v0.261.3.
- **Scope, narrowed from "`log-entries.ts` and the set logging rules":** this slice takes the half of
  `log-entries.ts` that is stored data, the lift log under `ia_exw_`. The file's other half (the cardio dose and its
  form) and `set-logging.ts`'s display rules read the page, the clock and names that are not in core yet; each is its
  own slice.
- **The finding (read on v0.261.2):** the lift log is read and written in four places that build the same key and
  parse the same way (`getExWeights` and `saveExWeights` in `log-entries.ts`, `getExWeightsFor` and
  `saveExWeightsFor` in `storage.ts`). `logExerciseWeight` holds the rule for recording a lift (one entry per week and
  day, the later log replacing the earlier, a year of weeks kept) inside a function that also reads three page
  globals, snapshots the day and saves. `entryDay`, `weeklyBest` and `dedupeExDayEntries` are pure and are called by
  7 legacy files and 4 Angular screens.
- **What changes:** `core/src/engine/state-lift-log.ts`:
  1. `readLiftLog(store, programId)` and `writeLiftLog(store, programId, log)`: the one reader and the one writer of
     `ia_exw_<program>`. The four legacy functions keep their names and call them with `iaStore`.
  2. `recordLift(log, lift)`: the rule out of `logExerciseWeight`, on a log in hand, with the week, the day and the
     instant passed in. `logExerciseWeight` keeps its guards, resolves the week and the day from the page as before,
     snapshots the day, calls it and saves, in the order it always did.
  3. `entryDay`, `weeklyBest` and `dedupeExDayEntries` move as they are, typed.
- **What deliberately does not change:** the key, the stored shape, the order of an entry's fields, which entry wins,
  the 52 week trim, the instant an entry carries (one `Date.now()` per log), every function name the Angular screens
  call through the bridge, and every golden record.
- **Expected values (typed from the ruling):** an empty or broken `ia_exw_p1` reads as `{}`; a written log reads back
  equal and is stored as its `JSON.stringify`. A first lift makes the row `{name, entries: [{weight, setsReps,
  setsDone, setsW, week, day, ts}]}` under `exStoreKey(name)`, fields in that order. A second log of the same week and
  day replaces weight, setsReps and ts, keeps the earlier sets when it brings none, and adds no entry; another day of
  the week adds one. An entry of week 60 drops every entry of week 8 or earlier (more than 52 weeks behind it) and
  keeps week 9. `entryDay` gives the entry's `day`, else the weekday of its `ts`, else `''`. `weeklyBest` keeps the
  heaviest entry of each week, the later of two equal ones, in week order. `dedupeExDayEntries` keeps the latest entry
  of each week and day and says whether it changed anything.
- **Tests:** `tests/unit/stored-state.test.ts` (the functions from `@ia/core`, on a memory store). The golden records
  and the backup corpus, unchanged.

## Release scope: v0.261.4 moves the day's log, completion and parts into core

- **Date:** 2026-11-11. **Ruled by:** Mario (the third slice, on his prompt); **bump:** PATCH, by his standing rule for
  migration steps that change the page and no behaviour. **Shipped:** v0.261.4.
- **The finding (`tests/measure/stored-state_day-log-callers.md`, read on v0.261.3):** `ia_logs_`, `ia_comp_` and
  `ia_parts_` are read and written by 14 functions in `storage.ts`, each naming the page's `activeProgId`, and the rules
  for what a tap stores sit in `day-status.ts` and `popups-streaks-reminders.ts` between calls that draw. Those
  functions are called from 12 legacy files and, by name through the bridge, from 8 Angular files; none is taken over
  by Angular (`provide`). `logKey` and `completedKey` build the same key. A status record is written in four places
  (`markDayComplete`, `handleDayStatus`, `resolveReminder`, `settleParts`). `toggleComplete` has no caller.
- **What changes:** two files in `core/src/engine`.
  1. `state-day-log.ts`, the day's log (`ia_logs_<program>`): `dayStoreKey(week, day)`, the one key of every store
     keyed by day; `restNorm` and `restNormAll`, the read lens, as they are; `readDayLogs` and `writeDayLogs`, the one
     reader (through the lens, the lens outside the parse's catch) and the one writer; the set drafts, `setDraftOf`,
     `recordSetDraft` and `dropSetDraft`; `CARDIO_PARK_FIELDS`, the fields of an entry by sport, moved from
     `log-entries.ts`; and `runPartLogged`, the test for a logged run.
  2. `state-day-status.ts`, completion and parts (`ia_comp_<program>`, `ia_parts_<program>`): a reader and a writer
     for each; `dayStatus`, the status a record reads as; `setDayStatus` and `clearDayStatus`, the one writer and the
     one remover of a status set by hand; `partsOfDay`, `settleDayParts`, `skipDayPart` and `clearDayParts`, the rules
     of D284 on the day's grid entry passed in.
  3. The page's functions keep their names and arguments and call these with `iaStore`, the active program, the
     page's week and day and `Date.now()`: the 14 in `storage.ts`; `markDayComplete`, `handleDayStatus`, `dayPartsOf`,
     `partRunLogged`, `settleParts`, `skipPart` and `clearPartSkips` in `day-status.ts`; `statusOf` and
     `resolveReminder` in `popups-streaks-reminders.ts`. Each keeps its guards, its `snapshotDay` and its drawing, in
     the order it had. Where a return type was loose it stays loose (`any`): the Angular screens read these through
     the bridge's generated types.
- **Narrowed, and why.** These stay in the page and call the thin readers and writers: `persistLogFields` (it reads the
  log form and the dose; it moves with the cardio dose, the half of `log-entries.ts` the second slice left),
  `setCardioSwap`'s parking and `cardioEntryLive` (the same form), the rest day's log in `rest-day-shell.ts` (its
  sheet's draft), and `toggleComplete` (no caller: it is not lifted, and goes with the page). The freeze's own read of
  `ia_comp_` and `ia_logs_` and the purge (`program-manage.ts`) are the freeze slice's, after 2026-12-06.
- **What deliberately does not change:** every key and every stored byte; the order of an entry's and a record's
  fields; the order stores are read and written in within a tap, and so the order keys are first created (a backup
  lists keys in that order); `snapshotDay` before the first write of a touch; which read is caught (a broken value
  reads as empty) and which write throws; a title stored as given by `markDayComplete` and as `title || null` by the
  sheet and the reminder; every function name the Angular screens call. One thing moves that no record can show: a
  rule's instant is read once, by the page, before the rule runs, where `settleParts` read the clock at its write.
  It is the same tap's clock.
- **The open break (history, first touch) is not touched:** `snapshotDay` is history, the next slice's.
- **Expected values (typed from the ruling):** `dayStoreKey(3, 'mon')` is `w3_mon`. An empty or broken `ia_logs_p1`
  reads as `{}`; a written log is stored as its `JSON.stringify` and reads back equal; a V237 rest entry
  `{rest_cardio: true, rest_type: 'run', rest_mins: '20', rpe: '4', run_dist: '2', notes: 'easy', week: 2, ts: 5}` reads
  as `{restLog: {run: {mins: 20, dist: 2, rpe: 4}}, notes: 'easy', week: 2, ts: 5}`, and the read writes nothing. A first
  draft makes the entry `{week, sets: {<key>: {r, w, L}}, ts}`, fields in that order; a draft on an entry in hand keeps
  its other fields and restamps `week` and `ts`; dropping the last draft removes `sets` and leaves the rest; dropping a
  draft that is not there writes nothing. `runPartLogged` is true for a run field holding a value, false for `''`,
  `0` and `'0'`, and reads the sport from `swapTo` before the plan's. A status set by hand is stored as
  `{title, ts, status}`; a record with no status and a `partial` one read as `complete`, none as `null`. A day's parts
  are `run` when its cardio has a type and `lift` when a section holds an item, none on a rest day. Skipping one part
  of two stores `{run: 1}` under the day in `ia_parts_` and no completion; skipping both stores
  `{title, ts, status: 'skipped', parts: 1}`; putting one back removes that record; the run skipped is the lift left,
  which only a status by hand completes; the lift skipped and the run logged stores `status: 'complete', parts: 1`; a
  status set by hand is never settled over; a day skipped whole turns into both parts skipped when one is put back.
  Clearing a day's parts removes its key and writes nothing when there was none.
- **Tests:** `tests/unit/stored-state.test.ts` (the functions from `@ia/core`, on a memory store, and the page's
  callers). The golden records and the backup corpus, unchanged.
- **Found by the break check, not fixed here:** a break inside `settleDayParts` (the parts never write a completion)
  changes no golden record, because no history lets a day's parts write one. `tests/integration/skip-pill.test.ts`
  goes red on it (4 of 9) and the unit tests above type those records by hand, so the rule is held; the records do not
  hold it. A history that skips the lift and logs the run adds a golden record, so it is a tests pass of its own
  (`tests/measure/stored-state_red-on-break.md`).

## The records hold a completion a day's parts wrote (Post-v0.261.4, tests only)

- **Date:** 2026-11-11. **Ruled by:** Mario (he concurred with closing the gap in a tests pass before the history
  slice). No build: `ia-version` stays 0.261.4.
- **The finding:** the entry above. A break inside `settleDayParts` changed no golden record, because no history let a
  day's parts write a completion.
- **What changes:** `tests/integration/stored-state.test.ts` gains the case "a day's parts settle its status" on
  HALF_MANNY's week 1, whose Monday and Tuesday each carry a run and a lift. Monday's lift is skipped and its run
  logged; both of Tuesday's parts are skipped; then Tuesday's run is put back and Monday's run cleared. Its two records
  (`closed`, `reopened`) are new in `tests/snapshots/stored-state.json`: 154 lines added, none removed or changed.
- **What does not change:** the standard history (`life`), so every other golden file and the backup corpus; the page;
  the app.
- **Expected values, typed by hand from D284 (`docs/decisions/this-week.md`):** one part of two skipped writes
  no completion; the lift skipped and the run logged stores `status: 'complete', parts: 1`; both parts skipped stores
  `status: 'skipped', parts: 1` and `{run: 1, lift: 1}` under the day; with the run put back and the logged run cleared
  both completions are gone and each day keeps `{lift: 1}`.
- **Proof:** the break "parts settle" (the parts never write a completion) now turns this file red, and it moved from
  the open list to the breaks that must be red: 14 red, 2 open (`tests/measure/stored-state_red-on-break.md`).

## Release scope: v0.261.5 moves the day history into core

- **Date:** 2026-11-11. **Ruled by:** Mario (the fourth slice, on his prompt); **bump:** PATCH, by his standing rule for
  migration steps that change the page and no behaviour. **Shipped:** v0.261.5.
- **The finding (`tests/measure/stored-state_history-callers.md`, read on v0.261.4):** `ia_hist_` is read and written
  by five functions in `storage.ts`, each naming the page's `activeProgId` and, for the two that snapshot, `activeProg`.
  `getDayHist` and `getDayHistFor` are the same read. `snapshotDay` is called 8 times from 4 legacy files and once by
  the Angular deck through the bridge; `resnapshotDayEdit` 3 times from `swap-sheet.ts`; `getDayHist` by
  `set-logging.ts` and the mile nudge; `getDayHistFor` by `progress-data.ts`, the lift ledger and the Progress screen;
  `saveDayHist` by the two snapshot functions and nothing else. None is taken over by Angular (`provide`). The freeze
  reads the key itself, twice, and the purge names it once (`program-manage.ts`).
- **What changes:** one file in `core/src/engine`, `state-day-history.ts`, the day history (`ia_hist_<program>`).
  1. `readDayHistory(store, programId)` and `writeDayHistory(store, programId, history)`: the one reader (a missing or
     broken value reads as empty) and the one writer (a refused write is swallowed, as `saveDayHist` swallowed it:
     the log that follows must still land).
  2. `recordDaySnapshot(store, programId, week, dayKey, day)`: the first touch. The day's grid entry, copied whole,
     under `dayStoreKey(week, dayKey)`; nothing when there is no day, nothing when the day already has a snapshot.
  3. `refreshDaySnapshot(store, programId, week, dayKey, day)`: the athlete's own edit after the first touch. It
     replaces the day's snapshot with the day in hand, and writes nothing when the day has none.
  4. The page's five functions keep their names and arguments and call these with `iaStore`, the active program and
     `activeProg.weeks[week][dayKey]`. `snapshotDay` and `resnapshotDayEdit` keep their guards on the page's globals
     and their `catch`, which logs and goes on. `getDayHist` and `getDayHistFor` stay loose (`any`): the Angular
     screens read them through the bridge's generated types. `saveDayHist` has no caller left and stays as a thin
     caller: it goes with the page.
- **Not narrowed.** The prompt's scope is the whole slice: five functions, one file. Their callers are not rewritten,
  because each already calls the page's function by name, and those names stay.
- **What deliberately does not change:** the key and every stored byte; first touch wins; the copy is a JSON round
  trip of the day as rendered; a broken value reads as empty and a refused write is swallowed; the order of the read
  and the write inside a touch, and the snapshot before the first write of a touch (the callers' order, untouched);
  the freeze's own reads of `ia_hist_` and the purge (`program-manage.ts`, the freeze slice's, after 2026-12-06);
  every function name the Angular screens call; every golden record.
- **The open break, settled (history, first touch: a day's snapshot overwritten on every touch changes no record).**
  The guard decides what is stored only when `snapshotDay` is called on a day that has a snapshot while the day in
  hand differs from it. Measured, that call does not happen:
  - *Read from the code.* A launch gives every snapshotted day back from its snapshot (the freeze's first rule, in
    every week below the cut, and the cut sits above every snapshotted week). The athlete's edits (swap, undo, add,
    skip, put back, remove) fold into the snapshot as they are made (`resnapshotDayEdit`). The sport swap writes the
    log, not the day. An injury, travel, the swap nudge and a program edit all go through `refreshProgram`. One tap
    changes a snapshotted day and leaves its snapshot alone: the rest sheet's Move.
  - *The Move, measured (`tests/measure/stored-state_first-touch.ts`, its `.md`).* `restMoveCandidates` offers a day
    with no completion and no logged field, and a logged lift, a set draft and a part skipped alone are none of those,
    though each snapshots the day. On HALF_MANNY's week 1, Monday with one lift logged is offered on Wednesday. After
    the move Monday in hand is a moved rest day and its snapshot is still the session. Nothing that snapshots can
    reach a moved rest day (its sheet offers cardio only, it has no parts, the reminder asks about training days
    only), so the changed day is never snapshotted again. The same history on a page with the guard removed stores
    the same bytes.
  - *The suite on an instrumented page* (a copy of v0.261.4's page whose `snapshotDay` throws when called on a
    snapshotted day that has changed; the copy that throws on every repeat touch turns 14 of the 15 integration
    tests red, so the signal arrives): all 119 unit, integration and sweep files, 1,863 tests, none red.
  - *Random histories (`tests/measure/stored-state_first-touch-walks.ts`, its `.md`):* 180 histories of 60 taps over
    9 of the 10 seeded programs (the wizard refuses the tenth, the swim 500 config, as `MIGRATION.md` section 7
    notes), 10,800 taps: 5,711 calls of `snapshotDay`, 4,481 of them on a day that already had a snapshot, **0** of
    those with the day in hand changed. A tap left a snapshotted day different from its snapshot 840 times, every
    one a rest day its session was moved away from.
  - **So the break stays open, as a guard no reachable history exercises**, and its note now says why. The first
    touch rule is held by the new unit tests, typed by hand. Not covered by this answer: the freeze's own gaps (a
    snapshotted week the stored grid does not hold is skipped by the freeze, `if(!prog.weeks[w]) continue`), which
    is the freeze slice's to measure.
- **Found by the break check, and closed here:** a re-snapshot that does nothing changed no golden record, because
  no history edited a day after its first touch (the standard history swaps, skips and adds before the day is
  logged). The new case "a touched day edited, then its session moved" puts an edit after the first touch in the
  records, and the break "edit re-snapshot" is red on it.
- **Found, not fixed (today's app, not this move):** a session moved off a day that already has a snapshot comes
  back on that day once the day it moved to is trained. Each of the two days then has a snapshot, a launch restores
  both, and the move is read as already applied, so the session shows on both days: the old day as an open session
  with its logged lift, the new day as trained. Nothing stored is lost or rewritten. It starts from the rest sheet
  offering a day that has a logged lift (D219 item 2 counted the log's own fields only). The new case holds today's
  bytes; the fix is its own ruling, and it touches the freeze and the move (`MIGRATION.md`, section 7).
- **Expected values (typed from the ruling):** an empty or broken `ia_hist_p1` reads as `{}`; a written history is
  stored as its `JSON.stringify` and reads back equal; a store that refuses the write stops nothing. A first touch
  of Monday in week 1 stores `{"w1_mon":<the day>}`; the stored copy does not follow a later change to the day; a
  second touch of a changed day writes nothing; another day adds its key after the first; another program has its
  own key; no day writes nothing. An edit's re-snapshot replaces that day's copy and leaves the other days; with no
  snapshot it writes nothing. In the page: `snapshotDay` with no active program, week 0, an empty day or a day the
  week does not hold writes nothing; a stored `null` is logged and goes on.
- **Tests:** `tests/unit/stored-state.test.ts` (the functions from `@ia/core`, on a memory store, and the page's
  callers); `tests/integration/stored-state.test.ts`, the new case, whose two records are new in
  `tests/snapshots/stored-state.json` and change none. The other golden records and the backup corpus, unchanged.

## Release scope: v0.261.6 moves the swaps, the swap counts, the day edits and the rest of storage.ts into core

- **Date:** 2026-11-11. **Ruled by:** Mario (the fifth slice, on his prompt); **bump:** PATCH, named in that prompt, by
  his standing rule for migration steps that change the page and no behaviour. **Shipped:** v0.261.6.
- **The finding (`tests/measure/stored-state_swaps-edits-callers.md`, read on v0.261.5):** `ia_swaps_`, `ia_swapct_`
  and `ia_edits_` are read and written by `swaps-edits.ts` alone: three key builders, three readers, three writers,
  `_editEntry`, and the rules `recordSwap`, `clearSwap`, `bumpSwapCount` (with `SWAP_NUDGE_AT`), `markSwapOffered`,
  `recordSkip`, `clearSkip`, `recordAdd`, `clearAdd` and `pruneDayEdits`. Their callers: `swap-sheet.ts` (the swap, its
  undo, the count, the skips and the adds), `day-status.ts` (the nudge's two answers) and `refreshProgram`
  (`getSwaps`, `getDayEdits`, `pruneDayEdits`). No Angular file names one: the Angular swap sheet reaches them through
  the page's `applySwapChoice`. What is left of `storage.ts`: `getPrograms` (12 legacy files, 7 Angular),
  `savePrograms` (7, 2), `getActiveProgId` (3, 1), `setActiveProgId` (1), `getWildcardDone` and `saveWildcardDone`
  (`random-wildcard.ts` and the Angular Wildcard screen). None is taken over by Angular (`provide`). `saveDayHist` has
  no caller.
- **The records were blind to most of it (`tests/measure/stored-state_swaps-edits-gaps.md`, a break per rule on
  v0.261.5's page):** 8 of 12 green. The next launch freezes a touched week and prunes its edits, so the standard
  history's skip and add are gone from `ia_edits_` before any record is taken; no history undid a swap, ran one pair
  three times, or swapped a pair again while its record stood.
- **What changes:** three files in `core/src/engine`, code as it was, with the store, the program, the week, the day
  and the instant passed in.
  1. `state-swaps.ts`: `readSwaps` and `writeSwaps`, `readSwapCounts` and `writeSwapCounts` (a missing or broken value
     reads as empty, a refused write is swallowed, as before); `addSwapRecord`, the swap tapped, with its undo places
     and the merge of a pair swapped again (V221 D177 R4); `dropSwapRecord`, the undo; `SWAP_NUDGE_AT`, `countSwap`
     and `markSwapNudged`, the nudge.
  2. `state-day-edits.ts`: `readDayEdits` and `writeDayEdits` (as the swaps); `dayEditEntry`; `addSkipEdit`,
     `dropSkipEdit`, `addAddEdit` and `dropAddEdit`; `pruneDayEditsBefore`, the prune below the freeze cut.
  3. `state-programs.ts`: `readPrograms` and `writePrograms`, `readActiveProgramId` and `writeActiveProgramId`,
     `readWildcardDone` and `writeWildcardDone` (a missing or broken value reads as empty; a refused write throws to
     the caller, as before).
  4. The page's functions keep their names and arguments and call these with `iaStore`: `getSwaps`, `recordSwap`,
     `clearSwap`, `bumpSwapCount`, `markSwapOffered`, `getDayEdits`, `recordSkip`, `clearSkip`, `recordAdd`,
     `clearAdd` and `pruneDayEdits` in `swaps-edits.ts`; the six in `storage.ts`, the last two with the page's
     `activeProgId`. `recordSwap` and `recordAdd` pass `Date.now()`. Return types stay loose (`any`) where they were.
  5. **Deleted with the move, each with no caller left** (legacy, Angular through the bridge, tests): `saveSwaps`,
     `getSwapCounts`, `saveSwapCounts`, `saveDayEdits`, `swapStoreKey`, `swapCountKey`, `editStoreKey`, `_editEntry`,
     and `saveDayHist`, which v0.261.5 left (phase 1, step 3).
  6. `tests/harness.js` lists the new readers and writers (and `writeDayHistory`) in `EXPORT_NAMES`: the module blocks
     export only what a page file or the tests use, and a writer the page no longer calls would drop out of core's
     exports.
- **Not narrowed.** The prompt's scope fits one session: 17 functions moved, 9 deleted, no caller rewritten. **Stays in
  the page:** `applySessionSwaps` and `applyDayEdits` (they rewrite the grid at every launch, the freeze slice's, after
  2026-12-06) with `ssSkipToken`, the token `applyDayEdits` reads; `refreshProgram`'s reads; `loadActiveProgram`'s
  clear of `ia_active` and the purge (`program-manage.ts`, the freeze slice's); the backup's read of `ia_programs` (the
  backup slice's); the Wildcard's once-by-title rule in `completeWildcard` (`random-wildcard.ts`, it draws).
- **What deliberately does not change:** every key and every stored byte; the order of a record's fields (`from`,
  `to`, `ts`, `rx`; `to`, `n`, `offered`; `add`, `skip`; `name`, `detail`, `ts`); which reads catch (all of them) and
  which writes are swallowed (swaps, counts, edits) or throw (the program list, the active id, the Wildcard's record);
  the order of reads and writes within a tap; every function name the Angular screens call; every golden record. One
  thing moves that no record can show: the instant of a swap or an add is read by the page before the rule runs, where
  `recordSwap` read the clock after reading the store and `recordAdd` only when it added. It is the same tap's clock.
- **Found by the break check, closed in the slice:** the case "a day's swaps and edits, made and undone, and the
  nudge" (`tests/integration/stored-state.test.ts`) on HALF_MANNY's week 1 Monday, with no launch between the taps:
  a swap, a skip and an add (`edited`); each undone (`undone`); the same pair twice more, the nudge up and turned down
  (`nudged`); then the replacement swapped on, the first lift added back from the add sheet and swapped for the first
  replacement again (`merged`). Its four records are new in `tests/snapshots/stored-state.json`: 285 lines added, none
  removed or changed, and v0.261.5's page stores the same bytes. The merge was first measured as unreachable through a
  day holding one lift twice (0 of 60,550 built days, `tests/measure/stored-state_swap-places.md`); these four taps
  reach it. The break check gains 13 breaks inside the moved rules, every one red on the new case or the standard
  history: 29 red in all, 2 open as before (`tests/measure/stored-state_red-on-break.md`).
- **Found, not fixed (today's app, not this move):** the nudge counts taps, not sessions. Its comment says three
  sessions running make a preference; swap a lift, undo it and swap it again, three times on one day, and the nudge
  comes up (the new case's `nudged` record). Nothing stored is at risk. A fix is its own ruling (`MIGRATION.md`,
  section 7).
- **Expected values (typed from the ruling):** an empty or broken `ia_swaps_p1`, `ia_swapct_p1` or `ia_edits_p1` reads
  as `{}`, an empty or broken `ia_programs` or `ia_wild_p1` as `[]`, and `ia_active` empty or missing as `null`; each is
  stored as its `JSON.stringify` (the active id as given). A swap of Back squat for Front squat in week 2 on Monday at
  instant 100 stores `{"w2_mon":[{"from":"Back squat","to":"Front squat","ts":100}]}`, and with places their `rx` after
  `ts` (`ph` only on a place that has it). A lift swapped again on its day replaces its record at the end of the list;
  the same pair keeps the earlier places this tap did not see, this tap's detail for a place seen again; another
  replacement keeps none. An undo removes that lift's record and the day's key with its last; a day with none writes
  nothing. The count: one, two, then the third swap of a pair hands back `{to, n: 3, offered: false}`, and the fourth
  `n: 4` until it is answered; another replacement starts at one; an answered pair starts at one, stays offered and is
  never due again, while another pair still can be; answering a lift never counted writes nothing. A skip is stored once
  as `{"w3_tue":{"add":[],"skip":["Hammer curl"]}}`, a superset as `__ss:<section>`, and an old entry missing a list
  gains it after the ones it has; an add once by name as `{name, detail, ts}`, the first kept. Putting back or removing
  the last edit of a day removes its key. The prune at cut 3 drops weeks 1 and 2, keeps week 3, week 12 and a key that
  is not a week, and writes only when something went. A refused write of a swap, a count or an edit stops nothing; of
  the program list or the Wildcard's record, it throws.
- **Tests:** `tests/unit/stored-state.test.ts`, 17 new: 15 on the functions from `@ia/core` on a memory store, the page
  reaching them (each rule in the script once, each key built by its reader and its writer, the 9 deleted names gone),
  and the page's own names answering as they did. `tests/integration/stored-state.test.ts`, the new case. The other
  golden records and the backup corpus, unchanged.

## Release scope: v0.261.7 moves what Progress reads and computes from the stored state into core

- **Date:** 2026-11-11. **Ruled by:** Mario (the sixth slice, on his prompt); **bump:** PATCH, named in that prompt, by
  his standing rule for migration steps that change the page and no behaviour. **Shipped:** v0.261.7.
- **The finding (`tests/measure/stored-state_progress-callers.md`, read on v0.261.6):** `progress-data.ts` reads the
  stores in two places. `seedFromPriorPrograms` (the wizard's seed, from `wizard.ts` and the Angular wizard) reads every
  program's `ia_logs_` and `ia_hist_`; `_purgeWarnsCrossProg` (the delete bar's warning, from the page and the Angular
  Progress screen) reads `ia_programs` and `ia_exw_`. The rest of what it computes is handed the stored values by its
  caller (`lift-ledger-progress-screen.ts` and the Angular Progress screen, which call `getLogsFor`, `getDayHistFor`
  and `getExWeightsFor` themselves): `recoveryPaceWeekly`, `ladderWeekly`, `runsByClass`, `easyEffortWeekly`,
  `plannedVsLogged`, and under them `_recoveryPaceEntry`, `_runClass`, `_paceStrToSec`, `_mileFromRecoverySec`,
  `_halfFromMileSec`, `_progWeekNow` and `_cutWeek`, with the constants `SEED_WINDOW_DAYS`, `SEED_MIN_RUNS`,
  `EASY_RPE_LO`, `EASY_RPE_HI` and `RUN_CLASS_ORDER`. What is left of `day-status.ts`'s store logic: `cardioEntryLive`
  (the run card's regime, a rule over a stored entry; `wheel-log.ts` and the Angular session sheet), the preference
  `acceptSwapNudge` writes into the program's config (the Angular nudge, `overlays.html`), the sport swap's parking
  and `persistLogFields` (v0.261.4 ruled they stay until the cardio dose moves), and `toggleComplete`, which has no
  caller.
- **The records were blind to all of it (`tests/measure/stored-state_progress-gaps.md`, on v0.261.6):** Progress reads
  the stores and writes none, so a record of the keys cannot show what it computes. On HALF_MANNY's standard history
  no log holds RPE 3 or 4 (the easy-effort reader comes back empty), one recovery run carries a pace, there is one
  program (the seed is null, the warning false), and nothing takes the nudge. No test at all names `acceptSwapNudge`.
  A break inside each of the 16 moved rules, run against v0.261.6's own records, left all 16 green; the control (the
  log key break) went red.
- **What changes:** one new file and two grown ones in `core/src/engine`, code as it was, with the store, the program
  and the instant passed in where the page read its globals and the clock.
  1. `state-progress.ts` (new, after `state-day-edits.ts` in `order.json`): the five constants, by their names;
     `paceSeconds`, `mileFromRecoveryPace`, `halfFromMilePace` (the two walks of `PACE_CHART`), `runClassOf`,
     `recoveryPaceEntry`, `recoveryPaceByWeek`, `longestRunByWeek`, `runPacesByClass`, `easyPaceByWeek`,
     `plannedAndLoggedMiles`, `programWeekAt` and `progressCutWeek` (each taking the instant), `seedFromStoredPrograms`
     (the store and the instant) and `liftLogFeedsOthers` (the store and the program).
  2. `state-day-log.ts`: `cardioEntryLogged`, beside `CARDIO_PARK_FIELDS` and `runPartLogged`.
  3. `state-programs.ts`: `recordSwapPreference`, the nudge's write: the program's config gains the pair, the list is
     written, and the program comes back (null, writing nothing, when the program or its config is missing).
  4. The page's functions keep their names and arguments and call these: `seedFromPriorPrograms` (it still takes an
     optional instant, `Date.now()` when none), `_purgeWarnsCrossProg`, `recoveryPaceWeekly`, `ladderWeekly`,
     `runsByClass`, `easyEffortWeekly`, `plannedVsLogged`, `_runClass`, `_paceStrToSec`, `_mileFromRecoverySec`,
     `_halfFromMileSec` and `_cutWeek` (`Date.now()`) in `progress-data.ts`; `cardioEntryLive` in `day-status.ts`;
     `acceptSwapNudge` calls `recordSwapPreference`, then marks the pair offered and rebuilds, as before.
  5. **Deleted with the move, each with no caller left** (legacy, Angular through the bridge, tests): `_recoveryPaceEntry`
     and `_progWeekNow`.
  6. `tests/harness.js` lists `recoveryPaceEntry`, `programWeekAt` and `cardioEntryLogged` in `EXPORT_NAMES`: core
     calls the first two itself, and the page no longer names them.
- **Narrowed.** **Stays in the page:** everything that draws (`buildPaceChart`, `_fmtPaceShort`, the chips, the
  restore and delete bars, `showProgressScreen`, `RACE_DIST_MI`, `EASY_MIN_RUNS`, `RUN_CLASS_COLOR`); the sport swap's
  parking and `persistLogFields` (v0.261.4's narrowing stands: the cardio dose has not moved); `refreshProgram`, which
  the nudge still calls. **Left as they are, with no caller:** V165's lift ledger (`ledgerRows`, `_entryBestE1RM`,
  `_LEDGER_MAIN`, orphaned since V167) and `toggleComplete`. The move leaves no caller of them, it found them with
  none; deleting them is a cleanup, not this move. The other readers Progress uses (`weeklySums`, `journalWeeks`,
  `easyVsPrescribed` and the rest of `lift-ledger-progress-screen.ts` and `progress-charts.ts`) are not in
  `progress-data.ts`, and wait for a slice of their own.
- **What deliberately does not change:** every key and every stored byte; every value a reader hands back, its fields
  and their order; the clock each reads (the page's `Date.now()`, where `_progWeekNow` read `new Date()`: one instant);
  the order of the nudge's writes (the program list, then the count, then the rebuild); every function name the Angular
  screens and the wizard call; every golden record.
- **Found by the break check, closed in the slice:** the case "what Progress reads from three weeks of runs, the nudge
  taken, and a second program" (`tests/integration/stored-state.test.ts`) on HALF_MANNY: every run of weeks 1 to 3
  logged with a distance, a pace and an effort (RPE 3 on an easy or recovery run, 7 on any other), one recovery run
  credited to the bike, one run tapped Done, undone and Done again (`undone`, the entry the undo tap stores: a logged
  card keeps its numbers); on week 4's Wednesday the readers' values and the projection Progress draws from the easy
  pace (`progress`), the first lift of week 4's first day traded three times running and the nudge taken
  (`nudgeTaken`), then a lift logged and a second program made (`second`: the seed, the warning for each program, the
  new program's readers and its record). Its records are new in `tests/snapshots/stored-state.json`: 901 lines added,
  none removed or changed, written on v0.261.6's page and matched by v0.261.7's. The break check gains 16 breaks inside
  the moved rules, every one red on the new case: 45 red in all, 2 open as before
  (`tests/measure/stored-state_red-on-break.md`).
- **Expected values (typed from the code's rules and `PACE_CHART`):** `paceSeconds` reads `10:26/mi` as 626, ` 7:30 `
  as 450, and `7:3`, `abc` and an empty value as null. `mileFromRecoveryPace` gives 300 at 420 s and below, 315 at
  437.5 (halfway from 420 to 455), 480 at 630, 720 at 870 and above, and null at 0. `halfFromMilePace` gives 4,680 at
  300 s and below, 4,890 at 315, 11,100 at 720 and above, null at 0. `runClassOf`: empty and `Benchmark Run` none,
  `Recovery Run` Recovery, `Long Interval (LI)` Tempo, `Speed Run — Intervals` and `Speed Run — Tempo` Interval,
  `Tempo Run` Tempo, `Easy Run — Long` Long, `Easy Run` Easy, `Strides` none. A recovery run in week 2 at `10:00/mi`
  with a target of 800 is `{w: 2, sec: 600, tgt: 800}`; swapped, past the program's weeks, with no snapshot, on a bike
  or not a recovery run, it is none, and a target of 0 is null. Runs of 600 and 620 s in week 1 and 640 in week 2 with
  targets 800, 800 and 770 give `{weekly: {1: 610, 2: 640}, tgt: 790, nWeeks: 2}`. The longest run of a week takes the
  rest-day jog as one more run, never a sum (3.1, 5 and a jog of 6 make 6), and leaves out the cut week and, asked,
  week 1. The easy effort reader keeps RPE 3 and 4 on recovery and easy runs only. Planned and logged miles pair each
  distance-dosed run with its log: 3 and 2 miles written, 3.5 logged, make `{presc: 5, act: 3.5}`; a swapped day and a
  timed run are out. A program starting 2026-08-31 is in week 4 at noon on 2026-09-23 and its cut week is 4; before
  its start, week 0 and no cut; after its 14 weeks, week 14 and no cut; with no start, week 0. The seed takes the
  program whose qualifying runs are latest, three or more inside 21 days and none after the instant: paces 600, 630
  and 660 make `avgRecSec` 630 and `mileSec` 480; the longest run takes a jog of 6.2 over a run of 5; a program with
  no name is `previous block`; no distance gives `maxDist` null; two runs give nothing. The warning is true only when
  another program exists and this one's lift log holds a lift. The run card is logged for a sport when the entry holds
  a value in one of its fields: `0.00` is a value, the number 0 is not, and no sport is never logged. The nudge's write
  adds the pair to the preferences the program holds, keeps the others, and writes nothing for a missing program or a
  program with no config.
- **Tests:** `tests/unit/stored-state.test.ts`, 15 new (62 to 77): 13 on the functions from `@ia/core` on a memory
  store and on hand-made values, the page reaching them (each rule in the script once, the two deleted names gone),
  and the page's own names answering as they did. On v0.261.6: the 11 on `state-progress.ts` cannot load (`git
  cat-file -e` exit 128); with that import stubbed on v0.261.6's own tree, the run card's regime, the nudge's write and
  the page read fail; the page's own names pass, as a guard must. `tests/integration/stored-state.test.ts`, the new
  case. The other golden records and the backup corpus, unchanged.

## Release scope: v0.261.8 moves the backup's snapshot, reader and loader into core

- **Date:** 2026-11-11. **Ruled by:** Mario (the seventh slice, on his prompt); **bump:** PATCH, named in that prompt, by
  his standing rule for migration steps that change the page and no behaviour. **Shipped:** v0.261.8 (on the chat's
  branch until Mario merges it).
- **The finding (`tests/measure/stored-state_backup-callers.md`, read on v0.261.7):** `data-backup.ts` (D264,
  `docs/decisions/data-backup.md`) holds the store's logic in five functions and two constants: `_backupKeys` (every
  `ia_` key, sorted), `backupSnapshot` (every such key as stored, with the release and the instant; called by
  `saveBackup`), `_programCount` (how many programs a stored list holds; `readBackup` and `saveBackup`), `readBackup`
  (checks a file's text and touches nothing; `readBackupFile`) and `loadBackupData` (replaces every `ia_` key, all or
  nothing; `applyBackup`), with `BACKUP_KIND` and `BACKUP_FORMAT`. The rest saves, reads a file or draws:
  `saveBackup` (the plugin's share, the share sheet, a download), `readBackupFile` (the picked file's text),
  `applyBackup` (the toast and the reload), `backupMessage` (the line the Bugs page shows), `backupFileName` (the share
  sheet's name) and the Your data block's six. The Angular Bugs screen calls `saveBackup`, `readBackupFile`,
  `backupMessage` and `applyBackup` through the bridge, none of the five.
- **The records were blind to most of it (`tests/measure/stored-state_backup-gaps.md`, a break per rule on v0.261.7's
  page, run against v0.261.7's own tree):** 15 of 21 breaks green: the scan's prefix and its name order, every check of
  the reader (the kind, the newer format, the format, the data, the keys, the program list, the count, the time), a load
  over keys the file does not hold, and a refused load's two halves of putting back and its result; and a key with no
  value, which no store can hand the snapshot (listed open in the break check, with why). Red: the scan, the file's kind,
  format, release and time (each changes the file the records load), and a load that writes nothing. The backup's own
  feature tests (`tests/unit/data-backup.test.ts`, `tests/integration/data-backup.test.ts`) catch 19 of the 21: not the
  key with no value, and not a refused load that keeps what it wrote (their refusal comes after one write, `ia_active`,
  a key the phone also held, so putting back covers it). Every backup the records hold is good and is loaded onto an empty
  phone, so no record held a refused file, a load over keys the file does not hold, a key that is not the app's, or a
  refused write.
- **What changes:** one new file in `core/src/engine`, code as it was, with the store, the release and the instant
  passed in where the page read `iaStore`, `IA_VERSION` and the clock.
  1. `state-backup.ts` (new, after `state-progress.ts` in `order.json`): `BACKUP_KIND` and `BACKUP_FORMAT`, by their
     names; the types `BackupData`, `BackupRead` and `BackupFile`; `backupKeys` (the store), `takeBackup` (the store,
     the release and the instant), `backupProgramCount`, `readBackupText` and `loadBackupInto` (the store and the file's
     data).
  2. The page's functions keep their names and arguments and call these: `backupSnapshot` (`iaStore`,
     `String(IA_VERSION)`, `Date.now()`), `readBackup` and `loadBackupData` (`iaStore`). `saveBackup`'s empty check
     calls `backupProgramCount`.
  3. **Deleted with the move, each with no caller left** (legacy, Angular through the bridge, tests): `_backupKeys`,
     and `_programCount`, whose one test caller lifted it only to hand it to `readBackup`.
  4. `tests/unit/data-backup.test.ts` lifts core's `readBackupText` and `backupProgramCount` out of the page, where it
     lifted `readBackup` and `_programCount`; its assertions do not change.
  5. `tests/harness.js` lists `BACKUP_KIND`, `BACKUP_FORMAT` and `backupKeys` in `EXPORT_NAMES`: core reads them
     itself, and no page file names them.
- **Narrowed.** **Stays in the page:** `saveBackup`, `readBackupFile`, `applyBackup`, `backupMessage`,
  `backupFileName` and the Your data block. They share, read a picked file, reload or draw; `backupFileName` and
  `backupMessage` are the share sheet's and the Bugs page's words, and move with that screen.
- **What deliberately does not change:** every key and every stored byte; the file's fields and their order (`kind`,
  `format`, `version`, `made`, `data`), its keys in name order, and the text `saveBackup` writes; what a read hands back
  for every file; a load's order of removes and writes, and what a refused write puts back; keys that are not the
  app's; the clock (the page's `Date.now()`, where `backupSnapshot` read `new Date()`: one instant); every function
  name the Angular Bugs screen calls; every golden record.
- **Found by the break check, closed in the slice:** the case "backups refused, a load refused, and a backup loaded over
  another program" (`tests/integration/stored-state.test.ts`) on HALF_MANNY with its first day trained and a key that
  is not the app's: the backup's key list; what the reader hands back for the file as written and 14 variants of it
  (cut short, another kind, a newer format, no format, the format as text, data a list, no data, a key not the app's,
  a value not a string, no program list, a program list not a list, two programs, no time, a time not text); then a
  second phone with the 1.5 mile test program made on another morning (its id is not the file's), a day trained and a
  key of its own, whose storage refuses the file's last write once, after it has written keys the phone did not hold
  (the load comes back false and the phone holds what it held), then the load (the phone holds the file's `ia_` keys and
  its own key), and the next launch. Its records are new in `tests/snapshots/stored-state.json`: 336 lines added, none removed or changed, written on v0.261.7's page and matched by v0.261.8's. The break check gains 19 breaks inside the moved rules, and
  the backup scan's text follows the code: 64 red in all, every one of the 19 on the new case; 3 open, the snapshot's
  key with no value joining the two before (`tests/measure/stored-state_red-on-break.md`).
- **Expected values (typed from D264 and the code's rules):** the kind is `asylum-backup` and the format 1. A store
  holding `ia_logs_a`, `keep` and `ia_active`, in that order, backs up `ia_active` then `ia_logs_a`. Its backup at
  2026-11-11 15:00 UTC by release 0.261.8 is the text
  `{"kind":"asylum-backup","format":1,"version":"0.261.8","made":"2026-11-11T15:00:00.000Z","data":{"ia_active":"a","ia_logs_a":"{}"}}`.
  A program list counts its length (`[]` 0, two programs 2); none, `{}` and text that is not JSON are -1. A file reads
  with its data, its count and its time; another kind, no format, the format as text, data a list or missing, a key not
  `ia_`, a value not a string, no list or a list that is not a list are refused as `bad`; format 2 as `newer`; no time
  reads as `''`. A load over `ia_active`, `ia_logs_b` and `keep` leaves the file's keys and `keep`, and comes back true;
  a store refusing the file's second write comes back false and holds what it held, `keep` included.
- **Tests:** `tests/unit/stored-state.test.ts`, 7 new (78 to 84): 5 on the functions from `@ia/core` on a memory store
  and on hand-made files, the page reaching them (each function once, three rules once, the two deleted names gone),
  and the page's own names answering as they did. On v0.261.7: the 5 on `state-backup.ts` cannot load (`git cat-file
  -e` exit 128); with that import stubbed on v0.261.7's own tree, those 5 and the page read fail, and the page's own
  names pass, as a guard must. `tests/unit/data-backup.test.ts`: its wiring only, so it fails whole on v0.261.7 (the
  names it lifts are not in that page) and no assertion changed. `tests/integration/stored-state.test.ts`, the new case. The other
  golden records and the backup corpus, unchanged.
