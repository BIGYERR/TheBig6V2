// v221 measure (Mode B): P-DONENAV pending measures on the current artifact.
// Usage: node tests/measure/v221_donenav_pending.js <artifact.html> [<previous artifact.html>]
//  (a) strip cell + Today hero after Done / Skip on today's and on a past training day, then the closeDetail path
//  (b) rest timer float and its interval handle before/after closeDetail
//  (c) toast vs completion pop-up: CSS z-index, DOM parentage, show/hide timing on a virtual clock
// Oracle: DOM classes/innerHTML read off a retaining stub, CSS rules grepped from source, and date arithmetic
// for "which day is today" (startDate Monday 2026-09-21 + (week-1)*7 + weekday offset). Never an engine return.
// Time: this script replaces the harness's queue-only timer stubs with a virtual-clock scheduler (setTimeout,
// setInterval, requestAnimationFrame all RUN when advance(ms) passes their due time; clear* actually clears),
// and pins Date/performance.now to the virtual clock.
process.env.TZ = 'America/New_York';
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const PREV = process.argv[3] || null;
const IA = H.load(ART);
const ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
console.log('artifact', ART, 'ia-version', IA.version);

// ---- virtual clock + scheduler ----
let VNOW = new Date(2026, 8, 21, 10, 0, 0).getTime();
const RealDate = Date;
class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(VNOW); } static now(){ return VNOW; } }
ctx.Date = FD; ctx.performance = { now: () => VNOW };
let tid = 1; const T = new Map(); let firedLog = [];
function sched(fn, ms, every, kind){ const id = tid++; T.set(id, { fn, at: VNOW + Math.max(0, +ms || 0), every, kind }); return id; }
ctx.setTimeout = (fn, ms) => sched(fn, ms, 0, 'timeout');
ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1), 'interval');
ctx.requestAnimationFrame = fn => sched(() => fn(VNOW), 16, 0, 'raf');
ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); }; ctx.cancelAnimationFrame = id => { T.delete(id); };
if (ctx.window && ctx.window !== ctx) Object.assign(ctx.window, { setTimeout: ctx.setTimeout, setInterval: ctx.setInterval, clearTimeout: ctx.clearTimeout, clearInterval: ctx.clearInterval, requestAnimationFrame: ctx.requestAnimationFrame, performance: ctx.performance, Date: FD });
function advance(ms){ const end = VNOW + ms; let n = 0;
  for(;;){ let best = null; for (const [id, t] of T) if (t.at <= end && (!best || t.at < best[1].at)) best = [id, t];
    if (!best || n > 200000) break; const [id, t] = best; VNOW = t.at;
    if (t.every) t.at += t.every; else T.delete(id);
    try { t.fn(); } catch (e) { firedLog.push('threw ' + e.message); } n++; }
  VNOW = end; return n; }
const liveIntervals = () => [...T.values()].filter(t => t.kind === 'interval').length;

// ---- retaining DOM (same shape as v221_done_nav.js) ----
const els = {};
function mk(id){
  const cls = new Set(), lis = {};
  const e = { id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{}, children:[], offsetWidth:0, offsetHeight:0, offsetTop:0, offsetLeft:0,
    classList:{ add:(...c)=>c.forEach(x=>cls.add(x)), remove:(...c)=>c.forEach(x=>cls.delete(x)),
      toggle:(c,f)=>{ const on = f===undefined ? !cls.has(c) : !!f; on?cls.add(c):cls.delete(c); return on; }, contains:c=>cls.has(c) },
    addEventListener:(t,fn)=>{ (lis[t]=lis[t]||[]).push(fn); }, removeEventListener(){},
    fire:t=>(lis[t]||[]).forEach(f=>f({target:e,currentTarget:e})), _lis:lis,
    setAttribute(){}, getAttribute(){return null;}, appendChild(){}, removeChild(){}, remove(){}, insertAdjacentHTML(){},
    querySelector(){return null;}, querySelectorAll(){return [];}, closest(){return null;}, setPointerCapture(){},
    getBoundingClientRect(){return {top:0,left:0,width:0,height:0,bottom:0,right:0};}, scrollIntoView(){}, focus(){}, blur(){},
    get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x=>cls.add(x)); } };
  return e;
}
const doc = ctx.document;
doc.getElementById = id => (els[id] || (els[id] = mk(id)));
if (!doc.addEventListener) doc.addEventListener = function(){};
const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g)||[]).map(s=>s.match(/id="(\w+)"/)[1]))];
SCREENS.forEach(s=>{ doc.getElementById(s).classList.add('screen'); });
doc.querySelectorAll = sel => sel==='.screen' ? SCREENS.map(s=>els[s]) : sel==='.screen.with-tabbar' ? SCREENS.map(s=>els[s]).filter(e=>e.classList.contains('with-tabbar')) : [];
ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
// showToast is NOT stubbed: the real one runs, so its 2.2 s hide timer lands on the virtual clock.
const toastEvents = []; // {t, show}
(function wrapToast(){ const t = doc.getElementById('toast'); const add = t.classList.add, rem = t.classList.remove;
  t.classList.add = (...c) => { if (c.includes('show')) toastEvents.push({ t: VNOW, ev: 'show', html: t.innerHTML }); return add(...c); };
  t.classList.remove = (...c) => { if (c.includes('show')) toastEvents.push({ t: VNOW, ev: 'hide' }); return rem(...c); }; })();
const popEvents = [];
(function wrapPop(){ const p = doc.getElementById('popOverlay'); const add = p.classList.add, rem = p.classList.remove;
  p.classList.add = (...c) => { if (c.includes('show')) popEvents.push({ t: VNOW, ev: 'show', toastShowing: els.toast.classList.contains('show') }); return add(...c); };
  p.classList.remove = (...c) => { if (c.includes('show')) popEvents.push({ t: VNOW, ev: 'hide' }); return rem(...c); }; })();

const lineOf = re => { const L = src.split('\n'); const o=[]; L.forEach((l,i)=>{ if(re.test(l)) o.push(i+1); }); return o; };
const FX = (typeof H.fixtures==='function'?H.fixtures():H.fixtures); const names = Object.keys(FX);
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const START = '2026-09-21';
const dateOf = (w, d) => new RealDate(2026, 8, 21 + (w-1)*7 + DAYS.indexOf(d), 10, 0, 0).getTime();   // independent date arithmetic
function setup(cfg){
  [...LS._map.keys()].forEach(k=>LS.removeItem(k));
  const p = IA.buildProgram(cfg); p.id='measure'; p.startDate=START;
  LS.setItem('ia_programs', JSON.stringify([p]));
  ctx.__P = p; ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  ev("showScreen('screenWeek')");
  return p;
}
const weekHTML = () => { const e = Object.values(els).find(x => typeof x.innerHTML === 'string' && x.innerHTML.includes('wk-strip')); return e ? e.innerHTML : ''; };
const strip = html => { const m = html.match(/<div class="wk-strip">([\s\S]*?)<\/div><\/div><div class="wk-hero/); const body = m ? m[1] + '</div></div>' : html;
  const cells = {}; (body.match(/<div class="wk-day[^"]*"[^>]*>[\s\S]*?<div class="wk-day-bot"[^>]*>[\s\S]*?<\/div><\/div>/g) || []).forEach(c => {
    const lbl = (c.match(/wk-day-lbl">(\w+)</) || [])[1]; if (!lbl) return;
    cells[lbl.toLowerCase()] = { cls: (c.match(/class="(wk-day[^"]*)"/) || [])[1], center: (c.match(/wk-day-num">([\s\S]*?)<\/div>/) || [])[1],
      top: ((c.match(/wk-day-top"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').replace(/<[^>]+>/g, ''), bot: ((c.match(/wk-day-bot"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').replace(/<[^>]+>/g, '') }; });
  return cells; };
const hero = html => { const h = (html.match(/<div class="wk-hero[\s\S]*?(?=<div class="wk-stats"|$)/) || [''])[0];
  const txt = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { cls: (h.match(/class="(wk-hero[^"]*)"/) || [])[1], over: ((h.match(/wk-hero-over">([^<]*)</) || [])[1] || ''), title: ((h.match(/wk-hero-title">([^<]*)</) || [])[1] || ''),
    cta: ((h.match(/class="wk-hero-cta"[^>]*>([^<]*)</) || [])[1] || ''), statusWord: /\b(done|skipped|complete|marked)\b|\u2713|\u2715/i.test(txt.replace(/COMPLETE —/g,'')), text: txt.slice(0, 160) }; };
const doneTile = html => { const m = html.match(/<div class="wk-stat">[\s\S]*?<\/div><\/div>/); return m ? m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; };
const clearComp = () => ev('(function(){saveCompleted({});})()');

// =============== STEP 2 strings ===============
console.log('\n== STRINGS (source, both artifacts) ==');
const PSRC = PREV ? fs.readFileSync(PREV, 'utf8') : null;
const STR = { 'Done \\u2713 <small>tap to undo</small>':'Done \\u2713 <small>tap to undo</small>', 'Skipped \\u2715 <small>tap to undo</small>':'Skipped \\u2715 <small>tap to undo</small>',
  'Mark Done \\u2713</button>':'Mark Done \\u2713</button>', "'START SESSION'":"'START SESSION'", "'OPEN SESSION'":"'OPEN SESSION'", 'showToast labels complete':"complete:'Done ✓',skipped:'Skipped ✕ — the week moves on'" };
for (const [k, s] of Object.entries(STR)) console.log(`  ${k}: now count=${src.split(s).length-1} lines ${lineOf(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).join(',')}` + (PSRC ? ` | prev count=${PSRC.split(s).length-1}` : ''));
console.log('  log-nudge line now:', (src.split('\n').find(l => l.includes('class="log-nudge-btn"')) || '').trim().slice(0, 240));

// =============== (a) STRIP + HERO ===============
console.log('\n== (a) STRIP CELL + TODAY HERO after status tap then closeDetail() ==');
const tally = {}; const bump = (k, v) => { tally[k] = tally[k] || {}; tally[k][v] = (tally[k][v] || 0) + 1; };
let cases = 0, crash = 0, heroToday = 0; let example = {};
for (const n of names) {
  const cfg = JSON.parse(JSON.stringify(FX[n])); cfg.seed = cfg.seed || 12345; const p = setup(cfg);
  for (const w of Object.keys(p.weeks).map(Number)) {
    const tr = DAYS.filter(d => p.weeks[w][d] && !p.weeks[w][d].rest);
    for (let i = 1; i < tr.length; i++) {
      const T0 = tr[i], P0 = tr[i-1];
      for (const [which, dk] of [['today', T0], ['past', P0]]) for (const st of ['complete', 'skipped']) {
        clearComp(); VNOW = dateOf(w, T0); ev('currentWeek=' + w + ';'); els.popOverlay.classList.remove('show');
        try { ev(`openDayKey('${dk}')`); advance(300); ev(`handleDayStatus('${dk}','x','${st}')`); ev('popClose()'); ev('closeDetail()'); advance(3000); }
        catch (e) { crash++; if (crash < 4) console.log('  CRASH', n, w, dk, st, e.message); continue; }
        cases++; const html = weekHTML(); const c = strip(html)[dk] || {}; const h = hero(html);
        if (/^Today/.test(h.over)) heroToday++;
        const key = which + '/' + st;
        bump(key + ' cell.class', c.cls); bump(key + ' cell.center', c.center);
        bump(key + ' cell.top/bot same as unmarked?', 'n/a'); 
        bump(key + ' hero.over', h.over.replace(/ · \w+day$/, ' · <day>').replace(/Week \d+/, 'Week N'));
        bump(key + ' hero.cta', h.cta); bump(key + ' hero.statusWord', String(h.statusWord)); bump(key + ' hero.cls', h.cls);
        bump(key + ' heroKey==tapped day?', String(h.over.endsWith(ev('DAY_FULL')[dk])));
        bump(key + ' DONE tile', doneTile(html).replace(/\d+/g, '#'));
        if (!example[key]) example[key] = { w, dk, today: T0, cell: c, hero: h, tile: doneTile(html) };
      }
    }
  }
}
// unmarked reference cells (same lattice, no tap) so a skipped cell can be compared against pending
let refSame = 0, refN = 0;
for (const n of names) { const cfg = JSON.parse(JSON.stringify(FX[n])); cfg.seed = cfg.seed || 12345; const p = setup(cfg);
  for (const w of Object.keys(p.weeks).map(Number)) { const tr = DAYS.filter(d => p.weeks[w][d] && !p.weeks[w][d].rest);
    for (let i = 1; i < tr.length; i++) { const T0 = tr[i]; for (const dk of [T0, tr[i-1]]) {
      clearComp(); VNOW = dateOf(w, T0); ev('currentWeek=' + w + ';'); ev('renderWeekView()'); const pend = JSON.stringify(strip(weekHTML())[dk]);
      ev(`openDayKey('${dk}')`); ev(`handleDayStatus('${dk}','x','skipped')`); ev('popClose()'); ev('closeDetail()'); const sk = JSON.stringify(strip(weekHTML())[dk]);
      refN++; if (pend === sk) refSame++; } } } }
console.log(`lattice: fixtures=${names.length} (${names.join(',')}) cases=${cases} crash=${crash} | hero in "Today" mode: ${heroToday}/${cases}`);
for (const [k, v] of Object.entries(tally)) if (!/n\/a/.test(JSON.stringify(v))) console.log('  ' + k + ': ' + JSON.stringify(v));
console.log(`  Skipped cell byte-identical to the same cell unmarked (pending): ${refSame}/${refN}`);
console.log('  examples:'); for (const [k, e] of Object.entries(example)) console.log(`   ${k} wk${e.w} tapped=${e.dk} today=${e.today}: cell=${JSON.stringify(e.cell)} | hero{over:"${e.hero.over}",title:"${e.hero.title}",cta:"${e.hero.cta}",cls:"${e.hero.cls}"} | tile="${e.tile}"`);

// =============== (b) REST TIMER ===============
console.log('\n== (b) REST TIMER across Done + closeDetail ==');
const cfg0 = JSON.parse(JSON.stringify(FX[names[0]])); cfg0.seed = cfg0.seed || 12345; const p0 = setup(cfg0);
const dk0 = DAYS.find(d => p0.weeks[1][d] && !p0.weeks[1][d].rest); VNOW = dateOf(1, dk0); T.clear();
ev('currentWeek=1;'); ev("showScreen('screenWeek')");
const rt = lbl => { const r = { lbl, restFloat: els.restFloat ? els.restFloat.style.display : '(no el)', rtTab: els.rtTab ? els.rtTab.style.display : '', rtCard: els.rtCard ? els.rtCard.style.display : '',
  running: ev('_ruRunning'), ruId: ev('_ruId'), idLive: T.has(ev('_ruId')), intervalsLive: liveIntervals(), mini: (els.rtMini ? els.rtMini.innerHTML : '').replace(/<[^>]+>/g, ''), big: els.rtBig ? els.rtBig.textContent : '',
  overlay: els.detailOverlay ? els.detailOverlay.classList.contains('open') : false, screen: ev('_curScreen'), pop: els.popOverlay.classList.contains('show') };
  console.log('  ' + JSON.stringify(r)); return r; };
ev(`openDayKey('${dk0}')`); advance(300); rt('day open, timer idle');
ev('rtToggleBtn()'); rt('rtToggleBtn() -> started'); advance(12000); const b1 = rt('+12 s on the day');
ev(`handleDayStatus('${dk0}','x','complete')`); rt('Done tapped (overlay still open today)');
ev('closeDetail()'); const b2 = rt('closeDetail() [the ruling\'s close path]');
advance(12000); const b3 = rt('+12 s on This Week, pop still up');
ev('popClose()'); advance(8000); rt('popClose + 8 s');
ev(`openDayKey('${dk0}')`); rt('reopen the day (ruResetIfIdle)');
ev("tabGo('screenHome')"); const b4 = rt("tabGo('screenHome')"); advance(5000); rt('+5 s on Programs');
console.log(`  handle identical across closeDetail: ${b1.ruId === b2.ruId} | ticks advanced across close: ${b1.big} -> ${b3.big} | does closeDetail/handleDayStatus/popFire/fireCompletionPopup/showScreen reference _ru*/restFloat? ` +
  ['closeDetail','handleDayStatus','popFire','fireCompletionPopup','showScreen','renderWeekView','tabGo'].map(f => f + '=' + /_ru|ruPause|ruReset|restFloat|updateRestFloat/.test(String(ev(f)))).join(' '));
console.log('  z-index: .overlay', (src.match(/\n\.overlay\{[^}]*z-index:(\d+)/) || [])[1], '| #restFloat', (src.match(/#restFloat\{[^}]*z-index:(\d+)/) || [])[1], '| .pop-overlay', (src.match(/\.pop-overlay\{[^}]*z-index:(\d+)/) || [])[1], '| .tabbar', (src.match(/\.tabbar\{[^}]*z-index:(\d+)/) || [])[1]);

// =============== (c) TOAST vs POP-UP ===============
console.log('\n== (c) TOAST vs COMPLETION POP-UP ==');
const cssOf = sel => (src.match(new RegExp('\\n' + sel.replace('.', '\\.') + '\\{[^}]*\\}')) || [''])[0].trim();
console.log('  .toast css:', cssOf('.toast'));
console.log('  .pop-overlay css:', cssOf('.pop-overlay'));
console.log('  anim lines:', lineOf(/^\.pop-overlay\.show|^\.toast\.show/).map(l => src.split('\n')[l-1].trim()).join(' || '));
// DOM parentage: open-tag stack at each element (markup only, <script> bodies skipped)
function parents(id){ const i = src.indexOf('id="' + id + '"'); const body = src.indexOf('<body'); let s = src.slice(body, i);
  s = s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, ''); const st = [];
  (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).forEach(t => { const m = t.match(/^<(\/?)([a-zA-Z0-9]+)([^>]*)>/); if (!m) return; const tag = m[2].toLowerCase();
    if (/^(br|img|input|meta|link|hr|source|path|circle|rect|line|polyline|use)$/.test(tag) || /\/>$/.test(t)) return;
    if (m[1]) { const k = st.map(x => x.tag).lastIndexOf(tag); if (k >= 0) st.length = k; } else st.push({ tag, id: (m[3].match(/id="([^"]*)"/) || [])[1], cls: (m[3].match(/class="([^"]*)"/) || [])[1] }); });
  return st.map(x => x.tag + (x.id ? '#' + x.id : '') + (x.cls ? '.' + x.cls.split(' ')[0] : '')).join(' > '); }
console.log('  #toast parents:', parents('toast'), '| #popOverlay parents:', parents('popOverlay'));
// timing over the lattice: every training day, Done, pop fires; record toast show/hide vs pop show
let nTap = 0, nPop = 0, toastUnderPop = 0, hideDelta = {}, popBeforeToastHide = 0, orderToastFirst = 0; const kick = {};
for (const n of names) { const cfg = JSON.parse(JSON.stringify(FX[n])); cfg.seed = cfg.seed || 12345; const p = setup(cfg);
  for (const w of Object.keys(p.weeks).map(Number)) for (const d of DAYS) { const day = p.weeks[w][d]; if (!day || day.rest) continue;
    ev('ruReset()'); T.clear(); VNOW = dateOf(w, d); ev('currentWeek=' + w + ';'); els.popOverlay.classList.remove('show'); advance(5000);   // clear scheduler: a live 33 ms interval across a week jump would eat the advance() cap toastEvents.length = 0; popEvents.length = 0;
    ev(`openDayKey('${d}')`); advance(300); toastEvents.length = 0; popEvents.length = 0; const t0 = VNOW;
    ev(`handleDayStatus('${d}','x','complete')`); nTap++;
    const ps = popEvents.find(e => e.ev === 'show'); const ts = toastEvents.find(e => e.ev === 'show');
    if (ps) { nPop++; kick[els.popKicker.textContent] = (kick[els.popKicker.textContent] || 0) + 1; if (ps.toastShowing) toastUnderPop++; if (ts && toastEvents.indexOf(ts) >= 0 && ps.t >= ts.t) orderToastFirst++; }
    if (advance(5000) > 150000) console.log('  SCHEDULER CAP HIT', w, d); const th = toastEvents.find(e => e.ev === 'hide'); const dh = th ? th.t - t0 : 'never'; hideDelta[dh] = (hideDelta[dh] || 0) + 1;
    if (ps && els.popOverlay.classList.contains('show') && th) popBeforeToastHide++;
    ev('popClose()'); } }
console.log(`  Done taps=${nTap} | pop shown=${nPop} ${JSON.stringify(kick)} | toast already .show at the instant pop gets .show: ${toastUnderPop}/${nPop} | toast show precedes-or-equals pop show (same virtual ms): ${orderToastFirst}/${nPop}`);
console.log(`  toast hide at (ms after tap): ${JSON.stringify(hideDelta)} | pop still up (no dismiss) when toast hid: ${popBeforeToastHide}/${nPop}`);
console.log('  showToast body:', String(ev('showToast')).slice(0, 200));
console.log('DONE');
