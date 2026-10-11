# Iron Asylum backend

Full path: `/Users/CanasBangin/Desktop/TheBig6V2/backend`

A small Node (Express 5) service with two jobs today:

1. **Heartbeat API.** The app checks in with a device UID, and the server tells it whether it is connected.
2. **Admin vision.** A login-protected dashboard at `/admin/`: how many devices are connected now, how many
   unique devices have ever checked in, round-trip latency, and a paginated, searchable table of every device.

The app itself is still the repo root `index.html` on GitHub Pages. Nothing in this folder changes it. The app
side of the connection (`client/ia-link.js`) is ready, but it reaches the phone only through a version build. See
[The app side](#the-app-side).

## Layout

| Path | What it is |
|---|---|
| `server/server.js` | entry point (`npm start`, the Procfile's `web`, the Dockerfile's `CMD`) |
| `server/app.js` | routes: `/healthz`, `/api/*`, `/admin/*` |
| `server/store.js` | the device store: in memory, optionally saved to a JSON file |
| `server/middleware.js` | CORS, the text/plain JSON body, Basic auth with lockout |
| `server/config.js` | every setting, read from the environment |
| `admin/` | the admin UI: Angular 22, one standalone zoneless component, built with `@angular/build` (esbuild, Vite dev server) |
| `client/ia-link.js` | the app side: heartbeat plus the connection dot, ready to paste into `index.html` |
| `client/demo.html` | the dot on a page of its own, served at `/client/` outside production |
| `test/` | `node --test` suite for the API, the auth and the store |
| `Procfile` | Heroku: `web: node server/server.js` |
| `Dockerfile`, `docker-compose.yml` | the same server in a container |
| `scripts/heroku.sh` | Heroku setup, deploy, verify, status, logs |

## Run it

From this folder (`cd backend`). Node 26 (the same line as `app/` and its e2e image).

```bash
npm install
```

| Command | What it does |
|---|---|
| `npm run build` | build the admin UI into `dist/admin/` (the server serves it at `/admin/`) |
| `npm start` | the server on http://localhost:3000 |
| `npm run dev` | the same, restarting on every change under `server/` |
| `npm run admin:dev` | the admin UI with live reload on http://localhost:4200/admin/, its API calls proxied to `:3000` (run `npm run dev` beside it) |
| `npm test` | the API, auth and store tests |
| `npm run lint` | ESLint: admin TypeScript and templates (angular-eslint), server and tests, the app-side snippet; errors fail |
| `npm run docker:up` | build the image and run it on http://localhost:3000, waiting for the health check |
| `npm run docker:logs` / `npm run docker:down` | follow the logs / stop it |

Locally the admin login is **admin / asylum**, unless `ADMIN_USER` and `ADMIN_PASSWORD` say otherwise. Then:

- http://localhost:3000/admin/ is the dashboard;
- http://localhost:3000/client/ is the connection dot demo. Open it in a second tab and it appears in the
  dashboard as a connected device.

**Docker.** `docker compose` runs the production image (`NODE_ENV=production`) with the local login, the demo page
on, and `DATA_FILE` on a named volume, so devices survive a restart of the container. `docker compose down -v`
wipes them. `API_PORT=3001 npm run docker:up` moves the port.

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
The Node buildpack installs dependencies, runs `npm run build` (the admin UI), then prunes the dev dependencies, so
the running slug holds Express and the built admin page, nothing of Angular's toolchain.

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

It refuses if `backend/` has uncommitted changes (only committed files deploy). After the push it polls
`/healthz`, cache-busted, until the live dyno reports the commit it pushed, then prints the admin URL. **A push is
not a deploy:** the deploy counts only when that check passes. If it times out, read the build and boot output:

```bash
bash backend/scripts/heroku.sh logs
```

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
