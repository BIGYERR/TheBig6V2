# -*- coding: utf-8 -*-
# V202 handoff fold, part 2 of 2. DOCUMENTATION ONLY.
# Touches IRON_ASYLUM_HANDOFF_1_1.md (elements 2, 3, 4) and CLAUDE.md (element 2b, one bullet).
# Does not touch index.html, gates or sabotage specs.
import io, sys, os

ROOT = "/Users/CanasBangin/Desktop/TheBig6V2"
HANDOFF = os.path.join(ROOT, "IRON_ASYLUM_HANDOFF_1_1.md")
CLAUDE = os.path.join(ROOT, "CLAUDE.md")

def load(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()

def rep(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count==%d (need 1)\n" % (label, n))
        sys.exit(1)
    print("  ok  %-34s count==1" % label)
    return src.replace(old, new)

h = load(HANDOFF)
c = load(CLAUDE)

# ---------------------------------------------------------------- ELEMENT 2 / §5
A5 = "- **Re-entry is a halfstep, not a switch (D1, V142).**"
N5 = """- **The NSW pace clock anchors on the athlete's own chart row read at the GOAL distance (V202, D100/D111).** `rowPaceAt(row, miles)` walks the athlete's `PACE_CHART` row and returns the pace for the goal's distance: log-interpolated between the table's printed distances, guarded to a running maximum so an interpolated longer distance can never come back faster than a shorter one, and clamped at both table bounds. The clock walks from THAT pace. Reading the mile cell against a longer goal was a cross-distance comparison, not a conservative default, and it is what produced the goal-slower-than-anchor class; on Mario's own row the anchor moved **7:30 → 7:44/mi** once corrected. Walks are prescribed at one sourced rate rather than per-site guesses. Intervals are prescribed at `weekPace − 16 s/mi` with recovery as a **2-2.5× time band** (D112 hierarchy, §11f). This supersedes the mile-best anchoring the V116 bullet above describes for `run_pace_goal`; the chart is still keyed on mile best as a ROW, the READ inside the row is now the goal distance.

""" + A5
h = rep(h, A5, N5, "E2 §5 pace clock")

# ---------------------------------------------------------------- ELEMENT 2 / §8
A8 = "**Two distinct logging surfaces (don't conflate):**"
N8 = """**The per-day freeze reads all FOUR stores (V202, D108).** A day is touched if any of `ia_comp_`, `ia_logs_`, `ia_hist_` or `ia_exw_` holds a record for it, not just the first two. Before V202 a day whose only trace was a logged LOAD or a snapshot was still rebuildable, so the athlete's own numbers could stay attached to a card the next boot had already replaced. `ia_exw_` does not key by day — it keys by exercise name and carries per-entry timestamps — so the freeze derives each entry's day through the app's own `entryDay()` rather than re-parsing a timestamp at a second site, the same one-writer rule `exStoreKey()` enforces for the key itself (V113 below).

""" + A8
h = rep(h, A8, N8, "E2 §8 four-store freeze")

# ---------------------------------------------------------------- ELEMENT 2 / §4 (false invariant)
A4 = "- **The refresh is in-memory only** (assigned to `activeProg`, not written back via `savePrograms`), with **one exception**: the V100 seed backfill below persists `cfg.seed` once. **Consequence, and it bit hard in V104: `prog.weeks` in storage is the build from CREATION DAY with no overlays baked in, so it is NOT a record of what was prescribed** — anything that needs the real prescription must read `ia_hist_` (§6), never `prog.weeks`."
N4 = "- **⚠️ CORRECTED V202 (measured) — the grid is rebuilt on every boot AND persisted, and the persisted copy is the freeze source.** A prior revision of this doc, and the matching bullet in `CLAUDE.md`, asserted that `prog.weeks` \"is a build artifact, not a record\" and that `refreshProgram` \"never reads it back from storage\". **Both are false.** `ia_programs` persists the whole grid — **58,478 bytes for one 11-week program** — and `refreshProgram` reads it back at `:14516`/`:14601`. That read is load-bearing, not vestigial: with the stored grid removed, **9 of 9** logged run sessions flip from \"on target\" to **1:02-1:25/mi slower than target**, because the freeze loses what it restores from. The refresh is still computed in memory first (assigned to `activeProg`), and the V100 seed backfill below still persists `cfg.seed` once. **What survives of the old warning is narrower than it was written: the creation-day rows inside the stored grid carry no overlays, so anything that needs the day the athlete actually SAW reads `ia_hist_` (§6).** The stored grid is the freeze's carrier; `ia_hist_` is the record of the render. Every record in every store keys `w<N>_<day>` — ordinal, **no ISO date anywhere** — which is why an in-place rebuild stays safe."
h = rep(h, A4, N4, "E2 §4 false invariant")

# ---------------------------------------------------------------- ELEMENT 3 / §10b
A10 = "\n## 11. Resolved bugs"
N10 = """- **A rule whose limb fires on 0 of N is a gate that cannot trip (V202).** D105's interval sequencing was built exactly as ruled, then measured: **0 of 54** blocks had an INT week after the first 8-rep week, because the ramp lands 8 on the LAST interval week by construction. There was no configuration in which the new limb could fire, so the pin it came with defended nothing. Coach reverted rather than ship it. **Revert while it is cheap — before gatekeeper, not after** — and measure the limb's own firing rate, not just the outcome grid, before ruling it done.
- **A digest quoted in a brief is not a pin unless its cfg is recorded (V202).** Four \"must not move\" digests were carried all session and proved **unreproducible**: `progDigest` is a function of a cfg, and no cfg for any of the four existed anywhere in the tree or the log. They were unverifiable from birth and would have read as green forever. **A reproducible lattice script in `tests/measure/` beats four hexes in a chat log**; a hex with no cfg beside it is decoration.
- **A suite pinned only at the ends misses the middle (V202).** The cutback mutation left `g202_pace_anchor` at **33 PASS / 0 FAIL** — its pinned cards are weeks 1 and 6, and neither is a cutback week — while only `g202_int_doctrine`'s lattice row caught it by name. End-pinned suites ship the middle of the block untested; pin at least one card from every week CLASS the ruling creates.
- **A revert must be byte-identical or it is a new edit (V202).** Proved three ways rather than asserted: an md5 over the restored region (`4055817671ba16da1a992d9c457d4906`) matching the pre-edit region, a grep for every residue symbol the reverted code introduced, and a blast radius showing **no hunk at all** in that region. A revert that shows a hunk is an edit nobody ruled.
- **A sabotage spec with duplicate labels cannot be selected by name (V202).** `tests/sabotage/v202.json` reused `M8..M13` twice; builder's own single-mutation verification run silently mutated the wrong entry and reported on it. **Labels are unique or the sweep is lying about what it tested** — and the sweep cannot tell you, because selection by name resolves to whichever duplicate it reaches first.
- **When two doctrine sources exist, the seam between them must be mechanical (V202).** D112's test is \"is A silent on this\" — a grep against the transcription, not a judgement call at the call site. A blend with two authorities and no rule for choosing between them is exactly how the artifact ended up capping intervals at 8 reps while its own copy told the athlete 10.
- **`tests/gate.sh` grades on the summary line and never reads a gate's exit code (V202, tooling).** `g193_budget_floor` exits **3**, meaning \"deferred claims, not a full pass\", and is graded green. The runner cannot distinguish \"every row ran and passed\" from \"some rows declined to run\". **A non-zero exit is a crash, and a crash is not a pass, whatever the summary says.** Queued for a tests-only pass (§12).
""" + A10
h = rep(h, A10, N10, "E3 §10b seven bullets")

# ---------------------------------------------------------------- ELEMENT 4 / §11f
A11 = "## 11f. Standing decisions — do not re-derive\n### V201 — D94,"
N11 = """## 11f. Standing decisions — do not re-derive
### V202 — D100/D104/D112, the pace clock re-anchors and a SECOND Physical Training Guide is adopted (Mario: "the table is doctrine aint it?", "youre gonna have to explain that one to me", "7:44")
- **BOTH NSW GUIDES ARE DOCTRINE, AND THE NEWER TABLES GOVERN SHAPE (D112).** Mario asked for coach's perspective rather than deciding alone, and then kept both editions. He specifically rated the 22-page edition's STRUCTURE: its tables hold volume constant and vary the SHAPE of the work — week 21 = `8×400`, week 22 = `400/400/800/800/400/400`, week 25 = `4×800` — where the engine only ever ramped rep count. The seam rule is mechanical, not editorial: where the older guide is silent, the newer one governs (§10b).
- **B'S NUMBERS SHIP NOW, A'S LADDERS QUEUE — ON A MEASURED FACT, NOT ON DOCTRINE (D112-q).** A is **unrenderable** in the current dose contract: **17 of 26** p13 rows and **15 of 26** p16 rows are mixed ladders, and `_dose` carries ONE rep length. Recorded here so a future session does not read the artifact as an A-over-B reversal and try to "restore" A. Reopen it by changing the dose contract, not by re-arguing the sources.
- **7:44/mi IS THE CONFIRMED ANCHOR (D100).** It replaces the 7:30/mi he had already been told, after coach corrected the anchor from his MILE pace to his own chart row read at the GOAL distance. The earlier number was not a rounding difference; it was a cross-distance comparison.
- **HARD DAYS HARD EXTENDS TO NSW — MARIO OVERRULED COACH (D104).** Coach first picked B's "no lower-body lifting on a run day". Mario pushed back: *"we have doctrine that says hard days can be hard and lifting and running in the same day should not be a red light, youre gonna have to explain that one to me."* Coach then **withdrew its own pick**, conceding the argument had been "a precedence claim dressed as coaching", and ruled for hard-days-hard. The decisive evidence is in B's own text: its separation rule sits in a paragraph whose stated best form is **two-a-days** ("lifting and core work in the morning and running or swimming in the evening"), a premise that does not hold for a five-day, once-a-day athlete; and B's own definition of LSD as "relative recovery between more intense sessions" is SPENT by putting heavy lower work on the recovery day.
- **D113 AND D114 ARE CONFORMANCE, NOT PREFERENCE — AND SHOULD NEVER HAVE REACHED HIM.** He rejected the framing: *"the table is doctrine aint it? dont we have a whole logic engine and doctrine to answer this"* — and was right. Once D112 is adopted, both are conformance to a governing table. Recorded because the error was in WHAT REACHED HIM, not in what he decided: the filter on his attention is part of the doctrine.
- **RECOMMENDATIONS HE REJECTED (keep them; a rejected recommendation is evidence).** The orchestrator's opening "A is the doctrine anchor, the 11-page guide adds nothing" (refuted by his own upload); coach's first D104 pick (withdrawn by coach itself); and the orchestrator's suggestion that the goal-slower-than-anchor class might be correct as-is — coach ruled it a cross-distance comparison error instead.
### V201 — D94,"""
h = rep(h, A11, N11, "E4 §11f V202 entry")

# ---------------------------------------------------------------- ELEMENT 2b / CLAUDE.md, ONE bullet
AC = "- `prog.weeks` is a build artifact, not a record. `refreshProgram` rebuilds from `cfg + seed` on every boot and never reads `prog.weeks` back from storage. Anything that needs what the athlete actually saw reads `ia_hist_`."
NC = "- `prog.weeks` is rebuilt from `cfg + seed` on every boot AND persisted: `ia_programs` carries the whole grid (58,478 bytes for one 11-week program) and `refreshProgram` reads it back, load-bearing — strip the stored grid and 9 of 9 logged run sessions flip off target (measured V202). The persisted grid is the freeze's source; it holds no overlays, so anything that needs what the athlete actually SAW still reads `ia_hist_`."
c = rep(c, AC, NC, "E2b CLAUDE.md invariant")

with io.open(HANDOFF, "w", encoding="utf-8") as f:
    f.write(h)
with io.open(CLAUDE, "w", encoding="utf-8") as f:
    f.write(c)
print("WROTE %s" % HANDOFF)
print("WROTE %s" % CLAUDE)
