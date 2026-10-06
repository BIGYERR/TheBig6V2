# Post-V233 measure T: tooling inventory for the approved pass (era rows, brittle pins, g193 crash), 2026-10-05

MODE B (before-picture). Read-only. Script `tests/measure/v233_tooling_inventory.js` (kept); outputs in the session
scratchpad `measure_T2/` (era_tables.out, exact_predicates.out, throws.out, source_sites.out, source_assertions.out,
literal_digests.out, files_per_build.out, g193_stamp234.out, g193_ctrl233.out). Evidence base: mH
(`tests/measure/v232_rulings/measure_gate_history_mH.md`) classes A/B/C. Oracle: git diffs between release tags
V223..V233, the gate source, one node run of g193. No gate suite, no sweep was run.

## 1. ERA ROWS (exact-version tables that take a row on every build)

Scan: every identifier in tests/harness.js + 98 tests/gates/*.js with `ID[2xx] =` rows or a `{2xx:` declaration (14 found).
11 are row-per-version; 3 are not (g217 below). Edits counted from `git diff V<n-1> V<n>` adding `ID[n] =`.

| file:decl | symbol | [233] row | absent-row behaviour | edited V224–V233 |
|---|---|---|---|---|
| harness.js:218 | MANNY_DIGEST_BY_VERSION | :377 `= [232]` | 35 gate files index it (comment-stripped count): each FAILs by name ("NO ROW"/"ABSENT"), none throws (g197a:358, g198:222, g199:514, g200_core:153, g200_pull:331, g203_mile_pencil:408, g204:544, g207_*/g208_*/g209–g216 HM/M1/Q7/K5/D9, g222:418, g223, g226 G10, g227 c-MANNY, g228, g229, g231 a-era/d-era, g233 u-manny-row) | 10/10 |
| harness.js:270 | MANNY_DELOAD_OFF_DIGEST_BY_VERSION | :399 `= [232]` | g199:515 B2 FAIL by name | 10/10 |
| harness.js:314 | MANNY_CORE_OFF_DIGEST_BY_VERSION | :421 `= [232]` | g200_core:151 F1a FAIL by name | 10/10 |
| g193_samecard.js:306 | OPEN_UNRULED_BY_VERSION | :321 `= [232]` | **THROWS** at :323, no PASS/FAIL summary (crash) | 10/10 |
| g197b_sweep.js:215 | HF_LEAK_BY_VERSION | :239 `= [232]` | B4i–B4l FAIL by name (`!!HF_LEAK &&`, :263 "NO ERA ROW") | 10/10 |
| g197b_sweep.js:242 | B5C_BY_VERSION | :257 `= [232]` | B5c FAIL (:258) | 10/10 |
| g199_deload_arbitration.js:58 | DELOAD_ARB_BY_VERSION | :182 `= [232]` | C1 C3 C5 D2 I3 FAIL (`!!ERA&&`, :535 NOROW) | 10/10 |
| g199_deload_arbitration.js:116 | E6_BY_VERSION | :192 `= [232]` | E6 FAIL (`E6_ROW!==undefined&&`, :566) | 10/10 |
| g199_deload_arbitration.js:130 | DELOAD_HINGE_BY_VERSION | :202 `= [232]` | E1a E1b E2 E3 G1 G2 G5 FAIL (`!!HROW&&`, :556) | 10/10 |
| g200_pull_arbitration.js:290 | SWAP_BY_VERSION | :305 `= [232]` | P2c P2d P4 P6 P7 FAIL (`SWAP_N!==undefined&&`) | 10/10 |
| g219_samecard_draws.js:133 | ERA | :154 `= [232]` | F1 F2 R1–R8 FAIL (`!!ROW &&`, :164 noRow) | 10/10 |

Nothing-moved row shape at 233, every table: `T[233] = T[232];   // V233 (<D-codes>): ruled UNMOVED, reference to [232]; <ruling path + quote>`.
Lookup idiom, every gate table: `T[(+VER <= FLOOR) ? FLOOR : +VER]` (floors 209/218/208/210/218/218), harness tables `T[IA.version]`.
Exactly 6 files were edited in all 10 builds V224–V233: harness.js, g193, g197b, g199, g200_pull, g219 (next highest: 4/10).

Not row-per-version (no edit on a nothing-moved build, measured): g217 D160_MULTI/SAMEDAY_TWIN/FWD_MAIN (:105/:110/:112,
pair-scoped `PAIR_SCOPE = VER <= 218` :117; 0/10 edits); g204 CLK_CALLS_BY_ERA (:517, range rows, last `to: Infinity`);
g197d E5 (:391–394, `<` predicates, newest era falls through); g232/g233 `VER >= ERA` licences and `VER !== ERA` pair skips;
32 exact `=== 2xx` predicate lines, all baseline-version selectors or pair-scoped skips. The V233 stamp dry run
(`gatekeeper_dryrun.md`) found the same 11 and only 11 (70 FAIL rows + 1 crash, all bookkeeping).

V233 bookkeeping: e1 (`tests/edits/v233_e1_era_harness_g193.py`) = 3 harness MANNY tables + g193 OPEN_UNRULED (4 rows);
e2 = g197b HF_LEAK, B5C + g200_pull SWAP + g219 ERA (4 rows); e3 = g199 DELOAD_ARB, E6, DELOAD_HINGE (3 rows).
11 rows, 6 files: equal to the static scan and to the dry run. Complete. Each script carries ~280–300 lines of refusals
and printed both-tree figures for 11 one-line reference rows.

## 2. BRITTLE PINS (assertions over index.html source text or position)

Counts (heuristic, comments stripped; over-counts, e.g. g195's 21 hits are rendered detail HTML, not source):
source-text read sites 186 lines (131 `src.indexOf/match/split…`, 42 `.test(src)`, 10 `.toString()`, 3 extractInlineJS) in
49/98 gates; assertion statements naming a source-derived identifier 157 of 1,683 in 40 gates, of which 15 sit in
copy-lexer gates; positional (line index) 1 site (g224, 5 rows via forEach). 16-hex literal digest lines in tests: 74
(harness 15; g231_d197 20, g231_d195 18).

Class-B detail (claim | red with no behaviour change | output that carries the same claim):
- g197d_d84_base.js:385–400 E5: sha256 of the capSessionBudget source slice ('function capSessionBudget(' to
  '\nfunction capRegionalFatigue') equals an era constant; :416 _itemCost/_setCount byte-identical to baseline (slice ends at
  a comment marker). Claim: budget machinery unedited. Red V198, V199 x2 (the _isPost alias; a declaration placed inside the
  slice), V231 pre. Carrier: the budget's effect on built cards (per-card set totals vs cap; g193_budget_floor's census reads it).
- g204_clock_limb.js:517–529 C8 (+:491 one surviving `Math.round(x % 60)`): count of `_clkMS` call sites in source via
  tests/measure/v204_idiom_census.js, range table 11/13/16/27/26. Red V207 (+2 sites), V223 (+11 sites). Carrier: rendered
  clock strings (no `:60`, hand-formatted values), which C1–C7 already assert by value.
- g203 (V206, "a case-sensitive g203 matcher"; the record does not name the row): source `IA.html.indexOf` pins at
  g203_ceiling_and_anchor.js:58–61, :203 ('Do not run faster than ', 'Average no faster than ', `a.kind === 'edited' && a.from`)
  and g203_mile_pencil.js:171–172 (LOCK_BODY, COMMIT_TOAST). Carrier: the built card's `detail` text (:184 already reads it) and
  the rendered lock body (:221 reads it).
- g208_d103a_readers.js:221 E3: NOT a source pin. It compares engine output (easy-mode vs keyed eve); it went red at V214
  because its premise was unscoped, fixed by an ERA214 predicate (:206). Its source dependency is :130–135 (subtype-line
  anchor rewrite).
- g217_d160_dedupe_view.js:129–142: rename-writer source anchor REN must count 1 before instrumentation; mismatch -> err.
  Red V219 pre (record names the gate only). Carrier: the deduped card itself (section names/labels after build).
- g224_d185_wctoday.js:84–100: `lines[642..646]` equal the V224 CSS block. Red V232 (6 CSS lines inserted at :335).
  Already scoped <=231 with content-located successors 1b (:103+). Carrier: computed style of the today cell's .wc-mark (DOM).
- Digest pins (V200): five literals in four files, converted at V200 into MANNY_DIGEST_BY_VERSION, which is now table 1 above.
- g199_deload_arbitration.js:488–490 / g200_pull_arbitration.js:282–284 A1: the week-assembly instrumentation anchor
  `pipeFor(RAW)[0]` must occur once in source, else REFUSED A2–J3 / A2–P4. Red V231 pre (week assembly edited). Carrier:
  none today; p1/p2/p3 stage values exist only by source injection (no engine hook exposes them).
- 17 literal HALF_MANNY pins (V231 pre): moved to era-table reads at V231. Remaining literals of 2d35e8f743680cfa: 4 lines,
  harness:375 (the table), g231_d195:149, g231_d196:119, g233:107; the three gate ones are build-pair rows (g233 u-manny sits
  inside the `VER !== ERA` skip at :458; both g231 gates PASSed the 233 stamp).

Source scans that ARE the claim (not brittle): the copy-lexer gates g206_d109_copy, g220_d173_recovbanner, g220_d174_emoji,
g221_d178_active, g223_d183_safepace, g223_d184_testlen, g225_d187_pacerate, g226_d188_beginnermile, g231_d197_filterlast
(string-literal tokenizers over athlete-facing copy: dashes, emoji, "Nike"), 15 assertion statements by the heuristic.

## 3. g193 CRASH

Throw site: tests/gates/g193_samecard.js:323
`if (!OPEN_UNRULED) throw new Error('g193: no OPEN_UNRULED_BY_VERSION row for V' + IA.version + ': an unruled register (D133)');`
Trigger, proved: index.html copied to scratch with ia-version 233 -> 234 (anchor count 1), so `[234]` is absent.
`node tests/gates/g193_samecard.js stamp_v234.html`: exit 1, 32 `ok` rows printed, then `Error ... row for V234` at :323:26,
no `PASS n FAIL n` line (gate.sh:80 then reports "printed no PASS/FAIL summary (crash?)" and stops). Control on index.html
(233): exit 0, PASS 53 FAIL 0. The rows after :323 (G2a/G3a debt register, etc.) never run on a missing row.

Same throw-instead-of-FAIL on an era table: none. All 10 other gate tables and the MANNY reader gates guard with
`!!ROW&&` / `!== undefined` / hasOwnProperty and FAIL by name.
Same shape on a SOURCE anchor (not era): g205_d129_tiebreak.js:50–62 `grab()` throws 'not found'/'unbalanced', called at :92
with no enclosing try; g205_d130_typed.js:125–135 same, called at :137 with no try. Guarded: g205_d125_spaced (catch :164),
g208_d103a_readers:134 (try :133), g219_d167_pairs:218–228 (catch :231/:233). Hand-oracle throws g221_d177:219 and
g230_d194_lens2:237 ('no hand cap row') fire on a missing hand-table row, not a version.

## UNKNOWN
- Which g203 row went red at V206 and which g217 assertion at V219 (record names the gate, not the row).
- Whether g205_d129/d130 grab() throws have ever fired (no recorded red); not run.
- The 157 / 49-gate source counts are a regex heuristic, not hand-classified per assertion; the class-B list is hand-read.
- Wall-time cost of the 11 rows per build (script length only; timing is the other measure's job).
