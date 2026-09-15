// V195 second pass — PROOF, not assertion, that progDigest is unchanged from V194.
// The Part 1 edit touches computeStreak only, which is a render-time reader of localStorage
// and is never called by buildProgram. This sweeps a lattice on BOTH files and compares
// digests config by config. Baseline is proven self-stable first (V182 lesson) so an
// unstable build cannot masquerade as a match.
//   node tests/measure/v195_digest_neutrality.js index.html /tmp/base_V194.html
const {load, progDigest} = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const CAND = process.argv[2], BASE = process.argv[3];
const B = load(BASE), A = load(CAND);
console.log('# baseline v' + B.version + '  candidate v' + A.version);
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const FOCUS = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPER = ['beginner','intermediate','advanced'];
const GOALS = [
  {tag:'run_half',    cg:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}, types:['run'], evt:true, race:'2026-12-06'},
  {tag:'run_5k',      cg:{run:{id:'run_5k',label:'5K',mileBestMins:'8',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}}, types:['run'], evt:true, race:'2026-11-15'},
  {tag:'run_10k',     cg:{run:{id:'run_10k',label:'10K',mileBestMins:'8',mileBestSecs:'30',baselineDist:'4',baseline:'4mi'}}, types:['run'], evt:true, race:'2026-11-29'},
  {tag:'run_marathon',cg:{run:{id:'run_marathon',label:'Marathon',mileBestMins:'9',mileBestSecs:'00',baselineDist:'8',baseline:'8mi'}}, types:['run'], evt:true, race:'2027-02-28'},
  {tag:'run_pace',    cg:{run:{id:'run_pace_goal',label:'Pace',targetMins:'13',targetSecs:'0',mileBestMins:'10',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'}}, types:['run'], evt:false},
  {tag:'run_base',    cg:{run:{id:'run_base',label:'Base',mileBestMins:'11',mileBestSecs:'0',baselineDist:'2',baseline:'2mi'}}, types:['run'], evt:false},
  {tag:'bike_ftp',    cg:{bike:{id:'bike_ftp',label:'FTP',ftp:'200'}}, types:['bike'], evt:false},
  {tag:'swim_500',    cg:{swim:{id:'swim_500_time',label:'500',targetMins:'9',targetSecs:'0',swimUnit:'yd'}}, types:['swim'], evt:false},
];
const REST = [['sun'],['sun','wed'],['tue','fri','sun']];
function mkCfg(g, eq, fo, ex, rest, seed){
  const c = { name:'DIGEST', primaryPath: g.evt ? 'event' : 'fitness', cardioTypes: g.types.slice(),
    cardioGoals: JSON.parse(JSON.stringify(g.cg)), eventTargeted: g.evt,
    liftingFocus: fo, experience: ex, ageBracket: '18-35', equipment: eq, unit:'lbs',
    restDays: rest.slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: seed };
  if (g.evt) c.raceDate = g.race;
  return c;
}
let n = 0, same = 0, diff = [], unstable = 0;
let seed = 1013;
GOALS.forEach(g => EQUIP.forEach(eq => FOCUS.forEach(fo => {
  const ex = EXPER[n % 3], rest = REST[n % 3];
  seed = (seed * 31 + 17) % 99991;
  const cfg = mkCfg(g, eq, fo, ex, rest, seed);
  const cfgB = JSON.parse(JSON.stringify(cfg)), cfgA = JSON.parse(JSON.stringify(cfg));
  let db, db2, da;
  try { db = progDigest(B.buildProgram(cfgB)); } catch (e) { db = 'THREW:' + e.message; }
  try { db2 = progDigest(B.buildProgram(JSON.parse(JSON.stringify(cfg)))); } catch (e) { db2 = 'THREW:' + e.message; }
  try { da = progDigest(A.buildProgram(cfgA)); } catch (e) { da = 'THREW:' + e.message; }
  n++;
  if (db !== db2) { unstable++; return; }                       // baseline not self-stable: do not diff
  if (db === da) same++; else diff.push([g.tag, eq, fo, ex, seed, db, da].join(' '));
})));
console.log('lattice configs: ' + n);
console.log('baseline self-stable: ' + (n - unstable) + '/' + n);
console.log('digest identical V194 == V195: ' + same + '/' + (n - unstable));
if (diff.length) { console.log('DIGEST DRIFT:'); diff.slice(0, 20).forEach(x => console.log('  ' + x)); }
console.log(diff.length === 0 && unstable === 0 ? 'DIGEST NEUTRAL: proven over ' + n + ' configs' : 'NOT DIGEST NEUTRAL');
process.exit(diff.length === 0 && unstable === 0 ? 0 : 1);
