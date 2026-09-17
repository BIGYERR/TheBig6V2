// v196 — MEASURE (Mode B, before-picture).
// Question: "If we let the athlete change cfg.cardioGoals.run.mileBestMins/Secs on a LIVE
// program and re-run refreshProgram, what actually changes, and does anything break?"
//
// Nothing here edits index.html. Every number printed carries its denominator.
//
// INSTRUMENTS (each independent of the function under suspicion):
//  Q1 classification: a pace MASK derived from the PRINTED FORMAT, not from the engine.
//     buildNRCSession's fmt() and buildRunSession both emit paces as `M:SS/mi`; the dose
//     anchor is the numeric field `tgt` (and run_base's `cap`). Masking exactly those and
//     nothing else splits "the same session with different numbers" from "a different
//     session". Durations (5:00 warm up, 3 x 7:00) are NOT masked, so a structural change
//     that moves a duration still reads as structural.
//  Q2 length: a differential over an athlete-controlled input needs no oracle; the
//     mismatch test uses set arithmetic on week keys vs the stored totalWeeks.
//  Q4 chart: the PACE_CHART constant read directly, not through any consumer.
//  Q3 freeze: localStorage state built by hand to the shapes refreshProgram documents
//     (ia_comp_ / ia_logs_ / ia_hist_, key 'w<N>_<day>'), then byte-compared.
const path = require('path');
const H = require(path.resolve(__dirname, '..', 'harness.js'));
const { load, fixtures } = H;
const APP = path.resolve(__dirname, '..', '..', 'index.html');
const IA = load(APP);

const out = [];
const say = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const pct = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : 'n/a';
const J = v => JSON.stringify(v);

say('=== v196 mile-edit blast radius — ia-version ' + IA.version + ' ===');

// ── baseline self-identity (§10b: prove a baseline equals itself first) ──────
{
  const c = JSON.parse(J(fixtures.HALF_MANNY));
  const a = H.progDigest(IA.buildProgram(c));
  const b = H.progDigest(IA.buildProgram(JSON.parse(J(fixtures.HALF_MANNY))));
  say('[0] baseline self-stable: ' + (a === b ? 'YES ' + a : 'NO — ' + a + ' vs ' + b));
  if (a !== b) { say('ABORT: baseline is not reproducible.'); process.exit(1); }
}

// ── the pace mask ───────────────────────────────────────────────────────────
const PACE_RE = /\b\d{1,3}:\d{2}\/mi/g;
function maskPaceStrings(v) {
  return JSON.parse(J(v), (k, val) => {
    if (typeof val === 'string') return val.replace(PACE_RE, 'P/mi');
    if ((k === 'tgt' || k === 'cap') && typeof val === 'number') return 'T';
    return val;
  });
}
function dayCardioRaw(day) { return J(day && day.cardio || null); }
function dayCardioMasked(day) { return J(maskPaceStrings(day && day.cardio || null)); }
function dayLift(day) {
  if (!day) return 'null';
  return J({ title: day.title, dot: day.dot, tags: day.tags, rest: day.rest, sections: day.sections });
}
function dayFull(day) { return J(day || null); }
// Digest of the PRESCRIPTION ONLY. progDigest() hashes the whole program including
// prog.cfg, and cfg carries mileBestMins itself, so it can never report "nothing changed".
function weeksDigest(prog) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(J({ tw: prog.totalWeeks, weeks: prog.weeks })).digest('hex').slice(0, 16);
}

// ── lattice ─────────────────────────────────────────────────────────────────
const GOALS = {
  run_half:       { id: 'run_half',       label: 'Half Marathon',  baselineDist: '5', baseline: '5mi' },
  run_marathon:   { id: 'run_marathon',   label: 'Full Marathon',  baselineDist: '8', baseline: '8mi' },
  run_5k:         { id: 'run_5k',         label: '5K',             baselineDist: '2', baseline: '2mi' },
  run_10k:        { id: 'run_10k',        label: '10K',            baselineDist: '3', baseline: '3mi' },
  run_pace_goal:  { id: 'run_pace_goal',  label: 'Pace Goal',      baselineDist: '2', baseline: '2mi', targetDist: '1.5', targetMins: '10', targetSecs: '0', paceUnit: 'mi' },
  run_mile_time:  { id: 'run_mile_time',  label: 'Mile Time',      baselineDist: '2', baseline: '2mi', targetDist: '1',   targetMins: '7',  targetSecs: '0',  paceUnit: 'mi' },
  run_15_under10: { id: 'run_15_under10', label: '1.5 under 10',   baselineDist: '2', baseline: '2mi', targetDist: '1.5', targetMins: '10', targetSecs: '0', paceUnit: 'mi' },
  run_base:       { id: 'run_base',       label: 'Running Base',   baselineDist: '3', baseline: '3mi' },
};
const GOAL_IDS = Object.keys(GOALS);
const NRC = new Set(['run_half', 'run_marathon', 'run_5k', 'run_10k']);
const EXPS = ['beginner', 'intermediate', 'advanced'];
const FOCUS = ['support_prevention', 'support_athletic', 'support_strength', 'hypertrophy'];
const EQUIP = ['crossfit', 'commercial', 'bodyweight'];
const REST = [['sun', 'wed'], ['sat', 'sun']];
const AGES = ['18-35', '36-54'];
const SEEDS = [76308, 11111, 90210];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function mkCfg(goalId, exp, focus, equip, rest, age, seed, mileSec, opts) {
  opts = opts || {};
  const g = Object.assign({}, GOALS[goalId]);
  if (mileSec != null) { g.mileBestMins = String(Math.floor(mileSec / 60)); g.mileBestSecs = String(mileSec % 60); g.mileBestSrc = { kind: 'entered' }; }
  const event = NRC.has(goalId) && goalId !== 'run_5k' && goalId !== 'run_10k';
  const cfg = {
    name: 'MEASURE', primaryPath: event ? 'event' : 'both', cardioTypes: ['run'],
    cardioGoals: { run: g },
    eventTargeted: event, raceDate: event ? '2027-06-05' : null,
    liftingFocus: focus, experience: exp, ageBracket: age, equipment: equip, unit: 'lbs',
    restDays: rest.slice(), days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: seed,
  };
  if (opts.pin != null) cfg._raceDateCappedWeeks = opts.pin;
  return cfg;
}

// ════════════════════════════════════════════════════════════════════════════
// Q1 — BLAST RADIUS BY GOAL: 630s -> 480s, same seed, everything else identical
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q1 BLAST RADIUS: mileBest 10:30 (630s) -> 8:00 (480s) ===');
const BEFORE = 630, AFTER = 480;
const q1 = {};   // goalId -> counters
const q1seg = {};// goalId|exp -> counters
let q1cfgs = 0, q1days = 0;
const q1examples = {};

function ctr() { return { cfgs: 0, cfgsChanged: 0, days: 0, daysDiff: 0, paceOnly: 0, cardioStruct: 0, liftDiff: 0, dayAdded: 0, dayRemoved: 0, lenDiff: 0, placement: 0, weeks: 0, weeksPlacement: 0 }; }

for (const goalId of GOAL_IDS) {
  q1[goalId] = ctr();
  for (const exp of EXPS) {
    const sk = goalId + '|' + exp;
    q1seg[sk] = ctr();
    for (const focus of FOCUS) for (const equip of EQUIP) for (const rest of REST) for (const age of AGES) for (const seed of SEEDS) {
      const cA = mkCfg(goalId, exp, focus, equip, rest, age, seed, BEFORE);
      const cB = mkCfg(goalId, exp, focus, equip, rest, age, seed, AFTER);
      const pA = IA.buildProgram(cA), pB = IA.buildProgram(cB);
      const C = q1[goalId], S = q1seg[sk];
      C.cfgs++; S.cfgs++; q1cfgs++;
      let changed = false;
      if (pA.totalWeeks !== pB.totalWeeks) { C.lenDiff++; S.lenDiff++; changed = true; }
      const wks = new Set([...Object.keys(pA.weeks || {}), ...Object.keys(pB.weeks || {})]);
      for (const w of wks) {
        const wa = (pA.weeks || {})[w] || {}, wb = (pB.weeks || {})[w] || {};
        C.weeks++; S.weeks++;
        // placement: same multiset of (title, cardio subtype) but different weekday map
        const sigOf = wk => Object.keys(wk).map(d => (wk[d].title || '') + '/' + ((wk[d].cardio && (wk[d].cardio.subtype || wk[d].cardio.type)) || '')).sort().join('|');
        const mapOf = wk => Object.keys(wk).sort().map(d => d + '=' + (wk[d].title || '') + '/' + ((wk[d].cardio && (wk[d].cardio.subtype || wk[d].cardio.type)) || '')).join('|');
        if (sigOf(wa) === sigOf(wb) && mapOf(wa) !== mapOf(wb)) { C.weeksPlacement++; S.weeksPlacement++; C.placement++; S.placement++; changed = true; }
        const ds = new Set([...Object.keys(wa), ...Object.keys(wb)]);
        for (const d of ds) {
          C.days++; S.days++; q1days++;
          const a = wa[d], b = wb[d];
          if (!a) { C.dayAdded++; S.dayAdded++; C.daysDiff++; S.daysDiff++; changed = true; continue; }
          if (!b) { C.dayRemoved++; S.dayRemoved++; C.daysDiff++; S.daysDiff++; changed = true; continue; }
          if (dayFull(a) === dayFull(b)) continue;
          C.daysDiff++; S.daysDiff++; changed = true;
          const lift = dayLift(a) !== dayLift(b);
          const cm = dayCardioMasked(a) !== dayCardioMasked(b);
          const cr = dayCardioRaw(a) !== dayCardioRaw(b);
          if (lift) { C.liftDiff++; S.liftDiff++; }
          if (cm) {
            C.cardioStruct++; S.cardioStruct++;
            if (!q1examples[goalId]) q1examples[goalId] = { w, d, exp, focus, equip, seed, a: dayCardioRaw(a).slice(0, 320), b: dayCardioRaw(b).slice(0, 320) };
          } else if (cr) { C.paceOnly++; S.paceOnly++; }
        }
      }
      if (changed) { C.cfgsChanged++; S.cfgsChanged++; }
    }
  }
}
say('lattice: ' + q1cfgs + ' configs (8 goals x 3 exp x 4 focus x 3 equip x 2 rest x 2 age x 3 seeds), ' + (q1cfgs * 2) + ' builds, ' + q1days + ' day-slots compared');
say('');
say('goal            cfgsChanged/cfgs   daysDiff/days        paceOnly   cardioStruct   liftDiff   len   placement  +day  -day');
for (const g of GOAL_IDS) {
  const c = q1[g];
  say(g.padEnd(15) + (c.cfgsChanged + '/' + c.cfgs).padEnd(19) + (c.daysDiff + '/' + c.days + ' (' + pct(c.daysDiff, c.days) + ')').padEnd(21) +
    String(c.paceOnly).padEnd(11) + String(c.cardioStruct).padEnd(15) + String(c.liftDiff).padEnd(11) + String(c.lenDiff).padEnd(6) + String(c.placement).padEnd(11) + String(c.dayAdded).padEnd(6) + String(c.dayRemoved));
}
say('');
say('segmented by experience (cfgsChanged/cfgs | daysDiff/days | cardioStruct):');
for (const g of GOAL_IDS) {
  const row = EXPS.map(e => { const c = q1seg[g + '|' + e]; return e + ' ' + c.cfgsChanged + '/' + c.cfgs + ' ' + c.daysDiff + '/' + c.days + ' cs=' + c.cardioStruct; }).join('   ');
  say('  ' + g.padEnd(15) + row);
}
say('');
for (const g of GOAL_IDS) if (q1examples[g]) {
  const e = q1examples[g];
  say('  STRUCT EXAMPLE ' + g + ' W' + e.w + ' ' + e.d + ' exp=' + e.exp + ' focus=' + e.focus + ' equip=' + e.equip + ' seed=' + e.seed);
  say('    630: ' + e.a);
  say('    480: ' + e.b);
}

// ── Q1f: the LIFTING that moves with the run anchor (_longRunTier time on feet) ──
say('');
say('=== Q1f LIFTING CHANGES DRIVEN BY THE RUN ANCHOR (long-run tier) ===');
say('  index.html:9796  _longRunTier: m = dose.k===\'time\' ? mins : mi * dose.tgt / 60');
say('  dose.tgt IS chartRow.recovery, so TIME ON FEET is a function of the mile anchor.');
say('  index.html:9814  d18LongRunDayPass(weeks) consumes the tier (A = mobility only,');
say('  B = upper/trunk <=8 sets no hinge no power, C = normal).');
{
  const tierOf = IA.eval('_longRunTier');
  let flips = 0, longDays = 0;
  const byGoal = {};
  const tierPairs = {};
  for (const goalId of ['run_half', 'run_marathon', 'run_5k', 'run_10k']) {
    byGoal[goalId] = [0, 0];
    for (const exp of ['intermediate', 'advanced']) for (const rest of REST) for (const seed of SEEDS) {
      const pA = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', rest, '18-35', seed, BEFORE));
      const pB = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', rest, '18-35', seed, AFTER));
      for (const w of Object.keys(pA.weeks)) for (const d of Object.keys(pA.weeks[w])) {
        const a = pA.weeks[w][d], b = (pB.weeks[w] || {})[d];
        if (!a || !b || !a.cardio) continue;
        const ta = tierOf(a.cardio), tb = tierOf(b.cardio);
        if (ta == null && tb == null) continue;
        longDays++; byGoal[goalId][1]++;
        if (ta !== tb) { flips++; byGoal[goalId][0]++; const k = goalId + ' ' + ta + '->' + tb; tierPairs[k] = (tierPairs[k] || 0) + 1; }
      }
    }
  }
  say('  long-run days whose TIER flips on a 10:30 -> 8:00 edit: ' + flips + '/' + longDays + ' (' + pct(flips, longDays) + ')');
  for (const g of Object.keys(byGoal)) say('    ' + g.padEnd(15) + byGoal[g][0] + '/' + byGoal[g][1]);
  Object.keys(tierPairs).sort().forEach(k => say('    flip ' + k.padEnd(28) + 'n=' + tierPairs[k]));
  // and the lifting that actually moved
  let liftMoved = 0, liftTot = 0;
  for (const goalId of ['run_half', 'run_marathon', 'run_5k', 'run_10k']) for (const exp of ['intermediate', 'advanced']) for (const seed of SEEDS) {
    const pA = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', seed, BEFORE));
    const pB = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', seed, AFTER));
    for (const w of Object.keys(pA.weeks)) for (const d of Object.keys(pA.weeks[w])) {
      const a = pA.weeks[w][d], b = (pB.weeks[w] || {})[d]; if (!a || !b) continue;
      liftTot++; if (dayLift(a) !== dayLift(b)) liftMoved++;
    }
  }
  say('  days whose LIFTING (title/tags/sections) differs on the same edit: ' + liftMoved + '/' + liftTot + ' (' + pct(liftMoved, liftTot) + ')');
}

// ── Q1b: the pace-goal family, probed directly (not inferred from a zero) ────
say('');
say('=== Q1b PACE-GOAL FAMILY: sweep the anchor across the whole chart at ONE length ===');
{
  const sweep = [300, 360, 420, 480, 540, 600, 630, 660, 720, 900];
  for (const goalId of ['run_pace_goal', 'run_mile_time', 'run_15_under10']) {
    const seen = new Map();
    const samples = [];
    for (const sec of sweep) {
      const c = mkCfg(goalId, 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, sec);
      Object.assign(c.cardioGoals.run, { targetDist: '1.5', targetMins: '12', targetSecs: '0' });
      c._raceDateCappedWeeks = 11;   // pin the length so ONLY the anchor moves
      const p = IA.buildProgram(c);
      const d = weeksDigest(p);
      seen.set(d, (seen.get(d) || 0) + 1);
      const pull = [];
      for (const w of ['1', '5', '9']) for (const dd of Object.keys(p.weeks[w] || {})) {
        const day = p.weeks[w][dd];
        if (day.cardio && /Interval|Continuous|Long Slow/.test(day.cardio.subtype || '')) { pull.push('W' + w + ' ' + day.cardio.subtype.slice(0, 12) + ' ' + (String(day.cardio.detail).match(PACE_RE) || []).join(' ')); }
      }
      samples.push('    ' + fmt(sec).padEnd(7) + ' tw=' + p.totalWeeks + ' | ' + pull.slice(0, 4).join(' | '));
    }
    say('  ' + goalId + ': ' + seen.size + ' distinct week-grids over ' + sweep.length + ' anchors from 5:00 to 15:00 (length pinned to 11)');
    samples.forEach(l => say(l));
  }
  // and the same probe with the length NOT pinned, to separate "anchor did nothing"
  // from "anchor only moved the length"
  const seen2 = new Set();
  for (const sec of [300, 420, 480, 540, 600, 630, 720, 900]) {
    const c = mkCfg('run_pace_goal', 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, sec);
    Object.assign(c.cardioGoals.run, { targetDist: '1.5', targetMins: '12', targetSecs: '0' });
    const p = IA.buildProgram(c);
    seen2.add(p.totalWeeks + ':' + weeksDigest(p));
  }
  say('  run_pace_goal unpinned: ' + seen2.size + ' distinct (length, week-grid) pairs over 8 anchors — every difference is the LENGTH, see Q2.');
}

// ── Q1c: the Run-paces card claims "every pace comes from this row". Test it. ──
say('');
say('=== Q1c DOES THE RUN-PACES CARD AGREE WITH THE SESSIONS IT SPEAKS FOR? ===');
{
  const rai = IA.eval('runAnchorInfo');
  let rows = 0, agree = 0;
  for (const goalId of GOAL_IDS) for (const exp of ['intermediate', 'advanced']) for (const sec of [420, 480, 570, 630, 720]) {
    const c = mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, sec);
    if (goalId === 'run_pace_goal' || goalId === 'run_mile_time' || goalId === 'run_15_under10') Object.assign(c.cardioGoals.run, { targetDist: '1.5', targetMins: '12', targetSecs: '0' });
    const a = rai(c);
    if (!a) continue;
    const p = IA.buildProgram(c);
    const cardPaces = new Set([a.row.mile, a.row.fiveK, a.row.tenK, a.row.tempo, a.row.recovery, a.row.half, a.row.marathon].map(v => fmt(v) + '/mi'));
    let printed = 0, matched = 0;
    for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
      const day = p.weeks[w][d]; if (!day.cardio) continue;
      const ms = String(day.cardio.detail || '').match(PACE_RE) || [];
      for (const m of ms) { printed++; if (cardPaces.has(m)) matched++; }
    }
    rows++;
    if (printed && matched === printed) agree++;
    say('    ' + goalId.padEnd(15) + exp.padEnd(13) + 'anchor ' + fmt(sec) + ' -> printed pace tokens matching the card row: ' + matched + '/' + printed + ' (' + pct(matched, printed) + ')');
  }
  say('  rows where EVERY printed pace comes from the card row: ' + agree + '/' + rows);
}

// ── Q1d: the NRC structural change, segmented ───────────────────────────────
say('');
say('=== Q1d NRC STRUCTURAL CHANGES, SEGMENTED (the ones that are NOT pace-string-only) ===');
{
  const hits = {};
  let tot = 0;
  for (const goalId of ['run_half', 'run_marathon', 'run_5k', 'run_10k']) for (const exp of ['intermediate', 'advanced'])
    for (const rest of REST) for (const seed of SEEDS) {
      const pA = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', rest, '18-35', seed, BEFORE));
      const pB = IA.buildProgram(mkCfg(goalId, exp, 'support_prevention', 'crossfit', rest, '18-35', seed, AFTER));
      for (const w of Object.keys(pA.weeks)) for (const d of Object.keys(pA.weeks[w])) {
        const a = pA.weeks[w][d], b = (pB.weeks[w] || {})[d];
        if (!a || !b) continue;
        if (dayCardioMasked(a) === dayCardioMasked(b)) continue;
        tot++;
        const k = goalId + ' W' + w + ' ' + (a.cardio ? a.cardio.subtype : '?');
        if (!hits[k]) hits[k] = { n: 0, a: String(a.cardio.detail).slice(0, 70), b: String(b.cardio.detail).slice(0, 70) };
        hits[k].n++;
      }
    }
  say('  ' + tot + ' structurally-different cardio days over the NRC sub-lattice (4 goals x 2 exp x 2 rest x 3 seeds = 48 programs)');
  Object.keys(hits).sort().forEach(k => say('    ' + k.padEnd(42) + 'n=' + hits[k].n + '  630:"' + hits[k].a + '"  480:"' + hits[k].b + '"'));
  say('  ROOT: index.html:4097 converts Nike\'s DISTANCE recovery entries to minutes with');
  say('        chartRow.recovery, then index.html:4105 keeps the LONGEST N. A faster anchor');
  say('        re-sorts that list, so a different Nike session survives the cut.');
}

// ── Q1e: run_base — the anchor sets the DOSE, not just the pace string ──────
say('');
say('=== Q1e RUN_BASE: the anchor sets prescribed MINUTES ===');
{
  for (const sec of [420, 480, 570, 630, 720]) {
    const p = IA.buildProgram(mkCfg('run_base', 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, sec));
    const mins = [];
    for (const w of ['1', '3', '6']) for (const d of Object.keys(p.weeks[w] || {})) {
      const day = p.weeks[w][d];
      if (day.cardio && day.cardio.dose && day.cardio.dose.k === 'time') mins.push('W' + w + ':' + day.cardio.dose.mins);
    }
    say('    anchor ' + fmt(sec) + ' -> prescribed minutes ' + mins.join(' '));
  }
  say('  ROOT: index.html:3695 / 3729  _mins = max(15, round((dist * _row.recovery / 60)/5)*5)');
  say('  NOTE: runAnchorInfo() returns null for run_base (index.html:13360), so the athlete');
  say('        is shown NO pace card for the one goal whose prescribed dose the anchor sets.');
}

// ════════════════════════════════════════════════════════════════════════════
// Q2 — LENGTH RISK
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q2 LENGTH RISK ===');
const PAIRS = [300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600, 630, 660, 690, 720, 780, 900];
const TARGETS = [
  { targetDist: '1',   targetMins: '6',  targetSecs: '0' },
  { targetDist: '1',   targetMins: '7',  targetSecs: '30' },
  { targetDist: '1.5', targetMins: '10', targetSecs: '0' },
  { targetDist: '1.5', targetMins: '12', targetSecs: '0' },
  { targetDist: '3.1', targetMins: '24', targetSecs: '0' },
  { targetDist: '5',   targetMins: '42', targetSecs: '0' },
];
const LIFTG = { support_prevention: 'balanced', support_athletic: 'athletic', support_strength: 'strength', hypertrophy: 'hypertrophy' };
const calcLen = IA.calcProgramLength;
say('');
say('(a) calcProgramLength() weeks as a pure function of mileBest — no program, no pin.');
say('    goal / exp / age / target      weeks by mileBest ' + PAIRS.join(',') );
let a_rows = 0, a_varying = 0, a_span = 0, a_maxspan = 0;
const q2spanByGoal = {};
for (const goalId of GOAL_IDS) {
  q2spanByGoal[goalId] = { rows: 0, varying: 0, maxspan: 0 };
  const tgts = (goalId === 'run_pace_goal' || goalId === 'run_mile_time' || goalId === 'run_15_under10') ? TARGETS : [null];
  for (const exp of EXPS) for (const age of AGES) for (const t of tgts) {
    const g = Object.assign({}, GOALS[goalId], t || {});
    const ws = PAIRS.map(sec => {
      const gg = Object.assign({}, g, { mileBestMins: String(Math.floor(sec / 60)), mileBestSecs: String(sec % 60) });
      const cg = { run: gg, _experience: exp, _ageBracket: age, _eventTargeted: NRC.has(goalId) };
      return calcLen(['run'], cg, 'balanced').weeks;
    });
    const span = Math.max(...ws) - Math.min(...ws);
    a_rows++; q2spanByGoal[goalId].rows++;
    if (span > 0) { a_varying++; q2spanByGoal[goalId].varying++; }
    if (span > q2spanByGoal[goalId].maxspan) q2spanByGoal[goalId].maxspan = span;
    if (span > a_maxspan) a_maxspan = span;
    a_span += span;
    if (span > 0 && q2spanByGoal[goalId].varying <= 6) say('    ' + (goalId + ' ' + exp + ' ' + age + ' ' + (t ? t.targetDist + 'mi/' + t.targetMins + ':' + t.targetSecs : '-')).padEnd(46) + ws.join(','));
  }
}
say('    ROLLUP calcProgramLength: ' + a_varying + '/' + a_rows + ' (goal,exp,age,target) rows change length with mileBest; max span ' + a_maxspan + ' weeks');
for (const g of GOAL_IDS) say('      ' + g.padEnd(15) + q2spanByGoal[g].varying + '/' + q2spanByGoal[g].rows + ' vary, max span ' + q2spanByGoal[g].maxspan);

say('');
say('(b) buildProgram().totalWeeks WITHOUT cfg._raceDateCappedWeeks (harness-built cfg):');
say('(c) buildProgram().totalWeeks WITH  cfg._raceDateCappedWeeks pinned at the BEFORE value');
say('    (the wizard sets this unconditionally at doGenerate and it is spread into prog.cfg).');
let b_rows = 0, b_vary = 0, c_rows = 0, c_vary = 0;
const q2lines = [];
for (const goalId of GOAL_IDS) {
  const tgts = (goalId === 'run_pace_goal' || goalId === 'run_mile_time' || goalId === 'run_15_under10') ? TARGETS : [null];
  for (const exp of EXPS) for (const age of AGES) for (const t of tgts) {
    const mk = (sec, pin) => {
      const c = mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], age, 76308, sec, pin != null ? { pin } : {});
      Object.assign(c.cardioGoals.run, t || {});
      return IA.buildProgram(c).totalWeeks;
    };
    const wsB = PAIRS.map(s => mk(s, null));
    const spanB = Math.max(...wsB) - Math.min(...wsB);
    b_rows++; if (spanB > 0) { b_vary++; if (q2lines.length < 14) q2lines.push('    (b) ' + (goalId + ' ' + exp + ' ' + age + ' ' + (t ? t.targetDist + 'mi/' + t.targetMins : '-')).padEnd(42) + wsB.join(',')); }
    const pin = mk(BEFORE, null);
    const wsC = PAIRS.map(s => mk(s, pin));
    const spanC = Math.max(...wsC) - Math.min(...wsC);
    c_rows++; if (spanC > 0) c_vary++;
  }
}
q2lines.forEach(l => say(l));
say('    ROLLUP (b) no pin : ' + b_vary + '/' + b_rows + ' rows change buildProgram totalWeeks with mileBest');
say('    ROLLUP (c) pinned : ' + c_vary + '/' + c_rows + ' rows change buildProgram totalWeeks with mileBest');

// (d) what happens to a stored program whose week count no longer matches
say('');
say('(d) refreshProgram on a LIVE program whose length moves. Simulated end-to-end.');
function freshStore() { IA.localStorage.clear(); }
function mondayOf(iso) { const d = new Date(iso + 'T00:00:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.toISOString().slice(0, 10); }
function isoAddDays(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const TODAY = new Date().toISOString().slice(0, 10);
const START_W4 = isoAddDays(mondayOf(TODAY), -21);   // makes refreshProgram's _curWk == 4

function liveRefresh(cfg, newMileSec, opts) {
  opts = opts || {};
  freshStore();
  const prog = IA.buildProgram(JSON.parse(J(cfg)));
  prog.startDate = opts.startDate || START_W4;
  IA.localStorage.setItem('ia_programs', J([prog]));
  if (opts.touch) {
    const comp = {}, hist = {};
    opts.touch.forEach(k => { comp[k] = { done: true }; });
    if (opts.hist) opts.hist.forEach(k => {
      const m = /^w(\d+)_(.+)$/.exec(k); if (!m) return;
      const day = (prog.weeks[m[1]] || {})[m[2]]; if (day) hist[k] = JSON.parse(J(day));
    });
    IA.localStorage.setItem('ia_comp_' + prog.id, J(comp));
    IA.localStorage.setItem('ia_hist_' + prog.id, J(hist));
  }
  const before = JSON.parse(J(prog));
  prog.cfg.cardioGoals.run.mileBestMins = String(Math.floor(newMileSec / 60));
  prog.cfg.cardioGoals.run.mileBestSecs = String(newMileSec % 60);
  const after = IA.refreshProgram(prog);
  return { before, after };
}
{
  // pick a config whose length actually moves (from the (b) sweep: pace-goal family)
  const cases = [
    { goal: 'run_pace_goal', exp: 'intermediate', t: { targetDist: '1.5', targetMins: '10', targetSecs: '0' }, from: 630, to: 480 },
    { goal: 'run_pace_goal', exp: 'intermediate', t: { targetDist: '1.5', targetMins: '10', targetSecs: '0' }, from: 480, to: 720 },
    { goal: 'run_pace_goal', exp: 'advanced',     t: { targetDist: '5',   targetMins: '42', targetSecs: '0' }, from: 630, to: 420 },
    { goal: 'run_pace_goal', exp: 'intermediate', t: { targetDist: '1',   targetMins: '6',  targetSecs: '0' }, from: 630, to: 420 },
  ];
  for (const cs of cases) {
    for (const pin of [false, true]) {
      const c = mkCfg(cs.goal, cs.exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, cs.from);
      Object.assign(c.cardioGoals.run, cs.t);
      const p0 = IA.buildProgram(JSON.parse(J(c)));
      if (pin) c._raceDateCappedWeeks = p0.totalWeeks;
      const r = liveRefresh(c, cs.to, { touch: ['w1_mon', 'w2_mon', 'w3_mon'], hist: ['w1_mon', 'w2_mon', 'w3_mon'] });
      const wkKeysB = Object.keys(r.before.weeks).map(Number).sort((a, b) => a - b);
      const wkKeysA = Object.keys(r.after.weeks).map(Number).sort((a, b) => a - b);
      say('    ' + cs.goal + ' ' + cs.exp + ' ' + cs.t.targetDist + 'mi/' + cs.t.targetMins + ' ' + cs.from + '->' + cs.to +
        ' pin=' + pin +
        ' | totalWeeks ' + r.before.totalWeeks + '->' + r.after.totalWeeks +
        ' | week keys ' + wkKeysB.length + '->' + wkKeysA.length + ' (max ' + Math.max(...wkKeysB) + '->' + Math.max(...wkKeysA) + ')' +
        ' | orphan weeks (key > totalWeeks): ' + wkKeysA.filter(k => k > r.after.totalWeeks).join(',') || '-');
    }
  }
}

// (e) the dangerous shape: length COLLAPSES under a training frontier that is already
//     past the new length. Freeze cut = maxTouched+1, so stored weeks are written back
//     into a shorter rebuild.
say('');
say('(e) length collapse under a deep training frontier (no pin):');
{
  const c = mkCfg('run_pace_goal', 'advanced', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, 630);
  Object.assign(c.cardioGoals.run, { targetDist: '5', targetMins: '42', targetSecs: '0' });
  for (const frontier of [3, 8, 12]) {
    freshStore();
    const p0 = IA.buildProgram(JSON.parse(J(c)));
    const touch = [], hist = [];
    for (let w = 1; w <= frontier; w++) for (const d of Object.keys(p0.weeks[w] || {})) { touch.push('w' + w + '_' + d); hist.push('w' + w + '_' + d); }
    const r = liveRefresh(c, 420, { touch, hist, startDate: START_W4 });
    const keys = Object.keys(r.after.weeks).map(Number).sort((a, b) => a - b);
    const orphans = keys.filter(k => k > r.after.totalWeeks);
    say('    frontier w1..w' + frontier + ': totalWeeks ' + r.before.totalWeeks + '->' + r.after.totalWeeks +
      ', week keys present ' + keys.length + ' (max ' + Math.max(...keys) + '), ORPHAN weeks beyond totalWeeks: [' + orphans.join(',') + ']' +
      ', days stranded in orphan weeks: ' + orphans.reduce((n, k) => n + Object.keys(r.after.weeks[k]).length, 0));
    // what the clock says
    const cw = IA.eval('calcCurrentWeek');
    say('      startDate ' + r.after.startDate + '; refreshProgram does NOT preserve prog.totalWeeks (index.html:14313-14318 preserves id/name/created/startDate/seed/overlays only)');
  }
}

// (f) is the pin real on a wizard-built program? drive doGenerate in the harness.
say('');
say('(f) does a wizard-generated cfg actually carry _raceDateCappedWeeks?');
try {
  freshStore();
  const WD = IA.eval('WD');
  Object.assign(WD, {
    name: 'WIZ', primaryPath: 'both', cardioTypes: ['run'],
    cardioGoals: { run: { id: 'run_pace_goal', label: 'Pace Goal', baselineDist: '2', baseline: '2mi', targetDist: '1.5', targetMins: '10', targetSecs: '0', paceUnit: 'mi', mileBestMins: '10', mileBestSecs: '30', mileBestSrc: { kind: 'entered' } } },
    eventTargeted: false, raceDate: null, liftingFocus: 'support_prevention', experience: 'intermediate',
    ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: 76308,
  });
  IA.doGenerate();
  IA.flushTimers(40);
  const progs = JSON.parse(IA.localStorage.getItem('ia_programs') || '[]');
  const wp = progs[progs.length - 1];
  say('    programs stored: ' + progs.length + '; cfg._raceDateCappedWeeks = ' + (wp ? J(wp.cfg._raceDateCappedWeeks) : 'NO PROGRAM BUILT') + '; totalWeeks = ' + (wp && wp.totalWeeks));
  if (wp) say('    cfg._racePin present after store? ' + ('_racePin' in wp.cfg) + '   (index.html:9756 deletes it; nothing deletes _raceDateCappedWeeks)');
} catch (e) { say('    FAILED MEASUREMENT — doGenerate threw: ' + e.message); }

// ════════════════════════════════════════════════════════════════════════════
// Q3 — FREEZE INTEGRITY
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q3 FREEZE INTEGRITY across a mileBest change ===');
const q3 = { cfgs: 0, trained: 0, trainedChanged: 0, untrPast: 0, untrPastRepaced: 0, untrPierce: 0, untrPierceRepaced: 0, future: 0, futureRepaced: 0,
             trainedNoSnap: 0, trainedNoSnapChanged: 0 };
const q3byGoal = {};
for (const goalId of GOAL_IDS) {
  q3byGoal[goalId] = { trained: 0, trainedChanged: 0, untrPast: 0, untrPastRepaced: 0, untrPierce: 0, untrPierceRepaced: 0, future: 0, futureRepaced: 0 };
  for (const exp of EXPS) for (const equip of EQUIP) for (const seed of SEEDS) {
    const c = mkCfg(goalId, exp, 'support_prevention', equip, ['sun', 'wed'], '18-35', seed, BEFORE);
    // build once to learn its day keys
    freshStore();
    const p0 = IA.buildProgram(JSON.parse(J(c)));
    // trained set: weeks 1..3 MON+THU get a hist snapshot + completion; week 2 SAT gets a
    // completion with NO snapshot (the legacy carve-out branch); everything else untouched.
    const touch = [], hist = [];
    for (let w = 1; w <= 3; w++) for (const d of ['mon', 'thu']) if ((p0.weeks[w] || {})[d]) { touch.push('w' + w + '_' + d); hist.push('w' + w + '_' + d); }
    const noSnapKey = (p0.weeks[2] || {}).sat ? 'w2_sat' : null;
    if (noSnapKey) touch.push(noSnapKey);
    const r = liveRefresh(c, AFTER, { touch, hist });
    q3.cfgs++;
    const G = q3byGoal[goalId];
    const curWk = 4;
    const cut = 4;  // max(dateCut=4, maxTouched+1=4)
    for (const wk of Object.keys(r.before.weeks)) {
      const w = +wk;
      for (const d of Object.keys(r.before.weeks[wk])) {
        const k = 'w' + w + '_' + d;
        const b = r.before.weeks[wk][d], a = (r.after.weeks[wk] || {})[d];
        const same = dayFull(b) === dayFull(a);
        if (hist.includes(k)) { q3.trained++; G.trained++; if (!same) { q3.trainedChanged++; G.trainedChanged++; } }
        else if (k === noSnapKey) { q3.trainedNoSnap++; if (!same) q3.trainedNoSnapChanged++; }
        else if (w < cut && w < curWk) { q3.untrPast++; G.untrPast++; if (!same) { q3.untrPastRepaced++; G.untrPastRepaced++; } }
        else if (w < cut) { q3.untrPierce++; G.untrPierce++; if (!same) { q3.untrPierceRepaced++; G.untrPierceRepaced++; } }
        else { q3.future++; G.future++; if (!same) { q3.futureRepaced++; G.futureRepaced++; }
               if (b && b.cardio) { q3.futureCardio = (q3.futureCardio||0)+1; if (!same) q3.futureCardioRepaced = (q3.futureCardioRepaced||0)+1; } }
      }
    }
  }
}
say('lattice: ' + q3.cfgs + ' live programs (8 goals x 3 exp x 3 equip x 3 seeds), startDate ' + START_W4 + ' -> refreshProgram _curWk 4, freeze cut 4');
say('  TRAINED days (ia_hist_ snapshot + completion) changed by the edit : ' + q3.trainedChanged + '/' + q3.trained + ' (' + pct(q3.trainedChanged, q3.trained) + ')');
say('  TOUCHED-but-no-snapshot days changed                              : ' + q3.trainedNoSnapChanged + '/' + q3.trainedNoSnap + ' (' + pct(q3.trainedNoSnapChanged, q3.trainedNoSnap) + ')');
say('  UNTRAINED days in a PAST week (w < curWk, no pierce) re-paced     : ' + q3.untrPastRepaced + '/' + q3.untrPast + ' (' + pct(q3.untrPastRepaced, q3.untrPast) + ')');
say('  UNTRAINED days in a PIERCED frozen week (curWk <= w < cut)        : ' + q3.untrPierceRepaced + '/' + q3.untrPierce + ' (' + pct(q3.untrPierceRepaced, q3.untrPierce) + ')');
say('  FUTURE days (w >= cut) re-paced                                   : ' + q3.futureRepaced + '/' + q3.future + ' (' + pct(q3.futureRepaced, q3.future) + ')');
say('    of which CARDIO-bearing future days (the only ones that can carry a pace) : ' + (q3.futureCardioRepaced||0) + '/' + (q3.futureCardio||0) + ' (' + pct(q3.futureCardioRepaced||0, q3.futureCardio||0) + ')');
say('  by goal (trainedChanged/trained | untrPastRepaced/untrPast | futureRepaced/future):');
for (const g of GOAL_IDS) { const G = q3byGoal[g]; say('    ' + g.padEnd(15) + G.trainedChanged + '/' + G.trained + '   ' + G.untrPastRepaced + '/' + G.untrPast + '   ' + G.futureRepaced + '/' + G.future); }

// Scenario 2: a training frontier AHEAD of the calendar week, so the freeze range
// contains PIERCED weeks (curWk <= w < cut) with untrained days in them.
say('');
say('  scenario 2 — frontier in week 6 while the calendar says week 4 (cut = 7, weeks 4-6 pierce):');
{
  const s2 = { trained: 0, trainedChanged: 0, untrPast: 0, untrPastRepaced: 0, untrPierce: 0, untrPierceRepaced: 0, future: 0, futureRepaced: 0, cfgs: 0 };
  for (const goalId of GOAL_IDS) for (const exp of EXPS) for (const seed of SEEDS) {
    const c = mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', seed, BEFORE);
    freshStore();
    const p0 = IA.buildProgram(JSON.parse(J(c)));
    const touch = [], hist = [];
    for (const w of [1, 6]) for (const d of ['mon']) if ((p0.weeks[w] || {})[d]) { touch.push('w' + w + '_' + d); hist.push('w' + w + '_' + d); }
    const r = liveRefresh(c, AFTER, { touch, hist });
    s2.cfgs++;
    const curWk = 4, cut = 7;
    for (const wk of Object.keys(r.before.weeks)) {
      const w = +wk;
      for (const d of Object.keys(r.before.weeks[wk])) {
        const k = 'w' + w + '_' + d;
        const same = dayFull(r.before.weeks[wk][d]) === dayFull((r.after.weeks[wk] || {})[d]);
        if (hist.includes(k)) { s2.trained++; if (!same) s2.trainedChanged++; }
        else if (w < curWk) { s2.untrPast++; if (!same) s2.untrPastRepaced++; }
        else if (w < cut) { s2.untrPierce++; if (!same) s2.untrPierceRepaced++; }
        else { s2.future++; if (!same) s2.futureRepaced++; }
      }
    }
  }
  say('    ' + s2.cfgs + ' programs. TRAINED changed ' + s2.trainedChanged + '/' + s2.trained +
      ' | untrained PAST (w<4) re-paced ' + s2.untrPastRepaced + '/' + s2.untrPast + ' (' + pct(s2.untrPastRepaced, s2.untrPast) + ')' +
      ' | untrained PIERCED (4<=w<7) re-paced ' + s2.untrPierceRepaced + '/' + s2.untrPierce + ' (' + pct(s2.untrPierceRepaced, s2.untrPierce) + ')' +
      ' | FUTURE (w>=7) re-paced ' + s2.futureRepaced + '/' + s2.future + ' (' + pct(s2.futureRepaced, s2.future) + ')');
}

// ════════════════════════════════════════════════════════════════════════════
// Q4 — THE CLAMP AND THE MAGNITUDE
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q4 CHART ROWS AND CLAMP ===');
const CHART = IA.PACE_CHART;
const lookup = IA.eval('paceChartLookup');
say('  PACE_CHART rows: ' + CHART.length + ', mile anchors ' + CHART[0].mile + 's (' + fmt(CHART[0].mile) + ') .. ' + CHART[CHART.length - 1].mile + 's (' + fmt(CHART[CHART.length - 1].mile) + ')');
say('  CLAMP fast end: any anchor <= ' + CHART[0].mile + 's returns row 0 verbatim (index.html:4577).');
say('  CLAMP slow end: any anchor >= ' + CHART[CHART.length - 1].mile + 's returns the last row verbatim (index.html:4578).');
function fmt(s) { return Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0'); }
const COLS = ['mile', 'fiveK', 'tenK', 'tempo', 'half', 'marathon', 'recovery'];
const probes = [630, 510, 480, 450, 420, 300, 290, 720, 900];
say('  anchor        ' + COLS.map(c => c.padStart(9)).join(''));
const rows = {};
for (const s of probes) { const r = lookup('mile', s); rows[s] = r; say('  ' + (fmt(s) + ' (' + s + 's)').padEnd(14) + COLS.map(c => fmt(r[c]).padStart(9)).join('')); }
say('');
say('  DELTA vs Mario\'s current 10:30 anchor (positive = the new row is FASTER by N sec/mi):');
say('  entered       ' + COLS.map(c => c.padStart(9)).join(''));
for (const s of [510, 480, 450, 420]) {
  say('  ' + (fmt(s) + ' mile').padEnd(14) + COLS.map(c => String(rows[630][c] - rows[s][c]).padStart(9)).join(''));
}
say('');
say('  Half-marathon finish implied by the chart half column x 13.1 mi:');
for (const s of [630, 510, 480, 450, 420]) {
  const t = rows[s].half * 13.1;
  say('    ' + fmt(s) + ' mile -> half AVG pace ' + fmt(rows[s].half) + '/mi -> finish ' + Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(Math.round(t % 60)).padStart(2, '0') + '   (halfBest col: ' + Math.floor(rows[s].halfBest / 3600) + ':' + String(Math.floor((rows[s].halfBest % 3600) / 60)).padStart(2, '0') + ':' + String(rows[s].halfBest % 60).padStart(2, '0') + ')');
}

// ════════════════════════════════════════════════════════════════════════════
// Q5 / Q6 — EVERY OTHER READER, live-cfg vs stored-snapshot
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q5/Q6 READERS ===');
const runAnchorInfo = IA.eval('runAnchorInfo');
const runAnchorSentence = IA.eval('runAnchorSentence');
const runAnchorLine = IA.eval('runAnchorLine');
const runAnchorChips = IA.eval('runAnchorChips');
say('  runAnchorInfo() reachable: ' + (typeof runAnchorInfo === 'function'));
let anchorNull = 0, anchorRows = 0, anchorMoved = 0;
for (const goalId of GOAL_IDS) for (const exp of EXPS) {
  const cA = mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, BEFORE);
  const cB = mkCfg(goalId, exp, 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, AFTER);
  const a = runAnchorInfo(cA), b = runAnchorInfo(cB);
  anchorRows++;
  if (!a) { anchorNull++; say('    runAnchorInfo NULL  ' + goalId.padEnd(15) + exp); continue; }
  if (a.anchorSec !== b.anchorSec) anchorMoved++;
  say('    ' + goalId.padEnd(15) + exp.padEnd(13) + 'anchor ' + fmt(a.anchorSec) + ' -> ' + fmt(b.anchorSec) + '  kind ' + a.kind + '->' + b.kind + '  clamped ' + a.clamped + '->' + b.clamped);
}
say('  runAnchorInfo: ' + anchorNull + '/' + anchorRows + ' (goal,exp) rows return null (no Run-paces card at all); ' + anchorMoved + '/' + anchorRows + ' move their anchor on the edit.');
say('');
say('  PROVENANCE sentences today (kind is decided ONLY by mileBestSrc.kind, never by when it was set):');
{
  const base = mkCfg('run_half', 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, 630);
  const variants = [
    ['src=entered  630', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestSrc = { kind: 'entered' }; return c; })()],
    ['src=entered  480', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestMins = '8'; c.cardioGoals.run.mileBestSecs = '0'; c.cardioGoals.run.mileBestSrc = { kind: 'entered' }; return c; })()],
    ['src=seeded   630', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestSrc = { kind: 'seeded', prog: 'THE BASE BLOCK', n: 7 }; return c; })()],
    ['src=seeded   480 (edited, src untouched)', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestMins = '8'; c.cardioGoals.run.mileBestSecs = '0'; c.cardioGoals.run.mileBestSrc = { kind: 'seeded', prog: 'THE BASE BLOCK', n: 7 }; return c; })()],
    ['src=null     480', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestMins = '8'; c.cardioGoals.run.mileBestSecs = '0'; delete c.cardioGoals.run.mileBestSrc; return c; })()],
    ['src=entered  240 (below chart)', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestMins = '4'; c.cardioGoals.run.mileBestSecs = '0'; c.cardioGoals.run.mileBestSrc = { kind: 'entered' }; return c; })()],
    ['src=entered  900 (above chart)', (() => { const c = JSON.parse(J(base)); c.cardioGoals.run.mileBestMins = '15'; c.cardioGoals.run.mileBestSecs = '0'; c.cardioGoals.run.mileBestSrc = { kind: 'entered' }; return c; })()],
    ['beginner     480', (() => { const c = JSON.parse(J(base)); c.experience = 'beginner'; c.cardioGoals.run.mileBestMins = '8'; c.cardioGoals.run.mileBestSecs = '0'; return c; })()],
  ];
  for (const [lbl, c] of variants) {
    const a = runAnchorInfo(c);
    say('    ' + lbl.padEnd(40) + (a ? runAnchorSentence(a).replace(/<[^>]+>/g, '') : 'NULL — no card'));
  }
  say('');
  say('  runAnchorLine (share/export text):');
  for (const [lbl, c] of variants.slice(0, 5)) { const a = runAnchorInfo(c); say('    ' + lbl.padEnd(40) + (a ? runAnchorLine(a) : 'NULL')); }
}

say('');
say('  PROJECTION CARD (index.html:15810-15812) reads live cfg with NO beginner gate and NO clamp:');
{
  const proj = IA.eval('buildProjectionCard');
  const halfFrom = IA.eval('_halfFromMileSec');
  for (const s of [630, 480, 240, 900]) {
    const h = halfFrom(s);
    say('    intakeMileSec ' + s + ' -> dashed "your ' + fmt(s) + ' mile" line at half ' + (h ? Math.floor(h / 3600) + ':' + String(Math.floor((h % 3600) / 60)).padStart(2, '0') + ':' + String(Math.round(h % 60)).padStart(2, '0') : 'null'));
  }
  const b = mkCfg('run_half', 'beginner', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, 480);
  const mg = b.cardioGoals.run;
  say('    beginner cfg with mileBest 8:00 -> projection card intakeMileSec = ' + ((+mg.mileBestMins || 0) * 60 + (+mg.mileBestSecs || 0)) + ' (engine ignores it, this card does not)');
  say('    footer string today: "The dashed line is the M:SS mile you entered at signup, read through the same table."');
}

say('');
say('  ANALYTICS anchored on the FROZEN snapshot (dose.tgt in ia_hist_), not live cfg:');
say('    recoveryPaceWeekly  index.html:14651  -> _recoveryPaceEntry -> hist[key].cardio.dose.tgt');
say('    easyVsPrescribed    index.html:15337  -> snap.cardio.dose.tgt (a run with no tgt is EXCLUDED, never guessed)');
say('    easyEffortWeekly    index.html:14893');
{
  // measure: after an edit, how many frozen snapshots still carry the OLD tgt while the
  // live rebuild carries the new one?
  const c = mkCfg('run_half', 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, BEFORE);
  freshStore();
  const p0 = IA.buildProgram(JSON.parse(J(c)));
  const touch = [], hist = [];
  for (let w = 1; w <= 3; w++) for (const d of Object.keys(p0.weeks[w] || {})) if (p0.weeks[w][d].cardio) { touch.push('w' + w + '_' + d); hist.push('w' + w + '_' + d); }
  const r = liveRefresh(c, AFTER, { touch, hist });
  let old = 0, tot = 0;
  for (let w = 1; w <= 3; w++) for (const d of Object.keys(r.after.weeks[w] || {})) {
    const day = r.after.weeks[w][d]; if (!day.cardio || !day.cardio.dose || !day.cardio.dose.tgt) continue;
    tot++;
    const b = r.before.weeks[w][d];
    if (b && b.cardio && b.cardio.dose && b.cardio.dose.tgt === day.cardio.dose.tgt) old++;
  }
  say('    after the edit, frozen run days still carrying the pre-edit dose.tgt: ' + old + '/' + tot);
  const w9 = r.after.weeks[9] || {}, w9b = r.before.weeks[9] || {};
  let newT = 0, totT = 0;
  for (const d of Object.keys(w9)) { const day = w9[d]; if (!day.cardio || !day.cardio.dose || !day.cardio.dose.tgt) continue; totT++; if (!w9b[d] || w9b[d].cardio.dose.tgt !== day.cardio.dose.tgt) newT++; }
  say('    week 9 (future) run days whose dose.tgt moved to the new anchor: ' + newT + '/' + totT);
}

say('');
say('  WIZARD-ONLY readers (read WD, never a stored cfg — a program-page pencil does not run them):');
say('    _mileEntryState      index.html:6564  (validation: <3:00 reject, >25:00 reject, <5:00 & >12:00 advisories)');
say('    assessRunPaceCeiling index.html:2372  (run_pace_goal feasibility banner)');
say('    updateMileAdvisory   index.html:6581');
say('    applySeedData        index.html:2585  (the ONLY writer of mileBestSrc.kind="seeded")');
{
  const st = IA.eval('_mileEntryState');
  const WD = IA.eval('WD');
  say('    _mileEntryState reachable: ' + (typeof st === 'function') + '; WD reachable: ' + (typeof WD === 'object'));
  if (typeof st === 'function' && WD) {
    const probes2 = [[3, 0], [4, 59], [5, 0], [8, 0], [10, 30], [12, 0], [12, 1], [25, 0], [25, 1], [0, 30]];
    WD.experience = 'intermediate'; WD.cardioGoals = { run: { id: 'run_half' } };
    for (const [mm, ss] of probes2) {
      WD.cardioGoals.run.mileBestMins = String(mm); WD.cardioGoals.run.mileBestSecs = String(ss);
      const r = st();
      say('      ' + (mm + ':' + String(ss).padStart(2, '0')).padEnd(8) + (r.ok ? 'OK  ' : 'REJECT ') + (r.msg || r.adv || ''));
    }
    WD.experience = 'beginner'; WD.cardioGoals.run.mileBestMins = '4'; WD.cardioGoals.run.mileBestSecs = '0';
    say('      beginner 4:00 -> ' + J(st()));
  }
}

// ── Q5b: the mid-program goal pencil that ALREADY ships (V145 D5) and the anchor ──
say('');
say('=== Q5b THE EXISTING MID-PROGRAM PENCIL (commitGoalChange, index.html:13583) ===');
say('  index.html:13590  const next={id,label,baseline:\'\'}   <- a REPLACEMENT object');
say('  index.html:13599  cfg.cardioGoals[sport]=next          <- not a merge');
{
  const base = mkCfg('run_half', 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, 630);
  const rai = IA.eval('runAnchorInfo');
  const before = rai(base);
  // exact transform commitGoalChange applies, transcribed from 13590-13599
  const next = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', baseline: '', targetMins: '10', targetSecs: '0', targetTime: '10:00', targetDist: '1.5', paceUnit: 'mi' };
  const after = JSON.parse(J(base));
  after.cardioGoals = Object.assign({}, after.cardioGoals, { run: next });
  const a2 = rai(after);
  say('  fields on cardioGoals.run BEFORE the goal change: ' + Object.keys(base.cardioGoals.run).join(', '));
  say('  fields AFTER  : ' + Object.keys(after.cardioGoals.run).join(', '));
  say('  dropped       : ' + Object.keys(base.cardioGoals.run).filter(k => !(k in next)).join(', '));
  say('  runAnchorInfo anchor ' + fmt(before.anchorSec) + ' (' + before.kind + ') -> ' + fmt(a2.anchorSec) + ' (' + a2.kind + ')');
  say('  sentence after : ' + runAnchorSentence(a2).replace(/<[^>]+>/g, ''));
  say('  cfg._raceDateCappedWeeks survives the goal change: ' + ('_raceDateCappedWeeks' in after));
  // how many NRC->NRC goal changes lose the anchor across the lattice
  let lost = 0, tot = 0;
  for (const g1 of GOAL_IDS) for (const g2 of GOAL_IDS) {
    if (g1 === g2) continue;
    const b = mkCfg(g1, 'intermediate', 'support_prevention', 'crossfit', ['sun', 'wed'], '18-35', 76308, 630);
    const nx = { id: g2, label: g2, baseline: '' };
    const af = JSON.parse(J(b)); af.cardioGoals.run = nx;
    tot++;
    const x = rai(b), y = rai(af);
    if (x && (!y || y.anchorSec !== x.anchorSec)) lost++;
  }
  say('  goal-change pairs where the mile anchor is lost: ' + lost + '/' + tot);
}

// ════════════════════════════════════════════════════════════════════════════
// Q7 — BEGINNER PATH
// ════════════════════════════════════════════════════════════════════════════
say('');
say('=== Q7 BEGINNER PATH ===');
{
  let bTot = 0, bChanged = 0, iTot = 0, iChanged = 0, aTot = 0, aChanged = 0;
  const per = {};
  for (const goalId of GOAL_IDS) {
    per[goalId] = { b: [0, 0], i: [0, 0], a: [0, 0] };
    for (const focus of FOCUS) for (const equip of EQUIP) for (const rest of REST) for (const age of AGES) for (const seed of SEEDS) {
      for (const exp of EXPS) {
        const cA = mkCfg(goalId, exp, focus, equip, rest, age, seed, BEFORE);
        const cB = mkCfg(goalId, exp, focus, equip, rest, age, seed, AFTER);
        const dA = weeksDigest(IA.buildProgram(cA)), dB = weeksDigest(IA.buildProgram(cB));
        const k = exp === 'beginner' ? 'b' : exp === 'intermediate' ? 'i' : 'a';
        per[goalId][k][1]++; if (dA !== dB) per[goalId][k][0]++;
        if (k === 'b') { bTot++; if (dA !== dB) bChanged++; }
        if (k === 'i') { iTot++; if (dA !== dB) iChanged++; }
        if (k === 'a') { aTot++; if (dA !== dB) aChanged++; }
      }
    }
  }
  say('  whole-program digest changed by a 630->480 edit:');
  say('    beginner     ' + bChanged + '/' + bTot + ' (' + pct(bChanged, bTot) + ')');
  say('    intermediate ' + iChanged + '/' + iTot + ' (' + pct(iChanged, iTot) + ')');
  say('    advanced     ' + aChanged + '/' + aTot + ' (' + pct(aChanged, aTot) + ')');
  say('  by goal (beginner | intermediate | advanced):');
  for (const g of GOAL_IDS) say('    ' + g.padEnd(15) + per[g].b[0] + '/' + per[g].b[1] + '   ' + per[g].i[0] + '/' + per[g].i[1] + '   ' + per[g].a[0] + '/' + per[g].a[1]);
  // and: does the pencil surface even exist for a beginner today (wizard hides the field)?
  say('  wizard hides the mile field entirely when experience === "beginner" (index.html:2806, 2827 template guards).');
}

say('');
say('=== END v196 ===');
