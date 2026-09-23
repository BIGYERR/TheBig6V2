'use strict';
// V208 slice 6 / D140 measure (read-only). Does F1 (tier B drops /power|explosive/ sections) +
// F2 (tier B budget _n() reads "N sets" as N) move any NRC program, and what does the full slice
// (NSW limb + F1 + F2) do on NSW?  usage: node tests/measure/v208_d140_nrc_sweep.js <dir> [seedsN]
// <dir> holds base.html (a one-time copy of the working index.html). Counterfactuals are written
// there: cfA.html = base+F1+F2, cfA2.html = base+F1+F2(anchored "^N sets"), cfN.html = base+NSW limb,
// cfB.html = base+NSW limb+F1+F2. Oracles: hand minutes from the dose (mi*tgt/60 or mins; 75/45
// cuts from the D18 ruling text), a hand set counter (N× -> N, "N sets" -> N, else 1), and
// before/after JSON of each day. The suspect (_longRunTier / _n) is never asked for an answer.
const fs=require('fs'), path=require('path'), H=require(path.join(__dirname,'..','harness.js'));
const S=process.argv[2]; const NSEEDS=+(process.argv[3]||2);
const RAW=fs.readFileSync(path.join(S,'base.html'),'utf8');
const P=(...a)=>console.log(...a);
const TIER_OLD="function _longRunTier(cardio){\n  if(!cardio || !cardio.isNRC || !cardio.dose) return null;\n  if(!/^long run/i.test(cardio.subtype||'')) return null;\n  if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)\n  if(/rehearsal/i.test(cardio.detail||'')) return 'A';\n";
const TIER_NEW="function _longRunTier(cardio){\n  if(!cardio || !cardio.dose) return null;\n  if(cardio.isNRC){\n    if(!/^long run/i.test(cardio.subtype||'')) return null;\n    if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)\n    if(/rehearsal/i.test(cardio.detail||'')) return 'A';\n  } else if(cardio.type!=='run' || cardio.dose.key!=='long') return null;\n";
const F1_OLD="secs=secs.filter(sec=>!/power/i.test(sec.label||''));";
const F1_NEW="secs=secs.filter(sec=>!/power|explosive/i.test(sec.label||''));";
const F2_OLD=String.raw`const _n=det=>{const m=/^(\d+)\s*[x×]/.exec(det||'');return m?+m[1]:1;};`;
const F2_NEW=String.raw`const _n=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\b(\d+)\s*sets?\b/i.exec(det||'');return m?+m[1]:1;};`;
const F2_NEW_ANCH=String.raw`const _n=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/^(\d+)\s*sets?\b/i.exec(det||'');return m?+m[1]:1;};`;
function apply(src,pairs,tag){ for(const [o,n] of pairs){ const c=src.split(o).length-1; if(c!==1){P('ABORT',tag,'anchor count',c,JSON.stringify(o.slice(0,60)));process.exit(2);} src=src.replace(o,()=>n);} return src; }
const ART={base:path.join(S,'base.html')};
const mk=(k,pairs)=>{ const f=path.join(S,k+'.html'); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,apply(RAW,pairs,k)); ART[k]=f; };
mk('cfA',[[F1_OLD,F1_NEW],[F2_OLD,F2_NEW]]);
mk('cfA2',[[F1_OLD,F1_NEW],[F2_OLD,F2_NEW_ANCH]]);
mk('cfN',[[TIER_OLD,TIER_NEW]]);
mk('cfB',[[TIER_OLD,TIER_NEW],[F1_OLD,F1_NEW],[F2_OLD,F2_NEW]]);
const L={}; for(const k in ART) L[k]=H.load(ART[k]);
P('versions', Object.keys(L).map(k=>k+'='+L[k].version).join(' '));
const DAYS=H.DAYS, cl=o=>JSON.parse(JSON.stringify(o));
const STRIP=new Set(['id','created','_swapUniverse','_swapUniverseByKey']);
const js=o=>JSON.stringify(o,(k,v)=>STRIP.has(k)?undefined:v);
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const handTier=c=>{ if(!c||!c.dose) return null; const m=mins(c.dose); if(!m) return null; if(c.isNRC&&/rehearsal/i.test(c.detail||'')) return 'A'; return m>=75?'A':m>=45?'B':'C'; };
const isNrcLong=c=>!!(c&&c.isNRC&&c.dose&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''));
const isNswLong=c=>!!(c&&!c.isNRC&&c.type==='run'&&c.dose&&c.dose.key==='long');
const engN=det=>{const m=/^(\d+)\s*[x×]/.exec(det||'');return m?+m[1]:1;};
const docN=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\b(\d+)\s*sets?\b/i.exec(det||'');if(m)return +m[1];return 1;};
const isStr=n=>/stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const LEG=/swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;
const sets=(day,f)=>(day.sections||[]).reduce((a,s)=>a+(s.items||[]).filter(i=>!isStr(i.name)).reduce((b,i)=>b+f(i.detail),0),0);
const fmtFull=day=>(day.sections||[]).map(s=>'      ['+s.label+']'+(s.rounds?' rounds='+s.rounds:'')+' '+(s.items||[]).map(i=>i.name+' {'+i.detail+'}').join(' | ')).join('\n')||'      (no sections)';
const fmt=day=>(day.sections||[]).map(s=>'['+s.label+'] '+(s.items||[]).map(i=>i.name).join(', ')).join(' ; ')||'(none)';
const cnt={}; const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};

// ─────────────── 1. NRC lattice ───────────────
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
  return Object.assign(cl(H.fixtures.HALF_MANNY),{name:'D140',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:o.a,equipment:o.q,restDays:o.r.slice(),seed:o.s});
}
const nrcCfgs=[]; let ii=0;
for(const plan of PLANS) for(const e of EXP) for(const a of AGE) for(const r of RESTS) for(const q of EQ) for(const f of FOC) for(const s of SEEDS) for(const dated of [true,false])
  nrcCfgs.push({tag:'solo',plan,c:nrcCfg(plan,{e,a,r,q,f,s,dated},ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC) for(const q of EQ) for(const r of [RESTS[0],RESTS[1]]) for(const dated of [true,false])
  nrcCfgs.push({tag:'multi:'+Object.values(ex).join('+'),plan,c:nrcCfg(plan,{ex,e:EXP[ii%3],a:AGE[(ii>>1)%3],r,q,f,s:SEEDS[ii%SEEDS.length],dated},ii++)});
P('\n════ 1. NRC lattice: '+nrcCfgs.length+' configs ('+nrcCfgs.filter(x=>x.tag==='solo').length+' solo = 4 plans × 3 exp × 3 age × 5 rest × 5 equip × 6 focus × '+SEEDS.length+' seeds × 2 dated/undated; '+nrcCfgs.filter(x=>x.tag!=='solo').length+' multi-sport)');
const N={cfg:0,crash:{},progA:{},progA2vsA:0,progBvsA:0,days:0,longB:{},longA:{},longC:{},dayChg:{},chgNotB:0,
  baseExpl:{},cfAExpl:{},baseDoc8:{},cfADoc8:{},baseEng8:{},cfAEng8:{},carryItemSurvive:{base:0,cfA:0},dayChgSeg:{}};
const changed=[]; const cls={};
const t0=Date.now();
for(const x of nrcCfgs){ N.cfg++;
  let b,a,a2,bb; try{ b=L.base.buildProgram(cl(x.c)); a=L.cfA.buildProgram(cl(x.c)); a2=L.cfA2.buildProgram(cl(x.c)); bb=L.cfB.buildProgram(cl(x.c)); }catch(e){ bump(N.crash,x.plan+' '+e.message.slice(0,80)); continue; }
  const pk=x.plan+(x.tag==='solo'?'':' multi');
  bump(N,'_progTotal_'+pk);
  const ja=js(a); if(js(b)!==ja) bump(N.progA,pk); if(js(a2)!==ja) N.progA2vsA++; if(js(bb)!==ja) N.progBvsA++;
  for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ const y=b.weeks[w]&&b.weeks[w][d], z=a.weeks[w]&&a.weeks[w][d]; if(!y) continue; N.days++;
    const c=y.cardio; const lng=isNrcLong(c); const t=lng?handTier(c):null;
    if(t) bump(N['long'+t],pk);
    if(t==='B'){ if((y.sections||[]).some(s=>/explosive/i.test(s.label||''))) bump(N.baseExpl,pk); if(z&&(z.sections||[]).some(s=>/explosive/i.test(s.label||''))) bump(N.cfAExpl,pk);
      if(sets(y,docN)>8) bump(N.baseDoc8,pk); if(z&&sets(z,docN)>8) bump(N.cfADoc8,pk); if(sets(y,engN)>8) bump(N.baseEng8,pk); if(z&&sets(z,engN)>8) bump(N.cfAEng8,pk); }
    if(lng){ if((y.sections||[]).some(s=>(s.items||[]).some(i=>/carry/i.test(i.name||'')))) N.carryItemSurvive.base++; if(z&&(z.sections||[]).some(s=>(s.items||[]).some(i=>/carry/i.test(i.name||'')))) N.carryItemSurvive.cfA++; }
    if(js(y)!==js(z)){ bump(N.dayChg,pk); if(t!=='B') N.chgNotB++;
      const bl=(y.sections||[]).map(s=>s.label), al=(z.sections||[]).map(s=>s.label);
      const dropSec=bl.filter(l=>!al.includes(l)); let trim=0, add=0;
      (y.sections||[]).forEach(s=>{const s2=(z.sections||[]).find(q=>q.label===s.label); if(!s2) return; const n2=new Set(s2.items.map(i=>i.name)); s.items.forEach(i=>{if(!n2.has(i.name))trim++;});});
      (z.sections||[]).forEach(s=>{const s1=(y.sections||[]).find(q=>q.label===s.label); const n1=new Set(s1?s1.items.map(i=>i.name):[]); s.items.forEach(i=>{if(!n1.has(i.name))add++;});});
      const k='dropSec['+dropSec.map(l=>l.replace(/[—-].*$/,'').trim()).sort().join('+')+'] trimItems='+(trim?'yes':'no')+' addItems='+(add?'yes':'no');
      bump(cls,k);
      ['plan:'+pk,'tier:'+t,'focus:'+x.c.liftingFocus,'equip:'+x.c.equipment,'exp:'+x.c.experience,'age:'+x.c.ageBracket,'dated:'+x.c.eventTargeted,'rest:'+x.c.restDays.join('/'),'week:'+w+'/'+b.totalWeeks,'subtype:'+String(c&&c.subtype)].forEach(s=>bump(N.dayChgSeg,s));
      changed.push({pk,w,d,t,min:c&&c.dose?mins(c.dose).toFixed(1):'-',sub:c&&c.subtype,cfg:x.c,y,z,k});
    }
  }
}
P('elapsed s',((Date.now()-t0)/1000).toFixed(0),'| configs',N.cfg,'| crashes',JSON.stringify(N.crash),'| days scanned',N.days);
P('programs changed base→CF_A, by plan: '+PLANS.flatMap(p=>[p,p+' multi']).map(p=>p+' '+(N.progA[p]||0)+'/'+(N['_progTotal_'+p]||0)).join(' ; '));
P('programs CF_A2 (anchored "^N sets") ≠ CF_A:',N.progA2vsA,'/',N.cfg,' | programs CF_B ≠ CF_A (NSW limb touching NRC):',N.progBvsA,'/',N.cfg);
P('NRC long-run days by hand tier (race day excluded): A',JSON.stringify(N.longA),' B',JSON.stringify(N.longB),' C',JSON.stringify(N.longC));
P('tier B days with an /explosive/ section  base',JSON.stringify(N.baseExpl),' CF_A',JSON.stringify(N.cfAExpl));
P('tier B days >8 hand-counted sets (doc)  base',JSON.stringify(N.baseDoc8),' CF_A',JSON.stringify(N.cfADoc8));
P('tier B days >8 sets by the engine counter (eng)  base',JSON.stringify(N.baseEng8),' CF_A',JSON.stringify(N.cfAEng8));
P('NRC long-run days with a carry-NAMED item surviving (section label not /carry/): base',N.carryItemSurvive.base,' CF_A',N.carryItemSurvive.cfA);
P('day cards changed base→CF_A',JSON.stringify(N.dayChg),' total',changed.length,' of which not hand-tier B:',N.chgNotB);
P('segments of changed days:'); Object.keys(N.dayChgSeg).sort().forEach(k=>P('   '+String(N.dayChgSeg[k]).padStart(6)+'  '+k));
P('class table (changed days):'); Object.entries(cls).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k));
const shown=new Set(); let printed=0; const LIM=40;
P('changed cards (first per class, then up to '+LIM+' total):');
const order=changed.slice().sort((p,q)=>(shown.has(p.k)?1:0)-(shown.has(q.k)?1:0));
for(const c of changed){ if(printed>=LIM) break; if(shown.has(c.k)&&printed>=Object.keys(cls).length) {} else if(shown.has(c.k)) continue; shown.add(c.k); printed++;
  P(`  ── ${c.pk} W${c.w} ${c.d} "${c.sub}" ${c.min} min tier ${c.t} | ${c.cfg.liftingFocus}/${c.cfg.equipment}/${c.cfg.experience}/${c.cfg.ageBracket}/rest ${c.cfg.restDays.join('+')}/seed ${c.cfg.seed}/dated ${c.cfg.eventTargeted}${c.cfg.raceDate?' '+c.cfg.raceDate:''} | class ${c.k}`);
  P(`    BEFORE "${c.y.title}" doc ${sets(c.y,docN)} / eng ${sets(c.y,engN)}\n`+fmtFull(c.y)); P(`    AFTER  "${c.z.title}" doc ${sets(c.z,docN)} / eng ${sets(c.z,engN)}\n`+fmtFull(c.z)); }
for(const c of changed){ if(printed>=LIM) break; if(c._p) continue; }

// ─────────────── 2. HALF_MANNY ───────────────
P('\n════ 2. HALF_MANNY');
const G=fs.readFileSync(path.join(__dirname,'..','gates','g199_deload_arbitration.js'),'utf8');
const A_PIPE=eval(G.match(/const A_PIPE=(".*");/)[1]);
const A_PIPE_R=eval('['+G.match(/const A_PIPE_R=\[([\s\S]*?)\]\.join\("\\n"\);/)[1]+'].join("\\n")');
const SNAP_FN=eval(G.match(/const SNAP_FN=("[\s\S]*?");\nfunction instrument/)[1]);
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const HM=()=>cl(H.fixtures.HALF_MANNY);
for(const k of ['base','cfA','cfB']){
  const src=fs.readFileSync(ART[k],'utf8');
  const shipped=H.progDigest(L[k].buildProgram(HM())), again=H.progDigest(L[k].buildProgram(HM()));
  const ipf=path.join(S,'d140_instr_'+k+'.html'); try{fs.unlinkSync(ipf);}catch(e){} fs.writeFileSync(ipf,src.replace(A_PIPE,()=>A_PIPE_R));
  const IP=H.load(ipf); IP.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;"); const on=H.progDigest(IP.buildProgram(HM())); IP.eval("globalThis.__DELOAD_OFF=true;"); const off=H.progDigest(IP.buildProgram(HM()));
  const cpf=path.join(S,'d140_coreoff_'+k+'.html'); try{fs.unlinkSync(cpf);}catch(e){} fs.writeFileSync(cpf,src.replace(CLAUSE,''));
  const core=H.progDigest(H.load(cpf).buildProgram(HM()));
  P(`${k.padEnd(5)} shipped ${shipped} (self ${again===shipped?'==':'!='}) | A_PIPE count ${src.split(A_PIPE).length-1}, instrumented ON ${on} | DELOAD_OFF ${off} | CLAUSE count ${src.split(CLAUSE).length-1}, CORE_OFF ${core}`);
}
P('era rows [207]: shipped',H.MANNY_DIGEST_BY_VERSION[207],'deload-off',H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207],'core-off',H.MANNY_CORE_OFF_DIGEST_BY_VERSION[207]);
{ const b=L.base.buildProgram(HM()), a=L.cfA.buildProgram(HM()); let nb=0,nch=0;
  for(let w=1;w<=b.totalWeeks;w++) for(const d of DAYS){ const y=b.weeks[w][d], z=a.weeks[w][d]; if(!y) continue; const c=y.cardio; const t=isNrcLong(c)?handTier(c):null;
    if(t) P(`  HM W${w} ${d} "${c.subtype}" ${mins(c.dose).toFixed(1)} min hand tier ${t} | base doc ${sets(y,docN)} eng ${sets(y,engN)} | explosive sec ${(y.sections||[]).some(s=>/explosive/i.test(s.label||''))} | ${fmt(y)}`);
    if(js(y)!==js(z)){ nch++; P(`  CHANGED W${w} ${d}\n    BEFORE\n`+fmtFull(y)+'\n    AFTER\n'+fmtFull(z)); } }
  P('HALF_MANNY day cards changed base→CF_A:',nch); }

// ─────────────── 3. NSW on CF_B ───────────────
P('\n════ 3. NSW');
const STAND={name:'PRT TING',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
{ const b=L.base.buildProgram(cl(STAND)), n=L.cfN.buildProgram(cl(STAND)), a=L.cfB.buildProgram(cl(STAND));
  P('stand-in totalWeeks',b.totalWeeks,'train days/wk',7-STAND.restDays.length);
  for(let w=1;w<=a.totalWeeks;w++){ const x=b.weeks[w].sat, m=n.weeks[w].sat, y=a.weeks[w].sat; const c=y.cardio;
    P(`W${w} SAT "${c&&c.subtype}" key=${c&&c.dose&&c.dose.key} ${c&&c.dose?mins(c.dose).toFixed(1):'-'} min hand ${isNswLong(c)?handTier(c):'n/a'}`);
    P(`  BASE  "${x.title}" doc ${sets(x,docN)} / eng ${sets(x,engN)}\n`+fmtFull(x));
    P(`  CF_N  "${m.title}" doc ${sets(m,docN)} / eng ${sets(m,engN)}${js(m)===js(y)?'  (== CF_B)':''}`);
    P(`  CF_B  "${y.title}" doc ${sets(y,docN)} / eng ${sets(y,engN)}\n`+fmtFull(y)); } }
// m6b lattice, verbatim, three artifacts
const cfgs=[];
[['run_pace_goal','8','15',['run']],['run_mile_time','8','15',['run']],['run_15_under10','8','15',['run']],['run_base','8','15',['run']],['run_pace_goal','12','0',['run']],['run_base','12','0',['run']],['run_pace_goal','8','15',['run','bike']],['run_pace_goal','8','15',['run','swim']]].forEach(([g,mm,ss,T])=>
 [24865,1001,7007].forEach(seed=>['home_full','crossfit','bodyweight','full_gym'].forEach(eq=>['balanced','hypertrophy','support_prevention'].forEach(f=>{
  const c=cl(STAND);c.cardioGoals.run.id=g;c.cardioGoals.run.mileBestMins=mm;c.cardioGoals.run.mileBestSecs=ss;c.cardioTypes=T.slice();
  if(T.includes('bike'))c.cardioGoals.bike={id:'bike_base',label:'Base',baselineDist:'10',baseline:'10mi'};
  if(T.includes('swim'))c.cardioGoals.swim={id:'swim_base',label:'Base',baselineDist:'1000',baseline:'1000m'};
  c.seed=seed;c.equipment=eq;c.liftingFocus=f;cfgs.push({tag:g+'/'+mm+':'+ss+'/'+T.join('+'),c});}))));
const EXPL_BROAD=/explosive|finisher|plyo|conditioning/i;
for(const K of ['base','cfN','cfB']){ const st={}, ex={}; const note=(k,v)=>{if(!ex[k])ex[k]=v;};
  cfgs.forEach(({tag,c})=>{ const b0=L.base.buildProgram(cl(c)), y0=L[K].buildProgram(cl(c));
    for(let w=1;w<=y0.totalWeeks;w++) DAYS.forEach(d=>{ const y=y0.weeks[w][d], x=b0.weeks[w][d]; if(!y) return; const cd=y.cardio;
      if(!isNswLong(cd)){ if(js(x)!==js(y)){bump(st,'NON-LONG day changed vs base');note('NON-LONG day changed vs base',tag+' W'+w+' '+d);} return; }
      const t=handTier(cd); bump(st,'long days tier '+t);
      if(t==='A'){ if(y.title!=='Post-Run Mobility'||(y.sections||[]).some(s=>!/post-run mobility|taper/i.test(s.label||''))){bump(st,'A not mobility-only');note('A not mobility-only',tag+' W'+w+' '+d+' '+fmt(y));} }
      if(t==='B'){ const dn=sets(y,docN), en=sets(y,engN);
        if(dn>8){bump(st,'B doc sets > 8');note('B doc sets > 8',tag+' W'+w+' '+d+' doc '+dn+' eng '+en+' '+fmt(y));}
        if(en>8) bump(st,'B eng sets > 8');
        if((y.sections||[]).some(s=>/explosive/i.test(s.label||''))){bump(st,'B /explosive/ section');note('B /explosive/ section',tag+' W'+w+' '+d+' '+fmt(y));}
        if((y.sections||[]).some(s=>EXPL_BROAD.test(s.label||''))){bump(st,'B explosive|finisher|plyo|conditioning section (m6b regex)');note('B explosive|finisher|plyo|conditioning section (m6b regex)',tag+' W'+w+' '+d+' '+fmt(y));}
        if((y.sections||[]).some(s=>/power|carry/i.test(s.label||''))) bump(st,'B power/carry section');
        if((y.sections||[]).some(s=>(s.items||[]).some(i=>LEG.test(i.name||'')))){bump(st,'B leg-rx item');note('B leg-rx item',tag+' W'+w+' '+d+' '+fmt(y));}
        if((y.sections||[]).some(s=>(s.items||[]).some(i=>/burpee|mountain climber|slam|thruster|jumping jack/i.test(i.name||'')))){bump(st,'B burpee/climber/slam/thruster item');note('B burpee/climber/slam/thruster item',tag+' W'+w+' '+d+' '+fmt(y));} }
      if(t==='C'){ const strip=z=>js({...z,sections:(z.sections||[]).filter(s=>!/carry/i.test(s.label||''))});
        if(strip(x)!==strip(y)){bump(st,'C differs from base beyond carry sections');note('C differs from base beyond carry sections',tag+' W'+w+' '+d+'\n      base '+fmt(x)+'\n      '+K+' '+fmt(y));}
        if(js(x)!==js(y)) bump(st,'C differs from base at all'); }
    }); });
  P('── NSW m6b lattice ('+cfgs.length+' configs) on '+K+':'); Object.keys(st).sort().forEach(k=>P(String(st[k]).padStart(7),k)); Object.keys(ex).forEach(k=>P('   e.g. '+k+': '+ex[k]));
}
// carry search on NSW long days (base = what is dealt before any NSW limb; cfB = after)
P('── NSW carry search: 4 goals × 6 focus × 5 equip × 5 rests × 3 exp × 2 seeds');
const cs={}; const cex=[]; let cN=0;
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const f of FOC) for(const q of EQ) for(const r of RESTS) for(const e of EXP) for(const seed of [24865,1001]){
  const c=cl(STAND); c.cardioGoals.run.id=g; c.liftingFocus=f; c.equipment=q; c.restDays=r.slice(); c.experience=e; c.seed=seed; cN++;
  const b=L.base.buildProgram(cl(c)), a=L.cfB.buildProgram(cl(c));
  for(let w=1;w<=b.totalWeeks;w++) DAYS.forEach(d=>{ const x=b.weeks[w][d], y=a.weeks[w][d]; if(!x||!isNswLong(x.cardio)) return; const t=handTier(x.cardio); bump(cs,'long days tier '+t);
    const secC=(x.sections||[]).some(s=>/carry/i.test(s.label||'')), itC=(x.sections||[]).some(s=>(s.items||[]).some(i=>/carry/i.test(i.name||'')));
    if(secC) bump(cs,'base: /carry/ section label, tier '+t); if(itC) bump(cs,'base: carry-named item, tier '+t);
    if(itC&&!secC) bump(cs,'base: carry item in a NON-carry-labeled section, tier '+t);
    const aSec=(y.sections||[]).some(s=>/carry/i.test(s.label||'')), aIt=(y.sections||[]).some(s=>(s.items||[]).some(i=>/carry/i.test(i.name||'')));
    if(aSec) bump(cs,'cfB: /carry/ section label survives, tier '+t); if(aIt) bump(cs,'cfB: carry-named item survives, tier '+t);
    if((secC||itC)&&cex.length<4&&!cex.some(z=>z.t===t)) cex.push({t,g,f,q,r,e,seed,w,d,x,y}); }); }
P('configs',cN); Object.keys(cs).sort().forEach(k=>P(String(cs[k]).padStart(7),k));
cex.forEach(z=>{ P(`  EXAMPLE tier ${z.t}: ${z.g} focus ${z.f} equip ${z.q} rest ${z.r.join('+')} exp ${z.e} seed ${z.seed} (stand-in otherwise) W${z.w} ${z.d} "${z.x.cardio.subtype}" ${mins(z.x.cardio.dose).toFixed(1)} min`);
  P('    BASE "'+z.x.title+'"\n'+fmtFull(z.x)); P('    CF_B "'+z.y.title+'"\n'+fmtFull(z.y)); });
P('\nDONE');
