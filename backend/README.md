# Iron Asylum backend

Full path: `/Users/CanasBangin/Desktop/TheBig6V2/backend`

A small Node (Express 5) service in TypeScript with four jobs today, all on one server and one origin:

1. **The website.** The public site at `/`: what the app is, how it works, its features, the race plans, how to
   put it on an iPhone, and an FAQ. A quiet **Staff Login** in its footer leads to the admin.
2. **The app.** The PWA itself at `/app/`: the repo root `index.html`, the same file GitHub Pages serves, so one
   backend (docker, this Mac, Heroku) hands people the app before the store builds exist. Every "open the app"
   button on the website goes here.
3. **Heartbeat API.** The app checks in with a device UID and its version, and the server tells it whether it is
   connected and which backend it reached.
4. **Admin vision.** A staff login at `/admin/`, then a dashboard: who is connected now, round-trip latency, a
   searchable table of every device, which app versions are in use and who runs an old one, and this backend's
   own facts. **Log out** ends the session on the server.

The app's source is still the repo root `index.html`; this folder only copies it (`scripts/app-bundle.ts`). The app
side of the connection (`client/ia-link.js`) is ready, but it reaches the phone only through a version build. See
[The app side](#the-app-side).

## Layout

| Path | What it is |
|---|---|
| `server/server.ts` | entry point. tsc compiles `server/` into `dist/server/`, and `dist/server/server.js` is what runs (`npm start`, the Procfile's `web`, the Dockerfile's `CMD`, the Mac runner) |
| `server/app.ts` | routes: `/healthz`, `/api/*`, `/admin/*`, `/app/`, `/client/`, and the website at `/` |
| `server/store.ts` | the device store: in memory, optionally saved to a JSON file; versions per device |
| `server/auth.ts` | the staff login: session cookie, logout, Basic auth for scripts, the lockout |
| `server/versions.ts` | app versions: a bare build number N reads as 0.N.0, else MAJOR.MINOR.PATCH (the rule in `tests/semver.js`) |
| `server/middleware.ts` | CORS and the text/plain JSON body |
| `server/config.ts` | every setting, read from the environment |
| `server/paths.ts` | the backend folder, found the same from `server/` (the source) and `dist/server/` (compiled) |
| `tsconfig.server.json` | the server's TypeScript: strict, Node only, emitted to `dist/server/` with source maps |
| `tsconfig.test.json` | type checks the tests and scripts beside the server; emits nothing (`tsconfig.json` is the two Angular apps') |
| `site/` | the website: Angular 22, standalone and zoneless like the admin, one page with anchored sections, `site/public/` for the 404 page, favicon and robots.txt |
| `admin/` | the admin UI: Angular 22, standalone and zoneless; a login page, then a shell (header, left nav, footer) around one inner panel per section: Overview, Devices, Versions, Server |
| `app-web/` | the app served at `/app/`, copied from the repo root by `scripts/app-bundle.ts`; git-ignored |
| `client/ia-link.js` | the app side: heartbeat plus the connection dot, ready to paste into `index.html` |
| `client/demo.html` | the dot on a page of its own, served at `/client/` outside production |
| `test/` | `node --test` suite, in TypeScript: API, login, store, versions, website, app, the Mac runner, the deploy tree, the client snippet |
| `Procfile` | Heroku: `web: node --enable-source-maps dist/server/server.js` |
| `Dockerfile`, `docker-compose.yml` | the same server in a container |
| `Dockerfile.dev`, `docker-compose.dev.yml` | the dev container `npm run dev` runs: the toolchain baked in, this checkout mounted read-only, rebuilt as it is saved |
| `scripts/dev.ts`, `scripts/dev-watch.ts`, `server/dev.ts` | the full stack dev mode: the command, the watcher the container runs, and the live reload it switches on (`IA_DEV=1` only) |
| `scripts/heroku.sh` | Heroku setup, deploy (with the app added as `app-web/`), verify, status, logs, tree |
| `scripts/app-bundle.ts` | copies the app into `app-web/` (`npm run app:bundle`; `build`, `docker:up` and the Mac runner run it) |
| `scripts/mac-local-backend.sh` | the server on this Mac with no docker: up, down, restart, status, logs |

## Run it

From this folder (`cd backend`). Node 26 (the same line as `app/` and its e2e image).

```bash
npm install
```

### The fastest loop: npm run dev

```bash
npm run dev
```

The whole stack on http://localhost:3000, rebuilt as you save, by the **dev container**: the docker backend's own
container, port and devices volume, run from `Dockerfile.dev` with `docker-compose.dev.yml` laid over
`docker-compose.yml`. The container watches this checkout and rebuilds by itself (`scripts/dev-watch.ts`), so nothing
on the Mac has to run, and it comes back whenever Docker starts (`restart: unless-stopped`). `npm run dev` brings it up,
building its image when something baked into it changed, then follows its log; Ctrl-C stops following, not the
container. `npm run dev:down` stops it, and `npm run docker:up` puts back the plain production image.

| Save in | What happens | Typical time |
|---|---|---|
| `site/` or `admin/` | `ng build --watch` rebuilds it (development build), the fast backend tests run, open pages reload | under a second |
| the repo root `index.html` | the app is copied to `app-web/`, its inline script is parsed, open pages reload | under a second |
| `server/` | the server restarts, open pages reload when it is back, then tsc checks the server's types beside the fast backend tests | under a second |
| `client/` | the fast backend tests run, open pages reload | under a second |

It prints the links when it is up (website `/`, app `/app/`, admin `/admin/` with admin / asylum, snippet `/client/`)
and one line per rebuild, test run, restart and reload. **Tests stay fast on purpose:** each set (the backend tests
that need no child process or git, the app script parse) is stopped at 3 seconds; `npm test`, the pre-commit check and
CI run everything. The app's unit tests run only with `--no-docker`: they need `app/`'s own `node_modules`, and the
container never loads the Mac's. Pages reload by themselves: in dev mode only (`IA_DEV=1`), the server adds one script
tag to the three pages (`server/dev.ts`), and the watcher tells it after each rebuild. **The server runs from its
TypeScript source here** (`node server/server.ts`, Node strips the types), so a restart needs no compile; the type
check after each save is where a type error shows. Every other way to run it runs what tsc compiled.

What the container may touch: the source folders and the repo root (for `index.html` and its icon) are mounted
read-only; `dist/` and `app-web/` are the only folders it writes. Its `node_modules` are the image's own (Linux), and
the Angular cache is a volume of its own. A change to `package.json`, `package-lock.json`, `angular.json` or a
tsconfig is baked into the image, so it takes effect at the next `npm run dev`. Saves reach the container as file
events through Docker Desktop's mounts, in tens of milliseconds; should they ever stop arriving,
`IA_DEV_POLL_MS=500 npm run dev` restarts it polling instead. A file whose attributes alone changed (iCloud rewrites
them on this Desktop some seconds after a save) restarts and reloads nothing. `LOG_REQUESTS=1 npm run dev` adds a log
line per request.

- `npm run dev -- --no-docker` runs the same watcher with this Mac's Node instead, in the foreground (kind `local`,
  devices in `data/dev/`); Ctrl-C stops it. Stop the container first (`npm run dev:down`), or give it another
  `API_PORT`.
- It replaces none of the build paths for devices: `app/`'s `emulator-ios`, `device-ios`, `pwa-pages` and
  `pwa-local`, and this folder's `docker:up`, `mac-local-backend` and `heroku.sh deploy` work as before.

| Command | What it does |
|---|---|
| `npm run build` | bundle the app into `app-web/`, compile the server into `dist/server/`, build the admin UI into `dist/admin/` and the website into `dist/site/` (served at `/app/`, `/admin/` and `/`) |
| `npm run build:server` | compile the server alone (tsc, a second or two): clears `dist/server/`, then emits it |
| `npm run app:bundle` | copy the repo root `index.html` and its icon into `app-web/`: the app at `/app/` |
| `npm start` | the compiled server (`dist/server/`, so `npm run build:server` first) on http://localhost:3000, in the foreground |
| `npm run dev` | **the full stack dev mode** (above): start the dev container, which rebuilds every part and reloads every page on save by itself, and follow its log |
| `npm run dev:down` | stop the dev container (the devices volume stays) |
| `npm run dev:server` | the server alone from its TypeScript source, restarting on every change under `server/` |
| `npm run site:dev` | the website with live reload on http://localhost:4300/, `/admin` and `/api` proxied to `:3000` (run `npm run dev` beside it) |
| `npm run admin:dev` | the admin UI with live reload on http://localhost:4200/admin/, its API calls proxied to `:3000` (run `npm run dev` beside it) |
| `npm test` | the type check, then the API, auth, store, website, dev mode, deploy and mac-local-backend tests |
| `npm run typecheck` | tsc over the server (Node only) and over the tests and scripts; emits nothing |
| `npm run lint` | ESLint: website and admin TypeScript and templates (angular-eslint), server, tests and scripts (typescript-eslint), the app-side snippet; errors fail |
| `npm run mac-local-backend` | the server on this Mac with no docker, in the background, on http://localhost:3000 (below) |
| `npm run mac-local-backend:status` / `:logs` / `:down` | is it up / follow its log / stop it |
| `npm run docker:up` | build the image and run it on http://localhost:3000, waiting for the health check |
| `npm run docker:logs` / `npm run docker:down` | follow the logs / stop it |
| `npm run logs` | the run log (`../tools/README.md`): `npm run logs -- runs`, `npm run logs -- show backend-test`, ... |

**Every run is logged.** `npm test`, `typecheck`, `lint`, `dev`, `dev:down`, `dev:server`, `admin:dev`, `site:dev`, `docker:up`, `docker:logs`,
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
- http://localhost:3000/app/ is the app;
- http://localhost:3000/admin/ is the staff login, then the dashboard. **Log out** is at the top right;
- http://localhost:3000/client/ is the connection dot demo. Open it in a second tab and it appears in the
  dashboard as a connected device.

**Mac, no docker.** `npm run mac-local-backend` runs the same server the image runs, with the Mac's own Node
(26, as `package.json` asks): `NODE_ENV=production`, the local login, the demo page on, and devices kept in
`data/mac-local/devices.json` across restarts, as the docker volume keeps them. It installs dependencies if
`node_modules/` is missing, compiles the server, rebuilds the website and admin only when something they build from
changed, starts the compiled server in the background (it outlives the terminal), and returns once `/healthz` answers. The pid file and the log
sit beside the devices file; `data/` is git-ignored.

```bash
npm run mac-local-backend
```

- `npm run mac-local-backend -- down` stops it with SIGTERM, so the devices file is saved first. `restart`,
  `status`, `logs` and `open` do what they say. `up` takes `--build` to rebuild the website and admin, or `--no-build`
  to serve what they last built. The server is compiled on every `up` either way.
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
FAQ, and a final call to open the app. Every "open the app" button goes to `/app/` on the same server. Its copy follows the
app's copy rule (no dash as punctuation, short sentences, a coach's voice, no third party brand names), and a test
checks the dash part.

- **Staff Login** is a plain link in the footer's bottom row, faint until hovered or focused, to `/admin/`, where
  the admin draws its own login form.
- **Caching.** Pages, and scripts or styles without a content hash (development builds), revalidate on every load;
  hashed bundles cache for a year, and a deploy changes their names. Built folders are read per request, so a build
  that lands while the server runs is served at once.
- **404.** A browser asking for a page that does not exist gets the site's 404 page; fetch, curl and the app keep
  getting the JSON 404. `/api` keeps its JSON 404 for everyone.
- **Not built** (`dist/site/` missing), `/` answers 503 with the command that builds it. It used to redirect to
  `/admin/`.

## The app at /app/

`scripts/app-bundle.ts` copies the repo root `index.html` and `apple-touch-icon.png`, exactly what Pages serves, into
`app-web/`, and the server serves that at `/app/` (the page revalidated on every load). Locally `npm run build`,
`npm run docker:up` and the Mac runner copy it fresh; `heroku.sh deploy` adds the same two files to the tree it
pushes, from the commit it deploys (`heroku.sh tree <ref>` prints that tree), so Heroku serves the app as of that
commit. `/healthz` reports the bundled app's version as `app`.

- **Its own origin.** The app at `/app/` keeps its data (programs, logs) in that server's origin, separate from the
  Pages copy's. A phone that uses both has two separate sets of programs.
- **Bug reports** go through Web3Forms with a key registered to `bigyerr.github.io`, so the Bugs tab sends only from
  the Pages app until another domain is registered.
- **The newest version** the admin compares devices against is, in order: `APP_LATEST_VERSION` if set, else this app's
  version, else the newest any device reported.

## Admin vision

`/admin/` is public as a page (it holds no data) and draws a login form. Signed in, a dark header carries the
brand, a badge naming this backend (**heroku**, **docker**, **mac-local** or **local**, each its own colour, with its
name), the user and **Log out**. The left nav switches the inner panel between **Overview** (counts, latency, the
versions in use, this backend), **Devices** (search, filters including "Old builds only", names), **Versions**
(devices per version, newest and old flagged) and **Server** (where it runs, its build, the app it serves, its
settings), with a link back to the website. The footer repeats the backend's build and uptime. On a narrow screen the
nav becomes a row of tabs. The address keeps the section (`#/devices`, `#/devices?old=1`), so a section can be
bookmarked.

**Sign in and out.** The form posts once to `/admin/api/login`; the server answers with a session cookie
(`ia_admin`: HttpOnly, SameSite=Strict, scoped to `/admin`, Secure over https) good for `ADMIN_SESSION_MINUTES`
(12 hours). **Log out** deletes the session on the server, so even a copied cookie stops working. A restart signs
everyone out. Scripts can skip the form and send Basic auth on each call (`curl -u admin:asylum`). No answer carries
`WWW-Authenticate`, so the browser never shows its own login box.

## API

| Method and path | Auth | What it does |
|---|---|---|
| `GET /healthz` | none | liveness: `ok`, `backend` (the kind), `name`, `app` (the bundled app's version), `version`, `commit`, `release`, `uptimeS`. Heroku, docker and `heroku.sh verify` read it |
| `POST /api/heartbeat` | CORS | the health check with a UID (below); the reply names the backend |
| `POST /api/bye` | CORS | `{"uid"}`: the app was hidden or closed; the device stops counting as connected at once |
| `POST /admin/api/login` | none | `{"user", "password"}` as JSON: sets the session cookie. 401 wrong, 429 locked out, 503 admin off |
| `POST /admin/api/logout` | none | ends the session on the server and clears the cookie; safe to repeat |
| `GET /admin/api/me` | session or Basic | who is signed in, how (`session` or `basic`), and when the session ends |
| `GET /admin/api/stats` | session or Basic | `connected`, `uniques`, `beatsTotal`, `latency` (p50, p95, avg, min, max over connected devices), `latestApp`, `outdated`, `server` (kind, name, build, the app it serves, settings) |
| `GET /admin/api/versions` | session or Basic | devices per app version, newest first: `latest`, where it came from, `outdated`, and `rows` with each version's MAJOR.MINOR.PATCH reading |
| `GET /admin/api/devices` | session or Basic | `?q=&name=&connected=1&outdated=1&page=1&pageSize=25` (page size up to 100). Connected devices first, then most recent; each flagged `outdated` when below the newest version |
| `PATCH /admin/api/devices/:uid` | session or Basic | `{"name"}`: give a device a name. An empty name clears it |

**Which backend.** Every backend says what it is: `heroku` on a dyno (Heroku sets `DYNO`), `docker` in the image
(the Dockerfile sets `IA_BACKEND_KIND`), `mac-local` from the Mac runner, and `local` for `npm start` or `npm run dev -- --no-docker`.
Its name is the Heroku app (`HEROKU_APP_NAME`), `IA_BACKEND_NAME` (docker compose sets "docker on this Mac"), or the
machine's hostname. `/healthz`, every heartbeat reply (`backend: {kind, name, version, commit}`) and the admin header
carry it.

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

Heroku runs the `web` process from the `Procfile`: `node --enable-source-maps dist/server/server.js`, listening on the
`PORT` Heroku assigns. The Node buildpack installs dependencies, runs `npm run build` (the server through tsc, the
website and the admin UI), then prunes the dev dependencies, so the running slug holds Express, the compiled server
and the two built pages, nothing of TypeScript's or Angular's toolchain.

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
| `ADMIN_SESSION_MINUTES` | 720 | how long a staff sign in lasts |
| `APP_LATEST_VERSION` | empty | the newest app version, for the old build flags; empty means the app at `/app/`, then the newest reported |
| `IA_BACKEND_KIND`, `IA_BACKEND_NAME` | heroku on a dyno, else local; the app name or hostname | what this backend calls itself. The image and the Mac runner set the kind |
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
enough). `server/store.ts` is the only module that changes.

### Security

- The admin login is a form over Heroku's HTTPS, then a session cookie (HttpOnly, SameSite=Strict, Secure over
  https). On Heroku every plain http request is redirected to https (308), so the password never travels in clear
  text. Ten wrong passwords from one address, through the form or Basic auth, lock it out for ten minutes. Use a long
  password; it is the only gate. The login takes JSON only, and `/admin` answers no CORS, so another site cannot
  post it.
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
Its tooltip says Connected or Not connected, and which kind of backend. Try it at `/client/` against a local server.

**Which backend the app is on.** After each beat the snippet keeps what the server said about itself.
`iaLinkStatus()` returns it as data (URL, connected, kind and where the kind came from, name, server version and
commit, round trip, beats, failures, last good beat, last error, UID, platform, app version), and `iaLinkSummary()` as
one line, such as `Connected to docker backend "docker on this Mac" v0.1.0 (2048abf) at http://localhost:3000, 12 ms`.
Before the first beat the kind is guessed from the URL (localhost and LAN addresses read as local, `herokuapp.com`
as heroku). The demo page at `/client/` shows both, as the app's debug section will.

It is **not in `index.html` yet**, on purpose. `index.html` is the shipped app, so the snippet lands through a
version build with the usual gates (`ia-version` bump, `tests/gate.sh`, deploy proof), in its own chat. That build:

1. pastes `ia-link.js` into the inline script with `IA_BACKEND_URL` set to the Heroku URL from setup, and the dot's
   two CSS rules plus `<span id="iaLinkDot">` into the top bar;
2. adds the Heroku origin to `app/config.xml` (`<access origin>`) for the iOS app;
3. proves the harness boots it with no network: the first beat is behind a 1.5 s timer, every failure is
   swallowed, and an empty `IA_BACKEND_URL` turns it all off;
4. shows `iaLinkSummary()` and the `iaLinkStatus()` fields in the app's debug section (the Bugs tab), and appends the
   summary to every bug report, so a test phone always says which backend it reached. When the app is served by a
   backend at `/app/`, `IA_BACKEND_URL` can default to that same origin, so each backend's app talks to that backend.

`ia_device_uid` is a new stored key, so that build counts as cross-cutting under the repo's proof rules.
