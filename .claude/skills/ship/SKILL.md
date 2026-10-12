---
name: ship
description: The full verification sequence for an Iron Asylum build candidate. Run by gatekeeper (or when Mario says "ship", "run the gates", "is v<version> green"). Ends with a GREEN/RED verdict and a named failure if red.
---
**PRIORITY 1 (Mario, Post-V239): semantic versioning.** Every version this skill reads, prints or writes is `MAJOR.MINOR.PATCH` with a lowercase v (`v0.240.0`), never a future `V<N>` or a bare integer. `V1` to `V239` are history and keep their names (V239 = 0.239.0). A future `V<N>` found anywhere is a defect: use the dotted form and report the correction. CLAUDE.md, PRIORITY 1, has the names.

**Sabotage is OFF (Mario, Post-v0.239.1).** Skip every sabotage step and the full-sweep check in this skill until Mario turns it back on.

Preconditions: builder has produced `index.html` at the new version, a baseline exists at `<scratch>/base_v<previous>.html` (`<scratch>` = the session scratch path, never bare `/tmp`; `git show HEAD:index.html > <scratch>/base_v<previous>.html` if not), the ruling is in its feature's decision file (`docs/decisions/<feature>.md`), and the feature's tests (`tests/unit/<feature>.test.js`, `tests/integration/<feature>.test.js`) hold every behaviour it changes. A new `tests/gates/g<version>_*.js`, `tests/sabotage/v<version>.json` or `tests/edits/` script is red (Mario, Post-v0.239.1).

**New work is proved as CLAUDE.md's Test layout and Proof for new work sections set out; CI is the gate.** Run these first, each as `bash -c 'set -eo pipefail; …'`. A red step ends the run.

A. `node tools/check.mjs` (60 s, hard) and `node --test tests/unit tests/integration`: every test passes.
B. Each new or changed test file against the previous release: `IA_APP=<scratch>/base_v<previous>.html node --test <file>`. Every test written for a changed behaviour fails there; one that passes on both is vacuous unless its file says it guards behaviour that must not change.
C. Every behaviour the ruling changes is matched to a named test. A changed behaviour with no test is red.
D. `git diff` on `index.html` and `tests/snapshots/`: every hunk classified against the ruling. A snapshot moves only when the ruling moves program output, and HALF_MANNY's new digest is the one coach printed.
E. CI on the push to `dev`: every job green, read with `gh run view` and `gh run download`.

**The frozen legacy suite (until phase 3).** Its CI jobs must pass on every build. **Which of the steps below a run includes for a change inside it, and over which gates and mutations, is set by the Proof scope section of CLAUDE.md, the single source for the legacy suite** (draft run or final run, LOCAL or CROSS-CUTTING, the dependency chain, the sabotage set). Where this file disagrees with it, CLAUDE.md wins.

**Where each step runs is set by CLAUDE.md's Pipeline section (Mario, Post-V239).** Locally only what finishes inside 60 seconds: `node tools/check.mjs`, plus any edited gate and its previous-version runs. The full `gate.sh` run, fuzz and the sabotage proof set run in GitHub Actions on every push to `dev`; read them with `gh run view` and `gh run download`, never rerun them locally. Mario opens the pull request into `main` himself, by hand; no agent ever opens one.

Run the included steps in this order, each as `bash -c 'set -eo pipefail; …'`. A red step ends the run.

1. `tests/gate.sh index.html <scratch>/base_v<previous>.html`, or the dependency chain for a LOCAL change. **On the draft run, set `ROW_MANIFEST_OUT=<scratch>/row_manifest.new` on that one invocation, and `ROW_RULED` only for a licence file written before Post-v0.239.1 (no new ones are made).** `tests/row_manifest.txt` is regenerated only from that output, so a draft run without `ROW_MANIFEST_OUT` has to be run again (V237 lost 10 minutes to the relaunch).
2. Each edited gate against the previous version too, as Proof scope's Previous version sets out: an edited gate against `<scratch>/base_v<previous>.html` as shipped, and an edited gate whose rows expect different results by version against that body relabelled to the candidate's `ia-version` (Mario, Post-V237). A row that passes on both where it claims to discriminate is vacuous; report it.
3. Sabotage, the set Proof scope names — all TRIPPED, 0 NOT-APPLIED, 0 CRASH.
4. Blast radius: read `temp/last_diff.txt`; classify every hunk. Unclassified = red. Unruled removal = red.
5. Differential lattice on the harness (seeded), keyed on (week, day, label, movement); 0 unclassified differences. If the ruling says "engine X only", the other engine's digest is byte-identical.
6. Fuzz: hundreds of random configs including injuries, travel overlays, every rest pattern, race dates; 0 violations against an independent oracle; baseline proven self-stable first.

Verdict block (mandatory, exact shape; a step the build did not need says `not run: <why>`):
```
TESTS    …   (pass / fail; previous release: changed-behaviour tests failing there; missing tests)
CI       …   (run id, sha, jobs green of jobs)
GATE     …
SABOTAGE …
BLAST    …
FUZZ     …
VERDICT  GREEN | RED — <what>
```
On GREEN the main session runs `handoff-update`, then stages the build's files by path (never `git add -A`: another session's untracked files stay out; Mario, Post-V238) and commits on the local `dev` branch in the main checkout (`git commit -m "v<version>: <title>"`), then pushes that branch only (`git push origin dev`; never from a worktree, never to `main`; CLAUDE.md Pipeline). The tag comes after Mario has merged his own pull request into `main` (`git fetch origin && git tag v<version> origin/main && git push origin v<version>`, CLAUDE.md Session rhythm step 6), then the deploy picture is printed (step 7).
On RED the build goes back to builder with the named test or gate. A test or gate is not edited unless its oracle is shown wrong on a specific line.
