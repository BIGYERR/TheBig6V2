#!/usr/bin/env python3
# V226 slice 7a2 of 7: four era rows on existing gates. Tests only; index.html is not touched.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE,
# accepted by Mario 2026-09-30, "all yes"), Blast radius Class A1, A2, B and F, and the Copy section.
# Every touched row keeps its old expectation at ia-version <= 225 and gains the ruled one at >= 226
# (standing rulings 2, 3, 4). New expectations are hand chart values, hand counts or typed literals from
# the ruling, never engine output.
#   1. g202_pace_anchor.js   P1/P1b/P1d, D188 Class A1: the V172 "beginners ignore their mile" rule is
#                            repealed from 226. Oracle: the gate's own hand chart (HAND_CHART, handRow,
#                            handRowPaceAt) and the typed literal 370.73 for the 6:00 cell at 1.5 mi.
#   2. g204_clock_limb.js    C8, D188 E2 (Class F): _clkMS call sites 27 -> 26 from 226. Hand count, the one
#                            deleted site is paceCeilingSentence's beginner line (V225 :2459, _clkMS(f.cur)).
#   3. g209_d140_tier.js     K1, D188 Class A2 (licensed by Mario 2026-09-30, a2): the beginner-with-a-mile
#                            carry case moves to tier C (under 45 min); K1b holds the population bound.
#   4. g225_d187_pacerate.js CONFINEMENT, D189 Class B: strip the S1 suffix (Copy "S1", typed) from the one
#                            W1 note and the program equals the baseline's.
# All anchors count==1 at the moment they are replaced, or nothing is written (every file is written
# together, only after every assertion passed).
import sys

ROOT = "/Users/CanasBangin/Desktop/TheBig6V2/"
FILES = {
    "anchor": ROOT + "tests/gates/g202_pace_anchor.js",
    "clock": ROOT + "tests/gates/g204_clock_limb.js",
    "tier": ROOT + "tests/gates/g209_d140_tier.js",
    "rate": ROOT + "tests/gates/g225_d187_pacerate.js",
}
SRC = {k: open(p, encoding="utf-8").read() for k, p in FILES.items()}


def die(msg):
    sys.stderr.write("ABORT " + msg + "; nothing written\n")
    sys.exit(1)


def rep(key, old, new, label):
    n = SRC[key].count(old)
    if n != 1:
        die("%s: anchor count %d (want 1)" % (label, n))
    SRC[key] = SRC[key].replace(old, new, 1)


def wrap(key, start, end, fn, label):
    """Replace the text from `start` (inclusive) up to `end` (exclusive) with fn(old). Both markers count==1."""
    s = SRC[key]
    for m in (start, end):
        if s.count(m) != 1:
            die("%s: marker count %d (want 1) for %r" % (label, s.count(m), m[:60]))
    i, j = s.index(start), s.index(end)
    if j <= i:
        die("%s: end marker precedes start marker" % label)
    old = s[i:j]
    new = fn(old)
    rep(key, old, new, label)


# ── 1. g202_pace_anchor.js: P1 / P1b / P1d ───────────────────────────────────────────────────────
rep("anchor",
    "let p1bad = [], p1beg = 0, p1nonbeg = 0;\n"
    "for(const r of rows){\n"
    "  const anchorMile = r.exp === 'beginner' ? EXP_DEFAULT.beginner : hand.secs(r.mb[0], r.mb[1]);\n",
    "// ERA (standing rulings 2 and 4), keyed to D188 P-BEGINNERMILE Class A1 (tests/measure/v226_rulings/\n"
    "// d188_d189_ruling.md). At ia-version <= 225 the V172 rule holds: a beginner's entered mile is ignored and he\n"
    "// anchors on the 690 row. From 226 D188 repeals it (E3/E4/E5 read a beginner's mile like anyone's), so every\n"
    "// level anchors on the entered mile's own row. P1, P1b and P1d read the anchor through this one switch; P1c\n"
    "// (non-beginners) is the same rule on both sides of the line.\n"
    "const D188_ERA = 226;\n"
    "const D188_ON = +IA.version >= D188_ERA;\n"
    "let p1bad = [], p1beg = 0, p1nonbeg = 0;\n"
    "for(const r of rows){\n"
    "  const anchorMile = (r.exp === 'beginner' && !D188_ON) ? EXP_DEFAULT.beginner : hand.secs(r.mb[0], r.mb[1]);\n",
    "g202 P1 anchor switch")
rep("anchor",
    "  + `distance — the entered mile's row for every non-beginner, the 690 row for every beginner: `\n",
    "  + (D188_ON ? `distance — the entered mile's row at every level, beginners included (D188, ia-version ${IA.version} >= ${D188_ERA}): `\n"
    "            : `distance — the entered mile's row for every non-beginner, the 690 row for every beginner: `)\n",
    "g202 P1 label")


def p1b(old):
    return (
        "if(!D188_ON){\n"
        + old
        + "} else {\n"
        "  // D188 Class A1 (V226) repeals the V172 rule: a beginner's entered mile is read like anyone's.\n"
        "  // ORACLE: the hand chart value, not a differential against another engine cell. Every beginner build\n"
        "  // must sit on its OWN entered mile's row read at its goal distance (HAND_CHART, handRow, handRowPaceAt,\n"
        "  // typed above), none may sit on the 690 row (all four entered miles are faster than 11:30, so on the\n"
        "  // hand chart each reads a different pace at every goal distance), and the 6:00 cell at a 1.5 mi goal\n"
        "  // reads the typed literal 370.73 for the beginner exactly as for the intermediate:\n"
        "  //   360 + (390 - 360) × ln 1.5 / ln 3.107 = 360 + 30 × 0.405465 / 1.133657 = 370.73\n"
        "  // (the 6:00 row's mile and 5K columns, log-interpolated by hand), not the 690 row's 706.09.\n"
        "  // Hand counts: 120 beginner builds (3 age × 2 unit × 4 mile × 5 goal); 12 cells at 6:00 and 1.5 mi\n"
        "  // (beginner and intermediate × 3 age × the two 1.5 mi goals).\n"
        "  const BEG_600_15MI = 370.73;\n"
        "  const beg = rows.filter(r => r.exp === 'beginner');\n"
        "  const offOwn = beg.filter(r => Math.abs(r.pp.ip - handRowPaceAt(handRow(hand.secs(r.mb[0], r.mb[1])), r.handDist)) > 1e-9);\n"
        "  const on690 = beg.filter(r => Math.abs(r.pp.ip - handRowPaceAt(handRow(EXP_DEFAULT.beginner), r.handDist)) < 1e-9);\n"
        "  const c600 = rows.filter(r => (r.exp === 'beginner' || r.exp === 'intermediate') && r.mb[0] === '6' && r.mb[1] === '00'\n"
        "    && r.unit === 'mi' && r.goal.targetDist === '1.5');\n"
        "  const c600bad = c600.filter(r => Math.abs(r.pp.ip - BEG_600_15MI) > 0.005);\n"
        "  ok(beg.length === 120 && offOwn.length === 0 && on690.length === 0 && c600.length === 12 && c600bad.length === 0,\n"
        "    `P1b D188 era (ia-version ${IA.version} >= ${D188_ERA}): the V172 beginner rule is repealed. All ${beg.length} `\n"
        "    + `beginner builds anchor on their own entered mile's chart row (hand chart value), ${on690.length} on the 690 row, `\n"
        "    + `and the 6:00 cell at a 1.5 mi goal reads ${BEG_600_15MI} for the beginner as for the intermediate `\n"
        "    + `(${c600.length - c600bad.length} of ${c600.length} cells), not 706.09`\n"
        "    + (offOwn.length ? ' — first off its own row: ' + `${offOwn[0].mb.join(':')}/${offOwn[0].handDist.toFixed(4)} mi got ${offOwn[0].pp.ip}` : '')\n"
        "    + (c600bad.length ? ' — first 6:00 miss: ' + `${c600bad[0].exp}/${c600bad[0].age} got ${c600bad[0].pp.ip}` : ''));\n"
        "}\n"
    )


wrap("anchor", "const p1bBad = rows.filter(r => r.exp === 'beginner')\n", "const p1cBad = rows.filter(r => r.exp !== 'beginner')", p1b,
     "g202 P1b era")
rep("anchor",
    "ok(p1dBad.length === 0, `P1d the anchor equals the mile column at or below one mile (${p1dShort} builds) `\n",
    "ok(p1dBad.length === 0, `P1d the anchor equals the mile column at or below one mile (${p1dShort} builds; `\n"
    "  + (D188_ON ? `the entered mile's column at every level, D188` : `the 690 column for beginners, V172`) + `) `\n",
    "g202 P1d label")

# ── 2. g204_clock_limb.js: C8 ────────────────────────────────────────────────────────────────────
rep("clock",
    "//             (achievablePacePerMile / applySuggestedPace), which held the safeTotal pair.\n",
    "//             (achievablePacePerMile / applySuggestedPace), which held the safeTotal pair.\n"
    "//   226 on:   26, round-OUTSIDE stays 0. D188 E2 (V226, Class F) deleted paceCeilingSentence's beginner\n"
    "//             line, which held exactly one call: _clkMS(f.cur) in \"Your paces start from the beginner\n"
    "//             default of ... per mile.\" (V225 :2459). Hand count: 27 - 1 = 26.\n",
    "g204 C8 era comment")
rep("clock",
    "  { from: 223, to: Infinity, calls: 27, outside: 0, why: 'D183 (V223)",
    "  { from: 223, to: 225,      calls: 27, outside: 0, why: 'D183 (V223)",
    "g204 C8 223 row closes at 225")
lines = [l for l in SRC["clock"].split("\n") if l.startswith("  { from: 223, to: 225,      calls: 27,")]
if len(lines) != 1:
    die("g204 C8 223 row: line count %d (want 1)" % len(lines))
rep("clock", lines[0] + "\n",
    lines[0] + "\n"
    "  { from: 226, to: Infinity, calls: 26, outside: 0, why: 'D188 E2 (V226, Class F) deleted the paceCeilingSentence beginner line and its one call, _clkMS(f.cur) at V225 :2459: 27 - 1' },\n",
    "g204 C8 226 row")

# ── 3. g209_d140_tier.js: K1 ─────────────────────────────────────────────────────────────────────
def k1(old):
    return (
        "  if(VER < D188_ERA){\n"
        + old
        + "  } else {\n"
        "    // D188 P-BEGINNERMILE Class A2 (tests/measure/v226_rulings/d188_d189_ruling.md), LICENSED by Mario\n"
        "    // 2026-09-30 (a2): more lifting, less rest, beginners with a mile only. The beginner's entered 8:15 is\n"
        "    // now read, the anchor is faster than the 11:30 default, the long run's time on feet shortens and this\n"
        "    // day leaves tier B for tier C. The row asserts the direction only (tier C by the gate's own dose\n"
        "    // arithmetic, time on feet under 45, no carry) and the licence's population predicate (a beginner\n"
        "    // carrying a mile); it never pins a minutes value read off this engine. K1b holds the bound from the\n"
        "    // other side: the same beginner with no mile is unmoved (D188 Class A3, byte-identical but for D189's\n"
        "    // W1 note), so W6 Fri stays measure's typed carry case above.\n"
        "    const rg = cc.cardioGoals.run;\n"
        "    const pop = cc.experience === 'beginner' && rg.id === 'run_pace_goal' && !!rg.mileBestMins && +rg.mileBestMins > 0;\n"
        "    ok('K1 D188 era (ia-version ' + VER + ' >= ' + D188_ERA + ', Class A2 licensed 2026-09-30): the carry case is a beginner with a mile (' + rg.mileBestMins + ':' + rg.mileBestSecs + ') and its W6 Fri long run moves to tier C, under 45 min on feet, no carry',\n"
        "       pop && handTier(day.cardio) === 'C' && m < 45 && carryN(day) === 0,\n"
        "       'population ' + pop + ', ' + m + ' min, tier ' + handTier(day.cardio) + ', ' + carryN(day) + ' carry');\n"
        "    const nm = cl(cc); nm.cardioGoals.run.mileBestMins = ''; nm.cardioGoals.run.mileBestSecs = ''; delete nm.cardioGoals.run.mileBestSrc;\n"
        "    const d0 = IA.buildProgram(cl(nm)).weeks[6].fri;\n"
        "    const m0 = +minutesOf(d0.cardio && d0.cardio.dose).toFixed(1);\n"
        "    ok('K1b D188 population bound: the same beginner with NO mile is unmoved (Class A3), W6 Fri stays measure\\'s carry case: 56.4 min, tier B, no carry, the strength pair only',\n"
        "       m0 === 56.4 && handTier(d0.cardio) === 'B' && carryN(d0) === 0 && shape(d0) === '[Strength] Dips, Inverted rows (rings)',\n"
        "       m0 + ' min, tier ' + handTier(d0.cardio) + ', ' + carryN(d0) + ' carry, ' + shape(d0));\n"
        "  }\n"
    )


wrap("tier", "  ok('K1 carry case (crossfit, balanced, beginner, rest sat+sun, seed 24865)",
     "  if(PAIR){\n    const b = IB.buildProgram(cl(cc)).weeks[6].fri;", k1, "g209 K1 era")
rep("tier",
    "const D140_ERA = 209;\n",
    "const D140_ERA = 209;\n"
    "// D188 P-BEGINNERMILE (V226) Class A2 re-keys K1 from 226 (standing rulings 2 and 4): the carry case is a\n"
    "// beginner carrying an 8:15 mile, which D188 reads. <= 225 keeps measure's literal.\n"
    "const D188_ERA = 226;\n",
    "g209 D188_ERA")

# ── 4. g225_d187_pacerate.js: CONFINEMENT ────────────────────────────────────────────────────────
def conf(old):
    return (
        "    if(VER < D189_ERA){\n"
        + old
        + "    } else {\n"
        "    // ERA ROW (standing rulings 2 and 4), keyed to D189 P-PACEDISCLOSE Class B (tests/measure/v226_rulings/\n"
        "    // d188_d189_ruling.md): from 226 every no-mile program gains the S1 suffix on ONE W1 run card's note\n"
        "    // and nothing else on the grid moves. Of these seven cells only run_base carries no mile (HALF_MANNY is\n"
        "    // intermediate), so the hand expectation is: run_base carries exactly one S1 suffix, on a week 1 note,\n"
        "    // after a non-empty prefix and one space; every other cell carries none. Strip it and each program equals\n"
        "    // the baseline's. The suffix is typed from the ruling's Copy section (S1) at the intermediate level,\n"
        "    // never read from the engine. The strip runs on both sides, so a baseline at 226 or later (which carries\n"
        "    // the note too) compares like for like; a baseline at 225 or earlier must carry none. Seed pinned by\n"
        "    // HALF_MANNY, clock fields stripped by progDigest, the baseline proven equal to itself before the diff,\n"
        "    // and an empty pre-strip diff on run_base against a pre-226 baseline is a failure.\n"
        "    const S1_SUFFIX = 'Paces here start from a 9:30 mile, the intermediate default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';\n"
        "    const S1_CELLS = { run_base: 1 };\n"
        "    const BASE_VER = +BASE.version;\n"
        "    const s1Strip = prog => {\n"
        "      const hits = [];\n"
        "      (function walk(o, pth){\n"
        "        if(!o || typeof o !== 'object') return;\n"
        "        for(const k of Object.keys(o)){\n"
        "          const v = o[k], p = pth.concat(k);\n"
        "          if(typeof v === 'string'){ if(v.indexOf(S1_SUFFIX) >= 0) hits.push({ o, k, p, v }); }\n"
        "          else walk(v, p);\n"
        "        }\n"
        "      })(prog, []);\n"
        "      const bad = [];\n"
        "      for(const h of hits){\n"
        "        const placed = h.p[0] === 'weeks' && h.p[1] === '1' && h.k === 'note'\n"
        "          && h.v.length > S1_SUFFIX.length + 1 && h.v.slice(-(S1_SUFFIX.length + 1)) === ' ' + S1_SUFFIX;\n"
        "        if(!placed) bad.push(h.p.join('.') + ' = ' + JSON.stringify(h.v.slice(0, 90)));\n"
        "        else h.o[h.k] = h.v.slice(0, h.v.length - S1_SUFFIX.length - 1);\n"
        "      }\n"
        "      return { n: hits.length, bad, where: hits.map(h => h.p.join('.')) };\n"
        "    };\n"
        "    const diffs = [], moved = [];\n"
        "    for(const [goalId, over] of Object.entries(goalCfgs)){\n"
        "      const cfg = Object.assign(JSON.parse(JSON.stringify(CFG0)), over);\n"
        "      let pA = null, pB = null, pB2 = null, err = null;\n"
        "      try { pA = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch(e){ err = 'candidate: ' + e.message; }\n"
        "      try { pB = BASE.buildProgram(JSON.parse(JSON.stringify(cfg))); pB2 = BASE.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch(e){ err = (err ? err + '; ' : '') + 'baseline: ' + e.message; }\n"
        "      if(err){ diffs.push(goalId + ' CRASH ' + err); continue; }\n"
        "      if(H.progDigest(pB) !== H.progDigest(pB2)){ diffs.push(goalId + ' the baseline does not equal itself'); continue; }\n"
        "      const want = S1_CELLS[goalId] || 0, wantB = BASE_VER >= D189_ERA ? want : 0;\n"
        "      const dA0 = H.progDigest(pA), dB0 = H.progDigest(pB);\n"
        "      const sA = s1Strip(pA), sB = s1Strip(pB);\n"
        "      if(sA.n !== want) diffs.push(goalId + ' candidate carries ' + sA.n + ' S1 suffix(es), want ' + want + (sA.where.length ? ' (' + sA.where.join(', ') + ')' : ''));\n"
        "      if(sB.n !== wantB) diffs.push(goalId + ' baseline V' + BASE_VER + ' carries ' + sB.n + ' S1 suffix(es), want ' + wantB);\n"
        "      sA.bad.concat(sB.bad).forEach(b => diffs.push(goalId + ' S1 off its ruled place (a W1 note, after a prefix): ' + b));\n"
        "      if(want && !wantB && dA0 === dB0) diffs.push(goalId + ' empty diff before the strip: the S1 note never moved the program');\n"
        "      const dA = H.progDigest(pA), dB = H.progDigest(pB);\n"
        "      if(dA !== dB) diffs.push(goalId + ' after the S1 strip candidate ' + dA + ' != baseline ' + dB);\n"
        "      else if(want) moved.push(goalId + ' ' + dA0 + ' -> strip at ' + sA.where.join(', ') + ' -> ' + dA);\n"
        "    }\n"
        "    ok('CONFINEMENT D189 era (ia-version ' + VER + ' >= ' + D189_ERA + ', Class B): strip the S1 suffix from the one W1 note and every cell equals the baseline V' + BASE_VER + ' (swim/bike/run_base/NRC)',\n"
        "       diffs.length === 0, diffs.join(' | ') || (Object.keys(goalCfgs).length + ' goal types identical after the strip; ' + moved.join('; ')));\n"
        "    }\n"
    )


wrap("rate", "    const diffs = [];\n    for(const [goalId, over] of Object.entries(goalCfgs)){\n",
     "  }\n}\n\ndone();", conf, "g225 CONFINEMENT era")
rep("rate",
    "const ERA = 225;\n",
    "const ERA = 225;\n"
    "// D189 P-PACEDISCLOSE (V226) Class B re-keys CONFINEMENT from 226 (standing rulings 2 and 4): run_base's one\n"
    "// W1 note gains the S1 suffix. <= 225 keeps the byte-identical digest row.\n"
    "const D189_ERA = 226;\n",
    "g225 D189_ERA")

for k, p in FILES.items():
    open(p, "w", encoding="utf-8").write(SRC[k])
print("v226_edit_7a2: 4 files written:", ", ".join(FILES[k] for k in FILES))
