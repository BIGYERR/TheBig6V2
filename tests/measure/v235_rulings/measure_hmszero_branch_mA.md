# V235 measure mA: the branch question (P-HMSZERO)

Tree: index.html ia-version 234, HEAD 89cf420. Script `tests/measure/v235_hmszero_branch.js`, output `tests/measure/v235_hmszero_branch.out.txt` (70.6 s, 12,610 drives, 0 errors). Saved verbatim from measure's return by the main session, 2026-10-07.

**ANSWER: YES. A ride or run is lost.** Branch: V235 is P-HMSZERO alone (Mario, §12 NEXT BUILD V235).

3 hms wheel shapes (bike minutes, run dose-dist minutes, run dose-time minutes) across their open-face states:
- Every wheel that opens on the dash loses the session: **1,755 of 1,755** device drives where only minutes and seconds were rolled.
- A wheel that opens on the plan face and has its hours rolled to the dash also loses it: **742 of 742**.
- A wheel that opens on the plan face with hours left at 0 loses nothing: **0 of 742**.
- Control, hours set to 0 first and then minutes and seconds: **0 of 2,497** lost.
All after the Done tap, over 89 programs and 3,172 run or bike days opened.

REPRO: HALF_MANNY (seed 76308), W1 sat "Long Run" (dose k=dist). The run_mins wheel opens on —:00:00. Roll minutes to 47 and seconds to 13, leave hours on the dash, tap Done. ia_logs_ w1_sat has run_mins "", run_dist "", run_pace "", status "complete". Hand value 47.22. Bike repro: bike_century, balanced, beginner, 76308, W1 mon "Long Slow Distance (LSD)", same roll, bike_mins "" after Done.

METHOD: lattice HALF_MANNY plus 11 goals (5 bike, 6 run including run_pace_goal) x focus balanced/strength x experience beginner/advanced x seeds 76308/24865, equipment commercial, rest sun+wed: 89 programs. Every run or bike day opened with an empty store. Device path: openDayKey, buildLogHTML, cardioFieldHTML, listener arrays, iaWheelInit; each column's scrollTop setter dispatches scroll; a virtual clock runs the 90 ms settle, then `_iawCommit`, hidden input, `input`, persistLogFields; a second drive ends with `handleDayStatus(d,'x','complete')`. DOM stub and clock copied from g233 mkEnv. Does not model iOS momentum or layout. Oracle: hand arithmetic of the face (dash read as 0; hms h*60+m+s/60; dist w + t/10 + h/100); never calls `_iawFormat` or `_iawParse`.

FINDING (tail roll = only columns after the first moved; lost / drives after Done; every lost drive fired 0 input events):
- bike/time/hms (dash): 908/908
- bike/reps_time/hms (dash): 204/204
- bike/null-dose/hms (dash): 132/132
- run dose=dist, run_mins hms (dash): 511/511. Same entries also lose run_dist (511/511) and run_pace (511/511), because `doseDerived` derives planned miles and pace only when mins > 0 (:13477ff, used at :14739). The whole run drops out of the mileage chart.
- run dose=time, run_mins hms (plan face, hours "0"), tail: 0/742
- same wheel with hours rolled to the dash first: 742/742 lost
- rolled away from the plan face and back onto it: 0/742 lost (stores the plan, e.g. 25.00)
By goal 100% in every goal (HALF_MANNY 15/15, bike_century 528/528, bike_50 276/276, bike_base 152/152, bike_ftp 152/152, bike_cals 136/136, run_5k 48/48, run_10k 72/72, run_half 120/120, run_marathon 160/160, run_pace_goal 96/96) and every week W1..W20. It is the face alone.

Credit effects of a lost drive:
- Before Done: no ia_logs_ key, no freeze snapshot (ia_hist_ untouched), no _hasLog nudge on reopen, no progress point.
- After Done: status "complete", but bike_mins or run_mins "". Weekly bike sum (:17499) and run mileage (:17498) get nothing.
- Control (hours 0): stores 47.22, nudge shows, Weekly Cycling Time = 47.22.

ITEM 1, kinds with a dash in column 0 (`_IAW_SPEC` :13560-13567), all `nil:true` on column 0:
- dist 0..99: opens on dash at :13780 (dose-time run), :13795 (reps_time), :13804 (generic run); plan face at :13784 (`dose.mi`).
- pace 4..17: opens on dash at :13805.
- rept 0..9: opens on dash at :13790.
- hms 0..9: plan face at :13778 (run dose time, `dose.mins`); dash at :13786 (run dose dist) and :13812 (every bike).

ITEM 2, `_iawFormat('hms', ...)` (what the hidden input receives):
| Hours | Faces | Result |
|---|---|---|
| dash | :45:00, :30:15, :00:30, :59:59, :01:00, :00:00 | "" every time (hand 45.00 / 30.25 / 0.50 / 59.98 / 1.00 / 0.00) |
| 0 | same | "45.00", "30.25", "0.50", "59.98", "1.00", "0.00" (match hand) |
| 1 | same | "105.00", "90.25", "60.50", "119.98", "61.00", "60.00" (match hand) |
Parse back: "45.00" -> [0,45,0]; "" -> [dash,dash,dash]; "0" -> [0,0,0]; "60" -> [1,0,0].
Same blank on other kinds: dist [dash,8,6] -> "" (hand 0.86); dist [dash,1,0] -> "" (hand 0.10); rept [dash,55] -> "" (hand 0:55); pace [dash,30] -> "" (no 0-minute row, no hand value).

ITEM 3: plan face hours reads "0", so a tail roll saves (0/742); hours rolled to dash then the rest loses it (742/742). Plan-face dist the same: tail 0/511 lost; whole miles rolled to dash first, 511/511 lost.

ROOT: the value is the hidden-input string written by `_iawCommit`.
- `_iawFormat` :13632; line :13634 `if(vals[0]==='') return '';` runs before the hms branch at :13638, so a dash in column 0 blanks the whole value.
- `_iawCommit` :13693-13708 compounds it on a dash-opened wheel: `w._iawSeedFace` (:13752) is `_iawFormat` of the seeded face, i.e. "". `next === _iawSeedFace` at :13704 returns before `_iawMoved` is set, and `h.value === next` (:13706). No `input` fires, persistLogFields never runs, snapshotDay never reached.
- At Done, `iaWheelFlush` (:13714) commits nothing; persistLogFields (:14704) reads `g('log_bike_mins')` / `g('log_run_mins')` = "" (:14726-14727).
- Not driven: a wheel opened on a STORED value and rolled to dash hours. By code it writes "" over the stored minutes (h.value "45.00" !== "", input fires).

SPREAD (comment-stripped grep): persistLogFields :14726/:14727 (writes); doseDerived :13520 (live readout) and :14739 (persist), dose-dist also drops derived run_dist and run_pace; `_hasLog` :14160; progress weekly bike :17499 (session counter :17505 counts bike_mins not run_mins; session still counts via stored rpe "5" after Done); benchmark mins :13049 (falls back to dose.mins or 20; not driven); CARDIO_PARK_FIELDS :13422 (not driven); restMoveCandidates :1536 checks bike_mins not run_mins (not driven); rest-sheet bike_mins sum :1438 (number box). `_iawFormat` has 3 hits (:13632 def, :13699 commit, :13752 seed face); the dash guard is shared by all four kinds. Other kinds measured: dist on the dash 627/627 (generic run) and 742/742 (dose-time run) lost with tail-only tenths and hundredths; rept 48/48 lost; pace 627/627 write nothing (no intent defined). Realism: a tenths-only roll implies a sub-mile run, a rept roll a sub-minute rep; a minutes-only hms roll is the normal action for any session under 60 min.

What a fix would have to move: the 1,755 + 742 lost hms drives (and, if the ruling covers the shared guard, the 1,417 dist and 48 rept), plus the 0/2,497 control, which must stay 0.

UNKNOWN: stored-value wheel rolled to dash hours (code-read only, would erase a log); rest-day sheet not measured; swapped-in forms (setCardioSwap) not driven separately; iOS momentum/overscroll not modelled; benchmark-mins :13049, CARDIO_PARK_FIELDS :13422, restMoveCandidates :1536 not driven; multi-sport and injury overlays not in lattice; equipment fixed at commercial.
