# The engine in TypeScript: decisions

Architecture phase D (`docs/architecture-migration.md` §3): the app's engine, the 17 files `buildProgram` reaches
(phase C step 3), moves into `@ia/core` as strict TypeScript, `core/src/engine/<name>.ts`, a group of files at a time
in the order their imports allow. Each moved file is still a piece of the app's page: `order.json` names it
`engine/<name>.ts`, and `frontends/app/scripts/build-index.mjs` strips its types with Node's own stripper (strip mode:
a space for every character of a type, nothing else touched). Tests: `frontends/app/test/integration/build-index.test.ts`
(an engine piece builds with its types stripped in place) and `module-blocks.test.ts` (an import names a source file by
its path; an engine file never imports the app); `tests/integration/engine-modules.test.ts` and
`tests/sweeps/engine-modules.test.ts` (the engine, imported from `core/` and the app's sources with no page, builds
what the page builds, and its files import only each other); the type check of `core/tsconfig.engine.json`.

These are tooling and code-layout decisions, not coaching rulings: none changes what a program prescribes, what a
screen shows or what is stored.

## The move writes types and never changes code (Post-v0.239.2)

- **Date:** 2026-10-12. **Decided by:** the session, inside Mario's standing answer for the migration ("PATCH each, in
  order": every behaviour-identical step that changes `index.html` ships as the next PATCH).
- **The rule:** a moved file gains types and nothing else. A parameter, a return, a constant, a table gets its type;
  where strict TypeScript would need the code itself changed (a guard, a cast that needs parentheses, a duplicate key
  removed), the type is written so the code stays as it ran (`const f: (r: string) => number = r => ...` rather than
  `(r: string): number => ...`, which adds two parentheses), or the line carries `@ts-expect-error` and its reason.
- **The proof:** `node tools/same-script.mjs <previous page> <this page>`. The page outside its script must be byte for
  byte the same but for `ia-version`; the inline script must be the same JavaScript tokens, in order. Whitespace is free
  (the stripped types), and comments are listed, never judged (a comment never runs). Because the tokens are equal, the
  release cannot change behaviour, and every hunk of `git diff` on `index.html` is whitespace, a comment or the version.
- **Why not reprint the code** (TypeScript's emit, esbuild): a reprinted page differs in every function, so no hunk could
  be classified by eye, and the tests that read the page's text (static scans, source-surgery variants) would all move
  at once. Stripping in place keeps every token where it was.
- **The engine's type check** is its own project (`core/tsconfig.engine.json`): strict, framework-free (no DOM, no Node
  types), but without `noUncheckedIndexedAccess`, which would need a guard or a `!` at every index read of code written
  without one. The tightening, and every `@ts-expect-error`, is the cleanup pass after the move, made under the tests
  with ordinary proof, not under the token proof.
- **The tests that read the page's text** match a declaration with whitespace allowed before its `=` (a type annotation
  strips to spaces there): `tests/support/pop-ups.ts` (the icon tables and its anchors) and
  `tests/integration/equipment-tiers.test.ts` (`_REP_FLOOR`).

## Release scope: v0.239.3 moves the engine's nine leaf files

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.3.
- **Moved:** `icons`, `exercise-library`, `calendar`, `clock-format`, `prehab`, `region-caps`, `power-accessory`,
  `exercise-kinds`, `injury`: every engine file that imports no engine file outside this group. Each is
  `core/src/engine/<name>.ts`, typed: the domain types (`Cfg`, `Section`, `Item`, `Cardio`, `Equipment`, `Experience`,
  `Injury`, `DayKey`) at the boundaries, and the engine's own types beside the code that owns them (`Region`, `Pattern`,
  `AuxFamily`, `RepWindow` in `region-caps`; `StationClass`, `ExWeightRow` in `exercise-library`; `InjuryPlan` in
  `injury`). Two additions to `@ia/core`'s domain: `WeekGrid` (the weeks as the engine's passes walk them, by plain
  string keys) and `Section.type` (a legacy `'superset'` the engine and the screens read and nothing writes today).
- **One `@ts-expect-error`:** `prehab`'s `_BW_SUBS` writes `'Kettlebell swing':'Jump squats'` twice. The second is dead
  (same key, same value, and the key keeps its first place); its removal is the cleanup pass's.
- **Changes in `index.html`:** whitespace where the types were, 9 comments added (8 type docs and the directive), the
  version meta. `same-script`: 164,255 tokens equal, in order, against v0.239.2.
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, unchanged);
  any screen; any stored key or value.
