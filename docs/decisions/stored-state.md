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
