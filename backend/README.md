# Iron Asylum backend

Full path: `/Users/CanasBangin/Desktop/TheBig6V2/backend`

A small Node (Express 5) service with three jobs today, all on one server and one origin:

1. **The website.** The public site at `/`: what the app is, how it works, its features, the race plans, how to
   put it on an iPhone, and an FAQ. A quiet **Staff Login** in its footer leads to the admin.
2. **Heartbeat API.** The app checks in with a device UID, and the server tells it whether it is connected.
3. **Admin vision.** A login-protected dashboard at `/admin/`: how many devices are connected now, how many
   unique devices have ever checked in, round-trip latency, and a paginated, searchable table of every device.

The app itself is still the repo root `index.html` on GitHub Pages. Nothing in this folder changes it. The app
side of the connection (`client/ia-link.js`) is ready, but it reaches the phone only through a version build. See
[The app side](#the-app-side).

## Layout

| Path | What it is |
|---|---|
| `server/server.js` | entry point (`npm start`, the Procfile's `web`, the Dockerfile's `CMD`) |
| `server/app.js` | routes: `/healthz`, `/api/*`, `/admin/*`, `/client/`, and the website at `/` |
| `server/store.js` | the device store: in memory, optionally saved to a JSON file |
| `server/middleware.js` | CORS, the text/plain JSON body, Basic auth with lockout |
| `server/config.js` | every setting, read from the environment |
| `site/` | the website: Angular 22, standalone and zoneless like the admin, one page with anchored sections, `site/public/` for the 404 page, favicon and robots.txt |
| `admin/` | the admin UI: Angular 22, one standalone zoneless component, built with `@angular/build` (esbuild, Vite dev server) |
| `client/ia-link.js` | the app side: heartbeat plus the connection dot, ready to paste into `index.html` |
| `client/demo.html` | the dot on a page of its own, served at `/client/` outside production |
| `test/` | `node --test` suite for the API, the auth and the store |
| `Procfile` | Heroku: `web: node server/server.js` |
| `Dockerfile`, `docker-compose.yml` | the same server in a container |
| `scripts/heroku.sh` | Heroku setup, deploy, verify, status, logs |
| `scripts/mac-local-backend.sh` | the server on this Mac with no docker: up, down, restart, status, logs |

## Run it

From this folder (`cd backend`). Node 26 (the same line as `app/` and its e2e image).

```bash
npm install
```

| Command | What it does |
|---|---|
| `npm run build` | build the admin UI into `dist/admin/` and the website into `dist/site/` (the server serves them at `/admin/` and `/`) |
| `npm start` | the server on http://localhost:3000, in the foreground |
| `npm run dev` | the same, restarting on every change under `server/` |
| `npm run site:dev` | the website with live reload on http://localhost:4300/, `/admin` and `/api` proxied to `:3000` (run `npm run dev` beside it) |
| `npm run admin:dev` | the admin UI with live reload on http://localhost:4200/admin/, its API calls proxied to `:3000` (run `npm run dev` beside it) |
| `npm test` | the API, auth, store, website and mac-local-backend tests |
| `npm run lint` | ESLint: website and admin TypeScript and templates (angular-eslint), server and tests, the app-side snippet; errors fail |
| `npm run mac-local-backend` | the server on this Mac with no docker, in the background, on http://localhost:3000 (below) |
| `npm run mac-local-backend:status` / `:logs` / `:down` | is it up / follow its log / stop it |
| `npm run docker:up` | build the image and run it on http://localhost:3000, waiting for the health check |
| `npm run docker:logs` / `npm run docker:down` | follow the logs / stop it |
| `npm run logs` | the run log (`../tools/README.md`): `npm run logs -- runs`, `npm run logs -- show backend-test`, ... |

**Every run is logged.** `npm test`, `lint`, `dev`, `admin:dev`, `site:dev`, `docker:up`, `docker:logs`,
`docker:down`, `mac-local-backend` (and its `:down`, `:status`, `:logs`) and `heroku` each record a run in
`../temp/runs/` (gitignored) with a line in the shared history, `../temp/events.log`: start, finish, failures, and
for the servers every request. `npm start` and `npm run build` are not wrapped, since Heroku and the Docker image run
them directly. The server mac-local-backend starts in the background writes its own log, which `:logs` follows.

**Request log.** The server prints one line per response on stdout, the same locally, in docker and on Heroku:
`request POST /api/heartbeat 200 3 ms 192.168.1.20 iPhone` (method, path, status, time, caller, device). Never a
header or a body, so no password or payload is printed. `LOG_REQUESTS=0` turns it off.

Locally the admin login is **admin / asylum**, unless `ADMIN_USER` and `ADMIN_PASSWORD` say otherwise. Then:

- http://localhost:3000/ is the website. **Staff Login**, faint at the bottom right of its footer, opens the
  dashboard below;
- http://localhost:3000/admin/ is the dashboard;
- http://localhost:3000/client/ is the connection dot demo. Open it in a second tab and it appears in the
  dashboard as a connected device.

**Mac, no docker.** `npm run mac-local-backend` runs the same server the image runs, with the Mac's own Node
(26, as `package.json` asks): `NODE_ENV=production`, the local login, the demo page on, and devices kept in
`data/mac-local/devices.json` across restarts, as the docker volume keeps them. It installs dependencies if
`node_modules/` is missing, rebuilds the website and admin only when something they build from changed, starts the
server in the background (it outlives the terminal), and returns once `/healthz` answers. The pid file and the log
sit beside the devices file; `data/` is git-ignored.

```bash
npm run mac-local-backend
```

- `npm run mac-local-backend -- down` stops it with SIGTERM, so the devices file is saved first. `restart`,
  `status`, `logs` and `open` do what they say. `up` takes `--build` to rebuild everything, or `--no-build`.
- It and docker both default to port 3000, so only one runs at a time. `up` refuses a port that is taken and says
  so; `API_PORT=3001 npm run mac-local-backend` moves it. `ADMIN_USER`, `ADMIN_PASSWORD`, `CLIENT_DEMO` and
  `CORS_ORIGINS` pass through as they do for docker. `MAC_LOCAL_DIR` moves the pid, log and devices file.
- Unlike docker, which publishes on 127.0.0.1 only, the server listens on every interface (as `npm start` does),
  so a phone on the same Wi-Fi can reach it at the Mac's address. On a network you do not trust, set
  `ADMIN_PASSWORD`.

**Docker.** `docker compose` runs the production image (`NODE_ENV=production`) with the local login, the demo page
on, and `DATA_FILE` on a named volume, so devices survive a restart of the container. `docker compose down -v`
wipes them. `API_PORT=3001 npm run docker:up` moves the port.

## The website

`site/` is one Angular page at `/`, in the app's own design system (bone, ink, the one burnt orange kept for live
things, rectilinear corners): a hero with a drawing of the This Week screen whose rest clock runs on the island, the
method in three steps, the features, a sample week, the doctrine, the race plans, how to put it on an iPhone, an
FAQ, and a final call to open the app. Every "open the app" button goes to the Pages app. Its copy follows the
app's copy rule (no dash as punctuation, short sentences, a coach's voice, no third party brand names), and a test
checks the dash part.

- **Staff Login** is a plain link in the footer's bottom row, faint until hovered or focused, to `/admin/`. The
  admin's own Basic auth asks for the login there, so the site adds no login of its own and nothing changes for the
  admin.
- **Caching.** Pages revalidate on every load; the hashed bundles cache for a year. A deploy changes their names.
- **404.** A browser asking for a page that does not exist gets the site's 404 page; fetch, curl and the app keep
  getting the JSON 404. `/api` keeps its JSON 404 for everyone.
- **Not built** (`dist/site/` missing), `/` answers 503 with the command that builds it. It used to redirect to
  `/admin/`.

## API

| Method and path | Auth | What it does |
|---|---|---|
| `GET /healthz` | none | liveness: `ok`, `version`, `commit`, `release`, `uptimeS`. Heroku, docker and `heroku.sh verify` read it |
| `POST /api/heartbeat` | CORS | the health check with a UID (below) |
| `POST /api/bye` | CORS | `{"uid"}`: the app was hidden or closed; the device stops counting as connected at once |
| `GET /admin/api/stats` | Basic | `connected`, `uniques`, `beatsTotal`, `latency` (p50, p95, avg, min, max over connected devices), `server` |
| `GET /admin/api/devices` | Basic | `?q=&name=&connected=1&page=1&pageSize=25` (page size up to 100). Connected devices first, then most recent |
| `PATCH /admin/api/devices/:uid` | Basic | `{"name"}`: give a device a name. An empty name clears it |

**Heartbeat.** The app posts JSON as `text/plain`:

```json
{ "uid": "…or null on first run", "label": "iPhone · iOS 18.6", "platform": "home-screen",
  "appVersion": "238", "screen": "393x852@3", "rttMs": 84 }
```

and gets back:

```json
{ "ok": true, "uid": "0b6f2c1e-…", "issued": false, "serverTime": 1760190000000, "nextBeatMs": 15000 }
```

- **The server issues the UID.** A beat with no UID, or a malformed one, gets a fresh UUID (`issued: true`), which
  the app keeps and sends from then on. A well formed UID the server has not seen, because a restart wiped its
  memory, is kept: it is the same phone.
- **Latency is measured by the app.** It times each beat and reports that round trip on the next one. The server
  keeps the last 50 samples per device. `text/plain` makes this a CORS "simple" request with no preflight, so one
  beat is exactly one round trip.
- **Connected** means the device's last beat arrived within `CONNECTED_WINDOW_MS` (45 s, three missed beats) and it
  has not said bye. The app beats every `nextBeatMs` while it is on screen and stops when it is hidden, so a phone
  in a pocket drops off the count. `BEAT_MS` changes the interval for every app without an app build.
- **CORS.** Only the origins in `CORS_ORIGINS` may call `/api` from a browser; any other origin gets a 403. Requests
  with no `Origin` (curl, probes) pass.

## Device identity

The admin table shows, per device: a name, a label, platform, screen, app version, first and last seen, sessions,
beats, and latency.

- **The iPhone's own name ("Mario's iPhone") is not available.** Safari never gives it to a web page, and since
  iOS 16 even a native app gets only "iPhone" unless Apple grants it a special entitlement. So:
- **The label** is what a web page can tell: device kind and iOS version from the user agent, plus the screen size
  and pixel ratio, which narrow the model (393x852@3 is a 6.1-inch model). **Platform** is `home-screen` (the
  installed PWA), `browser` (a Safari tab) or `ios-app` (the Cordova build in `app/`).
- **Names are given in the admin table.** Type into the Name cell; it saves on Enter or when you leave the field.
  The **Search by name** box searches these names. **Search anything** covers name, label, platform, version,
  screen, user agent and UID.
- **The app can send a name later.** The heartbeat already accepts `deviceName`, and it shows as the name's
  placeholder until you set one. Nothing sends it today; an app setting such as "Name this phone" would.

## Deploying to Heroku

Heroku runs the `web` process from the `Procfile`: `node server/server.js`, listening on the `PORT` Heroku assigns.
The Node buildpack installs dependencies, runs `npm run build` (the website and the admin UI), then prunes the dev
dependencies, so the running slug holds Express and the two built pages, nothing of Angular's toolchain.

**Why deploys go through `scripts/heroku.sh`.** The repo root is the GitHub Pages site. Heroku needs
`package.json` and the `Procfile` at the root of what it receives, so a plain `git push heroku main` would hand it
the wrong folder. `heroku.sh deploy` makes a commit whose tree is `backend/` alone (with `git commit-tree`; `git
subtree` is not needed and is not installed on this Mac), on top of what Heroku already has, and pushes that. Every
deploy is a fast-forward; nothing is force-pushed.

### One-time setup

1. Install the CLI and log in:

   ```bash
   brew tap heroku/brew && brew install heroku
   ```

   ```bash
   heroku login
   ```

2. Create the app (or adopt one you made in the dashboard), from the repo root:

   ```bash
   bash backend/scripts/heroku.sh setup iron-asylum-api
   ```

   This creates the app if it does not exist, sets the Node buildpack, turns on `runtime-dyno-metadata` (so
   `/healthz` can report the live commit), adds the git remote `heroku-backend`, asks for the admin username and
   password and stores them as config vars (never in the repo), and sets `NODE_ENV=production` and `CORS_ORIGINS`
   to the Pages and iOS app origins. It prints the app's URL: Heroku appends a random suffix to new app names,
   so note the exact URL. The app side needs it.

3. Choose the dyno type in the Heroku dashboard (Resources), or:

   ```bash
   heroku ps:type web=basic -a iron-asylum-api
   ```

   **Basic is recommended.** An Eco dyno sleeps after 30 minutes without traffic. Waking takes several seconds,
   so the dot reads "Not connected" for the first beat, and a sleep is a restart, which empties the device table.

### Deploy

Commit your `backend/` changes, then:

```bash
bash backend/scripts/heroku.sh deploy
```

It deploys `backend/` exactly as it is on `origin/main`, which only a pull request from `dev` whose checks passed can
change; `HEROKU_DEPLOY_REF=<ref>` deploys something else in an emergency. After the push it polls
`/healthz`, cache-busted, until the live dyno reports the commit it pushed, then prints the admin URL. **A push is
not a deploy:** the deploy counts only when that check passes. If it times out, read the build and boot output:

```bash
bash backend/scripts/heroku.sh logs
```

`npm run heroku -- logs` (from `backend/`) does the same as a logged `heroku-logs` run, so everything the stream shows
while it runs is kept in `../temp/runs/`. Heroku itself keeps only the latest 1,500 lines; keeping more without
watching needs a log drain add-on.

Other commands: `status` (dynos, last releases, `/healthz`), `verify` (the live check on its own), `open` (the
admin page). To roll back: `heroku releases:rollback -a iron-asylum-api`.

### Config vars

`scripts/heroku.sh setup` sets the first four. Change any with `heroku config:set NAME=value -a <app>`; Heroku
restarts the dyno.

| Variable | Default | What it does |
|---|---|---|
| `ADMIN_USER`, `ADMIN_PASSWORD` | none in production (admin / asylum locally) | the admin login. Without both, `/admin` answers 503 |
| `NODE_ENV` | `production` on Heroku | turns off the local login fallback and the `/client/` demo |
| `CORS_ORIGINS` | Pages, `app://localhost`, localhost | browser origins allowed to call `/api`; `*` matches anything but a slash |
| `BEAT_MS` | 15000 | how often the app beats while on screen |
| `CONNECTED_WINDOW_MS` | 45000 | how long after its last beat a device still counts as connected |
| `MAX_DEVICES` | 5000 | devices kept before the least recently seen are dropped |
| `DATA_FILE` | empty | a JSON file that keeps devices across restarts. Leave it empty on Heroku |
| `CLIENT_DEMO` | on except in production | `1` serves the dot demo at `/client/` |
| `LOG_REQUESTS` | on | `0` stops the one stdout line per request |
| `TRUST_PROXY` | on when `DYNO` is set, so on Heroku only | trust Heroku's `X-Forwarded-For` / `-Proto`: the lockout counts per caller, and plain http redirects to https |

### What Heroku does not keep

**The device table lives in memory.** Heroku restarts every dyno at least once a day, and on every deploy and
config change, and its disk is wiped each time, so the table starts empty after each restart. Each phone keeps its
UID, so it reappears with the same ID on its next beat, but names given in the admin, first-seen dates and
latency history are lost. When those need to last, the next step is Heroku Postgres (the Essential plan is
enough). `server/store.js` is the only module that changes.

### Security

- The admin login is HTTP Basic over Heroku's HTTPS. On Heroku every plain http request is redirected to https
  (308), so the password never travels in clear text. Ten wrong passwords from one address lock it out for ten
  minutes. Use a long password; it is the only gate.
- Forwarded headers are trusted only on Heroku (`TRUST_PROXY`). Locally and in docker nothing sits in front, so a
  client could forge `X-Forwarded-For` to dodge the lockout. There the lockout counts the socket address instead.
- Credentials live in Heroku config vars, never in the repo. `.env` is git-ignored; `.env.example` lists names only.
- Heartbeats need no login, by design. They can only create or refresh a device record. The store caps at
  `MAX_DEVICES` and bodies at 2 KB, so a flood cannot exhaust memory. It can push real devices out of the table,
  though, because the least recently seen go first. Per-address rate limiting on new UIDs is the fix if that is
  ever seen.

## The app side

`client/ia-link.js` is the app's half: one heartbeat when the app opens and every 15 s while it is visible, the
UID kept in `localStorage` as `ia_device_uid`, a goodbye beacon when the app is hidden, and the dot. The dot is 7 px
next to THE ASYLUM in the top bar: sage (`--run`) when the last beat got through, a hollow ring when it did not.
Its tooltip says Connected or Not connected. Try it at `/client/` against a local server.

It is **not in `index.html` yet**, on purpose. `index.html` is the shipped app, so the snippet lands through a
version build with the usual gates (`ia-version` bump, `tests/gate.sh`, deploy proof), in its own chat. That build:

1. pastes `ia-link.js` into the inline script with `IA_BACKEND_URL` set to the Heroku URL from setup, and the dot's
   two CSS rules plus `<span id="iaLinkDot">` into the top bar;
2. adds the Heroku origin to `app/config.xml` (`<access origin>`) for the iOS app;
3. proves the harness boots it with no network: the first beat is behind a 1.5 s timer, every failure is
   swallowed, and an empty `IA_BACKEND_URL` turns it all off.

`ia_device_uid` is a new stored key, so that build counts as cross-cutting under the repo's proof rules.
