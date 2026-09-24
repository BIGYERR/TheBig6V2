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
Builder is the only agent holding `Edit`/`Write`. coach, measure and gatekeeper never run below opus:
their output is judgement no gate can check (coach), or the judgement that a gate is lying (gatekeeper).
Coach runs on fable from V200 as a measured experiment; compare its rulings against V198 and V199
(retractions, reds, and whether measure refutes a premise) before deciding whether it stays.
**Coach is spawned fresh for each ruling, with a tight brief:** the question, measure's numbers, and the handoff lines
it needs, nothing else. Never resume a coach (`SendMessage`) after it has gone idle. A follow-up or a re-ruling is a
new spawn whose brief carries the prior ruling's text.

## Session rhythm (do not skip steps)
**One build per chat.** Each version starts in a fresh chat. A chat never carries past one build, and never past a
compaction: if it compacts mid-build, stop at the next safe point (a builder slice either landed whole or stays parked
in `tests/edits/`; nothing is committed that gatekeeper has not proved), tell Mario where the build stands, and
continue in a fresh chat.
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

## Standing rulings (settled — do not re-ask, do not re-derive)
Each of these was paid for in a session. They are not open questions, and no agent reopens one
without new evidence that contradicts the ruling itself.

1. **A tests-only pass is not a version.** `ia-version` does not move, so nothing shipped: commit as
   `tests: Post-V<N> tooling pass`, cut **no tag** (tags track `ia-version`; a tag on an unmoved artifact
   points at a lie), run **no deploy proof** (rhythm step 7 does not apply — nothing reaches the phone),
   and give it a digest line named for what it was, `- **Post-V<N> … — no build.**`, **never a V-number**.
2. **A licence is a predicate, never prose.** An assertion pinning a direction a ruling has already found
   wrong carries a real predicate keyed on `ia-version` that REFUSES above its era and blocks `gate.sh`.
   A comment telling a future reader "a trip here is expected after D<N>" expires never and trips never.
   Key it on a number that exists today, never on the version an unbuilt ruling will ship on.
3. **A declared constant nothing reads gets its assertion wired, not deleted** — unless the claim itself
   is unruled, in which case the constant goes. A dead pin looks maintained and defends nothing, and
   **re-pointing one is worse than either**: it makes a vacuous line look freshly maintained. Before
   repointing any pin, `grep -c` the symbol and require more than the declaration.
4. **Gate and spec files are keyed to the RULING they defend, not the version being built.** A gate's
   premise is scoped to its own build and its predicate must say so. An assertion that means "MY build
   changed nothing" with no version predicate will fire on somebody else's build and read as a regression.
5. **`HALF_MANNY` moves only by ruling.** The new digest is printed by coach from a source-surgery copy
   **before** the build, recorded as an era-table row (`MANNY_DIGEST_BY_VERSION`) anchored to a
   counterfactual digest, and **every changed card is printed before and after**. Row existence is a
   conjunct so an absent row fails loudly. A digest read off the built artifact after the fact is never a pin.
6. **Any builder brief over four edits is sliced before dispatch.** The cap binds the brief I write, not
   just the agent. A long brief invites a long silent phase before the first tool call, and that is what
   the watchdog kills.
7. **When measure refutes a ruling's premise, it goes back to coach before builder — always.** A premise
   that did not survive the measure is a hypothesis, not a ruling, and building on it ships the wrong
   thing twice. Coach may retract; that is the system working, not a failure. **If the refutation lands
   mid-slice, builder PARKS the slice** — leaves it in the scratchpad, commits nothing, hands nothing to
   gatekeeper — coach re-rules, and the parked slice is resumed as-is if the re-ruling leaves it intact,
   or discarded if it does not. Finishing a slice against a refuted premise is never the cheaper path,
   because gatekeeper would prove it against a ruling that no longer exists.

**Mario is asked only for doctrine calls:** which pattern or quality survives, ship or hold, and anything
that changes his own program. Siting, form, gate scope, agent order and tooling shape are the session's to
decide and to record. This narrows WHAT reaches him; it does not soften the rule below that everything
which does reach him arrives with a recommendation.

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
- `prog.weeks` is rebuilt from `cfg + seed` on every boot AND persisted: `ia_programs` carries the whole grid (58,478 bytes for one 11-week program) and `refreshProgram` reads it back, load-bearing — strip the stored grid and 9 of 9 logged run sessions flip off target (measured V202). The persisted grid is the freeze's source; it holds no overlays, so anything that needs what the athlete actually SAW still reads `ia_hist_`.
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
**The orchestrator does not run commands longer than a minute in the main session; delegate them.** **coach and measure already have CLAUDE.md in context; do not `Read` it. builder and gatekeeper run with `omitClaudeMd: true`: they never see this file, so every brief to them carries what they need (Delegation carry, below).**
`index.html` is ~250K tokens. Never read it wholesale. `grep -n` the symbol and its consumers first, read wide at the seam, `str_replace` narrowly, let the gates be the backstop. Do not re-read the doctrine text mid-session unless verifying a transcription.

## Delegation carry (builder and gatekeeper do not load this file)
Every brief to either carries the per-build items, then the standing lines for that role, pasted, not paraphrased.
- **Builder, per build:** the ruling verbatim (D-code, what changes, what deliberately does not, the after-grid); the slice
  (≤4 edits) and what earlier slices landed; the baseline path; whether this slice bumps `ia-version` and to what; the
  diff classes the ruling licenses.
- **Gatekeeper, per build:** every ruling in the build, verbatim; the version Mario named; the baseline path; the edit
  scripts, gates and sabotage specs; the diff classes builder declared; whether `HALF_MANNY` may move and to what digest.
- **Both, standing:** gate runs are `bash -c 'set -eo pipefail; …'`, no `<(...)`; every gate prints `PASS n FAIL n` and a
  missing summary is a crash; oracles never ask the engine; strip comments before any token-gone scan; pin `cfg.seed`,
  strip clock fields and prove a baseline equals itself before diffing; an empty diff is a failure. Standing rulings 2
  (a licence is a predicate on today's `ia-version`), 3 (wire a dead pin, never re-point it), 4 (a gate is keyed to the
  ruling it defends) and 5 (`HALF_MANNY` moves only by a ruling that printed the digest first). NRC sessions are
  verbatim; no harness asserts taper, volume or rep shape on them.
- **Builder, standing:** standing ruling 7 (a premise refuted mid-slice PARKS the slice: script stays in `tests/edits/`,
  nothing committed); pool and post-filter reason through one lens, so grep the other half; a conditional write with no
  else is a latch; `exStoreKey` is the only `ia_exw_` writer; race day is found by subtype.
- **Gatekeeper, standing:** run every gate against the previous version too; a sabotage anchor that is not `count==1`
  is NOT-APPLIED and a no-op mutation is a mutation defect; all-trip is as suspicious as a survivor; 100% of blast-radius
  hunks are classified, and an unruled removal is a regression.

## Files
- `index.html` — the app. `IRON_ASYLUM_HANDOFF_1_1.md` — the record (stable name, overwrite in place, ONE digest line per version at the tail, never a narrative at the top).
- `THE_ASYLUM_DS_REFERENCE*.md` — design system (bone `#F4F1E8`, ink, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).
- `tests/harness.js` (VM boot + fixtures + `weekGrid` + `progDigest`), `tests/gate.sh` (runner), `tests/gates/*.js` (one file per gate family, each prints `PASS n FAIL n`), `tests/sabotage.py` + `tests/sabotage/*.json`, `tests/measure/` (measure-pass scripts, keep them), `tests/lint_allow.txt` (known dupes = debt).
- `doctrine/*.txt` — page-ordered OCR of the NSW guide and the four NRC plans. Gitignored (not published by Pages); regenerate from the archives with `doctrine/README.md` if missing.
