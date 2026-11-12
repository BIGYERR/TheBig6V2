# Stored state: the backup's functions, what each reads and writes, and who calls it (on v0.261.7)

Read 2026-11-11 by `grep -rnw` of each name over `frontends/app/src`, `frontends/common`, `core/src`, `tests/` and
`tools/`, before the seventh lift slice. `frontends/app/src/legacy/src/js/data-backup.ts`, 126 lines, D264
(`docs/decisions/data-backup.md`).

| Function | Reads | Writes | Called by |
|---|---|---|---|
| `BACKUP_KIND`, `BACKUP_FORMAT` | | | `readBackup`, `backupSnapshot`; typed by hand in `tests/unit/data-backup.test.ts` |
| `_backupKeys` | `iaStore.keys()` | | `backupSnapshot`, `loadBackupData` (twice) |
| `backupSnapshot` | every `ia_` key, `IA_VERSION`, the clock | | `saveBackup`; the records (`tests/integration/stored-state.test.ts`, `tests/sweeps/data-backup.test.ts`, its corpus builder), `tests/integration/data-backup.test.ts` |
| `_programCount` | | | `readBackup`, `saveBackup`; `tests/unit/data-backup.test.ts` (lifted alone, handed to `readBackup`) |
| `readBackup` | the file's text | | `readBackupFile`; the records (both), `tests/unit/data-backup.test.ts` (lifted alone), `tests/integration/data-backup.test.ts` |
| `loadBackupData` | every `ia_` key | removes every `ia_` key, writes the file's; on a refused write puts back what was held | `applyBackup`; the records (both), `tests/integration/data-backup.test.ts` |
| `backupFileName` | the clock | | `saveBackup`; `tests/unit/data-backup.test.ts` |
| `backupMessage` | | | the page's `backupFileChosen`; the Angular Bugs screen (`bridge.call`); `tests/unit/data-backup.test.ts` |
| `applyBackup` | | through `loadBackupData`; a toast; `location.reload()` | the page's `backupLoadIt`; the Angular Bugs screen; `tests/integration/data-backup.test.ts` |
| `saveBackup` | through `backupSnapshot` | the share sheet, the plugin's share, a download, a toast | the page's Save a backup; the Angular Bugs screen |
| `readBackupFile` | the picked file (`Blob.text` or `FileReader`) | | the page's `backupFileChosen`; the Angular Bugs screen |
| `_backupPending`, `_backupShow`, `backupPick`, `backupFileChosen`, `backupLoadIt`, `backupCancel` | the DOM | the DOM | the page's Your data block (`screens-late.html`); the Angular screen calls `backupLoadIt` and `backupCancel` of its own |

**In scope (the logic of the store):** `_backupKeys`, `backupSnapshot`, `_programCount`, `readBackup`, `loadBackupData`
and the two constants. **Out of scope, they save, read a file or draw:** `saveBackup`, `readBackupFile`, `applyBackup`
(it reloads and toasts), `backupMessage` (the line the Bugs page shows), `backupFileName` (the share sheet's file name)
and the Your data block's six.

**Left with no caller by the move:** `_backupKeys` (its two callers move). `_programCount` keeps one page caller,
`saveBackup`'s "Nothing to back up yet" check, which can call core's count instead; its test caller lifts it only to
hand it to `readBackup`, whose page body the move rewrites.

**What the golden records see:** `backupSnapshot`, `readBackup` and `loadBackupData` on good files loaded onto an empty
phone (HALF_MANNY's backup, and the 17 corpus files). Which of the rules inside them a break turns red is in
`stored-state_backup-gaps.md`.
