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
