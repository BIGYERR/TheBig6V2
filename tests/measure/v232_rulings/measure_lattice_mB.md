# V232 P-RUNWHEEL — measure B (lattice), returned 2026-10-05, tree ia-version 231, clock 2026-10-03

Script: tests/measure/v232_runwheel_lattice.js (parts 1, 1b, 2 incl. 3 and 4, 3b); outputs v232_runwheel_lattice.out.txt,
v232_runwheel_lattice_1b.out.txt, v232_runwheel_lattice_3b.out.txt.

## Reporter's case
No fixture reproduces it. HALF_MANNY W2 THU = Posterior Chain, generic Intervals form. PRT TING (v202_persistence_C config,
mile 8:15, 1.5 mi in 10:30, support_prevention, seed 24865) W2 THU = `Run — LI · Planned 15 min @ 9:07/mi`.
Wide search, 22,680 run_pace_goal configs at seed 24865: the exact strip `Run — LI · Planned 15 min @ 8:51/mi` on W2 THU
in 504 builds, 432 titled Pull (72 Posterior Chain). Pace set by mile best + target only (mile 8:00 with 1.5 mi in
10:30/12:00/11:00, or mile 8:15 with 1 mi in 7:30); Pull from a non-support focus. Dose `{"k":"time","mins":15,"tgt":531,"key":"chi"}`.
Caveat: Mario's live config unknown; this is the reproducing family.
Form today (13722-13726): `log_run_mins` type=number inputmode=decimal placeholder="15" min=0, sub-label
"actual minutes · blank = as planned"; `log_run_dist` type=number decimal step 0.01 placeholder "miles", sub-label
"distance — off the watch". No seconds field.

## Lattice
16 goals (run_5k/10k/half/marathon, run_pace_goal 1.5 mi in 10:30, run_base, bike x5, swim x5) x 7 focuses x 3 experience
x 5 equipment x 2 rest (sun,wed / sat,sun) x 3 seeds (76308, 24865, 1234) = 10,080 configs, 0 crashes. Mile best 8:30,
race 2026-12-20. 871,710 day entries, 249,060 rest, 622,650 log forms (192,810 no cardio field).
V191 script not in repo; not directly comparable. Per goal here/V191: half 38.57/36.42, 5K+10K 37.50/35.59,
marathon 20.00/18.85, pace-goal 20.00/10.23, base 0/0.

## Encounter (denominator 622,650 log forms)
(a) wheel today 54,180 = 8.70% (dist 47,250, pace 47,250, rept 6,930).
(b)=(c)=(d) run minutes box = run distance box = either: 107,460 = 17.26% (every dosed time/dist form has both).
(e) all boxes wheeled: 161,640 = 25.96%; = 161,640/161,640 run log forms (100%) from 54,180 (33.52%).
Run goals only: 26.46% -> 78.94%.
Scope line: bike minutes box 128,880 = 20.70% (time 91,620, reps_time 24,660, null 12,600); swim yards 139,320 = 22.38%.

| sport:dose.k | forms | wheel today | run boxes |
|---|---|---|---|
| run:time | 62,100 | 0% | 100% |
| run:dist | 45,360 | 0% | 100% |
| run:null generic | 47,250 | 100% | 0% |
| run:reps_dist | 6,930 | 100% rept | 0% |
| run:reps_time | 0 | n/a | n/a |

By goal (wheel today / either box / hypothetical): 5K 37.50/42.50/80; 10K same; half 38.57/41.43/80; marathon 20/60/80;
pace-goal 20/60/80; base 0/68.57/68.57; bike, swim 0/0/0. Flat across equipment and rest; flat across focus (box 17.00%
non-support, 17.61% support).
By subtype, 100% boxes: Recovery Run time 37,800; Long Run dist 15,120; LSD dist 13,860; LI time 6,930; Easy Run time
6,210; Recovery dist 5,670; Long Run Taper dist 3,780; Long Run time 3,150; Easy+Strides 2,790; Peak dist 2,520; RACE DAY
dist 2,520; Easy Long 1,620; Cutback dist 1,260 + time 1,260; Steady 1,080; Benchmark 630; Retest 630; Dress Rehearsal 630.

## Bounds (V182 D5)
time forms prescribed minutes (n 62,100): all integers; min 7, p10 16, p50 31, p90 60, p99 120, max 120 (marathon W10 Sat
"Two Hour Run"). >59: 7,290; >99: 630 (marathon Long Run); >179: 0.
dist forms prescribed miles (n 45,360): min 0.62, p50 5, p90 12.5, max 26.2 (marathon RACE DAY W18); never >2 dp; >99: 0; no km.
Free dimension at target pace (3,780 run-goal configs): dist forms implied minutes 6.82..268.55 (26.2 mi at 10:15 = 4:28:33);
>59: 20,160/45,360; >99: 10,080; >179: 1,260 (marathon Peak 630, RACE DAY 630). Slower actuals go higher.
time forms implied miles 0.64..10.91; >9.99: 630; >99: 0. 1,260 time forms (Benchmark/Retest "Planned 20 min") carry no
target pace.
dose.tgt (n 113,130): 7:58..11:17/mi (time 8:54-11:00, dist 9:10-11:17, reps_dist 7:58-8:28). dose.cap = 628 s on 63,000
of 114,390 run doses (steady-pace cap).

## Planned strip (`_doseStripHTML` 13486)
time: `N min` (+ `@ m:ss/mi`), never miles. dist: `N mi @ m:ss/mi`, never minutes. reps_time `R × M min`; reps_dist
`R × 400m @ pace`. Every dosed form prints exactly one planned value, the fixed dimension; the free dimension has none and
its placeholder is the bare word. Fixed box placeholder = `${dose.mins}` 13723 / `${dose.mi}` 13729.

## Unknown
V191 not reproducible; not swept: injured, multi-sport, other mile bests/race dates, setCardioSwap path, stored logs;
run reps_time reachability; what athletes actually log.
