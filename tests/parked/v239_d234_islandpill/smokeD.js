// Scratch smoke for V239 slice D (D234 R1/R2/R6): per arm, the class, the glyph and the drag wiring. Not a gate.
const path = require('path');
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const ART = process.argv[2] || '/Users/CanasBangin/Desktop/TheBig6V2/index.html';
const RealDate = Date;
function env(plugin){
  const IA = H.load(ART), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
  let DNOW = new RealDate(2026, 8, 21, 10).getTime(), PNOW = 5000000;
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(DNOW); } static now(){ return DNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => PNOW };
  ctx.setInterval = () => 1; ctx.clearInterval = () => {}; ctx.setTimeout = () => 1; ctx.clearTimeout = () => {};
  const els = {};
  const mk = id => { const cls = new Set(), lis = {}; const e = { id, innerHTML:'', textContent:'', style:{}, dataset:{}, children:[], attrs:{}, lis,
    classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)), toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
    addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){}, setAttribute(k, v){ e.attrs[k] = v; }, getAttribute(k){ return k in e.attrs ? e.attrs[k] : null; },
    insertBefore(c){ e.children.unshift(c); if(c.id) els[c.id] = c; return c; }, appendChild(c){ e.children.push(c); if(c.id) els[c.id] = c; return c; },
    get firstChild(){ return e.children[0] || null; }, querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
    getBoundingClientRect(){ return { top:0, left:0, width:0, height:0 }; }, get className(){ return [...cls].join(' '); } }; return e; };
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  let created = 0; doc.createElement = () => { created++; return mk(''); };
  doc.addEventListener = () => {};
  { const t = doc.getElementById('rtTab'); t.children.push(doc.getElementById('rtChev'), doc.getElementById('rtMini')); }   // the real tab's two children
  const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : [];
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const p = IA.buildProgram(cfg); p.id = 'measure';
  LS.setItem('ia_programs', JSON.stringify([p])); ctx.__P = p; ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  if(plugin !== undefined) ctx.iaIsland = plugin;
  ev("showScreen('screenWeek')");                       // first in-program screen: updateRestFloat -> _rtInit
  const snap = tag => { const g = els.rtGlyph; return tag + ' class=' + JSON.stringify(els.restFloat.className) + ' display=' + els.restFloat.style.display +
    ' tabDisp=' + els.rtTab.style.display + ' glyph=' + (g ? (g.dataset.k + (g.classList.contains('run') ? '+run' : '') + (/<svg/.test(g.innerHTML) ? ' svg' : ' EMPTY')) : 'none') +
    ' mini=' + JSON.stringify(els.rtMini.innerHTML) + (els.rtMini.classList.contains('run') ? '+run' : '') + (els.rtMini.classList.contains('rt-five') ? '+five' : '') +
    ' last=' + (els.rtTab.children[els.rtTab.children.length - 1] || {}).id + (g ? ' w12=' + /width="12"/.test(g.innerHTML) : '') +
    ' drag tab/card=' + ((els.rtTab.lis.pointerdown || []).length) + '/' + ((els.rtCard.lis.pointerdown || []).length) +
    ' anchorLeft=' + JSON.stringify(els.rtAnchor.style.left || '') + ' created=' + created + ' _rtPill=' + ev('_rtPill'); };
  const out = [snap('idle   ')];
  ev('rtToggleBtn()'); DNOW += 92340; PNOW += 92340; ev('_ruRender()'); out.push(snap('run    '));
  ev('rtToggleBtn()'); out.push(snap('stopped'));
  if(plugin) { plugin.hasIsland = !plugin.hasIsland; ev('_rtInit()'); out.push(snap('flipped')); }
  ev('rtResetBtn()'); out.push(snap('reset  '));
  ev('rtToggleBtn()'); DNOW += 599000; PNOW += 599000; ev('_ruRender()'); out.push(snap('599000 '));
  DNOW += 1000; PNOW += 1000; ev('_ruRender()'); out.push(snap('600000 '));
  DNOW += 3000000; PNOW += 3000000; ev('_ruRender()'); out.push(snap('3600000'));
  ev('rtResetBtn()');
  return out;
}
const mkP = has => { const o = { run(){}, stop(){}, end(){} }; if(has !== undefined) o.hasIsland = has; return o; };
for(const [name, plug] of [['hasIsland true ', mkP(true)], ['hasIsland false', mkP(false)], ['hasIsland absent', mkP()], ['"1" (non-true)', mkP('1')], ['no plugin (PWA)', undefined]]){
  console.log('== ' + name); env(plug).forEach(l => console.log('  ' + l));
}
const IA = H.load(ART); console.log('asyIcon timer: ' + IA.eval("asyIcon('timer',15)").slice(0, 60) + '... | pause: ' + IA.eval("asyIcon('pause',15)").length + ' chars');
