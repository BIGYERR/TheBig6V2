# V227 measure — D190 premises P1–P8 on the strip-then-refilter tree (source surgery on V226)

Saved verbatim from measure's return by the main session. Script `tests/measure/v227_d190_premises.js` (+ `_post.js`), output `tests/measure/v227_d190_premises.out.txt`. Mario's decisions before this landed (2026-10-01): D190 "Ship D190 at V227"; P-CAPRPE "Queue it next".

MODE     B (before-picture). D190 premises P1–P8 on a source-surgery tree of V226 (HEAD 637bc8e, ia-version 226). `index.html` and every gate are untouched.

**Verdict:** two premises fail as written. P1 fails on the sampled chains (6 of 2,345 hop3 rows still differ live vs boot). P3 fails on its count (class (i) is 128, not 133). P2, P4, P5, P6, P7 and P8 pass. P1 is one of the ruling's two "back to coach, slice parks" premises.

## METHOD
- Lattice: same as `v227_swapseam.js`. 9 configs × W3/W5/W7. Full: hop1/hop2/cyc2, 66,969 reachable chains. Sampled: hop3/cyc3 by a seeded walk (≤6 per day), collide2/exch3 seeded (≤8 per day), 2,345 reachable. 69,314 chains per tree. Reachability moved between trees: 0.
- Boot model: the gate's fresh-page boot. Oracles: live = what the athlete saw last; undo = the day before the last hop. Cue literal typed; cap table typed from the ruling's header; RPE 7 / RPE 8 forms typed from the ruling's text.
- Scratch: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0d209eb9-c4f5-49d1-974c-7a51334cecdf/scratchpad/measure2/` (`base_v226.html`, `t_base.html`, `t_d190.html`, `d190_226.html`, `d190_227.html`, `g221_rescoped.js`, job/res/p8 files).

## SURGERY DIFF (V226 → `d190_226.html`; every anchor count==1; `node --check` passes on all 4 trees)
```
8088a8089,8090
> const INJ_CAP_CUE=' — hold RPE 7, two in the tank';
> function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }
8125c8127
<       if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+' — hold RPE 7, two in the tank';
>       if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;
10166c10168
<       it.detail=_swapDetailFor(to,it.detail);
>       it.detail=_swapDetailFor(to,_stripCapCue(it.detail));
14288a14291
>   const _base=_stripCapCue(_wasDetail);
14290,14291c14293,14301
<   item.detail=_swapDetailFor(to,item.detail,_rx);
<   const _reRx=(item.detail!==_wasDetail);
>   item.detail=_swapDetailFor(to,_base,_rx);
>   const _reRx=(item.detail!==_base);
>   if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){
>     try{
>       const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);
>       const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];
>       if(_fi&&_fi.name===to) item.detail=_fi.detail;
>     }catch(e){}
>   }
```
The boot re-filter (:10316) and `_swapDetailFor` are untouched.

## PREMISES

| # | Ruling expects | Measured | Result |
|---|---|---|---|
| P1 lattice | residue 0/66,969 | slot 0/66,969, whole day 0/66,969 (V226: 128/66,969) | PASS |
| P1 samples | 0 on hop3/cyc3/collide2/exch3 | **6/2,345**, all hop3: elbow 1, knee_protect 1, lowback 3, shoulder 1 (V226: 12/2,345; D190 heals 6 of those) | **FAIL** |
| P1 g222 at 227 | licence REFUSED, 5L 0/5,088 | "5L licence: REFUSED at ia-version 227"; 5L name 0/5,088, detail 0/5,088; PASS 8 FAIL 0 | PASS |
| P2 | toasts moved 0/66,969 | lattice 0/66,969; samples 0/2,345 | PASS |
| P3 class (i) | 133 (mario 68, ankle 65) | **128 (mario 68, ankle 60)**; 128/128 are exactly the V226 residue rows | **FAIL (count)** |
| P3 boot moved == (ii)+(iii) | exact | boot moved 1,868 = (ii) 621 + (iii) 1,247. Boot moved outside (ii)+(iii): 0. (ii)+(iii) with no boot move: 0. Same kind on both paths 1,868/1,868 | PASS |
| P4 | uninjured 0/17,217 | 0/17,217 (live, boot, toast, undo); 0/17,829 all classes | PASS |
| P5 digests | 9/9 equal | 9/9 | PASS |
| P5 HALF_MANNY | 0ac7da6b1691a8e1 | HEAD and D190@227 both 0ac7da6b1691a8e1; row [227] undefined | PASS (era row still to be added) |
| P5 exSwapPrefs | class (ii), licensed | moves, see note | dose moves too, see note |
| P6 | swap then undo byte-identical; undo-boot ≠ undo-live 0 | chip 66,969/66,969; slot ≠ pre-hop 0; whole day not byte-identical 0 (injured 0/49,752); undo-boot ≠ undo-live 0 (V226: 5, ankle) | PASS |
| P7 G3c before re-scope | ≥118 red | 118 of 4,066 (no lowback or hip additions) | PASS |
| P7 G3c after re-scope | 0 | scratch copy of g221 with a cue-blind compare: PASS on D190 and on HEAD | PASS |
| P7 G6a, G1a, G5a, G7-1b, G7-2a | unchanged | all PASS, no edit | PASS |
| P8 | every chain from the 4 natively cued items, live == boot | mario 127 chains (Reverse lunge W3 thu 68, Step-ups W5 thu 59), 0 differ. ankle 112 chains (Bulgarian W3 56, W5 56), 0 differ | PASS |

## P1 sample rows on D190 (5 of 6 byte-identical to V226 live and boot; donor not cued and no step cued, except #4304)

| row | chain | D190 live | D190 boot |
|---|---|---|---|
| knee_protect#1946 W3 thu Main | Cable pull-through > 45° back ext > Cable pull-through > Single-leg hip thrust | 4 sets — RPE 7 (leave 3…) | 4×8–12 — RPE 7 (leave ~3…), ramp… |
| lowback#1209 W3 tue Biceps | DB curl > Inverted rows (rings) > DB curl > Incline DB curl | 3 sets — RPE 7 (leave 3…) | 3×10–12 @ RPE 7 |
| lowback#1582 W3 thu Calves | DB standing calf raise > 45° back ext > calf raise > Glute-ham raise | 3 sets — RPE 7 (leave 3…) | 3×15–20 @ RPE 7 |
| shoulder#1815 W3 thu Leg ss B | GHR > SL glute bridge > GHR > Cable pull-through | 2 sets — RPE 7 (leave 3…) | 2×6–10 @ RPE 7 |
| elbow#5764 W5 thu Leg ss B | SL hip thrust > SL glute bridge > SL hip thrust > Lying leg curl | 2 sets — RPE 8 (stop 2…) | 2×6–10 @ RPE 8 |
| lowback#4304 W5 tue Pull (cued donor) | DB row (2×8 each — cue) > Inverted rows (rings) > DB row > Chinups | 2 sets — RPE 8 (stop 2…) (V226: RPE 7 form) | 2×8 each (V226: 2×8 each — cue) |

- All 6 have the shape A > B (unloadable) > A > C. The live card keeps the bodyweight-sets form; the boot restores the loaded dose.
- This class predates D190. It is outside both D190's mechanism and g222's 5L population (hop2+cyc2 only).
- Where it comes from (e.g. whether the store cancels the A>B>A round trip) is not measured.

## P3 detail (lattice, live moved 1,996 = (i) 128 + (ii) 621 + (iii) 1,247)
- Every (ii) and (iii) row has a natively cued donor. By config: elbow 912, shoulder 572, hip 450, lowback 389, knee_protect 307, mario 119, ankle 110.
- Of the 1,247 class (iii) rows, **585 end on a pattern the plan caps** ("the plan wants 7, the card says 8"): elbow row 244, hpress 104, vpull 54, bi_iso 51, tri_iso 10; hip hip_ext 108, hinge 11, squat 3.
- Remaining 662 class (iii): 559 lowback and shoulder (capped/uncapped split not printed); 64 on an uncapped pattern (elbow delt_iso 25, hip calf_iso 19, hip leg_iso 12, ankle hip_ext 8); 103 knee_protect (no hand cap table).
- Example: elbow#4792 Barbell row (cued) > Pendlay row > Feet-elevated inverted rows [row, capped]: "2 sets — RPE 7 (leave 3 or more in reserve)" becomes "2 sets — RPE 8 (stop 2 reps short of failure)".
- Class (ii): 621 rows, every one on an uncapped end (knee_protect 78 not split).
- The ruling's table rows on D190 match "After" exactly (mario W5 thu rows; ankle W3 thu → SSDL `2×8`; ankle → Nordic RPE 8 form; toasts Same job).
- Cue ⇔ cap check on the D190 live final slot, workaround configs: 0 violations of 43,871.

## P5 exSwapPrefs note
- Setup: mario knee/wa, source Reverse lunge (KB). Uncapped sheet candidates: DB split-stance DL, KB single-leg DL, Barbell RDL (all hinge).
- On each of the 3 targets the build moves 2 cards, **W3 thu and W4 thu**, from `2×10 each — hold RPE 7, two in the tank` to `2×8–12 each @ RPE 7`.
- The cue drops (class ii), **and the dose moves too**. `_swapDetailFor` returns `2×10 each` on both trees, so a later build pass rewrites the cue-free detail. That pass is not identified. W4 thu is natively cued in the no-pref build.

## GATES (each run directly, argv[3] = HEAD base)

| gate | HEAD | D190@226 | D190@227 | what changed at 227 |
|---|---|---|---|---|
| g221_d177_swapfloor | 20/0 | **19/1** | 19/1 | G3c power 118 of 4,066 |
| g193_samecard | 53/0 | 53/0 | **crash** | throws: no OPEN_UNRULED_BY_VERSION row for V227 |
| g197a_pool_static | 41/0 | 41/0 | 40/1 | D1 MANNY row |
| g197b_sweep | 30/0 | 30/0 | 24/6 | B4i, B4j, B4k, B4l, B5c era rows; B8a MANNY row |
| g198_posterior_floor | 29/0 | 29/0 | 28/1 | C1 MANNY row |
| g199_deload_arbitration | 56/0 | 56/0 | 41/15 | MANNY, MANNY_DELOAD_OFF and DELOAD_ARB rows |
| g200_core_tier | 43/0 | 43/0 | 41/2 | MANNY_CORE_OFF and MANNY rows |
| g200_pull_arbitration | 18/0 | 18/0 | 12/6 | B1 MANNY row, P2c era row and others |
| g202_d108_touchset_freeze | 10/0 | 10/0 | 9/1 | MANNY row |
| g202_pace_anchor | 33/0 | 33/0 | 32/1 | MANNY row |
| g202_pace_copy | 16/0 | 16/0 | 15/1 | MANNY row |
| g203_mile_pencil | 100/0 | 100/0 | 98/2 | MANNY row |
| g204_clock_limb | 75/0 | 75/0 | 73/2 | MANNY row |
| g210_equipment_denials | 128/0 | 128/0 | 127/1 | O6r MANNY row |
| g219_samecard_draws | 15/0 | 15/0 | 5/10 | F1, F2, R1–R8 era rows |
| g226_d189_pacedisclose | 18/0 | 18/0 | 17/1 | G10 MANNY row |
| g222_d181_chain | 8/0 | 8/0 | 8/0 | licence REFUSED, 5L 0 |

- At 226 the surgery moves only g221 G3c. Every 227-only failure is a missing ia-version 227 era-table row. HALF_MANNY reads 0ac7da6b1691a8e1 wherever printed. g193 crashes on its missing row rather than failing by name.

## SPREAD
- The boot re-filter (:10316) now changes the day on 1,119/49,752 injured hit days (V226: 128), across all 7 injured configs. It stays load-bearing (R5).
- `ia_hist_` (t1 sample): hist ≠ live 0/4,607 and boot ≠ live 0/4,607 on both trees.

## UNKNOWN
- Which later build pass turns the cue-free `2×10 each` into `2×8–12 each @ RPE 7` on the exSwapPrefs path; whether the store's handling of A>B>A explains the 6 hop3 rows; halfstep and the other protect regions; `applyAddChoice` (P-ADDSEAM); collide2/exch3 sampled ≤8 per day, not fully enumerated. Equipment, focus, experience fixed at mario's values. Chain ids shifted from the earlier pass; the ruling's table rows were matched by content.
