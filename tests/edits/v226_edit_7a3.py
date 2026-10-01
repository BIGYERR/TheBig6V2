#!/usr/bin/env python3
# V226 slice 7a3: one dead pin wired and three per-version reference rows. Tests only; index.html is not touched.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE, accepted by
# Mario 2026-09-30), D188 "Blast radius -> Tests" (g202_pace_copy.js:195) and the HALF_MANNY section.
# Four edits (one per file):
#   1. g202_pace_copy.js       DEAD PIN WIRED (standing ruling 3), keyed to D188 (standing ruling 4): C7's tail
#                              exemption read the engine's `v.kind !== 'beginner'`, which D188 E7 makes always
#                              true from 226. <= 225 keeps it; >= 226 is a hand oracle typed from FORMS' mile.
#   2. g193_samecard.js        OPEN_UNRULED_BY_VERSION[226] = [225]   (reference row)
#   3. g197b_sweep.js          HF_LEAK_BY_VERSION[226] = [225] (B4i-l), B5C_BY_VERSION[226] = [225] (B5c)
#   4. g199_deload_arbitration DELOAD_ARB / E6 / DELOAD_HINGE _BY_VERSION[226] = [225]
# Rows 2 to 4 are routine per-version table upkeep (session decision, V226 build 5): every value each table
# compares was printed equal to [225] on the V226 working tree by builder, with this script run against scratch
# copies, before the rows were written. They are references, never copies of numbers.
# Every anchor asserts count==1; every file is written together, only after every assertion passed.
# Usage: python3 v226_edit_7a3.py [ROOT]   (ROOT defaults to the repo; a scratch tree is used for the pre-check)
import sys

ROOT = (sys.argv[1] if len(sys.argv) > 1 else "/Users/CanasBangin/Desktop/TheBig6V2").rstrip("/") + "/"
FILES = {
    "copy": ROOT + "tests/gates/g202_pace_copy.js",
    "g193": ROOT + "tests/gates/g193_samecard.js",
    "g197b": ROOT + "tests/gates/g197b_sweep.js",
    "g199": ROOT + "tests/gates/g199_deload_arbitration.js",
}
SRC = {k: open(p, encoding="utf-8").read() for k, p in FILES.items()}


def rep(key, old, new, label):
    n = SRC[key].count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count %d (want 1); nothing written\n" % (label, n))
        sys.exit(1)
    SRC[key] = SRC[key].replace(old, new, 1)


def after_line(key, prefix, newline, label):
    lines = [l for l in SRC[key].split("\n") if l.startswith(prefix)]
    if len(lines) != 1:
        sys.stderr.write("ABORT %s: line-prefix count %d (want 1); nothing written\n" % (label, len(lines)))
        sys.exit(1)
    rep(key, lines[0] + "\n", lines[0] + "\n" + newline + "\n", label)


UPKEEP = ("routine per-version table upkeep, session decision for V226 build 5: D188 reads a beginner's mile and "
          "D189 discloses a default anchor, and no value this table compares moved; printed equal to [225] on the "
          "V226 working tree (slices 1 to 6 landed) by builder with this gate before this row")

# ── 1. g202_pace_copy.js: the dead pin, wired ────────────────────────────────────────────────────
rep("copy",
    "const CHART_IDS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'];\n",
    "const CHART_IDS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'];\n"
    "// D188 ERA (standing rulings 2, 3 and 4; tests/measure/v226_rulings/d188_d189_ruling.md, D188 Blast radius ->\n"
    "// Tests: \"g202_pace_copy.js:195 ... hand oracles `exp !== 'beginner' && mileSecs` -> `mileSecs` from 226\").\n"
    "// :195 is the 'beginner' FORM above, a beginner with an 8:15 mile. C7 below exempted it from the tail by\n"
    "// reading the engine's `v.kind !== 'beginner'`; D188 E7 retires the kind 'beginner' writer, so from 226 that\n"
    "// read is always true and could not tell a mile that is read from one that is ignored. It is WIRED, not\n"
    "// re-pointed: <= 225 keeps the V202 exemption as it was read; >= 226 decides the tail from the hand-typed mile.\n"
    "// D188 E1: a form with a mile prints its entered, seeded or clamped sentence at every level, beginner\n"
    "// included, and takes the tail. D189 F9 retires the beginner sentence, so a form with no mile prints the level\n"
    "// default and takes the tail too. No form is exempt from 226.\n"
    "const D188_ERA = 226;\n",
    "g202 D188_ERA")
rep("copy",
    "    // the beginner form is ruled to end on its own sentence and take neither tail\n"
    "    if(v.kind !== 'beginner'){\n"
    "      const has = s.indexOf(wantPace ? RULED_PACE_TAIL : RULED_CHART_TAIL) >= 0;\n"
    "      const hasWrong = s.indexOf(wantPace ? RULED_CHART_TAIL : RULED_PACE_TAIL) >= 0;\n"
    "      if(!has || hasWrong) tailBad.push(`${gid}/${tag}/${exp}: |${s}|`);\n"
    "    }\n",
    "    // the beginner form is ruled to end on its own sentence and take neither tail (ia-version <= 225)\n"
    "    const mileSecs = (+mb.mileBestMins || 0) * 60 + (+mb.mileBestSecs || 0);   // hand, typed from FORMS\n"
    "    const tailRule = IAV >= D188_ERA ? (mileSecs ? 'D188 E1, the mile is read' : 'D189 F9, the level default')\n"
    "                                     : (v.kind !== 'beginner' ? 'V202 E5' : null);\n"
    "    if(tailRule){\n"
    "      const has = s.indexOf(wantPace ? RULED_PACE_TAIL : RULED_CHART_TAIL) >= 0;\n"
    "      const hasWrong = s.indexOf(wantPace ? RULED_CHART_TAIL : RULED_PACE_TAIL) >= 0;\n"
    "      if(!has || hasWrong) tailBad.push(`${gid}/${tag}/${exp} [${tailRule}]: |${s}|`);\n"
    "    }\n",
    "g202 C7 tail predicate")

# ── 2. g193_samecard.js ──────────────────────────────────────────────────────────────────────────
after_line("g193", "OPEN_UNRULED_BY_VERSION[225] = OPEN_UNRULED_BY_VERSION[224];",
    "OPEN_UNRULED_BY_VERSION[226] = OPEN_UNRULED_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; the Kettlebell swing 0 carries)",
    "g193 OPEN_UNRULED 226")

# ── 3. g197b_sweep.js ────────────────────────────────────────────────────────────────────────────
after_line("g197b", "HF_LEAK_BY_VERSION[225] = HF_LEAK_BY_VERSION[224];",
    "HF_LEAK_BY_VERSION[226] = HF_LEAK_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; neither ruling draws a lift item, the [225] 0/0 carries)",
    "g197b HF_LEAK 226")
after_line("g197b", "B5C_BY_VERSION[225] = B5C_BY_VERSION[224];",
    "B5C_BY_VERSION[226] = B5C_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; the [225] 0 carries)",
    "g197b B5C 226")

# ── 4. g199_deload_arbitration.js ────────────────────────────────────────────────────────────────
after_line("g199", "DELOAD_ARB_BY_VERSION[225] = DELOAD_ARB_BY_VERSION[224];",
    "DELOAD_ARB_BY_VERSION[226] = DELOAD_ARB_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; C1 264 C3 264 C5 0 D2 19 I3 18 carry)",
    "g199 DELOAD_ARB 226")
after_line("g199", "E6_BY_VERSION[225] = E6_BY_VERSION[224];",
    "E6_BY_VERSION[226] = E6_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; E6 28 carries)",
    "g199 E6 226")
after_line("g199", "DELOAD_HINGE_BY_VERSION[225] = DELOAD_HINGE_BY_VERSION[224];",
    "DELOAD_HINGE_BY_VERSION[226] = DELOAD_HINGE_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)",
    "g199 DELOAD_HINGE 226")

for k, p in FILES.items():
    open(p, "w", encoding="utf-8").write(SRC[k])
print("v226_edit_7a3: 4 files written:", ", ".join(FILES[k] for k in FILES))
