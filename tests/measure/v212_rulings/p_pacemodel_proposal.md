# P-PACERATE — THE RATE IS A PLANNING NUMBER, NOT A LAW. GIVE IT A SOURCE AND THE RIGHT ORDER. (coach, proposal, not yet a D-code, V207 baseline)

Persisted verbatim-in-substance by the orchestrator from coach's return, 2026-09-23 (coach is read-only).
Citations marked [recalled, verify] are from coach's memory and MUST be checked against the book before any pin.

## Summary for Mario
**Recommendation.** Keep the model's shape: anchor on the athlete's own chart row at the goal distance (D100), a small weekly walk (Guide A p.12 "a little faster each week"), one rate that is also the D101 cap. Replace the values. `paceImprove` 3/5/7 becomes **3/3/2 s/mi/wk**. Age scalers stay. Require the mile on non-beginner `run_pace_goal` (parity with D110a swim). Drop "safely" wherever it describes the rate. Hoist the six copies to one constant.

**Why.** No doctrine page and no published coaching source coach knows states a seconds-per-mile-per-week rate. The published practice is Daniels' VDOT: hold a level 4 to 6 weeks, then move one unit (about 1.5 to 3 percent, larger at lower fitness). At the app's three default rows that is roughly 3.5 to 5 / 2.3 to 3.5 / 1.4 to 2 s/mi/wk. The current table orders it backwards (advanced fastest); 7 s/mi/wk promises a 7:30 miler about 14 percent in 11 weeks. HERITAGE physiology and the swim table Mario already ruled (4/3/2, D110a) both order it the other way.

**Numbers Mario rules on.** (1) 3/3/2, alternative 4/3/2. (2) `agePaceScale` 1.0/0.85/0.65 stays, recorded as judgement. (3) `ageMult` stays; the double count goes to §12. (4) Mile required for non-beginner pace goals. (5) "safely" goes.

**Expected effect.** Undated lengths unchanged when cap-bound (gap > 4 × rate), one to two weeks longer on small intermediate/advanced gaps. Clocks walk 2 and 5 s/mi/wk slower, so more blocks end honestly short with the realistic-target note. Beginners: zero change. Mario's half: zero change expected (NRC path, mile entered); proved by digest, not asserted.

**Strongest counter.** Daniels' cadence describes runners already in structured training; a returning intermediate gains faster in a first block, so 5 was right for him. Coach would still ship 3: the block then ends with a note naming what it reached, not a promise it cannot keep.

## 0. The model as it stands (V207)
- rate: paceImprove {beginner:3, intermediate:5, advanced:7} s/mi/wk, five copies (:2231 :2453 :3088 :3770 :3822), fallbacks disagree (`|| 4` at three sites, `|| 5` at :3777).
- age: agePaceScale {18-35:1.0, 36-54:0.85, 55+:0.65} multiplies the rate (four copies); ageMult {1.0, 1.07, 1.15} multiplies the LENGTH (three copies). Both hit the same athlete.
- default: expCurrentPace {690, 570, 450} = the 11:30 / 9:30 / 7:30 PACE_CHART rows, six copies.
- length: weeksToPace = min(round(ceil(gap/rate)*1.25)+4, 8/10/14/20 by distance), then ×ageMult, +1 grace, min(9/11/15/21), beginner max(base-build) min 26, floor 6.
- clock: buildRunProgressionForLength: weekPace = initial − min(gap/buildWeeks, rate)×w; taper holds; E7 holds at current if the goal is already met; realistic target printed on the INT note.
- readers: undated pace-goal length (:3178); D101 clock cap (:3776); undated ceiling banner assessRunPaceCeiling (:2427, kept by P-SAFEPACE); dated offer achievablePacePerMile (:2229, removed by P-SAFEPACE R1); anchors when no mile is entered, NSW :3813 and NRC :4341.
- origin: all literals present in V50 (first upload). No comment cites a source. D9 folded 660→690. D101 kept 3/5/7 as "one sourced rate" citing nothing. No D-code ever ruled the values.

## 1. What doctrine actually supports
- **Session paces need no rate; NSW is anchor plus offset.** Guide A p.12: pace "slightly faster than the pace of your most recent 1.5-mile run… 400m interval pace should be about 4 seconds faster than your base pace" (D111, −16 s/mi). Guide A p.15: LI at approximately 90-95% of maximal pace for that duration (V116 tempo ×1.08). LSD by talk test. Guide B Table 6 week 0 is "1.5 (timed)".
- **Intensity progression is shaped, not sized.** Guide A p.12: complete all 8 intervals, then get "a little faster each week". Guide B: beyond 26 weeks, hold INT/CHI distances and progress intensity. Guide A p.15: "Work hard and try to get faster over time." No number anywhere. Volume-to-8-reps-first sequencing is D114/D115's and not reopened.
- **The weekly walk is doctrine-shaped; its size is the app's.** p.11's 10% is mileage (weeklyPct), not pace.
- **Where the engine genuinely needs a number:** (a) LENGTH of an undated pace goal (dated goals follow the date: D106a/P-TESTLEN); (b) the D101 CAP on the clock, same number as (a), one owner; (c) the undated CEILING banner (assessRunPaceCeiling, 45 s/mi tolerance); (d) the ANCHOR when no mile is entered (not a rate question; item 2d).
- **Direction (out of scope, design session):** an anchor the athlete's own tests move; the rate becomes a fallback between retests.

## 2. Candidate values, with provenance
Marks: [doctrine] in doctrine/*.txt; [cited] published source coach is confident of; [recalled, verify] from memory, check the page before pinning; [judgement] coach's own.

### 2a. The rate
- Sources with NO s/mi/week rate [cited, by absence]: both NSW guides; the four NRC plans (offsets only); ACSM Guidelines for Exercise Testing and Prescription 10th ed. (2018) progresses by duration/frequency; Pfitzinger & Douglas set paces from recent races.
- One published cadence [recalled, verify]: Daniels' Running Formula 3rd ed. (Human Kinetics, 2014), VDOT chapter: hold a VDOT about 4 to 6 weeks, raise one unit; one unit ≈ 1.5 to 3% of race pace, larger at low VDOT (coach's recollection of 5K column: 40→24:44, 41→24:08; 50→19:57, 51→19:36; 60→17:03, 61→16:48; VERIFY). ≈ 0.25 to 0.75%/week, decreasing with fitness.
- Physiology direction [cited]: Bouchard et al., "Familial aggregation of VO2max response to exercise training: results from the HERITAGE Family Study", J Appl Physiol 1999;87:1003-8. ~16% mean VO2max gain over 20 weeks in sedentary adults, huge individual spread: least trained improve most; any fixed rate is a population average, never a safety limit.
- App precedent [handoff D110a]: swim 4/3/2 s/100/wk × age, ruled by Mario (beginners gain fastest). Run 3/5/7 is unruled and ordered the other way.
- Daniels' band on the app's default rows [judgement on arithmetic]: beginner (11:30) ≈ 3.5 to 5; intermediate (9:30) ≈ 2.3 to 3.5; advanced (7:30) ≈ 1.4 to 2 s/mi/wk.
- **T1 (pick) {3,3,2}**: beginner unchanged (walks a guessed anchor; base-build bound). Intermediate 5→3, advanced 7→2.
- **T2 (alt) {4,3,2}**: Daniels midpoint for slow row; identical to swim table; beginner blast radius for ~9 s/mi over 9 weeks.
- T3 (rejected) 0.4%/week, no tiers. T4 (rejected) drop weeksToPace, length = cap always.
- Why 3/5/7 cannot stay [judgement]: 7 s/mi/wk walks a 7:30 miler ~63 s/mi in ~9 build weeks (~14%); Daniels gives ~15 to 18 s.

### 2b. Age scalers
No source gives an age factor for adaptation rate (Daniels age-grades performance [recalled, verify]). Direction is standard masters coaching [judgement]. Keep both; record as judgement in §11f. §12 flag: double count (55+ = 1.54 × 1.15 = 1.77× weeks before cap); not this ruling.

### 2c. Length shape (×1.25 + 4, caps 9/11/15/21, floor 6)
Unsourced [judgement], not wrong in kind. Under T1 the caps bind on any gap > 4 × rate. Keep, record as judgement.

### 2d. Defaults (expCurrentPace 690/570/450)
PACE_CHART rows; 690 ruled (D9). Recommend: REQUIRE the mile on non-beginner run_pace_goal (wizard gate, same shape as D110a swim). Beginners keep 690 (V172 rule). Counter: wizard friction; answer: a time goal with no current time has no anchor in doctrine, and the V156 seed banner pre-fills the mile from logged runs.

### 2e. Copy
Nobody sourced the pace math; once Mario rules, the app owns it as a planning number. No string calls the rate "safe". Strings say what the block reaches ("This block reaches about 8:02 per mile. Your goal of 7:44 is past it."). No mid-sentence dashes.

### 2f. Siting (session's)
One declaration `PACE_IMPROVE` at module scope beside `PACE_GOALS`; five readers plus D101 fallback; `|| 4`/`|| 5` collapse to the intermediate value. Gate: declaration count 1, reader count ≥ 5 (standing rule 3).

## 3. Expected effect (code read, to be measured)
- beginner, all ages: T1 zero change. T2 clock +1 s/mi/wk.
- intermediate 18-35: rate 5→3. Length unchanged when gap > 20 s/mi; 12 to 20 s/mi lengthens to cap (e.g. 15 s/mi at 1.5 mi: 9 → 11 weeks); < 12 s/mi one to two weeks longer. Realistic target lands 18 s/mi nearer anchor over 9 build weeks; dampened note fires on gaps over ~27 s/mi instead of ~45.
- advanced 18-35: rate 7→2. Length unchanged when gap > 28; cap-bound from 8 s/mi. 45 s/mi less promised over 9 build weeks. The change that matters.
- 36-54 / 55+: scaled 0.85 / 0.65; advanced 55+ walks 1.3 s/mi/wk.
- ceiling banner fires more for intermediate/advanced, never for beginners under T1.
- dated goals: length follows date; only the clock cap moves.
- swim, bike, NRC, base: untouched by construction; confinement is a measure.
- **Mario:** THE HALF MANNY is run_half, NRC path, mile entered. No reader of the rate or default on that path. Expected digest unchanged, no era row. Prove it. (Fixture carries a 10:30 mile; Mario's wizard screenshot shows 8:00 — confirm which cfg is live.) If he rebuilt his V202 pace goal (anchor 8:29, target 7:44, 45 s/mi gap, intermediate 18-35 assumed): before reaches 7:44; after ~8:02 with an INT note ~18 s/mi short. Length 11 both ways.

## 4. Measure plan (before ruling)
- M1 Site census (literals, fallbacks, test pins: grep tests/gates tests/sabotage tests/measure for `intermediate:5`, `advanced:7`, `0.65`, `0.85`, `_paceImprovePerWeek`, `_weeklyGain`).
- M2 Lattice before/after (base vs T1 surgery copy, T2 if wanted): run_pace_goal × {1.0,1.5,3.1,6.2} mi × 3 exp × 3 age × mile {none,7:30,8:00,9:30,11:30} × goal offset {−20,+10,+15,+20,+30,+45,+100 s/mi} × {undated, dated +4w,+8w,+12w} × rest {sun/wed, sat/sun}, seed pinned. Per cell: calcProgramLength weeks, paceProgression W1/peak/_realisticTarget/_dampened/_weeklyGain, INT note, assessRunPaceCeiling, dated header.
- M3 Cap-bound fraction before vs after by tier; small-gap cells that lengthen.
- M4 Confinement fuzz: 0 diffs on every non-run_pace_goal cell; under T1, 0 diffs on beginner cells.
- M5 HALF_MANNY digest identical on both.
- M6 Mario's V202 pace-goal cfg (seed 24865, 5 train days, 8:15 mile, 1.5 mi) before/after.
- M7 If 2d ships: count stored programs/fixtures with non-beginner run_pace_goal and no mile.
- M8 Copy sweep after 2e.

**Recommendation:** rule T1 (3/3/2), keep age scalers and length shape as recorded judgement, require the mile on non-beginner pace goals, drop "safely", hoist to one constant; one version, after P-SAFEPACE and P-TESTLEN land (same wizard card).
**Counter:** Daniels' cadence describes runners already in structured training; a returning intermediate may gain faster than one unit per 4 to 6 weeks; 5 s/mi/wk may be right for him.

## AMENDMENT 1 (coach, 2026-09-23; standing ruling 7 after tests/measure/v212_pacerate.js on V209, 10,080 cells, and v212_pacerate_m6.out.txt)

### Mario's calls (revised)
1. Rate = T1 (3/3/2). T2 WITHDRAWN: shortens 390 beginner blocks (55+, 3.1 mi, gap 10: 15→11) and un-pins 50 dated tests. T1 shortens 0 of 10,080 cells.
2. Accept longer undated blocks on big long-distance asks. Advanced, 8:00 mile, 30 s/mi at 6.2 mi: before 11 weeks printing 7:43; T1 21 weeks reaching 8:18. Daniels' four units is 16 to 24 weeks [recalled, verify]. `offerShorterPlan` remains.
3. Age scalers, ageMult (double count to §12), length shape: keep, recorded as judgement.
4. Mile required on non-beginner pace goals.
5. "safely" goes.
Counter: 21 weeks is a block few recreational runners commit to; a 15-week cap for undated pace goals may be kinder. Coach would not: the cap is pre-existing and the honest number is the point.

### Refuted premises and what each changes
R1 Undated pace goals have no taper: 11 build weeks at 1.5 mi. Advanced 18-35, 8:00 mile, gap 100: 6:57 before, 7:52 under T1 (55 s); mean 70 (45 to 105, n=40). Strengthens the ruling.
R2 Length unchanged only at 1.0/1.5 mi. 18-35, 8:00 mile, gap 30, undated:
    3.1mi int  B L13 rt 7:35 g5    T1 L15 rt 7:55 g3
    3.1mi adv  B L11 rt 7:30 g6.4  T1 L15 rt 8:10 g2
    6.2mi int  B L13 rt 7:55 g5    T1 L18 rt 8:06 g3
    6.2mi adv  B L11 rt 7:43 g7    T1 L21 rt 8:18 g2
  This is the cost and the right cost. T1 stays the pick; lengths are monotone under a slower rate.
R3 Dated at +12w: 430 cells change length under T1, 220 flip unpinned→pinned via D106a's gate (0 reverse). Ship AFTER P-TESTLEN.
R4 T2 withdrawn (see call 1).
R5 Mario's V202 record: 1.5 mi in 10:30 (7:00/mi), mile 8:15, intermediate 18-35, test 2026-10-19, seed 24865.
    dated (5 wk)   B 8:29 8:24 8:19 8:14 8:14   T1 8:29 8:26 8:23 8:20 8:20
    undated (11 wk) B W11 7:39, note 7:34        T1 W11 7:59, note 7:56
  7:00 goal is out of reach under both. HALF_MANNY 0ac7da6b1691a8e1 on base, T1, T2. 8:00 miler asking 7:30 at 1.5 mi undated: T1 7:41 int / 7:52 adv; after P-CLOCKEND the note and W11 agree at 7:44 / 7:54.
R6 Undated ceiling banner moves only at gap 100; P-SAFEPACE's card; not made worse here.

### New D-code split out: P-CLOCKEND (conformance, session's call, not Mario's)
Pre-existing on every pace goal. realisticTargetPace = initial − rate × buildWeeks, but week w prints initial − rate × w from w = 0, so the last build week is one step short: (a) undated INT note names a pace no week prints (2,340/2,340 not-yet-met cells, up to 7 s/mi now, 3 under T1); (b) dated taper weeks print the missing step, one step FASTER than the last build week (M6: W3 8:19, W4 taper 8:14, W5 8:14), contradicting "intensity is held throughout" (V115, V116). Ruling: block target = last build week's pace; taper holds it; note names it. Own D-code; built first in the same version as P-PACERATE.

### Revised ordering
P-SAFEPACE (R1 to R5) → P-TESTLEN → one version carrying P-CLOCKEND then P-PACERATE.

### Revised measures
M2 re-run on top of P-CLOCKEND before final; 220 flips reported as 0 after P-TESTLEN; confirm T1 shortens 0 cells on re-run. Pins: g202_pace_anchor.js:41, g202_pace_copy.js:52/:93, sabotage/v202.json:46, v206_d109.json:25, plus FIVE fallbacks (:2232 :2452 :3089 `|| 4`, :3773 :3830 `|| 5`) collapsing to one constant.

## MARIO DECISION (2026-09-23)
- Rate: T1 3/3/2. "safely" goes.
- Longer undated blocks: ACCEPTED (no 15-week cap).
- Mile required on non-beginner run_pace_goal: AGREED. Mario asks: is anything telling users (esp. beginners) what default pace is assumed when they enter nothing? Measure running (v212_default_pace_disclosure.js); coach to rule copy if nothing does.
- Ordering stands: P-SAFEPACE -> P-TESTLEN -> P-CLOCKEND then P-PACERATE. Ship slot: HOLD with the batch.
