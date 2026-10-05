// V232 P-RUNWHEEL measure pass (Mode A + B). Read-only.
// Part 1: reporter's case (W2 Thursday Pull, "RUN — LI · Planned 15 min @ 8:51/mi").
// Part 2: encounter rate of wheels / run number boxes per log form over a lattice.
// Part 3: envelope of prescribed run minutes, distances and target paces on dosed forms.
// Part 4: what the plan strip prints per dose kind.
// Oracles: the field kind is read from the rendered HTML (type="number" vs class="iaw"), the
// envelope from the emitted dose numbers; thresholds 59/99/179 min and 99 mi are hand constants.
// Usage: node tests/measure/v232_runwheel_lattice.js index.html [part] [limit]
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html';
const PART = process.argv[3] || 'all';
const LIMIT = +(process.argv[4] || 0);
const CLOCK = '2026-10-03';
function pinned(){ const X = H.load(FILE); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
const IA = pinned();
console.log('ia-version', IA.version, '| clock pinned', CLOCK);
const CF = IA.eval('cardioFieldHTML'), DF = IA.eval('doseFromCardio'), STRIP = IA.eval('_doseStripHTML');
const clone = o => JSON.parse(JSON.stringify(o));
const DAYS = H.DAYS, ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const txt = h => String(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const fmtP = s => s==null?'-':Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');

// ── form classification, read off the rendered HTML only ─────────────────────────────
function classify(html){
  const wheels = (html.match(/class="iaw" data-kind="(\w+)"/g)||[]).map(s=>s.match(/data-kind="(\w+)"/)[1]);
  const numBox = id => new RegExp('<input type="number"[^>]*id="'+id+'"').test(html);
  return { wheels, runMins:numBox('log_run_mins'), runDist:numBox('log_run_dist'), bikeMins:numBox('log_bike_mins'), swimYds:numBox('log_swim_yards') };
}
// mirrors buildLogHTML's gate: field only when day.cardio.type is run/bike/swim; dose = doseFromCardio
function formFor(day){
  const c = day.cardio; const ct = ((c && c.type) || '').toLowerCase();
  const has = ct==='run'||ct==='bike'||ct==='swim';
  if(!has) return { has:false, ct, arr:Array.isArray(c) };
  const dose = DF(c);
  const html = CF(ct, {}, dose, c.subtype||'');
  return { has:true, ct, dose, html, sub:c.subtype||'', cls:classify(html), c };
}

// ── PART 1: reporter ─────────────────────────────────────────────────────────────────
function part1(){
  console.log('\n════ PART 1 — REPORTER: W2 THU Pull, RUN — LI · Planned 15 min @ 8:51/mi ════');
  const cands = [];
  cands.push(['HALF_MANNY (harness fixture)', clone(H.fixtures.HALF_MANNY)]);
  const PRTbase = { name:'PRT TING', primaryPath:'event', cardioTypes:['run'], eventTargeted:true, raceDate:'2026-10-19',
    liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35', equipment:'full_gym', unit:'lbs',
    restDays:['sun','wed'], days:DAYS.slice(), bench:185, squat:245, deadlift:315, seed:24865,
    cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal', targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}} };
  cands.push(['PRT TING (v202_persistence_C.js cfg)', PRTbase]);
  const show = (name, cfg) => {
    let p; try { p = IA.buildProgram(clone(cfg)); } catch(e){ console.log(name, 'CRASH', e.message); return; }
    const d = p.weeks && p.weeks['2'] && p.weeks['2'].thu;
    console.log('\n-- '+name+' | weeks '+Object.keys(p.weeks||{}).length+' | startDate '+p.startDate);
    if(!d){ console.log('  W2 thu missing'); return; }
    const f = formFor(d);
    console.log('  W2 THU title: '+txt(d.title)+' | rest '+!!d.rest+' | cardio '+JSON.stringify(d.cardio && {type:d.cardio.type, subtype:d.cardio.subtype, dose:d.cardio.dose}));
    if(f.has) console.log('  strip: '+(f.dose?txt(STRIP(f.ct,f.dose,f.sub)):'(none: generic form)'));
    // every run day with a time dose of 15 min in this program
    const hits = [];
    Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const dd = p.weeks[w][dk]; if(!dd||dd.rest) return; const ff = formFor(dd); if(ff.has && ff.dose && ff.ct==='run') { const s = txt(STRIP('run',ff.dose,ff.sub)); if(/8:51/.test(s) || /\b15 min\b/.test(s)) hits.push('W'+w+' '+dk+' '+txt(dd.title).slice(0,40)+' :: '+s); } }));
    console.log('  run strips with 8:51 or 15 min: '+(hits.length?'\n    '+hits.join('\n    '):'none'));
  };
  cands.forEach(([n,c]) => show(n,c));
  // Search: pace-goal and race configs across mile bests for the exact strip on W2 thu with a Pull title
  console.log('\n-- search: exact strip "RUN — LI · Planned 15 min @ 8:51/mi" on W2 THU, title /Pull/');
  const goals = [['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_pace_goal',{targetDist:'1.5',targetMins:'12',targetSecs:'0'}],['run_base',{}],['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]];
  let tried = 0, exact = [], anyW2 = [], anyStrip = {};
  for(const g of goals) for(let mm=6; mm<=12; mm++) for(const ss of [0,15,30,45]) for(const rd of [['sun','wed'],['sat','sun'],['sun']]) {
    const cfg = Object.assign(clone(PRTbase), { name:'S', seed:24865, restDays:rd, raceDate: /run_(5k|10k|half|marathon)/.test(g[0])?'2026-12-06':null, eventTargeted:/run_(5k|10k|half|marathon)/.test(g[0]),
      cardioGoals:{run:Object.assign({id:g[0],label:g[0],mileBestMins:String(mm),mileBestSecs:String(ss),mileBestSrc:{kind:'entered'},baselineDist:'3',baseline:'3mi',paceUnit:'mi'},g[1])} });
    let p; try { p = IA.buildProgram(cfg); } catch(e){ continue; } tried++;
    Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const dd = p.weeks[w][dk]; if(!dd||dd.rest) return; const ff = formFor(dd); if(!(ff.has&&ff.dose&&ff.ct==='run')) return;
      const s = txt(STRIP('run',ff.dose,ff.sub));
      if(/LI/.test(s) && /15 min @ 8:51/.test(s)) { anyStrip[g[0]+' mile '+mm+':'+String(ss).padStart(2,'0')+' rest '+rd] = 'W'+w+' '+dk+' '+txt(dd.title).slice(0,30);
        if(w==='2'&&dk==='thu'){ (/pull/i.test(txt(dd.title))?exact:anyW2).push(g[0]+' mile '+mm+':'+String(ss).padStart(2,'0')+' rest '+rd+' :: '+txt(dd.title)+' :: '+s); } }
    }));
  }
  console.log('  configs tried '+tried+' | exact (W2 thu, Pull, LI 15 min @ 8:51): '+exact.length+' | W2 thu non-Pull: '+anyW2.length+' | LI 15 min @ 8:51 anywhere: '+Object.keys(anyStrip).length);
  exact.slice(0,10).forEach(s => console.log('    EXACT '+s));
  anyW2.slice(0,5).forEach(s => console.log('    W2THU '+s));
  Object.keys(anyStrip).slice(0,10).forEach(k => console.log('    ANY '+k+' -> '+anyStrip[k]));
  // print the form HTML (input elements) for the first exact hit or else the generic LI time form
  const pick = exact[0] || anyW2[0];
  console.log('\n-- rendered dose.k=time form, input/label elements, for an LI 15 min @ 8:51 dose');
  const html = CF('run', {}, {k:'time', mins:15, tgt:531}, 'Long Intervals');
  console.log('  [synthetic dose {k:time,mins:15,tgt:531} — real one printed below if found]');
  (html.match(/<(input|label)[^>]*>|<div class="f-sub">[^<]*<\/div>|<span class="ps-[a-z]+">[^<]*<\/span>/g)||[]).forEach(s => console.log('   '+s.replace(/<svg[\s\S]*?<\/svg>/g,'')));
  return pick;
}

// ── PART 2–4: lattice ────────────────────────────────────────────────────────────────
const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'];
const EQ = ['commercial','crossfit','home_full','home_basic','bodyweight'];
const RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 24865, 1234];
function mkCfg(g, f, ex, eq, rd, sd){
  const race = /^run_(5k|10k|half|marathon)$/.test(g[1]);
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:[g[0]],
    cardioGoals:{[g[0]]:Object.assign({id:g[1],label:g[1],mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},g[2])},
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
function lattice(){
  console.log('\n════ PART 2 — LATTICE ════');
  const dims = 'goals '+GOALS.length+' (run 6, bike 5, swim 5) x focus '+FOC.length+' x exp 3 x equip 5 x rest 2 x seed 3';
  const S = { cfg:0, crash:0, crashes:{}, days:0, rest:0, forms:0, arrCardio:0, noCardio:0,
    wheelForm:0, wheelInst:{}, runMinsBox:0, runDistBox:0, runEither:0, bikeBox:0, swimBox:0, hypo:0,
    seg:{} };
  const SEG = (dim, key, f) => { const t = S.seg[dim] = S.seg[dim]||{}; const r = t[key] = t[key]||{forms:0,wheel:0,mins:0,dist:0,either:0,hypo:0}; r.forms++; if(f.w) r.wheel++; if(f.m) r.mins++; if(f.d) r.dist++; if(f.m||f.d) r.either++; if(f.w||f.m||f.d) r.hypo++; };
  const ENV = { time:[], dist:[], reps_time:[], tgt:[], timeMax:null, distMax:null, distUnits:{}, doseKeys:{}, src:{}, kmDetail:0, rtMaxDist:null };
  const STRIPS = {};
  const t0 = Date.now(); let n = 0;
  for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of SEEDS){
    if(LIMIT && n>=LIMIT) break; n++;
    const cfg = mkCfg(g,f,ex,eq,rd,sd); let p;
    try { p = IA.buildProgram(cfg); } catch(e){ S.crash++; inc(S.crashes, g[1]+': '+String(e.message).slice(0,60)); continue; }
    S.cfg++;
    Object.keys(p.weeks||{}).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d) return; S.days++;
      if(d.rest){ S.rest++; return; }
      S.forms++;
      const fm = formFor(d);
      if(!fm.has){ if(fm.arr) S.arrCardio++; else S.noCardio++; }
      const c = fm.cls || {wheels:[], runMins:false, runDist:false, bikeMins:false, swimYds:false};
      const w0 = c.wheels.length>0;
      if(w0) S.wheelForm++; c.wheels.forEach(k => inc(S.wheelInst,k));
      if(c.runMins) S.runMinsBox++; if(c.runDist) S.runDistBox++; if(c.runMins||c.runDist) S.runEither++;
      if(c.bikeMins) S.bikeBox++; if(c.swimYds) S.swimBox++;
      if(w0||c.runMins||c.runDist) S.hypo++;
      const F = {w:w0, m:c.runMins, d:c.runDist};
      const dk_ = !fm.has ? (fm.arr?'(array cardio)':'(no cardio)') : (fm.ct+':'+(fm.dose?fm.dose.k:'null'));
      SEG('sport:dose.k', dk_, F);
      SEG('goal', g[1], F); SEG('focus', f, F); SEG('exp', ex, F); SEG('equip', eq, F); SEG('rest', rd.join(','), F);
      if(fm.has && fm.ct==='run') SEG('run subtype (run days only)', fm.sub+' | '+(fm.dose?fm.dose.k:'generic'), F);
      if(fm.has && fm.ct==='run' && fm.dose){
        const ds = fm.dose; inc(ENV.doseKeys, ds.k+':'+Object.keys(ds).sort().join(',')); inc(ENV.src, ds.k+':'+(ds.parsed?'parsed':'emitted'));
        const tag = { goal:g[1], sub:fm.sub, w:+w, weeks:Object.keys(p.weeks).length, day:dk, cfg:[f,ex,eq,rd.join(','),sd].join('|'), detail:String(fm.c.detail||'').slice(0,120) };
        if(ds.k==='time'){ ENV.time.push([ds.mins, g[1], fm.sub, +w]); if(!ENV.timeMax||ds.mins>ENV.timeMax.v) ENV.timeMax = Object.assign({v:ds.mins},tag); }
        if(ds.k==='dist'){ ENV.dist.push([ds.mi, g[1], fm.sub, +w]); if(!ENV.distMax||ds.mi>ENV.distMax.v) ENV.distMax = Object.assign({v:ds.mi},tag); }
        if(ds.k==='reps_time'){ ENV.reps_time.push([ds.mins*ds.reps, g[1], fm.sub, +w, ds.reps, ds.mins]); }
        if(ds.tgt!=null) ENV.tgt.push([ds.tgt, g[1], fm.sub, ds.k]);
        if(/\bkm\b|kilomet/i.test(fm.c.detail||'')) ENV.kmDetail++;
        const sk = ds.k; const s = txt(STRIP('run',ds,fm.sub)); STRIPS[sk] = STRIPS[sk]||{n:0, ex:{}}; STRIPS[sk].n++;
        const shape = s.replace(/\d+(\.\d+)?/g,'#'); if(Object.keys(STRIPS[sk].ex).length<6 || STRIPS[sk].ex[shape]) STRIPS[sk].ex[shape]=(STRIPS[sk].ex[shape]||s+' ×0').replace(/×\d+$/, m=>'×'+(+m.slice(1)+1));
      }
    }));
    if(n % 1000 === 0) console.error('progress', n, ((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  const pc = (a,b) => b? (100*a/b).toFixed(2)+'%' : 'n/a';
  console.log('METHOD lattice '+dims+' = '+n+' configs ('+S.cfg+' built, '+S.crash+' crashed) | runtime '+((Date.now()-t0)/1000).toFixed(0)+'s');
  Object.keys(S.crashes).forEach(k => console.log('  CRASH '+k+' x'+S.crashes[k]));
  console.log('day entries '+S.days+' | rest '+S.rest+' | LOG FORMS (non-rest days) '+S.forms+' | of which no cardio field '+S.noCardio+' (array cardio '+S.arrCardio+')');
  console.log('(a) forms with >=1 wheel today: '+S.wheelForm+' / '+S.forms+' = '+pc(S.wheelForm,S.forms)+' | wheel instances '+JSON.stringify(S.wheelInst));
  console.log('(b) forms with a run MINUTES number box: '+S.runMinsBox+' / '+S.forms+' = '+pc(S.runMinsBox,S.forms));
  console.log('(c) forms with a run DISTANCE number box: '+S.runDistBox+' / '+S.forms+' = '+pc(S.runDistBox,S.forms));
  console.log('(d) forms with either run number box: '+S.runEither+' / '+S.forms+' = '+pc(S.runEither,S.forms));
  console.log('(e) forms with >=1 wheel if every run mins/dist box became a wheel: '+S.hypo+' / '+S.forms+' = '+pc(S.hypo,S.forms)+'  (today '+pc(S.wheelForm,S.forms)+')');
  console.log('scope line: bike minutes number box '+S.bikeBox+' / '+S.forms+' = '+pc(S.bikeBox,S.forms)+' | swim yards number box '+S.swimBox+' / '+S.forms+' = '+pc(S.swimBox,S.forms));
  Object.keys(S.seg).forEach(dim => { console.log('\n-- segment: '+dim+'   [forms | wheel today | mins box | dist box | either | hypothetical >=1 wheel]');
    Object.keys(S.seg[dim]).sort().forEach(k => { const r = S.seg[dim][k]; console.log('  '+k.padEnd(48)+' '+String(r.forms).padStart(7)+' | '+r.wheel+' ('+pc(r.wheel,r.forms)+') | '+r.mins+' ('+pc(r.mins,r.forms)+') | '+r.dist+' ('+pc(r.dist,r.forms)+') | '+r.either+' ('+pc(r.either,r.forms)+') | '+r.hypo+' ('+pc(r.hypo,r.forms)+')'); }); });

  console.log('\n════ PART 3 — ENVELOPES (dosed run forms) ════');
  const env = (name, arr, unit) => { if(!arr.length){ console.log(name+': none'); return; }
    const v = arr.map(a=>a[0]).sort((a,b)=>a-b); const q = p => v[Math.min(v.length-1, Math.floor(p*v.length))];
    console.log(name+': n '+v.length+' | min '+v[0]+' | p10 '+q(.1)+' | p50 '+q(.5)+' | p90 '+q(.9)+' | p99 '+q(.99)+' | max '+v[v.length-1]+' '+unit);
    const hist = {}; arr.forEach(a => inc(hist, a[0])); console.log('  values: '+Object.keys(hist).sort((a,b)=>a-b).map(k=>k+':'+hist[k]).join(' '));
    const nonInt = arr.filter(a=>a[0]!==Math.round(a[0])).length; console.log('  non-integer values: '+nonInt+' / '+arr.length);
    return v; };
  const tv = env('dose.k=time minutes (strip value)', ENV.time, 'min');
  const over = (arr, t) => arr.filter(a=>a[0]>t).length;
  console.log('  > 59 min: '+over(ENV.time,59)+' / '+ENV.time.length+' | > 99 min: '+over(ENV.time,99)+' | > 179 min: '+over(ENV.time,179));
  const by = (arr, t, idx) => { const m = {}; arr.filter(a=>a[0]>t).forEach(a => inc(m, a[1]+' | '+a[2])); return Object.keys(m).sort().map(k=>k+' x'+m[k]).join('; ')||'(none)'; };
  console.log('  > 59 min by goal|subtype: '+by(ENV.time,59));
  console.log('  > 99 min by goal|subtype: '+by(ENV.time,99));
  const mxg = {}; ENV.time.forEach(a => { const k=a[1]+' | '+a[2]; if(!mxg[k]||a[0]>mxg[k][0]) mxg[k]=[a[0],a[3]]; });
  console.log('  max minutes per goal|subtype (week of first max): '+Object.keys(mxg).sort().map(k=>k+' = '+mxg[k][0]+' (W'+mxg[k][1]+')').join('; '));
  console.log('  MAX: '+JSON.stringify(ENV.timeMax));
  env('dose.k=dist miles (strip value)', ENV.dist, 'mi');
  console.log('  > 99 mi: '+over(ENV.dist,99)+' / '+ENV.dist.length+' | > 26.2: '+over(ENV.dist,26.2)+' | decimals >2 places: '+ENV.dist.filter(a=>Math.abs(a[0]*100-Math.round(a[0]*100))>1e-9).length);
  const mxd = {}; ENV.dist.forEach(a => { const k=a[1]+' | '+a[2]; if(!mxd[k]||a[0]>mxd[k][0]) mxd[k]=[a[0],a[3]]; });
  console.log('  max miles per goal|subtype: '+Object.keys(mxd).sort().map(k=>k+' = '+mxd[k][0]+' (W'+mxd[k][1]+')').join('; '));
  console.log('  MAX: '+JSON.stringify(ENV.distMax));
  env('dose.k=reps_time total work minutes (reps x mins)', ENV.reps_time, 'min');
  const rt = {}; ENV.reps_time.forEach(a => inc(rt, a[4]+'x'+a[5])); console.log('  reps x mins shapes: '+Object.keys(rt).sort().map(k=>k+':'+rt[k]).join(' '));
  const tg = ENV.tgt.map(a=>a[0]).sort((a,b)=>a-b);
  console.log('target pace (dose.tgt) on dosed run forms: n '+tg.length+' | min '+fmtP(tg[0])+' | p50 '+fmtP(tg[Math.floor(tg.length/2)])+' | max '+fmtP(tg[tg.length-1])+' /mi  (pace wheel 4:00–17:59)');
  console.log('  tgt < 240s: '+tg.filter(x=>x<240).length+' | tgt >= 1080s: '+tg.filter(x=>x>=1080).length);
  const tgk = {}; ENV.tgt.forEach(a => { const k=a[3]; tgk[k]=tgk[k]||[1e9,0]; tgk[k][0]=Math.min(tgk[k][0],a[0]); tgk[k][1]=Math.max(tgk[k][1],a[0]); }); console.log('  tgt by dose.k: '+Object.keys(tgk).map(k=>k+' '+fmtP(tgk[k][0])+'–'+fmtP(tgk[k][1])).join(' | '));
  console.log('dose key-sets: '+JSON.stringify(ENV.doseKeys));
  console.log('dose source: '+JSON.stringify(ENV.src)+' | run details mentioning km: '+ENV.kmDetail);

  console.log('\n════ PART 4 — PLAN STRIP per dose kind (shape with # for numbers: example ×count) ════');
  Object.keys(STRIPS).sort().forEach(k => { console.log('  dose.k='+k+' n '+STRIPS[k].n); Object.keys(STRIPS[k].ex).forEach(sh => console.log('     '+STRIPS[k].ex[sh])); });
  ['time','dist','reps_time','reps_dist'].forEach(k => { const ds = k==='time'?{k,mins:30,tgt:600}:k==='dist'?{k,mi:4,tgt:600}:k==='reps_time'?{k,reps:4,mins:5,tgt:480}:{k,reps:6,m:400,tgt:420};
    const h = CF('run',{},ds,'X'); console.log('  form '+k+' inputs: '+(h.match(/<input[^>]*>/g)||[]).map(s=>s.replace(/ style="[^"]*"/,'')).join('  ')+' | f-sub: '+(h.match(/<div class="f-sub"[^>]*>[^<]*<\/div>/g)||[]).map(txt).join(' / ')); });
}
if(PART==='all'||PART==='1') part1();
if(PART==='all'||PART==='2') lattice();

// ── PART 1b: widen the reporter search over focus/exp/equip/rest/seed/target at the mile bests that print 8:51 ──
function part1b(){
  console.log('\n════ PART 1b — REPORTER SEARCH, wide: W2 THU, title /pull/i, strip LI 15 min @ 8:51/mi ════');
  let tried=0, hit=[], stripOnly={}, titles={};
  const TGT=[['1.5','10','30'],['1.5','12','0'],['1.5','11','0'],['1','7','30'],['3','27','0'],['2','16','0']];
  for(const mm of [7,8,9]) for(const ss of [0,15,30,45]) for(const t of TGT) for(const f of FOC) for(const ex of EXPS) for(const eq of ['commercial','crossfit','full_gym']) for(const rd of [['sun','wed'],['sat','sun'],['sun'],['wed','sun'],['fri','sun']]) {
    const cfg = { name:'S', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:['run'], eventTargeted:false, raceDate:null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rd, days:DAYS.slice(), bench:185, squat:245, deadlift:315, seed:24865,
      cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:t[0],paceUnit:'mi',targetMins:t[1],targetSecs:t[2],mileBestMins:String(mm),mileBestSecs:String(ss),mileBestSrc:{kind:'entered'},baselineDist:'3',baseline:'3mi'}} };
    let p; try { p = IA.buildProgram(cfg); } catch(e){ continue; } tried++;
    const d = p.weeks['2'] && p.weeks['2'].thu; if(!d||d.rest) continue;
    const ff = formFor(d); if(!(ff.has&&ff.dose&&ff.ct==='run')) continue;
    const s = txt(STRIP('run',ff.dose,ff.sub));
    if(/LI · Planned 15 min @ 8:51\/mi/.test(s)){ const k='mile '+mm+':'+String(ss).padStart(2,'0')+' tgt '+t.join('/'); inc(stripOnly,k); inc(titles, txt(d.title));
      if(/pull/i.test(txt(d.title))) hit.push(k+' | '+f+' '+ex+' '+eq+' rest '+rd+' :: '+txt(d.title)+' :: '+s+'|'+JSON.stringify(d.cardio.dose)); }
  }
  console.log('  configs tried '+tried+' | W2 THU LI 15 @ 8:51 with /pull/ title: '+hit.length);
  console.log('  W2 THU LI 15 @ 8:51 by mile|target: '+JSON.stringify(stripOnly));
  console.log('  titles on those days: '+JSON.stringify(titles));
  hit.slice(0,8).forEach(s => console.log('    HIT '+s));
}
if(PART==='1b') part1b();

// ── PART 3b: the FREE dimension each dosed form asks for, implied by the prescription (mi x tgt, mins / tgt) ──
// Oracle: arithmetic on the emitted dose numbers (minutes = miles x pace sec / 60; miles = minutes x 60 / pace sec).
function part3b(){
  console.log('\n════ PART 3b — IMPLIED FREE DIMENSION on dosed run forms (run goals of the Part 2 lattice) ════');
  const IMPm = [], IMPd = [], CAP = {}; let noTgt = {time:0, dist:0}, n = 0;
  for(const g of GOALS.filter(x=>x[0]==='run')) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of SEEDS){
    const p = IA.buildProgram(mkCfg(g,f,ex,eq,rd,sd)); n++;
    Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d||d.rest) return; const fm = formFor(d); if(!(fm.has&&fm.ct==='run'&&fm.dose)) return; const ds = fm.dose;
      if(ds.cap!=null) inc(CAP, ds.k+' cap='+JSON.stringify(ds.cap)+' mins='+ds.mins);
      if(ds.k==='dist'){ if(ds.tgt) IMPm.push([ds.mi*ds.tgt/60, g[1], fm.sub, +w, ds.mi, ds.tgt]); else noTgt.dist++; }
      if(ds.k==='time'){ if(ds.tgt) IMPd.push([ds.mins*60/ds.tgt, g[1], fm.sub, +w, ds.mins, ds.tgt]); else noTgt.time++; }
    })); }
  const sum = (name, arr, ths) => { const v = arr.map(a=>a[0]).sort((a,b)=>a-b); const q = p => v[Math.min(v.length-1,Math.floor(p*v.length))].toFixed(2);
    console.log(name+': n '+v.length+' | min '+q(0)+' | p50 '+q(.5)+' | p90 '+q(.9)+' | p99 '+q(.99)+' | max '+v[v.length-1].toFixed(2));
    ths.forEach(t => { const o = arr.filter(a=>a[0]>t); const m = {}; o.forEach(a => inc(m, a[1]+' | '+a[2])); console.log('  > '+t+': '+o.length+' / '+arr.length+'  '+Object.keys(m).sort().map(k=>k+' x'+m[k]).join('; ')); });
    const mx = arr.reduce((b,a)=>a[0]>b[0]?a:b); console.log('  max row: '+JSON.stringify(mx)); };
  console.log('configs '+n);
  sum('dist forms: implied minutes (planned mi x tgt pace)', IMPm, [59,99,179]);
  sum('time forms: implied miles (planned min / tgt pace)', IMPd, [9.99,99]);
  console.log('no tgt (free dimension has no implied value): '+JSON.stringify(noTgt));
  console.log('dose.cap values: '+JSON.stringify(CAP).slice(0,1500));
}
if(PART==='3b') part3b();
