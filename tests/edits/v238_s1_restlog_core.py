#!/usr/bin/env python3
# V238 slice 1 of 5: the data core of P-RESTMOVELOG. NO version bump here (slice 3 bumps 237 -> 238);
# no gates here (slices 4-5). Readers (week MILES, Progress, journal, ladder, maxDist, the rest hero
# _rcLine, restMoveCandidates) are slices 2 and 3 and are not touched.
# Ruling: tests/measure/v238_rulings/v238_ruling_d223_d227.md, D223 to D227, Amendment 1 (A1-A6 govern
# where they replace text), Mario's answers (H1 rides, D226 rides, legacy lens with no boot write).
#   E1  C-LENS    D223 item 5 as amended by A1: pure lens restNorm(e), sited in getLogs/getLogsFor,
#                 the one read of ia_logs_. refreshProgram (:16160) reads keys only and is left alone.
#   E2  C-WRITER  D223 items 1-2 as amended by A6, plus D226: applyRestCardio's merge writes
#                 restLog[type] only, as numbers, stamps week and ts like writeSetDraft. The tail
#                 (close, render, toast) and the sheet are byte-identical.
#   E3  C-CARRY   D223 item 3: persistLogFields carries restLog through the rebuild as it carries
#                 sets and parked. setCardioSwap and CARDIO_PARK_FIELDS untouched.
#   C-COMMENT     a V238 (D2xx) comment at each touched seam.
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')


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

# ---- premise guards (ruling D223 item 5 / A1): the keys the lens clears have one writer ----------
for tok, want in (("e.rest_cardio=true;", 1), ("rest_type", 3), ("rest_mins", 2), ("restNorm", 0), ("restLog", 0)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)
print('ok premise guards')

# ---- E1a: C-LENS, restNorm + getLogs ------------------------------------------------------------
html = rep('E1a restNorm + getLogs', html,
"""function getLogs(){try{return JSON.parse(localStorage.getItem('ia_logs_'+activeProgId)||'{}');}catch{return{};}}
""",
"""// V238 (D223 item 5, Amendment 1 A1): restNorm is the read lens for one ia_logs_ day entry, and
// getLogs/getLogsFor, the one read of the store, pass every entry through it. An entry with a
// restLog, or with no rest_cardio, comes back as is. A V237 rest entry (rest_cardio still on it,
// so persistLogFields never rebuilt it, and those keys are the jog's) comes back in the V238 shape
// derived from the entry alone: restLog[rest_type] = {mins:rest_mins, rpe}; run_dist and
// swim_yards become the run and swim dist; bike_mins becomes the ride's mins (the sum wins over
// rest_mins). The seven flat keys it read are cleared; every key it does not name (sets, parked,
// notes, week, ts) is carried untouched. It invents nothing: no ts, no week, no mins for a type
// that held none. Pure: it never mutates its argument and nothing writes on boot; a legacy entry
// converts when a writer's saveLogs persists the map it read. The lens runs outside the parse
// try, so a lens fault can never come back as {} for a writer to save over the store.
function restNorm(e){
  if(!e||typeof e!=='object'||e.restLog||!e.rest_cardio) return e;
  const FLAT=['rest_cardio','rest_type','rest_mins','rpe','run_dist','bike_mins','swim_yards'];
  const num=v=>(+v>0?+v:0), t=e.rest_type||'';
  const M={}, D={}, R={};
  if(t&&num(e.rest_mins)) M[t]=num(e.rest_mins);
  if(t&&e.rpe!=null&&e.rpe!==''&&isFinite(+e.rpe)) R[t]=+e.rpe;
  if(num(e.run_dist)) D.run=num(e.run_dist);
  if(num(e.swim_yards)) D.swim=num(e.swim_yards);
  if(num(e.bike_mins)) M.bike=num(e.bike_mins);
  const rl={};
  [t,'run','swim','bike'].forEach(function(s,i,a){
    if(!s||a.indexOf(s)!==i) return;
    const o={};
    if(s in M) o.mins=M[s];
    if(s in D) o.dist=D[s];
    if(s in R) o.rpe=R[s];
    if(Object.keys(o).length) rl[s]=o;
  });
  const out={restLog:rl};
  Object.keys(e).forEach(function(k){ if(FLAT.indexOf(k)<0) out[k]=e[k]; });
  return out;
}
function restNormAll(l){
  if(l&&typeof l==='object') Object.keys(l).forEach(function(k){ l[k]=restNorm(l[k]); });
  return l;
}
function getLogs(){let l;try{l=JSON.parse(localStorage.getItem('ia_logs_'+activeProgId)||'{}');}catch{return{};}return restNormAll(l);}
""")

# ---- E1b: C-LENS, getLogsFor --------------------------------------------------------------------
html = rep('E1b getLogsFor', html,
"""function getLogsFor(pid){try{return JSON.parse(localStorage.getItem('ia_logs_'+pid)||'{}');}catch{return{};}}
""",
"""// V238 (D223 item 5): the same restNorm lens as getLogs.
function getLogsFor(pid){let l;try{l=JSON.parse(localStorage.getItem('ia_logs_'+pid)||'{}');}catch{return{};}return restNormAll(l);}
""")

# ---- E2: C-WRITER, applyRestCardio's merge (tail untouched) -------------------------------------
html = rep('E2 applyRestCardio merge', html,
"""  e.rest_cardio=true; e.rest_type=type; e.rest_mins=m; e.rpe=rpe;
  // Feed the same fields Progress already aggregates, so weekly mileage picks this up
  // without a second aggregation path.
  const d=parseFloat(dist);
  if(type==='run'&&d>0)  e.run_dist=(+e.run_dist||0)+d;
  if(type==='bike')      e.bike_mins=(+e.bike_mins||0)+m;
  if(type==='swim'&&d>0) e.swim_yards=(+e.swim_yards||0)+d;
""",
"""  // V238 (D223 items 1-2, Amendment 1 A6, D226): the jog is its own record on the day,
  // restLog[type] = {mins, dist?, rpe}, numbers. It writes no top-level key a session reads:
  // rest_cardio, rest_type, rest_mins, rpe and the run_dist/bike_mins/swim_yards sum are retired,
  // so a session moved onto the day opens empty and its rebuild carries the jog. dist is stored
  // only when the box took one (parseFloat > 0), never on walk. "Log more" never overwrites: the
  // same type adds mins and dist and keeps the higher RPE; another type gets its own key. week
  // and ts are stamped the way writeSetDraft stamps them.
  const rl=Object.assign({},e.restLog||{}), was=rl[type]||{}, o={};
  const fin=v=>(v!=null&&v!==''&&isFinite(+v))?+v:null;
  const d=parseFloat(dist), dd=(type!=='walk'&&d>0)?d:0, wd=(+was.dist>0)?+was.dist:0;
  o.mins=((+was.mins>0)?+was.mins:0)+m;
  if(type!=='walk'&&wd+dd>0) o.dist=wd+dd;
  const r0=fin(was.rpe), r1=fin(rpe);
  if(r0!=null||r1!=null) o.rpe=Math.max(r0==null?-Infinity:r0, r1==null?-Infinity:r1);
  rl[type]=o; e.restLog=rl; e.week=w; e.ts=Date.now();
""")

# ---- E3: C-CARRY, persistLogFields carries restLog -----------------------------------------------
html = rep('E3a persistLogFields keep', html,
"""  const _keepParked=(logs[key]&&logs[key].parked)||null;
""",
"""  const _keepParked=(logs[key]&&logs[key].parked)||null;
  // V238 (D223 item 3): the rest-day jog's record rides the rebuild the same way. It is not a
  // park field, so setCardioSwap never moves it.
  const _keepRest=(logs[key]&&logs[key].restLog)||null;
""")
html = rep('E3b persistLogFields carry', html,
"""  if(_keepParked) logs[key].parked=_keepParked;
""",
"""  if(_keepParked) logs[key].parked=_keepParked;
  if(_keepRest) logs[key].restLog=_keepRest;
""")

open(HTML, 'w', encoding='utf-8').write(html)
print('wrote %s' % HTML)
