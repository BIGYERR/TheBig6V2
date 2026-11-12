# The engine check

A line on the Bugs tab that builds the programs CI pins with the engine as shipped, on the phone itself, and says how
many come out the same. The React Native migration's phase 1 step 2 (`MIGRATION.md`, section 2 and section 6 decision 4):
CI proves the engine under V8, the phone runs JavaScriptCore today and Hermes after the move, and nothing had ever run
the lattice on either (section 4.2: `Math.sin` under every seeded draw, the language dependent tie break, `Math.log`
and `Math.pow`).

## D286 P-ENGINECHECK: one Engine row on the Bugs tab (2026-11-12)

- **Date:** 2026-11-12. **Ruled by:** the session (form and copy, which are the session's to decide); the line itself
  is Mario's decision 4 (2026-11-12: "decision 4 is yes"). **Bump:** MINOR, Mario 2026-11-12. **Shipped:** v0.262.0
  (on the chat's branch until Mario merges it).
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
     finished check can be run again.
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
