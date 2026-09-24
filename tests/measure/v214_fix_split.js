// v214_fix_split.js — MODE B pre-build measure for the V214 fix split. Read-only against index.html.
// Copies (scratch): V213 = git show HEAD:index.html (bc3cccc); V214 = the working-tree candidate (meta 214, uncommitted), copied;
//   COPY = V214 with D158's shakeout insert gated off the protect-park modes:
//   "    if(_pin.test && cardioGoals.run){\n" -> "    if(_pin.test && cardioGoals.run && !_d113Excl){\n"   (anchor count 1)
//   so under noimpact / noimpact_swim / easy / reduce the eve keeps V213's handling (no shakeout, eve left in _pin.rest).
// Lattice = gatekeeper's v214_gk_eve_lifts.js, verbatim: pace / pace+bike / pace+swim x every 3,4,5,6-day calendar (98) x
//   7 injury modes (none, easy, noimpact, noimpact_swim, reduce, swimout, halfstep) x 4 test placements (tw1 thu, tw2 sat,
//   tw3 sun, tw4 mon) = 8,232 dated programs, each built on V213, V214 and COPY.
// ORACLE. Offset = calendar days from the test day (date arithmetic over the flattened ISO weeks; negative = before).
// "lift role" of a day = its title when it carries a lift section (items present, label not mobility/stretch/taper,
// the gatekeeper's isLift), plus the labels and item names of those sections. A lift-role change = either differs.
// Shakeout present = one run card, "Long Slow Distance (LSD)" text, legLoad false, no lift section on the eve.
//   node v214_fix_split.js prep  <outdir>
//   node v214_fix_split.js split <outdir> <shard> <n>
//   node v214_fix_split.js report <outdir> <n>
const fs=require('fs'),path=require('path'),cp=require('child_process');
const REPO=path.join(__dirname,'..','..'); const H=require(path.join(REPO,'tests','harness.js'));
const clone=v=>JSON.parse(JSON.stringify(v)); const DAYS=['mon','tue','wed','thu','fri','sat','sun'],ALL=['sun','mon','tue','wed','thu','fri','sat'];
function canon(v){ if(v===null||typeof v!=='object') return JSON.stringify(v)===undefined?'null':JSON.stringify(v); if(Array.isArray(v)) return '['+v.map(canon).join(',')+']'; return '{'+Object.keys(v).filter(k=>!/^(id|created)$/.test(k)).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'; }
function combos(a,k){const out=[];(function rec(i,cur){if(cur.length===k){out.push(cur.slice());return;}for(let j=i;j<a.length;j++){cur.push(a[j]);rec(j+1,cur);cur.pop();}})(0,[]);return out;}
const mb={mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'}};const pace={id:'run_pace_goal',label:'P',...mb,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'};
const isLift=s=>!!s&&(s.items||[]).length&&!/mobility|stretch|taper/i.test(s.label||'');
const MIX=[['pace',['run'],{run:pace}],['pace+bike',['run','bike'],{run:pace,bike:{id:'bike_base',label:'B'}}],['pace+swim',['run','swim'],{run:pace,swim:{id:'swim_base',label:'S'}}]];
const INJ={none:null,easy:{region:'lowback',tier:'workaround'},noimpact:{region:'knee',tier:'protect'},noimpact_swim:{region:'lowback',tier:'protect'},reduce:{region:'ankle',tier:'workaround'},swimout:{region:'shoulder',tier:'protect'},halfstep:{region:'knee',halfstep:true}};
const EXCL=new Set(['easy','noimpact','noimpact_swim','reduce']);
const cards=x=>x?[].concat(x.cardio||[]).filter(Boolean):[];
const liftSig=x=>{ if(!x) return 'none'; const L=(x.sections||[]).filter(isLift); return L.length ? (x.title||'')+' ['+L.map(s=>(s.label||'')+':'+(s.items||[]).map(i=>String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'')).join(',')).join(' | ')+']' : 'none'; };
const roleOf=x=>(!x||!(x.sections||[]).some(isLift))?'-':(x.title||'?');
function prep(outdir){
  const put=(n,s)=>{ fs.mkdirSync(path.join(outdir,n),{recursive:true}); fs.writeFileSync(path.join(outdir,n,'index.html'),s); };
  const v213=cp.execSync('git show HEAD:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28}), v214=fs.readFileSync(path.join(REPO,'index.html'),'utf8');
  const vv=s=>(s.match(/name="ia-version" content="(\d+)"/)||[])[1]; console.log('[prep] HEAD',cp.execSync('git rev-parse --short HEAD',{cwd:REPO,encoding:'utf8'}).trim(),'meta',vv(v213),'| working tree meta',vv(v214),'sha1',require('crypto').createHash('sha1').update(v214).digest('hex').slice(0,12));
  const A="    if(_pin.test && cardioGoals.run){\n", B="    if(_pin.test && cardioGoals.run && !_d113Excl){\n"; const c=v214.split(A).length-1; console.log('[prep] anchor count',c,'at line',v214.slice(0,v214.indexOf(A)).split('\n').length); if(c!==1) throw new Error('anchor');
  const dc=v214.split('const _d113Excl').length-1; console.log('[prep] _d113Excl declarations',dc,'at line',v214.slice(0,v214.indexOf('const _d113Excl')).split('\n').length);
  put('V213',v213); put('V214',v214); put('COPY',v214.replace(A,B)); console.log('[prep] wrote V213 V214 COPY');
}
function split(outdir,sh,n){
  const [B,C,X]=['V213','V214','COPY'].map(l=>H.load(path.join(outdir,l,'index.html'))); const rows=[]; let i=-1, crash=0;
  for(const [gk,types,goals] of MIX)for(const nn of [3,4,5,6])for(const cal of combos(DAYS,nn))for(const mode of Object.keys(INJ))for(const [tw,wd] of [[1,3],[2,5],[3,6],[4,0]]){ i++; if(i%n!==sh) continue;
    const d=new Date(2026,9,5+7*(tw-1)+wd);const rd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const cfg={name:'GK',primaryPath:'event',eventTargeted:true,raceDate:rd,_testWeek:tw,_raceDateCappedWeeks:tw,cardioTypes:types,cardioGoals:clone(goals),liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:ALL.filter(x=>!cal.includes(x)),days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-10-05',seed:24865}; if(INJ[mode]) cfg.injury=INJ[mode];
    let P; try{ P=[B,C,X].map(I=>clone(I.buildProgram(clone(cfg)))); }catch(e){ crash++; continue; }
    const flat=[]; for(const w of Object.keys(P[2].weeks).map(Number).sort((a,b)=>a-b)) for(const dd of DAYS) flat.push({w,d:dd}); const ti=flat.findIndex(z=>z.w===tw&&z.d===DAYS[wd]);
    const cell=(p,z)=>p.weeks[z.w]&&p.weeks[z.w][z.d];
    const diffs=(p,q)=>{ const out=[]; flat.forEach((z,j)=>{ const a=cell(p,z), b=cell(q,z); if(canon(a)===canon(b)) return; const off=j-ti;
      out.push({off, w:z.w, d:z.d, roleA:roleOf(a), roleB:roleOf(b), liftChg:liftSig(a)!==liftSig(b), cardioChg:canon(a&&a.cardio)!==canon(b&&b.cardio), titleA:a&&a.title, titleB:b&&b.title,
        cA:cards(a).map(c=>c.type+':'+String(c.subtype||'').slice(0,34)).join('+'), cB:cards(b).map(c=>c.type+':'+String(c.subtype||'').slice(0,34)).join('+')}); }); return out; };
    const E=ti>=1?flat[ti-1]:null; const eveTrain=!!E&&cal.includes(E.d);
    const shake=p=>{ if(!E) return null; const x=cell(p,E); const cs=cards(x); return cs.length===1&&cs[0].type==='run'&&/^Long Slow Distance/.test(cs[0].subtype||'')&&!cs[0].legLoad&&!(x.sections||[]).some(isLift); };
    const eveLift=p=>!!E&&!!cell(p,E)&&(cell(p,E).sections||[]).some(isLift);
    rows.push({gk,cal:cal.join(''),mode,excl:EXCL.has(mode),tw,T:DAYS[wd],eveTrain,
      dBC:diffs(P[0],P[1]), dBX:diffs(P[0],P[2]), XeqC:canon(P[1])===canon(P[2]), XeqB:canon(P[0])===canon(P[2]),
      eveXeqB:!E||canon(cell(P[0],E))===canon(cell(P[2],E)), eveLiftB:eveLift(P[0]), eveLiftX:eveLift(P[2]), eveLiftC:eveLift(P[1]), shakeX:shake(P[2]), shakeC:shake(P[1])}); }
  fs.writeFileSync(path.join(outdir,'fs_'+sh+'.json'),JSON.stringify({crash,rows})); console.log(`[split ${sh}/${n}] rows ${rows.length} crash ${crash}`);
}
function report(outdir,n){
  let rows=[],crash=0; for(let s=0;s<n;s++){ const j=JSON.parse(fs.readFileSync(path.join(outdir,'fs_'+s+'.json'),'utf8')); rows=rows.concat(j.rows); crash+=j.crash; }
  console.log(`[report] programs ${rows.length} (x3 artifacts) crash ${crash}`);
  const ex=rows.filter(r=>r.excl), kp=rows.filter(r=>!r.excl);
  console.log(`(a) exclusion-key modes: programs ${ex.length}; eve cell COPY == V213 ${ex.filter(r=>r.eveXeqB).length}/${ex.length}; new eve lifts (COPY lifts where V213 did not) ${ex.filter(r=>r.eveLiftX&&!r.eveLiftB).length} [V214 candidate: ${ex.filter(r=>r.eveLiftC&&!r.eveLiftB).length}]; whole program COPY == V213 ${ex.filter(r=>r.XeqB).length}/${ex.length}`);
  const bym={}; ex.forEach(r=>{ const k=r.mode; const a=bym[k]=bym[k]||{n:0,eq:0,eve:0}; a.n++; if(r.XeqB) a.eq++; if(r.eveXeqB) a.eve++; }); console.log('    by mode (program == V213 / eve == V213): '+Object.keys(bym).sort().map(k=>`${k} ${bym[k].eq}/${bym[k].n} ${bym[k].eve}/${bym[k].n}`).join('  '));
  const bucket=o=>o<=-3?'T-3 and earlier':o===-2?'T-2':o===-1?'T-1 (eve)':o===0?'T0 (test day)':'after the test';
  [['V214 candidate vs V213','dBC'],['COPY vs V213','dBX']].forEach(([nm,f])=>{
    console.log(`\n(b) ${nm}: moved cells by offset x mode x mix  [cells | of which lift-role change | cardio change]`);
    const s={}; let progs=0; rows.forEach(r=>{ if(r[f].length) progs++; r[f].forEach(c=>{ const k=bucket(c.off).padEnd(16)+' '+r.mode.padEnd(13)+' '+r.gk; const a=s[k]=s[k]||{n:0,l:0,c:0}; a.n++; if(c.liftChg) a.l++; if(c.cardioChg) a.c++; }); });
    console.log(`    programs with any moved cell ${progs}/${rows.length}`); Object.keys(s).sort().forEach(k=>console.log(`    ${k.padEnd(44)} ${String(s[k].n).padStart(5)} | ${s[k].l} | ${s[k].c}`));
    const T={}; rows.forEach(r=>r[f].forEach(c=>{ if(c.off<-2||c.off>0||!c.liftChg) return; const k=bucket(c.off)+' '+r.mode+' '+r.gk+' '+c.roleA+' -> '+c.roleB; (T[k]=T[k]||{n:0,eg:null}).n++; if(!T[k].eg) T[k].eg=`${r.cal} tw${r.tw}${r.T} W${c.w}${c.d} | V213 "${c.titleA}" ${c.cA||'-'} -> "${c.titleB}" ${c.cB||'-'}`; }));
    const tot=Object.values(T).reduce((a,b)=>a+b.n,0); console.log(`    LIFT-ROLE/LIFT-CONTENT CHANGES ON T-2 / T-1 / T0: ${tot}`); Object.keys(T).sort().forEach(k=>console.log(`      ${String(T[k].n).padStart(4)} ${k}\n           e.g. ${T[k].eg}`)); });
  console.log(`\n(c) non-excluded modes (none, halfstep, swimout): programs ${kp.length}; COPY == V214 candidate ${kp.filter(r=>r.XeqC).length}/${kp.length}; training-day eves ${kp.filter(r=>r.eveTrain).length}: shakeout missing on COPY ${kp.filter(r=>r.eveTrain&&!r.shakeX).length} (V214 ${kp.filter(r=>r.eveTrain&&!r.shakeC).length})`);
  console.log(`    exclusion modes, COPY == V214 candidate ${ex.filter(r=>r.XeqC).length}/${ex.length} (expected to differ: the fix)`);
}
// GKCLASS: gatekeeper's v214_gk_lattice.js config generator, verbatim (7 goals x 3-6-day calendars x injury cycle x
// 25 dated test placements for NSW goals), every moved cell of COPY and of V214 classified by offset from the test and by
// lift-role change, plus every top-level (non-weeks) key that moved. Also: lifts on T-1/T-2 that V213 ALREADY ships
// under the exclusion modes (the trial is parked by the injury sweep, so no race-eve window exists).
function gkclass(outdir,sh,n){
  const [B,C,X]=['V213','V214','COPY'].map(l=>H.load(path.join(outdir,l,'index.html'))); const plan=C.eval('injuryPlan');
  const mile={id:'run_mile_time',label:'M',...mb,targetDist:'1',targetMins:'7',targetSecs:'0',paceUnit:'mi'};
  const GOALS=[{k:'pace',types:['run'],goals:{run:pace},nsw:true},{k:'mile',types:['run'],goals:{run:mile},nsw:true},
    {k:'pace+bike',types:['run','bike'],goals:{run:pace,bike:{id:'bike_base',label:'B'}},nsw:true},{k:'pace+swim',types:['run','swim'],goals:{run:pace,swim:{id:'swim_base',label:'S'}},nsw:true},
    {k:'half',types:['run'],goals:{run:{id:'run_half',label:'H',...mb,baselineDist:'5',baseline:'5mi'}},nrc:true},
    {k:'10k+bike',types:['run','bike'],goals:{run:{id:'run_10k',label:'10',...mb},bike:{id:'bike_base',label:'B'}},nrc:true},{k:'base',types:['run'],goals:{run:{id:'run_base',label:'Ba',...mb}}}];
  const CALS=[...combos(DAYS,3),...combos(DAYS,4),...combos(DAYS,5),...combos(DAYS,6).filter((_,i)=>i%2===0)];
  const INJG=[null,null,null,{region:'knee',halfstep:true},{region:'lowback',tier:'workaround'},{region:'shoulder',tier:'protect'}];
  const START=new Date(2026,9,5); const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const out=[]; let idx=-1, crash=0;
  for(const G of GOALS) for(const cal of CALS){ idx++;
    const rest=ALL.filter(d=>!cal.includes(d)), inj=INJG[idx%INJG.length];
    const base={name:'GK',primaryPath:'event',cardioTypes:G.types.slice(),cardioGoals:clone(G.goals),liftingFocus:['balanced','strength','support_prevention'][idx%3],experience:['beginner','intermediate','advanced'][(idx>>1)%3],ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:rest,days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:iso(START),seed:24865};
    if(inj) base.injury=inj;
    const V=[{k:'undated',cfg:{...base,eventTargeted:false,raceDate:''}}];
    if(G.nsw){ for(const tw of [1,2,3,5,8]) for(const wd of [0,1,3,5,6]){ const d=new Date(START); d.setDate(d.getDate()+7*(tw-1)+wd); V.push({k:'tw'+tw+DAYS[wd],tw,T:DAYS[wd],cfg:{...base,eventTargeted:true,raceDate:iso(d),_testWeek:tw,_raceDateCappedWeeks:tw}}); } }
    else if(G.nrc) V.push({k:'race',cfg:{...base,eventTargeted:true,raceDate:'2026-12-06'}});
    for(const v of V){ const j=out.length+crash; if((idx*31+V.indexOf(v))%n!==sh) continue;
      let P; try{ P=[B,C,X].map(I=>clone(I.buildProgram(clone(v.cfg)))); }catch(e){ crash++; continue; }
      const mode=(inj&&(plan(v.cfg)||{}).cardioMode)||(inj&&inj.halfstep?'halfstep':'none'); const excl=EXCL.has(mode);
      const flat=[]; for(const w of Object.keys(P[2].weeks).map(Number).sort((a,b)=>a-b)) for(const dd of DAYS) flat.push({w,d:dd});
      const ti=v.tw?flat.findIndex(z=>z.w===v.tw&&z.d===v.T):-999;
      const cell=(p,z)=>p.weeks[z.w]&&p.weeks[z.w][z.d];
      const top=p=>{ const o={}; Object.keys(p).filter(k=>!['weeks','cfg'].includes(k)).forEach(k=>o[k]=canon(p[k])); return o; };
      const diff=(p,q)=>{ const cells=[]; flat.forEach((z,jj)=>{ const a=cell(p,z),b=cell(q,z); if(canon(a)===canon(b)) return; cells.push({off:v.tw?jj-ti:null,w:z.w,d:z.d,liftChg:liftSig(a)!==liftSig(b),roleA:roleOf(a),roleB:roleOf(b),cardioChg:canon(a&&a.cardio)!==canon(b&&b.cardio),tA:a&&a.title,tB:b&&b.title}); });
        const ta=top(p),tb=top(q); const tk=Array.from(new Set(Object.keys(ta).concat(Object.keys(tb)))).filter(k=>ta[k]!==tb[k]); return {cells,tk,tkEg:tk.length?tk[0]+': '+String(ta[tk[0]]).slice(0,120)+' -> '+String(tb[tk[0]]).slice(0,120):null}; };
      const lifted=(p,k)=>{ if(!v.tw||ti-k<0) return false; const x=cell(p,flat[ti-k]); return !!x&&(x.sections||[]).some(isLift); };
      out.push({g:G.k,cal:cal.join(''),mode,excl,tag:v.k,tw:v.tw||0,dC:diff(P[0],P[1]),dX:diff(P[0],P[2]),preLift1:lifted(P[0],1),preLift2:lifted(P[0],2),trialB:!!v.tw&&Object.values(P[0].weeks).some(w=>DAYS.some(d=>cards(w[d]).some(c=>/TIME TRIAL/.test(c.subtype||''))))}); } }
  fs.writeFileSync(path.join(outdir,'gc_'+sh+'.json'),JSON.stringify({crash,rows:out})); console.log(`[gkclass ${sh}/${n}] rows ${out.length} crash ${crash}`);
}
function gkreport(outdir,n){
  let rows=[],crash=0; for(let s=0;s<n;s++){ const j=JSON.parse(fs.readFileSync(path.join(outdir,'gc_'+s+'.json'),'utf8')); rows=rows.concat(j.rows); crash+=j.crash; }
  console.log(`[gkreport] configs ${rows.length} crash ${crash}`);
  const bucket=o=>o===null?'undated/NRC':o<=-3?'T-3 and earlier':o===-2?'T-2':o===-1?'T-1 (eve)':o===0?'T0':'after test';
  [['V214','dC'],['COPY','dX']].forEach(([nm,f])=>{ const s={}; let tops=0; const tkc={}; const T=[];
    rows.forEach(r=>{ const D=r[f]; if(D.tk.length){ tops++; D.tk.forEach(k=>{ tkc[r.mode+' '+k]=(tkc[r.mode+' '+k]||0)+1; }); }
      D.cells.forEach(c=>{ const k=bucket(c.off).padEnd(16)+' '+r.mode.padEnd(13)+' '+(c.liftChg?'LIFT':'nolift')+' '+(c.cardioChg?'cardio':'nocardio'); s[k]=(s[k]||0)+1;
        if(c.off!==null&&c.off>=-2&&c.off<=0&&c.liftChg&&T.length<400) T.push(`${bucket(c.off)} ${r.mode} ${r.g} ${r.cal} ${r.tag} W${c.w}${c.d} "${c.tA}" -> "${c.tB}"`);
        if(c.off!==null&&c.off<=-3&&c.liftChg) (s['   eg T-3- '+r.mode]=s['   eg T-3- '+r.mode]||`${r.g} ${r.cal} ${r.tag} W${c.w}${c.d} off ${c.off} "${c.tA}" -> "${c.tB}"`); }); });
    console.log(`\n== ${nm} vs V213 on the gatekeeper lattice: moved cells by offset x mode x lift/cardio; programs with top-level moves ${tops}`);
    Object.keys(s).sort().forEach(k=>console.log('   '+(typeof s[k]==='number'?String(s[k]).padStart(5)+' '+k:k+': '+s[k])));
    console.log('   top-level keys moved (mode key: programs): '+JSON.stringify(tkc)); const eg=rows.find(r=>r[f].tk.length); if(eg) console.log('   e.g. '+eg.g+' '+eg.cal+' '+eg.mode+' '+eg.tag+' '+eg[f].tkEg);
    console.log(`   lift-role/content changes on T-2/T-1/T0: ${T.length}`); const agg={}; T.forEach(t=>{ const k=t.split(' ').slice(0,3).join(' '); agg[k]=(agg[k]||0)+1; }); console.log('     '+JSON.stringify(agg)); T.slice(0,6).forEach(t=>console.log('     e.g. '+t)); });
  const ex=rows.filter(r=>r.excl&&r.tw); console.log(`\nV213 itself under exclusion modes (dated): programs ${ex.length}; with a TIME TRIAL card ${ex.filter(r=>r.trialB).length}; lift on T-1 ${ex.filter(r=>r.preLift1).length}; lift on T-2 ${ex.filter(r=>r.preLift2).length}`);
}
const [mode,a1,a2,a3]=process.argv.slice(2);
if(mode==='gkclass'){ gkclass(a1,+a2,+a3); process.exit(0); }
if(mode==='gkreport'){ gkreport(a1,+a2); process.exit(0); }
if(mode==='prep') prep(a1); else if(mode==='split') split(a1,+a2,+a3); else if(mode==='report') report(a1,+a2);
else { console.error('usage: prep|split|report'); process.exit(2); }
