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
  `docs/decisions/<feature>.md`, measure scripts `tests/measure/<feature>_<question>.js` (`.mjs` when it needs ES modules: `tests/` is CommonJS, Post-v0.262.0; Test layout). No
  `v<version>_rulings/` folder is made. Files written before Post-v0.239.1 keep their names (`tests/measure/v0.240.0_*`).
- **Code** reads, compares and prints a version only through `tests/semver.js` (or `@ia/core`'s `semver`): never `+version`, a
  string compare, `'V'+n` or arithmetic on a version. `SV.tag(v)` prints the label: `V239` for an old build, `v0.239.1` for a new one.
- **Mario picks PATCH, MINOR or MAJOR** before every release (Versioning). Nobody infers it.
- **A future `V<N>` anywhere is a defect.** One found in a brief, a template, a handoff line, a file name or an agent's
  return is corrected to the dotted form before it is used or repeated, and the correction is reported. builder and
  gatekeeper do not load this file, so every agent file and skill carries this section at its top.

## Security (Mario, Post-v0.261.3): this repo is PUBLIC, and bots clone it
600+ clones from 120+ cloners in two weeks, with Mario the only human visitor. **Treat every commit as permanently
public**: every branch, tag and pull request ref on GitHub, every commit message, every Actions log and artifact. Deleting
a file does not take it out of history, and a secret that reached GitHub once is burned.
- **Never hardcode** an API key, token, password, private key, connection string or database URL: not in code, tests,
  scripts, docs, the handoff, a measure report, a decision file or a commit message. A test uses an obvious fake
  (`'secret'`, a key it generates itself).
- **Every secret is an environment variable.** Locally `backend/.env` (gitignored; `backend/.env.example` lists every
  setting with placeholder values only), in production Heroku config vars (`backend/scripts/heroku.sh setup`), in CI
  GitHub repository secrets, which only Mario enters (Native). A CI step writes one to disk under `$RUNNER_TEMP`, never
  under the checkout, whose `temp/` is uploaded as a run-log artifact.
- **Never commit `.env` or any file holding a secret** (`.env.*`, `*.p8`, `*.p12`, `*.pem`, `*.key`, `*.mobileprovision`,
  a keychain, `frontends/app/build.json`, `.npmrc`). `.gitignore` covers them; never `git add -f` one.
- **Before every commit, read the staged diff (`git diff --cached`, the sources; `index.html` is their build) for
  anything that looks like a credential**: a long random string, a `key`/`token`/`secret`/`password` assignment, a URL
  with `user:pass@`, a `BEGIN … PRIVATE KEY` block. If one is there, stop: unstage it, commit nothing, and tell Mario the
  file and line. Never commit it "to fix in the next commit".
- **The page and the iOS app cannot keep a secret.** Everything in `index.html` or the app bundle is public, whatever
  environment variable it was built from. A key that must stay secret lives behind the backend.
- **Known non-secrets, so no session churns on them:** the local dev login admin / asylum (local only: production refuses
  `/admin` until `ADMIN_USER` and `ADMIN_PASSWORD` are Heroku config vars, and production's password is never that one);
  the bug report's Web3Forms access key (a client key Web3Forms publishes for use in page source); the scratch-path UUIDs
  in `tests/measure/`; the tests' fake keys.
- **A secret found in git history** is rotated first, then reported to Mario with its file, commit and service.
  Rewriting history and force-pushing are his call alone, never made without his yes in chat.

## What this is
Vanilla HTML/CSS/JS PWA served as one page (`index.html`, ~1.3 MB, one inline `<script>`) that
generates multi-week hybrid strength + cardio programs from a seeded, deterministic engine
(Engine A → B → C → D inside `buildProgram(cfg)`). **The page is generated** (architecture phase B, Post-v0.239.1):
`frontends/app/scripts/build-index.mjs` builds it from its source files under `frontends/app/src/legacy/src/` (joined in order, each piece's comments stripped, D268) (the app's files in `js/`, TypeScript in place since v0.239.44, their type debt marked by `tools/ts-expect.mjs`,
its CSS files and HTML partials; `order.json` lists every one) and the engine's TypeScript under `core/src/engine/` (all 17 engine files, architecture phase D, and beside them from v0.261.2 the stored state's `state-*.ts` files as the React Native migration lifts them out of the page, `MIGRATION.md`:
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
  unless Mario explicitly asks for one in chat (a chat's own worktree, One chat per worktree, is the chat itself, not an agent). `.claude/settings.json` makes every `Agent`/`Task` launch ask Mario
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
**One chat per worktree, and a push carries one chat (Mario, Post-v0.256.0: "i only want to push to dev changes that
are made in the chat i built it in").** The three sentences, in force from Post-v0.256.0:
1. **A chat never commits on local `dev`.** Every chat works on its own branch in its own worktree
   (`EnterWorktree` at session start; branch `chat/<work>`, named for the work and moved onto `dev` before any edit,
   session-start step 0), and every commit it makes carries the
   trailer `Chat: <work>` (`.githooks/prepare-commit-msg` writes it). The main checkout holds `dev` and nothing else;
   `.githooks/pre-commit` refuses a commit on `dev` there.
2. **Local `dev` only ever holds pushed commits.** When Mario says push, the chat runs `node tools/land.mjs` from its
   worktree: it fetches, refuses if `dev` holds anything unpushed or the branch is not rebased onto `dev`, fast-forwards
   local `dev` to the branch and pushes `origin dev`, as one step. Work Mario wants held stays on its branch.
3. **The hooks enforce it.** `.githooks/pre-push` refuses a push of `dev` whose new commits carry more than one chat's
   trailer; `land.mjs` refuses a landing while `dev` has unpushed commits; `IA_PUSH_ALL=1` overrides both when Mario wants
   everything pushed together on purpose.
Why: on 2026-11-08 the swipe-deck chat pushed `dev` and carried this chat's unpushed v0.256.0 with it, because every chat
committed onto one shared `dev`. Before that, V238's final hash went red on another session's files written into
`tests/measure/` mid-proof (one writer per working tree, Post-V238, which this rule replaces). A conflict between two
chats now shows at landing (git refuses the fast-forward; the chat rebases, resolves, runs the check) instead of as a
silent overwrite. `index.html` is regenerated after a rebase, never resolved by hand; the second ruling to land
regenerates its golden files on top of the first.
**A D-code travels with its decision file (Mario, Post-v0.250.0).** The session that issues a D-code commits the handoff's
registry line and the decision file it names together, at once, in a `docs:` commit, so no other session's commit carries
the line alone. A session that finds another's uncommitted registry text in its own commit says so in its report.
v0.250.0 carried the D258/D259 line to `dev` while `docs/decisions/speed-work.md` stayed untracked.
**Never name a D-code to Mario before it is in the registry (Mario, Post-v0.254.0).** Until the registry line that
issues it is written, a ruling is "the next D-code" in chat, a brief and a report. The number is read with
`node tools/claims.mjs` in the same step that writes the decision file: a chat's D-code and version sit on its own branch
until it lands, so the tool reads the registry and the meta on `origin/dev`, local `dev`, every chat branch and the
working tree (Post-v0.259.4: the iOS 15 chat read D280 on `dev` and wrote D281 and 0.259.3, which `chat/swipe-deck`
already held; both were renumbered before any push). v0.254.0's ruling was promised as D265 in chat; a concurrent session
issued D265 before the ruling was written, and it shipped as D266.
1. `session-start` skill: confirm `index.html`'s `ia-version`, confirm the handoff header and a digest line agree with it, and print the deploy picture (step 7).
2. **Measure before designing.** `measure` runs the harness across the relevant configs and prints the before-picture (`node tests/harness.js index.html --grid`, or a purpose-built measure script in `tests/measure/`, kept as `<feature>_<question>.js`, or `.mjs` for an ES module).
3. **Design before coding.** Coach issues a ruling (D-code) with coaching rationale and the before/after week grid. Mario concurs or pushes back. Coaching correctness overrides technical convenience. The main session appends the ruling to its feature's decision file (Proof for new work).
4. **Ask Mario for the bump** (Versioning, below): PATCH, MINOR or MAJOR, before the first builder dispatch. Builder ships: narrow edits to the source files under `frontends/app/src/legacy/src/` (every text replaced occurs exactly once in the file it edits before it is replaced), `index.html` rebuilt from them (`npm run build:index`), the feature's tests (Test layout), `ia-version` set to the version Mario picked, exactly when he says so. **Right before every builder dispatch**, re-read HEAD against `origin/dev` and `origin/main`, `index.html`'s `ia-version` and the handoff's D-CODE REGISTRY line, and run `node tools/claims.mjs`, which reads both on every chat branch too: Mario runs concurrent sessions, and V202 shipped from another one mid-design. If the version moved, the ruling goes back to coach before anything is written.
5. Gatekeeper proves it as **Pipeline** and **Proof for new work** (below) set out: locally inside 60 seconds, then the full suite in CI on the push to `dev`, which Mario reviews. Green, or a NAMED failing test.
6. `handoff-update` skill: the seven-element session entry, with the release line of each decision this version shipped filled in (`docs/decisions/<feature>.md`). Then stage the build's files by path (every tracked change and every untracked file the build wrote; **never
   `git add -A`**, Mario, Post-V238) and commit on the chat's branch in its worktree (`git commit -m "v<version>: <one line>"`; the pre-commit hook runs the 60-second check; the Chat trailer is written for you).
   **Push only when Mario asks**, with `node tools/land.mjs` from the worktree (local `dev` fast-forwarded and pushed in one step; One chat per worktree), and never wait on CI (Mario, Post-v0.250.0): the push runs the full suite there and Mario
   reviews it himself; read a run (`gh run list --branch dev --limit 1`, `gh run view <id>`, `gh run download <id>`) only when he asks. **Mario opens
   every pull request into `main` himself, by hand, after reviewing those results; no agent ever opens one (Mario, Post-V239).** When he has merged it, tag what merged: `node tools/land.mjs --tag v<version>` from the chat's worktree (it fetches, makes the tag on `origin/main` when there is none, refuses unless the commit it names carries that version and is on `main`, and pushes the tag from the main checkout, the one place the push hook lets a tag through; Post-v0.261.5: a worktree chat could make the tag and not push it).
   **The next chat's prompt waits for the merge** (Mario, Post-v0.261.7: "give me the prompt for the new chat once i tell
   you its merged, so it improves the workflow"). At commit and at push, give the summary and say the prompt follows the
   merge. When Mario says it is merged: tag it (above), read the deploy picture (step 7), then give the prompt, written
   against what landed, its model and effort on top. Every prompt for a next chat carries the same closing.
   **Every push ends with its pull request summary in chat** (Mario, Post-v0.259.3: "when i say push go ahead and throw the
   summary in the chat too"). After `land.mjs` pushes, post one fenced Markdown block he copies into the pull request into
   `main`, covering everything that pull request will carry (`git log origin/main..origin/dev`, not only this chat's
   commits), one section per version or pass, in plain words: what changes for the athlete, the ruling and its decision
   file, the files, what does not change (program output), the proof (the tests and whether each fails on the previous
   release, the 60-second check), what is not yet seen (the phone), and the commits by hash and subject.
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
   - TestFlight, the beta app (D288): `node frontends/native/scripts/testflight.mjs leg`, the "TestFlight next" notice of the same run: the Expo app's build, its version and build number, or why the upload skipped.
   ```
   DEPLOY  local 0.239.1 (dev a1b2c3d, +0/-0 origin/dev)  dev 0.239.1  main 0.239.0  pages built e4f5a6b  live 0.239.0  native 0.239.1  testflight 0.239.0 processed  next 0.262.0 (101) processed
   ```
   The pipeline's `deploy proof (Pages)` job checks the main, Pages and live legs on every push to `main`
   (`tools/deploy-check.mjs`); read its result, or run `node tools/deploy-check.mjs --expect <version>` yourself. When
   live lags `main`, say so and recommend forcing a Pages build (`gh api -X POST repos/bigyerr/TheBig6V2/pages/builds`,
   ~40 s); Mario may leave it behind. Tell Mario the live number you read back, never the number you pushed.

## Pipeline (Mario, Post-V239): fast locally, the full suite in CI, `main` only by pull request
- **Branches.** A chat commits on its own `chat/<work>` branch in its own worktree, as often as needed. Local `dev` in
  the main checkout is the landing strip: it only ever holds pushed commits, and only `node tools/land.mjs` moves it (a
  fast-forward to one chat's branch and the push, as one step; One chat per worktree, above). Every push to `dev` runs the full suite in
  CI and nothing waits for it; Mario reviews the results and, to release, opens the pull request into `main` himself.
  `main` is what Pages serves and what Heroku deploys: Heroku's automatic deploy from GitHub builds every push to
  `main` with the repo root's `package.json` and `Procfile` (the website, the admin, the app at `/app/` and the
  backend, one dyno; Mario, Post-v0.242.0), and `backend/scripts/heroku.sh deploy` is the manual path. Branch
  protection lets `main` change only through a pull request from `dev` whose pipeline checks all passed; its required
  checks are the pipeline's PR job names, kept in GitHub's settings, not in the repo, so a renamed job is renamed there
  too. Nothing but a chat branch lands on `dev`, and nothing lands on `main` but Mario's pull request.
- **A worktree never runs `git push` itself (Mario, Post-V239), and lands with `tools/land.mjs` (Post-v0.256.0).** A
  chat's worktree (`.claude/worktrees/*`) commits on its `chat/<work>` branch. When Mario says push, `node tools/land.mjs`
  from the worktree fetches, checks (`dev` equals `origin/dev`; the branch is on top of `dev`; its new commits carry one
  Chat trailer), fast-forwards local `dev` and pushes it from the main checkout, in one step; `--dry-run` only checks.
  When the work is finished the chat deletes its worktree and branch. On Post-V239 the semver worktree pushed three
  commits straight to `origin/dev` while the main checkout held four unpushed ones, and `dev` forked (4 ahead, 3
  behind); on 2026-11-08 one chat's push carried another chat's unpushed release. `.githooks/pre-push` refuses any push
  from a worktree, from the main checkout anything but local `dev`'s own commit to `dev` or a tag, and a push of `dev`
  whose new commits come from more than one chat (`IA_PUSH_ALL=1` to carry them together on purpose). A worktree runs
  the hooks of the commit it has checked out, so one made from `dev` carries the guards.
- **Local proof is 60 seconds, hard.** `node tools/check.mjs` runs six lanes and stops at 60 s: tests (the type
  check of `core/` and `tests/`, and the unit and integration tests by Vitest), build (the page builds from
  `frontends/app/src/legacy/src/` into `dist-github-pages/`, its version meta, its inline script compiles, it boots and builds
  HALF_MANNY self-stable, and the root copy is that build byte for byte), app (sync, type check, tests, lint, the production build with its budgets), frontends (the website's and the admin's type check and lint), backend (type checks, tests, lint) and native (the Expo app's type check against core; on a change to `core/` alone it is skipped with a note when no `frontends/native/node_modules` is here or borrowable, since CI's `native (Expo)` job checks it, Post-v0.262.0). The pre-commit hook
  (`.githooks/pre-commit`, `--staged`) runs the lanes a commit touches. No local step waits longer than 60 s: anything
  slower belongs in CI. In a chat's worktree the check borrows the main checkout's `node_modules` of the app, the website,
  the backend and the Expo app when this branch's lockfile is the main checkout's, and otherwise names the `npm ci` to run
  (`tools/worktree-deps.mjs`, Post-v0.259.1); it installs the tests' own with `npm ci`. It borrows package by package,
  and a package installed from a `file:` spec (the app's two plugins; the tests' `@ia/core` when a session borrows that
  folder by hand) is the worktree's own copy (Post-v0.261.0: borrowed whole, a worktree read the main checkout's core
  and plugins). A chat that adds or changes a package first removes the borrowed folder there (`rm -rf` on the
  worktree's `node_modules`, a folder of links, as a command of its own: it removes the links, never the main
  checkout's packages) and installs its own with `npm ci`, then `npm install --save-exact`; an install into the
  borrowed folder would write through the links. When that chat lands, `tools/land.mjs` names each folder whose
  lockfile changed and the `npm ci` to run in the main checkout, which every other worktree borrows from
  (Post-v0.262.0: the native spike chat added the widget plugin, and nothing said the main checkout lacked it).
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
    file> npx vitest run <file>`; a test that reads source files instead of the page (the deck's tests, the native app's
    `frontends/app/test`) runs on a copy of the previous commit's tree: `node tools/tree-at.mjs <previous>
    <scratch>/prev <changed test files>` writes the app, the Expo app (`frontends/native`), core, the tests, the tools, the page and its icon as that commit
    had them, links the main checkout's node_modules and copies the changed test files over, then `npx vitest run` or
    `node --test` on them there (Post-v0.260.0: assembled by hand, the copy took four tries): a test written for a changed
    behaviour must fail there, and one that passes on both is vacuous unless its file says it guards behaviour that
    must not change. A new test file that cannot load on the previous release (it imports a module that release does not have) fails there before its first test, by construction: `git cat-file -e <previous>:<that module>` failing is its proof, the report names it so, and no run is needed. A new file that loads there is run as usual, and each of its tests must fail (Post-v0.257.0). A test added to an existing file for a module the previous release does not have is proved the same way, test by test: `git cat-file -e` on the module is its proof, and the file's other new tests run on the previous release as usual (Post-v0.261.4: 17 of the 19 tests added to `tests/unit/stored-state.test.ts`). A changed test file whose wiring also changed (it calls a function the previous release does not have) fails there whole, which proves nothing about its changed assertions: prove each changed assertion on the previous release's own tree as well (`tools/tree-at.mjs`), and name both runs in the report (Post-v0.261.0: `this-week-hero.test.ts` read `getPartSkips`). A test file whose wiring alone changed, with no assertion changed (a function it lifts out of the page moved), proves nothing new on the previous release and needs no run there: the report names it as wiring only (Post-v0.261.8: `tests/unit/data-backup.test.ts` lifts core's reader).
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
  **A ruling carried unchanged into another frontend keeps its D-code** (Post-v0.262.0): the Angular screen, the Expo
  app or any later one drawing the same row with the same words and behaviour is an entry in the ruling's own
  decision file under its D-code, with its own release line. A new D-code is issued only when the behaviour or the
  words change (D286 in the Expo app, `docs/decisions/engine-check.md`).
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
  builder writes the number Mario named and nothing else. When another chat takes that number first
  (`node tools/claims.mjs` names who holds it), the release takes the next number of the class he picked, and the
  report says so (Post-v0.259.4: PATCH 0.259.3 shipped as 0.259.4).
- **A version goes up to TestFlight once** (Mario, Post-v0.251.1). App Store Connect refuses a second build of one
  version, so a merge that carries a version it already holds skips the upload, and a fix is the next PATCH (Native).
- Names from 0.239.1 on carry the dotted version with a lowercase v, and only where a version belongs (PRIORITY 1): the
  `ia-version` meta, tag `v0.239.1`, commit subject `v0.239.1: …`, digest line `- **v0.239.1** — …`, the release line
  of a decision entry, and a scratch copy of a release's body. Files made from Post-v0.239.1 on are named by feature,
  never by version (Test layout). Files made before keep their names (`tests/measure/v0.239.1_rulings/`). A tests-only pass after a release is
  `Post-v0.239.1`.
- The app's one HTML page is `index.html`, built from `frontends/app/src/legacy/src/` (Pages deploys it). The previous version
  is the release HEAD carries, never "N-1": `node tools/app-at.mjs HEAD <scratchpad>/base_v<previous>.html`. Tag each
  release once Mario has merged it: `node tools/land.mjs --tag v<version>`.
- A file version with no digest line in the handoff means a build was dropped. Stop and tell Mario.
- **Grep the file, never trust a label.** Filename, chat title, memory and handoff can all lag the artifact.

## Engineering invariants (from §10b — each one was paid for)
- A script for an interpreter goes in a file in the scratchpad and runs by its path (`python3 <scratch>/edit.py`), never
  piped in: in a chat's worktree the isolation guard refuses `python3 - <<'EOF'` or `node -e` after a `cd`, a command it
  cannot read through (Post-v0.260.0, refused on every edit until the scripts moved to files).
- Every shell pipeline that proves something is `bash -c 'set -eo pipefail; …'` with `;` separators. `set -e` alone lets a pipe swallow node's exit code. Delete artifacts before regenerating them, with `rm` on a literal path as a command of its own, never inside a `bash -c` string (Claude Code's safety check refuses an `rm` it cannot read through), or let `>` overwrite the file (Post-v0.259.0); an empty diff is a failure, not a clean result. In a chat's worktree, write every path out in full: the isolation guard refuses a command it cannot read through (a `bash -c "…"` string that expands a shell variable such as `$S`, a variable where an option may stand, git inside a loop), and `bash -c '…'` with literal paths runs as usual (Post-v0.257.0). It also refuses a compound command (a `;` chain, a pipe, a loop, a heredoc beside other commands) whose text holds the letters `git` anywhere, a path such as `dist-github-pages` included, and one it finds too long to read through: run that command alone, or put the work in a script in the scratchpad that builds the path itself (Post-v0.261.2). A `git commit` runs alone with its output unredirected, and a python heredoc whose text holds `git` goes in a scratchpad file run by its path (Post-v0.262.0: both refused in the SQLite store chat).
- No process substitution `<(...)` — use temp files.
- Oracles are independent: a test never asserts the engine equals its own output. Hand tables, the doctrine text, date arithmetic; a golden snapshot is the one deliberate exception.
- A test file that crashes before its first test, or registers no tests, is a failure, never a pass. Count a ported or rewritten file's tests against the original: phase 2's pace-clock lattice helper returned its tests instead of registering them, and two sweeps and two integration files ran green without their lattices (Post-v0.239.1).
- A check that takes minutes runs its fast half first and its slow half only where the fast half is silent, and always in the background: the stored state's break check runs the integration file on each broken page and the sweeps only for a break that file lets through (Post-v0.261.2: fifteen minutes a run became under three).
- An instrument is shown to fire, on one file, before its silence is read. A copy of the page that reports or throws at a call proves the call never happens only after its always-fire twin has turned a test red; then the real one runs (Post-v0.261.5: two clean runs of the whole suite meant nothing, one reporting through a console line the runner does not print, the other throwing after a `return` had left the function).
- A new test that reads another package's folder (the Expo app's, today's app's, a tool's) is run once where that package is not installed, before it is trusted: `node tools/tree-at.mjs --working <scratch>/ci` writes this checkout's files as they stand, committed or not, with the tests' packages alone, which is what CI's tests job has; then `npx vitest run <files>` and `npx tsc -p .` in its `tests/` (Post-v0.262.0: three files passed locally and failed in CI for want of the Expo app's packages; the next session's copy, overlaid by hand, lost a folder and read red).
- A check that searches a binary is shown to find what is there, and to find nothing where it is not, before its build trusts it: Swift writes the class `IASpikeModule` of the module `IASpike` as `7IASpike0A6Module`, so a search for the class name failed a good build (Post-v0.262.0).
- Run every new or changed test against the previous release first (`IA_APP`). A test that passes on both is not testing what it claims. A new file that cannot load there (its module is missing) fails by construction; `git cat-file -e` on the module is the proof (Post-v0.257.0), and it is the proof of a test added to an existing file for such a module (Post-v0.261.4).
- Every hunk of the diff on `index.html` and `tests/snapshots/` is classified against the ruling before ship. A removal that was not ruled is a regression (a ruling that SELECTS is not a ruling that DELETES).
- Pin `cfg.seed`, strip clock fields, and prove a program equals itself built twice before comparing anything.
- A control a change removes or renames is grepped for in `tests/e2e` too (its selector, its words), beside its code consumers: the Docker e2e taps it, and the 60-second check never runs the e2e. When a journey changes, `cd tests && npm run e2e` runs locally in the background before the release commit, its output in a file, and the report names the run (Post-v0.258.1: D278 removed the card chevron every app journey opened its sheet through). When the e2e image fails to build for want of disk (`not enough free space` in its run's `artifacts/docker/build.log`), clear Docker's unused build cache with `docker builder prune -f` (cache only: no image in use, no volume) and rerun; pruning images or volumes is Mario's call (Post-v0.261.8: the first e2e of the backup slice, 52 GB of build cache).
- A test of an all or nothing write refuses after a write the undo must take back, and asserts in the test that the store did not hold that key before; a refusal that comes after only keys the store already held is covered by the putting back, and proves nothing about the undo (Post-v0.261.8: two phones' programs shared a seeded id).
- Any harness stub that accepts a callback must be able to run it. `requestAnimationFrame` that never fires deletes a code path from the test.
- Code that measures elapsed time or ends a slice of work on a budget reads `performance.now()`, never `Date.now()`: the e2e and `pinClock` freeze the date, and a slice timed on it never ends (Post-v0.262.0: the engine check ran its 865 builds as one block, the screen still for 10 s). A journey step reads what a tap changed by waiting for it, never at once: the Angular screens draw at their next change detection, after the tap returns.
- Rename passes: a map whose KEYS are old names is rewritten LAST, or excluded from the sweep. No alias row may self-map or chain.
- A conditional write with no else branch is a latch. Move claims onto the item they describe, never onto a section label that a later filter can falsify.
- Pool and post-filter must reason about a movement through the same lens; when one part of the build asserts something about a movement, grep for the other part that has to agree.
- Strip comments before any "is this token gone" scan.
- Prove a reported bug at the reporter's seed before touching anything. A bug on the phone's screen is proved on WebKit,
  which the VM harness and Chrome are not: the app's web bundle in the iOS simulator's Safari with the reporter's program
  seeded, its loading slowed where timing is the suspect (Post-v0.259.1: WebKit drew This Week before its stylesheet
  applied, D279).
- `let`/`const` at top level do not land on the VM context; test-injectable globals are `var`. `navigator` needs `defineProperty`.
- Python edit scripts use literal bytes (real em-dashes, real `×`), never escapes. Any `\uXXXX` text that must land in a file is built in code with `chr(92)`, never typed.
- Temp files go under the session's own scratchpad, never bare `/tmp`.
- The repo lives outside iCloud (`~/Developer/TheBig6V2`). iCloud sync of `~/Desktop` made conflict copies of `.git/index` and restored deleted files after a merge (2026-10-12).

## Architecture invariants
- `prog.weeks` is rebuilt from `cfg + seed` on every boot AND persisted: `ia_programs` carries the whole grid (58,478 bytes for one 11-week program) and `refreshProgram` reads it back, load-bearing — strip the stored grid and 9 of 9 logged run sessions flip off target (measured V202). The persisted grid is the freeze's source; it holds no overlays, so anything that needs what the athlete actually SAW still reads `ia_hist_`.
- Week freeze is per-DAY. Injury overlays pierce untrained days only; trained days stay byte-identical.
- `exStoreKey()` / `EX_KEY_ALIAS` is the single writer of `ia_exw_` slug keys.
- Stored state is read and written only through `iaStore` (`storage.ts`, a `StateStore` from `core/src/engine/state-store.ts`, v0.261.2). Nothing else names `localStorage`. A change to the code that reads or writes an `ia_` key leaves every golden record of stored state the same to the byte (`tests/integration/stored-state.test.ts`, the sweeps of that name, `tests/sweeps/data-backup.test.ts`), unless a ruling moves one; the React Native migration lifts that code into core a slice a release (`MIGRATION.md`, `docs/decisions/stored-state.md`).
- `cfg` is never mutated by the engine; `buildProgram` is a pure function of `cfg`. Anything computed for one build (`cfg._racePin`) is deleted before the cfg is stored.
- NRC session structures are verbatim from the source plans: every number, pace, segment and recovery is a hard invariant; verify against `doctrine/*.txt` page by page before calling any NRC value a defect. Session names are the app's own words (D269, `docs/decisions/run-names.md`), never the source's titles. No harness may assert taper monotonicity, volume ratios or rep ceilings on NRC-transcribed sessions.
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
work, PRIORITY 1 and Security sections pasted, plus the standing lines: proving pipelines are `bash -c 'set -eo pipefail; …'`;
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
never the container. `npm run dev:down` stops it; `npm run docker:up` puts back the plain production image. The container mounts the checkout the compose file sits in, so a chat runs `npm run dev` from ITS worktree's `backend/`
to see its own edits; there is one container, and it follows the chat that last started it. When Mario
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
  `native-run-log` artifact. Locally the same command is the fastest native build, minutes, run in the background. A
  chat's worktree builds into `~/Library/Caches/iron-asylum-ios/worktrees/<name>`, so two checkouts never overwrite
  each other's products (`scripts/build-root.mjs`, Post-v0.259.4); read the bundle's own version before trusting it.
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
- **The beta app has a TestFlight lane of its own** (Mario, Post-v0.262.0, D288, `docs/decisions/testflight.md`). The Expo
  app (`frontends/native`, `com.bigyerr.ironasylum.next`, with its RestTimerWidget extension) goes up through the three
  `next TestFlight` jobs, beside today's lane and apart from it: no job of one needs a job of the other, and nothing
  under `frontends/app` is the beta's. **A build goes up once**: its version is core's, its build number counts the
  commits that changed `frontends/native`, `core` or `tests/semver.js`, so a merge that changes none of them skips, and
  the rule above (a version goes up once) stays today's app's alone. Its secrets are today's five and its own two
  profiles (`frontends/native/README.md`, TestFlight from CI). Its `ios/` is generated by `expo prebuild` and never
  committed; the widget target (`targets/`) and the Swift modules (`modules/`) are the tracked native code. A session
  that changes it runs `npm run sim-ios` there, and `npm run archive-ios` when the release path changed.

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
- `tools/check.mjs` — the 60-second local proof (Pipeline). `.githooks/pre-commit` runs it on every commit and refuses a commit on `dev` in the main checkout; `.githooks/prepare-commit-msg` writes the `Chat: <work>` trailer on a `chat/<work>` branch; `.githooks/pre-push` lets only local `dev` and tags reach GitHub and a push of `dev` carry one chat (`git config core.hooksPath .githooks` once per clone; keep it relative). `tools/land.mjs` — how a chat's branch reaches `origin/dev` (One chat per worktree) and, with `--tag v<version>`, how a merged release is tagged and its tag pushed; its judges tested in `tests/unit/landing.test.ts`. `tools/claims.mjs` — the next free D-code and the highest version across `origin/dev`, `dev`, every chat branch and the working tree, tested in `tests/unit/claims.test.ts`. `tools/tree-at.mjs` — a past commit's tree for the previous-release proof of a test that reads source files (Proof for new work), and with `--working` this checkout's files as they stand with the tests' packages alone (Engineering invariants), tested in `tests/unit/tree-at.test.ts`. `.github/workflows/pipeline.yml` — the full suite on every push to `dev` and every pull request from `dev` into `main`, and the deploy proof after each merge.
- `tools/` — the run log (`tools/README.md`): every test, build, deploy and server run is a folder under `temp/runs/` (gitignored) with a line in `temp/events.log`; `~/Library/Logs/IronAsylum/orchestration.log` has one line per top-level start on this Mac. When something went wrong, `node tools/logs.mjs` is the first place to look. `tools/deploy-check.mjs` is rhythm step 7 as one command.
- `doctrine/*.txt` — page-ordered OCR of the NSW guide and the four NRC plans. Gitignored (not published by Pages); regenerate from the archives with `doctrine/README.md` if missing.
