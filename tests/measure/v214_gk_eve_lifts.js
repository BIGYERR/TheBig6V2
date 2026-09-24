// v214_gk_eve_lifts.js — gatekeeper: (1) lifts newly landing on T-1/T-2 under V214, by injury mode; (2) non-eve days that move vs V213.
'use strict';
const H=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const C=H.load(process.argv[2]),B=H.load(process.argv[3]);
const clone=v=>JSON.parse(JSON.stringify(v));const DAYS=['mon','tue','wed','thu','fri','sat','sun'],ALL=['sun','mon','tue','wed','thu','fri','sat'];
function canon(v){ if(v===null||typeof v!=='object') return JSON.stringify(v)===undefined?'null':JSON.stringify(v); if(Array.isArray(v)) return '['+v.map(canon).join(',')+']'; return '{'+Object.keys(v).filter(k=>!/^(id|created)$/.test(k)).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'; }
function combos(a,k){const out=[];(function rec(i,cur){if(cur.length===k){out.push(cur.slice());return;}for(let j=i;j<a.length;j++){cur.push(a[j]);rec(j+1,cur);cur.pop();}})(0,[]);return out;}
const mb={mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'}};const pace={id:'run_pace_goal',label:'P',...mb,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'};
const isLift=s=>!!s&&(s.items||[]).length&&!/mobility|stretch|taper/i.test(s.label||'');
const MIX=[['pace',['run'],{run:pace}],['pace+bike',['run','bike'],{run:pace,bike:{id:'bike_base',label:'B'}}],['pace+swim',['run','swim'],{run:pace,swim:{id:'swim_base',label:'S'}}]];
const INJ={none:null,easy:{region:'lowback',tier:'workaround'},noimpact:{region:'knee',tier:'protect'},noimpact_swim:{region:'lowback',tier:'protect'},reduce:{region:'ankle',tier:'workaround'},swimout:{region:'shoulder',tier:'protect'},halfstep:{region:'knee',halfstep:true}};
const st={};const ex={newLift:[],ripple:[]};
for(const [gk,types,goals] of MIX)for(const n of [3,4,5,6])for(const cal of combos(DAYS,n))for(const mode of Object.keys(INJ))for(const [tw,wd] of [[1,3],[2,5],[3,6],[4,0]]){
 const d=new Date(2026,9,5+7*(tw-1)+wd);const rd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const cfg={name:'GK',primaryPath:'event',eventTargeted:true,raceDate:rd,_testWeek:tw,_raceDateCappedWeeks:tw,cardioTypes:types,cardioGoals:clone(goals),liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:ALL.filter(x=>!cal.includes(x)),days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-10-05',seed:24865};if(INJ[mode])cfg.injury=INJ[mode];
 const b=clone(B.buildProgram(clone(cfg))),c=clone(C.buildProgram(clone(cfg)));const k=gk+' '+mode;st[k]=st[k]||{progs:0,newLiftEve:0,newLiftT2:0,liftT12_V213:0,liftT12_V214:0,rippleProgs:0,rippleDays:0};st[k].progs++;
 const flat=[];for(const w of Object.keys(c.weeks).map(Number).sort((a,b)=>a-b))for(const dd of DAYS)flat.push({w,d:dd});const ti=flat.findIndex(z=>z.w===tw&&z.d===DAYS[wd]);const E=ti>=1?flat[ti-1]:null,T2=ti>=2?flat[ti-2]:null;
 const lift=(p,z)=>!!z&&!!p.weeks[z.w][z.d]&&(p.weeks[z.w][z.d].sections||[]).some(isLift);
 if(lift(b,E)||lift(b,T2))st[k].liftT12_V213++; if(lift(c,E)||lift(c,T2))st[k].liftT12_V214++;
 if(lift(c,E)&&!lift(b,E)){st[k].newLiftEve++;if(ex.newLift.length<4)ex.newLift.push(k+' '+cal.join('')+' T'+tw+DAYS[wd]+' eve '+E.w+E.d+' V213 '+(b.weeks[E.w][E.d]&&b.weeks[E.w][E.d].title)+' -> V214 '+c.weeks[E.w][E.d].title+' ['+(c.weeks[E.w][E.d].sections||[]).filter(isLift).map(s=>s.label).join('/')+']');}
 if(lift(c,T2)&&!lift(b,T2))st[k].newLiftT2++;
 let rp=0;for(const z of flat){if(E&&z.w===E.w&&z.d===E.d)continue;const bd=b.weeks[z.w]&&b.weeks[z.w][z.d],cd=c.weeks[z.w][z.d];if(canon(bd)===canon(cd))continue;if(T2&&z.w===T2.w&&z.d===T2.d&&canon({...bd,title:null})===canon({...cd,title:null}))continue;rp++;{const off=flat.findIndex(q=>q.w===z.w&&q.d===z.d)-ti;if(off>=-2){st[k].rippleNearTest=(st[k].rippleNearTest||0)+1;}else st[k].rippleEarly=(st[k].rippleEarly||0)+1;}if(ex.ripple.length<4)ex.ripple.push(k+' '+cal.join('')+' T'+tw+DAYS[wd]+' W'+z.w+z.d+' '+(bd&&bd.title)+' -> '+(cd&&cd.title)+' cardio same: '+(canon(bd&&bd.cardio)===canon(cd&&cd.cardio)));}
 if(rp){st[k].rippleProgs++;st[k].rippleDays+=rp;}}
for(const k of Object.keys(st))console.log(k.padEnd(24),JSON.stringify(st[k]));ex.newLift.forEach(x=>console.log('NEWLIFT',x));ex.ripple.forEach(x=>console.log('RIPPLE',x));
