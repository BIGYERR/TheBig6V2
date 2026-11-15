<!-- built old key: romanian_deadlift to barbell_romanian_deadlift -->
# The swipe deck's logging in the Expo app: what today's app writes

Written by `node tests/measure/native-deck-logging_writes.ts` (read-only). Zone America/New_York.

## A. What a launch writes: today's page against core's launch

- Launches read: **118** (114 of the ten standard histories, 4 built: an old key in the lift log, and three states of the active program's pointer). No active program with a grid on 11.
- Keys the page's launch changed: `ia_active` 3, `ia_edits_<id>` 10, `ia_exw_<id>` 1.
- Keys core's launch changed (`refreshStoredProgram`, a store that writes): `ia_edits_<id>` 10.
- Changed by both: `ia_edits_<id>` 10; left the same value by both on **10** of them.
- **Changed by the page alone:** `ia_active` 3, `ia_exw_<id>` 1.
- Why, for each: ia_active: the active program put right ("no-such-program" to "prog_1788008400000") (1); ia_active: the active program put right ("prog_1788094800000" to "prog_1788008400000") (1); ia_active: the active program put right ("prog_1788094800000" to null) (1); ia_exw_<id>: the fold of the lift log's old keys (1).
- Changed by core alone: none.
- **Which program the launch picks, where the two differ:** built: ia_active names no stored program: the page holds a program, the Expo app's launch picks none (ia_active moved by the page); built: ia_active names an archived program, another is live: the page holds a program, the Expo app's launch picks another (ia_active moved by the page); built: every program archived: the page holds none, the Expo app's launch picks one (ia_active removed by the page).
- **Written by the page's timers after the launch** (a second phone on the same keys, its timers run): on **54** of 118 launches: `ia_pop_idx_<id>` 40, `ia_remind_last_<id>` 54, `ia_reminded_<id>` 54. That is the day-after reminder (`maybeShowReminder`, 600 ms after the launch).

## B. What each handler writes (HALF_MANNY, one training day, the page's own functions)

`+` an entry added, `~` changed, `-` dropped. The fields are placed from today's card model as the template draws them.

| Step | On the page | Keys it changed |
|---|---|---|
| The deck opens (deck.ts open()) | `_setStaleWarnShown, _setStaleWarnSrc, _unitLabel, _setCurrentDayKey, ruResetIfIdle` | nothing |
| | *the lift: Barbell Romanian deadlift, 3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest (barbell_romanian_deadlift)* | |
| A set's plus | `stepSet(row, +step)` | `ia_hist_<id>` (new) [+w1_mon]; `ia_logs_<id>` (new) [+w1_mon] |
| A set's minus, again | `stepSet(row, -step)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| A rep typed, the field left | `setDelta(row); autoSaveSets(key)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| The load typed | `cascadeSetWeights(key)` | nothing |
| The load field left | `autoSaveSets(key)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| One set's load typed, the field left | `onSetWeight(key, 1); autoSaveSets(key)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| The reuse pill | `reuseWeight(key, 155)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| Fill every set | `fillAllSetWeights(key, 150)` | `ia_logs_<id>` [~w1_mon {~sets}] |
| The sets opened | `toggleSets(key)` | nothing |
| Log | `saveExWeight(key, name, rxDetail)` | `ia_exw_<id>` (new) [+barbell_romanian_deadlift]; `ia_logs_<id>` [~w1_mon {-sets}] |
| A set's plus, once logged | `stepSet(row, +step), so commitSetsLive` | `ia_exw_<id>` [~barbell_romanian_deadlift {~entries}] |
| Log again | `saveExWeight(key, name, rxDetail)` | nothing |
| | *another move: Barbell row, 2×6–10 @ RPE 7 (barbell_row)* | |
| Done, next one (a move not yet logged) | `saveExWeight(key, name, rxDetail, true)` | `ia_exw_<id>` [+barbell_row] |
| Skip a move | `skipExercise(name)` | `ia_edits_<id>` (new) [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] |
| Put it back | `unskipExercise(name)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] |
| Skip a round | `skipSuperset(secIdx)` | `ia_edits_<id>` [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] |
| Put the round back | `unskipSuperset(secIdx)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] |
| | *Call it (deck.ts markDay())* | |
| Mark the day done: the snapshot | `snapshotDay(week, day)` | nothing |
| Mark the day done: effort 8 and notes into the day's log | `getLogs; callItLog; saveLogs` | `ia_logs_<id>` [~w1_mon {+rpe +notes}] |
| Mark the day done: the status | `markDayComplete(week, day, title)` | `ia_comp_<id>` (new) [+w1_mon] |
| Mark the day done: the rest clock | `ruReset()` | nothing |
| The deck closes | `renderWeekView()` | nothing |
| The pop-up over This Week | `fireCompletionPopup(week, day)` | `ia_pop_dismiss_<id>` (new) [+date, +idx]; `ia_pop_idx_<id>` (new) [+workout] |
| The pop-up dismissed | `closePopup()` | nothing |

The day: week 1, mon, Posterior Chain. 5 cards with fields.

## C. Two moves on one day, one key the start of the other

`saveExWeight` reads a move's rep rows with `input[id^="exset_<key>_"]`, which also matches the rows of a move whose key starts `<key>_`.

- Training days read (the ten programs as generated): **551**. Days holding such a pair: **5**.
- The pairs: `pike_pushups / pike_pushups__feet_elevated_` 3, `split_squat / split_squat_heel_raise_hold` 2. By program: `run base, bodyweight, balanced` 5.
- Proved on the page: `split_squat` (3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest, 3 rows) beside `split_squat_heel_raise_hold` (2 rows): Log stores setsDone [0,0,0,30,30] (run base, bodyweight, balanced, week 4, mon); `pike_pushups` (3 sets — RPE 8 (stop 2 reps short of failure), 3 rows) beside `pike_pushups__feet_elevated_` (3 rows): Log stores setsDone [0,0,0,0,0,0] (run base, bodyweight, balanced, week 5, thu).
