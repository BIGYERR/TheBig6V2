// v212 measure (Mode B): what does each "done"-type control on the day screen write, and where does the
// athlete end up afterwards? Drives the real handlers through a retaining DOM stub.
// Usage: node tests/measure/v221_done_nav.js <artifact.html>
// Oracle: navigation state is read off DOM classes (overlay .open, .screen.active, popOverlay .show) and
// localStorage key diffs, never off an engine return value. Expected "home" candidates come from the markup
// (TAB_MAP / tab bar buttons / init), grepped from the artifact source text.
process.env.TZ = 'America/New_York';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(ART);
const ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage, src = IA.html;
console.log('artifact', ART, 'ia-version', IA.version);
const lineOf = re => { const L = src.split('\n'); const o=[]; L.forEach((l,i)=>{ if(re.test(l)) o.push(i+1); }); return o; };

// ---- retaining DOM ----
const els = {};
function mk(id){
  const cls = new Set(), lis = {};
  const e = { id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{}, children:[],
    classList:{ add:(...c)=>c.forEach(x=>cls.add(x)), remove:(...c)=>c.forEach(x=>cls.delete(x)),
      toggle:(c,f)=>{ const on = f===undefined ? !cls.has(c) : !!f; on?cls.add(c):cls.delete(c); return on; }, contains:c=>cls.has(c) },
    addEventListener:(t,fn)=>{ (lis[t]=lis[t]||[]).push(fn); }, removeEventListener(){},
    fire:t=>(lis[t]||[]).forEach(f=>f({target:e,currentTarget:e})), _lis:lis,
    setAttribute(){}, getAttribute(){return null;}, appendChild(){}, removeChild(){}, remove(){}, insertAdjacentHTML(){},
    querySelector(){return null;}, querySelectorAll(){return [];}, closest(){return null;},
    getBoundingClientRect(){return {top:0,left:0,width:0,height:0,bottom:0,right:0};}, scrollIntoView(){}, focus(){}, blur(){},
    get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x=>cls.add(x)); } };
  return e;
}
const doc = ctx.document;
doc.getElementById = id => (els[id] || (els[id] = mk(id)));
const SCREENS = [...new Set((src.match(/class="screen[^"]*" id="(\w+)"/g)||[]).map(s=>s.match(/id="(\w+)"/)[1]))];
SCREENS.forEach(s=>{ doc.getElementById(s).classList.add('screen'); });
doc.querySelectorAll = sel => sel==='.screen' ? SCREENS.map(s=>els[s]) : sel==='.screen.with-tabbar' ? SCREENS.map(s=>els[s]).filter(e=>e.classList.contains('with-tabbar')) : [];
ctx.popConfetti = function(){};
let toasts = []; const _st = ctx.showToast; ctx.showToast = m => { toasts.push(String(m)); };
ev('showToast=globalThis.showToast;');
const state = () => ({
  overlayOpen: els.detailOverlay ? els.detailOverlay.classList.contains('open') : false,
  screen: ev('_curScreen'),
  activeScreens: SCREENS.filter(s=>els[s].classList.contains('active')).join(','),
  tabBar: els.tabBar ? els.tabBar.classList.contains('show') : null,
  pop: els.popOverlay ? els.popOverlay.classList.contains('show') : false,
  popKicker: els.popKicker ? els.popKicker.textContent : '' });

console.log('\n== 3. HOME ==');
console.log('screens in markup:', SCREENS.join(','));
console.log('TAB_MAP:', JSON.stringify(ev('TAB_MAP')), '| tab buttons lines', lineOf(/<button id="tab(Home|Week|Progress|Bugs)"/).join(','));
console.log('tab labels:', (src.match(/<button id="tab\w+"[\s\S]*?<\/button>/g)||[]).map(b=>b.match(/id="(\w+)"/)[1]+'='+(b.replace(/<[^>]+>/g,'').trim())).join(' | '));
console.log('init() lines', lineOf(/^function init\(\)/).join(','), '| closeDetail lines', lineOf(/^function closeDetail/).join(','), '| Back button', lineOf(/onclick="closeDetail\(\)">/).join(','));
console.log('.overlay css', lineOf(/^\.overlay\{/).join(','), '| .pop-overlay css', lineOf(/^\.pop-overlay\{/).join(','), '| popOverlay markup', lineOf(/id="popOverlay"/).join(','), '| tabBar css', lineOf(/(\.tabbar)[^{]*\{/).slice(0,3).join(','));
console.log('tabBar z-index / position:', (src.match(/(\.tabbar)\{[^}]*\}/)||[''])[0].slice(0,200));
console.log('screenHome renders renderProgList (program list); screenWeek renders renderWeekView (Today hero at openDayKey(heroKey)) lines', lineOf(/wk-hero-cta/).slice(0,2).join(','));

// boot twice: no program, then with a stored active program
function boot(withProg){
  [...LS._map.keys()].forEach(k=>LS.removeItem(k));
  SCREENS.forEach(s=>els[s].classList.remove('active'));
  if(withProg){ const fx=(typeof H.fixtures==='function'?H.fixtures():H.fixtures); const cfg=JSON.parse(JSON.stringify(Object.values(fx)[0])); cfg.seed=cfg.seed||12345;
    const p=IA.buildProgram(cfg); p.id='measure'; p.startDate='2026-09-21';
    LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active_prog','measure'); LS.setItem('ia_active','measure'); }
  try{ ev('init()'); }catch(e){ return 'CRASH '+e.message; }
  return state().screen;
}
console.log('boot, no programs ->', boot(false));
console.log('boot, stored active program ->', boot(true), '| active-id key read by getActiveProgId:', (src.match(/function getActiveProgId\(\)\{[^}]*\}/)||['?'])[0].slice(0,140));

// ---- program for the lattice ----
const FX = (typeof H.fixtures==='function'?H.fixtures():H.fixtures); const names = Object.keys(FX);
function setup(cfg){
  [...LS._map.keys()].forEach(k=>LS.removeItem(k));
  const p = IA.buildProgram(cfg); p.id='measure'; p.startDate='2026-09-21';
  LS.setItem('ia_programs', JSON.stringify([p]));
  ctx.__P = p; ev('activeProg=globalThis.__P; activeProgId="measure"; currentWeek=1;');
  ev("showScreen('screenWeek')");
  return p;
}
const lsSnap = () => { const o={}; for(const k of [...LS._map.keys()]) o[k]=LS.getItem(k); return o; };
const lsDiff = (a,b) => Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).map(k=>k.replace(/measure$/,'')).sort().join(',');

console.log('\n== 1/2. CONTROLS (fixture', names[0], 'week 1, first training day) ==');
const cfg0 = JSON.parse(JSON.stringify(FX[names[0]])); cfg0.seed = cfg0.seed||12345;
const p0 = setup(cfg0);
const dk = ['mon','tue','wed','thu','fri','sat','sun'].find(d=>p0.weeks[1][d]&&!p0.weeks[1][d].rest);
function openDay(){ els.popOverlay && els.popOverlay.classList.remove('show'); toasts=[]; ev("openDayKey('"+dk+"')"); IA.flushTimers(200); }
const title = p0.weeks[1][dk].title.replace(/'/g,"\\'");
const controls = [
  ['Done (footer, statusBtn_complete)', `handleDayStatus('${dk}','${title}','complete')`],
  ['Done again (tap to undo)', `handleDayStatus('${dk}','${title}','complete')`],
  ['Skip (footer, statusBtn_skipped)', `handleDayStatus('${dk}','${title}','skipped')`],
  ['Skipped again (tap to undo)', `handleDayStatus('${dk}','${title}','skipped')`],
  ['Mark Done ✓ (log-nudge, same handler)', `handleDayStatus('${dk}','${title}','complete')`],
  ['markDayComplete (legacy, any caller?)', `markDayComplete(1,'${dk}','${title}')`],
  ['toggleComplete (legacy, any caller?)', `toggleComplete(1,'${dk}','${title}')`],
  ['‹ Back', `closeDetail()`],
];
console.log('callers of markDayComplete(:', lineOf(/markDayComplete\(/).join(','), '| toggleComplete(:', lineOf(/toggleComplete\(/).join(','), '| handleDayStatus(:', lineOf(/handleDayStatus\(/).join(','));
console.log('"Partial" in any status markup:', lineOf(/handleDayStatus\([^)]*partial|'partial'\)/).join(',')||'none', '| "Mark Complete" strings:', lineOf(/Mark Complete/).join(',')||'none', '| "Finish" button:', lineOf(/<button[^>]*>[^<]*Finish/).join(',')||'none');
for(const [lbl, call] of controls){
  if(!/again/.test(lbl)) { ev(`(function(){const c=getCompleted();delete c[completedKey(1,'${dk}')];saveCompleted(c);})()`); }
  openDay();
  const before = lsSnap(), s0 = state();
  let err=''; try{ ev(call); }catch(e){ err='CRASH '+e.message; }
  const s1 = state(); const pend = IA.flushTimers(200); const s2 = state();
  console.log(`${lbl}: ${err} writes[${lsDiff(before, lsSnap())}] toast=${JSON.stringify(toasts)} status=${ev(`statusOf(1,'${dk}')`)}`
    + `\n   before{overlay:${s0.overlayOpen},screen:${s0.screen}} after{overlay:${s1.overlayOpen},screen:${s1.screen},active:${s1.activeScreens},tabBar:${s1.tabBar},pop:${s1.pop}${s1.pop?'('+s1.popKicker+')':''}} timersRan=${pend} afterFlush{overlay:${s2.overlayOpen},screen:${s2.screen},pop:${s2.pop}}`);
}
// per-exercise LOG buttons on the cards
console.log('per-exercise log buttons (onclick targets in card markup):', [...new Set((src.match(/onclick="(saveExWeight|logEx\w*|commitSets\w*|quickLog\w*)\(/g)||[]))].join(' '));

console.log('\n== 2b. LATTICE: Done tapped on every training day, every week, every fixture ==');
let taps=0, stay=0, left=0, popShown=0, crash=0; const kick={};
for(const n of names){
  const cfg = JSON.parse(JSON.stringify(FX[n])); cfg.seed = cfg.seed||12345; let p; try{ p=setup(cfg); }catch(e){ crash++; continue; }
  for(const w of Object.keys(p.weeks)){ for(const d of Object.keys(p.weeks[w])){ const day=p.weeks[w][d]; if(!day||day.rest) continue;
    ev('currentWeek='+(+w)+';'); els.popOverlay&&els.popOverlay.classList.remove('show');
    try{ ev(`openDayKey('${d}')`); IA.flushTimers(200); ev(`handleDayStatus('${d}','x','complete')`); IA.flushTimers(200); }catch(e){ crash++; continue; }
    taps++; const s=state(); if(s.overlayOpen&&s.screen==='screenWeek') stay++; else left++;
    if(s.pop){ popShown++; kick[s.popKicker]=(kick[s.popKicker]||0)+1; }
  } }
}
console.log(`fixtures=${names.length} taps=${taps} crash=${crash} | overlay still open on screenWeek after Done: ${stay}/${taps} | left: ${left}/${taps} | popOverlay shown: ${popShown}/${taps} ${JSON.stringify(kick)}`);

console.log('\n== 4. POP-UP SURVIVES NAVIGATION? ==');
setup(cfg0); openDay(); ev(`handleDayStatus('${dk}','${title}','complete')`);
const a = state(); ev('closeDetail()'); const b = state(); ev("tabGo('screenHome')"); const c = state();
console.log(`after Done pop=${a.pop}(${a.popKicker}); after closeDetail pop=${b.pop} screen=${b.screen} overlay=${b.overlayOpen}; after tabGo(screenHome) pop=${c.pop} screen=${c.screen}`);
console.log('popClose body:', String(ev('popClose')).slice(0,160));
console.log('does showScreen/closeDetail/tabGo touch popOverlay?', /popOverlay/.test(String(ev('showScreen'))+String(ev('closeDetail'))+String(ev('tabGo'))));
console.log('injury check-in popFire sites (not on completion path):', lineOf(/kicker:'(CHECK IN|BACK IN)'/).join(','), '| reachable from handleDayStatus/fireCompletionPopup?', /inj|Reassess/i.test(String(ev('handleDayStatus'))+String(ev('fireCompletionPopup'))));

console.log('\n== 5. INPUT THAT LIVES ON THE DAY SCREEN ==');
setup(cfg0); openDay();
console.log('log field listeners wired:', ['log_rpe','log_notes','log_run_dist'].map(i=>i+'='+((els[i]&&els[i]._lis.input)||[]).length).join(' '));
els.log_notes.value='typed, input event fired'; els.log_notes.fire('input');
let lg = JSON.parse(LS.getItem('ia_logs_measure')||'{}'); console.log('notes after input event, before any tap:', JSON.stringify((Object.values(lg)[0]||{}).notes));
els.log_notes.value='value set, no input event'; ev('closeDetail()');
lg = JSON.parse(LS.getItem('ia_logs_measure')||'{}'); console.log('notes after ‹ Back with no input event:', JSON.stringify((Object.values(lg)[0]||{}).notes));
console.log('wheel commit path: _iawCommit =', String(ev('_iawCommit')).replace(/\s+/g,' ').slice(250,700));
console.log('wheel debounce ms:', (String(ev('iaWheelInit')).match(/_iawCommit\(w\); \},(\d+)/)||[])[1]);
console.log('set inputs: oninput handlers', [...new Set((src.match(/oninput="(\w+)\(/g)||[]))].join(' '), '| autoSaveSets→writeSetDraft synchronous:', /writeSetDraft\(/.test(String(ev('autoSaveSets'))) && !/setTimeout/.test(String(ev('autoSaveSets'))));
console.log('writeSetDraft body has timer/debounce:', /setTimeout|debounce/.test(String(ev('writeSetDraft'))));
console.log('showToast duration:', (String(_st).match(/(\d{3,5})\)/)||[])[1], 'ms; undo toast/action?', /undo/i.test(String(_st)), '| footer "tap to undo" is the only undo, lines', lineOf(/tap to undo/).join(','));
console.log('rest timer float shown on screens:', (String(ev('updateRestFloat')).match(/_curScreen==='\w+'/g)||[]).join(' '));
console.log('DONE');
