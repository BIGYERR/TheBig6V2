---
name: ship
description: The full verification sequence for an Iron Asylum build candidate. Run by gatekeeper (or when Mario says "ship", "run the gates", "is V<N> green"). Ends with a GREEN/RED verdict and a named failure if red.
---
Preconditions: builder has produced `index.html` at the new version, a baseline exists at `/tmp/base_V<N-1>.html` (`git show HEAD:index.html > /tmp/base_V<N-1>.html` if not), and `tests/gates/g<N>_*.js` + `tests/sabotage/v<N>.json` exist for this build.

Run, in this order, each as `bash -c 'set -eo pipefail; …'`. Stop at the first red.

1. `tests/gate.sh index.html /tmp/base_V<N-1>.html`
2. Each new gate against the BASELINE too: `node tests/gates/g<N>_*.js /tmp/base_V<N-1>.html` — expected to FAIL on the baseline (it proves the change). A gate green on both is vacuous; report it.
3. `python3 tests/sabotage.py index.html tests/sabotage/v<N>.json` — all TRIPPED, 0 NOT-APPLIED, 0 CRASH.
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
