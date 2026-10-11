---
name: ship
description: The full verification sequence for an Iron Asylum build candidate. Run by gatekeeper (or when Mario says "ship", "run the gates", "is v<version> green"). Ends with a GREEN/RED verdict and a named failure if red.
---
Preconditions: builder has produced `index.html` at the new version, a baseline exists at `<scratch>/base_v<previous>.html` (`<scratch>` = the session scratch path, never bare `/tmp`; `git show HEAD:index.html > <scratch>/base_v<previous>.html` if not), and `tests/gates/g<version>_*.js` + `tests/sabotage/v<version>.json` exist for this build.

**Which of these steps a run includes, and over which gates and mutations, is set by the Proof scope section of CLAUDE.md, the single source** (draft run or final run, LOCAL or CROSS-CUTTING, the dependency chain, the sabotage set). Where this file disagrees with it, CLAUDE.md wins.

**Where each step runs is set by CLAUDE.md's Pipeline section (Mario, Post-V239).** Locally only what finishes inside 60 seconds: `node tools/check.mjs`, plus the build's new and edited gates and their previous-version runs. The full `gate.sh` run, fuzz and the sabotage proof set run in GitHub Actions on every push to `dev`; read them with `gh run view` and `gh run download`, never rerun them locally. Mario opens the pull request into `main` himself, by hand; no agent ever opens one.

Run the included steps in this order, each as `bash -c 'set -eo pipefail; …'`. A red step ends the run.

1. `tests/gate.sh index.html <scratch>/base_v<previous>.html`, or the dependency chain for a LOCAL change. **On the draft run, set both `ROW_RULED=tests/measure/v<version>_rulings/v<version>_row_ruled.txt` and `ROW_MANIFEST_OUT=<scratch>/row_manifest.new` on that one invocation.** `tests/row_manifest.txt` is regenerated only from that output, so a draft run without `ROW_MANIFEST_OUT` has to be run again (V237 lost 10 minutes to the relaunch).
2. Each new or edited gate against the previous version too, as Proof scope's Previous version sets out: an edited gate against `<scratch>/base_v<previous>.html` as shipped; a new gate, and an edited gate whose rows expect different results by version, against that body relabelled to the candidate's `ia-version` (Mario, Post-V237). A row that passes on both where it claims to discriminate is vacuous; report it.
3. Sabotage, the set Proof scope names — all TRIPPED, 0 NOT-APPLIED, 0 CRASH.
4. Blast radius: read `temp/last_diff.txt`; classify every hunk. Unclassified = red. Unruled removal = red.
5. Differential lattice on the harness (seeded), keyed on (week, day, label, movement); 0 unclassified differences. If the ruling says "engine X only", the other engine's digest is byte-identical.
6. Fuzz: hundreds of random configs including injuries, travel overlays, every rest pattern, race dates; 0 violations against an independent oracle; baseline proven self-stable first.

Verdict block (mandatory, exact shape):
```
GATE     …
SABOTAGE …
BLAST    …
FUZZ     …
VERDICT  GREEN | RED — <what>
```
On GREEN the main session runs `handoff-update`, then stages the build's files by path (never `git add -A`: another session's untracked files stay out; Mario, Post-V238) and commits on the local `dev` branch in the main checkout (`git commit -m "v<version>: <title>"`), then pushes that branch only (`git push origin dev`; never from a worktree, never to `main`; CLAUDE.md Pipeline). The tag comes after Mario has merged his own pull request into `main` (`git fetch origin && git tag v<version> origin/main && git push origin v<version>`, CLAUDE.md Session rhythm step 6), then the deploy picture is printed (step 7).
On RED the build goes back to builder with the named gate. The gate is not edited unless its oracle is shown wrong on a specific line.
