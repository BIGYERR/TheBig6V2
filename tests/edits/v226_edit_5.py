#!/usr/bin/env python3
# V226 slice 5 of 7: D189 P-PACEDISCLOSE card and clipboard (classes C and F).
# F7 _CHART_RUN_GOALS gains run_base (+ its comment), F8 runAnchorChips run_base list,
# F9 runAnchorSentence block (run_base tail, default form with the level word, edited-from-
# default word, beginner branch deleted), F10 runAnchorLine provenance + pace-goal scope.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md, D189 F7-F10 (Mario, 2026-09-30).
# Readers of _CHART_RUN_GOALS: only runAnchorInfo. Readers of runAnchorInfo(: _mileFieldHelp
# (wizard helper) and progSelData (card block + progSelLines clipboard). No engine reads either.
# No ia-version bump in this slice (stays 225). Every anchor count==1 at the moment it is
# replaced, or nothing is written.
import sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = open(PATH, encoding="utf-8").read()

F9_OLD = (
    "  const tail = (a.goalId === 'run_pace_goal')\n"
    "    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'\n"
    "    : ' Every pace in this program comes from this row.';\n"
    "  if(a.clamped){\n"
    "    const raw = a.rawSec > 0 ? `the ${_fmtMileAnchor(a.rawSec)} you entered` : 'the mile time you entered';\n"
    "    const why = a.rawSec > 0 ? (a.clamped==='fast' ? 'is faster than the chart goes' : 'is slower than the chart goes') : 'is not a valid time';\n"
    "    return `Anchored on ${art} <b>${m} mile</b>, ${raw} ${why}, so its ${a.clamped==='fast'?'fastest':'slowest'} row is used.` + tail;\n"
    "  }\n"
    "  if(a.kind === 'seeded')   return `Anchored on ${art} <b>${m} mile</b>, worked back from ${a.n>0?a.n:'the'} recovery run${a.n===1?'':'s'} you logged in ${a.prog||'your last program'}.` + tail;\n"
    "  if(a.kind === 'edited' && a.from){\n"
    "    const from = a.from.kind === 'default' ? 'estimated from experience'\n"
    "               : _fmtMileAnchor((+a.from.mins||0)*60 + (+a.from.secs||0));\n"
    "    return `Anchored on ${art} <b>${m} mile</b>, the time you entered in week ${a.wk}. Before that it was ${from}.` + tail;\n"
    "  }\n"
    "  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;\n"
    "  if(a.kind === 'beginner') return `Anchored on ${art} <b>${m} mile</b>, the beginner default. A mile time starts being used at intermediate.`;\n"
    "  return `Anchored on ${art} <b>${m} mile</b>, estimated from experience; no mile time was entered.` + tail;\n"
    "}\n"
)
F9_NEW = (
    "  const tail = (a.goalId === 'run_pace_goal')\n"
    "    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'\n"
    "    : (a.goalId === 'run_base') ? ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'\n"
    "    : ' Every pace in this program comes from this row.';\n"
    "  if(a.clamped){\n"
    "    const raw = a.rawSec > 0 ? `the ${_fmtMileAnchor(a.rawSec)} you entered` : 'the mile time you entered';\n"
    "    const why = a.rawSec > 0 ? (a.clamped==='fast' ? 'is faster than the chart goes' : 'is slower than the chart goes') : 'is not a valid time';\n"
    "    return `Anchored on ${art} <b>${m} mile</b>, ${raw} ${why}, so its ${a.clamped==='fast'?'fastest':'slowest'} row is used.` + tail;\n"
    "  }\n"
    "  if(a.kind === 'seeded')   return `Anchored on ${art} <b>${m} mile</b>, worked back from ${a.n>0?a.n:'the'} recovery run${a.n===1?'':'s'} you logged in ${a.prog||'your last program'}.` + tail;\n"
    "  if(a.kind === 'edited' && a.from){\n"
    "    const from = a.from.kind === 'default' ? 'the '+a.exp+' default'\n"
    "               : _fmtMileAnchor((+a.from.mins||0)*60 + (+a.from.secs||0));\n"
    "    return `Anchored on ${art} <b>${m} mile</b>, the time you entered in week ${a.wk}. Before that it was ${from}.` + tail;\n"
    "  }\n"
    "  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;\n"
    "  return `Anchored on ${art} <b>${m} mile</b>, the ${a.exp} default. No mile time was entered. Tap the pencil to enter one.` + tail;\n"
    "}\n"
)

F10_OLD = (
    "             : a.kind==='entered' ? 'entered' : a.kind==='beginner' ? 'beginner default' : 'est. from experience';\n"
    "  const chips = runAnchorChips(a).slice(1).map(c=>`${c.k.toLowerCase()} ${c.v}`).join(' / ');\n"
    "  const scope = (a.goalId === 'run_pace_goal' && a.kind !== 'beginner') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';\n"
)
F10_NEW = (
    "             : a.kind==='entered' ? 'entered' : a.exp+' default, no mile time entered';\n"
    "  const chips = runAnchorChips(a).slice(1).map(c=>`${c.k.toLowerCase()} ${c.v}`).join(' / ');\n"
    "  const scope = (a.goalId === 'run_pace_goal') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';\n"
)

EDITS = [
    # F7 (V225 :14699): run_base joins the chart goals
    ("F7a",
     "const _CHART_RUN_GOALS = new Set(['run_half','run_marathon','run_5k','run_10k','run_pace_goal','run_mile_time','run_15_under10']);",
     "const _CHART_RUN_GOALS = new Set(['run_half','run_marathon','run_5k','run_10k','run_pace_goal','run_mile_time','run_15_under10','run_base']);"),
    # F7 comment (V225 :14704), same hunk
    ("F7b",
     "if(!g || !g.id || !_CHART_RUN_GOALS.has(g.id)) return null;      // run_base prints no pace (V157)",
     "if(!g || !g.id || !_CHART_RUN_GOALS.has(g.id)) return null;      // run_base easy runs pace off this row since V206 (D189)"),
    # F8 (V225 :14728): run_base prints Mile (+ Recovery pushed after, as today)
    ("F8",
     "  const list = [['Mile',r.mile],['5K',r.fiveK],['10K',r.tenK],['Tempo',r.tempo]];",
     "  const list = a.goalId==='run_base' ? [['Mile',r.mile]] : [['Mile',r.mile],['5K',r.fiveK],['10K',r.tenK],['Tempo',r.tempo]];"),
    # F9 (V225 :14740-:14760): runAnchorSentence, one block
    ("F9", F9_OLD, F9_NEW),
    # F10 (V225 :14766/:14768): runAnchorLine provenance + scope
    ("F10", F10_OLD, F10_NEW),
]

# Pre-check every anchor against the untouched source.
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit("ABORT %s: anchor count %d != 1; nothing written" % (name, n))
if src.count("'run_base']);") != 0:
    sys.exit("ABORT: run_base already in a Set literal tail; nothing written")

out = src
for name, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        sys.exit("ABORT %s: anchor count %d != 1 mid-run; nothing written" % (name, n))
    out = out.replace(old, new, 1)
    print("OK %s" % name)

# Post-conditions (comment-insensitive tokens checked by the proof, not here).
for tok in ("a.kind === 'beginner'", "a.kind==='beginner'", "a.kind !== 'beginner'", "'beginner default'"):
    if out.count(tok) != 0:
        sys.exit("ABORT: retired token %r still present; nothing written" % tok)
if "content=\"225\"" not in out and "ia-version" in out:
    pass  # version meta is not touched in this slice

open(PATH, "w", encoding="utf-8").write(out)
print("WROTE %s (%d -> %d bytes)" % (PATH, len(src.encode('utf-8')), len(out.encode('utf-8'))))
