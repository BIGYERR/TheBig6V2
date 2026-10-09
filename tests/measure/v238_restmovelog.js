// V238 P-RESTMOVELOG — measure m1, before-picture on V237. Read-only.
// Usage: node tests/measure/v238_restmovelog.js index.html [part: R|C|O|S|L|all] [lattice-size: small|full]
//  R — reporter-shape case at seed 76308 (HALF_MANNY) then a form-kind matrix: rest-sheet jog -> "Training anyway?" move ->
//      open moved-in form -> first input / Log / Done. Stored ia_logs_ entry + readers at each step.
//  C — item 1c: a day swapped away (swapTo / parked) with nothing on the arriving sport: offered? what moving it orphans.
//  O — item 1d: other orders the sheet allows (Log more, jog after move, undo of a move).
//  S — static: every line reading/writing the keys at stake, by enclosing function; writer call sites by surface.
//  L — lattice: counts with denominators.
// Oracle: jog values are hand constants (37 min, 3.7 mi, 1370 yd, RPE 7); "kept" = stored value equal to the constant.
// Session typed values are hand constants (5.2 mi, 45 min, 1500 yd, RPE 8). Dates by hand: startDate Mon 2026-09-28.
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all', LSIZE = process.argv[4] || 'full';
const ROOT = path.join(__dirname, '..', '..');
const START = '2026-09-28';
let T = new Date('2026-10-04T12:00:00').getTime();
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'], DAYS = H.DAYS;
const dateOf = (w, d) => { const x = new Date(START + 'T12:00:00'); x.setDate(x.getDate() + (w-1)*7 + ORDER.indexOf(d)); return x.getTime(); };
const ctOf = d => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
const JOG = { run:{type:'run',mins:37,dist:'3.7',rpe:7}, runnodist:{type:'run',mins:37,dist:'',rpe:7}, bike:{type:'bike',mins:37,dist:'',rpe:7},
  bikedist:{type:'bike',mins:37,dist:'9.5',rpe:7}, swim:{type:'swim',mins:37,dist:'1370',rpe:7}, walk:{type:'walk',mins:37,dist:'',rpe:7} };
const KEYS = ['rest_cardio','rest_type','rest_mins','rpe','run_dist','run_mins','run_pace','bike_mins','swim_yards','notes','swapFrom','swapTo','parked'];

let IA, E, LS, REG;
function boot(){
  IA = H.load(FILE); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  IA.ctx.Date = FD; E = IA.eval; LS = IA.localStorage; REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal)/;
  function mk(id){ const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'',
      classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){},
      appendChild(){}, removeChild(){},
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
      if(m[1]==='button'){ const close = h.indexOf('</button>', re.lastIndex); c.textContent = h.slice(re.lastIndex, close).replace(/<[^>]+>/g,''); }
      REG.set(id, c); el._kids.push(id);
      if(id==='cardioFields'){ const end = h.indexOf('id="cardioSwapLink"', re.lastIndex); const inner = h.slice(re.lastIndex, end<0?undefined:end);
        c._html = inner; const re2 = /\bid="([^"]+)"/g; let m2; while((m2 = re2.exec(inner))) c._kids.push(m2[1]); }
    }
  }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); if(NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };
  console.log('ia-version', IA.version, '| startDate', START, '| clock set per case to the rest day (noon)');
}
const THROWS = {};
const safe = (lbl, f) => { try { return f(); } catch(e){ inc(THROWS, lbl+': '+String(e.message).slice(0,80)); } };
const goalObj = (id, extra) => Object.assign({id, label:id}, {mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}, extra||{});
function mkCfg(sports, f, ex, eq, rd, sd){
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[1], s[2]); });
  return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:sports.map(s=>s[0]), cardioGoals:cg,
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}
const PID = 'p_m';
function buildP(cfg){ const prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  prog.id = PID; prog.name = PID; prog.created = 1; prog.startDate = START; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(JSON.stringify(cfg)); prog.overlays = []; return prog; }
function install(prog, w){
  const p = JSON.parse(JSON.stringify(prog));
  ['ia_logs_','ia_comp_','ia_hist_','ia_moves_'].forEach(k => LS.removeItem(k+PID));
  LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active', PID);
  IA.ctx.__P = p; E('activeProgId="'+PID+'"; activeProg=__P; currentWeek='+w+';'); return p; }
const logsAll = () => JSON.parse(LS.getItem('ia_logs_'+PID)||'{}');
const ent = k => { const L = logsAll()[k]; if(!L) return null; const o = {}; KEYS.forEach(f => { if(L[f]!==undefined && L[f]!=='' && L[f]!==null) o[f]=L[f]; }); return o; };
const formIds = () => ((REG.get('cardioFields')||{})._kids||[]).filter(id => /^log_(run|bike|swim)_/.test(id));
const formVals = () => { const o = {}; formIds().forEach(id => { const v = (REG.get(id)||{}).value; if(v!=='') o[id.slice(4)] = v; }); return o; };
function open(w, dk){ REG.clear(); safe('openDetail', () => E('currentWeek='+w+'; openDetail("'+dk+'", activeProg.weeks['+w+']["'+dk+'"])'));
  const body = (REG.get('detailBody')||{})._html||''; const wrap = REG.get('cardioSwapWrap'); const btn = REG.get('cardioLogBtn');
  return { form: formVals(), wrap: wrap ? JSON.stringify(wrap.dataset) : null, btn: btn ? btn.textContent : null, nudge: /never marked it/.test(body) }; }
function jog(w, dk, j){ safe('applyRestCardio', () => E('Object.assign(_restDraft,{w:'+w+',day:"'+dk+'",type:"'+j.type+'",mins:'+j.mins+',dist:"'+j.dist+'",rpe:'+j.rpe+'}); applyRestCardio();')); }
function move(w, dk, pick){ safe('applyRestMove', () => E('Object.assign(_restDraft,{w:'+w+',day:"'+dk+'",pick:"'+pick+'"}); applyRestMove();')); }
const cands = w => (safe('restMoveCandidates', () => E('restMoveCandidates('+w+')')) || []).map(c => c.day);
function weekView(){ const keys0 = new Set(REG.keys()); safe('renderWeekView', () => E('renderWeekView()'));
  let html = ''; REG.forEach(v => { html += v._html; });
  const m = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(html);
  const rl = /class="wk-rest-logged">([^<]*)</.exec(html);
  return { miles: m ? +m[1] : null, restLine: rl ? rl[1] : null, trainAnyway: /Training anyway\?/.test(html) }; }
function progress(){ REG.clear(); safe('renderProgressScreen', () => E('progressViewId=null; renderProgressScreen()')); let html=''; REG.forEach(v => { html += v._html; }); return html; }
function pvl(w){ const r = safe('plannedVsLogged', () => E('(function(){var p=activeProg; return plannedVsLogged(getLogs(), getDayHist(), p.totalWeeks||99, null, false);})()')); return r && r[w] ? r[w] : null; }
function ladder(w){ const r = safe('ladderWeekly', () => E('ladderWeekly(getLogs(), activeProg.totalWeeks||99, null, false)')); return r ? JSON.stringify(r[w]!==undefined ? r[w] : (Array.isArray(r)?r[w-1]:null)) : null; }
function kindOf(day){ if(!day || day.rest) return 'rest'; if(Array.isArray(day.cardio)) return 'array'; const ct = ctOf(day);
  if(!day.cardio) return 'lift'; if(ct==='run'){ const d = IA.eval('doseFromCardio')(day.cardio); return 'run:'+(d?d.k:'generic'); }
  if(ct==='bike'||ct==='swim') return ct; return 'other:'+ct; }
// the active sport's primary node on the moved-in form, and the hand constant the athlete types
const TYPEV = { log_run_dist:'5.2', log_run_mins:'45', log_run_rep_time:'1:30', log_bike_mins:'45', log_swim_yards:'1500' };
function typeOne(dk){ const ids = formIds(); const id = ['log_run_dist','log_bike_mins','log_swim_yards','log_run_rep_time','log_run_mins'].find(i => ids.includes(i));
  if(!id) return null; REG.get(id).value = TYPEV[id];
  safe('cardioListener', () => E('if(cardioLive("'+dk+'")) persistLogFields("'+dk+'")')); return id.slice(4)+'='+TYPEV[id]; }
function touchRpe(dk){ const r = REG.get('log_rpe'); if(!r) return false; r.value = '8'; r.dataset.touched = '1'; safe('rpeListener', () => E('persistLogFields("'+dk+'")')); return true; }
const jogKeys = (j) => { const o = { rest_cardio:true, rest_type:j.type, rest_mins:j.mins, rpe:j.rpe };
  const d = parseFloat(j.dist); if(j.type==='run'&&d>0) o.run_dist=d; if(j.type==='bike') o.bike_mins=j.mins; if(j.type==='swim'&&d>0) o.swim_yards=d; return o; };
const lostOf = (j, e) => Object.entries(jogKeys(j)).filter(([k,v]) => !(e && String(e[k])===String(v))).map(([k]) => k);
// one drive: jog on (w,rest), move cand in, open, then seq; returns the record of every step
function drive(prog, w, rest, cand, j, seq, opts){
  opts = opts || {}; install(prog, w); T = dateOf(w, rest);
  const R = { w, rest, cand, jog:j.type+(j.dist?'+'+j.dist:''), seq, kind: kindOf(prog.weeks[w][cand]) };
  const key = 'w'+w+'_'+rest;
  jog(w, rest, j); R.s0 = ent(key); if(opts.readers){ R.wv0 = weekView(); R.pvl0 = pvl(w); }
  R.offered = cands(w).includes(cand);
  move(w, rest, cand); R.s1 = ent(key); R.movedIn = !!(E('activeProg.weeks['+w+']["'+rest+'"].movedFrom')); if(opts.readers){ R.wv1 = weekView(); }
  R.o2 = open(w, rest); R.s2 = ent(key);
  if(seq==='done'){ safe('handleDayStatus', () => E('handleDayStatus("'+rest+'","x","complete")')); }
  else if(seq==='rpe'){ R.rpeNode = touchRpe(rest); }
  else if(seq==='notes'){ const n = REG.get('log_notes'); if(n){ n.value = 'legs ok'; safe('notesListener', () => E('persistLogFields("'+rest+'")')); } R.notesNode = !!n; }
  else if(seq==='type'){ R.typed = typeOne(rest); R.s3 = ent(key); safe('logCardio', () => E('logCardio()')); }
  else if(seq==='log'){ safe('logCardio', () => E('logCardio()')); }
  else if(seq==='swap'){ const P = (REG.get('cardioSwapWrap')||{dataset:{}}).dataset.planned; const t = ['bike','run','swim'].find(s => s!==P); if(P) safe('setCardioSwap', () => E('setCardioSwap("'+t+'")')); R.swapTo = P ? t : null; }
  R.sF = ent(key); R.lost = lostOf(j, R.sF); R.lost2 = lostOf(j, R.s2);
  if(opts.readers){ R.wvF = weekView(); R.pvlF = pvl(w); }
  return R; }
const fmt = R => 'W'+R.w+' rest '+R.rest+' <- '+R.cand+' ['+R.kind+'] jog '+R.jog+' seq '+R.seq+(R.offered?'':' (NOT OFFERED)')
  +'\n      after jog   '+JSON.stringify(R.s0)+(R.wv0?'  | week MILES '+R.wv0.miles+' hero line "'+R.wv0.restLine+'" pvl '+JSON.stringify(R.pvl0):'')
  +'\n      after move  '+JSON.stringify(R.s1)+(R.wv1?'  | week MILES '+R.wv1.miles+' hero line "'+R.wv1.restLine+'"':'')
  +'\n      after open  '+JSON.stringify(R.s2)+' | form '+JSON.stringify(R.o2.form)+' wrap '+R.o2.wrap+' btn "'+R.o2.btn+'" nudge '+R.o2.nudge
  +(R.s3!==undefined?'\n      after input '+JSON.stringify(R.s3)+' ('+R.typed+')':'')
  +'\n      after '+R.seq.padEnd(6)+JSON.stringify(R.sF)+(R.wvF?'  | week MILES '+R.wvF.miles+' pvl '+JSON.stringify(R.pvlF):'')
  +'\n      jog keys lost: at open ['+R.lost2.join(',')+'] at end ['+R.lost.join(',')+']';

// ─────────────── R ───────────────
const SRC_DEF = () => [ ['HALF_MANNY', JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))],
  ['run10k+bike+swim', mkCfg([['run','run_10k',{}],['bike','bike_base',{}],['swim','swim_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
  ['run_pace', mkCfg([['run','run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
  ['run_base', mkCfg([['run','run_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
  ['swim_base', mkCfg([['swim','swim_base',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
  ['bike_ftp', mkCfg([['bike','bike_ftp',{}]],'balanced','intermediate','commercial',['sun','wed'],76308)],
  ['run_5k', mkCfg([['run','run_5k',{}]],'strength','advanced','commercial',['sat','sun'],76308)] ];
if(PART==='all'||PART==='R'){
  boot();
  console.log('\n════ R1 — seed 76308 HALF_MANNY: W1 first rest day, every candidate, run jog 37 min 3.7 mi RPE 7, seq Done ════');
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const prog = buildP(cfg);
  console.log('fixture seed '+cfg.seed+' | cardioTypes '+JSON.stringify(cfg.cardioTypes)+' | restDays '+JSON.stringify(cfg.restDays)+' | weeks '+Object.keys(prog.weeks).length);
  console.log('W1: '+ORDER.map(d => d+'='+kindOf(prog.weeks[1][d])+(prog.weeks[1][d]&&prog.weeks[1][d].title?'('+prog.weeks[1][d].title+(prog.weeks[1][d].cardio&&prog.weeks[1][d].cardio.subtype?' {'+prog.weeks[1][d].cardio.subtype+'}':'')+')':'')).join(' | '));
  const rest1 = ORDER.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest);
  install(prog, 1); T = dateOf(1, rest1); const cc = cands(1); console.log('first rest day '+rest1+' | candidates '+JSON.stringify(cc));
  for(const c of cc) for(const seq of ['done','rpe','type','log']) console.log('  '+fmt(drive(prog, 1, rest1, c, JOG.run, seq, {readers:true})));
  console.log('\n════ R2 — form-kind matrix (first (week, rest, candidate) per kind per source config) x jog x seq ════');
  const SRC = SRC_DEF(); const cells = {};
  for(const [nm, c] of SRC){ const p = buildP(c);
    for(const w of Object.keys(p.weeks).map(Number).sort((a,b)=>a-b)){ const rd = ORDER.filter(d => p.weeks[w][d] && p.weeks[w][d].rest); if(!rd.length) continue;
      for(const d of ORDER){ const x = p.weeks[w][d]; if(!x || x.rest) continue; const k = kindOf(x); if(!cells[k]) cells[k] = { nm, p, w, rest: rd[0], d, types: c.cardioTypes }; } } }
  console.log('cells: '+Object.entries(cells).map(([k,c]) => k+'='+c.nm+'/W'+c.w+'/'+c.rest+'<-'+c.d).join(' | '));
  const SUM = {}; const SEQS = ['open','done','rpe','notes','type','log','swap'];
  for(const [k, c] of Object.entries(cells)) for(const [jn, j] of Object.entries(JOG)) for(const seq of SEQS){
    const R = drive(c.p, c.w, c.rest, c.d, j, seq==='open'?'none':seq, {readers:true});
    const reach = j.type==='walk' || c.types.includes(j.type);
    const lostTyped = (seq==='open'?R.lost2:R.lost);
    inc(SUM, k+' | jog '+jn+(reach?'':' (sheet does not offer)')+' | '+seq+' -> lost ['+lostTyped.join(',')+'] MILES '+(R.wv0&&R.wv0.miles)+'->'+(R.wvF&&R.wvF.miles)+(R.o2.form&&Object.keys(R.o2.form).length?' form@open '+JSON.stringify(R.o2.form):'')+' btn@open '+R.o2.btn+' nudge '+R.o2.nudge);
    if((jn==='run'||jn==='bike'||jn==='swim') && (seq==='rpe'||seq==='type'||seq==='swap')) console.log('  '+fmt(R));
  }
  console.log('\n  R2 summary (kind | jog | seq -> jog keys lost at end, week MILES before jog-move -> end):');
  Object.keys(SUM).sort().forEach(k => console.log('    '+k));
  console.log('\n════ R3 — Progress + journal readers, HALF_MANNY W1 first rest day, run jog 3.7 mi, first candidate ════');
  { const c0 = cc[0];
    install(prog, 1); T = dateOf(1, rest1); const pE = progress(); const n0 = (pE.match(/3\.7/g)||[]).length;
    jog(1, rest1, JOG.run); const pJ = progress(); const n1 = (pJ.match(/3\.7/g)||[]).length; const j1 = /RPE 7/.test(pJ);
    move(1, rest1, c0); const pM = progress(); const n2 = (pM.match(/3\.7/g)||[]).length;
    open(1, rest1); touchRpe(rest1); const pR = progress(); const n3 = (pR.match(/3\.7/g)||[]).length; const j3 = /RPE 8/.test(pR);
    console.log('  Progress html "3.7" occurrences: empty store '+n0+' | after jog '+n1+' (journal "RPE 7" '+j1+') | after move '+n2+' | after RPE touch on moved-in form '+n3+' (journal "RPE 8" '+j3+', "RPE 7" '+/RPE 7/.test(pR)+')');
    const snip = s => { const i = s.indexOf('3.7'); return i<0 ? '(none)' : s.slice(Math.max(0,i-160), i+40).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '); };
    console.log('  context of 3.7 after jog: '+snip(pJ));
  }
  console.log('\nthrows: '+JSON.stringify(THROWS));
}

// ─────────────── C ───────────────
if(PART==='all'||PART==='C'){
  if(!IA) boot();
  console.log('\n════ C — swapped-away day with nothing on the arriving sport (HALF_MANNY + matrix configs, W1) ════');
  const SRC = SRC_DEF(); const CS = {};
  for(const [nm, cfg] of SRC){ const prog = buildP(cfg);
    const rest = ORDER.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest); if(!rest) continue;
    for(const d of ORDER){ const x = prog.weeks[1][d]; const ct = ctOf(x); if(!x || x.rest || !(ct==='run'||ct==='bike'||ct==='swim')) continue;
      for(const mode of ['logged-then-swap','swap-blank']){
        install(prog, 1); T = dateOf(1, rest); const key = 'w1_'+d;
        open(1, d);
        if(mode==='logged-then-swap'){ typeOne(d); safe('logCardio', () => E('logCardio()')); }
        const t = ['bike','run','swim'].find(s => s!==ct); safe('setCardioSwap', () => E('setCardioSwap("'+t+'")'));
        const eS = ent(key); const off = cands(1).includes(d); const prB = progress(); const prBi = prB.search(/[Ss]wap/);
        let detail = '';
        if(off){ move(1, rest, d);
          const oStub = E('JSON.stringify((function(x){return {rest:x.rest,moved:x.moved,movedTo:x.movedTo}})(activeProg.weeks[1]["'+d+'"]))');
          const eAfter = ent(key); const destE = ent('w1_'+rest);
          const elig = E('restDayEligible(1,"'+d+'")');
          const o = open(1, rest);
          const ref = safe('refreshProgram', () => E('(function(){var p=refreshProgram(JSON.parse(JSON.stringify(getPrograms()[0]))); var a=p.weeks[1]["'+d+'"], b=p.weeks[1]["'+rest+'"]; return JSON.stringify({origin:{rest:!!a.rest,moved:!!a.moved,title:a.title}, dest:{rest:!!b.rest,movedFrom:b.movedFrom||null,title:b.title}});})()'));
          const pr = progress(); const ji = pr.search(/[Ss]wap/); const jr = ji<0 ? "(no swap text)" : JSON.stringify(pr.slice(Math.max(0,ji-200), ji+120).replace(/<[^>]+>/g," ").replace(/\s+/g," "));
          detail = ' | MOVED: origin stub '+oStub+' eligible-for-rest-sheet '+elig+' | origin entry kept at '+key+' '+JSON.stringify(eAfter)+' | dest entry '+JSON.stringify(destE)+' | moved-in form wrap '+o.wrap+' form '+JSON.stringify(o.form)+' | refreshProgram '+ref+' | Progress swap text before move at '+prBi+', after move: '+jr;
        }
        inc(CS, nm+' '+kindOf(x)+' '+mode+' -> offered '+off);
        console.log('  '+nm+' W1 '+d+' ['+kindOf(x)+'] '+mode+' ->'+t+' | entry '+JSON.stringify(eS)+' | offered by restMoveCandidates '+off+detail);
      } } }
  console.log('  C summary: '+JSON.stringify(CS));
  console.log('throws: '+JSON.stringify(THROWS));
}

// ─────────────── O ───────────────
if(PART==='all'||PART==='O'){
  if(!IA) boot();
  console.log('\n════ O — other orders (HALF_MANNY W1 first rest day, first candidate) ════');
  const prog = buildP(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)));
  const rest = ORDER.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest); install(prog, 1); T = dateOf(1, rest); const c0 = cands(1)[0]; const key = 'w1_'+rest;
  install(prog, 1); jog(1, rest, JOG.run); const a = ent(key); jog(1, rest, {type:'run',mins:20,dist:'2',rpe:5}); const b = ent(key); const wvb = weekView();
  console.log('  Log more run->run (37 min 3.7 mi RPE 7, then 20 min 2 mi RPE 5): '+JSON.stringify(a)+' -> '+JSON.stringify(b)+' | hero line "'+wvb.restLine+'" MILES '+wvb.miles);
  install(prog, 1); jog(1, rest, JOG.run); jog(1, rest, {type:'bike',mins:20,dist:'',rpe:5}); const b2 = ent(key); const wv2 = weekView();
  console.log('  Log more run->bike (then 20 min bike): '+JSON.stringify(b2)+' | hero line "'+wv2.restLine+'"');
  install(prog, 1); jog(1, rest, JOG.walk); const wl = ent(key); console.log('  walk 37 min: '+JSON.stringify(wl)+' (no sport key written)');
  install(prog, 1); move(1, rest, c0);
  const el = E('[restDayEligible(1,"'+rest+'"), restDayEligible(1,"'+c0+'")]'); const wv3 = weekView();
  safe('openRestSheet', () => E('openRestSheet(1,"'+rest+'","cardio")')); const rb = (REG.get('restBody')||{})._html||'';
  console.log('  jog AFTER move: restDayEligible(dest '+rest+', origin '+c0+') = '+JSON.stringify(el)+' | "Training anyway?" on week view '+wv3.trainAnyway+' | openRestSheet(dest) rendered sheet '+(rb.length>0));
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n');
  const mv = []; src.forEach((l,i) => { const s = l.replace(/\/\/.*$/,''); if(/ia_moves_|saveRestMoves|getRestMoves|delete\s+moves/.test(s)) mv.push((i+1)+': '+s.trim().slice(0,150)); });
  console.log('  move store lines (comments stripped):\n    '+mv.join('\n    '));
  console.log('  -- draft-run swap probe (side, not P-RESTMOVELOG): HALF_MANNY W1 run day, type on a DRAFT card, tap bike, tap run --');
  const rd = ORDER.find(d => ctOf(prog.weeks[1][d])==='run'); install(prog, 1); open(1, rd); const ty = typeOne(rd); const fv = formVals();
  safe('setCardioSwap', () => E('setCardioSwap("bike")')); const eb = ent('w1_'+rd); safe('setCardioSwap', () => E('setCardioSwap("run")'));
  console.log('    '+rd+' typed '+ty+' (draft: no persist) form '+JSON.stringify(fv)+' | after ->bike stored '+JSON.stringify(eb)+' | after ->run form '+JSON.stringify(formVals())+' stored '+JSON.stringify(ent('w1_'+rd)));
  console.log('throws: '+JSON.stringify(THROWS));
}

// ─────────────── S ───────────────
if(PART==='all'||PART==='S'){
  console.log('\n════ S — static: readers and writers of the keys at stake (comments stripped per line) ════');
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n');
  const fnAt = []; let cur = '(top)';
  src.forEach((l,i) => { const m = /^(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(l) || /^(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/.exec(l); if(m) cur = m[1]; fnAt[i] = cur; });
  const strip = l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1');
  const TOK = ['rest_cardio','rest_type','rest_mins','run_dist','run_mins','bike_mins','swim_yards','swapTo','swapFrom','parked','movedFrom','ia_moves_','getRestMoves','saveRestMoves','CARDIO_PARK_FIELDS'];
  TOK.forEach(t => { const by = {}; src.forEach((l,i) => { const s = strip(l); if(!s.includes(t)) return;
      const w = new RegExp('(\\.'+t+'\\s*=(?!=)|\\b'+t+'\\s*:|\\['+"'"+t+"'"+'\\]\\s*=(?!=))').test(s) ? 'W' : 'R';
      (by[fnAt[i]] = by[fnAt[i]] || []).push((i+1)+w); });
    console.log('  '+t.padEnd(18)+' fns '+String(Object.keys(by).length).padStart(2)+': '+Object.entries(by).map(([f,ls]) => f+'@'+ls.join(',')).join(' | ')); });
  console.log('  -- writer call sites by surface (onclick in markup = UI tap; else JS caller) --');
  ['applyRestCardio','applyRestMove','applyRestDayMoves','saveRestMoves','persistLogFields','setCardioSwap','logCardio','handleDayStatus','doseRep','writeSetDraft','clearSetDraft','saveLogs','openRestSheet','_rdSet'].forEach(fn => {
    const hits = []; src.forEach((l,i) => { const s = strip(l); const re = new RegExp('\\b'+fn+'\\('); if(!re.test(s) || new RegExp('function\\s+'+fn+'\\b').test(s)) return;
      const ui = new RegExp('on(click|input|change)=[^>]*'+fn+'\\(').test(s) || new RegExp("['\"`][^'\"`]*"+fn+'\\(').test(s);
      hits.push((i+1)+':'+fnAt[i]+(ui?'[UI]':'')); });
    console.log('  '+fn.padEnd(18)+' calls '+String(hits.length).padStart(2)+': '+hits.join(' ')); });
}

// ─────────────── L ───────────────
if(PART==='all'||PART==='L'){
  if(!IA) boot();
  console.log('\n════ L — lattice ('+LSIZE+'): W1, first eligible rest day x every candidate; jog = cfg sport (run 3.7 mi / bike 37 min / swim 1370 yd), 37 min RPE 7 ════');
  const RUNG = [['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]];
  const BIKEG = ['bike_base','bike_ftp','bike_50','bike_century','bike_cals'];
  const SWIMG = [['swim_base',{}],['swim_mile',{}],['swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim_tri',{}]];
  const GOALS = [].concat(RUNG.map(g=>['run',g[0],g[1]]), BIKEG.map(g=>['bike',g,{}]), SWIMG.map(g=>['swim',g[0],g[1]]));
  const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
  const EXPS = ['beginner','intermediate','advanced'], EQ = LSIZE==='small'?['commercial']:['commercial','bodyweight'];
  const RESTS = [['sun','wed'],['sat','sun']], SEEDS = process.env.SEEDS ? process.env.SEEDS.split(',').map(Number) : (LSIZE==='small'?[76308]:[76308, 24865, 1234]);
  const S = { cfg:0, crash:0, pairs:0, offered:0, picker:0 }; const SEG = {}; const SEQS = ['open','done','rpe','type','log'];
  const t0 = Date.now();
  for(const g of GOALS) for(const f of FOC) for(const ex of EXPS) for(const eq of EQ) for(const rd of RESTS) for(const sd of SEEDS){
    let prog; try { prog = buildP(mkCfg([[g[0],g[1],g[2]]], f, ex, eq, rd, sd)); } catch(e){ S.crash++; continue; } S.cfg++;
    const rest = ORDER.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest); if(!rest) continue;
    install(prog, 1); T = dateOf(1, rest); const cc = cands(1);
    const j = g[0]==='run'?JOG.run:(g[0]==='bike'?JOG.bike:JOG.swim);
    for(const c of cc){ S.pairs++; const kind = kindOf(prog.weeks[1][c]); const sameSport = (kind.split(':')[0]===g[0]);
      for(const seq of SEQS){ const R = drive(prog, 1, rest, c, j, seq==='open'?'none':seq, {readers: seq==='type'});
        if(seq==='open'){ if(R.o2.wrap) S.picker++; if(R.offered) S.offered++; }
        const lost = (seq==='open'?R.lost2:R.lost);
        const sportLost = lost.filter(k => /run_dist|bike_mins|swim_yards/.test(k)).length>0;
        const restLost = lost.filter(k => /rest_/.test(k)).length>0;
        const segk = seq+' | '+g[0]+' jog | '+kind;
        const s = SEG[segk] = SEG[segk] || { n:0, restLost:0, sportLost:0, rpeLost:0, nudge:0, live:0, milesDrop:0, seededJog:0 };
        s.n++; if(restLost) s.restLost++; if(sportLost) s.sportLost++; if(lost.includes('rpe')) s.rpeLost++;
        if(seq==='open'){ if(R.o2.nudge) s.nudge++; if(R.o2.btn==='Logged ✓') s.live++; if(Object.values(R.o2.form).some(v => v===j.dist || v===String(j.mins))) s.seededJog++; }
        if(seq==='type' && R.wv0 && R.wvF && g[0]==='run' && R.wvF.miles < R.wv0.miles + 5.2 - 1e-9) s.milesDrop++;
      } }
  }
  console.log('configs '+S.cfg+' crash '+S.crash+' | rest x candidate pairs (W1, first rest day) '+S.pairs+' | offered '+S.offered+' | moved-in forms rendering the picker '+S.picker+' | '+((Date.now()-t0)/1000).toFixed(0)+' s');
  console.log('segment: seq | jog sport | moved-in kind -> n, rest_* lost, jog sport key lost, jog rpe lost, [open: _hasLog nudge, card LIVE "Logged ✓", jog value seeded on form], [type: week MILES < jog+typed]');
  const TOT = {};
  Object.keys(SEG).sort().forEach(k => { const s = SEG[k]; const sq = k.split(' | ')[0]; const t = TOT[sq] = TOT[sq] || { n:0, restLost:0, sportLost:0, rpeLost:0, nudge:0, live:0, seededJog:0, milesDrop:0 };
    Object.keys(t).forEach(x => t[x] += s[x]||0);
    console.log('  '+k.padEnd(40)+' n '+String(s.n).padStart(5)+' rest_* '+String(s.restLost).padStart(5)+' sport '+String(s.sportLost).padStart(5)+' rpe '+String(s.rpeLost).padStart(5)
      +(sq==='open'?' nudge '+s.nudge+' live '+s.live+' seeded '+s.seededJog:'')+(sq==='type'?' milesDrop '+s.milesDrop:'')); });
  Object.entries(TOT).forEach(([k,t]) => console.log('  TOTAL '+k.padEnd(5)+' '+JSON.stringify(t)));
  if(process.env.SEG_OUT) fs.writeFileSync(process.env.SEG_OUT, JSON.stringify({S, SEG}));
  console.log('throws: '+JSON.stringify(THROWS));
}
console.log('\nDONE');
// ─────────────── LM: merge per-seed lattice runs (SEG_FILES=a.json,b.json) ───────────────
if(PART==='LM'){
  const S = { cfg:0, crash:0, pairs:0, offered:0, picker:0 }, SEG = {};
  process.env.SEG_FILES.split(',').forEach(f => { const J = JSON.parse(fs.readFileSync(f,'utf8'));
    Object.keys(S).forEach(k => S[k] += J.S[k]); Object.entries(J.SEG).forEach(([k,s]) => { const t = SEG[k] = SEG[k] || {}; Object.entries(s).forEach(([x,v]) => t[x] = (t[x]||0)+v); }); });
  console.log('MERGED configs '+S.cfg+' crash '+S.crash+' | pairs '+S.pairs+' | offered '+S.offered+' | picker '+S.picker);
  const TOT = {}, BYJ = {};
  Object.keys(SEG).sort().forEach(k => { const s = SEG[k]; const [sq, jg, kind] = k.split(' | '); const t = TOT[sq] = TOT[sq] || {}; Object.entries(s).forEach(([x,v]) => t[x] = (t[x]||0)+v);
    const b = BYJ[sq+' | '+jg] = BYJ[sq+' | '+jg] || {}; Object.entries(s).forEach(([x,v]) => b[x] = (b[x]||0)+v);
    console.log('  '+k.padEnd(40)+' '+JSON.stringify(s)); });
  Object.entries(BYJ).forEach(([k,t]) => console.log('  BYJOG '+k.padEnd(18)+' '+JSON.stringify(t)));
  Object.entries(TOT).forEach(([k,t]) => console.log('  TOTAL '+k.padEnd(5)+' '+JSON.stringify(t)));
}
