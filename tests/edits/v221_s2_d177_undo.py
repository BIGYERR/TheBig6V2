#!/usr/bin/env python3
# V221 D177 (P-SWAPFLOOR) slice S2: R4, undo restores the donor's own prescription.
# Ruling: tests/measure/v221_rulings/p_swapfloor_ruling.md RR3, RR4, RE-BASELINE item 2.
# Runs on the working tree AFTER S1 (tests/edits/v221_s1_d177_floor.py). Does not bump ia-version.
# Three replacements, each anchor asserted count==1 before anything is written.
#   E  recordSwap stores rx:[{s,i,d}] beside {from,to,ts}; a re-tap of the same pair keeps
#      the earlier tap's positions it did not re-capture.
#   F  applySwapChoice captures every item named `from` (position + detail) BEFORE the
#      rename and passes it to recordSwap. S1's lines inside the anchor are reproduced verbatim.
#   G  undoSwap writes each stored detail back by position, first unwritten `from` item as
#      fallback; a record with no rx restores the name only, as before.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

EDITS = []

# ── E: recordSwap ────────────────────────────────────────────────────────────
EDITS.append(('E recordSwap',
"""function recordSwap(pid,week,dayKey,from,to){
  const s=getSwaps(pid),k='w'+week+'_'+dayKey;
  const list=(s[k]||[]).filter(e=>e&&e.from!==from);
  list.push({from:from,to:to,ts:Date.now()});
  s[k]=list; saveSwaps(pid,s); return s;
}
""",
"""function recordSwap(pid,week,dayKey,from,to,rx){
  const s=getSwaps(pid),k='w'+week+'_'+dayKey;
  // V221 D177 (R4). `rx` is optional: [{s,i,d}], section index, item index and detail of
  // every item named `from` before the rename. It is for undoSwap and nothing else; every
  // other reader takes .from/.to only, and a record without it is read exactly as before.
  // Re-tapping the same pair on the same day keeps the earlier tap's items it did not see.
  const was=(s[k]||[]).filter(e=>e&&e.from===from&&e.to===to&&Array.isArray(e.rx))[0];
  const list=(s[k]||[]).filter(e=>e&&e.from!==from);
  const ent={from:from,to:to,ts:Date.now()};
  if(Array.isArray(rx)&&rx.length) ent.rx=(was?was.rx.filter(p=>!rx.some(q=>q.s===p.s&&q.i===p.i)):[]).concat(rx);
  list.push(ent);
  s[k]=list; saveSwaps(pid,s); return s;
}
"""))

# ── F: applySwapChoice captures before the rename and passes it ──────────────
EDITS.append(('F applySwapChoice',
"""  item.name=to;
  const _wasDetail=item.detail;
  const _rx={};
  item.detail=_swapDetailFor(to,item.detail,_rx);
  const _reRx=(item.detail!==_wasDetail);
  if(sec.label&&sec.label.indexOf(from)>=0) sec.label=sec.label.split(from).join(to);
  recordSwap(activeProgId,currentWeek,currentDayKey,from,to);
""",
"""  // V221 D177 (R4): the donor's own prescription, by position, taken before anything is
  // renamed. Every item named `from` is kept, because undo is name keyed and the reboot
  // path renames them all. undoSwap writes these back; nothing replays them on a build.
  const _undoRx=[];
  (day.sections||[]).forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){
    if(it&&it.name===from&&typeof it.detail==='string') _undoRx.push({s:si,i:ii,d:it.detail});
  });});
  item.name=to;
  const _wasDetail=item.detail;
  const _rx={};
  item.detail=_swapDetailFor(to,item.detail,_rx);
  const _reRx=(item.detail!==_wasDetail);
  if(sec.label&&sec.label.indexOf(from)>=0) sec.label=sec.label.split(from).join(to);
  recordSwap(activeProgId,currentWeek,currentDayKey,from,to,_undoRx);
"""))

# ── G: undoSwap writes the stored detail back ────────────────────────────────
EDITS.append(('G undoSwap',
"""  const back={}; back[hit.to]=from;
  applySwapPrefs(day.sections,back);
  clearSwap(activeProgId,currentWeek,currentDayKey,from);
""",
"""  const back={}; back[hit.to]=from;
  applySwapPrefs(day.sections,back);
  // V221 D177 (R4): the name is back; now the donor's own detail. Each stored detail goes
  // to the item at its stored position if that item carries `from` again, else to the
  // first `from` item not yet written. A record from before V221 has no rx, so the name
  // alone comes back, exactly as before. No migration.
  if(Array.isArray(hit.rx)){
    const _put=[];
    hit.rx.forEach(function(p){
      if(!p||typeof p.d!=='string') return;
      const ps=day.sections[p.s], at=ps&&ps.items&&ps.items[p.i];
      let it=(at&&at.name===from&&_put.indexOf(at)<0)?at:null;
      if(!it) (day.sections||[]).some(function(s){return ((s&&s.items)||[]).some(function(x){
        if(x&&x.name===from&&_put.indexOf(x)<0){it=x;return true;} return false;});});
      if(it){it.detail=p.d;_put.push(it);}
    });
  }
  clearSwap(activeProgId,currentWeek,currentDayKey,from);
"""))

# assert every anchor first; abort on the first miss
for tag, old, new in EDITS:
    n = src.count(old)
    print('anchor', tag, 'count', n)
    if n != 1:
        print('ABORT: anchor', tag, 'count', n, '!= 1; nothing written')
        sys.exit(1)

for tag, old, new in EDITS:
    src = src.replace(old, new, 1)

for tag, old, new in EDITS:
    if src.count(new) != 1:
        print('ABORT: post-check', tag); sys.exit(1)

# no ia-version bump in S2 (brief: stays 220)
assert src.count('<meta name="ia-version" content="220">') == 1
open(PATH, 'w', encoding='utf-8').write(src)
print('wrote', PATH)
