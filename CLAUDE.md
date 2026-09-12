# Iron Asylum — standing rules for every agent in this repo

Read this before touching anything. The long-form record is `IRON_ASYLUM_HANDOFF_1_1.md`
(architecture §3–§8, workflow §9–§10, standing lessons §10b, rulings §11f, open items §12,
digest at the tail). This file is the short version that must never be violated.

## What this is
Single-file vanilla HTML/CSS/JS PWA (`index.html`, ~1.1 MB, one inline `<script>`) that
generates multi-week hybrid strength + cardio programs from a seeded, deterministic engine
(Engine A → B → C → D inside `buildProgram(cfg)`). Doctrine: NSW Physical Training Guide for
test goals (pace, mile, 1.5-mile, base) and Nike Run Club plans for race goals (5K/10K/half/
marathon). Deployed by GitHub Pages at https://bigyerr.github.io/TheBig6V2/ . iOS-only PWA.
Mario is the sole developer, product owner and primary user.

## Roles (four subagents, see .claude/agents/)
- **measure** — read-only. Owns the before-picture. Proves a reported bug at the reporter's seed, sweeps a lattice, names the root cause and every other reader of the same value. Reports numbers with denominators. Never rules, never proposes a fix.
- **coach** — read-only. Owns coaching correctness and doctrine. Rules on WHAT should ship.
- **builder** — read/write. Owns the edit. Writes anchor-asserted edit scripts. Never invents a ruling.
- **gatekeeper** — read + bash, never edits. Owns proof. Runs `tests/gate.sh`, sabotage, blast radius, fuzz.
**Gatekeeper blocks ship.** No version is done until gatekeeper reports ALL GATES PASS on the final
artifact, every sabotage TRIPPED with 0 NOT-APPLIED / 0 CRASH, and every diff hunk is classified.
The main session orchestrates and talks to Mario; it does not do measure's, builder's or gatekeeper's job inline.
**coach rules against evidence coach did not gather** — measure runs before the ruling, not inside it.
Builder is the only agent holding `Edit`/`Write`. coach, measure and gatekeeper are pinned to opus:
their output is judgement no gate can check (coach), or the judgement that a gate is lying (gatekeeper).

## Session rhythm (do not skip steps)
1. `session-start` skill: confirm `index.html`'s `ia-version`, confirm the handoff header and a digest line agree with it.
2. **Measure before designing.** `measure` runs the harness across the relevant configs and prints the before-picture (`node tests/harness.js index.html --grid`, or a purpose-built measure script in `tests/measure/`, kept as `v<N>_<question>.js`).
3. **Design before coding.** Coach issues a ruling (D-code) with coaching rationale and the before/after week grid. Mario concurs or pushes back. Coaching correctness overrides technical convenience.
4. Builder ships: anchor-asserted edits (every anchor `count==1` before writing), `ia-version` bumped by ONE, exactly when Mario says so.
5. Gatekeeper proves it: `tests/gate.sh index.html <baseline>` + `tests/sabotage.py` + fuzz. Green or a NAMED failing gate.
6. `handoff-update` skill: the seven-element session entry. Then `git add -A && git commit -m "V<N>: <one line>" && git push && git tag V<N> && git push --tags`.
7. **A push is not a deploy. "Push" means Mario's phone gets the new version, and it is not done until you have proved that.** Pages can report its last build as `built` with no error while sitting several commits behind — it silently did not fire on V192 or V193. So after pushing, confirm all three, in this order, and never infer a later one from an earlier one:
   - the remote has it: `git rev-parse main` == `git rev-parse origin/main`, and `git show origin/main:index.html | grep -oE 'content="[0-9]+"'` reads the new version (read it out of `origin/main`, not the working copy);
   - Pages built THAT commit: `gh api repos/bigyerr/TheBig6V2/pages/builds/latest --jq '.status, .commit'`. If the commit is stale, force it with `gh api -X POST repos/bigyerr/TheBig6V2/pages/builds` and poll until `built` (~40 s);
   - the live URL serves it: `curl -s "https://bigyerr.github.io/TheBig6V2/?cb=$(date +%s)" | grep -oE 'content="[0-9]+"'`. Cache-bust the query string; `cache-control` is `max-age=600`, so an unbusted fetch can lie for ten minutes.
   Only then is the version shipped. Tell Mario the live number you read back, not the number you pushed.

## Versioning (hard)
- `<meta name="ia-version" content="N">` is the ground truth. Bump by one per release, in build order, never out of order, never two sessions on one number. Mario owns the bump.
- In this repo the only HTML is `index.html` (Pages serves it). The previous build for blast-radius is `git show HEAD:index.html > /tmp/base.html`. Tag each release: `git tag V<N>`.
- A file version with no digest line in the handoff means a build was dropped. Stop and tell Mario.
- **Grep the file, never trust a label.** Filename, chat title, memory and handoff can all lag the artifact.

## Engineering invariants (from §10b — each one was paid for)
- Every gate run is `bash -c 'set -eo pipefail; …'` with `;` separators. `set -e` alone lets a pipe swallow node's exit code. Delete artifacts before regenerating them; an empty diff is a failure, not a clean result.
- No process substitution `<(...)` — use temp files.
- Oracles are independent: a gate never asserts the engine equals its own output. Hand tables, the doctrine text, date arithmetic.
- A gate must print `PASS n FAIL n`. Missing summary = crash = NOT a pass. A gate that crashes reports nothing, and nothing is not "no failures".
- Run every gate against the PREVIOUS version first. A gate that passes on both is not testing what it claims.
- Sabotage: every mutation must trip a NAMED gate. Anchor `count==1` or it is NOT-APPLIED. A no-op mutation is a mutation defect, not a gate defect — rewrite the mutation. All-trip is as suspicious as a survivor.
- Blast-radius diff: 100% of hunks classified into a ruled class before ship. A removal that was not ruled is a regression (a ruling that SELECTS is not a ruling that DELETES).
- Identity fuzz: pin `cfg.seed`, strip clock fields, prove baseline == itself before diffing anything.
- Any harness stub that accepts a callback must be able to run it. `requestAnimationFrame` that never fires deletes a code path from the gate.
- Rename passes: a map whose KEYS are old names is rewritten LAST, or excluded from the sweep. No alias row may self-map or chain.
- A conditional write with no else branch is a latch. Move claims onto the item they describe, never onto a section label that a later filter can falsify.
- Pool and post-filter must reason about a movement through the same lens; when one part of the build asserts something about a movement, grep for the other part that has to agree.
- Strip comments before any "is this token gone" scan.
- Prove a reported bug at the reporter's seed before touching anything.
- `let`/`const` at top level do not land on the VM context; test-injectable globals are `var`. `navigator` needs `defineProperty`.
- Python edit scripts use literal bytes (real em-dashes, real `×`), never escapes.

## Architecture invariants
- `prog.weeks` is a build artifact, not a record. `refreshProgram` rebuilds from `cfg + seed` on every boot and never reads `prog.weeks` back from storage. Anything that needs what the athlete actually saw reads `ia_hist_`.
- Week freeze is per-DAY. Injury overlays pierce untrained days only; trained days stay byte-identical.
- `exStoreKey()` / `EX_KEY_ALIAS` is the single writer of `ia_exw_` slug keys.
- `cfg` is never mutated by the engine; `buildProgram` is a pure function of `cfg`. Anything computed for one build (`cfg._racePin`) is deleted before the cfg is stored.
- NRC sessions are Nike-verbatim: session names and structures are a hard invariant; verify against `doctrine/*.txt` page by page before calling any NRC value a defect. No harness may assert taper monotonicity, volume ratios or rep ceilings on NRC-transcribed sessions.
- Race goals route to NRC; test goals stay NSW. An NRC run goal pins program length. Race day is found by SUBTYPE, never by position.
- Race alignment counts back from the race, not forward from today (`raceAlignment`).
- Zoom-locked viewport, `touch-action:manipulation`, no service worker: permanent.

## Coaching doctrine (rule-level, see §11f for reasoning)
- Prescription owns the fixed dimension; the log captures the free one; the third derives. Never ask for two when one is prescribed.
- Hard days hard: hinge / heavy lower pairs with speed days, not recovery runs. On NRC programs the long-run day and its eve are forbidden to pull/legs (`nrcLegLiftPlacement`, V189 D36).
- The run is the day: NRC long-run days tier by time on feet (≥75 min mobility only; 45–75 upper/trunk ≤8 sets no hinge no power; <45 normal). Carries banned on every long-run tier.
- Race week: primer only through three days out; no lifting from two days out, shakeout on the eve, nothing on race day (`raceEveLiftPass`, V189 D37/D38). Foot/ankle is dynamic mobility only.
- Injury overlays pierce at day level. Travel = maintain, not progress; bodyweight tier assumes no bands.
- Positional-strength lifts (paused, box) cap at 6 reps (`REP_AFFINITY`). Power block reps are a property of cost tier; rest derives from cost.
- Carries: Farmer / Suitcase / Overhead are three threads; one-hand carries always print a side.
- Supersets never cross fixed stations (`_stationClass`).
- Mario's coaching pushback can override a code-correct recommendation.

## Answering Mario (standing, applies to every agent and every topic)
**Every question, issue, risk or decision point put to Mario ships with a stated recommendation.**
Not a menu of options, not "your call" on its own: say what you would do and why, then the strongest
counter-argument, then let him choose. This holds for coaching rulings, engineering trade-offs, tooling,
git, scope and anything else. A decision surfaced without a recommendation is an incomplete answer.
Flag the ones that are genuinely his to make (publishing, irreversible actions, doctrine) as such —
and still recommend.

## Copy rule (Mario, standing)
No mid-sentence hyphens or em-dashes in anything the athlete reads. Short declarative sentences. The app sounds like a coach at every touchpoint. Spec separators inside a prescription (`4×5 — RPE 8`) are structural and exempt. No user-facing "Nike" strings.

## Token discipline
`index.html` is ~250K tokens. Never read it wholesale. `grep -n` the symbol and its consumers first, read wide at the seam, `str_replace` narrowly, let the gates be the backstop. Do not re-read the doctrine text mid-session unless verifying a transcription.

## Files
- `index.html` — the app. `IRON_ASYLUM_HANDOFF_1_1.md` — the record (stable name, overwrite in place, ONE digest line per version at the tail, never a narrative at the top).
- `THE_ASYLUM_DS_REFERENCE*.md` — design system (bone `#F4F1E8`, ink, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).
- `tests/harness.js` (VM boot + fixtures + `weekGrid` + `progDigest`), `tests/gate.sh` (runner), `tests/gates/*.js` (one file per gate family, each prints `PASS n FAIL n`), `tests/sabotage.py` + `tests/sabotage/*.json`, `tests/measure/` (measure-pass scripts, keep them), `tests/lint_allow.txt` (known dupes = debt).
- `doctrine/*.txt` — page-ordered OCR of the NSW guide and the four NRC plans. Gitignored (not published by Pages); regenerate from the archives with `doctrine/README.md` if missing.
