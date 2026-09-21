// v201 D95: (a) does the mile anchor reach run_pace_goal sessions at all?
// (b) what does commitGoalChange's cfg edit do to a live half program?
const path=require('path');
const {load,fixtures,weekGrid,progDigest}=require(path.join(__dirname,'..','harness.js'));
const IA=load(process.argv[2]);
const P=console.log;
P('IA_VERSION',IA.IA_VERSION);

// ── (a) run_pace_goal: vary mile best across the whole chart ─────────────────
function pg(mm,ss,exp='intermediate'){
  return {...fixtures.HALF_MANNY,raceDate:null,eventTargeted:false,experience:exp,
    cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',targetMins:'10',targetSecs:'0',
      targetTime:'10:00',paceUnit:'mi',baselineDist:'5',baseline:'5mi',mileBestMins:mm,mileBestSecs:ss,mileBestSrc:{kind:'entered'}}}};
}
P('\n=== run_pace_goal, target 1.5 mi in 10:00, seed 76308, mile anchor swept ===');
let prev=null;
[['5','0'],['6','30'],['8','0'],['10','30'],['12','0'],['',''],['14','0']].forEach(([mm,ss])=>{
  const p=IA.buildProgram(pg(mm,ss));
  const g=weekGrid(p,{showRest:true});
  // pull every printed pace token from cardio details
  const paces=new Set();
  Object.keys(p.weeks).forEach(w=>Object.keys(p.weeks[w]).forEach(d=>{
    const c=p.weeks[w][d]&&p.weeks[w][d].cardio; if(!c)return;
    (Array.isArray(c)?c:[c]).forEach(s=>String(s.detail||'').replace(/\d+:\d\d\/mi/g,m=>{paces.add(m);return m;}));
  }));
  const dg=progDigest(p);
  P('  mile='+((mm||'(none)')+':'+(ss||'00')).padEnd(9),'totalWeeks='+p.totalWeeks,
    'digest='+dg,(prev&&prev===dg?'IDENTICAL to previous':''),
    '\n      printed paces:',[...paces].sort().join(' ')||'(none)');
  prev=dg;
});
P('\n=== same sweep, target 1.5 mi in 7:30 (aggressive) ===');
function pg2(mm,ss){const c=pg(mm,ss);c.cardioGoals.run.targetMins='7';c.cardioGoals.run.targetSecs='30';c.cardioGoals.run.targetTime='7:30';return c;}
[['5','0'],['8','0'],['10','30'],['12','0']].forEach(([mm,ss])=>{
  const p=IA.buildProgram(pg2(mm,ss));
  P('  mile='+mm+':'+ss,'totalWeeks='+p.totalWeeks,'digest='+progDigest(p));
});

// ── (b) commitGoalChange: the exact cfg edit it performs ────────────────────
// Reproduced from index.html commitGoalChange(): next={id,label,baseline:''} (+targets).
P('\n=== Q7: goal switch half -> run_pace_goal, exactly as commitGoalChange writes cfg ===');
const before={...fixtures.HALF_MANNY};   // run_half, mileBest 10:30, raceDate 2026-12-06
const bp=IA.buildProgram(before);
const next={id:'run_pace_goal',label:'Hit a Pace / Time Goal',baseline:'',
  targetMins:'10',targetSecs:'0',targetTime:'10:00',targetDist:'1.5',paceUnit:'mi'};
const after={...before,cardioGoals:{...before.cardioGoals,run:next}};   // raceDate/eventTargeted UNCHANGED
const ap=IA.buildProgram(after);
P('  BEFORE cfg.cardioGoals.run =',JSON.stringify(before.cardioGoals.run));
P('  AFTER  cfg.cardioGoals.run =',JSON.stringify(after.cardioGoals.run));
P('  mileBestMins survived?',('mileBestMins' in after.cardioGoals.run));
P('  raceDate still on cfg?',after.raceDate,' eventTargeted:',after.eventTargeted);
P('  raceAlignment after switch:',JSON.stringify(IA.raceAlignment(next.id,after.raceDate,after.eventTargeted!==false)));
P('  totalWeeks: before',bp.totalWeeks,'-> after',ap.totalWeeks);
const bw=Object.keys(bp.weeks).length, aw=Object.keys(ap.weeks).length;
P('  week objects: before',bw,'after',aw,' weeks that cease to exist:',Math.max(0,bw-aw));
// how many day-slots differ in the weeks that survive
let same=0,diff=0;
Object.keys(ap.weeks).forEach(w=>Object.keys(ap.weeks[w]).forEach(d=>{
  const x=bp.weeks[w]&&bp.weeks[w][d], y=ap.weeks[w][d];
  if(!x){diff++;return;} (JSON.stringify(x)===JSON.stringify(y))?same++:diff++;
}));
P('  in the surviving',aw,'weeks:',diff,'day-slots changed,',same,'unchanged, of',diff+same);
// same, reversed: half -> 1.5mi -> back to half WITHOUT the mile time
P('\n=== Q7b: switch BACK to run_half after the pace-goal detour (mileBest gone) ===');
const back={...after,cardioGoals:{run:{id:'run_half',label:'Half Marathon',baseline:''}}};
const kp=IA.buildProgram(back);
P('  totalWeeks back-to-half:',kp.totalWeeks,' digest:',progDigest(kp),' vs original half digest:',progDigest(bp));
let d2=0,t2=0;
Object.keys(kp.weeks).forEach(w=>Object.keys(kp.weeks[w]).forEach(d=>{
  const x=bp.weeks[w]&&bp.weeks[w][d],y=kp.weeks[w][d];t2++;if(JSON.stringify(x)!==JSON.stringify(y))d2++;}));
P('  day-slots differing from the ORIGINAL half build:',d2,'/',t2);
const f=p=>{const o=[];Object.keys(p.weeks).forEach(w=>Object.keys(p.weeks[w]).forEach(d=>{const c=p.weeks[w][d]&&p.weeks[w][d].cardio;if(!c)return;
  (Array.isArray(c)?c:[c]).forEach(s=>{const m=String(s.detail||'').match(/\d+:\d\d\/mi/g);if(m)m.forEach(x=>o.push(x));});}));return [...new Set(o)].sort();};
P('  original half printed paces:',f(bp).join(' '));
P('  after round-trip printed paces:',f(kp).join(' '));
