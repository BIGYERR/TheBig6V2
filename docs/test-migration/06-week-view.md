# Group 6: week view, day close and the active program

Phase 2 parity for four gates, 89 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

New files:

- `tests/integration/week-view.test.js` (22 tests): the recovery banner is gone and the placement note stays (D173);
  Done, Skip and Mark Done ✓ close the day (D179) on a sample of HALF_MANNY's training days (every seventh, and weeks 1
  and 7 for the hero and the strip).
- `tests/sweeps/week-view.test.js` (5 tests): the same D179 claims on every one of the 70 training days, as the gate
  ran them. CI only.
- `tests/integration/week-freeze.test.js` (9 tests): D108, the touched set reads all four stores.
- `tests/integration/active-program.test.js` (46 tests): D178, one active program.
- `tests/support/week-view.js`: the comment-stripping lexer, the virtual-clock week world and the day-close lattices
  the integration file and the sweep share.

Totals: **89 rows: 88 mapped, 1 dropped** (1 HALF_MANNY digest row, held by `tests/integration/program-output.test.js`).

## `g202_d108_touchset_freeze.js` (10 rows: 9 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `R0` | `tests/integration/week-freeze.test.js` › "the pinned config builds the same program twice" |
| `R0b` | `tests/integration/week-freeze.test.js` › "the fixture week carries the probe day and the control day" |
| `R0c` | `tests/integration/week-freeze.test.js` › "each scenario writes exactly one store" |
| `R1` | `tests/integration/week-freeze.test.js` › "a logged weight alone (ia_exw_) freezes the day: the reboot keeps the stored card byte for byte" |
| `R1c` | `tests/integration/week-freeze.test.js` › "beside a logged weight, a day with no record is rebuilt to the live build" |
| `R2` | `tests/integration/week-freeze.test.js` › "a snapshot alone (ia_hist_) freezes the day to the snapshot, byte for byte" |
| `R2c` | `tests/integration/week-freeze.test.js` › "beside a snapshot, a day with no record is rebuilt to the live build" |
| `R4` | `tests/integration/week-freeze.test.js` › "the live build of both days differs from the stored sentinels, so a frozen day is a real claim" |
| `R5` | `tests/integration/week-freeze.test.js` › "the week beyond the freeze cut is the live build in both scenarios" |
| `R6` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

## `g220_d173_recovbanner.js` (6 rows: 6 mapped)

| Row | Held by |
|---|---|
| `B0` | `tests/integration/week-view.test.js` › "the comment strip keeps the code: it compiles and still holds the week renderer and its stats block" |
| `B1` | `tests/integration/week-view.test.js` › "the app source never prints the recovery spacing banner" |
| `B2` | `tests/integration/week-view.test.js` › "the app source never prints the recovery spacing banner" |
| `B3` | `tests/integration/week-view.test.js` › "the app source never prints the recovery spacing banner" |
| `B4` | `tests/integration/week-view.test.js` › "the program keeps the placement note as a trace, word for word" |
| `B5` (many) | `tests/integration/week-view.test.js` › "week 1 renders its stats block with no banner, no recycle glyph and no sentence of the note" |

## `g221_d178_active.js` (46 rows: 46 mapped)

The five rows the manifest keys by label hash are the boot rows `Ba`, `Bb`, `Bc`, `Bd` and `Be`.

| Row | Held by |
|---|---|
| `A01` | `tests/integration/active-program.test.js` › "boot with the pointer on a live program loads it" |
| `A02` | › "boot with no pointer loads nothing" |
| `A03` | › "boot with a pointer to a missing program falls back to the first live one and writes it back" |
| `A04` | › "boot with a pointer to an archived program falls back to the first live one and writes it back" |
| `A05` | › "building a program in the wizard makes it the active one" |
| `A06` | › "Set Active on another program makes it the active one" |
| `A07` | › "there is no openProg: the old Open path is gone and nothing moves" |
| `A08` | › "there is no openProg on an archived program either" |
| `A09` | › "Set Active on an archived program is refused and nothing moves" |
| `A10` | › "archiving the active program hands off to the next live one" |
| `A11` | › "deleting the active program hands off to the next live one" |
| `A12` | › "archiving the active program with none left clears all three" |
| `A13` | › "deleting the active program with none left clears all three" |
| `A14` | › "Set Active survives a reboot" |
| `A15` | › "a reboot after the absent Open path still names the first program" |
| `A16` | › "Set Active then archiving that program hands back to the other" |
| `A17` | › "the absent Open path then archiving the active program hands off to the next" |
| `S1a` | › "Set Active from Home persists and loads the program and clears the open day" |
| `S1b` | › "Set Active lands on This Week, renders the new program and says so once" |
| `S1c` | › "Set Active shows the new program's own week at the week today's date falls in" |
| `S2` | › "Set Active on an archived program says "Restore this program first" once and moves nothing" |
| `S3` | › "Set Active on an unknown id is refused silently and moves nothing" |
| `K1` | › "the program card has no Open button and the code has no openProg" |
| `K2a` | › "a program that is not active offers Set Active as its primary button" |
| `K2b` | › "the active program keeps its "Active ✓" label and offers no Set Active; the other card has no label" |
| `Y1` | › "the card goal line for a run and bike program joins the two goals with a plus, no dash" |
| `Y2` | › "the wizard review line for a run and bike program names each sport, no dash" |
| `Y3a` | › "with no active program, tabGo says "No active program. Tap Set Active or build a new one." and stays on Home" |
| `Y3b` | › "with no active program, openRestSheet says …" |
| `Y3c` | › "with no active program, openOverlaySheet says …" |
| `Y3d` | › "with no active program, openInjurySheet says …" |
| `Y3e` | › "with no active program, applyInjuryDraft says …" |
| `Y3f` | › "with no active program, applyOverlayDraft says …" |
| `Y4a` | › "the old Open copy is gone from the code" |
| `Y4b` | › "the old Open copy is gone from the code" |
| `L:483ce4d2` (`Ba`) | › "boot with every program archived and the pointer on one clears the pointer and stays on Home" |
| `Ba2` | › "restoring that program offers Set Active and no Active label" |
| `Ba3` | › "a restored program is not active until Set Active is tapped: This Week stays guarded, then opens on it" |
| `L:cf442305` (`Bb`) | › "boot with no programs and a pointer to a gone one clears all three and stays on Home" |
| `Bb2` | › "boot with no programs key and a pointer to a gone one clears all three and stays on Home" |
| `L:df42d737` (`Bc`) | › "boot with a pointer to a deleted program loads the live one and opens This Week" |
| `L:3147bc44` (`Bd`) | › "boot with a pointer to an archived program loads the live one and opens This Week" |
| `L:50f60654` (`Be`) | › "boot with the pointer on the live program loads it and opens This Week" |
| `L1` | › "deleting the active program keeps a legacy successor's seed in storage and makes it active" |
| `L2` | › "deleting the active program keeps a legacy dated test successor's seed and test week in storage" |
| `W1` | › "building a program in the wizard makes it active, on week 1 of This Week, for six goal shapes" |

The gate read the real clock; the tests pin it (Sunday 2026-10-11, noon) and type the dates from it: today is week 5
of a 2026-09-07 start, and the dated test successor's test lands in week 7.

## `g221_d179_donenav.js` (27 rows: 27 mapped)

Each lattice row is held twice: on a sample in `tests/integration/week-view.test.js` (every seventh training day;
weeks 1 and 7 for the hero and strip rows) and on every training day in `tests/sweeps/week-view.test.js`.

| Row | Held by |
|---|---|
| `F0` | `tests/integration/week-view.test.js` › "HALF_MANNY has 70 training days, all inside the block, and stores no blockOpen"; › "no render in these lattices shows a day as before signup"; sweep › "HALF_MANNY has the ruling's 70 training days", › "no render shows a day as before signup" |
| `C1` | › "Done, Skip and Mark Done ✓ close the day and land on This Week"; sweep › "every training day: Done, Skip and Mark Done ✓ close to This Week, undo stays, pop-up and toast as ruled" |
| `C2` | the same two tests |
| `C3` | the same two tests |
| `C4` | › "an undo tap (Done ✓ or Skipped ✕ again) stays on the day, says Unmarked and clears the status"; the same sweep test |
| `C5` | › "the pop-up shows over This Week after Done and Mark Done ✓, and never after Skip"; the same sweep test |
| `C6` | the same two tests |
| `T1` | › "Done never shows the toast under the pop-up; Skip shows its own label and no pop-up"; the same sweep test |
| `T2` | the same two tests |
| `B1d` | › "Done, Skip and Mark Done ✓ stop and zero a running rest timer and leave the float where it is"; sweep › "every seventh training day: the rest timer stops on a close and keeps running on undo and ‹ Back" |
| `B1s` | the same two tests |
| `B1m` | the same two tests |
| `B2u` | › "an undo tap and ‹ Back keep a running rest timer running on the same interval"; the same sweep test |
| `B2b` | the same two tests |
| `W1` | › "a pace wheel still settling when Done or Skip is tapped saves the value it was turned to" |
| `W2` | › "an undo tap inside the settle window is not flushed; the wheel settles on its own" (the current, per-seed claim: a stored 9:30 settles to 10:30, a form-only 9:30 stores nothing) |
| `A1a` | › "today's hero says Done or Skipped after the close, offers OPEN SESSION, and goes back to START SESSION on undo"; sweep › "every training day as today: the hero status, the strip marks and the Wildcard mark" |
| `A1b` | the same two tests |
| `A1c` | the same two tests |
| `A2` | › "closing a past day leaves the hero on today, byte for byte"; the same sweep test |
| `A3a` | › "the strip marks a skipped day ✕ and a done day ✓, and an undone day shows its date again"; the same sweep test |
| `A3b` | the same two tests |
| `A3c` | the same two tests |
| `A3d` | › "a skipped day that carries a Wildcard shows the Wildcard mark, not ✕"; the same sweep test |
| `K1` | › "the old em-dash Skip label survives only in resolveReminder" |
| `K2` | › "handleDayStatus labels a skip with the new copy and no em-dash" |
| `K3` | › "OPEN SESSION and each hero string appear once in the source" |

The source scans (`K1` to `K3`) now strip comments with the lexer `g220` used, not `g221`'s line regex; the counts
are the same on today's `index.html`.

## Mutations

Every mutation in `tests/sabotage/*.json` that names one of the four gates was applied to a scratch copy of today's
`index.html` (every anchor occurs exactly once) and the three new integration files were run against it with
`IA_APP`: **35 of 35 caught** (at least one test failed on each).

| Spec | Gate | Caught |
|---|---|---|
| `v202.json` M25, M26 | `g202_d108_touchset_freeze` | 2/2 |
| `v220_d173.json` S1 to S3 | `g220_d173_recovbanner` | 3/3 |
| `v221_d178.json` (14) | `g221_d178_active` | 14/14 |
| `v221_d179.json` (16) | `g221_d179_donenav` | 16/16 |
