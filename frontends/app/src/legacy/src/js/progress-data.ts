import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { esc, getDayHistFor, getExWeightsFor, getLogsFor, getPrograms } from './storage.ts';
import {
  _setConfirmProgId, _setConfirmTier, _setProgressViewId, activeProgId, confirmProgId, confirmTier, showScreen,
} from './rest-day-shell.ts';
import { getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { _clkMS } from '../../../../../../core/src/engine/clock-format.ts';
import { PACE_CHART } from '../../../../../../core/src/engine/cardio-progression.ts';
import { _epley } from './day-detail.ts';
import { renderProgressScreen } from './lift-ledger-progress-screen.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)


// ── PROGRESS SCREEN ──
function showProgressScreen() {
  _setConfirmProgId(null);_setConfirmTier(0);   // V169: never open Progress with a confirm armed
  _setProgressViewId(null);   // V156: always open on the active program
  renderProgressScreen();
  showScreen('screenProgress');
}

// ── RECOVERY PACE TREND (V155) ───────────────────────────────────────────────
// Ruled post-V154 (Mario: "B and recovery only"): session type resolves at READ time
// from the frozen ia_hist_ snapshot — the snapshot is the real prescription record
// (§5), so the chart never needs a second copy of a fact the freeze already owns.
// Scope is recovery-run subtypes ONLY; long runs are progressions (easy start, race-
// pace build) so their average pace is a mushier signal and stays off the chart.
// Weekly AVERAGE, never best — best-of would reward running recovery too hot, the
// exact thing the session note warns against.
// ── V156: WIZARD SEED (D4b/D5/D6 + G2/G3 rulings) ───────────────────────────
// Derives starting inputs for a NEW program from another program's recent logs.
// Window: 21 days (D5 = 3 weeks). Requires >= 3 qualifying recovery runs \u2014 both
// seeds or nothing. Mile estimate INVERTS the app's own PACE_CHART (recovery ->
// mile, linear interpolation, clamped at the table edges): zero invented constants.
// Baseline distance = max single logged run in the window (the wizard field asks
// single-run capability, NOT weekly mileage \u2014 flagged as a spec amendment to G2).
// Pre-fill only, never locked: the seed writes wizard fields the user can edit,
// which keeps D3 intact \u2014 no old number ever reaches a prescription directly.
var SEED_WINDOW_DAYS = 21;
var SEED_MIN_RUNS = 3;
function _mileFromRecoverySec(recSec: any){
  const rows=(typeof PACE_CHART!=='undefined')?PACE_CHART:null;
  if(!rows||!rows.length||!(recSec>0)) return null;
  if(recSec<=rows[0].recovery) return rows[0].mile;
  const last=rows[rows.length-1];
  if(recSec>=last.recovery) return last.mile;
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1], b=rows[i];
    if(recSec<=b.recovery){
      const f=(recSec-a.recovery)/(b.recovery-a.recovery);
      return a.mile+f*(b.mile-a.mile);
    }
  }
  return last.mile;
}
function seedFromPriorPrograms(now?: any){
  now = (typeof now==='number'&&now>0) ? now : Date.now();
  const cut = now - SEED_WINDOW_DAYS*86400000;
  let best: any=null;
  // @ts-expect-error TS7006 Parameter 'p' implicitly has an 'any' type.
  (getPrograms()||[]).forEach(p=>{
    if(!p||!p.id) return;
    const logs=getLogsFor(p.id), hist=getDayHistFor(p.id);
    const tw=p.totalWeeks||99;
    const paces: any[]=[]; let latest=0, maxDist=0;
    Object.entries(logs||{}).forEach(([key,e])=>{
      // @ts-expect-error TS2339 Property 'ts' does not exist on type '{}'.
      if(!e||!(e.ts>0)||e.ts<cut||e.ts>now) return;   // D5 window, both boundaries
      // @ts-expect-error TS2339 Property 'run_dist' does not exist on type '{}'.
      if(e.run_dist&&+e.run_dist>0) maxDist=Math.max(maxDist,+e.run_dist);
      // V238 (D224 max readers, Amendment 1 A3): a rest-day jog inside the ts window is its own
      // candidate for the longest run, never summed with the day's session. The pace seeds stay
      // blind: a jog has no pace.
      // @ts-expect-error TS2339 Property 'restLog' does not exist on type '{}'.
      const _jd=+((e.restLog||{}).run||{}).dist; if(_jd>0) maxDist=Math.max(maxDist,_jd);
      const r=_recoveryPaceEntry(key,e,hist,tw);       // V155 predicate, reused
      if(!r) return;
      // @ts-expect-error TS2339 Property 'ts' does not exist on type '{}'.
      paces.push(r.sec); if(e.ts>latest) latest=e.ts;
    });
    if(paces.length<SEED_MIN_RUNS) return;             // both seeds or nothing
    if(best&&latest<=best.latest) return;               // most recent qualifying wins
    const avg=paces.reduce((a,b)=>a+b,0)/paces.length;
    best={progId:p.id,progName:p.name||'previous block',latest,n:paces.length,
          avgRecSec:avg,mileSec:_mileFromRecoverySec(avg),
          maxDist:maxDist>0?+maxDist.toFixed(1):null};
  });
  return best;
}
function _paceStrToSec(t: any){ // "10:26/mi" or "10:26" -> seconds, else null
  if(!t) return null; const m=String(t).trim().match(/^(\d+):(\d{2})/);
  return m ? (+m[1])*60+(+m[2]) : null;
}
// V156: the V155 inclusion predicate, extracted verbatim so the wizard seed and the
// chart cannot drift apart. Returns {w, sec, tgt} for a qualifying recovery-run log
// entry, null otherwise. Every term is the V155 term; nothing added, nothing relaxed.
function _recoveryPaceEntry(key: any, e: any, hist: any, totalWeeks: any){
  if(!e || !e.run_pace) return null;
  if(e.swapTo) return null;                     // swapped session: not the prescribed run
  const m=key.match(/^w(\d+)_(.+)$/); if(!m) return null;
  const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return null;
  const snap=hist&&hist[key];                   // logKey === completedKey by construction
  if(!snap || !snap.cardio) return null;        // no snapshot -> EXCLUDED, never guessed
  const c=snap.cardio;
  // String() hardening (V156): the seed reads OTHER programs' hist stores, so a
  // corrupt non-string type must exclude, never throw. _paceStrToSec already coerces.
  if(String(c.type||'').toLowerCase()!=='run') return null;
  if(!/recovery/i.test(c.subtype||'')) return null;
  const sec=_paceStrToSec(e.run_pace); if(!sec) return null;
  return {w, sec, tgt:(c.dose && c.dose.tgt>0)?c.dose.tgt:null};
}
function recoveryPaceWeekly(logs: any, hist: any, totalWeeks: any){
  const wk={}, tgts: any[]=[];
  Object.entries(logs||{}).forEach(([key,e])=>{
    const r=_recoveryPaceEntry(key, e, hist, totalWeeks);
    if(!r) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
    (wk[r.w]=wk[r.w]||[]).push(r.sec);
    if(r.tgt) tgts.push(r.tgt);
  });
  const weekly={};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
  Object.entries(wk).forEach(([w,arr])=>{ weekly[+w]=arr.reduce((a: any,b: any)=>a+b,0)/arr.length; });
  const tgt=tgts.length?tgts.reduce((a,b)=>a+b,0)/tgts.length:null;
  return {weekly, tgt, nWeeks:Object.keys(weekly).length};
}
// Pace chart: DEDICATED builder, deliberately not an option-set on buildDotChart —
// pace needs an inverted axis (up = faster), a non-zero floor and m:ss labels, and
// threading three options through shared code puts four existing charts in the blast
// radius for zero visual gain. Same card chrome, same dot/dash grammar.
function _fmtPaceShort(sec: any){ return _clkMS(sec); }   // D126 (V204)
function buildPaceChart(title: any, weeks: any, data: any, tgt: any, color: any){
  // @ts-expect-error TS7006 Parameter 'v' implicitly has an 'any' type.
  const valid=data.filter(v=>v!==null);
  if(valid.length<2) return '';                 // one dot is not a trend
  const all=valid.concat(tgt?[tgt]:[]);
  let lo=Math.min.apply(null,all), hi=Math.max.apply(null,all);
  const pad=Math.max(15,(hi-lo)*0.15); lo-=pad; hi+=pad;
  const W=320,H=132,padL=42,padR=12,padT=16,padB=36;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const n=weeks.length, xStep=plotW/Math.max(n-1,1);
  // INVERTED: faster (smaller sec) plots HIGHER, so improvement reads upward.
  // @ts-expect-error TS7006 Parameter 'v' implicitly has an 'any' type.
  const Y=v=>padT+((v-lo)/(hi-lo))*plotH;
  const yLabels=[lo,(lo+hi)/2,hi];
  let svg='';
  yLabels.forEach(yv=>{ const cy=Y(yv);
    svg+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>'
       +'<text x="'+(padL-4)+'" y="'+(cy+4).toFixed(1)+'" fill="rgba(24,23,18,0.3)" font-size="8" text-anchor="end" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">'+_fmtPaceShort(yv)+'</text>';
  });
  if(tgt){ const ty=Y(tgt);
    svg+='<line x1="'+padL+'" y1="'+ty.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+ty.toFixed(1)+'" stroke="'+color+'" stroke-width="1" stroke-dasharray="2,4" opacity="0.55"/>'
       +'<text x="'+(W-padR-2)+'" y="'+(ty-3).toFixed(1)+'" font-size="7.5" fill="'+color+'" text-anchor="end" opacity="0.85">PLAN '+_fmtPaceShort(tgt)+'/mi</text>';
  }
  let path='', prev: any=null, dots='', lastPt=null;
  data.forEach((v: any,i: any)=>{
    if(v===null){ prev=null; return; }
    const x=padL+i*xStep, y=Y(v);
    if(prev) path+=' M'+prev.x.toFixed(1)+','+prev.y.toFixed(1)+' L'+x.toFixed(1)+','+y.toFixed(1);
    prev={x,y}; lastPt={x,y,v};
    dots+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3.5" fill="'+color+'"/>';
  });
  if(path) svg+='<path d="'+path+'" stroke="'+color+'" stroke-width="1.5" stroke-dasharray="1,3" fill="none"/>';
  svg+=dots;
  // @ts-expect-error TS2339 Property 'x' does not exist on type 'never'.
  if(lastPt) svg+='<text x="'+lastPt.x.toFixed(1)+'" y="'+(lastPt.y-8).toFixed(1)+'" font-size="8" font-weight="700" fill="'+color+'" text-anchor="middle">'+_fmtPaceShort(lastPt.v)+'</text>';
  const xLabelStep=n<=8?1:n<=16?2:4;
  weeks.forEach((w: any,i: any)=>{ if(i%xLabelStep!==0) return;
    svg+='<text x="'+(padL+i*xStep).toFixed(1)+'" y="'+(H-padB+14)+'" font-size="8" fill="rgba(24,23,18,0.35)" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">W'+w+'</text>';
  });
  svg+='<text x="'+(padL+plotW/2).toFixed(1)+'" y="'+(H-4)+'" font-size="8" fill="rgba(24,23,18,0.45)" text-anchor="middle">higher = faster easy pace \u00b7 dashed = plan target</text>';
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">'
    +'<div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:'+color+';margin-bottom:10px">'+title+'</div>'
    +'<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;overflow:visible">'+svg+'</svg></div>';
}

// V156: program selector chips for the Progress screen. One program's charts render
// at a time (lazy — heaviest DOM in the app). Active first, then other live programs,
// then archived with a badge. Hidden entirely when only one program exists.
function _progChipsHTML(programs: any, vid: any){
  if(!programs || programs.length<2) {
    const only=programs&&programs[0];
    return (only&&only.archived)?_restoreBarHTML(only):'';
  }
  const order=[...programs].sort((a,b)=>{
    const aa=a.id===activeProgId?0:(a.archived?2:1);
    const bb=b.id===activeProgId?0:(b.archived?2:1);
    return aa-bb||(b.created||0)-(a.created||0);
  });
  const chips=order.map(p=>{
    const sel=p.id===vid;
    const label=(p.archived?asyIcon('history',13)+' ':'')+(p.name||'Program');
    return `<button onclick="setProgressView('${p.id}')" style="flex:0 0 auto;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.04em;padding:8px 12px;border-radius:16px;cursor:pointer;white-space:nowrap;border:1px solid ${sel?'var(--accent)':'var(--border)'};background:${sel?'var(--accent)':'var(--surface)'};color:${sel?'var(--on-ink)':'var(--muted)'}">${label}</button>`;
  }).join('');
  // @ts-expect-error TS7006 Parameter 'p' implicitly has an 'any' type.
  const viewed=programs.find(p=>p.id===vid);
  return `<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch">${chips}</div>`
    +((viewed&&viewed.archived)?_restoreBarHTML(viewed):'');
}
// V169 — delete reachable from Progress. Deliberately gated behind ARCHIVE: a program
// must already be archived for this bar to render at all, so the accidental-start flow
// is archive-then-delete and the destructive control never sits next to a live program.
// The confirm is INLINE rather than a jump to the Programs screen — askPurge()'s tier-2
// card renders inside progCardActions, which is not on this surface.
function _purgeWarnsCrossProg(id: any){
  // V168 D3 makes other programs read this one's ia_exw_ for their reuse pills. Purging
  // it silently blanks loads elsewhere, so the confirm has to say so. Cheap proxy: this
  // program holds loaded-lift history AND at least one other program exists.
  try{
    if(getPrograms().filter(function(x: any){return x.id!==id;}).length===0) return false;
    return Object.keys(getExWeightsFor(id)||{}).length>0;
  }catch(e){ return false; }
}
function _restoreBarHTML(p: any){
  if(confirmProgId===p.id&&confirmTier===2){
    const _x=_purgeWarnsCrossProg(p.id)
      ?'<br><span style="color:var(--muted)">Other programs are using these loads as starting points \u2014 those will go blank.</span>'
      :'';
    return `<div style="display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--red);border-radius:4px;padding:10px 12px">
      <div style="font-size:12px;color:var(--red);line-height:1.5">This erases all logs, weights, and history for \u201C${esc(p.name||'Program')}\u201D. It cannot be undone.${_x}</div>
      <div style="display:flex;gap:8px">
        <button class="prog-action-btn danger" onclick="deleteProg('${p.id}',true)">Delete Forever</button>
        <button class="prog-action-btn" onclick="cancelProgressConfirm()">Cancel</button>
      </div>
    </div>`;
  }
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:10px 12px">
    <div style="font-size:12px;color:var(--muted)">This program is archived \u2014 history only.</div>
    <button class="prog-action-btn" style="flex:0 0 auto" onclick="unarchiveProg('${p.id}');renderProgressScreen()">Restore</button>
    <button class="prog-action-btn" aria-label="Delete this program forever" title="Delete forever" style="flex:0 0 auto;color:var(--red);padding:8px 10px;display:inline-flex;align-items:center" onclick="askPurgeFromProgress('${p.id}')">${asyIcon('trash',16)}</button>
  </div>`;
}
function askPurgeFromProgress(id: any){_setConfirmProgId(id);_setConfirmTier(2);renderProgressScreen();}
function cancelProgressConfirm(){_setConfirmProgId(null);_setConfirmTier(0);renderProgressScreen();}
function setProgressView(id: any){_setProgressViewId(id);renderProgressScreen();}
// ══ V165 — PROGRESS SCREEN REBUILD (D1/D2/D3/D5/D7/D8/D9/D10-A/D6) ══════════
// Six modules replace the V164 run/lift chart stack. Swim and bike dot charts are
// untouched: D7 named a run-and-lift set, and deleting a sport's only chart would
// break every non-running program.
//
// D6 (ruled: exclude) — the in-progress week is dropped from ACCUMULATING metrics
// only, because a sum or a weekly series understates on a partial week and reads as
// a failure. Per-observation metrics keep it: a run logged Tuesday is a whole run.
//   excluded : Drift From Plan (per-week sum), Long Run Ladder (per-week series)
//   kept     : class bands (per run), easy-effort mean (a mean does not understate),
//              projection (derives from that mean), ledger (all-time best)
// This split is §5 durable behaviour, not a detail of this build.
//
// D10-A (ruled) — the ledger benchmarks the athlete against their OWN intake number.
// HARD RULE, found during the build: DEFAULT_1RM is an experience-keyed estimate the
// engine anchors to, NOT something the athlete ever said. Using it as a ledger
// baseline invents progress — a beginner whose true bench is 135 would be scored
// against the 65 default and shown "+70 lbs" they never earned. Baseline is cfg[lift]
// when the athlete actually entered one, else the first LOGGED set, and the row says
// which. progSelData().estimated already draws this exact line; the ledger honours it.
const RACE_DIST_MI = {run_5k:3.1, run_10k:6.2, run_half:13.1, run_marathon:26.2};
var EASY_RPE_LO = 3, EASY_RPE_HI = 4;
var EASY_MIN_RUNS = 6;   // coverage gate: below this the module draws an empty state

// Forward read of PACE_CHART (mile equivalent -> half finish, seconds). The exact
// mirror of _mileFromRecoverySec, which walks the same table the other way. Chaining
// the two is a table lookup, not a model: zero invented constants.
function _halfFromMileSec(mileSec: any){
  const rows=(typeof PACE_CHART!=='undefined')?PACE_CHART:null;
  if(!rows||!rows.length||!(mileSec>0)) return null;
  if(mileSec<=rows[0].mile) return rows[0].halfBest;
  const last=rows[rows.length-1];
  if(mileSec>=last.mile) return last.halfBest;
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1], b=rows[i];
    if(mileSec<=b.mile){
      const f=(mileSec-a.mile)/(b.mile-a.mile);
      return a.halfBest+f*(b.halfBest-a.halfBest);
    }
  }
  return last.halfBest;
}

// Current week for ANY program. calcCurrentWeek() only knows activeProg, but Progress
// is per-program (V156 G1), so a viewed program needs its own reckoning.
function _progWeekNow(p: any){
  if(!p||!p.startDate) return 0;
  const mon=getWeekMonday(p.startDate);
  const today=new Date(); today.setHours(0,0,0,0);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((today-mon)/86400000);
  if(diff<0) return 0;
  return Math.min(p.totalWeeks||6, Math.floor(diff/7)+1);
}

// D6: the week to withhold from accumulating metrics, or 0 for none. A program with
// no start date has no "now", so nothing is excluded. The final week is never cut —
// once the block is over there is no in-progress week left to protect.
function _cutWeek(p: any){
  const w=_progWeekNow(p);
  if(!(w>0)) return 0;
  return (w>=(p.totalWeeks||6)) ? 0 : w;
}

// Intensity class from the frozen ia_hist_ subtype string the engine already writes.
// Order is load-bearing: "Easy Run — Long" is a long run, so /long/ must be tested
// before /easy/. Benchmark runs are tests, not training, and classify to null.
function _runClass(subtype: any){
  const s=String(subtype||'');
  if(!s) return null;
  if(/benchmark/i.test(s)) return null;
  if(/recovery/i.test(s)) return 'Recovery';
  // D103a (V208): ORDER IS LOAD-BEARING. "Long Interval (LI)" is the CHI renamed and contains
  // "interval", so its tokens class it as Tempo BEFORE the interval test; the INT's new name joins
  // the interval test. One program's history never splits across the rename. Only the rename
  // tokens move ahead: every label printed today keeps its class (NRC "Speed Run — Tempo" stays
  // Interval).
  if(/\(LI\)|long interval/i.test(s)) return 'Tempo';
  if(/interval|\(INT\)|\(SI\)|short interval|speed/i.test(s)) return 'Interval';
  if(/CHI|high intensity|tempo|threshold|steady/i.test(s)) return 'Tempo';
  if(/long|LSD/i.test(s)) return 'Long';
  if(/easy/i.test(s)) return 'Easy';
  return null;
}
const RUN_CLASS_ORDER = ['Recovery','Easy','Long','Tempo','Interval'];
const RUN_CLASS_COLOR = {Recovery:'var(--run)', Easy:'var(--run)', Long:'var(--bike)',
                         Tempo:'var(--lift)', Interval:'var(--red)'};

// ── Module 1: LONG RUN LADDER ───────────────────────────────────────────────
// Longest SINGLE run per week (not weekly volume — the ladder answers "can I cover
// the distance", which is a single-effort question). D6 excluded: accumulating series.
function ladderWeekly(logs: any, totalWeeks: any, cut: any, skip1: any){
  const wk={};
  Object.entries(logs||{}).forEach(([key,e])=>{
    if(!e) return;
    const m=key.match(/^w(\d+)_/); if(!m) return;
    const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return;
    if(cut&&w===cut) return;                       // D6
    if(skip1&&w===1) return;                       // V174 D26: short first week
    // V238 (D224 max readers, Amendment 1 A5): the rest-day jog is one more candidate for the
    // week's longest single run, never added to the day's session: a double day's longest run is
    // max(session, jog).
    // @ts-expect-error TS2339 Property 'run_dist' does not exist on type '{}'.
    const d=+e.run_dist, j=+((e.restLog||{}).run||{}).dist;
    const top=Math.max(d>0?d:0, j>0?j:0); if(!(top>0)) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
    wk[w]=Math.max(wk[w]||0, top);
  });
  return wk;
}

// ── Module 2: RUNS BY INTENSITY CLASS ───────────────────────────────────────
// Per-observation: the current week is KEPT (D6). Every logged run with a pace and a
// resolvable class becomes one dot. Swapped sessions are excluded on the same grounds
// V155 excludes them — a swapped session is not the prescribed run.
function runsByClass(logs: any, hist: any, totalWeeks: any){
  const out={};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
  RUN_CLASS_ORDER.forEach(c=>out[c]=[]);
  Object.entries(logs||{}).forEach(([key,e])=>{
    // @ts-expect-error TS2339 Property 'run_pace' does not exist on type '{}'.
    if(!e||!e.run_pace||e.swapTo) return;
    const m=key.match(/^w(\d+)_(.+)$/); if(!m) return;
    const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return;
    const snap=hist&&hist[key];
    if(!snap||!snap.cardio) return;                // no freeze -> excluded, never guessed
    if(String(snap.cardio.type||'').toLowerCase()!=='run') return;
    const cls=_runClass(snap.cardio.subtype); if(!cls) return;
    // @ts-expect-error TS2339 Property 'run_pace' does not exist on type '{}'.
    const sec=_paceStrToSec(e.run_pace); if(!sec) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type '"Tempo" | "Recovery" | "Interval" | "L
    out[cls].push({w, sec});
  });
  return out;
}

// ── Module 3: SAME EFFORT, MORE SPEED ───────────────────────────────────────
// Easy/recovery runs filtered to the easy-effort RPE window so effort is pinned and
// pace is the only free variable. Weekly MEAN, never best — a best-of would reward
// running easy days hot, the exact thing V155 was ruled against. Current week kept:
// a mean does not understate on a partial week the way a sum does.
function easyEffortWeekly(logs: any, hist: any, totalWeeks: any){
  const wk={}; let n=0;
  Object.entries(logs||{}).forEach(([key,e])=>{
    // @ts-expect-error TS2339 Property 'run_pace' does not exist on type '{}'.
    if(!e||!e.run_pace||e.swapTo) return;
    // @ts-expect-error TS2339 Property 'rpe' does not exist on type '{}'.
    const rpe=+e.rpe; if(!(rpe>=EASY_RPE_LO&&rpe<=EASY_RPE_HI)) return;
    const m=key.match(/^w(\d+)_(.+)$/); if(!m) return;
    const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return;
    const snap=hist&&hist[key];
    if(!snap||!snap.cardio) return;
    if(String(snap.cardio.type||'').toLowerCase()!=='run') return;
    const cls=_runClass(snap.cardio.subtype);
    if(cls!=='Recovery'&&cls!=='Easy') return;
    // @ts-expect-error TS2339 Property 'run_pace' does not exist on type '{}'.
    const sec=_paceStrToSec(e.run_pace); if(!sec) return;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
    (wk[w]=wk[w]||[]).push(sec); n++;
  });
  const weekly={};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
  Object.entries(wk).forEach(([w,arr])=>{ weekly[+w]=arr.reduce((a: any,b: any)=>a+b,0)/arr.length; });
  return {weekly, nRuns:n, nWeeks:Object.keys(weekly).length};
}

// ── Module 5: DRIFT FROM PLAN ───────────────────────────────────────────────
// PAIRED per day, never summed independently: the prescribed side only exists for
// distance-dosed runs (a time-dosed run has no written mileage, and deriving one from
// pace x time would be inventing a prescription). Summing all logged miles against a
// partial set of prescriptions would manufacture a surplus. D6 excluded: weekly sum.
function plannedVsLogged(logs: any, hist: any, totalWeeks: any, cut: any, skip1: any){
  const wk={};
  Object.entries(hist||{}).forEach(([key,snap])=>{
    // @ts-expect-error TS2339 Property 'cardio' does not exist on type '{}'.
    if(!snap||!snap.cardio) return;
    // @ts-expect-error TS2339 Property 'cardio' does not exist on type '{}'.
    const c=snap.cardio;
    if(String(c.type||'').toLowerCase()!=='run') return;
    const dose=c.dose; if(!dose||!(+dose.mi>0)) return;
    const m=key.match(/^w(\d+)_/); if(!m) return;
    const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return;
    if(cut&&w===cut) return;                       // D6
    if(skip1&&w===1) return;                       // V174 D26: short first week
    const e=(logs||{})[key];
    if(e&&e.swapTo) return;                        // swapped away: not this prescription
    const act=(e&&+e.run_dist>0)?+e.run_dist:0;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
    if(!wk[w]) wk[w]={presc:0, act:0};
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
    wk[w].presc+=+dose.mi; wk[w].act+=act;
  });
  return wk;
}

// ── Module 6: LIFT LEDGER ───────────────────────────────────────────────────
// Best e1RM per movement against a baseline the athlete actually supplied. Both sides
// run through _epley() so a working triple is never measured against an intake single.
const _LEDGER_MAIN = [
  // @ts-expect-error TS7006 Parameter 'n' implicitly has an 'any' type.
  {k:'squat',    label:'Squat',    test:n=>(n.includes('back squat')||n.includes('front squat')||n.includes('box squat'))&&!n.includes('goblet')&&!n.includes('jump')},
  // @ts-expect-error TS7006 Parameter 'n' implicitly has an 'any' type.
  {k:'bench',    label:'Bench',    test:n=>n.includes('bench')&&!n.includes('db')&&!n.includes('dumbbell')&&!n.includes('bench dip')},
  // @ts-expect-error TS7006 Parameter 'n' implicitly has an 'any' type.
  {k:'deadlift', label:'Deadlift', test:n=>n.includes('deadlift')&&!n.includes('single-leg')&&!n.includes('romanian')}
];
// Best estimated max from one stored entry. Prefers the per-set ladder (setsW/setsDone,
// V105/V117) because the top e1RM is not always the top weight — 225x5 beats 245x1.
// Falls back to entry.weight x parsed setsReps, then to the bare weight as a single.
function _entryBestE1RM(en: any){
  if(!en) return 0;
  let best=0;
  const sw=en.setsW||[], sd=en.setsDone||[];
  for(let i=0;i<Math.max(sw.length,sd.length);i++){
    const w=+sw[i]||+en.weight||0, r=+sd[i]||0;
    if(w>0&&r>0) best=Math.max(best,_epley(w,r));
  }
  if(best>0) return best;
  const w=+en.weight||0; if(!(w>0)) return 0;
  const m=String(en.setsReps||'').match(/(\d+)\s*$/);
  const reps=m?+m[1]:1;
  return _epley(w, reps>0?reps:1);
}
function ledgerRows(exw: any, cfg: any){
  const mains: any[]=[], accessories: any[]=[];
  Object.values(exw||{}).forEach(ex=>{
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    const entries=(ex.entries||[]).filter(e=>+e.weight>0);
    if(!entries.length) return;
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    const n=(ex.name||'').toLowerCase();
    const hit=_LEDGER_MAIN.find(L=>L.test(n));
    let cur=0, curEn=null;
    // @ts-expect-error TS7006 Parameter 'en' implicitly has an 'any' type.
    entries.forEach(en=>{ const v=_entryBestE1RM(en); if(v>cur){cur=v; curEn=en;} });
    if(!(cur>0)) return;
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    const row={name:ex.name||'', entries, cur, curEn};
    if(hit){
      const typed=+((cfg||{})[hit.k==='deadlift'?'deadlift':hit.k])||0;
      // NEVER DEFAULT_1RM — see the hard rule at the top of this block.
      const first=entries.slice().sort((a: any,b: any)=>(a.week-b.week)||((a.ts||0)-(b.ts||0)))[0];
      // @ts-expect-error TS2339 Property 'base' does not exist on type '{ name: any; entries: any; cur: number; curEn: null; }'.
      row.base   = typed>0 ? typed : _entryBestE1RM(first);
      // @ts-expect-error TS2339 Property 'baseSrc' does not exist on type '{ name: any; entries: any; cur: number; curEn: null; }'.
      row.baseSrc= typed>0 ? 'intake 1RM' : 'W'+((first&&first.week)||1)+' logged';
      // @ts-expect-error TS2339 Property 'label' does not exist on type '{ name: any; entries: any; cur: number; curEn: null; }'.
      row.label  = hit.label;
      mains.push(row);
    } else accessories.push(row);
  });
  mains.sort((a,b)=>(b.cur-b.base)-(a.cur-a.base));
  return {mains, accessories};
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  EASY_MIN_RUNS, EASY_RPE_HI, EASY_RPE_LO, RACE_DIST_MI, RUN_CLASS_COLOR, RUN_CLASS_ORDER, _cutWeek, _fmtPaceShort,
  _halfFromMileSec, _mileFromRecoverySec, _paceStrToSec, _progChipsHTML, _runClass, buildPaceChart, easyEffortWeekly,
  ladderWeekly, plannedVsLogged, recoveryPaceWeekly, runsByClass, seedFromPriorPrograms, showProgressScreen,
};
