import {
  completedKey, getCompleted, getLogs, getPrograms, logKey, saveCompleted, saveLogs, savePrograms, snapshotDay,
} from './storage.js';
import { _setActiveProg, activeProg, activeProgId, currentDayKey, currentWeek, showToast } from './rest-day-shell.ts';
import { _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { markSwapOffered } from './swaps-edits.js';
import { renderWeekView } from './week-view-sections.js';
import {
  CARDIO_PARK_FIELDS, _curLogDose, _curLogDoseFull, _curLogSub, _setCurLogDose, cardioSwapNoteText, doseDerived,
  updateDoseDerived,
} from './log-entries.js';
import { cardioFieldHTML, iaWheelFlush, iaWheelInit } from './wheel-log.js';
import { ruReset } from './rest-timer.js';
import { openDetail } from './day-detail.js';
import { refreshProgram } from './program-manage.js';
import { finalScheduledDay, fireCompletionPopup, releaseSeasonShown, statusOf } from './popups-streaks-reminders.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── COACH NUDGE ──────────────────────────────────────────────────────────────
// Third time in a row is a preference, not a bad night's sleep. Offered once, and
// only once — declining marks it handled so the athlete is never asked again.
let _nudgeCtx=null;
function showSwapNudge(from,to){
  _nudgeCtx={from:from,to:to};
  const o=document.getElementById('swapNudgeOverlay');if(!o)return;
  document.getElementById('swapNudgeBody').innerHTML=
    'That is three sessions running you have traded '+from.toLowerCase()+' for '+to.toLowerCase()+'.'
    +'<br><br>Want me to make '+to.toLowerCase()+' your '+((_pattern(from)||'main')+'').replace(/_/g,' ')
    +' from here on? I will rebuild the rest of the block around it.';
  o.classList.add('show');
}
function dismissSwapNudge(){
  const o=document.getElementById('swapNudgeOverlay');if(o)o.classList.remove('show');
  if(_nudgeCtx&&activeProgId) markSwapOffered(activeProgId,_nudgeCtx.from);
  _nudgeCtx=null;
}
function acceptSwapNudge(){
  if(!_nudgeCtx||!activeProgId){dismissSwapNudge();return;}
  const from=_nudgeCtx.from,to=_nudgeCtx.to;
  const programs=getPrograms();
  const p=programs.filter(x=>x&&x.id===activeProgId)[0];
  if(p&&p.cfg){
    p.cfg.exSwapPrefs={...(p.cfg.exSwapPrefs||{})};
    p.cfg.exSwapPrefs[from]=to;
    savePrograms(programs);
    markSwapOffered(activeProgId,from);
    // Preference lives in cfg, so the rebuild below — and every rebuild after it —
    // reproduces the substitution without any patch store to re-apply.
    _setActiveProg(refreshProgram(p));
  }
  const o=document.getElementById('swapNudgeOverlay');if(o)o.classList.remove('show');
  _nudgeCtx=null;
  const day=activeProg&&activeProg.weeks[currentWeek]&&activeProg.weeks[currentWeek][currentDayKey];
  if(day) openDetail(currentDayKey,day); else renderWeekView();
  showToast('Done. '+to+' is your '+((_pattern(from)||'main')+'').replace(/_/g,' ')+' from here.');
}
function closeDetail(){document.getElementById('detailOverlay').classList.remove('open');renderWeekView();}
// Single, app-wide RPE reference — opened from the ⓘ button in the day header, so the
// effort scale lives in one place instead of being reprinted inside every workout.
function showRpeInfo(){const o=document.getElementById('rpeInfoOverlay');if(o)o.classList.add('show');}
function hideRpeInfo(e){const o=document.getElementById('rpeInfoOverlay');if(!o)return;if(e&&e.currentTarget!==e.target)return;o.classList.remove('show');}
function toggleComplete(wk,dayKey,title){
  snapshotDay(wk,dayKey);
  const c=getCompleted();const k=completedKey(wk,dayKey);
  if(c[k])delete c[k];else c[k]={title,ts:Date.now(),status:'complete'};saveCompleted(c);renderWeekView();
}
function markDayComplete(wk,dayKey,title){
  snapshotDay(wk,dayKey);
  const c=getCompleted();c[completedKey(wk,dayKey)]={title,ts:Date.now(),status:'complete'};saveCompleted(c);renderWeekView();
}
// V181 (D1/D2): two states, both toggles. One tap = save the log fields AND set the
// day's status. Tapping the ACTIVE state unmarks the day back to pending — the log entry
// stays, the streak and the week strip recompute, and if this was the final scheduled
// day the one-shot season latch is released so a fat-thumbed Done cannot burn the
// block-end banner. Legacy `partial` records (pre-V181) read as complete everywhere.
function handleDayStatus(dayKey,title,status){
  snapshotDay(currentWeek,dayKey);
  // V221 (D179): a status-setting tap closes the day, so a run wheel still settling commits
  // first; the saved log at the moment of close is the log. statusOf===status is the undo
  // tap (wasSame below), which stays on the day and keeps the wheel's own settle.
  // V236 (D218): a status-setting tap is also a commit tap. The form is committed whatever the
  // card's regime, so Done on a rolled but unlogged card logs it. The undo tap is not a commit:
  // it saves regime-aware like any other write, so it never writes a draft number.
  const _commit=statusOf(currentWeek,dayKey)!==status;
  if(_commit) iaWheelFlush(document.getElementById('detailOverlay'));
  persistLogFields(dayKey,_commit);
  const c=getCompleted();const k=completedKey(currentWeek,dayKey);
  const wasSame=!!c[k]&&statusOf(currentWeek,dayKey)===status;
  if(wasSame){
    delete c[k];
    saveCompleted(c);renderWeekView();
    renderStatusFoot(dayKey,title);
    if(status==='complete'){
      const f=finalScheduledDay();
      if(f&&f.week===currentWeek&&f.d===dayKey) releaseSeasonShown();
    }
    showToast('Unmarked');
    return;
  }
  c[k]={title:title||null,ts:Date.now(),status};
  saveCompleted(c);renderWeekView();
  renderStatusFoot(dayKey,title);
  const labels={complete:'Done ✓',skipped:'Skipped ✕ The week moves on'};
  // V221 (D179): setting a status closes the session. The rest clock stops and zeroes (‹ Back
  // and tab moves are navigation and keep it running, see ruResetIfIdle); the overlay closes
  // through ‹ Back's own exit, so the day lands on This Week; the pop-up sits over the week.
  // The toast prints only when no pop-up covers it: Done always raises one and prints none,
  // Skip raises none and keeps its toast.
  ruReset();
  closeDetail();
  if(status==='complete') fireCompletionPopup(currentWeek,dayKey);
  if(!document.getElementById('popOverlay').classList.contains('show')) showToast(labels[status]||'Updated ✓');
}
// The footer is rebuilt wholesale on every status change: the primary button always
// carries the CURRENT state (and toggles it off), the small button beneath is always
// the OTHER state. No hint copy — there is nothing to grade.
function statusFootHTML(dayKey,title){
  const cur=statusOf(currentWeek,dayKey);
  const esc=(title||'').replace(/'/g,"\\'");
  const call=s=>"handleDayStatus('"+dayKey+"','"+esc+"','"+s+"')";
  if(cur==='skipped'){
    return '<div class="status-stack">'
      +'<button class="day-done skipped" id="statusBtn_skipped" onclick="'+call('skipped')+'">Skipped \u2715 <small>tap to undo</small></button>'
      +'<button class="day-skip" id="statusBtn_complete" onclick="'+call('complete')+'">Done</button>'
      +'</div>';
  }
  return '<div class="status-stack">'
    +'<button class="day-done'+(cur==='complete'?' is':'')+'" id="statusBtn_complete" onclick="'+call('complete')+'">'+(cur==='complete'?'Done \u2713 <small>tap to undo</small>':'Done')+'</button>'
    +'<button class="day-skip" id="statusBtn_skipped" onclick="'+call('skipped')+'">Skip</button>'
    +'</div>';
}
function renderStatusFoot(dayKey,title){
  const foot=document.getElementById('detailStatusRow');
  if(foot) foot.innerHTML=statusFootHTML(dayKey,title);
}
// V236 (D218): the cardio card's regime, derived from the store and never stored. LIVE when
// the stored entry holds a value in the ACTIVE sport's field set, the same truth test _hasLog
// makes minus the notes, so a legacy "0.00" is live. Otherwise DRAFT: the numbers live on the
// form only. The active sport is the wrap's, the one persistLogFields writes swapTo from; inside
// setCardioSwap the store's swapTo still names the leaving sport while the arriving set is already
// restored, so the store's swapTo would read a restored set as a draft and blank it. Mirrored onto
// cardioSwapWrap.dataset.logged ("1" / "0") on every call, and the Log button's label and
// .logged class with it, so every write and every chip re-render relabels through this one place
// (the chip re-renders #cardioFields only; the button sits outside it and setCardioSwap's last
// write lands here). No wrap (a lift day) is never live, and has no cardio node to read either way.
function cardioEntryLive(e, sport){
  return !!e&&(CARDIO_PARK_FIELDS[sport]||[]).some(function(f){ return !!e[f]; });
}
function cardioLogLabel(live){ return live?'Logged ✓':'Log'; }
function cardioLive(dayKey){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return false;
  const sport=wrap.dataset.active||wrap.dataset.planned||'';
  const live=cardioEntryLive(getLogs()[logKey(currentWeek,dayKey)], sport);
  wrap.dataset.logged=live?'1':'0';
  const b=document.getElementById('cardioLogBtn');
  if(b){ b.textContent=cardioLogLabel(live); b.classList.toggle('logged',live); }
  return live;
}
// Persist the log form fields to ia_logs_. No toast/re-render — the status-button
// handler (handleDayStatus) owns committing + rendering, so saving and marking the
// day are a single tap. Overwrites the entry, so re-tapping a status updates it.
// V236 (D218): the seven cardio keys follow the regime. On a DRAFT card all seven store ''
// and no V148 stamp lands, so a rolled number stays on the form until a commit tap. LIVE, or
// `commit` truthy (the Log tap, Done, Skip), reads the cardio nodes as before. RPE, notes,
// swapFrom/swapTo, sets and parked are read and carried as before. The regime is recomputed
// after the write. V236 (D219): the slider value is stored only once #log_rpe carries
// data-touched="1" (set by updateRPEDisplay); untouched, the entry's own rpe is carried,
// '' for a new entry, so the thumb resting at 5 is never a number.
function persistLogFields(dayKey, commit){
  // Writing a log entry marks the day touched for the freeze all on its own, with or
  // without a status tap — so the snapshot has to happen here too, not just in
  // handleDayStatus. snapshotDay is first-touch-wins, so the double call is a no-op.
  snapshotDay(currentWeek,dayKey);
  const logs=getLogs();const key=logKey(currentWeek,dayKey);
  const g=v=>document.getElementById(v)?.value||'';
  // V236 (D218): the regime is read from the store before the write.
  const _live=!!commit||cardioLive(dayKey);
  const gc=v=>_live?g(v):'';
  // Record a cardio swap (prescribed sport ≠ the one actually logged) so the entry
  // knows which sport to credit and the journal can show what was swapped.
  const wrap=document.getElementById('cardioSwapWrap');
  const planned=wrap?(wrap.dataset.planned||''):'';
  const active=wrap?(wrap.dataset.active||''):'';
  const swapped=planned&&active&&active!==planned;
  // CARRY THE DRAFTS. This rebuilds the entry from scratch, so anything it does not
  // name is destroyed — and moving the RPE slider would otherwise wipe every set
  // the athlete had stepped on that day.
  const _keepSets=(logs[key]&&logs[key].sets)||null;
  // V234 (D213): the parked sport sets ride the rebuild the same way the sets do.
  const _keepParked=(logs[key]&&logs[key].parked)||null;
  // V238 (D223 item 3): the rest-day jog's record rides the rebuild the same way. It is not a
  // park field, so setCardioSwap never moves it.
  const _keepRest=(logs[key]&&logs[key].restLog)||null;
  // V236 (D219): an untouched slider carries the entry's rpe.
  const _rpeEl=document.getElementById('log_rpe');
  const _rpe=(_rpeEl&&_rpeEl.dataset.touched==='1')?g('log_rpe'):((logs[key]&&logs[key].rpe!=null)?logs[key].rpe:'');
  logs[key]={
    rpe:_rpe,
    run_dist:gc('log_run_dist'), run_pace:gc('log_run_pace'),
    run_mins:gc('log_run_mins'), run_reps:gc('log_run_reps'), run_rep_time:gc('log_run_rep_time'),
    bike_mins:gc('log_bike_mins'), swim_yards:gc('log_swim_yards'),
    notes:g('log_notes'),
    swapFrom: swapped?planned:'', swapTo: swapped?active:'',
    week:currentWeek, ts:Date.now()
  };
  if(_keepSets) logs[key].sets=_keepSets;
  if(_keepParked) logs[key].parked=_keepParked;
  if(_keepRest) logs[key].restLog=_keepRest;
  // V148: derived values feed the LEGACY keys so charts, the journal and _hasLog keep
  // one read surface. run_pace only when no manual pace field is present (dose forms
  // have none, so this never overwrites a typed pace); run_dist only when the interval
  // grammar derives it from reps — the reps stepper starts untouched ('') so an
  // unmoved form can never stamp planned volume into the record.
  // V236 (D218): a DRAFT lands no stamp.
  if(_live){
    const _dd=doseDerived(_curLogDose,{mins:g('log_run_mins'),dist:g('log_run_dist'),reps:g('log_run_reps'),rep:g('log_run_rep_time')});
    if(_dd){
      if(_dd.pace && !logs[key].run_pace) logs[key].run_pace=_dd.pace;
      if(_dd.dist!=null && !logs[key].run_dist) logs[key].run_dist=String(_dd.dist);
    }
  }
  saveLogs(logs);
  cardioLive(dayKey);   // V236 (D218): the regime is recomputed after every write
}
// V236 (D218): the cardio card's Log tap, the commit for a DRAFT card. A wheel still inside its
// settle window commits to its node first, as in handleDayStatus. An empty card (every field of
// the active sport blank on the form) writes nothing and says so. Otherwise the form is committed
// through persistLogFields, whose tail recomputes the regime and relabels the button, and the
// toast names the sport the chip credits.
var CARDIO_LOGGED_TOAST={run:'Run logged ✓',bike:'Ride logged ✓',swim:'Swim logged ✓'};
function logCardio(){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return;
  iaWheelFlush(document.getElementById('detailOverlay'));
  const sport=wrap.dataset.active||wrap.dataset.planned||'';
  const g=v=>document.getElementById(v)?.value||'';
  if((CARDIO_PARK_FIELDS[sport]||[]).every(function(f){ return g('log_'+f)===''; })){ showToast('Nothing to log yet.'); return; }
  persistLogFields(currentDayKey,true);
  showToast(CARDIO_LOGGED_TOAST[sport]);
}
// Reveal the sport picker under the prescribed cardio field.
function toggleCardioPicker(){
  const p=document.getElementById('cardioPicker');
  if(!p) return;
  p.style.display = (p.style.display==='none'||!p.style.display) ? 'block' : 'none';
}
// Swap the logged cardio to a different sport: re-render the input for that sport,
// update the chips + note, rewire persistence, and save. V234 (D213): the chip credits,
// it never erases. Only the active sport's fields sit at top level (a swapped bike never
// lands on the run chart), the leaving sport's numbers park on the entry, and switching
// back brings them back to the form. Tapping the active chip moves nothing.
function setCardioSwap(sport){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return;
  const planned=wrap.dataset.planned||'';
  // V234 (D213): the leaving set is what the form holds at the tap. A wheel still inside its
  // settle window commits first, then the store is brought level with the form under the
  // leaving sport, before anything moves.
  const leaving=wrap.dataset.active||planned;
  iaWheelFlush(wrap);
  persistLogFields(currentDayKey);
  const logs=getLogs();const key=logKey(currentWeek,currentDayKey);
  const e=logs[key]||{};
  if(sport!==leaving){
    const P=Object.assign({},e.parked||{});
    const out={};
    (CARDIO_PARK_FIELDS[leaving]||[]).forEach(function(f){ out[f]=(e[f]==null?'':String(e[f])); e[f]=''; });
    if(Object.keys(out).some(function(f){ return out[f]!==''; })) P[leaving]=out; else delete P[leaving];
    const back=P[sport]||null;
    (CARDIO_PARK_FIELDS[sport]||[]).forEach(function(f){ e[f]=(back&&back[f]!=null)?back[f]:''; });
    delete P[sport];
    if(Object.keys(P).length) e.parked=P; else delete e.parked;
    logs[key]=e; saveLogs(logs);
  }
  wrap.dataset.active=sport;
  const fields=document.getElementById('cardioFields');
  // V148: swapping back to the planned sport restores the dose form; any other sport
  // has no prescription here, so it gets the generic fields (null dose).
  _setCurLogDose((sport===planned)?_curLogDoseFull:null);
  if(fields) fields.innerHTML=cardioFieldHTML(sport, e, _curLogDose, _curLogSub);
  wrap.querySelectorAll('#cardioPicker button[data-sport]').forEach(function(b){
    const on=b.dataset.sport===sport;
    b.style.border='1px solid '+(on?'var(--accent)':'var(--border2)');
    b.style.background=on?'rgba(24,23,18,0.12)':'var(--surface2)';
    b.style.color=on?'var(--accent)':'var(--muted)';
  });
  const note=document.getElementById('cardioSwapNote');
  if(note){
    if(sport!==planned){ note.style.display='block'; note.textContent=cardioSwapNoteText(sport, planned, e); }
    else { note.style.display='none'; note.textContent=''; }
  }
  // Re-wire input persistence for the freshly injected field(s). V236 (D218): cardio ids
  // persist only once the card is LIVE; on a DRAFT the node and the readout are all that move.
  ['log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards'].forEach(function(id){
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',function(){ if(cardioLive(currentDayKey)) persistLogFields(currentDayKey); updateDoseDerived(); });
  });
  iaWheelInit();         // V182 (D3): swap injects fresh markup, so re-seed the wheels
  updateDoseDerived();
  persistLogFields(currentDayKey);
}
function copyExport(){
  const txt=document.getElementById('exportText')?.innerText||'';
  navigator.clipboard.writeText(txt).then(()=>showToast('Copied ✓')).catch(()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('Copied ✓');});
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { cardioEntryLive, cardioLive, cardioLogLabel, persistLogFields, renderStatusFoot, showSwapNudge };
