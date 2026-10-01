# Measure A — P-BEGINNERMILE re-baseline on V225 (for build 5, target V226)

Persisted by the orchestrator from measure's return, 2026-09-30 (measure is read-only).
Script: `tests/measure/v226_rebase_beginnermile.js`; output: `tests/measure/v226_rebase_beginnermile.out.txt`.
Ruling re-baselined: `tests/measure/v212_rulings/p_pacedisclose_ruling.md` Call 2 (V209 baseline, Mario approved 2026-09-23).

## Premise moves / refutes
- MOVED (item 5). Removing the validator's beginner early return (`_mileEntryState` :7484, `if(!g||exp==='beginner') return {ok:true};`) as the ruling says ("the validator applies") exposes D187 R3 at :7488, which refuses a beginner `run_pace_goal` blank mile: `{ok:false,blank:true,"Required. Enter your most recent timed mile."}` and doGenerate returns no program. The ruling's "optional, 690 stays the default when blank" holds only if :7484 is kept. SV arm (every clause removed except :7484) builds L11.
- MOVED (§12 "nine sites"). 9 gated sites, 11 clauses. D158's :6193 is NOT one: it has no beginner clause; it reads mileBest ungated and passes it as arg 12 to `buildRunSession`, which gates at :3815.
- NEW reader the ruling never listed: `renderProgressScreen` :17396 reads `mileBestMins/Secs` with no beginner gate, passes to `buildProjectionCard` (:16671) as "your X mile". Synthetic probe returned empty string: NOT MEASURED, static read only.
- NEW, not beginner: on V225 the intermediate `run_pace_goal` field label still reads "Optional. It sets your training paces." though R3 refuses blank.

## Method
Three arms: B = V225 as shipped; SX = all 11 clauses removed; SV = SX with :7484 kept. All anchors count 1. Clock pinned 2026-09-30. Lattice 5 goals × 4 miles × 20 seeds, beginner and intermediate (400 cells, 1,600 builds) + age axis 120 builds. Oracles: hand default table 690/570/450, hand chart bounds 5:00/12:00 (D9), B vs SX digests. B self-equal 400/400. HALF_MANNY 0ac7da6b1691a8e1 on B, SX, SV.

## 1. Gate sites — STILL TRUE, count restated
All beginner-gated. Earliest commit by `git log -S`:
- V50: wizard :2855 :2876; `assessRunPaceCeiling` :2433; `calcProgramLength` :3179; `buildRunSession` :3815; `buildNRCSession` :4376.
- V172: `runAnchorInfo` :14709 :14715 :14717.
- V203 (737b96a, D116): validator :7484; pencil :14823.
Ungated mile readers: :2638 (applySeedData writes mile for any experience), :6057, :6193 (both gated downstream), :14947 (goal switch carries mile), :15045 (D116 sheet, gets exp, shielded by :7484), :17396 (Progress).
Downstream of the gates: :2459 (D183, V223 beginner sentence, via fromMile false), :14758 :14766 :14768, :15083 (clipboard via `runAnchorLine`).
No beginner clause on swim, swap, or D116 lock (`openMileSheet`).

## 2. Premise — STILL TRUE
No D-code ruled the gate (six V50 clauses predate every D-code; V172/V203 carried it; no D116 handoff line mentions beginners).
Seed 1000 beginner no mile W1 on B: `run_pace_goal` SI "4x400m at 11:30/mi", LI 12:43, LSD 14:18 (not 14:05); `run_5k` 5K 12:15, recovery 14:05 ceiling 13:33; `run_base` 14:05 ceiling 13:33.
"Gentle either way" still false: 13:00 miler gets 11:30 intervals on B (SX 11:58); 9:00 miler gets 14:05 recovery on run_5k (SX 11:35).

## 3. M1 — STILL TRUE
No harness fixture is a beginner (HALF_MANNY is intermediate). 4 gate lines put beginner + mileBest on one line (g202_pace_copy:195, g223_d183_safepace:220/227/676).
Seed path: mileSec 540/780 × {pace, 5k, base} → 6/6 cfgs hold the mile, kind 'seeded'. B ignores it 6/6; SX reads it 6/6, digest moves 6/6; length unchanged (11/8/9).

## 4. M4
(a) STILL TRUE: "none" byte-identical 100/100, 11:30 100/100; 9:00 and 13:00 differ 200/200; intermediate B == SX 400/400.
(b) STILL TRUE: 13:00 → rawSec 780, row 720 (12:00) clamped slow; D9 advisory on SX: "At 13:00 your paces come from the 12:00 row, the chart's slowest. Consider a base block first." B silent.
Card side effect: with :14717 removed, a beginner with no mile reads "estimated from experience; no mile time was entered" instead of "the beginner default" (build identical, card sentence only).
(c) STILL TRUE at 18-35, MOVED at other ages: 18-35 beginner-SX W1 run tokens == intermediate-B 300/300 (D187 R1 PACE_IMPROVE beginner 3 == intermediate 3). run_base length differs 60/60 (beginner 9 vs intermediate 10, experience length branch), tokens match. run_pace_goal 9:00 at 36-54 and 55+: 0/20 match per age; length 12 vs 11 and 13 vs 11 from the beginner base-build branch :3193 × ageMult; one SI token shifts (8:51 vs 8:54 at 36-54, 8:55 vs 8:59 at 55+).

## 5. R3 interplay
V225: beginners get NO field on all 5 goals. SX: field labelled "Optional" on all 5, but blank `run_pace_goal` REFUSED (:7488, exposed by removing :7484). Other goals blank still build. D116 sheet call carries no id, so blank there stays ok (probed on SX).

## UNKNOWN
Progress projection card for a seeded beginner; beginner × advanced paces; weeks after W1; 13:00 advisory copy in the wizard DOM (validator only); km units; swim.
