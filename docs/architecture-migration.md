# Architecture migration: from one hand-edited index.html to TypeScript modules and Angular

Mario, 2026-10-11: "we want the app to be built from modules and angular mixed typescript and html/css and we need
shared interfaces and methods and classes that we can make use of in a full typescript test suite."

This is the plan. It changes how the app is built, never what it does: every phase lands with no behaviour change unless
a ruling says so, and Mario's data on his phone (the `ia_` localStorage keys) survives every step untouched.

## 1. Where we are (measured 2026-10-11, v0.239.1)

- `index.html` is the source, edited by hand: 18,579 lines, one `<style>` block (916 lines), one inline `<script>` (17,307
  lines) holding the whole app: 608 top-level functions, 154 top-level `let`/`const`/`var`, and 183 inline event handlers
  (`onclick="fn()"` in the static markup and in HTML built as strings) that call those functions as globals.
- **Nothing is compiled into it.** The Angular app in `app/` is generated FROM it: `npm run sync` splits the root file byte
  for byte into four pieces (`frontends/app/src/legacy/generated/index.html`, `legacy.css`, `legacy-markup.ts`, `public/legacy/app.js`),
  and Angular 22 (`@angular/build:application`) wraps them: `LegacyHost` mounts the markup and loads `app.js` as a classic
  script so its functions stay global; `LegacyBridge` is the seam for moving screens into Angular, unused so far. The only
  real Angular code is `app.ts`, `app.config.ts`, `core/platform.ts`, `legacy-host.ts`, `legacy-bridge.ts`.
- Who consumes the file today:
  - GitHub Pages serves the root `index.html` directly (Pages source: "legacy", branch `main`, path `/`).
  - The native iOS app: Angular build of the split pieces, Cordova 13 / cordova-ios 8 (`frontends/app/scripts/ios.mjs`).
  - `pwa-local` / `pwa-pages` builds (`frontends/app/scripts/pwa-*.mjs`).
  - The backend: `backend/scripts/app-bundle.ts` copies the root file into `app-web/` for `/app/` (dev container, Heroku).
  - Tests: `tests/harness.js` pulls the inline script out and runs it in a Node VM with DOM stubs; the legacy gates and the
    new feature tests (`tests/support/app.js`) both go through it.
- Where things live in the script (line numbers, top-level functions per area):

| Lines | Area | Examples |
|---|---|---|
| 1,214–2,100 | storage, utilities, rest-day moves, shell | `getPrograms`, `logKey`, `applyRestDayMoves`, `showScreen`, `showToast` |
| 2,100–2,900 | wizard and pace inputs | `startWizard`, `wizardNext`, `formatPacePerMile`, `parseTimeToSecs` |
| 2,900–4,250 | NSW cardio doctrine engine | `chiFromTable6`, `getINTReps`, `buildRunSession` |
| 4,250–5,600 | NRC engine, race alignment, taper, cardio progression | `buildNRCSession`, `raceAlignment`, `taperWeeksFor`, `buildCardioProgression` |
| 5,600–7,700 | prehab, power, core, leg-day placement, Engine A | `buildHipSection`, `_powerPrescribe`, `injectDynamicCore`, `nrcLegLiftPlacement`, `generateProgram` |
| 7,700–9,800 | Engine B (cardio), calendar, injury, Engine C | `engineB_cardio`, `planCalendar`, `applyInjuryFilter`, `engineC_kinematics` |
| 9,800–10,500 | swaps, edits, skips | `swapCandidates`, `applySwapPrefs`, `getDayEdits` |
| 10,500–11,600 | budget, deload, Engine D, race week, `buildProgram` | `capSessionBudget`, `recoveryDeload`, `engineD_synthesis`, `raceEveLiftPass`, `buildProgram` |
| 11,600–12,600 | random workout, Wildcards, week view, section HTML | `openRandom`, `wildcardDayFor`, `renderWeekView`, `buildSectionsHTML` |
| 12,600–14,000 | session logging: sets, weights, RPE, cardio dose | `autoSaveSets`, `logExerciseWeight`, `doseFromCardio` |
| 14,000–14,700 | rest stopwatch and floating timer, e1RM | `ruStart`, `_rtWireDrag`, `e1rmCalcHTML` |
| 14,700–15,400 | day detail, status, cardio log | `handleDayStatus`, `logCardio`, `showSwapNudge` |
| 15,400–16,700 | programs list, overlays (injury, travel), program management | `renderProgList`, `applyOverlays`, `refreshProgram`, `archiveProg` |
| 16,700–17,700 | progress, ledger, charts | `ledgerRows`, `buildLadderChart`, `renderProgressScreen` |
| 17,700–18,530 | bug report, `init`, pop-ups, streaks, update check, version label | `submitBug`, `init`, `popFire`, `computeStreak`, `iaVersionLabel` |

- Mario's stored data: `ia_programs`, `ia_active`, `ia_hist_*`, `ia_logs_*`, `ia_exw_*`, `ia_comp_*`, `ia_moves_*`,
  `ia_swaps_*`, `ia_swapct_*`, `ia_wild_*`, `ia_season_shown_*`, `ia_reminded_*`, `ia_remind_last_*` and the rest of the
  `ia_` family. Every key and every stored format stays byte-compatible through every phase.

## 2. Target

### 2.1 Source layout

```
core/                      @ia/core: framework-free TypeScript, the engine and the domain, no DOM, no Angular
  package.json             { "name": "@ia/core", "type": "module" }
  tsconfig.json            strict, erasableSyntaxOnly (Node runs it by stripping types), .ts import extensions
  src/
    domain/                the shared types and classes: Cfg, Program, Week, Day, Section, Item, Session, LogEntry,
                           SetEntry, CardioDose, Overlay (injury, travel), RestMove, SwapPref, DayEdit, Wildcard,
                           LedgerRow, Streak; Program and LogBook classes with the methods the app and tests share
    engine/                buildProgram (Engines A to D), pools, sections, power, core, leg placement, calendar,
                           injury, kinematics, synthesis, budget, deload, supersets, race week, sweeps
    cardio/                NSW Table 6, CHI/INT, run progression, NRC plans, race alignment, taper, swim, bike
    data/                  doctrine as typed data: NRC sessions (verbatim), NSW tables, exercise pool, aliases;
                           byte-checked against doctrine/*.txt by a test
    storage/               every ia_ key in one module, exStoreKey and EX_KEY_ALIAS (the single writer), a Storage
                           interface with a localStorage adapter (app) and an in-memory adapter (tests)
    format/                pace, clock, units, dates, the version label
    version.ts             the one place the release version lives; the build writes it into <meta name="ia-version">
backend/                   the Node server (API, heartbeat, admin API) that serves the frontends' builds; imports
                           @ia/core types (app version, heartbeat) instead of its own copies
frontends/                 every UI, each built by Angular
  common/                  what more than one frontend uses: design-system tokens, the icon set, shared components
  app/                     the athlete's app, and the Cordova project root (config.xml, www/, platforms/)
    src/app/
      shell/               app component, tab bar, routing, toasts
      screens/<screen>/    one folder per screen: <screen>.ts, <screen>.html, <screen>.css
      components/          shared UI: wheels, sheets, charts, cards (design-system tokens in styles)
      services/            Angular services wrapping @ia/core (ProgramService, LogService, OverlayService, ...)
      platform/            native bridge, iOS island, update check
      legacy/              classic-script code not yet moved to a screen; shrinks to nothing
    public/                icon, manifest, static assets
  website/                 the public site, served at /
  admin/                   the admin dashboard, served at /admin/
tests/                     the full TypeScript suite (section 2.3), and the e2e journeys and collage (website, admin,
                           app) in tests/e2e/
```

`core/` sits at the repo root because three consumers import it: the frontends, the tests and the backend. Each takes it as a
local package (`"@ia/core": "file:../core"`), and TypeScript project references build it once.

### 2.2 What the build produces (Angular application builder, esbuild)

One build, `ng build`, writes `frontends/app/dist/web/browser/`:

```
index.html             small: <meta name="ia-version" content="0.N.M"> (written from core/src/version.ts), the
                       zoom-locked viewport, <base href>, links to the hashed files below, critical CSS inlined
main-<hash>.js         the app (Angular, @ia/core, screens); lazy chunks per screen: chunk-<hash>.js
styles-<hash>.css      global styles and design-system tokens; component styles are bundled with their components
media/, icons, manifest
```

Every consumer uses that same output:

| Consumer | How |
|---|---|
| GitHub Pages | A pipeline job uploads `dist/web/browser` (`actions/upload-pages-artifact`, `actions/deploy-pages`) on every merge to `main`. The Pages source switches from "branch `main`, `/`" to "GitHub Actions". `<base href="/TheBig6V2/">`. |
| iOS (Cordova) | The same build with `<base href="./">` goes into `frontends/app/www`, then `cordova build ios` (as `ios.mjs` does now with the legacy pieces). |
| Backend `/app/` | `app-bundle.ts` copies the build folder instead of one file (dev container and Heroku). |
| Dev | The dev container watches `frontends/app/src` and `core/src` and rebuilds; pages reload as they do now. |
| Update check | Unchanged in spirit: the running app knows its version, re-fetches `index.html` with `no-store` and reads the meta. Hashed file names make every other file cache-safe. Still no service worker. |

**Recommended: multi-file output.** A single self-contained `index.html` (everything inlined after the build) is possible
but buys nothing: no consumer needs one file, and every release would re-download the whole app instead of only the
chunks that changed.

### 2.3 The TypeScript test suite

- `tests/unit/<feature>.test.ts`: imports `@ia/core` directly. Pure functions, typed fixtures, no VM, milliseconds.
- `tests/integration/<feature>.test.ts`: `@ia/core` services with the in-memory storage adapter (whole programs built,
  logged, swapped, overlaid), and Angular components rendered in a DOM with Angular's testing tools.
- `tests/sweeps/<feature>.test.ts`: lattices and fuzz over many programs; CI only.
- `tests/snapshots/<feature>.json`: golden program output, regenerated on purpose only.
- `tests/support/`: typed fixtures (HALF_MANNY and the lattice configs as `Cfg` values), builders, the storage adapter,
  DOM helpers. Shared with `tests/e2e` where useful.
- `tests/e2e/`: the Docker e2e (journeys, parity, collage), moved from the app in the folder layout's step 4.
- One runner for every TypeScript test (section 4, decision 3), `tsc -b` type-checking everything in the 60-second check
  and in CI, and the feature names already in place (`docs/test-migration.md`) carried over unchanged.
- `tests/harness.js` and its VM retire at the end of phase E, when no test drives the legacy page any more (phase D moves the
  engine-only tests off it; the 51 page-driving test files move with their screens).

## 3. Phases

Each phase lands on `dev` in small commits, goes through CI and reaches `main` only through Mario's pull request.
Releases keep shipping between phases.

### Phase A: the TypeScript foundation (about 1 session; no app change) — done, Post-v0.239.1
- Create `core/` (package, strict tsconfig, `erasableSyntaxOnly`), a base tsconfig shared by `core`, `app`, `tests` and
  `backend`, and the chosen test runner (decision 3).
- Convert `tests/unit`, `tests/integration`, `tests/support` from `.js` to `.ts` (mechanical; the phase 2 test files).
- `tsc -b` in `tools/check.mjs` and in a CI job.
- **Done when:** every existing test passes as TypeScript and the type check is green. The app is untouched.

**What landed.** `index.html`, `tests/harness.js` and the legacy suite are unchanged.
- `core/` is `@ia/core` (`"type": "module"`, exports `src/index.ts`, no dependencies). `core/tsconfig.base.json` is the
  shared strict base (ES2024, `nodenext`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `.ts` import extensions, no
  emit); `core/tsconfig.json` adds `noUncheckedIndexedAccess` and no DOM or Node types. Node runs it by stripping
  types. It holds:
  - `src/version.ts`: `VERSION = '0.239.1'`. `tests/unit/semver.test.ts` holds it equal to `index.html`'s meta until
    the build writes the meta from it (phase B builds `index.html` from the sources, and the meta is still written by
    hand in `frontends/app/src/legacy/src/html/head.html`), so a release writes both.
  - `src/format/version-label.ts`: `versionLabel`, the rules of the app's `iaVersionLabel`.
  - `src/semver.ts`: `tests/semver.js` in TypeScript (`parse`, `cmp`, `lookup`, `fromHtml`, `str`, `bump`, `below`,
    `tag`, `SemVer`), exported as `semver`; `tests/semver.js` stays for the frozen legacy tools, and a test holds the two
    in agreement.
  - `src/domain/`: `Cfg`, `Program`, `Week`, `Day` (`RestDay` or `TrainingDay`), `Section`, `Item`, `Cardio`,
    `CardioDose`, `LogEntry` and `LogBook`, written from the engine's code and from real builds (HALF_MANNY, the
    program-output configs, the 864-config lattice, every cardio goal crossed with every lifting focus). Runtime shape
    checks (`checkProgram`, `checkCfg`, `checkLogEntry`, `checkLogBook`, `isProgram`) are bound to the types by the
    compiler (one rule per field, its optionality and its value type), and `tests/integration/program-shape.test.ts`
    and `tests/sweeps/program-shape.test.ts` walk real programs and a log the app writes through them.
- `tests/` is its own package (Vitest 5, TypeScript 6, `@types/node`, `"@ia/core": "file:../core"`; lockfile committed,
  `tests/node_modules` ignored) with `tests/tsconfig.json` (module `preserve`, bundler resolution) and
  `tests/vitest.config.mts`. Every test file and helper is TypeScript on Vitest; the snapshot file and its
  `UPDATE_SNAPSHOTS=1` rewrite are unchanged. Phase 2's groups 1 to 7 included: 293 tests in unit and integration
  before (node:test), 336 after, every old one under its own name; 27 sweeps before, 29 after.
- The type check is `tsc -p core` then `tsc -p tests` (`npm run typecheck` in `tests/`), not `tsc -b`: project
  references need emitting, composite projects, and nothing here emits.
- `tools/check.mjs` runs both type checks and Vitest over `tests/unit` and `tests/integration` (installing
  `tests/node_modules` when it is missing); CI's "unit and integration tests" job runs `npm ci` in `tests/`, the type
  check, then Vitest over unit, integration and sweeps.
- Not yet: the app and the backend do not extend `core/tsconfig.base.json` or import `@ia/core`; they adopt it when
  they first need a shared type (phase D, or the backend's version handling).

### Phase B: split the script into source files, byte-identical (done, Post-v0.239.1)
- Cut the inline script into about 25 classic-script files under `frontends/app/src/legacy/src/`, one per area in section 1 (the
  final cut lines are chosen at function boundaries by a measure pass), the `<style>` block into CSS files, and the markup
  into HTML partials.
- A build script reassembles them in order. Its output must be **byte-identical** to today's `index.html`, which stays
  committed at the root as a generated file (Pages keeps serving it unchanged); CI rebuilds it and fails on any byte of
  difference.
- From here, builds edit the source files, never the root `index.html`. `npm run sync` reads the sources.
- **Done when:** the rebuilt file is byte-identical; every test, gate and e2e parity run is unchanged.

**Done (Post-v0.239.1).** The root `index.html` (v0.239.1, 1,341,606 bytes, sha256 `2c9bfd96…9406531ea`) is now the
build of 49 source files under `frontends/app/src/legacy/src/`, byte for byte, and the file itself did not change.
- **How it is built.** `frontends/app/scripts/build-index.mjs` joins the files `order.json` lists, in that order, with nothing
  between them (`cd frontends/app && npm run build:index`). `npm run build:index:check` rebuilds into a temp file and fails,
  naming the first differing byte and the source file it comes from, unless it equals the root file. It runs in the
  60-second check (`tools/check.mjs`, when `index.html` or anything under `frontends/app/src/legacy/src/` is staged, and in the
  full check), in CI (the gate suite job's first step), and in `frontends/app/test/integration/build-index.test.ts`.
- **How code is edited from now on.** In the source files, never the root `index.html`; then `npm run build:index`,
  and both are committed together. The dev container builds `/app/` from the sources on every save, into
  `backend/app-web/` only (it never writes the repo). `npm run sync` still splits the root file, which is the same bytes.
- **The cuts are the measure's,** taken from `tests/measure/architecture_split_cutpoints.js` and never cut by hand. Six
  of the seven merges below were applied. **bug-report-init into update-check was not:** the two are not adjacent
  (popups and streaks-reminders sit between them), so merging them would reorder code. That leaves 35 JS files, not 34.
- **The files, in build order** (what each holds: `frontends/app/src/legacy/src/README.md`):
  - `html/head.html`;
  - CSS: `base`, `shell`, `wizard`, `week-view`, `detail-sheet`, `overlays-components`, `this-week`, `session-sheet`,
    `motion`;
  - `html/screens.html`, `html/overlays.html`;
  - JS: `storage`, `rest-day-shell`, `exercise-library`, `wizard`, `nsw-cardio`, `nrc-race-bike-swim`,
    `cardio-progression`, `prehab`, `power-accessory`, `core-legs`, `wizard-generate`, `engine-a-b-calendar`, `injury`,
    `engine-c`, `region-caps`, `swaps-edits`, `budget-engine-d`, `random-wildcard`, `week-view-sections`,
    `set-logging`, `log-entries`, `wheel-log`, `rest-timer`, `day-detail`, `swap-sheet`, `day-status`, `programs`,
    `overlays`, `program-manage`, `progress-data`, `progress-charts`, `lift-ledger-progress-screen`,
    `bug-report-init`, `popups-streaks-reminders`, `update-check`;
  - `html/screens-late.html`, `html/popups.html`.

**Measured for phase B (2026-10-11, `tests/measure/architecture_split_cutpoints.js` and its `.out.txt`).**
- **The split is proven.** 55 pieces (5 markup partials, 9 CSS files, 41 JS files) rebuild `index.html` byte for byte
  (1,341,606 bytes, same sha256). Every JS cut sits between two top-level statements (acorn, plus a compile of every
  prefix), and every CSS cut sits at brace depth 0.
- **41 JS files, not section 1's 15 areas.** The code's real order differs: the wizard is in two places, Engine A starts
  later, and the Engine C helpers and the compound tiers sit apart from where the table put them. Phase B cannot reorder
  code, so files follow the real order. Seven adjacent pairs merge with no hazard, giving 34 files (session's call):
  - bike-swim into nrc-race;
  - shell into rest-day;
  - engine-a into engine-b-calendar;
  - lift-ledger into progress-screen;
  - popups into streaks-reminders;
  - sections into week-view;
  - bug-report-init into update-check.
- **The CSS stays in its 9 files in source order.** The cascade depends on it, and its sections are not grouped by area.
- **Load order is safe today.** 0 load-time references reach a name declared later. One name is declared twice:
  `_isoToday`, in wizard.js and overlays.js. The later one wins in one script; both return the same local date string,
  and phase C keeps one.

**What this changes for phase C.**
- The file graph is one big cycle: 37 of the 41 files reach each other, in 249 cross-file edges. They cannot become ES
  modules one for one without circular imports.
- 25 `let`/`var` names are used across files, and 18 are written outside their own file (`activeProg`, `currentWeek`,
  `activeProgId`, the log-dose state, ...). They move into explicit state modules first.
- The global surface is 113 names across 21 files:
  - 177 inline handler attributes;
  - 4 `popFire` action strings;
  - 2 window properties (`_unitLabel`, `iaIsland`).
- So phase C starts with a measure of the engine subgraph. The engine files likely form an acyclic set that can become
  real modules first, while the UI files stay together in one legacy module until phase E takes them apart screen by screen.

### Folder layout: core, backend, frontends, tests (done, Post-v0.239.1)
Mario, Post-v0.239.1: "top level core/backends/frontends and app is just 1 of the frontends now... frontends->app+website".
The order he agreed: test-migration phases 2 and 3, then this layout, then phase C. Each step moves files and repoints
paths only, and is proved by identical outputs: `index.html` byte for byte, the app's build hashed before and after,
the website and admin builds hashed before and after, the iOS build, the e2e collage, the backend's tests and the
Heroku tree.
1. **`app/` to `frontends/app/`** (done). The whole Angular and Cordova project moved as one folder, its
   `node_modules`, `platforms/` and `plugins/` with it; every path that climbs out of it gained a level. The app's
   build (`www/`, 6 files) and the generated legacy pieces (4 files) hash the same before and after.
2. **The website and the admin to `frontends/website/` and `frontends/admin/`** (done), out of `backend/`. They are
   an Angular workspace of their own at `frontends/` (its `package.json`, lock file, `angular.json`, `tsconfig.json`
   and lint config), built into `frontends/dist/`, so `backend/` holds the server only. The server finds the builds
   beside it (`../frontends/dist`), and every place it runs keeps the repo's layout for that: the Docker images are
   built from the repo root into `/srv/backend` and `/srv/frontends`, and Heroku's tree is `backend/` and
   `frontends/` (without the app) with `backend/heroku/`'s manifest and `Procfile` at its root. The frontends lock
   resolves every package at the version the backend had locked (478 packages, 0 changed). Both bundles are byte for
   byte the same; only Angular's file name hash moved with the source paths.
3. **`frontends/common/`** (done): the icon set the admin borrowed from the website moved there in step 2, and the 16
   design tokens the website and the admin both declared with the same value are `common/tokens.css`, which each
   `styles.css` imports first. Proof: each built sheet holds the same tokens with the same values, and everything after
   them is byte for byte the same. Four tokens share a name but not a value (the text and mono font stacks, the ink
   line and muted alphas), so each frontend keeps its own until Mario rules which value wins. The app's own tokens
   (its legacy CSS) join when phase E builds its screens on `frontends/common/`.
4. **The e2e to `tests/e2e/`** (done): it drives all three frontends, so it lives with the tests. It is part of the
   tests package now (Puppeteer, pngjs and pixelmatch at the versions the app had locked), reads versions through
   `@ia/core`'s semver instead of the app's copy, and its five self-test files run under Vitest as
   `tests/unit/e2e-{collage,flow,parity,report}.test.ts` and `tests/integration/e2e-browser.test.ts`, each with the
   test count it had under `node --test` (28, 9, 6, 20, 4). Its Docker runner installs the tests package with
   `core/` beside it.
The app joins the `frontends/` workspace later (phase E), when its screens start importing `frontends/common/`; until
then it stays its own package, because Cordova keeps its platform and plugin list in the project root's
`package.json`.

### Phase C: ES modules, in place first (in progress, Post-v0.239.1)
- **Prerequisite (met, Post-v0.239.1):** the legacy gates are retired (test-migration phase 3, `830af1e`), because they
  reached into VM globals that this phase removes. The feature tests are the safety net from here.
- **Measured first** (`tests/measure/es-modules_module-graph.md`). The engine is separable: `buildProgram` reaches 186
  of the 783 top-level names, in 19 of the 35 files, and none of them uses a browser API; no inline handler calls an
  engine name. The UI is one cycle (31 of 35 files), 18 `let`s are written from other files, and nothing is looked up
  dynamically. Loading the files runs almost nothing once the boot is left to an entry. But the tests reach the app by
  name (389 `IA.eval` calls) and by text (about 20 files read the script's text), so a bundler that reprints the code
  or wraps its names (the original plan: esbuild and one `globals.ts` at once) would break hundreds of tests in one
  step.
- **So the sources become ES modules in place, and the build strips the module syntax back out.** Each step keeps
  `index.html` byte for byte, or changes it only where a step means to and proves that with the feature tests, the
  snapshots and e2e parity. The bundle that replaces the classic script comes last, with phase F, once the tests no
  longer read the script's text or reach it by global name.
  1. **Imports and exports in place (done, Post-v0.239.1).** Every JS file has an import block naming what it uses
     from the other files and an export block naming what they and the tests (`EXPORT_NAMES`) use from it: 612
     imported names, 330 exported. `frontends/app/scripts/module-blocks.mjs` writes them from the code;
     `build-index.mjs` strips them, so `index.html` is unchanged (sha256 `2c9bfd96…9406531ea`); every file parses as a
     module and every import names an export (`frontends/app/test/integration/module-blocks.test.ts`). The engine now
     loads straight from the sources in Node and Vitest, with no VM: `tests/integration/engine-modules.test.ts` builds
     HALF_MANNY and the nine seeded configs, and `tests/sweeps/engine-modules.test.ts` the 864-config lattice, each
     with the digest the classic script builds (the program-output golden files), in 6.5 s against the VM's 17. Both
     fail on the sources before this step (`buildProgram is not a function`).
  2. **Setters for the 18 cross-file `let`s (done, v0.239.2).** Each `let` another file assigns has a setter beside its
     declaration, and the 61 assignments from other files call it, so no file assigns a name it imports
     (`module-blocks.test.ts` holds that; before the step it found 61). A setter rather than a state module: every one
     of the 61 was a plain assignment statement, and the reads stay live imports, so the smallest change does it.
  3. **The engine's own files (done, v0.239.2).** The 27 engine names that lived in mostly-UI files moved into engine
     files, five of them new (`icons`, `calendar`, `clock-format`, `exercise-kinds`, `swap-prefs`), and
     `auxSwapCandidates` moved the other way. The engine is now 17 files that import only each other: it loads with no
     page and no UI file (`tests/integration/engine-modules.test.ts`), the move added no load-order hazard (the measure
     finds 0, in the page and as modules), and every program, screen and stored value is unchanged
     (`docs/decisions/es-modules.md`).
  4. **Engine tests off the harness: folded into phase D (Post-v0.239.2).** Measured first
     (`tests/measure/es-modules_test-harness-use.md`): of 82 test files, 51 drive the page by global name (`activeProg`,
     `WD`, the swap sheet, the wizard) and only 21 reach the app for engine code alone, 19 of them by source surgery
     (variants written against the app's text, hooks set through `eval`). Moving those 21 onto the legacy modules now and
     again onto `@ia/core` in phase D is the same work twice, so each moves once, in phase D, as its code moves, through
     one support module (the engine's loader) that phase D repoints.
  5. **The bundle: dropped (Post-v0.239.2).** An esbuild bundle of the legacy script would hide its names in module
     scope and cut off the 51 page-driving test files at once. It is not needed: the Angular app already hosts the
     legacy script as it is (`frontends/app/src/app/legacy/`: `LegacyHost` mounts the markup and loads `legacy/app.js` as
     a classic script, `LegacyBridge` is the seam), and it is what the native app runs. The legacy script stays a classic
     script and shrinks screen by screen in phase E; Angular's own build bundles everything else.
- **Done when:** no code depends on implicit globals except through `globals.ts`.

### Phase D: TypeScript, engine first (in progress from Post-v0.239.2; `docs/decisions/engine-typescript.md`)
- **How (Post-v0.239.2).** The engine's 17 files (phase C step 3) move into `core/src/engine/<name>.ts` a group at a
  time, in the order their imports allow, and stay pieces of the page: `order.json` names each `engine/<name>.ts`, and
  `build-index.mjs` strips its types with Node's own stripper (strip mode) and takes the blanks they leave out
  (`collapseTypes`). A move writes types and never changes code, and `node tools/engine-move.mjs <name> <ref>` sets the
  file's blanks so the page carries the JavaScript as it was, text for text but for added comment lines (v0.239.4).
  `node tools/same-script.mjs <before.html> <after.html>` proves the same tokens with the same line breaks, so every
  `index.html` hunk is a comment, whitespace or the version. Each group ships as the next PATCH (Mario's standing answer). The engine is type-checked as its
  own project (`core/tsconfig.engine.json`: strict, framework-free, without `noUncheckedIndexedAccess`).
- **Groups** (the strongly connected parts of the engine's import graph, dependencies first):
  1. **the leaf files, v0.239.3:** `icons`, `exercise-library`, `calendar`, `clock-format`, `prehab`, `region-caps`,
     `power-accessory`, `exercise-kinds`, `injury` (done);
  2. **the cardio engines, v0.239.4:** `nsw-cardio`, `nrc-race-bike-swim`, `cardio-progression`, which import each
     other (done);
  3. **`swap-prefs` and `engine-c`, v0.239.5** (done);
  4. **Engines A, B and D with `buildProgram`, v0.239.6:** `engine-a-b-calendar`, `core-legs`, `budget-engine-d`, which
     import each other; `core/src/engine/index.ts` exports the engine (`@ia/core/engine`) (done: the engine is whole in
     `core/`).
- **Then the cleanup pass**, under the tests with ordinary proof rather than the token proof: every `@ts-expect-error`
  the move left, `noUncheckedIndexedAccess`, and the loose types (`any`) tightened file by file.
- **Then the engine-only tests** (21 files, `tests/measure/es-modules_test-harness-use.md`) import `@ia/core/engine`
  through one support loader instead of booting the page. The other 51 drive the page's screens by global name, so they
  move with phase E, and the VM harness retires when the last of them has.
- The rest of the original list (storage keys, logging, history and freeze, the ledger and streak services) is UI-side
  code today and moves with the screens that own it, in phase E, into `@ia/core` services.
- Domain types are written from the code and from real built programs, and a test checks that real programs match them,
  so the types cannot drift from what the engine produces.
- **Done when:** the engine is strict TypeScript in `core/src/engine`, the page and the tests build programs from it, and
  no engine-only test boots the inline script.

### Phase E: screens into Angular components (one screen per release; in progress from v0.239.8, `docs/decisions/angular-screens.md`)
- Through `LegacyBridge`, each screen becomes a component (`.ts`, `.html`, `.css`) using `@ia/core` services, and its
  string-built HTML and inline handlers disappear.
- **How (v0.239.8):** the Angular app keeps hosting the legacy app whole and, once it has booted, puts each moved
  screen's component inside that screen's element (`src/app/screens/screens.ts`, `MOVED_SCREENS`); the legacy
  navigation still shows and hides it. The single-file page keeps the legacy screen until Pages serves the Angular build,
  and the e2e's parity holds the two the same. The markup moves as it is first; the logic moves apart from Angular
  (`<screen>-model.ts`) and is tested by node --test.
- **Done:** the bug report (v0.239.8), the rest timer (v0.239.9, the first a component whose legacy callers it takes
  over through `LegacyBridge.provide`), the celebration pop-up (v0.239.10), the program list (v0.239.11), the swap sheet (v0.239.12, the first to write a legacy `let`, through
  `LegacyBridge.set`), the add-an-exercise sheet (v0.239.13), the change-a-goal sheet's body (v0.239.14), the mile pencil's edit sheet and lock (v0.239.15).
- Suggested order:
  1. bug report (small, proves the pattern);
  2. rest timer;
  3. rest sheet;
  4. day detail and session log;
  5. week view;
  6. wizard;
  7. programs and overlays;
  8. progress and charts.
- **Done when:** `frontends/app/src/app/legacy/` is empty and `globals.ts` is gone.

### Phase F: delivery from the build (about 1 session; right after phase C). The delivery half: done, Post-v0.239.2
- Pages deploys the build output through GitHub Actions, from a defined `dist-github-pages/` folder (the app's
  `index.html` and its icon, nothing else; Mario, 2026-10-12: Pages stays until Heroku is set up). Cordova and the
  backend take the same output. Mario switches the Pages source to GitHub Actions in the same merge that deletes the
  root file, or the live app breaks.
- Every reader of the root file (about 25: the test harness and `tests/support/app.ts`, `tools/check.mjs`, the CI
  pipeline, `tools/deploy-check.mjs`, the app's sync, PWA and iOS scripts, the backend's dev watcher and Heroku bundle)
  reads the build output instead.
- `tools/deploy-check.mjs` reads the version from the live built `index.html`.
- **Done, Post-v0.239.2:** `frontends/app/scripts/build-index.mjs` writes `dist-github-pages/` (the page and its icon);
  the tests boot it (Vitest's global setup builds it first), and the check, CI, the app's sync and PWA scripts, the
  backend's bundle, dev watcher and Heroku tree, and the e2e image read the build, not the root file. The pipeline's
  "Pages" job builds it on every merge into `main` and deploys it once the Pages source is "GitHub Actions"; the deploy
  proof reads either source. `tools/app-at.mjs <ref> <file>` writes the page as any commit had it (gatekeeper's
  previous release). **Left:** Mario switches the Pages source (Settings, Pages, Source: GitHub Actions), and in that
  merge the root `index.html` and `build-index`'s root copy and `--check` go. Until the first screen moves into Angular,
  Pages deploys the single-file page (byte for byte today's live app); from then on, the Angular build.
- The root `index.html`, `sync-legacy` and the split-piece generator are deleted.
- CLAUDE.md drops "single-file" from "What this is" and keeps every invariant below.

## 4. Decisions for Mario (each with a recommendation)

1. **Pages serves a multi-file Angular build (recommended)** rather than one inlined `index.html`. The case for one file: it
   matches today exactly. Against: nothing needs it, and it costs a full re-download every release.
2. **Pages deploys through GitHub Actions from the build (recommended)**, instead of serving a committed root file. The
   case against: one more pipeline job to keep green; the deploy proof already reads Pages, so it adapts easily.
3. **One test runner for all TypeScript tests: Vitest (recommended).** It is Angular's own unit-test runner now, runs
   TypeScript directly, has snapshots built in, and its API is close to `node --test`, so the phase 2 tests move across
   mechanically. Against: one dev dependency where `node --test` needs none.
4. **Order against v0.240.0 (the rest sheet).** Recommended: phases A and B first (2 to 3 sessions, no behaviour risk), then
   build v0.240.0 in the split source files, then phase C. Against: it delays the rest sheet by those sessions. The
   alternative is building v0.240.0 first in the single file and splitting afterwards.
5. **`core/` at the repo root as a local package (recommended).** The alternative is a library inside the Angular
   workspace, which is harder for `tests/` and `backend/` to import.

## 5. Invariants carried through every phase

- Mario's stored data: every `ia_` key and format unchanged; `prog.weeks` still persisted and read back; `exStoreKey` the
  single `ia_exw_` writer; the per-day week freeze and the injury overlays' day-level piercing unchanged.
- `buildProgram` stays a pure function of `cfg`; `cfg` is never mutated; `cfg._racePin` deleted before storing.
- NRC sessions verbatim; race goals route to NRC and test goals to NSW; race day found by subtype.
- Zoom-locked viewport, `touch-action: manipulation`, no service worker.
- The copy rule, the design system (bone, ink, signal orange; `asyIcon` SVG, never emoji).
- Semantic versioning: the version lives in one place (`core/src/version.ts` from phase A on) and the build writes the meta.
- Every step is proven by the feature tests, the snapshots and e2e parity, with no behaviour change unless ruled.

## 6. How it fits with the work in flight

- **Test migration phases 2 and 3 are done** (Post-v0.239.1): every gate row is held by a feature test or dropped for a
  written reason, and the legacy suite is deleted (`830af1e`), so phase C may start. The 64 test files phase 2 ported with
  `@ts-nocheck` are typed (Post-v0.239.2); no test carries the marker (`docs/test-migration.md`, Typing debt).
- **Releases** continue between phases. From phase B on, builder edits `frontends/app/src/legacy/src/*`, never the root
  `index.html`; from phase D on it edits TypeScript.
- **Process docs** (CLAUDE.md, the agent files, the skills) are updated at the end of each phase to say where code lives
  and how it is built.

| Phase | Size (rough) | Behaviour risk | Proof |
|---|---|---|---|
| A (done) | 1 session | none (no app change) | tests pass as TypeScript, the type check green |
| B (done) | 1–2 sessions | none | byte-identical rebuild |
| C | 2–4 sessions | low | feature tests, snapshots, 0% e2e parity, device check |
| F | 1 session | low | deploy proof reads the live built version |
| D | many, incremental | low per module | strict types, tests import `@ia/core`, snapshots unchanged |
| E | one screen per release | per screen, ruled | component tests, e2e journeys, device check |
