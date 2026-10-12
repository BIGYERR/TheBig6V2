# Group 8: progress, ledger and Wildcards

Phase 2 parity for four gates, 210 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test, dropped for a written reason, or handed to another group (`docs/test-migration.md`, The parity rule).

The new tests assert what the app does today (0.239.1). The one version arm a gate carried (g224's decline below 224)
is not ported; its row's claim, the today rule is in the stylesheet, is. The hand oracles are ported as typed: the
D53 after grid in lbs and kg (80 lbs is 36.5 kg, 60 lbs is 27 kg), the implement word list, the D55 prescription
grammar, the D56 to D59 store tables and their arithmetic (48 sessions, 1,476 reps; 24 entries, 171 reps off the line;
16 = 5 + 6 + 5), the ruled copy, the HTML entity rules, the flame path, the colour tokens, the WCAG formula, the CSS
cascade resolver, and the calendar arithmetic (Date(y, m, d + n), never a millisecond division).

Two things differ from the gates on purpose:

- **The Wildcard runs on every weekday.** g195 built its fixture around the real clock, so each CI run checked one
  weekday. The new tests pin the app's clock and run each behaviour with today on each of the seven days of the week of
  Monday 2026-09-14, so Sunday's index 6 and the rest sets that change when today is a Sunday or a Wednesday are
  checked every run.
- **The daylight saving lattice runs twice.** The integration file runs all 25 lattice cases in New York (a child
  process with `TZ` set, so a change falls inside the blocks on any machine); `tests/sweeps/wildcard.test.js` runs them
  in the gate's seven zones, one child each.

New files:

- `tests/integration/progress.test.js` (13 tests, 0.1 to 0.6 s): D53, the main lift progress line, on a hand model;
  D55, the Range Ladder reads the last session that carries a range, on hand logs.
- `tests/integration/ledger.test.js` (26 tests, 0.2 to 1.0 s): D56 to D59, the Lift Ledger rendered from hand stores,
  and the swap sheet's MAIN LIFT and HEAVY COMPOUND tags on Mario's program (HALF_MANNY, built twice and equal to
  itself first).
- `tests/integration/wildcard.test.js` (48 tests, 0.4 to 2.0 s): D64, D71 and D71b, the Wildcard, rendered through
  renderWeekView, openDetail and completeWildcard; the day lattice in New York; D185, the mark and the tick on today's
  orange cell, through the CSS cascade resolver.
- `tests/sweeps/wildcard.test.js` (7 tests, 0.7 to 1.9 s, CI only): the day lattice in seven time zones.
- `tests/support/ledger.js`: the store builder, the Progress screen render and its card readers, the swap sheet tags,
  and the Range Ladder log builder.
- `tests/support/wildcard.js`: the hand calendar, the Wildcard bench (the app with a document that keeps its elements,
  the pop-ups as spies, the hand six week program), the day lattice and its child process entry, and the CSS cascade
  resolver.

Times are wall clock for `node --test <file>` alone, over four runs on a machine shared with other agents.

Totals: **210 rows: 205 mapped, 0 dropped, 5 handed to group 13.** The five are g194's D54 rows (the travel overlay's
holds copy names no implement); the migration map counts g194 under this group but sends its D54 rows to group 13,
`tests/integration/injury-overlays.test.js`. They are listed below so group 13's move picks them up; until it does,
g194 cannot be deleted. Mutations: not run (sabotage off).

Discrimination, checked once against the release before each ruling (`IA_APP=<that body>`): on V193,
`progress.test.js` fails 7 of 13 (the lbs and kg lines, the gain expression, and every D55 claim but its three
controls); on V194, `wildcard.test.js` fails 34 of 48; on V195, `ledger.test.js` fails 18 of 26; on V223, the four
D185 colour tests fail and the other 44 pass. A copy of today's app with `Math.floor` for the day count in
`wildcardDayFor` fails the New York test and five of the seven zones (UTC and Kolkata have no change to catch it).

## Rows

### `g194_implement_and_range.js` (21 rows)

16 mapped, 5 handed to group 13. The five D54 rows read the travel overlay's holds seam
(`const holds = _ovDraft.equipment===...` and its two branch lines): the non-bodyweight branch carries "Grab the
heaviest load you can control and work in the 8 to 12 range." (`D54-copy`) and keeps "If that still feels easy, go
single arm." (`D54-singlearm`); neither branch names an implement from the gate's word list (`D54-noimpl`) or carries a
mid-sentence hyphen or an em-dash (`D54-hyphen`); the seam stays one bodyweight test with no other equipment
conditional (`D54-branch`).

| Row | Held by |
|---|---|
| `D53-expr` | `tests/integration/progress.test.js` › "the progress line has one conditional, the numeric gain test, and names no implement" |
| `D53-flat` | `tests/integration/progress.test.js` › "with no gain the progress line drops the gain clause entirely and still names the heaviest week" |
| `D53-kg` | `tests/integration/progress.test.js` › "in kg the progress line reads Bench press 36.5×12 Opened at 27×12 in week 1 · up 9.5 kg · heaviest in week 3" |
| `D53-lbs` | `tests/integration/progress.test.js` › "the progress line reads Bench press 80×12 Opened at 60×12 in week 1 · up 20 lbs · heaviest in week 3" |
| `D53-noimpl` | `tests/integration/progress.test.js` › "the progress line names no implement, in either unit" |
| `D54-branch` | Group 13 (injury and travel overlays): the migration map sends the D54 rows to `tests/integration/injury-overlays.test.js`; not ported in this move |
| `D54-copy` | Group 13 (injury and travel overlays): the migration map sends the D54 rows to `tests/integration/injury-overlays.test.js`; not ported in this move |
| `D54-hyphen` | Group 13 (injury and travel overlays): the migration map sends the D54 rows to `tests/integration/injury-overlays.test.js`; not ported in this move |
| `D54-noimpl` | Group 13 (injury and travel overlays): the migration map sends the D54 rows to `tests/integration/injury-overlays.test.js`; not ported in this move |
| `D54-singlearm` | Group 13 (injury and travel overlays): the migration map sends the D54 rows to `tests/integration/injury-overlays.test.js`; not ported in this move |
| `D55-ctlA` | `tests/integration/progress.test.js` › "a lift that never carried a range falls to Other Accessory Work" |
| `D55-ctlB` | `tests/integration/progress.test.js` › "a lift whose last session carries the range is ranked on it and scored ready on 12s" |
| `D55-ctlC` | `tests/integration/progress.test.js` › "a main slot lift routes to the main lifts even when its last session is a primer with no range" |
| `D55-lastset` | `tests/integration/progress.test.js` › "the ladder takes its sets and weight from the last session, and a primer week is not scored ready against a range it was never given" |
| `D55-primer-ladder` | `tests/integration/progress.test.js` › "a primer week logged last keeps the lift in the Range Ladder, on week 1's 8 to 12" |
| `D55-primer-range` | `tests/integration/progress.test.js` › "a primer week logged last keeps the lift in the Range Ladder, on week 1's 8 to 12" |
| `D55-ready` | `tests/integration/progress.test.js` › "the ladder takes its sets and weight from the last session, and a primer week is not scored ready against a range it was never given" |
| `D55-recency` | `tests/integration/progress.test.js` › "the most recent session that carries a range wins, whatever order the entries were stored in" |
| `D55-struct` | `tests/integration/progress.test.js` › "ledgerModel holds the range in one binding: declared null, set only by the backward walk, read by the ranking" |
| `R1-ledgerModel` | `tests/integration/progress.test.js` › "ledgerModel and buildMainLiftBlock are functions the app defines" |
| `R2-mainLiftBlock` | `tests/integration/progress.test.js` › "ledgerModel and buildMainLiftBlock are functions the app defines" |

### `g195_wildcard.js` (110 rows)

110 mapped. The 25 lattice rows (`dst1` to `dst25`) are held twice: in New York in the integration file and in all
seven zones in the sweep; `dst0-zones`, the child ran to its end in every zone, is the sweep's per zone test.

| Row | Held by |
|---|---|
| `copy1-ruled` | `tests/integration/wildcard.test.js` › "every Wildcard string the app rendered or popped reads the ruled text" |
| `copy2-harvested` | `tests/integration/wildcard.test.js` › "no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR" |
| `copy3-hyphen` | `tests/integration/wildcard.test.js` › "no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR" |
| `copy4-nike` | `tests/integration/wildcard.test.js` › "no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR" |
| `copy5-skipped` | `tests/integration/wildcard.test.js` › "no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR" |
| `copy6-claims` | `tests/integration/wildcard.test.js` › "no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR" |
| `det1-runs` | `tests/integration/wildcard.test.js` › "the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped" |
| `det2-tag` | `tests/integration/wildcard.test.js` › "the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped" |
| `det3-first` | `tests/integration/wildcard.test.js` › "the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped" |
| `det4-title` | `tests/integration/wildcard.test.js` › "the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped" |
| `det5-escape` | `tests/integration/wildcard.test.js` › "the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped" |
| `det6-notag` | `tests/integration/wildcard.test.js` › "the day detail carries no Wildcard tag when none is stored" |
| `dst0-zones` | `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst1-us-spring` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst10-on-south` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst11-midweek` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst12-saturday` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst13-year` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst14-leap` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst15-sunday-wrap` | `tests/integration/wildcard.test.js` › "Sunday, the seventh weekday, resolves to the Sunday of week 1"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst16-rest-resolves` | `tests/integration/wildcard.test.js` › "a rest day still resolves to its day, and scheduledDays drops it"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst17-sched-drops-rest` | `tests/integration/wildcard.test.js` › "a rest day still resolves to its day, and scheduledDays drops it"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst18-before-start` | `tests/integration/wildcard.test.js` › "the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst19-week1-monday` | `tests/integration/wildcard.test.js` › "the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst2-us-fall` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst20-first-day` | `tests/integration/wildcard.test.js` › "the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst21-last-day` | `tests/integration/wildcard.test.js` › "the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst22-after-end` | `tests/integration/wildcard.test.js` › "the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst23-missing-day` | `tests/integration/wildcard.test.js` › "a missing day, a missing start date or no program resolves to nothing"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst24-no-start` | `tests/integration/wildcard.test.js` › "a missing day, a missing start date or no program resolves to nothing"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst25-no-prog` | `tests/integration/wildcard.test.js` › "a missing day, a missing start date or no program resolves to nothing"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst3-eu-spring` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst4-eu-fall` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst5-south-autumn` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst6-south-spring` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst7-on-us-spring` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst8-on-us-fall` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `dst9-on-eu-spring` | `tests/integration/wildcard.test.js` › "in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February"; `tests/sweeps/wildcard.test.js` › "in <zone> every day of every block resolves to the hand calendar and back, edges and odd programs included" (one test per zone, seven zones) |
| `label1-mygoal` | `tests/integration/wildcard.test.js` › "the Wildcard filter bar says My Goal, with no parenthetical"; `tests/integration/wildcard.test.js` › "every Wildcard string the app rendered or popped reads the ruled text" |
| `label2-pools` | `tests/integration/wildcard.test.js` › "with no endurance pool, an endurance goal's My Goal draw falls back to the balanced pool" |
| `mark1-svg` | `tests/integration/wildcard.test.js` › "the mark is the flame icon as inline SVG plus a W, never an emoji" |
| `mark2-signal` | `tests/integration/wildcard.test.js` › "the W mark is painted signal orange, #CF4E1A" |
| `mark3-glyph` | `tests/integration/wildcard.test.js` › "the flame comes from the icon table, which defines it once" |
| `out1-runs` | `tests/integration/wildcard.test.js` › "off the calendar of the block a Wildcard still counts, stamps no day and writes nothing else" |
| `out2-logs` | `tests/integration/wildcard.test.js` › "off the calendar of the block a Wildcard still counts, stamps no day and writes nothing else" |
| `out3-nostamp` | `tests/integration/wildcard.test.js` › "off the calendar of the block a Wildcard still counts, stamps no day and writes nothing else" |
| `out4-nowrite` | `tests/integration/wildcard.test.js` › "off the calendar of the block a Wildcard still counts, stamps no day and writes nothing else" |
| `out5-nomark` | `tests/integration/wildcard.test.js` › "an unstamped record renders no mark and no tag on any day" |
| `read1-counter` | `tests/integration/wildcard.test.js` › "the x/y counter counts records with and without a day stamp" |
| `read2-badge` | `tests/integration/wildcard.test.js` › "the Done Before badge reads the title whatever the record shape, and an empty store offers the Complete button" |
| `read3-empty` | `tests/integration/wildcard.test.js` › "the Done Before badge reads the title whatever the record shape, and an empty store offers the Complete button" |
| `rest1-runs` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest10-kicker` | `tests/integration/wildcard.test.js` › "the rest day pop-up says WILDCARD DONE, You showed up. That is the whole game., Streak holds., with no stats and no season or completion pop-up" |
| `rest11-sub` | `tests/integration/wildcard.test.js` › "the rest day pop-up says WILDCARD DONE, You showed up. That is the whole game., Streak holds., with no stats and no season or completion pop-up" |
| `rest12-season` | `tests/integration/wildcard.test.js` › "the rest day pop-up says WILDCARD DONE, You showed up. That is the whole game., Streak holds., with no stats and no season or completion pop-up" |
| `rest13-nopr` | `tests/integration/wildcard.test.js` › "the rest day pop-up says WILDCARD DONE, You showed up. That is the whole game., Streak holds., with no stats and no season or completion pop-up" |
| `rest2-comp` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest3-hist` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest4-record` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest5-stamp` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest6-bydate` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest7-roundtrip` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else" |
| `rest8-streak` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day leaves the streak at 2 and the completed count at 2" |
| `rest9-count` | `tests/integration/wildcard.test.js` › "a Wildcard on a rest day leaves the streak at 2 and the completed count at 2" |
| `src1-writers` | `tests/integration/wildcard.test.js` › "completeWildcard calls no completion writer and no completion or season pop-up" |
| `src2-escalate` | `tests/integration/wildcard.test.js` › "the Wildcard pop-up calls popFire once and nothing that escalates to a season or a completion" |
| `src3-completed` | `tests/integration/wildcard.test.js` › "completedCount, skippedCount and refreshProgram never read the Wildcard store" |
| `src4-skipped` | `tests/integration/wildcard.test.js` › "completedCount, skippedCount and refreshProgram never read the Wildcard store" |
| `src5-refresh` | `tests/integration/wildcard.test.js` › "completedCount, skippedCount and refreshProgram never read the Wildcard store" |
| `src6-noskip` | `tests/integration/wildcard.test.js` › "no function of the Wildcard flow contains the word skipped" |
| `stk1-handwalk` | `tests/integration/wildcard.test.js` › "a skipped day with no Wildcard breaks the streak to 0, with one skip and two completions counted" |
| `stk10-pending` | `tests/integration/wildcard.test.js` › "a Wildcard on a pending day starts a streak of 1 without writing a completion" |
| `stk11-nocomp` | `tests/integration/wildcard.test.js` › "a Wildcard on a pending day starts a streak of 1 without writing a completion" |
| `stk12-rest` | `tests/integration/wildcard.test.js` › "a rest day Wildcard is invisible to the streak, even on a rest day marked skipped" |
| `stk13-rest-sched` | `tests/integration/wildcard.test.js` › "a rest day Wildcard is invisible to the streak, even on a rest day marked skipped" |
| `stk14-rest-skip` | `tests/integration/wildcard.test.js` › "a rest day Wildcard is invisible to the streak, even on a rest day marked skipped" |
| `stk2-control` | `tests/integration/wildcard.test.js` › "a skipped day with no Wildcard breaks the streak to 0, with one skip and two completions counted" |
| `stk3-control-counts` | `tests/integration/wildcard.test.js` › "a skipped day with no Wildcard breaks the streak to 0, with one skip and two completions counted" |
| `stk4-rescue` | `tests/integration/wildcard.test.js` › "a Wildcard on a skipped day rescues the streak to 3 and moves neither count" |
| `stk5-rescue-counts` | `tests/integration/wildcard.test.js` › "a Wildcard on a skipped day rescues the streak to 3 and moves neither count" |
| `stk6-order` | `tests/integration/wildcard.test.js` › "the rescue is the same whichever was stored first, the skip or the Wildcard" |
| `stk7-perday` | `tests/integration/wildcard.test.js` › "the rescue is per day: an unrescued skip behind it breaks at 1, and two rescued skips carry to 3" |
| `stk8-two` | `tests/integration/wildcard.test.js` › "the rescue is per day: an unrescued skip behind it breaks at 1, and two rescued skips carry to 3" |
| `stk9-once` | `tests/integration/wildcard.test.js` › "a day holding both a completion and a Wildcard counts once" |
| `strip1-render` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip2-cells` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip3-mark` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip4-others` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip5-one` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip6-replace` | `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `strip7-nochk` | `tests/integration/wildcard.test.js` › "the Wildcard day shows no completion tick, and a completed day shows the tick ✓ and not the W" |
| `strip8-future` | `tests/integration/wildcard.test.js` › "a browsed future week shows no Wildcard mark and no tag" |
| `strip9-chkwins` | `tests/integration/wildcard.test.js` › "the Wildcard day shows no completion tick, and a completed day shows the tick ✓ and not the W" |
| `train1-handwalk` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train2-runs` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train3-comp` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train4-hist` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train5-pending` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train6-streak` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day extends the streak from 2 to 3 and says Streak: 3., with no season or completion pop-up" |
| `train7-count` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day writes no completion and leaves the prescribed session pending" |
| `train8-sub` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day extends the streak from 2 to 3 and says Streak: 3., with no season or completion pop-up" |
| `train9-season` | `tests/integration/wildcard.test.js` › "a Wildcard on a training day extends the streak from 2 to 3 and says Streak: 3., with no season or completion pop-up" |
| `wv1-rest-tag` | `tests/integration/wildcard.test.js` › "on a rest day the week view prints the tag WILDCARD DONE, Rest day. The streak sits this one out., below the hero and above the stat tiles" |
| `wv2-rest-copy` | `tests/integration/wildcard.test.js` › "on a rest day the week view prints the tag WILDCARD DONE, Rest day. The streak sits this one out., below the hero and above the stat tiles" |
| `wv3-rest-pos` | `tests/integration/wildcard.test.js` › "on a rest day the week view prints the tag WILDCARD DONE, Rest day. The streak sits this one out., below the hero and above the stat tiles" |
| `wv4-rest-lbl` | `tests/integration/wildcard.test.js` › "on a rest day the week view prints the tag WILDCARD DONE, Rest day. The streak sits this one out., below the hero and above the stat tiles" |
| `wv5-train-tag` | `tests/integration/wildcard.test.js` › "on a training day the week view tag names the prescribed session, never the rest line" |
| `wv6-train-title` | `tests/integration/wildcard.test.js` › "on a training day the week view tag names the prescribed session, never the rest line" |
| `wv7-train-norest` | `tests/integration/wildcard.test.js` › "on a training day the week view tag names the prescribed session, never the rest line" |
| `wv8-empty` | `tests/integration/wildcard.test.js` › "with no Wildcard stored the week view prints no tag" |

### `g196_ledger.js` (55 rows)

55 mapped.

| Row | Held by |
|---|---|
| `A0` | `tests/integration/ledger.test.js` › "the hand tables add up: 48 bodyweight sessions and 1476 reps under ten store keys, 24 mixed entries and 171 reps off the line" |
| `A0b` | `tests/integration/ledger.test.js` › "the hand tables add up: 48 bodyweight sessions and 1476 reps under ten store keys, 24 mixed entries and 171 reps off the line" |
| `A1` | `tests/integration/ledger.test.js` › "a fully populated bodyweight store renders a Main Lifts card: ten lifts, one dot per session, 48 in all" |
| `A10` | `tests/integration/ledger.test.js` › "no unloaded main lift lands in Other Accessory Work" |
| `A11` | `tests/integration/ledger.test.js` › "a fully populated bodyweight store renders a Main Lifts card: ten lifts, one dot per session, 48 in all" |
| `A2` | `tests/integration/ledger.test.js` › "a fully populated bodyweight store renders a Main Lifts card: ten lifts, one dot per session, 48 in all" |
| `A3` | `tests/integration/ledger.test.js` › "a fully populated bodyweight store renders a Main Lifts card: ten lifts, one dot per session, 48 in all" |
| `A4` | `tests/integration/ledger.test.js` › "a reps block heads with its best set, 13 reps, and reads Opened at 10 reps in week 1 · up 3 reps · best in week 9" |
| `A5` | `tests/integration/ledger.test.js` › "a reps block heads with its best set, 13 reps, and reads Opened at 10 reps in week 1 · up 3 reps · best in week 9" |
| `A6` | `tests/integration/ledger.test.js` › "a lift that never improved prints no gain and names its own best week" |
| `A7` | `tests/integration/ledger.test.js` › "a reps block never prints a load unit or the weight×reps grammar" |
| `A8` | `tests/integration/ledger.test.js` › "a reps block never prints a load unit or the weight×reps grammar" |
| `A9` | `tests/integration/ledger.test.js` › "a card that withheld nothing discloses nothing" |
| `B0` | `tests/integration/ledger.test.js` › "the hand tables add up: 48 bodyweight sessions and 1476 reps under ten store keys, 24 mixed entries and 171 reps off the line" |
| `B1` | `tests/integration/ledger.test.js` › "a mixed lift plots only its five loaded main sessions, weeks 6 to 10, and carries no weight across the blank weeks" |
| `B10` | `tests/integration/ledger.test.js` › "the card closes on its own rendered numbers: 9 dots + 10 withheld + 5 blank = 24 sessions" |
| `B11` | `tests/integration/ledger.test.js` › "the footer states 10 accessory sessions and 5 with no load, in two ruled clauses and never one number" |
| `B12` | `tests/integration/ledger.test.js` › "per lift, plotted + accessory day + no load equals its entries, as the hand table says" |
| `B2` | `tests/integration/ledger.test.js` › "a mixed lift plots only its five loaded main sessions, weeks 6 to 10, and carries no weight across the blank weeks" |
| `B3` | `tests/integration/ledger.test.js` › "a mixed lift plots only its five loaded main sessions, weeks 6 to 10, and carries no weight across the blank weeks" |
| `B4` | `tests/integration/ledger.test.js` › "Opened at names the first plotted week, 45×8 in week 6, and the headline is the heaviest set, 65×8 in week 10" |
| `B5` | `tests/integration/ledger.test.js` › "Opened at names the first plotted week, 45×8 in week 6, and the headline is the heaviest set, 65×8 in week 10" |
| `B6` | `tests/integration/ledger.test.js` › "a main lift with every load blank renders as a reps block instead of vanishing" |
| `B7` | `tests/integration/ledger.test.js` › "the footer states 10 accessory sessions and 5 with no load, in two ruled clauses and never one number" |
| `B8` | `tests/integration/ledger.test.js` › "the footer states 10 accessory sessions and 5 with no load, in two ruled clauses and never one number" |
| `B9` | `tests/integration/ledger.test.js` › "the footer states 10 accessory sessions and 5 with no load, in two ruled clauses and never one number" |
| `C1` | `tests/integration/ledger.test.js` › "every populated store key lands in exactly one bucket" |
| `C2` | `tests/integration/ledger.test.js` › "an unloaded main lift is a main lift, never Other Accessory Work" |
| `C3` | `tests/integration/ledger.test.js` › "a main lift chart plots its main slot sessions only, never the lighter accessory days" |
| `D1` | `tests/integration/ledger.test.js` › "a lift with one plotted session prints its headline, 95×5, and no chart" |
| `D2` | `tests/integration/ledger.test.js` › "a lift with one plotted session prints its headline, 95×5, and no chart" |
| `D3` | `tests/integration/ledger.test.js` › "one withheld and one blank session each read as one session, and the card closes 1 + 1 + 1 = 3" |
| `D4` | `tests/integration/ledger.test.js` › "one withheld and one blank session each read as one session, and the card closes 1 + 1 + 1 = 3" |
| `D5` | `tests/integration/ledger.test.js` › "one withheld and one blank session each read as one session, and the card closes 1 + 1 + 1 = 3" |
| `E1` | `tests/integration/ledger.test.js` › "the Main Lifts footer opens with The top set you actually did., keeps the no estimated maxes line, and says what the card holds" |
| `E2` | `tests/integration/ledger.test.js` › "the Main Lifts footer opens with The top set you actually did., keeps the no estimated maxes line, and says what the card holds" |
| `E3` | `tests/integration/ledger.test.js` › "the Main Lifts footer opens with The top set you actually did., keeps the no estimated maxes line, and says what the card holds" |
| `E4` | `tests/integration/ledger.test.js` › "the Main Lifts footer opens with The top set you actually did., keeps the no estimated maxes line, and says what the card holds" |
| `E5` | `tests/integration/ledger.test.js` › "the card is called Main Lifts, never Top Lifts" |
| `F1` | `tests/integration/ledger.test.js` › "the Range Ladder card is titled Range Ladder, with no Accessories and no em-dash, and ranks its lift" |
| `F2` | `tests/integration/ledger.test.js` › "the Range Ladder card is titled Range Ladder, with no Accessories and no em-dash, and ranks its lift" |
| `F3` | `tests/integration/ledger.test.js` › "the Range Ladder card is titled Range Ladder, with no Accessories and no em-dash, and ranks its lift" |
| `F4` | `tests/integration/ledger.test.js` › "the Range Ladder head line says across these lifts this block, never across your accessories" |
| `F5` | `tests/integration/ledger.test.js` › "the Range Ladder head line says across these lifts this block, never across your accessories" |
| `F6` | `tests/integration/ledger.test.js` › "the Range Ladder card is titled Range Ladder, with no Accessories and no em-dash, and ranks its lift" |
| `G0` | `tests/integration/ledger.test.js` › "Mario's program builds the same twice and offers a main slot lift and a Barbell Romanian deadlift outside the main slot" |
| `G1` | `tests/integration/ledger.test.js` › "the swap sheet tags a main slot lift MAIN LIFT, never HEAVY COMPOUND" |
| `G2` | `tests/integration/ledger.test.js` › "the swap sheet tags a main slot lift MAIN LIFT, never HEAVY COMPOUND" |
| `G3` | `tests/integration/ledger.test.js` › "the swap sheet tags a barbell compound outside the main slot HEAVY COMPOUND, never MAIN LIFT, among its three tags" |
| `G4` | `tests/integration/ledger.test.js` › "the swap sheet tags a barbell compound outside the main slot HEAVY COMPOUND, never MAIN LIFT, among its three tags" |
| `G5` | `tests/integration/ledger.test.js` › "the swap sheet tags a barbell compound outside the main slot HEAVY COMPOUND, never MAIN LIFT, among its three tags" |
| `H0` | `tests/integration/ledger.test.js` › "the ledger copy carries no em-dash, no spaced hyphen, no Nike and no sentence over 26 words" |
| `H1` | `tests/integration/ledger.test.js` › "the ledger copy carries no em-dash, no spaced hyphen, no Nike and no sentence over 26 words" |
| `H2` | `tests/integration/ledger.test.js` › "the ledger copy carries no em-dash, no spaced hyphen, no Nike and no sentence over 26 words" |
| `H3` | `tests/integration/ledger.test.js` › "the ledger copy carries no em-dash, no spaced hyphen, no Nike and no sentence over 26 words" |

### `g224_d185_wctoday.js` (24 rows)

24 mapped. `D185` printed the rule's presence behind a version predicate; the presence is held, the predicate is not
ported. The two "untouched" guards are held by behaviour: `wildcardMarkHTML` renders the mark, and a completed cell's
centre is `<span class="chk">✓</span>`.

| Row | Held by |
|---|---|
| `1b` | `tests/integration/wildcard.test.js` › "the five glyph colour rules sit together in the stylesheet once each, in order: tick, W mark, mark base, the today rule, the W letter" |
| `D185` | `tests/integration/wildcard.test.js` › "the five glyph colour rules sit together in the stylesheet once each, in order: tick, W mark, mark base, the today rule, the W letter" |
| `L:0308f6f4` (`today + chk contrast clears WCAG AA large-text/UI floor (<n>:<n>), was <n>`) | `tests/integration/wildcard.test.js` › "on today's cell the W mark and the tick read at the skip glyph's contrast, about 4.10:1, above the 3:1 floor" |
| `L:04eafae7` (`not-today + wc-mark still resolves to --signal (unchanged)`) | `tests/integration/wildcard.test.js` › "on any other day the W mark stays signal and the tick stays run" |
| `L:07a0f193` (`skip glyph carries no rule of its own on .chk/.wc-mark (none matches a bare wk-day-num)`) | `tests/integration/wildcard.test.js` › "the skip glyph on today's cell takes on-signal from the today date rule, and no tick or W rule reaches it" |
| `L:23bcf896` (`rule count for the anchor family did not grow beyond the licensed insertion (<n> pre-existing + <n> from the new comma rule = <n>)`) | `tests/integration/wildcard.test.js` › "only five colour rules name the tick or the W mark: three for the glyphs and two from the today rule" |
| `L:2606f04f` (`today + wc-mark contrast now equals the ✕-today baseline (<q>)`) | `tests/integration/wildcard.test.js` › "on today's cell the W mark and the tick read at the skip glyph's contrast, about 4.10:1, above the 3:1 floor" |
| `L:2e182456` (`today + wc-mark resolves color to --on-signal`) | `tests/integration/wildcard.test.js` › "on today's orange cell the W mark and the tick resolve to on-signal, through the today rule" |
| `L:35e6c0bc` (`skip glyph winner is :<n>, not the new D<n> rule`) | `tests/integration/wildcard.test.js` › "the skip glyph on today's cell takes on-signal from the today date rule, and no tick or W rule reaches it" |
| `L:46a3e9a4` (`not-today + wc-mark contrast unchanged (~<n>, still not the fix target)`) | `tests/integration/wildcard.test.js` › "off today the W mark reads about 3.91:1 and the tick between 3 and 3.6 on the page background" |
| `L:4861a91e` (`today + chk contrast now equals the ✕-today baseline (<q>)`) | `tests/integration/wildcard.test.js` › "on today's cell the W mark and the tick read at the skip glyph's contrast, about 4.10:1, above the 3:1 floor" |
| `L:5f53313f` (`today + wc-mark cascade winner is the D<n> rule`) | `tests/integration/wildcard.test.js` › "on today's orange cell the W mark and the tick resolve to on-signal, through the today rule" |
| `L:5f5556ba` (`today + chk cascade winner is the D<n> rule`) | `tests/integration/wildcard.test.js` › "on today's orange cell the W mark and the tick resolve to on-signal, through the today rule" |
| `L:66cc634d` (`token sanity: --signal is #CF<n>E<n>A per D<n> finding`) | `tests/integration/wildcard.test.js` › "the colour tokens are signal #CF4E1A, on-signal #FBF6EE and run #5e8c54" |
| `L:72616b9d` (`token sanity: --run is #<n>e<n>c<n> per D<n> finding`) | `tests/integration/wildcard.test.js` › "the colour tokens are signal #CF4E1A, on-signal #FBF6EE and run #5e8c54" |
| `L:7c39ea45` (`renderWeekView chk/wc-mark center logic untouched`) | `tests/integration/wildcard.test.js` › "the Wildcard day shows no completion tick, and a completed day shows the tick ✓ and not the W"; `tests/integration/wildcard.test.js` › "the week strip marks the Wildcard day with a W in place of its date, on that cell only" |
| `L:95303a2a` (`not-today + chk still resolves to --run (unchanged)`) | `tests/integration/wildcard.test.js` › "on any other day the W mark stays signal and the tick stays run" |
| `L:95dd76be` (`token sanity: --on-signal is #FBF<n>EE per D<n> finding`) | `tests/integration/wildcard.test.js` › "the colour tokens are signal #CF4E1A, on-signal #FBF6EE and run #5e8c54" |
| `L:ab66b3e9` (`today + chk resolves color to --on-signal`) | `tests/integration/wildcard.test.js` › "on today's orange cell the W mark and the tick resolve to on-signal, through the today rule" |
| `L:b63f5d2c` (`wildcardMarkHTML untouched`) | `tests/integration/wildcard.test.js` › "the mark is the flame icon as inline SVG plus a W, never an emoji" |
| `L:cc456127` (`not-today + chk contrast unchanged (~<n>)`) | `tests/integration/wildcard.test.js` › "off today the W mark reads about 3.91:1 and the tick between 3 and 3.6 on the page background" |
| `L:cee3eb0e` (`today + wc-mark contrast clears WCAG AA large-text/UI floor (<n>:<n>), was <n>`) | `tests/integration/wildcard.test.js` › "on today's cell the W mark and the tick read at the skip glyph's contrast, about 4.10:1, above the 3:1 floor" |
| `L:ef258aff` (`no third selector folded in beyond .chk,.wc-mark (diff class stays one insertion)`) | `tests/integration/wildcard.test.js` › "the five glyph colour rules sit together in the stylesheet once each, in order: tick, W mark, mark base, the today rule, the W letter"; `tests/integration/wildcard.test.js` › "only five colour rules name the tick or the W mark: three for the glyphs and two from the today rule" |
| `L:f722272c` (`today wk-day-num itself (skip glyph host) resolves to --on-signal via :<n>, unchanged`) | `tests/integration/wildcard.test.js` › "the skip glyph on today's cell takes on-signal from the today date rule, and no tick or W rule reaches it" |

