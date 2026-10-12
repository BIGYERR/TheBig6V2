# Iron Asylum: Angular app and its four build paths

Full path: `/Users/CanasBangin/Developer/TheBig6V2/frontends/app`

This folder packages Iron Asylum as an **Angular 22** app and wraps it with **Cordova (cordova-ios 8)** for the iOS
Simulator and a connected iPhone. It also holds the lint setup and the unit and integration tests. The Docker + Puppeteer e2e suite that covers it lives
in `../../tests/e2e/`.

## The four build paths

One Angular app, built four ways. Run each from this folder (`cd frontends/app`).

| Path | Command | Builds | Where it runs |
|---|---|---|---|
| **emulator-ios** | `npm run emulator-ios` | `www/` (Cordova), then a Debug build with Xcode | the iOS Simulator (default iPhone 17 Pro; `-- --sim "iPhone Air"`) |
| **device-ios** | `npm run device-ios` | `www/` (Cordova), then a signed build with Xcode | the connected iPhone (see [First device build](#first-device-build-one-time)) |
| **pwa-pages** | `npm run pwa-pages` | `../../pwa/` with base href `/TheBig6V2/pwa/`; no Cordova | GitHub Pages at https://bigyerr.github.io/TheBig6V2/pwa/, once `pwa/` is committed and pushed |
| **pwa-local** | `npm run pwa-local` | `dist/pwa-local/` with base href `/`; no Cordova | this Mac, served at http://localhost:4400/ and to the iPhone on the same Wi-Fi; nothing is committed or pushed |

The two iOS paths run the native shell. They get Cordova and the `ia-island` Live Activity on the Dynamic Island.
pwa-pages and pwa-local are the same plain web build with a different base href. The page detects that Cordova is
missing, so it boots at once, and the rest stopwatch runs without the island. Every HTML5 and home screen feature works as it does in the live app. Like the live app, it
has no web manifest and no service worker.

**pwa-pages and the live app share storage.** `pwa/` is served from the same origin as the live app at
`/TheBig6V2/`, so in a Safari tab both read and write the same `localStorage`. That is safe only while `pwa/` runs
the same `app.js` as the live page (the build of `src/legacy/src/`). `npm run pwa-pages:check` proves it without
building. It fails when `pwa/` was built from any other bytes of the page, when a file the page loads is missing, or when
the base href is wrong.
Rebuild and commit `pwa/` with every version, or it goes stale.

### pwa-local: the web build, served from this Mac

`npm run pwa-local` (`scripts/pwa-local.mjs`) syncs from the page (built from `src/legacy/src/`), builds into `dist/pwa-local/` (gitignored),
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
- **Updates.** Rerun `npm run pwa-local` after the source files change. The in-app update check reads the served page,
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

The live app is still the single-file page, `index.html`, served by GitHub Pages and booted by every test under
`tests/`. It is built from the app's source files in `src/legacy/src/` (`scripts/build-index.mjs`, the one builder;
the README there lists them) into `../../dist-github-pages/` (what Pages deploys once its source is GitHub Actions)
and, until that switch, a committed copy at the repo root (`npm run build:index` writes both). The Angular app is
**generated from the same page on every build**, so there is one source of truth and the tests keep proving the code
this app runs.

## How the Angular app is built from the page

`npm run sync` (`scripts/sync-legacy.mjs`) builds the page from the source files and splits it into four pieces, byte
for byte, and checks that each one occurs exactly once:

| Piece | Goes to | Used as |
|---|---|---|
| `<head>` metas, links, title (`ia-version` included) | `src/legacy/generated/index.html` | Angular's index page |
| the one `<style>` block | `src/legacy/generated/legacy.css` | global stylesheet |
| body markup before and after the script | `src/legacy/generated/legacy-markup.ts` | mounted by `LegacyHost` |
| the one inline `<script>` | `public/legacy/app.js` | loaded by `LegacyHost` as a classic script |

The generated `app.js` is byte-identical to what `tests/harness.js` extracts and the tests boot.

At runtime, `ia-root` renders `ia-legacy-host` (`src/app/legacy/legacy-host.ts`), which:
1. waits for Cordova's `deviceready` inside the native app (`src/app/core/platform.ts`; a browser skips this);
2. writes the markup into its host element (not through `[innerHTML]`, so the inline `onclick` handlers survive);
3. loads `legacy/app.js` as a classic script, so its top-level functions stay globals for those handlers;
4. puts each screen phase E has moved (`src/app/screens/screens.ts`, `MOVED_SCREENS`) inside its legacy screen element,
   in place of the legacy content; the legacy navigation still shows and hides the element.

`LegacyBridge` (`src/app/legacy/legacy-bridge.ts`) is the seam for moving screens into native Angular components one
at a time. It gives typed access to the legacy globals (`call` for a function, `global` for a top-level `let` or
`const` such as `activeProg`), the source version and its sha256.

**A hosted port, moving screen by screen** (architecture phase E, `docs/decisions/angular-screens.md`). The bug report
is a component (`src/app/screens/bug-report/`, v0.239.8), and so is the floating rest timer (`src/app/screens/rest-timer/`,
v0.239.9), which takes over the legacy functions other screens call through `LegacyBridge.provide`, and the celebration
pop-up (`src/app/screens/pop-up/`, v0.239.10) the home screen's program list (`src/app/screens/program-list/`,
v0.239.11) the exercise swap sheet (`src/app/screens/swap-sheet/`, v0.239.12), the add-an-exercise sheet
(`src/app/screens/add-sheet/`, v0.239.13), the change-a-goal sheet's body (`src/app/screens/goal-sheet/`,
v0.239.14), the mile pencil's edit sheet and lock (`src/app/screens/mile-sheet/`, v0.239.15), and the swap nudge and
the RPE card (`src/app/screens/swap-nudge/`, `src/app/screens/rpe-info/`, v0.239.16), and the injury and travel
sheet's body (`src/app/screens/change-sheet/`, v0.239.17), Random Workout (`src/app/screens/random-workout/`,
v0.239.18), and the toast and the update banner's contents (`src/app/screens/toast/`, `src/app/screens/update-banner/`,
v0.239.19), and the Progress screen (`src/app/screens/progress/`, v0.239.20 to v0.239.24: the screen, its program chips, and its
charts and Lift Ledger in `charts/`; its data readers are still the legacy script's), This Week
(`src/app/screens/week-view/`, v0.239.25), and the wizard's shell and first three steps (`src/app/screens/wizard/`,
v0.239.26; its other steps are still the legacy renderer's, drawn inside it); every other screen is still the original code. `LegacyBridge` also offers `set` (write a legacy `let`) and `run` (a legacy handler's code). A screen's
logic sits apart from Angular in `<screen>-model.ts` and is tested by node --test (`test/unit/<screen>.test.ts`;
`src/app/package.json` marks the app's TypeScript as ES modules for it). Moving a screen goes through the repo's normal
build process. Each moved screen keeps the e2e
parity check below as its proof.

## Commands

All of these run from this folder (`cd frontends/app`). Prerequisites: Node 22.22+/24.15+/26+, npm, Docker Desktop, and Xcode
with an iOS Simulator runtime.

| Command | What it does |
|---|---|
| `npm install` | install dependencies (npm 11 asks before running install scripts; `package.json` `allowScripts` approves only Puppeteer's Chrome download and esbuild) |
| `npm start` | sync, then `ng serve` on http://localhost:4200 |
| `npm run build` | sync, then a production build into `www/` (Cordova's web root; both iOS paths and e2e run it) |
| `npm run sync:check` | fail if the generated files are stale against the page the source files build |
| `npm run build:index` | build the page from the app's source files in `src/legacy/src/` (`scripts/build-index.mjs`) into `../../dist-github-pages/` and its committed root copy `../../index.html`; the root copy is never edited by hand |
| `npm run build:index:check` | fail, naming the first differing byte and its source file, unless `../../index.html` is the build of `src/legacy/src/` |
| `npm run lint` | ESLint: TypeScript and templates (angular-eslint), plus `scripts/` and `test/`; errors fail |
| `npm run lint:legacy` | warn-only report on the generated `app.js` (counts per rule, first examples) |
| `npm test` | type-check, then the unit tests, then the integration tests (Node's built-in runner), each a logged run; about 5 s |
| `npm run test:unit` / `npm run test:integration` | one layer of tests on its own |
| `npm run logs` | the run log (`../../tools/README.md`): `npm run logs` for the latest history, `npm run logs -- runs`, `npm run logs -- show e2e`, `npm run logs -- follow server-pwa-local` |
| `npm run typecheck` | `tsc` over the Node TypeScript (`test/`); Node runs those files without it, so this is the type check |
| `npm run emulator-ios` | build, boot the simulator (default iPhone 17 Pro; `-- --sim "iPhone Air"`), install, launch |
| `npm run device-ios` | signed build for the connected iPhone, install, launch |
| `npm run pwa-pages` | sync, then a production build into `../../pwa/` for GitHub Pages, then the check below |
| `npm run pwa-pages:check` | fail unless `../../pwa/` was built from the page as the source files build it now (no build) |
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
namespaces, parameter properties). `test/package.json` only marks that folder as ES modules.

- `test/unit/`: pure functions with fixtures, no browser and no files: `sync-legacy`'s split and render, the version
  rule, the run log. The e2e's own tests moved with it to `../../tests/`.
- `test/integration/`: real inputs. The `pwa-local` server over real HTTP against a fixture build (content types,
  caching, the update check's probe, nothing served from outside the build), the build check both web paths share,
  `sync-legacy` against the live page and as a command, `build-index` (the page, `writePages`, the root copy) against
  the live source files and fixture folders, and the run log's wrapper.

The Angular code (`src/`) has no unit tests yet. It is a host for the legacy app, and the e2e parity check is its
proof. When a screen moves into an Angular component, that component's tests go through the Angular CLI's own
`ng test` builder (`@angular/build:unit-test`, Vitest), which compiles decorators and templates the way the app build
does. Node cannot import those files directly.

## e2e

The Docker e2e that covers the website, the admin and this app lives in `../../tests/e2e/` (its README). It builds
this app from source in its own image, the same way `npm run build` does.
