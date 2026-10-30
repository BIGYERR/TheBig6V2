import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { esc, resnapshotDayEdit } from './storage.ts';
import { activeProg, activeProgId, currentDayKey, currentWeek, showToast } from './rest-day-shell.ts';
import { _stripCapCue, applyInjuryFilter } from '../../../../../../core/src/engine/injury.ts';
import { _AUX_FAMILY_LABEL, _auxFamily, _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { _swapDetailFor, applySwapPrefs } from '../../../../../../core/src/engine/swap-prefs.ts';
import {
  _dayPlanCfg, addCandidates, addedDetailFor, auxSwapCandidates, bumpSwapCount, clearAdd, clearSkip, clearSwap,
  getSwaps, recordAdd, recordSkip, recordSwap, ssSkipToken, swapCandidates, swapLoadNote,
} from './swaps-edits.ts';
import { _PATTERN_REGION, _compoundTier } from '../../../../../../core/src/engine/budget-engine-d.ts';
import { _wildDraw, renderRand } from './random-wildcard.ts';
import { parseRx } from './week-view-sections.ts';
import { openDetail } from './day-detail.ts';
import { showSwapNudge } from './day-status.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── SWAP SHEET ───────────────────────────────────────────────────────────────
let _swapCtx: any=null;
// What did this lift replace on today's card? Drives the "SWAPPED IN" chip.
function swapOriginOf(name: any,src?: any){
  // v0.246.0 D250 (P-WILDEDIT): a Wildcard card's origin is the Wildcard's own swap list, never a program day's.
  if(src==='wild') return ((((_wildDraw&&_wildDraw.swaps)||[]).filter(function(e: any){return e&&e.to===name;}).pop())||{}).from||null;
  if(!activeProgId||!currentDayKey) return null;
  const list=(getSwaps(activeProgId)['w'+currentWeek+'_'+currentDayKey])||[];
  // V228 D192 P-UNDOKEY: the most recent record whose `to` is the card's name, so the chip names the lift that just left.
  // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
  const hit=list.filter(e=>e&&e.to===name).pop();
  return hit?hit.from:null;
}
// Compact form of a prescription, for the one place the sheet states it. Real detail
// strings run to 59 characters ("3 sets — RPE 8 (stop 2 reps short of failure), 2–3 min
// rest"), so the full text cannot sit on a candidate row.
function _rxShort(detail: any){
  const D=String(detail||'');
  const head=(D.match(/^\s*(\d+\s*sets|\d+\s*[×x]\s*[\d–\-+]+)/i)||[])[1];
  const rpe=(D.match(/RPE\s*([\d.]+)/i)||[])[1];
  const clean=head?head.replace(/\s*([×x])\s*/,'×'):'';
  if(clean&&rpe) return clean+' at RPE '+rpe;
  if(clean) return clean;
  return D.length>26?D.slice(0,24)+'\u2026':D;
}
// Candidate row is NAME plus, where it applies, the one thing that is different about this
// choice. The prescription is deliberately NOT repeated here: it carries over verbatim, so
// it is identical on every row, and at up to 59 characters with nowrap it forced the row
// wider than the phone and set the whole sheet scrolling sideways. Stated once in the
// header instead.
function _swapRow(name: any,caution: any,outName: any){
  const safe=name.replace(/'/g,"\\'");
  const load=outName?swapLoadNote(outName,name):'';
  const note=caution?'Different job. Region volume holds.':load;
  return '<button type="button" class="swap-cand'+(caution||load?' caution':'')+'" onclick="applySwapChoice(\''+safe+'\')">'
    +'<span class="swap-cand-name">'+name+'</span>'
    +(note?'<span class="swap-cand-note">'+note+'</span>':'')
    +'</button>';
}
function openSwapSheet(secIdx: any,itemIdx: any,src?: any){
  const day=_editDay(src);   // v0.246.0 D250: the Wildcard's working day for a Wildcard card
  const sec=day&&day.sections&&day.sections[secIdx];
  const item=sec&&sec.items&&sec.items[itemIdx];
  if(!item||!item.name){showToast('Nothing to swap here');return;}
  _swapCtx={secIdx:secIdx,itemIdx:itemIdx,name:item.name,detail:item.detail||''};
  if(src==='wild') _swapCtx.src='wild';
  const c=swapCandidates(item.name,day,currentWeek,activeProg);
  // V162 (ruling D3): a null-pattern movement swaps within its aux family — same
  // sidecar legality (gear, injury, power doctrine) the engine itself answers to.
  const _fam=(!c.pattern)?_auxFamily(item.name):null;
  if(_fam){ c.tier1=auxSwapCandidates(item.name,day,activeProg); c.tier2=[]; }
  // V162 (ruling D2): inside a single-implement round, same-implement candidates rank
  // first and cross-implement picks carry a note — offered, never hidden. The athlete
  // swapping mid-complex has already decided the flow is not happening as written.
  let _flowNote='';
  if(sec&&(sec.superset||sec.type==='superset')&&c.tier1.length){
    const _impl=function(n: any){const N=String(n||'').toLowerCase();return /kettlebell|\(kb/.test(N)?'kb':(/dumbbell|\(db/.test(N)?'db':(/barbell|trap bar/.test(N)?'bb':null));};
    const _mine=_impl(item.name);
    if(_mine&&(sec.items||[]).some(function(x: any){return x&&x.name!==item.name&&_impl(x.name)===_mine;})){
      const _same=c.tier1.filter(function(n){return _impl(n)===_mine;}), _cross=c.tier1.filter(function(n){return _impl(n)!==_mine;});
      c.tier1=_same.concat(_cross);
      if(_cross.length) _flowNote='<div class="swap-sec-sub">This round runs on one implement \u2014 picks lower down break that flow.</div>';
    }
  }
  // @ts-expect-error TS7006 Parameter 'p' implicitly has an 'any' type.
  const tagOf=p=>({hinge:'Hinge',squat:'Squat',lunge:'Lunge',hip_ext:'Hip extension',row:'Row',vpull:'Vertical pull',
    hpress:'Horizontal press',vpress:'Vertical press',bi_iso:'Biceps',tri_iso:'Triceps',delt_iso:'Delts',
    leg_iso:'Leg isolation',calf_iso:'Calves'}[p]||'Lift');
  // @ts-expect-error TS7006 Parameter 'r' implicitly has an 'any' type.
  const regionOf=r=>({push:'Push day',pull:'Pull day',legs:'Leg day'}[r]||'Today');
  // V196 D56: two arms, two meanings. MAIN LIFT is reserved for the SLOT test — item 0
  // of a /^main/i section, the same test _slotOfEntry freezes into the ledger. The tier
  // arm is a heavy compound caution and says so. With the Progress card keeping the name
  // MAIN LIFTS, one tag for both tests made the app contradict itself in the athlete's hand.
  const isMainSlot=(itemIdx===0&&!(sec.superset||sec.type==='superset')&&/^main/i.test(sec.label||''));
  const isHeavyCompound=!isMainSlot&&_compoundTier(item.name)>=3;
  document.getElementById('swapOutName')!.textContent=item.name;
  const rxs=_rxShort(_swapCtx.detail);
  document.getElementById('swapTags')!.innerHTML=
    '<span class="swap-tag">'+(_fam?_AUX_FAMILY_LABEL[_fam]:tagOf(c.pattern))+'</span>'
    +'<span class="swap-tag">'+regionOf(c.region)+'</span>'
    +(isMainSlot?'<span class="swap-tag">Main lift</span>':(isHeavyCompound?'<span class="swap-tag">Heavy compound</span>':''))
    +(rxs?'<div class="swap-keeps">Whatever you pick keeps '+rxs+'.</div>':'');
  let h='';
  if(c.tier1.length){
    h+='<div class="swap-sec-lbl">Same job</div>'
      +'<div class="swap-sec-sub">These do the same work. Your week keeps its shape.</div>'
      +_flowNote
      +c.tier1.map(n=>_swapRow(n,false,item.name)).join('');
  }
  if(c.tier2.length){
    h+='<div class="swap-sec-lbl caution">'+asyIcon('warning',13)+' Different job, same day</div>'
      +'<div class="swap-sec-sub">Still '+(c.region||'the same')+' work. You give up the '+tagOf(c.pattern).toLowerCase()+' for today.</div>'
      +c.tier2.map(n=>_swapRow(n,true,item.name)).join('');
  }
  if(!c.tier1.length&&!c.tier2.length){
    h+='<div class="swap-empty">Nothing else in your kit does this job. Keep it, or drop it with the minus and move on.</div>';
  }else{
    h+='<div class="swap-foot">Swaps hold for this session only. Next week says what it always said.</div>';
  }
  document.getElementById('swapBody')!.innerHTML=h;
  const o=document.getElementById('swapOverlay');o!.classList.add('open');o!.scrollTop=0;
}
function closeSwapSheet(){const o=document.getElementById('swapOverlay');if(o)o.classList.remove('open');_swapCtx=null;}
function applySwapChoice(to: any){
  if(!_swapCtx||!activeProg||!activeProgId){closeSwapSheet();return;}
  const _wild=_swapCtx.src==='wild';
  const day=_editDay(_swapCtx.src);
  const sec=day&&day.sections&&day.sections[_swapCtx.secIdx];
  const item=sec&&sec.items&&sec.items[_swapCtx.itemIdx];
  if(!item){closeSwapSheet();return;}
  const from=_swapCtx.name;
  // Prescription carries verbatim. Because the whole system is pure RPE, "4×5 @ RPE 8"
  // stays honest on any substitute — RPE self-corrects for the movement, so there is no
  // re-prescription pass to run and no chance of a stale percentage following the swap.
  // The ONE exception is a swap onto a movement with no load to move, where a rep target
  // is a guess rather than an instruction; _swapDetailFor converts those and only those.
  // V221 D177 (R1): the second is a wave Main whose reps sit under the candidate's load
  // window; _swapDetailFor raises the rep token to the window and reports it in _rx.win.
  // V221 D177 (R4): the donor's own prescription, by position, taken before anything is
  // renamed. Every item named `from` is kept, because undo is name keyed and the reboot
  // path renames them all. undoSwap writes these back; nothing replays them on a build.
  const _undoRx: any[]=[];
  (day.sections||[]).forEach(function(s: any,si: any){((s&&s.items)||[]).forEach(function(it: any,ii: any){
    // V229 D193 (Amendment 3 section 4): the from-card's kept dose rides beside its detail as `ph`, only when it has one.
    // @ts-expect-error TS2339 Property 'ph' does not exist on type '{ s: any; i: any; d: any; }'.
    if(it&&it.name===from&&typeof it.detail==='string'){ const _e={s:si,i:ii,d:it.detail}; if(typeof it._preHold==='string') _e.ph=it._preHold; _undoRx.push(_e); }
  });});
  item.name=to;
  const _wasDetail=item.detail;
  // V227 D190 P-SWAPSEAM: the carry is blind to the plan's cue (R2), _reRx reads the stripped donor so a cue never
  // moves a toast (R4), and the plan's filter alone decides the cue for the movement now on the card (R3).
  // V229 D193 (R3): the dose that travels is the dose beneath the hold: the kept pre-hold dose when this card has one,
  // else the card as it stands, read beneath the cue or the held-test text.
  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);
  const _rx: Record<string, any>={};
  item.detail=_swapDetailFor(to,_base,_rx);
  const _reRx=(item.detail!==_base);
  // V229 D193 (R3, R8; Amendment 3 section 4): on an injured program the tap keeps the dose before the re-filter beside the
  // card (never printed, never in a sheet row, a digest or a toast), and _held says the plan's clamp changed the RPE of the
  // dose it was handed. Nothing is kept on an uninjured program: the card is its own beneath.
  const _preF=item.detail; let _held=false;
  if(activeProg&&_dayPlanCfg(activeProg,day).injury){
    item._preHold=_preF;
    try{
      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],_dayPlanCfg(activeProg,day));
      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];
      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }
    }catch(e){}
  }
  if(sec.label&&sec.label.indexOf(from)>=0) sec.label=sec.label.split(from).join(to);
  // v0.246.0 D250 (P-WILDEDIT): a Wildcard swap lives on the Wildcard's working day. No record, no swap count, no
  // nudge, no snapshot: no program day hears of it.
  if(_wild) _wildDraw.swaps.push({from:from,to:to,rx:_undoRx});
  else recordSwap(activeProgId,currentWeek,currentDayKey,from,to,_undoRx);
  const nudge=_wild?false:bumpSwapCount(activeProgId,from,to);
  closeSwapSheet();
  if(_wild) renderRand();
  else{ resnapshotDayEdit(currentWeek,currentDayKey); openDetail(currentDayKey,day); }
  // "Same numbers" is a promise the app has to keep. When the reps came off because the
  // movement cannot express them, say so instead.
  // V221 D177 (R5): the third branch fires only when the window branch moved the reps.
  // Never on the unloadable branch, which keeps its V119 copy, never on a verbatim pair.
  // V229 D193 (R8): when the plan's clamp changed the number, the toast names the hold in the same branch's words.
  showToast(_held
    ? (_rx.win
      ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'. Your injury plan holds this one at RPE 7.'
      : _reRx
      ? to+' in, '+from.toLowerCase()+' out. No load to add here. Your injury plan holds this one at RPE 7.'
      : to+' in, '+from.toLowerCase()+' out. Same sets, same reps. Your injury plan holds this one at RPE 7.')
    : _rx.win
    ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Same sets, same effort. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'.'
    : _reRx
    ? to+' in, '+from.toLowerCase()+' out. No load to add here, so take the sets to the same effort.'
    : to+' in, '+from.toLowerCase()+' out. Same job, same numbers.');
  if(nudge) setTimeout(()=>showSwapNudge(from,to),1400);
}
// ── ADD / SKIP HANDLERS (V109) ───────────────────────────────────────────────
// Every mutation follows the same steps as the swap handlers: mutate the live day, write
// the store, resnapshotDayEdit, re-render. Add, skip, swap and undo all take the resnapshot
// step — if the athlete has already logged something, ia_hist_ holds the snapshot and the
// freeze restores from it, so an edit that is not folded into the snapshot silently vanishes
// on the next boot.
function _liveDay(){return activeProg&&activeProg.weeks&&activeProg.weeks[currentWeek]&&activeProg.weeks[currentWeek][currentDayKey];}
// v0.246.0 D250 (P-WILDEDIT): the day an edit addresses. 'wild' is the Wildcard's working day (random-wildcard.ts),
// which an edit redraws and never stores; anything else is the session sheet's day.
function _editDay(src?: any){return src==='wild'?_wildDraw:_liveDay();}
function _afterEdit(day: any,msg: any,src?: any){
  if(src==='wild'){ renderRand(); if(msg) showToast(msg); return; }
  resnapshotDayEdit(currentWeek,currentDayKey);
  openDetail(currentDayKey,day);
  if(msg) showToast(msg);
}
function skipExercise(name: any,src?: any){
  const day=_editDay(src); if(!day||!activeProgId) return;
  let hit=null;
  (day.sections||[]).forEach(function(s: any){(s.items||[]).forEach(function(it: any){if(it&&it.name===name){it._skipped=true;hit=it;}});});
  if(!hit) return;
  if(src!=='wild') recordSkip(activeProgId,currentWeek,currentDayKey,name);
  _afterEdit(day,name+' is off today. Tap to put it back.',src);
}
function unskipExercise(name: any,src?: any){
  const day=_editDay(src); if(!day||!activeProgId) return;
  (day.sections||[]).forEach(function(s: any){(s.items||[]).forEach(function(it: any){if(it&&it.name===name)it._skipped=undefined;});});
  if(src!=='wild') clearSkip(activeProgId,currentWeek,currentDayKey,name);
  _afterEdit(day,name+' is back on the card.',src);
}
function skipSuperset(secIdx: any,src?: any){
  const day=_editDay(src); if(!day||!activeProgId) return;
  const sec=(day.sections||[])[secIdx]; if(!sec) return;
  sec._skipped=true;
  if(src!=='wild') recordSkip(activeProgId,currentWeek,currentDayKey,ssSkipToken(secIdx));
  _afterEdit(day,'Round is off today. Tap to put it back.',src);
}
function unskipSuperset(secIdx: any,src?: any){
  const day=_editDay(src); if(!day||!activeProgId) return;
  const sec=(day.sections||[])[secIdx]; if(sec) sec._skipped=undefined;
  if(src!=='wild') clearSkip(activeProgId,currentWeek,currentDayKey,ssSkipToken(secIdx));
  _afterEdit(day,'Round is back on the card.',src);
}
function removeAddedExercise(name: any){
  const day=_liveDay(); if(!day||!activeProgId) return;
  (day.sections||[]).forEach(function(s: any){
    if(!s._added) return;
    s.items=(s.items||[]).filter(function(it: any){return !(it&&it.name===name);});
  });
  day.sections=(day.sections||[]).filter(function(s: any){return !(s._added&&!(s.items||[]).length);});
  clearAdd(activeProgId,currentWeek,currentDayKey,name);
  _afterEdit(day,name+' removed.');
}
function openAddSheet(){
  const day=_liveDay();
  if(!day||!activeProg){showToast('Nothing to add to here');return;}
  const c=addCandidates(day,currentWeek,activeProg);
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ pu
  const regionLbl={push:'Push day',pull:'Pull day',legs:'Leg day'}[c.region]||'Today';
  let setCount=0;
  ((day.sections)||[]).forEach(function(s: any){(s.items||[]).forEach(function(it: any){
    if(!it||it._skipped) return; const rx=parseRx(it.detail||'',it.name||''); if(rx&&!rx.open) setCount+=rx.sets;
  });});
  document.getElementById('addOutName')!.textContent=(day.title||'Training');
  document.getElementById('addTags')!.innerHTML=
    '<span class="swap-tag">Week '+currentWeek+'</span><span class="swap-tag">'+regionLbl+'</span>'
    +'<span class="swap-tag">'+setCount+' sets</span>'
    +'<div class="swap-keeps">Added work matches the closest thing to it in your week.</div>';
  const row=function(n: any,cls: any,note: any){
    return '<button type="button" class="swap-cand'+(cls?' '+cls:'')+'" onclick="applyAddChoice(\''+n.replace(/'/g,"\\'")+'\')">'
      +'<span class="swap-cand-name">'+esc(n)+'</span>'
      +(note?'<span class="swap-cand-'+(cls?'note':'sub')+'">'+esc(note)+'</span>':'')+'</button>';
  };
  let h='';
  if(c.gap.length){
    h+='<div class="swap-sec-lbl">Today isn\'t training these</div>'
      +'<div class="swap-sec-sub">Work your day has no movement for yet.</div>'
      +c.gap.map(function(n){return row(n,'','');}).join('');
  }
  if(c.more.length){
    h+='<div class="swap-sec-lbl caution">'+asyIcon('warning',13)+' More of what you\'re already doing</div>'
      +'<div class="swap-sec-sub">Your day already trains this pattern. Adding here stacks fatigue on the same tissue.</div>'
      +c.more.map(function(n){
        const rx=parseRx(addedDetailFor(day,n,currentWeek,activeProg),n);
        return row(n,'caution','Your day already has this pattern. Sets go to '+(setCount+((rx&&rx.sets)||3))+'.');
      }).join('');
  }
  if(c.off.length){
    // Off-region work is offered, not hidden. This is the "hip thrusts on a push day"
    // case: the athlete gets the movement AND the thing they would want to know about it.
    h+='<div class="swap-sec-lbl caution">'+asyIcon('warning',13)+' Not what today is for</div>'
      +'<div class="swap-sec-sub">Different region than this day trains. Fine once, but watch what it lands next to.</div>'
      +c.off.map(function(n){
        // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
        const r=_PATTERN_REGION[_pattern(n)];
        // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ pu
        return row(n,'caution',({push:'Push',pull:'Pull',legs:'Leg'}[r]||'That')+' work on a '+(({push:'push',pull:'pull',legs:'leg'}[c.region])||'training')+' day. Check what it sits next to in the week.');
      }).join('');
  }
  if(!h) h='<div class="swap-empty">Nothing left in your kit that isn\'t already on this card.</div>';
  else h+='<div class="swap-foot">Added work holds for this session only. It logs and counts like anything else on the card. Next week says what it always said.</div>';
  document.getElementById('addBody')!.innerHTML=h;
  const o=document.getElementById('addOverlay');o!.classList.add('open');o!.scrollTop=0;
}
function closeAddSheet(){const o=document.getElementById('addOverlay');if(o)o.classList.remove('open');}
function applyAddChoice(name: any){
  const day=_liveDay();
  if(!day||!activeProgId){closeAddSheet();return;}
  // The dose is resolved by type against the live week (V163 D1), then shaped for the
  // movement: right as a rep target on a loaded add, converted to open RPE sets on an
  // unloadable one, same as a swap.
  const detail=_swapDetailFor(name,addedDetailFor(day,name,currentWeek,activeProg));
  let bucket=(day.sections||[]).filter(function(s: any){return s._added;})[0];
  if(!bucket){ bucket={label:'Added by you',_added:true,items:[]}; day.sections.push(bucket); }
  if(!bucket.items.some(function(it: any){return it.name===name;}))
    bucket.items.push({name:name,detail:detail,_addedByUser:true});
  recordAdd(activeProgId,currentWeek,currentDayKey,name,detail);
  closeAddSheet();
  _afterEdit(day,name+' added at '+detail+'.');
}
function undoSwap(from: any,src?: any){
  if(!activeProg||!activeProgId) return;
  const _wild=src==='wild';
  const day=_editDay(src);
  if(!day) return;
  const list=_wild?(day.swaps||[]):((getSwaps(activeProgId)['w'+currentWeek+'_'+currentDayKey])||[]);
  // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
  const hit=list.filter(e=>e&&e.from===from)[0];
  if(!hit) return;
  const back: Record<string, any>={}; back[hit.to]=from;
  applySwapPrefs(day.sections,back);
  // V221 D177 (R4): the name is back; now the donor's own detail. Each stored detail goes
  // to the item at its stored position if that item carries `from` again, else to the
  // first `from` item not yet written. A record from before V221 has no rx, so the name
  // alone comes back, exactly as before. No migration.
  if(Array.isArray(hit.rx)){
    const _put: any[]=[];
    hit.rx.forEach(function(p: any){
      if(!p||typeof p.d!=='string') return;
      const ps=day.sections[p.s], at=ps&&ps.items&&ps.items[p.i];
      let it=(at&&at.name===from&&_put.indexOf(at)<0)?at:null;
      if(!it) (day.sections||[]).some(function(s: any){return ((s&&s.items)||[]).some(function(x: any){
        if(x&&x.name===from&&_put.indexOf(x)<0){it=x;return true;} return false;});});
      // V229 D193 (Amendment 3 section 4) / D194 R6: the kept dose comes back from the record with the card, or nothing is kept.
      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}
    });
  }
  // v0.246.0 D250: on the Wildcard the record leaves its own list, as clearSwap drops it from the store.
  if(_wild){ day.swaps=(day.swaps||[]).filter(function(e: any){return e&&e.from!==from;}); renderRand(); }
  else{ clearSwap(activeProgId,currentWeek,currentDayKey,from); resnapshotDayEdit(currentWeek,currentDayKey); openDetail(currentDayKey,day); }
  showToast(from+' is back on the card.');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _editDay, swapOriginOf };
