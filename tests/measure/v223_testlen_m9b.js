// v223 measure M9b — P-TESTLEN (c), D184 Q2: does "starts today" hold when the ENTERED start is not today?
// Usage: node tests/measure/v223_testlen_m9b.js <index.html> <scratchdir>     (clock pinned per "today", TZ from env)
// Artifacts: base = current tree (D184 (a)(b) landed, (c) not). Sc2 = base + (c) as D184 Q2 states it, re-anchored to
//   the current tree (v223_testlen_surgery.js Sc anchors on the pre-(a) tree and no longer apply): resolveStartDate(dateStr,
//   restDays, raceIso) does not snap when the partial week holds the test; returns holdsTest; startResolveCopy prints the
//   ruling's holdsTest sentence; every resolver caller passes the test date of a dated test goal. Instrument, not a proposal.
// Lattice: today = Mon..Sun of the week of 2026-09-21 (local 21:16) x entered start today-7..today+27 x 7 rest patterns
//   x test date today..today+34, per goal (2 dated test goals). Builds only on the oracle's (c)-cases (3 exp x base,Sc2).
// ORACLES (never the resolver): (c)-case by date arithmetic: entered weekday offset > 0, every weekday entered..Sunday is
//   in the rest set, test in [entered, Sunday of entered's week]. "This week" = test in TODAY's Mon..Sun. Test week by
//   Date.UTC Monday arithmetic. "Rest until you run it" = no W1 day from max(start,today) to test-1 carries a run or a
//   section, plus a separate count of days today..start-1 that are OUTSIDE the program (start in the future).
const path=require('path'), fs=require('fs');
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]);
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const setToday=iso=>{const[y,m,d]=iso.split('-').map(Number);NOW=new R(y,m-1,d,21,16,0).getTime();};
const H=require(path.resolve(__dirname,'..','harness.js'));
function rep(src,a,b,tag){ const n=src.split(a).length-1; if(n!==1) throw new Error('NOT-APPLIED '+tag+' anchor count '+n); return src.split(a).join(b); }
function sc2(src){
  src=rep(src,"function resolveStartDate(dateStr, restDays){",
    "function _rsRace(c){ const g=c&&c.cardioGoals&&c.cardioGoals.run; return (c&&(c.cardioTypes||[]).includes('run')&&g&&PACE_GOALS.has(g.id)&&c.eventTargeted!==false&&c.raceDate)?c.raceDate:null; }\nfunction resolveStartDate(dateStr, restDays, raceIso){",'sig');
  src=rep(src,"  if(partial && week1Train.length === 0){",
    "  const _rt = raceIso ? _parseLocalDate(raceIso) : null; const _nmT = new Date(mon); _nmT.setDate(mon.getDate()+7); _nmT.setHours(0,0,0,0);\n  const _holds = !!(partial && week1Train.length === 0 && _rt && _rt >= d && _rt < _nmT);\n  if(partial && week1Train.length === 0 && !_holds){",'snap');
  src=rep(src,"  return {start:_isoOf(d), entered:_isoOf(d), mon:_isoOf(mon), partial, snapped:false,\n          week1Train, nextMon:_isoOf(nm)};",
    "  return {start:_isoOf(d), entered:_isoOf(d), mon:_isoOf(mon), partial, snapped:false, holdsTest:_holds,\n          week1Train, nextMon:_isoOf(nm)};",'ret');
  src=rep(src,"  if(r.snapped){\n    return 'Nothing left","  if(r.holdsTest) return 'This week holds your test, so this starts today. Week 1 is the test week.';\n  if(r.snapped){\n    return 'Nothing left",'copy');
  src=rep(src,"return progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[]).start);","return progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD)).start);",'wizardTestPin');
  src=rep(src,"  const r = resolveStartDate(WD.startDate, WD.restDays||[]);\n  const a = document.getElementById('startResolve');","  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));\n  const a = document.getElementById('startResolve');",'updateStartResolve');
  src=rep(src,"const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || []);","const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || [], _rsRace(wd));",'applyWizardStart');
  src=rep(src,"const _sr = resolveStartDate(WD.startDate, WD.restDays||[]);","const _sr = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));",'namestep');
  src=rep(src,"progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start)","progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start)",'doGenerate');
  src=rep(src,"const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[]);","const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[],_rsRace(activeProg.cfg));",'setProgStart');
  return src;
}
const src=fs.readFileSync(ART,'utf8'); const scf=path.join(SCR,'m9b_Sc2.html'); try{fs.unlinkSync(scf);}catch(e){} fs.writeFileSync(scf,sc2(src));
const FILES={base:ART, Sc2:scf};
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); }; return {IA,els}; }
const V={}; for(const k of Object.keys(FILES)) V[k]=mkVM(FILES[k]);
console.log('versions',Object.entries(V).map(([k,v])=>k+'='+v.IA.version).join(' '),'TZ',Intl.DateTimeFormat().resolvedOptions().timeZone,'clock local 21:16 on each today (Mon 2026-09-21 .. Sun 2026-09-27)');
const U=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10); const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const oracleTW=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=['sun','mon','tue','wed','thu','fri','sat']; const dowOf=iso=>DOW[new R(U(iso)).getUTCDay()]; const ORD=['mon','tue','wed','thu','fri','sat','sun'];
const offOf=iso=>(new R(U(iso)).getUTCDay()+6)%7;
const txt=h=>(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const RESTS={none:[],sun:['sun'],'sun,wed':['sun','wed'],'sat,sun':['sat','sun'],'fri,sat,sun':['fri','sat','sun'],'mon,wed,fri':['mon','wed','fri'],'thu..sun':['thu','fri','sat','sun']};
const GOALS={'1.5mi 12:00 mile 8:00':{id:'run_pace_goal',label:'x',targetDist:'1.5',paceUnit:'mi',mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'0',targetTime:'12:00'},
             '1mi 6:00 no mile':{id:'run_pace_goal',label:'x',targetDist:'1',paceUnit:'mi',targetMins:'6',targetSecs:'0',targetTime:'6:00'}};
function setWD(Vm,o){ Vm.IA.window.__O=o; Vm.IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:"18-35",eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:__O.start};`); Vm.els.clear(); }
function gen(Vm){ const IA=Vm.IA; IA.localStorage._map.clear(); IA.eval('activeProg=null'); try{IA.eval('doGenerate()');}catch(e){return {err:'threw '+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval('activeProg'); if(!p) return {err:'no program'}; return {p:JSON.parse(JSON.stringify(p)),tw:IA.eval('WD._testWeek')}; }
function copy(Vm){ const IA=Vm.IA; IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep();updateRaceDateFeedback()');
  const fb=txt((Vm.els.get('raceDateFeedback')||{innerHTML:''}).innerHTML);
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("name");renderWizardStep()'); const nb=Vm.els.get('wizardBody').innerHTML;
  const m=nb.match(/id="startResolve">([\s\S]*?)<\/div>/); return {fb, sr:txt(m?m[1]:'')}; }
const cards=(p,w,d)=>{const day=(p.weeks[w]||{})[d]; if(!day) return {rest:true,runs:[],sec:0}; const c=day.cardio; const runs=(Array.isArray(c)?c:(c?[c]:[])).filter(x=>x&&x.type==='run'); return {rest:!!day.rest,runs,sec:(day.sections||[]).length};};
const has=q=>!q.rest&&(q.runs.length||q.sec);
// ---------- part A: resolver-only sweep, every lattice point (cheap, pure), oracle vs both resolvers
const A={n:0,c:0,cSeg:{},resolverDiffIsC:0,resolverDiffNotC:0,cNotDiff:0,baseSnapNotC:0};
const CASES=[];
for(const [gl,run] of Object.entries(GOALS)) for(let wd=0;wd<7;wd++){ const today=addD('2026-09-21',wd); setToday(today);
  for(let eo=-7;eo<=27;eo++) for(const [rk,rest] of Object.entries(RESTS)) for(let du=0;du<=34;du++){
    const start=addD(today,eo), race=addD(today,du); A.n++;
    const off=offOf(start), sun=addD(start,6-off);
    const isC = off>0 && ORD.slice(off).every(d=>rest.includes(d)) && U(race)>=U(start) && U(race)<=U(sun);
    const cfgJ=JSON.stringify({cardioTypes:['run'],cardioGoals:{run},eventTargeted:true,raceDate:race});
    const rb=V.base.IA.eval(`resolveStartDate(${JSON.stringify(start)},${JSON.stringify(rest)})`);
    const rs=V.Sc2.IA.eval(`resolveStartDate(${JSON.stringify(start)},${JSON.stringify(rest)},_rsRace(${cfgJ}))`);
    const diff=rb.start!==rs.start;
    if(diff&&isC)A.resolverDiffIsC++; if(diff&&!isC)A.resolverDiffNotC++; if(isC&&!diff)A.cNotDiff++;
    if(isC){ A.c++; const rel=eo<0?'entered<today':eo===0?'entered==today':'entered>today'; bump(A.cSeg,rel);
      bump(A.cSeg,'  '+rel+' startDow='+dowOf(start)); bump(A.cSeg,'  rest='+rk);
      if(gl.startsWith('1.5')) CASES.push({today,start,race,rest,rk,eo,du}); }
  } }
console.log('\n=== A  resolver sweep: lattice points',A.n,'(2 goals x 7 todays x 35 entered x 7 rest x 35 test dates)');
console.log('   oracle (c)-cases',A.c,'| resolver start moved by Sc2 AND oracle (c):',A.resolverDiffIsC,'| moved but NOT (c):',A.resolverDiffNotC,'| (c) but not moved:',A.cNotDiff);
for(const [k,v] of Object.entries(A.cSeg).sort()) console.log('   ',k.padEnd(40),v);
// ---------- part B: build every (c)-case (goal 1.5mi; x3 experience) under base and Sc2, measure the claims
const B={}; const ex=[];
for(const c of CASES) for(const exp of ['intermediate','beginner','advanced']) {
  const rel=c.eo<0?'entered<today':c.eo===0?'entered==today':'entered>today'; const Z=B[rel]=B[rel]||{n:0,err:0,cnt:{},srSays:{},fbSays:{},baseStart:{},sc2StartDow:{},weeksAhead:{}};
  Z.n++; const o={exp,rest:c.rest,race:c.race,run:GOALS['1.5mi 12:00 mile 8:00'],start:c.start}; const row={};
  for(const vk of ['base','Sc2']){ setToday(c.today); setWD(V[vk],o); const cp=copy(V[vk]); setWD(V[vk],o); const b=gen(V[vk]); row[vk]={cp,b}; }
  if(row.base.b.err||row.Sc2.b.err){ Z.err++; continue; }
  const p=row.Sc2.b.p, pb=row.base.b.p;
  const rd=dowOf(c.race), todayMon=monU(U(c.today));
  bump(Z.baseStart,(pb.startDate===c.start?'=entered':(pb.startDate===addD(c.start,7-offOf(c.start))?'next Monday':'other'))+' tot'+pb.totalWeeks+' tw'+row.base.b.tw);
  bump(Z.sc2StartDow,(p.startDate===c.start?'=entered ':'!=entered ')+dowOf(p.startDate));
  bump(Z.weeksAhead,'start is +'+Math.round((monU(U(p.startDate))-todayMon)/864e5/7)+' calendar weeks from today');
  const k=(n,b)=>bump(Z.cnt,n,b?1:0);
  k('claim "starts today" TRUE (start==today)', p.startDate===c.today);
  k('claim "This week holds your test" TRUE (test in today\'s Mon..Sun)', monU(U(c.race))===todayMon);
  k('claim "Week 1 is the test week" TRUE (oracle tw==1)', oracleTW(p.startDate,c.race)===1);
  k('built tw==1 (WD._testWeek)', row.Sc2.b.tw===1);
  k('totalWeeks==1', p.totalWeeks===1);
  k('trial on test weekday (subtype TIME TRIAL)', cards(p,1,rd).runs.some(x=>/TIME TRIAL/.test(x.subtype||'')));
  const within=ORD.slice(offOf(p.startDate),ORD.indexOf(rd)).filter(d=>has(cards(p,1,d)));
  k('Q3 train days start..test-1 == 0', within.length===0);
  k('train days after test in W1 == 0 ("ends on the test")', ORD.slice(ORD.indexOf(rd)+1).filter(d=>has(cards(p,1,d))).length===0);
  const outside=Math.max(0,Math.round((U(p.startDate)-U(c.today))/864e5));
  k('days today..start-1 OUTSIDE program > 0', outside>0);
  k('rendered D21 sentence non-empty', !!row.Sc2.cp.sr);
  bump(Z.srSays,row.Sc2.cp.sr.replace(/\d+/g,'N').slice(0,120)); bump(Z.fbSays,row.Sc2.cp.fb.replace(/\d+/g,'N').slice(0,120));
  if(rel!=='entered==today' && ex.filter(x=>x.startsWith(rel)).length<3) ex.push(`${rel} today ${c.today}(${dowOf(c.today)}) entered ${c.start}(${dowOf(c.start)}) rest ${c.rk} test ${c.race}(${rd}) ${exp} | base start ${pb.startDate} tot ${pb.totalWeeks} tw ${row.base.b.tw} | Sc2 start ${p.startDate} tot ${p.totalWeeks} tw ${row.Sc2.b.tw} | base sr "${row.base.cp.sr.slice(0,90)}" | Sc2 sr "${row.Sc2.cp.sr}" | callout "${row.Sc2.cp.fb.slice(0,90)}"`);
}
console.log('\n=== B  (c)-case builds (goal 1.5mi 12:00, x3 experience) under Sc2, segmented by entered vs today');
for(const [rel,Z] of Object.entries(B)){ console.log(' ',rel,'n',Z.n,'err',Z.err);
  for(const [kk,v] of Object.entries(Z.cnt)) console.log('     ',String(v).padStart(4)+'/'+Z.n,kk);
  console.log('      base outcome',JSON.stringify(Z.baseStart)); console.log('      Sc2 start',JSON.stringify(Z.sc2StartDow)); console.log('      ',JSON.stringify(Z.weeksAhead));
  console.log('      Sc2 D21 sentence',JSON.stringify(Z.srSays)); console.log('      cardio_goal callout (rendered from WD.startDate at that step)',JSON.stringify(Z.fbSays)); }
ex.forEach(x=>console.log('   ex',x));
// ---------- part C: what base prints for the snap today (D21/D25 sentence), one sample per rest pattern with Sunday rest
console.log('\n=== C  base startResolveCopy on a snap (today Thu 2026-09-24, entered = today, rest thu..sun)');
setToday('2026-09-24'); console.log('   ',txt(V.base.IA.eval(`startResolveCopy(resolveStartDate("2026-09-24",["thu","fri","sat","sun"]))`)));
console.log('   setProgStart toast string (base, snap):',V.base.IA.eval(`(function(){const _r=resolveStartDate("2026-09-24",["thu","fri","sat","sun"]);return _r.snapped ? 'Nothing to train that week — starts '+_fmtStartDay(_r.start)+' ✓' : 'x';})()`));
console.log('\nDONE');
