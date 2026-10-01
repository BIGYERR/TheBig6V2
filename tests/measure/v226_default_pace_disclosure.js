// v212 measure — default pace disclosure (Mode B, read-only).
// Q: when no mile is entered, what does the athlete SEE about the assumed anchor?
// Oracle: the expCurrentPace table as a literal hand table {690,570,450} (11:30/9:30/7:30) and
// PACE_CHART rows read by value, plus a text scan of every string on each run card for
// disclosure tokens. Never asks runAnchorInfo what the anchor "should" be.
// usage: node tests/measure/v226_default_pace_disclosure.js <artifact.html>
const path=require('path');
const {load}=require(path.join(__dirname,'..','harness.js'));
const IA=load(process.argv[2]||'index.html');
console.log('ia-version',IA.version);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const HAND={beginner:690,intermediate:570,advanced:450};
const clk=s=>Math.floor(Math.round(s)/60)+':'+String(Math.round(s)%60).padStart(2,'0');
const DISC=/(default|estimat|assum|guess|no mile|experience level|based on (a|an) \d|anchor|your mile|mile time)/i;
function cfgOf(goal,exp,seed,mile){
  const g={id:goal,label:goal,baselineDist:'',baseline:''};
  if(goal==='run_pace_goal'){g.targetDist='1.5';g.targetMins='12';g.targetSecs='0';}
  if(mile){g.mileBestMins=String(Math.floor(mile/60));g.mileBestSecs=String(mile%60);g.mileBestSrc={kind:'entered'};}
  const c={name:'M',primaryPath:goal==='run_5k'?'event':'hybrid',cardioTypes:['run'],cardioGoals:{run:g},
    liftingFocus:'balanced',experience:exp,ageBracket:'18-35',equipment:'crossfit',unit:'lbs',
    restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed};
  if(goal==='run_5k'){c.eventTargeted=true;c.raceDate='2026-12-06';}
  return c;
}
function runCards(prog){const out=[];Object.keys(prog.weeks||{}).sort((a,b)=>a-b).forEach(w=>DAYS.forEach(d=>{const day=prog.weeks[w][d];if(!day||!day.cardio)return;[].concat(day.cardio).forEach(c=>{if(c&&(c.type==='run'||/run|tempo|int|long|recov|easy|steady|speed/i.test(c.subtype||'')))out.push({w:+w,d,c});});}));return out;}
function strs(o,acc=[]){if(o==null)return acc;if(typeof o==='string')acc.push(o);else if(Array.isArray(o))o.forEach(x=>strs(x,acc));else if(typeof o==='object')Object.values(o).forEach(x=>strs(x,acc));return acc;}
const strip=s=>s.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,'');
// 1. anchor sentence, program card, per config (runAnchorInfo is a DISPLAY reader; its anchor is checked against the hand table)
console.log('\n== 1. program-card sentence, no mile ==');
for(const goal of ['run_pace_goal','run_5k','run_base','run_half'])for(const exp of ['beginner','intermediate','advanced']){
  const a=IA.eval('runAnchorInfo')(cfgOf(goal,exp,11,0));
  if(!a){console.log(goal,exp,'runAnchorInfo=null -> no Run paces block');continue;}
  const row=IA.PACE_CHART&&null;
  console.log(goal,exp,'kind='+a.kind,'anchor='+clk(a.anchorSec),'hand='+clk(HAND[exp]),'|',strip(IA.eval('runAnchorSentence')(a)));
}
// 2. session cards: sweep, disclosure-token scan
console.log('\n== 2. run-card disclosure scan, no mile, seeds 1..20 ==');
const SEEDS=Array.from({length:20},(_,i)=>1000+i*37);
for(const goal of ['run_pace_goal','run_5k','run_base'])for(const exp of ['beginner','intermediate','advanced']){
  let n=0,hit=0,handHit=0,builds=0,crash=0;const hitEx=new Set();
  for(const s of SEEDS){let p;try{p=IA.buildProgram(cfgOf(goal,exp,s,0));}catch(e){crash++;continue;}builds++;
    for(const r of runCards(p)){n++;const t=strs(r.c).map(strip).join(' | ');const m=t.match(DISC);if(m){hit++;hitEx.add(m[0].toLowerCase());}
      if(t.includes(clk(HAND[exp])))handHit++;}}
  console.log(goal.padEnd(14),exp.padEnd(12),'builds',builds,'crash',crash,'runCards',n,'disclosureTokenCards',hit,[...hitEx].join(','),'cardsPrintingAnchorClock('+clk(HAND[exp])+')',handHit);
}
// 3. representative beginner cards, week 1 and last
console.log('\n== 3. beginner no-mile, seed 1000, W1 and last week run cards ==');
for(const goal of ['run_pace_goal','run_5k','run_base']){
  const p=IA.buildProgram(cfgOf(goal,'beginner',1000,0));const cards=runCards(p);const last=Math.max(...cards.map(c=>c.w));
  console.log('--',goal,'weeks',Object.keys(p.weeks).length);
  for(const r of cards.filter(c=>c.w===1||c.w===last)){
    const c=r.c;const txt=strs(c).map(strip).filter(x=>/\d:\d\d|pace|mile|\/mi/i.test(x)).join(' || ');
    console.log(' W'+r.w,r.d,(c.subtype||c.type),'::',txt.slice(0,420));
  }
}
// 4. re-anchor: does an entered mile move the cards? (intermediate; and beginner ignores)
console.log('\n== 4. entered mile vs none, seed 1000, run-card text differs? ==');
for(const goal of ['run_pace_goal','run_5k','run_base'])for(const exp of ['beginner','intermediate']){
  const a=JSON.stringify(runCards(IA.buildProgram(cfgOf(goal,exp,1000,0))).map(r=>r.c));
  const b=JSON.stringify(runCards(IA.buildProgram(cfgOf(goal,exp,1000,480))).map(r=>r.c));
  const a2=JSON.stringify(runCards(IA.buildProgram(cfgOf(goal,exp,1000,0))).map(r=>r.c));
  console.log(goal,exp,'self-stable',a===a2,'mile 8:00 changes run cards',a!==b);
}
// 5. week-view / Progress / swap surfaces: static scan of source for disclosure strings near render fns
console.log('\n== 5. source scan: strings mentioning default/estimated mile, comments stripped ==');
const src=IA.js.replace(/\/\*[\s\S]*?\*\//g,'').split('\n');
src.forEach((l,i)=>{const code=l.replace(/(^|[^:'"`\\])\/\/.*$/,'$1');if(/(estimated from experience|beginner default|no mile time|est\. from experience|anchors on your experience)/i.test(code))console.log('js+'+(i+1),code.trim().slice(0,200));});
console.log('\nDONE');
