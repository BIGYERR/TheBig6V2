# Data backup: decisions

The athlete's data in one file they can keep, and load on any phone. Measure: `tests/measure/data-backup_stored-keys.js`
and its saved report. Tests: `tests/unit/data-backup.test.ts` and `tests/integration/data-backup.test.ts`.

## D264 P-BACKUP: save a backup file, load it on any phone

- **Date:** 2026-10-30. **Ruled by:** Mario chose the order ("Backup first", 2026-10-30): one backup file now, accounts
  with sync later as their own milestone, the file's format built so the sync can carry it. The session ruled the form
  (siting, file format, copy), which CLAUDE.md leaves to it. No coaching doctrine is involved: no program output moves.
- **Finding** (measure on v0.252.0):
  - Everything the athlete has lives in the browser storage of one address, and nowhere else. The backend keeps device
    check-ins only, in memory and a JSON file on a Heroku disk that a restart wipes; it has no database and no accounts.
  - The app writes 17 key families, every one starting `ia_`: `ia_programs` (each program with its whole week grid),
    `ia_active`, and per program `ia_logs_`, `ia_exw_` (set weights), `ia_hist_` (what each day showed), `ia_comp_`,
    `ia_moves_`, `ia_swaps_`, `ia_swapct_`, `ia_edits_`, `ia_wild_`, `ia_reminded_`, `ia_remind_last_`,
    `ia_season_shown_`, `ia_pop_idx_`, `ia_pop_dismiss_`, and `ia_theme`. Of 49 storage calls, 16 build their key in
    code, and each resolves to one of those families (`key`, `memKey`, `lastKey` in `popups-streaks-reminders.ts`,
    `editStoreKey`, `swapStoreKey`, `swapCountKey` in `swaps-edits.ts`, `THEME_KEY` in `theme.ts`, the purge list in
    `program-manage.ts`). The engine, the Angular screens and the native plugin make no storage call.
  - No key belongs to one device: the backend's device id lives in the website, not the app. `ia_theme` is the
    athlete's own choice and travels with the rest.
  - The live web app (`bigyerr.github.io`), the native app (`app://localhost`, `frontends/app/config.xml`) and `/pwa/`
    each have their own storage. An athlete who moves from the web app to the native app starts empty, and nothing in
    the app can carry the data across. Deleting the app or clearing website data loses all of it. Handoff §12 (Delivery
    and data, item 2) already lists export and import as needed before the app changes address.
  - The native web view cannot save a file the page makes. The web app can, through the share sheet or a download.
- **Changes** (items 3 to 5 amended by Amendment 1, below):
  1. **Siting.** A "Your data" block on the Bugs page, under Look (the page that holds the app's one setting), in the
     legacy page and the Angular screen alike. Its caption: "Your logs live on this phone. Save a backup to keep them
     safe or move them to a new phone." Two buttons: **Save a backup** and **Load a backup**.
  2. **The file.** JSON, named `asylum-backup-YYYY-MM-DD.json` by the phone's local date:
     `{"kind":"asylum-backup","format":1,"version":"<ia-version>","made":"<ISO time>","data":{...}}`. `data` holds every
     `localStorage` key that starts `ia_`, sorted, each value exactly the string stored (never parsed and written again,
     so a load puts back the same bytes). Nothing else goes in.
  3. **Save.** In the native app, the share sheet, through a new `share` call on the ia-island plugin (it writes the
     file to the app's temporary folder and opens the iOS share sheet). In the web app, the share sheet
     (`navigator.share` with the file) when `navigator.canShare` accepts the file, else a download. The share sheet is
     its own confirmation, so it shows no toast, and a cancel is silent. A download shows "Backup saved." A failure
     shows "Backup failed. Try again." With no program stored (`ia_programs` missing or an empty list) there is nothing
     to keep: no file is made, and the toast reads "Nothing to back up yet."
  4. **Load.** A file picker (`.json`). The file is checked before anything changes: it parses as JSON, `kind` is
     `asylum-backup`, `data` is an object whose every key starts `ia_` and every value is a string, and
     `data.ia_programs` parses as an array. A `format` above 1 is refused with "This backup is from a newer app. Update
     the app first." Any other failure: "That file is not an Asylum backup." Nothing changes on either refusal.
  5. **Confirm.** A good file shows in the block: "Backup from Oct 30. 2 programs. Loading it replaces everything on
     this phone." (the date it was made, in the phone's time, printed as the app prints dates elsewhere; "1 program"
     for one; archived programs count), with
     **Load it** and **Cancel**. Load it removes every `ia_` key on the phone, writes every key in the file, and
     reloads the app, so it boots on the loaded data as it would on its own. A key that does not start `ia_` is left
     alone. If the phone refuses a write (storage full), every key the phone held before is put back, nothing else
     changes, and the toast reads "Loading failed. Nothing changed."
- **Does not change:** a load replaces and never merges (merging two histories collides with the per-day week freeze);
  no server, no account, and nothing is sent anywhere (the file goes only where the athlete sends it); no CSV and no runs
  archive (the next step, its own ruling); no version is compared (`format` is a counter for the file's shape, not a
  release version, and the file's `version` is a record only); program output does not move (HALF_MANNY's digest stays).
- **Expected values** (typed by hand from this ruling):
  - Storage `{ia_programs:'[{"id":"P1"}]', ia_active:'P1', ia_logs_P1:'{"w1_mon":{"notes":"x"}}', other:'y'}` backs up
    to `data` with exactly `ia_active`, `ia_logs_P1`, `ia_programs`, in that order, each value the same string; `kind`
    `asylum-backup`; `format` 1; `version` the page's `ia-version`.
  - The file made on 30 Oct 2026, local time, is named `asylum-backup-2026-10-30.json`.
  - Refused as not a backup: text that is not JSON; `kind` other than `asylum-backup`; a key `theme`; a value that is a
    number; `ia_programs` of `{}`; no `data`. Refused as newer: `format` 2.
  - Loading that file over `{ia_programs:'[{"id":"P9"}]', ia_active:'P9', ia_logs_P9:'{}', keep:'1'}` leaves exactly
    the file's three keys plus `keep:'1'`; `ia_logs_P9` is gone.
  - The confirm line for a file made 2026-10-30 with two programs reads "Backup from Oct 30. 2 programs. Loading it
    replaces everything on this phone."; with one, "1 program".
  - Storage with no `ia_programs`, or `ia_programs` of `[]`, makes no file.
  - A backup taken from an app booted on HALF_MANNY with a logged day, loaded into a freshly booted app, boots the same
    active program with the same logged entry.
- **Proof the tests cannot make:** the native share sheet. CI's native job compiles the plugin; the share itself is
  checked on the simulator or the phone.
- **Release:** v0.253.0 (Minor, Mario's pick, 2026-10-30).

## D264 Amendment 1: the date as the app prints it, an empty save, a refused write

- **Date:** 2026-10-30. **Ruled by:** the session, before any code was written, on reading the code the build would
  touch. No new D-code; the text above already carries it.
- **Changes:** (1) the confirm line prints the date as the app prints dates elsewhere, `Oct 30`, not `30 Oct`
  (`toLocaleDateString('en-US', {month:'short', day:'numeric'})`, as in `overlays.ts` and `wizard.ts`); (2) Save with no
  program stored makes no file and toasts "Nothing to back up yet.", so no backup exists that Load would refuse; (3) a
  write the phone refuses during a load puts back every key it held, and toasts "Loading failed. Nothing changed."
- **Release:** v0.253.0, with D264.

## D287 P-NATIVEIMPORT: the Expo app loads a backup, read only, and checks every key (2026-11-13)

- **Date:** 2026-11-13. **Ruled by:** the session (form and copy, which are the session's to decide); the feature is
  Mario's brief for the React Native migration's phase 2, session 2 (`MIGRATION.md`, phase 2: "Load a backup, read
  only"), 2026-11-13. **Bump:** none, Mario 2026-11-13 (a Post-v0.262.0 native pass, as session 1's shell was).
  **Shipped:** Post-v0.262.0, no build (`frontends/native`, on `chat/sqlite-store` until Mario merges it).
- **The finding (measured, `tests/measure/native-store_sqlite-roundtrip.mjs`, its report beside it):** the 17 corpus
  backups loaded into SQLite through expo-sqlite/kv-store 58.0.17's own statements (under `node:sqlite`) read back
  136 of 136 keys equal (1,514,057 bytes), and core's `sha256Hex` agrees with `node:crypto` on all 136. Emoji, NUL,
  an empty value and a 6 MB value come back whole. **A lone surrogate does not:** SQLite stores text as UTF-8, so
  `'half \uD83D pair'` comes back with U+FFFD in its place, and its sha256 is the same as the original's, because
  both encode to the same bytes. A check by hash alone would pass it. No value the app writes holds one (every
  `ia_` value but the ids is `JSON.stringify` output, which escapes a lone surrogate), but a check must not rest on that.
- **What changes (the Expo app only; today's app, its page and core do not change):**
  1. **The store.** Core's `StateStore` on SQLite (`frontends/native/src/store/sqlite-store.ts`), standing on
     expo-sqlite/kv-store's synchronous `SQLiteStorage` (`getItemSync`, `setItemSync`, `removeItemSync`,
     `getAllKeysSync`), one database, `iron-asylum-state`, in the Expo app's own container
     (`phone-store.ts`; the bundle id `com.bigyerr.ironasylum.next` is not today's app's). Keys and values go in as
     strings. Core's `state-*.ts` readers and writers take it unchanged.
  2. **The import** (`backup-import.ts`): core's `readBackupText` checks the file, core's `loadBackupInto` loads it all
     or nothing, then every `ia_` key the store holds is checked against the file: the same key set, and each value
     equal to the file's character for character and by sha256. Any miss puts back what the store held before, so a
     refused import keeps nothing.
  3. **The row,** on the Expo app's one screen after the Engine row: label **Backup**; note **Loads a backup file
     into this app and checks every key. Writes nothing back.**; one button, **Load a backup**, which reads
     **Checking** while it works. The picker copies the file into the app's cache before it is read
     (`copyToCacheDirectory: true`); the app writes no file and shares none. Under the button, the line, then what the
     store holds: **Holds 8 keys.** (**Holds nothing yet.** when empty), each program as core's readers find it
     (**THE HALF MANNY. 14 weeks from 2026-08-31. Active. 2 days marked.**, the program's own name), and each key with its size and its full
     sha256.
  4. **The lines:** loaded, **Loaded 8 of 8 keys. Every hash matches the file. Saved by version 0.261.0.**; a newer
     file, **This backup is from a newer app. Update the app first.** and not a backup, **That file is not an Asylum
     backup.** (today's app's own words); a refused write, **The phone refused the write. Nothing was kept.**; a
     mismatch, **1 key does not match the file. Nothing was kept. First miss: ia_note_P1 differs.**; a file that
     cannot be read, **That file could not be read. Nothing was kept.**
- **What deliberately does not change:** today's app, its storage and its backup; the backup format; core (the
  import calls core's reader, loader and SHA-256 as they are); program output. The Expo app sends nothing anywhere.
- **Expected values** (typed by hand; `tests/unit/native-backup-import.test.ts`, `tests/integration/native-store.test.ts`):
  every corpus backup imports with each key's value, size (`Buffer.byteLength`) and sha256 (`node:crypto`) the
  file's, and one program, `prog_1788008400000`, 14 weeks from 2026-08-31, active, 2 days marked; the lone surrogate
  case refuses as a mismatch and the store holds exactly what it held before; a refused third write, a dropped key and
  a key the remove leaves behind each refuse and keep nothing.
- **Proof the tests cannot make:** expo-sqlite's own SQLite build and Hermes's strings crossing into it and back,
  `sha256Hex` under Hermes, the picker and the file read, the screen. Checked on the simulator (below) and, at the
  phase 2 exit gate, on Mario's phone with a copy of his backup.
- **On the simulator** (iPhone 17 Pro, iOS 26, the Release build under Hermes, 2026-11-13): the corpus backup of
  v0.261.0, copied into the simulator's Files and picked there, read **Loaded 8 of 8 keys. Every hash matches the
  file. Saved by version 0.261.0.**, the program **THE HALF MANNY. 14 weeks from 2026-08-31. Active. 2 days marked.**
  The app's own database file, copied off the simulator and read with `node:sqlite`: the table expo-sqlite made,
  `storage (key TEXT PRIMARY KEY NOT NULL, value TEXT)`, holding the file's 8 keys, each equal to the file's by value
  and by sha256 (`node:crypto`). The picked file was byte for byte the same afterwards. After a cold relaunch the row
  read **Holds 8 keys.** with the same program and hashes. Today's app sat beside it on the home screen, untouched.
- **On Mario's phone** (2026-11-13, IA Next 0.262.0 (100) from TestFlight, a backup saved by today's app at 0.262.0,
  his screenshot): **Loaded 36 of 36 keys. Every hash matches the file. Saved by version 0.262.0.** and **Holds 36
  keys.** Three programs: TEST TING, 12 weeks from 2026-07-06, 35 days marked; THE HALF MANNY, 14 weeks from
  2026-08-24, active, 50 days marked; PRT TING, 11 weeks from 2026-09-23, 15 days marked. The phase 2 exit gate's
  import leg is seen. Today's app was not touched: the file was a copy, and the beta writes nothing back.

## D289 P-NATIVEWRITES: the beta may write to its own copy, from the session that builds logging (2026-11-14)

- **Date:** 2026-11-14. **Ruled by:** Mario ("Yes, its own copy"), on the session's recommendation, at the opening
  of the React Native migration's phase 3. **Amends:** D287 (the copy is loaded read only), from the session that
  builds logging on; D287 stands until then. **Bump:** none (a Post-v0.262.2 native pass; today's app, its page and
  core do not move). **Shipped:** Post-v0.262.3, with the session that built set logging and Call it (the entry
  below); the beta's next build carries it.
- **The finding (measured, `tests/measure/native-deck_reads.md`):** every write today's deck makes ends in a writer
  core already holds (the lift log, the day's snapshot, the day's log, the day's status, the skips and the swaps).
  What is still the page's is the code around them, which reads the fields off the screen and redraws. The launch's
  own two writes (an older program repaired, the day edits of frozen weeks dropped) are already held equal to the
  page's on every launch of the stored-state histories, through a store that writes (`tests/support/native-launch.ts`,
  its third check). Each screen's exit gate in phase 3 is "Mario has used it on the phone", and a deck that cannot
  log cannot be used.
- **What changes, when logging is built (the Expo app only):**
  1. The beta writes to its own store and nowhere else: the SQLite database in its own container
     (`com.bigyerr.ironasylum.next`, `phone-store.ts`). It has no path to today's app's storage, and gains none.
  2. Its launch is handed the store itself, not the one that drops writes; `store/read-only-store.ts` goes.
  3. Loading a backup still replaces the copy whole, all or nothing, checked key by key (D287's import, unchanged).
     What was logged in the beta since the last load is gone with it, by design.
  4. Bugs says so in words, beside the Backup row. The copy, proposed, to be confirmed when it is built: **Sets you
     log here stay in this app. Today's app does not see them. Loading a backup replaces everything here.**
- **What deliberately does not change:** today's app, its storage, its backup and its TestFlight lane; the backup
  format; core's writers (the beta calls them as they are); program output. Nothing moves from the beta to today's
  app before the cutover (phase 5), which has its own GO. Until the logging session, D287 holds: no screen of the
  beta writes, and the launch is still handed the store that drops writes.
- **The counter-argument, recorded:** a set logged in the beta by mistake is a set missing from today's app, the only
  real copy. And once the beta has written, "every hash matches the file" is no longer true of its copy until a
  backup is loaded again; the side by side of a later screen starts by loading one.
- **Expected values, for the session that builds it:** after the same taps on the same keys, the beta's store holds
  each `ia_` key equal to today's page's, value for value (the stored-state histories, as the launch is held today);
  a backup loaded after a logged set leaves the store the file's, key for key and hash for hash.

## D289 as built (Post-v0.262.3, 2026-11-14)

- **The store is the real one.** `store/read-only-store.ts` is gone. The launch (`this-week/week-screen.ts`
  `liveProgram`) is handed the store itself and makes each write today's launch makes, in today's order: the
  program the launch loads written to `ia_active` or a pointer that leads nowhere removed (`pickActive`, the page's
  init and `loadActiveProgram`), the lift log's old keys folded and stored when the fold changed it (`foldLiftLog`),
  then core's `refreshStoredProgram` (an older program repaired, the day edits of frozen weeks dropped). Measured
  first (`tests/measure/native-deck-logging_writes.md`, section A): of 118 launches the page alone wrote the fold on
  1 and the pointer on 3, all four built for the measure, and on those three the beta had loaded a different
  program than today's.
- **The deck writes** through `deck/deck-writes.ts` alone, into the same store: nine of core's writers, named in
  `docs/decisions/swipe-deck.md`, its last entry.
- **Loading a backup is unchanged** (D287's import): it replaces the copy whole and checks every key. Proved after
  logged sets: the store then differs from the file by at least three keys, and after the load holds the file's keys
  and no other, each equal by value and by sha256 (`tests/integration/native-deck-logging.test.ts`).
- **The Bugs line** (Mario, 2026-11-14, asked once with the proposed copy recommended: "The proposed copy"), a
  second line under the Backup row's note, which stays: **Sets you log here stay in this app. Today's app does not
  see them. Loading a backup replaces everything here.**
- **Not written by the beta:** the pop-ups' keys (`ia_pop_idx_`, `ia_pop_dismiss_`, `ia_season_shown_`,
  `ia_remind_last_`, `ia_reminded_`). The completion pop-up and the day-after reminder are not built, so those keys
  stand as a loaded backup left them. This is the one place the beta's store differs from today's after the same
  taps, and the tests name it.
- **Held:** after its launch the beta's store equals the page's on every launch a test phone makes, and after
  every tap of the deck walks (1,246 taps for HALF_MANNY, 11,818 across the ten programs).

## D297 P-NEXTKIND: the beta saves its backup under a kind of its own (2026-11-27)

- **Date:** 2026-11-27. **Ruled by:** Mario ("Yes, its own kind"), on the session's recommendation, before Save a
  backup was built in the Expo app (the React Native migration's phase 3, row 7, the Bugs tab). **Amends:** D287, whose
  row wrote no file and shared none; D289 stands. **Bump:** none (a Post-v0.263.0 native pass; today's app, its page
  and core do not move). **Shipped:** Post-v0.263.0, no build of today's app (`frontends/native`, on `chat/bugs-tab` until Mario merges it; the beta's next build carries it).
- **The finding (measured, `tests/measure/native-bugs-tab_today.md`, section E; ten phones):** the beta's store holds
  the same `ia_` keys, so core's `takeBackup` on it writes today's file. Picked in today's app, a file saved that way
  drew today's question on 10 of 10 phones (Backup from the day. N program. Loading it replaces everything on this
  phone.), and Load it replaced every key with the beta's, none of today's left, on 10 of 10. The same file under the
  kind `asylum-next-backup` was turned away on 10 of 10 (**That file is not an Asylum backup.**, no question), and so
  was the same file as format 2 (**This backup is from a newer app. Update the app first.**); after Load it today's
  keys were untouched on 10 of 10 each. Mario's rule: nothing moves from the beta to today's app.
- **What changes (the Expo app only):**
  1. **The file the beta saves** is core's snapshot of the beta's own store (every `ia_` key as stored, the release,
     the instant) with one word changed: its `kind` is `asylum-next-backup`. Its format stays 1. Its name is
     `asylum-next-backup-<date>.json`, the phone's local date, so the two apps' files are told apart in Files.
  2. **Where it goes:** written into the beta's own cache folder, in its own container, and handed to iOS's share
     sheet. It goes only where the athlete sends it. Nothing is sent anywhere else, and no key is stored by a save.
  3. **The beta loads both kinds:** today's file (`asylum-backup`) and its own. Its own kind is read by core's reader
     as it is: the beta hands the reader the same file under today's kind, and core does not change. Any other kind
     is **That file is not an Asylum backup.**
  4. **Today's app turns the beta's file away** in its own words, with no question, and keeps every key. That is
     today's reader as it has stood since v0.253.0; nothing in today's app is changed to make it so.
- **What deliberately does not change:** today's app, its page, its storage, its backup and its TestFlight lane;
  core (`state-backup.ts`, `BACKUP_KIND`, `BACKUP_FORMAT`); the format's counter; what a backup holds; D287's check of
  every key after a load; D289's words on Bugs; program output.
- **Why the kind and not the format:** format 2 would make today's app say the file is from a newer app and to
  update first, which sends the athlete after an update that does not exist, and it would spend the format's own
  counter on something that is not a change of shape.
- **The counter-argument, recorded:** a backup the beta saves is then of no use anywhere but the beta. That is
  Mario's rule today. The kind is settled again at the cutover (phase 5), when the new app becomes the app: it reads
  today's files for good (`MIGRATION.md`, rule 4), and which kind it then saves under is that session's question.
- **Expected values** (typed by hand): the kind `asylum-next-backup`; format 1; the name
  `asylum-next-backup-2026-11-27.json` for a save at any local time on 2026-11-27; the file's `data` equal to the
  beta's store, key for key; today's page on that file: **That file is not an Asylum backup.**, no question, every
  key as it was; the beta on that file and on today's: the question, then every key the file's.

## D264 and D297 in the Expo app: Your data on the Bugs tab, as today's (Post-v0.263.0, the migration's phase 3, row 7)

- **Date:** 2026-11-27. **Ruled by:** Mario for the file's kind (D297, above) and for the tab built as today's (his
  brief for the session); the session for form. No new D-code beyond D297: the block, its words, the question and
  the start afresh are D264's, carried unchanged. **Amends:** D287's row (its words, its line and its list of keys
  go; its check stays). **Bump:** none. **Shipped:** Post-v0.263.0, no build of today's app (`frontends/native`, on `chat/bugs-tab` until Mario merges it; the beta's next build carries it).
- **The finding (measured, `tests/measure/native-bugs-tab_today.md`, sections C to F; ten phones):** today's Save
  hands one file to the share sheet and stores nothing; a phone with no program saves nothing and says **Nothing to
  back up yet.**; a share that fails says **Backup failed. Try again.** Today's Load reads the picked file and changes
  nothing, shows what it is and asks, **Load it** or **Cancel**; Load it replaces every `ia_` key and reloads the
  page, which starts on This Week under the file's look, or on Programs when the file holds no program to open; a
  refused write puts back what the phone held and says **Loading failed. Nothing changed.** The beta loaded as soon
  as a file was picked, stayed on Bugs, and printed a line and a list of keys of its own.
- **What changes (the Expo app only):**
  1. **The block is today's** (`frontends/native/src/bugs/`): the label **Your data**, today's note, **Save a
     backup** and **Load a backup**, the line under them, and **Load it** and **Cancel** while a file waits. D289's
     words stand under the note until the cutover.
  2. **Save** (D297): the file's name and text from `bugs-writes.ts saveBackup`, written into the beta's own cache
     and handed to iOS's share sheet (React Native's `Share`, no new package). A cancel is silent, as today's.
  3. **Load** asks first. The picked file is read and nothing is stored (`bugs-screen.ts choose`); the line is
     today's, by the phone's local day. Load it loads through D287's checked load (`backup-import.ts loadChecked`):
     all or nothing, then every key against the file. A refused write, or a key that does not match, puts back what
     the store held and speaks today's toast.
  4. **The start afresh.** A load that takes builds the app's shell again from the store, so nothing a screen kept
     for the app's life outlives it, as today's reload. It opens This Week, which makes its launch, or Programs when
     no program opens; there a pointer that leads to no program is cleared, as today's init clears it
     (`bugs-writes.ts firstScreen`; the same holds at a cold start, where the beta still opens Bugs with no program).
- **What goes from the beta's screen, with the reason:** D287's line (**Loaded N of N keys. Every hash matches the
  file.**), the count of keys, each program's line and each key with its size and its hash. Today's screen has no
  place for them, and a load that takes now leaves Bugs at once. The check they reported still runs on every load;
  a miss refuses the load. D287's own words for a refusal and a mismatch go with them: today's one toast stands
  for both. `importLine` is removed; `importBackup`, `misses` and `held` stay, and the tests still use them.
- **What deliberately does not change:** today's app, its page and core; the backup's format; D287's check; D289;
  what a backup holds; program output.
- **Expected values** (typed by hand, `tests/unit/native-bugs-tab.test.ts`): the words above; **Backup from Nov 27.
  1 program. Loading it replaces everything on this phone.** for a file made at 17:00 UTC on 2026-11-27, and still
  Nov 27 for one made at 03:30 UTC on the 28th, read in New York; the first tab by the store (ten cases); a lone
  surrogate refused with today's toast and the store as it was.
- **What the tab keeps while another tab is open:** today's screen stays in the page behind the other tabs, so a
  report half typed and its line, a file waiting on its question, and the engine check, which runs on, are all
  there when the athlete comes back; a reload starts them again. The beta's screen is built when its tab opens,
  so the app holds the three for its life (`bugs/Bugs.tsx BugsState`, `engine-check-state.ts`), and a start
  afresh makes them again. Found on a last reading of the screen's code, after the third build, and built then.
- **Left as it is, and said:** the file a save writes stays in the beta's cache until iOS clears it or a save on
  the same day writes over it; the app deletes no file. A cold start with no program still opens Bugs, the beta's
  own from before it could build a program, where today's opens Programs; after a load it opens Programs.
- **Proof** (the walk is `tests/support/native-bugs-tab.ts`; the hand tables `tests/unit/native-bugs-tab.test.ts`): on The
  Half Manny at each of its five stretches and on the ten seeded programs, the tab worked through on today's page
  and on the beta over the same keys. A program's walk is 11 looks, 5 launch reads, 9 reports over a stand-in for
  the form, 3 saves, 22 files picked and 21 taps of Load it, 5 of which load and are followed by the start afresh
  on both. After every tap the two stores hold each `ia_` key equal, and the toasts, the look drawn on, the line
  under Your data, its question and the report's line read the same. The unit and integration tests pass, 2,699 with 2 skipped, in 125 files (the tab's own: 40 in `tests/unit/native-bugs-tab.test.ts`, 3 in `tests/integration/native-bugs-tab.test.ts`), and the ten program sweep of the same name passes.
  Eight tests of older files that named the old screen by rule were changed, and each is red on the commit before
  on a copy of its tree (`tools/tree-at.mjs`: 8 failed, 210 passed). The three new test files cannot load there:
  `git cat-file -e HEAD:frontends/native/src/bugs/bugs-screen.ts` fails. 197 breaks of the tab's rules, every one red on the final code (`tests/measure/native-bugs-tab_breaks.md`). On the way: the first part of the first list, run alone, let none of 45 through; that list's whole set let 3 of 178 through, each a break that changed nothing (it took out half of a rule the code keeps twice), and each was made a real break; then 19 breaks were added for what the tab keeps while another tab is open and the whole set ran again, which let 1 of 197 through, a break whose own replacement had gone stale with that change; it was put right and run again alone.
- **Seen on the simulator** (iPhone 17 Pro, iOS 26.5, the Release build under Hermes, four builds, the last one on
  the final code). **The look, beside today's own app** (0.255.2 on the same simulator: the same screen but for the
  Engine row), read from the pixels of both screenshots: the 15 lines of the first screen each stand within 0.7 of
  a point of today's by their tops; at the foot the build's label stands at 692.0 on both. The first build stood
  up to 4.3 low down the page: WebKit lays a line whose height the CSS gives as a fraction at the whole point
  under it. Two things the numbers did not show were seen in the pictures and fixed: today's screen scrolls whole,
  its top bar with it, and its build label is in Menlo. **Each control:** Day and Night redraw the app and iOS's
  own picker and keys follow; Save a backup raised the share sheet on `asylum-next-backup-2026-11-27` (JSON), and
  the file saved from it held 37 keys, equal to the store's 37, under the kind `asylum-next-backup`, format 1;
  Load a backup picked that file and drew the question; Load it started the app afresh on This Week under the
  file's look; Send with nothing typed drew its line and sent nothing; a drag closed the keys with the text kept;
  the engine check read Lattice 864 of 864 match. Half Manny matches. On the fourth build: a report typed, the
  check started, another tab opened and Bugs opened again, the words still in the field and the check's line
  further on. No report was sent. The simulator's store
  was saved aside before the first build and put back after (`278ba57f3f6a382b`, 36 keys, before and after), and
  the file the save left in the simulator's Files was removed. **On Mario's phone, IA Next 131** (2026-11-27, no
  screenshot; run 46096340908): "All good on 131, got Sent ✓". He was asked to tap Day, Night and Auto, Save a
  backup, Load a backup and read its question, Load it, leave a report typed and come back to it, and run the
  check. Nothing named to fix.
