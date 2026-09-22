// v203 re-cut before-picture: what V202 did to the four V201-era rulings.
// Read-only. Run against BOTH artifacts with the SAME instrument:
//   node tests/measure/v203_recut_against_v202.js <artifact.html>
//
// ORACLES (independent of the functions under test):
//  Q2/Q4 card diff: the oracle is "a card whose printed text is byte-identical after the
//        athlete's anchor moves a full chart row did not read the anchor." The instrument
//        is a byte compare of two builds, not a call to rowPaceAt/runAnchorInfo.
//  Q3    the cfg transform is transcribed from commitGoalChange's own source line
//        (next={id,label,baseline:''}); what is asserted is the cfg SHAPE afterwards.
//  Q5    verbatim detail strings, printed not summarised.
//  Q6    progDigest + MANNY_DIGEST_BY_VERSION from tests/harness.js.
'use strict';
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const {load,fixtures,progDigest}=H;
const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
const IA=load(ART);
const P=(...a)=>console.log(...a);
// runAnchorInfo/Sentence/Line are not in EXPORT_NAMES; reach them through the VM context.
const vm=require('vm');
const ctxGet=n=>vm.runInContext("(typeof "+n+"!=='undefined')?"+n+":undefined",IA.ctx);
const runAnchorInfo=ctxGet('runAnchorInfo'), runAnchorSentence=ctxGet('runAnchorSentence'),
      runAnchorLine=ctxGet('runAnchorLine'), rowPaceAt=ctxGet('rowPaceAt');
P('  reachable: runAnchorInfo='+typeof runAnchorInfo+' runAnchorSentence='+typeof runAnchorSentence+' rowPaceAt='+typeof rowPaceAt);
P('ARTIFACT',ART,'IA_VERSION',IA.IA_VERSION);

const RACE='2026-12-06';
const NRC=new Set(['run_half','run_marathon','run_5k','run_10k']);
const GOALS=[['run_half','Half Marathon'],['run_marathon','Marathon'],['run_5k','5K'],['run_10k','10K'],
             ['run_pace_goal','Hit a Pace / Time Goal'],['run_mile_time','Mile Time'],['run_15_under10','1.5 Mile']];
function mk(gid,label,mm,ss,over={}){
  const g={id:gid,label,baselineDist:'5',baseline:'5mi',mileBestMins:mm,mileBestSecs:ss,mileBestSrc:{kind:'entered'}};
  if(gid==='run_pace_goal'){g.targetDist='1.5';g.targetMins='10';g.targetSecs='0';g.targetTime='10:00';g.paceUnit='mi';}
  if(gid==='run_mile_time'){g.targetMins='9';g.targetSecs='0';g.targetTime='9:00';}
  if(gid==='run_15_under10'){g.targetMins='10';g.targetSecs='0';g.targetTime='10:00';}
  return {...fixtures.HALF_MANNY,cardioGoals:{run:g},
    raceDate:NRC.has(gid)?RACE:null, eventTargeted:NRC.has(gid), ...over};
}
// ── card instruments ────────────────────────────────────────────────────────
function cardioCards(p){const o=[];Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>
  Object.keys(p.weeks[w]).forEach(d=>{const c=p.weeks[w][d]&&p.weeks[w][d].cardio;if(!c)return;
    (Array.isArray(c)?c:[c]).forEach((s,i)=>o.push({k:'W'+w+' '+d+' #'+i,t:JSON.stringify(s)}));}));return o;}
function liftCards(p){const o=[];Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>
  Object.keys(p.weeks[w]).forEach(d=>{const s=p.weeks[w][d]&&p.weeks[w][d].sections;
    if(!s||!s.length)return;o.push({k:'W'+w+' '+d,t:JSON.stringify(s)});}));return o;}
function diff(A,B){const mb=new Map(B.map(x=>[x.k,x.t]));let n=0,tot=0;const moved=[];
  A.forEach(x=>{tot++;const y=mb.get(x.k);if(y===undefined||y!==x.t){n++;moved.push(x.k);}});return {n,tot,moved};}

// ── Q2: the reporter step, 10:30 -> 10:00, HALF_MANNY ───────────────────────
P('\n=== Q2 HALF_MANNY anchor 10:30 -> 10:00, seed 76308 pinned ===');
const A=IA.buildProgram(mk('run_half','Half Marathon','10','30'));
const B=IA.buildProgram(mk('run_half','Half Marathon','10','0'));
P('  totalWeeks A',A.totalWeeks,'B',B.totalWeeks,' digestA',progDigest(A),'digestB',progDigest(B));
const ai=runAnchorInfo(mk('run_half','Half Marathon','10','30')), bi=runAnchorInfo(mk('run_half','Half Marathon','10','0'));
P('  anchor row A mile='+ai.row.mile+' B mile='+bi.row.mile+' (chart row changed: '+(ai.row.mile!==bi.row.mile)+')');
const cA=cardioCards(A),cB=cardioCards(B),lA=liftCards(A),lB=liftCards(B);
const dc=diff(cA,cB), dl=diff(lA,lB);
P('  CARDIO cards changed: '+dc.n+'/'+dc.tot);
P('  LIFT   cards changed: '+dl.n+'/'+dl.tot);
// class of change per changed cardio card: subtype-only / detail-only / dose-only / mixed
const cls={};const unchanged=[];
const mB=new Map(cB.map(x=>[x.k,JSON.parse(x.t)]));
cA.forEach(x=>{const y=mB.get(x.k);const a=JSON.parse(x.t);
  if(!y||JSON.stringify(a)===JSON.stringify(y)){unchanged.push(x.k+' ['+(a.subtype||a.type)+']');return;}
  const keys=new Set([...Object.keys(a),...Object.keys(y)]);
  const ch=[...keys].filter(k=>JSON.stringify(a[k])!==JSON.stringify(y[k])).sort().join('+');
  cls[ch]=(cls[ch]||0)+1;});
P('  class of change (fields that moved) -> count:');Object.keys(cls).sort().forEach(k=>P('    '+k+' : '+cls[k]));
P('  UNCHANGED cardio cards ('+unchanged.length+'): '+unchanged.join(' | '));

// ── Q4: per-goal card diff across the same full-row step ────────────────────
P('\n=== Q4 per-goal, anchor 10:30 -> 10:00, seed pinned ===');
P('  goal                 cardio-cards-moved/total   lift-moved/total   tail printed by runAnchorSentence');
GOALS.forEach(([gid,lab])=>{
  let a,b;try{a=IA.buildProgram(mk(gid,lab,'10','30'));b=IA.buildProgram(mk(gid,lab,'10','0'));}
  catch(e){P('  '+gid+' CRASH '+e.message);return;}
  const d1=diff(cardioCards(a),cardioCards(b)), d2=diff(liftCards(a),liftCards(b));
  const info=runAnchorInfo(mk(gid,lab,'10','30'));
  const sent=runAnchorSentence(info);
  const tail=sent.slice(sent.lastIndexOf('.',sent.length-2)+1).trim();
  P('  '+gid.padEnd(18),String(d1.n).padStart(4)+'/'+String(d1.tot).padEnd(6),
    String(d2.n).padStart(4)+'/'+String(d2.tot).padEnd(6),' tw='+a.totalWeeks,' | '+tail);
});
P('\n  FULL sentence per goal (verbatim):');
GOALS.forEach(([gid,lab])=>{const i=runAnchorInfo(mk(gid,lab,'10','30'));
  P('   '+gid.padEnd(18)+' :: '+runAnchorSentence(i));});
P('  em-dashes in runAnchorSentence source: '+((runAnchorSentence.toString().match(/—/g)||[]).length));

// ── Q3: commitGoalChange round trip, cfg transform transcribed from source ──
P('\n=== Q3 goal round trip: half -> run_15_under10 -> half, as commitGoalChange writes cfg ===');
const start={...fixtures.HALF_MANNY};
P('  START cfg.cardioGoals.run = '+JSON.stringify(start.cardioGoals.run));
const step1={id:'run_15_under10',label:'1.5 Mile Under 10',baseline:'',targetMins:'10',targetSecs:'0',targetTime:'10:00'};
const mid={...start,cardioGoals:{...start.cardioGoals,run:step1}};
P('  AFTER SWITCH 1 = '+JSON.stringify(mid.cardioGoals.run));
P('   mileBestMins present? '+('mileBestMins' in mid.cardioGoals.run)+'  mileBestSrc? '+('mileBestSrc' in mid.cardioGoals.run));
const step2={id:'run_half',label:'Half Marathon',baseline:''};
const back={...mid,cardioGoals:{...mid.cardioGoals,run:step2}};
P('  AFTER SWITCH BACK = '+JSON.stringify(back.cardioGoals.run));
[['START',start],['MID',mid],['BACK',back]].forEach(([n,c])=>{
  const i=runAnchorInfo(c);
  P('   '+n.padEnd(6)+' anchorSec='+(i?i.anchorSec:'n/a')+' rawSec='+(i?i.rawSec:'n/a')+' kind='+(i?i.kind:'n/a')
    +' -> '+(i?runAnchorSentence(i):'(no anchor)'));
});
const sp=IA.buildProgram(start), bp=IA.buildProgram(back);
P('   digest START='+progDigest(sp)+'  BACK='+progDigest(bp)+'  identical='+(progDigest(sp)===progDigest(bp)));
const rt=diff(cardioCards(sp),cardioCards(bp));
P('   cardio cards differing from the ORIGINAL half build after the round trip: '+rt.n+'/'+rt.tot);

// ── Q5: NRC easy days, verbatim ─────────────────────────────────────────────
P('\n=== Q5 NRC HALF_MANNY recovery / long run, verbatim ===');
const HM=IA.buildProgram(fixtures.HALF_MANNY);
let shownR=0,shownL=0,nrcTot=0,withCap=0,capless=[];
Object.keys(HM.weeks).sort((a,b)=>+a-+b).forEach(w=>Object.keys(HM.weeks[w]).forEach(d=>{
  const c=HM.weeks[w][d]&&HM.weeks[w][d].cardio;if(!c)return;
  (Array.isArray(c)?c:[c]).forEach(s=>{
    const st=String(s.subtype||s.type||''),det=String(s.detail||'');
    const easy=/Recovery|Long Slow|Easy/i.test(st);
    if(!easy)return;nrcTot++;
    const cap=/do not run faster than|never faster than|no faster than/i.test(det)||(s.dose&&s.dose.cap!=null);
    if(cap)withCap++;else capless.push('W'+w+' '+d+' ['+st+']');
    if(/Recovery/i.test(st)&&shownR<1){shownR++;P('  RECOVERY W'+w+' '+d+' subtype='+JSON.stringify(st));
      P('    detail: '+JSON.stringify(det));P('    dose: '+JSON.stringify(s.dose||s._dose||null));}
    if(/Long/i.test(st)&&shownL<1){shownL++;P('  LONG W'+w+' '+d+' subtype='+JSON.stringify(st));
      P('    detail: '+JSON.stringify(det));P('    dose: '+JSON.stringify(s.dose||s._dose||null));}
  });
}));
P('  NRC easy/recovery/long cards: '+nrcTot+'  with an upper bound: '+withCap+'  without: '+(nrcTot-withCap));
P('  capless list: '+capless.join(' | '));
// run_base comparison: does the ceiling exist there?
const BASE=IA.buildProgram({...fixtures.HALF_MANNY,raceDate:null,eventTargeted:false,
  cardioGoals:{run:{id:'run_base',label:'Build a Base',baselineDist:'5',baseline:'5mi',mileBestMins:'10',mileBestSecs:'30',mileBestSrc:{kind:'entered'}}}});
let bs=0,bcap=0,one=null;
Object.keys(BASE.weeks).forEach(w=>Object.keys(BASE.weeks[w]).forEach(d=>{
  const c=BASE.weeks[w][d]&&BASE.weeks[w][d].cardio;if(!c)return;
  (Array.isArray(c)?c:[c]).forEach(s=>{const st=String(s.subtype||'');if(!/Easy/i.test(st))return;bs++;
    if(/do not run faster than/.test(String(s.detail||'')))bcap++;if(!one)one=st+' :: '+s.detail;});}));
P('  run_base easy cards: '+bs+'  with "do not run faster than": '+bcap);
P('  run_base sample: '+JSON.stringify(one));

// ── Q6 fixture + digest ─────────────────────────────────────────────────────
P('\n=== Q6 fixture and digest ===');
P('  fixtures.HALF_MANNY.cardioGoals.run = '+JSON.stringify(fixtures.HALF_MANNY.cardioGoals.run));
P('  HALF_MANNY digest on this artifact: '+progDigest(HM)+'  totalWeeks='+HM.totalWeeks);
P('  MANNY_DIGEST_BY_VERSION rows: '+JSON.stringify(H.MANNY_DIGEST_BY_VERSION));
P('  row for V'+IA.IA_VERSION+': '+(H.MANNY_DIGEST_BY_VERSION[IA.IA_VERSION]||'NO ROW')
  +'  matches built digest: '+(H.MANNY_DIGEST_BY_VERSION[IA.IA_VERSION]===progDigest(HM)));
P('  MANNY_DELOAD_OFF rows: '+JSON.stringify(H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION));
P('\nDONE');
