# The engine in TypeScript: decisions

Architecture phase D (`docs/architecture-migration.md` §3): the app's engine, the 17 files `buildProgram` reaches
(phase C step 3), moves into `@ia/core` as strict TypeScript, `core/src/engine/<name>.ts`, a group of files at a time
in the order their imports allow. Each moved file is still a piece of the app's page: `order.json` names it
`engine/<name>.ts`, and `frontends/app/scripts/build-index.mjs` strips its types with Node's own stripper (strip mode:
a space for every character of a type, nothing else touched) and then takes those spaces out (`collapseTypes`), so the
page carries the JavaScript the file was written as. Tests: `frontends/app/test/integration/build-index.test.ts`
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
  byte the same but for `ia-version`; the inline script must be the same JavaScript tokens, in order, with a line break
  between the same pairs of tokens (a line break can decide where a statement ends, so joining two lines is a change).
  Other whitespace is free, and comments are listed, never judged (a comment never runs). Because the tokens are equal,
  the release cannot change behaviour, and every hunk of `git diff` on `index.html` is whitespace, a comment or the
  version.
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

## The page carries the JavaScript as it was written, text for text (v0.239.4)

- **Date:** 2026-10-12. **Decided by:** the session, inside the same standing answer. **Shipped:** v0.239.4.
- **Finding:** with the types stripped to spaces, the page's text moved where the tokens did not, and two tests that read
  the page's text by exact needle (`tests/integration/run-week-layout.test.ts`: the `_rank` key and `sportDayTargets`'s
  signature) failed on the cardio group. Nineteen engine test files edit the page's text (variants), and most of their
  anchors sit in `engine-c` and `budget-engine-d`, still to move.
- **The build takes the stripped types out** (`collapseTypes` in `build-index.mjs`): each run of erased characters goes
  with the blanks inside it; a type-only line goes whole; between two spaces one goes; a space before a type that closes
  against a token goes. It never takes a line break between two tokens away. Where taking a type out would join the next
  line to a statement, Node's stripper writes the semicolon itself, a token `same-script` would name. Thirteen cases are
  checked in `frontends/app/test/integration/build-index.test.ts`.
- **`node tools/engine-move.mjs <name> <ref>`**: after a file is typed, it rewrites the blanks between the TypeScript's
  tokens (never a type, never a token) until the page's text of the file is its JavaScript at `<ref>`, with only comment
  and blank lines added, and exits 1 naming the first line that differs in more. Every moved file passes it, so the
  tests that read the page's text read what they read before, and the variants keep their anchors.
- **Result:** the page against v0.239.2 differs only in its version line and 51 added comment or blank lines.

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
  version meta. `same-script`: 164,255 tokens equal, in order, against v0.239.2. (v0.239.4 takes the whitespace back
  out.)
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, unchanged);
  any screen; any stored key or value.

## Release scope: v0.239.4 moves the cardio engines

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.4.
- **Moved:** `nsw-cardio`, `nrc-race-bike-swim`, `cardio-progression`, the three cardio files that import each other,
  typed and never changed. Their own types sit beside the code: `PaceRow` and `PaceCol` (the pace chart),
  `SportTargets`, `TaperWindow`, `CardioSchedule`, `EngineCfg` (the cfg with `_racePin` for one build), `RunAnchorInfo`;
  `EngineCardioGoals`, `PaceTarget`, `ChiDose`, `PaceProgression`, `CardioSession` (a builder's session before the
  scheduler adds `legLoad`), `TaperStep`, `QualityPhase`, `RunProgression`; `RaceCountdown`, `RaceAlignment`,
  `RacePin`, `NrcWeek` (an NRC plan week, as transcribed), `SwimPace`. The run and bike builders' trailing
  `arguments[N]` inputs are typed by an overload; the statics `buildRunSession` hands `buildRunProgressionForLength` by
  an ambient namespace; both erase. `@ia/core`'s `MileBestSource` gains the fields an edited mile best records (`at`,
  `wk`, `from`), and the shape check knows them.
- **Six `@ts-expect-error`:** five on date arithmetic (`race - today`, a Date minus a Date) and one on boolean arithmetic
  (`(a==='run')-(b==='run')`), each the cleanup pass's.
- **Also in this release:** the build's `collapseTypes` and `tools/engine-move.mjs` (above), which take the leaf files'
  stripped whitespace back out of the page.
- **Changes in `index.html`:** against v0.239.3, whitespace (the leaf files' stripped types, gone) and 34 comments added;
  against v0.239.2, 51 comment or blank lines and the version. `same-script`: 164,255 tokens equal, in order, with the
  same line breaks, against both.
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, unchanged);
  any screen; any stored key or value.

## Release scope: v0.239.5 moves swap-prefs and Engine C

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.5.
- **Moved:** `swap-prefs` (the permanent swaps and their detail) and `engine-c` (`engineC_kinematics`, the pools, the
  RPE schemes and `buildSections`), typed and never changed. Engine C's own types sit beside it: `WaveEntry` (a week of a
  lifting wave), `EngineATimeline` and `EngineBCardio` (what it reads of Engines A and B, which move next),
  `BuildSectionsOpts`, `EngineC`, and the week's movements (`WeekExercises`). Three signatures the moved callers showed
  were narrower than the code: `isTrackableWeight` gains an overload for the detail `swap-prefs` passes and it does not
  read; `_bwSetsFromDetail`'s week, experience and prevention flag, and `buildFootAnkleSection`'s race week, are optional
  as the callers use them; `_cardioInterference` takes any session with a type (a builder's or a program's).
- **No `@ts-expect-error`** in either file; one `!` reads the pull day's first row as present (`ex.backRow[0]!`), as the
  code does.
- **Changes in `index.html`:** 7 comments added and the version. `same-script`: 164,255 tokens equal, with the same line
  breaks, against v0.239.4; against v0.239.2 the page differs only in its version line and 59 comment or blank lines.
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, unchanged);
  any screen; any stored key or value.

## Release scope: v0.239.6 moves Engines A, B and D, and the engine is whole in @ia/core

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.6.
- **Moved:** `engine-a-b-calendar` (Engines A and B, the injury cardio sweep, `planCalendar`), `core-legs` (the core
  injector, the leg and region deconfliction, the adjacent-day dedupe) and `budget-engine-d` (the deload, the session and
  regional caps, Engine D and `buildProgram`), the three files that import each other, typed and never changed. All 17
  engine files are now strict TypeScript in `core/src/engine`, and `core/src/engine/index.ts` exports `buildProgram`
  (`@ia/core/engine`). New types: `EngineA`, `EngineB`, `DayRoles`, `CalendarPlan`, `CorePillars` (the precise shape
  of `CORE_PILLARS`), and the passes' own (`NrcRunShape`, `AdjPair`, `CoreDayView`, `SessionView`). `CardioSchedule` is
  keyed by string (the passes walk it with `Object.keys`). `raceWeekPin` takes the two fields it reads.
- **Two global declarations, both erased:** the tests' cap switches on `globalThis` (`__CAP_OFF` and the rest), and an
  overload of `Array.prototype.concat` for a `never[]` receiver, so `[].concat(a, b)` (the engine's idiom for collecting
  into a fresh array) is typed by what it collects.
- **Two `@ts-expect-error`**, both on one finding: `core-legs` reads `cardio.assignedType`, which no session carries, so
  the core injector's hard-run slot never fires (handoff §12, for a ruling; the move types the read as it runs).
- **Test:** `tests/integration/engine-modules.test.ts` imports the engine by its package name and builds every seeded
  program to the page's digest (it fails on v0.239.5, whose `@ia/core/engine` exported nothing), and checks every
  engine file is TypeScript in `core/src/engine`.
- **Changes in `index.html`:** 11 comments added and the version. `same-script`: 164,255 tokens equal, with the same
  line breaks, against v0.239.5.
- **Does not change:** any program (the program-output golden files, HALF_MANNY and the 864-config lattice, unchanged);
  any screen; any stored key or value.
