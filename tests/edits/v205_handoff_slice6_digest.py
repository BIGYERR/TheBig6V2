#!/usr/bin/env python3
# V205 handoff fold, slice 6: element 6 (the ONE digest line) + the D122 row, which now
# records that D122's PIN SHAPE shipped while its crossover retirement stayed parked.
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

# --- D122's row: the pin shape shipped, the crossover retirement did not ----
D122 = (
"- **D122 — BOTH NSW QUALITY SESSIONS RUN EVERY WEEK FROM WEEK 1 (coach, V204; PIN SHAPE BUILT AT V205, CROSSOVER RETIREMENT PARKED "
"WITH D113).** The **INT-then-CHI crossover is an NRC idea that leaked onto the NSW path**; neither guide states it. **The retirement is "
"parked by Mario's ruling at V205** for the same multi-sport root cause as D113 (2,070/13,248 weeks would ship an untolerated adjacency; see "
"the parking entry above). **What DID ship is the suite half, and its shape was the lesson:** `g202_int_doctrine`'s D7 pin was asserting "
"retired doctrine, and the quantity it needed turned out to be **a RULE with two arms, not a scalar** — a scalar **11** transcribed from "
"the gate's own failure message would have passed on the gate's own config and been **false on 2,232 of 3,240** pace builds (§10b). Its "
"three-run arm carries a **licence predicate keyed on the `ia-version` that exists today** (standing ruling 2) and is **the only EXPIRING "
"licence in this build**: it REFUSES above its era rather than quietly passing on a rule the app no longer follows. **Note the V205 finding "
"that narrows the rest:** after D128 the run path does not crossover at all and **swim is the crossover's only remaining consumer**."
)
repl_line("- **D122 — BOTH NSW QUALITY SESSIONS RUN EVERY WEEK FROM WEEK 1 (coach, V204, RULED, PARKED AT V205 WITH D113).**", D122)

# --- ELEMENT 6: the ONE digest line ----------------------------------------
DIGEST = (
"- **V205 — the pace goal finally has a WEEK, and the calendar Mario refused to let us fix just for him.** Opened on his own ask "
"(*\"can we add the fourth run day in the queue\"*) and on the week we had proposed to him. **Seven rulings, and the ORDER was the hard part.** "
"**D127 first**: `deconflictLegLiftDays` degraded on a 4-run, 5-training-day week to a fallback putting **squats and calves on the long-run eve "
"and a deadlift the day before the intervals**, because D36's NRC long-run protection had never been extended to the NSW pace family. "
"`_nrcRunShape` grew a second arm keyed on **`legLoad`** — the NSW path prints `Long Slow Distance (LSD)` for **both** easy runs, so the "
"subtype string cannot tell the long run from the easy one and Mario's own question (*\"which LSD is it 1 or 2?\"*) was the defect stated out "
"loud. **1,980/6,336 → 0** long-run-eve hits, every one a four-training-day config. Shipping the ceiling first would have **manufactured "
"495/2,079** of them at five days, so the sequence is part of the ruling. **D125 amended** made the fourth run conditional on "
"`_nrcSpacedRunDays`'s **full objective** (coach withdrew the collision-only variant from its own ruling), relaxed the long run from a pin to a "
"preference because a pin fails closed and a closed fail means no fourth run at all, and moved the ceiling **3 → 4**. **D129, its addendum "
"and its final wording** wrote the rest out as ranks with coaching reasons attached — **6 identity, 7 spread, 8 rest into the long run, 9 "
"earliest first quality**, all pace-gated — and corrected `recBeforeLong`'s Sunday-first lens **for the pace family only**, NRC keeping the "
"shipped predicate because the correction moves **182/804** chooser rows and **54/112** built programs and that is a doctrine change needing its "
"own ruling. **D130 and its amendment is the one Mario's refusal produced.** He would not take a remedy validated on his own rest pattern "
"(*\"i wanna make sure that fixes that and not JUST my sunday wednesday off day\"*), so the deliverable became the **general table across all 64 "
"rest-day calendars** — and the general table found what a narrow one never could: at four training days a CHI on the long-run eve is "
"**structurally unavoidable on 14 of 64**. Rank 1 therefore **split by TYPE**: `-untolerated` then `-tolerated`, the only tolerated pair being "
"CHI immediately before the long LSD, untolerated held at an absolute **0**, and the tolerated class recorded as a **FLOOR the chooser must "
"reach**, not a ceiling it may miss. `-coll` left the key entirely, because one total that mixes a tolerated pair with an untolerated one cannot "
"rank them. Measured after: untolerated **0/6,336**; tolerated **1,386/6,336** = exactly **14 calendars × 9 seeds × 11 weeks**, **0 on "
"the other 50**. **D128** was the doctrine half: the CHI ladder was an **unsourced V115 hand ramp** topping out at **3 × 20 = 60 min**, and "
"Guide B's **Table 6** is the only ramp either guide states in full — rule against the table, not the prose. Reading it at "
"`min(week, 26)` **IS** the \">26 do not increase\" row, so the `isMilGoal && week > 26` limb was **deleted rather than re-pointed**. Mario's "
"block loses **90 minutes** of threshold work (**179 → 89**, W11 **60 → 20**) and he took the reduction because what it replaces was "
"invented. Bike forked off, swim took the rep tier only. **D114's INT half, with D135 and D136, closed a regression this build had just "
"caused:** once D125/D130 made the INT slot weekly, the V115 position-based ramp spread **4 → 8** across eleven weeks and the athlete "
"topped out at **seven** repeats instead of Guide A's eight. Table 6's INT column now drives it, **A's cap of 8 binding over B's Table 7 ten**, "
"the column stored **raw** with the clamp visible in the reader, bike INT forked off beside bike CHI. Mario: *\"fix it\"* — **a regression "
"this build caused is a different thing from capability it merely lacks**, and that distinction is what separated this from D113 on the same "
"afternoon. **D132** held the ceiling at **3** for the walk week: a `noimpact`/`noimpact_swim` solo-run program has every run rewritten to an "
"incline walk, so it has no SI, no LI and no long run, and D125's four-session argument does not reach it. **D122's pin shape** was the suite "
"half: `g202`'s D7 quantity is a **rule with two arms, not a scalar**, and a scalar **11** transcribed from the failure message would have "
"passed on the gate's own config while being **false on 2,232 of 3,240** pace builds. GREEN: **42 gates, PASS 2033 FAIL 0, REFUSED 0**; "
"sabotage **51/51 TRIPPED across ten specs, 0 SURVIVED, 0 NOT-APPLIED, 0 CRASH**; blast radius **18 hunks, 100% classified, 0 unruled "
"removals**; fuzz **3,213 configs / 1,039,216 tuples / 0 violations**; `HALF_MANNY` **UNMOVED** at `7d4f7ed45cc5bd53`, all three era tables "
"carrying `[205]` REFERENCE rows rebuilt independently and mutually distinct; NRC confinement **891/891 byte-identical**; **0** prescribed bike "
"cards moved. **Three tooling findings worth more than the gate count. (1) A gate can pass by NOT RUNNING**: a licence keyed on a feature "
"EXISTING is disarmed by deleting that feature, which is exactly what a sabotage mutation does — the sweep was re-run on the bumped "
"artifact with **`PASS 0 FAIL 0` read as a failure**. **(2) A faithfully re-anchored mutation can be a no-op** when a ruling makes its branch "
"unreachable; it must be re-aimed at the live predicate, not just re-anchored. **(3) A sabotage anchor written in slice N can be silently "
"invalidated by slice N+2** — three surfaced at once at the end. **NOT SHIPPED: D113** and **D122's crossover retirement** (slice 7c), both "
"parked by Mario — measure found D113's three-hard-run week ships an untolerated adjacency on **2,070/13,248** weeks, **all of it "
"multi-sport**, because multi-sport never enters the solo chooser and so got neither the typed split nor the relaxed pin (*\"ship V205 without "
"D113, and give D113 its own version\"*, on the reasoning that finishing what is proven beats widening a ruling on the last slice, which leaves "
"**1,296 pace builds on one quality session** until they ship); **D131**, ruled and then **withdrawn as unreachable**; and **D137** (the "
"`run_base` CHI fall at week 13, **136/1,836** configs, a regression V205 itself introduced), ruled and queued as **V206's first slice** with "
"the counter-argument recorded. **The session's retractions, recorded because they are the most useful part of it:** coach's three named "
"five-day losers were an ordering error (`mon+tue`, `mon+thu`, `wed+thu`); \"squats on the eve\" was corrected to \"deadlifts\" and then "
"measured at **1,782 legs versus 198 pull**, so the original instinct was right and the correction was wrong; \"42 movers become 32\" was "
"arithmetic and the count is **23**; the day-set floor assertion was refuted and re-worded to hard sessions; \"run and swim read the table\" "
"was wrong because swim has no minutes consumer; `run_base` was named in a blast radius holding 0 CHI cards **at tw=6 only**, and it moves at "
"tw=8; \"0 tolerated preferred\" was unreachable and **1 is the floor**; the `mon,tue,wed` worked example is not what its own objective selects; "
"the D127 legs cost was 2, 4 or 5, never 1; D131 was withdrawn; and the \"57 → 17 min\" `run_base` magnitude was retracted to **15-19 "
"→ 15-18**, because the base limb never prints reps × minutes. **Four were mine:** the subset relaxation rescues **zero** calendars "
"and I said five; NRC does not rely on the INT/CHI crossover, **swim is its only consumer**; the era row pins the **crossover**, not a rep ramp "
"on the three-run arm; and I repeated the retracted threefold `run_base` figure to Mario and corrected it to him. **Measure retracted two of "
"its own:** pass 1's \"266 survivors on equal-or-higher interference\" was an **instrument defect in the survivor definition**, corrected to "
"**44 survivors, 0 offenders**; and a first-pass pace row was extended linearly to **443** before the taper-hold limb was found. "
"§10b, §11f, §12."
)
repl_line("- **V205 — the pace goal finally has a WEEK,", DIGEST)

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice6 OK")
