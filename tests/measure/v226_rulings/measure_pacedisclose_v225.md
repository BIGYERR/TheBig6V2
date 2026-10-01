# Measure B — P-PACEDISCLOSE re-baseline on V225 (for build 5, target V226)

Persisted by the orchestrator from measure's return, 2026-09-30 (measure is read-only).
Script: `tests/measure/v226_rebase_pacedisclose.js`; output (all strings verbatim): `tests/measure/v226_rebase_pacedisclose.out.txt`.
Ruling re-baselined: `tests/measure/v212_rulings/p_pacedisclose_ruling.md` Calls 1, 3, 4, M2, M3 (V209 baseline, Mario approved 2026-09-23).

## Method
Real `doGenerate` + wizard render, clock pinned; `buildProgram` sweep 1,440 builds, 0 crash. Baseline self-equal true. HALF_MANNY 0ac7da6b1691a8e1 self-equal and == pin. Oracles: hand table 690/570/450; the ruling's §1/§2 strings as typed literals; R3's refusal text.

## Premises moved or refuted
- REFUTED — §12's "only arises for beginners on pace goals". Event + hybrid paths: a no-mile build produces a program in 16/18 goal×level cells (3/3 seeds each): NRC race goals ×3 levels, run_base ×3, pace-goal beginner. Only pace goal × {intermediate, advanced} refuses (0/3 builds each, "Required. Enter your most recent timed mile."). Call 3 holds: NRC and run_base optional at every level.
- REFUTED — "D183 changed the program card sentence". `runAnchorSentence` :14758 still prints the V209 string "Anchored on an 11:30 mile, the beginner default. A mile time starts being used at intermediate." The D183 string is `paceCeilingSentence` :2459: wizard #paceFeasLine and the dated card only, run_pace_goal only, only when the goal is out of reach; null when reachable (:2437) and when the shortfall is under 45 s (:2448).
- NEW conflict for S1: of 640 selected cards, 480 are NRC "Speed Run — Intervals"; their note field is the V171 Intervals note, which the ruling's §4 lists under "does not change". S1 targets that same field.
- NEW contradiction: pace goal × {intermediate, advanced} wizard label still says "Optional. It sets your training paces." (:2856); R3 refuses blank (:7488); D9's ">25:00" (:7496) says "Leave it blank and the program anchors on your experience level instead." The blank it recommends is refused.

## 1. Reachability — claim REFUTED (above).

## 2. Surfaces
- Wizard label MOVED: "Current mile time" + "Optional. It sets your training paces." (:2856/:2877). Beginners: no field, no note, any goal (guard :2855).
- Card sentence B1/B2 STILL TRUE, verbatim.
- Clipboard (:14766): "(beginner default)" / "(est. from experience)"; §1 did not quote it.
- Pencil hidden for beginners (:14823) STILL TRUE.
- run_base: STILL no Run paces block and no clipboard line, all 3 levels (`_CHART_RUN_GOALS` :14699 excludes it). W1 Easy Run still prints "Around 14:05/mi…" (B7e STILL TRUE); value moves with level (12:10 intermediate, 9:55 advanced).
- B7a/b/c render verbatim, STILL TRUE.
- Session cards: 0 of 27,720 run cards carry a disclosure token. STILL TRUE.
- Beginner with an 8:00 mile entered: ignored at all 5 chart goals, still 11:30.
- Call 4 already shipped: 0/11 verbatim. Nearest shipped: W3 reworded as D183 "Your paces start from the beginner default of 11:30 per mile" (:2459, different surface, conditional); a W2-like line renders for non-beginner pace goals in the wizard before the refusal: "You have not entered a mile time. The intermediate default is 9:30 per mile…" (:2460); D9 sentence first half only: "Over 25:00 reads as a walk, not a run."

## 3. Wizard length header — REPRODUCED
Pace goal × {intermediate, advanced} × 3 ages × 8 targets = 48 cells. No mile: header renders a length 48/48 (:1998), doGenerate refuses 48/48; no-mile header == header at the hand default mile 48/48. Entering 13 miles 6:00 to 12:00: header differs from the no-mile header in 189/624 cell×mile pairs (intermediate 87/312, advanced 102/312); every cell has at least one such mile. Example: intermediate 18-35, 1.5 mi 12:30 goal: no-mile header 11 weeks; any mile 8:00 or faster gives 6.

## 4. M2
Selection rule: W1, days Mon→Sun, first `type==='run'` card whose `detail` matches `\d:\d\d/mi`, skipping benchmark (subtype or `dose.key==='bench'`), TIME TRIAL, RACE. Lattice 6 goals × 3 levels × 20 seeds × rest {sun/wed, sat/sun} × mile {none, 8:00}.
640 reachable no-mile programs: exactly one card 640/640; none 0; same-day ties 0; Sun→Sat vs Mon→Sun disagree 0. Selected card is benchmark/TT/race 0.
Selected card has Nike-verbatim `detail` 480/640 (all NRC Mon Intervals). NSW 160: pace-goal SI 40, run_base Easy 120 (fri 60, sat 60). App-owned `note` non-empty 640/640.
Excluded: 80 unreachable no-mile builds. 720 mile-entered builds, 240 of them beginner with the mile ignored today.

## 5. M3
38 current strings swept, 15 hits: en-dash in NRC effort chips "7–8/10" (12), em-dash in NRC Intervals `detail` (3), "RPE 3-4" in run_base Easy `detail`. Card sentence, clipboard, wizard, D9, paceFeasLine: 0 hits. "Nike": 0. Call 4 copy: 0/11 hit.

## 6. g222 5L licence
V225: PASS 8 FAIL 0, licence granted, residue 68/5088 (cap 70). 226-stamped copy (meta-only diff): PASS 7 FAIL 1, the only FAIL row 5L "licence REFUSED above 225". Same 68 rows: 2 unique pairs (48× "2×10", 20× "2×8" → "… hold RPE 7, two in the tank"), all mario|W5, 68/68 boot == MAP boot. Every other row identical.

## Root
Default anchor: `expCurrentPace` :2432 and :3095, `runAnchorInfo` :14700. Readers: :14758-14759, :14766, :2459-2460, :1998, :7496.

## UNKNOWN
D116 mid-program mile sheet strings (:14991); dated-card tw rows for the beginner D183 sentence; how often a beginner goal is out of reach; swap, Progress, history surfaces. M1/M4 not run here (measure A ran them).
