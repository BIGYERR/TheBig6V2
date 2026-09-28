// v223 measure M10 — P-TESTLEN beyond 26 weeks (p_safepace_ruling.md SCOPE RE-RULING, "Beyond 26"):
//   rule: "the block counts back from the test the way D14a races do: startDate = testWeekMonday - 25 weeks, tw 26, len 26."
//   M10: "a start in the future on a test goal (calcCurrentWeek :11074 returns 1 for diff < 0, the D14a futureWeeks path,
//   freeze, the Programs card)."  The ruling names these four surfaces; it states NO pass/refute predicate for them.
//   This script prints what each surface does under the rule (a counterfactual instrument, S26 in v223_testlen_surgery.js).
// Usage: node tests/measure/v223_testlen_m10.js <base.html> <scratchdir>     (clock pinned 2026-09-22 21:16 local; TZ from env)
// Lattice: 8 goals (M8's) x 3 exp x mile {none, 8:00} x test week k 24..35 (from W1 = Mon 2026-09-21) x test Thu/Sat
//   x 6 rest patterns (M8 part 1's) = 6,912 per artifact; artifacts base, Sa, S26.
// ORACLES: expected start = Monday of the test week minus 175 days (Date.UTC); future weeks = (start - Monday(today))/7;
//   trial = run whose subtype says TIME TRIAL on the test weekday; freeze = a planted sentinel string survives refresh or not.
const path=require('path'), fs=require('fs');
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]);
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const setToday=iso=>{const[y,m,d]=iso.split('-').map(Number);NOW=new R(y,m-1,d,21,16,0).getTime();};
const H=require(path.resolve(__dirname,'..','harness.js')); const SG=require('./v223_testlen_surgery.js');
const src=fs.readFileSync(ART,'utf8');
const FILES={base:ART, Sa:SG.write(SCR,'m10_Sa.html',SG.sa(src)), S26:SG.write(SCR,'m10_S26.html',SG.s26(src))};
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); }; return {IA,els}; }
const V={}; for(const k of Object.keys(FILES)) V[k]=mkVM(FILES[k]);
console.log('versions',Object.entries(V).map(([k,v])=>k+'='+v.IA.version).join(' '),'TZ',Intl.DateTimeFormat().resolvedOptions().timeZone);
const U=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10); const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const oracleTW=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=['sun','mon','tue','wed','thu','fri','sat']; const dowOf=iso=>DOW[new R(U(iso)).getUTCDay()]; const ORD=['mon','tue','wed','thu','fri','sat','sun'];
const txt=h=>(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const bump=(o,k)=>{o[k]=(o[k]||0)+1;}; const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function setWD(Vm,o){ Vm.IA.window.__O=o; Vm.IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:"18-35",eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:undefined};`); Vm.els.clear(); }
function gen(Vm){ const IA=Vm.IA; IA.localStorage._map.clear(); IA.eval('activeProg=null'); try{IA.eval('doGenerate()');}catch(e){return {err:'threw '+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval('activeProg'); if(!p) return {err:'no program'}; return {p:JSON.parse(JSON.stringify(p)),tw:IA.eval('WD._testWeek'),sub:(Vm.els.get('generateSub')||{}).textContent}; }
const runs=(p,w,d)=>{const c=((p.weeks[w]||{})[d]||{}).cardio; return (Array.isArray(c)?c:(c?[c]:[])).filter(x=>x&&x.type==='run');};
const GOALS=[]; for(const t of [570,660,750,855]) GOALS.push(['1.5mi '+fmt(t),{id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
for(const t of [360,420,480,570]) GOALS.push(['1mi '+fmt(t),{id:'run_pace_goal',label:'x',targetDist:'1',paceUnit:'mi',targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
const RESTS={'sun':['sun'],'sat,sun':['sat','sun'],'mon,fri':['mon','fri'],'fri,sat,sun':['fri','sat','sun'],'mon,wed,fri,sun':['mon','wed','fri','sun'],'sun,wed':['sun','wed']};
const W1MON='2026-09-21', TODAY='2026-09-22'; const raceFor=(k,wd)=>addD(W1MON,(k-1)*7+wd);
const S={}; const ex={}; const cw={}; const al={}; const card={}; const fz={}; const fb={}; let ctrl={n:0,eq:0};
for(const [gl,run0] of GOALS) for(const exp of ['beginner','intermediate','advanced']) for(const mile of [null,480]) for(let k=24;k<=35;k++) for(const wd of [3,5]) for(const [rk,rest] of Object.entries(RESTS)){
  const run=Object.assign({},run0,mile?{mileBestMins:'8',mileBestSecs:'00'}:{}); const race=raceFor(k,wd); const o={exp,rest,race,run};
  const R3={}; for(const vk of ['base','Sa','S26']){ setToday(TODAY); setWD(V[vk],o); R3[vk]=gen(V[vk]); }
  if(R3.base.err||R3.Sa.err||R3.S26.err){ bump(S,'ERR '+(R3.base.err||R3.Sa.err||R3.S26.err)); continue; }
  const cls=k>26?'k>26':'k<=26';
  if(k<=26){ ctrl.n++; if(H.progDigest(R3.Sa.p)===H.progDigest(R3.S26.p)) ctrl.eq++; continue; }
  for(const vk of ['base','Sa','S26']){ const b=R3[vk], p=b.p; const key=vk; S[key]=S[key]||{n:0,startEqOracle:0,tot26:0,tw26:0,trialOnTestDay:0,testInside:0,lenHist:{},futureWeeksHist:{}}; const Z=S[key]; Z.n++;
    const expStart=isoU(monU(U(race))-175*864e5); if(p.startDate===expStart) Z.startEqOracle++; if(p.totalWeeks===26) Z.tot26++; if(b.tw===26) Z.tw26++;
    const tw=oracleTW(p.startDate,race); if(tw&&tw<=p.totalWeeks){ Z.testInside++; if(runs(p,tw,dowOf(race)).some(x=>/TIME TRIAL/.test(x.subtype||''))) Z.trialOnTestDay++; }
    bump(Z.lenHist,String(p.totalWeeks)); bump(Z.futureWeeksHist,String(Math.round((U(p.startDate)-monU(U(TODAY)))/864e5/7)));
    const IA=V[vk].IA;
    // calcCurrentWeek / currentWeek right after generate, today = 2026-09-22
    bump(cw[vk]=cw[vk]||{}, 'calcCurrentWeek='+IA.eval('calcCurrentWeek()')+' currentWeek='+IA.eval('currentWeek'));
    // D14a futureWeeks path: is there any alignment object for this program / wizard?
    bump(al[vk]=al[vk]||{}, 'progAlignment='+(IA.eval('progAlignment(activeProg)')?'object':'null')+' wizardAlignment='+(IA.eval('wizardAlignment()')?'object':'null'));
    // Programs card: progSelData + detail text
    const sd=IA.eval('progSelData(activeProg)'); let det=''; try{ det=txt(IA.eval('progDetailHTML(activeProg)')); }catch(e){ det='progDetailHTML threw '+e.message; }
    bump(card[vk]=card[vk]||{}, 'length '+(sd.length===p.totalWeeks?'==built':sd.length)+' | raceStr '+(sd.raceStr?'set':'empty')+' raceWeeks '+sd.raceWeeks+' | detail mentions start/begins: '+(/start|begin/i.test(det)?'yes':'no'));
    if(!ex[vk+'card']) ex[vk+'card']=det.slice(0,400);
    // freeze: sentinel on stored W1 first training day; refresh today (before start) and at start+10d (nothing trained)
    const store=Object.fromEntries(IA.localStorage._map); const progs=JSON.parse(store.ia_programs); const P0=progs[0];
    const d1=Object.keys(P0.weeks[1]||{}).filter(d=>!P0.weeks[1][d].rest).sort((x,y)=>ORD.indexOf(x)-ORD.indexOf(y))[0];
    if(d1){ P0.weeks[1][d1].__SENTINEL__='ZZ-M10'; const s2=JSON.stringify(progs);
      for(const [lab,day] of [['today(before start)',TODAY],['start+10d',addD(p.startDate,10)]]){ setToday(day); IA.localStorage._map.clear(); for(const [kk,vv] of Object.entries(store)) IA.localStorage._map.set(kk,vv); IA.localStorage._map.set('ia_programs',s2);
        let out; try{ out=IA.eval('refreshProgram')(JSON.parse(s2)[0]); }catch(e){ bump(fz[vk]=fz[vk]||{},lab+' threw'); continue; }
        bump(fz[vk]=fz[vk]||{}, lab+': sentinel '+(JSON.stringify(out.weeks[1]).includes('ZZ-M10')?'KEPT (stored day served)':'rebuilt')+' | totalWeeks '+(out.totalWeeks===p.totalWeeks?'same':out.totalWeeks)+' | _testWeek '+out.cfg._testWeek); }
      setToday(TODAY); }
    // wizard callout the athlete reads for this date
    setWD(V[vk],o); try{ IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep();updateRaceDateFeedback()'); }catch(e){}
    bump(fb[vk]=fb[vk]||{}, txt((V[vk].els.get('raceDateFeedback')||{innerHTML:''}).innerHTML).replace(/\d+:\d+/g,'M:SS').replace(/\d+/g,'N').slice(0,200));
  }
}
console.log('\n=== 0  control: k<=26, S26 digest == Sa digest:',ctrl.eq+'/'+ctrl.n, '| errors',JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k])=>k.startsWith('ERR')))));
console.log('\n=== 1  built program, k>26 (test week 27..35 from today\'s start); oracle start = Mon(test week) - 25 weeks');
for(const vk of ['base','Sa','S26']) console.log('  ',vk.padEnd(4),JSON.stringify(S[vk]));
console.log('\n=== 2  calcCurrentWeek() and currentWeek after generate, today 2026-09-22 (k>26)'); for(const vk of ['base','Sa','S26']) console.log('  ',vk.padEnd(4),JSON.stringify(cw[vk]));
console.log('\n=== 3  D14a futureWeeks path: alignment objects exist?'); for(const vk of ['base','Sa','S26']) console.log('  ',vk.padEnd(4),JSON.stringify(al[vk]));
console.log('\n=== 4  freeze (sentinel planted on stored W1 first training day, nothing trained)'); for(const vk of ['base','Sa','S26']) console.log('  ',vk.padEnd(4),JSON.stringify(fz[vk]));
console.log('\n=== 5  Programs card (progSelData / progDetailHTML)'); for(const vk of ['base','Sa','S26']) console.log('  ',vk.padEnd(4),JSON.stringify(card[vk]));
for(const vk of ['base','S26']) console.log('   detail text ex',vk,'|',ex[vk+'card']);
console.log('\n=== 6  wizard callout on the date step (k>26), distinct strings'); for(const vk of ['base','Sa','S26']){ console.log('  ',vk); Object.entries(fb[vk]||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([s,n])=>console.log('      x'+n+' '+s)); }
console.log('\nDONE');
