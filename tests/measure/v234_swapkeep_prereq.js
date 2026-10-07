// V234 P-SWAPKEEP — measure m2: D213/D214 prerequisites (a)-(e). Read-only. Numbers only.
// Usage: node tests/measure/v234_swapkeep_prereq.js index.html [part: A|B|C|D|E|W|all]
//  A — rest/moved days: cardioSwapWrap render on rest days (B lattice seed 76308, every week) and on moved-in days; rest_cardio x swapTo paths.
//  B — every logs[key] writer, driven with a planted `parked` sibling: survives byte-identical?
//  C — Mark Done (handleDayStatus) with planted `parked`: entry identical but ts?
//  D — dynamic counterfactual: each reader's output with vs without planted `parked` on blank-swapped entries.
//  E — run dose form rendered from an entry holding 45 / 5: hidden input values + wheel attributes.
//  W — static: every whole-entry reader (Object.keys/entries/values, for-in, JSON.stringify) in a log-reading function.
// Oracle: `parked` is a hand constant (PARKED); "survives" = JSON.stringify equal before/after.
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all';
const ROOT = path.join(__dirname, '..', '..'); const CLOCK = '2026-10-03';
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'], DAYS = H.DAYS;
const ctOf = d => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
const J = JSON.stringify; function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
const PARKED = { run:{ run_dist:'5', run_pace:'9:00/mi', run_mins:'45', run_reps:'4', run_rep_time:'1:30' }, bike:{ bike_mins:'40' }, swim:{ swim_yards:'1000' } };
const BLANK_SWAP = (w, from, to) => ({ rpe:'', run_dist:'', run_pace:'', run_mins:'', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'', swapFrom:from, swapTo:to, week:w, ts:0 });
let IA, E, LS, REG, NOW;
function boot(){
  IA = H.load(FILE); const T = new Date(CLOCK + 'T12:00:00').getTime(); NOW = T; const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD;
  E = IA.eval; LS = IA.localStorage; REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal)/;
  function mk(id){ const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'', children:[],
      classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
      appendChild(c){ return c; }, removeChild(){}, insertBefore(c){ return c; }, scrollIntoView(){}, getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
      get innerHTML(){ return this._html; }, set innerHTML(h){ setHTML(this, String(h)); } }; return el; }
  function setHTML(el, h){
    const drop = k => { const c = REG.get(k); if(c){ c._kids.forEach(drop); REG.delete(k); } };
    el._kids.forEach(drop); el._kids = []; el._html = h;
    const re = /<(input|textarea|div|button|span|select)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(h))){ const id = m[3], attrs = m[2]+' '+m[4]; const c = mk(id);
      const v = /\bvalue="([^"]*)"/.exec(attrs); if(v) c.value = v[1].replace(/&quot;/g,'"');
      if(m[1]==='textarea'){ c.value = h.slice(re.lastIndex, h.indexOf('</textarea>', re.lastIndex)); }
      attrs.replace(/\bdata-([a-z]+)="([^"]*)"/g, (a,k,val)=>{ c.dataset[k]=val; });
      REG.set(id, c); el._kids.push(id);
      if(id==='cardioFields'){ const end = h.indexOf('id="cardioSwapLink"', re.lastIndex); const inner = h.slice(re.lastIndex, end<0?undefined:end);
        c._html = inner; const re2 = /\bid="([^"]+)"/g; let m2; while((m2 = re2.exec(inner))) c._kids.push(m2[1]); }
    }
  }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); if(NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };
  console.log('ia-version', IA.version, '| clock pinned', CLOCK);
}
const THROWS = {}; const safe = (lbl, f) => { try { return f(); } catch(e){ inc(THROWS, lbl+': '+String(e.message).slice(0,70)); } };
const goalObj = (id, extra) => Object.assign({id, label:id}, {mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}, extra||{});
function mkCfg(sports, f, ex, eq, rd, sd){
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1])); const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[1], s[2]); });
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:sports.map(s=>s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race?'2026-12-20':null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd }; }
function install(cfg, pid, start){
  const prog = IA.buildProgram(JSON.parse(J(cfg)));
  prog.id = pid; prog.name = pid; prog.created = 1; prog.startDate = start || '2026-09-28'; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(J(cfg)); prog.overlays = [];
  ['ia_logs_','ia_comp_','ia_hist_','ia_moves_'].forEach(k => LS.removeItem(k+pid));
  LS.setItem('ia_programs', J([prog])); LS.setItem('ia_active', pid);
  IA.ctx.__P = prog; E('activeProgId="'+pid+'"; activeProg=__P; currentWeek=1; progressViewId="'+pid+'";'); return prog; }
const logsOf = pid => JSON.parse(LS.getItem('ia_logs_'+pid)||'{}');
const setLogs = (pid, L) => LS.setItem('ia_logs_'+pid, J(L));
const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], EQ = ['commercial','crossfit','home_full','home_basic','bodyweight'], RESTS = [['sun','wed'],['sat','sun']];
boot();
const MANNY = JSON.parse(J(H.fixtures.HALF_MANNY));

// ─────────────── A ───────────────
if(PART==='all'||PART==='A'){
  console.log('\n════ A — rest / moved days vs the picker; rest_cardio x swapTo ════');
  const A = { cfg:0, crash:0, restOpen:0, restWrap:0, restThrow:0, restSkipped:0, weeks:0, movable:0, movableSingle:0, movedOpen:0, movedWrap:0, movedBySport:{} };
  for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS){
    const cfg = mkCfg([[g[0],g[1],g[2]]], f, ex, eq, rd, 76308); let p; try { p = install(cfg, 'p_a'); } catch(e){ A.crash++; continue; } A.cfg++;
    Object.keys(p.weeks).forEach(w => { E('currentWeek='+w); A.weeks++; const wk = p.weeks[w];
      ORDER.forEach(dk => { const d = wk[dk]; if(!d || !d.rest) return; A.restOpen++;
        REG.clear(); const before = J(THROWS); safe('openDetail(rest)', () => E('openDetail("'+dk+'", activeProg.weeks['+w+']["'+dk+'"])'));
        if(J(THROWS)!==before) A.restThrow++; if(/id="cardioSwapWrap"/.test((REG.get('detailBody')||{})._html||'')) A.restWrap++; });
      // moved-in day: a rest day in an untouched week takes any restMoveCandidates day; the moved day keeps its cardio
      const rests = ORDER.filter(d => wk[d] && wk[d].rest), cands = ORDER.filter(d => wk[d] && !wk[d].rest && !wk[d].moved && !wk[d].movedFrom);
      rests.forEach(r => cands.forEach(c => { A.movable++; const ct = ctOf(wk[c]); if(ct==='run'||ct==='bike'||ct==='swim'){ A.movableSingle++; inc(A.movedBySport, ct); } }));
    });
    // dynamic: actually move, W1 only, first rest day and each candidate, open the moved-in day
    E('currentWeek=1'); const w1 = p.weeks[1]; const r1 = ORDER.find(d => w1[d] && w1[d].rest);
    if(r1){ const snap = LS.getItem('ia_programs'); const cands = E('restMoveCandidates(1)').map(c => c.day);
      for(const c of cands){ LS.setItem('ia_programs', snap); LS.removeItem('ia_moves_p_a'); IA.ctx.__P = JSON.parse(snap)[0]; E('activeProg=__P');
        safe('applyRestMove', () => E('openRestSheet(1,"'+r1+'","move"); _restDraft.pick="'+c+'"; applyRestMove();'));
        const md = E('activeProg.weeks[1]["'+r1+'"]'); if(!md || md.rest) continue; A.movedOpen++;
        REG.clear(); safe('openDetail(moved)', () => E('openDetail("'+r1+'", activeProg.weeks[1]["'+r1+'"])'));
        if(/id="cardioSwapWrap"/.test((REG.get('detailBody')||{})._html||'')) A.movedWrap++; } }
  }
  console.log('configs '+A.cfg+' (B lattice, seed 76308) crash '+A.crash+' | weeks '+A.weeks);
  console.log('  rest days opened via openDetail '+A.restOpen+' | render cardioSwapWrap '+A.restWrap+' | threw '+A.restThrow);
  console.log('  (static) rest-day x movable-candidate pairs '+A.movable+' | candidate carries single-sport cardio (picker on moved-in day) '+A.movableSingle+' '+J(A.movedBySport));
  console.log('  (dynamic, W1, first rest day x every candidate) moved-in days opened '+A.movedOpen+' | render cardioSwapWrap '+A.movedWrap);
  // rest_cardio x swapTo: (i) rest sheet logs on wed, then a run day moves onto wed, open, swap to bike
  const cfg = mkCfg([['run','run_10k',{}],['bike','bike_base',{}]], 'balanced', 'intermediate', 'commercial', ['sun','wed'], 76308);
  const p = install(cfg, 'p_rc'); const w1 = p.weeks[1];
  safe('applyRestCardio', () => E('openRestSheet(1,"wed","cardio"); _restDraft.type="run"; _restDraft.mins=30; _restDraft.dist="3"; applyRestCardio();'));
  console.log('  path i: rest sheet run 30 min 3 mi on W1 wed: entry '+J(logsOf('p_rc').w1_wed));
  const runC = E('restMoveCandidates(1)').map(c=>c.day).filter(d => ctOf(w1[d])==='run');
  if(runC.length){ safe('applyRestMove', () => E('openRestSheet(1,"wed","move"); _restDraft.pick="'+runC[0]+'"; applyRestMove();'));
    REG.clear(); safe('openDetail', () => E('openDetail("wed", activeProg.weeks[1].wed)'));
    console.log('    moved '+runC[0]+' (run) onto wed: picker rendered '+/id="cardioSwapWrap"/.test((REG.get('detailBody')||{})._html||'')+' | entry before any input '+J(logsOf('p_rc').w1_wed));
    safe('setCardioSwap', () => E('setCardioSwap("bike")'));
    const e = logsOf('p_rc').w1_wed; console.log('    setCardioSwap(bike): entry '+J(e)+' | carries rest_cardio AND swapTo: '+!!(e && e.rest_cardio && e.swapTo)); }
  else console.log('    no run candidate to move');
  // (ii) static: writers of rest_cardio / swapTo, and whether any path can run applyRestCardio on a swapTo entry
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n');
  const wr = (re) => src.map((l,i) => re.test(l.replace(/\/\/.*$/,'')) ? i+1 : 0).filter(Boolean);
  console.log('  static: rest_cardio writers L'+wr(/rest_cardio\s*=/).join(',')+' | swapTo writers L'+wr(/swapTo\s*:/).join(',')+' | saveRestMoves callers L'+wr(/saveRestMoves\(/).join(',')+' | delete of a move L'+(wr(/delete\s+moves\[/).join(',')||'none'));
}

// ─────────────── B + C ───────────────
function entryKeyFor(p){ for(const w of [1]) for(const d of ORDER){ const x = p.weeks[w][d]; if(x && !x.rest && ctOf(x)==='run' && /long run/i.test(x.cardio.subtype||'')) return [w,d]; } }
if(PART==='all'||PART==='B'||PART==='C'){
  console.log('\n════ B — logs[key] writers with a planted `parked` sibling ════');
  const p = install(MANNY, 'p_b'); const [w, d] = entryKeyFor(p); const key = 'w'+w+'_'+d; E('currentWeek='+w);
  const firstEx = (() => { for(const s of (p.weeks[w][d].sections||[])) for(const it of (s.items||[])) if(it && it.name) return it.name; return 'Push-up'; })();
  const exKey = E('typeof exStoreKey==="function"?exStoreKey('+J(firstEx)+'):'+J(firstEx));
  const plant = (extra) => { const L = logsOf('p_b'); L[key] = Object.assign({ rpe:'6', run_dist:'', run_pace:'', run_mins:'', run_reps:'', run_rep_time:'', bike_mins:'40', swim_yards:'', notes:'n', swapFrom:'run', swapTo:'bike', week:w, ts:1, parked:JSON.parse(J(PARKED)) }, extra||{}); setLogs('p_b', L); };
  const res = []; const check = (name, site, fn, k) => { const before = J((logsOf('p_b')[k||key]||{}).parked); safe(name, fn); const after = (logsOf('p_b')[k||key]||{}).parked;
    res.push([name, site, J(after)===before ? 'KEPT byte-identical' : (after===undefined ? 'DROPPED' : 'CHANGED '+J(after))]); };
  REG.clear(); safe('openDetail', () => E('openDetail("'+d+'", activeProg.weeks['+w+']["'+d+'"])'));
  plant(); check('writeSetDraft', ':1273', () => E('writeSetDraft('+J(exKey)+',[5,5],[100,100],"")'));
  plant({ sets:{ [exKey]:{r:[5],w:[100],L:''} } }); check('clearSetDraft', ':1281', () => E('clearSetDraft('+J(exKey)+')'));
  plant(); check('saveLogs(getLogs()) round trip', ':1234', () => E('saveLogs(getLogs())'));
  plant(); check('persistLogFields (input listener / swap / Mark Done)', ':14691', () => E('persistLogFields("'+d+'")'));
  plant(); check('setCardioSwap("run")', ':14740', () => E('setCardioSwap("run")'));
  // applyRestCardio on a rest key carrying a planted parked (hand-planted; no app path writes swapTo there, see A)
  const rk = ORDER.find(x => p.weeks[w][x] && p.weeks[w][x].rest); const rkey = 'w'+w+'_'+rk;
  { const L = logsOf('p_b'); L[rkey] = { rpe:'', week:w, ts:1, parked:JSON.parse(J(PARKED)) }; setLogs('p_b', L); }
  check('applyRestCardio', ':1430', () => E('openRestSheet('+w+',"'+rk+'","cardio"); _restDraft.type="bike"; _restDraft.mins=20; applyRestCardio();'), rkey);
  res.forEach(r => console.log('  '+r[0].padEnd(52)+' '+r[1].padEnd(7)+' parked '+r[2]));
  console.log('  writers driven '+res.length+' | kept '+res.filter(r=>/KEPT/.test(r[2])).length+' | dropped '+res.filter(r=>/DROPPED/.test(r[2])).length);

  console.log('\n════ C — Mark Done with planted `parked` ════');
  install(MANNY, 'p_b'); E('currentWeek='+w); REG.clear(); safe('openDetail', () => E('openDetail("'+d+'", activeProg.weeks['+w+']["'+d+'"])'));
  REG.get('log_run_mins').value='45'; REG.get('log_run_dist').value='5'; E('persistLogFields("'+d+'")');
  { const L = logsOf('p_b'); L[key].parked = JSON.parse(J(PARKED)); setLogs('p_b', L); }
  const b4 = logsOf('p_b')[key]; safe('handleDayStatus', () => E('handleDayStatus("'+d+'","Long Run","complete")')); const af = logsOf('p_b')[key];
  const strip = o => { const c = Object.assign({}, o); delete c.ts; return c; };
  const diff = Object.keys(Object.assign({}, b4, af)).filter(k => J(b4[k])!==J(af[k]));
  console.log('  comp '+J((JSON.parse(LS.getItem('ia_comp_p_b')||'{}')[key]||{}).status)+' | before '+J(b4)+'\n  after  '+J(af)+'\n  identical but ts: '+(J(strip(b4))===J(strip(af)))+' | keys differing: '+J(diff));
}

// ─────────────── D ───────────────
if(PART==='all'||PART==='D'){
  console.log('\n════ D — reader outputs with vs without planted `parked` ════');
  const SLICE = [['MANNY', MANNY]]; for(const g of RUNG) for(const sd of [76308, 24865, 1234]) SLICE.push([g[0]+'|'+sd, mkCfg([['run',g[0],g[1]]], 'balanced', 'intermediate', 'commercial', ['sun','wed'], sd)]);
  SLICE.push(['swim_base|76308', mkCfg([['swim','swim_base',{}]], 'balanced', 'intermediate', 'commercial', ['sun','wed'], 76308)], ['bike_base|76308', mkCfg([['bike','bike_base',{}]], 'balanced', 'intermediate', 'commercial', ['sun','wed'], 76308)]);
  const R = {}; let entries = 0, swapped = 0, nonEmpty = {};
  const snapAll = () => { const o = {}; for(const [k,v] of REG) o[k] = v._html; return J(o); };
  for(const [nm, cfg] of SLICE){
    const p = install(cfg, 'p_d', '2026-08-03'); const tw = p.totalWeeks || Object.keys(p.weeks).length;
    // write entries: alternate cardio days credited / blank-swapped; snapshot each into ia_hist_
    const base = {}; let i = 0; const curW = Math.min(tw, 9);
    Object.keys(p.weeks).map(Number).filter(w => w<=curW).forEach(w => ORDER.forEach(dk => { const x = p.weeks[w][dk]; const ct = ctOf(x); if(!x || x.rest || !ct) return;
      E('currentWeek='+w); E('snapshotDay('+w+',"'+dk+'")'); const k = 'w'+w+'_'+dk; entries++;
      if(i++ % 2){ const to = ct==='bike'?'run':'bike'; base[k] = BLANK_SWAP(w, ct, to); base[k].ts = NOW - 86400000; base[k].rpe='6'; swapped++; }
      else base[k] = { rpe:'6', run_dist:ct==='run'?'4':'', run_pace:ct==='run'?'9:30/mi':'', run_mins:ct==='run'?'38':'', run_reps:'', run_rep_time:'', bike_mins:ct==='bike'?'50':'', swim_yards:ct==='swim'?'1200':'', notes:'', swapFrom:'', swapTo:'', week:w, ts:NOW - 86400000 }; }));
    const withP = JSON.parse(J(base)); Object.keys(withP).forEach(k => { if(withP[k].swapTo) withP[k].parked = JSON.parse(J(PARKED)); });
    const hist = JSON.parse(LS.getItem('ia_hist_p_d')||'{}'); IA.ctx.__H = hist;
    const firstSw = Object.keys(base).find(k => base[k].swapTo); const [fw, fd] = firstSw ? [+firstSw.match(/^w(\d+)_/)[1], firstSw.split('_')[1]] : [1,'mon'];
    const rk = ORDER.find(x => p.weeks[fw][x] && p.weeks[fw][x].rest);
    const READERS = {
      'renderWeekView (MILES)': () => { E('currentWeek='+fw); REG.clear(); E('renderWeekView()'); return snapAll(); },
      'seedFromPriorPrograms': () => J(E('seedFromPriorPrograms('+NOW+')')),
      'ladderWeekly': () => J(E('ladderWeekly(getLogs(),'+tw+')')),
      'renderProgressScreen (sums, has-entry, journal)': () => { REG.clear(); E('renderProgressScreen()'); return snapAll(); },
      'restMoveCandidates': () => J(E('restMoveCandidates('+fw+')')),
      'openDetail _hasLog nudge + form': () => { E('currentWeek='+fw); REG.clear(); E('openDetail("'+fd+'", activeProg.weeks['+fw+']["'+fd+'"])'); const h = (REG.get('detailBody')||{})._html||''; return J([/never marked/.test(h), h]); },
      'applyRestCardio (entry minus parked/ts)': () => { if(!rk) return 'no rest'; E('currentWeek='+fw); const L = JSON.parse(E('JSON.stringify(getLogs())')); L['w'+fw+'_'+rk] = Object.assign({}, L[firstSw]); E('saveLogs('+J(L)+')');
        E('openRestSheet('+fw+',"'+rk+'","cardio"); _restDraft.type="run"; _restDraft.mins=20; _restDraft.dist="2"; applyRestCardio();'); const e = Object.assign({}, E('getLogs()')['w'+fw+'_'+rk]); delete e.parked; delete e.ts; return J(e); },
      'persistLogFields :14723 derivation (entry minus parked/ts)': () => { E('currentWeek='+fw); REG.clear(); E('openDetail("'+fd+'", activeProg.weeks['+fw+']["'+fd+'"])'); E('persistLogFields("'+fd+'")'); const e = Object.assign({}, E('getLogs()')[firstSw]); delete e.parked; delete e.ts; return J(e); },
      '_benchmarkEntryFor (all weeks)': () => J(Array.from({length:tw}, (_,k) => E('_benchmarkEntryFor('+(k+1)+')'))),
      '_recoveryPaceEntry (every key)': () => { const L = E('getLogs()'); return J(Object.keys(L).map(k => IA.ctx.__K = k) && Object.keys(L).map(k => { IA.ctx.__K = k; return E('_recoveryPaceEntry(__K, getLogs()[__K], __H, '+tw+')'); })); },
      'runsByClass': () => J(E('runsByClass(getLogs(), __H, '+tw+')')),
      'easyEffortWeekly': () => J(E('easyEffortWeekly(getLogs(), __H, '+tw+')')),
      'plannedVsLogged': () => J(E('plannedVsLogged(getLogs(), __H, '+tw+')')),
      'easyVsPrescribed': () => J(E('easyVsPrescribed(getLogs(), __H, '+tw+')')),
      'refreshProgram(stored) weeks': () => { const s = JSON.parse(LS.getItem('ia_programs'))[0]; IA.ctx.__S = s; const r = E('refreshProgram(__S)'); return r ? J(r.weeks) : 'null'; },
    };
    for(const [rn, fn] of Object.entries(READERS)){ const o = R[rn] = R[rn] || { n:0, same:0, diff:0, err:0, nonEmpty:0, ex:null };
      const run = L => { setLogs('p_d', L); E('activeProg=__P'); try { return fn(); } catch(e){ return 'ERR '+String(e.message).slice(0,60); } };
      const a = run(JSON.parse(J(base))), b = run(JSON.parse(J(withP))); o.n++; const topP = JSON.parse(J(base)); Object.keys(topP).forEach(k => { if(topP[k].swapTo) Object.assign(topP[k], PARKED.run, PARKED.bike, PARKED.swim); }); const c = run(topP); if(c!==a) o.ctl=(o.ctl||0)+1;
      if(/^ERR/.test(a) || /^ERR/.test(b)){ o.err++; if(!o.ex) o.ex = nm+' '+a.slice(0,80)+' | '+b.slice(0,80); }
      else if(a===b) o.same++; else { o.diff++; if(!o.ex) o.ex = nm; }
      if(a && !/^(\[\]|\{\}|null|\[null(,null)*\])$/.test(a)) o.nonEmpty++; }
  }
  console.log('slice configs '+SLICE.length+' | entries written '+entries+' | blank-swapped entries carrying planted parked '+swapped);
  for(const [rn, o] of Object.entries(R)) console.log('  '+rn.padEnd(56)+' configs '+o.n+' identical '+o.same+' differ '+o.diff+' err '+o.err+' | non-empty output '+o.nonEmpty+' | control (parked values at TOP level) differs '+(o.ctl||0)+'/'+o.n+(o.ex?' | e.g. '+o.ex:''));
}

// ─────────────── E ───────────────
if(PART==='all'||PART==='E'){
  console.log('\n════ E — run dose form rendered from an entry with run_mins 45 / run_dist 5 ════');
  const DF = E('doseFromCardio'), CF = E('cardioFieldHTML'); const p = install(MANNY, 'p_e');
  const want = {}; for(const w of Object.keys(p.weeks)) for(const d of ORDER){ const x = p.weeks[w][d]; if(!x || x.rest || ctOf(x)!=='run') continue; const k = DF(x.cardio); const kk = k?k.k:'generic'; if(!want[kk]) want[kk] = [w,d,x.cardio]; }
  for(const [kk, [w,d,c]] of Object.entries(want)){
    const h = CF('run', { run_mins:'45', run_dist:'5', run_pace:'9:00/mi' }, DF(c), c.subtype||'');
    const inputs = (h.match(/<input\b[^>]*>/g)||[]).map(t => t.replace(/\s+/g,' ')); const wheels = (h.match(/<div class="iaw\b[^"]*"[^>]*>/g)||[]).map(t => t.replace(/\s+/g,' '));
    console.log('  '+kk+' ('+c.subtype+') inputs '+J(inputs)+'\n     wheel tags '+J(wheels.slice(0,4)));
  }
  // full path: stored entry -> openDetail -> hidden node values in the registry
  const [w,d] = entryKeyFor(p); const L = {}; L['w'+w+'_'+d] = { rpe:'', run_mins:'45', run_dist:'5', run_pace:'9:00/mi', week:+w, ts:1 }; setLogs('p_e', L); E('currentWeek='+w);
  REG.clear(); safe('openDetail', () => E('openDetail("'+d+'", activeProg.weeks['+w+']["'+d+'"])'));
  console.log('  openDetail W'+w+' '+d+' from stored 45/5: hidden log_run_mins="'+(REG.get('log_run_mins')||{}).value+'" log_run_dist="'+(REG.get('log_run_dist')||{}).value+'" | stored unchanged '+(J(logsOf('p_e'))===J(L)));
}

// ─────────────── W ───────────────
if(PART==='all'||PART==='W'){
  console.log('\n════ W — whole-entry readers (static, comments stripped) ════');
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n'); let cur = '(top)'; const body = {}, start = {};
  src.forEach((l,i) => { const m = /^(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(l) || /^(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>)/.exec(l); if(m){ cur = m[1]; start[cur] = i+1; } (body[cur] = body[cur] || []).push([i+1, l.replace(/\/\/.*$/,'')]); });
  const LOGFN = Object.keys(body).filter(f => body[f].some(([,l]) => /getLogs\(|getLogsFor\(|'ia_logs_'|\blogs\b|allLogs/.test(l)));
  const WHOLE = /Object\.(keys|entries|values|assign)\(|for\s*\(\s*(const|let|var)\s+\w+\s+in\b|JSON\.stringify\(|\.\.\.\s*(e|entry|lg|_le|logs)\b/;
  LOGFN.forEach(f => { const hits = body[f].filter(([,l]) => WHOLE.test(l)).map(([n,l]) => n+': '+l.trim().slice(0,110)); if(hits.length) console.log('  '+f+' (L'+start[f]+')\n    '+hits.join('\n    ')); });
  console.log('  log-touching functions scanned '+LOGFN.length);
}
console.log('\nTHROWS '+J(THROWS)); console.log('DONE');
