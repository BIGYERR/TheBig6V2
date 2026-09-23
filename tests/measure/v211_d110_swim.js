// V211 measure (Mode B) — D110 before-picture: the swim pace anchor and the swim progression cap.
// Read-only against the working-tree index.html (V206 candidate). No source surgery.
// ORACLES (independent of buildSwimSession):
//   anchor   — the wizard's own contract: "Your current <500|100><unit> time?" (index.html:2811).
//              Entered anchor E = base seconds / (dist/100). A card "derives from the athlete's own
//              time" iff its week-1 goal split prints clock(E).
//   SI pace  — NSW PTG 22-page edition (Guide A) p12 (doctrine/physicaltrainingguide2020.txt:251-256):
//              "for swimming, your 100 yard interval pace should be 2 seconds faster than your base",
//              base = most recent 500-yard swim per 100; worked example 10:30 -> 2:06 -> 2:04.
//   rep cap  — Guide A p12 line 260: "Do not run or swim more than 8 intervals". Guide B Table 6 INT to 10.
//   goal     — T = target seconds / (dist/100), date-free arithmetic.
// Nothing here asks the engine what the expected value is.
const path=require('path'),fs=require('fs');
const H=require(path.join(__dirname,'..','harness.js'));
const SRC=path.join(__dirname,'..','..','index.html');
const IA=H.load(SRC);
const P=s=>console.log(s);
P('ia-version '+IA.version+'  buildProgram '+typeof IA.buildProgram);
const clk=s=>{ let t=Math.round(s); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); };
const toS=m=>{ const a=m.split(':'); return (+a[0])*60+(+a[1]); };
const cardsOf=(prog)=>{ const out=[]; for(const wk of Object.keys(prog.weeks||{})) for(const d of Object.keys(prog.weeks[wk]||{})){ const day=prog.weeks[wk][d]; if(!day||!day.cardio) continue; const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio]; cs.forEach(c=>c&&out.push({w:+wk,d,c})); } return out; };
function mkCfg(o){
  const c=JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  c.cardioTypes=o.mix==='swim'?['swim']:['run','swim'];
  c.experience=o.exp; c.ageBracket=o.age; c.seed=o.seed; c.primaryPath='goal'; c.eventTargeted=o.ev; delete c.raceDate;
  const g={id:o.goal,label:o.goal,swimUnit:o.unit};
  if(o.tgt!=null){ g.targetMins=String(Math.floor(o.tgt/60)); g.targetSecs=String(o.tgt%60); }
  if(o.base!=null){ g.baseMins=String(Math.floor(o.base/60)); g.baseSecs=String(o.base%60); }
  c.cardioGoals={swim:g};
  if(o.mix!=='swim') c.cardioGoals.run={id:'run_base',label:'Run Base',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'};
  return c;
}
// ── self-stability first ──
{ const c=mkCfg({goal:'swim_500_time',exp:'intermediate',age:'18-35',seed:76308,ev:false,unit:'yd',tgt:450,base:616,mix:'swim'});
  const a=H.progDigest(IA.buildProgram(c)), b=H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(c))));
  P('self-stable '+(a===b?'yes':'NO')+' '+a); if(a!==b) process.exit(3); }
// HALF_MANNY swim exposure
{ const m=IA.buildProgram(IA.fixtures.HALF_MANNY); const sw=cardsOf(m).filter(x=>x.c.type==='swim').length;
  P('HALF_MANNY digest '+H.progDigest(m)+' | pinned '+H.MANNY_DIGEST_BY_VERSION[IA.version]+' | swim sessions in HALF_MANNY: '+sw); }

const BASES={swim_500_time:[null,390,480,616,750], swim_100_time:[null,65,90,120,150]};
const TGTS ={swim_500_time:[345,450,570,660],     swim_100_time:[58,80,110,140]};
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'], UNITS=['yd','m'], EVS=[false,true], SEEDS=[76308,24865], MIXES=['swim','run+swim'];
const R=[]; let nb=0, crash=0;
const t0=Date.now();
for(const goal of ['swim_500_time','swim_100_time']) for(const exp of EXPS) for(const age of AGES) for(const base of BASES[goal]) for(const tgt of TGTS[goal])
 for(const unit of UNITS) for(const ev of EVS) for(const seed of SEEDS) for(const mix of MIXES){
  if(mix==='run+swim' && (unit==='m'||seed!==76308)) continue;   // multi-sport slice
  const o={goal,exp,age,base,tgt,unit,ev,seed,mix}; let prog;
  try{ prog=IA.buildProgram(mkCfg(o)); }catch(e){ crash++; if(crash<4) P('CRASH '+JSON.stringify(o)+' '+e.message); continue; }
  nb++;
  const tw=Object.keys(prog.weeks||{}).length;
  const cards=cardsOf(prog);
  const ints=cards.filter(x=>x.c.type==='swim'&&/Interval/.test(String(x.c.subtype||'')));
  const taperWks=new Set(cards.filter(x=>x.c.type==='swim'&&/Taper/.test(String(x.c.subtype||''))).map(x=>x.w));
  const dist=goal==='swim_500_time'?500:100;
  const E=base!=null?base/(dist/100):null, T=tgt/(dist/100);
  const rec={o,tw,nInt:ints.length,E,T,cards:[]};
  for(const x of ints){
    const det=String(x.c.detail||''), nt=String(x.c.note||'');
    const mInt=det.match(/at (\d+:\d+)\/100/), mSp=det.match(/goal split of (\d+:\d+)\/100/);
    const mCap=nt.match(/Split capped at \+(-?[\d.]+)s\/100\/week/), mReal=nt.match(/realistic target for this block is (\d+:\d+)\/100/);
    const mReps=det.match(/(\d+) x 100/);
    const mUnit=det.match(/x 100(yd|m) /);
    rec.cards.push({w:x.w,intP:mInt?toS(mInt[1]):null,split:mSp?toS(mSp[1]):null,cap:mCap?+mCap[1]:null,real:mReal?toS(mReal[1]):null,
      reps:mReps?+mReps[1]:null,unit:mUnit?mUnit[1]:null,taper:taperWks.has(x.w),to10:/build to 10\. Hard cap at 10/.test(nt)});
  }
  R.push(rec);
}
P('builds '+nb+'  crashes '+crash+'  ('+((Date.now()-t0)/1000).toFixed(1)+' s)');
if(nb===0){ P('NO BUILDS — measurement failed'); process.exit(4); }

// ── 1. ANCHOR: does the week-1 split derive from the entered time? ──
const seg=(keyFn,pred,filter)=>{ const m={}; for(const r of R){ if(filter&&!filter(r)) continue; const k=keyFn(r); m[k]=m[k]||[0,0]; for(const c of r.cards){ m[k][1]++; if(pred(r,c)) m[k][0]++; } } return Object.entries(m).map(([k,v])=>k+' '+v[0]+'/'+v[1]).join('  '); };
const allCards=R.reduce((a,r)=>a+r.cards.length,0);
const noSplit=R.reduce((a,r)=>a+r.cards.filter(c=>c.split==null).length,0);
P('\n== 1 ANCHOR ==  swim INT cards '+allCards+' over '+nb+' builds; cards with no parsable split: '+noSplit);
const own=(r,c)=>r.E!=null && c.split!=null;
let w1own=0,w1n=0,w1miss=[];
for(const r of R){ const c1=r.cards.filter(c=>c.w===Math.min(...r.cards.map(z=>z.w)))[0]; if(!c1) continue;
  if(r.E!=null){ w1n++; const wk1=c1.w; if(wk1===1 && clk(c1.split)===clk(r.E)) w1own++; else if(wk1===1 && w1miss.length<5) w1miss.push(JSON.stringify(r.o)+' split '+clk(c1.split)+' E '+clk(r.E)); } }
P('builds with base ENTERED whose first INT card is week 1 and prints clock(E): '+w1own+'/'+w1n+(w1miss.length?'  misses: '+w1miss.join(' | '):''));
const blankCards=R.filter(r=>r.E==null).reduce((a,r)=>a+r.cards.length,0);
P('cards on base-BLANK builds (anchor cannot be the athlete\'s time): '+blankCards+'/'+allCards);
// what the blank builds anchor on (week-1 split value, distribution by exp)
const dflt={}; for(const r of R){ if(r.E!=null) continue; const c=r.cards.find(c=>c.w===1); if(!c) continue; const k=r.o.exp+'/'+r.o.goal; dflt[k]=dflt[k]||{}; dflt[k][clk(c.split)]=(dflt[k][clk(c.split)]||0)+1; }
P('base-BLANK week-1 split printed, by exp/goal: '+JSON.stringify(dflt));

// ── 2. SI pace vs Guide A p12 (E - 2 s/100) at week 1, base entered ──
const res={}; for(const r of R){ if(r.E==null) continue; const c=r.cards.find(c=>c.w===1); if(!c||c.intP==null) continue; const d=+(c.intP-(r.E-2)).toFixed(0); const k=r.o.goal; res[k]=res[k]||{}; res[k][d]=(res[k][d]||0)+1; }
P('\n== 2 SI PACE week-1 residual printed_int - (E-2) seconds/100, by goal: '+JSON.stringify(res));
// per anchor value (ratio 0.97 vs -2)
const byE={}; for(const r of R){ if(r.E==null) continue; const c=r.cards.find(c=>c.w===1); if(!c) continue; byE[r.o.goal+' E='+clk(r.E)]=clk(c.intP)+' vs A '+clk(r.E-2); }
P('   examples: '+JSON.stringify(byE));
// Guide A worked example 10:30/500 -> 2:04
{ const c=mkCfg({goal:'swim_500_time',exp:'intermediate',age:'18-35',seed:76308,ev:false,unit:'yd',tgt:540,base:630,mix:'swim'}); const pr=IA.buildProgram(c);
  const w1=cardsOf(pr).filter(x=>x.c.type==='swim'&&/Interval/.test(x.c.subtype)&&x.w===1)[0];
  P('   Guide A worked example (500 in 10:30, goal 9:00): doctrine SI 2:04/100; engine W1 prints: '+(w1?(w1.c.detail.match(/at (\d+:\d+)\/100/)||[])[1]:'NO W1 INT CARD')); }

// 2b. same residual restricted to goal FASTER than entered (the normal case), keyed by entered anchor
{ const m={}; for(const r of R){ if(r.E==null||r.T>=r.E) continue; const c=r.cards.find(c=>c.w===1); if(!c) continue; const k=r.o.goal+' E='+clk(r.E); m[k]=m[k]||{}; const v=clk(c.intP)+' (A: '+clk(r.E-2)+', resid '+(Math.round(c.intP)-Math.round(r.E-2))+')'; m[k][v]=(m[k][v]||0)+1; }
  P('2b SI week-1, goal faster than entered: '+JSON.stringify(m)); }
// 2c. every INT card on base-entered, goal-faster builds: printed int split vs its own printed week split - 2 (Guide A offset)
{ let n=0,eq=0; const d={}; for(const r of R){ if(r.E==null||r.T>=r.E) continue; for(const c of r.cards){ n++; const x=Math.round(c.intP)-Math.round(c.split-2); d[x]=(d[x]||0)+1; if(x===0) eq++; } }
  P('2c all INT cards (base entered, goal faster): printed int split - (printed week split - 2): '+eq+'/'+n+' zero; dist '+JSON.stringify(d)); }
// ── 3. CAP: how often it binds; its value by exp x age; gap at program end ──
P('\n== 3 CAP ==');
const pace=R.filter(r=>r.cards.some(c=>c.split!=null));
const capped=pace.filter(r=>r.cards.some(c=>c.cap!=null));
P('builds whose INT note prints "Split capped": '+capped.length+'/'+pace.length);
P('  by exp: '+['beginner','intermediate','advanced'].map(e=>e+' '+capped.filter(r=>r.o.exp===e).length+'/'+pace.filter(r=>r.o.exp===e).length).join('  '));
P('  by age: '+AGES.map(a=>a+' '+capped.filter(r=>r.o.age===a).length+'/'+pace.filter(r=>r.o.age===a).length).join('  '));
P('  by goal: '+['swim_500_time','swim_100_time'].map(g=>g+' '+capped.filter(r=>r.o.goal===g).length+'/'+pace.filter(r=>r.o.goal===g).length).join('  '));
P('  by base: '+['blank','entered'].map(b=>b+' '+capped.filter(r=>(r.E==null)===(b==='blank')).length+'/'+pace.filter(r=>(r.E==null)===(b==='blank')).length).join('  '));
const capVals={}; for(const r of capped){ const v=r.cards.find(c=>c.cap!=null).cap; const k=r.o.exp+'/'+r.o.age; capVals[k]=capVals[k]||new Set(); capVals[k].add(v); }
P('  printed cap values by exp/age: '+Object.entries(capVals).map(([k,s])=>k+'='+[...s].join(',')).join('  '));
// observed per-week step between consecutive week splits (independent of note)
const steps={}; for(const r of pace){ const byW={}; r.cards.forEach(c=>{ if(c.split!=null) byW[c.w]=c.split; }); const ws=Object.keys(byW).map(Number).sort((a,b)=>a-b); for(let i=1;i<ws.length;i++){ if(ws[i]!==ws[i-1]+1) continue; const s=+(byW[ws[i-1]]-byW[ws[i]]).toFixed(0); const k=r.o.exp+'/'+r.o.age; steps[k]=steps[k]||{}; steps[k][s]=(steps[k][s]||0)+1; } }
P('  observed week-over-week split step (s/100, rounded) by exp/age: '+JSON.stringify(steps));
// end gap: last INT card's printed goal split vs goal T; and vs note's realistic target
let gapN=0,gapSum=0,gapMax=0,gapBins={}, beyond=0, beyondN=0;
for(const r of capped){ const last=r.cards.filter(c=>c.split!=null).sort((a,b)=>b.w-a.w)[0]; const g=last.split-r.T; gapN++; gapSum+=g; gapMax=Math.max(gapMax,g);
  const b=g<5?'<5':g<10?'5-10':g<20?'10-20':g<40?'20-40':'>=40'; gapBins[b]=(gapBins[b]||0)+1;
  const rc=r.cards.find(c=>c.real!=null); if(rc){ beyondN++; if(Math.abs(last.split-rc.real)>=1) beyond++; } }
P('  capped builds: last printed goal split minus athlete goal T (s/100): n='+gapN+' mean '+(gapSum/Math.max(gapN,1)).toFixed(1)+' max '+gapMax.toFixed(1)+' bins '+JSON.stringify(gapBins));
{ const d={}; for(const r of capped){ const last=r.cards.filter(c=>c.split!=null).sort((a,b)=>b.w-a.w)[0]; const rc=r.cards.find(c=>c.real!=null); const cap=r.cards.find(c=>c.cap!=null).cap; const k=(Math.round(last.split-rc.real)-Math.round(cap)); d[k]=(d[k]||0)+1; }
  P('  capped: (last printed split - note realistic target) - printed cap, rounded s: '+JSON.stringify(d)); }
P('  capped builds whose LAST printed split != note\'s "realistic target" (>=1 s): '+beyond+'/'+beyondN);
// goal slower than current (E7 analogue): base entered, T > E
const slow=R.filter(r=>r.E!=null&&r.T>r.E&&r.cards.length);
const slowParked=slow.filter(r=>r.cards.every(c=>c.split!=null&&c.split>r.E+0.5));
P('\n== 3b goal SLOWER than entered time (E7 analogue): builds '+slow.length+'; builds whose EVERY INT split is slower than the athlete\'s entered pace: '+slowParked.length+'/'+slow.length+(slowParked[0]?'  e.g. '+JSON.stringify(slowParked[0].o)+' E '+clk(slowParked[0].E)+' splits '+[...new Set(slowParked[0].cards.map(c=>clk(c.split)))].join(','):''));
// taper: does the split keep moving through taper weeks?
let tapN=0,tapMove=0; for(const r of pace){ const tw=r.cards.filter(c=>c.taper); if(!tw.length) continue; tapN++; const pre=r.cards.filter(c=>!c.taper&&c.w<Math.min(...tw.map(c=>c.w))).sort((a,b)=>b.w-a.w)[0]; if(pre&&tw.some(c=>c.split!==pre.split)) tapMove++; }
P('== 3c builds with taper-week INT cards whose split still moves inside the taper: '+tapMove+'/'+tapN);

// ── 4. reps / note / unit ──
let maxReps=0, over8=0, repN=0, to10=0; for(const r of R) for(const c of r.cards){ if(c.reps!=null){ repN++; maxReps=Math.max(maxReps,c.reps); if(c.reps>8) over8++; } if(c.to10) to10++; }
P('\n== 4 REPS == max swim INT reps printed '+maxReps+'; cards >8 reps (Guide A p12 cap): '+over8+'/'+repN+'; notes saying "build to 10. Hard cap at 10": '+to10+'/'+allCards);
const mcards=R.filter(r=>r.o.unit==='m'); P('   unit=m builds: cards printing x 100m '+mcards.reduce((a,r)=>a+r.cards.filter(c=>c.unit==='m').length,0)+'/'+mcards.reduce((a,r)=>a+r.cards.length,0));
P('   tw distribution: '+JSON.stringify(R.reduce((m,r)=>(m[r.tw]=(m[r.tw]||0)+1,m),{})));

// ── 5. distance swim goals: INT cards with no numeric pace at all ──
let dN=0,dNum=0,dB=0; for(const goal of ['swim_tri','swim_mile','swim_base']) for(const exp of EXPS) for(const seed of SEEDS) for(const ev of EVS){
  const c=mkCfg({goal,exp,age:'18-35',seed,ev,unit:'yd',tgt:null,base:null,mix:'swim'}); const pr=IA.buildProgram(c); dB++;
  for(const x of cardsOf(pr)) if(x.c.type==='swim'&&/Interval/.test(String(x.c.subtype||''))){ dN++; if(/\d+:\d\d\/100/.test(x.c.detail)) dNum++; } }
P('\n== 5 distance swim goals ('+dB+' builds): INT cards '+dN+', with a numeric /100 pace '+dNum);
// time goal with NO target entered
{ let n=0,num=0; for(const goal of ['swim_500_time','swim_100_time']) for(const exp of EXPS){ const pr=IA.buildProgram(mkCfg({goal,exp,age:'18-35',seed:76308,ev:false,unit:'yd',tgt:null,base:616,mix:'swim'}));
  for(const x of cardsOf(pr)) if(x.c.type==='swim'&&/Interval/.test(String(x.c.subtype||''))){ n++; if(/\d+:\d\d\/100/.test(x.c.detail)) num++; } }
  P('   time goals with base entered but NO target (6 builds): INT cards '+n+', numeric pace '+num); }

// ── 6. goal sheet: does the entered swim time survive commitGoalChange? (real function, VM) ──
P('\n== 6 GOAL SHEET ==');
for(const [from,to] of [['swim_500_time','swim_500_time'],['swim_500_time','swim_100_time'],['swim_tri','swim_500_time'],['swim_100_time','swim_500_time']]){
  try{
    const c=mkCfg({goal:from,exp:'intermediate',age:'18-35',seed:76308,ev:false,unit:'m',tgt:from==='swim_100_time'?80:450,base:from==='swim_100_time'?90:616,mix:'swim'});
    const pr=IA.buildProgram(c); pr.id='p_d110'; pr.cfg=c;
    IA.localStorage.setItem('ia_programs',JSON.stringify([pr]));
    IA.eval("_goalDraft={progId:'p_d110',sport:'swim',sel:"+JSON.stringify(to)+",inputs:{targetMins:'7',targetSecs:'30'}};");
    let err=''; try{ IA.eval('commitGoalChange()'); }catch(e){ err=' (post-save throw: '+e.message.slice(0,60)+')'; }
    const after=JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg.cardioGoals.swim;
    P('  '+from+' -> '+to+' before '+JSON.stringify({baseMins:c.cardioGoals.swim.baseMins,baseSecs:c.cardioGoals.swim.baseSecs,swimUnit:'m'})+' after '+JSON.stringify(after)+err);
    const pr2=IA.buildProgram(Object.assign({},c,{cardioGoals:{swim:after}}));
    const w1=cardsOf(pr2).find(x=>x.c.type==='swim'&&/Interval/.test(x.c.subtype)&&x.w===1);
    P('     rebuilt W1 INT: '+(w1?w1.c.detail.split('\n').find(l=>/Main set/.test(l))||w1.c.detail.slice(0,120):'none'));
  }catch(e){ P('  CRASH goal-sheet sim '+from+'->'+to+': '+e.message); }
}
P('\nDONE');
