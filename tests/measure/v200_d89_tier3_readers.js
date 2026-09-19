// ════════════════════════════════════════════════════════════════════════════════════
// v200_d89_tier3_readers.js — MEASURE PASS (read-only, rules nothing)
//
// v199_d89_tier3.js instrumented ONE reader of _compoundTier (the capSessionBudget
// tier-3 skip, V198 :9558) and said so. There are SEVEN. This pass measures the other
// six, at the same lattice, with the same oracle.
//
//   R1  :9684   capRegionalFatigue  protected-compound selection
//   R2  :6441/:6456  deconflictAdjacentDupes  load-anchor distance rank
//   R3  :9083/:9085/:9087  swapCandidates     load-anchor distance rank
//   R4  :8994   addCandidates (via swapUniverseFor) tier-descending sort
//   R5  :9097   swapLoadNote   ATHLETE-FACING COPY
//   R6  :13046  openSwapSheet  HEAVY COMPOUND tag, ATHLETE-FACING COPY
//
// ORACLE INDEPENDENCE
//   - the implement-token regex is PARSED OUT OF THE ARTIFACT and asserted before use.
//     "fall-through" := _compoundTier(n)===3 AND the name carries no implement token,
//     i.e. tier 3 was asserted with no implement evidence in the name.
//   - the CORE population is taken from EXLIB authoring pool membership (where the
//     author filed the movement), never from _compoundTier.
//   - R6's tag condition and R5's threshold are PARSED OUT OF THE ARTIFACT as source
//     text and asserted, never retyped from memory.
//   - R5/R6 literal strings are read back out of a REAL openSwapSheet() call against a
//     memoising getElementById, not reconstructed.
//
// LATTICE  verbatim from v198_d85_posterior_floor.js / v199_d89_tier3.js:
//   6 equip x 2 focus x 2 exp x 3 goal x 4 injury x 3 rest x 2 seeds = 1728 config keys.
//
// USAGE  node tests/measure/v200_d89_tier3_readers.js        (SHARDS=8 by default)
// ════════════════════════════════════════════════════════════════════════════════════
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH=process.env.V200_SCRATCH||fs.mkdtempSync(path.join(os.tmpdir(),'v200-'));
const SRC=path.join(ROOT,'index.html');
const SHARDS=+(process.env.V200_SHARDS||8);

// ── lattice ────────────────────────────────────────────────────────────────────────
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'];
const E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
             {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},
             {k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',
    cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,
    liftingFocus:focus,experience:exp,ageBracket:'18-35',
    equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd);
    if(i.v)c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,tier:t,focus:f,exp:x,goal:g.k,inj:i.k,rest:r.k,seed:sd,cfg:c});
  }

// ── source surgery on a COPY. index.html is NEVER written. Recorders only: every
//    inserted statement is an observation, none changes a value the engine reads.
const A_CELL="      const hotNext=!!(_nc&&_nc.legLoad);\n";
const R_CELL=A_CELL+"      globalThis.__CELL=String(w)+'/'+String(d);\n";
const A_P0="    let protTier=0, protKey=null;\n";
const R_P0="    if(globalThis.__R1){ globalThis.__R1.pool=[]; globalThis.__R1PN=null; }\n"+A_P0;
const A_P1="        if(t>protTier){ protTier=t; protKey=si*100+ii; }\n";
const R_P1="        if(globalThis.__R1) globalThis.__R1.pool.push([String(it.name||''),t]);\n"
          +"        if(t>protTier){ protTier=t; protKey=si*100+ii; if(globalThis.__R1) globalThis.__R1PN=String(it.name||''); }\n";
const A_P2="    const patCount={};\n";
const R_P2="    if(globalThis.__R1) globalThis.__R1.rows.push({cell:globalThis.__CELL,reg:region,pt:protTier,pn:globalThis.__R1PN,pool:globalThis.__R1.pool.slice()});\n"+A_P2;
const A_D="        const to=top[Math.floor(seededRand(seed+wB*97+pi*13+ii)*top.length)]||top[0];\n";
const R_D=A_D+"        if(globalThis.__R2) globalThis.__R2.rows.push({cell:String(wB)+'/'+String(dB),was:String(it.name||''),ot:outTier,to:String(to||''),top:top.slice(),cands:cands.slice(0,14),lab:String(sec.label||'')});\n";
function makeArtifact(){
  const RAW=fs.readFileSync(SRC,'utf8');
  const anchors=[[A_CELL,'cell'],[A_P0,'protTier init'],[A_P1,'protTier cmp'],[A_P2,'patCount'],[A_D,'dedupe pick']];
  let bad=0;
  anchors.forEach(([a,n])=>{const c=RAW.split(a).length-1; if(c!==1){console.log('FAIL anchor '+n+' count='+c);bad++;}});
  if(bad){process.exit(5);}
  const out=RAW.replace(A_CELL,R_CELL).replace(A_P0,R_P0).replace(A_P1,R_P1).replace(A_P2,R_P2).replace(A_D,R_D);
  const p=path.join(SCRATCH,'art_v200.html');
  try{fs.unlinkSync(p);}catch(e){}
  fs.writeFileSync(p,out);
  return p;
}

// ── parsed-from-artifact oracles ───────────────────────────────────────────────────
const RAW=fs.readFileSync(SRC,'utf8');
const TOKLINE=(RAW.match(/if\(!\/([a-z| ]+)\/\.test\(N\)\n/)||[])[1];
const R5LINE=(RAW.match(/\n(  const d=_compoundTier\(outName\)-_compoundTier\(candName\);\n  if\(d<(\d)\) return '';\n  return '([^']+)'\+outName\.toLowerCase\(\)\+'([^']+)';)\n/)||[]);
const R6LINE=(RAW.match(/\n(  const isHeavyCompound=!isMainSlot&&_compoundTier\(item\.name\)>=(\d);)\n/)||[]);
const MAINSLOT=(RAW.match(/\n  const isMainSlot=(\([^\n]+\));\n/)||[])[1];
const TOKRE=new RegExp(TOKLINE);
function tok(n){return TOKRE.test(String(n||'').toLowerCase());}

// ── per-shard sweep ────────────────────────────────────────────────────────────────
function sweep(artifact,shard){
  const IA=load(artifact);
  // pure-function memos (identity-checked in the parent before this runs)
  IA.eval("globalThis.__MEMO=function(){var mCT={},mPT={},mSI={};"
    +"var oCT=_compoundTier,oPT=_pattern,oSI=_swapInjuryOK;"
    +"_compoundTier=function(n){var k=String(n);return (k in mCT)?mCT[k]:(mCT[k]=oCT(n));};"
    +"_pattern=function(n){var k=String(n);return (k in mPT)?mPT[k]:(mPT[k]=oPT(n));};"
    +"_swapInjuryOK=function(n,c){var k=(c&&c.injury?c.injury.region+'/'+c.injury.tier:'-')+'|'+String(n);return (k in mSI)?mSI[k]:(mSI[k]=oSI(n,c));};};globalThis.__MEMO();");
  IA.eval("globalThis.__R1={rows:[],pool:[]}; globalThis.__R2={rows:[]}; globalThis.__CELL=null;");
  IA.eval("globalThis.__isMainSlot=function(sec,itemIdx){ return "+MAINSLOT+"; };");
  const isMainSlot=IA.eval("globalThis.__isMainSlot");
  const CT=IA.eval("_compoundTier"), PAT=IA.eval("_pattern"), LOADNOTE=IA.eval("swapLoadNote");
  const SWAPC=IA.eval("swapCandidates"), ADDC=IA.eval("addCandidates"), CFLAGS=IA.eval("exControlFlags");
  const AUXF=IA.eval("_auxFamily"), AUXC=IA.eval("auxSwapCandidates"), UNIV=IA.eval("swapUniverseFor");
  const R6MIN=+R6LINE[2], R5MIN=+R5LINE[2];
  const ft=n=>CT(n)===3&&!tok(n);          // tier 3 with no implement evidence

  const S={configs:0,cells:0,items:0,univ:0,univN:0,
    // R1
    r1rows:0,r1by:{},r1ftWin:0,r1ftWinTok:0,r1ftWinOnly:0,r1protName:{},r1ftNames:{},r1tie:0,r1byReg:{},r1t3:0,
    r1delA:0,r1delB:0,r1delNames:{},
    // R2
    r2rows:0,r2topFt:0,r2ftShort:{},r2all:{},r2chg:{},r2ftOut:0,r2ftTo:0,r2pairs:{},r2delA:0,r2delB:0,r2ftOutNames:{},
    // R3
    r3calls:0,r3ftOut:0,r3headFt:0,r3ordA:0,r3headA:0,r3ordB:0,r3headB:0,r3heads:{},r3ftHeadNames:{},
    // R4
    r4days:0,r4gapHeadFt:0,r4moreHeadFt:0,r4offHeadFt:0,r4heads:{},r4ordA:0,r4ordB:0,r4gapNonEmpty:0,
    // R5
    r5calls:0,r5emitDisp:0,r5emitDrop:0,r5ftBasedDisp:0,r5ftBasedDrop:0,r5strings:{},r5ftStrings:{},r5delA:0,r5delB:0,
    // R6
    r6swappable:0,r6tag:0,r6tagFt:0,r6tagTok:0,r6names:{},r6ftNames:{},r6delA:0,r6delB:0,
    // segmentation of R6 fall-through tag by axis
    r6seg:{},
    // shipped-name census + copy-string reachability
    nameCount:{},copyHit:{r1:0,r2:0,r3:0,r4:0,r5:0,r6:0,ship:0,tier:null,canSwap:0},
  };
  const COPY=/arrive fresh|hay is in the barn/i;
  const segBump=(L,k)=>{[['equip',L.tier],['focus',L.focus],['exp',L.exp],['goal',L.goal],['inj',L.inj]]
      .forEach(([a,v])=>{const kk=k+'|'+a+'='+v;S.r6seg[kk]=(S.r6seg[kk]||0)+1;});};

  LAT.forEach((L,li)=>{
    if(li%SHARDS!==shard) return;
    S.configs++;
    IA.eval("globalThis.__R1.rows.length=0; globalThis.__R2.rows.length=0;");
    const prog=IA.buildProgram(L.cfg);
    const r1=JSON.parse(IA.eval("JSON.stringify(globalThis.__R1.rows)"));
    const r2=JSON.parse(IA.eval("JSON.stringify(globalThis.__R2.rows)"));
    // ---- R1 capRegionalFatigue :9684 ----
    r1.forEach(row=>{
      S.r1rows++; S.r1byReg[row.reg]=(S.r1byReg[row.reg]||0)+1;
      S.r1by['tier'+row.pt]=(S.r1by['tier'+row.pt]||0)+1;
      if(row.pt!==3) return;
      S.r1t3++;
      const w=row.pn||'';
      S.r1protName[w]=(S.r1protName[w]||0)+1;
      if(ft(w)){
        S.r1ftWin++; S.r1ftNames[w]=(S.r1ftNames[w]||0)+1;
        // did it beat a real-token movement in the same region?
        const rival=row.pool.filter(p=>tok(p[0])&&p[1]===3);
        if(rival.length){ S.r1ftWinTok++; S.r1delNames[w+'  >  '+rival[0][0]]=(S.r1delNames[w+'  >  '+rival[0][0]]||0)+1; }
        else S.r1ftWinOnly++;
        // D89 counterfactual: winner recomputed with tier(model) instead of tier(base)
        ['A','B'].forEach(M=>{
          let bt=-1,bn=null;
          row.pool.forEach(p=>{const t=modelTier(p[0],p[1],M); if(t>bt){bt=t;bn=p[0];}});
          if(bn!==w){ if(M==='A')S.r1delA++; else S.r1delB++; }
        });
      }
      if(COPY.test(w)) S.copyHit.r1++;
    });
    // ---- R2 dedupe :6441/:6456 ----
    r2.forEach(row=>{
      S.r2rows++;
      const o=ft(row.was), t=ft(row.to);
      if(o) {S.r2ftOut++; S.r2ftOutNames[row.was]=(S.r2ftOutNames[row.was]||0)+1;}
      if(t) S.r2ftTo++;
      if(o||t) S.r2pairs[row.was+'  ->  '+row.to+'  (outTier '+row.ot+' -> '+CT(row.to)+')']=
        (S.r2pairs[row.was+'  ->  '+row.to+'  (outTier '+row.ot+' -> '+CT(row.to)+')']||0)+1;
      if(COPY.test(row.was)||COPY.test(row.to)) S.copyHit.r2++;
      // detail the task asks for: NAME the swaps a fall-through 3 in the shortlist produces
      const ftInTop=row.top.filter(n=>ft(n));
      if(ftInTop.length){ S.r2topFt++;
        S.r2ftShort[row.was+'  ->  '+row.to+'   [shortlist '+row.top.join(' / ')+', outTier '+row.ot+']']=
          (S.r2ftShort[row.was+'  ->  '+row.to+'   [shortlist '+row.top.join(' / ')+', outTier '+row.ot+']']||0)+1; }
      S.r2all[row.was+'  ->  '+row.to+'  (tier '+row.ot+' -> '+CT(row.to)+')']=
        (S.r2all[row.was+'  ->  '+row.to+'  (tier '+row.ot+' -> '+CT(row.to)+')']||0)+1;
      // D89 counterfactual on the TOP-3 shortlist the draw samples from
      ['A','B'].forEach(M=>{
        const ot=modelTier(row.was,row.ot,M);
        const re=row.cands.slice().sort((a,b)=>{
          const da=Math.abs(modelTier(a,CT(a),M)-ot), db=Math.abs(modelTier(b,CT(b),M)-ot);
          if(da!==db) return da-db; return a.localeCompare(b);
        }).slice(0,3).join('|');
        if(re!==row.top.slice(0,3).join('|')){ if(M==='A'){S.r2delA++;
          S.r2chg[row.was+'   base shortlist ['+row.top.join(' / ')+']   D89 shortlist ['+re.split('|').join(' / ')+']']=
            (S.r2chg[row.was+'   base shortlist ['+row.top.join(' / ')+']   D89 shortlist ['+re.split('|').join(' / ')+']']||0)+1;
        } else S.r2delB++; }
      });
    });
    if(process.env.V200_R2ONLY) return;
    // ---- post-build readers ----
    const U=UNIV(prog,1,null)||[]; S.univ+=U.length; S.univN++;
    U.forEach(n=>{ if(COPY.test(n)) S.copyHit.ship++; });
    const W=prog.weeks||{};
    Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
      const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections))return;
      S.cells++;
      // R4: one addCandidates per day
      S.r4days++;
      const AC=ADDC(day,+w,prog);
      ['gap','more','off'].forEach(k=>{
        const arr=AC[k]||[]; if(!arr.length) return;
        if(k==='gap') S.r4gapNonEmpty++;
        const h=arr[0];
        if(ft(h)){ if(k==='gap')S.r4gapHeadFt++; else if(k==='more')S.r4moreHeadFt++; else S.r4offHeadFt++;
                   S.r4heads[k+': '+h]=(S.r4heads[k+': '+h]||0)+1; }
        if(COPY.test(h)) S.copyHit.r4++;
        ['A','B'].forEach(M=>{
          const re=arr.slice().sort((a,b)=>{const ta=modelTier(a,CT(a),M),tb=modelTier(b,CT(b),M);
            if(ta!==tb)return tb-ta; return a.localeCompare(b);}).join('|');
          if(re!==arr.join('|')){ if(M==='A')S.r4ordA++; else S.r4ordB++; }
        });
      });
      day.sections.forEach((sec,si)=>{
        (sec.items||[]).forEach((it,ii)=>{
          const n=String(it.name||''); if(!n) return;
          S.items++; S.nameCount[n]=(S.nameCount[n]||0)+1;
          if(COPY.test(n)){ S.copyHit.ship++; if(S.copyHit.tier===null) S.copyHit.tier=CT(n); }
          let cf; try{ cf=CFLAGS(sec,ii,it); }catch(e){ cf=null; }
          if(!cf||!cf.canSwap) return;
          S.r6swappable++;
          if(COPY.test(n)) S.copyHit.canSwap++;
          // ---- R6 :13046 HEAVY COMPOUND tag ----
          const ims=isMainSlot(sec,ii);
          const heavy=!ims&&CT(n)>=R6MIN;
          if(heavy){
            S.r6tag++;
            if(tok(n)) S.r6tagTok++;
            else { S.r6tagFt++; S.r6ftNames[n]=(S.r6ftNames[n]||0)+1; segBump(L,'ftTag'); if(COPY.test(n))S.copyHit.r6++; }
            S.r6names[n]=(S.r6names[n]||0)+1;
          }
          ['A','B'].forEach(M=>{
            const h2=!ims&&modelTier(n,CT(n),M)>=R6MIN;
            if(h2!==heavy){ if(M==='A')S.r6delA++; else S.r6delB++; }
          });
          // ---- R3 swapCandidates + R5 swapLoadNote ----
          const c=SWAPC(n,day,+w,prog);
          let t1=c.tier1||[], t2=c.tier2||[];
          const fam=(!c.pattern)?AUXF(n):null;
          if(fam){ t1=AUXC(n,day,prog)||[]; t2=[]; }
          S.r3calls++;
          if(ft(n)) S.r3ftOut++;
          if(t1.length){
            if(ft(t1[0])){ S.r3headFt++; S.r3ftHeadNames[n+'  ->  head '+t1[0]]=(S.r3ftHeadNames[n+'  ->  head '+t1[0]]||0)+1; }
            S.r3heads[t1[0]]=(S.r3heads[t1[0]]||0)+1;
            if(COPY.test(t1[0])) S.copyHit.r3++;
          }
          if(!fam) ['A','B'].forEach(M=>{
            const ot=modelTier(n,CT(n),M);
            const rk=(a,b)=>{const ta=modelTier(a,CT(a),M),tb=modelTier(b,CT(b),M);
              const da=Math.abs(ta-ot),db=Math.abs(tb-ot); if(da!==db)return da-db;
              if(ta!==tb)return tb-ta; return a.localeCompare(b);};
            const re=(c.tier1||[]).slice().sort(rk);
            const ord=re.join('|')!==(c.tier1||[]).join('|');
            const head=(re[0]||'')!==((c.tier1||[])[0]||'');
            if(ord){ if(M==='A')S.r3ordA++; else S.r3ordB++; }
            if(head){ if(M==='A')S.r3headA++; else S.r3headB++; }
          });
          // R5: tier1 rows DISPLAY the note (caution=false); tier2 rows compute it and
          // discard it (caution=true overrides). Both counted, separately.
          t1.forEach(cn=>{ S.r5calls++;
            const s=LOADNOTE(n,cn);
            if(s){ S.r5emitDisp++; S.r5strings[s]=(S.r5strings[s]||0)+1;
              const dA=modelTier(n,CT(n),'A')-modelTier(cn,CT(cn),'A');
              const dB=modelTier(n,CT(n),'B')-modelTier(cn,CT(cn),'B');
              if(dA<R5MIN) S.r5delA++;
              if(dB<R5MIN) S.r5delB++;
              if(ft(n)){ S.r5ftBasedDisp++; S.r5ftStrings[s]=(S.r5ftStrings[s]||0)+1; if(COPY.test(n))S.copyHit.r5++; }
            }
          });
          t2.forEach(cn=>{ S.r5calls++; const s=LOADNOTE(n,cn);
            if(s){ S.r5emitDrop++; if(ft(n)) S.r5ftBasedDrop++; } });
        });
      });
    }));
  });
  function modelTier(name,base,M){
    // MODEL A (token required): a tier-3 with no implement token drops to 2.
    // MODEL B (A + core named explicitly): a CORE-pool movement is not a compound at all.
    if(M==='B'&&CORE_POOL.has(name)) return 0;
    if(base===3&&!tok(name)) return 2;
    return base;
  }
  return S;
}

// CORE_POOL: EXLIB authoring-pool membership. The oracle for "this is a core drill" is
// where the AUTHOR filed it, never _compoundTier. Built in every process from the artifact.
let CORE_POOL=new Set();
function buildCorePool(artifact){
  const IA=load(artifact);
  const EX=IA.eval('EXLIB'); const pool={};
  (function walk(o,p){ if(Array.isArray(o)){o.forEach(v=>{if(typeof v==='string'){(pool[v]=pool[v]||[]).push(p);}else if(v&&typeof v==='object')walk(v,p);});return;}
    if(o&&typeof o==='object'){Object.keys(o).forEach(k=>walk(o[k],p?p+'.'+k:k));} })(EX,'');
  const s=new Set(), exl=new Set();
  Object.keys(pool).forEach(n=>{ if(/core|trunk|abs|anti/i.test(pool[n].join(','))) { s.add(n); exl.add(n); } });
  // The artifact's OWN explicit core map: _AUX_FAMILY (V193 D49 filed 'Pallof press' there).
  // This is an authoring declaration, independent of _compoundTier.
  const AF=IA.eval('_AUX_FAMILY')||{};
  const af=new Set();
  Object.keys(AF).forEach(n=>{ if(String(AF[n])==='core'){ s.add(n); af.add(n); } });
  return {set:s,pool:pool,exl:exl,af:af};
}

// ── child ──────────────────────────────────────────────────────────────────────────
if(process.env.V200_JOB){
  const [artifact,shard,out]=process.env.V200_JOB.split('::');
  const cp=buildCorePool(artifact); CORE_POOL=cp.set;
  const S=sweep(artifact,+shard);
  S.corePoolN=CORE_POOL.size;
  fs.writeFileSync(out,JSON.stringify(S));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const ver=f=>(fs.readFileSync(f,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('V200 D89 — THE OTHER SIX READERS OF _compoundTier');
console.log('artifact: '+SRC+'  (ia-version '+ver(SRC)+')');
console.log('lattice: '+LAT.length+' config keys, shards='+SHARDS);
console.log('PARSED ORACLES (out of the artifact, asserted before use):');
console.log('  implement-token regex  /'+TOKLINE+'/                 (_compoundTier :9343)');
console.log('  R5 source  '+(R5LINE[1]||'(NOT FOUND)').replace(/\n/g,' \\n '));
console.log('  R6 source  '+(R6LINE[1]||'(NOT FOUND)'));
console.log('  isMainSlot '+(MAINSLOT||'(NOT FOUND)'));
if(TOKLINE!=='weighted|loaded|barbell|trap bar'||!R5LINE[1]||!R6LINE[1]||!MAINSLOT){
  console.log('FAIL: a parsed oracle did not match its expected shape. Measurement aborted.');process.exit(6);}
const ART=makeArtifact();
console.log('instrumented copy: '+ART+'  (index.html untouched; all 5 anchors count==1)');

// ── identity proof: the recorders and the memos are inert ──────────────────────────
(function proveInert(){
  const {progDigest}=require(path.join(__dirname,'..','harness.js'));
  const A=load(SRC), B=load(ART);
  B.eval("globalThis.__R1={rows:[],pool:[]}; globalThis.__R2={rows:[]}; globalThis.__CELL=null;");
  B.eval("globalThis.__MEMO=function(){var mCT={},mPT={},mSI={};var oCT=_compoundTier,oPT=_pattern,oSI=_swapInjuryOK;"
    +"_compoundTier=function(n){var k=String(n);return (k in mCT)?mCT[k]:(mCT[k]=oCT(n));};"
    +"_pattern=function(n){var k=String(n);return (k in mPT)?mPT[k]:(mPT[k]=oPT(n));};"
    +"_swapInjuryOK=function(n,c){var k=(c&&c.injury?c.injury.region+'/'+c.injury.tier:'-')+'|'+String(n);return (k in mSI)?mSI[k]:(mSI[k]=oSI(n,c));};};globalThis.__MEMO();");
  let same=0,diff=0,selfok=0;
  [0,137,431,900,1300,1727].forEach(i=>{
    const c=LAT[i].cfg;
    const a=progDigest(A.buildProgram(c)), a2=progDigest(A.buildProgram(c)), b=progDigest(B.buildProgram(c));
    if(a===a2) selfok++;
    if(a===b) same++; else { diff++; console.log('  IDENTITY FAIL at '+LAT[i].key+': base '+a+' instrumented '+b); }
  });
  console.log('identity: baseline self-stable '+selfok+'/6; instrumented+memoised == base '+same+'/6 (diff '+diff+')');
  if(diff||selfok!==6){console.log('FAIL: instrumented artifact is not inert. Measurement aborted.');process.exit(7);}
})();

const cp0=buildCorePool(ART);
console.log('CORE ORACLE (authoring declarations, never _compoundTier):');
console.log('  EXLIB core/trunk pools      '+cp0.exl.size+' names: '+Array.from(cp0.exl).join(', '));
console.log('  _AUX_FAMILY[n]===\'core\'   '+cp0.af.size+' names: '+Array.from(cp0.af).join(', '));
console.log('  union used as MODEL B core: '+cp0.set.size+' names');
console.log('MODELS  A = tier 3 requires an implement token, otherwise 2.');
console.log('        B = A, plus a declared-core movement is not a compound at all (tier 0).');

let done=0; const OUT=[];
for(let s=0;s<SHARDS;s++){
  const o=path.join(SCRATCH,'s'+s+'.json');
  try{fs.unlinkSync(o);}catch(e){}
  const ch=fork(__filename,[],{env:Object.assign({},process.env,{V200_JOB:[ART,s,o].join('::'),V200_SCRATCH:SCRATCH}),stdio:'inherit'});
  ch.on('exit',c=>{
    if(c!==0){console.log('FAIL: shard '+s+' exited '+c);process.exit(4);}
    OUT.push(JSON.parse(fs.readFileSync(o,'utf8')));
    if(++done===SHARDS) report(merge(OUT));
  });
}
function merge(arr){
  const M=JSON.parse(JSON.stringify(arr[0]));
  for(let i=1;i<arr.length;i++){
    const S=arr[i];
    Object.keys(S).forEach(k=>{
      if(typeof S[k]==='number') M[k]=(M[k]||0)+S[k];
      else if(S[k]&&typeof S[k]==='object'){ M[k]=M[k]||{};
        Object.keys(S[k]).forEach(j=>{ if(typeof S[k][j]==='number') M[k][j]=(M[k][j]||0)+S[k][j]; else if(M[k][j]==null) M[k][j]=S[k][j]; }); }
    });
  }
  M.corePoolN=arr[0].corePoolN; M.copyHit.tier=arr[0].copyHit.tier;
  return M;
}
function pct(n,d){return d?(100*n/d).toFixed(2)+'%':'n/a';}
function top(o,n){return Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+'  ['+o[k]+']');}

function report(S){
  const D='  denominator: ';
  console.log('\n══ SWEEP SIZE ═════════════════════════════════════════════════════════════');
  console.log('  configs '+S.configs+'   day cells '+S.cells+'   shipped items '+S.items
    +'   swappable items '+S.r6swappable+'   mean swap universe '+(S.univ/S.univN).toFixed(1)+' names');

  console.log('\n══ R1  capRegionalFatigue :9684 — the protected compound ══════════════════');
  console.log('  trim-loop region iterations (each picks one protected compound): '+S.r1rows);
  console.log('  by winning tier: '+top(S.r1by,6).join('  |  '));
  console.log('  by region: '+top(S.r1byReg,4).join('  |  '));
  console.log('  iterations where the winner is TIER 3: '+S.r1t3+' ('+pct(S.r1t3,S.r1rows)+' of '+S.r1rows+')');
  console.log('  ... won by a FALL-THROUGH name (no implement token): '+S.r1ftWin+' ('+pct(S.r1ftWin,S.r1t3)+' of tier-3 wins, '+pct(S.r1ftWin,S.r1rows)+' of all)');
  console.log('      of those, a REAL-TOKEN tier-3 movement was in the same region and lost: '+S.r1ftWinTok+' ('+pct(S.r1ftWinTok,S.r1ftWin)+')');
  console.log('      of those, no token movement present (fall-through won unopposed):     '+S.r1ftWinOnly+' ('+pct(S.r1ftWinOnly,S.r1ftWin)+')');
  console.log('  winners overall: '+top(S.r1protName,10).join('  |  '));
  console.log('  fall-through winners: '+top(S.r1ftNames,12).join('  |  '));
  console.log('  the wrong item made untouchable (fall-through beat a token movement):');
  top(S.r1delNames,12).forEach(r=>console.log('      '+r));
  console.log('  D89 DELTA: protected item changes in '+S.r1delA+' iterations under MODEL A ('+pct(S.r1delA,S.r1rows)+'), '
    +S.r1delB+' under MODEL B ('+pct(S.r1delB,S.r1rows)+')');

  console.log('\n══ R2  deconflictAdjacentDupes :6441/:6456 — the load anchor ══════════════');
  console.log('  substitutions performed: '+S.r2rows);
  console.log('  ... where the OUTGOING name is a fall-through 3: '+S.r2ftOut+' ('+pct(S.r2ftOut,S.r2rows)+')');
  console.log('  ... where the INCOMING name is a fall-through 3: '+S.r2ftTo+' ('+pct(S.r2ftTo,S.r2rows)+')');
  console.log('  outgoing fall-through names: '+top(S.r2ftOutNames,10).join('  |  '));
  console.log('  substitutions whose 3-name shortlist CONTAINED a fall-through 3: '+S.r2topFt+' ('+pct(S.r2topFt,S.r2rows)+')');
  console.log('  those substitutions, named (top 14):');
  top(S.r2ftShort,14).forEach(r=>console.log('      '+r));
  console.log('  shortlists that CHANGE under MODEL A (top 12):');
  top(S.r2chg,12).forEach(r=>console.log('      '+r));
  console.log('  all substitutions produced (top 14 by count):');
  top(S.r2all,14).forEach(r=>console.log('      '+r));
  console.log('  D89 DELTA: top-3 shortlist changes in '+S.r2delA+' ('+pct(S.r2delA,S.r2rows)+') under MODEL A, '
    +S.r2delB+' ('+pct(S.r2delB,S.r2rows)+') under MODEL B');

  console.log('\n══ R3  swapCandidates :9083/:9085/:9087 — athlete swap list order ═════════');
  console.log('  swapCandidates calls (one per swappable item): '+S.r3calls);
  console.log('  ... on an outgoing FALL-THROUGH 3 (the anchor is fabricated): '+S.r3ftOut+' ('+pct(S.r3ftOut,S.r3calls)+')');
  console.log('  lists whose HEAD (the first pick the athlete reads) is a fall-through 3: '+S.r3headFt+' ('+pct(S.r3headFt,S.r3calls)+')');
  console.log('  most common heads: '+top(S.r3heads,10).join('  |  '));
  console.log('  fall-through heads, out -> head: ');
  top(S.r3ftHeadNames,12).forEach(r=>console.log('      '+r));
  console.log('  D89 DELTA: tier1 ORDER changes '+S.r3ordA+' ('+pct(S.r3ordA,S.r3calls)+') / HEAD changes '+S.r3headA+' ('+pct(S.r3headA,S.r3calls)+')  MODEL A');
  console.log('             tier1 ORDER changes '+S.r3ordB+' ('+pct(S.r3ordB,S.r3calls)+') / HEAD changes '+S.r3headB+' ('+pct(S.r3headB,S.r3calls)+')  MODEL B');

  console.log('\n══ R4  addCandidates/swapUniverseFor :8994 — tier-descending add list ═════');
  console.log('  addCandidates calls (one per day cell): '+S.r4days+'   non-empty gap lists '+S.r4gapNonEmpty);
  console.log('  gap[0] is a fall-through 3:  '+S.r4gapHeadFt+' ('+pct(S.r4gapHeadFt,S.r4gapNonEmpty)+' of non-empty gap lists)');
  console.log('  more[0] is a fall-through 3: '+S.r4moreHeadFt);
  console.log('  off[0] is a fall-through 3:  '+S.r4offHeadFt);
  console.log('  fall-through list heads: '+top(S.r4heads,12).join('  |  '));
  console.log('  D89 DELTA: list order changes in '+S.r4ordA+' list-renders MODEL A, '+S.r4ordB+' MODEL B (of '+(S.r4days*3)+' list renders)');

  console.log('\n══ R5  swapLoadNote :9097 — ATHLETE-FACING COPY ═══════════════════════════');
  console.log('  swapLoadNote calls: '+S.r5calls);
  console.log('  notes DISPLAYED to the athlete (tier1 rows, caution=false): '+S.r5emitDisp+' ('+pct(S.r5emitDisp,S.r5calls)+')');
  console.log('  notes computed then DISCARDED (tier2 rows carry "Different job. Region volume holds."): '+S.r5emitDrop);
  console.log('  DISPLAYED notes resting on a fall-through outgoing tier: '+S.r5ftBasedDisp+' ('+pct(S.r5ftBasedDisp,S.r5emitDisp)+' of displayed)');
  console.log('  D89 DELTA: notes that stop being emitted: MODEL A '+S.r5delA+' ('+pct(S.r5delA,S.r5emitDisp)+' of displayed), MODEL B '+S.r5delB+' ('+pct(S.r5delB,S.r5emitDisp)+')');
  console.log('  LITERAL STRINGS THE ATHLETE READS (top 18, all emissions):');
  top(S.r5strings,18).forEach(r=>console.log('      "'+r.replace(/  \[/,'"  [')));
  console.log('  LITERAL STRINGS FABRICATED BY A FALL-THROUGH TIER (top 18):');
  top(S.r5ftStrings,18).forEach(r=>console.log('      "'+r.replace(/  \[/,'"  [')));

  console.log('\n══ R6  openSwapSheet :13046 — HEAVY COMPOUND tag, ATHLETE-FACING ══════════');
  console.log('  swappable items rendered: '+S.r6swappable);
  console.log('  HEAVY COMPOUND printed: '+S.r6tag+' ('+pct(S.r6tag,S.r6swappable)+')');
  console.log('  ... on a real implement token: '+S.r6tagTok+' ('+pct(S.r6tagTok,S.r6tag)+')');
  console.log('  ... PURELY BY FALL-THROUGH:    '+S.r6tagFt+' ('+pct(S.r6tagFt,S.r6tag)+' of tags, '+pct(S.r6tagFt,S.r6swappable)+' of swappable items)');
  console.log('  distinct movements tagged: '+Object.keys(S.r6names).length+'   distinct tagged by fall-through: '+Object.keys(S.r6ftNames).length);
  console.log('  every movement carrying HEAVY COMPOUND by fall-through (name [prints]):');
  top(S.r6ftNames,60).forEach(r=>console.log('      '+r));
  console.log('  D89 DELTA: tag decision flips on '+S.r6delA+' renders MODEL A ('+pct(S.r6delA,S.r6swappable)+'), '+S.r6delB+' MODEL B ('+pct(S.r6delB,S.r6swappable)+')');
  console.log('  fall-through tag segmented:');
  ['equip','focus','exp','goal','inj'].forEach(ax=>{
    const rows=Object.keys(S.r6seg).filter(k=>k.indexOf('ftTag|'+ax+'=')===0)
      .sort((a,b)=>S.r6seg[b]-S.r6seg[a]).map(k=>k.split('|')[1]+' '+S.r6seg[k]);
    console.log('    '+ax.padEnd(6)+' '+rows.join('  '));
  });

  console.log('\n══ COPY-STRING REACHABILITY (the taper note) ══════════════════════════════');
  console.log('  shipped items whose NAME matches /arrive fresh|hay is in the barn/: '+S.copyHit.ship
    +'   _compoundTier of it: '+S.copyHit.tier);
  console.log('  reaches R1 '+S.copyHit.r1+' | R2 '+S.copyHit.r2+' | R3 '+S.copyHit.r3+' | R4 '+S.copyHit.r4
    +' | R5 '+S.copyHit.r5+' | R6 '+S.copyHit.r6+'   (swappable renders of it: '+S.copyHit.canSwap+')');

  console.log('\nMEASURED '+S.cells+' day cells / '+S.configs+' configs. Read-only. No ruling. index.html untouched.');
  runLiteralProbe();
}

// ── literal-string probe: drive the REAL openSwapSheet against a memoising DOM ─────
function runLiteralProbe(){
  console.log('\n══ LITERAL PROBE — real openSwapSheet(), memoising getElementById ══════════');
  console.log('  STUB: tests/harness.js:102 returns a FRESH element per getElementById call, so');
  console.log('  nothing written by the renderer can be read back. This probe replaces it with a');
  console.log('  memo (one element per id) after load. It can prove the exact HTML the renderer');
  console.log('  writes into #swapTags / #swapBody. It cannot prove layout, CSS or tap behaviour.');
  const IA=load(SRC);
  const ok=IA.eval("(function(){var m={};var g=document.getElementById;document.getElementById=function(id){return m[id]||(m[id]=g(id));};globalThis.__DOM=m;return true;})()");
  if(!ok){console.log('  FAILED MEASUREMENT: could not install the memo stub.');return;}
  const targets=[];
  // find cells shipping the known fall-through names, at pinned seeds
  const probes=[LAT[0],LAT[137],LAT[431],LAT[900],LAT[1300],LAT[1727]];
  let built=0;
  probes.forEach(L=>{
    IA.eval("globalThis.__CFG="+JSON.stringify(L.cfg)+";");
    let set;
    try{ set=IA.eval("(function(){activeProg=buildProgram(globalThis.__CFG);activeProgId=activeProg.id;return Object.keys(activeProg.weeks).length;})()"); }
    catch(e){ console.log('  FAILED MEASUREMENT on '+L.key+': '+e.message); return; }
    built++;
    const prog=IA.eval("activeProg");
    Object.keys(prog.weeks).forEach(w=>Object.keys(prog.weeks[w]).forEach(d=>{
      const day=prog.weeks[w][d]; if(!day||day.rest||!day.sections) return;
      day.sections.forEach((sec,si)=>(sec.items||[]).forEach((it,ii)=>{
        const n=String(it.name||'');
        if(!/pallof|close-grip bench|zercher|arrive fresh/i.test(n)) return;
        if(targets.length>=14) return;
        try{
          IA.eval("currentWeek="+JSON.stringify(+w)+"; currentDayKey="+JSON.stringify(d)+";");
          IA.eval("openSwapSheet("+si+","+ii+")");
          const tags=IA.eval("globalThis.__DOM.swapTags?globalThis.__DOM.swapTags.innerHTML:'(no #swapTags)'");
          const body=IA.eval("globalThis.__DOM.swapBody?globalThis.__DOM.swapBody.innerHTML:'(no #swapBody)'");
          targets.push({k:L.key,w:w,d:d,n:n,tags:tags,body:body});
        }catch(e){ targets.push({k:L.key,w:w,d:d,n:n,tags:'THREW: '+e.message,body:''}); }
      }));
    }));
  });
  console.log('  programs built for the probe: '+built+'/6; sheets opened: '+targets.length);
  if(!targets.length){console.log('  FAILED MEASUREMENT: no sheet was opened. This is not an absence of findings.');return;}
  const seen=new Set();
  targets.forEach(t=>{
    if(seen.has(t.n))return; seen.add(t.n);
    console.log('\n  ── '+t.n+'   ('+t.k+'  W'+t.w+'/'+t.d+')');
    console.log('     #swapTags  '+String(t.tags).replace(/<svg[\s\S]*?<\/svg>/g,'<svg/>'));
    const notes=String(t.body).match(/<span class="swap-cand-note">[^<]*<\/span>/g)||[];
    console.log('     load notes in #swapBody: '+notes.length);
    notes.slice(0,6).forEach(x=>console.log('       '+x));
  });
}
