
// GATEKEEPER identity fuzz, V194 -> V195. V195 claims DIGEST NEUTRAL (render/storage only).
// Baseline proven equal to itself first. Seeds pinned. Clock fields stripped by progDigest.
// Comparison KEYED on (week, day, label, movement, detail), never on position.
const {load,progDigest,weekGrid}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const crypto=require('crypto');
const CAND=process.argv[2], BASE=process.argv[3];
const A=load(BASE), B=load(CAND);
console.log('# baseline v'+A.version+'  candidate v'+B.version);
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
const viol=[];
{
  let n=0,bad=0;
  GOALS.forEach(g=>EQUIP.forEach(eq=>{
    const cfg=mkCfg(g,eq,'support_prevention','intermediate',76308,['sun','wed'],'18-35');
    const p1=A.buildProgram(cfg), p2=A.buildProgram(cfg);
    n++; if(progDigest(p1)!==progDigest(p2)||dh(keyDump(p1))!==dh(keyDump(p2))){bad++;pre++;viol.push('SELF '+g.tag+' '+eq);}
  }));
  console.log('# baseline self-identity: '+(n-bad)+'/'+n+' cells reproduce themselves');
  if(bad){ console.log('FUZZ ABORT: baseline is not self-stable'); process.exit(2); }
}
{
  let bad=0,n=0;
  GOALS.forEach(g=>{ const cfg=mkCfg(g,'commercial','hypertrophy','advanced',1013,['sun'],'18-35');
    const before=JSON.stringify(cfg); A.buildProgram(cfg); B.buildProgram(cfg); n++;
    if(JSON.stringify(cfg)!==before){bad++;pre++;viol.push('CFGMUT '+g.tag);} });
  console.log('# cfg purity: '+(n-bad)+'/'+n+' goal shapes leave cfg untouched on BOTH versions');
}
for(const g of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of EXPER)
for(const se of SEEDS) for(const rest of REST) for(const age of AGE){
  const cfg=mkCfg(g,eq,fo,ex,se,rest,age);
  let pa,pb;
  const tag=[g.tag,eq,fo,ex,se,rest.join('+'),age].join('/');
  try{ pa=A.buildProgram(cfg); }catch(e){ build++; viol.push('BASE THREW '+tag+': '+e.message); continue; }
  try{ pb=B.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ build++; viol.push('CAND THREW '+tag+': '+e.message); continue; }
  cells++;
  if(Object.keys(pa.weeks||{}).length!==Object.keys(pb.weeks||{}).length){dLen++;viol.push('WEEKS '+tag);}
  if(progDigest(pa)!==progDigest(pb)){dDigest++;viol.push('DIGEST '+tag+' '+progDigest(pa)+' -> '+progDigest(pb));}
  if(weekGrid(pa,{showRest:true})!==weekGrid(pb,{showRest:true})){dGrid++;viol.push('GRID '+tag);}
  const ka=keyDump(pa), kb=keyDump(pb);
  keys+=ka.length;
  sessions+=Object.values(pa.weeks||{}).reduce((n,w)=>n+Object.keys(w).length,0);
  if(dh(ka)!==dh(kb)){ dKeys++;
    const sa=new Set(ka), sb=new Set(kb);
    const only=[].concat(ka.filter(x=>!sb.has(x)).slice(0,2), kb.filter(x=>!sa.has(x)).slice(0,2));
    viol.push('KEYS '+tag+' :: '+only.join(' || '));
  }
}
console.log('# '+cells+' configs / '+sessions+' day-builds / '+keys+' prescription keys compared');
console.log('# violations: digest='+dDigest+' grid='+dGrid+' keyed='+dKeys+' weeks='+dLen+' build-errors='+build+' pre='+pre);
if(viol.length){ console.log('--- first 25 violations ---'); viol.slice(0,25).forEach(v=>console.log('  '+v)); }
const total=dDigest+dGrid+dKeys+dLen+build+pre;
console.log('FUZZTOTAL configs='+cells+' sessions='+sessions+' keys='+keys+' violations='+total);
console.log('PASS '+(total?0:1)+' FAIL '+(total?1:0));
process.exit(total?1:0);
