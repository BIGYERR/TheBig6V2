// v223 measure — how the D158 test-eve shakeout population moves under P-TESTLEN slice (a) (the ruling's stated rule:
// a dated test goal pins to its test week whenever 1 <= tw <= 26). Counterfactual instrument Sa from v223_testlen_surgery.js.
// Usage: node tests/measure/v223_testlen_d158.js <base.html> <scratchdir>     (clock pinned 2026-09-22 21:16 local; TZ from env)
// Part 1, the athlete population through doGenerate: M8 part 1's lattice (6 rest patterns x 8 goals x 3 exp x 2 ages x
//   mile {none, 8:00} x test Thu/Sat x test week k 1..30 = 34,560 builds per artifact).
// Part 2, the D158 gate's own population: tests/gates/g214_d158_eve.js run on base and Sa (its cfgs carry _testWeek preset,
//   so they bypass doGenerate by construction; the gate's summary line is the verdict).
// ORACLES (independent of the eve code): the eve = the calendar day before the test date (Date.UTC); its program week by
//   Monday arithmetic from the built startDate; a training-day eve = eve weekday not in restDays and eve >= start and the
//   eve week <= totalWeeks; a shakeout = one run card, subtype exactly "Long Slow Distance (LSD)", legLoad false,
//   dose.key "easy", no lift sections (the g214 D1 card predicate, restated here without calling the engine).
const path=require('path'), fs=require('fs'), cp=require('child_process');
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]);
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const H=require(path.resolve(__dirname,'..','harness.js')); const SG=require('./v223_testlen_surgery.js');
const src=fs.readFileSync(ART,'utf8'); const FILES={base:ART, Sa:SG.write(SCR,'d158_Sa.html',SG.sa(src))};
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); }; return {IA,els}; }
const V={base:mkVM(FILES.base),Sa:mkVM(FILES.Sa)};
console.log('versions',Object.entries(V).map(([k,v])=>k+'='+v.IA.version).join(' '),'TZ',Intl.DateTimeFormat().resolvedOptions().timeZone);
const U=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10); const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const wkOf=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=['sun','mon','tue','wed','thu','fri','sat']; const dowOf=iso=>DOW[new R(U(iso)).getUTCDay()];
const bump=(o,k)=>{o[k]=(o[k]||0)+1;}; const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function setWD(Vm,o){ Vm.IA.window.__O=o; Vm.IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age,eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:undefined};`); Vm.els.clear(); }
function gen(Vm){ const IA=Vm.IA; IA.localStorage._map.clear(); IA.eval('activeProg=null'); try{IA.eval('doGenerate()');}catch(e){return {err:'threw '+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval('activeProg'); if(!p) return {err:'no program'}; return {p:JSON.parse(JSON.stringify(p)),tw:IA.eval('WD._testWeek')}; }
const cards=d=>{ if(!d) return []; const c=d.cardio; return Array.isArray(c)?c.filter(Boolean):(c?[c]:[]); };
const isShake=d=>{ const c=cards(d); return !!d && !d.rest && c.length===1 && c[0].type==='run' && c[0].subtype==='Long Slow Distance (LSD)' && !c[0].legLoad && c[0].dose && c[0].dose.key==='easy' && !(d.sections||[]).length; };
function eveState(p,race,rest){ const tw=wkOf(p.startDate,race); if(!tw||tw>p.totalWeeks) return 'no test in program';
  const eve=addD(race,-1); const ew=wkOf(p.startDate,eve); if(!ew) return 'eve before start'; const ed=dowOf(eve);
  if(rest.includes(ed)) return 'rest-day eve'; const day=(p.weeks[ew]||{})[ed]; return isShake(day)?'training eve: SHAKEOUT':'training eve: other ('+(day?(cards(day).map(c=>c.type+':'+(c.subtype||'').slice(0,22)).join('+')||'no cardio')+((day.sections||[]).length?' +lift':''):'no day')+')'; }
const GOALS=[]; for(const t of [570,660,750,855]) GOALS.push(['1.5mi '+fmt(t),{id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
for(const t of [360,420,480,570]) GOALS.push(['1mi '+fmt(t),{id:'run_pace_goal',label:'x',targetDist:'1',paceUnit:'mi',targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
const RESTS={'sun (6 train)':['sun'],'sat,sun (5)':['sat','sun'],'mon,fri (5)':['mon','fri'],'fri,sat,sun (4)':['fri','sat','sun'],'mon,wed,fri,sun (3)':['mon','wed','fri','sun'],'sun,wed (5, M7)':['sun','wed']};
const W1MON='2026-09-21'; const raceFor=(k,wd)=>addD(W1MON,(k-1)*7+wd);
const TR={}, SEG={rest:{},k:{},exp:{}}; let n=0, err=0; const ex=[];
for(const [rk,rest] of Object.entries(RESTS)) for(const [gl,run0] of GOALS) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','55+']) for(const mile of [null,480]) for(const wd of [3,5]) for(let k=1;k<=30;k++){
  const run=Object.assign({},run0,mile?{mileBestMins:'8',mileBestSecs:'00'}:{}); const race=raceFor(k,wd); const o={exp,age,rest,race,run};
  NOW=new R(2026,8,22,21,16,0).getTime(); setWD(V.base,o); const a=gen(V.base); setWD(V.Sa,o); const b=gen(V.Sa); n++;
  if(a.err||b.err){ err++; continue; }
  const sa=eveState(a.p,race,rest), sb=eveState(b.p,race,rest); bump(TR,sa+'  ->  '+sb);
  if(sa!==sb){ const kb=k<=8?'k 1-8':k<=16?'k 9-16':k<=26?'k 17-26':'k 27-30'; bump(SEG.rest,rk); bump(SEG.k,kb); bump(SEG.exp,exp); if(ex.length<3) ex.push(`${rk} ${gl} ${exp} ${age} k${k} test ${race}(${dowOf(race)}): base ${a.p.totalWeeks}wk tw ${a.tw} [${sa}] -> Sa ${b.p.totalWeeks}wk tw ${b.tw} [${sb}]`); }
}
console.log('\n=== 1  athlete population through doGenerate: builds',n,'errors',err);
Object.entries(TR).sort((x,y)=>y[1]-x[1]).forEach(([k,v])=>console.log('   ',String(v).padStart(6),k));
const moved=Object.entries(TR).filter(([k])=>{const [x,y]=k.split('  ->  ');return x!==y;}).reduce((s,[,v])=>s+v,0);
const shB=Object.entries(TR).filter(([k])=>k.split('  ->  ')[0]==='training eve: SHAKEOUT').reduce((s,[,v])=>s+v,0);
const shA=Object.entries(TR).filter(([k])=>k.split('  ->  ')[1]==='training eve: SHAKEOUT').reduce((s,[,v])=>s+v,0);
console.log('   builds whose eve state moved',moved+'/'+n,'| builds carrying the D158 shakeout: base',shB+'/'+n,'-> Sa',shA+'/'+n);
console.log('   moved, by rest pattern',JSON.stringify(SEG.rest)); console.log('   moved, by test week',JSON.stringify(SEG.k)); console.log('   moved, by experience',JSON.stringify(SEG.exp));
ex.forEach(x=>console.log('   ex',x));
console.log('\n=== 2  the D158 gate\'s own population (g214_d158_eve.js, no baseline arg: D5/D6 pair rows skip by name)');
for(const vk of ['base','Sa']){ let out='',code=0; try{ out=cp.execFileSync('node',[path.resolve(__dirname,'..','gates','g214_d158_eve.js'),FILES[vk]],{encoding:'utf8',timeout:900000,maxBuffer:1<<26}); }catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status; }
  const d0=(out.split('\n').find(l=>/ D0 /.test(l))||'').slice(0,260); const sum=(out.match(/PASS \d+ FAIL \d+\s*$/m)||['NO SUMMARY'])[0].trim();
  console.log('  ',vk.padEnd(4),'exit',code,'|',sum,'|',d0); fs.writeFileSync(path.join(SCR,'g214_'+vk+'.out'),out); }
console.log('   (full gate outputs in the scratch dir; the two are diffed below, PASS lines only)');
const ga=fs.readFileSync(path.join(SCR,'g214_base.out'),'utf8'), gb=fs.readFileSync(path.join(SCR,'g214_Sa.out'),'utf8');
console.log('   gate output identical base vs Sa:',ga===gb);
console.log('\nDONE');
