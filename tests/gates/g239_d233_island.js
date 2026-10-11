'use strict';
// g239_d233_island.js: GATE for D233 P-ISLAND (the rest stopwatch is mirrored on the iPhone Dynamic Island, native app only).
//
//   node tests/gates/g239_d233_island.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v239_rulings/v239_ruling_d233.md, R1 as amended by "Mario's concurrence"
// (inside the native app, window.iaIsland present, the clock is Date.now and the island is told every seam; on the PWA
// the stopwatch is V238's: performance.now, no notifier call), R2, R3 and the after-table. Row names and the clause each
// defends: the ruling's "Gate rows" section and tests/measure/v239_rulings/v239_row_ruled.txt (12 rows, same ids).
// JS contract with the plugin (fixed by the brief, implemented by the native slices): run(startEpochMs), stop(elapsedMs),
// end(), all fire-and-forget; a throw never breaks the stopwatch.
// Sabotage: tests/sabotage/v239_d233.json, each mutation naming the row here it trips.
//
// ORACLES. Never the engine. (1) A stub window.iaIsland whose run/stop/end push [name, arg] onto a call log (end with no
// argument). (2) Two independent fake clocks the gate moves by hand: Date (FD.now) and performance (performance.now). Every
// step moves them by DIFFERENT amounts, so the clock the stopwatch follows is read off its value: PWA rows move Date by
// 600000 ms (10:00) and performance by the value under test; native rows the reverse. (3) A third clock, the scheduler's,
// runs the 33 ms tick and the day-open timers and moves neither fake clock, so the tab reads exactly the hand value.
// Hand values: 92340 ms reads m:ss 1:32, centiseconds .34 (92340 / 1000 = 92 s = 1 min 32 s; floor(92340 / 10) mod 100
// = 34); 93340 ms reads 1:33; 0 reads 0:00. The start epoch is the gate's own fake Date at the tap, D0 = 10:00 local on
// the day under test (dateOf below, a RealDate built from the calendar, never read back from the VM). Resume after a stop
// at 92340 with Date moved 5000 more: now = D0 + 97340, run(now - 92340) = run(D0 + 5000).
// The stopwatch's state (_ruRunning, _ruElapsed, _ruStart) is `let` and is read only through _ruNow() and the call log;
// the tab through the retaining DOM stub (#rtMini stripped of tags, #rtBig, #rtCs, #rtToggle, #restFloat display).
//
// SEAMS (the real ones): the tab buttons rtToggleBtn / rtResetBtn; the day open openDayKey -> openDetail (its
// ruResetIfIdle); the status setter handleDayStatus (its ruReset, V221 D179), driven as g221 drives it; showScreen for
// Home and the wizard; a fresh page load for D233-boot. HALF_MANNY (seed pinned) stored as program 'measure' with a Monday
// start, as g221 stores it; the day under test is W1's first training day.
// PRE-BOOT PATH. tests/harness.js load() has no pre-boot hook. D233-boot (and D233-throw's boot arm) wrap vm.runInContext
// for exactly one call, the one carrying the page script (it holds the harness's globalThis.__IA shim), set iaIsland on
// that context first, then restore vm.runInContext. harness.js is not edited.
//
// VERSION PREDICATE (standing rulings 2 and 4). D233 ships at ia-version 239, read from the candidate's meta.
//   below 239      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   239 and up     every row asserts (a minimum, never one exact version).
// On the V238 body relabelled 239, every native row FAILS on a data conjunct (no plugin call, clock on performance.now).
// D233-pwa PASSES there by design: it is a no-change claim (the PWA reads V238's values); S1 of the spec trips it.
//
// ROWS (ids are the licence file's names)
//   D233-pwa              no plugin: the clock follows performance.now and ignores Date.now; every seam runs without a
//                         throw; the tab reads 1:32 .34 Stop, frozen 1:32 Start, resumed 1:33, Reset 0:00, Done 0:00,
//                         day open on a stopped clock 0:00, Home hides the tab and the clock reads 30000.
//   D233-native-clock     plugin present (installed after boot): the clock follows Date.now and ignores performance.now:
//                         92340 (1:32 .34), frozen 92340, resumed 93340.
//   D233-start            Start sends exactly [run(D0)].
//   D233-stop             Stop at 92340 sends stop(92340): the log is exactly [run(D0), stop(92340)]; the tab 1:32 Start.
//   D233-resume           Start 5000 after that Stop sends run(D0 + 5000), the third call; then 1000 later 93340 (1:33).
//   D233-reset            the reset button, running and stopped at 92340: last call end(), no run() after the tap,
//                         clock 0, tab 0:00 Start.
//   D233-donestatus       Done and Skip on the open day with the clock running: last call end(), no run() after the tap,
//                         clock 0, tab 0:00.
//   D233-dayopen-stopped  a day open on a clock stopped at 92340 sends exactly [end()]; clock 0, tab 0:00; the day opened.
//   D233-dayopen-running  a day open on a clock running at 10000 sends nothing; 1000 later the clock reads 11000, Stop.
//   D233-hidden           Home then the wizard (tab display none) then This Week (block) send nothing; the clock reads
//                         40000, 60000, 60000 across them, Stop.
//   D233-boot             a page load with the plugin present sends exactly [end()], and init reaches Home (no program).
//   D233-throw            a plugin that throws on every call: Start, Stop, day open, Done and Reset throw nothing out of
//                         the seam; the clock reads 92340, frozen 92340, 0, 0, 0; every call reached the plugin and threw;
//                         a page load with that plugin does not throw and reaches Home.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const H = require(path.join(__dirname, '..', 'harness.js'));
const S = require(path.join(__dirname, '..', 'status'))('g239_d233_island');

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const ERA = 239;
const J = JSON.stringify;

const LABEL = {
  'D233-pwa':             'D233-pwa (VER >= 239) no plugin: the clock follows performance.now, never Date.now; every seam runs without a throw; tab 1:32 .34, frozen 1:32, 1:33, 0:00 after Reset, Done and day open; Home hides it, clock 30000',
  'D233-native-clock':    'D233-native-clock (VER >= 239) plugin present: the clock follows Date.now, never performance.now: 92340 (1:32 .34), frozen 92340, resumed 93340',
  'D233-start':           'D233-start (VER >= 239) Start sends exactly [run(D0)], D0 the fake Date at the tap',
  'D233-stop':            'D233-stop (VER >= 239) Stop at 92340 sends stop(92340): log [run(D0), stop(92340)], tab 1:32 Start',
  'D233-resume':          'D233-resume (VER >= 239) Start 5000 after Stop at 92340 sends run(D0 + 5000) as the third call; 1000 later 93340 (1:33)',
  'D233-reset':           'D233-reset (VER >= 239) the reset button, running and stopped: last call end(), no run() after it, clock 0, tab 0:00 Start',
  'D233-donestatus':      'D233-donestatus (VER >= 239) Done and Skip with the clock running: last call end(), no run() after it, clock 0, tab 0:00',
  'D233-dayopen-stopped': 'D233-dayopen-stopped (VER >= 239) a day open on a clock stopped at 92340 sends exactly [end()]; clock 0, tab 0:00',
  'D233-dayopen-running': 'D233-dayopen-running (VER >= 239) a day open on a running clock sends nothing; it keeps counting on Date.now (11000), Stop',
  'D233-hidden':          'D233-hidden (VER >= 239) Home and the wizard hide the tab and send nothing; the clock keeps counting on Date.now (40000, 60000), This Week shows it again',
  'D233-boot':            'D233-boot (VER >= 239) a page load with the plugin present sends exactly [end()] and reaches Home',
  'D233-throw':           'D233-throw (VER >= 239) a plugin that throws on every call: no seam throws, the clock reads 92340, 92340, 0, 0, 0, every call threw; a load with it reaches Home',
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const START_ISO = '2026-09-21';                                   // a Monday (g221's start)
const RealDate = Date;
const dateOf = (w, d) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d), 10, 0, 0).getTime();
const P0 = 5000000;                                               // the fake performance clock's origin (arbitrary)
const SKEW = 600000;                                              // the other clock's step: 10 min, 10:00 on the tab
const T92 = 92340, TAB92 = '1:32', CS92 = '.34', T93 = 93340, TAB93 = '1:33', ZERO = '0:00';
{ // the arithmetic, typed out (never the engine's _ruRender)
  const ts = Math.floor(T92 / 1000), m = Math.floor(ts / 60), s = ts % 60, cs = Math.floor(T92 / 10) % 100;
  if(m + ':' + (s < 10 ? '0' : '') + s !== TAB92 || '.' + cs !== CS92 || T92 + 1000 !== T93 || new RealDate(dateOf(1, 'mon')).getDay() !== 1)
    throw new Error('hand oracle self-check');
}

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM_ = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM_ ? +VM_[1] : 0;
const verCj = () => ['ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
S.info('g239 D233 P-ISLAND | candidate ' + ART + ' ia-version ' + VER);
if(!(VER >= ERA)) S.info('REFUSED: ia-version ' + VER + ' predates D233 (V' + ERA + '). Every row runs and FAILS by its version conjunct.');

// ── the plugin stub and the pre-boot load ──────────────────────────────────────────────────────────────────────────────
function mkStub(throwing){
  const log = [], thrown = [];
  const f = k => function(){ log.push(arguments.length ? [k, arguments[0]] : [k]); if(throwing){ thrown.push(k); throw new Error('iaIsland.' + k + ' threw (gate stub)'); } };
  return { log, thrown, run:f('run'), stop:f('stop'), end:f('end') };
}
function loadWithPlugin(file, stub){
  const orig = vm.runInContext;
  vm.runInContext = function(code, ctx, o){
    if(typeof code === 'string' && code.indexOf('globalThis.__IA') >= 0){ vm.runInContext = orig; ctx.iaIsland = stub; }
    return orig.call(vm, code, ctx, o);
  };
  try { return { IA:H.load(file), err:null }; } catch(e){ return { IA:null, err:String(e && e.message || e) }; } finally { vm.runInContext = orig; }
}

// ── env: the candidate booted with no plugin; retaining DOM stub, two fake clocks and a scheduler (g221's mkEnv shape) ──
function mkEnv(file){
  const IA = H.load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let DNOW = dateOf(1, 'mon'), PNOW = P0, TNOW = 0;
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(DNOW); } static now(){ return DNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => PNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every) => { const id = tid++; T.set(id, { fn, at:TNOW + Math.max(0, +ms || 0), every }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0);
  ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.requestAnimationFrame = fn => sched(() => fn(TNOW), 16, 0);
  ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); }; ctx.cancelAnimationFrame = id => { T.delete(id); };
  const run = ms => { const end = TNOW + ms;   // the scheduler's own clock: moves neither fake clock
    for(let n = 0; n < 20000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if(!b) break; const [id, t] = b; TNOW = t.at; if(t.every) t.at += t.every; else T.delete(id);
      try { t.fn(); } catch(e){ errs.push(e.message); } }
    TNOW = end; };
  if(ev('typeof Event') === 'undefined') ctx.Event = class { constructor(t){ this.type = t; } };
  const els = {};
  function mk(id){
    const cls = new Set(), lis = {};
    const e = { id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{}, children:[], offsetWidth:0, offsetHeight:0, offsetTop:0, offsetLeft:0,
      classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)),
        toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
      addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){},
      dispatchEvent:evt => { (lis[evt.type] || []).forEach(f => f({ target:e, currentTarget:e, type:evt.type })); return true; },
      setAttribute(){}, getAttribute(){ return null; }, appendChild(){}, removeChild(){}, remove(){}, insertAdjacentHTML(){},
      querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, setPointerCapture(){},
      getBoundingClientRect(){ return { top:0, left:0, width:0, height:0, bottom:0, right:0 }; }, scrollIntoView(){}, focus(){}, blur(){},
      get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x)); } };
    return e;
  }
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  if(!doc.addEventListener) doc.addEventListener = function(){};
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'rtMini', 'rtBig', 'rtCs', 'rtToggle', 'restFloat', 'screenWeek', 'daysList'].forEach(i => doc.getElementById(i));
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar')) : [];
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  const cfg = JSON.parse(J(H.fixtures.HALF_MANNY)); if(cfg.seed == null) cfg.seed = 12345;
  const p = IA.buildProgram(cfg); p.id = 'measure'; p.startDate = START_ISO; delete p.blockOpen; delete p.created; delete p.createdAt;
  [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([p]));
  ctx.__P = JSON.parse(J(p)); ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  const W = 1, DAY = DAYS.find(d => p.weeks[1][d] && !p.weeks[1][d].rest);
  const E = { IA, ctx, ev, els, errs, W, DAY, SCREENS };
  E.seam = code => { try { ev(code); return null; } catch(e){ return String(e && e.message || e); } };
  E.adv = (dD, dP) => { DNOW += dD; PNOW += dP; run(50); };          // move the two fake clocks, then let the 33 ms tick render
  E.attach = stub => { ctx.iaIsland = stub; return stub; };
  E.detach = () => { delete ctx.iaIsland; };
  E.fresh = () => { E.detach(); ev('ruReset()'); T.clear(); ev('saveCompleted({});'); ev('currentWeek=' + W + ';');
    DNOW = dateOf(W, DAY); PNOW = P0; ev("showScreen('screenWeek')");
    els.popOverlay.classList.remove('show'); els.detailOverlay.classList.remove('open'); run(50); };
  E.open = () => { const e = E.seam("openDayKey('" + DAY + "')"); run(300); return e; };
  E.now = () => ev('_ruNow()');
  E.tab = () => ({ mini:String(els.rtMini.innerHTML || '').replace(/<[^>]+>/g, ''), big:els.rtBig.textContent, cs:els.rtCs.textContent,
    tog:els.rtToggle.textContent, fl:els.restFloat.style.display });
  E.isOpen = () => els.detailOverlay.classList.contains('open');
  return E;
}

const row = (id, fn) => {
  let cj;
  try { cj = fn(); } catch(e){ cj = [['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]; }
  cj.unshift(verCj());
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) if(!c[1]) S.info(id + ' ' + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id], bad.map(c => c[0]).join(', ') + (bad.length ? ' failed (INFO lines above)' : ''));
};

let A = null, bootErr = null;
try { A = mkEnv(ART); } catch(e){ bootErr = String(e && e.message || e); S.info('boot failed: ' + bootErr); }
const need = fn => () => A ? fn() : [['boot', false, 'the candidate did not boot: ' + bootErr]];
const L = s => J(s.log);
const zeroTab = (n, t) => n === 0 && t.mini === ZERO;

// ── D233-pwa: no plugin anywhere in this row ─────────────────────────────────────────────────────────────────────────
row('D233-pwa', need(() => {
  const cj = [], errs = [], sm = (l, c) => { const e = A.seam(c); if(e) errs.push(l + ': ' + e); };
  cj.push(['no-plugin', A.ev('typeof window.iaIsland') === 'undefined', 'typeof window.iaIsland ' + A.ev('typeof window.iaIsland')]);
  A.fresh();
  sm('Start', 'rtToggleBtn()'); A.adv(SKEW, T92);
  let n = A.now(), t = A.tab();
  cj.push(['running', n === T92 && t.mini === TAB92 && t.big === TAB92 && t.cs === CS92 && t.tog === 'Stop', 'now ' + n + ' tab ' + J(t) + ' (hand 92340, 1:32 .34 Stop; Date moved 600000, which would read 10:00)']);
  sm('Stop', 'rtToggleBtn()'); A.adv(SKEW, 5000); n = A.now(); t = A.tab();
  cj.push(['frozen', n === T92 && t.mini === TAB92 && t.cs === CS92 && t.tog === 'Start', 'now ' + n + ' tab ' + J(t) + ' (hand 92340 1:32 .34 Start)']);
  sm('resume', 'rtToggleBtn()'); A.adv(SKEW, 1000); n = A.now(); t = A.tab();
  cj.push(['resumed', n === T93 && t.mini === TAB93 && t.tog === 'Stop', 'now ' + n + ' tab ' + J(t) + ' (hand 93340 1:33 Stop)']);
  sm('Reset', 'rtResetBtn()'); n = A.now(); t = A.tab();
  cj.push(['reset', zeroTab(n, t) && t.tog === 'Start', 'now ' + n + ' tab ' + J(t)]);
  A.fresh(); { const e = A.open(); if(e) errs.push('open: ' + e); }
  sm('Start', 'rtToggleBtn()'); A.adv(SKEW, 4000); sm('Done', "handleDayStatus('" + A.DAY + "','x','complete')"); n = A.now(); t = A.tab();
  cj.push(['done', zeroTab(n, t), 'now ' + n + ' tab ' + J(t)]); A.seam('popClose()');
  A.fresh(); sm('Start', 'rtToggleBtn()'); A.adv(SKEW, 4000); sm('Stop', 'rtToggleBtn()');
  { const e = A.open(); if(e) errs.push('open: ' + e); } n = A.now(); t = A.tab();
  cj.push(['dayopen', zeroTab(n, t) && A.isOpen(), 'now ' + n + ' tab ' + J(t) + ' open ' + A.isOpen()]);
  A.seam('closeDetail()'); A.fresh(); sm('Start', 'rtToggleBtn()'); sm('Home', "showScreen('screenHome')"); A.adv(SKEW, 30000); n = A.now(); t = A.tab();
  cj.push(['home', n === 30000 && t.fl === 'none', 'now ' + n + ' display ' + t.fl + ' (hand 30000, none)']);
  sm('Week', "showScreen('screenWeek')"); sm('Reset', 'rtResetBtn()');
  cj.push(['no-throw', errs.length === 0, errs.join(' | ') || 'none']);
  cj.push(['still-no-plugin', A.ev('typeof window.iaIsland') === 'undefined', 'typeof window.iaIsland ' + A.ev('typeof window.iaIsland')]);
  return cj;
}));

// ── native rows: the stub is installed after boot, as a late plugin would be ──────────────────────────────────────────
row('D233-native-clock', need(() => {
  const cj = []; A.fresh(); A.attach(mkStub(false));
  cj.push(['plugin', A.ev('typeof window.iaIsland') === 'object', 'typeof window.iaIsland ' + A.ev('typeof window.iaIsland')]);
  A.seam('rtToggleBtn()'); A.adv(T92, SKEW); let n = A.now(), t = A.tab();
  cj.push(['running', n === T92 && t.mini === TAB92 && t.cs === CS92, 'now ' + n + ' tab ' + J(t) + ' (hand 92340 1:32 .34; performance moved 600000)']);
  A.seam('rtToggleBtn()'); A.adv(5000, SKEW); n = A.now(); t = A.tab();
  cj.push(['frozen', n === T92 && t.mini === TAB92 && t.tog === 'Start', 'now ' + n + ' tab ' + J(t) + ' (hand 92340 1:32 Start)']);
  A.seam('rtToggleBtn()'); A.adv(1000, SKEW); n = A.now(); t = A.tab();
  cj.push(['resumed', n === T93 && t.mini === TAB93, 'now ' + n + ' tab ' + J(t) + ' (hand 93340 1:33)']);
  A.seam('rtResetBtn()'); A.detach();
  return cj;
}));

row('D233-start', need(() => {
  A.fresh(); const s = A.attach(mkStub(false)), D0 = dateOf(A.W, A.DAY);
  const e = A.seam('rtToggleBtn()'), t = A.tab();
  const r = [['log', L(s) === J([['run', D0]]), 'log ' + L(s) + ' (hand [["run",' + D0 + ']])'], ['tab', t.tog === 'Stop' && !e, 'tab ' + t.tog + ' throw ' + e]];
  A.seam('rtResetBtn()'); A.detach(); return r;
}));

row('D233-stop', need(() => {
  A.fresh(); const s = A.attach(mkStub(false)), D0 = dateOf(A.W, A.DAY);
  A.seam('rtToggleBtn()'); A.adv(T92, 7); A.seam('rtToggleBtn()'); const t = A.tab();
  const r = [['log', L(s) === J([['run', D0], ['stop', T92]]), 'log ' + L(s) + ' (hand [["run",' + D0 + '],["stop",92340]])'],
    ['tab', t.mini === TAB92 && t.tog === 'Start', 'tab ' + J(t)]];
  A.seam('rtResetBtn()'); A.detach(); return r;
}));

row('D233-resume', need(() => {
  A.fresh(); const s = A.attach(mkStub(false)), D0 = dateOf(A.W, A.DAY);
  A.seam('rtToggleBtn()'); A.adv(T92, 7); A.seam('rtToggleBtn()'); A.adv(5000, 7); A.seam('rtToggleBtn()');
  const third = J(s.log[2]), len = s.log.length; A.adv(1000, 7); const n = A.now(), t = A.tab();
  const r = [['run', third === J(['run', D0 + 5000]) && len === 3, 'third call ' + third + ' of ' + len + ' (hand ["run",' + (D0 + 5000) + '] of 3)'],
    ['clock', n === T93 && t.mini === TAB93, 'now ' + n + ' tab ' + J(t) + ' (hand 93340 1:33)']];
  A.seam('rtResetBtn()'); A.detach(); return r;
}));

row('D233-reset', need(() => {
  const cj = [];
  for(const mode of ['running', 'stopped']){
    A.fresh(); const s = A.attach(mkStub(false));
    A.seam('rtToggleBtn()'); A.adv(T92, 7); if(mode === 'stopped') A.seam('rtToggleBtn()');
    const mark = s.log.length, e = A.seam('rtResetBtn()'), after = s.log.slice(mark), n = A.now(), t = A.tab();
    cj.push([mode, mark > 0 && J(after[after.length - 1]) === J(['end']) && !after.some(c => c[0] === 'run') && zeroTab(n, t) && t.tog === 'Start' && !e,
      'after the tap ' + J(after) + ' now ' + n + ' tab ' + J(t) + ' throw ' + e + ' (hand last ["end"], no run, 0 0:00 Start)']);
    A.detach();
  }
  return cj;
}));

row('D233-donestatus', need(() => {
  const cj = [];
  for(const st of ['complete', 'skipped']){
    A.fresh(); const s = A.attach(mkStub(false)); const oe = A.open();
    A.seam('rtToggleBtn()'); A.adv(T92, 7);
    const mark = s.log.length, e = A.seam("handleDayStatus('" + A.DAY + "','x','" + st + "')"), after = s.log.slice(mark), n = A.now(), t = A.tab();
    cj.push([st, mark > 0 && !oe && J(after[after.length - 1]) === J(['end']) && !after.some(c => c[0] === 'run') && zeroTab(n, t) && !e,
      'after the tap ' + J(after) + ' now ' + n + ' tab ' + J(t) + ' throw ' + (e || oe) + ' (hand last ["end"], no run, 0 0:00)']);
    A.seam('popClose()'); A.detach();
  }
  return cj;
}));

row('D233-dayopen-stopped', need(() => {
  A.fresh(); const s = A.attach(mkStub(false));
  A.seam('rtToggleBtn()'); A.adv(T92, 7); A.seam('rtToggleBtn()');
  const mark = s.log.length, e = A.open(), after = s.log.slice(mark), n = A.now(), t = A.tab();
  const r = [['log', J(after) === J([['end']]), 'calls at the open ' + J(after) + ' (hand [["end"]])'],
    ['tab', zeroTab(n, t) && A.isOpen() && !e, 'now ' + n + ' tab ' + J(t) + ' open ' + A.isOpen() + ' throw ' + e]];
  A.seam('closeDetail()'); A.detach(); return r;
}));

row('D233-dayopen-running', need(() => {
  A.fresh(); const s = A.attach(mkStub(false));
  A.seam('rtToggleBtn()'); A.adv(10000, 7);
  const mark = s.log.length, e = A.open(), after = s.log.slice(mark); A.adv(1000, SKEW); const n = A.now(), t = A.tab();
  const r = [['log', after.length === 0 && mark === 1, 'calls at the open ' + J(after) + ' (hand none)'],
    ['clock', n === 11000 && t.tog === 'Stop' && A.isOpen() && !e, 'now ' + n + ' tab ' + J(t) + ' open ' + A.isOpen() + ' throw ' + e + ' (hand 11000 Stop)']];
  A.seam('closeDetail()'); A.seam('rtResetBtn()'); A.detach(); return r;
}));

row('D233-hidden', need(() => {
  A.fresh(); const s = A.attach(mkStub(false));
  A.seam('rtToggleBtn()'); A.adv(10000, 7); const mark = s.log.length, cj = [];
  let e = A.seam("showScreen('screenHome')"); A.adv(30000, SKEW); let n = A.now(), t = A.tab();
  cj.push(['home', n === 40000 && t.fl === 'none' && !e, 'now ' + n + ' display ' + t.fl + ' throw ' + e + ' (hand 40000 none)']);
  e = A.seam("showScreen('screenWizard')"); A.adv(20000, SKEW); n = A.now(); t = A.tab();
  cj.push(['wizard', n === 60000 && t.fl === 'none' && !e, 'now ' + n + ' display ' + t.fl + ' throw ' + e + ' (hand 60000 none)']);
  e = A.seam("showScreen('screenWeek')"); n = A.now(); t = A.tab();
  cj.push(['week', n === 60000 && t.fl === 'block' && t.tog === 'Stop' && !e, 'now ' + n + ' tab ' + J(t) + ' throw ' + e + ' (hand 60000 block Stop)']);
  const after = s.log.slice(mark);
  cj.push(['log', after.length === 0 && mark === 1, 'calls while hidden ' + J(after) + ' (hand none)']);
  A.seam('rtResetBtn()'); A.detach(); return cj;
}));

row('D233-boot', () => {
  const s = mkStub(false), b = loadWithPlugin(ART, s);
  const scr = b.IA ? b.IA.eval('_curScreen') : null;
  return [['load', !b.err, 'load ' + (b.err || 'ok')], ['log', L(s) === J([['end']]), 'calls at load ' + L(s) + ' (hand [["end"]])'],
    ['home', scr === 'screenHome', 'screen ' + scr + ' (hand screenHome: no program stored)']];
});

row('D233-throw', need(() => {
  const cj = [], errs = [], sm = (l, c) => { const e = A.seam(c); if(e) errs.push(l + ': ' + e); };
  A.fresh(); const s = A.attach(mkStub(true));
  sm('Start', 'rtToggleBtn()'); A.adv(T92, SKEW); const n1 = A.now();
  sm('Stop', 'rtToggleBtn()'); A.adv(5000, SKEW); const n2 = A.now(), t2 = A.tab();
  { const e = A.open(); if(e) errs.push('open: ' + e); } const n3 = A.now();
  sm('Start', 'rtToggleBtn()'); A.adv(4000, SKEW); sm('Done', "handleDayStatus('" + A.DAY + "','x','complete')"); const n4 = A.now(); A.seam('popClose()');
  sm('Start', 'rtToggleBtn()'); A.adv(4000, SKEW); sm('Reset', 'rtResetBtn()'); const n5 = A.now(), t5 = A.tab();
  cj.push(['no-throw', errs.length === 0, errs.join(' | ') || 'none']);
  cj.push(['clock', n1 === T92 && n2 === T92 && t2.tog === 'Start' && n3 === 0 && n4 === 0 && n5 === 0 && t5.mini === ZERO,
    'reads ' + J([n1, n2, n3, n4, n5]) + ' tab ' + J(t5) + ' (hand [92340,92340,0,0,0] 0:00)']);
  cj.push(['reached', s.log.length >= 6 && s.thrown.length === s.log.length, s.thrown.length + ' of ' + s.log.length + ' calls threw (hand every call, at least 6: Start, Stop, open, Start, Done, Start, Reset)']);
  A.detach();
  const s2 = mkStub(true), b = loadWithPlugin(ART, s2), scr = b.IA ? b.IA.eval('_curScreen') : null;
  cj.push(['boot', !b.err && scr === 'screenHome' && J(s2.thrown) === J(['end']), 'load ' + (b.err || 'ok') + ' screen ' + scr + ' threw ' + J(s2.thrown) + ' (hand ok screenHome ["end"])']);
  return cj;
}));

if(A && A.errs.length) S.info(A.errs.length + ' timer callbacks threw, e.g. ' + [...new Set(A.errs)].slice(0, 2).join(' | '));
S.summary();
