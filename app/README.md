# Iron Asylum: Angular app, iOS build and e2e

Full path: `/Users/CanasBangin/Desktop/TheBig6V2/app`

This folder packages Iron Asylum as an **Angular 22** app and wraps it with **Cordova (cordova-ios 8)** for the iOS
Simulator and a connected iPhone. It also holds the lint setup and a Docker + Puppeteer e2e suite.

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
| `npm run build` | sync, then a production build into `www/` (Cordova's web root) |
| `npm run sync:check` | fail if the generated files are stale against `../index.html` |
| `npm run lint` | ESLint: TypeScript and templates (angular-eslint), plus `scripts/` and `e2e/`; errors fail |
| `npm run lint:legacy` | warn-only report on the generated `app.js` (counts per rule, first examples) |
| `npm run e2e` | Docker builds and serves the app; Puppeteer clicks through it; report at `e2e/report/index.html` |
| `npm run ios:sim` | build, boot the simulator (default iPhone 17 Pro; `-- --sim "iPhone Air"`), install, launch |
| `npm run ios:device` | signed build for the connected iPhone, install, launch |
| `npm run ios:open` | open the native project in Xcode |

## iOS

- **Bundle** `com.bigyerr.ironasylum`, display name **The Asylum**, icon from the root `apple-touch-icon.png`.
- **Version** follows `ia-version`. 238 ships as `1.0.238`, build `238`. `scripts/ios.mjs` keeps `config.xml` in step.
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
4. Run `npm run ios:device`. If the phone says "Untrusted Developer", trust your Apple ID under Settings > General >
   VPN & Device Management.

The team comes from `--team`, `IOS_TEAM_ID`, or the first team Xcode knows, in that order. A Personal Team install
**expires after 7 days**; rerun to renew it.

**Why the device build does not use `cordova build --device`.** That command archives, and xcodebuild always
archives for the generic "Any iOS Device". A phone the team has never seen is then never registered, and the profile
leaves it out, so the install fails with `0xe8008012` ("This provisioning profile cannot be installed on this
device"). The script runs `cordova prepare`, then builds for the connected phone itself (`-destination id=<UDID>`
with `-allowProvisioningUpdates -allowProvisioningDeviceRegistration`), the way Xcode's Run button does. Before it
installs, it checks that the phone's UDID is in the embedded profile.

## e2e

`npm run e2e` (`e2e/run-e2e.mjs`):
1. `docker compose` builds `e2e/Dockerfile`. The Angular app is built from source in a clean Node container, then
   served by nginx. The original `index.html` is served beside it at `/reference/`.
2. Puppeteer runs the same 19 steps (`e2e/flow.mjs`) against both, each in its own browser context:
   - build a program through the wizard;
   - open This Week, the rest-day sheet, a day's detail and its run log, the swap sheet, Random Workout, Hurt?,
     Traveling?, Progress, Bugs and Programs;
   - relaunch and check the program persisted.
   Every step is a real tap followed by an assertion.
3. Each pair of screenshots is compared pixel by pixel. **Default tolerance is 0%.** Clean runs match exactly, and a
   planted 0.3% title change fails the four screens that show it.
4. It writes `e2e/report/index.html`, one static page with every screenshot, the pixel diffs and any errors. The PNGs
   sit beside it in `e2e/report/screenshots/`. Then it tears the container down.

Determinism:
- iPhone viewport, 393×852 @2x;
- the clock frozen at Wed 2026-10-07 07:30 New York (a rest day, so the rest sheet is reachable);
- seeded `Math.random`, animations off;
- web fonts and layout settled before each screenshot;
- the bug form's endpoint is blocked, so a run never files a real report.

Options: `E2E_KEEP=1` leaves the container up, `E2E_BASE_URL=http://127.0.0.1:4280` reuses a running one,
`E2E_PORT` (default 4280), `E2E_PARITY_MAX` (percent).
