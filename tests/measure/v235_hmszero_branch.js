// v235_hmszero_branch.js — MEASURE (Mode A) for P-HMSZERO / the V235 branch question (handoff §12, Post-V234).
//   node tests/measure/v235_hmszero_branch.js [index.html] [--quick]
// Question: a wheel whose first column sits on the dash, rolled ONLY in its later columns: does the ride/run save?
// Drive: the real open path (openDayKey, buildLogHTML, cardioFieldHTML, the listener arrays, iaWheelInit). Each column's
//   scrollTop setter dispatches scroll; a virtual clock runs the 90 ms settle, _iawCommit, the hidden input, input,
//   persistLogFields. DOM stub and clock copied verbatim from tests/gates/g233_d207_bikewheel.js mkEnv (g232 lineage).
// Oracle: hand arithmetic of the face the athlete leaves (dash read as 0 hours / 0 whole), never _iawFormat/_iawParse.
// Read-only measure; writes nothing but stdout.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const load = H.load;
const ART = path.resolve(process.argv[2] && !/^--/.test(process.argv[2]) ? process.argv[2] : path.join(ROOT, 'index.html'));
const QUICK = process.argv.includes('--quick');
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const J = JSON.stringify;
const P = s => console.log(s);
// ── ENV (verbatim from g233_d207_bikewheel.js lines 139-233) ──
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
// ── BODY ──
const t0 = Date.now();
const NUDGE = 'You logged this one but never marked it.';
const C = mkEnv(ART); const VER = +C.IA.version;
P('v235 measure P-HMSZERO branch | ' + ART + ' ia-version ' + VER);
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');
const LINES = C.IA.html.split('\n');

// §1 kinds with a dash in the first column, and every call site (comment-stripped line text)
P('\n§1 KINDS WITH A DASH (nil) IN COLUMN 0');
const SPEC = C.ev('JSON.stringify(_IAW_SPEC)'); const SP = JSON.parse(SPEC);
for(const k of Object.keys(SP)) P('  ' + k.padEnd(5) + ' fmt ' + SP[k].fmt.padEnd(6) + ' cols ' + SP[k].cols.length + ' col0 nil=' + !!SP[k].cols[0].nil + ' col0 ' + SP[k].cols[0].min + '..' + SP[k].cols[0].max);
P('  call sites (iaWheelHTML in rendered code, plan arg = 5th):');
LINES.forEach((l, i) => { const s = strip(l); const re = /iaWheelHTML\('(\w+)','(\w+)',([^)]*)\)/g; let m;
  while((m = re.exec(s))){ const args = m[3].split(','); P('    :' + (i + 1) + ' kind ' + m[1] + ' -> ' + m[2] + (args.length >= 3 ? ' PLAN ' + args[2] : ' no plan (opens on dash when unstored)')); } });

// §2 the commit format, hand table. Oracle: H*60+M+S/60 to two places with the dash read as 0 hours.
P('\n§2 _iawFormat (what the hidden input receives) for col0 in {dash,0,1} x MM:SS — oracle = hand (dash as 0 h)');
const fmt = (k, v) => C.ev('_iawFormat(' + J(k) + ',' + J(v) + ')');
const MS = [['45', '0'], ['30', '15'], ['0', '30'], ['59', '59'], ['1', '0'], ['0', '0']];
let tbl = 0, tblBad = 0;
for(const h of ['', '0', '1']) for(const [m, s] of MS){ const got = fmt('hms', [h, m, s]);
  const want = ((+(h || 0)) * 60 + (+m) + (+s) / 60).toFixed(2); tbl++; if(got !== want) tblBad++;
  P('  hms [' + (h === '' ? '—' : h) + ':' + m.padStart(2, '0') + ':' + s.padStart(2, '0') + '] -> ' + J(got) + '   hand ' + want + (got === want ? '' : '   <- LOST')); }
P('  hms: ' + tblBad + '/' + tbl + ' faces differ from hand');
const OTHER = [['dist', ['', '8', '6'], '0.86'], ['dist', ['0', '8', '6'], '0.86'], ['dist', ['3', '1', '0'], '3.10'], ['dist', ['', '1', '0'], '0.10'],
  ['rept', ['', '55'], '0:55'], ['rept', ['0', '55'], '0:55'], ['pace', ['', '30'], '(no 0-minute row; min is 4)'], ['pace', ['9', '30'], '9:30']];
for(const [k, v, want] of OTHER){ const got = fmt(k, v); P('  ' + k.padEnd(4) + ' ' + J(v) + ' -> ' + J(got) + '   hand ' + want + (got === want ? '' : '   <- differs')); }
P('  the read-back: _iawParse of each hms commit -> face');
for(const v of ['45.00', '0.50', '', '0', '60']) P('    parse(' + J(v) + ') = ' + C.ev('JSON.stringify(_iawParse("hms",' + J(v) + '))'));

// §3 DEVICE DRIVE across a lattice
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
const TAIL = { hms:[[1, '47'], [2, '13']], dist:[[1, '8'], [2, '6']], rept:[[1, '55']], pace:[[1, '30']] };
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
// hand intent: what the face reads when the athlete lets go, dash in col0 read as 0
function intent(kind, c0){ const h = c0 === '' ? 0 : +c0;
  if(kind === 'hms') return (h * 60 + 47 + 13 / 60).toFixed(2);
  if(kind === 'dist') return (h + 0.86).toFixed(2);
  if(kind === 'rept') return h + ':55';
  if(kind === 'pace') return c0 === '' ? null : c0 + ':30';
}
const colsOf = wh => wh._cols.map((c, i) => colv(wh, i));
// hand reading of a face: hms h*60+m+s/60, dist w.t h
const handFace = (kind, v) => kind === 'hms' ? ((+v[0]) * 60 + (+v[1]) + (+v[2]) / 60).toFixed(2) : kind === 'dist' ? (+v[0] + (+v[1]) / 10 + (+v[2]) / 100).toFixed(2) : null;
const field = { log_bike_mins:'bike_mins', log_run_mins:'run_mins', log_run_dist:'run_dist', log_run_pace:'run_pace', log_run_rep_time:'run_rep_time' };
const wipe = () => { [...C.LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => C.LS.removeItem(k)); }; // every drive starts from an empty store
const histHas = (w, d) => { const h = JSON.parse(C.LS.getItem('ia_hist_measure') || '{}'); return Object.keys(h).some(k => k.indexOf('w' + w + '_' + d) >= 0 || k === w + '_' + d || k.endsWith('_' + d) && k.indexOf(String(w)) >= 0); };
const RES = []; const CREDIT = {}; const ERR = [];
let nProgs = 0, nDays = 0;
for(const [name, cfg] of PROGS){
  let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  nProgs++; C.use(p); C.unforce();
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || (ct !== 'run' && ct !== 'bike')) continue;
    const dose = C.ev('__realDFC')(x.cardio); const dk = dose ? dose.k : 'null';
    nDays++;
    C.setLog(w, d, null); C.open(w, d);
    const hids = C.wheels().filter(wh => SP[wh.kind] && SP[wh.kind].cols[0].nil).map(wh => [wh.hid, wh.kind, wh.plan != null]);
    for(const [hid, kind, hasPlan] of hids){
      const shape = ct + '/' + dk + '/' + kind + ':' + hid.replace('log_', '');
      const scen = ['tail'].concat(hasPlan ? ['dash-then-tail', 'away-and-back-to-plan'] : []).concat(['zero-then-tail']);
      for(const sc of scen){
        try {
          wipe(); C.open(w, d);
          let wh = C.wheel(hid); const open0 = colv(wh, 0);
          const state = open0 === '' ? 'opens-dash' : 'opens-plan';
          if(sc === 'dash-then-tail'){ C.move(wh, 0, ''); }
          if(sc === 'zero-then-tail'){ C.move(wh, 0, kind === 'pace' ? '4' : '0'); }
          const planCols = colsOf(C.wheel(hid));
          if(sc === 'away-and-back-to-plan'){ const c1 = planCols[1]; C.move(C.wheel(hid), 1, String((+c1 + 1) % 10)); C.move(C.wheel(hid), 1, c1); }
          else for(const [ci, v] of TAIL[kind]) C.move(C.wheel(hid), ci, v);
          wh = C.wheel(hid); const left0 = colv(wh, 0);
          const want = sc === 'away-and-back-to-plan' ? handFace(kind, planCols) : intent(kind, left0);
          const e1 = C.entry(w, d), ins = C.INPUTS[hid] || 0, hv = C.els[hid] ? C.els[hid].value : null, hist1 = histHas(w, d);
          const got1 = e1 ? e1[field[hid]] : undefined;
          const key = shape + ' ' + state + ' ' + sc;
          let credit = null;
          if(!CREDIT[key]){ // credit readers on the first host of each key
            C.open(w, d); const nudge = C.els.detailBody.innerHTML.includes(NUDGE);
            C.ctx.__dots.length = 0; try { C.ev('renderProgressScreen')(); } catch(err){ }
            const ch = {}; C.ctx.__dots.forEach(a => { const t = String(a[0]).replace(/<svg[\s\S]*?<\/svg>/, '').trim(); const wk = Array.from(a[1]), dat = Array.from(a[2]); ch[t] = dat[wk.indexOf(w)]; });
            CREDIT[key] = { name, w, d, sub:x.cardio.subtype, entry:e1, nudge, charts:ch };
          }
          // the Done tap (handleDayStatus flushes and persists) on the same form
          wipe(); C.open(w, d); wh = C.wheel(hid);
          if(sc === 'dash-then-tail') C.move(wh, 0, ''); if(sc === 'zero-then-tail') C.move(wh, 0, kind === 'pace' ? '4' : '0');
          if(sc === 'away-and-back-to-plan'){ const c1 = planCols[1]; C.move(C.wheel(hid), 1, String((+c1 + 1) % 10)); C.move(C.wheel(hid), 1, c1); }
          else for(const [ci, v] of TAIL[kind]) C.move(C.wheel(hid), ci, v);
          C.ev("handleDayStatus('" + d + "','x','complete')"); C.advance(500);
          const e2 = C.entry(w, d), st = C.ev("statusOf(" + w + ",'" + d + "')");
          const got2 = e2 ? e2[field[hid]] : undefined;
          const ok = v => want == null ? null : (v != null && v !== '' && Math.abs(parseFloat(String(v).replace(':', '.')) - parseFloat(String(want).replace(':', '.'))) < 0.006);
          RES.push({ name, w, d, ct, dk, kind, hid, shape, state, sc, open0, left0, want, got1, hv, ins, hist1, got2, st, ok1:ok(got1), ok2:ok(got2),
            e2run:e2 ? { run_dist:e2.run_dist, run_pace:e2.run_pace, run_mins:e2.run_mins } : null, sub:x.cardio.subtype });
        } catch(err){ ERR.push(name + ' W' + w + ' ' + d + ' ' + hid + ' ' + sc + ': ' + String(err.message).slice(0, 120)); }
      }
    }
  }
}
P('\n§3 DEVICE DRIVE: ' + nProgs + ' programs, ' + nDays + ' run/bike days opened, ' + RES.length + ' wheel x scenario drives, ' + ERR.length + ' errors, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 8).forEach(e => P('  ERR ' + e));
const seg = {};
for(const r of RES){ const k = r.shape + ' | ' + r.state + ' | ' + r.sc; const s = seg[k] = seg[k] || { n:0, lost1:0, lost2:0, na:0, ins0:0, hist0:0, ex:null, good:null };
  s.n++; if(r.want == null){ s.na++; } else { if(!r.ok1) s.lost1++; if(!r.ok2) s.lost2++; }
  if(r.ins === 0) s.ins0++; if(!r.hist1) s.hist0++;
  if(r.want != null && !r.ok2 && !s.ex) s.ex = r; if(r.ok2 && !s.good) s.good = r; }
P('  shape | open face | scenario : drives, LOST after roll settles, LOST after Done tap, 0 input events, no freeze snapshot  [example]');
for(const k of Object.keys(seg).sort()){ const s = seg[k], e = s.ex || s.good || {};
  P('  ' + k + ' : n ' + s.n + ', lost-settle ' + s.lost1 + ', lost-done ' + s.lost2 + (s.na ? ', no-intent ' + s.na : '') + ', input0 ' + s.ins0 + ', nofreeze ' + s.hist0
    + '  [' + e.name + ' W' + e.w + ' ' + e.d + ' "' + e.sub + '" open ' + J(e.open0) + ' left ' + J(e.left0) + ' hand ' + J(e.want) + ' stored ' + J(e.got1) + ' / after Done ' + J(e.got2) + ' status ' + J(e.st) + ']'); }
const shapes = new Set(RES.map(r => r.shape + '|' + r.state));
const lostShapes = new Set(RES.filter(r => r.want != null && !r.ok2).map(r => r.shape + '|' + r.state + '|' + r.sc));
const hmsTail = RES.filter(r => r.kind === 'hms' && r.sc === 'tail');
P('\n  HEADLINE hms wheels, tail-only roll: opens-dash ' + hmsTail.filter(r => r.state === 'opens-dash' && !r.ok2).length + '/' + hmsTail.filter(r => r.state === 'opens-dash').length + ' lost after Done; opens-plan ' + hmsTail.filter(r => r.state === 'opens-plan' && !r.ok2).length + '/' + hmsTail.filter(r => r.state === 'opens-plan').length + ' lost');
const hmsDash = RES.filter(r => r.kind === 'hms' && r.sc === 'dash-then-tail');
P('  hms opens-plan then hours rolled to dash, then tail: ' + hmsDash.filter(r => !r.ok2).length + '/' + hmsDash.length + ' lost after Done');
const hmsZero = RES.filter(r => r.kind === 'hms' && r.sc === 'zero-then-tail');
P('  hms control (hours set to 0 first): ' + hmsZero.filter(r => !r.ok2).length + '/' + hmsZero.length + ' lost after Done');
P('  distinct shape x open-face states driven: ' + shapes.size + ' -> ' + [...shapes].sort().join(', '));
// by goal and week, hms tail on dash
const by = (f) => { const o = {}; hmsTail.filter(r => r.state === 'opens-dash').forEach(r => { const k = f(r); o[k] = o[k] || [0, 0]; o[k][1]++; if(!r.ok2) o[k][0]++; }); return Object.entries(o).map(([k, v]) => k + ' ' + v[0] + '/' + v[1]).join(', '); };
P('  segment hms opens-dash tail lost/total by goal: ' + by(r => r.name.split('|')[0]));
P('  by week: ' + by(r => 'W' + r.w));
// collateral on the run dist-dose form: what else the lost minutes take with them
const rd = RES.filter(r => r.dk === 'dist' && r.kind === 'hms' && r.state === 'opens-dash');
for(const sc of ['tail', 'zero-then-tail']){ const L = rd.filter(r => r.sc === sc);
  P('  run dist-dose ' + sc + ': entries with run_dist empty ' + L.filter(r => !r.e2run || !r.e2run.run_dist).length + '/' + L.length + ', run_pace empty ' + L.filter(r => !r.e2run || !r.e2run.run_pace).length + '/' + L.length + ', status complete ' + L.filter(r => r.st === 'complete').length + '/' + L.length); }

P('\n§4 CREDIT READERS on the first host of each key (entry before Done; _hasLog nudge on reopen; Progress chart value for that week)');
for(const k of Object.keys(CREDIT).sort()) if(/hms/.test(k)){ const c = CREDIT[k];
  const chs = Object.entries(c.charts).filter(([t]) => /Cycling|Running Mileage|RPE/.test(t)).map(([t, v]) => t.replace(/^\W+/, '') + '=' + J(v)).join('; ');
  P('  ' + k + ' [' + c.name + ' W' + c.w + ' ' + c.d + ']: entry ' + (c.entry ? J({ bike_mins:c.entry.bike_mins, run_mins:c.entry.run_mins, run_dist:c.entry.run_dist, run_pace:c.entry.run_pace, rpe:c.entry.rpe }) : 'NONE (no ia_logs_ key)') + ' | nudge ' + c.nudge + ' | ' + chs); }

P('\n§5 READERS of the hidden ids / stored fields (comment-stripped, file:line)');
for(const tok of ['log_run_mins', 'log_bike_mins', 'run_mins', 'bike_mins', '_iawFormat(', '_iawSeedFace']){
  const hits = []; LINES.forEach((l, i) => { if(strip(l).includes(tok)) hits.push(i + 1); }); P('  ' + tok + ' (' + hits.length + '): ' + hits.join(', ')); }
P('\nruntime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | drives ' + RES.length + ' | errors ' + ERR.length);
