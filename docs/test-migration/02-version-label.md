# Group 2: version label and bug report

Phase 2 parity record (`docs/test-migration.md`, the parity rule). The legacy gate stays in `tests/gates/` and keeps
running in CI until phase 3 deletes the machinery; this file is what explains its rows when the manifest drops them.

- **Gate:** the four D236 rows of `g0.239.1_timer_label.js` (D236 P-SEMVERLABEL). Its three D235 rows are group 1
  (`01-rest-timer.md`); with both groups moved, every row of the gate is held.
- **New tests:** `tests/integration/version-label.test.js` (4 tests): the bug-report page label after boot and the
  report context `submitBug()` posts, on the body as shipped and on the body relabelled `239` and `v0.239.1` (a
  temporary copy with only its meta rewritten, removed after the run). The formatting rule alone stays in
  `tests/unit/version-label.test.js` (4 tests, phase 1).
- **Oracles:** the relabelled rows are strings typed by hand from the ruling. The as-shipped rows expect `v` plus the
  canonical MAJOR.MINOR.PATCH of the file's meta as `tests/semver.js` reads it, the gate's independent reader, so the
  test needs no edit when the next release moves the meta.
- **Version predicates:** every row carried a version conjunct (REFUSED below 0.239.1). The new tests assert today's
  behaviour only, so that conjunct is dropped from each row; it was never a row of its own.

## Rows

The gate's rows enter `tests/row_manifest.txt` from CI; these are the four it declares.

| Gate | Row | Held by (`tests/integration/version-label.test.js` ›) |
|---|---|---|
| `g0.239.1_timer_label.js` | `D236-label` | "the bug-report page shows BUILD and the version as shipped, in semver" |
| `g0.239.1_timer_label.js` | `D236-context` | "the bug report context carries exactly one build line with the version as shipped" |
| `g0.239.1_timer_label.js` | `D236-legacy` | "a pre-semver meta 239 reads BUILD v0.239.0 and build: v0.239.0, never v239" |
| `g0.239.1_timer_label.js` | `D236-vprefix` | "a meta written with a leading v reads BUILD v0.239.1 and build: v0.239.1, never vv" |

**Totals:** 4 rows; 4 mapped, 0 dropped.

## Mutations

Every D236 mutation naming the gate, applied once to a scratch copy of `index.html` (each anchor occurs exactly once),
with `IA_APP=<copy> node --test tests/integration/version-label.test.js`:

| Mutation (`tests/sabotage/v0.239.1.json`) | Caught by |
|---|---|
| S4 the page label prints the raw meta after a v | the `239` and `v0.239.1` relabel tests |
| S5 the report context prints the raw meta after a v | the `239` and `v0.239.1` relabel tests |
| S6 the helper drops the legacy rule (239 prints v239) | the `239` relabel test (and two unit tests) |
| S7 the helper keeps a leading v (prints vv0.239.1) | the `v0.239.1` relabel test (and two unit tests) |

**4 of 4 caught.** S4 and S5 cannot be seen on the body as shipped (its meta is already dotted, so the raw meta after a
v prints the same string); the relabelled bodies are what catch them, as in the gate.

## The release before the ruling

`IA_APP=<V239 body> node --test tests/integration/version-label.test.js`: all four tests fail (V239 prints `BUILD v239`
and `build: v239`).
