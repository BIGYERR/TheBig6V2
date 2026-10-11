# TheBig6V2

Iron Asylum: a hybrid strength and cardio program builder for iPhone.

| Folder | What it is | How it ships |
|---|---|---|
| `index.html` | the app: one file, served at https://bigyerr.github.io/TheBig6V2/ | GitHub Pages, on every push to `main` |
| `app/` | the same app as an Angular project, built three ways: `emulator-ios` and `device-ios` (Cordova), and `pwa-pages` (a web build for `/TheBig6V2/pwa/`) | built on demand; see `app/README.md` |
| `backend/` | the Node backend: device heartbeat API and the admin vision dashboard | Heroku, with `backend/scripts/heroku.sh deploy`; see `backend/README.md` |
| `tests/` | the gates every version of `index.html` passes before it ships | run locally (`CLAUDE.md`) |
| `docs/` | reference for agents and Mario: the design system (`docs/design/`) | not shipped; it rides along on Pages with the rest of the repo, and the app never reads it |

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
