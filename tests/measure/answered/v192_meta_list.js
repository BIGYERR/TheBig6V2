// tests/measure/v192_meta_list.js — MODE B before-picture for the six-movement list
// Mario handed the session off a screenshot (V191 / ia-version 191).
//
// Question on the table: do these six movements already exist in the pool universe, and
// where would they sit relative to support_strength / support_athletic / support_prevention?
// This script RULES ON NOTHING. It prints coverage, equipment reachability, the current
// Athletic-Support power-block behaviour across a lattice, the classifier verdicts each
// candidate NAME would get from the existing filters, and the reader list per pool.
//
// Oracles (independent of the functions under measurement):
//   A — the name universe is HARVESTED (EXLIB + CORE_PILLARS + RAND_POOLS + every item name
//       actually printed across the lattice). Coverage probes are regexes over that harvest,
//       not over any classifier's opinion.
//   B — the three _gearOK clauses are RE-EXECUTED from the literal source text of
//       index.html (sliced by line), so the gate measured is the gate that ships.
//   C — power-block presence is counted off the BUILT program's section labels, not off
//       any predicate inside engineC.
//   D — every classifier is called directly with the candidate string; expected values are
//       read off the authoring contract in the comments beside each table.
//
// Usage:  node tests/measure/v192_meta_list.js [A|B|C|D|E|all]
'use strict';
const path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
const {load,fixtures}=require(path.join(ROOT,'tests','harness.js'));
const IA=load(path.join(ROOT,'index.html'));
const SRC=IA.html.split('\n');
const want=(process.argv[2]||'all').toUpperCase();
const on=p=>want==='ALL'||want===p;
const E=n=>{try{return IA.eval(n);}catch(e){return undefined;}};

// ─── the six candidates, verbatim-ish literals (both spellings Mario gave) ───
const CAND=[
  {id:'1a',name:'Zercher Cossack squat',            grp:1},
  {id:'1b',name:'Lateral Zercher squat',            grp:1},
  {id:'2a',name:'Landmine rotational press',        grp:2},
  {id:'2b',name:'Landmine 360 twist',               grp:2},
  {id:'3a',name:'Band-resisted sprint start',       grp:3},
  {id:'3b',name:'Band-resisted broad jump',         grp:3},
  {id:'4a',name:'Heavy rotational bag carry',       grp:4},
  {id:'4b',name:'Barrel wrestle twist',             grp:4},
  {id:'5', name:'Glute-bridge dumbbell floor press',grp:5},
  {id:'6a',name:'Wide-stance Zercher squat',        grp:6},
  {id:'6b',name:'Zercher hold squat',               grp:6},
];

// ════════════════════════════════════════════════════════════════════════════
// LATTICE (shared by A's harvest and C's counts)
// ════════════════════════════════════════════════════════════════════════════
const FOCUS=['support_athletic','support_strength','support_prevention'];
const EQUIP=['bodyweight','home_basic','home_full','commercial','crossfit'];
const EXP=['beginner','intermediate','advanced'];
const AGE=['18-35','36-54','55+'];
const INJ=[null,{region:'knee',tier:'workaround'},{region:'knee',tier:'protect'},{region:'lowback',tier:'protect'}];
const REST=[['sun'],['sun','wed'],['sun','wed','fri']];
const SEEDS=[76308,11111];
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];

function mkcfg(profile,focus,equip,exp,age,inj,rest,seed){
  const base={
    name:'MEASURE', experience:exp, ageBracket:age, equipment:equip, unit:'lbs',
    liftingFocus:focus, restDays:rest.slice(), days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed:seed,
  };
  if(inj) base.injury={region:inj.region,tier:inj.tier};
  if(profile==='race'){
    Object.assign(base,{primaryPath:'event',cardioTypes:['run'],eventTargeted:true,raceDate:'2026-12-06',
      cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}});
  } else {
    Object.assign(base,{primaryPath:'event',cardioTypes:['run'],eventTargeted:false,
      cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}});
  }
  return base;
}

const POWER_LABEL=/^power\b/i;                 // the two explosive-lead blocks: 'Power — explosive first' / 'Power — lower explosive'
const FULLBODY_LABELS=new Set(['Power — explosive first','Power — lower explosive','Lower strength','Hip extension + push']);

const _longRunTier=E('_longRunTier');
const universe=new Map();     // name -> count of appearances across the lattice
const perTier={};             // equip -> Map(name -> count of printed items)
function seeName(n){ if(!n) return; universe.set(n,(universe.get(n)||0)+1); }
function seeTier(equip,n){ if(!n) return; (perTier[equip]=perTier[equip]||new Map()); perTier[equip].set(n,(perTier[equip].get(n)||0)+1); }

const stats={
  builds:0, crashes:0, trainDays:0, fullDays:0, powerSections:0, powerItems:0,
  byFocus:{}, drawByFocus:{}, fullByFocus:{}, powerByEquip:{}, powerByExpAge:{}, powerByInj:{},
  fullByInj:{}, fullByEquip:{}, noPowerReason:{}, xFocusInj:{}, xFocusEquip:{},
};
function bump(o,k){ o[k]=(o[k]||0)+1; }

function runLattice(){
  const t0=Date.now();
  ['race','base'].forEach(profile=>{
  FOCUS.forEach(focus=>{ EQUIP.forEach(equip=>{ EXP.forEach(exp=>{ AGE.forEach(age=>{
  INJ.forEach(inj=>{ REST.forEach(rest=>{ SEEDS.forEach(seed=>{
    const cfg=mkcfg(profile,focus,equip,exp,age,inj,rest,seed);
    let prog;
    try{ prog=IA.buildProgram(cfg); }catch(e){ stats.crashes++; return; }
    stats.builds++;
    const injK=inj?inj.region+'/'+inj.tier:'none';
    const fk=focus;
    stats.byFocus[fk]=stats.byFocus[fk]||{builds:0,trainDays:0,fullDays:0,powerSections:0,fullWithPower:0};
    stats.byFocus[fk].builds++;
    stats.drawByFocus[fk]=stats.drawByFocus[fk]||{};
    const wk=prog.weeks||{};
    Object.keys(wk).forEach(w=>Object.keys(wk[w]).forEach(d=>{
      const day=wk[w][d]; if(!day||day.rest) return;
      stats.trainDays++; stats.byFocus[fk].trainDays++;
      let isFull=false, hasPower=false;
      (day.sections||[]).forEach(s=>{
        const lab=s.label||'';
        if(FULLBODY_LABELS.has(lab)) isFull=true;
        (s.items||[]).forEach(it=>{ seeName(it.name); seeTier(equip,it.name); });
        if(POWER_LABEL.test(lab)){
          hasPower=true; stats.powerSections++; stats.byFocus[fk].powerSections++;
          (s.items||[]).forEach(it=>{ stats.powerItems++; bump(stats.drawByFocus[fk],it.name);
            stats.pwDetail=stats.pwDetail||{}; bump(stats.pwDetail,it.name+'  ::  '+it.detail); });
          stats.pwSize=stats.pwSize||{}; bump(stats.pwSize,fk+' | '+((s.items||[]).length)+' item(s)');
          bump(stats.powerByEquip,equip); bump(stats.powerByExpAge,exp+'/'+age); bump(stats.powerByInj,injK);
        }
      });
      if(day.title==='Full Body') isFull=true;
      if(isFull){
        stats.fullDays++; stats.byFocus[fk].fullDays++;
        bump(stats.fullByInj,injK); bump(stats.fullByEquip,equip);
        bump(stats.xFocusInj,fk+' | '+injK+' | full');
        bump(stats.xFocusEquip,fk+' | '+equip+' | full');
        if(hasPower){
          stats.byFocus[fk].fullWithPower++;
          bump(stats.xFocusInj,fk+' | '+injK+' | power');
          bump(stats.xFocusEquip,fk+' | '+equip+' | power');
        } else {
          // WHY no power block on a full-body day. Reasons are read off the config and the
          // day, never off engineC's own predicate.
          const lead=(focus==='support_athletic'||equip==='crossfit');
          const lrt=(typeof _longRunTier==='function')?_longRunTier(day.cardio):null;
          let why;
          if(!lead) why='no explosiveLead (focus!=athletic and equip!=crossfit)';
          else if(inj&&inj.tier==='protect') why='injury protect -> _powerAllowed false for every cost';
          else if(inj&&inj.tier==='workaround'&&equip==='bodyweight') why='workaround + bodyweight pool has no 0.5-cost member -> _powerBlocked';
          else if(focus==='support_prevention'&&equip==='bodyweight') why='prevention filter keeps only Kettlebell swing; bodyweight pool has none';
          else if(lrt==='A'||lrt==='B') why='NRC long-run day tier '+lrt+' (d18LongRunDayPass strips /power/i sections)';
          else why='other';
          bump(stats.noPowerReason,why);
          if(why==='other'){ stats.otherDetail=stats.otherDetail||{}; bump(stats.otherDetail,
            [profile,focus,equip,exp,age,injK,'title='+(day.title||''),'cardio='+((day.cardio&&day.cardio.subtype)||'none'),'labels='+(day.sections||[]).map(x=>x.label).join('/')].join(' | ')); }
        }
      }
    }));
  });});});});});});});
  });
  stats.ms=Date.now()-t0;
}

// ════════════════════════════════════════════════════════════════════════════
function hdr(t){ console.log('\n'+'='.repeat(78)+'\n'+t+'\n'+'='.repeat(78)); }

// ─── A. COVERAGE ────────────────────────────────────────────────────────────
function staticNames(){
  const out=new Set();
  const EX=IA.EXLIB||{};
  Object.keys(EX).forEach(k=>(EX[k]||[]).forEach(n=>out.add(n)));
  const CP=E('CORE_PILLARS')||{};
  Object.keys(CP).forEach(k=>{
    const p=CP[k];
    ['items','static','loaded'].forEach(f=>(p[f]||[]).forEach(o=>out.add(o.name)));
  });
  const RP=IA.RAND_POOLS||{};
  Object.keys(RP).forEach(g=>(RP[g]||[]).forEach(w=>(w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>out.add(i.name)))));
  // powerPool + every other pool literal lives inside the engineC closure; harvest the
  // string literals out of the source text of that block so nothing is missed statically.
  const blk=SRC.slice(7300,7345).join('\n');
  (blk.match(/'[^']{3,60}'/g)||[]).forEach(s=>out.add(s.slice(1,-1)));
  return out;
}

const PROBES={
  'loaded LATERAL / frontal-plane squat': /cossack|lateral squat|side squat|lateral lunge|side lunge|skater squat|frontal plane|adductor/i,
  'ANY lateral / frontal-plane movement': /\blateral\b|cossack|frontal|adduct|abduct|side step|side-lying|side plank|skater/i,
  'loaded ROTATIONAL PRESS': /(rotat|twist|chop|360)[^,]{0,20}press|press[^,]{0,20}(rotat|twist|chop)/i,
  'ANY rotation-named movement': /rotat|twist|chop|wiper|russian|90\/90|thread the needle/i,
  'landmine (any)': /landmine/i,
  'zercher (any)': /zercher/i,
  'resisted acceleration / sprint drill': /sprint|accelerat|\bresisted\b|\bsled\b|prowler|\btowing\b|hill repeat|falling start|wall drill/i,
  'odd-object / rotational carry (bag, barrel, sandbag, keg, stone, yoke)': /sandbag|\bbag\b|barrel|\bkeg\b|yoke|\bstone\b|odd.?object|zercher carry|bear hug/i,
  'ANY carry': /\bcarry\b|farmer/i,
  'floor press / hip-bridged press': /floor press|bridge[^,]{0,12}press|press[^,]{0,12}bridge/i,
  'ANY hip-bridge / thrust movement': /glute bridge|hip thrust/i,
  'partner-dependent': /partner/i,
  'band-named': /\bband/i,
  'broad jump / horizontal plyo': /broad jump|bound|skater|standing long/i,
};

function tok(s){ return String(s).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!['the','and','with'].includes(w)); }
function jac(a,b){ const A=new Set(tok(a)),B=new Set(tok(b)); let i=0; A.forEach(x=>{if(B.has(x))i++;}); return i/(new Set([...A,...B]).size); }

function partA(){
  hdr('A. COVERAGE — what already exists');
  const stat=staticNames();
  const all=new Set([...stat,...universe.keys()]);
  console.log(`name universe: ${stat.size} static (EXLIB + CORE_PILLARS + RAND_POOLS + engineC pool literals) `+
              `∪ ${universe.size} harvested from ${stats.builds} lattice builds = ${all.size} distinct names`);
  const A=[...all].sort();
  console.log('\n-- coverage probes (denominator = '+A.length+' distinct movement names) --');
  Object.keys(PROBES).forEach(k=>{
    const hits=A.filter(n=>PROBES[k].test(n));
    console.log(`  ${String(hits.length).padStart(3)}/${A.length}  ${k}`);
    console.log('        '+(hits.length?hits.join(' | '):'** NOTHING **'));
  });
  // Second, wider net: the RAW SOURCE TEXT of index.html, comments stripped, so a probe that
  // finds nothing in the harvested universe cannot be hiding behind a harvest gap.
  console.log('\n-- same probes over the raw source text of index.html, comments stripped (denominator '+SRC.length+' lines) --');
  const bare=SRC.map(l=>l.replace(/\/\/.*$/,'')).map((l,i)=>({i:i+1,l}));
  Object.keys(PROBES).forEach(k=>{
    const hits=bare.filter(x=>PROBES[k].test(x.l));
    console.log(`  ${String(hits.length).padStart(3)} line(s)  ${k}`);
    if(hits.length&&hits.length<=8) hits.forEach(h=>console.log('        '+h.i+': '+h.l.trim().slice(0,140)));
    else if(hits.length) console.log('        lines: '+hits.map(h=>h.i).join(', '));
  });
  console.log('\n-- nearest existing name per candidate (token Jaccard over the universe) --');
  CAND.forEach(c=>{
    const ranked=A.map(n=>({n,s:jac(c.name,n)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,4);
    console.log(`  [${c.id}] ${c.name}`);
    console.log('        '+(ranked.length?ranked.map(r=>`${r.n} (${r.s.toFixed(2)})`).join(' | '):'** no token overlap with ANY name in the universe **'));
    console.log('        exact-name present in universe: '+(all.has(c.name)?'YES':'no'));
  });
}

// ─── B. EQUIPMENT REACHABILITY ──────────────────────────────────────────────
// The three _gearOK clauses, re-executed from the LITERAL source lines of index.html.
function gearOKFactory(){
  const lines=[];
  for(let i=7195;i<7232;i++){ const L=SRC[i]; if(/^\s*if\(!has/.test(L)) lines.push({ln:i+1,txt:L.trim()}); }
  const body=lines.map(l=>l.txt).join('\n');
  const fn=new Function('N','hasBarbell','hasCables','hasDumbbells','\n'+body+'\nreturn true;');
  return {fn,lines};
}
function partB(){
  hdr('B. EQUIPMENT REACHABILITY');
  const {fn,lines}=gearOKFactory();
  console.log('_gearOK clauses re-executed verbatim from index.html:');
  lines.forEach(l=>console.log('  '+l.ln+': '+l.txt.slice(0,190)));
  const tiers=EQUIP.map(e=>({e,
    isCrossfit:e==='crossfit',
    hasBarbell:e==='home_full'||e==='commercial'||e==='crossfit',
    hasCables:e==='commercial',
    hasDumbbells:e!=='bodyweight',
    hasRack:e==='home_full'||e==='commercial'||e==='crossfit',
    isBW:e==='bodyweight'}));
  console.log('\ntier truths (index.html:7172-7179, 7237, 7309):');
  tiers.forEach(t=>console.log(`  ${t.e.padEnd(11)} barbell=${t.hasBarbell?1:0} rack=${t.hasRack?1:0} cables=${t.hasCables?1:0} dumbbells=${t.hasDumbbells?1:0} crossfit=${t.isCrossfit?1:0} isBW=${t.isBW?1:0}`));
  const auxGearOK=E('_auxGearOK'), BWG=E('_BW_GEAR'), anyEq=E('anyEquip');
  console.log('\nper candidate: _gearOK verdict by tier | _auxGearOK by tier | _BW_GEAR match | anyEquip');
  CAND.forEach(c=>{
    const g=tiers.map(t=>`${t.e}:${fn(c.name,t.hasBarbell,t.hasCables,t.hasDumbbells)?'PASS':'BLOCK'}`).join(' ');
    const a=tiers.map(t=>`${t.e}:${auxGearOK(c.name,t.e)?'PASS':'BLOCK'}`).join(' ');
    console.log(`  [${c.id}] ${c.name}`);
    console.log('        _gearOK    '+g);
    console.log('        _auxGearOK '+a);
    console.log('        _BW_GEAR.test='+BWG.test(c.name)+'   anyEquip='+anyEq(c.name)+'   _stationClass='+IA._stationClass(c.name));
  });
  console.log('\n-- is a landmine its own gate? --');
  const lm=SRC.map((l,i)=>({i:i+1,l})).filter(x=>/landmine/i.test(x.l));
  lm.forEach(x=>console.log('  '+x.i+': '+x.l.trim().slice(0,170)));
  console.log('  hasLandmine identifiers in file: '+(IA.js.match(/hasLandmine|LANDMINE/g)||[]).length);
  console.log('\n-- odd objects modelled as equipment? (sandbag/bag/barrel/keg/yoke/stone/sled) --');
  ['sandbag','barrel','\\bkeg\\b','yoke','odd object','heavy bag','sled','prowler'].forEach(t=>{
    const rx=new RegExp(t,'i');
    const hits=SRC.map((l,i)=>({i:i+1,l})).filter(x=>rx.test(x.l));
    console.log(`  /${t}/i  ->  ${hits.length} source line(s)`+(hits.length?': '+hits.map(h=>h.i).join(',') :''));
    hits.slice(0,3).forEach(h=>console.log('        '+h.i+': '+h.l.trim().slice(0,150)));
  });
  console.log('\n-- bands modelled? --');
  const bandNames=[...new Set([...staticNames(),...universe.keys()])].filter(n=>/\bband/i.test(n)).sort();
  console.log('  band-named movements in the universe ('+bandNames.length+'): '+bandNames.join(' | '));
  console.log('  wizard equipment tiers that mention a band: (grep of the equipment picker copy)');
  SRC.map((l,i)=>({i:i+1,l})).filter(x=>/band/i.test(x.l)&&/equip|Room only|home_basic|home_full|crossfit|commercial/i.test(x.l)).slice(0,8).forEach(x=>console.log('        '+x.i+': '+x.l.trim().slice(0,160)));
  console.log('\n-- does any pool assume a PARTNER? --');
  const pa=SRC.map((l,i)=>({i:i+1,l})).filter(x=>/partner/i.test(x.l));
  pa.forEach(x=>console.log('  '+x.i+': '+x.l.trim().slice(0,170)));
  console.log('  BW_QUALIFIER contains "(partner": '+String(IA.js.includes("'(partner'")));
}

// ─── C. THE ATHLETIC SUPPORT PATH ───────────────────────────────────────────
function partC(){
  hdr('C. WHERE THE SUPPORT PATHS PUT POWER WORK TODAY');
  console.log(`lattice: 2 cardio profiles (NRC half / NSW base) × ${FOCUS.length} focuses × ${EQUIP.length} equipment × ${EXP.length} experience × ${AGE.length} age × ${INJ.length} injury × ${REST.length} rest patterns × ${SEEDS.length} seeds`);
  console.log(`         = ${stats.builds} builds (${stats.crashes} crashes) in ${stats.ms} ms; ${stats.trainDays} training days; ${stats.fullDays} full-body days`);
  console.log('\nassembly of the full-body day (index.html:8019-8073), read from source:');
  [7348,7349,7350,8030,8031,8039,8043,8044,8058,8059,8062,8066,8067,8068,8069].forEach(n=>{
    const L=SRC[n]; if(L!==undefined) console.log('  '+(n+1)+': '+L.trim().slice(0,175));
  });
  console.log('\nper-focus summary (denominator in parentheses):');
  Object.keys(stats.byFocus).forEach(f=>{
    const s=stats.byFocus[f];
    const pct=(a,b)=>b?((a/b)*100).toFixed(1)+'%':'n/a';
    console.log(`  ${f.padEnd(20)} builds=${s.builds}  trainDays=${s.trainDays}  fullBodyDays=${s.fullDays}  powerSections=${s.powerSections}`);
    console.log(`  ${''.padEnd(20)} power block present on ${s.fullWithPower}/${s.fullDays} full-body days (${pct(s.fullWithPower,s.fullDays)}) and ${s.powerSections}/${s.trainDays} training days (${pct(s.powerSections,s.trainDays)})`);
    const dr=stats.drawByFocus[f]||{}; const tot=Object.values(dr).reduce((a,b)=>a+b,0);
    const rows=Object.keys(dr).sort((a,b)=>dr[b]-dr[a]);
    if(!rows.length){ console.log(`  ${''.padEnd(20)} draws: NONE (0 power items)`); return; }
    console.log(`  ${''.padEnd(20)} draws (denominator ${tot} power items):`);
    rows.forEach(n=>console.log(`  ${''.padEnd(22)}${String(dr[n]).padStart(6)}  ${((dr[n]/tot)*100).toFixed(1).padStart(5)}%  ${n}`));
  });
  console.log('\npower block SIZE (slots actually filled; pwRoles is a 2-slot literal, index.html:8040/8067):');
  Object.keys(stats.pwSize||{}).sort().forEach(k=>console.log(`  ${k.padEnd(40)} ${String(stats.pwSize[k]).padStart(6)}`));
  console.log('\ntop 12 distinct power prescriptions actually printed (denominator '+stats.powerItems+' power items):');
  Object.keys(stats.pwDetail||{}).sort((a,b)=>stats.pwDetail[b]-stats.pwDetail[a]).slice(0,12)
    .forEach(k=>console.log(`  ${String(stats.pwDetail[k]).padStart(6)}  ${k}`));
  console.log('\npower sections by equipment tier (denominator '+stats.powerSections+' power sections):');
  EQUIP.forEach(e=>console.log(`  ${e.padEnd(12)} ${String(stats.powerByEquip[e]||0).padStart(6)}`));
  console.log('\npower sections by experience/age (min(exp,age) cost cap, _POWER_MAX_COST × _POWER_AGE_MAX_COST):');
  Object.keys(stats.powerByExpAge).sort().forEach(k=>console.log(`  ${k.padEnd(22)} ${String(stats.powerByExpAge[k]).padStart(6)}`));
  console.log('\npower sections by injury (and full-body-day denominator for the same injury):');
  Object.keys(stats.fullByInj).sort().forEach(k=>console.log(`  ${k.padEnd(22)} power=${String(stats.powerByInj[k]||0).padStart(6)}  fullBodyDays=${String(stats.fullByInj[k]).padStart(6)}`));
  console.log('\nfull-body days by equipment (denominator for the equipment row above):');
  EQUIP.forEach(e=>console.log(`  ${e.padEnd(12)} fullBodyDays=${String(stats.fullByEquip[e]||0).padStart(6)}  power=${String(stats.powerByEquip[e]||0).padStart(6)}`));
  console.log('\nfocus x injury  (full-body days / with power):');
  Object.keys(stats.xFocusInj).filter(k=>/\| full$/.test(k)).sort().forEach(k=>{
    const base=k.replace(/ \| full$/,'');
    console.log(`  ${base.padEnd(44)} ${String(stats.xFocusInj[k]).padStart(6)} full  ${String(stats.xFocusInj[base+' | power']||0).padStart(6)} with power`);
  });
  console.log('\nfocus x equipment  (full-body days / with power):');
  Object.keys(stats.xFocusEquip).filter(k=>/\| full$/.test(k)).sort().forEach(k=>{
    const base=k.replace(/ \| full$/,'');
    console.log(`  ${base.padEnd(44)} ${String(stats.xFocusEquip[k]).padStart(6)} full  ${String(stats.xFocusEquip[base+' | power']||0).padStart(6)} with power`);
  });
  const nptot=Object.values(stats.noPowerReason).reduce((a,b)=>a+b,0);
  console.log('\nWHY a full-body day carries no power block (denominator '+nptot+' full-body days with no Power section):');
  Object.keys(stats.noPowerReason).sort((a,b)=>stats.noPowerReason[b]-stats.noPowerReason[a]).forEach(k=>
    console.log(`  ${String(stats.noPowerReason[k]).padStart(6)}  ${((stats.noPowerReason[k]/nptot)*100).toFixed(1).padStart(5)}%  ${k}`));
  if(stats.otherDetail){
    console.log('\n  the "other" bucket, top 12 config signatures:');
    Object.keys(stats.otherDetail).sort((a,b)=>stats.otherDetail[b]-stats.otherDetail[a]).slice(0,12)
      .forEach(k=>console.log(`    ${String(stats.otherDetail[k]).padStart(5)}  ${k.slice(0,200)}`));
  }
}

// ─── D. THE FILTERS A NEW NAME WOULD HIT ────────────────────────────────────
function partD(){
  hdr('D. WHAT THE EXISTING FILTERS DO WITH EACH CANDIDATE NAME');
  const _powerCost=E('_powerCost'), _isPower=E('_isPower'), _bwFallback=E('_bwFallback'),
        _BW_SUBS=E('_BW_SUBS'), _BW_GEAR=E('_BW_GEAR'), _BW_KEEP_FIXED=E('_BW_KEEP_FIXED'),
        _PATTERN_REGION=E('_PATTERN_REGION'), _D18_LEG_RX=E('_D18_LEG_RX'),
        isTrackableWeight=E('isTrackableWeight'), isTimeExercise=E('isTimeExercise'),
        isRepExercise=E('isRepExercise'), _isCompound=E('_isCompound'), _powerAllowed=E('_powerAllowed'),
        _auxFamily=E('_auxFamily'), _compoundTier=E('_compoundTier');
  const REGIONS=['shoulder','elbow','lowback','hip','knee','ankle'];
  CAND.forEach(c=>{
    const n=c.name;
    const pat=IA._pattern(n);
    const cost=_powerCost(n);
    console.log(`\n[${c.id}] "${n}"`);
    console.log(`   _pattern            = ${JSON.stringify(pat)}   -> _PATTERN_REGION = ${JSON.stringify(_PATTERN_REGION[pat]||null)}  (REGION_MOVE_CAP ${JSON.stringify(E('REGION_MOVE_CAP'))})`);
    console.log(`   _powerCost/_isPower = ${cost} / ${_isPower(n)}${cost?'':'   << cost 0 = "not power work"; _powerAllowed returns true unconditionally'}`);
    if(cost){
      const rows=[];
      EXP.forEach(x=>AGE.forEach(a=>rows.push(`${x[0]}${a}:${_powerAllowed(n,x,null,a)?'Y':'n'}`)));
      console.log(`   _powerAllowed(exp,age, no injury) = ${rows.join(' ')}`);
    }
    console.log(`   _stationClass       = ${IA._stationClass(n)}`);
    console.log(`   REP_AFFINITY        = ${JSON.stringify(IA.REP_AFFINITY[n]||null)}   EX_MIN_EXP = ${JSON.stringify(E('EX_MIN_EXP')[n]||null)}`);
    console.log(`   _repFloor           = ${JSON.stringify(IA._repFloor(n))}`);
    console.log(`   _auxFamily          = ${JSON.stringify(_auxFamily(n))}   (null = no like-for-like swap universe)`);
    console.log(`   _carryRx('3×40 yards',name,'') = ${JSON.stringify(IA._carryRx('3×40 yards',n,''))}`);
    console.log(`   _BW_GEAR match=${_BW_GEAR.test(n)}  _BW_SUBS entry=${JSON.stringify(_BW_SUBS[n]||null)}  _bwFallback -> ${JSON.stringify(_bwFallback(n))}  _BW_KEEP_FIXED=${_BW_KEEP_FIXED.test(n)}`);
    console.log(`   log form: isTrackableWeight=${isTrackableWeight(n)} isTimeExercise=${isTimeExercise(n)} isRepExercise=${isRepExercise(n)} _isCompound=${_isCompound(n)} _compoundTier=${_compoundTier?_compoundTier(n):'n/a'}`);
    console.log(`   _D18_LEG_RX (NRC long-run tier B strip) = ${_D18_LEG_RX.test(n)}`);
    // applyInjuryFilter, one item in one section, every region × tier
    const verdicts=[];
    REGIONS.forEach(r=>['workaround','protect'].forEach(t=>{
      const secs=[{label:'Probe',items:[{name:n,detail:'4×6'}]}];
      const out=IA.applyInjuryFilter(secs,{injury:{region:r,tier:t}});
      const kept=(out[0]&&out[0].items&&out[0].items[0])||null;
      verdicts.push(`${r}/${t[0]}:${!kept?'DROP':(kept.name!==n?'SWAP->'+kept.name:(kept.detail!=='4×6'?'CAP':'keep'))}`);
    }));
    console.log('   applyInjuryFilter   = '+verdicts.join('  '));
  });
  console.log('\n-- mis-classification probes named in the brief --');
  const probe=(label,val)=>console.log('  '+label.padEnd(66)+val);
  probe('"Landmine rotational press" _pattern (does "press" score push volume?)', JSON.stringify(IA._pattern('Landmine rotational press')));
  probe('  ... "rotation" core-exempt rule at index.html:8243 fires first?', String(/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation|curl-up/.test('landmine rotational press')));
  probe('"Heavy rotational bag carry" _carryRx prints "each"?', JSON.stringify(IA._carryRx('3×40 yards','Heavy rotational bag carry','')));
  probe('  ... _CARRY_PER_SIDE has the name?', String(!!E('_CARRY_PER_SIDE')['Heavy rotational bag carry']));
  probe('"Zercher Cossack squat" _pattern -> REGION_MOVE_CAP bucket', JSON.stringify(IA._pattern('Zercher Cossack squat'))+' -> '+JSON.stringify(E('_PATTERN_REGION')[IA._pattern('Zercher Cossack squat')]||null));
  probe('"Glute-bridge dumbbell floor press" _pattern', JSON.stringify(IA._pattern('Glute-bridge dumbbell floor press')));
  probe('"Band-resisted sprint start" _pattern', JSON.stringify(IA._pattern('Band-resisted sprint start')));
  probe('"Band-resisted broad jump" _powerCost', String(E('_powerCost')('Band-resisted broad jump')));
  probe('"Barrel wrestle twist" _pattern', JSON.stringify(IA._pattern('Barrel wrestle twist')));
}

// ─── E. BLAST RADIUS ────────────────────────────────────────────────────────
function partE(){
  hdr('E. BLAST RADIUS — readers of every pool a new name would have to enter');
  const POOLS=[
    ['EXLIB.squat',/EXLIB\.squat\b/],
    ['EXLIB.squat_joint',/EXLIB\.squat_joint/],
    ['EXLIB.lunge',/EXLIB\.lunge\b/],
    ['EXLIB.hinge',/EXLIB\.hinge\b/],
    ['EXLIB.shoulder',/EXLIB\.shoulder\b/],
    ['EXLIB.core',/EXLIB\.core\b/],
    ['EXLIB.carry',/EXLIB\.carry\b/],
    ['EXLIB.conditioning',/EXLIB\.conditioning\b/],
    ['EXLIB.chest_compound',/EXLIB\.chest_compound/],
    ['EXLIB.chest_acc',/EXLIB\.chest_acc\b/],
    ['CORE_PILLARS',/CORE_PILLARS/],
    ['CORE_PILLARS.rotational_power',/rotational_power/],
    ['powerPool',/powerPool/],
    ['_powerLegal',/_powerLegal/],
    ['_POWER_COST / _powerCost',/_POWER_COST|_powerCost/],
    ['_powerAllowed',/_powerAllowed/],
    ['_AUX_FAMILY',/_AUX_FAMILY/],
    ['_AUX_GEAR',/_AUX_GEAR\b/],
    ['REP_AFFINITY',/REP_AFFINITY/],
    ['EX_MIN_EXP',/EX_MIN_EXP/],
    ['_CARRY_PER_SIDE',/_CARRY_PER_SIDE/],
    ['_BW_SUBS',/_BW_SUBS/],
    ['_BW_GEAR',/_BW_GEAR/],
    ['_stationClass',/_stationClass/],
    ['_pattern(',/_pattern\(/],
    ['EX_KEY_ALIAS',/EX_KEY_ALIAS/],
    ['EX_RENAMED_V113',/EX_RENAMED_V113/],
    ['RAND_POOLS',/RAND_POOLS/],
    ['_repFloor',/_repFloor/],
    ['EQUIP_TOKENS',/EQUIP_TOKENS/],
    // the LOCAL each EXLIB pool is read into inside engineC — the real reader count
    ['  -> squatPool',/\bsquatPool\b/],
    ['  -> lungePool',/\blungePool\b/],
    ['  -> hingePool',/\bhingePool\b/],
    ['  -> hipExtPool / hipExtBW',/\bhipExtPool\b|\bhipExtBW\b/],
    ['  -> chestCompoundPool',/\bchestCompoundPool\b/],
    ['  -> rowPool / backCompoundPool',/\browPool\b|\bbackCompoundPool\b/],
    ['  -> shoulderAccPool',/\bshoulderAccPool\b/],
    ['  -> fullPushPool / fullPullPool',/\bfullPushPool\b|\bfullPullPool\b/],
    ['  -> ex.carry',/ex\.carry|carrySel|\bcarryPool\b/],
    ['  -> ex.cond',/ex\.cond\b/],
    ['  -> getDynamicCoreBlock',/getDynamicCoreBlock/],
    ['  -> bodyweightSweep',/bodyweightSweep/],
    ['  -> applyInjuryFilter',/applyInjuryFilter/],
    ['  -> capRegionalFatigue',/capRegionalFatigue/],
    ['  -> capSessionBudget',/capSessionBudget/],
    ['  -> swapCandidates / auxSwapCandidates / addCandidates',/swapCandidates|addCandidates/],
    ['  -> exStoreKey',/exStoreKey/],
    ['  -> d18LongRunDayPass / _D18_LEG_RX',/d18LongRunDayPass|_D18_LEG_RX/],
    ['  -> raceEveLiftPass',/raceEveLiftPass/],
    ['  -> deconflictAdjacentDupes',/deconflictAdjacentDupes/],
    ['  -> isTrackableWeight / isRepExercise / isTimeExercise',/isTrackableWeight|isRepExercise\(|isTimeExercise\(/],
  ];
  const isComment=l=>/^\s*(\/\/|\*|\/\*)/.test(l);
  POOLS.forEach(([nm,rx])=>{
    const hits=[];
    SRC.forEach((l,i)=>{ if(rx.test(l)&&!isComment(l)) hits.push(i+1); });
    console.log(`  ${nm.padEnd(30)} ${String(hits.length).padStart(3)} non-comment line(s): ${hits.join(', ')}`);
  });
}

// ─── F. THE SAME GATE GAP, MEASURED ON WHAT SHIPS TODAY ─────────────────────
// Independent oracle: the WIZARD'S OWN equipment copy (index.html:2653-2657) is the
// contract the athlete agreed to. What each tier is asserted to own:
//   home_full  — barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar
//   home_basic — dumbbells, kettlebells, pull-up bar, bands. NO barbell.
//   commercial — "full gym — cables, machines, barbells, everything"
//   crossfit   — barbells, rig, bumpers, kettlebells, rower/bike, wall balls (+dumbbells, V127 note)
//   bodyweight — "you, the floor, and something to pull on. No weights."
// The IMPLEMENT-DEMAND table below is written from the movement, not from _gearOK.
const DEMANDS=[
  ['landmine',   /landmine/i,                                             {home_full:0,home_basic:0,commercial:1,crossfit:1,bodyweight:0}],
  ['barbell',    /zercher|barbell|trap bar|power clean|hang clean|rack pull|^back squat|^front squat|paused back squat|^deadlift$|sumo deadlift|good morning|close-grip bench|thruster|barbell rollout/i,
                                                                          {home_full:1,home_basic:0,commercial:1,crossfit:1,bodyweight:0}],
  ['cable/machine',/cable|\bmachine\b|pulldown|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|hack squat|preacher|\bsmith\b|^rope |face pull|glute-ham|\bghr\b|45\u00b0 back extension/i,
                                                                          {home_full:0,home_basic:0,commercial:1,crossfit:0,bodyweight:0}],
  ['med ball',   /ball slam|wall ball|medicine ball/i,                     {home_full:0,home_basic:0,commercial:1,crossfit:1,bodyweight:0}],
  ['dumbbell/kb',/kettlebell|\(kb\)|\bkb\b|\bdumbbell|\bdb\b|goblet/i,{home_full:1,home_basic:1,commercial:1,crossfit:1,bodyweight:0}],
  ['band',       /\bband(?!\s*stretch)|banded/i,                           {home_full:0,home_basic:1,commercial:1,crossfit:0,bodyweight:0}],
];
function partF(){
  hdr('F. THE SAME NAME-LEVEL GAP, MEASURED ON WHAT SHIPS TODAY');
  console.log('oracle: the wizard equipment copy at index.html:2653-2657, transcribed above the DEMANDS table.');
  EQUIP.forEach(e=>{
    const m=perTier[e]||new Map();
    const tot=[...m.values()].reduce((a,b)=>a+b,0);
    console.log(`\n  ${e}  (${m.size} distinct names over ${tot} printed items)`);
    DEMANDS.forEach(([lab,rx,ok])=>{
      if(ok[e]) return;                                   // tier owns it, nothing to report
      const bad=[...m.keys()].filter(n=>rx.test(n)).sort();
      const n=bad.reduce((a,k)=>a+m.get(k),0);
      console.log(`    needs ${lab.padEnd(14)} tier does NOT own it -> ${String(n).padStart(6)} printed items / ${tot} (${tot?((n/tot)*100).toFixed(2):'0.00'}%)  ${bad.length?bad.map(b=>b+'×'+m.get(b)).join(' | '):'(none)'}`);
    });
  });
}

// ─── main ───────────────────────────────────────────────────────────────────
console.log('MEASURE v192 — six-movement meta list — ia-version '+IA.version);
runLattice();
if(stats.builds===0){ console.error('FAILED MEASUREMENT: lattice produced 0 builds'); process.exit(1); }
if(on('A')) partA();
if(on('B')) partB();
if(on('C')) partC();
if(on('D')) partD();
if(on('E')) partE();
if(on('F')) partF();
console.log('\n[done] builds='+stats.builds+' crashes='+stats.crashes+' trainDays='+stats.trainDays+' powerSections='+stats.powerSections);
