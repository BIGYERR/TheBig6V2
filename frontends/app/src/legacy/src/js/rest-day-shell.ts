import { completedKey, esc, getCompleted, getLogs, getPrograms, saveLogs, savePrograms } from './storage.ts';
import { getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { DAY_FULL } from './wizard.ts';
import { _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { _PATTERN_REGION } from '../../../../../../core/src/engine/budget-engine-d.ts';
import { REST_WORD, dayBeforeStart, renderWeekView, restLogHead, restLogLines } from './week-view-sections.ts';
import { CARDIO_PARK_FIELDS } from './log-entries.ts';
import { iaWheelFlush, iaWheelHTML, iaWheelInit } from './wheel-log.ts';
import { updateRestFloat } from './rest-timer.ts';
import { openDetail } from './day-detail.ts';
import { renderProgList } from './programs.ts';
import { showProgressScreen } from './progress-data.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── REST-DAY SHEET ───────────────────────────────────────────────────────────
// v0.240.0 (D228 item 2): no defaults. The face starts empty (the wheels' zero faces, no chip) and is seeded only from
// the athlete's own record (_restSeed): a prefill is a placeholder, never a stored value (Mario).
const _restDraft: Record<string, any>={w:null,day:null,view:'menu',pick:null,type:null,mins:'',dist:'',rpe:null,armed:false};
function openRestSheet(w: any,dayKey: any,view?: any){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  // v0.240.0 (D231 item 1): the sheet opens on every jog-eligible day; the menu and the move only where a move may land.
  if(!restJogEligible(w,dayKey)){showToast('That rest day has not come around yet');return;}
  const canMove=restDayEligible(w,dayKey);
  _restDraft.w=w; _restDraft.day=dayKey; _restDraft.view=canMove?(view||'menu'):'cardio'; _restDraft.pick=null; _restDraft.armed=false;
  // v0.240.0 (D228 item 1): the selected type is the first one holding a record, else the program's first sport.
  const types=(activeProg.cfg&&activeProg.cfg.cardioTypes)||[], held=_restHeld(w,dayKey);
  _restDraft.type=Object.keys(held).find(t=>_restIsRec(held[t]))||types[0]||'run';
  _restSeed();
  renderRestSheet();
  const o=document.getElementById('restOverlay'); o!.classList.add('open'); o!.scrollTop=0;
}
function closeRestSheet(){document.getElementById('restOverlay')!.classList.remove('open');}
function _rdSet(k: any,v: any){ if(k==='type'){ _rdType(v); return; } _restDraft[k]=v;renderRestSheet();}
// v0.240.0 (D228 item 1): a modality chip re-seeds the face from that type's record, never from a roll that was not logged.
function _rdType(t: any){ _restDraft.type=t; _restDraft.armed=false; _restSeed(); renderRestSheet(); }
// A chip tap takes any wheel still settling first; tapping the selected chip deselects it (D228 item 4).
function _rdRpe(v: any){
  const body=document.getElementById('restBody'); if(body) iaWheelFlush(body);
  _restDraft.rpe=(_restDraft.rpe!=null&&+_restDraft.rpe===v)?null:v; renderRestSheet();
}
// The day's restLog through the getLogs lens, or {}.
function _restHeld(w: any,dk: any){ const e=getLogs()[completedKey(w,dk)]; return (e&&e.restLog&&typeof e.restLog==='object')?e.restLog:{}; }
// A record is a type holding a time or a distance.
function _restIsRec(r: any){ return !!(r&&typeof r==='object'&&(+r.mins>0||+r.dist>0)); }
// The selected type's record, or null.
function _restRec(){ const r=_restHeld(_restDraft.w,_restDraft.day)[_restDraft.type]; return _restIsRec(r)?r:null; }
// The face from the record: the record is shown, not a prefill (D228 item 1).
function _restSeed(){
  const r=_restRec();
  _restDraft.mins=(r&&+r.mins>0)?String(r.mins):'';
  _restDraft.dist=(r&&_restDraft.type!=='walk'&&+r.dist>0)?String(r.dist):'';
  _restDraft.rpe=(r&&r.rpe!=null&&r.rpe!==''&&isFinite(+r.rpe))?+r.rpe:null;
}
function _restNum(v: any){ const n=parseFloat(String(v==null?'':v)); return n>0?n:0; }
// D228 item 3: the face equals the record, every number compared as a number.
function _restSame(r: any){
  const rp=(v: any)=>(v==null||v===''||!isFinite(+v))?null:+v;
  return _restNum(_restDraft.mins)===_restNum(r.mins)
    && (_restDraft.type==='walk'||_restNum(_restDraft.dist)===_restNum(r.dist))
    && rp(_restDraft.rpe)===rp(r.rpe);
}
// The button is a regime, as on the card: Logged ✓ while the face is the record, Log it once anything differs.
function _restRegime(){
  const b=document.getElementById('restLogBtn'); if(!b) return;
  const r=_restRec(); b.textContent=(r&&_restSame(r))?'Logged \u2713':'Log it';
}
// A wheel commit writes its hidden node and fires input; the face follows it, and the button with it.
function _restInput(ev: any){
  const id=ev&&ev.target&&ev.target.id;
  if(id==='rest_mins') _restDraft.mins=ev.target.value;
  else if(id==='rest_dist') _restDraft.dist=ev.target.value;
  else return;
  _restRegime();
}
function renderRestSheet(){
  const body=document.getElementById('restBody'); if(!body) return;
  const w=_restDraft.w, dk=_restDraft.day;
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ su
  const dayName=DAY_FULL[dk]||dk;
  if(_restDraft.view==='move')      body.innerHTML=_renderRestMove(w,dk,dayName);
  else if(_restDraft.view==='cardio'){
    body.innerHTML=_renderRestCardio(w,dk,dayName);
    // D229 item 2: the sheet's own wheels, initialised after every render; the face follows their commits.
    iaWheelInit(body);
    // @ts-expect-error TS2339 Property '_rdIn' does not exist on type 'HTMLElement'.
    if(!body._rdIn){ body._rdIn=true; body.addEventListener('input',_restInput); }
  }
  else body.innerHTML=
     '<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 REST DAY</div>'
    +'<div class="ov-title">Not resting?</div>'
    +'<div class="ov-intro">Two ways to use it. Move a session you have not done yet, or log whatever cardio you got in.</div>'
    +'<div class="ov-eq" onclick="_rdSet(\'view\',\'move\')"><div class="ov-eq-body"><div class="ov-eq-name">Train a session here</div><div class="ov-eq-desc">Move one of this week\u2019s untrained days onto today.</div></div></div>'
    +'<div class="ov-eq" onclick="_rdSet(\'view\',\'cardio\')"><div class="ov-eq-body"><div class="ov-eq-name">Log cardio</div><div class="ov-eq-desc">Ran, rode, swam, walked. Record it and move on.</div></div></div>';
}
function _renderRestMove(w: any,dk: any,dayName: any){
  const cands=restMoveCandidates(w);
  const head='<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 TRAINING ANYWAY</div>'
    +'<div class="ov-title">Move a session here</div>'
    +'<div class="ov-intro">Nothing gets added. Whatever you pick moves to '+dayName+', and its old day becomes your rest.</div>';
  // v0.240.0 (D232): a jog already on the day is said before the list, each line the sentence without "logged".
  const jog=restLogLines(_restHeld(w,dk));
  const already=jog.length
    ? '<div class="ov-effect"><div class="ov-effect-ttl">Already logged here</div><div class="ov-effect-sub">'
      +jog.map((l: any)=>l.replace(' logged','')+'<br>').join('')+'Move a session in and '+dayName+' is a double day. Your call.</div></div>'
    : '';
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
  return head+already+'<div class="ov-eq-lbl">NOT LOGGED THIS WEEK</div>'+rows+warn
    +(_restDraft.pick?'<button class="ov-apply" onclick="applyRestMove()">Move it here</button>':'');
}
function _renderRestCardio(w: any,dk: any,dayName: any){
  const types=((activeProg.cfg&&activeProg.cfg.cardioTypes)||[]).slice();
  if(!types.includes('walk')) types.push('walk');   // walk is what most rest-day movement is
  const held=_restHeld(w,dk), t=_restDraft.type, rec=_restRec();
  // A type holding a record always has its chip, ahead of walk.
  Object.keys(held).forEach(x=>{ if(_restIsRec(held[x])&&!types.includes(x)) types.splice(types.length-1,0,x); });
  const LBL: Record<string, string>={run:'Run',bike:'Bike',swim:'Swim',row:'Row',walk:'Walk'};
  // v0.240.0 (D228 item 1): a chip whose type holds a record prints a check.
  const chips=types.map((x: any)=>'<div class="rd-chip'+(t===x?' sel':'')+'" onclick="_rdType(\''+x+'\')">'+(LBL[x]||x)+(_restIsRec(held[x])?' \u2713':'')+'</div>').join('');
  // RPE, not a separate easy/hard vocabulary — the whole app prescribes in RPE, so the
  // log should speak it too. Word anchors because RPE on a run is less instinctive.
  const RPE=[[5,'Easy','Conversational, full sentences'],[7,'Steady','Working, sentences getting short'],[9,'Hard','That\u2019s a training day, not a rest day']];
  const rpeRows=RPE.map(([v,n,d])=>'<div class="rd-chip wide'+(_restDraft.rpe!=null&&+_restDraft.rpe===v?' sel':'')+'" onclick="_rdRpe('+v+')"><b>RPE '+v+(v===9?'+':'')+'</b> \u00b7 '+n+'<span>'+d+'</span></div>').join('');
  // v0.240.0 (D229 item 2): controls by type, on the sheet's own hidden ids. Run and bike: the time wheel and the miles
  // wheel. Row: the time wheel and a meters box. Swim: the time wheel and the card's yards box. Walk: the time wheel.
  const lbl=(x: any)=>'<div class="ov-eq-lbl" style="margin-top:14px">'+x+'</div>';
  let ctl=lbl('TIME')+'<div class="iaw-wrap iaw-solo">'+iaWheelHTML('hms','rest_mins',_restDraft.mins)+'</div>';
  if(t==='run'||t==='bike') ctl+=lbl('DISTANCE')+'<div class="iaw-wrap iaw-solo">'+iaWheelHTML('dist','rest_dist',_restDraft.dist)+'</div>';
  else if(t==='row'||t==='swim') ctl+=lbl(t==='row'?'DISTANCE (METERS)':'DISTANCE (YARDS)')
    +'<div class="rd-row"><input class="rd-input" type="number" inputmode="numeric" min="0"'+(t==='swim'?' step="25"':'')+' id="rest_dist" value="'+esc(_restDraft.dist)+'" placeholder="'+(t==='row'?'meters':'yards')+'"></div>';
  const note=_restDraft.rpe>=9
    ? '<div class="ov-effect" style="border-color:var(--accent)"><div class="ov-effect-ttl" style="color:var(--accent)">Noted</div><div class="ov-effect-sub">Hard effort is not a rest day, it is a training day. Logging it as it happened. Keep an eye on how tomorrow feels.</div></div>'
    : '';
  const word=REST_WORD[t]||t;
  return '<div class="ov-kicker">'+dayName.toUpperCase()+' \u00b7 LOG CARDIO</div>'
    +(rec
      ? '<div class="ov-title">Your '+word+' on '+dayName+'</div>'
        +'<div class="ov-intro">This is what you logged. Roll it to fix it, or clear it if it did not happen.</div>'
      : '<div class="ov-title">What did you do?</div>'
        +'<div class="ov-intro">Easy work on a rest day is recovery, not extra load. This will not touch your program.</div>')
    +'<div class="ov-eq-lbl">MODALITY</div><div class="rd-row">'+chips+'</div>'
    +ctl
    +'<div class="ov-eq-lbl" style="margin-top:14px">HOW HARD</div>'+rpeRows
    +note
    +'<button class="ov-apply" id="restLogBtn" onclick="applyRestCardio()">'+(rec&&_restSame(rec)?'Logged \u2713':'Log it')+'</button>'
    // D228 item 6: Clear, two taps, only where the selected type holds a record.
    +(rec?'<button class="ov-clear" id="restClearBtn" onclick="clearRestCardio()">'+(_restDraft.armed?'Tap again to clear':'Clear this '+word)+'</button>':'');
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
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ su
  showToast('Moved. '+(DAY_FULL[pick]||pick)+' is your rest now \u2713');
}
function applyRestCardio(){
  // v0.240.0 (D228 item 4): a wheel still settling writes its face first, as Done does (D179).
  const body=document.getElementById('restBody'); if(body) iaWheelFlush(body);
  const {w,day,type}=_restDraft, rec=_restRec();
  // D228 item 3: Logged ✓ with the face unchanged closes the sheet and writes nothing.
  if(rec&&_restSame(rec)){ closeRestSheet(); return; }
  const m=_restNum(_restDraft.mins), d=type==='walk'?0:_restNum(_restDraft.dist);
  // D228 item 5: nothing is ever written for an empty face; a record rolled to zero is removed only by Clear.
  if(m<=0&&d<=0){ showToast(rec?'To remove it, use Clear.':(type==='walk'?'Nothing to log yet. Add a time.':'Nothing to log yet. Add a time or a distance.')); return; }
  // V238 (D223): the jog is its own record on the day, restLog[type] = {mins?, dist?, rpe?}, numbers, writing no
  // key a session reads. v0.240.0 (D228 item 4, D226 amended; D229): Log writes the face over the type's record:
  // the time when above zero, the distance when above zero (never on walk), the RPE when a chip is selected; another
  // type keeps its own key. week and ts are stamped the way writeSetDraft stamps them.
  const logs=getLogs(); const k=completedKey(w,day);
  const e=Object.assign({},logs[k]||{}), rl=Object.assign({},e.restLog||{}), o: Record<string, any>={};
  if(m>0) o.mins=m;
  if(d>0) o.dist=d;
  if(_restDraft.rpe!=null&&_restDraft.rpe!==''&&isFinite(+_restDraft.rpe)) o.rpe=+_restDraft.rpe;
  rl[type]=o; e.restLog=rl; e.week=w; e.ts=Date.now();
  logs[k]=e; saveLogs(logs);
  closeRestSheet(); renderWeekView(); _restDetailRefresh(w,day);
  showToast(restLogHead(type,o)+' logged \u2713');
}
// v0.240.0 (D228 item 6): Clear, two taps. The first arms it and writes nothing. The second removes the type's
// record; restLog goes when it empties; the day key goes when nothing but week and ts is left (an emptied record
// would still freeze the day and turn Progress); anything else on the entry is left byte for byte.
function clearRestCardio(){
  if(!_restDraft.armed){ _restDraft.armed=true; const b=document.getElementById('restClearBtn'); if(b) b.textContent='Tap again to clear'; return; }
  _restDraft.armed=false;
  const {w,day,type}=_restDraft;
  const logs=getLogs(), k=completedKey(w,day), e=logs[k];
  if(e&&e.restLog&&e.restLog[type]){
    const n: Record<string, any>=Object.assign({},e), rl=Object.assign({},e.restLog);
    delete rl[type];
    if(Object.keys(rl).length) n.restLog=rl; else delete n.restLog;
    if(Object.keys(n).every(x=>x==='week'||x==='ts')) delete logs[k]; else logs[k]=n;
    saveLogs(logs);
  }
  closeRestSheet(); renderWeekView(); _restDetailRefresh(w,day);
  const word=REST_WORD[type]||type;
  showToast(word.charAt(0).toUpperCase()+word.slice(1)+' cleared');
}
// D231 item 4: a Log or a Clear opened from a double day's session card re-renders the card, so its block is current.
function _restDetailRefresh(w: any,day: any){
  const o=document.getElementById('detailOverlay');
  if(o&&o.classList.contains('open')&&w===currentWeek&&day===currentDayKey&&activeProg.weeks[w]&&activeProg.weeks[w][day]) openDetail(day,activeProg.weeks[w][day]);
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
function saveRestMoves(m: any){localStorage.setItem('ia_moves_'+activeProgId,JSON.stringify(m));}
// Idempotent: safe to run on a freshly rebuilt week OR on a frozen week that already has
// the move baked in, which is why it can sit at the tail of refreshProgram unconditionally.
function applyRestDayMoves(prog: any,moves: any){
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
function _dayRegion(day: any){
  if(!day||day.rest||!Array.isArray(day.sections)) return null;
  const tally: Record<string, any>={};
  // @ts-expect-error TS7006 Parameter 's' implicitly has an 'any' type.
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
function restMoveCollisions(w: any,destDay: any,srcDay: any){
  const reg=_dayRegion(srcDay); if(!reg) return [];
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const i=order.indexOf(destDay); if(i<0) return [];
  const wk=(activeProg&&activeProg.weeks&&activeProg.weeks[w])||{};
  const out: any[]=[];
  [-1,1].forEach(off=>{
    const j=i+off; if(j<0||j>6) return;
    const nd=order[j], d=wk[nd];
    if(!d||d.rest) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
    if(_dayRegion(d)===reg) out.push({day:nd,label:DAY_FULL[nd]||nd,title:d.title||'that session'});
  });
  return out;
}
// A rest day accepts work only if it is today or already past, and inside the program.
// Future rest days are excluded on purpose: logging cardio you have not done yet is a
// prescription, not a log, and moving a session onto next Wednesday is just rescheduling
// the program, which is a different feature.
// v0.240.0 (D231 item 1): jog-eligible: inside the program, the date has come, and the day is a rest day or already
// holds a jog (a double day). restDayEligible below stays the move's test (a rest day, not moved away).
function restJogEligible(w: any,dayKey: any){
  if(!activeProg||!activeProg.startDate) return false;
  if(dayBeforeStart(activeProg,w,dayKey)) return false;
  const day=activeProg.weeks&&activeProg.weeks[w]&&activeProg.weeks[w][dayKey];
  if(!day) return false;
  if(!day.rest&&!Object.keys(_restHeld(w,dayKey)).length) return false;
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const idx=order.indexOf(dayKey); if(idx<0) return false;
  const mon=getWeekMonday(activeProg.startDate);
  const d=new Date(mon); d.setDate(mon.getDate()+(w-1)*7+idx); d.setHours(0,0,0,0);
  const today=new Date(); today.setHours(0,0,0,0);
  return d<=today;
}
function restDayEligible(w: any,dayKey: any){
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
function restMoveCandidates(w: any){
  if(!activeProg||!activeProg.weeks||!activeProg.weeks[w]) return [];
  const comp=getCompleted(), logs=getLogs();
  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const out: any[]=[];
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
    if(lg&&(lg.rpe||lg.notes||lg.swapTo||lg.parked||Object.keys(CARDIO_PARK_FIELDS).some(function(s){ return CARDIO_PARK_FIELDS[s].some(function(f: any){ return !!lg[f]; }); }))) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
    out.push({day:d,label:DAY_FULL[d]||d,title:day.title||'Training'});
  });
  return out;
}
let activeProgId: any=null,currentWeek=1,currentDayKey: any=null,activeProg: any=null,calcLift='Deadlift',editProgId: any=null,progressViewId: any=null,confirmProgId: any=null,confirmTier=0;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setActiveProgId(v: any){ activeProgId=v; }
function _setCurrentWeek(v: any){ currentWeek=v; }
function _setCurrentDayKey(v: any){ currentDayKey=v; }
function _setActiveProg(v: any){ activeProg=v; }
function _setCalcLift(v: any){ calcLift=v; }
function _setEditProgId(v: any){ editProgId=v; }
function _setProgressViewId(v: any){ progressViewId=v; }
function _setConfirmProgId(v: any){ confirmProgId=v; }
function _setConfirmTier(v: any){ confirmTier=v; }
// V168 D8 — render-scoped, NOT persisted. The D7 sentence fires on the first stale
// pill of a rendered day card; every stale pill below it goes dashed and silent.
// Reset in openDetail, which is also the re-render path for swap/skip/add, so an
// in-session edit re-arms it exactly once rather than losing it.
let _staleWarnShown=false,_staleWarnSrc='';
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setStaleWarnShown(v: any){ _staleWarnShown=v; }
function _setStaleWarnSrc(v: any){ _staleWarnSrc=v; }
let openProgIds=new Set();
let currentRandIdx=-1;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setCurrentRandIdx(v: any){ currentRandIdx=v; }

let _curScreen='screenHome';
function showScreen(id: any){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)!.classList.add('active');window.scrollTo(0,0);updateTabBar(id);_curScreen=id;updateRestFloat();}
const TAB_MAP: Record<string, string>={screenHome:'tabHome',screenWeek:'tabWeek',screenProgress:'tabProgress',screenBugs:'tabBugs'};
function updateTabBar(id: any){
  const isDest=Object.prototype.hasOwnProperty.call(TAB_MAP,id);
  const bar=document.getElementById('tabBar');if(bar)bar.classList.toggle('show',isDest);
  document.querySelectorAll('.screen.with-tabbar').forEach(s=>s.classList.remove('with-tabbar'));
  if(isDest)document.getElementById(id)!.classList.add('with-tabbar');
  Object.values(TAB_MAP).forEach(tid=>{const t=document.getElementById(tid);if(t)t.classList.remove('active');});
  if(isDest){const t=document.getElementById(TAB_MAP[id]);if(t)t.classList.add('active');}
}
function tabGo(target: any){
  if(target==='screenHome'){showScreen('screenHome');renderProgList();return;}
  if(target==='screenBugs'){showScreen('screenBugs');return;}
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  if(target==='screenWeek'){showScreen('screenWeek');renderWeekView();return;}
  if(target==='screenProgress'){showProgressScreen();return;}
}
function showToast(msg: any){const t=document.getElementById('toast');t!.innerHTML=msg;t!.classList.add('show');setTimeout(()=>t!.classList.remove('show'),2200);}

// v0.249.1 (D256): iOS 26 leaves the layout viewport stale once the on-screen keyboard closes,
// and fixed elements drift with the page when it scrolls up: the tab bar floated mid-screen on
// Progress after a load was typed (WebKit bug 297779). A real scroll when the keyboard goes makes
// WebKit recompute where fixed elements belong; it lands back where it started. The step back waits a
// frame: two scrolls in one task net to nothing and the browser can drop them, so nothing would move.
function installKeyboardResync(win: any){
  const vv=win.visualViewport, doc=win.document;
  const isField=(el: any)=>!!el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName||'');
  const resync=()=>{ const x=win.scrollX||0, y=win.scrollY||0; win.scrollTo(x,y>0?y-1:y+1); win.requestAnimationFrame(()=>win.scrollTo(x,y)); };
  if(vv){
    let h=vv.height;
    vv.addEventListener('resize',()=>{ if(vv.height>h+100) win.setTimeout(resync,60); h=vv.height; });   // grew back: the keyboard closed
  }
  doc.addEventListener('focusout',()=>{ win.setTimeout(()=>{ if(!isField(doc.activeElement)) resync(); },350); });
}
installKeyboardResync(window);

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _curScreen, _setActiveProg, _setActiveProgId, _setCalcLift, _setConfirmProgId, _setConfirmTier, _setCurrentDayKey,
  _setCurrentRandIdx, _setCurrentWeek, _setEditProgId, _setProgressViewId, _setStaleWarnShown, _setStaleWarnSrc,
  _staleWarnShown, _staleWarnSrc, activeProg, activeProgId, applyRestDayMoves, calcLift, confirmProgId, confirmTier,
  currentDayKey, currentWeek, editProgId, openProgIds, openRestSheet, progressViewId, showScreen, showToast,
};
