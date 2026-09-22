// v203 re-cut, pass 2: (a) the anchor-step card diff swept over a lattice, not one config;
// (b) an NRC subtype census with the long run printed verbatim and every upper-bound token counted.
// Read-only.  node tests/measure/v203_recut_lattice.js <artifact.html>
// ORACLE: a card that is byte-identical after the athlete's mile anchor moves a full chart
// row did not read the anchor. The comparison is a byte diff of two builds; nothing asks
// rowPaceAt or runAnchorInfo what the answer should be.
'use strict';
const path=require('path'), vm=require('vm');
const H=require(path.join(__dirname,'..','harness.js'));
const {load,fixtures,progDigest}=H;
const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
const IA=load(ART);const P=(...a)=>console.log(...a);
const ctxGet=n=>vm.runInContext("(typeof "+n+"!=='undefined')?"+n+":undefined",IA.ctx);
const runAnchorInfo=ctxGet('runAnchorInfo');
P('ARTIFACT',ART,'IA_VERSION',IA.IA_VERSION);

const RACE='2026-12-06';
const NRCG=new Set(['run_half','run_marathon','run_5k','run_10k']);
const GOALS=['run_half','run_marathon','run_5k','run_10k','run_pace_goal','run_mile_time','run_15_under10'];
const EXPS=['beginner','intermediate','advanced'];
const FOCUS=['support_prevention','hypertrophy'];
const EQUIP=['crossfit','dumbbells'];
const SEEDS=[76308,11111,4242];
function mk(gid,mm,ss,exp,focus,eq,seed){
  const g={id:gid,label:gid,baselineDist:'5',baseline:'5mi',mileBestMins:mm,mileBestSecs:ss,mileBestSrc:{kind:'entered'}};
  if(gid==='run_pace_goal'){g.targetDist='1.5';g.targetMins='10';g.targetSecs='0';g.targetTime='10:00';g.paceUnit='mi';}
  if(gid==='run_mile_time'){g.targetMins='9';g.targetSecs='0';g.targetTime='9:00';}
  if(gid==='run_15_under10'){g.targetMins='10';g.targetSecs='0';g.targetTime='10:00';}
  return {...fixtures.HALF_MANNY,cardioGoals:{run:g},experience:exp,liftingFocus:focus,equipment:eq,seed,
    raceDate:NRCG.has(gid)?RACE:null,eventTargeted:NRCG.has(gid)};
}
function cards(p){const c=[],l=[];Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>
  Object.keys(p.weeks[w]).forEach(d=>{const day=p.weeks[w][d];
    const x=day&&day.cardio;if(x)(Array.isArray(x)?x:[x]).forEach((s,i)=>c.push(['W'+w+d+i,JSON.stringify(s)]));
    if(day&&day.sections&&day.sections.length)l.push(['W'+w+d,JSON.stringify(day.sections)]);}));return {c,l};}
function dd(A,B){const m=new Map(B);let n=0;A.forEach(([k,v])=>{if(m.get(k)!==v)n++;});return [n,A.length];}

P('\n=== A. LATTICE: mile anchor 10:30 -> 10:00 (a full chart row), cfg.seed pinned per pair ===');
const seg={},segE={};let cfgN=0,cMov=0,cTot=0,lMov=0,lTot=0,crash=0;
GOALS.forEach(g=>EXPS.forEach(e=>FOCUS.forEach(f=>EQUIP.forEach(q=>SEEDS.forEach(s=>{
  let a,b;try{a=IA.buildProgram(mk(g,'10','30',e,f,q,s));b=IA.buildProgram(mk(g,'10','0',e,f,q,s));}
  catch(err){crash++;return;}
  const ca=cards(a),cb=cards(b);
  const [cn,ct]=dd(ca.c,cb.c),[ln,lt]=dd(ca.l,cb.l);
  cfgN++;cMov+=cn;cTot+=ct;lMov+=ln;lTot+=lt;
  const k=g;seg[k]=seg[k]||[0,0,0,0];seg[k][0]+=cn;seg[k][1]+=ct;seg[k][2]+=ln;seg[k][3]+=lt;
  const k2=g+'/'+e;segE[k2]=segE[k2]||[0,0];segE[k2][0]+=cn;segE[k2][1]+=ct;
}))))); 
P('  configs (pairs of builds): '+cfgN+'   crashes: '+crash);
P('  CARDIO cards moved '+cMov+'/'+cTot+' ('+(100*cMov/cTot).toFixed(1)+'%)   LIFT cards moved '+lMov+'/'+lTot);
P('  by goal (all experiences pooled):');
Object.keys(seg).forEach(k=>P('    '+k.padEnd(18)+' cardio '+String(seg[k][0]).padStart(5)+'/'+String(seg[k][1]).padEnd(6)
  +' ('+(100*seg[k][0]/seg[k][1]).toFixed(1)+'%)   lift '+seg[k][2]+'/'+seg[k][3]));
P('  by goal x experience (cardio only):');
Object.keys(segE).sort().forEach(k=>P('    '+k.padEnd(30)+String(segE[k][0]).padStart(5)+'/'+String(segE[k][1]).padEnd(6)
  +' ('+(100*segE[k][0]/segE[k][1]).toFixed(1)+'%)'));

P('\n=== B. NRC HALF_MANNY subtype census + upper-bound tokens ===');
const HM=IA.buildProgram(fixtures.HALF_MANNY);
const cen={};const CAPRE=/do not run faster than|never faster than|no faster than|not? faster than/i;
let nCap=0,nAll=0;const longSamples=[],recSamples=[];
Object.keys(HM.weeks).sort((a,b)=>+a-+b).forEach(w=>Object.keys(HM.weeks[w]).forEach(d=>{
  const x=HM.weeks[w][d]&&HM.weeks[w][d].cardio;if(!x)return;
  (Array.isArray(x)?x:[x]).forEach(s=>{const st=String(s.subtype||s.type||'');nAll++;
    cen[st]=cen[st]||[0,0];cen[st][0]++;
    const hasCap=CAPRE.test(String(s.detail||''))||(s.dose&&s.dose.cap!=null);
    if(hasCap){cen[st][1]++;nCap++;}
    if(/Long/i.test(st)&&longSamples.length<2)longSamples.push(['W'+w+' '+d,st,String(s.detail||''),JSON.stringify(s.dose||null)]);
    if(/Recovery/i.test(st)&&recSamples.length<1)recSamples.push(['W'+w+' '+d,st,String(s.detail||''),JSON.stringify(s.dose||null)]);
  });}));
P('  subtype (count, with-upper-bound):');
Object.keys(cen).sort().forEach(k=>P('    '+k.padEnd(34)+cen[k][0]+'  cap='+cen[k][1]));
P('  total cardio cards '+nAll+', with an upper bound '+nCap);
[...recSamples,...longSamples].forEach(([k,st,det,dose])=>{
  P('  --- '+k+'  subtype='+JSON.stringify(st));P('      detail: '+JSON.stringify(det));P('      dose:   '+dose);});
P('\nDONE');
