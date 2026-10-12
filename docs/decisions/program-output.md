# Program output: decisions

What `buildProgram` prescribes, held as one golden file: `tests/snapshots/program-output.json` (HALF_MANNY, Mario's
live program, and nine seeded configs; the digest and the week grid of each), checked by
`tests/integration/program-output.test.js`. A ruling that moves program output adds an entry here, and the release
that ships it regenerates the snapshot (`UPDATE_SNAPSHOTS=1`) so its git diff shows what moved. When HALF_MANNY moves,
the new digest is the one coach printed before the build (standing ruling 5).

Every move before this file is in the handoff (§11f) and in the comments of `MANNY_DIGEST_BY_VERSION`
(`tests/harness.js`). The last one: D195 P-HIPEXT Amendment 2 (V231) moved HALF_MANNY from `0ac7da6b1691a8e1` to
`2d35e8f743680cfa`, the twelve Tuesdays gaining `Single-leg hip thrust 2×6–10 each @ RPE 7` in the runner armor
circuit.

## The golden file replaces the per-release digest tables for new work

- **Date:** 2026-10-11. **Ruled by:** Mario ("yes approve the plan", the test migration). **D-code:** none (tooling).
  **Shipped:** Post-v0.239.1, no release of its own.
- **Changes:** program output is pinned by one current golden file in git instead of a row per release. The legacy
  tables (`MANNY_DIGEST_BY_VERSION` and its two counterfactual twins) keep their era rows while the legacy suite runs
  (`docs/test-migration.md`).
- **Does not change:** program output. HALF_MANNY reads `2d35e8f743680cfa`, 14 weeks, seed 76308, as it has since
  V231.
