# The Bugs tab on today's page (measure, before the Expo app draws it)

Made by `tests/measure/native-bugs-tab_today.ts` on today's page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each on its third week of the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed. It follows `tests/measure/native-row7_today.md`, section E.

## A. The bug report

Today's iOS app sends through `frontends/app/src/app/screens/bug-report/bug-report-model.ts` (the page's `submitBug` holds the same words). Each way a send can end, on a stand-in for the form (no report was sent):

| Send | Count |
|---|---|
| nothing typed → no request: "Type what went wrong first." in var(--muted) | 1 |
| the form answers OK and success → sent: "Sent ✓ — thanks, I got it." in var(--green), toast "Bug sent ✓", the text cleared | 1 |
| the form answers OK, no success → failed: "Could not send — try again in a sec." in var(--red), the text kept | 1 |
| the form answers something that is not JSON → failed: "Could not send — try again in a sec." in var(--red), the text kept | 1 |
| the form refuses (not OK) → failed: "Could not send — try again in a sec." in var(--red), the text kept | 1 |
| the request never arrives → network: "Network error — try again." in var(--red), the text kept | 1 |

The request: POST to `https://api.web3forms.com/submit`, headers Accept, Content-Type; its body holds access_key, from_name, message, subject. While it is out the button reads Sending… at 0.6 and takes no tap.

What the report carries after the athlete's text (ten phones):

| Context | Count |
|---|---|
| the program line: program: <name> / goal <goal> / wk <n> / id <id> | 10 |
| with no program: program: none | 1 |
| — context — / build / time / ua / viewport / standalone / url / program | 10 |

## B. The Look row

Each tap, the stored keys it changed, and the button drawn on (the CSS reads the mark on `<html>`, `shell.css`). Ten phones, the taps in order Night, Day, Auto, Night, Night:

| Tap | Count |
|---|---|
| Auto → `ia_theme` removed; the mark on the page: none; drawn on: Auto | 10 |
| Day → `ia_theme` changed; the mark on the page: day; drawn on: Day | 10 |
| Night → `ia_theme` new; the mark on the page: night; drawn on: Night | 20 |
| Night → nothing; the mark on the page: night; drawn on: Night | 10 |

What a launch reads (`applyTheme`, run as the page loads and again when the phone's own look changes):

| Stored | Count |
|---|---|
| stored "" → reads auto, drawn on: Auto | 10 |
| stored "day" → reads day, drawn on: Day | 10 |
| stored "dusk" → reads auto, drawn on: Auto | 10 |
| stored "night" → reads night, drawn on: Night | 10 |
| stored nothing → reads auto, drawn on: Auto | 10 |

## C. Save a backup

| Save a backup | Count |
|---|---|
| A phone with no program → empty, 0 files handed over; toast: Nothing to back up yet. | 10 |
| The file: data, format, kind, made, version; kind asylum-backup, format 1; version the release's; its data is every ia_ key as stored: yes | 10 |
| The share sheet fails → toast: Backup failed. Try again. | 10 |
| With the share sheet (the iOS app) → native, one file handed over, asylum-backup-<date>.json; stored keys changed: nothing; toast: none | 10 |

## D. Load a backup

Each phone is offered the next phone's backup, saved with the look set to Night. The line and the question are the page's own block (`_backupShow`); the iOS app's Angular block calls the same reader, message and loader.

| Step | Count |
|---|---|
| 1. A good file picked → Backup from <day>. N program. Loading it replaces everything on this phone., the question up; stored keys changed: nothing; reloads 0 | 10 |
| 2. Cancel → (no line), no question; stored keys changed: nothing; reloads 0 | 10 |
| 3. Load it after Cancel (nothing waiting) → stored keys changed: nothing; reloads 0 | 10 |
| 4. Load it → every key the file's, none of the phone's left: yes; reloads 1; toast: none; the line and the question left up until the reload: yes | 10 |
| 5. The page started afresh on the file → screenWeek, look night | 10 |
| 6. Load it, the phone refuses the third write → stored keys changed: nothing; reloads 0; toast: Loading failed. Nothing changed.; then (no line), no question | 10 |
| 7. Picked, a key that is not the app's, then Load it → That file is not an Asylum backup., no question; stored keys changed: nothing; reloads 0 | 10 |
| 7. Picked, a newer format, then Load it → This backup is from a newer app. Update the app first., no question; stored keys changed: nothing; reloads 0 | 10 |
| 7. Picked, a value that is not text, then Load it → That file is not an Asylum backup., no question; stored keys changed: nothing; reloads 0 | 10 |
| 7. Picked, another app's JSON, then Load it → That file is not an Asylum backup., no question; stored keys changed: nothing; reloads 0 | 10 |
| 7. Picked, no program list, then Load it → That file is not an Asylum backup., no question; stored keys changed: nothing; reloads 0 | 10 |
| 7. Picked, not JSON, then Load it → That file is not an Asylum backup., no question; stored keys changed: nothing; reloads 0 | 10 |
| 8. A file with an empty program list → Backup from <day>. N programs. Loading it replaces everything on this phone., the question up; loaded, 1 key left; reloads 1; afresh → screenHome, look auto (no mark) | 10 |
| 9. The picker closed with no file → nothing shown | 10 |

## E. A file the beta would save, picked in today's app

The beta's store holds the same `ia_` keys, so core's `takeBackup` on it writes today's file. Each phone here is today's app; the file is made from the next phone's keys in a plain store, as the beta would make it, in three forms.

| The beta's file | Count |
|---|---|
| Saved in today's format (kind asylum-backup, format 1) → Backup from <day>. N program. Loading it replaces everything on this phone., the question up; after Load it: every key replaced by the beta's, none of today's left; reloads 1 | 10 |
| Saved under a format of its own (kind asylum-backup, format 2) → This backup is from a newer app. Update the app first., no question; after Load it: today's keys untouched; reloads 0 | 10 |
| Saved under a kind of its own (asylum-next-backup, format 1) → That file is not an Asylum backup., no question; after Load it: today's keys untouched; reloads 0 | 10 |

## F. What the beta's Bugs tab holds, and what is left

Read from the sources (`frontends/native/src/App.tsx` `Bugs`, `EngineCheck.tsx`, `BackupLoad.tsx`, `store/backup-import.ts`; today's `frontends/app/src/app/screens/bug-report/bug-report.ts`), not counted by this script.

| Piece, top to bottom on today's screen | Today's | The beta |
|---|---|---|
| The top bar | The Asylum, Report a Bug | A title of its own, Bugs |
| The bug report | The note, the text field, Send Bug Report, the status line, the context note (section A) | None |
| Look | Auto, Day, Night; `ia_theme` (section B) | None. The beta follows the phone alone (`useColorScheme`), and a look a loaded backup carries is stored and not read |
| Your data | The note, Save a backup, Load a backup, the line, Load it and Cancel (sections C and D) | A card of its own, Backup: Load a backup alone, which loads at once, checks every key against the file (D287) and stays on Bugs; D289's words; then how many keys it holds, each program, and each key with its size and its hash |
| Engine | The label, the note, Run the check, the line (D286) | Held: the same words and lines, in a card of its own |
| Run recorder | A row, in the iOS app alone | Phase 4 |
| The build label | Build v0.263.0 | Two lines of its own: what it runs on with the version, and the Swift module's answer |

Left to build as today's: the top bar, the bug report, the Look row, the Your data block (Save a backup; Load a backup with its line and its question, and the start afresh after Load it), the Engine row in today's form, and the build label.

The beta's own, with no place on today's screen: the two lines under the title; the list of keys with sizes and hashes, the count of keys and the programs' lines; the line a load prints (Loaded N of N keys. Every hash matches the file.); D289's words (Mario's own ruling: Bugs says so in words).

How today's Load differs from the beta's:

- Today's reads the file and changes nothing, prints what it is (Backup from <day>. N program. Loading it replaces everything on this phone.) and asks, Load it or Cancel. The beta loads as soon as the file is picked.
- After Load it today's page reloads: it starts on This Week under the file's look, or on Programs when the file holds no program (section D, steps 5 and 8). The beta stays on Bugs, and This Week reads the store again when it is next opened.
- A refused write: today's puts back what the phone held and says Loading failed. Nothing changed. The beta does the same and says The phone refused the write. Nothing was kept.
- The beta alone checks every key against the file after the load and puts everything back on a miss (D287: SQLite stores a lone surrogate as U+FFFD). Today's has no such check and needs none: its store is the browser's.

Not known until a report is sent: whether the form takes a request from the beta. The key is registered to the live page's address (handoff, Bugs tab), and a request from React Native carries no page address. No report was sent by this measure.
