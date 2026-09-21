// v201 D95 before-picture: pace anchor storage, readers, rebuild diff, resume arithmetic.
// Read-only. Oracle for Q8 is date arithmetic done here, not raceAlignment's own output.
const path=require('path');
const {load,fixtures,weekGrid,progDigest}=require(path.join(__dirname,'..','harness.js'));
const ART=process.argv[2];
const IA=load(ART);
const out=[];const P=(...a)=>{out.push(a.join(' '));console.log(...a);};

P('ARTIFACT',ART,'IA_VERSION',IA.IA_VERSION);

// ── Q3/Q4 lattice ────────────────────────────────────────────────────────────
const GOALS=[['run_half','Half Marathon'],['run_marathon','Marathon'],['run_5k','5K'],['run_10k','10K'],
             ['run_pace_goal','Hit a Pace / Time Goal'],['run_base','Build a Base']];
const EXPS=['beginner','intermediate','advanced'];
const FOCUSES=['support_prevention','support_strength','support_athletic','hypertrophy'];
const EQUIP=['crossfit','full_gym','dumbbells'];
const SEEDS=[76308,11111,4242];
const PACES=[['10:30',630],['8:00',480]];

function mk(goalId,label,exp,focus,eq,seed,mm,ss,raceDate){
  const g={id:goalId,label,baselineDist:'5',baseline:'5mi',mileBestMins:mm,mileBestSecs:ss,mileBestSrc:{kind:'entered'}};
  if(goalId==='run_pace_goal'){g.targetDist='1.5';g.targetMins='10';g.targetSecs='0';g.targetTime='10:00';g.paceUnit='mi';}
  return {...fixtures.HALF_MANNY,cardioGoals:{run:g},
    experience:exp,liftingFocus:focus,equipment:eq,seed,
    raceDate:(goalId==='run_half'||goalId==='run_marathon')?raceDate:null,
    eventTargeted:(goalId==='run_half'||goalId==='run_marathon')};
}
const RACE='2026-12-06';

let cfgN=0,sessTot=0,sessDiff=0,twMoved=0;
const seg={};
GOALS.forEach(([gid,lab])=>EXPS.forEach(exp=>FOCUSES.forEach(f=>EQUIP.forEach(eq=>SEEDS.forEach(sd=>{
  const a=IA.buildProgram(mk(gid,lab,exp,f,eq,sd,'10','30',RACE));
  const b=IA.buildProgram(mk(gid,lab,exp,f,eq,sd,'8','0',RACE));
  const ga=weekGrid(a,{showRest:true}).split('\n'), gb=weekGrid(b,{showRest:true}).split('\n');
  // session-level diff: compare full day JSON per week/day
  let n=0,tot=0;
  const wks=Object.keys(a.weeks);
  wks.forEach(w=>Object.keys(a.weeks[w]).forEach(d=>{
    const da=a.weeks[w][d], db=(b.weeks[w]||{})[d];
    tot++; if(JSON.stringify(da)!==JSON.stringify(db)) n++;
  }));
  cfgN++; sessTot+=tot; sessDiff+=n;
  if(a.totalWeeks!==b.totalWeeks) twMoved++;
  const k=gid+'/'+exp;
  seg[k]=seg[k]||{cfgs:0,days:0,diff:0,gridlines:0,griddiff:0,tw:a.totalWeeks};
  seg[k].cfgs++; seg[k].days+=tot; seg[k].diff+=n;
  seg[k].gridlines+=ga.length;
  for(let i=0;i<Math.max(ga.length,gb.length);i++) if(ga[i]!==gb[i]) seg[k].griddiff++;
}))))); 

P('');
P('=== Q4 LATTICE: mile anchor 10:30 -> 8:00, seed pinned ===');
P('configs:',cfgN,' day-slots compared:',sessTot,' day-slots changed:',sessDiff,
  ' ('+(100*sessDiff/sessTot).toFixed(2)+'%)  totalWeeks moved in',twMoved,'of',cfgN);
P('segmented goal/experience: day-slots-changed / day-slots  (weekGrid lines changed / lines)');
Object.keys(seg).sort().forEach(k=>{const s=seg[k];
  P('  '+k.padEnd(34),String(s.diff).padStart(5)+'/'+String(s.days).padEnd(6),
    (100*s.diff/s.days).toFixed(1)+'%',' grid '+s.griddiff+'/'+s.gridlines,' tw='+s.tw);});

// ── Q4 detail: the reporter config, line-by-line diff ────────────────────────
P('');P('=== Q4 DETAIL: HALF_MANNY seed 76308, 10:30 vs 8:00 ===');
const A=IA.buildProgram(mk('run_half','Half Marathon','intermediate','support_prevention','crossfit',76308,'10','30',RACE));
const B=IA.buildProgram(mk('run_half','Half Marathon','intermediate','support_prevention','crossfit',76308,'8','0',RACE));
P('totalWeeks A',A.totalWeeks,'B',B.totalWeeks,' digest A',progDigest(A),'B',progDigest(B));
const la=weekGrid(A,{showRest:true}).split('\n'), lb=weekGrid(B,{showRest:true}).split('\n');
let changed=0;
for(let i=0;i<la.length;i++) if(la[i]!==lb[i]) changed++;
P('weekGrid lines changed:',changed,'/',la.length,'(weekGrid shows titles+names only, not pace text)');
// full day JSON diff, and WHERE inside the day
let dayDiff=0,cardioDiff=0,liftDiff=0;const changedDays=[];
Object.keys(A.weeks).forEach(w=>Object.keys(A.weeks[w]).forEach(d=>{
  const x=A.weeks[w][d],y=B.weeks[w][d];
  if(JSON.stringify(x)===JSON.stringify(y))return;
  dayDiff++;
  const cd=JSON.stringify(x.cardio)!==JSON.stringify(y.cardio);
  const ld=JSON.stringify(x.sections)!==JSON.stringify(y.sections);
  if(cd)cardioDiff++; if(ld)liftDiff++;
  changedDays.push('W'+w+' '+d.toUpperCase()+' '+(cd?'CARDIO':'')+(ld?' LIFT':''));
}));
P('day-slots changed:',dayDiff,' cardio changed:',cardioDiff,' lift sections changed:',liftDiff);
P('changed days:',changedDays.join(' | '));
// print first 12 changed cardio details verbatim
let shown=0;
Object.keys(A.weeks).forEach(w=>Object.keys(A.weeks[w]).forEach(d=>{
  if(shown>=12)return;
  const x=A.weeks[w][d],y=B.weeks[w][d];
  const cx=JSON.stringify(x.cardio),cy=JSON.stringify(y.cardio);
  if(cx===cy)return; shown++;
  const f=o=>{const c=o.cardio;if(!c)return'(none)';const a=Array.isArray(c)?c:[c];
    return a.map(s=>(s.subtype||s.type)+' :: '+String(s.detail||'').replace(/\n/g,' / ').slice(0,150)).join(' ;; ');};
  P(' W'+w+' '+d.toUpperCase());P('   10:30 -> '+f(x));P('   8:00  -> '+f(y));
}));

// ── Q3: runAnchorInfo chips across the same anchor change ────────────────────
P('');P('=== Q3 ANCHOR ROW (runAnchorInfo, the stated single source of every printed pace) ===');
[['10','30'],['8','0'],['4','0'],['20','0'],['','']].forEach(([mm,ss])=>{
  const c=mk('run_half','Half Marathon','intermediate','support_prevention','crossfit',76308,mm,ss,RACE);
  const a=IA.runAnchorInfo?IA.runAnchorInfo(c):null;
  P('  entered',(mm||'(none)')+':'+(ss||'00'),'->',a?JSON.stringify({anchorSec:a.anchorSec,rawSec:a.rawSec,clamped:a.clamped,kind:a.kind,row:a.row}):'(runAnchorInfo not exported)');
});
['beginner','intermediate','advanced'].forEach(e=>{
  const c=mk('run_half','Half Marathon',e,'support_prevention','crossfit',76308,'8','0',RACE);
  const a=IA.runAnchorInfo?IA.runAnchorInfo(c):null;
  P('  exp',e,'entered 8:00 ->',a?('anchorSec='+a.anchorSec+' kind='+a.kind):'n/a');
});

// ── Q8: resume arithmetic. Oracle = date arithmetic computed here. ───────────
P('');P('=== Q8 RACE ALIGNMENT, suspended 5 weeks (same race date) ===');
function isoAdd(iso,days){const p=iso.split('-').map(Number);const d=new Date(p[0],p[1]-1,p[2]);d.setDate(d.getDate()+days);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const TODAY='2026-09-20';
[['run_half',RACE],['run_marathon',RACE]].forEach(([gid,race])=>{
  [0,35].forEach(shift=>{
    const t=isoAdd(TODAY,shift);
    const al=IA.raceAlignment(gid,race,true,t);
    // independent oracle: whole weeks from Monday-of-today to race Monday
    const md=(s)=>{const p=s.split('-').map(Number);const d=new Date(p[0],p[1]-1,p[2]);const wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);return d;};
    const oracleWeeksOut=Math.round((md(race)-md(t))/86400000/7);
    P('  '+gid+' today='+t+' -> '+JSON.stringify(al));
    P('    oracle whole weeks Mon(today)->Mon(race):',oracleWeeksOut,
      ' plan weeks:',(IA.NRC_PLAN_WEEKS?IA.NRC_PLAN_WEEKS[gid]:'?'),
      ' => weeks of plan that cannot fit:',(IA.NRC_PLAN_WEEKS?IA.NRC_PLAN_WEEKS[gid]-(oracleWeeksOut+1):'?'));
  });
});
P('');P('=== Q8 BUILT PROGRAM, race fixed, "today" simulated by shifting race date back 5 wk ===');
[[RACE,'on time'],[isoAdd(RACE,-35),'resumed 5 wk late (equivalent)']].forEach(([rd,lab])=>{
  const c=mk('run_half','Half Marathon','intermediate','support_prevention','crossfit',76308,'10','30',rd);
  let p;try{p=IA.buildProgram(c);}catch(e){P('  '+lab+' CRASH: '+e.message);return;}
  const al=IA.raceAlignment('run_half',rd,true,TODAY);
  const wks=Object.keys(p.weeks).map(Number).sort((a,b)=>a-b);
  const longs=wks.map(w=>{const dd=p.weeks[w];let L='';Object.keys(dd).forEach(d=>{const c2=dd[d]&&dd[d].cardio;const arr=c2?(Array.isArray(c2)?c2:[c2]):[];
    arr.forEach(s=>{if(/long|race/i.test(String(s.subtype||'')))L=String(s.subtype)+'/'+String(s.detail||'').split('\n')[0].slice(0,40);});});return 'w'+w+':'+(L||'-');});
  P('  '+lab+' raceDate='+rd+' totalWeeks='+p.totalWeeks+' openWeek='+(al&&al.openWeek)+' behindWeeks='+(al&&al.behindWeeks)+' underFloor='+(al&&al.underFloor));
  P('    long/race session per week: '+longs.join(' | '));
});
P('');P('DONE lines='+out.length);
