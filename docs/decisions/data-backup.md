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
     (**Half Manny. 14 weeks from 2026-08-31. Active. 2 days marked.**), and each key with its size and its full
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
