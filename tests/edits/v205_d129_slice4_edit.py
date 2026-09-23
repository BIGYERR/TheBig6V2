#!/usr/bin/env python3
# V205 slice 4 — D129. Chooser tiebreak ranks 6 (identity) and 7 (spread), plus the
# pace-family-only correction to recBeforeLong. ia-version stays at 204.
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
MD   = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def load(p):
    with io.open(p, 'r', encoding='utf-8') as f: return f.read()
def save(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

html = load(HTML); md = load(MD)
edits = []   # (label, target, old, new)

# ── EDIT 1: D-code registry ──────────────────────────────────────────────────
edits.append(('E1 registry', 'md',
"highest assigned = D128. Next free = D129.",
"highest assigned = D129. Next free = D130."))

# ── EDIT 2: even-spread subset, computed once, for the rank-6 identity term ──
edits.append(('E2 even-spread subset', 'html',
"""    const inTrain = new Set(cardioTrainDays);
    const n = cardioTrainDays.length;
""",
"""    const inTrain = new Set(cardioTrainDays);
    const n = cardioTrainDays.length;
    // V205 (D129): THE EVEN-SPREAD SUBSET, RECOMPUTED HERE VERBATIM. This is the exact
    // arithmetic the fallback chooser in the caller runs when a goal is not routed here.
    // It is not a tiebreak the athlete can see; it is the layout he ALREADY HAS. Routing
    // the pace family through this chooser (D125) replaced a pure spacing rule with a
    // four-term objective, and the spacing term went implicit. Rank 6 puts it back as
    // identity: when several layouts tie on every ruled term, the one already on his
    // calendar wins, so a tie never moves a live week. Rank 7 below scores spread as a
    // metric for the ties this subset is not in. Keep the two arms in this order.
    const _evenIdx = (function(){
      const s = new Set();
      if(capDays <= 1) s.add(n - 1);
      else for(let k = 0; k < capDays; k++) s.add(Math.round(k * (n - 1) / (capDays - 1)));
      return Array.from(s).sort((a,b)=>a-b);
    })();
    const _evenKey = _evenIdx.join(',');
"""))

# ── EDIT 3: recBeforeLong — pace family only, corrected to the true eve ──────
edits.append(('E3 recBeforeLong fork', 'html',
"""        const recBeforeLong = longDay && days.some(d=>typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay)) ? 1 : 0;
""",
"""        // V205 (D129): THE LENS IS FORKED, AND ONLY THE PACE ARM IS CORRECTED.
        // `pos(d)<pos(longDay)` reads a CIRCULAR week through a Sunday-first linear list,
        // so a Sunday easy run scores as padding a Saturday long run — the day AFTER it.
        // prevDay above is circular-correct, and `d===prevDay(longDay)` is what "a recovery
        // run the day before the long" actually means. NRC KEEPS THE SHIPPED PREDICATE by
        // ruling: the term decides 593 of 804 NRC chooser rows, and correcting it there
        // moves 182 of 804 rows and 54 of 112 built programs, 3 of which relocate the long
        // run itself. That is a re-ruling of NRC layout, not a bug fix, and it is unruled.
        const recBeforeLong = longDay && days.some(d=>typeOf[d]===T.rec && (paceFam
          ? d===prevDay(longDay)
          : (circ(d,longDay)===1 && pos(d)<pos(longDay)))) ? 1 : 0;
"""))

# ── EDIT 4: ranks 6 and 7, and the sibling-defect note on canonical ──────────
edits.append(('E4 ranks 6 and 7', 'html',
"""        const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
        const canonical = (s1 && s2 && pos(s1)<pos(s2)) ? 1 : 0;
        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order. Ties keep the incumbent, so enumeration order is the last
        // tiebreak and the chooser stays deterministic with no seed.
        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical];
""",
"""        const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
        // UNMEASURED, UNRULED, DELIBERATELY LEFT ALONE (V205, D129). This line is a
        // SIBLING of the recBeforeLong lens defect corrected above: `pos(s1)<pos(s2)` also
        // reads a circular week through the Sunday-first ALL_DAYS_ORDER, so "speed1 comes
        // before speed2" is measured from Sunday rather than from the athlete's own week.
        // Nobody has measured what correcting it would move on either arm. Do not read its
        // survival here as evidence it was considered and cleared. It was not.
        const canonical = (s1 && s2 && pos(s1)<pos(s2)) ? 1 : 0;
        // V205 (D129), rank 6 — IDENTITY. The subset the even-spread fallback would have
        // picked. Below every ruled term, so it can never buy a worse week; above spread,
        // so a tie never moves days an athlete is already training on.
        const identity = (idxs.join(',') === _evenKey) ? 1 : 0;
        // V205 (D129), rank 7 — SPREAD, as a metric and not a constant. The longest
        // run-free stretch on the real circular week, negated so shorter wins. This is the
        // term that decides ties the athlete's current subset is not in, and it is what
        // keeps enumeration order out of the decision.
        const _p = days.map(pos).sort((a,b)=>a-b);
        let _longestFree = 0;
        for(let i=0;i<_p.length;i++){
          const nxt = (i+1<_p.length) ? _p[i+1] : _p[0]+7;
          const gap = nxt - _p[i] - 1;
          if(gap > _longestFree) _longestFree = gap;
        }
        const spread = -_longestFree;
        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order, the athlete's existing even-spread subset, then the tightest
        // spread. Ties keep the incumbent, so enumeration order is the last tiebreak
        // and the chooser stays deterministic with no seed — but ranks 6 and 7 exist so
        // that enumeration order never actually decides a built week.
        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread];
"""))

# ── assert every anchor count==1 BEFORE writing anything ────────────────────
fail = False
for label, tgt, old, new in edits:
    src = html if tgt == 'html' else md
    c = src.count(old)
    print('%-26s count=%d' % (label, c))
    if c != 1:
        print('  ABORT: expected exactly 1 occurrence'); fail = True
if fail:
    sys.exit(1)

for label, tgt, old, new in edits:
    if tgt == 'html': html = html.replace(old, new, 1)
    else:            md   = md.replace(old, new, 1)

save(HTML, html); save(MD, md)
print('WROTE index.html + IRON_ASYLUM_HANDOFF_1_1.md (ia-version untouched)')
