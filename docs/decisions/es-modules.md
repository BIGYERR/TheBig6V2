# ES modules: decisions

Architecture phase C (`docs/architecture-migration.md`): the app's JS source files become ES modules in place, and the
build strips the module syntax back out. Measure: `tests/measure/es-modules_module-graph.md`. Tests:
`frontends/app/test/integration/module-blocks.test.ts` (the blocks are current, every import names an export, no file
assigns an import), `tests/integration/engine-modules.test.ts` and `tests/sweeps/engine-modules.test.ts` (the engine,
imported from the sources with no page, builds what the page builds; its files import only each other).

These are tooling and code-layout decisions, not coaching rulings: none changes what a program prescribes, what a
screen shows or what is stored.

## Release scope: v0.239.2 carries phase C steps 2 and 3, a refactor with no change to behaviour

- **Date:** 2026-10-12. **Picked by:** Mario (PATCH v0.239.2, the recommended option). **Shipped:** v0.239.2.
- **Step 1 (no build, Post-v0.239.1):** every JS file gains generated import and export blocks that the build strips;
  `index.html` byte for byte unchanged.
- **Step 2:** the 18 top-level `let`s another file assigns each get a setter beside their declaration
  (`function _setActiveProg(v){ activeProg=v; }`), and the 61 assignments from other files call it
  (`activeProg=refreshProgram(p);` becomes `_setActiveProg(refreshProgram(p));`). Same file writes are unchanged.
- **Step 3:** the 27 engine names that lived in mostly-UI files move into engine files, five of them new (`icons`,
  `calendar`, `clock-format`, `exercise-kinds`, `swap-prefs`), and `auxSwapCandidates` moves from `region-caps` to
  `swaps-edits`. Functions move freely (declarations are hoisted); constants only move earlier in the build order, and
  none of them depends on anything, so the measure finds 0 load-order hazards before and after.
- **Changes in `index.html`, every hunk of one of three classes:** a setter definition, a call of a setter where an
  assignment stood, or a declaration (with its own comments) moved between files; plus the version meta.
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, are
  unchanged); any screen (the e2e's app screens compared pixel for pixel with the run before); any stored key or value.
