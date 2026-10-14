import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { getLogs, logKey } from './storage.ts';
import { currentDayKey, currentWeek } from './rest-day-shell.ts';
import { exStoreKey } from '../../../../../../core/src/engine/exercise-library.ts';
import { tagMeta } from './week-view-sections.ts';
import { exLoggable } from './set-logging.ts';
import {
  CARDIO_WORD, RPE_LABELS, _curLogDose, _curLogSub, _doseStripHTML, _setCurLogDose, _setCurLogDoseFull, _setCurLogSub,
  cardioSwapNoteText, doseFromCardio, entryDay, getExWeights,
} from './log-entries.ts';
import { cardioEntryLive, cardioLogLabel } from './day-status.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// ── V182: the wheel (D1-D6) ───────────────────────────────────────────────────
// One writer for all three wheel sites. Each wheel drives a HIDDEN input that keeps
// the field's existing id, and a settle writes that node and dispatches 'input' on it.
// From V236 (D218) the listeners on those ids persist only once the card is LIVE
// (cardioLive): on a DRAFT card a settle moves the node and the derived readout and
// nothing else, and the Log tap (logCardio), Done or Skip commits the form through
// persistLogFields.
const _IAW_ROW=44;
// Bounds are measured, not guessed. Pace: the engine prescribes 5:00-14:30/mi, so 4
// clears the fastest interval by a minute and 17 clears the slowest LSD by 2:30.
// Rep time: the only reps_dist distances are 400m and 800m, which at those same paces
// span 0:55-8:27 — a 4:00 floor would be unreachable there, so it gets its own 0-9.
const _IAW_SPEC: Record<string, any>={
  dist:{fmt:'dec3',  cap:'Miles',        cols:[{min:0,max:99,wrap:false},{min:0,max:9,dot:true},{min:0,max:9}]},
  pace:{fmt:'clock', cap:'Pace / mile',  cols:[{min:4,max:17,nil:true},{min:0,max:59,pad:2}]},
  rept:{fmt:'clock', cap:'Typical rep',  cols:[{min:0,max:9, wrap:false},{min:0,max:59,pad:2}]},
  // V232 (D199): run time as a clock with hours. 0..9 hours covers every finish under 10:00:00,
  // the file's one ceiling on logged cardio minutes (max="600" on the rest-day sheet). V235
  // (D199 as amended by D215, D216): hours has no dash and does not wrap (D216), so the column
  // is the ten rows 0..9, and "nothing logged yet" is the zero face 0:00:00, which stores ''
  // (D215). Minutes and seconds wrap (derived from nil, D5).
  hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, wrap:false},{min:0,max:59,pad:2},{min:0,max:59,pad:2}]}
};
// V184 (D5): round-robin. A column is cyclic exactly when it has no dash row — that is
// derived, not hand-listed, so a new column can never be missed. Seconds, tenths and
// hundredths wrap because 0 and their max are genuine neighbours. The LEFT column of
// each pair never wraps: it carries the '—' meaning "didn't log it", and spinning off
// the dash on a fast flick would make that state reachable by accident. No carry
// either: 9:59 wraps to 9:00, so a flick on seconds cannot rewrite the minutes.
// V235 (D216): one column says otherwise, by name. The hms hours column has no dash (D215)
// and still never wraps: 9 hours and 0 hours are not neighbours on any clock, and 0..9 is a
// ceiling (D199), not a cycle, so a flick off the floor must not turn 0:45:00 into 9:45:00.
// V237 (D220): whole miles and rep minutes join it by name, no dash and no wrap: 99 miles and
// 0 miles, 9 minutes and 0 minutes, are ceilings, not neighbours, and the same flick must not
// turn a 0:45 rep into 9:45. The three carry wrap:false, honoured first; every other column
// derives from nil as above.
const _IAW_REPS=5;
function _iawWraps(c: any){ if(c.wrap===false) return false; return !c.nil; }
function _iawList(c: any){
  var base=_iawRows(c);
  if(!_iawWraps(c)) return base;
  var out: any[]=[]; for(var r=0;r<_IAW_REPS;r++) out=out.concat(base);
  return out;
}
function _iawHome(c: any){ return _iawWraps(c) ? Math.floor(_IAW_REPS/2)*_iawRows(c).length : 0; }
function _iawRows(c: any){
  var out=[]; if(c.nil) out.push('');
  for(var v=c.min;v<=c.max;v++) out.push(String(v));
  return out;
}
function _iawFace(c: any,v: any){
  if(v==='') return '\u2014';
  if(c.dot) return '.'+v;
  return c.pad===2?('00'+v).slice(-2):v;
}
// Stored string -> one row value per column. Out-of-range and malformed legacy values
// clamp for DISPLAY only; nothing is written back until the athlete actually scrolls,
// so reopening a day can never silently rewrite what was logged.
function _iawParse(kind: any,val: any){
  var sp=_IAW_SPEC[kind], s=String(val==null?'':val).trim();
  // V232 (D200): run minutes stay stored as DECIMAL MINUTES; this reads them back as a clock.
  // A bare integer, a decimal or a leading-dot decimal (D203); never a colon. Rounded to the
  // nearest second, so a two-place value lands on the second the athlete left the wheel on.
  // V233 (D208): above the dial's ceiling the whole face pegs there (9:59:59, from the column
  // maxes), for display only. V235 (D215): empty or malformed (nothing at the front that reads as
  // digits or a leading-dot decimal: '', 'abc', '-1') lands on 0:00:00, the zero face that stores ''.
  if(sp.fmt==='hms'){
    var mh=s.match(/^\d*(?:\.\d+)?/);
    if(!mh||mh[0]==='') return ['0','0','0'];
    var t=Math.round(parseFloat(mh[0])*60);
    t=Math.min(t,sp.cols[0].max*3600+sp.cols[1].max*60+sp.cols[2].max);
    return [String(Math.floor(t/3600)),String(Math.floor((t%3600)/60)),String(t%60)];
  }
  // V237 (D220): a blank or malformed miles or rep time string lands on the zero face (0.00,
  // 0:00), which stores '', as hms does since D215. Pace alone keeps its dash (D222).
  if(!s) return kind==='pace'?['','']:(sp.fmt==='dec3'?['0','0','0']:['0','0']);
  if(sp.fmt==='dec3'){
    // V232 (D203): the whole is optional, so a keypad's .86 seeds 0 . 8 6 rather than the
    // dash; an empty whole reads 0. V237 (D220): a string with no digits at the front lands on
    // zero, 0.00 (it was the dash).
    var m3=s.match(/^(\d*)(?:\.(\d)(\d)?)?/);
    if(!m3||m3[0]==='') return ['0','0','0'];
    var a3=Math.max(sp.cols[0].min,Math.min(sp.cols[0].max,+m3[1]));
    var b3=m3[2]==null?0:+m3[2], c3=m3[3]==null?0:+m3[3];
    return [String(a3),String(b3),String(c3)];
  }
  var m = sp.fmt==='dec' ? s.match(/^(\d+)(?:\.(\d))?/) : s.match(/^(\d+):(\d{1,2})/);
  if(!m) return kind==='rept'?['0','0']:['',''];
  var a=+m[1], b=m[2]==null?0:+m[2];
  var c0=sp.cols[0], c1=sp.cols[1];
  a=Math.max(c0.min,Math.min(c0.max,a));
  b=Math.max(c1.min,Math.min(c1.max,b));
  return [String(a),String(b)];
}
// Row values -> the string that goes in the hidden input. The clock form always pads
// seconds to two digits, which is exactly what _paceStrToSec requires — a wheel cannot
// emit the "9:3" shape that the old text box accepted and the chart then dropped.
function _iawFormat(kind: any,vals: any){
  var sp=_IAW_SPEC[kind];
  if(vals[0]==='') return '';
  var b=vals[1]===''?'0':vals[1];
  // V232 (D200): h:mm:ss -> decimal minutes to two places (7:30 -> 7.50, 15:20 -> 15.33).
  // Two places is exact at the one-second grain: the error is at most 0.3 s.
  // V235 (D215): the zero face 0:00:00 is "nothing logged yet" (V182 D4) and stores '', checked
  // ahead of the D200 arithmetic, so the truthy readers (_hasLog, the session counter) agree with
  // the face. Tested on the total in seconds, not the strings, since a padded column may carry '00'.
  if(sp.fmt==='hms'){ var sx=vals[2]===''||vals[2]==null?'0':vals[2];
    if((+vals[0])*3600+(+b)*60+(+sx)===0) return '';
    return ((+vals[0])*60+(+b)+(+sx)/60).toFixed(2); }
  // V237 (D220): the same for the miles wheel's 0.00 and the rep time wheel's 0:00, each checked
  // on its total ahead of its arithmetic. Pace keeps its dash (D222): its first column starts at 4,
  // so its total is never zero, and the dash returns '' through the guard above.
  if(sp.fmt==='dec3'){ var c=vals[2]===''||vals[2]==null?'0':vals[2];
    if((+vals[0])*100+(+b)*10+(+c)===0) return '';
    return vals[0]+'.'+b+c; }
  if(kind==='rept'&&(+vals[0])*60+(+b)===0) return '';
  return sp.fmt==='dec' ? (vals[0]+'.'+b) : (vals[0]+':'+('00'+b).slice(-2));
}
// V232 (D202): `plan` is the fixed dimension's planned value. It rides on the wheel as
// data-plan and seeds the face when storage is blank; it is display only, never written.
function iaWheelHTML(kind: any, hiddenId: any, val: any, capOverride?: any, plan?: any){
  var sp=_IAW_SPEC[kind];
  var cols=sp.cols.map(function(c: any){
    return '<div class="iaw-col" data-ci="'+sp.cols.indexOf(c)+'" data-wrap="'+(_iawWraps(c)?'1':'')+'" data-len="'+_iawRows(c).length+'"><div class="iaw-pad"></div>'
      + _iawList(c).map(function(v){
          return '<div class="iaw-it'+(v===''?' nil':'')+'" data-v="'+v+'">'+_iawFace(c,v)+'</div>';
        }).join('')
      + '<div class="iaw-pad"></div></div>';
  }).join('');
  return '<div class="iaw-cell iaw-f'+sp.cols.length+'"><div class="iaw-cap">'+(capOverride||sp.cap)+'</div>'
    + '<div class="iaw" data-kind="'+kind+'" data-for="'+hiddenId+'"'+(plan==null||plan===''?'':' data-plan="'+String(plan).replace(/"/g,'&quot;')+'"')+'><div class="iaw-shade"></div><div class="iaw-band"></div>'+cols+'</div>'
    + '<input type="hidden" id="'+hiddenId+'" value="'+String(val==null?'':val).replace(/"/g,'&quot;')+'"></div>';
}
// The cylinder cue (D3). Windowed on purpose: a wrapped seconds column is 300 rows and
// touching all of them per frame janks on device, so only the rows that can actually be
// seen are shaped. Distance from the centre drives scale and opacity — no rotateX, the
// type simply recedes, which is what the eye reads as a drum turning away.
function _iawShape(col: any){
  var items=col.querySelectorAll('.iaw-it'), c=col.scrollTop;
  var mid=Math.round(c/_IAW_ROW), lo=Math.max(0,mid-4), hi=Math.min(items.length-1,mid+4);
  for(var i=lo;i<=hi;i++){
    var el=items[i], d=Math.abs(i*_IAW_ROW-c)/_IAW_ROW;
    var sc=Math.max(0.62,1-d*0.20), op=Math.max(0.22,1-d*0.42);
    el.style.transform='scale('+sc.toFixed(3)+')';
    el.style.opacity=op.toFixed(3);
    el.style.fontWeight=d<0.5?'700':'400';
  }
}
// Round-robin (D5). The list is repeated _IAW_REPS times; when the wheel comes to REST
// near either end it is jumped one half-span back toward the middle. On settle only:
// rewriting scrollTop during momentum cancels the scroll on iOS. The selected VALUE is
// identical across copies, so the jump is invisible and _iawCommit's dedupe means it
// cannot fire a spurious input event.
function _iawRecenter(col: any){
  if(!col.getAttribute('data-wrap')) return;
  var len=+col.getAttribute('data-len'), i=Math.round(col.scrollTop/_IAW_ROW);
  var half=Math.floor(_IAW_REPS/2)*len*_IAW_ROW;
  if(i<len) col.scrollTop+=half;
  else if(i>len*(_IAW_REPS-1)) col.scrollTop-=half;
}
function _iawSel(col: any){
  var items=col.querySelectorAll('.iaw-it');
  if(!items.length) return '';
  var i=Math.round(col.scrollTop/_IAW_ROW);
  if(i<0) i=0; if(i>items.length-1) i=items.length-1;
  return items[i].getAttribute('data-v');
}
// Commit on scroll-settle, never per frame. Writes the hidden node then dispatches
// 'input'; from V236 (D218) the listener saves only on a LIVE card (cardioLive).
function _iawCommit(w: any){
  var kind=w.getAttribute('data-kind');
  var cols=w.querySelectorAll('.iaw-col');
  var vals=[]; for(var i=0;i<cols.length;i++) vals.push(_iawSel(cols[i]));
  var h=document.getElementById(w.getAttribute('data-for'));
  if(!h) return;
  var next=_iawFormat(kind,vals);
  // V232 (session call 8): browsers fire scroll for a programmatic scrollTop, so the seed frame
  // and a recentre reach this settle on open. Until the wheel has rested on a face other than
  // the one it was seeded on, nothing is written: opening a day never writes, whatever the
  // stored string. The first rest elsewhere marks it moved; from then on only the dedupe gates.
  if(!w._iawMoved){ if(next===w._iawSeedFace) return; w._iawMoved=true; }
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  if(h.value===next) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  h.value=next;
  h.dispatchEvent(new Event('input',{bubbles:true}));
}
// V221 (D179): a status-setting tap closes the day. A wheel still coasting inside its 90 ms
// settle window has not written its hidden node yet, so every PENDING settle runs now,
// before persistLogFields reads the nodes, and its timer is cleared so nothing commits once
// the overlay is gone. A live _iawT means scrolled and not yet committed (the settle clears
// it); an untouched or already settled wheel is left alone and never writes.
function iaWheelFlush(root: any){
  var cols=(root||document).querySelectorAll('.iaw-col');
  for(var i=0;i<cols.length;i++){ var c=cols[i];
    if(c._iawT&&c._iawSettle){ clearTimeout(c._iawT); c._iawSettle(); } }
}
// Idempotent: safe to call after any re-render. Seeds each column from the hidden
// input's current value and paints the selected row without committing.
function iaWheelInit(root?: any){
  var scope=root||document;
  var wheels=scope.querySelectorAll('.iaw');
  for(var n=0;n<wheels.length;n++){ (function(w){
    if(w._iawOn) return; w._iawOn=true;
    var kind=w.getAttribute('data-kind');
    var h=document.getElementById(w.getAttribute('data-for'));
    // V232 (D202): blank storage seeds from the plan when the wheel carries one. Display only:
    // the plan face becomes the seed face, so _iawCommit's guard keeps an untouched open unwritten.
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    var hv=h?h.value:'', seed=_iawParse(kind, hv!==''?hv:(w.getAttribute('data-plan')||''));
    var cols=w.querySelectorAll('.iaw-col'), landed=[];
    for(var i=0;i<cols.length;i++){ (function(col,ci){
      var raf=0;
      // V221 (D179): the settle is a named step so iaWheelFlush can run a pending one early.
      col._iawSettle=function(){ col._iawT=0; _iawRecenter(col); _iawShape(col); _iawCommit(w); };
      col.addEventListener('scroll',function(){
        if(!raf) raf=(window.requestAnimationFrame||setTimeout)(function(){ raf=0; _iawShape(col); });
        clearTimeout(col._iawT);
        col._iawT=setTimeout(col._iawSettle,90);
      },{passive:true});
      // Seed into the MIDDLE copy so there is runway in both directions before the
      // first recentre; on a non-wrapping column _iawHome is 0 and this is unchanged.
      var home=_iawHome(_IAW_SPEC[kind].cols[ci]);
      var items=col.querySelectorAll('.iaw-it'), idx=home;
      for(var k=home;k<items.length;k++) if(items[k].getAttribute('data-v')===seed[ci]){ idx=k; break; }
      landed[ci]=items[idx]?items[idx].getAttribute('data-v'):'';
      // scrollTop before layout is a no-op on iOS, so land it in a frame.
      (window.requestAnimationFrame||setTimeout)(function(){ col.scrollTop=idx*_IAW_ROW; _iawSel(col); _iawShape(col); });
    })(cols[i],i); }
    // V232 (session call 8): the face this wheel actually shows after seeding. Not the parsed
    // seed: a value with no matching row lands on home, and the face is what the eye sees.
    w._iawSeedFace=_iawFormat(kind,landed);
  })(wheels[n]); }
}
// Input block for ONE cardio sport. Used both for the prescribed field and when a
// session is swapped to a different activity (the swap re-renders this in place).
// `dose` selects the grammar for run; null (unknown dose, complex NRC speed work, or a
// swapped session with no prescription in the new sport) falls back to the generic form.
function cardioFieldHTML(sport: any, e: any, dose: any, sub: any){
  e=e||{};
  if(sport==='run'&&dose){
    const strip=_doseStripHTML('run',dose,sub||'');
    const repsShown=(e.run_reps!==''&&e.run_reps!=null&&e.run_reps!==undefined)?e.run_reps:(dose.reps||0);
    const stepper=`<label>Reps completed</label>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="exset-ctl" style="flex:0 0 150px">
            <button type="button" class="exset-btn" onclick="doseRep(-1)">−</button>
            <div class="exset-val" id="doseRepVal">${repsShown}</div>
            <button type="button" class="exset-btn" onclick="doseRep(1)">+</button>
          </div>
          <span class="reps-of">of ${dose.reps}${dose.k==='reps_time'?' · '+dose.mins+' min each':''}</span>
        </div>
        <input type="hidden" id="log_run_reps" value="${e.run_reps||''}">`;
    // V232 (D199, D201, D202, D206): two wheels, stacked (two three-column wheels side by side
    // are six columns, under the 44pt target at 375pt). The fixed dimension comes first and is
    // seeded from the plan for display. V237 (D220, amending D202): a blank fixed wheel shows the
    // plan, a blank free wheel its zero face (0:00:00, 0.00, 0:00); only the pace wheel keeps the
    // dash. The free time wheel (dist form, V235 D215) parks on 0:00:00 and the free miles wheel
    // (time form, was the dash) on 0.00; each zero face stores ''.
    if(dose.k==='time') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('hms','log_run_mins',e.run_mins||'',null,dose.mins)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;
    // V237 (D221): on the dist form a stored run_dist byte-equal to String(dose.mi) is the V148
    // stamp persistLogFields writes; it is derived, so the miles wheel seeds '' (the plan face)
    // and every rebuild re-derives it from what the form holds. Any other bytes (a rolled 3.10,
    // 4.20, a typed legacy value) are the athlete's and seed as before.
    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('dist','log_run_dist',e.run_dist===String(dose.mi)?'':(e.run_dist||''),null,dose.mi)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('hms','log_run_mins',e.run_mins||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;
    if(dose.k==='reps_dist') return strip+`<div class="log-field" style="margin-bottom:10px">${stepper}</div>
        <div class="iaw-wrap" style="max-width:190px">${iaWheelHTML('rept','log_run_rep_time',e.run_rep_time||'')}</div>
        <div class="f-sub">what the watch showed on most reps</div>
        <div id="doseDerived"></div>`;
    if(dose.k==='reps_time') return strip+`<div class="log-field" style="margin-bottom:10px">${stepper}</div>
        <label>Miles in the work reps</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>
        <div class="f-sub">Leave out the easy jog between reps.</div>
        <div id="doseDerived"></div>`;
  }
  // V171 (D5): the generic form stays the form for NRC speed days (post-V154 ruling);
  // it just says what to log so warm up and recoveries are not left off the watch total.
  const _speedHint = /speed run/i.test(sub||'') ? `<div class="f-sub" style="margin-bottom:6px">Whole session off the watch — warm up, efforts and recoveries all count.</div>` : '';
  if(sport==='run') return `<label>${asyIcon('run',15)} Run — actual distance & pace</label>${_speedHint}
        <div class="iaw-wrap">
          ${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}
          ${iaWheelHTML('pace','log_run_pace',e.run_pace||'')}
        </div>`;
  // V233 (D207, D209 as amended, D210): one hms wheel alone in the stacked wrap, the run time
  // form's markup. No plan argument, so every bike shape parks on zero, 0:00:00, which stores ''
  // (V235, D215; it was the dash), until a ride is stored; the strip above carries the plan.
  // No sub-label (Mario). The hidden input keeps
  // the id log_bike_mins, so both listener arrays and persistLogFields read it unchanged.
  if(sport==='bike') return (dose?_doseStripHTML('bike',dose,sub||''):'')+`<label>${asyIcon('bike',15)} Log the ride</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('hms','log_bike_mins',e.bike_mins||'')}</div>`;
  if(sport==='swim') return `<label>${asyIcon('swim',15)} Swim — actual yardage</label>
        <input type="number" id="log_swim_yards" placeholder="yards" value="${e.swim_yards||''}" min="0" step="25" class="input-field">`;
  return '';
}
// One sport chip in the swap picker.
function cardioSwapChip(sport: any, active: any, planned: any){
  const on=sport===active;
  const tag=sport===planned?' · planned':'';
  return `<button type="button" data-sport="${sport}" onclick="setCardioSwap('${sport}')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:4px;cursor:pointer;border:1px solid ${on?'var(--accent)':'var(--border2)'};background:${on?'rgba(24,23,18,0.12)':'var(--surface2)'};color:${on?'var(--accent)':'var(--muted)'};font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.02em">${asyIcon(sport,15)}<span>${CARDIO_WORD[sport]}${tag}</span></button>`;
}

function buildLogHTML(dayKey: any, dayCardio: any){
  const logs=getLogs();const key=logKey(currentWeek,dayKey);const e=logs[key]||{};
  // Day-level cardio gating — show the field only for the cardio THIS day actually programs,
  // not whenever the program includes that sport somewhere. Null cardio = lift-only day = no cardio field.
  const ct=(dayCardio?.type||'').toLowerCase();
  const hasCardio=(ct==='run'||ct==='bike'||ct==='swim');
  // If a prior save recorded a swap, reopen showing the sport actually done.
  const activeSport=(e.swapTo)||ct;
  const swapped=hasCardio && activeSport!==ct;
  // V148: resolve the dose once per render. Swapped sessions get null on purpose —
  // there is no prescription in the new sport, so the generic form is the honest one.
  const _dose=hasCardio?doseFromCardio(dayCardio):null;
  _setCurLogDoseFull(_dose); _setCurLogSub((dayCardio&&dayCardio.subtype)||''); _setCurLogDose(swapped?null:_dose);

  // RPE slider value
  const rpeVal=e.rpe||'';
  // V236 (D218): the regime seeds from the store at render; cardioLive keeps it after every write.
  const _logged=hasCardio&&cardioEntryLive(e,activeSport);

  return `<div class="log-section" id="logSection">
    <div class="log-header"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto;margin-right:6px"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>Log This Session</div>
    <div class="log-body">
      <div class="log-field">
        <label>How hard was it? — RPE <button type="button" onclick="showRpeInfo()" aria-label="What is RPE?" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:0 2px;vertical-align:baseline">ⓘ</button></label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <input type="range" min="1" max="10" step="1" value="${rpeVal||5}" id="log_rpe"
            oninput="updateRPEDisplay(this.value)"
            style="flex:1">
          <div id="rpeDisplay" style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);min-width:120px;text-align:right">${rpeVal?(rpeVal+' — '+(RPE_LABELS[+rpeVal]||'')):'Move slider'}</div>
        </div>
      </div>
      ${hasCardio?`<div class="log-field" id="cardioSwapWrap" data-planned="${ct}" data-active="${activeSport}" data-logged="${_logged?'1':'0'}">
        <div id="cardioFields">${cardioFieldHTML(activeSport, e, _curLogDose, _curLogSub)}</div>
        <button type="button" id="cardioSwapLink" onclick="toggleCardioPicker()" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:6px 0 0;display:inline-flex;align-items:center;gap:5px;text-decoration:underline;text-underline-offset:2px">${asyIcon('history',13)} Did a different activity?</button>
        <div id="cardioPicker" style="display:${swapped?'block':'none'};margin-top:8px">
          <div style="font-size:10px;color:var(--muted);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Logged as</div>
          <div style="display:flex;gap:6px">${['run','bike','swim'].map(s=>cardioSwapChip(s, activeSport, ct)).join('')}</div>
          <div id="cardioSwapNote" style="font-size:11px;color:var(--accent);margin-top:8px;line-height:1.4;display:${swapped?'block':'none'}">${swapped?cardioSwapNoteText(activeSport, ct, e):''}</div>
        </div>
        <button type="button" id="cardioLogBtn" class="ex-logbtn${_logged?' logged':''}" onclick="logCardio()">${cardioLogLabel(_logged)}</button>
      </div>`:''}

      <div class="log-field"><label>Notes</label>
        <textarea id="log_notes" placeholder="How did it go? Anything to remember next week?" class="input-field" style="resize:none;height:64px;line-height:1.4">${e.notes||''}</textarea>
      </div>
    </div>
  </div>`;
}

function buildExportHTML(){
  return ''; // Export removed — progress tracked in Progress screen
}

// ── Session-sheet helpers (V18.3) ──
const MOD_PAL: Record<string, [string, string]>={test:['#CF4E1A','rgba(207,78,26,0.15)'],peak:['#CF4E1A','rgba(207,78,26,0.15)'],lift:['#bc6a43','rgba(188,106,67,0.15)'],run:['#5e8c54','rgba(94,140,84,0.15)'],bike:['#3f6e96','rgba(63,110,150,0.15)'],swim:['#3f6e96','rgba(63,110,150,0.15)'],hip:['#7e5e96','rgba(126,94,150,0.15)'],core:['#a6822f','rgba(166,130,47,0.15)']};
// Fallback for a tag with no palette entry. The old value was near-black text on a
// translucent-black chip — 1.01:1 on the dark day header, i.e. invisible. Any tag added
// to the engine without a MOD_PAL entry hit this. On-ink instead: 7.6:1 on the dark
// header and still legible on the bone week list.
// @ts-expect-error TS7006 Parameter 't' implicitly has an 'any' type.
function modTagsHTML(tags: any){return (tags||[]).filter(t=>t!=='rest').map(function(t: any){var p=MOD_PAL[t]||['#7d7668','rgba(125,118,104,0.12)'];return '<span class="wk-tag" style="color:'+p[0]+';background:'+p[1]+'">'+((tagMeta[t]&&tagMeta[t].label)||t)+'</span>';}).join('');}
function sessionLogProgress(day: any){
  const stored=getExWeights();var total=0,done=0;
  (day.sections||[]).forEach(function(sec: any){
    // A skipped block or item is not part of today's work, so it must not sit in the
    // denominator — otherwise skipping one thing makes "6 / 6 LOGGED" unreachable and
    // the counter reads as failure for the rest of the session.
    if(sec&&sec._skipped) return;
    (sec.items||[]).forEach(function(i: any){
    if(i&&i._skipped)return;
    var name=i.name||'';
    if(!exLoggable(name, i.detail||''))return;
    total++;
    var exKey=exStoreKey(name);
    var entries=(stored[exKey]&&stored[exKey].entries)||[];
    if(entries.some(function(e: any){return +e.week===+currentWeek&&entryDay(e)===currentDayKey;}))done++;
  });});
  return {done:done,total:total};
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { buildLogHTML, cardioFieldHTML, iaWheelFlush, iaWheelHTML, iaWheelInit, modTagsHTML, sessionLogProgress };
