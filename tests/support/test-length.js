'use strict';
// Helpers for the test length tests (tests/integration/test-length.test.js, tests/sweeps/test-length.test.js): how long
// a dated test goal's program is and where it starts. Built on tests/support/app.js and tests/support/test-week.js.
//
//   wizardVM(todayIso)   the app booted with a document whose elements keep what is written to them (one stub per id,
//                        with a working classList), the toast silenced, and the clock pinned to a local time;
//                        V.today(iso, h, m) moves the clock.
//   gen, copy, nameStep, callout, redate
//                        doGenerate, the cardio goal step (its header, the race date card), the name step (its length
//                        and the start sentence), and setProgStart with every toast captured.
//   the length lattice   8 test goals x 3 experience levels x mile entered or not x a Thursday test in weeks 1 to 30
//                        from Mon 2026-09-21: weeks 1 to 26 pin (Table 6 is a 26-week block), 27 to 30 build the goal
//                        length and print the interim sentence.
//   the snap lattice     today Mon 2026-09-21 .. Sun 2026-09-27; an entered start today-7 .. today+27; seven rest
//                        patterns; a test date today .. today+34; two test goals: 120,050 points. isC is the oracle,
//                        date arithmetic only: the entered day is not a Monday, every weekday from it through its Sunday
//                        is a rest day, and the test falls from the entered day through that Sunday. On those points the
//                        start is kept (no snap) and week 1 is the test week (D184 (c')).
const { loadApp, pinClock } = require('./app.js');
const T = require('./test-week.js');

const J = v => JSON.stringify(v);
/** The visible text of some markup: svg out, tags to spaces, whitespace folded. */
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** A document whose getElementById keeps one element per id, each with a working classList. */
function registryDom(IA, opts = {}) {
  const doc = IA.window.document, els = new Map(), mk = doc.createElement;
  doc.getElementById = id => {
    if (opts.absent && opts.absent.includes(id)) return null;
    if (!els.has(id)) {
      const e = mk('div'), cls = new Set();
      e.id = id;
      e.classList = { add: c => cls.add(c), remove: c => cls.delete(c), toggle: (c, f) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)), contains: c => cls.has(c) };
      els.set(id, e);
    }
    return els.get(id);
  };
  return els;
}

function wizardVM(todayIso = '2026-09-22', h = 21, m = 16, opts = {}) {
  const IA = loadApp(opts.file ? { file: opts.file } : {});
  const els = registryDom(IA, opts);
  IA.eval('showToast = function(){}');
  const V = { IA, els, today: (iso, hh = h, mm = m) => pinClock(IA, T.localAt(iso, hh, mm)) };
  V.today(todayIso);
  return V;
}
function setWD(V, o) { V.IA.window.__O = o; V.IA.eval('WD = JSON.parse(JSON.stringify(__O))'); V.els.clear(); }
/** doGenerate on an empty store: the program it made active, the generate screen's line, the stored cfg. */
function gen(V) {
  const IA = V.IA;
  IA.localStorage._map.clear(); IA.eval('activeProg = null');
  try { IA.eval('doGenerate()'); } catch (e) { return { err: 'doGenerate threw ' + e.message }; }
  const sub = (V.els.get('generateSub') || {}).textContent;
  IA.flushTimers(Infinity);
  const p = IA.eval('activeProg');
  if (!p) return { err: 'no program' };
  return { p, sub, cfg: p.cfg || {} };
}
/** The cardio goal step's header length and race date card text, and the name step's length. */
function copy(V) {
  const IA = V.IA;
  try {
    IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
    const body = V.els.get('wizardBody').innerHTML, fb = txt((V.els.get('raceDateFeedback') || { innerHTML: '' }).innerHTML);
    const h = String(body).replace(/<[^>]+>/g, '').match(/Program length: (\d+) weeks?/);
    IA.eval('wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep()');
    const n = txt(V.els.get('wizardBody').innerHTML).match(/Program length\s*(\d+)\s*weeks?/i);
    return { hdr: h ? +h[1] : null, name: n ? +n[1] : null, fb };
  } catch (e) { return { err: 'wizard render threw ' + e.message }; }
}
/** The raw markup inside the name step's start sentence, or null. */
function nameStep(V) {
  V.IA.eval('wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep()');
  const m = String(V.els.get('wizardBody').innerHTML).match(/id="startResolve"[^>]*>([\s\S]*?)<\/div>/);
  return m ? m[1] : null;
}
/** The raw markup of the cardio goal step's race date card. */
function callout(V) {
  V.IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
  return String((V.els.get('raceDateFeedback') || { innerHTML: '' }).innerHTML);
}
/** Build `o` (clock already set), then setProgStart(entered), every toast captured. */
function redate(V, o, entered) {
  setWD(V, o);
  const g = gen(V);
  if (g.err) return { err: g.err };
  V.IA.window.__T = [];
  V.IA.eval('showToast = function(m){ __T.push(String(m)); }');
  try { V.IA.eval('setProgStart(' + J(entered) + ')'); V.IA.flushTimers(Infinity); } catch (e) { return { err: 'setProgStart threw ' + e.message }; } finally { V.IA.eval('showToast = function(){}'); }
  const p = V.IA.eval('activeProg') || {}, c = p.cfg || {};
  return { start: p.startDate, tw: c._testWeek, cap: c._raceDateCappedWeeks, toasts: JSON.parse(V.IA.eval('JSON.stringify(__T)')) };
}
/** Every run time trial, as "W<n> <day> <subtype>". */
function trialCards(p) {
  const t = [];
  for (let w = 1; w <= (p.totalWeeks || 0); w++) {
    for (const d of T.ISO7) for (const c of T.cards(p.weeks && p.weeks[w] && p.weeks[w][d])) if (T.isTrial(c)) t.push('W' + w + ' ' + d + ' ' + c.subtype);
  }
  return t;
}

// ── the length lattice (D184 (a), (b)) ──────────────────────────────────────────────────────────────────────────
const W1MON = '2026-09-21';
const TABLE6_LAST = 26;   // typed: Table 6 is a 26-week block
const thuOfWeek = k => T.addDays(W1MON, (k - 1) * 7 + 3);
/** The interim sentence past Table 6, typed with its three numbers as slots: the raw test week, 26, the goal length. */
const interim = (week, len) => 'Your test is in week ' + week + '. The test block is ' + TABLE6_LAST + ' weeks. This program builds '
  + len + (len === 1 ? ' week' : ' weeks') + ' now. Start a test block when the test is ' + TABLE6_LAST + ' weeks out.';
const fmtMin = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const paceGoal = (dist, secs) => ({ id: 'run_pace_goal', label: 'x', targetDist: dist, paceUnit: 'mi', targetMins: String(Math.floor(secs / 60)), targetSecs: String(secs % 60), targetTime: fmtMin(secs) });
const LENGTH_GOALS = [570, 660, 750, 855].map(t => ['1.5mi ' + fmtMin(t), paceGoal('1.5', t)])
  .concat([360, 420, 480, 570].map(t => ['1mi ' + fmtMin(t), paceGoal('1', t)]));
const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];
/** The groups of the length lattice: goal x experience x mile (8:00 entered, or none). */
const LENGTH_GROUPS = T.product(LENGTH_GOALS, EXPERIENCE, [null, 480]).map(([[gl, run], exp, mile]) => ({ gl, run, exp, mile }));
function lengthBase(g) {
  return { primaryPath: 'event', cardioTypes: ['run'], experience: g.exp, ageBracket: '18-35', eventTargeted: true, liftingFocus: 'support_prevention',
    equipment: 'crossfit', restDays: ['sun', 'wed'], unit: 'lbs', seed: 4242, name: 'M',
    cardioGoals: { run: Object.assign({}, g.run, g.mile ? { mileBestMins: '8', mileBestSecs: '00' } : {}) } };
}
/**
 * One group of the length lattice at the given test weeks. Weeks 1 to 26: the cardio goal header, the name step, the
 * generate screen and the built length all equal the hand week. Weeks 27 to 30: the card prints the interim sentence,
 * every surface prints the goal length (the same inputs undated), and no trial is built. A non-beginner with no mile
 * has no anchor: doGenerate refuses (D187 R3), dated or not, and the wizard still renders.
 */
function lengthGroup(V, g, weeks) {
  const R = { inN: 0, outN: 0, refuseIn: 0, refuseOut: 0, bad: [] };
  const base = lengthBase(g), tag0 = g.gl + ' ' + g.exp + ' mile ' + (g.mile ? '8:00' : 'none');
  setWD(V, Object.assign({}, base, { raceDate: '' }));
  const u = gen(V), L = u.err ? null : u.p.totalWeeks;
  const refuses = g.exp !== 'beginner' && !g.mile;
  for (const k of weeks) {
    const o = Object.assign({}, base, { raceDate: thuOfWeek(k) }), tag = tag0 + ' week ' + k, inside = k <= TABLE6_LAST;
    setWD(V, o); const c = copy(V); setWD(V, o); const r = gen(V);
    if (inside) R.inN++; else R.outN++;
    if (refuses) {
      if (inside) R.refuseIn++; else R.refuseOut++;
      if (!(r.err === 'no program' && !c.err && u.err === 'no program')) R.bad.push(tag + ': want the refusal, got ' + J({ gen: r.err, copy: c.err, undated: u.err }));
      continue;
    }
    if (c.err || r.err || (!inside && L === null)) { R.bad.push(tag + ' ' + (c.err || r.err || 'undated ' + u.err)); continue; }
    const hw = T.handWeek(r.p.startDate, o.raceDate), subN = +((String(r.sub).match(/Building your (\d+)-week program/) || [])[1]);
    const got = [c.hdr, c.name, subN, r.p.totalWeeks];
    if (inside) {
      if (!(hw === k && got.every(x => x === k))) R.bad.push(tag + ': header/name/generate/built ' + J(got) + ', hand week ' + hw + ' (start ' + r.p.startDate + ')');
    } else {
      const want = interim(hw, L), tr = trialCards(r.p);
      if (!(hw === k && c.fb === want && got.every(x => x === L) && tr.length === 0)) R.bad.push(tag + ': card ' + J(c.fb) + ' want ' + J(want) + '; header/name/generate/built ' + J(got) + ', goal length ' + L + ', trials ' + tr.length);
    }
  }
  return R;
}

// ── the snap lattice (D184 (c')) ─────────────────────────────────────────────────────────────────────────────────
const RESTS = { none: [], sun: ['sun'], 'sun,wed': ['sun', 'wed'], 'sat,sun': ['sat', 'sun'], 'fri,sat,sun': ['fri', 'sat', 'sun'], 'mon,wed,fri': ['mon', 'wed', 'fri'], 'thu..sun': ['thu', 'fri', 'sat', 'sun'] };
const G15 = '1.5mi 12:00 mile 8:00';
const SNAP_GOALS = {
  [G15]: { id: 'run_pace_goal', label: 'x', targetDist: '1.5', paceUnit: 'mi', mileBestMins: '8', mileBestSecs: '00', targetMins: '12', targetSecs: '0', targetTime: '12:00' },
  '1mi 6:00 no mile': { id: 'run_pace_goal', label: 'x', targetDist: '1', paceUnit: 'mi', targetMins: '6', targetSecs: '0', targetTime: '6:00' },
};
const segOf = eo => (eo < 0 ? '<' : eo === 0 ? '==' : '>');
function isC(start, rest, race) {
  const off = T.offOf(start), sun = T.civI(start) + 6 - off;
  return off > 0 && T.ISO7.slice(off).every(d => rest.includes(d)) && T.civI(race) >= T.civI(start) && T.civI(race) <= sun;
}
const SNAP_LATTICE = [];
for (const gl of Object.keys(SNAP_GOALS)) {
  for (let wd = 0; wd < 7; wd++) {
    const today = T.addDays(W1MON, wd);
    for (let eo = -7; eo <= 27; eo++) {
      for (const rk of Object.keys(RESTS)) {
        for (let du = 0; du <= 34; du++) {
          const start = T.addDays(today, eo), race = T.addDays(today, du);
          SNAP_LATTICE.push({ gl, today, eo, start, rk, race, c: isC(start, RESTS[rk], race) });
        }
      }
    }
  }
}
const C_POINTS = SNAP_LATTICE.filter(x => x.c);
/** The (c) cells of the 1.5 mi goal: the ones the builds, the name step and the card run on. */
const C_CELLS = C_POINTS.filter(x => x.gl === G15);
const tagC = x => 'today ' + x.today + ' entered ' + x.start + ' rest ' + x.rk + ' test ' + x.race;
const snapCfg = (x, exp) => ({ primaryPath: 'event', cardioTypes: ['run'], experience: exp, ageBracket: '18-35', eventTargeted: true, raceDate: x.race,
  liftingFocus: 'support_prevention', equipment: 'crossfit', restDays: RESTS[x.rk], unit: 'lbs', seed: 4242, name: 'M', startDate: x.start, cardioGoals: { run: SNAP_GOALS[x.gl] } });

/** resolveStartDate on every point, with the test date and without: (c) points keep the entered day with holdsTest; no other point moves. */
function resolverPoints(V, points) {
  const R = { cOk: 0, cN: 0, moved: 0, bad: [] };
  const byToday = new Map();
  for (const x of points) { if (!byToday.has(x.today)) byToday.set(x.today, []); byToday.get(x.today).push(x); }
  for (const [today, chunk] of byToday) {
    V.today(today);
    V.IA.window.__L = J(chunk.map(x => [x.start, x.rk, x.race])); V.IA.window.__R = J(RESTS);
    const out = V.IA.eval('(function(){ var L = JSON.parse(__L), R = JSON.parse(__R); return L.map(function(x){ return [JSON.stringify(resolveStartDate(x[0], R[x[1]], x[2])), JSON.stringify(resolveStartDate(x[0], R[x[1]]))]; }); })()');
    chunk.forEach((x, i) => {
      const r3 = JSON.parse(out[i][0]), r2 = JSON.parse(out[i][1]), why = [];
      if (x.c) { R.cN++; if (r3.start === x.start && r3.holdsTest === true) R.cOk++; else why.push('(c) point returns ' + out[i][0]); }
      else {
        if ('holdsTest' in r3) why.push('holdsTest on a point that does not hold the test: ' + out[i][0]);
        if (r3.start !== r2.start) { R.moved++; why.push('moved by the test date ' + r2.start + ' -> ' + r3.start); }
      }
      if (why.length) R.bad.push(x.gl + ' ' + tagC(x) + ': ' + why.join('; '));
    });
  }
  return R;
}
/** doGenerate on (c) cells: start == entered, test week 1, one week, the one trial on the test weekday, no training before or after it. */
function snapBuilds(V, cells, exps) {
  const R = { n: 0, seg: {}, bad: [] };
  for (const x of cells) {
    for (const exp of exps) {
      R.n++; R.seg[segOf(x.eo)] = (R.seg[segOf(x.eo)] || 0) + 1;
      V.today(x.today); setWD(V, snapCfg(x, exp));
      const g = gen(V), tag = tagC(x) + ' ' + exp;
      if (g.err) { R.bad.push(tag + ' ' + g.err); continue; }
      const why = [], td = T.ISO7[T.offOf(x.race)];
      if (T.handWeek(x.start, x.race) !== 1) why.push('hand week ' + T.handWeek(x.start, x.race));
      if (g.p.startDate !== x.start) why.push('start ' + g.p.startDate);
      if (g.cfg._testWeek !== 1) why.push('_testWeek ' + g.cfg._testWeek);
      if (g.p.totalWeeks !== 1) why.push('totalWeeks ' + g.p.totalWeeks);
      const tr = trialCards(g.p);
      if (J(tr) !== J(['W1 ' + td + ' 1.5 Mile Test — TIME TRIAL'])) why.push('trials ' + J(tr));
      const w1 = (g.p.weeks && g.p.weeks[1]) || {};
      const trains = d => { const q = w1[d]; return !!q && !q.rest && (T.cards(q).length > 0 || (q.sections || []).length > 0); };
      const before = T.ISO7.slice(T.offOf(x.start), T.offOf(x.race)).filter(trains), after = T.ISO7.slice(T.offOf(x.race) + 1).filter(trains);
      if (before.length) why.push('training days from the start to the test ' + before.join(','));
      if (after.length) why.push('training days after the test ' + after.join(','));
      if (why.length) R.bad.push(tag + ': ' + why.join('; '));
    }
  }
  return R;
}
/** "Thu, Sep 24" built by Intl in UTC from the ISO date (never the app's _fmtStartDay). */
const FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayU = iso => { const [y, m, d] = T.ymd(iso); return FMT.format(Date.UTC(y, m - 1, d)); };
/** The name step's start sentence on (c) cells: the Q2 string with the entered day, no "today", "this week" or em dash. */
function snapNameStep(V, cells) {
  const R = { seg: { '==': 0, '>': 0, '<': 0 }, bad: [] };
  for (const x of cells) {
    R.seg[segOf(x.eo)]++;
    V.today(x.today); setWD(V, snapCfg(x, 'intermediate'));
    const raw = nameStep(V), t = txt(raw), why = [];
    const want = 'That week holds your test, so this starts <b>' + dayU(x.start) + '</b>. Nothing is left to train before it. Week 1 is the test week.';
    if (raw === null) why.push('no startResolve element');
    else {
      if (raw !== want) why.push(J(raw) + ' want ' + J(want));
      if (!t) why.push('empty');
      if (/today/i.test(t) || /this week/i.test(t) || t.includes('—')) why.push('forbidden token in ' + J(t));
    }
    if (why.length) R.bad.push(tagC(x) + ': ' + why.join('; '));
  }
  return R;
}
const Q3 = 'Your test is in week 1. Nothing is left to train before it. You get the test week only.';
/** The race date card on (c) cells: var(--signal), no svg, opens with the Q3 sentence, no "Primer" or "shakeout". */
function snapCallout(V, cells) {
  const R = { seg: { '==': 0, '>': 0, '<': 0 }, bad: [] };
  for (const x of cells) {
    R.seg[segOf(x.eo)]++;
    V.today(x.today); setWD(V, snapCfg(x, 'intermediate'));
    const raw = callout(V), t = txt(raw), why = [];
    if (!raw.startsWith('<div style="color:var(--signal);')) why.push('card ' + J(raw.slice(0, 44)) + ' is not var(--signal)');
    if (/<svg/i.test(raw)) why.push('an <svg> in the card');
    if (!t.startsWith(Q3)) why.push(J(t.slice(0, 140)) + ' does not open with the sentence');
    if (/primer/i.test(t) || /shakeout/i.test(t)) why.push('"Primer" or "shakeout" in ' + J(t.slice(0, 140)));
    if (why.length) R.bad.push(tagC(x) + ': ' + why.join('; '));
  }
  return R;
}

module.exports = {
  J, txt, registryDom, wizardVM, setWD, gen, copy, nameStep, callout, redate, trialCards,
  W1MON, TABLE6_LAST, thuOfWeek, interim, LENGTH_GOALS, EXPERIENCE, LENGTH_GROUPS, lengthBase, lengthGroup,
  RESTS, G15, SNAP_GOALS, segOf, isC, SNAP_LATTICE, C_POINTS, C_CELLS, tagC, snapCfg, resolverPoints, snapBuilds, dayU, snapNameStep, Q3, snapCallout,
};
