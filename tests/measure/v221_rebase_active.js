// v221 measure: re-baseline of P-ACTIVE (tests/measure/v221_rulings/p_active_ruling.md) on V220.
// Usage: node tests/measure/v221_rebase_active.js <old.html> <new.html>
// Parts: A) run v221_open_vs_active.js unmodified on both, side by side
//        B) invariant census per path: ia_active / activeProgId / activeProg.id
//           oracle = the ruling's stated invariant (all three equal, or all null), not any engine function
//        C) copy text of the ruling's item-1/5 sites, read from source
//        D) progDigest on every fixture, both artifacts, each built twice (baseline==itself first)
const path=require('path'), cp=require('child_process'), fs=require('fs');
const H=require(path.join(__dirname,'..','harness.js'));
const ARTS=[process.argv[2],process.argv[3]]; if(!ARTS[0]||!ARTS[1]){console.log('usage: old new');process.exit(2);}
const tag=a=>'V'+H.load(a).version;
const TAGS=ARTS.map(tag);
// ---------- A ----------
console.log('== PART A: v221_open_vs_active.js unmodified ==');
const A={};
ARTS.forEach((a,i)=>{let out; try{out=cp.execFileSync('node',[path.join(__dirname,'v221_open_vs_active.js'),a],{encoding:'utf8',maxBuffer:1<<26});}catch(e){out='CRASH '+e.message+'\n'+(e.stdout||'');}
  A[TAGS[i]]=out.split('\n').filter(l=>/^\s*(PASS|FAIL) |PASS \d+ FAIL \d+|REBOOT|SPLIT|CRASH|THREW|MISSING/.test(l)).map(l=>l.trim());});
const n=Math.max(...TAGS.map(t=>A[t].length));
for(let k=0;k<n;k++){const l=A[TAGS[0]][k]||'', r=A[TAGS[1]][k]||''; console.log((l===r?'  same ':'  DIFF ')+l.padEnd(80).slice(0,80)+' | '+(l===r?'':r));}
// ---------- B ----------
console.log('\n== PART B: invariant census (oracle: ia_active===activeProgId===activeProg.id, or all null) ==');
function world(art,{active='P0',p1Archived=false}={}){
  const IA=H.load(art); const LS=IA.localStorage, ev=IA.eval;
  const fx=typeof H.fixtures==='function'?H.fixtures():H.fixtures; const cfgs=Object.values(fx);
  const progs=[0,1,2].map(i=>{const p=IA.buildProgram(Object.assign({},cfgs[i%cfgs.length],{seed:1000+i})); p.id='P'+i; p.name='Prog'+i; p.startDate='2026-09-07'; return p;});
  progs[2].archived=true; if(p1Archived) progs[1].archived=true;
  LS.setItem('ia_programs',JSON.stringify(progs)); if(active===null) LS.removeItem('ia_active'); else LS.setItem('ia_active',active);
  ev('activeProgId=null;activeProg=null;');
  const run=s=>{try{ev(s);}catch(e){return 'THREW '+e.message;} return '';};
  return {IA,LS,ev,run,cfgs};
}
function snap(w){const g=s=>{try{return w.ev(s);}catch(e){return 'ERR';}};
  const r={ia_active:w.LS.getItem('ia_active'),activeProgId:g('activeProgId'),activeProgDotId:g('activeProg?activeProg.id:null'),screen:g('(document.querySelector&&0)')||''};
  const vals=[r.ia_active,r.activeProgId,r.activeProgDotId];
  r.inv=(vals.every(v=>v===null)||(vals[0]!==null&&vals.every(v=>v===vals[0])))?'HOLDS':'BROKEN';
  return r;}
const paths=[
 ['boot, ia_active=P0 (live)',            {active:'P0'},  w=>w.run('init()')],
 ['boot, ia_active missing',              {active:null},  w=>w.run('init()')],
 ['boot, ia_active=PX stale (fallback)',  {active:'PX'},  w=>w.run('init()')],
 ['boot, ia_active=P2 archived (fallback)',{active:'P2'}, w=>w.run('init()')],
 ['wizard commit (doGenerate, flushed)',  {active:'P0'},  w=>{w.run('init()'); w.ev('WD=Object.assign(WD||{},'+JSON.stringify(Object.assign({},w.cfgs[0],{seed:4242}))+')'); const t=w.run('doGenerate()'); w.IA.flushTimers(50); return t;}],
 ['setActive(P1)',                        {active:'P0'},  w=>{w.run('init()'); return w.run('setActive("P1")');}],
 ['openProg(P1)',                         {active:'P0'},  w=>{w.run('init()'); return w.run('openProg("P1")');}],
 ['openProg(P2 archived)',                {active:'P0'},  w=>{w.run('init()'); return w.run('openProg("P2")');}],
 ['setActive(P2 archived)',               {active:'P0'},  w=>{w.run('init()'); return w.run('setActive("P2")');}],
 ['archive active P0 (handoff to P1)',    {active:'P0'},  w=>{w.run('init()'); return w.run('archiveProg("P0")');}],
 ['delete active P0 (handoff to P1)',     {active:'P0'},  w=>{w.run('init()'); return w.run('deleteProg("P0")');}],
 ['archive active P0, none left (null arm)',{active:'P0',p1Archived:true}, w=>{w.run('init()'); return w.run('archiveProg("P0")');}],
 ['delete active P0, none left (null arm)',{active:'P0',p1Archived:true}, w=>{w.run('init()'); return w.run('deleteProg("P0")');}],
 ['setActive(P1) then reboot',            {active:'P0'},  w=>{w.run('init()'); w.run('setActive("P1")'); w.ev('activeProgId=null;activeProg=null;'); return w.run('init()');}],
 ['openProg(P1) then reboot',             {active:'P0'},  w=>{w.run('init()'); w.run('openProg("P1")'); w.ev('activeProgId=null;activeProg=null;'); return w.run('init()');}],
 ['split: setActive(P1) then archive P1', {active:'P0'},  w=>{w.run('init()'); w.run('setActive("P1")'); return w.run('archiveProg("P1")');}],
 ['split: openProg(P1) then archive P0',  {active:'P0'},  w=>{w.run('init()'); w.run('openProg("P1")'); return w.run('archiveProg("P0")');}],
];
const tally={};
ARTS.forEach((art,i)=>{const T=TAGS[i]; tally[T]={h:0,b:0}; console.log('-- '+T);
  console.log('  '+'path'.padEnd(42)+'ia_active'.padEnd(11)+'activeProgId'.padEnd(14)+'activeProg.id'.padEnd(15)+'invariant  note');
  for(const [name,opt,fn] of paths){ let note=''; let r; try{const w=world(art,opt); note=fn(w)||''; r=snap(w);}catch(e){r={ia_active:'-',activeProgId:'-',activeProgDotId:'-',inv:'CRASH'}; note=e.message;}
    r.inv==='HOLDS'?tally[T].h++:tally[T].b++;
    console.log('  '+name.padEnd(42)+String(r.ia_active).padEnd(11)+String(r.activeProgId).padEnd(14)+String(r.activeProgDotId).padEnd(15)+r.inv.padEnd(11)+note);}
  console.log(`  ${T} invariant HOLDS ${tally[T].h} BROKEN ${tally[T].b} of ${paths.length} paths`);});
// ---------- C ----------
console.log('\n== PART C: copy sites (source text) ==');
const sites=[['OPEN button',/<button class="prog-action-btn primary" onclick="openProg\('\$\{p\.id\}'\)">[^<]*<\/button>/g],
 ['SET ACTIVE button',/onclick="setActive\('\$\{p\.id\}'\)">[^<]*<\/button>/g],
 ['Active check label',/cursor:default">Active [^<]*<\/button>/g],
 ['card goal line',/_cts\.map\(t=>asyIcon[^\n]*\.join\(' \+ '\)/g],
 ['wizard review line',/WD\.cardioTypes\.map\(t => asyIcon[^\n]*\.join\(' \+ '\)/g],
 ['setActive body',/function setActive\(id\)\{[^\n]*/g],['openProg body',/function openProg\(id\)\{[^\n]*/g],
 ['boot resolver',/const aid=getActiveProgId\(\);[^\n]*\n[^\n]*/g],['wizard commit',/setActiveProgId\(prog\.id\);[^\n]*/g]];
const src=ARTS.map(a=>fs.readFileSync(a,'utf8'));
for(const [nm,re] of sites){const m=src.map(s=>(s.match(re)||[]));
  const lineOf=(s,t)=>t?s.slice(0,s.indexOf(t)).split('\n').length:'-';
  console.log(`  ${nm}: ${TAGS[0]} n=${m[0].length} :${lineOf(src[0],m[0][0])}  ${TAGS[1]} n=${m[1].length} :${lineOf(src[1],m[1][0])}  text ${JSON.stringify(m[0])===JSON.stringify(m[1])?'IDENTICAL':'CHANGED'}`);
  console.log('    '+(m[1][0]||'(no match)').slice(0,260));}
// ---------- D ----------
console.log('\n== PART D: progDigest, all fixtures ==');
const dig={};
ARTS.forEach((art,i)=>{const IA=H.load(art); const fx=typeof H.fixtures==='function'?H.fixtures():H.fixtures; dig[TAGS[i]]={};
  for(const k of Object.keys(fx)){const a=H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fx[k])))), b=H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fx[k])))); dig[TAGS[i]][k]=a===b?a:'SELF-MISMATCH '+a+'/'+b;}});
let same=0,tot=0; for(const k of Object.keys(dig[TAGS[0]])){tot++; const l=dig[TAGS[0]][k], r=dig[TAGS[1]][k]; if(l===r&&!/MISMATCH/.test(l)) same++; console.log('  '+k.padEnd(28)+l+'  '+r+'  '+(l===r?'same':'MOVED'));}
console.log(`  fixtures identical ${same} of ${tot}; HALF_MANNY ${TAGS[1]}=${dig[TAGS[1]].HALF_MANNY} expect 0ac7da6b1691a8e1 -> ${dig[TAGS[1]].HALF_MANNY==='0ac7da6b1691a8e1'?'PASS':'FAIL'}`);
console.log('DONE');
