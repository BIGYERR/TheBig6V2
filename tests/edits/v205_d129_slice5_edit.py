#!/usr/bin/env python3
# V205 slice 5 — D129 (addendum). Ranks 8 and 9 on the pace arm of the run-day chooser,
# plus the gate assertion coach adopted in place of "resolves at rank 7 or above".
#
# EDIT 1 (rank 8, types): among layouts still tied after rank 7, the one whose LAST
#   quality session sits furthest before the long run wins. Freshest legs into the
#   week's longest run.
# EDIT 2 (rank 9, types): below rank 8, earliest first quality day. Already implied by
#   canonical; made explicit so it is a rank rather than an accident.
# EDIT 3 (gate): the claim under proof becomes "enumeration order never decides between
#   candidates with distinct DAY SETS". Types may still tie; days may not.
#
# ia-version does NOT move in this slice (stays 204). No meta bump replacement here.
import io, sys

HTML = 'index.html'
GATE = 'tests/gates/g205_d129_tiebreak.js'

def sub(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (label, n))
        sys.exit(1)
    sys.stderr.write('  anchor OK  %-28s  count=1  %+d bytes\n' % (label, len(new) - len(old)))
    return src.replace(old, new, 1)

# ── index.html ──────────────────────────────────────────────────────────────
src = io.open(HTML, encoding='utf-8').read()

A1_OLD = """        const spread = paceFam ? -_longestFree : 0;
"""
A1_NEW = """        const spread = paceFam ? -_longestFree : 0;
        // V205 (D129 addendum), rank 8 — REST INTO THE LONG RUN. Among layouts still
        // tied after spread, the one whose LAST quality session sits furthest before the
        // long run wins. The reason is coaching, not tidiness: freshest legs into the
        // week's longest run. Read circularly, backwards from the long day, so the LAST
        // quality session is the one with the smallest backward distance, and the term
        // maximises that distance. This is what "earliest quality day" was reaching for,
        // stated on the session that actually matters.
        let _qualRest = 0;
        if(longDay){
          let _nearest = 7;
          days.forEach(d=>{
            if(typeOf[d]!==T.s1 && typeOf[d]!==T.s2) return;
            const back = (pos(longDay)-pos(d)+7)%7;
            if(back < _nearest) _nearest = back;
          });
          if(_nearest < 7) _qualRest = _nearest;
        }
        // paceFam-gated like ranks 6 and 7: NRC's subset and permutation pins already fix
        // its layout, and a new preference there is unruled.
        const qualRest = paceFam ? _qualRest : 0;
        // V205 (D129 addendum), rank 9 — EARLIEST FIRST QUALITY DAY. Below rank 8, and
        // already implied by canonical; written out so it is a rank rather than an
        // accident of enumeration. days ascends in week order, so the first quality
        // session in it is the earliest one. Negated so earlier wins. paceFam-gated.
        const _firstQual = days.find(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
        const qualFirst = (paceFam && _firstQual) ? -pos(_firstQual) : 0;
"""
src = sub(src, A1_OLD, A1_NEW, 'engine ranks 8+9')

A2_OLD = """        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order, the athlete's existing even-spread subset, then the tightest
        // spread. Ties keep the incumbent, so enumeration order is the last tiebreak
        // and the chooser stays deterministic with no seed — but ranks 6 and 7 exist so
        // that enumeration order never actually decides a built week.
        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread];
"""
A2_NEW = """        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread, qualRest, qualFirst};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order, the athlete's existing even-spread subset, the tightest spread,
        // the longest rest into the long run, then the earliest first quality day.
        // Ties keep the incumbent, so enumeration order is the last tiebreak and the
        // chooser stays deterministic with no seed — but ranks 6 and 7 pin the DAY SET
        // and ranks 8 and 9 pin the types on it, so enumeration order never decides
        // which days an athlete trains on.
        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];
"""
src = sub(src, A2_OLD, A2_NEW, 'engine rank vector')

io.open(HTML, 'w', encoding='utf-8').write(src)
sys.stderr.write('wrote %s\n' % HTML)
