'use strict';
// V211 / D155 before-picture (read-only). "A full-body day on tier B should draw upper and trunk,
// not go empty." Counts tier B long-run days whose lift sections are all stripped, on four arms:
//   v210   = working-tree V210 candidate (copied once to <dir>/v210.html)
//   cf153  = v210 + D153 (tier B also drops an item whose _pattern is hinge or hip_ext)
//   cf149  = v210 + the parked D149 slice (three edits, rebuilt here; asserted == parked copy
//            modulo the meta line)
//   cf149_153 = both
// usage: node tests/measure/v211_d155_tierb_draw.js <dir> [seedsN]
// Oracles: tier from the dose minutes (75/45 cuts, the D18 ruling text), "long run" by subtype
// (NRC) / dose.key 'long' (NSW); section class from the LABEL (core = coreHeader/core flag,
// mobility = mobility|stretch label, taper = taper label, everything else = lift); set count by
// a hand parse of the printed prescription. The suspect pass is never asked for an answer.
// Attribution (which sections were stripped) reads a JSON snapshot taken at the top of
// d18LongRunDayPass (PRE) and at the top of raceEveLiftPass (MID = right after D18), inserted
// into instrumented copies whose purity is proven against the plain copy first.
const fs=require('fs'), path=require('path'), H=require(path.join(__dirname,'..','harness.js'));
const S=process.argv[2]; const NSEEDS=+(process.argv[3]||2);
const P=(...a)=>console.log(...a);
const RAW=fs.readFileSync(path.join(S,'v210.html'),'utf8');
const once=(src,a,b,tag)=>{ const c=src.split(a).length-1; if(c!==1){P('ABORT anchor',tag,'count',c);process.exit(2);} return src.replace(a,()=>b); };
const F153_A="secs=secs.map(sec=>({...sec, items:(sec.items||[]).filter(it=>!_D18_LEG_RX.test(it.name||''))}));";
const F153_B="secs=secs.map(sec=>({...sec, items:(sec.items||[]).filter(it=>!_D18_LEG_RX.test(it.name||'')&&!/^(hinge|hip_ext)$/.test(_pattern(it.name||'')||''))}));";
const D149=[
 ["  const hasCables=equip==='commercial';","  const hasCables=equip==='commercial';\n  const hasGHD=equip==='commercial'||isCrossfit;"],
 ["|close-grip bench|glute-ham/i.test(N)) return false;","|close-grip bench/i.test(N)) return false;\n    if(!hasGHD && /glute-ham|\\bghr\\b|45° back extension/i.test(N)) return false;"],
 ["  if(/cable|pec deck/.test(N)) return equip==='commercial';","  if(/glute-ham|\\bghr\\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';\n  if(/cable|pec deck/.test(N)) return equip==='commercial';"]];
const SRC={v210:RAW};
SRC.cf153=once(RAW,F153_A,F153_B,'D153');
{ let s=RAW; D149.forEach(([a,b],i)=>{ s=once(s,a,b,'D149-'+(i+1)); }); SRC.cf149=s; }
SRC.cf149_153=once(SRC.cf149,F153_A,F153_B,'D153 on cf149');
{ const pk=path.join(S,'parked_slice4_index.html');
  if(fs.existsSync(pk)){ const m=t=>t.replace(/<meta name="ia-version" content="\d+">/,'');
    P('cf149 == parked_slice4_index.html modulo ia-version meta:', m(fs.readFileSync(pk,'utf8'))===m(SRC.cf149)); } else P('parked_slice4_index.html not found (cf149 built from the slice edits only)'); }
const HOOK_A='function d18LongRunDayPass(weeks){', HOOK_B='function raceEveLiftPass(weeks, totalWeeks){';
const ARMS=['v210','cf153','cf149','cf149_153'];
const L={}, I={};
for(const k of ARMS){
  const pf=path.join(S,'d155_'+k+'.html'), ipf=path.join(S,'d155_instr_'+k+'.html');
  [pf,ipf].forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});
  fs.writeFileSync(pf,SRC[k]);
  let ins=once(SRC[k],HOOK_A,HOOK_A+'globalThis.__PRE=JSON.stringify(weeks);','hookA '+k);
  ins=once(ins,HOOK_B,HOOK_B+'globalThis.__MID=JSON.stringify(weeks);','hookB '+k);
  fs.writeFileSync(ipf,ins);
  L[k]=H.load(pf); I[k]=H.load(ipf);
}
P('versions', ARMS.map(k=>k+'='+L[k].version).join(' '));
const DAYS=H.DAYS, cl=o=>JSON.parse(JSON.stringify(o));
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const handTier=c=>{ if(!c||!c.dose) return null; const m=mins(c.dose); if(!m) return null; if(c.isNRC&&/rehearsal/i.test(c.detail||'')) return 'A'; return m>=75?'A':m>=45?'B':'C'; };
const isNrcLong=c=>!!(c&&c.isNRC&&c.dose&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''));
const isNswLong=c=>!!(c&&!c.isNRC&&c.type==='run'&&c.dose&&c.dose.key==='long');
const ROLE={'Push':'push','Pull':'pull','Legs':'legs','Push (light)':'push_light','Full Body':'full','Active Recovery':'active',
 'Strength Support':'push','Posterior Chain':'pull','Leg Strength + Mobility':'legs','Recovery Lift':'push_light','Full Body Support':'full'};
const roleOf=t=>{ const m=/^(.*?)(?: — (Upper|Lower))?$/.exec(t||''); const r=ROLE[m[1]]; return r?(r+(m[2]?'/'+m[2].toLowerCase():'')):'other:'+t; };
const secClass=s=>{ if(/taper/i.test(s.label||'')) return 'taper'; if(s.coreHeader||s.core||/^trunk|core/i.test(s.label||'')) return 'core'; if(/mobility|stretch/i.test(s.label||'')) return 'mobility'; if(s.hip) return 'hip'; return 'lift'; };
const live=d=>(d.sections||[]).filter(s=>(s.items||[]).length);
const nClass=(d,c)=>live(d).filter(s=>secClass(s)===c).length;
const sk=s=>(s.label||'')+(s.coreHeader?'{'+s.coreHeader.replace(/\s*—.*$/,'')+'}':'');
const skShort=s=>((s.label||'').replace(/\s*[—-]\s.*$/,'')||'(core)')+(s.coreHeader?'{'+s.coreHeader.replace(/^Core\s*—\s*/,'')+'}':'');
const STR=/stretch|mobility|foam|90\/90|world'?s greatest|\bcars?\b/i;
const handSets=d=>{ let n=0,unp=0; live(d).forEach(s=>s.items.forEach(it=>{ if(STR.test(it.name||'')) return; const det=it.detail||''; let m=/^(\d+)\s*[x×]/.exec(det)||/\b(\d+)\s*sets?\b/i.exec(det); if(m) n+=+m[1]; else {n+=1;unp++;} })); return {n,unp}; };
const T2B=/toes[- ]to[- ]bar/i;
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const fmt=d=>live(d).map(s=>'      ['+sk(s)+'] '+s.items.map(i=>i.name+' {'+i.detail+'}').join(' | ')).join('\n')||'      (no sections)';
const tbl=(o,pad=7)=>Object.entries(o).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).forEach(([k,v])=>P(' '+String(v).padStart(pad)+'  '+k));

function build(k,c){ const p=I[k].buildProgram(cl(c)); const pre=JSON.parse(I[k].eval('globalThis.__PRE')), mid=JSON.parse(I[k].eval('globalThis.__MID')); return {p,pre,mid}; }

// purity: instrumented == plain on a sample
function purity(list){ let bad=0,n=0; for(const x of list.slice(0,40)) for(const k of ARMS){ n++; if(H.progDigest(L[k].buildProgram(cl(x.c)))!==H.progDigest(I[k].buildProgram(cl(x.c)))) bad++; } P('instrumentation purity: '+(n-bad)+'/'+n+' builds digest-equal to the plain copy'); if(bad) process.exit(3); }

function run(limb,list,isLong){
  const R={cfg:0,crash:{},days:{},zero:{},zeroFinal:{},empty:{},seg:{},strip:{},roleB:{},roleDeal:{},roleZero:{},t2b:{},t2bNew:{},setsHist:{},over8:{},unp:{},added:{},preEq:0,preNe:0,trans:{}};
  ARMS.forEach(k=>{R.days[k]=0;R.zero[k]=0;R.zeroFinal[k]=0;R.empty[k]=0;R.t2b[k]=0;R.t2bNew[k]=0;R.setsHist[k]={};R.over8[k]=0;R.unp[k]=0;R.seg[k]={};R.strip[k]={};R.roleZero[k]={};R.added[k]={};});
  const ex={}; let exT2B=null;
  for(const x of list){ R.cfg++;
    const arms=(x.c.equipment==='home_full'||x.c.equipment==='commercial')?ARMS:['v210','cf153'];
    const B={}; try{ arms.forEach(k=>B[k]=build(k,x.c)); }catch(e){ bump(R.crash,x.seg+' '+String(e.message).slice(0,80)); continue; }
    const tw=B.v210.p.totalWeeks;
    for(let w=1;w<=tw;w++) for(const d of DAYS){
      const y0=B.v210.p.weeks[w]&&B.v210.p.weeks[w][d]; if(!y0||y0.rest) continue;
      const c=y0.cardio; if(!isLong(c)||handTier(c)!=='B') continue;
      // pre-D18 for v210 and cf153 must be identical (D153 edits only the pass itself)
      if(JSON.stringify(B.v210.pre[w][d])===JSON.stringify(B.cf153.pre[w][d])) R.preEq++; else R.preNe++;
      for(const k of arms){
        const fin=B[k].p.weeks[w][d], pre=B[k].pre[w][d], mid=B[k].mid[w][d]; if(!fin||!pre||!mid) continue;
        R.days[k]++;
        const role=roleOf(pre.title);
        if(k==='v210'){ bump(R.roleB,limb.split(' ')[0]+' | '+role); bump(R.roleDeal,role+' :: '+live(pre).map(skShort).join(' + ')); }
        const preLift=nClass(pre,'lift'), midLift=nClass(mid,'lift'), finLift=nClass(fin,'lift');
        const zl=midLift===0, zf=finLift===0, em=live(mid).filter(s=>secClass(s)!=='taper').length===0;
        bump(R.trans,k+' | pre lift secs '+(preLift?'>=1':'0')+' → after D18 '+(midLift?'>=1':'0'));
        if(zl){ R.zero[k]++; if(em) R.empty[k]++;
          const stripped=live(pre).filter(s=>!live(mid).some(q=>sk(q)===sk(s))).map(skShort).join('+')||'none';
          const kept=live(mid).map(s=>secClass(s)+':'+skShort(s)).join('+')||'nothing';
          const key=role+' | stripped '+stripped+' | left '+kept;
          bump(R.strip[k],key);
          bump(R.roleZero[k],role);
          [['goal',x.seg],['equip',x.c.equipment],['focus',x.c.liftingFocus],['exp',x.c.experience],['rest',x.c.restDays.join('+')],['week',w+'/'+tw]].forEach(([a,b])=>bump(R.seg[k],a+':'+b));
          if(!ex[k+'|'+key]&&Object.keys(ex).filter(q=>q.startsWith(k+'|')).length<6) ex[k+'|'+key]={x,w,d,c,pre,mid,key};
        }
        if(zf) R.zeroFinal[k]++;
        const hs=handSets(fin); bump(R.setsHist[k],hs.n); if(hs.n>8) R.over8[k]++; R.unp[k]+=hs.unp;
        const hasT=live(fin).some(s=>s.items.some(i=>T2B.test(i.name||'')));
        if(hasT) R.t2b[k]++;
        if(k!=='v210'){ const base=k==='cf149_153'?'cf149':'v210'; const bf=B[base].p.weeks[w][d];
          const bn=new Set(live(bf).flatMap(s=>s.items.map(i=>i.name)));
          live(fin).forEach(s=>s.items.forEach(i=>{ if(!bn.has(i.name)) bump(R.added[k],skShort(s)+' :: '+i.name); }));
          if(hasT&&!live(bf).some(s=>s.items.some(i=>T2B.test(i.name||'')))){ R.t2bNew[k]++; if(!exT2B&&k==='cf153') exT2B={x,w,d,c,bf,fin,hs}; } }
      }
    }
  }
  P('\n════ '+limb+': '+R.cfg+' configs | crashes '+JSON.stringify(R.crash));
  P('pre-D18 day identical v210 vs cf153 on tier B days: '+R.preEq+' equal / '+R.preNe+' differ');
  P('(1) tier B long-run days (hand tier) → ZERO lift sections right after D18 | zero lift sections on the final card | zero sections of any kind (excl. taper) after D18');
  ARMS.forEach(k=>P('   '+k.padEnd(10)+' '+R.zero[k]+' / '+R.days[k]+' tier B days  ('+(R.days[k]?(100*R.zero[k]/R.days[k]).toFixed(2):'-')+'%) | final '+R.zeroFinal[k]+' | fully empty '+R.empty[k]+(k.startsWith('cf149')||R.days[k]!==R.days.v210?'   [home_full+commercial slice only]':'')));
  P('    transitions:'); tbl(R.trans);
  // same-slice comparison
  ARMS.forEach(k=>{ if(!Object.keys(R.seg[k]).length) return; P('   segments of zero-lift days, '+k+':'); tbl(R.seg[k],9); });
  ARMS.forEach(k=>{ P('   role | stripped | left, '+k+':'); tbl(R.strip[k],9); });
  P('(2) role of the tier B long-run day on v210 (from the pre-D18 title), all tier B days:'); tbl(R.roleB);
  P('    zero-lift days by role:'); ARMS.forEach(k=>P('     '+k.padEnd(10)+' '+JSON.stringify(R.roleZero[k])));
  P('    what each role deals BEFORE D18 on a tier B long-run day (v210, section list):'); tbl(R.roleDeal);
  P('(4) Toes-to-bar on tier B days (final card) | new vs its base arm | hand set count > 8 | unparsed items');
  ARMS.forEach(k=>P('   '+k.padEnd(10)+' T2B days '+R.t2b[k]+' | new '+(k==='v210'?'-':R.t2bNew[k])+' | sets>8: '+R.over8[k]+' / '+R.days[k]+' | unparsed '+R.unp[k]+' | set histogram '+JSON.stringify(R.setsHist[k])));
  ['cf153','cf149','cf149_153'].forEach(k=>{ P('    items on '+k+' tier B cards absent from its base arm (section :: item):'); tbl(R.added[k]); });
  P('    example zero-lift cards (≤6 per arm, one per class):');
  Object.values(ex).forEach(e=>{ P(`  ── ${e.x.seg} W${e.w} ${e.d} "${e.c.subtype}" ${mins(e.c.dose).toFixed(1)} min | ${e.x.c.liftingFocus}/${e.x.c.equipment}/${e.x.c.experience}/rest ${e.x.c.restDays.join('+')}/seed ${e.x.c.seed} | ${e.key}`);
    P('    PRE-D18 "'+e.pre.title+'"\n'+fmt(e.pre)); P('    AFTER D18 "'+e.mid.title+'"\n'+fmt(e.mid)); });
  if(exT2B){ const e=exT2B; P(`  ── T2B example (cf153 new) ${e.x.seg} W${e.w} ${e.d} "${e.c.subtype}" ${mins(e.c.dose).toFixed(1)} min | ${e.x.c.liftingFocus}/${e.x.c.equipment}/${e.x.c.experience}/seed ${e.x.c.seed} | hand sets ${e.hs.n}`);
    P('    v210\n'+fmt(e.bf)); P('    cf153\n'+fmt(e.fin)); }
  return R;
}

// ─── lattices: verbatim from tests/measure/v211_d153_tierb_hinge.js ───
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
  return Object.assign(cl(H.fixtures.HALF_MANNY),{name:'D155',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:o.a,equipment:o.q,restDays:o.r.slice(),seed:o.s});
}
const nrc=[]; let ii=0;
for(const plan of PLANS) for(const e of EXP) for(const a of AGE) for(const r of RESTS) for(const q of EQ) for(const f of FOC) for(const s of SEEDS) for(const dated of [true,false])
  nrc.push({seg:plan,c:nrcCfg(plan,{e,a,r,q,f,s,dated},ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC) for(const q of EQ) for(const r of [RESTS[0],RESTS[1]]) for(const dated of [true,false])
  nrc.push({seg:plan+' multi',c:nrcCfg(plan,{ex,e:EXP[ii%3],a:AGE[(ii>>1)%3],r,q,f,s:SEEDS[ii%SEEDS.length],dated},ii++)});
const STAND={name:'PRT TING',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const m6b=[];
[['run_pace_goal','8','15',['run']],['run_mile_time','8','15',['run']],['run_15_under10','8','15',['run']],['run_base','8','15',['run']],['run_pace_goal','12','0',['run']],['run_base','12','0',['run']],['run_pace_goal','8','15',['run','bike']],['run_pace_goal','8','15',['run','swim']]].forEach(([g,mm,ss,T])=>
 [24865,1001,7007].forEach(seed=>['home_full','crossfit','bodyweight','full_gym'].forEach(eq=>['balanced','hypertrophy','support_prevention'].forEach(f=>{
  const c=cl(STAND);c.cardioGoals.run.id=g;c.cardioGoals.run.mileBestMins=mm;c.cardioGoals.run.mileBestSecs=ss;c.cardioTypes=T.slice();
  if(T.includes('bike'))c.cardioGoals.bike={id:'bike_base',label:'Base',baselineDist:'10',baseline:'10mi'};
  if(T.includes('swim'))c.cardioGoals.swim={id:'swim_base',label:'Base',baselineDist:'1000',baseline:'1000m'};
  c.seed=seed;c.equipment=eq;c.liftingFocus=f;m6b.push({seg:g+'/'+mm+':'+ss+'/'+T.join('+'),c});}))));
const nswB=[];
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC) for(const q of EQ) for(const r of RESTS) for(const e of EXP) for(const seed of [24865,1001]){
  const c=cl(STAND); c.cardioGoals.run.id=g; c.cardioGoals.run.mileBestMins=mm[0]; c.cardioGoals.run.mileBestSecs=mm[1]; c.liftingFocus=f; c.equipment=q; c.restDays=r.slice(); c.experience=e; c.seed=seed; nswB.push({seg:g+'/'+mm.join(':'),c}); }

purity(nrc.filter(x=>x.c.equipment==='home_full'||x.c.equipment==='commercial'));
const t0=Date.now();
run('NRC lattice (4 plans × 3 exp × 3 age × 5 rest × 5 equip × 6 focus × '+SEEDS.length+' seeds × dated/undated + multi-sport)',nrc,isNrcLong);
P('elapsed s',((Date.now()-t0)/1000).toFixed(0));
run('NSW m6b lattice (8 goal rows × 3 seeds × 4 equip × 3 focus)',m6b,isNswLong);
run('NSW broad lattice (4 goals × 2 mile bests × 6 focus × 5 equip × 5 rest × 3 exp × 2 seeds)',nswB,isNswLong);

// ─── HALF_MANNY, three arms (g199/g200 method, as in v211_d153_tierb_hinge.js) ───
P('\n════ HALF_MANNY');
const G=fs.readFileSync(path.join(__dirname,'..','gates','g199_deload_arbitration.js'),'utf8');
const A_PIPE=eval(G.match(/const A_PIPE=(".*");/)[1]);
const A_PIPE_R=eval('['+G.match(/const A_PIPE_R=\[([\s\S]*?)\]\.join\("\\n"\);/)[1]+'].join("\\n")');
const SNAP_FN=eval(G.match(/const SNAP_FN=("[\s\S]*?");\nfunction instrument/)[1]);
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const HM=()=>cl(H.fixtures.HALF_MANNY);
P('HALF_MANNY equipment '+HM().equipment+' focus '+HM().liftingFocus);
for(const k of ARMS){
  const src=SRC[k];
  const shipped=H.progDigest(L[k].buildProgram(HM())), again=H.progDigest(L[k].buildProgram(HM()));
  const ipf=path.join(S,'d155_hm_instr_'+k+'.html'); try{fs.unlinkSync(ipf);}catch(e){} fs.writeFileSync(ipf,once(src,A_PIPE,A_PIPE_R,'A_PIPE '+k));
  const IP=H.load(ipf); IP.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;"); const on=H.progDigest(IP.buildProgram(HM())); IP.eval("globalThis.__DELOAD_OFF=true;"); const off=H.progDigest(IP.buildProgram(HM()));
  const cpf=path.join(S,'d155_hm_coreoff_'+k+'.html'); try{fs.unlinkSync(cpf);}catch(e){} fs.writeFileSync(cpf,once(src,CLAUSE,'','CLAUSE '+k));
  const core=H.progDigest(H.load(cpf).buildProgram(HM()));
  P(`${k.padEnd(10)} shipped ${shipped} (self ${again===shipped?'==':'!='}) | instrumented ON ${on} | DELOAD_OFF ${off} | CORE_OFF ${core}`);
}
P('era rows: '+[209,210,211].map(v=>v+': '+H.MANNY_DIGEST_BY_VERSION[v]+'/'+(H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION||{})[v]+'/'+(H.MANNY_CORE_OFF_DIGEST_BY_VERSION||{})[v]).join(' ; '));
{ const b=L.v210.buildProgram(HM());
  for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ const y=b.weeks[w][d]; if(!y||y.rest) continue; const c=y.cardio; if(isNrcLong(c)&&handTier(c)==='B') P(`  HM W${w} ${d} "${c.subtype}" ${mins(c.dose).toFixed(1)} min tier B | "${y.title}" | ${live(y).map(skShort).join(' + ')||'(none)'}`); }
  for(const k of ['cf153','cf149','cf149_153']){ const a=L[k].buildProgram(HM()); let n=0;
    for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ if(JSON.stringify(b.weeks[w][d])!==JSON.stringify(a.weeks[w][d])){ n++; P(`  ${k} CHANGED W${w} ${d}\n    v210\n`+fmt(b.weeks[w][d])+`\n    ${k}\n`+fmt(a.weeks[w][d])); } }
    P('HALF_MANNY day cards changed v210→'+k+': '+n+' / '+b.totalWeeks*7); } }
P('\nDONE');
