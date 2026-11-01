# Starter kit

Iron Asylum's delivery setup as files for a new project: the pipeline, the git hooks, the 60-second check, the Docker
images (production and dev mode), Heroku's manifest and helper, the deploy proof, a minimal TypeScript server with its
tests, and the standing rules for Claude. `../README.md` (the playbook) says what each piece does and why.

## Use it

```bash
bash ~/Developer/TheBig6V2/docs/playbook/starter-kit/scaffold.sh ~/Developer/NewApp --project "New App" --owner bigyerr --repo NewApp
```

It copies the kit, fills in the names, runs `npm install`, makes the first commit (through the pre-commit check) and
leaves the new repo on `dev`. Everything it does is local. GitHub and Heroku come next: the playbook's day-one
checklist. `--help` lists the options (`--slug`, `--heroku-app`, `--owner-name`, `--port`, `--no-install`).

## What a new project gets

```
CLAUDE.md                       the standing rules (from CLAUDE.template.md)
.claude/settings.json           Agent launches ask first (from claude-settings.json)
.github/workflows/pipeline.yml  dev: every check; PR into main: the same plus "PR source is dev"; main: the deploy proof
.githooks/pre-commit            the 60-second check on what a commit touches
.githooks/pre-push              only local dev reaches GitHub; a worktree never pushes
.gitignore                      (from gitignore)
package.json, Procfile          Heroku's manifest and web process
tools/check.mjs                 the 60-second check: one lane per package, hard limit
tools/deploy-check.mjs          the deploy picture, and the wait until Heroku serves a commit
backend/server/                 a minimal node:http server with /healthz (swap in a framework when needed)
backend/test/                   /healthz's contract, and the platform files agreeing (one Node line everywhere)
backend/Dockerfile              the production image (multi-stage, slim, non-root, health check)
backend/Dockerfile.dev          the dev image (toolchain baked in, sources mounted read-only, restarts on save)
backend/docker-compose*.yml     npm run docker:up, npm run dev
backend/scripts/heroku.sh       setup, verify, deploy, status, logs, local (Heroku's build on your Mac)
docs/decisions/                 one file per feature, for the decisions
```

## The placeholders

`scaffold.sh` fills these and refuses to finish if any is left: `__PROJECT__` (display name), `__SLUG__` (package and
compose name), `__OWNER__` and `__REPO__` (GitHub), `__OWNER_LC__` and `__REPO_LC__` (the same, lower case, for the
push guard), `__HEROKU_APP__`, `__OWNER_NAME__` (who picks the bump and opens pull requests), `__PORT__` (the local
Docker port). Three files are renamed on the way: `gitignore`, `CLAUDE.template.md` and `claude-settings.json`. Here they
would act on this repo (a nested `.gitignore` applies to its folder, and Claude reads a nested `CLAUDE.md`), so they
wait under other names.

## Keeping it honest

The kit is a snapshot of Iron Asylum's setup at v0.254.0 (2026-10-31). When Iron Asylum's pipeline changes in a way the
next project should have, change the kit in the same commit, then run the smoke test: scaffold into the scratchpad, then
in the new folder `bash backend/scripts/heroku.sh local --check` and `cd backend && npm run docker:up`, and
`npm run docker:down` after.
