// Iron Asylum — Node VM harness.
// Boots the single-file app's inline JS inside vm.createContext with DOM /
// localStorage / window stubs, and hands back the engine surface.
//
//   const { load } = require('./tests/harness');
//   const IA = load('index.html');          // or any iron_asylum_*.html
//   const prog = IA.buildProgram(IA.fixtures.HALF_MANNY);
//
// Standing rules encoded here (see CLAUDE.md / handoff §10b):
//  - `let`/`const` at top level do NOT land on the context; only `var` and
//    function declarations do. The shim below exports by NAME through a
//    generated `globalThis.__IA = {...}` block, so nothing is re-declared.
//  - `navigator` must be installed with defineProperty in Node 22.
//  - Any stub that accepts a callback must be able to RUN it (V184 lesson):
//    rAF / setTimeout / setInterval are queued, not dropped. Flush on demand
//    with IA.flushTimers(n). They never auto-run, so a render loop cannot spin.
//  - The harness never reimplements engine logic. Oracles live in the gates.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];

function extractInlineJS(html){
  // every <script> WITHOUT a src= attribute, in document order, joined with ';\n'
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while((m = re.exec(html))){
    const attrs = m[1] || '';
    if(/\bsrc\s*=/.test(attrs)) continue;
    if(/\btype\s*=\s*["'](?!(text\/javascript|module|application\/javascript))/.test(attrs)) continue;
    out.push(m[2]);
  }
  if(!out.length) throw new Error('harness: no inline <script> blocks found');
  return out.join(';\n');
}

// Names that gates and sessions reach for. Extend freely; a missing name is
// exported as undefined, never thrown, so a rename shows up in the gate as a
// named failure rather than a harness crash.
const EXPORT_NAMES = [
  'IA_VERSION','buildProgram','refreshProgram','raceAlignment','calcProgramLength',
  'engineA_timeline','engineB_cardio','planCalendar','engineC_kinematics','engineD_synthesis',
  'd18LongRunDayPass','_nrcSpacedRunDays','getNRCSessionTypes','sportDayTargets',
  'NRC_GOALS','NRC_5K_TABLE','NRC_10K_TABLE','LIFTING_FOCUS_TO_GOAL','ALL_DAYS_ORDER','_ISO_ORDER',
  'EXLIB','RAND_POOLS','REP_AFFINITY','_AUX_FAMILY','_AUX_GEAR','EX_KEY_ALIAS','EX_RENAMED_V113',
  '_pattern','_repFloor','_repFit','_stationClass','_ssLegal','_ssPair','_powerPrescribe','_carryRx',
  'exStoreKey','parseRx','_paceStrToSec','_swapDetailFor','swapCandidates','auxSwapCandidates',
  'applyInjuryFilter','applyOverlays','bodyweightSweep','singletonSupersetSweep','deconflictAdjacentDupes',
  'resolveStartDate','dayBeforeStart','getWeekMonday','_isoToday','calcCurrentWeek',
  'computeStreak','completedCount','statusOf','exControlFlags','_epley',
  'PACE_CHART','_steadyCeilingFor','_mileFromRecoverySec','_halfFromMileSec',
  'GOAL_RECOMMENDED_DAYS','SPORT_CEILINGS','TACTICAL_DELOAD_GOALS','DEFAULT_1RM',
  'WD','_applyWizardStart','doGenerate'
];

function makeContext(opts){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k,v) => { store.set(String(k), String(v)); },
    removeItem: k => { store.delete(k); },
    clear: () => store.clear(),
    key: i => Array.from(store.keys())[i] ?? null,
    get length(){ return store.size; },
    _map: store,
  };

  const timers = [];           // {fn, kind}
  let timerId = 1;
  const queue = (fn, kind) => { const id = timerId++; if(typeof fn==='function') timers.push({id, fn, kind}); return id; };

  // Minimal element: enough surface for boot-time code that touches the DOM.
  const mkEl = (tag='div') => {
    const el = {
      tagName: String(tag).toUpperCase(), id:'', className:'', innerHTML:'', textContent:'', value:'', style:{},
      dataset:{}, children:[], childNodes:[], attributes:{},
      classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
      setAttribute(k,v){ el.attributes[k]=String(v); }, getAttribute(k){ return el.attributes[k] ?? null; },
      removeAttribute(k){ delete el.attributes[k]; }, hasAttribute(k){ return k in el.attributes; },
      appendChild(c){ el.children.push(c); el.childNodes.push(c); return c; }, removeChild(c){ return c; },
      insertBefore(c){ el.children.push(c); return c; }, remove(){}, replaceChildren(){}, cloneNode(){ return mkEl(tag); },
      querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; },
      addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
      focus(){}, blur(){}, click(){}, scrollTo(){}, scrollIntoView(){},
      getBoundingClientRect(){ return {top:0,left:0,right:0,bottom:0,width:0,height:0,x:0,y:0}; },
      offsetWidth:0, offsetHeight:0, scrollTop:0, scrollHeight:0, clientHeight:0, clientWidth:0,
      parentNode:null, parentElement:null, firstChild:null, lastChild:null, nextSibling:null,
      contains(){ return false; },
    };
    return el;
  };
  const metaVersion = mkEl('meta');
  metaVersion.content = opts.version;

  const document = {
    body: mkEl('body'), head: mkEl('head'), documentElement: mkEl('html'),
    readyState: 'complete', visibilityState:'visible', hidden:false, title:'', cookie:'',
    createElement: t => mkEl(t), createTextNode: t => ({textContent:t, nodeType:3}), createDocumentFragment: () => mkEl('fragment'),
    getElementById: () => mkEl('div'),
    querySelector: sel => (/meta\[name="ia-version"\]/.test(sel) ? metaVersion : mkEl('div')),
    querySelectorAll: () => [],
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    activeElement: null,
  };
  const window = {
    localStorage, document, innerWidth: 393, innerHeight: 852, devicePixelRatio: 3,
    location: { href:'https://bigyerr.github.io/TheBig6V2/', pathname:'/TheBig6V2/', search:'', hash:'', origin:'https://bigyerr.github.io', reload(){} },
    history: { pushState(){}, replaceState(){}, back(){} },
    matchMedia: () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }),
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    scrollTo(){}, alert(){}, confirm(){ return true; }, prompt(){ return null; },
    getComputedStyle: () => ({ getPropertyValue(){ return ''; } }),
    requestAnimationFrame: fn => queue(fn,'raf'), cancelAnimationFrame(){},
    setTimeout: (fn) => queue(fn,'timeout'), clearTimeout(){},
    setInterval: (fn) => queue(fn,'interval'), clearInterval(){},
    fetch: () => Promise.resolve({ ok:false, status:0, text: () => Promise.resolve('') }),
    crypto: { getRandomValues: a => { for(let i=0;i<a.length;i++) a[i]=(Math.random()*256)|0; return a; }, randomUUID: () => 'uuid-harness' },
    performance: { now: () => Date.now() },
    console,
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise, Error, TypeError, RangeError,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone: v => JSON.parse(JSON.stringify(v)),
    screen: { width:393, height:852 }, visualViewport: { width:393, height:852, addEventListener(){} },
    __IA_HARNESS: true,
  };
  window.window = window; window.self = window; window.globalThis = window; window.top = window;
  Object.defineProperty(window, 'navigator', { value: { userAgent:'iPhone Harness', standalone:false, maxTouchPoints:5, language:'en-US', onLine:true, vibrate(){ return false; }, share: undefined, clipboard:{ writeText(){ return Promise.resolve(); } }, serviceWorker: undefined }, configurable:true, enumerable:true, writable:false });

  const ctx = vm.createContext(window);
  return { ctx, window, localStorage, timers, flushTimers: (n=Infinity) => { let ran=0; while(timers.length && ran<n){ const t=timers.shift(); try{ t.fn(); }catch(e){ if(opts.verbose) console.error('timer threw:', e.message); } ran++; } return ran; } };
}

function load(htmlPath, opts={}){
  const abs = path.resolve(htmlPath);
  const html = fs.readFileSync(abs, 'utf8');
  const version = (html.match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
  if(!version) throw new Error('harness: no ia-version meta in '+abs);
  const js = extractInlineJS(html);
  const exportShim = '\n;globalThis.__IA = {' + EXPORT_NAMES.map(n => `${n}: (typeof ${n}!=='undefined' ? ${n} : undefined)`).join(',') + '};\n';
  const src = js + exportShim;
  if(opts.dumpJS) fs.writeFileSync(opts.dumpJS, src);
  const env = makeContext({ version, verbose: !!opts.verbose });
  vm.runInContext(src, env.ctx, { filename: path.basename(abs)+'.inline.js' });
  const IA = Object.assign({}, env.window.__IA);
  IA.version = version;
  IA.html = html;
  IA.js = js;
  IA.localStorage = env.localStorage;
  IA.window = env.window;
  IA.ctx = env.ctx;
  IA.flushTimers = env.flushTimers;
  IA.eval = code => vm.runInContext(code, env.ctx);     // reach any non-exported name
  IA.fixtures = fixtures;
  return IA;
}

// Mario's live program. Seeded, so builds are deterministic (never let seed be null in a gate —
// engineA falls back to Date.now()%100000 and the baseline stops being self-stable, V182).
const fixtures = {
  HALF_MANNY: {
    name: 'THE HALF MANNY', primaryPath: 'event', cardioTypes: ['run'],
    cardioGoals: { run: { id:'run_half', label:'Half Marathon', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } },
    eventTargeted: true, raceDate: '2026-12-06',
    liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun','wed'], days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: 76308,
  },
};

// Convenience: one-line-per-day view of a program, for measure passes and before/after grids.
// prog.weeks is keyed '1'..'N'; each week is keyed by weekday ('sun'..'sat').
function weekGrid(prog, opts={}){
  const lines = [];
  const order = opts.order || ['mon','tue','wed','thu','fri','sat','sun'];
  const weeks = prog.weeks || {};
  Object.keys(weeks).sort((a,b)=>+a-+b).forEach(wk => {
    order.forEach(d => {
      const day = weeks[wk][d]; if(!day) return;
      if(day.rest && !opts.showRest) return;
      const c = day.cardio;
      const cardio = c ? (Array.isArray(c) ? c.map(x=>x.subtype||x.type).join('+') : (c.subtype||c.type||'')) : '';
      const secs = (day.sections||[]).map(s => (s.label||s.coreHeader||'') + '[' + (s.items||[]).map(i=>String(i.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').slice(0,60)).join(', ') + ']').join(' | ');
      lines.push(`W${wk} ${d.toUpperCase()} ${day.title||''}${cardio?' {'+cardio+'}':''} :: ${secs}`.replace(/\s+/g,' ').trim());
    });
  });
  return lines.join('\n');
}

// Stable digest of a program's prescription for identity / differential gates.
// Strips clock-derived fields (id, created) so a seeded build equals itself (V182 lesson).
function progDigest(prog){
  const crypto = require('crypto');
  const clone = JSON.parse(JSON.stringify(prog, (k,v) => (k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey') ? undefined : v));
  return crypto.createHash('sha256').update(JSON.stringify(clone)).digest('hex').slice(0,16);
}

// ── HALF_MANNY digest, keyed by the ia-version of the artifact under test ──────────
// gate.sh runs every gate against the PREVIOUS artifact first, so a bare literal pin
// makes unrelated gates red on the old build for a reason none of them tests. A row
// per era keeps them green on BOTH artifacts for the right reason, and an artifact
// whose version has NO row fails loudly: the lookup is undefined and the consuming
// gate asserts the row exists before it compares. An unruled digest move is exactly
// what this table is here to catch.
// These tables are also the record of which ruling changed Mario's program and when.
// Two tables, never one: the deload-off digest is a COUNTERFACTUAL oracle (the engine
// with recoveryDeload suppressed) and must not share a row with the shipped program.
// CONVENTION (D94-t). A row records a CLAIM, not a value.
//   A row written as a LITERAL asserts a RULED MOVE. It must cite the D-code and the
//   counterfactual oracle that rescues its provenance: the model is g200_core_tier F1a,
//   which pins the counterfactual to a digest two earlier versions independently
//   shipped (see the handoff §12 provenance entry).
//   A row written as a REFERENCE to V(N-1) asserts RULED UNMOVED. Its proof is the
//   two-artifact run gate.sh already performs: the same digest read off V(N-1) and V(N).
//   A MISSING row still fails loudly and cannot be satisfied by accident. Someone has
//   to type the version number either way.
const MANNY_DIGEST_BY_VERSION = {
  198: '6e32421331693437',
  199: '6e32421331693437',
  200: 'd4364dd3fa63a3a1',   // D89 re-pin: the ruled digest move
};
MANNY_DIGEST_BY_VERSION[201] = MANNY_DIGEST_BY_VERSION[200];              // D94: ruled UNMOVED (pull deload cards only; HALF_MANNY's cond[2] draws are never a hinge)
// V202: ruled UNMOVED, and written as a REFERENCE for that reason — under this file's D94-t
// convention a LITERAL row asserts a ruled MOVE and a REFERENCE row asserts a ruled UNMOVED.
// Every V202 ruling lands on NSW test-goal run work: D100/D101 move run_pace_goal anchors and
// the weekly rate, D111/D112 move INT pace, recovery and warm-up, D2b-iii re-sites the pace
// clock appendix, and the generic INT note copy changed. HALF_MANNY is an NRC half-marathon
// fixture: no pace-goal progression, no NSW INT session, no card touched.
MANNY_DIGEST_BY_VERSION[202] = MANNY_DIGEST_BY_VERSION[201];

const MANNY_DELOAD_OFF_DIGEST_BY_VERSION = {
  199: '75ae3d256b642a9d',
  200: '5fe2c6bb32c76498',   // D89 re-pin: the ruled digest move
};
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED
// V202: ruled UNMOVED for the same reason — a reference row, not a literal. The deload-off
// variant of HALF_MANNY is the same NRC fixture with the deload pre-pass disabled; V202 moves
// nothing it draws from.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[202] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201];

module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES,
                   MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION };

if(require.main === module){
  const file = process.argv[2];
  if(!file){ console.error('usage: node tests/harness.js <html> [--grid]'); process.exit(2); }
  const IA = load(file, { verbose: process.argv.includes('--verbose') });
  console.log('ia-version', IA.version, '| buildProgram', typeof IA.buildProgram);
  const prog = IA.buildProgram(IA.fixtures.HALF_MANNY);
  console.log('weeks', Object.keys(prog.weeks||{}).length, '| startDate', prog.startDate, '| seed', prog.seed, '| digest', progDigest(prog));
  const again = progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
  console.log('self-stable', again === progDigest(prog) ? 'yes' : 'NO — baseline is not reproducible, do not diff against it');
  if(process.argv.includes('--grid')) console.log(weekGrid(prog));
}
