# __PROJECT__: standing rules for every agent in this repo

Read this before touching anything. These rules came over from Iron Asylum, where each one was paid for in a session.
Decisions live in `docs/decisions/<feature>.md`; this file is the short version that is never violated.

## PRIORITY 1: semantic versioning
Every release is `MAJOR.MINOR.PATCH`: `1.4.2` in a file, `v1.4.2` in a tag. Nobody writes a future release as `V<N>` or
as a bare integer, anywhere: not in chat, a commit, a file name or a doc. One found is corrected and the correction said.
- **The version lives in one place:** `backend/package.json`'s `version`. Write it with `npm version <patch|minor|major>
  --no-git-tag-version` in `backend/`, never by hand arithmetic. Any other copy has a test that fails when it differs.
- **__OWNER_NAME__ picks PATCH, MINOR or MAJOR before every release.** Ask before the first edit, the recommended option
  first, each option naming the number it produces and one line on why. Never infer it. If the work grows past the class
  picked, ask again before the version is written.
  - PATCH: a bug fix. No new capability, no stored-format change.
  - MINOR: a feature, or a change in what the product does.
  - MAJOR: a breaking change (stored data that needs a migration) or a milestone __OWNER_NAME__ declares. Pre-1.0 until then.
- **A version appears only where a version belongs:** the version field, the tag, the release commit subject
  (`v1.4.2: <one line>`), the decision file's release line. Files are named for the feature they cover, never a version.
- **A pass that ships no behaviour (tests, docs, tooling) is not a version:** it commits as `tests: …` or `docs: …`,
  moves no version and cuts no tag.

## Pipeline: fast locally, the full suite in CI, `main` only by pull request
- **Two branches.** `dev` is where work lands. `main` is production: Heroku deploys every push to it by itself. Branch
  protection lets `main` change only through a pull request from `dev` whose pipeline checks all passed. Its required
  checks are the pipeline's job names, kept in GitHub's settings, so a renamed job is renamed there too.
- **Commit on local `dev` as often as needed. Push only when __OWNER_NAME__ asks** (`git push origin dev`). Every push
  runs the full suite in GitHub Actions; nothing waits on it, and __OWNER_NAME__ reads the run. Read a run
  (`gh run list --branch dev --limit 1`, `gh run view <id>`) only when asked.
- **__OWNER_NAME__ opens every pull request into `main` by hand, after reading the run. No agent opens one, merges one
  or turns on auto-merge.** After the merge, tag what merged:
  `git fetch origin && git tag v<version> origin/main && git push origin v<version>`.
- **A worktree never pushes.** A session in a git worktree commits on its own branch, rebases it onto local `dev`, and
  the main checkout fast-forwards (`git -C <main checkout> merge --ff-only <branch>`). `.githooks/pre-push` refuses
  anything else that targets GitHub.
- **One writer per working tree.** While a change is in flight, one session writes to this checkout. Any other session
  that needs to write works in its own worktree or waits until the change commits.
- **Local proof is 60 seconds, hard.** `node tools/check.mjs` runs every lane; `--staged` runs the lanes a commit touches
  (the pre-commit hook). Anything slower belongs in CI. **Never `git commit --no-verify`.**
- **Stage by path, never `git add -A`:** another session's files must not ride in your commit.
- **A push is not a deploy.** After every push or merge, read each leg from its own source and print the picture
  (`node tools/deploy-check.mjs --picture`):
  ```
  DEPLOY  local 1.4.2 (dev a1b2c3d, +0/-0 origin/dev)  dev 1.4.2  main 1.4.1  heroku 1.4.1 e4f5a6b (= main)
  ```
  Tell __OWNER_NAME__ the live number you read back, never the number you pushed. A lagging deploy is reported, not
  waited on.

## Session rhythm (do not skip steps)
1. **Start:** `git status`, the version in `backend/package.json`, and the deploy picture. A compaction mid-change is not a
   stop: re-read the tree before the next step.
2. **Measure before designing:** prove a reported bug before touching anything. Numbers come with denominators.
3. **Decide before coding:** write the decision to `docs/decisions/<feature>.md` (date, who decided, the finding, what
   changes, what deliberately does not, the expected values, and the release that shipped it, filled in at ship time).
   Product calls go to __OWNER_NAME__.
4. **Ask for the bump** (PRIORITY 1), then build: narrow edits, the feature's tests, the version written.
5. **Prove** (Proof, below): the 60-second check green, then the CI run on the pushed commit.
6. **Record and commit** on `dev`: `v<version>: <one line>`, staged by path, the decision's release line filled in.
7. **Report the deploy picture.**

## Roles: one context, no subagents
- The main session does all the work itself, in one context. No subagents, parallel agents or agent worktrees unless
  __OWNER_NAME__ explicitly asks in chat. `.claude/settings.json` makes every Agent launch ask first.
- The order still binds, as hats worn one after another: **measure** (the before picture), **decide** (the ruling),
  **build** (narrow edits and their tests), **gatekeep** (the proof). A measure that refutes a decision's premise sends it
  back to be decided again before anything is built on it.

## Tests
- A test file is named for the feature it covers (`rest-timer.test.ts`), never a version or a ticket. A new behaviour
  goes into its feature's file; a new file is a new feature.
- Oracles are independent: expected values come from the spec, a hand table or arithmetic, never from asking the code.
  A golden snapshot is the one exception, regenerated only on purpose, with its diff reviewed in the same commit.
- A test file that crashes before its first test, or registers none, is a failure, never a pass.

## Proof for new work
- Each test written for a changed behaviour fails on the previous release (check out the previous commit's code in the
  scratchpad and run the new test against it). One that passes on both proves nothing, unless its file says it guards
  behaviour that must not change.
- Every behaviour the decision changes has a named test. A changed behaviour with no test is red.
- Every hunk of the diff is classified against the decision before ship. A removal nobody decided is a regression.
- No version is done until the CI run on the commit __OWNER_NAME__ releases is green.

## Engineering invariants
- Every shell pipeline that proves something is `bash -c 'set -eo pipefail; …'`. `set -e` alone lets a pipe swallow an
  exit code. No process substitution `<(...)`; use temp files.
- Temp files go under the session's scratchpad, never bare `/tmp`.
- Delete artifacts before regenerating them; an empty diff is a failure, not a clean result.
- Grep the file, never trust a label: a file name, a chat title, memory and the docs can all lag the code.
- The repo lives outside iCloud (`~/Developer/__REPO__`). iCloud sync corrupts `.git`.
- One Node line everywhere: `engines.node` in both package.json files, every `FROM node:` and `NODE_VERSION` in the
  pipeline. `backend/test/platform.test.ts` holds them together.
- Secrets never enter the repo, a chat or a log. __OWNER_NAME__ enters every one by hand (Heroku config vars, GitHub
  secrets); no agent handles a secret or asks for one in chat.

## Answering __OWNER_NAME__
- **Every question, risk or decision point ships with a recommendation:** what you would do and why, the strongest
  counter-argument, then the choice. Never a bare menu.
- Asks go last, in one plain "What I need from you" block, numbered, one or two short lines each. Chat is for decisions;
  evidence goes in the decision file.
- __OWNER_NAME__ is asked only for product calls: what ships, what the user sees, anything irreversible or public. Siting,
  form, test scope, order of work and tooling shape are the session's to decide and to record.

## Friction report
After each release, in five lines or fewer, report only what fired: a rule that had to be interpreted or worked around
(name it and the workaround), a proof that came close to 60 s or a CI job that had to be rerun, a required step that
proved nothing new. For each, say whether the wording should change and to what. Never adapt to an awkward rule
silently: the fix is a wording change __OWNER_NAME__ approves.

## Dev mode: the fastest look at a change, never a proof
`cd backend && npm run dev` starts the dev container on http://localhost:__PORT__ and follows its log (Ctrl-C stops
following, never the container). The sources are mounted read-only and the server restarts on every save; the container
comes back whenever Docker starts. `npm run dev:down` stops it, `npm run docker:up` runs the production image instead,
`npm run heroku:local` runs Heroku's build and dyno on this Mac. It shows; it proves nothing.

## Token discipline
Run anything that takes longer than a minute in the background, its output in a file, and read back only the summary.
Grep before reading, read narrowly, and write scripts that gather everything in one run.

## Files
- `backend/`: the server (`server/`, TypeScript, compiled by tsc into `dist/server/`), its tests (`test/`), the Docker
  files (`Dockerfile` production, `Dockerfile.dev` and `docker-compose.dev.yml` dev mode) and `scripts/heroku.sh`.
- `package.json` and `Procfile` at the root: Heroku's manifest. The release version is `backend/package.json`'s.
- `.github/workflows/pipeline.yml`: the full suite on every push to `dev` and every pull request into `main`, the deploy
  proof after each merge.
- `.githooks/`: `pre-commit` runs the 60-second check, `pre-push` lets only local `dev` and tags reach GitHub. Enable once
  per clone: `git config core.hooksPath .githooks`.
- `tools/check.mjs`: the 60-second check. `tools/deploy-check.mjs`: the deploy picture and proof.
- `docs/decisions/<feature>.md`: the decisions, one file per feature.
