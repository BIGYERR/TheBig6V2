# Test migration: from per-build gates to feature tests

Mario, Post-v0.239.1: "tests should be made that are not named per gate.... they should be named per feature and
organized like such... the versioning is redundant because we are using git and semver... switch to our more modern
unit//integration/e2e test maintenance flow + dev branch pushes".

**Done (Post-v0.239.1): phase 3 deleted the legacy suite in `830af1e`; the feature tests are the only suite.** This file
is now the record of how every gate row was carried over or dropped.

The legacy suite was 104 gate files in `tests/gates/`, each named for the build and ruling that wrote it, with the
machinery that kept them honest across versions: `tests/gate.sh`, the row manifest, the skip allow list, `ROW_RULED`
licences, era rows and `tests/era_bump.py`, `tests/version_scope.js`, `tests/chain.js` and the reach map,
`tests/sabotage.py` with its specs, and `tests/edits/`. Git and semver now carry what that machinery carried by hand, so
the tests moved to the layout CLAUDE.md's Test layout section sets out: `tests/unit/<feature>.test.ts`,
`tests/integration/<feature>.test.ts`, `tests/snapshots/<feature>.json`, strict TypeScript run by Vitest
(`cd tests && npx vitest run unit integration`; architecture phase A, `docs/architecture-migration.md`).

## The three phases

1. **Phase 1 (done, Post-v0.239.1).** The layout, its helpers (`tests/support/app.ts`, `tests/support/snapshot.ts`),
   the 60-second check and a CI job run the new tests; CLAUDE.md, the agents and the skills describe the new flow; the
   legacy suite is frozen (no new files) and keeps running in CI exactly as before. Pilot tests:
   - `tests/unit/version-label.test.ts`: `iaVersionLabel`, the formatting half of D236 (4 tests).
   - `tests/integration/rest-timer.test.ts`: D235, the rest timer drag (6 tests). It holds the claims of
     `g0.239.1_timer_label.js`'s rows `D235-jitter`, `D235-cancel` and `D235-idlecancel`.
   - `tests/integration/program-output.test.ts` with `tests/snapshots/program-output.json`: HALF_MANNY
     (`2d35e8f743680cfa`) and nine seeded configs, digest and week grid each (5 tests). It holds the shipped HALF_MANNY
     digest that 37 gates read from `MANNY_DIGEST_BY_VERSION`. The two counterfactual tables are not in it: the deload
     off digest (`MANNY_DELOAD_OFF_DIGEST_BY_VERSION`, read by `g199_deload_arbitration.js`) and the core off digest
     (`MANNY_CORE_OFF_DIGEST_BY_VERSION`, `g200_core_tier.js`) need a source surgery copy of the app, and move with
     their gates.
   Architecture phase A (Post-v0.239.1) moved every file above, and the phase 2 files written since, from `.js` and
   `node --test` to TypeScript and Vitest, with the same tests and the same golden file; the names below are the
   TypeScript ones. A moved gate's tests are written in TypeScript from the start.
2. **Phase 2 (done, Post-v0.239.1).** The gates moved feature by feature, in the order below. Each move proved every old
   row is held by a new test or dropped with a written reason (the parity rule), and deleted the gate in the same
   commit. Groups 1 to 18 are done; their parity tables are `docs/test-migration/01-rest-timer.md` to
   `18-session-budget.md`. 64 files ported from JavaScript late in phase 2 still open with `// @ts-nocheck` (Typing
   debt, below).
3. **Phase 3 (done, Post-v0.239.1, `830af1e`).** Deleted the machinery once no gate was left: `gate.sh`, `rows.js`, `status.js`,
   `row_manifest.txt`, `skip_allow.txt`, the `ROW_RULED` licences, the era tables and `era_bump.py`,
   `version_scope.js` and its debt list, `chain.js` and the reach map, `sabotage.py` and its specs, `tests/edits/`, the
   gate, sabotage and row steps of `tools/check.mjs` and of the pipeline, and CLAUDE.md's Proof scope section (789 tracked files). The identity fuzz (`tests/fuzz.sh`) is replaced by the
   snapshot lattice: `tests/sweeps/program-output.test.ts` builds all 864 configs of `tests/lattice193.js` twice, checks
   each equals itself and leaves its config untouched, and holds every digest in
   `tests/snapshots/program-output-lattice.json`, so any change to what the engine prescribes is a reviewable diff.
   `g_fuzz_shard_equiv.js` (17 rows) went with the fuzz driver: it proved the driver's sharding, not the app.
   `tools/check.mjs` keeps the build lane (the byte-for-byte rebuild, the meta, the inline script compiling, the
   HALF_MANNY boot) and CI's tests job runs the same two steps before Vitest.

## Feature groups

Rows are from `tests/row_manifest.txt` (2,130 rows over 103 gates, generated from the V239 run), plus the 7 rows
`g0.239.1_timer_label.js` declares, which enter the manifest from CI: 2,137 rows over 104 gates.

| # | Feature group | Gates | Rows | Target files (`tests/`) |
|---|---|---|---|---|
| 1 | Rest timer and rest sheet | 2 | 19 | `integration/rest-timer.test.ts` (D235 done) |
| 2 | Version label and bug report | (rows of `g0.239.1`) | (4 of the 7) | `unit/version-label.test.ts` (done), `integration/version-label.test.ts` |
| 3 | Boot and build basics | 1 | 9 | `integration/boot.test.ts` |
| 4 | Logging | 7 | 75 | `integration/logging.test.ts`, `unit/pace-delta.test.ts` |
| 5 | Pop-ups | 2 | 52 | `integration/pop-ups.test.ts` |
| 6 | Week view, day close and the active program | 4 | 89 | `integration/week-view.test.ts`, `integration/week-freeze.test.ts`, `integration/active-program.test.ts` |
| 7 | Swaps and undo | 8 | 80 | `integration/swaps.test.ts` |
| 8 | Progress, ledger and Wildcards | 4 | 210 | `integration/progress.test.ts`, `integration/ledger.test.ts`, `integration/wildcard.test.ts` |
| 9 | Test weeks, race dates and taper | 7 | 205 | `integration/test-week.test.ts`, `integration/race-date.test.ts` |
| 10 | Pace clock and the mile anchor | 10 | 348 | `integration/pace-clock.test.ts`, `unit/clock-format.test.ts` |
| 11 | Cardio sessions: NSW Table 6, swim and bike | 11 | 195 | `integration/cardio-sessions.test.ts`, `integration/swim.test.ts` |
| 12 | Run week layout and the long-run day | 11 | 214 | `integration/run-week-layout.test.ts`, `integration/long-run-day.test.ts` |
| 13 | Injury and travel overlays | 9 | 84 | `integration/injury-overlays.test.ts` |
| 14 | Deload weeks | 2 | 72 | `integration/deload.test.ts` |
| 15 | Core and trunk blocks | 3 | 40 | `integration/core-trunk.test.ts` |
| 16 | Supersets and duplicate movements | 6 | 81 | `integration/supersets.test.ts`, `integration/duplicate-movements.test.ts` |
| 17 | Equipment tiers and the exercise pool | 7 | 159 | `integration/equipment-tiers.test.ts` |
| 18 | Session budget and accessory blocks | 9 | 188 | `integration/session-budget.test.ts` |
| 19 | Program output | (the HALF_MANNY era check in 37 gates) | (part of their rows) | `integration/program-output.test.ts` (done) |
| | Test tooling, not an app feature | 1 | 17 | dropped with `tests/fuzz.sh` (phase 3); the lattice snapshot replaces the fuzz |
| | **Total** | **104** | **2,137** | |

`g0.239.1_timer_label.js` is counted once, under group 1; `g194_implement_and_range.js` once, under group 8 (its D54
rows go to group 13).

## Order of migration (phase 2)

1. **Rest timer and rest sheet.** The next release, v0.240.0, is the rest sheet (D228 to D232): its tests are written
   here from the start, and `g239_d233_island.js` (12 rows) joins them.
2. **Version label and bug report.** The four D236 rows (`#bugVersion` after boot, the report context from
   `submitBug`, a body relabelled `239` and one relabelled `v0.239.1`). With group 1's D235 rows already held, this
   retires `g0.239.1_timer_label.js` whole.
3. **Boot.** Nine rows, and the boot every other integration file leans on.
4. **Logging.** Recent DOM gates (D199 to D227), the surface Mario changes most.
5. **Pop-ups**, then 6. **Week view, day close and the active program**: the flows next to logging.
7. **Swaps and undo.**
8. **Progress, ledger and Wildcards.** `g195_wildcard.js` alone is 110 rows.
9. **Test weeks, race dates and taper.**
10. **Pace clock and the mile anchor.** The largest group (348 rows); its hand tables (`g204_clock_limb.js`, the pace
    delta) become unit tests.
11. **Cardio sessions.** These read the doctrine text (`doctrine/*.txt`, NSW Table 6): the CI job for the new tests
    gains the `DOCTRINE_TXZ` restore step when the first such test lands.
12. **Run week layout and the long-run day.** Lattice sweeps over run-day layouts.
13. **Injury and travel overlays**, 14. **Deload weeks**, 15. **Core and trunk blocks**, 16. **Supersets and duplicate
    movements**, 17. **Equipment tiers.** Engine pools and filters, each a lattice over goals, tiers and plans.
18. **Session budget and accessory blocks.** The slowest sweeps (`g197b_sweep.js`, `g197c_d84_cmp.js`) go last, once the
    pattern for large lattices is settled.
19. **Test tooling.** Dropped with the fuzz driver in phase 3.

**Decided before group 12 (the recommendation below was taken):** where a sweep that takes more than a few seconds lives, since
`tools/check.mjs` runs `tests/unit` and `tests/integration` whole inside its 60 seconds. Recommendation: a seeded sample
in the integration file, and the full lattice in a CI-only folder (`tests/sweeps/<feature>.test.ts`) that the check
skips.

## The parity rule

Every manifest row of a gate maps to a new assertion or to a written reason it is dropped. A gate moves only when all
of its rows are accounted for, in one commit (`tests: Post-v<version> <feature> moves to tests/integration`, no version
of its own, standing ruling 1):

1. **List the rows:** `grep '^<gate> ' tests/row_manifest.txt`. A row printed by a loop (`many`) is one row.
2. **Map each row** to the test that holds its claim, as `tests/<layer>/<feature>.test.ts` › "<test name>", or to
   `DROPPED: <reason>`. The reasons that need no ruling:
   - the row is a version predicate, a `REFUSED` arm or an era-row existence check (the legacy machinery itself);
   - the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by
     `tests/integration/program-output.test.ts` (the two counterfactual tables are not, so their rows map to tests);
   - the row is a build-scoped claim that has retired (standing ruling 3);
   - the row repeats another row of the same move, named by its key.
   Any other drop is a coaching or product question and goes to a ruling first.
3. **Write the mapping** into this file, under a `### Moved: <feature>` heading below, one line per row, so the manifest
   hunk that removes the gate's rows is explained (CLAUDE.md Proof scope, Row manifest).
4. **Prove the new tests discriminate.** They pass on `index.html`. Each test written for a behaviour a ruling changed
   fails on the release before that ruling (`cd tests && IA_APP=<that body> npx vitest run <file>`). Each sabotage mutation that names
   the gate is applied to a scratch copy of `index.html` once more, and the new tests run against it with `IA_APP`:
   every mutation must make at least one new test fail. That is the last use of those mutations; they leave their spec
   in the same commit.
5. **Delete the gate** and its mutations. Gatekeeper regenerates `tests/row_manifest.txt` from the CI run, and the
   mapping in step 3 is what explains the removed rows.

## The gates

What each gate checks is read from its header. Target files are under `tests/`.

| Gate | Rows | What it checks | Feature group | Target |
|---|---|---|---|---|
| `g0.239.1_timer_label.js` | 7 (declared; enter the manifest from CI) | D235 the rest timer stays put on a tap and a cancelled drag docks (3 rows); D236 the BUILD label and the report context read semver (4 rows) | Rest timer and rest sheet (D235); Version label and bug report (D236) | `tests/integration/rest-timer.test.ts` (D235, moved in phase 1); `tests/unit/version-label.test.ts` (formatting, phase 1) and `tests/integration/version-label.test.ts` (D236 rows) |
| `g000_boot.js` | 9 | the app boots, exports its engine, builds HALF_MANNY self-stable with a pinned seed, 14 weeks, race on W14 SUN | Boot and build basics | `tests/integration/boot.test.ts` |
| `g190_rounds.js` | 27 | the superset round count is a field, never a substring: resolver precedence, MIN across members, both grammars | Supersets and duplicate movements | `tests/integration/supersets.test.ts` |
| `g191_pacedelta.js` | 11 | the logged run pace delta reads as a gap ("on target", s/mi, m:ss/mi) | Logging | `tests/unit/pace-delta.test.ts` |
| `g192_floorpress_shoulder_gear.js` | 24 | the landmine is barbell tier (shoulder pool gate); Dumbbell floor press in the chest and shoulder workaround pools | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g192_labelsync.js` | 19 | a section heading follows the item the injury filter renamed | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g192_landmine_rotpress.js` | 20 | Landmine rotational press: name, classification, injury behaviour | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g192_shoulder_side.js` | 16 | the shoulder slot prints a side for a one-hand press at all three call sites | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g193_budget_floor.js` | 23 | the session budget never pays for the optional core finisher out of prehab (D47, D48) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g193_d50_trunkfloor.js` | 14 | the trunk floor is a floor on the day: zero trunk is not a prescription (D50) | Core and trunk blocks | `tests/integration/core-trunk.test.ts` |
| `g193_gear_gates.js` | 48 | the gear gates: Pallof press is band gear, gear-free anti-rotation members (D44, D46-c, D47, D49) | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g193_pool_overlay.js` | 10 | an injury pool never offers a movement the same plan's filter removes (D52) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g193_rotation_reach.js` | 9 | the rotational power pillar rotates on its own turn counter (D46-a) | Core and trunk blocks | `tests/integration/core-trunk.test.ts` |
| `g193_samecard.js` | 19 | one card, one movement: no name in a Main section and another section, none twice | Supersets and duplicate movements | `tests/integration/duplicate-movements.test.ts` |
| `g193_trunk_protect.js` | 17 | the protect-tier upper-limb trunk block reads the gear gate (D46-c third reader) | Core and trunk blocks | `tests/integration/core-trunk.test.ts` |
| `g194_implement_and_range.js` | 21 | the main-lift progress line names no implement (D53); the travel holds copy names none (D54); the Range Ladder reads the last session that carries a range (D55) | Progress, ledger and Wildcards (D53, D55); Injury and travel overlays (D54) | `tests/integration/progress.test.ts` (D53, D55); `tests/integration/injury-overlays.test.ts` (D54) |
| `g195_wildcard.js` | 110 | a Wildcard is a substitute the athlete chose and rescues a skipped day's streak (D64, D71, D71b) | Progress, ledger and Wildcards | `tests/integration/wildcard.test.ts` |
| `g196_ledger.js` | 55 | the Lift Ledger keeps every session, bodyweight programs included (D56 to D59) | Progress, ledger and Wildcards | `tests/integration/ledger.test.ts` |
| `g197a_pool_static.js` | 20 | the leg accessory pool and render surfaces (D75, D76, D78, D70b), HALF_MANNY | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g197b_sweep.js` | 27 | the leg accessory lattice sweep, 3,528 builds (D70b, D75, D76, D78) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g197c_d84_cmp.js` | 33 | Calves is pushed before Leg isolation, comparison sweep (D84) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g197d_d84_base.js` | 4 | D84 against the shipped baseline; capSessionBudget, _itemCost, _setCount on a frozen corpus | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g198_posterior_floor.js` | 29 | the budget never trims the day's last posterior chain item (D85) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g199_deload_arbitration.js` | 54 | recoveryDeload keeps its one accessory block by pattern, not push order (D91) | Deload weeks | `tests/integration/deload.test.ts` |
| `g200_core_tier.js` | 43 | a drill declared core in _AUX_FAMILY is never a loaded compound in the budget (D89) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g200_pull_arbitration.js` | 18 | the pull side of the deload arbitration (D93) | Deload weeks | `tests/integration/deload.test.ts` |
| `g202_d108_touchset_freeze.js` | 10 | a day the athlete has seen is frozen by any of the four stores (D108) | Week view, day close and the active program | `tests/integration/week-freeze.test.ts` |
| `g202_int_doctrine.js` | 27 | NSW interval sessions follow guide A, guide B fills its silences (D111, D112) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g202_pace_anchor.js` | 33 | the pace clock anchors on the athlete's chart row at the distance entered (D100, D101) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g202_pace_copy.js` | 16 | the pace clock note and the run anchor sentence (D100, D101 copy) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g203_ceiling_and_anchor.js` | 95 | the NRC easy-day ceiling (D117), a goal change carries the anchor (D118), the anchor provenance sentence (D119) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g203_mile_pencil.js` | 70 | the mile pencil and its lock three weeks out (D116) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g204_clock_limb.js` | 21 | one carrying m:ss clock helper owns every seconds limb (D126) | Pace clock and the mile anchor | `tests/unit/clock-format.test.ts` |
| `g205_bike_unmoved.js` | 15 | the bike builder keeps its own CHI reader (D128, caller half) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g205_chi_table6.js` | 29 | CHI minutes and reps come from NSW Guide B Table 6; bike keeps its ramp, swim takes the rep tier (D128) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g205_d114_int_table6.js` | 18 | INT reps read Table 6 by calendar week, capped at 8 (D114) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g205_d125_ceiling.js` | 19 | the pace family ceiling is 4 runs where the spacing chooser finds no collision, else 3 (D125) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g205_d125_spaced.js` | 23 | the pace family uses the spacing-aware run-day chooser (D125) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g205_d129_tiebreak.js` | 21 | the run-day chooser's two tiebreak ranks (D129) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g205_d130_typed.js` | 24 | typed hard-day adjacency on the pace family (D130) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g205_d132_walkweek.js` | 10 | the fourth run goes only to a week that carries quality, never a walk week (D132) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g205_pace_eve.js` | 23 | the pace family places pull and legs by the D36 cost table (D127) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g206_d109_copy.js` | 13 | no mid-sentence dash in anything the four cardio builders print (D109) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g206_d137_runbase_chi.js` | 11 | run_base's Steady Aerobic Run holds at 20 min from week 13 (D137) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g207_gk_trial_present.js` | 17 | a dated test goal that ends on its test week carries its test, multi-sport too (D106a) | Test weeks, race dates and taper | `tests/integration/test-week.test.ts` |
| `g207_test_calendar.js` | 19 | the test week backfill, calendar controls and copy (D106a slice C, D184) | Test weeks, race dates and taper | `tests/integration/test-week.test.ts` |
| `g207_test_week.js` | 73 | a test goal ends on its test week; the taper window (D106a slice A) | Test weeks, race dates and taper | `tests/integration/test-week.test.ts` |
| `g208_d103a_chip.js` | 10 | the run chip and history read both label eras as one (D103a slice 3) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g208_d103a_key.js` | 6 | every NSW run session carries a class key on its dose (D103a slice 1) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g208_d103a_readers.js` | 19 | the readers go key-first (D103a slice 2) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/cardio-sessions.test.ts` |
| `g208_d104a_runbase.js` | 10 | run_base places its leg lifts by its own run week (D104a) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g209_d140_tier.js` | 15 | the run is the day on NSW long runs too: long-run tiers (D140) | Run week layout and the long-run day | `tests/integration/long-run-day.test.ts` |
| `g210_equipment_denials.js` | 32 | what a tier does not own never prints on it; the swap universe passes the lens (D70c, D150) | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g211_d153_d155.js` | 42 | tier B reads the hinge through _pattern; a tier B long-run day keeps its accessory block (D153, D155) | Run week layout and the long-run day | `tests/integration/long-run-day.test.ts` |
| `g212_d110a_swim.js` | 37 | one rate on one clock for the swim time goal (D110a) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/swim.test.ts` |
| `g213_d113a.js` | 23 | the three-run pace week is INT, CHI, long; multi-sport run days use the spacing chooser (D113a, D146) | Run week layout and the long-run day | `tests/integration/run-week-layout.test.ts` |
| `g214_d158_eve.js` | 8 | the eve of an NSW test carries a shakeout (D158) | Test weeks, race dates and taper | `tests/integration/test-week.test.ts` |
| `g215_d149_ghd.js` | 15 | the GHD is a station only commercial and crossfit own (D149) | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g216_d154_swap_lens.js` | 12 | the injury renamer reads the gear lens (D154) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g216_d156_longday.js` | 4 | the long day is a class: NRC Long Run or dose key long (D156) | Run week layout and the long-run day | `tests/integration/long-run-day.test.ts` |
| `g217_d160_dedupe_view.js` | 9 | the adjacent-day dedupe reads the day that ships, after D18 (D160) | Supersets and duplicate movements | `tests/integration/duplicate-movements.test.ts` |
| `g218_d157_swim_sizer.js` | 10 | the swim sizer reads the same total-seconds clock as the engine (D157) | Cardio sessions: NSW Table 6, swim and bike | `tests/integration/swim.test.ts` |
| `g219_d167_pairs.js` | 8 | the adjacent-day dedupe walks the calendar the week renders (D167, D171, D212) | Supersets and duplicate movements | `tests/integration/duplicate-movements.test.ts` |
| `g219_samecard_draws.js` | 15 | the draw-site twin rulings: no name twice on one card (D159, D164, D165, D166) | Supersets and duplicate movements | `tests/integration/duplicate-movements.test.ts` |
| `g220_d173_recovbanner.js` | 6 | the week view drops the recovery banner; the placement and its field stay (D173) | Week view, day close and the active program | `tests/integration/week-view.test.ts` |
| `g220_d174_emoji.js` | 32 | pop-up emoji on celebration tiers only, icons elsewhere, dash fixes (D174) | Pop-ups | `tests/integration/pop-ups.test.ts` |
| `g220_d175_popcond.js` | 20 | the pop-up judges the day trained, not the minute tapped (D175) | Pop-ups | `tests/integration/pop-ups.test.ts` |
| `g221_d177_swapfloor.js` | 22 | a swapped Main is prescribed the way the engine would prescribe it in that slot (D177) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g221_d178_active.js` | 46 | one program is active, one place says so, one button makes it so (D178) | Week view, day close and the active program | `tests/integration/active-program.test.ts` |
| `g221_d179_donenav.js` | 27 | Done, Skip and Mark Done close the day and land on This Week (D179) | Week view, day close and the active program | `tests/integration/week-view.test.ts` |
| `g221_d180_blockopen.js` | 22 | refreshProgram carries blockOpen, so pre-start days stay behind after a reboot (D180) | Test weeks, race dates and taper | `tests/integration/race-date.test.ts` |
| `g222_d181_chain.js` | 8 | the boot replays swaps in recording order, never onto a frozen day (D181 R4', R5) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g222_d181_durable.js` | 10 | a swap stays made until undone (D181) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g223_d182_racedate.js` | 30 | the race date is parsed once and the countdown is live (D182) | Test weeks, race dates and taper | `tests/integration/race-date.test.ts` |
| `g223_d183_safepace.js` | 60 | the goal is the athlete's; the coach says what the block reaches (D183) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g223_d184_testlen.js` | 36 | a dated test goal pins to its test week within Table 6's 26 rows (D184) | Test weeks, race dates and taper | `tests/integration/test-week.test.ts` |
| `g224_d185_wctoday.js` | 24 | the Wildcard mark and tick stay visible on today's orange cell (D185) | Progress, ledger and Wildcards | `tests/integration/wildcard.test.ts` |
| `g225_d186_clockend.js` | 10 | the block target is the last build week's pace; the taper holds it (D186) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g225_d187_pacerate.js` | 9 | the pace rate has one owner, the mile is required on non-beginner pace goals (D187) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g226_d188_beginnermile.js` | 16 | a beginner may enter a mile and every engine read uses it (D188) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g226_d189_pacedisclose.js` | 18 | a guessed pace says it is a guess at each place the athlete meets it (D189) | Pace clock and the mile anchor | `tests/integration/pace-clock.test.ts` |
| `g227_d190_cuecap.js` | 8 | after a live swap the card carries the plan's cue iff the plan caps the movement (D190 b, c) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g227_d190_prefpath.js` | 4 | swap preferences inside buildProgram keep the cue on the movement on the card (D190) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g227_d190_seam.js` | 7 | the hold cue belongs to the plan and the movement on the card (D190 a, d, e) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g228_d192_undokey.js` | 4 | the undo chip names the lift that left; one undo walks back one step (D192) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g228_d193_cueword.js` | 4 | the cap cue says "three in the tank"; the stripper knows both wordings (D193) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g229_d193_build.js` | 10 | no built card on a capped pattern prints above RPE 7; a held pattern does not test (D193) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g229_d194_lens.js` | 7 | the plan that governs a card is the plan of its day: swap, aux and add sheets (D194 part 1) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g230_d194_lens2.js` | 14 | the plan lens at the tap and at boot (D194 part 2) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g231_d194a4_lateplan.js` | 5 | the whole-day boot re-filter on a late plan change (D194 Amendment 5) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g231_d195_hipext.js` | 6 | the runner armor circuit's fourth item, the prevention hip extension (D195-A) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g231_d195b_cost.js` | 3 | the budget prices prehab rails at half (D195-B) | Session budget and accessory blocks | `tests/integration/session-budget.test.ts` |
| `g231_d196_bwfallback.js` | 4 | a band hip thrust falls to the plan's bodyweight hip extension (D196) | Equipment tiers and the exercise pool | `tests/integration/equipment-tiers.test.ts` |
| `g231_d197_filterlast.js` | 3 | on bodyweight with an injury, every day is filtered once more after the sweep (D197) | Injury and travel overlays | `tests/integration/injury-overlays.test.ts` |
| `g231_d198_hepdraw.js` | 3 | the full-lower hip-extension pick never repeats the day's hinge (D198) | Supersets and duplicate movements | `tests/integration/duplicate-movements.test.ts` |
| `g232_d199_runwheel.js` | 8 | the run log forms are wheels; opening a day never writes (D199 to D206) | Logging | `tests/integration/logging.test.ts` |
| `g233_d207_bikewheel.js` | 5 | the bike log form is one H:MM:SS wheel (D207 to D211) | Logging | `tests/integration/logging.test.ts` |
| `g234_d213_swapkeep.js` | 17 | the sport chip credits, never erases; a moved-in day parks under its own key (D213, D214) | Swaps and undo | `tests/integration/swaps.test.ts` |
| `g235_d215_hmszero.js` | 10 | a blank hms wheel opens on 0:00:00 and the zero face stores nothing (D215 to D217) | Logging | `tests/integration/logging.test.ts` |
| `g236_d218_logbutton.js` | 15 | the cardio card logs on a tap; an untouched slider stores no RPE (D218, D219) | Logging | `tests/integration/logging.test.ts` |
| `g237_d220_distzero.js` | 15 | the miles and rep-time wheels read 0, never a dash; the planned-miles stamp is derived (D220 to D222) | Logging | `tests/integration/logging.test.ts` |
| `g238_d223_restlog.js` | 11 | a rest-day jog is its own record and the moved-in session starts empty (D223 to D227) | Logging | `tests/integration/logging.test.ts` |
| `g239_d233_island.js` | 12 | the rest stopwatch on the iPhone island in the native app only (D233) | Rest timer and rest sheet | `tests/integration/rest-timer.test.ts` |
| `g_fuzz_shard_equiv.js` | 17 | the sharded fuzz driver equals the sequential run (tests/fuzz.sh) | Test tooling (not an app feature) | `tests/unit/fuzz-sharding.test.ts` |

## Typing debt

Phase 2's later groups were ported from JavaScript mechanically, and 64 files opened with
`// @ts-nocheck: ported from JavaScript in phase 2; typing pending`. They ran and passed, but the compiler did not
check them. Each is typed with the types from `@ia/core` (never a local copy) and named interfaces for the lattices,
tallies and surveys, the marker removed and the type check kept green; a file touched by a release is typed in that
release. Post-v0.239.2, 56 are typed: every support file, the unit test, and all but eight test files. Typing them
moved two things in `@ia/core`: `Cfg.raceDate` may be null, and a `CardioGoal` carries the swim time goals' current
times (`baseMins`, `baseSecs`, `base500Mins`, `base500Secs`), which the wizard writes and the engine reads. Still open:

- `tests/integration/` (7): `injury-overlays.test.ts`, `injury-plan-lens.test.ts`, `mile-anchor.test.ts`,
  `pace-wizard.test.ts`, `run-week-layout.test.ts`, `test-length.test.ts`, `wildcard.test.ts`.
- `tests/sweeps/` (1): `injury-overlays.test.ts`.

## Moved

Parity tables for each move, newest last (the parity rule, step 3).

### Moved in phase 1: `g0.239.1_timer_label.js`, rows D235 (the gate stays until its D236 rows move)

| Row | Held by |
|---|---|
| `D235-jitter` | `tests/integration/rest-timer.test.ts` › "a jittery tap under 5 px writes neither top nor left, and the tab tap still expands"; › "a jittery tap on the open card collapses it during the intro and does nothing outside it" |
| `D235-cancel` | `tests/integration/rest-timer.test.ts` › "a drag past 5 px that ends in pointercancel docks to the nearer edge"; › "a jitter that ends in pointercancel writes nothing and runs no tap action" |
| `D235-idlecancel` | `tests/integration/rest-timer.test.ts` › "a cancel outside a drag never re-docks" |
