# Iron Asylum: Angular app, four build paths and e2e

Full path: `/Users/CanasBangin/Desktop/TheBig6V2/app`

This folder packages Iron Asylum as an **Angular 22** app and wraps it with **Cordova (cordova-ios 8)** for the iOS
Simulator and a connected iPhone. It also holds the lint setup, the unit and integration tests, and a Docker + Puppeteer e2e suite.

## The four build paths

One Angular app, built four ways. Run each from this folder (`cd app`).

| Path | Command | Builds | Where it runs |
|---|---|---|---|
| **emulator-ios** | `npm run emulator-ios` | `www/` (Cordova), then a Debug build with Xcode | the iOS Simulator (default iPhone 17 Pro; `-- --sim "iPhone Air"`) |
| **device-ios** | `npm run device-ios` | `www/` (Cordova), then a signed build with Xcode | the connected iPhone (see [First device build](#first-device-build-one-time)) |
| **pwa-pages** | `npm run pwa-pages` | `../pwa/` with base href `/TheBig6V2/pwa/`; no Cordova | GitHub Pages at https://bigyerr.github.io/TheBig6V2/pwa/, once `pwa/` is committed and pushed |
| **pwa-local** | `npm run pwa-local` | `dist/pwa-local/` with base href `/`; no Cordova | this Mac, served at http://localhost:4400/ and to the iPhone on the same Wi-Fi; nothing is committed or pushed |

The two iOS paths run the native shell. They get Cordova and the `ia-island` Live Activity on the Dynamic Island.
pwa-pages and pwa-local are the same plain web build with a different base href. The page detects that Cordova is
missing, so it boots at once, and the rest stopwatch runs without the island. Every HTML5 and home screen feature works as it does in the live app. Like the live app, it
has no web manifest and no service worker.

**pwa-pages and the live app share storage.** `pwa/` is served from the same origin as the live app at
`/TheBig6V2/`, so in a Safari tab both read and write the same `localStorage`. That is safe only while `pwa/` runs
the same `app.js` as the root `index.html`. `npm run pwa-pages:check` proves it without building. It fails when `pwa/`
was built from any other bytes of `index.html`, when a file the page loads is missing, or when the base href is wrong.
Rebuild and commit `pwa/` with every version, or it goes stale.

### pwa-local: the web build, served from this Mac

`npm run pwa-local` (`scripts/pwa-local.mjs`) syncs from `../index.html`, builds into `dist/pwa-local/` (gitignored),
runs the same check as `pwa-pages:check` against it, then serves it with a small Node server until you press Ctrl-C.
It prints the addresses to use:

```
pwa-local: serving ia-version 239 from dist/pwa-local/
  this Mac   http://localhost:4400/
  iPhone     http://<your Mac>.local:4400/   (same Wi-Fi; Share > Add to Home Screen)
  also       http://10.0.0.37:4400/
```

- **On the iPhone, open the `.local` address in Safari, then Share > Add to Home Screen.** The address is the origin,
  and the origin owns the storage. The `.local` name stays the same, while the IP can change when the router hands
  out a new one. A home screen app saved on the IP would then open empty.
- **Its storage is its own.** It shares nothing with the live app on GitHub Pages or with the native app. A program
  made in one does not appear in another.
- **It works only while the server runs and the phone is on the same network.** The app has no service worker, so
  nothing is cached for offline use. Away from home, use the live app.
- **Updates.** Rerun `npm run pwa-local` after `index.html` changes. The in-app update check reads the served page,
  so an open app offers the new version. The page and `legacy/app.js` are revalidated on every load. Only the hashed
  Angular bundles are cached for good.
- **Plain http on the phone.** Safari does not treat `http://<name>.local` as a secure context, so the clipboard API
  is missing there. The app's one live copy button (`copyProgSel`) then falls back to a textarea copy, so nothing
  the app does needs https.
- The first run may ask whether `node` can accept incoming connections. Allow it, or the phone cannot connect.
- **Every session is logged** as a `server-pwa-local` run in `../temp/runs/`: the build, the addresses, every request
  it serves (method, path, status, time and whether an iPhone asked) and the stop, each with a timestamp, in the
  run's `events.log` as they happen. Watch it live from another terminal with
  `npm run logs -- follow server-pwa-local`; read the last one with `npm run logs -- show server-pwa-local`.
- Options: `-- --port 4401` (or `PWA_LOCAL_PORT`) picks the port. `-- --no-build` serves the last build without
  rebuilding, and is still refused if that build is stale.

The live app is still the repo root `index.html`, served by GitHub Pages and booted by every gate under `tests/`.
Nothing here edits it. The Angular app is **generated from it on every build**, so there is one source of truth and
the gates keep proving the code this app runs.

## How the Angular app is built from index.html

`npm run sync` (`scripts/sync-legacy.mjs`) splits the root `index.html` into four pieces, byte for byte, and checks
that each one occurs exactly once:

| Piece | Goes to | Used as |
|---|---|---|
| `<head>` metas, links, title (`ia-version` included) | `src/legacy/generated/index.html` | Angular's index page |
| the one `<style>` block | `src/legacy/generated/legacy.css` | global stylesheet |
| body markup before and after the script | `src/legacy/generated/legacy-markup.ts` | mounted by `LegacyHost` |
| the one inline `<script>` | `public/legacy/app.js` | loaded by `LegacyHost` as a classic script |

The generated `app.js` is byte-identical to what `tests/harness.js` extracts and the gates boot.

At runtime, `ia-root` renders `ia-legacy-host` (`src/app/legacy/legacy-host.ts`), which:
1. waits for Cordova's `deviceready` inside the native app (`src/app/core/platform.ts`; a browser skips this);
2. writes the markup into its host element (not through `[innerHTML]`, so the inline `onclick` handlers survive);
3. loads `legacy/app.js` as a classic script, so its top-level functions stay globals for those handlers.

`LegacyBridge` (`src/app/legacy/legacy-bridge.ts`) is the seam for moving screens into native Angular components one
at a time. It gives typed access to the legacy globals, the source version and its sha256.

**This is a hosted port, not a rewrite.** Every screen is still the original code. Moving a screen into an Angular
component is follow-up work, and it goes through the repo's normal build process. Each moved screen keeps the e2e
parity check below as its proof.

## Commands

All of these run from this folder (`cd app`). Prerequisites: Node 22.22+/24.15+/26+, npm, Docker Desktop, and Xcode
with an iOS Simulator runtime.

| Command | What it does |
|---|---|
| `npm install` | install dependencies (npm 11 asks before running install scripts; `package.json` `allowScripts` approves only Puppeteer's Chrome download and esbuild) |
| `npm start` | sync, then `ng serve` on http://localhost:4200 |
| `npm run build` | sync, then a production build into `www/` (Cordova's web root; both iOS paths and e2e run it) |
| `npm run sync:check` | fail if the generated files are stale against `../index.html` |
| `npm run lint` | ESLint: TypeScript and templates (angular-eslint), plus `scripts/`, `e2e/` and `test/`; errors fail |
| `npm run lint:legacy` | warn-only report on the generated `app.js` (counts per rule, first examples) |
| `npm test` | type-check, then the unit tests, then the integration tests (Node's built-in runner), each a logged run; about 5 s |
| `npm run test:unit` / `npm run test:integration` | one layer of tests on its own |
| `npm run logs` | the run log (`../tools/README.md`): `npm run logs` for the latest history, `npm run logs -- runs`, `npm run logs -- show e2e`, `npm run logs -- follow server-pwa-local` |
| `npm run typecheck` | `tsc` over the Node TypeScript (`e2e/`, `test/`); Node runs those files without it, so this is the type check |
| `npm run e2e` | the e2e suite, entirely in Docker; each run's report and collage are kept in `../temp/runs/<stamp>-e2e/artifacts/` (newest: `../temp/latest/e2e/`) |
| `npm run emulator-ios` | build, boot the simulator (default iPhone 17 Pro; `-- --sim "iPhone Air"`), install, launch |
| `npm run device-ios` | signed build for the connected iPhone, install, launch |
| `npm run pwa-pages` | sync, then a production build into `../pwa/` for GitHub Pages, then the check below |
| `npm run pwa-pages:check` | fail unless `../pwa/` was built from the current `../index.html` (no build) |
| `npm run pwa-local` | sync, then a production build into `dist/pwa-local/`, the same check, then serve it on port 4400 for this Mac and the iPhone |
| `npm run xcode-ios` | open the native project in Xcode |

## iOS

- **Bundle** `com.bigyerr.ironasylum`, display name **The Asylum**, icon from the root `apple-touch-icon.png`.
- **Version** follows `ia-version`: version and build are both its canonical `MAJOR.MINOR.PATCH` (legacy `239` ships as
  `0.239.0`, `0.239.1` as `0.239.1`; the app is pre-1.0). `scripts/ios.mjs` keeps `config.xml` in step.
- **Build products go to `~/Library/Caches/iron-asylum-ios`** (`IOS_BUILD_DIR` to change), never into the repo. The repo
  sits in an iCloud-synced Desktop, and iCloud stamps Finder metadata onto a fresh `.app`. codesign then refuses it
  with "resource fork, Finder information, or similar detritus not allowed".
- **Storage is separate.** The native app has its own `localStorage`, apart from Safari's home-screen app. A program
  made in one does not appear in the other. The app has no export yet.
- **Updates come only from a rebuild.** The in-app update check reads the bundled file inside the native app, so it
  never offers an update there.

### First device build (one time)
1. In Xcode, go to Settings > Accounts and sign in with your Apple ID. A free Personal Team works.
   (Without an account the build stops with "No Accounts".)
2. Plug in the iPhone, unlock it and tap **Trust**.
3. On the iPhone, turn on Settings > Privacy & Security > Developer Mode. The phone restarts.
4. Run `npm run device-ios`. If the phone says "Untrusted Developer", trust your Apple ID under Settings > General >
   VPN & Device Management.

The team comes from `--team`, `IOS_TEAM_ID`, or the first team Xcode knows, in that order. A Personal Team install
**expires after 7 days**; rerun to renew it.

**Why the device build does not use `cordova build --device`.** That command archives, and xcodebuild always
archives for the generic "Any iOS Device". A phone the team has never seen is then never registered, and the profile
leaves it out, so the install fails with `0xe8008012` ("This provisioning profile cannot be installed on this
device"). The script runs `cordova prepare`, then builds for the connected phone itself (`-destination id=<UDID>`
with `-allowProvisioningUpdates -allowProvisioningDeviceRegistration`), the way Xcode's Run button does. Before it
installs, it checks that the phone's UDID is in the embedded profile.

## Tests

`npm test` runs Node's built-in test runner (`node --test`) over `test/unit/` and then `test/integration/`, after
`npm run typecheck`. Each is a logged run (`typecheck`, `unit`, `integration` in `../temp/runs/`). Node 26
runs TypeScript directly by stripping the types, so there is no build step and no test framework dependency.
`tsconfig.node.json` sets `erasableSyntaxOnly`, which keeps out the TypeScript that stripping cannot run (enums,
namespaces, parameter properties). `e2e/package.json` and `test/package.json` only mark those folders as ES modules.

- `test/unit/`: pure functions with fixtures, no browser and no files. `sync-legacy`'s split and render, the e2e
  report (every image embedded, nothing referenced outside the file, everything escaped), the collage layout, pixel
  parity, and the step list.
- `test/integration/`: real inputs. The `pwa-local` server over real HTTP against a fixture build (content types,
  caching, the update check's probe, nothing served from outside the build), the build check both web paths share,
  `sync-legacy` against the live `../index.html` and as a command, the collage drawn
  in Chrome and checked pixel by pixel, and the written report opened from disk in Chrome with every request outside
  the file blocked. These use Puppeteer's Chrome on this machine, which `npm install` downloads.

The Angular code (`src/`) has no unit tests yet. It is a host for the legacy app, and the e2e parity check is its
proof. When a screen moves into an Angular component, that component's tests go through the Angular CLI's own
`ng test` builder (`@angular/build:unit-test`, Vitest), which compiles decorators and templates the way the app build
does. Node cannot import those files directly.

## e2e

`npm run e2e` (`e2e/launch.ts`) runs the whole suite in Docker. Nothing runs a browser on the host.
1. `docker compose` builds two images from one `e2e/Dockerfile`, on one shared `npm ci` layer:
   - **web**: the Angular app built from source in a clean Node container, served by nginx. The original
     `index.html` is served beside it at `/reference/`.
   - **runner**: the Puppeteer suite in TypeScript (`e2e/*.ts`, run by Node's type stripping) with the Chrome for
     Testing build that the lockfile's Puppeteer pins. Chrome for Testing ships native ARM64 Linux builds, so it runs
     at full speed on Apple silicon.
2. nginx starts. The runner shares its network, so it reaches the app at `http://127.0.0.1`, the same secure
   localhost origin a dev server has.
3. The runner takes five journeys (`e2e/flow.ts`, 46 steps) against both the Angular build and the original. Each
   journey starts from empty storage in its own browser context, and a failed step stops only its own journey:
   - **Strength, commercial gym** (19 steps): the wizard, This Week, the rest-day sheet, a day's detail and its run
     log, the swap sheet, Random Workout, Hurt?, Traveling?, Progress, Bugs, Programs, then a relaunch.
   - **10K race, Sun Nov 29** (9): a race goal with a race date, the program length box, the week 1 long run, then
     race week's Saturday shakeout and race day (the Nike plan).
   - **1.5 mile test, Sat Nov 14** (6): a dated pace test, the program length box, and the test day in week 6 (NSW).
   - **Bodyweight, then a knee injury** (6): a beginner over 55 with no equipment, Friday before the injury (it holds
     a jump), Hurt? with the knee chosen, the injury week, and Friday after (no jumps).
   - **Log a session and relaunch** (6): log two exercises, the effort and a note, close the day out, relaunch, and
     find all of it kept, in the session and in the Progress journal.
   Every step is a real tap followed by an assertion. Native date and slider controls, which a user drives through
   the OS picker, are set directly and fire their events.
4. Each pair of screenshots is compared pixel by pixel. **Default tolerance is 0%.** Clean runs match exactly, and a
   planted 0.3% title change fails the four screens that show it.
5. It copies the report out of the runner container (`docker cp`; nothing is bind-mounted, since the repo sits in an
   iCloud-synced folder) into the run's own folder, `../temp/runs/<stamp>-e2e/artifacts/`, so every run is kept
   (`../temp/latest/e2e` is the newest), then tears both containers down:
   - **`index.html`**: one self-contained page. Every screenshot (Angular, original and pixel diff for each step) is
     embedded as a data URI, and the styles and script are inline. It can be mailed or moved on its own. Click a
     screenshot to see it full size. The runner refuses to write it if anything in it points outside the file.
   - **`collage.png`**: every screen of the Angular build on one image, about 9350×9970 px (93 MP) for the 46 screens.
     Each one sits at native size (786×1704) under a label with its number, page name, journey and step id, and PASS
     or FAIL. A screen that failed is outlined in red. The numbers match the report's, so "#27 race-10k/race-shakeout"
     means the same screen in both. Chrome draws only the header and the labels; the screenshots are copied in byte
     for byte by `composeCollage` (pngjs), because a single 93 MP capture is more than the runner's software
     renderer can do within Puppeteer's timeout.
   - `docker/`: the docker build, up, cp and down output, and `nginx.log`, nginx's own log of every request it
     served, saved before the container goes.
   The run's `events.log` has each phase and each step's PASS or FAIL as it happened; `output.log` has everything
   printed. Run outside the run log (it cannot write `../temp/`), the report goes to `e2e/report/` as before.

Determinism:
- iPhone viewport, 393×852 @2x;
- the clock frozen at Wed 2026-10-07 07:30 New York (a rest day, so the rest sheet is reachable);
- seeded `Math.random`, animations off;
- web fonts and layout settled before each screenshot;
- Chrome flags for repeatable pixels (fixed sRGB colour, no LCD text, every compositor stage run before a capture),
  without which fixed layers like the rest timer tab can differ by a colour level between two renders;
- the bug form's endpoint is blocked, so a run never files a real report.

Screenshots come from Chrome on Linux, so text is rendered by Linux's font stack. Both targets are rendered the same
way, so parity is unaffected. The app's own font (Geist) is a web font and loads the same everywhere. Only glyphs it
lacks fall back to the image's DejaVu, Liberation and Noto Color Emoji fonts.

A full run takes about 2.5 minutes once the images are cached (the first build downloads Chrome and takes longer).
A failed step stops only its own journey, and the run exits 1 if any step fails or the collage cannot be written.

Options: `E2E_ONLY=race-10k,log-session` runs just those journeys (step numbers stay the full suite's),
`E2E_KEEP=1` leaves nginx up afterwards and prints its address (the original is at `/reference/`),
`E2E_PORT` pins nginx's host port (default: any free port), `E2E_PARITY_MAX` (percent).

The compose project is named after the checkout (`iron-asylum-e2e-<hash of its path>`), so two checkouts or worktrees
can run the suite at the same time without sharing containers, images or a port.
