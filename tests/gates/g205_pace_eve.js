// g205_pace_eve.js — D127: the NSW pace family places pull and legs by the D36 cost table.
//
// THE RULING. run_pace_goal and its two V126 aliases place the hinge and the squat by the
// D36 cost table, with the NSW session types mapped onto the shape D36 already understands:
// INT and CHI are speed days, the legLoad LSD is the long run, the other LSD is the easy
// day, and FORBIDDEN = the long run and its eve. run_base and every other NSW goal keep the
// 48h rule. Before D127 the pace family never entered the placement at all (_nrcRunShape
// required c.isNRC), so on a 4-training-day week the 48h branch degraded to first-available
// order and put a leg role on the long-run eve in 1,980 of 6,336 measured weeks.
//
// ORACLES, all independent of the engine:
//   * P1 is the DOCTRINE row. "Hard days hard: the long run and its eve are off limits to
//     the hinge and the squat" is the ruled text; the long-run day is found BY CONTENT (a
//     run session carrying legLoad whose subtype is LSD), never by position, and the eve is
//     calendar arithmetic done in this file. It asserts zero, which is a claim about the
//     doctrine, not a diff against a previous artifact.
//   * P2 is the HAND TABLE. The D36 cost table is re-transcribed below from the ruling's
//     prose and applied to a shape this file derives itself from the built cardio. It then
//     requires the engine's placement to be COST-MINIMAL under that hand table. Minimality
//     rather than day equality, because the same-region pass is allowed to move a role to
//     an equal-cost day and a day-equality row would be asserting a tiebreak the ruling
//     does not own.
//   * P3 is the SCOPE row: the D36 note is the placement's signature. Present on all three
//     pace ids, absent on run_base and on bike/swim goals, which must still take the 48h
//     branch. Absence is what proves the shape stayed null for them.
//   * P4 is the COPY rule on the note Mario actually reads.
//   * P5 is the VACUITY guard. P1 asserts a zero, and a zero is worthless unless the
//     lattice contains weeks where the eve was a training day and both leg roles existed,
//     i.e. weeks where a hit was structurally possible. A gate that cannot be failed is not
//     a gate.
//   * P6 is the source census.
//
// VERSION PREDICATE (standing ruling 4). D127 ships on ia-version 205.
//   * at 205 and above the pace-family branch MUST exist; its absence is a named FAIL.
//   * below 205 WITH the branch present is the pre-bump working artifact mid-slice; rows RUN.
//   * below 205 WITHOUT it is an older build: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const SRC_RAW = fs.readFileSync(ART, 'utf8');
const SRC = SRC_RAW.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const VER = Number(IA.IA_VERSION);
const HAS = /_paceFam/.test(SRC);
if(VER >= 205){
  ok('P0 at ia-version ' + VER + ' the D127 pace-family branch exists in _nrcRunShape', HAS,
     'no _paceFam branch: D127 is not in this artifact');
  if(!HAS) summary(1);
} else if(!HAS){
  console.log('SKIP g205_pace_eve: ia-version ' + VER + ' predates D127 and carries no pace-family branch (NOT APPLICABLE)');
  summary(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D127 branch present: pre-bump working artifact, rows RUN');
}

// ── D103a (V208) ERA ROWS for the run builder's quality labels (standing ruling 4) ──
// The CHI and the INT were renamed Long Interval (LI) and Short Interval (SI) at V208 (coach,
// D103a slice 4a). Bike and swim keep CHI and INT, so no bike or swim matcher reads this table.
// An artifact no row covers fails the ERA row below, and its matchers match nothing, so every
// row that finds a card by label goes red with it.
// handShape, P2z, P6f, P6g and P6h read it. Both matchers anchor at the start of the subtype and
// admit the ' — Taper' suffix. The first row opens at 204, the pre-bump artifact the predicate
// above lets run.
const RUN_LABEL_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'pre-D103a',    int: /^Interval \(INT\)/,      chi: /^Continuous High Intensity \(CHI\)/ },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0]
  || { ruling: 'NO ROW', int: /(?!)/, chi: /(?!)/ };
ok('P-ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run quality labels have no ruled text at this version, so every row that finds a card by label is void');

// ── the calendar, written here, not read from the engine ────────────────────────
const ISO = ['mon','tue','wed','thu','fri','sat','sun'];
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const prevOf = d => ISO[(ISO.indexOf(d) + 6) % 7];
const nextOf = d => ISO[(ISO.indexOf(d) + 1) % 7];
const gap = (a, b) => { const r = Math.abs(ISO.indexOf(a) - ISO.indexOf(b)); return Math.min(r, 7 - r); };

// role label -> role. Both label sets, so the gate does not depend on cfg.goal.
const ROLE_OF = {
  'Posterior Chain':'pull', 'Pull':'pull',
  'Leg Strength + Mobility':'legs', 'Legs':'legs',
  'Strength Support':'push', 'Push':'push',
  'Recovery Lift':'push_light', 'Push (light)':'push_light',
  'Full Body Support':'full', 'Full Body':'full',
  'Active Recovery':'active'
};

// ── the D36 cost table, hand-transcribed from the ruling's prose ────────────────
//   forbidden (the long run and its eve) ......... Infinity, both roles
//   pull : clean 0 | speed same day 0.5 | easy run same day 1 | day after speed 1
//          | day before speed 2 | day after long 2
//   legs : clean 0 | day after speed 1 | easy run same day 1 | speed same day 1.5
//          | day before speed 2 | day after long 2
// Additive: a day that is both the day after a speed session and the day before another
// carries both terms. "Clean" is a lift-only day.
function handCost(shape, role, d){
  if(shape.forbidden.has(d)) return Infinity;
  let c = 0;
  if(shape.speed.has(d)) c += (role === 'pull' ? 0.5 : 1.5);
  if(shape.easy.has(d)) c += 1;
  if(shape.speed.has(prevOf(d))) c += 1;
  if(shape.speed.has(nextOf(d))) c += 2;
  if(d === shape.after) c += 2;
  return c;
}
// the shape, derived here from the BUILT cardio by content
function handShape(week){
  let long = null; const speed = new Set(), easy = new Set();
  DAYS.forEach(d => {
    const day = week[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const st = c.subtype || '';
      if(LBL.int.test(st) || LBL.chi.test(st)) speed.add(d);
      else if(/^Long Slow Distance \(LSD\)/.test(st)){ if(c.legLoad) long = d; else easy.add(d); }
    });
  });
  if(!long) return null;
  const eve = prevOf(long);
  return { long, eve, after: nextOf(long), speed, easy, forbidden: new Set([long, eve]) };
}

function combos(arr, k){
  if(k === 0) return [[]];
  if(arr.length < k) return [];
  const [h, ...t] = arr;
  return combos(t, k - 1).map(c => [h, ...c]).concat(combos(t, k));
}
function paceCfg(rest, seed, goalId){
  return { name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id: goalId || 'run_pace_goal', label:'Pace', targetDist:'1.5',
      targetMins:'10', targetSecs:'0', mileBestMins:'8', mileBestSecs:'30',
      baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}

// ── build the lattice once; P1, P2 and P5 all read it ───────────────────────────
const SEEDS = [1001, 2002];
const byDays = {}; let eveHits = 0, dayHits = 0, weeks = 0;
const eveDetail = [];
let costRows = 0, costBad = 0; const costDetail = [];
let couldHaveHit = 0;
let shaped = 0, speedless = 0;

[3, 2, 1, 0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
  const nTrain = 7 - nRest;
  byDays[nTrain] = byDays[nTrain] || { weeks:0, eve:0, day:0 };
  SEEDS.forEach(seed => {
    const prog = IA.buildProgram(paceCfg(rest, seed));
    Object.keys(prog.weeks).forEach(wk => {
      const w = prog.weeks[wk];
      const sh = handShape(w);
      weeks++; byDays[nTrain].weeks++;
      if(!sh) return;
      shaped++; if(!sh.speed.size) speedless++;
      const roleAt = d => ROLE_OF[(w[d] && w[d].title) || ''] || null;
      const leg = d => roleAt(d) === 'pull' || roleAt(d) === 'legs';
      const train = DAYS.filter(d => w[d] && !w[d].rest);
      if(train.includes(sh.eve) && train.some(d => roleAt(d) === 'pull') && train.some(d => roleAt(d) === 'legs')) couldHaveHit++;
      if(leg(sh.eve)){ eveHits++; byDays[nTrain].eve++;
        if(eveDetail.length < 5) eveDetail.push(`${nTrain}d rest=[${rest}] seed=${seed} W${wk} long=${sh.long} eve=${sh.eve} carries ${roleAt(sh.eve)}`); }
      if(leg(sh.long)){ dayHits++; byDays[nTrain].day++; }

      // P2 on week 1 only: one placement decision per program, checked once.
      if(wk !== '1') return;
      const pullD = train.find(d => roleAt(d) === 'pull');
      const legsD = train.find(d => roleAt(d) === 'legs');
      if(!pullD && !legsD) return;
      let got = 0, best = Infinity;
      if(pullD && legsD){
        got = handCost(sh, 'pull', pullD) + handCost(sh, 'legs', legsD);
        train.forEach(p => train.forEach(l => { if(p === l) return;
          const c = handCost(sh, 'pull', p) + handCost(sh, 'legs', l); if(c < best) best = c; }));
      } else {
        const r = pullD ? 'pull' : 'legs', d0 = pullD || legsD;
        got = handCost(sh, r, d0);
        train.forEach(d => { const c = handCost(sh, r, d); if(c < best) best = c; });
      }
      if(!isFinite(best)) return;      // layout too tight: the ruling hands it back to the 48h rule
      costRows++;
      if(got !== best){ costBad++;
        if(costDetail.length < 5) costDetail.push(`${nTrain}d rest=[${rest}] seed=${seed} pull=${pullD} legs=${legsD} hand cost ${got} against the minimum ${best}`); }
    });
  });
}));

console.log('lattice: ' + weeks + ' weeks over ' + (64 * SEEDS.length) + ' pace-goal programs');
[4, 5, 6, 7].forEach(n => {
  const b = byDays[n];
  ok('P1' + n + ' at ' + n + ' training days no leg role lands on the long-run eve (' + b.weeks + ' weeks)',
     b.eve === 0, b.eve + ' eve hits');
});
ok('P1e no leg role lands on the long-run DAY either, at any day count', dayHits === 0, dayHits + ' hits');
if(eveDetail.length) eveDetail.forEach(x => console.log('     ' + x));

ok('P2 every pace-family placement is cost-minimal under the hand-transcribed D36 table (' + costRows + ' placements)',
   costRows > 0 && costBad === 0, costBad + ' of ' + costRows + ' off the minimum');
if(costDetail.length) costDetail.forEach(x => console.log('     ' + x));
// P2z the vacuity guard for the hand shape (D103a slice 4d). P2's speed terms exist only if
// handShape can SEE a speed session. Under the V208 rename the old label regex saw none, the
// shape went speedless, and P2 still passed. Every shaped pace week carries INT and CHI (1408 of
// 1408 on V207), so a shaped week with no speed day means the matcher is blind.
ok('P2z the hand shape (' + LBL.ruling + ') sees a speed session in every one of the ' + shaped + ' shaped weeks, so P2 prices real speed days',
   shaped > 0 && speedless === 0, speedless + ' of ' + shaped + ' shaped weeks with no speed day');

// ── P3 the scope row ────────────────────────────────────────────────────────────
const D36 = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
const carries = cfg => { const p = IA.buildProgram(cfg); return !!(p.legRecoveryNote && p.legRecoveryNote.indexOf(D36) >= 0); };
['run_pace_goal', 'run_mile_time', 'run_15_under10'].forEach(id => {
  ok('P3a ' + id + ' takes the D36 cost table', carries(paceCfg(['sun','wed'], 1001, id)));
});
// P3b ERA ROWS (standing ruling 4). D104a (V208) moved run_base onto the run shape: at 208 and
// above a program with a long-keyed run in any week prints coach's run_base note, and only a program
// with no long-keyed run reaches the 48h branch. Both strings typed here from the rulings.
const D104A_BASE = 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.';
const TIER48_OPEN = ['Your training days are tightly packed', 'Your heavy lifting was kept off the same day as your hardest runs', 'Your heavy lifting was spaced out from your hardest runs'];
const P3B_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'D127 (V205)' },
  { from: 208, to: Infinity, ruling: 'D104a (V208)' },
];
const P3B = P3B_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0] || null;
let baseSeen = 0, baseTot = 0, baseLong = 0, baseShaped = 0, base48 = 0; const baseBad = [];
[3, 2].forEach(nRest => combos(DAYS, nRest).forEach(rest => SEEDS.forEach(seed => {
  const c = paceCfg(rest, seed);
  c.cardioGoals = { run:{ id:'run_base', label:'Base', baselineDist:'3', baseline:'3mi', mileBestMins:'8', mileBestSecs:'30' } };
  baseTot++;
  const p = IA.buildProgram(c), n = p.legRecoveryNote;
  if(n && n.indexOf(D36) >= 0) baseSeen++;
  const hasLong = Object.keys(p.weeks).some(w => DAYS.some(d => { const x = p.weeks[w][d];
    return !!x && [].concat(x.cardio || []).some(k => !!k && k.type === 'run' && !!k.dose && k.dose.key === 'long'); }));
  const via48 = n == null || TIER48_OPEN.some(t => n.startsWith(t));
  const viaShape = typeof n === 'string' && (n === D104A_BASE || n.startsWith(D104A_BASE + ' '));
  if(hasLong){ baseLong++; if(viaShape) baseShaped++; else baseBad.push('rest=[' + rest + '] seed=' + seed + ' long-keyed, note ' + JSON.stringify(n)); }
  else { if(via48) base48++; else baseBad.push('rest=[' + rest + '] seed=' + seed + ' no long key, note ' + JSON.stringify(n)); }
})));
if(!P3B) ok('P3b-ERA a P3B_BY_VERSION row covers ia-version ' + VER, false, 'no ruled P3b text at this version');
else if(P3B.to === 207) ok('P3b run_base keeps the 48h branch on every layout (' + baseTot + ' programs)', baseSeen === 0, baseSeen + ' carried the D36 note');
else {
  ok('P3b run_base places by the run shape (D104a); the 48h branch is reached only by a program with no long-keyed run in any week.',
     baseLong > 0 && baseSeen === 0 && baseBad.length === 0, baseBad.length + ' off the ruling, D36 note ' + baseSeen + ', long-keyed ' + baseLong + ': ' + baseBad.slice(0, 3).join('; '));
  console.log('     P3b ' + baseTot + ' run_base programs: ' + baseLong + ' with a long-keyed run (' + baseShaped + ' placed by the shape), '
    + (baseTot - baseLong) + ' without (' + base48 + ' on the 48h branch); D36 note ' + baseSeen);
}
const bike = paceCfg(['sun','wed'], 1001);
bike.cardioTypes = ['bike']; bike.cardioGoals = { bike:{ id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' } };
ok('P3c a bike goal never produces a run shape: its LSD and CHI cards are not run sessions', !carries(bike));
const swim = paceCfg(['sun','wed'], 1001);
swim.cardioTypes = ['swim']; swim.cardioGoals = { swim:{ id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000yd' } };
ok('P3d a swim goal never produces a run shape', !carries(swim));

// ── P4 the copy rule ────────────────────────────────────────────────────────────
const noteOut = IA.buildProgram(paceCfg(['sun','wed'], 76308)).legRecoveryNote || '';
ok('P4a the pace family prints the ruled note verbatim', noteOut.indexOf(D36) >= 0, JSON.stringify(noteOut));
// P-RECOVBANNER §5 (standing ruling 2): P4b/P4c are copy rules on a note Mario READS, so they are licensed by a
// SOURCE predicate, not a version number. The week view shows the note only while the comment-stripped source
// (SRC above) still reads activeProg.legRecoveryNote; once the banner is gone the string is an engine trace (the
// placement's branch marker, standing ruling 3) and P4b/P4c SKIP by name. P4a keeps running either way.
const ON_SCREEN = /activeProg\.legRecoveryNote/.test(SRC);
if(ON_SCREEN){
  ok('P4b no mid-sentence hyphen or em-dash in the note Mario reads', !/\S\s*[–—]\s*\S/.test(D36) && !/[a-z] - [a-z]/.test(D36), JSON.stringify(D36));
  ok('P4c the note is short declarative sentences, no user-facing brand', !/Nike/i.test(D36) && D36.split('.').filter(s => s.trim()).length >= 2);
} else { skip += 2; console.log('SKIP P4b/P4c: the note left the week view (P-RECOVBANNER); the string is an engine trace'); }

// ── P5 the vacuity guard ────────────────────────────────────────────────────────
ok('P5 the lattice contains weeks where the eve was a training day and both leg roles existed, so P1 could have failed',
   couldHaveHit > 200, couldHaveHit + ' such weeks');

// ── P6 the source census ────────────────────────────────────────────────────────
ok('P6a the pace-family predicate is declared exactly once', (SRC.match(/_paceFam\s*=/g) || []).length === 1);
ok('P6b it names run_pace_goal and both V126 aliases', /_paceFam\s*=\s*g\s*=>[^;]*run_pace_goal[^;]*run_mile_time[^;]*run_15_under10/.test(SRC));
const nrcFlagSites = (SRC.match(/isNRC\s*:\s*true/g) || []).length;
ok('P6c isNRC is set in exactly one place and is NOT faked onto an NSW session', nrcFlagSites === 1,
   nrcFlagSites + ' sites set isNRC:true; only buildNRCSession may');
// P6e D127 rules that INT and CHI are both speed days, and the placement reads WEEK 1 only
// (deconflictLegLiftDays takes cardioSchedule[1]). THIS ROW USED TO BE A SOURCE PIN GUARDED
// BY A REACHABILITY TRIPWIRE: at a three-run pace ceiling week 1 always carried INT and the
// compressed quality slot only became CHI around week 7, so the CHI arm never fired at
// placement time and P6f below said so and said what to do when that changed.
// V205 (D125 amended, slice 6) IS THAT CHANGE. The pace ceiling went to four, and NSW's
// four-day row is easy / INT / CHI / long, so week 1 now carries a real CHI session and the
// arm is live. P6f is rewritten below as the behavioural row its own note prescribed. The
// source pin stays as well, because the mapping is still the thing being claimed.
ok('P6e both INT and CHI are named in the pace-family speed arm',
   /Interval \\\(INT\\\)[^\n]*Continuous High Intensity \\\(CHI\\\)[^\n]*speed\.add/.test(SRC),
   'the speed arm no longer names both INT and CHI');
let chiWk1 = 0;
[['sun','wed'], ['sun'], ['sun','wed','fri']].forEach(rest => [1001, 2002, 3003].forEach(seed => {
  const w = IA.buildProgram(paceCfg(rest, seed)).weeks['1'];
  DAYS.forEach(d => { const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => { if(c.type === 'run' && LBL.chi.test(c.subtype||'')) chiWk1++; }); });
}));
// P6f, BEHAVIOURAL (V205, D125 amended). The CHI arm must be REACHED, and then it must be
// treated as a speed day. Oracle is the D36/D127 doctrine text, not the engine: the hinge
// day rides a speed session, and a CHI session is a speed session. So on a four-run pace
// week the hinge day may sit on CHI, and wherever the hinge lands on a run at all that run
// must be INT or CHI — never the easy run and never the long run.
ok('P6f the CHI arm is now REACHED in week 1 (the D125 four-run ceiling put CHI there)',
   chiWk1 > 0, chiWk1 + ' week-1 CHI sessions — if this is 0 the row below is vacuous');
let hingeOnRun = 0, hingeOnSlow = 0, hingeOnChi = 0;
[['sun','wed'], ['sun'], ['sun','wed','fri']].forEach(rest => [1001, 2002, 3003].forEach(seed => {
  const w = IA.buildProgram(paceCfg(rest, seed)).weeks['1'];
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    if((day.title || '') !== 'Posterior Chain') return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const s = String(c.subtype || '');
      hingeOnRun++;
      if(LBL.chi.test(s)) hingeOnChi++;
      else if(!LBL.int.test(s)) hingeOnSlow++;
    });
  });
}));
ok('P6g every hinge day that carries a run carries a SPEED run, INT or CHI, never easy and never long (' + hingeOnRun + ' hinge run days)',
   hingeOnRun > 0 && hingeOnSlow === 0, hingeOnSlow + ' hinge days on a slow run');
ok('P6h and the CHI arm is exercised by the hinge placement itself, not merely present in week 1',
   hingeOnChi > 0, hingeOnChi + ' hinge days on CHI');

ok('P6d _nrcRunShape is still the single producer read by both the placement and the region guard',
   (SRC.match(/_nrcRunShape\s*\(/g) || []).length === 3, String((SRC.match(/_nrcRunShape\s*\(/g) || []).length));

summary(fail ? 1 : 0);
