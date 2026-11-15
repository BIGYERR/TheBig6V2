# frontends/native: Iron Asylum in React Native

The Expo app the React Native migration builds (`MIGRATION.md`, phases 2 and 3), beside today's app in `frontends/app/`,
which it does not touch. Its bundle id is **com.bigyerr.ironasylum.next**, so it installs next to today's app
(`com.bigyerr.ironasylum`) and never replaces it before cutover. `tests/unit/native-shell.test.ts` holds that.

**Today it holds two tabs.** **This Week** (phase 2 session 4, `src/this-week/`; D276, D278, D279 and D284 carried over,
`docs/decisions/this-week.md`), read only: today's screen drawn from the stored state. `week-view-model.ts` and
`week-strip.ts` are copies of the Angular screen's own files, held equal to the byte by
`tests/unit/native-this-week.test.ts`: copy them again with `cp` when today's change, never edit them here.
`week-readers.ts` is the legacy page's readers the screen needs, line for line, held equal to the page's by
`tests/integration/native-this-week.test.ts`; its date readers are core's own (`state-overlays.ts`). `week-screen.ts`
joins them over core's store; `ThisWeek.tsx` and `marks.tsx` draw it. **Its grid is the launch's** (`week-screen.ts`,
`liveProgram`): core's `refreshStoredProgram`, called as today's page calls it, so the screen draws the program
today's app draws. The launch is handed a store that drops writes (`store/read-only-store.ts`), because this app's
copy of the stored state is a backup loaded read only (D287). One launch when the screen mounts and one on each
return to its tab, about 55 ms under Hermes on the simulator. A tap on a week title or a day works, and Start lift
and Start session open the swipe deck; every other control is drawn and does nothing yet.

**The swipe deck** (phase 3, its first screen, `src/deck/`; D275 and D283 carried over, `docs/decisions/swipe-deck.md`),
read only: a day's lift work as today's deck of cards, opened from This Week over the tab bar. `deck-model.ts` and
`src/day-detail/session-sections-model.ts` (the session sheet's card model, which the deck's model stands on) are
copies of the Angular app's own files, held equal to the byte by `tests/unit/native-deck.test.ts`: copy them again
with `cp` when today's change, never edit them here. `deck-readers.ts` is the legacy page's readers the cards need,
line for line; `deck-screen.ts` joins them over core's store and the launch's grid; `Deck.tsx` draws it.
`tests/integration/native-deck.test.ts` holds every card equal to today's over whole histories. The swipe, the
dots, the session map, the RPE bubble and a move's sets opening in place work. Everything that writes (Log, the
steppers, skip, swap, Done, next one, Mark the day done) is drawn and does nothing until the session that builds
logging, when the app starts writing to its own copy (D289, `docs/decisions/data-backup.md`). The opening out of
the card, the done motion, the punch and the up and down pager come with that session.

**Bugs**, with two rows and a line saying whether its Swift module answered: the engine check (D286, `docs/decisions/engine-check.md`), core's
`core/src/engine/engine-check.ts` run as it is, with `buildProgram` as the engine, under Hermes, which reads and writes
no stored key; and the Backup row (D287, `docs/decisions/data-backup.md`), which loads a backup file, read only, into
the app's own SQLite store and checks every key against the file by value and by sha256.

**The store** (`src/store/`): core's `StateStore` on expo-sqlite/kv-store (`sqlite-store.ts`, which imports nothing of
Expo's, so the tests in `tests/` run it on SQLite under `node:sqlite`), the phone's one database `iron-asylum-state`
(`phone-store.ts`), and the import (`backup-import.ts`). `docs/decisions/stored-state.md` has how the golden records
are held through it.

## Versions

Expo SDK 58.0.25, React Native 0.88.1, React 19.3.0, Hermes V1 (React Native's default), pinned exactly until cutover
(`MIGRATION.md`, risk 10). The app's version is core's release version: `app.config.js` reads `core/src/version.ts`.
The iOS floor is Expo 58's default, 16.4.

## Run it

```bash
npm ci
npm run typecheck
npm run build-ios     # expo prebuild (ios/ is generated, never committed) and an unsigned Release build for the simulator
npm run sim-ios       # the same, then install on the booted simulator and launch
npm run sim-ios:fast  # the same, skipping prebuild and pod install while ios/ is current
npm run archive-ios   # the release path without a signature: an unsigned Release archive for a device, checked
```

`build-ios` needs Xcode and CocoaPods (`brew install cocoapods`). Its Xcode log is `temp/native-expo/xcodebuild.log`
at the repo root. CI's `native (Expo)` job runs the type check and `build-ios` on every push to `dev` and every pull
request. The build fails unless the app holds its widget extension and its Swift module.

**The fast build** (`--fast` on `build` or `sim`; `scripts/prebuild-stamp.mjs`). Every prebuild leaves the digest of
what it read in `ios/.ia-prebuild`: the config, the packages and their lockfile, the icon, `targets/`, `modules/` and
core's version. A fast build skips prebuild and its pod install only while that digest still matches, and Xcode then
builds only what changed; the JavaScript under `src/` is bundled on every build either way. When anything prebuild
reads has changed, or `ios/` is missing, it runs prebuild and says why. CI and the archive never use it.

**The icon** is `assets/icon.png`: today's icon with an orange band reading NEXT, so the two apps are told apart on
the home screen. `python3 scripts/make-icon.py` makes it again when today's icon changes (it needs Pillow; no build
runs it).

## Native code (the spike, phase 2 session 3)

`ios/` is generated by `expo prebuild` on every build and never committed. What is native and ours lives outside it:

- **The widget target**, `targets/RestTimerWidget/`: added to the generated project on every prebuild by
  `@bacons/apple-targets` 5.0.0 (`plugins` in `app.config.js`). Its bundle id is
  `com.bigyerr.ironasylum.next.RestTimerWidget`. It is empty on purpose (one `EmptyWidgetConfiguration`); phase 4
  moves the rest stopwatch's Swift in. It takes the app's version and build number.
- **The Swift module**, `modules/ia-spike/`: a local Expo module found by Expo's autolinking. It does nothing. The
  app asks it one question when the bundle loads (`src/native-spike.ts`), and the Bugs screen reads "Swift answers."
  or "Swift does not answer." (`src/spike-line.ts`). `IAGps` and `IAIsland` arrive the same way in phase 4.

`tests/unit/native-shell.test.ts` holds both.

## TestFlight from CI (one time)

After each merge into `main`, the pipeline's three `next TestFlight` jobs archive this app with its widget, upload it
to App Store Connect and wait until it is processed (D288, `docs/decisions/testflight.md`). The lane runs beside
today's (`frontends/app/README.md`) and apart from it: it signs `com.bigyerr.ironasylum.next`, never
`com.bigyerr.ironasylum`, and no job of one needs a job of the other. Until its seven secrets are set, its gate skips
and stays green.

**A build goes up once.** The version is core's release version. The build number counts the commits that changed
`frontends/native`, `core` or `tests/semver.js` (`node scripts/testflight.mjs build` prints it), so TestFlight shows
`0.262.0 (101)`. A merge that changes none of them skips. A merge that changes any of them is the next build.

The signing is today's lane's own code (`frontends/app/scripts/signing.mjs`), plain: the one Apple Distribution
certificate today's lane already holds, and one App Store profile for each signed target. No EAS. Five of the seven
secrets are today's and already set: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, `IOS_DIST_CERT_P12`,
`IOS_DIST_CERT_PASSWORD`. Mario makes the rest in the browser, once.

These steps were done once, on 2026-11-13. They are kept whole for the day they are needed again. You need a Mac,
a browser and Terminal, about 20 minutes, and no Xcode. Do the parts in order: each one needs the one before. Never
paste a secret or a profile's contents into a chat, an issue or a commit.

### Part 1. Sign the agreements (2 minutes)

1. Open developer.apple.com/account and sign in with the Apple ID that owns the developer account.
2. If a banner at the top names the Apple Developer Program License Agreement, click **Review Agreement**, tick the
   box at the bottom and click **I Agree**.
3. Open appstoreconnect.apple.com with the same Apple ID and click **Business** (on some accounts, "Agreements, Tax,
   and Banking").
4. The row Free Apps Agreement should say Active. If any row offers "View and Agree to Terms" or "Review", open it
   and accept.

Done when no banner is left and the Free Apps Agreement says Active. While one is unsigned, App Store Connect answers
every lane 403, "A required agreement is missing or has expired", today's lane included.

### Part 2. Register two App IDs (4 minutes)

An App ID is Apple's record that a bundle id is yours. The app needs one and its widget needs one.

1. Open developer.apple.com/account/resources/identifiers/list and click the **+** beside Identifiers.
2. Choose **App IDs**, Continue, then **App**, Continue.
3. Description `IA Next`. Bundle ID **Explicit**, exactly `com.bigyerr.ironasylum.next`.
4. Tick no capability. Continue, then Register.
5. Click **+** again and repeat steps 2 to 4 with description `IA Next Widget` and Bundle ID
   `com.bigyerr.ironasylum.next.RestTimerWidget`.

Done when the list shows both. If Apple says an identifier is not available, it is already registered: find it in the
list and go on.

### Part 3. Create the app in App Store Connect (3 minutes)

1. Open appstoreconnect.apple.com/apps, click the **+** beside Apps, then **New App**.
2. Platform iOS only. Name `IA Next` (if taken, `IA Next Beta`; the name does not matter to the build). Primary
   language English (U.S.).
3. Bundle ID: pick the one ending in `com.bigyerr.ironasylum.next`. If it is not listed yet, wait a minute and reload.
4. SKU `ironasylum-next`. User Access Full Access. Click **Create**.

Stop there. TestFlight needs no screenshots, price or description.

### Part 4. Make two profiles (5 minutes)

A profile is a small file that says this certificate may sign this app.

1. Open developer.apple.com/account/resources/profiles/list and click the **+** beside Profiles.
2. Under Distribution choose **App Store Connect**, Continue.
3. App ID: the one ending in `com.bigyerr.ironasylum.next`, not the RestTimerWidget one. Continue.
4. Certificate: the **Apple Distribution** one. If there are several, pick the one with the expiry date of today's
   profile "Asylum App Store". Continue.
5. Name `Asylum Next App Store`. Generate, then Download.
6. Click **+** again and repeat steps 2 to 5 with the App ID ending in
   `com.bigyerr.ironasylum.next.RestTimerWidget`, the same certificate, and the name `Asylum Next Widget App Store`.

Done when Downloads holds `Asylum_Next_App_Store.mobileprovision` and `Asylum_Next_Widget_App_Store.mobileprovision`.
Do not open them. A wrong certificate breaks nothing: the upload job fails naming the mismatch, and both profiles are
made again.

### Part 5. Put them in GitHub as secrets (4 minutes)

GitHub stores text, so Terminal turns each file into text and copies it.

1. In Terminal: `base64 -i ~/Downloads/Asylum_Next_App_Store.mobileprovision | pbcopy`. Nothing prints; the text is on
   the clipboard.
2. Open the repo on GitHub > Settings > Secrets and variables > Actions > **New repository secret**. Name
   `IOS_PROFILE_NEXT_APP`, paste into Secret, **Add secret**.
3. In Terminal: `base64 -i ~/Downloads/Asylum_Next_Widget_App_Store.mobileprovision | pbcopy`.
4. **New repository secret** again. Name `IOS_PROFILE_NEXT_WIDGET`, paste, **Add secret**.

Done when the list shows both beside the five older ones. If Terminal says "No such file", the file in Downloads has
another name. Afterwards the two downloaded files can go to the Trash.

### Part 6. Add yourself as a tester (2 minutes)

1. Open appstoreconnect.apple.com/apps, click **IA Next**, then the **TestFlight** tab.
2. Beside Internal Testing click **+**. Name the group, leave automatic distribution on, **Create**.
3. In the group, beside Testers click **+**, tick your own name, **Add**.

It is fine that there is no build yet.

### After

The first build goes up with the next merge into `main` that changes this app, or from Actions > pipeline > Run
workflow on `main`. The run's notice says what happened: `testflight next 0.262.0 (101) processed`, or why it skipped.
About 20 to 30 minutes later TestFlight on the iPhone offers IA Next, beside The Asylum. Nothing in these steps
changes The Asylum (`com.bigyerr.ironasylum`) or its data.

**Once a year** the certificate expires and all four profiles with it (today's two and these two); the upload warns
within 30 days. Then parts 4 and 5 are done again with the new certificate, and today's lane's own two profiles
beside them (`frontends/app/README.md`). `node scripts/testflight.mjs leg` reads the newest run on `main` for the deploy picture.

## Core

`@ia/core` is a `file:` dependency, a link to `../../core`. `metro.config.js` watches that folder and resolves
whatever a core file asks for (Babel's runtime helpers) from this app's `node_modules`. Core's files bundle as they
are, their `.ts` import paths included (`tests/measure/engine-check_hermes.mjs`).
