// Scratch smoke for V239 slice E (D234 R3 + Amendment 1). Not a gate. Fake scheduler, retaining DOM stub.
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const RealDate = Date;
function env(file, o){
  const IA = H.load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let DNOW = new RealDate(2026, 8, 21, 10).getTime(), TNOW = 0;
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(DNOW); } static now(){ return DNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => DNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every) => { const id = tid++; T.set(id, { fn, at:TNOW + Math.max(0, +ms || 0), every }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0); ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.clearTimeout = id => { T.delete(id); }; ctx.clearInterval = id => { T.delete(id); };
  ctx.requestAnimationFrame = fn => sched(() => fn(TNOW), 16, 0); ctx.cancelAnimationFrame = id => { T.delete(id); };
  const adv = ms => { const end = TNOW + ms; for(let n = 0; n < 100000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
    if(!b) break; const [id, t] = b; TNOW = t.at; DNOW += 0; if(t.every) t.at += t.every; else T.delete(id); try { t.fn(); } catch(e){ errs.push(e.message); } } DNOW += end - TNOW; TNOW = end; };
  const els = {};
  const mk = id => { const cls = new Set(), lis = {}; const e = { id, innerHTML:'', textContent:'', style:{}, dataset:{}, children:[], attrs:{}, lis, offsetWidth:0, offsetHeight:0,
    classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)), toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
    addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){}, dispatchEvent:evt => { (lis[evt.type] || []).forEach(f => f({ type:evt.type, target:e, currentTarget:e, cancelable:true, preventDefault(){} })); return true; },
    setAttribute(k, v){ e.attrs[k] = v; }, getAttribute(k){ return k in e.attrs ? e.attrs[k] : null; },
    insertBefore(c){ e.children.unshift(c); if(c.id) els[c.id] = c; return c; }, appendChild(c){ e.children.push(c); if(c.id) els[c.id] = c; return c; },
    get firstChild(){ return e.children[0] || null; }, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, setPointerCapture(){},
    getBoundingClientRect(){ return { top:0, left:0, width:0, height:0 }; }, get className(){ return [...cls].join(' '); } }; return e; };
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  doc.createElement = () => mk(''); doc.addEventListener = () => {};
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : [];
  ctx.matchMedia = q => ({ matches:!!o.reduce && /reduce/.test(q), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const p = IA.buildProgram(cfg); p.id = 'measure';
  LS.setItem('ia_programs', JSON.stringify([p])); ctx.__P = p; ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  const log = [];
  if(o.plugin){ ctx.iaIsland = { hasIsland:o.plugin === 'pill', run(a){ log.push(['run', a]); }, stop(a){ log.push(['stop', a]); }, end(){ log.push(['end']); } }; }
  ev('_rtIntroPending=' + (o.intro ? 'true' : 'false'));
  const D0 = DNOW;
  ev("showScreen('screenWeek')");                       // the first in-program screen: updateRestFloat -> _rtInit -> intro
  const st = () => ({ t:TNOW, pend:ev('_rtIntroPending'), TO:ev('_rtIntroTO') !== null, card:els.rtCard.style.display, cardAnim:els.rtCard.style.animation || '',
    tab:els.rtTab.style.display, tabAnim:els.rtTab.style.animation || '', log:JSON.stringify(log) });
  const tap = () => els.rtTab.dispatchEvent({ type:'click' });
  return { ev, adv, st, tap, D0, log, errs, els };
}
const J = JSON.stringify, line = (tag, s) => console.log('  ' + tag.padEnd(26) + J(s));
const CAND = process.argv[2], PRE = process.argv[3];

console.log('== pill arm, point (1) and (2): intro on the first in-program screen');
{ const E = env(CAND, { plugin:'pill', intro:true }); line('(1) t=0', E.st()); E.adv(1000); line('t=1000 (drop at rest)', E.st());
  E.adv(1200); line('t=2200 (fold started)', E.st()); E.adv(340); line('(2) t=2540 (fold done)', E.st()); E.adv(420); line('(2) t=2960 (echo cleared)', E.st()); if(E.errs.length) console.log('  errs ' + E.errs); }
console.log('== pill arm, point (3): pill tap at 500 ms');
{ const E = env(CAND, { plugin:'pill', intro:true }); E.adv(500); E.tap(); line('(3) after tap', E.st()); E.adv(3000); line('    +3000', E.st()); }
console.log('== pill arm, point (4): Start at 500 ms');
{ const E = env(CAND, { plugin:'pill', intro:true }); E.adv(500); E.ev('rtToggleBtn()'); const s = E.st(); line('(4) after Start', s);
  console.log('  run(D0) exact: ' + (s.log === J([['run', E.D0 + 500]]) ? 'yes (D0 = the fake Date at the tap, boot + 500)' : 'NO ' + s.log)); E.ev('rtResetBtn()'); }
console.log('== pill arm, point (5): reduced motion');
{ const E = env(CAND, { plugin:'pill', intro:true, reduce:true }); line('(5) t=0', E.st()); E.adv(500); line('(5) t=500', E.st()); E.adv(1700); line('(5) t=2200', E.st()); E.adv(1000); line('    t=3200', E.st()); }
console.log('== pill arm, R3 toggle outside the intro (no intro pending)');
{ const E = env(CAND, { plugin:'pill', intro:false }); line('idle', E.st()); E.tap(); line('tap 1 (open)', E.st()); E.tap(); line('tap 2 (close)', E.st());
  E.tap(); line('tap 3 (open)', E.st()); E.ev('rtCollapse()'); line('› rtCollapse', E.st()); }
console.log('== PWA arm intro: candidate vs pre_sliceE (must be identical traces)');
const trace = f => { const E = env(f, { intro:true }); const out = [E.st()]; E.adv(2200); out.push(E.st()); E.adv(420); out.push(E.st()); E.adv(500); out.push(E.st());
  const E2 = env(f, { intro:false }); E2.ev('rtExpand()'); out.push(E2.st()); E2.ev('rtExpand()'); out.push(E2.st()); E2.ev('rtCollapse()'); out.push(E2.st()); return out; };
const a = trace(CAND), b = trace(PRE);
a.forEach((s, i) => line('PWA ' + ['t=0', 't=2200', 't=2620', 't=3120', 'rtExpand', 'rtExpand again', 'rtCollapse'][i], s));
console.log('  PWA trace identical to pre_sliceE: ' + (J(a) === J(b) ? 'YES' : 'NO\n' + J(b)));
const n = trace.bind(null);
{ const E = env(CAND, { plugin:'noisland', intro:true }); const s = E.st(); line('native no-island t=0', s); }
