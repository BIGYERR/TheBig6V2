// V233 P-BIKEWHEEL — lattice before-picture (measure, Mode B). Read-only.
// Usage: node tests/measure/v233_bikewheel_lattice.js index.html [part: B|X|M|all]
// Part B: measure B's V232 lattice verbatim (16 goals x 7 focus x 3 exp x 5 equip x 2 rest x 3 seeds, clock 2026-10-03).
// Part X: multi-sport supplement (bike as cross-training next to a run or swim goal).
// Part M: HALF_MANNY-adjacent (the fixture with bike added).
// Oracles: form kind read off rendered HTML (type="number" id="log_bike_mins" vs class="iaw"); bounds are the emitted
// dose numbers vs the hand constant 599.99 min (9:59:59 = 9*60+59+59/60 min).
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all';
const CLOCK = '2026-10-03';
function pinned(){ const X = H.load(FILE); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
const IA = pinned(); console.log('ia-version', IA.version, '| clock pinned', CLOCK);
const CF = IA.eval('cardioFieldHTML'), DF = IA.eval('doseFromCardio');
const clone = o => JSON.parse(JSON.stringify(o)), DAYS = H.DAYS, ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const HMS_MAX = 9*60 + 59 + 59/60;
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
function formFor(d){ const c = d.cardio; const ct = ((c && c.type) || '').toLowerCase();
  if(!(ct==='run'||ct==='bike'||ct==='swim')) return { has:false, arr:Array.isArray(c) };
  const dose = DF(c); const html = CF(ct, {}, dose, c.subtype||''); return { has:true, ct, dose, html, sub:c.subtype||'', c }; }
const shapeOf = h => h.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/>[^<]*\d[^<]*</g,'>#<').replace(/\s+/g,' ').trim();
const minsIn = s => { let mx = 0; String(s||'').replace(/(\d+(?:\.\d+)?)\s*[- ]?min(?:ute)?s?\b/gi, (a,n)=>{ mx = Math.max(mx, +n); }); return mx; };
const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], EQ = ['commercial','crossfit','home_full','home_basic','bodyweight'];
const RESTS = [['sun','wed'],['sat','sun']], SEEDS = [76308, 24865, 1234];
// VERBATIM=1 reproduces measure B: its mkCfg put mileBest + baselineDist:'3' + baseline:'3mi' on EVERY sport's goal,
// and a bike goal reads baselineDist as its baseline (index.html:3356). VERBATIM=0 gives bike/swim goals only {id,label}.
let VERBATIM = 1;
const goalObj = (sp, id, extra) => Object.assign({id, label:id}, (VERBATIM||sp==='run')?{mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}:{}, extra||{});
function mkCfg(sports, f, ex, eq, rd, sd){   // sports: [[sport, id, extra], ...]
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[0], s[1], s[2]); });
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:sports.map(s=>s[0]), cardioGoals:cg,
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}
function sweep(tag, cfgs){
  const S = { cfg:0, crash:0, crashes:{}, days:0, rest:0, restBikeCfg:0, forms:0, bike:0, bikeBox:0, bikeWheel:0, seg:{}, shapes:{}, plan:[], over:[], nullMins:[], cardioArrBike:0, total:{} };
  const SEG = (dim,k) => inc(S.seg[dim] = S.seg[dim]||{}, k);
  for(const [lbl, cfg] of cfgs){
    let p; try { p = IA.buildProgram(cfg); } catch(e){ S.crash++; inc(S.crashes, lbl+': '+String(e.message).slice(0,60)); continue; }
    S.cfg++; const hasBikeType = cfg.cardioTypes.includes('bike');
    Object.keys(p.weeks||{}).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d) return; S.days++;
      if(d.rest){ S.rest++; if(hasBikeType) S.restBikeCfg++; return; }
      S.forms++;
      if(Array.isArray(d.cardio) && d.cardio.some(c => c && c.type==='bike')) S.cardioArrBike++;
      const f = formFor(d); if(!f.has || f.ct!=='bike') return;
      S.bike++;
      if(/<input type="number"[^>]*id="log_bike_mins"/.test(f.html)) S.bikeBox++;
      if(/class="iaw"[^>]*data-for="log_bike_mins"/.test(f.html)) S.bikeWheel++;
      const dk_ = f.dose ? f.dose.k + (f.dose.parsed?'(parsed)':'(emitted)') : 'null';
      const gl = lbl.split('|')[0];
      SEG('goal', gl); SEG('family', gl.startsWith('bike')&&!lbl.includes('+')?'bike goal':'cross-train ('+gl+')');
      SEG('subtype:dose', (f.sub||'(none)').replace(/ — Taper$/,' — Taper') + ' :: ' + dk_); SEG('dose.k', dk_);
      SEG('week', 'W'+w); SEG('focus', lbl.split('|')[1]); SEG('exp', lbl.split('|')[2]);
      inc(S.shapes, (f.dose?f.dose.k:'null') + ' :: ' + shapeOf(f.html));
      let pm = null; if(f.dose){ pm = f.dose.k==='time' ? f.dose.mins : f.dose.k==='reps_time' ? f.dose.reps*f.dose.mins : null; }
      const det = minsIn(f.c.detail);
      if(pm!=null) S.plan.push([pm, f.dose.k, gl, f.sub, w]); else S.nullMins.push([det, f.sub, gl, w]);
      if((pm!=null && pm>HMS_MAX) || det>HMS_MAX) S.over.push([gl, f.sub, 'W'+w, pm, det]);
    }));
  }
  console.log('\n════ '+tag+' ════');
  console.log('configs '+S.cfg+' crash '+S.crash+' '+JSON.stringify(S.crashes)+' | day entries '+S.days+' | rest '+S.rest+' | log forms '+S.forms);
  console.log('bike log forms '+S.bike+' = '+(100*S.bike/S.forms).toFixed(2)+'% of log forms | number box '+S.bikeBox+' | wheel '+S.bikeWheel+' | array cardio carrying bike (no field) '+S.cardioArrBike);
  console.log('rest days in configs whose cardioTypes include bike (rest-sheet surfaces, P-RESTWHEEL, report only): '+S.restBikeCfg+' of '+S.rest+' rest days');
  for(const dim of ['family','goal','dose.k','subtype:dose','exp','focus','week']){ const t = S.seg[dim]||{};
    console.log('  by '+dim+': '+Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v+' ('+(100*v/S.bike).toFixed(2)+'%)').join(' | ')); }
  console.log('  distinct rendered bike form shapes: '+Object.keys(S.shapes).length);
  Object.entries(S.shapes).forEach(([k,v]) => console.log('    '+v+'  '+k.slice(0,330)));
  const pl = S.plan.map(x=>x[0]).sort((a,b)=>a-b), q = p => pl.length ? pl[Math.min(pl.length-1, Math.floor(p*pl.length))] : '-';
  console.log('  planned minutes on dosed bike forms (time: mins; reps_time: reps x mins) n='+pl.length+' min '+pl[0]+' p10 '+q(.1)+' p50 '+q(.5)+' p90 '+q(.9)+' p99 '+q(.99)+' max '+pl[pl.length-1]+' | non-integer '+pl.filter(v=>v%1).length+' | >59 '+pl.filter(v=>v>59).length+' | >179 '+pl.filter(v=>v>179).length+' | >599.98 '+pl.filter(v=>v>HMS_MAX).length);
  const byK = {}; S.plan.forEach(x => { const r = byK[x[1]] = byK[x[1]] || [Infinity,-Infinity,0]; r[0]=Math.min(r[0],x[0]); r[1]=Math.max(r[1],x[0]); r[2]++; });
  console.log('  by dose.k (min,max,n): '+JSON.stringify(byK));
  const top = S.plan.slice().sort((a,b)=>b[0]-a[0])[0]; if(top) console.log('  max planned: '+JSON.stringify(top));
  const nm = S.nullMins.map(x=>x[0]); console.log('  null-dose forms n='+nm.length+' largest "N min" in detail: min '+Math.min(...nm)+' max '+Math.max(...nm)+' | subtypes '+JSON.stringify([...new Set(S.nullMins.map(x=>x[1]))]));
  console.log('  forms whose planned or detail minutes exceed 9:59:59: '+S.over.length+(S.over.length?' e.g. '+JSON.stringify(S.over.slice(0,3)):''));
  return S;
}
function* latticeB(){ for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of SEEDS)
  yield [g[1]+'|'+f+'|'+ex, mkCfg([[g[0],g[1],g[2]]], f, ex, eq, rd, sd)]; }
function* latticeX(){ // bike next to a run or swim goal; equipment commercial; all 5 bike goals
  const PAIRS = []; RUNG.forEach(r => BIKEG.forEach(b => PAIRS.push([['run',r[0],r[1]],['bike',b,{}]])));
  SWIMG.forEach(s => BIKEG.forEach(b => PAIRS.push([['swim',s[0],s[1]],['bike',b,{}]])));
  for(const pr of PAIRS) for(const f of FOC) for(const ex of EXPS) for(const rd of RESTS) for(const sd of SEEDS)
    yield [pr[0][1]+'+'+pr[1][1]+'|'+f+'|'+ex, mkCfg(pr, f, ex, 'commercial', rd, sd)]; }
if(PART==='all'||PART==='B') sweep('PART B — measure B lattice verbatim (single sport, baselineDist 3 on every goal)', latticeB());
if(PART==='all'||PART==='B0'){ VERBATIM = 0; sweep('PART B0 — same lattice, bike/swim goals carry only {id,label} (no baselineDist)', latticeB()); VERBATIM = 1; }
if(PART==='all'||PART==='X') sweep('PART X — multi-sport: run+bike (30 pairs) and swim+bike (25 pairs) x 7 focus x 3 exp x commercial x 2 rest x 3 seeds', latticeX());
if(PART==='all'||PART==='M'){
  console.log('\n════ PART M — HALF_MANNY-adjacent ════');
  console.log('HALF_MANNY fixture cardioTypes '+JSON.stringify(H.fixtures.HALF_MANNY.cardioTypes)+' goals '+JSON.stringify(Object.keys(H.fixtures.HALF_MANNY.cardioGoals||{})));
  for(const bg of BIKEG){ const c = clone(H.fixtures.HALF_MANNY); c.cardioTypes = (c.cardioTypes||[]).concat('bike'); c.cardioGoals = Object.assign({}, c.cardioGoals, {bike:{id:bg,label:bg}});
    let p; try { p = IA.buildProgram(c); } catch(e){ console.log('  +'+bg+' CRASH '+e.message); continue; }
    const rows = []; Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d||d.rest) return; const f = formFor(d); if(f.has&&f.ct==='bike') rows.push('W'+w+' '+dk+' '+f.sub+' '+JSON.stringify(f.dose)); }));
    console.log('  HALF_MANNY+'+bg+': weeks '+Object.keys(p.weeks).length+' bike forms '+rows.length+(rows.length?' e.g. '+rows.slice(0,4).join(' ; '):''));
  }
}
console.log('\nDONE');
