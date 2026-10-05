# V232 P-RUNWHEEL — measure A (code side), returned 2026-10-05, tree ia-version 231

Script: tests/measure/v232_runwheel_code.js, output tests/measure/v232_runwheel_code.out.txt.
Oracle: hand table of stored values and their decimal meaning; expected wheel faces from decimal arithmetic.
Harness note: the VM has no `Event`; `_iawCommit` writes the hidden node then throws on `new Event`. Any gate that
drives a commit to a changed value must stub `Event`.

## F1 Emitters (cardioFieldHTML index.html:13706)
- `time` (13721-13726): 0 wheels. `log_run_mins` number, decimal, min 0, no step/max, placeholder `${dose.mins}`;
  `log_run_dist` number, decimal, step 0.01, min 0, placeholder "miles". In scope: dose.mins, dose.tgt (s/mi), sometimes dose.cap. No dose.mi.
- `dist` (13727-13732): 0 wheels. `log_run_dist` (placeholder `${dose.mi}`) then `log_run_mins` (placeholder "minutes").
  In scope: dose.mi, dose.tgt, sometimes dose.cap. No dose.mins.
- `reps_time` (13737-13741): 0 wheels. NO minutes input. `log_run_dist` number step 0.01 max-width 150px placeholder "miles";
  `log_run_reps` hidden stepper. In scope: dose.reps, dose.mins (per rep), dose.tgt.
- `reps_dist` (13733-13736): 1 wheel (`rept` -> hidden `log_run_rep_time`) + hidden `log_run_reps`. No minutes, no distance input.
- Restore: `value="${e.<field>||''}"` from the ia_logs_ entry.
- Generic run form (13746-13750; null dose and setCardioSwap 14702): `dist` and `pace` wheels. No minutes field. No planned value in scope.
- Rest-day cardio sheet (1402 minutes number min 1 max 600 default 30; 1404 distance step 0.1, reused as swim yards).
  Writes `rest_mins`; run_dist additive Number at 1431.

## F2 Readers/writers
Stored today: raw `.value` strings. run_mins decimal minutes as typed; run_dist as typed or "N.NN" from the dist wheel.
run_mins (7 sites): 13723/13730 restore; 14664 persist raw; 13460 doseDerived parseFloat; 13501/14676 callers;
13043 Benchmark parseFloat (fallback dose.mins, then 20); 14100 `_hasLog` truthy; 14108/14716 listener arrays.
No chart/Progress/PR/history/export reads run_mins.
run_dist: 14663 persist raw; 14679 V148 stamp `if(_dd.dist!=null && !logs[key].run_dist) logs[key].run_dist=String(_dd.dist)`;
1431 rest additive; readers 12200 parseFloat, 13042 parseFloat, 13460 parseFloat, 16240 +, 16492 +, 16562 +, 17416 +,
1530 truthy, 14100 truthy, 17423 truthy; restores 13724/13729/13739/13748.
Round-trip: "7.5" correct everywhere (7:30/mi on 1 mi). "7:30" -> parseFloat 7, + NaN: doseDerived 7:00/mi, silently
wrong by 30 s; Benchmark reads 7. "" -> falls back to planned (today's blank = as planned). "6.00"/"2.35" fine.
`_parseClock("7.5")` = 7.5 SECONDS; `_paceStrToSec("7.5")` = null.
PERSIST printed: on a `dist` dose (mi 3.1), 30 min typed, distance blank -> stored
`{"run_mins":"30","run_dist":"3.1","run_pace":"9:41/mi"}`. Blank distance is replaced by planned miles in storage on the
first input event; reopen seeds planned, not blank. On dose forms run_pace is always derived.

## F3 Stored values vs wheel seeding
`_iawParse` 13574-13591: dec3 `/^(\d+)(?:\.(\d)(\d)?)?/`, whole clamped 0..99, digits past hundredths truncated;
clock `/^(\d+):(\d{1,2})/`, both clamped. Seeding 13694-13698 finds `data-v===seed[ci]` else home; iaWheelInit never writes.
dist wheel, 18 stored values: 11 exact, 3 lossy, 2 dash, 2 clamp, 0 throw. "3.456" shows 3.45; ".86" lands on the DASH
(contradicts §12's "takes .86"; "0.86" is exact); "-1" dash; "100"/"150" clamp to 99; "1e1" shows 1; "3,5" shows 3;
"3","3.1","13.1","26.2" exact but a touch rewrites "3.00" etc. Any column's settle commits ALL columns.
Clock kinds on run_mins: 15 of 16 non-blank decimal strings land on the dash (regex needs a colon). Seconds grid: 15.333
-> nearest 15:20; 13 of 14 non-negative test values exact. "100","150","185" exceed a 2-digit minutes column.

## F4 Machinery
`_IAW_SPEC` 13541: dist dec3 0-99 nil | .0-9 | 0-9 (DOM 101/50/50); pace clock 4-17 nil | 0-59 pad 2 (DOM 15/300);
rept clock 0-9 nil | 0-59 (DOM 11/300). `_IAW_REPS=5` 13552; `_iawWraps` 13553; `_iawFormat` 13595 '' when left is dash,
clock "m:ss" no suffix, dec3 "W.TH"; `_iawCommit` 13651 dedupes, sets h.value, dispatches input; `iaWheelFlush` 13667;
`.iaw-f3/.iaw-f2` CSS 333-334 via `'iaw-f'+sp.cols.length` 13611. `fmt:'dec'` branch has no user.
Reusing clock for M:SS: columns/wrap/dash/format carry over; differs in range and commit string (clock commits "M:SS",
which every run_mins reader misreads) and clock parse rejects stored decimal minutes. H:MM:SS = 3 columns (V184 D2 cap).

## F5 Gates
V182/V184 wheel gates (G14, G16, U1, U11, S13, F3) were never in the repo (tests/ begins at V190 bootstrap 77e7765).
tests/gate.sh has 0 wheel refs. No assertion pins `type="number"` on log_run_mins/log_run_dist or V182 D1.
Touchers: g191_pacedelta.js:65-66 writes decimal minutes into `log_run_mins.value` directly (depends on parseFloat decimal
minutes); g221_d179_donenav.js:306-326 drives a hand-built `pace` wheel through iaWheelInit; sabotage v221_d179.json
targets iaWheelFlush.

## F6 Scope boundary
`log_bike_mins` 13752 number min 0, same plumbing (readers 1432, 1530, 14100, 14665, 17417; both listener arrays).
`log_swim_yards` 13754 number step 25 (readers 1433, 1530, 14100, 14665, 17418). Rest sheet separate (`_restDraft`).

## Every reader that must agree
doseDerived 13460; updateDoseDerived 13501; persistLogFields 14664, 14676-14679 (V148 stamp); Benchmark 13042-13043;
`_hasLog` 14100; 1530; 12200; 16240, 16492, 16562, 17416/17423; rest additive 1431; listener arrays 14108/14716;
iaWheelInit 14112/14720; iaWheelFlush in handleDayStatus; gates g191 and g221.

## Unknown
iOS type=number behaviour for comma/1e1/leading dot; Mario's real stored distribution; dose bounds (measure B);
device DOM weight; handleDayStatus/journal/history beyond greps; copyExport's `#exportText` filler.
