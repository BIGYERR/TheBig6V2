// V232 P-RUNWHEEL — code-side before-picture (measure, Mode B). Read-only.
// Usage: node tests/measure/v232_runwheel_code.js index.html
// Oracles: the stored-value table below is hand-typed (what a type="number" box can hold);
// expected wheel faces are computed here from decimal arithmetic, never from _iawParse.
const path = require('path');
const { load } = require(path.resolve(__dirname, '../harness.js'));
const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);
const E = IA.eval;
let nOut = 0; const P = (...a) => { nOut++; console.log(...a); };
P('ia-version', IA.version);

// ---- 1. Emission table: every cardioFieldHTML branch, blank entry and a filled entry ----
const DOSES = {
  time: {k:'time', mins:15, tgt:531},
  dist: {k:'dist', mi:3.1, tgt:531},
  reps_time: {k:'reps_time', reps:4, mins:5, tgt:480},
  reps_dist: {k:'reps_dist', reps:6, m:400, tgt:420},
  generic_null: null,
};
const FILLED = {run_mins:'15.333', run_dist:'3.456', run_pace:'8:51', run_rep_time:'1:52', run_reps:'5', bike_mins:'45', swim_yards:'1500'};
function inputs(html){
  const out = [];
  const re = /<input\b([^>]*)>/g; let m;
  while((m = re.exec(html))){
    const a = m[1], at = k => { const r = a.match(new RegExp('\\b'+k+'="([^"]*)"')); return r ? r[1] : null; };
    out.push({id:at('id'), type:at('type'), step:at('step'), min:at('min'), max:at('max'), ph:at('placeholder'), im:at('inputmode'), val:at('value')});
  }
  return out;
}
function wheels(html){ const r=[]; const re=/class="iaw" data-kind="([^"]+)" data-for="([^"]+)"/g; let m; while((m=re.exec(html))) r.push(m[1]+'->'+m[2]); return r; }
let emitN = 0;
for(const sport of ['run','bike','swim']){
  for(const [dk, dose] of Object.entries(DOSES)){
    if(sport!=='run' && dk!=='time' && dk!=='generic_null') continue;
    for(const [ek, e] of [['blank',{}],['filled',FILLED]]){
      const html = E(`cardioFieldHTML(${JSON.stringify(sport)}, ${JSON.stringify(e)}, ${JSON.stringify(dose)}, 'Easy Run')`);
      emitN++;
      P(`EMIT sport=${sport} dose=${dk} entry=${ek} inputs=${JSON.stringify(inputs(html))} wheels=${JSON.stringify(wheels(html))}`);
    }
  }
}
P('EMIT total forms rendered', emitN);

// ---- 2. Wheel parse/seed/commit on stored values a number box can hold ----
// Real markup from iaWheelHTML, real iaWheelInit, a retaining stub per column.
E(`window.requestAnimationFrame = function(f){ f(); return 1; };`);
// The harness VM has no Event constructor (_iawCommit dispatches new Event). Stub it so a commit can run.
P('HARNESS typeof Event before stub:', E('typeof Event'));
E(`globalThis.Event = function(t,o){ this.type=t; this.bubbles=!!(o&&o.bubbles); };`);
function seedOn(kind, val){
  const html = E(`iaWheelHTML(${JSON.stringify(kind)}, '__h', ${JSON.stringify(val)})`);
  const colsHtml = html.split('class="iaw-col"').slice(1);
  const res = E(`(function(){
    var colsHtml=${JSON.stringify(colsHtml)};
    var hidden={value:${JSON.stringify(String(val))}, fired:0, dispatchEvent:function(){ this.fired++; }};
    var cols=colsHtml.map(function(ch){
      var at=function(k){ var r=ch.match(new RegExp(k+'="([^"]*)"')); return r?r[1]:null; };
      var vs=[]; var re=/data-v="([^"]*)"/g, m; while((m=re.exec(ch))) vs.push(m[1]);
      var items=vs.map(function(v){ return {style:{}, getAttribute:function(k){ return k==='data-v'?v:null; }}; });
      return {scrollTop:0, style:{}, getAttribute:function(k){ return k==='data-wrap'?(at('data-wrap')||null):(k==='data-len'?at('data-len'):null); },
              querySelectorAll:function(s){ return s==='.iaw-it'?items:[]; }, addEventListener:function(){}};
    });
    var w={_iawOn:false, getAttribute:function(k){ return ({'data-kind':${JSON.stringify(kind)},'data-for':'__h'})[k]||null; }, querySelectorAll:function(s){ return s==='.iaw-col'?cols:[]; }};
    var oldGet=document.getElementById; document.getElementById=function(id){ return id==='__h'?hidden:oldGet.call(document,id); };
    try{
      iaWheelInit({querySelectorAll:function(s){ return s==='.iaw'?[w]:[]; }});
      var shown=cols.map(function(c){ return _iawSel(c); });
      var before=hidden.value; var threw=null;
      try{ _iawCommit(w); }catch(x){ threw=String(x); }
      return {fired:hidden.fired, parse:_iawParse(${JSON.stringify(kind)}, ${JSON.stringify(val)}), shown:shown, commitIfTouched:hidden.value, wroteOnSeed:false, threw:threw, before:before};
    } finally { document.getElementById=oldGet; }
  })()`);
  return res;
}
// hand-typed: stored value -> exact decimal it means (null = blank)
const STORED_DIST = ['', '3', '3.1', '3.10', '3.45', '3.456', '0.86', '.86', '13.1', '26.2', '99.99', '100', '150', '-1', '0', '1e1', '3,5', 'abc'];
const STORED_MINS = ['', '15', '7.5', '15.333', '15.5', '45.25', '0.5', '59', '60', '75', '99', '100', '150', '185', '-5', '7:30', '1e2'];
let parseN=0, exactN=0, lossN=0, dashN=0, clampN=0, throwN=0;
function face(kind, shown){ return E(`_iawFormat(${JSON.stringify(kind)}, ${JSON.stringify(shown)})`); }
for(const v of STORED_DIST){
  const r = seedOn('dist', v); parseN++;
  const want = (v.trim()===''||!isFinite(+v)) ? null : +v;           // the exact decimal a reader parses with +
  const got = r.shown[0]==='' ? null : +face('dist', r.shown);
  const tag = r.threw ? 'THROW '+r.threw : (want===null ? (got===null?'blank->dash':'MALFORMED->'+got) :
              got===null ? 'LANDS ON DASH' : (Math.abs(got-want)<1e-9 ? 'exact' : (want>99?'clamp':'lossy')));
  if(tag==='exact'||tag==='blank->dash') exactN++; else if(tag==='LANDS ON DASH') dashN++; else if(tag==='clamp') clampN++; else if(tag.startsWith('THROW')) throwN++; else lossN++;
  P(`SEED dist fired-on-touch=${r.fired} stored=${JSON.stringify(v)} parse=${JSON.stringify(r.parse)} shown=${JSON.stringify(r.shown)} wheelReads=${got} plusReads=${want} -> ${tag}; hidden after init=${JSON.stringify(r.before)} commit-if-touched=${JSON.stringify(r.commitIfTouched)}`);
}
P(`SEED dist summary: ${exactN} exact / ${lossN} lossy / ${dashN} dash / ${clampN} clamp / ${throwN} throw over ${STORED_DIST.length} stored values`);
// Minutes: no M:SS kind exists. Show what the two existing clock kinds do with a decimal-minute string.
for(const kind of ['pace','rept']){
  let dash=0;
  for(const v of STORED_MINS){
    const r = seedOn(kind, v);
    if(r.shown[0]==='' && v!=='') dash++;
    P(`SEED ${kind} stored-run_mins=${JSON.stringify(v)} parse=${JSON.stringify(r.parse)} shown=${JSON.stringify(r.shown)} commit-if-touched=${JSON.stringify(r.commitIfTouched)}${r.threw?' THROW '+r.threw:''}`);
  }
  P(`SEED ${kind} on decimal-minute strings: ${dash}/${STORED_MINS.filter(v=>v!=='').length} non-blank stored values land on the dash`);
}
// What decimal minutes are exactly representable on an M:SS grid: m + s/60 for integer s.
for(const v of STORED_MINS.filter(v=>v!==''&&isFinite(+v)&&+v>=0)){
  const sec = +v*60; P(`MSS ${v} min = ${sec.toFixed(4)} s -> ${Math.abs(sec-Math.round(sec))<1e-9?'exact on a seconds grid':'NOT on a seconds grid (nearest '+Math.floor(Math.round(sec)/60)+':'+String(Math.round(sec)%60).padStart(2,'0')+')'}`);
}

// ---- 3. Readers of run_mins / run_dist under each candidate commit format ----
const FORMS = {'decimal 7.5':'7.5', 'clock 7:30':'7:30', 'blank':'', 'dist 2.35':'2.35', 'dist 6.00':'6.00'};
for(const [k,v] of Object.entries(FORMS)){
  P(`READ ${k}: parseFloat=${parseFloat(v)} unary+=${+v} Number=${Number(v)} truthy=${!!v} _parseClock=${E(`_parseClock(${JSON.stringify(v)})`)} _paceStrToSec=${E(`_paceStrToSec(${JSON.stringify(v)})`)}`);
}
// doseDerived (the V148 derived pace, the _dd in persistLogFields) driven with each format
for(const dk of ['time','dist']){
  for(const mins of ['', '7.5', '7:30', '15', '15:00']){
    for(const dist of ['', '1', '1.00']){
      const d = E(`JSON.stringify(doseDerived(${JSON.stringify(DOSES[dk])}, {mins:${JSON.stringify(mins)}, dist:${JSON.stringify(dist)}, reps:'', rep:''}))`);
      P(`DD dose=${dk} mins=${JSON.stringify(mins)} dist=${JSON.stringify(dist)} -> ${d}`);
    }
  }
}
// ---- 4. Wheel spec as built ----
P('SPEC', E(`JSON.stringify(_IAW_SPEC)`), 'REPS', E('_IAW_REPS'));
for(const kind of ['dist','pace','rept']) P(`ROWS ${kind}`, E(`JSON.stringify(_IAW_SPEC.${kind}.cols.map(function(c){return {rows:_iawRows(c).length, wraps:_iawWraps(c), dom:_iawList(c).length};}))`));
P('FORMAT pace blank-left', JSON.stringify(E(`_iawFormat('pace',['','30'])`)), 'pace 7,30', JSON.stringify(E(`_iawFormat('pace',['7','30'])`)), 'dist 6,0,0', JSON.stringify(E(`_iawFormat('dist',['6','0','0'])`)), "dec branch unused? fmt values:", E(`JSON.stringify(Object.keys(_IAW_SPEC).map(function(k){return _IAW_SPEC[k].fmt;}))`));
if(nOut < 20) { console.log('FAILED: too little output'); process.exit(1); }
console.log('DONE lines', nOut);
// ---- 5. persistLogFields on a dist-dosed form with distance left blank (V148 stamp at the _dd.dist line) ----
try{
  const r = E(`(function(){
    var els={}; var mk=function(id){ return {id:id, value:'', dataset:{}, style:{}}; };
    var oldGet=document.getElementById; document.getElementById=function(id){ return els[id]||null; };
    ['log_run_mins','log_run_dist'].forEach(function(id){ els[id]=mk(id); });
    els.log_run_mins.value='30'; els.log_run_dist.value='';
    _curLogDose={k:'dist', mi:3.1, tgt:531};
    var oldSnap=snapshotDay; snapshotDay=function(){};
    try{ persistLogFields('thu'); var k=logKey(currentWeek,'thu'); var e=getLogs()[k]; return JSON.stringify({run_mins:e.run_mins, run_dist:e.run_dist, run_pace:e.run_pace}); }
    finally{ document.getElementById=oldGet; snapshotDay=oldSnap; _curLogDose=null; }
  })()`);
  P('PERSIST dose=dist mi=3.1 typed mins=30 dist blank ->', r);
}catch(x){ P('PERSIST drive FAILED (measurement, not a finding):', String(x).slice(0,200)); }
console.log('DONE2');
