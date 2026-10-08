// v235_clear_reopen.js — MEASURE (standing ruling 7: a gate row that cannot pass) for D215-clear, V235.
//   node tests/measure/v235_clear_reopen.js <base_v234.html> <candidate index.html> [--quick]
// Question: a stored dose=dist run REOPENED and its free time wheel cleared: what is stored, what each reader credits,
//   is it pre-existing at V234, which gestures fully clear it, and which other forms carry a stamped sibling that survives.
// Drive: the real open path (openDayKey, buildLogHTML, cardioFieldHTML, listener arrays, iaWheelInit), the real Done tap
//   (handleDayStatus) and ‹ Back (closeDetail). DOM stub + virtual clock = mkEnv copied verbatim from
//   tests/measure/v235_hmszero_branch.js (g233_d207_bikewheel.js lineage); one addition: hidden <input> .value coerces to a
//   string as the DOM does (doseRep writes a number; the stub kept it a number, so a real "0" would have read falsy).
// Oracle: hand. Logged values are what the hand rolled (47:13 -> "47.22"; 0.86 mi; reps); the stamp oracle is the
//   planned miles off the dose strip (String(dose.mi)) and pace = 2833.2 s / miles by hand. Reader credit is each reader's
//   own predicate restated from its line (cited) and cross-checked against the rendered app on the first host of each key.
// Read-only measure; writes nothing but stdout.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const load = H.load;
const ARGS = process.argv.slice(2).filter(a => !/^--/.test(a));
const BASE = path.resolve(ARGS[0]), CAND = path.resolve(ARGS[1] || path.join(ROOT, 'index.html'));
const QUICK = process.argv.includes('--quick');
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const J = JSON.stringify;
const P = s => console.log(s);
function mkEnv(file){
  const IA = load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage;
  let VNOW = new RealDate(2026, 8, 21, 10).getTime();
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(VNOW); } static now(){ return VNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => VNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every) => { const id = tid++; T.set(id, { fn, at:VNOW + Math.max(0, +ms || 0), every }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0); ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.requestAnimationFrame = fn => sched(() => fn(VNOW), 16, 0);
  ctx.clearTimeout = id => T.delete(id); ctx.clearInterval = id => T.delete(id); ctx.cancelAnimationFrame = id => T.delete(id);
  if(ctx.window && ctx.window !== ctx) Object.assign(ctx.window, { setTimeout:ctx.setTimeout, setInterval:ctx.setInterval, clearTimeout:ctx.clearTimeout,
    clearInterval:ctx.clearInterval, requestAnimationFrame:ctx.requestAnimationFrame, performance:ctx.performance, Date:FD });
  const advance = ms => { const end = VNOW + ms;
    for(let n = 0; n < 200000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if(!b) break; const [id, t] = b; VNOW = t.at; if(t.every) t.at += t.every; else T.delete(id);
      try { t.fn(); } catch(e){ errs.push(e.message); } }
    VNOW = end; };
  if(ev('typeof Event') === 'undefined') ctx.Event = class { constructor(t){ this.type = t; } };
  const els = {}; let WHEELS = []; let parsedIds = new Set(); const INPUTS = {};
  const unq = s => s.replace(/&quot;/g, '"');
  function mk(id){
    const cls = new Set(), lis = {};
    const e = { id, value:'', textContent:'', style:{}, dataset:{}, children:[], offsetWidth:0, offsetHeight:0, offsetTop:0, offsetLeft:0, scrollTop:0, _html:'',
      classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)),
        toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
      addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){},
      dispatchEvent:evt => { if(evt.type === 'input') INPUTS[id] = (INPUTS[id] || 0) + 1; (lis[evt.type] || []).forEach(f => f({ target:e, currentTarget:e, type:evt.type })); return true; },
      setAttribute(){}, getAttribute(){ return null; }, appendChild(){}, removeChild(){}, remove(){}, insertAdjacentHTML(){},
      querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, setPointerCapture(){},
      getBoundingClientRect(){ return { top:0, left:0, width:0, height:0, bottom:0, right:0 }; }, scrollIntoView(){}, focus(){}, blur(){},
      get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x)); } };
    if(id === 'detailBody' || id === 'cardioFields')
      Object.defineProperty(e, 'innerHTML', { get(){ return e._html; }, set(v){ e._html = String(v); reparse(e._html, id === 'detailBody'); } });
    else e.innerHTML = '';
    if(id === 'detailOverlay') e.querySelectorAll = s => s === '.iaw-col' ? [].concat(...WHEELS.map(w => w._cols)) : [];
    return e;
  }
  function reparse(html, full){
    if(full){ for(const id of parsedIds) delete els[id]; parsedIds = new Set(); }
    const re = /<(\w+)([^>]*?)\sid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(html))){ const id = m[3], attrs = m[2] + ' ' + m[4]; if(id === 'detailBody' || id === 'cardioFields') continue;
      const el = mk(id); const vm = attrs.match(/\svalue="([^"]*)"/); if(vm) el.value = unq(vm[1]);
      let dm; const dre = /\sdata-([a-z]+)="([^"]*)"/g; while((dm = dre.exec(attrs))) el.dataset[dm[1]] = unq(dm[2]);
      els[id] = el; parsedIds.add(id); }
    WHEELS = parseWheels(html);
  }
  function parseWheels(html){
    const out = []; const parts = html.split('<div class="iaw" ').slice(1);
    for(const p of parts){
      const head = p.match(/^data-kind="([^"]+)" data-for="([^"]+)"(?: data-plan="([^"]*)")?>/); if(!head) continue;
      const body = p.slice(0, p.indexOf('<input type="hidden"') < 0 ? p.length : p.indexOf('<input type="hidden"'));
      const cols = []; const cre = /<div class="iaw-col" data-ci="(\d+)" data-wrap="(1?)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g; let c;
      while((c = cre.exec(body))){
        const items = []; const ire = /<div class="iaw-it(?: nil)?" data-v="([^"]*)">([^<]*)<\/div>/g; let it;
        while((it = ire.exec(c[4]))){ const v = it[1]; items.push({ v, face:it[2], style:{}, getAttribute:k => k === 'data-v' ? v : null }); }
        const lis = {}; let st = 0; const attrs = { 'data-ci':c[1], 'data-wrap':c[2], 'data-len':c[3] };
        cols.push({ style:{}, _lis:lis, items, wrap:c[2], len:c[3], getAttribute:k => attrs[k] == null ? null : attrs[k], querySelectorAll:s => s === '.iaw-it' ? items : [],
          addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); },
          get scrollTop(){ return st; }, set scrollTop(v){ st = v; (lis.scroll || []).forEach(f => f()); } });
      }
      const a = { 'data-kind':head[1], 'data-for':head[2], 'data-plan':head[3] == null ? null : unq(head[3]) };
      out.push({ _cols:cols, kind:head[1], hid:head[2], plan:a['data-plan'], getAttribute:k => a[k] == null ? null : a[k], querySelectorAll:s => s === '.iaw-col' ? cols : [] });
    }
    return out;
  }
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  if(!doc.addEventListener) doc.addEventListener = function(){};
  const SCREENS = [...new Set((IA.html.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar'))
    : sel === '.iaw' ? WHEELS : sel === '.iaw-col' ? [].concat(...WHEELS.map(w => w._cols)) : [];
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'screenWeek', 'daysList', 'progressBody'].forEach(i => doc.getElementById(i));
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  ev('var __realDFC=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE_ON ? globalThis.__FORCE : __realDFC(c); };');
  ev('var __dots=[]; var __realBDC=buildDotChart; buildDotChart=function(){ __dots.push(Array.prototype.slice.call(arguments,0,3)); return __realBDC.apply(this,arguments); };');
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.force = d => { ctx.__FORCE_ON = true; ctx.__FORCE = d; };
  E.unforce = () => { ctx.__FORCE_ON = false; ctx.__FORCE = null; };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'measure'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1; progressViewId=null;'); ev("showScreen('screenWeek')"); return q; };
  E.logs = () => LS.getItem('ia_logs_measure') || '{}';
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;
  E.setLog = (w, d, entry) => { const L = JSON.parse(E.logs()); if(entry == null) delete L['w' + w + '_' + d]; else L['w' + w + '_' + d] = entry; LS.setItem('ia_logs_measure', J(L)); };
  E.open = (w, d) => { ev('currentWeek=' + w + ';'); els.detailOverlay.classList.remove('open'); els.detailBody.innerHTML = '';
    for(const k in INPUTS) delete INPUTS[k]; ev("openDayKey('" + d + "')"); advance(500); };
  E.inputs = () => Object.values(INPUTS).reduce((a, b) => a + b, 0);
  E.form = () => { const b = els.detailBody.innerHTML; return (b.match(/<div id="cardioFields">([\s\S]*?)<\/div>\s*<button type="button" id="cardioSwapLink"/) || [])[1] || ''; };
  E.face = wh => { const f = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.face : '?'; }); return wh.kind === 'hms' ? f.join(':') : f.join(''); };
  E.wheel = hid => WHEELS.find(w => w.hid === hid) || null;
  E.move = (wh, ci, v) => { const c = wh._cols[ci], cur = Math.round(c.scrollTop / 44); let best = -1;
    for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
    if(best < 0) throw new Error('no row ' + v + ' in column ' + ci); c.scrollTop = best * 44; advance(500); };
  return E;
}
// ── BODY ──// ── BODY ──
const t0 = Date.now();
const NUDGE = 'You logged this one but never marked it.';
const mkCfg = (sports, f, ex, eq, sd) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd }; };
const PROGS = [['HALF_MANNY', JSON.parse(J(H.fixtures.HALF_MANNY))]];
const GOALS = [['bike', 'bike_century'], ['bike', 'bike_50'], ['bike', 'bike_base'], ['bike', 'bike_ftp'], ['bike', 'bike_cals'],
  ['run', 'run_5k'], ['run', 'run_10k'], ['run', 'run_half'], ['run', 'run_marathon'], ['run', 'run_base'], ['run', 'run_pace_goal']];
const FOC = QUICK ? ['balanced'] : ['balanced', 'strength'], EXP = QUICK ? ['intermediate'] : ['beginner', 'advanced'], SEEDS = QUICK ? [76308] : [76308, 24865];
for(const g of GOALS) for(const f of FOC) for(const ex of EXP) for(const sd of SEEDS) PROGS.push([g[1] + '|' + f + '|' + ex + '|' + sd, mkCfg([g], f, ex, 'commercial', sd)]);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
// readers, each restated from its own line (cited) — credit as the reader computes it
const RD = {
  weekMiles: e => { const v = parseFloat((e || {}).run_dist); return isNaN(v) ? 0 : v; },                       // :12206 renderWeekView
  progRun:   e => (e && e.run_dist && +e.run_dist > 0) ? +e.run_dist : 0,                                      // :17513 renderProgressScreen
  plannedVsLogged: e => (e && +e.run_dist > 0) ? +e.run_dist : 0,                                              // :16659
  ladder:    e => (e && +e.run_dist > 0) ? 1 : 0,                                                               // :16589 ladderWeekly
  hasLog:    e => !!(e && ((e.notes && e.notes.trim()) || e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time || e.bike_mins || e.swim_yards)), // :14175
  session:   e => !!(e && (e.rpe || e.run_dist || e.bike_mins || e.swim_yards || e.notes)),                     // :17520
  bike:      e => (e && e.bike_mins && +e.bike_mins > 0) ? +e.bike_mins : 0                                     // :17514 area
};
const RES = [], ERR = [], ACT = {}, SEEDEV = {};
function runFile(tag, file){
  const C = mkEnv(file); const VER = +C.IA.version; const SP = JSON.parse(C.ev('JSON.stringify(_IAW_SPEC)'));
  P(tag + ' ' + file + ' ia-version ' + VER + ' | hms col0 nil=' + !!SP.hms.cols[0].nil + ' | dist col0 nil=' + !!SP.dist.cols[0].nil);
  const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
    Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
  const open = (w, d) => { C.open(w, d); ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe'].forEach(strv); };
  const wipe = () => { [...C.LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => C.LS.removeItem(k)); };
  const W = hid => { const w = C.wheel(hid); if(!w) throw new Error('no wheel ' + hid); return w; };
  const mv = (hid, ci, v) => { if(colv(W(hid), ci) !== v) C.move(W(hid), ci, v); };
  const G = {
    T_zero: f => { const h = f === 'bike' ? 'log_bike_mins' : 'log_run_mins'; mv(h, 0, '0'); mv(h, 1, '0'); mv(h, 2, '0'); },
    T_dash: f => { const h = f === 'bike' ? 'log_bike_mins' : 'log_run_mins'; if(!W(h)._cols[0].items.some(i => i.v === '')) throw new Error('NOROW'); mv(h, 0, ''); },
    M_dash: () => mv('log_run_dist', 0, ''),
    M_zero: () => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '0'); mv('log_run_dist', 2, '0'); },
    P_dash: () => mv('log_run_rep_time', 0, ''),
    R_down: () => { C.ev('doseRep(-99)'); C.advance(200); }
  };
  const LOG = {
    dist: () => { mv('log_run_mins', 0, '0'); mv('log_run_mins', 1, '47'); mv('log_run_mins', 2, '13'); },
    time: () => { mv('log_run_mins', 0, '0'); mv('log_run_mins', 1, '47'); mv('log_run_mins', 2, '13'); mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '8'); mv('log_run_dist', 2, '6'); },
    reps_time: () => { C.ev('doseRep(0)'); C.advance(200); mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '8'); mv('log_run_dist', 2, '6'); },
    reps_dist: () => { C.ev('doseRep(0)'); C.advance(200); mv('log_run_rep_time', 0, '0'); mv('log_run_rep_time', 1, '55'); },
    bike: () => { mv('log_bike_mins', 0, '0'); mv('log_bike_mins', 1, '47'); mv('log_bike_mins', 2, '13'); }
  };
  const GEST = {
    dist: ['T_zero', 'T_dash', 'M_dash', 'M_zero', 'T_zero+M_dash', 'M_dash+T_zero', 'T_dash+M_dash', 'M_dash+T_dash'],
    time: ['T_zero', 'T_dash', 'M_dash', 'M_zero', 'T_zero+M_dash', 'T_dash+M_dash'],
    reps_time: ['M_dash', 'M_zero', 'R_down', 'M_dash+R_down'],
    reps_dist: ['P_dash', 'R_down', 'P_dash+R_down'],
    bike: ['T_zero', 'T_dash']
  };
  const FLOWS = f => f === 'dist' ? ['done>done', 'close>done', 'done>close', 'ctl>done'] : ['close>done', 'ctl>done'];
  const finish = (x, d) => { if(x === 'done'){ C.ev("handleDayStatus('" + d + "','x','complete')"); C.advance(500); } else { C.ev('closeDetail()'); C.advance(200); } };
  const snap = (w, d) => { const e = C.entry(w, d); const hist = JSON.parse(C.LS.getItem('ia_hist_measure') || '{}');
    return { e, st:C.ev("statusOf(" + w + ",'" + d + "')"), hist:!!hist['w' + w + '_' + d] }; };
  let nP = 0, nDays = {};
  for(const [name, cfg] of PROGS){
    let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(tag + ' ' + name + ' build ' + e.message); continue; }
    nP++; C.use(p); C.unforce();
    for(const w of weeksOf(p)) for(const d of DAYS){
      const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || (ct !== 'run' && ct !== 'bike')) continue;
      const dose = C.ev('__realDFC')(x.cardio);
      const form = ct === 'bike' ? 'bike' : dose ? dose.k : null; if(!form) continue;
      nDays[form] = (nDays[form] || 0) + 1;
      for(const flow of FLOWS(form)) for(const g of GEST[form]){
        const [S, X] = flow.split('>');
        try {
          wipe(); open(w, d); LOG[form]();
          const logged = J(C.entry(w, d));
          let seed = null;
          if(S !== 'ctl'){ finish(S, d); open(w, d);
            seed = { dist:C.els.log_run_dist ? C.els.log_run_dist.value : null, mins:C.els.log_run_mins ? C.els.log_run_mins.value : null,
              tf:C.wheel('log_run_mins') ? C.face(C.wheel('log_run_mins')) : null, df:C.wheel('log_run_dist') ? C.face(C.wheel('log_run_dist')) : null }; }
          let na = false;
          try { g.split('+').forEach(k => G[k](form)); } catch(err){ if(/NOROW/.test(err.message)) na = true; else throw err; }
          if(na){ RES.push({ tag, name, w, d, form, flow, g, na:true }); continue; }
          finish(X, d);
          const s = snap(w, d);
          const r = { tag, name, w, d, form, flow, g, logged:JSON.parse(logged), seed, ...s, mi:dose && dose.mi, sub:x.cardio.subtype };
          RES.push(r);
          const key = tag + '|' + form + '|' + flow + '|' + g;
          if(!ACT[key]){ // rendered cross-check on first host
            open(w, d); const nudge = C.els.detailBody.innerHTML.includes(NUDGE);
            C.ctx.__dots.length = 0; try { C.ev('renderProgressScreen')(); } catch(err){ }
            const ch = {}; C.ctx.__dots.forEach(a => { const t = String(a[0]).replace(/<svg[\s\S]*?<\/svg>/, '').replace(/^\W+/, '').trim(); const wk = Array.from(a[1]), dat = Array.from(a[2]); ch[t] = dat[wk.indexOf(w)]; });
            let wv = null; try { C.ev('renderWeekView()'); const html = Object.values(C.els).map(e => e.innerHTML || '').join(' '); const m = html.match(/([\d.]+)\s*(?:mi|miles)\b[^<]{0,30}/i); wv = m ? m[0].slice(0, 40) : null; } catch(err){}
            ACT[key] = { r, nudge, ch };
          }
        } catch(err){ ERR.push(tag + ' ' + name + ' W' + w + ' ' + d + ' ' + form + ' ' + flow + ' ' + g + ': ' + String(err.message).slice(0, 140)); }
      }
    }
  }
  P('  ' + tag + ': ' + nP + ' programs, days by form ' + J(nDays) + ', errors so far ' + ERR.length + ', ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  return { VER, nDays };
}
const INFO = { V234:runFile('V234', BASE), V235:runFile('V235', CAND) };
ERR.slice(0, 10).forEach(e => P('  ERR ' + e)); P('  errors total ' + ERR.length);
// classification, oracle = hand values of what was rolled and of the plan strip
const cls = (r, f) => { const v = r.e ? r.e[f] : undefined; const lv = r.logged ? r.logged[f] : undefined;
  if(v == null) return 'NOKEY'; if(v === '') return '∅'; if(v === lv) return 'kept'; return 'new:' + v; };
const handPace = mi => { const sec = 2833.2 / mi; return sec; };
const FIELDS = { dist:['run_mins', 'run_dist', 'run_pace'], time:['run_mins', 'run_dist', 'run_pace'], reps_time:['run_reps', 'run_dist', 'run_pace'], reps_dist:['run_reps', 'run_rep_time', 'run_dist', 'run_pace'], bike:['bike_mins'] };
P('\n§0 LOG STEP ORACLE (hand): dose=dist entries after the 47:13 roll: run_mins "47.22", run_dist String(dose.mi), run_pace within 1 s of 2833.2/mi');
for(const tag of ['V234', 'V235']){ const L = RES.filter(r => r.tag === tag && r.form === 'dist' && !r.na && r.logged); let ok = 0, ex = null;
  for(const r of L){ const e = r.logged; const ps = e.run_pace ? e.run_pace.match(/^(\d+):(\d\d)/) : null; const pv = ps ? +ps[1] * 60 + +ps[2] : NaN;
    if(e.run_mins === '47.22' && e.run_dist === String(r.mi) && Math.abs(pv - handPace(r.mi)) <= 1) ok++; else if(!ex) ex = r; }
  P('  ' + tag + ' ' + ok + '/' + L.length + ' match hand' + (ex ? '  first miss ' + ex.name + ' W' + ex.w + ' ' + ex.d + ' ' + J(ex.logged) : '')); }
P('\n§1 REOPEN SEED (dose=dist, reopened flows): hidden log_run_dist value and faces on reopen');
for(const tag of ['V234', 'V235']){ const L = RES.filter(r => r.tag === tag && r.form === 'dist' && r.seed); const h = {};
  L.forEach(r => { const k = 'dist.value==String(mi) ' + (r.seed.dist === String(r.mi)) + ' | time face ' + r.seed.tf + ' | miles face==plan ' + (r.seed.df === null ? null : true); h[k] = (h[k] || 0) + 1; });
  P('  ' + tag + ' n ' + L.length + ' ' + J(h)); }
P('\n§2 STORED AFTER EACH GESTURE, by file x form x flow x gesture (field classes: ∅ empty, kept = the logged value, new:v)');
const seg = {};
for(const r of RES){ const k = r.form + ' | ' + r.flow + ' | ' + r.g + ' | ' + r.tag; const s = seg[k] = seg[k] || { n:0, na:0, sig:{}, rd:{ weekMiles:0, progRun:0, hasLog:0, session:0, bike:0, plannedVsLogged:0 }, st:{}, hist:0, ex:null };
  if(r.na){ s.na++; continue; } s.n++;
  const sig = FIELDS[r.form].map(f => f.replace('run_', '') + '=' + cls(r, f)).join(' '); s.sig[sig] = (s.sig[sig] || 0) + 1;
  for(const k2 of Object.keys(s.rd)) if(RD[k2](r.e)) s.rd[k2]++;
  s.st[r.st] = (s.st[r.st] || 0) + 1; if(r.hist) s.hist++; if(!s.ex) s.ex = r; }
for(const k of Object.keys(seg).sort()){ const s = seg[k];
  if(s.na && !s.n){ P('  ' + k + ' : NOT REACHABLE (' + s.na + ' drives: no dash row in the hours column)'); continue; }
  const sigs = Object.entries(s.sig).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a, b]) => '{' + a + '} ' + b).join(' ; ');
  const vis = Object.keys(s.sig).length > 4 ? ' (+' + (Object.keys(s.sig).length - 4) + ' sigs)' : '';
  P('  ' + k + ' : n ' + s.n + ' | ' + sigs + vis + ' | status ' + J(s.st) + ' freeze ' + s.hist + '/' + s.n
    + ' | credited: weekMiles ' + s.rd.weekMiles + ', progRun ' + s.rd.progRun + ', plannedVsLogged ' + s.rd.plannedVsLogged + ', _hasLog ' + s.rd.hasLog + ', session ' + s.rd.session + (s.ex.form === 'bike' ? ', bike ' + s.rd.bike : '')
    + '  [ex ' + s.ex.name + ' W' + s.ex.w + ' ' + s.ex.d + ' "' + s.ex.sub + '" ' + J(s.ex.e && { run_mins:s.ex.e.run_mins, run_dist:s.ex.e.run_dist, run_pace:s.ex.e.run_pace, run_reps:s.ex.e.run_reps, run_rep_time:s.ex.e.run_rep_time, bike_mins:s.ex.e.bike_mins, rpe:s.ex.e.rpe }) + ']'); }
P('\n§3 HEADLINE: the D215-clear gesture on a reopened dose=dist run (V235 T_zero; V234 T_dash = roll hours to the dash)');
for(const [tag, g] of [['V235', 'T_zero'], ['V234', 'T_dash'], ['V234', 'T_zero']]) for(const flow of ['done>done', 'close>done', 'done>close', 'ctl>done']){
  const L = RES.filter(r => r.tag === tag && r.form === 'dist' && r.g === g && r.flow === flow && !r.na);
  const full = L.filter(r => r.e && !r.e.run_mins && !r.e.run_dist && !r.e.run_pace).length, distSurv = L.filter(r => r.e && r.e.run_dist).length;
  P('  ' + tag + ' ' + g.padEnd(6) + ' ' + flow.padEnd(10) + ': fully cleared ' + full + '/' + L.length + ', run_dist survives ' + distSurv + '/' + L.length + ', progRun credited ' + L.filter(r => RD.progRun(r.e)).length + '/' + L.length + ', _hasLog ' + L.filter(r => RD.hasLog(r.e)).length + '/' + L.length); }
const hd = RES.filter(r => r.tag === 'V235' && r.form === 'dist' && r.g === 'T_zero' && r.flow === 'close>done');
const by = f => { const o = {}; hd.forEach(r => { const k = f(r); o[k] = o[k] || [0, 0]; o[k][1]++; if(r.e && r.e.run_dist) o[k][0]++; }); return Object.entries(o).map(([k, v]) => k + ' ' + v[0] + '/' + v[1]).join(', '); };
P('  segment V235 T_zero close>done run_dist survives, by goal: ' + by(r => r.name.split('|')[0]));
P('  by focus: ' + by(r => r.name.split('|')[1] || 'fixture') + ' | by exp: ' + by(r => r.name.split('|')[2] || 'fixture'));
P('  by week: ' + by(r => 'W' + r.w));
P('  survived run_dist == String(dose.mi) (the plan stamp, hand): ' + hd.filter(r => r.e && r.e.run_dist === String(r.mi)).length + '/' + hd.filter(r => r.e && r.e.run_dist).length);
P('\n§4 PRE-EXISTING? V234 vs V235 stored entry (ts stripped) + status + freeze, byte-equal per day');
const kOf = r => r.name + '|W' + r.w + '|' + r.d + '|' + r.form + '|' + r.flow;
const sig2 = r => J([r.e ? Object.fromEntries(Object.entries(r.e).filter(([k]) => k !== 'ts').sort()) : null, r.st, r.hist]);
const idx = {}; RES.filter(r => !r.na).forEach(r => { idx[r.tag + '|' + r.g + '|' + kOf(r)] = r; });
const pairs = [['dist', 'T_zero', 'T_dash', 'D215 clear vs V234 dash clear'], ['dist', 'T_zero', 'T_zero', 'same gesture 0:00:00'], ['dist', 'M_dash', 'M_dash', ''], ['dist', 'T_zero+M_dash', 'T_dash+M_dash', ''], ['dist', 'M_dash+T_zero', 'M_dash+T_dash', ''], ['dist', 'M_zero', 'M_zero', ''],
  ['time', 'T_zero', 'T_dash', ''], ['time', 'T_zero', 'T_zero', ''], ['time', 'M_dash', 'M_dash', ''], ['reps_time', 'M_dash', 'M_dash', ''], ['reps_dist', 'P_dash', 'P_dash', ''], ['bike', 'T_zero', 'T_dash', ''], ['bike', 'T_zero', 'T_zero', '']];
for(const [form, g5, g4, note] of pairs) for(const flow of (form === 'dist' ? ['done>done', 'close>done', 'done>close', 'ctl>done'] : ['close>done', 'ctl>done'])){
  const L = RES.filter(r => r.tag === 'V235' && r.form === form && r.g === g5 && r.flow === flow && !r.na); let eq = 0, miss = 0, ex = null;
  for(const r of L){ const o = idx['V234|' + g4 + '|' + kOf(r)]; if(!o){ miss++; continue; } if(sig2(o) === sig2(r)) eq++; else if(!ex) ex = [r, o]; }
  P('  ' + form + ' ' + flow + ' V235 ' + g5 + ' vs V234 ' + g4 + (note ? ' (' + note + ')' : '') + ': equal ' + eq + '/' + L.length + (miss ? ', no V234 pair ' + miss : '')
    + (ex ? '  first diff V235 ' + J({ m:ex[0].e && ex[0].e.run_mins, d:ex[0].e && ex[0].e.run_dist, p:ex[0].e && ex[0].e.run_pace, b:ex[0].e && ex[0].e.bike_mins, st:ex[0].st }) + ' V234 ' + J({ m:ex[1].e && ex[1].e.run_mins, d:ex[1].e && ex[1].e.run_dist, p:ex[1].e && ex[1].e.run_pace, b:ex[1].e && ex[1].e.bike_mins, st:ex[1].st }) : '')); }
P('\n§5 RENDERED CROSS-CHECK on the first host of each key (nudge on reopen; Progress chart value that week) vs the restated predicates');
let agree = 0, dis = 0; const disL = [];
for(const k of Object.keys(ACT).sort()){ const a = ACT[k], r = a.r; const cr = Object.entries(a.ch).find(([t]) => /Running Mileage/.test(t)), cb = Object.entries(a.ch).find(([t]) => /Cycling/.test(t));
  const wantNudge = !r.st && RD.hasLog(r.e); const okN = a.nudge === wantNudge;
  const okR = !cr || Math.abs((+cr[1] || 0) - RD.progRun(r.e)) < 1e-9; const okB = !cb || Math.abs((+cb[1] || 0) - RD.bike(r.e)) < 1e-9;
  if(okN && okR && okB) agree++; else { dis++; disL.push(k + ' nudge ' + a.nudge + '/' + wantNudge + ' run ' + (cr && cr[1]) + '/' + RD.progRun(r.e) + ' bike ' + (cb && cb[1]) + '/' + RD.bike(r.e)); }
  if(/\|dist\|/.test(k) && /T_zero$|T_dash$/.test(k)) P('  ' + k + ': status ' + J(r.st) + ' nudge ' + a.nudge + ' | charts ' + Object.entries(a.ch).map(([t, v]) => t.slice(0, 28) + '=' + J(v)).join('; ')); }
P('  predicate vs rendered: agree ' + agree + '/' + (agree + dis) + ' keys'); disL.slice(0, 8).forEach(x => P('    DIS ' + x));
P('\n§6 call sites (comment-stripped) — writers and readers of run_dist on the candidate');
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');
const LINES = fs.readFileSync(CAND, 'utf8').split('\n');
const fnOf = n => { for(let i = n - 1; i >= 0; i--){ const m = LINES[i].match(/^\s*(?:async )?function ([A-Za-z_$][\w$]*)/); if(m) return m[1]; } return '?'; };
for(const tok of ['run_dist', 'log_run_dist']){ const hits = []; LINES.forEach((l, i) => { if(strip(l).includes(tok)) hits.push((i + 1) + ':' + fnOf(i + 1)); }); P('  ' + tok + ' (' + hits.length + '): ' + hits.join(', ')); }
P('\nruntime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | drives ' + RES.length + ' | errors ' + ERR.length);
