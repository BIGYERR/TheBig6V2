// V234 P-SWAPKEEP — measure, Mode A (prove) + before-picture. Read-only.
// Usage: node tests/measure/v234_swapkeep.js index.html [part: D|M|S|G|L|all]
//  D — reporter's case: HALF_MANNY (seed pinned), Long Run, type 45 min + 5 mi, swap to bike, swap back. Storage + form each step.
//  M — full swap matrix: planned sport/dose-kind x target, typed-only vs saved (handleDayStatus), swap, swap back, 3-hop, reopen.
//  S — static readers: every line reading the log fields / swap fields / ia_logs_, by enclosing top-level function,
//      and whether that function's body tests swapTo/swapFrom.
//  G — gate reach (tests/measure/v233_gate_reach.json) per function + gate lines touching these fields (g219_d167_pairs.js excluded by brief).
//  L — lattice reach (v233 measure B lattice, 10,080 configs): forms offering a swap by planned sport, subtype, dose kind, run fields at risk.
// Oracle: typed values are hand constants (45, 5, 9:00, 4, 1:30, 40, 1000); "survives" = stored string equals the typed constant.
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all';
const ROOT = path.join(__dirname, '..', '..');
const CLOCK = '2026-10-03';
function pinned(){ const X = H.load(FILE); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'], DAYS = H.DAYS;
const ctOf = d => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
const FIELDS = ['run_mins','run_dist','run_pace','run_reps','run_rep_time','bike_mins','swim_yards'];
const TYPED = { run_mins:'45', run_dist:'5', run_pace:'9:00', run_reps:'4', run_rep_time:'1:30', bike_mins:'40', swim_yards:'1000' };
const SPORT_OF = f => f.split('_')[0];

// ── shared VM with DOM registry stub (method of v233_bikewheel_reach.js part D) ──
let IA, E, LS, REG;
function boot(){
  IA = pinned(); E = IA.eval; LS = IA.localStorage; REG = new Map();
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
const safe = (lbl, f) => { try { return f(); } catch(e){ console.log('    ['+lbl+' threw: '+String(e.message).slice(0,90)+']'); } };
function install(cfg, pid){
  const prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  prog.id = pid; prog.name = pid; prog.created = 1; prog.startDate = '2026-09-28'; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(JSON.stringify(cfg)); prog.overlays = [];
  ['ia_logs_','ia_comp_','ia_hist_','ia_moves_'].forEach(k => LS.removeItem(k+pid));
  LS.setItem('ia_programs', JSON.stringify([prog])); LS.setItem('ia_active', pid);
  IA.ctx.__P = prog; E('activeProgId="'+pid+'"; activeProg=__P; currentWeek=1;'); return prog;
}
const formIds = () => ((REG.get('cardioFields')||{})._kids||[]).filter(id => /^log_(run|bike|swim)_/.test(id));
const formVals = () => { const o = {}; formIds().forEach(id => o[id.slice(4)] = (REG.get(id)||{}).value); return o; };
const stored = (pid, k) => { const L = JSON.parse(LS.getItem('ia_logs_'+pid)||'{}')[k]; if(!L) return null; const o = {}; FIELDS.concat(['swapFrom','swapTo']).forEach(f => { if(L[f]!==undefined && L[f]!=='') o[f]=L[f]; }); return o; };
const histKey = (pid) => Object.keys(JSON.parse(LS.getItem('ia_hist_'+pid)||'{}'));
const compOf = (pid, k) => (JSON.parse(LS.getItem('ia_comp_'+pid)||'{}'))[k] || null;
function open(dk){ REG.clear(); safe('openDetail', () => E('openDetail("'+dk+'", activeProg.weeks[currentWeek]["'+dk+'"])')); }
function typeAll(dk){ const typed = []; formIds().forEach(id => { const f = id.slice(4); if(TYPED[f]!=null){ REG.get(id).value = TYPED[f]; typed.push(f); } });
  safe('persist', () => E('persistLogFields("'+dk+'")')); return typed; }   // the 'input' listener body (:14157) is persistLogFields+updateDoseDerived
const swap = s => safe('setCardioSwap', () => E('setCardioSwap("'+s+'")'));

// ─────────────── D: reporter's case ───────────────
if(PART==='all'||PART==='D'){
  boot();
  console.log('\n════ D — reporter case: HALF_MANNY Long Run, 45 min + 5 mi, swap to bike, swap back ════');
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); console.log('fixture seed', cfg.seed, '| goal', JSON.stringify(cfg.cardioGoals&&Object.keys(cfg.cardioGoals)));
  const pid = 'p_manny'; const prog = install(cfg, pid);
  let wk = null, dk = null;
  for(const w of Object.keys(prog.weeks).map(Number).sort((a,b)=>a-b)){ for(const d of ORDER){ const x = prog.weeks[w][d]; if(x && !x.rest && ctOf(x)==='run' && /long run/i.test(x.cardio.subtype||'')){ wk=w; dk=d; break; } } if(dk) break; }
  E('currentWeek='+wk); const key = 'w'+wk+'_'+dk;
  console.log('Long Run at W'+wk+' '+dk+' subtype "'+prog.weeks[wk][dk].cardio.subtype+'" dose '+JSON.stringify(IA.eval('doseFromCardio')(prog.weeks[wk][dk].cardio))+' | log key ia_logs_'+pid+'.'+key);
  open(dk); console.log('  currentDayKey='+E('currentDayKey')+' wrap planned/active='+JSON.stringify((REG.get('cardioSwapWrap')||{}).dataset));
  console.log('  step0 open: form '+JSON.stringify(formVals())+' | stored '+JSON.stringify(stored(pid,key))+' | ia_hist_ keys '+JSON.stringify(histKey(pid)));
  REG.get('log_run_mins').value='45'; REG.get('log_run_dist').value='5'; safe('persist', () => E('persistLogFields("'+dk+'")'));
  console.log('  step1 typed 45/5 (input listener -> persistLogFields): form '+JSON.stringify(formVals())+' | stored '+JSON.stringify(stored(pid,key))+' | ia_hist_ keys '+JSON.stringify(histKey(pid)));
  // isolate WHICH line erases: render alone, then persist alone
  const fieldsBefore = JSON.stringify(stored(pid,key));
  E('(function(){const w=document.getElementById("cardioSwapWrap"); w.dataset.active="bike"; _curLogDose=null; document.getElementById("cardioFields").innerHTML=cardioFieldHTML("bike", getLogs()[logKey(currentWeek,currentDayKey)]||{}, null, _curLogSub);})()');
  console.log('  step2a render-only (innerHTML of cardioFields = bike field, no persist): form '+JSON.stringify(formVals())+' | log_run_mins in DOM='+!!E('document.getElementById("log_run_mins")')+' | stored '+JSON.stringify(stored(pid,key))+' (unchanged='+(JSON.stringify(stored(pid,key))===fieldsBefore)+')');
  safe('persist', () => E('persistLogFields("'+dk+'")'));
  console.log('  step2b persistLogFields after render: stored '+JSON.stringify(stored(pid,key)));
  // full path through the real function, from a fresh typed state
  install(cfg, pid); E('currentWeek='+wk); open(dk); REG.get('log_run_mins').value='45'; REG.get('log_run_dist').value='5'; safe('persist', () => E('persistLogFields("'+dk+'")'));
  swap('bike'); console.log('  step2 setCardioSwap("bike"): form '+JSON.stringify(formVals())+' | stored '+JSON.stringify(stored(pid,key)));
  swap('run');  console.log('  step3 setCardioSwap("run") back: form '+JSON.stringify(formVals())+' | stored '+JSON.stringify(stored(pid,key)));
  open(dk);     console.log('  step4 reopen: form '+JSON.stringify(formVals())+' | stored '+JSON.stringify(stored(pid,key))+' | ia_hist_ keys '+JSON.stringify(histKey(pid)));
  // saved first
  install(cfg, pid); E('currentWeek='+wk); open(dk); REG.get('log_run_mins').value='45'; REG.get('log_run_dist').value='5'; safe('persist', () => E('persistLogFields("'+dk+'")'));
  safe('handleDayStatus', () => E('handleDayStatus("'+dk+'","Long Run","complete")'));
  console.log('  SAVED path: after Mark Done ia_comp_ '+JSON.stringify(compOf(pid,key))+' stored '+JSON.stringify(stored(pid,key)));
  open(dk); swap('bike'); console.log('  SAVED then reopen+swap bike: stored '+JSON.stringify(stored(pid,key))+' comp '+JSON.stringify(compOf(pid,key)&&compOf(pid,key).status));
  swap('run'); console.log('  SAVED then swap back run: form '+JSON.stringify(formVals())+' stored '+JSON.stringify(stored(pid,key)));
  // just toggling the picker open (toggleCardioPicker) and tapping the ALREADY-ACTIVE chip
  install(cfg, pid); E('currentWeek='+wk); open(dk); REG.get('log_run_mins').value='45'; REG.get('log_run_dist').value='5'; safe('persist', () => E('persistLogFields("'+dk+'")'));
  swap('run'); console.log('  tap active chip "run" (no sport change): stored '+JSON.stringify(stored(pid,key)));
}

// ─────────────── M: matrix ───────────────
const goalObj = (id, extra) => Object.assign({id, label:id}, {mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}, extra||{});
function mkCfg(sports, f, ex, eq, rd, sd){
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[1], s[2]); });
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:sports.map(s=>s[0]), cardioGoals:cg,
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}
if(PART==='all'||PART==='M'){
  if(!IA) boot();
  console.log('\n════ M — swap matrix ════');
  const DF = IA.eval('doseFromCardio');
  // find one representative day per (planned sport, dose kind) across a few configs
  const SRC = [ ['HALF_MANNY', JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))],
    ['run_10k+bike', mkCfg([['run','run_10k',{}],['bike','bike_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['run_pace', mkCfg([['run','run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['run_base', mkCfg([['run','run_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['swim_base', mkCfg([['swim','swim_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['bike_ftp', mkCfg([['bike','bike_ftp',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)] ];
  const cells = {};
  for(const [nm, cfg] of SRC){ const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
    for(const w of Object.keys(p.weeks).map(Number).sort((a,b)=>a-b)) for(const d of ORDER){ const x = p.weeks[w][d]; const ct = ctOf(x); if(!x||x.rest||!ct) continue;
      const dose = DF(x.cardio); const kind = ct+':'+(ct==='run'?(dose?dose.k:'generic'):(dose?'dosed':'none'));
      if(!cells[kind]) cells[kind] = { nm, cfg, w, d, sub:x.cardio.subtype }; } }
  console.log('representative cells: '+Object.entries(cells).map(([k,c])=>k+'='+c.nm+'/W'+c.w+'/'+c.d+'/'+c.sub).join(' | '));
  const ROWS = []; let n = 0;
  for(const [kind, c] of Object.entries(cells)){ const P = kind.split(':')[0];
    for(const saved of [false, true]) for(const T of ['run','bike','swim'].filter(s => s!==P)) for(const hop of ['back','3hop','reopen','typeT']){
      const pid = 'p_m'+(n++); install(c.cfg, pid); E('currentWeek='+c.w); const key = 'w'+c.w+'_'+c.d;
      open(c.d); const typed = typeAll(c.d); const st0 = stored(pid,key);
      if(saved) safe('handleDayStatus', () => E('handleDayStatus("'+c.d+'","x","complete")'));
      if(saved) open(c.d);
      swap(T); const stT = stored(pid,key); let note = '';
      if(hop==='typeT'){ const t2 = typeAll(c.d); note = 'typed '+t2.join('+')+' on '+T; swap(P); }
      else if(hop==='back') swap(P);
      else if(hop==='3hop'){ const T2 = ['run','bike','swim'].find(s => s!==P && s!==T); swap(T2); swap(P); note = P+'>'+T+'>'+T2+'>'+P; }
      else if(hop==='reopen'){ open(c.d); note = 'reopen while swapped, form '+JSON.stringify(formVals()); swap(P); }
      const stB = stored(pid,key), fB = formVals();
      const surv = typed.filter(f => stT && stT[f]===TYPED[f]), lostT = typed.filter(f => !(stT && stT[f]===TYPED[f]));
      const rest = typed.filter(f => stB && stB[f]===TYPED[f]);
      ROWS.push({ kind, saved, T, hop, typed, afterSwap:stT, afterBack:stB, formBack:fB, surv, lostT, rest, comp: compOf(pid,key)&&compOf(pid,key).status, note });
    } }
  for(const r of ROWS) console.log('  '+r.kind.padEnd(16)+' '+(r.saved?'SAVED':'typed')+' ->'+r.T.padEnd(4)+' '+r.hop.padEnd(6)+' typed['+r.typed.join(',')+'] | on swap kept['+r.surv.join(',')+'] lost['+r.lostT.join(',')+'] stored '+JSON.stringify(r.afterSwap)+' | back: restored['+r.rest.join(',')+'] stored '+JSON.stringify(r.afterBack)+' form '+JSON.stringify(r.formBack)+(r.saved?' comp='+r.comp:'')+(r.note?' | '+r.note:''));
  const tot = ROWS.length, anyTyped = ROWS.filter(r=>r.typed.length), lostAll = anyTyped.filter(r=>r.lostT.length===r.typed.length), restoredAny = anyTyped.filter(r=>r.rest.length);
  console.log('MATRIX rows '+tot+' | rows with typed fields '+anyTyped.length+' | every typed field erased on the swap '+lostAll.length+' | any typed field restored on return '+restoredAny.length);
  const typeTrows = ROWS.filter(r=>r.hop==='typeT'); console.log('  typeT (target-sport value typed, then swap back): target value kept after back '+typeTrows.filter(r=>{ const f = r.T==='run'?null:(r.T==='bike'?'bike_mins':'swim_yards'); return f && r.afterBack && r.afterBack[f]===TYPED[f]; }).length+' / '+typeTrows.filter(r=>r.T!=='run').length+' non-run targets');
  const savedRows = ROWS.filter(r=>r.saved); console.log('  SAVED rows '+savedRows.length+' | comp status still "complete" after swap '+savedRows.filter(r=>r.comp==='complete').length+' | typed fields erased '+savedRows.filter(r=>r.typed.length && r.lostT.length===r.typed.length).length);
}

// ─────────────── S: static readers ───────────────
if(PART==='all'||PART==='S'){
  console.log('\n════ S — static readers (comments stripped per line) ════');
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n');
  const TOK = ['run_mins','run_dist','run_pace','run_reps','run_rep_time','bike_mins','swim_yards','swapFrom','swapTo','getLogs(','getLogsFor(',"'ia_logs_'",'cardioSwapWrap','dataset.active','dataset.planned'];
  const fnAt = []; let cur = '(top)', curStart = 0; const fnBody = {};
  src.forEach((l,i) => { const m = /^(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(l) || /^(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/.exec(l);
    if(m){ cur = m[1]; curStart = i; } fnAt[i] = cur; (fnBody[cur] = fnBody[cur] || []).push(l); });
  const strip = l => l.replace(/\/\/(?![^'"`]*['"`][^'"`]*$).*$/, '');
  const byTok = {}, byFn = {};
  src.forEach((l,i) => { const s = strip(l); TOK.forEach(t => { if(s.includes(t)){ inc(byTok, t); (byFn[fnAt[i]] = byFn[fnAt[i]] || { toks:new Set(), lines:[] }); byFn[fnAt[i]].toks.add(t); if(!byFn[fnAt[i]].lines.includes(i+1)) byFn[fnAt[i]].lines.push(i+1); } }); });
  console.log('token line counts: '+JSON.stringify(byTok));
  const FLD = /run_|bike_mins|swim_yards/;
  Object.entries(byFn).sort((a,b)=>a[1].lines[0]-b[1].lines[0]).forEach(([fn, o]) => {
    const body = fnBody[fn].map(strip).join('\n'); const swapAware = /swapTo|swapFrom/.test(body); const writes = /logs\[key\]=|saveLogs\(|setItem\('ia_logs_/.test(body);
    console.log('  '+fn.padEnd(28)+' L'+o.lines.join(',')+' | toks '+[...o.toks].join(',')+' | readsSwapFlag='+swapAware+' | writesLogs='+writes);
  });
  fs.writeFileSync(process.env.READERS_OUT || '/dev/null', JSON.stringify(Object.keys(byFn)));
}

// ─────────────── G: gate reach + gate pins ───────────────
if(PART==='all'||PART==='G'){
  console.log('\n════ G — gate reach (v233_gate_reach.json) + gate lines touching swap/log fields ════');
  const J = JSON.parse(fs.readFileSync(path.join(__dirname, 'v233_gate_reach.json'), 'utf8'));
  const gates = Object.keys(J.gates); console.log('reach map gates '+gates.length+' | candidate '+String(J.candidate).slice(0,60));
  const FNS = ['setCardioSwap','persistLogFields','buildLogHTML','cardioFieldHTML','handleDayStatus','openDetail','snapshotDay','getLogs','getLogsFor','saveLogs','doseDerived','updateDoseDerived','toggleCardioPicker','cardioSwapChip','applyRestCardio','refreshProgram','renderStatusFoot','statusFootHTML'];
  let extra = []; try { extra = JSON.parse(fs.readFileSync(process.env.READERS_OUT,'utf8')); } catch(e){}
  const all = [...new Set(FNS.concat(extra).filter(f => f!=='(top)'))];
  all.forEach(fn => { const hit = gates.filter(g => (J.gates[g].executed||[]).includes(fn)); console.log('  '+fn.padEnd(28)+' gates executing: '+String(hit.length).padStart(3)+(hit.length && hit.length<=12?'  '+hit.join(','):'')); });
  const gdir = path.join(ROOT, 'tests', 'gates'); const PIN = /setCardioSwap|swapTo|swapFrom|cardioSwap|data-active|dataset\.active|run_mins|run_dist|run_pace|run_reps|run_rep_time|bike_mins|swim_yards|ia_logs_|persistLogFields/;
  const files = fs.readdirSync(gdir).filter(f => f.endsWith('.js') && f!=='g219_d167_pairs.js').sort(); let hits = 0, fh = 0;
  files.forEach(f => { const L = fs.readFileSync(path.join(gdir,f),'utf8').split('\n'); const m = []; L.forEach((l,i) => { const s = l.replace(/^\s*\/\/.*$/,''); if(PIN.test(s)) m.push(i+1); });
    if(m.length){ fh++; hits += m.length; console.log('  GATE '+f+' lines '+m.length+': '+m.join(',')); } });
  console.log('gate files scanned '+files.length+' (g219_d167_pairs.js excluded by brief) | files touching '+fh+' | lines '+hits);
}

// ─────────────── L: lattice reach ───────────────
if(PART==='all'||PART==='L'){
  if(!IA) boot();
  console.log('\n════ L — swap reach on v233 measure B lattice ════');
  const DF = IA.eval('doseFromCardio'), CF = IA.eval('cardioFieldHTML');
  const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
  const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
  const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
  const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
  const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
  const EXPS = ['beginner','intermediate','advanced'], EQ = ['commercial','crossfit','home_full','home_basic','bodyweight'];
  const RESTS = [['sun','wed'],['sat','sun']], SEEDS = [76308, 24865, 1234];
  const S = { cfg:0, crash:0, forms:0, offer:0, arr:0, none:0, byPlanned:{}, bySub:{}, byKind:{}, fieldsAtRisk:{}, byGoal:{}, longRun:0 };
  for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of SEEDS){
    let p; try { p = IA.buildProgram(mkCfg([[g[0],g[1],g[2]]], f, ex, eq, rd, sd)); } catch(e){ S.crash++; continue; } S.cfg++;
    Object.keys(p.weeks).forEach(w => ORDER.forEach(dk => { const d = p.weeks[w][dk]; if(!d || d.rest) return; S.forms++;
      if(Array.isArray(d.cardio)){ S.arr++; return; } const ct = ctOf(d); if(!(ct==='run'||ct==='bike'||ct==='swim')){ S.none++; return; }
      S.offer++; inc(S.byPlanned, ct); inc(S.byGoal, g[1]+'::'+ct); const sub = d.cardio.subtype||'(none)'; inc(S.bySub, ct+'::'+sub);
      const dose = DF(d.cardio); const kind = ct==='run'?(dose?dose.k:'generic'):(dose?'dosed':'none'); inc(S.byKind, ct+':'+kind);
      if(/long run/i.test(sub)) S.longRun++;
      const ids = []; const h = CF(ct, {}, dose, d.cardio.subtype); h.replace(/id="log_((?:run|bike|swim)_[a-z_]+)"/g, (a,x) => { ids.push(x); });
      inc(S.fieldsAtRisk, ct+':['+[...new Set(ids)].sort().join(',')+']');
    })); }
  console.log('configs '+S.cfg+' crash '+S.crash+' | log forms (non-rest days) '+S.forms+' | single-sport cardio forms (picker offered: run,bike,swim) '+S.offer+' ('+(100*S.offer/S.forms).toFixed(2)+'%) | array cardio (no picker) '+S.arr+' | no cardio '+S.none);
  console.log('  by planned sport: '+JSON.stringify(S.byPlanned)+' | Long Run subtype forms '+S.longRun);
  console.log('  by dose kind: '+JSON.stringify(S.byKind));
  console.log('  stored fields on the planned form (erased by any sport change): '+JSON.stringify(S.fieldsAtRisk));
  const subs = Object.entries(S.bySub).sort((a,b)=>b[1]-a[1]); console.log('  by subtype ('+subs.length+' distinct): '+subs.map(([k,v])=>k+' '+v).join(' | '));
  console.log('  by goal::sport: '+Object.entries(S.byGoal).map(([k,v])=>k+' '+v).join(' | '));
}
console.log('\nDONE');
