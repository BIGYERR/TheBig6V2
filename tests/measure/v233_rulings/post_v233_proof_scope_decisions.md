# Post-V233 Proof scope: Mario's decisions (2026-10-05 / 2026-10-06), no build

Source: Mario's two messages in the Post-V233 tooling chat. Evidence: `measure_gate_history_mH.md` (Post-V232),
`measure_sabotage_history_mS.md`, `measure_tooling_inventory_mT.md`, `tests/measure/v233_gate_reach.json`,
`tests/measure/v233_proof_cost.js` (T1 timing, outputs in that session's scratchpad).

## Message 1 (approved, go ahead)
1. Kill the noise: script the "nothing moved" version rows; convert brittle line and text checks (like g224) to
   content checks; g193 fails cleanly instead of crashing; gate.sh runs every gate and reports all failures at the end.
2. Run the full suite once on the draft before builder finishes; gatekeeper's final run confirms the shipped file only.
3. Against the previous version, run only gates that are new or edited in that build.
Sabotage: run the history analysis on the sweep first (done: mS); move it off per-build ("when any gate file is
added or edited, or once a week"); tell Mario before applying if the V221 dead gates appeared with no gate change.
New standing rules: 15-minute proof for a normal bug-fix build, else say what you'd drop and why; say LOCAL or
CROSS-CUTTING before proof (cross-cutting: full suite on the draft; local: dependency chain only); every 25 builds
rerun the gate history analysis and report gates that never caught a real bug. Show the CLAUDE.md wording before commit.

## What the session reported back
- V221 trio died on V220's version bump (index.html only; g219_d167 never edited; `PAIR = VER === ERA`). The rule as
  written fires on 43/43 builds (every build adds or edits a gate file). Full sweep 4,908 s (V233) to 8,636 s (V232).
- gate.sh 1,074 to 1,560 s wall, 8 gates in parallel (GATE_JOBS default 8, 8 cores); 10 slowest = 67% of gate time;
  g230_d194_lens2 841 s alone. Reach map (V8 coverage) works for 92/97 gates; V233's change reached 3 gates.
- Readings confirmed by Mario: "local = dependency chain" refines "full suite on the draft" (full suite is for
  cross-cutting); era-script rows do not make a gate edited; this is the Post-V233 pass, V234 is the first build under it.

## Message 2 (decisions)
- **Sabotage: split as recommended.** Every build: anchor check of every spec, trip run of own spec + mutations naming
  edited gates + mutations naming gates with exact-version rows; full sweep weekly. **Measure the exact-version clause
  cost before building.** Plus a design rule: **no gate row may be scoped to a single exact ia-version; rows use a range
  or a minimum, or the era script bumps them.** The sabotage clause becomes the backstop.
- **Budget: add the slow-gate trim slice**, every trimmed gate still trips its own planted bugs. **Before trimming,
  report whether gates run in parallel; if sequential, parallelize the six slow gates first and trim only what is still
  over.** Budget becomes two numbers: **LOCAL under 15 minutes, CROSS-CUTTING under 30**; keep "tell me what you'd
  drop and wait" for anything that can't fit.
- **Wording approved with those two changes.** gatekeeper.md and the ship and session-start skills **reference** the
  Proof scope section of CLAUDE.md as the single source; any copy they must carry says CLAUDE.md is authoritative.
- "Show me the revised section, then commit."

## Message 3 (2026-10-06): dark rows and this pass's proof budget
Evidence: mE (139 exact-version rows in 29 gates; 6 class i, 121 class ii, 12 class iii), slice 6/8 (the V221 trio,
v219 S1/S3/S4, still survives; its only guards were g219's dark `PAIR = VER === ERA` rows).
- **Dark rows (Mario, verbatim):** "retire the 121 except g219's D167 rows, which get rewritten as forward checks so the
  V221 trio trips again. Make that the rule, not a one-off: after the retirement, prove every planted bug aimed at the
  29 gates still trips. Any survivor exposed by that proof whose only guard was a dark row gets rewritten as a forward
  check, same treatment as g219. Amend standing ruling 3 to say a build-scoped claim retires when the next build ships,
  and the previous-version run is its replacement. Rewiring applies to live checks that went dead, not checks written
  to switch off."
- **Session reading, recorded:** the 12 class-iii rows are build-scoped claims too, so they retire under the same rule
  (the 8 typed HALF_MANNY values are carried by the MANNY era table; making the other 4 era rows would mean reading a
  value off a built artifact after the fact, which standing ruling 5 forbids). The 10 baseline-licence hits outside
  mE (g193_budget_floor `BASE_VER === '192'/'197'/'198'`, g220_d174 `bver === '219'`) are build-scoped the same way.
- **Proof budget (Mario, verbatim):** "run it in full, drop nothing. Draft run now, skipping the 230 exact-version
  mutations as you proposed; they run once on the final run after the dark-row slices land. This is a one-off exemption
  because the pass changes the proof tools themselves. The 30-minute cross-cutting budget stands for every normal
  build, and any future tooling pass asks the same way you just did." "Go ahead with gatekeeper's draft run."

## Message 4 (2026-10-06): Version scope becomes "no row goes dark"
Evidence: measure mC (tests/measure/v233_rulings/measure_ceilings_mC.md): 17 silent-ceiling predicates, 31 dark rows in
11 gates, 13 of 17 out of reach of a static rule.
- **Mario (verbatim):** "Adopt the new Version scope bullet. Two changes to the wording. First, add that every declared
  row prints exactly one status line (PASS, FAIL, SKIP, or SCOPED OUT) and a declared row with no status line is red. If
  gate.sh doesn't already guarantee one line per declared row, that's a slice before the check switches on. Second,
  every tests/skip_allow.txt entry names the gate, the row, and the cause; no blanket entries, and the 25-build review
  audits the list. Do the SKIP count at 233 after the retirements before switching it on, as you proposed. Keep the
  static lint alongside it. On the first run under the check, expect reds: sort each one into real dark row or
  legitimate skip, add the legitimate ones to the allow list with their cause, and report the split to me. Don't treat
  those first reds as a reason to loosen the rule."
- The 31 silent-ceiling rows retire under amended standing ruling 3 (session; no new call needed).

## Message 5 (2026-10-06): declared rows by manifest
Evidence: measure mR (tests/measure/v233_rulings/measure_row_status_mR.md): gate.sh guarantees no per-row line; 27/97
gates declare row ids, 70 ad hoc, 38 loop rows; 6 gates print nothing for passing rows (583 rows); 12 have no parseable
id; 6 print one id twice; no shared status helper (94 own ok()).
- **Mario (verbatim):** "Manifest, not the full conversion. Conditions: gatekeeper regenerates tests/row_manifest.txt from
  a proven run only, builders never hand-edit it, and a row that leaves the manifest without a ruling is red. A ruling
  that adds or changes a row must appear as a manifest hunk; if the ruling names a new row and the manifest didn't
  change, the build is red. The 24 gates you hand-convert all use one shared status helper, and every new gate from here
  uses that helper, so the codebase moves toward declared rows without a dedicated pass. Record the born-dark hole in
  the Version scope bullet as covered by sabotage plus the manifest-hunk rule, so it's a known gap and not a forgotten
  one. Go."
- **Mario, addition (verbatim):** "One addition to the Row manifest bullet: a manifest hunk that no ruling explains is red
  in both directions, rows added as well as rows removed. Then continue as planned."
- **Session reading, recorded:** the manifest records each row's arity (prints once / prints many), not exact counts, so
  a loop row's data-dependent count is not a hunk; a change between once and many is a hunk and needs a ruling.
