import { activeProg, activeProgId, currentDayKey, currentWeek } from './rest-day-shell.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)


/* THE ASYLUM icon system — Lucide 2px (DS) + custom fitness marks. */
const ASY_ICON_PATHS={"trash":"<path d=\"M3 6h18\"/><path d=\"M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/><path d=\"M10 11v6M14 11v6\"/>","medal":"<path d=\"M7.5 3h9l-3 6h-3z\"/><path d=\"M12 9v2\"/><circle cx=\"12\" cy=\"16\" r=\"5\"/><path d=\"M12 14v4M10 16h4\"/>","growth":"<path d=\"M4.5 16a4.5 4.5 0 0 1 4.5 4.5\"/><path d=\"M4.5 11.75a8.75 8.75 0 0 1 8.75 8.75\"/><path d=\"M4.5 7.5a13 13 0 0 1 13 13\"/><path d=\"M13 11 19.5 4.5\"/><path d=\"M14.8 4.5h4.7v4.7\"/>","barbell":"<line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"/><rect x=\"5.5\" y=\"7.5\" width=\"2.6\" height=\"9\" rx=\"0.6\"/><rect x=\"15.9\" y=\"7.5\" width=\"2.6\" height=\"9\" rx=\"0.6\"/><line x1=\"2.5\" y1=\"9.5\" x2=\"2.5\" y2=\"14.5\"/><line x1=\"21.5\" y1=\"9.5\" x2=\"21.5\" y2=\"14.5\"/>","lightbulb":"<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5\"/><path d=\"M9 18h6\"/><path d=\"M10 22h4\"/>","brain":"<path d=\"M12 5a3 3 0 0 0-5.5 1.7A3 3 0 0 0 5 12a3 3 0 0 0 1.7 5.3A3 3 0 0 0 12 19\"/><path d=\"M12 5a3 3 0 0 1 5.5 1.7A3 3 0 0 1 19 12a3 3 0 0 1-1.7 5.3A3 3 0 0 1 12 19\"/><path d=\"M12 5v14\"/>","scale":"<line x1=\"12\" y1=\"4\" x2=\"12\" y2=\"20\"/><line x1=\"7\" y1=\"20\" x2=\"17\" y2=\"20\"/><line x1=\"4\" y1=\"7\" x2=\"20\" y2=\"7\"/><path d=\"M4 7 1.6 12.6a2.4 2.4 0 0 0 4.8 0z\"/><path d=\"M20 7l-2.4 5.6a2.4 2.4 0 0 0 4.8 0z\"/>","warning":"<path d=\"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13.5\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>","siren":"<path d=\"M8 13a4 4 0 0 1 8 0v1.5H8z\"/><rect x=\"6\" y=\"14.5\" width=\"12\" height=\"5\" rx=\"1\"/><line x1=\"12\" y1=\"14.5\" x2=\"12\" y2=\"19.5\"/><line x1=\"12\" y1=\"6\" x2=\"12\" y2=\"3\"/><line x1=\"18\" y1=\"8.3\" x2=\"20.2\" y2=\"6.1\"/><line x1=\"6\" y1=\"8.3\" x2=\"3.8\" y2=\"6.1\"/><line x1=\"20\" y1=\"13\" x2=\"22.5\" y2=\"13\"/><line x1=\"4\" y1=\"13\" x2=\"1.5\" y2=\"13\"/>","kettlebell":"<path d=\"M7.7 11.3C6.2 8.4 7.6 4.8 12 4.8s5.8 3.6 4.3 6.5\"/><path d=\"M10 10c-.9-1.6-.2-3.3 2-3.3s2.9 1.7 2 3.3\"/><path d=\"M7.7 11.3a5.4 5.4 0 1 0 8.6 0\"/>","flagFinish":"<line x1=\"5\" y1=\"21\" x2=\"5\" y2=\"3\"/><path d=\"M5 4h14v9H5z\"/><line x1=\"5\" y1=\"8.5\" x2=\"19\" y2=\"8.5\"/><line x1=\"9.66\" y1=\"4\" x2=\"9.66\" y2=\"13\"/><line x1=\"14.33\" y1=\"4\" x2=\"14.33\" y2=\"13\"/>","lock":"<rect x=\"4\" y=\"10.5\" width=\"16\" height=\"10.5\" rx=\"2\"/><path d=\"M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5\"/>","notebook":"<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"1.5\"/><line x1=\"9\" y1=\"3\" x2=\"9\" y2=\"21\"/><line x1=\"12\" y1=\"8\" x2=\"16\" y2=\"8\"/><line x1=\"12\" y1=\"12\" x2=\"16\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"16\" y2=\"16\"/>","calculator":"<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"1.5\"/><rect x=\"8\" y=\"6\" width=\"8\" height=\"3\" rx=\"0.5\"/><line x1=\"8\" y1=\"13\" x2=\"8.01\" y2=\"13\"/><line x1=\"12\" y1=\"13\" x2=\"12.01\" y2=\"13\"/><line x1=\"16\" y1=\"13\" x2=\"16.01\" y2=\"13\"/><line x1=\"8\" y1=\"17\" x2=\"8.01\" y2=\"17\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/><line x1=\"16\" y1=\"17\" x2=\"16.01\" y2=\"17\"/>","home":"<path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><polyline points=\"9 22 9 12 15 12 15 22\"/>","dumbbell":"<path d=\"M6.5 6.5v11\"/><path d=\"M3.5 8.5v7\"/><path d=\"M17.5 6.5v11\"/><path d=\"M20.5 8.5v7\"/><line x1=\"6.5\" y1=\"12\" x2=\"17.5\" y2=\"12\"/>","chart":"<line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"10\"/><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"4\"/><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"16\"/>","user":"<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>","play":"<polygon points=\"6 3 20 12 6 21 6 3\"/>","pause":"<rect x=\"6\" y=\"4\" width=\"4\" height=\"16\"/><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\"/>","check":"<polyline points=\"20 6 9 17 4 12\"/>","plus":"<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>","minus":"<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>","x":"<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/>","chevronRight":"<polyline points=\"9 18 15 12 9 6\"/>","chevronLeft":"<polyline points=\"15 18 9 12 15 6\"/>","chevronDown":"<polyline points=\"6 9 12 15 18 9\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>","flame":"<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>","trophy":"<path d=\"M6 9H4.5a2.5 2.5 0 0 1 0-5H6\"/><path d=\"M18 9h1.5a2.5 2.5 0 0 0 0-5H18\"/><path d=\"M4 22h16\"/><path d=\"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22\"/><path d=\"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22\"/><path d=\"M18 2H6v7a6 6 0 0 0 12 0V2Z\"/>","bell":"<path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/>","arrowRight":"<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/>","more":"<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>","target":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>","zap":"<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/>","calendar":"<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"/><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"/><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"/><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"/>","history":"<path d=\"M3 3v5h5\"/><path d=\"M3.05 13A9 9 0 1 0 6 5.3L3 8\"/><polyline points=\"12 7 12 12 15 15\"/>","sliders":"<line x1=\"4\" y1=\"21\" x2=\"4\" y2=\"14\"/><line x1=\"4\" y1=\"10\" x2=\"4\" y2=\"3\"/><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"3\"/><line x1=\"20\" y1=\"21\" x2=\"20\" y2=\"16\"/><line x1=\"20\" y1=\"12\" x2=\"20\" y2=\"3\"/><line x1=\"1\" y1=\"14\" x2=\"7\" y2=\"14\"/><line x1=\"9\" y1=\"8\" x2=\"15\" y2=\"8\"/><line x1=\"17\" y1=\"16\" x2=\"23\" y2=\"16\"/>","skip":"<polygon points=\"5 4 15 12 5 20 5 4\"/><line x1=\"19\" y1=\"5\" x2=\"19\" y2=\"19\"/>","run":"<circle cx=\"15\" cy=\"5\" r=\"2\"/><path d=\"M14 7l-3 6\"/><path d=\"M14 9l4 1\"/><path d=\"M14 9l-4-1\"/><path d=\"M11 13l3 4-1 4\"/><path d=\"M11 13l-3 3 1 4\"/>","bike":"<circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><path d=\"M12 17.5V14l-3-3 4-3 2 3h2\"/>","swim":"<circle cx=\"8\" cy=\"9\" r=\"2\"/><path d=\"M10 10l4-2 3 2\"/><path d=\"M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0\"/><path d=\"M3 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0\"/>","shield":"<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10\"/>","sprout":"<path d=\"M7 20h10\"/><path d=\"M10 20c5.5-2.5.8-6.4 3-10\"/><path d=\"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z\"/><path d=\"M14.1 6c-.9 1-1.3 2.5-1.1 4 1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z\"/>","flag":"<path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\"/><line x1=\"4\" y1=\"22\" x2=\"4\" y2=\"15\"/>","dice":"<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M16 8h.01\"/><path d=\"M8 8h.01\"/><path d=\"M8 16h.01\"/><path d=\"M16 16h.01\"/><path d=\"M12 12h.01\"/>","backpack":"<path d=\"M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4\"/><path d=\"M8 18h8\"/><path d=\"M8 14h8\"/>","pencil":"<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z\"/>","copy":"<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>","bandage":"<rect x=\"1.8\" y=\"7.6\" width=\"20.4\" height=\"8.8\" rx=\"4.4\" transform=\"rotate(-45 12 12)\"/><line x1=\"8.6\" y1=\"8.6\" x2=\"15.4\" y2=\"15.4\"/><line x1=\"15.4\" y1=\"8.6\" x2=\"8.6\" y2=\"15.4\"/>","swap":"<line x1=\"3\" y1=\"8.5\" x2=\"17\" y2=\"8.5\"/><polyline points=\"14 5.5 17 8.5 14 11.5\"/><line x1=\"21\" y1=\"15.5\" x2=\"7\" y2=\"15.5\"/><polyline points=\"10 12.5 7 15.5 10 18.5\"/>"};
const ASY_EMOJI={"🏅":"medal","🏆":"trophy","💪":"growth","🏋":"barbell","🦾":"dumbbell","⚡":"zap","🔥":"flame","⚖":"scale","🛡":"shield","🌱":"sprout","🧠":"brain","💡":"lightbulb","🏠":"home","🎒":"backpack","🤸":"kettlebell","👤":"user","🎯":"target","🏁":"flagFinish","🔒":"lock","⚠":"warning","🚨":"siren","✅":"check","📓":"notebook","🧮":"calculator","🏃":"run","🚴":"bike","🏊":"swim","📅":"calendar","📈":"chart","📊":"chart","🎲":"dice","⏱":"clock"};
// Exercise names reach markup from the library, from swaps, and now from the add picker.
// Escaped on the way in so a name containing a quote or angle bracket can never break the
// attribute it sits in.
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function asyIcon(key,size){size=size||22;var n=String(key||'').replace(/\uFE0F/g,'');n=ASY_EMOJI[n]||n;var p=ASY_ICON_PATHS[n];if(!p)return key||'';return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto">'+p+'</svg>';}

// STORAGE
function getPrograms(){try{return JSON.parse(localStorage.getItem('ia_programs')||'[]');}catch{return[];}}
function savePrograms(p){localStorage.setItem('ia_programs',JSON.stringify(p));}
function getActiveProgId(){return localStorage.getItem('ia_active')||null;}
function setActiveProgId(id){localStorage.setItem('ia_active',id);}
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
// V156: id-parameterized variants. The zero-arg accessors above stay untouched so every
// existing call site is byte-identical; only the Progress selector and the wizard seed
// read OTHER programs' stores, and they must say which one out loud.
// V238 (D223 item 5): the same restNorm lens as getLogs.
function getLogsFor(pid){let l;try{l=JSON.parse(localStorage.getItem('ia_logs_'+pid)||'{}');}catch{return{};}return restNormAll(l);}
function getDayHistFor(pid){try{return JSON.parse(localStorage.getItem('ia_hist_'+pid)||'{}');}catch{return{};}}
function getExWeightsFor(pid){try{return JSON.parse(localStorage.getItem('ia_exw_'+pid)||'{}');}catch{return{};}}
function saveExWeightsFor(pid,obj){localStorage.setItem('ia_exw_'+pid,JSON.stringify(obj));}
function saveLogs(l){localStorage.setItem('ia_logs_'+activeProgId,JSON.stringify(l));}
function getCompleted(){try{return JSON.parse(localStorage.getItem('ia_comp_'+activeProgId)||'{}');}catch{return{};}}
function saveCompleted(c){localStorage.setItem('ia_comp_'+activeProgId,JSON.stringify(c));}
function getWildcardDone(){try{return JSON.parse(localStorage.getItem('ia_wild_'+activeProgId)||'[]');}catch{return[];}}
function saveWildcardDone(a){localStorage.setItem('ia_wild_'+activeProgId,JSON.stringify(a));}
function logKey(w,d){return 'w'+w+'_'+d;}

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
function readSetDraft(exKey){
  if(!exKey) return null;
  const e=getLogs()[logKey(currentWeek,currentDayKey)];
  return (e&&e.sets&&e.sets[exKey])||null;
}
// READ-MODIFY-WRITE, and it must stay that way. persistLogFields rebuilds the whole
// day entry from the form fields, so these two writers each have to preserve the
// other's half or whichever runs last silently destroys it.
function writeSetDraft(exKey,r,w,L){
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
function clearSetDraft(exKey){
  const logs=getLogs(), k=logKey(currentWeek,currentDayKey), e=logs[k];
  if(!e||!e.sets||!(exKey in e.sets)) return;
  delete e.sets[exKey];
  if(!Object.keys(e.sets).length) delete e.sets;
  logs[k]=e; saveLogs(logs);
}
function completedKey(w,d){return 'w'+w+'_'+d;}
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
function saveDayHist(h){try{localStorage.setItem('ia_hist_'+activeProgId,JSON.stringify(h));}catch(e){}}
// FIRST TOUCH WINS applies to the ENGINE's prescription, not to the athlete's own
// edits. If the day is edited after first touch, the snapshot must absorb that edit or
// the freeze will restore a day missing it — the exact shape of the V103→V104 bug, since
// ia_hist_ is the record and prog.weeks is only a build. This re-snapshots the day while
// preserving nothing else: it is
// called only from the athlete's own edit handlers: add, skip, swap, undo, never from the
// five normal hook points, so an untouched prescription can still never be rewritten.
function resnapshotDayEdit(week,dayKey){
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
function snapshotDay(week,dayKey){
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
  ASY_ICON_PATHS, asyIcon, clearSetDraft, completedKey, esc, getActiveProgId, getCompleted, getDayHist, getDayHistFor,
  getExWeightsFor, getLogs, getLogsFor, getPrograms, getWildcardDone, logKey, readSetDraft, resnapshotDayEdit,
  saveCompleted, saveExWeightsFor, saveLogs, savePrograms, saveWildcardDone, setActiveProgId, snapshotDay,
  writeSetDraft,
};
