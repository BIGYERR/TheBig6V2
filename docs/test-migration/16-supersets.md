# Group 16: supersets and duplicate movements

Phase 2 parity for six gates, 81 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

New files:

- `tests/integration/supersets.test.js` (21 tests): the round count is a field (D39) and a bare remainder in a round
  block reads "N reps" (D176). Hand tables, the reference parsers, source scans of the resolver seam, and the whole
  420-cell round-count lattice (every cell built once, about 2.4 s).
- `tests/integration/duplicate-movements.test.js` (13 tests): one card, one movement. The D52 slice 5 hand tables, a
  144-cell sample of the same-card lattice (every other cell of seed 1013), the D164 repro, a 137-config sample of
  the WIDE lattice, and D198's typed cards on the app and on its pre-D198 copy.
- `tests/integration/adjacent-day-dedupe.test.js` (11 tests): the adjacent-day dedupe (D160, D167, D167a, D171,
  D212). `_d18View` called directly, the instrumentation shown inert, and a 249-config sample of the calendar
  lattice (85 of them in the D167 sweep).
- `tests/sweeps/duplicate-movements.test.js` (15 tests, CI only): the 864-cell same-card lattice, the 13,104-config
  WIDE lattice and the 576 `sun` cells of the deload lattice on the app and its pre-D198 copy.
- `tests/sweeps/adjacent-day-dedupe.test.js` (10 tests, CI only): the 15,180-config calendar lattice (D160's phantom
  lattices and multi-sport limb, 13,560 configs, plus the D167 sweep of 5,310), one instrumented build each and the
  legacy-walk build of every swept config.
- `tests/snapshots/duplicate-movements.json`: the three counts D164 pinned as equalities on the WIDE lattice, the
  current row of the gate's era table (`ERA['0.239.1']`, a reference to 239): 4,770 Chest + knee sections on
  shoulder/workaround, 891 of them with no chest movement, 412 one-item Biceps sections on elbow/workaround.
- `tests/support/supersets.js`, `tests/support/duplicate-movements.js`, `tests/support/adjacent-day-dedupe.js`: the
  reference parsers and the round-count lattice; the same-card, WIDE and deload lattices, the card oracles, the
  D198 copies and typed cards, the source-surgery loader (`loadText`, `replaceOnce`) and the frozen pattern lens;
  the calendar lattice, the rename logger and `_d18View` wrapper, the legacy walk and the calendar survey.

The map names two files. The dedupe's claims went to their own pair (`adjacent-day-dedupe`) because the dedupe is a
feature of its own and its lattice alone fills a CI sweep (about 2.5 minutes); the same-card claims stay in
`duplicate-movements`.

Oracles the gates read from older builds, kept without git history: the hinge lens D171.T read off V218's
`_pattern` is transcribed in `tests/support/duplicate-movements.js` as `frozenPattern` (the classifier is unchanged
from V218 through today, checked once); D198's (ii) clause compared against V230's cards, so the 21 days V230 printed
two items on and the pre-D198 copy collapses are typed as `COLLAPSE_21` (derived once from V230, Post-v0.239.1).

Totals: **81 rows: 78 mapped, 3 dropped** (2 fixtures of a past build, 1 row of the gate's own shard runner).

Mutations: not run (sabotage off). Nine of the nine `g190_rounds.js` mutations had been run against
`supersets.test.js` before sabotage was switched off, and all nine were caught; no other mutation was run.

## `g190_rounds.js` (27 rows: 27 mapped)

All rows are held by `tests/integration/supersets.test.js`.

| Row | Held by |
|---|---|
| `G1` | › "the round count resolver: an authored count, then a count in the label, then the members, else none" |
| `G2a` | › "the resolver seam exists and carries no fallback round count" |
| `G2b` | the same test |
| `G2c` | › "the superset header reads the one resolver and falls back to the label only when there is no count" |
| `G2d` | › "the session time estimate shares the resolver instead of carrying its own copy (D39-iii)" |
| `G3` | › "a section count is the smallest member count, never the first member" |
| `G4` | › "both authored grammars are read: N×reps and N sets" |
| `G5a` | › "rounds: null means not a round block; an omitted count is recovered from the members" |
| `G5b` | the same test |
| `G5c` | the same test |
| `G6a` | › "a label that states its own count beats the not-a-round-block heuristic (D39-ii)" |
| `G6b` | › "the nine genuine not-a-round-blocks carry an authored null" |
| `G6c` | › "a label that states its own count beats the not-a-round-block heuristic (D39-ii)" (Tabata Hell reads 8) |
| `G7` | › "the lattice builds whole and leaves every config unchanged", › "every generated superset carries an authored, positive round count" |
| `G8` | › "no generated superset count contradicts its own members, and members agree with each other" (a superset with no count is G7's) |
| `G9` | the same test |
| `G10` | › "the session time estimate reads the item count first, then the section count, then 3 (D39-iii)" |
| `G11a` | › "rendering a superset leaves item.detail untouched in the data" |
| `G11c` | › "a rounds: null block prints its member rows whole" |
| `G11d` | › "the rendered payload still carries the count, and parseRx reads it" |
| `G11e` | › "the round sentence is written only when there is a real count" |
| `G11f` | › "a bare count or range in a round block reads "N reps"; every other remainder is untouched (D176)" (hand table), › "every generated round-block row reads the reference strip plus " reps" exactly when bare (D176)" (lattice and floor). The era predicate (`VER >= 220`) is gone. |
| `G12a` | › "prevention halves 3-round supersets to 2 and keeps members in step (D39-iv)" |
| `G12b` | the same test |
| `G12c` | the same test (4-round sections survive) |
| `G12d` | › "prevention rewrites non-superset accessories per item; other foci keep 3 sets" |
| `G12e` | the same test (the control) |

## `g193_samecard.js` (19 rows: 19 mapped)

Lattice rows are held twice: on 144 cells (every other cell of seed 1013) in
`tests/integration/duplicate-movements.test.js` and on all 864 in `tests/sweeps/duplicate-movements.test.js`.

| Row | Held by |
|---|---|
| `O4` | integration › "the lowback/protect row slot keeps at least two vertical pulls once the drawn main is excluded" |
| `O5` | › "the anti-rotation pillar keeps two members on every tier even when the card holds both carries" |
| `O7` | › "the Delt finisher keeps a member on every tier once the card's own shoulder pick is subtracted" |
| `O8` | › "the chest accessories leave the Accessory two names and Chest + knee one on every tier" |
| `O9` | › "the light-press fallback chain always leaves two names and has no unguarded terminal" |
| `G1` | integration › "no movement prints twice on one card (same-card sample)"; sweep › "no movement prints twice on one card, by name for every ruled class" |
| `G2a` | the same two tests (no name twice on any card) |
| `G2b` | integration › "no movement prints twice on one card (same-card sample)" (no Main repeated); sweep › "no card repeats its Main movement in another section" |
| `G3a` | the two by-name tests: the register's one class, Kettlebell swing, ruled 0 by D166, is asserted 0 by name, so it cannot grow |
| `G3b` | the same tests: the register is honest when the class is at its recorded count, 0, which is what they assert |
| `G4a` | integration › "the lowback/protect pull day never repeats its main and draws only from the hand pool (sample)"; sweep › "the lowback/protect pull day never repeats its main and draws its vertical pull from the hand pool" |
| `G4b` | the same two tests |
| `G4c` | the same two tests |
| `G5a` | integration › "the lowback/protect pull day never repeats its main and draws only from the hand pool (sample)"; sweep › "the subtraction selects another name and never deletes a section" |
| `G5b` | integration › "the subtraction selects another name and never deletes the section (sample)"; the same sweep test |
| `G5c` | the same two tests |
| `G5d` | the same two tests |
| `G5e` | the same two tests |
| `G5f` | the same two tests |

## `g217_d160_dedupe_view.js` (9 rows: 8 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `C1` | `tests/integration/adjacent-day-dedupe.test.js` › "the sample builds whole and buildProgram leaves every config unchanged"; sweep › "every config builds and buildProgram leaves every config unchanged" |
| `F0` | DROPPED: a fixture of a past build (V216's before-picture: 6,919 renames, 102 phantoms), which the gate read from git |
| `I0` | › "the rename logger and the view wrapper change no program" (the app's half; V216's half was a past build) |
| `K0` | the same test: the knock-on instrument and the rename logger are one logging line here |
| `K1` | › "no rename dodges a name the shipped long-run previous day does not print (D160, sample)" (the multi-sport configs of the sample); sweep › "no rename of any kind dodges a name the calendar-previous shipped day does not print, on the multi-sport limb" (1,080 + 4,200) |
| `P1` | the same integration test; sweep › "no rename dodges a name the shipped long-run previous day does not print, on each D160 lattice" (3,600, 600, 3,600, 480) |
| `U1` | › "_d18View on real shipped days leaves the program untouched and shares no object with it" |
| `U2` | › "_d18View reads a hand day the way D18 prints it under each tier, and leaves the day untouched" |
| `W1` | › "_d18View never mutates the live previous day and never hands it back (sample)"; sweep › "_d18View never mutates the live previous day and never hands it back" |

## `g219_d167_pairs.js` (8 rows: 6 mapped, 2 dropped)

| Row | Held by |
|---|---|
| `B0` | `tests/integration/adjacent-day-dedupe.test.js` › "the lattice start dates are Mondays, so calendar index 0 is W1 Monday", › "the rename logger and the view wrapper change no program" (V218 equal to itself, and its logging line, were a past build) |
| `D1` | › "every rename lands on a day whose calendar-previous card prints the renamed name (D167, sample)"; sweep › "every rename lands on a day whose calendar-previous card prints the renamed name; none on W1 Monday (D167)" |
| `D167.Z` | › "the legacy walk moves only Sundays and Mondays, or a licensed cascade, and no Sunday-rest program (D167, D167a, sample)"; sweep › "the seed index is carried: with the legacy walk put back no Sunday-rest program moves, and the walk is live (D167)" |
| `D167.H` | the same integration test; sweep › "every day the legacy walk moves is a Sunday, a Monday or a licensed depth-1 cascade (D167a)" |
| `D171.T` | › "no hinge before a leg-load day keeps RPE 8, final Saturday included (D171, sample)"; sweep › "no hinge before a leg-load day keeps RPE 8, and final Saturdays are in the population (D171)". The lens is V218's `_pattern`, frozen in `frozenPattern`. |
| `D212` | › "a delt accessory repeats on the next training day only when its tier's family is used up (D212, sample)"; sweep › "... (D212, healthy configs)" |
| `F0` | DROPPED: a fixture of a past build (V218's dedupe renames off the calendar-previous card), read from git |
| `L:57d020e4` | DROPPED: the gate's own machinery (every shard of its runner exited clean); the sweep runs in one process |

## `g219_samecard_draws.js` (15 rows: 15 mapped)

| Row | Held by |
|---|---|
| `S0a` | `tests/sweeps/duplicate-movements.test.js` › "the WIDE lattice is 13,104 configs, 1,008 of them shoulder/workaround and 1,008 elbow/workaround" |
| `S0b` | › "every WIDE config builds" (one process walks the whole lattice) |
| `S0c` | the same test |
| `S1a` | `tests/integration/duplicate-movements.test.js` › "the D164 repro is on the WIDE lattice once and builds identically twice" |
| `S1b` | the same test |
| `F1` | › "the D164 repro's W1 Monday Chest volume is a pec deck, and no name prints twice on that card" (the era row's current value) |
| `F2` | the same test |
| `R1` | sweep › "no name prints twice on any WIDE card, and no ruled twin class prints (D159, D164, D165, D166)"; integration › "no draw-site twin class prints on a sample of the WIDE lattice" |
| `R2` | the same two tests |
| `R3` | the same two tests |
| `R4` | sweep › "the D164 counts on the WIDE lattice match tests/snapshots/duplicate-movements.json" (4,770) |
| `R5` | the same test (891) |
| `R6` | the same test (412) |
| `R7` | the two twin-class tests |
| `R8` | the two twin-class tests |

## `g231_d198_hepdraw.js` (3 rows: 3 mapped)

| Row | Held by |
|---|---|
| `D198-a` | `tests/sweeps/duplicate-movements.test.js` › "a full-lower day never holds its hinge in both Lower strength and Hip extension + push" ((i) and the cover), › "a reused app builds every probe cell exactly as a fresh one does" (the lens), › "D198 adds no one-item Hip extension + push: every one the app prints, the pre-D198 copy prints too" and › "on all 91 days the app prints a two-item Hip extension + push without the hinge, landing the ruled name" ((ii), on the typed 21 days); `tests/integration/duplicate-movements.test.js` › "the app carries the D198 line and the hipExtBW pool it draws from, once each" (the pool). V230's own figures (70 doubled, the 3,070-day census) were a past build. |
| `D198-b` | integration › "the typed full-lower cards read the after-cards, and the pre-D198 copy the before-cards" (the three typed cells; V230's reading of the before-cards was a past build, and the pre-D198 copy reads them now) |
| `D198-c` | sweep › "the pre-D198 copy repeats the hinge on 70 days of 20 loaded lowback/protect programs, W9 to W12 Saturdays", › "the pre-D198 copy collapses Hip extension + push to one item on the 21 typed days", › "on all 91 days the app prints ..."; the copy is made by `replaceOnce`, which fails unless the D198 line occurs exactly once |
