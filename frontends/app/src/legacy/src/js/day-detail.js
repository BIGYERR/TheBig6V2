import { asyIcon } from './icons.js';
import { clearSetDraft, completedKey, getCompleted, getLogs, getPrograms, logKey, savePrograms } from './storage.js';
import {
  _setCurrentDayKey, _setStaleWarnShown, _setStaleWarnSrc, activeProg, activeProgId, currentDayKey, currentWeek,
  showToast,
} from './rest-day-shell.js';
import { exStoreKey } from './exercise-library.js';
import { DAY_FULL } from './wizard.js';
import { wildcardTagHTML } from './random-wildcard.js';
import { buildSectionsHTML } from './week-view-sections.js';
import { buildCardioHTML, refreshSetSummary, setWeightVals, toStoreW } from './set-logging.js';
import { getExWeights, isKBExercise, logExerciseWeight, updateDoseDerived } from './log-entries.js';
import { buildLogHTML, iaWheelInit, modTagsHTML, sessionLogProgress } from './wheel-log.js';
import { ruResetIfIdle } from './rest-timer.js';
import { cardioLive, persistLogFields, renderStatusFoot } from './day-status.js';
import { travelTagHTML } from './overlays.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// ── V139: TEST-WEEK e1RM CALCULATOR + RANGE-TOP NUDGE ────────────────────────
// Epley with the honest edge case: a true single IS the max, no formula inflation.
function _epley(wt,reps){ if(!(wt>0)) return 0; return reps<=1 ? Math.round(wt) : Math.round(wt*(1+reps/30)); }
function e1rmCalcHTML(day){
  if(!day||!day.testLift) return '';
  const unit=window._unitLabel||'lbs';
  // Prefill from the logged test set when one exists. The main is section 0 item 0.
  let pw='',pr=3;
  try{
    const mainName=day.sections&&day.sections[0]&&day.sections[0].items[0]&&day.sections[0].items[0].name;
    const _row=getExWeights()[exStoreKey(mainName)];
    const ent=((_row&&_row.entries)||[]).slice(-1)[0];
    if(ent&&ent.weight){ pw=ent.weight; if(ent.setsDone&&ent.setsDone.length) pr=Math.min(5,Math.max(1,+ent.setsDone[0]||3)); }
  }catch(e){}
  const liftLabel={bench:'bench',squat:'squat',deadlift:'deadlift'}[day.testLift]||day.testLift;
  let opts='';for(let i=1;i<=5;i++)opts+='<option'+(i===pr?' selected':'')+'>'+i+'</option>';
  return '<div class="e1rm" id="e1rmCard">'
    +'<div class="e1rm-hd">Estimated 1RM <small>from your test set</small></div>'
    +'<div class="e1rm-row">'
    +'<div class="e1rm-field"><label>Weight ('+unit+')</label><input id="e1w" type="number" inputmode="decimal" value="'+pw+'" oninput="e1rmCalcUpdate()"></div>'
    +'<div class="e1rm-field"><label>Reps</label><select id="e1r" onchange="e1rmCalcUpdate()">'+opts+'</select></div>'
    +'</div>'
    +'<div class="e1rm-out"><span class="lbl">Estimated 1RM</span><span class="val" id="e1out">0 <span>'+unit+'</span></span></div>'
    +'<button class="e1rm-save" id="e1save" onclick="saveTestMax(\''+day.testLift+'\')">Save as new '+liftLabel+' max</button>'
    +'<div class="e1rm-saved" id="e1saved"></div>'
    +'<div class="e1rm-hint">Experienced with heavy singles and have a spotter? A single at RPE 9.5 works too. Enter it at 1 rep.</div>'
    +'</div>';
}
function e1rmCalcUpdate(){
  const w=parseFloat((document.getElementById('e1w')||{}).value)||0;
  const r=parseInt((document.getElementById('e1r')||{}).value)||1;
  const v=_epley(w,r);
  const o=document.getElementById('e1out');
  if(o)o.innerHTML=v+' <span>'+(window._unitLabel||'lbs')+'</span>';
  return v;
}
function saveTestMax(lift){
  const v=e1rmCalcUpdate();
  if(!(v>0)) return;
  const programs=getPrograms();
  const p=programs.filter(x=>x&&x.id===activeProgId)[0];
  if(p&&p.cfg){
    p.cfg[lift]=v;
    if(activeProg&&activeProg.cfg)activeProg.cfg[lift]=v;
    savePrograms(programs);
    // No rebuild here on purpose. Test week is the block's last week — nothing left in
    // this block reads the number. The NEXT build anchors off it (refreshProgram reads
    // cfg on every boot), which is exactly the re-anchor the card promises.
  }
  const b=document.getElementById('e1save'),m=document.getElementById('e1saved');
  if(b)b.style.display='none';
  if(m){m.textContent='Saved. Your next block anchors off '+v+' '+(window._unitLabel||'lbs')+'.';m.style.display='block';}
}
// One banner per day, and only when the log has earned it: the LAST logged session for
// that exercise shows every set at or above the top of the prescribed range. Reads the
// same ia_exw_ store the set logger writes; parses the range straight off the detail.
function rangeTopNudgeHTML(day){
  if(!day||!day.sections) return '';
  const names=[];
  try{
    const store=getExWeights();
    day.sections.forEach(sec=>(sec.items||[]).forEach(it=>{
      if(!it||!it.name||!it.detail) return;
      const m=/^(\d+)×(\d+)–(\d+)( each)?( @ RPE .*)?$/.exec(it.detail);
      if(!m) return;
      const sets=+m[1], hi=+m[3];
      const _row=store[exStoreKey(it.name)];
      const ent=((_row&&_row.entries)||[]).slice(-1)[0];
      if(!ent||!ent.setsDone||ent.setsDone.length<sets) return;
      const done=ent.setsDone.slice(0,sets).map(x=>+x||0);
      if(done.length>=sets && done.every(x=>x>=hi)) names.push(it.name);
    }));
  }catch(e){}
  if(!names.length) return '';
  const shown=names.slice(0,2).map(n=>'<b>'+n+'</b>').join(' and ');
  const extra=names.length>2?' and '+(names.length-2)+' more':'';
  return '<div class="prog-nudge"><b>Time to add weight.</b> Last session you hit the top of the range on every set of '
    +shown+extra+'. Go up in weight today and start back at the bottom of the range.</div>';
}
function openDetail(dayKey,day){
  _setStaleWarnShown(false); _setStaleWarnSrc('');
  window._unitLabel=(activeProg&&activeProg.cfg&&activeProg.cfg.unit==='kg')?'kg':'lbs';
  // V152 — A RE-RENDER MUST NOT MOVE THE READER.
  // openDetail is not only an open. It is also the re-render for every in-session edit:
  // skipExercise / unskipExercise / skipSuperset / unskipSuperset (the minus button),
  // applySwapChoice, undoSwap, applyAddChoice, selectKBSize and acceptSwapNudge all route
  // back through here. The unconditional `scrollTop=0` at the tail was FIRST-OPEN
  // behaviour sitting on a REFRESH path, so skipping the sixth exercise on a card threw
  // the athlete back to the top of the session.
  // The distinction is decided HERE, from the sheet's own live state, and is deliberately
  // NOT a parameter: a flag would put the burden on every future call site and this bug
  // returns the first time one is added without it.
  // Genuine open = the sheet was closed, or it is being pointed at a different day.
  const _dOv=document.getElementById('detailOverlay');
  const _dFresh=!(_dOv&&_dOv.classList.contains('open')&&currentDayKey===dayKey);
  const _dKeep=_dFresh?0:_dOv.scrollTop;
  _setCurrentDayKey(dayKey);
  const comp=getCompleted()[completedKey(currentWeek,dayKey)];
  const over=document.getElementById('detailDayName');if(over)over.textContent='Week '+currentWeek+' \u00b7 '+DAY_FULL[dayKey];
  const ttl=document.getElementById('detailDayTitle');if(ttl)ttl.textContent=(comp&&comp.title)||day.title||'Training';
  const tg=document.getElementById('detailTags');if(tg)tg.innerHTML=modTagsHTML(day.tags)+travelTagHTML(day);   // V175 (D30)
  const prog=sessionLogProgress(day);
  const ctr=document.getElementById('detailCounter');
  if(ctr){if(prog.total>0){ctr.style.display='';ctr.textContent=prog.done+' / '+prog.total+' LOGGED';}else{ctr.style.display='none';}}
  ruResetIfIdle();

  const _secs=day.sections||[];
  // The RPE scale is explained once, app-wide, via the ⓘ button in the day header —
  // no inline key or legend is printed in the workout content anymore.
  let liftHTML='';
  if(_secs.length){
    // V139: the calculator renders directly under the main it scores (mock placement).
    liftHTML=buildSectionsHTML([_secs[0]],0)+(day.testLift?e1rmCalcHTML(day):'')+buildSectionsHTML(_secs.slice(1),1);
  }
  // ORDER FOLLOWS PRESCRIPTION, NOT MODALITY (V123, Mario's call). The cardio card used to
  // render first on every day. Athletes train the card in the order it is printed, so on a
  // strength-priority day that meant a run immediately before a heavy squat — backwards,
  // and the exact interference the engine spends capRegionalFatigue trying to manage.
  // Lift-first ONLY when lifting is the priority: on an event path or a support focus the
  // cardio IS the point of the block and keeps the top slot.
  const _liftFirst = _secs.length && !(activeProg && (activeProg.primaryPath==='event'
      || /^support_/.test(String(activeProg.liftingFocus||''))));
  let html = _liftFirst
    ? liftHTML + buildCardioHTML(day.cardio)
    : buildCardioHTML(day.cardio) + (_secs.length ? liftHTML : '');
  if(day.note) html+='<div class="note-block">'+day.note+'</div>';
  const _rtNudge=rangeTopNudgeHTML(day); if(_rtNudge) html=_rtNudge+html;
  const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(_wcTag) html=_wcTag+html;   // V195 (D64)
  html+=buildLogHTML(dayKey, day.cardio);
  const curStatus=comp?(comp.status||'complete'):null;
  const escTitle=(day.title||'').replace(/'/g,"\\'");
  const _le=getLogs()[logKey(currentWeek,dayKey)];
  const _hasLog=_le&&((_le.notes&&_le.notes.trim())||_le.run_dist||_le.run_pace||_le.run_mins||_le.run_reps||_le.run_rep_time||_le.bike_mins||_le.swim_yards);
  if(!curStatus && _hasLog){
    html+='<div class="log-nudge"><span>'+asyIcon('notebook',14)+' You logged this one but never marked it.</span><button class="log-nudge-btn" onclick="handleDayStatus(\''+dayKey+'\',\''+escTitle+'\',\'complete\')">Mark Done \u2713</button></div>';
  }
  document.getElementById('detailBody').innerHTML=html;

  renderStatusFoot(dayKey, day.title||'');   // V181 (D1/D2)

  // V236 (D218): RPE and notes autosave on input, deliberate gestures. A cardio node (wheel
  // settle, yards box) persists only once the card is LIVE; on a DRAFT it has written its
  // hidden node and the readout repaints, nothing else.
  ['log_rpe','log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards','log_notes'].forEach(function(id){
    var el=document.getElementById(id);
    var free=(id==='log_rpe'||id==='log_notes');
    if(el) el.addEventListener('input',function(){ if(free||cardioLive(dayKey)) persistLogFields(dayKey); updateDoseDerived(); });
  });
  iaWheelInit();         // V182 (D3): wheels drive the hidden nodes wired just above
  updateDoseDerived();   // V148: initial paint of the derived readout
  if(_dOv){
    _dOv.classList.add('open');
    // Restoring the OFFSET, not an element anchor, is the right granularity here: an edit
    // changes the card height by one collapsed row, and the browser clamps this write to
    // the new max on its own, so a skip at the very bottom lands at the new bottom.
    _dOv.scrollTop=_dFresh?0:_dKeep;
  }
}
function selectKBSize(exKey, size, unit, exName, setsReps) {
  // Store Kettlebell size directly
  logExerciseWeight(exName, size, setsReps, currentWeek, null, null, currentDayKey);
  showToast(size + ' ' + unit + ' bell logged ✓');
  // Refresh detail
  const wkData = activeProg?.weeks?.[currentWeek];
  if(wkData && currentDayKey && wkData[currentDayKey]) openDetail(currentDayKey, wkData[currentDayKey]);
}
// Kettlebell size data stored globally for lookup by exKey
const _kbPending = {};
function buildKBChips(exKey, lastW, weekLabel, unit, exName, setsReps) {
  const kbSizes = unit==='kg' ? [8,12,16,20,24,28,32,36,40] : [15,20,25,35,44,53,62,70,80];
  const kbUnit  = unit==='kg' ? 'kg' : 'lb';
  _kbPending[exKey] = {exName, setsReps, kbUnit};
  const lastTxt = lastW ? ' · Last: '+lastW+' '+kbUnit+weekLabel : '';
  let html = `<div style="font-size:10px;color:var(--muted);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Bell size${lastTxt}</div>`;
  html += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
  kbSizes.forEach(function(s) {
    const sel = +lastW === s;
    const bdr = sel ? 'var(--accent)' : 'var(--border2)';
    const bg  = sel ? 'rgba(24,23,18,0.20)' : 'var(--surface2)';
    const clr = sel ? 'var(--accent)' : 'var(--muted)';
    html += `<button data-exkey="${exKey}" data-size="${s}" onclick="selectKBByKey(this.dataset.exkey,+this.dataset.size)" style="font-family:var(--font-display);font-size:12px;font-weight:700;padding:5px 9px;border-radius:4px;cursor:pointer;border:1px solid ${bdr};background:${bg};color:${clr}">${s}</button>`;
  });
  html += '</div>';
  return html;
}
function selectKBByKey(exKey, size) {
  const p = _kbPending[exKey];
  if(!p) return;
  selectKBSize(exKey, size, p.kbUnit, p.exName, p.setsReps);
}
function stepExVal(exKey, delta) {
  const input = document.getElementById('exw_' + exKey);
  if(!input) return;
  const current = parseFloat(input.value) || 0;
  const next = Math.max(0, current + delta);
  input.value = next;
}
// `quiet` is the live-after-log path: same write, no toast. Not a second writer.
function saveExWeight(exKey, exName, setsReps, quiet) {
  const unit = activeProg?.cfg?.unit || 'lbs';
  // Per-set actual reps (or seconds/yards) — read every row, empty falls back to its
  // prescribed placeholder so an untouched set logs as prescribed.
  const rows = Array.prototype.slice.call(document.querySelectorAll('input[id^="exset_'+exKey+'_"]'));
  const setsDone = rows.map(function(el){
    const raw = (el.value!=='' ? el.value : el.placeholder);
    const v = parseInt(raw||'0',10);
    return isNaN(v) ? 0 : v;
  });
  // Per-set load, display units. Present only on loaded movements; an untouched cell
  // reads its placeholder, which cascade keeps synced to the collapsed Load field.
  const dispSets = setWeightVals(exKey);
  // Single working weight for the exercise (loaded lifts only).
  const wInput = document.getElementById('exw_'+exKey);
  let storedW = 0, hasW = false, dispW = 0;
  if(wInput){
    const raw = (wInput.value!=='' ? wInput.value : wInput.placeholder);
    const v = parseFloat(raw);
    if(!isNaN(v) && v>0){ dispW = v; storedW = (unit==='kg') ? Math.round(v*2.20462) : v; hasW = true; }
  }
  // THE progression rule: the entry's weight is the HEAVIEST set, not the collapsed
  // field and not the last set. A drop set's stimulus is its top set; the back-offs
  // are volume. setsW carries the full ladder alongside so nothing is lost, but every
  // existing consumer — big-3 weekly max, per-exercise chart, reuse pill — keeps
  // reading the single `weight` scalar and needs no change.
  let setsW = [];
  if(dispSets.length && dispSets.some(function(x){return x>0;})){
    setsW = dispSets.map(toStoreW);
    const top = Math.max.apply(null, setsW);
    if(top>0){ storedW = top; hasW = true; dispW = Math.max.apply(null, dispSets); }
  }
  if(!rows.length && !hasW){ showToast('Nothing to log here'); return; }
  logExerciseWeight(exName, storedW, setsReps, currentWeek, setsDone, setsW, currentDayKey);
  // The record now owns this exercise for this day. The draft has to go, or the next
  // render has two sources of truth for the same cells.
  clearSetDraft(exKey);
  if(!quiet) showToast(hasW ? (dispW+' '+unit+' logged \u2713') : 'Logged \u2713');
  // In-place update ONLY this row — never rebuild the overlay (that wipes half-entered inputs).
  const _card=document.getElementById('excard_'+exKey); if(_card)_card.classList.add('logged');
  const _bdg=document.getElementById('exbadge_'+exKey); if(_bdg)_bdg.textContent='\u2713';
  if(wInput && hasW){
    // V148: keep the logged number SOLID in the box (was demoted to a grey placeholder,
    // which then vanished entirely on the next render — the render path now restores it,
    // and the in-place path matches so the two can never disagree about the same state).
    wInput.value=String(dispW); wInput.placeholder=String(dispW);
    const wunit=isKBExercise(exName)?(unit==='kg'?'kg':'lb'):unit;
    const numEl=document.getElementById('exreusenum_'+exKey); if(numEl)numEl.textContent=dispW+' '+wunit;
    const recEl=document.getElementById('exrec_'+exKey); if(recEl)recEl.textContent='earlier today';
  }
  // Collapsed bar restates what was just logged. Same in-place discipline as above —
  // rebuilding the overlay here would wipe half-entered inputs on the other cards.
  // ONE writer for both halves of this line. The hand-written 'logged' stamp that used
  // to sit here duplicated what refreshSetSummary now derives from the `.logged` class
  // set four lines above. Two writers agreeing today is two writers free to disagree later.
  refreshSetSummary(exKey);
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _epley, openDetail, saveExWeight };
