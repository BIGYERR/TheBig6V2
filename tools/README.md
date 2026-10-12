# Run logs: one history of every test, build, deploy, server and Claude session

Everything that runs in this repo leaves a record in `temp/` (repo root, gitignored, excluded from iCloud):

```
temp/
  events.log                         THE history: one line per event, every run, oldest first
  runs/
    2026-10-11_15-58-03-e2e/         one folder per run: when it started, then what it is
      summary.txt                    what ran, where, git commit, ia-version, how long, PASS / FAIL / STOPPED
      events.log                     this run's events as they happened (a live server keeps appending)
      output.log                     everything it printed, stdout and stderr, each line timestamped
      artifacts/                     what it made: e2e report and collage, docker and nginx logs, xcodebuild
                                     logs, ...
  latest/<type>                      link to the newest run of each type
  hooks/<event>.json                 the last raw input of each Claude hook (for checking what Claude sent)
  orchestration.log                  link to the machine's orchestration log (next section)
```

## The machine's orchestration log: what was started, by whom, and where to look

`~/Library/Logs/IronAsylum/orchestration.log` is one running text file for the whole Mac: **one line per top-level
start**, from every checkout and worktree, with the exact folder (or transcript) to open. Nested steps, finishes and
output are not in it; the folder it points at has those.

```
2026-10-11 16:20:01  you     claude-session      claude@61a68a9c started (startup) in TheBig6V2  -> <session transcript .jsonl>
2026-10-11 16:20:09  you     prompt              "run the e2e again" (claude@61a68a9c, TheBig6V2)  -> <session transcript .jsonl>
2026-10-11 16:20:12  claude  e2e                 npm run e2e (TheBig6V2/app; main 618605d; ia-version 239)  -> /Users/.../TheBig6V2/temp/runs/2026-10-11_16-20-12-e2e
2026-10-11 16:31:40  claude  agent               dispatched gatekeeper: Prove the run-log pass (claude@61a68a9c, TheBig6V2)  -> <session>/subagents/
2026-10-11 16:45:02  you     unit                npx vitest run unit integration (TheBig6V2/tests; dev a1b2c3d; ia-version 0.239.1)  -> /Users/.../temp/runs/...-unit
<time>               <who>   <what>              <how it was asked for (where; git; version)>  -> <folder to open>
```

- **who**: `you` for a terminal, `claude` for a command Claude ran (its shells carry `CLAUDECODE=1`).
- **what**: the run type, or `claude-session`, `prompt` (the first 120 characters of what you asked) and `agent`.
- **where**: the checkout (`TheBig6V2`, or `worktree <name>`) and the folder the command ran in.
- Read it with `node tools/logs.mjs orch` (`-n 200`, `orch grep e2e`), or open `temp/orchestration.log`.
- `IA_ORCH_LOG=/path` moves it. Prompts come from the `UserPromptSubmit` hook in `.claude/settings.json`; remove that
  entry to stop logging them.

Every event line has the same four columns, so one `grep` reads across all of them:

```
2026-10-11 16:14:36.523  deploy-pages@161436        run       started: node tools/deploy-check.mjs (in .; main 618605d; ia-version 239)
2026-10-11 16:14:37.235  deploy-pages@161436        pages     Pages built 0092982
2026-10-11 16:14:37.533  deploy-pages@161436        run       PASS after 1.1 s: live: https://bigyerr.github.io/TheBig6V2/ serves ia-version 239
<local time, ms>         <type>@<HHMMSS it started>  <subject> <description>
```

The shared `temp/events.log` gets each run's start and finish, every failure and error (at most 20 per run), every
deploy step, and Claude's sessions and agents. A run's own `events.log` also has its steps and requests.

## Reading it

From the repo root (`npm run logs -- <args>` does the same from `frontends/app/` or `backend/`):

| Command | Shows |
|---|---|
| `node tools/logs.mjs` | the last 40 lines of the history (`-n 200` for more) |
| `node tools/logs.mjs grep <text>` | every history line containing the text |
| `node tools/logs.mjs orch` | the machine's orchestration log: one line per top-level start, every checkout (`-n 200`, `orch grep <text>`) |
| `node tools/logs.mjs runs [type]` | the newest 25 runs: when, type, result, how long, folder |
| `node tools/logs.mjs show [type]` | the newest run's summary and events |
| `node tools/logs.mjs follow [type]` | a running run's events as they arrive (`follow server-pwa-local`) |
| `node tools/logs.mjs open [type]` | the folder in Finder |

## What logs itself, and as which type

| Run | Type | Started by |
|---|---|---|
| feature tests (`tests/unit`, `tests/integration`, `tests/sweeps`, against `tests/snapshots`; Vitest) | `tests` | `npm test` in `tests/`, or `node ../tools/run.mjs tests -- npx vitest run unit integration sweeps` there (CI; the check runs them unwrapped) |
| type check of `core/` and `tests/` | `tests-typecheck` | `npm run typecheck` in `tests/` |
| unit, integration tests, type check, lint (app) | `unit`, `integration`, `typecheck`, `lint` | `npm test`, `npm run test:unit`, ... in `frontends/app/` |
| e2e in Docker | `e2e` (report, collage, docker and nginx logs in artifacts) | `npm run e2e` |
| PWA on this Mac | `server-pwa-local` (every request, from start to Ctrl-C) | `npm run pwa-local` |
| Angular dev server | `server-app-dev` | `npm start` |
| iOS builds | `build-ios-emulator`, `build-ios-device` (xcodebuild log in artifacts) | `npm run emulator-ios`, `device-ios` |
| PWA for Pages | `build-pwa-pages` | `npm run pwa-pages` |
| `index.html` from its source files | `build-index` | `npm run build:index` in `frontends/app/` |
| backend tests, lint | `backend-test`, `backend-lint` | `npm test`, `npm run lint` in `backend/` |
| backend servers | `server-backend-dev` (the full stack dev mode: the dev container's log while it is followed, every rebuild, test run and restart), `server-backend-dev-server`, `server-backend-docker`, `server-backend-mac-local` (every request) | `npm run dev`, `dev:server`, `docker:logs`, `mac-local-backend:logs` |
| website and admin (the frontends workspace) | `server-website`, `server-admin`, `frontends-typecheck`, `frontends-lint` | `npm run website:dev`, `admin:dev`, `typecheck`, `lint` in `frontends/` |
| backend docker, Mac, Heroku | `backend-docker-up`, `-down`, `backend-dev-down`, `backend-mac-local[-<subcommand>]`, `heroku-<subcommand>` | `npm run docker:up`, `npm run dev:down`, `npm run mac-local-backend -- down`, `npm run heroku -- deploy`, ... |
| Pages deploy proof | `deploy-pages` | `node tools/deploy-check.mjs [--expect <N>]` |
| Claude sessions, agents | `claude@<session>` lines in the history (transcript paths included) | hooks in `.claude/settings.json` |

Anything else can be logged by wrapping it: `node tools/run.mjs <type> -- <command> [args]`.

## How it stays out of the way

- **Nothing a caller reads changes.** The wrapper passes stdout, stderr and the exit code through byte for byte, and
  adds nothing to either stream unless a person is watching a terminal. Checked with logging on and off:
  identical output and exit codes.
- **Logging never fails a run.** If `temp/` cannot be written, the command runs exactly as it would unwrapped.
- **No nesting.** A logged command started inside another run (`ng build` inside pwa-local)
  adds a step to that run instead of opening its own (`IA_RUN_DIR`). `IA_NO_RUNLOG=1` turns a script's own
  logging off.
- **Not in git, not in iCloud.** `/temp/` is in `.gitignore`, and every run re-applies the File Provider ignore
  attribute (`com.apple.fileprovider.ignore#P`) to the folder, which iCloud honours on this Mac (measured:
  `isExcludedFromSync = 1`). A `.nosync` suffix does not work here.
- **Kept, then pruned.** Per type, a run is deleted only once it is both older than 30 days and outside the newest 30
  (`IA_RUNS_KEEP`, `IA_RUNS_KEEP_DAYS`). The history rolls to `events-<stamp>.log` past 20 MB.
- **Somewhere else:** `IA_RUNS_DIR=/path` moves all of it.

## In GitHub Actions

Every pipeline job (`.github/workflows/pipeline.yml`) writes the same run log in its workspace and uploads `temp/` as an
artifact (`tests-run-log`, `app-backend-run-log`, `e2e-report`, `deploy-run-log`),
so a red check reads like a local one: `gh run download <run id> -n tests-run-log`, then `summary.txt`, `events.log` and
`output.log` in its run folder. Runs started there say `ci` in the "who" column.

## Deployed servers

- **GitHub Pages (the PWA)** is a static host and keeps no request logs anyone can read. What there is: the deploy
  proof (`deploy-pages` runs) and the in-app bug form.
- **Heroku (the backend)** prints one line per request on stdout (`request POST /api/heartbeat 200 3 ms <ip>
  iPhone`), which Heroku's log stream holds for its most recent 1,500 lines. `npm run heroku -- logs` (in
  `backend/`) follows that stream as a `heroku-logs` run, so whatever it shows while you watch is kept in `temp/`.
  Keeping Heroku's logs without watching needs a log drain add-on.

## Files

| File | Does |
|---|---|
| `runlog.mjs` | the library: run folders, the event format, the history, latest links, pruning, the iCloud exclusion |
| `run.mjs` | wraps any command as a run |
| `logs.mjs` | reads it all back |
| `deploy-check.mjs` | the Pages deploy proof (CLAUDE.md step 7) as a `deploy-pages` run; the pipeline runs it after every merge |
| `check.mjs` | the 60-second local proof, a `check` run (`--staged` for the pre-commit hook, `--list`, `--measure`): the feature tests whole, the gate suite's fast part, the app, the backend |
| `check-gate-times.txt` | each gate's measured time; gates at 12 s or less run in the check, the rest only in CI |
| `agent-hook.mjs` | Claude hooks: sessions and agents into the history |

Tests: `frontends/app/test/unit/runlog.test.ts`, `frontends/app/test/integration/run-wrapper.test.ts` (run with the app's `npm test`).
