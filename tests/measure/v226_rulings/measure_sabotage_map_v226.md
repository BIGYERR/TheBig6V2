# Measure C — parked slice 7b: G5 window, sabotage map S1–S19, old specs at 226, G1 SI oracle

Persisted by the orchestrator from measure's return, 2026-09-30 (measure is read-only).
Script: `tests/measure/v226_sabotage_map.js`; output: `tests/measure/v226_sabotage_map.out.txt`.
Trigger: builder parked slice 7b (standing ruling 7): G5's 120-char window scan fails on the candidate at the R3 clause the ruling's own E6 keeps; S8 found a behavioural no-op; G1's NSW SI "row.mile − 2 s" oracle found coincidental.

Fingerprint: own lattice, not a gate — 72 builds, 36 anchor strings, 36 cards, 91 validator calls, 36 wizard renders, 36 ceiling calls, 307 items (script header says 42/42; counted 36). Candidate self-equal 0/307. Gate trips = FAIL rows new vs the candidate's own FAIL set.

## 1. G5 vs E6
Comment-stripped candidate: 16 `'beginner'` tokens. Only one inside any 120-char window: the R3 clause at index.html:7491, 74 chars from `mileBest`. Next closest :3195 at 545 chars; `_mileFieldHelp` R3-style line :7506 at 868.
Restored tokens need windows: S1 17 (`arguments[12]`), S2 12, S3 17, S4 14, S5 35. Smallest window catching S1–S5 = 35; any window 35–73 catches all five and excludes R3. S9's two tokens need 44 and 57; S7's needs 438.
On the candidate G5 is already red (R3), so today no mutant gets credit for a window trip. S6 removes the R3 token and heals G5.

## 2. Sabotage map (all 19 anchors count 1)
| S | behaviour moved /307 | new FAIL rows |
|---|---|---|
| S1 | 8 | d188 G1 ×3 |
| S2 | 16 | d188 G1 ×4 |
| S3 | 0 on lattice (target 12:00); at the gate's 13:30 target length 9→11, not a no-op | d188 G1 length cell |
| S4 | 4 (wizard 2, ceiling 2) | NONE — SURVIVES (moves beginner pace-goal cell mile 9:00 target 10:30; G8 has no such cell) |
| S5 | 21 | d188 G3 ×5 |
| S6 | 3 | d188 G3, d189 G8f |
| S7 | 8 | d188 G4, d189 G8a |
| S8 | 0 — NO-OP | d188 G5 `kind!=='beginner'` only |
| S9 | 36 | d189 G6b only; G7 NOT tripped (18/36 beginner anchor strings and 6/36 cards change: the beginner entered form falls to the default sentence; G7 does not cover that form) |
| S10–S12 | 24 / 20 / 24 | d189 G6b |
| S13 | 22 | d189 G6b, G7a/b/c, G8a |
| S14 | 12 | d189 G7b/c |
| S15 | 16 | d188 G3 ×2, d189 G8b |
| S16 | 4 | d189 G8c |
| S17 | 36 | d189 G8a |
| S18 | 2 | d189 G8d |
| S19 | gate file | g222 row 5L |
No index.html mutant trips g222 (0/18).

## 3. Old specs at 226
13/535 mutations not count==1 on the candidate. 7 already 0 at V225 (example #2 deliberate, v193_samecard #13, v195 #12, v197 #4, v200 #2 #3, v201 #4). 6 NEW at 226:
- v202 #2 (g202_pace_anchor): anchor is E4's pre-edit text.
- v202 #8 (g202_pace_copy): `tail` ternary gained a run_base branch (F9).
- v202 #9, #11 (g202_pace_copy): `&& a.kind !== 'beginner'` scope clause in `runAnchorLine` gone (F10).
- v203 #3 (g203_mile_pencil): E10.
- v225 #5 (g225_d187_pacerate): E6 rewrote the R3 line.

## 4. G1 SI oracle — builder confirmed
NSW SI `intPace = max(pp._realisticTarget−16, weekPace−16)` index.html:4122–4123; 16 = doctrine physicaltrainingguide2020.txt:251–252 (4 s per 400 m). `weekPace = pp[_ppIdx]` :4113; W1 w=0 → `initialPace` (:3786); `initialPace = rowPaceAt(_chartRow, 1.5)` :3836; `rowPaceAt` :5029 interpolates in log distance between mile and 5K columns (D100/V202 fitted rule, not doctrine text).
Hand oracle exists: 720 + 40·ln1.5/ln3.107 = 734.31 (12:14), − 16 = 718.31 (11:58), from doctrine row nikerunclub5k.txt:160, the D100 formula, and Guide A's 16 s. Engine prints `4x400m at 11:58/mi. This week's goal pace is 12:14/mi` at goal 12:00 and 13:30 alike; at 9:00 8:58 / 9:14; V225 printed 11:30 / 11:46 for all three. The ruling's "row.mile − 2 s" gives 718 vs 718.31: coincidence.

## UNKNOWN
Ruled S1–S19 are measure's own restorations (no v226.json yet); lattice 2 seeds, one rest pattern; d189 G10 red in first candidate run, green in sweep (harness `MANNY_DIGEST_BY_VERSION[226]` landed in between, tests/harness.js:370).
