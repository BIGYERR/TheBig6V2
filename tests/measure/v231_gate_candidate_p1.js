// V231 M18: g215 P1 "knee/protect hip-extension reservation never empty" segmented by focus, B -> ABx -> candidate.
// Lattice = g215's LAT_K replicated by hand (5 tiers x 6 goals x 7 foci x 3 exp = 630, seed/age/rest alternate).
// Probe = g215's own PR_AT/PR_ADD insertion (anchor count 1 asserted), plus the reservation's contents on each read.
// Usage: node v231_gate_candidate_p1.js <harness.js> <B.html> <ABx.html> <cand.html> <scratchdir>
const fs=require('fs'),path=require('path');const [HJ,FB,FA,FC,S]=process.argv.slice(2);const {load,progDigest,DAYS}=require(HJ);
const TIERS=['commercial','crossfit','home_full','home_basic','bodyweight'];
const GOALS=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS=['beginner','intermediate','advanced'],RESTS=[['sun','wed'],['sat','sun']],SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
function mk(eq,gi,f,exp,age,si,inj){const [g,x]=GOALS[gi%GOALS.length];const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],
 cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',
 restDays:RESTS[si%2].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:SEEDS[si]};if(inj)c.injury=inj;return c;}
const LAT=[];for(const eq of TIERS)GOALS.forEach((_,gi)=>FOC.forEach((f,fi)=>EXPS.forEach((e,ei)=>{const si=(gi+fi+ei)%2;LAT.push({eq,f,cfg:mk(eq,gi,f,e,si?'55+':'18-35',si,{region:'knee',tier:'protect'})});})));
const PR_AT="    const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,'lower',true)[0]||null):null;";
const PR_ADD="\n    if(globalThis.__P1) globalThis.__P1.push([hipExtPool.length, hipExtSel===null?0:1, hipExtPool.join('|')]);";
const mkProbe=(f,tag)=>{const h=fs.readFileSync(f,'utf8');const n=h.split(PR_AT).length-1;if(n!==1)throw new Error(tag+' anchor '+n);const o=path.join(S,'p1_'+tag+'.html');fs.writeFileSync(o,h.replace(PR_AT,()=>PR_AT+PR_ADD));return {plain:load(f),probe:load(o)};};
const T={B:mkProbe(FB,'B'),ABx:mkProbe(FA,'ABx'),cand:mkProbe(FC,'cand')};
const R={};const bump=(k,n=1)=>{R[k]=(R[k]||0)+n;};let mism=0;const dig={};
for(const x of LAT){for(const t of Object.keys(T)){const P=T[t];P.probe.ctx.__P1=[];const p=P.plain.buildProgram(JSON.parse(JSON.stringify(x.cfg)));const q=P.probe.buildProgram(JSON.parse(JSON.stringify(x.cfg)));
 if(progDigest(p)!==progDigest(q))mism++;dig[t+'|'+LAT.indexOf(x)]=progDigest(p);
 for(const [len,drew,names] of P.probe.ctx.__P1){bump(`${t}|${x.eq}|${x.f}|reads`);if(!len)bump(`${t}|${x.eq}|${x.f}|empty`);else bump(`${t}|pool:${x.f==='support_prevention'?'prev':'other'}:${names}`);}}}
console.log('probe digest mismatches',mism,'of',LAT.length*3);
for(const t of Object.keys(T)){console.log('== '+t);for(const eq of TIERS){const row=FOC.map(f=>`${f}:${R[`${t}|${eq}|${f}|empty`]||0}/${R[`${t}|${eq}|${f}|reads`]||0}`).join(' ');console.log('  '+eq+' empty/reads '+row);}}
const chg=(a,b)=>{const o={};LAT.forEach((x,i)=>{if(dig[a+'|'+i]!==dig[b+'|'+i]){const k=x.f;o[k]=(o[k]||0)+1;}});return o;};
console.log('configs whose program digest changes B->ABx by focus',JSON.stringify(chg('B','ABx')),'of',LAT.length);
console.log('configs whose program digest changes ABx->cand by focus',JSON.stringify(chg('ABx','cand')));
console.log('B reservation contents on prevention reads:');Object.keys(R).filter(k=>/^B\|pool:prev/.test(k)).forEach(k=>console.log('  '+k+' '+R[k]));
console.log('ABx reservation contents on prevention reads:');Object.keys(R).filter(k=>/^ABx\|pool:prev/.test(k)).forEach(k=>console.log('  '+k+' '+R[k]));
