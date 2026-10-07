# Post-V233 measure mR: row status lines, before-picture (no build)

MODE B. Question: does gate.sh guarantee one status line per declared row today, and what would a declare/check slice have to convert?
Script: tests/measure/v233_row_status.js <gatesDir> <outputsDir> <harness.js>. Static half: 97 tests/gates/*.js, comments stripped,
from a snapshot taken at start (builders R9/A1/C1 were editing 9 gates; their files may have moved since). Empirical half: the 97
per-gate outputs of one V233 run (scratchpad measure_E/R0/R0__<gate>.out). Oracle: the printed text and each gate's own summary line.
No gate was run by this pass.

## gate.sh today
Per gate it reads only: output non-empty, `^PASS n FAIL n` present, FAIL count, `^REFUSED` count. No per-row check, no SKIP / SCOPED OUT
handling, no declared-row count. 137 SKIP lines (35/97 gates), 37 SCOPED OUT lines (4/97), 2 `SKIP …: RETIRED` lines (g199) all pass silently.

## Q1 declaration
- Row-label map keyed by id (`const R = { id: 'label' }`, used as ok(R[key]) / row('id', …)): 27/97 gates, 293 declared ids
  (script flags 28; g193_gear_gates' map is equipment names, not rows). No gate has a bare id array (ROW_ORDER exists only beside a map).
- Ad hoc: 70/97. 24 label every call with a literal; 44 build some labels at runtime; 26 call ok inside a loop.
- Any decl: ok/row inside loops in 38/97 gates (149 sites): row count is data-dependent there.
- Call sites 1,934: 1,392 literal label, 71 map-keyed. No printed manifest in any gate.

## Q2 status-line formats (helper source; output V233)
- `PASS label` / `FAIL label` col 0: 65 gates (2,004 PASS lines in 62 outputs).
- `  ok   label` / `  FAIL label` indented: 12 gates. `ok   label` / `FAIL label` col 0: 7 (+ g000_boot via check()). `ok` only if a msg is passed: 5 (g193_*). `pass  label` lowercase: g191.
- Silent pass (counter++ only, nothing printed): 6 gates, 583 passing rows printed as nothing: g192_labelsync 26, g192_shoulder_side 29,
  g193_pool_overlay 223, g194_implement_and_range 19, g205_d129_tiebreak 111, g195_wildcard 175 of 298.
- Conjunct sub-lines (`key name ok|FAIL :: …`) under one PASS row: 8 gates, 233 lines (g231 x6, g232, g233): one row over several lines,
  the sub-lines carry `ok`/`FAIL` words.
- One id, several status lines: [NY]/[UTC] reruns in g223_d182, g223_d183, g223_d184 (57 ids print twice); same `row <id>` printed twice
  (SKIP + PASS or two PASS) in g229_d193_build, g229_d194_lens, g230_d194_lens2.
- 29 lines in 10 gates carry a second status word in prose (`SKIP I2c: RETIRED …`); no confirmed several-rows-on-one-line case.
- Other tags: INFO 50 lines / 8 gates, N/A 7 / g193_budget_floor, REFUSED 0, DEFER 0.
- Id parse: 2,743/3,492 status lines open with an id-like token; 45/97 gates do on every line; 12/97 on none; 39/97 repeat a leading token (loops).

## Q3 silent skips (static, approximate; categories by guard text)
- ok() inside a bare if, no else: 133 sites / 55 gates. Of these: 48 sites / 34 gates are the refusal/fail branch (prints FAIL, not silent);
  43 sites / 22 gates data/config guard; 38 sites / 7 gates setup/crash guard (g203 `if(!SKIP){…}` wraps 28 rows; g231 x5, g232);
  4 sites / 2 gates version guard (g204_clock_limb, g209_d140_tier).
- Loop body with continue + row call: 38 loops / 13 gates.
- process.exit before the last row call: 69 sites / 50 gates; 12 with no print in the 600 chars before (exit 0: 6, exit 2: 6).
- Top-level-IIFE return before the last row: 51 sites / 10 gates.
- Declared map ids with no status line in the V233 output: 0/293 after hand check of the 10 the matcher flagged
  (g221 G4b/G4c print `SKIP G4b (pair)`; g230 d193-k/l, d194-postsweep print with padding; g193 map is not rows).

## Q4 shared helpers
- harness.js exports load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES, three MANNY digest tables. No ok/skip/summary/declare.
- 95/97 require harness.js (not g205_d129_tiebreak, g_fuzz_shard_equiv). 94/97 define their own ok/check; 17 their own summary; 19 own skipRow; 19 own row().
- Other shared modules: lattice193.js (3 gates), v200_g200_pins.js (1). tests/version_scope.js is a static lint run by gate.sh step 2b (0 SKIP/SCOPED logic).
- Reach of a harness-side declare(): 0 gates for free (none calls a shared ok). Reach of a gate.sh-side output check keyed on col-0
  `^(PASS|FAIL|SKIP|SCOPED OUT) `: 65 gates' format today; 27 gates already hold an id map a declare() could read.
