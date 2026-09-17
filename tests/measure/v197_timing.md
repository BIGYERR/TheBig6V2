# TIMING PASS — Part B: wall-clock before-picture of the verification chain

MODE B (before-picture). Measure only. No ruling, no fix, nothing edited in `index.html`,
`tests/gate.sh`, `tests/sabotage.py`, any gate, any sabotage spec or the handoff.
Nothing committed, nothing pushed, `ia-version` untouched.

Script: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v197_timing.sh`
Raw log: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v197_timing.log`
Per-step stdout/stderr/time files: `/tmp/v197_timing/` (`summary.tsv` is the machine-readable table)
Run: 2026-09-16T03:16:07Z → 03:24:23Z, 496 s of wall clock for the whole script.

## Rename note

The brief named the artifacts `v195_*`. That label is stale: V195 and V196 have both
shipped. The tree measured here is **ia-version 196, git HEAD `3f5d792`, tagged V196,
live** (`gh api .../pages/builds/latest` reads `built 3f5d792d40b503bcfe123ddd9fb9f98e3541f6d4`
and the cache-busted live URL reads `content="196"` — both printed in step 7 below).
Part A will instrument the V197 push, so the artifacts are `v197_timing.sh` /
`v197_timing.log` / `v197_timing.md`. A script named v195 that timed V196 is exactly the
label lag CLAUDE.md warns about.

## Baseline substitution note

The brief said `/tmp/base_V194.html`. That is two versions stale and would have made every
"baseline side" number a V194→V196 measurement rather than a release measurement.
Substituted: `git show V195:index.html > /tmp/base_V195.html` (1,180,549 bytes,
`ia-version 195`), which is the actual previous version of the tree being timed.

## STEP 1 — machine

| fact | value |
|---|---|
| cpus | 8 (Apple M1 Pro) |
| node | v26.8.1 |
| python3 | 3.14.4 |
| bash | 3.2.57(1)-release |
| `index.html` | 1,184,688 bytes, `ia-version 196` |
| baseline `/tmp/base_V195.html` | 1,180,549 bytes, `ia-version 195` |
| gate files `tests/gates/*.js` | 17 |
| newest sabotage spec | `tests/sabotage/v196.json`, **10 mutations** (verified by `json.load`, not taken on trust) |
| git | HEAD `3f5d792`, tag `V196` |
| inline JS extracted by gate.sh step 1 | 1,074,179 bytes |

## THE PART B TABLE

All `real` seconds from `/usr/bin/time -p`, single run (the numbers below are from run 2 of
the script; run 1 agreed to within 0.15 s on every step and within 2.34 s on the fuzz lattice).

```
step                 | count          | seconds | sec/unit
vm_boot              | 1              |    0.05 | 0.05      (whole node process, load only)
node_floor           | 1              |    0.03 | 0.03      (node -e, no app code)
vm_boot_split        | 1              |    0.24 | require 1 ms / vm_load 12 ms / build+digest+grid 9.40 ms per config
gate_candidate       | 17 gates       |   35.23 | 2.07
gate_baseline        | 17 gates       |   34.92 | 2.05
gate_sh_e2e          | 1              |   40.57 | 40.57
sabotage_e2e         | 10 mutations   |    1.14 | 0.114 (average; the runner reports no per-mutation clock)
fuzz_lattice         | 34,020 cfg     |  381.64 | 0.01122 per config / 0.00015 per day-build
pages_api_call       | 1              |    0.51 | 0.51
live_curl            | 1              |    0.11 | 0.11
```

Derived, not separately measured:
- **The ship chain as gatekeeper actually runs it** (`gate.sh` e2e + sabotage + fuzz + the two
  deploy probes) = **423.97 s**. Share: fuzz **90.02%**, gate.sh **9.57%**, sabotage **0.27%**,
  pages API **0.12%**, live curl **0.03%**.
- `gate.sh` residual over the sum of its 17 gates run alone: 40.57 − 35.23 = **5.34 s**
  (steps 0/1/2/3/5: version check, extraction, `node --check` on 1,074,179 bytes, dupe lint,
  harness boot + self-stable check, and the blast-radius diff). Caveat: the per-gate times
  inside `gate.sh` are not identical to the standalone ones, because `gate.sh` passes the
  baseline — see the budget-floor note below.
- Node process startup paid by the 34 standalone gate invocations: 0.03 × 34 = **1.02 s**,
  2.9% of the 35.23 s candidate-side gate total.
- **5 of 17 gates carry 84.7% of the candidate-side gate seconds** (29.85 s of 35.23 s):
  `g193_samecard` 7.41, `g193_gear_gates` 6.82, `g192_shoulder_side` 5.77,
  `g193_budget_floor` 5.26, `g190_rounds` 4.59. The other 12 gates total 5.38 s.

## STEP 3a — each gate alone, CANDIDATE (`index.html`, v196)

`node <gate> index.html` (one argument, no baseline), `/usr/bin/time -p`.

| gate | summary | real_s | exit | measurement |
|---|---|---:|---:|---|
| g000_boot | PASS 10 FAIL 0 | 0.09 | 0 | OK |
| g190_rounds | PASS 47 FAIL 0 | 4.59 | 0 | OK |
| g191_pacedelta | PASS 26 FAIL 0 | 0.07 | 0 | OK |
| g192_floorpress_shoulder_gear | PASS 29 FAIL 0 | 0.33 | 0 | OK |
| g192_labelsync | PASS 26 FAIL 0 | 0.45 | 0 | OK |
| g192_landmine_rotpress | PASS 34 FAIL 0 | 0.06 | 0 | OK |
| g192_shoulder_side | PASS 29 FAIL 0 | 5.77 | 0 | OK |
| g193_budget_floor | PASS 22 FAIL 0 | 5.26 | **3** | OK — exit 3 is the DEFER/NA under-invocation signal, not a failure |
| g193_d50_trunkfloor | PASS 17 FAIL 0 | 2.56 | 0 | OK |
| g193_gear_gates | PASS 168 FAIL 0 | 6.82 | 0 | OK |
| g193_pool_overlay | PASS 219 FAIL 0 | 0.06 | 0 | OK |
| g193_rotation_reach | PASS 24 FAIL 0 | 0.29 | 0 | OK |
| g193_samecard | PASS 53 FAIL 0 | 7.41 | 0 | OK |
| g193_trunk_protect | PASS 38 FAIL 0 | 0.72 | 0 | OK |
| g194_implement_and_range | PASS 19 FAIL 0 | 0.05 | 0 | OK |
| g195_wildcard | PASS 298 FAIL 0 | 0.60 | 0 | OK |
| g196_ledger | PASS 55 FAIL 0 | 0.10 | 0 | OK |
| **total** | **1,114 assertions PASS, 0 FAIL** | **35.23** | | 17/17 printed a summary |

`g193_budget_floor` run WITH a baseline inside `gate.sh` prints **PASS 31 FAIL 0** and exits 0;
run alone here it prints **PASS 22 FAIL 0** and exits 3. Same artifact, 9 assertions fewer:
the standalone number is the under-invoked one. Cost is the same either way (5.26 s alone).

## STEP 3b — each gate alone, BASELINE (`/tmp/base_V195.html`, v195)

| gate | summary | real_s | exit | measurement |
|---|---|---:|---:|---|
| g000_boot | PASS 10 FAIL 0 | 0.09 | 0 | OK |
| g190_rounds | PASS 47 FAIL 0 | 4.58 | 0 | OK |
| g191_pacedelta | PASS 26 FAIL 0 | 0.07 | 0 | OK |
| g192_floorpress_shoulder_gear | PASS 29 FAIL 0 | 0.33 | 0 | OK |
| g192_labelsync | PASS 26 FAIL 0 | 0.45 | 0 | OK |
| g192_landmine_rotpress | PASS 34 FAIL 0 | 0.06 | 0 | OK |
| g192_shoulder_side | PASS 29 FAIL 0 | 5.71 | 0 | OK |
| g193_budget_floor | PASS 22 FAIL 0 | 5.14 | **3** | OK — under-invocation signal, as above |
| g193_d50_trunkfloor | PASS 17 FAIL 0 | 2.61 | 0 | OK |
| g193_gear_gates | PASS 168 FAIL 0 | 6.83 | 0 | OK |
| g193_pool_overlay | PASS 219 FAIL 0 | 0.06 | 0 | OK |
| g193_rotation_reach | PASS 24 FAIL 0 | 0.28 | 0 | OK |
| g193_samecard | PASS 53 FAIL 0 | 7.24 | 0 | OK |
| g193_trunk_protect | PASS 38 FAIL 0 | 0.72 | 0 | OK |
| g194_implement_and_range | **PASS 17 FAIL 2** | 0.05 | 1 | OK — V196 gate vs V195 artifact |
| g195_wildcard | PASS 298 FAIL 0 | 0.60 | 0 | OK |
| g196_ledger | **PASS 22 FAIL 33** | 0.10 | 1 | OK — V196 gate vs V195 artifact |
| **total** | **1,079 PASS / 35 FAIL** | **34.92** | | 17/17 printed a summary |

The two red rows are the isolation proof for V196 (35 assertions that discriminate V195 from
V196), not a broken measurement: both printed a well-formed summary and a non-zero exit.
Cost is flat across the two artifacts — **34.92 s vs 35.23 s, +0.89%** — so gate cost is a
function of the lattice each gate builds, not of the version under test.

## STEP 4 — `tests/gate.sh` end to end

`bash -c 'set -eo pipefail; tests/gate.sh index.html /tmp/base_V195.html'` → **40.57 s**, exit 0,
`ALL GATES PASS`, 17/17 gates green, blast-radius diff 7 hunks +85/−29 vs V195.

## STEP 5 — `tests/sabotage.py` end to end

`python3 tests/sabotage.py index.html tests/sabotage/v196.json` → **1.14 s**, exit 0,
`tripped=10 survived=0 not_applied=0 crash=0 of 10`, plus the runner's standing
all-trip warning.

**The runner reports no per-mutation wall clock, and it was NOT modified to add one.**
0.114 s/mutation is the e2e total divided by 10 — an average, not a measurement. The average
is this low because all 10 of `v196.json`'s mutations name `g196_ledger.js`, one of the
cheapest gates in the suite at 0.10 s (6th of 17 by cost). Sabotage cost is a product of (mutation count × the
named gate's cost), not of mutation count alone; a spec of the same size naming
`g193_samecard` would arithmetically be ~74 s. That counterfactual was **not run**.

## STEP 6 — one fuzz lattice

`node tests/measure/v195_gk_identity_fuzz.js index.html index.html` — the lattice was read off
disk, not invented. Run self-identity (candidate == baseline == `index.html`), which is also
the "prove the baseline equals itself" step the real gatekeeper run performs first.

Lattice: 9 goal shapes × 6 equipment × 7 focuses × 3 experience × 3 pinned seeds
(1013 / 3039 / 76308) × 5 rest patterns × 2 age brackets.

- **34,020 configs**, 2,548,980 day-builds, 13,701,182 prescription keys compared
- baseline self-identity 54/54 cells; cfg purity 9/9 goal shapes
- violations: digest 0, grid 0, keyed 0, weeks 0, build-errors 0, pre 0 → `PASS 1 FAIL 0`
- **381.64 s real** (388.89 user / 3.77 sys — single-threaded, one core of eight)
- 11.22 ms per config (each config is 2 builds + 2 `progDigest` + 2 `weekGrid` + 2 `keyDump`),
  0.15 ms per day-build

Cross-check on the unit cost: the in-process probe in step 2b measured 9.40 ms for one
build + digest + grid on `HALF_MANNY`; the lattice's 11.22 ms per config covers twice that
work plus two key dumps, so the lattice is running ~2.4× faster per build than the fixture
probe — the fixture is a 14-week half-marathon program and much of the lattice is shorter.

## STEP 7 — deploy loop probes (read only, nothing pushed, no build triggered)

| probe | real_s | printed |
|---|---:|---|
| `gh api repos/bigyerr/TheBig6V2/pages/builds/latest --jq '.status, .commit'` | 0.51 | `built` / `3f5d792d40b503bcfe123ddd9fb9f98e3541f6d4` |
| cache-busted `curl https://bigyerr.github.io/TheBig6V2/?cb=$(date +%s)` | 0.11 | `content="196"` |

Both confirm the tree under measurement is the live one. Neither number includes the
`gh api -X POST .../pages/builds` force-and-poll path (~40 s per CLAUDE.md), which was
**not** exercised: this pass pushes nothing.

## Measurement hygiene

Every measured command ran as `/usr/bin/time -p bash -c 'set -eo pipefail; …'` with `;`
separators. No process substitution anywhere; temp files only. `/tmp/v197_timing` and the log
are deleted before regeneration. Each step records stdout byte count and marks
`NO-OUTPUT-FAILED-MEASUREMENT` when a step printed nothing to either stream —
**0 of 42 timed steps hit that state in this run**, and 0 steps returned a missing `real`.
Exit codes are recorded next to every step; 3 (budget-floor under-invocation) and 1
(V196 gates on a V195 artifact) are both recorded as successful measurements of a
non-zero exit, not as failures of the measurement.

---

## PART A — placeholder (not run in this pass)

To be filled once V197 starts. Part A instruments the real push; it is not mine to run now.

### A. Instrumented V197 push — raw log
_(to be supplied)_

### B. Computed table

```
step                 | attempts | total_sec | pct_of_push
---------------------+----------+-----------+------------
                     |          |           |
```

---

## Three sentences on what did not match expectation

The identity fuzz lattice is **90.02% of the 423.97 s verification chain** on its own, which
makes every other step in the chain — the whole 17-gate suite, the entire sabotage sweep, both
deploy probes — a rounding error against it, and it spends that time on one core of eight.
Gate cost turned out to be almost perfectly insensitive to which artifact is under test
(34.92 s on V195 vs 35.23 s on V196, +0.89%) while being extremely sensitive to which gate:
5 of 17 files carry 84.7% of the seconds. The sabotage sweep's 1.14 s is not a property of
the runner — all 10 `v196.json` mutations happen to name a 0.10 s gate, 6th cheapest of 17, so the cheapest step in the chain is cheap by coincidence of what V196 touched, and
`g193_budget_floor` quietly grades 9 fewer assertions when run without a baseline (PASS 22,
exit 3) than when `gate.sh` hands it one (PASS 31, exit 0). Coach's call on all of it.
