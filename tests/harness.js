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
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[212] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211];   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)
MANNY_CORE_OFF_DIGEST_BY_VERSION[212] = MANNY_CORE_OFF_DIGEST_BY_VERSION[211];   // D110a/M2/D144: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V212 tree with g199's and g200's methods; swim only, HALF_MANNY holds 0 swim sessions)

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
