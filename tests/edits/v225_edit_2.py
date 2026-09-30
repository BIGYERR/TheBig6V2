#!/usr/bin/env python3
"""
V225 slice 2: D187 P-PACERATE, R1 + first three readers.

Finding: four literal copies of {beginner:3, intermediate:5, advanced:7} on
V224 (:2440, :3084, :3766-area, :3820) with disagreeing fallbacks (||4, ||5),
no doctrine source, wrong ordering vs HERITAGE/D110a, and 7 s/mi/wk promising
~14% improvement in a block. Mario ruled T1 (2026-09-23): rate =
{beginner:3, intermediate:3, advanced:2} s/mi/wk.

R1: declare PACE_IMPROVE at module scope beside PACE_GOALS.
R2 (partial, 3 of 4 reader sites): :2440, :3084, :3766-3768 area rewritten to
read PACE_IMPROVE. The 4th site (:3820/:3825, expPaceImprove/baseImprove
inside buildRunProgressionForLength) is deliberately left UNTOUCHED for
slice 3, bundled with the copy changes.
"""
import pathlib

PATH = pathlib.Path("/Users/CanasBangin/Desktop/TheBig6V2/index.html")

src = PATH.read_text(encoding="utf-8")

# --- R1: declare PACE_IMPROVE beside PACE_GOALS ---
anchor_decl = "const PACE_GOALS = new Set(['run_pace_goal', 'run_mile_time', 'run_15_under10']);"
assert src.count(anchor_decl) == 1, f"PACE_GOALS anchor count != 1: {src.count(anchor_decl)}"

replacement_decl = (
    anchor_decl
    + "\n"
    "// D187: seconds per mile per week, a planning rate, not a limit; the age scalers\n"
    "// multiply it; the same number sizes the undated block and caps the clock (D101).\n"
    "const PACE_IMPROVE = {beginner:3, intermediate:3, advanced:2};"
)
src = src.replace(anchor_decl, replacement_decl, 1)

# --- R2 site 1 (:2440) ---
anchor_2440 = "const paceImprove = {beginner:3, intermediate:5, advanced:7}[exp] || 4;"
assert src.count(anchor_2440) == 1, f":2440 anchor count != 1: {src.count(anchor_2440)}"
src = src.replace(
    anchor_2440,
    "const paceImprove = PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate;",
    1,
)

# --- R2 site 2 (:3084) ---
anchor_3084 = "const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;"
assert src.count(anchor_3084) == 1, f":3084 anchor count != 1: {src.count(anchor_3084)}"
src = src.replace(
    anchor_3084,
    "const paceImprove = PACE_IMPROVE[experience] || PACE_IMPROVE.intermediate;",
    1,
)

# --- R2 site 3 (:3766-3768 area, one hunk: delete expPaceImprove decl + rewrite maxPaceImprovementPerWeek) ---
anchor_3766 = (
    "    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};   // V176 (D9)\n"
    "    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek\n"
    "      || expPaceImprove[exp] || 5;"
)
assert src.count(anchor_3766) == 1, f":3766 area anchor count != 1: {src.count(anchor_3766)}"
replacement_3766 = (
    "    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek\n"
    "      || PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate;"
)
src = src.replace(anchor_3766, replacement_3766, 1)

# --- Reword the D101 comment above (comment only, not athlete copy) ---
anchor_d101 = "    // D101 (V202): ONE safe rate. The age-scaled table value set at the call site IS the cap."
assert src.count(anchor_d101) == 1, f"D101 comment anchor count != 1: {src.count(anchor_d101)}"
src = src.replace(
    anchor_d101,
    "    // D101 (V202): one planning rate. The age-scaled table value set at the call site IS the cap.",
    1,
)

PATH.write_text(src, encoding="utf-8")
print("V225 slice 2 (D187 R1 + 3 reader sites) applied.")
