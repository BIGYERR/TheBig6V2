# frontends/native: Iron Asylum in React Native

The Expo app the React Native migration builds (`MIGRATION.md`, phase 2), beside today's app in `frontends/app/`,
which it does not touch. Its bundle id is **com.bigyerr.ironasylum.next**, so it installs next to today's app
(`com.bigyerr.ironasylum`) and never replaces it before cutover. `tests/unit/native-shell.test.ts` holds that.

**Today it holds one screen:** the engine check (D286, `docs/decisions/engine-check.md`), core's
`core/src/engine/engine-check.ts` run as it is, with `buildProgram` as the engine, under Hermes. It reads and writes
no stored key.

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
```

`build-ios` needs Xcode and CocoaPods (`brew install cocoapods`). Its Xcode log is `temp/native-expo/xcodebuild.log`
at the repo root. CI's `native (Expo)` job runs the type check and `build-ios` on every push to `dev` and every pull
request.

## Core

`@ia/core` is a `file:` dependency, a link to `../../core`. `metro.config.js` watches that folder and resolves
whatever a core file asks for (Babel's runtime helpers) from this app's `node_modules`. Core's files bundle as they
are, their `.ts` import paths included (`tests/measure/engine-check_hermes.mjs`).
