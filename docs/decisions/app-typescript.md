# The app's own files in TypeScript: decisions

Architecture phase E's logic move (`docs/architecture-migration.md`, phase E, "Left for phase E's done when"): every
screen is an Angular component, but the logic under them is still the 23 JavaScript files of
`frontends/app/src/legacy/src/js/`, reached through `LegacyBridge` by name. Before a bridge call can become a typed
import, the file it reaches must be TypeScript. Each file turns TypeScript where it lies (`js/<name>.ts`), still a piece
of the page, by the phase D method (`docs/decisions/engine-typescript.md`): types are written onto the code as it ran,
and the page is proved to carry the same JavaScript tokens.

These are tooling and code-layout decisions, not coaching rulings: none changes what a program prescribes, what a
screen shows or what is stored.

## In place, marked, the same tokens (v0.239.43)

- **Date:** 2026-10-12. **Decided by:** the session, inside Mario's standing answer for the migration ("PATCH each, in
  order"). **Shipped:** v0.239.43.
- **Where:** an app file stays in `js/`, renamed `js/<name>.ts` (`git mv`, so its history follows), and `order.json`
  names it so; it keeps its place in the build. It does not move to `core/`: the engine is framework-free and imports
  only itself, and these files read the DOM, `localStorage` and the Angular components' takeovers. `build-index.mjs`
  accepts a `.ts` piece in `js/`, strips its module blocks and then its types as for an engine file, and
  `module-blocks.mjs` writes each importer's path to it (`./rest-day-shell.ts`).
- **The type check:** `frontends/app/tsconfig.legacy.json`, strict with `noImplicitAny` on (off, TypeScript infers an
  empty array or `null` as its first value's type and the engine's files fail), the DOM's types, no Node's, over
  `src/legacy/src/js/*.ts` and what they import; the app's `npm run typecheck` runs it after `tsconfig.node.json`, so the
  60-second check and CI hold it. `tsconfig.app.json` excludes the sources: the Angular build reaches them only through
  `public/legacy/legacy.js`.
- **Marked, not fixed:** `node tools/ts-expect.mjs <name>` makes a file check clean without changing a token. A
  parameter or a variable that is `any` only because nothing typed it (TS7006, TS7034) is typed `any` (`any[]` for a
  rest parameter or an empty array) where it is declared, an annotation the build strips; on an arrow's lone parameter
  (`p => ...`), where a type needs parentheses, which are tokens, it gets a marker instead. Every other error gets a
  `// @ts-expect-error TS<code> <message>` line above it, which `build-index.mjs` strips with the types (a comment line
  the page never carried), so the type debt is listed in the code where it lies, by its own error. An error on a line
  inside a template literal that spans lines cannot carry a marker (the comment would be text in the string), and a name
  imported untyped from a file still JavaScript has to be typed where it is declared: the tool stops on either and names
  it. `node tools/engine-move.mjs js/<name> <ref>` then sets the blanks so the page reads the text it read at `<ref>`.
- **Why markers and not fixes:** a fix changes tokens (a guard, a cast, a `!`), so it cannot be proved by
  `tools/same-script.mjs` and would need its own behaviour proof, file by file. The move stays behaviour-identical by
  construction; the markers are the cleanup pass's list, worked off under the tests with ordinary proof, as phase D left
  the engine's.
- **The proof:** `node tools/same-script.mjs <previous page> <this page>`: the same 164,293 tokens, the same line breaks,
  the same 6,355 comments, the rest of the page the same but for `ia-version`. `git diff index.html` is the version
  line alone.
- **First three files (v0.239.43):** `rest-day-shell` (22 marker lines, 42 `any`s, the most-imported file, which every
  other file's import block now names as `.ts`), `update-check` (1 marker, 1 `any`) and `bug-report-init` (6 markers).
  The 29 markers by error: TS2339 (a property a type does not declare) 8, TS7053 (an index a type does not declare) 7,
  TS7006 (a lone arrow parameter) 5, TS2538 3, TS2531 3, TS18047 2, TS2367 1.
- **Tests:** `frontends/app/test/integration/build-index.test.ts` gains a fixture: an app file turned TypeScript in
  place builds with its types and marker lines stripped, byte for byte the JavaScript it was (27); the independent
  builder in that file strips marker lines too. The legacy type check is `npm run typecheck`. The six local comparisons
  and the Docker e2e ran on the release.
- **Does not change:** the page (only its version meta); the Angular build's behaviour (its bundle is built from the
  same JavaScript); any program; any stored key or value.

## Every app file is TypeScript (v0.239.44)

- **Date:** 2026-10-12. **Decided by:** the session, inside Mario's standing answer ("PATCH each, in order"); the batch
  size is the session's (one release for the remaining 20 files rather than ten, since every file gets the same proof).
  **Shipped:** v0.239.44.
- **Moved:** the other 20 files of `js/` (`storage`, `rest-timer`, `wizard`, `wizard-generate`, `programs`,
  `program-manage`, `overlays`, `swaps-edits`, `swap-sheet`, `random-wildcard`, `week-view-sections`, `set-logging`,
  `log-entries`, `wheel-log`, `day-detail`, `day-status`, `progress-data`, `progress-charts`,
  `lift-ledger-progress-screen`, `popups-streaks-reminders`). Every app file is TypeScript; the legacy type check covers
  all 23 and the engine's 17.
- **`tools/ts-expect.mjs` learned four types it writes instead of a marker,** each an annotation the build strips:
  - a name another file imports untyped (TS7034 on the import line: `let currentDayKey=null`) is typed `any` where it is
    declared, when that file is TypeScript already;
  - a parameter some call leaves out (TS2554, "Expected 5 arguments, but got 3": JavaScript passes `undefined`, and the
    legacy code relies on it) is typed optional where the function is declared (`b?: any`), from the first one the call
    leaves out;
  - a lookup table indexed by a key TypeScript cannot check against it, inside a template literal (TS7053), is typed
    `Record<string, string>` (`Record<string, any>` when its values are not all strings) where it is declared;
  - a marker that no longer marks an error (TS2578, because a file it reads gained types) is deleted, a comment line.
- **Typed by hand,** where an error sat inside a template literal that spans lines and the tool could not reach it: five
  inline lookup tables cast where they are read (`({sun:'Su',...} as Record<string, string>)[d]`, a cast the build
  strips), and `RPE_LABELS`, `CARDIO_GOALS_BY_TYPE` (`any[]` values), `WD` (`{ restDays: any[]; [k: string]: any }`),
  `points`, `trainDays`, `_t` and `cd` typed where they are declared.
- **The debt:** 629 marker lines across the 23 files. By error: TS7006 160 (an arrow's lone parameter, `p=>`, which
  cannot take a type without adding parentheses), TS7053 139, TS2339 117, TS18047 81, TS2554 43, TS2531 36, TS18046 19,
  TS2538 12, TS2362 7, TS2345 5, TS2322 5, TS7031 1. 884 names typed `any` (40 of them `any[]`), 19 parameters
  optional, 13 tables typed `Record<string, ...>`, 5 casts.
- **The proof:** `tools/same-script.mjs` against v0.239.43: the same 164,293 tokens and 6,355 comments, the page's
  diff the version line. The Angular build bundles the same files with esbuild; its legacy bundle, built unminified
  from v0.239.43's sources and from these, is the same 191,916 tokens (comments aside, and each piece's name in the
  entry's list, `.js` against `.ts`). The six local comparisons matched (119 states) and the e2e ran 69/69 at 0 px.
- **Does not change:** the page (only its version meta); the Angular build's behaviour; any program; any stored key or
  value.

## The bridge typed from the legacy sources (Post-v0.239.44, no build)

- **Date:** 2026-10-12. **Decided by:** the session (tooling and code layout; Mario's standing answer covers the order).
  **Shipped:** no version: the page is byte for byte v0.239.44's, and the Angular build runs the same program (below),
  so nothing new reaches a phone (standing ruling 1, applied to a pass that changes types only).
- **What:** `scripts/legacy-bundle.mjs`'s new `legacyTypes()` asks TypeScript for the declarations of every code piece,
  each seen as the bundle sees it (every top-level name exported, in memory; nothing is written beside the sources), and
  writes them with `npm run sync` into `src/legacy/generated/types/` (generated, ignored by git), with
  `legacy-api.d.ts`: `LegacyApi`, each top-level name typed as the file the bridge resolves it to declares it (the later
  file where two do: `_isoToday` is overlays'), and `LegacyWritable`, the `let`s and `var`s. `LegacyBridge` takes only
  those names: `call(name, ...args)` checks the arguments and types the result from the source, `global(name)` returns
  the declared type (a browser global, `window`, still resolves), `set` takes only a `let` or `var` and a value of its
  type, and `provide` only a function and a replacement of the same type. The components' template wrappers
  (`call(name, ...args)`, eleven of them) take the same types, so Angular's strict templates check every template call.
- **What it found,** each fixed by a type, never by code: 242 type arguments at call sites (`call<string>('asyIcon', …)`)
  were the components' unchecked guesses and are gone, the source's types in their place; where a component reads a
  value through its own model type (the wizard's draft, four lookup tables, the program list), the guess became an
  `as` assertion, which TypeScript now checks against the declared type. Five legacy functions are called with fewer
  arguments than they declare (`persistLogFields`, `iaWheelInit` and `hideRpeInfo` from component code, `saveExWeight`
  and `deleteProg` from templates): their trailing parameters are typed optional where they are declared, which retired the seven legacy
  markers on those short calls (629 marker lines to 622). `WD` is typed with its fields (each `any`, `restDays` an array) instead of an index
  signature, and `MOD_PAL` as `Record<string, [string, string]>`. `setDate` in This Week takes only the two setters it
  is wired to. 23 type imports and three local types that only fed the removed guesses are gone.
- **Kept string-typed:** `BridgeLike`, the narrow bridge the session sheet's read helpers take, because the repo's tests
  drive those helpers against the single-file app and cannot depend on the app's generated types; the four places a
  component hands its bridge to them cast it.
- **The proof:** the page: `tools/same-script.mjs` against v0.239.43, the same tokens, and `git diff index.html` empty.
  The Angular build: built unminified from v0.239.44's sources and from these, `main.js` differs only in a doc comment
  that moved onto the new overload and in three `ngDevMode` debug line numbers (code a production build removes);
  minified, the two are the same 173,359 tokens with only binding names chosen differently, and `legacy/legacy.js`,
  `legacy/app.js` and the styles are byte for byte the same. Two builds of one tree are byte for byte the same, so the
  renaming comes from the input's text, not from chance.
- **Tests:** `frontends/app/test/integration/legacy-bundle.test.ts` gains "the legacy types" (2): every top-level name
  typed from the file the bridge resolves it to, and nothing else, with `LegacyWritable` exactly the `let`s and `var`s;
  and a fixture compiled against the generated types, which reaches a declared function and refuses an undeclared name
  and a write to a `const` (each refusal an `@ts-expect-error`, so a type that let one through fails the compile).
  `test/unit/legacy-bundle.test.ts` reads `topLevel`'s writable names. The app's type check is the rest of the proof:
  every bridge call in the components is now checked.
