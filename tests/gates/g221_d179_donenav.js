// g221_d179_donenav.js — GATE for D179 (P-DONENAV): Done, Skip and Mark Done ✓ close the day and land on This Week.
//
//   node tests/gates/g221_d179_donenav.js <candidate.html> [baseline_V220.html]
//   IA_ASSUME_VERSION=221 node tests/gates/g221_d179_donenav.js <tree stamped 220> [baseline_V220.html]   (pre-bump dev only)
//
// THE RULING THIS DEFENDS: tests/measure/v221_rulings/p_donenav_ruling.md: the original ruling ("What changes", "Before /
// After", the closing set), MARIO DECISION (2026-09-24), AMENDMENT ON V220 (a) hero status copy and the skipped strip ✕,
// (b) the rest timer on a status-setting close, (c) the Done toast under the pop-up, each with its gate list, and MARIO
// DECISION ON THE AMENDMENT (ship the ✕, coach's two hero strings verbatim, (b) and (c) as written). D-code D179, V221.
//
// ORACLE. Hand-typed, never asked of the engine:
//   DONE_STR / SKIP_STR   the two hero strings, verbatim from the amendment and Mario's decision.
//   SKIP_LBL              the Skip toast label, the amendment's copy fix: `Skipped ✕ The week moves on`.
//   OLD_SKIP              the em-dash label, which must survive exactly once: resolveReminder's parked twin (§12).
//   FULL                  the hero's weekday names; the strip cell's day of month comes from date arithmetic.
//   WHEEL                 the pace wheel's row table (V184 D5): minutes ['', '4'..'17'] no wrap; seconds '0'..'59' five
//                         times, home 120. Seeded `9:30` = minutes row 6, seconds row 150; minutes row 7 settles `10:30`.
//   RT_*                  the idle rest-timer print: `0:00` and `Start`.
// OBSERVATION is the live path inside the harness VM: handleDayStatus, openDayKey, closeDetail, renderWeekView,
// iaWheelInit on a hand-built wheel, rtToggleBtn, popClose, read off a retaining DOM stub and ia_logs_.
//
// CLOCK AND BLOCK (D180 landed in V221 too). A virtual clock runs every setTimeout, setInterval and rAF callback when it is
// advanced. HALF_MANNY built by buildProgram carries no blockOpen; the gate stores it with startDate Monday 2026-09-21,
// deletes blockOpen explicitly, and pins the clock per case to 10:00 America/New_York on the case's day, so every week
// sits after the start and no cell is pre-signup. F0 fails if any render prints a `pre` cell: the lattice never shrinks
// silently (the S7 proof skipped such cells; this gate refuses them).
//
// VERSION PREDICATE (standing rulings 2 and 4). D179 ships at 221.
//   below 221      REFUSED, every assertion row FAILS by name.
//   221 and up     hand rows (F0 C T B W A K) assert. G9 asserts on 221 only.
//   pair rows      P1 P2 assert only on D179's build pair: candidate 221 against baseline 220 (argv[3] when it reads 220,
//                  else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS.
//   IA_ASSUME_VERSION=221 lifts a file stamped 220 to 221 for a pre-bump development run. It is announced, and it is
//   ignored on any file not stamped exactly 220. gate.sh never sets it.
//
// ROWS (lattice: HALF_MANNY, 70 training days, the ruling's "70 Done taps")
//   F0   the lattice is in the block: 70 training days, 0 pre-signup cells on any render.
//   C1-C3 Done / Skip / Mark Done ✓ close the day to This Week, 70 taps each.  C4 undo taps stay on the day (neg ctl).
//   C5   the pop-up shows after Done and Mark Done ✓.  C6 no pop-up after Skip.
//   T1   (c1) Done: #toast never shows at any 10 ms tick through +2200 ms, popOverlay shown.  T2 Skip: toast, new label.
//   B1d B1s B1m  (b1) Done / Skip / Mark Done ✓ stop and zero a running rest timer, float display unchanged.
//   B2u B2b      (b2) undo and ‹ Back keep it running on the same _ruId (neg ctl).
//   W1   a wheel scrolled 9:30 -> 10:30 and tapped inside its 90 ms window saves 10:30 (Done, Skip; layout loss on close).
//   W2   an undo tap inside the window is not flushed; the wheel's own settle commits later (neg ctl).
//   A1a A1b A1c  (a1) hero on the today lattice: Done string / Skipped string, OPEN SESSION, is-today; pending and undo.
//   A2   (a2) past-day pin: the hero stays on today, unchanged.  A3a-A3d (a3) strip ✕, ✓, date on undo, Wildcard mark.
//   K1-K3 copy scan, comments stripped.  P1 P2 (pair) pending renders and reopened footers unchanged vs V220.
//   G9   HALF_MANNY digest 0ac7da6b1691a8e1 on the candidate, self-stable (221 only; standing ruling 5, no era row).
'use strict';
process.env.TZ = 'America/New_York';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, progDigest } = H;

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';
const MANNY = '0ac7da6b1691a8e1';
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' :: ' + g)); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };
const done = () => { console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const DONE_STR = 'Done ✓ Closed out. Open the session to undo.';
const SKIP_STR = 'Skipped ✕ The week moves on. Open the session to undo.';
const SKIP_LBL = 'Skipped ✕ The week moves on';
const OLD_SKIP = 'Skipped ✕ — the week moves on';
const UNMARKED = 'Unmarked';
const FULL = { mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday' };
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const RULING_TRAIN = 70;                                  // "70 Done taps" on HALF_MANNY
const MIN_ROWS = ['', ...Array.from({ length:14 }, (_, i) => String(4 + i))];
const SEC_ROWS = [].concat(...Array(5).fill(Array.from({ length:60 }, (_, i) => String(i))));
const WROW = 44, W_SEED = '9:30', W_SEED_ROWS = [6, 150], W_TARGET_ROW = 7, W_SETTLED = '10:30';
const RT_ZERO = '0:00', RT_START = 'Start';
const START_ISO = '2026-09-21';                           // a Monday
const RealDate = Date;
const dateOf = (w, d, plus) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d) + (plus || 0), 10, 0, 0).getTime();
if(MIN_ROWS[W_SEED_ROWS[0]] !== '9' || SEC_ROWS[W_SEED_ROWS[1]] !== '30' || MIN_ROWS[W_TARGET_ROW] !== '10' || new RealDate(dateOf(1, 'mon')).getDay() !== 1){
  console.log('FAIL hand oracle self-check (wheel table or start weekday)'); fail++; done();
}

// ── ROWS (static, so a refused era fails every one by name) ──────────────────
const R = {
  F0:'F0 lattice in the block: HALF_MANNY stored with startDate ' + START_ISO + ' (Mon), blockOpen absent, clock pinned per case; ' + RULING_TRAIN + ' training days, 0 pre-signup cells on any render',
  C1:'C1 Done closes the day to This Week (overlay closed, screenWeek active), 70/70',
  C2:'C2 Skip closes the day to This Week, 70/70',
  C3:'C3 Mark Done ✓ (log nudge on a revisited logged day) closes the day to This Week and marks it complete, 70/70',
  C4:'C4 undo taps (Done ✓ and Skipped ✕, tap to undo) stay on the day: overlay open, toast `' + UNMARKED + '`, status cleared, no pop-up (neg ctl)',
  C5:'C5 the pop-up shows over This Week after Done and after Mark Done ✓',
  C6:'C6 no pop-up after Skip',
  T1:'T1 (c1) Done: #toast never shows at any 10 ms tick through +2200 ms, popOverlay shown throughout',
  T2:'T2 (c1) Skip: #toast shows `' + SKIP_LBL + '` exactly, popOverlay not shown',
  B1d:'B1d (b1) Done with the rest timer running: _ruRunning false, _ruId null, _ruElapsed 0, #rtMini ' + RT_ZERO + ', #rtToggle ' + RT_START + ', #restFloat display unchanged (block)',
  B1s:'B1s (b1) Skip with the rest timer running: stopped and zeroed as B1d',
  B1m:'B1m (b1) Mark Done ✓ with the rest timer running: stopped and zeroed as B1d',
  B2u:'B2u (b2) undo tap with the rest timer running: still running, same _ruId, interval live (neg ctl)',
  B2b:'B2b (b2) ‹ Back with the rest timer running: still running, same _ruId, interval live (neg ctl)',
  W1:'W1 pace wheel seeded ' + W_SEED + ', scrolled to ' + W_SETTLED + ', Done or Skip tapped 40 ms into the 90 ms window: ia_logs_ reads ' + W_SETTLED + ' at the tap and after (also with layout loss on close)',
  W2:'W2 undo tap 40 ms into the window is not flushed: ia_logs_ reads ' + W_SEED + ' at the tap, the wheel settles ' + W_SETTLED + ' on its own, day stays open (neg ctl)',
  A1a:'A1a (a1) today lattice, after Done: hero `Today · <Day>`, status line `' + DONE_STR + '`, CTA OPEN SESSION, is-today kept',
  A1b:'A1b (a1) today lattice, after Skip: status line `' + SKIP_STR + '`, CTA OPEN SESSION, is-today kept',
  A1c:'A1c (a1) today lattice, pending and after undo: no status string, CTA START SESSION',
  A2:'A2 (a2) past-day pin: after a past-day Done or Skip the hero is today, no status string, START SESSION, hero block byte-identical to before (neg ctl)',
  A3a:'A3a (a3) after Skip, today or past: the cell .wk-day-num prints ✕ and no .chk, in its own class (today / dim)',
  A3b:'A3b (a3) after Done, today or past: the cell prints .chk ✓ and no ✕',
  A3c:'A3c (a3) after undo: the cell prints its day of month (date arithmetic)',
  A3d:'A3d (a3) a Wildcard plus skipped day prints .wc-mark, no ✕, no .chk (D71b)',
  K1:'K1 copy, comments stripped: `' + OLD_SKIP + '` occurs once, inside resolveReminder (the parked twin)',
  K2:'K2 copy, comments stripped: handleDayStatus labels skipped as `' + SKIP_LBL + '`, no em-dash label left in it',
  K3:'K3 copy, comments stripped: `OPEN SESSION` occurs once; each hero string occurs once',
  P1:'P1 (pair) the pending week render, every training day as today (70), is byte-identical to V220; V220 equals itself; marked renders differ (comparator live)',
  P2:'P2 (pair) the reopened day body and footer, pending / Done / Skipped (210 opens), are byte-identical to V220 (footer layout and strings unchanged)',
  G9:'G9 HALF_MANNY digest ' + MANNY + ' on the candidate, self-stable (no era row)',
};
const PAIR_ROWS = ['P1', 'P2'];

// ── ENV: virtual clock + retaining DOM stub ──────────────────────────────────
function mkEnv(file){
  const IA = load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let VNOW = dateOf(1, 'mon');
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(VNOW); } static now(){ return VNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => VNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every, kind) => { const id = tid++; T.set(id, { fn, at:VNOW + Math.max(0, +ms || 0), every, kind }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0, 'timeout');
  ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1), 'interval');
  ctx.requestAnimationFrame = fn => sched(() => fn(VNOW), 16, 0, 'raf');
  ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); }; ctx.cancelAnimationFrame = id => { T.delete(id); };
  if(ctx.window && ctx.window !== ctx) Object.assign(ctx.window, { setTimeout:ctx.setTimeout, setInterval:ctx.setInterval, clearTimeout:ctx.clearTimeout,
    clearInterval:ctx.clearInterval, requestAnimationFrame:ctx.requestAnimationFrame, performance:ctx.performance, Date:FD });
  const advance = ms => { const end = VNOW + ms;
    for(let n = 0; n < 200000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if(!b) break; const [id, t] = b; VNOW = t.at; if(t.every) t.at += t.every; else T.delete(id);
      try { t.fn(); } catch(e){ errs.push(e.message); } }
    VNOW = end; };
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
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'log_notes', 'log_run_pace', 'screenWeek', 'daysList'].forEach(i => doc.getElementById(i));
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  const E = { IA, ev, LS, els, advance, T, errs, cols:[], toastShows:[], vnow:() => VNOW, setNow:t => { VNOW = t; } };
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar'))
    : sel === '.iaw-col' ? E.cols : [];
  els.detailOverlay.querySelectorAll = sel => sel === '.iaw-col' ? E.cols : [];
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  { const t = els.toast, add = t.classList.add; t.classList.add = (...c) => { if(c.includes('show')) E.toastShows.push({ t:VNOW, html:t.innerHTML }); return add(...c); }; }
  // HALF_MANNY, seed pinned, stored with a Monday start and no blockOpen (see CLOCK AND BLOCK); clock fields dropped.
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); if(cfg.seed == null) cfg.seed = 12345;
  const p = IA.buildProgram(cfg); p.id = 'measure'; p.startDate = START_ISO; delete p.blockOpen; delete p.created; delete p.createdAt;
  E.p = p;
  E.setup = () => { [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', JSON.stringify([p]));
    ctx.__P = JSON.parse(JSON.stringify(p)); ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;'); ev("showScreen('screenWeek')"); };
  E.TRAIN = []; for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){ const x = p.weeks[w][d]; if(x && !x.rest) E.TRAIN.push([w, d]); }
  E.OPEN = () => els.detailOverlay.classList.contains('open');
  E.POP = () => els.popOverlay.classList.contains('show');
  E.TOAST = () => els.toast.classList.contains('show');
  E.WEEK = () => ev('_curScreen') === 'screenWeek' && els.screenWeek.classList.contains('active');
  E.html = () => els.daysList.innerHTML || '';
  E.clearMarks = () => { LS.removeItem('ia_comp_measure'); LS.removeItem('ia_wild_measure'); };
  // a fresh case: timer idle, clock at 10:00 on (w, d)+plus, This Week showing, no overlay, no pop-up, no toast
  E.fresh = (w, d, plus) => { ev('ruReset()'); T.clear(); ev('saveCompleted({});'); LS.removeItem('ia_wild_measure'); VNOW = dateOf(w, d, plus); ev('currentWeek=' + w + ';');
    ev("showScreen('screenWeek')"); els.popOverlay.classList.remove('show'); els.toast.classList.remove('show'); els.detailOverlay.classList.remove('open'); advance(50); };
  E.open = d => { ev("openDayKey('" + d + "')"); advance(300); };
  E.tap = (d, st) => ev("handleDayStatus('" + d + "','x','" + st + "')");
  E.status = (w, d) => ev('statusOf(' + w + ",'" + d + "')");
  return E;
}

// ── RUN ──────────────────────────────────────────────────────────────────────
const t0 = Date.now();
let E, STAMP = NaN;
try { E = mkEnv(ART); STAMP = +E.IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a pre-bump development run, not a ship proof');
}
console.log('g221 D179 | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | HALF_MANNY ' + E.TRAIN.length + ' training days');
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D179 P-DONENAV (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// Baseline for the pair rows: D179's build pair is 221 against 220. Two loads: V220 must equal itself.
let B = null, B2 = null, baseWhy = '';
if(VER === ERA){
  try {
    let bf = null;
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) bf = BASEFILE; else baseWhy = 'argv[3] reads ' + b.version + '; '; }
    let tmp = null;
    if(!bf){
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d179-')); bf = path.join(tmp, 'v220.html');
      fs.writeFileSync(bf, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      baseWhy += 'baseline from git ' + V220_COMMIT.slice(0, 7);
    }
    const b1 = mkEnv(bf), b2 = mkEnv(bf);
    if(tmp) fs.rmSync(tmp, { recursive:true, force:true });
    if(+b1.IA.version === BASE_ERA){ B = b1; B2 = b2; } else { baseWhy += ' reads ' + b1.IA.version; }
  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }
}
const PAIR = VER === ERA && !!B;
console.log('  pair rows: ' + (PAIR ? 'LIVE (candidate ' + VER + ' vs V' + BASE_ERA + (baseWhy ? ', ' + baseWhy : ', argv[3]') + ')' : VER === ERA ? 'SETUP FAILED (' + baseWhy + ')' : "scoped out (candidate " + VER + " is not D179's pair)"));
const pairRow = (key, cond, got) => {
  if(PAIR) return ok(R[key], cond, got);
  if(VER === ERA) return ok(R[key] + ' (setup: ' + baseWhy + ')', false);
  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D179's build pair (221 vs 220)");
};
const safe = fn => { try { return fn(); } catch(e){ return [false, 'threw ' + (e && e.message)]; } };
const row = (key, fn) => { const r = safe(fn); ok(R[key], r[0], r[1]); };
// tallies: k -> [pass, fail, first failures]
const Q = {}; const rec = (k, c, why) => { const q = Q[k] = Q[k] || [0, 0, []]; if(c) q[0]++; else { q[1]++; if(q[2].length < 2) q[2].push(why); } };
const tally = (k, min) => { const q = Q[k] || [0, 0, []]; return [q[1] === 0 && q[0] >= (min || 1), q[0] + '/' + (q[0] + q[1]) + (q[2].length ? ' | e.g. ' + q[2].join(' | ') : '')]; };
const PRE = { n:0, renders:0 }; const notePre = h => { PRE.renders++; PRE.n += (h.match(/class="wk-day[^"]*\bpre\b/g) || []).length; };

const { ev, els, LS, advance } = E;
const TRAIN = E.TRAIN, SUB = TRAIN.filter((_, i) => i % 7 === 0);
E.setup();

// ---- C / T: close, pop-up, toast ----
for(const [w, d] of TRAIN){
  E.fresh(w, d); E.open(d); E.toastShows.length = 0; notePre(E.html());
  E.tap(d, 'complete');
  rec('C1', !E.OPEN() && E.WEEK(), 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' screen=' + ev('_curScreen'));
  rec('C5', E.POP(), 'Done W' + w + ' ' + d + ' pop=' + E.POP());
  let lit = E.TOAST(), popAll = E.POP();
  for(let t = 0; t < 2300; t += 10){ advance(10); if(E.TOAST()) lit = true; if(!E.POP()) popAll = false; }
  rec('T1', !lit && !E.toastShows.length && popAll, 'W' + w + ' ' + d + ' toast shown ' + JSON.stringify(E.toastShows.map(x => x.html)) + ' pop throughout ' + popAll);
  ev('popClose()');
}
for(const [w, d] of TRAIN){
  E.fresh(w, d); E.open(d); E.toastShows.length = 0;
  E.tap(d, 'skipped');
  rec('C2', !E.OPEN() && E.WEEK(), 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' screen=' + ev('_curScreen'));
  rec('C6', !E.POP(), 'Skip W' + w + ' ' + d + ' pop=' + E.POP());
  rec('T2', E.TOAST() && els.toast.innerHTML === SKIP_LBL && !E.POP(), 'W' + w + ' ' + d + ' toast=' + E.TOAST() + ' "' + els.toast.innerHTML + '" pop=' + E.POP());
  ev('popClose()');
}
// Mark Done ✓: the day is logged and unmarked, revisited the next day; the nudge's own onclick is the tap.
function markDoneCall(w, d){
  const lk = ev('logKey(' + w + ",'" + d + "')"), logs = JSON.parse(LS.getItem('ia_logs_measure') || '{}');
  logs[lk] = { notes:'ran it', week:w, ts:E.vnow() }; LS.setItem('ia_logs_measure', JSON.stringify(logs));
  els.log_notes.value = 'ran it'; E.open(d);
  const m = els.detailBody.innerHTML.match(/class="log-nudge-btn" onclick="(handleDayStatus\([^"]*\))">Mark Done/);
  return m ? m[1] : null;
}
for(const [w, d] of TRAIN){
  E.fresh(w, d, 1); const call = markDoneCall(w, d);
  if(!call){ rec('C3', false, 'W' + w + ' ' + d + ' no Mark Done nudge rendered'); rec('C5', false, 'Mark Done W' + w + ' ' + d + ' no nudge'); continue; }
  ev(call);
  rec('C3', !E.OPEN() && E.WEEK() && E.status(w, d) === 'complete', 'W' + w + ' ' + d + ' open=' + E.OPEN() + ' status=' + E.status(w, d));
  rec('C5', E.POP(), 'Mark Done W' + w + ' ' + d + ' pop=' + E.POP());
  ev('popClose()'); els.log_notes.value = '';
}
for(const [w, d] of TRAIN) for(const st of ['complete', 'skipped']){
  E.fresh(w, d); E.open(d); E.tap(d, st); ev('popClose()');
  E.open(d); els.toast.classList.remove('show'); els.popOverlay.classList.remove('show');
  E.tap(d, st);
  rec('C4', E.OPEN() && !E.POP() && E.TOAST() && els.toast.innerHTML === UNMARKED && E.status(w, d) === null,
    'W' + w + ' ' + d + ' ' + st + ' open=' + E.OPEN() + ' pop=' + E.POP() + ' toast="' + els.toast.innerHTML + '" status=' + E.status(w, d));
}
row('C1', () => tally('C1', RULING_TRAIN)); row('C2', () => tally('C2', RULING_TRAIN)); row('C3', () => tally('C3', RULING_TRAIN));
row('C4', () => tally('C4', 2 * RULING_TRAIN)); row('C5', () => tally('C5', 2 * RULING_TRAIN)); row('C6', () => tally('C6', RULING_TRAIN));
row('T1', () => tally('T1', RULING_TRAIN)); row('T2', () => tally('T2', RULING_TRAIN));
console.log('  close and toast lattice done | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ---- B: rest timer ----
const rt = () => ({ running:ev('_ruRunning'), id:ev('_ruId'), el:ev('_ruElapsed'), mini:String(els.rtMini.innerHTML || '').replace(/<[^>]+>/g, ''), tog:els.rtToggle.textContent, fl:els.restFloat.style.display });
const prepB = { B1d:(w, d) => { E.open(d); return () => E.tap(d, 'complete'); }, B1s:(w, d) => { E.open(d); return () => E.tap(d, 'skipped'); },
  B1m:(w, d) => { const c = markDoneCall(w, d); return () => { if(c) ev(c); }; } };
for(const k of ['B1d', 'B1s', 'B1m']) for(const [w, d] of SUB){
  E.fresh(w, d, k === 'B1m' ? 1 : 0); const go = prepB[k](w, d);
  ev('rtToggleBtn()'); advance(11000); const b = rt(); go(); const a = rt();
  // precondition: running and visibly counting (a running rest keeps _ruElapsed at 0 and prints from its start stamp)
  rec(k, b.running === true && b.id !== null && b.mini !== RT_ZERO && a.running === false && a.id === null && a.el === 0 && a.mini === RT_ZERO && a.tog === RT_START && a.fl === b.fl && a.fl === 'block',
    'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
  ev('popClose()'); els.log_notes.value = '';
}
for(const [w, d] of SUB){
  E.fresh(w, d); E.open(d); E.tap(d, 'complete'); ev('popClose()');
  E.open(d); ev('rtToggleBtn()'); advance(4000); let b = rt(); E.tap(d, 'complete'); let a = rt();
  rec('B2u', b.id !== null && a.running === true && a.id === b.id && E.T.has(a.id) && E.OPEN(), 'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
  E.fresh(w, d); E.open(d); ev('rtToggleBtn()'); advance(4000); b = rt(); ev('closeDetail()'); a = rt();
  rec('B2b', b.id !== null && a.running === true && a.id === b.id && E.T.has(a.id) && !E.OPEN(), 'W' + w + ' ' + d + ' before=' + JSON.stringify(b) + ' after=' + JSON.stringify(a));
}
const nSub = SUB.length;
row('B1d', () => tally('B1d', nSub)); row('B1s', () => tally('B1s', nSub)); row('B1m', () => tally('B1m', nSub));
row('B2u', () => tally('B2u', nSub)); row('B2b', () => tally('B2b', nSub));

// ---- W: the wheel flush, a hand-built pace wheel driven through the real iaWheelInit ----
function fakeWheel(layoutLoss){
  const lost = () => layoutLoss && !els.detailOverlay.classList.contains('open');
  const mkCol = (rows, attrs) => { const lis = {}, items = rows.map(v => ({ style:{}, getAttribute:k => k === 'data-v' ? v : null })); let st = 0;
    return { style:{}, _lis:lis, getAttribute:k => attrs[k] == null ? null : attrs[k], querySelectorAll:s => s === '.iaw-it' ? items : [],
      addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); },
      get scrollTop(){ return lost() ? 0 : st; }, set scrollTop(v){ if(!lost()) st = v; } }; };
  const c0 = mkCol(MIN_ROWS, { 'data-wrap':'', 'data-len':'15' }), c1 = mkCol(SEC_ROWS, { 'data-wrap':'1', 'data-len':'60' });
  const wh = { _iawOn:false, getAttribute:k => ({ 'data-kind':'pace', 'data-for':'log_run_pace' })[k] || null, querySelectorAll:s => s === '.iaw-col' ? [c0, c1] : [] };
  return { wh, cols:[c0, c1] };
}
let runDay = null;
E.setup();
for(const [w, d] of TRAIN){ E.fresh(w, d); E.open(d); if(/data-for="log_run_pace"/.test(els.detailBody.innerHTML)){ runDay = [w, d]; break; } }
const readPace = (w, d) => { const l = JSON.parse(LS.getItem('ia_logs_measure') || '{}')[ev('logKey(' + w + ",'" + d + "')")]; return l ? l.run_pace : '(no entry)'; };
function wheelCase(layoutLoss, st, undo){
  const [w, d] = runDay; E.fresh(w, d);
  if(undo){ E.open(d); E.tap(d, st); ev('popClose()'); }
  E.open(d); els.log_run_pace.value = W_SEED;
  const { wh, cols } = fakeWheel(layoutLoss); E.cols = cols;
  ev('iaWheelInit')({ querySelectorAll:s => s === '.iaw' ? [wh] : [] }); advance(40);
  const seeded = [cols[0].scrollTop / WROW, cols[1].scrollTop / WROW];
  cols[0].scrollTop = W_TARGET_ROW * WROW; (cols[0]._lis.scroll || []).forEach(f => f()); advance(40);
  const pending = [...E.T.values()].some(t => t.kind === 'timeout');
  E.tap(d, st); const atTap = readPace(w, d), open = E.OPEN(); advance(200); const later = readPace(w, d);
  E.cols = []; ev('popClose()');
  return { seeded, pending, atTap, later, open };
}
const seededOk = r => r.seeded[0] === W_SEED_ROWS[0] && r.seeded[1] === W_SEED_ROWS[1] && r.pending;
if(runDay){
  for(const ll of [false, true]) for(const st of ['complete', 'skipped']){ const r = wheelCase(ll, st, false);
    rec('W1', seededOk(r) && r.atTap === W_SETTLED && r.later === W_SETTLED, st + (ll ? ' layout-loss' : '') + ' ' + JSON.stringify(r)); }
  for(const st of ['complete', 'skipped']){ const r = wheelCase(false, st, true);
    rec('W2', seededOk(r) && r.atTap === W_SEED && r.later === W_SETTLED && r.open, 'undo ' + st + ' ' + JSON.stringify(r)); }
}
row('W1', () => runDay ? tally('W1', 4) : [false, 'no training day renders a log_run_pace wheel']);
row('W2', () => runDay ? tally('W2', 2) : [false, 'no training day renders a log_run_pace wheel']);
console.log('  timer and wheel done (wheel day ' + JSON.stringify(runDay) + ') | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ---- A: hero and strip (S7). A mark here pops, closes if still open, and lets toasts run out: the hero rows read the
// render the athlete lands on, independent of the close rows above.
const cells = h => { const o = {}; (h.match(/<div class="wk-day[^"]*"[^>]*>[\s\S]*?<div class="wk-day-bot"[^>]*>[\s\S]*?<\/div><\/div>/g) || []).forEach(c => {
  const lbl = (c.match(/wk-day-lbl">(\w+)</) || [])[1]; if(!lbl) return;
  o[lbl.toLowerCase()] = { cls:(c.match(/class="(wk-day[^"]*)"/) || [])[1], center:(c.match(/wk-day-num">([\s\S]*?)<\/div>/) || [])[1] }; }); return o; };
const heroBlock = h => (h.match(/<div class="wk-hero[\s\S]*?(?=<div class="wc-tag|<div class="wk-stats"|$)/) || [''])[0];
const hero = h => { const b = heroBlock(h), txt = b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { cls:(b.match(/class="(wk-hero[^"]*)"/) || [])[1] || '', over:(b.match(/wk-hero-over">([^<]*)</) || [])[1] || '',
    cta:(b.match(/class="wk-hero-cta"[^>]*>([^<]*)</) || [])[1] || '', status:(b.match(/<div class="wk-hero-status">([^<]*)<\/div>/) || [])[1] || null,
    hasDone:txt.includes(DONE_STR), hasSkip:txt.includes(SKIP_STR) }; };
const at = (w, today) => { E.T.clear(); E.setNow(dateOf(w, today)); ev('currentWeek=' + w + ';'); els.popOverlay.classList.remove('show'); };
const settle = () => { ev('popClose()'); if(E.OPEN()) ev('closeDetail()'); advance(3000); };
const markA = (dk, st) => { E.open(dk); E.tap(dk, st); settle(); };
E.setup();
const weeks = Object.keys(E.p.weeks).map(Number).sort((a, b) => a - b);
for(const w of weeks){
  const tr = DAYS.filter(d => E.p.weeks[w][d] && !E.p.weeks[w][d].rest);
  for(const T0 of tr){
    const over = 'Today · ' + FULL[T0];
    E.clearMarks(); at(w, T0); ev('renderWeekView()'); const h0 = E.html(); notePre(h0); const hp = hero(h0);
    rec('A1c', hp.over === over && hp.status === null && !hp.hasDone && !hp.hasSkip && hp.cta === 'START SESSION' && /\bis-today\b/.test(hp.cls), 'pending W' + w + ' ' + T0 + ' over="' + hp.over + '" cta=' + hp.cta + ' status=' + hp.status);
    for(const st of ['complete', 'skipped']){
      E.clearMarks(); at(w, T0); markA(T0, st); const h1 = E.html(); notePre(h1); const h = hero(h1);
      const want = st === 'complete' ? DONE_STR : SKIP_STR, other = st === 'complete' ? 'hasSkip' : 'hasDone';
      rec(st === 'complete' ? 'A1a' : 'A1b', h.over === over && h.status === want && !h[other] && h.cta === 'OPEN SESSION' && /\bis-today\b/.test(h.cls),
        st + ' W' + w + ' ' + T0 + ' over="' + h.over + '" status=' + JSON.stringify(h.status) + ' cta=' + h.cta + ' cls=' + h.cls);
      markA(T0, st); const hu = hero(E.html());
      rec('A1c', hu.over === over && hu.status === null && !hu.hasDone && !hu.hasSkip && hu.cta === 'START SESSION', 'undo ' + st + ' W' + w + ' ' + T0 + ' status=' + hu.status + ' cta=' + hu.cta);
    }
  }
  for(let i = 1; i < tr.length; i++){
    const T0 = tr[i], P0 = tr[i - 1];
    for(const [which, dk] of [['today', T0], ['past', P0]]){
      const dom = String(new RealDate(dateOf(w, dk)).getDate()), wantCls = which === 'today' ? 'wk-day today' : 'wk-day dim';
      for(const st of ['complete', 'skipped']){
        E.clearMarks(); at(w, T0); ev('renderWeekView()'); const hb = heroBlock(E.html());
        markA(dk, st); const h = E.html(); notePre(h); const c = cells(h)[dk] || {}, hh = hero(h);
        if(st === 'skipped') rec('A3a', c.cls === wantCls && c.center === '✕' && !/class="chk"/.test(c.center), which + '/skipped W' + w + ' ' + dk + ' cell=' + JSON.stringify(c));
        else rec('A3b', c.cls === wantCls && /<span class="chk">✓<\/span>/.test(c.center || '') && !/✕/.test(c.center || ''), which + '/complete W' + w + ' ' + dk + ' cell=' + JSON.stringify(c));
        if(which === 'past') rec('A2', hh.over === 'Today · ' + FULL[T0] && hh.status === null && !hh.hasDone && !hh.hasSkip && hh.cta === 'START SESSION' && heroBlock(h) === hb,
          'past/' + st + ' W' + w + ' tapped=' + dk + ' today=' + T0 + ' over="' + hh.over + '" status=' + hh.status + ' cta=' + hh.cta + ' same=' + (heroBlock(h) === hb));
        markA(dk, st); const cu = cells(E.html())[dk] || {};
        rec('A3c', cu.center === dom && cu.cls === wantCls, which + '/undo ' + st + ' W' + w + ' ' + dk + ' center=' + cu.center + ' want ' + dom);
      }
      E.clearMarks(); at(w, T0); LS.setItem('ia_wild_measure', JSON.stringify([{ week:w, dayKey:dk, title:'wc' }]));
      markA(dk, 'skipped'); const cw = cells(E.html())[dk] || {};
      rec('A3d', /class="wc-mark"/.test(cw.center || '') && !/✕/.test(cw.center || '') && !/class="chk"/.test(cw.center || ''), which + '/wildcard+skipped W' + w + ' ' + dk + ' center=' + String(cw.center || '').slice(0, 40));
    }
  }
}
const nPairs = TRAIN.length - weeks.length;                 // (today, previous training day) pairs, per week
row('A1a', () => tally('A1a', RULING_TRAIN)); row('A1b', () => tally('A1b', RULING_TRAIN)); row('A1c', () => tally('A1c', 3 * RULING_TRAIN));
row('A2', () => tally('A2', 2 * nPairs)); row('A3a', () => tally('A3a', 2 * nPairs)); row('A3b', () => tally('A3b', 2 * nPairs));
row('A3c', () => tally('A3c', 4 * nPairs)); row('A3d', () => tally('A3d', 2 * nPairs));
row('F0', () => [TRAIN.length === RULING_TRAIN && PRE.renders > 0 && PRE.n === 0 && E.p.blockOpen === undefined,
  TRAIN.length + ' training days over ' + weeks.length + ' weeks, ' + PRE.n + ' pre cells in ' + PRE.renders + ' renders']);
console.log('  hero and strip lattice done | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ---- K: copy scan, comments stripped ----
const strip = js => js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1')).join('\n');
const JS = strip(E.IA.js);
const count = (s, t) => s.split(t).length - 1;
const body = name => { const i = JS.indexOf('function ' + name + '('), k = JS.indexOf('\nfunction ', i + 1); return i < 0 ? '' : JS.slice(i, k < 0 ? undefined : k); };
row('K1', () => { const n = count(JS, OLD_SKIP), rr = body('resolveReminder'); return [n === 1 && count(rr, OLD_SKIP) === 1, 'file ' + n + ', resolveReminder ' + count(rr, OLD_SKIP)]; });
row('K2', () => { const hd = body('handleDayStatus'); return [!!hd && count(hd, "skipped:'" + SKIP_LBL + "'") === 1 && count(hd, 'Skipped ✕ —') === 0,
  'new label ' + count(hd, "skipped:'" + SKIP_LBL + "'") + ', em-dash label ' + count(hd, 'Skipped ✕ —')]; });
row('K3', () => { const a = count(JS, 'OPEN SESSION'), b = count(JS, DONE_STR), c = count(JS, SKIP_STR); return [a === 1 && b === 1 && c === 1, 'OPEN SESSION ' + a + ', Done string ' + b + ', Skipped string ' + c]; });

// ---- P: pair rows, the untouched classes against V220 ----
function pairTranscript(X){
  X.setup(); const week = [], marked = [], foot = [];
  for(const [w, d] of X.TRAIN){
    X.clearMarks(); X.T.clear(); X.setNow(dateOf(w, d)); X.ev('currentWeek=' + w + ';'); X.ev('renderWeekView()'); week.push(X.html());
    for(const st of [null, 'complete', 'skipped']){
      X.clearMarks();
      if(st) X.ev('saveCompleted({[completedKey(' + w + ",'" + d + "')]:{title:'x',ts:1,status:'" + st + "'}})");
      if(st === 'skipped'){ X.ev('renderWeekView()'); marked.push(X.html()); }
      X.open(d); foot.push(X.els.detailStatusRow.innerHTML + '\n' + X.els.detailBody.innerHTML); X.ev('closeDetail()');
    }
  }
  return { week, marked, foot };
}
if(PAIR){
  const c = pairTranscript(E), b = pairTranscript(B), b2 = pairTranscript(B2);
  const nd = (x, y) => x.filter((s, i) => s !== y[i]).length;
  const selfOk = nd(b.week, b2.week) === 0 && nd(b.foot, b2.foot) === 0 && nd(b.marked, b2.marked) === 0 && b.week.length === RULING_TRAIN;
  const live = nd(c.marked, b.marked);
  pairRow('P1', selfOk && c.week.length === b.week.length && nd(c.week, b.week) === 0 && live > 0,
    nd(c.week, b.week) + ' of ' + c.week.length + ' pending renders differ; V220 self ' + (selfOk ? 'equal' : 'UNEQUAL') + '; skipped renders differing (live) ' + live + '/' + c.marked.length);
  pairRow('P2', selfOk && c.foot.length === 3 * RULING_TRAIN && nd(c.foot, b.foot) === 0 && live > 0,
    nd(c.foot, b.foot) + ' of ' + c.foot.length + ' reopened bodies and footers differ');
} else PAIR_ROWS.forEach(k => pairRow(k, false, 'no pair'));

// ---- G9 HALF_MANNY ----
if(VER === ERA) row('G9', () => { const a = progDigest(E.IA.buildProgram(H.fixtures.HALF_MANNY)), b = progDigest(E.IA.buildProgram(H.fixtures.HALF_MANNY));
  return [a === MANNY && a === b, a + ' / ' + b]; });
else skipRow(R.G9, 'scoped out, candidate ' + VER + ': a later ruling owns HALF_MANNY (standing ruling 5)');
if(E.errs.length) console.log('  note: ' + E.errs.length + ' timer callbacks threw, e.g. ' + [...new Set(E.errs)].slice(0, 2).join(' | '));
console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
done();
