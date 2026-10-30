import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { getActiveProgId, getPrograms, savePrograms } from './storage.ts';
import {
  _setActiveProg, _setCurrentWeek, activeProg, activeProgId, confirmProgId, confirmTier, editProgId, openProgIds,
  showToast,
} from './rest-day-shell.ts';
import { DEFAULT_1RM, LIFTING_FOCUS_TO_GOAL } from '../../../../../../core/src/engine/exercise-library.ts';
import { ALL_DAYS_ORDER, getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { _fmtMileAnchor } from '../../../../../../core/src/engine/clock-format.ts';
import {
  CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS, _GOAL_RANK, _GOAL_REQ_INPUTS, _fmtStartDay, _rsRace, resolveStartDate,
} from './wizard.ts';
import { NSW_TABLE6_INT, calcProgramLength } from '../../../../../../core/src/engine/nsw-cardio.ts';
import {
  NRC_GOALS, PACE_GOALS, raceAlignment, raceCountdown, raceCountdownWords, testWeekIndex,
} from '../../../../../../core/src/engine/nrc-race-bike-swim.ts';
import { runAnchorInfo } from '../../../../../../core/src/engine/cardio-progression.ts';
import { _mileEntryState } from './wizard-generate.ts';
import { calcCurrentWeek, renderWeekView } from './week-view-sections.ts';
import { refreshProgram } from './program-manage.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// V188 (D14a): alignment of a built program, from its stored cfg.
function progAlignment(p: any){
  const c=p&&p.cfg; if(!c||!c.cardioTypes||!c.cardioTypes.includes('run')||!c.cardioGoals||!c.cardioGoals.run) return null;
  return raceAlignment(c.cardioGoals.run.id, c.raceDate, c.eventTargeted!==false);
}
function setProgRace(dateStr: any){
  if(!dateStr||!activeProg||!activeProg.cfg) return;
  const before=activeProg.cfg.raceDate;
  activeProg.cfg.raceDate=dateStr;
  const _al=progAlignment(activeProg);
  if(!_al){ activeProg.cfg.raceDate=before; showToast('That date didn\u2019t resolve'); return; }
  activeProg.startDate=_al.start;   // blockOpen stays — the weeks behind you don't move
  const programs=getPrograms();const idx=programs.findIndex(p=>p.id===activeProgId);
  if(idx>=0){programs[idx]=activeProg;savePrograms(programs);}
  _setActiveProg(refreshProgram(activeProg));   // untrained weeks re-pin; trained weeks stay frozen
  _setCurrentWeek(calcCurrentWeek());
  showToast('Race day '+_fmtStartDay(_al.raceIso)+' \u2014 plan starts '+_fmtStartDay(_al.start)+' \u2713');
  renderWeekView();
}
// D106a (V207), D184 (V223): the one owner of the dated test pin. A run_pace_goal-family goal
// with a test date and eventTargeted pins to the week holding its test whenever that week is a
// row of Table 6 (rows 1 to 26; index 0 is unused). A test before the start, or past week 26,
// pins nothing. doGenerate, setProgStart and the boot backfill read this predicate; none of them
// carries its own. Returns {tw, len, week, cap}: tw the pinned week or null, len the goal length
// (sized the way buildProgram sizes it), week the raw test week (null before the start), cap the
// last row of Table 6 (26), the one place that number is taken, which the wizard's beyond 26 card
// prints; null for any other program.
function progTestPin(cfg: any, startIso: any){
  const c = cfg || {}, g = c.cardioGoals && c.cardioGoals.run;
  if(!(c.cardioTypes||[]).includes('run') || !g || !PACE_GOALS.has(g.id) || c.eventTargeted === false || !c.raceDate) return null;
  const len = calcProgramLength(c.cardioTypes, {...c.cardioGoals, _experience:c.experience||'intermediate', _ageBracket:c.ageBracket||'18-35', _eventTargeted:c.eventTargeted},
    LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||c.liftingFocus||'balanced').weeks;
  const week = testWeekIndex(startIso, c.raceDate), cap = NSW_TABLE6_INT.length - 1;
  return {tw: (week! >= 1 && week! <= cap) ? week : null, len, week, cap};
}
function setProgStart(dateStr: any){
  if(!dateStr||!activeProg) return;
  // V174: same resolver as the wizard, so the D25 guard and the D21 statement hold here too.
  // D184 (c): it is given the test date (_rsRace), so a re-date into a short week that holds
  // the test keeps the entered day and pins week 1; NRC and undated goals get null and snap as before.
  const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[],_rsRace(activeProg.cfg));
  activeProg.startDate=_r.start;
  // D106a (V207): a dated test goal re-pins its test week from the new start. Untrained
  // weeks re-pin; trained weeks stay frozen (refreshProgram), the same as setProgRace.
  const _tp=progTestPin(activeProg.cfg,_r.start);
  if(_tp){ activeProg.cfg._testWeek=_tp.tw; activeProg.cfg._raceDateCappedWeeks=_tp.tw||_tp.len; }
  const programs=getPrograms();const idx=programs.findIndex(p=>p.id===activeProgId);
  if(idx>=0){programs[idx]=activeProg;savePrograms(programs);}
  if(_tp) _setActiveProg(refreshProgram(activeProg));   // untrained weeks re-pin; trained weeks stay frozen
  _setCurrentWeek(calcCurrentWeek());
  // D184 (c) Q4: the holdsTest arm is first (a holdsTest return is also partial). Both surfaces read
  // the same resolver return; the toast never went through startResolveCopy. No dashes in the arms.
  // @ts-expect-error TS2339 Property 'holdsTest' does not exist on type '{ start: string; entered: string; mon: string; partial: bo
  showToast(_r.holdsTest ? 'That week holds your test. Nothing left to train before it ✓'
    : (_r.snapped ? 'Nothing to train that week. Starts '+_fmtStartDay(_r.start)+' ✓'
    : (_r.partial ? 'Start date set. Short first week ✓' : 'Start date set ✓')));
  renderWeekView();
}

// PROGRAM LIST
const _FOCUS_LABELS: Record<string, string>={strength:'Strength',hypertrophy:'Size',fatloss:'Fat Loss',balanced:'Balanced',support_strength:'Strength Support',support_athletic:'Athletic Support',support_prevention:'Injury Prevention'};
const _PATH_LABELS: Record<string, string>={event:'Race / Event',body:'Strength / Physique',both:'Hybrid'};
const _EQUIP_LABELS: Record<string, string>={home_full:'Home Gym — Full',home_basic:'Home Gym — Basic',commercial:'Commercial Gym',crossfit:'CrossFit Box',bodyweight:'Bodyweight only',minimal:'Minimal / Travel'};
const _CARDIO_LABELS: Record<string, string>={run:'Run',bike:'Bike',swim:'Swim'};
const _GOAL_LABELS: Record<string, string>={strength:'Strength',hypertrophy:'Size',fatloss:'Fat Loss',athletic:'Athletic',balanced:'Balanced'};
const _DAYF: Record<string, string>={sun:'Sun',mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat'};
// Single source of truth for a program's recalled onboarding selection.
// Lifts are experience-derived (DEFAULT_1RM) when not manually stored, so the panel
// shows the numbers the engine actually anchors to rather than a misleading zero.
function runAnchorChips(a: any){
  const r = a.row;
  const list = a.goalId==='run_base' ? [['Mile',r.mile]] : [['Mile',r.mile],['5K',r.fiveK],['10K',r.tenK],['Tempo',r.tempo]];
  if(a.race) list.push([a.race==='half'?'Half':'Marathon', r[a.race]]);
  list.push(['Recovery', r.recovery]);
  // V187 (F7): Nike's six-speed effort scale, printed on the unit line of NRC programs
  // only — NSW's CHI calls its tempo RPE 8–9 (different doctrine, same word), so the
  // chips stay bare there rather than print two numbers for one pace.
  const _eff: Record<string, string> = {Mile:'9/10', '5K':'7–8/10', '10K':'6–7/10', Tempo:'6/10', Recovery:'4–5/10'};
  const _nrc = !!(a.goalId && NRC_GOALS.has(a.goalId));
  const chips = list.map(([k,v])=>({k, v:_fmtMileAnchor(v), u:(_nrc && _eff[k]) ? '/mi · '+_eff[k] : '/mi'}));
  if(a.goalT) chips.unshift({k:'Goal', v:_fmtMileAnchor(a.goalT.sec), u:a.goalT.dist+' mi'});   // V176 (D10)
  return chips;
}
function runAnchorSentence(a: any){
  const m = _fmtMileAnchor(a.anchorSec);
  const art = /^(8|11|18):/.test(m) ? 'an' : 'a';
  const tail = (a.goalId === 'run_pace_goal')
    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'
    : (a.goalId === 'run_base') ? ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'
    : ' Every pace in this program comes from this row.';
  if(a.clamped){
    const raw = a.rawSec > 0 ? `the ${_fmtMileAnchor(a.rawSec)} you entered` : 'the mile time you entered';
    const why = a.rawSec > 0 ? (a.clamped==='fast' ? 'is faster than the chart goes' : 'is slower than the chart goes') : 'is not a valid time';
    return `Anchored on ${art} <b>${m} mile</b>, ${raw} ${why}, so its ${a.clamped==='fast'?'fastest':'slowest'} row is used.` + tail;
  }
  if(a.kind === 'seeded')   return `Anchored on ${art} <b>${m} mile</b>, worked back from ${a.n>0?a.n:'the'} recovery run${a.n===1?'':'s'} you logged in ${a.prog||'your last program'}.` + tail;
  if(a.kind === 'edited' && a.from){
    const from = a.from.kind === 'default' ? 'the '+a.exp+' default'
               : _fmtMileAnchor((+a.from.mins||0)*60 + (+a.from.secs||0));
    return `Anchored on ${art} <b>${m} mile</b>, the time you entered in week ${a.wk}. Before that it was ${from}.` + tail;
  }
  if(a.kind === 'entered' || a.kind === 'edited')  return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;
  return `Anchored on ${art} <b>${m} mile</b>, the ${a.exp} default. No mile time was entered. Tap the pencil to enter one.` + tail;
}
function runAnchorLine(a: any){
  const m = _fmtMileAnchor(a.anchorSec);
  const prov = a.clamped ? `entry ${a.rawSec>0?_fmtMileAnchor(a.rawSec):'invalid'} clamped to the chart's ${a.clamped==='fast'?'fastest':'slowest'} row`
             : a.kind==='seeded' ? `seeded from ${a.prog||'previous block'}, ${a.n} logged recovery run${a.n===1?'':'s'}`
             : a.kind==='edited' ? `edited in week ${a.wk}`
             : a.kind==='entered' ? 'entered' : a.exp+' default, no mile time entered';
  const chips = runAnchorChips(a).slice(1).map(c=>`${c.k.toLowerCase()} ${c.v}`).join(' / ');
  const scope = (a.goalId === 'run_pace_goal') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';
  return `Run anchor: ${m} mile (${prov}) → ${chips}${scope}`;
}
function progSelData(p: any){
  const c=p.cfg||{};
  const exp=c.experience||'intermediate';
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type 'Reco
  const d1=(typeof DEFAULT_1RM!=='undefined'&&DEFAULT_1RM[exp])||{bench:0,squat:0,deadlift:0};
  const unit=c.unit||'lbs';
  const lifts={
    squat:(c.squat>0?c.squat:d1.squat)||0,
    bench:(c.bench>0?c.bench:d1.bench)||0,
    deadlift:(c.deadlift>0?c.deadlift:d1.deadlift)||0,
    estimated:!(c.squat>0||c.bench>0||c.deadlift>0)
  };
  const order=(typeof ALL_DAYS_ORDER!=='undefined')?ALL_DAYS_ORDER:['sun','mon','tue','wed','thu','fri','sat'];
  const rest=c.restDays||[];
  let raceStr='';
  // D182 (V223): _fmtStartDay is _parseLocalDate underneath, the parser the engine and the header
  // use; an unreadable date prints as stored rather than as a wrong day.
  if(c.raceDate){try{raceStr=String(_fmtStartDay(c.raceDate, true));}catch(_){raceStr=String(c.raceDate);}}
  return {
    name:p.name||'My Program',
    goal:(p.goal||c.goal||''),
    liftLabel:_FOCUS_LABELS[c.liftingFocus]||c.liftingFocus||'—',
    pathLabel:_PATH_LABELS[c.primaryPath]||c.primaryPath||'—',
    experience:exp, ageBracket:c.ageBracket||'18-35',
    equipLabel:_EQUIP_LABELS[c.equipment]||c.equipment||'—',
    unit, lifts,
    trainDays:order.filter(d=>!rest.includes(d)),
    restDays:order.filter(d=>rest.includes(d)),
    length:(p.totalWeeks||c.totalWeeks||6),
    // @ts-expect-error TS7006 Parameter 't' implicitly has an 'any' type.
    cardio:(c.cardioTypes||[]).map(t=>({type:t,label:_CARDIO_LABELS[t]||t,goal:(c.cardioGoals&&c.cardioGoals[t]&&c.cardioGoals[t].label)||''})),
    eventTargeted:(c.primaryPath==='event'),
    raceStr, raceOut:raceCountdownWords(c.raceDate ? raceCountdown(c.raceDate) : null),   // D182: live at render, never the stored raceDateWeeks
    seed:(c.seed!=null?c.seed:(p.seed!=null?p.seed:null)),
    runAnchor:runAnchorInfo(c)   // V172 (D7): null unless the run goal reads the pace chart
  };
}
function progDetailHTML(p: any){
  const s=progSelData(p);
  const days=s.trainDays.map(d=>_DAYF[d]||d).join(' · ')||'—';
  const rest=s.restDays.map(d=>_DAYF[d]||d).join(' · ')||'None';
  const row=(k: any,v: any)=>`<div class="det-row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  // D5 (V145): each cardio row carries an edit pencil — same visual language as the
  // rename pencil in the card header — opening the mid-program goal change sheet for
  // that sport. Lift-only programs have no cardio to edit, so no pencil.
  // @ts-expect-error TS7006 Parameter 'c' implicitly has an 'any' type.
  const cardioRows=s.cardio.length?s.cardio.map(c=>`<div class="det-row"><span class="k">${c.label}</span><span class="v" style="display:inline-flex;align-items:center;gap:7px">${c.goal||'General fitness'}<button onclick="event.stopPropagation();openGoalSheet('${p.id}','${c.type}')" aria-label="Change ${c.label} goal" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${asyIcon('pencil',14)}</button></span></div>`).join(''):row('Cardio','Lift only');
  const eventGroup=s.eventTargeted?`<div class="det-group"><div class="det-label">Event target</div>${row('Race date',s.raceStr||'No date set')}${s.raceOut?row('Time out',s.raceOut.card):''}</div>`:'';
  const estNote=s.lifts.estimated?` <span style="font-weight:400;color:var(--muted);font-size:9px;letter-spacing:0">(est.)</span>`:'';
  const chip=(k: any,v: any)=>`<div class="lift-chip"><div class="lc-k">${k}</div><div class="lc-v">${v}</div><div class="lc-u">${s.unit}</div></div>`;
  return `<div class="prog-detail">
      <div class="det-group"><div class="det-label">Focus</div>${row('Goal',_GOAL_LABELS[s.goal]||s.goal||'—')}${row('Lift emphasis',s.liftLabel)}${row('Path',s.pathLabel)}</div>
      <div class="det-group"><div class="det-label">Profile</div>${row('Experience',s.experience)}${row('Age range',s.ageBracket)}${row('Equipment',s.equipLabel)}${row('Units',s.unit)}</div>
      <div class="det-group"><div class="det-label">Schedule</div>${row('Train days',days)}${row('Rest days',rest)}${row('Length',s.length+' weeks')}</div>
      <div class="det-group"><div class="det-label">Starting 1RM${estNote}</div><div class="det-lifts">${chip('Squat',s.lifts.squat)}${chip('Bench',s.lifts.bench)}${chip('Deadlift',s.lifts.deadlift)}</div></div>${s.runAnchor?`
      <div class="det-group"><div class="det-label" style="display:inline-flex;align-items:center;gap:7px">Run paces<button onclick="event.stopPropagation();openMileSheet('${p.id}')" aria-label="Change mile time" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${asyIcon('pencil',14)}</button></div><div class="det-paces">${runAnchorChips(s.runAnchor).map(c=>`<div class="lift-chip"><div class="lc-k">${c.k}</div><div class="lc-v">${c.v}</div><div class="lc-u">${c.u}</div></div>`).join('')}</div><div class="det-src">${runAnchorSentence(s.runAnchor)}</div></div>`:''}
      <div class="det-group"><div class="det-label">Cardio</div>${cardioRows}</div>
      ${eventGroup}
      <div class="det-foot"><span class="det-seed">${s.seed!=null?'seed '+s.seed:''}</span><button class="copy-icon-btn" onclick="event.stopPropagation();copyProgSel('${p.id}')" aria-label="Copy program selections for troubleshooting" title="Copy for troubleshooting">${asyIcon('copy',15)}</button></div>
    </div>`;
}
// ── D5 (V145): MID-PROGRAM CARDIO GOAL CHANGE ─────────────────────────────────
// The whole feature rides the architecture that already exists: refreshProgram
// rebuilds from prog.cfg on every boot and the per-day freeze (V133) protects any
// day with a real record. So a goal change is a cfg edit plus a refresh — trained
// days stand exactly as prescribed and logged, untrained days rebuild under the
// new goal, ia_hist_ is untouched, overlays splice against the new build, the
// seed never moves so lifts stay put. No new persistence, no new rebuild path.
//
// Direction rules (Mario ruling, D5-ii): downgrades and laterals get a plain
// confirm; upgrades (higher _GOAL_RANK) are allowed but get a warning prompt
// with inverted button emphasis — the coach steers, the athlete decides. A
// program with no current goal is treated as rank 2 (general fitness sits at
// about base-plus): dropping to base or a pace goal is plain, jumping into a
// distance build warns.
let _goalDraft={progId:null,sport:null,sel:null,inputs:{}};
function openGoalSheet(progId: any,sport: any){
  const p=getPrograms().find(x=>x.id===progId); if(!p) return;
  _goalDraft={progId,sport,sel:null,inputs:{}};
  renderGoalSheet();
  const o=document.getElementById('goalOverlay'); o!.classList.add('open'); o!.scrollTop=0;
}
function closeGoalSheet(){document.getElementById('goalOverlay')!.classList.remove('open');}
function _goalCurWeek(p: any){
  // Same local computation refreshProgram uses — cannot rely on calcCurrentWeek's
  // global activeProg because the sheet edits ANY program, not just the active one.
  if(!p.startDate) return 1;
  const tw=p.totalWeeks||6;
  const mon=getWeekMonday(p.startDate);
  const today=new Date(); today.setHours(0,0,0,0);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((today-mon)/86400000);
  return diff<0?1:Math.min(tw,Math.floor(diff/7)+1);
}
// @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'.
function _goalSetInput(k: any,v: any){_goalDraft.inputs[k]=v; _goalRefreshCommit();}
function _goalInputsValid(){
  const sel=_goalDraft.sel; if(!sel||!_GOAL_REQ_INPUTS.has(sel)) return true;
  const i=_goalDraft.inputs;
  // @ts-expect-error TS2339 Property 'targetMins' does not exist on type '{}'.
  const hasTime=(+i.targetMins>0)||(+i.targetSecs>0);
  // @ts-expect-error TS2339 Property 'targetDist' does not exist on type '{}'.
  if(sel==='run_pace_goal') return (parseFloat(i.targetDist)>0)&&hasTime;
  return hasTime; // swim time goals need a target time only
}
function _goalRefreshCommit(){
  const b=document.getElementById('goalCommitBtn'); if(!b) return;
  const ok=_goalInputsValid();
  b.style.opacity=ok?'1':'0.4'; b.style.pointerEvents=ok?'auto':'none';
}
function selectGoalOpt(id: any){_goalDraft.sel=id; _goalDraft.inputs={}; renderGoalSheet();}
function renderGoalSheet(){
  const body=document.getElementById('goalBody'); if(!body) return;
  const p=getPrograms().find(x=>x.id===_goalDraft.progId); if(!p){body.innerHTML='';return;}
  const sport=_goalDraft.sport;
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const sportLbl=(_CARDIO_LABELS[sport]||sport);
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const cur=(p.cfg&&p.cfg.cardioGoals&&p.cfg.cardioGoals[sport])||null;
  const curId=cur&&cur.id||null;
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
  const curRank=(curId&&_GOAL_RANK[curId])||2;
  // Picker legality mirrors onboarding exactly: hybrid path hides peaking goals.
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const opts=(CARDIO_GOALS_BY_TYPE[sport]||[]).filter(g=>(p.cfg&&p.cfg.primaryPath)!=='both'||!HYBRID_EXCLUDED_GOALS.has(g.id));
  // @ts-expect-error TS7006 Parameter 'g' implicitly has an 'any' type.
  const sel=_goalDraft.sel?opts.find(g=>g.id===_goalDraft.sel):null;
  let h='<div class="det-label" style="font-size:14px;letter-spacing:0;margin-bottom:4px">Change '+sportLbl.toLowerCase()+' goal</div>'
    +'<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:14px">Weeks you already trained stay on the books. The rest of the program rebuilds around the new goal.</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px">'
    // @ts-expect-error TS7006 Parameter 'g' implicitly has an 'any' type.
    +opts.map(g=>{
      const isCur=g.id===curId;
      const isSel=sel&&g.id===sel.id;
      // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
      const up=(_GOAL_RANK[g.id]||1)>curRank;
      return '<div class="goal-option'+(isSel?' selected':'')+'" '
        +(isCur?'style="opacity:0.55;cursor:default"':'onclick="selectGoalOpt(\''+g.id+'\')"')+'>'
        +'<div class="goal-option-label" style="display:flex;justify-content:space-between;align-items:center">'+g.label
        +(isCur?'<span style="font-size:10px;letter-spacing:0;color:var(--muted);font-weight:400">Current</span>':'')+'</div>'
        +'<div class="goal-option-desc">'+g.desc+(!isCur&&up?'<br><span style="color:var(--accent)">Bigger goal than your current build.</span>':'')+'</div>'
        +'</div>';
    }).join('')+'</div>';
  if(sel){
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
    const up=(_GOAL_RANK[sel.id]||1)>curRank;
    const curWk=_goalCurWeek(p);
    const started=!!p.startDate&&curWk>1;
    let inputs='';
    if(_GOAL_REQ_INPUTS.has(sel.id)){
      const i=_goalDraft.inputs;
      if(sel.id==='run_pace_goal'){
        inputs='<div style="margin-top:10px"><div style="font-size:11px;color:var(--muted);margin-bottom:5px">Target distance and time. The engine will not guess these for you.</div>'
          +'<div style="display:flex;gap:6px;align-items:center">'
          // @ts-expect-error TS2339 Property 'targetDist' does not exist on type '{}'.
          +'<input type="number" class="input-field" style="flex:1" placeholder="dist e.g. 1.5" value="'+(i.targetDist||'')+'" min="0.1" step="0.1" oninput="_goalSetInput(\'targetDist\',this.value)">'
          // @ts-expect-error TS2339 Property 'paceUnit' does not exist on type '{}'.
          +'<select class="input-field" style="flex:0 0 64px" onchange="_goalSetInput(\'paceUnit\',this.value)"><option value="mi"'+((i.paceUnit||'mi')==='mi'?' selected':'')+'>mi</option><option value="km"'+(i.paceUnit==='km'?' selected':'')+'>km</option></select>'
          // @ts-expect-error TS2339 Property 'targetMins' does not exist on type '{}'.
          +'<input type="number" class="input-field" style="flex:0 0 58px;text-align:center" placeholder="min" min="0" max="99" value="'+(i.targetMins||'')+'" oninput="_goalSetInput(\'targetMins\',this.value)">'
          // @ts-expect-error TS2339 Property 'targetSecs' does not exist on type '{}'.
          +'<input type="number" class="input-field" style="flex:0 0 58px;text-align:center" placeholder="sec" min="0" max="59" value="'+(i.targetSecs||'')+'" oninput="_goalSetInput(\'targetSecs\',this.value)">'
          +'</div></div>';
      } else {
        inputs='<div style="margin-top:10px"><div style="font-size:11px;color:var(--muted);margin-bottom:5px">Target time. The engine will not guess this for you.</div>'
          +'<div style="display:flex;gap:6px">'
          // @ts-expect-error TS2339 Property 'targetMins' does not exist on type '{}'.
          +'<input type="number" class="input-field" style="flex:1;text-align:center" placeholder="min" min="0" max="99" value="'+(i.targetMins||'')+'" oninput="_goalSetInput(\'targetMins\',this.value)">'
          // @ts-expect-error TS2339 Property 'targetSecs' does not exist on type '{}'.
          +'<input type="number" class="input-field" style="flex:1;text-align:center" placeholder="sec" min="0" max="59" value="'+(i.targetSecs||'')+'" oninput="_goalSetInput(\'targetSecs\',this.value)">'
          +'</div></div>';
      }
    }
    const title=up?sel.label+' is a step up':'Switch to '+sel.label;
    const bodyTxt=up
      ?'You would drop into '+(started?'week '+curWk+' of a bigger build':'a bigger build')+' without the early weeks under you. That is a real jump in training load. If the goal matters, a fresh program builds it right.'
      :'Past weeks stand as trained. Your '+sportLbl.toLowerCase()+' work rebuilds from this week forward.'+(started?' This week may finish mixed. Next week is fully on the new goal.':'');
    const commit='<button id="goalCommitBtn" class="prog-action-btn'+(up?'':' primary')+'" style="flex:1'+(up?';border-color:var(--accent);color:var(--accent)':'')+'" onclick="commitGoalChange()">'+(up?'Switch anyway':'Make the switch')+'</button>';
    const keep='<button class="prog-action-btn'+(up?' primary':'')+'" style="flex:1" onclick="closeGoalSheet()">'+(up?'Stay the course':'Keep '+(cur&&cur.label?cur.label:'current'))+'</button>';
    h+='<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px">'
      +'<div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0;color:'+(up?'var(--accent)':'var(--text)')+'">'+title+'</div>'
      +'<div style="font-size:13px;color:var(--text);line-height:1.5;margin-top:6px">'+bodyTxt+'</div>'
      +inputs
      +'<div style="display:flex;gap:8px;margin-top:14px">'+(up?keep+commit:commit+keep)+'</div></div>';
  }
  body.innerHTML=h;
  _goalRefreshCommit();
}
function commitGoalChange(){
  if(!_goalInputsValid()) return;
  const programs=getPrograms();
  const pi=programs.findIndex(x=>x.id===_goalDraft.progId); if(pi<0) return;
  const sport=_goalDraft.sport;
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const opts=CARDIO_GOALS_BY_TYPE[sport]||[];
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  const g=opts.find(o=>o.id===_goalDraft.sel); if(!g) return;
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const prev=((programs[pi].cfg.cardioGoals||{})[sport])||{};
  const next={id:g.id,label:g.label,baseline:'',
    ...(sport==='run'&&prev.mileBestMins!==undefined&&prev.mileBestMins!==''
        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{})};
  // D110a (V212, coach ruled, D144 aware): a swim goal switch keeps the pool unit and every current
  // time that still means something. A 500 time carries to wherever a 500 lives (the 500 goal's
  // base, or a 100 goal's base500); a current 100 carries only to a 100 goal. Absent is not written.
  if(sport==='swim'){
    const _has=(m: any,s: any)=>((+m||0)*60+(+s||0))>0;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
    const _put=(k: any,t: any)=>{ if(t[0]!==undefined) next[k+'Mins']=t[0]; if(t[1]!==undefined) next[k+'Secs']=t[1]; };
    // @ts-expect-error TS2339 Property 'swimUnit' does not exist on type '{ mileBestSrc?: any; mileBestMins?: any; mileBestSecs?: any
    if(prev.swimUnit) next.swimUnit=prev.swimUnit;
    let _t500=null, _t100=null;
    if(prev.id==='swim_500_time'&&_has(prev.baseMins,prev.baseSecs)) _t500=[prev.baseMins,prev.baseSecs];
    if(prev.id==='swim_100_time'&&_has(prev.base500Mins,prev.base500Secs)) _t500=[prev.base500Mins,prev.base500Secs];
    if(prev.id==='swim_100_time'&&_has(prev.baseMins,prev.baseSecs)) _t100=[prev.baseMins,prev.baseSecs];
    if(g.id==='swim_500_time'&&_t500) _put('base',_t500);
    if(g.id==='swim_100_time'&&_t500) _put('base500',_t500);
    if(g.id==='swim_100_time'&&_t100) _put('base',_t100);
  }
  if(_GOAL_REQ_INPUTS.has(g.id)){
    const i=_goalDraft.inputs;
    // @ts-expect-error TS2339 Property 'targetMins' does not exist on type '{}'.
    const mins=+i.targetMins||0, secs=+i.targetSecs||0;
    // @ts-expect-error TS2339 Property 'targetMins' does not exist on type '{ mileBestSrc?: any; mileBestMins?: any; mileBestSecs?: a
    next.targetMins=i.targetMins; next.targetSecs=i.targetSecs;
    // @ts-expect-error TS2339 Property 'targetTime' does not exist on type '{ mileBestSrc?: any; mileBestMins?: any; mileBestSecs?: a
    next.targetTime=mins+':'+String(secs).padStart(2,'0');
    // @ts-expect-error TS2339 Property 'targetDist' does not exist on type '{ mileBestSrc?: any; mileBestMins?: any; mileBestSecs?: a
    if(g.id==='run_pace_goal'){ next.targetDist=i.targetDist; next.paceUnit=i.paceUnit||'mi'; }
  }
  // The cfg edit IS the feature. Everything downstream is the existing pipeline.
  // @ts-expect-error TS2464 A computed property name must be of type 'string', 'number', 'symbol', or 'any'.
  programs[pi].cfg={...programs[pi].cfg,cardioGoals:{...(programs[pi].cfg.cardioGoals||{}),[sport]:next}};
  savePrograms(programs);
  if(activeProgId===_goalDraft.progId){
    _setActiveProg(refreshProgram(programs[pi]));
    _setCurrentWeek(calcCurrentWeek());
    try{ if(document.getElementById('screenWeek')!.classList.contains('active')) renderWeekView(); }catch(e){}
  }
  closeGoalSheet();
  renderProgList();
  showToast('Goal switched. Program rebuilt from this week.');
}
// ── D116 (V203): THE MILE PENCIL ──────────────────────────────────────────────
// Same architecture as D5: the cfg edit IS the feature. mileBestMins/Secs go in
// as typed and interpolate through paceChartLookup exactly as a wizard entry
// does — no snap to a chart row, no cap on the move, no cooldown. The per-day
// freeze protects every trained day; untrained days rebuild off the new row.
// mileBestSrc.from is ALWAYS written, including when the prior anchor was the
// experience default, so runAnchorSentence can name what it replaced.
var _mileDraft: any=null;
function openMileSheet(progId: any){
  const p=getPrograms().find(x=>x.id===progId); if(!p) return;
  const tw=p.totalWeeks||6;
  const curWk=_goalCurWeek(p);
  // Evaluated AT TAP, never at render: a program that crosses into the window
  // while the Programs tab is open still locks.
  if(curWk >= tw - 2){
    const c=p.cfg||{};
    let facts='';
    if(c.raceDate){
      // D182 (V223): one local parse through raceCountdown, the helper the card's "Time out" row
      // reads, so the popup and the card agree (V203). Days at every horizon (D116: three weeks
      // out the taper is lived in days); at 0 and below, the formatter's own words. A null
      // countdown is an unreadable date: no date rows, as before.
      const cd=raceCountdown(c.raceDate);
      if(cd && isFinite(cd.days)){
        const out=cd.days>=1 ? String(cd.days) : raceCountdownWords(cd)!.card;
        let rs=''; try{ rs=_fmtStartDay(c.raceDate, true); }catch(_){ rs=String(c.raceDate); }
        facts+='<div class="det-row"><span class="k">Days out</span><span class="v">'+out+'</span></div>';
        facts+='<div class="det-row"><span class="k">Race day</span><span class="v">'+rs+'</span></div>';
      }
    }
    facts+='<div class="det-row"><span class="k">Week</span><span class="v">'+curWk+' of '+tw+'</span></div>';
    const lb=document.getElementById('mileLockBody');
    if(lb) lb.innerHTML='<div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0;color:var(--accent)">The row holds</div>'
      +'<div class="det-group" style="margin-top:10px">'+facts+'</div>'
      +'<div style="font-size:13px;color:var(--text);line-height:1.5;margin-top:12px">You are too close to the race. Three weeks out the work is done. Changing your mile now would reset the pace of every session left, and those sessions have one job. Get you to the line fresh.</div>'
      +'<div style="display:flex;gap:8px;margin-top:14px"><button class="prog-action-btn primary" style="flex:1" onclick="closeMileSheet()">Got it</button></div>';
    const lo=document.getElementById('mileLockOverlay'); if(lo){ lo.classList.add('open'); lo.scrollTop=0; }
    return;
  }
  const g=((p.cfg&&p.cfg.cardioGoals)||{}).run||{};
  _mileDraft={progId:progId};
  const mEl=document.getElementById('mileSheetMins'), sEl=document.getElementById('mileSheetSecs');
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  if(mEl) mEl.value=(g.mileBestMins!==undefined?g.mileBestMins:'');
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  if(sEl) sEl.value=(g.mileBestSecs!==undefined?g.mileBestSecs:'');
  const intro=document.getElementById('mileSheetIntro');
  if(intro) intro.textContent='Put in the mile you can run today. Every run still ahead of you rebuilds off it. Weeks you have already trained stand as they are.';
  const o=document.getElementById('mileOverlay'); if(o){ o.classList.add('open'); o.scrollTop=0; }
}
function closeMileSheet(){
  const o=document.getElementById('mileOverlay'); if(o) o.classList.remove('open');
  const l=document.getElementById('mileLockOverlay'); if(l) l.classList.remove('open');
}
function commitMileChange(){
  if(!_mileDraft) return;
  const programs=getPrograms();
  const pi=programs.findIndex(x=>x.id===_mileDraft.progId); if(pi<0) return;
  const p=programs[pi];
  const mEl=document.getElementById('mileSheetMins'), sEl=document.getElementById('mileSheetSecs');
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const mRaw=mEl?String(mEl.value).trim():'', sRaw=sEl?String(sEl.value).trim():'';
  // A blank field blocks the commit. A pencil changes a number; it never un-anchors.
  if(mRaw===''||sRaw===''){ showToast('Put in both the minutes and the seconds.'); return; }
  const mm=+mRaw, ss=+sRaw;
  const st=_mileEntryState({mileBestMins:mRaw,mileBestSecs:sRaw},(p.cfg&&p.cfg.experience)||'intermediate');
  if(!st.ok){ showToast(st.msg); return; }
  const prev=((p.cfg.cardioGoals||{}).run)||{};
  const next={...prev, mileBestMins:String(mm), mileBestSecs:String(ss),
    mileBestSrc:{kind:'edited', at:new Date().toISOString().slice(0,10), wk:_goalCurWeek(p),
      from:{mins:prev.mileBestMins||'', secs:prev.mileBestSecs||'',
            kind:(prev.mileBestSrc&&prev.mileBestSrc.kind)||(prev.mileBestMins?'entered':'default')}}};
  p.cfg={...p.cfg,cardioGoals:{...(p.cfg.cardioGoals||{}),run:next}};
  savePrograms(programs);
  if(activeProgId===_mileDraft.progId){
    _setActiveProg(refreshProgram(programs[pi]));
    _setCurrentWeek(calcCurrentWeek());
    try{ if(document.getElementById('screenWeek')!.classList.contains('active')) renderWeekView(); }catch(e){}
  }
  closeMileSheet();
  renderProgList();
  // Out-of-chart entries commit and are told what the clamp does, same as the wizard.
  showToast('Mile updated. Every run still ahead of you now reads from your new row.'+(st.adv?' '+st.adv:''));
}
function toggleProgCard(id: any){
  const card=document.getElementById('pcard_'+id);if(!card)return;
  const willOpen=!card.classList.contains('open');
  card.classList.toggle('open',willOpen);
  if(willOpen)openProgIds.add(id);else openProgIds.delete(id);
}
function _progCopyFallback(txt: any){try{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta);}catch(_){}}
// V172: the lines are built apart from the clipboard call so the text is assertable.
function progSelLines(p: any){
  const s=progSelData(p);
  const lines=[
    'THE ASYLUM — Program selections',
    'Name: '+s.name,
    'Goal: '+(_GOAL_LABELS[s.goal]||s.goal||'—')+' | Lift focus: '+s.liftLabel+' | Path: '+s.pathLabel,
    'Experience: '+s.experience+' | Age: '+s.ageBracket+' | Equip: '+s.equipLabel+' | Units: '+s.unit,
    'Train days: '+(s.trainDays.map(d=>_DAYF[d]||d).join(', ')||'—')+' | Rest: '+(s.restDays.map(d=>_DAYF[d]||d).join(', ')||'none')+' | Length: '+s.length+' wks',
    'Starting 1RM'+(s.lifts.estimated?' (est. from experience)':'')+': squat '+s.lifts.squat+' / bench '+s.lifts.bench+' / deadlift '+s.lifts.deadlift+' '+s.unit,
    // @ts-expect-error TS7006 Parameter 'c' implicitly has an 'any' type.
    'Cardio: '+(s.cardio.length?s.cardio.map(c=>c.type+'='+(c.goal||'general')).join(', '):'lift only')
  ];
  if(s.runAnchor)lines.push(runAnchorLine(s.runAnchor));   // V172 (D7c)
  if(s.eventTargeted)lines.push('Event: '+(s.raceStr||'no date')+(s.raceOut?' ('+s.raceOut.copy+')':''));
  if(s.seed!=null)lines.push('Seed: '+s.seed);
  return lines;
}
function copyProgSel(id: any){
  const p=getPrograms().find(x=>x.id===id);if(!p)return;
  const txt=progSelLines(p).join('\n');
  const done=()=>{try{showToast('Selections copied ✓');}catch(_){}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(()=>{_progCopyFallback(txt);done();});}
  else{_progCopyFallback(txt);done();}
}
// V156: action row with the two-tier archive/delete confirm rendered in place of the
// buttons. Tier 1 archives (stores survive); tier 2 is the only path to purgeProgData.
function _progActionsHTML(p: any,isActive: any){
  if(confirmProgId===p.id&&confirmTier===1){
    return `<div class="prog-card-actions" style="flex-direction:column;align-items:stretch;gap:8px">
      <div style="font-size:13px;color:var(--text);line-height:1.5">Archive \u201C${p.name}\u201D?<br><span style="color:var(--muted);font-size:12px">It leaves your program list but its history stays. View it anytime under Progress.</span></div>
      <div style="display:flex;gap:8px">
        <button class="prog-action-btn primary" onclick="archiveProg('${p.id}')">Archive</button>
        <button class="prog-action-btn" onclick="cancelConfirm()">Cancel</button>
      </div>
      <button style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:11px;text-align:left;padding:2px 0;text-decoration:underline" onclick="askPurge('${p.id}')">Delete forever\u2026</button>
    </div>`;
  }
  if(confirmProgId===p.id&&confirmTier===2){
    return `<div class="prog-card-actions" style="flex-direction:column;align-items:stretch;gap:8px">
      <div style="font-size:13px;color:var(--red);line-height:1.5">This erases all logs, weights, and history for \u201C${p.name}\u201D. It cannot be undone.</div>
      <div style="display:flex;gap:8px">
        <button class="prog-action-btn danger" onclick="deleteProg('${p.id}')">Delete Forever</button>
        <button class="prog-action-btn" onclick="cancelConfirm()">Cancel</button>
      </div>
    </div>`;
  }
  return `<div class="prog-card-actions">
        ${!isActive?`<button class="prog-action-btn primary" onclick="setActive('${p.id}')">Set Active</button>`:'<button class="prog-action-btn" style="opacity:0.4;cursor:default">Active \u2713</button>'}
        <button class="prog-action-btn danger" onclick="askArchive('${p.id}')">Archive</button>
      </div>`;
}
function renderProgList(){
  const _all=getPrograms();const list=document.getElementById('progList');
  const programs=_all.filter(p=>!p.archived);   // V156: archived live under Progress
  if(!programs.length){
    list!.innerHTML=_all.length
      ?'<div style="text-align:center;padding:60px 20px;color:var(--muted);font-size:14px;">All programs archived.<br>View them under Progress, or build a new one below.</div>'
      :'<div style="text-align:center;padding:60px 20px;color:var(--muted);font-size:14px;">No programs yet.<br>Tap below to build your first.</div>';
    return;
  }
  const goalLabels: Record<string, string>={strength:'Strength',hypertrophy:'Size',fatloss:'Fat Loss',athletic:'Athletic',balanced:'Balanced'};
  list!.innerHTML=programs.map(p=>{
    const isActive=p.id===getActiveProgId();
    const _cts=p.cfg?.cardioTypes||[];
    const cardioSummary=_cts.length
      // @ts-expect-error TS7006 Parameter 't' implicitly has an 'any' type.
      ? _cts.map(t=>asyIcon(({run:'🏃',bike:'🚴',swim:'🏊'})[t],13)+(p.cfg?.cardioGoals?.[t]?.label?' '+p.cfg.cardioGoals[t].label:'')).join(' + ')
      : 'Lift only';
    const goals='';
    // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
    const trainDays: any[]=(p.cfg?.days||[]).filter(d=>!(p.cfg?.restDays||[]).includes(d));
    const isOpen=openProgIds.has(p.id);
    const _tap=editProgId===p.id;
    return `<div class="prog-card${isActive?' active-prog':''}${isOpen?' open':''}" id="pcard_${p.id}">
      ${_tap?'':`<div class="prog-tap" onclick="toggleProgCard('${p.id}')">`}
      <div class="prog-card-header">${editProgId===p.id
        ? `<input type="text" class="input-field" id="renameInput_${p.id}" value="${(p.name||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" maxlength="40" style="flex:1;min-width:0;font-size:16px;padding:8px 10px" onkeydown="if(event.key==='Enter'){commitRename('${p.id}')}else if(event.key==='Escape'){cancelRename()}"><div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px"><button class="prog-action-btn primary" style="flex:0 0 auto;padding:8px 12px" onclick="commitRename('${p.id}')">Save</button><button class="prog-action-btn" style="flex:0 0 auto;padding:8px 10px" onclick="cancelRename()">${asyIcon('x',15)}</button></div>`
        : `<div class="prog-card-name">${p.name}</div><div style="display:flex;align-items:center;gap:10px;flex-shrink:0"><div class="prog-card-badge badge-${p.goal}">${goalLabels[p.goal]||p.goal}</div><button onclick="event.stopPropagation();startRename('${p.id}')" aria-label="Rename program" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${asyIcon('pencil',16)}</button><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>`}</div>
      <div class="prog-card-meta">${trainDays.map(d=>({sun:'Su',mon:'Mo',tue:'Tu',wed:'We',thu:'Th',fri:'Fr',sat:'Sa'} as Record<string, string>)[d]||d).join(' · ')} · ${p.totalWeeks||6} wks cardio · 6 wks lift<br>${asyIcon(({home_full:'home',home_basic:'home',commercial:'dumbbell',crossfit:'dumbbell',bodyweight:'user',minimal:'backpack'} as Record<string, string>)[p.cfg?.equipment]||'home',13)+' '+(({home_full:'Full',home_basic:'Basic',commercial:'Gym',crossfit:'CrossFit',bodyweight:'Bodyweight',minimal:'Minimal'} as Record<string, string>)[p.cfg?.equipment]||'Home')} · ${p.cfg?.experience||'intermediate'} · ${p.cfg?.ageBracket||'18-35'}<br>${cardioSummary}</div>
      ${_tap?'':`</div>${progDetailHTML(p)}`}
      ${_progActionsHTML(p,isActive)}
    </div>`;
  }).join('');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { progAlignment, progTestPin, renderProgList };
