'use strict';
// Helpers for the week view, day close and active program tests (tests/integration/week-view.test.js,
// tests/sweeps/week-view.test.js, tests/integration/active-program.test.js). Built on tests/support/app.js.
//
//   stripComments(src)   the inline script with every comment blanked by a small lexer that knows strings, template
//                        literals (with ${} nesting) and regex literals, so a "this token is gone" scan never counts a
//                        comment and never eats code. A test proves the stripped text still compiles.
//   weekEnv()            the app booted with a virtual clock (every setTimeout, setInterval and requestAnimationFrame
//                        callback runs when the clock is advanced past it) and a document whose elements keep what is
//                        written to them, their classes and their listeners. HALF_MANNY (seed pinned) is stored with a
//                        Monday start, 2026-09-21, and no blockOpen, and the clock is set per case to 10:00 on the
//                        case's day, so every week sits after the start and no cell renders as before signup.
//   closeTaps(E, days), timerTaps(E, days), wheelTaps(E), heroAndStrip(E, weeks)
//                        the day-close lattices, each returning a tally per claim. The integration file runs them on
//                        a sample of days; the sweep runs every training day.
const vm = require('node:vm');
const { loadApp, fixtures } = require('./app.js');

const BS = String.fromCharCode(92);

/** The source with every comment replaced (line comments dropped, block comments by one space). */
function stripComments(src) {
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
  const readTemplate = () => {
    while (i < n) {
      const c = src[i];
      if (c === BS) { out.push(src.substr(i, 2)); i += 2; continue; }
      if (c === '`') { out.push(c); i++; return; }
      if (c === '$' && src[i + 1] === '{') { out.push('${'); i += 2; tpl.push(depth); depth++; return; }
      out.push(c); i++;
    }
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; out.push(' '); continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === BS) j++; j++; }
      out.push(src.slice(i, j + 1)); i = j + 1; prevSig = c; prevWord = ''; continue;
    }
    if (c === '`') { out.push(c); i++; readTemplate(); prevSig = '`'; prevWord = ''; continue; }
    if (c === '{') { depth++; out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if (c === '}') {
      depth--; out.push(c); i++; prevWord = '';
      if (tpl.length && tpl[tpl.length - 1] === depth) { tpl.pop(); readTemplate(); prevSig = '`'; } else prevSig = '}';
      continue;
    }
    if (c === '/') {
      if (prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)) {
        let j = i + 1, cls = false;
        while (j < n && src[j] !== '\n') {
          const x = src[j];
          if (x === BS) { j += 2; continue; }
          if (cls) { if (x === ']') cls = false; } else if (x === '[') cls = true; else if (x === '/') break;
          j++;
        }
        j++; while (j < n && /[a-z]/i.test(src[j])) j++;
        out.push(src.slice(i, j)); i = j; prevSig = 'r'; prevWord = ''; continue;
      }
      out.push(c); i++; prevSig = c; prevWord = ''; continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const w = src.slice(i, j); out.push(w); i = j; prevWord = w; prevSig = 'w'; continue;
    }
    out.push(c); i++; if (!/\s/.test(c)) { prevSig = c; prevWord = ''; }
  }
  return out.join('');
}

/** True when `src` compiles as a script. */
function compiles(src) {
  try { new vm.Script(src); return true; } catch { return false; }
}

const count = (s, t) => s.split(t).length - 1;

// ── the day-close world ─────────────────────────────────────────────────────────────────────────────────────────────
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const START_ISO = '2026-09-21';   // a Monday
const RealDate = Date;
/** 10:00 local on week w, day d of the block (plus `plus` days). */
const dateOf = (w, d, plus) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d) + (plus || 0), 10, 0, 0).getTime();

// The pace wheel's row table (V184 D5): minutes ['', '4'..'17'] with no wrap; seconds '0'..'59' five times, home 120.
// Seeded `9:30` is minutes row 6, seconds row 150; minutes row 7 settles `10:30`.
const MIN_ROWS = ['', ...Array.from({ length: 14 }, (_, i) => String(4 + i))];
const SEC_ROWS = [].concat(...Array(5).fill(Array.from({ length: 60 }, (_, i) => String(i))));
const WROW = 44, W_SEED = '9:30', W_SEED_ROWS = [6, 150], W_TARGET_ROW = 7, W_SETTLED = '10:30';

function weekEnv() {
  const IA = loadApp(), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let VNOW = dateOf(1, 'mon');
  class FD extends RealDate { constructor(...a) { if (a.length) super(...a); else super(VNOW); } static now() { return VNOW; } }
  ctx.Date = FD; ctx.performance = { now: () => VNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every, kind) => { const id = tid++; T.set(id, { fn, at: VNOW + Math.max(0, +ms || 0), every, kind }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0, 'timeout');
  ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1), 'interval');
  ctx.requestAnimationFrame = fn => sched(() => fn(VNOW), 16, 0, 'raf');
  ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); }; ctx.cancelAnimationFrame = id => { T.delete(id); };
  const advance = ms => {
    const end = VNOW + ms;
    for (let n = 0; n < 200000; n++) {
      let b = null; for (const [id, t] of T) if (t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if (!b) break;
      const [id, t] = b; VNOW = t.at; if (t.every) t.at += t.every; else T.delete(id);
      try { t.fn(); } catch (e) { errs.push(e.message); }
    }
    VNOW = end;
  };
  if (ev('typeof Event') === 'undefined') ctx.Event = class { constructor(t) { this.type = t; } };
  const els = {};
  function mk(id) {
    const cls = new Set(), lis = {};
    const e = {
      id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, children: [], offsetWidth: 0, offsetHeight: 0, offsetTop: 0, offsetLeft: 0,
      classList: {
        add: (...c) => c.forEach(x => cls.add(x)), remove: (...c) => c.forEach(x => cls.delete(x)),
        toggle: (c, f) => { const on = f === undefined ? !cls.has(c) : !!f; if (on) cls.add(c); else cls.delete(c); return on; }, contains: c => cls.has(c),
      },
      addEventListener: (t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener() {},
      dispatchEvent: evt => { (lis[evt.type] || []).forEach(f => f({ target: e, currentTarget: e, type: evt.type })); return true; },
      setAttribute() {}, getAttribute() { return null; }, appendChild() {}, removeChild() {}, remove() {}, insertAdjacentHTML() {},
      querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, setPointerCapture() {},
      getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; }, scrollIntoView() {}, focus() {}, blur() {},
      get className() { return [...cls].join(' '); }, set className(v) { cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x)); },
    };
    return e;
  }
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'log_notes', 'log_run_pace', 'screenWeek', 'daysList'].forEach(i => doc.getElementById(i));
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  const E = { IA, ev, LS, els, advance, T, errs, cols: [], toastShows: [], vnow: () => VNOW, setNow: t => { VNOW = t; } };
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s])
    : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar'))
      : sel === '.iaw-col' ? E.cols : [];
  els.detailOverlay.querySelectorAll = sel => sel === '.iaw-col' ? E.cols : [];
  ctx.popConfetti = function () {}; ev('popConfetti=globalThis.popConfetti;');
  { const t = els.toast, add = t.classList.add; t.classList.add = (...c) => { if (c.includes('show')) E.toastShows.push({ t: VNOW, html: t.innerHTML }); return add(...c); }; }
  const cfg = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  const p = IA.buildProgram(cfg); p.id = 'measure'; p.startDate = START_ISO; delete p.blockOpen; delete p.created; delete p.createdAt;
  E.p = p;
  E.setup = () => {
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', JSON.stringify([p]));
    ctx.__P = JSON.parse(JSON.stringify(p)); ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;'); ev("showScreen('screenWeek')");
  };
  E.TRAIN = [];
  for (const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for (const d of DAYS) { const x = p.weeks[w][d]; if (x && !x.rest) E.TRAIN.push([w, d]); }
  E.OPEN = () => els.detailOverlay.classList.contains('open');
  E.POP = () => els.popOverlay.classList.contains('show');
  E.TOAST = () => els.toast.classList.contains('show');
  E.WEEK = () => ev('_curScreen') === 'screenWeek' && els.screenWeek.classList.contains('active');
  E.html = () => els.daysList.innerHTML || '';
  E.clearMarks = () => { LS.removeItem('ia_comp_measure'); LS.removeItem('ia_wild_measure'); };
  // a fresh case: timer idle, clock at 10:00 on (w, d)+plus, This Week showing, no overlay, no pop-up, no toast
  E.fresh = (w, d, plus) => {
    ev('ruReset()'); T.clear(); ev('saveCompleted({});'); LS.removeItem('ia_wild_measure'); VNOW = dateOf(w, d, plus); ev('currentWeek=' + w + ';');
    ev("showScreen('screenWeek')"); els.popOverlay.classList.remove('show'); els.toast.classList.remove('show'); els.detailOverlay.classList.remove('open'); advance(50);
  };
  E.open = d => { ev("openDayKey('" + d + "')"); advance(300); };
  E.tap = (d, st) => ev("handleDayStatus('" + d + "','x','" + st + "')");
  E.status = (w, d) => ev('statusOf(' + w + ",'" + d + "')");
  E.PRE = { n: 0, renders: 0 };
  E.notePre = h => { E.PRE.renders++; E.PRE.n += (h.match(/class="wk-day[^"]*\bpre\b/g) || []).length; };
  return E;
}

/** A tally per claim: pass count, fail count, the first two failures. */
function tallies() {
  const Q = {};
  return {
    rec(k, c, why) { const q = Q[k] = Q[k] || [0, 0, []]; if (c) q[0]++; else { q[1]++; if (q[2].length < 2) q[2].push(why); } },
    get(k) { const q = Q[k] || [0, 0, []]; return { pass: q[0], fail: q[1], examples: q[2] }; },
  };
}

// ── the closes: Done, Skip, Mark Done ✓ and the undo taps ─────────────────────────────────────────────────────────
// SKIP_LBL is the Skip toast label (the D179 amendment copy fix); UNMARKED the undo toast.
const SKIP_LBL = 'Skipped ✕ The week moves on';
const UNMARKED = 'Unmarked';

/** Mark Done ✓: the day is logged and unmarked, revisited the next day; returns the nudge's own onclick, or null. */
function markDoneCall(E, w, d) {
  const { ev, LS, els } = E;
  const lk = ev('logKey(' + w + ",'" + d + "')"), logs = JSON.parse(LS.getItem('ia_logs_measure') || '{}');
  logs[lk] = { notes: 'ran it', week: w, ts: E.vnow() }; LS.setItem('ia_logs_measure', JSON.stringify(logs));
  els.log_notes.value = 'ran it'; E.open(d);
  const m = els.detailBody.innerHTML.match(/class="log-nudge-btn" onclick="(handleDayStatus\([^"]*\))">Mark Done/);
  return m ? m[1] : null;
}

/** C1 to C6, T1, T2 over `days` ([week, day] pairs). */
function closeTaps(E, days) {
  const { ev, els, advance } = E, q = tallies();
  for (const [w, d] of days) {
    E.fresh(w, d); E.open(d); E.toastShows.length = 0; E.notePre(E.html());
    E.tap(d, 'complete');
    q.rec('C1', !E.OPEN() && E.WEEK(), 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' screen=' + ev('_curScreen'));
    q.rec('C5', E.POP(), 'Done W' + w + ' ' + d + ' pop=' + E.POP());
    let lit = E.TOAST(), popAll = E.POP();
    for (let t = 0; t < 2300; t += 10) { advance(10); if (E.TOAST()) lit = true; if (!E.POP()) popAll = false; }
    q.rec('T1', !lit && !E.toastShows.length && popAll, 'W' + w + ' ' + d + ' toast shown ' + JSON.stringify(E.toastShows.map(x => x.html)) + ' pop throughout ' + popAll);
    ev('popClose()');
  }
  for (const [w, d] of days) {
    E.fresh(w, d); E.open(d); E.toastShows.length = 0;
    E.tap(d, 'skipped');
    q.rec('C2', !E.OPEN() && E.WEEK(), 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' screen=' + ev('_curScreen'));
    q.rec('C6', !E.POP(), 'Skip W' + w + ' ' + d + ' pop=' + E.POP());
    q.rec('T2', E.TOAST() && els.toast.innerHTML === SKIP_LBL && !E.POP(), 'W' + w + ' ' + d + ' toast=' + E.TOAST() + ' "' + els.toast.innerHTML + '" pop=' + E.POP());
    ev('popClose()');
  }
  for (const [w, d] of days) {
    E.fresh(w, d, 1); const call = markDoneCall(E, w, d);
    if (!call) { q.rec('C3', false, 'W' + w + ' ' + d + ' no Mark Done nudge rendered'); q.rec('C5', false, 'Mark Done W' + w + ' ' + d + ' no nudge'); continue; }
    ev(call);
    q.rec('C3', !E.OPEN() && E.WEEK() && E.status(w, d) === 'complete', 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' status=' + E.status(w, d));
    q.rec('C5', E.POP(), 'Mark Done W' + w + ' ' + d + ' pop=' + E.POP());
    ev('popClose()'); els.log_notes.value = '';
  }
  for (const [w, d] of days) for (const st of ['complete', 'skipped']) {
    E.fresh(w, d); E.open(d); E.tap(d, st); ev('popClose()');
    E.open(d); els.toast.classList.remove('show'); els.popOverlay.classList.remove('show');
    E.tap(d, st);
    q.rec('C4', E.OPEN() && !E.POP() && E.TOAST() && els.toast.innerHTML === UNMARKED && E.status(w, d) === null,
      'W' + w + ' ' + d + ' ' + st + ' open=' + E.OPEN() + ' pop=' + E.POP() + ' toast="' + els.toast.innerHTML + '" status=' + E.status(w, d));
  }
  return q;
}

// ── the rest timer on a close ─────────────────────────────────────────────────────────────────────────────────────
const RT_ZERO = '0:00', RT_START = 'Start';

/** B1d, B1s, B1m, B2u, B2b over `days`. */
function timerTaps(E, days) {
  const { ev, els, advance } = E, q = tallies();
  const rt = () => ({ running: ev('_ruRunning'), id: ev('_ruId'), el: ev('_ruElapsed'), mini: String(els.rtMini.innerHTML || '').replace(/<[^>]+>/g, ''), tog: els.rtToggle.textContent, fl: els.restFloat.style.display });
  const prep = {
    B1d: (w, d) => { E.open(d); return () => E.tap(d, 'complete'); },
    B1s: (w, d) => { E.open(d); return () => E.tap(d, 'skipped'); },
    B1m: (w, d) => { const c = markDoneCall(E, w, d); return () => { if (c) ev(c); }; },
  };
  for (const k of ['B1d', 'B1s', 'B1m']) for (const [w, d] of days) {
    E.fresh(w, d, k === 'B1m' ? 1 : 0); const go = prep[k](w, d);
    ev('rtToggleBtn()'); advance(11000); const b = rt(); go(); const a = rt();
    // precondition: running and visibly counting (a running rest keeps _ruElapsed at 0 and prints from its start stamp)
    q.rec(k, b.running === true && b.id !== null && b.mini !== RT_ZERO && a.running === false && a.id === null && a.el === 0 && a.mini === RT_ZERO && a.tog === RT_START && a.fl === b.fl && a.fl === 'block',
      'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
    ev('popClose()'); els.log_notes.value = '';
  }
  for (const [w, d] of days) {
    E.fresh(w, d); E.open(d); E.tap(d, 'complete'); ev('popClose()');
    E.open(d); ev('rtToggleBtn()'); advance(4000); let b = rt(); E.tap(d, 'complete'); let a = rt();
    q.rec('B2u', b.id !== null && a.running === true && a.id === b.id && E.T.has(a.id) && E.OPEN(), 'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
    E.fresh(w, d); E.open(d); ev('rtToggleBtn()'); advance(4000); b = rt(); ev('closeDetail()'); a = rt();
    q.rec('B2b', b.id !== null && a.running === true && a.id === b.id && E.T.has(a.id) && !E.OPEN(), 'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
  }
  return q;
}

// ── the pace wheel flushed by a close ─────────────────────────────────────────────────────────────────────────────
/** A hand-built pace wheel the real iaWheelInit drives; with layoutLoss its columns read 0 once the day closes. */
function fakeWheel(E, layoutLoss) {
  const lost = () => layoutLoss && !E.els.detailOverlay.classList.contains('open');
  const mkCol = (rows, attrs) => {
    const lis = {}, items = rows.map(v => ({ style: {}, getAttribute: k => k === 'data-v' ? v : null })); let st = 0;
    return {
      style: {}, _lis: lis, getAttribute: k => attrs[k] == null ? null : attrs[k], querySelectorAll: s => s === '.iaw-it' ? items : [],
      addEventListener: (t, fn) => { (lis[t] = lis[t] || []).push(fn); },
      get scrollTop() { return lost() ? 0 : st; }, set scrollTop(v) { if (!lost()) st = v; },
    };
  };
  const c0 = mkCol(MIN_ROWS, { 'data-wrap': '', 'data-len': '15' }), c1 = mkCol(SEC_ROWS, { 'data-wrap': '1', 'data-len': '60' });
  const wh = { _iawOn: false, getAttribute: k => ({ 'data-kind': 'pace', 'data-for': 'log_run_pace' })[k] || null, querySelectorAll: s => s === '.iaw-col' ? [c0, c1] : [] };
  return { wh, cols: [c0, c1] };
}

/** The card's regime reads #cardioSwapWrap's data-* attributes, which this stub never parses: copy them from the markup. */
function wrapSync(E) {
  const wrap = E.IA.ctx.document.getElementById('cardioSwapWrap'), keep = Object.assign({}, wrap.dataset);
  return {
    wrap,
    sync: () => {
      const m = (E.els.detailBody.innerHTML || '').match(/<div\b[^>]*\sid="cardioSwapWrap"[^>]*>/);
      if (!m) throw new Error('no #cardioSwapWrap in the rendered day');
      let a; const re = /\sdata-([a-z]+)="([^"]*)"/g; while ((a = re.exec(m[0]))) wrap.dataset[a[1]] = a[2];
    },
    restore: () => { for (const k of Object.keys(wrap.dataset)) delete wrap.dataset[k]; Object.assign(wrap.dataset, keep); },
  };
}

/** W1 and W2 on the first training day that renders a pace wheel. */
function wheelTaps(E) {
  const { ev, els, LS, advance } = E, q = tallies();
  let runDay = null;
  E.setup();
  for (const [w, d] of E.TRAIN) { E.fresh(w, d); E.open(d); if (/data-for="log_run_pace"/.test(els.detailBody.innerHTML)) { runDay = [w, d]; break; } }
  if (!runDay) return { q, runDay };
  const readPace = (w, d) => { const l = JSON.parse(LS.getItem('ia_logs_measure') || '{}')[ev('logKey(' + w + ",'" + d + "')")]; return l ? l.run_pace : '(no entry)'; };
  const turn = cols => { cols[0].scrollTop = W_TARGET_ROW * WROW; (cols[0]._lis.scroll || []).forEach(f => f()); advance(40); };
  const seededOk = r => r.seeded[0] === W_SEED_ROWS[0] && r.seeded[1] === W_SEED_ROWS[1] && r.pending;
  // W1: a wheel scrolled 9:30 -> 10:30, Done or Skip tapped 40 ms into its 90 ms settle window, saves 10:30.
  for (const layoutLoss of [false, true]) for (const st of ['complete', 'skipped']) {
    const [w, d] = runDay; E.fresh(w, d);
    const ws = wrapSync(E);
    E.open(d); els.log_run_pace.value = W_SEED; ws.sync();
    const { wh, cols } = fakeWheel(E, layoutLoss); E.cols = cols;
    ev('iaWheelInit')({ querySelectorAll: s => s === '.iaw' ? [wh] : [] }); advance(40);
    const seeded = [cols[0].scrollTop / WROW, cols[1].scrollTop / WROW];
    turn(cols);
    const pending = [...E.T.values()].some(t => t.kind === 'timeout');
    E.tap(d, st); const atTap = readPace(w, d); advance(200); const later = readPace(w, d);
    E.cols = []; ev('popClose()'); ws.restore();
    const r = { seeded, pending, atTap, later };
    q.rec('W1', seededOk(r) && atTap === W_SETTLED && later === W_SETTLED, st + (layoutLoss ? ' layout-loss' : '') + ' ' + JSON.stringify(r));
  }
  // W2: an undo tap inside the window is not flushed. A stored 9:30 is a live entry: the undo saves the form unflushed
  // (9:30) and the wheel's own settle stores 10:30 later. A 9:30 only on the hidden node is a draft: nothing reaches
  // run_pace at the tap or after, and the settle lands on the hidden node, 10:30.
  for (const st of ['complete', 'skipped']) for (const seed of ['store', 'dom']) {
    const [w, d] = runDay, ws = wrapSync(E);
    E.fresh(w, d); E.open(d); ws.sync(); els.log_run_pace.value = ''; E.tap(d, st); ev('popClose()');
    if (seed === 'store') {
      const lk = ev('logKey(' + w + ",'" + d + "')"), logs = JSON.parse(LS.getItem('ia_logs_measure') || '{}');
      logs[lk] = Object.assign({}, logs[lk], { run_pace: W_SEED }); LS.setItem('ia_logs_measure', JSON.stringify(logs));
    }
    E.open(d); ws.sync(); els.log_run_pace.value = W_SEED;
    const { wh, cols } = fakeWheel(E, false); E.cols = cols;
    ev('iaWheelInit')({ querySelectorAll: s => s === '.iaw' ? [wh] : [] }); advance(40);
    const seeded = [cols[0].scrollTop / WROW, cols[1].scrollTop / WROW];
    turn(cols);
    const pending = [...E.T.values()].some(t => t.kind === 'timeout');
    E.tap(d, st); const atTap = readPace(w, d), open = E.OPEN(); advance(200); const later = readPace(w, d), hidden = els.log_run_pace.value;
    E.cols = []; ev('popClose()'); ws.restore();
    const r = { seed, seeded, pending, atTap, later, hidden, open };
    const want = seed === 'store' ? atTap === W_SEED && later === W_SETTLED : atTap === '' && later === '' && hidden === W_SETTLED;
    q.rec('W2', seededOk(r) && want && open, 'undo ' + st + ' ' + JSON.stringify(r));
  }
  return { q, runDay };
}

// ── the hero and the strip ────────────────────────────────────────────────────────────────────────────────────────
// The two hero strings, verbatim from the D179 amendment and Mario's decision.
const DONE_STR = 'Done ✓ Closed out. Open the session to undo.';
const SKIP_STR = 'Skipped ✕ The week moves on. Open the session to undo.';

const cells = h => {
  const o = {};
  (h.match(/<div class="wk-day[^"]*"[^>]*>[\s\S]*?<div class="wk-day-bot"[^>]*>[\s\S]*?<\/div><\/div>/g) || []).forEach(c => {
    const lbl = (c.match(/wk-day-lbl">(\w+)</) || [])[1]; if (!lbl) return;
    o[lbl.toLowerCase()] = { cls: (c.match(/class="(wk-day[^"]*)"/) || [])[1], center: (c.match(/wk-day-num">([\s\S]*?)<\/div>/) || [])[1] };
  });
  return o;
};
const heroBlock = h => (h.match(/<div class="wk-hero[\s\S]*?(?=<div class="wc-tag|<div class="wk-stats"|$)/) || [''])[0];
const hero = h => {
  const b = heroBlock(h), txt = b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    cls: (b.match(/class="(wk-hero[^"]*)"/) || [])[1] || '', over: (b.match(/wk-hero-over">([^<]*)</) || [])[1] || '',
    cta: (b.match(/class="wk-hero-cta"[^>]*>([^<]*)</) || [])[1] || '', status: (b.match(/<div class="wk-hero-status">([^<]*)<\/div>/) || [])[1] || null,
    hasDone: txt.includes(DONE_STR), hasSkip: txt.includes(SKIP_STR),
  };
};

/** A1a, A1b, A1c, A2, A3a to A3d over the given weeks: every training day as today, and every (today, previous) pair. */
function heroAndStrip(E, weeks) {
  const { ev, els, LS, advance } = E, q = tallies();
  const at = (w, today) => { E.T.clear(); E.setNow(dateOf(w, today)); ev('currentWeek=' + w + ';'); els.popOverlay.classList.remove('show'); };
  const settle = () => { ev('popClose()'); if (E.OPEN()) ev('closeDetail()'); advance(3000); };
  const markA = (dk, st) => { E.open(dk); E.tap(dk, st); settle(); };
  E.setup();
  let pairs = 0, todays = 0;
  for (const w of weeks) {
    const tr = DAYS.filter(d => E.p.weeks[w][d] && !E.p.weeks[w][d].rest);
    for (const T0 of tr) {
      todays++;
      const over = 'Today · ' + FULL[T0];
      E.clearMarks(); at(w, T0); ev('renderWeekView()'); const h0 = E.html(); E.notePre(h0); const hp = hero(h0);
      q.rec('A1c', hp.over === over && hp.status === null && !hp.hasDone && !hp.hasSkip && hp.cta === 'START SESSION' && /\bis-today\b/.test(hp.cls), 'pending W' + w + ' ' + T0 + ' over="' + hp.over + '" cta=' + hp.cta + ' status=' + hp.status);
      for (const st of ['complete', 'skipped']) {
        E.clearMarks(); at(w, T0); markA(T0, st); const h1 = E.html(); E.notePre(h1); const h = hero(h1);
        const want = st === 'complete' ? DONE_STR : SKIP_STR, other = st === 'complete' ? 'hasSkip' : 'hasDone';
        q.rec(st === 'complete' ? 'A1a' : 'A1b', h.over === over && h.status === want && !h[other] && h.cta === 'OPEN SESSION' && /\bis-today\b/.test(h.cls),
          st + ' W' + w + ' ' + T0 + ' over="' + h.over + '" status=' + JSON.stringify(h.status) + ' cta=' + h.cta + ' cls=' + h.cls);
        markA(T0, st); const hu = hero(E.html());
        q.rec('A1c', hu.over === over && hu.status === null && !hu.hasDone && !hu.hasSkip && hu.cta === 'START SESSION', 'undo ' + st + ' W' + w + ' ' + T0 + ' status=' + hu.status + ' cta=' + hu.cta);
      }
    }
    for (let i = 1; i < tr.length; i++) {
      pairs++;
      const T0 = tr[i], P0 = tr[i - 1];
      for (const [which, dk] of [['today', T0], ['past', P0]]) {
        const dom = String(new RealDate(dateOf(w, dk)).getDate()), wantCls = which === 'today' ? 'wk-day today' : 'wk-day dim';
        for (const st of ['complete', 'skipped']) {
          E.clearMarks(); at(w, T0); ev('renderWeekView()'); const hb = heroBlock(E.html());
          markA(dk, st); const h = E.html(); E.notePre(h); const c = cells(h)[dk] || {}, hh = hero(h);
          if (st === 'skipped') q.rec('A3a', c.cls === wantCls && c.center === '✕' && !/class="chk"/.test(c.center), which + '/skipped W' + w + ' ' + dk + ' cell=' + JSON.stringify(c));
          else q.rec('A3b', c.cls === wantCls && /<span class="chk">✓<\/span>/.test(c.center || '') && !/✕/.test(c.center || ''), which + '/complete W' + w + ' ' + dk + ' cell=' + JSON.stringify(c));
          if (which === 'past') {
            q.rec('A2', hh.over === 'Today · ' + FULL[T0] && hh.status === null && !hh.hasDone && !hh.hasSkip && hh.cta === 'START SESSION' && heroBlock(h) === hb,
              'past/' + st + ' W' + w + ' tapped=' + dk + ' today=' + T0 + ' over="' + hh.over + '" status=' + hh.status + ' cta=' + hh.cta + ' same=' + (heroBlock(h) === hb));
          }
          markA(dk, st); const cu = cells(E.html())[dk] || {};
          q.rec('A3c', cu.center === dom && cu.cls === wantCls, which + '/undo ' + st + ' W' + w + ' ' + dk + ' center=' + cu.center + ' want ' + dom);
        }
        E.clearMarks(); at(w, T0); LS.setItem('ia_wild_measure', JSON.stringify([{ week: w, dayKey: dk, title: 'wc' }]));
        markA(dk, 'skipped'); const cw = cells(E.html())[dk] || {};
        q.rec('A3d', /class="wc-mark"/.test(cw.center || '') && !/✕/.test(cw.center || '') && !/class="chk"/.test(cw.center || ''), which + '/wildcard+skipped W' + w + ' ' + dk + ' center=' + String(cw.center || '').slice(0, 40));
      }
    }
  }
  return { q, pairs, todays };
}

module.exports = {
  stripComments, compiles, count,
  DAYS, FULL, START_ISO, dateOf, MIN_ROWS, SEC_ROWS, W_SEED, W_SEED_ROWS, W_TARGET_ROW, W_SETTLED,
  SKIP_LBL, UNMARKED, RT_ZERO, RT_START, DONE_STR, SKIP_STR,
  weekEnv, closeTaps, timerTaps, wheelTaps, heroAndStrip,
};
