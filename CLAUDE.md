# Iron Asylum — standing rules for every agent in this repo

Read this before touching anything. The long-form record is `IRON_ASYLUM_HANDOFF_1_1.md`
(architecture §3–§8, workflow §9–§10, standing lessons §10b, rulings §11f, open items §12,
digest at the tail). This file is the short version that must never be violated.

## PRIORITY 1: semantic versioning (Mario, Post-V239). It outranks everything below.
Every version is `MAJOR.MINOR.PATCH`. **Nobody writes or says a future release as `V<N>` or as a bare integer**: not in
chat with Mario, a brief, a ruling, a report, a file or folder name, a script, a commit message, the handoff or memory.
Mario has had to repeat this more than once; a session that makes him say it again has broken this rule.
- **The past is integer, the future is dotted.** Builds 1 to 239 are `V1` to `V239` (each one is v0.N.0; V239 = 0.239.0)
  and keep their tags, digest lines and file names. `Post-V239` is the right label for a pass made after
  V239 and before the first dotted release. Every release from `0.239.1` on is `v<MAJOR.MINOR.PATCH>`. Example: the build
  once called "V240" is `v0.240.0`.
- **Names: a version appears only where a version belongs** (Versioning, below, has the full list): the `ia-version`
  meta; the tag `v0.240.0`; the commit subject `v0.240.0: <one line>`; the digest line `- **v0.240.0** — …`; the
  release line of a decision entry in `docs/decisions/<feature>.md`; and a scratch copy of a release's body,
  `base_v<previous>.html`, where `<previous>` is the version HEAD carries, never "N-1".
- **Feature files carry no version** (Mario, Post-v0.239.1). Tests are `tests/unit/<feature>.test.ts` and
  `tests/integration/<feature>.test.ts`, snapshots `tests/snapshots/<feature>.json`, rulings
  `docs/decisions/<feature>.md`, measure scripts `tests/measure/<feature>_<question>.js` (Test layout). No
  `v<version>_rulings/` folder is made. Files written before Post-v0.239.1 keep their names (`tests/measure/v0.240.0_*`).
- **Code** reads, compares and prints a version only through `tests/semver.js` (or `@ia/core`'s `semver`): never `+version`, a
  string compare, `'V'+n` or arithmetic on a version. `SV.tag(v)` prints the label: `V239` for an old build, `v0.239.1` for a new one.
- **Mario picks PATCH, MINOR or MAJOR** before every release (Versioning). Nobody infers it.
- **A future `V<N>` anywhere is a defect.** One found in a brief, a template, a handoff line, a file name or an agent's
  return is corrected to the dotted form before it is used or repeated, and the correction is reported. builder and
  gatekeeper do not load this file, so every agent file and skill carries this section at its top.

## What this is
Vanilla HTML/CSS/JS PWA served as one page (`index.html`, ~1.3 MB, one inline `<script>`) that
generates multi-week hybrid strength + cardio programs from a seeded, deterministic engine
(Engine A → B → C → D inside `buildProgram(cfg)`). **The page is generated** (architecture phase B, Post-v0.239.1):
`frontends/app/scripts/build-index.mjs` builds it byte for byte from its source files under `frontends/app/src/legacy/src/` (the app's files in `js/`, TypeScript in place since v0.239.44, their type debt marked by `tools/ts-expect.mjs`,
its CSS files and HTML partials; `order.json` lists every one) and the engine's TypeScript under `core/src/engine/` (all 17 engine files, architecture phase D:
`order.json` names each `engine/<name>.ts`, and the build strips its types out, `tools/engine-move.mjs` keeping the page's text
the JavaScript's), joined in the order `order.json` lists, into `dist-github-pages/` (gitignored: the page and
its icon, what GitHub Pages deploys from the pipeline once its source is "GitHub Actions", what every test boots, what the
backend serves at `/app/`). Until Mario switches the Pages source, Pages serves the branch `main`'s root `index.html`, a
committed copy of that build: code is edited in the source files, then `cd frontends/app && npm run build:index` writes both,
and the sources and the root copy are committed together (handoff §12 has the switch). Each JS
source file is also an ES module (architecture phase C, step 1): `npm run build:index` first rewrites its import and
export blocks from the code (`scripts/module-blocks.mjs`), the build strips them, and the tests can import the engine
straight from the sources (`tests/support/engine-modules.ts`). The root file is
never edited by hand; the 60-second check and CI fail when it is not the build of the sources. Doctrine: NSW Physical Training Guide for
test goals (pace, mile, 1.5-mile, base) and Nike Run Club plans for race goals (5K/10K/half/
marathon). Deployed by GitHub Pages at https://bigyerr.github.io/TheBig6V2/ . iOS-only PWA.
Mario is the sole developer, product owner and primary user.

## Roles: four hats, ONE context, no subagents (Mario, 2026-10-12)
Mario: "please stop using multi-agent? our context required is too big and it is much cheaper and efficient to have just 1
context at work at a time ... we do NOT spin up agents like that ever again (unless I explicitly ask for it)".
- **The main session does all the work itself, in this one context.** No subagents, no parallel agents, no agent worktrees,
  unless Mario explicitly asks for one in chat. `.claude/settings.json` makes every `Agent`/`Task` launch ask Mario
  first; never ask to launch one on your own initiative.
- **The four roles are hats the main session wears in order,** and the files in `.claude/agents/` are their checklists
  (read the one you are switching to):
  - **measure**: the before-picture. Prove a reported bug at the reporter's seed, sweep the configs, name the root
    cause and every other reader of the same value, with numbers and denominators. No ruling, no fix.
  - **coach**: coaching correctness and doctrine; rules on WHAT should ship, against the measured numbers.
  - **builder**: edits the source files under `frontends/app/src/legacy/src/` and `core/src/engine/` directly and narrowly, rebuilds `index.html` from
    them, and writes the feature's tests (Test layout). Never invents a ruling.
  - **gatekeeper**: proof (Proof for new work): the 60-second check, each test for a changed behaviour fails on the
    previous release, every changed behaviour has a test, every diff hunk is classified, and the CI run is read.
- **The order still binds:** measure, then the ruling written to `docs/decisions/<feature>.md` (Mario concurs on
  doctrine), then the edit, then the proof. **Proof blocks ship:** no version is done until the CI run on the commit Mario
  releases is green, each test for a changed behaviour fails on the previous release, every changed behaviour has a test,
  and every diff hunk is classified.
- **Keep the context small:** grep before reading, read narrowly, keep long command output in files and read back only
  summaries, and write scripts that gather everything in one run.

## Session rhythm (do not skip steps)
**Versions are not tied to chats (Mario, Post-V239).** Semantic versions and git track every release, so a chat may
carry several versions and tooling passes, and a version may start in any chat. Never ask Mario to open a fresh chat for
a build. A compaction mid-build is not a stop: re-read the tree state (`git status`, `ia-version`, the handoff's §12 and
D-CODE REGISTRY lines) before the next step; a builder slice either landed whole or stays parked (its diff saved as a
patch in the scratchpad, nothing committed), and nothing merges into `main` that the pipeline has not proved. Standing rules live in this file; per-build scope lives in
handoff §12.
**One writer per working tree (Mario, Post-V238).** While a build is in flight, from the first builder dispatch to the
deploy proof, one session writes to this working tree. Any other session that needs to write (a measure, a queue review,
a docs pass) works in its own git worktree or waits until the build commits. V238's final hash went red on another
session's files written into `tests/measure/` mid-proof.
**A D-code travels with its decision file (Mario, Post-v0.250.0).** The session that issues a D-code commits the handoff's
registry line and the decision file it names together, at once, in a `docs:` commit, so no other session's commit carries
the line alone. A session that finds another's uncommitted registry text in its own commit says so in its report.
v0.250.0 carried the D258/D259 line to `dev` while `docs/decisions/speed-work.md` stayed untracked.
**Never name a D-code to Mario before it is in the registry (Mario, Post-v0.254.0).** Until the registry line that
issues it is written, a ruling is "the next D-code" in chat, a brief and a report. The number is read from the registry
in the same step that writes the decision file. v0.254.0's ruling was promised as D265 in chat; a concurrent session
issued D265 before the ruling was written, and it shipped as D266.
1. `session-start` skill: confirm `index.html`'s `ia-version`, confirm the handoff header and a digest line agree with it, and print the deploy picture (step 7).
2. **Measure before designing.** `measure` runs the harness across the relevant configs and prints the before-picture (`node tests/harness.js index.html --grid`, or a purpose-built measure script in `tests/measure/`, kept as `<feature>_<question>.js`).
3. **Design before coding.** Coach issues a ruling (D-code) with coaching rationale and the before/after week grid. Mario concurs or pushes back. Coaching correctness overrides technical convenience. The main session appends the ruling to its feature's decision file (Proof for new work).
4. **Ask Mario for the bump** (Versioning, below): PATCH, MINOR or MAJOR, before the first builder dispatch. Builder ships: narrow edits to the source files under `frontends/app/src/legacy/src/` (every text replaced occurs exactly once in the file it edits before it is replaced), `index.html` rebuilt from them (`npm run build:index`), the feature's tests (Test layout), `ia-version` set to the version Mario picked, exactly when he says so. **Right before every builder dispatch**, re-read HEAD against `origin/dev` and `origin/main`, `index.html`'s `ia-version` and the handoff's D-CODE REGISTRY line: Mario runs concurrent sessions, and V202 shipped from another one mid-design. If the version moved, the ruling goes back to coach before anything is written.
5. Gatekeeper proves it as **Pipeline** and **Proof for new work** (below) set out: locally inside 60 seconds, then the full suite in CI on the push to `dev`, which Mario reviews. Green, or a NAMED failing test.
6. `handoff-update` skill: the seven-element session entry, with the release line of each decision this version shipped filled in (`docs/decisions/<feature>.md`). Then stage the build's files by path (every tracked change and every untracked file the build wrote; **never
   `git add -A`**, Mario, Post-V238) and commit on `dev` (`git commit -m "v<version>: <one line>"`; the pre-commit hook runs the 60-second check).
   **Push only when Mario asks** (`git push origin dev`), and never wait on CI (Mario, Post-v0.250.0): the push runs the full suite there and Mario
   reviews it himself; read a run (`gh run list --branch dev --limit 1`, `gh run view <id>`, `gh run download <id>`) only when he asks. **Mario opens
   every pull request into `main` himself, by hand, after reviewing those results; no agent ever opens one (Mario, Post-V239).** When he has merged it, tag what merged: `git fetch origin && git tag v<version> origin/main && git push origin v<version>`.
7. **Report the deploy picture; a lagging deploy does not block** (Mario, Post-V239). A push or a merge is not a deploy:
   Pages can report `built` with no error while sitting several commits behind (it silently did not fire on V192 or
   V193). At session start and after every push or merge, read each of these from its own source, never inferring one
   from another, and print them to Mario as one block:
   - local: the working copy's `ia-version`, its branch and HEAD, and how far HEAD is ahead of or behind `origin/dev`;
   - GitHub: `git show origin/dev:frontends/app/src/legacy/src/html/head.html` and the same for `origin/main` (a `main` from before phase B: its `index.html`), each `| grep -oE 'name="ia-version" content="[^"]+"'` (read out of the remote refs, not the working copy);
   - Pages: `gh api repos/bigyerr/TheBig6V2/pages/builds/latest --jq '.status, .commit'`, and whether that commit is `origin/main`;
   - live: `curl -s "https://bigyerr.github.io/TheBig6V2/?cb=$(date +%s)" | grep -oE 'name="ia-version" content="[^"]+"'`. Cache-bust the query string; `cache-control` is `max-age=600`, so an unbusted fetch can lie for ten minutes;
   - any local build that records its own version, when one exists (the native app's `frontends/app/config.xml`, a running local PWA server);
   - TestFlight: `node frontends/app/scripts/testflight.mjs leg`, the TestFlight notice of the newest pipeline run on `main` (only CI holds the App Store Connect key): the build App Store Connect reports as processed, or why the upload skipped.
   ```
   DEPLOY  local 0.239.1 (dev a1b2c3d, +0/-0 origin/dev)  dev 0.239.1  main 0.239.0  pages built e4f5a6b  live 0.239.0  native 0.239.1  testflight 0.239.0 processed
   ```
   The pipeline's `deploy proof (Pages)` job checks the main, Pages and live legs on every push to `main`
   (`tools/deploy-check.mjs`); read its result, or run `node tools/deploy-check.mjs --expect <version>` yourself. When
   live lags `main`, say so and recommend forcing a Pages build (`gh api -X POST repos/bigyerr/TheBig6V2/pages/builds`,
   ~40 s); Mario may leave it behind. Tell Mario the live number you read back, never the number you pushed.

## Pipeline (Mario, Post-V239): fast locally, the full suite in CI, `main` only by pull request
- **Branches.** Work lands on the local `dev` branch in the main checkout: commit there as often as needed. Only that
  branch, from that checkout, is ever pushed to `origin/dev`. Every push to `dev` runs the full suite in
  CI and nothing waits for it; Mario reviews the results and, to release, opens the pull request into `main` himself.
  `main` is what Pages serves and what Heroku deploys: Heroku's automatic deploy from GitHub builds every push to
  `main` with the repo root's `package.json` and `Procfile` (the website, the admin, the app at `/app/` and the
  backend, one dyno; Mario, Post-v0.242.0), and `backend/scripts/heroku.sh deploy` is the manual path. Branch
  protection lets `main` change only through a pull request from `dev` whose pipeline checks all passed; its required
  checks are the pipeline's PR job names, kept in GitHub's settings, not in the repo, so a renamed job is renamed there
  too. A branch off `dev` is rare and merges back into local `dev`, never into `main`.
- **A worktree never pushes (Mario, Post-V239).** A session in a git worktree (`.claude/worktrees/*`) commits on its own
  branch and never runs `git push`, not to `dev` and not to any other branch. When its work is done it rebases that
  branch onto the current local `dev`, fast-forwards local `dev` to it (`git -C <main checkout> merge --ff-only
  <branch>`), then deletes the worktree and the branch. If a build is in flight in the main checkout (One writer per
  working tree), it waits until that build commits. Its work reaches GitHub with the main checkout's next push. On
  Post-V239 the semver worktree pushed three commits straight to `origin/dev` while the main checkout held four
  unpushed ones, and `dev` forked (4 ahead, 3 behind) on a project with one developer. `.githooks/pre-push` enforces
  this for pushes to GitHub: it refuses any push from a worktree, and from the main checkout anything but local `dev`'s
  own commit to `dev`, or a tag. A worktree runs the hooks of the commit it has checked out, so one made from `dev`
  carries the guard.
- **Local proof is 60 seconds, hard.** `node tools/check.mjs` runs four lanes and stops at 60 s: tests (the type
  check of `core/` and `tests/`, and the unit and integration tests by Vitest), build (the page builds from
  `frontends/app/src/legacy/src/` into `dist-github-pages/`, its version meta, its inline script compiles, it boots and builds
  HALF_MANNY self-stable, and the root copy is that build byte for byte), app (sync, type check, tests, lint) and backend (type checks, tests, lint). The pre-commit hook
  (`.githooks/pre-commit`, `--staged`) runs the lanes a commit touches. No local step waits longer than 60 s: anything
  slower belongs in CI.
- **The full suite runs in CI** (`.github/workflows/pipeline.yml`) on every push to `dev`, and again on the pull request
  into `main`: the unit and integration job (the build check, the harness boot, the type check, then Vitest over
  `tests/unit`, `tests/integration` and `tests/sweeps`), the app and backend tests and lint, the Docker e2e, and the native job (the app built for the iOS simulator on a
  macOS runner, unsigned; Native, below). Every
  job must pass to merge, and each uploads its run log (`temp/`) as an artifact. After a merge the `deploy proof
  (Pages)` job runs.

## Test layout (Mario, Post-v0.239.1): a test is named for the feature it covers
- **Folders.** `tests/unit/<feature>.test.ts`: pure logic, one function lifted out of `index.html` and run alone
  (`appFunction`), or one imported from `@ia/core`. `tests/integration/<feature>.test.ts`: the app booted in the VM
  harness, programs built, behaviour checked (`loadApp`, `loadApp({ dom: true })` for a document that keeps its
  elements, `pinClock`). `tests/sweeps/<feature>.test.ts`: the slow ones, a lattice or a fuzz over many programs; CI
  runs them, the 60-second check only type-checks them (a file in `tests/unit` or `tests/integration` runs in a few
  seconds). `tests/snapshots/<feature>.json`: one current golden file per feature for program output;
  `tests/sweeps/program-output.test.ts` holds the digest of every program on the 864-config lattice
  (`tests/snapshots/program-output-lattice.json`), so any change to what the engine prescribes shows as a reviewable diff. The helpers are
  `tests/support/app.ts` and `tests/support/snapshot.ts`, built on `tests/harness.js` (CommonJS, loaded through
  `createRequire`), and `tests/support/programs.ts`, the seeded configs typed as `Cfg`. `tests/e2e/`: the Docker e2e (journeys, parity, the
  collage over the website, the admin and the app; `cd tests && npm run e2e`, its README), whose own code is tested
  in `tests/unit/e2e-*.test.ts` and `tests/integration/e2e-browser.test.ts`.
- **TypeScript and Vitest** (architecture phase A). Every test is strict TypeScript run by Vitest (`import { describe,
  test } from 'vitest'`, `node:assert/strict` inside). `tests/` is its own package: `tests/package.json` and its
  lockfile are committed, `tests/node_modules` is not. The repo root, which Pages serves, holds no `tsconfig.json`; its
  one `package.json` is Heroku's build manifest (Pipeline), so the shared strict base is `core/tsconfig.base.json`.
- **Run.** `cd tests && npx vitest run unit integration` (a few seconds; `npx vitest run` adds the sweeps; `npm ci`
  there first on a fresh clone, which the 60-second check does by itself), and the type check `cd tests && npm run
  typecheck` (strict `tsc` over `core/`, then `tests/`). `IA_APP=<file>` runs the same tests against another body of
  the app (an absolute path, or one relative to `tests/`).
- **Shared types and code.** `core/` is the local package `@ia/core`: framework-free TypeScript, imported by the
  tests as `"@ia/core": "file:../core"`. The domain types live in `core/src/domain` (`Cfg`, `Program`, `Week`, `Day`,
  `Section`, `Item`, `LogEntry`), with runtime shape checks the compiler keeps in step with them;
  `tests/integration/program-shape.test.ts` and `tests/sweeps/program-shape.test.ts` walk real programs through them,
  so a field the engine adds, drops or retypes turns a test red until the type is changed to match. A test imports a type or
  shared logic from `@ia/core`, never a copy. The release version lives in `core/src/version.ts`: until the build writes the
  meta from it, a release writes the same MAJOR.MINOR.PATCH there and in the `ia-version` meta (`frontends/app/src/legacy/src/html/head.html`,
  built into `index.html`), and `tests/unit/semver.test.ts` is red when they differ; the same version goes into `frontends/app/config.xml` (`cd frontends/app
  && npm run version-ios`), and `frontends/app/test/unit/native-version.test.ts` is red when it lags. From phase D on, new shared logic and the
  engine code moved out of `index.html` go in `core/` (`docs/architecture-migration.md`).
- **Naming.** A test file is named for the feature it covers, in lower case words joined by dashes (`rest-timer`,
  `version-label`, `program-output`), never for a version, a D-code or a gate. A new behaviour goes into its feature's
  file; a new file is a new feature. A test's name says the behaviour in plain words.
- **Snapshot update.** Only when a ruling moves program output: `cd tests && UPDATE_SNAPSHOTS=1 npx vitest run
  integration/<feature>.test.ts`, then review `git diff tests/snapshots/`. These are the suite's own JSON files, not
  Vitest's snapshots, so `vitest -u` changes nothing here. The diff is the review, and it ships in
  the release commit. When HALF_MANNY moves, the regenerated digest equals the one coach printed before the build
  (standing ruling 5). A snapshot is never regenerated to turn a red test green without a ruling.
  **Every sweep before the release commit (Mario, Post-v0.250.0).** When a ruling moves program output, run the whole
  `tests/sweeps` folder locally on the candidate, in the background (`cd tests && npx vitest run sweeps > <scratch>/sweeps.out
  2>&1`), before the release commit. Sweeps keep their own golden counts that ride on what a program prescribes, and the
  60-second check never runs them. Every golden file it turns red is classified against the ruling, regenerated under it
  and named in its blast radius, in the same commit. v0.250.0 regenerated the two program output files, and CI then
  failed on two sweep censuses D260 also moved.

## Proof for new work (Mario, Post-v0.239.1)
- **CI is the gate.** The unit and integration tests and the type check run in the 60-second check and in CI on every
  push to `dev`; the release is proved by the CI run on the commit Mario releases (Pipeline). Gatekeeper reads it, and also:
  - runs each new or changed test on the commit before the change (`node tools/app-at.mjs <previous>
    <scratch>/base_v<previous>.html`: that commit's root copy, or the build of its sources; then `cd tests && IA_APP=<that
    file> npx vitest run <file>`; a test that reads source files instead of the page, the native app's
    `frontends/app/test`, runs on a copy of the previous commit's sources: `git archive <previous> frontends/app core |
    tar -x -C <scratch>/prev`, the main checkout's `frontends/app/node_modules` linked in, the changed test files copied
    over, then `node --test` on them): a test written for a changed
    behaviour must fail there, and one that passes on both is vacuous unless its file says it guards behaviour that
    must not change;
  - matches every behaviour the ruling changes to a named test; a changed behaviour with no test is red;
  - reads every hunk of the diff on the page (`git diff` on the root copy; after the Pages switch, `tools/app-at.mjs` of
    both commits) and on `tests/snapshots/`, and classifies each against the ruling. A release meant to change no
    behaviour (a phase D engine move) is classified whole by `node tools/same-script.mjs <previous page> <this page>`:
    the same script tokens, so every hunk is whitespace, a comment or the version.
- **Oracles.** Expected values are typed by hand from the ruling, the doctrine text or date arithmetic, never asked of
  the app; a snapshot is the one deliberate exception, a golden file in git regenerated only on purpose. Seeds are
  pinned, clock fields stripped, and a program equals itself built twice before it is compared.
- **Rulings** live in `docs/decisions/<feature>.md`, one file per feature. The main session appends each ruling as it
  is made: its date, its D-code, who ruled, the finding, what changes, what deliberately does not, the expected values
  or after-grid, and the release that shipped it, filled in at ship time. A re-ruling is a new entry naming the one it
  amends. Measure scripts and their saved reports stay in `tests/measure/`, named `<feature>_<question>`.
- **The legacy gate suite is gone** (test-migration phase 3, Post-v0.239.1): `tests/gates/`, `gate.sh`, the row manifest
  and its licences, era rows and `era_bump.py`, sabotage and its specs, the edit scripts and the identity fuzz were
  deleted after every gate row was mapped to a feature test or dropped for a written reason (`docs/test-migration.md`
  and `docs/test-migration/*.md`). Their history is in git. Builder edits the source files under `frontends/app/src/legacy/src/`
  directly and narrowly and rebuilds `index.html`; the git diff is the record.

## Friction report (Mario, standing from V234)
After each build, before the digest line, report to Mario in five lines or fewer any of these that happened (only when
something fires):
- a rule had to be interpreted or worked around to fit the change, naming the rule and the workaround;
- the proof came close to the 60-second limit, or a CI job had to be rerun;
- any step the rules required that proved nothing new on this build.
For each item, say in one line whether you would change the wording and to what. Never adapt to an awkward rule
silently: if a rule is wrong, the fix is a wording change Mario approves, not a workaround that becomes a habit.

## Standing rulings (settled — do not re-ask, do not re-derive)
Each of these was paid for in a session. They are not open questions, and no agent reopens one
without new evidence that contradicts the ruling itself. Rulings 2, 4 and 6 governed the gate suite and agent briefs,
and retired with them (Post-v0.239.1); the numbers stay so older references still point at the right ruling.

1. **A tests-only pass is not a version.** `ia-version` does not move, so nothing shipped: commit as
   `tests: Post-v<version> tooling pass` (`Post-V<N>` before semver), cut **no tag** (tags track `ia-version`; a tag
   on an unmoved artifact points at a lie), and give it a digest line named for what it was,
   `- **Post-v<version> … — no build.**`, **never a version of its own**. Nothing reaches the phone, so the deploy
   picture (rhythm step 7) has nothing new to report.
2. *Retired with the gate suite* (a licence is a predicate keyed on `ia-version`).
3. **A declared constant nothing reads gets its assertion wired, not deleted** — unless the claim itself
   is unruled, in which case the constant goes. A dead pin looks maintained and defends nothing, and
   **re-pointing one is worse than either**: it makes a vacuous line look freshly maintained. Before
   repointing any pin, `grep -c` the symbol and require more than the declaration.
4. *Retired with the gate suite* (a gate file is keyed to the ruling it defends).
5. **`HALF_MANNY` moves only by ruling.** Coach prints the new digest from a source-surgery copy **before** the build,
   and **every changed card is printed before and after**. The build then regenerates the golden files
   (`cd tests && UPDATE_SNAPSHOTS=1 npx vitest run integration/program-output.test.ts`, and the lattice sweep when the
   ruling moves it) and the regenerated HALF_MANNY digest must equal the one coach printed. A digest read off the built
   artifact after the fact is never a pin, and a snapshot is never regenerated without a ruling.
6. *Retired with subagents* (builder briefs over four edits were sliced). One context still edits in small steps and
   re-reads the tree between them.
7. **When measure refutes a ruling's premise, it goes back to coach before builder — always.** A premise
   that did not survive the measure is a hypothesis, not a ruling, and building on it ships the wrong
   thing twice. Coach may retract; that is the system working, not a failure. **If the refutation lands
   mid-edit, the edit PARKS** (its diff saved as a patch in the scratchpad, nothing committed), coach re-rules, and the
   parked edit is resumed as-is if the re-ruling leaves it intact, or discarded if it does not. **A test that cannot pass
   is a measure too:** when writing a test shows a ruling's claim is false, the test is parked (never written as a pass
   or a skip), measure quantifies it, and coach re-rules (V221: D177's frozen-day re-swap).

**Mario is asked only for doctrine calls:** which pattern or quality survives, ship or hold, and anything
that changes his own program. Siting, form, test scope, order of work and tooling shape are the session's to
decide and to record. This narrows WHAT reaches him; it does not soften the rule below that everything
which does reach him arrives with a recommendation.

## Versioning (hard; semantic versioning from Post-V239, Mario)
- `<meta name="ia-version" content="MAJOR.MINOR.PATCH">` is the ground truth: three integers. Code reads and compares
  versions only through `tests/semver.js` (or `@ia/core`'s `semver`): `parse`, `cmp`, `lookup`, `fromHtml`. Never
  `+version`, a string compare, or arithmetic on a version; a version used with a numeric operator throws on purpose.
  Code that runs without the repo beside it (`backend/` deployed alone to Heroku, a Docker image holding one folder)
  may carry its own copy of the rule, provided a test in that folder loads `tests/semver.js` at test time and proves
  the two agree on a shared table of inputs (legacy integers, dotted versions, rejects, ordering), so the copy cannot drift.
- **Before: builds 1 to 239** each carried one integer N. Every one of them is **v0.N.0** (V239 = 0.239.0). Their
  tags stay `V<N>` and their digest lines stay `**V<N>**`, and their files keep their names (`v<N>_rulings/`); never
  rewrite them. Every reader takes a bare integer N as 0.N.0, so bodies
  from git history still parse and compare.
- **After: from 0.239.1 on**, each release bumps exactly one part and zeroes the parts to its right.
  - **PATCH** (0.239.0 → 0.239.1): a bug fix. No new capability, no change to what a program prescribes, no stored-format change.
  - **MINOR** (0.239.1 → 0.240.0): a feature or a feature group, or a ruling that changes what a program prescribes.
  - **MAJOR** (→ 1.0.0): a breaking change (stored data that needs a migration) or a milestone Mario declares. The app
    is pre-1.0 until he says so.
- **Mario picks the bump, every release.** Before the first builder dispatch, the main session asks him PATCH, MINOR
  or MAJOR with `AskUserQuestion`: the recommended option first, every option naming the number it produces and one
  line on why. A bump is never inferred from the queue, the handoff or an earlier chat. If the build grows past the
  class he picked, ask again before the meta is written. Never out of order, never two sessions on one number;
  builder writes the number Mario named and nothing else.
- **A version goes up to TestFlight once** (Mario, Post-v0.251.1). App Store Connect refuses a second build of one
  version, so a merge that carries a version it already holds skips the upload, and a fix is the next PATCH (Native).
- Names from 0.239.1 on carry the dotted version with a lowercase v, and only where a version belongs (PRIORITY 1): the
  `ia-version` meta, tag `v0.239.1`, commit subject `v0.239.1: …`, digest line `- **v0.239.1** — …`, the release line
  of a decision entry, and a scratch copy of a release's body. Files made from Post-v0.239.1 on are named by feature,
  never by version (Test layout). Files made before keep their names (`tests/measure/v0.239.1_rulings/`). A tests-only pass after a release is
  `Post-v0.239.1`.
- The app's one HTML page is `index.html`, built from `frontends/app/src/legacy/src/` (Pages deploys it). The previous version
  is the release HEAD carries, never "N-1": `node tools/app-at.mjs HEAD <scratchpad>/base_v<previous>.html`. Tag each
  release: `git tag v<version>`.
- A file version with no digest line in the handoff means a build was dropped. Stop and tell Mario.
- **Grep the file, never trust a label.** Filename, chat title, memory and handoff can all lag the artifact.

## Engineering invariants (from §10b — each one was paid for)
- Every shell pipeline that proves something is `bash -c 'set -eo pipefail; …'` with `;` separators. `set -e` alone lets a pipe swallow node's exit code. Delete artifacts before regenerating them; an empty diff is a failure, not a clean result.
- No process substitution `<(...)` — use temp files.
- Oracles are independent: a test never asserts the engine equals its own output. Hand tables, the doctrine text, date arithmetic; a golden snapshot is the one deliberate exception.
- A test file that crashes before its first test, or registers no tests, is a failure, never a pass. Count a ported or rewritten file's tests against the original: phase 2's pace-clock lattice helper returned its tests instead of registering them, and two sweeps and two integration files ran green without their lattices (Post-v0.239.1).
- Run every new or changed test against the previous release first (`IA_APP`). A test that passes on both is not testing what it claims.
- Every hunk of the diff on `index.html` and `tests/snapshots/` is classified against the ruling before ship. A removal that was not ruled is a regression (a ruling that SELECTS is not a ruling that DELETES).
- Pin `cfg.seed`, strip clock fields, and prove a program equals itself built twice before comparing anything.
- Any harness stub that accepts a callback must be able to run it. `requestAnimationFrame` that never fires deletes a code path from the test.
- Rename passes: a map whose KEYS are old names is rewritten LAST, or excluded from the sweep. No alias row may self-map or chain.
- A conditional write with no else branch is a latch. Move claims onto the item they describe, never onto a section label that a later filter can falsify.
- Pool and post-filter must reason about a movement through the same lens; when one part of the build asserts something about a movement, grep for the other part that has to agree.
- Strip comments before any "is this token gone" scan.
- Prove a reported bug at the reporter's seed before touching anything.
- `let`/`const` at top level do not land on the VM context; test-injectable globals are `var`. `navigator` needs `defineProperty`.
- Python edit scripts use literal bytes (real em-dashes, real `×`), never escapes. Any `\uXXXX` text that must land in a file is built in code with `chr(92)`, never typed.
- Temp files go under the session's own scratchpad, never bare `/tmp`.
- The repo lives outside iCloud (`~/Developer/TheBig6V2`). iCloud sync of `~/Desktop` made conflict copies of `.git/index` and restored deleted files after a merge (2026-10-12).

## Architecture invariants
- `prog.weeks` is rebuilt from `cfg + seed` on every boot AND persisted: `ia_programs` carries the whole grid (58,478 bytes for one 11-week program) and `refreshProgram` reads it back, load-bearing — strip the stored grid and 9 of 9 logged run sessions flip off target (measured V202). The persisted grid is the freeze's source; it holds no overlays, so anything that needs what the athlete actually SAW still reads `ia_hist_`.
- Week freeze is per-DAY. Injury overlays pierce untrained days only; trained days stay byte-identical.
- `exStoreKey()` / `EX_KEY_ALIAS` is the single writer of `ia_exw_` slug keys.
- `cfg` is never mutated by the engine; `buildProgram` is a pure function of `cfg`. Anything computed for one build (`cfg._racePin`) is deleted before the cfg is stored.
- NRC sessions are Nike-verbatim: session names and structures are a hard invariant; verify against `doctrine/*.txt` page by page before calling any NRC value a defect. No harness may assert taper monotonicity, volume ratios or rep ceilings on NRC-transcribed sessions.
- Race goals route to NRC; test goals stay NSW. An NRC run goal pins program length. Race day is found by SUBTYPE, never by position.
- Race alignment counts back from the race, not forward from today (`raceAlignment`).
- Zoom-locked viewport, `touch-action:manipulation`, no service worker: permanent.

## Coaching doctrine (rule-level, see §11f for reasoning)
- Prescription owns the fixed dimension; the log captures the free one; the third derives. Never ask for two when one is prescribed.
- Hard days hard: hinge / heavy lower pairs with speed days, not recovery runs. On NRC programs the long-run day and its eve are forbidden to pull/legs (`nrcLegLiftPlacement`, V189 D36).
- The run is the day: NRC long-run days tier by time on feet (≥75 min mobility only; 45–75 upper/trunk ≤8 sets no hinge no power; <45 normal). Carries banned on every long-run tier.
- Race week: primer only through three days out; no lifting from two days out, shakeout on the eve, nothing on race day (`raceEveLiftPass`, V189 D37/D38). Foot/ankle is dynamic mobility only.
- Injury overlays pierce at day level. Travel = maintain, not progress; bodyweight tier assumes no bands.
- Positional-strength lifts (paused, box) cap at 6 reps (`REP_AFFINITY`). Power block reps are a property of cost tier; rest derives from cost.
- Carries: Farmer / Suitcase / Overhead are three threads; one-hand carries always print a side.
- Supersets never cross fixed stations (`_stationClass`).
- Mario's coaching pushback can override a code-correct recommendation.

## Answering Mario (standing, applies to every agent and every topic)
**Every question, issue, risk or decision point put to Mario ships with a stated recommendation.**
Not a menu of options, not "your call" on its own: say what you would do and why, then the strongest
counter-argument, then let him choose. This holds for coaching rulings, engineering trade-offs, tooling,
git, scope and anything else. A decision surfaced without a recommendation is an incomplete answer.
Flag the ones that are genuinely his to make (publishing, irreversible actions, doctrine) as such —
and still recommend. Refer to his decisions by ruling name (P-ACTIVE, D177), never by a bare number: with builds and
decisions both numbered in one message, he read decision "#4" as "build 4" (V220).

## Copy rule (Mario, standing)
No mid-sentence hyphens or em-dashes in anything the athlete reads. Short declarative sentences. The app sounds like a coach at every touchpoint. Spec separators inside a prescription (`4×5 — RPE 8`) are structural and exempt. No user-facing "Nike" strings.

## Token discipline
**Run a command that takes longer than a minute in the background, its output in a file, and read back only the summary.**
`index.html` is ~250K tokens and generated: never read it wholesale, never edit it. Code lives in `frontends/app/src/legacy/src/` and, for the engine files phase D has moved, `core/src/engine/`: `grep -rn` the symbol and its consumers in both first. Most source files are small enough to read whole; the four largest (`core/src/engine/engine-c.ts`, `core/src/engine/cardio-progression.ts`, `js/wizard.ts`, `core/src/engine/nsw-cardio.ts`, 75 to 115 KB) are read wide at the seam. `str_replace` narrowly in the source file, rebuild, and let the tests be the backstop. Do not re-read the doctrine text mid-session unless verifying a transcription.

## Delegation carry (only when Mario explicitly asks for a builder or gatekeeper agent)
Builder and gatekeeper agents do not load this file (`omitClaudeMd`). A brief to either carries the ruling verbatim (its
decision file entries), the version Mario picked, the baseline path, the feature tests to write or check, every
behaviour the ruling changes, whether `HALF_MANNY` may move and to what digest, and the Test layout, Proof for new
work and PRIORITY 1 sections pasted, plus the standing lines: proving pipelines are `bash -c 'set -eo pipefail; …'`;
oracles never ask the engine; a test file that registers no tests is a failure; pin `cfg.seed` and prove a program
equals itself before comparing; NRC sessions are verbatim; temp files only under the scratch path the brief names.

## Dev mode (Mario, Post-V239): the fastest look at a change, never a proof
The dev container serves the website (`/`), the app (`/app/`, built from `frontends/app/src/legacy/src/`), the admin (`/admin/`,
admin / asylum) and the backend on http://localhost:3000, and rebuilds whatever is saved by itself, in about a second,
with nothing running on the Mac: the website and the admin (`frontends/`) by `ng build --watch`; the app built from its source files on every
save, with the one builder (`frontends/app/scripts/build-index.mjs`), into `backend/app-web/` only, its inline script
parsed; the server restarted on a `server/` change. A saved source file shows at `/app/` at once; the root copy still needs
`npm run build:index`. After each change it runs only tests that finish within 3 s, then
every open page reloads itself. The watcher (`backend/scripts/dev-watch.ts`) runs inside the container
(`backend/Dockerfile.dev`, `backend/docker-compose.dev.yml`); it reads the checkout read-only and writes only
`backend/dist/`, `backend/app-web/` and `frontends/dist/`. The container comes back by itself whenever Docker starts.
`cd backend && npm run dev` starts it (building its image when needed) and follows its log: Ctrl-C stops following,
never the container. `npm run dev:down` stops it; `npm run docker:up` puts back the plain production image. When Mario
wants to see an edit, check it answers (`curl -s localhost:3000/healthz`), run `npm run dev` in the background if not,
and hand him the link to the page that changed. It shows; it proves nothing: no test or CI result comes
from it, and a version ships only through the session rhythm. The other paths stay for devices, deploys and full
builds: `frontends/app/` `emulator-ios`, `device-ios`, `pwa-pages`, `pwa-local`; `backend/` `docker:up`, `mac-local-backend`,
`heroku.sh deploy`, and `heroku:local` (Heroku's build and dyno on this Mac, offline: `npm run heroku:local -- --check`
before a merge into `main` touches the build).

## Native (iOS) (Mario, Post-v0.240.0): the iOS app is the product, and its proof runs in lanes
- **What is tracked:** `frontends/app/config.xml`, `plugins-src/` (`ia-island`, `ia-gps`) and `scripts/ios.mjs` (with `scripts/signing.mjs`, the release signing). `platforms/`, `plugins/` and
  `www/` are generated by Cordova and gitignored: never commit them. A change to the native project is a change to one of
  the three tracked things, so there is no Xcode project diff to classify.
- **The version.** `config.xml`'s `version` and `ios-CFBundleVersion` carry the page's `ia-version`, written by `cd frontends/app
  && npm run version-ios` in the release commit; `test/unit/native-version.test.ts`, in the app lane of the 60-second check, is
  red when they differ.
- **The compile proof is CI's.** The 60-second check cannot build iOS. The pipeline's `native (iOS simulator)` job runs
  `npm run build-ios` (`scripts/ios.mjs build`: the Angular app, the Cordova platform, an unsigned Xcode build for the
  simulator, nothing launched) on a macOS runner on every push to `dev` and every pull request; its Xcode log is the
  `native-run-log` artifact. Locally the same command is the fastest native build, minutes, run in the background.
- **The phone: TestFlight from CI** (Mario, Post-v0.251.1). After the deploy proof on each push to `main` (and on a hand
  run of the pipeline on `main`), the TestFlight jobs archive the release (`npm run release-ios`, `scripts/ios.mjs
  release`), upload it and wait until App Store Connect has processed it; the phone's TestFlight app then offers it.
  Plain signing: one Apple Distribution certificate and the App Store profiles of the app and its RestTimerWidget
  extension, made once by Mario, and his App Store Connect API key (App Manager role), seven repo secrets that only Mario
  enters (`frontends/app/README.md`, TestFlight from CI). No agent handles a secret or asks for one in chat. While any
  secret is unset the gate skips and stays green. **A version goes up once**: the gate skips a version App Store Connect
  already holds, so tests-only and docs merges stay green, and a fix is the next PATCH. Rhythm step 7's TestFlight leg is
  the newest main run's TestFlight notice; the native leg still reads config.xml. A session that changes the native app
  runs `device-ios` or `emulator-ios` and says which: the signed Release build first compiles on `main`.

## Files
- `index.html` — the app's page, generated. Its source is `frontends/app/src/legacy/src/`: `js/`, `css/`, `html/` (the `ia-version` meta
  is in `html/head.html`), `order.json` (the one list of pieces, in build order) and a README saying what each file
  holds. `frontends/app/scripts/build-index.mjs` builds it into `dist-github-pages/` (gitignored) and writes the root copy
  Pages serves until its source switch (`cd frontends/app && npm run build:index`; `npm run build:index:check` fails,
  naming the first differing byte, unless the root copy is the build). The sources and the root copy are committed
  together; the root copy is never edited by hand. `tools/app-at.mjs <ref> <file>` writes the page as any commit had it.
- `IRON_ASYLUM_HANDOFF_1_1.md` — the record (stable name, overwrite in place, ONE digest line per version at the tail, never a narrative at the top).
- `docs/design/THE_ASYLUM_DS_REFERENCE*.md` — design system (the Track look, D263: neutral paper `#F3F3F1` and ink, true black at night, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).
- `frontends/` — every UI: `app/` (above, and the Cordova iOS project), and the website, the admin and `common/` (what
  more than one frontend uses) as one Angular workspace (`frontends/README.md`), built into `frontends/dist/`, which the
  backend serves. `backend/` is the server only.
- `tests/` — the only test suite: `unit/`, `integration/`, `sweeps/` and `snapshots/` (named by feature), `support/`
  (helpers, on `tests/harness.js`), `package.json` (Vitest, TypeScript); `tests/harness.js` (VM boot, fixtures,
  `weekGrid`, `progDigest`), `tests/lattice193.js` (the shared 864-config lattice), `tests/semver.js` (the version
  rule for tools and CI), `tests/measure/` (measure scripts and saved reports, keep them), `tests/parked/` (parked
  rulings). `core/` (`@ia/core`: the release version, semver, the domain types in `core/src/domain`).
  `docs/decisions/<feature>.md` (the rulings, one file per feature); `docs/test-migration.md` and
  `docs/test-migration/*.md` (how every legacy gate row was carried over or dropped); `docs/architecture-migration.md`.
- `tools/check.mjs` — the 60-second local proof (Pipeline). `.githooks/pre-commit` runs it on every commit, and `.githooks/pre-push` lets only local `dev` and tags reach GitHub (`git config core.hooksPath .githooks` once per clone; keep it relative). `.github/workflows/pipeline.yml` — the full suite on every push to `dev` and every pull request from `dev` into `main`, and the deploy proof after each merge.
- `tools/` — the run log (`tools/README.md`): every test, build, deploy and server run is a folder under `temp/runs/` (gitignored) with a line in `temp/events.log`; `~/Library/Logs/IronAsylum/orchestration.log` has one line per top-level start on this Mac. When something went wrong, `node tools/logs.mjs` is the first place to look. `tools/deploy-check.mjs` is rhythm step 7 as one command.
- `doctrine/*.txt` — page-ordered OCR of the NSW guide and the four NRC plans. Gitignored (not published by Pages); regenerate from the archives with `doctrine/README.md` if missing.
