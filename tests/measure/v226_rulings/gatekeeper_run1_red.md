# Gatekeeper run 1 on the V226 candidate — RED (fuzz: 18 A2-reverse tier flips)

Persisted by the orchestrator from gatekeeper's return, 2026-09-30. Scratch: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/gatekeeper/` (v226_gate.out, v226_gate_table.out, g_assume/, sab/, spot.out, s19/, blast.diff, v226_fuzz.js, fz_*.json, cb.txt).

```
GATE     gate.sh index.html base_V225: meta 226, syntax ok, 0 new dupes (_isoToday known), self-stable yes, ALL GATES PASS, rc=0
GATE     81 gates candidate all FAIL 0 (baseline all FAIL 0)
         g226_d188_beginnermile PASS 31 FAIL 0 (V225 PASS 31 FAIL 0, era-keyed)
         g226_d189_pacedisclose PASS 18 FAIL 0 (V225 PASS 18 FAIL 0, era-keyed)
         IA_ASSUME_VERSION=226 on V225: D188 red G1 x8, G1f x2, G1g, G3 x5, G4 x2, G5 x6; D189 red G6b, G7a/b/c/e/f, G8a/b/c/d/f; G2, G9, G10 green.
SABOTAGE tripped=540 survived=4 not_applied=7 crash=0 of 551 (73 specs)
         v226.json 19/19 tripped; each mutation's reds are its named rows (hand re-run), plus G5 backstop.
         S19 manual (g222 scratch copy, 226 removed from LIC5L_ERAS): REFUSED at 226, PASS 7 FAIL 1, only row 5L changes.
         NOT-APPLIED: the expected 7 (example #2, v193_samecard #13, v195 #12, v197 #4, v200 #2 #3, v201 #4); anchors count 0 on V225 too.
         SURVIVED: v219 S1-D167, S3-D171, S4-D167 on g219_d167_pairs, and v205_d122_threerun_v204 S4; all 4 survive identically on V225 (v219 trio = known debt since V221, handoff V221 notes (1)).
BLAST    19 hunks, +58/-33: Version 1, A1 5 (E1 E3 E4 E5 E6), A1+C+F 1 (E7, F7), C 4 (F8, F9 x2, F10), D 7 (F5, F6, E8 x2, E9, F1/F4, E10), B 2 (F11 call + function), F 1 (:2459 removed); unclassified 0; every removed line a ruled removal or rewrite.
FUZZ     7992 configs / 2,284,087 sessions / 18 violations; baseline self-equal 0/7992, candidate self-equal 0/7992.
         non-beginner with mile byte-identical 3456; non-run goals identical 1080; B one W1 S1 note 1152; A3+B beginner no-mile 576; A1 pace moves 1584; A1 E3 length 11>9 144 (run_pace_goal, matches G1 length row); A2 tier A>B 1440 days, B>C 684 days; UNCLASSIFIED C>B 18 days.
VERDICT  RED — fuzz: 18 A2-reverse tier flips
```

## Needs a ruling
1. The 18 reverse flips: all run_base, beginner, mile 13:00, support_prevention, every equipment × rest × seed cell, W3 SAT `{Easy Run — Long}`. Example (commercial, rest mon/thu/sun, seed 1000): V225 `Strength[…] | Explosive finisher[Jump squats, Burpees] | Core — Rotational Power[…]` → V226 `Strength[…]` only. A2 was licensed rest→lift only and the ruling printed "0 at 13:00". Repro: cb.txt, v226_fuzz_cb.js.
2. Ruling's own numbers disagree: "length 0/480 moved" vs the G1 length cell (11→9). Gatekeeper classified the 144 length moves as A1 under E3.
3. Four old survivors (pre-existing; identical on V225): v219 S1 moves 116 builds and S4 9 on a 577-config lift lattice, so g219_d167_pairs misses real changes; S3 moves 0 (defective mutation); v205_d122_threerun_v204's own note says V204 only.
4. The other 79 gates pass on both versions by design; era-226 rows in edited gates were not re-run under assume by gatekeeper (builders 7a/7a2/7a3 ran stamp-swap discrimination).
