# React Native migration: the inventory

Written by `tests/measure/rn-migration_inventory.mjs`. Static counts over the working tree; generated and vendored folders are left out.

## 1. Source by area

| Area | Files | Lines | Size | In the move |
|---|---|---|---|---|
| The engine (`core/src/engine`) | 19 | 8831 | 663 KB | stays, unchanged |
| The rest of core (`core/src`: domain, format, gps, semver, version) | 14 | 1438 | 58 KB | stays |
| The legacy script (`frontends/app/src/legacy/src/js`) | 25 | 10431 | 696 KB | its logic lifts into core (phase 1); its screens are rewritten |
| The legacy CSS (`.../legacy/src/css`) | 10 | 1115 | 105 KB | becomes React Native styles; the Track tokens carry over |
| The legacy HTML (`.../legacy/src/html`) | 5 | 382 | 22 KB | rewritten as components |
| The Angular app (`frontends/app/src/app`), TypeScript | 87 | 11759 | 583 KB | screens rewritten; pure models reused |
| The Angular app, CSS | 3 | 380 | 35 KB | becomes React Native styles |
| Native plugins, Swift (`frontends/app/plugins-src`) | 4 | 616 | 24 KB | reused inside Expo modules |
| Native plugins, JavaScript and hooks | 1 | 349 | 16 KB | replaced by Expo module definitions and a config plugin |
| App build scripts (`frontends/app/scripts`) | 14 | 8776 | 349 KB | the Cordova ones retire at cutover |

## 2. Screens

- Legacy page: **6 screens** (`screenProgress`, `screenBugs`, `screenHome`, `screenWizard`, `screenGenerate`, `screenWeek`), **12 sheets and pop-ups** (`detailOverlay (overlay)`, `swapOverlay (overlay)`, `addOverlay (overlay)`, `swapNudgeOverlay (pop-overlay)`, `rpeInfoOverlay (rpe-overlay)`, `randOverlay (rand-overlay)`, `restOverlay (rand-overlay)`, `changeOverlay (rand-overlay)`, `goalOverlay (rand-overlay)`, `mileOverlay (rand-overlay)`, `mileLockOverlay (rand-overlay)`, `popOverlay (pop-overlay)`), **4 tabs** (`screenHome`, `screenWeek`, `screenProgress`, `screenBugs`).
- Angular app: **23 screen folders, 41 components** under `frontends/app/src/app/screens`. "Bridge calls" counts the places a component reaches into the legacy script: each is logic that has to exist in core, or in the new screen, before that screen can be rewritten.

| Folder | Components | TS files | Lines | Size | Fields | Bridge calls |
|---|---|---|---|---|---|---|
| day-detail | 6 | 16 | 1894 | 99 KB | 10 | 97 |
| progress | 7 | 14 | 1655 | 85 KB | 2 | 34 |
| deck | 1 | 4 | 1449 | 91 KB | 2 | 31 |
| week-view | 1 | 4 | 1446 | 75 KB | 2 | 38 |
| wizard | 1 | 3 | 1152 | 65 KB | 11 | 64 |
| run-recorder | 2 | 3 | 532 | 20 KB | 0 | 1 |
| program-list | 2 | 4 | 407 | 21 KB | 1 | 27 |
| rest-timer | 1 | 2 | 398 | 17 KB | 0 | 5 |
| frames | 4 | 6 | 382 | 18 KB | 0 | 7 |
| mile-nudge | 1 | 2 | 359 | 15 KB | 0 | 11 |
| change-sheet | 1 | 2 | 347 | 16 KB | 1 | 11 |
| pop-up | 1 | 2 | 252 | 10 KB | 0 | 6 |
| bug-report | 1 | 2 | 240 | 11 KB | 2 | 8 |
| random-workout | 1 | 2 | 234 | 10 KB | 0 | 14 |
| goal-sheet | 1 | 2 | 230 | 12 KB | 6 | 11 |
| swap-sheet | 1 | 2 | 227 | 11 KB | 0 | 12 |
| mile-sheet | 2 | 4 | 222 | 10 KB | 2 | 10 |
| add-sheet | 1 | 2 | 192 | 8 KB | 0 | 10 |
| swap-nudge | 1 | 2 | 71 | 3 KB | 0 | 5 |
| rpe-info | 1 | 1 | 38 | 2 KB | 0 | 1 |
| toast | 1 | 1 | 37 | 2 KB | 0 | 1 |
| marks | 2 | 1 | 36 | 2 KB | 0 | 1 |
| update-banner | 1 | 1 | 27 | 1 KB | 0 | 1 |

## 3. Storage

Direct `localStorage` calls (comments stripped). "Other" is `key`, `clear`, `length`, index access and `sessionStorage`.

| Where | getItem | setItem | removeItem | Other | Total |
|---|---|---|---|---|---|
| legacy script | 0 | 0 | 0 | 0 | 0 |
| engine | 0 | 0 | 0 | 0 | 0 |
| core (other) | 0 | 0 | 0 | 0 | 0 |
| Angular app | 0 | 0 | 0 | 0 | 0 |

| File | getItem | setItem | removeItem | Other |
|---|---|---|---|---|

**The `ia_` key families: 17** (every string literal that starts `ia_`, with the files that name it). A trailing underscore is a per-program or per-item key.

| Key | Files that name it |
|---|---|
| `ia_active` | program-manage.ts, storage.ts |
| `ia_comp_` | program-manage.ts, storage.ts |
| `ia_edits_` | program-manage.ts, swaps-edits.ts |
| `ia_exw_` | log-entries.ts, program-manage.ts, storage.ts |
| `ia_hist_` | program-manage.ts, storage.ts |
| `ia_logs_` | program-manage.ts, storage.ts |
| `ia_moves_` | program-manage.ts, rest-day-shell.ts |
| `ia_parts_` | program-manage.ts, storage.ts |
| `ia_pop_` | popups-streaks-reminders.ts, program-manage.ts |
| `ia_programs` | data-backup.ts, storage.ts |
| `ia_remind_` | popups-streaks-reminders.ts, program-manage.ts |
| `ia_reminded_` | popups-streaks-reminders.ts, program-manage.ts |
| `ia_season_` | popups-streaks-reminders.ts, program-manage.ts |
| `ia_swapct_` | program-manage.ts, swaps-edits.ts |
| `ia_swaps_` | program-manage.ts, swaps-edits.ts |
| `ia_theme` | theme.ts |
| `ia_wild_` | program-manage.ts, storage.ts |

## 4. Tests and assertions

"Tests" is `test(` and `it(` calls; "assertions" is `assert…(` and `expect(` calls. A test or assertion inside a loop counts once, so the run-time numbers are higher (the lattice sweeps run hundreds of programs through one assertion). The e2e row counts its TypeScript files; its journeys are in section 7.

| Suite | Runner | Files | Tests | Assertions | Lines |
|---|---|---|---|---|---|
| tests/unit | Vitest | 24 | 272 | 814 | 3692 |
| tests/integration | Vitest | 64 | 1098 | 3830 | 18410 |
| tests/sweeps | Vitest (CI only) | 31 | 214 | 733 | 3371 |
| tests/e2e | Docker, Puppeteer | 9 | 0 | 0 | 3248 |
| frontends/app/test/unit | node:test | 41 | 323 | 980 | 4009 |
| frontends/app/test/integration | node:test | 8 | 58 | 149 | 988 |
| backend/test | node:test | 11 | 86 | 312 | 1401 |
| **Total, without the e2e** |  | **179** | **2051** | **6818** |  |

Golden files: **21** in `tests/snapshots/` (777 KB).

**What happens to them** (a first pass by rule, from what each file drives; the ledger has every file, and each row is confirmed by hand in the phase that touches it):

| Plan | What it means | Files | Tests | Assertions |
|---|---|---|---|---|
| REPLACE | a React Native screen test takes its place; logic assertions move with the logic | 61 | 878 | 3044 |
| RE-POINT | same assertions, the program built by `@ia/core` with no page booted | 47 | 553 | 1770 |
| KEEP | stays as it is (engine and core tests, pure models, the server, repo tools) | 62 | 513 | 1714 |
| RETIRE | what it tests is gone at cutover (the web view, a stylesheet, Cordova tooling) | 9 | 107 | 290 |

## 5. Dates, locale and other engine-dependent calls

Calls whose result can differ between JavaScript engines or device settings (V8 in Node, JavaScriptCore in today's web view, Hermes in React Native). Comments stripped.

| Call | legacy script | engine | core (other) | Angular app |
|---|---|---|---|---|
| `new Date("…")` or `new Date(x)` with one argument (parses a string or a number) | 18 | 3 | 1 | 4 |
| `new Date(y, m, d…)` (local time, safe) | 0 | 0 | 0 | 0 |
| `new Date()` (the clock) | 33 | 2 | 0 | 5 |
| `Date.parse(` | 0 | 0 | 0 | 0 |
| `Date.now(` | 33 | 3 | 0 | 7 |
| `toISOString(` | 3 | 0 | 1 | 1 |
| `toLocaleDateString(` / `toLocaleTimeString(` / `toLocaleString(` | 9 | 0 | 0 | 5 |
| `Intl.` | 0 | 0 | 0 | 0 |
| `localeCompare(` | 2 | 1 | 0 | 0 |
| `toLowerCase(` / `toUpperCase(` (locale-free, safe)  | 57 | 37 | 0 | 17 |
| `toLocaleLowerCase(` / `toLocaleUpperCase(` | 0 | 0 | 0 | 0 |
| `getTimezoneOffset(` | 0 | 0 | 0 | 0 |
| `.sort()` with no comparator | 2 | 0 | 0 | 0 |
| `.sort(` with a comparator | 25 | 14 | 0 | 6 |
| `toFixed(` | 117 | 18 | 1 | 96 |
| `Math.random(` | 13 | 0 | 0 | 0 |
| `parseFloat(` / `parseInt(` / `Number(` | 31 | 35 | 1 | 14 |
| `structuredClone(` | 0 | 0 | 0 | 0 |
| `JSON.stringify(` | 23 | 1 | 8 | 1 |
| Regex lookbehind `(?<=` or `(?<!` | 0 | 0 | 0 | 1 |
| `normalize(` (Unicode) | 0 | 0 | 0 | 0 |

Every single-argument `new Date(…)`, `Date.parse(`, `toLocale…String(` and `Intl.` call, by file (the ones to read by hand):

| Where | File | Calls | What (up to 8 forms) |
|---|---|---|---|
| Angular app | week-view-model.ts | 4 | `.toLocaleDateString('en-US', { month: 'short', day: 'numeric` ×2, `new Date(weekMon)`, `new Date(p.startDate + 'T00:00:00')` |
| Angular app | run-recorder-model.ts | 3 | `new Date(t)` ×2, `.toLocaleString('en-US', { month: 'short', day: 'numeric', h` |
| Angular app | cardio-card-model.ts | 1 | `.toLocaleString()` |
| Angular app | ledger-model.ts | 1 | `.toLocaleString()` |
| core (other) | gpx.ts | 1 | `new Date(t)` |
| engine | calendar.ts | 2 | `new Date(parseInt(parts[0])`, `new Date(parseInt(p[0])` |
| engine | core-legs.ts | 1 | `.localeCompare(` |
| engine | nrc-race-bike-swim.ts | 1 | `new Date(raceMon)` |
| legacy script | wizard.ts | 8 | `new Date(mon)` ×3, `.toLocaleDateString('en-US',{month:'short',day:'numeric'})` ×2, `new Date(m)` ×2, `.toLocaleDateString('en-US', withYear ? {weekday:'short',mon` |
| legacy script | overlays.ts | 5 | `new Date(iso+'T00:00:00')` ×2, `new Date(mon.getTime()`, `.toLocaleDateString('en-US',{weekday:'short',month:'short',d`, `.toLocaleDateString('en-US',{month:'short',day:'numeric'})` |
| legacy script | week-view-sections.ts | 4 | `new Date(mon)`, `new Date(activeProg.startDate+'T00:00:00')`, `.toLocaleDateString('en-US',{month:'short',day:'numeric',yea`, `new Date(weekMon)` |
| legacy script | data-backup.ts | 3 | `.sort()`, `new Date(r.made)`, `.toLocaleDateString('en-US',{month:'short',day:'numeric'})` |
| legacy script | swaps-edits.ts | 3 | `.localeCompare(` ×2, `.sort()` |
| legacy script | popups-streaks-reminders.ts | 2 | `new Date(now)`, `new Date(weekMon)` |
| legacy script | rest-day-shell.ts | 2 | `new Date(mon)` ×2 |
| legacy script | lift-ledger-progress-screen.ts | 1 | `.toLocaleString()` |
| legacy script | log-entries.ts | 1 | `new Date(e.ts)` |
| legacy script | random-wildcard.ts | 1 | `new Date(now\|\|new Date()` |
| legacy script | set-logging.ts | 1 | `.toLocaleString()` |

## 6. What the app asks of the browser or the device

| API | legacy script | engine | core (other) | Angular app |
|---|---|---|---|---|
| `iaIsland` (the rest timer Live Activity) | 3 | 0 | 0 | 4 |
| `iaGps` (the run recorder) | 0 | 0 | 0 | 7 |
| `cordova` | 0 | 0 | 0 | 2 |
| `navigator.share` / `canShare` | 4 | 0 | 0 | 0 |
| `navigator.vibrate` | 0 | 0 | 0 | 0 |
| `Notification` | 0 | 0 | 0 | 0 |
| `fetch(` | 2 | 0 | 0 | 1 |
| `FileReader` / `Blob` / `URL.createObjectURL` | 3 | 0 | 0 | 0 |
| `<input type="file"` | 0 | 0 | 0 | 1 |
| `AudioContext` / `Audio(` | 0 | 0 | 0 | 0 |
| `wakeLock` | 0 | 0 | 0 | 0 |
| `matchMedia(` | 4 | 0 | 0 | 5 |
| `visualViewport` | 1 | 0 | 0 | 0 |
| `requestAnimationFrame(` | 5 | 0 | 0 | 5 |
| `MutationObserver` / `IntersectionObserver` / `ResizeObserver` | 2 | 0 | 0 | 2 |
| `innerHTML` | 70 | 0 | 0 | 85 |
| `getElementById(` | 213 | 0 | 0 | 31 |
| inline handlers written into markup (`onclick="`) | 137 | 0 | 0 | 0 |
| `<svg` | 16 | 1 | 0 | 30 |
| `<canvas` | 0 | 0 | 0 | 0 |

## 7. The pipeline and the e2e

| Job id | Name | Runs on | Timeout (min) |
|---|---|---|---|
| source | PR source is dev | ubuntu-latest |  |
| tests | unit and integration tests | ubuntu-latest | 25 |
| app-backend | app and backend | ubuntu-latest | 30 |
| e2e | e2e | ubuntu-latest | 45 |
| native | native (iOS simulator) | macos-latest | 40 |
| pages | Pages (dist-github-pages) | ubuntu-latest | 10 |
| deployed | deploy proof (Pages) | ubuntu-latest | 15 |
| testflight-gate | TestFlight (gate) | ubuntu-latest | 5 |
| testflight | TestFlight (upload) | macos-latest | 60 |
| testflight-processed | TestFlight (processed) | ubuntu-latest | 50 |

e2e (`tests/e2e`): 9 TypeScript files, 3248 lines. The app: **5 journeys** (`STRENGTH`, `RACE`, `TEST`, `BODYWEIGHT_KNEE`, `LOG_SESSION`), **59 steps**, each photographed in both builds and compared (parity), then laid out on one collage. The website and the admin: 9 step ids in `pages.ts`.

