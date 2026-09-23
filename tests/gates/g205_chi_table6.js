// g205_chi_table6.js — the gate for D128: CHI minutes and reps come from NSW Guide B
// Table 6, the bike keeps the V115 hand ramp, and swim takes the rep tier only.
//
// ORACLES, all independent of the engine:
//   * T2 is a HAND TABLE. The 26 rows below were typed from the "CHI min" column of
//     Table 6 in doctrine/nsw_ptg_sealswcc_11pg.txt lines 35-60. The gate never calls
//     chiFromTable6 to learn what chiFromTable6 should say. T2b re-parses that doctrine
//     file when it is present (it is gitignored) and requires the hand table to agree
//     with the text, so the transcription itself is checked, not just re-asserted.
//   * T3 is the DOCTRINE TAIL RULE, line 61 of the same file: ">26: do not increase INT
//     or CHI distances." Written here as a predicate: every week past 26 must return
//     exactly row 26. This is the row that stands in for the deleted hardcoded limb.
//   * T4/T7 are the CEILING claim. Table 6's largest cell is 2 x 20 = 40 minutes of
//     work. 3 reps appears nowhere in the table, and 60 minutes appears nowhere in
//     either guide. Both are written here as bounds, not read from the artifact.
//   * T6 is the CUTBACK ARITHMETIC, re-implemented in this file from the rule the
//     branch states in prose: one rep off the prior build week, or 70% of duration
//     when the prior week was a single rep, floored at 10.
//   * T9 is the V115 HAND RAMP, re-implemented here from the code D128 replaced. The
//     bike must still equal it exactly. This is a typed reference, not a diff against
//     the previous artifact, so it holds on any build and does not read as "my build
//     changed nothing".
//   * T11 derives Mario's expected CHI minutes from the hand table and the cutback
//     arithmetic and requires the built CARD TEXT to agree. The engine is never asked
//     what it should have printed.
//   * T12 re-derives swim CHI yardage from the formula D128 did not touch and requires
//     it to be unmoved, which is the "swim takes the rep tier ONLY" half of the ruling.
//
// VERSION PREDICATE (standing ruling 4 — a gate is keyed to the RULING it defends).
// D128 ships on ia-version 205.
//   * at 205 and above chiFromTable6 MUST exist; its absence is a named FAIL, never a skip.
//   * below 205 WITH chiFromTable6 present is the pre-bump working artifact mid-slice
//     (V205 is built across several slices and the meta bump is the last one). Every row RUNS.
//   * below 205 WITHOUT chiFromTable6 is an older build: NOT APPLICABLE, rows skipped,
//     clean exit, because gate.sh runs every gate against the previous artifact first.
const path = require('path');
const fs = require('fs');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function eq(label, got, want){
  ok(label + ' == ' + JSON.stringify(want), JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const HAS = IA.eval("typeof chiFromTable6 === 'function'");
const VER = IA.version;
const D128_ERA = 205;
const ROWS = ['T1','T2','T2b','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12','T13','T14'];

if(!HAS && VER < D128_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D128 (V' + D128_ERA + ') and has no chiFromTable6.');
  for(const r of ROWS) skipRow(r + ' skipped below the D128 era');
  summary(0);
}

// ── THE HAND TABLE. Typed from doctrine/nsw_ptg_sealswcc_11pg.txt:35-60. ─────────
// wk 1-2 1x15 | 3-4 1x16 | 5-6 1x17 | 7-8 1x18 | 9-10 1x19 | 11-12 1x20
// wk 13-15 2x12 | 16-18 2x14 | 19-21 2x16 | 22-24 2x18 | 25-26 2x20
const T6 = [null,
  {reps:1,minPerRep:15},{reps:1,minPerRep:15},{reps:1,minPerRep:16},{reps:1,minPerRep:16},
  {reps:1,minPerRep:17},{reps:1,minPerRep:17},{reps:1,minPerRep:18},{reps:1,minPerRep:18},
  {reps:1,minPerRep:19},{reps:1,minPerRep:19},{reps:1,minPerRep:20},{reps:1,minPerRep:20},
  {reps:2,minPerRep:12},{reps:2,minPerRep:12},{reps:2,minPerRep:12},
  {reps:2,minPerRep:14},{reps:2,minPerRep:14},{reps:2,minPerRep:14},
  {reps:2,minPerRep:16},{reps:2,minPerRep:16},{reps:2,minPerRep:16},
  {reps:2,minPerRep:18},{reps:2,minPerRep:18},{reps:2,minPerRep:18},
  {reps:2,minPerRep:20},{reps:2,minPerRep:20}];
const t6 = w => T6[Math.max(1, Math.min(Math.round(w) || 1, 26))];          // the >26 rule
const isCut = (w, tw) => (tw || 0) >= 10 && w % 4 === 0 && w !== tw;         // the cutback clock
// The cutback rule in prose: one rep off the prior BUILD week; a single-rep session
// cuts duration to 70% instead, floored at 10 minutes. Intensity is never touched.
function cutOf(prev){
  return prev.reps > 1 ? {reps: prev.reps - 1, minPerRep: prev.minPerRep}
                       : {reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7))};
}
function expRun(w, tw){ return isCut(w, tw) ? cutOf(t6(w - 1)) : t6(w); }
// The V115 hand ramp D128 replaced, re-implemented. The BIKE must still equal this.
function v115(w, tw, pFrom, pTo){
  const _pFrom = pFrom || 1, _pTo = Math.max(_pFrom + 1, pTo || tw || 6);
  const at = x => {
    const pct = Math.max(0, Math.min(1, (x - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return {reps: pct < 0.35 ? 1 : pct < 0.70 ? 2 : 3, minPerRep: Math.round(15 + pct * 5)};
  };
  if(isCut(w, tw)) return cutOf(at(w - 1));
  return at(w);
}
const call = (fn, args) => JSON.parse(IA.eval('JSON.stringify(' + fn + '(' + args.map(a => JSON.stringify(a)).join(',') + '))'));
const norm = o => ({reps: o.reps, minPerRep: o.minPerRep});

// ── T1 — the surface exists ──────────────────────────────────────────────────────
ok('T1a chiFromTable6 is declared and is a function (D128 requires it at ia-version >= ' + D128_ERA + ')', HAS, String(HAS));
if(!HAS) summary(1);
const RAW = JSON.parse(IA.eval('JSON.stringify(NSW_TABLE6_CHI)'));
ok('T1b NSW_TABLE6_CHI is a 27-slot 1-based array (index 0 unused)', Array.isArray(RAW) && RAW.length === 27 && RAW[0] === null, RAW && RAW.length);
ok('T1c getCHIBike and getCHISwim exist: the fork is BY CALLER, not by a flag',
   IA.eval("typeof getCHIBike === 'function' && typeof getCHISwim === 'function'"), 'see artifact');

// ── T2 — every one of the 26 rows against the hand table ─────────────────────────
let bad2 = [];
for(let w = 1; w <= 26; w++){
  const got = norm(call('chiFromTable6', [w]));
  if(JSON.stringify(got) !== JSON.stringify(t6(w))) bad2.push('wk' + w + ' got ' + JSON.stringify(got) + ' want ' + JSON.stringify(t6(w)));
}
ok('T2 all 26 Table 6 rows match the hand transcription', bad2.length === 0, bad2.join(' | '));

// ── T2b — the hand table against the doctrine TEXT (gitignored file, skip loudly) ─
const DOC = path.join(__dirname, '..', '..', 'doctrine', 'nsw_ptg_sealswcc_11pg.txt');
if(!fs.existsSync(DOC)){
  skipRow('T2b doctrine/nsw_ptg_sealswcc_11pg.txt absent (gitignored); hand table not cross-checked against the text');
} else {
  const lines = fs.readFileSync(DOC, 'utf8').split('\n');
  const parsed = [null];
  for(const L of lines){
    const m = L.match(/^\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*(?:(\d+)\s*x\s*)?(\d+)\s*\|/);
    if(!m) continue;
    const wk = +m[1]; if(wk < 1 || wk > 26 || parsed[wk]) continue;
    parsed[wk] = {reps: m[2] ? +m[2] : 1, minPerRep: +m[3]};
  }
  const bad2b = [];
  for(let w = 1; w <= 26; w++){
    if(!parsed[w]){ bad2b.push('wk' + w + ' not parsed from the doctrine text'); continue; }
    if(JSON.stringify(parsed[w]) !== JSON.stringify(t6(w))) bad2b.push('wk' + w + ' text ' + JSON.stringify(parsed[w]) + ' vs hand ' + JSON.stringify(t6(w)));
  }
  ok('T2b the hand table reproduces all 26 rows of the doctrine TEXT', bad2b.length === 0, bad2b.join(' | '));
  ok('T2b2 the doctrine text carries the ">26: do not increase" tail rule',
     lines.some(L => />\s*26\s*:/.test(L) && /do not increase/i.test(L)), 'tail rule line not found');
}

// ── T3 — the >26 rule IS the clamp ───────────────────────────────────────────────
const bad3 = [];
for(const w of [27, 28, 30, 40, 52, 104, 1000]){
  const got = norm(call('chiFromTable6', [w]));
  if(JSON.stringify(got) !== JSON.stringify(t6(26))) bad3.push('wk' + w + ' -> ' + JSON.stringify(got));
}
ok('T3 every week past 26 reads row 26 (2 x 20) and nothing increases', bad3.length === 0, bad3.join(' | '));

// ── T4 — the ceiling. 3 reps and 60 minutes appear nowhere in Table 6 ────────────
const maxWork = Math.max.apply(null, RAW.slice(1).map(r => r.reps * r.minPerRep));
const maxReps = Math.max.apply(null, RAW.slice(1).map(r => r.reps));
eq('T4a the heaviest Table 6 cell is 40 minutes of work', maxWork, 40);
eq('T4b no Table 6 row prescribes more than 2 reps', maxReps, 2);

// ── T5 — the RUN reader reads the table, and the phase window no longer re-bases ──
const bad5 = [];
for(const tw of [6, 8, 9, 11, 12, 16, 20, 26]){
  for(let w = 1; w <= tw; w++){
    if(isCut(w, tw)) continue;
    for(const ph of [[null, null], [1, tw], [Math.ceil(tw / 2), tw], [tw - 1, tw]]){
      const got = norm(call('getCHI', [w, tw, true, ph[0], ph[1]]));
      if(JSON.stringify(got) !== JSON.stringify(t6(w))) bad5.push('tw' + tw + ' wk' + w + ' ph' + JSON.stringify(ph) + ' -> ' + JSON.stringify(got));
    }
  }
}
ok('T5 getCHI returns Table 6 row `week` on every non-cutback week, for every phase window', bad5.length === 0, bad5.slice(0, 6).join(' | '));

// ── T6 — the cutback branch still fires, on the TABLE's value ────────────────────
const bad6 = [];
let cutSeen = 0;
for(const tw of [10, 11, 12, 16, 20, 26]){
  for(let w = 1; w <= tw; w++){
    if(!isCut(w, tw)) continue;
    cutSeen++;
    const got = norm(call('getCHI', [w, tw, true, null, null]));
    if(JSON.stringify(got) !== JSON.stringify(cutOf(t6(w - 1)))) bad6.push('tw' + tw + ' wk' + w + ' -> ' + JSON.stringify(got) + ' want ' + JSON.stringify(cutOf(t6(w - 1))));
  }
}
ok('T6a the cutback branch fired on ' + cutSeen + ' weeks of the lattice (it is still reachable)', cutSeen >= 10, String(cutSeen));
ok('T6b every cutback week equals the hand cutback arithmetic applied to Table 6', bad6.length === 0, bad6.slice(0, 6).join(' | '));

// ── T7 — the ceiling holds on the READER, not just the data ──────────────────────
const bad7 = [];
for(const tw of [4, 6, 11, 16, 26, 40, 52]){
  for(let w = 1; w <= 60; w++){
    const g = norm(call('getCHI', [w, tw, true, null, null]));
    if(g.reps > 2) bad7.push('tw' + tw + ' wk' + w + ' reps ' + g.reps);
    if(g.reps * g.minPerRep > 40) bad7.push('tw' + tw + ' wk' + w + ' work ' + (g.reps * g.minPerRep));
  }
}
ok('T7 getCHI never prescribes 3 reps and never exceeds 40 minutes of work, anywhere in 1..60 weeks', bad7.length === 0, bad7.slice(0, 6).join(' | '));

// ── T8 — the deleted limb is gone, and gone by the clamp ─────────────────────────
const bad8 = [];
for(const [w, tw] of [[27, 30], [27, undefined], [30, 40], [31, 40], [40, undefined], [45, 52], [99, 104]]){
  const g = norm(call('getCHI', [w, tw === undefined ? null : tw, true, null, null]));
  const want = (tw && isCut(w, tw)) ? cutOf(t6(26)) : t6(26);
  if(JSON.stringify(g) !== JSON.stringify(want)) bad8.push('wk' + w + '/tw' + tw + ' -> ' + JSON.stringify(g) + ' want ' + JSON.stringify(want));
  if(g.reps === 3 && g.minPerRep === 20) bad8.push('wk' + w + ' still returns the deleted {reps:3,minPerRep:20} literal');
}
ok('T8a past week 26 getCHI returns row 26 (or its cutback), never the deleted 3 x 20 literal', bad8.length === 0, bad8.join(' | '));
const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
ok('T8b the hardcoded `isMilGoal && week > 26` CHI limb is absent from the source (comments stripped)',
   !/isMilGoal\s*&&\s*week\s*>\s*26\s*\)\s*return\s*\{\s*reps\s*:\s*3/.test(SRC), 'limb still present');

// ── T9 — the bike still equals the V115 hand ramp, exactly ───────────────────────
const bad9 = [];
for(const tw of [6, 7, 11, 13, 17, 20, 26]){
  for(let w = 1; w <= tw; w++){
    const got = norm(call('getCHIBike', [w, tw]));
    if(JSON.stringify(got) !== JSON.stringify(v115(w, tw))) bad9.push('tw' + tw + ' wk' + w + ' -> ' + JSON.stringify(got) + ' want ' + JSON.stringify(v115(w, tw)));
  }
}
ok('T9a getCHIBike equals the re-implemented V115 hand ramp on every week of the lattice', bad9.length === 0, bad9.slice(0, 6).join(' | '));
ok('T9b the bike reader is NOT the table reader (D128 does not reach cycling)',
   JSON.stringify(norm(call('getCHIBike', [16, 16]))) !== JSON.stringify(t6(16)), 'bike now reads Table 6');

// ── T10 — swim takes the REP TIER only ───────────────────────────────────────────
const bad10 = [];
for(const tw of [9, 13, 16, 20, 26]){
  for(let w = 1; w <= tw; w++){
    const got = norm(call('getCHISwim', [w, tw, true, null, null]));
    const tierWant = isCut(w, tw) ? cutOf({reps: t6(w - 1).reps, minPerRep: v115(w - 1, tw).minPerRep}).reps : t6(w).reps;
    const minWant = isCut(w, tw) ? cutOf({reps: t6(w - 1).reps, minPerRep: v115(w - 1, tw).minPerRep}).minPerRep : v115(w, tw).minPerRep;
    if(got.reps !== tierWant) bad10.push('tw' + tw + ' wk' + w + ' reps ' + got.reps + ' want ' + tierWant);
    if(got.minPerRep !== minWant) bad10.push('tw' + tw + ' wk' + w + ' min ' + got.minPerRep + ' want ' + minWant);
    if(got.reps > 2) bad10.push('tw' + tw + ' wk' + w + ' swim reps ' + got.reps + ' exceeds the tier ceiling of 2');
  }
}
ok('T10a getCHISwim reps follow the Table 6 tier (1 through wk 12, 2 from wk 13, never 3) and minutes stay on the V115 ramp', bad10.length === 0, bad10.slice(0, 6).join(' | '));
eq('T10b swim week 12 is still the single-rep tier', call('getCHISwim', [12, 16, true, null, null]).reps, 1);
eq('T10c swim week 13 steps to the two-rep tier', call('getCHISwim', [13, 16, true, null, null]).reps, 2);

// ── T11 — end to end: Mario's block, against the oracle ──────────────────────────
const ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const marioCfg = {name:'M', primaryPath:'goal', cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', targetDist:'1.5', paceUnit:'mi',
    targetMins:'10', targetSecs:'0', mileBestMins:'8', mileBestSecs:'0', baseline:''}},
  eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:ALL.slice(),
  bench:185, squat:255, deadlift:315, seed:76308};
function chiCardsOf(p){
  const out = [];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w => ALL.forEach(d => {
    const day = p.weeks[w][d]; if(!day || day.rest || !day.cardio) return;
    (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(c => {
      if(!/CHI|Continuous High/i.test(String(c.subtype || c.type || ''))) return;
      out.push({w:+w, detail:String(c.detail || '').replace(/\s+/g, ' ')});
    });
  }));
  return out;
}
const mp = IA.buildProgram(Object.assign({}, marioCfg));
const mCards = chiCardsOf(mp);
ok('T11a Mario\'s 11-week pace block still builds CHI cards', mp.totalWeeks === 11 && mCards.length > 0, mp.totalWeeks + 'wk, ' + mCards.length + ' cards');
const bad11 = [];
let totalMin = 0;
for(const c of mCards){
  const want = expRun(c.w, mp.totalWeeks);
  const m = c.detail.match(/(\d+)\s*x\s*(\d+)\s*min/i);
  const one = c.detail.match(/^(\d+)\s*min continuous/i);
  const gotReps = m ? +m[1] : (one ? 1 : 0), gotMin = m ? +m[2] : (one ? +one[1] : 0);
  totalMin += gotReps * gotMin;
  if(gotReps !== want.reps || gotMin !== want.minPerRep)
    bad11.push('W' + c.w + ' card says ' + gotReps + 'x' + gotMin + ' want ' + want.reps + 'x' + want.minPerRep);
}
ok('T11b every CHI card in Mario\'s block prints the Table 6 dose the oracle computes', bad11.length === 0, bad11.join(' | '));
eq('T11c Mario\'s block CHI work total, summed off the printed cards', totalMin,
   mCards.reduce((s, c) => s + expRun(c.w, mp.totalWeeks).reps * expRun(c.w, mp.totalWeeks).minPerRep, 0));
ok('T11d no card in Mario\'s block prescribes a 60-minute CHI session', !mCards.some(c => /3\s*x\s*20\s*min/i.test(c.detail)), 'a 3 x 20 card survived');

// ── T12 — swim YARDS are untouched by D128 ───────────────────────────────────────
const swimCfg = {name:'S', primaryPath:'goal', cardioTypes:['swim'],
  cardioGoals:{swim:{id:'swim_mile', label:'Swim a Mile', baseline:'400 yd', baselineDist:'400'}},
  eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:ALL.slice(),
  bench:185, squat:255, deadlift:315, seed:76308};
const sp = IA.buildProgram(Object.assign({}, swimCfg));
const stw = sp.totalWeeks;
// the yard ramp D128 did not touch, re-derived here
const yardOf = w => isCut(w, stw)
  ? Math.max(150, Math.round((200 + ((w - 2) / Math.max(stw - 1, 1)) * 600) * 0.7))
  : Math.round(200 + ((w - 1) / Math.max(stw - 1, 1)) * 600);
const bad12 = [];
let sCards = 0;
Object.keys(sp.weeks).sort((a,b)=>+a-+b).forEach(w => ALL.forEach(d => {
  const day = sp.weeks[w][d]; if(!day || day.rest || !day.cardio) return;
  (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(c => {
    const det = String(c.detail || '').replace(/\s+/g, ' ');
    if(!/CHI|Continuous High/i.test(String(c.subtype || c.type || '')) || !/90-95%/.test(det)) return;
    sCards++;
    const many = det.match(/(\d+)\s*x\s*(\d+)\s*(?:yd|yards) at 90-95% pace/i);
    const cont = det.match(/(\d+)\s*(?:yd|yards) continuous at 90-95%/i);
    const reps = many ? +many[1] : (cont ? 1 : 0);
    const yds = many ? +many[2] : (cont ? +cont[1] : 0);
    const wantReps = isCut(+w, stw) ? cutOf({reps:t6(+w - 1).reps, minPerRep:v115(+w - 1, stw).minPerRep}).reps : t6(+w).reps;
    if(reps !== wantReps) bad12.push('W' + w + ' reps ' + reps + ' want ' + wantReps);
    // The segmented grammar (index.html:4687) quantizes the per-rep yardage to pool-legal
    // 25s with a 150 floor ONCE, before the rep split, and :4691 prints that same _rY for
    // the single-rep continuous text too. So the quantization is unconditional, not a
    // multi-rep-only step. D128 did not touch either line.
    const wantYds = Math.max(150, Math.round(yardOf(+w) / 25) * 25);
    if(yds !== wantYds) bad12.push('W' + w + ' yards ' + yds + ' want ' + wantYds);
  });
}));
ok('T12a the swim_mile block still builds CHI cards (' + sCards + ' of them across ' + stw + ' weeks)', sCards > 0, String(sCards));
ok('T12b swim CHI yardage matches the untouched yard ramp and reps match the Table 6 tier', bad12.length === 0, bad12.slice(0, 8).join(' | '));

// ── T13 — D128 cannot move the NRC digest ────────────────────────────────────────
const hm = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY));
eq('T13 HALF_MANNY is an NRC race plan and builds zero CHI cards, so D128 cannot move its digest',
   chiCardsOf(hm).length, 0);

// ── T14 — purity ─────────────────────────────────────────────────────────────────
const cfgBefore = JSON.stringify(fixtures.HALF_MANNY);
IA.buildProgram(fixtures.HALF_MANNY);
eq('T14 buildProgram left cfg byte-identical (no scratch survives the build)', JSON.stringify(fixtures.HALF_MANNY), cfgBefore);

summary(fail ? 1 : 0);
