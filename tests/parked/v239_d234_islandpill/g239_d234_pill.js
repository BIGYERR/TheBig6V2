'use strict';
// g239_d234_pill.js: GATE for D234 P-ISLANDPILL (inside the native app, with the island confirmed, the rest tab is a pill
// around the cutout and the card hangs from it; with no island, and on the PWA, the V238 tab).
//
//   node tests/gates/g239_d234_pill.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v239_rulings/v239_ruling_d234.md: R1 to R7, "Gate rows", Mario's concurrence,
// Amendment 1 (R5a-R5d and gate row D234-native-intro, replacing D234-native-nointro) and Amendment 2 (R2a-R2d and the
// three added D234-native-pill assertions). Row names: tests/measure/v239_rulings/v239_row_ruled.txt, the D234 block.
// Sibling of g239_d233_island.js (D233); this file is keyed to D234. Sabotage: tests/sabotage/v239_d234.json.
//
// ORACLES. Never the engine. (1) A stub window.iaIsland whose run/stop/end log [name, arg], with hasIsland true (the pill),
// false, absent, or the string "1" (all three: the tab). It is installed after boot and before the first in-program
// screen, the moment _rtInit reads the flag. (2) A fake scheduler (setTimeout / setInterval / rAF) the gate advances by
// hand, and independent fake Date.now / performance.now. (3) A matchMedia stub for prefers-reduced-motion. (4) Hand
// values: 92340 ms reads 1:32, 599000 9:59, 600000 10:00, 3600000 60:00 (m:ss, minutes unbounded: Amendment 2 finding i);
// five characters and more carry rt-five (R2d); V238's #restFloat text nodes and aria-labels, typed from
// `git show HEAD:index.html` (HEAD = V238); V238's intro strings and the #restFloat CSS rule from the same source; the
// tab-arm drag on this gate's DOM stub (offsetTop 0, frame width 393, innerHeight 852): pointerdown (380, 420), move to
// (40, 520): top 0 + 100 = 100px inside 8..844, then the centre 0 < 393 / 2 snaps the side to left; the timer glyph's
// circle r="8" (slice D's path) and the stroked pause's width="4" height="16" (ASY_ICON_PATHS.pause, V238).
// STATE READS. _rtDragging, _rtSide, _rtIntroTO and _rtIntroPending are top-level `let`s. The harness runs every IA.eval
// in the page script's own VM context, so they read directly (g221 reads _ruRunning the same way); no row needs a proxy.
// DOM. A retaining stub (g221's shape): #rtTab starts with its two V238 children (#rtChev, #rtMini), so "last child" is
// a real claim; elements keep style, classList, attributes, children and listeners; dispatch() fires a listener with
// a target whose closest() finds nothing (a tap on the body, never on a button).
//
// VERSION PREDICATE (standing rulings 2 and 4). D234 ships at ia-version 239, read from the candidate's meta.
//   below 239      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   239 and up     every row asserts (a minimum, never one exact version).
// On the V238 body relabelled 239 the native rows FAIL on a data conjunct. D234-pwa-tab and D234-copy PASS there by
// design: both are no-change claims (R1/R6 and R7); the spec trips each.
//
// ROWS (ids are the licence file's names)
//   D234-pwa-tab         no plugin, first program: the V238 intro (rtCardIntro, tab hidden, rtPillSettle at 2200,
//                        cleared at 2620); then the tab shown at idle, stacked 0:00, no pill class, no glyph; pointerdown
//                        sets _rtDragging, the move sets top 100px, pointerup clears it and snaps the side left; the V238
//                        #restFloat rule (z 240) and the V238 strings stand.
//   D234-native-noisland hasIsland false, absent and "1": every observation of D234-pwa-tab, equal to the PWA's, and the
//                        clock follows Date.now (92340 with performance moved 600000; D233).
//   D234-native-pill     hasIsland true: pill class; #rtTab flex at idle reading 0:00 (plain text); 1:32 with no hundredths
//                        after 92340, .run while running and not stopped; glyph non-empty: timer idle and running, pause
//                        stopped; #rtGlyph the last child of #rtTab, its SVG width="12"; 9:59 without rt-five, 10:00 with
//                        it, 60:00 with it.
//   D234-native-tap      a pill tap opens #rtCard and the pill stays displayed; a second tap closes it; tap again, then the
//                        minimize button (rtCollapse) closes it.
//   D234-native-nodrag   the D234-pwa-tab pointer sequence on the pill and on its card: _rtDragging stays false,
//                        #rtAnchor.style.top and _rtSide unchanged.
//   D234-native-intro    Amendment 1 points: (1) first in-program screen: _rtIntroPending false, _rtIntroTO set, card block,
//                        its animation rtPillDrop (never rtCardIntro), pill flex; at 2300 (the fold) _rtIntroTO still set,
//                        card block; (2) at 2540 card none, pill animation rtPillEcho, _rtIntroTO null; at 2960 empty;
//                        (3) pill tap at 500: _rtIntroTO null, card none, both animations empty, no plugin call; (4) Start
//                        at 500: log exactly [run(D0)], card none; (5) reduced motion: card none at 0, block at 500 with no
//                        animation, none at 2200, the pill never animates; (R5b) a card-body tap at 500 closes the card and
//                        clears _rtIntroTO; outside the intro a card-body tap leaves the open card open.
//   D234-native-screens  hasIsland true: week, progress and bugs show the frame (block) with the pill class and the pill
//                        flex; Home and the wizard hide it (none); back on week it shows.
//   D234-noislandcall    hasIsland true, through the card: pill tap, Start at D0, 92340 later Stop, Reset, pill tap: the
//                        log is exactly D233's [run(D0), stop(92340), stop(92340), end()] (Reset stops then ends), and the
//                        same as hasIsland false; no other call while the card opens, ticks and closes.
//   D234-copy            the candidate's static #restFloat text nodes and aria-labels equal V238's hand table; at runtime
//                        the pill's glyph carries no text (SVG only) and only aria-hidden; no aria-label is written by JS.

const fs = require('fs');
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const S = require(path.join(__dirname, '..', 'status'))('g239_d234_pill');

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const ERA = 239;
const J = JSON.stringify;

const LABEL = {
  'D234-pwa-tab':         'D234-pwa-tab (VER >= 239) no plugin: the V238 intro, tab shown at idle (stacked 0:00, no pill), pointerdown sets _rtDragging, the move and side snap as V238, z 240 rule and strings as V238',
  'D234-native-noisland': 'D234-native-noisland (VER >= 239) hasIsland false, absent and "1": identical to D234-pwa-tab, and the clock follows Date.now (D233)',
  'D234-native-pill':     'D234-native-pill (VER >= 239) hasIsland true: pill class, 0:00 at idle, 1:32 no hundredths, .run only running, glyph timer/pause as the last child at width 12, 9:59 plain, 10:00 and 60:00 with rt-five',
  'D234-native-tap':      'D234-native-tap (VER >= 239) a pill tap opens the card and the pill stays shown; a second tap closes it; the minimize button closes it',
  'D234-native-nodrag':   'D234-native-nodrag (VER >= 239) the tab-arm pointer sequence on the pill and its card leaves _rtDragging false, #rtAnchor top and _rtSide unchanged',
  'D234-native-intro':    'D234-native-intro (VER >= 239) Amendment 1: rtPillDrop with the pill shown, fold holds _rtIntroTO, rtPillEcho then cleared; pill tap and Start at 500 end it; reduced motion has no animation; a card-body tap ends it, and outside it does nothing',
  'D234-native-screens':  'D234-native-screens (VER >= 239) hasIsland true: the pill is shown on week, progress and bugs; hidden on Home and the wizard',
  'D234-noislandcall':    'D234-noislandcall (VER >= 239) Start, Stop, Reset through the card with the pill log exactly D233\'s [run(D0), stop(92340), stop(92340), end()], as with no island',
  'D234-copy':            'D234-copy (VER >= 239) #restFloat text nodes and aria-labels equal V238\'s; the pill\'s glyph adds no text and no label',
};
S.declare(Object.keys(LABEL));

// ── hand oracles (V238 = git show HEAD:index.html at the start of V239) ───────────────────────────────────────────────
const V238_TEXT = ['‹', 'Rest Timer', '›', '0:00', '.00', 'Start', 'Reset'];   // &#8249; and &#8250; decoded
const V238_ARIA = ['Rest timer, tap to open', 'Minimize'];
const V238_FLOAT_CSS = '#restFloat{display:none;position:fixed;top:0;left:0;right:0;height:0;max-width:430px;margin:0 auto;z-index:240;pointer-events:none;}';
const V238_INTRO = 'rtCardIntro 1.9s cubic-bezier(.34,1.25,.5,1) .3s 1 both';
const V238_SETTLE = 'rtPillSettle .34s cubic-bezier(.34,1.4,.5,1) 1 both';
const STACK0 = '<span>0</span><span><span style="opacity:.7">:</span></span><span>0</span><span>0</span>';
const DOWN = [380, 420], MOVE = [40, 520], DRAG_TOP = '100px', FRAME_W = 393;
const T92 = 92340, SKEW = 600000;
const CLOCK = [[599000, '9:59', false], [600000, '10:00', true], [3600000, '60:00', true]];
const DROP = 'rtPillDrop', ECHO = 'rtPillEcho';
const TIMER_MARK = 'r="8"', PAUSE_MARK = 'width="4" height="16"';
{ // the arithmetic, typed out
  const mmss = ms => { const ts = Math.floor(ms / 1000); return Math.floor(ts / 60) + ':' + String(ts % 60).padStart(2, '0'); };
  if(mmss(T92) !== '1:32' || CLOCK.some(([ms, s, five]) => mmss(ms) !== s || (s.length >= 5) !== five) || 0 + (MOVE[1] - DOWN[1]) + 'px' !== DRAG_TOP
     || !(0 < FRAME_W / 2) || 852 - 0 - 8 < 100) throw new Error('hand oracle self-check');
}

// ── version ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM_ = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM_ ? +VM_[1] : 0;
const verCj = () => ['ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
S.info('g239 D234 P-ISLANDPILL | candidate ' + ART + ' ia-version ' + VER);
if(!(VER >= ERA)) S.info('REFUSED: ia-version ' + VER + ' predates D234 (V' + ERA + '). Every row runs and FAILS by its version conjunct.');

// ── env: a fresh load per case ─────────────────────────────────────────────────────────────────────────────────────────
const RealDate = Date;
let PROG = null;
function env(o){
  const IA = H.load(ART), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let DNOW = new RealDate(2026, 8, 21, 10, 0, 0).getTime(), PNOW = 5000000, TNOW = 0;
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(DNOW); } static now(){ return DNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => PNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every) => { const id = tid++; T.set(id, { fn, at:TNOW + Math.max(0, +ms || 0), every }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0); ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); };
  ctx.requestAnimationFrame = fn => sched(() => fn(TNOW), 16, 0); ctx.cancelAnimationFrame = id => { T.delete(id); };
  const run = ms => { const end = TNOW + ms;
    for(let n = 0; n < 200000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if(!b) break; const [id, t] = b; TNOW = t.at; if(t.every) t.at += t.every; else T.delete(id); try { t.fn(); } catch(e){ errs.push(e.message); } }
    TNOW = end; };
  const els = {};
  const RECT = { restFloat:{ left:0, top:0, width:FRAME_W, height:0 } };
  function mk(id){
    const cls = new Set(), lis = {}, attrs = {};
    const e = { id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{}, children:[], attrs, lis, offsetWidth:0, offsetHeight:0, offsetTop:0, offsetLeft:0,
      classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)),
        toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
      addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){},
      dispatchEvent:() => true, setAttribute(k, v){ attrs[k] = String(v); }, getAttribute(k){ return k in attrs ? attrs[k] : null; }, removeAttribute(k){ delete attrs[k]; },
      appendChild(c){ e.children.push(c); if(c && c.id) els[c.id] = c; return c; }, insertBefore(c, ref){ const i = e.children.indexOf(ref); if(i < 0) e.children.push(c); else e.children.splice(i, 0, c); if(c && c.id) els[c.id] = c; return c; },
      removeChild(){}, remove(){}, insertAdjacentHTML(){}, get firstChild(){ return e.children[0] || null; }, get lastChild(){ return e.children[e.children.length - 1] || null; },
      querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, setPointerCapture(){},
      getBoundingClientRect(){ return RECT[e.id] || { top:0, left:0, width:0, height:0, bottom:0, right:0 }; }, scrollIntoView(){}, focus(){}, blur(){},
      get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x)); } };
    return e;
  }
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  let created = 0; doc.createElement = () => { created++; return mk(''); };
  doc.addEventListener = function(){};
  ['restFloat', 'rtAnchor', 'rtTab', 'rtChev', 'rtMini', 'rtCard', 'rtNub', 'rtBig', 'rtCs', 'rtToggle', 'popOverlay', 'toast', 'detailOverlay', 'detailBody'].forEach(i => doc.getElementById(i));
  els.rtTab.children.push(els.rtChev, els.rtMini);
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar')) : [];
  ctx.matchMedia = q => ({ matches:!!o.reduce && /prefers-reduced-motion/.test(q), media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  ctx.popConfetti = function(){};
  if(!PROG){ const cfg = JSON.parse(J(H.fixtures.HALF_MANNY)); if(cfg.seed == null) cfg.seed = 12345; const p = IA.buildProgram(cfg); p.id = 'measure'; delete p.created; delete p.createdAt; PROG = J(p); }
  LS.setItem('ia_programs', J([JSON.parse(PROG)])); ctx.__P = JSON.parse(PROG); ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  const log = [];
  if(o.flag !== undefined){
    const pl = { run(a){ log.push(['run', a]); }, stop(a){ log.push(['stop', a]); }, end(){ log.push(['end']); } };
    if(o.flag !== 'absent') pl.hasIsland = o.flag;
    ctx.iaIsland = pl;
  }
  ev('_rtIntroPending=' + (o.intro ? 'true' : 'false') + ';');
  const E = { ev, els, log, errs, SCREENS, created:() => created, has:id => id in els };
  E.go = scr => ev("showScreen('" + scr + "')");
  E.go('screenWeek');                                   // the first in-program screen: updateRestFloat -> _rtInit (reads the flag)
  E.adv = ms => { DNOW += ms; PNOW += ms; run(ms); };   // wall time: every clock moves together
  E.tick = (dD, dP) => { DNOW += dD; PNOW += dP; run(50); };   // the two fake clocks apart, then the 33 ms tick renders
  E.dnow = () => DNOW;
  E.now = () => ev('_ruNow()');
  E.TO = () => ev('_rtIntroTO') !== null;
  E.st = () => ({ card:els.rtCard.style.display || '', cardAnim:els.rtCard.style.animation || '', tab:els.rtTab.style.display || '',
    tabAnim:els.rtTab.style.animation || '', TO:E.TO() });
  E.mini = () => els.rtMini.innerHTML;
  E.pill = () => els.restFloat.classList.contains('rt-pill');
  const fire = (el, type, x, y) => (el.lis[type] || []).forEach(f => f({ type, target:el, currentTarget:el, clientX:x, clientY:y, pointerId:1, cancelable:true, preventDefault(){} }));
  E.tap = el => fire(el, 'click', 0, 0);
  E.drag = el => { fire(el, 'pointerdown', DOWN[0], DOWN[1]); const d = ev('_rtDragging'); fire(el, 'pointermove', MOVE[0], MOVE[1]);
    const top = els.rtAnchor.style.top || ''; fire(el, 'pointerup', MOVE[0], MOVE[1]); return { down:d, top, up:ev('_rtDragging'), side:ev('_rtSide') }; };
  return E;
}
const name = a => String(a || '').split(' ')[0];

const row = (id, fn) => {
  let cj;
  try { cj = fn(); } catch(e){ cj = [['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]; }
  cj.unshift(verCj());
  const bad = cj.filter(c => !c[1]);
  for(const c of bad) S.info(id + ' ' + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id], bad.map(c => c[0]).join(', ') + (bad.length ? ' failed (INFO lines above)' : ''));
};

// ── the static #restFloat markup (D234-copy, D234-pwa-tab) ─────────────────────────────────────────────────────────────
function markup(){
  const i = HTML.indexOf('<div id="restFloat">'); if(i < 0) return null;
  const j = HTML.indexOf('\n</div>\n', i); const blk = HTML.slice(i, j < 0 ? i : j + 7);
  const dec = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
  const text = blk.replace(/<[^>]*>/g, '\n').split('\n').map(s => dec(s).trim()).filter(Boolean);
  const aria = [...blk.matchAll(/aria-label="([^"]*)"/g)].map(m => dec(m[1]));
  return { text, aria };
}
const copyCj = () => { const m = markup(); return [['strings', !!m && J(m.text) === J(V238_TEXT) && J(m.aria) === J(V238_ARIA),
  'text ' + (m && J(m.text)) + ' aria ' + (m && J(m.aria)) + ' (hand ' + J(V238_TEXT) + ' ' + J(V238_ARIA) + ')']]; };

// ── the tab arm's observation (D234-pwa-tab, D234-native-noisland) ───────────────────────────────────────────────────────
function tabObs(flag){
  const E = env({ flag, intro:true }), ob = {};
  ob.introStart = E.st();
  E.adv(2200); ob.afterIntro = E.st();
  E.adv(420); ob.cleared = E.st();
  ob.idle = { float:E.els.restFloat.style.display, tab:E.els.rtTab.style.display, mini:E.mini(), pill:E.pill(), glyph:E.has('rtGlyph'), created:E.created() };
  ob.drag = E.drag(E.els.rtTab);
  E.ev('rtToggleBtn()'); E.tick(T92, SKEW); const clock = E.now(); E.ev('rtResetBtn()');
  return { ob, clock };
}
const tabCj = ob => [
  ['intro', ob.introStart.TO && ob.introStart.cardAnim === V238_INTRO && ob.introStart.tab === 'none' && ob.introStart.card === 'block'
    && ob.afterIntro.card === 'none' && ob.afterIntro.tab === 'flex' && ob.afterIntro.tabAnim === V238_SETTLE && ob.cleared.tabAnim === '',
    J([ob.introStart, ob.afterIntro, ob.cleared]) + ' (hand ' + V238_INTRO + ' tab none, then card none tab flex ' + V238_SETTLE + ', then empty)'],
  ['idle', ob.idle.float === 'block' && ob.idle.tab === 'flex' && ob.idle.mini === STACK0 && !ob.idle.pill && !ob.idle.glyph && ob.idle.created === 0,
    J(ob.idle) + ' (hand block flex stacked 0:00, no pill class, no glyph, nothing created)'],
  ['drag', ob.drag.down === true && ob.drag.top === DRAG_TOP && ob.drag.up === false && ob.drag.side === 'left', J(ob.drag) + ' (hand down true, top 100px, up false, side left)'],
  ['z240', HTML.split(V238_FLOAT_CSS).length - 1 === 1, 'the V238 #restFloat rule (z-index 240) present once'],
];

let PWA = null;
row('D234-pwa-tab', () => { PWA = tabObs(undefined); return tabCj(PWA.ob).concat(copyCj()); });

row('D234-native-noisland', () => {
  const cj = [];
  for(const flag of [false, 'absent', '1']){
    const r = tabObs(flag), tag = 'hasIsland ' + J(flag);
    tabCj(r.ob).forEach(c => cj.push([tag + ' ' + c[0], c[1], c[2]]));
    cj.push([tag + ' same-as-pwa', !!PWA && J(r.ob) === J(PWA.ob), PWA ? 'differs from the no-plugin run: ' + J(r.ob) : 'no PWA observation']);
    cj.push([tag + ' clock', r.clock === T92, 'now ' + r.clock + ' (hand 92340: Date moved 92340, performance 600000)']);
  }
  return cj;
});

row('D234-native-pill', () => {
  const E = env({ flag:true }), cj = [], g = () => E.has('rtGlyph') ? E.els.rtGlyph : null;
  const gl = g(), last = E.els.rtTab.lastChild;
  cj.push(['class', E.pill(), 'restFloat class ' + J(E.els.restFloat.className)]);
  cj.push(['idle', E.els.rtTab.style.display === 'flex' && E.mini() === '0:00' && !E.els.rtMini.classList.contains('run'), 'tab ' + E.els.rtTab.style.display + ' mini ' + J(E.mini()) + ' (hand flex 0:00)']);
  cj.push(['glyph-last', !!gl && last === gl && /width="12"/.test(gl.innerHTML), 'last child ' + (last && last.id) + ', glyph svg ' + (gl ? J(gl.innerHTML.slice(0, 40)) : 'none') + ' (hand #rtGlyph, width="12")']);
  cj.push(['glyph-idle', !!gl && gl.innerHTML.includes(TIMER_MARK), 'idle glyph timer']);
  E.ev('rtToggleBtn()'); E.tick(T92, 7);
  cj.push(['running', E.mini() === '1:32' && !E.mini().includes('.') && E.els.rtMini.classList.contains('run') && !!gl && gl.innerHTML.includes(TIMER_MARK),
    'mini ' + J(E.mini()) + ' run ' + E.els.rtMini.classList.contains('run') + ' (hand 1:32, no hundredths, .run, timer)']);
  E.ev('rtToggleBtn()');
  cj.push(['stopped', E.mini() === '1:32' && !E.els.rtMini.classList.contains('run') && !!gl && gl.innerHTML.includes(PAUSE_MARK),
    'mini ' + J(E.mini()) + ' run ' + E.els.rtMini.classList.contains('run') + ' (hand 1:32, no .run, pause)']);
  E.ev('rtResetBtn()'); E.ev('rtToggleBtn()');
  let at = 0;
  for(const [ms, s, five] of CLOCK){ E.tick(ms - at, 7); at = ms; const m = E.mini(), f = E.els.rtMini.classList.contains('rt-five');
    cj.push(['clock ' + ms, m === s && f === five, 'mini ' + J(m) + ' rt-five ' + f + ' (hand ' + s + ' ' + five + ')']); }
  E.ev('rtResetBtn()');
  return cj;
});

row('D234-native-tap', () => {
  const E = env({ flag:true }), cj = [];
  E.tap(E.els.rtTab); let s = E.st(); cj.push(['open', s.card === 'block' && s.tab === 'flex', J(s) + ' (hand card block, pill flex)']);
  E.tap(E.els.rtTab); s = E.st(); cj.push(['second-tap', s.card === 'none' && s.tab === 'flex', J(s) + ' (hand card none, pill flex)']);
  E.tap(E.els.rtTab); E.ev('rtCollapse()'); s = E.st(); cj.push(['minimize', s.card === 'none' && s.tab === 'flex', J(s) + ' (hand card none, pill flex)']);
  return cj;
});

row('D234-native-nodrag', () => {
  const E = env({ flag:true }), cj = [];
  for(const el of ['rtTab', 'rtCard']){
    const top0 = E.els.rtAnchor.style.top || '', side0 = E.ev('_rtSide'), d = E.drag(E.els[el]);
    cj.push([el, d.down === false && d.up === false && d.top === top0 && d.side === side0 && side0 === 'right', J(d) + ' before top ' + J(top0) + ' side ' + side0 + ' (hand false, unchanged, right)']);
  }
  return cj;
});

row('D234-native-intro', () => {
  const cj = [];
  { const E = env({ flag:true, intro:true }); let s = E.st();
    cj.push(['(1)', E.ev('_rtIntroPending') === false && s.TO && s.card === 'block' && name(s.cardAnim) === DROP && s.tab === 'flex',
      'pending ' + E.ev('_rtIntroPending') + ' ' + J(s) + ' (hand false, set, block, ' + DROP + ', pill flex)']);
    E.adv(2300); s = E.st(); cj.push(['fold', s.TO && s.card === 'block' && name(s.cardAnim) === DROP && s.tab === 'flex', 't 2300 ' + J(s) + ' (hand set, block, ' + DROP + ', flex)']);
    E.adv(240); s = E.st(); cj.push(['(2)', !s.TO && s.card === 'none' && name(s.tabAnim) === ECHO && s.tab === 'flex', 't 2540 ' + J(s) + ' (hand null, none, ' + ECHO + ', flex)']);
    E.adv(420); s = E.st(); cj.push(['(2) cleared', s.tabAnim === '' && s.tab === 'flex', 't 2960 ' + J(s) + ' (hand empty, flex)']); }
  { const E = env({ flag:true, intro:true }); E.adv(500); E.tap(E.els.rtTab); const s = E.st();
    cj.push(['(3)', !s.TO && s.card === 'none' && s.cardAnim === '' && s.tabAnim === '' && E.log.length === 0, 'pill tap at 500 ' + J(s) + ' log ' + J(E.log) + ' (hand null, none, empty, empty, [])']); }
  { const E = env({ flag:true, intro:true }); E.adv(500); const D0 = E.dnow(); E.ev('rtToggleBtn()'); const s = E.st();
    cj.push(['(4)', J(E.log) === J([['run', D0]]) && s.card === 'none', 'Start at 500 log ' + J(E.log) + ' ' + J(s) + ' (hand [["run",' + D0 + ']], none)']); E.ev('rtResetBtn()'); }
  { const E = env({ flag:true, intro:true, reduce:true }); const a = E.st(); E.adv(500); const b = E.st(); E.adv(1700); const c = E.st(); E.adv(800); const d = E.st();
    cj.push(['(5)', a.card === 'none' && b.card === 'block' && b.cardAnim === '' && c.card === 'none' && [a, b, c, d].every(x => x.tabAnim === '' && x.cardAnim === ''),
      'reduce 0/500/2200/3000 ' + J([a, b, c, d]) + ' (hand none, block no animation, none; never an animation)']); }
  { const E = env({ flag:true, intro:true }); E.adv(500); E.tap(E.els.rtCard); let s = E.st();
    cj.push(['card-tap', !s.TO && s.card === 'none' && s.cardAnim === '', 'card-body tap at 500 ' + J(s) + ' (hand null, none, empty)']);
    E.tap(E.els.rtTab); E.tap(E.els.rtCard); s = E.st();
    cj.push(['card-tap-outside', s.card === 'block' && s.tab === 'flex' && !s.TO, 'open, then a card-body tap ' + J(s) + ' (hand still block)']); }
  return cj;
});

row('D234-native-screens', () => {
  const E = env({ flag:true }), cj = [];
  const want = [['screenWeek', true], ['screenProgress', true], ['screenBugs', true], ['screenHome', false], ['screenWizard', false], ['screenWeek', true]];
  cj.push(['screens-exist', want.every(([s]) => E.SCREENS.includes(s)), 'screens ' + J(E.SCREENS)]);
  for(const [scr, shown] of want){
    E.go(scr); const f = E.els.restFloat.style.display, t = E.els.rtTab.style.display, p = E.pill();
    cj.push([scr, shown ? (f === 'block' && t === 'flex' && p) : f === 'none', 'display ' + f + ' pill ' + p + ' tab ' + t + ' (hand ' + (shown ? 'block, pill, flex' : 'none') + ')']);
  }
  return cj;
});

row('D234-noislandcall', () => {
  const runSeq = flag => { const E = env({ flag }); if(flag === true) E.tap(E.els.rtTab); else E.ev('rtExpand()');
    const D0 = E.dnow(); E.ev('rtToggleBtn()'); E.tick(T92, 7); E.ev('rtToggleBtn()'); E.ev('rtResetBtn()');
    if(flag === true) E.tap(E.els.rtTab); else E.ev('rtCollapse()'); E.adv(1000); return { log:J(E.log), D0 }; };
  const p = runSeq(true), n = runSeq(false), hand = J([['run', p.D0], ['stop', T92], ['stop', T92], ['end']]);
  return [['pill', p.log === hand, 'log ' + p.log + ' (hand ' + hand + ')'],
          ['same-as-noisland', p.log.replace(String(p.D0), 'D0') === n.log.replace(String(n.D0), 'D0'), 'pill ' + p.log + ' no island ' + n.log]];
});

row('D234-copy', () => {
  const cj = copyCj();
  const E = env({ flag:true }); E.ev('rtToggleBtn()'); E.tick(T92, 7); E.ev('rtToggleBtn()');
  const gl = E.has('rtGlyph') ? E.els.rtGlyph : null, gtext = gl ? gl.innerHTML.replace(/<[^>]*>/g, '').trim() : null;
  cj.push(['glyph-text', gl !== null ? gtext === '' && J(gl.attrs) === J({ 'aria-hidden':'true' }) : true,
    gl ? 'glyph text ' + J(gtext) + ' attrs ' + J(gl.attrs) + ' (hand "" and only aria-hidden)' : 'no glyph on this body']);
  cj.push(['no-js-label', !('aria-label' in E.els.rtTab.attrs) && !('aria-label' in E.els.rtCard.attrs) && !('title' in E.els.rtTab.attrs),
    'attributes written by JS on the pill ' + J(E.els.rtTab.attrs) + ' and card ' + J(E.els.rtCard.attrs) + ' (hand none)']);
  E.ev('rtResetBtn()');
  return cj;
});

S.summary();
