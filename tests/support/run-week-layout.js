'use strict';
// Helpers for the run week layout tests: tests/integration/run-week-layout.test.js runs each claim on a seeded sample,
// tests/sweeps/run-week-layout.test.js runs the whole lattices. Built on tests/support/app.js; the leg lift placement
// and long-run day helpers (tests/support/leg-lift-placement.js, long-run-day.js) build on this file in turn.
//
// What a run week is, typed here from the rulings and never asked of the app:
//   the week      Sunday first and circular (D130): Saturday and Sunday are neighbours. ISO order (Monday first) is
//                 the order "the last run of the week" is read in.
//   the cards     an NSW run card is read by its dose key: 'int' is the Short Interval (SI), 'chi' the Long Interval
//                 (LI) (D103a); a Long Slow Distance (LSD) card is the long run when it loads the legs and the easy run
//                 when it does not. cardNameAgrees() holds the printed name to the key.
//   adjacency     two hard runs (INT, CHI, the long run) on neighbouring days are a pair. On the pace family the one
//                 TOLERATED pair is a CHI on the calendar eve of the long run; every other pair is UNTOLERATED (D130).
//   the objective the run day chooser's ranks, highest first (D125, D129, D130): fewest untolerated pairs, fewest
//                 tolerated pairs, the long run on the last training day, quality days after a rest day, an easy run
//                 the day before the long run, INT before CHI, the even spread subset the athlete already has, the
//                 shortest longest run free stretch, the most rest from the last quality day into the long run, the
//                 earliest first quality day. Ranks 6 to 9 and the tolerated pair are pace family only; NRC keeps its
//                 two long run pins (the subset ends on the last training day, the long run is the last chosen day)
//                 and its shipped "easy run before the long" predicate, read through the Sunday first list.
//   layouts()     every subset of training days crossed with every distinct permutation of the session types, in
//                 the enumeration order the legacy gates used, each scored by that objective. The engine's pick must
//                 be a maximum of it.
//
// chooser() lifts the app's own run day chooser (_nrcSpacedRunDays) and its session tables out of the inline script
// and runs them alone: they are nested inside the cardio engine, so tests/support/app.js appFunction cannot reach them.
const vm = require('node:vm');
const { appScript, loadApp, pinClock } = require('./app.js');
const { stripComments } = require('./week-view.js');

/** The day every build sees as today (local time), as tests/integration/program-output.test.js pins it. */
const TODAY = new Date(2026, 9, 11, 12, 0, 0);

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ISO = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const pos = d => DAYS.indexOf(d);
const circ = (a, b) => { const r = Math.abs(pos(a) - pos(b)); return Math.min(r, 7 - r); };
const prevDay = d => DAYS[(pos(d) + 6) % 7];
const nextDay = d => DAYS[(pos(d) + 1) % 7];
const clone = o => JSON.parse(JSON.stringify(o));

/** Every k-subset of arr, in lexicographic order. */
function combos(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [h, ...t] = arr;
  return combos(t, k - 1).map(c => [h, ...c]).concat(combos(t, k));
}
/** Every permutation of a, first element first. */
function perms(a) {
  if (!a.length) return [[]];
  const o = [];
  a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => o.push([x, ...p])));
  return o;
}
/** The rest-day calendars with nRest rest days, for each count listed, in the order the gates walked them. */
function calendars(counts) {
  const out = [];
  counts.forEach(n => combos(DAYS, n).forEach(rest => out.push({ rest, train: DAYS.filter(d => !rest.includes(d)), key: rest.join(',') || 'none' })));
  return out;
}
/** Every k-th element, from the first: a deterministic sample of a lattice. */
const every = (list, k) => list.filter((_, i) => i % k === 0);

// ── the app, booted once with its clock pinned ───────────────────────────────────────────────────────────────────
let IA = null;
function app() {
  if (!IA) { IA = loadApp(); pinClock(IA, TODAY); }
  return IA;
}
const build = cfg => app().buildProgram(clone(cfg));
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const cards = day => (!day || !day.cardio) ? [] : [].concat(day.cardio).filter(Boolean);

let CODE = null;
/** The inline script with every comment stripped, for "the source still says X" scans. */
function code() {
  if (CODE === null) CODE = stripComments(appScript());
  return CODE;
}
const flat = () => code().replace(/\s+/g, ' ');
const occurrences = (hay, needle) => hay.split(needle).length - 1;

// ── source surgery: the chooser, lifted out and run alone ─────────────────────────────────────────────────────────
/** The text of `function name(...) {...}`, which must occur exactly once in src; braces are matched past strings and comments. */
function liftFunction(src, name) {
  const sig = 'function ' + name + '(';
  const n = occurrences(src, sig);
  if (n !== 1) throw new Error('liftFunction: "' + sig + '" occurs ' + n + ' times (want 1)');
  const i = src.indexOf(sig);
  let depth = 0, mode = null;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    const c = src[k], d = src[k + 1];
    if (mode === 'line') { if (c === '\n') mode = null; continue; }
    if (mode === 'block') { if (c === '*' && d === '/') { mode = null; k++; } continue; }
    if (mode) { if (c === String.fromCharCode(92)) { k++; continue; } if (c === mode) mode = null; continue; }
    if (c === '/' && d === '/') { mode = 'line'; k++; continue; }
    if (c === '/' && d === '*') { mode = 'block'; k++; continue; }
    if (c === '"' || c === "'" || c === '`') { mode = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error('liftFunction: ' + name + ' never closes');
}
let CHOOSER = null;
/**
 * The app's run day chooser and the tables it deals from, compiled together in a fresh context with the week order
 * typed: choose(trainDays, capDays, goalId, paceFam) is _nrcSpacedRunDays; sessionTypes is getSessionTypes;
 * nrcTypes is getNRCSessionTypes; isSpeedGoal is the app's. Results are plain data (copied out of the context).
 */
function chooser() {
  if (CHOOSER) return CHOOSER;
  const js = appScript();
  const parts = ['const ALL_DAYS_ORDER = ' + JSON.stringify(DAYS) + ';'];
  ['isSpeedGoal', 'getNRCSessionTypes', 'getSessionTypes', '_nrcSpacedRunDays'].forEach(n => parts.push(liftFunction(js, n)));
  const ctx = vm.createContext({});
  vm.runInContext(parts.join('\n') + '\nglobalThis.__out = { c: _nrcSpacedRunDays, gs: getSessionTypes, gn: getNRCSessionTypes, sp: isSpeedGoal };', ctx);
  const o = ctx.__out;
  CHOOSER = {
    choose: (train, cap, goal, pace) => { const r = o.c(train.slice(), cap, goal, pace); return r ? clone(r) : r; },
    sessionTypes: (...a) => clone(o.gs(...a)),
    nrcTypes: (cap, goal) => clone(o.gn(cap, goal)),
    isSpeedGoal: g => o.sp(g),
  };
  return CHOOSER;
}

// ── the session tables, typed ─────────────────────────────────────────────────────────────────────────────────────
const TP = { long: 'lsd_long', rec: 'lsd_easy', s1: 'int', s2: 'chi' };
const TN = { long: 'nrc_long', rec: 'nrc_recovery', s1: 'nrc_speed1', s2: 'nrc_speed2' };
/** NSW Table 7, as the pace family deals it (D113a): two runs are easy and long; three are INT, CHI and long; four add the easy run. */
const NSW_RUN_TYPES = { 2: ['lsd_easy', 'lsd_long'], 3: ['int', 'chi', 'lsd_long'], 4: ['lsd_easy', 'int', 'chi', 'lsd_long'] };
/** The spacer fallback (D113a): a three-run week no INT, CHI, long layout can keep clean of an untolerated pair. */
const NSW_FALLBACK3 = ['lsd_easy', 'int', 'lsd_long'];
/** The three-run row D129 was ruled on (the fallback row, and the row an excluded injury mode keeps). */
const D129_TYPES = { 3: NSW_FALLBACK3, 4: NSW_RUN_TYPES[4] };
/** The NRC type table by run count: the marathon carries one speed day, every other plan two. */
function nrcTypesHand(n, goal) {
  if (goal === 'run_marathon') {
    if (n >= 5) return ['nrc_recovery', 'nrc_speed1', 'nrc_recovery', 'nrc_recovery', 'nrc_long'];
    return { 4: ['nrc_recovery', 'nrc_speed1', 'nrc_recovery', 'nrc_long'], 3: ['nrc_speed1', 'nrc_recovery', 'nrc_long'], 2: ['nrc_recovery', 'nrc_long'], 1: ['nrc_long'] }[n];
  }
  if (n >= 5) return ['nrc_speed1', 'nrc_recovery', 'nrc_speed2', 'nrc_recovery', 'nrc_long'];
  return { 4: ['nrc_speed1', 'nrc_recovery', 'nrc_speed2', 'nrc_long'], 3: ['nrc_speed1', 'nrc_recovery', 'nrc_long'], 2: ['nrc_recovery', 'nrc_long'], 1: ['nrc_long'] }[n];
}
const NRC_PLANS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'];
const PACE_IDS = ['run_pace_goal', 'run_mile_time', 'run_15_under10'];

// ── adjacency and the objective ───────────────────────────────────────────────────────────────────────────────────
/** Hard pairs on neighbouring days of one week: {coll, untol, tol}. Off the pace family nothing is tolerated. */
function adjacency(days, typeOf, T, pace) {
  const hard = days.filter(d => d && [T.s1, T.s2, T.long].includes(typeOf[d]));
  const L = days.find(d => typeOf[d] === T.long);
  let coll = 0, untol = 0, tol = 0;
  for (let a = 0; a < hard.length; a++) for (let b = a + 1; b < hard.length; b++) {
    const x = hard[a], y = hard[b];
    if (circ(x, y) !== 1) continue;
    coll++;
    const chiEve = pace && !!L && ((typeOf[x] === T.s2 && y === L && x === prevDay(L)) || (typeOf[y] === T.s2 && x === L && y === prevDay(L)));
    if (chiEve) tol++; else untol++;
  }
  return { coll, untol, tol };
}
/** The pace family's D130 split on a built week, by run type tokens: {coll, untol, tol}. */
const classify = (days, typeOf) => adjacency(days, typeOf, TP, true);
function evenIdx(n, cap) {
  const s = [];
  if (cap <= 1) { s.push(n - 1); return s; }
  for (let k = 0; k < cap; k++) { const v = Math.round(k * (n - 1) / (cap - 1)); if (!s.includes(v)) s.push(v); }
  return s.sort((a, b) => a - b);
}
/** The longest run of consecutive run-free days on the circular week. */
function longestFree(days) {
  const P = days.map(pos).sort((a, b) => a - b);
  let lf = 0;
  for (let i = 0; i < P.length; i++) { const nx = (i + 1 < P.length) ? P[i + 1] : P[0] + 7; const g = nx - P[i] - 1; if (g > lf) lf = g; }
  return lf;
}
const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
/** The candidates of `list` whose `key` vector ties the best, in enumeration order. */
function topBy(list, key) {
  let b = list[0];
  list.forEach(c => { if (cmp(c[key], b[key]) > 0) b = c; });
  return list.filter(c => cmp(c[key], b[key]) === 0);
}
/**
 * Every layout of `types` on `cap` of the training days `train`, scored. pace: the pace family's objective; otherwise
 * NRC's, with both long run pins. Each candidate carries:
 *   rank   the full objective, ten terms (ranks 6 to 9 are 0 off the pace family);
 *   ruled  its first six terms, [-untol, -tol, longLast, speedsAfterRest, recBeforeLong, canonical];
 *   shipped  ruled with recBeforeLong read through the Sunday first list (NRC's predicate, and the pace family's before D129);
 *   coll, untol, tol, lf (longest run-free stretch), qr (rank 8), hard (the non-easy days and their types).
 */
function layouts(train, cap, types, T, pace) {
  const inTrain = new Set(train), last = train[train.length - 1], ek = evenIdx(train.length, cap).join(',');
  const out = [], seen = {};
  combos(train.map((_, i) => i), cap).forEach(idxs => {
    if (!pace && idxs[idxs.length - 1] !== train.length - 1) return;
    const days = idxs.map(i => train[i]);
    perms(types).forEach(p => {
      const typeOf = {};
      days.forEach((d, i) => { typeOf[d] = p[i]; });
      const sig = idxs.join() + '|' + days.map(d => typeOf[d]).join();
      if (seen[sig]) return;
      seen[sig] = 1;
      const longDay = days.find(d => typeOf[d] === T.long);
      if (!pace && longDay && longDay !== days[days.length - 1]) return;
      const a = adjacency(days, typeOf, T, pace);
      const quality = days.filter(d => typeOf[d] === T.s1 || typeOf[d] === T.s2);
      const sar = quality.filter(d => !inTrain.has(prevDay(d))).length;
      const rblEve = longDay && days.some(d => typeOf[d] === T.rec && d === prevDay(longDay)) ? 1 : 0;
      const rblShipped = longDay && days.some(d => typeOf[d] === T.rec && circ(d, longDay) === 1 && pos(d) < pos(longDay)) ? 1 : 0;
      const ll = (!longDay || longDay === last) ? 1 : 0;
      const s1 = days.find(d => typeOf[d] === T.s1), s2 = days.find(d => typeOf[d] === T.s2);
      const can = (s1 && s2 && pos(s1) < pos(s2)) ? 1 : 0;
      const lf = longestFree(days);
      const qr = (pace && longDay && quality.length) ? Math.min(...quality.map(d => (pos(longDay) - pos(d) + 7) % 7)) : 0;
      const qf = (pace && quality.length) ? -pos(quality[0]) : 0;
      const ident = pace && idxs.join(',') === ek ? 1 : 0;
      const rbl = pace ? rblEve : rblShipped;
      const ruled = [-a.untol, -a.tol, ll, sar, rbl, can];
      out.push({
        idxs, days, typeOf, coll: a.coll, untol: a.untol, tol: a.tol, longLast: ll, lf, qr, ident,
        ruled, shipped: [-a.untol, -a.tol, ll, sar, rblShipped, can],
        rank: ruled.concat([ident, pace ? -lf : 0, qr, qf]),
        hard: days.filter(d => typeOf[d] !== T.rec).map(d => d + ':' + typeOf[d]).join(' '),
      });
    });
  });
  return out;
}
/** The pace family's types for a capped week (D113a): Table 7's row, or the spacer fallback where three runs cannot stay clean. */
function paceTypes(train, cap) {
  if (cap !== 3) return NSW_RUN_TYPES[cap];
  const clean = layouts(train, 3, NSW_RUN_TYPES[3], TP, true).some(c => c.untol === 0);
  return clean ? NSW_RUN_TYPES[3] : NSW_FALLBACK3;
}
/** The candidate in `list` that is the chooser's pick (same days, same types), or undefined. */
const findPick = (list, train, pick) => list.find(c => c.idxs.join() === pick.idxs.join() && c.days.every(d => c.typeOf[d] === pick.typeOf[d]));
const pickLayout = (train, pick) => pick.idxs.map(i => train[i] + ':' + pick.typeOf[train[i]]).join(' ');
const layoutOf = c => c.days.map(d => d + ':' + c.typeOf[d]).join(' ');

/** THE 14 (D125, D130): the rest-day calendars whose four-run floor is one tolerated CHI on the long run's eve. */
const TOL14 = ['sun,mon,tue', 'sun,mon,thu', 'sun,mon,sat', 'sun,wed,thu', 'sun,wed,sat', 'sun,fri,sat', 'mon,tue,wed',
  'mon,tue,fri', 'mon,thu,fri', 'tue,wed,thu', 'tue,wed,sat', 'tue,fri,sat', 'wed,thu,fri', 'thu,fri,sat'];

// ── built weeks, read by content ──────────────────────────────────────────────────────────────────────────────────
const SI = /^Short Interval \(SI\)/, LI = /^Long Interval \(LI\)/, LSD = /^Long Slow Distance \(LSD\)/;
/** An NSW run card's quality by its dose key: 'int', 'chi' or null. */
function runQuality(c) {
  const k = c && c.dose && c.dose.key;
  return k === 'int' ? 'int' : k === 'chi' ? 'chi' : null;
}
/** The printed name says what the key says: SI is int, LI is chi, and no other run card carries either name or key. */
function cardNameAgrees(c) {
  const s = String(c.subtype || '');
  const byName = SI.test(s) ? 'int' : LI.test(s) ? 'chi' : null;
  return byName === runQuality(c);
}
/** One week's runs by content: {day: 'int' | 'chi' | 'lsd_long' | 'lsd_easy' | 'other'}. */
function runLayout(week) {
  const lay = {};
  DAYS.forEach(d => cards(week[d]).forEach(c => {
    if (c.type !== 'run') return;
    const q = runQuality(c);
    if (q) lay[d] = q;
    else if (LSD.test(String(c.subtype || ''))) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';
    else lay[d] = 'other';
  }));
  return lay;
}
const runDays = lay => DAYS.filter(d => lay[d]);
const layoutString = lay => runDays(lay).map(d => d + ':' + lay[d]).join(' ');
/** Every run card of a program, with where it sits. */
function runCards(p) {
  const out = [];
  weeksOf(p).forEach(w => DAYS.forEach(d => cards(p.weeks[w][d]).forEach(c => { if (c.type === 'run') out.push({ w, d, c }); })));
  return out;
}

// ── configs ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** The pace family config the D125, D127, D129 and D130 rulings were measured on. */
function paceCfg(rest, seed, goalId) {
  return { name: 'P', primaryPath: 'goal', cardioTypes: ['run'],
    cardioGoals: { run: { id: goalId || 'run_pace_goal', label: 'Pace', targetDist: '1.5', targetMins: '10', targetSecs: '0',
      mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' } },
    eventTargeted: false, liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35',
    equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed };
}
const BIKE_BASE = { id: 'bike_base', label: 'Base', baselineDist: '10', baseline: '10mi' };
const SWIM_BASE = { id: 'swim_base', label: 'Base', baselineDist: '1000', baseline: '1000m' };
/** The same athlete with a second sport. */
function paceMultiCfg(rest, seed, other) {
  const c = paceCfg(rest, seed);
  c.cardioTypes = ['run', other];
  c.cardioGoals[other] = clone(other === 'bike' ? BIKE_BASE : SWIM_BASE);
  return c;
}
/** Mario's calendar: rest Sunday and Wednesday, his seed. */
const MARIO_REST = ['sun', 'wed'], MARIO_SEED = 76308;

// ── the walking week (D132) ───────────────────────────────────────────────────────────────────────────────────────
/** The injury states the D132 lattice carries: a protected knee or low back walks every run; a shoulder swims out. */
const WALK_INJ = [
  { k: 'healthy', v: null, walks: false },
  { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' }, walks: false },
  { k: 'lowback/protect', v: { region: 'lowback', tier: 'protect' }, walks: true },
  { k: 'knee/protect', v: { region: 'knee', tier: 'protect' }, walks: true },
];
const WALK_SEEDS = [1013, 3039];
function walkCfg(rest, seed, inj, types, goalId) {
  const T = types || ['run'];
  const cg = {};
  T.forEach(t => {
    cg[t] = t === 'run'
      ? { id: goalId || 'run_pace_goal', label: 'Pace', targetDist: '1.5', targetMins: '11', targetSecs: '0', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' }
      : { id: t === 'bike' ? 'bike_base' : 'swim_base', label: 'Base' };
  });
  const isRace = /half|marathon|5k|10k/.test(goalId || '');
  const c = { name: 'P', primaryPath: isRace ? 'event' : 'cardio', cardioTypes: T.slice(), cardioGoals: cg,
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null, liftingFocus: 'balanced', experience: 'advanced',
    ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed };
  if (inj) c.injury = { region: inj.region, tier: inj.tier };
  return c;
}
/** Bike and swim cards keep their old quality names (D103a renamed only the run cards). */
const BIKE_SWIM_INT = /Interval \(INT\)/, BIKE_SWIM_CHI = /Continuous High Intensity \(CHI\)/;
/** One week's cardio: how many sessions, and whether it carries an INT card and a CHI card. */
function scanWeek(week) {
  let n = 0, hasInt = false, hasChi = false;
  DAYS.forEach(d => cards(week[d]).forEach(c => {
    n++;
    const s = String(c.subtype || '');
    const q = c.type === 'run' ? runQuality(c) : BIKE_SWIM_INT.test(s) ? 'int' : BIKE_SWIM_CHI.test(s) ? 'chi' : null;
    if (q === 'int') hasInt = true;
    if (q === 'chi') hasChi = true;
  }));
  return { n, hasInt, hasChi };
}
/** The goals D132 leaves alone: NRC and run_base are not in the pace family, and a multi-sport week was already held at three. */
const WALK_OUT_OF_SCOPE = [
  { name: 'run_half', goal: 'run_half', types: ['run'] },
  { name: 'run_base', goal: 'run_base', types: ['run'] },
  { name: 'run+bike pace', goal: 'run_pace_goal', types: ['run', 'bike'] },
  { name: 'run+swim pace', goal: 'run_pace_goal', types: ['run', 'swim'] },
];

// ── D113a and D146: three-run pace weeks and multi-sport placement ────────────────────────────────────────────────
/** A card's class from its printed name (D103a for the NSW quality names; the NRC session names for NRC). */
function cls(c) {
  const s = String(c.subtype || '');
  if (c.type !== 'run') return c.type;
  if (/TIME TRIAL|RACE DAY/i.test(s)) return 'race';
  if (/Short Interval \(SI\)/.test(s)) return 'int';
  if (/Long Interval \(LI\)/.test(s)) return 'chi';
  if (LSD.test(s)) return c.legLoad ? 'long' : 'easy';
  if (/^Speed Run/.test(s)) return 'hardq';
  if (/^Long Run/.test(s)) return 'nlong';
  if (/^(Easy Run|Recovery Run|Shakeout)/.test(s)) return 'easy';
  return c.legLoad ? 'hardx' : 'easyx';
}
const RHARD = new Set(['int', 'chi', 'long', 'hardq', 'nlong', 'race', 'hardx']);
function runsOf(week) {
  const out = [];
  DAYS.forEach(d => cards(week && week[d]).forEach(c => { if (c.type === 'run') out.push({ day: d, t: cls(c), c }); }));
  return out;
}
/** Untolerated hard run pairs in one week (D130): a run CHI on the calendar eve of the run long run is the one tolerated pair. */
function untolRuns(R) {
  const hard = R.filter(x => RHARD.has(x.t)), L = R.find(x => x.t === 'long');
  let u = 0;
  for (let a = 0; a < hard.length; a++) for (let b = a + 1; b < hard.length; b++) {
    const x = hard[a], y = hard[b];
    if (circ(x.day, y.day) !== 1) continue;
    const tol = !!L && ((x.t === 'chi' && y === L && x.day === prevDay(L.day)) || (y.t === 'chi' && x === L && y.day === prevDay(L.day)));
    if (!tol) u++;
  }
  return u;
}
const THREE_PERMS = perms(['int', 'chi', 'long']);
const THREE_DAY = combos(DAYS, 3);
/** The spacer calendars, enumerated here: three days on which no order of INT, CHI and long avoids an untolerated pair. */
const SPACER = THREE_DAY.filter(c => Math.min(...THREE_PERMS.map(p => untolRuns(c.map((d, i) => ({ day: d, t: p[i] }))))) > 0).map(c => c.join('+'));
const SPACER_TYPED = ['sun+mon+tue', 'sun+mon+sat', 'sun+fri+sat', 'mon+tue+wed', 'tue+wed+thu', 'wed+thu+fri', 'thu+fri+sat'];
/** The V115 crossover, typed: the first CHI week of a spacer block is max(3, ceil(weeks × 0.55)). */
const handCross = tw => Math.max(3, Math.ceil(tw * 0.55));
const FOCI = ['support_prevention', 'balanced', 'strength'];
const RUNG = { run_pace_goal: { targetDist: '1.5', targetMins: '10', targetSecs: '0' } };
/** The rest-day calendars with zero to four rest days (99), in the order the D113a measure walked them. */
const CALS99 = [];
[0, 1, 2, 3, 4].forEach(n => combos(DAYS, n).forEach(r => CALS99.push(r)));
function mkCfg(g, ex, rest, focus, extra) {
  const cg = { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, RUNG[g] || {}) };
  const types = ['run'];
  if (ex.bike) { types.push('bike'); cg.bike = { id: ex.bike, label: ex.bike, baselineDist: '10', baseline: '10mi' }; }
  if (ex.swim) { types.push('swim'); cg.swim = { id: ex.swim, label: ex.swim, baselineDist: '1000', baseline: '1000m' }; }
  return Object.assign({ name: 'G213', primaryPath: 'goal', cardioTypes: types, cardioGoals: cg, eventTargeted: false, liftingFocus: focus,
    experience: 'intermediate', ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: 1001 }, extra || {});
}
const BIKEG = ['bike_base', 'bike_ftp', 'bike_century'], SWIMG = ['swim_base', 'swim_500_time', 'swim_mile'];
const PACE_EXTRAS = [];
BIKEG.forEach(b => PACE_EXTRAS.push({ bike: b }));
SWIMG.forEach(s => PACE_EXTRAS.push({ swim: s }));
BIKEG.forEach(b => SWIMG.forEach(s => PACE_EXTRAS.push({ bike: b, swim: s })));
const NRC_EXTRAS = [{ bike: 'bike_base' }, { bike: 'bike_ftp' }, { swim: 'swim_base' }, { swim: 'swim_mile' }, { bike: 'bike_base', swim: 'swim_base' }];
/** The pace lattice of D113a: every calendar solo, and with each of 15 bike, swim and bike+swim goals (1,584 configs). */
function paceLattice113() {
  const out = [];
  CALS99.forEach((rest, i) => out.push({ ex: {}, rest, f: FOCI[i % 3] }));
  PACE_EXTRAS.forEach((e, j) => CALS99.forEach((rest, i) => out.push({ ex: e, rest, f: FOCI[(i + j) % 3] })));
  return out.map(x => Object.assign(x, { cfg: mkCfg('run_pace_goal', x.ex, x.rest, x.f) }));
}
/** The NRC multi-sport lattice of D146: four plans, five second sports, every calendar (1,980 configs). */
function nrcLattice146() {
  const out = [];
  NRC_PLANS.forEach((g, gi) => NRC_EXTRAS.forEach((e, j) => CALS99.forEach((rest, i) => out.push({ g, ex: e, rest, f: FOCI[(i + j + gi) % 3] }))));
  return out.map(x => Object.assign(x, { cfg: mkCfg(x.g, x.ex, x.rest, x.f) }));
}
/** The injury modes whose sweep rewrites every run; D113a and D146 leave their weeks unrouted. */
const EXCLUDED_MODES = ['noimpact', 'noimpact_swim', 'easy', 'reduce'];
const EXCL_INJ = [{ region: 'knee', tier: 'protect' }, { region: 'hip', tier: 'protect' }, { region: 'knee', tier: 'workaround' }, { region: 'ankle', tier: 'workaround' }];
/** The day by day sport layout of a program: which days carry a run, bike or swim card, by type and goal. */
const sportLayout = p => Object.keys(p.weeks).map(w => DAYS.map(d => cards(p.weeks[w][d]).map(c => c.type + ':' + (c.goalId || '')).sort().join('+') || '-').join(',')).join('|');
/**
 * sportLayout written short, one-to-one for a given config: a card of the config's own run, bike or swim goal is R, B
 * or S; a run rewritten to a bike or a swim (an injury sweep) is b or s; any other card is its type:goal in brackets.
 * A day is its cards, '-' for none; days are joined by '.', a run of identical weeks is written once with *count.
 */
function layoutCode(p, cfg) {
  const g = cfg.cardioGoals;
  const code = { ['run:' + g.run.id]: 'R', ['bike:' + g.run.id]: 'b', ['swim:' + g.run.id]: 's' };
  if (g.bike) code['bike:' + g.bike.id] = 'B';
  if (g.swim) code['swim:' + g.swim.id] = 'S';
  const weeks = sportLayout(p).split('|').map(w => w.split(',').map(d => d === '-' ? '-' : d.split('+').map(t => code[t] || '[' + t + ']').join('')).join('.'));
  const out = [];
  weeks.forEach(w => { const last = out[out.length - 1]; if (last && last.w === w) last.n++; else out.push({ w, n: 1 }); });
  return out.map(x => x.w + (x.n > 1 ? '*' + x.n : '')).join(' ');
}
/** The run days of one week, in the order the chooser reads the training days. */
const weekRunDays = (p, w, train) => train.filter(d => cards(p.weeks[w][d]).some(c => c.type === 'run'));
/** The multi-sport populations whose layout under the excluded modes is pinned (calendars with at most two rest days). */
const EXCL_POP = {
  pace: [['run_pace_goal', { bike: 'bike_base' }], ['run_pace_goal', { swim: 'swim_base' }], ['run_pace_goal', { bike: 'bike_ftp', swim: 'swim_mile' }]],
  nrc: [['run_5k', { bike: 'bike_base' }], ['run_half', { swim: 'swim_base' }]],
};
const cellKey = (g, e, rest) => [g, Object.keys(e).map(k => e[k]).join('+'), rest.join('') || 'none'].join('|');
/**
 * One population of the exclusion key's claim (pace: three multi-sport pace pairs; nrc: run_5k with a bike, run_half
 * with a swim), on every calendar with at most two rest days. cells: every injury whose plan is an excluded mode,
 * [{key, mode, cfg}]; twins: the same configs uninjured, one per calendar, [{key, cfg}].
 */
function excludedPopulation(row) {
  const plan = app().eval('injuryPlan');
  const C02 = CALS99.filter(r => r.length <= 2);
  const cells = [], twins = [];
  EXCL_POP[row].forEach(([g, e], j) => C02.forEach((rest, i) => {
    const foc = FOCI[(i + j) % 3];
    twins.push({ key: cellKey(g, e, rest), cfg: mkCfg(g, e, rest, foc) });
    EXCL_INJ.forEach(inj => {
      const cfg = mkCfg(g, e, rest, foc, { injury: inj });
      const mode = (plan(clone(cfg)) || {}).cardioMode || 'none';
      if (EXCLUDED_MODES.includes(mode)) cells.push({ key: cellKey(g, e, rest) + '|' + inj.region + '/' + inj.tier, mode, cfg });
    });
  }));
  return { cells, twins };
}
/** The fewest runs a multi-sport week routes from: three on the pace family, two on NRC (D113a, D146). */
const ROUTE_FROM = { pace: 3, nrc: 2 };
/** The training days the cardio engine hands the chooser: Monday first on an NRC plan (V188), Sunday first otherwise. */
const cardioTrainDays = cfg => {
  const train = DAYS.filter(d => !cfg.restDays.includes(d));
  return NRC_PLANS.includes(cfg.cardioGoals.run.id) ? ISO.filter(d => train.includes(d)) : train;
};

module.exports = {
  TODAY, DAYS, ISO, pos, circ, prevDay, nextDay, clone, combos, perms, calendars, every,
  app, build, weeksOf, cards, code, flat, occurrences, liftFunction, chooser,
  TP, TN, NSW_RUN_TYPES, NSW_FALLBACK3, D129_TYPES, nrcTypesHand, NRC_PLANS, PACE_IDS,
  adjacency, classify, evenIdx, longestFree, cmp, topBy, layouts, paceTypes, findPick, pickLayout, layoutOf, TOL14,
  SI, LI, LSD, runQuality, cardNameAgrees, runLayout, runDays, layoutString, runCards,
  paceCfg, paceMultiCfg, BIKE_BASE, SWIM_BASE, MARIO_REST, MARIO_SEED,
  WALK_INJ, WALK_SEEDS, walkCfg, scanWeek, WALK_OUT_OF_SCOPE,
  cls, runsOf, untolRuns, THREE_DAY, SPACER, SPACER_TYPED, handCross, FOCI, CALS99, mkCfg,
  paceLattice113, nrcLattice146, EXCLUDED_MODES, EXCL_INJ, sportLayout, layoutCode, weekRunDays, EXCL_POP,
  excludedPopulation, ROUTE_FROM, cardioTrainDays,
};
