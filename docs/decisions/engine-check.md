# The engine check

A line on the Bugs tab that builds the programs CI pins with the engine as shipped, on the phone itself, and says how
many come out the same. The React Native migration's phase 1 step 2 (`MIGRATION.md`, section 2 and section 6 decision 4):
CI proves the engine under V8, the phone runs JavaScriptCore today and Hermes after the move, and nothing had ever run
the lattice on either (section 4.2: `Math.sin` under every seeded draw, the language dependent tie break, `Math.log`
and `Math.pow`).

## D286 P-ENGINECHECK: one Engine row on the Bugs tab (2026-11-12)

- **Date:** 2026-11-12. **Ruled by:** the session (form and copy, which are the session's to decide); the line itself
  is Mario's decision 4 (2026-11-12: "decision 4 is yes"). **Bump:** MINOR, Mario 2026-11-12. **Shipped:** v0.262.0
  (merged and tagged 2026-11-12). On the iOS simulator (iPhone 17 Pro, JavaScriptCore, the Mac busy with
  the e2e and the break check): Lattice 864 of 864 match. Half Manny matches. Took 30 s (29 s twice on the build
  before the clock fix). On two real iPhones, Mario's and his tester's, on the TestFlight build of v0.262.0 (JavaScriptCore), Mario 2026-11-12: Lattice 864 of 864 match. Half Manny matches.
- **The finding (measured on v0.261.8, `tests/measure/engine-check_clock-and-time.js` and
  `tests/measure/engine-check_storage.js`):**
  1. **A digest does not depend on the clock or the zone.** The 864 lattice programs and HALF_MANNY built at six
     instants (2026-10-11 noon, CI's pin; 2026-11-12 at 08:00 and 23:59; race day 06:00; 2026-12-20; 2027-04-01) in
     four zones (America/New_York, CI's; Pacific/Auckland; UTC; America/Los_Angeles): 24 runs, each 864 of 864 and
     HALF_MANNY equal to `147f083be4e04e34`. Every lattice config carries HALF_MANNY's race date, and the program counts
     back from it. So the phone builds at its own clock, and nothing is pinned.
  2. **The engine touches no stored state.** 1,728 builds made 0 calls on the store (`getItem`, `setItem`,
     `removeItem`, `key`, `clear`), and with the newest corpus backup's 8 `ia_` keys in the store the lattice still
     matched 864 of 864 and the store was unchanged. The one engine global that outlives a build, `_SWAP_UNIVERSE`, is
     reset when each build starts, and the swap sheet reads the copy stamped on the program (`swapUniverseFor`), never
     the global. So the check cannot reach Mario's logs or his program.
  3. **The time.** About 10 ms a build under V8 on this Mac (8.7 to 9.4 s for the 864), the slowest one build 13.7 ms
     (lowback/protect commercial hypertrophy advanced seed=1013), a digest 0.9 ms of it (82,725 characters of JSON for
     HALF_MANNY). On a phone it is 10 to 25 s (estimate, read on the simulator at ship). Run in one go it would freeze
     the screen that long, so it runs in slices.
  4. **The payload.** 864 digests, all distinct, 17,280 bytes as a JSON array (1.3% of the page), plus HALF_MANNY's.
- **What changes:**
  1. **The row.** On the Bugs tab, after Your data and before the Run recorder, in the page (`screens-late.html`) and
     the Angular Bugs screen alike, element for element: label **Engine**; note **Builds the tested programs on this
     phone. Each one must match.**; one button, **Run the check**, which reads **Checking** and does nothing while a
     check runs; and the result line under it.
  2. **What it builds, in this order:** HALF_MANNY (`tests/harness.js` `fixtures.HALF_MANNY`), then the 864 lattice
     configs (`tests/lattice193.js` `FULL`: HALF_MANNY with each cell's equipment, seed, focus, level and injury laid
     over it), in the lattice's order. Each digest is the tests' `progDigest`: the program with `id`, `created`,
     `_swapUniverse` and `_swapUniverseByKey` dropped, as JSON, SHA-256, its first 16 hex characters. A build that
     throws counts as a miss.
  3. **The lines** (the copy rule: short declarative sentences, no dashes; the config's tag is printed as the golden
     file spells it, so it can be found there):
     - running: **Built 212 of 865.**
     - every one matches: **Lattice 864 of 864 match. Half Manny matches. Took 14 s.**
     - a miss: **Lattice 863 of 864 match. Half Manny matches. First miss: elbow/protect home_full hypertrophy
       advanced seed=3039. Took 14 s.** HALF_MANNY's own miss reads **Half Manny does not match.**, and when it is
       the first miss, **First miss: Half Manny.**
     - seconds are whole, rounded.
  4. **Slices.** Builds run until 40 ms of work have passed (at least one build a slice), then the line is redrawn and
     the next slice waits on a zero timer, so the screen answers between slices. Leaving the tab does not stop it. A
     finished check can be run again. The check times itself on `performance.now()`, never the date: the Docker e2e
     freezes `Date.now()`, and timed on it the first build never ended a slice, so all 865 builds ran as one block
     (Took 0 s, Checking never drawn, the screen still for 10 s). Found at build time by the e2e, held by
     `tests/integration/engine-check.test.ts` (red on the `Date.now()` page).
  5. **Where the code lives.** The logic is core's, so phase 2's app runs the same check under Hermes:
     `core/src/engine/engine-check.ts` (the SHA-256, the digest, HALF_MANNY's config, the lattice's axes typed again,
     the cases, the slice and the lines) and `core/src/engine/engine-check-digests.ts`, the pinned digests, written from
     `tests/snapshots/program-output-lattice.json` and `program-output.json` by `node tools/engine-check-digests.mjs`.
     The page's `js/engine-check-row.ts` holds the timers and the row; the Angular screen calls it through the bridge.
     The SHA-256 is plain TypeScript: a web view on the app's own scheme may have no `crypto.subtle`, and Hermes has
     none.
- **What deliberately does not change:** the engine (no file `buildProgram` reaches is edited); every program and
  every golden record of program output; every `ia_` key (the check reads and writes none, and keeps its result in
  memory only); any other row of the Bugs tab. A mismatch the check finds is reported, not fixed: a fix to the engine is
  its own ruling.
- **How the shipped digests are kept equal to the golden files:** `tests/unit/engine-check.test.ts` compares every
  entry of `engine-check-digests.ts` with the two golden files and every case's tag and config with `tests/lattice193.js`
  and `tests/harness.js`. When a ruling regenerates program output, that test is red until
  `node tools/engine-check-digests.mjs` is run, and the regenerated file ships in the same commit. A check on the phone
  can then never compare against digests CI no longer pins.
- **Expected values (typed by hand):** on today's engine, 865 of 865: **Lattice 864 of 864 match. Half Manny
  matches.** The first six lattice tags, in order: `healthy bodyweight support_prevention beginner seed=1013`, `…
  seed=3039`, `… seed=76308`, then `healthy bodyweight support_prevention intermediate seed=1013`, `… seed=3039`, `…
  seed=76308`. SHA-256 of `abc`: `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`; of the empty
  string: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (FIPS 180-2 examples).

## D286 in the Expo app: the same row, run under Hermes (Post-v0.262.0, the migration's phase 2, session 1)

- **Date:** 2026-11-12. **Ruled by:** the session (form, which is the session's to decide; D286 itself already says
  "the logic is core's, so phase 2's app runs the same check under Hermes"). No new D-code: the row, its words, its
  cases and its lines are D286's, unchanged. Mario's GO for phase 2, 2026-11-12. **Bump:** none, Mario 2026-11-12 ("No
  version"): today's app and `index.html` do not change, so `ia-version` stays 0.262.0 and nothing reaches the phone.
  **Shipped:** Post-v0.262.0, no build (`frontends/native`, on the chat's branch until Mario merges it).
- **The finding (measured, `tests/measure/engine-check_hermes.mjs`):**
  1. Core's check and engine stand alone: run through `core/src/engine/engine-check.ts` and `budget-engine-d.ts` with
     no page, no harness and no store, under V8, they read Lattice 864 of 864 match. Half Manny matches.
  2. Core builds for Hermes as it is: the two modules bundled with their types stripped and their syntax left as
     written (esbuild, `esnext`, 360,636 bytes) compile under `hermesc` from React Native 0.88.1's `hermes-compiler`
     260318099.0.5 (317,167 bytes of bytecode). That package carries `hermesc` only, for Linux, macOS and Windows, and
     no Hermes VM, so no CI step on Linux can run the lattice under Hermes without building Hermes from source: the run
     is the simulator's (`MIGRATION.md` 3.2, answered).
  3. Metro needs two things and no change to core: core's folder in `watchFolders`, and the packages a core file asks
     for (Babel's runtime helpers) resolved from the app's `node_modules`. The `.ts` import paths and the package's
     `exports` resolve as they are. The bundle carries the 17 engine files, `engine-check.ts` and its digests.
- **What changes:** a new app, `frontends/native/`: Expo SDK 58.0.25, React Native 0.88.1, React 19.3.0, Hermes V1
  (React Native's default; the bundle is Hermes bytecode version 99 and the app links `hermesvm.framework`), pinned
  exactly. Bundle id **com.bigyerr.ironasylum.next**, display name IA Next, version and build number core's release
  version (`app.config.js` reads `core/src/version.ts`). One screen, Bugs: a line **Runs on Hermes. Version 0.262.0.**
  (read from the runtime and from core, so a build that fell back to another engine says so), and D286's Engine row,
  element for element: the label, the note, **Run the check** reading **Checking** while it runs, the progress and the
  result lines from core's `engineCheckLine`, slices of core's 40 ms on `performance.now()` with a zero timer between.
  The Track tokens, day and night by the phone's setting, the button in ink. A CI job, `native (Expo)`, beside
  `native (iOS simulator)`: the type check, `expo prebuild` and an unsigned Release build for the simulator.
- **What deliberately does not change:** today's app (`frontends/app/` untouched, its bundle id
  `com.bigyerr.ironasylum`; `tests/unit/native-shell.test.ts` holds the two apart); the engine and core (no file
  edited); every program and golden record; every `ia_` key (the new app has no storage at all yet). Not in this
  slice: SQLite, loading a backup, This Week, the native spike, the second TestFlight lane.
- **Result on the iOS simulator (iPhone 17 Pro, iOS 26.5, the Release build, Hermes):** Lattice 864 of 864 match. Half
  Manny matches. Took 133 s, and 134 s run again. JavaScriptCore read the same line in 30 s on the same simulator
  (v0.262.0), so the engine runs about 4.4 times slower under Hermes here: about 155 ms a build against 35 ms. The
  likely cause, not measured:
  the web view's JavaScriptCore compiles hot code, and Hermes runs bytecode without that. It matters past this check,
  because `refreshProgram` rebuilds the program on every launch; the phone's own number comes with the phase 2 gate.
- **Result on Mario's phone (2026-11-13, IA Next 0.262.0 (100) from TestFlight, Hermes, his screenshot):** Lattice 864
  of 864 match. Half Manny matches. Took 92 s. About 106 ms a build, against 155 ms on the simulator. The phase 2 exit
  gate's engine leg is seen.
