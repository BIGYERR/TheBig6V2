# The app's source files

These files are Iron Asylum's source. The repo root `index.html` (the page GitHub Pages serves, the native app wraps
and every test boots) is built from them and is never edited by hand.

## How to change the app

1. Edit the file under `app/src/legacy/src/` that holds the code (`grep -rn <name> app/src/legacy/src/js` finds it).
2. Rebuild the root file: `cd app && npm run build:index`.
3. Commit the source files and `index.html` together.

`npm run build:index:check` fails unless `index.html` is exactly the build of these files, and prints the first byte
that differs and the source file it comes from. The 60-second check (`tools/check.mjs`) and CI run it, so a hand edit
to `index.html`, or a source edit that was never rebuilt, cannot land. In dev mode (`cd backend && npm run dev`) a
saved source file rebuilds the app at http://localhost:3000/app/ within a second; the root file still needs
`npm run build:index`.

## How the build works

`app/scripts/build-index.mjs` concatenates the files `order.json` lists, in that order, byte for byte, with nothing
added between them. `order.json` is the only list of pieces. A file under `html/`, `css/` or `js/` that it does not
list fails the build, as does an entry that is missing, listed twice, or not named in lower case words joined by
dashes. No file name carries a version.

The files carry no header of their own: every byte in them is a byte of `index.html`. A piece starts and ends where
the page does: `head.html` ends with the `<style>` open tag, `overlays.html` with the `<script>` open tag, and
`screens-late.html` starts with `</script>`.

## One script, one scope

The JS files are not modules. The build puts them back into the page's one inline `<script>`, so a top-level name in
one file is visible in every other, and an inline handler (`onclick="openDetail(...)"`) calls it as a global. Function
declarations are hoisted across the whole script, but a `let` or `const` must be declared before a statement that
runs at load time reads it, so the order in `order.json` matters. Every cut sits between two top-level statements,
and every CSS cut sits outside any rule, so each file parses on its own. One name is declared twice today:
`_isoToday`, in `wizard.js` and `overlays.js`. The later one wins, and both return the same date string.

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
| `js/storage.js` | icons, `esc`, `ia_` program, log and history storage, set drafts, day history snapshots |
| `js/rest-day-shell.js` | rest-day sheet and moves (`ia_moves_`), collisions, eligibility; global UI state (`activeProgId`, `currentWeek`, ...), `showScreen`, tab bar, toast |
| `js/exercise-library.js` | `EXLIB`, carry and press sides, `REP_AFFINITY`, minimum experience, station class, supersets, renames, `exStoreKey` and `EX_KEY_ALIAS`, `seededRand`, swap universe |
| `js/wizard.js` | day constants, wizard state and steps, start date, race and goal tables, 1RM calculator, pace inputs, `renderWizardStep` |
| `js/nsw-cardio.js` | `paceGoalTarget`, `calcProgramLength`, run progressions, cutback weeks, NSW Table 6 INT and CHI, `buildRunSession` |
| `js/nrc-race-bike-swim.js` | NRC goals and tables, race countdown, `raceAlignment`, `raceWeekPin`, `buildNRCSession`; `buildBikeSession`, `buildSwimSession` |
| `js/cardio-progression.js` | on-ramp, `PACE_CHART`, row pace, performance predicates, taper, multi-sport targets, `buildCardioProgression`, `spaceHardCardio` |
| `js/prehab.js` | hip, foot and ankle, and rehab sections, core pillars, gear lens, bodyweight substitutes |
| `js/power-accessory.js` | power and explosive dose and rest, bodyweight sets, accessory grammar, hinge clamp, prevention dose, bodyweight sweep |
| `js/core-legs.js` | dynamic core, `injectDynamicCore`, NRC leg-lift placement, leg, adjacent-day and same-region deconfliction |
| `js/wizard-generate.js` | `generateProgram`, length warning, mile and swim advisories, `doGenerate` |
| `js/engine-a-b-calendar.js` | Engine A timeline and split router; Engine B cardio, injury cardio sweep, `planCalendar` |
| `js/injury.js` | injury regions, `injuryPlan`, `applyInjuryFilter`, `injuryDayTitle` |
| `js/engine-c.js` | Engine C kinematic pool filter |
| `js/region-caps.js` | regional fatigue, set and move caps, cardio interference, region and pattern lenses, aux swap families, rep floor |
| `js/swaps-edits.js` | exercise swap candidates, swap store, day edits (add and skip), swap counts (the coach nudge store) |
| `js/budget-engine-d.js` | compound tiers, deload, posterior-chain lens, session budget, regional fatigue, Engine D, long-run tiers, race eve, sweeps, `buildProgram` |
| `js/random-wildcard.js` | random workout, Wildcards |
| `js/week-view-sections.js` | day and date helpers, start-date partial week, tips, hero, day codes, week strip, `renderWeekView`; RPE key, section rounds, `buildSectionsHTML`, `parseRx` |
| `js/set-logging.js` | load recency, set auto-save, collapsed set bar, `buildExItem`, benchmark read-back, `buildCardioHTML` |
| `js/log-entries.js` | exercise kind predicates, exercise weights, entry day, `logExerciseWeight`, RPE, cardio dose grammar |
| `js/wheel-log.js` | the wheel, cardio log fields, `buildLogHTML`, export, session progress |
| `js/rest-timer.js` | the floating count-up rest stopwatch |
| `js/day-detail.js` | e1RM calculator, range-top nudge, `openDetail`, KB chips, exercise weight steppers |
| `js/swap-sheet.js` | swap sheet, add and skip handlers, undo swap |
| `js/day-status.js` | swap nudge, `closeDetail`, RPE info, day status, cardio log, export copy |
| `js/programs.js` | program race and start editing, run anchor, program detail, goal sheet, mile pencil, program list |
| `js/overlays.js` | temporary overlays (injury, travel), pace shift, overlay chip and sheets |
| `js/program-manage.js` | `refreshProgram`, active program, rename, archive, purge and delete |
| `js/progress-data.js` | progress screen entry, recovery pace trend, wizard seed, progress chips, ladder, class, easy, drift and ledger data |
| `js/progress-charts.js` | chart builders, easy-zone charts |
| `js/lift-ledger-progress-screen.js` | lift ledger model and cards; `renderProgressScreen`, dot charts |
| `js/bug-report-init.js` | bug report, `init` |
| `js/popups-streaks-reminders.js` | reinforcement pop-ups; streaks, stats, reminders |
| `js/update-check.js` | version label, update banner and check, and the boot statements that end the script (they call `init`) |
| `html/screens-late.html` | `</script>`, progress and bug screens, tab bar |
| `html/popups.html` | reinforcement popup, confetti, `</body></html>` |

The cut points were measured and proved by `tests/measure/architecture_split_cutpoints.js` (its report is
`architecture_split_cutpoints.out.txt`); `docs/architecture-migration.md` has the plan these files are phase B of.
