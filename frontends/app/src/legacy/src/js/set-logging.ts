import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { esc, getDayHist, getExWeightsFor, getLogs, getPrograms, readSetDraft, writeSetDraft } from './storage.ts';
import {
  _setStaleWarnShown, _setStaleWarnSrc, _staleWarnShown, _staleWarnSrc, activeProg, activeProgId, currentDayKey,
  currentWeek,
} from './rest-day-shell.ts';
import { exStoreKey, foldExAliasKeys } from '../../../../../../core/src/engine/exercise-library.ts';
import { isRepExercise, isTimeExercise, isTrackableWeight } from '../../../../../../core/src/engine/exercise-kinds.ts';
import { _clkMS } from '../../../../../../core/src/engine/clock-format.ts';
import { _auxFamily, _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { _stripLeadingSets, parseRx, rxSuffix } from './week-view-sections.ts';
import { entryDay, getExWeights, isKBExercise } from './log-entries.ts';
import { saveExWeight } from './day-detail.ts';
import { _editDay, swapOriginOf } from './swap-sheet.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// Human recency for the reuse pill — never program-week numbers.
// V168 D6 — its own constant. SEED_WINDOW_DAYS happens to share the number today;
// coupling them would mean retuning the run seed silently retunes lift warnings.
const STALE_LOAD_DAYS=21;
// ONE days computation, ONE bucket table. recencyLabel renders two strings off it:
// 'ago' (the pill sub-label, unchanged) and 'age' (the D7 sentence). Split into two
// functions they would drift, and the gate asserts they cannot disagree on a bucket.
function recencyBucket(ts: any){
  if(!ts) return {i:-1,days:null};
  const days=Math.floor((Date.now()-ts)/86400000);
  let i;
  if(days<=0) i=0;
  else if(days===1) i=1;
  else if(days<7) i=2;
  else if(days<14) i=3;
  else if(days<28) i=4;
  else if(days<60) i=5;
  else i=6;
  return {i:i,days:days};
}
function recencyLabel(ts: any,form?: any){
  const b=recencyBucket(ts), d=b.days;
  if(b.i<0) return form==='age'?'from an earlier block':'last time';
  if(form==='age'){
    if(b.i===0) return 'from earlier today';
    if(b.i===1) return 'from yesterday';
    if(b.i===2) return 'about '+d+' days old';
    if(b.i===3) return 'about a week old';
    if(b.i===4) return 'about '+Math.floor(d!/7)+' weeks old';
    if(b.i===5) return 'about a month old';
    return 'about '+Math.floor(d!/30)+' months old';
  }
  if(b.i===0) return 'earlier today';
  if(b.i===1) return 'yesterday';
  if(b.i===2) return d+' days ago';
  if(b.i===3) return 'last week';
  if(b.i===4) return Math.floor(d!/7)+' weeks ago';
  if(b.i===5) return 'last month';
  return Math.floor(d!/30)+' months ago';
}
function isStaleTs(ts: any){
  const b=recencyBucket(ts);
  return b.days!=null && b.days>STALE_LOAD_DAYS;
}
// V168 D3/D4/D5 — cross-program loaded-lift fallback.
// D4: callers fire this ONLY when the active program has no qualifying entry for the
//     key, so same-program always wins even when it is older.
// D3: most recent qualifying entry by ts across every OTHER program, archived included.
//     Not most-recent-program — that is the run seed's rule, and it only exists there
//     because the seed averages >=3 runs.
// D5: aliases are folded on a CLONE. foldExAliasKeys mutates, and the log screen must
//     never become a second writer into a foreign program's store.
function crossProgLastEntry(exKey: any){
  let best: any=null,bestName='';
  getPrograms().forEach(function(p: any){
    if(!p||!p.id||p.id===activeProgId) return;
    let store=null;
    try{ store=JSON.parse(JSON.stringify(getExWeightsFor(p.id)||{})); }catch(e){ return; }
    if(!store) return;
    try{ foldExAliasKeys(store); }catch(e){}
    const row=store[exKey];
    if(!row) return;
    (row.entries||[]).forEach(function(e: any){
      if(!(+e.weight>0)) return;
      if(!best||(+e.ts||0)>(+best.ts||0)){ best=e; bestName=p.name||''; }
    });
  });
  return best?{entry:best,progName:bestName}:null;
}
// Same predicate buildExItem uses to decide a row is loggable — shared so the
// This Week completion counter (sessionLogProgress) stays in sync.
function exLoggable(name: any,detail: any){
  if(parseRx(detail,name)) return true;
  if(isKBExercise(name)) return true;
  if(isTrackableWeight(name)) return true;
  return false;
}
// ── AUTO-SAVE (V131) ─────────────────────────────────────────────────────────
// Raw cell contents, '' for untouched. Deliberately NOT setRepVals/setWeightVals —
// those resolve an empty cell to its placeholder, which is exactly the inference a
// draft must not make.
function rawSetVals(prefix: any,exKey: any){
  const out=[];
  for(let s=0;;s++){
    const el=document.getElementById(prefix+exKey+'_'+s);
    if(!el) break;
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    out.push(el.value==null?'':String(el.value));
  }
  return out;
}
function exKeyFromRow(id: any){ return String(id).replace(/^exset_/,'').replace(/_\d+$/,''); }
// One tap, two meanings. BEFORE the exercise is logged an edit is a draft: there is
// no confirmed weight yet, so committing would have to guess one. AFTER it is logged
// the weight is already real, nothing is left to guess, and the edit commits straight
// through — a tick sitting over a number that is not in the record is the single
// state this feature must never be able to produce.
function autoSaveSets(exKey: any){
  if(!exKey) return;
  const card=document.getElementById('excard_'+exKey);
  if(card&&card.classList.contains('logged')){ commitSetsLive(exKey); return; }
  const wEl=document.getElementById('exw_'+exKey);
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  writeSetDraft(exKey, rawSetVals('exset_',exKey), rawSetVals('exsetw_',exKey), wEl?wEl.value:'');
}
// Re-log in place, silently. Reuses saveExWeight rather than a parallel writer —
// two paths into ia_exw_ that agree today are two paths free to disagree later.
// setsReps is carried from the existing entry so a quiet re-save cannot blank the
// prescription string the record was written with.
function commitSetsLive(exKey: any){
  const rec=getExWeights()[exKey];
  if(!rec||!rec.name) return;
  const prev=(rec.entries||[]).filter(function(e: any){return +e.week===+currentWeek&&entryDay(e)===currentDayKey;})[0];
  saveExWeight(exKey, rec.name, (prev&&prev.setsReps)||'', true);
}
function stepSet(id: any,step: any){
  const el=document.getElementById(id); if(!el) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  let v=parseInt((el.value!==''?el.value:el.placeholder)||'0',10); if(isNaN(v))v=0;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  v+=step; if(v<0)v=0; el.value=v; el.classList.remove('bw-blank'); setDelta(id);
  autoSaveSets(exKeyFromRow(id));
}
function setDelta(id: any){
  const el=document.getElementById(id), d=document.getElementById(id+'_d');
  // Rep edits move the collapsed summary too — an unloaded movement reports divergence
  // through this path and no other, so the refresh must fire on EVERY branch below.
  const key=String(id).replace(/^exset_/,'').replace(/_\d+$/,'');
  if(!d){ refreshSetSummary(key); return; }
  const rxa=el!.getAttribute('data-rx');
  if(rxa===null||rxa===''){ d.className='exset-delta'; d.textContent=''; refreshSetSummary(key); return; }
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const rx=+rxa; let v=parseInt(el!.value||'0',10); if(isNaN(v))v=0;
  const diff=v-rx;
  if(diff===0){ d.className='exset-delta'; d.textContent=''; }
  else if(diff<0){ d.className='exset-delta down'; d.textContent=String(diff); }
  else{ d.className='exset-delta up'; d.textContent='+'+diff; }
  refreshSetSummary(key);
}
function reuseWeight(exKey: any,val: any){
  const el=document.getElementById('exw_'+exKey); if(!el) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  el.value=val;
  cascadeSetWeights(exKey);
  autoSaveSets(exKey);
}
// ── COLLAPSED SET BAR (V105) ─────────────────────────────────────────────────
// Set rows fold behind a one-line summary. The collapsed state keeps the Load field
// and reuse pill, so a lift done as prescribed at one weight never needs expanding.
// Expanding exists for one reason: the sets diverged (drop set, ascending, back-off).
//
// Stored weights are ALWAYS lbs. Everything on screen is display units. These two
// helpers are the only border between them — do not convert anywhere else.
// Prescription per card, cached at render so the live summary can restate
// "4 × 8" when a ladder flattens back out. Render-scoped, never persisted.
const _rxCache: Record<string, any>={};
function toDispW(lbs: any){
  if(lbs===''||lbs==null) return '';
  // @ts-expect-error TS2339 Property '_unitLabel' does not exist on type 'Window & typeof globalThis'.
  return (window._unitLabel==='kg') ? Math.round((+lbs)*0.453592*2)/2 : +lbs;
}
function toStoreW(disp: any){
  if(disp===''||disp==null) return 0;
  // @ts-expect-error TS2339 Property '_unitLabel' does not exist on type 'Window & typeof globalThis'.
  return (window._unitLabel==='kg') ? Math.round((+disp)*2.20462) : +disp;
}
// Varied = the ladder is not flat. One value, or none, is not varied.
function setsVaried(arr: any){
  if(!arr||arr.length<2) return false;
  return arr.some(function(x: any){return +x!==+arr[0];});
}
// Flat, but not where it was aimed. `setsVaried` asks "did the ladder tilt"; this asks
// "did the flat ladder land somewhere else". The bar was only ever asking the first, so
// three flat sets of 7 against a 3×10 prescription read "3 × 10 · as prescribed" sitting
// directly on top of a logged 7/7/7.
//
// Open prescriptions count. "3 sets to max" logged flat at 12 IS 3 × 12 — the
// prescription is what you were told to do, the bar is what you did.
//
// The v>0 guard is load-bearing, not defensive: an untouched open row has placeholder
// "max", which parses to 0, so every unlogged open card arrives here as [0,0,0]. Without
// the guard it would report "3 × 0".
function flatDiverged(rx: any,arr: any){
  if(!rx||!arr||!arr.length) return false;
  if(setsVaried(arr)) return false;
  const v=+arr[0];
  if(!(v>0)) return false;
  if(arr.length!==rx.sets) return true;
  if(rx.open) return true;
  if(rx.targets) return rx.targets.some(function(t: any){return t==null||+t!==v;});
  return v!==+rx.target;
}
// Collapsed headline. A flat or unlogged exercise states the prescription; a varied one
// states the ACTUAL ladder.
//
// Precedence is weights, then reps. Weight divergence is the progression-relevant fact,
// so it wins when both vary. But an unloaded movement has no weight ladder at all — a
// V105 hole: 2×45 sec logged as 45 and 75 read back as "2 × 45 sec, as prescribed",
// because divergence was keyed on `setsW` only. It is now keyed on whichever dimension
// actually moved, so bodyweight and timed work get the same honesty as a drop set.
function setsSummary(rx: any,wkW: any,wkR: any){
  if(!rx) return '';
  const suf=rxSuffix(rx);
  // V150 (Mario's ruling): the SETS line speaks REPS, period. Weight already has three
  // surfaces on this card — the per-set cells, the Top set footer, and the collapsed
  // Load field's own “Top set” relabel — and a fourth one here sat directly on top of
  // the per-set column repeating it (255 / 245 / 245 / … over 255/245/245/245) while
  // evicting the ONLY summary surface reps have. Three-digit weight ladders also
  // truncate at 4 sets; rep ladders always fit. wkW stays in the signature because the
  // VARIED badge and both Top-set relabels still key on it at the call sites — it is
  // simply no longer this line's story. A missed rep under a weight ladder (3/3/2/3
  // beneath 255/245…) is now visible collapsed instead of buried until expand.
  if(setsVaried(wkR)) return wkR.join(' / ')+(suf?' '+suf:'');
  // Flat but off-target — state what was done, not what was asked for. Covers the plain
  // case (3×10 done as 7), the flattened ladder, and the open prescription.
  if(flatDiverged(rx,wkR)) return wkR.length+' \u00d7 '+wkR[0]+(suf?' '+suf:'');
  if(rx.open) return rx.sets+' \u00d7 max';
  // A ladder PRESCRIPTION is itself varied — stating it as "5 × 10" would be a lie
  // before a single rep is logged.
  if(rx.targets) return rx.targets.map(function(t: any){return t==null?'max':t;}).join(' / ')+(suf?' '+suf:'');
  return rx.sets+' \u00d7 '+rx.target+(suf?' '+suf:'');
}
// Reads flatDiverged rather than re-deriving "is this on plan", which is the whole point:
// the headline one line above now states the real number, and "as prescribed" underneath
// it was a straight contradiction.
function setsSubLabel(rx: any,wkW: any,wkR: any,logged: any){
  // V150: keys on reps only, matching the headline it annotates. A weight ladder under
  // flat on-plan reps now reads “4 × 3 · logged” — the weight story lives in the
  // VARIED badge and Top set surfaces, not here.
  if(setsVaried(wkR)) return '';
  if(logged) return 'logged';
  if(flatDiverged(rx,wkR)) return 'not logged';
  if(rx&&rx.open) return 'nothing logged';
  return 'as prescribed';
}
function toggleSets(exKey: any){
  const box=document.getElementById('exlog_'+exKey); if(!box) return;
  box.classList.toggle('exset-open');
  if(box.classList.contains('exset-open')) markTopSet(exKey);
}
// Every per-set load cell, in display units. An untouched cell falls back to its
// placeholder — the collapsed Load — so an unexpanded ladder still reads as uniform.
function setWeightVals(exKey: any){
  const out=[];
  for(let s=0;;s++){
    const el=document.getElementById('exsetw_'+exKey+'_'+s);
    if(!el) break;
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    const raw=(el.value!==''?el.value:el.placeholder);
    const v=parseFloat(raw);
    out.push(isNaN(v)?0:v);
  }
  return out;
}
// Outline + TOP tag on the heaviest set, but ONLY when the ladder is varied.
// On a flat ladder every set IS the top set, so highlighting one is noise that reads
// as "set 1 is special" — the tie-break-to-first rule made that the DEFAULT state and
// it was the first thing to confuse a real user. Visibility now matches the Varied
// chip exactly: same underlying fact, so they appear and disappear together.
// When varied, EVERY row at max is tagged — badging one of two equal top sets is the
// same confusion in a smaller costume.
function markTopSet(exKey: any){
  const a=setWeightVals(exKey);
  const foot=document.getElementById('extop_'+exKey);
  const lbl=document.getElementById('extoplbl_'+exKey);
  if(!a.length){ if(foot) foot.textContent='\u2014'; return; }
  const max=Math.max.apply(null,a), vary=setsVaried(a);
  for(let s=0;s<a.length;s++){
    const r=document.getElementById('exsetrow_'+exKey+'_'+s);
    if(r) r.classList.toggle('exset-top', vary && a[s]===max);
  }
  const wunit=document.querySelector('#exlog_'+exKey+' .ex-wunit');
  if(lbl) lbl.textContent=vary?'Top set':'Every set';
  if(foot) foot.textContent=max>0?(max+' '+(wunit?wunit.textContent:'')):'\u2014';
  refreshSetSummary(exKey);
}
// Collapsed Load cascades into every set the user has not individually overridden.
// Overridden cells keep their value — cascade must never clobber a typed drop set.
function cascadeSetWeights(exKey: any){
  const w=document.getElementById('exw_'+exKey); if(!w) return;
  // '' not '0'. The Load field no longer pre-fills last session's number (V131), so
  // an untouched field is genuinely empty and cascading a 0 into every set cell would
  // reintroduce the anchor this change exists to remove.
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const v=(w.value!==''?w.value:w.placeholder)||'';
  for(let s=0;;s++){
    const el=document.getElementById('exsetw_'+exKey+'_'+s);
    if(!el) break;
    // @ts-expect-error TS2339 Property 'placeholder' does not exist on type 'HTMLElement'.
    if(el.classList.contains('exw-inherit')) el.placeholder=v;
  }
  markTopSet(exKey);
}
function onSetWeight(exKey: any,s: any){
  const el=document.getElementById('exsetw_'+exKey+'_'+s); if(!el) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  el.classList.toggle('exw-inherit',el.value==='');
  markTopSet(exKey);
}
function fillAllSetWeights(exKey: any,val: any){
  for(let s=0;;s++){
    const el=document.getElementById('exsetw_'+exKey+'_'+s);
    if(!el) break;
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    el.value=val; el.classList.remove('exw-inherit');
  }
  markTopSet(exKey);
  autoSaveSets(exKey);
}
// Every per-set rep/time cell. Blank falls back to its prescribed placeholder, matching
// what saveExWeight will actually persist for an untouched set.
function setRepVals(exKey: any){
  const out=[];
  for(let s=0;;s++){
    const el=document.getElementById('exset_'+exKey+'_'+s);
    if(!el) break;
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    const raw=(el.value!==''?el.value:el.placeholder);
    const v=parseInt(raw||'0',10);
    out.push(isNaN(v)?0:v);
  }
  return out;
}
// Keep the collapsed headline honest while the card is open, so folding it back
// never hides a ladder the user just typed. Reads BOTH dimensions — an unloaded
// movement has no weight ladder and would otherwise never report divergence.
function refreshSetSummary(exKey: any){
  const sum=document.getElementById('exsum_'+exKey); if(!sum) return;
  const a=setWeightVals(exKey), r=setRepVals(exKey);
  const vary=document.getElementById('exvary_'+exKey);
  const sub=document.getElementById('exsumsub_'+exKey);
  const rx=_rxCache[exKey]||null;
  // The `logged` half of the line is the card's own class — the same fact buildExItem
  // used to stamp it, and the only live signal available here.
  const _card=document.getElementById('excard_'+exKey);
  const _logged=!!(_card&&_card.classList.contains('logged'));
  // UNCONDITIONAL, both halves, every pass. The old shape wrote the headline only inside
  // the varied branch and the else did nothing but hide the chip, so stepping into a
  // ladder and back out again left the headline frozen on the last varied string it ever
  // saw. A conditional write with no else branch is a latch; the boring branch is what
  // releases it.
  sum.textContent=setsSummary(rx,a,r);
  if(sub) sub.textContent=setsSubLabel(rx,a,r,_logged);
  if(vary) vary.style.display=(setsVaried(a)||setsVaried(r))?'':'none';
  // Only WEIGHT divergence renames the collapsed field — rep divergence says nothing
  // about which load feeds progression.
  const lbl=document.querySelector('#exlog_'+exKey+' .ex-weight-lbl');
  if(lbl) lbl.textContent=setsVaried(a)?'Top set':'Load';
}
// ── EX CONTROL FLAGS (V162, rulings D0/R2/D3/D5) ─────────────────────────────
// Single source for which controls an exercise row carries — consumed by the render
// AND the gate harness, so drift between them is a contradiction, not a latent bug.
//   canSkip: everything EXCEPT note-items, the icon-prefixed coaching copy (D5).
//            v0.246.0 D248 (P-MAINSKIP, amends D0): the top lift — item 0 of a /^main/i
//            section — takes the minus too. Swap was its only exit, and 44 lattice mains
//            had nothing to swap to. Superset members carry their own minus (R2).
//   canSwap: real lift patterns, PLUS the V162 aux families. Notes never.
function exControlFlags(sec: any,itemIdx: any,it: any){
  const name=(it&&it.name)||'';
  const isNote=/^\s*<svg/i.test(name);
  const inSS=!!(sec&&(sec.superset||sec.type==='superset'));
  const isMainSlot=!inSS&&itemIdx===0&&/^main/i.test((sec&&sec.label)||'');
  const canSwap=!isNote&&(!!_pattern(name)||!!_auxFamily(name));
  const canSkip=!isNote;
  return {isNote:isNote,inSS:inSS,isMainSlot:isMainSlot,canSwap:canSwap,canSkip:canSkip};
}
// v0.246.0 D250 (P-WILDEDIT): `src` is 'wild' for a Wildcard card, whose controls address the Wildcard's own day
// (_editDay), never a program day. Unset, the card is the session sheet's, and draws exactly as before.
function buildExItem(i: any,secIdx: any,itemIdx: any,_ssRounds?: any,src?: any){
  // V190 (D39): inside a block that draws a round count, the row states reps and effort
  // only — the count is on the header. `_dispDetail` is the RENDERED string; i.detail is
  // left alone so parseRx and every one of its five callers see what they always saw.
  const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||'').replace(/^\d+(\s*[–-]\s*\d+)?$/,'$& reps'):(i.detail||'');   // V220 (D176) a bare count reads as reps
  const exKey=exStoreKey(i.name);
  // A skipped item renders as a struck-through stub instead of a card. It is NOT removed
  // from the day: keeping it visible is what distinguishes "the engine never programmed
  // this" from "I bailed on this", and the stub carries the only way to put it back.
  const _srcArg=(src==='wild')?",'wild'":'';
  if(i._skipped){
    return '<div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span>'
      +'<span class="ex-skipped-name">'+esc(i.name||'')+'</span>'
      +'<button class="ex-skipped-undo" onclick="unskipExercise(\''+(i.name||'').replace(/'/g,"\\'")+'\''+_srcArg+')">Put it back</button></div>';
  }
  const stored=getExWeights();
  const entries=(stored[exKey]&&stored[exKey].entries)||[];
  const lastEntry=entries.slice(-1)[0];
  // The pill is now the ONLY route to last session's load, so it has to read the last
  // entry that actually HAS one. Keyed on the last entry outright, a single weightless
  // log — which V131 makes possible, since the Load field no longer supplies a number
  // on its own — blanked the pill and stranded the athlete's own history.
  const lastWEntry=entries.filter(function(e: any){return +e.weight>0;}).slice(-1)[0]||null;
  const lastW=(lastWEntry&&lastWEntry.weight)||'';
  const weekLabel=lastWEntry?'W'+lastWEntry.week:'';
  // V168 D4 — the fallback is consulted only when this program has nothing.
  // lastW stays same-program on purpose: the KB size chips PRE-SELECT a bell, which is
  // closer to a prefill than a pill, and V131 forbids inferring a load the athlete did
  // not ask for. Only the reuse pill reads across a program boundary.
  const crossSrc=lastWEntry?null:crossProgLastEntry(exKey);
  const effEntry=lastWEntry||(crossSrc&&crossSrc.entry)||null;
  const effW=(effEntry&&effEntry.weight)||'';
  // This week's own entry, if it exists. Drives restore-on-reopen: the collapsed bar
  // states what was actually logged, and expanding shows those numbers rather than
  // resetting to the prescription. Distinct from lastEntry, which may be a prior week.
  // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
  const thisDayEntry=entries.filter(e=>+e.week===+currentWeek&&entryDay(e)===currentDayKey)[0]||null;
  // Derived from thisDayEntry, NOT re-tested against entries. These were two separate
  // predicates over the same fact — one strict-equal on week, one numeric — so a
  // string-typed week could set the sub-label to "logged" on a card carrying no
  // `.logged` class. refreshSetSummary now READS that class to decide the same thing,
  // which makes any drift between them a live contradiction rather than a latent one.
  const loggedThisDay=!!thisDayEntry;
  // @ts-expect-error TS2339 Property '_unitLabel' does not exist on type 'Window & typeof globalThis'.
  const unit=window._unitLabel||'lbs';
  const step=unit==='kg'?2.5:5;
  const isTime=isTimeExercise(i.name||'');
  const isKB=isKBExercise(i.name||'');
  const isOpenEnded=/\bmax\b|amrap|failure|amrap|^\d+\s*sets?\s*—/.test((i.detail||'').toLowerCase());
  const isRep=isRepExercise(i.name||'')&&isOpenEnded;
  const isWeight=!isKB&&isTrackableWeight(i.name||'');
  const showInput=isTime||isWeight||isRep||isKB;
  const inputLabel=isTime?'sec':isRep?'reps':unit;   // v0.249.0 (D257): a kettlebell weighs in the program's unit
  const inputStep=isTime?5:isRep?1:step;
  const lastDisplay=lastW?lastW+' '+inputLabel+' '+weekLabel:'';
  const safeN=(i.name||'').replace(/'/g,"\\'");
  const safeD=(i.detail||'').replace(/'/g,"\\'");
  // Swap control. Deliberately its own button rather than tapping the name: the card
  // already owns set rows and a load input, so a tap target spanning the name would
  // fight the logging controls. Offered only for real lift patterns — holds, carries
  // and core return a null pattern and have nothing to swap to.
  // V162: flags come from exControlFlags — one source for render and harness. MAIN
  // protection narrowed to the top lift only (item 0 of a Main section, ruling D0);
  // Primer lost protection; superset members carry their own minus (drop-and-continue,
  // see the superset render branch); aux families swap via their sidecar universe (D3);
  // note-items get neither control (D5).
  const _eday=_editDay(src);
  const _sec=(_eday&&(_eday.sections||[])[secIdx])||null;
  const _cf=exControlFlags(_sec,itemIdx,i);
  const _canSwap=secIdx!=null&&itemIdx!=null&&!!activeProg&&_cf.canSwap;
  const _swappedFrom=_canSwap?swapOriginOf(i.name||'',src):null;
  const _canSkip=secIdx!=null&&!!activeProg&&_cf.canSkip&&!i._addedByUser;
  let html='<div class="exercise-item'+(loggedThisDay?' logged':'')+'" id="excard_'+exKey+'">'
    +'<div class="ex-namerow"><span class="ex-name">'+(i.name||'')+'</span>'
    +(_canSwap?'<button type="button" class="ex-swapbtn" aria-label="Swap this exercise" onclick="openSwapSheet('+secIdx+','+itemIdx+_srcArg+')">'+asyIcon('swap',16)+'</button>':'')
    +(_canSkip?'<button type="button" class="ex-skipbtn" aria-label="Skip this exercise" onclick="skipExercise(\''+(i.name||'').replace(/'/g,"\\'")+'\''+_srcArg+')">'+asyIcon('minus',16)+'</button>':'')
    +'<span class="ex-badge" id="exbadge_'+exKey+'">'+(loggedThisDay?'\u2713':'')+'</span></div>'
    +(_dispDetail?'<div class="ex-detail">'+_dispDetail+'</div>':'')
    +(i._addedByUser?'<div class="ex-swapchip"><span class="ex-swapchip-lbl">You added this</span> \u00b7 not in the plan'
      +'<button type="button" class="ex-swapundo" onclick="removeAddedExercise(\''+(i.name||'').replace(/'/g,"\\'")+'\')">remove</button></div>':'')
    +(_swappedFrom?'<div class="ex-swapchip"><span class="ex-swapchip-lbl">Swapped in</span> for '+_swappedFrom
      +'<button type="button" class="ex-swapundo" onclick="undoSwap(\''+_swappedFrom.replace(/'/g,"\\'")+'\''+_srcArg+')">put it back</button></div>':'');
  const rx=parseRx(i.detail||'',i.name||'');
  const loaded=isKB||isWeight;
  if(rx||loaded){
    html+='<div class="ex-log" id="exlog_'+exKey+'">';
    const dispLast=effW!==''&&effW!=null?(unit==='kg'?Math.round((+effW)*0.453592*2)/2:+effW):'';
    const wunit=unit;   // v0.249.0 (D257): a kettlebell in the program's unit too, never "lb"
    // Restore what was logged THIS week, in display units. Stored values are always lbs.
    let wkW=(thisDayEntry&&thisDayEntry.setsW&&thisDayEntry.setsW.length)?thisDayEntry.setsW.map(toDispW):[];
    let wkR=(thisDayEntry&&thisDayEntry.setsDone&&thisDayEntry.setsDone.length)?thisDayEntry.setsDone.slice():[];
    // DRAFT RESTORE (V131). Only when the day has no logged entry — once ia_exw_ holds
    // a record it IS the record, and a draft shadowing it would be the second source of
    // truth that produced the V112 collapsed-bar latch.
    const _draft=thisDayEntry?null:readSetDraft(exKey);
    let _draftLoad='';
    if(_draft){
      const _nz=function(x: any){return x!=null&&x!=='';};
      const _dR=_draft.r||[], _dW=_draft.w||[];
      if(_dR.some(_nz)) wkR=_dR.map(function(x: any){return _nz(x)?x:null;});
      if(_dW.some(_nz)) wkW=_dW.map(function(x: any){return _nz(x)?x:null;});
      _draftLoad=_draft.L||'';
    }
    // V148 (Mario's call): a weight logged TODAY stays visible in the Load box, solid.
    // Reps and per-set cells already rehydrate from thisDayEntry — the collapsed Load
    // field was the only control that forgot, which read as data loss. This is NOT the
    // banned pre-fill: V131 bars LAST session's number (a prescription anchor); today's
    // own record is what already happened. The reuse pill stays the only path to
    // prior-session weights, and an unlogged day still renders the box empty.
    if(!_draftLoad && thisDayEntry && +thisDayEntry.weight>0) _draftLoad=String(toDispW(thisDayEntry.weight));
    // Two shapes, on purpose. The ROWS want nulls, so an untouched rung falls back to
    // its prescribed target. The collapsed HEADLINE wants those rungs resolved, because
    // it states the whole set, not which cells happen to be filled — feeding it nulls
    // would read +null as 0 and report a flat ladder as Varied.
    const _headR=wkR.map(function(x: any,ix: any){
      if(x!=null&&x!=='') return x;
      if(!rx) return 0;
      const t=(rx.targets&&rx.targets[ix]!==undefined)?rx.targets[ix]:rx.target;
      return t==null?0:t;
    });
    const _headW=wkW.map(function(x: any){return (x!=null&&x!=='')?x:0;});
    if(rx){
      const suf=rxSuffix(rx);
      _rxCache[exKey]=rx;
      html+='<button type="button" class="exset-head" onclick="toggleSets(\''+exKey+'\')">'
        +'<span class="exset-head-lbl">Sets</span>'
        +'<span class="exset-head-val" id="exsum_'+exKey+'">'+setsSummary(rx,_headW,_headR)+'</span>'
        +'<span class="exset-head-sub" id="exsumsub_'+exKey+'">'+setsSubLabel(rx,_headW,_headR,!!thisDayEntry)+'</span>'
        +'<span class="exset-head-sp"></span>'
        +'<span class="exset-head-vary" id="exvary_'+exKey+'"'+((setsVaried(_headW)||setsVaried(_headR))?'':' style="display:none"')+'>Varied</span>'
        +'<span class="exset-caret">'+asyIcon('chevronDown',20)+'</span>'
        +'</button>';
      html+='<div class="exset-rows" id="exrows_'+exKey+'">';
      for(let s=0;s<rx.sets;s++){
        const rowId='exset_'+exKey+'_'+s;
        // A ladder prescription carries its own target per rung; a null rung is open.
        const tgt=(rx.targets&&rx.targets[s]!==undefined)?rx.targets[s]:rx.target;
        const openSet=rx.open||tgt==null;
        const val=wkR.length&&wkR[s]!=null?wkR[s]:(openSet?'':tgt);
        const rxAttr=openSet?'':(' data-rx="'+tgt+'"');
        const cls=(openSet&&val==='')?'bw-blank':'';
        const ph=openSet?'max':'';
        // Delta rendered HERE, not only by setDelta. setDelta fires on input, so on a
        // reopened card only the rows touched since the last render carried a badge —
        // two identical restored rows could show different deltas.
        const _dv=(!openSet&&val!==''&&val!=null&&tgt!=null)?(+val)-(+tgt):0;
        const _dCls=_dv===0?'exset-delta':('exset-delta '+(_dv<0?'down':'up'));
        const _dTxt=_dv===0?'':(_dv<0?String(_dv):'+'+_dv);
        html+='<div class="exset-row" id="exsetrow_'+exKey+'_'+s+'"><span class="exset-num">'+(s+1)+'</span>'
          +'<div class="exset-ctl">'
          +'<button type="button" class="exset-btn" onclick="stepSet(\''+rowId+'\','+(-(rx.step||1))+')">\u2212</button>'
          +'<span class="exset-val"><input id="'+rowId+'" class="'+cls+'" inputmode="numeric" value="'+val+'" placeholder="'+ph+'"'+rxAttr+' oninput="setDelta(\''+rowId+'\')" onblur="autoSaveSets(\''+exKey+'\')">'
          +(suf?'<span class="exset-suf">'+suf+'</span>':'')
          +'<span class="'+_dCls+'" id="'+rowId+'_d">'+_dTxt+'</span></span>'
          +'<button type="button" class="exset-btn" onclick="stepSet(\''+rowId+'\','+(rx.step||1)+')">+</button>'
          +'</div>';
        // Per-set load cell — only on movements that carry load. Bodyweight and timed
        // work render the row without it rather than showing an empty box.
        if(loaded){
          const setV=wkW.length&&wkW[s]!=null?wkW[s]:'';
          // NO PLACEHOLDER (V131, Mario's call). This used to pre-print last session's
          // load in every cell. The app prescribes RPE — "stop 2 reps short of failure"
          // is an instruction to read today's body — and a number already sitting in the
          // box is an instruction to match last Tuesday. The number wins, because it is
          // the one already there. The reuse pill still offers it in one tap; the
          // difference is that the athlete has to ask for it.
          html+='<div class="exset-w"><span class="exset-toppip">Top</span>'
            +'<input inputmode="numeric" id="exsetw_'+exKey+'_'+s+'" class="'+(setV===''?'exw-inherit':'')+'" value="'+setV+'" placeholder="" oninput="onSetWeight(\''+exKey+'\','+s+')" onblur="autoSaveSets(\''+exKey+'\')">'
            +'<span class="exset-w-u">'+wunit+'</span></div>';
        }
        html+='</div>';
      }
      html+='</div>';
      if(loaded){
        html+='<div class="exset-foot"><span class="exset-foot-lbl" id="extoplbl_'+exKey+'">'+(setsVaried(_headW)?'Top set':'Every set')+'</span>'
          +'<span class="exset-foot-val" id="extop_'+exKey+'">\u2014</span>'
          +'<span class="exset-foot-note">This is what tracks<br>your progress</span></div>';
      }
    }
    if(loaded){
      html+='<div class="ex-weight"><span class="ex-weight-lbl">'+(setsVaried(_headW)?'Top set':'Load')+'</span>'
        +'<input type="number" inputmode="numeric" id="exw_'+exKey+'" value="'+esc(_draftLoad)+'" placeholder="" min="0" step="'+step+'" class="ex-winput" oninput="cascadeSetWeights(\''+exKey+'\')" onblur="autoSaveSets(\''+exKey+'\')">'
        +'<span class="ex-wunit">'+wunit+'</span>';
      let _warnHTML='';
      let _stale=false;
      if(dispLast!==''){
        _stale=isStaleTs(effEntry&&effEntry.ts);
        const _src=(crossSrc&&crossSrc.progName)||'';
        const _speak=_stale&&!_staleWarnShown;
        if(_speak){ _setStaleWarnShown(true); _setStaleWarnSrc(_src); }
        // Sub-label is age-only. It regains the source program name ONLY when this
        // pill's source differs from the one the sentence named — otherwise the
        // sentence would be speaking for a number it did not come from.
        const _nameIt=_stale&&_src&&_src!==_staleWarnSrc;
        const rec=recencyLabel(effEntry&&effEntry.ts)+(_nameIt?' \u00b7 '+esc(_src):'');
        html+='<button type="button" class="ex-reuse'+(_stale?' is-stale':'')+'" onclick="reuseWeight(\''+exKey+'\','+dispLast+')">'
          +'<span class="ex-reuse-ico">\u21ba</span>'
          +'<span class="ex-reuse-txt"><span id="exreusenum_'+exKey+'">'+dispLast+' '+wunit+'</span><small id="exrec_'+exKey+'">'+rec+'</small></span>'
          +'</button>';
        if(_speak){
          _warnHTML='<div class="ex-stale-warn"><i>\u25b3</i><span>That '+dispLast+' '+wunit+' '
            +(_src?'came from '+esc(_src)+', ':'is ')
            +recencyLabel(effEntry&&effEntry.ts,'age')+'. Still where you are?</span></div>';
        }
      }
      html+='</div>'+_warnHTML;
      // Expanded-only twin of the reuse pill. Same number, but it stamps every set
      // rather than the one collapsed field, so a uniform session is still one tap.
      if(dispLast!==''&&rx){
        // Same source, same staleness. It must NOT print the sentence a second time
        // inside one card — one flag, both render paths.
        html+='<button type="button" class="ex-reuse ex-reuse-fill'+(_stale?' is-stale':'')+'" onclick="fillAllSetWeights(\''+exKey+'\','+dispLast+')">'
          +'<span class="ex-reuse-ico">\u21ba</span>'
          +'<span class="ex-reuse-txt">Fill every set with '+dispLast+' '+wunit+'<small>'+recencyLabel(effEntry&&effEntry.ts)+'</small></span>'
          +'</button>';
      }
    }
    html+='<button class="ex-logbtn" onclick="saveExWeight(\''+exKey+'\',\''+safeN+'\',\''+safeD+'\')">Log</button>';
    html+='</div>';
  }
  html+='</div>';
  return html;
}
// ── V158: BENCHMARK READ-BACK (render-time, read-only) ─────────────────────────
// The retest card reports the week-1 baseline and, once the retest itself is logged,
// the pace delta. Reads ia_logs_ + ia_hist_ through the same key/snapshot discipline
// as _recoveryPaceEntry: the SNAPSHOT identifies the benchmark (prog.weeks is a build
// artifact), a swapped session is excluded, and a missing snapshot excludes — never
// guesses. Nothing is written anywhere; the strip exists only in the rendered card,
// so frozen days stay byte-identical.
function _benchmarkEntryFor(weekWanted: any){
  try{
    const logs=getLogs(), hist=getDayHist();
    let out=null;
    Object.entries(logs||{}).forEach(([key,e])=>{
      // @ts-expect-error TS2339 Property 'swapTo' does not exist on type '{}'.
      if(!e || e.swapTo) return;
      const m=key.match(/^w(\d+)_(.+)$/); if(!m || +m[1]!==weekWanted) return;
      const snap=hist&&hist[key]; if(!snap||!snap.cardio) return;
      const c=snap.cardio;
      if(String(c.type||'').toLowerCase()!=='run') return;
      if(!/^Benchmark Run/.test(String(c.subtype||''))) return;
      // @ts-expect-error TS2339 Property 'run_dist' does not exist on type '{}'.
      const dist=parseFloat(e.run_dist); if(!(dist>0)) return;
      // @ts-expect-error TS2339 Property 'run_mins' does not exist on type '{}'.
      const loggedMins=parseFloat(e.run_mins);
      const mins=(loggedMins>0)?loggedMins:((c.dose&&c.dose.mins>0)?c.dose.mins:20);
      out={dist:+dist.toFixed(2), mins, sec:mins*60/dist};
    });
    return out;
  }catch(err){ return null; }
}
function _benchStripHTML(cardio: any){
  if(!/^Benchmark Run — Retest/.test(String(cardio.subtype||''))) return '';
  // @ts-expect-error TS7006 Parameter 's' implicitly has an 'any' type.
  const fmt=s=>_clkMS(s);   // D126 (V204): logged dist/duration is an open domain; _clkMS owns the limb
  const base=_benchmarkEntryFor(1);
  if(!base){
    return '<div class="cardio-note">No week 1 benchmark was logged — today\u2019s result becomes your baseline for the next block. Run it exactly as written.</div>';
  }
  // @ts-expect-error TS2339 Property 'dist' does not exist on type 'never'.
  let html='<div class="cardio-note"><b>Week 1 baseline:</b> '+base.dist+' mi in '+base.mins+' min — '+fmt(base.sec)+'/mi. Same even effort today; the distance difference is your gain.</div>';
  const now=_benchmarkEntryFor(cardio.week);
  if(now){
    // @ts-expect-error TS2339 Property 'sec' does not exist on type 'never'.
    const df=Math.round(base.sec-now.sec);
    const verdict = Math.abs(df)<5
      ? 'Even with week 1 — fitness held through a full build, which on this recovery budget is a result.'
      : (df>0 ? df+' sec/mi FASTER at the same effort. The aerobic engine grew — the block worked.'
              : Math.abs(df)+' sec/mi slower at the same effort. An off day happens; look at sleep, fuel, and heat before doubting six weeks of work.');
    // @ts-expect-error TS2339 Property 'dist' does not exist on type 'never'.
    html+='<div class="cardio-note"><b>Retest:</b> '+now.dist+' mi — '+fmt(now.sec)+'/mi. '+verdict+'</div>';
  }
  return html;
}
function buildCardioHTML(cardio: any){
  if(!cardio) return '';
  const ctype=(cardio.type||'').toLowerCase();
  const blockCls=ctype==='swim'?'swim-block':ctype==='run'?'run-block':ctype==='bike'?'bike-block':'cardio-block';
  const labelCls=ctype==='swim'?'cardio-label-swim':ctype==='run'?'cardio-label-run':ctype==='bike'?'cardio-label-bike':'cardio-label-general';
  const typeNames: Record<string, string>={run:'Run',bike:'Bike / Spin',swim:'Swim'};
  const typeName=typeNames[ctype]||cardio.type;
  const subLabel=cardio.subtype?' — '+cardio.subtype.replace(/_/g,' '):'';
  let inner=`<div class="cardio-type-label ${labelCls}">${typeName}${subLabel}</div>`;
  // V141: segmented swim render — WU / drill / main / CD rows with a yardage total.
  // Flat fallback covers everything else, including frozen pre-V141 days.
  if(ctype==='swim' && Array.isArray(cardio.segments) && cardio.segments.length){
    // @ts-expect-error TS7006 Parameter 'sg' implicitly has an 'any' type.
    inner+=cardio.segments.map(sg=>`<div class="swim-seg"><div class="swim-seg-label">${sg.label}</div><div class="swim-seg-body">${sg.text}</div></div>`).join('');
    const _tot=cardio.segments.reduce((a: any,sg: any)=>a+(+sg.yd||0),0);
    if(_tot) inner+=`<div class="swim-total">${_tot.toLocaleString()} yd total</div>`;
  } else {
    inner+=`<div class="cardio-detail">${(cardio.detail||'').replace(/\n/g,'<br>')}</div>`;
  }
  if(cardio.note) inner+=`<div class="cardio-note">${cardio.note}</div>`;
  inner+=_benchStripHTML(cardio);   // V158: retest baseline/delta (empty for everything else)
  // The RPE scale is no longer reprinted here — it lives once in the RPE ⓘ button in
  // the day header, so a workout referencing "RPE 8" doesn't repeat the whole key.
  return `<div class="${blockCls}">${inner}</div>`;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { buildCardioHTML, buildExItem, exControlFlags, exLoggable, refreshSetSummary, setWeightVals, toStoreW };
