// V238 premise check m2 — coach's D223-D227 code-read premises on V237. Read-only.
// Usage: node tests/measure/v238_premise.js index.html [part: P1|P2|P4|P4L|P5|P6|all]
//  P1 static: every read/write of ia_logs_ and the logs map, by function, bypass or not.
//  P2/P3 differential on V237 code: the seed-76308 W1 WED jog planted as (V0) V237 shape via the real applyRestCardio,
//      (V3) V0 + week + ts, (V2) the ruling's D223 shape {restLog, week, ts}. Every reader's output printed per variant;
//      html readers diffed chunk-wise. Oracle: the variants differ only in the planted keys, so any reader output that differs
//      is a reader of those keys.
//  P4 drives: orders that could put rest_cardio and a session key on one entry. P4L: lattice count (seed 76308).
//  P5 drive: bike/row/walk sheet distances. P6: V237 hero line for Log-more permutations vs a one-line-per-type rendering of
//      the ruling's lens (lens implemented from the ruling's text, D223 item 5, not from the engine).
const path = require('path'), fs = require('fs'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html', PART = process.argv[3] || 'all';
const ROOT = path.join(__dirname, '..', '..');
const SCR = process.env.SCR || '/tmp';
const START = '2026-09-28';
let T = new Date('2026-09-30T12:00:00').getTime();
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'], DAYS = H.DAYS;
const dateOf = (w, d) => { const x = new Date(START + 'T12:00:00'); x.setDate(x.getDate() + (w-1)*7 + ORDER.indexOf(d)); return x.getTime(); };
function inc(m,k,n){ m[k]=(m[k]||0)+(n==null?1:n); }
let IA, E, LS, REG; const THROWS = {};
function boot(){
  IA = H.load(FILE); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  IA.ctx.Date = FD; E = IA.eval; LS = IA.localStorage; REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal|excard_|exw_)/;
  function mk(id){ const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'',
      classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
      get innerHTML(){ return this._html; }, set innerHTML(h){ setHTML(this, String(h)); } }; return el; }
  function setHTML(el, h){
    const drop = k => { const c = REG.get(k); if(c){ c._kids.forEach(drop); REG.delete(k); } };
    el._kids.forEach(drop); el._kids = []; el._html = h;
    const re = /<(input|textarea|div|button|span|select)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(h))){ const id = m[3], attrs = m[2]+' '+m[4]; const c = mk(id);
      const v = /\bvalue="([^"]*)"/.exec(attrs); if(v) c.value = v[1];
      attrs.replace(/\bdata-([a-z]+)="([^"]*)"/g, (a,k,val)=>{ c.dataset[k]=val; });
      REG.set(id, c); el._kids.push(id); }
  }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); if(NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };
  console.log('ia-version', IA.version, '| startDate', START);
}
const safe = (lbl, f) => { try { return f(); } catch(e){ inc(THROWS, lbl+': '+String(e.message).slice(0,80)); return '(threw)'; } };
const PID = 'p_m';
function buildP(cfg){ const prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  prog.id = PID; prog.name = PID; prog.created = 1; prog.startDate = START; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(JSON.stringify(cfg)); prog.overlays = []; return prog; }
function install(prog, w){ const p = JSON.parse(JSON.stringify(prog));
  if(typeof LS.clear==='function') LS.clear(); else Object.keys(LS).forEach(k => LS.removeItem(k));
  LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active', PID);
  IA.ctx.__P = p; E('activeProgId="'+PID+'"; activeProg=__P; currentWeek='+w+';'); return p; }
const logsAll = () => JSON.parse(LS.getItem('ia_logs_'+PID)||'{}');
function jog(w, dk, j){ safe('applyRestCardio', () => E('Object.assign(_restDraft,{w:'+w+',day:"'+dk+'",type:"'+j.type+'",mins:'+j.mins+',dist:"'+j.dist+'",rpe:'+j.rpe+'}); applyRestCardio();')); }
function allHtml(){ let h=''; REG.forEach(v => { h += v._html; }); return h; }
function weekHtml(){ REG.clear(); safe('renderWeekView', () => E('renderWeekView()')); return allHtml(); }
function progHtml(){ REG.clear(); safe('renderProgressScreen', () => E('progressViewId=null; renderProgressScreen()')); return allHtml(); }
const HALF = () => JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));
const strip = l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1');

// ─────────────── P1 ───────────────
if(PART==='all'||PART==='P1'){
  console.log('\n════ P1 — reads and writes of ia_logs_ / the logs map (comments stripped) ════');
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8').split('\n'); const fa = []; let cur='(top)';
  src.forEach((l,i) => { const m = /^(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(l) || /^(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/.exec(l); if(m) cur=m[1]; fa[i]=cur; });
  const scan = (lbl, re) => { const h = []; src.forEach((l,i) => { const s = strip(l); if(re.test(s)) h.push((i+1)+':'+fa[i]); }); console.log('  '+lbl.padEnd(34)+' '+String(h.length).padStart(3)+'  '+h.join(' ')); return h; };
  scan("'ia_logs_' literal", /ia_logs_/);
  scan('getLogs( call/def', /\bgetLogs\(/);
  scan('getLogsFor( call/def', /\bgetLogsFor\(/);
  scan('saveLogs( call/def', /\bsaveLogs\(/);
  scan('localStorage iteration (any)', /localStorage\.length|Object\.keys\(localStorage\)|localStorage\.key\(|for\s*\(\s*(const|let|var)\s+\w+\s+in\s+localStorage/);
  scan('setItem with computed key', /setItem\(\s*[a-zA-Z_$][\w$]*\s*[,+]/);
  scan('getItem with computed key', /getItem\(\s*[a-zA-Z_$][\w$]*\s*[,+)]/);
  scan('readers taking a logs param', /^function\s+\w+\s*\(\s*logs\b/);
  scan('export / import / backup', /\b(buildExportHTML|importData|exportData|ia_backup|restoreBackup)\b/);
  scan('cardioTypes includes row (wizard)', /data-ct="row"|cardioTypes.*'row'|value="row"/);
}

// ─────────────── P2 / P3 ───────────────
if(PART==='all'||PART==='P2'){
  if(!IA) boot();
  console.log('\n════ P2/P3 — reader differential on V237 code, HALF_MANNY seed 76308, W1 WED jog 37 min 3.7 mi RPE 7 ════');
  const prog = buildP(HALF());
  const READERS = {
    weekMILES: () => { const h = weekHtml(); const m = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(h); return m?m[1]:null; },
    restHeroLine: () => { const h = weekHtml(); const m = /class="wk-rest-logged">([^<]*)</.exec(h); return m?m[1]:null; },
    restHeroButton: () => { const h = weekHtml(); return /'cardio'\)">Log more</.test(h) ? 'Log more' : (/'cardio'\)">Log cardio</.test(h) ? 'Log cardio' : null); },
    weekDoneTile: () => { const h = weekHtml(); const m = /wk-stat-num">(\d+)<span class="den">\/(\d+)/.exec(h); return m?m[1]+'/'+m[2]:null; },
    weekStripWed: () => { const h = weekHtml(); const i = h.indexOf('>WED<'); return i<0?null:h.slice(Math.max(0,i-120), i+260).replace(/\s+/g,' '); },
    computeStreak: () => JSON.stringify(E('computeStreak()')),
    restMoveCandidates: () => JSON.stringify(E('restMoveCandidates(1)').map(c=>c.day)),
    plannedVsLogged: () => JSON.stringify(E('plannedVsLogged(getLogs(), getDayHist(), activeProg.totalWeeks||99, null, false)')),
    ladderWeekly: () => JSON.stringify(E('ladderWeekly(getLogs(), activeProg.totalWeeks||99, null, false)')),
    runsByClass: () => JSON.stringify(E('runsByClass(getLogs(), getDayHist(), activeProg.totalWeeks||99)')),
    easyEffortWeekly: () => JSON.stringify(E('easyEffortWeekly(getLogs(), getDayHist(), activeProg.totalWeeks||99)')),
    easyVsPrescribed: () => JSON.stringify(E('easyVsPrescribed(getLogs(), getDayHist(), activeProg.totalWeeks||99)')),
    recoveryPaceWeekly: () => JSON.stringify(E('recoveryPaceWeekly(getLogs(), getDayHist(), activeProg.totalWeeks||99)')),
    benchmarkEntry: () => JSON.stringify([1,2,3,4,5].map(w => E('_benchmarkEntryFor('+w+')'))),
    seedFromPriorPrograms: () => JSON.stringify(E('seedFromPriorPrograms('+T+')')),
    refreshFreeze: () => { const p = E('refreshProgram(JSON.parse(JSON.stringify(getPrograms()[0])))'); return JSON.stringify({wed:p.weeks[1].wed.title+'/'+!!p.weeks[1].wed.rest, w2mon:p.weeks[2].mon.title}); },
    maybeShowReminder: () => { REG.clear(); safe('maybeShowReminder', () => E('maybeShowReminder()')); const h = allHtml(); return h.length ? h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,160) : '(nothing rendered)'; },
    progressHasAnyData: () => { const h = progHtml(); return /No data yet/.test(h) ? 'No data yet' : 'has data'; },
    progressJournalW1: () => { const h = progHtml(); const i = h.indexOf('Session Journal'); if(i<0) return '(no journal)'; return h.slice(i).replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,400); },
  };
  const VARIANTS = ['V0','V3','V2'];
  const plant = (v, key) => { const L = logsAll(); if(v==='V0') return; if(v==='V3'){ L[key] = Object.assign({}, L[key], {week:1, ts:dateOf(1,'wed')}); }
    if(v==='V2'){ L[key] = { restLog:{ run:{ mins:37, dist:3.7, rpe:7 } }, week:1, ts:dateOf(1,'wed') }; } LS.setItem('ia_logs_'+PID, JSON.stringify(L)); };
  for(const world of ['A jog only','B jog + Mon session (2.0 mi RPE 6, Done) + 4 Fri recovery runs W1-W4 (3 mi, 10:00/mi) for the seed']){
    const out = {}, htmls = {};
    for(const v of VARIANTS){
      install(prog, 1); T = dateOf(1, 'wed');
      if(world[0]==='B'){
        const L = {}; const H2 = {};
        L.w1_mon = { rpe:'6', run_dist:'2.0', run_pace:'', run_mins:'', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'', swapFrom:'', swapTo:'', week:1, ts:dateOf(1,'mon') };
        H2.w1_mon = prog.weeks[1].mon;
        // recovery runs: W1 fri is before Wed's date? W1 fri is after; use ts inside the 21-day window ending at T
        [1,2,3,4].forEach(w => { const k = 'w'+w+'_fri'; L[k] = { rpe:'4', run_dist:'3', run_pace:'10:00/mi', run_mins:'30', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'', swapFrom:'', swapTo:'', week:w, ts:T - (5-w)*86400000 }; H2[k] = prog.weeks[w].fri; });
        LS.setItem('ia_logs_'+PID, JSON.stringify(L)); LS.setItem('ia_hist_'+PID, JSON.stringify(H2));
        LS.setItem('ia_comp_'+PID, JSON.stringify({ w1_mon:{status:'complete', ts:dateOf(1,'mon'), title:prog.weeks[1].mon.title} }));
      }
      jog(1, 'wed', {type:'run',mins:37,dist:'3.7',rpe:7}); plant(v, 'w1_wed');
      out[v] = {}; Object.entries(READERS).forEach(([n,f]) => { out[v][n] = safe(n, f); });
      htmls[v] = { week: weekHtml(), prog: progHtml() };
      out[v].__stored = JSON.stringify(logsAll().w1_wed);
    }
    console.log('\n  WORLD '+world);
    console.log('    stored V0 '+out.V0.__stored+'\n    stored V3 '+out.V3.__stored+'\n    stored V2 '+out.V2.__stored);
    Object.keys(READERS).forEach(n => { const a = out.V0[n], b = out.V3[n], c = out.V2[n];
      console.log('    '+n.padEnd(22)+' V0='+String(a).slice(0,220)+(b!==a?'\n      '+''.padEnd(20)+' V3 DIFFERS='+String(b).slice(0,220):'  | V3 same')+(c!==a?'\n      '+''.padEnd(20)+' V2 DIFFERS='+String(c).slice(0,220):'  | V2 same')); });
    // chunk diff of full html
    for(const [vv, lbl] of [['V3','P3 (week+ts added)'],['V2','P2 (D223 shape)']]) for(const scr of ['week','prog']){
      const ch = s => s.replace(/<svg[\s\S]*?<\/svg>/g,'<svg/>').split(/(?=<)/).join('\n');
      const fa = path.join(SCR, 'p2_a.txt'), fb = path.join(SCR, 'p2_b.txt'); fs.writeFileSync(fa, ch(htmls.V0[scr])); fs.writeFileSync(fb, ch(htmls[vv][scr]));
      let d = ''; try { d = cp.execFileSync('diff', [fa, fb]).toString(); } catch(e){ d = String(e.stdout||''); }
      const hunks = d.split('\n').filter(l => /^[<>]/.test(l));
      console.log('    html diff '+lbl+' '+scr+': '+hunks.length+' changed chunks'+(hunks.length?'\n      '+hunks.slice(0,90).map(l => l.replace(/style="[^"]*"/g,'').slice(0,170)).join('\n      '):''));
    }
  }
  console.log('throws: '+JSON.stringify(THROWS));
}

// ─────────────── P4 ───────────────
function firstExKey(w, dk){ return E('(function(){var d=activeProg.weeks['+w+']["'+dk+'"];var out=null;(d.sections||[]).forEach(function(s){(s.items||[]).forEach(function(i){ if(!out&&i&&i.name&&!i._skipped&&exLoggable(i.name,i.detail||"")) out=exStoreKey(i.name); });});return out;})()'); }
const SESSION_KEYS = ['run_dist','bike_mins','swim_yards','rpe','run_mins','run_pace','sets','notes','swapTo','parked'];
if(PART==='all'||PART==='P4'){
  if(!IA) boot();
  console.log('\n════ P4 — orders that could put rest_cardio and a session key on one entry (HALF_MANNY 76308 W1) ════');
  const prog = buildP(HALF()); const show = k => JSON.stringify(logsAll()[k]||null);
  const coexist = k => { const e = logsAll()[k]; return !!(e && e.rest_cardio) ? SESSION_KEYS.filter(f => e[f]!==undefined && e[f]!=='' && !(f==='rpe') && !(f==='run_dist' && e.rest_type==='run')) : null; };
  // (1) moved-in form opened, never saved
  install(prog, 1); T = dateOf(1,'wed'); jog(1,'wed',{type:'run',mins:37,dist:'3.7',rpe:7}); E('Object.assign(_restDraft,{w:1,day:"wed",pick:"tue"}); applyRestMove();');
  REG.clear(); E('openDetail("wed", activeProg.weeks[1]["wed"])'); console.log('  (1) WED<-TUE opened, nothing saved: '+show('w1_wed'));
  // (2) ... then one set autosaved (autoSaveSets -> writeSetDraft, RMW)
  const ek = firstExKey(1,'wed'); safe('writeSetDraft', () => E('writeSetDraft("'+ek+'",["5"],["135"],"")'));
  console.log('  (2) then autoSaveSets/writeSetDraft("'+ek+'") on the moved-in lift day: '+show('w1_wed')+' | session keys beside rest_cardio: '+JSON.stringify(coexist('w1_wed')));
  safe('clearSetDraft', () => E('clearSetDraft("'+ek+'")')); console.log('      then clearSetDraft: '+show('w1_wed'));
  // (2b) the same on a moved-in run day (run day with lift sections)
  install(prog, 1); jog(1,'wed',{type:'run',mins:37,dist:'3.7',rpe:7}); E('Object.assign(_restDraft,{w:1,day:"wed",pick:"sat"}); applyRestMove();'); REG.clear(); E('openDetail("wed", activeProg.weeks[1]["wed"])');
  const ek2 = firstExKey(1,'wed'); if(ek2) safe('writeSetDraft', () => E('writeSetDraft("'+ek2+'",["5"],["135"],"")'));
  console.log('  (2b) WED<-SAT (run:dist + lifts) set autosave: '+show('w1_wed'));
  // (3) a day with only set drafts is a move origin? and can a jog then land on it?
  install(prog, 1); E('currentDayKey="tue"'); const ek3 = firstExKey(1,'tue'); safe('writeSetDraft', () => E('currentDayKey="tue"; writeSetDraft("'+ek3+'",["5"],["135"],"")'));
  const off = E('restMoveCandidates(1)').map(c=>c.day).includes('tue'); E('Object.assign(_restDraft,{w:1,day:"wed",pick:"tue"}); applyRestMove();');
  console.log('  (3) TUE with a set draft only: offered as move origin '+off+'; after the move TUE rest/moved '+E('JSON.stringify({rest:activeProg.weeks[1].tue.rest,moved:activeProg.weeks[1].tue.moved})')+', restDayEligible(TUE) '+E('restDayEligible(1,"tue")')+' (a jog can '+(E('restDayEligible(1,"tue")')?'':'NOT ')+'land on the origin) | TUE entry '+show('w1_tue'));
  // (4) session logged on MON, then a rebuild where cfg.restDays makes MON a rest day (simulated engine change)
  install(prog, 1); T = dateOf(1,'wed');
  LS.setItem('ia_logs_'+PID, JSON.stringify({ w1_mon:{rpe:'6',run_dist:'5.2',week:1,ts:dateOf(1,'mon')} }));
  const P4 = E('(function(){var p=JSON.parse(JSON.stringify(getPrograms()[0])); p.cfg.restDays=["mon","sun"]; var r=refreshProgram(p); return JSON.stringify({w1mon:{title:r.weeks[1].mon.title,rest:!!r.weeks[1].mon.rest}, w1wed:{title:r.weeks[1].wed.title,rest:!!r.weeks[1].wed.rest}, w2mon:{title:r.weeks[2].mon.title,rest:!!r.weeks[2].mon.rest}});})()');
  console.log('  (4) MON session logged, rebuild with restDays [mon,sun]: '+P4+' (W1 MON frozen as trained = a jog cannot land on a logged MON)');
  // (5) jog on WED, rebuild where WED becomes a training day
  install(prog, 1); jog(1,'wed',{type:'run',mins:37,dist:'3.7',rpe:7});
  const P5 = E('(function(){var p=JSON.parse(JSON.stringify(getPrograms()[0])); p.cfg.restDays=["mon","sun"]; var r=refreshProgram(p); return JSON.stringify({w1wed:{title:r.weeks[1].wed.title,rest:!!r.weeks[1].wed.rest}});})()');
  console.log('  (5) WED jog, rebuild with restDays [mon,sun]: '+P5);
  // (6) any opener of a rest day's form: openDayKey on WED
  install(prog, 1); REG.clear(); safe('openDayKey', () => E('openDayKey("wed")')); console.log('  (6) openDayKey(WED rest): detail rendered '+(!!((REG.get('detailBody')||{})._html))+' | rest sheet rendered '+(!!((REG.get('restBody')||{})._html)));
  console.log('throws: '+JSON.stringify(THROWS));
}
if(PART==='P4L'){
  if(!IA) boot();
  const goalObj = (id, extra) => Object.assign({id, label:id}, {mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}, extra||{});
  const mkCfg = (s, f, ex, eq, rd, sd) => { const race = /^run_(5k|10k|half|marathon)$/.test(s[1]); return { name:'L', primaryPath:/^support_/.test(f)?'event':'goal', cardioTypes:[s[0]], cardioGoals:{[s[0]]:goalObj(s[1], s[2])},
    eventTargeted:race, raceDate:race?'2026-12-20':null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd }; };
  const GOALS = [['run','run_5k',{}],['run','run_10k',{}],['run','run_half',{}],['run','run_marathon',{}],['run','run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run','run_base',{}],
    ['bike','bike_base',{}],['bike','bike_ftp',{}],['bike','bike_50',{}],['bike','bike_century',{}],['bike','bike_cals',{}],
    ['swim','swim_base',{}],['swim','swim_mile',{}],['swim','swim_500_time',{targetMins:'9',targetSecs:'0',swimUnit:'yd'}],['swim','swim_100_time',{targetMins:'1',targetSecs:'45',swimUnit:'yd'}],['swim','swim_tri',{}]];
  const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
  const S = { cfg:0, pairs:0, loggable:0, coexist:0 }, BY = {};
  for(const g of GOALS) for(const f of FOC) for(const ex of ['beginner','intermediate','advanced']) for(const eq of ['commercial','bodyweight']) for(const rd of [['sun','wed'],['sat','sun']]){
    const prog = buildP(mkCfg(g, f, ex, eq, rd, 76308)); S.cfg++;
    const rest = ORDER.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest); install(prog, 1); T = dateOf(1, rest);
    const cc = E('restMoveCandidates(1)').map(c=>c.day);
    const j = g[0]==='run'?{type:'run',mins:37,dist:'3.7',rpe:7}:(g[0]==='bike'?{type:'bike',mins:37,dist:'',rpe:7}:{type:'swim',mins:37,dist:'1370',rpe:7});
    for(const c of cc){ S.pairs++; install(prog, 1); jog(1, rest, j); E('Object.assign(_restDraft,{w:1,day:"'+rest+'",pick:"'+c+'"}); applyRestMove();');
      REG.clear(); safe('openDetail', () => E('openDetail("'+rest+'", activeProg.weeks[1]["'+rest+'"])'));
      const ek = firstExKey(1, rest); const kind = prog.weeks[1][c].cardio ? (Array.isArray(prog.weeks[1][c].cardio)?'array':String(prog.weeks[1][c].cardio.type||'').toLowerCase()) : 'lift';
      const b = BY[g[0]+' jog | moved-in '+kind] = BY[g[0]+' jog | moved-in '+kind] || { n:0, loggable:0, coexist:0 }; b.n++;
      if(!ek) continue; S.loggable++; b.loggable++;
      safe('writeSetDraft', () => E('writeSetDraft("'+ek+'",["5"],["135"],"")'));
      const e = logsAll()['w1_'+rest]; if(e && e.rest_cardio && e.sets){ S.coexist++; b.coexist++; } } }
  console.log('\n════ P4L — lattice (seed 76308; 16 goals x 7 focus x 3 exp x 2 eq x 2 rest = '+S.cfg+' configs): jog, move, open, one set autosave ════');
  console.log('  pairs '+S.pairs+' | moved-in days with a loggable exercise '+S.loggable+' | entry carrying rest_cardio AND sets after one autosave '+S.coexist);
  Object.entries(BY).sort().forEach(([k,b]) => console.log('    '+k.padEnd(30)+' '+JSON.stringify(b)));
  console.log('throws: '+JSON.stringify(THROWS));
}

// ─────────────── P5 ───────────────
if(PART==='all'||PART==='P5'){
  if(!IA) boot();
  console.log('\n════ P5 — sheet distance by type (HALF_MANNY W1 WED, cfg.cardioTypes widened to run,bike,swim,row for the chips) ════');
  const c = HALF(); c.cardioTypes = ['run','bike','swim','row']; const prog = buildP(c);
  for(const t of ['run','bike','swim','row','walk']){ install(prog, 1); T = dateOf(1,'wed');
    safe('openRestSheet', () => E('openRestSheet(1,"wed","cardio")')); E('_restDraft.type="'+t+'"; renderRestSheet()');
    const h = (REG.get('restBody')||{})._html||''; const lbl = /Distance \((miles|yards)\)/.exec(h);
    jog(1, 'wed', {type:t, mins:37, dist:'9.5', rpe:7});
    console.log('  '+t.padEnd(5)+' sheet shows distance box: '+(lbl?'yes ('+lbl[1]+')':'no')+' | typed 9.5 -> stored '+JSON.stringify(logsAll().w1_wed));
  }
}

// ─────────────── P6 ───────────────
// The ruling's lens, from D223 item 5's text: restLog exists -> as is; else if rest_cardio: restLog[rest_type]={mins:rest_mins,rpe:rpe};
// run_dist>0 -> restLog.run.dist; swim_yards>0 -> restLog.swim.dist; bike_mins>0 -> restLog.bike.mins (the sum winning over rest_mins).
function rulingLens(e){ if(!e) return null; if(e.restLog) return e.restLog; if(!e.rest_cardio) return null; const R = {};
  R[e.rest_type] = { mins:e.rest_mins, rpe:e.rpe };
  if(+e.run_dist>0){ R.run = R.run || {}; R.run.dist = +e.run_dist; }
  if(+e.swim_yards>0){ R.swim = R.swim || {}; R.swim.dist = +e.swim_yards; }
  if(+e.bike_mins>0){ R.bike = R.bike || {}; R.bike.mins = +e.bike_mins; }
  return R; }
const WORD = {run:'run',bike:'ride',swim:'swim',row:'row',walk:'walk'};
const linesOf = R => Object.keys(R||{}).filter(t => R[t].mins).map(t => R[t].mins+' min '+(WORD[t]||t)+' logged \u00b7 RPE '+(R[t].rpe||'\u2014'));
if(PART==='all'||PART==='P6'){
  if(!IA) boot();
  console.log('\n════ P6 — V237 rest hero vs one line per type through the ruling\'s lens (HALF_MANNY, types run,bike,swim,walk) ════');
  const c = HALF(); c.cardioTypes = ['run','bike','swim']; const prog = buildP(c);
  const LOGS = { run:{type:'run',mins:37,dist:'3.7',rpe:7}, bike:{type:'bike',mins:37,dist:'',rpe:7}, swim:{type:'swim',mins:37,dist:'1370',rpe:7}, walk:{type:'walk',mins:37,dist:'',rpe:7} };
  const LOGS2 = { run:{type:'run',mins:20,dist:'2',rpe:5}, bike:{type:'bike',mins:20,dist:'',rpe:5}, swim:{type:'swim',mins:20,dist:'500',rpe:5}, walk:{type:'walk',mins:20,dist:'',rpe:5} };
  const seqs = []; Object.keys(LOGS).forEach(a => { seqs.push([a]); Object.keys(LOGS).forEach(b => { seqs.push([a,b]); Object.keys(LOGS).forEach(c3 => seqs.push([a,b,c3])); }); });
  const tally = { n:0, same:0, differ:0 }; const diffs = {};
  for(const sq of seqs){ install(prog, 1); T = dateOf(1,'wed'); sq.forEach((t,i) => jog(1, 'wed', i===0?LOGS[t]:LOGS2[t]));
    const h = weekHtml(); const m = h.match(/class="wk-rest-logged">([^<]*)</g) || []; const v237 = m.map(x => x.replace(/^class="wk-rest-logged">/,'').replace(/<$/,''));
    const btn = /'cardio'\)">Log more</.test(h) ? 'Log more' : 'Log cardio';
    const lens = linesOf(rulingLens(logsAll().w1_wed)); const same = JSON.stringify(v237) === JSON.stringify(lens);
    tally.n++; same ? tally.same++ : tally.differ++;
    if(!same){ const cls = sq.length+'-log '+(sq.every(t=>t===sq[0])?'same-type':'mixed')+(sq.includes('bike')?(sq.filter(t=>t==='bike').length>1?' bike x2+':' bike x1')+(sq[sq.length-1]==='bike'?' last':' not-last'):' no-bike'); inc(diffs, cls); if(diffs[cls]<=3) console.log('  DIFF '+sq.join('>')+' | V237 '+JSON.stringify(v237)+' btn '+btn+' | lens '+JSON.stringify(lens)+' | stored '+JSON.stringify(logsAll().w1_wed)); }
  }
  console.log('  sequences '+tally.n+' (1, 2 and 3 logs over run/bike/swim/walk; 1st 37 min RPE 7, later 20 min RPE 5) | byte-identical line set '+tally.same+' | differ '+tally.differ+' by class '+JSON.stringify(diffs));
  console.log('  V237 hero lines rendered per entry: always 1 (the _rcLine regex count is printed per DIFF row)');
}
console.log('\nDONE');
