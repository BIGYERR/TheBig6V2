# Post-V239 semver pass: decision, contract and conversion rules

Tests-only pass, no build: `ia-version` does not move (index.html stays 239). Gatekeeper skipped for this pass by
Mario; the proof is the full suite run before and after the conversion, compared gate by gate and row by row.

## Decision (Mario, Post-V239, settled)
- Versions are `MAJOR.MINOR.PATCH`, stored and compared as three integers, everywhere: app meta, tests, tools, CI,
  app/ scripts, docs.
- Every build before this pass is **v0.N.0** (V239 = 0.239.0). Old tags, digest lines, era keys and file names stay
  as written; every reader takes a bare integer N as 0.N.0.
- From the next release on, Mario picks PATCH, MINOR or MAJOR each time (the session asks, with a recommendation).
  The pending rest-timer drag fix is a patch: 0.239.1. The queued rest sheet is a minor: 0.240.0. 1.0.0 is his call.
- A lagging deploy is reported, never a blocker (CLAUDE.md Session rhythm step 7).

## Inventory (measure, `post_v239_semver_inventory.out.txt`)
With a dotted meta and today's tooling: 101 of 102 gates not green (65 crash in harness.js:138, 36 FAIL), and 1
silently green; with the harness read widened, 7 gates go SILENT (`PASS 0 FAIL 0`, 298 rows dark). 92 of 103 gates
read the version: 78 hold ordered compares, 33 table lookups, 10 parse the meta themselves.

## Helper contract (`tests/semver.js`, `tests/semver.py`; slice 1)
`parse` (integer N or "N" or "VN" → 0.N.0 legacy; "M.m.p" or "vM.m.p"; ±Infinity sentinels; anything else throws),
`cmp(a, b)` → -1/0/1, `lookup(table, v)` exact match over keys parsed the same way, `fromHtml(html)`, `str(v)`
canonical, `bump(v, kind)`. A parsed value prints its input text when legacy (so gate output on a legacy artifact is
byte-identical) and throws on any numeric coercion (`<`, `>=`, unary `+`, `v - 1`), so a missed compare crashes
loudly. CLI: `meta <file>`, `cmp <a> <b>`, `str <v>`, `--selftest`; slice 2a adds `bump <v> <patch|minor|major>` and
`below <v>` (reads versions or tag names on stdin, one per line, prints the greatest one strictly below `<v>` exactly
as written, exit 1 when none).

## Gate conversion rules (slices 3A, 3B, 3C)
Load once per gate: `const SV = require(path.join(__dirname, '..', 'semver.js'));` (match the file's require style).
- R1 parse: every expression that turns the app version into a number (`+IA.version`, `+X.version`,
  `Number(IA.IA_VERSION)`, `parseInt(...)` of a version, a raw `X.version` later compared) becomes `SV.parse(...)`; a
  gate's own meta regex (`content="(\d+)"`) becomes `SV.fromHtml(html)`. Where the gate tolerated a missing meta
  (null → fallback), keep that tolerance explicitly; report each such site.
- R2 ordered compare: `A op B` with op in `< <= > >=` where either side is a version (a parsed value, an ERA or BASE
  constant, a table key, a range bound) becomes `SV.cmp(A, B) op 0`, operator and operand order kept.
- R3 equality: `A === B` / `A == B` on versions becomes `SV.cmp(A, B) === 0`; `!==` / `!=` becomes `!== 0`. A missed
  equality does NOT throw (it is silently false), so every `===` / `!==` near a version is checked by hand.
- R4 lookup: `T[v]` on a version-keyed table becomes `SV.lookup(T, v)`; `in` / `hasOwnProperty` on a version key
  becomes `SV.lookup(T, v) !== undefined`. Table definitions keep their integer keys.
- R5 ranges `{from, to}` / `upTo`: bounds compare per R2; an open upper bound written as a large literal (≥ 900)
  becomes `Infinity`; report each.
- R6 arithmetic on a parsed version is rewritten with `SV.cmp` or `SV.bump`; integer arithmetic on a legacy constant
  (`D183_ERA - 1`) stays. Report each.
- R7 displays stay as written (`'ia-version ' + VER`, `'V' + IA.version`).
- R8 era constants (`ERA = 2NN`) and table keys stay integers: they are legacy build numbers.
- R9 type checks on a version (`typeof`, `Number.isFinite`, `Number.isInteger`, `isNaN`) get an `SV.parse`-based
  check of the same meaning; report each.
- R10 nothing else changes: no row added, renamed or removed; no gate renamed; no era value changed; output on the
  239 artifact byte-identical.

## New names from 0.239.1 on
Tag `v0.239.1`; digest `- **v0.239.1** — Patch: …`; `tests/measure/v0.239.1_rulings/`; `tests/edits/v0.239.1_edit.py`;
`tests/sabotage/v0.239.1.json`; `tests/gates/g0.239.1_<topic>.js`; era rows keyed `'0.239.1'`; baselines
`base_v<previous>.html`. The previous version is the greatest tag strictly below the candidate (`semver.js below`),
never N-1.

## Proof (Mario: gatekeeper skipped, keep the before/after check)
1. BEFORE: `gate.sh` on a snapshot of origin/dev 2887fac (index.html 239, base V238), `IA_NO_RUNLOG=1`,
   `ROW_MANIFEST_OUT` written: per-gate `PASS n FAIL n` and the run's row manifest.
2. AFTER on the converted tree, same command: per-gate summaries and manifest identical to BEFORE.
3. AFTER on a copy relabelled `0.239.0` (`cand_v0.239.0.html`): identical to BEFORE once the version token maps back.
4. `semver.js --selftest`, `semver.py --selftest`, `tooling_selftest.sh`, then `node tools/check.mjs`, the app and
   backend tests and lint (Mario asked for tests and eslint), and CI on the pull request from dev into main.
