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
