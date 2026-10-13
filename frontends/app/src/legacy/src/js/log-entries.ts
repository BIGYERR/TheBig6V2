import { esc, snapshotDay } from './storage.ts';
import { activeProgId, currentDayKey, currentWeek } from './rest-day-shell.ts';
import { exStoreKey } from '../../../../../../core/src/engine/exercise-library.ts';
import { EQUIP_TOKENS } from '../../../../../../core/src/engine/exercise-kinds.ts';
import { _clkMS } from '../../../../../../core/src/engine/clock-format.ts';
import { runSessionCode } from './week-view-sections.ts';
import { cardioLive, persistLogFields } from './day-status.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// Smart weight rounding — lbs to nearest 5, kg to nearest 2.5
// Detect if an exercise uses trackable weight
function isWeightedExercise(name: any) {
  if(!name) return false;
  const n = name.toLowerCase();
  return false; // handled by isTimeExercise and weight detection below
}
// True if the name carries a token from the given family (e.g. hasEquip(n,'kettlebell')).
function hasEquip(name: any, fam: any){
  const n = (name||'').toLowerCase();
  return (EQUIP_TOKENS[fam]||[]).some(t => n.includes(t));
}
function isKBExercise(name: any) {
  if(!name) return false;
  const n = name.toLowerCase();
  return hasEquip(name,'kettlebell');
}
function isDBExercise(name: any) {
  if(!name) return false;
  const n = name.toLowerCase();
  // Dumbbell tokens live in EQUIP_TOKENS (covers "DB bench", "db-row", "Dumbbell press",
  // and the "(DB)" parenthetical suffix). KB takes precedence so a kettlebell movement is
  // never mispriced as a per-hand dumbbell load.
  return hasEquip(name,'dumbbell') && !isKBExercise(name);
}

// Get stored exercise weights for this program
function getExWeights(){try{return JSON.parse(localStorage.getItem('ia_exw_'+activeProgId)||'{}');}catch{return{};}}
function saveExWeights(obj: any){localStorage.setItem('ia_exw_'+activeProgId,JSON.stringify(obj));}


// ── DAY RESOLUTION FOR LOG ENTRIES (V117) ────────────────────────────────────
// Entries used to carry only `week`. Every day-view reader asked "is there an entry
// for THIS week", so an exercise appearing on two days inside one week rendered the
// second day pre-checked, with the first day's set numbers restored into the rows,
// and — worse — the second day's save OVERWROTE the first day's record. Two sessions
// collapsed into one. `day` closes both halves.
//
// Storage is ADDITIVE. Pre-V117 entries have no `day` and are resolved from their own
// `ts`, which is the only day-aware value those records ever carried. Nothing is
// migrated or rewritten, so a rollback stays clean and existing history keeps its
// place on the day view instead of vanishing.
const _ENTRY_DAY_ORDER=['sun','mon','tue','wed','thu','fri','sat'];
function entryDay(e: any){
  if(!e) return '';
  if(e.day) return e.day;
  if(e.ts){ try{ return _ENTRY_DAY_ORDER[new Date(e.ts).getDay()]||''; }catch(_){ return ''; } }
  return '';
}
// Chart rule (Mario's call, V117): ONE point per week, the week's HEAVIEST across days.
// The big-3 chart already did this via Math.max per week; the per-exercise history chart
// plotted one dot per entry and would otherwise show two dots both labelled W5 the moment
// day granularity landed. Ties break to the later timestamp.
function weeklyBest(entries: any){
  const byWeek=Object.create(null);
  (entries||[]).forEach(function(e: any){
    if(!e) return;
    const w=+e.week||0, prev=byWeek[w];
    if(!prev) { byWeek[w]=e; return; }
    const a=+e.weight||0, b=+prev.weight||0;
    if(a>b || (a===b && (e.ts||0)>(prev.ts||0))) byWeek[w]=e;
  });
  return Object.keys(byWeek).map(Number).sort(function(a,b){return a-b;}).map(function(w){return byWeek[w];});
}

// Log a weight entry for an exercise
// setsW (V105) is the per-set load ladder in lbs, ADDITIVE to the existing shape.
// `weight` remains the scalar every downstream consumer reads and is always
// max(setsW) when a ladder is present. Pre-V105 entries simply have no setsW and
// render as uniform — nothing is migrated or rewritten, so a rollback stays clean.
function logExerciseWeight(exName: any, weight: any, setsReps: any, week: any, setsDone: any, setsW: any, dayKey: any) {
  if(!exName) return;
  if(!weight && !(setsDone && setsDone.length)) return;
  const store = getExWeights();
  const key = exStoreKey(exName);
  if(!store[key]) store[key] = {name:exName, entries:[]};
  const w = week||currentWeek;
  const dk = dayKey||(typeof currentDayKey!=='undefined'?currentDayKey:'')||'';
  // V222 D181 (R2). The per-exercise Log is a first touch. D108 counts this ia_exw_ write
  // as touching the day, so without a snapshot the day freezes with no record of what it
  // was frozen ON. snapshotDay is first-touch-wins, so this is a no-op on a day already
  // snapshotted, and it returns without writing when the day is not in the week.
  if(dk) snapshotDay(w, dk);
  const entries = store[key].entries;
  // ONE entry per exercise per week PER DAY (V117). Re-logging the same exercise on
  // the same day (e.g. correcting a typo — clear the field, type a new number)
  // OVERWRITES that day's value instead of appending a second point; a correction must
  // not plot as a phantom duplicate dot. But two DIFFERENT days inside one week are two
  // sessions and must stay two records — keying this on `week` alone silently destroyed
  // the earlier one. Latest log for the day wins.
  // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
  const existing = entries.find(e => +e.week === +w && entryDay(e) === dk);
  if(existing) {
    existing.weight = +weight;
    existing.setsReps = setsReps||'';
    existing.setsDone = (setsDone && setsDone.length) ? setsDone : (existing.setsDone||[]);
    existing.setsW = (setsW && setsW.length) ? setsW : (existing.setsW||[]);
    existing.ts = Date.now();
    existing.day = dk;
  } else {
    entries.push({
      weight: +weight,
      setsReps: setsReps||'',
      setsDone: setsDone||[],
      setsW: setsW||[],
      week: w,
      day: dk,
      ts: Date.now()
    });
  }
  // Keep ~52 WEEKS of history, not 52 entries (V117). Counting entries was equivalent
  // to counting weeks only while a lift could log once a week; with day granularity a
  // 3x/week movement reached the old cap at week 18 and `shift()` dropped from the FRONT
  // of the array — the baseline the whole chart is measured against. Capping on week span
  // keeps the same one-year intent regardless of how often the movement recurs.
  const _wMax = entries.reduce(function(m: any,e: any){return Math.max(m, +e.week||0);}, 0);
  if(_wMax > 52){
    const _keep = entries.filter(function(e: any){ return (+e.week||0) > _wMax - 52; });
    if(_keep.length !== entries.length) store[key].entries = _keep;
  }
  saveExWeights(store);
}

// Collapse any legacy duplicate entries so each exercise keeps ONE entry per week
// (most recently logged wins). Cleans up duplicate points created before the
// per-week overwrite fix above. Returns true if anything actually changed.
function dedupeExDayEntries(store: any) {
  // KEYED ON WEEK + DAY (V117). This function WRITES BACK to localStorage, so while it
  // keyed on `week` alone it was a third writer whose whole job was to destroy exactly
  // the records day granularity creates — it would have eaten the earlier day's session
  // on every visit to the progress screen, permanently. It still collapses genuine
  // same-day duplicates (the pre-V105 push-every-save defect); it no longer collapses
  // two different training days into one.
  let changed = false;
  Object.values(store).forEach(ex => {
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    if(!ex.entries || ex.entries.length < 2) return;
    const byKey = {};
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    ex.entries.forEach(e => {
      const k = String(e.week) + '|' + entryDay(e);
      // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
      const prev = byKey[k];
      // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
      if(!prev || (e.ts||0) >= (prev.ts||0)) byKey[k] = e;
    });
    // @ts-expect-error TS18046 'a' is of type 'unknown'.
    const merged = Object.values(byKey).sort((a,b) => (a.week-b.week) || ((a.ts||0)-(b.ts||0)));
    // @ts-expect-error TS18046 'ex' is of type 'unknown'.
    if(merged.length !== ex.entries.length) { ex.entries = merged; changed = true; }
  });
  return changed;
}

// Non-competition main-lift variants are performed lighter than the comp lift they're
// priced from (the engine prices every squat/bench/deadlift variant off the ONE big-3 1RM).
// Scale the prescribed load so a paused/front/box squat, incline/close-grip press, or RDL
// reads at a realistic working weight instead of the full competition-lift percentage.
function variantLoadFactor(exName: any){
  if(!exName) return 1;
  const n=exName.toLowerCase();
  if(n.includes('romanian')) return 0.65;                     // RDL — hip hinge, far lighter than a pull
  if(n.includes('incline')) return 0.82;                      // incline press « flat bench
  if(n.includes('front squat')) return 0.82;                  // front-racked, ~80-85% of back squat
  if(n.includes('paused')||n.includes('pause')) return 0.88;  // dead-stop kills the stretch reflex
  if(n.includes('deficit')) return 0.88;                      // extra ROM off the floor — lighter than a standard pull
  if(n.includes('close-grip')||n.includes('box squat')||n.includes('tempo')) return 0.90;
  return 1;
}

const RPE_LABELS: Record<string, string> = {1:'Very Easy',2:'Easy',3:'Moderate',4:'Somewhat Hard',5:'Hard',6:'Hard+',7:'Very Hard',8:'Very Hard+',9:'Max Effort',10:'All Out'};
function updateRPEDisplay(val: any) {
  const el = document.getElementById('rpeDisplay');
  if(el) el.textContent = val + ' — ' + (RPE_LABELS[+val]||'');
  // V236 (D219): a moved slider is a claimed RPE. Its only caller is the range's own oninput,
  // an attribute handler that runs before the persist listener openDetail adds, so the marker
  // is on the node when persistLogFields reads it. A render never calls this: the thumb
  // resting at 5 stays unmarked and stores no number.
  const r = document.getElementById('log_rpe');
  if(r) r.dataset.touched = '1';
}
const CARDIO_WORD={run:'Run',bike:'Bike',swim:'Swim'};
// V234 (D213): the field set each sport owns at the top level of a log entry. Only the active
// chip's set sits at top level, so only it is credited. A sport change through the picker moves
// the leaving set whole into entry.parked[sport] and brings the arriving sport's parked set back.
// `parked` is read by the form render (setCardioSwap, buildLogHTML's note) and carried by
// persistLogFields; no other reader names it, so every other reader is blind to it.
const CARDIO_PARK_FIELDS={run:['run_dist','run_pace','run_mins','run_reps','run_rep_time'],bike:['bike_mins'],swim:['swim_yards']};
// V234 (D214): the swap note, one source for both sites. The second sentence prints only when
// the planned sport has a parked set holding a number.
function cardioSwapNoteText(active: any, planned: any, e: any){
  const p=e&&e.parked&&e.parked[planned];
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
  const kept=!!p&&(CARDIO_PARK_FIELDS[planned]||[]).some(function(f: any){ return p[f]!=null&&p[f]!==''; });
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
  return `Counts toward ${CARDIO_WORD[active]}, not ${CARDIO_WORD[planned]}.`+(kept?` Your ${CARDIO_WORD[planned]} numbers are kept. Switch back and they return.`:'');
}

// ── V148: DOSE-AWARE LOG GRAMMAR ──────────────────────────────────────
// The prescription owns the fixed dimension; the log captures the free one; the third
// derives. Time × pace × distance — never ask for two when one is prescribed. The old
// run form asked distance AND pace against a time-box session and recorded data that
// contradicted itself (1.84 mi @ 9:15 logged against 15 min = 17:01 of running).
//
// Engine sessions now carry `dose` (see buildRunSession et al). Frozen ia_hist_
// snapshots predate the field, so doseFromCardio falls back to parsing the detail
// prose — regex-on-prose is the "80 mi" bug's pattern family, hence every regex here
// is \b-anchored and the whole parser is under the dose↔detail agreement sweep.
let _curLogDose: any=null;      // dose for the sport currently being logged (null when swapped)
let _curLogDoseFull: any=null;  // dose of the PLANNED sport, so swapping back restores the form
let _curLogSub='';         // planned subtype, for the strip label
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setCurLogDose(v: any){ _curLogDose=v; }
function _setCurLogDoseFull(v: any){ _curLogDoseFull=v; }
function _setCurLogSub(v: any){ _curLogSub=v; }
function _fmtPaceMi(sec: any){ if(!isFinite(sec)||sec<=0) return null; return _clkMS(sec); }   // D126 (V204)
function _parseClock(t: any){ // "2:04" or bare seconds -> seconds
  if(!t) return null; t=String(t).trim();
  if(t.indexOf(':')>=0){ const q=t.split(':'); if(q.length===2&&q[0]!==''&&isFinite(+q[0])&&isFinite(+q[1])) return (+q[0])*60+(+q[1]); return null; }
  const n=+t; return isFinite(n)&&n>0?n:null;
}
// Structured dose for a cardio session: the emitted field when present, else a
// \b-anchored parse of the frozen detail prose. Run and bike only; swim keeps its
// yardage form and the segmented grammar owns its presentation.
function doseFromCardio(c: any){
  if(!c) return null;
  if(c.dose && c.dose.k) return c.dose;
  const t=(c.type||'').toLowerCase();
  if(t!=='run' && t!=='bike') return null;
  // Bike intervals prescribe seconds-reps ("8 x 45s") — the stray "3 min easy warmup"
  // would false-parse as a 3-minute time box, so intervals never parse for bike.
  if(t==='bike' && /interval/i.test(c.subtype||'')) return null;
  const d=String(c.detail||'');
  const tm=d.match(/(\d+):(\d{2})\/mi/);            // first quoted pace = session target
  let tgt=tm?((+tm[1])*60+(+tm[2])):null;
  // Progression runs span recovery→race pace; the first quoted pace is the STARTING
  // pace, not a target. Emitted doses carry no tgt — the parse must not invent one.
  // Guarded by the bidirectional tgt assertion in the agreement sweep.
  if(/as a progression/i.test(d)) tgt=null;
  let m;
  if((m=d.match(/(\d+)\s*x\s*(\d+)\s*m\b/i)))            return {k:'reps_dist', reps:+m[1], m:+m[2], tgt:tgt, parsed:true};
  if((m=d.match(/(\d+)\s*x\s*(\d+)\s*min\b/i)))          return {k:'reps_time', reps:+m[1], mins:+m[2], tgt:tgt, parsed:true};
  if((m=d.match(/(\d+(?:\.\d+)?)[-\s]*min(?:ute)?s?\b/i))) return {k:'time', mins:+m[1], tgt:tgt, parsed:true};
  if((m=d.match(/(\d+(?:\.\d+)?)\s*mi(?:les?)?\b/)))       return {k:'dist', mi:+m[1], tgt:tgt, parsed:true};
  return null;
}
// Pure derivation shared by the live readout and persistLogFields. Fixed dimension
// falls back to planned; the FREE dimension must have been entered or nothing derives.
function doseDerived(dose: any, v: any){
  if(!dose) return null;
  const dist=parseFloat(v.dist)||0, mins=parseFloat(v.mins)||0;
  const reps=(v.reps===''||v.reps==null)?null:(+v.reps||0);
  const repS=_parseClock(v.rep);
  if(dose.k==='time'){
    if(!(dist>0)) return {};
    const useM=mins>0?mins:dose.mins, sec=useM*60/dist;
    return {sec:sec, pace:_fmtPaceMi(sec)+'/mi', tgt:dose.tgt, assumed:mins>0?null:('assuming planned '+dose.mins+' min')};
  }
  if(dose.k==='dist'){
    if(!(mins>0)) return {};
    const useD=dist>0?dist:dose.mi, sec=mins*60/useD;
    return {sec:sec, pace:_fmtPaceMi(sec)+'/mi', tgt:dose.tgt, dist:(dist>0?null:useD), assumed:dist>0?null:('assuming planned '+dose.mi+' mi')};
  }
  if(dose.k==='reps_dist'){
    const out={};
    // @ts-expect-error TS2339 Property 'dist' does not exist on type '{}'.
    if(reps!=null&&reps>0){ out.dist=+((reps*dose.m)/1609.34).toFixed(2); out.vol=reps+' × '+dose.m+'m'; }
    // @ts-expect-error TS2339 Property 'sec' does not exist on type '{}'.
    if(repS){ const sec=repS/(dose.m/1609.34); out.sec=sec; out.pace=_fmtPaceMi(sec)+'/mi'; out.tgt=dose.tgt; }
    return out;
  }
  if(dose.k==='reps_time'){
    if(!(dist>0)) return {};
    const useR=(reps!=null&&reps>0)?reps:dose.reps, wm=useR*dose.mins, sec=wm*60/dist;
    return {sec:sec, pace:_fmtPaceMi(sec)+'/mi', tgt:dose.tgt, workMin:wm, assumed:(reps!=null&&reps>0)?null:('assuming planned '+dose.reps+' reps')};
  }
  return null;
}
function _doseStripHTML(sport: any, dose: any, sub: any){
  const code=runSessionCode(sub||'', dose&&dose.key, sport);
  let v='';
  if(dose.k==='time') v=dose.mins+' min';
  else if(dose.k==='dist') v=dose.mi+' mi';
  else if(dose.k==='reps_dist') v=dose.reps+' × '+dose.m+'m';
  else if(dose.k==='reps_time') v=dose.reps+' × '+dose.mins+' min';
  if(dose.tgt&&sport==='run') v+=' @ '+_fmtPaceMi(dose.tgt)+'/mi';
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
  return '<div class="plan-strip'+(sport==='bike'?' bike-strip':'')+'"><span class="ps-lbl">'+(CARDIO_WORD[sport]||sport)+(code&&code!=='RUN'?' — '+code:'')+' · Planned</span><span class="ps-val">'+esc(v)+'</span></div>';
}
// Live derived readout under the dose form. No-op when the generic form is showing.
function updateDoseDerived(){
  const el=document.getElementById('doseDerived'); if(!el) return;
  if(!_curLogDose){ el.innerHTML=''; return; }
  // @ts-expect-error TS7006 Parameter 'id' implicitly has an 'any' type.
  const g=id=>document.getElementById(id)?.value||'';
  const d=doseDerived(_curLogDose,{mins:g('log_run_mins'),dist:g('log_run_dist'),reps:g('log_run_reps'),rep:g('log_run_rep_time')});
  if(!d){ el.innerHTML=''; return; }
  let rows='';
  // @ts-expect-error TS2339 Property 'vol' does not exist on type '{ sec?: undefined; pace?: undefined; tgt?: undefined; assumed?: 
  if(d.vol) rows+='<div class="derived"><span class="d-lbl">Work volume — derived</span><span class="d-val">'+(d.dist!=null?d.dist+' mi':'')+'<small>'+d.vol+'</small></span></div>';
  if(d.pace){
    let delta='';
    // V191 (D40): a gap of a minute or more prints m:ss. "73s/mi" makes the athlete
    // do the conversion to see it is over a minute; "1:13/mi" reads as a gap on sight.
    // Under a minute stays in seconds — that is the runner-native unit at that scale.
    if(d.tgt&&d.sec){ const df=Math.round(d.sec-d.tgt), ad=Math.abs(df); const mag=ad<60?(ad+'s/mi'):(Math.floor(ad/60)+':'+String(ad%60).padStart(2,'0')+'/mi'); delta=ad<5?'on target':(mag+' '+(df<0?'faster than target':'slower than target')); }
    const note=[d.assumed,delta,(d.workMin?('over '+d.workMin+' work min'):null)].filter(Boolean).join(' · ');
    // @ts-expect-error TS2339 Property 'vol' does not exist on type '{ sec: number; pace: string; tgt: any; assumed: string | null; d
    rows+='<div class="derived"'+(d.vol?' style="border-top:none;padding-top:0"':'')+'><span class="d-lbl">Pace — derived</span><span class="d-val">'+d.pace+(note?'<small>'+note+'</small>':'')+'</span></div>';
  }
  if(!rows) rows='<div class="derived"><span class="d-lbl">'+(_curLogDose.k==='reps_dist'?'Rep pace — derived':'Pace — derived')+'</span><span class="d-val empty">'+(_curLogDose.k==='dist'?'enter minutes':(_curLogDose.k==='reps_dist'?'enter a rep time':'enter distance'))+'</span></div>';
  el.innerHTML=rows;
}
// Rep stepper for interval / multi-rep forms. Hidden input starts '' (untouched) so an
// unmoved stepper never claims completed volume — the display shows planned, storage
// stays honest until the athlete actually engages.
function doseRep(delta: any){
  const h=document.getElementById('log_run_reps'); if(!h||!_curLogDose) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const base=(h.value==='')?(_curLogDose.reps||0):(+h.value||0);
  const v=Math.max(0, Math.min(30, base+delta));
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  h.value=v;
  // @ts-expect-error TS2322 Type 'number' is not assignable to type 'string'.
  const s=document.getElementById('doseRepVal'); if(s) s.textContent=v;
  // V236 (D218): on a DRAFT card the stepper is form only; the Log tap commits it.
  // @ts-expect-error TS2554 Expected 2 arguments, but got 1.
  if(cardioLive(currentDayKey)) persistLogFields(currentDayKey);
  updateDoseDerived();
}
const _DOSE_INPUT_STYLE='width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-size:16px;padding:9px 12px;outline:none';

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  CARDIO_PARK_FIELDS, CARDIO_WORD, RPE_LABELS, _curLogDose, _curLogDoseFull, _curLogSub, _doseStripHTML, _fmtPaceMi,
  _setCurLogDose, _setCurLogDoseFull, _setCurLogSub, cardioSwapNoteText, dedupeExDayEntries, doseDerived,
  doseFromCardio, entryDay, getExWeights, isKBExercise, logExerciseWeight, saveExWeights, updateDoseDerived, weeklyBest,
};
