# Iron Asylum: the move to React Native

**Status: phase 1 is under way (Mario's GO, 2026-11-11). The golden records are done, and seven lift slices have
shipped (v0.261.2, v0.261.3, v0.261.4, v0.261.5, v0.261.6, v0.261.7, v0.261.8) with no behaviour change. No React Native code is written.** The plan was written 2026-11-11 on `chat/rn-migration`, measured at v0.261.1.
Each phase starts only on Mario's GO, one phase step per session.

**Where phase 1 stands:**

- **Done, step 1: the golden records** (tests only, no build). `tests/support/stored-state.ts` drives whole histories
  through today's page by the app's own entry points and holds every `ia_` key by size and sha256:
  `tests/integration/stored-state.test.ts` (HALF_MANNY's history and 12 hostile cases, 14 tests),
  `tests/sweeps/stored-state.test.ts` (the 10 seeded programs, three time zones, 24 lattice configs) and
  `tests/sweeps/data-backup.test.ts` (one backup written by each of the 17 tagged releases since v0.253.0, each loaded
  on today's page). Each history run twice stores the same bytes. Twelve deliberate one line breaks of the page each
  turn the records red (`tests/measure/stored-state_red-on-break.md`). The first run of that check let two through
  and earned its keep: one led to a new hostile case (a logged day with no history, then an injury), the other to a
  finding (a term in the freeze that can never matter). The other open break, overwriting a day's first snapshot,
  was settled in the fourth slice: no tap can make it matter (below).
- **Found by the records, not fixed:** on every Monday after the clocks go forward, the app reads the week before
  (section 7). Mario's program is not touched by it (the clocks went back on 2026-11-01, and that direction reads
  right).
- **Mario, 2026-11-12:** decision 4 is yes, and **GO for phase 2** once the engine check ships. **The December 6 holds
  are lifted** ("dont worry about the december 6 race, lets get this moving"): the freeze slice, the phase 5 cutover
  and moving his real data no longer wait for the race. What stays: a backup saved before each install (phase 1's
  numbered steps), and his GO for each phase.
- **Done, step 2, the engine check (v0.262.0, D286, `docs/decisions/engine-check.md`):** an Engine row on the Bugs tab
  builds HALF_MANNY and the 864 lattice configs on the phone and prints how many digests match the ones CI pins.
  Measured first: a digest depends on neither the clock nor the time zone (24 runs, each 864 of 864), and the engine
  makes no storage call (1,728 builds, 0 calls). On the iOS simulator (iPhone 17 Pro, the app's web view, JavaScriptCore,
  the Mac busy with the e2e): **Lattice 864 of 864 match. Half Manny matches. Took 30 s.** The phone itself is Mario's
  run, after he installs the build; phase 2 runs the same core check under Hermes.
- **Done, the first lift slice (v0.261.2):** every storage call goes through one store. `core/src/engine/state-store.ts`
  holds the interface and its two makers; `storage.ts` makes the page's store, `iaStore`; the 59 direct calls are gone
  (the page names `localStorage` once). Every golden record identical, no golden file touched. The lifted code sits in
  `core/src/engine` for now, the one core folder today's page build reads, and moves to `core/src/app-state` at
  cutover (`docs/decisions/stored-state.md`).
- **Done, the second lift slice (v0.261.3):** the lift log (`ia_exw_`) lives in `core/src/engine/state-lift-log.ts`: one
  reader, one writer, `recordLift` (the rule for recording a lift) and the three pure functions the screens call.
  Every golden record identical. Narrowed from the plan's "`log-entries.ts` and the set logging rules": the cardio
  dose half and the set display rules read the page and move with the screens that use them.
- **Done, the third lift slice (v0.261.4):** the day's log, completion and skipped parts (`ia_logs_`, `ia_comp_`,
  `ia_parts_`) live in `core/src/engine/state-day-log.ts` and `state-day-status.ts`: a reader and a writer for each
  store, the read lens, the one day key, the set drafts, and the rules for what a status and a skipped part store.
  Every golden record identical. Narrowed: `persistLogFields`, the sport swap's parking and the rest day's log read
  the form and stay in the page until the cardio dose moves; the freeze's own read of these keys waits for its slice.
  The break check gained a break inside the moved rules (13 in all, all red) and found a gap: no history lets a
  day's parts write its completion, so no golden record holds that write. The skip pill's own tests and the new unit
  tests hold the rule (`tests/measure/stored-state_red-on-break.md`). Closed by a tests pass, Post-v0.261.4: the case
  "a day's parts settle its status" puts that write in the records, and its break is red (14 in all, 2 open).
- **Done, the fourth lift slice (v0.261.5):** the day history (`ia_hist_`) lives in
  `core/src/engine/state-day-history.ts`: one reader, one writer, the first touch's snapshot and the re-snapshot an
  edit makes. The page's five functions are thin callers; one of them, `saveDayHist`, has no caller left and goes with the next
  slice, under the rule written after this one (phase 1, step 3). Every golden record identical. Not narrowed. The freeze's
  own reads of the key and the purge wait for the freeze slice.
  - **The open break is settled: no tap can make it matter.** The guard (a day's first snapshot is never
    overwritten) decides only when a day is snapshotted again after it changed, and that does not happen: a launch
    gives every snapshotted day back from its snapshot, an edit is folded into the snapshot as it is made, and the one
    tap that changes a snapshotted day without its snapshot (the rest sheet's Move of a day with a logged lift) leaves
    a moved rest day nothing snapshots. Measured three ways: that history on a page with the guard removed stores the
    same bytes; the whole suite on a page that throws at such a call, none red of 1,863 tests; 180 random histories,
    0 of 4,481 repeat snapshots on a changed day (`tests/measure/stored-state_first-touch.md`,
    `stored-state_first-touch-walks.md`). The break stays listed as one no history can reach; the unit tests hold
    the rule.
  - **The break check found a gap, closed in the slice:** no history edited a day after its first touch, so a
    re-snapshot that did nothing changed no record. The case "a touched day edited, then its session moved" adds two
    records (256 lines, none changed), and that break is red (16 in all, 2 open).
  - **Found, not fixed:** a session moved off a day that has a logged lift comes back on that day (section 7).
- **Done, the fifth lift slice (v0.261.6):** the swaps, the swap counts and the day edits (`ia_swaps_`, `ia_swapct_`,
  `ia_edits_`) live in `core/src/engine/state-swaps.ts` and `state-day-edits.ts`, and what was left of `storage.ts`
  (`ia_programs`, `ia_active`, `ia_wild_`) in `state-programs.ts`. The page's 17 functions are thin callers; 9 with no
  caller left went with the move, `saveDayHist` among them. Every golden record identical. Not narrowed.
  `applySessionSwaps` and `applyDayEdits` stay with the freeze slice.
  - **The break check found the records blind to 8 of the 12 moved rules, closed in the slice:** the next launch
    prunes a touched week's edits before any record is taken, and no history undid a swap or reached the nudge. The
    case "a day's swaps and edits, made and undone, and the nudge" adds four records (285 lines, none changed).
  - **Found, not fixed:** the swap nudge counts taps, not sessions (section 7).
- **Done, the sixth lift slice (v0.261.7):** what Progress reads and computes from the stored state lives in
  `core/src/engine/state-progress.ts`: the wizard's seed and the delete bar's warning (each reads the store), the five
  readers the Progress screens hand the stored logs and history (recovery pace, longest run, runs by class, easy
  effort, planned and logged miles), the week Progress holds back, the run class, the pace and the two walks of the
  pace table. The run card's regime moved to `state-day-log.ts` and the nudge's preference write to
  `state-programs.ts`. The page's 14 functions are thin callers; 2 with no caller left went with the move. Every golden
  record identical. Narrowed: what draws stays, and so do the sport swap's parking and `persistLogFields` (v0.261.4's
  narrowing stands). Two orphans with no caller before the move stay as they were: V165's lift ledger and
  `toggleComplete`.
  - **The break check found the records blind to all 16 moved rules, closed in the slice:** Progress writes no key a
    record can show, and no history logged an easy pace, took the nudge or made a second program. The case "what
    Progress reads from three weeks of runs, the nudge taken, and a second program" records what the readers hand
    back (901 lines, none changed). The break check is at 45 breaks, all red, and 2 open as before.
- **Done, the seventh lift slice (v0.261.8):** the backup's snapshot, reader and loader live in
  `core/src/engine/state-backup.ts`: every `ia_` key in name order, the file with its release and its instant, the
  reader's checks, the program count, and the all or nothing load. The page's `backupSnapshot`, `readBackup` and
  `loadBackupData` are thin callers; `_backupKeys` and `_programCount`, with no caller left, went with the move. Every
  golden record identical, and every backup in the corpus loads to the same bytes. Narrowed: saving the file (the share
  sheet), reading the picked file, the Bugs page's line, the file's name and the block stay in the page.
  - **The break check found the records blind to 15 of 21 backup breaks, closed in the slice:** every backup they held
    was good and loaded onto an empty phone. The case "backups refused, a load refused, and a backup loaded over another program"
    adds its records (336 lines, none changed). The break check is at 64 breaks, all red, and 3 open: the two before, and a
    key with no value, which no store can hand the snapshot.
- **Next, on his GO:** `applyOverlays` with the freeze (Mario, Post-v0.261.6: it rewrites the grid on
  every launch), then `refreshProgram` and the freeze. No longer held for 2026-12-06 (Mario, 2026-11-12). The other readers the Progress screen uses
  (`lift-ledger-progress-screen.ts`, `progress-charts.ts`) move with that screen, and the backup's saving and reading of
  a file with the Bugs screen.

**Decided (Mario, 2026-11-11):** React Native, not SwiftUI. iPhone only. The end goal is an App Store release, and the
first public build is the React Native one. The Cordova build never ships publicly, so the only data that ever moves is
Mario's. **Why (Mario, 2026-11-11):** React Native is the platform the product has to be on. A public app has to be a real
iPhone app, and what comes next (app blocking through Screen Time, NFC unlock) is native work. The tab bar and viewport
bugs (D256, D280, D285) set it off; they are not the reason, and fixing them would not change the decision.

**Out of scope (Mario, 2026-11-11):** the tab bar and every other web view bug. No more work goes into them; they end
when the app leaves WebKit. Today's app is changed only for the migration itself (the phase 1 lift) or to protect
Mario's data and training before cutover. Everything else found along the way is carried in this file and fixed
inside the migration, in the code that replaces it.

**What cannot break (Mario's six):**

1. The engine in `core/` stays unchanged. The 864 config lattice and the HALF_MANNY digest stay green at every step, and
   before cutover they pass on the phone itself.
2. The stored program grid comes across byte for byte (V202: 9 of 9 logged runs flipped off target when it did not).
3. Mario's logs. Everything under the `ia_` keys is the only copy. Today's app keeps working until cutover, and his
   real data moves to the new app only on his GO, behind a backup he saved first (the date hold was lifted, Mario
   2026-11-12, section 6 decision 13).
4. Every backup file the current app has ever written loads in the new app.
5. No test is deleted until its replacement passes and has been shown to go red when the code is broken on purpose.
6. No redesign. The Track look carries over as it is.

**How to read the numbers.** A number marked *measured* came from a command run on 2026-11-11 (the script, or the run,
is named). A number marked *estimate* is the session's judgment and nothing more. Web facts carry their source in
section 7.

---

## 1. The inventory (measured)

`node tests/measure/rn-migration_inventory.mjs` wrote `tests/measure/rn-migration_inventory.md` (the full tables) and
`tests/measure/rn-migration_test-ledger.md` (one row per test file). Static counts over the tree at v0.261.1. Run it
again at the start of every phase: the numbers move as the app does.

### 1.1 Code

| Area | Files | Lines | Size | In the move |
|---|---|---|---|---|
| The engine, `core/src/engine` | 18 | 8,784 | 661 KB | stays, unchanged |
| The rest of `core/src` (domain types, format, gps, semver, version) | 14 | 1,438 | 58 KB | stays |
| The legacy script, `frontends/app/src/legacy/src/js` | 25 | 10,423 | 696 KB | its logic lifts into core (phase 1), its screens are rewritten |
| The legacy CSS | 10 | 1,115 | 105 KB | becomes React Native styles, the Track tokens carried over |
| The legacy HTML | 5 | 382 | 22 KB | rewritten as components |
| The Angular app, TypeScript | 87 | 11,759 | 583 KB | screens rewritten, pure models reused |
| Native plugins, Swift (`IAGps`, `IAIsland`, `RestTimerWidget`, `RestTimerAttributes`) | 4 | 616 | 24 KB | reused |
| The widget hook (`add-widget-target.js`) | 1 | 349 | 16 KB | replaced by a config plugin |

### 1.2 Screens

- **The legacy page:** 6 screens (`screenHome`, `screenWeek`, `screenProgress`, `screenBugs`, `screenWizard`,
  `screenGenerate`), 12 sheets and pop-ups, 4 tabs. The wizard has 7 steps.
- **The Angular app** (what the iOS build draws): **23 screen folders, 41 components.** They reach into the legacy
  script in **406 places** (the "bridge calls" column in the inventory). Each one is logic that has to exist in core,
  or in the new screen, before that screen can be rewritten. The heaviest: the session sheet (97), the wizard (64),
  This Week (38), Progress (34), the swipe deck (31), the program list (27).
- **A reading, not a count:** about 25 surfaces to rebuild. 4 tabs, the wizard and its generating screen, 3 full layers
  (session sheet, swipe deck, run recorder), 8 sheets, 4 pop-ups, and the chrome (tab bar, toast, update banner, rest
  timer).

### 1.3 Storage

- **59 direct `localStorage` calls** (29 reads, 22 writes, 6 removes, 2 scans), **all in 8 legacy files.** The engine,
  the rest of core and the Angular screens make none. `storage.ts` holds 18 of them.
- **17 `ia_` key families:** `ia_programs`, `ia_active`, `ia_logs_`, `ia_hist_`, `ia_comp_`, `ia_parts_`, `ia_exw_`,
  `ia_edits_`, `ia_swaps_`, `ia_swapct_`, `ia_moves_`, `ia_wild_`, `ia_pop_`, `ia_remind_`, `ia_reminded_`,
  `ia_season_`, `ia_theme`.
- **One backup format.** `BACKUP_FORMAT = 1` (`data-backup.ts`, D264, v0.253.0): `{kind, format, version, made, data}`
  where `data` is every `ia_` key exactly as stored, as strings. 17 releases have written it (v0.253.0 to v0.261.0, by
  tag). There is no older format to support.
- **Where the logic to lift lives:** `storage.ts` (27 functions: programs, logs, history, completion, parts, drafts),
  `program-manage.ts` (`refreshProgram` and the freeze), `overlays.ts` (`applyOverlays`: injury and travel, mixed with
  its sheet), `swaps-edits.ts`, `log-entries.ts`, `data-backup.ts`, `progress-data.ts`, `day-status.ts`,
  `popups-streaks-reminders.ts`. `exStoreKey` and `EX_KEY_ALIAS` are already in the engine (`exercise-library.ts`).

### 1.4 Tests

(The baseline before phase 1. `tests/measure/rn-migration_inventory.md` and the ledger are regenerated as phases
land, so their totals run ahead of this table.)

| Suite | Runner | Files | Tests (static) | Assertions (static) | Tests at run time |
|---|---|---|---|---|---|
| `tests/unit` | Vitest | 23 | 262 | 786 | 1,561 with integration (1,559 pass, 2 skipped) |
| `tests/integration` | Vitest | 63 | 1,084 | 3,789 | counted above |
| `tests/sweeps` | Vitest, CI only | 29 | 208 | 709 | 247 pass, 263 s on this Mac |
| `frontends/app/test/unit` | node:test | 41 | 323 | 980 | 342 pass |
| `frontends/app/test/integration` | node:test | 8 | 58 | 149 | 68 pass |
| `backend/test` | node:test | 11 | 86 | 312 | not run today |
| **Total** | | **175** | **2,021** | **6,725** | |

Static counts read `test(`/`it(` and `assert…(`/`expect(` calls, so a loop counts once. Plus 16 golden files in
`tests/snapshots/` (527 KB) and the Docker e2e: **5 app journeys, 59 steps**, each photographed in both builds and
compared, plus the website's and the admin's (9 step ids in `pages.ts`).

**The baseline every phase is held to (measured on v0.261.1):** HALF_MANNY digest `147f083be4e04e34`; the lattice
golden file holds 864 entries; all 29 sweeps green.

**What drives what.** Almost every test in `tests/` boots the legacy page in the VM harness, most through a helper in
`tests/support/`. Followed through, the first pass by rule reads:

| Plan | Meaning | Files | Tests | Assertions |
|---|---|---|---|---|
| KEEP | engine and core tests, pure models, the server, repo tools | 62 | 513 | 1,714 |
| RE-POINT | same assertions, the program built by `@ia/core`, no page booted | 43 | 523 | 1,677 |
| REPLACE | a React Native screen test takes its place; logic assertions move with the logic | 61 | 878 | 3,044 |
| RETIRE | what it tests is gone at cutover (the web view, a stylesheet, Cordova tooling) | 9 | 107 | 290 |

The rule over-reads REPLACE: a file lands there when it or a helper touches the page's elements at all. Phase 1 will
move much of that (logging, history, the freeze) into RE-POINT, because the logic leaves the page. Every row is
confirmed by hand in the phase that touches it.

### 1.5 What the app asks of the device

`iaIsland` (the rest timer's Live Activity) in 7 places, `iaGps` (the run recorder) in 7, `navigator.share` in 4 (the
backup), one file input (loading a backup), `fetch` in 3 (the update check, the bug report). No notifications, no
audio, no wake lock, no canvas. 46 inline SVGs, 155 `innerHTML` writes and 137 handlers written into markup: all of
that is drawing, and it is rewritten, not ported.

---

## 2. The phases

Mario's order is kept. Three changes, each with its reason:

- **Phase 1 gains one step and one hold.** An engine check on today's app (2.1, step 2), because the phone's
  JavaScript engine has never been run against the lattice, and the answer is the baseline for everything after. And
  the freeze lift waited until after 2026-12-06, because it rewrites the code that reads Mario's stored grid while he
  is still training on it (lifted by Mario on 2026-11-12, section 6 decision 13).
- **Phase 2 gains a native spike:** an empty widget target and one Swift module that build, sign and upload from CI.
  Whether today's Swift drops into an Expo project and signs with two profiles is the largest unknown in "Expo or
  bare". Finding out in phase 4, fifteen sessions in, is too late.
- **The race plans ruling (D270, proposed, not built) sits between phase 5 and phase 6.** It changes engine output, so
  it cannot run inside the migration, and the plans as they stand cannot go public (section 5, risk 3).

**Total size: 30 to 39 sessions (estimate).** At one phase step per session, with Mario's phone checks between.

### Phase 1: golden records, then the logic into core (6 to 7 sessions)

**Entry gate:** Mario's GO. v0.261.1 or later on `dev`, the 60 second check and the sweeps green.

1. **Golden records first (1 session).** A capture tool drives today's page in the VM harness through whole
   histories (build, log lifts and runs, skip, swap, add, move a rest day, flag an injury, travel, finish weeks, let
   weeks pass unopened, edit a past day, save and load a backup) and writes every `ia_` key as stored, plus the grid
   `refreshProgram` hands back. One golden file per scenario in `tests/snapshots/`, reviewed as a diff. The spread:
   the 10 seeded programs of `program-output.json`, a sample of the lattice, and the hostile ones: a program eight
   weeks stale, a race date in the past, the clock moved across a daylight saving change and a year end, three time
   zones (`TZ=America/New_York`, `Pacific/Auckland`, `UTC`), logs for a day the grid no longer holds, old `ia_exw_`
   slugs that only `EX_KEY_ALIAS` resolves, an older program missing newer fields, a key holding broken JSON, storage
   that refuses a write, an emoji in a note. Also one backup made by each of the 17 tagged releases since v0.253.0
   (`tools/app-at.mjs <tag>`), kept as a corpus: the answer to "every backup ever written".
2. **The engine check in today's app (same session, Mario's call, section 6).** A line on the Bugs tab that runs the
   lattice and HALF_MANNY on the phone and prints how many digests match. It tells us whether the phone already
   prescribes what CI pins.
3. **The lift, a slice a session (4 to 5 sessions).** A storage interface in `core/` (`get`, `set`, `remove`, `keys`,
   all synchronous, strings in and out) with two implementations: the browser's `localStorage`, and a plain map for
   tests. Then, in this order: `storage.ts` (programs, logs, history, completion, parts); `log-entries.ts` and the
   set logging rules; `swaps-edits.ts`; `progress-data.ts` and `day-status.ts`; `data-backup.ts` (snapshot, read,
   load); then (no longer held for 2026-12-06, decision 13) `overlays.ts` (`applyOverlays` only, its sheet stays) and last
   `program-manage.ts` (`refreshProgram` and the freeze). `applyOverlays` moved behind the race (Mario,
   Post-v0.261.6): `refreshProgram` runs it on every launch, before the freeze, so it rewrites the grid the way
   `applySessionSwaps` and `applyDayEdits` do, and those wait for the freeze slice. Each slice is plain TypeScript in `core/src/app-state/`, the legacy file keeps
   a thin caller, and it ships as the next PATCH (the migration bump policy, Mario 2026-10-12). A page function a move
   leaves with no caller (legacy, Angular through the bridge, tests) is deleted with the move, not kept as a caller of
   nothing (Mario, Post-v0.261.5). A core function only the tests call is listed in `tests/harness.js` `EXPORT_NAMES`:
   the module blocks export only what a page file or that list names, so deleting its last page caller drops it from
   core's exports and the tests that import it stop loading (Mario, Post-v0.261.6: `writeDayHistory`, when
   `saveDayHist` went).

**Exit gate:** every golden record reproduced byte for byte by the lifted code, under V8 in CI. The 59 direct storage
calls down to the one browser implementation. Every re-pointed test green and red on its named break (section 3.4).
The lattice, HALF_MANNY and all sweeps unchanged. Nothing visible changes except the engine check line.

**Deleted:** the legacy bodies of the lifted functions, as each slice ships. No test.

**Mario by hand, before installing any phase 1 build:**
1. Open the app, tap the Bugs tab, tap **Save a backup**.
2. In the share sheet choose **Save to Files**, then **iCloud Drive**, then **Save**.
3. Install the new build from TestFlight.
4. If anything looks wrong: open TestFlight, tap Iron Asylum, tap **Previous Builds**, install the one before. Then
   Bugs tab, **Load a backup**, pick the file from step 2. (The Previous Builds step is from memory of TestFlight, not
   checked today.)

### Phase 2: the shell, one screen, and the engine on the phone (4 to 5 sessions)

**Entry gate:** phase 1's exit gate, except the freeze slice may still be waiting for December 7. Mario's GO.

- An Expo app (SDK 58, React Native 0.88, Hermes) in `frontends/native/`, beside today's `frontends/app/`, which is
  not touched. **Its own bundle id** (for example `com.bigyerr.ironasylum.next`), so both apps sit on the phone side
  by side and today's app is never replaced before cutover.
- The storage interface's third implementation, on SQLite (`expo-sqlite/kv-store`, synchronous).
- Load a backup, read only: the new app takes a backup file and shows it. It writes nothing back to the old app.
- **One screen end to end: This Week**, the screen Mario opens every day, drawn from the lifted logic with the Track
  tokens.
- **The engine on the device:** the same engine check as phase 1, in the new app. On the phone, under Hermes.
- **The native spike:** an empty widget target and a no-op Swift module, built, signed and uploaded by CI.
- CI: a `native (Expo)` job beside today's `native (iOS simulator)`, and a second TestFlight lane for the beta app.

**Exit gate:** on Mario's phone, with a copy of his real backup loaded: the lattice at 864 of 864 and HALF_MANNY at
`147f083be4e04e34` under Hermes; every `ia_` key's sha256 equal to the backup's after import (the app refuses the
import otherwise); This Week showing the same week, day, cards and numbers as today's app, checked side by side by
Mario; the spike in TestFlight.

**Deleted:** nothing.

**Mario by hand** (full numbered steps come with the phase, they depend on what App Store Connect shows that day):
register the second bundle id and its App Store Connect record, make its two profiles, enter its secrets in GitHub.
All in the browser. No Xcode.

### Phase 3: the remaining screens, most used first (13 to 17 sessions)

**Entry gate:** phase 2's exit gate. The freeze slice shipped. Mario's GO.

The order is the session's reading of what Mario uses daily (no usage numbers exist):

| # | Screens | Sessions (estimate) |
|---|---|---|
| 1 | The swipe deck: cards, set logging, Call it | 2 |
| 2 | The session sheet and its log (wheels, set rows, the RPE card, the 1RM card) | 3 |
| 3 | The run card, the cardio sheet, the rest timer (no Live Activity yet) | 1 to 2 |
| 4 | Progress: journal, charts, ledger, estimator | 2 to 3 |
| 5 | The program list and its sheets (goal, mile, mile lock, injury and travel, rest day) | 2 to 3 |
| 6 | The wizard and generating | 2 |
| 7 | Swap, add, Random Workout, pop-ups, the toast, the Bugs tab, backup, theme | 1 to 2 |

Each screen: built from the lifted logic and the Angular screen's pure model where one exists, its tests written from
the ledger, then **checked against the old build** on the same backup (section 3.3).

**Exit gate, per screen:** its ledger rows filled (replacement named, counts after, red on its break). Its numbers
match the old build's on the rehearsal backup and on the 10 seeded programs. Mario has used it on the phone.

**Deleted:** nothing from the old app. It is still the daily driver.

### Phase 4: GPS, the Live Activity and the widget (3 to 4 sessions)

**Entry gate:** phase 3's run card and rest timer done. Mario's GO.

`IAGps.swift` and `IAIsland.swift` become two local Expo modules, the Swift kept, the Cordova plumbing replaced.
`RestTimerWidget.swift` and `RestTimerAttributes.swift` move unchanged into the widget target the spike proved.
Background location, its permission strings and its App Store wording are set here.

**Exit gate:** a real run by Mario with the phone recording beside the COROS Pace 4, compared by
`tests/measure/gps-recording_watch-compare.js`, no worse than today's app on the same route. The rest timer's Live
Activity starts, holds and ends on the lock screen and the Dynamic Island. Both through TestFlight, not a cable.

**Deleted:** nothing.

### Phase 5: cutover (2 to 3 sessions)

**Entry gate:** phases 1 to 4 done. Mario's GO for the rehearsal, and a second GO for the real move. (It no longer waits
for 2026-12-06: Mario lifted that hold on 2026-11-12, section 6 decision 13. A fresh backup before each install stays.)

1. **Rehearsal.** Mario saves a backup and sends it to the Mac (AirDrop into `temp/`, never the repo). The session
   loads that copy into the new app on the simulator and into today's page, and compares every screen's numbers
   (section 3.3): every week, every day, every logged set and run, Progress, the ledger, streaks. Zero differences, or
   each one explained and ruled.
2. **The engine check** on the phone again, on the release build.
3. **The real move.** The React Native app takes the real bundle id, `com.bigyerr.ironasylum`, and installs over the
   Cordova app as an update. Mario loads his backup. The old web view's storage stays in the app's container,
   untouched, as a second copy.
4. **Seven days of holding.** Mario trains on the new app. The old build stays in TestFlight's previous builds.

**Exit gate:** seven days with no data fault, and Mario's word.

**Deleted, only after the exit gate:** the Cordova project (`config.xml`, the plugin JavaScript and hook, `ios.mjs`),
the Angular app, the legacy script, CSS and HTML, `build-index` and the VM harness, the RETIRE rows of the ledger, the
app's Docker journeys and the parity collage, and the Engine row on the Bugs screen (D286, both apps): from then on
CI's Hermes job proves the engine on every push, so the athlete never needs the button. The root `index.html` and Pages go only if Mario retires the web app
(section 6).

### Between 5 and 6: the race plans (D270), its own ruled release

The engine is free to change again once cutover holds. D270 P-OWNPLANS (proposed, `docs/decisions/race-plans.md`)
replaces the transcribed plans, moves HALF_MANNY to a new printed digest and regenerates the goldens, by the normal
ruling path. It is the entry gate to phase 6, not part of the migration.

### Phase 6: App Store submission (2 to 3 sessions, plus review time)

**Entry gate:** phase 5's exit gate. D270 shipped. Mario's GO.

The store page, screenshots, the privacy answers and the privacy manifest, the location wording, an attribution line
for the NSW guide, no SEAL or trident marks, a support address, the age rating, export compliance (already declared).
Built with the SDK Apple requires that month. An external TestFlight group first.

**Exit gate:** approved and live.

**Deleted:** nothing.

---

## 3. The test plan

### 3.1 The ledger

`tests/measure/rn-migration_test-ledger.md` has one row for each of the 175 test files: its tests and assertions
today, what it drives, and its plan. The phase that touches a file confirms its row by hand, then fills in the
replacement and the counts after. Rules:

- **A retired test carries a written reason in its row.** "What it tests is gone" names the thing.
- **Assertion counts are compared before and after, per row and in total.** A replacement with fewer assertions says
  why in its row. The total today: 2,021 tests, 6,725 assertions.
- **No row's file is deleted before cutover holds,** and never before its replacement is green and has been red on
  its named break.

### 3.2 Which runner runs what

| Kind | Runner | Where |
|---|---|---|
| The engine, the lifted logic, formats, semver | Vitest, as today | `tests/` on `@ia/core`, in CI on Linux and in the 60 second check |
| The golden records and the lattice | Vitest, as today | `tests/sweeps`, CI |
| The same engine suite under Hermes | the lattice bundled and run by the Hermes binary | a CI step (to confirm in phase 2 that a Linux binary exists; otherwise the simulator) |
| React Native screens | Jest with `jest-expo` and React Native Testing Library | `frontends/native/`, CI on Linux and the 60 second check |
| Journeys | Maestro on the iOS simulator | the macOS job |
| The engine on the phone | the engine check screen | by Mario, at the phase 2 and phase 5 gates |
| The server, the website, the admin | as today | unchanged |

### 3.3 The journeys worth rebuilding, and what replaces the parity collage

Five journeys exist today, 59 steps. Rebuild four as Maestro flows, shorter, because screen tests now carry the detail:

1. **First program:** the wizard to a built program on This Week.
2. **A lift day:** open the deck, log sets, swap one move, Call it, see it on This Week and Progress.
3. **A run day:** open the run card, log a run by hand, see its pace on Progress.
4. **Life happens:** flag an injury, move a rest day, skip a part, undo it.

Dropped as journeys, kept as screen tests: the goal and mile sheets, Random Workout, the rest timer's drag.

**The parity collage becomes a numbers check.** Pixels cannot match between a web view and native text, so the diff
changes from pictures to content. One seeded state is loaded into both apps. For every screen the old build's visible
text is read (the page, in the harness) and the new build's (the simulator's accessibility tree, through Maestro), and
the numbers and labels are compared as lists: zero differences or a named, ruled one. A side by side picture of each
screen pair is still laid out on one board, for Mario's eye, not for a machine.

### 3.4 How a break covers the new tests

**What the repo says today:** the sabotage suite was deleted on purpose (test migration phase 3), and Mario questioned
bug injection as a standing practice. The rule that replaced it is "each test fails on the previous release". That
rule has nothing to say about a rewrite: on the previous release the new screen does not exist, so its test fails for
the wrong reason.

**The proposal (Mario's approval needed, section 6):** a one time break per replacement, not a standing suite. When a
test replaces a ledger row, the row names one deliberate break of the code under test, as a small patch ("the week
index off by one", "the freeze skips Sunday"). `tools/red-check.mjs` applies the patch to a scratch copy of the tree,
runs the test, and passes only if the test goes red. The patch is kept beside the ledger, the result is written in the
row, and nothing broken ever touches the working tree.

---

## 4. The four questions

### 4.1 Expo or bare React Native?

**Expo.** SDK 58 (released 2026-10-15, React Native 0.88), with the native project generated on every build and never
committed, which is the rule this repo already lives by for Cordova's `platforms/`.

- **The Swift we have** goes in as local Expo modules (`IAGps`, `IAIsland`): the Expo Modules API is Swift first.
- **The widget and Live Activity** keep their Swift, in a widget target added by a config plugin
  (`@bacons/apple-targets`). Not `expo-widgets`: that library has widgets written in TSX with Expo UI, which would
  mean rewriting a widget that works.
- **App blocking later:** `react-native-device-activity` wraps FamilyControls, ManagedSettings and DeviceActivity and
  ships an Expo plugin. The hard part is not Expo: Apple must approve the Family Controls entitlement for the app and
  for each of its extensions, separately. Ask early.
- **NFC later:** `react-native-nfc-manager` ships an Expo config plugin and needs a development build, which we have.
- **Builds stay on GitHub Actions** with the signing scripts already written (`scripts/signing.mjs`, seven secrets),
  not EAS Build. (EAS pricing was not checked.)

**The strongest argument against:** `@bacons/apple-targets` calls itself experimental, and extension targets are
where Expo is thinnest. Today that is one target; with app blocking it becomes three or four. If the plugin fails us,
the fallback is to commit the generated `ios/` folder and keep everything else. That is a step back, not a rewrite,
and phase 2's spike finds out before any screen depends on it.

### 4.2 Where can the phone's JavaScript engine change a result?

Grepped across the engine, the rest of core, the legacy script and the Angular app (inventory, section 5). CI runs V8,
today's phone runs JavaScriptCore, the new app runs Hermes.

**In the engine, three places:**

1. **Every random draw rides on `Math.sin`.** `seededRand(seed)` is the fraction of `Math.sin(seed + 1) * 10000`
   (`exercise-library.ts:307`). `Math.sin` is not required to be bit exact across engines. Hermes calls the
   platform's `std::sin` (read in its source); V8 carries its own. A last bit difference only matters when a draw
   lands on a boundary, so it is rare, but it would move a program. **Caught by:** a table of `Math.sin` for every
   seed the lattice uses, compared bit for bit across V8, the phone today and Hermes; then the lattice itself on the
   phone.
2. **One sort depends on the phone's language.** `core-legs.ts:460` breaks a tie between two exercise names with
   `a.localeCompare(b)` and no locale. On a phone set to another language the tie can fall the other way: the same
   seed, a different program. This is true in today's app too, and it matters most for a public release. **Caught
   by:** the engine check with the phone's language changed. **Not fixed here:** the engine stays unchanged in this
   migration. It needs coach's ruling (measure how many lattice programs it can touch first).
3. **`Math.log` (4 calls, one interpolation in `cardio-progression.ts`) and `Math.pow` (1 call, the long run's
   growth in `nrc-race-bike-swim.ts`).** Same class as `Math.sin`. Whether a last bit survives the rounding that
   follows was not traced. **Caught by:** the lattice on the phone.

**Dates in the engine are safe:** `calendar.ts` builds every date from numbers (`new Date(y, m - 1, d)`), never from a
string. No `Date.parse`, no `Intl`, no `toLocale…` in the engine. `Math.random` appears nowhere in it. It has no bare
sort: 14 sorts, each with its own comparator (the tie-break above is inside one), and Hermes's sort is stable (read
in its source).

**In the logic to lift:** `swaps-edits.ts` has 2 `localeCompare` calls and 1 bare `.sort()`, `data-backup.ts` 1 bare
`.sort()` (bare sorts are by code unit, the same everywhere). They are read by hand in their slice, and the golden
records run under three time zones.

**On screens (rewritten, so rules for the new code):** 4 places build a date from a string
(`new Date(iso + 'T00:00:00')`), which the specification reads as local time; Hermes's handling was not confirmed in
its docs. 10 `toLocaleDateString` or `toLocaleString` calls pinned to `'en-US'`, and 4 `toLocaleString()` calls with no locale, which print
`1,234` or `1.234` by the phone's region. The rule for the new app: dates only through core's `_parseLocalDate`, and
every number and date an athlete reads printed by formatters in `core/src/format` that take no locale from the phone.
The numbers check (3.3) catches a slip.

### 4.3 What do CI and the checks become, and what do Mac runners cost?

| Today | Becomes |
|---|---|
| `unit and integration tests` (Linux, 11 min) | the same, plus the Jest screen tests and the engine under Hermes |
| `app and backend` (Linux, 1 min) | the server as today; the app half becomes type check, lint and Jest for `frontends/native` |
| `e2e` (Docker, 5 min) | the website and admin stay in Docker; the app's journeys move to Maestro in the macOS job |
| `native (iOS simulator)` (macOS, 3 min) | `expo prebuild`, an Xcode build for the simulator, the Maestro journeys, the boot marker |
| `TestFlight` gate, upload (macOS, 4 min), processed | the same three jobs calling the Expo build; a second lane for the beta app until cutover |
| The 60 second check's build lane | today's page build stays until the web app is retired; it gains the native app's type check and Jest. A Metro bundle is added only if it fits in 60 seconds (not measured) |

Both builds run in CI from phase 2 to cutover. Durations are from run 43035392583 (`dev`) and 42972111032 (`main`).

**Mac runner cost: nothing today.** The repository is public (read from the API), and standard GitHub runners are free
for public repositories. **If the repo goes private** (a decision already held, handoff §12): macOS is $0.062 a
minute against $0.006 for Linux, and the Free plan includes $12 a month. Today's Mac use is 3 minutes a push and 4 a
release. A React Native build with journeys is 15 to 25 minutes (estimate, not measured). At this month's pace, 99
pipeline runs in 31 days, that is roughly $90 to $155 a month if every push built it. The fix if it comes to that: run
the macOS job only when the native app's files change.

### 4.4 Can the new app pull the old `ia_` keys from the web view by itself?

**Not during the beta, and it does not need to.** Web view storage lives in the app's own container, keyed by bundle
id. The beta has a different bundle id (it must, so today's app keeps working), so it cannot see it.

**At cutover, probably yes:** the new app takes the real bundle id and installs as an update, so the old storage is
still on disk. A small Swift module could open a hidden web view on the old address (`app://localhost`) and read the
keys out. That is about a session of work and was not tried.

**The pick: use the backup file.** It already is every `ia_` key exactly as stored, its reader is tested, Mario is the
only person moving, and it leaves a file he holds. The web view's copy stays where it is as a second copy.

---

## 5. Risks, worst first

| # | Risk | How it gets caught |
|---|---|---|
| 1 | **A phase 1 slice misreads or damages Mario's live logs while he is training.** The lifted code runs on the only copy. | Golden records byte for byte before any slice ships. A backup saved before each install (the numbered steps in phase 1). The previous TestFlight build as the way back. (The freeze slice's hold until 2026-12-06 was lifted on 2026-11-12, decision 13.) |
| 2 | **The stored grid is not identical after the move** and logged runs flip off target (V202). | sha256 of every key at import, and the import refused on a mismatch. The rehearsal on a copy. The numbers check on every screen. |
| 3 | **The public build carries plans it may not carry.** The four race plans are another publisher's weeks in order, and its terms allow personal use only (handoff §12, D270 proposed). | It is the entry gate to phase 6: D270 shipped, or Mario rules otherwise. Named here so it is not found at review. |
| 4 | **The engine prescribes something else on the phone** (`Math.sin`, the language dependent sort, `Math.log`, `Math.pow`). | The engine check on today's app in phase 1 and on the new app in phases 2 and 5: 864 of 864 and HALF_MANNY's digest, once more with the phone's language changed. The `Math.sin` table. |
| 5 | **Coverage quietly lost in the rewrite.** 61 files and 3,044 assertions touch the page's elements. | The ledger with counts before and after. No deletion before cutover holds. A named break for every replacement. |
| 6 | **The native pieces do not survive the move:** the Live Activity, the widget, background GPS, three signed targets in CI. | The phase 2 spike. A real run and a real rest timer through TestFlight in phase 4. |
| 7 | **Dates shift in the lifted freeze:** week boundaries across daylight saving, a time zone change, a year end. **One instance is confirmed** (section 7: the Monday after the clocks go forward). | Golden records under three time zones and across those dates, in place since phase 1 step 1. The freeze slice last, with the most scenarios. |
| 8 | **Numbers and dates print differently** (the phone's region, Hermes's formatting). | Formatters in core that take nothing from the phone. The numbers check. |
| 9 | **Two apps to maintain for months.** Every feature built on the old app is built twice. | Mario's decision on a feature freeze (section 6). |
| 10 | **The ground moves:** an Expo SDK every two to four months, Hermes V1 new this year, Apple's yearly SDK deadline. | Pin SDK 58 until cutover. One upgrade, on purpose, before phase 6. |
| 11 | **The cutover update is refused or loses the container** (version order, the bundle id handover). | The first real build is 1.0.0, above every 0.x. The backup file is the data path, so the container is a bonus, not a need. Rehearsed on the simulator with an install over the Cordova build. |
| 12 | **The side by side beta needs Apple setup only Mario can do.** | Numbered browser steps at phase 2. No secret passes through a session. |
| 13 | **CI gets slow or, if the repo goes private, costly.** | Section 4.3. The macOS job run only when native files change. |

---

## 6. Mario's decisions

Each with the session's pick first.

1. **When is 1.0.0?** Pick: the first React Native build that takes the real bundle id, at cutover. By this repo's own
   rule a MAJOR is stored data that needs a migration, and that is the day it happens. Against: the App Store launch
   is the public milestone, and 1.0.0 could wait for it.
2. **The web app: freeze or retire?** Pick: freeze it on 2026-12-07 (fixes only), retire the Cordova build when
   cutover holds, and take the Pages page down at the App Store launch. Against: Pages is free and is a way to show
   the app without TestFlight.
3. **May phase 1 slices reach your phone before the race?** **Answered 2026-11-11: yes ("ok"), for v0.261.2, each
   install behind a backup saved first (phase 1's numbered steps). The freeze slice still waits for 2026-12-07.** Pick: yes for the small ones, each behind a backup you
   save first, and the freeze slice only after 2026-12-06. Against: any change under your logs three weeks from a
   race is a risk you do not need; holding all of phase 1 off `main` until December 7 costs about two weeks.
4. **The engine check on today's app.** **Answered 2026-11-12: yes, one line on the Bugs tab that runs the lattice and
   HALF_MANNY on the phone and prints how many digests match (D286, `docs/decisions/engine-check.md`). With it, GO for
   phase 2 once it ships.** Pick: yes, one line on the Bugs tab. It is the only way to learn what the
   phone prescribes today. Against: it is a visible change in a phase that promised none.
5. **Your real backup on the Mac for the rehearsal.** Pick: yes, in `temp/` (gitignored), deleted after. It never
   enters the repo or leaves the Mac.
6. **A feature freeze on the old app.** Pick: from December 7, bug fixes only. Can't run? (D249) and the recorder
   stages are built once, in the new app. Against: phase 3 is long, and you train on the old app the whole time.
7. **The race plans before the App Store (D270), and whether the repo goes private.** Pick: concur D270 and ship it
   after cutover; leave the repo public until then, since private costs the Mac minutes in 4.3.
8. **The language dependent sort in the engine.** Pick: coach measures it and rules after cutover, with D270. It is
   wrong today in the same way, and the engine does not change during the migration.
9. **The break rule for replacement tests (3.4).** Pick: approve it as written, as a rule for this migration only.
10. **The Family Controls entitlement.** Pick: ask Apple now for the main app. It is one form, approval can take
    weeks, and the bundle id will not change.
11. **The old web view storage after cutover.** Pick: leave it untouched for 90 days, then delete on your word.
12. **The clocks-forward defect (section 7).** Pick: rule it and fix it inside phase 1's freeze slice, after
    2026-12-06, as its own D-code: that slice rewrites those lines anyway, and nothing reads wrong for you before
    2027-03-14. Against: it is a real defect in the app today, and a southern hemisphere athlete would meet it in
    October; but there is no such athlete until the public build.
13. **The December 6 holds.** **Answered 2026-11-12: lifted** ("dont worry about the december 6 race, lets get this
    moving"). The freeze slice (phase 1 step 3), the cutover (phase 5) and moving Mario's real data no longer wait for
    2026-12-07. A backup saved before each install still guards his logs, and each phase still starts on his GO.
    Decision 3's "the freeze slice still waits" and decision 12's "after 2026-12-06" are superseded by this one.

---

## 7. Found along the way, and sources

**Found by the golden records (2026-11-11), not ruled and not fixed:**

- **The Monday after the clocks go forward reads as the week before.** `calcCurrentWeek` and `refreshProgram` count
  days as milliseconds over 86,400,000. After a spring change a local midnight is an hour short of a whole day, so
  from then on every Monday reads as the previous week; Tuesday to Sunday read right. Shown twice: New York on Monday
  2027-03-15 (the app reads week two, the calendar says three), and Auckland on Monday 2026-10-05 (week five for six).
  The autumn direction reads right, which is Mario's case this year. The golden record holds today's behaviour, so the
  move into core reproduces it; the fix is its own ruling (decision 12).
- **A seeded test config the wizard refuses.** The swim 500 config carries no timed 500, which the wizard has required
  since it asked for one. The sweep gives it one. Nothing in the app is wrong.

**Found by the fourth lift slice's measure (2026-11-11), not ruled and not fixed:**

- **A session moved off a day that already has a logged lift comes back on that day.** The rest sheet's Move offers
  any day with no completion and no logged field. A logged lift, a set draft and a part skipped alone are none of
  those, though each snapshots the day. Move such a day's session onto a rest day and train it there, and both days
  hold a snapshot; the next launch restores both and reads the move as already applied, so the session shows on the
  old day (open, with its logged lift) and on the new one (trained). Shown on HALF_MANNY, week 1: Monday with one
  lift logged, moved to Wednesday (`tests/measure/stored-state_first-touch.md`). Nothing stored is lost or
  rewritten: both snapshots, the lift log and the move are as written. The golden case "a touched day edited, then
  its session moved" holds today's bytes, so the freeze slice reproduces them and a fix shows as a reviewed diff.
  The fix is its own ruling and belongs with the freeze slice (it touches the freeze, the move and what the rest
  sheet offers). Until then: a session with anything logged on it is better finished where it is than moved.

**Found by the fifth lift slice's break check (2026-11-11), not ruled and not fixed:**

- **The swap nudge counts taps, not sessions.** Its comment says three sessions running of one lift traded for one
  replacement make a preference, and the app should offer to make it standing. The count goes up on every swap tap,
  and an undo does not take one off: swap a lift, undo it, and swap it again, three times on one day, and the nudge
  comes up. Shown on HALF_MANNY, week 1 Monday (the golden case "a day's swaps and edits, made and undone, and the
  nudge", its `nudged` record). Nothing stored is lost or wrong; the nudge only asks, and turning it down marks the
  pair offered for good. The golden record holds today's count, so a fix shows as a reviewed diff. The fix is its own
  ruling (coach: what counts as a session), after cutover or on Mario's word.

**Where the repo and the request differed:**

- **"How sabotage covers the new tests":** there is no sabotage suite. It was deleted on purpose. Section 3.4
  proposes a one time break per replacement in its place.
- **"Every backup file the current app has ever written":** there is one format, written by 17 releases. The corpus
  in phase 1 covers each.
- **"The logic lifts out of the legacy page":** `exStoreKey` is already in the engine. Everything else named is in the
  legacy script.
- **The tab bar fix (v0.261.1, D285):** on the simulator's Safari a tap on a button already takes focus off a field.
  The part of the fix with a measured effect is the swipe deck's (`tests/measure/tab-bar_sheet-focus.md`).

**Sources (read 2026-11-11):**

- Expo releases: [changelog](https://expo.dev/changelog), [SDK 58](https://expo.dev/changelog/sdk-58),
  [SDK 55](https://expo.dev/changelog/sdk-55) (the New Architecture only), [SDK 56](https://expo.dev/changelog/sdk-56.md)
  (Hermes V1 by default).
- Widgets and Live Activities: [expo-widgets](https://docs.expo.dev/versions/latest/sdk/widgets/),
  [expo-apple-targets](https://github.com/EvanBacon/expo-apple-targets),
  [Expo's post](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo.md).
- Screen Time: [react-native-device-activity](https://socket.dev/npm/package/react-native-device-activity), Apple's
  forum threads on the entitlement ([779449](https://developer.apple.com/forums/thread/779449),
  [781828](https://developer.apple.com/forums/thread/781828)).
- NFC: [react-native-nfc-manager](https://www.pkgstats.com/pkg:react-native-nfc-manager).
- Hermes: [Intl on iOS](https://raw.githubusercontent.com/facebook/hermes/main/doc/IntlAPIs.md),
  [the Math table](https://raw.githubusercontent.com/facebook/hermes/main/lib/VM/JSLib/MathStdFunctions.def)
  (`std::sin`, `std::log`), [the sort](https://raw.githubusercontent.com/facebook/hermes/main/lib/VM/JSLib/Sorting.cpp)
  (stable), [date parsing reports](https://dev.to/osamaqarem/parsing-custom-dates-in-js-3kl8).
- Storage: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (the synchronous key value store).
- CI: [runner prices](https://docs.github.com/en/billing/reference/actions-runner-pricing),
  [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) (public repositories free),
  [Maestro on iOS](https://docs.maestro.dev/cloud/ci-integration/github-actions/maestro-github-action-for-ios),
  [Expo's e2e guide](https://docs.expo.dev/tutorial/cicd/e2e-tests.md).
- The web view's storage: [Apple forum 773434](https://developer.apple.com/forums/thread/773434),
  [a Cordova migration plugin](https://github.com/danicholls/cordova-plugin-migrate-localstorage).
- App Store: [upcoming requirements](https://www.developer.apple.com/news/upcoming-requirements/) (Xcode 26 and its
  SDKs since 2026-04-28). The privacy manifest and location review rules were not checked today.

**Not checked, said so above:** EAS pricing, a Hermes binary for Linux, Hermes's reading of a date string with no time
zone, TestFlight's Previous Builds wording, the time a Metro bundle takes, how long a React Native build takes on a
GitHub Mac runner.
