// v212 measure — P-SAFEPACE measures M1, M2, M3, M5 (coach ruling p_safepace_ruling.md). M4/M6 not run.
// Usage: node tests/measure/v223_safepace_m.js <artifact.html>
// Drives the real wizard path (renderWizardStep header, updateRaceDateFeedback, doGenerate + its timer,
// _applyWizardStart) in the harness VM with a pinned clock and an id-keyed DOM stub.
// ORACLES (independent of the suspect): program-week-of-test by Date.UTC Monday arithmetic (M3);
// paired builds differing ONLY in the goal time (M1: any output change is by construction a goal-time read);
// built prog.totalWeeks as the truth the header is compared to (M5); raw source text scans (M2).
const path=require('path'), fs=require('fs');
const ART=path.resolve(process.argv[2]||'index.html');
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const setToday=iso=>{const[y,m,d]=iso.split('-').map(Number);NOW=new R(y,m-1,d,21,16,0).getTime();};
const H=require(path.resolve(__dirname,'..','harness.js'));
const IA=H.load(ART); const els=new Map(); const mk=IA.window.document.createElement;
IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); };
const U=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10);
const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>{const wd=(new R(t).getUTCDay()+6)%7; return t-wd*864e5;};
const oracleTW=(startIso,testIso)=>{const s=U(startIso),t=U(testIso); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
console.log('artifact',path.basename(ART),'ia-version',IA.version,'TZ',Intl.DateTimeFormat().resolvedOptions().timeZone);

function setWD(o){
  IA.window.__O=o;
  IA.eval(`WD={primaryPath:'event',cardioTypes:__O.types||['run'],experience:__O.exp||'intermediate',ageBracket:__O.age||'18-35',
    eventTargeted:__O.race!=null,raceDate:__O.race||null,liftingFocus:'support_prevention',equipment:'crossfit',
    restDays:__O.rest||['sun','wed'],unit:'lbs',seed:4242,name:'M',cardioGoals:{run:__O.run},startDate:undefined};`);
  if((o.types||[]).includes('bike')) IA.eval("WD.cardioGoals.bike={id:'bike_endurance',label:'x'}");
  els.clear();
}
function header(){
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep();updateRaceDateFeedback()');
  const body=els.get('wizardBody').innerHTML, fb=(els.get('raceDateFeedback')||{innerHTML:''}).innerHTML;
  const txt=fb.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return {hdr:+((body.match(/Program length: (\d+) weeks/)||[])[1])||null, fb:txt,
          rec:+((txt.match(/at least (\d+) weeks/)||[])[1])||null, wu:IA.eval('WD.raceDateWeeks')};
}
function nameStep(){ IA.eval('wizardStep=WIZARD_STEPS.indexOf("name");renderWizardStep()'); const b=els.get('wizardBody').innerHTML.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  if(!globalThis.__nsShown){globalThis.__nsShown=1; console.log('  [name-step sample, weeks mentions]', (b.match(/.{0,50}\bweeks?\b.{0,30}/gi)||[]).join(' || '));}
  return (b.match(/Program length\s*(\d+)\s*weeks?/i)||[])[1]||null; }
function generate(){
  IA.localStorage._map.clear(); IA.eval('activeProg=null');
  try{IA.eval('doGenerate()');}catch(e){return {err:'doGenerate threw '+e.message};}
  IA.flushTimers(Infinity);   // header() queues the 80 ms repaint too; drain everything, then read the saved program
  let p; try{p=IA.eval('activeProg');}catch(e){return {err:e.message};}
  if(!p) return {err:'no program (rejected?) '+(els.get('generateSub')||{}).textContent};
  return {p, tw:IA.eval('WD._testWeek'), cap:IA.eval('WD._raceDateCappedWeeks'), start:p.startDate};
}
function runSessions(p){ const out=[]; for(const w of Object.keys(p.weeks)) for(const d of Object.keys(p.weeks[w])){const c=p.weeks[w][d]&&p.weeks[w][d].cardio; for(const x of (Array.isArray(c)?c:(c?[c]:[]))) if(x&&x.type==='run') out.push({w:+w,d,x});} return out; }
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');

// ======================= M1 =======================
console.log('\n=== M1  goal time -> engine, dated run_pace_goal (1.5mi)');
// static: every reader of the goal-time fields, by enclosing function
const lines=IA.html.split('\n'); const fnAt=i=>{for(let k=i;k>=0;k--){const m=lines[k].match(/^\s*(?:async\s+)?function\s+([\w$]+)/);if(m)return m[1];}return '?';};
console.log('-- static readers (base.html line : enclosing function : text)');
lines.forEach((l,i)=>{ if(/paceGoalTarget\(|calcProgramLength\(|\.targetMins\b(?!\s*=[^=])|\.targetTime\b(?!\s*=[^=])/.test(l)&&!/^\s*\/\//.test(l)&&!/^\s*function (paceGoalTarget|calcProgramLength)/.test(l))
  console.log('  :'+(i+1)+' '+fnAt(i)+' | '+l.trim().replace(/\s+/g,' ').slice(0,120)); });
// dynamic A: Mario's cfg, five goal times, today 2026-09-22
setToday('2026-09-22');
const G=[null,540,630,720,855];
const A={};
for(const gs of G){ setWD({race:'2026-10-20',run:Object.assign({id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',mileBestMins:'8',mileBestSecs:'00'},gs?{targetMins:String(Math.floor(gs/60)),targetSecs:String(gs%60),targetTime:fmt(gs)}:{})});
  const h=header(); const b=generate(); A[gs]=b; console.log('  goal',gs?fmt(gs):'blank','| hdr',h.hdr,'rec',h.rec,'| _testWeek',b.tw,'totalWeeks',b.p&&b.p.totalWeeks,'| digest',b.p&&H.progDigest(b.p)); }
const diffSess=(pa,pb)=>{const a=runSessions(pa),b=runSessions(pb); const res=[]; const key=s=>s.w+'/'+s.d+'/'+s.x.subtype;
  const mb=new Map(b.map(s=>[s.w+'/'+s.d,s])); for(const s of a){const t=mb.get(s.w+'/'+s.d); if(!t){res.push(key(s)+' missing');continue;}
    const ks=new Set([...Object.keys(s.x),...Object.keys(t.x)]); const f=[...ks].filter(k=>JSON.stringify(s.x[k])!==JSON.stringify(t.x[k])); if(f.length) res.push({k:key(s),f,a:s.x,b:t.x});}
  return {n:a.length,res};};
for(const [ga,gb] of [[720,630],[720,855],[720,540],[720,null]]){ const r=diffSess(A[ga].p,A[gb].p);
  console.log('-- diff goal',fmt(ga),'vs',gb?fmt(gb):'blank',':',r.res.length,'of',r.n,'run sessions differ');
  r.res.forEach(x=>{ if(typeof x==='string'){console.log('   ',x);return;} console.log('    W'+x.k,'fields',x.f.join(','));
    x.f.forEach(k=>console.log('       '+k+': '+JSON.stringify(x.a[k]).slice(0,170)+'\n       '+' '.repeat(k.length)+'  '+JSON.stringify(x.b[k]).slice(0,170))); }); }
// dynamic B: paired lattice, only the goal time varies
console.log('-- paired lattice: exp x mile x testOffset(days) x goal pair; everything else pinned');
const M1={pairs:0,lenDiff:0,twDiff:0,sessDiff:0,sessTot:0,sessChanged:0,seg:{}}; const ex1=[];
const bump=(o,k)=>{o.seg[k]=(o.seg[k]||0)+1;};
for(const exp of ['beginner','intermediate','advanced']) for(const mb of [null,480,600]) for(const off of [4,10,20,28,41,55,76,104,140]){
  const race=addD('2026-09-22',off); const res={};
  for(const gs of [540,630,720,855]){ setWD({exp,race,run:Object.assign({id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',targetMins:String(Math.floor(gs/60)),targetSecs:String(gs%60),targetTime:fmt(gs)},mb?{mileBestMins:String(Math.floor(mb/60)),mileBestSecs:String(mb%60)}:{})});
    res[gs]=generate(); if(res[gs].err){bump(M1,'ERR '+res[gs].err.slice(0,50));} }
  for(const [ga,gb] of [[720,630],[720,855],[630,540]]){ const a=res[ga],b=res[gb]; if(a.err||b.err) continue; M1.pairs++;
    const seg=exp+'/off'+off;
    if(a.p.totalWeeks!==b.p.totalWeeks){M1.lenDiff++;bump(M1,'lenDiff off'+off);bump(M1,'lenDiff '+exp+'/mile'+(mb||'none'));if(ex1.length<4)ex1.push(`${exp} mile ${mb||'none'} test +${off}d: goal ${fmt(ga)} -> ${a.p.totalWeeks} wk tw ${a.tw} | goal ${fmt(gb)} -> ${b.p.totalWeeks} wk tw ${b.tw}`);}
    if(a.tw!==b.tw){M1.twDiff++;}
    if(a.p.totalWeeks===b.p.totalWeeks){ const r=diffSess(a.p,b.p); M1.sessTot+=r.n; M1.sessChanged+=r.res.length; if(r.res.length){M1.sessDiff++; bump(M1,'sessDiff '+exp); r.res.forEach(x=>typeof x!=='string'&&x.f.forEach(f=>bump(M1,'field '+f)));} }
  } }
console.log('  pairs',M1.pairs,'| totalWeeks differs',M1.lenDiff,'| _testWeek differs',M1.twDiff,'| same-length pairs with >=1 run session changed',M1.sessDiff,'| run sessions changed',M1.sessChanged+'/'+M1.sessTot);
Object.keys(M1.seg).sort().forEach(k=>console.log('   ',k,M1.seg[k])); ex1.forEach(e=>console.log('   ex',e));

// ======================= M2 =======================
console.log('\n=== M2  caller counts (base.html + tests/)');
const NAMES=['applySuggestedPace','achievablePacePerMile','paceCeilingOfferHTML','updatePaceFeasibility','updateRaceDateFeedback','assessRunPaceCeiling','previewWeeks','updatePaceDisplay','updatePaceTime','paceFeasLine','raceDateFeedback'];
const stripC=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.replace(/(^|[^:'"\\])\/\/.*$/,'$1')).join('\n');
const js=IA.js, jsNC=stripC(js);
for(const n of NAMES){ const re=new RegExp('\\b'+n+'\\b','g'); const raw=(js.match(re)||[]).length, nc=(jsNC.match(re)||[]).length;
  const def=(jsNC.match(new RegExp('function\\s+'+n+'\\s*\\('))||[]).length; const calls=(jsNC.match(new RegExp('\\b'+n+'\\s*\\(','g'))||[]).length-def;
  const inAttr=(jsNC.match(new RegExp('on\\w+=\\\\?"[^"]*\\b'+n+'\\b','g'))||[]).length;
  console.log('  '+n.padEnd(24),'raw',raw,'| non-comment',nc,'| def',def,'| call sites',calls,'| inside on*="" attrs',inAttr); }
console.log('  80ms timer sites:',(jsNC.match(/setTimeout\(\s*\(\)\s*=>\s*updateRaceDateFeedback\(\)\s*,\s*80\)/g)||[]).length);
jsNC.split('\n').forEach((l,i)=>{ for(const n of NAMES.slice(0,6)) if(new RegExp('\\b'+n+'\\s*\\(').test(l)&&!new RegExp('function\\s+'+n).test(l)) console.log('    js:'+(i+1)+' '+n+' <- '+fnAtJ(i)); });
function fnAtJ(i){const L=js.split('\n');for(let k=i;k>=0;k--){const m=L[k].match(/^\s*(?:async\s+)?function\s+([\w$]+)/);if(m)return m[1];}return '?';}
const TD=path.resolve(__dirname,'..'); const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const tfiles=walk(TD).filter(f=>/\.(js|json|sh|py|txt)$/.test(f)&&!/v223_safepace_m\.js$/.test(f));
for(const n of NAMES.slice(0,9)){ const hits=tfiles.map(f=>[path.relative(TD,f),(fs.readFileSync(f,'utf8').match(new RegExp('\\b'+n+'\\b','g'))||[]).length]).filter(x=>x[1]);
  const byDir={}; hits.forEach(([f,c])=>{const k=f.split('/')[0]; byDir[k]=(byDir[k]||0)+c;});
  console.log('  tests: '+n.padEnd(24),hits.length,'files',JSON.stringify(byDir),hits.filter(h=>!/^measure\//.test(h[0])).map(h=>h[0]+':'+h[1]).join(' ')); }

// ======================= M3 =======================
console.log('\n=== M3  test under a week away: daysUntil 0..7 x 7 weekdays x rest patterns');
const RESTS={none:[],sun:['sun'],'sun,wed':['sun','wed'],'sat,sun':['sat','sun'],'fri,sat,sun':['fri','sat','sun'],'mon,wed,fri':['mon','wed','fri'],'thu..sun':['thu','fri','sat','sun']};
const M3={n:0,twOracleMis:0,tab:{},sent:{},bad:[]};
for(let wd=0;wd<7;wd++) for(let du=0;du<=7;du++) for(const rk of Object.keys(RESTS)){
  const today=addD('2026-09-21',wd); setToday(today); const race=addD(today,du);
  setWD({race,rest:RESTS[rk],run:{id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'0',targetTime:'12:00'}});
  const h=header(); const b=generate(); M3.n++;
  if(b.err){M3.bad.push(today+' +'+du+' '+rk+' '+b.err);continue;}
  const orc=oracleTW(b.start,race);
  if(orc!==b.tw && !(orc>6)) {M3.twOracleMis++; if(M3.bad.length<6) M3.bad.push(`${today}(${DOW[new R(U(today)).getUTCDay()]}) +${du}d rest ${rk}: start ${b.start} tw ${b.tw} oracle ${orc} totalWeeks ${b.p.totalWeeks}`);}
  const sentence=/test week only/.test(h.fb)?'TESTWEEK-ONLY':/Less than a week/.test(h.fb)?'LESS-THAN-WEEK':/ends on your test/.test(h.fb)?'ENDS-ON-TEST':/passed/.test(h.fb)?'PASSED':'OTHER';
  const k=`du${du} tw=${b.tw} total=${b.p.totalWeeks}`; M3.tab[k]=(M3.tab[k]||0)+1;
  const sk=`tw=${b.tw} total=${b.p.totalWeeks} weeksUntil=${h.wu} -> ${sentence}`; M3.sent[sk]=(M3.sent[sk]||0)+1;
  if(du>=1&&du<=6&&b.tw===2&&sentence==='TESTWEEK-ONLY'&&!M3.ex2) M3.ex2=`${today}(${DOW[new R(U(today)).getUTCDay()]}) test ${race} rest ${rk}: start ${b.start}, tw 2, totalWeeks ${b.p.totalWeeks}; card: "${h.fb.slice(0,110)}"`;
  if(du>=1&&du<=6&&b.tw==null&&!M3.exN) M3.exN=`${today}(${DOW[new R(U(today)).getUTCDay()]}) test ${race} rest ${rk}: start ${b.start}, tw null, totalWeeks ${b.p.totalWeeks}; card: "${h.fb.slice(0,110)}"`;
}
console.log('  builds',M3.n,'| _testWeek != UTC-Monday oracle (oracle<=6)',M3.twOracleMis); M3.bad.forEach(x=>console.log('   ',x));
console.log('  -- daysUntil x tw x totalWeeks (count over 7 weekdays x 7 rest patterns = 49 per du)'); Object.keys(M3.tab).sort().forEach(k=>console.log('   ',k,M3.tab[k]));
console.log('  -- tw/total vs card sentence (du 0..7)'); Object.keys(M3.sent).sort().forEach(k=>console.log('   ',k,M3.sent[k]));
console.log('  ex tw=2 with test-week-only card:',M3.ex2||'none'); console.log('  ex tw=null under a week:',M3.exN||'none');

// ======================= M5 =======================
console.log('\n=== M5  wizard header "Program length" vs built totalWeeks');
setToday('2026-09-22');
const GOALS=[['run_pace_goal',{targetDist:'1.5',targetMins:'12',targetSecs:'0',targetTime:'12:00'}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30',targetTime:'10:30'}],['run_pace_goal',{targetDist:'1',targetMins:'7',targetSecs:'0',targetTime:'7:00'}],
  ['run_mile_time',{}],['run_15_under10',{}],['run_base',{}],['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]];
const M5={n:0,dis:0,disName:0,nameN:0,seg:{},ex:{}};
for(const [gid,extra] of GOALS) for(const exp of ['beginner','intermediate','advanced']) for(const mb of [null,480]) for(const types of [['run'],['run','bike']]) for(const off of [null,5,12,26,40,61,82,120,160]){
  const race=off==null?null:addD('2026-09-22',off);
  setWD({exp,types,race,run:Object.assign({id:gid,label:'x',paceUnit:'mi'},extra,mb?{mileBestMins:'8',mileBestSecs:'00'}:{})});
  let h; try{h=header();}catch(e){bump(M5,'HDR CRASH '+e.message.slice(0,40));continue;}
  const nm=nameStep(); const b=generate(); if(b.err){bump(M5,'ERR '+b.err.slice(0,50));continue;} M5.n++;
  const cls=(['run_5k','run_10k','run_half','run_marathon'].includes(gid)?'race':gid==='run_base'?'base':'test')+'/'+(off==null?'undated':'dated');
  M5.seg[cls+' n']=(M5.seg[cls+' n']||0)+1;
  if(h.hdr!==b.p.totalWeeks){M5.dis++; M5.seg[cls+' DIS']=(M5.seg[cls+' DIS']||0)+1; const dk=cls+(b.tw?' tw-pinned':'');
    M5.seg[dk+' DIS']=(M5.seg[dk+' DIS']||0)+ (dk!==cls?1:0);
    if(!M5.ex[cls]) M5.ex[cls]=`${gid} ${JSON.stringify(extra.targetTime||'')} ${exp} mile ${mb||'none'} ${types.join('+')} test ${race||'none'}: header ${h.hdr}, callout rec ${h.rec}, weeksUntil ${h.wu}, _testWeek ${b.tw}, built ${b.p.totalWeeks}`;}
  if(nm!=null){M5.nameN++; if(+nm!==b.p.totalWeeks){M5.disName++; M5.seg[cls+' NAME-DIS']=(M5.seg[cls+' NAME-DIS']||0)+1; if(!M5.ex['name '+cls]) M5.ex['name '+cls]=`${gid} ${exp} mile ${mb||'none'} ${types.join('+')} test ${race||'none'}: name step ${nm}, header ${h.hdr}, built ${b.p.totalWeeks}`;}}
}
console.log('  builds',M5.n,'| header != built',M5.dis+'/'+M5.n,'| name-step "N weeks" != built',M5.disName+'/'+M5.nameN);
Object.keys(M5.seg).filter(k=>!/ DIS$/.test(k)||M5.seg[k]).sort().forEach(k=>console.log('   ',k,M5.seg[k]));
Object.keys(M5.ex).forEach(k=>console.log('   ex',k,'|',M5.ex[k]));
console.log('\nDONE');
