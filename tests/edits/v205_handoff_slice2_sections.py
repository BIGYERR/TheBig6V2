#!/usr/bin/env python3
# V205 handoff fold, slice 2: element 1 narrative line + element 2 (numbered sections,
# INT half of Table 6, the bike INT fork, and D132's walk-week arm on the ceiling).
import io

P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")

def idx(prefix):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, "anchor count %d for %r" % (len(hits), prefix[:70])
    return hits[0]

def repl_line(prefix, new):
    lines[idx(prefix)] = new

def insert_after(prefix, new_lines):
    i = idx(prefix)
    lines[i + 1:i + 1] = new_lines

# --- ELEMENT 1, narrative ----------------------------------------------------
RECENT = (
"- **Most recent work (V205): the pace goal's week, and the calendar Mario refused to let us fix just for him.** "
"The thread opened on Mario's own question, *\"can we add the fourth run day in the queue\"*, and on his challenge to the week we had "
"proposed to him. Several things had to be true at once and the **ORDER** was the hard part. "
"**D127 shipped first**: `deconflictLegLiftDays` degraded on a 4-run, 5-training-day week to a fallback that put **squats and calves on "
"the long-run eve and a deadlift the day before the intervals**, because D36's NRC long-run protection had never been extended to the NSW "
"pace family. `_nrcRunShape` grew a **second arm keyed on `legLoad`**, because the NSW path prints the same subtype string "
"(`Long Slow Distance (LSD)`) for BOTH its easy runs and the flag is the only thing that separates the long one from the easy one. "
"**1,980/6,336 → 0** long-run-eve hits. Shipping the fourth-run ceiling first would have MANUFACTURED **495/2,079** of them at five "
"days, which is why the order is part of the ruling and not a convenience. "
"**D125 amended** then made the fourth run conditional on `_nrcSpacedRunDays`'s **full objective** rather than the collision-only variant "
"coach first named and then withdrew, relaxed the long run from a pin to a preference, and moved the ceiling **3 → 4**. "
"**D129, its addendum and its final wording** wrote the remaining preferences out as RANKS — **6 identity, 7 spread, 8 rest into the "
"long run, 9 earliest first quality** — each with a coaching reason, all gated to the pace family; `recBeforeLong`'s Sunday-first lens "
"was corrected **for the pace family only**, and **NRC keeps the shipped predicate** because the correction moves **182/804** chooser rows "
"and **54/112** built programs, which is a doctrine change needing its own ruling (§12). "
"**D130 and its amendment** is the ruling Mario's refusal produced: he would not take a fix validated on his own Sunday/Wednesday calendar "
"(*\"i wanna make sure that fixes that and not JUST my sunday wednesday off day\"*), so the deliverable became the **general table over all "
"64 rest-day calendars**. That table forced the **typed split**: at four training days a CHI on the long-run eve is unavoidable on **14 of "
"64** calendars, so rank 1 became **-untolerated, then -tolerated**, with the untolerated class at an absolute **0** and the tolerated class "
"recorded as a **FLOOR the chooser must reach**, not a target it may miss. `-coll` left the key entirely: one total that mixes a tolerated "
"pair with an untolerated one cannot rank them. Measured after: untolerated **0/6,336**, tolerated **1,386/6,336** = exactly **14 calendars "
"× 9 seeds × 11 weeks**, **zero on the other 50**. "
"**D128** was the doctrine half: the CHI ladder had been an unsourced V115 hand ramp topping out at **3 × 20 = 60 min**, and Guide B's "
"**Table 6** is the only ramp either guide states in full. Reading the table at `min(week, 26)` **is** its \">26 do not increase\" row, so "
"the `isMilGoal && week > 26` limb was deleted rather than re-pointed. Mario's block loses **90 minutes** of threshold work (**179 → 89**, "
"W11 **60 → 20**). Bike forked off byte-identical because **no guide covers cycling**; swim took the **rep tier only**, because it is "
"prescribed in yards and a minutes column would prescribe a second dimension. "
"**D114's INT half, with D135 and D136, closed a regression this build had just caused**: once D125/D130 made INT weekly, the V115 "
"position-based ramp spread **4 → 8** across eleven weeks and the athlete topped out at **seven** repeats, never reaching the eight "
"Guide A tells him to build to. Table 6's INT column now drives it, **A's cap of 8 binding over B's Table 7 ten**, the column stored **raw** "
"with the clamp visible in the reader, and the bike forked off on its own hand ramp. Mario's call on that was doctrine, not scope: "
"*\"fix it\"* — **a regression this build caused is a different thing from capability it merely lacks.** "
"**D132** held the ceiling at 3 for the walk week: a `noimpact`/`noimpact_swim` solo-run program has every run rewritten to an incline walk, "
"so it has no SI, no LI and no long run, and D125's four-session argument does not reach it. "
"**D122's pin shape** was the suite half: `g202`'s D7 quantity is a **RULE with two arms, not a scalar**. A scalar 11 transcribed from the "
"failure message would have passed on the gate's own config and been **false on 2,232 of 3,240** pace builds. "
"**What did NOT ship:** **D113** and **D122's crossover retirement** (slice 7c, parked by Mario — measure found D113's three-hard-run "
"week ships an untolerated adjacency on **2,070/13,248** weeks, **all of it multi-sport**, because multi-sport never enters the solo chooser "
"and so received neither the typed split nor the relaxed pin); **D131**, withdrawn as unreachable; and **D137**, ruled and queued as V206's "
"first slice. **Every retraction is recorded in §11f and that is the most useful part of this entry.** §10b, §11f, §12."
)
repl_line("- **Most recent work (V205): the pace goal's week,", RECENT)

# --- ELEMENT 2: the INT half of Table 6 -------------------------------------
INT_BULLETS = [
"- **INT repeats come from Guide B Table 6 too, capped by Guide A (V205, D114's INT half + D135 + D136).** `NSW_TABLE6_INT` (`:3427`) is the "
"26-row **INT column transcribed RAW** — it carries B's 9s and 10s as written — and `intFromTable6(week)` (`:3442`) is its only "
"reader, returning a plain rep COUNT (INT prescribes a number of repeats, so unlike `chiFromTable6` there is no object to hand back and "
"nothing a caller could mutate). **Two clamps, both doctrine, both visible in the reader and not in the data:** `Math.min(week, 26)` IS "
"Table 6's \">26\" row, and `Math.min(8, row)` is **Guide A's ceiling of 8 binding over Guide B's Table 7 ten** (D136). Storing the column "
"raw and clamping in the reader is deliberate: the transcription stays checkable against the page, and the ruling that A outranks B stays "
"legible as a ruling rather than being baked invisibly into the numbers. The athlete reaches **8 in week 9 and holds it**. "
"**This fixed a regression V205 itself caused**: the V115 position-based build spread 4 → 8 across `_span`, and once D125/D130 made the "
"INT slot **weekly** across an 11-week block the final rung landed on the taper week, topping the athlete out at **seven**. The old "
"`isMilGoal && week > 26` limb in `getINTReps` returned a hardcoded 8 and was **already unreachable** (`calcProgramLength` caps "
"`run_pace_goal` at `Math.min(26, ...)`), so it was deleted, not re-pointed — and an unreachable limb is not value-identical to its "
"replacement, it is unreachable (§10b). The cutback branch is unchanged: volume steps back ~40% off the prior build week, floor 3, "
"**pace held** — fewer reps at the same target is the cutback prescription, and a rep or pace PR in a recovery week is a planning error.",
"- **The INT reader is forked BY CALLER, exactly as CHI is (V205, D135).** `getINTReps` is the run reader; **`getINTBike`** (`:3508`) is the "
"V115 INT hand ramp carried over unchanged, and `buildCardioSession`'s bike caller reads `getINTBike`/`getCHIBike` as a pair (`:4501-4502`). "
"The reason is the same one that forked CHI: **Table 6 is titled Run/Swim and neither guide covers cycling**, so prescribing its repeats on a "
"bike would be an invention rather than a transcription. When cycling is ruled on, `getINTBike` and `getCHIBike` are replaced **together**, "
"and neither replacement touches the table or the run path. The open size of that gap is recorded in §12.",
]
insert_after("- **The CHI reader is forked BY CALLER, not by a flag (V205, D128).**", INT_BULLETS)

# --- ELEMENT 2: D132's walk-week arm on the ceiling -------------------------
CEIL = (
"- **The fourth run is CONDITIONAL: multi-sport holds at 3, and so does the walk week (V205, D125 amended + D132).** "
"`const _walkOnly = (cardioMode === 'noimpact' || cardioMode === 'noimpact_swim');` then "
"`const _ceil = (PACE_GOALS.has(goalId) && (cardioTypes.length !== 1 || _walkOnly)) ? Math.min(ceiling, 3) : ceiling;` — the pace family "
"gets its fourth run only on a **solo cardio week that is still running**. "
"**The multi-sport arm (D125 amended):** a multi-sport week never reaches the spacing chooser, so there is no collision-free layout to key on "
"and the ruling's own fallback applies. **Both callers read this** (the wizard nudge and the engine), so the nudge cannot promise a fourth run "
"the engine will not deal. Bike and swim are untouched on both paths. "
"**The walk-week arm (D132):** on a `noimpact`/`noimpact_swim` week with no bike or swim to fall back on, the sweep rewrites **every run to a "
"pain-free incline walk** — no SI, no LI, no long run, no shape to protect — so D125's four-session argument does not reach it and a "
"fourth walk is not that week. **The two arms are keyed differently on purpose:** the ceiling is read **BEFORE the sweep runs**, so "
"\"speedless\" is not knowable at the decision point and `cardioMode` is; with a bike or swim present the sweep reroutes rather than walks, and "
"such a week is multi-sport and already held by the clause beside it. `g205_d132_walkweek` therefore asserts the property of the **WEEK** "
"rather than mirroring this line, so a future divergence between cause and effect fails by name instead of shipping quietly. "
"This is the ruled shape, not a limitation to be quietly widened (§12)."
)
repl_line("- **The fourth run is CONDITIONAL, and multi-sport holds at 3 (V205, D125 amended).**", CEIL)

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice2 OK")
