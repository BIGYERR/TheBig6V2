// g208_d103a_key.js — D103a slice 1 ("stamp"): the NSW run builder stamps a session class key.
//
// RULING (D103a, coach V206; slice shape from the V208 brief): every NSW run session carries a
// class key from the vocabulary int | chi | steady | long | easy | bench | trial, stamped on the
// DOSE object (dose.key). The dose is the one object every reader can reach: _doseStripHTML
// receives only (sport, dose, sub), and frozen ia_hist_ snapshots carry cardio.dose (V148).
// Sites: the builder's branch type (lsd_long long, lsd_easy easy, chi chi, int int), then the
// branches that print a different session say so: run_base's Steady Aerobic Run is `steady`,
// the Benchmark Run is `bench`, and the budgeted easy run past 40 min (V159, "Easy Run — Long",
// the block's designated long run) is `long` (coach's D104a ruling; legLoad is NOT changed).
// The test pin stamps `trial` on the trial and `easy` on B4's replacement. NRC, bike and swim
// sessions are NOT stamped: their readers keep the label scan, byte-identical by construction.
//
// ORACLES (independent of the stamp):
//   * the LABEL, through a hand table (below). The one label two sessions share is the pace
//     family's `Long Slow Distance (LSD)`: long and easy are told apart by legLoad, the flag the
//     scheduler set from assignedType before this ruling existed (the same lens _nrcRunShape
//     uses). `Easy Run — Long` is `long` whichever branch printed it (coach, D104a).
//   * for K4, the tree as it stood before this slice (see VERSION PREDICATE).
//
// ROWS
//   K0  the lattice reaches every key in the vocabulary, and the budgeted-easy long card.
//   K1  every NSW run card carries dose.key: 0 unkeyed.
//   K2  dose.key equals the hand table on 100% of NSW run cards.
//   K2b the table's renamed heads (slice 4a) are reached plain and Taper, so K2 reads every row.
//   K3  NRC run cards, and every bike and swim card, carry no key (dose.key or session key).
//   K4  INERTNESS: with dose.key stripped, every program is byte-identical to the pre-slice
//       tree. Byte-identity with the key stripped is the BUILD-TIME proof for D103a slices 1-3
//       (stamp, readers, chip + history); it is not a standing claim about the final V208,
//       which also carries the LI/SI rename, D104a and D140 on the same ia-version.
//   K5  HALF_MANNY digest 0ac7da6b1691a8e1 (NRC fixture: nothing it prints is stamped).
//
// VERSION PREDICATE (standing ruling 4): D103a ships on ia-version 208. Below 208 every row is
// printed SKIP, never a bare PASS. K4 runs ONLY when the baseline (argv[3]) carries the SAME
// ia-version as the candidate (a slice candidate against its own pre-slice tree, both 208);
// against the previous release (208 vs 207) it prints SKIP with the reason.
'use strict';
const path = require('path');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 208;
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ ['K0','K1','K2','K2b','K3','K4','K5'].forEach(r => console.log('SKIP ' + r + ' ia-version ' + VER + ' predates D103a (V' + ERA + ')')); done(); }
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const clone = v => JSON.parse(JSON.stringify(v));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const NSW = new Set(['run_base','run_pace_goal','run_mile_time','run_15_under10']);
const VOCAB = ['int','chi','steady','long','easy','bench','trial'];
// Hand table: label -> key. First match wins.
function want(c){
  const s = String(c.subtype || '');
  if(/TIME TRIAL/.test(s)) return 'trial';
  // V208 slice 4a renamed the INT and the CHI. This gate runs only at >= 208, so the table carries
  // the ruled names. Prefix match: the Taper and re-entry forms keep the head.
  if(/^Short Interval \(SI\)/.test(s)) return 'int';
  if(/^Long Interval \(LI\)/.test(s)) return 'chi';
  if(/^Steady Aerobic Run/.test(s)) return 'steady';
  if(/^Benchmark Run/.test(s)) return 'bench';
  if(/^Easy Run — Long/.test(s)) return 'long';
  if(/^Easy Run/.test(s)) return 'easy';
  if(/^Long Slow Distance \(LSD\)/.test(s)) return c.legLoad ? 'long' : 'easy';
  return 'UNLISTED LABEL';
}
// ── the lattice ────────────────────────────────────────────────────────────────────
const START = new Date(2026, 9, 5);   // Mon 2026-10-05
const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const LIFT = {liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', days:ALL,
  bench:185, squat:255, deadlift:315, name:'K', startDate:isoOff(0)};
const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const MILE = {id:'run_mile_time', label:'Mile', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
const withMix = (cg, mix) => { if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike base'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim base'}; return cg; };
const types = mix => mix ? ['run', mix] : ['run'];
const LAT = [];
// (a) the pace family, undated and dated (test pin: trial + B4), run-only and multi-sport
for(const g of [PACE, MILE]) for(const mix of ['', 'bike', 'swim']) for(const rest of [['sun'], ['sun','wed'], ['sat','sun'], []]) for(const tw of [0, 3, 5]) for(const wd of (tw ? [0, 3, 5] : [0])){
  const c = Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:types(mix), cardioGoals:withMix({run:clone(g)}, mix), restDays:rest, seed:24865});
  if(tw){ c.raceDate = isoOff(7 * (tw - 1) + wd); c._testWeek = tw; c._raceDateCappedWeeks = tw; }
  LAT.push({fam:'pace ' + g.id + (mix ? '+' + mix : '') + (tw ? ' dated' : ''), cfg:c});
}
// (b) run_base on the frequency plan: event path, 18-35, 2.5 mi baseline (the budgeted easy run past 40 min)
for(const mix of ['', 'bike']) for(const exp of ['beginner','intermediate','advanced']) for(const rest of [[], ['sun'], ['sun','wed'], ['sat','sun'], ['sun','tue','thu','sat']]) for(const seed of [24865, 7]) for(const dated of [false, true]){
  const c = Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:types(mix), experience:exp, restDays:rest, seed,
    cardioGoals:withMix({run:{id:'run_base', label:'Build Running Base', mileBestMins:'8', mileBestSecs:'15', baseline:'2.5 miles'}}, mix)});
  if(dated) c.raceDate = '2026-12-14';
  LAT.push({fam:'run_base freq plan' + (mix ? '+' + mix : ''), cfg:c});
}
// (c) run_base, HALF_MANNY-shaped: 55+, low baseline (Steady Aerobic Run, Easy Run — Long, Benchmark)
for(const pp of ['fitness','event']) for(const bd of ['0.1','1']) for(const mix of ['', 'bike']) for(const rest of [['sun','wed'], [], ['sat','sun']]) for(const evt of [true, false]){
  LAT.push({fam:'run_base 55+ low baseline' + (mix ? '+' + mix : ''), cfg:Object.assign({}, clone(IA.fixtures.HALF_MANNY), {name:'RB', primaryPath:pp,
    cardioTypes:types(mix), cardioGoals:withMix({run:{id:'run_base', label:'Build Running Base', baselineDist:bd, baseline:bd + 'mi'}}, mix),
    eventTargeted:evt, raceDate:evt ? '2027-06-01' : '', ageBracket:'55+', restDays:rest, seed:76308})});
}
// (d) NRC, dated, run-only and multi-sport
for(const g of ['run_5k','run_10k','run_half']) for(const mix of ['', 'bike', 'swim']) for(const rest of [['sun'], ['sun','wed']]){
  LAT.push({fam:'NRC ' + g + (mix ? '+' + mix : ''), cfg:Object.assign({}, clone(IA.fixtures.HALF_MANNY), {cardioTypes:types(mix),
    cardioGoals:withMix({run:{id:g, label:g}}, mix), restDays:rest, seed:76308, raceDate:{run_5k:'2026-11-19', run_10k:'2026-11-21', run_half:'2026-12-26'}[g]})});
}
// ── K0-K3 ──────────────────────────────────────────────────────────────────────────
const cardsOf = p => { const out = []; Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const x = p.weeks[w][d]; if(x) [].concat(x.cardio || []).forEach(c => { if(c) out.push({w, d, c}); }); })); return out; };
const S = {progs:0, crash:[], nsw:0, unkeyed:[], agree:0, disagree:[], other:0, otherKeyed:[], seen:{}, budgetLong:0};
const built = [];
for(const L of LAT){
  let p; try { p = clone(IA.buildProgram(clone(L.cfg))); } catch(e){ S.crash.push(L.fam + ': ' + e.message); built.push(null); continue; }
  S.progs++; built.push(p);
  for(const {w, d, c} of cardsOf(p)){
    const k = c.dose ? c.dose.key : undefined;
    const tag = L.fam + ' W' + w + ' ' + d + ' "' + c.subtype + '" legLoad ' + c.legLoad;
    if(c.type === 'run' && !c.isNRC && NSW.has(c.goalId)){
      S.nsw++;
      if(!k) S.unkeyed.push(tag);
      else S.seen[k] = (S.seen[k] || 0) + 1;
      if(k === want(c)) S.agree++; else S.disagree.push(tag + ' key ' + k + ' want ' + want(c));
      if(k === 'long' && /^Easy Run — Long/.test(c.subtype || '') && !c.legLoad) S.budgetLong++;
    } else {
      S.other++;
      if(k !== undefined || c.key !== undefined) S.otherKeyed.push(L.fam + ' W' + w + ' ' + d + ' ' + c.type + ' "' + c.subtype + '" key ' + (k || c.key));
    }
  }
}
const missing = VOCAB.filter(k => !S.seen[k]);
ok(`K0 ${S.progs}/${LAT.length} programs build, every key in the vocabulary is reached (${VOCAB.map(k => k + ' ' + (S.seen[k] || 0)).join(', ')}), and the budgeted easy run past 40 min is reached (${S.budgetLong})`,
   S.crash.length === 0 && missing.length === 0 && S.budgetLong > 0,
   'crash ' + S.crash.slice(0, 2).join('; ') + ' / missing ' + (missing.join(',') || 'none') + ' / budget long ' + S.budgetLong);
ok(`K1 every NSW run card carries dose.key (${S.nsw} cards)`, S.nsw > 0 && S.unkeyed.length === 0, S.unkeyed.length + ' unkeyed: ' + S.unkeyed.slice(0, 3).join('; '));
ok(`K2 dose.key equals the label hand table on 100% of NSW run cards (${S.agree}/${S.nsw})`, S.nsw > 0 && S.agree === S.nsw, S.disagree.length + ' disagree: ' + S.disagree.slice(0, 3).join('; '));
{ const F = {'Long Interval (LI)':0, 'Long Interval (LI) — Taper':0, 'Short Interval (SI)':0, 'Short Interval (SI) — Taper':0};
  built.forEach(p => { if(p) cardsOf(p).forEach(({c}) => { if(c.type === 'run' && !c.isNRC && NSW.has(c.goalId) && Object.prototype.hasOwnProperty.call(F, c.subtype)) F[c.subtype]++; }); });
  ok(`K2b the renamed heads are reached in both forms, so K2 reads them (${Object.keys(F).map(k => '"' + k + '" ' + F[k]).join(', ')})`, Object.values(F).every(n => n > 0), JSON.stringify(F)); }
ok(`K3 NRC run, bike and swim cards carry no key (${S.other} cards)`, S.other > 0 && S.otherKeyed.length === 0, S.otherKeyed.length + ': ' + S.otherKeyed.slice(0, 3).join('; '));
// ── K4: inertness against the pre-slice tree ─────────────────────────────────────────
if(!BASEFILE) console.log('SKIP K4 no baseline passed as argv[3]; the inertness diff did not run');
else {
  const IB = load(BASEFILE);
  if(+IB.version !== VER) console.log('SKIP K4 runs only against the pre-slice tree at the same ia-version (build-time proof for D103a slices 1-3); this pair is ' + VER + ' vs ' + IB.version);
  else {
    const strip = p => { cardsOf(p).forEach(({c}) => { if(c.dose) delete c.dose.key; }); delete p.created; delete p.id; return canon(p); };
    const moved = [];
    LAT.forEach((L, i) => { if(!built[i]) return; let b; try { b = strip(clone(IB.buildProgram(clone(L.cfg)))); } catch(e){ b = 'CRASH ' + e.message; }
      if(strip(clone(built[i])) !== b) moved.push(L.fam + ' #' + i); });
    ok(`K4 with dose.key stripped, ${S.progs} programs are byte-identical to the pre-slice tree (the stamp is inert until slice 2)`, moved.length === 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; '));
  }
}
// ── K5 ─────────────────────────────────────────────────────────────────────────────
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('K5 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: nothing it prints is stamped)', hm === '0ac7da6b1691a8e1', hm); }
done();
