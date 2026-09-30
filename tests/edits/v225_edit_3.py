#!/usr/bin/env python3
"""
V225 slice 3: D187's 4th reader site + R4 (run-side copy guard, coach amendment)
+ R5 (swim-side plain deletion, no guard).

4th reader: delete `const expPaceImprove = {beginner:3, intermediate:5, advanced:7};`
inside the run_pace_goal param-injection block (last surviving literal copy of the
table), rewrite baseImprove to read PACE_IMPROVE.

R4: coach's amendment adds a copy guard. On 20 lattice cells, after D186's clock
fix, goalFmt and reachFmt round to the identical m:ss string at the printed grain,
so "your goal needs more weeks" followed immediately by handing over that exact
same pace is a contradiction. The guard drops the "needs more weeks" sentence when
the two formatted strings are identical. "safely"/"safe rate" wording is removed
from both branches.

R5: swim-side gets a plain deletion of "That is the safe rate for your experience
and age. " with NO guard added -- coach explicitly ruled no swim cell has been
shown to trigger the sameFmt condition, so a guard there would be a dead, unverified
branch (left to a future P-SWIMCLOCKEND ruling, tracked in handoff §12).
"""
import pathlib

PATH = pathlib.Path("/Users/CanasBangin/Desktop/TheBig6V2/index.html")

src = PATH.read_text(encoding="utf-8")

# --- 4th reader site: delete expPaceImprove declaration ---
anchor_decl = (
    "    const expPaceImprove  = {beginner:3, intermediate:5, advanced:7};\n"
    "    const agePaceScale    = {'55+':0.65, '36-54':0.85, '18-35':1.0};"
)
assert src.count(anchor_decl) == 1, f"expPaceImprove decl anchor count != 1: {src.count(anchor_decl)}"
replacement_decl = "    const agePaceScale    = {'55+':0.65, '36-54':0.85, '18-35':1.0};"
src = src.replace(anchor_decl, replacement_decl, 1)

# --- 4th reader site: rewrite baseImprove ---
anchor_base = "    const baseImprove = expPaceImprove[experience||'intermediate'] || 5;"
assert src.count(anchor_base) == 1, f"baseImprove anchor count != 1: {src.count(anchor_base)}"
replacement_base = "    const baseImprove = PACE_IMPROVE[experience||'intermediate'] || PACE_IMPROVE.intermediate;"
src = src.replace(anchor_base, replacement_base, 1)

# --- R4: run-side copy guard (coach amendment) ---
anchor_r4 = (
    "note = `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. "
    "That is the safe rate for your experience and age. "
    "Your full goal of ${goalFmt}/mi needs more weeks than this block has. "
    "The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;"
)
assert src.count(anchor_r4) == 1, f"R4 anchor count != 1: {src.count(anchor_r4)}"
replacement_r4 = (
    "const _sameFmt = goalFmt === reachFmt;   // D186: at the m:ss grain the block lands on the goal. "
    "Do not say the goal needs more weeks and then hand it over.\n"
    "            note = _sameFmt\n"
    "              ? `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. "
    "The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`\n"
    "              : `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. "
    "Your full goal of ${goalFmt}/mi needs more weeks than this block has. "
    "The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;"
)
src = src.replace(anchor_r4, replacement_r4, 1)

# --- R5: swim-side plain deletion, NO guard added ---
anchor_r5 = (
    "note = _anchorLine + `INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. "
    "That is the safe rate for your experience and age. "
    "Your full goal of ${_goalPhrase} needs more weeks than this block has. "
    "The target for this block is ${fmt(_reachSplit)}/100. Hit the prescribed split precisely.`;"
)
assert src.count(anchor_r5) == 1, f"R5 anchor count != 1: {src.count(anchor_r5)}"
replacement_r5 = (
    "note = _anchorLine + `INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. "
    "Your full goal of ${_goalPhrase} needs more weeks than this block has. "
    "The target for this block is ${fmt(_reachSplit)}/100. Hit the prescribed split precisely.`;"
)
src = src.replace(anchor_r5, replacement_r5, 1)

PATH.write_text(src, encoding="utf-8")
print("V225 slice 3 (4th reader + R4 guard + R5 plain deletion) applied.")
