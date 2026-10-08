// g232_d199_runwheel.js — GATE for V232 P-RUNWHEEL (D199–D206): the dosed run log forms are wheels. Run time is an
// H:MM:SS clock stored as decimal minutes, run miles the existing `dist` wheel; the fixed dimension shows the plan, the
// free dimension parks on the dash, and opening a day never writes.
//
//   node tests/gates/g232_d199_runwheel.js <candidate.html> [baseline_V231.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v232_rulings/v232_ruling_d199_d206.md (coach, D199–D206) with Mario's calls and the session's guard
//   form in tests/measure/v232_rulings/v232_session_calls.md: item 7 (D199 H:MM:SS; D202 plan on the fixed wheel, dash on
//   the free wheel; D205 runs only; D206 copy shipped EXCEPT "Hours first." dropped, the free time sub-label reads
//   `Off the watch.`), item 8 (the SEED-FACE guard: iaWheelInit records the face it seeded; _iawCommit writes nothing
//   until the wheel has rested on a different face), item 10 (slice 1 notes accepted: hours alone clamp to 9 for display,
//   a colon string reads its leading number), item 12 (the `iaw-solo` hook and the derived width). D-codes D199–D204 and
//   D206, ships on ia-version 232. Surgery: tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py,
//   v232_s3_width_bump.py.
//
// ORACLES. Nothing below asks the engine what the answer should be.
//   HMS_COLS     D199's spec as a hand table: hours ['', '0'..'9'] no wrap; minutes and seconds '0'..'59' five times,
//                wrapping, faces '00'..'59'; cap `Time`; three columns (class iaw-f3).
//                V235 (D215, D216; tests/measure/v235_rulings/v235_ruling_d215_d217.md, "Existing rows this ruling
//                flips"): from VER 235 the hours column is HMS_COLS_V235's ['0'..'9'], 10 rows, no dash, still no wrap;
//                VER <= 234 keeps HMS_COLS. HMS_PARSE_V235: blank, -1 and abc seed 0:00:00 from 235, and the zero face
//                0:00:00 formats to '' (the one face D200's round trip excepts; it parses back to 0:00:00).
//   SECONDS      D200: every T in 0..35999 s. h = T div 3600, mm = (T mod 3600) div 60, ss = T mod 60; the emitted string
//                is hundredths n = round(5T/3) = (10T + 3) div 6 (no ties: 10T is even, 6k + 3 odd), printed n div 100 '.'
//                two digits of n mod 100. Integer arithmetic only.
//   EXAMPLES     D200's typed examples (7:30 -> 7.50, 15:20 -> 15.33, 0:30:00 -> 30.00) and a stored-value table.
//   DEC3         D203's typed table (.86 -> 0 . 8 6; abc, ., -1 -> dash; 3.456 -> 3 4 5; 100 -> 99).
//   FACES        the fixed face from the plan by hand: minutes -> round(60 m) s -> h:mm:ss; miles -> hundredths
//                floor(round(1000 mi) / 10) -> w.hh (the dist wheel truncates past hundredths, D203).
//   COPY         D206 as amended by Mario (call 7), typed verbatim.
//   WIDTH        slice 3's derivation from the CSS that applies at a 375pt viewport: (375 − 2×16 .detail-body − 2×1
//                .log-section border − 2×16 .log-body − 12 .iaw-wrap gap) × 3/5 (the f3 share of 3 + 2) = 178.2; the
//                premises are presence-checked as literal CSS rules in the candidate.
//   PACE         D202-move: pace = minutes × 60 / miles seconds per mile, printed m:ss, by hand.
//
// OBSERVATION is the real open path inside the harness VM: openDayKey -> openDetail -> buildLogHTML -> cardioFieldHTML ->
//   the listener wiring -> iaWheelInit -> updateDoseDerived, and persistLogFields on every `input`. A DOM stub parses the
//   rendered markup into hidden inputs and wheels (rows, faces, data-plan straight from the HTML); each column's scrollTop
//   setter DISPATCHES `scroll`, as a browser does for a programmatic scrollTop (call 6), so the seed frame and every
//   recentre reach _iawCommit and the guard is exercised; `Event` is stubbed; a virtual clock runs every timer and rAF.
//   Hand-built doses (time 15 min, dist 8 mi, reps_time 6 × 3 min; D204: no lattice config reaches reps_time) are routed
//   through the same path by wrapping doseFromCardio in the VM (`__FORCE`); with __FORCE null it is the engine's own.
//
// LATTICE (D199/D201/D204-forms, D202-open): HALF_MANNY (harness fixture) plus LAT, 12 run-goal programs: goal run_5k,
//   run_10k, run_half, run_marathon, run_pace_goal (1.5 mi in 10:30), run_base × experience beginner, advanced; focus
//   balanced, equipment commercial, rest sun+wed, seed 24865 (measure B's mkCfg shape, tests/measure/
//   v232_runwheel_lattice.js). Every day whose cardio is a run with a `time` or `dist` dose is opened with no stored entry.
//   Each program is stored with startDate Monday 2026-09-21, blockOpen deleted, the clock pinned to that Monday 10:00.
//
// VERSION PREDICATE (standing rulings 2 and 4). Every behaviour row RUNS on every tree; `VER >= 232` is the first conjunct.
//   On V231 as candidate each also fails by its own behaviour conjuncts (no hms kind, .86 on the dash, number boxes, old
//   copy, no width rule): no row is vacuous. D-untouched is this build's premise only: it runs when the candidate reads 232
//   and the baseline 231 (argv[3] when it reads 231, else git 5d9354b), else SKIP with the reason, never PASS.
//
// ROWS
//   D199-spec   the hms wheel's rendered rows, wrap flags, faces, cap and column class equal HMS_COLS (VER <= 234) or
//               HMS_COLS_V235 (VER >= 235).
//   D200-rt     36,000 seconds format to the integer oracle and parse back; D200 examples; stored-value table. From 235
//               T = 0 formats to '' and parses back to 0:00:00, and the stored table is HMS_PARSE_V235 (D215).
//   D203        the dist (dec3) parse table.
//   D199/D201/D204-forms  hand-built time, dist, reps_time and every lattice form: 0 number boxes for log_run_mins /
//               log_run_dist, hidden inputs present, wheel kinds and order, data-plan only on the fixed wheel and equal to
//               dose.mins / dose.mi, every stacked wrap carries iaw-solo.
//   D202-open   opening with stored '' writes nothing on every form (0 input events, ia_logs_ byte-unchanged); fixed face =
//               FACES, free wheel on the dash (VER <= 234; from 235 the free time wheel on the dist form opens on 0:00:00
//               and the free miles wheel on the time form stays on the dash, D215); a legacy table opens writing nothing
//               and seeds the hand faces.
//   D202-move   a moved fixed wheel commits two-decimal minutes / miles and persistLogFields stores them; away and back to
//               the seed face commits; a settle on the seed face alone writes nothing; doseDerived reads the stored value.
//   D206-copy   the label and sub-label strings verbatim, `Hours first` absent, no mid-sentence dash in them.
//   D199-width  `.iaw-solo{max-width:178.2px}` = WIDTH, its premises present.
//   D-untouched (pair 232 vs 231) generic run, reps_dist, bike, swim markup byte-identical to V231; HALF_MANNY digest equals
//               MANNY_DIGEST_BY_VERSION[232] (row existence a conjunct; standing ruling 5) and is self-stable.
//   SABOTAGE    tests/sabotage/v232_d199.json, one mutation per defended claim, each naming the row it trips.
//
// Temp files: the git copy of V231 (when argv[3] is absent or not 231) goes under os.tmpdir() (run with TMPDIR set to the
//   scratch path) and is removed on exit.
'use strict';
process.env.TZ = 'America/New_York';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 232;
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ── HAND ORACLE ──────────────────────────────────────────────────────────────────────────────────────────────────
const DASH = '—';
const range = (a, b) => { const o = []; for(let v = a; v <= b; v++) o.push(String(v)); return o; };
const rep5 = a => [].concat(a, a, a, a, a);
const HMS_COLS = [
  { rows:[''].concat(range(0, 9)), wrap:'', len:'11', faces:[DASH].concat(range(0, 9)) },
  { rows:rep5(range(0, 59)), wrap:'1', len:'60', faces:rep5(range(0, 59).map(v => v.padStart(2, '0'))) },
  { rows:rep5(range(0, 59)), wrap:'1', len:'60', faces:rep5(range(0, 59).map(v => v.padStart(2, '0'))) },
];
// V235 (D215, D216): the hours column has no dash row and still does not wrap. Chosen at use (rowSpec), so the claim splits
// by range: VER <= 234 HMS_COLS, VER >= 235 this table. Minutes and seconds are HMS_COLS' own entries, unchanged.
const HMS_COLS_V235 = [{ rows:range(0, 9), wrap:'', len:'10', faces:range(0, 9) }, HMS_COLS[1], HMS_COLS[2]];
const FMT_EX = [[['0', '7', '30'], '7.50'], [['0', '15', '20'], '15.33'], [['0', '30', '0'], '30.00'], [['', '47', '23'], '']];
const HMS_PARSE = [['15.333', ['0', '15', '20']], ['100', ['1', '40', '0']], ['7.5', ['0', '7', '30']], ['', ['', '', '']], ['-1', ['', '', '']], ['abc', ['', '', '']]];
// V235 (D215): blank and malformed seed 0:00:00 (no dash row to land on); the numeric rows are HMS_PARSE's, unchanged.
const HMS_PARSE_V235 = [['15.333', ['0', '15', '20']], ['100', ['1', '40', '0']], ['7.5', ['0', '7', '30']], ['', ['0', '0', '0']], ['-1', ['0', '0', '0']], ['abc', ['0', '0', '0']]];
const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];
const hmsFace = m => { const t = Math.round(m * 60); return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const miFace = mi => { const hd = Math.floor(Math.round(mi * 1000) / 10); return Math.floor(hd / 100) + '.' + String(hd % 100).padStart(2, '0'); };
const DASH_HMS = DASH + ':00:00', DASH_MI = DASH + '.00';
// V235 (D215): the free time wheel's blank face from 235 is zero, a stopwatch not started. A function, read at use: VER is set
// after load. The free miles wheel keeps DASH_MI on every version (D217).
const ZERO_HMS = '0:00:00', FREE_HMS = () => VER >= 235 ? ZERO_HMS : DASH_HMS;
const pace = (mins, mi) => { const s = Math.round(mins * 60 / mi); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '/mi'; };
const COPY = {
  time:      { label:'Log the run', subs:['Shows the plan. Move it to match the watch.', 'Off the watch.'], caps:['Time', 'Miles'] },
  dist:      { label:'Log the run', subs:['Shows the plan. Move it to match the watch.', 'Off the watch.'], caps:['Miles', 'Time'] },
  reps_time: { label:'Miles in the work reps', subs:['Leave out the easy jog between reps.'], caps:['Miles'] },
};
const FORM = {   // [hidden id, kind] in render order; the first is fixed (carries data-plan) except on reps_time
  time:      { wheels:[['log_run_mins', 'hms'], ['log_run_dist', 'dist']], fixed:true },
  dist:      { wheels:[['log_run_dist', 'dist'], ['log_run_mins', 'hms']], fixed:true },
  reps_time: { wheels:[['log_run_dist', 'dist']], fixed:false },
};
const DOSES = { time:{ k:'time', mins:15, tgt:531, key:'chi' }, dist:{ k:'dist', mi:8, tgt:570 }, reps_time:{ k:'reps_time', reps:6, mins:3, tgt:480 } };
const LEGACY = [   // [form, stored entry, hand faces by hidden id]
  // V235 (D215): the dist form's free time wheel is on the dash through 234 and on 0:00:00 from 235 (a getter, read at use).
  ['dist', { run_dist:'3.456' }, { log_run_dist:'3.45', get log_run_mins(){ return FREE_HMS(); } }],
  ['dist', { run_dist:'.86' }, { log_run_dist:'0.86', get log_run_mins(){ return FREE_HMS(); } }],
  ['dist', { run_dist:'100' }, { log_run_dist:'99.00', get log_run_mins(){ return FREE_HMS(); } }],
  ['time', { run_mins:'100' }, { log_run_mins:'1:40:00', log_run_dist:DASH_MI }],
  ['time', { run_mins:'15.333' }, { log_run_mins:'0:15:20', log_run_dist:DASH_MI }],
  // V233 D208 re-rules D200's shipped hours-only clamp to a whole-face peg (tests/measure/v233_rulings/v233_ruling_d207_d211.md); a getter, so VER is read at use.
  ['time', { run_mins:'650' }, { get log_run_mins(){ return VER >= 233 ? '9:59:59' : '9:50:00'; }, log_run_dist:DASH_MI }],
  ['time', { run_mins:'7.5' }, { log_run_mins:'0:07:30', log_run_dist:DASH_MI }],
];
const W375 = (375 - 2 * 16 - 2 * 1 - 2 * 16 - 12) * 3 / 5;   // 178.2
const W_PREMISES = ['.detail-body{padding:16px 16px 20px !important;', '.log-section{background:var(--surface) !important;border:1px solid var(--border) !important;',
  '.log-body{padding:14px 16px;', '.iaw-wrap{display:flex;gap:12px;', '.iaw-cell{flex:1;min-width:0;}', '.iaw-cell.iaw-f3{flex:3;}', '.iaw-cell.iaw-f2{flex:2;}', '.iaw{display:flex;', 'border:1px solid var(--border2);border-radius:4px;position:relative;'];
const RUNG = [['run_5k', {}], ['run_10k', {}], ['run_half', {}], ['run_marathon', {}], ['run_pace_goal', { targetDist:'1.5', targetMins:'10', targetSecs:'30' }], ['run_base', {}]];
const LAT_EXP = ['beginner', 'advanced'];
function mkCfg(g, ex){
  const race = /^run_(5k|10k|half|marathon)$/.test(g[0]);
  return { name:'L', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, g[1]) },
    eventTargeted:race, raceDate:race ? '2026-12-20' : null, liftingFocus:'balanced', experience:ex, ageBracket:'18-35', equipment:'commercial', unit:'lbs',
    restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:24865 };
}

// ── PLUMBING ─────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, skip = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const J = JSON.stringify;
const R = {
  'D199-spec': 'row D199-spec (D199, VER >= 232) the hms wheel renders hours [dash, 0..9] (VER <= 234) or [0..9] (VER >= 235, D215) no wrap : minutes [00..59] wrap : seconds [00..59] wrap, cap Time, class iaw-f3',
  'D200-rt': 'row D200-rt (D200, VER >= 232) 0:00:00..9:59:59 each format to hundredths round(5T/3) and parse back to the same h/mm/ss; 7:30 -> 7.50, 15:20 -> 15.33, 0:30:00 -> 30.00; stored 15.333 / 100 / 7.5 seed 0:15:20 / 1:40:00 / 0:07:30, blank / -1 / abc on the dash (VER <= 234) or on 0:00:00 with the zero face stored as blank (VER >= 235, D215)',
  'D203': 'row D203 (D203, VER >= 232) dist parse: .86 -> 0 . 8 6; abc, ., -1 -> dash; 3.456 -> 3 4 5; 100 -> 99',
  'D199/D201/D204-forms': 'row D199/D201/D204-forms (VER >= 232) hand-built time, dist, reps_time and every lattice form: no number box for log_run_mins / log_run_dist, hidden inputs present, wheels time [hms, dist] dist [dist, hms] reps_time [dist], data-plan only on the fixed wheel = dose.mins / dose.mi, every stacked wrap iaw-solo',
  'D202-open': 'row D202-open (D200 gate, D202, call 8, VER >= 232) opening with stored blank writes nothing on every form (0 input events, ia_logs_ byte-unchanged), the fixed face is the plan, the free wheel is on the dash (from VER 235 the free time wheel is on 0:00:00, D215; the free miles wheel stays on the dash); the legacy table opens writing nothing on its hand faces',
  'D202-move': 'row D202-move (D202, call 8, VER >= 232) a moved fixed wheel commits 15.50 / 8.25 and ia_logs_ stores it; away and back to the seed face commits; a settle on the seed face alone writes nothing; doseDerived reads the stored value (15.5 min / 2 mi = 7:45/mi)',
  'D206-copy': 'row D206-copy (D206 + call 7, VER >= 232) `Log the run`, `Shows the plan. Move it to match the watch.`, `Off the watch.` on both free wheels, `Miles in the work reps`, `Leave out the easy jog between reps.`; no `Hours first`; no mid-sentence dash',
  'D199-width': 'row D199-width (D199 layout, call 12, VER >= 232) `.iaw-solo{max-width:178.2px}` = (375 − 2×16 − 2×1 − 2×16 − 12) × 3/5, its CSS premises present',
};
const ROW_ORDER = Object.keys(R);
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
const tryv = f => { try { return f(); } catch(e){ return { __err:String(e && e.message || e).slice(0, 120) }; } };

// ── ENV: virtual clock, a DOM stub that parses the rendered markup, scroll-dispatching wheels ────────────────────
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
    while((m = re.exec(html))){ const id = m[3], attrs = m[2] + ' ' + m[4]; if(id === 'detailBody') continue;
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
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'screenWeek', 'daysList'].forEach(i => doc.getElementById(i));
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  ev('var __realDFC=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE || __realDFC(c); };');
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'measure'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;'); ev("showScreen('screenWeek')"); return q; };
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

// read a rendered dose form: inputs, wheels (in order), wraps, labels, sub-labels, caps
function readForm(fm){
  const inputs = (fm.match(/<input\b[^>]*>/g) || []);
  const numBox = inputs.filter(t => /type="number"/.test(t) && /id="log_run_(mins|dist)"/.test(t)).length;
  const hidden = inputs.filter(t => /type="hidden"/.test(t)).map(t => (t.match(/id="([^"]+)"/) || [])[1]);
  const wheels = (fm.match(/<div class="iaw" data-kind="[^"]+" data-for="[^"]+"(?: data-plan="[^"]*")?>/g) || []).map(t => ({ kind:t.match(/data-kind="([^"]+)"/)[1], hid:t.match(/data-for="([^"]+)"/)[1], plan:(t.match(/data-plan="([^"]*)"/) || [])[1] }));
  const wraps = (fm.match(/<div class="iaw-wrap[^"]*"/g) || []).map(t => t.slice(12, -1));
  const labels = (fm.match(/<label>[\s\S]*?<\/label>/g) || []).map(s => s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim());
  const subs = (fm.match(/<div class="f-sub">([^<]*)<\/div>/g) || []).map(s => s.replace(/<[^>]+>/g, ''));
  const caps = (fm.match(/<div class="iaw-cap">([^<]*)<\/div>/g) || []).map(s => s.replace(/<[^>]+>/g, ''));
  return { numBox, hidden, wheels, wraps, labels, subs, caps };
}
// the form-shape conjunct for one rendered form, against FORM and the dose
function formShape(k, f, dose){
  const want = FORM[k].wheels, bad = [];
  if(f.numBox) bad.push(f.numBox + ' number box');
  for(const [hid] of want) if(!f.hidden.includes(hid)) bad.push('no hidden ' + hid);
  if(J(f.wheels.map(w => [w.hid, w.kind])) !== J(want)) bad.push('wheels ' + J(f.wheels.map(w => w.kind + ':' + w.hid)));
  const planWant = FORM[k].fixed ? String(k === 'time' ? dose.mins : dose.mi) : undefined;
  f.wheels.forEach((w, i) => { const pw = i === 0 ? planWant : undefined; if(w.plan !== pw) bad.push('data-plan ' + w.hid + '=' + w.plan + ' want ' + pw); });
  if(f.wraps.length !== want.length || !f.wraps.every(c => c === 'iaw-wrap iaw-solo')) bad.push('wraps ' + J(f.wraps));
  return bad;
}

// ── LOAD + VERSION + BASELINE ────────────────────────────────────────────────────────────────────────────────────
let VER = NaN, C = null, CAND_TEXT = '';
try { CAND_TEXT = fs.readFileSync(ART, 'utf8'); C = mkEnv(ART); VER = +C.IA.version; }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ROW_ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g232 D199–D206 P-RUNWHEEL | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every behaviour row runs and must FAIL by its own conjuncts)'));
const PARSE = (k, s) => C.ev('_iawParse')(k, s), FMT = (k, a) => C.ev('_iawFormat')(k, a);

// ── ROW D199-spec ────────────────────────────────────────────────────────────────────────────────────────────────
function rowSpec(){
  const cj = [verCj('spec')];
  const h = tryv(() => C.ev('iaWheelHTML')('hms', 'g232_x', ''));
  if(h && h.__err){ cj.push(['spec-render', false, 'iaWheelHTML(hms) threw: ' + h.__err]); return row('D199-spec', cj); }
  const cls = (h.match(/class="iaw-cell (iaw-f\d)"/) || [])[1], cap = (h.match(/<div class="iaw-cap">([^<]*)<\/div>/) || [])[1];
  // parse the rendered columns exactly as the open path's stub does
  const cols = []; const cre = /<div class="iaw-col" data-ci="(\d+)" data-wrap="(1?)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g; let c;
  while((c = cre.exec(h))){ const rows = [], faces = []; const ire = /<div class="iaw-it(?: nil)?" data-v="([^"]*)">([^<]*)<\/div>/g; let it; while((it = ire.exec(c[4]))){ rows.push(it[1]); faces.push(it[2]); } cols.push({ wrap:c[2], len:c[3], rows, faces }); }
  cj.push(['spec-cols', cols.length === 3 && cls === 'iaw-f3', cols.length + ' columns, class ' + cls + ' (want 3, iaw-f3)']);
  (VER >= 235 ? HMS_COLS_V235 : HMS_COLS).forEach((o, i) => { const g = cols[i] || {};
    cj.push(['spec-c' + i, J(g.rows) === J(o.rows) && J(g.faces) === J(o.faces) && g.wrap === o.wrap && g.len === o.len,
      'column ' + i + ': ' + (g.rows ? g.rows.length : 0) + ' rows (want ' + o.rows.length + '), wrap "' + g.wrap + '" (want "' + o.wrap + '"), len ' + g.len + ' (want ' + o.len + '), first faces ' + J((g.faces || []).slice(0, 3)) + ' (want ' + J(o.faces.slice(0, 3)) + ')']); });
  cj.push(['spec-cap', cap === 'Time', 'cap ' + J(cap) + ' (want "Time")']);
  row('D199-spec', cj);
}

// ── ROW D200-rt ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowRt(){
  const cj = [verCj('rt')];
  let good = 0; const bad = [];
  for(let T = 0; T < 36000; T++){
    const h = Math.floor(T / 3600), m = Math.floor((T % 3600) / 60), s = T % 60, n = Math.floor((10 * T + 3) / 6);
    // V235 (D215): from 235 the zero face is the one excepted: it stores '' and parses back to 0:00:00 (checked below).
    const want = (VER >= 235 && T === 0) ? '' : Math.floor(n / 100) + '.' + String(n % 100).padStart(2, '0');
    const got = tryv(() => FMT('hms', [String(h), String(m), String(s)]));
    const back = typeof got === 'string' ? tryv(() => PARSE('hms', got)) : null;
    if(got === want && back && J(back) === J([String(h), String(m), String(s)])) good++;
    else if(bad.length < 4) bad.push(h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' -> ' + J(got) + ' (want ' + want + ') -> ' + J(back));
  }
  cj.push(['rt-seconds', good === 36000, good + '/36000 seconds format to the integer oracle and parse back' + (bad.length ? ' | e.g. ' + bad.join('; ') : '')]);
  const ex = FMT_EX.map(([a, w]) => { const g = tryv(() => FMT('hms', a)); return [a.join(':'), g, w, g === w]; });
  cj.push(['rt-examples', ex.every(x => x[3]), ex.map(x => x[0] + ' -> ' + J(x[1]) + (x[3] ? '' : ' (want ' + J(x[2]) + ')')).join(', ')]);
  const st = (VER >= 235 ? HMS_PARSE_V235 : HMS_PARSE).map(([s, w]) => { const g = tryv(() => PARSE('hms', s)); return [s, g, w, J(g) === J(w)]; });
  cj.push(['rt-stored', st.every(x => x[3]), st.map(x => J(x[0]) + ' -> ' + J(x[1]) + (x[3] ? '' : ' (want ' + J(x[2]) + ')')).join(', ')]);
  row('D200-rt', cj);
}

// ── ROW D203 ─────────────────────────────────────────────────────────────────────────────────────────────────────
function rowDec3(){
  const cj = [verCj('dec3')];
  const t = DEC3.map(([s, w]) => { const g = tryv(() => PARSE('dist', s)); return [s, g, w, J(g) === J(w)]; });
  cj.push(['dec3-table', t.every(x => x[3]), t.map(x => J(x[0]) + ' -> ' + J(x[1]) + (x[3] ? '' : ' (want ' + J(x[2]) + ')')).join(', ')]);
  row('D203', cj);
}

// ── THE OPEN SURVEY (forms + open rows share it) ─────────────────────────────────────────────────────────────────
let HOST = null; const SURV = { hand:{}, lat:[], latErr:'', progs:0, latDays:0 };
function survey(){
  const pM = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)));
  C.use(pM);
  for(const w of Object.keys(pM.weeks).map(Number).sort((a, b) => a - b)){ for(const d of DAYS){ const x = pM.weeks[w][d];
    if(x && !x.rest && x.cardio && !Array.isArray(x.cardio) && (x.cardio.type || '').toLowerCase() === 'run'){ HOST = [w, d]; break; } } if(HOST) break; }
  // hand-built doses on the HALF_MANNY host day
  for(const k of ['time', 'dist', 'reps_time']){
    C.ctx.__FORCE = DOSES[k];
    for(const blank of ['none', 'explicit']){
      C.setLog(HOST[0], HOST[1], blank === 'none' ? null : { run_mins:'', run_dist:'', rpe:'', notes:'' });
      const before = C.logs(); C.open(HOST[0], HOST[1]);
      const f = readForm(C.form()); const faces = {}; C.wheels().forEach(w => { faces[w.hid] = C.face(w); });
      SURV.hand[k + ' ' + blank] = { k, dose:DOSES[k], f, faces, inputs:C.inputs(), same:C.logs() === before, hidVals:{ mins:C.els.log_run_mins.value, dist:C.els.log_run_dist.value } };
    }
  }
  // legacy table
  SURV.legacy = LEGACY.map(([k, stored, want]) => { C.ctx.__FORCE = DOSES[k]; C.setLog(HOST[0], HOST[1], Object.assign({ rpe:'5' }, stored)); const before = C.logs();
    C.open(HOST[0], HOST[1]); const faces = {}; C.wheels().forEach(w => { faces[w.hid] = C.face(w); });
    return { k, stored, want, faces, inputs:C.inputs(), same:C.logs() === before }; });
  C.ctx.__FORCE = null;
  // lattice: HALF_MANNY + LAT
  const progs = [['HALF_MANNY', pM]];
  for(const g of RUNG) for(const ex of LAT_EXP){ const cfg = mkCfg(g, ex); progs.push([g[0] + ' ' + ex, C.IA.buildProgram(cfg)]); }
  SURV.progs = progs.length;
  for(const [name, p] of progs){
    C.use(p);
    for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){
      const x = p.weeks[w][d]; if(!x || x.rest || !x.cardio || Array.isArray(x.cardio) || (x.cardio.type || '').toLowerCase() !== 'run') continue;
      const dose = C.ev('__realDFC')(x.cardio); if(!dose || (dose.k !== 'time' && dose.k !== 'dist')) continue;
      C.setLog(w, d, null); const before = C.logs(); C.open(w, d);
      const f = readForm(C.form()); const faces = {}; C.wheels().forEach(wh => { faces[wh.hid] = C.face(wh); });
      SURV.lat.push({ name, w, d, k:dose.k, dose:{ mins:dose.mins, mi:dose.mi }, f, faces, inputs:C.inputs(), same:C.logs() === before });
    }
  }
  SURV.latDays = SURV.lat.length;
}
let survErr = '';
try { survey(); } catch(e){ survErr = String(e && e.stack || e).slice(0, 300); }
P('  lattice: HALF_MANNY + LAT ' + (SURV.progs ? SURV.progs - 1 : '?') + ' run-goal programs (' + RUNG.map(g => g[0]).join(', ') + ' × ' + LAT_EXP.join(', ') + '; balanced, commercial, rest sun+wed, seed 24865) = ' + SURV.progs + ' programs, ' + SURV.latDays + ' dosed run days opened'
  + ' (' + ['time', 'dist'].map(k => k + ' ' + SURV.lat.filter(x => x.k === k).length).join(', ') + '); host day for hand-built doses ' + J(HOST) + (survErr ? ' | SURVEY CRASH ' + survErr : ''));

// ── ROW D199/D201/D204-forms ─────────────────────────────────────────────────────────────────────────────────────
function rowForms(){
  const cj = [verCj('forms')];
  if(survErr) cj.push(['forms-survey', false, survErr]);
  for(const k of ['time', 'dist', 'reps_time']){ const s = SURV.hand[k + ' none']; const bad = s ? formShape(k, s.f, s.dose) : ['not surveyed'];
    cj.push(['forms-' + k, !bad.length, bad.length ? bad.join('; ') : 'hand-built ' + k + ': 0 number boxes, hidden ' + s.f.hidden.join(' ') + ', wheels ' + s.f.wheels.map(w => w.kind + (w.plan != null ? '(plan ' + w.plan + ')' : '')).join(', ') + ', wraps ' + s.f.wraps.length + ' iaw-solo']); }
  const lb = []; SURV.lat.forEach(x => { const bad = formShape(x.k, x.f, x.dose); if(bad.length && lb.length < 5) lb.push(x.name + ' W' + x.w + ' ' + x.d + ' ' + x.k + ': ' + bad.join('; ')); if(bad.length) x.formBad = true; });
  const nb = SURV.lat.filter(x => x.formBad).length;
  cj.push(['forms-lattice', SURV.latDays > 0 && nb === 0, (SURV.latDays - nb) + '/' + SURV.latDays + ' lattice forms carry the ruled shape' + (lb.length ? ' | ' + lb.join(' | ') : '')]);
  cj.push(['forms-cover', SURV.lat.some(x => x.k === 'time') && SURV.lat.some(x => x.k === 'dist'), 'lattice reaches both dose kinds: time ' + SURV.lat.filter(x => x.k === 'time').length + ', dist ' + SURV.lat.filter(x => x.k === 'dist').length + ' (not vacuous)']);
  const nbox = (CAND_TEXT.match(/<input\b[^>]*>/g) || []).filter(t => /type="number"/.test(t) && /id="log_run_(mins|dist)"/.test(t)).length;
  cj.push(['forms-source', nbox === 0, 'number boxes with id log_run_mins / log_run_dist anywhere in the candidate: ' + nbox]);
  row('D199/D201/D204-forms', cj);
}

// ── ROW D202-open ────────────────────────────────────────────────────────────────────────────────────────────────
function rowOpen(){
  const cj = [verCj('open')];
  if(survErr) cj.push(['open-survey', false, survErr]);
  const wantFaces = (k, dose) => k === 'time' ? { log_run_mins:hmsFace(dose.mins), log_run_dist:DASH_MI } : k === 'dist' ? { log_run_dist:miFace(dose.mi), log_run_mins:FREE_HMS() } : { log_run_dist:DASH_MI };
  for(const key of Object.keys(SURV.hand)){ const s = SURV.hand[key], want = wantFaces(s.k, s.dose);
    const good = s.inputs === 0 && s.same && J(s.faces) === J(want) && s.hidVals.mins === '' && s.hidVals.dist === '';
    cj.push(['open-' + key.replace(' ', '-'), good, s.k + ' (stored ' + key.split(' ')[1] + ' blank): faces ' + J(s.faces) + (J(s.faces) === J(want) ? '' : ' (want ' + J(want) + ')') + ', input events ' + s.inputs + ', ia_logs_ unchanged ' + s.same + ', hidden ' + J(s.hidVals)]); }
  let good = 0; const bad = [];
  SURV.lat.forEach(x => { const want = wantFaces(x.k, x.dose); const g = x.inputs === 0 && x.same && J(x.faces) === J(want);
    if(g) good++; else if(bad.length < 5) bad.push(x.name + ' W' + x.w + ' ' + x.d + ' ' + x.k + ' faces ' + J(x.faces) + ' want ' + J(want) + ' inputs ' + x.inputs + ' same ' + x.same); });
  cj.push(['open-lattice', SURV.latDays > 0 && good === SURV.latDays, good + '/' + SURV.latDays + ' lattice days open writing nothing, fixed face = the plan by hand, free wheel on ' + (VER >= 235 ? 'its blank face (time 0:00:00, miles dash)' : 'the dash') + (bad.length ? ' | ' + bad.join(' | ') : '')]);
  const lg = (SURV.legacy || []).map(x => { const g = x.inputs === 0 && x.same && J(x.faces) === J(x.want); return [x, g]; });
  cj.push(['open-legacy', lg.length === LEGACY.length && lg.every(y => y[1]), lg.map(([x, g]) => x.k + ' ' + J(x.stored) + ' -> ' + J(x.faces) + (g ? '' : ' (want ' + J(x.want) + ', inputs ' + x.inputs + ', same ' + x.same + ')')).join(', ')]);
  row('D202-open', cj);
}

// ── ROW D202-move ────────────────────────────────────────────────────────────────────────────────────────────────
function rowMove(){
  const cj = [verCj('move')];
  const step = (name, f) => { try { f(); } catch(e){ cj.push([name, false, 'crashed: ' + String(e && e.message || e).slice(0, 160)]); } };
  const [HW, HD] = HOST || [1, 'mon'];
  const need = hid => { const w = C.wheel(hid); if(!w) throw new Error('no wheel for ' + hid + ' on the rendered form'); return w; };
  const ddText = () => (C.els.doseDerived.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  step('move-time', () => {
    C.ctx.__FORCE = DOSES.time; C.setLog(HW, HD, null); C.open(HW, HD);
    C.move(need('log_run_dist'), 0, '2');
    const e1 = C.entry(HW, HD) || {}, d1 = ddText();
    cj.push(['move-free', e1.run_dist === '2.00' && (e1.run_mins || '') === '' && d1.includes(pace(15, 2)) && /assuming planned 15 min/.test(d1), 'free miles to 2: stored ' + J({ run_mins:e1.run_mins, run_dist:e1.run_dist }) + ', derived "' + d1 + '" (want ' + pace(15, 2) + ', assuming planned 15 min)']);
    C.move(need('log_run_mins'), 2, '30');
    const e2 = C.entry(HW, HD) || {}, d2 = ddText();
    cj.push(['move-fixed-mins', e2.run_mins === '15.50' && /^\d+\.\d\d$/.test(e2.run_mins), 'fixed 0:15:00 -> 0:15:30: stored run_mins ' + J(e2.run_mins) + ' (want "15.50", two decimals)']);
    const dd = tryv(() => C.ev('doseDerived')(DOSES.time, { mins:e2.run_mins, dist:e2.run_dist }));
    cj.push(['move-derived', d2.includes(pace(15.5, 2)) && !/assuming/.test(d2) && e2.run_pace === pace(15.5, 2) && dd && Math.round(dd.sec) === 465, 'derived "' + d2 + '", stored run_pace ' + J(e2.run_pace) + ', doseDerived(stored).sec ' + (dd && dd.sec) + ' (want ' + pace(15.5, 2) + ' = 465 s, no assuming)']);
  });
  step('move-dist', () => {
    C.ctx.__FORCE = DOSES.dist; C.setLog(HW, HD, null); C.open(HW, HD); const ws = need('log_run_dist');
    C.move(ws, 1, '2'); C.move(ws, 2, '5');
    const e = C.entry(HW, HD) || {};
    cj.push(['move-fixed-mi', e.run_dist === '8.25', 'fixed 8.00 -> 8.25: stored run_dist ' + J(e.run_dist) + ' (want "8.25")']);
  });
  step('move-back', () => {
    C.ctx.__FORCE = DOSES.dist; C.setLog(HW, HD, null); C.open(HW, HD); const ws = need('log_run_dist');
    C.move(ws, 1, '5'); const a = (C.entry(HW, HD) || {}).run_dist; C.move(ws, 1, '0'); const b = (C.entry(HW, HD) || {}).run_dist;
    cj.push(['move-back', a === '8.50' && b === '8.00' && (C.INPUTS.log_run_dist || 0) === 2, 'away 8.50 then back to the seed face: stored ' + J(a) + ' then ' + J(b) + ', input events ' + (C.INPUTS.log_run_dist || 0) + ' (want "8.50", "8.00", 2)']);
  });
  step('move-seedonly', () => {
    C.ctx.__FORCE = DOSES.time; C.setLog(HW, HD, null); C.open(HW, HD);
    C.move(need('log_run_mins'), 1, '15'); C.move(need('log_run_mins'), 0, '0');
    const e = C.entry(HW, HD);
    cj.push(['move-seedonly', e === null && C.inputs() === 0, 'settles on the seed face 0:15:00 only: entry ' + J(e) + ', input events ' + C.inputs() + ' (want none, 0)']);
  });
  C.ctx.__FORCE = null;
  row('D202-move', cj);
}

// ── ROW D206-copy ────────────────────────────────────────────────────────────────────────────────────────────────
function rowCopy(){
  const cj = [verCj('copy')];
  for(const k of ['time', 'dist', 'reps_time']){ const s = SURV.hand[k + ' none']; if(!s){ cj.push(['copy-' + k, false, 'not surveyed']); continue; }
    const labels = s.f.labels.filter(l => l !== 'Reps completed');
    const good = J(labels) === J([COPY[k].label]) && J(s.f.subs) === J(COPY[k].subs) && J(s.f.caps) === J(COPY[k].caps);
    cj.push(['copy-' + k, good, 'label ' + J(labels) + ', sub-labels ' + J(s.f.subs) + ', caps ' + J(s.f.caps) + (good ? '' : ' (want ' + J([COPY[k].label]) + ', ' + J(COPY[k].subs) + ', ' + J(COPY[k].caps) + ')')]); }
  const all = [].concat(...['time', 'dist', 'reps_time'].map(k => { const s = SURV.hand[k + ' none']; return s ? s.f.labels.filter(l => l !== 'Reps completed').concat(s.f.subs) : []; }));
  const dashBad = all.filter(t => /—|–| - /.test(t));
  cj.push(['copy-dash', all.length > 0 && !dashBad.length, all.length + ' strings, with a mid-sentence dash: ' + J(dashBad)]);
  const fn = (CAND_TEXT.match(/function cardioFieldHTML\([\s\S]*?\n}\n/) || [''])[0].replace(/\/\/[^\n]*/g, '');
  cj.push(['copy-hours', fn.length > 0 && !/Hours first/.test(fn), 'cardioFieldHTML (comments stripped, ' + fn.length + ' chars) carries `Hours first`: ' + /Hours first/.test(fn)]);
  row('D206-copy', cj);
}

// ── ROW D199-width ───────────────────────────────────────────────────────────────────────────────────────────────
function rowWidth(){
  const cj = [verCj('width')];
  const css = CAND_TEXT.replace(/\/\*[\s\S]*?\*\//g, '');
  const m = css.match(/\.iaw-solo\{max-width:([\d.]+)px;?\}/g) || [];
  const v = m.length === 1 ? parseFloat(m[0].match(/max-width:([\d.]+)px/)[1]) : NaN;
  cj.push(['width-rule', m.length === 1 && Math.abs(v - W375) < 1e-9, m.length + ' `.iaw-solo{max-width:…px}` rule(s), value ' + v + ' (want 1 rule, (375 − 32 − 2 − 32 − 12) × 3/5 = ' + W375 + ')']);
  const miss = W_PREMISES.filter(s => css.split(s).length - 1 < 1);
  cj.push(['width-premises', !miss.length, (W_PREMISES.length - miss.length) + '/' + W_PREMISES.length + ' CSS premises of the derivation present' + (miss.length ? ' | missing ' + J(miss) : '')]);
  row('D199-width', cj);
}

// D-untouched (the V232 build pair: D199 to D206 moved no generic run, reps_dist, bike or swim markup against V231; HALF_MANNY era row 232) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).

const ROWS = { 'D199-spec':rowSpec, 'D200-rt':rowRt, 'D203':rowDec3, 'D199/D201/D204-forms':rowForms, 'D202-open':rowOpen, 'D202-move':rowMove, 'D206-copy':rowCopy, 'D199-width':rowWidth };
for(const k of ROW_ORDER){ try { ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
P('  timer errors in the candidate VM: ' + C.errs.length + (C.errs.length ? ' ' + J(C.errs.slice(0, 3)) : ''));
done();
