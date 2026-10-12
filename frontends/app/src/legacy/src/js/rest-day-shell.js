import { completedKey, getCompleted, getLogs, getPrograms, saveLogs, savePrograms } from './storage.js';
import { getWeekMonday } from './calendar.js';
import { DAY_FULL } from './wizard.js';
import { _pattern } from './region-caps.js';
import { _PATTERN_REGION } from './budget-engine-d.js';
import { dayBeforeStart, renderWeekView } from './week-view-sections.js';
import { CARDIO_PARK_FIELDS } from './log-entries.js';
import { updateRestFloat } from './rest-timer.js';
import { renderProgList } from './programs.js';
import { showProgressScreen } from './progress-data.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── REST-DAY SHEET ───────────────────────────────────────────────────────────
const _restDraft={w:null,day:null,view:'menu',pick:null,type:null,mins:30,dist:'',rpe:5};
function openRestSheet(w,dayKey,view){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  if(!restDayEligible(w,dayKey)){showToast('That rest day has not come around yet');return;}
  _restDraft.w=w; _restDraft.day=dayKey; _restDraft.view=view||'menu'; _restDraft.pick=null;
  const types=(activeProg.cfg&&activeProg.cfg.cardioTypes)||[];
  _restDraft.type=types[0]||'run'; _restDraft.mins=30; _restDraft.dist=''; _restDraft.rpe=5;
  renderRestSheet();
  const o=document.getElementById('restOverlay'); o.classList.add('open'); o.scrollTop=0;
}
function closeRestSheet(){document.getElementById('restOverlay').classList.remove('open');}
function _rdSet(k,v){_restDraft[k]=v;renderRestSheet();}
function renderRestSheet(){
  const body=document.getElementById('restBody'); if(!body) return;
  const w=_restDraft.w, dk=_restDraft.day;
  const dayName=DAY_FULL[dk]||dk;
  if(_restDraft.view==='move')      body.innerHTML=_renderRestMove(w,dk,dayName);
  else if(_restDraft.view==='cardio') body.innerHTML=_renderRestCardio(w,dk,dayName);
  else body.innerHTML=
     '<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 REST DAY</div>'
    +'<div class="ov-title">Not resting?</div>'
    +'<div class="ov-intro">Two ways to use it. Move a session you have not done yet, or log whatever cardio you got in.</div>'
    +'<div class="ov-eq" onclick="_rdSet(\'view\',\'move\')"><div class="ov-eq-body"><div class="ov-eq-name">Train a session here</div><div class="ov-eq-desc">Move one of this week\u2019s untrained days onto today.</div></div></div>'
    +'<div class="ov-eq" onclick="_rdSet(\'view\',\'cardio\')"><div class="ov-eq-body"><div class="ov-eq-name">Log cardio</div><div class="ov-eq-desc">Ran, rode, swam, walked. Record it and move on.</div></div></div>';
}
function _renderRestMove(w,dk,dayName){
  const cands=restMoveCandidates(w);
  const head='<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 TRAINING ANYWAY</div>'
    +'<div class="ov-title">Move a session here</div>'
    +'<div class="ov-intro">Nothing gets added. Whatever you pick moves to '+dayName+', and its old day becomes your rest.</div>';
  if(!cands.length) return head
    +'<div class="ov-effect"><div class="ov-effect-ttl">Nothing left to move</div><div class="ov-effect-sub">Every session this week is logged or done. Take the rest, or log some cardio instead.</div></div>'
    +'<button class="ov-apply" onclick="_rdSet(\'view\',\'cardio\')">Log cardio instead</button>';
  const rows=cands.map(c=>{
    const sel=_restDraft.pick===c.day;
    return '<div class="ov-eq'+(sel?' sel':'')+'" onclick="_rdSet(\'pick\',\''+c.day+'\')"><div class="ov-eq-body"><div class="ov-eq-name">'+c.title+'</div><div class="ov-eq-desc" style="display:block">'+c.label+' \u00b7 not logged</div></div>'+(sel?'<span class="ov-eq-chk">\u2713</span>':'')+'</div>';
  }).join('');
  let warn='';
  if(_restDraft.pick){
    const src=activeProg.weeks[w][_restDraft.pick];
    const hits=restMoveCollisions(w,dk,src);
    if(hits.length){
      const reg=_dayRegion(src)||'that';
      const names=hits.map(h=>h.label).join(' and ');
      warn='<div class="ov-effect reassess-card" style="margin-top:12px"><div class="ov-effect-ttl" style="color:var(--red)">That\u2019s '+reg+' on top of '+reg+'</div>'
        +'<div class="ov-effect-sub">You have '+reg+' work on '+names+' too. Stack it here and something gives. Your call.</div></div>';
    }
  }
  return head+'<div class="ov-eq-lbl">NOT LOGGED THIS WEEK</div>'+rows+warn
    +(_restDraft.pick?'<button class="ov-apply" onclick="applyRestMove()">Move it here</button>':'');
}
function _renderRestCardio(w,dk,dayName){
  const types=((activeProg.cfg&&activeProg.cfg.cardioTypes)||[]).slice();
  if(!types.includes('walk')) types.push('walk');   // walk is what most rest-day movement is
  const LBL={run:'Run',bike:'Bike',swim:'Swim',row:'Row',walk:'Walk'};
  const chips=types.map(t=>'<div class="rd-chip'+(_restDraft.type===t?' sel':'')+'" onclick="_rdSet(\'type\',\''+t+'\')">'+(LBL[t]||t)+'</div>').join('');
  // RPE, not a separate easy/hard vocabulary — the whole app prescribes in RPE, so the
  // log should speak it too. Word anchors because RPE on a run is less instinctive.
  const RPE=[[5,'Easy','Conversational, full sentences'],[7,'Steady','Working, sentences getting short'],[9,'Hard','That\u2019s a training day, not a rest day']];
  const rpeRows=RPE.map(([v,n,d])=>'<div class="rd-chip wide'+(_restDraft.rpe===v?' sel':'')+'" onclick="_rdSet(\'rpe\','+v+')"><b>RPE '+v+(v===9?'+':'')+'</b> \u00b7 '+n+'<span>'+d+'</span></div>').join('');
  const distLbl=_restDraft.type==='swim'?'Distance (yards)':'Distance (miles)';
  const showDist=_restDraft.type!=='walk';
  const note=_restDraft.rpe>=9
    ? '<div class="ov-effect" style="border-color:var(--accent)"><div class="ov-effect-ttl" style="color:var(--accent)">Noted</div><div class="ov-effect-sub">Hard effort is not a rest day, it is a training day. Logging it as it happened. Keep an eye on how tomorrow feels.</div></div>'
    : '';
  return '<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 LOG CARDIO</div>'
    +'<div class="ov-title">What did you do?</div>'
    +'<div class="ov-intro">Easy work on a rest day is recovery, not extra load. This will not touch your program.</div>'
    +'<div class="ov-eq-lbl">MODALITY</div><div class="rd-row">'+chips+'</div>'
    +'<div class="ov-eq-lbl" style="margin-top:14px">TIME</div>'
    +'<div class="rd-row"><input class="rd-input" type="number" inputmode="numeric" min="1" max="600" value="'+_restDraft.mins+'" onchange="_restDraft.mins=+this.value||0" placeholder="minutes"><span class="rd-unit">min</span></div>'
    +(showDist?'<div class="ov-eq-lbl" style="margin-top:14px">'+distLbl+' <span style="text-transform:none;letter-spacing:0;opacity:.75">optional</span></div>'
      +'<div class="rd-row"><input class="rd-input" type="number" inputmode="decimal" step="0.1" min="0" value="'+_restDraft.dist+'" onchange="_restDraft.dist=this.value" placeholder="'+(_restDraft.type==='swim'?'yards':'miles')+'"></div>':'')
    +'<div class="ov-eq-lbl" style="margin-top:14px">HOW HARD</div>'+rpeRows
    +note
    +'<button class="ov-apply" onclick="applyRestCardio()">Log it</button>';
}
function applyRestMove(){
  const {w,day,pick}=_restDraft;
  if(!pick){showToast('Pick a session');return;}
  const moves=getRestMoves();
  moves[completedKey(w,day)]={from:pick,ts:Date.now()};
  saveRestMoves(moves);
  applyRestDayMoves(activeProg,moves);
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].weeks=activeProg.weeks; savePrograms(progs); }
  closeRestSheet(); renderWeekView();
  showToast('Moved. '+(DAY_FULL[pick]||pick)+' is your rest now \u2713');
}
function applyRestCardio(){
  const {w,day,type,mins,dist,rpe}=_restDraft;
  const m=+mins||0;
  if(m<=0){showToast('How long did you go?');return;}
  const logs=getLogs(); const k=completedKey(w,day);
  const e=Object.assign({},logs[k]||{});
  // V238 (D223 items 1-2, Amendment 1 A6, D226): the jog is its own record on the day,
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
  logs[k]=e; saveLogs(logs);
  closeRestSheet(); renderWeekView();
  showToast(m+' min logged \u2713');
}
// ── REST-DAY SESSIONS — storage, move engine, and guards ─────────────────────
// Two things an athlete can do on a rest day, and they behave differently on purpose.
//
// MOVE a session — strictly a relocation, never an addition. Whatever gets picked
// leaves its own day and lands here, so a 5-day week stays a 5-day week. Any untouched
// session in the week is eligible (missed Tuesday, or Friday pulled forward); "untouched"
// means no completion AND no logs, because moving a half-logged day would orphan the sets
// already recorded against it. Stored as destKey -> origin day and re-applied after every
// rebuild, so it survives refreshProgram like overlays and completions do.
//
// LOG CARDIO — genuinely additive, and that asymmetry is the coaching point: easy aerobic
// work on a rest day IS recovery (NSW active-recovery, Lydiard base), whereas an extra
// lifting session is just unplanned volume. Written into the SAME ia_logs_ store the rest
// of the app reads, so weekly mileage in Progress picks it up with no new plumbing.
function getRestMoves(){try{return JSON.parse(localStorage.getItem('ia_moves_'+activeProgId)||'{}');}catch{return{};}}
function saveRestMoves(m){localStorage.setItem('ia_moves_'+activeProgId,JSON.stringify(m));}
// Idempotent: safe to run on a freshly rebuilt week OR on a frozen week that already has
// the move baked in, which is why it can sit at the tail of refreshProgram unconditionally.
function applyRestDayMoves(prog,moves){
  if(!prog||!prog.weeks||!moves) return prog;
  Object.keys(moves).forEach(destKey=>{
    const mv=moves[destKey]; if(!mv) return;
    const origin=(typeof mv==='string')?mv:mv.from;
    const m=/^w(\d+)_(\w+)$/.exec(destKey); if(!m) return;
    const w=+m[1], dest=m[2];
    const wk=prog.weeks[w]; if(!wk) return;
    if(wk[dest]&&wk[dest].movedFrom===origin) return;      // already applied
    const src=wk[origin]; if(!src||src.rest||src.moved) return;
    wk[dest]={...src, movedFrom:origin};
    wk[origin]={title:src.title,dot:'rest',tags:['rest'],rest:true,moved:true,movedTo:dest};
  });
  return prog;
}
// Dominant training region of a day, for the spacing guard. The engine spaces legs/push/
// pull deliberately (NSW: 2 to 3 days between same-region work), so dropping legs next to
// legs silently undoes that. We warn rather than block — same posture as everywhere else.
function _dayRegion(day){
  if(!day||day.rest||!Array.isArray(day.sections)) return null;
  const tally={};
  day.sections.forEach(s=>(s.items||[]).forEach(it=>{
    const p=it&&it.name?_pattern(it.name):null; if(!p) return;
    const r=_PATTERN_REGION[p]; if(!r) return;
    tally[r]=(tally[r]||0)+1;
  }));
  let best=null,n=0;
  Object.keys(tally).forEach(r=>{ if(tally[r]>n){n=tally[r];best=r;} });
  return n>=2?best:null;   // one stray item is not a region day
}
// Neighbours of destDay that share its region. Returns [{day,label}], possibly empty.
function restMoveCollisions(w,destDay,srcDay){
  const reg=_dayRegion(srcDay); if(!reg) return [];
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const i=order.indexOf(destDay); if(i<0) return [];
  const wk=(activeProg&&activeProg.weeks&&activeProg.weeks[w])||{};
  const out=[];
  [-1,1].forEach(off=>{
    const j=i+off; if(j<0||j>6) return;
    const nd=order[j], d=wk[nd];
    if(!d||d.rest) return;
    if(_dayRegion(d)===reg) out.push({day:nd,label:DAY_FULL[nd]||nd,title:d.title||'that session'});
  });
  return out;
}
// A rest day accepts work only if it is today or already past, and inside the program.
// Future rest days are excluded on purpose: logging cardio you have not done yet is a
// prescription, not a log, and moving a session onto next Wednesday is just rescheduling
// the program, which is a different feature.
function restDayEligible(w,dayKey){
  if(!activeProg||!activeProg.startDate) return false;
  if(dayBeforeStart(activeProg,w,dayKey)) return false;       // V174 (D24)
  const day=activeProg.weeks&&activeProg.weeks[w]&&activeProg.weeks[w][dayKey];
  if(!day||!day.rest||day.moved) return false;
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const idx=order.indexOf(dayKey); if(idx<0) return false;
  const mon=getWeekMonday(activeProg.startDate);
  const d=new Date(mon); d.setDate(mon.getDate()+(w-1)*7+idx); d.setHours(0,0,0,0);
  const today=new Date(); today.setHours(0,0,0,0);
  return d<=today;
}
// Untouched = no completion and no logged data. A partially logged day stays put so the
// sets already recorded against it are never orphaned.
function restMoveCandidates(w){
  if(!activeProg||!activeProg.weeks||!activeProg.weeks[w]) return [];
  const comp=getCompleted(), logs=getLogs();
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const out=[];
  order.forEach(d=>{
    const day=activeProg.weeks[w][d];
    if(!day||day.rest||day.moved||day.movedFrom) return;
    const k=completedKey(w,d);
    if(comp[k]) return;
    const lg=logs[k];
    // V236 (D219 item 2): logged = an RPE, a note, or any field of CARDIO_PARK_FIELDS (the table cardioEntryLive
    // reads, every sport), so a Log-tapped time, pace or rep-time form is never offered as not logged.
    // V238 (D225): a live swap (swapTo) or parked numbers (parked) are a log too, so a swapped-away day is never
    // offered as a move origin. A chip tapped back to the planned sport leaves swapTo '' and no parked key
    // (setCardioSwap deletes an empty park), so that day is judged on its session fields alone again.
    if(lg&&(lg.rpe||lg.notes||lg.swapTo||lg.parked||Object.keys(CARDIO_PARK_FIELDS).some(function(s){ return CARDIO_PARK_FIELDS[s].some(function(f){ return !!lg[f]; }); }))) return;
    out.push({day:d,label:DAY_FULL[d]||d,title:day.title||'Training'});
  });
  return out;
}
let activeProgId=null,currentWeek=1,currentDayKey=null,activeProg=null,calcLift='Deadlift',editProgId=null,progressViewId=null,confirmProgId=null,confirmTier=0;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setActiveProgId(v){ activeProgId=v; }
function _setCurrentWeek(v){ currentWeek=v; }
function _setCurrentDayKey(v){ currentDayKey=v; }
function _setActiveProg(v){ activeProg=v; }
function _setCalcLift(v){ calcLift=v; }
function _setEditProgId(v){ editProgId=v; }
function _setProgressViewId(v){ progressViewId=v; }
function _setConfirmProgId(v){ confirmProgId=v; }
function _setConfirmTier(v){ confirmTier=v; }
// V168 D8 — render-scoped, NOT persisted. The D7 sentence fires on the first stale
// pill of a rendered day card; every stale pill below it goes dashed and silent.
// Reset in openDetail, which is also the re-render path for swap/skip/add, so an
// in-session edit re-arms it exactly once rather than losing it.
let _staleWarnShown=false,_staleWarnSrc='';
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setStaleWarnShown(v){ _staleWarnShown=v; }
function _setStaleWarnSrc(v){ _staleWarnSrc=v; }
let openProgIds=new Set();
let currentRandIdx=-1;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setCurrentRandIdx(v){ currentRandIdx=v; }

let _curScreen='screenHome';
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);updateTabBar(id);_curScreen=id;updateRestFloat();}
const TAB_MAP={screenHome:'tabHome',screenWeek:'tabWeek',screenProgress:'tabProgress',screenBugs:'tabBugs'};
function updateTabBar(id){
  const isDest=Object.prototype.hasOwnProperty.call(TAB_MAP,id);
  const bar=document.getElementById('tabBar');if(bar)bar.classList.toggle('show',isDest);
  document.querySelectorAll('.screen.with-tabbar').forEach(s=>s.classList.remove('with-tabbar'));
  if(isDest)document.getElementById(id).classList.add('with-tabbar');
  Object.values(TAB_MAP).forEach(tid=>{const t=document.getElementById(tid);if(t)t.classList.remove('active');});
  if(isDest){const t=document.getElementById(TAB_MAP[id]);if(t)t.classList.add('active');}
}
function tabGo(target){
  if(target==='screenHome'){showScreen('screenHome');renderProgList();return;}
  if(target==='screenBugs'){showScreen('screenBugs');return;}
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  if(target==='screenWeek'){showScreen('screenWeek');renderWeekView();return;}
  if(target==='screenProgress'){showProgressScreen();return;}
}
function showToast(msg){const t=document.getElementById('toast');t.innerHTML=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _curScreen, _setActiveProg, _setActiveProgId, _setCalcLift, _setConfirmProgId, _setConfirmTier, _setCurrentDayKey,
  _setCurrentRandIdx, _setCurrentWeek, _setEditProgId, _setProgressViewId, _setStaleWarnShown, _setStaleWarnSrc,
  _staleWarnShown, _staleWarnSrc, activeProg, activeProgId, applyRestDayMoves, calcLift, confirmProgId, confirmTier,
  currentDayKey, currentWeek, editProgId, openProgIds, openRestSheet, progressViewId, restDayEligible, showScreen,
  showToast,
};
