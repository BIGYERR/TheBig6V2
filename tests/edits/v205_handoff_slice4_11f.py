#!/usr/bin/env python3
# V205 handoff fold, slice 4: element 4 (section 11f V205 block) - Mario's decisions and
# EVERY retraction, recorded and not smoothed over.
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

# --- the block header -------------------------------------------------------
repl_line(
"### V205 — D127/D128/D125a/D129/D130,",
"### V205 — D127/D128/D125a/D129/D130/D132/D114a/D135/D136/D122a, the pace goal gets a week "
"(Mario: \"can we add the fourth run day in the queue\", \"i wanna make sure that fixes that and not JUST my sunday wednesday off day\", "
"\"hinge and heavy lift before another LSD day coach signed off on? which LSD is it 1 or 2?\", \"ship V205 without D113\", \"fix it\")",
)

# --- new Mario decisions ----------------------------------------------------
NEW_MARIO = [
"- **\"FIX IT\": A REGRESSION THIS BUILD CAUSED IS NOT THE SAME THING AS CAPABILITY IT MERELY LACKS (D114's INT half, D135, D136; Mario's).** "
"The INT ramp was not on the slice list. It surfaced only because D125/D130 made the INT slot **weekly**, which spread the V115 "
"position-based ramp over eleven weeks and topped the athlete out at **seven** repeats instead of Guide A's **eight**. Offered the choice of "
"queueing it, Mario said *\"fix it\"*, and the reasoning is the standing form: **a defect this build introduced is owed a fix in this build; a "
"capability the build merely does not have can wait for its own version.** That distinction is what separated the INT ramp (fixed here) from "
"D113 (parked here) on the same afternoon — they are not competing scope calls, they are different categories. It also set the shape: "
"**D136** rules that **Guide A's cap of 8 binds over Guide B's Table 7 ten**, and **D135** forks bike INT off the table for the same reason "
"bike CHI was forked, because neither guide covers cycling.",
"- **SHIP ON D137, WITH THE COUNTER-ARGUMENT RECORDED (Mario's, the last call of the session).** D137 (the `run_base` CHI fall at week 13) was "
"ruled and NOT built: it is **V206's first slice**. The recommendation was to ship V205 as proven and open V206 on D137, and Mario took it. "
"**The counter-argument, recorded so it does not have to be re-made:** V205 introduced the fall, so by the *\"fix it\"* principle above it is "
"arguably owed a fix in this build too. What separates it is **reach and proof state** — D137 touches **136 of 1,836** configs, it is a "
"different goal family from everything V205 proved, and folding it in would have meant re-proving a 42-gate, 51-mutation artifact on the last "
"slice. **Finishing what is proven beats widening a ruling on the last slice** is the same reasoning that parked D113; applying it twice in "
"one session is the system being consistent, not the session losing its nerve.",
]
i = idx("- **SHIP WHAT IS PROVEN; D113 GETS ITS OWN VERSION (Mario's, the scope call).**")
lines[i + 1:i + 1] = NEW_MARIO

# --- the retractions, in full ----------------------------------------------
RETRACT = (
"- **EVERY RETRACTION FROM THIS SESSION, RECORDED AND NOT SMOOTHED OVER. This is the most valuable part of the entry.** The corrections were "
"more informative than the rulings that survived intact, and smoothing them into a clean narrative would destroy exactly the information a "
"future session needs. "
"**COACH'S.** **(1)** The three named five-day losers were an **ordering error**; the real set is `mon+tue`, `mon+thu`, `wed+thu`. "
"**(2)** *\"Squats on the eve\"* was corrected to *\"deadlifts\"* — and then **measured at 1,782 legs versus 198 pull**, so **the "
"original instinct was right and the correction was wrong**. A correction is a claim like any other and it gets measured like any other. "
"**(3)** *\"42 movers become 32\"* was arithmetic; **the count is 23**. "
"**(4)** The **day-set floor** assertion was **refuted by measure** and re-worded to bind **hard sessions** instead. "
"**(5)** *\"Run and swim read the table\"* was wrong: **swim has no minutes consumer**, so it takes the rep tier only. "
"**(6)** `run_base` was named in a blast radius as carrying **0 CHI cards** — true **at tw=6 only**, and it moves at tw=8 (§10b). "
"**(7)** *\"0 tolerated preferred\"* was **unreachable**; on the 14 four-day calendars **1 is the FLOOR**. "
"**(8)** The `mon,tue,wed` **worked example was not what its own objective selects** — the prose and the vector disagreed and the vector "
"was right. "
"**(9)** The D127 legs cost was **2, 4 or 5, never 1**. "
"**(10)** **D131 was ruled and then WITHDRAWN as unreachable** — recorded so the number is not reused and the idea is not re-derived. "
"**(11)** The *\"57 → 17 min\"* `run_base` magnitude was retracted to **15-19 → 15-18**, a minute or two, because **the base limb "
"never prints reps × minutes**. "
"**MINE (the orchestrator's).** **(a)** The **subset relaxation rescues ZERO calendars, not five**. "
"**(b)** I briefed that **NRC relied on the INT/CHI crossover**; measure corrected it — **swim is its only consumer**. "
"**(c)** I described the era row as pinning **a rep ramp on the three-run arm** when what it pins is **the crossover**. "
"**(d)** I **repeated the threefold `run_base` figure to Mario** after it had been retracted, and corrected it to him directly. A retraction "
"that does not reach the person who heard the original is not a retraction. "
"**MEASURE'S.** **(i)** Pass 1's *\"266 survivors on equal-or-higher interference\"* was an **instrument defect in the survivor definition**, "
"corrected to **44 survivors, 0 offenders** — the instrument was wrong, not the engine. "
"**(ii)** A first-pass pace row was **extended linearly to 443** before the **taper-hold limb** was found; the linear extension was an "
"artifact of not having read the limb yet."
)
repl_line("- **EVERY RETRACTION FROM THIS SESSION, RECORDED AND NOT SMOOTHED OVER.**", RETRACT)

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice4 OK")
