// g209_d140_tier.js — GATE for D140 (coach-ruled, Mario concurred): THE RUN IS THE DAY on NSW
// long runs as well as NRC, with the tier B corrections the NSW limb exposed (F1, F2, carry item).
//
//   node tests/gates/g209_d140_tier.js [candidate] [baseline V208]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   A long run is an NRC "Long Run" card (race day and time trial excluded, the dress rehearsal
//   always A) or, from D140, an NSW run card keyed dose.key 'long'. Minutes come from the
//   session's own dose: time -> mins, otherwise mi x tgt / 60. >= 75 is A, 45 to 75 is B, < 45 C.
//   A  post-run mobility only (taper notes may ride along), titled Post-Run Mobility.
//   B  upper and trunk: no hinge, leg or plyo item, no power or explosive section (the core
//      section's coreHeader included: a Rotational Power pillar goes whole), and at most 8
//      working sets COUNTED THE DOCTRINE WAY ("3×10" is 3, "3 sets — RPE 7" is 3, else 1;
//      stretches are free).
//   Every tier: no carry item anywhere on the day, whatever section it rides (the empty-label
//   core section included).
//   C  carries out; the day otherwise exactly what V208 dealt. Non-long days: exactly V208.
//
// ORACLES, independent of the engine. _longRunTier is never called and nothing is imported:
//   * the tier is dose arithmetic typed here from the ruling text;
//   * the hinge / leg / plyo vocabulary is the D18 ruling list typed here;
//   * the set counter is the doctrine count typed here. The pre-D140 engine counter read
//     "3 sets — RPE 7" as one set; this oracle never agrees with that;
//   * T0, T1, T2 are the ruling's before/after grid for the stand-in, typed as literals;
//   * K1 is measure's carry case, typed as a literal (W6 Fri, 4 mi at 14:06, 56.4 min);
//   * M1 is HALF_MANNY's digest against its era row MANNY_DIGEST_BY_VERSION[ia-version] (the row must
//     exist). Measure printed it unmoved by D140 on all three arms; from V231 the era table, not a
//     typed literal, carries that claim (absorb ruling section 4).
//   * C2, N1 and L1 compare against the V208 artifact (argv[3]). V208 is the thing D140 must
//     not move outside the long-run days; it is a baseline, not an oracle for the tier rules.
//
// VERSION PREDICATE (standing ruling 4). D140 ships on ia-version 209.
//   * below 209: NOT APPLICABLE, every row skipped by name, clean exit.
//   * C2, K2, L1 and N1 are scoped to the build pair (candidate 209, baseline 208). Any other
//     pair, or no baseline, skips them BY NAME. Every other row runs at 209 and above.
'use strict';
const path = require('path');
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const VER = +IA.version;
const D140_ERA = 209;
// D188 P-BEGINNERMILE (V226) Class A2 re-keys K1 from 226 (standing rulings 2 and 4): the carry case is a
// beginner carrying an 8:15 mile, which D188 reads. <= 225 keeps measure's literal.
const D188_ERA = 226;

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

const ROWS = ['T0','T1','T2','A1','A2','B1','B2','B3','B4','B5','K0','K1','M1'];
if(!(VER >= D140_ERA)){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D140 (V' + D140_ERA + ').');
  ROWS.forEach(r => skipRow(r + ' skipped below the D140 era'));
  summary();
}

// ── the ruling, typed ─────────────────────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const cl = o => JSON.parse(JSON.stringify(o));
const minutesOf = d => !d ? 0 : d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
function longKind(c){
  if(!c || !c.dose) return null;
  if(c.isNRC){
    if(!/^long run/i.test(c.subtype || '')) return null;
    if(/race day|time trial/i.test(c.subtype || '')) return null;
    return 'NRC';
  }
  return (c.type === 'run' && c.dose.key === 'long') ? 'NSW' : null;
}
function handTier(c){
  const k = longKind(c); if(!k) return null;
  if(k === 'NRC' && /rehearsal/i.test(c.detail || '')) return 'A';
  const m = minutesOf(c.dose); if(!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
const LEG_RX = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;
const STRETCH_RX = /stretch|mobility|90\/90|foam|worlds greatest/i;
const CARRY_RX = /carry|farmer|suitcase/i;
const POWER_CORE_RX = /power|explosive/i;   // a core pillar named for power work (coach, D140 finding 1)
const docSets = det => { const s = String(det || ''); let m = /^(\d+)\s*[x×]/.exec(s); if(m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(s); return m ? +m[1] : 1; };
const items = day => (day.sections || []).reduce((a, s) => a.concat(s.items || []), []);
const daySets = day => items(day).filter(i => !STRETCH_RX.test(i.name || '')).reduce((a, i) => a + docSets(i.detail), 0);
const carryN = day => items(day).filter(i => CARRY_RX.test(i.name || '')).length;
const secName = s => (s.label || s.coreHeader || '');
const shape = day => (day.sections || []).map(s => '[' + secName(s) + '] ' + (s.items || []).map(i => i.name).join(', ')).join(' ; ') || '(none)';

// ── fixtures ──────────────────────────────────────────────────────────────────────────
const STAND = { name:'PRT TING', primaryPath:'goal', eventTargeted:false, cardioTypes:['run'],
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15',
    mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } },
  liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs',
  restDays:['sun','wed'], days:DAYS.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-09-21', seed:24865 };
function nswCfg(goal, mm, ss, types, seed, eq, focus, exp){
  const c = cl(STAND);
  c.cardioGoals.run.id = goal; c.cardioGoals.run.mileBestMins = mm; c.cardioGoals.run.mileBestSecs = ss;
  c.cardioTypes = types.slice();
  if(types.includes('bike')) c.cardioGoals.bike = { id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' };
  if(types.includes('swim')) c.cardioGoals.swim = { id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000m' };
  c.seed = seed; c.equipment = eq; c.liftingFocus = focus; c.experience = exp;
  return c;
}
function nrcCfg(plan, eq, focus, exp, dated, seed){
  return Object.assign(cl(fixtures.HALF_MANNY), { name:'D140', primaryPath: dated ? 'event' : 'fitness', cardioTypes:['run'],
    cardioGoals:{ run:{ id:plan, label:plan, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } },
    eventTargeted: dated, raceDate: dated ? '2026-12-06' : '', startDate:'2026-09-21',
    liftingFocus:focus, experience:exp, equipment:eq, seed });
}
const LAT = [];
// Two rest sets: sun+wed (the stand-in's) and sat+sun, which is where measure found the carry
// dealt into the empty-label core section. Without it no lattice cell deals a carry on a long
// day and K0 would read nothing (L1 holds that conjunct).
const RESTS = [['sun','wed'], ['sat','sun']];
[['run_pace_goal','8','15',['run']], ['run_mile_time','8','15',['run']], ['run_15_under10','8','15',['run']],
 ['run_base','8','15',['run']], ['run_pace_goal','12','0',['run']], ['run_base','12','0',['run']],
 ['run_pace_goal','8','15',['run','bike']], ['run_pace_goal','8','15',['run','swim']]].forEach(([g, mm, ss, T]) =>
  [24865, 1001].forEach(seed => ['home_full','crossfit','bodyweight'].forEach(eq => ['balanced','hypertrophy'].forEach(f =>
    ['beginner','intermediate'].forEach(e => RESTS.forEach(r => LAT.push({ limb:'NSW',
      tag: g + '/' + mm + ':' + ss + '/' + T.join('+') + '/' + eq + '/' + f + '/' + e + '/rest ' + r.join('+') + '/s' + seed,
      cfg: Object.assign(nswCfg(g, mm, ss, T, seed, eq, f, e), { restDays: r.slice() }) })))))));
['run_5k','run_10k','run_half','run_marathon'].forEach(plan => ['crossfit','home_full','bodyweight'].forEach(eq =>
  ['balanced','support_prevention','hypertrophy'].forEach(f => ['beginner','advanced'].forEach(e => [false, true].forEach(dated =>
    RESTS.forEach(r => LAT.push({ limb:'NRC', tag: plan + '/' + eq + '/' + f + '/' + e + (dated ? '/dated' : '/undated') + '/rest ' + r.join('+'),
      cfg: Object.assign(nrcCfg(plan, eq, f, e, dated, 76308), { restDays: r.slice() }) })))))));

// ── T: the stand-in, the ruling's own before/after grid ─────────────────────────────────
{
  const p = IA.buildProgram(cl(STAND));
  // D187 amendment 2 (Class E, coach 2026-09-29, MARIO CONCURRED): the stand-in's minute/tier
  // literals are a V209 snapshot of the pace clock D186/D187 moved (5 -> 3 s/mi/wk for this
  // athlete, D186's buildWeeks - 1 steps), not D140's own claim (the dose arithmetic and A/B/C
  // rules are unchanged). Era-table on ia-version, standing rule 4: <= 224 keeps the old row,
  // >= 225 uses the amendment's hand-verified row (W1 = the 8:15 mile's recovery column 659,
  // each non-cutback week steps PACE_IMPROVE.intermediate (3) x agePaceScale['18-35'] (1.0) = 3 s
  // further down the chart's recovery column; cutback weeks W4/W8 hold; minutes = mi x tgt / 60
  // on the unchanged ladder 3 3.5 4 2.8 4.5 5 5.5 3.8 6 6.6 7.3). W11 crosses 75 minutes: B -> A.
  const WANT_MIN = VER >= 225
    ? [33.0, 38.3, 43.5, 30.5, 48.5, 53.7, 58.8, 40.6, 63.5, 69.5, 76.5]
    : [33.0, 38.1, 43.3, 30.3, 47.9, 52.8, 57.7, 39.8, 61.8, 67.3, 73.7];
  const WANT_T = VER >= 225 ? 'CCCCBBBCBBA' : 'CCCCBBBCBBB';
  const gotMin = [], gotT = [];
  for(let w = 1; w <= 11; w++){ const c = p.weeks[w] && p.weeks[w].sat && p.weeks[w].sat.cardio; gotMin.push(+minutesOf(c && c.dose).toFixed(1)); gotT.push(handTier(c) || '-'); }
  ok('T0 stand-in Saturdays: long-run minutes by dose arithmetic and the hand tier are the ruling\'s (' + WANT_MIN.join(' ') + ' / ' + WANT_T + ')',
     p.totalWeeks === 11 && JSON.stringify(gotMin) === JSON.stringify(WANT_MIN) && gotT.join('') === WANT_T,
     p.totalWeeks + ' weeks, ' + gotMin.join(' ') + ' / ' + gotT.join(''));
  const DIPS = 'Dips', PUSH = 'Pushups (slow tempo)', ROWR = 'Inverted rows (rings)', ROWB = 'Inverted rows (bodyweight)';
  // D187 amendment 2: from 225, W11 flips tier B -> A (76.5 min crosses 75), so it drops out of
  // the tier-B Saturday set entirely; T1b below asserts its new shape instead.
  const B_AFTER = Object.assign({ 5:[DIPS, ROWR], 6:[DIPS, ROWR], 7:[PUSH, ROWB], 9:[PUSH, ROWR], 10:[PUSH, ROWR] },
    VER >= 225 ? {} : { 11:[DIPS, ROWR] });
  const bBad = [];
  Object.keys(B_AFTER).forEach(w => { const d = p.weeks[w].sat; const want = '[Strength] ' + B_AFTER[w].join(', ');
    if(shape(d) !== want || daySets(d) !== 6) bBad.push('W' + w + ' ' + shape(d) + ' (' + daySets(d) + ' sets)'); });
  ok('T1 stand-in tier B Saturdays (' + (VER >= 225 ? 'W5 W6 W7 W9 W10' : 'W5 W6 W7 W9 W10 W11') + '): the explosive finisher is gone and the strength pair stays, 6 sets',
     bBad.length === 0, bBad.join(' | '));
  if(VER >= 225){
    const d11 = p.weeks[11].sat, wantShape11 = '[Post-run mobility] Standing calf stretch, Couch stretch, Hip 90/90 stretch, T-spine mobility, Foam roll';
    ok('T1b (D187 amendment 2, Class E, from 225) stand-in W11 flips B -> A: tier A, titled Post-Run Mobility, the mobility shape',
       handTier(d11 && d11.cardio) === 'A' && d11 && d11.title === 'Post-Run Mobility' && shape(d11) === wantShape11,
       'tier ' + handTier(d11 && d11.cardio) + ', title "' + (d11 && d11.title) + '", shape "' + (d11 && shape(d11)) + '"');
  }
  const EXP = 'Explosive finisher';
  const C_KEEP = { 1:'[Strength] ' + DIPS + ', ' + ROWB + ' ; [' + EXP + '] Ball slams, Kettlebell swing',
                   2:'[Strength] ' + DIPS + ', ' + ROWB + ' ; [' + EXP + '] Ball slams, Kettlebell swing',
                   3:'[Strength] ' + PUSH + ', ' + ROWB + ' ; [' + EXP + '] Broad jumps, Ball slams',
                   4:'[Strength] ' + PUSH + ', ' + ROWB, 8:'[Strength] ' + PUSH + ', ' + ROWB };
  const cBad = Object.keys(C_KEEP).filter(w => shape(p.weeks[w].sat) !== C_KEEP[w]).map(w => 'W' + w + ' ' + shape(p.weeks[w].sat));
  ok('T2 stand-in tier C Saturdays (W1 W2 W3 W4 W8) keep the day they had', cBad.length === 0, cBad.join(' | '));
}

// ── the lattice ───────────────────────────────────────────────────────────────────────
const n = { A:{NSW:0,NRC:0}, B:{NSW:0,NRC:0}, C:{NSW:0,NRC:0} };
const bad = { A1:[], A2:[], B1:[], B2:[], B3:[], B5:[], K0:[] };
let aBad = 0, a2Bad = 0, b1Bad = 0, b2Bad = 0, b3Bad = 0, b5Bad = 0, cPowCore = 0, k0Bad = 0, nonLong = 0;
const note = (k, s) => { if(bad[k].length < 3) bad[k].push(s); };
for(const L of LAT){
  const p = IA.buildProgram(cl(L.cfg));
  for(let w = 1; w <= p.totalWeeks; w++) for(const d of DAYS){
    const day = p.weeks[w] && p.weeks[w][d]; if(!day) continue;
    const t = handTier(day.cardio), where = L.tag + ' W' + w + ' ' + d;
    if(!t){
      nonLong++;
      continue;
    }
    const limb = longKind(day.cardio); n[t][limb]++;
    if(carryN(day)){ k0Bad++; note('K0', where + ' ' + shape(day)); }
    if(t === 'A'){
      if((day.sections || []).some(s => !/post-run mobility|taper/i.test(s.label || ''))){ aBad++; note('A1', where + ' ' + shape(day)); }
      if(day.title !== 'Post-Run Mobility'){ a2Bad++; note('A2', where + ' "' + day.title + '"'); }
    } else if(t === 'B'){
      const legs = items(day).filter(i => LEG_RX.test(i.name || '')).map(i => i.name);
      if(legs.length){ b1Bad++; note('B1', where + ' ' + legs.join(', ')); }
      const secs = (day.sections || []).filter(s => /power|explosive|carry/i.test(s.label || '') || /carry/i.test(s.coreHeader || '')).map(secName);
      if(secs.length){ b2Bad++; note('B2', where + ' [' + secs.join('] [') + ']'); }
      const k = daySets(day);
      if(k > 8){ b3Bad++; note('B3', where + ' ' + k + ' sets: ' + shape(day)); }
      const pc = (day.sections || []).filter(s => POWER_CORE_RX.test(s.coreHeader || '')).map(s => s.coreHeader);
      if(pc.length){ b5Bad++; note('B5', where + ' [' + pc.join('] [') + ']'); }
    } else {
      if((day.sections || []).some(s => POWER_CORE_RX.test(s.coreHeader || ''))) cPowCore++;
    }
  }
}
const den = t => 'NSW ' + n[t].NSW + ', NRC ' + n[t].NRC;
console.log('  lattice: ' + LAT.length + ' programs (' + LAT.filter(x => x.limb === 'NSW').length + ' NSW, ' + LAT.filter(x => x.limb === 'NRC').length +
            ' NRC); long-run days A ' + den('A') + ' | B ' + den('B') + ' | C ' + den('C') + '; non-long days ' + nonLong);
ok('A1 every tier A long-run day (>= 75 min) carries post-run mobility only (' + den('A') + ')', aBad === 0, aBad + ': ' + bad.A1.join(' | '));
ok('A2 and is titled Post-Run Mobility', a2Bad === 0, a2Bad + ': ' + bad.A2.join(' | '));
ok('B1 no tier B long-run day (45 to 75 min) carries a hinge, leg or plyo item (' + den('B') + ')', b1Bad === 0, b1Bad + ': ' + bad.B1.join(' | '));
ok('B2 no tier B long-run day carries a power, explosive or carry section', b2Bad === 0, b2Bad + ': ' + bad.B2.join(' | '));
ok('B3 no tier B long-run day carries more than 8 working sets, counted the doctrine way', b3Bad === 0, b3Bad + ': ' + bad.B3.join(' | '));
ok('B5 no tier B long-run day carries a core section whose header names power or explosive work, while tier C still deals them (' + cPowCore + ' tier C days carry one)',
   b5Bad === 0 && cPowCore > 0, b5Bad + ' tier B days: ' + bad.B5.join(' | ') + '; tier C days with one ' + cPowCore);
ok('B4 every tier and both limbs are populated, so A, B and C rows read real days (' + ['A','B','C'].map(t => t + ' ' + den(t)).join('; ') + ')',
   ['A','B','C'].every(t => n[t].NSW > 0 && n[t].NRC > 0), JSON.stringify(n));
ok('K0 no long-run day on any tier carries a carry item, whatever section it rides', k0Bad === 0, k0Bad + ': ' + bad.K0.join(' | '));

// ── K1 measure's carry case: the carry rode the empty-label core section ────────────────
{
  const cc = Object.assign(cl(STAND), { equipment:'crossfit', liftingFocus:'balanced', experience:'beginner', restDays:['sat','sun'] });
  const day = IA.buildProgram(cl(cc)).weeks[6].fri;
  const m = +minutesOf(day.cardio && day.cardio.dose).toFixed(1);
  if(VER < D188_ERA){
  ok('K1 carry case (crossfit, balanced, beginner, rest sat+sun, seed 24865) W6 Fri: 56.4 min, tier B, no carry, the strength pair only',
     m === 56.4 && handTier(day.cardio) === 'B' && carryN(day) === 0 && shape(day) === '[Strength] Dips, Inverted rows (rings)',
     m + ' min, tier ' + handTier(day.cardio) + ', ' + carryN(day) + ' carry, ' + shape(day));
  } else {
    // D188 P-BEGINNERMILE Class A2 (tests/measure/v226_rulings/d188_d189_ruling.md), LICENSED by Mario
    // 2026-09-30 (a2): more lifting, less rest, beginners with a mile only. The beginner's entered 8:15 is
    // now read, the anchor is faster than the 11:30 default, the long run's time on feet shortens and this
    // day leaves tier B for tier C. The row asserts the direction only (tier C by the gate's own dose
    // arithmetic, time on feet under 45, no carry) and the licence's population predicate (a beginner
    // carrying a mile); it never pins a minutes value read off this engine. K1b holds the bound from the
    // other side: the same beginner with no mile is unmoved (D188 Class A3, byte-identical but for D189's
    // W1 note), so W6 Fri stays measure's typed carry case above.
    const rg = cc.cardioGoals.run;
    const pop = cc.experience === 'beginner' && rg.id === 'run_pace_goal' && !!rg.mileBestMins && +rg.mileBestMins > 0;
    ok('K1 D188 era (ia-version ' + VER + ' >= ' + D188_ERA + ', Class A2 licensed 2026-09-30): the carry case is a beginner with a mile (' + rg.mileBestMins + ':' + rg.mileBestSecs + ') and its W6 Fri long run moves to tier C, under 45 min on feet, no carry',
       pop && handTier(day.cardio) === 'C' && m < 45 && carryN(day) === 0,
       'population ' + pop + ', ' + m + ' min, tier ' + handTier(day.cardio) + ', ' + carryN(day) + ' carry');
    const nm = cl(cc); nm.cardioGoals.run.mileBestMins = ''; nm.cardioGoals.run.mileBestSecs = ''; delete nm.cardioGoals.run.mileBestSrc;
    const d0 = IA.buildProgram(cl(nm)).weeks[6].fri;
    const m0 = +minutesOf(d0.cardio && d0.cardio.dose).toFixed(1);
    ok('K1b D188 population bound: the same beginner with NO mile is unmoved (Class A3), W6 Fri stays measure\'s carry case: 56.4 min, tier B, no carry, the strength pair only',
       m0 === 56.4 && handTier(d0.cardio) === 'B' && carryN(d0) === 0 && shape(d0) === '[Strength] Dips, Inverted rows (rings)',
       m0 + ' min, tier ' + handTier(d0.cardio) + ', ' + carryN(d0) + ' carry, ' + shape(d0));
  }
  // K2 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). It defended D140's premise: on V208 the carry case dealt its carries in a section whose label never says carry.
}

// C2, N1 and L1 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). They defended D140: tier C long-run days are V208's less carries, non-long days are V208's, and D140 moved long-run days on both limbs.

// ── M1 HALF_MANNY ─────────────────────────────────────────────────────────────────────
// V231 (absorb ruling section 4, tests/measure/v231_rulings/v231_absorb_ruling.md; standing rulings
// 3, 4 and 5): this row defends ITS ruling's claim that it did not move HALF_MANNY. The typed
// literal is gone: the only object that carries that claim across later rulings is the era table
// standing ruling 5 governs, so the row compares the built digest to MANNY_DIGEST_BY_VERSION[ia-version]
// and fails loudly when that row is absent. Re-pointing the literal to a later digest would be the
// vacuous line standing ruling 3 forbids; deleting the row would be an unruled removal.
{
  const row = MANNY_DIGEST_BY_VERSION[VER], rowOk = typeof row === 'string' && /^[0-9a-f]{16}$/.test(row);
  let hm; try { hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('M1 HALF_MANNY shipped digest is unmoved by D140: it equals its era row MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + row + ', and that row exists',
     rowOk && hm === row, rowOk ? hm : 'NO ERA ROW for ia-version ' + VER + ' (built ' + hm + ')');
}
summary();
