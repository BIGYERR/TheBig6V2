// v218 measure — D157 before-picture: the swim SIZER (calcProgramLength swim branch) reads the goal and
// current time by the minutes box; the ENGINE (buildSwimSession, D110a V212) reads the total.
// Read-only over <base.html> (V216, git show 3dc0146:index.html). Writes one surgery copy to <scratch>.
// Usage: node tests/measure/v218_d157_swim_sizer.js <base.html> <scratch>
// ORACLES: "the athlete's time" = minutes*60+seconds of what was typed (D110a authoring contract: a time
//   is entered when its total is > 0). The twin of every seconds-only entry is the same total typed as
//   m:ss ("0"+"58", or "1"+"15" for an overflowed "75"); the twin's length is the expected length.
//   "Sized off the default" = the entry's length equals the build with that field ABSENT (the sizer's
//   own fallback) and differs from the twin. Confinement = progDigest paired base vs surgery (clock pinned,
//   seed pinned, baseline proven equal to itself first). HALF_MANNY arms = g199 (__DELOAD_OFF) and g200
//   (declared-core clause stripped) methods, against the V212..V216 pins.
const path=require('path'), fs=require('fs'), crypto=require('crypto');
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]||'/tmp');
const R=Date; const NOW=new R(2026,8,24,9,0,0).getTime();
class FD extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=FD;
const H=require(path.resolve(__dirname,'..','harness.js'));
const P=(...a)=>console.log(...a);
const SRC=fs.readFileSync(ART,'utf8');
const LINES=SRC.split('\n');

// ── 0. SURGERY: the sizer's two readers take the engine's parse ((+m||0)*60+(+s||0) > 0) ─────────
const A1="var swimTimeEntered = isSwimTimeGoal && goal.targetMins !== undefined && goal.targetMins !== '';";
const R1="var swimTimeEntered = isSwimTimeGoal && ((+goal.targetMins||0)*60 + (+goal.targetSecs||0)) > 0;";
const A2="if(goal.baseMins !== undefined && goal.baseMins !== '') {\n          var bTotal = (+goal.baseMins||0)*60 + (+goal.baseSecs||0);";
const R2="{\n          var bTotal = (+goal.baseMins||0)*60 + (+goal.baseSecs||0);";
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
P('== 0. anchors (base '+(SRC.match(/ia-version" content="(\d+)"/)||[])[1]+')');
let bad=0; for(const [n,a] of [['A1 sizer goal reader',A1],['A2 sizer current reader',A2],['g200 core clause',CLAUSE]]){ const c=SRC.split(a).length-1; P('  '+n.padEnd(26)+' count '+c); if(c!==1) bad++; }
if(bad){ P('NOT-APPLIED '+bad); process.exit(2); }
const SURG=SRC.replace(A1,()=>R1).replace(A2,()=>R2);
const SF=path.join(SCR,'v218_surg.html'), SFC=path.join(SCR,'v218_surg_coreoff.html'), BFC=path.join(SCR,'v218_base_coreoff.html');
for(const f of [SF,SFC,BFC]){ try{fs.unlinkSync(f);}catch(e){} }
fs.writeFileSync(SF,SURG); fs.writeFileSync(SFC,SURG.replace(CLAUSE,'')); fs.writeFileSync(BFC,SRC.replace(CLAUSE,''));
P('  surgery bytes changed '+(SURG.length-SRC.length)+'; lines differing '+SURG.split('\n').filter((l,i)=>l!==LINES[i]).length);

// ── 1. READERS census: every line touching the stored swim time fields, with enclosing function ──
P('\n== 1. readers of targetMins/targetSecs/baseMins/baseSecs/base500Mins/base500Secs/targetTime (code lines, comments stripped)');
const FLD=/\b(targetMins|targetSecs|baseMins|baseSecs|base500Mins|base500Secs|targetTime)\b/;
function encl(i){ for(let j=i;j>=0;j--){ const m=LINES[j].match(/^\s*function\s+([A-Za-z0-9_$]+)|^\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:function|\()/); if(m) return (m[1]||m[2])+'@'+(j+1); } return '?'; }
const tally={}; let nl=0;
LINES.forEach((l,i)=>{ const code=l.replace(/\/\/.*$/,''); if(!FLD.test(code)) return; nl++;
  const f=code.match(new RegExp(FLD.source,'g')); f.forEach(x=>tally[x]=(tally[x]||0)+1);
  P('  L'+(i+1)+' ['+encl(i)+'] '+[...new Set(f)].join(',')+' :: '+code.trim().slice(0,150)); });
P('  code lines: '+nl+'  token counts: '+JSON.stringify(tally));
P('  calcProgramLength call sites: '+LINES.map((l,i)=>/calcProgramLength\(/.test(l.replace(/\/\/.*$/,''))&&!/function calcProgramLength/.test(l)?(i+1):null).filter(Boolean).join(','));
P('  buildSwimSession call sites: '+LINES.map((l,i)=>/buildSwimSession\(/.test(l)&&!/function buildSwimSession/.test(l)?(i+1):null).filter(Boolean).join(','));

// ── VMs ────────────────────────────────────────────────────────────────────────────────────────
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); };
  return {IA,els}; }
const VB=mkVM(ART), VS=mkVM(SF);
const B=VB.IA, S=VS.IA;
const clone=o=>JSON.parse(JSON.stringify(o));
function mkCfg(o){ const c=clone(H.fixtures.HALF_MANNY);
  c.cardioTypes=o.mix==='run+swim'?['run','swim']:['swim']; c.experience=o.exp; c.ageBracket=o.age; c.seed=o.seed;
  c.primaryPath='goal'; c.eventTargeted=false; delete c.raceDate; if(o.rest) c.restDays=o.rest;
  c.cardioGoals={swim:Object.assign({id:o.goal,label:o.goal,swimUnit:o.unit||'yd'},o.g||{})};
  if(o.mix==='run+swim') c.cardioGoals.run={id:'run_base',label:'Run Base',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'};
  return c; }
// field writers: form 'mss' = m:ss twin, 'undef' = minutes box never touched, 'empty' = minutes box cleared
function put(g,pre,t,form){ if(t==null) return; if(form==='mss'){ g[pre+'Mins']=String(Math.floor(t/60)); g[pre+'Secs']=String(t%60); }
  else if(form==='undef'){ g[pre+'Secs']=String(t); } else if(form==='empty'){ g[pre+'Mins']=''; g[pre+'Secs']=String(t); } }
const LEN=(IA,c)=>IA.eval('(function(c){return calcProgramLength(c.cardioTypes,Object.assign({},c.cardioGoals,{_experience:c.experience||"intermediate",_ageBracket:c.ageBracket||"18-35",_eventTargeted:c.eventTargeted}),LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||"balanced");})')(c);
const VALID=(IA,g)=>IA.eval('_swimEntryState')(g);
const wdig=p=>crypto.createHash('sha256').update(JSON.stringify(p.weeks)).digest('hex').slice(0,16);

// ── identity: baseline equals itself ─────────────────────────────────────────────────────────────
{ const c=mkCfg({goal:'swim_100_time',exp:'advanced',age:'18-35',seed:76308,g:{}}); put(c.cardioGoals.swim,'target',55,'undef'); put(c.cardioGoals.swim,'base',59,'undef'); put(c.cardioGoals.swim,'base500',330,'mss');
  const a=H.progDigest(B.buildProgram(clone(c))), b=H.progDigest(B.buildProgram(clone(c))), m=H.progDigest(B.buildProgram(clone(H.fixtures.HALF_MANNY)));
  P('\n== identity: swim cfg base==base '+(a===b)+' ('+a+'); HALF_MANNY base '+m+' (keys of prog: '+Object.keys(B.buildProgram(clone(c))).join(',')+')'); }

// ── 2. REPRO ─────────────────────────────────────────────────────────────────────────────────────
P('\n== 2. repro: swim_100_time, advanced, 18-35, yd, seed 76308. Target 0:55, current 100 0:59, current 500 5:30');
function viaWizard(V,g,exp){ const IA=V.IA; IA.window.__G=g; IA.window.__E=exp;
  IA.eval('WD={primaryPath:"goal",cardioTypes:["swim"],experience:__E,ageBracket:"18-35",eventTargeted:false,liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:76308,name:"S",bench:135,squat:155,deadlift:185,cardioGoals:{swim:JSON.parse(JSON.stringify(__G))},startDate:undefined};');
  V.els.clear(); IA.localStorage._map.clear(); IA.eval('activeProg=null');
  const st=IA.eval('_swimEntryState(WD.cardioGoals.swim)'); let err=null;
  try{ IA.eval('doGenerate()'); IA.flushTimers(Infinity); }catch(e){ err=e.message; }
  const p=IA.eval('activeProg'); return {st,err,p,sub:String(V.els.get('generateSub')&&V.els.get('generateSub').textContent||'')}; }
const REPRO=[
  ['m:ss twin  (0:55 / 0:59)       ', {targetMins:'0',targetSecs:'55',baseMins:'0',baseSecs:'59',base500Mins:'5',base500Secs:'30',swimUnit:'yd',id:'swim_100_time',label:'Improve 100 Time'}],
  ['sec-only current (_:59)       ', {targetMins:'0',targetSecs:'55',baseSecs:'59',base500Mins:'5',base500Secs:'30',swimUnit:'yd',id:'swim_100_time',label:'Improve 100 Time'}],
  ['sec-only target  (_:55)       ', {targetSecs:'55',baseMins:'0',baseSecs:'59',base500Mins:'5',base500Secs:'30',swimUnit:'yd',id:'swim_100_time',label:'Improve 100 Time'}],
  ['sec-only both                 ', {targetSecs:'55',baseSecs:'59',base500Mins:'5',base500Secs:'30',swimUnit:'yd',id:'swim_100_time',label:'Improve 100 Time'}],
  ['minutes box cleared, both ("")', {targetMins:'',targetSecs:'55',baseMins:'',baseSecs:'59',base500Mins:'5',base500Secs:'30',swimUnit:'yd',id:'swim_100_time',label:'Improve 100 Time'}],
];
const reproOut={};
for(const [nm,g] of REPRO){ for(const [tag,V] of [['V216',VB],['SURG',VS]]){ const r=viaWizard(V,g,'advanced');
  const L=LEN(V.IA,{cardioTypes:['swim'],cardioGoals:{swim:g},experience:'advanced',ageBracket:'18-35',eventTargeted:false,liftingFocus:'support_prevention'});
  const p=r.p; reproOut[tag+nm]=p;
  P('  '+tag+' '+nm+' validator '+JSON.stringify(r.st)+' | sizer '+L.weeks+'wk "'+L.warning+'" | doGenerate '+(p?p.totalWeeks+'wk weeksDigest '+wdig(p):'NO PROGRAM '+r.err)+' | screen "'+r.sub+'"'); } }
{ const t=reproOut['V216m:ss twin  (0:55 / 0:59)       '], s=reproOut['V216sec-only both                 '];
  const hdr=p=>Object.keys(p.weeks).sort((a,b)=>a-b).map(w=>{ const W=p.weeks[w]; const sw=['mon','tue','wed','thu','fri','sat','sun'].map(d=>W[d]&&W[d].cardio?(d+':'+[].concat(W[d].cardio).map(x=>x.subtype||x.type).join('+')):null).filter(Boolean); return 'W'+w+' '+sw.join(' '); });
  const ints=p=>{ const o=[]; Object.keys(p.weeks).sort((a,b)=>a-b).forEach(w=>{ Object.keys(p.weeks[w]).forEach(d=>{ [].concat(p.weeks[w][d].cardio||[]).forEach(x=>{ if(x&&x.type==='swim'&&/\(INT\)/.test(x.subtype||'')) o.push('W'+w+' '+((String(x.detail||'').match(/\d+ x 100\w* at [0-9:]+\/100/)||['?'])[0])); }); }); }); return o; };
  if(t&&s){ P('  -- V216 m:ss twin: '+t.totalWeeks+' weeks, grid header (swim days per week):'); hdr(t).forEach(l=>P('     '+l));
    P('  -- V216 sec-only both: '+s.totalWeeks+' weeks, grid header:'); hdr(s).forEach(l=>P('     '+l));
    P('  -- INT split per week, twin : '+ints(t).join(' | ')); P('  -- INT split per week, s-only: '+ints(s).join(' | '));
    P('  -- week-1 grid, twin:\n'+H.weekGrid({weeks:{1:t.weeks[1]}}).split('\n').map(x=>'     '+x).join('\n'));
    P('  -- week-1 grid, s-only:\n'+H.weekGrid({weeks:{1:s.weeks[1]}}).split('\n').map(x=>'     '+x).join('\n')); } }

// ── 2b. wizard pace-line reader (updateSwimPaceDisplay) on the same entries ──
P('\n== 2b. wizard target pace line (updateSwimPaceDisplay, L2383) per entry form, V216');
for(const [nm,g] of REPRO){ VB.els.clear(); B.window.__G=g; B.eval('WD={cardioTypes:["swim"],cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; updateSwimPaceDisplay();');
  const el=VB.els.get('swimPaceLine'); P('  '+nm+' display='+(el&&el.style.display)+' text="'+String(el&&el.innerHTML||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()+'"'); }
// ── 3. REACH: sizer-length lattice ─────────────────────────────────────────────────────────────────
P('\n== 3. reach lattice (sizer length, seed-free; validator = _swimEntryState, the doGenerate refusal)');
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'];
const T100=[...Array(15).keys()].map(i=>45+i).concat([60,65,70,75,80,85,90,100,110,120]);
const C100=[50,52,54,56,58,59,60,70,80,90,100,120,150];
const T500=[240,270,300,330,360,390,420,480,540,600,660,720,840,900];
const C500=[300,360,420,480,540,600,720,900];
const FORMS=['mss','undef','empty'];
const rows=[]; let lenCalls=0;
function lenOf(IA,goal,exp,age,g){ lenCalls++; return LEN(IA,{cardioTypes:['swim'],cardioGoals:{swim:g},experience:exp,ageBracket:age,eventTargeted:false,liftingFocus:'support_prevention'}).weeks; }
for(const exp of EXPS) for(const age of AGES){
  for(const t of T100) for(const c of C100) for(const tf of FORMS) for(const cf of FORMS){
    const mk=(tf2,cf2,dropT,dropC)=>{ const g={id:'swim_100_time',swimUnit:'yd'}; if(!dropT) put(g,'target',t,tf2); if(!dropC) put(g,'base',c,cf2); put(g,'base500',5*c+30,'mss'); return g; };
    const g=mk(tf,cf); const v=VALID(B,g);
    rows.push({goal:'100',exp,age,t,c,tf,cf,ok:v.ok,msg:v.msg||'',L:lenOf(B,'swim_100_time',exp,age,g),Ltwin:lenOf(B,'swim_100_time',exp,age,mk('mss','mss')),
      LnoT:lenOf(B,'swim_100_time',exp,age,mk(tf,cf,true,false)),LnoC:lenOf(B,'swim_100_time',exp,age,mk(tf,cf,false,true)),Ls:lenOf(S,'swim_100_time',exp,age,g)}); }
  for(const t of T500) for(const c of C500) for(const tf of FORMS) for(const cf of FORMS){
    const mk=(tf2,cf2,dropT,dropC)=>{ const g={id:'swim_500_time',swimUnit:'yd'}; if(!dropT) put(g,'target',t,tf2); if(!dropC) put(g,'base',c,cf2); return g; };
    const g=mk(tf,cf); const v=VALID(B,g);
    rows.push({goal:'500',exp,age,t,c,tf,cf,ok:v.ok,msg:v.msg||'',L:lenOf(B,'swim_500_time',exp,age,g),Ltwin:lenOf(B,'swim_500_time',exp,age,mk('mss','mss')),
      LnoT:lenOf(B,'swim_500_time',exp,age,mk(tf,cf,true,false)),LnoC:lenOf(B,'swim_500_time',exp,age,mk(tf,cf,false,true)),Ls:lenOf(S,'swim_500_time',exp,age,g)}); }
}
P('  lattice rows '+rows.length+' ('+lenCalls+' sizer calls)');
const secOnly=r=>r.tf!=='mss'||r.cf!=='mss';
const cls=r=>(r.tf!=='mss'&&r.cf!=='mss')?'both':(r.tf!=='mss'?'target':'current');
const ovf=r=>(r.tf!=='mss'&&r.t>=60)||(r.cf!=='mss'&&r.c>=60);
function seg(list,key){ const m={}; list.forEach(r=>{ const k=key(r); m[k]=(m[k]||0)+1; }); return JSON.stringify(m); }
const mssRows=rows.filter(r=>!secOnly(r));
P('  twin rows (m:ss both) '+mssRows.length+'; oracle self-check L==Ltwin on twins: '+mssRows.filter(r=>r.L===r.Ltwin).length+'/'+mssRows.length+'; surgery == base on twins: '+mssRows.filter(r=>r.Ls===r.L).length+'/'+mssRows.length);
const so=rows.filter(secOnly);
P('  seconds-only rows '+so.length+'  validator ok '+so.filter(r=>r.ok).length+'  refused '+so.filter(r=>!r.ok).length+' '+seg(so.filter(r=>!r.ok),r=>r.goal+'/'+cls(r)+'/'+(r.cf!=='mss'&&r.c>=60?'cur>=60':'other')+'/'+r.msg.slice(0,30)));
const ok=so.filter(r=>r.ok);
const moved=ok.filter(r=>r.L!==r.Ltwin);
P('  REACHABLE seconds-only (validator ok): '+ok.length+'  by goal/field/overflow '+seg(ok,r=>r.goal+'/'+cls(r)+'/'+(ovf(r)?'ovf':'sub60')));
P('  length != twin: '+moved.length+'/'+ok.length+'  by goal/field '+seg(moved,r=>r.goal+'/'+cls(r)+'/'+(ovf(r)?'ovf':'sub60')));
P('    delta (L - Ltwin) '+seg(moved,r=>r.L-r.Ltwin)+'  direction: longer '+moved.filter(r=>r.L>r.Ltwin).length+' shorter '+moved.filter(r=>r.L<r.Ltwin).length);
P('    by exp '+seg(moved,r=>r.exp)+' of '+seg(ok,r=>r.exp)); P('    by age '+seg(moved,r=>r.age)+' of '+seg(ok,r=>r.age));
// default read, per field: the entry's length == the absent-field length
const tRows=ok.filter(r=>r.tf!=='mss'), cRows=ok.filter(r=>r.cf!=='mss');
P('  TARGET seconds-only (n '+tRows.length+'): L == target-absent (volume branch) '+tRows.filter(r=>r.L===r.LnoT).length+'; twin == target-absent '+tRows.filter(r=>r.Ltwin===r.LnoT).length+'; moved '+tRows.filter(r=>r.L!==r.Ltwin).length);
P('  CURRENT seconds-only (n '+cRows.length+'): L == current-absent (exp default) '+cRows.filter(r=>r.L===r.LnoC).length+'; moved vs twin '+cRows.filter(r=>r.L!==r.Ltwin).length);
{ const cOnly=ok.filter(r=>r.cf!=='mss'&&r.tf==='mss'); P('    current-only seconds-only by exp: '+EXPS.map(e=>e+' '+cOnly.filter(r=>r.exp===e&&r.L!==r.Ltwin).length+'/'+cOnly.filter(r=>r.exp===e).length+' deltas '+seg(cOnly.filter(r=>r.exp===e&&r.L!==r.Ltwin),r=>r.L-r.Ltwin)).join(' | ')); }
P('  surgery: seconds-only L_surg == twin '+ok.filter(r=>r.Ls===r.Ltwin).length+'/'+ok.filter(r=>true).length+'  (refused rows L_surg==twin '+so.filter(r=>!r.ok&&r.Ls===r.Ltwin).length+'/'+so.filter(r=>!r.ok).length+')');
P('  "" vs undefined minutes box identical at base: '+ok.filter(r=>r.tf!=='undef'&&r.cf!=='undef'&&(r.tf==='empty'||r.cf==='empty')).every(r=>{ const u=rows.find(x=>x.goal===r.goal&&x.exp===r.exp&&x.age===r.age&&x.t===r.t&&x.c===r.c&&x.tf===(r.tf==='empty'?'undef':r.tf)&&x.cf===(r.cf==='empty'?'undef':r.cf)); return u&&u.L===r.L; }));
P('  sample moved rows:'); moved.filter((r,i)=>i%Math.max(1,Math.floor(moved.length/12))===0).slice(0,14).forEach(r=>P('    '+JSON.stringify({goal:r.goal,exp:r.exp,age:r.age,t:r.t,c:r.c,tf:r.tf,cf:r.cf,L:r.L,twin:r.Ltwin,noT:r.LnoT,noC:r.LnoC,surg:r.Ls})));

// ── 4. COUNTERFACTUAL: whole buildProgram, base vs surgery ──────────────────────────────────────────
P('\n== 4. counterfactual (progDigest, seed pinned). Surgery = the two sizer readers take the engine parse.');
const SEEDS=[76308,24865,11];
const cfgs=[];
// (a) swim-time sub-lattice through the full build
for(const seed of SEEDS.slice(0,2)) for(const exp of EXPS) for(const age of ['18-35','55+']) for(const mix of ['swim','run+swim']){
  for(const [t,c] of [[55,59],[50,58],[58,56],[75,90],[90,120],[59,59]]) for(const tf of FORMS) for(const cf of FORMS){
    const g={}; put(g,'target',t,tf); put(g,'base',c,cf); put(g,'base500',5*c+30,'mss'); cfgs.push({cls:'100/'+(tf==='mss'&&cf==='mss'?'mss':'sec'),o:{goal:'swim_100_time',exp,age,seed,mix,g},tw:{t,c,tf,cf}}); }
  for(const [t,c] of [[420,480],[540,600],[300,360]]) for(const tf of FORMS){ const g={}; put(g,'target',t,tf); put(g,'base',c,'mss'); cfgs.push({cls:'500/'+(tf==='mss'?'mss':'sec'),o:{goal:'swim_500_time',exp,age,seed,mix,g},tw:{t,c,tf,cf:'mss'}}); }
}
// (b) controls: every other swim goal, no swim, run goals, bike
for(const seed of SEEDS) for(const exp of EXPS) for(const rest of [['sun','wed'],['sat','sun'],['sun']]){
  for(const goal of ['swim_tri','swim_mile','swim_base']) cfgs.push({cls:'ctl/'+goal,o:{goal,exp,age:'18-35',seed,rest,mix:'swim',g:{baselineDist:'600'}}});
  for(const goal of ['swim_100_time','swim_500_time']) cfgs.push({cls:'ctl/'+goal+'-notime',o:{goal,exp,age:'18-35',seed,rest,mix:'swim',g:{}}});
  for(const run of [H.fixtures.HALF_MANNY.cardioGoals.run,{id:'run_5k',label:'5K'},{id:'run_pace_goal',label:'Pace',targetDist:'1.5',targetMins:'11',targetSecs:'30',mileBestMins:'8',mileBestSecs:'0'},{id:'run_base',label:'Base',baselineDist:'3'}]){
    const c=clone(H.fixtures.HALF_MANNY); c.seed=seed; c.experience=exp; c.restDays=rest; c.cardioGoals={run:clone(run)}; if(run.id!=='run_half'){ c.primaryPath='goal'; c.eventTargeted=false; delete c.raceDate; }
    cfgs.push({cls:'ctl/'+run.id,raw:c}); }
  { const c=clone(H.fixtures.HALF_MANNY); c.seed=seed; c.experience=exp; c.restDays=rest; c.cardioTypes=[]; c.cardioGoals={}; c.primaryPath='goal'; delete c.raceDate; cfgs.push({cls:'ctl/nocardio',raw:c}); }
  { const c=clone(H.fixtures.HALF_MANNY); c.seed=seed; c.experience=exp; c.restDays=rest; c.cardioTypes=['bike']; c.cardioGoals={bike:{id:'bike_ftp',label:'FTP'}}; c.primaryPath='goal'; delete c.raceDate; cfgs.push({cls:'ctl/bike_ftp',raw:c}); }
}
const t0=R.now(); let crash=0; const res=[];
for(const k of cfgs){ const c=k.raw||mkCfg(k.o); let pb,ps; try{ pb=B.buildProgram(clone(c)); ps=S.buildProgram(clone(c)); }catch(e){ crash++; if(crash<4) P('  CRASH '+k.cls+' '+e.message); continue; }
  res.push({k,db:H.progDigest(pb),ds:H.progDigest(ps),wb:wdig(pb),ws:wdig(ps),Lb:pb.totalWeeks,Ls:ps.totalWeeks}); }
P('  builds '+res.length+' pairs ('+(res.length*2)+' buildProgram calls, '+((R.now()-t0)/1000).toFixed(1)+'s), crashes '+crash);
const byCls={}; res.forEach(r=>{ const c=r.k.cls; byCls[c]=byCls[c]||{n:0,mv:0,len:0,d:{}}; byCls[c].n++; if(r.db!==r.ds){ byCls[c].mv++; } if(r.Lb!==r.Ls){ byCls[c].len++; const dd=r.Ls-r.Lb; byCls[c].d[dd]=(byCls[c].d[dd]||0)+1; } });
Object.keys(byCls).sort().forEach(c=>P('  '+c.padEnd(26)+' digest moved '+byCls[c].mv+'/'+byCls[c].n+'  length moved '+byCls[c].len+'  delta(surg-base) '+JSON.stringify(byCls[c].d)));
const movedNoLen=res.filter(r=>r.db!==r.ds&&r.Lb===r.Ls); P('  digest moved with length unchanged: '+movedNoLen.length+(movedNoLen.length?' e.g. '+JSON.stringify(movedNoLen[0].k):''));
// after surgery a seconds-only build equals its m:ss twin in weeks (cfg strings differ, so weeks only)
{ const sec=res.filter(r=>/\/sec$/.test(r.k.cls)); let eq=0, eqB=0; for(const r of sec){ const tw=res.find(x=>x.k.o&&x.k.o.goal===r.k.o.goal&&x.k.o.exp===r.k.o.exp&&x.k.o.age===r.k.o.age&&x.k.o.seed===r.k.o.seed&&x.k.o.mix===r.k.o.mix&&x.k.tw.t===r.k.tw.t&&x.k.tw.c===r.k.tw.c&&x.k.tw.tf==='mss'&&x.k.tw.cf==='mss'); if(tw){ if(tw.ws===r.ws) eq++; if(tw.wb===r.wb) eqB++; } }
  P('  seconds-only full builds whose prog.weeks equals the m:ss twin: base '+eqB+'/'+sec.length+'  surgery '+eq+'/'+sec.length); }

// ── HALF_MANNY three arms ─────────────────────────────────────────────────────────────────────────
P('\n== HALF_MANNY arms (pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081)');
const BC=H.load(BFC), SC=H.load(SFC);
for(const [tag,IA,IC] of [['V216 base',B,BC],['SURGERY ',S,SC]]){
  const m=H.progDigest(IA.buildProgram(clone(H.fixtures.HALF_MANNY)));
  IA.eval('globalThis.__DELOAD_OFF=true;'); const d=H.progDigest(IA.buildProgram(clone(H.fixtures.HALF_MANNY))); IA.eval('globalThis.__DELOAD_OFF=false;');
  const k=H.progDigest(IC.buildProgram(clone(H.fixtures.HALF_MANNY)));
  P('  '+tag+'  shipped '+m+(m==='0ac7da6b1691a8e1'?' =pin':' MISMATCH')+'  deload-off '+d+(d==='1069cd7f86eed204'?' =pin':' MISMATCH')+'  core-off '+k+(k==='9d14801a63111081'?' =pin':' MISMATCH')); }
P('\nDONE');
