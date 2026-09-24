// v211_gk_reach.js — gatekeeper: reach the D153 defect (hinge on tier B) with a seed sweep, and diff day by day.
// node v211_gk_reach.js <cand> <base> <shard> <nshards>
'use strict';
const H=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND,BASE,SH,NS]=process.argv.slice(2);
const C=H.load(CAND),B=H.load(BASE),B2=H.load(BASE);
const clone=v=>JSON.parse(JSON.stringify(v));const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
function canon(v){ if(v===null||typeof v!=='object') return JSON.stringify(v)===undefined?'null':JSON.stringify(v); if(Array.isArray(v)) return '['+v.map(canon).join(',')+']'; return '{'+Object.keys(v).filter(k=>!/^(id|created)$/.test(k)).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'; }
const mb={mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'}};
const G={pace:{types:['run'],g:{run:{id:'run_pace_goal',label:'P',...mb,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}}},
 base:{types:['run'],g:{run:{id:'run_base',label:'B',...mb}}},
 half:{types:['run'],g:{run:{id:'run_half',label:'H',...mb,baselineDist:'5',baseline:'5mi'}},race:'2026-12-06'},
 mara:{types:['run'],g:{run:{id:'run_marathon',label:'M',...mb,baselineDist:'8',baseline:'8mi'}}},
 '10k':{types:['run'],g:{run:{id:'run_10k',label:'10',...mb}}}};
// independent oracles
const HAND=/deadlift|\brdl\b|romanian|good morning|hinge|swing|pull-through|back extension|hyperextension|reverse hyper|glute-ham|\bghr\b|hip thrust|glute bridge|nordic|hip extension/i;
const STRETCH=/stretch|mobility|90\/90|foam|worlds greatest/i;
function longOf(c){ if(!c||Array.isArray(c)||!c.dose) return null; let nrc=false;
  if(c.isNRC){ if(!/^long run/i.test(c.subtype||'')||/race day|time trial/i.test(c.subtype||'')) return null; nrc=true; if(/rehearsal/i.test(c.detail||'')) return {nrc,tier:'A'}; }
  else if(!(c.type==='run'&&c.dose.key==='long')) return null;
  const m=c.dose.k==='time'?(+c.dose.mins||0):(+c.dose.mi||0)*(+c.dose.tgt||0)/60; if(!m) return null; return {nrc,tier:m>=75?'A':m>=45?'B':'C'}; }
const isLiftSec=s=>!!s&&(s.items||[]).length&&!/taper|mobility|stretch|trunk|core/i.test(s.label||'')&&!s.coreHeader&&!s.core&&!s.hip;
const R={shard:SH,configs:0,selfBad:0,crash:0,dayDiffs:{},uncl:0,unclEx:[],orc:{base:{hinge:0,zeroNRC:0,zeroNSW:0,tierB:0,hingeEx:[]},cand:{hinge:0,zeroNRC:0,zeroNSW:0,tierB:0,hingeEx:[],zeroEx:[]}}};
function orc(side,p,tag){ const O=R.orc[side];
  for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const x=p.weeks[w][d]; if(!x||x.rest) continue; const L=longOf(x.cardio); if(!L||L.tier!=='B') continue; O.tierB++;
    const its=[].concat(...(x.sections||[]).map(s=>s.items||[])).filter(it=>it&&!STRETCH.test(it.name||''));
    const h=its.filter(it=>HAND.test(String(it.name||''))); if(h.length){ O.hinge++; if(O.hingeEx.length<4) O.hingeEx.push(tag+' W'+w+d+' '+h.map(i=>i.name).join('/')); }
    // D38: two days before a race/time trial card carry no lifting by doctrine — exclude by hand
    const flatDays=[]; for(const ww of Object.keys(p.weeks).map(Number).sort((a,b)=>a-b)) for(const dd of DAYS) flatDays.push({w:ww,d:dd});
    const idx=flatDays.findIndex(z=>z.w===+w&&z.d===d); const nearRace=[1,2].some(k=>{ const z=flatDays[idx+k]; const y=z&&p.weeks[z.w][z.d]; return !!(y&&y.cardio&&!Array.isArray(y.cardio)&&/race day|time trial/i.test(y.cardio.subtype||'')); });
    if(!nearRace && !(x.sections||[]).some(isLiftSec)){ const k=L.nrc?'zeroNRC':'zeroNSW'; O[k]++; if(O.zeroEx&&O.zeroEx.length<4) O.zeroEx.push(tag+' W'+w+d+' '+x.title+' secs='+(x.sections||[]).map(s=>s.label||s.coreHeader).join('/')); } } }
const all=[]; for(const gk of Object.keys(G)) for(const eq of ['commercial','home_full','crossfit']) for(const fo of ['strength','hypertrophy','balanced','support_prevention']) for(const ex of ['intermediate','advanced']) for(const rs of [['sun','wed'],['sat','sun'],['mon','thu','sun']]) for(let si=0; si<8; si++) all.push({gk,eq,fo,ex,rs,seed:[99991,1234,1001,24865,76308,4242,31337,777][si]});
all.forEach((x,i)=>{ if(i % +NS !== +SH) return; const g=G[x.gk];
  const cfg={name:'GK',primaryPath:'event',eventTargeted:!!g.race,raceDate:g.race||'',cardioTypes:g.types,cardioGoals:clone(g.g),liftingFocus:x.fo,experience:x.ex,ageBracket:'18-35',equipment:x.eq,unit:'lbs',restDays:x.rs,days:['sun','mon','tue','wed','thu','fri','sat'],bench:185,squat:255,deadlift:315,startDate:'2026-10-05',seed:x.seed};
  const tag=`${x.gk}|${x.eq}|${x.fo}|${x.ex}|${x.rs.join('')}|${x.seed}`; R.configs++;
  let b,b2,c; try{ b=clone(B.buildProgram(clone(cfg))); b2=clone(B2.buildProgram(clone(cfg))); c=clone(C.buildProgram(clone(cfg))); }catch(e){ R.crash++; return; }
  if(canon(b)!==canon(b2)) R.selfBad++;
  orc('base',b,tag); orc('cand',c,tag);
  const top=p=>{const o={};for(const k of Object.keys(p)) if(!['weeks','cfg'].includes(k)) o[k]=p[k]; return canon(o);};
  if(top(b)!==top(c)){ R.uncl++; if(R.unclEx.length<5) R.unclEx.push(tag+' top'); }
  const ws=new Set([...Object.keys(b.weeks),...Object.keys(c.weeks)]);
  for(const w of ws) for(const d of DAYS){ const bd=b.weeks[w]&&b.weeks[w][d], cd=c.weeks[w]&&c.weeks[w][d]; if(canon(bd)===canon(cd)) continue;
    const L=bd&&longOf(bd.cardio); const liftWk=(b.liftRecoveryWeeks||[]).includes(+w);
    if(L&&L.tier==='B'&&canon(bd.cardio)===canon(cd&&cd.cardio)){ const k=(L.nrc?'NRC':'NSW')+' tier B'+(liftWk?' recovery week (D155+D153)':' (D153)'); R.dayDiffs[k]=(R.dayDiffs[k]||0)+1; }
    else { R.uncl++; if(R.unclEx.length<5) R.unclEx.push(tag+' W'+w+d+' tier '+(L&&L.tier)); } } });
console.log(JSON.stringify(R));
