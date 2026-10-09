---
name: ship
description: The full verification sequence for an Iron Asylum build candidate. Run by gatekeeper (or when Mario says "ship", "run the gates", "is V<N> green"). Ends with a GREEN/RED verdict and a named failure if red.
---
Preconditions: builder has produced `index.html` at the new version, a baseline exists at `<scratch>/base_V<N-1>.html` (`<scratch>` = the session scratch path, never bare `/tmp`; `git show HEAD:index.html > <scratch>/base_V<N-1>.html` if not), and `tests/gates/g<N>_*.js` + `tests/sabotage/v<N>.json` exist for this build.

**Which of these steps a run includes, and over which gates and mutations, is set by the Proof scope section of CLAUDE.md, the single source** (draft run or final run, LOCAL or CROSS-CUTTING, the dependency chain, the sabotage set). Where this file disagrees with it, CLAUDE.md wins.

Run the included steps in this order, each as `bash -c 'set -eo pipefail; …'`. A red step ends the run.

1. `tests/gate.sh index.html <scratch>/base_V<N-1>.html`, or the dependency chain for a LOCAL change. **On the draft run, set both `ROW_RULED=tests/measure/v<N>_rulings/v<N>_row_ruled.txt` and `ROW_MANIFEST_OUT=<scratch>/row_manifest.new` on that one invocation.** `tests/row_manifest.txt` is regenerated only from that output, so a draft run without `ROW_MANIFEST_OUT` has to be run again (V237 lost 10 minutes to the relaunch).
2. Each new or edited gate against the previous version too, as Proof scope's Previous version sets out: an edited gate against `<scratch>/base_V<N-1>.html` as shipped; a new gate, and an edited gate whose rows expect different results by version, against that body relabelled to the candidate's `ia-version` (Mario, Post-V237). A row that passes on both where it claims to discriminate is vacuous; report it.
3. Sabotage, the set Proof scope names — all TRIPPED, 0 NOT-APPLIED, 0 CRASH.
4. Blast radius: read `.last_diff.txt`; classify every hunk. Unclassified = red. Unruled removal = red.
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
On GREEN the main session runs `handoff-update`, then `git add -A && git commit -m "V<N>: <title>" && git tag V<N> && git push --tags origin main`.
On RED the build goes back to builder with the named gate. The gate is not edited unless its oracle is shown wrong on a specific line.
