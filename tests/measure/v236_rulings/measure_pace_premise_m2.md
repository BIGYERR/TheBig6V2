# V236 measure m2 — the D218-log row's run_pace premise (Mode B, standing ruling 7)

Artifacts: candidate `index.html` ia-version 236 (slices 1–4, uncommitted) vs V235 as shipped (scratch `base_v235.html`).
Script: `tests/measure/v236_pace_premise.js`; output `tests/measure/v236_pace_premise.out.txt`. Self-diff of two full runs: identical but the clock lines.
Lattice: m1's 146 programs (16 goals x 2 focus x 2 exp x 2 seeds, 2 multi, 15 injury protect, HALF_MANNY), 146/146 built, grids identical cand vs V235,
2,004 run days, 5,916 commits per tree, 0 errors. Gestures: minutes 0:47:13, miles 3.10, pace 9:30, rep time 1:55. Commit = candidate Log tap
(`logCardio()`; entry checked null before it), V235 the wheel settle; then Done on both.
Oracle: hand pace = minutes x 60 / miles; miles = logged, else the session's plan miles; minutes = logged, else the plan minutes; no plan miles and no
logged miles = no pace derivable.

## 1. run_pace by shape x case (non-empty / n; identical at Log vs settle and after Done)
| shape | days | (a) mins only | (b) miles only | (c) both | other |
|---|---|---|---|---|---|
| time (dose k:'time', plan mins, no plan miles) | 758 | 0/758 (hand: none) | 758/758 via plan mins | 758/758 | — |
| xtrain time (injury cross-train run) | 16 | 0/16 | 16/16 | 16/16 | — |
| dist (k:'dist', plan miles) | 555 | 555/555 = 47.22x60/plan mi | 0/555 (no mins wheel moved, nothing to derive) | 555/555 | — |
| generic (no dose: dist + pace wheels, no mins field) | 627 | n/a | 0/627 | n/a | pace only 627/627, miles+pace 627/627 |
| reps_dist (rept wheel only) | 48 | n/a | n/a | n/a | rep time only 48/48 |
| reps_time | 0 | not in lattice | | | |
Stored == hand (±1 s) on every non-empty cell. Delta run_pace candidate vs V235: 0 / 5,916 commits at the commit and 0 / 5,916 after Done;
whole entry (ts, rpe stripped) candidate@Log vs V235@settle: 0 deltas. Draft leaks before Log: 0. Writer: `persistLogFields` cand :14774
(V148 stamp :14819-14825, gated on `_live`), V235 :14719 (stamp :14752-14757); derivation `doseDerived` :13487 (time form needs dist>0 :13493).

## 2. Ruling rows vs HALF_MANNY W1 shapes
W1 MON generic (Speed Run Intervals; dist+pace wheels, no stepper), TUE lift (no #cardioLogBtn, log_rpe present), WED rest, THU generic,
FRI time {mins 25, tgt 800} (hms plan 25 + free dist), SAT dist {mi 3.1} (dist plan 3.1 + free hms), SUN rest. HALF_MANNY 14 wk: generic 27, time 14, dist 15, reps 0.
- `D218-log` (FRI): claim "run_pace derived (47.22x60/plan miles)" names a figure the time shape lacks; stored is `""` on both trees (758/758 shape-wide).
  Its other conjuncts hold on FRI: run_mins "47.22", run_dist "".
- `D218-reps` (MON): fixture is generic, no stepper; already restated in Session notes (forced dose).
- `D218-chip` control (SAT): `parked.run.run_mins "47.22"` holds; note SAT is dist shape, so the stored entry also carries run_dist "3.1" and run_pace "15:14/mi" from the V148 stamp.
- `D218-draft`, `-live`, `-empty`, `-reopen`, `-done`, `-rpe-notes` on FRI: name only run_mins / hidden / toast / rpe, which the time shape has. `-lift` TUE matches.
- `D218-bike`, `-swim`, `D219-*`: no HALF_MANNY day (cardioTypes ["run"]); their hosts are not named in the ruling.

## 3. D219-counter
`weeklyData[w].sessions`: 1 write (cand :17603, V235 :17521), 0 reads in either tree (comment-stripped; the other `.sessions` hits :17380-17547 are the exercise-ladder rows, a different object). No screen renders it.
Other readers of the rpe value D219 moves: Average Session RPE chart (:17598-17599, :17705); restMoveCandidates :1540 (rpe blocks a day from rest moves);
journal :17724 (entry with no notes and no rpe is skipped), :17747/:17755 (RPE line and colour); slider seed on reopen :13867. easyEffortWeekly :16707 reads rpe only in 3–4, so a default 5 never counted there.
