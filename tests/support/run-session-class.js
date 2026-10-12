'use strict';
// Helpers for the run session class tests (tests/integration/run-session-class.test.js and
// tests/sweeps/run-session-class.test.js). D103a: every NSW run session carries a class key on its dose (int, chi,
// steady, long, easy, bench, trial); the chip and the run history print by it; the readers (the week shape, the
// interference cost, the injury sweeps) go key-first, so renaming a label moves nothing. NRC, bike and swim sessions
// carry no key and keep the label scan.
//
// The oracles are hand tables: the label each key goes with, the chip each key wears, the two injury sets, the strides
// text rule, the V176 interference arithmetic. The lattices are the three the gates swept; each returns {fam, cfg}.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadApp, fixtures } = require('./app.js');

const ALL = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const clone = v => JSON.parse(JSON.stringify(v));
/** Canonical JSON: keys sorted, so two programs compare by content. */
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}

const NSW = new Set(['run_base', 'run_pace_goal', 'run_mile_time', 'run_15_under10']);
const VOCAB = ['int', 'chi', 'steady', 'long', 'easy', 'bench', 'trial'];
const keyOf = c => (c && c.dose && c.dose.key) || null;
const nswRun = c => !!c && c.type === 'run' && !c.isNRC && NSW.has(c.goalId);

/** The key a label goes with (first match wins); the pace family's LSD is long or easy by legLoad. */
function keyFor(c) {
  const s = String(c.subtype || '');
  if (/TIME TRIAL/.test(s)) return 'trial';
  if (/^Short Interval \(SI\)/.test(s)) return 'int';
  if (/^Long Interval \(LI\)/.test(s)) return 'chi';
  if (/^Steady Aerobic Run/.test(s)) return 'steady';
  if (/^Benchmark Run/.test(s)) return 'bench';
  if (/^Easy Run — Long/.test(s)) return 'long';
  if (/^Easy Run/.test(s)) return 'easy';
  if (/^Long Slow Distance \(LSD\)/.test(s)) return c.legLoad ? 'long' : 'easy';
  return 'UNLISTED LABEL';
}
/** The chip a label wears (the code table the chip printed before the rename). */
function labelChip(s) {
  s = String(s || '').toLowerCase();
  if (s.includes('interval')) return 'INT'; if (s.includes('continuous high')) return 'CHI'; if (s.includes('steady aerobic')) return 'STDY';
  if (s.includes('easy run')) return 'EASY'; if (s.includes('benchmark')) return 'TEST'; if (s.includes('long slow') || /\blsd\b/.test(s)) return 'LSD'; return 'RUN';
}
/** The ruled chip of a keyed run: chi LI, int SI, the test TEST; every other key wears its label's code. */
const KEYCHIP = { chi: 'LI', int: 'SI', trial: 'TEST' };
const keyedChip = c => KEYCHIP[keyOf(c)] || labelChip(c.subtype);

/** Halfstep cuts these keys; the test and the benchmark are measurements and are never halved. */
const HALFSTEP_SET = new Set(['int', 'chi', 'long', 'steady']);
/** Easy and reduce mode park these keys: an injured athlete in easy mode runs no max-effort test either. */
const PARK_SET = new Set(['int', 'chi', 'long', 'steady', 'bench', 'trial']);
const INJ = { none: null, halfstep: { region: 'knee', tier: 'workaround', halfstep: true }, easy: { region: 'knee', tier: 'workaround' },
  reduce: { region: 'ankle', tier: 'workaround' } };
const withInj = (c, inj) => { const x = clone(c); if (INJ[inj]) x.injury = clone(INJ[inj]); else delete x.injury; return x; };
/** Slice 2b's text rule: in easy mode the strides finisher goes whole and " + Strides" leaves the subtype. */
const STRIDES_BLOCK = '\nFinish with 4 x 20 sec strides. Fast but relaxed, about 90% speed, walk back for full recovery. Strides keep your legs fast while the engine builds.';
const withoutStrides = c => { const x = clone(c); x.detail = String(x.detail || '').split(STRIDES_BLOCK).join(''); x.subtype = String(x.subtype || '').split(' + Strides').join(''); return x; };
/** The V176 interference rule by hand: 1.4 for an interval, 1.05 otherwise, plus miles past 3 at 0.08 or minutes past 45 at 0.01, bump capped at 0.5. */
function handInterference(c) {
  const s = ((c.subtype || '') + ' ' + (c.detail || '')).toLowerCase();
  const mi = parseFloat((s.match(/([\d.]+)\s*(?:mi\b|mile)/) || [])[1]) || 0, mn = parseFloat((s.match(/([\d.]+)[\s-]*min/) || [])[1]) || 0;
  const b = mi > 3 ? Math.min(0.5, (mi - 3) * 0.08) : mn > 45 ? Math.min(0.5, (mn - 45) * 0.01) : 0;
  return +(1.0 * (keyOf(c) === 'int' ? 1.4 : 1.05) + b).toFixed(2);
}

// ── the lattices (dated configs count from Monday 2026-10-05) ───────────────────────────────────────────────────────
const START = new Date(2026, 9, 5);
const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const lift = name => ({ liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', days: ALL,
  bench: 185, squat: 255, deadlift: 315, name, startDate: isoOff(0) });
const PACE = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };
const MILE = { id: 'run_mile_time', label: 'Mile', mileBestMins: '8', mileBestSecs: '15', targetDist: '1', targetMins: '7', targetSecs: '30', paceUnit: 'mi' };
/** A second sport's goal; `short` gives the chip lattice's labels (Bike, Swim) instead of Bike base, Swim base. */
const withMix = (cg, mix, short) => { if (mix === 'bike') cg.bike = { id: 'bike_base', label: short ? 'Bike' : 'Bike base' }; if (mix === 'swim') cg.swim = { id: 'swim_base', label: short ? 'Swim' : 'Swim base' }; return cg; };
const types = mix => (mix ? ['run', mix] : ['run']);
/** A pace or mile goal, dated to a test in week tw on weekday offset wd (tw 0: undated). */
function paceCfg(name, g, mix, rest, tw, wd, short) {
  const c = Object.assign({}, lift(name), { primaryPath: 'event', eventTargeted: true, cardioTypes: types(mix), cardioGoals: withMix({ run: clone(g) }, mix, short), restDays: rest, seed: 24865 });
  if (tw) { c.raceDate = isoOff(7 * (tw - 1) + wd); c._testWeek = tw; c._raceDateCappedWeeks = tw; }
  return c;
}
/** run_base on the frequency plan: event path, 18-35, a 2.5 mi baseline (the budgeted easy run past 40 min). */
const runBaseFreq = (name, mix, exp, rest, seed, dated, short) => {
  const c = Object.assign({}, lift(name), { primaryPath: 'event', eventTargeted: true, cardioTypes: types(mix), experience: exp, restDays: rest, seed,
    cardioGoals: withMix({ run: { id: 'run_base', label: 'Build Running Base', mileBestMins: '8', mileBestSecs: '15', baseline: '2.5 miles' } }, mix, short) });
  if (dated) c.raceDate = '2026-12-14';
  return c;
};
/** run_base on HALF_MANNY's lifts: 55+, a low baseline (the Steady Aerobic Run, Easy Run — Long, the Benchmark). */
const runBase55 = (pp, bd, mix, rest, evt) => Object.assign({}, clone(fixtures.HALF_MANNY), { name: 'RB', primaryPath: pp,
  cardioTypes: types(mix), cardioGoals: withMix({ run: { id: 'run_base', label: 'Build Running Base', baselineDist: bd, baseline: bd + 'mi' } }, mix),
  eventTargeted: evt, raceDate: evt ? '2027-06-01' : '', ageBracket: '55+', restDays: rest, seed: 76308 });

/** The key lattice: the pace family undated and dated, run_base both kinds, NRC dated; run only and multi-sport. */
function keyLattice() {
  const L = [];
  for (const g of [PACE, MILE]) for (const mix of ['', 'bike', 'swim']) for (const rest of [['sun'], ['sun', 'wed'], ['sat', 'sun'], []]) for (const tw of [0, 3, 5]) for (const wd of (tw ? [0, 3, 5] : [0]))
    L.push({ fam: 'pace ' + g.id + (mix ? '+' + mix : '') + (tw ? ' dated' : ''), cfg: paceCfg('K', g, mix, rest, tw, wd) });
  for (const mix of ['', 'bike']) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const rest of [[], ['sun'], ['sun', 'wed'], ['sat', 'sun'], ['sun', 'tue', 'thu', 'sat']]) for (const seed of [24865, 7]) for (const dated of [false, true])
    L.push({ fam: 'run_base freq plan' + (mix ? '+' + mix : ''), cfg: runBaseFreq('K', mix, exp, rest, seed, dated) });
  for (const pp of ['fitness', 'event']) for (const bd of ['0.1', '1']) for (const mix of ['', 'bike']) for (const rest of [['sun', 'wed'], [], ['sat', 'sun']]) for (const evt of [true, false])
    L.push({ fam: 'run_base 55+' + (mix ? '+' + mix : ''), cfg: runBase55(pp, bd, mix, rest, evt) });
  for (const g of ['run_5k', 'run_10k', 'run_half']) for (const mix of ['', 'bike', 'swim']) for (const rest of [['sun'], ['sun', 'wed']])
    L.push({ fam: 'NRC ' + g + (mix ? '+' + mix : ''), cfg: Object.assign({}, clone(fixtures.HALF_MANNY), { cardioTypes: types(mix),
      cardioGoals: withMix({ run: { id: g, label: g } }, mix), restDays: rest, seed: 76308, raceDate: { run_5k: '2026-11-19', run_10k: '2026-11-21', run_half: '2026-12-26' }[g] }) });
  return L;
}
/** The chip lattice: no injury, halfstep and easy, over the pace family, run_base both kinds and NRC (mixes too). */
function chipLattice() {
  const L = [];
  for (const inj of [null, INJ.halfstep, INJ.easy]) {
    const put = (fam, c) => { if (inj) c.injury = clone(inj); L.push({ fam, cfg: c }); };
    for (const g of [PACE, MILE]) for (const mix of ['', 'bike', 'swim']) for (const rest of [['sun'], ['sun', 'wed']]) for (const tw of [0, 1, 3])
      put('pace', paceCfg('C', g, mix, rest, tw, 3, true));
    for (const mix of ['', 'bike']) for (const rest of [[], ['sun', 'wed']]) for (const seed of [24865, 7])
      put('run_base freq', runBaseFreq('C', mix, 'intermediate', rest, seed, false, true));
    for (const pp of ['fitness', 'event']) for (const rest of [['sun', 'wed'], []]) put('run_base 55+', runBase55(pp, '0.1', '', rest, pp === 'event'));
    for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) for (const mix of ['', 'bike', 'swim'])
      put('NRC', Object.assign({}, clone(fixtures.HALF_MANNY), { cardioTypes: types(mix), cardioGoals: withMix({ run: { id: g, label: g } }, mix, true), restDays: ['sun'], seed: 76308 }));
  }
  return L;
}
/** The readers' lattice: the pace family (dated to week 1 or 3), run_base both kinds; each built under four injury modes. */
function readersLattice() {
  const L = [];
  for (const g of [PACE, MILE]) for (const mix of ['', 'bike']) for (const rest of [['sun'], ['sun', 'wed'], ['sat', 'sun']]) for (const tw of [0, 1, 3]) for (const wd of (tw ? [0, 3] : [0]))
    L.push({ fam: 'pace', dated: tw, cfg: paceCfg('R', g, mix, rest, tw, wd) });
  for (const mix of ['', 'bike']) for (const exp of ['beginner', 'advanced']) for (const rest of [[], ['sun', 'wed'], ['sat', 'sun']]) for (const seed of [24865, 7])
    L.push({ fam: 'run_base freq', dated: 0, cfg: runBaseFreq('R', mix, exp, rest, seed, false) });
  for (const pp of ['fitness', 'event']) for (const bd of ['0.1', '1']) for (const rest of [['sun', 'wed'], [], ['sat', 'sun']])
    L.push({ fam: 'run_base 55+', dated: 0, cfg: runBase55(pp, bd, '', rest, pp === 'event') });
  return L;
}

// ── reading programs ─────────────────────────────────────────────────────────────────────────────────────────────────
/** Every cardio card, Monday-first week order: {w, d, c}. `single` keeps only days with one card (not an array). */
function cardsOf(p, single) {
  const out = [];
  Object.keys(p.weeks).forEach(w => WEEK.forEach(d => {
    const x = p.weeks[w][d]; if (!x || !x.cardio) return;
    if (single) { if (!Array.isArray(x.cardio)) out.push({ w, d, c: x.cardio }); return; }
    for (const c of [].concat(x.cardio)) if (c) out.push({ w, d, c });
  }));
  return out;
}
/** The test's eve (race date less a day) as {w, d}, by date arithmetic from the Monday the lattice starts on. */
function eveOf(cfg) {
  if (!cfg.raceDate) return null;
  const [y, m, dd] = cfg.raceDate.split('-').map(Number), e = new Date(y, m - 1, dd - 1);
  return { w: Math.floor(Math.round((e - START) / 864e5) / 7) + 1, d: ALL[e.getDay()] };
}

/** The key audit (K0 to K3) over built programs. */
function keyAudit(built) {
  const S = { progs: 0, nsw: 0, unkeyed: [], agree: 0, disagree: [], other: 0, otherKeyed: [], seen: {}, budgetLong: 0,
    heads: { 'Long Interval (LI)': 0, 'Long Interval (LI) — Taper': 0, 'Short Interval (SI)': 0, 'Short Interval (SI) — Taper': 0 } };
  for (const { fam, prog } of built) {
    S.progs++;
    for (const { w, d, c } of cardsOf(prog)) {
      const k = c.dose ? c.dose.key : undefined, tag = fam + ' W' + w + ' ' + d + ' "' + c.subtype + '"';
      if (c.type === 'run' && !c.isNRC && NSW.has(c.goalId)) {
        S.nsw++;
        if (!k) S.unkeyed.push(tag); else S.seen[k] = (S.seen[k] || 0) + 1;
        if (k === keyFor(c)) S.agree++; else S.disagree.push(tag + ' key ' + k + ' want ' + keyFor(c));
        if (k === 'long' && /^Easy Run — Long/.test(c.subtype || '') && !c.legLoad) S.budgetLong++;
        if (Object.prototype.hasOwnProperty.call(S.heads, c.subtype)) S.heads[c.subtype]++;
      } else {
        S.other++;
        if (k !== undefined || c.key !== undefined) S.otherKeyed.push(tag + ' ' + c.type + ' key ' + (k || c.key));
      }
    }
  }
  return S;
}

/** A page the chip tests read from: runSessionCode, _runClass, dayCode and _doseStripHTML, by name. */
function chipReaders(IA) {
  const CODE = IA.eval('runSessionCode'), RC = IA.eval('_runClass'), DAYCODE = IA.eval('dayCode'), STRIP = IA.eval('_doseStripHTML');
  const day = c => DAYCODE({ title: '', tags: [], sections: [], cardio: c }).bot;
  const strip = c => { const h = STRIP('run', c.dose, c.subtype || ''); const m = /ps-lbl">[^<·]*? — ([A-Z]+) · Planned/.exec(h); return m ? m[1] : 'RUN'; };
  return { CODE, RC, day, strip };
}

/**
 * The app with one of the run builder's quality labels swapped by source surgery ("    subtype = '<from>' + (isTaperWeek ...").
 * Written to a temporary file, booted, removed. The labels are found structurally: exactly two, the LI then the SI.
 */
const LABEL_RX = /    subtype = '([^']+)' \+ \(isTaperWeek \? ' — Taper' : ''\);\n/g;
const qualityLabels = html => [...html.matchAll(LABEL_RX)].map(m => m[1]);
function swappedApp(html, from, to) {
  const anchor = "    subtype = '" + from + "' + (isTaperWeek ? ' — Taper' : '');\n";
  if (html.split(anchor).length !== 2) throw new Error('the label anchor for "' + from + '" is not unique');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-run-class-'));
  const file = path.join(dir, 'index.html');
  try {
    fs.writeFileSync(file, html.replace(anchor, anchor.replace("'" + from + "'", "'" + to + "'")));
    return loadApp({ file });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** The chip audit (B0 to B4) over built programs: every keyed NSW run's day chip and strip code, and relabelled copies. */
function chipAudit(R, built) {
  const cards = [];
  for (const { prog } of built) for (const { c } of cardsOf(prog, true)) cards.push(c);
  const nsw = cards.filter(c => c.type === 'run' && keyOf(c)), unkeyed = cards.filter(c => !keyOf(c));
  const A = { nsw: nsw.length, unkeyed: unkeyed.length, byKey: {}, day: [], strip: [], relabels: 0, relabel: [] };
  const RELABEL = { chi: ['Short Interval (SI)', 'Interval (INT)', 'Zqx Session (ZQX)'], int: ['Long Interval (LI)', 'Continuous High Intensity (CHI)', 'Zqy Session (ZQY)'] };
  for (const c of nsw) {
    const k = keyOf(c), a = R.day(c), b = R.strip(c), w = keyedChip(c);
    A.byKey[k + ' ' + a] = (A.byKey[k + ' ' + a] || 0) + 1;
    if (a !== w) A.day.push(k + ' "' + c.subtype + '" ' + a + ' want ' + w);
    if (b !== w) A.strip.push(k + ' "' + c.subtype + '" ' + b + ' want ' + w);
    if (k !== 'int' && k !== 'chi') continue;
    for (const lab of RELABEL[k]) {
      A.relabels++;
      const r = clone(c); r.subtype = lab;
      if (R.day(r) !== KEYCHIP[k] || R.strip(r) !== KEYCHIP[k]) A.relabel.push(k + ' as "' + lab + '" day ' + R.day(r) + ' strip ' + R.strip(r));
    }
  }
  return A;
}

/** Builds a readers' lattice entry under an injury mode, once (clock fields dropped). */
function builder(IA, lattice) {
  const cache = new Map();
  return (i, inj) => {
    const k = i + '|' + inj;
    if (!cache.has(k)) { const p = clone(IA.buildProgram(withInj(lattice[i].cfg, inj))); delete p.created; delete p.id; cache.set(k, p); }
    return cache.get(k);
  };
}

/** The halfstep, easy and reduce audits (H, E) and the interference audit (I) over a readers' lattice. */
function readersAudit(IA, lattice) {
  const get = builder(IA, lattice), CI = IA.eval('_cardioInterference');
  const touched = c => /RE-ENTRY WEEK/.test(c.note || '');
  const H = { byKey: {}, hit: {}, bad: [] };
  const E = { parked: {}, total: {}, bad: [], kept: [], protectKey: [], trialsLeft: [], dated: 0, stridesDealt: 0, stridesLeft: [], plusLeft: [], dose: [],
    eveOut: 0, eves: 0, eveBad: [], plainStrides: 0, plainBad: [] };
  const I = { n: 0, bad: [], relabel: [] };
  const isLift = s => !!s && (s.items || []).length && !/mobility|stretch|taper/i.test(s.label || '');
  const sig = x => canon({ rest: !x || !!x.rest, lift: !!(x && !x.rest && (x.sections || []).some(isLift)),
    cards: [].concat((x && x.cardio) || []).filter(Boolean).map(c => c.type + ':' + (c.subtype || '')).sort() });
  lattice.forEach((b, i) => {
    for (const { w, d, c } of cardsOf(get(i, 'halfstep'), true)) {
      if (!nswRun(c)) continue;
      const k = keyOf(c) || 'NONE';
      H.byKey[k] = (H.byKey[k] || 0) + 1; if (touched(c)) H.hit[k] = (H.hit[k] || 0) + 1;
      if (touched(c) !== HALFSTEP_SET.has(k)) H.bad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k);
    }
    const pre = get(i, 'none'), p = get(i, 'easy'), eve = b.dated ? eveOf(b.cfg) : null;
    if (b.dated) E.dated++;
    for (const { w, d, c } of cardsOf(p, true)) if (/TIME TRIAL/.test(c.subtype || '')) E.trialsLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d);
    for (const { w, d, c } of cardsOf(pre, true)) {
      if (!nswRun(c)) continue;
      const k = keyOf(c) || 'NONE', after = p.weeks[w] && p.weeks[w][d] && p.weeks[w][d].cardio;
      E.total[k] = (E.total[k] || 0) + 1;
      const isP = !!after && /^Easy Run \(protected\)/.test(after.subtype || '');
      if (isP) E.parked[k] = (E.parked[k] || 0) + 1;
      if (PARK_SET.has(k) !== isP) E.bad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k + (isP ? ' parked' : ' not parked'));
      const onEve = !!eve && +w === eve.w && d === eve.d;
      if (!PARK_SET.has(k) && onEve) E.eveOut++;
      else if (!PARK_SET.has(k) && canon(after) !== canon(withoutStrides(c))) E.kept.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k);
      if (!PARK_SET.has(k) && String(c.detail || '').includes(STRIDES_BLOCK)) {
        E.stridesDealt++;
        const m0 = /(\d+) min/.exec(c.detail || ''), m1 = after && /(\d+) min/.exec(after.detail || '');
        if (!after || canon(after.dose) !== canon(c.dose) || !m0 || !m1 || m0[1] !== m1[1]) E.dose.push(b.fam + ' #' + i + ' W' + w + ' ' + d);
      }
    }
    for (const { w, d, c } of cardsOf(p, true)) {
      if (c.type !== 'run') continue;
      if (/strides/i.test((c.subtype || '') + ' ' + (c.detail || ''))) E.stridesLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d);
      if (/ \+ Strides$/.test(c.subtype || '')) E.plusLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d);
    }
    for (const m of ['easy', 'reduce']) for (const { w, d, c } of cardsOf(get(i, m), true))
      if (/^Easy Run \(protected\)/.test(c.subtype || '') && c.dose && c.dose.key !== undefined && c.dose.key !== 'easy') E.protectKey.push(m + ' ' + b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + c.dose.key);
    // the training-day test eve in easy mode: a rest day, no card and no lift (the rule easy mode kept when D158 gave the
    // uninjured eve its shakeout)
    if (eve && eve.w >= 1 && !(b.cfg.restDays || []).includes(eve.d)) {
      E.eves++;
      const s = sig(p.weeks[eve.w] && p.weeks[eve.w][eve.d]);
      if (s !== canon({ rest: true, lift: false, cards: [] })) E.eveBad.push(b.fam + ' #' + i + ' W' + eve.w + ' ' + eve.d + ' ' + s);
    }
    for (const { w, d, c } of cardsOf(pre, true)) {
      if (/ \+ Strides$/.test(c.subtype || '')) { E.plainStrides++; if (!String(c.detail || '').endsWith(STRIDES_BLOCK)) E.plainBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d); }
      if (!nswRun(c)) continue;
      const k = keyOf(c);
      if (k !== 'int' && k !== 'chi') continue;
      I.n++;
      const v = CI(c), want = handInterference(c);
      if (v !== want) I.bad.push(k + ' ' + v + ' want ' + want);
      const r = clone(c); r.subtype = k === 'chi' ? 'Long Interval (LI)' : 'Recovery Zqy';
      if (CI(r) !== want) I.relabel.push(k + ' as "' + r.subtype + '" ' + CI(r) + ' want ' + want);
    }
  });
  return { H, E, I, get };
}

/**
 * The rename audit (R): each quality label swapped to a label the scan reads (the other era's name) and to one no scan
 * knows; every pace program of the lattice under no injury, halfstep and easy, label-normalised back, must equal the
 * unswapped build. Returns, per swap, the number of programs that moved.
 */
function renameAudit(IA, html, lattice, get, prepare) {
  const [chiL, intL] = qualityLabels(html);
  const other = (cur, want, alt) => (cur === want ? alt : want);
  const SW = [['LI', chiL, other(chiL, 'Long Interval (LI)', 'Continuous High Intensity (CHI)')], ['LI', chiL, 'Zqx Session (ZQX)'],
    ['SI', intL, other(intL, 'Short Interval (SI)', 'Interval (INT)')], ['SI', intL, 'Zqy Session (ZQY)']];
  const cells = [];
  lattice.forEach((b, i) => { if (b.fam === 'pace') for (const inj of ['none', 'halfstep', 'easy']) cells.push([i, inj]); });
  return { labels: [chiL, intL], cells: cells.length, swaps: SW.map(([slot, from, to]) => {
    const V = swappedApp(html, from, to); if (prepare) prepare(V);
    const moved = [];
    for (const [i, inj] of cells) {
      const q = JSON.parse(JSON.stringify(V.buildProgram(withInj(lattice[i].cfg, inj))).split(to).join(from)); delete q.created; delete q.id;
      if (canon(get(i, inj)) !== canon(q)) moved.push(inj + ' #' + i);
    }
    return { slot, from, to, moved };
  }) };
}

module.exports = {
  ALL, WEEK, clone, canon, NSW, VOCAB, keyOf, nswRun, keyFor, labelChip, KEYCHIP, keyedChip,
  HALFSTEP_SET, PARK_SET, INJ, withInj, STRIDES_BLOCK, withoutStrides, handInterference,
  START, isoOff, PACE, MILE, paceCfg, runBaseFreq, runBase55, keyLattice, chipLattice, readersLattice,
  cardsOf, eveOf, keyAudit, chipReaders, chipAudit, builder, readersAudit, qualityLabels, swappedApp, renameAudit,
};
