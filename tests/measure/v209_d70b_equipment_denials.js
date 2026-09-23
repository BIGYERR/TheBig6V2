// v209_d70b_equipment_denials.js — MODE B before-picture for D70b (ruled V195, queued V209).
// Read-only. Works from V206 (git 57b3ed8), never the working copy (a builder is editing it).
//   node v209_d70b_equipment_denials.js <v206.html> <out.json> [--limit N]
// ORACLE: a hand-authored implement table (CLASS below) keyed on what the movement physically
// needs, written from the movement names and NOT from _gearOK / _auxGearOK / _tierHasBarbell.
// Every distinct prescribed name is printed with its class so the table itself can be audited.
// The engine's own _gearOK regexes are read out of the source text ONLY for root-cause
// attribution (does the engine's filter even see this name?), never to decide a violation.
// Denial copy: LIVE strings read out of the artifact at runtime; RULED strings (D68/D70b, V195,
// Mario's tier copy) are quoted from handoff §11f V195 because the artifact does not carry them.
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const file=process.argv[2], out=process.argv[3];
const LIM=process.argv.includes('--limit')?+process.argv[process.argv.indexOf('--limit')+1]:Infinity;
const IA=H.load(file); const html=IA.html;
console.log('ia-version',IA.version);

// ── 1. denial copy census (live) ──────────────────────────────────────────────
const lines=html.split('\n');
const denialRe=/\b(No|Nobody|Nothing but|without|never owns)\b[^'"`<]{0,60}/;
console.log('\n== LIVE equipment copy lines carrying a denial token ==');
lines.forEach((l,i)=>{ if(/^\s*\/\//.test(l)) return;
  if(/(id:'(home_full|home_basic|commercial|crossfit|bodyweight|minimal)'.*desc:)|(\['(bodyweight|home_basic|commercial)','[^']+',")/.test(l)){
    const m=l.match(/desc:'([^']*)'|,"([^"]*)"\]/); const txt=m?(m[1]||m[2]):'';
    console.log(`  L${i+1} ${denialRe.test(txt)?'DENIAL ':'plain  '} ${l.trim().slice(0,170)}`); }});
['No machines','Nobody here owns a cable machine','No barbell','No weights','Nothing but you'].forEach(s=>{
  const c=html.split(s).length-1; console.log(`  literal "${s}": ${c} occurrence(s) in artifact`);});

// ── 2. oracle: hand implement table ───────────────────────────────────────────
const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
function CLASS(name){
  const N=name.toLowerCase(), c=new Set();
  if(/\bbarbell\b|^back squat|^front squat|^paused back squat|^paused front squat|^bench press|close-grip bench|trap bar|power clean|hang clean|clean and jerk|clean & jerk|^hang power|^power snatch|^snatch|rack pull|landmine|\bez[- ]?bar|^good morning|^overhead squat|^deadlift|^sumo deadlift|^romanian deadlift$|^conventional deadlift|^push press$|^overhead press$|^pause squat|^box squat|^pin press|^floor press$|^bent[- ]over row$|^pendlay|^zercher|^hip thrust$/.test(N)) c.add('BARBELL');
  if(/dumbbell|\bdb\b|\(db\)/.test(N)) c.add('DUMBBELL');
  if(/kettlebell|\(kb\)|\bkb\b/.test(N)) c.add('KETTLEBELL');
  if(/goblet/.test(N)&&!c.has('KETTLEBELL')) c.add('DUMBBELL');
  if(/med(icine)? ?ball|wall ball|ball slam|slam ball/.test(N)) c.add('MEDBALL');
  if(/cable|\brope\b|face pull|pulldown|pull-down|woodchop/.test(N)&&!/band|banded/.test(N)) c.add('CABLE');
  if(/machine|leg press|leg extension|lying leg curl|seated leg curl|\bleg curl$|hack squat|smith|pec deck|belt squat|reverse hyper/.test(N)) c.add('MACHINE');
  if(/glute[- ]ham|\bghd\b|ghr\b/.test(N)) c.add('MACHINE');                // GHD is a machine frame; V195 counted it under "No machines"
  if(/preacher/.test(N)) c.add('MACHINE');                                    // preacher bench / station; V195 counted it
  if(/45° back extension|45 degree back extension|hyperextension|roman chair/.test(N)&&!/bodyweight|floor|bench-free/.test(N)) c.add('APPARATUS');
  if(/rower|\brow erg|assault bike|air bike|echo bike|ski ?erg|bike erg|treadmill/.test(N)) c.add('CARDIO_MACHINE');
  if(/weighted|plate|sandbag|vest|\bsled\b|prowler/.test(N)) c.add('WEIGHTED');
  if(/^(farmer|suitcase|overhead) carry$/.test(N)) c.add('LOADED_CARRY');     // V177: implement unnamed, loaded by definition
  if(/\bband\b|banded|resistance band|pallof|monster walk|lateral band/.test(N)&&!/^it band/.test(N)) c.add('BAND');   // 'IT band' is the iliotibial band, not an implement
  if(/^dips$|^weighted dips|parallel bar|^l-sit hold$/.test(N)) c.add('DIP_BARS');
  if(/^bench dips$/.test(N)) c.add('BENCH');
  if(/box jump|box step|^box squat/.test(N)) c.add('BOX');
  if(/ab wheel/.test(N)) c.add('ABWHEEL');
  if(/pull-?ups?\b|chin-?ups?\b|hanging|toes[- ]to[- ]bar|muscle-?up|dead hang|scap(ular)? pull/.test(N)) c.add('BAR');
  if(/\btrx\b|\brings?\b/.test(N)) c.add('TRX_RINGS');
  if(/assisted pull/.test(N)) c.add('AMBIG_ASSIST');                          // band or assist machine; name does not say
  return c;
}
const LOADS=['BARBELL','DUMBBELL','KETTLEBELL','MEDBALL','CABLE','MACHINE','WEIGHTED','LOADED_CARRY'];
const DENIALS=[
  {id:'hb_nobarbell',  tier:'home_basic', src:'LIVE wizard L2728 "No barbell."',           cls:['BARBELL']},
  {id:'bw_noweights',  tier:'bodyweight', src:'LIVE wizard "No weights."',                  cls:LOADS},
  {id:'bw_nothingbut', tier:'bodyweight', src:'LIVE travel sheet "Nothing but you. A floor, a wall, and a chair." (beyond No weights)', cls:['BAND','BAR','TRX_RINGS','APPARATUS','CARDIO_MACHINE','AMBIG_ASSIST','DIP_BARS','BENCH','BOX','ABWHEEL']},
  {id:'hf_nomachines', tier:'home_full',  src:'RULED V195 (not in artifact) "No machines" — machine+cable',  cls:['MACHINE','CABLE']},
  {id:'hf_apparatus',  tier:'home_full',  src:'RULED V195 "No machines" — apparatus/erg, reported apart', cls:['APPARATUS','CARDIO_MACHINE']},
  {id:'cf_nocable',    tier:'crossfit',   src:'RULED V195 (not in artifact) "Nobody here owns a cable machine"', cls:['CABLE']},
  {id:'cf_machine',    tier:'crossfit',   src:'crossfit MACHINE (no copy denies it; reported for V195 comparison)', cls:['MACHINE']},
];

// engine's own filter regexes (attribution only)
const gsrc=html.slice(html.indexOf('const _gearOK = n => {'), html.indexOf('\n  const _gear = pool => (pool||[])'));
const rx=k=>{ const m=gsrc.match(new RegExp('if\\(!'+k+' && /(.+?)/i\\.test\\(N\\)\\) return false;')); return m?new RegExp(m[1],'i'):null; };
const RX={bar:rx('hasBarbell'),cab:rx('hasCables'),db:rx('hasDumbbells')};
console.log('\n== engine _gearOK clauses read from source (attribution only) ==');
Object.entries(RX).forEach(([k,v])=>console.log('  ',k,v?v.source.slice(0,160):'NOT FOUND'));
const tierHas={home_full:{bar:1,cab:0,db:1},home_basic:{bar:0,cab:0,db:1},commercial:{bar:1,cab:1,db:1},crossfit:{bar:1,cab:0,db:1},bodyweight:{bar:0,cab:0,db:0}};
const gearSees=(n,t)=>{ const h=tierHas[t]; const r=[]; if(!h.bar&&RX.bar&&RX.bar.test(n)) r.push('bar'); if(!h.cab&&RX.cab&&RX.cab.test(n)) r.push('cab'); if(!h.db&&RX.db&&RX.db.test(n)) r.push('db'); return r; };

// ── 3. lattice ────────────────────────────────────────────────────────────────
const DAYS=H.DAYS;
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const BODY=['strength','hypertrophy','fatloss','balanced'], EVENT=['support_strength','support_athletic','support_prevention'];
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight'];
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','55+'];
const RESTS=[['sun','wed'],['sat','sun']], SEEDS=[76308,1234];
function mkCfg(g,focus,exp,age,eq,rest,seed){
  const ev=EVENT.includes(focus);
  return {name:'M',primaryPath:ev?'event':'goal',cardioTypes:['run'],
    cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},GOALS[g])},
    eventTargeted:false,liftingFocus:focus,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',
    restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed};
}
const R={builds:0,crash:0,crashes:[],items:{},names:{},viol:{},seg:{},secOf:{},swap:{},swapCalls:0,swapCrash:0};
TIERS.forEach(t=>{R.items[t]=0;R.names[t]={};});
DENIALS.forEach(d=>{R.viol[d.id]={total:0,byName:{},bySeg:{}};});
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
let n=0; const t0=Date.now();
outer: for(const eq of TIERS) for(const g of Object.keys(GOALS)) for(const focus of BODY.concat(EVENT)) for(const exp of EXPS) for(const age of AGES) for(const rest of RESTS) for(const seed of SEEDS){
  if(n>=LIM) break outer; n++;
  const cfg=mkCfg(g,focus,exp,age,eq,rest,seed); let prog;
  try{ prog=IA.buildProgram(cfg); }catch(e){ R.crash++; if(R.crashes.length<10) R.crashes.push(eq+'/'+g+'/'+focus+'/'+exp+': '+e.message); continue; }
  R.builds++;
  const doSwap = seed===SEEDS[0] && rest===RESTS[0]; const swapped=new Set();
  Object.keys(prog.weeks||{}).forEach(wk=>{ DAYS.forEach(d=>{ const day=prog.weeks[wk][d]; if(!day||!day.sections) return;
    day.sections.forEach(s=>{ (s.items||[]).forEach(it=>{ const nm=clean(it&&it.name); if(!nm) return;
      R.items[eq]++; bump(R.names[eq],nm);
      const cl=CLASS(nm); R.mx=R.mx||{}; cl.forEach(c=>{ R.mx[c]=R.mx[c]||{}; bump(R.mx[c],eq); });
      DENIALS.forEach(dn=>{ if(dn.tier!==eq) return; if(!dn.cls.some(c=>cl.has(c))) return;
        const v=R.viol[dn.id]; v.total++; bump(v.byName,nm);
        ['goal:'+g,'focus:'+focus,'exp:'+exp,'age:'+age,'wk:'+wk].forEach(k=>bump(v.bySeg,k));
        const sk=dn.id+'|'+nm; R.secOf[sk]=R.secOf[sk]||{}; bump(R.secOf[sk],String(s.label||s.coreHeader||'?').slice(0,40)); });
      if(doSwap && !swapped.has(nm) && typeof IA.swapCandidates==='function'){ swapped.add(nm);
        try{ R.swapCalls++; const _r=IA.swapCandidates(it.name,day,wk,prog)||{}; const cs=[].concat(_r.tier1||[],_r.tier2||[]);
          R.swapCallsT=R.swapCallsT||{}; bump(R.swapCallsT,eq); const hitD=new Set();
          cs.forEach(c=>{ const cn=clean(typeof c==='string'?c:(c&&c.name)); const ccl=CLASS(cn);
            DENIALS.forEach(dn=>{ if(dn.tier===eq&&dn.cls.some(x=>ccl.has(x))){ R.swap[dn.id]=R.swap[dn.id]||{}; bump(R.swap[dn.id],cn); hitD.add(dn.id); } }); });
          R.swapHit=R.swapHit||{}; hitD.forEach(d=>bump(R.swapHit,d));
        }catch(e){ R.swapCrash++; } }
    }); }); }); });
  if(n%250===0) console.error('..',n,'builds',((Date.now()-t0)/1000).toFixed(0)+'s');
}
// ── 4. HALF_MANNY ─────────────────────────────────────────────────────────────
const mp=IA.buildProgram(IA.fixtures.HALF_MANNY), dg=H.progDigest(mp), dg2=H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
let mItems=0; const mViol={}, mNames={};
Object.keys(mp.weeks).forEach(wk=>DAYS.forEach(d=>{ const day=mp.weeks[wk][d]; (day&&day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{ const nm=clean(it.name); if(!nm) return; mItems++; bump(mNames,nm); const cl=CLASS(nm); ['CABLE','MACHINE','APPARATUS','CARDIO_MACHINE','AMBIG_ASSIST'].forEach(c=>{ if(cl.has(c)) bump(mViol,c+':'+nm); }); })); }));
R.manny={digest:dg,selfStable:dg===dg2,expected:'0ac7da6b1691a8e1',rowV206:H.MANNY_DIGEST_BY_VERSION[206],items:mItems,viol:mViol,distinct:Object.keys(mNames).length};
fs.writeFileSync(out,JSON.stringify(R));

// ── 5. report ─────────────────────────────────────────────────────────────────
console.log(`\n== LATTICE: ${n} configs attempted, ${R.builds} built, ${R.crash} crashed ==`); R.crashes.forEach(c=>console.log('  CRASH',c));
TIERS.forEach(t=>console.log(`  ${t.padEnd(11)} items ${R.items[t]}  distinct names ${Object.keys(R.names[t]).length}`));
const tot=TIERS.reduce((a,t)=>a+R.items[t],0); console.log('  ALL items',tot);
let grand=0;
DENIALS.forEach(dn=>{ const v=R.viol[dn.id]; if(!['bw_nothingbut','hf_apparatus','cf_machine'].includes(dn.id)) grand+=v.total;
  console.log(`\n-- ${dn.id} [${dn.tier}] ${dn.src}\n   ${v.total} / ${R.items[dn.tier]} items (${(100*v.total/Math.max(1,R.items[dn.tier])).toFixed(2)}%)`);
  Object.entries(v.byName).sort((a,b)=>b[1]-a[1]).forEach(([nm,c])=>{ const cl=[...CLASS(nm)].join('+'); const gs=gearSees(nm,dn.tier);
    const secs=Object.entries(R.secOf[dn.id+'|'+nm]||{}).sort((a,b)=>b[1]-a[1]).map(([s,k])=>s+'×'+k).join('; ');
    console.log(`   ${String(c).padStart(6)}  ${nm.padEnd(40)} class=${cl.padEnd(18)} _gearOK-blocks-on-tier=${gs.length?gs.join(','):'NO'}  sections: ${secs}`); });
  const segs={}; Object.entries(v.bySeg).forEach(([k,c])=>{ const [a]=k.split(':'); (segs[a]=segs[a]||[]).push(k.slice(a.length+1)+'='+c); });
  Object.entries(segs).forEach(([a,l])=>console.log(`   seg ${a}: ${l.join(' ')}`));
  if(R.swap[dn.id]) console.log(`   SWAP-SHEET: ${(R.swapHit||{})[dn.id]||0} / ${(R.swapCallsT||{})[dn.tier]||0} swapCandidates() lists on this tier offer >=1 violator (sub-lattice seed ${SEEDS[0]}, rest ${RESTS[0]}, one call per distinct name per build); offers: `+Object.entries(R.swap[dn.id]).sort((a,b)=>b[1]-a[1]).map(([k,c])=>k+'×'+c).join('; '));
});
console.log(`\n== HEADLINE (live + ruled denials, excl. bw_nothingbut/hf_apparatus/cf_machine): ${grand} / ${tot} items = ${(100*grand/tot).toFixed(2)}%`);
console.log('\n== CLASS x TIER matrix (prescribed items; denominators above) ==');
console.log('   '+'class'.padEnd(15)+TIERS.map(t=>t.padStart(12)).join(''));
Object.keys(R.mx||{}).sort().forEach(c=>console.log('   '+c.padEnd(15)+TIERS.map(t=>String((R.mx[c]||{})[t]||0).padStart(12)).join('')));
console.log(`== swapCandidates calls ${R.swapCalls}, crashes ${R.swapCrash}`);
console.log('\n== HALF_MANNY digest',dg,'expected',R.manny.expected,'harness row V206',R.manny.rowV206,'match',dg===R.manny.expected,'self-stable',R.manny.selfStable);
console.log('   items',mItems,'distinct',R.manny.distinct,'cable/machine/apparatus/erg/assist hits:',JSON.stringify(mViol));
console.log('\n== CLASS AUDIT: every distinct prescribed name, per tier, with oracle class ==');
TIERS.forEach(t=>{ console.log(' ['+t+']'); Object.entries(R.names[t]).sort((a,b)=>b[1]-a[1]).forEach(([nm,c])=>{ const cl=[...CLASS(nm)].join('+')||'-'; console.log(`   ${String(c).padStart(6)} ${nm.slice(0,60).padEnd(60)} ${cl}`); }); });
console.log('\nDONE');
