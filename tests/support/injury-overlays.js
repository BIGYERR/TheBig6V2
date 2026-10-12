'use strict';
// Fixtures, hand tables and the app drivers for the injury and travel overlay tests (tests/integration/
// injury-overlays.test.js and tests/sweeps/injury-overlays.test.js).
//
// PRESENTATIONS. Since V98 the app's injury reaches a program only as an overlay. Two ways to put an injury on a
// stored program, both seeded and clock-pinned:
//   CFG  the fixture: the config with cfg.injury stored, no overlay.
//   OV   the app's own writer: an uninjured build is stored with startDate 2026-08-24 and booted, then
//        `_ovDraft.injRegion=…; _ovDraft.injTier=…; _ovDraft.from=…; applyInjuryDraft()` writes the overlay, and the
//        stored record is read back from ia_programs (overlay id and created fixed, so two writes compare equal).
// Every expected value lives in the tests or in the hand tables below (the cap table, the hold shapes, the cue, the
// held-test text, the toasts). The engine's _pattern only names a movement's pattern; the plan is what is under test.
const { loadApp, pinClock, fixtures } = require('./app.js');

const clone = (x) => JSON.parse(JSON.stringify(x));
/** A host-realm copy of a value read out of the app's VM. */
const host = clone;
const clean = (s) => String(s == null ? '' : s).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ISO_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const START = '2026-08-24';

// ── typed copy (D193, D194) ──────────────────────────────────────────────────────────────────────────────────────────
const OLDC = ' — hold RPE 7, two in the tank';
const NEWC = ' — hold RPE 7, three in the tank';
const CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/;
const TEST_T = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7_T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST_SHAPE = /^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const R7_SHAPE = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const HOLD = ' Your injury plan holds this one at RPE 7.';
const FORBID = ['stop 2 reps short', '~2 reps', '~1 rep', 'heaviest pair'];
const POWER = /fast and crisp|crisp and explosive|explosive|max intent/i;

// ── the hand cap table (D193 Amendment 1): the patterns each plan holds at RPE 7 ────────────────────────────────────
const CAP = {
  knee: { workaround: ['squat', 'lunge', 'leg_iso'], protect: ['hinge'] },
  ankle: { workaround: ['squat', 'lunge'], protect: ['squat'] },
  hip: { workaround: ['hinge', 'lunge', 'hip_ext', 'squat'], protect: ['squat'] },
  lowback: { workaround: ['hinge', 'squat', 'row', 'hip_ext'], protect: ['squat', 'hip_ext'] },
  shoulder: { workaround: ['hpress', 'vpress', 'delt_iso'], protect: [] },
  elbow: { workaround: ['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect: ['row', 'vpull'] },
};
const capOf = (cfg) => (cfg && cfg.injury ? CAP[cfg.injury.region][cfg.injury.tier] : []);
/** The largest RPE a detail names (a range by its top), or null. */
const rpeMax = (d) => {
  const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map((m) => Math.max(+m[1], m[2] ? +m[2] : 0));
  return v.length ? Math.max(...v) : null;
};
/** The hand hold (D193 Amendment 1 §3 four shapes plus R7's fifth): what a capped detail above RPE 7 reads after the clamp. */
function handHold(d) {
  if (typeof d !== 'string') return d;
  if (TEST_SHAPE.test(d)) return R7_T;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\+?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if (!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if (!g) return 'RPE 7';
    if (/^stop/.test(gl)) return 'RPE 7 (leave 3 or more in reserve)';
    if (/^heaviest/.test(gl)) return 'RPE 7 (leave ~3 in reserve)';
    return 'RPE 7 (leave ~3 reps in reserve)';
  });
}

// ── fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
// Mario's lifting shape (the D190 presentation): commercial, beginner, support_strength, rest sun and wed, seed 76308.
const MARIO = { name: 'M', primaryPath: 'lift', cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, liftingFocus: 'support_strength',
  experience: 'beginner', ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(),
  bench: 135, squat: 155, deadlift: 185, seed: 76308 };
const withInj = (inj, extra) => {
  const c = Object.assign(clone(MARIO), extra || {});
  if (inj) c.injury = { ...inj };
  return c;
};
const seeded = (c) => { const x = clone(c); if (typeof x.seed !== 'number') x.seed = 76308; return x; };
/** The nine D190 configs: Mario at knee/workaround, HALF_MANNY, Mario uninjured, and each region's plan. */
const L9 = {
  mario: withInj({ region: 'knee', tier: 'workaround' }), manny: seeded(fixtures.HALF_MANNY), mario_noinj: withInj(null),
  knee_protect: withInj({ region: 'knee', tier: 'protect' }), ankle_wa: withInj({ region: 'ankle', tier: 'workaround' }),
  hip_wa: withInj({ region: 'hip', tier: 'workaround' }), lowback_wa: withInj({ region: 'lowback', tier: 'workaround' }),
  shoulder_wa: withInj({ region: 'shoulder', tier: 'workaround' }), elbow_wa: withInj({ region: 'elbow', tier: 'workaround' }),
};
/** The seven injured D190 configs, largest lattice first. */
const CK7 = ['elbow_wa', 'shoulder_wa', 'lowback_wa', 'hip_wa', 'knee_protect', 'mario', 'ankle_wa'];
const REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'];
/** region x tier x equipment x experience x support focus on Mario's shape (L432 on four tiers, 108 on home_basic). */
function grid(equipments, extra) {
  const r = [];
  for (const g of REGS) for (const t of ['workaround', 'protect']) for (const eq of equipments)
    for (const ex of ['beginner', 'intermediate', 'advanced']) for (const fo of ['support_strength', 'support_athletic', 'support_prevention'])
      r.push({ k: `${g}/${t}|${eq}|${ex}|${fo}`, c: Object.assign(clone(MARIO), { injury: { region: g, tier: t }, equipment: eq, experience: ex, liftingFocus: fo }, extra || {}) });
  return r;
}
const L432_EQ = ['commercial', 'crossfit', 'home_full', 'bodyweight'];
/** D177's lite lattice: 6 tiers x 4 foci x 2 experiences x {lift only, half} x {healthy, knee/wa, lowback/wa, shoulder/protect} = 384. */
function liteLattice() {
  const out = [];
  const LO = { k: 'liftonly', id: null };
  const HALF = { k: 'half', id: 'run_half' };
  const INJ = [{ k: 'healthy', v: null }, { k: 'knee/workaround', v: { region: 'knee', tier: 'workaround' } },
    { k: 'lowback/workaround', v: { region: 'lowback', tier: 'workaround' } }, { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' } }];
  for (const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'])
    for (const f of ['support_prevention', 'support_strength', 'hypertrophy', 'strength']) for (const x of ['beginner', 'advanced'])
      for (const g of [LO, HALF]) for (const i of INJ) {
        const race = !!g.id;
        const c = { name: 'M', primaryPath: g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes: g.id ? ['run'] : [],
          cardioGoals: g.id ? { run: { id: g.id, label: g.k, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } } : {},
          eventTargeted: race, raceDate: race ? '2026-12-06' : null, liftingFocus: f, experience: x, ageBracket: '18-35', equipment: t, unit: 'lbs',
          restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 76308 };
        if (i.v) c.injury = { ...i.v };
        out.push({ k: [t, f, x, g.k, i.k].join('|'), c });
      }
  return out;
}

// ── the app, booted for tap-level work ──────────────────────────────────────────────────────────────────────────────
// The shim captures toasts and stubs the screen calls a swap or an overlay makes; it changes no data path.
const HELP = "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};showScreen=function(){};try{closeRestSheet=function(){};}catch(e){}try{popFire=function(){};}catch(e){}"
  + 'globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};'
  + 'globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};'
  + "globalThis.__dayLists=function(w,d){var day=activeProg.weeks[w]&&activeProg.weeks[w][d];var out=[];if(!day||day.rest||!day.sections)return {stamp:null,rows:out};day.sections.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var p=_pattern(it.name);if(p){var c=swapCandidates(it.name,day,w,activeProg);out.push({si:si,ii:ii,n:it.name,k:'pat',L:c.tier1.concat(c.tier2)});}else if(_auxFamily(it.name)){out.push({si:si,ii:ii,n:it.name,k:'aux',L:auxSwapCandidates(it.name,day,activeProg).slice()});}});});var a=addCandidates(day,w,activeProg);out.push({si:-1,ii:-1,n:'(add)',k:'add',L:[].concat(a.gap.map(function(x){return 'g:'+x;}),a.more.map(function(x){return 'm:'+x;}),a.off.map(function(x){return 'o:'+x;}))});return {stamp:day._ovKey?JSON.stringify(day._ovKey):null,rows:out};};"
  + "globalThis.__weekLists=function(w){var o={};['mon','tue','wed','thu','fri','sat','sun'].forEach(function(d){o[d]=__dayLists(w,d);});return JSON.stringify(o);};";
/** A fresh app with its clock at noon on `clock` and the shim installed. */
function appAt(clock, file) {
  const X = loadApp(file ? { file } : {});
  pinClock(X, new Date(clock + 'T12:00:00'));
  X.eval(HELP);
  return X;
}
const E = (X, code) => X.eval(code);
const CACHE = new Map();
/**
 * A shared app at `clock`, one per (clock, slot). A cold VM spends its first build warming up, so tests reuse a few;
 * setup() replaces the whole stored state each time, as a cold boot would.
 */
function sharedApp(clock, slot = 0) {
  const k = clock + '#' + slot;
  if (!CACHE.has(k)) CACHE.set(k, appAt(clock));
  return CACHE.get(k);
}
/** Stores a program record and boots it as the active program 'PM'. */
function setup(X, st) {
  X.localStorage.clear();
  X.ctx.__SP = JSON.parse(st);
  E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
}
/** Boots `dst` from the storage `src` left (a reload). */
function bootFrom(src, dst) {
  const ls = new Map(src.localStorage._map);
  dst.localStorage.clear();
  for (const [k, v] of ls) dst.localStorage.setItem(k, v);
  E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
}
/** The stored record for `cfg`: pres 'CFG' stores the injury in cfg; 'OV' writes it as an overlay from `from` (X pinned). */
function stored(X, cfg, pres, from) {
  const base = clone(cfg);
  delete base.injury;
  const c = pres === 'CFG' ? clone(cfg) : base;
  const s = clone(X.buildProgram(clone(c)));
  Object.assign(s, { id: 'PM', name: 'M', created: 1, startDate: START, cfg: clone(c) });
  let j = JSON.stringify(s);
  if (pres === 'OV' && cfg.injury) {
    setup(X, j);
    writeInjury(X, cfg.injury, from);
    const o = JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find((x) => x.id === 'PM');
    (o.overlays || []).forEach((v) => { v.id = 'ov_fixed'; v.created = 1; });
    j = JSON.stringify(o);
  }
  return j;
}
/** The app's injury writer on the active program. */
function writeInjury(X, inj, from) {
  const n0 = +E(X, '(activeProg.overlays||[]).length');
  E(X, `_ovDraft.injRegion=${JSON.stringify(inj.region)};_ovDraft.injTier=${JSON.stringify(inj.tier)};_ovDraft.from=${JSON.stringify(from)};applyInjuryDraft();`);
  if (+E(X, '(activeProg.overlays||[]).length') !== n0 + 1) throw new Error(`overlay not written ${inj.region}/${inj.tier} from ${from}`);
}
/** A booted app holding `cfg` at `clock`, presented as pres ('CFG' or 'OV' from `from`). */
function progAt(cfg, pres, clock, from, slot = 0) {
  const st = stored(sharedApp(clock, 9), cfg, pres, from);
  const X = sharedApp(clock, slot);
  setup(X, st);
  return { X, st };
}
const dayOf = (X, w, d) => JSON.parse(E(X, `JSON.stringify(activeProg.weeks[${w}]&&activeProg.weeks[${w}].${d}||null)`));
const weekOf = (X, w) => JSON.parse(E(X, `JSON.stringify(activeProg.weeks[${w}]||null)`));
const stampOf = (X, w, d) => E(X, `(function(){var dy=activeProg.weeks[${w}]&&activeProg.weeks[${w}].${d};return dy&&typeof dy._ovKey==='string'?dy._ovKey:null;})()`);
/** One slot: name, detail, and the kept pre-hold dose if the hold wrote one. */
function slotOf(X, w, d, si, ii) {
  return JSON.parse(E(X, `(function(){var dy=activeProg.weeks[${w}]&&activeProg.weeks[${w}].${d};var it=dy&&dy.sections&&dy.sections[${si}]&&dy.sections[${si}].items[${ii}];return JSON.stringify(it?{n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null}:{n:'(none)',d:'',h:null});})()`));
}
/** Finds the one slot named `name` in a section whose label starts `sec` on week w, day d. */
function findSlot(X, w, d, sec, name) {
  const dy = dayOf(X, w, d);
  let L = null;
  ((dy && dy.sections) || []).forEach((s, si) => {
    if (clean(s.label).indexOf(sec) !== 0) return;
    (s.items || []).forEach((it, ii) => { if (!L && it && clean(it.name) === name) L = { w, d, si, ii }; });
  });
  return L;
}
/** The swap sheet's tap: applySwapChoice onto `to`. Returns the slot after, the toasts and whether `to` was offered. */
function hop(X, c, to) {
  E(X, `currentWeek=${c.w};currentDayKey='${c.d}';__T.length=0;`);
  const cur = slotOf(X, c.w, c.d, c.si, c.ii);
  const offered = host(E(X, `__cands(activeProg.weeks[${c.w}].${c.d},${c.w},${JSON.stringify(cur.n)})`)).includes(to);
  X.ctx.__c = { secIdx: c.si, itemIdx: c.ii, name: cur.n, detail: cur.d };
  X.ctx.__to = to;
  E(X, '_swapCtx=__c;applySwapChoice(__to);');
  const after = slotOf(X, c.w, c.d, c.si, c.ii);
  return { n: clean(after.n), d: after.d, h: after.h, t: host(E(X, '__T')).join(' / '), offered, landed: clean(after.n) === clean(to) };
}
/** Undoes the slot's last swap by its chip. */
function undoLast(X, c) {
  E(X, `currentWeek=${c.w};currentDayKey='${c.d}';`);
  const cur = slotOf(X, c.w, c.d, c.si, c.ii);
  const chip = E(X, `swapOriginOf(${JSON.stringify(cur.n)})`) || '';
  if (chip) E(X, `undoSwap(${JSON.stringify(chip)});`);
  const s = slotOf(X, c.w, c.d, c.si, c.ii);
  return { chip, slot: { n: clean(s.n), d: s.d, h: s.h } };
}
/** The swap records of day key `wk` ('w5_thu') as from>to with each record's kept-dose field. */
function swapRecord(X, wk) {
  const all = JSON.parse(E(X, "localStorage.getItem('ia_swaps_PM')") || '{}');
  return (all[wk] || []).map((e) => e.from + '>' + e.to + ((e && e.rx) || []).map((x) => ' ph=' + (x && typeof x === 'object' && 'ph' in x ? JSON.stringify(x.ph) : '-')).join('')).join(' | ');
}
/** Every card of a program (or a week map), with its section label. */
function cardsOf(prog, build) {
  const m = [];
  const weeks = (prog && prog.weeks) || {};
  Object.keys(weeks).forEach((w) => Object.keys(weeks[w] || {}).forEach((d) => {
    const dy = weeks[w][d];
    ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => {
      if (!it) return;
      const pre = build !== undefined && it.__pre && it.__pre.b === build ? it.__pre.n : it.name;
      m.push({ w: +w, d, si, ii, label: clean(s.label), n: clean(it.name), pre: clean(pre), det: typeof it.detail === 'string' ? it.detail : '' });
    }));
  }));
  return m;
}

// ── the filter lens: the name applyInjuryFilter judged, before bodyweightSweep renamed it (D193 Amendment 1 §2) ─────
const LENS_WRAP = 'var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:globalThis.__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };';
/** An app whose built items carry __pre, the name the injury filter judged. */
function lensApp() {
  const X = appAt('2026-09-24');
  E(X, LENS_WRAP);
  return X;
}
/** Builds cfg in a lens app and returns its cards (pre = the judged name). */
function lensCards(X, cfg) {
  X.ctx.__C = clone(cfg);
  const b = E(X, 'globalThis.__BUILD=(globalThis.__BUILD||0)+1');
  return cardsOf(E(X, 'buildProgram(__C)'), b);
}
/** The engine's pattern of a name, memoised (the classifier is not under test; the plan is). */
function patternOf(X) {
  const memo = {};
  return (n) => (n in memo ? memo[n] : (memo[n] = E(X, `_pattern(${JSON.stringify(clean(n))})`) || '-'));
}

// ── D52 and D44: the injury pool-override chain, read out of the source ─────────────────────────────────────────────
// Gear predicates per tier, transcribed from their one-line definitions (a tier change edits this table by hand).
const POOL_GEAR = {
  bodyweight: { hasBarbell: false, hasCables: false, hasDumbbells: false, isCrossfit: false, hasGHD: false, isBW: true },
  minimal: { hasBarbell: false, hasCables: false, hasDumbbells: true, isCrossfit: false, hasGHD: false, isBW: false },
  home_basic: { hasBarbell: false, hasCables: false, hasDumbbells: true, isCrossfit: false, hasGHD: false, isBW: false },
  home_full: { hasBarbell: true, hasCables: false, hasDumbbells: true, isCrossfit: false, hasGHD: false, isBW: false },
  commercial: { hasBarbell: true, hasCables: true, hasDumbbells: true, isCrossfit: false, hasGHD: true, isBW: false },
  crossfit: { hasBarbell: true, hasCables: false, hasDumbbells: true, isCrossfit: true, hasGHD: true, isBW: false },
};
/** The implement a pool member needs, read from its name (GHD names are a station commercial and crossfit own, D149). */
function poolGearOK(nm, g) {
  const n = String(nm).toLowerCase();
  if (/glute[- ]ham|\bghr\b|45° back extension/.test(n)) return g.hasGHD;
  if (/\bbarbell\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/.test(n)) return g.hasBarbell;
  if (/cable|\brope\b|face pull|pulldown|pec deck|\bleg press\b|leg extension|leg curl|hack squat|\bsmith\b|preacher|\bmachine\b/.test(n)) return g.hasCables;
  if (/\bdumbbell|\bdb\b|goblet/.test(n)) return g.hasDumbbells;
  return true;
}
/** The pool assignments inside the injury override chain (`if(_R==='knee'){ … }` and its else-ifs), comments stripped. */
function injuryPoolAssignments(src) {
  const start = src.indexOf("if(_R==='knee'){");
  if (start < 0) return null;
  let end = start;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; if (!/^\s*else/.test(src.slice(end, end + 12))) break; } }
  }
  const lines = src.slice(start, end).split('\n').map((l) => l.replace(/\/\/.*$/, ''));
  const out = [];
  let region = null;
  let tier = null;
  let buf = null;
  for (const raw of lines) {
    const t = raw.trim();
    const mr = t.match(/_R==='([a-z]+)'/);
    if (mr) region = mr[1];
    const mt = t.match(/_T==='([a-z]+)'/);
    if (mt) tier = mt[1];
    else if (/^\}\s*else\s*\{/.test(t) && region) tier = tier === 'protect' ? 'workaround' : 'protect';
    if (buf) {
      buf.expr += ' ' + t;
      if (/;\s*$/.test(t)) { out.push(buf); buf = null; }
      continue;
    }
    const ma = t.match(/^(?:if\([^)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*Pool)\s*=\s*(.*)$/);
    if (!ma) continue;
    buf = { region, tier, name: ma[1], expr: ma[2] };
    if (/;\s*$/.test(ma[2])) { out.push(buf); buf = null; }
  }
  return out;
}
/** A pool expression's members on one tier, or null when it is not statically evaluable (it reads a live pool). */
function resolvePool(expr, equip) {
  const g = POOL_GEAR[equip];
  const src = expr.replace(/;\s*$/, '');
  const skeleton = src.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/[^/\n]+\/[a-z]*/g, 'RX');
  const known = ['hasBarbell', 'hasCables', 'hasDumbbells', 'isCrossfit', 'hasGHD', 'isBW', '_gear', '_floorPool', '_bw', '_bwHTak', '_bwHTlb', 'filter', 'test', 'n', 'i', 'indexOf', 'length', 'RX', 'slice'];
  if ((skeleton.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).some((id) => !known.includes(id))) return null;
  const _gear = (a) => a.filter((nm) => poolGearOK(nm, g));
  const _floorPool = (p, min, add) => (p.length >= min ? p : p.concat([add]));
  const _bw = (bw, other) => (g.isBW ? bw : other);
  // the two hip-thrust literals D195/D196 name in pool expressions, typed
  const _bwHTak = g.isBW ? 'Single-leg glute bridge' : 'Banded hip thrust';
  const _bwHTlb = g.isBW ? 'Single-leg hip thrust (shoulders on bed)' : 'Banded hip thrust';
  try {
    const f = new Function('hasBarbell', 'hasCables', 'hasDumbbells', 'isCrossfit', 'hasGHD', 'isBW', '_gear', '_floorPool', '_bw', '_bwHTak', '_bwHTlb', 'return (' + src + ');');
    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW, _gear, _floorPool, _bw, _bwHTak, _bwHTlb);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null;
  } catch {
    return null;
  }
}
// The named debt (§12): pre-existing trips, each still live. hip/protect assigns hinge and hip-extension pools its own
// plan deletes on purpose (vestigial pools); twelve pools are authored with fewer than two members.
const POOL_DEBT = [
  'same-lens hip/protect hingePool Bodyweight back extension',
  'same-lens hip/protect hingePool Barbell Romanian deadlift',
  'same-lens hip/protect hipExtPool 45° back extension',
  'same-lens hip/protect hipExtPool Bodyweight back extension',
  'thin-pool hip/protect hipExtPool', 'thin-pool hip/protect hingePool', 'thin-pool lowback/protect rowPool',
  'thin-pool hip/workaround hingePool', 'thin-pool hip/workaround lungePool', 'thin-pool hip/workaround squatPool',
  'thin-pool ankle/workaround squatPool', 'thin-pool ankle/workaround lungePool', 'thin-pool lowback/protect squatPool',
  'thin-pool lowback/workaround squatPool', 'thin-pool elbow/protect chestCompoundPool', 'thin-pool ankle/protect squatPool',
];

// ── D194: the plan of the day ──────────────────────────────────────────────────────────────────────────────────────
/** The sheets a booted program offers on week w: per day, its stamp and every swap, aux and add list. */
const weekLists = (X, w) => JSON.parse(E(X, `__weekLists(${w})`));
const rowKey = (d, r) => `${d}|${r.k}|${r.si}_${r.ii}|${r.n}`;
/**
 * The judge: the ruled definition of a name the plan rejects. A name is rejected under a fully injured cfg when the
 * injury filter, run on it alone in a separate app, drops or renames it. The sheets under test never judge themselves.
 */
function judgeMaker() {
  const J = loadApp();
  const memo = new Map();
  return (names, cfg) => names.filter((n0) => {
    const n = String(n0).replace(/^[gmo]:/, '');
    const k = JSON.stringify(cfg.injury || null) + '|' + cfg.equipment + '|' + cfg.experience + '|' + n;
    if (!memo.has(k)) {
      const out = J.applyInjuryFilter([{ label: 'x', items: [{ name: n, detail: '3×5' }] }], clone(cfg));
      memo.set(k, !(out && out[0] && out[0].items && out[0].items.length && out[0].items[0].name === n));
    }
    return memo.get(k);
  });
}
/** Rejected names over some days' rows of the given kinds. */
function rejSum(WL, cfg, kinds, days, judge) {
  const r = { rows: 0, offers: 0, rej: 0, ex: [] };
  for (const d of days || ISO_DAYS) for (const row of WL[d].rows.filter((x) => kinds.includes(x.k))) {
    r.rows++;
    r.offers += row.L.length;
    const j = judge(row.L, cfg);
    r.rej += j.length;
    if (j.length) r.ex.push(`${d} ${clean(row.n)}: ${j.join(', ')}`);
  }
  return r;
}
/** Rows of A whose lists equal B's on the same key; `all` when every row matches and both sides hold the same rows. */
function listsEqual(A, B, days) {
  let n = 0;
  let eq = 0;
  let nb = 0;
  const ex = [];
  for (const d of days || ISO_DAYS) {
    const m = new Map(B[d].rows.map((r) => [rowKey(d, r), JSON.stringify(r.L)]));
    nb += B[d].rows.length;
    for (const r of A[d].rows) { n++; if (m.get(rowKey(d, r)) === JSON.stringify(r.L)) eq++; else if (ex.length < 2) ex.push(`${d} ${clean(r.n)} [${r.k}]`); }
  }
  return { n, eq, nb, all: n > 0 && eq === n && nb === n, ex };
}
const stampKey = (inj) => JSON.stringify(['injury', { injury: { region: inj.region, tier: inj.tier } }]);
/** applyOverlays' output shape, built synthetically: every non-rest carded day stamped with the injury key. */
function stampWeeks(weeks, key) {
  let n = 0;
  Object.keys(weeks).forEach((w) => Object.keys(weeks[w]).forEach((d) => {
    const dy = weeks[w][d];
    if (dy && !dy.rest && Array.isArray(dy.sections)) { dy._ovKey = key; n++; }
  }));
  return n;
}

// ── D193 (k) and (l): every Main and Power swap pair of the D177 lite lattice, against the hand hold ─────────────────
// D177's hand rep-floor table and kinds (first match wins), typed.
const HAND_FLOOR = [
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0, 0]],
  [/banded|resistance band|band pull-apart/i, [0, 0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0, 0]],
  [/nordic|glute-ham|\bghr\b/i, [0, 0]],
  [/inverted row|prone y-t-w|reverse snow angel/i, [0, 0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i, [0, 0]],
  [/\bdips\b|pushup|push-up|pike pushup/i, [0, 0]],
  [/squat \(slow/i, [0, 0]],
  [/goblet/i, [8, 12]],
  [/pull-through|pull through/i, [8, 12]],
  [/straight-arm pulldown/i, [8, 12]],
  [/kettlebell swing|\bswing\b/i, [10, 15]],
  [/hip thrust/i, [6, 10]],
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6, 10]],
  [/\brow\b/i, [6, 10]],
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i, [5, 8]],
  [/leg press|hack squat|machine|pulldown/i, [5, 8]],
  [/cable|crossover|pec deck|\bfly\b|flye/i, [8, 12]],
];
const handFloor = (n) => { for (const [re, w] of HAND_FLOOR) if (re.test(String(n || ''))) return w; return null; };
const GRAM = /^(\d+)×(\d+)(?:–(\d+))? — RPE /;
const REP_TOKEN = /^(\d+)×\d+(?:–\d+)?/;
const handRewrite = (d, w) => d.replace(REP_TOKEN, (m, s) => s + '×' + w[0] + '–' + w[1]);
const stripRep = (s) => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');
function handKind(n, D) {
  const W = handFloor(n);
  if (W === null) return { k: 'null', W };
  if (W[1] === 0) return { k: 'zero', W };
  const m = GRAM.exec(D || '');
  if (!m) return { k: 'offgram', W };
  if (+m[2] < W[0]) return { k: 'win', W, out: handRewrite(D, W) };
  return { k: 'atfloor', W };
}
const cueBlind = (s) => { if (typeof s !== 'string') return s; const m = CUE_RE.exec(s); return m ? s.slice(0, m.index) : s; };
const stripHand = (d) => (typeof d !== 'string' ? d : R7_SHAPE.test(d) ? TEST_T : d.replace(CUE_RE, ''));
/** The hand hold as the swap sheet writes it: a bare dose gets the cue; RPE above 7 holds by shape; the test holds as R7. */
function holdHand(d) {
  if (typeof d !== 'string' || !d) return d;
  if (!/RPE/.test(d)) return d + NEWC;
  return handHold(d);
}
const CONVERTS_HAND = /^\s*\d+\s*[×x]\s*\d/;
const bucketHand = (d) => (/rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8);
const claims = (t) => /same numbers|same effort/i.test(String(t));
// R8's three hold toasts, typed
const T3H = (to, from, w) => `${to} in, ${from.toLowerCase()} out. The load runs out before the reps do here. Reps move to ${w[0]} to ${w[1]}.${HOLD}`;
const T119H = (to, from) => `${to} in, ${from.toLowerCase()} out. No load to add here.${HOLD}`;
const TSAMEH = (to, from) => `${to} in, ${from.toLowerCase()} out. Same sets, same reps.${HOLD}`;
const BED_DONOR = 'Single-leg hip thrust (shoulders on bed)';
/** Every Main and Power swap pair of one config: live applySwapChoice, read, undoSwap. pres 'STAMP' is the overlay shape. */
function swapPairs(X, cfg, pres) {
  const p = X.buildProgram(clone(cfg));
  let prog = Object.assign({}, p, { cfg: clone(cfg) });
  if (pres === 'STAMP' && cfg.injury) {
    const key = stampKey(cfg.injury);
    const c2 = clone(cfg);
    delete c2.injury;
    stampWeeks(p.weeks, key);
    prog = Object.assign({}, p, { cfg: c2 });
    prog._swapUniverseByKey = { [key]: p._swapUniverse };
  }
  X.ctx.__P = prog;
  const sc = X.eval('swapCandidates');
  const rows = [];
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d];
    if (!day || day.rest || !Array.isArray(day.sections)) continue;
    X.eval(`activeProg=__P;activeProgId='P1';currentWeek=${+w};currentDayKey='${d}';localStorage.removeItem('ia_swaps_P1');`);
    for (let si = 0; si < day.sections.length; si++) {
      const L = clean(day.sections[si] && day.sections[si].label);
      const isPow = /^power|explosive finisher/i.test(L);
      if (!/^main/i.test(L) && !isPow) continue;
      for (let ii = 0; ii < (day.sections[si].items || []).length; ii++) {
        const it0 = day.sections[si].items[ii];
        if (!it0 || !it0.name || typeof it0.detail !== 'string') continue;
        let c = null;
        try { c = sc(clean(it0.name), day, w, prog); } catch { c = null; }
        if (!c) continue;
        for (const to of [].concat(c.tier1 || [], c.tier2 || []).map((z) => (typeof z === 'string' ? z : z.name))) {
          const it = day.sections[si].items[ii];
          const from = it.name;
          const D = it.detail;
          const raw = JSON.stringify(day.sections);
          let O = null;
          let toast = null;
          let thr = 0;
          try {
            X.ctx.__c = { secIdx: si, itemIdx: ii, name: from, detail: D };
            X.eval('globalThis.__T.length=0;_swapCtx=__c;applySwapChoice(' + JSON.stringify(to) + ')');
            O = day.sections[si].items[ii].detail;
            toast = host(X.eval('globalThis.__T')).pop() || null;
            X.eval('undoSwap(' + JSON.stringify(from) + ')');
          } catch {
            thr = 1;
          }
          day.sections = JSON.parse(raw);
          X.eval("localStorage.removeItem('ia_swaps_P1')");
          rows.push({ key: `${cfg.equipment}|${cfg.liftingFocus}|${cfg.experience}|${cfg.primaryPath}|${cfg.injury ? cfg.injury.region + '/' + cfg.injury.tier : 'healthy'} W${w} ${d} [${si},${ii}] ${clean(from)} -> ${to}`, isPow, to, from, D, O, toast, thr });
        }
      }
    }
  }
  return rows;
}
/** The expected card and toast of a swap pair, by hand (D177's floor beneath D193's hold). */
function classifyPair(cfg, r, pat) {
  const Hk = handKind(r.to, r.D);
  const Db = stripHand(r.D);
  const capd = capOf(cfg).includes(pat(clean(r.to)));
  const conv = Hk.k === 'zero' && CONVERTS_HAND.test(Db);
  const pre = conv ? bucketHand(Db) : rpeMax(Hk.k === 'win' ? handRewrite(Db, Hk.W) : Db);
  const E9 = Hk.k === 'win' ? handRewrite(Db, Hk.W) : Db;
  return { Hk, Db, capd, conv, clamp: capd && pre !== null && pre > 7, kind: Hk.k === 'win' ? 'window' : conv ? 'unloadable' : 'verbatim',
    wantH: Hk.k === 'win' ? T3H(r.to, r.from, Hk.W) : conv ? T119H(r.to, r.from) : TSAMEH(r.to, r.from), X9: capd ? holdHand(E9) : E9 };
}
function newPairTally() {
  return { pairs: 0, thr: 0, clamp: 0, hv: 0, hvK: { verbatim: 0, unloadable: 0, window: 0 }, fals: 0, holdOff: 0, info: 0, hvMiss: 0,
    bt: { pairs: 0, clamp: 0, hv: 0, G3a: 0, off: 0, nul: 0 }, pow: 0, powChg: 0, main: 0, G3a: 0, G3aCls: { donor: 0, window: 0, verbatim: 0 }, G3aMiss: 0,
    offN: 0, off: 0, offMiss: 0, nulN: 0, nul: 0, nulMiss: 0, atN: 0, at: 0, atMiss: 0, winN: 0, win: 0, winMiss: 0, ex: [] };
}
function tallyPair(S, r, c) {
  const O = r.O;
  const D = r.D;
  const t = String(r.toast);
  const bed = clean(r.from) === BED_DONOR;
  const note = (s) => { if (S.ex.length < 5) S.ex.push(s); };
  S.pairs++;
  if (r.thr) S.thr++;
  if (bed) S.bt.pairs++;
  if (c.clamp) {
    S.clamp++;
    if (bed) S.bt.clamp++;
    if (r.toast === c.wantH && t.endsWith(HOLD)) { S.hv++; S.hvK[c.kind]++; if (bed) S.bt.hv++; } else { S.hvMiss++; note(`hold ${r.key} ${t} | want ${c.wantH}`); }
    if (claims(t)) S.fals++;
  } else if (t.endsWith(HOLD)) { S.holdOff++; note(`off-clamp hold ${r.key} ${t}`); }
  if (c.capd && rpeMax(c.Db) !== null && rpeMax(O) !== null && rpeMax(c.Db) !== rpeMax(O) && claims(t) && !t.endsWith(HOLD)) S.info++;
  if (r.isPow) { if (c.Hk.k === 'zero') return; S.pow++; if (cueBlind(O) !== cueBlind(D)) S.powChg++; return; }
  if (c.Hk.k === 'zero') return;
  S.main++;
  if (O !== D && stripRep(O) !== stripRep(D)) { S.G3a++; S.G3aCls[c.capd ? (c.Hk.k === 'win' ? 'window' : 'donor') : 'verbatim']++; if (bed) S.bt.G3a++; }
  if (stripRep(O) !== stripRep(c.X9)) { S.G3aMiss++; note(`card ${r.key} :: ${D} => ${O} | want ${c.X9}`); }
  if (c.Hk.k === 'offgram') { S.offN++; if (cueBlind(O) !== cueBlind(D)) { S.off++; if (bed) S.bt.off++; } if (cueBlind(O) !== cueBlind(c.X9)) { S.offMiss++; note(`offgram ${r.key} :: ${D} => ${O} | want ${c.X9}`); } }
  if (c.Hk.k === 'null') { S.nulN++; if (O !== D) { S.nul++; if (bed) S.bt.nul++; } if (O !== c.X9) { S.nulMiss++; note(`null ${r.key} :: ${D} => ${O} | want ${c.X9}`); } }
  if (c.Hk.k === 'atfloor') { S.atN++; if (O !== D) S.at++; if (O !== c.X9) { S.atMiss++; note(`atfloor ${r.key} :: ${D} => ${O} | want ${c.X9}`); } }
  if (c.Hk.k === 'win') { S.winN++; if (O !== c.Hk.out) S.win++; if (O !== c.X9) { S.winMiss++; note(`window ${r.key} :: ${D} => ${O} | want ${c.X9}`); } }
}

module.exports = {
  swapPairs, classifyPair, newPairTally, tallyPair,
  weekLists, rowKey, judgeMaker, rejSum, listsEqual, stampKey, stampWeeks,
  clone, host, clean, DAYS, ISO_DAYS, START, OLDC, NEWC, CUE_RE, TEST_T, R7_T, TEST_SHAPE, R7_SHAPE, HOLD, FORBID, POWER,
  CAP, capOf, rpeMax, handHold, MARIO, withInj, L9, CK7, REGS, grid, L432_EQ, liteLattice,
  appAt, sharedApp, E, setup, bootFrom, stored, writeInjury, progAt, dayOf, weekOf, stampOf, slotOf, findSlot, hop, undoLast, swapRecord, cardsOf,
  lensApp, lensCards, patternOf,
  POOL_GEAR, injuryPoolAssignments, resolvePool, POOL_DEBT,
};
