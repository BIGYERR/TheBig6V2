// v223 measure — which commit moved the doGenerate-path digest seen in v223_safepace_m M1 between V219 and V222?
// Usage: node tests/measure/v223_rebase_digest_probe.js <scratchdir> <commit>...   (TZ from env)
// Clock pinned 2026-09-22 21:16 local. Same WD on every artifact: 1.5 mi 12:00, mile 8:00, intermediate, test 2026-10-20.
// Oracle: the program object doGenerate leaves in activeProg vs buildProgram(cfg) called directly on the same artifact
// (the engine's own pure output), key by key; clock fields id/created stripped.
const path=require('path'), fs=require('fs'), cp=require('child_process');
const SCR=process.argv[2], COMMITS=process.argv.slice(3);
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const H=require(path.resolve(__dirname,'..','harness.js'));
const strip=o=>{const c=JSON.parse(JSON.stringify(o)); delete c.id; delete c.created; return c;};
const S=x=>String(JSON.stringify(x)).slice(0,120);
for(const c of COMMITS){
  const f=path.join(SCR,'probe_'+c+'.html'); try{fs.unlinkSync(f);}catch(e){}
  fs.writeFileSync(f,cp.execSync('git -C '+path.resolve(__dirname,'..','..')+' show '+c+':index.html',{maxBuffer:1<<28}));
  const IA=H.load(f); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); };
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:"intermediate",ageBracket:"18-35",eventTargeted:true,raceDate:"2026-10-20",
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:4242,name:"M",
    cardioGoals:{run:{id:"run_pace_goal",label:"x",targetDist:"1.5",paceUnit:"mi",targetMins:"12",targetSecs:"0",targetTime:"12:00",mileBestMins:"8",mileBestSecs:"00"}},startDate:undefined};`);
  IA.localStorage._map.clear(); IA.eval('activeProg=null'); IA.eval('doGenerate()'); IA.flushTimers(Infinity);
  const ap=strip(IA.eval('activeProg')); const stored=strip(JSON.parse(IA.localStorage._map.get('ia_programs'))[0]);
  const direct=strip(IA.buildProgram(JSON.parse(JSON.stringify(stored.cfg))));
  const keys=[...new Set([...Object.keys(ap),...Object.keys(direct),...Object.keys(stored)])].sort();
  const dk=keys.filter(k=>JSON.stringify(ap[k])!==JSON.stringify(direct[k]));
  const sk=keys.filter(k=>JSON.stringify(ap[k])!==JSON.stringify(stored[k]));
  console.log(c,'ia-version',IA.version,'| digest activeProg',H.progDigest(ap),'stored',H.progDigest(stored),'direct buildProgram',H.progDigest(direct),'| weeks activeProg==direct',JSON.stringify(ap.weeks)===JSON.stringify(direct.weeks));
  console.log('   activeProg vs direct: keys differing',JSON.stringify(dk),'| activeProg vs stored:',JSON.stringify(sk));
  for(const k of dk.slice(0,6)) console.log('     ',k,'activeProg=',S(ap[k]),'| direct=',S(direct[k]));
}
console.log('DONE');
