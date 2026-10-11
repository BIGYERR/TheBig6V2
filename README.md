# TheBig6V2

Iron Asylum: a hybrid strength and cardio program builder for iPhone.

| Folder | What it is | How it ships |
|---|---|---|
| `index.html` | the app: one file, served at https://bigyerr.github.io/TheBig6V2/ | GitHub Pages, on every push to `main` |
| `app/` | the same app as an Angular project, built four ways: `emulator-ios` and `device-ios` (Cordova), `pwa-pages` (a web build for `/TheBig6V2/pwa/`), and `pwa-local` (the same web build, served from this Mac) | built on demand; see `app/README.md` |
| `backend/` | the Node backend: device heartbeat API and the admin vision dashboard | Heroku, with `backend/scripts/heroku.sh deploy`; see `backend/README.md` |
| `tests/` | the gates every version of `index.html` passes before it ships | run locally (`CLAUDE.md`) |
| `docs/` | reference for agents and Mario: the design system (`docs/design/`) | not shipped; it rides along on Pages with the rest of the repo, and the app never reads it |
| `tools/` | the run log: every test, build, deploy, server and Claude session recorded in `temp/` | see `tools/README.md` |
| `temp/` | the run log's output and the gate's last blast-radius diff, `temp/last_diff.txt` (gitignored, kept out of iCloud) | written by every run |

## Running the app, in short

| Flow | Command | Where it runs |
|---|---|---|
| live app | push `index.html` to `main`, after the gates (`CLAUDE.md`, session rhythm) | https://bigyerr.github.io/TheBig6V2/, once Pages has built that commit |
| web app on this Mac, and on the iPhone over Wi-Fi | `cd app && npm run pwa-local` | http://localhost:4400/ on the Mac and `http://<Mac name>.local:4400/` on the iPhone. Nothing is committed or pushed |
| Angular dev server | `cd app && npm start` | http://localhost:4200, this Mac only |
| iOS Simulator | `cd app && npm run emulator-ios` | the native app in the simulator |
| iPhone, native | `cd app && npm run device-ios` | the native app on the plugged-in iPhone |
| web build on Pages | `cd app && npm run pwa-pages`, then commit `pwa/` and push | https://bigyerr.github.io/TheBig6V2/pwa/ |

`pwa-local` serves the app only while it runs and the phone is on the same Wi-Fi. Add it to the home screen from the
`.local` address, not the IP: each address keeps its own data, and the IP can change. Its data is separate from the
live app's and the native app's. The details are in `app/README.md`.

## Branches, checks and deploys

- **Work on `dev`.** Commit and push there freely. Every commit runs the 60-second check on what it touches
  (`tools/check.mjs --staged`, from `.githooks/pre-commit`; turn the hook on once per clone with
  `git config core.hooksPath .githooks`). `node tools/check.mjs` runs all of it by hand, in about 25 seconds.
- **Deploy by pull request from `dev` into `main`.** `main` is protected: it changes only through that pull request, and
  only when every check in `.github/workflows/pipeline.yml` passes: the full gate suite (every gate, the row check and
  the blast radius), fuzz, sabotage, the app and backend tests and lint, and the Docker e2e. That takes 30 to 45 minutes
  in GitHub Actions; nothing waits for it locally. Merging is the deploy: Pages serves `main`, the pipeline then proves
  the live site serves it, and `backend/scripts/heroku.sh deploy` ships `origin/main`'s `backend/`.

## What happened, and when

Every test, e2e, build, deploy, local server and Claude session records itself in `temp/` (`tools/README.md`):
one history, `temp/events.log`, with a line for each start, finish, failure and deploy step, and one folder per run
under `temp/runs/` with its full output, its summary and anything it made (the e2e report and collage, docker and
xcodebuild logs). `node tools/logs.mjs` shows the latest history, `node tools/logs.mjs runs` the latest runs, and
`node tools/logs.mjs show e2e` the newest e2e run. Proving a Pages deploy is `node tools/deploy-check.mjs`.

One level up, `~/Library/Logs/IronAsylum/orchestration.log` (also `temp/orchestration.log`, or
`node tools/logs.mjs orch`) has one line for everything started on this Mac, from any checkout: each run, each
Claude session, each prompt and each agent, saying who started it and the folder to open.

## Backend on Heroku, in short

The backend deploys separately from the app. Pages serves the repo root; Heroku gets only `backend/`.

1. One time: `brew tap heroku/brew && brew install heroku`, `heroku login`, then
   `bash backend/scripts/heroku.sh setup <app-name>` (creates the app, sets the admin login and config vars, adds
   the `heroku-backend` remote).
2. Each deploy: commit `backend/`, then `bash backend/scripts/heroku.sh deploy`. It pushes `backend/` alone and
   does not return until the live `/healthz` reports the pushed commit.
3. Admin vision is at `https://<your-app-url>/admin/`.

Local runs (`npm start`, `npm run docker:up`), the API, config vars, and what Heroku does and does not keep are
in `backend/README.md`.
