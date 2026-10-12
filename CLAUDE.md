# Iron Asylum — standing rules for every agent in this repo

Read this before touching anything. The long-form record is `IRON_ASYLUM_HANDOFF_1_1.md`
(architecture §3–§8, workflow §9–§10, standing lessons §10b, rulings §11f, open items §12,
digest at the tail). This file is the short version that must never be violated.

## PRIORITY 1: semantic versioning (Mario, Post-V239). It outranks everything below.
Every version is `MAJOR.MINOR.PATCH`. **Nobody writes or says a future release as `V<N>` or as a bare integer**: not in
chat with Mario, a brief, a ruling, a report, a file or folder name, a script, a commit message, the handoff or memory.
Mario has had to repeat this more than once; a session that makes him say it again has broken this rule.
- **The past is integer, the future is dotted.** Builds 1 to 239 are `V1` to `V239` (each one is v0.N.0; V239 = 0.239.0)
  and keep their tags, digest lines, era-row keys and file names. `Post-V239` is the right label for a pass made after
  V239 and before the first dotted release. Every release from `0.239.1` on is `v<MAJOR.MINOR.PATCH>`. Example: the build
  once called "V240" is `v0.240.0`.
- **Names: a version appears only where a version belongs** (Versioning, below, has the full list): the `ia-version`
  meta; the tag `v0.240.0`; the commit subject `v0.240.0: <one line>`; the digest line `- **v0.240.0** — …`; the
  release line of a decision entry in `docs/decisions/<feature>.md`; a scratch copy of a release's body,
  `base_v<previous>.html`, where `<previous>` is the version HEAD carries, never "N-1"; and, until phase 2 empties them,
  the legacy suite's era rows, keyed `'0.240.0'`.
- **Feature files carry no version** (Mario, Post-v0.239.1). Tests are `tests/unit/<feature>.test.js` and
  `tests/integration/<feature>.test.js`, snapshots `tests/snapshots/<feature>.json`, rulings
  `docs/decisions/<feature>.md`, measure scripts `tests/measure/<feature>_<question>.js` (Test layout). No new
  `tests/gates/g<version>_*.js`, `tests/sabotage/v<version>.json`, `tests/edits/` script or `v<version>_rulings/` folder
  is made. Files written before Post-v0.239.1 keep their names (`g0.239.1_timer_label.js`, `tests/measure/v0.240.0_*`).
- **Code** reads, compares and prints a version only through `tests/semver.js` or `tests/semver.py`: never `+version`, a
  string compare, `'V'+n` or arithmetic on a version. `SV.tag(v)` prints the label: `V239` for an old build, `v0.239.1` for a new one.
- **Mario picks PATCH, MINOR or MAJOR** before every release (Versioning). Nobody infers it.
- **A future `V<N>` anywhere is a defect.** One found in a brief, a template, a handoff line, a file name or an agent's
  return is corrected to the dotted form before it is used or repeated, and the correction is reported. builder and
  gatekeeper do not load this file, so every agent file and skill carries this section at its top.

## Sabotage is OFF (Mario, Post-v0.239.1)
Mario: "can you temporarily disable all sabatoge runs/scripts? lets focus on the migration archtecture". CI's sabotage job is off (`if: false`, which still reports success to a required check),
the 60-second check skips its anchor step, and nobody runs `tests/sabotage.py` in any mode, writes or edits a spec,
or runs the weekly full sweep. Every sabotage rule elsewhere in this file is suspended until Mario turns it back on;
phase 3 of the test migration deletes the machinery. Focus: the architecture migration (`docs/architecture-migration.md`).

## What this is
Vanilla HTML/CSS/JS PWA served as one file (`index.html`, ~1.3 MB, one inline `<script>`) that
generates multi-week hybrid strength + cardio programs from a seeded, deterministic engine
(Engine A → B → C → D inside `buildProgram(cfg)`). **`index.html` is generated** (architecture phase B, Post-v0.239.1):
`app/scripts/build-index.mjs` builds it byte for byte from its source files under `app/src/legacy/src/` (35 JS files,
9 CSS files and 5 HTML partials, joined in the order `order.json` lists). Code is edited in the source files, then
`cd app && npm run build:index` regenerates the root `index.html`, and both are committed together. The root file is
never edited by hand; the 60-second check and CI fail when it is not the build of the sources. Doctrine: NSW Physical Training Guide for
test goals (pace, mile, 1.5-mile, base) and Nike Run Club plans for race goals (5K/10K/half/
marathon). Deployed by GitHub Pages at https://bigyerr.github.io/TheBig6V2/ . iOS-only PWA.
Mario is the sole developer, product owner and primary user.

## Roles (four subagents, see .claude/agents/)
- **measure** — read-only. Owns the before-picture. Proves a reported bug at the reporter's seed, sweeps a lattice, names the root cause and every other reader of the same value. Reports numbers with denominators. Never rules, never proposes a fix.
- **coach** — read-only. Owns coaching correctness and doctrine. Rules on WHAT should ship.
- **builder** — read/write. Owns the edit: changes the source files under `app/src/legacy/src/` directly and narrowly, rebuilds `index.html` from them, and writes the feature's tests (Test layout). Never invents a ruling.
- **gatekeeper** — read + bash, never edits. Owns proof. Runs the 60-second local proof, shows each test written for a changed behaviour fails on the previous release and every changed behaviour has a test, and reads the CI run on the push to `dev` for the full suite (the unit and integration tests; the frozen legacy suite: `tests/gate.sh`, sabotage, blast radius, fuzz; e2e); see Pipeline and Proof for new work.
**Gatekeeper blocks ship.** No version is done until gatekeeper has read the CI run on the commit Mario releases green,
shown that each test written for a changed behaviour fails on the previous release, matched every changed behaviour to
a test, and classified every diff hunk (Proof for new work, below). Where a build also changes the frozen legacy suite
(an era row, a re-anchored mutation, an edited gate), that part is proved as Proof scope sets out.
The main session orchestrates and talks to Mario; it does not do measure's, builder's or gatekeeper's job inline.
**coach rules against evidence coach did not gather** — measure runs before the ruling, not inside it.
Builder is the only agent holding `Edit`/`Write`. coach, measure and gatekeeper never run below opus:
their output is judgement no gate can check (coach), or the judgement that a gate is lying (gatekeeper).
Coach runs on fable from V200 as a measured experiment; compare its rulings against V198 and V199
(retractions, reds, and whether measure refutes a premise) before deciding whether it stays.
**Coach is spawned fresh for each ruling, with a tight brief:** the question, measure's numbers, and the handoff lines
it needs, nothing else. Never resume a coach (`SendMessage`) after it has gone idle. A follow-up or a re-ruling is a
new spawn whose brief carries the prior ruling's text. **Coach is read-only, so the main session saves every coach return
into its feature's decision file (`docs/decisions/<feature>.md`, Proof for new work) before briefing builder**, and every
brief cites only what the saved file says, never a line from the return that was not saved.

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
1. `session-start` skill: confirm `index.html`'s `ia-version`, confirm the handoff header and a digest line agree with it, and print the deploy picture (step 7).
2. **Measure before designing.** `measure` runs the harness across the relevant configs and prints the before-picture (`node tests/harness.js index.html --grid`, or a purpose-built measure script in `tests/measure/`, kept as `<feature>_<question>.js`).
3. **Design before coding.** Coach issues a ruling (D-code) with coaching rationale and the before/after week grid. Mario concurs or pushes back. Coaching correctness overrides technical convenience. The main session appends the ruling to its feature's decision file (Proof for new work).
4. **Ask Mario for the bump** (Versioning, below): PATCH, MINOR or MAJOR, before the first builder dispatch. Builder ships: narrow edits to the source files under `app/src/legacy/src/` (every text replaced occurs exactly once in the file it edits before it is replaced), `index.html` rebuilt from them (`npm run build:index`), the feature's tests (Test layout), `ia-version` set to the version Mario picked, exactly when he says so. **Right before every builder dispatch**, re-read HEAD against `origin/dev` and `origin/main`, `index.html`'s `ia-version` and the handoff's D-CODE REGISTRY line: Mario runs concurrent sessions, and V202 shipped from another one mid-design. If the version moved, the ruling goes back to coach before anything is written.
5. Gatekeeper proves it as **Pipeline** and **Proof for new work** (below) set out: locally inside 60 seconds, then the full suite in CI on the push to `dev`, which Mario reviews; any change inside the frozen legacy suite as **Proof scope** sets out. `gate.sh` reports every red, not the first. Green or a NAMED failing test or gate.
6. `handoff-update` skill: the seven-element session entry, with the release line of each decision this version shipped filled in (`docs/decisions/<feature>.md`). Then stage the build's files by path (every tracked change and every untracked file the build wrote; **never
   `git add -A`**, Mario, Post-V238), commit on `dev` (`git commit -m "v<version>: <one line>"`; the pre-commit hook runs the 60-second check) and `git push origin dev`.
   The push runs the full suite in CI; when it has finished, read it (`gh run list --branch dev --limit 1`, `gh run view <id>`, `gh run download <id>`) and
   report the result to Mario. **Mario opens every pull request into `main` himself, by hand, after reviewing those results; no agent ever opens one
   (Mario, Post-V239).** When he has merged it, tag what merged: `git fetch origin && git tag v<version> origin/main && git push origin v<version>`.
7. **Report the deploy picture; a lagging deploy does not block** (Mario, Post-V239). A push or a merge is not a deploy:
   Pages can report `built` with no error while sitting several commits behind (it silently did not fire on V192 or
   V193). At session start and after every push or merge, read each of these from its own source, never inferring one
   from another, and print them to Mario as one block:
   - local: the working copy's `ia-version`, its branch and HEAD, and how far HEAD is ahead of or behind `origin/dev`;
   - GitHub: `git show origin/dev:index.html` and `git show origin/main:index.html`, each `| grep -oE 'name="ia-version" content="[^"]+"'` (read out of the remote refs, not the working copy);
   - Pages: `gh api repos/bigyerr/TheBig6V2/pages/builds/latest --jq '.status, .commit'`, and whether that commit is `origin/main`;
   - live: `curl -s "https://bigyerr.github.io/TheBig6V2/?cb=$(date +%s)" | grep -oE 'name="ia-version" content="[^"]+"'`. Cache-bust the query string; `cache-control` is `max-age=600`, so an unbusted fetch can lie for ten minutes;
   - any local build that records its own version, when one exists (the native app's `app/config.xml`, a running local PWA server).
   ```
   DEPLOY  local 0.239.1 (dev a1b2c3d, +0/-0 origin/dev)  dev 0.239.1  main 0.239.0  pages built e4f5a6b  live 0.239.0  native 0.239.1
   ```
   The pipeline's `deploy proof (Pages)` job checks the main, Pages and live legs on every push to `main`
   (`tools/deploy-check.mjs`); read its result, or run `node tools/deploy-check.mjs --expect <version>` yourself. When
   live lags `main`, say so and recommend forcing a Pages build (`gh api -X POST repos/bigyerr/TheBig6V2/pages/builds`,
   ~40 s); Mario may leave it behind. Tell Mario the live number you read back, never the number you pushed.

## Pipeline (Mario, Post-V239): fast locally, the full suite in CI, `main` only by pull request
- **Branches.** Work lands on the local `dev` branch in the main checkout: commit there as often as needed. Only that
  branch, from that checkout, is ever pushed to `origin/dev`. Every push to `dev` runs the full suite in
  CI and nothing waits for it; Mario reviews the results and, to release, opens the pull request into `main` himself.
  `main` is what Pages serves and what Heroku deploys (`backend/scripts/heroku.sh deploy` ships `origin/main`'s
  `backend/`), and branch protection lets it change only through a pull request from `dev` whose pipeline checks all
  passed. A branch off `dev` is rare and merges back into local `dev`, never into `main`.
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
- **Local proof is 60 seconds, hard.** `node tools/check.mjs` runs everything fast enough (the unit and integration
  tests whole, the gate suite's quick steps and its fast gates, sabotage anchors, the app's and the backend's tests and
  lint) and stops at 60 s; the pre-commit
  hook (`.githooks/pre-commit`, `--staged`) runs the part a commit touches. A gate still running at 60 s is left to CI,
  not failed. No local proof step waits longer than that: anything slower belongs in CI.
- **The full suite runs in CI** (`.github/workflows/pipeline.yml`) on every push to `dev`, and again on the pull request
  into `main`: the unit and integration tests (job `unit and integration tests`); `gate.sh` with
  every gate, the row check (with the version's `ROW_RULED` licence when it exists) and the blast radius against the
  previous tagged version; fuzz; sabotage anchors and the proof set since `main`; the app and backend tests and lint;
  the Docker e2e. Every job must pass to merge, and each uploads its run log (`temp/`) as an artifact; the gate job's
  includes the run's row manifest (`temp/row_manifest.txt`). After a merge the `deploy proof (Pages)` job runs.
- **What this replaces in Proof scope below:** the Budget bullet (local proof is 60 s, hard; CI has no wall budget,
  30 to 45 minutes is normal); the Draft run and final run bullet (the draft is the local check plus the build's new
  and edited gates and their previous-version runs, inside 60 s; the full suite is the CI run on the push to `dev`; the
  final run is that run on the commit Mario releases, and gatekeeper reads it with `gh run view` and `gh run download`); and every
  full `gate.sh`, fuzz or sabotage run gatekeeper used to make locally. Gatekeeper regenerates `tests/row_manifest.txt`
  from the CI run's `temp/row_manifest.txt` and the fix goes to `dev`, which reruns CI. The classify call, previous
  version, version scope, row manifest rules, era rows, sabotage selection and review stand as written.
- **The weekly full sweep** stays outside any build and runs by hand until it moves into a scheduled CI job.

## Test layout (Mario, Post-v0.239.1): a test is named for the feature it covers
- **Folders.** `tests/unit/<feature>.test.js`: pure logic, one function lifted out of `index.html` and run alone
  (`appFunction`). `tests/integration/<feature>.test.js`: the app booted in the VM harness, programs built, behaviour
  checked (`loadApp`, `loadApp({ dom: true })` for a document that keeps its elements, `pinClock`).
  `tests/sweeps/<feature>.test.js`: the slow ones, a lattice or a fuzz over many programs; CI runs them, the 60-second
  check does not (a file in `tests/unit` or `tests/integration` runs in a few seconds).
  `tests/snapshots/<feature>.json`: one current golden file per feature for program output. The helpers are
  `tests/support/app.js` and `tests/support/snapshot.js`, built on `tests/harness.js`. `app/e2e` stays as it is.
- **Run.** `node --test tests/unit tests/integration` (Node's own runner, about a second; no `package.json` at the repo
  root, which Pages serves). `IA_APP=<file>` runs the same tests against another body of the app.
- **Naming.** A test file is named for the feature it covers, in lower case words joined by dashes (`rest-timer`,
  `version-label`, `program-output`), never for a version, a D-code or a gate. A new behaviour goes into its feature's
  file; a new file is a new feature. A test's name says the behaviour in plain words.
- **Snapshot update.** Only when a ruling moves program output: `UPDATE_SNAPSHOTS=1 node --test
  tests/integration/<feature>.test.js`, then review `git diff tests/snapshots/`. The diff is the review, and it ships in
  the release commit. When HALF_MANNY moves, the regenerated digest equals the one coach printed before the build
  (standing ruling 5). A snapshot is never regenerated to turn a red test green without a ruling.

## Proof for new work (Mario, Post-v0.239.1)
- **CI is the gate.** The unit and integration tests run in the 60-second check and in CI on every push to `dev`; the
  release is proved by the CI run on the commit Mario releases (Pipeline). Gatekeeper reads it, and also:
  - runs each new or changed test on the commit before the change (`git show <previous>:index.html >
    <scratch>/base_v<previous>.html`, then `IA_APP=<that file> node --test <file>`): a test written for a changed
    behaviour must fail there, and one that passes on both is vacuous unless its file says it guards behaviour that
    must not change;
  - matches every behaviour the ruling changes to a named test; a changed behaviour with no test is red;
  - reads every hunk of `git diff` on `index.html` and `tests/snapshots/`, and classifies each against the ruling.
- **Oracles.** Expected values are typed by hand from the ruling, the doctrine text or date arithmetic, never asked of
  the app; a snapshot is the one deliberate exception, a golden file in git regenerated only on purpose. Seeds are
  pinned, clock fields stripped, and a program equals itself built twice before it is compared.
- **Rulings** live in `docs/decisions/<feature>.md`, one file per feature. The main session appends each ruling as it
  is made: its date, its D-code, who ruled, the finding, what changes, what deliberately does not, the expected values
  or after-grid, and the release that shipped it, filled in at ship time. A re-ruling is a new entry naming the one it
  amends. Measure scripts and their saved reports stay in `tests/measure/`, named `<feature>_<question>`.
- **No new legacy files.** No new gate, sabotage spec, `tests/edits/` script, row licence or `v<version>_rulings/`
  folder. Builder edits the source files under `app/src/legacy/src/` directly and narrowly and rebuilds `index.html`;
  the git diff is the record.
- **The legacy suite is frozen until phase 3** (`tests/gates/`, `tests/gate.sh`, `tests/row_manifest.txt`,
  `tests/skip_allow.txt`, `ROW_RULED` licences, era rows and `tests/era_bump.py`, `tests/version_scope.js`,
  `tests/chain.js` and the reach map, `tests/sabotage.py` and `tests/sabotage/*.json`, `tests/edits/`). It keeps
  running in CI exactly as before and its jobs must pass. Frozen means no new files and no new rows: a new assertion
  goes into a feature test. An existing gate, table or mutation is still maintained when a ruled change requires it (an
  era row from `era_bump.py --ruling docs/decisions/<feature>.md`, a re-anchored mutation, a row the ruling rewrites in
  place under its key), under Proof scope; when that edit is more than a few lines, the gate's feature moves to the new
  layout instead. Phase 2 moves the gates feature by feature (`docs/test-migration.md`: the map, the order and the
  parity rule); phase 3 deletes the machinery.

## Proof scope (Mario, standing from Post-V233): the frozen legacy suite only, until phase 3
New work is proved as Proof for new work sets out (Mario, Post-v0.239.1). This section governs the legacy suite: what
its CI jobs run, and how a change inside it (an era row, a re-anchored mutation, an edited gate, the row manifest) is
proved, until phase 3 deletes it.
This section is the single source for what a legacy proof runs. `gatekeeper.md` and the `ship` and `session-start` skills point
here, and a brief to gatekeeper carries it pasted. Basis: `tests/measure/v233_rulings/measure_sabotage_history_mS.md`,
`measure_tooling_inventory_mT.md`, `post_v233_proof_scope_decisions.md`, and `tests/measure/v233_gate_reach.json`.
- **Budget.** Proof finishes in under 15 minutes of wall time for a LOCAL change and under 30 for a CROSS-CUTTING one.
  If a change cannot fit, tell Mario before proof starts what you would drop and why, and wait for his answer.
  **Until the partial row check pass decides** (the first chat after the 2026-10-13 full sweep; handoff §12), a LOCAL
  change that adds a manifest row runs `gate.sh` in full (the manifest is regenerated only from every gate's output)
  on a 20-minute budget (Mario, Post-V234). That pass either builds the tool or, if history shows such changes are a
  clear minority, ends the exception, and from then each such change asks Mario before proof.
- **Classify before proof.** Tell Mario whether the change is LOCAL or CROSS-CUTTING, and why. Cross-cutting is any of:
  a changed function that more than 20 gates execute in the reach map; a stored format (an `ia_` key, `cfg`,
  `prog.weeks`); program output (any digest or era row moves); `tests/harness.js` or `tests/gate.sh`. Era rows that
  `tests/era_bump.py` wrote do not make `tests/harness.js` cross-cutting; `tests/chain.js` reads them from
  `era_bump.py --era-only-diff` (Mario, Post-V235). Everything else is local. When unsure, it is cross-cutting.
- **Dependency chain (local).** Every gate the reach map says executes a changed function, every gate the map cannot
  see, every new or edited gate, and boot. `tests/chain.js <base> <cand>` prints the list.
- **Draft run, then final run.** Gatekeeper proves the draft once, before builder's last slice: cross-cutting gets the
  full suite (`gate.sh`, blast radius, fuzz); local gets its dependency chain and blast radius. The final run confirms
  the shipped file only: version, syntax, boot, the new and edited gates, and every hunk between the proven draft and
  the shipped file classified. It reruns nothing the draft proved unless the last slice touched it. When no builder
  slice lands after the draft, the final run is the version line and a sha256 check of the whole proven tree
  (`index.html` and every gate, spec, harness and tooling file under `tests/`, not the app file alone) showing 0
  changes since the draft, apart from `tests/row_manifest.txt`, which gatekeeper writes from the proven draft (Mario,
  Post-V234). The hash excludes untracked files the build did not write, and the brief names each one (Mario,
  Post-V238).
- **Previous version.** Only gates that are new or edited in the build run against the previous version. A row written
  by the era script does not make a gate edited. A new gate runs against the previous version's body relabelled to
  the candidate's version (its `ia-version` meta set to the candidate's), so its rows are tested, not its version
  check; an edited gate runs against the previous version as shipped (Mario, Post-V234). An edited gate whose rows
  expect different results by version (the old expectation kept at or below the previous version, the new one from
  the candidate's) also runs against the previous version's body relabelled to the candidate's version: the
  as-shipped run exercises only the old arm, and the relabelled run shows the new arm discriminates (Mario, Post-V237).
- **Version scope.** No gate row goes dark. Every row a gate declares prints exactly one status line (PASS, FAIL, SKIP
  or SCOPED OUT), and a declared row with no status line is red. At the candidate's version every row runs: a row that
  prints SKIP or SCOPED OUT in `gate.sh` is red unless `tests/skip_allow.txt` lists it, and every entry there names the
  gate, the row and the cause (a missing input, never a version; no blanket entries). Exact-version predicates are
  also linted; a claim that one build moved nothing is an era row (this is how standing ruling 4's build scope is
  written). V220's bump silently retired g219's three `VER === ERA` rows. **Known gap:** a row born dark never prints,
  so it never enters the manifest; it is covered only by sabotage and the manifest-hunk rule below. The sabotage
  clause below is the backstop, not the fix.
- **Row manifest.** A gate's declared rows are its rows in `tests/row_manifest.txt`. Gatekeeper regenerates it from a
  proven run only; builders never edit it. A row that leaves the manifest without a ruling is red. A ruling that adds
  or changes a row shows as a manifest hunk, and a ruling that names a new row with no manifest hunk is red. A manifest
  hunk that no ruling explains is red in both directions, rows added as well as rows removed. Every new
  gate, and every gate converted by hand, prints its rows through the shared status helper `tests/status.js`.
  The main session writes the ruling's new rows into the licence file `tests/measure/v<version>_rulings/v<version>_row_ruled.txt`
  (`gate.sh` reads it as `ROW_RULED`) before the draft run, and gatekeeper's brief carries it. A row the ruling's list
  missed is added to the ruling (its saved file and the licence file) before the final run, never licensed on the
  fly (Mario, Post-V235).
- **Era rows.** A table the ruling does not move gets its reference row from `tests/era_bump.py <version>`, never by hand. A
  table the ruling moves is written by builder from coach's printed digest (standing ruling 5).
- **Sabotage.** Every build: anchor-check every mutation in every spec (no gate runs), then trip-run the build's own
  spec, every mutation naming a gate the build edited, and every mutation naming a gate that still has a row scoped to
  one exact `ia-version`. The full sweep trip-runs every spec, old ones included, when 7 days have passed since the last
  one; it runs outside any build's budget and rebuilds the reach map in the same run. Its date goes on the digest line
  as `full sweep YYYY-MM-DD`, and `session-start` reports whether it is due.
- **Review.** Every 25 releases (a release of any bump counts once), measure reruns the gate history analysis
  (`tests/measure/v232_gate_history.js`, record shaped like `v232_rulings/measure_gate_history_mH.md`), reports which
  gates have never caught a real bug, and audits every `tests/skip_allow.txt` entry. Last run Post-V232; seven
  releases since (V233 to V239), so next due after the 18th release from 0.239.1 on.
- **Friction report** (Mario, standing from V234). After each build, before the digest line, report to Mario in five
  lines or fewer any of these that happened:
  - the classify call was a judgment call, and which side you came down on and why;
  - proof time came within 20% of its budget, or went over and had to ask;
  - a rule had to be interpreted or worked around to fit the change, naming the rule and the workaround;
  - the manifest hunk needed the ruling reworded to count as explained, or flagged something that was not really a row change;
  - the allow list was touched;
  - any step the rules required that proved nothing new on this build.
  For each item, say in one line whether you would change the wording and to what. If nothing fired, the report is one
  line: `Friction: none.` It runs on every build through V238; from V239 on, only when something fires. Never adapt to
  an awkward rule silently: if a rule is wrong, the fix is a wording change Mario approves, not a workaround that
  becomes a habit.

## Standing rulings (settled — do not re-ask, do not re-derive)
Each of these was paid for in a session. They are not open questions, and no agent reopens one
without new evidence that contradicts the ruling itself.

1. **A tests-only pass is not a version.** `ia-version` does not move, so nothing shipped: commit as
   `tests: Post-v<version> tooling pass` (`Post-V<N>` before semver), cut **no tag** (tags track `ia-version`; a tag
   on an unmoved artifact points at a lie), and give it a digest line named for what it was,
   `- **Post-v<version> … — no build.**`, **never a version of its own**. Nothing reaches the phone, so the deploy
   picture (rhythm step 7) has nothing new to report.
2. **A licence is a predicate, never prose.** An assertion pinning a direction a ruling has already found
   wrong carries a real predicate keyed on `ia-version` that REFUSES above its era and blocks `gate.sh`.
   A comment telling a future reader "a trip here is expected after D<N>" expires never and trips never.
   Key it on a number that exists today, never on the version an unbuilt ruling will ship on.
3. **A declared constant nothing reads gets its assertion wired, not deleted** — unless the claim itself
   is unruled, in which case the constant goes. A dead pin looks maintained and defends nothing, and
   **re-pointing one is worse than either**: it makes a vacuous line look freshly maintained. Before
   repointing any pin, `grep -c` the symbol and require more than the declaration.
   **A build-scoped claim is not a dead pin** (Mario, Post-V233). A check written to switch off after its
   own build ("this build changed X against the one before") retires when the next build ships, and the
   previous-version run (Proof scope) is its replacement. Rewiring applies to live checks that went dead,
   never to checks written to switch off. When a planted bug survives and a retired or dark row was its
   only guard, that claim is rewritten as a forward check (g219's D167 rows, the V221 trio).
4. **Gate and spec files are keyed to the RULING they defend, not the version being built.** A gate's
   premise is scoped to its own build and its predicate must say so. An assertion that means "MY build
   changed nothing" with no version predicate will fire on somebody else's build and read as a regression.
5. **`HALF_MANNY` moves only by ruling.** The new digest is printed by coach from a source-surgery copy
   **before** the build, recorded as an era-table row (`MANNY_DIGEST_BY_VERSION`) anchored to a
   counterfactual digest, and **every changed card is printed before and after**. Row existence is a
   conjunct so an absent row fails loudly. A digest read off the built artifact after the fact is never a pin.
6. **Any builder brief over four edits is sliced before dispatch.** The cap binds the brief I write, not
   just the agent. A long brief invites a long silent phase before the first tool call, and that is what
   the watchdog kills. Re-read tree state between slices instead of trusting the previous slice's report.
7. **When measure refutes a ruling's premise, it goes back to coach before builder — always.** A premise
   that did not survive the measure is a hypothesis, not a ruling, and building on it ships the wrong
   thing twice. Coach may retract; that is the system working, not a failure. **If the refutation lands
   mid-slice, builder PARKS the slice** — leaves it in the scratchpad, commits nothing, hands nothing to
   gatekeeper — coach re-rules, and the parked slice is resumed as-is if the re-ruling leaves it intact,
   or discarded if it does not. Finishing a slice against a refuted premise is never the cheaper path,
   because gatekeeper would prove it against a ruling that no longer exists. **A gate row that cannot pass
   is a measure too:** when writing a gate shows a ruling's claim is false, the row is parked (never written
   as a pass or a skip), measure quantifies it, and a fresh coach re-rules (V221: D177's frozen-day re-swap).

**Mario is asked only for doctrine calls:** which pattern or quality survives, ship or hold, and anything
that changes his own program. Siting, form, gate scope, agent order and tooling shape are the session's to
decide and to record. This narrows WHAT reaches him; it does not soften the rule below that everything
which does reach him arrives with a recommendation.

## Versioning (hard; semantic versioning from Post-V239, Mario)
- `<meta name="ia-version" content="MAJOR.MINOR.PATCH">` is the ground truth: three integers. Code reads and compares
  versions only through `tests/semver.js` (`tests/semver.py` from Python): `parse`, `cmp`, `lookup`, `fromHtml`. Never
  `+version`, a string compare, or arithmetic on a version; a version used with a numeric operator throws on purpose.
  Code that runs without the repo beside it (`backend/` deployed alone to Heroku, a Docker image holding one folder)
  may carry its own copy of the rule, provided a test in that folder loads `tests/semver.js` at test time and proves
  the two agree on a shared table of inputs (legacy integers, dotted versions, rejects, ordering), so the copy cannot drift.
- **Before: builds 1 to 239** each carried one integer N. Every one of them is **v0.N.0** (V239 = 0.239.0). Their
  tags stay `V<N>`, their digest lines stay `**V<N>**`, their era rows keep integer keys, and their files keep their
  names (`g<N>_*.js`, `v<N>_rulings/`); never rewrite them. Every reader takes a bare integer N as 0.N.0, so bodies
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
- Names from 0.239.1 on carry the dotted version with a lowercase v, and only where a version belongs (PRIORITY 1): the
  `ia-version` meta, tag `v0.239.1`, commit subject `v0.239.1: …`, digest line `- **v0.239.1** — …`, the release line
  of a decision entry, a scratch copy of a release's body, and, until phase 2, the legacy suite's era rows keyed
  `'0.239.1'` (`tests/era_bump.py 0.239.1`). Files made from Post-v0.239.1 on are named by feature, never by version
  (Test layout). Files made before keep their names (`tests/measure/v0.239.1_rulings/`, `tests/edits/v0.239.1_edit_s1.py`,
  `tests/sabotage/v0.239.1.json`, `tests/gates/g0.239.1_timer_label.js`). A tests-only pass after a release is
  `Post-v0.239.1`.
- In this repo the only HTML is `index.html` (Pages serves it). The previous version is the release HEAD carries, never
  "N-1": `git show HEAD:index.html > <scratchpad>/base_v<previous>.html`. Tag each release: `git tag v<version>`.
- A file version with no digest line in the handoff means a build was dropped. Stop and tell Mario.
- **Grep the file, never trust a label.** Filename, chat title, memory and handoff can all lag the artifact.

## Engineering invariants (from §10b — each one was paid for)
- Every gate run is `bash -c 'set -eo pipefail; …'` with `;` separators. `set -e` alone lets a pipe swallow node's exit code. Delete artifacts before regenerating them; an empty diff is a failure, not a clean result.
- No process substitution `<(...)` — use temp files.
- Oracles are independent: a gate never asserts the engine equals its own output. Hand tables, the doctrine text, date arithmetic.
- A gate must print `PASS n FAIL n`. Missing summary = crash = NOT a pass. A gate that crashes reports nothing, and nothing is not "no failures".
- Run every new or edited gate against the PREVIOUS version first (a new gate against the previous body relabelled to the candidate's version; Proof scope). A gate that passes on both is not testing what it claims.
- Sabotage: every mutation must trip a NAMED gate. Anchor `count==1` or it is NOT-APPLIED. A no-op mutation is a mutation defect, not a gate defect — rewrite the mutation. All-trip is as suspicious as a survivor.
- Blast-radius diff: 100% of hunks classified into a ruled class before ship. A removal that was not ruled is a regression (a ruling that SELECTS is not a ruling that DELETES).
- Identity fuzz: pin `cfg.seed`, strip clock fields, prove baseline == itself before diffing anything.
- Any harness stub that accepts a callback must be able to run it. `requestAnimationFrame` that never fires deletes a code path from the gate.
- Rename passes: a map whose KEYS are old names is rewritten LAST, or excluded from the sweep. No alias row may self-map or chain.
- A conditional write with no else branch is a latch. Move claims onto the item they describe, never onto a section label that a later filter can falsify.
- Pool and post-filter must reason about a movement through the same lens; when one part of the build asserts something about a movement, grep for the other part that has to agree.
- Strip comments before any "is this token gone" scan.
- Prove a reported bug at the reporter's seed before touching anything.
- `let`/`const` at top level do not land on the VM context; test-injectable globals are `var`. `navigator` needs `defineProperty`.
- Python edit scripts use literal bytes (real em-dashes, real `×`), never escapes. Any `\uXXXX` text that must land in a file is built in code with `chr(92)`, never typed.
- Every agent writes temp files under the session's own scratchpad (a subfolder per agent), never bare `/tmp`; parallel agents never share a scratch path.

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
**The orchestrator does not run commands longer than a minute in the main session; delegate them.** **coach and measure already have CLAUDE.md in context; do not `Read` it. builder and gatekeeper run with `omitClaudeMd: true`: they never see this file, so every brief to them carries what they need (Delegation carry, below).**
`index.html` is ~250K tokens and generated: never read it wholesale, never edit it. Code lives in `app/src/legacy/src/`: `grep -rn` the symbol and its consumers there first. Most source files are small enough to read whole; the four largest (`js/engine-c.js`, `js/cardio-progression.js`, `js/wizard.js`, `js/nsw-cardio.js`, 75 to 110 KB) are read wide at the seam. `str_replace` narrowly in the source file, rebuild, and let the tests be the backstop. Do not re-read the doctrine text mid-session unless verifying a transcription.

## Delegation carry (builder and gatekeeper do not load this file)
Every brief to either carries the per-build items, then the standing lines for that role, pasted, not paraphrased.
- **Builder, per build:** the ruling verbatim (D-code, what changes, what deliberately does not, the after-grid); the slice
  (≤4 edits) and what earlier slices landed; the baseline path; whether this slice writes `ia-version` and the exact
  `MAJOR.MINOR.PATCH` Mario picked; the diff classes the ruling licenses; the feature's decision file and the test files
  to write or extend, with the Test layout and Proof for new work sections pasted.
- **Gatekeeper, per build:** every ruling in the build, verbatim (its decision file entries); the version Mario named and its bump class; the baseline path; the
  feature tests added or changed, and every behaviour the ruling changes; the diff classes builder declared; whether
  `HALF_MANNY` may move and to what digest; the Test layout and Proof for new work sections pasted. For any change inside
  the frozen legacy suite: the gates and specs edited, the era rows written, and the Proof scope section pasted, with the
  LOCAL or CROSS-CUTTING call and its gate list, draft run or final run, and whether the full sweep is due.
- **Both, standing:** gate runs are `bash -c 'set -eo pipefail; …'`, no `<(...)`; every gate prints `PASS n FAIL n` and a
  missing summary is a crash; oracles never ask the engine; strip comments before any token-gone scan; pin `cfg.seed`,
  strip clock fields and prove a baseline equals itself before diffing; an empty diff is a failure. Standing rulings 2
  (a licence is a predicate on today's `ia-version`), 3 (wire a dead pin, never re-point it; a build-scoped claim retires at the next build), 4 (a gate is keyed to the
  ruling it defends) and 5 (`HALF_MANNY` moves only by a ruling that printed the digest first). NRC sessions are
  verbatim; no harness asserts taper, volume or rep shape on them. No gate row is scoped to one exact `ia-version`: a
  range, a minimum, or an era row (Proof scope, Version scope). Versions are `MAJOR.MINOR.PATCH`, and a bare integer N
  means 0.N.0; read and compare them only through `tests/semver.js` (`parse`, `cmp(a, b) <op> 0`, `lookup`,
  `fromHtml`) or `tests/semver.py`, never `+version` or a numeric operator. Temp files go only under the scratch path
  the brief names, never bare `/tmp`. Feature tests run with `node --test tests/unit tests/integration`; a test file
  that crashes before its first test is a failure, and a snapshot changes only by a ruling that moves program output.
- **Builder, standing:** standing ruling 7 (a premise refuted mid-slice PARKS the slice: its diff stays in the
  scratchpad as a patch, nothing committed; a test that cannot pass parks the same way); pool and post-filter reason through one lens, so
  grep the other half; a conditional write with no else is a latch; `exStoreKey` is the only `ia_exw_` writer; race day
  is found by subtype; any `\uXXXX` text that must land is built with `chr(92)`, never typed; an era row for a table the
  ruling does not move comes from `tests/era_bump.py`, never by hand; builder never edits `tests/row_manifest.txt`,
  and writes no new gate, sabotage spec or edit script (Test layout); after every app slice builder runs
  `python3 tests/sabotage.py --anchors-only index.html` and re-anchors any old mutation a ruled hunk orphaned (Mario,
  Post-V238).
- **Gatekeeper, standing:** run every new or changed feature test on the commit before the change (`IA_APP`); a test
  written for a changed behaviour that passes there is vacuous, and a changed behaviour with no test is red. For the
  frozen legacy suite: run every edited gate against the previous version too, and every new gate, and every
  edited gate whose rows expect different results by version, against the previous version's body relabelled to the
  candidate's version; every build anchor-checks
  every spec and trip-runs the Proof scope set; the full sweep runs every spec, old ones included, when it is due;
  gatekeeper alone regenerates `tests/row_manifest.txt`, from a proven run only, and classifies its hunks against the
  ruling; a sabotage anchor that is not `count==1` is NOT-APPLIED and a no-op mutation is a mutation defect;
  all-trip is as suspicious as a survivor; 100% of blast-radius hunks are classified, and an unruled removal is a regression.

## Dev mode (Mario, Post-V239): the fastest look at a change, never a proof
The dev container serves the website (`/`), the app (`/app/`, built from `app/src/legacy/src/`), the admin (`/admin/`,
admin / asylum) and the backend on http://localhost:3000, and rebuilds whatever is saved by itself, in about a second,
with nothing running on the Mac: site and admin by `ng build --watch`; the app built from its source files on every
save, with the function that builds the root `index.html` (`app/scripts/build-index.mjs`), into `backend/app-web/`
only, and the root `index.html` copied when it changes, its inline script parsed either way; the server restarted on a
`server/` change. A saved source file shows at `/app/` at once; the root file still needs `npm run build:index`. After each change it runs only tests that finish within 3 s, then
every open page reloads itself. The watcher (`backend/scripts/dev-watch.ts`) runs inside the container
(`backend/Dockerfile.dev`, `backend/docker-compose.dev.yml`); it reads the checkout read-only and writes only
`backend/dist/` and `backend/app-web/`. The container comes back by itself whenever Docker starts.
`cd backend && npm run dev` starts it (building its image when needed) and follows its log: Ctrl-C stops following,
never the container. `npm run dev:down` stops it; `npm run docker:up` puts back the plain production image. When Mario
wants to see an edit, check it answers (`curl -s localhost:3000/healthz`), run `npm run dev` in the background if not,
and hand him the link to the page that changed. It shows; it proves nothing: no gate, sabotage, row or CI result comes
from it, and a version ships only through the session rhythm. The other paths stay for devices, deploys and full
builds: `app/` `emulator-ios`, `device-ios`, `pwa-pages`, `pwa-local`; `backend/` `docker:up`, `mac-local-backend`,
`heroku.sh deploy`.

## Files
- `index.html` — the app, generated. Its source is `app/src/legacy/src/`: `js/`, `css/`, `html/` (the `ia-version` meta
  is in `html/head.html`), `order.json` (the one list of pieces, in build order) and a README saying what each file
  holds. `app/scripts/build-index.mjs` builds it (`cd app && npm run build:index`; `npm run build:index:check` fails,
  naming the first differing byte, unless the root file is the build). The sources and the rebuilt file are committed
  together; the root file is never edited by hand.
- `IRON_ASYLUM_HANDOFF_1_1.md` — the record (stable name, overwrite in place, ONE digest line per version at the tail, never a narrative at the top).
- `docs/design/THE_ASYLUM_DS_REFERENCE*.md` — design system (bone `#F4F1E8`, ink, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).
- `tests/unit/`, `tests/integration/`, `tests/snapshots/` (the feature tests and their golden files, named by feature), `tests/support/` (their helpers, on `tests/harness.js`); `docs/decisions/<feature>.md` (the rulings, one file per feature); `docs/test-migration.md` (the phase 2 map: every gate, its feature, its target file and its rows; the order; the parity rule). Test layout and Proof for new work.
- `tests/harness.js` (VM boot + fixtures + `weekGrid` + `progDigest`), `tests/measure/` (measure-pass scripts, keep them), `tests/lint_allow.txt` (known dupes = debt). Frozen legacy suite, no new files (Proof for new work): `tests/gate.sh` (runner), `tests/gates/*.js` (one file per gate family, each prints `PASS n FAIL n`), `tests/sabotage.py` + `tests/sabotage/*.json`.
- `tools/check.mjs` — the 60-second local proof (Pipeline). `.githooks/pre-commit` runs it on every commit, and `.githooks/pre-push` lets only local `dev` and tags reach GitHub (`git config core.hooksPath .githooks` once per clone). `.github/workflows/pipeline.yml` — the full suite on every push to `dev` and every pull request from `dev` into `main`, and the deploy proof after each merge.
- `tools/` — the run log (`tools/README.md`): every test, build, deploy and server run is a folder under `temp/runs/` (gitignored, kept out of iCloud) with a line in `temp/events.log`; `~/Library/Logs/IronAsylum/orchestration.log` has one line per top-level start on this Mac. When something went wrong, `node tools/logs.mjs` is the first place to look. `tools/deploy-check.mjs` is rhythm step 7 as one command.
- `doctrine/*.txt` — page-ordered OCR of the NSW guide and the four NRC plans. Gitignored (not published by Pages); regenerate from the archives with `doctrine/README.md` if missing.
