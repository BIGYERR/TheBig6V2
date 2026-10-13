# The app's source files

These files are Iron Asylum's source. Its page, `index.html` (what GitHub Pages serves, the native app wraps and every
test boots), is built from them into `dist-github-pages/` by `frontends/app/scripts/build-index.mjs`, with a committed
copy at the repo root until the Pages source switches to GitHub Actions; neither is ever edited by hand.

## How to change the app

1. Edit the file under `frontends/app/src/legacy/src/` that holds the code (`grep -rn <name> frontends/app/src/legacy/src/js` finds it).
2. Rebuild: `cd frontends/app && npm run build:index`. It first rewrites each code file's module blocks (below) from the
   code, then builds the page into `dist-github-pages/` and the root copy.
3. Commit the source files and the root `index.html` together.

`npm run build:index:check` fails unless `index.html` is exactly the build of these files, and prints the first byte
that differs and the source file it comes from. The 60-second check (`tools/check.mjs`) and CI run it, so a hand edit
to `index.html`, or a source edit that was never rebuilt, cannot land. In dev mode (`cd backend && npm run dev`) a
saved source file rebuilds the app at http://localhost:3000/app/ within a second; the root copy still needs
`npm run build:index`. The tests build the page themselves before every run (`tests/support/global-setup.ts`).

## How the build works

`frontends/app/scripts/build-index.mjs` concatenates the files `order.json` lists, in that order, byte for byte, with nothing
added between them. `order.json` is the only list of pieces. A file under `html/`, `css/` or `js/` that it does not
list fails the build, as does an entry that is missing, listed twice, or not named in lower case words joined by
dashes. No file name carries a version.

The HTML and CSS files carry no header of their own: every byte in them is a byte of `index.html`. So does every JS
file between its module blocks (below), which the build strips. A piece starts and ends where
the page does: `head.html` ends with the `<style>` open tag, `overlays.html` with the `<script>` open tag, and
`screens-late.html` starts with `</script>`.

## One script, one scope, and ES modules too

The build puts the code files back into the page's one inline `<script>`, so a top-level name in one file is visible in
every other, and an inline handler (`onclick="openDetail(...)"`) calls it as a global.

Each code file is also an ES module (architecture phase C, step 1). An import block at its top names every top-level
name of another file it uses (`import { EXLIB, pick } from './exercise-library.js';`), and ends on the line
`// end of the module imports (...)`; an export block at its bottom starts on the line `// the module exports (...)`
and names every top-level name another file, or the tests through `tests/harness.js`'s `EXPORT_NAMES`, uses from it.
`frontends/app/scripts/module-blocks.mjs` writes both from the code (acorn and eslint-scope), so never edit them by hand:
`npm run build:index` rewrites them, and `npm run modules:check` (in the app's tests) fails when one is stale. The
build strips both, so the page is unchanged by them. As modules, the files load in Node and Vitest without the page:
the tests import the engine straight from here (`tests/support/engine-modules.ts`) and it builds every program the
page builds. A module cannot assign another module's binding, so each top-level `let` another file changes
(`activeProg`, `currentWeek`, ... eighteen of them) has a setter beside its declaration (`_setActiveProg(v)`), and
other files call it; the app's `module-blocks` test fails if a file assigns a name it imports. The engine's files
(`ENGINE_FILES` in `tests/support/engine-modules.ts`: `icons`, `calendar`, `exercise-kinds` and the rest) import only
each other, so the engine loads with no page and no UI file; a test fails if one of them starts importing a UI file. Function
declarations are hoisted across the whole script, but a `let` or `const` must be declared before a statement that
runs at load time reads it, so the order in `order.json` matters. Every cut sits between two top-level statements,
and every CSS cut sits outside any rule, so each file parses on its own. One name is declared twice today:
`_isoToday`, in `wizard.ts` and `overlays.ts`. The later one wins, and both return the same date string.

## The engine's TypeScript, from core/src/engine (architecture phase D)

The engine moves into `@ia/core` as strict TypeScript, a group of files at a time, in the order its imports allow:
`order.json` names a moved file `engine/<name>.ts`, which is `core/src/engine/<name>.ts`, and it keeps its place in
the build. `build-index.mjs` strips its module blocks, then its types, with Node's own stripper (strip mode), and takes
the blanks the types leave out (`collapseTypes`), so the page runs the same JavaScript it ran before;
`node tools/same-script.mjs <before.html> <after.html>` proves the same tokens and line breaks against any earlier page.
After typing a moved file, `node tools/engine-move.mjs <name> <ref>` sets its blanks so the page reads the JavaScript the
file was at `<ref>`, text for text but for the comment lines the move added; the tests that read the page's text and the
variants written against it then read what they read before. A moved file's type imports
(`import type { Cfg } from '../domain/index.ts';`) sit just below its import block, inside the code, where the build
strips them with the other types. `module-blocks.mjs` writes each import as the path between the two files
(`./x.ts` inside the engine, `../../../../../../core/src/engine/x.ts` from a file here), and an engine file never
imports one of these. The engine is type-checked strictly on its own (`core/tsconfig.engine.json`); while it moves,
a type is written onto the code as it ran and never by changing the code, which is the next pass's work, under the
tests (`docs/decisions/engine-typescript.md`).

## The app's own files are TypeScript in place (architecture phase E)

Since v0.239.44 every file in `js/` is TypeScript (`js/<name>.ts`), still a piece of the page where it was: the build
strips its module blocks, its types and its marker lines, so the page runs the JavaScript it ran before.
`frontends/app/tsconfig.legacy.json` checks them strictly (the app's `npm run typecheck`). They turned TypeScript
without one token of their code changing, by `node tools/ts-expect.mjs <name> [...]`: a parameter or variable that
nothing typed is typed `any` where it is declared, a parameter some call leaves out is typed optional (`b?: any`), a
lookup table indexed by an unchecked key is typed `Record<string, ...>`, and every other error gets a
`// @ts-expect-error TS<code> <message>` line above it, which the build strips with the types. An error inside a
template literal that spans lines cannot carry a marker, and gets a type by hand where the value it reads is declared.
`node tools/engine-move.mjs js/<name> <ref>` sets the blanks as for an engine file, and `node tools/same-script.mjs`
proves the page's tokens. Each marker is type debt named where it lies. `node tools/ts-narrow.mjs` takes the markers
out and writes the narrow type where one exists (`x!`, a typed table), then `ts-expect.mjs` marks the rest
(`docs/decisions/app-typescript.md`). A new type is written onto the code; changing the code is a release with
its own proof.

## The files, in build order

| File | What it holds |
|---|---|
| `html/head.html` | doctype, the `<head>` metas (`ia-version`), title, the `<style>` open tag |
| `css/base.css` | `@import`, tokens, reset, light lock |
| `css/shell.css` | tab bar, top bar, program list |
| `css/wizard.css` | wizard |
| `css/week-view.css` | week view, injury state and week wash |
| `css/detail-sheet.css` | detail overlay, wheel, dose log, day status, swap, add and skip, e1RM |
| `css/overlays-components.css` | random overlay and filter, toast, update banner, generate screen, cards, summary, cardio blocks, overflow |
| `css/this-week.css` | this week: pills, strip, hero, tiles, up next |
| `css/session-sheet.css` | session sheet, set bar, logged state, rest stopwatch |
| `css/motion.css` | motion, enriched strip, session journal, RPE modal |
| `html/screens.html` | `</style></head><body>`, update banner, screens 1 to 4 (home, wizard, generating, week) |
| `html/overlays.html` | detail, add, swap nudge, RPE info, random, rest, change, goal and mile sheets, rest float, the `<script>` open tag |
| `engine/icons.ts` | the Asylum icon set as inline SVG (`ASY_ICON_PATHS`), the emoji each stands in for, `asyIcon` |
| `js/storage.ts` | `esc`, `ia_` program, log and history storage, set drafts, day history snapshots |
| `js/rest-day-shell.ts` | rest-day sheet and moves (`ia_moves_`), collisions, eligibility; global UI state (`activeProgId`, `currentWeek`, ...), `showScreen`, tab bar, toast |
| `engine/exercise-library.ts` | `EXLIB`, carry and press sides, `REP_AFFINITY`, minimum experience, station class, supersets, renames, `exStoreKey` and `EX_KEY_ALIAS`, `seededRand`, swap universe; `LIFTING_FOCUS_TO_GOAL`, `DEFAULT_1RM` |
| `engine/exercise-kinds.ts` | timed, rep-only and loaded movements (`isTimeExercise`, `isRepExercise`, `isTrackableWeight`), the equipment tokens, `roundWeight` |
| `engine/calendar.ts` | the day orders (`ALL_DAYS_ORDER`, `_ISO_ORDER`), local dates (`_isoOf`, `_parseLocalDate`), `getWeekMonday` |
| `engine/clock-format.ts` | `_clkMS` (m:ss, the one owner of the seconds limb), `_fmtMileAnchor` |
| `js/wizard.ts` | day names, wizard state and steps, start date, race and goal tables, 1RM calculator, pace inputs, `renderWizardStep` |
| `engine/nsw-cardio.ts` | `paceGoalTarget`, `calcProgramLength`, run progressions, cutback weeks, NSW Table 6 INT and CHI, `buildRunSession` |
| `engine/nrc-race-bike-swim.ts` | NRC goals and tables, race countdown, `raceAlignment`, `raceWeekPin`, `buildNRCSession`; `buildBikeSession`, `buildSwimSession` |
| `engine/cardio-progression.ts` | on-ramp, `PACE_CHART`, row pace, performance predicates, taper, multi-sport targets, `buildCardioProgression`, `spaceHardCardio`; the run anchor (`runAnchorInfo`) |
| `engine/prehab.ts` | hip, foot and ankle, and rehab sections, core pillars, gear lens, bodyweight substitutes |
| `engine/power-accessory.ts` | power and explosive dose and rest, bodyweight sets, accessory grammar, hinge clamp, prevention dose, bodyweight sweep, `_setLeadingSets` |
| `engine/core-legs.ts` | dynamic core, `injectDynamicCore`, NRC leg-lift placement, leg, adjacent-day and same-region deconfliction |
| `js/wizard-generate.ts` | `generateProgram`, length warning, mile and swim advisories, `doGenerate` |
| `engine/engine-a-b-calendar.ts` | Engine A timeline and split router; Engine B cardio, injury cardio sweep, `planCalendar` |
| `engine/injury.ts` | injury regions, `injuryPlan`, `applyInjuryFilter`, `injuryDayTitle` |
| `engine/engine-c.ts` | Engine C kinematic pool filter |
| `engine/region-caps.ts` | regional fatigue, set and move caps, cardio interference, region and pattern lenses, aux families, rep floor |
| `engine/swap-prefs.ts` | a swap the athlete made, carried into every build: `applySwapPrefs`, `_swapDetailFor`, `_swapInjuryOK` |
| `js/swaps-edits.ts` | exercise swap candidates (`auxSwapCandidates` too), swap store, day edits (add and skip), swap counts (the coach nudge store) |
| `engine/budget-engine-d.ts` | compound tiers, deload, posterior-chain lens, session budget, regional fatigue, Engine D, long-run tiers, race eve, sweeps, `buildProgram` |
| `js/random-wildcard.ts` | random workout, Wildcards |
| `js/week-view-sections.ts` | day helpers, start-date partial week, tips, hero, day codes, week strip, `renderWeekView`; RPE key, section rounds, `buildSectionsHTML`, `parseRx` |
| `js/set-logging.ts` | load recency, set auto-save, collapsed set bar, `buildExItem`, benchmark read-back, `buildCardioHTML` |
| `js/log-entries.ts` | exercise weights, entry day, `logExerciseWeight`, RPE, cardio dose grammar |
| `js/wheel-log.ts` | the wheel, cardio log fields, `buildLogHTML`, export, session progress |
| `js/rest-timer.ts` | the floating count-up rest stopwatch |
| `js/day-detail.ts` | e1RM calculator, range-top nudge, `openDetail`, KB chips, exercise weight steppers |
| `js/swap-sheet.ts` | swap sheet, add and skip handlers, undo swap |
| `js/day-status.ts` | swap nudge, `closeDetail`, RPE info, day status, cardio log, export copy |
| `js/programs.ts` | program race and start editing, program detail, goal sheet, mile pencil, program list |
| `js/overlays.ts` | temporary overlays (injury, travel), pace shift, overlay chip and sheets |
| `js/program-manage.ts` | `refreshProgram`, active program, rename, archive, purge and delete |
| `js/progress-data.ts` | progress screen entry, recovery pace trend, wizard seed, progress chips, ladder, class, easy, drift and ledger data |
| `js/progress-charts.ts` | chart builders, easy-zone charts |
| `js/lift-ledger-progress-screen.ts` | lift ledger model and cards; `renderProgressScreen`, dot charts |
| `js/bug-report-init.ts` | bug report, `init` |
| `js/popups-streaks-reminders.ts` | reinforcement pop-ups; streaks, stats, reminders |
| `js/update-check.ts` | version label, update banner and check, and the boot statements that end the script (they call `init`) |
| `html/screens-late.html` | `</script>`, progress and bug screens, tab bar |
| `html/popups.html` | reinforcement popup, confetti, `</body></html>` |

The cut points were measured and proved by `tests/measure/architecture_split_cutpoints.js` (its report is
`architecture_split_cutpoints.out.txt`); `docs/architecture-migration.md` has the plan these files are phase B of.
