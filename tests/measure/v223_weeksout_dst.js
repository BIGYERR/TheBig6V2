// v212 measure — raceAlignment.weeksOut across DST (verifies coach's P-RACEDATE item 5 claim).
// Usage: node tests/measure/v223_weeksout_dst.js <artifact.html>
// Parent spawns one child per TZ (TZ must be set before the process touches Date).
// ORACLE (part 1): ISO split -> Date.UTC day count -> floor(days/7). Never asks raceAlignment.
// FOOTPRINT (part 2): for every NY pair the oracle flags, build the program with the clock pinned to
//   local noon of "today" on (a) the artifact and (b) a source-surgery COUNTERFACTUAL copy whose
//   weeksOut line counts calendar days (instrument only, not a proposal), and (c) the artifact in a UTC
//   child. Diff totalWeeks, startDate, blockOpen, race-day W/D, progDigest, underFloor, card copy.
const cp=require('child_process'), path=require('path'), fs=require('fs'), os=require('os');
const ART=path.resolve(process.argv[2]); const MODE=process.argv[3];
const GOALS=['run_5k','run_10k','run_half','run_marathon'];
const FLOOR_HAND={run_5k:4,run_10k:4,run_half:6,run_marathon:12}; // hand copy of the V188 floor table
const iso=t=>{const d=new Date(t);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');};
const dUTC=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const oracleDays=(a,b)=>Math.round((dUTC(b)-dUTC(a))/86400000);
const SPRING=['2027-03-14'], FALL=['2026-11-01','2027-11-07']; // US rules, hand table
function crosses(a,b,list){return list.some(x=>x>a&&x<=b);}
function pairs(){const out=[];for(let t=dUTC('2026-09-01');t<=dUTC('2027-06-30');t+=86400000){const a=iso(t);for(let k=0;k<=139;k++)out.push([a,iso(t+k*86400000)]);}return out;}
const OLD='const weeksOut = Math.floor((race - today)/86400000/7);';
const NEW='const weeksOut = Math.floor(Math.round((race - today)/86400000)/7);';

if(MODE==='child'){
  const R=Date; globalThis.__NOW=R.now();
  class F extends R{constructor(...a){if(a.length===0)super(globalThis.__NOW);else super(...a);} static now(){return globalThis.__NOW;}}
  globalThis.Date=F;
  const H=require(path.resolve(__dirname,'..','harness.js'));
  const IA=H.load(ART), CF=H.load(process.env.CFART);
  const tz=IA.eval('Intl.DateTimeFormat().resolvedOptions().timeZone');
  // PART 1: weeksOut vs oracle, all pairs, all goals (weeksOut is goal-independent; underFloor is not)
  const P=pairs(); const bad=[]; let n=0; const seg={};
  const bump=(k)=>{seg[k]=(seg[k]||0)+1;};
  for(const [a,b] of P){
    const days=oracleDays(a,b), exp=Math.floor(days/7);
    const al=IA.raceAlignment('run_half',b,true,a); n++;
    const cr=crosses(a,b,SPRING)?(crosses(a,b,FALL)?'both':'spring'):(crosses(a,b,FALL)?'fall':'none');
    bump('all:'+cr);
    if(al.weeksOut!==exp){bad.push({a,b,days,exp,got:al.weeksOut}); bump('bad:'+cr); bump('bad:mod7='+(days%7));}
  }
  const ufFlip={}; for(const g of GOALS){ufFlip[g]=0; for(const x of bad){ if((x.got<FLOOR_HAND[g])!==(x.exp<FLOOR_HAND[g])) ufFlip[g]++; }}
  // coach's 2026-09-22 row and the earlier v223_race_date_tz window
  const row922=P.filter(p=>p[0]==='2026-09-22').length, bad922=bad.filter(x=>x.a==='2026-09-22').length;
  // PART 2: footprint builds on the flagged pairs (NY) or the NY-flagged list passed in (UTC control)
  const list=process.env.BADLIST?JSON.parse(fs.readFileSync(process.env.BADLIST,'utf8')):bad;
  const snap=(M,a,b,g)=>{const[y,m,d]=a.split('-').map(Number); globalThis.__NOW=new R(y,m-1,d,12,0,0).getTime();
    const cfg=JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); cfg.cardioGoals.run.id=g; cfg.raceDate=b; cfg.eventTargeted=true;
    const r={};
    try{ const prog=M.buildProgram(cfg); M._applyWizardStart(prog,cfg);
      r.totalWeeks=prog.totalWeeks; r.startDate=prog.startDate; r.blockOpen=prog.blockOpen; r.nW=Object.keys(prog.weeks||{}).length;
      r.race=null; for(const w of Object.keys(prog.weeks)) for(const dd of Object.keys(prog.weeks[w])){const c=prog.weeks[w][dd]&&prog.weeks[w][dd].cardio;const cs=Array.isArray(c)?c:(c?[c]:[]); if(cs.some(x=>/RACE DAY/i.test(x.subtype||''))) r.race='W'+w+' '+dd;}
      r.digest=H.progDigest(prog);
      M.window.__P=prog; const al=M.eval('progAlignment(__P)'); r.weeksOut=al.weeksOut; r.underFloor=al.underFloor; r.openWeek=al.openWeek; r.futureWeeks=al.futureWeeks;
      r.copy=M.eval('(function(){WD={cardioGoals:{run:{id:'+JSON.stringify(g)+'}}}; return alignedStartCopy(progAlignment(__P));})()');
    }catch(e){r.err=String(e&&e.message||e).slice(0,200);}
    globalThis.__NOW=R.now(); return r;};
  const rows=[]; let builds=0;
  for(const x of list) for(const g of GOALS){ rows.push({a:x.a,b:x.b,g,art:snap(IA,x.a,x.b,g),cf:snap(CF,x.a,x.b,g)}); builds+=2; }
  fs.writeFileSync(process.env.OUTF,JSON.stringify({tz,n,seg,nBad:bad.length,bad,ufFlip,row922,bad922,rows,builds}));
  process.exit(0);
}

// PARENT
if(MODE==="wu"||MODE==="wuchild"){ wuMain(); } else {
const SP=fs.mkdtempSync(path.join(os.tmpdir(),'wodst-'));
const src=fs.readFileSync(ART,'utf8'); const cnt=src.split(OLD).length-1;
if(cnt!==1){console.log('ANCHOR count='+cnt+' — counterfactual NOT-APPLIED; FAILED MEASUREMENT');process.exit(2);}
const CFART=path.join(SP,'cf.html'); fs.writeFileSync(CFART,src.replace(OLD,NEW));
console.log('artifact',ART,'ia-version',(src.match(/ia-version" content="(\d+)"/)||[])[1],'| flooring line',src.split('\n').findIndex(l=>l.includes(OLD))+1);
function run(tz,badlist){const out=path.join(SP,tz.replace('/','_')+'.json'); if(fs.existsSync(out))fs.unlinkSync(out);
  const env=Object.assign({},process.env,{TZ:tz,OUTF:out,CFART}); if(badlist)env.BADLIST=badlist;
  cp.execFileSync(process.execPath,[__filename,ART,'child'],{env,stdio:['ignore','ignore','inherit'],maxBuffer:1<<28});
  return JSON.parse(fs.readFileSync(out,'utf8'));}
const NY=run('America/New_York');
const BL=path.join(SP,'badlist.json'); fs.writeFileSync(BL,JSON.stringify(NY.bad));
const UT=run('UTC',BL);
for(const R of [NY,UT]){
  console.log('\n== TZ',R.tz,'| pairs',R.n,'| weeksOut != oracle:',R.nBad+'/'+R.n);
  console.log('   segments',JSON.stringify(R.seg));
  console.log('   underFloor flips (oracle vs engine) per goal over the flagged pairs:',JSON.stringify(R.ufFlip));
  console.log('   today=2026-09-22 row:',R.bad922+'/'+R.row922);
  console.log('   first flagged:',JSON.stringify(R.bad.slice(0,3)));
}
// Footprint
const F=['totalWeeks','startDate','blockOpen','nW','race','digest','weeksOut','underFloor','openWeek','futureWeeks','copy','err'];
function diff(pick){const c={};let any=0,ex=null;NY.rows.forEach((r,i)=>{const[L,Rr]=pick(r,i);let d=false;for(const f of F){if(JSON.stringify(L[f])!==JSON.stringify(Rr[f])){c[f]=(c[f]||0)+1;d=true; if(f==='copy'&&!ex)ex={a:r.a,b:r.b,g:r.g,before:L.copy,after:Rr.copy,ufB:L.underFloor,ufA:Rr.underFloor};}} if(d)any++;});return{c,any,ex};}
const n2=NY.rows.length, errs=NY.rows.filter(r=>r.art.err||r.cf.err).length+UT.rows.filter(r=>r.art.err||r.cf.err).length;
console.log('\n== FOOTPRINT builds: NY',NY.builds,'UTC',UT.builds,'| (pair,goal) rows',n2,'| build errors',errs);
const d1=diff(r=>[r.art,r.cf]); console.log('NY artifact vs NY counterfactual: rows differing',d1.any+'/'+n2,'by field',JSON.stringify(d1.c));
const d2=diff((r,i)=>[r.art,UT.rows[i].art]); console.log('NY artifact vs UTC artifact:      rows differing',d2.any+'/'+n2,'by field',JSON.stringify(d2.c));
const d3=diff((r,i)=>[r.cf,UT.rows[i].art]); console.log('NY counterfactual vs UTC artifact: rows differing',d3.any+'/'+n2,'by field',JSON.stringify(d3.c));
const byGoal={}; NY.rows.forEach(r=>{if(r.art.underFloor!==r.cf.underFloor)byGoal[r.g]=(byGoal[r.g]||0)+1;}); console.log('underFloor flips in built programs by goal:',JSON.stringify(byGoal));
if(d1.ex)console.log('EXAMPLE',JSON.stringify(d1.ex,null,1));
console.log('\nPASS-ish summary: pairs',NY.n,'flagged',NY.nBad,'UTC flagged',UT.nBad);
} // end PART 1 parent

// === PART 2 (appended): updateRaceDateFeedback daysUntil/weeksUntil (base.html:2279-2280) and the
// safe-pace offer (:2339 achievablePacePerMile -> :2347 applySuggestedPace(tm,ts) -> :2253 WD targetMins/Secs
// -> paceGoalTarget :3052 -> calcProgramLength / buildRunSession).
// Usage: node tests/measure/v223_weeksout_dst.js <artifact.html> wu
// ORACLE: same Date.UTC day count. Engine weeksUntil = verbatim copy of :2275-2280 evaluated in the VM
// with the clock pinned to local noon of "today". Offer gate = :2330 diff<0 branch, recommended from
// the artifact calcProgramLength (the gate is the artifact's; only weeksUntil is under test).
function wuMain(){
  const WUEXPR="(function(r){const today=new Date(); today.setHours(0,0,0,0); const [ry,rm,rd]=r.split('-').map(Number); const race=new Date(ry,rm-1,rd); race.setHours(0,0,0,0); const daysUntil=Math.floor((race - today) / 86400000); const weeksUntil=Math.floor(daysUntil / 7); return [daysUntil,weeksUntil];})";
  const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'];
  const DISTS=[['1','mi'],['1.5','mi'],['3','mi'],['5','km']];
  const mkG=(dist,unit)=>{const tD=(unit==='km'?parseFloat(dist)*0.621:parseFloat(dist)); const tot=Math.round(300*tD); // 5:00/mi target, deliberately out of reach
    return {id:'run_pace_goal',label:'Pace',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi',targetDist:dist,paceUnit:unit,targetMins:Math.floor(tot/60),targetSecs:tot%60,targetTime:Math.floor(tot/60)+':'+String(tot%60).padStart(2,'0')};};
  if(MODE==='wuchild'){
    const R=Date; globalThis.__NOW=R.now();
    class Fk extends R{constructor(...a){if(a.length===0)super(globalThis.__NOW);else super(...a);} static now(){return globalThis.__NOW;}}
    globalThis.Date=Fk;
    const H=require(path.resolve(__dirname,'..','harness.js')); const IA=H.load(ART);
    const tz=IA.eval('Intl.DateTimeFormat().resolvedOptions().timeZone');
    const wu=IA.eval(WUEXPR); const APPM=IA.eval("achievablePacePerMile"), MMSS=IA.eval("secsToMMSS"), CPL=IA.eval("calcProgramLength");
    const P=pairs(); let n=0,dBad=0,wBad=0; const seg={}; const bad=[];
    for(const [a,b] of P){const[y,m,d]=a.split('-').map(Number); globalThis.__NOW=new R(y,m-1,d,12).getTime();
      const [du,wk]=wu(b); const od=oracleDays(a,b), ow=Math.floor(od/7); n++;
      if(du!==od){dBad++; const cr=crosses(a,b,SPRING)?(crosses(a,b,FALL)?'both':'spring'):(crosses(a,b,FALL)?'fall':'none'); seg['days:'+cr]=(seg['days:'+cr]||0)+1;}
      if(wk!==ow){wBad++; bad.push({a,b,od,ow,du,wk});}}
    globalThis.__NOW=R.now();
    let rows=0,shownE=0,shownO=0,gateFlip=0,bothShown=0,paceDiff=0,ex=null; const byExp={}; const toBuild=new Map();
    for(const x of bad) for(const e of EXPS) for(const ag of AGES) for(const [dist,unit] of DISTS){ rows++;
      const g=mkG(dist,unit); const tD=(unit==='km'?parseFloat(dist)*0.621:parseFloat(dist));
      const rec=CPL(['run'],{run:g,_experience:e,_ageBracket:ag,_eventTargeted:true},'balanced').weeks;
      const off=w=>{ if(w<1||w-rec>=0) return null; const sp=APPM(w,tD,e,ag), st=sp*tD; return {tm:Math.floor(Math.round(st)/60),ts:Math.round(st)%60,txt:MMSS(st)+' ('+MMSS(sp)+'/mi)'}; };
      const E=off(x.wk), O=off(x.ow); if(E)shownE++; if(O)shownO++; if(!!E!==!!O)gateFlip++;
      if(E&&O){bothShown++; if(E.tm!==O.tm||E.ts!==O.ts){paceDiff++; byExp[e]=(byExp[e]||0)+1; if(!ex)ex={a:x.a,b:x.b,exp:e,age:ag,dist:dist+unit,rec,engineWeeks:x.wk,oracleWeeks:x.ow,before:'In '+x.wk+' weeks you can safely reach '+E.txt,after:'In '+x.ow+' weeks you can safely reach '+O.txt};
        const k=[e,ag,dist,unit,E.tm,E.ts,O.tm,O.ts].join('|'); if(!toBuild.has(k))toBuild.set(k,{e,ag,dist,unit,E,O,b:x.b,a:x.a});}}}
    let built=0,lenDiff=0,twDiff=0,digDiff=0,errs=0,errMsg=null; let bex=null;
    for(const v of toBuild.values()){ const mk=(o)=>{const c=JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const g=mkG(v.dist,v.unit); g.targetMins=o.tm; g.targetSecs=o.ts; g.targetTime=o.tm+':'+String(o.ts).padStart(2,'0');
        c.cardioGoals={run:g}; c.experience=v.e; c.ageBracket=v.ag; c.raceDate=v.b; return c;};
      try{ const[y,m,d]=v.a.split('-').map(Number); globalThis.__NOW=new R(y,m-1,d,12).getTime();
        const cE=mk(v.E), cO=mk(v.O);
        const LE=CPL(['run'],{run:cE.cardioGoals.run,_experience:v.e,_ageBracket:v.ag,_eventTargeted:true},'balanced').weeks;
        const LO=CPL(['run'],{run:cO.cardioGoals.run,_experience:v.e,_ageBracket:v.ag,_eventTargeted:true},'balanced').weeks;
        const pE=IA.buildProgram(cE), pO=IA.buildProgram(cO); built+=2;
        if(LE!==LO)lenDiff++; if(pE.totalWeeks!==pO.totalWeeks)twDiff++;
        if(H.progDigest(pE)!==H.progDigest(pO)){digDiff++; if(!bex)bex={cfg:v.e+'/'+v.ag+'/'+v.dist+v.unit,clickE:v.E.tm+':'+String(v.E.ts).padStart(2,'0'),clickO:v.O.tm+':'+String(v.O.ts).padStart(2,'0'),weeksE:pE.totalWeeks,weeksO:pO.totalWeeks,LE,LO};}
      }catch(err){errs++; errMsg=errMsg||String(err&&err.message||err).slice(0,200);} }
    globalThis.__NOW=R.now();
    fs.writeFileSync(process.env.OUTF,JSON.stringify({tz,n,dBad,wBad,seg,rows,shownE,shownO,gateFlip,bothShown,paceDiff,byExp,ex,uniq:toBuild.size,built,lenDiff,twDiff,digDiff,errs,errMsg,bex}));
    process.exit(0);
  }
  const SP2=fs.mkdtempSync(path.join(os.tmpdir(),'wu-'));
  for(const tz of ['America/New_York','UTC']){ const out=path.join(SP2,tz.replace('/','_')+'.json');
    cp.execFileSync(process.execPath,[__filename,ART,'wuchild'],{env:Object.assign({},process.env,{TZ:tz,OUTF:out}),stdio:['ignore','ignore','inherit']});
    const r=JSON.parse(fs.readFileSync(out,'utf8'));
    console.log('\n== WU',r.tz,'| pairs',r.n,'| daysUntil != oracle',r.dBad+'/'+r.n,JSON.stringify(r.seg),'| weeksUntil != oracle',r.wBad+'/'+r.n);
    console.log('   offer rows (flagged pairs x 3 exp x 3 age x 4 dist):',r.rows,'| shown engine',r.shownE,'oracle',r.shownO,'| gate flips',r.gateFlip,'| both shown',r.bothShown,'| printed pace differs',r.paceDiff,JSON.stringify(r.byExp));
    if(r.ex)console.log('   EXAMPLE',JSON.stringify(r.ex));
    console.log('   click reach: unique (cfg, click) pairs',r.uniq,'| builds',r.built,'| errors',r.errs,r.errMsg||'','| calcProgramLength differs',r.lenDiff,'| totalWeeks differs',r.twDiff,'| progDigest differs',r.digDiff);
    if(r.bex)console.log('   BUILD EXAMPLE',JSON.stringify(r.bex));
  }
  console.log('\nWU DONE');
}
