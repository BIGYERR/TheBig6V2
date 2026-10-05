# V231 gatekeeper run 2 — GREEN (saved by the main session)

Scoped re-proof after D194 Amendment 5 (`d194_amendment5_s32.md`). Scratch `gatekeeper2/`. Candidate unchanged: sha256
1b403743f8ad1b16, ia-version 231 (byte-identical to run 1). Changes since run 1: `tests/gates/g231_d194a4_lateplan.js` (new),
`tests/sabotage/v230_d194.json` (S32 `gate`/`note`), `tests/gates/g230_d194_lens2.js` (one SKIP sentence),
`tests/edits/v231_a5_lateplan_s32.py`.

```
GATE     gate.sh on candidate: ALL GATES PASS, 95/95 gates FAIL 0
         g231_d194a4_lateplan: candidate PASS 5 FAIL 0 | V230 PASS 5 FAIL 0 | S32 mutant PASS 1 FAIL 4 | V229 REFUSED, PASS 0 FAIL 5
SABOTAGE tripped=598 survived=4 not_applied=7 crash=0 of 609 (1 spec re-run in full, 80 carried by triple)
BLAST    carried from run 1 (candidate sha unchanged): 15 hunks, +19/-13, unclassified 0; 10,030 configs / 51,620 ops, OUTSIDE 0
FUZZ     carried from run 1: 600 configs, self-equal 600/600 on both trees, 0 violations
VERDICT  GREEN
```
- v230_d194.json re-run: S22 9/5, S28 4/10, S29 4/10, S30 7/7, S31 7/7 (== run 1), S32 on g231_d194a4_lateplan PASS 1 FAIL 4
  (a4-dedupe 18, a4-nojumps 26, a4-cards 0/3 by behavior; a4-ctl anchor absent). Carried 80 specs: 592/4/7/0 of 603 (triples
  in `gatekeeper2/triples.out`; mtimes before run 1's sweep; only tracked-gate content change is the g230 SKIP line, named by
  no carried spec). Survivors = documented debt (v205_d122_threerun_v204 S4; v219 S1-D167, S3-D171, S4-D167); not-applied =
  documented set (example, v193_samecard, v195, v197, v200 ×2, v201).
- Independent digests (gates' own methods): deload-off 145c60296526a949 (V230 1069cd7f86eed204); core-off 5770a4b1c4e2404d
  (V230 9d14801a63111081); PRT TING 1119727db3f37832 (V230 3a053a2ac8cb2b44); HALF_MANNY 2d35e8f743680cfa (V230 0ac7da6b1691a8e1).
- New gate standing-rule check: oracles typed (8-name jump list, nojumps {knee, ankle}, hand plan, T1–T3); `applyInjuryFilter`
  only inside the S32 literal texts; `_dayPlanCfg` INFO only; no `VER === 231`; temp copy removed. Pre-existing: some gate
  leaves `g198_instr_<pid>.html` in TMPDIR (cleanup gap, not V231).
- UNFINISHED (does not affect the verdict): session call 13's direct claim (61 g229_d194 FIX lists on card-identical days all
  bodyweight lowback) — dump copy built (`gatekeeper2/g229_dump.js`), run not executed (macOS has no `timeout`). Indirect
  evidence: universe changes V230 → CF only on bodyweight lowback programs (214 of 10,030; 0 elsewhere).
