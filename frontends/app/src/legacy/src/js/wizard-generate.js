import { getPrograms, savePrograms } from './storage.js';
import { currentWeek, showScreen, showToast } from './rest-day-shell.js';
import { LIFTING_FOCUS_TO_GOAL, WD, _applyWizardStart, _rsRace, renderWizardStep, resolveStartDate } from './wizard.js';
import { calcProgramLength } from './nsw-cardio.js';
import { buildProgram } from './budget-engine-d.js';
import { renderWeekView } from './week-view-sections.js';
import { _rtIntroPending } from './rest-timer.js';
import { _fmtMileAnchor, progTestPin, renderProgList, runAnchorInfo } from './programs.js';
import { loadActiveProgram } from './program-manage.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// PROGRAM GENERATOR
function generateProgram(){
  // Check if we need to warn about program length
  const _wdGoalsExp={...WD.cardioGoals,_experience:WD.experience||'intermediate',_ageBracket:WD.ageBracket||'18-35',_eventTargeted:WD.eventTargeted};
  const _wdInternalGoal=LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced';
  const lengthResult=calcProgramLength(WD.cardioTypes||[],_wdGoalsExp,_wdInternalGoal);
  if(lengthResult.warning){
    // Show warning modal before generating
    showLengthWarning(lengthResult.warning, lengthResult.weeks, ()=>doGenerate());
    return;
  }
  doGenerate();
}
function showLengthWarning(msg, weeks, onConfirm){
  // Remove any existing instance so repeated triggers don't stack backdrops
  const existing=document.getElementById('lengthWarnOverlay');
  if(existing) existing.remove();
  const overlay=document.createElement('div');
  overlay.id='lengthWarnOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML=`<div style="background:var(--surface);border:1px solid var(--border2);border-radius:4px;padding:24px;max-width:360px;width:100%;">
    <div style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;">Heads Up</div>
    <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--text);margin-bottom:12px;">${weeks}-Week Program</div>
    <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:20px;">${msg}<br><br>The app will build you a <b style="color:var(--text)">${weeks}-week program</b> that safely progresses toward your goal. Stick to the plan and you will get there.</div>
    <div style="display:flex;gap:10px;">
      <button id="lengthWarnBack" style="flex:1;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:12px;border-radius:4px;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;">Go Back</button>
      <button id="confirmGenBtn" style="flex:2;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:12px;border-radius:4px;border:none;background:var(--accent);color:var(--on-ink);cursor:pointer;">Build ${weeks}-Week Plan</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  // Go Back: fully remove the overlay (backdrop included) and return to the wizard
  // on the step the user was on. The earlier bug removed only the inner content box
  // via closest('div[style]'), leaving the full-screen backdrop blocking the UI.
  document.getElementById('lengthWarnBack').onclick=()=>{
    overlay.remove();
    showScreen('screenWizard');
    renderWizardStep();
  };
  document.getElementById('confirmGenBtn').onclick=()=>{overlay.remove();onConfirm();};
}
// ── V176 (D9): mile-time validation. The chart clamps silently (5:00–12:00 rows);
// impossible entries are rejected here, and out-of-chart entries are told what the
// clamp will do BEFORE the build. D188: beginners see the field too and their
// entry is read, so D9 judges it at every level; a blank stays optional for them.
function _mileEntryState(g, exp){
  // V203 (D116): (g, exp) default to the wizard draft so the mid-program mile
  // sheet and the wizard share ONE validator and one set of strings.
  if(g===undefined) g=(typeof WD!=='undefined'&&WD.cardioGoals)?WD.cardioGoals.run:null;
  if(exp===undefined) exp=(typeof WD!=='undefined')?WD.experience:'';
  if(!g) return {ok:true};
  if(g.mileBestMins===undefined||g.mileBestMins===''){
    // D187 R3 (V225): a run_pace_goal with no mile has no anchor to build the clock from --
    // D110a's swim gate is the model. Every OTHER run goal type still passes through blank.
    // D188: beginners stay optional on every goal.
    if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};
    return {ok:true};
  }
  const mm=+g.mileBestMins, ss=+(g.mileBestSecs||0);
  const sec=mm*60+ss;
  // D183 (P-SAFEPACE amendment 2 (e)): no mid-sentence dashes; the D116 mile sheet shares these strings.
  if(!(mm>=0)||!(ss>=0)||ss>=60||!isFinite(sec)) return {ok:false,msg:'That mile time is not a real time. Check the minutes and seconds.'};
  if(sec<180) return {ok:false,msg:'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.'};
  if(sec>1500) return {ok:false,msg:'Over 25:00 reads as a walk, not a run. Check the entry.'};
  if(sec<300) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the chart\u2019s fastest row, 5:00. It tops out there.'};
  if(sec>720) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the 12:00 row, the chart\u2019s slowest. Consider a base block first.'};
  return {ok:true};
}
function _mileFieldHelp(){
  const g=(WD.cardioGoals&&WD.cardioGoals.run)||{}; const exp=WD.experience||'intermediate';
  if(g.id==='run_pace_goal' && exp!=='beginner') return 'Required. Your paces and your program length start from it.';
  const a=runAnchorInfo({cardioTypes:['run'],cardioGoals:{run:{id:g.id||'run_base'}},experience:exp}); if(!a) return 'Optional.';
  const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';
  return 'Optional. Leave it blank and your paces come from '+art+' '+m+' mile, the '+exp+' default. Enter a mile only if you have timed one.';
}
function _mileAdvisoryHTML(){
  const st=_mileEntryState(); const t=st.msg||st.adv||'';
  return '<div id="mileAdvisory" style="font-size:11px;line-height:1.45;margin-top:6px;display:'+(t?'block':'none')+';color:'+((st.msg&&!st.blank)?'var(--signal)':'var(--muted)')+'">'+t+'</div>';
}
function updateMileAdvisory(){
  const el=document.getElementById('mileAdvisory'); if(!el) return;
  const st=_mileEntryState(); const t=st.msg||st.adv||'';
  el.textContent=t; el.style.display=t?'block':'none';
  el.style.color=(st.msg&&!st.blank)?'var(--signal)':'var(--muted)';
}
// D110a M2 (V212, Mario: make it required): a swim time goal needs a real current time. One
// validator in the D9 shape, shared by the advisory and the doGenerate refusal. The 500 goal reads
// baseMins/baseSecs; the 100 goal reads baseMins/baseSecs (the 100) and base500Mins/base500Secs.
function _swimEntryState(g){
  if(g===undefined) g=(typeof WD!=='undefined'&&WD.cardioGoals)?WD.cardioGoals.swim:null;
  if(!g||(g.id!=='swim_500_time'&&g.id!=='swim_100_time')) return {ok:true};
  const unit=g.swimUnit||'yd', is100=g.id==='swim_100_time';
  const num=v=>(v===undefined||v===null||v==='')?0:+v;
  const fields=is100?['baseMins','baseSecs','base500Mins','base500Secs']:['baseMins','baseSecs'];
  for(const k of fields){ const v=num(g[k]); if(!isFinite(v)||(/Secs$/.test(k)&&v>=60)) return {ok:false,msg:'That is not a real time. Check the minutes and seconds.'}; }
  const tot=(m,s)=>num(g[m])*60+num(g[s]);
  const t500=is100?tot('base500Mins','base500Secs'):tot('baseMins','baseSecs');
  if(!(t500>0)) return {ok:false,blank:true,msg:'Required. Enter your most recent timed 500'+unit+'.'};
  if(is100){
    const t100=tot('baseMins','baseSecs');
    if(!(t100>0)) return {ok:false,blank:true,msg:'Required. Enter your most recent timed 100'+unit+'.'};
    if(t500/5<t100) return {ok:false,msg:'Your 500 pace is faster than your 100 time. Check both entries.'};
  }
  return {ok:true};
}
function _swimAdvisoryHTML(){
  const st=_swimEntryState(); const t=st.ok?'':(st.msg||'');
  return '<div id="swimAdvisory" style="font-size:11px;line-height:1.45;margin-top:6px;display:'+(t?'block':'none')+';color:'+(st.blank?'var(--muted)':'var(--signal)')+'">'+t+'</div>';
}
function updateSwimAdvisory(){
  const el=document.getElementById('swimAdvisory'); if(!el) return;
  const st=_swimEntryState(); const t=st.ok?'':(st.msg||'');
  el.textContent=t; el.style.display=t?'block':'none';
  el.style.color=st.blank?'var(--muted)':'var(--signal)';
}
function doGenerate(){
  // V176 (D9): impossible mile entries stop here, before anything builds.
  const _mv=_mileEntryState();
  if(!_mv.ok){ showToast(_mv.msg); showScreen('screenWizard'); renderWizardStep(); return; }
  // D110a M2 (V212): a swim time goal with no real current time stops here too.
  const _sv=_swimEntryState(WD.cardioGoals&&WD.cardioGoals.swim); if(!_sv.ok){ showToast(_sv.msg); showScreen('screenWizard'); renderWizardStep(); return; }
  showScreen('screenGenerate');
  const _previewGoals={...WD.cardioGoals,_experience:WD.experience||'intermediate',_ageBracket:WD.ageBracket||'18-35',_eventTargeted:WD.eventTargeted};
  let totalWeeksPreview=calcProgramLength(WD.cardioTypes||[],_previewGoals,LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks;

  // D106a (V207), D184 (V223): a test goal with a test date ends on the test week. The pin is
  // progTestPin's, taken here once from the RESOLVED start (the value _applyWizardStart stores
  // below), so buildProgram stays a pure function of cfg and never sees a date. The resolver is
  // given the test date (_rsRace, D184 c), so a short week that holds the test keeps the entered
  // day and pins week 1. A test before the start, or past week 26, pins nothing and the program
  // keeps its goal length. Race goals align through raceAlignment; run_base has no test. Both
  // pins are written on every generate, so a pin from an earlier build cannot survive into this one.
  const _tp = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start);
  WD._testWeek = (_tp && _tp.tw) || null;
  WD._raceDateCappedWeeks = WD._testWeek || totalWeeksPreview;
  totalWeeksPreview = WD._raceDateCappedWeeks;   // the screen names the length that builds
  document.getElementById('generateSub').textContent='Building your '+totalWeeksPreview+'-week program...';
  const msgs=['Analyzing your goals...','Building cardio progressions...','Selecting exercises...','Calculating weights...','Assembling '+totalWeeksPreview+' weeks...','Almost done...'];
  let i=0;const sub=document.getElementById('generateSub');
  const iv=setInterval(()=>{if(i<msgs.length)sub.textContent=msgs[i++];},380);
  setTimeout(()=>{
    clearInterval(iv);
    let prog;
    try {
      prog = buildProgram(WD);
      _applyWizardStart(prog, WD);              // V174: resolved start on the program, field off cfg
    } catch(err) {
      console.error('buildProgram error:', err);
      document.getElementById('generateSub').textContent = 'Error: ' + err.message;
      return;
    }
    const programs=getPrograms();
    // First program (list empty) arms the rest-timer discovery intro. Gating on list-empty —
    // NOT a localStorage flag — means it re-fires after a delete-all, so it's actually testable
    // and can't get permanently stuck the way ia_rt_seen / ia_rt_intro2 did.
    _rtIntroPending=(programs.length===0);
    programs.push(prog);savePrograms(programs);
    // V221 D178: the wizard commits through the loader; the program is stored on the line
    // above, so the loader reads it. The wizard still lands on week 1: calcCurrentWeek() is
    // later than 1 for a back-dated start (race-aligned NRC), and the landing does not move.
    loadActiveProgram(prog.id);
    currentWeek=1;
    // Update generate screen to show actual week count
    document.getElementById('generateSub').textContent='Your '+prog.totalWeeks+'-week program is ready!';
    setTimeout(()=>{showScreen('screenWeek');renderWeekView();renderProgList();},600);
  },2400);
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _mileAdvisoryHTML, _mileEntryState, _mileFieldHelp, _swimAdvisoryHTML, doGenerate, generateProgram };
