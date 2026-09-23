// V207 measure (before-picture for D106) on the V205 artifact. READ-ONLY.
// Q: on the NSW test-goal path (run_pace_goal at 1 / 1.5 / 3 mi, run_base), with a
//    cfg.raceDate (the test date) inside the program: what is scheduled on and after the
//    test date, is there a taper in front of it, and what would D106 (tw = min(goalLen,
//    testWeek)) move?
// ORACLE: hand date arithmetic only. Week N of a program covers startMon + 7(N-1) .. +6,
//    startMon = Monday of the resolved start (index.html _progDayDate contract; recomputed
//    here, not called). Test week = floor((testMon - startMon)/7d) + 1. "Taper" = the
//    engine's own printed subtype text containing "Taper" (what the athlete reads).
//    Hard session = subtype contains INT / CHI / Interval / Continuous High Intensity.
// COUNTERFACTUAL (Q5): D106's arithmetic is expressed through the cfg field the engine
//    already reads, cfg._raceDateCappedWeeks (index.html:7298), same trick as
//    v202_persistence_D. No source surgery.
const path = require('path');
const fs = require('fs');
const H = require(path.join(__dirname,'..','harness.js'));
const HTML = process.argv[2] || path.join(__dirname,'..','..','index.html');
const IA = H.load(HTML);
const SRC = fs.readFileSync(HTML,'utf8');
const ver = (SRC.match(/name="ia-version" content="(\d+)"/)||[])[1];
console.log('ia-version', ver, '| HTML', HTML);
const ISO = ['mon','tue','wed','thu','fri','sat','sun'];
const D = 86400000;
const parse = s => { const p=s.split('-').map(Number); const d=new Date(p[0],p[1]-1,p[2]); d.setHours(0,0,0,0); return d; };
const isoOf = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const monOf = d => { const m=new Date(d); m.setDate(d.getDate()-((d.getDay()+6)%7)); m.setHours(0,0,0,0); return m; };
const addDays = (d,n) => { const x=new Date(d); x.setDate(d.getDate()+n); x.setHours(0,0,0,0); return x; };

// ── 0. STATIC: every site that reads/writes the values D106 touches (comments stripped) ──
const lines = SRC.split('\n');
const strip = l => l.replace(/\/\/.*$/,'');
const TOK = ['_raceDateCappedWeeks','calcProgramLength(','raceAlignment(','raceWeekPin(','_racePin',
  'taperWeeksFor(','programTaperWindow(','taperEventOn(','_taperFor(','raceDateWeeks','cfg.raceDate','.raceDate',
  '_applyWizardStart(','resolveStartDate('];
console.log('\n== 0. SITES (code only, comments stripped; line:text) ==');
TOK.forEach(t=>{ const hits=[]; lines.forEach((l,i)=>{ if(strip(l).includes(t)) hits.push(i+1); });
  console.log(`  ${t.padEnd(22)} n=${hits.length}  lines ${hits.join(',')}`); });

// ── fixtures ──
const PACE = (dist, mm, ss) => ({id:'run_pace_goal', label:'Hit a Pace / Time Goal', targetDist:String(dist), paceUnit:'mi',
  targetMins:String(mm), targetSecs:String(ss), mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}});
const GOALS = {
  mile:   PACE(1, 7, 0),
  'mi1.5':PACE(1.5, 11, 0),
  pace3:  PACE(3, 24, 0),
  base:   {id:'run_base', mileBestMins:'8', mileBestSecs:'15', baseline:'2.5 miles', baselineDist:'2.5'},
};
function mkCfg(over){ return Object.assign({ name:'M', primaryPath:'event', eventTargeted:true, cardioTypes:['run'],
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35', equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:245, deadlift:315, seed:24865 }, over||{}); }

function cells(prog, startIso){
  const sMon = monOf(parse(startIso)); const out=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{ ISO.forEach((d,off)=>{
    const day=prog.weeks[w][d]; if(!day) return;
    let cs=day.cardio; cs = cs ? (Array.isArray(cs)?cs:[cs]) : [];
    const runs=cs.filter(c=>c&&c.type==='run');
    const lifts=(day.sections||[]).reduce((a,s)=>a+((s.items||[]).length),0);
    out.push({w:+w,d,date:addDays(sMon,(+w-1)*7+off),runs,subs:runs.map(r=>r.subtype||''),lifts,rest:!!day.rest});
  });});
  return out;
}
const hard = s => /\(INT\)|\(CHI\)|Interval|Continuous High Intensity/.test(s);

function analyse(prog, cfg, startIso){
  const tw = prog.totalWeeks; const sMon = monOf(parse(startIso)); const test = parse(cfg.raceDate);
  const tWeek = Math.floor((monOf(test)-sMon)/D/7)+1;
  const cs = cells(prog, startIso);
  const runCells = cs.filter(c=>c.runs.length);
  const after = runCells.filter(c=>c.date>test);
  const onDay = cs.find(c=>c.date.getTime()===test.getTime());
  const taperWks = [...new Set(runCells.filter(c=>c.subs.some(s=>/Taper/.test(s))).map(c=>c.w))].sort((a,b)=>a-b);
  const pre2 = runCells.filter(c=>c.date<test && (test-c.date)/D<=2 && c.subs.some(hard));
  const anyTest = runCells.filter(c=>c.subs.some(s=>/Test|Trial|Benchmark|RACE/i.test(s)));
  const lastRunDate = runCells.length ? runCells[runCells.length-1].date : null;
  return {tw,tWeek,runN:runCells.length,afterN:after.length,afterWeeks:after.length?Math.max(...after.map(c=>c.w))-tWeek:0,
    daysPast:lastRunDate?Math.round((lastRunDate-test)/D):null,
    onDay: onDay ? (onDay.runs.length ? 'RUN:'+onDay.subs.join('+') : (onDay.lifts? 'LIFT-ONLY':'REST')) : 'NO-CELL',
    onDayLift: onDay ? onDay.lifts : null,
    taperWks, taperOnTestWeek: taperWks.includes(tWeek), taperBeforeTest: taperWks.some(w=>w<=tWeek),
    pre2hard: pre2.length, testSubs: anyTest.map(c=>'W'+c.w+c.d+':'+c.subs.join('+'))};
}

// ── 1. MARIO ──
console.log('\n== 1. MARIO ==');
const HM = H.fixtures ? IA.fixtures.HALF_MANNY : null;
{ const p=IA.buildProgram(JSON.parse(JSON.stringify(HM))); const al=IA.raceAlignment(HM.cardioGoals.run.id, HM.raceDate, true, '2026-09-22');
  console.log('  HALF_MANNY (harness fixture): goal', HM.cardioGoals.run.id, '| raceDate', HM.raceDate, '| NRC?', IA.NRC_GOALS.has(HM.cardioGoals.run.id), '| tw', p.totalWeeks);
  console.log('   raceAlignment start', al && al.start, 'tw', al && al.tw);
  const a=analyse(p, HM, al.start);
  console.log('   test week (date arith)', a.tWeek, '| on race day:', a.onDay, '| runs after race:', a.afterN, '| taper weeks', JSON.stringify(a.taperWks)); }
const PRT = over => mkCfg(Object.assign({ name:'PRT TING', raceDate:'2026-10-19', equipment:'home_full', squat:255, cardioGoals:{run:PACE(1.5,11,0)} }, over||{}));
[['PRT TING (v202_run_path_B pinned: 1.5mi in 11:00, 8:15 mile, seed 24865, start Mon 2026-09-21)', PRT(), '2026-09-21'],
 ['PRT TING variant (v202_persistence_D: 1.5mi in 10:30)', PRT({cardioGoals:{run:Object.assign(PACE(1.5,10,30),{baselineDist:'3',baseline:'3mi'})}, equipment:'full_gym', squat:245}), '2026-09-21'],
].forEach(([lab,cfg,st])=>{
  const p=IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const r=IA._applyWizardStart ? IA._applyWizardStart({cfg:{}}, Object.assign({},cfg,{startDate:st})) : null;
  const a=analyse(p,cfg,st);
  console.log('  '+lab);
  console.log(`   engine start via _applyWizardStart: ${r&&r.start} (aligned=${!!(r&&r.aligned)}) | tw ${a.tw} | test week ${a.tWeek} | weeks after test week ${a.tw-a.tWeek}`);
  console.log(`   on test day (${cfg.raceDate}): ${a.onDay} lifts=${a.onDayLift} | runs after test: ${a.afterN}/${a.runN} | last run ${a.daysPast} days after test`);
  console.log(`   taper weeks ${JSON.stringify(a.taperWks)} | taper on test week ${a.taperOnTestWeek} | hard runs in the 2 days before test ${a.pre2hard}`);
  console.log(`   test/trial/benchmark subtypes anywhere: ${a.testSubs.length?a.testSubs.join(' '):'NONE'}`);
  const cs=cells(p,st); cs.filter(c=>c.w>=a.tWeek-1&&c.w<=a.tWeek+1).forEach(c=>console.log(`     W${c.w} ${c.d} ${isoOf(c.date)}${isoOf(c.date)===cfg.raceDate?' <== TEST':''} ${c.runs.length?c.subs.join('+'):(c.lifts?'lift only':'rest')} lifts=${c.lifts}`));
  // counterfactual
  const cf=Object.assign(JSON.parse(JSON.stringify(cfg)),{_raceDateCappedWeeks:Math.min(a.tw,a.tWeek)});
  let pc; try{ pc=IA.buildProgram(cf);}catch(e){ console.log('   D106-CF CRASH', e.message); return; }
  const b=analyse(pc,cfg,st);
  console.log(`   D106-CF (cap=${cf._raceDateCappedWeeks}): tw ${b.tw} | on test day ${b.onDay} | runs after test ${b.afterN} | taper weeks ${JSON.stringify(b.taperWks)} | taper on test week ${b.taperOnTestWeek} | hard in 2d before ${b.pre2hard}`);
  pc && cells(pc,st).filter(c=>c.w===b.tWeek).forEach(c=>console.log(`     CF W${c.w} ${c.d} ${isoOf(c.date)}${isoOf(c.date)===cfg.raceDate?' <== TEST':''} ${c.runs.length?c.subs.join('+'):(c.lifts?'lift only':'rest')}`));
});

// ── 2. LATTICE ──
const EXP=['beginner','intermediate','advanced'];
const REST=[['sun','wed','sat','thu'],['sun','wed','sat'],['sun','wed'],['sun'],[]];
const WO=[0,1,2,3,4,5,6,8,10,12,16,20,26];
const DOW=[0,3,5];                       // test on Mon / Thu / Sat
const SEEDS=[24865,76308];
const START='2026-09-21';                // Monday; all dates relative to it
let N=0, crash=0, inside=0, onLast=0, after_=0, grow=0, before=0;
const A={afterRuns:0, runs:0, wksPast:[], daysPast:[], taperNone:0, taperOnTW:0, taperBeforeTW:0, pre2:0, onDay:{}, testSubsAny:0};
const CF={n:0,crash:0,afterRuns:0,taperOnTW:0,noTaper:0,pre2:0,onDay:{},below6:0,twHist:{}};
const seg={goal:{},exp:{},days:{},wo:{},dow:{}}; const sb=(o,k,h)=>{o[k]=o[k]||[0,0];o[k][0]+=h;o[k][1]++;};
const shrinkBy={};
const t0=Date.now();
Object.keys(GOALS).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>WO.forEach(wo=>DOW.forEach(dow=>SEEDS.forEach(seed=>{
  const test=addDays(parse(START), wo*7+dow);
  const cfg=mkCfg({seed,experience:exp,restDays:rest,raceDate:isoOf(test),cardioGoals:{run:JSON.parse(JSON.stringify(GOALS[gk]))}});
  let p; try{ p=IA.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ crash++; if(crash<4) console.log('CRASH',gk,exp,wo,e.message); return; }
  N++; const a=analyse(p,cfg,START);
  if(a.tWeek>a.tw){ grow++; return; }
  if(a.tWeek<1){ before++; return; }
  if(a.tWeek===a.tw) onLast++;
  inside++;
  const hasAfter = a.afterN>0; if(hasAfter) after_++;
  A.afterRuns+=a.afterN; A.runs+=a.runN;
  if(a.tWeek<a.tw){ A.wksPast.push(a.tw-a.tWeek); shrinkBy[a.tw-a.tWeek]=(shrinkBy[a.tw-a.tWeek]||0)+1; }
  if(hasAfter) A.daysPast.push(a.daysPast);
  if(!a.taperWks.length) A.taperNone++; if(a.taperOnTestWeek) A.taperOnTW++; if(a.taperBeforeTest) A.taperBeforeTW++;
  if(a.pre2hard) A.pre2++;
  const od=a.onDay.replace(/ \(LSD\)| — .*$/g,'').slice(0,40); A.onDay[od]=(A.onDay[od]||0)+1;
  if(a.testSubs.length) A.testSubsAny++;
  sb(seg.goal,gk,hasAfter?1:0); sb(seg.exp,exp,hasAfter?1:0); sb(seg.days,7-rest.length,hasAfter?1:0); sb(seg.wo,wo,hasAfter?1:0); sb(seg.dow,['Mon','','','Thu','','Sat'][dow],hasAfter?1:0);
  // counterfactual D106
  const cap=Math.min(a.tw,a.tWeek);
  const cf=Object.assign(JSON.parse(JSON.stringify(cfg)),{_raceDateCappedWeeks:cap});
  let pc; try{ pc=IA.buildProgram(cf);}catch(e){ CF.crash++; return; }
  const b=analyse(pc,cfg,START); CF.n++;
  CF.twHist[b.tw]=(CF.twHist[b.tw]||0)+1; if(b.tw<6) CF.below6++;
  CF.afterRuns+=b.afterN; if(b.taperOnTestWeek) CF.taperOnTW++; if(!b.taperWks.length) CF.noTaper++; if(b.pre2hard) CF.pre2++;
  const od2=b.onDay.replace(/ \(LSD\)| — .*$/g,'').slice(0,40); CF.onDay[od2]=(CF.onDay[od2]||0)+1;
}))))));
const mean=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'-';
console.log('\n== 2. LATTICE (4 goals x 3 exp x 5 day-patterns x 13 weeks-out x 3 test weekdays x 2 seeds; start Mon '+START+') ==');
console.log(`  builds ${N}  crashes ${crash}  elapsed ${((Date.now()-t0)/1000).toFixed(0)}s`);
console.log(`  test date INSIDE program: ${inside}/${N}  (of which in the FINAL week: ${onLast})`);
console.log(`  test date AFTER program end (would need GROW): ${grow}/${N}   before start: ${before}/${N}`);
console.log(`  programs scheduling >=1 run AFTER the test date: ${after_}/${inside}`);
console.log(`  run sessions after the test date: ${A.afterRuns}/${A.runs} run sessions in the inside population`);
console.log(`  whole weeks past the test week (inside, testWeek<tw, n=${A.wksPast.length}): mean ${mean(A.wksPast)} max ${Math.max(...A.wksPast)} min ${Math.min(...A.wksPast)}`);
console.log(`  hist weeks-past: ${JSON.stringify(shrinkBy)}`);
console.log(`  days from test date to last scheduled run (programs with runs after): mean ${mean(A.daysPast)} max ${Math.max(...A.daysPast)}`);
console.log(`  taper: none printed at all ${A.taperNone}/${inside} | taper covers test week ${A.taperOnTW}/${inside} | any taper week <= test week ${A.taperBeforeTW}/${inside}`);
console.log(`  a hard run (INT/CHI) in the 2 days before the test: ${A.pre2}/${inside}`);
console.log(`  programs with any Test/Trial/Benchmark/RACE subtype: ${A.testSubsAny}/${inside}`);
console.log(`  what sits ON the test date: ${JSON.stringify(A.onDay)}`);
Object.keys(seg).forEach(k=>console.log(`  after-test by ${k}: ${JSON.stringify(seg[k])}`));
console.log('\n== 3. D106 COUNTERFACTUAL (cap = min(goalLen, testWeek) via cfg._raceDateCappedWeeks) ==');
console.log(`  builds ${CF.n}/${inside} crashes ${CF.crash}`);
console.log(`  shrank: ${A.wksPast.length}/${inside}  unchanged: ${inside-A.wksPast.length}/${inside}  GROW: 0 by construction, ${grow} test dates lie beyond the program`);
console.log(`  tw histogram after cap: ${JSON.stringify(CF.twHist)}   tw < 6 (below calcProgramLength floor Math.max(6,..)): ${CF.below6}/${CF.n}`);
console.log(`  runs after test date: ${CF.afterRuns}   taper covers test week ${CF.taperOnTW}/${CF.n}   no taper ${CF.noTaper}/${CF.n}   hard run in 2 days before ${CF.pre2}/${CF.n}`);
console.log(`  ON the test date: ${JSON.stringify(CF.onDay)}`);
console.log('\nDONE');
