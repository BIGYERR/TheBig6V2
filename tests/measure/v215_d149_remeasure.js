'use strict';
// v215_d149_remeasure.js — D149 (the GHD is a station) before-picture on V214. Read-only.
//   node tests/measure/v215_d149_remeasure.js <scratchdir> [conc]
// Arms (built into <scratchdir>, deleted first):
//   base = index.html (V214)
//   cf0  = base + D149 slice 4 (the three parked edits, verbatim) + slice 5 (D4a ankle/protect _gear, D4b hip/protect hasGHD)
//   cfa  = cf0 + knee/protect second member placed IN the _gear list (every barbell tier sees a 4-name list)
//   cfb  = cf0 + knee/protect second member appended only when the gear-filtered list has < 2 names (home_full only in practice)
// Oracles: GHD class from the movement NAME (g210's O2 table, token list /glute[- ]ham|ghr|ghd|45° back extension|roman chair/);
// literal cells = ankle/protect + hip/protect (where the ruled literals live); long-run tier from dose minutes
// (75/45 cuts, D18 text) and long-run identity by subtype (NRC) / dose.key 'long' (NSW); section class from the label.
// The suspect (_gearOK/_auxGearOK) is never asked for an answer.
const fs=require('fs'), path=require('path'), cp=require('child_process');
const ROOT=path.join(__dirname,'..','..'); const H=require(path.join(ROOT,'tests','harness.js'));
const P=(...a)=>console.log(...a); const DAYS=H.DAYS;
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const ARMS=['base','cf0','cfa','cfb'];

const KP_OLD="squatPool = hasBarbell?_gear(['Barbell hip thrust','45° back extension','Cable pull-through']):";
const EDITS={
 S4:[["  const hasCables=equip==='commercial';","  const hasCables=equip==='commercial';\n  const hasGHD=equip==='commercial'||isCrossfit;"],
     ["|close-grip bench|glute-ham/i.test(N)) return false;","|close-grip bench/i.test(N)) return false;\n    if(!hasGHD && /glute-ham|\\bghr\\b|45° back extension/i.test(N)) return false;"],
     ["  if(/cable|pec deck/.test(N)) return equip==='commercial';","  if(/glute-ham|\\bghr\\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';\n  if(/cable|pec deck/.test(N)) return equip==='commercial';"]],
 S5:[["squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?['Barbell hip thrust','45° back extension']:['Banded hip thrust','Single-leg glute bridge'];",
      "squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];"],
     ["        hipExtPool = ['45° back extension'];","        hipExtPool = hasGHD?['45° back extension']:['Bodyweight back extension'];"]],
 KPA:[[KP_OLD,"squatPool = hasBarbell?_gear(['Barbell hip thrust','45° back extension','Cable pull-through','Single-leg glute bridge']):"]],
 KPB:[[KP_OLD,"squatPool = hasBarbell?(p=>p.length>1?p:p.concat(['Single-leg glute bridge']))(_gear(['Barbell hip thrust','45° back extension','Cable pull-through'])):"]],
};
const cnt=(s,a)=>s.split(a).length-1;
const apply=(s,list,tag)=>{ list.forEach(([a,b],i)=>{ const c=cnt(s,a); if(c!==1) throw new Error('ANCHOR '+tag+'-'+(i+1)+' count '+c); s=s.replace(a,()=>b); }); return s; };

// ── oracles ──
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const GHD=n=>/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/i.test(n);
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const handTier=c=>{ if(!c||!c.dose) return null; const m=mins(c.dose); if(!m) return null; if(c.isNRC&&/rehearsal/i.test(c.detail||'')) return 'A'; return m>=75?'A':m>=45?'B':'C'; };
const isLong=c=>!!(c&&c.dose&&((c.isNRC&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''))||(!c.isNRC&&c.type==='run'&&c.dose.key==='long')));
const secClass=s=>{ if(/taper/i.test(s.label||'')) return 'taper'; if(s.coreHeader||s.core||/^trunk|core/i.test(s.label||'')) return 'core'; if(/mobility|stretch/i.test(s.label||'')) return 'mobility'; if(s.hip) return 'hip'; return 'lift'; };
const live=d=>(d&&d.sections||[]).filter(s=>(s.items||[]).length);
const LIFTDAY=/^(Push|Pull|Legs|Full Body|Strength Support|Posterior Chain|Leg Strength|Recovery Lift|Upper|Lower)/;
const lab=s=>String(s.label||(s.coreHeader?'{core}':'(none)')).replace(/\s*[—-]\s.*$/,'');
const card=d=>JSON.stringify((d&&d.sections||[]).map(s=>[s.label,(s.items||[]).map(i=>[clean(i.name),i.detail])]));

// ── lattices ──
const GOALSL1=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'], RESTS=[['sun','wed'],['sat','sun']];
const SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
const REG=['shoulder','elbow','lowback','hip','knee','ankle'], ITIER=['workaround','protect'];
const base=(g,x,f,exp,age,eq,rest,seed,inj)=>{ const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed}; if(inj) c.injury=inj; return c; };
function lattice(L,eq,part){
  const out=[];
  if(L==='L1'){ // g210's V210-era lattice, verbatim construction
    for(let si=0;si<SEEDS.length;si++){
      for(const f of FOC) for(const e of EXPS) for(const a of AGES){ const [g,x]=GOALSL1[(si+FOC.indexOf(f))%6]; out.push({f,inj:null,c:base(g,x,f,e,a,eq,RESTS[si%2],SEEDS[si])}); }
      for(const r of REG) for(const t of ITIER){ const [g,x]=GOALSL1[(si+FOC.indexOf('hypertrophy'))%6]; out.push({f:'hypertrophy',inj:{region:r,tier:t},c:base(g,x,'hypertrophy',EXPS[si%3],AGES[si%3],eq,RESTS[si%2],SEEDS[si],{region:r,tier:t})}); } }
  } else if(L==='L2'){ // v209_d70c_blast / v210_d70c_remeasure_b tier B lattice (healthy)
    for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of EXPS) for(const age of ['18-35','55+']) for(const rest of RESTS) for(const seed of [76308,1234]) out.push({f,inj:null,c:base(g,GOALS[g],f,exp,age,eq,rest,seed)});
  } else { // L3 injured slice: 12 plans x 6 goals x 7 foci x 3 exp x 2 seeds (age alternates)
    const regs=part==='a'?['knee','ankle','hip']:['lowback','shoulder','elbow'];
    for(const r of regs) for(const t of ITIER) for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of EXPS) for(const [si,seed] of [[0,76308],[1,1234]]) out.push({f,inj:{region:r,tier:t},c:base(g,GOALS[g],f,exp,si?'55+':'18-35',eq,RESTS[si],seed,{region:r,tier:t})});
  }
  return out;
}

// ── worker ──
if(process.argv[2]==='--shard'){
  const [,, ,dir,L,eq,part]=process.argv; const IA={}; ARMS.forEach(k=>IA[k]=H.load(path.join(dir,'arm_'+k+'.html')));
  const R={L,eq,part,cfg:0,crash:{},ghd:{},ghdNames:{},lr:{},zero:{},zeroNew:{},zeroGone:{},cards:{},cardsCh:{},progCh:{},secDelta:{},secTot:{},kp:{},dupDays:{},hipExtItems:{},zeroEx:[]};
  for(const x of lattice(L,eq,part)){
    R.cfg++; const B={};
    try{ ARMS.forEach(k=>B[k]=IA[k].buildProgram(JSON.parse(JSON.stringify(x.c)))); }catch(e){ bump(R.crash,String(e.message).slice(0,100)); continue; }
    const literal=!!(x.inj&&x.inj.tier==='protect'&&(x.inj.region==='ankle'||x.inj.region==='hip'));
    const ik=x.inj?x.inj.region+'/'+x.inj.tier:'healthy';
    const pc={};
    Object.keys(B.base.weeks).forEach(w=>DAYS.forEach(d=>{
      const d0=B.base.weeks[w][d];
      for(const k of ARMS){ const day=B[k].weeks[w]&&B[k].weeks[w][d]; if(!day) continue;
        const names=[]; live(day).forEach(s=>s.items.forEach(it=>{ const n=clean(it.name); names.push(n);
          if(GHD(n)){ bump(R.ghd,k+'|'+(literal?'literal':'outside')); bump(R.ghdNames,k+'|'+(literal?'literal':'outside')+'|'+ik+'|'+n); } }));
        if(x.inj){ live(day).forEach(s=>bump(R.secTot,k+'|'+ik)); }
        if(x.inj&&x.inj.region==='knee'&&x.inj.tier==='protect'){
          names.forEach(n=>{ if(/hip thrust|glute bridge|back extension|glute-ham|pull-through/i.test(n)) bump(R.kp,k+'|'+n); });
          const seen={}; let dup=false; names.forEach(n=>{ if(seen[n]) dup=true; seen[n]=1; }); if(dup) bump(R.dupDays,k);
          bump(R.hipExtItems,k,names.filter(n=>/hip thrust|glute bridge|back extension|glute-ham|pull-through/i.test(n)).length);
        }
        if(!day.rest&&isLong(day.cardio)){ const t=handTier(day.cardio)||'?'; const ld=LIFTDAY.test(day.title||'');
          bump(R.lr,k+'|'+t+'|'+(ld?'liftday':'other'));
          const zl=ld&&!live(day).some(s=>secClass(s)==='lift');
          if(zl){ bump(R.zero,k+'|'+t);
            const zb=d0&&!d0.rest&&LIFTDAY.test(d0.title||'')&&!live(d0).some(s=>secClass(s)==='lift');
            if(k!=='base'&&!zb){ bump(R.zeroNew,k+'|'+t); if(R.zeroEx.length<6) R.zeroEx.push(k+' '+eq+' '+ik+' '+x.f+' W'+w+' '+d+' '+day.title+' :: '+live(d0).map(s=>lab(s)+'['+s.items.map(i=>clean(i.name)).join(', ')+']').join(' ')); } }
          else if(k!=='base'&&d0&&LIFTDAY.test(d0.title||'')&&!live(d0).some(s=>secClass(s)==='lift')) bump(R.zeroGone,k+'|'+t);
        }
        if(k!=='base'&&d0&&!d0.rest){ bump(R.cards,k); if(card(d0)!==card(day)){ bump(R.cardsCh,k+'|'+ik); pc[k]=1;
          if(x.inj){ const m={}; live(d0).forEach(s=>bump(m,lab(s),-1)); live(day).forEach(s=>bump(m,lab(s),1)); Object.entries(m).forEach(([l,v])=>{ if(v) bump(R.secDelta,k+'|'+ik+'|'+l+'|'+(v>0?'+':'-'),Math.abs(v)); }); } } }
      }
    }));
    Object.keys(pc).forEach(k=>bump(R.progCh,k+'|'+ik));
  }
  process.stdout.write(JSON.stringify(R)); process.exit(0);
}

// ── --universe <dir>: injured-cell swap universe + swapCandidates GHD offers (g210 O4 reads healthy cells only) ──
if(process.argv[2]==='--universe'){
  const dir=process.argv[3]; const IA={}; ARMS.forEach(k=>IA[k]=H.load(path.join(dir,'arm_'+k+'.html')));
  const U={}, SW={}, N={}; let cfgs=0;
  for(const eq of ['home_full','home_basic','bodyweight','commercial','crossfit']) for(const x of lattice('L1',eq).filter(x=>x.inj)){ cfgs++;
    for(const k of ARMS){ const p=IA[k].buildProgram(JSON.parse(JSON.stringify(x.c))); const ik=x.inj.region+'/'+x.inj.tier;
      (p._swapUniverse||[]).forEach(n=>{ bump(N,k+'|'+eq+'|uni'); if(GHD(clean(n))) bump(U,k+'|'+eq+'|'+ik+'|'+clean(n)); });
      const sc=IA[k].swapCandidates||IA[k].eval('swapCandidates'); const w1=p.weeks[1]||{}; const asked=new Set();
      DAYS.forEach(d=>{ const day=w1[d]; live(day).forEach(s=>s.items.forEach(it=>{ const n=clean(it.name); if(asked.has(n)) return; asked.add(n); let r; try{ r=sc(it.name,day,'1',p); }catch(e){ bump(SW,k+'|'+eq+'|CRASH'); return; }
        bump(N,k+'|'+eq+'|calls'); (Array.isArray(r)?[r]:Object.values(r||{}).filter(Array.isArray)).forEach(a=>a.forEach(c=>{ const cn=clean(typeof c==='string'?c:(c&&c.name)); if(GHD(cn)) bump(SW,k+'|'+eq+'|'+ik+'|'+cn); })); })); }); } }
  P('injured L1 cells: '+cfgs+' configs x 4 arms');
  P('-- universe/call denominators'); Object.entries(N).sort().forEach(([k,v])=>P('   '+String(v).padStart(8)+'  '+k));
  P('-- GHD names in the injured swap universe (arm|tier|plan|name)'); Object.entries(U).sort().forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k));
  P('-- GHD names offered by swapCandidates, week 1 (arm|tier|plan|name)'); Object.entries(SW).sort().forEach(([k,v])=>P('   '+String(v).padStart(6)+'  '+k));
  P('DONE'); process.exit(0);
}
// ── main ──
const S=process.argv[2]; const CONC=+(process.argv[3]||7);
if(!S){ P('usage: node v215_d149_remeasure.js <scratchdir> [conc]'); process.exit(2); }
const SRC=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
P('artifact ia-version', (SRC.match(/ia-version" content="(\d+)"/)||[])[1]);
P('\n== (1) ANCHORS on V214');
[...EDITS.S4,...EDITS.S5,...EDITS.KPA].forEach(([a],i)=>{ const c=cnt(SRC,a); const ln=c?SRC.slice(0,SRC.indexOf(a)).split('\n').length:0;
  P(`  anchor ${i+1} count=${c} line=${ln}`); if(c) P('    now: '+SRC.split('\n')[ln-1].trim().slice(0,240)); });
const A={base:SRC};
A.cf0=apply(apply(SRC,EDITS.S4,'S4'),EDITS.S5,'S5');
A.cfa=apply(A.cf0,EDITS.KPA,'KPA'); A.cfb=apply(A.cf0,EDITS.KPB,'KPB');
ARMS.forEach(k=>{ const f=path.join(S,'arm_'+k+'.html'); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,A[k]); });
// parked-file identity: does the parked .py still describe the same three S4 edits?
{ const pk='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad/parked_v210_slice4_d149.py';
  if(fs.existsSync(pk)){ const t=fs.readFileSync(pk,'utf8'); P('  parked .py contains each S4 replacement literally (python-escaped \\\\b):', EDITS.S4.map(([a,b])=>t.includes(a.replace(/\\/g,'\\\\'))&&t.includes(b.replace(/\\/g,'\\\\').replace(/\n/g,'\\n'))).join(',')); } }
// self-identity + HALF_MANNY
const L={}; ARMS.forEach(k=>L[k]=H.load(path.join(S,'arm_'+k+'.html')));
const hm=k=>H.progDigest(L[k].buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
P('\n== HALF_MANNY digest (pinned 0ac7da6b1691a8e1)'); ARMS.forEach(k=>P(`  ${k}: ${hm(k)} / again ${hm(k)}`));
P('  row for 214:', H.MANNY_DIGEST_BY_VERSION && H.MANNY_DIGEST_BY_VERSION[214]);
const jobs=[];
ARMS.forEach(k=>jobs.push({id:'g210_'+k,args:[path.join(ROOT,'tests','gates','g210_equipment_denials.js'),path.join(S,'arm_'+k+'.html')]}));
['cf0','cfa','cfb'].forEach(k=>jobs.push({id:'blast_'+k,args:[path.join(ROOT,'tests','measure','v209_d70c_blast.js'),path.join(S,'arm_base.html'),path.join(S,'arm_'+k+'.html')]}));
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight'];
TIERS.forEach(eq=>['L1','L2'].forEach(Lt=>jobs.push({id:'sh_'+Lt+'_'+eq,shard:true,args:[__filename,'--shard',S,Lt,eq,'-']})));
['home_full','commercial','crossfit'].forEach(eq=>['a','b'].forEach(pt=>jobs.push({id:'sh_L3'+pt+'_'+eq,shard:true,args:[__filename,'--shard',S,'L3',eq,pt]})));
const OUT={}; let qi=0, running=0;
function next(done){ if(qi>=jobs.length&&running===0) return done(); while(running<CONC&&qi<jobs.length){ const j=jobs[qi++]; running++;
  const p=cp.spawn('node',j.args,{cwd:ROOT}); let b='',e=''; p.stdout.on('data',d=>b+=d); p.stderr.on('data',d=>e+=d);
  p.on('close',code=>{ OUT[j.id]={code,b,e}; running--; process.stderr.write(`done ${j.id} exit=${code} bytes=${b.length}\n`); next(done); }); } }
next(()=>{
  P('\n== child status'); jobs.forEach(j=>{ const o=OUT[j.id]; P(`  ${j.id.padEnd(22)} exit=${o.code} bytes=${o.b.length}${o.e?' STDERR '+o.e.slice(0,200).replace(/\n/g,' | '):''}`); });
  P('\n== (4) g210 per arm (D149 rows + summary + FAIL lines)');
  ARMS.forEach(k=>{ const b=OUT['g210_'+k].b; P('  -- '+k); b.split('\n').filter(l=>/O3g|O4g|O3z|^PASS \d+ FAIL|^FAIL|^lattice/.test(l)).forEach(l=>P('    '+l.slice(0,260))); });
  P('\n== BLAST (kept v209_d70c_blast.js, healthy 1,008/tier)');
  ['cf0','cfa','cfb'].forEach(k=>{ P('  -- base -> '+k); OUT['blast_'+k].b.split('\n').filter(x=>/^== BLAST|day cards changed|programs changed|^   (home_full|home_basic|crossfit|commercial|bodyweight)\s|HALF|lost|undef/i.test(x)).slice(0,30).forEach(l=>P('    '+l.slice(0,220))); });
  const R={}; jobs.filter(j=>j.shard).forEach(j=>{ try{ R[j.id]=JSON.parse(OUT[j.id].b); }catch(e){ P('SHARD FAILED '+j.id+' '+OUT[j.id].e.slice(0,300)); } });
  const sum=(ids,f)=>{ const o={}; ids.forEach(id=>{ if(R[id]) Object.entries(R[id][f]).forEach(([k,v])=>bump(o,k,v)); }); return o; };
  const ids=pre=>Object.keys(R).filter(i=>i.startsWith(pre));
  const tbl=(o,flt=()=>true)=>Object.entries(o).filter(([k])=>flt(k)).sort((a,b)=>a[0]<b[0]?-1:1).forEach(([k,v])=>P('    '+String(v).padStart(7)+'  '+k));
  ['L1','L2','L3'].forEach(Lt=>{ const I=ids('sh_'+Lt);
    P(`\n==== LATTICE ${Lt}: shards ${I.length}, configs ${I.reduce((a,i)=>a+R[i].cfg,0)}, crashes ${JSON.stringify(sum(I,'crash'))}`);
    I.forEach(i=>{ const r=R[i]; P(`  [${r.eq}${r.part!=='-'?' '+r.part:''}] cfg ${r.cfg}`);
      P('   GHD items on cards (arm|cell):'); tbl(r.ghd);
      P('   long-run days (arm|tier|kind):'); tbl(r.lr,k=>k.startsWith('base|'));
      P('   zero-lift long-run lift-titled days (arm|tier):'); tbl(r.zero);
      P('   NEW zero-lift vs base (arm|tier):'); tbl(r.zeroNew); P('   base-zero days that regained a lift section (arm|tier):'); tbl(r.zeroGone);
      P('   cards compared per arm: '+JSON.stringify(r.cards)); P('   cards changed (arm|cell):'); tbl(r.cardsCh); P('   programs changed (arm|cell):'); tbl(r.progCh);
      if(Object.keys(r.secDelta).length){ P('   injured section-label deltas vs base (arm|plan|label|sign):'); tbl(r.secDelta); P('   live sections total (arm|plan):'); tbl(r.secTot); }
      if(Object.keys(r.kp).length){ P('   knee/protect posterior items (arm|name):'); tbl(r.kp); P('   knee/protect days with a same-name duplicate (arm): '+JSON.stringify(r.dupDays)+'  hip-ext items (arm): '+JSON.stringify(r.hipExtItems)); }
      if(r.zeroEx.length){ P('   new zero-lift examples (base card shown):'); r.zeroEx.forEach(l=>P('     '+l.slice(0,300))); }
      P('   GHD names (arm|cell|plan|name):'); tbl(r.ghdNames,k=>!k.startsWith('base|')||true);
    }); });
  P('\nDONE');
});
