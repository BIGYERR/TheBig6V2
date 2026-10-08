// g235_d215_hmszero.js — GATE for D215 (P-HMSZERO: the hms hours column has no dash row; a blank hms wheel opens on
// 0:00:00 and the zero face stores ''), D216 (hours does not wrap: wrap:false on the hms hours column, by name) and
// D217 (scope: hms only; the miles, rep-time and pace wheels keep their dash; no program output moves).
//
//   node tests/gates/g235_d215_hmszero.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v235_rulings/v235_ruling_d215_d217.md, section "Gate rows" (row names and
// claims verbatim), with D215 "Where nothing logged goes", "D3 test, per shape", "The tail roll", "Rolled back to its
// opening face" as restated by D215 Amendment 1 (the within-one-open D215-clear, its restated gate row and Sabotage
// paragraph; evidence tests/measure/v235_rulings/measure_clear_reopen_mB.md); D216 "Mechanism"; D217 "Program output".
// Evidence ruled against:
// tests/measure/v235_rulings/measure_hmszero_branch_mA.md (1,755/1,755 dash-opened hms drives lost at V234; 742/742
// plan-face wheels rolled to dash hours lost; control 0/2,497).
//
// ORACLES. Hand values typed from the ruling, never asked of the engine; _iawFormat and _iawParse output is compared
// only to the literals below, never to itself:
//   0:47:13 -> 47 + 13/60 = 47.2167 -> "47.22"; HALF_MANNY W1 sat Long Run dose 3.1 mi -> run_dist "3.1"; pace
//   2833.2 s / 3.1 mi = 913.9 s/mi -> "15:14/mi"; the D200/D208 table of D215-format; plan 25 min -> face 0:25:00;
//   minutes 30 on that plan -> "30.00"; hours 0 -> 1 -> 0 on that plan -> "25.00" (D202); the D203 dist parse table
//   (g232's typed list, unchanged by D217; from VER 237 its abc, ., -1 entries land on zero, D220); rendered column lists
//   '0'..'9' (10 rows, no nil row), 300-row minutes and seconds, dash-first dist / rept / pace through VER 236 and from
//   VER 237 zero-first dist and rept ('0', D220) with pace still dash-first (hand lists); HALF_MANNY digest
//   2d35e8f743680cfa (printed by the ruling
//   before the build, standing ruling 5). Lattice plan faces: the plan minutes the wheel carries (data-plan), turned into
//   h:mm:ss by hand arithmetic (g232's hmsFace). The lattice floor 1,755 is measure's hand count of hms forms that
//   opened on the dash at V234 (the class D215 moves onto zero).
// The engine is used only to drive the app (buildProgram, openDayKey, the wheels' scroll settle, handleDayStatus,
// renderProgressScreen) and to read back what it rendered and stored.
//
// METHOD. The device path, g233 mkEnv lineage (copied from tests/measure/v235_hmszero_branch.js, itself verbatim from
// tests/gates/g233_d207_bikewheel.js; not required): the harness VM, a DOM registry stub whose innerHTML parse makes the
// form's hidden inputs real nodes, each wheel column's scrollTop setter dispatching scroll, and a virtual clock that runs
// the 90 ms settle, _iawCommit, the hidden input's 'input' event and persistLogFields. Every drive starts from an empty
// store (every key but ia_programs removed). A "tail roll" sets the minutes column to 47 and the seconds column to 13
// inside one settle window, hours untouched (the ruling's drive: 1 input event per wheel).
//
// VERSION PREDICATE (standing rulings 2 and 4). D215, D216 and D217 ship at ia-version 235, read from the candidate's
// <meta name="ia-version">.
//   below 235      every row runs and carries a failing version conjunct, so every row FAILS by name.
//   235 and up     every row asserts (a minimum, never one exact version). D217-digest reads MANNY_DIGEST_BY_VERSION[VER].
//
// ROWS (ids are the ruling's names)
//   D215-zero     _iawFormat('hms',['0','0','0']) is ''; _iawParse('hms', s) for '', 'abc', '-1', '0', '0.00' is
//                 ['0','0','0'].
//   D215-format   D200 and D208 unchanged, hand table: 0:47:13 "47.22", 0:00:30 "0.50", 0:01:00 "1.00", 1:00:00 "60.00",
//                 0:59:59 "59.98", 9:59:59 "599.98"; parse 47.22 -> 0:47:13, 45.5 -> 0:45:30, 599 -> 9:59:00,
//                 600 / 630.5 / 599.98 -> 9:59:59.
//   D215-rows     rendered hms column 0 is exactly '0'..'9' (10 items, no nil item, data-len 10, data-wrap ''), columns
//                 1 and 2 are 300 items with data-wrap 1; dist, rept and pace column 0 still begin with '' and carry
//                 data-wrap '' (VER <= 236). From VER 237 (D220; tests/measure/v237_rulings/v237_ruling_d220_d222.md,
//                 "Existing rows this ruling flips") dist and rept column 0 begin with '0' and carry data-wrap ''; pace
//                 still begins with '' (D222).
//   D216-wrap     _iawWraps over the hms columns [false,true,true]; dist [false,true,true]; pace and rept [false,true].
//   D215-open     three hand shapes (bike blank, run dose=dist blank, run dose=time plan 25) open on 0:00:00, 0:00:00,
//                 0:25:00 writing nothing (0 input events, no ia_logs_ entry, no ia_hist_ snapshot); then every hms
//                 wheel on the lattice opened blank: face by hand, nothing written; lost 0 / N, N printed.
//   D215-tail     the two repros (bike_century/balanced/beginner/76308 W1 mon LSD; HALF_MANNY W1 sat Long Run) opened
//                 blank, tail roll, settle, Done: bike_mins "47.22"; run_mins "47.22", run_dist "3.1", run_pace
//                 "15:14/mi"; status complete; 1 input event per wheel; ia_hist_ snapshot present; Progress weekly bike
//                 47.22, run miles 3.1. Then every free hms wheel (the class that opened on the dash at V234) across the
//                 lattice at both seeds: tail roll, Done, "47.22" stored; lost 0 / N, N >= 1,755.
//   D215-plan     dose=time plan face 0:25:00; minutes to 30 stores "30.00"; hours 0 -> 1 -> 0 stores "25.00"; the plan
//                 class has no dash row to reach (column 0 of every plan hms wheel on the lattice has no '' item), N
//                 printed.
//   D215-clear    (VER >= 235), in the open that wrote the log: stored bike_mins "47.22" opens on 0:47:13 writing
//                 nothing, rolled to 0:00:00 stores ''; the nudge is absent on re-render; Progress weekly bike 0 (shown as
//                 null). A dose=dist run logged in this open (run_mins "47.22" with the V148 stamps run_dist "3.1" and
//                 run_pace "15:14/mi" landed), dist wheel untouched, rolled to 0:00:00: all three ''. Stored dose=time
//                 run_mins "30.00" rolled to 0:00:00: ''. Stored legacy "0.00": opens 0:00:00 writing nothing; rolled to
//                 0:47:00 and back: ''. The reopened dose=dist clear is not this row's claim (D215 Amendment 1; §12
//                 P-REOPENSTAMP; tests/measure/v235_clear_reopen.js). Conjuncts: D215-clear-ver, bike-open, bike-zero,
//                 bike-nudge, bike-progress, dist-same-open, time-zero, legacy-open, legacy-back.
//   D217-digest   era row: MANNY_DIGEST_BY_VERSION[VER] exists (conjunct) and is 2d35e8f743680cfa, and HALF_MANNY built
//                 on the candidate digests to it.
//   D217-others   dist [dash,8,6] -> '', rept [dash,55] -> '' (the guard stays: a dash value still formats to ''), the
//                 D203 dist parse table (hand): abc, ., -1 on the dash through VER 236, on zero from VER 237 (D220).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const S = require('../status')('g235_d215_hmszero');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 235;
const t0 = Date.now();
const J = JSON.stringify;

const LABEL = {
  'D215-zero':   "D215-zero (VER >= 235) the zero face 0:00:00 formats to ''; hms parse of '', abc, -1, 0, 0.00 is 0:00:00",
  'D215-format': 'D215-format (VER >= 235) D200 and D208 unchanged: the hand format and parse table',
  'D215-rows':   "D215-rows (VER >= 235) rendered hms hours is '0'..'9' (10, no nil, data-len 10, no wrap); mm and ss 300 wrapping; dist, rept, pace keep the dash (VER <= 236); from VER 237 dist and rept begin at 0 (D220), pace keeps the dash",
  'D216-wrap':   'D216-wrap (VER >= 235) _iawWraps: hms [false,true,true], dist [false,true,true], pace and rept [false,true]',
  'D215-open':   'D215-open (VER >= 235) blank hms wheels open on 0:00:00 (plan face on dose=time) and write nothing',
  'D215-tail':   'D215-tail (VER >= 235) a tail roll on a blank hms wheel stores 47.22 through Done (repros and the free class)',
  'D215-plan':   'D215-plan (VER >= 235) dose=time plan face 0:25:00; minutes 30 stores 30.00; hours 0 -> 1 -> 0 stores 25.00; no dash row',
  'D215-clear':  "D215-clear (VER >= 235) in the open that wrote the log, rolling the time back to 0:00:00 stores '' (bike, dose=dist with its stamps, dose=time, legacy 0.00)",
  'D217-digest': 'D217-digest (era row) MANNY_DIGEST_BY_VERSION[VER] exists and is 2d35e8f743680cfa; HALF_MANNY digests to it',
  'D217-others': "D217-others (VER >= 235) dist [dash,8,6] -> '', rept [dash,55] -> '', the D203 dist parse table (abc, ., -1 on the dash through VER 236, on zero from VER 237, D220)",
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const DASH = '—';
const TAIL_MINS = '47.22';                   // 0:47:13 = 47 + 13/60 = 47.2167
const LR_DIST = '3.1', LR_PACE = '15:14/mi'; // HALF_MANNY W1 sat Long Run 3.1 mi; 2833.2 s / 3.1 mi = 913.9 s/mi
const ZERO = ['0', '0', '0'];
const FMT_TABLE = [[['0', '47', '13'], '47.22'], [['0', '0', '30'], '0.50'], [['0', '1', '0'], '1.00'], [['1', '0', '0'], '60.00'],
  [['0', '59', '59'], '59.98'], [['9', '59', '59'], '599.98']];
const PARSE_TABLE = [['47.22', ['0', '47', '13']], ['45.5', ['0', '45', '30']], ['599', ['9', '59', '0']], ['600', ['9', '59', '59']],
  ['630.5', ['9', '59', '59']], ['599.98', ['9', '59', '59']]];
const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];
// V237 (D220): a string with no digits at the front lands on zero (no dash row); the numeric rows are DEC3's, unchanged.
const DEC3_V237 = [['.86', ['0', '8', '6']], ['abc', ['0', '0', '0']], ['.', ['0', '0', '0']], ['-1', ['0', '0', '0']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];
const HOURS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const hmsFace = m => { const t = Math.round(m * 60); return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const NUDGE = 'You logged this one but never marked it.';
const LATTICE_FLOOR = 1755;

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM ? +VM[1] : 0;
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
console.log('g235 D215-D217 P-HMSZERO | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row FAILS by its version conjunct)'));

// ── ENV (g233_d207_bikewheel.js mkEnv lineage, via the V235 measure; program id g235) ───────────────────────────────
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function mkEnv(file){
  const IA = H.load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage;
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
  ev('var __dots=[]; var __realBDC=buildDotChart; buildDotChart=function(){ __dots.push(Array.prototype.slice.call(arguments,0,3)); return __realBDC.apply(this,arguments); };');
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'g235'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="g235"; currentWeek=1; progressViewId=null;'); ev("showScreen('screenWeek')"); return q; };
  E.logs = () => LS.getItem('ia_logs_g235') || '{}';
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;
  E.setLog = (w, d, entry) => { const L = JSON.parse(E.logs()); if(entry == null) delete L['w' + w + '_' + d]; else L['w' + w + '_' + d] = entry; LS.setItem('ia_logs_g235', J(L)); };
  E.hist = (w, d) => !!JSON.parse(LS.getItem('ia_hist_g235') || '{}')['w' + w + '_' + d];
  E.wipe = () => { [...LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => LS.removeItem(k)); };
  E.open = (w, d) => { ev('currentWeek=' + w + ';'); els.detailOverlay.classList.remove('open'); els.detailBody.innerHTML = '';
    for(const k in INPUTS) delete INPUTS[k]; ev("openDayKey('" + d + "')"); advance(500); };
  E.inputs = () => Object.values(INPUTS).reduce((a, b) => a + b, 0);
  E.face = wh => { const f = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.face : '?'; }); return wh.kind === 'hms' ? f.join(':') : f.join(''); };
  E.wheel = hid => WHEELS.find(w => w.hid === hid) || null;
  E.hms = () => WHEELS.filter(w => w.kind === 'hms');
  // Set every named column inside ONE settle window, then let it settle: the athlete's "roll, let go".
  E.roll = (wh, pairs) => { for(const [ci, v] of pairs){ const c = wh._cols[ci], cur = Math.round(c.scrollTop / 44); let best = -1;
      for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
      if(best < 0) throw new Error('no row ' + J(v) + ' in column ' + ci); c.scrollTop = best * 44; }
    advance(500); };
  E.done = d => { ev("handleDayStatus('" + d + "','x','complete')"); advance(500); };
  E.status = (w, d) => ev("statusOf(" + w + ",'" + d + "')");
  E.nudge = () => els.detailBody.innerHTML.includes(NUDGE);
  E.chart = (title, w) => { ctx.__dots.length = 0; ev('renderProgressScreen')();
    for(const a of ctx.__dots){ if(String(a[0]).indexOf(title) < 0) continue; const wk = Array.from(a[1]), dat = Array.from(a[2]); return { drawn:true, v:dat[wk.indexOf(w)] }; }
    return { drawn:false, v:undefined }; };
  return E;
}

// ── conjunct rows ────────────────────────────────────────────────────────────────────────────────────────────────────
const row = (id, cj, extra) => {
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) S.info(id + ' ' + (c[1] ? 'ok  ' : 'BAD ') + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id] + (extra ? ' [' + extra + ']' : ''), bad.map(c => c[0] + ': ' + c[2]).slice(0, 4).join('; '));
};
const guard = (id, fn) => { try { fn(); } catch(e){ row(id, [verCj(id), ['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]); } };

const C = mkEnv(ART);
const FMT = (k, v) => C.ev('_iawFormat')(k, v), PARSE = (k, s) => C.ev('_iawParse')(k, s);
const SPEC = C.ev('_IAW_SPEC'), WRAPS = c => C.ev('_iawWraps')(c);

// ── D215-zero ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D215-zero', () => {
  const cj = [verCj('D215-zero')];
  for(const v of [ZERO, ['0', '00', '00']]){ const g = FMT('hms', v); cj.push(['fmt ' + J(v), g === '', J(g) + ' (hand "")']); }
  for(const s of ['', 'abc', '-1', '0', '0.00']){ const g = PARSE('hms', s); cj.push(['parse ' + J(s), J(g) === J(ZERO), J(g) + ' (hand ' + J(ZERO) + ')']); }
  row('D215-zero', cj);
});

// ── D215-format ──────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D215-format', () => {
  const cj = [verCj('D215-format')];
  const f = FMT_TABLE.map(([v, w]) => { const g = FMT('hms', v); return [v.join(':'), g, w, g === w]; });
  cj.push(['fmt-table', f.every(x => x[3]), f.map(x => x[0] + ' -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  const p = PARSE_TABLE.map(([s, w]) => { const g = PARSE('hms', s); return [s, g, w, J(g) === J(w)]; });
  cj.push(['parse-table', p.every(x => x[3]), p.map(x => x[0] + ' -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  row('D215-format', cj);
});

// ── D215-rows ────────────────────────────────────────────────────────────────────────────────────────────────────────
const renderCols = kind => { const h = C.ev('iaWheelHTML')(kind, 'g235_' + kind, ''); const out = [];
  const re = /<div class="iaw-col" data-ci="(\d+)" data-wrap="([^"]*)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g; let m;
  while((m = re.exec(h))){ const items = [...m[4].matchAll(/<div class="iaw-it( nil)?" data-v="([^"]*)">/g)]; out.push({ wrap:m[2], len:+m[3], vals:items.map(x => x[2]), nils:items.filter(x => x[1]).length }); }
  return out; };
guard('D215-rows', () => {
  const cj = [verCj('D215-rows')];
  const hc = renderCols('hms');
  cj.push(['hms-cols', hc.length === 3, hc.length + ' columns (hand 3)']);
  const c0 = hc[0] || { vals:[], nils:-1 };
  cj.push(['hms-hours-rows', J(c0.vals) === J(HOURS), J(c0.vals) + ' (hand ' + J(HOURS) + ')']);
  cj.push(['hms-hours-nil', c0.nils === 0 && c0.vals.indexOf('') < 0, c0.nils + ' nil items (hand 0)']);
  cj.push(['hms-hours-len', c0.len === 10, 'data-len ' + c0.len + ' (hand 10)']);
  cj.push(['hms-hours-data-wrap', c0.wrap === '', 'data-wrap ' + J(c0.wrap) + ' (hand "")']);
  for(const ci of [1, 2]){ const c = hc[ci] || {}; cj.push(['hms-col' + ci, (c.vals || []).length === 300 && c.wrap === '1', ((c.vals || []).length) + ' items, data-wrap ' + J(c.wrap) + ' (hand 300, "1")']); }
  // V237 (D220): from VER 237 dist and rept column 0 begins with '0' (no dash row) and still does not wrap; VER <= 236 keeps
  // the dash first. Pace keeps its dash on every version (D222). Conjunct names stay.
  for(const k of ['dist', 'rept', 'pace']){ const c = renderCols(k)[0] || { vals:[] }; const first = (VER >= 237 && k !== 'pace') ? '0' : '';
    cj.push([k + '-dash', c.vals[0] === first && c.wrap === '', 'col0 first ' + J(c.vals[0]) + ', data-wrap ' + J(c.wrap) + ' (hand ' + J(first) + ', "")']); }
  row('D215-rows', cj);
});

// ── D216-wrap ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D216-wrap', () => {
  const cj = [verCj('D216-wrap')];
  const WANT = { hms:[false, true, true], dist:[false, true, true], pace:[false, true], rept:[false, true] };
  for(const k of Object.keys(WANT)){ const g = SPEC[k].cols.map(c => WRAPS(c)); cj.push([k, J(g) === J(WANT[k]), J(g) + ' (hand ' + J(WANT[k]) + ')']); }
  row('D216-wrap', cj);
});

// ── device drives ────────────────────────────────────────────────────────────────────────────────────────────────────
const mkCfg = (sports, f, ex, eq, sd) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd }; };
const HALF = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)));
const BIKE = C.IA.buildProgram(mkCfg([['bike', 'bike_century']], 'balanced', 'beginner', 'commercial', 76308));
const subOf = (p, w, d) => (p.weeks[w] && p.weeks[w][d] && p.weeks[w][d].cardio && p.weeks[w][d].cardio.subtype) || '';
const hostCj = (tag, p, w, d, re) => [tag + '-host', re.test(subOf(p, w, d)), 'W' + w + ' ' + d + ' ' + J(subOf(p, w, d)) + ' (ruling ' + re + ')'];
// one blank open: [face, writes] where writes is the list of what the open wrote
const openBlank = (w, d, hid) => { C.wipe(); C.open(w, d); const wh = C.wheel(hid);
  const wrote = []; if(C.inputs()) wrote.push(C.inputs() + ' input'); if(C.entry(w, d)) wrote.push('ia_logs_ entry'); if(C.hist(w, d)) wrote.push('ia_hist_ snapshot');
  return { wh, face:wh ? C.face(wh) : '(no wheel ' + hid + ')', wrote }; };

// ── D215-open, D215-tail, D215-plan: the hand shapes and repros ──────────────────────────────────────────────────────
const LAT = { open:{ n:0, bad:[] }, tail:{ n:0, bad:[] }, plan:{ n:0, bad:[] }, progs:0, days:0, errs:[] };
const handOpen = [], handTail = [], handPlan = [];
guard('D215-open', () => {
  C.use(BIKE); handOpen.push(hostCj('bike', BIKE, 1, 'mon', /Long Slow Distance|LSD/));
  let o = openBlank(1, 'mon', 'log_bike_mins');
  handOpen.push(['bike-blank', o.face === '0:00:00' && !o.wrote.length, 'face ' + o.face + ', wrote ' + (o.wrote.join(', ') || 'nothing') + ' (hand 0:00:00, nothing)']);
  C.use(HALF); handOpen.push(hostCj('dist', HALF, 1, 'sat', /Long Run/));
  o = openBlank(1, 'sat', 'log_run_mins');
  handOpen.push(['dist-blank', o.face === '0:00:00' && !o.wrote.length && !(o.wh && o.wh.plan), 'face ' + o.face + ', plan ' + J(o.wh && o.wh.plan) + ', wrote ' + (o.wrote.join(', ') || 'nothing') + ' (hand 0:00:00, no plan, nothing)']);
  handOpen.push(hostCj('time', HALF, 1, 'fri', /Recovery Run/));
  o = openBlank(1, 'fri', 'log_run_mins');
  handOpen.push(['time-plan25', o.face === '0:25:00' && !o.wrote.length && o.wh && o.wh.plan === '25', 'face ' + o.face + ', plan ' + J(o.wh && o.wh.plan) + ', wrote ' + (o.wrote.join(', ') || 'nothing') + ' (hand 0:25:00, plan 25, nothing)']);
});
guard('D215-tail', () => {
  // repro 1: bike_century/balanced/beginner/76308 W1 mon LSD
  C.use(BIKE); handTail.push(hostCj('bike', BIKE, 1, 'mon', /Long Slow Distance|LSD/));
  let o = openBlank(1, 'mon', 'log_bike_mins'); C.roll(o.wh, [[1, '47'], [2, '13']]);
  let ins = C.INPUTS.log_bike_mins || 0; C.done('mon');
  let e = C.entry(1, 'mon') || {}, ch = C.chart('Weekly Cycling Time', 1);
  handTail.push(['bike-stored', e.bike_mins === TAIL_MINS, 'bike_mins ' + J(e.bike_mins) + ' (hand "47.22")']);
  handTail.push(['bike-status', C.status(1, 'mon') === 'complete', 'status ' + J(C.status(1, 'mon')) + ' (hand complete)']);
  handTail.push(['bike-1-input', ins === 1, ins + ' input events (hand 1)']);
  handTail.push(['bike-hist', C.hist(1, 'mon'), 'ia_hist_ w1_mon ' + C.hist(1, 'mon') + ' (hand present)']);
  handTail.push(['bike-progress', ch.drawn && +ch.v === 47.22, 'Weekly Cycling Time W1 ' + J(ch.v) + ' (hand 47.22)']);
  // repro 2: HALF_MANNY W1 sat Long Run (dose=dist, free time wheel)
  C.use(HALF); handTail.push(hostCj('run', HALF, 1, 'sat', /Long Run/));
  o = openBlank(1, 'sat', 'log_run_mins'); C.roll(o.wh, [[1, '47'], [2, '13']]);
  ins = C.INPUTS.log_run_mins || 0; const insD = C.INPUTS.log_run_dist || 0; C.done('sat');
  e = C.entry(1, 'sat') || {}; ch = C.chart('Weekly Running Mileage', 1);
  handTail.push(['run-stored', e.run_mins === TAIL_MINS && e.run_dist === LR_DIST && e.run_pace === LR_PACE,
    'run_mins ' + J(e.run_mins) + ', run_dist ' + J(e.run_dist) + ', run_pace ' + J(e.run_pace) + ' (hand "47.22", "3.1", "15:14/mi")']);
  handTail.push(['run-status', C.status(1, 'sat') === 'complete', 'status ' + J(C.status(1, 'sat')) + ' (hand complete)']);
  handTail.push(['run-1-input', ins === 1 && insD === 0, ins + ' input events on the time wheel, ' + insD + ' on miles (hand 1, 0)']);
  handTail.push(['run-hist', C.hist(1, 'sat'), 'ia_hist_ w1_sat ' + C.hist(1, 'sat') + ' (hand present)']);
  handTail.push(['run-progress', ch.drawn && +ch.v === 3.1, 'Weekly Running Mileage W1 ' + J(ch.v) + ' (hand 3.1)']);
});
guard('D215-plan', () => {
  C.use(HALF); handPlan.push(hostCj('time', HALF, 1, 'fri', /Recovery Run/));
  let o = openBlank(1, 'fri', 'log_run_mins');
  handPlan.push(['plan-face', o.face === '0:25:00' && o.wh && o.wh.plan === '25', 'face ' + o.face + ', plan ' + J(o.wh && o.wh.plan) + ' (hand 0:25:00, 25)']);
  const c0 = o.wh ? o.wh._cols[0].items.map(x => x.v) : [];
  // the ruling's claim is row ABSENCE ("column 0 has no '' item"); the exact '0'..'9' list is D215-rows' claim
  handPlan.push(['plan-no-dash-row', c0.length > 0 && c0.indexOf('') < 0, 'hours rows ' + J(c0.slice(0, 11)) + (c0.length > 11 ? ' ... (' + c0.length + ')' : '') + ' (hand: no "" item)']);
  // V236 (D218 "Existing rows that flip"): from VER 236 a rolled draft is stored by the Log tap; VER <= 235 unchanged.
  const logTap = () => { if(VER >= 236){ C.ev('logCardio()'); C.advance(50); } };
  C.roll(o.wh, [[1, '30']]); logTap(); let e = C.entry(1, 'fri') || {};
  handPlan.push(['minutes-30', e.run_mins === '30.00', 'run_mins ' + J(e.run_mins) + ' (hand "30.00")']);
  o = openBlank(1, 'fri', 'log_run_mins'); C.roll(o.wh, [[0, '1']]); logTap(); const mid = (C.entry(1, 'fri') || {}).run_mins;
  C.roll(C.wheel('log_run_mins'), [[0, '0']]); e = C.entry(1, 'fri') || {};
  handPlan.push(['hours-0-1-0', mid === '85.00' && e.run_mins === '25.00', 'after hours 1 ' + J(mid) + ', after hours 0 ' + J(e.run_mins) + ' (hand "85.00", "25.00")']);
});

// ── the lattice: every hms wheel opened blank (D215-open), every free one tail-rolled to Done (D215-tail), every plan
//    one checked for a dash row (D215-plan). Measure's lattice: HALF_MANNY plus 11 goals x 2 focus x 2 experience x 2 seeds.
const GOALS = [['bike', 'bike_century'], ['bike', 'bike_50'], ['bike', 'bike_base'], ['bike', 'bike_ftp'], ['bike', 'bike_cals'],
  ['run', 'run_5k'], ['run', 'run_10k'], ['run', 'run_half'], ['run', 'run_marathon'], ['run', 'run_base'], ['run', 'run_pace_goal']];
const PROGS = [['HALF_MANNY', JSON.parse(J(H.fixtures.HALF_MANNY))]];
for(const g of GOALS) for(const f of ['balanced', 'strength']) for(const ex of ['beginner', 'advanced']) for(const sd of [76308, 24865])
  PROGS.push([g[1] + '|' + f + '|' + ex + '|' + sd, mkCfg([g], f, ex, 'commercial', sd)]);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
const field = { log_bike_mins:'bike_mins', log_run_mins:'run_mins' };
const note = (L, s) => { if(L.bad.length < 3) L.bad.push(s); L.fails = (L.fails || 0) + 1; };
try {
  for(const [name, cfg] of PROGS){
    let p; try { p = C.IA.buildProgram(cfg); } catch(e){ LAT.errs.push(name + ' build ' + e.message); continue; }
    LAT.progs++; C.use(p);
    for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){
      const x = p.weeks[w][d], ct = ctOf(x); if(!x || x.rest || (ct !== 'run' && ct !== 'bike')) continue;
      LAT.days++;
      try {
        C.wipe(); C.open(w, d);
        const hs = C.hms(); if(!hs.length) continue;
        const wh = hs[0], hid = wh.hid, tag = name + ' W' + w + ' ' + d + ' ' + hid.replace('log_', '');
        // D215-open: face by hand, nothing written
        const wantFace = wh.plan == null ? '0:00:00' : hmsFace(+wh.plan), face = C.face(wh);
        const wrote = C.inputs() + (C.entry(w, d) ? 1 : 0) + (C.hist(w, d) ? 1 : 0);
        LAT.open.n++; if(face !== wantFace || wrote) note(LAT.open, tag + ' face ' + face + ' (hand ' + wantFace + ') wrote ' + wrote);
        if(wh.plan != null){
          // D215-plan: the plan class has no dash row to reach
          LAT.plan.n++; const v0 = wh._cols[0].items.map(i => i.v); if(v0.indexOf('') >= 0) note(LAT.plan, tag + ' hours has a "" row');
          continue;
        }
        // D215-tail: the free class (opened on the dash at V234) -- tail roll, Done, 47.22 stored
        C.roll(wh, [[1, '47'], [2, '13']]); const ins = C.INPUTS[hid] || 0; C.done(d);
        const e = C.entry(w, d) || {}, st = C.status(w, d);
        LAT.tail.n++; if(e[field[hid]] !== TAIL_MINS || ins !== 1 || st !== 'complete' || !C.hist(w, d))
          note(LAT.tail, tag + ' stored ' + J(e[field[hid]]) + ' inputs ' + ins + ' status ' + J(st) + ' hist ' + C.hist(w, d));
      } catch(err){ LAT.errs.push(name + ' W' + w + ' ' + d + ': ' + String(err.message).slice(0, 100)); }
    }
  }
} catch(err){ LAT.errs.push('lattice: ' + String(err.message).slice(0, 120)); }
const lat = (L, what) => [what, !(L.fails || 0) && L.n > 0 && !LAT.errs.length, 'lost ' + (L.fails || 0) + ' / ' + L.n + (L.bad.length ? ' e.g. ' + L.bad.join(' | ') : '') + (LAT.errs.length ? '; ' + LAT.errs.length + ' errors e.g. ' + LAT.errs[0] : '')];
const latLine = 'lattice ' + LAT.progs + ' programs, ' + LAT.days + ' run/bike days';
guard('D215-open', () => row('D215-open', [verCj('D215-open')].concat(handOpen, [lat(LAT.open, 'lattice-open')]), 'lost ' + (LAT.open.fails || 0) + ' / ' + LAT.open.n + ', ' + latLine));
guard('D215-tail', () => row('D215-tail', [verCj('D215-tail')].concat(handTail, [lat(LAT.tail, 'lattice-tail'),
  ['lattice-floor', LAT.tail.n >= LATTICE_FLOOR, 'N ' + LAT.tail.n + ' free hms wheels (hand floor ' + LATTICE_FLOOR + ', measure mA at V234)']]),
  'lost ' + (LAT.tail.fails || 0) + ' / ' + LAT.tail.n + ', ' + latLine));
guard('D215-plan', () => row('D215-plan', [verCj('D215-plan')].concat(handPlan, [lat(LAT.plan, 'lattice-no-dash-row')]), 'dash rows ' + (LAT.plan.fails || 0) + ' / ' + LAT.plan.n + ' plan wheels'));

// ── D215-clear (D215 Amendment 1): the clear in the open that wrote the log ─────────────────────────────────────────
guard('D215-clear', () => {
  const cj = [verCj('D215-clear')];
  // bike: stored "47.22" opens on 0:47:13 writing nothing; rolled to 0:00:00 stores ''; nudge gone; Progress credits 0
  C.use(BIKE); C.wipe(); C.setLog(1, 'mon', { rpe:'5', bike_mins:'47.22' }); const before = C.logs();
  C.open(1, 'mon'); let wh = C.wheel('log_bike_mins'); const nudge0 = C.nudge(), ch0 = C.chart('Weekly Cycling Time', 1);
  cj.push(['bike-open', wh && C.face(wh) === '0:47:13' && C.inputs() === 0 && C.logs() === before, 'face ' + (wh && C.face(wh)) + ', ' + C.inputs() + ' inputs, store ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ' (hand 0:47:13, 0, unchanged)']);
  C.roll(wh, [[1, '0'], [2, '0']]); let e = C.entry(1, 'mon') || {};
  cj.push(['bike-zero', e.bike_mins === '', 'bike_mins ' + J(e.bike_mins) + ' (hand "")']);
  C.open(1, 'mon'); const nudge1 = C.nudge(), ch1 = C.chart('Weekly Cycling Time', 1);
  cj.push(['bike-nudge', nudge0 && !nudge1, 'nudge before ' + nudge0 + ', after ' + nudge1 + ' (hand true, false)']);
  cj.push(['bike-progress', ch0.drawn && +ch0.v === 47.22 && ch1.drawn && (ch1.v == null || +ch1.v === 0), 'Weekly Cycling Time W1 before ' + J(ch0.v) + ', after ' + J(ch1.v) + ' (hand 47.22, 0 shown as null)']);
  // dose=dist, logged in this open: run_mins "47.22" with the V148 stamps run_dist "3.1" and run_pace "15:14/mi" landed,
  // dist wheel untouched (the reopened case is P-REOPENSTAMP, not this row: D215 Amendment 1)
  // V236 (D218 "Existing rows that flip"): from VER 236 the log is written by the Log tap before the clear.
  C.use(HALF); C.wipe(); C.open(1, 'sat'); C.roll(C.wheel('log_run_mins'), [[1, '47'], [2, '13']]);
  if(VER >= 236){ C.ev('logCardio()'); C.advance(50); }
  e = C.entry(1, 'sat') || {};
  const stamped = e.run_mins === TAIL_MINS && e.run_dist === LR_DIST && e.run_pace === LR_PACE;
  C.roll(C.wheel('log_run_mins'), [[1, '0'], [2, '0']]); e = C.entry(1, 'sat') || {};
  cj.push(['dist-same-open', stamped && e.run_mins === '' && e.run_dist === '' && e.run_pace === '', 'stamped ' + stamped + '; after 0:00:00 run_mins ' + J(e.run_mins) + ', run_dist ' + J(e.run_dist) + ', run_pace ' + J(e.run_pace) + ' (hand "", "", "")']);
  // dose=time: stored "30.00" rolled to 0:00:00 stores ''
  C.wipe(); C.setLog(1, 'fri', { rpe:'5', run_mins:'30.00' }); C.open(1, 'fri'); wh = C.wheel('log_run_mins'); const fT = C.face(wh);
  C.roll(wh, [[1, '0']]); e = C.entry(1, 'fri') || {};
  cj.push(['time-zero', fT === '0:30:00' && e.run_mins === '', 'face ' + fT + ', after 0:00:00 run_mins ' + J(e.run_mins) + ' (hand 0:30:00, "")']);
  // legacy "0.00" (a pre-V232 number box): opens 0:00:00 writing nothing; 0:47:00 and back stores ''
  C.use(BIKE); C.wipe(); C.setLog(1, 'mon', { rpe:'5', bike_mins:'0.00' }); const beforeL = C.logs(); C.open(1, 'mon'); wh = C.wheel('log_bike_mins');
  cj.push(['legacy-open', C.face(wh) === '0:00:00' && C.inputs() === 0 && C.logs() === beforeL, 'face ' + C.face(wh) + ', ' + C.inputs() + ' inputs, store ' + (C.logs() === beforeL ? 'unchanged' : 'CHANGED') + ' (hand 0:00:00, 0, unchanged)']);
  C.roll(wh, [[1, '47']]); const midL = (C.entry(1, 'mon') || {}).bike_mins; C.roll(C.wheel('log_bike_mins'), [[1, '0']]); e = C.entry(1, 'mon') || {};
  cj.push(['legacy-back', midL === '47.00' && e.bike_mins === '', 'after 0:47:00 ' + J(midL) + ', after 0:00:00 ' + J(e.bike_mins) + ' (hand "47.00", "")']);
  row('D215-clear', cj);
});

// ── D217-digest ──────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D217-digest', () => {
  const cj = [];
  const T = H.MANNY_DIGEST_BY_VERSION || {}, has = Object.prototype.hasOwnProperty.call(T, VER);
  cj.push(['era-row', has, 'MANNY_DIGEST_BY_VERSION[' + VER + '] ' + (has ? 'present' : 'MISSING')]);
  cj.push(['era-value', T[VER] === '2d35e8f743680cfa', J(T[VER]) + ' (ruling 2d35e8f743680cfa)']);
  const P0 = H.load(ART); const dg = H.progDigest(P0.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))));
  cj.push(['built', dg === '2d35e8f743680cfa', 'HALF_MANNY on the candidate ' + dg + ' (ruling 2d35e8f743680cfa)']);
  row('D217-digest', cj);
});

// ── D217-others ──────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D217-others', () => {
  const cj = [verCj('D217-others')];
  let g = FMT('dist', ['', '8', '6']); cj.push(['dist-dash', g === '', 'dist [dash,8,6] -> ' + J(g) + ' (hand "")']);
  g = FMT('rept', ['', '55']); cj.push(['rept-dash', g === '', 'rept [dash,55] -> ' + J(g) + ' (hand "")']);
  const t = (VER >= 237 ? DEC3_V237 : DEC3).map(([s, w]) => { const r = PARSE('dist', s); return [s, r, w, J(r) === J(w)]; });
  cj.push(['dec3-table', t.every(x => x[3]), t.map(x => J(x[0]) + ' -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  row('D217-others', cj);
});

if(C.errs.length) S.info('timer errors ' + C.errs.length + ': ' + C.errs.slice(0, 3).join(' | '));
S.info('g235 wall ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
S.summary();
