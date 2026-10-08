# V237 measure mA: P-DISTZERO at the reporter's case (Mode A)

Tree: index.html ia-version 236, HEAD 8d8c5a6. Script `tests/measure/v237_distzero.js`, output `tests/measure/v237_distzero.out.txt` (94.5 s, 27,786 drives, 0 errors). Read-only; no ruling, no fix.

## Reproduction (HALF_MANNY, seed 76308)
REPRODUCED, at the Miles wheel (`dist`, `log_run_dist`). The time wheel (`hms`) cannot do it after D215: column 0 rows are 0..9, no dash row; moving it to the dash is impossible (no row).

W1 sat "Long Run", dose=dist, plan 3.1 mi. Miles open on the plan face 3.10; whole miles rolled up to the dash, tenths 7, hundredths 5 (face `—.75`). Hidden `log_run_dist` = "" (hand 0.75).
- A1 DRAFT, time untouched, Log: toast `Nothing to log yet.`, label `Log`, no `ia_logs_` key.
- A2/A3 DRAFT, time 0:47:13 (either order), Log: toast `Run logged ✓`, label `Logged ✓`, stored `run_dist "3.1"` (the V148 plan stamp over his 0.75), `run_pace "15:14/mi"` (from plan miles), `run_mins "47.22"`, other four keys "", rpe "".
- A4 control, miles 0.75 with column 0 on 0: `run_dist "0.75"`, `run_pace "62:58/mi"`.
- A5 Done, time untouched: status complete, all seven keys "". A6 Done / A7 Skip with time: same as A2 (`run_dist "3.1"`).
- A8 LIVE (time 0:47:13 and miles 4.20 logged), miles then rolled to `—.75`: the autosave stores `run_dist "3.1"`, the plan, overwriting the logged 4.20.
- A9 LIVE (miles 4.20 only), rolled to `—.75`: all seven keys "", card back to DRAFT, label `Log`; Log then says `Nothing to log yet.`
- dose=time host W1 fri "Recovery Run" (plan 25 min): B1 time left on the plan face 0:25:00, miles `—.75`, Log: `Nothing to log yet.`, nothing stored (the plan-face time is not registered either). B2 time rolled 47:13: `run_mins "47.22"`, `run_dist ""`. B3 control 0.75: `run_dist "0.75"`.

## Sweep
Lattice: HALF_MANNY + 6 run goals (run_5k, 10k, half, marathon NRC; run_base, run_pace_goal NSW) x focus balanced/strength x experience beginner/advanced x seeds 76308/24865 + multi-sport run_half+bike+swim x 2 seeds + injury knee/ankle/lowback run_10k+bike: 54 programs, 1,956 run days (time 744, dist 537, generic 627, reps_dist 48, reps_time 0). Every wheel with a column-0 dash on each day: dist 1,908 faces, rept 48, pace 627. Gesture: column 0 to the dash, tail rolled (dist .75, rept :45, pace :30). Oracle: hand face (dash read as 0), plan miles from the dose.

Column-0-dash face with a nonzero tail, value lost (stored "" or no entry, or the plan stamp):
| wheel | DRAFT Log | DRAFT Done | DRAFT Skip | LIVE autosave | LIVE then Log |
|---|---|---|---|---|---|
| dist alone | 1,908/1,908 (no entry, `Nothing to log yet.`) | 1,908/1,908 "" | 1,908/1,908 "" | 1,908/1,908 "" (prior 4.20 erased) | 1,908/1,908 "" |
| dist + companion | 1,371 "" + 537 plan stamp = 1,908/1,908 (`Run logged ✓`) | same split | same split | same split | same split |
| rept alone | 48/48 (no entry) | 48/48 | 48/48 | 48/48 (prior 1:55 erased) | 48/48 |
| rept + reps stepper | 48/48 "" (`Run logged ✓`) | 48/48 | 48/48 | 48/48 | 48/48 |
| pace (no hand value: no 0 row) | stores "" 627/627 | 627 | 627 | 627 | 627 |
Companion: dose=time/dist the time wheel 0:47:13; generic the pace 9:30; reps the stepper +1. The 537 plan-stamp cases are exactly the dose=dist days with time rolled (stamp at :14823). Flat by goal, NRC/NSW, focus, experience, week: 100% lost in every segment (§2b). Zero-face control (column 0 on 0, tail 0): dist stores "0.00" 1,908/1,908, rept "0:00" 48/48, both with `Run logged ✓` and the card LIVE.

## Root
`_iawFormat` :13655, line :13657 `if(vals[0]==='') return '';` blanks a dist/rept/pace face whose column 0 is the dash, ahead of the dec3/clock arithmetic. `_iawCommit` :13721 writes that "" to the hidden node. On a DRAFT, `logCardio` :14835 tests every park field `=== ''` (:14841): alone it refuses; with a companion it commits. `persistLogFields` :14777 writes `run_dist:gc('log_run_dist')` :14804 = "", then the V148 stamp :14820-14823 (`doseDerived` :13490, dose=dist with mins>0 returns `dist: dose.mi`) fills the empty `run_dist` with plan miles. On LIVE, the input listener (:14205, :14898) saves "" over the stored value.

## Fact base (D215 analogue)
- `_iawParse('dist','')` = ["","",""]; `_iawParse('rept','')` = ["",""]; pace ["",""]. `_iawParse('dist','0.00')` = ["0","0","0"]; `'0'` the same; `'.75'` = ["0","7","5"]; `_iawParse('rept','0:00')` = ["0","0"].
- `_iawFormat('dist',['0','0','0'])` = "0.00"; `_iawFormat('rept',['0','0'])` = "0:00" (reachable today). Dash faces ["",7,5], ["",0,0], ["",45], ["",30] all "".
- Wrap: dist col0 no, col1/col2 yes; rept col0 no, col1 yes; pace col0 no, col1 yes; hms col0 no (`wrap:false`), col1/col2 yes.
- A stored "0.00" / "0:00": `cardioEntryLive` true (card LIVE, label `Logged ✓`), truthy readers (`_hasLog`, session counter, restMoveCandidates) true, `parseFloat>0` readers false, `logCardio` empty test passes it.

## Two-gesture clear, reopened LIVE dose=dist (HALF_MANNY W1 sat; time 0:47:13, Log, Done; reopen shows miles 3.10, time 0:47:13)
- A time to zero: `run_dist "3.1"` (stamp kept), others ""; LIVE. Then miles to dash: all seven ""; DRAFT, label `Log`.
- B miles to dash: no change (`run_dist "3.1"`, pace, mins kept; the stamp re-lands). Then time to zero: all seven "".
- C time to zero, then miles to 0.00 (today's zero row): `run_dist "0.00"`, card stays LIVE `Logged ✓`.
- D time to zero only: `run_dist "3.1"` survives.
- Every reopen after A/B/C/D: status `complete`, no nudge; after A and B the miles wheel shows the plan face 3.10 again (D202 seed).

## Readers (comment-stripped, every hit)
- `log_run_dist` 9: 13533 updateDoseDerived, 13810/13814/13825/13834 cardioFieldHTML, 14205 openDetail listeners, 14804 + 14820 persistLogFields, 14898 setCardioSwap listeners.
- `log_run_rep_time` 6: 13533, 13820, 14205, 14805, 14820, 14898. `log_run_pace` 4: 13835, 14205, 14804, 14898.
- `run_dist` 32 hits on 20 lines: 1441 applyRestCardio, 12213 renderWeekView, 13055 _benchmarkEntryFor, 13435 CARDIO_PARK_FIELDS, 13533, 13810/13814/13825/13834, 14194 _hasLog, 14205, 14804, 14820, 14823 stamp, 14898, 16422 seedFromPriorPrograms, 16674 ladderWeekly, 16744 plannedVsLogged, 17598 + 17605 renderProgressScreen.
- `run_rep_time` 10 hits on 8 lines: 13435, 13533, 13820, 14194, 14205, 14805, 14820, 14898.
- Through CARDIO_PARK_FIELDS (key-generic): 1543 restMoveCandidates, 13440 swap note, 14754 cardioEntryLive, 14841 logCardio, 14871/14874 setCardioSwap park.
- `_iawFormat(` 3: 13655 def, 13727 commit, 13780 seed face.

## Against the handoff
- "on a LIVE card it still stores ''": true alone (1,908/1,908, erasing the logged value). On a LIVE dose=dist card with time stored it stores the PLAN miles (537/537), not "".
- "on a DRAFT card a dash gesture surfaces as `Nothing to log yet.`": only when the dash wheel is the card's only value. With a companion the Log succeeds, `Run logged ✓`, and the dash value is "" (1,371) or the plan stamp (537): silent.
- Mario's "a time": the hms wheel can no longer do it. On dose=dist his time registers and his miles become the plan. On dose=time with the time left on the plan face, `—.75` gives `Nothing to log yet.`, so the displayed time is not registered either (B1; the D202 plan face).
- V234's 1,417 dist / 48 rept is a different lattice; here 1,908 dist / 48 rept.

## Unknown
reps_time miles wheel (0 days in this lattice); bike/swim chip-swapped run forms; the rest-day sheet; iOS momentum; pre-V148 entries; Progress/journal renders not driven (readers listed only).
