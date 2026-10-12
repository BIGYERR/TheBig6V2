'use strict';
// Helpers for the swim tests (tests/integration/swim.test.js and tests/sweeps/swim.test.js): the swim time goal's clock
// (D110a, D144), the program sizer that reads the same clock (D157), the goal sheet and the wizard's pace line.
//
// The hand oracles, typed here and never read from the app:
//   E      the anchor: the entered 500 over 5 (the 500 goal's current time, the 100 goal's base500); left blank, the
//          experience default 2:30 / 2:00 / 1:35 per 100. A time is entered when minutes*60 + seconds, a missing limb
//          as 0, is above 0.
//   T      the target: the 500 goal's time over 5; the 100 goal moves E by the gap (current 100 less goal 100), floored
//          at E (a gap at or past E holds at E).
//   rate   4 / 3 / 2 s per 100 per week (beginner / intermediate / advanced) x age scale 1.0 / 0.85 / 0.65.
//   model  week w's split is E - r(w - 1), r = min((E - T) / weeks, rate); a goal not faster than E holds at E.
//   rep    guide A p12: the repeat split is the week's split less 2 s (500 in 10:30 is 2:06, the rep 2:04).
//   clock  m:ss, rounding the whole value first.
const { loadApp, fixtures } = require('./app.js');

const clone = v => JSON.parse(JSON.stringify(v));
const E_DEFAULT = { beginner: 150, intermediate: 120, advanced: 95 };
const RATE = { beginner: 4, intermediate: 3, advanced: 2 };
const AGE_SCALE = { '18-35': 1.0, '36-54': 0.85, '55+': 0.65 };
const DIST = { swim_500_time: 500, swim_100_time: 100 };
const handClock = sec => { const t = Math.round(sec), r = t % 60; return ((t - r) / 60) + ':' + (r < 10 ? '0' + r : String(r)); };
const secs = s => { const m = /^(\d+):(\d\d)$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
/** The ruled total: a missing limb is 0. */
const tot = (m, s) => (+m || 0) * 60 + (+s || 0);
// D144: the 100 goal names the split "this week's 500 pace"; the 500 goal keeps "goal split".
const DET_REP = /(\d+) x 100\S* at (\d+:\d+)\/100/, DET_SPLIT = /(?:goal split|500 pace) of (\d+:\d+)\/100/;
const SEG_REP = /\d+ x 100\S* at (\d+:\d+)\/100/, SEG_SPLIT = /(?:goal split|500 pace) of (\d+:\d+)\/100/;
/** The copy rule (D109's predicate): no em-dash, en-dash or letter-hyphen-letter. */
const DASH = t => /—|–/.test(t) || /[A-Za-z]-[A-Za-z]/.test(t);
const GOAL_MET_NOTE = 'INT: Your goal split is already within your current split. This block holds your split and builds your reps.';
const CAP8_TIME = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8.';
const CAP8_DIST = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8.';
const DIST_NOTE = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8. If pace drops significantly, end the session. Consistency between reps matters.';
const anchorLineOf = (unit, exp) => 'No current 500' + unit + ' time was entered. This split starts from the ' + exp
  + ' default of ' + handClock(E_DEFAULT[exp]) + '/100, not from your own time. ';

/** A swim time goal on HALF_MANNY's lifts, no event: {goal, exp, age, seed, unit, tgt, base, b500, raw} in seconds. */
function swimCfg(o) {
  const c = clone(fixtures.HALF_MANNY);
  c.cardioTypes = ['swim']; c.experience = o.exp; c.ageBracket = o.age; c.seed = o.seed;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  const g = { id: o.goal, label: o.goal, swimUnit: o.unit };
  if (o.tgt != null) { g.targetMins = String(Math.floor(o.tgt / 60)); g.targetSecs = String(o.tgt % 60); }
  if (o.base != null) { g.baseMins = String(Math.floor(o.base / 60)); g.baseSecs = String(o.base % 60); }
  if (o.b500 != null) { g.base500Mins = String(Math.floor(o.b500 / 60)); g.base500Secs = String(o.b500 % 60); }
  if (o.raw) Object.assign(g, o.raw);
  c.cardioGoals = { swim: g };
  return c;
}
/** A 100 goal on swimCfg's athlete with the goal fields given as typed. */
const goal100 = (fields, exp) => { const c = swimCfg({ goal: 'swim_100_time', exp: exp || 'intermediate', age: '18-35', unit: 'yd', seed: 76308 });
  c.cardioGoals.swim = Object.assign({ id: 'swim_100_time', label: 'x', swimUnit: 'yd' }, fields); return c; };
const cardsOfDay = d => (!d || !d.cardio ? [] : [].concat(d.cardio).filter(Boolean));
const isInt = c => !!(c && c.type === 'swim' && /Interval/.test(String(c.subtype || '')));
/** The swim INT cards of a program, week order. */
function intCards(prog) {
  const out = [];
  for (const wk of Object.keys(prog.weeks || {})) for (const d of Object.keys(prog.weeks[wk] || {}))
    for (const c of cardsOfDay(prog.weeks[wk][d])) if (isInt(c)) out.push({ w: +wk, d, c });
  return out.sort((a, b) => a.w - b.w);
}
/** Each INT card's printed split, rep split and note. */
const splitsOf = prog => intCards(prog).map(x => ({ w: x.w, s: (String(x.c.detail || '').match(DET_SPLIT) || [])[1],
  r: (String(x.c.detail || '').match(DET_REP) || [])[2], n: String(x.c.note || ''), c: x.c }));

// ── the swim time lattice ────────────────────────────────────────────────────────────────────────────────────────────
// 2 goals x 3 experiences x 3 ages x 5 current times (blank first) x 5 targets, units and seeds rotated; the 100 goal's
// 500 on file rotated (kept consistent with a current 100: 500 / 5 at or above it). Then the anchor edge entries: 0:00,
// a minutes box of 0 with no seconds, and seconds alone (0:45), on each goal's anchor field.
function swimLattice() {
  const BASES = { swim_500_time: [null, 390, 480, 616, 750], swim_100_time: [null, 65, 90, 120, 150] };
  const TGTS = { swim_500_time: [345, 450, 480, 570, 660], swim_100_time: [58, 80, 90, 110, 140] };
  const SEEDS = [76308, 1234, 99991], B500S = [null, 350, 480, 616, 750], B500D = [null, 0, 25, 50, 100];
  const L = []; let li = 0;
  for (const goal of ['swim_500_time', 'swim_100_time']) for (const exp of ['beginner', 'intermediate', 'advanced'])
    for (const age of ['18-35', '36-54', '55+']) for (const base of BASES[goal]) for (const tgt of TGTS[goal]) {
      L.push({ goal, exp, age, base, tgt, unit: li % 2 ? 'm' : 'yd', seed: SEEDS[li % SEEDS.length],
        b500: goal !== 'swim_100_time' ? null : base == null ? B500S[li % B500S.length]
          : (B500D[li % B500D.length] == null ? null : base * 5 + B500D[li % B500D.length]) }); li++;
    }
  const RAWS = { swim_500_time: [{ baseMins: '0', baseSecs: '0' }, { baseMins: '0', baseSecs: '' }, { baseMins: '', baseSecs: '45' }],
    swim_100_time: [{ base500Mins: '0', base500Secs: '0' }, { base500Mins: '0', base500Secs: '' }, { base500Mins: '', base500Secs: '45' }] };
  for (const goal of ['swim_500_time', 'swim_100_time']) for (const exp of ['beginner', 'intermediate', 'advanced'])
    for (const age of ['18-35', '36-54', '55+']) for (const raw of RAWS[goal]) {
      L.push({ goal, exp, age, base: goal === 'swim_100_time' && raw.base500Secs !== '45' ? BASES[goal][1 + li % 4] : null, raw,
        tgt: TGTS[goal][li % 5], unit: li % 2 ? 'm' : 'yd', seed: SEEDS[li % SEEDS.length] }); li++;
    }
  return L;
}
const anchorTotOf = (goal, g) => (goal === 'swim_100_time' ? tot(g.base500Mins, g.base500Secs) : tot(g.baseMins, g.baseSecs));
const anchorEntered = o => anchorTotOf(o.goal, swimCfg(o).cardioGoals.swim) > 0;

/** The note audit (N4, N5) of one program's swim notes, into the tally N / nbad. */
function auditNotes(prog, tag, N, nbad) {
  for (const wk of Object.keys(prog.weeks || {})) for (const d of Object.keys(prog.weeks[wk] || {}))
    for (const c of cardsOfDay(prog.weeks[wk][d])) {
      if (c.type !== 'swim') continue;
      const t = String(c.note || ''); if (!t) continue;
      N.swimNotes++;
      if (/build to 10|cap at 10/i.test(t)) nbad.n4.push(tag + ' W' + wk + ' ' + d);
      if (t.indexOf(CAP8_TIME) >= 0) N.cap8Time++;
      if (t.indexOf(CAP8_DIST) >= 0) N.cap8Dist++;
      if (DASH(t)) nbad.n5.push(tag + ' W' + wk + ' ' + d + ' "' + t.slice(0, 90) + '"');
    }
}

/**
 * The clock audit over lattice entries: R1 to R4 (the printed splits against the hand model), N1 to N3 (the notes), and
 * N4, N5 on every swim note. Returns the counts and the misses.
 */
function clockAudit(IA, entries) {
  const R = { builds: 0, ints: 0, faster: 0, slower: 0, damp: 0, blank: 0, w1F: 0, w1S: 0, noW1: 0, steps: 0, met: 0, metCards: 0, rawZero: 0 };
  const bad = { r1: [], r2: [], r3a: [], r3b: [], r3c: [], r4: [] };
  const N = { swimNotes: 0, dampNote: 0, metNote: 0, anchorProgs: 0, zeroEntry: 0, cap8Time: 0, cap8Dist: 0 };
  const nbad = { n1: [], n2: [], n3: [], n4: [], n5: [] };
  for (const o of entries) {
    const prog = IA.buildProgram(swimCfg(o)); R.builds++;
    const tw = Object.keys(prog.weeks || {}).length, k = DIST[o.goal] / 100;
    const gIn = swimCfg(o).cardioGoals.swim, is100 = o.goal === 'swim_100_time';
    const aTot = anchorTotOf(o.goal, gIn), entered = aTot > 0;
    const E = entered ? aTot / 5 : E_DEFAULT[o.exp];
    const cur100 = is100 ? tot(gIn.baseMins, gIn.baseSecs) : 0, gap = is100 && cur100 > 0 ? cur100 - o.tgt : 0;
    const T = is100 ? (gap >= E ? E : E - gap) : o.tgt / k;
    const rate = RATE[o.exp] * AGE_SCALE[o.age], met = T >= E;
    const r = met ? 0 : Math.min((E - T) / tw, rate), damp = !met && (E - T) / tw > rate + 0.05;
    const tag = o.goal + ' ' + o.exp + ' ' + o.age + ' base ' + o.base + ' tgt ' + o.tgt + ' seed ' + o.seed;
    if (!entered) R.blank++;
    if (o.raw && !entered) R.rawZero++;
    if (met) { R.slower++; R.met++; } else R.faster++;
    if (damp) R.damp++;
    const cs = intCards(prog); R.ints += cs.length;
    const byWeek = new Map();
    for (const x of cs) {
      const det = String(x.c.detail || ''), mR = det.match(DET_REP), mS = det.match(DET_SPLIT);
      const split = mS ? mS[1] : null, rep = mR ? mR[2] : null, wantRep = split ? handClock(secs(split) - 2) : '?';
      if (!split || rep !== wantRep) bad.r2.push(tag + ' W' + x.w + ' detail rep ' + rep + ' split ' + split);
      const main = (x.c.segments || []).find(s => /main/i.test(s.label || ''));
      if (main) {
        const sR = String(main.text || '').match(SEG_REP), sS = String(main.text || '').match(SEG_SPLIT);
        if (!sR || !sS || sS[1] !== split || sR[1] !== wantRep) bad.r2.push(tag + ' W' + x.w + ' Main set');
      }
      const model = E - r * (x.w - 1);
      if (!split || Math.abs(secs(split) - model) > 0.55) bad.r3b.push(tag + ' W' + x.w + ' split ' + split + ' model ' + model.toFixed(2));
      if (met) { R.metCards++; if (split !== handClock(E) || rep !== handClock(E - 2)) bad.r4.push(tag + ' W' + x.w + ' ' + split + ' / ' + rep); }
      if (split && !byWeek.has(x.w)) byWeek.set(x.w, secs(split));
    }
    if (byWeek.has(1)) {
      if (met) R.w1S++; else R.w1F++;
      if (byWeek.get(1) !== secs(handClock(E))) bad.r1.push(tag + ' W1 ' + handClock(byWeek.get(1)) + ' want ' + handClock(E));
    } else R.noW1++;
    const wks = [...byWeek.keys()].sort((a, b) => a - b);
    for (let i = 1; i < wks.length; i++) if (wks[i] === wks[i - 1] + 1) {
      R.steps++;
      const st = byWeek.get(wks[i - 1]) - byWeek.get(wks[i]);
      if (st > rate + 1 || st < 0) bad.r3a.push(tag + ' W' + wks[i - 1] + ' step ' + st + ' rate ' + rate);
    }
    auditNotes(prog, tag, N, nbad);
    const printed = new Set([...byWeek.values()].map(handClock)), notes = cs.map(x => String(x.c.note || ''));
    if (damp) {
      const m = notes.map(t => t.match(/target for this block is (\d+:\d\d)\/100/)).find(Boolean);
      if (m && printed.has(m[1])) N.dampNote++; else nbad.n1.push(tag + ' block target ' + (m ? m[1] : 'NO NOTE'));
    }
    const metHits = notes.filter(t => t.indexOf(GOAL_MET_NOTE) >= 0).length;
    if (met ? metHits !== notes.length || !notes.length : metHits !== 0) nbad.n2.push(tag + ' goal met ' + met + ' but ' + metHits + ' of ' + notes.length);
    else if (met) N.metNote++;
    const want = anchorLineOf(o.unit, o.exp) + 'INT: ';
    const opened = notes.filter(t => t.indexOf(want) === 0).length, anyNo = notes.filter(t => /No current/.test(t)).length;
    if (!entered) {
      if (opened !== notes.length || !notes.length) nbad.n3.push(tag + ' blank: ' + opened + ' of ' + notes.length + ' open with the anchor line');
      else { N.anchorProgs++; if (o.raw) N.zeroEntry++; }
    } else if (anyNo) nbad.n3.push(tag + ' entered but ' + anyNo + ' notes say "No current"');
    if (damp && wks.length >= 2) {
      const w0 = wks[0], w1 = wks[wks.length - 1], drop = byWeek.get(w0) - byWeek.get(w1), wantDrop = rate * (w1 - w0);
      if (Math.abs(drop - wantDrop) > 1.1) bad.r3c.push(tag + ' W' + w0 + '->W' + w1 + ' drop ' + drop + ' want ' + wantDrop.toFixed(2));
    }
  }
  return { R, bad, N, nbad };
}

/** The distance and untimed swim goals (swim_mile, swim_tri, swim_base, the time goals with no goal time). */
function distanceGoals(seeds) {
  const out = [];
  for (const exp of ['beginner', 'intermediate', 'advanced']) for (const seed of seeds) {
    for (const id of ['swim_mile', 'swim_tri', 'swim_base']) {
      const c = swimCfg({ goal: id, exp, age: '18-35', unit: 'yd', seed });
      c.cardioGoals.swim = { id, label: id, baselineDist: '1000', baseline: '1000m' };
      out.push([id, c]);
    }
    for (const g of ['swim_500_time', 'swim_100_time']) out.push([g + ' no goal time', swimCfg({ goal: g, exp, age: '36-54', base: 300, unit: 'm', seed })]);
  }
  return out;
}

/** Programs where the swim is not a time goal, or not the only sport: pace runs, NRC, bike, the distance swims. */
function otherGoals(exps, seeds) {
  const PACE = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };
  const BIKE_FTP = { id: 'bike_ftp', label: 'Improve FTP / Power', baseline: '200w', baselineDist: '20' };
  const BIKE_BASE = { id: 'bike_base', label: 'Base', baselineDist: '10', baseline: '10mi' };
  const SW = id => ({ id, label: id, baselineDist: '1000', baseline: '1000m' });
  const nsw = (goals, exp, seed) => { const c = clone(fixtures.HALF_MANNY); c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
    c.cardioTypes = Object.keys(goals); c.cardioGoals = clone(goals); c.experience = exp; c.seed = seed; return c; };
  const nrc = (plan, extra, exp, seed) => { const c = clone(fixtures.HALF_MANNY); c.cardioGoals = { run: Object.assign(clone(c.cardioGoals.run), { id: plan, label: plan }) };
    c.cardioTypes = ['run']; for (const k of Object.keys(extra || {})) { c.cardioTypes.push(k); c.cardioGoals[k] = clone(extra[k]); }
    c.experience = exp; c.seed = seed; return c; };
  const out = [];
  for (const exp of exps) for (const seed of seeds) {
    out.push(['run_pace_goal', nsw({ run: PACE }, exp, seed)]);
    out.push(['run_pace_goal + bike', nsw({ run: PACE, bike: BIKE_BASE }, exp, seed)]);
    out.push(['run_pace_goal + swim_base', nsw({ run: PACE, swim: SW('swim_base') }, exp, seed)]);
    out.push(['NRC run_half', nrc('run_half', null, exp, seed)]);
    out.push(['NRC run_5k + swim_mile', nrc('run_5k', { swim: SW('swim_mile') }, exp, seed)]);
    out.push(['NRC run_10k + bike_ftp', nrc('run_10k', { bike: BIKE_FTP }, exp, seed)]);
    out.push(['bike_ftp', nsw({ bike: BIKE_FTP }, exp, seed)]);
    out.push(['bike_base', nsw({ bike: BIKE_BASE }, exp, seed)]);
    for (const s of ['swim_base', 'swim_mile', 'swim_tri']) out.push([s, nsw({ swim: SW(s) }, exp, seed)]);
    out.push(['swim_500_time with no goal time', swimCfg({ goal: 'swim_500_time', exp, age: '18-35', base: 600, unit: 'yd', seed })]);
  }
  return out;
}
/** Every swim INT note of these programs opens with the distance goal's note (build to 8): {n, bad}. */
function distanceNoteAudit(IA, goals) {
  const A = { n: 0, bad: [] };
  for (const [, c] of goals) {
    const w = IA.buildProgram(clone(c)).weeks;
    for (const wk of Object.keys(w)) for (const d of Object.keys(w[wk])) for (const x of cardsOfDay(w[wk][d])) if (isInt(x)) {
      A.n++;
      if (String(x.note || '').indexOf(DIST_NOTE) !== 0) A.bad.push(c.cardioGoals.swim.id + ' W' + wk + ' "' + String(x.note || '').slice(0, 70) + '"');
    }
  }
  return A;
}

// ── the sizer (D157) ─────────────────────────────────────────────────────────────────────────────────────────────────
/** A time written into a goal in one of three forms: m:ss, seconds alone (minutes box untouched), seconds with "" minutes. */
function put(g, pre, t, form) {
  if (t == null) return g;
  if (form === 'mss') { g[pre + 'Mins'] = String(Math.floor(t / 60)); g[pre + 'Secs'] = String(t % 60); }
  else if (form === 'undef') g[pre + 'Secs'] = String(t);
  else if (form === 'empty') { g[pre + 'Mins'] = ''; g[pre + 'Secs'] = String(t); }
  return g;
}
const FORMS = ['mss', 'undef', 'empty'];
/** A swim time goal with target t and current c in the given forms; a 100 goal carries a 500 of 5c + 30, as m:ss. */
function sizerGoal(goal, t, c, tf, cf) {
  const g = { id: goal, label: goal, swimUnit: 'yd' };
  put(g, 'target', t, tf); put(g, 'base', c, cf);
  if (goal === 'swim_100_time') put(g, 'base500', 5 * c + 30, 'mss');
  return g;
}
/** calcProgramLength as the wizard calls it, for one swim goal: {weeks, warning}. */
function sizer(IA) {
  const L = IA.eval('(function(types,goals,exp,age,focus){return calcProgramLength(types,Object.assign({},goals,{_experience:exp,_ageBracket:age,_eventTargeted:false}),LIFTING_FOCUS_TO_GOAL[focus]||"balanced");})');
  return (g, exp, age, types) => { const r = L(types || ['swim'], { swim: g }, exp, age, 'support_prevention'); return { weeks: r.weeks, warning: r.warning }; };
}
/** The sizer's swim time lattice: target and current times per goal. */
const SIZER_TIMES = { swim_100_time: { T: [45, 50, 55, 58, 59, 65, 75, 90, 120], C: [50, 56, 59, 60, 70, 90, 150] },
  swim_500_time: { T: [240, 300, 330, 420, 540, 660, 900], C: [300, 360, 420, 540, 720, 900] } };
/** A full build cfg for a sizer goal: HALF_MANNY's lifts, swim only or run_base plus swim. */
function sizerCfg(o) {
  const c = clone(fixtures.HALF_MANNY);
  c.cardioTypes = o.mix === 'run+swim' ? ['run', 'swim'] : ['swim']; c.experience = o.exp; c.ageBracket = o.age; c.seed = o.seed || 76308;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate; c.restDays = o.rest || ['sun', 'wed']; c.liftingFocus = 'support_prevention';
  c.cardioGoals = { swim: clone(o.g) };
  if (o.mix === 'run+swim') c.cardioGoals.run = { id: 'run_base', label: 'Run Base', mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' };
  return c;
}
/** The unit entry: a 100 goal of 0:55 against a current 0:59, both typed as seconds alone, a 500 of 5:30. */
const UNIT = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', targetSecs: '55', baseSecs: '59', base500Mins: '5', base500Secs: '30' };
const UNIT_TWIN = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', targetMins: '0', targetSecs: '55', baseMins: '0', baseSecs: '59', base500Mins: '5', base500Secs: '30' };

/** The app with a document that keeps one element per id (a Map), cleared per render. */
function wizardApp() {
  const IA = loadApp(), els = new Map(), mk = IA.window.document.createElement;
  IA.window.document.getElementById = id => { if (!els.has(id)) { const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
  IA.domEls = els;
  return IA;
}
const stripTags = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
/** The pace line as updateSwimPaceDisplay leaves it: {disp, txt}. */
function paceLine(IA, g) {
  IA.domEls.clear(); IA.window.__G = g;
  IA.eval('WD={cardioTypes:["swim"],cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; updateSwimPaceDisplay();');
  const el = IA.domEls.get('swimPaceLine'), raw = el ? String(el.innerHTML || '') : '';
  return { disp: el ? String(el.style.display || '') : 'MISSING', txt: stripTags(raw) };
}
/** The pace line as the wizard's cardio goal step first renders it: {disp, txt}. */
function paceLineRendered(IA, g) {
  IA.domEls.clear(); IA.window.__G = g;
  IA.eval('WD={primaryPath:"goal",cardioTypes:["swim"],experience:"advanced",ageBracket:"18-35",eventTargeted:false,liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:76308,name:"S",cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; wizardStep=WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();');
  const m = String(IA.domEls.get('wizardBody').innerHTML || '').match(/<div id="swimPaceLine"[^>]*display:([a-z]+)[^>]*>([\s\S]*?)<\/div>/);
  return m ? { disp: m[1], txt: stripTags(m[2]) } : { disp: 'MISSING', txt: '' };
}
/** D183's pace line text by hand: "<t> is <pace> per 100 <unit>." */
const paceLineText = (t, goal, unit) => handClock(t) + ' is ' + handClock(t * 100 / DIST[goal]) + ' per 100 ' + unit + '.';
/** The sizer warning's time label by hand: " (<t>/<dist><unit>) needs ". */
const warningLabel = (t, goal, unit) => ' (' + handClock(t) + '/' + DIST[goal] + unit + ') needs ';
/** The current times the label tests carry. */
const LABEL_CURRENT = { swim_100_time: { baseMins: '2', baseSecs: '0', base500Mins: '10', base500Secs: '0' }, swim_500_time: { baseMins: '12', baseSecs: '0' } };
/** Zero-total targets: 0:00 typed every way. */
const ZERO_TARGETS = [{ targetMins: '0', targetSecs: '0' }, { targetMins: '0', targetSecs: '' }, { targetMins: '', targetSecs: '0' }, { targetMins: '', targetSecs: '' }, { targetSecs: '0' }];
const ZERO_CURRENTS = [{ baseMins: '0', baseSecs: '0' }, { baseMins: '0', baseSecs: '' }, { baseMins: '', baseSecs: '0' }, { baseMins: '', baseSecs: '' }, { baseSecs: '0' }];

module.exports = {
  clone, E_DEFAULT, RATE, AGE_SCALE, DIST, handClock, secs, tot, DET_REP, DET_SPLIT, SEG_REP, SEG_SPLIT, DASH,
  GOAL_MET_NOTE, CAP8_TIME, CAP8_DIST, DIST_NOTE, anchorLineOf, swimCfg, goal100, cardsOfDay, isInt, intCards, splitsOf,
  swimLattice, anchorEntered, auditNotes, clockAudit, distanceGoals, otherGoals, distanceNoteAudit,
  put, FORMS, sizerGoal, sizer, SIZER_TIMES, sizerCfg, UNIT, UNIT_TWIN, wizardApp, paceLine, paceLineRendered,
  paceLineText, warningLabel, LABEL_CURRENT, ZERO_TARGETS, ZERO_CURRENTS,
};
