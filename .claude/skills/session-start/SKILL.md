---
name: session-start
description: Verify the canonical Iron Asylum artifact and handoff agree before any work. Run at the start of every session, or when Mario says "session start" / "where are we".
---
**PRIORITY 1 (Mario, Post-V239): semantic versioning.** Every version this skill reads, prints or writes is `MAJOR.MINOR.PATCH` with a lowercase v (`v0.240.0`), never a future `V<N>` or a bare integer. `V1` to `V239` are history and keep their names (V239 = 0.239.0). A future `V<N>` found anywhere is a defect: use the dotted form and report the correction. CLAUDE.md, PRIORITY 1, has the names.

Run these, in order, and report the six lines. Do not begin design or edits until the first four agree.

0. **Your own worktree first (One chat per worktree, Mario, Post-v0.256.0).** If this chat's folder is the main checkout
   (`git rev-parse --git-dir` equals `git rev-parse --git-common-dir`) and the branch is `dev`, call `EnterWorktree` before
   any edit, on a branch named `chat/<work>` for the work Mario has asked for. `EnterWorktree` cuts its branch from
   `origin/main`, not `dev`, and names it `worktree-<name>` (seen Post-v0.261.4): before any edit, while the branch holds
   no work, run `git branch -m chat/<work>` and `git reset --hard refs/heads/dev`, then read `git log -1` back as `dev`'s
   HEAD. Then run `node tools/worktree-deps.mjs` before the first build: a worktree is checked out without the app's,
   the website's and the backend's `node_modules`, and `npm run build:index` fails without the app's (Post-v0.261.7). It
   borrows each from the main checkout, or exits 1 naming the `npm ci` to run. The main checkout holds `dev` and nothing
   else; a chat never commits there (the pre-commit hook refuses). Report the branch in the GIT line. When Mario says push,
   `node tools/land.mjs` from the worktree lands the branch on `dev` and pushes, as one step.

1. Version on disk:
   `grep -oE '<meta name="ia-version" content="[^"]+"' index.html` (`MAJOR.MINOR.PATCH`; a bare integer N is a pre-semver build, 0.N.0)
   Also `ls *.html` — there must be exactly one HTML file in the repo root.
2. Version the handoff claims:
   `grep -m1 -oE '\*\*Working file:\*\*[^\n]*[vV][0-9][0-9.]*' IRON_ASYLUM_HANDOFF_1_1.md`
3. Digest line for that exact version at the tail:
   `grep -nE '^- \*\*v<version>' IRON_ASYLUM_HANDOFF_1_1.md` (`V<N>` for a pre-semver build)
   A file version with NO digest line means a build was dropped or the previous session never folded its entry. Say so; do not silently continue.
4. Git state: `git status --short && git log --oneline -3 && git tag --list 'v*' 'V*' --sort=-creatordate | head -3`.
   Uncommitted changes in `index.html` at session start are a red flag: ask Mario before proceeding.
5. Deploy picture: read local, GitHub, Pages, live, any native build version and TestFlight (`node frontends/app/scripts/testflight.mjs leg`), each from its own source, as CLAUDE.md Session rhythm step 7 sets out. A lagging deploy is reported, never a blocker.
6. Feature tests (CLAUDE.md Test layout): `bash -c 'set -eo pipefail; cd tests && npx vitest run unit integration' 2>&1 | grep -E '^ *(Test Files|Tests) |FAIL'` (a few seconds; `npm ci` in `tests/` first if `tests/node_modules` is missing). A red test at session start is reported before any work, never worked around.

When the work touches the engine or what a program prescribes, print the before-picture for the live program so the
session has a baseline in context (a screen or tooling bug skips it: the grid says nothing about either):
`bash -c 'set -eo pipefail; node tests/harness.js index.html --grid' | head -40`

Report:
```
FILE     index.html  ia-version M.m.p
HANDOFF  header vM.m.p / digest line: present|MISSING
GIT      clean|dirty, HEAD <sha> <msg>, last tag vM.m.p
QUEUE    <§12 ruled-and-unbuilt items, one line>
DEPLOY   local M.m.p (HEAD <sha>, +a/-b origin)  github M.m.p  pages built <sha>  live M.m.p  native M.m.p|none  testflight M.m.p <state>|skipped|none
TESTS    <n> pass, <n> fail (tests/unit, tests/integration)
```
