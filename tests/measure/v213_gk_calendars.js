// v213_gk_calendars.js — gatekeeper: every 3-day pace calendar (35) and every multi-sport pace/NRC calendar, no injury.
'use strict';
const H=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND,BASE,PART]=process.argv.slice(2);
const C=H.load(CAND),B=H.load(BASE);
const clone=v=>JSON.parse(JSON.stringify(v));const DAYS=['mon','tue','wed','thu','fri','sat','sun'],ALL=['sun','mon','tue','wed','thu','fri','sat'];
function canon(v){ if(v===null||typeof v!=='object') return JSON.stringify(v)===undefined?'null':JSON.stringify(v); if(Array.isArray(v)) return '['+v.map(canon).join(',')+']'; return '{'+Object.keys(v).filter(k=>!/^(id|created)$/.test(k)).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'; }
function combos(a,k){const out=[];(function rec(i,cur){if(cur.length===k){out.push(cur.slice());return;}for(let j=i;j<a.length;j++){cur.push(a[j]);rec(j+1,cur);cur.pop();}})(0,[]);return out;}
const mb={mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'}};
const pace={id:'run_pace_goal',label:'P',...mb,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'};
const half={id:'run_half',label:'H',...mb,baselineDist:'5',baseline:'5mi'};
const cardioOf=p=>{const o={};for(const w of Object.keys(p.weeks))for(const d of DAYS){const x=p.weeks[w][d];o[w+d]=x?canon(x.cardio||null):'none';}return canon(o);};
const runs=(p,w)=>DAYS.map(d=>{const x=p.weeks[w]&&p.weeks[w][d];const cs=x?[].concat(x.cardio||[]).filter(c=>c&&c.type==='run'):[];return cs.length?{d,c:cs[0]}:null}).filter(Boolean);
const hardOf=c=>{const k=c.dose&&c.dose.key;if(k)return ['int','chi','long','steady'].includes(k)?k:null;const s=String(c.subtype||'');if(/^long run/i.test(s))return 'long';if(/speed|tempo|interval|hill|fartlek|race day|time trial/i.test(s))return 'speed';return null;};
function untol(p){let n=0,prev=null;for(const w of Object.keys(p.weeks).map(Number).sort((a,b)=>a-b))for(const d of DAYS){const x=p.weeks[w][d];const cs=x?[].concat(x.cardio||[]).filter(c=>c&&c.type==='run'):[];const h=cs.length?hardOf(cs[0]):null;if(h&&prev)n++;prev=h;}return n;}
const mk=(types,goals,cal,exp,seed)=>({name:'GK',primaryPath:'event',eventTargeted:false,raceDate:'',cardioTypes:types,cardioGoals:clone(goals),liftingFocus:'balanced',experience:exp,ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:ALL.filter(d=>!cal.includes(d)),days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-10-05',seed});
const R={spacer:{cals:new Set(),progs:0,cardioMoved:0},spaced:{cals:new Set(),progs:0,weeks:0,badWeeks:0,ex:[]},ms:{progs:0,routed:0,untolB:0,untolC:0,longNotLastC:0,paceRuns3plus:0,ex:[]}};
if(PART==='3day'){
 for(const cal of combos(DAYS,3))for(const g of [pace,{...pace,id:'run_mile_time'}])for(const exp of ['beginner','intermediate','advanced'])for(const seed of [24865,76308]){
  const idx=cal.map(d=>DAYS.indexOf(d)); const spacer=idx.some(i=>idx.includes((i+1)%7)&&idx.includes((i+2)%7));
  const cfg=mk(['run'],{run:g},cal,exp,seed); const b=clone(B.buildProgram(clone(cfg))),c=clone(C.buildProgram(clone(cfg)));
  if(spacer){R.spacer.cals.add(cal.join(''));R.spacer.progs++;if(cardioOf(b)!==cardioOf(c))R.spacer.cardioMoved++;}
  else{R.spaced.cals.add(cal.join(''));R.spaced.progs++;for(const w of Object.keys(c.weeks)){const rs=runs(c,w);if(!rs.length)continue;R.spaced.weeks++;const ks=rs.map(r=>r.c.dose&&r.c.dose.key);if(!(ks.filter(k=>k==='int').length===1&&ks.filter(k=>k==='chi').length===1)){R.spaced.badWeeks++;if(R.spaced.ex.length<5)R.spaced.ex.push(cal.join('')+' '+g.id+' '+exp+' W'+w+' '+ks.join(','));}}}}
}else{
 for(const [gk,g] of [['pace',pace],['half',half]])for(const o of ['bike','swim'])for(const n of [3,4,5,6])for(const cal of combos(DAYS,n))for(const seed of [24865,76308]){
  const cfg=mk(['run',o],{run:g,[o]:{id:o+'_base',label:o}},cal,'intermediate',seed);const b=clone(B.buildProgram(clone(cfg))),c=clone(C.buildProgram(clone(cfg)));
  R.ms.progs++;const k=runs(c,1).length;const routed=gk==='pace'?k>=3:k>=2;if(!routed)continue;R.ms.routed++;if(gk==='pace')R.ms.paceRuns3plus++;
  R.ms.untolB+=untol(b);const u=untol(c);R.ms.untolC+=u;if(u&&R.ms.ex.length<5)R.ms.ex.push(gk+'+'+o+' '+cal.join('')+' untol '+u);
  if(gk==='half')for(const w of Object.keys(c.weeks)){const rs=runs(c,w);const li=rs.findIndex(r=>hardOf(r.c)==='long');if(li>=0&&li!==rs.length-1){R.ms.longNotLastC++;if(R.ms.ex.length<5)R.ms.ex.push(gk+'+'+o+' '+cal.join('')+' W'+w+' long not last');}}}
}
console.log(JSON.stringify(R,(k,v)=>v instanceof Set?[...v].length:v));
