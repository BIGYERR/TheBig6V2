#!/usr/bin/env python3
# V203 slice B — D118 (the goal change carries the anchor) + D119 (the `edited` provenance form).
# Four anchors, every one asserted count==1 before any write. ia-version is NOT touched here;
# it stays at 202 until the final slice of V203.
import io, sys

PATH = 'index.html'
src = io.open(PATH, encoding='utf-8').read()
orig = src

def sub(label, old, new):
    global src
    n = src.count(old)
    print('anchor %-8s count=%d' % (label, n))
    if n != 1:
        sys.exit('ABORT: anchor %s matched %d times, expected exactly 1 — nothing written' % (label, n))
    src = src.replace(old, new, 1)

# ── E1 — D118: commitGoalChange carries the mile anchor across a goal change ──────────
# baseline/baselineDist stay dropped exactly as D5 wrote them; only the mile and its
# provenance ride across, and only for the run sport.
sub('E1',
"""  const next={id:g.id,label:g.label,baseline:''};""",
"""  const prev=((programs[pi].cfg.cardioGoals||{})[sport])||{};
  const next={id:g.id,label:g.label,baseline:'',
    ...(sport==='run'&&prev.mileBestMins!==undefined&&prev.mileBestMins!==''
        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{})};""")

# ── E2 — D119: runAnchorInfo resolves `edited` and surfaces wk/from ───────────────────
sub('E2-kind',
"""  const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default' : (src && src.kind === 'seeded') ? 'seeded' : 'entered';""",
"""  const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default' : (src && src.kind === 'seeded') ? 'seeded' : (src && src.kind === 'edited') ? 'edited' : 'entered';""")

sub('E2-ret',
"""  return {anchorSec, rawSec, clamped, row, kind, prog:(src && src.prog) || '', n:(src && +src.n) || 0, race, goalId:g.id, goalT};""",
"""  return {anchorSec, rawSec, clamped, row, kind, prog:(src && src.prog) || '', n:(src && +src.n) || 0, wk:(src && +src.wk) || 0, from:(src && src.from) || null, race, goalId:g.id, goalT};""")

# ── E3 — D119: the edited sentence, evaluated before the entered branch ───────────────
# The clamped branch still wins first: a clamped edited entry is unchanged.
# The `entered` branch is widened to catch an `edited` kind carrying no `from`: without the
# widening that degenerate state falls to the terminal sentence and prints "no mile time was
# entered", which is false. Widening restores exactly the pre-V203 sentence for that input.
sub('E3',
"""  if(a.kind === 'entered')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;""",
"""  if(a.kind === 'edited' && a.from){
    const from = a.from.kind === 'default' ? 'estimated from experience'
               : _fmtMileAnchor((+a.from.mins||0)*60 + (+a.from.secs||0));
    return `Anchored on ${art} <b>${m} mile</b>, the time you entered in week ${a.wk}. Before that it was ${from}.` + tail;
  }
  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;""")

# ── E4 — D119: copied-selections provenance for the edited kind ───────────────────────
# Not athlete prose: this is the copy/export line. Arrows and punctuation stay as they are.
sub('E4',
"""             : a.kind==='entered' ? 'entered' : a.kind==='beginner' ? 'beginner default' : 'est. from experience';""",
"""             : a.kind==='edited' ? `edited in week ${a.wk}`
             : a.kind==='entered' ? 'entered' : a.kind==='beginner' ? 'beginner default' : 'est. from experience';""")

assert src != orig
io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d -> %d bytes)' % (PATH, len(orig), len(src)))
