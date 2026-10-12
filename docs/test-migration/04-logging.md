# Moved: logging (group 4)

Parity for phase 2 of the test migration (`docs/test-migration.md`, the parity rule): every manifest row of the seven
logging gates, mapped to the new test that holds its claim or dropped with a written reason. The gates themselves stay
in `tests/gates/` and keep running in CI until phase 3 deletes them.

The new tests assert what the app does today (0.239.1): every version arm of a gate (`VER >= ERA`, the V235, V236 and
V237 flips, REFUSED below the era) is ported at its current arm and the older arms are not. The hand oracles are
ported as typed (the 0:47:13 tail, 47.22, 3.1, 15:14/mi, the D200 hundredths arithmetic, the D203 parse table, the
copy). The lattices a gate swept (g232, g233, g235, g237) run whole in `tests/sweeps/logging.test.js`; the
integration file opens HALF_MANNY's run days and a sample of the bike lattice.

## Totals

- Rows: 75 over 7 gates (`tests/row_manifest.txt`).
- Mapped to a new test: 71.
- Dropped: 4:
  - a past build (a removed source expression; its behaviour is held by another row's test): 1
  - HALF_MANNY digest, held by `tests/integration/program-output.test.js`: 3
- Mutations: not run (sabotage off).

## New files

- `tests/unit/pace-delta.test.js`: 8 tests, about 0.1 s. The real `updateDoseDerived` and `doseDerived` lifted alone.
- `tests/integration/logging.test.js`: 66 tests, about 1.4 s. The day card driven on a virtual clock.
- `tests/sweeps/logging.test.js`: 4 tests, about 22 s (CI only). The lattices.
- `tests/support/log-form.js`: the log form environment (virtual clock, a document that parses the rendered form into
  nodes and wheels, the forced-dose hook, the Progress chart spy) and the shared hand oracles (form shapes, faces).

## Rows

### `g191_pacedelta.js` (11 rows)

| Row | Held by |
|---|---|
| `G1` | `tests/unit/pace-delta.test.js` › "the gap reads as the hand table says, seconds under a minute and m:ss from a minute" |
| `G2a` | `tests/unit/pace-delta.test.js` › "every gap from 0 to 300 s/mi prints its band's shape and decodes back to the gap" |
| `G2b` | `tests/unit/pace-delta.test.js` › "every gap from 0 to 300 s/mi prints its band's shape and decodes back to the gap" |
| `G2c` | `tests/unit/pace-delta.test.js` › "every gap from 0 to 300 s/mi prints its band's shape and decodes back to the gap" |
| `G2d` | `tests/unit/pace-delta.test.js` › "no gap of a minute or more prints a raw second count" |
| `G3` | `tests/unit/pace-delta.test.js` › "fewer seconds per mile reads faster, more reads slower, whatever the size" |
| `G4` | `tests/unit/pace-delta.test.js` › "the gap copy has no mid-sentence hyphen, no em-dash and no brand" |
| `G5a` | `tests/unit/pace-delta.test.js` › "exactly one place in the app writes the pace gap" |
| `G5b` | DROPPED: a past build. The row checks that the V190 source expression `Math.abs(df)+'s/mi '` is gone; the behaviour it guarded (no raw second count at or above a minute) is held by G2d's test, "no gap of a minute or more prints a raw second count", and by G1's hand table |
| `G5c` | `tests/unit/pace-delta.test.js` › "the benchmark retest strip keeps its own sec/mi wording" |
| `G6` | `tests/unit/pace-delta.test.js` › "the gap is display only: doseDerived returns the pace, the target and the seconds, never the gap" |

### `g232_d199_runwheel.js` (8 rows)

| Row | Held by |
|---|---|
| `D199-spec` | `tests/integration/logging.test.js` › "the time wheel shows hours 0 to 9 with no dash and no wrap, minutes and seconds 00 to 59 wrapping, capped Time" |
| `D199-width` | `tests/integration/logging.test.js` › "a stacked wheel is capped at 178.2 px, three fifths of a 375 pt row after its padding" |
| `D200-rt` | `tests/integration/logging.test.js` › "every second from 0:00:01 to 9:59:59 stores as decimal minutes to two places and reads back to itself"; `tests/integration/logging.test.js` › "the zero time face 0:00:00 stores nothing, and a blank or malformed time opens on it"; `tests/integration/logging.test.js` › "a stored time reads back to its nearest second, and anything at or over 9:59:59 pegs there" |
| `D202-move` | `tests/integration/logging.test.js` › "a rolled run wheel waits for the Log tap, which stores two-decimal minutes and miles and the derived pace"; `tests/integration/logging.test.js` › "away from the plan and back to it commits both moves; settling on the plan alone writes nothing" |
| `D202-open` | `tests/integration/logging.test.js` › "opening a run form with nothing stored writes nothing and shows the plan on the fixed wheel, zero on the free ones"; `tests/integration/logging.test.js` › "an older stored run opens on its own faces and writes nothing"; `tests/integration/logging.test.js` › "every HALF_MANNY run day with a time or distance dose opens on its plan, in the ruled shape, writing nothing"; `tests/sweeps/logging.test.js` › "every run day with a time or distance dose, over the run goals, opens on its plan in the ruled shape, writing nothing" |
| `D203` | `tests/integration/logging.test.js` › "a stored distance reads back by its first two decimals, clamps at 99, and a blank or malformed one lands on 0.00" |
| `D206-copy` | `tests/integration/logging.test.js` › "the run forms read Log the run, Shows the plan, Off the watch, and Miles in the work reps, with no dash" |
| `L:f232d23f` (the hashed key of g232's `D199/D201/D204-forms` row) | `tests/integration/logging.test.js` › "the run time, distance and rep forms are wheels, the fixed one showing the plan, each alone in its row"; `tests/integration/logging.test.js` › "every HALF_MANNY run day with a time or distance dose opens on its plan, in the ruled shape, writing nothing"; `tests/sweeps/logging.test.js` › "every run day with a time or distance dose, over the run goals, opens on its plan in the ruled shape, writing nothing" |

### `g233_d207_bikewheel.js` (5 rows)

| Row | Held by |
|---|---|
| `D207-move` | `tests/integration/logging.test.js` › "a rolled ride waits for the Log tap; then Progress and the unmarked nudge read it, and a blank ride gets no nudge"; `tests/integration/logging.test.js` › "settling a bike wheel on the face it opened on writes nothing, stored or blank"; `tests/integration/logging.test.js` › "a stored ride over the dial opens pegged at 9:59:59, and touching it commits 599.97 then 599.98" |
| `D207-open` | `tests/integration/logging.test.js` › "opening a bike day writes nothing: a blank ride opens on 0:00:00, a stored one on its own face, pegged at 9:59:59"; `tests/sweeps/logging.test.js` › "every bike form, over the bike goals, injured multi-sport programs and swapped-in days, is one wheel that opens on 0:00:00 writing nothing" |
| `D208-clamp` | `tests/integration/logging.test.js` › "the run time and bike forms seed 650, 600 and 630.5 at 9:59:59, 599 at 9:59:00 and 45.5 at 0:45:30, writing nothing"; `tests/integration/logging.test.js` › "a stored time reads back to its nearest second, and anything at or over 9:59:59 pegs there"; `tests/integration/logging.test.js` › "the zero time face 0:00:00 stores nothing, and a blank or malformed time opens on it" |
| `D209-copy` | `tests/integration/logging.test.js` › "the bike form reads Log the ride after the bike glyph, with no sub-label"; `tests/sweeps/logging.test.js` › "every bike form, over the bike goals, injured multi-sport programs and swapped-in days, is one wheel that opens on 0:00:00 writing nothing" |
| `L:df3ad925` (the hashed key of g233's `D207/D210-forms` row) | `tests/integration/logging.test.js` › "the bike form is one H:MM:SS wheel for the ride, alone in its row, with no plan on it and no number box"; `tests/sweeps/logging.test.js` › "every bike form, over the bike goals, injured multi-sport programs and swapped-in days, is one wheel that opens on 0:00:00 writing nothing" |

### `g235_d215_hmszero.js` (10 rows)

| Row | Held by |
|---|---|
| `D215-clear` | `tests/integration/logging.test.js` › "rolling a logged time back to 0:00:00 in the same open clears it, and the readers drop it" |
| `D215-format` | `tests/integration/logging.test.js` › "every second from 0:00:01 to 9:59:59 stores as decimal minutes to two places and reads back to itself"; `tests/integration/logging.test.js` › "a stored time reads back to its nearest second, and anything at or over 9:59:59 pegs there" |
| `D215-open` | `tests/integration/logging.test.js` › "a blank time wheel opens on 0:00:00, a planned one on its plan, and neither writes"; `tests/sweeps/logging.test.js` › "every time wheel on a run or bike day opens on its plan or 0:00:00 writing nothing, and a free one rolled to 0:47:13 stores 47.22 through Done" |
| `D215-plan` | `tests/integration/logging.test.js` › "a planned time wheel stores what it is rolled to, 0:30:00 as 30.00 and back from 1:25:00 to 0:25:00"; `tests/integration/logging.test.js` › "a blank time wheel opens on 0:00:00, a planned one on its plan, and neither writes"; `tests/sweeps/logging.test.js` › "every time wheel on a run or bike day opens on its plan or 0:00:00 writing nothing, and a free one rolled to 0:47:13 stores 47.22 through Done" |
| `D215-rows` | `tests/integration/logging.test.js` › "the time wheel shows hours 0 to 9 with no dash and no wrap, minutes and seconds 00 to 59 wrapping, capped Time"; `tests/integration/logging.test.js` › "the miles wheel shows whole miles 0 to 99 with no dash and no wrap, tenths and hundredths wrapping"; `tests/integration/logging.test.js` › "the rep time wheel shows minutes 0 to 9 with no dash and no wrap, seconds wrapping"; `tests/integration/logging.test.js` › "the pace wheel keeps its dash: minutes dash then 4 to 17, seconds wrapping" |
| `D215-tail` | `tests/integration/logging.test.js` › "a time rolled from 0:00:00 to 0:47:13 stores 47.22 through Done, with the plan stamp and its pace on a long run"; `tests/sweeps/logging.test.js` › "every time wheel on a run or bike day opens on its plan or 0:00:00 writing nothing, and a free one rolled to 0:47:13 stores 47.22 through Done" |
| `D215-zero` | `tests/integration/logging.test.js` › "the zero time face 0:00:00 stores nothing, and a blank or malformed time opens on it" |
| `D216-wrap` | `tests/integration/logging.test.js` › "hours, whole miles and rep minutes never wrap; every other column wraps unless it carries a dash" |
| `D217-digest` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION` (the era row, its value, and the program built twice); held by `tests/integration/program-output.test.js` › "program output matches tests/snapshots/program-output.json" (the HALF_MANNY digest 2d35e8f743680cfa) and › "every program equals itself when built twice" |
| `D217-others` | `tests/integration/logging.test.js` › "the miles and rep time wheels store their faces, and their zero faces store nothing"; `tests/integration/logging.test.js` › "a stored distance reads back by its first two decimals, clamps at 99, and a blank or malformed one lands on 0.00" |

### `g236_d218_logbutton.js` (15 rows)

| Row | Held by |
|---|---|
| `D218-bike` | `tests/integration/logging.test.js` › "a ride waits for the Log tap, which stores 45.00, says Ride logged and reaches Progress" |
| `D218-chip` | `tests/integration/logging.test.js` › "the sport chip does not park a draft, and parks and returns a logged run" |
| `D218-copy` | `tests/integration/logging.test.js` › "the Log button copy is exact in the source, with a real check mark, no dash and no brand" |
| `D218-done` | `tests/integration/logging.test.js` › "Done and Skip commit a rolled draft, inside the wheel's settle window or after it; the undo tap commits nothing" |
| `D218-draft` | `tests/integration/logging.test.js` › "a rolled time is a draft: nothing stored, no snapshot, the hidden node holds it and the button reads Log" |
| `D218-empty` | `tests/integration/logging.test.js` › "Log on an untouched card writes nothing and says Nothing to log yet" |
| `D218-lift` | `tests/integration/logging.test.js` › "a lifting day has no Log button and its RPE saves on the move" |
| `D218-live` | `tests/integration/logging.test.js` › "after Log a roll saves quietly and the button stays Logged; rolled to zero it stores nothing and reads Log" |
| `D218-log` | `tests/integration/logging.test.js` › "the Log tap stores the draft with no RPE, freezes the day, relabels the button and says Run logged" |
| `D218-reopen` | `tests/integration/logging.test.js` › "a stored run opens as Logged and writes nothing" |
| `D218-reps` | `tests/integration/logging.test.js` › "a rep stepper step waits for the Log tap, which stores the reps and the miles they make" |
| `D218-rpe-notes` | `tests/integration/logging.test.js` › "an RPE or a note on a draft is saved, the rolled time is not" |
| `D218-swim` | `tests/integration/logging.test.js` › "typed swim yards wait for the Log tap, which stores them and says Swim logged" |
| `D219-counter` | `tests/integration/logging.test.js` › "a blank RPE counts for nothing: the RPE chart, the journal, a swap-only day and the rest sheet all skip it" |
| `D219-rpe` | `tests/integration/logging.test.js` › "an untouched RPE slider stores no RPE; a moved one stores its value; a stored one is carried" |

### `g237_d220_distzero.js` (15 rows)

| Row | Held by |
|---|---|
| `D220-clear-zero` | `tests/integration/logging.test.js` › "free miles or a rep time rolled to zero store nothing, and a run with nothing left reads as not logged" |
| `D220-fixed-zero` | `tests/integration/logging.test.js` › "on a logged long run, miles rolled to 0.00 fall back to the planned 3.1 and its pace; to 0.75 they store 0.75" |
| `D220-format` | `tests/integration/logging.test.js` › "the miles and rep time wheels store their faces, and their zero faces store nothing"; `tests/integration/logging.test.js` › "a stored distance reads back by its first two decimals, clamps at 99, and a blank or malformed one lands on 0.00" |
| `D220-open` | `tests/integration/logging.test.js` › "a fresh run form opens on 3.10 and 0:00:00, 0:25:00 and 0.00, a rep time of 0:00, and a generic 0.00 with the pace on its dash" |
| `D220-rows` | `tests/integration/logging.test.js` › "the miles wheel shows whole miles 0 to 99 with no dash and no wrap, tenths and hundredths wrapping"; `tests/integration/logging.test.js` › "the rep time wheel shows minutes 0 to 9 with no dash and no wrap, seconds wrapping"; `tests/integration/logging.test.js` › "the pace wheel keeps its dash: minutes dash then 4 to 17, seconds wrapping"; `tests/integration/logging.test.js` › "the time wheel shows hours 0 to 9 with no dash and no wrap, minutes and seconds 00 to 59 wrapping, capped Time" |
| `D220-tail` | `tests/integration/logging.test.js` › "miles rolled from 0.00 are logged with their pace: 0.75 with 0:47:13, 0.75 on the planned 25 min, a 0:45 rep"; `tests/integration/logging.test.js` › "the hand paces are the arithmetic typed out"; `tests/sweeps/logging.test.js` › "no miles or rep time wheel on any run day of the run-goal lattice carries a dash row" |
| `D220-wrap` | `tests/integration/logging.test.js` › "hours, whole miles and rep minutes never wrap; every other column wraps unless it carries a dash" |
| `D220-zero` | `tests/integration/logging.test.js` › "the miles and rep time wheels store their faces, and their zero faces store nothing"; `tests/integration/logging.test.js` › "a stored distance reads back by its first two decimals, clamps at 99, and a blank or malformed one lands on 0.00"; `tests/integration/logging.test.js` › "the pace wheel reads and stores as before: blank or malformed stays on the dash, 9:30 round trips" |
| `D221-clear` | `tests/integration/logging.test.js` › "a reopened stamped long run clears in one roll of the time to zero, and every reader lets it go" |
| `D221-restamp` | `tests/integration/logging.test.js` › "on a reopened stamp the RPE moves no session number, and a new time re-stamps 3.1 with its pace" |
| `D221-rolled` | `tests/integration/logging.test.js` › "rolled miles survive a time clear as a miles-only log; a two-decimal plan stored as its own stamp drops on the next write" |
| `D221-seed` | `tests/integration/logging.test.js` › "a reopened stamp shows the plan face 3.10 with an empty hidden node and writes nothing; rolled miles seed their own" |
| `D221-swap` | `tests/integration/logging.test.js` › "a reopened stamp parks with its minutes on chip Bike and comes back unchanged on chip Run; a cleared one parks nothing" |
| `D222-digest` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION` (the era row, its value, and the program built twice); held by `tests/integration/program-output.test.js` › "program output matches tests/snapshots/program-output.json" (the HALF_MANNY digest 2d35e8f743680cfa) and › "every program equals itself when built twice" |
| `D222-pace` | `tests/integration/logging.test.js` › "the pace wheel keeps its dash: minutes dash then 4 to 17, seconds wrapping"; `tests/integration/logging.test.js` › "the pace wheel reads and stores as before: blank or malformed stays on the dash, 9:30 round trips" |

### `g238_d223_restlog.js` (11 rows)

| Row | Held by |
|---|---|
| `D223-carry` | `tests/integration/logging.test.js` › "a session moved onto a jog day leaves the jog whole through Done, an RPE, and a logged value" |
| `D223-lens` | `tests/integration/logging.test.js` › "a jog stored in the older flat shape reads as a rest log everywhere, and nothing is rewritten until the next save" |
| `D223-noseed` | `tests/integration/logging.test.js` › "a session moved onto a jog day opens empty: every node blank, Log, no nudge, the slider unmoved; Done stores blanks" |
| `D223-writer` | `tests/integration/logging.test.js` › "a rest-day jog stores exactly its own record: restLog with minutes, distance when typed and RPE, the week and a time"; `tests/integration/logging.test.js` › "the hosts are as typed: HALF_MANNY W1 has a rest Wednesday, a lifting Tuesday and the three run doses; the multi-sport cells exist" |
| `D224-hero` | `tests/integration/logging.test.js` › "the rest hero prints one line per logged type with Log more, and Log cardio when nothing is logged" |
| `D224-journal` | `tests/integration/logging.test.js` › "the journal prints a jog as the hero sentence, never an RPE label; an old cross-type jog prints its minutes; rows sort by time" |
| `D224-miles` | `tests/integration/logging.test.js` › "the week MILES tile adds the jog: 3.7 + 5.2 moved in = 8.9, 3.7 under a lift, 3.7 under a ride" |
| `D224-progress` | `tests/integration/logging.test.js` › "Progress sums the jog with the session, the plan drift ignores it, and the maxima take it as one candidate" |
| `D225-swapaway` | `tests/integration/logging.test.js` › "a day swapped away from its sport is never offered to the rest sheet; swapped back it is offered only if nothing was logged" |
| `D226-logmore` | `tests/integration/logging.test.js` › "Log more on a rest day never overwrites: a second run adds minutes and miles and keeps the higher RPE; a ride sits beside it" |
| `D227-digest` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION` (the era row, its value, and the program built twice); held by `tests/integration/program-output.test.js` › "program output matches tests/snapshots/program-output.json" (the HALF_MANNY digest 2d35e8f743680cfa) and › "every program equals itself when built twice" |
