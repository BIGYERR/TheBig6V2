// v223 measure — build-3 re-baseline: every anchor the P-RACEDATE / P-SAFEPACE / P-TESTLEN rulings name,
// re-found by TEXT (never by the ruling's old line number) in an OLD and a NEW artifact, plus every reader of
// the values those anchors touch, plus the D163 x P-SAFEPACE line overlap.
// Usage: node tests/measure/v223_rebase_anchors.js <old.html> <new.html>
// Counts are raw-text counts (what an anchor-asserted edit sees) AND code-only counts (full-line // comments
// and /* */ blocks stripped), per standing rule "strip comments before any token scan".
const fs=require('fs'), path=require('path'), H=require(path.resolve(__dirname,'..','harness.js'));
const OLD=process.argv[2], NEW=process.argv[3];
const js=f=>H.extractInlineJS(fs.readFileSync(f,'utf8'));
const html=f=>fs.readFileSync(f,'utf8');
const lines=s=>s.split('\n');
const codeOnly=s=>s.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).split('\n').map(l=>/^\s*\/\//.test(l)?'':l).join('\n');
const ver=f=>(html(f).match(/name="ia-version" content="(\d+)"/)||[])[1];
const A={old:html(OLD),new:html(NEW)}, C={old:codeOnly(A.old),new:codeOnly(A.new)};
console.log('old',OLD,'ia-version',ver(OLD),'| new',NEW,'ia-version',ver(NEW));
const cnt=(s,a)=>typeof a==='string'?s.split(a).length-1:(s.match(new RegExp(a.source,'g'))||[]).length;
const where=(s,a)=>{const out=[];lines(s).forEach((l,i)=>{ if(typeof a==='string'?l.includes(a):a.test(l)) out.push(i+1);});return out;};
// [ruling, label, ruling's cited line, anchor text or regex]
const ANCH=[
 ['P-RACEDATE','raceAlignment weeksOut raw floor',':4202','const weeksOut = Math.floor((race - today)/86400000/7);'],
 ['P-RACEDATE','underFloor field',':4207','underFloor: weeksOut < floor'],
 ['P-RACEDATE','raceAlignment fn (helper sites beside it)',':4194','function raceAlignment(goalId, raceIso, eventOn, todayIso){'],
 ['P-RACEDATE','aligned-start sentence al.weeksOut',':1959',/al\.weeksOut/],
 ['P-RACEDATE','progSelData raceStr UTC parse (copy + card)',':14199/:14477',"raceStr=new Date(c.raceDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})"],
 ['P-RACEDATE','raceWeeks read (card Time out)',':14213',"raceWeeks:(c.raceDateWeeks||p.raceDateWeeks||null)"],
 ['P-RACEDATE','mile lock sheet UTC parse',':14398-14402','rd=new Date(c.raceDate)'],
 ['P-RACEDATE','mile sheet s.raceWeeks guard',':14398-14402',/s\.raceWeeks/],
 ['P-RACEDATE','wizard review UTC parse',':3022',"['Race date', new Date(WD.raceDate).toLocaleDateString"],
 ['P-RACEDATE','program literal raceDate/raceDateWeeks',':10510','raceDate:cfg.raceDate||null,raceDateWeeks:cfg.raceDateWeeks||null'],
 ['P-RACEDATE','WD.raceDateWeeks writer in updateRaceDateFeedback',':2284','WD.raceDateWeeks = weeksUntil;'],
 ['P-RACEDATE','header _fmtStartDay(<alignment>.raceIso, withYear)',':11508',/_fmtStartDay\([^)]*raceIso/],
 ['P-RACEDATE','any new Date(<x>.raceDate) UTC parse','-',/new Date\(\s*[\w.]*raceDate\s*\)/],
 ['P-RACEDATE','setProgRace toast dash',':setProgRace',"showToast('Race day '+_fmtStartDay(_al.raceIso)+' \\u2014 plan starts '"],
 ['P-SAFEPACE','function achievablePacePerMile',':2229','function achievablePacePerMile(weeksAvail, tDist, experience, ageBracket) {'],
 ['P-SAFEPACE','function applySuggestedPace',':2251','function applySuggestedPace(mins, secs) {'],
 ['P-SAFEPACE','function updateRaceDateFeedback',':2276','function updateRaceDateFeedback() {'],
 ['P-SAFEPACE','daysUntil raw day count',':2279',/const daysUntil\s*=/],
 ['P-SAFEPACE','weeksUntil raw floor',':2280',/const weeksUntil\s*=/],
 ['P-SAFEPACE','achievablePacePerMile(weeksUntil call',':2339',/achievablePacePerMile\(weeksUntil/],
 ['P-SAFEPACE','_twz/_tw in callout (testWeekIndex)',':2333',"testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[]).start, WD.raceDate)"],
 ['P-SAFEPACE','Use this pace instead button (any case)',':2356/:2470',/[Uu]se this pace instead/i],
 ['P-SAFEPACE','function assessRunPaceCeiling',':2427','function assessRunPaceCeiling() {'],
 ['P-SAFEPACE','function paceCeilingOfferHTML',':2470','function paceCeilingOfferHTML(f) {'],
 ['P-SAFEPACE','function updatePaceFeasibility',':2484','function updatePaceFeasibility() {'],
 ['P-SAFEPACE','function updatePaceDisplay',':2413','function updatePaceDisplay() {'],
 ['P-SAFEPACE','80 ms timer',':2672',/setTimeout\([^;]*updateRaceDateFeedback/],
 ['P-SAFEPACE','header "Program length:"',':2760/:2903','Program length: '],
 ['P-SAFEPACE','function paceGoalTarget',':3052','function paceGoalTarget(g) {'],
 ['P-SAFEPACE','function calcProgramLength',':3208','function calcProgramLength(cardioTypes, cardioGoals, liftingGoal) {'],
 ['P-SAFEPACE','function expCurrentPace / expCurrentPace reads',':2236',/expCurrentPace/],
 ['P-SAFEPACE','function wizardAlignment',':1949','function wizardAlignment(){'],
 ['P-SAFEPACE','function offerShorterPlan',':1984','function offerShorterPlan(goalId){'],
 ['P-SAFEPACE','function applySeedData',':2652','function applySeedData(){'],
 ['P-SAFEPACE','name step resolveStartDate (_sr)',':3017/:3034','const _sr = resolveStartDate(WD.startDate, WD.restDays||[]);'],
 ['P-SAFEPACE R5','run desc dash',':2753',"Outdoor or treadmill — pace, distance, race goals"],
 ['P-SAFEPACE R5','bike desc dash',':2754',"Spin bike or outdoor — intervals, FTP, distance"],
 ['P-SAFEPACE R5','swim desc dash',':2755',"Lap pool or open water — structured sets"],
 ['P-SAFEPACE R5','10K desc',':2043',"6.2 miles — solid aerobic base"],
 ['P-SAFEPACE R5','half desc',':2044',"13.1 miles — serious endurance"],
 ['P-SAFEPACE R5','full desc',':2045',"26.2 miles — the full distance"],
 ['P-SAFEPACE R5','pace desc',':2046',"Target distance + time — 1.5mi under 10 min, mile under 6, etc."],
 ['P-SAFEPACE R5','optional personalizes',':2861/:2882',"(optional — personalizes your training paces)"],
 ['P-SAFEPACE R5','based on your longest',':2903',"— based on your longest cardio goal and experience level."],
 ['P-SAFEPACE R5','sessions rotate',':2904',"Sessions rotate across training days — each sport gets dedicated days."],
 ['P-SAFEPACE R5','tap to open calendar',':2920',"Tap to open calendar — the final weeks taper so you arrive fresh."],
 ['P-SAFEPACE R5','paceDisplayLine dash + double unit',':2413',"' — ' + pace + ' per mile'"],
 ['P-TESTLEN','doGenerate D106a gate (M7/M8 ANC1)',':7283/:7310','if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;'],
 ['P-TESTLEN','doGenerate _testWeek derivation',':7308','? testWeekIndex(resolveStartDate(WD.startDate, WD.restDays || []).start, WD.raceDate) : null;'],
 ['P-TESTLEN','progTestPin predicate (ANC2)',':14266','return {tw: (tw >= 1 && tw <= len) ? tw : null, len};'],
 ['P-TESTLEN','function progTestPin',':14266','function progTestPin(cfg, startIso){'],
 ['P-TESTLEN','backfill guard (ANC3)',':15338','if(prog.cfg._testWeek === undefined){'],
 ['P-TESTLEN','backfill "ONE-TIME" comment',':15333','ONE-TIME BACKFILL'],
 ['P-TESTLEN','var NSW_TABLE6_INT',':3436','var NSW_TABLE6_INT = ['],
 ['P-TESTLEN','NSW_TABLE6_INT.length - 1 (must be 0 before build)','-','NSW_TABLE6_INT.length - 1'],
 ['P-TESTLEN','resolveStartDate D25 snap',':1910','if(partial && week1Train.length === 0){'],
 ['P-TESTLEN','function resolveStartDate','-','function resolveStartDate(dateStr, restDays){'],
 ['P-TESTLEN','calcCurrentWeek diff<0 -> 1',':11074','if(diff<0) return 1;'],
 ['P-TESTLEN','testWeekIndex rounds',':4234','const days = Math.round((getWeekMonday(_isoOf(t)) - getWeekMonday(_isoOf(s))) / 86400000);'],
 ['P-TESTLEN','setProgStart calls progTestPin','-','const _tp=progTestPin(activeProg.cfg,_r.start);'],
 ['P-TESTLEN','D106a writer _raceDateCappedWeeks','-','WD._raceDateCappedWeeks = _testWeek || totalWeeksPreview;'],
 ['P-TESTLEN','buildProgram test-date reader cfg._testWeek === totalWeeks','-','cfg._testWeek && cfg._testWeek === totalWeeks'],
 ['D163','minutes-box readers (targetMins|mileBestMins undefined test)','L2406,2429,2859,3075,3219,14579',/(targetMins|mileBestMins)\s*[!=]==\s*undefined/],
 ['D163','targetTime fallback','L3075',/targetTime/],
];
console.log('\n=== A. ANCHORS (raw count old/new | code-only count old/new | lines old -> new)');
for(const [r,l,cite,a] of ANCH){
  const ro=cnt(A.old,a), rn=cnt(A.new,a), co=cnt(C.old,a), cn=cnt(C.new,a);
  const lo=where(A.old,a), ln=where(A.new,a);
  const flag = rn===1?'COUNT1':(rn===0?'GONE':'MULTI');
  console.log(`${r.padEnd(13)} ${flag.padEnd(6)} raw ${ro}/${rn} code ${co}/${cn} | cited ${cite} | old ${lo.join(',')||'-'} -> new ${ln.join(',')||'-'} | ${l}`);
}
// function spans in NEW (brace depth from the declaration line; strings with braces are rare in these fns)
function span(src,name){ const L=lines(src); const i=L.findIndex(l=>new RegExp('^\\s*function '+name+'\\s*\\(').test(l)); if(i<0) return null;
  let d=0, started=false; for(let j=i;j<L.length;j++){ for(const ch of L[j]){ if(ch==='{'){d++;started=true;} else if(ch==='}') d--; } if(started&&d<=0) return [i+1,j+1]; } return [i+1,L.length]; }
const FNS=['achievablePacePerMile','applySuggestedPace','updateRaceDateFeedback','updatePaceTime','updatePaceDisplay','assessRunPaceCeiling','paceCeilingOfferHTML','updatePaceFeasibility','paceGoalTarget','calcProgramLength','raceAlignment','testWeekIndex','resolveStartDate','progTestPin','setProgStart','setProgRace','progSelData','refreshProgram','doGenerate','renderWizardStep','calcCurrentWeek','raceEveLiftPass','wizardAlignment','_applyWizardStart'];
const SP={}; for(const v of ['old','new']){ SP[v]={}; for(const f of FNS) SP[v][f]=span(A[v],f); }
console.log('\n=== B. FUNCTION SPANS old -> new');
for(const f of FNS) console.log('  ',f.padEnd(24),JSON.stringify(SP.old[f]),'->',JSON.stringify(SP.new[f]), SP.old[f]&&SP.new[f]?('len '+(SP.old[f][1]-SP.old[f][0])+' -> '+(SP.new[f][1]-SP.new[f][0])):'');
const inFn=(v,ln)=>FNS.filter(f=>SP[v][f]&&ln>=SP[v][f][0]&&ln<=SP[v][f][1]);
// bodies changed between old and new?
console.log('\n=== C. FUNCTION BODY IDENTITY old vs new (text of the span)');
for(const f of FNS){ const a=SP.old[f], b=SP.new[f]; if(!a||!b){console.log('  ',f,'missing');continue;}
  const ta=lines(A.old).slice(a[0]-1,a[1]).join('\n'), tb=lines(A.new).slice(b[0]-1,b[1]).join('\n'); console.log('  ',f.padEnd(24), ta===tb?'IDENTICAL':'CHANGED'); }
// readers
const TOK=['raceDate\\b','raceDateWeeks','raceStr','raceWeeks','weeksOut','underFloor','_testWeek','_raceDateCappedWeeks','progTestPin','testWeekIndex','resolveStartDate','achievablePacePerMile','applySuggestedPace','assessRunPaceCeiling','paceGoalTarget','updatePaceDisplay','updatePaceFeasibility','updateRaceDateFeedback','paceCeilingOfferHTML','expCurrentPace','targetTime','targetMins','mileBestMins','NSW_TABLE6_INT','calcCurrentWeek','_fmtStartDay','toLocaleDateString','futureWeeks','wizardAlignment','raceCountdown','wizardTestPin','paintRunGoalPanel'];
console.log('\n=== D. READERS: every line holding the token (raw / code-only) old -> new; full line list for NEW, code-only, each tagged with its enclosing ruled function');
for(const t of TOK){ const re=new RegExp(t); const lo=where(A.old,re), ln=where(A.new,re), co=where(C.old,re), cn=where(C.new,re);
  console.log(`-- ${t}: lines raw ${lo.length} -> ${ln.length} | code-only ${co.length} -> ${cn.length}`);
  for(const n of cn){ const L=lines(A.new)[n-1].trim(); console.log(`   ${n} [${inFn('new',n).join(',')||'-'}] ${L.length>170?L.slice(0,170)+'…':L}`); } }
// tests/ readers of ruled functions
console.log('\n=== E. tests/ files calling ruled functions (gates + harness; measure excluded)');
const TD=path.resolve(__dirname,'..'); const tf=[]; for(const d of ['gates','.']) for(const f of fs.readdirSync(path.join(TD,d))) if(/\.(js|py|sh)$/.test(f)) tf.push(path.join(TD,d,f));
for(const fn of ['achievablePacePerMile','applySuggestedPace','updatePaceFeasibility','updateRaceDateFeedback','assessRunPaceCeiling','paceCeilingOfferHTML','updatePaceDisplay','paceGoalTarget','progTestPin','resolveStartDate','testWeekIndex','raceAlignment','progSelData','calcCurrentWeek']){
  const hits=tf.map(f=>[path.relative(TD,f),(fs.readFileSync(f,'utf8').match(new RegExp('\\b'+fn+'\\b','g'))||[]).length]).filter(x=>x[1]);
  console.log('  ',fn.padEnd(24),hits.length?hits.map(x=>x[0]+':'+x[1]).join(' '):'0 files'); }
// D163 x P-SAFEPACE overlap
console.log('\n=== F. D163 minutes-box lines (NEW) vs P-SAFEPACE sites');
const SAFE=['achievablePacePerMile','applySuggestedPace','updateRaceDateFeedback','updatePaceDisplay','assessRunPaceCeiling','paceCeilingOfferHTML','updatePaceFeasibility','paceGoalTarget','calcProgramLength','renderWizardStep'];
const D163RE=/(targetMins|mileBestMins)\s*[!=]==\s*undefined/; const d163=where(A.new,D163RE);
const oldD=where(A.old,D163RE);
console.log('   D163 pattern old lines',oldD.join(','),'| new lines',d163.join(','));
for(const n of d163){ const fns=inFn('new',n); const L=lines(A.new)[n-1].trim(); console.log(`   ${n} in [${fns.join(',')||'-'}] P-SAFEPACE-owned fn: ${fns.some(f=>SAFE.includes(f))?'YES':'no'} | ${L.slice(0,200)}`);
  for(let k=n-4;k<=n+4;k++){ if(k===n) continue; const x=lines(A.new)[k-1]; if(/targetMins|targetSecs|targetTime|mileBest/.test(x)) console.log(`        ctx ${k}: ${x.trim().slice(0,170)}`);} }
console.log('   D163 cited L3219 (calcProgramLength body?) and L14579 (run_pace_goal): see lines above; handoff cites V217 line numbers.');
console.log('\nDONE');
