---
name: ship
description: The full verification sequence for an Iron Asylum build candidate. Run in the gatekeeper hat (or when Mario says "ship", "run the tests", "is v<version> green"). Ends with a GREEN/RED verdict and a named failure if red.
---
**PRIORITY 1 (Mario, Post-V239): semantic versioning.** Every version this skill reads, prints or writes is `MAJOR.MINOR.PATCH` with a lowercase v (`v0.240.0`), never a future `V<N>` or a bare integer. `V1` to `V239` are history and keep their names (V239 = 0.239.0). A future `V<N>` found anywhere is a defect: use the dotted form and report the correction. CLAUDE.md, PRIORITY 1, has the names.

Preconditions: builder has produced `index.html` at the new version, a baseline exists at `<scratch>/base_v<previous>.html` (`<scratch>` = the session scratch path, never bare `/tmp`; `git show HEAD:index.html > <scratch>/base_v<previous>.html` if not), the ruling is in its feature's decision file (`docs/decisions/<feature>.md`), and the feature's tests (`tests/unit/<feature>.test.ts`, `tests/integration/<feature>.test.ts`) hold every behaviour it changes.

**New work is proved as CLAUDE.md's Test layout and Proof for new work sections set out; CI is the gate.** Run these first, each as `bash -c 'set -eo pipefail; …'`. A red step ends the run.

A. `node tools/check.mjs` (60 s, hard) and `cd tests && npx vitest run unit integration && npm run typecheck`: every test passes and the type check is clean.
B. Each new or changed test file against the previous release: `cd tests && IA_APP=<scratch>/base_v<previous>.html npx vitest run <file>`. Every test written for a changed behaviour fails there; one that passes on both is vacuous unless its file says it guards behaviour that must not change.
C. Every behaviour the ruling changes is matched to a named test. A changed behaviour with no test is red.
D. `git diff` on `index.html` and `tests/snapshots/`: every hunk classified against the ruling. A snapshot moves only when the ruling moves program output, and HALF_MANNY's new digest is the one coach printed.
E. When the ruling moves program output, the lattice golden file (`tests/snapshots/program-output-lattice.json`) moved with it, and every moved digest's config tags fall inside the ruling's blast radius. If the ruling says "engine X only", the other engine's output is unchanged. The whole `tests/sweeps` folder ran green locally on the candidate before the release commit (Post-v0.250.0), and every sweep golden file that moved is in the commit, classified and named in the ruling's blast radius.
F. CI on the push to `dev`, read only when Mario asks (he reviews it himself; Post-v0.250.0): every job green (unit, integration and sweeps; app and backend; e2e), read with `gh run view` and `gh run download`, never rerun locally. Unread, the verdict's CI line says `not read: <why>`.

**Where each step runs is set by CLAUDE.md's Pipeline section.** Locally only what finishes inside 60 seconds, plus the previous-release runs of step B. Mario opens the pull request into `main` himself, by hand; no agent ever opens one.

Verdict block (mandatory, exact shape; a step the build did not need says `not run: <why>`):
```
TESTS    …   (pass / fail; previous release: changed-behaviour tests failing there; missing tests)
CI       …   (run id, sha, jobs green of jobs)
BLAST    …   (hunks, classes, unclassified)
LATTICE  …   (digests moved of 864, outside the ruled scope)
VERDICT  GREEN | RED — <what>
```
On GREEN the main session runs `handoff-update`, then stages the build's files by path (never `git add -A`: another session's untracked files stay out; Mario, Post-V238) and commits on the local `dev` branch in the main checkout (`git commit -m "v<version>: <title>"`), then pushes that branch only when Mario asks (`git push origin dev`; never from a worktree, never to `main`; CLAUDE.md Pipeline). The tag comes after Mario has merged his own pull request into `main` (`git fetch origin && git tag v<version> origin/main && git push origin v<version>`, CLAUDE.md Session rhythm step 6), then the deploy picture is printed (step 7).
On RED the build goes back to builder with the named test. A test is not edited unless its oracle is shown wrong on a specific line.
