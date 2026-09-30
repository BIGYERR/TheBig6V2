#!/usr/bin/env python3
"""
V225 slice 1: D186 P-CLOCKEND
buildRunProgressionForLength (run_pace_goal branch): N build weeks are N-1
steps between week 1 and week N. The taper never introduces a faster target,
it holds the block's last build-week pace. Divide the gap over N-1 steps so
week N lands on target instead of overshooting by one step.

E1 :3759 rawImprovement divisor buildWeeks -> Math.max(buildWeeks - 1, 1)
E2 :3772 realisticTargetPace multiplier buildWeeks -> Math.max(buildWeeks - 1, 0)
Comment rewrite at :3757-3758 citing D186.

This slice touches ONLY these three anchors. It does not touch the D101 cap,
the INT note, or any other lines in this function.
"""
import pathlib

PATH = pathlib.Path("/Users/CanasBangin/Desktop/TheBig6V2/index.html")

src = PATH.read_text(encoding="utf-8")

em = chr(0x2014)  # em dash, built in code per standing rule, never typed as escape literal

# --- E1 + comment rewrite (combined: comment immediately precedes rawImprovement line) ---
anchor1 = (
    "    // Raw linear improvement per week over the full build block (not total "
    + em
    + " taper doesn't improve pace)\n"
    "    const rawImprovement = (initialPace - targetPace) / Math.max(buildWeeks, 1);"
)
assert src.count(anchor1) == 1, f"E1 anchor count != 1: {src.count(anchor1)}"

replacement1 = (
    "    // D186 (V225): N build weeks are N-1 steps between week 1 and week N.\n"
    "    // The taper is a primer, it holds the pace the block built and cuts the\n"
    "    // volume; it never introduces a faster target. The block target IS the\n"
    "    // last build week's pace, so the gap is divided over N-1 steps, not N,\n"
    "    // or week N overshoots past the entered target by one step.\n"
    "    const rawImprovement = (initialPace - targetPace) / Math.max(buildWeeks - 1, 1);"
)
src = src.replace(anchor1, replacement1, 1)

# --- E2 ---
anchor2 = "    const realisticTargetPace = initialPace - (weeklyImprovement * buildWeeks);"
assert src.count(anchor2) == 1, f"E2 anchor count != 1: {src.count(anchor2)}"

replacement2 = "    const realisticTargetPace = initialPace - (weeklyImprovement * Math.max(buildWeeks - 1, 0));"
src = src.replace(anchor2, replacement2, 1)

PATH.write_text(src, encoding="utf-8")
print("V225 slice 1 (D186 E1/E2 + comment) applied.")
