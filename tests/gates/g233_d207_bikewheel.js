// g233_d207_bikewheel.js — GATE for V233 P-BIKEWHEEL (D207–D211): the bike log form is one H:MM:SS wheel, alone in the
// stacked wrap, on the dash until a ride is stored; the shared hms parse pegs the whole face at the dial's ceiling.
//
//   node tests/gates/g233_d207_bikewheel.js <candidate.html> [baseline_V232.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v233_rulings/v233_ruling_d207_d211.md (coach, D207–D211) with Mario's calls in
//   tests/measure/v233_rulings/v233_session_calls.md item 6: D207 dash on every bike shape; D209 AMENDED, the label is
//   `Log the ride` (bike icon in front) and NO sub-label on any bike shape, the hms kind's own `Time` cap stays; D211 V233
//   is the bike branch plus the shared 9:59:59 clamp only. D208 and D210 are the session's, taken as ruled. Evidence:
//   tests/measure/v233_rulings/measure_bikewheel.md, measure_bikewheel_reach.md. Surgery: tests/edits/v233_s1_bike_wheel.py.
//   Ruling lines leaned on: D207 "iaWheelHTML('hms','log_bike_mins',e.bike_mins||'') with no fifth argument, so no
//   data-plan lands on any bike wheel ... opening a bike day never writes, whatever the stored string"; D208 "clamp t to
//   cols[0].max*3600 + cols[1].max*60 + cols[2].max seconds (9:59:59) ... 600, 630.5, 599.98 all seed 9:59:59; 599 seeds
//   9:59:00; 45.5 still seeds 0:45:30 ... A touch then commits 599.98"; D210 "<div class="iaw-wrap iaw-solo"> around
//   iaWheelHTML('hms','log_bike_mins',…) ... no second .iaw-solo rule"; D211 / "What does not change": the swim branch,
//   the rest sheet, the generic run form, every run wheel face for a stored value under 600 minutes, HALF_MANNY
//   2d35e8f743680cfa; Legacy seeds "45 shows 0:45:00; 45.5 shows 0:45:30; '' shows the dash; 630.5 shows 9:59:59"; "A
//   moved wheel stores decimal minutes to two places (45.00)"; the Progress reader :17459 and _hasLog read it unchanged.
//
// ORACLES. Nothing below asks the engine what the answer should be.
//   WHEEL_HEAD   the hand string of D210's markup: iaw-wrap iaw-solo > iaw-cell iaw-f3 > cap Time > the hms wheel for
//                log_bike_mins with NO data-plan attribute (D207).
//   COPY         Mario's D209 amendment typed verbatim: `Log the ride`; no f-sub; `Bike — actual duration`, `Off the
//                watch.`, `Whole ride` absent; the bike glyph by its two hand wheel circles (cx 5.5 and 18.5, cy 17.5, r 3.5).
//   FACES        hand faces typed as strings: '45' 0:45:00, '45.5' 0:45:30, '.5' 0:00:30, '90' 1:30:00, 30 0:30:00, '599'
//                9:59:00, '599.98' / '600' / '630.5' / '650' 9:59:59, '-1' and blank the dash (—:00:00).
//   COMMITS      hand decimal minutes: 0:45:00 -> 45.00; 9:59:58 -> 599.97; 9:59:59 -> 599.98 (two places, D200).
//   PROGRESS     the weekly bike sum of a week holding one stored 45.00 is 45 (hand).
//   PAIR         D211-untouched compares against the V232 tree (argv[3] when it reads 232, else git 6ee30ea), never against
//                the candidate's own output; HALF_MANNY against the hand literal 2d35e8f743680cfa and the era row.
//
// OBSERVATION is the real open path in the harness VM (copied from g232_d199_runwheel.js): openDayKey -> openDetail ->
//   buildLogHTML -> cardioFieldHTML -> the listener arrays -> iaWheelInit, persistLogFields on every `input`. A DOM stub
//   parses the rendered markup into hidden inputs and wheels; each column's scrollTop setter dispatches `scroll`; a
//   virtual clock runs every timer and rAF; the `Event` stub carries a type and element dispatchEvent runs every
//   listener it was handed. Hand-built doses are routed through the same path by wrapping doseFromCardio in the VM
//   (__FORCE_ON / __FORCE, so a forced null dose is expressible); with __FORCE_ON false it is the engine's own.
//
// LATTICE (forms, open, copy). Every bike log form opened through the open path with no stored entry, on:
//   (a) bike goals bike_century, bike_50, bike_base, bike_ftp, bike_cals × focus balanced, strength × experience
//       beginner, advanced × equipment commercial, home_basic × seeds 76308, 24865 (80 programs, clean bike goals);
//   (b) run_half+bike_base, run_5k+bike_ftp, swim_mile+bike_base, swim_base+bike_50 × injury knee/protect,
//       shoulder/protect (balanced, intermediate, commercial, seed 76308; 8 programs), where the Cross-Train
//       `time(parsed)` bike forms appear (measure reach Q2);
//   (c) the swapped-in bike field: every run or swim day of HALF_MANNY and the four (b) pairs uninjured, opened with a
//       stored swapTo:'bike' (null dose, no strip), plus one live setCardioSwap('bike') on a HALF_MANNY run day.
//   Rest days sun+wed throughout. Each program is stored with startDate Monday 2026-09-21, blockOpen deleted, the clock
//   pinned to that Monday 10:00. The bike host for the hand-built open/move/clamp rows is the first bike day with a
//   `time` dose on bike_base, balanced, intermediate, commercial, seed 24865; the run host is HALF_MANNY's first run day.
//
// VERSION PREDICATE (standing rulings 2 and 4). Every behaviour row RUNS on every tree; `VER >= 233` is the first
//   conjunct. On V232 as candidate each also fails by its own conjuncts (a number box, the old label, no bike wheel, the
//   hours-only clamp). D211-untouched is this build's pair premise only: it runs when the candidate reads 233 and the
//   baseline 232, else a named SKIP, never PASS.
//
// ROWS
//   D207/D210-forms  hand-built bike forms (time 45, reps_time 3 × 15, null; e = {} and stored 45) and every lattice
//                    form: one wheel, kind hms, for log_bike_mins, no data-plan, hidden input once, no number box, inside
//                    iaw-wrap iaw-solo (WHEEL_HEAD), strip iff dose; lattice (a)(b)(c) each > 0, (a) reaches time,
//                    reps_time and null, (b) reaches Cross-Train; a live swap renders the same shape; no bike number box
//                    in the comment-stripped source.
//   D209-copy        COPY on the hand-built and every lattice form; old strings gone from the source.
//   D207-open        stored blank (none, explicit '') on the three hand shapes opens writing nothing on the dash; the
//                    legacy FACES table opens writing nothing on its hand faces; every lattice form likewise on the dash.
//   D207-move        hours 0 then minutes 45 commits 45.00 and ia_logs_ stores it; the Progress weekly bike sum and _hasLog
//                    read it (45, the nudge; a blank entry gets no nudge); a settle on the seed face alone writes nothing;
//                    a touched pegged 630.5 commits 599.97 then 599.98.
//   D208-clamp       the hms parse table by hand; a run `time` form and the bike form seed 650 / 600 / 630.5 at 9:59:59,
//                    599 at 9:59:00, 45.5 at 0:45:30, opening writing nothing.
//   D211-untouched   (pair 233 vs 232) swim, generic run, reps_dist and the run time / dist / reps_time forms byte-identical
//                    to V232; the hms parse identical to V232 for every stored value whose nearest second is under 36000
//                    (every hundredth 0.00..599.99, integers 0..599, odd strings; D200 rounds first, D208 clamps the rounded
//                    t, so 599.991667..599.999 peg too and sit in the differing set that keeps the comparator live); the rest sheet identical; `.iaw-solo{` once; the bike form differs from
//                    V232 (live); HALF_MANNY = MANNY_DIGEST_BY_VERSION[233] (row exists, standing ruling 5) and =
//                    2d35e8f743680cfa on both trees, self-stable.
//
// Temp files: the git copy of V232 (when argv[3] is absent or not 232) goes under os.tmpdir() (run with TMPDIR set to the
//   scratch path) and is removed on exit.
'use strict';
process.env.TZ = 'America/New_York';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 233;
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ── HAND ORACLE ──────────────────────────────────────────────────────────────────────────────────────────────────
const DASH = '—', DASH_HMS = DASH + ':00:00';
const WHEEL_HEAD = '<div class="iaw-wrap iaw-solo"><div class="iaw-cell iaw-f3"><div class="iaw-cap">Time</div><div class="iaw" data-kind="hms" data-for="log_bike_mins">';
const WHEEL_TAG = '<div class="iaw" data-kind="hms" data-for="log_bike_mins">';
const LABEL = 'Log the ride';
const GONE = ['Bike — actual duration', 'Off the watch.', 'Whole ride'];
const BIKE_GLYPH = ['<circle cx="5.5" cy="17.5" r="3.5"/>', '<circle cx="18.5" cy="17.5" r="3.5"/>'];   // the bike's two wheels
const HAND = { time:{ dose:{ k:'time', mins:45 }, sub:'Long Ride (LSD)' }, reps_time:{ dose:{ k:'reps_time', reps:3, mins:15 }, sub:'Sweet Spot' }, null:{ dose:null, sub:'Interval' } };
const LEGACY_BIKE = [['45', '0:45:00'], ['45.5', '0:45:30'], ['.5', '0:00:30'], ['90', '1:30:00'], [30, '0:30:00'], ['599', '9:59:00'],
  ['599.98', '9:59:59'], ['600', '9:59:59'], ['630.5', '9:59:59'], ['-1', DASH_HMS]];
const CLAMP = [['650', '9:59:59'], ['600', '9:59:59'], ['630.5', '9:59:59'], ['599', '9:59:00'], ['45.5', '0:45:30']];
const PEG = ['9', '59', '59'];
const PARSE_HAND = [['600', PEG], ['601', PEG], ['630.5', PEG], ['650', PEG], ['1200', PEG], ['599.98', PEG], ['599.99', PEG], ['599', ['9', '59', '0']],
  ['45.5', ['0', '45', '30']], ['45', ['0', '45', '0']], ['.5', ['0', '0', '30']], ['', ['', '', '']], ['-1', ['', '', '']], ['abc', ['', '', '']]];
const RUN_TIME_DOSE = { k:'time', mins:15, tgt:531, key:'chi' };
const NUDGE = 'You logged this one but never marked it.';
const BIKEG = ['bike_century', 'bike_50', 'bike_base', 'bike_ftp', 'bike_cals'];
const LAT_A = { foc:['balanced', 'strength'], exp:['beginner', 'advanced'], eq:['commercial', 'home_basic'], seeds:[76308, 24865] };
const PAIRS = [[['run', 'run_half'], ['bike', 'bike_base']], [['run', 'run_5k'], ['bike', 'bike_ftp']], [['swim', 'swim_mile'], ['bike', 'bike_base']], [['swim', 'swim_base'], ['bike', 'bike_50']]];
const INJ = [['knee/protect', { region:'knee', tier:'protect' }], ['shoulder/protect', { region:'shoulder', tier:'protect' }]];
function mkCfg(sports, f, ex, eq, sd){
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}

// ── PLUMBING ─────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, skip = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const J = JSON.stringify;
const R = {
  'D207/D210-forms': 'row D207/D210-forms (D207, D210, VER >= 233) every bike form is one hms wheel for log_bike_mins in iaw-wrap iaw-solo, no data-plan, hidden input once, no number box, strip iff dose; hand-built time / reps_time / null and lattice (a) bike goals (b) injured multi-sport Cross-Train (c) swapped-in',
  'D209-copy': 'row D209-copy (D209 as amended by Mario, call 6, VER >= 233) label `Log the ride` after the bike glyph, no f-sub, `Bike — actual duration` / `Off the watch.` / `Whole ride` absent, no mid-sentence dash',
  'D207-open': 'row D207-open (D207, D200 gate inherited, VER >= 233) stored blank opens writing nothing on the dash; legacy 45 / 45.5 / .5 / 90 / 30 / 599 / 599.98 / 600 / 630.5 / -1 open writing nothing on their hand faces; every lattice form opens on the dash writing nothing',
  'D207-move': 'row D207-move (D207, D208, VER >= 233) hours 0 + minutes 45 commits 45.00 and ia_logs_ stores it; Progress weekly bike sum 45 and _hasLog read it; a settle on the seed face alone writes nothing; a touched pegged 630.5 commits 599.98',
  'D208-clamp': 'row D208-clamp (D208, VER >= 233) the hms parse pegs at 9:59:59 from the column maxes; run time form and bike form seed 650 / 600 / 630.5 at 9:59:59, 599 at 9:59:00, 45.5 at 0:45:30',
};
const ROW_ORDER = Object.keys(R);
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
const tryv = f => { try { return f(); } catch(e){ return { __err:String(e && e.message || e).slice(0, 120) }; } };
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');

// ── ENV: virtual clock, a DOM stub that parses the rendered markup, scroll-dispatching wheels (from g232) ────────
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

// one rendered bike form against D207/D210 (WHEEL_HEAD); returns the list of deviations
function bikeShape(fm, hasDose, stored){
  const bad = [];
  const wheels = fm.match(/<div class="iaw" [^>]*>/g) || [];
  if(wheels.length !== 1) bad.push(wheels.length + ' wheels');
  else if(wheels[0] !== WHEEL_TAG) bad.push('wheel ' + wheels[0]);
  const nPlan = (fm.match(/data-plan/g) || []).length; if(nPlan) bad.push(nPlan + ' data-plan');
  const nId = (fm.match(/id="log_bike_mins"/g) || []).length, nHid = (fm.match(/<input type="hidden" id="log_bike_mins" value="[^"]*">/g) || []).length;
  if(nId !== 1 || nHid !== 1) bad.push('id log_bike_mins x' + nId + ', hidden x' + nHid);
  const nBox = (fm.match(/<input\b[^>]*>/g) || []).filter(t => /type="number"/.test(t)).length; if(nBox) bad.push(nBox + ' number box');
  const wraps = fm.match(/<div class="iaw-wrap[^"]*"/g) || []; if(wraps.length !== 1 || wraps[0] !== '<div class="iaw-wrap iaw-solo"') bad.push('wraps ' + J(wraps));
  if(fm.indexOf(WHEEL_HEAD) < 0) bad.push('no iaw-solo > iaw-f3 > Time > hms wheel head');
  const strip = /Planned/.test(fm); if(strip !== !!hasDose) bad.push('strip ' + strip + ' with dose ' + !!hasDose);
  if(stored !== undefined){ const hv = (fm.match(/<input type="hidden" id="log_bike_mins" value="([^"]*)">/) || [])[1]; if(hv !== String(stored)) bad.push('hidden value ' + J(hv) + ' want ' + J(String(stored))); }
  return bad;
}
// one rendered bike form against COPY
function copyBad(fm){
  const bad = [];
  const labels = fm.match(/<label>[\s\S]*?<\/label>/g) || [];
  if(labels.length !== 1) bad.push(labels.length + ' labels');
  const m = (labels[0] || '').match(/^<label>(<svg [^>]*>[\s\S]*?<\/svg>) ([^<]*)<\/label>$/);
  if(!m) bad.push('label shape ' + J((labels[0] || '').replace(/<svg[\s\S]*?<\/svg>/, '<svg/>')));
  else { if(m[2] !== LABEL) bad.push('label ' + J(m[2])); if(!BIKE_GLYPH.every(s => m[1].includes(s))) bad.push('icon is not the bike glyph'); if(/—|–| - /.test(m[2])) bad.push('dash in label ' + J(m[2])); }
  const subs = (fm.match(/class="f-sub"/g) || []).length; if(subs) bad.push(subs + ' f-sub');
  GONE.forEach(s => { if(fm.includes(s)) bad.push('carries ' + J(s)); });
  return bad;
}

// ── LOAD + VERSION + BASELINE ────────────────────────────────────────────────────────────────────────────────────
let VER = NaN, C = null, CAND_TEXT = '';
try { CAND_TEXT = fs.readFileSync(ART, 'utf8'); C = mkEnv(ART); VER = +C.IA.version; }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ROW_ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g233 D207–D211 P-BIKEWHEEL | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every behaviour row runs and must FAIL by its own conjuncts)'));

// ── THE OPEN SURVEY (every row reads it) ─────────────────────────────────────────────────────────────────────────
const SURV = { hand:{}, legacy:[], clampRun:[], clampBike:[], lat:[], progs:{ a:0, b:0, c:0 }, err:{} };
let HOSTB = null, HOSTR = null, HOSTP = null, MANNY_P = null;
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
function openRead(w, d, stored){
  C.setLog(w, d, stored); const before = C.logs(); C.open(w, d);
  const fm = C.form(), wb = C.wheel('log_bike_mins'), wr = C.wheel('log_run_mins');
  return { fm, face:wb ? C.face(wb) : null, runFace:wr ? C.face(wr) : null, inputs:C.inputs(), same:C.logs() === before, hid:C.els.log_bike_mins ? C.els.log_bike_mins.value : null };
}
function latOpen(grp, name, p, pick, stored){
  C.use(p);
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; if(!x || x.rest || !x.cardio || Array.isArray(x.cardio) || !pick(x)) continue;
    const dose = stored ? null : C.ev('__realDFC')(x.cardio);
    const r = openRead(w, d, stored ? Object.assign({}, stored, { swapFrom:ctOf(x) }) : null);
    SURV.lat.push({ grp, name, w, d, k:dose ? dose.k + (dose.parsed ? '(parsed)' : '') : 'null', ct:x.cardio.subtype === 'Cross-Train',
      shape:bikeShape(r.fm, !!dose), copy:copyBad(r.fm), face:r.face, inputs:r.inputs, same:r.same });
  }
}
function section(tag, f){ try { f(); } catch(e){ SURV.err[tag] = String(e && e.stack || e).slice(0, 300); } }
section('hosts', () => {
  MANNY_P = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)));
  for(const w of weeksOf(MANNY_P)){ for(const d of DAYS){ const x = MANNY_P.weeks[w][d]; if(x && !x.rest && ctOf(x) === 'run'){ HOSTR = [w, d]; break; } } if(HOSTR) break; }
  HOSTP = C.IA.buildProgram(mkCfg([['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 24865));
  for(const w of weeksOf(HOSTP)){ for(const d of DAYS){ const x = HOSTP.weeks[w][d]; if(!x || x.rest || ctOf(x) !== 'bike') continue;
    const dz = C.ev('__realDFC')(x.cardio); if(dz && dz.k === 'time'){ HOSTB = [w, d]; break; } } if(HOSTB) break; }
  if(!HOSTR || !HOSTB) throw new Error('host not found: run ' + J(HOSTR) + ', bike ' + J(HOSTB));
});
section('hand', () => {
  C.use(HOSTP);
  for(const k of Object.keys(HAND)){ C.force(HAND[k].dose);
    for(const blank of ['none', 'explicit']) SURV.hand[k + ' ' + blank] = Object.assign({ k }, openRead(HOSTB[0], HOSTB[1], blank === 'none' ? null : { bike_mins:'', rpe:'', notes:'' }));
  }
  C.force(HAND.time.dose);
  SURV.legacy = LEGACY_BIKE.map(([v, want]) => Object.assign({ v, want }, openRead(HOSTB[0], HOSTB[1], { bike_mins:v, rpe:'5' })));
  SURV.clampBike = CLAMP.map(([v, want]) => Object.assign({ v, want }, openRead(HOSTB[0], HOSTB[1], { bike_mins:v, rpe:'5' })));
  C.use(MANNY_P); C.force(RUN_TIME_DOSE);
  SURV.clampRun = CLAMP.map(([v, want]) => Object.assign({ v, want }, openRead(HOSTR[0], HOSTR[1], { run_mins:v, rpe:'5' })));
  C.unforce();
});
section('swaplive', () => {
  C.use(MANNY_P); C.unforce(); C.setLog(HOSTR[0], HOSTR[1], null); C.open(HOSTR[0], HOSTR[1]);
  C.ev("setCardioSwap('bike')"); C.advance(500);
  const fm = C.els.cardioFields._html, wb = C.wheel('log_bike_mins');
  SURV.swapLive = { shape:bikeShape(fm, false), copy:copyBad(fm), face:wb ? C.face(wb) : null, entry:C.entry(HOSTR[0], HOSTR[1]) };
});
section('lattice-a', () => { C.unforce();
  for(const g of BIKEG) for(const f of LAT_A.foc) for(const ex of LAT_A.exp) for(const eq of LAT_A.eq) for(const sd of LAT_A.seeds){
    const p = C.IA.buildProgram(mkCfg([['bike', g]], f, ex, eq, sd)); SURV.progs.a++;
    latOpen('a', g + '|' + f + '|' + ex + '|' + eq + '|' + sd, p, x => ctOf(x) === 'bike', null); }
});
section('lattice-b', () => { C.unforce();
  for(const pr of PAIRS) for(const [st, inj] of INJ){
    const p = C.IA.buildProgram(Object.assign(mkCfg(pr, 'balanced', 'intermediate', 'commercial', 76308), { injury:inj })); SURV.progs.b++;
    latOpen('b', pr[0][1] + '+' + pr[1][1] + '|' + st, p, x => ctOf(x) === 'bike', null); }
});
section('lattice-c', () => { C.unforce();
  const progs = [['HALF_MANNY', MANNY_P]].concat(PAIRS.map(pr => [pr[0][1] + '+' + pr[1][1], C.IA.buildProgram(mkCfg(pr, 'balanced', 'intermediate', 'commercial', 76308))]));
  for(const [name, p] of progs){ SURV.progs.c++;
    latOpen('c', name, p, x => ctOf(x) === 'run' || ctOf(x) === 'swim', { swapTo:'bike', bike_mins:'', run_mins:'', run_dist:'', swim_yards:'', rpe:'', notes:'' }); }
});
const LG = g => SURV.lat.filter(x => x.grp === g);
const kinds = a => { const o = {}; a.forEach(x => { o[x.k] = (o[x.k] || 0) + 1; }); return o; };
P('  hosts: bike ' + J(HOSTB) + ' (bike_base balanced intermediate commercial seed 24865), run ' + J(HOSTR) + ' (HALF_MANNY)');
P('  lattice (a) ' + SURV.progs.a + ' bike-goal programs, ' + LG('a').length + ' bike forms ' + J(kinds(LG('a'))) + ' | (b) ' + SURV.progs.b + ' injured multi-sport programs, ' + LG('b').length
  + ' bike forms, ' + LG('b').filter(x => x.ct).length + ' Cross-Train ' + J(kinds(LG('b').filter(x => x.ct))) + ' | (c) ' + SURV.progs.c + ' programs, ' + LG('c').length + ' swapped-in bike forms on run or swim days');
Object.keys(SURV.err).forEach(k => P('  SURVEY CRASH ' + k + ': ' + SURV.err[k]));
const errCj = (tag, keys) => keys.filter(k => SURV.err[k]).map(k => [tag + '-survey-' + k, false, SURV.err[k]]);

// ── ROW D207/D210-forms ──────────────────────────────────────────────────────────────────────────────────────────
function rowForms(){
  const cj = [verCj('forms')].concat(errCj('forms', ['hosts', 'swaplive', 'lattice-a', 'lattice-b', 'lattice-c']));
  for(const k of Object.keys(HAND)){ const bad = [];
    for(const e of [{}, { bike_mins:'45' }]){ const fm = tryv(() => C.ev('cardioFieldHTML')('bike', e, HAND[k].dose, HAND[k].sub));
      if(typeof fm !== 'string'){ bad.push('threw ' + J(fm)); continue; } bikeShape(fm, !!HAND[k].dose, e.bike_mins || '').forEach(b => bad.push(J(e) + ' ' + b)); }
    cj.push(['forms-hand-' + k, !bad.length, bad.length ? bad.join('; ') : "cardioFieldHTML('bike', {} and {bike_mins:'45'}, " + J(HAND[k].dose) + '): one hms wheel for log_bike_mins in iaw-wrap iaw-solo, no data-plan, hidden once (value "" / "45"), no number box, strip ' + !!HAND[k].dose]); }
  for(const g of ['a', 'b', 'c']){ const L = LG(g), bad = L.filter(x => x.shape.length);
    cj.push(['forms-lattice-' + g, L.length > 0 && !bad.length, (L.length - bad.length) + '/' + L.length + ' lattice (' + g + ') bike forms carry the ruled shape' + (bad.length ? ' | e.g. ' + bad.slice(0, 3).map(x => x.name + ' W' + x.w + ' ' + x.d + ' ' + x.k + ': ' + x.shape.join('; ')).join(' | ') : '')]); }
  const ka = kinds(LG('a')), ctb = LG('b').filter(x => x.ct);
  cj.push(['forms-cover', ka.time > 0 && ka.reps_time > 0 && ka.null > 0 && ctb.length > 0 && ctb.every(x => x.k === 'time(parsed)'),
    '(a) reaches time ' + (ka.time || 0) + ', reps_time ' + (ka.reps_time || 0) + ', null ' + (ka.null || 0) + '; (b) Cross-Train ' + ctb.length + ' ' + J(kinds(ctb)) + ' (want each > 0, Cross-Train all time(parsed))']);
  const nbox = LG('a').concat(LG('b'), LG('c')).filter(x => x.shape.some(s => /number box/.test(s))).length, nplan = SURV.lat.filter(x => x.shape.some(s => /data-plan/.test(s))).length;
  cj.push(['forms-lattice-tally', SURV.lat.length > 0 && nbox === 0 && nplan === 0, SURV.lat.length + ' lattice bike forms: ' + nbox + ' with a number box, ' + nplan + ' with data-plan (want 0, 0)']);
  const sl = SURV.swapLive;
  cj.push(['forms-swap-live', !!sl && !sl.shape.length && sl.face === DASH_HMS, sl ? "live setCardioSwap('bike') on HALF_MANNY " + J(HOSTR) + ': ' + (sl.shape.length ? sl.shape.join('; ') : 'ruled shape, no strip') + ', face ' + J(sl.face) + ' (want ' + DASH_HMS + ')' : 'not surveyed']);
  const src = stripComments(CAND_TEXT), nsrc = (src.match(/<input\b[^>]*>/g) || []).filter(t => /type="number"/.test(t) && /id="log_bike_mins"/.test(t)).length;
  cj.push(['forms-source', nsrc === 0, 'number boxes with id log_bike_mins in the comment-stripped candidate: ' + nsrc]);
  row('D207/D210-forms', cj);
}

// ── ROW D209-copy ────────────────────────────────────────────────────────────────────────────────────────────────
function rowCopy(){
  const cj = [verCj('copy')].concat(errCj('copy', ['hosts', 'swaplive', 'lattice-a', 'lattice-b', 'lattice-c']));
  for(const k of Object.keys(HAND)){ const fm = tryv(() => C.ev('cardioFieldHTML')('bike', {}, HAND[k].dose, HAND[k].sub));
    const bad = typeof fm === 'string' ? copyBad(fm) : ['threw ' + J(fm)];
    const lab = typeof fm === 'string' ? ((fm.match(/<label>[\s\S]*?<\/label>/) || [''])[0].replace(/<svg[\s\S]*?<\/svg>/, '[bike glyph]').replace(/<\/?label>/g, '')) : '';
    cj.push(['copy-hand-' + k, !bad.length, bad.length ? bad.join('; ') : 'label ' + J(lab) + ', no f-sub, old strings absent']); }
  const L = SURV.lat, bad = L.filter(x => x.copy.length);
  cj.push(['copy-lattice', L.length > 0 && !bad.length, (L.length - bad.length) + '/' + L.length + ' lattice bike forms carry `Log the ride` after the bike glyph, no f-sub, no old string' + (bad.length ? ' | e.g. ' + bad.slice(0, 3).map(x => x.name + ' W' + x.w + ' ' + x.d + ': ' + x.copy.join('; ')).join(' | ') : '')]);
  const sl = SURV.swapLive; cj.push(['copy-swap-live', !!sl && !sl.copy.length, sl ? (sl.copy.length ? sl.copy.join('; ') : 'the live swapped-in bike form carries the copy') : 'not surveyed']);
  const src = stripComments(CAND_TEXT), n = (src.match(/Bike — actual duration/g) || []).length;
  cj.push(['copy-source', n === 0, '`Bike — actual duration` in the comment-stripped candidate: ' + n + ' (want 0)']);
  row('D209-copy', cj);
}

// ── ROW D207-open ────────────────────────────────────────────────────────────────────────────────────────────────
function rowOpen(){
  const cj = [verCj('open')].concat(errCj('open', ['hosts', 'hand', 'lattice-a', 'lattice-b', 'lattice-c']));
  for(const key of Object.keys(SURV.hand)){ const s = SURV.hand[key];
    const good = s.inputs === 0 && s.same && s.face === DASH_HMS && s.hid === '';
    cj.push(['open-' + key.replace(' ', '-'), good, s.k + ' (stored ' + key.split(' ')[1] + ' blank): face ' + J(s.face) + ' (want ' + DASH_HMS + '), input events ' + s.inputs + ', ia_logs_ unchanged ' + s.same + ', hidden ' + J(s.hid)]); }
  const lg = SURV.legacy.map(x => [x, x.inputs === 0 && x.same && x.face === x.want]);
  cj.push(['open-legacy', lg.length === LEGACY_BIKE.length && lg.every(y => y[1]), lg.map(([x, g]) => J(x.v) + ' -> ' + J(x.face) + (g ? '' : ' (want ' + x.want + ', inputs ' + x.inputs + ', same ' + x.same + ')')).join(', ')]);
  for(const g of ['a', 'b', 'c']){ const L = LG(g), bad = L.filter(x => !(x.inputs === 0 && x.same && x.face === DASH_HMS));
    cj.push(['open-lattice-' + g, L.length > 0 && !bad.length, (L.length - bad.length) + '/' + L.length + ' lattice (' + g + ') bike forms open on the dash writing nothing' + (bad.length ? ' | e.g. ' + bad.slice(0, 3).map(x => x.name + ' W' + x.w + ' ' + x.d + ' face ' + J(x.face) + ' inputs ' + x.inputs + ' same ' + x.same).join(' | ') : '')]); }
  row('D207-open', cj);
}

// ── ROW D207-move ────────────────────────────────────────────────────────────────────────────────────────────────
function rowMove(){
  const cj = [verCj('move')].concat(errCj('move', ['hosts']));
  const step = (name, f) => { try { f(); } catch(e){ cj.push([name, false, 'crashed: ' + String(e && e.message || e).slice(0, 160)]); } };
  const [HW, HD] = HOSTB || [1, 'mon'];
  const need = () => { const w = C.wheel('log_bike_mins'); if(!w) throw new Error('no wheel for log_bike_mins on the rendered form'); return w; };
  const hid = () => C.els.log_bike_mins ? C.els.log_bike_mins.value : null;
  step('move-45', () => {
    C.use(HOSTP); C.force(HAND.time.dose); C.setLog(HW, HD, null); C.open(HW, HD);
    C.move(need(), 0, '0'); C.move(need(), 1, '45');
    const e = C.entry(HW, HD) || {};
    cj.push(['move-45', e.bike_mins === '45.00' && hid() === '45.00' && (C.INPUTS.log_bike_mins || 0) === 2, 'dash -> hours 0 -> minutes 45: stored bike_mins ' + J(e.bike_mins) + ', hidden ' + J(hid()) + ', input events ' + (C.INPUTS.log_bike_mins || 0) + ' (want "45.00", "45.00", 2)']);
    C.ctx.__dots.length = 0; const pr = tryv(() => C.ev('renderProgressScreen')());
    const ch = C.ctx.__dots.find(a => /Weekly Cycling Time/.test(String(a[0])));
    const wk = ch ? Array.from(ch[1]) : [], dat = ch ? Array.from(ch[2]) : [], v = dat[wk.indexOf(HW)];
    cj.push(['move-progress', !!ch && v === 45 && !(pr && pr.__err), 'Progress `Weekly Cycling Time` W' + HW + ' = ' + J(v) + ' (want 45)' + (ch ? '' : ' | chart not drawn') + (pr && pr.__err ? ' | renderProgressScreen threw ' + pr.__err : '')]);
    C.open(HW, HD); const n1 = C.els.detailBody.innerHTML.includes(NUDGE);
    C.setLog(HW, HD, { bike_mins:'', rpe:'5', notes:'' }); C.open(HW, HD); const n0 = C.els.detailBody.innerHTML.includes(NUDGE);
    cj.push(['move-haslog', n1 && !n0, '_hasLog nudge with stored 45.00: ' + n1 + ' (want true); with a blank bike entry: ' + n0 + ' (want false)']);
  });
  step('move-seedonly', () => {
    C.use(HOSTP); C.force(HAND.time.dose);
    C.setLog(HW, HD, { bike_mins:'45', rpe:'5' }); const b1 = C.logs(); C.open(HW, HD); C.move(need(), 1, '45'); C.move(need(), 0, '0');
    const s1 = C.logs() === b1, i1 = C.inputs(), f1 = C.face(need());
    C.setLog(HW, HD, null); C.open(HW, HD); C.move(need(), 0, ''); const e0 = C.entry(HW, HD), i0 = C.inputs();
    cj.push(['move-seedonly', s1 && i1 === 0 && f1 === '0:45:00' && e0 === null && i0 === 0, 'stored 45 settles on its seed face 0:45:00 only: ia_logs_ unchanged ' + s1 + ', input events ' + i1 + ', face ' + J(f1) + '; blank settles on the dash only: entry ' + J(e0) + ', input events ' + i0 + ' (want true, 0, 0:45:00; null, 0)']);
  });
  step('move-peg', () => {
    C.use(HOSTP); C.force(HAND.time.dose);
    C.setLog(HW, HD, { bike_mins:'630.5', rpe:'5' }); C.open(HW, HD); const f0 = C.face(need());
    C.move(need(), 2, '58'); const a = (C.entry(HW, HD) || {}).bike_mins; C.move(need(), 2, '59'); const b = (C.entry(HW, HD) || {}).bike_mins;
    cj.push(['move-peg', f0 === '9:59:59' && a === '599.97' && b === '599.98' && hid() === '599.98', 'stored 630.5 seeds ' + J(f0) + '; seconds to 58 stores ' + J(a) + ', back to 59 stores ' + J(b) + ', hidden ' + J(hid()) + ' (want 9:59:59, "599.97", "599.98", "599.98")']);
  });
  C.unforce();
  row('D207-move', cj);
}

// ── ROW D208-clamp ───────────────────────────────────────────────────────────────────────────────────────────────
function rowClamp(){
  const cj = [verCj('clamp')].concat(errCj('clamp', ['hosts', 'hand']));
  const t = PARSE_HAND.map(([s, w]) => { const g = tryv(() => Array.from(C.ev('_iawParse')('hms', s))); return [s, g, w, J(g) === J(w)]; });
  cj.push(['clamp-parse', t.every(x => x[3]), t.map(x => J(x[0]) + ' -> ' + J(x[1]) + (x[3] ? '' : ' (want ' + J(x[2]) + ')')).join(', ')]);
  for(const [tag, L, fk] of [['run', SURV.clampRun, 'runFace'], ['bike', SURV.clampBike, 'face']]){
    const g = L.map(x => [x, x.inputs === 0 && x.same && x[fk] === x.want]);
    cj.push(['clamp-' + tag, g.length === CLAMP.length && g.every(y => y[1]), (tag === 'run' ? 'run time form (dose 15 min) stored run_mins ' : 'bike form stored bike_mins ') + g.map(([x, ok2]) => J(x.v) + ' -> ' + J(x[fk]) + (ok2 ? '' : ' (want ' + x.want + ', inputs ' + x.inputs + ', same ' + x.same + ')')).join(', ')]);
  }
  row('D208-clamp', cj);
}

// D211-untouched (D211, the V233 build pair: D207 to D210 moved only the bike form against V232; HALF_MANNY era row 233) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).

const ROWS = { 'D207/D210-forms':rowForms, 'D209-copy':rowCopy, 'D207-open':rowOpen, 'D207-move':rowMove, 'D208-clamp':rowClamp };
for(const k of ROW_ORDER){ try { ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
P('  timer errors in the candidate VM: ' + C.errs.length + (C.errs.length ? ' ' + J(C.errs.slice(0, 3)) : ''));
done();
