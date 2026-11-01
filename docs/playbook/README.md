# How we ship: the GitHub, Docker and Heroku workflow

This is the delivery setup Iron Asylum runs on, written down so the next project has it from day one. It has two parts:

- **This playbook:** what each piece does, why it is there, and the order to stand it up in.
- **[`starter-kit/`](starter-kit/README.md):** the same pieces as files. One command copies them into a new folder and
  fills in the names, and the result already passes its own checks, builds its Docker image and runs Heroku's build.

Everything here was proved on Iron Asylum before it was written down. The "why" lines name what broke when a piece was
missing.

## The shape

```
 YOUR MAC                         GITHUB                                  PRODUCTION

 save a file
   -> dev container restarts the server (localhost, about 1 s)

 git commit, on dev
   -> pre-commit: the 60-second check

 git push origin dev  --------->  pipeline on dev: every check
   (pre-push lets only             (backend, Heroku build, docker)
    dev through)                   nothing waits on it
                                         |  you read the run
                                         v
                                  pull request dev -> main
                                  you open it by hand; same checks,
                                  plus "PR source is dev"; branch
                                  protection: all must pass
                                         |  you merge
                                         v
                                  push to main  ----------------------->  Heroku deploys main by itself
                                         |                                (root package.json + Procfile)
                                         v                                        |
                                  deploy proof: /healthz reports  <---------------+
                                  the merged commit
                                         |
                                  tag v<MAJOR.MINOR.PATCH> on what merged
```

## The rules in one breath

`dev` is where work lands and `main` is production. Commit on `dev` as often as you like; each commit runs a check that
cannot take more than 60 seconds. Push `dev` when you choose, and GitHub runs everything. Nobody waits for it. You read
the run, then you open the pull request into `main` yourself, and it merges only if every check passed. Heroku deploys
`main` on its own, and the pipeline proves the live server is running the merged commit. Then the release gets its tag.

## The pieces

### 1. Two branches, and `main` only by pull request

**What:** `dev` takes every commit. `main` changes only by a pull request from `dev`, and branch protection blocks the
merge until every required check passes. The pipeline's first job, `PR source is dev`, fails any pull request into
`main` from another branch.

**Where:** `.github/workflows/pipeline.yml` (the `source` job). The branch protection itself lives in GitHub's settings.
Its required checks are the pipeline's job names, so renaming a job means renaming it there too.

**Why:** production changes at one moment you chose, and only to code that passed everything. Agents push to `dev` when
asked and never open or merge a pull request. You open every one by hand after reading the run.

### 2. The 60-second check, on every commit

**What:** `node tools/check.mjs` runs each package's `typecheck`, `test` and `lint` scripts in parallel, under a hard
60-second limit. A step still running at the limit fails the check. `--staged`, which the pre-commit hook runs, checks
only the packages the commit touches, so a docs-only commit checks nothing. A failed step's full output goes to
`temp/check/`.

**Where:** `tools/check.mjs` (add a lane per package to `LANES`), `.githooks/pre-commit`. Turn the hooks on once per
clone with `git config core.hooksPath .githooks`.

**Why:** a slow local proof gets skipped, and a skipped proof is worth nothing. The limit makes "is this fast enough to
run every time?" a hard rule. Anything slower moves to CI. Never `git commit --no-verify`.

### 3. The push guard, and worktrees that never push

**What:** `.githooks/pre-push` refuses any push to the GitHub repo except local `dev` to `dev`, plus tags. It refuses
every push from a git worktree. A worktree session lands its work by rebasing onto local `dev`, and the main checkout
fast-forwards with `git merge --ff-only <branch>`.

**Why:** in Iron Asylum, a worktree pushed three commits straight to `origin/dev` while the main checkout held four
unpushed ones. `dev` forked (4 ahead, 3 behind) on a project with one developer. Since the guard went in, it has not
happened again.

### 4. The pipeline: the full suite in GitHub Actions

**What:** one workflow, three triggers:

| Trigger | Runs |
|---|---|
| push to `dev` | every check: `backend` (type check, tests, lint), `Heroku build`, `docker` |
| pull request `dev` into `main` | the same checks again, plus `PR source is dev` |
| push to `main` (the merge) | `deploy proof (Heroku)` |

A newer push cancels the run in progress. Every job uploads `temp/` as an artifact, so a red job can be read the same way
as a local failure.

**Why each job exists:**
- `Heroku build` runs Heroku's own build steps on the runner and boots the result (section 7). A broken root
  `package.json` turns red here, before `main`, instead of failing a production deploy.
- `docker` builds the production image, waits for its health check, and confirms `/healthz` reports the commit under
  test.
- Give jobs headroom: Iron Asylum's test job needed 25 minutes, not 15, after a slow runner took twice as long and cut
  off a run that had no failing test.

### 5. Heroku: one dyno, deployed from `main` by itself

**What:** Heroku's GitHub integration deploys every push to `main` automatically. The repo root holds Heroku's
manifest. `package.json` pins Node (`engines`) and its `build` script builds `backend/`. The `Procfile` starts the
compiled server. One dyno serves everything: in Iron Asylum, the website at `/`, the admin at `/admin/`, the app at
`/app/` and the API.

**Where:** `package.json`, `Procfile`, `backend/scripts/heroku.sh`.

**Lessons already built in:**
- Heroku builds with `NODE_ENV=production`, so `npm ci` skips dev dependencies (TypeScript among them). The root `build`
  script installs each folder with `--include=dev`, builds, and then prunes. Without that, the build cannot find `tsc`.
- `heroku.sh setup` turns on `runtime-dyno-metadata`. That is what puts `HEROKU_SLUG_COMMIT` into the dyno, so
  `/healthz` can report which commit is live. Without it, no deploy can be proved.
- New Heroku apps get a random suffix in their URL. Setup reads the URL back and stores it (`git config
  deploy.herokuUrl`) rather than guessing it.
- Heroku's disk is wiped on every restart. Data that must last goes in a database (Heroku Postgres, say), never a file.
- `heroku.sh deploy` is the manual path for the day the automatic deploy does not fire. It pushes `origin/main`, never
  your working copy.

### 6. `/healthz` and the deploy proof: a push is not a deploy

**What:** the server answers `/healthz` with `{ ok, version, commit, release, backend, ... }` and `cache-control:
no-store`. `node tools/deploy-check.mjs` reads every leg from its own source and prints one line:

```
DEPLOY  local 1.4.2 (dev a1b2c3d, +0/-0 origin/dev)  dev 1.4.2  main 1.4.1  heroku 1.4.1 e4f5a6b (= main)
```

Without `--picture`, it then waits until the live `/healthz` reports the commit, cache-busted. The pipeline's deploy
proof job runs it after every merge. It passes with a notice while the `HEROKU_URL` repo variable is unset, so a new
project stays green until Heroku is set up.

**Why:** GitHub Pages once reported "built" with no error while it sat several commits behind. It silently did not fire
on two Iron Asylum releases, and nobody noticed for a while. Since then, each leg is read from its own source and never
inferred from another. You always hear the live number that was read back, never the number that was pushed.

### 7. `heroku.sh local`: Heroku's build on your Mac

**What:** `bash backend/scripts/heroku.sh local` copies the tree Heroku would receive into `temp/heroku-local/slug`.
It builds it the way the Node buildpack does (`npm ci`, then `heroku-postbuild` or `build`, then a prune), starts the
`Procfile`'s web process with a dyno's environment, and reads `/` and `/healthz` back. `--check` stops after the
read-back. npm stays offline unless you pass `--online`, which CI does.

**Why:** a Heroku build failure shows only after a merge into `main`, the worst moment to find it. This shows it on your
Mac in seconds, and the pipeline's `Heroku build` job runs it on every push.

### 8. Docker: the production image

**What:** a multi-stage image. Stage one compiles the TypeScript. The final stage carries only the compiled server and
production dependencies, runs as the unprivileged `node` user, and has a `HEALTHCHECK` built on Node's own `fetch` (the
slim image has no curl). The build context is the repo root, so a frontend added later sits beside `backend/` just as
it does in the checkout. Its `.dockerignore` is an allowlist: a new folder cannot leak into the image by accident.

**Where:** `backend/Dockerfile`, `backend/Dockerfile.dockerignore`, `backend/docker-compose.yml`. `npm run docker:up`
builds it, starts it and waits for the health check.

### 9. Docker: dev mode, the fastest look at a change

**What:** `cd backend && npm run dev` starts the dev container and follows its log. Ctrl-C stops following, not the
container. The image bakes in only the toolchain: Node and the Linux builds of every dependency. The sources are mounted
**read-only**, and `node --watch` restarts the server on every save. In the smoke test a saved change was live in about
one second. `restart: unless-stopped` brings it back whenever Docker starts. `npm run dev:down` stops it, and `npm run
docker:up` puts the production image back.

**Why:**
- A Mac's `node_modules` never loads into a Linux container: native binaries differ. The image keeps its own.
- The container cannot write your checkout, so a watcher bug cannot damage your files.
- Each project's containers come back with Docker, so **each project needs its own local port**. Iron Asylum holds 3000,
  and the kit defaults to 3001.
- Dev mode shows a change. It proves nothing: proof is the check, then CI.

### 10. Semantic versioning, picked by you

**What:** every release is `MAJOR.MINOR.PATCH`. The version lives in one place (`backend/package.json` in the kit) and
is written with `npm version <patch|minor|major> --no-git-tag-version`. Before every release, Claude asks which bump,
with a recommendation. PATCH is a fix, MINOR is a feature, MAJOR is a breaking change or a milestone you declare. After
the merge, the tag goes on what merged: `git tag v1.4.2 origin/main && git push origin v1.4.2`. A tests-only or docs-only
pass is not a release: no version, no tag.

**Why:** Iron Asylum spent 239 builds on bare integers, and "V240" kept getting written for things that were not
releases. Dotted versions made patch, feature and break visible at a glance.

### 11. CLAUDE.md: the rules the agent works by

**What:** `CLAUDE.md` holds the standing rules: the pipeline, the session rhythm (measure, decide, ask for the bump,
build, prove, record, report the deploy picture), proof for new work, the engineering invariants, how to put a question
to you, and the friction report. `.claude/settings.json` makes every subagent launch ask first.

**Why:** each rule cost a session to learn. Writing it down once is cheaper than paying again.

## Day one: a new project, start to deploy

You need Node 26, Docker Desktop, `gh` (logged in), the Heroku CLI (logged in) and git. Keep the project in
`~/Developer/`, never in iCloud (Desktop or Documents): iCloud sync corrupted Iron Asylum's `.git`.

**1. Scaffold it (local only).**
```bash
bash ~/Developer/TheBig6V2/docs/playbook/starter-kit/scaffold.sh ~/Developer/NewApp --project "New App" --owner bigyerr --repo NewApp
```

**2. See it run.**
```bash
cd ~/Developer/NewApp/backend && npm run dev
```
Open http://localhost:3001 and http://localhost:3001/healthz.

**3. Create the GitHub repo.** The push guard lets only `dev` through, so `main` is created on GitHub from the same
commit, through the API.
```bash
cd ~/Developer/NewApp && gh repo create bigyerr/NewApp --public --source . --remote origin
```
```bash
git push -u origin dev
```
```bash
gh api repos/bigyerr/NewApp/git/refs -f ref=refs/heads/main -f sha="$(git rev-parse main)" && gh repo edit bigyerr/NewApp --default-branch main
```
Branch protection is free on public repos. A private repo needs GitHub Pro for it.

**4. Protect `main`.** The check names are the pipeline's job names.
```bash
gh api -X PUT repos/bigyerr/NewApp/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["PR source is dev", "backend", "Heroku build", "docker"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

**5. Create the Heroku app.** Dynos are billed, so check the plan first.
```bash
bash backend/scripts/heroku.sh setup
```
Setup prints the app's URL. Then make two settings by hand:
- Heroku dashboard, the app, **Deploy**: connect GitHub `bigyerr/NewApp`, then **Enable Automatic Deploys** from `main`.
- Give the pipeline the URL for its deploy proof: `gh variable set HEROKU_URL --body <the URL setup printed>`.

**6. First release.** `0.1.0` is already in `backend/package.json`.
- Commit one change on `dev` (a line in a README will do) and push it. `dev` and `main` start on the same commit, and
  GitHub cannot open a pull request with nothing in it. The push runs all three checks; they go green.
- Open the pull request `dev` into `main` on GitHub and merge it.
- On `main`, the deploy proof waits until Heroku serves the merge commit.
- Tag it: `git fetch origin && git tag v0.1.0 origin/main && git push origin v0.1.0`
- `node tools/deploy-check.mjs --picture` should show the same version on every leg.

## The daily loop

1. `npm run dev` stays up in `backend/`. Edit, then look at localhost.
2. Commit on `dev`. The hook runs the 60-second check.
3. Push `dev` when you are ready. GitHub runs everything, and nothing waits on it.
4. Read the run. Open the pull request into `main` and merge it.
5. The deploy proof goes green. Tag the release and read the deploy picture.

## Add-ons: copy them from Iron Asylum when the next project needs them

| Add-on | Where it lives in Iron Asylum |
|---|---|
| Angular frontends served by the same server (`/`, `/admin/`) | `frontends/`, stage one of `backend/Dockerfile`, the root `package.json` build. Add a lane to `tools/check.mjs` and a read-only mount to `docker-compose.dev.yml`. |
| A static site on GitHub Pages, with its deploy proof | `pipeline.yml` jobs `pages` and `deployed`, `tools/deploy-check.mjs`. Set the Pages source to "GitHub Actions" from the start. |
| An iOS app shipped to TestFlight from CI | `pipeline.yml` jobs `native`, `testflight-gate`, `testflight` and `testflight-processed`; `frontends/app/scripts/ios.mjs`, `signing.mjs`, `testflight.mjs`; `frontends/app/README.md` ("TestFlight from CI"). Seven repo secrets that only you enter. The gate skips and stays green while any secret is unset. App Store Connect accepts a version once, so a fix ships as the next PATCH. |
| End-to-end tests in Docker (Puppeteer, nothing on the host) | `tests/e2e/` and its README, the pipeline's `e2e` job. |
| The run log (every run in `temp/runs/`, one history file) | `tools/runlog.mjs`, `run.mjs`, `logs.mjs`, `agent-hook.mjs`, and the hooks in `.claude/settings.json`. |
| Admin login and allowed origins as config vars | `backend/server/config.ts`; `heroku.sh setup` asks for the admin login and never prints it. |
| Deploying part of a big repo to Heroku | `heroku.sh deploy` in Iron Asylum builds a smaller tree with `git commit-tree` and pushes that. |

## What stays behind

Iron Asylum's own domain does not carry over: the program engine, the coach hat and its doctrine, D-codes and their
registry, `HALF_MANNY`, the handoff file, the integer history from V1 to V239, and the committed root `index.html` that
exists only until Iron Asylum switches its Pages source. The kit keeps the habit (decisions written down, one file per
feature, in `docs/decisions/`) without the machinery.

## Keeping this true

The kit is a snapshot of Iron Asylum at v0.254.0, taken 2026-10-31. When Iron Asylum's delivery setup changes in a way
the next project should have, update the kit in the same commit, then run the smoke test in `starter-kit/README.md`.
