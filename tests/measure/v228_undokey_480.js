// v228_undokey_480.js — MEASURE (read-only). The A>B>C>B chains where CF (swapOriginOf last-match) boots != live after undo
// and V227 boots == live (480 in v228_undokey_abcb_v227.out.txt). Fresh VM per chain AND per boot; V227 HEAD copy + CF only.
//   SCR=<scratch> RUN=<abcb_fresh dir> node tests/measure/v228_undokey_480.js
// Per chain, on CF: (a) after hop1+hop2 (the page before the last tap), boot a fresh VM from a copy of localStorage and compare
// the day to live; then hop3, chip, undo, boot again. (b) the record undo used (from === chip) and its rx; the replay path
// (applySessionSwaps -> applySwapPrefs -> _swapDetailFor) traced record by record on the stored grid by hand-calling the
// file's own _swapDetailFor with an `out` and _repFloor to name its branch. Whether ia_hist_ holds the day (freeze path) is read.
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'; const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR, RUN = process.env.RUN; const FILE = path.join(SCR, 'cf_480.html');
const START = '2026-08-24', CLOCK = '2026-09-24';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const wi = inj => Object.assign(JSON.parse(JSON.stringify(MARIO)), { injury:inj });
const CFGS = { mario:wi({ region:'knee', tier:'workaround' }), lowback_wa:wi({ region:'lowback', tier:'workaround' }), elbow_wa:wi({ region:'elbow', tier:'workaround' }), mario_noinj:JSON.parse(JSON.stringify(MARIO)), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)) };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim(); const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x); const clone = x => JSON.parse(JSON.stringify(x));
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c); const stored = {};
function fresh(){ const T = load(FILE); pin(T); E(T, 'globalThis.__T=[];showToast=function(m){__T.push(String(m));};'); return T; }
function setup(IA, ck){ IA.localStorage.clear(); if(!stored[ck]){ const p = fresh().buildProgram(clone(CFGS[ck])); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[ck] = JSON.stringify(st); } IA.ctx.__SP = JSON.parse(stored[ck]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
const dayOf = (IA, w, d) => E(IA, 'activeProg.weeks[' + w + '].' + d);
const view = (IA, c) => E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';");
function hop(IA, c, to){ view(IA, c); const it = dayOf(IA, c.w, c.d).sections[c.si].items[c.ii]; IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:it.name, detail:it.detail }; IA.ctx.__to = to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); }
function bootCopy(A, c){ const B = fresh(); B.localStorage.clear(); for(const [k, v] of A.localStorage._map) B.localStorage.setItem(k, v); boot(B); return JSON.parse(JS(dayOf(B, c.w, c.d).sections)); }
const items = secs => { const o = []; secs.forEach((s, si) => (s.items || []).forEach((it, ii) => o.push({ si, ii, n:clean(it.name), d:it.detail || '' }))); return o; };
const diffItems = (L, B) => { const a = items(L), b = items(B); const o = []; for(let i = 0; i < Math.max(a.length, b.length); i++){ const x = a[i] || {}, y = b[i] || {}; if(x.n !== y.n || x.d !== y.d) o.push(x.si + '.' + x.ii + ' live[' + x.n + ' | ' + x.d + '] boot[' + y.n + ' | ' + y.d + ']'); } return o; };
// select the 480
const pick = []; for(const f of fs.readdirSync(RUN).filter(f => (process.env.SEL==='h5' ? /^ur_V227_h5_/ : process.env.SEL==='both' ? /^ur_V227_h3_/ : /^ur_V227_h3_(manny|mario_noinj)_/).test(f))){ const V = JSON.parse(fs.readFileSync(path.join(RUN, f), 'utf8')).rows, C = new Map(JSON.parse(fs.readFileSync(path.join(RUN, f.replace('ur_V227_', 'ur_CF_')), 'utf8')).rows.map(r => [r.id, r]));
  const meta = JSON.parse(fs.readFileSync(path.join(RUN, 'uc_' + f.slice(8)), 'utf8')); const cm = new Map(meta.chains.map(c => [c.id, c]));
  for(const v of V){ const r = C.get(v.id); if(r && !v.unreach && !r.unreach && (process.env.SEL==='both' ? (!v.bootEq && !r.bootEq) : (v.bootEq && !r.bootEq))) pick.push(Object.assign({ ck:meta.ck }, cm.get(v.id))); } }
const T = {}; const add = k => T[k] = (T[k] || 0) + 1; const ex = [];
for(const c of pick){ const A = fresh(); setup(A, c.ck); boot(A); view(A, c);
  const grid = JSON.parse(JS(dayOf(A, c.w, c.d).sections)); const gSlot = grid[c.si].items[c.ii];
  c.hops.slice(0, -1).forEach(to => hop(A, c, to)); view(A, c);
  const liveS2 = JSON.parse(JS(dayOf(A, c.w, c.d).sections)); const bootS2 = bootCopy(A, c); const s2eq = JSON.stringify(liveS2) === JSON.stringify(bootS2);
  const histKey = E(A, "Object.keys(getDayHist())").length;
  hop(A, c, c.hops[c.hops.length - 1]); view(A, c);
  const st = clone(JSON.parse(A.localStorage.getItem('ia_swaps_PM'))['w' + c.w + '_' + c.d]);
  const cur = clean(dayOf(A, c.w, c.d).sections[c.si].items[c.ii].name); const chip = E(A, 'swapOriginOf(' + JSON.stringify(cur) + ')');
  const hit = st.filter(e => e.from === chip)[0]; E(A, 'undoSwap(' + JSON.stringify(chip) + ');');
  const liveU = JSON.parse(JS(dayOf(A, c.w, c.d).sections)); const stAfter = clone(JSON.parse(A.localStorage.getItem('ia_swaps_PM'))['w' + c.w + '_' + c.d] || []); const bootU = bootCopy(A, c);
  const uEq = JSON.stringify(liveU) === JSON.stringify(bootU); const uVsS2live = JSON.stringify(liveU) === JSON.stringify(liveS2); const uBootVsS2boot = JSON.stringify(bootU) === JSON.stringify(bootS2);
  // hand replay of the remaining store over the grid slot, branch named record by record (the file's own _swapDetailFor/_repFloor)
  let d = gSlot.detail, br = []; for(const e of stAfter){ if(e.from !== clean(gSlot.name) && br.length === 0){ continue; } }
  let nm = gSlot.name; const trace = []; for(const e of stAfter){ if(e.from !== nm) { trace.push(e.from + '->' + e.to + ' (no item named ' + e.from + ' at the slot: skipped)'); continue; } A.ctx.__a = [e.to, d]; const res = E(A, '(function(){var o={};var fl=_repFloor(__a[0]);var r=_swapDetailFor(__a[0],_stripCapCue(__a[1]),o);return {r:r,fl:fl,win:o.win||null};})()');
    const branch = res.fl && res.fl[1] !== 0 ? (res.win ? 'D177 rep window (fired)' : 'D177 floor row, carried verbatim') : (res.fl && res.fl[1] === 0 ? (res.r !== d ? '_bwSetsFromDetail conversion' : 'unloadable, kept') : 'verbatim (no floor)');
    trace.push(e.from + '->' + e.to + ': ' + JSON.stringify(d) + ' => ' + JSON.stringify(res.r) + ' [' + branch + ']'); d = res.r; nm = e.to; }
  const dl = diffItems(liveU, bootU); const slotDiff = dl.filter(x => x.startsWith(c.si + '.' + c.ii + ' ')).length > 0;
  const lD = liveU[c.si].items[c.ii].detail, bD = bootU[c.si].items[c.ii].detail; const sameNameElsewhere = items(liveU).filter(x => !(x.si === c.si && x.ii === c.ii) && x.n === clean(liveU[c.si].items[c.ii].name)).length;
  const shape = /^\d+ sets — /.test(lD) !== /^\d+ sets — /.test(bD) ? 'bwsets form on one side' : (/×\d+–\d+/.test(lD) !== /×\d+–\d+/.test(bD) ? 'rep window on one side' : 'other');
  const kind = (s2eq ? 'S2 boot==live (appears after undo)' : 'S2 boot!=live (pre-existing)');
  add(c.ck + ' | ' + kind); add('ALL | ' + kind); add('ALL | after-undo boot == S2 boot: ' + uBootVsS2boot); add('ALL | after-undo live == S2 live: ' + uVsS2live); add('ALL | slot differs: ' + slotDiff + ', other items differ: ' + (dl.length - (slotDiff ? 1 : 0)));
  add('ALL | text shape: ' + shape); add('ALL | same name elsewhere on the day: ' + (sameNameElsewhere > 0)); add('ALL | hand replay == boot slot detail: ' + (d === bD)); add('ALL | undo rx entries ' + (hit.rx ? hit.rx.length : 0)); add('ALL | ia_hist_ keys at S2 ' + histKey);
  add('BRANCH last replay record: ' + (trace[trace.length - 1] || '').replace(/^.*\[/, '[')); add('SHAPE ' + c.ck + ' ' + clean(gSlot.name) + ' > ' + c.hops.join(' > ').slice(0, 0) + '| ' + shape);
  if(ex.length < 4 && (ex.length < 1 || !ex.some(x => x.startsWith(c.ck))  || (c.ck === 'manny' && /Garhammer/.test(c.hops.join()) && !ex.some(x => /Garhammer/.test(x))))) ex.push(c.ck + ' W' + c.w + ' ' + c.d + ' slot ' + c.si + '.' + c.ii + ' : ' + clean(gSlot.name) + ' ' + JSON.stringify(gSlot.detail) + ' > ' + c.hops.join(' > ')
    + '\n    S2 (before last tap): boot==live ' + s2eq + (s2eq ? '' : ' | diff ' + diffItems(liveS2, bootS2).join(' ; '))
    + '\n    store before undo ' + JSON.stringify(st.map(e => ({ from:e.from, to:e.to, rx:e.rx }))) + '\n    chip ' + chip + ' | undo used record ' + hit.from + '->' + hit.to + ' rx ' + JSON.stringify(hit.rx || null)
    + '\n    store after undo ' + JSON.stringify(stAfter.map(e => e.from + '->' + e.to)) + '\n    live after undo slot ' + JSON.stringify(lD) + ' | boot slot ' + JSON.stringify(bD) + ' | all diffs ' + dl.join(' ; ')
    + '\n    hand replay (applySessionSwaps :10305 -> applySwapPrefs :10159 -> _swapDetailFor :10123): ' + trace.join(' | '));
}
console.log('v228_undokey_480 | CF from V227 HEAD | chains selected ' + pick.length + ' (manny ' + pick.filter(c => c.ck === 'manny').length + ', mario_noinj ' + pick.filter(c => c.ck === 'mario_noinj').length + ')');
Object.keys(T).sort().forEach(k => console.log('  ' + k + '  ' + T[k])); ex.forEach(e => console.log('  EX ' + e));
