'use strict';
// V211 / D153 before-picture (read-only). D153: tier B of d18LongRunDayPass adds `pull[- ]?through`
// and `45° back extension` to _D18_LEG_RX (one regex, shared NRC+NSW pass).
// usage: node tests/measure/v211_d153_tierb_hinge.js <dir> [seedsN]
// <dir> holds v210.html (one-time copy of the V210 candidate working tree). cf.html = v210 + the
// regex change (anchor count==1) is written there, plus instrumented copies for the HALF_MANNY arms.
// Oracles: hand tier from dose minutes (75/45 cuts from the D18 ruling text), subtype/key for
// "is a long run", a HAND hinge list (below) for the miss scan, and before/after JSON per day.
// The suspect (_D18_LEG_RX / _longRunTier) is never asked for an answer.
const fs=require('fs'), path=require('path'), H=require(path.join(__dirname,'..','harness.js'));
const S=process.argv[2]; const NSEEDS=+(process.argv[3]||2);
const RAW=fs.readFileSync(path.join(S,'v210.html'),'utf8');
const P=(...a)=>console.log(...a);
const RX_OLD="const _D18_LEG_RX=/swing|clean|snatch|deadlift|romanian|\\brdl\\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\\bleg\\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;";
const RX_NEW="const _D18_LEG_RX=/swing|clean|snatch|deadlift|romanian|\\brdl\\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\\bleg\\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol|pull[- ]?through|45° back extension/i;";
{ const c=RAW.split(RX_OLD).length-1; if(c!==1){P('ABORT anchor count',c);process.exit(2);} }
const CFF=path.join(S,'cf.html'); try{fs.unlinkSync(CFF);}catch(e){} fs.writeFileSync(CFF,RAW.replace(RX_OLD,()=>RX_NEW));
{ const c=fs.readFileSync(CFF,'utf8').split(RX_NEW).length-1; P('CF anchor written count',c); if(c!==1) process.exit(2); }
const ART={v210:path.join(S,'v210.html'),cf:CFF};
const L={v210:H.load(ART.v210), cf:H.load(ART.cf)};
P('versions', Object.keys(L).map(k=>k+'='+L[k].version).join(' '));
const DAYS=H.DAYS, cl=o=>JSON.parse(JSON.stringify(o));
const STRIP=new Set(['id','created','_swapUniverse','_swapUniverseByKey']);
const js=o=>JSON.stringify(o,(k,v)=>STRIP.has(k)?undefined:v);
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const handTier=c=>{ if(!c||!c.dose) return null; const m=mins(c.dose); if(!m) return null; if(c.isNRC&&/rehearsal/i.test(c.detail||'')) return 'A'; return m>=75?'A':m>=45?'B':'C'; };
const isNrcLong=c=>!!(c&&c.isNRC&&c.dose&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''));
const isNswLong=c=>!!(c&&!c.isNRC&&c.type==='run'&&c.dose&&c.dose.key==='long');
const TARGET=/pull[- ]?through|45° back extension/i;               // the ruled names
const PT=/pull[- ]?through/i, BX=/45° back extension/i;
// hand hinge list, one term per family (independent of _D18_LEG_RX)
const HINGE=[['deadlift',/deadlift/i],['rdl/romanian',/\brdl\b|romanian/i],['good morning',/good morning/i],['hip hinge',/hinge/i],['swing',/swing/i],
 ['pull-through',/pull[- ]?through/i],['back extension',/back extension/i],['hyperextension',/hyperextension/i],['reverse hyper',/reverse hyper/i],
 ['glute-ham/GHR',/glute[- ]ham|\bghr\b/i],['hip thrust',/hip thrust/i],['glute bridge',/glute bridge|\bbridge\b/i],['nordic',/nordic/i],
 ['hip extension',/hip extension/i],['rack pull',/rack pull/i],['stiff-leg',/stiff[- ]leg/i],['jefferson',/jefferson/i],['superman',/superman/i],['kb clean/snatch',/clean|snatch/i]];
const handHinge=n=>HINGE.filter(([k,r])=>r.test(n||'')).map(([k])=>k);
const cnt={}; const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const fmtFull=day=>(day.sections||[]).map(s=>'      ['+(s.label||'')+(s.coreHeader?' / '+s.coreHeader:'')+'] '+(s.items||[]).map(i=>i.name+' {'+i.detail+'}').join(' | ')).join('\n')||'      (no sections)';
const liftSecs=day=>(day.sections||[]).filter(s=>!/taper/i.test(s.label||'')&&(s.items||[]).length);
const secKey=s=>(s.label||'')+'|'+(s.coreHeader||'');

function run(limb, list, isLong){
  const R={cfg:0,crash:{},prog:{},progTot:{},days:0,long:{},tgt:{},tgtCF:{},itemsTgt:{},itemsTgtCF:{},chg:{},chgNotB:0,chgSeg:{},cls:{},
    zeroLift:0,secDrop:0,refill:0,missV:{},missCF:{},missVdays:{},missCFdays:{},hingeItemsB:{v210:0,cf:0},tierBitems:{v210:0,cf:0},nonLongChg:0};
  const ex=[]; const exCls=new Set(); const missEx={};
  for(const x of list){ R.cfg++; let b,a;
    try{ b=L.v210.buildProgram(cl(x.c)); a=L.cf.buildProgram(cl(x.c)); }catch(e){ bump(R.crash,x.seg+' '+e.message.slice(0,80)); continue; }
    bump(R.progTot,x.seg); if(js(b)!==js(a)) bump(R.prog,x.seg);
    for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ const y=b.weeks[w]&&b.weeks[w][d], z=a.weeks[w]&&a.weeks[w][d]; if(!y) continue; R.days++;
      const c=y.cardio; const lng=isLong(c); const t=lng?handTier(c):null;
      if(t) bump(R.long,t);
      if(t){ // (1) target items on the card, every tier, both artifacts
        const its=(y.sections||[]).flatMap(s=>s.items||[]), its2=z?(z.sections||[]).flatMap(s=>s.items||[]):[];
        const hv=its.filter(i=>TARGET.test(i.name||'')), hc=its2.filter(i=>TARGET.test(i.name||''));
        if(hv.length){ bump(R.tgt,'tier '+t); bump(R.tgt,'tier '+t+' | '+x.seg); bump(R.tgt,'tier '+t+' | equip '+x.c.equipment); bump(R.tgt,'tier '+t+' | focus '+x.c.liftingFocus); bump(R.tgt,'tier '+t+' | exp '+x.c.experience);
          hv.forEach(i=>bump(R.itemsTgt,'tier '+t+' | '+i.name)); }
        if(hc.length){ bump(R.tgtCF,'tier '+t); hc.forEach(i=>bump(R.itemsTgtCF,'tier '+t+' | '+i.name)); }
        if(t==='B'){ // (4) hand hinge scan of tier B survivors
          its.forEach(i=>{ if(/stretch|mobility|foam/i.test(i.name||'')) return; R.tierBitems.v210++; const h=handHinge(i.name); if(h.length){ R.hingeItemsB.v210++; bump(R.missV,h.join('+')+' | '+i.name);} });
          its2.forEach(i=>{ if(/stretch|mobility|foam/i.test(i.name||'')) return; R.tierBitems.cf++; const h=handHinge(i.name); if(h.length){ R.hingeItemsB.cf++; const k=h.join('+')+' | '+i.name; bump(R.missCF,k); bump(R.missCFdays,k.split(' | ')[0]); if(!missEx[k]) missEx[k]=x.seg+' '+x.c.equipment+'/'+x.c.liftingFocus+'/'+x.c.experience+' seed '+x.c.seed+' W'+w+' '+d;} });
        }
      }
      if(js(y)!==js(z)){ bump(R.chg,x.seg); if(!lng) R.nonLongChg++; if(t!=='B') R.chgNotB++;
        const bk=(y.sections||[]).map(secKey), ak=(z.sections||[]).map(secKey);
        const dropSec=(y.sections||[]).filter(s=>!ak.includes(secKey(s)));
        let trimT=0,trimO=0,add=0;
        (y.sections||[]).forEach(s=>{const s2=(z.sections||[]).find(q=>secKey(q)===secKey(s)); const n2=new Set(s2?s2.items.map(i=>i.name+'{'+i.detail):[]); s.items.forEach(i=>{if(!n2.has(i.name+'{'+i.detail)){ if(TARGET.test(i.name||''))trimT++; else trimO++; }});});
        (z.sections||[]).forEach(s=>{const s1=(y.sections||[]).find(q=>secKey(q)===secKey(s)); const n1=new Set(s1?s1.items.map(i=>i.name+'{'+i.detail):[]); s.items.forEach(i=>{if(!n1.has(i.name+'{'+i.detail))add++;});});
        const zl=liftSecs(y).length>0&&liftSecs(z).length===0; if(zl) R.zeroLift++; if(dropSec.length) R.secDrop++; if(add) R.refill++;
        const titleChg=y.title!==z.title, otherKeys=Object.keys({...y,...z}).filter(k=>k!=='sections'&&js(y[k])!==js(z[k]));
        const k='tier '+t+' dropSec='+(dropSec.length?dropSec.map(s=>(s.label||'(core:'+(s.coreHeader||'')+')').replace(/\s*[—-].*$/,'')).join('+'):'none')+' rmTarget='+(trimT?'yes':'no')+' rmOther='+(trimO?'yes':'no')+' added='+(add?'yes':'no')+' zeroLift='+zl+' nonSectionKeys='+(otherKeys.join(',')||'none');
        bump(R.cls,k);
        ['tier:'+t,'seg:'+x.seg,'focus:'+x.c.liftingFocus,'equip:'+x.c.equipment,'exp:'+x.c.experience,'week:'+w+'/'+b.totalWeeks].forEach(s=>bump(R.chgSeg,s));
        if(!exCls.has(k)&&ex.length<14){ exCls.add(k); ex.push({x,w,d,t,c,y,z,k}); }
      }
    }
  }
  P('\n════ '+limb+': '+R.cfg+' configs | crashes '+JSON.stringify(R.crash)+' | days scanned '+R.days);
  P('long-run days by hand tier:',JSON.stringify(R.long));
  P('(1) long-run days carrying pull-through / 45° back extension, v210:'); Object.keys(R.tgt).sort().forEach(k=>P('   '+String(R.tgt[k]).padStart(6)+'  '+k));
  P('    items, v210:'); Object.keys(R.itemsTgt).sort().forEach(k=>P('   '+String(R.itemsTgt[k]).padStart(6)+'  '+k));
  P('    same, CF (days):',JSON.stringify(R.tgtCF),' items:',JSON.stringify(R.itemsTgtCF));
  P('(2) programs changed v210→CF by segment: '+Object.keys(R.progTot).sort().map(k=>k+' '+(R.prog[k]||0)+'/'+R.progTot[k]).join(' ; '));
  P('    day cards changed: '+Object.values(R.chg).reduce((a,b)=>a+b,0)+' | not hand-tier B: '+R.chgNotB+' | not a long run at all: '+R.nonLongChg);
  P('    changed days with a section dropped: '+R.secDrop+' | with an item ADDED (budget refill): '+R.refill+' | went from ≥1 lift section to 0: '+R.zeroLift);
  P('    class table:'); Object.entries(R.cls).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k));
  P('    segments:'); Object.keys(R.chgSeg).sort().forEach(k=>P('   '+String(R.chgSeg[k]).padStart(6)+'  '+k));
  P('(4) tier B non-stretch items on the card: v210 '+R.tierBitems.v210+' / CF '+R.tierBitems.cf+' ; hand-hinge-list hits v210 '+R.hingeItemsB.v210+' / CF '+R.hingeItemsB.cf);
  P('    v210 hand-hinge hits by family | name:'); Object.entries(R.missV).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k));
  P('    CF survivors (what _D18_LEG_RX+D153 still misses) by family | name:'); Object.entries(R.missCF).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k+'   e.g. '+missEx[k]));
  P('    example changed cards (one per class, ≤14):');
  ex.forEach(e=>{ P(`  ── ${e.x.seg} W${e.w} ${e.d} "${e.c&&e.c.subtype}" ${e.c&&e.c.dose?mins(e.c.dose).toFixed(1):'-'} min tier ${e.t} | ${e.x.c.liftingFocus}/${e.x.c.equipment}/${e.x.c.experience}/${e.x.c.ageBracket}/rest ${e.x.c.restDays.join('+')}/seed ${e.x.c.seed} | ${e.k}`);
    P('    BEFORE "'+e.y.title+'"\n'+fmtFull(e.y)); P('    AFTER  "'+e.z.title+'"\n'+fmtFull(e.z)); });
  return R;
}

// ─────────── NRC lattice (v208_d140_nrc_sweep model) ───────────
const PLANS=['run_5k','run_10k','run_half','run_marathon'];
const EXP=['beginner','intermediate','advanced'], AGE=['18-35','36-54','55+'];
const RESTS=[['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const EQ=['crossfit','commercial','home_full','home_basic','bodyweight'];
const FOC=['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const SEEDS=[76308,1234,99991,24865].slice(0,NSEEDS);
const RACED=['2026-12-06','2027-01-17','2027-03-28'];
const MILE=[['7','30'],['8','15'],['10','30'],['12','0']];
const EXTRAS=[{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
function nrcCfg(plan,o,i){
  const goals={run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}};
  const types=['run']; if(o.ex&&o.ex.bike){types.push('bike');goals.bike={id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'};}
  if(o.ex&&o.ex.swim){types.push('swim');goals.swim={id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'};}
  return Object.assign(cl(H.fixtures.HALF_MANNY),{name:'D153',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:o.a,equipment:o.q,restDays:o.r.slice(),seed:o.s});
}
const nrc=[]; let ii=0;
for(const plan of PLANS) for(const e of EXP) for(const a of AGE) for(const r of RESTS) for(const q of EQ) for(const f of FOC) for(const s of SEEDS) for(const dated of [true,false])
  nrc.push({seg:plan,c:nrcCfg(plan,{e,a,r,q,f,s,dated},ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC) for(const q of EQ) for(const r of [RESTS[0],RESTS[1]]) for(const dated of [true,false])
  nrc.push({seg:plan+' multi',c:nrcCfg(plan,{ex,e:EXP[ii%3],a:AGE[(ii>>1)%3],r,q,f,s:SEEDS[ii%SEEDS.length],dated},ii++)});
const t0=Date.now();
run('NRC lattice (4 plans × 3 exp × 3 age × 5 rest × 5 equip × 6 focus × '+SEEDS.length+' seeds × dated/undated + multi-sport)', nrc, isNrcLong);
P('elapsed s',((Date.now()-t0)/1000).toFixed(0));

// ─────────── NSW: m6b lattice verbatim + broad lattice ───────────
const STAND={name:'PRT TING',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const m6b=[];
[['run_pace_goal','8','15',['run']],['run_mile_time','8','15',['run']],['run_15_under10','8','15',['run']],['run_base','8','15',['run']],['run_pace_goal','12','0',['run']],['run_base','12','0',['run']],['run_pace_goal','8','15',['run','bike']],['run_pace_goal','8','15',['run','swim']]].forEach(([g,mm,ss,T])=>
 [24865,1001,7007].forEach(seed=>['home_full','crossfit','bodyweight','full_gym'].forEach(eq=>['balanced','hypertrophy','support_prevention'].forEach(f=>{
  const c=cl(STAND);c.cardioGoals.run.id=g;c.cardioGoals.run.mileBestMins=mm;c.cardioGoals.run.mileBestSecs=ss;c.cardioTypes=T.slice();
  if(T.includes('bike'))c.cardioGoals.bike={id:'bike_base',label:'Base',baselineDist:'10',baseline:'10mi'};
  if(T.includes('swim'))c.cardioGoals.swim={id:'swim_base',label:'Base',baselineDist:'1000',baseline:'1000m'};
  c.seed=seed;c.equipment=eq;c.liftingFocus=f;m6b.push({seg:g+'/'+mm+':'+ss+'/'+T.join('+'),c});}))));
run('NSW m6b lattice (8 goal rows × 3 seeds × 4 equip × 3 focus)', m6b, isNswLong);
const nswB=[];
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC) for(const q of EQ) for(const r of RESTS) for(const e of EXP) for(const seed of [24865,1001]){
  const c=cl(STAND); c.cardioGoals.run.id=g; c.cardioGoals.run.mileBestMins=mm[0]; c.cardioGoals.run.mileBestSecs=mm[1]; c.liftingFocus=f; c.equipment=q; c.restDays=r.slice(); c.experience=e; c.seed=seed; nswB.push({seg:g+'/'+mm.join(':'),c}); }
run('NSW broad lattice (4 goals × 2 mile bests × 6 focus × 5 equip × 5 rest × 3 exp × 2 seeds)', nswB, isNswLong);

// ─────────── HALF_MANNY, three arms (g199/g200 method) ───────────
P('\n════ HALF_MANNY');
const G=fs.readFileSync(path.join(__dirname,'..','gates','g199_deload_arbitration.js'),'utf8');
const A_PIPE=eval(G.match(/const A_PIPE=(".*");/)[1]);
const A_PIPE_R=eval('['+G.match(/const A_PIPE_R=\[([\s\S]*?)\]\.join\("\\n"\);/)[1]+'].join("\\n")');
const SNAP_FN=eval(G.match(/const SNAP_FN=("[\s\S]*?");\nfunction instrument/)[1]);
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const HM=()=>cl(H.fixtures.HALF_MANNY);
for(const k of ['v210','cf']){
  const src=fs.readFileSync(ART[k],'utf8');
  const shipped=H.progDigest(L[k].buildProgram(HM())), again=H.progDigest(L[k].buildProgram(HM()));
  const ipf=path.join(S,'d153_instr_'+k+'.html'); try{fs.unlinkSync(ipf);}catch(e){} fs.writeFileSync(ipf,src.replace(A_PIPE,()=>A_PIPE_R));
  const IP=H.load(ipf); IP.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;"); const on=H.progDigest(IP.buildProgram(HM())); IP.eval("globalThis.__DELOAD_OFF=true;"); const off=H.progDigest(IP.buildProgram(HM()));
  const cpf=path.join(S,'d153_coreoff_'+k+'.html'); try{fs.unlinkSync(cpf);}catch(e){} fs.writeFileSync(cpf,src.replace(CLAUSE,''));
  const core=H.progDigest(H.load(cpf).buildProgram(HM()));
  P(`${k.padEnd(5)} shipped ${shipped} (self ${again===shipped?'==':'!='}) | A_PIPE count ${src.split(A_PIPE).length-1}, instrumented ON ${on} | DELOAD_OFF ${off} | CLAUSE count ${src.split(CLAUSE).length-1}, CORE_OFF ${core}`);
}
P('expected (task brief): shipped 0ac7da6b1691a8e1 / deload-off 1069cd7f86eed204 / core-off 9d14801a63111081');
P('era rows: '+[207,208,209,210].map(v=>v+': '+H.MANNY_DIGEST_BY_VERSION[v]+'/'+(H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION||{})[v]+'/'+(H.MANNY_CORE_OFF_DIGEST_BY_VERSION||{})[v]).join(' ; '));
{ const b=L.v210.buildProgram(HM()), a=L.cf.buildProgram(HM()); let nch=0;
  for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ const y=b.weeks[w][d], z=a.weeks[w][d]; if(!y) continue; const c=y.cardio; const t=isNrcLong(c)?handTier(c):null;
    if(t) P(`  HM W${w} ${d} "${c.subtype}" ${mins(c.dose).toFixed(1)} min hand tier ${t} | target items ${(y.sections||[]).flatMap(s=>s.items||[]).filter(i=>TARGET.test(i.name||'')).map(i=>i.name).join(',')||'none'}`);
    if(js(y)!==js(z)){ nch++; P(`  CHANGED W${w} ${d}\n    BEFORE\n`+fmtFull(y)+'\n    AFTER\n'+fmtFull(z)); } }
  P('HALF_MANNY day cards changed v210→CF:',nch,'/ program days', b.totalWeeks*7); }
P('\nDONE');
