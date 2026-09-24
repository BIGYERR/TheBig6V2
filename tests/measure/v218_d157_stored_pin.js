// v218 measure — D157 precondition: does a STORED seconds-only swim program keep its length and grid
// when booted on the D157 surgery copy? Premise under test (coach, unrun): doGenerate writes
// cfg._raceDateCappedWeeks (L7531), buildProgram copies cfg into prog.cfg (L10896), nothing deletes it,
// engineA reads it before the sizer (L7623) -> stored programs keep length; D157 reaches new builds only.
// Usage: node tests/measure/v218_d157_stored_pin.js <base.html V216> <surgery.html from v218_d157_swim_sizer.js>
// ORACLES: the stored record itself (ia_programs totalWeeks + grid as written by BASE doGenerate, and the
//   ia_hist_ snapshots written here from the stored grid) and the BASE boot of the same storage. Surgery
//   boot is compared against those, never against itself. Clock pinned; seed pinned; base boot proven
//   equal to itself before any base/surgery comparison.
const path=require('path'), fs=require('fs'), crypto=require('crypto');
const BASE=path.resolve(process.argv[2]), SURG=path.resolve(process.argv[3]);
const R=Date; let NOW=new R(2026,8,7,9,0,0).getTime();   // generate on Mon 7 Sep 2026
class FD extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=FD;
const H=require(path.resolve(__dirname,'..','harness.js'));
const P=(...a)=>console.log(...a);
const clone=o=>JSON.parse(JSON.stringify(o));
const h16=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
for(const f of [BASE,SURG]){ const s=fs.readFileSync(f,'utf8'); P('artifact '+path.basename(f)+' ia-version '+(s.match(/ia-version" content="(\d+)"/)||[])[1]+
  ' sizer-goal-reader(engine parse) '+(s.includes("var swimTimeEntered = isSwimTimeGoal && ((+goal.targetMins||0)*60 + (+goal.targetSecs||0)) > 0;")?1:0)); }
function vm(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); };
  IA.els=els; return IA; }
const S100=(o)=>Object.assign({id:'swim_100_time',label:'Improve 100 Time',swimUnit:'yd'},o);
const S500=(o)=>Object.assign({id:'swim_500_time',label:'Improve 500 Time',swimUnit:'yd'},o);
const CFGS=[
  {nm:'R  repro 100 both sec-only adv',        exp:'advanced',    age:'18-35', mix:['swim'], g:S100({targetSecs:'55',baseSecs:'59',base500Mins:'5',base500Secs:'30'})},
  {nm:'C1 100 current-only sec int',            exp:'intermediate',age:'18-35', mix:['swim'], g:S100({targetMins:'0',targetSecs:'55',baseSecs:'58',base500Mins:'5',base500Secs:'20'})},
  {nm:'C2 100 current-only sec beg',            exp:'beginner',    age:'36-54', mix:['swim'], g:S100({targetMins:'1',targetSecs:'5',baseSecs:'59',base500Mins:'6',base500Secs:'0'})},
  {nm:'T1 100 target-only sec (_:58) beg',      exp:'beginner',    age:'18-35', mix:['swim'], g:S100({targetSecs:'58',baseMins:'1',baseSecs:'10',base500Mins:'6',base500Secs:'0'})},
  {nm:'T2 100 target-only "" box adv',          exp:'advanced',    age:'18-35', mix:['swim'], g:S100({targetMins:'',targetSecs:'50',baseMins:'0',baseSecs:'58',base500Mins:'5',base500Secs:'0'})},
  {nm:'F1 500 target-only sec (_:420) int',     exp:'intermediate',age:'18-35', mix:['swim'], g:S500({targetSecs:'420',baseMins:'8',baseSecs:'0'})},
  {nm:'F2 500 current-only sec (_:400) adv',    exp:'advanced',    age:'55+',   mix:['swim'], g:S500({targetMins:'5',targetSecs:'30',baseSecs:'400'})},
  {nm:'M1 run+swim 100 both sec-only 55+',      exp:'intermediate',age:'55+',   mix:['run','swim'], g:S100({targetSecs:'55',baseSecs:'59',base500Mins:'5',base500Secs:'30'})},
];
function wd(c){ return {primaryPath:'goal',cardioTypes:c.mix,experience:c.exp,ageBracket:c.age,eventTargeted:false,liftingFocus:'support_prevention',equipment:'crossfit',
  restDays:['sun','wed'],unit:'lbs',seed:76308,name:'S',bench:135,squat:155,deadlift:185,startDate:undefined,
  cardioGoals:Object.assign({swim:clone(c.g)},c.mix.includes('run')?{run:{id:'run_base',label:'Run Base',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}}:{})}; }
function generate(file,c){ NOW=new R(2026,8,7,9,0,0).getTime(); const IA=vm(file); IA.localStorage._map.clear(); IA.eval('activeProg=null');
  IA.window.__W=wd(c); IA.eval('WD=JSON.parse(JSON.stringify(__W))'); const st=IA.eval('_swimEntryState(WD.cardioGoals.swim)');
  let err=null; try{ IA.eval('doGenerate()'); IA.flushTimers(Infinity); }catch(e){ err=e.message; }
  return {IA,st,err,p:IA.eval('activeProg'),store:new Map(IA.localStorage._map)}; }
const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
function trainAndStore(store){ // athlete trains weeks 1-2 fully and Mon/Tue of week 3 (clock -> Thu 24 Sep = week 3)
  const progs=JSON.parse(store.get('ia_programs')); const p=progs[0]; const hist={}, comp={};
  for(const w of [1,2,3]) for(const d of DAYS){ if(w===3&&!['mon','tue'].includes(d)) continue; const day=p.weeks[w]&&p.weeks[w][d]; if(!day||day.rest) continue;
    const k='w'+w+'_'+d; hist[k]=clone(day); comp[k]='done'; }
  store.set('ia_hist_'+p.id,JSON.stringify(hist)); store.set('ia_comp_'+p.id,JSON.stringify(comp)); return {pid:p.id,hist}; }
function boot(file,store,mut){ NOW=new R(2026,8,24,9,0,0).getTime(); const IA=vm(file); IA.localStorage._map.clear();
  for(const [k,v] of store) IA.localStorage._map.set(k,v); if(mut) mut(IA);
  IA.eval('activeProg=null; activeProgId=null; init()'); IA.flushTimers(50);
  const p=IA.eval('activeProg'); const stored=JSON.parse(IA.localStorage.getItem('ia_programs'))[0];
  return {IA,p,stored,cw:IA.eval('currentWeek')}; }
const wsig=p=>h16(JSON.stringify(p.weeks));
function trainedCmp(p,hist){ let same=0,n=0,bad=[]; for(const k of Object.keys(hist)){ n++; const [w,d]=k.slice(1).split('_'); const a=JSON.stringify(p.weeks[w]&&p.weeks[w][d]); if(a===JSON.stringify(hist[k])) same++; else bad.push(k);} return same+'/'+n+(bad.length?' DIFF '+bad.slice(0,6).join(','):''); }
function untrainedDiff(a,b,hist){ let n=0,d=0; const ws=new Set([...Object.keys(a.weeks),...Object.keys(b.weeks)]); for(const w of ws) for(const dd of DAYS){ const k='w'+w+'_'+dd; if(hist[k]) continue; n++; if(JSON.stringify(a.weeks[w]&&a.weeks[w][dd])!==JSON.stringify(b.weeks[w]&&b.weeks[w][dd])) d++; } return d+'/'+n; }

P('\n== 1. fresh doGenerate (clock Mon 7 Sep 2026): is each config in the D157 moved set?');
const rows=[];
for(const c of CFGS){ const gb=generate(BASE,c), gs=generate(SURG,c);
  const pb=gb.p, ps=gs.p;
  P('  '+c.nm.padEnd(40)+' validator '+JSON.stringify(gb.st)+' | BASE '+(pb?pb.totalWeeks+'wk pin '+pb.cfg._raceDateCappedWeeks:'NO PROG '+gb.err)+' | SURG '+(ps?ps.totalWeeks+'wk pin '+ps.cfg._raceDateCappedWeeks:'NO PROG '+gs.err)+' | moved '+(pb&&ps?pb.totalWeeks!==ps.totalWeeks:'?'));
  if(pb) rows.push({c,gb,moved:ps&&pb.totalWeeks!==ps.totalWeeks,surgFresh:ps&&ps.totalWeeks}); }
P('  configs generated '+rows.length+'/'+CFGS.length+'; moved by D157 on a fresh generate '+rows.filter(r=>r.moved).length+'/'+rows.length);

P('\n== 2. boot the stored BASE program (clock Thu 24 Sep 2026, weeks 1-2 + w3 mon/tue trained via ia_hist_+ia_comp_)');
const T={n:0,lenSame:0,digSame:0,storedSame:0,trainedOK:0};
for(const r of rows){ const store=new Map(r.gb.store); const storedAtGen=JSON.parse(store.get('ia_programs'))[0];
  const {hist}=trainAndStore(store);
  const b1=boot(BASE,store), b2=boot(BASE,store), s1=boot(SURG,store);
  const sNoPin=boot(SURG,store,IA=>{ const ps=JSON.parse(IA.localStorage.getItem('ia_programs')); delete ps[0].cfg._raceDateCappedWeeks; IA.localStorage.setItem('ia_programs',JSON.stringify(ps)); });
  const bNoPin=boot(BASE,store,IA=>{ const ps=JSON.parse(IA.localStorage.getItem('ia_programs')); delete ps[0].cfg._raceDateCappedWeeks; IA.localStorage.setItem('ia_programs',JSON.stringify(ps)); });
  const self=H.progDigest(b1.p)===H.progDigest(b2.p)&&wsig(b1.p)===wsig(b2.p);
  const dB=H.progDigest(b1.p), dS=H.progDigest(s1.p);
  T.n++; if(b1.p.totalWeeks===s1.p.totalWeeks) T.lenSame++; if(dB===dS&&wsig(b1.p)===wsig(s1.p)) T.digSame++;
  if(b1.stored.totalWeeks===s1.stored.totalWeeks&&h16(JSON.stringify(b1.stored))===h16(JSON.stringify(s1.stored))) T.storedSame++;
  const tb=trainedCmp(b1.p,hist), ts=trainedCmp(s1.p,hist); if(tb===ts&&!/DIFF/.test(ts)) T.trainedOK++;
  P('  '+r.c.nm+'  (stored at generate: totalWeeks '+storedAtGen.totalWeeks+', cfg pin '+storedAtGen.cfg._raceDateCappedWeeks+', weeks '+Object.keys(storedAtGen.weeks).length+')');
  P('    base self-stable '+self+' | currentWeek base '+b1.cw+' surg '+s1.cw);
  P('    BASE boot: activeProg.totalWeeks '+b1.p.totalWeeks+' weeks '+Object.keys(b1.p.weeks).length+' digest '+dB+' weeksSig '+wsig(b1.p)+' | ia_programs after boot totalWeeks '+b1.stored.totalWeeks+' pin '+b1.stored.cfg._raceDateCappedWeeks);
  P('    SURG boot: activeProg.totalWeeks '+s1.p.totalWeeks+' weeks '+Object.keys(s1.p.weeks).length+' digest '+dS+' weeksSig '+wsig(s1.p)+' | ia_programs after boot totalWeeks '+s1.stored.totalWeeks+' pin '+s1.stored.cfg._raceDateCappedWeeks);
  P('    digest equal '+(dB===dS)+' | stored record byte-equal after boot '+(JSON.stringify(b1.stored)===JSON.stringify(s1.stored))+' | trained days == snapshot: base '+tb+' surg '+ts+' | untrained days differing base vs surg '+untrainedDiff(b1.p,s1.p,hist));
  P('    COUNTERFACTUAL pin deleted: BASE boot '+bNoPin.p.totalWeeks+'wk digest '+H.progDigest(bNoPin.p)+(H.progDigest(bNoPin.p)===dB?' (=pinned)':' (!=pinned)')+' | SURG boot '+sNoPin.p.totalWeeks+'wk digest '+H.progDigest(sNoPin.p)+' trained '+trainedCmp(sNoPin.p,hist));
  r.store=store; r.hist=hist; }
P('  SUMMARY boots '+T.n+': totalWeeks same '+T.lenSame+'/'+T.n+'; digest+weeks same '+T.digSame+'/'+T.n+'; stored record same after boot '+T.storedSame+'/'+T.n+'; trained days byte-identical both arms '+T.trainedOK+'/'+T.n);

P('\n== 3. editors on the stored program (clock Thu 24 Sep), BASE vs SURG, same storage');
const EDITS=[
  ['goal switch 100->500, target sec-only "_:420"', r=>r.c.g.id==='swim_100_time', IA=>{ IA.eval("openGoalSheet(activeProgId,'swim'); selectGoalOpt('swim_500_time'); _goalSetInput('targetSecs','420'); commitGoalChange()"); }],
  ['goal switch 500->100, target sec-only "_:55"',  r=>r.c.g.id==='swim_500_time', IA=>{ IA.eval("openGoalSheet(activeProgId,'swim'); selectGoalOpt('swim_100_time'); _goalSetInput('targetSecs','55'); commitGoalChange()"); }],
  ['goal switch 100->500, target m:ss 7:00',        r=>r.c.g.id==='swim_100_time', IA=>{ IA.eval("openGoalSheet(activeProgId,'swim'); selectGoalOpt('swim_500_time'); _goalSetInput('targetMins','7'); _goalSetInput('targetSecs','0'); commitGoalChange()"); }],
  ['goal switch -> swim_base (no inputs)',          r=>true, IA=>{ IA.eval("openGoalSheet(activeProgId,'swim'); selectGoalOpt('swim_base'); commitGoalChange()"); }],
  ['setProgStart 2026-09-28 (unrelated field)',     r=>true, IA=>{ IA.eval("setProgStart('2026-09-28')"); }],
];
const E={n:0,lenSame:0,digSame:0,lenMovedFromBoot:0};
for(const r of rows) for(const [en,app,fn] of EDITS){ if(!app(r)) continue;
  const out={};
  for(const [tag,file] of [['BASE',BASE],['SURG',SURG]]){ const b=boot(file,r.store); const before=b.p.totalWeeks; let err=null;
    try{ fn(b.IA); b.IA.flushTimers(50); }catch(e){ err=e.message; }
    const p=b.IA.eval('activeProg'), st=JSON.parse(b.IA.localStorage.getItem('ia_programs'))[0];
    out[tag]={before,after:p.totalWeeks,stTW:st.totalWeeks,pin:st.cfg._raceDateCappedWeeks,goal:st.cfg.cardioGoals.swim,dig:H.progDigest(p),ws:wsig(p),tr:trainedCmp(p,r.hist),err,p}; }
  // what the edited cfg would size to with NO pin (the sizer reading the new goal), each artifact
  const len=(file,g)=>{ const IA=vm(file); return IA.calcProgramLength(r.c.mix,Object.assign({},g,{_experience:r.c.exp,_ageBracket:r.c.age,_eventTargeted:false}),'support_prevention').weeks; };
  const eg=Object.assign({},JSON.parse(r.store.get('ia_programs'))[0].cfg.cardioGoals,{swim:out.BASE.goal});
  E.n++; if(out.BASE.after===out.SURG.after) E.lenSame++; if(out.BASE.dig===out.SURG.dig&&out.BASE.ws===out.SURG.ws) E.digSame++; if(out.BASE.after!==out.BASE.before||out.SURG.after!==out.SURG.before) E.lenMovedFromBoot++;
  P('  '+r.c.nm.slice(0,3)+' | '+en.padEnd(44)+' BASE '+out.BASE.before+'->'+out.BASE.after+'wk (stored '+out.BASE.stTW+', pin '+out.BASE.pin+') dig '+out.BASE.dig+(out.BASE.err?' ERR '+out.BASE.err:'')+
    ' | SURG '+out.SURG.before+'->'+out.SURG.after+'wk (stored '+out.SURG.stTW+', pin '+out.SURG.pin+') dig '+out.SURG.dig+(out.SURG.err?' ERR '+out.SURG.err:'')+
    ' | same '+(out.BASE.dig===out.SURG.dig)+' | trained base '+out.BASE.tr+' surg '+out.SURG.tr+' | new goal written '+JSON.stringify(out.BASE.goal)+' | unpinned sizer on edited cfg: base '+len(BASE,eg)+' surg '+len(SURG,eg));
}
P('  SUMMARY edits '+E.n+': post-edit totalWeeks base==surg '+E.lenSame+'/'+E.n+'; digest base==surg '+E.digSame+'/'+E.n+'; edits where length moved off the booted length (either arm) '+E.lenMovedFromBoot+'/'+E.n);
P('\nDONE');
