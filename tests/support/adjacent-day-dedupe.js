'use strict';
// Helpers for the adjacent-day dedupe tests (tests/integration/adjacent-day-dedupe.test.js,
// tests/sweeps/adjacent-day-dedupe.test.js). deconflictAdjacentDupes renames a loaded accessory that repeats the
// previous calendar day's name. Rulings:
//   D160  the trigger set is read from the previous day as it will ship, through _d18View (D18 applied to a deep
//         copy); the live week is never touched, so no rename dodges a name the long-run pass strips (a phantom).
//   D167  the pairs walk the calendar the week renders (Mon..Sun, W sun -> W+1 mon), each pair keeping the seed index
//         its A day held under the old Sun..Sat walk; D167a licenses a mid-week cascade only at depth 1, swap only,
//         within pattern.
//   D171  the hinge clamp reads the calendar's tomorrow, so a final Saturday sees the final Sunday.
//   D212  a loaded delt-isolation accessory repeats on the next training day only when the tier's whole family is used.
//
// Oracles: Monday-start date arithmetic for the calendar, the shipped cards, the old walk typed by hand from D167, a
// hand pattern table for D167a, the frozen V218 pattern lens for hinge membership, and D212's family typed by tier.
// Instrumentation is source surgery on a copy of the app (each anchor must occur exactly once): one logging line at the
// dedupe's rename writer, and a wrapper around _d18View that counts calls, mutations of its input and returned inputs.
const { fixtures } = require('./app.js');
const D = require('./duplicate-movements.js');

const { clone } = D;
const OFF = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const ISO = Object.keys(OFF);
/** Monday-start calendar index of a day: (w-1)*7 + {mon:0 .. sun:6}. */
const calIndex = (w, d) => (+w - 1) * 7 + OFF[d];
/** The calendar day before (w, d): W1 Monday has none. */
const calPrev = (w, d) => (OFF[d] > 0 ? { w: +w, d: ISO[OFF[d] - 1] } : { w: +w - 1, d: 'sun' });

// ── the calendar lattice (15,180 configs) ─────────────────────────────────────────────────────────────────────
// Mixes: NRC solo (3,600), NRC multi (600), NSW solo (3,600), injury (480), NSW multi (4,200), gk pace+bike (1,080),
// and the rest-day sweep (1,620). The first four are D160's phantom lattices, the next two its multi-sport limb.
function calendarLattice() {
  const U = [];
  const WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const STAND = { name: 'M', primaryPath: 'goal', eventTargeted: false, cardioTypes: ['run'],
    cardioGoals: { run: { id: 'run_pace_goal', label: 'x', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' } },
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: ['sun', 'wed'],
    days: WD.slice(), bench: 185, squat: 255, deadlift: 315, startDate: '2026-09-21', seed: 24865 };
  const FOC6 = ['balanced', 'hypertrophy', 'strength', 'support_athletic', 'support_prevention', 'support_strength'];
  const EQ = ['crossfit', 'commercial', 'home_full', 'home_basic', 'bodyweight'], EXP = ['beginner', 'intermediate', 'advanced'], AGE = ['18-35', '36-54', '55+'];
  const RESTS = [['sun', 'wed'], ['sat', 'sun'], ['sun'], ['mon', 'wed', 'fri'], ['tue', 'thu', 'sun']];
  const P = (x) => U.push(Object.assign({ ik: x.c.injury ? x.c.injury.region + '/' + x.c.injury.tier : 'healthy' }, x));
  const PLANS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'], RACED = ['2026-12-06', '2027-01-17', '2027-03-28'], MILE = [['7', '30'], ['8', '15'], ['10', '30'], ['12', '0']];
  const EXTRAS = [{ bike: 'bike_base' }, { swim: 'swim_base' }, { bike: 'bike_ftp' }, { swim: 'swim_mile' }, { bike: 'bike_base', swim: 'swim_base' }];
  const nrc = (plan, o, i) => {
    const goals = { run: { id: plan, label: plan, mileBestMins: MILE[i % 4][0], mileBestSecs: MILE[i % 4][1], baselineDist: String([3, 5, 8][i % 3]), baseline: [3, 5, 8][i % 3] + 'mi' } }, types = ['run'];
    if (o.ex && o.ex.bike) { types.push('bike'); goals.bike = { id: o.ex.bike, label: o.ex.bike, baselineDist: '10', baseline: '10mi' }; }
    if (o.ex && o.ex.swim) { types.push('swim'); goals.swim = { id: o.ex.swim, label: o.ex.swim, baselineDist: '1000', baseline: '1000m' }; }
    return Object.assign(clone(fixtures.HALF_MANNY), { name: 'M', primaryPath: o.dated ? 'event' : 'fitness', cardioTypes: types, cardioGoals: goals, eventTargeted: !!o.dated,
      raceDate: o.dated ? RACED[i % 3] : '', startDate: '2026-09-21', liftingFocus: o.f, experience: o.e, ageBracket: AGE[i % 3], equipment: o.q, restDays: o.r.slice(), seed: 76308 });
  };
  let ii = 0;
  for (const plan of PLANS) for (const e of EXP) for (const r of RESTS) for (const q of EQ) for (const f of FOC6) for (const dated of [true, false]) P({ mix: 'NRC solo', c: nrc(plan, { e, r, q, f, dated }, ii++) });
  for (const plan of PLANS) for (const ex of EXTRAS) for (const f of FOC6) for (const q of EQ) P({ mix: 'NRC multi', c: nrc(plan, { ex, e: EXP[ii % 3], r: RESTS[ii % 2], q, f, dated: ii % 2 === 0 }, ii++) });
  for (const g of ['run_pace_goal', 'run_mile_time', 'run_15_under10', 'run_base']) for (const mm of [['8', '15'], ['12', '0']]) for (const f of FOC6) for (const q of EQ) for (const r of RESTS) for (const e of EXP) {
    const c = clone(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
    c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; P({ mix: 'NSW solo', c });
  }
  const GOALS = [['run_5k', {}], ['run_half', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0' }], ['run_base', {}], ['run_10k', {}], ['run_marathon', {}]];
  const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
  for (const q of EQ) for (let si = 0; si < 8; si++) for (const rg of ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle']) for (const t of ['workaround', 'protect']) {
    const [g, x] = GOALS[si % 6];
    P({ mix: 'injury', c: { name: 'M', primaryPath: 'goal', cardioTypes: ['run'], cardioGoals: { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, x) },
      eventTargeted: false, liftingFocus: 'hypertrophy', experience: EXP[si % 3], ageBracket: AGE[si % 3], equipment: q, unit: 'lbs', restDays: [['sun', 'wed'], ['sat', 'sun']][si % 2].slice(),
      days: WD.slice(), bench: 135, squat: 155, deadlift: 185, seed: SEEDS[si], injury: { region: rg, tier: t } } });
  }
  const MIX = [['pace+bike', 'run_pace_goal', { bike: 1 }], ['pace+swim', 'run_pace_goal', { swim: 1 }], ['pace+bike+swim', 'run_pace_goal', { bike: 1, swim: 1 }], ['base+bike', 'run_base', { bike: 1 }]];
  for (const [mk, g, o] of MIX) for (const mm of [['8', '15'], ['12', '0']]) for (const f of FOC6.concat(['fatloss'])) for (const q of EQ) for (const r of RESTS) for (const e of EXP) {
    const c = clone(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
    c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
    if (o.bike) { c.cardioTypes.push('bike'); c.cardioGoals.bike = { id: 'bike_base', label: 'Bb', baselineDist: '10', baseline: '10mi' }; }
    if (o.swim) { c.cardioTypes.push('swim'); c.cardioGoals.swim = { id: 'swim_base', label: 'Sb', baselineDist: '1000', baseline: '1000m' }; }
    P({ mix: 'NSW multi ' + mk, c });
  }
  const mb = { mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' } };
  const INJ4 = [null, null, { region: 'knee', tier: 'workaround' }, { region: 'elbow', tier: 'workaround' }];
  let j = 0;
  for (const eq of ['commercial', 'crossfit', 'home_full', 'home_basic', 'bodyweight']) for (const fo of ['strength', 'hypertrophy', 'balanced', 'support_prevention', 'support_athletic', 'fatloss']) for (const ex of EXP)
    for (const rs of [['sun', 'wed'], ['sat', 'sun'], ['mon', 'thu', 'sun'], ['sun']]) for (const seed of [24865, 76308, 99991]) {
      const inj = INJ4[(j++) % 4];
      const c = { name: 'GK', primaryPath: 'event', eventTargeted: false, raceDate: '', cardioTypes: ['run', 'bike'],
        cardioGoals: { run: Object.assign({ id: 'run_pace_goal', label: 'P' }, mb, { targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' }), bike: { id: 'bike_base', label: 'Bb' } },
        liftingFocus: fo, experience: ex, ageBracket: '18-35', equipment: eq, unit: 'lbs', restDays: rs.slice(), days: WD.slice(), bench: 185, squat: 255, deadlift: 315, startDate: '2026-10-05', seed };
      if (inj) c.injury = inj;
      P({ mix: 'gk pace+bike', c });
    }
  const RS2 = [[], ['mon'], ['wed'], ['fri'], ['sat'], ['mon', 'fri'], ['wed', 'sat'], ['tue', 'fri'], ['mon', 'thu']];
  for (const [g, nrcp] of [['run_half', true], ['run_pace_goal', false]]) for (const r of RS2) for (const f of FOC6) for (const q of EQ) for (const e of EXP) {
    const c = nrcp
      ? Object.assign(clone(fixtures.HALF_MANNY), { name: 'M', primaryPath: 'fitness', eventTargeted: false, raceDate: '', startDate: '2026-09-21', cardioTypes: ['run'],
        cardioGoals: { run: { id: g, label: g, mileBestMins: '8', mileBestSecs: '15', baselineDist: '5', baseline: '5mi' } }, liftingFocus: f, experience: e, equipment: q, restDays: r.slice(), seed: 76308 })
      : Object.assign(clone(STAND), { liftingFocus: f, experience: e, equipment: q, restDays: r.slice() });
    P({ mix: 'rest sweep ' + (nrcp ? 'NRC half' : 'NSW pace'), c });
  }
  // The D167 sweep reads every Sunday-training config and every 8th Sunday-rest config, in lattice order.
  let k = 0;
  U.forEach((x) => {
    x.sunRest = x.c.restDays.includes('sun');
    x.swept = !x.sunRest || (k++) % 8 === 0;
  });
  return U;
}
/** D160's four phantom lattices and its multi-sport limb, by mix. */
const PHANTOM_LATTICE = { 'NRC solo': 'NRC', 'NRC multi': 'NRC multi', 'NSW solo': 'NSW', injury: 'injury' };
const multiLimb = (mix) => (mix === 'gk pace+bike' ? 'gk' : /^NSW multi /.test(mix) ? 'multi' : null);

// ── instrumented copies ───────────────────────────────────────────────────────────────────────────────────────
const RENAME_AT = '        it.name=to;\n';
const RENAME_LOG = '        (globalThis.__DM_REN||(globalThis.__DM_REN=[])).push({day:B,was:it.name,to:to,w:+wB,d:dB,pw:+wA,pd:dA});\n';
const VIEW_AT = 'function _d18View(A, wA, dA){';
const VIEW_WRAP = 'function _d18View(A, wA, dA){ const __s=JSON.stringify(A), __r=_d18View__dm(A, wA, dA); globalThis.__DM_VC=(globalThis.__DM_VC||0)+1;'
  + ' if(JSON.stringify(A)!==__s) globalThis.__DM_VM=(globalThis.__DM_VM||0)+1; if(A&&__r===A) globalThis.__DM_VS=(globalThis.__DM_VS||0)+1; return __r; }\n'
  + 'function _d18View__dm(A, wA, dA){';
/** The app with the rename logger and the _d18View wrapper. */
function instrumentedApp(text) {
  let t = D.replaceOnce(text, RENAME_AT, RENAME_LOG + RENAME_AT, 'the dedupe rename writer');
  t = D.replaceOnce(t, VIEW_AT, VIEW_WRAP, 'the _d18View declaration');
  const IA = D.loadText(t, 'dedupe-instrumented');
  IA.window.__DM_VC = 0; IA.window.__DM_VM = 0; IA.window.__DM_VS = 0;
  return IA;
}
// The walk before D167, typed by hand from its text: Sun..Sat, W sat -> W+1 sun, four-element pairs (so every pair
// seeds from its position in this walk).
const LEGACY_WALK = "function _adjDayPairs(totalWeeks){\n  const SS=['sun','mon','tue','wed','thu','fri','sat'], out=[];\n"
  + '  for(let w=1;w<=totalWeeks;w++){\n    for(let i=1;i<7;i++) out.push([w,SS[i-1],w,SS[i]]);\n'
  + "    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);\n  }\n  return out;\n}\n";
/** The app with its `_adjDayPairs` replaced by the legacy walk. */
function legacyWalkApp(text) {
  const FN = 'function _adjDayPairs(';
  if (D.count(text, FN) !== 1) throw new Error('legacy walk: "' + FN + '" occurs ' + D.count(text, FN) + ' times');
  const i0 = text.indexOf(FN), k0 = text.indexOf('\n}\n', i0);
  if (k0 < 0) throw new Error('legacy walk: no close of _adjDayPairs');
  return D.loadText(text.slice(0, i0) + LEGACY_WALK + text.slice(k0 + 3), 'legacy-walk');
}
/** Builds a config on the instrumented app and returns the program and its renames. */
function buildLogged(IA, cfg) {
  IA.window.__DM_REN = [];
  const p = IA.buildProgram(cfg);
  const R = IA.window.__DM_REN || [];
  IA.window.__DM_REN = [];
  return { p, R };
}

// ── card oracles ──────────────────────────────────────────────────────────────────────────────────────────────
const dayOf = (p, w, d) => (p && p.weeks && p.weeks[w] ? p.weeks[w][d] : undefined);
const trains = (y) => !!(y && !y.rest && Array.isArray(y.sections));
const namesOn = (y) => new Set((trains(y) ? y.sections : []).flatMap((s) => ((s && s.items) || []).map((i) => String((i && i.name) || '').toLowerCase())));
const calOf = (p) => {
  const m = {};
  Object.keys((p && p.weeks) || {}).forEach((w) => ISO.forEach((d) => { const y = p.weeks[w] && p.weeks[w][d]; if (y !== undefined) m[calIndex(w, d)] = { w: +w, d, y }; }));
  return m;
};
const lastWeek = (p) => Math.max.apply(null, Object.keys(p.weeks).map(Number));
const noKey = (y, key) => JSON.stringify(y, (k, v) => (k === key ? undefined : v));
/** D167a (b): same day shell, same sections, same item counts; the items that differ are swaps. */
function swapOnly(ya, yb) {
  if (!trains(ya) || !trains(yb)) return { ok: false, why: 'not a training day' };
  if (noKey(ya, 'sections') !== noKey(yb, 'sections')) return { ok: false, why: 'day shell differs' };
  if (ya.sections.length !== yb.sections.length) return { ok: false, why: 'section count' };
  const sw = [];
  for (let si = 0; si < ya.sections.length; si++) {
    const a = ya.sections[si], b = yb.sections[si];
    if (noKey(a, 'items') !== noKey(b, 'items')) return { ok: false, why: 'section shell ' + si };
    const ia = (a && a.items) || [], ib = (b && b.items) || [];
    if (ia.length !== ib.length) return { ok: false, why: 'item count ' + si };
    for (let k = 0; k < ia.length; k++) {
      if (ia[k].name === ib[k].name) { if (JSON.stringify(ia[k]) !== JSON.stringify(ib[k])) return { ok: false, why: 'same name, other field differs' }; }
      else sw.push([ia[k].name, ib[k].name, a.label]);
    }
  }
  return sw.length ? { ok: true, sw } : { ok: false, why: 'no swap' };
}
// D167a (c): the hip-hinge family, typed by hand.
const HAND_PAT = { 'dumbbell romanian deadlift': 'hinge', 'kettlebell swing': 'hinge' };
// D212: the loaded delt-isolation family by tier, typed by hand from the ruling (dumbbells everywhere but bodyweight,
// cables only on commercial). Compared by lower-cased name; the build's own swap universe is never read.
const FAM_DB = ['Dumbbell lateral raise', 'Dumbbell front raise', 'Dumbbell rear delt fly'], FAM_CABLE = ['Cable lateral raise', 'Face pull'];
const FAM = { crossfit: FAM_DB, commercial: FAM_DB.concat(FAM_CABLE), home_full: FAM_DB, home_basic: FAM_DB, minimal: FAM_DB, bodyweight: [] };
const FAM_EXEMPT = /^(main|primer|power)/i;

/**
 * One pass over calendar-lattice cells. `inst` is instrumentedApp; `lw` (optional) is legacyWalkApp. Counts what every
 * dedupe claim reads: phantoms by lattice (D160), the view's hygiene (D160), rename placement (D167), the legacy walk
 * differential (D167, D167a), the hinge clamp before a leg-load day (D171) and delt repeats (D212).
 */
function surveyCalendar(cells, { inst, lw }) {
  const tierFn = inst.eval('_longRunTier');
  const tierOf = (y) => (y && !y.rest && y.cardio && !Array.isArray(y.cardio) ? tierFn(y.cardio) || null : null);
  const T = { cfg: 0, crash: [], cfgMutated: [], phantom: {}, phantomEx: [], limb: {}, limbEx: [],
    swept: { sunTrain: 0, sunRest: 0 }, d1: { renames: 0, unlocated: 0, firstDay: 0, notOnPrev: 0, ex: [] },
    z: { programs: 0, ex: [] }, h: { programs: 0, days: {}, unlicensed: [] },
    t: { eveHinge: 0, finalSat: 0, unclamped: [] },
    d212: { healthy: 0, repeats: 0, licensed: 0, violations: [], unknownTier: [] }, lwCrash: [] };
  const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
  for (const x of cells) {
    const tag = x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + (x.c.restDays.join(',') || '-') + ' seed ' + x.c.seed;
    const cfg = clone(x.c), snap = JSON.stringify(cfg);
    let b;
    try {
      b = buildLogged(inst, cfg);
    } catch (e) {
      T.crash.push(tag + ': ' + e.message);
      continue;
    }
    T.cfg++;
    if (JSON.stringify(cfg) !== snap) T.cfgMutated.push(tag);
    const { p, R } = b;
    // D160: a rename whose trigger the shipped calendar-previous day does not print is a phantom.
    const lat = PHANTOM_LATTICE[x.mix], limb = multiLimb(x.mix);
    if (lat || limb) {
      for (const r of R) {
        const pv = calPrev(r.w, r.d), P = dayOf(p, pv.w, pv.d);
        const phantom = !namesOn(P).has(String(r.was).toLowerCase());
        if (!phantom) continue;
        if (lat && tierOf(P)) { bump(T.phantom, lat); if (T.phantomEx.length < 3) T.phantomEx.push(tag + ' W' + r.w + ' ' + r.d + ' ' + r.was + ' -> ' + r.to); }
        if (limb) { bump(T.limb, limb); if (T.limbEx.length < 3) T.limbEx.push(tag + ' W' + r.w + ' ' + r.d + ' ' + r.was + ' -> ' + r.to); }
      }
      if (lat) bump(T.phantom, lat + ' configs', 1);
      if (limb) bump(T.limb, limb + ' configs', 1);
    }
    if (!x.swept) continue;
    if (x.sunRest) T.swept.sunRest++; else T.swept.sunTrain++;
    // D167: every rename lands on a day whose calendar-previous card carries the renamed name.
    const located = new Map();
    Object.keys(p.weeks).forEach((w) => ISO.forEach((d) => { const y = p.weeks[w] && p.weeks[w][d]; if (y && typeof y === 'object') located.set(y, calIndex(w, d)); }));
    const cal = calOf(p);
    for (const r of R) {
      T.d1.renames++;
      const ix = located.get(r.day);
      if (ix === undefined) { T.d1.unlocated++; continue; }
      if (ix === 0) { T.d1.firstDay++; continue; }
      const A0 = cal[ix - 1];
      if (!(A0 && namesOn(A0.y).has(String(r.was).toLowerCase()))) { T.d1.notOnPrev++; if (T.d1.ex.length < 3) T.d1.ex.push(tag + ' ix ' + ix + ' ' + r.was); }
    }
    // D171: a hinge item (frozen lens) on the eve of a leg-load day carries no RPE 8 grammar.
    const LWK = lastWeek(p);
    Object.keys(cal).map(Number).forEach((ix) => {
      const a = cal[ix], bb = cal[ix + 1];
      if (!a || !bb || !trains(a.y) || !(bb.y && bb.y.cardio && bb.y.cardio.legLoad)) return;
      const fin = a.w === LWK && a.d === 'sat';
      a.y.sections.forEach((sec) => ((sec && sec.items) || []).forEach((it) => {
        if (!it || !it.name || D.frozenPattern(it.name) !== 'hinge') return;
        T.t.eveHinge++;
        if (fin) T.t.finalSat++;
        const det = String(it.detail || '');
        if (det.includes('@ RPE 8') || det.includes('RPE 8 (stop 2 reps short of failure)')) T.t.unclamped.push(tag + ' W' + a.w + ' ' + a.d + ' ' + it.name + ' ' + det);
      }));
    });
    // D212: a delt-family member on B (outside Main/Primer/Power) that A also prints is licensed only when the family is used up.
    if (x.ik === 'healthy') {
      T.d212.healthy++;
      const fam = FAM[x.c.equipment];
      if (!fam) T.d212.unknownTier.push(tag);
      else {
        const famL = fam.map((s) => s.toLowerCase());
        Object.keys(cal).map(Number).forEach((ix) => {
          const a = cal[ix], bb = cal[ix + 1];
          if (!a || !bb || !trains(a.y) || !trains(bb.y)) return;
          const nA = namesOn(a.y), nB = namesOn(bb.y);
          bb.y.sections.forEach((sec) => {
            if (FAM_EXEMPT.test(String((sec && sec.label) || ''))) return;
            ((sec && sec.items) || []).forEach((it) => {
              const n = String((it && it.name) || '').toLowerCase();
              if (!n || !famL.includes(n) || !nA.has(n)) return;
              T.d212.repeats++;
              const miss = fam.filter((z) => { const l = z.toLowerCase(); return l !== n && !nA.has(l) && !nB.has(l); });
              if (!miss.length) T.d212.licensed++;
              else T.d212.violations.push(tag + ' W' + a.w + ' ' + a.d + ' > ' + bb.d + ' ' + it.name + ' [' + sec.label + '] missing ' + miss.join(', '));
            });
          });
        });
      }
    }
    // D167 / D167a: the app against itself with the legacy walk put back.
    if (!lw) continue;
    let xl;
    try {
      xl = lw.buildProgram(clone(x.c));
    } catch (e) {
      T.lwCrash.push(tag + ': ' + e.message);
      continue;
    }
    const cl2 = calOf(xl);
    const EV = new Set();
    new Set(Object.keys(cal).concat(Object.keys(cl2))).forEach((k) => { if (JSON.stringify(cal[k] && cal[k].y) !== JSON.stringify(cl2[k] && cl2[k].y)) EV.add(+k); });
    if (x.sunRest) {
      if (EV.size) { T.z.programs++; if (T.z.ex.length < 3) T.z.ex.push(tag); }
      continue;
    }
    if (EV.size) T.h.programs++;
    const mid = (ix) => { const d = ISO[ix % 7]; return d !== 'sun' && d !== 'mon'; };
    const depth = (ix) => (EV.has(ix - 1) && mid(ix - 1) ? 1 + depth(ix - 1) : 1);
    EV.forEach((ix) => {
      const d = ISO[ix % 7];
      bump(T.h.days, d);
      if (!mid(ix)) return;
      const sw = swapOnly(cl2[ix] && cl2[ix].y, cal[ix] && cal[ix].y);
      const pat = sw.ok && sw.sw.every(([p0, q0]) => HAND_PAT[String(p0).toLowerCase()] && HAND_PAT[String(p0).toLowerCase()] === HAND_PAT[String(q0).toLowerCase()]);
      if (!(EV.has(ix - 1) && sw.ok && pat && depth(ix) === 1))
        T.h.unlicensed.push(tag + ' W' + (Math.floor(ix / 7) + 1) + ' ' + d + ' prev moved ' + EV.has(ix - 1) + ' swap only ' + sw.ok + (sw.why ? ' (' + sw.why + ')' : '') + ' within pattern ' + !!pat + ' depth ' + depth(ix));
    });
  }
  T.view = { calls: inst.window.__DM_VC || 0, mutated: inst.window.__DM_VM || 0, returnedInput: inst.window.__DM_VS || 0 };
  return T;
}

module.exports = {
  OFF, ISO, calIndex, calPrev, calendarLattice, PHANTOM_LATTICE, multiLimb, instrumentedApp, legacyWalkApp, buildLogged,
  LEGACY_WALK, dayOf, trains, namesOn, calOf, FAM, surveyCalendar,
};
