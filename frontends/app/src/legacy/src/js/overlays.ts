import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { getPrograms, savePrograms } from './storage.ts';
import { _setActiveProg, activeProg, showToast } from './rest-day-shell.ts';
import { _parseLocalDate, getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { INJURY_REGIONS, injuryPlan } from '../../../../../../core/src/engine/injury.ts';
import { buildProgram } from '../../../../../../core/src/engine/budget-engine-d.ts';
import { _progDayDate, calcCurrentWeek, renderWeekView } from './week-view-sections.ts';
import { refreshProgram } from './program-manage.ts';
import { popFire } from './popups-streaks-reminders.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// Re-run the engine for an EXISTING program on load so it reflects the CURRENT engine rather
// than whatever was baked when it was first generated — e.g. a program created under the old
// weight model picks up the new RPE prescriptions on next open. buildProgram is pure
// (cfg in → program out), so activeProgId MUST already be set to this program before calling.
// Gated to programs carrying a stored seed (V196+): without a stable seed, rebuilding would
// reshuffle exercise selection, so older programs are left as their baked selves. Rebuild is
// in-memory only (storage stays the stable fallback). Fail-safe: any error falls back to the
// stored program so loading never breaks.
// ── TEMPORARY OVERLAYS ────────────────────────────────────────────────────────
// A "temporary modification" is NOT a config change. "I'm in a hotel for two weeks"
// must not permanently rewrite cfg.equipment — the program has to revert on its own,
// or the athlete has to remember to undo it (they won't). Overlays live on the
// program as a SIBLING to cfg: cfg is the recipe for building, overlays are
// modifications applied to the built result. Shape:
//   {id, type:'substitute', from:'YYYY-MM-DD', to:'YYYY-MM-DD'|null, patch:{...cfg}, note, created}
// `to: null` = open-ended (runs to the end of the program) for "no running until
// further notice" cases. Dates are the SOURCE OF TRUTH, weeks are derived — once
// Suspend lands and pauses the clock, program weeks shift, so anchoring an overlay
// to a week number would be circular.
// Program week containing a calendar date (1-based, matching the weeks object).
function weekOfDate(prog: any, dateStr: any){
  if(!prog || !prog.startDate) return null;
  const d=_parseLocalDate(dateStr); if(!d) return null;
  const mon=getWeekMonday(prog.startDate);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((d-mon)/86400000);
  return diff<0 ? 1 : Math.floor(diff/7)+1;
}
// Resolve an overlay's date range to a clamped [fromWeek,toWeek], or null if it
// falls entirely outside the program.
function overlayWeekRange(prog: any, ov: any, totalWeeks: any){
  if(!ov || !ov.from || !totalWeeks) return null;
  const fw=weekOfDate(prog, ov.from);
  if(fw==null) return null;
  const tw = ov.to ? weekOfDate(prog, ov.to) : totalWeeks;   // open-ended → to program end
  if(tw==null) return null;
  const lo=Math.max(1,fw), hi=Math.min(totalWeeks,tw);
  return hi<lo ? null : {fromWeek:lo, toWeek:hi};
}
// ── D2b (V142): THE PACE CLOCK FREEZES WHILE THE ATHLETE CANNOT RUN QUALITY ──
// paceProgression is indexed by calendar week, so it kept tightening through injury
// overlays: an athlete back at week 6 was handed week 6's pace having last run
// quality at week 3's. This map is the correction. Derived FRESH from overlays on
// every rebuild, never stored as state: same overlays, same map, same build. A
// program with no overlays derives no map and builds byte-identical to V141.
// Counting rule (D2b-i): DAYS, not week spans, so a Wednesday return can never
// inflate 9 suppressed days into a 2-week shift. shift = round(days/7), floor 1.
// A week counts as suppressed only if its overlay's cardioMode actually touched
// running (easy/reduce/noimpact/noimpact_swim). Halfstep weeks never count: quality
// is back at pace, the clock legitimately runs. swimout (shoulder) and elbow never
// count: their runs never stopped. Overlapping overlays are merged so a stacked
// injury cannot double-count a day.
function paceShiftMap(prog: any){
  const tw=prog&&prog.totalWeeks||0;
  if(!tw||!prog.startDate||!Array.isArray(prog.overlays)||!prog.overlays.length) return null;
  const SUP: Record<string, any>={easy:1,reduce:1,noimpact:1,noimpact_swim:1};
  const today=new Date(); today.setHours(0,0,0,0);
  const mon=getWeekMonday(prog.startDate);
  const end=new Date(mon.getTime()+tw*7*86400000-86400000);
  const spans: any[]=[];
  // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
  prog.overlays.forEach(ov=>{
    if(!ov||ov.type!=='injury'||!ov.patch||!ov.patch.injury) return;
    const inj=ov.patch.injury;
    if(inj.halfstep) return;
    // @ts-expect-error TS2345 Argument of type '{ injury: { region: any; tier: any; }; }' is not assignable to parameter of type 'Cfg
    const P=injuryPlan({injury:{region:inj.region,tier:inj.tier}});
    if(!P||!P.cardioMode||!SUP[P.cardioMode]) return;
    const f=_parseLocalDate(ov.from); if(!f) return;
    // Open-ended live injury: every day hurt so far counts. The map grows as the
    // injury runs, which is correct: each day the athlete cannot run quality is
    // another day the clock holds.
    let t=ov.to?_parseLocalDate(ov.to):today;
    if(!t) t=today;
    const lo=Math.max(f.getTime(),mon.getTime());
    const hi=Math.min(t.getTime(),end.getTime());
    if(hi>=lo) spans.push([lo,hi]);
  });
  if(!spans.length) return null;
  spans.sort((a,b)=>a[0]-b[0]);
  const merged=[spans[0].slice()];
  for(let k=1;k<spans.length;k++){
    const m=merged[merged.length-1];
    if(spans[k][0]<=m[1]+86400000) m[1]=Math.max(m[1],spans[k][1]);
    else merged.push(spans[k].slice());
  }
  const map=new Array(tw+1).fill(0);
  for(let w=1;w<=tw;w++){
    const wkStart=mon.getTime()+(w-1)*7*86400000;
    let days=0;
    merged.forEach(s=>{
      const hi=Math.min(s[1],wkStart-86400000);
      if(hi>=s[0]) days+=Math.round((hi-s[0])/86400000)+1;
    });
    map[w]=days>0?Math.max(1,Math.round(days/7)):0;
  }
  for(let w=1;w<=tw;w++){ if(map[w]>0) return map; }
  return null;
}
// Splice overlay weeks into a freshly-built program. Builds a VARIANT program from
// the patched cfg and takes only its week range — rather than mutating cfg mid-build
// or find-and-replacing exercises in the output. This works because the engine keys
// everything off the TRUE program week (the lifting wave tiles across the full
// program), so week 5 pulled from a travel build is still week 5: same wave position,
// same deload cadence, same taper math. Progression is preserved for free.
// Overlap rule: later-created overlay wins (applied last).
function applyOverlays(prog: any, rebuilt: any){
  const ovs = Array.isArray(prog && prog.overlays) ? prog.overlays : [];
  if(!ovs.length) return rebuilt;
  const totalWeeks = rebuilt.totalWeeks || prog.totalWeeks || 0;
  const _variantCache: Record<string, any> = {};
  // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
  ovs.slice().sort((a: any,b: any)=>((a&&a.created)||0)-((b&&b.created)||0)).forEach(ov=>{
    try{
      if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;
      const range = overlayWeekRange(prog, ov, totalWeeks);
      if(!range) return;                                   // outside the program → inert
      const ck = JSON.stringify([ov.type, ov.patch]);      // one build per distinct type+patch
      // _travel marks the build as a temporary situation rather than the athlete's real
      // setup. It is what lets "Mini gym" mean a hotel rack (a few light dumbbells, hold
      // the line) while the SAME home_basic tier chosen in the wizard means a real home
      // gym with adjustable dumbbells and trains normally. Set here rather than in the
      // patch so it applies to overlays saved before this existed. TRAVEL-ONLY semantic:
      // injury variants build clean so home equipment keeps meaning what the wizard said.
      if(!_variantCache[ck]) _variantCache[ck] = buildProgram(ov.type==='substitute' ? {...prog.cfg, ...ov.patch, _travel:true} : {...prog.cfg, ...ov.patch});
      const variant = _variantCache[ck];
      if(!variant || !variant.weeks) return;
      // V175 (D27): THE UNIT IS THE DAY. Dates are the source of truth (§6b) and the
      // week range is only the search window: inside it, a day takes the variant only
      // if its own calendar date falls in [from, to] (both inclusive — D29). A trip that
      // starts on Tuesday and ends on Tuesday changes Tuesday; the old whole-week splice
      // rewrote all six days and handed the athlete chair squats on Wednesday. A
      // full-week overlay resolves every day and is byte-identical to the old splice.
      // Measured before ruling: the variant's same-day is a structural drop-in (0
      // mismatches on cardio / core / role / tags over 54,432 pairs — the split is
      // cfg-driven, equipment only changes the picks) and cross-seam adjacent-day
      // repeats run BELOW the base engine's own rate, so the merged week is not
      // re-deconflicted. Bridge and halfstep overlays are date-exact by construction
      // (from..from+6), so they now cover exactly the seven days the popup promises
      // instead of spilling into a third calendar week. Rest days stay the base's.
      const _from = _parseLocalDate(ov.from);
      const _to   = ov.to ? _parseLocalDate(ov.to) : null;
      if(!_from) return;
      // The legal universe rides on the DAY, not the week. A spliced day is stamped
      // with its overlay key and the sheet looks the universe up by that key, so a
      // hotel day in a gym week offers hotel-legal candidates and the gym days beside
      // it still offer the rack. The stamp rides on the content, so it survives a
      // rest-day move and goes into the ia_hist_ snapshot as part of the record.
      if(!rebuilt._swapUniverseByKey) rebuilt._swapUniverseByKey = {};
      if(Array.isArray(variant._swapUniverse)) rebuilt._swapUniverseByKey[ck] = variant._swapUniverse;
      for(let w=range.fromWeek; w<=range.toWeek; w++){
        const vw = variant.weeks[w]; if(!vw) continue;
        if(!rebuilt.weeks[w]) rebuilt.weeks[w] = {};
        Object.keys(vw).forEach(d=>{
          const vd = vw[d]; if(!vd || vd.rest) return;
          const dt = _progDayDate(prog, w, d); if(!dt) return;
          if(dt < _from || (_to && dt > _to)) return;
          rebuilt.weeks[w][d] = Object.assign({}, vd, {_ovKey: ck});
        });
      }
    }catch(e){
      // An injury or travel plan silently not applying is a safety failure, not a
      // log line. Tell the athlete the plan change did not take. Toast is wrapped
      // because applyOverlays can run at boot before the DOM is ready.
      console.error('overlay apply failed', ov && ov.id, e);
      try{ showToast('A plan change failed to apply. Flag it in Bugs.'); }catch(_e){}
    }
  });
  return rebuilt;
}

// ── V175 (D30): the overlay a day came from, read off the day itself ────────────
// applyOverlays stamps every spliced day with its overlay key. Reading the stamp is
// what makes the tag, the strip underline and the pill agree with the CARD: a day says
// it is a hotel session because it IS one, not because a date range says it should be.
// Survives rest-day moves and lives in the ia_hist_ snapshot as part of the record.
function dayOverlayInfo(day: any){
  if(!day||typeof day._ovKey!=='string') return null;
  try{ const k=JSON.parse(day._ovKey); if(!Array.isArray(k)||!k[1]) return null; return {type:k[0],patch:k[1]}; }catch(e){ return null; }
}
// Travel = a substitute overlay that took something AWAY. A commercial patch (pre-V96
// overlays only) trains normally and never reads as travel.
function dayIsTravel(day: any){
  const i=dayOverlayInfo(day);
  return !!(i&&i.type==='substitute'&&i.patch.equipment!=='commercial');
}
function travelTagHTML(day: any){
  if(!dayIsTravel(day)) return '';
  return '<span class="wk-tag wk-travel">'+asyIcon('backpack',11)+'<span>Travel</span></span>';
}
// ── V175 (D29): one date grammar for every surface that names an overlay span ──
function _fmtDateWd(iso: any){ return iso?new Date(iso+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).replace(',',''):''; }
const _DAY_WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen'];
// @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
function _dayCount(from: any,to: any){ const a=_parseLocalDate(from),b=_parseLocalDate(to); if(!a||!b) return 0; return Math.round((b-a)/86400000)+1; }
function _dayCountWord(nd: any){ const w=_DAY_WORDS[nd]; return (w?w.charAt(0).toUpperCase()+w.slice(1):String(nd))+(nd===1?' day':' days'); }
// Chip title. Whole weeks keep the week grammar the athlete already knows; anything
// shorter is named by its dates, because a week label over a one-day trip is the lie
// this version exists to remove. "Tue Sep 1" · "Sep 1–4" · "Sep 29–Oct 2" · "From Sep 1".
function overlaySpanLabel(prog: any, ov: any){
  if(!ov||!ov.from) return '';
  const f=_parseLocalDate(ov.from); if(!f) return '';
  if(!ov.to) return 'From '+_fmtDate(ov.from);
  const t=_parseLocalDate(ov.to); if(!t) return '';
  const wholeWeeks = f.getDay()===1 && t.getDay()===0;
  if(wholeWeeks){ const r=overlayWeekRange(prog, ov, (prog&&prog.totalWeeks)||0); if(r) return r.fromWeek===r.toWeek?('Week '+r.fromWeek):('Weeks '+r.fromWeek+'\u2013'+r.toWeek); }
  if(ov.from===ov.to) return _fmtDateWd(ov.from);
  const sameMonth=f.getMonth()===t.getMonth();
  return _fmtDate(ov.from)+'\u2013'+(sameMonth?String(t.getDate()):_fmtDate(ov.to));
}
// The day the program picks back up: `to` is INCLUSIVE (D29), so it is to+1.
function overlayBackCopy(prog: any, ov: any){
  if(!ov||!ov.to) return '';
  const next=_addDaysIso(ov.to,1);
  const tw=(prog&&prog.totalWeeks)||0;
  const wk=weekOfDate(prog,next);
  if(tw&&wk!=null&&wk>tw) return 'That runs to the end of your program.';
  return _fmtDateWd(next)+' picks your program back up.';
}

const OVERLAY_TYPE_LABEL: Record<string, string>={substitute:'TRAVEL',injury:'INJURY',reduce:'LESS TIME',suspend:'SUSPENDED'};
// Renders the active-overlay chip on the week screen (only overlays whose range is still live).
function renderOverlayChip(){
  const wrap=document.getElementById('changeActiveWrap'); if(!wrap) return;
  wrap.innerHTML='';
  if(!activeProg||!Array.isArray(activeProg.overlays)) return;
  const tw=activeProg.totalWeeks||0;
  const today=new Date(); today.setHours(0,0,0,0);
  // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
  activeProg.overlays.forEach(ov=>{
    if(!ov||!ov.from) return;
    const to=ov.to?_parseLocalDate(ov.to):null;
    if(to && to<today) return;                      // already reverted → hide
    if(!overlayWeekRange(activeProg, ov, tw)) return;
    // V175 (D29): `to` is the last day covered, so "back to normal" is the day after.
    const backOn=ov.to?(' Back to normal '+_fmtDateWd(_addDaysIso(ov.to,1))+'.'):' Open-ended.';
    let patchLbl='Modified';
    const _isInj=!!(ov.type==='injury'&&ov.patch&&ov.patch.injury);
    const _isBridge=_isInj&&!!ov.patch.injury.bridge;
    if(_isInj){
      const _r=INJURY_REGIONS[ov.patch.injury.region];
      patchLbl=_isBridge
        ?('Return week \u00b7 '+(_r?_r.label:'Injury')+'. One light week, then full send.')
        :((_r?_r.label:'Injury')+(ov.patch.injury.tier==='protect'?' (protected)':' (working around it)'));
    } else if(ov.patch&&ov.patch.equipment){
      // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ bo
      patchLbl=({bodyweight:'Room only',home_basic:'Mini gym',commercial:'Full gym',home_full:'Home Full',crossfit:'CrossFit Box',minimal:'Minimal / Travel'})[ov.patch.equipment]||ov.patch.equipment;
    }
    const _tail=_isBridge?'':(_isInj&&!ov.to?' Tap I\u2019M BACK when it\u2019s ready.':backOn);
    const div=document.createElement('div');
    div.className='change-chip';
    const _backBtn=(_isInj&&!_isBridge)?'<div class="change-chip-act" role="button" data-ovid="'+ov.id+'">I\u2019M BACK</div>':'';
    div.innerHTML='<div class="change-chip-body"><div class="change-chip-ttl">'+(_isBridge?'RETURN WEEK':(OVERLAY_TYPE_LABEL[ov.type]||'CHANGE'))+' \u00b7 '+overlaySpanLabel(activeProg,ov)+'</div><div class="change-chip-sub">'+patchLbl+(_isBridge?'':'.')+_tail+'</div>'+_backBtn+'</div><div class="change-chip-x" role="button" aria-label="Remove change" data-ovid="'+ov.id+'">\u2715</div>';
    // @ts-expect-error TS2339 Property 'onclick' does not exist on type 'Element'.
    div.querySelector('.change-chip-x')!.onclick=()=>removeOverlay(ov.id);
    // @ts-expect-error TS2339 Property 'onclick' does not exist on type 'Element'.
    const _bb=div.querySelector('.change-chip-act'); if(_bb)_bb.onclick=()=>imBackFromInjury(ov.id);
    wrap.appendChild(div);
    // 14-day reassess card — only for live, open-ended injury overlays (bridge weeks
    // have an end date and revert on their own). Sits on This Week until answered:
    // a coach asks the question and waits, he does not mumble a toast on the way past.
    if(_isInj&&!_isBridge&&!ov.to){
      const _since=Date.now()-((ov.lastAsk||ov.created)||Date.now());
      if(_since>=14*86400000){
        const _rl=(INJURY_REGIONS[ov.patch.injury.region]||{}).label||'it';
        const card=document.createElement('div');
        card.className='change-chip reassess-card';
        card.innerHTML='<div class="change-chip-body"><div class="change-chip-ttl">CHECK IN</div>'
          +'<div class="change-chip-sub">Two weeks on the '+_rl.toLowerCase()+' plan. How is it feeling?</div>'
          +'<div class="reassess-acts">'
          +'<button data-ans="better">Better</button>'
          +'<button data-ans="same">Same</button>'
          +'<button data-ans="worse">Worse</button>'
          +'</div></div>';
        // @ts-expect-error TS2339 Property 'onclick' does not exist on type 'Element'.
        card.querySelectorAll('.reassess-acts button').forEach(b=>{ b.onclick=()=>injReassess(ov.id,b.getAttribute('data-ans')); });
        wrap.appendChild(card);
      }
    }
  });
}
function removeOverlay(id: any){
  if(!activeProg||!Array.isArray(activeProg.overlays)) return;
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  activeProg.overlays=activeProg.overlays.filter(o=>o&&o.id!==id);
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].overlays=activeProg.overlays; savePrograms(progs); }
  _setActiveProg(refreshProgram(activeProg));
  renderWeekView();
  showToast('Change removed \u2713');
}

// ── SOMETHING-CHANGED SHEET (overlay authoring — MVP: Substitute / equipment) ──
const _ovDraft: { type: any; from: any; to: any; equipment: any; tab: any; injRegion: any; injTier: any; [k: string]: any }={type:'substitute',from:null,to:null,equipment:'minimal',tab:'travel',injRegion:null,injTier:'workaround'};
// Travel tiers, in the order you'd actually encounter them. Deliberately THREE — these
// cover essentially every work-travel setup, and more options is just more deciding.
// Descriptions are the real UI: you should be able to self-identify in about a second.
const _EQUIP_OPTS=[
  ['bodyweight','Room only',"Nothing but you. A floor, a wall, and a chair."],
  ['home_basic','Mini gym',"Dumbbells, a bench, a treadmill. The standard hotel setup."],
  ['commercial','Full gym',"Racks, barbells, cables. A resort gym or a real gym nearby."]
];
function _isoToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function _addDaysIso(iso: any,n: any){const d=_parseLocalDate(iso)||new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function _fmtDate(iso: any){return iso?new Date(iso+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'Set date';}
function openOverlaySheet(){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  _ovDraft.type='substitute';
  _ovDraft.tab='travel';
  _ovDraft.from=_ovDraft.from||_isoToday();
  _ovDraft.to=_ovDraft.to||_addDaysIso(_ovDraft.from,13);
  _ovDraft.equipment='home_basic';   // hotel gym is the most common work-travel reality
  renderOverlaySheet();
  const o=document.getElementById('changeOverlay');o!.classList.add('open');o!.scrollTop=0;
}
// Injury has its own entry point (the HURT? button beside WEEK N) rather than a tab
// inside the travel sheet. An injury is the one change that needs to be one tap away,
// and a permanently visible button is more discoverable than a tab nobody opens the
// sheet to find. If an injury is already live, this jumps straight to managing it.
function openInjurySheet(){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  const live=_liveInjuryOverlay();
  if(live){ _ovDraft.injRegion=live.patch.injury.region; _ovDraft.injTier=live.patch.injury.tier; }
  else { _ovDraft.injRegion=null; _ovDraft.injTier='workaround'; }
  _ovDraft.type='injury';
  _ovDraft.tab='injury';
  _ovDraft.from=_isoToday();
  renderOverlaySheet();
  const o=document.getElementById('changeOverlay');o!.classList.add('open');o!.scrollTop=0;
}
// The live, non-bridge injury overlay for the active program, or null.
function _liveInjuryOverlay(){
  if(!activeProg||!Array.isArray(activeProg.overlays)) return null;
  const t=new Date(); t.setHours(0,0,0,0);
  const tw=activeProg.totalWeeks||0;
  // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
  return activeProg.overlays.find(ov=>{
    if(!ov||ov.type!=='injury'||!ov.patch||!ov.patch.injury||ov.patch.injury.bridge) return false;
    if(!ov.from) return false;
    const to=ov.to?_parseLocalDate(ov.to):null; if(to&&to<t) return false;
    return !!overlayWeekRange(activeProg,ov,tw);
  })||null;
}
function closeOverlaySheet(){document.getElementById('changeOverlay')!.classList.remove('open');}
function _ovSet(k: any,v: any){_ovDraft[k]=v; if(k==='from'&&_ovDraft.to&&_parseLocalDate(_ovDraft.to)!<_parseLocalDate(v)!) _ovDraft.to=_addDaysIso(v,13); renderOverlaySheet();}
function renderOverlaySheet(){
  const body=document.getElementById('changeBody'); if(!body) return;
  const inj=(_ovDraft.tab||'travel')==='injury';
  // No tab row: each entry point opens its own single-purpose sheet. "Traveling?" in the
  // action row, HURT? beside the week number. Tabs were a leftover from the old
  // catch-all "something changed" hub and only made both flows harder to read.
  const head='<div class="ov-kicker">'+(inj?'HURT?':'TRAVELING?')+'</div>'
    +'<div class="ov-title">'+(inj?'Train around it':'Temporary change')+'</div>'
    +'<div class="ov-intro">'+(inj
      ?'No end date on this one. You tell it when you\u2019re back. Nothing you\u2019ve already trained changes.'
      :'Your program reverts on its own. Nothing you\u2019ve already trained changes.')+'</div>';
  body.innerHTML=head+(inj?_renderInjuryTab():_renderTravelTab());
}
// Per-region, per-tier effect copy for the injury tab — coach voice, sets the
// expectation BEFORE commit so a throttled week reads as protection, not a bug.
const _INJ_EFFECT: Record<string, any>={
  knee:{workaround:'Squats and lunges stay but move to easier variants held at RPE 7. Jumps are out. Running goes easy only, no speed work.',
        protect:'Leg day becomes a posterior chain day. Hip thrusts, glute work, hamstrings. No squatting, no lunging, no jumping. Runs become easy rides or swims so your engine keeps building.'},
  ankle:{workaround:'Calf work is out and single leg work moves to variants that keep the foot planted. Runs get shorter and stay easy.',
        protect:'Nothing stands on that ankle under load. Leg day leans hip and hamstring. Runs become rides or swims, same slots, same clock.'},
  hip:{workaround:'Hinges and lunges back off to RPE 7, swings are out, extra hip mobility comes in. Runs go easy.',
        protect:'Hinges, lunges, and hip thrusts sit out. Leg day leans quads plus mobility work. Runs move to the pool first, the bike second.'},
  lowback:{workaround:'Deadlifts become hip thrusts, rows go single arm and supported, carries are out, core goes spine safe. Cardio stays easy.',
        protect:'Nothing loads the spine. Hinges and rows sit out, legs go machine based, core stays anti extension only. Cardio is easy swimming and walking.'},
  shoulder:{workaround:'Overhead work and dips are out. Pressing stays flat and neutral, held at RPE 7. Face pulls stay, they help. Swims become runs or rides.',
        protect:'All pressing sits out. Push day becomes a pull volume day. Swims become runs or rides. Pull day trains normally.'},
  elbow:{workaround:'Straight bar work moves to neutral grips. Skullcrushers become pushdowns, or close grip pushups where there is no cable. Dips and carries are out. Pressing holds RPE 7.',
        protect:'Direct arm work and pressing sit out. The day leans legs and core. Cardio is untouched.'}
};
const _INJ_SAFETY='If it is sharp, swollen, numb, or no better in two weeks, that is a job for a professional, not an app.';
function _renderTravelTab(){
  // Preview the affected week span + freeze cut for THIS draft, using the real range logic.
  const tw=activeProg.totalWeeks||0;
  const previewOv={type:'substitute',from:_ovDraft.from,to:_ovDraft.to,patch:{equipment:_ovDraft.equipment}};
  const r=overlayWeekRange(activeProg, previewOv, tw);
  const curWk=(typeof calcCurrentWeek==='function')?calcCurrentWeek():1;
  // A "Full gym" trip is not a modification, it is an ANSWER. An overlay is only useful
  // when the athlete has LESS than usual; a real gym is never less, so creating one would
  // splice in weeks identical to what they already had, then announce the non-change with
  // a chip, week markers and a Maintenance pill. Worse, for a dumbbell-based athlete it
  // would "upgrade" them onto barbell lifts mid-block, changing the stimulus AND orphaning
  // their logged history (ia_exw_ keys on exercise NAME, so the old lift's numbers vanish).
  // The option stays visible so nobody has to guess whether their situation is covered,
  // but choosing it answers the question and saves nothing.
  const isNoOp = _ovDraft.equipment==='commercial';
  let effect='';
  if(isNoOp){
    effect='<div class="ov-effect"><div class="ov-effect-ttl">You\u2019re set</div><div class="ov-effect-sub">A real gym means nothing needs to change. Train your program as written.</div></div>';
  } else if(r){
    // V175 (D29): the sheet names DAYS. The old copy promised weeks because the splice
    // took weeks; now that it takes days, "Takes effect Week 1" over a Tuesday trip
    // would be the exact overclaim the athlete reported. One day / N days, the date
    // the program resumes, and a plain statement that the other days are untouched.
    const nd = _ovDraft.to ? _dayCount(_ovDraft.from,_ovDraft.to) : 0;
    const span = !_ovDraft.to ? (_fmtDateWd(_ovDraft.from)+' onward.')
      : (nd===1 ? (_fmtDateWd(_ovDraft.from)+'. One day.')
                : (_fmtDateWd(_ovDraft.from)+' through '+_fmtDateWd(_ovDraft.to)+'. '+_dayCountWord(nd)+'.'));
    const priorFrozen = '';
    const back = (!_ovDraft.to)?'':(overlayBackCopy(activeProg,previewOv)+' Every other day stays as written.');
    // Set the expectation before they commit, so a lighter week later reads as the plan
    // working rather than the app breaking.
    const holds = _ovDraft.equipment==='bodyweight'
      ? 'Lifting holds steady while you\u2019re away. Reps are yours: three sets, stop two short of failure. Run past 25 and it is time for a harder variant. Your running keeps building. That only needs shoes.'
      : 'Lifting holds steady while you\u2019re away. Grab the heaviest load you can control and work in the 8 to 12 range. If that still feels easy, go single arm. Your running keeps building. That only needs shoes.';
    effect='<div class="ov-effect"><div class="ov-effect-ttl">Takes effect '+span+'</div><div class="ov-effect-sub">'+priorFrozen+back+'</div><div class="ov-effect-sub" style="margin-top:6px">'+holds+'</div></div>';
  } else {
    effect='<div class="ov-effect"><div class="ov-effect-sub" style="color:var(--muted)">That range falls outside your program. Pick dates inside it.</div></div>';
  }
  const eqCards=_EQUIP_OPTS.map(([id,name,desc])=>{
    const sel=_ovDraft.equipment===id;
    return '<div class="ov-eq'+(sel?' sel':'')+'" onclick="_ovSet(\'equipment\',\''+id+'\')"><div class="ov-eq-body"><div class="ov-eq-name">'+name+'</div>'+(sel?'<div class="ov-eq-desc">'+desc+'</div>':'')+'</div>'+(sel?'<span class="ov-eq-chk">\u2713</span>':'')+'</div>';
  }).join('');
  return (isNoOp?'':'<div class="ov-dates">'
      +'<label class="ov-date"><span class="ov-date-lbl">FROM</span><span class="ov-date-val">'+_fmtDate(_ovDraft.from)+'</span><input type="date" value="'+(_ovDraft.from||'')+'" onchange="_ovSet(\'from\',this.value)"></label>'
      +'<label class="ov-date"><span class="ov-date-lbl">THROUGH</span><span class="ov-date-val">'+_fmtDate(_ovDraft.to)+'</span><input type="date" min="'+(_ovDraft.from||'')+'" value="'+(_ovDraft.to||'')+'" onchange="_ovSet(\'to\',this.value)"></label>'
    +'</div>')
    +'<div class="ov-eq-lbl">WHAT YOU\u2019LL HAVE</div>'+eqCards
    +effect
    +(isNoOp
      ?'<button class="ov-apply" onclick="closeOverlaySheet()">Got it</button>'
      :'<button class="ov-apply" onclick="applyOverlayDraft()">Apply change</button>');
}
function _renderInjuryTab(){
  const R=_ovDraft.injRegion, T=_ovDraft.injTier||'workaround';
  const regions=Object.keys(INJURY_REGIONS).map(id=>{
    const sel=R===id;
    return '<div class="ov-eq'+(sel?' sel':'')+'" onclick="_ovSet(\'injRegion\',\''+id+'\')"><div class="ov-eq-body"><div class="ov-eq-name">'+INJURY_REGIONS[id].label+'</div></div>'+(sel?'<span class="ov-eq-chk">\u2713</span>':'')+'</div>';
  }).join('')
  +'<div class="ov-eq'+(R==='other'?' sel':'')+'" onclick="_ovSet(\'injRegion\',\'other\')"><div class="ov-eq-body"><div class="ov-eq-name">Neck / something else</div></div>'+(R==='other'?'<span class="ov-eq-chk">\u2713</span>':'')+'</div>';
  // OFF-RAMP: same pattern as the Full-gym travel tier — the option exists so nobody has
  // to guess whether their situation is covered, but choosing it answers the question
  // and saves nothing. A neck or an unlisted problem is not app territory.
  if(R==='other'){
    return '<div class="ov-eq-lbl">WHERE\u2019S THE PROBLEM</div>'+regions
      +'<div class="ov-effect"><div class="ov-effect-ttl">That one\u2019s above my pay grade</div>'
      +'<div class="ov-effect-sub">Get eyes on it from someone qualified. In the meantime train what doesn\u2019t touch it and cut anything that does. When you know what you\u2019re working with, come back and set it up here if it fits one of the regions above.</div></div>'
      +'<button class="ov-apply" onclick="closeOverlaySheet()">Got it</button>';
  }
  const tiers=[
    ['workaround','Work around it','Annoying but trainable. It warms up okay and settles by the next morning.'],
    ['protect','Protect it','Sharp, swollen, or it hurts at rest. We pull the load off it entirely.']
  ].map(([id,name,desc])=>{
    const sel=T===id;
    return '<div class="ov-eq'+(sel?' sel':'')+'" onclick="_ovSet(\'injTier\',\''+id+'\')"><div class="ov-eq-body"><div class="ov-eq-name">'+name+'</div>'+(sel?'<div class="ov-eq-desc">'+desc+'</div>':'')+'</div>'+(sel?'<span class="ov-eq-chk">\u2713</span>':'')+'</div>';
  }).join('');
  let effect='';
  if(R&&_INJ_EFFECT[R]){
    effect='<div class="ov-effect"><div class="ov-effect-ttl">'+(T==='protect'?'Protected':'Working around it')+' \u00b7 '+INJURY_REGIONS[R].label+'</div>'
      +'<div class="ov-effect-sub">'+_INJ_EFFECT[R][T]+'</div>'
      +'<div class="ov-effect-sub" style="margin-top:6px">Every two weeks it asks how the '+INJURY_REGIONS[R].label.toLowerCase().split(' ')[0]+' feels. When you\u2019re ready, tap I\u2019m back and it eases you in over one light week before full prescription.</div>'
      +'<div class="ov-effect-sub" style="margin-top:6px;color:var(--muted)">'+_INJ_SAFETY+'</div></div>';
  }
  return '<div class="ov-eq-lbl">WHERE\u2019S THE PROBLEM</div>'+regions
    +(R?'<div class="ov-eq-lbl" style="margin-top:12px">HOW BAD IS IT</div>'+tiers:'')
    +effect
    +(R?'<div class="ov-dates" style="margin-top:12px"><label class="ov-date"><span class="ov-date-lbl">FROM</span><span class="ov-date-val">'+_fmtDate(_ovDraft.from)+'</span><input type="date" value="'+(_ovDraft.from||'')+'" onchange="_ovSet(\'from\',this.value)"></label></div>':'')
    +(R?'<button class="ov-apply" onclick="applyInjuryDraft()">Apply change</button>':'');
}
function applyInjuryDraft(){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  const R=_ovDraft.injRegion, T=_ovDraft.injTier||'workaround';
  if(!R||!INJURY_REGIONS[R]){showToast('Pick a region');return;}
  const from=_ovDraft.from||_isoToday();
  if(!overlayWeekRange(activeProg,{type:'injury',from,to:null,patch:{}},activeProg.totalWeeks||0)){showToast('That date falls outside your program');return;}
  const ov={id:'ov_'+Date.now(),type:'injury',from,to:null,patch:{injury:{region:R,tier:T}},note:'',created:Date.now()};
  if(!Array.isArray(activeProg.overlays)) activeProg.overlays=[];
  activeProg.overlays.push(ov);
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].overlays=activeProg.overlays; savePrograms(progs); }
  _setActiveProg(refreshProgram(activeProg));
  closeOverlaySheet();
  renderWeekView();
  showToast(T==='protect'?'Protected. Train around it \u2713':'Working around it \u2713');
}
// "I'm back" — removes the injury overlay and auto-creates ONE bridge week: same
// region at the workaround tier (regressed variants, RPE 7 cap), then full
// prescription resumes. Announced, never silent — a lighter week must read as the
// plan working, not the app breaking. Coaches never go 0 to 100 on return.
function imBackFromInjury(id: any){
  if(!activeProg||!Array.isArray(activeProg.overlays)) return;
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  const ov=activeProg.overlays.find(o=>o&&o.id===id);
  if(!ov||!ov.patch||!ov.patch.injury) { removeOverlay(id); return; }
  const region=ov.patch.injury.region;
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  activeProg.overlays=activeProg.overlays.filter(o=>o&&o.id!==id);
  const today=_isoToday();
  activeProg.overlays.push({id:'ov_'+Date.now(),type:'injury',from:today,to:_addDaysIso(today,6),
    patch:{injury:{region,tier:'workaround',bridge:true}},note:'',created:Date.now()});
  // ── HALFSTEP (V142 / D1) — second overlay week, cardio only ──
  // Created only for regions whose overlay suppressed running (both tiers probed):
  // shoulder swims out and elbow never touches cardio, so their runs never stopped
  // and a run re-entry week would be prescribing a ramp back from nothing.
  // @ts-expect-error TS2345 Argument of type '{ injury: { region: any; tier: "workaround"; }; }' is not assignable to parameter of 
  const _pw=injuryPlan({injury:{region,tier:'workaround'}});
  // @ts-expect-error TS2345 Argument of type '{ injury: { region: any; tier: "protect"; }; }' is not assignable to parameter of typ
  const _pp=injuryPlan({injury:{region,tier:'protect'}});
  const _RUNSUP={easy:1,reduce:1,noimpact:1,noimpact_swim:1};
  // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
  const _hadRunSuppression=!!((_pw&&_RUNSUP[_pw.cardioMode])||(_pp&&_RUNSUP[_pp.cardioMode]));
  if(_hadRunSuppression){
    activeProg.overlays.push({id:'ov_'+(Date.now()+1),type:'injury',from:_addDaysIso(today,7),to:_addDaysIso(today,13),
      patch:{injury:{region,tier:'workaround',halfstep:true}},note:'',created:Date.now()+1});
  }
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].overlays=activeProg.overlays; savePrograms(progs); }
  _setActiveProg(refreshProgram(activeProg));
  renderWeekView();
  const lbl=(INJURY_REGIONS[region]||{}).label||'injury';
  if(!_hadRunSuppression){
    popFire('workout',{icon:'shield',kicker:'BACK IN',msg:'Good. One week to prove it.',
      sub:'The '+lbl.toLowerCase()+' work comes back light this week, held at RPE 7. Full send next week.',dismiss:'LET\u2019S GO'});
    return;
  }
  // ── D2b (V142) — the popup only promises what the engine enforces ──
  // Two weeks is the mechanism: bridge (light everywhere) then halfstep (pace back,
  // dose reduced). The pace clock line and the weeks number are only spoken for the
  // pace goal, where the frozen progression makes them true. The exact revised pace
  // lives on the interval card itself, where the progression array is in scope.
  let _sub='This week stays light, held at RPE 7. Next week your quality running returns at pace with reduced volume. Full prescription the week after.';
  try{
    const _cfg=activeProg.cfg||{};
    const _rg=(_cfg.cardioGoals||{}).run||{};
    if(_rg.id==='run_pace_goal'){
      const _map=paceShiftMap(activeProg);
      const _tw=activeProg.totalWeeks||0;
      const _n=_map&&_tw?(_map[_tw]||0):0;
      if(_n>0){
        _sub+=' Your pace targets resume where you left off, not where the calendar says.';
        _sub+=(_cfg.raceDate&&_cfg.eventTargeted!==false)
          ?' Race day does not move. Your interval cards now show the revised realistic pace for it.'
          :' Reaching the original goal pace now needs about '+_n+' more '+(_n===1?'week':'weeks')+' than this block has. The interval cards show the honest target.';
      }
    }
  }catch(e){}
  popFire('workout',{icon:'shield',kicker:'BACK IN',msg:'Good. Two weeks to full send.',
    sub:_sub,dismiss:'LET\u2019S GO'});
}
// 14-day reassess: pain-gated injuries get a check-in card on This Week, not a
// calendar revert — nobody knows the end date on day one, and dumping someone back
// onto full loading because two weeks elapsed is how re-injuries happen.
function injReassess(id: any,ans: any){
  if(!activeProg||!Array.isArray(activeProg.overlays)) return;
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  const ov=activeProg.overlays.find(o=>o&&o.id===id);
  if(!ov) return;
  if(ans==='better'){
    popFire('workout',{icon:'shield',kicker:'CHECK IN',msg:'Good sign.',
      sub:'Ready to bring it back, or give it more time? Coming back starts with one light week.',
      actions:[{label:'I\u2019M BACK',cls:'go',onclick:"popClose();imBackFromInjury('"+id+"')"},
               {label:'MORE TIME',cls:'skip',onclick:"popClose();injSnooze('"+id+"')"}]});
    return;
  }
  if(ans==='worse'){
    ov.lastAsk=Date.now(); _saveOverlays();
    popFire('workout',{icon:'warning',kicker:'CHECK IN',msg:'Two weeks and trending worse.',
      sub:'That is a job for a professional, not an app. Get it looked at. The plan keeps protecting it in the meantime.',dismiss:'UNDERSTOOD'});
    renderWeekView();
    return;
  }
  injSnooze(id);
}
function injSnooze(id: any){
  if(!activeProg||!Array.isArray(activeProg.overlays)) return;
  // @ts-expect-error TS7006 Parameter 'o' implicitly has an 'any' type.
  const ov=activeProg.overlays.find(o=>o&&o.id===id);
  if(!ov) return;
  ov.lastAsk=Date.now(); _saveOverlays();
  renderWeekView();
  showToast('Staying on the plan. It will ask again in two weeks.');
}
function _saveOverlays(){
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].overlays=activeProg.overlays; savePrograms(progs); }
}
function applyOverlayDraft(){
  if(!activeProg){showToast('No active program. Tap Set Active or build a new one.');return;}
  // Guard: a full-gym trip creates nothing (see renderOverlaySheet). Reachable only if the
  // button is somehow triggered for that tier, so just dismiss rather than save a no-op.
  if(_ovDraft.equipment==='commercial'){ closeOverlaySheet(); return; }
  const from=_ovDraft.from, to=_ovDraft.to;
  if(!from||!to){showToast('Pick both dates');return;}
  if(_parseLocalDate(to)!<_parseLocalDate(from)!){showToast('“Through” can’t be before “From”');return;}
  const tw=activeProg.totalWeeks||0;
  if(!overlayWeekRange(activeProg,{type:'substitute',from,to,patch:{equipment:_ovDraft.equipment}},tw)){showToast('That range is outside your program');return;}
  const ov={id:'ov_'+Date.now(),type:'substitute',from,to,patch:{equipment:_ovDraft.equipment},note:'',created:Date.now()};
  if(!Array.isArray(activeProg.overlays)) activeProg.overlays=[];
  activeProg.overlays.push(ov);
  const progs=getPrograms(); const i=progs.findIndex(p=>p.id===activeProg.id);
  if(i>=0){ progs[i].overlays=activeProg.overlays; savePrograms(progs); }
  _setActiveProg(refreshProgram(activeProg));
  closeOverlaySheet();
  renderWeekView();
  showToast('Change applied \u2713');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _isoToday, _liveInjuryOverlay, applyOverlays, dayIsTravel, dayOverlayInfo, overlayWeekRange, paceShiftMap,
  renderOverlayChip, travelTagHTML,
};
