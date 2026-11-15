# The swap sheet on the deck: what today's app reads and writes

Read-only. Zone America/New_York. Today's page in the VM harness, the test phone of `tests/support/stored-state.ts`.

## A. The cards that offer a swap, and what the sheet shows

Every day of the live grid, at each of the five stretches of the ten standard histories (a second phone launched on the keys as they stand).

- Launches read: **50**. The live program carries `_swapUniverse`: `a list` 50.
- Days with a deck: **2723**. Cards: 12305. Moves on them: 15261.
- **Moves that offer a swap: 12131** of 15261. By the kind of card they sit on: `block` 1222, `cool` 95, `lift` 4461, `round` 6353.
- Where the control sits: on the card's own top (a single lift) **4461**; on a move's row inside a round or a block **7670**.
- By program: `1.5 mile test goal, commercial, balanced` 1496, `1.5 mile test goal, minimal, fat loss, beginner` 1302, `10k race, home basic, hypertrophy, advanced` 631, `5k race, commercial, strength, beginner` 1039, `bike ftp, home full, strength support, advanced` 1120, `half-manny (Mario, NRC half, crossfit)` 1408, `marathon, crossfit, athletic support, 36-45` 1591, `run base and bike base, crossfit, balanced` 1135, `run base, bodyweight, balanced` 872, `swim 500, commercial, prevention support` 1537.
- The list is the pattern's (`swapCandidates`) on **9279**, the aux family's (`auxSwapCandidates`) on **2852**. The universe read: `base` 9404, `by overlay key` 2727.
- Rows in "Same job", by how many: `0` 214, `1` 811, `2` 1563, `3` 1507, `4` 903, `5` 1248, `6` 925, `7` 860, `8` 2734, `11` 2, `12` 95, `13` 185, `20` 140, `21` 10, `22` 94, `23` 29, `25` 88, `26` 233, `27` 384, `28` 106.
- Rows in "Different job, same day", by how many: `0` 2985, `1` 110, `2` 27, `3` 923, `4` 448, `5` 7638.
- Candidate rows in all: 125573. Rows carrying the "Much lighter than" note: 5819.
- **Sheets with no row at all** ("Nothing else in your kit does this job."): **46**: `family carry` 3, `family cond` 43.
- Sheets with the one implement note: 783. The slot tag: `Heavy compound` 1343, `Main lift` 1886, `none` 8902. "Whatever you pick keeps": on 12131, absent on 0.
- Swappable moves already logged today: 322. Swappable moves skipped: 0.
- Moves showing "Swapped in for": **36** (28 on a single lift's card, with Put it back). Moves showing "You added this": **40** (`1.5 mile test goal, commercial, balanced` 4, `1.5 mile test goal, minimal, fat loss, beginner` 4, `10k race, home basic, hypertrophy, advanced` 4, `5k race, commercial, strength, beginner` 4, `bike ftp, home full, strength support, advanced` 4, `half-manny (Mario, NRC half, crossfit)` 4, `marathon, crossfit, athletic support, 36-45` 4, `run base and bike base, crossfit, balanced` 4, `run base, bodyweight, balanced` 4, `swim 500, commercial, prevention support` 4).
- An added move sits on a card of kind: `lift, swap on its top` 40. A swapped in move: `lift` 28, `round` 8. Today's deck hides the chip of a single lift's card (`.deck-lift .ex-swapchip{display:none}`, deck.css), and draws the swapped in strip in its place; it draws nothing in place of "You added this, remove".

## B. What each handler writes (HALF_MANNY, the page's own functions)

`+` an entry added, `~` changed, `-` dropped.

| Step | On the page | Keys it changed | What the card shows after |
|---|---|---|---|
| | *a day not yet touched (tue): Close-grip bench press* | | |
| The sheet opens | `openSwapSheet(sec, item)` | nothing | the sheet: 8 same job, 5 different job |
| A pick | `applySwapChoice(to)` | `ia_swapct_<id>` (new) [+Close-grip bench press]; `ia_swaps_<id>` (new) [+w1_tue] | card `s0i0`, **Barbell bench press** (`barbell_bench_press`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; Swapped in for Close-grip bench press; rep fields 12 12 12; drafts held for `none` |
| Put it back | `undoSwap(from)` | `ia_swaps_<id>` [-w1_tue] | card `s0i0`, **Close-grip bench press** (`close_grip_bench_press`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; rep fields 12 12 12; drafts held for `none` |
| | *the day in hand (mon): Barbell Romanian deadlift, 3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest* | | |
| A set's plus (a draft) | `stepSet(row, +step)` | `ia_hist_<id>` (new) [+w1_mon]; `ia_logs_<id>` (new) [+w1_mon] | card `s0i0`, **Barbell Romanian deadlift** (`barbell_romanian_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; rep fields 13 12 12; drafts held for `barbell_romanian_deadlift` |
| The sheet opens | `openSwapSheet(sec, item)` | nothing | the sheet |
| The sheet closed, no pick | `closeSwapSheet()` | nothing | card `s0i0`, **Barbell Romanian deadlift** (`barbell_romanian_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; rep fields 13 12 12; drafts held for `barbell_romanian_deadlift` |
| The sheet opens, a pick | `openSwapSheet; applySwapChoice(to)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swapct_<id>` [+Barbell Romanian deadlift]; `ia_swaps_<id>` [+w1_mon] | card `s0i0`, **Deadlift** (`deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; Swapped in for Barbell Romanian deadlift; rep fields 12 12 12; drafts held for `barbell_romanian_deadlift` |
| A second pick on the same card | `openSwapSheet; applySwapChoice(to2)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swapct_<id>` [+Deadlift]; `ia_swaps_<id>` [~w1_mon] | card `s0i0`, **Sumo deadlift** (`sumo_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; Swapped in for Deadlift; rep fields 12 12 12; drafts held for `barbell_romanian_deadlift`; the day's records ["Barbell Romanian deadlift to Deadlift","Deadlift to Sumo deadlift"] |
| Put it back (the lift it shows) | `undoSwap(from)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swaps_<id>` [~w1_mon] | card `s0i0`, **Deadlift** (`deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; Swapped in for Barbell Romanian deadlift; rep fields 12 12 12; drafts held for `barbell_romanian_deadlift`; the day's records ["Barbell Romanian deadlift to Deadlift"] |
| Put it back, again | `undoSwap(from)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swaps_<id>` [-w1_mon] | card `s0i0`, **Barbell Romanian deadlift** (`barbell_romanian_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; rep fields 13 12 12; drafts held for `barbell_romanian_deadlift` |
| Log on it | `saveExWeight(key, name, rx)` | `ia_exw_<id>` (new) [+barbell_romanian_deadlift]; `ia_logs_<id>` [~w1_mon {-sets}] | card `s0i0`, **Barbell Romanian deadlift** (`barbell_romanian_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged yes; rep fields 13 12 12; drafts held for `none` |
| A pick, once logged | `openSwapSheet; applySwapChoice(to)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swapct_<id>` [~Barbell Romanian deadlift {~n}]; `ia_swaps_<id>` [+w1_mon] | card `s0i0`, **Deadlift** (`deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged no; Swapped in for Barbell Romanian deadlift; rep fields 12 12 12; drafts held for `none`; the lift log holds today's entry for `barbell_romanian_deadlift` |
| Put it back | `undoSwap(from)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swaps_<id>` [-w1_mon] | card `s0i0`, **Barbell Romanian deadlift** (`barbell_romanian_deadlift`), 3×12 — RPE 6.5 (leave ~4 rep…; logged yes; rep fields 13 12 12; drafts held for `none` |
| | *the count of Barbell Romanian deadlift to Deadlift stands at {"to":"Deadlift","n":2,"offered":false}* | | |
| A third pick of the same pair | `applySwapChoice(to)` | `ia_hist_<id>` [~w1_mon {~sections}]; `ia_swapct_<id>` [~Barbell Romanian deadlift {~n}]; `ia_swaps_<id>` [+w1_mon] | count {"to":"Deadlift","n":3,"offered":false}; the nudge in hand: {"from":"Barbell Romanian deadlift","to":"Deadlift"} |
| The nudge: Leave the plan alone | `dismissSwapNudge()` | `ia_swapct_<id>` [~Barbell Romanian deadlift {~offered}] | count {"to":"Deadlift","n":3,"offered":true} |
| The nudge: Make the change (on a copy of the keys) | `acceptSwapNudge()` | `ia_programs` [the list, 1 to 1 entries; 82803 to 82858 bytes]; `ia_swapct_<id>` [~Barbell Romanian deadlift {~offered}] | `cfg.exSwapPrefs` {"Barbell Romanian deadlift":"Deadlift"}; the program rebuilt, 5 days of the grid changed |
| | *an added move (Back squat), from the session sheet's add sheet* | | |
| Add | `applyAddChoice(name)` | `ia_edits_<id>` (new) [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | card `s3i0` (lift, kicker Added by you), swap on its top: yes |
| Remove | `removeAddedExercise(name)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | cards with an added move: 0 |

