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
