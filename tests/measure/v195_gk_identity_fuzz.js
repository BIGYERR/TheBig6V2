
// GATEKEEPER identity fuzz, V194 -> V195. V195 claims DIGEST NEUTRAL (render/storage only).
// Baseline proven equal to itself first. Seeds pinned. Clock fields stripped by progDigest.
// Comparison KEYED on (week, day, label, movement, detail), never on position.
const {load,progDigest,weekGrid}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const crypto=require('crypto');
const fs=require('fs');
// ---- argv -----------------------------------------------------------------
// Positional: <candidate.html> [baseline.html]   (unchanged)
//   --shard i/N       walk only the configs whose GLOBAL index % N == i. N==1 is the
//                     original sequential behaviour, pre-blocks included.
//   --pre             run ONLY the two pre-blocks (self-identity, cfg purity) and stop.
//   --lattice small   deterministic prefix slice of every axis, 72 configs.
//   --out FILE        write every raw counter + the violations as JSON to FILE.
//   --merge DIR --shards N   sum DIR/pre.json + DIR/fuzz_<i>.json and print the summary.
//                     Never loads the HTML. Used by tests/fuzz.sh.
// The pre-blocks feed `pre`, so they must run EXACTLY ONCE per fuzz: the driver runs
// them itself (--pre) before any shard starts, which also keeps the standing invariant
// literal -- the baseline is proven self-stable BEFORE anything diffs.
var SHARD_I=0, SHARD_N=1, MODE='full', LATTICE='full', OUTFILE='', MERGEDIR='', MERGE_N=0;
const POS=[];
for(let i=2;i<process.argv.length;i++){
  const a=process.argv[i];
  if(a==='--shard'){
    const m=/^([0-9]+)\/([0-9]+)$/.exec(process.argv[++i]||'');
    if(!m){ console.log('FUZZ ABORT: --shard wants i/N'); process.exit(2); }
    SHARD_I=+m[1]; SHARD_N=+m[2];
    if(SHARD_N<1||SHARD_I>=SHARD_N){ console.log('FUZZ ABORT: --shard i/N needs N>=1 and 0<=i<N'); process.exit(2); }
  }
  else if(a==='--pre') MODE='pre';
  else if(a==='--merge'){ MODE='merge'; MERGEDIR=process.argv[++i]||''; }
  else if(a==='--shards') MERGE_N=+(process.argv[++i]||'0');
  else if(a==='--lattice') LATTICE=process.argv[++i]||'';
  else if(a==='--out') OUTFILE=process.argv[++i]||'';
  else POS.push(a);
}
const CAND=POS[0], BASE=POS[1];
if(LATTICE!=='full'&&LATTICE!=='small'){ console.log('FUZZ ABORT: --lattice wants full or small'); process.exit(2); }
const WORKER=(MODE==='full'&&SHARD_N>1);   // silent: JSON only, stdout belongs to the driver
if(WORKER&&!OUTFILE){ console.log('FUZZ ABORT: --shard i/N with N>1 requires --out FILE'); process.exit(2); }
if(MODE==='merge'&&(!MERGEDIR||!(MERGE_N>=1))){ console.log('FUZZ ABORT: --merge DIR needs --shards N'); process.exit(2); }
const RUNPRE=(MODE==='pre'||(MODE==='full'&&SHARD_N===1));
const RUNLOOP=(MODE==='full');
var A=null,B=null;
if(MODE!=='merge'){
  A=load(BASE); B=load(CAND);
  if(!WORKER) console.log('# baseline v'+A.version+'  candidate v'+B.version);
}
const SEP='|~|';
const EQUIP=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPER=['beginner','intermediate','advanced'];
const SEEDS=[1013,3039,76308];
const REST=[['sun'],['sun','wed'],['sat','sun'],['mon','thu'],['tue','fri','sun']];
const AGE=['18-35','36-45'];
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const GOALS=[
  {tag:'run_half',    cg:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}, types:['run'], evt:true, race:'2026-12-06'},
  {tag:'run_5k',      cg:{run:{id:'run_5k',label:'5K',mileBestMins:'8',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}}, types:['run'], evt:true, race:'2026-11-15'},
  {tag:'run_10k',     cg:{run:{id:'run_10k',label:'10K',mileBestMins:'8',mileBestSecs:'30',baselineDist:'4',baseline:'4mi'}}, types:['run'], evt:true, race:'2026-11-29'},
  {tag:'run_marathon',cg:{run:{id:'run_marathon',label:'Marathon',mileBestMins:'9',mileBestSecs:'00',baselineDist:'8',baseline:'8mi'}}, types:['run'], evt:true, race:'2027-02-28'},
  {tag:'run_pace',    cg:{run:{id:'run_pace_goal',label:'Pace',targetMins:'13',targetSecs:'0',mileBestMins:'10',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'}}, types:['run'], evt:false},
  {tag:'run_base',    cg:{run:{id:'run_base',label:'Base',mileBestMins:'11',mileBestSecs:'0',baselineDist:'2',baseline:'2mi'}}, types:['run'], evt:false},
  {tag:'bike_ftp',    cg:{bike:{id:'bike_ftp',label:'FTP',ftp:'200'}}, types:['bike'], evt:false},
  {tag:'swim_500',    cg:{swim:{id:'swim_500_time',label:'500',targetMins:'9',targetSecs:'0',swimUnit:'yd'}}, types:['swim'], evt:false},
  {tag:'run+bike',    cg:{run:{id:'run_base',label:'Base',mileBestMins:'11',mileBestSecs:'0',baselineDist:'2',baseline:'2mi'},bike:{id:'bike_base',label:'Base'}}, types:['run','bike'], evt:false},
];
// --lattice small: deterministic prefix slice of every axis.
// 3 goals x 2 equip x 3 focus x 1 exper x 1 seed x 2 rest x 2 age = 72 configs, so each
// of 8 shards gets exactly 9 and the partition is non-trivial. The shard arithmetic does
// not depend on lattice size; the full 34020-config lattice stays a gatekeeper step.
const SM=(LATTICE==='small');
const LGOALS=SM?GOALS.slice(0,3):GOALS, LEQUIP=SM?EQUIP.slice(0,2):EQUIP, LFOCUS=SM?FOCUS.slice(0,3):FOCUS;
const LEXPER=SM?EXPER.slice(0,1):EXPER, LSEEDS=SM?SEEDS.slice(0,1):SEEDS;
const LREST=SM?REST.slice(0,2):REST, LAGE=SM?AGE.slice(0,2):AGE;
function mkCfg(g,eq,fo,ex,se,rest,age){
  const c={name:'FUZZ',primaryPath:g.evt?'event':'fitness',cardioTypes:g.types.slice(),
    cardioGoals:JSON.parse(JSON.stringify(g.cg)),eventTargeted:g.evt,
    liftingFocus:fo,experience:ex,ageBracket:age,equipment:eq,unit:'lbs',
    restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:se};
  if(g.evt) c.raceDate=g.race;
  return c;
}
function keyDump(prog){
  const rows=[]; const weeks=prog.weeks||{};
  Object.keys(weeks).forEach(w=>{ Object.keys(weeks[w]).forEach(d=>{
    const day=weeks[w][d]; if(!day) return;
    rows.push(['DAY',w,d,day.title||'',day.rest?'REST':'',JSON.stringify(day.tags||[]),day.note||''].join(SEP));
    const c=day.cardio;
    if(c){ (Array.isArray(c)?c:[c]).forEach(x=>rows.push(['CARDIO',w,d,x.type||'',x.subtype||'',x.detail||'',x.label||''].join(SEP))); }
    (day.sections||[]).forEach(s=>{
      (s.items||[]).forEach(i=>rows.push(['ITEM',w,d,s.label||s.coreHeader||'',String(i.name),String(i.detail||''),String(i.note||''),String(i.rx||'')].join(SEP)));
      if(!(s.items||[]).length) rows.push(['EMPTYSEC',w,d,s.label||s.coreHeader||''].join(SEP));
    });
  }); });
  rows.sort(); return rows;
}
const dh=rows=>crypto.createHash('sha256').update(rows.join('\n')).digest('hex').slice(0,16);
let cells=0,sessions=0,keys=0,dDigest=0,dGrid=0,dKeys=0,dLen=0,build=0,pre=0;
const viol=[];    // pre-block violations, strings, always printed first
const lviol=[];   // config-loop violations: {i: GLOBAL config index, s: seq within config, m: message}
const IDX=[];     // the global index of every config THIS process actually walked
let cidx=-1, cseq=0;
const lv=m=>lviol.push({i:cidx,s:cseq++,m:m});
if(RUNPRE){
  let n=0,bad=0;
  LGOALS.forEach(g=>LEQUIP.forEach(eq=>{
    const cfg=mkCfg(g,eq,'support_prevention','intermediate',76308,['sun','wed'],'18-35');
    const p1=A.buildProgram(cfg), p2=A.buildProgram(cfg);
    n++; if(progDigest(p1)!==progDigest(p2)||dh(keyDump(p1))!==dh(keyDump(p2))){bad++;pre++;viol.push('SELF '+g.tag+' '+eq);}
  }));
  console.log('# baseline self-identity: '+(n-bad)+'/'+n+' cells reproduce themselves');
  if(bad){ console.log('FUZZ ABORT: baseline is not self-stable'); process.exit(2); }
}
if(RUNPRE){
  let bad=0,n=0;
  LGOALS.forEach(g=>{ const cfg=mkCfg(g,'commercial','hypertrophy','advanced',1013,['sun'],'18-35');
    const before=JSON.stringify(cfg); A.buildProgram(cfg); B.buildProgram(cfg); n++;
    if(JSON.stringify(cfg)!==before){bad++;pre++;viol.push('CFGMUT '+g.tag);} });
  console.log('# cfg purity: '+(n-bad)+'/'+n+' goal shapes leave cfg untouched on BOTH versions');
}
if(RUNLOOP)
for(const g of LGOALS) for(const eq of LEQUIP) for(const fo of LFOCUS) for(const ex of LEXPER)
for(const se of LSEEDS) for(const rest of LREST) for(const age of LAGE){
  cidx++;                                 // BEFORE the try/catch and before any continue, so
  if(cidx%SHARD_N!==SHARD_I) continue;    // membership is a pure function of loop position
  IDX.push(cidx); cseq=0;
  const cfg=mkCfg(g,eq,fo,ex,se,rest,age);
  let pa,pb;
  const tag=[g.tag,eq,fo,ex,se,rest.join('+'),age].join('/');
  try{ pa=A.buildProgram(cfg); }catch(e){ build++; lv('BASE THREW '+tag+': '+e.message); continue; }
  try{ pb=B.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ build++; lv('CAND THREW '+tag+': '+e.message); continue; }
  cells++;
  if(Object.keys(pa.weeks||{}).length!==Object.keys(pb.weeks||{}).length){dLen++;lv('WEEKS '+tag);}
  if(progDigest(pa)!==progDigest(pb)){dDigest++;lv('DIGEST '+tag+' '+progDigest(pa)+' -> '+progDigest(pb));}
  if(weekGrid(pa,{showRest:true})!==weekGrid(pb,{showRest:true})){dGrid++;lv('GRID '+tag);}
  const ka=keyDump(pa), kb=keyDump(pb);
  keys+=ka.length;
  sessions+=Object.values(pa.weeks||{}).reduce((n,w)=>n+Object.keys(w).length,0);
  if(dh(ka)!==dh(kb)){ dKeys++;
    const sa=new Set(ka), sb=new Set(kb);
    const only=[].concat(ka.filter(x=>!sb.has(x)).slice(0,2), kb.filter(x=>!sa.has(x)).slice(0,2));
    lv('KEYS '+tag+' :: '+only.join(' || '));
  }
}
// The summary is printed by whoever holds the WHOLE picture: the sequential run, or the
// merge pass over pre.json + the 8 shard files. Loop violations are re-sorted by
// (global index, within-config sequence), which is exactly sequential emission order.
function emitSummary(){
  console.log('# '+cells+' configs / '+sessions+' day-builds / '+keys+' prescription keys compared');
  console.log('# violations: digest='+dDigest+' grid='+dGrid+' keyed='+dKeys+' weeks='+dLen+' build-errors='+build+' pre='+pre);
  const all=viol.concat(lviol.slice().sort((a,b)=>(a.i-b.i)||(a.s-b.s)).map(v=>v.m));
  if(all.length){ console.log('--- first 25 violations ---'); all.slice(0,25).forEach(v=>console.log('  '+v)); }
  const total=dDigest+dGrid+dKeys+dLen+build+pre;
  console.log('FUZZTOTAL configs='+cells+' sessions='+sessions+' keys='+keys+' violations='+total);
  console.log('PASS '+(total?0:1)+' FAIL '+(total?1:0));
  return total?1:0;
}
function dump(){ return {cells:cells,sessions:sessions,keys:keys,dDigest:dDigest,dGrid:dGrid,
  dKeys:dKeys,dLen:dLen,build:build,pre:pre,viol:lviol,preViol:viol,idx:IDX,preRan:RUNPRE}; }
if(MODE==='merge'){
  const MIDX=[];                 // union of the shards' walked-index sets, pre excluded
  for(let i=-1;i<MERGE_N;i++){
    const f=MERGEDIR+'/'+(i<0?'pre.json':'fuzz_'+i+'.json');
    if(!fs.existsSync(f)||!fs.statSync(f).size){ console.log('FUZZ ABORT: missing or empty shard result '+f); process.exit(3); }
    let j; try{ j=JSON.parse(fs.readFileSync(f,'utf8')); }
    catch(e){ console.log('FUZZ ABORT: unreadable shard result '+f+': '+e.message); process.exit(3); }
    cells+=j.cells; sessions+=j.sessions; keys+=j.keys; dDigest+=j.dDigest; dGrid+=j.dGrid;
    dKeys+=j.dKeys; dLen+=j.dLen; build+=j.build; pre+=j.pre;
    (j.preViol||[]).forEach(v=>viol.push(v)); (j.viol||[]).forEach(v=>lviol.push(v));
    if(i>=0) (j.idx||[]).forEach(v=>MIDX.push(v));   // pre.json walks no configs by design
  }
  // Partition coverage. Summing counters cannot see a well-formed all-zero shard, and in
  // production there is no sequential reference to compare against. The expected size is
  // computed from the axis constants for the ACTIVE lattice, so the merge still needs no
  // reference run and still never loads the HTML.
  const MEXP=LGOALS.length*LEQUIP.length*LFOCUS.length*LEXPER.length*LSEEDS.length*LREST.length*LAGE.length;
  const mcount=new Map();
  MIDX.forEach(v=>mcount.set(v,(mcount.get(v)||0)+1));
  const mdup=[], moor=[];
  mcount.forEach((n,v)=>{ if(n>1) mdup.push(v); if(!(v>=0&&v<MEXP)) moor.push(v); });
  const mmiss=[]; for(let v=0;v<MEXP;v++) if(!mcount.has(v)) mmiss.push(v);
  if(mmiss.length||mdup.length||moor.length){
    const head=a=>a.slice().sort((x,y)=>x-y).slice(0,10).join(',')+(a.length>10?' ...':'');
    console.log('FUZZ ABORT: shard partition does not cover the lattice. --lattice '+LATTICE+
      ' has '+MEXP+' configs; the '+MERGE_N+' shards walked '+MIDX.length+'.');
    console.log('  missing '+mmiss.length+(mmiss.length?': '+head(mmiss):''));
    console.log('  duplicated '+mdup.length+(mdup.length?': '+head(mdup):''));
    console.log('  out of range '+moor.length+(moor.length?': '+head(moor):''));
    process.exit(3);
  }
  process.exit(emitSummary());
}
if(OUTFILE) fs.writeFileSync(OUTFILE,JSON.stringify(dump()));
if(MODE==='pre'||WORKER) process.exit(0);
process.exit(emitSummary());
