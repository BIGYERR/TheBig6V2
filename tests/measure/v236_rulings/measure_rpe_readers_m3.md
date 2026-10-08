# V236 measure m3: D218/D219 Amendment 1, items 2 and 3 premises (standing ruling 7)

MODE     B (before-picture; confirms two code-read premises before builder slices them)
METHOD   tests/measure/v236_rpe_readers.js (output tests/measure/v236_rpe_readers.out.txt), run as
         `node tests/measure/v236_rpe_readers.js index.html <scratchpad>/base_v235.html`. Candidate ia-version 236 (slices 1-6,
         D219 items 2/3 not built) vs V235 as shipped. Lattice = m2's: 146/146 programs (16 goals x 2 focus x 2 exp x 2 seeds,
         HALF_MANNY, multi x2, 15 injury), grids identical cand vs base, 5,142 cardio days, 0 errors, 233.7 s.
         Oracle: the athlete's act (a number committed by Log) and the rendered surfaces (restMoveCandidates offer list,
         _renderRestMove row, renderProgressScreen journal text), not the predicate under test.

## Item 2: rest-move. Single-field gesture, Log tap, slider untouched, no note, no Done (V235: the settle write)
Denominator per row = gesture cases where the form carries the field (7,146 total). "offered" = restMoveCandidates(w) lists the day.

| shape | gesture | n | committed | CAND offered | V235 offered | V235 rpe "5" |
|---|---|---|---|---|---|---|
| time | mins 47:13 | 758 | 758 | **758** | 0 | 758 |
| xtrain time | mins 47:13 | 16 | 16 | **16** | 0 | 16 |
| generic | pace 9:30 | 627 | 627 | **627** | 0 | 627 |
| reps_dist | rep time 1:55 | 48 | 48 | **48** | 0 | 48 |
| reps_dist | reps +1 | 48 | 48 | 0 (V148 stamps run_dist) | 0 | 48 |
| time / xtrain time | miles 3.10 | 758 / 16 | all | 0 | 0 | all |
| dist | mins 47:13 | 555 | 555 | 0 (plan run_dist stamped) | 0 | 555 |
| dist | miles 3.10 | 555 | 483 (72 no-op: wheel already at 3.10, "Nothing to log yet.") | 0 | 0 | 483 |
| generic | miles 3.10 | 627 | 627 | 0 | 0 | 627 |
| bike / xtrain bike | 47:13 | 1397 / 73 | all | 0 | 0 | all |
| swim / xtrain swim | 1500 yd | 1604 / 64 | all | 0 | 0 | all |

Exposed total: 1,449 / 7,146 committed-by-Log cases on the candidate; 0 / 7,146 on V235. Every exposed case reads button
`Logged ✓`, data-logged "1". Stored keys of exposed entries: {run_mins} (time), {run_pace} (generic pace), {run_pace,run_rep_time} (reps_dist rep time).
reps_time shape: 0 days in this lattice (not measured).
Rendered (_renderRestMove(1,'wed','Wednesday')), HALF_MANNY W1 MON "Speed Run — Intervals", pace 9:30 logged:
`"Strength Support" / "Monday · not logged"`, card button "Logged ✓".
Premise CONFIRMED, wider than coach's expected list: the generic form's pace-only commit is also exposed (627/627).

## Item 3: journal swap
Fixture HALF_MANNY W1 SAT "Long Run", chip Bike, nothing else:
- CAND entry {rpe:"", all cardio "", swapFrom:"run", swapTo:"bike"}; Progress has no journal section; body reads
  "No data yet / Log sessions to see progress charts, exercise history, and your training journal here." (logs non-empty,
  html empty -> :17797 fallback).
- V235 entry rpe "5"; journal: "Session Journal Week 1 1 entry Sat RPE 5 — Hard Swapped Run → Bike".
- With a background W1 FRI rpe 7 entry: CAND "Week 1 1 entry Fri RPE 7 — Very Hard" (no Sat row); V235 "Week 1 2 entries Fri RPE 7 — Very Hard Sat RPE 5 — Hard Swapped Run → Bike".
Lattice: 10,284 swaps (every cardio day x each other-sport chip), x2 setups:
- swap only: CAND swap row 0/10,284, and the whole Progress body reads "No data yet" 10,284/10,284; V235 swap row + RPE 5 10,284/10,284.
- other same-week day rpe 7 present: CAND swap row 0/10,284; V235 swap row + RPE 5 10,284/10,284.
Premise CONFIRMED. Additional observable: when the swap is the only entry, the candidate shows the empty state for the whole screen.

## Other readers of an entry's rpe (comment-stripped, token `rpe`; candidate 40 lines, the rest are prescription text)
Entry readers: :1540 restMoveCandidates; :12163 renderWeekView hero `RPE '+(_heroCardio.rpe||'—')` (rest_cardio entries only,
written by applyRestCardio :1437 with _restDraft.rpe default 5, so not reached by the Log/Done path); :13867 slider seed;
:14798 persistLogFields carry; :16707 easyEffortWeekly; :17598-17599 chart; :17602 sessions counter (0 readers, m2);
:17724 journal skip; :17747/:17755 journal colour and RPE line (render '' as muted / no line). No generic emptiness
reader (Object.values/keys/entries over an entry, '["rpe"]') exists. No reader beyond m2's list plus the two premises.

UNKNOWN  reps_time shape (0 days in lattice); multi-field gestures (only single-field measured); Skip path; a moved slider
         then Log (rpe non-empty, not exposed by construction); swap then Log with a number (entry then live via cardio keys).
