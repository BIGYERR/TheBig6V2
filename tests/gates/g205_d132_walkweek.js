// g205_d132_walkweek.js — D132. THE FOURTH RUN IS GRANTED TO A WEEK THAT CARRIES QUALITY.
//
// THE RULING. D125 raised the solo-run pace ceiling from 3 to 4 on the strength of the
// guide's four-session week: two LSDs, an SI and an LI. On a `noimpact` or
// `noimpact_swim` week with no bike or swim to fall back on, the injury sweep rewrites
// every run to a pain-free incline walk. There is no SI, no LI, no long run and no shape
// to protect, so the fourth session is a fourth walk and D125's argument does not reach
// it. On those weeks the ceiling is 3.
//
// THE ASYMMETRY IS DELIBERATE, AND THIS FILE IS THE REASON IT IS SAFE.
// The CODE keys on the CAUSE. It has to: the ceiling is decided before the sweep runs, so
// "this week will be speedless" is not knowable at the decision point, while cardioMode
// is. Coach accepted the standing objection that keying on a cause lets two
// identical-looking weeks carry different run counts. THIS GATE IS THE ANSWER. It asserts
// the property of the WEEK and never reads cardioMode, never reads the ceiling, and is
// not a mirror of the predicate:
//
//     NO PACE WEEK CARRYING FOUR CARDIO SESSIONS IS WITHOUT AN INT CARD AND A CHI CARD.
//
// If cause and effect ever diverge — a new cardioMode that walks the runs, a sweep that
// starts walking on a mode the ceiling does not name, a reordering that decides the
// ceiling after the sweep — the fourth session appears on a week with no quality in it
// and W2 fails BY NAME. It cannot ship quietly. That is the whole point of writing the
// claim on the week instead of on the key.
//
// ORACLES, every one independent of the engine's own answer:
//   * W1 reads the SOURCE, not the engine: the predicate exists and names both modes.
//   * W2 is the RULING'S PROSE, quoted above, evaluated on built weeks by CONTENT. The
//     card is identified by its NSW subtype text, which is doctrine, not engine state.
//     From ia-version 208 (D103a) a RUN card is read by its dose.key and E1 holds its NSW
//     name to that key; bike and swim cards keep their names. See ERA ROWS below.
//   * W3 is the RULING'S AFTER-GRID typed in as literals: on the pace family a walking
//     week carries exactly three cardio sessions and a quality-carrying week exactly four,
//     uniformly, across all 64 rest-day calendars and both seeds.
//   * W4 is CONFINEMENT, and it is a comparison between two DIFFERENT configurations, not
//     an engine self-comparison: run_half, run_base and the two multi-sport pace weeks
//     must deal the SAME per-week cardio tally under a protected knee and a protected low
//     back as they do healthy. run_half is not in PACE_GOALS, run_base is not in
//     PACE_GOALS, and a multi-sport week was already held at 3 by D125's consumer clause,
//     so all three are out of D132's scope and a leak shows up here.
//   * W5 and W6 are MARIO, hand-written from the ruling: his healthy row is unchanged, and
//     the same calendar with a protected knee is a three-walk week with no quality card.
//
// VERSION PREDICATE (standing ruling 4). D132 ships on ia-version 205, the same number
// D125 ships on; it is an amendment to D125's ceiling inside one release.
//   * at 205 and above the D132 predicate MUST exist; its absence is a named FAIL, which
//     is exactly what a V205 artifact built before this slice reports.
//   * below 205 D125's four-run ceiling does not exist either, so there is no ceiling for
//     D132 to lower: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const FLAT = SRC.replace(/\s+/g, ' ');

let pass = 0, fail = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const VER = Number(IA.IA_VERSION);
// The predicate, read out of the source. Both modes must be named and the guard must be
// joined to the pace family, or the claim below is being met by accident.
const HAS_MODES = /_walkOnly\s*=\s*\(\s*cardioMode\s*===\s*'noimpact'\s*\|\|\s*cardioMode\s*===\s*'noimpact_swim'\s*\)/.test(FLAT);
const HAS_JOIN  = /PACE_GOALS\.has\(goalId\)\s*&&\s*\(\s*cardioTypes\.length\s*!==\s*1\s*\|\|\s*_walkOnly\s*\)/.test(FLAT);
const HAS_PARAM = /function sportDayTargets\(cardioTypes, cardioGoals, totalDays, liftGoal, cardioMode\)/.test(FLAT);
const HAS = HAS_MODES && HAS_JOIN && HAS_PARAM;
if(VER >= 205){
  ok('W0 at ia-version ' + VER + ' the D132 walking-week ceiling predicate exists', HAS,
     'modes ' + HAS_MODES + ', pace join ' + HAS_JOIN + ', cardioMode param ' + HAS_PARAM);
  if(!HAS) summary(1);
} else if(!HAS){
  console.log('SKIP g205_d132_walkweek: ia-version ' + VER + ' predates D125\'s four-run pace ceiling, so there is nothing for D132 to lower (NOT APPLICABLE)');
  summary(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D132 predicate present: pre-bump working artifact, rows RUN');
}

// ── ERA ROWS: how a run card names its quality session (standing ruling 4) ───────────
// Keyed to the RULING, D103a, which ships on ia-version 208, not to the version this gate
// shipped on. Through 207 the two NSW quality runs are named "Interval (INT)" and
// "Continuous High Intensity (CHI)" and carry no key, so a card is read by its name.
// From 208 the same two cards are named "Short Interval (SI)" and "Long Interval (LI)" and
// every NSW run card carries dose.key; a card is read by its key (int / chi), and E1
// requires its NSW name to agree with that key on every run card read, so every claim
// below is still about the named card the athlete sees. D103a moved words, not days: no
// expectation in this file changes with the era. A version with no row is a named FAIL.
const RUN_CARD_ERAS = [
  { hi: 207, name: { int: /Interval \(INT\)/, chi: /Continuous High Intensity \(CHI\)/ }, key: null },
  { lo: 208, name: { int: /Short Interval \(SI\)/, chi: /Long Interval \(LI\)/ }, key: { int: 'int', chi: 'chi' } }
];
const CARD_ROWS = RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi));
if(CARD_ROWS.length !== 1){
  ok('E0 ia-version ' + VER + ' reads its run cards through exactly one era row', false, CARD_ROWS.length + ' rows match');
  summary(1);
}
const CARD = CARD_ROWS[0];
console.log('NOTE run cards read through the ' + (CARD.key ? '208+ row (D103a names, dose.key)' : '207- row (INT / CHI names)'));
let cardsRead = 0, cardSplit = 0; const cardSplitAt = [];
function runQuality(c){
  const s = String(c.subtype || '');
  const byName = CARD.name.int.test(s) ? 'int' : CARD.name.chi.test(s) ? 'chi' : null;
  if(!CARD.key) return byName;
  const k = c.dose && c.dose.key;
  const byKey = k === CARD.key.int ? 'int' : k === CARD.key.chi ? 'chi' : null;
  cardsRead++;
  if(byKey !== byName){ cardSplit++; if(cardSplitAt.length < 4) cardSplitAt.push(s + ' key=' + k); }
  return byKey;
}

// Bike and swim cards were not renamed by D103a and carry no key; they keep the
// names they have always had, in every era.
const BIKE_SWIM_CARD = { int: /Interval \(INT\)/, chi: /Continuous High Intensity \(CHI\)/ };

// ── the calendar, the doctrine and the lattice, all written here ──────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
function combos(arr, k){
  if(k === 0) return [[]];
  if(arr.length < k) return [];
  const [h, ...t] = arr;
  return combos(t, k-1).map(c => [h, ...c]).concat(combos(t, k));
}
// The four injury states the lattice carries, and the cardioMode each one produces. The
// modes are written here from the ruling's population statement, NOT read from the
// engine: {lowback, knee} / protect are the walking pair, healthy and shoulder / protect
// are the pair that keeps its quality (shoulder / protect swims out, it does not walk).
const INJ = [
  { k:'healthy',          v:null,                                   walks:false },
  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' },   walks:false },
  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' },   walks:true  },
  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' },   walks:true  }
];
const SEEDS = [1013, 3039];

function paceCfg(rest, seed, inj, types, goalId){
  const T = types || ['run'];
  const cg = {};
  T.forEach(t => cg[t] = t === 'run'
    ? { id: goalId || 'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'11', targetSecs:'0',
        mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' }
    : { id: t === 'bike' ? 'bike_base' : 'swim_base', label:'Base' });
  const isRace = /half|marathon|5k|10k/.test(goalId || '');
  return { name:'P', primaryPath: isRace ? 'event' : 'cardio', cardioTypes: T.slice(), cardioGoals: cg,
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus:'balanced', experience:'advanced', ageBracket:'18-35',
    equipment:'crossfit', unit:'lbs', restDays: rest.slice(), days: DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed,
    ...(inj ? { injury:{ region: inj.region, tier: inj.tier } } : {}) };
}
// Read a built week's CARDIO by content. The NSW card names are doctrine text: an
// Interval card says "Interval (INT)" and a continuous high-intensity card says
// "Continuous High Intensity (CHI)". A walking week says neither. From 208 the run cards
// say "Short Interval (SI)" and "Long Interval (LI)" and are read through the era row.
function scanWeek(w){
  let n = 0, hasInt = false, hasChi = false;
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      n++;
      const s = String(c.subtype || '');
      const q = c.type === 'run' ? runQuality(c)
              : BIKE_SWIM_CARD.int.test(s) ? 'int' : BIKE_SWIM_CARD.chi.test(s) ? 'chi' : null;
      if(q === 'int') hasInt = true;
      if(q === 'chi') hasChi = true;
    });
  });
  return { n, hasInt, hasChi };
}
function runLayout(w){
  const lay = {};
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const s = String(c.subtype || '');
      const q = runQuality(c);
      if(q) lay[d] = q;
      else if(/Long Slow Distance \(LSD\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';
      else lay[d] = 'other';
    });
  });
  return lay;
}

// ── W1 the predicate, from the source ────────────────────────────────────────────────
ok('W1 the D132 key names BOTH walking modes and is joined to the solo pace family', HAS,
   'modes ' + HAS_MODES + ', join ' + HAS_JOIN);

// ── W2 THE PROPERTY OF THE WEEK — the ruling's prose, never the ruling's key ──────────
// ── W3 the after-grid, typed ─────────────────────────────────────────────────────────
const tally = {};            // injury key -> { count -> weeks }
const violations = [];       // four-session pace weeks with no quality card
let weeksSeen = 0, progsSeen = 0;
INJ.forEach(i => { tally[i.k] = {}; });
[3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
  INJ.forEach(i => SEEDS.forEach(seed => {
    const prog = IA.buildProgram(paceCfg(rest, seed, i.v));
    progsSeen++;
    Object.keys(prog.weeks).forEach(wk => {
      const s = scanWeek(prog.weeks[wk]);
      weeksSeen++;
      tally[i.k][s.n] = (tally[i.k][s.n] || 0) + 1;
      // THE CLAIM. It does not ask what the injury was, what cardioMode is, or what the
      // ceiling said. It asks the week.
      if(s.n >= 4 && !(s.hasInt && s.hasChi))
        violations.push((rest.join('+') || 'none') + '/' + i.k + '/seed' + seed + '/w' + wk +
                        ' has ' + s.n + ' cardio sessions, INT=' + s.hasInt + ' CHI=' + s.hasChi);
    });
  }));
}));
ok('W2 no pace week carrying four cardio sessions is without an INT card and a CHI card (' +
   weeksSeen + ' weeks over 64 calendars x 4 injury states x 2 seeds)',
   violations.length === 0, violations.slice(0, 3).join(' | ') + (violations.length > 3 ? ' (+' + (violations.length - 3) + ' more)' : ''));
// Liveness: the sweep is 64 calendars x 4 injury states x 2 seeds. A structural literal,
// so a sweep that silently stopped enumerating cannot report zero violations and pass.
ok('W2b the sweep actually enumerated 512 pace programs', progsSeen === 512, progsSeen);

INJ.forEach(i => {
  const want = i.walks ? '3' : '4';
  const keys = Object.keys(tally[i.k]);
  ok('W3 ' + i.k + ': every pace week carries exactly ' + want + ' cardio sessions' +
     (i.walks ? ' (the walking week keeps three)' : ' (the quality week keeps its fourth run)'),
     keys.length === 1 && keys[0] === want, JSON.stringify(tally[i.k]));
});

// ── W4 confinement: the out-of-scope paths do not move with the injury ───────────────
// Each row builds the SAME goal under healthy, a protected knee (noimpact) and a
// protected low back (noimpact_swim) and requires an identical per-week cardio tally.
// D132 must be invisible here: run_half and run_base are not in PACE_GOALS, and a
// multi-sport pace week was already held at three by D125's own consumer clause.
const OUT_OF_SCOPE = [
  { name:'run_half (NRC, not in PACE_GOALS)', goal:'run_half', types:['run'] },
  { name:'run_base (NSW, not in PACE_GOALS)', goal:'run_base', types:['run'] },
  { name:'run+bike pace (multi-sport, already held at 3)', goal:'run_pace_goal', types:['run','bike'] },
  { name:'run+swim pace (multi-sport, already held at 3)', goal:'run_pace_goal', types:['run','swim'] }
];
const OOS_INJ = INJ.filter(i => i.k !== 'shoulder/protect');
OUT_OF_SCOPE.forEach(row => {
  const sig = {};
  OOS_INJ.forEach(i => {
    const parts = [];
    [3,1].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
      const prog = IA.buildProgram(paceCfg(rest, 1013, i.v, row.types, row.goal));
      Object.keys(prog.weeks).sort().forEach(wk => parts.push(scanWeek(prog.weeks[wk]).n));
    }));
    sig[i.k] = parts.join('');
  });
  const base = sig['healthy'];
  const same = OOS_INJ.every(i => sig[i.k] === base);
  ok('W4 ' + row.name + ' deals the same per-week cardio tally healthy, knee/protect and lowback/protect',
     same, OOS_INJ.map(i => i.k + '=' + sig[i.k].slice(0, 24)).join(' '));
});

// ── W5 / W6 Mario, hand-written from the ruling ──────────────────────────────────────
{
  const prog = IA.buildProgram(paceCfg(['sun','wed'], 76308, null));
  const lay = runLayout(prog.weeks['1']);
  const got = DAYS.filter(d => lay[d]).map(d => d + ':' + lay[d]).join(' ');
  ok('W5 Mario (healthy, rest sun+wed) is untouched: MON int / THU chi / FRI easy / SAT long',
     got === 'mon:int thu:chi fri:lsd_easy sat:lsd_long', got);
}
{
  const prog = IA.buildProgram(paceCfg(['sun','wed'], 76308, { region:'knee', tier:'protect' }));
  const s = scanWeek(prog.weeks['1']);
  ok('W6 Mario on a protected knee gets three cardio sessions, not a fourth walk',
     s.n === 3, s.n + ' sessions');
  ok('W6b and that week carries no INT card and no CHI card, which is why the fourth was withheld',
     !s.hasInt && !s.hasChi, 'INT=' + s.hasInt + ' CHI=' + s.hasChi);
}

// ── E1 the 208+ row reads the key, and the key must say what the name says ──────────
if(CARD.key) ok('E1 every run card read at ia-version ' + VER + ' names the same quality session in its NSW name and its dose.key (' + cardsRead + ' run cards)',
  cardsRead > 0 && cardSplit === 0, cardSplit + ' disagree: ' + cardSplitAt.join(' | '));
summary(fail ? 1 : 0);
