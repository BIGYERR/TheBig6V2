import { esc, iaStore } from './storage.ts';
import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import {
  _setConfirmProgId, _setConfirmTier, _setProgressViewId, activeProgId, confirmProgId, confirmTier, showScreen,
} from './rest-day-shell.ts';
import {
  easyPaceByWeek, halfFromMilePace, liftLogFeedsOthers, longestRunByWeek, mileFromRecoveryPace, paceSeconds,
  plannedAndLoggedMiles, progressCutWeek, recoveryPaceByWeek, runClassOf, runPacesByClass, seedFromStoredPrograms,
} from '../../../../../../core/src/engine/state-progress.ts';
import { _clkMS } from '../../../../../../core/src/engine/clock-format.ts';
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

// ── RECOVERY PACE TREND (V155) AND THE WIZARD SEED (V156) ─────────────────────
// The readers live in @ia/core (core/src/engine/state-progress.ts, v0.261.7): the seed reads every program's logs and
// history from the store, and the weekly recovery pace is handed the viewed program's. The page names the store and
// the clock.
function seedFromPriorPrograms(now?: any): any{
  now = (typeof now==='number'&&now>0) ? now : Date.now();
  return seedFromStoredPrograms(iaStore, now);
}
function _paceStrToSec(t: any): any{ return paceSeconds(t); }
function recoveryPaceWeekly(logs: any, hist: any, totalWeeks: any): any{ return recoveryPaceByWeek(logs, hist, totalWeeks); }
function _mileFromRecoverySec(recSec: any): any{ return mileFromRecoveryPace(recSec); }
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
    svg+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(var(--ink-rgb),0.06)" stroke-width="1"/>'
       +'<text x="'+(padL-4)+'" y="'+(cy+4).toFixed(1)+'" fill="rgba(var(--ink-rgb),0.3)" font-size="8" text-anchor="end" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">'+_fmtPaceShort(yv)+'</text>';
  });
  if(tgt){ const ty=Y(tgt);
    svg+='<line x1="'+padL+'" y1="'+ty.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+ty.toFixed(1)+'" stroke="'+color+'" stroke-width="1" stroke-dasharray="2,4" opacity="0.55"/>'
       +'<text x="'+(W-padR-2)+'" y="'+(ty-3).toFixed(1)+'" font-size="7.5" fill="'+color+'" text-anchor="end" opacity="0.85">Plan '+_fmtPaceShort(tgt)+'/mi</text>';
  }
  let path='', prev: any=null, dots='', lastPt: any=null;
  data.forEach((v: any,i: any)=>{
    if(v===null){ prev=null; return; }
    const x=padL+i*xStep, y=Y(v);
    if(prev) path+=' M'+prev.x.toFixed(1)+','+prev.y.toFixed(1)+' L'+x.toFixed(1)+','+y.toFixed(1);
    prev={x,y}; lastPt={x,y,v};
    dots+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3.5" fill="'+color+'"/>';
  });
  if(path) svg+='<path d="'+path+'" stroke="'+color+'" stroke-width="1.5" stroke-dasharray="1,3" fill="none"/>';
  svg+=dots;
  if(lastPt) svg+='<text x="'+lastPt.x.toFixed(1)+'" y="'+(lastPt.y-8).toFixed(1)+'" font-size="8" font-weight="700" fill="'+color+'" text-anchor="middle">'+_fmtPaceShort(lastPt.v)+'</text>';
  const xLabelStep=n<=8?1:n<=16?2:4;
  weeks.forEach((w: any,i: any)=>{ if(i%xLabelStep!==0) return;
    svg+='<text x="'+(padL+i*xStep).toFixed(1)+'" y="'+(H-padB+14)+'" font-size="8" fill="rgba(var(--ink-rgb),0.35)" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">W'+w+'</text>';
  });
  svg+='<text x="'+(padL+plotW/2).toFixed(1)+'" y="'+(H-4)+'" font-size="8" fill="rgba(var(--ink-rgb),0.45)" text-anchor="middle">higher = faster easy pace \u00b7 dashed = plan target</text>';
  return '<div style="background:var(--surface);border:1px solid transparent;border-radius:16px;padding:14px 16px">'
    +'<div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0;color:'+color+';margin-bottom:10px">'+title+'</div>'
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
    return `<button onclick="setProgressView('${p.id}')" style="flex:0 0 auto;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0;padding:8px 12px;border-radius:16px;cursor:pointer;white-space:nowrap;border:1px solid ${sel?'var(--accent)':'var(--border)'};background:${sel?'var(--accent)':'var(--surface)'};color:${sel?'var(--on-ink)':'var(--muted)'}">${label}</button>`;
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
  // V168 D3 makes other programs read this one's ia_exw_ for their reuse pills; the rule is in @ia/core (v0.261.7).
  return liftLogFeedsOthers(iaStore, id);
}
function _restoreBarHTML(p: any){
  if(confirmProgId===p.id&&confirmTier===2){
    const _x=_purgeWarnsCrossProg(p.id)
      ?'<br><span style="color:var(--muted)">Other programs are using these loads as starting points \u2014 those will go blank.</span>'
      :'';
    return `<div style="display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--red);border-radius:16px;padding:10px 12px">
      <div style="font-size:12px;color:var(--red);line-height:1.5">This erases all logs, weights, and history for \u201C${esc(p.name||'Program')}\u201D. It cannot be undone.${_x}</div>
      <div style="display:flex;gap:8px">
        <button class="prog-action-btn danger" onclick="deleteProg('${p.id}',true)">Delete Forever</button>
        <button class="prog-action-btn" onclick="cancelProgressConfirm()">Cancel</button>
      </div>
    </div>`;
  }
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid transparent;border-radius:16px;padding:10px 12px">
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
var EASY_MIN_RUNS = 6;   // coverage gate: below this the module draws an empty state

// The readers below live in @ia/core (core/src/engine/state-progress.ts, v0.261.7), handed the viewed program's logs
// and history; the page keeps their names for its own screen and the Angular one, and names the clock.
function _halfFromMileSec(mileSec: any): any{ return halfFromMilePace(mileSec); }
function _cutWeek(p: any): any{ return progressCutWeek(p, Date.now()); }
function _runClass(subtype: any): any{ return runClassOf(subtype); }
const RUN_CLASS_COLOR = {Recovery:'var(--run)', Easy:'var(--run)', Long:'var(--bike)',
                         Tempo:'var(--lift)', Interval:'var(--red)'};
function ladderWeekly(logs: any, totalWeeks: any, cut: any, skip1: any): any{ return longestRunByWeek(logs, totalWeeks, cut, skip1); }
function runsByClass(logs: any, hist: any, totalWeeks: any): any{ return runPacesByClass(logs, hist, totalWeeks); }
function easyEffortWeekly(logs: any, hist: any, totalWeeks: any): any{ return easyPaceByWeek(logs, hist, totalWeeks); }
function plannedVsLogged(logs: any, hist: any, totalWeeks: any, cut: any, skip1: any): any{ return plannedAndLoggedMiles(logs, hist, totalWeeks, cut, skip1); }

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
  EASY_MIN_RUNS, RACE_DIST_MI, RUN_CLASS_COLOR, _cutWeek, _fmtPaceShort, _halfFromMileSec, _mileFromRecoverySec,
  _paceStrToSec, _progChipsHTML, _runClass, buildPaceChart, easyEffortWeekly, ladderWeekly, plannedVsLogged,
  recoveryPaceWeekly, runsByClass, seedFromPriorPrograms, showProgressScreen,
};
