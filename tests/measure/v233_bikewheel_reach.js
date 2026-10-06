// V233 P-BIKEWHEEL — reach follow-up (measure, Mode B). Read-only. Closes three UNKNOWNs of measure_bikewheel.md.
// Usage: node tests/measure/v233_bikewheel_reach.js index.html [part: D|S|R|IB|IX|all]
//  D  — dynamic reproduction in the VM with a DOM registry stub: rest-sheet bike sum -> "Training anyway?" move -> openDetail,
//       and run->bike setCardioSwap (what the bike field shows, what happens to run_mins).
//  S  — measure B lattice (10,080 configs): every run/swim cardio day is a reachable swap to bike; render the swapped bike field.
//  R  — move reach: rest days in bike configs (B bike goals + X multi-sport) whose week holds a movable day that would put a
//       bike field on the rest key (bike day direct, or run/swim day via the swap picker).
//  IB/IX — cfg.injury sweep (6 regions x {protect,workaround} + knee halfstep = 13 states) on B (seed 76308 only) and X (3 seeds);
//       counts "Cross-Train" bike days, dose kind, minutes; oracle for minutes = the UNINJURED same-day run's emitted dose.
// Oracles: field kind and seeded value are read off rendered HTML; the stored value is computed by hand (600 + 30.5).
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all';
const CLOCK = '2026-10-03';
function pinned(){ const X = H.load(FILE); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
const IA = pinned(); console.log('ia-version', IA.version, '| clock pinned', CLOCK, '| part', PART);
const CF = IA.eval('cardioFieldHTML'), DF = IA.eval('doseFromCardio');
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'], DAYS = H.DAYS;
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], EQ = ['commercial','crossfit','home_full','home_basic','bodyweight'];
const RESTS = [['sun','wed'],['sat','sun']], SEEDS = [76308, 24865, 1234];
const goalObj = (sp, id, extra) => Object.assign({id, label:id}, {mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}, extra||{});
function mkCfg(sports, f, ex, eq, rd, sd){
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[0], s[1], s[2]); });
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:sports.map(s=>s[0]), cardioGoals:cg,
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}
function* latticeB(seeds){ for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of (seeds||SEEDS))
  yield [g[1]+'|'+f+'|'+ex, mkCfg([[g[0],g[1],g[2]]], f, ex, eq, rd, sd)]; }
function* latticeX(){ const PAIRS = []; RUNG.forEach(r => BIKEG.forEach(b => PAIRS.push([['run',r[0],r[1]],['bike',b,{}]])));
  SWIMG.forEach(s => BIKEG.forEach(b => PAIRS.push([['swim',s[0],s[1]],['bike',b,{}]])));
  for(const pr of PAIRS) for(const f of FOC) for(const ex of EXPS) for(const rd of RESTS) for(const sd of SEEDS)
    yield [pr[0][1]+'+'+pr[1][1]+'|'+f+'|'+ex, mkCfg(pr, f, ex, 'commercial', rd, sd)]; }
const ctOf = d => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
const isBox = h => /<input type="number" id="log_bike_mins"[^>]*>/.test(h);
const valOf = (h,id) => { const m = new RegExp('<(?:input|textarea)\\b[^>]*\\bid="'+id+'"[^>]*>').exec(h); if(!m) return null; const v = /\bvalue="([^"]*)"/.exec(m[0]); return v ? v[1].replace(/&quot;/g,'"') : ''; };

// ─────────────────────────────── D: dynamic reproduction ───────────────────────────────
if(PART==='all'||PART==='D'){
  console.log('\n════ D — dynamic reproduction (VM, DOM registry stub) ════');
  const REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal)/;
  function mk(id){ const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'',
      classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
      get innerHTML(){ return this._html; }, set innerHTML(h){ setHTML(this, String(h)); } }; return el; }
  function setHTML(el, h){
    const drop = k => { const c = REG.get(k); if(c){ c._kids.forEach(drop); REG.delete(k); } };
    el._kids.forEach(drop); el._kids = []; el._html = h;
    const re = /<(input|textarea|div|button|span|select)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(h))){ const id = m[3], attrs = m[2]+' '+m[4]; const c = mk(id);
      const v = /\bvalue="([^"]*)"/.exec(attrs); if(v) c.value = v[1].replace(/&quot;/g,'"');
      if(m[1]==='textarea'){ const t = h.slice(re.lastIndex, h.indexOf('</textarea>', re.lastIndex)); c.value = t; }
      attrs.replace(/\bdata-([a-z]+)="([^"]*)"/g, (a,k,val)=>{ c.dataset[k]=val; });
      REG.set(id, c); el._kids.push(id);
      if(id==='cardioFields'){ const end = h.indexOf('id="cardioSwapLink"', re.lastIndex); const inner = h.slice(re.lastIndex, end<0?undefined:end);
        c._html = inner;
        const re2 = /\bid="([^"]+)"/g; let m2; while((m2 = re2.exec(inner))) c._kids.push(m2[1]); }
    }
  }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); if(NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };
  const E = IA.eval, LS = IA.localStorage;
  const cfg = mkCfg([['run','run_10k',{}],['bike','bike_base',{}]], 'balanced', 'intermediate', 'commercial', ['sun','wed'], 76308);
  const prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  prog.id = 'p_repro'; prog.name = 'REPRO'; prog.created = 1; prog.startDate = '2026-09-28'; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(JSON.stringify(cfg)); prog.overlays = [];
  LS.setItem('ia_programs', JSON.stringify([prog]));
  IA.ctx.__P = prog; E('activeProgId="p_repro"; activeProg=__P; currentWeek=1;');
  const w1 = prog.weeks[1]; console.log('cfg run_10k+bike_base | balanced | intermediate | commercial | rest sun,wed | seed 76308 | startDate 2026-09-28 (Mon), clock Sat 2026-10-03 = W1');
  console.log('W1 grid: '+ORDER.map(d => d+':'+(w1[d].rest?'REST':(ctOf(w1[d])||'-')+'/'+((w1[d].cardio&&w1[d].cardio.subtype)||''))).join(' | '));
  const safe = (lbl, f) => { try { return f(); } catch(e){ console.log('  ['+lbl+' threw after its writes: '+String(e.message).slice(0,80)+']'); } };
  console.log('restDayEligible(1,wed)='+E('restDayEligible(1,"wed")'));
  // Step 1: rest sheet, Bike, 600 min (sheet max), then "Log more" 30.5 (onchange stores +this.value)
  safe('applyRestCardio#1', () => E('openRestSheet(1,"wed","cardio"); _restDraft.type="bike"; _restDraft.mins=+"600"; applyRestCardio();'));
  safe('applyRestCardio#2', () => E('openRestSheet(1,"wed","cardio"); _restDraft.type="bike"; _restDraft.mins=+"30.5"; applyRestCardio();'));
  const L1 = JSON.parse(LS.getItem('ia_logs_p_repro')||'{}'); console.log('after 2 rest-sheet logs: ia_logs_.w1_wed = '+JSON.stringify(L1.w1_wed)+' | hand sum 600+30.5 = 630.5');
  const cands = E('restMoveCandidates(1)').map(c=>c.day); console.log('restMoveCandidates(1) = '+JSON.stringify(cands)+' (dest key w1_wed is NOT checked for an existing log)');
  const runC = cands.filter(d => ctOf(w1[d])==='run'), bikeC = cands.filter(d => ctOf(w1[d])==='bike');
  console.log('  movable bike-cardio days '+JSON.stringify(bikeC)+' | movable run-cardio days '+JSON.stringify(runC));
  function openAndRead(dk, tag){ REG.clear(); const day = E('activeProg.weeks[1]["'+dk+'"]');
    safe('openDetail', () => E('openDetail("'+dk+'", activeProg.weeks[1]["'+dk+'"])'));
    const body = (REG.get('detailBody')||{})._html || '';
    console.log('  '+tag+': openDetail(wed) day.rest='+!!day.rest+' movedFrom='+day.movedFrom+' cardio='+ctOf(day)+'/'+(day.cardio&&day.cardio.subtype)
      +' | bike field present='+isBox(body)+' value="'+valOf(body,'log_bike_mins')+'" | plan strip='+/Planned/.test((REG.get('cardioFields')||{})._html||'')+' | "logged but never marked" nudge='+/never marked/.test(body)); return body; }
  // Path A: move a BIKE day onto wed
  if(bikeC.length){ const snap = LS.getItem('ia_programs');
    safe('applyRestMove', () => E('openRestSheet(1,"wed","move"); _restDraft.pick="'+bikeC[0]+'"; applyRestMove();'));
    openAndRead('wed', 'PATH A move bike day '+bikeC[0]+'->wed');
    // survives a reboot: refreshProgram from the persisted program
    const stored = JSON.parse(LS.getItem('ia_programs'))[0]; IA.ctx.__S = stored;
    const rp = safe('refreshProgram', () => E('refreshProgram(__S)')); if(rp){ IA.ctx.__R = rp; E('activeProg=__R'); const d = rp.weeks[1].wed; console.log('  after refreshProgram(stored): w1.wed rest='+!!d.rest+' movedFrom='+d.movedFrom+' cardio='+ctOf(d)); openAndRead('wed', 'PATH A after reboot'); }
    // Path A2: blur the box without typing — the 'input' listener does not fire; persistLogFields only runs on input/status
    const before = JSON.stringify(JSON.parse(LS.getItem('ia_logs_p_repro')).w1_wed);
    safe('persist', () => E('persistLogFields("wed")'));
    console.log('  persistLogFields (status tap / any input event) rewrites w1_wed: before '+before+' -> after '+JSON.stringify(JSON.parse(LS.getItem('ia_logs_p_repro')).w1_wed));
    // reset for path B
    LS.setItem('ia_programs', snap); LS.removeItem('ia_moves_p_repro'); LS.removeItem('ia_hist_p_repro'); LS.setItem('ia_logs_p_repro', JSON.stringify(L1));
    IA.ctx.__P = JSON.parse(snap)[0]; E('activeProg=__P;');
  }
  // Path B: move a RUN day onto wed, then "Did a different activity?" -> Bike
  if(runC.length){
    safe('applyRestMove', () => E('openRestSheet(1,"wed","move"); _restDraft.pick="'+runC[0]+'"; applyRestMove();'));
    openAndRead('wed', 'PATH B move run day '+runC[0]+'->wed');
    safe('setCardioSwap', () => E('setCardioSwap("bike")'));
    const fh = (REG.get('cardioFields')||{})._html||'';
    console.log('  PATH B setCardioSwap(bike): bike box='+isBox(fh)+' value="'+valOf(fh,'log_bike_mins')+'" strip='+/Planned/.test(fh)+' | stored w1_wed now '+JSON.stringify(JSON.parse(LS.getItem('ia_logs_p_repro')).w1_wed));
  }
  // Q3: run->bike swap on an untouched run day, with run_mins typed first
  const runDays = ORDER.filter(d => !w1[d].rest && ctOf(w1[d])==='run' && !E('activeProg.weeks[1]["'+d+'"]').movedFrom && d!=='wed');
  const rd = runDays[runDays.length-1];
  if(rd){ REG.clear(); E('activeProg=__P'); const body = (safe('openDetail', () => E('openDetail("'+rd+'", activeProg.weeks[1]["'+rd+'"])')), (REG.get('detailBody')||{})._html||'');
    const dose = DF(w1[rd].cardio); console.log('\n  Q3 run day w1_'+rd+' '+w1[rd].cardio.subtype+' dose '+JSON.stringify(dose)+' | ids in cardioFields: '+JSON.stringify((REG.get('cardioFields')||{})._kids));
    ['log_run_mins','log_run_dist','log_run_pace'].forEach(id => { const el = REG.get(id); if(el) el.value = id==='log_run_mins'?'45':id==='log_run_dist'?'5':''; });
    safe('persist', () => E('persistLogFields("'+rd+'")'));
    const k = 'w1_'+rd; const pick = o => o && {run_mins:o.run_mins, run_dist:o.run_dist, bike_mins:o.bike_mins, swapFrom:o.swapFrom, swapTo:o.swapTo};
    console.log('  typed run 45 min / 5 mi, persisted: '+JSON.stringify(pick(JSON.parse(LS.getItem('ia_logs_p_repro'))[k])));
    safe('swap', () => E('setCardioSwap("bike")'));
    let fh = (REG.get('cardioFields')||{})._html||'';
    console.log('  setCardioSwap(bike): bike box='+isBox(fh)+' value="'+valOf(fh,'log_bike_mins')+'" strip='+/Planned/.test(fh)+' wheel='+/class="iaw"/.test(fh)+' | _curLogDose='+JSON.stringify(E('_curLogDose'))+' | stored '+JSON.stringify(pick(JSON.parse(LS.getItem('ia_logs_p_repro'))[k])));
    safe('swap', () => E('setCardioSwap("run")'));
    fh = (REG.get('cardioFields')||{})._html||'';
    console.log('  setCardioSwap(run) back: log_run_mins value="'+valOf(fh,'log_run_mins')+'" log_run_dist value="'+valOf(fh,'log_run_dist')+'" | stored '+JSON.stringify(pick(JSON.parse(LS.getItem('ia_logs_p_repro'))[k])));
    // reopen after a saved bike swap
    safe('swap', () => E('setCardioSwap("bike")')); const el = REG.get('log_bike_mins'); if(el) el.value = '40'; safe('persist', () => E('persistLogFields("'+rd+'")'));
    REG.clear(); safe('openDetail', () => E('openDetail("'+rd+'", activeProg.weeks[1]["'+rd+'"])')); fh = (REG.get('cardioFields')||{})._html||'';
    console.log('  reopen after saved bike swap (40): bike box='+isBox(fh)+' value="'+valOf(fh,'log_bike_mins')+'" strip='+/Planned/.test(fh)+' _curLogDose='+JSON.stringify(E('_curLogDose')));
  }
  // planned bike day: swap away and back restores the dose strip
  const bd = ORDER.find(d => !w1[d].rest && ctOf(w1[d])==='bike');
  if(bd){ REG.clear(); safe('openDetail', () => E('openDetail("'+bd+'", activeProg.weeks[1]["'+bd+'"])')); safe('swap', () => E('setCardioSwap("run")')); safe('swap', () => E('setCardioSwap("bike")'));
    const fh = (REG.get('cardioFields')||{})._html||''; console.log('  bike day w1_'+bd+' swap run->bike back: strip='+/Planned/.test(fh)+' dose='+JSON.stringify(E('_curLogDose'))); }
}

// ─────────────────────────────── S: swap reach on lattice B ───────────────────────────────
if(PART==='all'||PART==='S'){
  console.log('\n════ S — run/swim -> bike swap reach on measure B lattice (10,080 configs) ════');
  const S = { cfg:0, crash:0, forms:0, run:0, swim:0, bike:0, arr:0, other:0, swapBox:0, swapStrip:0, swapWheel:0, back:0, backStrip:0, byGoalFam:{} };
  for(const [lbl, cfg] of latticeB()){
    let p; try { p = IA.buildProgram(cfg); } catch(e){ S.crash++; continue; } S.cfg++;
    Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d || d.rest) return; S.forms++;
      if(Array.isArray(d.cardio)){ S.arr++; return; }
      const ct = ctOf(d); const sub = (d.cardio&&d.cardio.subtype)||'';
      if(ct==='run'||ct==='swim'){ S[ct]++; inc(S.byGoalFam, lbl.split('_')[0]+' goal :: '+ct+' day');
        const h = CF('bike', {}, null, sub); if(isBox(h)) S.swapBox++; if(/Planned/.test(h)) S.swapStrip++; if(/class="iaw"/.test(h)) S.swapWheel++; }
      else if(ct==='bike'){ S.bike++; const dose = DF(d.cardio); const h = CF('bike', {}, dose, sub); S.back++; if(/Planned/.test(h)) S.backStrip++; }
      else S.other++;
    }));
  }
  console.log('configs '+S.cfg+' crash '+S.crash+' | log forms (non-rest days) '+S.forms+' | cardio run '+S.run+' swim '+S.swim+' bike '+S.bike+' array '+S.arr+' none/other '+S.other);
  console.log('reachable swaps INTO bike (picker offers run,bike,swim on every run/swim day): '+(S.run+S.swim)+' = '+(100*(S.run+S.swim)/S.forms).toFixed(2)+'% of log forms');
  console.log('  swapped bike field: number box '+S.swapBox+' | plan strip '+S.swapStrip+' | wheel '+S.swapWheel+' (dose=null by setCardioSwap)');
  console.log('  by goal family: '+JSON.stringify(S.byGoalFam));
  console.log('planned bike days swapped away and back: '+S.back+' | strip restored '+S.backStrip+' (null-dose INT has none)');
}

// ─────────────────────────────── R: rest-move reach ───────────────────────────────
function restReach(tag, gen){
  const R = { cfg:0, crash:0, rest:0, bikeRest:0, anyMovable:0, bikeDay:0, bikeDayDosed:0, swapRoute:0, either:0, byRest:{}, byGoal:{} };
  for(const [lbl, cfg] of gen){ if(!cfg.cardioTypes.includes('bike')) continue;
    let p; try { p = IA.buildProgram(cfg); } catch(e){ R.crash++; continue; } R.cfg++;
    Object.keys(p.weeks).forEach(w => { const wk = p.weeks[w]; const rests = ORDER.filter(d => wk[d] && wk[d].rest); const train = ORDER.filter(d => wk[d] && !wk[d].rest);
      const bikeDays = train.filter(d => ctOf(wk[d])==='bike'), rsDays = train.filter(d => ctOf(wk[d])==='run'||ctOf(wk[d])==='swim');
      rests.forEach(rd => { R.rest++; R.bikeRest++; if(train.length) R.anyMovable++;
        if(bikeDays.length){ R.bikeDay++; if(bikeDays.some(d => DF(wk[d].cardio))) R.bikeDayDosed++; }
        if(rsDays.length) R.swapRoute++; if(bikeDays.length||rsDays.length){ R.either++; inc(R.byRest, cfg.restDays.join(',')); inc(R.byGoal, lbl.split('|')[0]); } }); });
  }
  console.log('\n════ R — '+tag+' ════');
  console.log('configs with bike in cardioTypes '+R.cfg+' crash '+R.crash+' | rest days (rest sheet can write bike_mins on any past/today one) '+R.bikeRest);
  console.log('  rest days whose week has >=1 movable training day (week untouched): '+R.anyMovable+' ('+(100*R.anyMovable/R.bikeRest).toFixed(2)+'%)');
  console.log('  ... a bike-cardio day (bike field opens directly on the rest key): '+R.bikeDay+' ('+(100*R.bikeDay/R.bikeRest).toFixed(2)+'%), of which with an emitted dose (strip) '+R.bikeDayDosed);
  console.log('  ... a run/swim-cardio day (bike field via swap picker): '+R.swapRoute+' ('+(100*R.swapRoute/R.bikeRest).toFixed(2)+'%) | either route: '+R.either+' ('+(100*R.either/R.bikeRest).toFixed(2)+'%)');
  console.log('  either by rest pattern: '+JSON.stringify(R.byRest));
  console.log('  either by goal: '+JSON.stringify(R.byGoal));
}
if(PART==='all'||PART==='R'){ restReach('move reach, measure B lattice bike goals (verbatim)', latticeB()); restReach('move reach, X multi-sport (run+bike, swim+bike)', latticeX()); }

// ─────────────────────────────── I: injury cross-train sweep ───────────────────────────────
const INJ = []; ['knee','ankle','hip','lowback','shoulder','elbow'].forEach(r => ['protect','workaround'].forEach(t => INJ.push([r+'/'+t, {region:r, tier:t}]))); INJ.push(['knee/halfstep', {region:'knee', tier:'workaround', halfstep:true}]);
function injSweep(tag, gen){
  const I = { cfg:0, builds:0, crash:0, runDays:0, ct:0, ctBike:0, ctBikeNonBikeGoal:0, k:{}, byState:{}, byPair:{}, byExp:{}, byWeek:{}, mins:[], match:0, matchN:0, mism:[], strip:{}, box:0, otherBikeCT:{} };
  for(const [lbl, cfg] of gen){
    let base; try { base = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch(e){ I.crash++; continue; } I.cfg++;
    for(const [st, inj] of INJ){
      let p; try { p = IA.buildProgram(Object.assign(JSON.parse(JSON.stringify(cfg)), {injury:inj})); } catch(e){ I.crash++; continue; } I.builds++;
      Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d || d.rest || Array.isArray(d.cardio)) return;
        const b = base.weeks[w] && base.weeks[w][dk]; const bct = ctOf(b);
        if(bct==='run') I.runDays++;
        if(!(d.cardio && d.cardio.subtype==='Cross-Train')) return; I.ct++;
        if(ctOf(d)!=='bike'){ inc(I.otherBikeCT, st+' -> '+ctOf(d)); return; }
        I.ctBike++; if(!/^bike_/.test(lbl.split('|')[0]) ) I.ctBikeNonBikeGoal++;
        const dose = DF(d.cardio); const kk = dose ? dose.k+(dose.parsed?'(parsed)':'(emitted)') : 'null'; inc(I.k, kk);
        inc(I.byState, st+' ['+bct+' replaced]'); inc(I.byPair, lbl.split('|')[0]); inc(I.byExp, lbl.split('|')[2]); inc(I.byWeek, 'W'+w);
        const m = dose && dose.k==='time' ? dose.mins : null; if(m!=null) I.mins.push(m);
        const h = CF('bike', {}, dose, d.cardio.subtype); if(isBox(h)) I.box++; inc(I.strip, (/<[^>]*>([^<]*Planned[^<]*)</.exec(h.replace(/<svg[\s\S]*?<\/svg>/g,''))||[])[1] ? 'strip' : 'no strip');
        // oracle: the uninjured same-day run's emitted dose (time -> mins; dist/reps -> not comparable)
        const bd = bct==='run' ? DF(b.cardio) : bct==='swim' ? DF(b.cardio) : null;
        if(bd && bd.k==='time'){ I.matchN++; if(bd.mins===m) I.match++; else if(I.mism.length<6) I.mism.push([lbl, st, 'W'+w, dk, (b.cardio.subtype||''), 'base '+bd.mins, 'xtrain '+m]); }
      }));
    }
  }
  const ms = I.mins.slice().sort((a,b)=>a-b), q = p => ms.length ? ms[Math.min(ms.length-1, Math.floor(p*ms.length))] : '-';
  console.log('\n════ '+tag+' ════');
  console.log('configs '+I.cfg+' x '+INJ.length+' injury states = '+I.builds+' injured builds, crash '+I.crash+' | states: '+INJ.map(x=>x[0]).join(','));
  console.log('Cross-Train days '+I.ct+' | bike Cross-Train days '+I.ctBike+' | of those on a config whose first goal is not a bike goal: '+I.ctBikeNonBikeGoal+' | non-bike Cross-Train: '+JSON.stringify(I.otherBikeCT));
  console.log('  bike Cross-Train forms: number box '+I.box+' | strip '+JSON.stringify(I.strip)+' | dose kind '+JSON.stringify(I.k));
  console.log('  minutes (time dose) n='+ms.length+' min '+ms[0]+' p10 '+q(.1)+' p50 '+q(.5)+' p90 '+q(.9)+' max '+ms[ms.length-1]+' | ==35 (minsOf fallback value) '+ms.filter(v=>v===35).length+' | >59 '+ms.filter(v=>v>59).length+' | >180 '+ms.filter(v=>v>180).length+' | non-integer '+ms.filter(v=>v%1).length);
  console.log('  oracle: uninjured same-day time dose comparable n='+I.matchN+', xtrain mins == base mins '+I.match+(I.mism.length?' | mismatches e.g. '+JSON.stringify(I.mism):''));
  for(const [k,v] of [['state',I.byState],['config goal',I.byPair],['exp',I.byExp],['week',I.byWeek]]) console.log('  by '+k+': '+Object.entries(v).sort((a,b)=>b[1]-a[1]).map(([a,b])=>a+' '+b).join(' | '));
}
if(PART==='all'||PART==='IB') injSweep('IB — injury sweep, measure B lattice, seed 76308 only (3,360 configs)', latticeB([76308]));
if(PART==='all'||PART==='IX') injSweep('IX — injury sweep, X multi-sport (6,930 configs)', latticeX());
// ─────────────── V: freeze carve-out — can an injury variant turn a base REST key into a training day? ───────────────
// refreshProgram's freeze takes the LIVE day for a touched key with no ia_hist_ snapshot when an injury overlay covers the
// week (index.html ~16100). applyRestCardio writes a log but no snapshot. So the rest key flips iff the injured build has a
// non-rest day where the base has a rest day. Counted directly.
if(PART==='all'||PART==='V'){
  const V = { cfg:0, builds:0, crash:0, rest:0, flip:0, flipBike:0, ex:[] };
  const gens = [['B seed 76308', latticeB([76308])], ['X', latticeX()]];
  for(const [gt, gen] of gens) for(const [lbl, cfg] of gen){
    let base; try { base = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch(e){ V.crash++; continue; } V.cfg++;
    for(const [st, inj] of INJ){ let p; try { p = IA.buildProgram(Object.assign(JSON.parse(JSON.stringify(cfg)), {injury:inj})); } catch(e){ V.crash++; continue; } V.builds++;
      Object.keys(base.weeks).forEach(w => ORDER.forEach(dk => { const b = base.weeks[w][dk]; if(!b || !b.rest) return; V.rest++;
        const d = p.weeks[w] && p.weeks[w][dk]; if(d && !d.rest){ V.flip++; if(ctOf(d)==='bike') V.flipBike++; if(V.ex.length<5) V.ex.push([gt, lbl, st, 'W'+w, dk]); } })); }
  }
  console.log('\n════ V — base rest key vs injured variant (B seed 76308 + X) ════');
  console.log('configs '+V.cfg+' injured builds '+V.builds+' crash '+V.crash+' | base rest-day keys x states '+V.rest+' | injured variant non-rest on a base rest key '+V.flip+' (bike '+V.flipBike+')'+(V.ex.length?' e.g. '+JSON.stringify(V.ex):''));
}
console.log('\nDONE');
