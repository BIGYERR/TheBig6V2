// g236_d218_logbutton.js — GATE for D218 (P-LOGBUTTON: the cardio card logs on a tap; the record, not the thumb, owns
// the number) and D219 (an untouched slider stores no RPE).
//
//   node tests/gates/g236_d218_logbutton.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v236_rulings/v236_ruling_d218_d219.md (CONCURRED by Mario 2026-10-08), section
// "Gate rows" (row names and claims), "Card states, before -> after", "Copy (exact)", and its "Session notes" (regime
// sport from the card; D218-reps on a forced reps dose through g232's __FORCE hook; the button reads Log / Logged ✓ on
// every sport and the bike toast is Ride logged ✓; the RPE marker is data-touched="1" on #log_rpe). Row keys are the
// licence file's: tests/measure/v236_rulings/v236_row_ruled.txt. D218/D219 Amendment 1 (the ruling file's foot) restates
// D218-log (a) and D219-counter (b), with D219 items 2 and 3 (c).
//
// ORACLES. Hand values typed here, never asked of the engine; engine output is compared only to these literals:
//   0:47:13 -> 47 + 13/60 = 47.2167 -> "47.22"; 0:50:00 -> "50.00"; bike 0:45:00 -> "45.00", Progress W1 45; swim typed
//   1500 -> "1500"; HALF_MANNY W1 sat Long Run 3.1 mi -> run_dist "3.1", run_pace 2833.2 s / 3.1 mi = 913.9 s/mi
//   "15:14/mi" (g235's hand values); reps_dist 6 x 400 m stepped to 7 -> run_reps "7", 2800 m / 1609.344 = 1.7398 mi ->
//   run_dist "1.74"; reps_time 6 x 3 min stepped to 7 -> run_reps "7", run_dist "" (no distance to derive); D219 RPE
//   7 -> "7", untouched -> "" (carried "" for a new entry), stored 7 carried "7"; the Average Session RPE for a week holding
//   one Done-untouched day and one RPE-7 day: 7 (the untouched day contributes nothing). Copy: Log, Logged ✓, Run logged ✓,
//   Ride logged ✓, Swim logged ✓, Nothing to log yet. (the ruling's "Copy (exact)").
//   D219-counter (Amendment 1 (b)): RPE_LABELS[7] "Very Hard" -> the journal line "RPE 7 — Very Hard"; a run swapped
//   to bike -> "Swapped Run → Bike"; HALF_MANNY W1 rests sun and wed (g000), so W1's other training days are mon, tue,
//   thu, fri, sat. The weekly session counter has no reader (m2) and is not a claim.
// The engine is used only to drive the app (buildProgram, openDayKey, the wheels' scroll settle, doseRep, logCardio,
// handleDayStatus, setCardioSwap, renderProgressScreen) and to read back what it rendered and stored.
//
// METHOD. The device path, g235_d215_hmszero.js's mkEnv (g233 lineage) with g232's __FORCE doseFromCardio hook: the
// harness VM, a DOM registry stub whose innerHTML parse makes the form's nodes real (value and data-* attributes), each
// wheel column's scrollTop setter dispatching scroll, and a virtual clock running the 90 ms settle, _iawCommit and the
// hidden input's 'input' event. The stub does not run inline on* attributes, so a slider move is driven in the browser's
// order: value set, the range's own oninput (updateRPEDisplay(value)), then 'input' to openDetail's listener. The stub
// keeps a number assigned to .value as a number (a browser coerces it), so run_reps is compared as String(). The Log
// button's label is its textContent once cardioLive has relabelled it, else the rendered markup's text. A "roll" sets the
// named columns inside one settle window; rollAt(ms) lets ms of the clock run before the next step (Done at 20 ms is
// inside the 90 ms window, at 200 ms after it).
//
// VERSION PREDICATE (standing rulings 2 and 4). D218 and D219 ship at ia-version 236, read from the candidate's meta.
//   below 236      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   236 and up     every row asserts (a minimum, never one exact version).
// On the V235 body relabelled 236 every row FAILS by its own conjuncts except D218-lift (the invariant row), which PASSES.
//
// ROWS (ids are the ruling's names)
//   D218-draft     W1 FRI (time form, plan 0:25:00) roll 0:47:13, settle: entry null, no ia_hist_ snapshot, hidden
//                  "47.22", face 0:47:13, button Log.
//   D218-log       (Amendment 1 (a)) W1 FRI, the time form (plan 25 min, no plan miles), after D218-draft's roll 0:47:13,
//                  the Log tap: run_mins "47.22", run_dist "", run_pace "" (the time form derives pace from miles and none
//                  were rolled), rpe "", ia_hist_ snapshot present, button Logged ✓, data-logged "1", toast Run logged ✓.
//                  W1 SAT, the dist form (plan 3.1 mi), fresh store, roll 0:47:13: entry null before the tap; the tap
//                  stores run_mins "47.22", run_dist "3.1" (the V148 plan stamp lands at the tap), run_pace "15:14/mi"
//                  (47.22 x 60 = 2833.2 s / 3.1 mi = 913.9 s, rounded to 914 s = 15:14), rpe "".
//   D218-live      after Log, roll 0:50:00: "50.00", no toast, button stays Logged ✓; roll 0:00:00: "", button Log,
//                  data-logged "0".
//   D218-empty     Log on an untouched W1 FRI: entry null, no ia_hist_ snapshot, toast Nothing to log yet.
//   D218-rpe-notes roll 0:47:13 then RPE 7: rpe "7", run_mins ""; then a note: rpe "7", run_mins "", the note stored.
//   D218-done      roll 0:47:13 then Done at 20 ms and at 200 ms: entry null before the tap, "47.22" and complete after;
//                  Skip the same (skipped); Done on an untouched card, reopen (button Log, data-logged "0"), roll 0:30:00,
//                  the undo tap: status null, run_mins "" (the undo tap commits no cardio).
//   D218-reopen    stored run_mins "47.22", open: button Logged ✓, data-logged "1", 0 input events, ia_logs_ unchanged,
//                  no ia_hist_ snapshot.
//   D218-bike      bike host (bike_base, the first bike day), roll 0:45:00: entry null; Log: bike_mins "45.00", toast
//                  Ride logged ✓, button Logged ✓; Progress Weekly Cycling Time W1 45.
//   D218-swim      swim host (swim_base, the first swim day), type 1, 15, 150, 1500: entry null, ia_logs_ unchanged; Log:
//                  swim_yards "1500", toast Swim logged ✓, button Logged ✓.
//   D218-reps      forced reps_dist (6 x 400 m) and reps_time (6 x 3 min) on W1 FRI: stepper +1, hidden 7, entry null;
//                  Log: run_reps "7", run_dist "1.74" (reps_dist) / "" (reps_time), toast Run logged ✓.
//   D218-chip      W1 SAT draft 0:47:13, chip Bike: swapTo "bike", no parked, run_mins ""; chip Run: the minutes wheel on
//                  0:00:00. Control: logged 0:47:13 (run_dist "3.1", run_pace "15:14/mi"), chip Bike: parked.run.run_mins
//                  "47.22", button Log; chip Run: run_mins "47.22" back at top, button Logged ✓.
//   D218-lift      W1 TUE (lift day): no #cardioLogBtn, no #cardioSwapWrap; RPE 7 autosaves rpe "7".
//   D218-copy      comment-stripped source: cardioLogLabel carries 'Logged ✓' and 'Log' (and returns them),
//                  CARDIO_LOGGED_TOAST is exactly {run:'Run logged ✓', bike:'Ride logged ✓', swim:'Swim logged ✓'} with
//                  the literal ✓ byte, logCardio carries 'Nothing to log yet.'; none of the six strings has a hyphen or an
//                  em-dash, none says Nike; Did a different activity?, Logged as, the nudge, Unmarked, Move slider still
//                  present.
//   D219-rpe       untouched + note: rpe ""; RPE moved to 7: "7" and data-touched "1"; reopen stored 7 + note: "7"; Done on
//                  an untouched card: rpe "".
//   D219-counter   (Amendment 1 (b)) the readers of a blank rpe, each read off a render or a store. chart: W1 FRI Done
//                  untouched, W1 SAT RPE 7, Average Session RPE W1 = 7. journal-skip: the same render's Session Journal
//                  W1 holds one entry, Sat, "RPE 7 — Very Hard", no Fri. journal-swap: fresh, W1 SAT chip Bike, no RPE,
//                  no note: W1 holds Sat with "Swapped Run → Bike" and no RPE line (D219 item 3). rest-move: fresh, W1 FRI
//                  roll 0:47:13, Log, no RPE, no Done: restMoveCandidates(1) is mon, tue, thu, sat (fri excluded, D219
//                  item 2); W1 FRI Done untouched: fri excluded on its completion.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const S = require('../status')('g236_d218_logbutton');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 236;
const t0 = Date.now();
const J = JSON.stringify;

const LABEL = {
  'D218-draft':     'D218-draft (VER >= 236) W1 FRI roll 0:47:13: entry null, no snapshot, hidden 47.22, face 0:47:13, button Log',
  'D218-log':       'D218-log (VER >= 236) the Log tap: W1 FRI time form stores 47.22 with pace and rpe blank, snapshot, Logged ✓, toast Run logged ✓; W1 SAT dist form stores 47.22, 3.1, 15:14/mi',
  'D218-live':      'D218-live (VER >= 236) after Log a roll to 0:50:00 saves 50.00 quietly, Logged ✓ stays; 0:00:00 stores blank, button Log',
  'D218-empty':     'D218-empty (VER >= 236) Log on an untouched card writes nothing, toast Nothing to log yet.',
  'D218-rpe-notes': 'D218-rpe-notes (VER >= 236) a rolled draft then RPE 7 and a note: rpe 7, run_mins blank',
  'D218-done':      'D218-done (VER >= 236) Done and Skip at 20 ms and 200 ms commit the rolled card (entry null before the tap); the undo tap commits no cardio',
  'D218-reopen':    'D218-reopen (VER >= 236) a stored run opens Logged ✓, data-logged 1, writing nothing',
  'D218-bike':      'D218-bike (VER >= 236) bike 0:45:00 stores nothing until Log, then 45.00, Ride logged ✓, Progress W1 45',
  'D218-swim':      'D218-swim (VER >= 236) swim typed 1, 15, 150, 1500 writes nothing; Log stores 1500, Swim logged ✓',
  'D218-reps':      'D218-reps (VER >= 236) forced reps doses: a stepper step writes nothing; Log stores run_reps 7 and the derived run_dist by hand',
  'D218-chip':      'D218-chip (VER >= 236) a draft is not parked by the chip; a logged run is (D213 control)',
  'D218-lift':      'D218-lift (VER >= 236) a lift day has no Log button and RPE autosaves (invariant row)',
  'D218-copy':      'D218-copy (VER >= 236) the D218 strings exact in the comment-stripped source, no hyphen or em-dash, no Nike',
  'D219-rpe':       'D219-rpe (VER >= 236) an untouched slider stores blank, a moved one its value, a stored 7 is carried',
  'D219-counter':   'D219-counter (VER >= 236) the readers of a blank rpe: Average Session RPE, the journal skip, the journal swap line, the rest-move list',
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const TAIL = '47.22';                         // 0:47:13 = 47 + 13/60 = 47.2167
const FIFTY = '50.00', BIKE45 = '45.00', YARDS = '1500';
const SAT_DIST = '3.1', SAT_PACE = '15:14/mi'; // HALF_MANNY W1 sat Long Run 3.1 mi; 2833.2 s / 3.1 mi = 913.9 s/mi
const REPS_DIST = { k:'reps_dist', reps:6, m:400, tgt:480 }, REPS_TIME = { k:'reps_time', reps:6, mins:3, tgt:480 };
const REPS_DIST_MI = '1.74';                  // 7 x 400 m = 2800 m / 1609.344 = 1.7398 mi
const COPY = { log:'Log', logged:'Logged ✓', run:'Run logged ✓', bike:'Ride logged ✓', swim:'Swim logged ✓', empty:'Nothing to log yet.' };
const KEEP = ['Did a different activity?', 'Logged as', 'You logged this one but never marked it.', "'Unmarked'", 'Move slider'];
const RPE7_LINE = 'RPE 7 — Very Hard';             // RPE_LABELS[7]
const SWAP_LINE = 'Swapped Run → Bike';
const W1_OTHERS = ['mon', 'tue', 'thu', 'sat'];       // W1 training days but fri (rest sun, wed)
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM ? +VM[1] : 0;
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
S.info('g236 D218-D219 P-LOGBUTTON | candidate ' + ART + ' ia-version ' + VER);
if(!(VER >= ERA)) S.info('REFUSED: ia-version ' + VER + ' predates D218 / D219 (V' + ERA + '). Every row runs and FAILS by its version conjunct.');

// ── ENV (g235_d215_hmszero.js mkEnv, g233 lineage, plus g232's __FORCE hook; program id g236) ───────────────────────
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
  ev('var __realDFC=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE || __realDFC(c); };');   // g232's hook
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'g236'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="g236"; currentWeek=1; progressViewId=null;'); ev("showScreen('screenWeek')"); return q; };
  E.logs = () => LS.getItem('ia_logs_g236') || '{}';
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;
  E.setLog = (w, d, entry) => { const L = JSON.parse(E.logs()); if(entry == null) delete L['w' + w + '_' + d]; else L['w' + w + '_' + d] = entry; LS.setItem('ia_logs_g236', J(L)); };
  E.hist = (w, d) => !!JSON.parse(LS.getItem('ia_hist_g236') || '{}')['w' + w + '_' + d];
  E.wipe = () => { [...LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => LS.removeItem(k)); };
  E.open = (w, d) => { ev('currentWeek=' + w + ';'); els.detailOverlay.classList.remove('open'); els.detailBody.innerHTML = '';
    for(const k in INPUTS) delete INPUTS[k]; ev("openDayKey('" + d + "')"); advance(500); };
  E.inputs = () => Object.values(INPUTS).reduce((a, b) => a + b, 0);
  E.face = wh => { const f = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.face : '?'; }); return wh.kind === 'hms' ? f.join(':') : f.join(''); };
  E.wheel = hid => WHEELS.find(w => w.hid === hid) || null;
  E.need = hid => { const w = E.wheel(hid); if(!w) throw new Error('no wheel for ' + hid + ' on the rendered form'); return w; };
  // Set every named column inside ONE settle window, then let `ms` of the clock run: the athlete's "roll, let go".
  E.rollAt = (wh, pairs, ms) => { for(const [ci, v] of pairs){ const c = wh._cols[ci], cur = Math.round(c.scrollTop / 44); let best = -1;
      for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
      if(best < 0) throw new Error('no row ' + J(v) + ' in column ' + ci); c.scrollTop = best * 44; }
    advance(ms); };
  E.roll = (wh, pairs) => E.rollAt(wh, pairs, 500);
  E.tap = (d, s) => { ev("handleDayStatus('" + d + "','x','" + s + "')"); advance(500); };
  E.status = (w, d) => ev("statusOf(" + w + ",'" + d + "')");
  // The Log tap. On a tree with no logCardio the tap is a no-op, so a row fails by its own conjuncts, not by a crash.
  E.log = () => { if(ev('typeof logCardio') !== 'function') return false; ev('logCardio()'); advance(50); return true; };
  E.toast = () => els.toast.innerHTML;
  E.clearToast = () => { els.toast.innerHTML = ''; };
  E.btnMarkup = () => (els.detailBody.innerHTML.match(/<button[^>]*\sid="cardioLogBtn"[^>]*>([^<]*)<\/button>/) || [])[1];
  E.label = () => { const b = els.cardioLogBtn; return (b && b.textContent) || E.btnMarkup() || ''; };
  E.logged = () => els.cardioSwapWrap ? els.cardioSwapWrap.dataset.logged : undefined;
  // a slider move, in the browser's order: value, the range's own oninput, then openDetail's 'input' listener
  E.rpe = v => { els.log_rpe.value = v; if(ev('typeof updateRPEDisplay') === 'function') ev('updateRPEDisplay')(v); els.log_rpe.dispatchEvent({ type:'input' }); advance(50); };
  E.note = v => { els.log_notes.value = v; els.log_notes.dispatchEvent({ type:'input' }); advance(50); };
  E.type = (id, v) => { els[id].value = v; els[id].dispatchEvent({ type:'input' }); advance(50); };
  E.chart = (title, w) => { ctx.__dots.length = 0; ev('renderProgressScreen')();
    for(const a of ctx.__dots){ if(String(a[0]).indexOf(title) < 0) continue; const wk = Array.from(a[1]), dat = Array.from(a[2]); return { drawn:true, v:dat[wk.indexOf(w)] }; }
    return { drawn:false, v:undefined }; };
  return E;
}
function mkCfg(sports, f, ex, eq, sd){   // g233_d207_bikewheel.js's lattice shape
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}

// ── conjunct rows ────────────────────────────────────────────────────────────────────────────────────────────────────
const row = (id, cj, extra) => {
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) S.info(id + ' ' + (c[1] ? 'ok  ' : 'BAD ') + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id] + (extra ? ' [' + extra + ']' : ''), bad.map(c => c[0] + ': ' + c[2]).slice(0, 4).join('; '));
};
const guard = (id, fn) => { try { fn(); } catch(e){ row(id, [verCj(id), ['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]); } };

const C = mkEnv(ART);
const HALF = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)));
const hostOf = (cfg, sport) => { const p = C.IA.buildProgram(cfg);
  for(let w = 1; w <= (p.totalWeeks || 20); w++) for(const d of DAYS){ const x = p.weeks[w] && p.weeks[w][d];
    if(x && !x.rest && x.cardio && !Array.isArray(x.cardio) && (x.cardio.type || '').toLowerCase() === sport) return { p, w, d }; }
  throw new Error('no ' + sport + ' host day in ' + cfg.cardioGoals[sport].id); };
const fresh = () => { C.use(HALF); C.ctx.__FORCE = null; };
const pick = (e, ks) => e && Object.fromEntries(ks.map(k => [k, e[k]]));

// ── D218-draft / D218-log (each from an empty store: roll, settle; then the Log tap) ────────────────────────────────
guard('D218-draft', () => {
  fresh(); C.open(1, 'fri'); const wh = C.need('log_run_mins'); const seed = C.face(wh);
  C.roll(wh, [[1, '47'], [2, '13']]);
  const e = C.entry(1, 'fri');
  row('D218-draft', [verCj('D218-draft'),
    ['entry', e === null, 'entry ' + J(e) + ' (hand null)'],
    ['hist', !C.hist(1, 'fri'), 'ia_hist_ w1_fri ' + C.hist(1, 'fri') + ' (hand false)'],
    ['hidden', C.els.log_run_mins.value === TAIL, 'hidden ' + J(C.els.log_run_mins.value) + ' (hand "47.22")'],
    ['face', C.face(wh) === '0:47:13', 'seed ' + seed + ', face ' + C.face(wh) + ' (hand 0:47:13)'],
    ['button', C.label() === COPY.log, 'button ' + J(C.label()) + ' (hand "Log")']]);
});
guard('D218-log', () => {
    fresh(); C.open(1, 'fri'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
    C.clearToast(); const tapped = C.log(); const L = C.entry(1, 'fri') || {};
    row('D218-log', [verCj('D218-log'),
      ['tap', tapped, 'logCardio ' + (tapped ? 'present' : 'ABSENT')],
      ['run_mins', L.run_mins === TAIL, 'run_mins ' + J(L.run_mins) + ' (hand "47.22")'],
      ['run_dist', L.run_dist === '', 'run_dist ' + J(L.run_dist) + ' (hand "")'],
      ['rpe', L.rpe === '', 'rpe ' + J(L.rpe) + ' (hand "", D219)'],
      ['hist', C.hist(1, 'fri'), 'ia_hist_ w1_fri ' + C.hist(1, 'fri') + ' (hand true)'],
      ['button', C.label() === COPY.logged && C.logged() === '1', 'button ' + J(C.label()) + ', data-logged ' + J(C.logged()) + ' (hand "Logged ✓", "1")'],
      ['toast', C.toast() === COPY.run, 'toast ' + J(C.toast()) + ' (hand "Run logged ✓")'],
      ['run_pace', L.run_pace === '', 'W1 FRI time form run_pace ' + J(L.run_pace) + ' (hand "": no miles rolled, Amendment 1 (a))']].concat(satLog()));
});
// D218/D219 Amendment 1 (a): W1 SAT, the dist form (plan 3.1 mi), fresh store, roll 0:47:13, then the Log tap.
function satLog(){
  fresh(); C.open(1, 'sat'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  const pre = C.entry(1, 'sat'); const tapped = C.log(); const T = C.entry(1, 'sat') || {};
  return [['sat-pre', pre === null, 'W1 SAT roll 0:47:13: entry before the tap ' + J(pre) + ' (hand null)'],
    ['sat-tap', tapped && T.run_mins === TAIL && T.run_dist === SAT_DIST && T.run_pace === SAT_PACE && T.rpe === '',
      'W1 SAT Log: run_mins ' + J(T.run_mins) + ', run_dist ' + J(T.run_dist) + ', run_pace ' + J(T.run_pace) + ', rpe ' + J(T.rpe) + ' (hand "47.22", "3.1", "15:14/mi", "")']];
}

// ── D218-live ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-live', () => {
  fresh(); C.open(1, 'fri'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]); const tapped = C.log(); const L0 = (C.entry(1, 'fri') || {}).run_mins;
  C.clearToast(); C.roll(C.need('log_run_mins'), [[1, '50'], [2, '0']]);
  const a = (C.entry(1, 'fri') || {}).run_mins, ta = C.toast(), la = C.label();
  C.roll(C.need('log_run_mins'), [[1, '0']]);
  const b = (C.entry(1, 'fri') || {}).run_mins, lb = C.label(), gb = C.logged(), fb = C.face(C.need('log_run_mins'));
  row('D218-live', [verCj('D218-live'),
    ['logged', tapped && L0 === TAIL, 'Log tap ' + tapped + ', run_mins ' + J(L0) + ' (hand true, "47.22")'],
    ['fifty', a === FIFTY && ta === '' && la === COPY.logged, '0:50:00 -> run_mins ' + J(a) + ', toast ' + J(ta) + ', button ' + J(la) + ' (hand "50.00", "", "Logged ✓")'],
    ['zero', b === '' && lb === COPY.log && gb === '0', fb + ' -> run_mins ' + J(b) + ', button ' + J(lb) + ', data-logged ' + J(gb) + ' (hand "", "Log", "0")']]);
});

// ── D218-empty ───────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-empty', () => {
  fresh(); C.open(1, 'fri'); C.clearToast(); const tapped = C.log(); const e = C.entry(1, 'fri');
  row('D218-empty', [verCj('D218-empty'),
    ['tap', tapped, 'logCardio ' + (tapped ? 'present' : 'ABSENT')],
    ['entry', e === null && !C.hist(1, 'fri'), 'entry ' + J(e) + ', ia_hist_ ' + C.hist(1, 'fri') + ' (hand null, false)'],
    ['toast', C.toast() === COPY.empty, 'toast ' + J(C.toast()) + ' (hand "Nothing to log yet.")']]);
});

// ── D218-rpe-notes ───────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-rpe-notes', () => {
  fresh(); C.open(1, 'fri'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.rpe('7'); const a = C.entry(1, 'fri') || {};
  C.note('felt easy'); const b = C.entry(1, 'fri') || {};
  row('D218-rpe-notes', [verCj('D218-rpe-notes'),
    ['rpe', a.rpe === '7' && a.run_mins === '', 'after RPE 7: rpe ' + J(a.rpe) + ', run_mins ' + J(a.run_mins) + ' (hand "7", "")'],
    ['note', b.rpe === '7' && b.run_mins === '' && b.notes === 'felt easy', 'after a note: rpe ' + J(b.rpe) + ', run_mins ' + J(b.run_mins) + ', notes ' + J(b.notes) + ' (hand "7", "", "felt easy")']]);
});

// ── D218-done ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-done', () => {
  const cj = [verCj('D218-done')];
  for(const [s, want] of [['complete', 'complete'], ['skipped', 'skipped']]) for(const ms of [20, 200]){
    fresh(); C.open(1, 'fri'); C.rollAt(C.need('log_run_mins'), [[1, '47'], [2, '13']], ms);
    const pre = C.entry(1, 'fri'); C.tap('fri', s); const e = C.entry(1, 'fri') || {}, st = C.status(1, 'fri');
    cj.push([s + '-' + ms, pre === null && e.run_mins === TAIL && st === want, 'roll 0:47:13, ' + s + ' at ' + ms + ' ms: before ' + J(pre) + ', after run_mins ' + J(e.run_mins) + ', status ' + J(st) + ' (hand null, "47.22", ' + J(want) + ')']);
  }
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); const blank = C.entry(1, 'fri') || {};
  C.open(1, 'fri'); const lb = C.label(), gb = C.logged();
  C.roll(C.need('log_run_mins'), [[1, '30']]); const pre = (C.entry(1, 'fri') || {}).run_mins;
  C.tap('fri', 'complete'); const e = C.entry(1, 'fri') || {}, st = C.status(1, 'fri');
  cj.push(['untouched', blank.run_mins === '' && blank.rpe === '' && lb === COPY.log && gb === '0', 'Done untouched: run_mins ' + J(blank.run_mins) + ', rpe ' + J(blank.rpe) + '; reopen button ' + J(lb) + ', data-logged ' + J(gb) + ' (hand "", "", "Log", "0")']);
  cj.push(['undo', pre === '' && st === null && e.run_mins === '' && C.els.log_run_mins.value === '30.00', 'roll 0:30:00 on the reopened Done day, undo tap: run_mins before ' + J(pre) + ', after ' + J(e.run_mins) + ', status ' + J(st) + ', hidden ' + J(C.els.log_run_mins.value) + ' (hand "", "", null, "30.00")']);
  row('D218-done', cj);
});

// ── D218-reopen ──────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-reopen', () => {
  fresh(); C.setLog(1, 'fri', { rpe:'7', run_mins:TAIL, run_dist:'', notes:'' }); const before = C.logs();
  C.open(1, 'fri');
  row('D218-reopen', [verCj('D218-reopen'),
    ['button', C.label() === COPY.logged && C.logged() === '1', 'button ' + J(C.label()) + ', data-logged ' + J(C.logged()) + ' (hand "Logged ✓", "1")'],
    ['face', C.face(C.need('log_run_mins')) === '0:47:13', 'face ' + C.face(C.need('log_run_mins')) + ' (hand 0:47:13)'],
    ['nothing-written', C.inputs() === 0 && C.logs() === before && !C.hist(1, 'fri'), C.inputs() + ' input events, ia_logs_ ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ', ia_hist_ ' + C.hist(1, 'fri') + ' (hand 0, unchanged, false)']]);
});

// ── D218-bike ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-bike', () => {
  const B = hostOf(mkCfg([['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 24865), 'bike');
  C.use(B.p); C.ctx.__FORCE = null; C.open(B.w, B.d); const l0 = C.label();
  C.roll(C.need('log_bike_mins'), [[1, '45']]); const pre = C.entry(B.w, B.d), hid = C.els.log_bike_mins.value;
  C.clearToast(); const tapped = C.log(); const e = C.entry(B.w, B.d) || {}; const ch = C.chart('Weekly Cycling Time', B.w);
  row('D218-bike', [verCj('D218-bike'),
    ['draft', l0 === COPY.log && pre === null && hid === BIKE45, 'W' + B.w + ' ' + B.d + ': button ' + J(l0) + ', roll 0:45:00: entry ' + J(pre) + ', hidden ' + J(hid) + ' (hand "Log", null, "45.00")'],
    ['log', tapped && e.bike_mins === BIKE45 && C.toast() === COPY.bike && C.label() === COPY.logged, 'Log: bike_mins ' + J(e.bike_mins) + ', toast ' + J(C.toast()) + ', button ' + J(C.label()) + ' (hand "45.00", "Ride logged ✓", "Logged ✓")'],
    ['progress', ch.drawn && +ch.v === 45, 'Weekly Cycling Time W' + B.w + ' ' + J(ch.v) + ' (hand 45)']]);
});

// ── D218-swim ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-swim', () => {
  const W = hostOf(mkCfg([['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', 24865), 'swim');
  C.use(W.p); C.ctx.__FORCE = null; C.open(W.w, W.d); const before = C.logs();
  for(const v of ['1', '15', '150', YARDS]) C.type('log_swim_yards', v);
  const pre = C.entry(W.w, W.d), same = C.logs() === before;
  C.clearToast(); const tapped = C.log(); const e = C.entry(W.w, W.d) || {};
  row('D218-swim', [verCj('D218-swim'),
    ['typed', pre === null && same, 'W' + W.w + ' ' + W.d + ' typed 1, 15, 150, 1500: entry ' + J(pre) + ', ia_logs_ ' + (same ? 'unchanged' : 'CHANGED') + ' (hand null, unchanged)'],
    ['log', tapped && e.swim_yards === YARDS && C.toast() === COPY.swim && C.label() === COPY.logged, 'Log: swim_yards ' + J(e.swim_yards) + ', toast ' + J(C.toast()) + ', button ' + J(C.label()) + ' (hand "1500", "Swim logged ✓", "Logged ✓")']]);
});

// ── D218-reps (Session notes: forced reps doses through g232's __FORCE hook) ────────────────────────────────────────
guard('D218-reps', () => {
  const cj = [verCj('D218-reps')];
  for(const [D, dist] of [[REPS_DIST, REPS_DIST_MI], [REPS_TIME, '']]){
    fresh(); C.ctx.__FORCE = D; C.open(1, 'fri');
    C.ev('doseRep(1)'); C.advance(50); const hid = C.els.log_run_reps.value, pre = C.entry(1, 'fri');
    C.clearToast(); const tapped = C.log(); const e = C.entry(1, 'fri') || {};
    cj.push([D.k + '-step', String(hid) === '7' && pre === null, D.k + ' stepper +1: hidden ' + J(hid) + ', entry ' + J(pre) + ' (hand 7, null)']);
    cj.push([D.k + '-log', tapped && String(e.run_reps) === '7' && e.run_dist === dist && C.toast() === COPY.run, 'Log: run_reps ' + J(e.run_reps) + ', run_dist ' + J(e.run_dist) + ', toast ' + J(C.toast()) + ' (hand "7", ' + J(dist) + ', "Run logged ✓")']);
  }
  C.ctx.__FORCE = null;
  row('D218-reps', cj);
});

// ── D218-chip ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-chip', () => {
  const cj = [verCj('D218-chip')];
  fresh(); C.open(1, 'sat'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.ev("setCardioSwap('bike')"); C.advance(500); const a = C.entry(1, 'sat') || {};
  cj.push(['draft-bike', a.swapTo === 'bike' && !a.parked && a.run_mins === '', 'draft 0:47:13, chip Bike: swapTo ' + J(a.swapTo) + ', parked ' + J(a.parked) + ', run_mins ' + J(a.run_mins) + ' (hand "bike", none, "")']);
  C.ev("setCardioSwap('run')"); C.advance(500); const f = C.face(C.need('log_run_mins'));
  cj.push(['draft-run', f === '0:00:00', 'chip Run: minutes face ' + f + ' (hand 0:00:00)']);
  fresh(); C.open(1, 'sat'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]); const tapped = C.log(); const L = C.entry(1, 'sat') || {};
  cj.push(['control-log', tapped && L.run_mins === TAIL && L.run_dist === SAT_DIST && L.run_pace === SAT_PACE, 'Log: run_mins ' + J(L.run_mins) + ', run_dist ' + J(L.run_dist) + ', run_pace ' + J(L.run_pace) + ' (hand "47.22", "3.1", "15:14/mi")']);
  C.ev("setCardioSwap('bike')"); C.advance(500); const b = C.entry(1, 'sat') || {}, lb = C.label();
  cj.push(['control-bike', !!b.parked && !!b.parked.run && b.parked.run.run_mins === TAIL && lb === COPY.log, 'chip Bike: parked.run.run_mins ' + J(b.parked && b.parked.run && b.parked.run.run_mins) + ', button ' + J(lb) + ' (hand "47.22", "Log")']);
  C.ev("setCardioSwap('run')"); C.advance(500); const r = C.entry(1, 'sat') || {}, lr = C.label();
  cj.push(['control-run', r.run_mins === TAIL && !r.parked && lr === COPY.logged, 'chip Run: run_mins ' + J(r.run_mins) + ', parked ' + J(r.parked) + ', button ' + J(lr) + ' (hand "47.22", none, "Logged ✓")']);
  row('D218-chip', cj);
});

// ── D218-lift (invariant row) ────────────────────────────────────────────────────────────────────────────────────────
guard('D218-lift', () => {
  fresh(); C.open(1, 'tue'); const body = C.els.detailBody.innerHTML;
  C.rpe('7'); const e = C.entry(1, 'tue') || {};
  row('D218-lift', [verCj('D218-lift'),
    ['no-button', body.length > 0 && !/id="cardioLogBtn"/.test(body) && !/id="cardioSwapWrap"/.test(body), 'W1 TUE markup ' + body.length + ' chars, #cardioLogBtn ' + /id="cardioLogBtn"/.test(body) + ', #cardioSwapWrap ' + /id="cardioSwapWrap"/.test(body) + ' (hand false, false)'],
    ['rpe', e.rpe === '7', 'RPE 7: rpe ' + J(e.rpe) + ' (hand "7")']]);
});

// ── D218-copy ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D218-copy', () => {
  const cj = [verCj('D218-copy')];
  const src = stripComments(HTML);
  const body = name => { const i = src.indexOf(name); if(i < 0) return ''; const j = src.indexOf('\n}', i); return src.slice(i, j < 0 ? i + 600 : j + 2); };
  const lab = body('function cardioLogLabel('), lc = body('function logCardio(');
  const toastDecl = (src.match(/var CARDIO_LOGGED_TOAST=\{[^}]*\};/) || [''])[0];
  cj.push(['label-src', lab.includes("'" + COPY.logged + "'") && lab.includes("'" + COPY.log + "'"), 'cardioLogLabel ' + (lab ? 'carries ' + J(lab.slice(0, 120)) : 'ABSENT')]);
  const fn = C.ev('typeof cardioLogLabel') === 'function' ? C.ev('cardioLogLabel') : null;
  cj.push(['label-run', !!fn && fn(true) === COPY.logged && fn(false) === COPY.log, 'cardioLogLabel(true) ' + J(fn && fn(true)) + ', (false) ' + J(fn && fn(false)) + ' (hand "Logged ✓", "Log")']);
  const want = "var CARDIO_LOGGED_TOAST={run:'" + COPY.run + "',bike:'" + COPY.bike + "',swim:'" + COPY.swim + "'};";
  cj.push(['toast-src', toastDecl === want, 'source ' + J(toastDecl) + ' (hand ' + J(want) + ')']);
  cj.push(['empty-src', lc.includes("showToast('" + COPY.empty + "')"), 'logCardio ' + (lc ? (lc.includes(COPY.empty) ? 'carries' : 'LACKS') + ' "Nothing to log yet."' : 'ABSENT')]);
  const all = Object.values(COPY);
  const dirty = all.filter(s => /[-—]/.test(s) || /nike/i.test(s));
  cj.push(['clean', dirty.length === 0 && !/\\u2713/.test(lab + toastDecl), 'hyphen, em-dash or Nike in ' + J(dirty) + '; escaped check mark in the new sources ' + /\\u2713/.test(lab + toastDecl) + ' (hand [], false)']);
  const gone = KEEP.filter(s => !src.includes(s));
  cj.push(['unchanged', gone.length === 0, 'kept copy missing ' + J(gone) + ' (hand [])']);
  row('D218-copy', cj);
});

// ── D219-rpe ─────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D219-rpe', () => {
  const cj = [verCj('D219-rpe')];
  fresh(); C.open(1, 'fri'); C.note('easy'); let e = C.entry(1, 'fri') || {};
  cj.push(['untouched', e.rpe === '' && e.notes === 'easy', 'untouched + note: rpe ' + J(e.rpe) + ', notes ' + J(e.notes) + ' (hand "", "easy")']);
  C.rpe('7'); e = C.entry(1, 'fri') || {};
  cj.push(['moved', e.rpe === '7' && C.els.log_rpe.dataset.touched === '1', 'RPE 7: rpe ' + J(e.rpe) + ', data-touched ' + J(C.els.log_rpe.dataset.touched) + ' (hand "7", "1")']);
  C.open(1, 'fri'); const t0r = C.els.log_rpe.dataset.touched; C.note('easy, legs fine'); e = C.entry(1, 'fri') || {};
  cj.push(['carried', e.rpe === '7' && e.notes === 'easy, legs fine' && t0r === undefined, 'reopen stored 7 (data-touched ' + J(t0r) + ') + note: rpe ' + J(e.rpe) + ' (hand undefined, "7")']);
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); e = C.entry(1, 'fri') || {};
  cj.push(['done', e.rpe === '' && C.status(1, 'fri') === 'complete', 'Done untouched: rpe ' + J(e.rpe) + ', status ' + J(C.status(1, 'fri')) + ' (hand "", "complete")']);
  row('D219-rpe', cj);
});

// ── D219-counter ─────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D219-counter', () => {
  const cj = [verCj('D219-counter')];
  // W1 of the rendered Session Journal: its day names and its text
  const week1 = () => { const h = String(C.els.progressBody.innerHTML || ''); const i = h.indexOf('Session Journal');
    const blocks = i < 0 ? [] : (h.slice(i).match(/<details class="journal-week"[^>]*>[\s\S]*?<\/details>/g) || []);
    const b = blocks.find(x => x.includes('<span>Week 1</span>')) || '';
    return { found:i >= 0, days:(b.match(/color:var\(--text\)">(Sun|Mon|Tue|Wed|Thu|Fri|Sat)<\/div>/g) || []).map(s => s.slice(-9, -6)),
      text:b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }; };
  // chart and journal-skip: one render over W1 FRI Done untouched and W1 SAT RPE 7
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); C.open(1, 'sat'); C.rpe('7');
  const ch = C.chart('Average Session RPE', 1); const j1 = week1();
  cj.push(['chart', ch.drawn && +ch.v === 7, 'Average Session RPE W1 ' + J(ch.v) + ' (hand 7)']);
  cj.push(['journal-skip', J(j1.days) === J(['Sat']) && j1.text.includes(RPE7_LINE), 'journal W1 days ' + J(j1.days) + ', text ' + J(j1.text.slice(0, 140)) + ' (hand ["Sat"], ' + J(RPE7_LINE) + ', no Fri)']);
  // journal-swap: fresh, W1 SAT chip Bike, nothing else
  fresh(); C.open(1, 'sat'); C.ev("setCardioSwap('bike')"); C.advance(500); C.ev('renderProgressScreen()'); const j2 = week1();
  cj.push(['journal-swap', J(j2.days) === J(['Sat']) && j2.text.includes(SWAP_LINE) && !/RPE \d/.test(j2.text), 'swap-only W1: journal ' + (j2.found ? 'present' : 'ABSENT') + ', days ' + J(j2.days) + ', text ' + J(j2.text.slice(0, 140)) + ' (hand ["Sat"], ' + J(SWAP_LINE) + ', no RPE line)']);
  // rest-move: a Log-tapped time form with no RPE, no note, no Done; then a Done-untouched FRI
  fresh(); C.open(1, 'fri'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]); const tapped = C.log();
  const off1 = Array.from(C.ev('restMoveCandidates(1)')).map(c => c.day);
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); const off2 = Array.from(C.ev('restMoveCandidates(1)')).map(c => c.day);
  cj.push(['rest-move', tapped && J(off1) === J(W1_OTHERS) && !off2.includes('fri'), 'Log tap ' + tapped + ', offered after the Log ' + J(off1) + ', after Done untouched ' + J(off2) + ' (hand true, ' + J(W1_OTHERS) + ', no fri)']);
  row('D219-counter', cj);
});

if(C.errs.length) S.info('timer errors ' + C.errs.length + ': ' + C.errs.slice(0, 3).join(' | '));
S.info('g236 wall ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
S.summary();
