#!/usr/bin/env python3
# V205 slice 10 — the handoff fold (seven elements) + the g205_d130_typed comment fix.
# Every anchor asserted count==1 before any write. Aborts on the first miss.
# index.html is NOT touched by this script.
import io, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HO   = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')
GATE = os.path.join(ROOT, 'tests/gates/g205_d130_typed.js')

def rd(p):
    with io.open(p, encoding='utf-8') as f: return f.read()
def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

EDITS = []   # (label, path, old, new)
def E(label, path, old, new):
    EDITS.append((label, path, old, new))

# ───────────────────────── ELEMENT 1 — current state header ─────────────────────────
WF_NEW = (
"- **Working file:** `index.html` — **V205**; `<meta name=\"ia-version\">`=**205**. Built in order after V204. "
"**V205 BUILT the NSW pace goal's week.** "
"**D128** — CHI minutes and reps now come from **Guide B Table 6** (`NSW_TABLE6_CHI` + `chiFromTable6`), replacing a "
"V115 hand ramp with **no source** that reached **3 × 20 = 60 min**; Mario's block CHI work drops **179 → 89 min** and "
"**W11 60 → 20**. The hardcoded `isMilGoal && week > 26` limb returning 60 min is **DELETED, not re-pointed**, because a "
"table read indexed `Math.min(week, 26)` **IS** the doctrine's \"do not increase\" row. The **bike forks off unchanged** "
"(`getCHIBike`, the V115 ramp byte-identical: Table 6 is a run/swim table and prescribing its minutes on a bike would be an "
"invention, not a transcription), and **swim takes the rep tier only** (`getCHISwim`: importing the minutes column would "
"prescribe a second dimension against `chiYards`, and prescription owns ONE). "
"**D127** — D36's long-run protection extends to the **pace family** by the same cost table: the hinge and the heavy lower "
"pair ride a quality day, and nothing axial lands on the long run or its eve. Long-run-eve hits went **1,980/6,336 → 0**, "
"every one of them a four-training-day config, and this had to ship **BEFORE** the ceiling, because the ceiling would "
"otherwise have created **495/2,079** at five days. "
"**D125 amended** — the even-spread day chooser is replaced by **`_nrcSpacedRunDays`'s full objective** on the pace family, "
"and the long run is relaxed from a pin to a preference. "
"**D129 and addendum** — ranks **6 identity, 7 spread, 8 rest-into-the-long-run, 9 earliest first quality**, all "
"**pace-gated**; `recBeforeLong`'s Sunday-first lens corrected **for the pace family only**. "
"**D130 and amendment** — the fourth run reaches **all 64 rest-day calendars**, with **rank 1 split into untolerated and "
"tolerated**: every hard pair except CHI immediately before the long LSD must be **0**, and on the **14** four-day calendars "
"one tolerated CHI-on-eve is the **FLOOR, not an aspiration**. "
"Gate proof at 205: **seven new gates, 238 assertions, FAIL 0**; sabotage **35/35 TRIPPED across five specs, 0 SURVIVED, "
"0 NOT-APPLIED, 0 CRASH**; `HALF_MANNY` **UNMOVED** at `7d4f7ed45cc5bd53` with all three era tables carrying `[205]` "
"REFERENCE rows, verified by rebuilding every arm on both artifacts in one run. Untolerated adjacency **0/6,336**; tolerated "
"**1,386/6,336**, exactly **14 calendars × 9 seeds × 11 weeks** and **zero on the other 50**. "
"**NOT SHIPPED, parked by Mario's ruling: D113 and D122** — they get their own version (§12)."
)

MRW_V205 = (
"- **Most recent work (V205): the pace goal's week, and the calendar Mario refused to let us fix just for him.** "
"The thread opened on Mario's own question, *\"can we add the fourth run day in the queue\"*, and on his challenge to the "
"week we proposed for him. Four things had to be true at once and the ORDER was the hard part. **D127 shipped first**: "
"`deconflictLegLiftDays` degraded on a 4-run, 5-training-day week to a fallback that put **squats and calves on the "
"long-run eve and a deadlift the day before the intervals**, and D36's NRC protection had never been extended to the NSW "
"pace family. `_nrcRunShape` grew a **second arm keyed on `legLoad`**, because the NSW path prints the same subtype string "
"(`Long Slow Distance (LSD)`) for BOTH its easy runs and the flag is the only thing that tells the long one from the easy "
"one. **1,980/6,336 → 0** long-run-eve hits. Shipping the fourth-run ceiling first would have MANUFACTURED **495/2,079** "
"of them at five days, which is why the order is recorded as part of the ruling and not as a convenience. **D125 amended** "
"then made the fourth run conditional on `_nrcSpacedRunDays`'s **full objective** rather than the collision-only variant "
"coach first named and then withdrew, and relaxed the long run from a pin to a preference. **D129 and its addendum** wrote "
"the remaining preferences out as RANKS — identity, spread, rest into the long run, earliest first quality — each with a "
"coaching reason, all gated to the pace family so NRC's subset and permutation pins are untouched. **D130 and its "
"amendment** is the one Mario's refusal produced: he would not take a fix validated on his own Sunday/Wednesday calendar "
"(*\"i wanna make sure that fixes that and not JUST my sunday wednesday off day\"*), so the deliverable became the **general "
"table over all 64 rest-day calendars**. That table is what forced the **typed split**: at four training days a CHI on the "
"long-run eve is unavoidable on **14 of 64** calendars, so rank 1 became **-untolerated, then -tolerated**, with the "
"untolerated class at an absolute **0** and the tolerated class recorded as a **FLOOR the chooser must reach**, not a "
"target it may miss. `-coll` left the key entirely: a single total that mixes a tolerated pair with an untolerated one "
"cannot rank them. Measured after: untolerated **0/6,336**, tolerated **1,386/6,336** = exactly **14 calendars × 9 seeds "
"× 11 weeks**, **zero on the other 50**. **D128** was the doctrine half: the CHI ladder had been an unsourced V115 hand "
"ramp topping out at **3 × 20 = 60 min**, and Guide B's **Table 6** is the only ramp either guide states in full. Reading "
"the table at `Math.min(week, 26)` **is** its \">26 do not increase\" row, so the `isMilGoal && week > 26` limb was deleted "
"rather than re-pointed. Mario's block loses **90 minutes** of threshold work (**179 → 89**, W11 **60 → 20**). Bike forked "
"off byte-identical because **no guide covers cycling**; swim took the **rep tier only** because it is prescribed in yards "
"and a minutes column would prescribe a second dimension. **What did NOT ship, by Mario's own call:** **D113** and "
"**D122**. Measure found D113's three-hard-run week ships an untolerated adjacency on **2,070/13,248** weeks, all of it "
"multi-sport, because **multi-sport never enters the solo chooser** and so received neither the typed split nor the "
"relaxed pin. He ruled *\"ship V205 without D113, and give D113 its own version\"* — finishing what is proven beats widening "
"a ruling on the last slice. **Nine retractions and two of mine are recorded in §11f and they are the most useful part of "
"this entry.** §10b, §11f, §12."
)

def elem1(src):
    lines = src.split('\n')
    hits = [i for i, l in enumerate(lines) if l.startswith('- **Working file:** `index.html`')]
    assert len(hits) == 1, 'E1a working-file line count==%d' % len(hits)
    assert '**V204**' in lines[hits[0]], 'E1a baseline says V204'
    lines[hits[0]] = WF_NEW
    return '\n'.join(lines)

E('E1b demote V204 + insert V205', HO,
  '- **Most recent work (V204): the clock that printed',
  MRW_V205 + '\n\n- **Prior work (V204): the clock that printed')

# ───────────────────────── ELEMENT 2 — numbered sections (§5) ─────────────────────────
S5 = (
"- **CHI minutes and reps come from Guide B Table 6 (V205, D128).** `NSW_TABLE6_CHI` is the 26-row transcription and "
"`chiFromTable6(week)` is its only reader; it returns a fresh object so no caller can mutate the table. **`Math.min(week, 26)` "
"is load-bearing doctrine, not defensive clamping** — it IS Table 6's \">26\" row, which is why the old "
"`isMilGoal && week > 26` limb (a hardcoded `{reps:3, minPerRep:20}`, **60 minutes against the table's 40 at the same week**) "
"was **deleted rather than re-pointed**. The table is indexed on the **calendar training week**, so a CHI phase that opens in "
"week 7 opens on week 7's row (1 × 18) instead of restarting the ramp at its first rung. `phaseFrom`/`phaseTo` stay in "
"`getCHI`'s signature because the run and swim callers still pass the periodized window, but they no longer re-base the "
"progression; the V115 phase-relative pct ramp is gone with the 1/2/3 rep ladder it fed. The cutback branch is unchanged: one "
"rep off the prior build week, or ~30% duration off a single-rep session, intensity held.\n"
"- **The CHI reader is forked BY CALLER, not by a flag (V205, D128).** `getCHI` is the run reader. **`getCHIBike`** is the V115 "
"ramp carried over unchanged — Table 6 is titled Run/Swim and **neither guide covers cycling**, so prescribing its minutes on "
"a bike would be an invention rather than a transcription; when cycling is ruled on, this reader is replaced on its own "
"without touching the table or the run path. (The `isMilGoal && week > 26` limb is not carried into it: the bike caller passes "
"`false` literally, so it was already unreachable and dropping it moves no byte of bike output.) **`getCHISwim`** takes the "
"**rep tier and nothing else** — 1 rep through week 12, 2 from week 13, never 3 — because the swim CHI session is prescribed "
"in YARDS (`chiYards`, its own ramp, untouched by D128) and importing the minutes column would prescribe two dimensions. Its "
"`minPerRep` stays on the V115 ramp for the taper branch that rewrites it; **nothing downstream of swim prints it** (§12).\n"
"- **`PACE_GOALS` is the one set that names the pace family (V205).** `new Set(['run_pace_goal','run_mile_time','run_15_under10'])`, "
"declared once at module scope. Three readers, and they must agree: the **fourth-run ceiling**, the **spacing chooser's "
"`paceFam` gate**, and `_nrcRunShape`'s own `_paceFam` predicate. The V115 lesson holds — `isSpeedGoal` omits `run_mile_time` "
"and `run_15_under10`, so anything reasoning about the pace family reads `PACE_GOALS` and never `isSpeedGoal`.\n"
"- **The run-day chooser ranks ten terms, and every one carries a coaching reason (V205, D129 + D130).** "
"`_rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, "
"c.qualRest, c.qualFirst]`, highest first, ties keeping the incumbent so the chooser is deterministic with no seed. "
"**1** no untolerated hard pair. **1b** fewest tolerated pairs. **2** the long run on the last training day. **3** speeds "
"after a rest day. **4** a recovery run padding the long run. **5** canonical speed order. **6** the athlete's existing "
"even-spread subset (identity). **7** the tightest spread. **8** the longest rest into the long run. **9** the earliest first "
"quality day, written out so it is a rank rather than an accident of enumeration. **Ranks 6 and 7 pin the DAY SET; 8 and 9 "
"pin the TYPES on it**, so enumeration order never decides which days an athlete trains on. Ranks 6–9 are **paceFam-gated**: "
"NRC's subset and permutation pins already fix its layout and a new preference there is unruled.\n"
"- **Rank 1 is TYPED: untolerated and tolerated are different claims (V205, D130 amended).** Every hard pair is untolerated "
"**except CHI immediately before the long LSD**, which is tolerated. `-c.coll` is **GONE from the key**: one total that mixes "
"a tolerated pair with an untolerated one cannot rank them, and summing them is what let a genuinely bad layout tie a good "
"one. On the **14 four-day calendars** where a CHI on the long-run eve is unavoidable, **one tolerated pair is the FLOOR the "
"chooser must reach**, not an aspiration it may miss — a gate that reads it as a ceiling would pass on a layout that never "
"placed the fourth run. Measured across all 64 calendars: untolerated **0/6,336**, tolerated **1,386/6,336** = 14 × 9 seeds "
"× 11 weeks, and **0 on the other 50**.\n"
"- **`_nrcRunShape` is a two-armed classifier, and the NSW arm is keyed on `legLoad` (V205, D127).** The NRC arm reads `isNRC` "
"and the Nike subtypes. The NSW pace arm cannot: the engine sets **no `isNRC`** (that flag means Nike-verbatim and is not "
"faked), and it names **BOTH** of its easy runs `Long Slow Distance (LSD)`, so the subtype string cannot tell the long run "
"from the easy one. **`legLoad` can** — the scheduler already sets it from `assignedType` (`lsd_long` true, `lsd_easy` false). "
"INT and CHI are the speed days. Scoped to `PACE_GOALS`; `run_base` and every other NSW goal fall through with a **null shape** "
"and keep the 48 h rule unchanged, which is how D127 widened the door without moving anything outside the pace family.\n"
"- **The fourth run is CONDITIONAL, and multi-sport holds at 3 (V205, D125 amended).** "
"`const _ceil = (PACE_GOALS.has(goalId) && cardioTypes.length !== 1) ? Math.min(ceiling, 3) : ceiling;` — the pace family "
"gets its fourth run only on a **SOLO cardio week**, because the spacing chooser that earns it only runs there. A multi-sport "
"week never reaches the chooser, so there is no collision-free layout to key on and the ruling's own fallback applies. "
"**Both callers read this** (the wizard nudge and the engine), so the nudge cannot promise a fourth run the engine will not "
"deal. Bike and swim are untouched on both paths. This is the ruled shape, not a limitation to be quietly widened (§12).\n"
"\n"
"## 5b. Injury overlays"
)
E('E2a §5 fold', HO, '\n## 5b. Injury overlays', '\n' + S5)

E('E2b V115 CHI ramp superseded', HO,
  '`getINTReps` takes `rampSpan`; `getCHI` takes `phaseFrom`/`phaseTo`; **both still read the real calendar week for cutback detection**, because deloads are calendar-aligned and must not shift with the phase.',
  '`getINTReps` takes `rampSpan`; `getCHI` takes `phaseFrom`/`phaseTo`; **both still read the real calendar week for cutback '
  'detection**, because deloads are calendar-aligned and must not shift with the phase. **SUPERSEDED IN PART (V205, D128): the '
  'CHI half of this is no longer true.** `getCHI` reads Guide B Table 6 indexed on the calendar week, so `phaseFrom`/`phaseTo` '
  'survive in the signature but **no longer re-base the CHI progression** — a CHI phase opening in week 7 opens on week 7’s '
  'row, not at the ramp’s first rung. The `_qPhase` re-basing argument above still describes **`getINTReps` only**. The 1/2/3 '
  'rep ladder and the `15 + pct * 5` minute ramp survive **only** in `getCHIBike` (§5 D128 bullets).')

# ───────────────────────── ELEMENT 3 — §10b standing lessons ─────────────────────────
S10B = (
"\n"
"- **A ruling that makes every session in a slot hard spends the spacer (V205).** D113 turned the three-run week's easy LSD "
"into a quality session, and three hard runs among four training days **always** adjoin: **0 of 14** four-day calendars can "
"avoid it. The easy session was not filler, it was the thing keeping the two hard ones apart. **Before ruling on a slot's "
"contents, ask what the thing being replaced was doing structurally**, not just what it was prescribing.\n"
"- **A GATE CAN PASS BY NOT RUNNING (V205).** A licence keyed on a feature EXISTING is disarmed by deleting that feature — "
"and deleting a feature is exactly what a sabotage mutation does, so the mutation switches off the gate that was supposed to "
"catch it and the sweep reports a trip that never happened. **Sweep the bumped artifact**, and read any **`PASS 0 FAIL 0`** as "
"a mutation that turned its own gate off, never as a gate with nothing to say.\n"
"- **A faithfully re-anchored mutation can become a no-op (V205).** When a ruling makes a branch unreachable, a mutation "
"living inside that branch stops proving anything even though its anchor still matches `count==1` and the sweep still reports "
"it APPLIED. Re-anchoring it correctly is not enough. **Measure the re-anchor and re-aim it at the live predicate**, because a "
"mutation nobody can observe is a mutation defect, not a gate defect.\n"
"- **Rule against the table, not the prose (V205).** When a doctrine source carries both a narrative sentence and a table, "
"**the table is the rule**. A sentence describing one athlete's progression is not a ceiling for every athlete, and reading it "
"as one is how an unsourced hand ramp survives three versions wearing a doctrine label.\n"
"- **A rank must carry a coaching reason or it is enumeration order wearing a name (V205).** Writing a preference into an "
"objective vector makes it look principled. If the rank cannot be stated as a coaching sentence — what the athlete gains, and "
"against what — then what got pinned is the order the loops happened to run in, and it will silently change the day someone "
"reorders the loops.\n"
"- **A fix that lives inside a chooser does not reach a population gated out of that chooser (V205).** Multi-sport never "
"enters the solo branch, so it got **neither** the typed untolerated/tolerated split **nor** the relaxed long-run pin, and the "
"ruling read as general while being true only of solo weeks. **Name the population a fix reaches at ruling time, by count**, "
"and say out loud who is gated out.\n"
"\n## 11. Resolved bugs"
)
E('E3 §10b', HO, '\n\n## 11. Resolved bugs', S10B)

# ───────────────────────── ELEMENT 4 — §11f V205 block ─────────────────────────
S11F = (
"### V205 — D127/D128/D125a/D129/D130, the pace goal gets a week (Mario: \"can we add the fourth run day in the queue\", "
"\"i wanna make sure that fixes that and not JUST my sunday wednesday off day\", "
"\"hinge and heavy lift before another LSD day coach signed off on?\", \"ship V205 without D113, and give D113 its own version\")\n"
"- **THE FOURTH RUN DAY WAS MARIO'S ASK (D125 amended).** Mario: *\"can we add the fourth run day in the queue\"*. The pace "
"family had been capped at three runs because nothing guaranteed the fourth would land somewhere survivable. The answer was "
"not to raise the cap but to make it **conditional on a layout being earned**: `_nrcSpacedRunDays`'s **full objective**, not "
"the collision-only variant coach first named and then withdrew from its own D125. The long run relaxed from a **pin** to a "
"**preference** in the same ruling — a pin makes the chooser fail closed on calendars where the last training day is wrong "
"for it, and failing closed means the athlete does not get his fourth run at all.\n"
"- **A FIX SHAPED AROUND HIS OWN CALENDAR IS NOT A FIX, AND THIS IS WHAT MADE THE BUILD (D130, Mario's).** Mario: *\"i wanna "
"make sure that fixes that and not JUST my sunday wednesday off day\"*. He refused a remedy validated on his own rest pattern. "
"That refusal is what turned the deliverable into a **general table over all 64 rest-day calendars** rather than a passing "
"measurement on one, and the general table is what found the thing the narrow one never could: at four training days a CHI on "
"the long-run eve is **structurally unavoidable on 14 of 64** calendars. **The typed untolerated/tolerated split exists "
"because he would not accept a fix proven on one row.** A narrow validation would have shipped a rank that reads \"zero hard "
"adjacency\" and is simply false for 14 calendars.\n"
"- **THE HINGE CHALLENGE PRODUCED D127, AND IT HAD TO SHIP FIRST (D127, Mario's).** Carried from V204: shown the proposed "
"pace-goal week Mario asked *\"hinge and heavy lift before another LSD day coach signed off on? which LSD is it 1 or 2?\"* — "
"and the second half of that question **is the defect**, because the NSW path names both easy runs `Long Slow Distance (LSD)` "
"and the code could not tell them apart either. `_nrcRunShape` now reads **`legLoad`**. The ordering is part of the ruling: "
"D127 before the ceiling, because raising the ceiling first would have **manufactured 495/2,079** long-run-eve hits at five "
"training days that did not exist before.\n"
"- **THE TABLE IS THE DOCTRINE; THE SENTENCE IS NOT (D128).** Guide A carries a narrative 20-minute sentence and Guide B "
"carries Table 6. The table governs. The V115 CHI ladder had **no source at all** and reached **3 × 20 = 60 min**; Mario's "
"own block loses **90 minutes** of threshold work (**179 → 89**, W11 **60 → 20**), which is a real reduction in his training "
"and he took it because the ramp it replaces was invented. The `> 26` limb was **deleted rather than re-pointed**: a table "
"read at `Math.min(week, 26)` **IS** the \"do not increase\" row, and re-pointing the limb would have left a second, "
"competing statement of the same rule.\n"
"- **SHIP WHAT IS PROVEN; D113 GETS ITS OWN VERSION (Mario's, the scope call).** Mario: *\"ship V205 without D113, and give "
"D113 its own version\"*. D113 (and D122 with it) was ruled, measured, and found to ship an untolerated adjacency on "
"**2,070/13,248** weeks, all of it multi-sport, because multi-sport never reaches the solo chooser. His reasoning, and it is "
"the standing form: **finishing what is proven beats widening a ruling on the last slice.** A slice added at the end is the "
"one with the least verification behind it and the most pressure to wave through.\n"
"- **EVERY RETRACTION FROM THIS SESSION, RECORDED AND NOT SMOOTHED OVER.** The corrections were more informative than the "
"rulings that survived intact. **(1)** Coach's three named five-day losers were an **ordering error**; the real set is "
"`mon+tue`, `mon+thu`, `wed+thu`. **(2)** \"Squats on the eve\" was corrected to \"deadlifts\" — and then measured at "
"**1,782 legs versus 198 pull**, so **the original instinct was right and the correction was wrong**. **(3)** \"42 movers "
"become 32\" was arithmetic rather than measurement; the count is **23**. **(4)** The day-set floor assertion was **refuted** "
"and re-worded to hard sessions. **(5)** \"Run and swim read the table\" was wrong: **swim has no minutes consumer**, so it "
"takes the rep tier only. **(6)** `run_base` was named in a blast radius that contains **0 CHI cards**. **(7)** \"0 tolerated "
"preferred\" was **unreachable** as stated. **(8)** Coach's `mon,tue,wed` worked example **is not what its own objective "
"selects**. **(9)** The D127 legs cost was measured at **2, 4 or 5 — never 1**. **And two of mine, as orchestrator:** I "
"briefed that the subset relaxation rescued **five** calendars when it rescues **zero**, and that NRC relied on the INT/CHI "
"crossover when **swim is its only consumer**. Both went into builder briefs before measure caught them.\n"
"\n"
"### V204 — "
)
E('E4 §11f', HO, '\n### V204 — D126 (built)', '\n' + S11F + 'D126 (built)')

# ───────────────────────── ELEMENT 5 — §12 ─────────────────────────
OLD_D127_D125 = rd(HO).split('\n')
_d127 = [l for l in OLD_D127_D125 if l.startswith("- **D127 — D36's LONG-RUN PROTECTION")]
_d125 = [l for l in OLD_D127_D125 if l.startswith('- **D125 — CEILING 4 AT >=5')]
_chiq = [l for l in OLD_D127_D125 if l.startswith('- **THE CHI MINUTE LADDER IS AN OPEN DOCTRINE QUESTION')]
_d122 = [l for l in OLD_D127_D125 if l.startswith('- **D122 — BOTH NSW QUALITY SESSIONS')]
_d113 = [l for l in OLD_D127_D125 if l.startswith('- **D113 — THE 3-RUN WEEK BECOMES')]
for nm, arr in (('D127', _d127), ('D125', _d125), ('CHI-ladder', _chiq), ('D122', _d122), ('D113', _d113)):
    assert len(arr) == 1, 'E5 anchor %s count==%d' % (nm, len(arr))

NEW_V205_OPEN = (
"- **D113 AND D122 ARE PARKED BY MARIO'S RULING, AND THE ROOT CAUSE IS MULTI-SPORT (V205, measured, they get their own "
"version).** Mario: *\"ship V205 without D113, and give D113 its own version\"*. D113 makes the three-run week INT / CHI / long "
"run; D122 runs both quality sessions from week 1. Measured on the V205 artifact, shipping either would put an **untolerated "
"hard adjacency on 2,070 of 13,248 weeks**, and **all of it is multi-sport**. The cause is structural, not a tuning miss: "
"**multi-sport never enters the solo spacing chooser**, so it received neither D130's typed untolerated/tolerated split nor "
"D125's relaxed long-run pin. Three remedies were named. **(1) Route multi-sport through the chooser** — PREFERRED: one "
"objective, one lens, and the typed split then covers everyone by construction. (2) Give multi-sport its own adjacency pass "
"— a second lens on the same doctrine, which §10b says is how the two halves drift apart. (3) Gate D113 to solo weeks — "
"cheapest, and it ships a doctrine that is true of some athletes and silently false for the rest. **Nothing here is built and "
"nothing should be built until the routing question is ruled.**\n"
"- **MULTI-SPORT PACE HOLDS AT A CEILING OF 3, PENDING A JOINT CHOOSER (V205, D125 amended, ruled shape).** "
"`(PACE_GOALS.has(goalId) && cardioTypes.length !== 1) ? Math.min(ceiling, 3) : ceiling`. This is the ruling's own fallback, "
"not an oversight: the fourth run is conditional on a collision-free layout and only the solo branch produces one. The open "
"item is the same routing question D113 sits behind — a chooser that reasons about a multi-sport week would lift this "
"ceiling as a consequence, and nothing else should.\n"
"- **THE SWIM INT/CHI CROSSOVER IS NOW THE ONLY CONSUMER OF THAT IDEA, AND IT IS UNRULED (V205).** The INT-then-CHI "
"crossover is an NRC idea that leaked onto the NSW path (D122's finding). After D128 the **run** path reads Table 6 by "
"calendar week and does not crossover at all, and I briefed that **NRC** relied on the crossover — **that was wrong, and "
"measure corrected it: swim is its only consumer.** So `qualityCrossoverWeek()` now governs exactly one sport, by accident "
"rather than by ruling. Either swim's crossover is doctrine and should be stated as swim doctrine, or it is residue and "
"should go. Nobody has ruled it.\n"
"- **`canonical` READS THE CIRCULAR WEEK THROUGH THE SUNDAY-FIRST LIST, AND IT IS UNMEASURED (V205).** Rank 5 orders the "
"speed days by `pos()`, which indexes `_ISO_ORDER`. The training week is **circular** (the same trap that once scored "
"Sun+Sat as maximum separation, §5 V115), and a Sunday-first linear read can call a wrap-around order non-canonical when it "
"is not. `recBeforeLong`'s copy of this lens was **corrected for the pace family only** under D129; `canonical`'s was not "
"touched, and the population it affects has **never been counted**. Measure before ruling.\n"
"- **THE NRC `recBeforeLong` DELTA NEEDS ITS OWN RULING (V205, measured, deliberately NOT built).** Applying D129's lens "
"correction to NRC as well as the pace family moves **182 of 804 chooser rows**, **54 of 112 built** programs, and "
"**relocates the long run on 3**. It was gated to the pace family precisely because NRC's subset and permutation pins already "
"fix its layout and moving a Nike long run is a doctrine change, not a bug fix. The numbers are recorded so the ruling does "
"not have to re-measure: it needs a coaching call on whether the corrected lens is better for NRC, not an engineering one.\n"
"- **THE HAS-GATED LICENCE HOLE (V205, found by sabotage, NOT closed).** A licence predicate keyed on a feature **existing** "
"is disarmed by deleting that feature — and deleting a feature is what a sabotage mutation does, so the mutation switches "
"off the gate meant to catch it and the sweep still reads green. The V205 sweep was re-run on the bumped artifact with "
"**`PASS 0 FAIL 0` treated as a failure** (§10b), which closed it for this build by procedure. It is **not closed in the "
"licence form itself**: the general fix is to key the predicate on `ia-version` alone and let the feature's absence be a "
"FAILURE rather than a SKIP. Every HAS-gated licence in the suite is in scope and none have been swept for it.\n"
"- **BIKE CHI SHIPS 2,664 CARDS WITH NO NSW SOURCE, 1,872 OF THEM ABOVE TABLE 6 (V205, D128 disclosed, deliberately not "
"fixed).** `getCHIBike` is the V115 hand ramp carried over byte-identical because **neither guide covers cycling**, so "
"applying a run/swim table to a bike would be an invention. That is the right call and it leaves a real gap: **1,872 of "
"2,664** bike CHI cards prescribe more than Table 6 would at the same week, off a ramp nobody sourced. Needs a cycling "
"doctrine anchor, which the repo does not have. Recorded so it is not mistaken for a transcription.\n"
)

NEW_D122 = (
"- **D122 — BOTH NSW QUALITY SESSIONS RUN EVERY WEEK FROM WEEK 1 (coach, V204, RULED, PARKED AT V205 WITH D113).** The "
"**INT-then-CHI crossover is an NRC idea that leaked onto the NSW path**; neither guide states it. **Parked by Mario's ruling "
"at V205 for the same multi-sport root cause as D113** (2,070/13,248 weeks would ship an untolerated adjacency; see the "
"parking entry above). Consequence for the suite, and it is the load-bearing half: **`g202_int_doctrine`'s D7 six-week pin is "
"asserting retired doctrine** and needs a **licence predicate** keyed on the `ia-version` that exists today (standing ruling "
"2), so it REFUSES above its era rather than quietly passing on a rule the app no longer follows. **Note the V205 finding "
"that narrows this:** after D128 the run path does not crossover at all and **swim is the crossover's only remaining "
"consumer**."
)
NEW_D113 = (
"- **D113 — THE 3-RUN WEEK BECOMES INT / CHI / long run (coach, V202, RULED, PARKED AT V205 — IT GETS ITS OWN VERSION). "
"This OVERTURNS V115.** V115 pinned one quality day in a 3-run week. Under the two-guide read the 3-run week is the guide's "
"own standard week and it carries two quality sessions. Mario GAINS a second quality day. Today **SAT is LSD in 0 of 11 "
"weeks**, which is the measurement that shows the current allocation is not the guide's. **Parked at V205 by Mario** after "
"measure found it ships an untolerated adjacency on **2,070/13,248** weeks, all multi-sport (root cause and the three "
"remedies are in the V205 parking entry at the head of this section). **And the structural lesson it paid for (§10b): the "
"easy LSD it deletes was the SPACER.** Three hard runs among four training days always adjoin — **0 of 14** four-day "
"calendars can avoid it."
)

src = rd(HO)
E('E5a V205 open items + drop built D127/D125', HO,
  _d127[0] + '\n' + _d125[0] + '\n',
  NEW_V205_OPEN)
E('E5b CHI ladder question closed by D128', HO, _chiq[0] + '\n', '')
E('E5c D122 parked', HO, _d122[0], NEW_D122)
E('E5d D113 parked', HO, _d113[0], NEW_D113)
E('E5e D114 CHI half shipped', HO,
  'D114 holds the ground until then.',
  'D114 holds the ground until then. **[V205: the CHI half of D114 SHIPPED as D128** — `NSW_TABLE6_CHI` + `chiFromTable6`, '
  'run path only, bike forked off and swim taking the rep tier alone. The INT-rep half was already wired at V202. **D114’s '
  'licence-to-refuse clause is unchanged and still binds the build that ships D115.]**')

# ───────────────────────── ELEMENT 6 — one digest line ─────────────────────────
DIGEST = (
"- **V205 — the pace goal finally has a WEEK, and the calendar Mario refused to let us fix just for him.** Opened on his own "
"ask (*\"can we add the fourth run day in the queue\"*) and on the week we had proposed to him. Five rulings, and the ORDER "
"was the hard part. **D127 first**: `deconflictLegLiftDays` degraded on a 4-run, 5-training-day week to a fallback putting "
"**squats and calves on the long-run eve and a deadlift the day before the intervals**, because D36's NRC long-run protection "
"had never been extended to the NSW pace family. `_nrcRunShape` grew a second arm keyed on **`legLoad`** — the NSW path "
"prints `Long Slow Distance (LSD)` for **both** easy runs, so the subtype string cannot tell the long run from the easy one "
"and Mario's own question (*\"which LSD is it 1 or 2?\"*) was the defect stated out loud. **1,980/6,336 → 0** long-run-eve "
"hits. Shipping the fourth-run ceiling first would have **manufactured 495/2,079** of them at five days, so the sequence is "
"part of the ruling. **D125 amended** made the fourth run conditional on `_nrcSpacedRunDays`'s **full objective** (coach "
"withdrew the collision-only variant from its own ruling) and relaxed the long run from a pin to a preference, because a pin "
"fails closed and a closed fail means no fourth run at all. **D129 and its addendum** wrote the rest out as ranks with "
"coaching reasons attached — **6 identity, 7 spread, 8 rest into the long run, 9 earliest first quality**, all pace-gated — "
"and corrected `recBeforeLong`'s Sunday-first lens for the pace family only. **D130 and its amendment is the one Mario's "
"refusal produced.** He would not take a remedy validated on his own rest pattern (*\"i wanna make sure that fixes that and "
"not JUST my sunday wednesday off day\"*), so the deliverable became the **general table across all 64 rest-day calendars** — "
"and the general table found what a narrow one never could: at four training days a CHI on the long-run eve is **structurally "
"unavoidable on 14 of 64**. Rank 1 therefore **split by TYPE**: `-untolerated` then `-tolerated`, with untolerated held at an "
"absolute **0** and the tolerated class recorded as a **FLOOR the chooser must reach**, not a ceiling it may miss. `-coll` "
"left the key entirely, because one total that mixes a tolerated pair with an untolerated one cannot rank them. Measured "
"after: untolerated **0/6,336**; tolerated **1,386/6,336** = exactly **14 calendars × 9 seeds × 11 weeks**, **0 on the other "
"50**. **D128** was the doctrine half: the CHI ladder was an **unsourced V115 hand ramp** topping out at **3 × 20 = 60 min**, "
"and Guide B's **Table 6** is the only ramp either guide states in full — rule against the table, not the prose. Reading it "
"at `Math.min(week, 26)` **IS** the \">26 do not increase\" row, so the `isMilGoal && week > 26` limb was **deleted rather "
"than re-pointed**. Mario's block loses **90 minutes** of threshold work (**179 → 89**, W11 **60 → 20**) and he took the "
"reduction because what it replaces was invented. **Bike forked off byte-identical** (no guide covers cycling; 1,872 of 2,664 "
"bike CHI cards still sit above Table 6 on an unsourced ramp, disclosed in §12), **swim took the rep tier only** (it is "
"prescribed in yards; minutes would prescribe a second dimension). GREEN: **seven new gates, 238 assertions, FAIL 0**; "
"sabotage **35/35 TRIPPED across five specs, 0 SURVIVED, 0 NOT-APPLIED, 0 CRASH**; `HALF_MANNY` **UNMOVED** at "
"`7d4f7ed45cc5bd53`, all three era tables carrying `[205]` REFERENCE rows verified by rebuilding every arm on both artifacts "
"in one run. **Two tooling findings worth more than the gate count. (1) A gate can pass by NOT RUNNING**: a licence keyed on "
"a feature EXISTING is disarmed by deleting that feature, which is exactly what a sabotage mutation does — the sweep was "
"re-run on the bumped artifact with **`PASS 0 FAIL 0` read as a failure**. **(2) A faithfully re-anchored mutation can be a "
"no-op** when a ruling makes its branch unreachable; it must be re-aimed at the live predicate, not just re-anchored. "
"**NOT SHIPPED, by Mario's call: D113 and D122.** Measure found D113's three-hard-run week ships an untolerated adjacency on "
"**2,070/13,248** weeks, **all of it multi-sport**, because multi-sport never enters the solo chooser and so got neither the "
"typed split nor the relaxed pin — *\"ship V205 without D113, and give D113 its own version\"*, on the reasoning that "
"finishing what is proven beats widening a ruling on the last slice. **The session's retractions, recorded because they are "
"the most useful part of it:** coach's three named five-day losers were an ordering error (the real set is `mon+tue`, "
"`mon+thu`, `wed+thu`); \"squats on the eve\" was corrected to \"deadlifts\" and then measured at **1,782 legs versus 198 "
"pull**, so the original instinct was right and the correction was wrong; \"42 movers become 32\" was arithmetic and the "
"count is **23**; the day-set floor assertion was refuted and re-worded to hard sessions; \"run and swim read the table\" was "
"wrong because swim has no minutes consumer; `run_base` was named in a blast radius holding **0 CHI cards**; \"0 tolerated "
"preferred\" was unreachable; coach's `mon,tue,wed` worked example is not what its own objective selects; and the D127 legs "
"cost was 2, 4 or 5, never 1. **Two of them were mine:** I briefed that the subset relaxation rescued five calendars when it "
"rescues **zero**, and that NRC relied on the INT/CHI crossover when **swim** is its only consumer. §10b, §11f, §12."
)
E('E6 digest line', HO, '\n- **V204 — the clock that printed', '\n' + DIGEST + '\n\n- **V204 — the clock that printed')

# ───────────────────────── COMMENT FIX — g205_d130_typed.js ─────────────────────────
E('G1 comment era', GATE,
  '// D130 is authored at ia-version 204 (slice 7a carries no bump) and every claim below\n'
  '// holds from that artifact forward. Below 204 there is no split rank to defend.',
  '// D130 SHIPS AT ia-version 205 and every claim below holds from that artifact forward.\n'
  '// Below 205 there is no split rank to defend. (The engine edit landed in slice 7a, which\n'
  '// carried no version bump - that is why an earlier draft of this comment read 204. The\n'
  '// bump is slice 8, so 205 is the first artifact that carries D130 and the predicate below\n'
  '// is keyed on it.)')

# ───────────────────────── apply ─────────────────────────
bufs = {}
for label, path, old, new in EDITS:
    if path not in bufs: bufs[path] = rd(path)

bufs[HO] = elem1(bufs[HO])
print('OK   E1a working-file line -> V205')

for label, path, old, new in EDITS:
    n = bufs[path].count(old)
    if n != 1:
        print('ABORT %s: anchor count==%d in %s' % (label, n, os.path.basename(path)))
        sys.exit(1)
    bufs[path] = bufs[path].replace(old, new, 1)
    print('OK   %s' % label)

for path, s in bufs.items():
    wr(path, s)
    print('WROTE %s' % path)
