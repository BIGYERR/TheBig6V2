#!/usr/bin/env python3
# V238 slice 3 of 5: the journal, the rest hero (H1), the move list (D225), the version bump 237 -> 238.
# No gates here (slices 4-5). Slices 1-2 (lens, writer, carry, sum/max readers) are already on the tree.
# Ruling: tests/measure/v238_rulings/v238_ruling_d223_d227.md, D223 to D227, Amendment 1 (where it
# replaces text, the Amendment governs), Mario's answers (item 2: H1 rides V238 as restated in A2).
#   E8  C-JOURNAL  D224 "Journal" + A3 + A4: a day whose entry has a restLog keeps its journal row
#                  even with no session RPE, note or swap; inside the existing card each restLog type
#                  with mins prints one line in the hero's sentence verbatim (restLogLines), no
#                  RPE_LABELS word. The sort ((a.w-b.w) || (a.ts-b.ts)) is not edited.
#   E9  C-HERO     D224 "Rest hero line" as replaced by A2: _rcLine reads the lensed entry's restLog and
#                  prints one line per type that holds mins, in restLog's key order, same template and
#                  class; Log more / Log cardio stays keyed on _rcLine. The sentence moves into one
#                  top-level helper, restLogLines(rl), sited just above renderWeekView, which the
#                  journal also calls, so the two cannot word a jog differently.
#   E10 C-MOVE     D225: restMoveCandidates' logged test adds lg.swapTo || lg.parked. Premise checked
#                  by VM drive on the slice-2 tree before writing: a chip tapped back to the planned
#                  sport leaves swapTo "" and no parked key (44/44), so bare truthiness is the ruling.
#   E11 C-VERSION  ia-version 237 -> 238, the LAST replacement.
#   C-COMMENT      a V238 (D22x) comment at each seam.
# Literal bytes for the middle dot and the dash; any backslash-u text in an anchor is built with chr(92).
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
BS = chr(92)


def rep(label, text, old, new):
    n = text.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    if old == new:
        print('ABORT %s: replacement equals anchor; nothing written' % label)
        sys.exit(1)
    print('ok %s' % label)
    return text.replace(old, new, 1)


html = open(HTML, encoding='utf-8').read()

# ---- premise guards: slices 1-2 landed, slice 3 not yet ------------------------------------------
for tok, want in (('function restNorm(e){', 1), ('if(_keepRest) logs[key].restLog=_keepRest;', 1),
                  ('restLogLines', 0), ('<meta name="ia-version" content="237">', 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

# ---- E9a: C-HERO, the hero's sentence as one helper (the journal reuses it) ----------------------
html = rep('E9a restLogLines helper', html,
"""  _wkScootTmr=setTimeout(()=>{ _wkScootTmr=0; _wkScootRaf=requestAnimationFrame(step); },260);
}
function renderWeekView(){
""",
"""  _wkScootTmr=setTimeout(()=>{ _wkScootTmr=0; _wkScootRaf=requestAnimationFrame(step); },260);
}
// V238 (D224 rest hero H1 as restated in Amendment 1 A2, and the journal): the rest hero's sentence for
// a day's rest-day jog record, one string per restLog type that holds mins, in restLog's key order,
// e.g. "37 min run logged · RPE 7". The sport words are the hero's map; a missing RPE prints the
// hero's dash. The journal prints the same strings, so the two never word a jog differently. A type
// with no mins (a legacy lensed run that kept only its distance) has no line: the lens invents nothing.
function restLogLines(rl){
  if(!rl||typeof rl!=='object') return [];
  const W={run:'run',bike:'ride',swim:'swim',row:'row',walk:'walk'};
  return Object.keys(rl).filter(t=>rl[t]&&+rl[t].mins>0).map(t=>rl[t].mins+' min '+(W[t]||t)+' logged · RPE '+(rl[t].rpe||'—'));
}
function renderWeekView(){
""")

# ---- E9b: C-HERO, _rcLine reads restLog through the getLogs lens ---------------------------------
html = rep('E9b _rcLine', html,
"""  const _rcLine=(_heroCardio&&_heroCardio.rest_cardio)
    ? '<div class="wk-rest-logged">'+_heroCardio.rest_mins+' min '+(({run:'run',bike:'ride',swim:'swim',row:'row',walk:'walk'})[_heroCardio.rest_type]||_heroCardio.rest_type)+' logged """ + BS + """u00b7 RPE '+(_heroCardio.rpe||'""" + BS + """u2014')+'</div>'
    : '';
""",
"""  // V238 (D224 rest hero, H1 as restated in Amendment 1 A2): the entry comes through the getLogs lens,
  // so a V237 rest entry reads as restLog too. One line per restLog type that holds mins, in key
  // order, same sentence and class as before; Log more below stays keyed on a line being there.
  const _rcLine=(_heroCardio&&_heroCardio.restLog)
    ? restLogLines(_heroCardio.restLog).map(s=>'<div class="wk-rest-logged">'+s+'</div>').join('')
    : '';
""")

# ---- E10: C-MOVE, a swap or parked numbers are a log (D225) --------------------------------------
html = rep('E10 restMoveCandidates', html,
"""    // reads, every sport), so a Log-tapped time, pace or rep-time form is never offered as not logged. swapTo and
    // parked are not a log here: P-RESTMOVELOG.
    if(lg&&(lg.rpe||lg.notes||Object.keys(CARDIO_PARK_FIELDS)""",
"""    // reads, every sport), so a Log-tapped time, pace or rep-time form is never offered as not logged.
    // V238 (D225): a live swap (swapTo) or parked numbers (parked) are a log too, so a swapped-away day is never
    // offered as a move origin. A chip tapped back to the planned sport leaves swapTo '' and no parked key
    // (setCardioSwap deletes an empty park), so that day is judged on its session fields alone again.
    if(lg&&(lg.rpe||lg.notes||lg.swapTo||lg.parked||Object.keys(CARDIO_PARK_FIELDS)""")

# ---- E8: C-JOURNAL, the jog keeps its row and prints the hero's sentence -------------------------
html = rep('E8a journal row filter', html,
"""    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo)) return;
""",
"""    // V238 (D224 journal, Amendment 1 A4): a day with a rest-day jog (restLog) keeps its row too, so a walk
    // or row jog alone still reaches the journal and Progress does not fall back to its empty state.
    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo) && !(entry.restLog && Object.keys(entry.restLog).length)) return;
""")
html = rep('E8b journal jog lines', html,
"""        const headMb = (entry.notes||isSwap) ? 6 : 0;
""",
"""        // V238 (D224 journal, A3): each jog type with mins prints one line, the rest hero's own sentence
        // (restLogLines), never an RPE_LABELS word: the sheet's effort words are not the label table's.
        const jogLines = restLogLines(entry.restLog);
        const headMb = (entry.notes||isSwap||jogLines.length) ? 6 : 0;
""")
html = rep('E8c journal swap chip margin', html,
"""padding:3px 7px;margin-bottom:${entry.notes?6:0}px">${asyIcon('history',12)} Swapped""",
"""padding:3px 7px;margin-bottom:${(entry.notes||jogLines.length)?6:0}px">${asyIcon('history',12)} Swapped""")
html = rep('E8d journal jog block', html,
"""          ${entry.notes ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;font-style:italic">"${entry.notes}"</div>` : ''}
""",
"""          ${jogLines.length ? `<div style="margin-bottom:${entry.notes?6:0}px">${jogLines.map(s => `<div style="font-size:12px;font-weight:500;color:var(--run);line-height:1.5">${s}</div>`).join('')}</div>` : ''}
          ${entry.notes ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;font-style:italic">"${entry.notes}"</div>` : ''}
""")

# ---- E11: C-VERSION, LAST ------------------------------------------------------------------------
html = rep('E11 ia-version 238', html,
'<meta name="ia-version" content="237">',
'<meta name="ia-version" content="238">')

open(HTML, 'w', encoding='utf-8').write(html)
print('wrote %s' % HTML)
