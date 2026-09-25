// V221 measure: prog.blockOpen — readers, persistence, who is affected, boot invariant, legacy delete backfill.
// node tests/measure/v221_blockopen.js <base.html> <s1_s3.html> <s4.html>
// Oracles: date arithmetic (days in [startDate, blockOpen) are the only days the flag can move),
// raw localStorage bytes, and the D178 invariant ia_active === activeProgId === activeProg.id (or all null).
// Clock: uses the machine's today (the flag is "today" by definition). Seeds pinned.
const H=require('../harness.js');const crypto=require('crypto');const fs=require('fs');
const S='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/e027169a-4735-433b-869c-f16dba0d4f36/scratchpad';
const [BASE,S13,S4]=process.argv.length>4?process.argv.slice(2):[S+'/base_v220.html',S+'/m_blk/s1_s3.html',S+'/m_blk/s4_parked.html'];
const ARTS=[['base',BASE],['s1_s3',S13],['s4',S4]];
const out=[];const log=(...a)=>{const s=a.join(' ');out.push(s);console.log(s);};
const pad=n=>String(n).padStart(2,'0');const TODAY=new Date();TODAY.setHours(0,0,0,0);
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const plus=n=>{const d=new Date(TODAY);d.setDate(d.getDate()+n);return iso(d);};
const pd=s=>{const [y,m,d]=s.split('-').map(Number);const x=new Date(y,m-1,d);x.setHours(0,0,0,0);return x;};
const monOf=s=>{const x=pd(s);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
const sha=s=>crypto.createHash('sha1').update(String(s)).digest('hex').slice(0,10);
const HM=H.fixtures.HALF_MANNY;
const runG=(id,extra)=>({run:Object.assign({id,label:id,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'},extra||{})});
log('TODAY',iso(TODAY));

// ---------- VM helpers ----------
function boot(ART,store){const IA=H.load(ART);const LS=IA.localStorage;LS.clear();
  if(store)for(const [k,v] of Object.entries(store))LS.setItem(k,v);
  IA.eval('(function(){const m={};const o=document.getElementById;document.getElementById=function(id){return m[id]||(m[id]=o(id));};globalThis.__els=m;})()');
  IA.eval('activeProgId=null;activeProg=null;');IA.eval('init()');IA.flushTimers(30);return IA;}
const dump=IA=>Object.fromEntries(IA.localStorage._map);
const stored=(IA,id)=>{const p=JSON.parse(IA.localStorage.getItem('ia_programs')||'[]');return id?p.find(x=>x.id===id):p;};
const bo=v=>v===undefined?'absent':v;

// ---------- 1. readers/writers (static, comments stripped for the count) ----------
log('\n=== 1. blockOpen sites, per artifact (comment-stripped count / raw count)');
for(const [n,A] of ARTS){const js=H.extractInlineJS(fs.readFileSync(A,'utf8'));
  const nc=js.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.replace(/(^|[^:'"\\])\/\/.*$/,'$1')).join('\n');
  log(n,'blockOpen code refs',(nc.match(/blockOpen/g)||[]).length,'raw',(js.match(/blockOpen/g)||[]).length,
      '| dayBeforeStart( call sites',(nc.match(/dayBeforeStart\(/g)||[]).length-1);}

// ---------- 2. persistence lifecycle ----------
log('\n=== 2. persistence: stored ia_programs[].blockOpen / activeProg.blockOpen');
function wizard(IA,cfg){IA.eval('WD=Object.assign(WD||{},'+JSON.stringify(cfg)+')');IA.eval('doGenerate()');IA.flushTimers(60);return IA.eval('activeProgId');}
function hookSaves(IA){const r=[];IA.eval('(function(){const o=savePrograms;savePrograms=function(p){__saves.push((p||[]).map(x=>x&&x.blockOpen===undefined?"absent":x&&x.blockOpen).join(","));return o(p);};})()'.replace('__saves','globalThis.__saves'));IA.eval('globalThis.__saves=[]');return ()=>{const s=IA.eval('globalThis.__saves');const t=s.slice();IA.eval('globalThis.__saves=[]');return t.length?t.join(';'):'none';};}
function firstTrainDay(IA){const w=IA.eval('currentWeek');const wk=IA.eval('activeProg.weeks['+w+']');return DAYS.find(d=>wk[d]&&!wk[d].rest&&!IA.eval(`dayBeforeStart(activeProg,${w},'${d}')`)&&(wk[d].sections||[]).some(s=>(s.items||[]).length));}
const chains=[['HALF_MANNY as-is',Object.assign({},HM)],['run_half race +6w',Object.assign({},HM,{raceDate:plus(45)})]];
for(const [n,A] of ARTS)for(const [cn,cfg] of chains){
  const row=[];const st=(IA,label,sv)=>{const id=IA.eval('activeProgId');row.push(`${label}: stored=${bo((stored(IA,id)||{}).blockOpen)} mem=${bo((IA.eval('activeProg')||{}).blockOpen)} saves=[${sv()}]`);};
  let IA=boot(A);let sv=hookSaves(IA);const id=wizard(IA,cfg);st(IA,'commit',sv);
  // in-session race re-set (same date) before any reboot
  { const IB=boot(A,dump(IA));/*placeholder for fresh chain*/ }
  const Ix=boot(A);const svx=hookSaves(Ix);wizard(Ix,cfg);svx();Ix.eval(`setProgRace(${JSON.stringify(cfg.raceDate)})`);st(Ix,'in-session setProgRace(same)',svx);
  IA=boot(A,dump(IA));sv=hookSaves(IA);st(IA,'reboot1',sv);
  const d=firstTrainDay(IA);const w=IA.eval('currentWeek');
  if(d){IA.eval(`markDayComplete(${w},'${d}','t')`);st(IA,`Done tap W${w} ${d}`,sv);
    const wk=IA.eval(`activeProg.weeks[${w}]['${d}']`);let si=-1,ii=-1;(wk.sections||[]).some((s,a)=>(s.items||[]).some((it,b)=>{if(it&&it.name){si=a;ii=b;return true;}return false;}));
    IA.eval(`currentWeek=${w};currentDayKey='${d}';_swapCtx={secIdx:${si},itemIdx:${ii},name:activeProg.weeks[${w}]['${d}'].sections[${si}].items[${ii}].name,detail:''};applySwapChoice('Goblet Squat')`);st(IA,'swap',sv);}
  else row.push('no train day this week: Done/swap skipped');
  IA=boot(A,dump(IA));sv=hookSaves(IA);st(IA,'reboot2',sv);
  IA.eval(`setProgRace(${JSON.stringify(cfg.raceDate)})`);st(IA,'post-reboot setProgRace(same)',sv);
  IA=boot(A,dump(IA));sv=hookSaves(IA);st(IA,'reboot3',sv);
  log(`[${n}] ${cn} (start ${stored(IA)[0].startDate}):\n   `+row.join('\n   '));}

// ---------- 3. who is affected ----------
log('\n=== 3. lattice: blockOpen set / effective, and surface deltas with vs without the flag (base)');
const rows=[];let seed=7000;const add=(g,kind,o)=>rows.push({g,kind,cfg:Object.assign({},HM,{seed:seed++,name:'M'},o)});
add('run_half','HALF_MANNY as-is',{});
for(const g of ['run_5k','run_10k','run_half','run_marathon'])for(let w=4;w<=16;w++)for(let o=0;o<7;o++)
  add(g,'race',{cardioTypes:['run'],cardioGoals:runG(g),eventTargeted:true,raceDate:plus(7*w+o)});
for(const g of ['run_5k','run_10k','run_half','run_marathon']){add(g,'no race date',{cardioTypes:['run'],cardioGoals:runG(g),eventTargeted:true,raceDate:undefined});
  for(const w of [4,8,12])add(g,'event off',{cardioTypes:['run'],cardioGoals:runG(g),eventTargeted:false,raceDate:plus(7*w+2)});}
const PG=runG('run_pace_goal',{targetMins:'9',targetSecs:'00'});
for(let w=1;w<=16;w++)add('run_pace_goal','test dated',{cardioTypes:['run'],cardioGoals:PG,eventTargeted:true,raceDate:plus(7*w+3)});
add('run_pace_goal','no test date',{cardioTypes:['run'],cardioGoals:PG,eventTargeted:true,raceDate:undefined});
for(const w of [0,-10,10])add('run_base','base',{cardioTypes:['run'],cardioGoals:runG('run_base'),eventTargeted:false,raceDate:undefined,startDate:w?plus(w):undefined});
add('lift','lift only',{cardioTypes:[],cardioGoals:{},primaryPath:'lift',eventTargeted:false,raceDate:undefined});
const IA=boot(BASE);
IA.eval('globalThis.__toasts=[];(function(){const o=showToast;showToast=function(m){__toasts.push(String(m));};})();globalThis.__pops=[];(function(){popFire=function(t,o){__pops.push(t+":"+JSON.stringify(o&&o.stats||o||{}).slice(0,80));};})();');
IA.eval('globalThis.__P=null');
const agg={};const bump=(k,f,v=1)=>{agg[k]=agg[k]||{};agg[k][f]=(agg[k][f]||0)+v;};
let halfRow=null;
for(const r of rows){const c=JSON.parse(JSON.stringify(r.cfg));if(c.raceDate===undefined)delete c.raceDate;if(c.startDate===undefined)delete c.startDate;
  IA.eval('__P=buildProgram('+JSON.stringify(c)+');_applyWizardStart(__P,'+JSON.stringify(c)+');__P.id="PX";');
  const p=IA.eval('__P');const key=r.g+' '+r.kind;bump(key,'n');
  if(p.blockOpen===undefined)continue;bump(key,'set');
  // oracle: days in [startDate, blockOpen) by date arithmetic
  const sd=pd(p.startDate),bod=pd(p.blockOpen),mon=monOf(p.startDate);const exp=[];
  for(let w=1;w<=p.totalWeeks;w++)DAYS.forEach((d,i)=>{const dt=new Date(mon);dt.setDate(mon.getDate()+(w-1)*7+i);dt.setHours(0,0,0,0);if(dt>=sd&&dt<bod&&p.weeks[w]&&p.weeks[w][d])exp.push([w,d]);});
  // measured: dayBeforeStart with vs without
  const flipped=[];for(let w=1;w<=p.totalWeeks;w++)for(const d of DAYS){if(!p.weeks[w]||!p.weeks[w][d])continue;
    const a=IA.eval(`dayBeforeStart(__P,${w},'${d}')`);const b=IA.eval(`(function(){const q=Object.assign({},__P);delete q.blockOpen;return dayBeforeStart(q,${w},'${d}');})()`);if(a!==b)flipped.push([w,d]);}
  const agree=JSON.stringify(exp)===JSON.stringify(flipped);if(!agree)bump(key,'ORACLE_MISMATCH');
  if(!exp.length)continue;bump(key,'effective');
  const trainFlip=exp.filter(([w,d])=>!p.weeks[w][d].rest).length,restFlip=exp.length-trainFlip;
  bump(key,'days',exp.length);bump(key,'trainDays',trainFlip);bump(key,'restDays',restFlip);
  // surfaces: render every affected week both ways
  const weeks=[...new Set(exp.map(x=>x[0]))];let strip=0,hero=0,stats=0,any=0,toastW=0,toastWO=0,restEligW=0,restEligWO=0;
  const surf=flag=>{IA.eval(`activeProg=__P;activeProgId="PX";${flag?'':'activeProg=Object.assign({},__P);delete activeProg.blockOpen;'}`);const res={};
    for(const w of weeks){IA.eval(`currentWeek=${w};renderWeekView()`);const els=IA.eval('Object.values(__els).map(e=>e.innerHTML).filter(h=>h&&h.indexOf("wk-stats")>=0)');const h=els[0]||'';
      const hi=h.indexOf('wk-hero'),si=h.indexOf('wk-stats');res[w]={strip:sha(h.slice(0,hi)),hero:sha(h.slice(hi,si)),stats:h.slice(si).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,90)};}
    IA.eval('__toasts.length=0');let rest=0;for(const [w,d] of exp){IA.eval(`currentWeek=${w};openDayKey('${d}')`);if(IA.eval(`restDayEligible(${w},'${d}')`))rest++;}
    res.toasts=IA.eval('__toasts.filter(t=>/Before your start/.test(t)).length');res.rest=rest;
    const t=iso(TODAY);res.sched=IA.eval('scheduledDays(new Date('+TODAY.getTime()+')).length');res.streak=IA.eval('computeStreak()');
    IA.eval('localStorage.removeItem("ia_remind_last_PX");localStorage.removeItem("ia_reminded_PX");__pops.length=0;maybeShowReminder()');res.remind=IA.eval('__pops.slice()').join('|');
    res.finalDay=JSON.stringify(IA.eval('finalScheduledDay()'));res.wild=JSON.stringify(IA.eval('wildcardDayFor(new Date())'));return res;};
  const W=surf(true),WO=surf(false);
  for(const w of weeks){if(W[w].strip!==WO[w].strip)strip++;if(W[w].hero!==WO[w].hero)hero++;if(W[w].stats!==WO[w].stats)stats++;}
  bump(key,'weeksAffected',weeks.length);bump(key,'stripWeeksDiff',strip);bump(key,'heroWeeksDiff',hero);bump(key,'statsWeeksDiff',stats);
  bump(key,'tapToast_with',W.toasts);bump(key,'tapToast_without',WO.toasts);bump(key,'restEligible_with',W.rest);bump(key,'restEligible_without',WO.rest);
  bump(key,'scheduledPast_with',W.sched);bump(key,'scheduledPast_without',WO.sched);
  if(W.remind!==WO.remind)bump(key,'reminderDiffers');if(W.streak!==WO.streak)bump(key,'streakDiffers');if(W.finalDay!==WO.finalDay)bump(key,'finalDayDiffers');if(W.wild!==WO.wild)bump(key,'wildcardDayDiffers');
  if(r.kind==='HALF_MANNY as-is'){halfRow={start:p.startDate,blockOpen:p.blockOpen,exp:exp.map(x=>'W'+x[0]+x[1]).join(' '),W,WO,weeks};}
}
for(const [k,v] of Object.entries(agg))log(k.padEnd(28),JSON.stringify(v));
const tot=Object.values(agg).reduce((a,v)=>{for(const [f,n] of Object.entries(v))a[f]=(a[f]||0)+n;return a;},{});
log('TOTAL'.padEnd(28),JSON.stringify(tot));
if(halfRow){log('\nHALF_MANNY as-is: start',halfRow.start,'blockOpen',halfRow.blockOpen,'flipped days:',halfRow.exp);
  for(const w of halfRow.weeks)log(`  W${w} stats with:    ${halfRow.W[w].stats}\n  W${w} stats without: ${halfRow.WO[w].stats}  strip ${halfRow.W[w].strip===halfRow.WO[w].strip?'same':'DIFF'} hero ${halfRow.W[w].hero===halfRow.WO[w].hero?'same':'DIFF'}`);
  log('  reminder with:',halfRow.W.remind||'(none)','| without:',halfRow.WO.remind||'(none)');
  log('  scheduledDays(today) with',halfRow.W.sched,'without',halfRow.WO.sched,'| streak',halfRow.W.streak,halfRow.WO.streak,'| tap toast',halfRow.W.toasts,halfRow.WO.toasts,'| restEligible',halfRow.W.rest,halfRow.WO.rest);}

// ---------- 4. boot invariant gaps ----------
log('\n=== 4. boot with stale ia_active');
function mk(id,extra){const I=H.load(BASE);const p=I.buildProgram(Object.assign({},HM,{seed:4242}));p.id=id;p.name=id;p.startDate='2026-09-07';return Object.assign(p,extra||{});}
const A1=mk('A1',{archived:true,archivedAt:1}),L1=mk('L1');
const cases=[['a all archived',{ia_programs:JSON.stringify([A1]),ia_active:'A1'}],['b programs empty',{ia_programs:'[]',ia_active:'GONE'}],
  ['b2 programs key missing',{ia_active:'GONE'}],['c ia_active deleted, live L1',{ia_programs:JSON.stringify([L1]),ia_active:'GONE'}],
  ['d ia_active archived, live L1',{ia_programs:JSON.stringify([A1,L1]),ia_active:'A1'}],['e control, ia_active L1',{ia_programs:JSON.stringify([L1]),ia_active:'L1'}]];
for(const [n,A] of ARTS)for(const [cn,st] of cases){const I=boot(A,st);const ap=I.eval('activeProg');const v=[I.localStorage.getItem('ia_active'),I.eval('activeProgId'),ap?ap.id:null];
  const inv=(v[0]===v[1]&&v[1]===v[2])?'HOLDS':'BROKEN';log(`${n.padEnd(6)} ${cn.padEnd(30)} ia_active=${v[0]} activeProgId=${v[1]} activeProg.id=${v[2]} screen=${I.eval('_curScreen')} invariant=${inv}`);}

// ---------- 5. legacy delete backfill ----------
log('\n=== 5. delete active program whose successor is legacy (cfg.seed absent, prog.seed present)');
const legacy=(id,extra)=>{const p=mk(id,extra);p.seed=p.cfg.seed;delete p.cfg.seed;return p;};
const pgT=(()=>{const I=H.load(BASE);const c=Object.assign({},HM,{seed:4343,cardioGoals:PG,raceDate:plus(40)});const p=I.buildProgram(c);p.id='T2';p.name='T2';p.startDate=plus(-3);p.seed=4343;delete p.cfg.seed;delete p.cfg._testWeek;return p;})();
const lcases=[['legacy seed',[mk('D1'),legacy('L2')]],['legacy seed + dated test, no _testWeek',[mk('D1'),pgT]]];
for(const [n,A] of ARTS)for(const [cn,progs] of lcases){for(const op of ['deleteProg','archiveProg']){
  const I=boot(A,{ia_programs:JSON.stringify(progs),ia_active:'D1'});const nid=progs[1].id;
  I.eval(`${op}('D1')`);const s=stored(I,nid);const ap=I.eval('activeProg');const dig=ap?H.progDigest(ap):null;
  const R=boot(A,dump(I));const s2=stored(R,nid);const ap2=R.eval('activeProg');
  log(`${n.padEnd(6)} ${cn.padEnd(40)} ${op.padEnd(11)} stored cfg.seed=${s.cfg.seed} _testWeek=${s.cfg._testWeek} | mem cfg.seed=${ap&&ap.cfg.seed} digest=${dig} | reboot stored cfg.seed=${s2.cfg.seed} _testWeek=${s2.cfg._testWeek} digest=${ap2?H.progDigest(ap2):null} same=${dig===(ap2?H.progDigest(ap2):null)}`);}}
fs.writeFileSync(__dirname+'/v221_blockopen.out.txt',out.join('\n')+'\n');
log('DONE');
