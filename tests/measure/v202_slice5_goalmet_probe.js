// V202 slice 5 probe — E7/E12 before/after on two artifacts. Read-only.
// usage: node tests/measure/v202_slice5_goalmet_probe.js <baseArtifact> <newArtifact>
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const BASE = process.argv[2], NEW = process.argv[3];
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEED = 24865;
const base = over => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign({
  id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
  baselineDist:'3', baseline:'3mi' }, g) } }, over || {}));

// hand arithmetic, typed here (same tables as g202_pace_anchor.js)
const EXP_DEFAULT = { beginner:690, intermediate:570, advanced:450 };
const MI_PER_KM = 0.621;
const HAND_COLS = [ {d:1,k:'mile'}, {d:3.107,k:'fiveK'}, {d:6.214,k:'tenK'}, {d:13.109,k:'half'}, {d:26.219,k:'marathon'} ];
const HAND_CHART = [
  [300,330,345,360,375],[330,360,375,390,410],[360,390,405,435,445],[390,425,440,455,480],
  [420,460,475,500,515],[450,485,505,525,550],[480,520,540,570,585],[510,550,570,595,615],
  [540,580,600,640,650],[570,615,635,665,685],[600,640,665,705,720],[630,675,695,730,755],
  [660,700,720,775,780],[690,735,755,795,800],[720,760,785,845,825],
].map(r=>({mile:r[0],fiveK:r[1],tenK:r[2],half:r[3],marathon:r[4]}));
function handRow(ms){ const R=HAND_CHART,K=['mile','fiveK','tenK','half','marathon'];
  if(ms<=R[0].mile) return Object.assign({},R[0]); if(ms>=R[R.length-1].mile) return Object.assign({},R[R.length-1]);
  for(let i=0;i<R.length-1;i++){ if(ms>=R[i].mile&&ms<=R[i+1].mile){ const f=(ms-R[i].mile)/(R[i+1].mile-R[i].mile),o={};
    for(const k of K) o[k]=Math.round(R[i][k]+(R[i+1][k]-R[i][k])*f); return o; } } return Object.assign({},R[R.length-1]); }
function handRowPaceAt(row,dm){ let run=-Infinity;
  const v=HAND_COLS.map(c=>{run=Math.max(run,+row[c.k]);return{d:c.d,p:run};}); const d=+dm;
  if(!(d>0)||d<=v[0].d) return v[0].p; if(d>=v[v.length-1].d) return v[v.length-1].p;
  for(let i=0;i<v.length-1;i++){ if(d>=v[i].d&&d<=v[i+1].d){
    const f=(Math.log(d)-Math.log(v[i].d))/(Math.log(v[i+1].d)-Math.log(v[i].d));
    return v[i].p+(v[i+1].p-v[i].p)*f; } } return v[v.length-1].p; }
const hsecs=(m,s)=>(+m)*60+(+s), hmiles=(d,u)=>u==='km'?(+d)*MI_PER_KM:(+d);

function probe(ART, tag){
  const IA = load(ART);
  const build = cfg => IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const progression = (prog,cfg) => { const tw=prog.totalWeeks;
    const bm=parseFloat(cfg.cardioGoals.run.baselineDist)||1.5;
    return JSON.parse(IA.eval(`(function(){
      const p = buildRunProgressionForLength('run_pace_goal', ${tw}, ${bm}, '${cfg.experience}', true).paceProgression;
      return JSON.stringify({ arr:Array.from(p), dampened:p._dampened, gain:p._weeklyGain,
        real:p._realisticTarget, orig:p._originalTarget, goalMet:p._goalMet,
        ip:buildRunProgressionForLength._initialPace, tp:buildRunProgressionForLength._targetPace }); })()`)); };
  const out = { tag, version: IA.version };

  // ── the printed case ──
  const PC = paceGoal({ targetDist:'2', targetMins:'16', targetSecs:'00', targetTime:'16:00',
    paceUnit:'km', mileBestMins:'11', mileBestSecs:'30', mileBestSrc:{kind:'entered'} },
    { experience:'beginner' });
  const pcProg = build(PC);
  out.printed = progression(pcProg, PC);
  out.printedHandIP = handRowPaceAt(handRow(EXP_DEFAULT.beginner), hmiles('2','km'));
  // INT note on the printed case
  const notes = [];
  Object.keys(pcProg.weeks||{}).sort((a,b)=>+a-+b).forEach(w=>DAYS.forEach(d=>{
    const day=(pcProg.weeks[w]||{})[d]; if(!day) return; let c=day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s=>{ if(s&&s.type==='run') notes.push({w:+w,st:s.subtype||'',note:s.note||''}); });
  }));
  out.printedIntNotes = Array.from(new Set(notes.filter(n=>/Interval/i.test(n.st)).map(n=>n.note)));

  // ── 360-build lattice ──
  const MILES=[['6','00'],['7','30'],['8','15'],['9','45']];
  const GOALS=[{targetDist:'1.5',targetMins:'10',targetSecs:'30'},{targetDist:'1.5',targetMins:'9',targetSecs:'00'},
    {targetDist:'2',targetMins:'14',targetSecs:'00'},{targetDist:'3',targetMins:'21',targetSecs:'30'},
    {targetDist:'5',targetMins:'25',targetSecs:'00'}];
  const lat=[];
  for(const exp of ['beginner','intermediate','advanced'])
   for(const age of ['18-35','36-54','55+'])
    for(const unit of ['mi','km'])
     for(const mb of MILES)
      for(const g of GOALS){
        const goal=Object.assign({id:'run_pace_goal',label:'Hit a Pace / Time Goal',paceUnit:unit,
          baselineDist:'3',baseline:'3mi',mileBestMins:mb[0],mileBestSecs:mb[1]},g,
          {targetTime:g.targetMins+':'+g.targetSecs});
        const cfg=paceGoal(goal,{experience:exp,ageBracket:age});
        const prog=build(cfg); const pp=progression(prog,cfg);
        const anchorMile = exp==='beginner'?EXP_DEFAULT.beginner:hsecs(mb[0],mb[1]);
        const d = hmiles(g.targetDist,unit);
        const handIP = handRowPaceAt(handRow(anchorMile), d);
        const handTarget = hsecs(g.targetMins,g.targetSecs)/d;
        lat.push({key:`${exp}/${age}/${unit}/${mb.join(':')}/${g.targetDist}@${g.targetMins}:${g.targetSecs}`,
          slower: handTarget>=handIP, handIP, handTarget, arr:pp.arr, damp:pp.dampened,
          goalMet:pp.goalMet, orig:pp.orig, gain:pp.gain, dig:progDigest(prog)});
      }
  out.lat = lat;

  // ── populations that must not move ──
  out.manny = progDigest(build(fixtures.HALF_MANNY));
  out.runBase = progDigest(build(base({cardioGoals:{run:{id:'run_base',label:'Build a Base',
    mileBestMins:'8',mileBestSecs:'15',baselineDist:'3',baseline:'3mi'}}, eventTargeted:false, raceDate:null})));
  out.nrc5k = progDigest(build(base({cardioGoals:{run:{id:'run_5k',label:'5K',
    mileBestMins:'8',mileBestSecs:'15',baselineDist:'3',baseline:'3mi'}}})));
  out.bike = progDigest(build(base({cardioTypes:['bike'],cardioGoals:{bike:{id:'bike_endurance',label:'Bike Endurance',baselineDist:'10',baseline:'10mi'}}, eventTargeted:false, raceDate:null})));
  out.swim = progDigest(build(base({cardioTypes:['swim'],cardioGoals:{swim:{id:'swim_distance',label:'Swim Distance',baselineDist:'500',baseline:'500m'}}, eventTargeted:false, raceDate:null})));

  // ── slice 3 pinned cfg: INT W1 ──
  const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
    mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
  const pProg = build(PINNED);
  const ints=[];
  Object.keys(pProg.weeks||{}).sort((a,b)=>+a-+b).forEach(w=>DAYS.forEach(d=>{
    const day=(pProg.weeks[w]||{})[d]; if(!day) return; let c=day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s=>{ if(s&&s.type==='run'&&/Interval/.test(s.subtype||''))
      ints.push({w:+w,tgt:(s.dose||{}).tgt,detail:(s.detail||'').slice(0,60)}); });
  }));
  out.pinnedWeeks = pProg.totalWeeks;
  out.pinnedInt = ints;
  out.pinnedPP = progression(pProg, PINNED);
  out.pinnedDigest = progDigest(pProg);
  return out;
}

const A = probe(BASE,'BASE(pre-slice5)'), B = probe(NEW,'NEW(slice5)');
const f = n => (n==null?'null':(+n).toFixed(1));
console.log('=== PRINTED CASE  beginner/km, mile 11:30, goal 2 km in 16:00 ===');
for(const o of [A,B]) console.log(`  ${o.tag} v${o.version}: pp=[${o.printed.arr.join(', ')}] ip=${f(o.printed.ip)} tp=${f(o.printed.tp)} real=${f(o.printed.real)} orig=${f(o.printed.orig)} dampened=${o.printed.dampened} goalMet=${o.printed.goalMet}`);
console.log(`  hand anchor (690 row read at ${hmiles('2','km').toFixed(4)} mi) = ${A.printedHandIP.toFixed(4)}`);
console.log('  INT notes BASE:'); A.printedIntNotes.forEach(n=>console.log('    | '+n));
console.log('  INT notes NEW:');  B.printedIntNotes.forEach(n=>console.log('    | '+n));

const DASH=/\s[—–-]\s/;
B.printedIntNotes.forEach(n=>console.log(`  dash-regex /\\s[—–-]\\s/ on new note: ${DASH.test(n)?'MATCH (VIOLATION)':'no match (clean)'} :: ${n.slice(0,60)}`));

console.log('\n=== LATTICE 360 ===');
const slower=A.lat.filter(r=>r.slower), faster=A.lat.filter(r=>!r.slower);
console.log(`  hand census: ${slower.length} of ${A.lat.length} goal AT-OR-SLOWER than own distance-converted anchor; ${faster.length} of ${A.lat.length} faster`);
let chgS=0, chgF=0, flatAtIP=0, flatAtGoalBase=0, dampBad=[], origBad=[], firstS=null, firstF=null;
for(let i=0;i<A.lat.length;i++){
  const a=A.lat[i], b=B.lat[i];
  const moved = a.dig!==b.dig;
  if(a.slower){ if(moved){chgS++; if(!firstS) firstS=`${a.key}\n      base pp=[${a.arr.join(', ')}]\n      new  pp=[${b.arr.join(', ')}]`;}
    if(new Set(b.arr).size===1 && Math.abs(b.arr[0]-(+a.handIP.toFixed(1)))<1e-9) flatAtIP++;
    if(new Set(a.arr).size===1 && Math.abs(a.arr[0]-(+a.handTarget.toFixed(1)))<0.06) flatAtGoalBase++;
    if(b.damp!==false) dampBad.push(a.key+' dampened='+b.damp);
    if(Math.abs(b.orig-(+a.handTarget.toFixed(1)))>0.06) origBad.push(`${a.key} orig=${b.orig} want ${a.handTarget.toFixed(1)}`);
  } else { if(moved){chgF++; if(!firstF) firstF=`${a.key} base=${a.dig} new=${b.dig}\n      base pp=[${a.arr.join(', ')}]\n      new  pp=[${b.arr.join(', ')}]`;} }
}
console.log(`  CHANGED program digests, at-or-slower class : ${chgS} of ${slower.length}`);
console.log(`  CHANGED program digests, FASTER class       : ${chgF} of ${faster.length}   <-- must be 0`);
if(firstF) console.log('    first faster-class move: '+firstF);
if(firstS) console.log('    first at-or-slower move: '+firstS);
console.log(`  BASE: flat on the ENTERED GOAL              : ${flatAtGoalBase} of ${slower.length}`);
console.log(`  NEW : flat on the HAND anchor (initialPace) : ${flatAtIP} of ${slower.length}`);
console.log(`  NEW : _dampened false across the class      : ${slower.length-dampBad.length} of ${slower.length}` + (dampBad.length?' first miss '+dampBad[0]:''));
console.log(`  NEW : _originalTarget == ENTERED goal       : ${slower.length-origBad.length} of ${slower.length}` + (origBad.length?' first miss '+origBad[0]:''));

console.log('\n=== POPULATIONS THAT MUST NOT MOVE ===');
for(const k of ['manny','nrc5k','runBase','bike','swim'])
  console.log(`  ${k.padEnd(8)} base=${A[k]} new=${B[k]}  ${A[k]===B[k]?'UNMOVED':'*** MOVED ***'}`);

console.log('\n=== SLICE 3 PINNED CFG (8:15 mile, 10:30/1.5 mi) ===');
for(const o of [A,B]) console.log(`  ${o.tag}: weeks=${o.pinnedWeeks} ip=${o.pinnedPP.ip} dampened=${o.pinnedPP.dampened} gain=${o.pinnedPP.gain} goalMet=${o.pinnedPP.goalMet} digest=${o.pinnedDigest}\n     INT: ${o.pinnedInt.map(i=>'W'+i.w+' tgt '+i.tgt).join(' | ')}\n     W1 detail: ${(o.pinnedInt[0]||{}).detail}`);
