# Version label: decisions

How the app shows its own version: `iaVersionLabel` (next to `IA_VERSION` in `index.html`), used by the bug-report
page (`BUILD v0.239.1`) and the bug-report context (`build: v0.239.1`). Tests: `tests/unit/version-label.test.js` (the helper alone) and
`tests/integration/version-label.test.js` (the page and the context, on the shipped meta and on bodies relabelled `239`
and `v0.239.1`).

## D236 P-SEMVERLABEL: the app shows its version in semver everywhere

- **Date:** 2026-10-11. **Ruled by:** Mario (not a coaching question). **Shipped:** v0.239.1 (PATCH).
- **Finding:** the bug-report page printed `'BUILD v'+IA_VERSION` and the report context `'build: v'+IA_VERSION`, the
  raw meta, so a meta of `239` read `v239`, a bare integer.
- **Changes:** one helper prints `v` plus the canonical `MAJOR.MINOR.PATCH`. A pre-semver integer N reads `0.N.0`
  (`239` prints `v0.239.0`). One leading `v` or `V` is dropped first, so the label never reads `vv`. Anything else
  prints as given after one `v`, so the label never throws. Both labels use it. The meta became `0.239.1`.
- **Does not change:** the update check (`IA_VERSION` stays the raw meta it compares); every other string; program
  output.
- **Expected values:** `239` gives `v0.239.0`; `0.239.1`, `v0.239.1` and `V0.239.1` give `v0.239.1`; `junk` gives
  `vjunk`.
- **Source:** `tests/measure/v0.239.1_rulings/v0.239.1_ruling_d235_d236.md`.
