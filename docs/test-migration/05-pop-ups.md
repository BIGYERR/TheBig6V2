# Moved: pop-ups (group 5)

Parity for phase 2 of the test migration (`docs/test-migration.md`, the parity rule): every manifest row of the two
pop-up gates, mapped to the new test that holds its claim. The gates stay in `tests/gates/` and keep running in CI
until phase 3 deletes them.

The new tests assert what the app does today: the REFUSED arm below V220 is not ported. The emoji scanner and its
allowlist classifier move whole into `tests/support/pop-ups.js` (measure's D174 census logic); the D175 hand tag
table, eligible-size table and calendar are ported as typed, and the eligible set is still read exactly (64 pinned
draws).

## Totals

- Rows: 52 over 2 gates (`tests/row_manifest.txt`).
- Mapped to a new test: 52.
- Dropped: 0.
- Mutations: not run (sabotage off).

## New files

- `tests/integration/pop-ups.test.js`: 34 tests, about 0.9 s.
- `tests/support/pop-ups.js`: the emoji scanner and allowlist classifier.

## Rows

### `g220_d174_emoji.js` (32 rows)

| Row | Held by |
|---|---|
| `A0` | `tests/integration/pop-ups.test.js` › "the emoji scanner reads the whole app: over 10,000 literals, both icon tables, no pictograph in code" |
| `A1` | `tests/integration/pop-ups.test.js` › "no emoji appears outside the celebration pop-ups and the icon tables" |
| `A2` | `tests/integration/pop-ups.test.js` › "every allowance resolves its anchor once and allows at least one emoji" |
| `B1` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B10` | `tests/integration/pop-ups.test.js` › "the re-entry message after a week off reads as ruled" |
| `B11` | `tests/integration/pop-ups.test.js` › "the old dashed and hyphenated copy is gone, raw and escape-decoded" |
| `B12` | `tests/integration/pop-ups.test.js` › "the short-gap reminder line "This one got away from you" is gone" |
| `B13` | `tests/integration/pop-ups.test.js` › "the wizard seed caption reads Estimated from "the program". Edit if you know better., with no em-dash" |
| `B2` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B3` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B4` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B5` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B6` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B7` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B8` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `B9` | `tests/integration/pop-ups.test.js` › "the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji" |
| `C5` | `tests/integration/pop-ups.test.js` › "the reminder pool is five plain ASCII lines" |
| `D1` | `tests/integration/pop-ups.test.js` › "the reminder pop-up shows the notebook icon" |
| `D2a` | `tests/integration/pop-ups.test.js` › "the injury check-ins show the shield, or the warning when trending worse" |
| `D2b` | `tests/integration/pop-ups.test.js` › "the injury check-ins show the shield, or the warning when trending worse" |
| `D2c` | `tests/integration/pop-ups.test.js` › "the injury check-ins show the shield, or the warning when trending worse" |
| `D2d` | `tests/integration/pop-ups.test.js` › "the injury check-ins show the shield, or the warning when trending worse" |
| `D3a` | `tests/integration/pop-ups.test.js` › "a reminder pop-up writes the notebook SVG into its icon, not text" |
| `D3b` | `tests/integration/pop-ups.test.js` › "an injury pop-up writes the shield or warning SVG into its icon" |
| `D3c` | `tests/integration/pop-ups.test.js` › "the workout, streak and season pop-ups show the party popper, fire and trophy as text, never through asyIcon" |
| `D4a` | `tests/integration/pop-ups.test.js` › "the chrome shows icons where it had emoji: the seed caption and header, the log nudge, the archived chip" |
| `D4b` | `tests/integration/pop-ups.test.js` › "the chrome shows icons where it had emoji: the seed caption and header, the log nudge, the archived chip" |
| `D4c` | `tests/integration/pop-ups.test.js` › "the chrome shows icons where it had emoji: the seed caption and header, the log nudge, the archived chip" |
| `D4d` | `tests/integration/pop-ups.test.js` › "the chrome shows icons where it had emoji: the seed caption and header, the log nudge, the archived chip" |
| `E1` | `tests/integration/pop-ups.test.js` › "the emoji allowlist lets a celebration line through and catches the nudge and the reminder pool" |
| `E2` | `tests/integration/pop-ups.test.js` › "the emoji allowlist lets a celebration line through and catches the nudge and the reminder pool" |
| `E3` | `tests/integration/pop-ups.test.js` › "the emoji allowlist lets a celebration line through and catches the nudge and the reminder pool" |

### `g220_d175_popcond.js` (20 rows)

| Row | Held by |
|---|---|
| `E1` | `tests/integration/pop-ups.test.js` › "the workout line is drawn from what the trained day was: its weekday, the morning only when it is today, cardio or lifting" |
| `E1-0` | `tests/integration/pop-ups.test.js` › "the hand rule reproduces the eligible-size table, and a later tap reads like a tap after 9" |
| `E1r` | `tests/integration/pop-ups.test.js` › "on real HALF_MANNY days of each shape the draw matches the hand rule, today and later, before and after 9" |
| `E2a` | `tests/integration/pop-ups.test.js` › "marking a run-only weekday done draws only untagged lines" |
| `E2b` | `tests/integration/pop-ups.test.js` › "marking Saturday's long run done on Monday can draw the weekend lines, never the morning or lifting ones" |
| `E2c` | `tests/integration/pop-ups.test.js` › "a lift-only Saturday never draws the weekend cardio line, and can draw the weekend and lifting ones" |
| `E3a` | `tests/integration/pop-ups.test.js` › "a reminder after a short gap draws a reminder line and says the week ahead stays as written" |
| `E3b` | `tests/integration/pop-ups.test.js` › "the short-gap reminder rotates: no line twice in a row, and the draw is remembered" |
| `E3c` | `tests/integration/pop-ups.test.js` › "a reminder after more than a week off shows the fixed re-entry message under the bare day name" |
| `E4a` | `tests/integration/pop-ups.test.js` › "with no trained day to read, only the untagged lines are drawn, even at a Saturday 07:00 tap" |
| `E4b` | `tests/integration/pop-ups.test.js` › "with no trained day to read, only the untagged lines are drawn, even at a Saturday 07:00 tap" |
| `E4c` | `tests/integration/pop-ups.test.js` › "with no trained day to read, only the untagged lines are drawn, even at a Saturday 07:00 tap" |
| `E5a` | `tests/integration/pop-ups.test.js` › "the pools hold 27 workout, 5 reminder, 5 streak and 9 season lines" |
| `E5b` | `tests/integration/pop-ups.test.js` › "each tagged workout line sits at its index" |
| `E5c` | `tests/integration/pop-ups.test.js` › "the reminder, streak and season pools carry no tags" |
| `E5d` | `tests/integration/pop-ups.test.js` › "the draw never repeats the last line, and remembers the one it drew" |
| `E5e` | `tests/integration/pop-ups.test.js` › "the Wildcard pop-up says its own line under WILDCARD DONE" |
| `E5f` | `tests/integration/pop-ups.test.js` › "the streak and season pop-ups draw from their own pools" |
| `S0` | `tests/integration/pop-ups.test.js` › "the hand calendar agrees with the host clock: 2026-09-14 is a Monday, and the taps fall where typed" |
| `S1` | `tests/integration/pop-ups.test.js` › "HALF_MANNY reads 14 lift-only, 45 run and lift, 9 run and mobility and 2 run-only days, and its long run is a Saturday with mobility" |
