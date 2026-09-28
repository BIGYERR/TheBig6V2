// v223 measure M9 — P-TESTLEN (c), the D25 snap (p_safepace_ruling.md SCOPE RE-RULING (c)):
//   "M9 first: the 21 cases under no-snap print the trial on its weekday with zero train days before it, and the
//    D21/D25 copy gate still passes on the other 371."
// Usage: node tests/measure/v223_testlen_m9.js <base.html> <scratchdir>        (clock pinned; TZ from env)
// Artifacts: base, Sa (slice a), Sc (Sa + no-snap) from v223_testlen_surgery.js (counterfactual instruments).
// Lattice: M8 part 3's (today Mon..Sun of the week of 2026-09-21 x test 0..7 days out x 7 rest patterns = 392) for the
//   M8 cfg (1.5 mi 12:00, mile 8:00, intermediate), widened to 2 goals x 3 experience levels = 2,352 per artifact.
// ORACLES (never the suspect): the snap case by date arithmetic (today's weekday offset > 0, every day today..Sunday is a
//   rest day, test in [today, Sunday]); expected start = today; test week by Date.UTC Monday arithmetic; "train days
//   before the test" = non-rest days of W1 before the test weekday holding any card or section; the trial = a run whose
//   subtype says TIME TRIAL on the test weekday. The gate verdicts are the gates' own PASS/FAIL summary lines.
const path=require('path'), fs=require('fs'), cp=require('child_process');
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]);
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const setToday=iso=>{const[y,m,d]=iso.split('-').map(Number);NOW=new R(y,m-1,d,21,16,0).getTime();};
const H=require(path.resolve(__dirname,'..','harness.js')); const SG=require('./v223_testlen_surgery.js');
const src=fs.readFileSync(ART,'utf8');
const FILES={base:ART, Sa:SG.write(SCR,'m9_Sa.html',SG.sa(src)), Sc:SG.write(SCR,'m9_Sc.html',SG.sc(src))};
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); }; return {IA,els}; }
const V={}; for(const k of Object.keys(FILES)) V[k]=mkVM(FILES[k]);
console.log('versions',Object.entries(V).map(([k,v])=>k+'='+v.IA.version).join(' '),'TZ',Intl.DateTimeFormat().resolvedOptions().timeZone,'clock local 21:16 on each "today"');
const U=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10); const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const oracleTW=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=['sun','mon','tue','wed','thu','fri','sat']; const dowOf=iso=>DOW[new R(U(iso)).getUTCDay()]; const ORD=['mon','tue','wed','thu','fri','sat','sun'];
const txt=h=>(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
function setWD(Vm,o){ Vm.IA.window.__O=o; Vm.IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:"18-35",eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:undefined};`); Vm.els.clear(); }
function gen(Vm){ const IA=Vm.IA; IA.localStorage._map.clear(); IA.eval('activeProg=null'); try{IA.eval('doGenerate()');}catch(e){return {err:'threw '+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval('activeProg'); if(!p) return {err:'no program'}; return {p:JSON.parse(JSON.stringify(p)),tw:IA.eval('WD._testWeek'),sub:(Vm.els.get('generateSub')||{}).textContent}; }
function copy(Vm){ const IA=Vm.IA; IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep();updateRaceDateFeedback()');
  const fb=txt((Vm.els.get('raceDateFeedback')||{innerHTML:''}).innerHTML);
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("name");renderWizardStep()'); const nb=txt(Vm.els.get('wizardBody').innerHTML);
  const sr=txt((Vm.els.get('startResolve')||{innerHTML:''}).innerHTML) || (nb.match(/Week 1[^.]*\.[^.]*\./)||[''])[0];
  return {fb, name:+((nb.match(/Program length\s*(\d+)\s*weeks?/i)||[])[1])||null, sr}; }
const cards=(p,w,d)=>{const day=(p.weeks[w]||{})[d]; if(!day) return {rest:true,runs:[],sec:0}; const c=day.cardio; const runs=(Array.isArray(c)?c:(c?[c]:[])).filter(x=>x&&x.type==='run'); return {rest:!!day.rest,runs,sec:(day.sections||[]).length,title:day.title||day.name||''};};
const RESTS={none:[],sun:['sun'],'sun,wed':['sun','wed'],'sat,sun':['sat','sun'],'fri,sat,sun':['fri','sat','sun'],'mon,wed,fri':['mon','wed','fri'],'thu..sun':['thu','fri','sat','sun']};
const GOALS={'1.5mi 12:00 mile 8:00':{id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'0',targetTime:'12:00'},
             '1mi 6:00 no mile':{id:'run_pace_goal',label:'x',targetDist:'1',paceUnit:'mi',targetMins:'6',targetSecs:'0',targetTime:'6:00'}};
const T={}; const ex=[]; const EXC={};
for(const [gl,run] of Object.entries(GOALS)) for(const exp of ['intermediate','beginner','advanced']) for(let wd=0;wd<7;wd++) for(let du=0;du<=7;du++) for(const [rk,rest] of Object.entries(RESTS)){
  const today=addD('2026-09-21',wd), race=addD(today,du), o={exp,rest,race,run};
  const m8cell = gl.startsWith('1.5') && exp==='intermediate';
  // oracle: snap case
  const off=(new R(U(today)).getUTCDay()+6)%7; const partialDays=ORD.slice(off); const sunday=addD(today,6-off);
  const snapCase = off>0 && partialDays.every(d=>rest.includes(d)) && U(race)>=U(today) && U(race)<=U(sunday);
  const row={};
  for(const vk of ['base','Sa','Sc']){ setToday(today); setWD(V[vk],o); const cpy=copy(V[vk]); setWD(V[vk],o); const b=gen(V[vk]);
    if(b.err){ row[vk]={err:b.err}; continue; }
    row[vk]={b,cpy,dig:H.progDigest(b.p),ot:oracleTW(b.p.startDate,race)}; }
  for(const vk of ['base','Sa','Sc']){ const r=row[vk]; const seg=(m8cell?'M8cell ':'wide   ')+vk;
    T[seg]=T[seg]||{n:0,err:0,cls:{}}; const Z=T[seg]; Z.n++; if(r.err){Z.err++;continue;}
    bump(Z.cls, r.ot==null?'TEST BEFORE START':(r.b.tw==null?'unpinned':'pinned')); }
  // Sc on the oracle's snap cases
  const k2=(m8cell?'M8cell':'wide  ')+' snapCase='+snapCase;
  EXC[k2]=EXC[k2]||{n:0,startIsToday:0,tot1:0,tw1:0,trialOnWeekday:0,trainBefore0:0,trainAfter:{},testOnRestWeekday:0,digestSaEqSc:0,fbSays:{},srSays:{},nameEqBuilt:0,subSays:{}};
  const Z=EXC[k2]; Z.n++; const s=row.Sc, a=row.Sa; if(!s||s.err||!a||a.err) continue;
  if(s.dig===a.dig) Z.digestSaEqSc++;
  if(snapCase){ const p=s.b.p, rd=dowOf(race); const w=oracleTW(p.startDate,race);
    if(p.startDate===today) Z.startIsToday++; if(p.totalWeeks===1) Z.tot1++; if(s.b.tw===1) Z.tw1++;
    const c=cards(p,w||1,rd); if(c.runs.some(x=>/TIME TRIAL/.test(x.subtype||''))) Z.trialOnWeekday++;
    const before=ORD.slice(off,ORD.indexOf(rd)).filter(d=>{const q=cards(p,1,d); return !q.rest&&(q.runs.length||q.sec);}); if(before.length===0) Z.trainBefore0++;
    const after=ORD.slice(ORD.indexOf(rd)+1).filter(d=>{const q=cards(p,1,d); return !q.rest&&(q.runs.length||q.sec);}); bump(Z.trainAfter,String(after.length));
    if(rest.includes(rd)) Z.testOnRestWeekday++;
    bump(Z.fbSays,s.cpy.fb.replace(/\d+/g,'N').slice(0,160)); bump(Z.srSays,(s.cpy.sr||'').replace(/\d+/g,'N').replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \w+ N/g,'DAY').slice(0,160));
    if(s.cpy.name===p.totalWeeks) Z.nameEqBuilt++; bump(Z.subSays,(s.b.sub||'').replace(/\d+/g,'N'));
    if(ex.length<4) ex.push(`${gl} ${exp} today ${today}(${dowOf(today)}) rest ${rk} test ${race}(${rd}) +${du}d | base start ${row.base.b&&row.base.b.p.startDate} tot ${row.base.b&&row.base.b.p.totalWeeks} tw ${row.base.b&&row.base.b.tw} | Sc start ${p.startDate} tot ${p.totalWeeks} tw ${s.b.tw} | W1 ${ORD.map(d=>{const q=cards(p,1,d);return d+':'+(q.rest?'R':'')+(q.runs.map(x=>(x.subtype||'').slice(0,18)).join('+')||'')+(q.sec?'[L'+q.sec+']':'');}).join(' ')}`);
  } else { if(row.base.b&&row.Sc.b){ Z.baseEqSc=(Z.baseEqSc||0)+(row.base.dig===s.dig?1:0);} }
}
console.log('\n=== 1  class table (TEST BEFORE START = oracle test week null from the built start; pinned = WD._testWeek set)');
for(const [k,z] of Object.entries(T)) console.log('  ',k.padEnd(14),'n',z.n,'err',z.err,JSON.stringify(z.cls));
console.log('\n=== 2  Sc (no-snap) on the oracle snap cases vs everything else');
for(const [k,z] of Object.entries(EXC)) console.log('  ',k.padEnd(22),JSON.stringify(z));
ex.forEach(x=>console.log('   ex',x));
console.log('\n=== 3  gates that name D21/D25/snap, run on base / Sa / Sc (their own PASS/FAIL summary; crash = no summary)');
const GD=path.resolve(__dirname,'..','gates'); const gl=fs.readdirSync(GD).filter(f=>f.endsWith('.js')&&/D25|D21|snapped|startResolveCopy/.test(fs.readFileSync(path.join(GD,f),'utf8')));
for(const g of gl) for(const vk of ['base','Sa','Sc']){ let out='',code=0; try{ out=cp.execFileSync('node',[path.join(GD,g),FILES[vk]],{encoding:'utf8',timeout:600000,maxBuffer:1<<26}); }catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status; }
  const sum=(out.match(/PASS \d+ FAIL \d+\s*$/m)||out.match(/PASS \d+ FAIL \d+/g)||['NO SUMMARY'])[0]; const fails=out.split('\n').filter(l=>/^FAIL /.test(l)).slice(0,3).map(l=>l.slice(0,160));
  console.log('  ',g.padEnd(28),vk.padEnd(4),'exit',code,'|',String(sum).trim(),fails.length?'| '+fails.join(' || '):''); }
console.log('\nDONE');
