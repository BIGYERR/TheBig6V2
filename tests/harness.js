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
// V203: ruled MOVE, and written as a LITERAL for that reason. D117 gives the easy-day
// ceiling a single owner: the ceiling sentence plus dose.cap rewrite every NRC recovery
// and long-run card, and HALF_MANNY is an NRC half-marathon fixture built of exactly
// those days. The counterfactual anchor was printed by coach from a source-surgery copy
// carrying D117 slice 1 BEFORE this build, on a run that reproduced the V202 rows above.
// It is not a digest read back off the artifact.
MANNY_DIGEST_BY_VERSION[203] = '7d4f7ed45cc5bd53';   // D117: the ruled digest move
// V204: ruled UNMOVED, and written as a REFERENCE for that reason. D126 is string
// formatting and gate work only: it changes how already-computed numbers are rendered
// and what the gates assert about them. It moves no pool, no draw, no dose and no card,
// so HALF_MANNY cannot move. The reference makes that claim structurally: if V203's row
// is ever re-pinned, this one follows it instead of quietly disagreeing.
MANNY_DIGEST_BY_VERSION[204] = MANNY_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED
// V205: ruled UNMOVED, and written as a REFERENCE for that reason. V205 is a large
// build (D122, D125, D127, D129, D130) but every ruling in it lands on NSW test-goal
// run work and on lift placement for typed multisport days: the D125 easy-day ceiling
// chooser and its spacing, the D127 pace-eve rule, the D129 tie-break ranks and the
// D130 typed-day adjacency. HALF_MANNY is an NRC half-marathon fixture (run_half); no
// V205 ruling touches an NRC pool, draw, dose or card. D113 was pulled from this
// version by Mario and ships on its own, so nothing it would have moved is here.
MANNY_DIGEST_BY_VERSION[205] = MANNY_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED
// V206: ruled MOVE, and written as a LITERAL for that reason. D109 (amended) sweeps the
// mid-sentence dashes out of the four cardio builders' athlete copy, and HALF_MANNY is an
// NRC half-marathon fixture whose recovery, long-run and easy cards print that copy. Copy
// only, 53/98 days text-only: no pool, draw, dose or lift moves. D137 is scoped to run_base
// and does not reach this fixture. The counterfactual anchor was printed by coach from a
// source-surgery copy of V205 carrying the whole D109 table plus D137
// (tests/measure/v206_d109_d137_surgery.js) BEFORE this build, with every changed card
// printed before and after. It is not a digest read back off the artifact.
MANNY_DIGEST_BY_VERSION[206] = '0ac7da6b1691a8e1';   // D109: the ruled digest move (copy only, 53/98 days text-only)
// V207: ruled UNMOVED, so a REFERENCE row. Coach printed it on the V206 tag and a slice-A copy,
// identical to [206]. D106a touches the NSW test-goal path only.
MANNY_DIGEST_BY_VERSION[207] = MANNY_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED (NSW test-goal path only; NRC reads none of it)
// V208: ruled UNMOVED, so a REFERENCE row. V208 stamps and renames NSW run sessions
// (D103a), re-keys halfstep/protect (D103a slice 2), places run_base by shape (D104a)
// and fixes the D106a shakeout; NRC reads none of it. Printed by coach from the slice
// 0–5c working tree with this gate's own method: 0ac7da6b1691a8e1 on this run.
MANNY_DIGEST_BY_VERSION[208] = MANNY_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED

const MANNY_DELOAD_OFF_DIGEST_BY_VERSION = {
  199: '75ae3d256b642a9d',
  200: '5fe2c6bb32c76498',   // D89 re-pin: the ruled digest move
};
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED
// V202: ruled UNMOVED for the same reason — a reference row, not a literal. The deload-off
// variant of HALF_MANNY is the same NRC fixture with the deload pre-pass disabled; V202 moves
// nothing it draws from.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[202] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201];
// V203: ruled MOVE for the same reason, so a LITERAL row. The deload-off variant is the
// same NRC fixture with the deload pre-pass disabled; D117 moves the recovery and
// long-run cards it draws from on both arms. Counterfactual anchor, printed with the
// row above from the same pre-build source-surgery copy.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move
// V204: ruled UNMOVED, so a REFERENCE row. The deload-off variant is the same NRC
// fixture with the deload pre-pass disabled; D126 is string-and-gate only and touches
// nothing either arm draws from.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED
// V205: ruled UNMOVED, so a REFERENCE row. The deload-off variant is the same NRC
// fixture with the deload pre-pass disabled; V205 moves nothing either arm draws from.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[205] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED
// V206: ruled MOVE for the same reason, so a LITERAL row. The deload-off variant is the
// same NRC fixture with the deload pre-pass disabled; D109 rewrites the copy on the cardio
// cards it prints on both arms. Counterfactual anchor, printed by coach from the same
// pre-build source-surgery copy (tests/measure/v206_d109_d137_surgery.js) with g199's own
// method (A_PIPE -> A_PIPE_R instrument, __DELOAD_OFF=true, progDigest of HALF_MANNY),
// reproducing the V205 row 8fe23ae9eadde78c on the same run
// (tests/measure/v206_manny_deload_off.js). Coach's first literal, fd8b9ebe4264b8b4, came
// from a cfg-field counterfactual rather than this row's method, and was re-ruled.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206] = '1069cd7f86eed204';   // D109: the ruled digest move
// V207: ruled UNMOVED, so a REFERENCE row (coach printed it on the V206 tag and a slice-A copy).
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[208] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (1069cd7f86eed204 printed by g199's method)

// D120. The THIRD counterfactual oracle, on the same D94-t convention as the two above:
// HALF_MANNY built from the candidate with the V200 declared-core clause line stripped.
// Its consumer is g200_core_tier F1a, which until V203 pinned a literal. D117 moved both
// arms of that gate, so the literal was a lie on the candidate and green-for-the-wrong-
// reason on the baseline; an era row is green on BOTH artifacts for the right reason.
// The table starts at 200 and has NO 199 row on purpose: on V199 the clause does not
// exist, the counterfactual is not constructible, and a 199 row would be a dead pin
// dressed as a maintained one. Every value below was printed by coach from source-surgery
// copies of the V199..V202 tag artifacts and the V203 working copy, reproducing the
// earlier rows on the same run so the new one is anchored. Not read off gate output.
const MANNY_CORE_OFF_DIGEST_BY_VERSION = {
  200: '6e32421331693437',   // D89: V200 with the clause stripped is V199's shipped digest
};
MANNY_CORE_OFF_DIGEST_BY_VERSION[201] = MANNY_CORE_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[202] = MANNY_CORE_OFF_DIGEST_BY_VERSION[201];   // V202: UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120
// V204: ruled UNMOVED, so a REFERENCE row. D126 is string-and-gate only; the
// declared-core clause and everything the stripped-clause counterfactual draws are
// untouched.
MANNY_CORE_OFF_DIGEST_BY_VERSION[204] = MANNY_CORE_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED
// V205: ruled UNMOVED, so a REFERENCE row. The declared-core clause and everything the
// stripped-clause counterfactual draws are untouched by V205.
MANNY_CORE_OFF_DIGEST_BY_VERSION[205] = MANNY_CORE_OFF_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED
// V206: ruled MOVE, so a LITERAL row. The declared-core clause is untouched, but the
// stripped-clause counterfactual still prints the same cardio cards D109 rewrites, so its
// digest moves with the copy. Printed by coach from the same pre-build source-surgery copy
// (tests/measure/v206_d109_d137_surgery.js). Not read off gate output.
MANNY_CORE_OFF_DIGEST_BY_VERSION[206] = '9d14801a63111081';   // D109: the ruled digest move (copy only, 53/98 days text-only)
// V207: ruled UNMOVED, so a REFERENCE row (coach printed it on the V206 tag and a slice-A copy).
MANNY_CORE_OFF_DIGEST_BY_VERSION[207] = MANNY_CORE_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[208] = MANNY_CORE_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (9d14801a63111081 printed by g200's method)
// V209: ruled UNMOVED, so a REFERENCE row. D140 tiers NSW long-run days and F1/F2 and
// the item carry ban run in the shared pass, but HALF_MANNY's three NRC tier B days were
// already at or under eight sets by doctrine count and carry no explosive, power-core or
// carry item. Printed by coach on the final tree: 0ac7da6b1691a8e1 / 1069cd7f86eed204 /
// 9d14801a63111081 on this run.
MANNY_DIGEST_BY_VERSION[209] = MANNY_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[209] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[209] = MANNY_CORE_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED
// V210: ruled UNMOVED, written as a REFERENCE. D70c/D150 touch only pools HALF_MANNY never
// draws from (0 machine, cable or GHD names on 388/388 items) and the swap universe, which
// progDigest strips; 2b adds Front squat to the older advanced pool and withholds it under
// shoulder/elbow plans, neither of which is this fixture. Printed by coach from the source-
// surgery copy BEFORE the build: 0ac7da6b1691a8e1, universe 86 -> 86, nothing removed.
MANNY_DIGEST_BY_VERSION[210] = MANNY_DIGEST_BY_VERSION[209];   // D70c/D150/2b: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[210] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[210] = MANNY_CORE_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED
// V211: ruled UNMOVED, written as a REFERENCE. D153 and D155 act on tier B long-run days only, and
// none of HALF_MANNY's cards moves on any of the three arms.
MANNY_DIGEST_BY_VERSION[211] = MANNY_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)
MANNY_CORE_OFF_DIGEST_BY_VERSION[211] = MANNY_CORE_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)
MANNY_DIGEST_BY_VERSION[212] = MANNY_DIGEST_BY_VERSION[211];   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)
MANNY_DIGEST_BY_VERSION[213] = MANNY_DIGEST_BY_VERSION[212];   // D113a/D146/injury key: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V213 tree with g199's and g200's methods; HALF_MANNY is a solo NRC half, and neither the pace routing, the NRC multi-sport arm nor the injury key reaches a solo uninjured week)
MANNY_DIGEST_BY_VERSION[214] = MANNY_DIGEST_BY_VERSION[213];   // D158: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V214 tree with g199's and g200's methods; HALF_MANNY is an NRC race program and the eve rule is NSW dated only, NRC race pins 0/792 moved)
MANNY_DIGEST_BY_VERSION[215] = MANNY_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V215 tree; HALF_MANNY draws no GHD name)
MANNY_DIGEST_BY_VERSION[216] = MANNY_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED (printed by coach on the V216 tree)
MANNY_DIGEST_BY_VERSION[217] = MANNY_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V217-stamped tree with g199's and g200's methods; 0/98 days; every phantom D160 removes is NSW support_athletic, NRC printed 0 phantoms on 3,600 + 600 configs)
MANNY_DIGEST_BY_VERSION[218] = MANNY_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V218-stamped tree with g199's and g200's methods; 0/98 days; D157 is swim sizer length and three swim labels, HALF_MANNY holds 0 swim sessions)
MANNY_DIGEST_BY_VERSION[219] = MANNY_DIGEST_BY_VERSION[218];   // V219 (D167/D171/D159/D164/D170/D165/D166): ruled UNMOVED (standing ruling 5: D167 states HALF_MANNY 0ac7da6b1691a8e1 unchanged; measure printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 from the source surgery copies at steps 1 to 7, before the build)
MANNY_DIGEST_BY_VERSION[220] = MANNY_DIGEST_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only, no hunk reaches buildProgram; standing ruling 5: coach's P-BARERX re-baseline states MANNY_DIGEST_BY_VERSION[<next>] = the [219] row; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed from base_V219 before the build)
MANNY_DIGEST_BY_VERSION[221] = MANNY_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two loaded landmine lifts, read by scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure on the V220 rebase (tests/measure/v221_rebase_swapfloor.out.txt) and 0/903,969 by builder; D178/D179/D180 are zero-engine; standing ruling 5: all four rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged, and the D180 re-ruling (p_active_ruling.md, RE-RULING ON V220) printed it on the working tree with the V221 slices landed; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper pre-flight on the V221 candidate before these rows)
MANNY_DIGEST_BY_VERSION[222] = MANNY_DIGEST_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: swap and undo resnapshot, the per-exercise Log snapshots, the swap prune is deleted, records replay per record in recording order and never onto a day restored from ia_hist_; nothing in buildProgram; standing ruling 5: the ruling and its second re-ruling (p_swapdurable_ruling.md) state HALF_MANNY 0ac7da6b1691a8e1 unchanged, printed on V221 and the working tree; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V221 and the V222 working tree with the harness fixture and g199's and g200's methods before these rows)
MANNY_DIGEST_BY_VERSION[223] = MANNY_DIGEST_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display; its amendment (a) (p_racedate_ruling.md) rules "D182: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V222 tree with S1–S3 landed; (iv) withdrawn, see §12)"; D183 P-SAFEPACE is the wizard cardio_goal step, and its ruling and amendment 2 (p_safepace_ruling.md) state HALF_MANNY is NRC, never reaches that card, digest 0ac7da6b1691a8e1 unchanged; D184 P-TESTLEN pins dated test goals to their test week in the resolver, never NRC, and its ruling (v223_rulings/p_testlen_d184_ruling.md) states HALF_MANNY 0ac7da6b1691a8e1 unchanged by every slice, M7/M8 0/210 race and run_base builds move; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V222 and the V223 working tree (D182 S1–S3, D183, D184 (a)(b) landed) with the harness fixture and g199's and g200's methods before these rows)
MANNY_DIGEST_BY_VERSION[224] = MANNY_DIGEST_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate before this row)
MANNY_DIGEST_BY_VERSION[225] = MANNY_DIGEST_BY_VERSION[224];   // V225 (D186 P-CLOCKEND, D187 P-PACERATE): ruled UNMOVED (both rulings touch the run_pace_goal clock and rate path only; HALF_MANNY's goal is run_half, an NRC race goal, and never reaches buildRunProgressionForLength's pace-goal branch or PACE_IMPROVE; the ruling states "HALF_MANNY (real clock): 0ac7da6b1691a8e1 on B, T1, CEa, CEb, CET1, self-identical each; era row 224 = 0ac7da6b1691a8e1. UNMOVED. Era row 225 is a REFERENCE to 224, no new digest"; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V225 working tree with the harness fixture and g199's and g200's methods before this row)
MANNY_DIGEST_BY_VERSION[226] = MANNY_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (D188 reads a beginner's entered mile and D189 discloses a default anchor; HALF_MANNY is intermediate with an entered 10:30 mile, kind `entered`, so neither the beginner reads nor the S1 default-anchor note reach it; the ruling (tests/measure/v226_rulings/d188_d189_ruling.md, HALF_MANNY) states "Stays `0ac7da6b1691a8e1`" on both arms and "Era row 226 = reference to 225 (standing ruling 5, no digest printed because none moved)"; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V226 working tree (slices 1 to 6 landed) with g199's and g200's methods before this row)
MANNY_DIGEST_BY_VERSION[227] = MANNY_DIGEST_BY_VERSION[226];   // V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a config carrying `cfg.exSwapPrefs` sourced from a natively cued item under a plan with a cap, and this file's population carries none (standing ruling 5: the ruling (tests/measure/v227_rulings/d190_swapseam_ruling.md) states "HALF_MANNY week grid: unmoved, digest `0ac7da6b1691a8e1`, era row `[227]=[226]` by reference (standing ruling 5, no new digest because none moved)", and RE-RULING 1 §C restates the row; HALF_MANNY is uninjured and `fixtures.HALF_MANNY` carries no `exSwapPrefs` (printed undefined); 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V227 working tree (slices 1 and 2) with the harness fixture and g199's and g200's methods before this row)
MANNY_DIGEST_BY_VERSION[228] = MANNY_DIGEST_BY_VERSION[227];   // V228 (D193 P-CAPRPE): ruled UNMOVED, reference to [227]; the cue literal, the clamp and the stripper all sit behind applyInjuryFilter's plan, which returns on an uninjured config before any of them is read, and HALF_MANNY is uninjured (standing ruling 5: the ruling (tests/measure/v228_rulings/d193_caprpe_ruling.md) states "**HALF_MANNY may not move.** Era row `MANNY_DIGEST_BY_VERSION[228] = [227]` with the uninjured byte-identity row as its conjunct", and Amendment 1 section 7 (b) restates it; that conjunct printed by builder on the V228 slice-1 tree: uninjured weeks byte-identical V227 vs V228 on 47/47 builds (mario uninjured, HALF_MANNY, 45 cells over five equipment values); 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V228 working tree (slices 1 and 2) with the harness fixture and g199's and g200's methods before this row); D192 P-UNDOKEY: one read-side line (swapOriginOf), reaches no build; ruled UNMOVED (tests/measure/v228_rulings/d192_undokey_ruling.md section 5: "D192 adds a clause to that row's comment, no new row, no new digest"; 0ac7da6b1691a8e1 printed by g228_d192_undokey.js d2-MANNY on the V228 working tree, swapOriginOf reached 0 times by buildProgram and refreshProgram)
MANNY_DIGEST_BY_VERSION[229] = MANNY_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build half, D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; HALF_MANNY is uninjured and carries no overlay, so applyInjuryFilter's plan returns before the clamp, the held test (R7) or the stripper is read; the lens (_dayPlanCfg) returns prog.cfg itself on a day with no stamp; and the kept dose (slices 2 and 3, dormant behind cfg.injury) writes nothing on an uninjured program (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", and Amendments 1 and 2 repeat it; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V229 candidate (index.html byte-identical to measure's CF5, before the bump) with the harness fixture and g199's and g200's methods before these rows)
MANNY_DIGEST_BY_VERSION[230] = MANNY_DIGEST_BY_VERSION[229];   // V230 (D194 P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; HALF_MANNY is uninjured and carries no overlay, so _dayPlanCfg returns prog.cfg itself on every unstamped day and the four lensed sites (the tap guard and its filter cfg, the boot guard and its filter cfg) read the same null prog.cfg.injury as V229; nothing behind them runs, and none of the four is reached by buildProgram (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", carried to V230 by Amendment 1 R3′ ("V230 moves two guards and two filter cfgs and nothing else"); measure M12 (tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md) printed CF6's HALF_MANNY 0ac7da6b1691a8e1 twice before this build, and CF6 is the slice-1 tree; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V230 candidate (slice 1 applied, before the bump) with the harness fixture and g199's and g200's methods before these rows)
MANNY_DIGEST_BY_VERSION[231] = '2d35e8f743680cfa';   // V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1): the ruled digest move, a LITERAL (D94-t), not a reference: D195 Amendment 2 moves HALF_MANNY by ruling (tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, "HALF_MANNY digests (fixture seed 76308; standing ruling 5)": "ABx = ABn = PREx = ALLx  2d35e8f743680cfa  universe 86  ← ERA ROW 231"), printed by coach from the surgery copy ALLx (the whole V231 change as re-ruled) before the build (standing ruling 5); its row D195-A-a keys this row with the counterfactual conjuncts B alone 0ac7da6b1691a8e1 and A without B f5ed630033ebe3db; the 12 Tuesdays W1–W12 gain `Single-leg hip thrust 2×6–10 each @ RPE 7` as the fourth `Leg circuit — runner armor` item, nothing else moves; B alone, D196 alone and D197 alone each leave it 0ac7da6b1691a8e1 (the ruling's "B alone, W5 alone, FL alone  0ac7da6b1691a8e1  unmoved"); 2d35e8f743680cfa printed by builder on the V231 candidate (ia-version 231, sha 1249c248a679) with the harness fixture, self-stable, against 0ac7da6b1691a8e1 on the V230 baseline (sha 72ac41c8d340), before this row: the --grid diff is 12 day lines, W1–W12 TUE, each the V230 line with Single-leg hip thrust appended to Leg circuit — runner armor, and the item's detail reads 2×6–10 each @ RPE 7 on all 12
MANNY_DIGEST_BY_VERSION[232] = MANNY_DIGEST_BY_VERSION[231];   // V232 (D199–D206 P-RUNWHEEL): ruled UNMOVED, reference to [231]; tests/measure/v232_rulings/v232_ruling_d199_d206.md "What does not change, on every config": "`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)" and "The "after grid" is the log form; no week grid moves."; V232 changes only log-form markup, the wheel machinery and one CSS rule (Mario's calls, tests/measure/v232_rulings/v232_session_calls.md item 7; slices tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py), and none of them reaches buildProgram; standing ruling 5: the ruling printed `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa` on the V231 tree before the build and V232 does not move it, so this row is a reference, not a literal; printed equal on the V232 candidate (ia-version 232, shasum 03b5924d809d) and on the V231 baseline (ia-version 231, shasum d7c42961ba83) by builder with the harness fixture before this row: weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa on both trees, built twice and self-stable on both
MANNY_DIGEST_BY_VERSION[233] = MANNY_DIGEST_BY_VERSION[232];   // V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md "What does not change, on every config": "`buildProgram`, `progDigest`" and the header "No program output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after" and "The existing pin must still read `2d35e8f743680cfa` on 233."; V233 is the bike wheel plus the shared 9:59:59 clamp only (Mario's calls, tests/measure/v233_rulings/v233_session_calls.md item 6, D211 and "Build named by Mario: V233."; slice tests/edits/v233_s1_bike_wheel.py); the ruling's "no `MANNY_DIGEST_BY_VERSION` row is added" means no NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2); standing ruling 5: the ruling printed `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa` from the 232 tree before the build and V233 does not move it, so this row is a reference, not a literal; printed equal on the V233 candidate (ia-version 233, shasum 44c37852e835) and on the V232 baseline (ia-version 232, shasum 03b5924d809d) by builder with the harness fixture before this row: weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa on both trees, built twice and self-stable on both
MANNY_DIGEST_BY_VERSION[234] = MANNY_DIGEST_BY_VERSION[233];   // era_bump V234: ruled UNMOVED, reference to [233]; tests/measure/v234_rulings/v234_ruling_d213_d214.md
MANNY_DIGEST_BY_VERSION[235] = MANNY_DIGEST_BY_VERSION[234];   // era_bump V235: ruled UNMOVED, reference to [234]; tests/measure/v235_rulings/v235_ruling_d215_d217.md
MANNY_DIGEST_BY_VERSION[236] = MANNY_DIGEST_BY_VERSION[235];   // era_bump V236: ruled UNMOVED, reference to [235]; tests/measure/v236_rulings/v236_ruling_d218_d219.md
MANNY_DIGEST_BY_VERSION[237] = MANNY_DIGEST_BY_VERSION[236];   // era_bump V237: ruled UNMOVED, reference to [236]; tests/measure/v237_rulings/v237_ruling_d220_d222.md
MANNY_DIGEST_BY_VERSION[238] = MANNY_DIGEST_BY_VERSION[237];   // era_bump V238: ruled UNMOVED, reference to [237]; tests/measure/v238_rulings/v238_ruling_d223_d227.md
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211];   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212];   // D113a/D146/injury key: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V213 tree with g199's and g200's methods; HALF_MANNY is a solo NRC half, and neither the pace routing, the NRC multi-sport arm nor the injury key reaches a solo uninjured week)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[213];   // D158: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V214 tree with g199's and g200's methods; HALF_MANNY is an NRC race program and the eve rule is NSW dated only, NRC race pins 0/792 moved)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[216] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[217] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (1069cd7f86eed204 printed by coach on the V218-stamped tree)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[219] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218];   // V219 (D167/D171/D159/D164/D170/D165/D166): ruled UNMOVED (standing ruling 5: D167 states HALF_MANNY 0ac7da6b1691a8e1 unchanged; measure printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 from the source surgery copies at steps 1 to 7, before the build)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[220] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only, no hunk reaches buildProgram; standing ruling 5: coach's P-BARERX re-baseline states MANNY_DIGEST_BY_VERSION[<next>] = the [219] row; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed from base_V219 before the build)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[221] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two loaded landmine lifts, read by scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure on the V220 rebase (tests/measure/v221_rebase_swapfloor.out.txt) and 0/903,969 by builder; D178/D179/D180 are zero-engine; standing ruling 5: all four rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged, and the D180 re-ruling (p_active_ruling.md, RE-RULING ON V220) printed it on the working tree with the V221 slices landed; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper pre-flight on the V221 candidate before these rows)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[222] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: swap and undo resnapshot, the per-exercise Log snapshots, the swap prune is deleted, records replay per record in recording order and never onto a day restored from ia_hist_; nothing in buildProgram; standing ruling 5: the ruling and its second re-ruling (p_swapdurable_ruling.md) state HALF_MANNY 0ac7da6b1691a8e1 unchanged, printed on V221 and the working tree; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V221 and the V222 working tree with the harness fixture and g199's and g200's methods before these rows)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[223] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display; its amendment (a) (p_racedate_ruling.md) rules "D182: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V222 tree with S1–S3 landed; (iv) withdrawn, see §12)"; D183 P-SAFEPACE is the wizard cardio_goal step, and its ruling and amendment 2 (p_safepace_ruling.md) state HALF_MANNY is NRC, never reaches that card, digest 0ac7da6b1691a8e1 unchanged; D184 P-TESTLEN pins dated test goals to their test week in the resolver, never NRC, and its ruling (v223_rulings/p_testlen_d184_ruling.md) states HALF_MANNY 0ac7da6b1691a8e1 unchanged by every slice, M7/M8 0/210 race and run_base builds move; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V222 and the V223 working tree (D182 S1–S3, D183, D184 (a)(b) landed) with the harness fixture and g199's and g200's methods before these rows)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[224] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[225] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[224];   // V225 (D186 P-CLOCKEND, D187 P-PACERATE): ruled UNMOVED (same reasoning as MANNY_DIGEST_BY_VERSION[225]: HALF_MANNY's goal is run_half, an NRC race goal, never a run_pace_goal, so neither the clock-end fix nor the rate hoist reaches it with recoveryDeload suppressed either; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V225 working tree with the harness fixture and g199's and g200's methods before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (same reasoning as MANNY_DIGEST_BY_VERSION[226]: HALF_MANNY's anchor is kind `entered`, so D188's beginner reads and D189's default-anchor note never reach it with recoveryDeload suppressed either; 1069cd7f86eed204 printed by builder on the V226 working tree with g199's method before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226];   // V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a config carrying `cfg.exSwapPrefs` sourced from a natively cued item under a plan with a cap, and this file's population carries none (same reasoning as MANNY_DIGEST_BY_VERSION[227]: HALF_MANNY is uninjured with no swap preference, so the arm is unreached with recoveryDeload suppressed too; RE-RULING 1 states the deload-off arm unmoved by g199 56/0 on D190@226; 1069cd7f86eed204 printed by builder on the V227 working tree (slices 1 and 2) with g199's method before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227];   // V228 (D193 P-CAPRPE): ruled UNMOVED, reference to [227]; the cue literal, the clamp and the stripper all sit behind applyInjuryFilter's plan, which returns on an uninjured config before any of them is read, and HALF_MANNY is uninjured (same reasoning as MANNY_DIGEST_BY_VERSION[228]: HALF_MANNY is uninjured, so the filter returns before the cue, clamp or stripper with recoveryDeload suppressed too; 1069cd7f86eed204 printed by builder on the V228 working tree (slices 1 and 2) with g199's method before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build half, D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; same reasoning as MANNY_DIGEST_BY_VERSION[229]: HALF_MANNY is uninjured and carries no overlay, so applyInjuryFilter's plan returns before the clamp, the held test (R7) or the stripper is read; the lens (_dayPlanCfg) returns prog.cfg itself on a day with no stamp; and the kept dose (slices 2 and 3, dormant behind cfg.injury) writes nothing on an uninjured program, with recoveryDeload suppressed too (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", and Amendments 1 and 2 repeat it; 1069cd7f86eed204 printed by builder on the V229 candidate with g199's method before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[230] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229];   // V230 (D194 P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; same reasoning as MANNY_DIGEST_BY_VERSION[230]: HALF_MANNY is uninjured and carries no overlay, so _dayPlanCfg returns prog.cfg itself on every unstamped day and the four lensed sites (the tap guard and its filter cfg, the boot guard and its filter cfg) read the same null prog.cfg.injury as V229; nothing behind them runs, and none of the four is reached by buildProgram, with recoveryDeload suppressed too (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", carried to V230 by Amendment 1 R3′ ("V230 moves two guards and two filter cfgs and nothing else"); measure M12 (tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md) printed CF6's HALF_MANNY 0ac7da6b1691a8e1 twice before this build, and CF6 is the slice-1 tree; 1069cd7f86eed204 printed by builder on the V230 candidate with g199's method before this row)
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231] = '145c60296526a949';   // V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1): the ruled digest move, a LITERAL (D94-t), not a reference: the absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 1, the `MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]` row: "ABSORB as a LITERAL row (ruled MOVE, D94-t convention) | `145c60296526a949` (cand == ALLx; V230/B 1069cd7f86eed204) | A-1") printed it from the candidate and from the surgery copy ALLx with g199's __DELOAD_OFF method before this row (standing ruling 5), class A-1 of D195 Amendment 2 (tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand); the B-alone tree and V230 read 1069cd7f86eed204 (measure M18, tests/measure/v231_rulings/measure_gate_candidate_m18.md: "moves at A (g199 B2)"); the deload-off arm V230 -> candidate differs on exactly 12 of 98 days, W1–W12 Tue, each add[Leg circuit — runner armor :: Single-leg hip thrust :: 2×6–10 each @ RPE 7], 0 removals; the shipped-vs-deload-off delta is the same 10 days on both trees (W4 mon/tue/thu, W8 mon/tue/thu, W12 mon/tue/thu/fri), so B3 stays non-vacuous; printed by builder on the V231 candidate (ia-version 231, sha 1249c248a679) and the V230 baseline (ia-version 230, sha 72ac41c8d340) with g199's B2 method (pristine load, globalThis.__DELOAD_OFF=true), each arm built twice and self-stable, before this row: candidate 145c60296526a949, V230 1069cd7f86eed204, the item the fourth `Leg circuit — runner armor` item on all 12 and the rest of each of the 12 days byte-identical on 12 of 12
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231];   // V232 (D199–D206 P-RUNWHEEL): ruled UNMOVED, reference to [231]; tests/measure/v232_rulings/v232_ruling_d199_d206.md "What does not change, on every config": "`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)" and "The "after grid" is the log form; no week grid moves."; V232 changes only log-form markup, the wheel machinery and one CSS rule (Mario's calls, tests/measure/v232_rulings/v232_session_calls.md item 7; slices tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py), and none of them reaches buildProgram; same reasoning as MANNY_DIGEST_BY_VERSION[232] (standing ruling 5: a reference, not a literal): with buildProgram untouched the __DELOAD_OFF arm builds the same fixture through the same engine; printed equal on the V232 candidate (ia-version 232, shasum 03b5924d809d) and on the V231 baseline (ia-version 231, shasum d7c42961ba83) by builder with g199's B2 method (pristine load, globalThis.__DELOAD_OFF=true, the arm built twice and self-stable) before this row: 145c60296526a949 on both trees, against the shipped 2d35e8f743680cfa on both, so B3 stays non-vacuous
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[233] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232];   // V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md "What does not change, on every config": "`buildProgram`, `progDigest`" and the header "No program output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after" and "The existing pin must still read `2d35e8f743680cfa` on 233."; V233 is the bike wheel plus the shared 9:59:59 clamp only (Mario's calls, tests/measure/v233_rulings/v233_session_calls.md item 6, D211 and "Build named by Mario: V233."; slice tests/edits/v233_s1_bike_wheel.py); the ruling's "no `MANNY_DIGEST_BY_VERSION` row is added" means no NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2); same reasoning as MANNY_DIGEST_BY_VERSION[233] (standing ruling 5: a reference, not a literal): with buildProgram untouched the __DELOAD_OFF arm builds the same fixture through the same engine; printed equal on the V233 candidate (ia-version 233, shasum 44c37852e835) and on the V232 baseline (ia-version 232, shasum 03b5924d809d) by builder with g199's B2 method (pristine load, globalThis.__DELOAD_OFF=true, the arm built twice and self-stable) before this row: 145c60296526a949 on both trees, against the shipped 2d35e8f743680cfa on both, so B3 stays non-vacuous
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[234] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[233];   // era_bump V234: ruled UNMOVED, reference to [233]; tests/measure/v234_rulings/v234_ruling_d213_d214.md
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[235] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[234];   // era_bump V235: ruled UNMOVED, reference to [234]; tests/measure/v235_rulings/v235_ruling_d215_d217.md
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[236] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[235];   // era_bump V236: ruled UNMOVED, reference to [235]; tests/measure/v236_rulings/v236_ruling_d218_d219.md
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[237] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[236];   // era_bump V237: ruled UNMOVED, reference to [236]; tests/measure/v237_rulings/v237_ruling_d220_d222.md
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[238] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[237];   // era_bump V238: ruled UNMOVED, reference to [237]; tests/measure/v238_rulings/v238_ruling_d223_d227.md
MANNY_CORE_OFF_DIGEST_BY_VERSION[212] = MANNY_CORE_OFF_DIGEST_BY_VERSION[211];   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)
MANNY_CORE_OFF_DIGEST_BY_VERSION[213] = MANNY_CORE_OFF_DIGEST_BY_VERSION[212];   // D113a/D146/injury key: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V213 tree with g199's and g200's methods; HALF_MANNY is a solo NRC half, and neither the pace routing, the NRC multi-sport arm nor the injury key reaches a solo uninjured week)
MANNY_CORE_OFF_DIGEST_BY_VERSION[214] = MANNY_CORE_OFF_DIGEST_BY_VERSION[213];   // D158: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V214 tree with g199's and g200's methods; HALF_MANNY is an NRC race program and the eve rule is NSW dated only, NRC race pins 0/792 moved)
MANNY_CORE_OFF_DIGEST_BY_VERSION[215] = MANNY_CORE_OFF_DIGEST_BY_VERSION[214];   // D149: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[216] = MANNY_CORE_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[217] = MANNY_CORE_OFF_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[218] = MANNY_CORE_OFF_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (9d14801a63111081 printed by coach on the V218-stamped tree)
MANNY_CORE_OFF_DIGEST_BY_VERSION[219] = MANNY_CORE_OFF_DIGEST_BY_VERSION[218];   // V219 (D167/D171/D159/D164/D170/D165/D166): ruled UNMOVED (standing ruling 5: D167 states HALF_MANNY 0ac7da6b1691a8e1 unchanged; measure printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 from the source surgery copies at steps 1 to 7, before the build)
MANNY_CORE_OFF_DIGEST_BY_VERSION[220] = MANNY_CORE_OFF_DIGEST_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only, no hunk reaches buildProgram; standing ruling 5: coach's P-BARERX re-baseline states MANNY_DIGEST_BY_VERSION[<next>] = the [219] row; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed from base_V219 before the build)
MANNY_CORE_OFF_DIGEST_BY_VERSION[221] = MANNY_CORE_OFF_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two loaded landmine lifts, read by scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure on the V220 rebase (tests/measure/v221_rebase_swapfloor.out.txt) and 0/903,969 by builder; D178/D179/D180 are zero-engine; standing ruling 5: all four rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged, and the D180 re-ruling (p_active_ruling.md, RE-RULING ON V220) printed it on the working tree with the V221 slices landed; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper pre-flight on the V221 candidate before these rows)
MANNY_CORE_OFF_DIGEST_BY_VERSION[222] = MANNY_CORE_OFF_DIGEST_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: swap and undo resnapshot, the per-exercise Log snapshots, the swap prune is deleted, records replay per record in recording order and never onto a day restored from ia_hist_; nothing in buildProgram; standing ruling 5: the ruling and its second re-ruling (p_swapdurable_ruling.md) state HALF_MANNY 0ac7da6b1691a8e1 unchanged, printed on V221 and the working tree; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V221 and the V222 working tree with the harness fixture and g199's and g200's methods before these rows)
MANNY_CORE_OFF_DIGEST_BY_VERSION[223] = MANNY_CORE_OFF_DIGEST_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display; its amendment (a) (p_racedate_ruling.md) rules "D182: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V222 tree with S1–S3 landed; (iv) withdrawn, see §12)"; D183 P-SAFEPACE is the wizard cardio_goal step, and its ruling and amendment 2 (p_safepace_ruling.md) state HALF_MANNY is NRC, never reaches that card, digest 0ac7da6b1691a8e1 unchanged; D184 P-TESTLEN pins dated test goals to their test week in the resolver, never NRC, and its ruling (v223_rulings/p_testlen_d184_ruling.md) states HALF_MANNY 0ac7da6b1691a8e1 unchanged by every slice, M7/M8 0/210 race and run_base builds move; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V222 and the V223 working tree (D182 S1–S3, D183, D184 (a)(b) landed) with the harness fixture and g199's and g200's methods before these rows)
MANNY_CORE_OFF_DIGEST_BY_VERSION[224] = MANNY_CORE_OFF_DIGEST_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[225] = MANNY_CORE_OFF_DIGEST_BY_VERSION[224];   // V225 (D186 P-CLOCKEND, D187 P-PACERATE): ruled UNMOVED (both rulings touch the run_pace_goal clock and rate path only; HALF_MANNY's goal is run_half, an NRC race goal, never a run_pace_goal, so the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[225] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[225] are; 9d14801a63111081 printed by builder on the V225 working tree with g199's and g200's methods before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[226] = MANNY_CORE_OFF_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (HALF_MANNY's anchor is kind `entered`, so the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[226] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226] are; 9d14801a63111081 printed by builder on the V226 working tree with g200's method before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[227] = MANNY_CORE_OFF_DIGEST_BY_VERSION[226];   // V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a config carrying `cfg.exSwapPrefs` sourced from a natively cued item under a plan with a cap, and this file's population carries none (the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[227] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227] are; RE-RULING 1 states the core-off arm unmoved by g200_core_tier 43/0 on D190@226; 9d14801a63111081 printed by builder on the V227 working tree (slices 1 and 2) with g200's method before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[228] = MANNY_CORE_OFF_DIGEST_BY_VERSION[227];   // V228 (D193 P-CAPRPE): ruled UNMOVED, reference to [227]; the cue literal, the clamp and the stripper all sit behind applyInjuryFilter's plan, which returns on an uninjured config before any of them is read, and HALF_MANNY is uninjured (the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[228] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228] are; 9d14801a63111081 printed by builder on the V228 working tree (slices 1 and 2) with g200's method before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[229] = MANNY_CORE_OFF_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build half, D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[229] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229] are: HALF_MANNY is uninjured and carries no overlay, so applyInjuryFilter's plan returns before the clamp, the held test (R7) or the stripper is read; the lens (_dayPlanCfg) returns prog.cfg itself on a day with no stamp; and the kept dose (slices 2 and 3, dormant behind cfg.injury) writes nothing on an uninjured program (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", and Amendments 1 and 2 repeat it; 9d14801a63111081 printed by builder on the V229 candidate with g200's method before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[230] = MANNY_CORE_OFF_DIGEST_BY_VERSION[229];   // V230 (D194 P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[230] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[230] are: HALF_MANNY is uninjured and carries no overlay, so _dayPlanCfg returns prog.cfg itself on every unstamped day and the four lensed sites (the tap guard and its filter cfg, the boot guard and its filter cfg) read the same null prog.cfg.injury as V229; nothing behind them runs, and none of the four is reached by buildProgram (standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, printed this session)", carried to V230 by Amendment 1 R3′ ("V230 moves two guards and two filter cfgs and nothing else"); measure M12 (tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md) printed CF6's HALF_MANNY 0ac7da6b1691a8e1 twice before this build, and CF6 is the slice-1 tree; 9d14801a63111081 printed by builder on the V230 candidate with g200's method before this row)
MANNY_CORE_OFF_DIGEST_BY_VERSION[231] = '5770a4b1c4e2404d';   // V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1): the ruled digest move, a LITERAL (D94-t), not a reference: the absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 1, the `MANNY_CORE_OFF_DIGEST_BY_VERSION[231]` row: "ABSORB as a LITERAL row | `5770a4b1c4e2404d` (cand == ALLx; V230/B 9d14801a63111081) | A-1") printed it from the candidate and from the surgery copy ALLx with g200's CLAUSE-strip method (clause count 1 on every tree) before this row (standing ruling 5), class A-1 of D195 Amendment 2 (tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand); the B-alone tree and V230 read 9d14801a63111081 (measure M18: "moves at A (g200_core:151 F1a)"); the core-off arm differs on exactly the same 12 Tuesdays by the same fourth item (12 of 98 days, W1–W12 Tue, each add[Leg circuit — runner armor :: Single-leg hip thrust :: 2×6–10 each @ RPE 7], 0 removals); the shipped-vs-core-off delta is W11 mon on both trees; printed by builder on the V231 candidate (ia-version 231, sha 1249c248a679) and the V230 baseline (ia-version 230, sha 72ac41c8d340) with g200_core_tier's F1a method (the one `_auxFamily(name)==='core'` clause line removed, clause count 1 on both trees, cloned fixture), each arm built twice and self-stable, before this row: candidate 5770a4b1c4e2404d, V230 9d14801a63111081, the rest of each of the 12 days byte-identical on 12 of 12
MANNY_CORE_OFF_DIGEST_BY_VERSION[232] = MANNY_CORE_OFF_DIGEST_BY_VERSION[231];   // V232 (D199–D206 P-RUNWHEEL): ruled UNMOVED, reference to [231]; tests/measure/v232_rulings/v232_ruling_d199_d206.md "What does not change, on every config": "`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)" and "The "after grid" is the log form; no week grid moves."; V232 changes only log-form markup, the wheel machinery and one CSS rule (Mario's calls, tests/measure/v232_rulings/v232_session_calls.md item 7; slices tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py), and none of them reaches buildProgram; same reasoning as MANNY_DIGEST_BY_VERSION[232] (standing ruling 5: a reference, not a literal): the core-off counterfactual strips the one _compoundTier clause V232 does not touch; printed equal on the V232 candidate (ia-version 232, shasum 03b5924d809d) and on the V231 baseline (ia-version 231, shasum d7c42961ba83) by builder with g200_core_tier's F1a method (the one `_auxFamily(name)==='core'` clause line removed, clause count 1 on both trees, cloned fixture, the arm built twice and self-stable) before this row: 5770a4b1c4e2404d on both trees
MANNY_CORE_OFF_DIGEST_BY_VERSION[233] = MANNY_CORE_OFF_DIGEST_BY_VERSION[232];   // V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md "What does not change, on every config": "`buildProgram`, `progDigest`" and the header "No program output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after" and "The existing pin must still read `2d35e8f743680cfa` on 233."; V233 is the bike wheel plus the shared 9:59:59 clamp only (Mario's calls, tests/measure/v233_rulings/v233_session_calls.md item 6, D211 and "Build named by Mario: V233."; slice tests/edits/v233_s1_bike_wheel.py); the ruling's "no `MANNY_DIGEST_BY_VERSION` row is added" means no NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2); same reasoning as MANNY_DIGEST_BY_VERSION[233] (standing ruling 5: a reference, not a literal): the core-off counterfactual strips the one _compoundTier clause V233 does not touch; printed equal on the V233 candidate (ia-version 233, shasum 44c37852e835) and on the V232 baseline (ia-version 232, shasum 03b5924d809d) by builder with g200_core_tier's F1a method (the one `_auxFamily(name)==='core'` clause line removed, clause count 1 on both trees, cloned fixture, the arm built twice and self-stable) before this row: 5770a4b1c4e2404d on both trees
MANNY_CORE_OFF_DIGEST_BY_VERSION[234] = MANNY_CORE_OFF_DIGEST_BY_VERSION[233];   // era_bump V234: ruled UNMOVED, reference to [233]; tests/measure/v234_rulings/v234_ruling_d213_d214.md
MANNY_CORE_OFF_DIGEST_BY_VERSION[235] = MANNY_CORE_OFF_DIGEST_BY_VERSION[234];   // era_bump V235: ruled UNMOVED, reference to [234]; tests/measure/v235_rulings/v235_ruling_d215_d217.md
MANNY_CORE_OFF_DIGEST_BY_VERSION[236] = MANNY_CORE_OFF_DIGEST_BY_VERSION[235];   // era_bump V236: ruled UNMOVED, reference to [235]; tests/measure/v236_rulings/v236_ruling_d218_d219.md
MANNY_CORE_OFF_DIGEST_BY_VERSION[237] = MANNY_CORE_OFF_DIGEST_BY_VERSION[236];   // era_bump V237: ruled UNMOVED, reference to [236]; tests/measure/v237_rulings/v237_ruling_d220_d222.md
MANNY_CORE_OFF_DIGEST_BY_VERSION[238] = MANNY_CORE_OFF_DIGEST_BY_VERSION[237];   // era_bump V238: ruled UNMOVED, reference to [237]; tests/measure/v238_rulings/v238_ruling_d223_d227.md

module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES,
                   MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
                   MANNY_CORE_OFF_DIGEST_BY_VERSION };

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
