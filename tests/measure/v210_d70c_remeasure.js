// v210_d70c_remeasure.js — MODE B before-picture for V210 (D70c + D150 + D149), re-measured on V209.
// Read-only. Works from git objects, never the working copy.
//   node tests/measure/v210_d70c_remeasure.js <scratchdir>
// Parts:
//  (1) runs the kept V206 measure (v209_d70b_equipment_denials.js, hand implement-table oracle) on
//      V206, V209, V209+surgery and diffs the denial totals / per-name counts / swap-sheet hits.
//  (2) re-applies coach's surgery anchors (v209_d70c_surgery.py, verbatim list mirrored below and
//      split by ruling) to V209; count==1 per anchor; builds V209+D70c+D150 and V209+all.
//      HALF_MANNY digest + swap-universe size on each.
//  (3) runs the kept blast (v209_d70c_blast.js) V209->all, V209->D70c+D150, D70c+D150->all, and
//      V206->V206+all as the reproduction of the V206 numbers.
//  (4) D140/D104a interaction: wraps d18LongRunDayPass to capture the pre-pass card, then on every
//      long-run-tier day (tier from _longRunTier) counts items the surgery newly deals and whether
//      the pass strips them. Oracle for "stripped": pre-pass name present, post-pass name absent.
const fs=require('fs'), path=require('path'), cp=require('child_process');
const ROOT=path.join(__dirname,'..','..'); const S=process.argv[2]; if(!S) throw new Error('need scratch dir');
const H=require(path.join(ROOT,'tests','harness.js'));
const git=(rev)=>cp.execFileSync('git',['show',rev+':index.html'],{cwd:ROOT,maxBuffer:1<<28}).toString('utf8');
const V206=git('57b3ed8'), V209=git('3b98a0c');
// ── (2) surgery, mirrored from tests/measure/v209_d70c_surgery.py, tagged by ruling ──
const E=[
 ['D70c-A1','bar', "if(!hasBarbell && /^barbell |^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|glute-ham/i.test(N)) return false;",
   "if(!hasBarbell && /\\bbarbell\\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/i.test(N)) return false;"],
 ['D149-D2','bar+', null, "\n    if(!hasGHD && /glute-ham|\\bghr\\b|45° back extension/i.test(N)) return false;"],
 ['D149-D1','d149', "  const hasCables=equip==='commercial';", "  const hasCables=equip==='commercial';\n  const hasGHD=equip==='commercial'||isCrossfit;"],
 ['D70c-A2','c', "let chestCompoundPool=hasBarbell?(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):",
   "let chestCompoundPool=hasBarbell?_gear(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):"],
 ['D70c-A3','c', "let squatPool=hasBarbell?(olderHyp?EXLIB.squat_joint:EXLIB.squat):", "let squatPool=hasBarbell?_gear(olderHyp?EXLIB.squat_joint:EXLIB.squat):"],
 ['D70c-A4','c', "const chestPoolRaw=isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc;", "const chestPoolRaw=isBW?(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc):_gear(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc);"],
 ['D70c-B1a','c', "          isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']",
   "          _gear(isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']"],
 ['D70c-B1b','c', "                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press']\n        ).filter(x=>x!==ex.chestMain);",
   "                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press'])\n        ).filter(x=>x!==ex.chestMain);"],
 ['D70c-B2a','c', "const _fA=_armsDay?EXLIB.biceps.filter(_noBar):EXLIB.shoulder_iso;", "const _fA=_armsDay?(isBW?EXLIB.biceps:bicepsAccPool).filter(_noBar):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"],
 ['D70c-B2b','c', "const _fB=_armsDay?EXLIB.triceps:EXLIB.shoulder_iso;", "const _fB=_armsDay?(isBW?EXLIB.triceps:_gear(EXLIB.triceps)):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"],
 ['D150-C1a','c', "  return { buildSections };", "  return { buildSections, gearOK:_gearOK };"],
 ['D150-C1b','c', "  const { buildSections } = C;", "  const { buildSections, gearOK } = C;"],
 ['D150-C1c','c', "  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);",
   "  { const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList().filter(n=>gearOK(n)&&!(_isBW&&(_BW_SUBS[n]||_BW_GEAR.test(n)))); _swapUniverseReset(); _swapUniverseAdd(_u); }\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);"],
 ['D149-D3','d149', "  if(/cable|pec deck/.test(N)) return equip==='commercial';",
   "  if(/glute-ham|\\bghr\\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';\n  if(/cable|pec deck/.test(N)) return equip==='commercial';"],
 ['D149-D4a','d149', "squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?['Barbell hip thrust','45° back extension']:['Banded hip thrust','Single-leg glute bridge'];",
   "squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];"],
 ['D149-D4b','d149', "        hipExtPool = ['45° back extension'];", "        hipExtPool = hasGHD?['45° back extension']:['Bodyweight back extension'];"],
];
const cnt=(s,a)=>s.split(a).length-1;
function surg(src,withD149,label){
  const lines=src.split('\n'); console.log(`\n== (2) SURGERY on ${label} (${withD149?'D70c+D150+D149':'D70c+D150 only'})`);
  for(const [id,k,a,b] of E){
    if(k==='bar+') continue;
    const c=cnt(src,a); const ln=c===1?src.slice(0,src.indexOf(a)).split('\n').length:-1;
    console.log(`   ${id.padEnd(9)} count=${c} line=${ln}`);
    if(c!==1){ const key=a.trim().slice(0,30); lines.forEach((l,i)=>{ if(l.includes(key)) console.log(`      L${i+1}: ${l.trim().slice(0,200)}`); }); throw new Error('anchor '+id+' count '+c); }
    if(k==='d149'&&!withD149) continue;
    let rep=b; if(id==='D70c-A1'&&withD149) rep=b+E[1][3];
    src=src.replace(a,()=>rep);
  }
  return src;
}
const V209c=surg(V209,false,'V209'), V209s=surg(V209,true,'V209'), V206s=surg(V206,true,'V206');
const F={v206:path.join(S,'r_v206.html'),v206s:path.join(S,'r_v206s.html'),v209:path.join(S,'r_v209.html'),v209c:path.join(S,'r_v209c.html'),v209s:path.join(S,'r_v209s.html')};
Object.values(F).forEach(f=>{ if(fs.existsSync(f)) fs.unlinkSync(f); });
fs.writeFileSync(F.v206,V206); fs.writeFileSync(F.v206s,V206s); fs.writeFileSync(F.v209,V209); fs.writeFileSync(F.v209c,V209c); fs.writeFileSync(F.v209s,V209s);
// cross-check against coach's python output (byte-equal proves the mirror is faithful)
const py=path.join(S,'py_v209s.html'); if(fs.existsSync(py)) fs.unlinkSync(py);
cp.execFileSync('python3',[path.join(ROOT,'tests/measure/v209_d70c_surgery.py'),F.v209,py]);
console.log('   mirror == coach python surgery on V209:', fs.readFileSync(py,'utf8')===V209s);
// HALF_MANNY
console.log('\n== (2) HALF_MANNY digest / swap universe');
const L={}; for(const k of Object.keys(F)) L[k]=H.load(F[k]);
for(const k of Object.keys(F)){ const IA=L[k]; const p=IA.buildProgram(IA.fixtures.HALF_MANNY), p2=IA.buildProgram(IA.fixtures.HALF_MANNY);
  console.log(`   ${k.padEnd(6)} ia=${IA.version} digest=${H.progDigest(p)} self-stable=${H.progDigest(p)===H.progDigest(p2)} universe=${(p._swapUniverse||[]).length} row[${IA.version}]=${H.MANNY_DIGEST_BY_VERSION[IA.version]}`); }
{ const a=L.v209.buildProgram(L.v209.fixtures.HALF_MANNY)._swapUniverse, b=L.v209s.buildProgram(L.v209s.fixtures.HALF_MANNY)._swapUniverse;
  console.log('   HALF_MANNY universe V209 vs V209+all: removed',a.filter(n=>!b.includes(n)),'added',b.filter(n=>!a.includes(n))); }
// ── (4) D140 interaction ──
const DAYS=H.DAYS; const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
for(const k of ['v209','v209s']) L[k].eval("var __PRE=null; var __o18=d18LongRunDayPass; d18LongRunDayPass=function(w){ __PRE=JSON.parse(JSON.stringify(w)); return __o18(w); };");
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const FOC=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight'];
const mk=(g,f,exp,age,eq,rest,seed)=>({name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},GOALS[g])},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed});
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const names=d=>(d&&d.sections||[]).flatMap(s=>(s.items||[]).map(i=>clean(i.name)));
const R={progs:0,lrDays:{},lrChangedPost:{},lrChangedPre:{},newDealt:{},newStripped:{},newStrippedNames:{},newKeptNames:{},oldStripped:{},secCountDiff:{},itemCountDiff:{},budgetBind:{},crash:0,passFired:0};
for(const eq of TIERS) for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','55+']) for(const rest of [['sun','wed'],['sat','sun']]) for(const seed of [76308,1234]){
  const cfg=mk(g,f,exp,age,eq,rest,seed); let pa,pb,prA,prB;
  try{ pa=L.v209.buildProgram(cfg); prA=L.v209.eval('__PRE'); pb=L.v209s.buildProgram(cfg); prB=L.v209s.eval('__PRE'); }catch(e){ R.crash++; continue; }
  if(!prA||!prB){ R.crash++; continue; } R.progs++;
  Object.keys(prA).forEach(w=>DAYS.forEach(d=>{ const A0=prA[w][d], B0=prB[w][d]; if(!A0||A0.rest||!A0.cardio) return;
    const t=L.v209.eval('_longRunTier')(A0.cardio); if(!t) return; const K=eq+'|'+t; bump(R.lrDays,K); bump(R.lrDays,'ALL|'+t);
    const A1=pa.weeks[w][d], B1=pb.weeks[w][d];
    const nA0=names(A0), nB0=names(B0), nA1=names(A1), nB1=names(B1);
    if(nA0.join('\u0001')!==nB0.join('\u0001')) bump(R.lrChangedPre,K);
    if(JSON.stringify((A1.sections||[]).map(s=>[s.label,(s.items||[]).map(i=>[clean(i.name),i.detail])]))!==JSON.stringify((B1.sections||[]).map(s=>[s.label,(s.items||[]).map(i=>[clean(i.name),i.detail])]))) bump(R.lrChangedPost,K);
    if((A1.sections||[]).length!==(B1.sections||[]).length) bump(R.secCountDiff,K);
    if(nA1.length!==nB1.length) bump(R.itemCountDiff,K);
    const setA=new Set(nA0);
    nB0.forEach(n=>{ if(setA.has(n)) return; bump(R.newDealt,K); if(!nB1.includes(n)){ bump(R.newStripped,K); bump(R.newStrippedNames,K+'|'+n);} else bump(R.newKeptNames,K+'|'+n); });
    const setB=new Set(nB0); nA0.forEach(n=>{ if(!setB.has(n)&&!nA1.includes(n)) bump(R.oldStripped,K); });
  }));
}
console.log(`\n== (4) D140 x D70c: ${R.progs} programs (lattice = blast lattice, V209 vs V209+all), crashes ${R.crash}`);
console.log('   key = tier|longRunTier; pre = card before d18LongRunDayPass, post = card after the whole build');
Object.keys(R.lrDays).sort().forEach(K=>console.log(`   ${K.padEnd(14)} lrDays ${String(R.lrDays[K]).padStart(6)}  preChanged ${R.lrChangedPre[K]||0}  postChanged ${R.lrChangedPost[K]||0}  newItemsDealt ${R.newDealt[K]||0}  newItemsStripped ${R.newStripped[K]||0}  baseItemsStripped(that surgery replaced) ${R.oldStripped[K]||0}  sectionCountDiff ${R.secCountDiff[K]||0}  itemCountDiff ${R.itemCountDiff[K]||0}`));
console.log('   new-pool names STRIPPED by the pass:'); Object.entries(R.newStrippedNames).sort((a,b)=>b[1]-a[1]).forEach(([k,c])=>console.log('      '+k.padEnd(60)+c));
console.log('   new-pool names KEPT by the pass:'); Object.entries(R.newKeptNames).sort((a,b)=>b[1]-a[1]).forEach(([k,c])=>console.log('      '+k.padEnd(60)+c));
// ── (1)+(3) the kept scripts, in parallel children ──
const jobs=[
 ['m_v206',  ['tests/measure/v209_d70b_equipment_denials.js',F.v206,path.join(S,'m_v206.json')]],
 ['m_v209',  ['tests/measure/v209_d70b_equipment_denials.js',F.v209,path.join(S,'m_v209.json')]],
 ['m_v209s', ['tests/measure/v209_d70b_equipment_denials.js',F.v209s,path.join(S,'m_v209s.json')]],
 ['m_v209c', ['tests/measure/v209_d70b_equipment_denials.js',F.v209c,path.join(S,'m_v209c.json')]],
 ['b_v206',  ['tests/measure/v209_d70c_blast.js',F.v206,F.v206s]],
 ['b_v209',  ['tests/measure/v209_d70c_blast.js',F.v209,F.v209s]],
 ['b_v209c', ['tests/measure/v209_d70c_blast.js',F.v209,F.v209c]],
 ['b_d149',  ['tests/measure/v209_d70c_blast.js',F.v209c,F.v209s]],
];
Promise.all(jobs.map(([id,args])=>new Promise(res=>{ const o=path.join(S,id+'.out'); if(fs.existsSync(o)) fs.unlinkSync(o);
  const p=cp.spawn('node',args,{cwd:ROOT}); let buf=''; p.stdout.on('data',d=>buf+=d); p.stderr.on('data',()=>{});
  p.on('close',code=>{ fs.writeFileSync(o,buf); res([id,code,buf]); }); }))).then(rs=>{
  const out={}; rs.forEach(([id,code,buf])=>{ out[id]=buf; console.log(`\n   child ${id} exit=${code} bytes=${buf.length} DONE=${/DONE/.test(buf)}`); });
  console.log('\n== (1) DENIALS: V206 | V209 | V209+D70c+D150 | V209+all');
  const tot=b=>{ const r={}; b.split('\n').forEach((l,i,a)=>{ const m=l.match(/^-- (\w+) \[/); if(m){ const n=a[i+1].match(/(\d+) \/ (\d+) items/); r[m[1]]=n?n[1]+'/'+n[2]:'?'; } const s=l.match(/SWAP-SHEET: (\d+) \/ (\d+)/); if(s){ const id=Object.keys(r).pop(); r[id+'.swap']=s[1]+'/'+s[2]; } }); const h=b.match(/HEADLINE[^:]*: (\d+) \/ (\d+)/); if(h) r.HEADLINE=h[1]+'/'+h[2]; return r; };
  const T=['m_v206','m_v209','m_v209c','m_v209s'].map(k=>tot(out[k]));
  [...new Set(T.flatMap(Object.keys))].forEach(k=>console.log('   '+k.padEnd(20)+T.map(t=>(t[k]||'-').padStart(18)).join('')));
  // per-name counts per denial
  const perName=b=>{ const r={}; let cur=null; b.split('\n').forEach(l=>{ const m=l.match(/^-- (\w+) \[/); if(m){cur=m[1];return;} if(/^== /.test(l)) cur=null; const n=l.match(/^\s+(\d+)  (.+?)\s+class=/); if(cur&&n) r[cur+' | '+n[2].trim()]=+n[1]; }); return r; };
  const P=['m_v206','m_v209','m_v209c','m_v209s'].map(k=>perName(out[k]));
  console.log('\n   per-name (denial | name): V206 | V209 | V209+D70c+D150 | V209+all');
  [...new Set(P.flatMap(Object.keys))].sort().forEach(k=>console.log('   '+k.slice(0,62).padEnd(62)+P.map(p=>String(p[k]||0).padStart(8)).join('')));
  ['m_v206','m_v209','m_v209s'].forEach(k=>{ const l=out[k].split('\n').filter(x=>/LATTICE|^\s+(home_full|home_basic|commercial|crossfit|bodyweight)\s+items|ALL items|HALF_MANNY digest|swapCandidates calls/.test(x)); console.log('\n   ['+k+']\n'+l.join('\n')); });
  ['b_v206','b_v209','b_v209c','b_d149'].forEach(k=>{ console.log(`\n== (3) BLAST ${k}`); console.log(out[k].split('\n').filter(x=>/^== BLAST|day cards changed|programs changed|^   (home_full|home_basic|crossfit|commercial|bodyweight)\|/.test(x)||/^   (home_full|home_basic|commercial|crossfit|bodyweight)\s+[\d.]+ -> /.test(x)).join('\n')); });
  console.log('\nALLDONE');
});
