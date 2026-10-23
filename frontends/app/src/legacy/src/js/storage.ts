import { activeProg, activeProgId, currentDayKey, currentWeek } from './rest-day-shell.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)


// Exercise names reach markup from the library, from swaps, and now from the add picker.
// Escaped on the way in so a name containing a quote or angle bracket can never break the
// attribute it sits in.
function esc(s: any){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// STORAGE
function getPrograms(): any[]{try{return JSON.parse(localStorage.getItem('ia_programs')||'[]');}catch{return[];}}
function savePrograms(p: any){localStorage.setItem('ia_programs',JSON.stringify(p));}
function getActiveProgId(){return localStorage.getItem('ia_active')||null;}
function setActiveProgId(id: any){localStorage.setItem('ia_active',id);}
// V238 (D223 item 5, Amendment 1 A1): restNorm is the read lens for one ia_logs_ day entry, and
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
function restNorm(e: any){
  if(!e||typeof e!=='object'||e.restLog||!e.rest_cardio) return e;
  const FLAT=['rest_cardio','rest_type','rest_mins','rpe','run_dist','bike_mins','swim_yards'];
  // @ts-expect-error TS7006 Parameter 'v' implicitly has an 'any' type.
  const num=v=>(+v>0?+v:0), t=e.rest_type||'';
  const M: Record<string, any>={}, D: Record<string, any>={}, R: Record<string, any>={};
  if(t&&num(e.rest_mins)) M[t]=num(e.rest_mins);
  if(t&&e.rpe!=null&&e.rpe!==''&&isFinite(+e.rpe)) R[t]=+e.rpe;
  if(num(e.run_dist)) D.run=num(e.run_dist);
  if(num(e.swim_yards)) D.swim=num(e.swim_yards);
  if(num(e.bike_mins)) M.bike=num(e.bike_mins);
  const rl: Record<string, any>={};
  [t,'run','swim','bike'].forEach(function(s,i,a){
    if(!s||a.indexOf(s)!==i) return;
    const o: Record<string, any>={};
    if(s in M) o.mins=M[s];
    if(s in D) o.dist=D[s];
    if(s in R) o.rpe=R[s];
    if(Object.keys(o).length) rl[s]=o;
  });
  const out: Record<string, any>={restLog:rl};
  Object.keys(e).forEach(function(k){ if(FLAT.indexOf(k)<0) out[k]=e[k]; });
  return out;
}
function restNormAll(l: any){
  if(l&&typeof l==='object') Object.keys(l).forEach(function(k){ l[k]=restNorm(l[k]); });
  return l;
}
function getLogs(){let l;try{l=JSON.parse(localStorage.getItem('ia_logs_'+activeProgId)||'{}');}catch{return{};}return restNormAll(l);}
// V156: id-parameterized variants. The zero-arg accessors above stay untouched so every
// existing call site is byte-identical; only the Progress selector and the wizard seed
// read OTHER programs' stores, and they must say which one out loud.
// V238 (D223 item 5): the same restNorm lens as getLogs.
function getLogsFor(pid: any){let l;try{l=JSON.parse(localStorage.getItem('ia_logs_'+pid)||'{}');}catch{return{};}return restNormAll(l);}
function getDayHistFor(pid: any){try{return JSON.parse(localStorage.getItem('ia_hist_'+pid)||'{}');}catch{return{};}}
function getExWeightsFor(pid: any){try{return JSON.parse(localStorage.getItem('ia_exw_'+pid)||'{}');}catch{return{};}}
function saveExWeightsFor(pid: any,obj: any){localStorage.setItem('ia_exw_'+pid,JSON.stringify(obj));}
function saveLogs(l: any){localStorage.setItem('ia_logs_'+activeProgId,JSON.stringify(l));}
function getCompleted(){try{return JSON.parse(localStorage.getItem('ia_comp_'+activeProgId)||'{}');}catch{return{};}}
function saveCompleted(c: any){localStorage.setItem('ia_comp_'+activeProgId,JSON.stringify(c));}
function getWildcardDone(): any[]{try{return JSON.parse(localStorage.getItem('ia_wild_'+activeProgId)||'[]');}catch{return[];}}
function saveWildcardDone(a: any){localStorage.setItem('ia_wild_'+activeProgId,JSON.stringify(a));}
function logKey(w: any,d: any){return 'w'+w+'_'+d;}

// ── SET DRAFTS (V131) ────────────────────────────────────────────────────────
// A stepper tap is not a log. It is the athlete mid-session, and before V131 it
// lived ONLY in the DOM: leaving the day and coming back redrew the card from
// ia_exw_, found nothing, and reprinted the prescription over the edit.
//
// Drafts live INSIDE the existing ia_logs_ day entry as `sets`, deliberately.
// ia_logs_ is already keyed week+day, already inside the freeze's "touched" test,
// and already bounded by program length. A new ia_draft_ store would have been a
// second re-apply store with no prune function, and ia_moves_ is already that one.
//
// A draft NEVER reaches ia_exw_. The tick, the X/Y LOGGED counter and every chart
// read ia_exw_, so a draft cannot claim work is finished and cannot put a weight
// the athlete never confirmed onto a progress chart.
//
// Values are stored as the RAW STRINGS the athlete entered, '' meaning untouched —
// never a placeholder-derived number. Restoring a draft therefore cannot stamp a
// zero into a load cell that was never filled.
function readSetDraft(exKey: any){
  if(!exKey) return null;
  const e=getLogs()[logKey(currentWeek,currentDayKey)];
  return (e&&e.sets&&e.sets[exKey])||null;
}
// READ-MODIFY-WRITE, and it must stay that way. persistLogFields rebuilds the whole
// day entry from the form fields, so these two writers each have to preserve the
// other's half or whichever runs last silently destroys it.
function writeSetDraft(exKey: any,r: any,w: any,L: any){
  if(!activeProgId||!currentDayKey||!exKey) return;
  // SNAPSHOT, same reasoning as persistLogFields. A draft lands in ia_logs_, and any
  // ia_logs_ entry for a week makes that week "touched" for the freeze — so the day
  // has to be captured in ia_hist_ here too, or the week freezes with no record of
  // what it was frozen ON. snapshotDay is first-touch-wins, so this is a no-op after
  // the first write.
  snapshotDay(currentWeek,currentDayKey);
  const logs=getLogs(), k=logKey(currentWeek,currentDayKey);
  const e=logs[k]||{week:currentWeek};
  const sets=e.sets||{};
  sets[exKey]={r:r||[],w:w||[],L:L||''};
  e.sets=sets; e.week=currentWeek; e.ts=Date.now();
  logs[k]=e; saveLogs(logs);
}
function clearSetDraft(exKey: any){
  const logs=getLogs(), k=logKey(currentWeek,currentDayKey), e=logs[k];
  if(!e||!e.sets||!(exKey in e.sets)) return;
  delete e.sets[exKey];
  if(!Object.keys(e.sets).length) delete e.sets;
  logs[k]=e; saveLogs(logs);
}
function completedKey(w: any,d: any){return 'w'+w+'_'+d;}
// ── DAY HISTORY SNAPSHOTS (ia_hist_) ─────────────────────────────────────────
// refreshProgram rebuilds from cfg on every boot and its OUTPUT IS NEVER PERSISTED —
// prog.weeks in storage is the build from creation day. So the week freeze's
// "trained → history stands" branch was restoring a version the athlete may never
// have been shown: report an injury, train Thursday, mark it, and next boot the day
// snapped back to the pre-injury prescription (all-out intervals on a protected
// week). Same failure for travel: train a hotel week, mark it, get the commercial-gym
// version back.
//
// Fix: the moment a day is touched, snapshot the day object AS RENDERED — overlays,
// swaps, rest-day moves and all — keyed w<N>_<day> like every other week-keyed store.
// The freeze then restores from the snapshot and only falls back to prog.weeks when
// none exists. This is what makes "history records what was actually prescribed"
// literally true, and it survives engine changes, date edits and overlay removal.
//
// FIRST TOUCH WINS: never overwritten. The prescription that was on screen when the
// athlete started working is the record; re-tapping a status later must not rewrite it.
function getDayHist(){try{return JSON.parse(localStorage.getItem('ia_hist_'+activeProgId)||'{}');}catch{return{};}}
function saveDayHist(h: any){try{localStorage.setItem('ia_hist_'+activeProgId,JSON.stringify(h));}catch(e){}}
// FIRST TOUCH WINS applies to the ENGINE's prescription, not to the athlete's own
// edits. If the day is edited after first touch, the snapshot must absorb that edit or
// the freeze will restore a day missing it — the exact shape of the V103→V104 bug, since
// ia_hist_ is the record and prog.weeks is only a build. This re-snapshots the day while
// preserving nothing else: it is
// called only from the athlete's own edit handlers: add, skip, swap, undo, never from the
// five normal hook points, so an untouched prescription can still never be rewritten.
function resnapshotDayEdit(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    const day=activeProg.weeks[week]&&activeProg.weeks[week][dayKey];
    if(!day) return;
    const h=getDayHist(), k=completedKey(week,dayKey);
    if(!h[k]) return;                                 // no snapshot yet: nothing to patch
    h[k]=JSON.parse(JSON.stringify(day));
    saveDayHist(h);
  }catch(e){ console.error('day edit re-snapshot failed',week,dayKey,e); }
}
function snapshotDay(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    const day=activeProg.weeks[week]&&activeProg.weeks[week][dayKey];
    if(!day) return;
    const h=getDayHist(), k=completedKey(week,dayKey);
    if(h[k]) return;                                  // first touch wins
    h[k]=JSON.parse(JSON.stringify(day));
    saveDayHist(h);
  }catch(e){ console.error('day snapshot failed',week,dayKey,e); }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  clearSetDraft, completedKey, esc, getActiveProgId, getCompleted, getDayHist, getDayHistFor, getExWeightsFor, getLogs,
  getLogsFor, getPrograms, getWildcardDone, logKey, readSetDraft, resnapshotDayEdit, saveCompleted, saveExWeightsFor,
  saveLogs, savePrograms, saveWildcardDone, setActiveProgId, snapshotDay, writeSetDraft,
};
