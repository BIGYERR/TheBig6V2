// v226 measure — re-baseline P-BEGINNERMILE (held ruling, v212_rulings/p_pacedisclose_ruling.md Call 2, M1, M4) on V225.
// Usage: node v226_rebase_beginnermile.js <index.html> <scratch>
// Arms: B = V225 as shipped; SX = source surgery removing every beginner mile-gate clause (11 anchors, 9 sites);
//       SV = SX but the validator's beginner early return (:7484) kept. Anchors asserted count==1.
// ORACLES (never the suspect): hand default table {beginner:690, intermediate:570, advanced:450} (D9, V176);
//   hand chart bounds 5:00/12:00 (D9 advisory text as ruled); hand m:ss; "none byte-identical" = digest(B)==digest(SX);
//   "as an intermediate would" = beginner-SX card tokens vs intermediate-B card tokens on the same goal/seed/age.
const path=require('path'), fs=require('fs');
const ART=path.resolve(process.argv[2]), SCR=path.resolve(process.argv[3]);
const R=Date; const NOW=new R(2026,8,30,9,0,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}} globalThis.Date=F;
const H=require(path.resolve(__dirname,'..','harness.js'));
const Q="'";
const ANCH=[
 ['A1 wizard hide (pace goal branch) :2855', "${WD.experience !== 'beginner' ? `", "${true ? `"],
 ['A2 wizard hide (other run goals) :2876', "(t==='run' && WD.experience !== 'beginner')", "(t==='run')"],
 ['A3 assessRunPaceCeiling :2433', "const mileBest = (exp !== 'beginner' && g.mileBestMins", "const mileBest = (g.mileBestMins"],
 ['A4 calcProgramLength :3179', "var _mileBestSecs = (experience !== 'beginner' && goal.mileBestMins", "var _mileBestSecs = (goal.mileBestMins"],
 ['A5 buildRunSession anchor :3815', "(experience !== 'beginner' && arguments[12])", "(arguments[12])"],
 ['A6 buildNRCSession anchor :4376', "(experience !== 'beginner' && mileBestSecs)", "(mileBestSecs)"],
 ['A7 runAnchorInfo rawSec :14709', "const rawSec = (exp !== 'beginner' && entered)", "const rawSec = (entered)"],
 ['A8 runAnchorInfo clamped :14715', "(exp !== 'beginner' && !!entered && Math.round", "(!!entered && Math.round"],
 ['A9 runAnchorInfo kind :14717', "const kind = exp === 'beginner' ? 'beginner' : !entered", "const kind = !entered"],
 ['A10 _mileEntryState early return :7484', "if(!g||exp==='beginner') return {ok:true};", "if(!g) return {ok:true};"],
 ['A11 pencil hide :14823', "s.runAnchor.kind!=='beginner'?", "true?"],
];
function surg(src, skip){ let s=src; for(const [n,a,r] of ANCH){ if(skip&&skip.includes(n.split(' ')[0])) continue; const c=s.split(a).length-1; console.log('  anchor',n,'count',c); if(c!==1) throw new Error('anchor count '+c+' '+n); s=s.replace(a,()=>r); } return s; }
const src=fs.readFileSync(ART,'utf8');
const FILES={B:path.join(SCR,'v226_B.html'),SX:path.join(SCR,'v226_SX.html'),SV:path.join(SCR,'v226_SV.html')};
Object.values(FILES).forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});
fs.writeFileSync(FILES.B,src); console.log('== surgery SX'); fs.writeFileSync(FILES.SX,surg(src)); console.log('== surgery SV (A10 kept)'); fs.writeFileSync(FILES.SV,surg(src,['A10']));
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const clk=s=>{ if(s==null) return '-'; const t=Math.round(s); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); };
function mkVM(f){ const IA=H.load(f); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); }; return {IA,els}; }
const V={B:mkVM(FILES.B),SX:mkVM(FILES.SX),SV:mkVM(FILES.SV)};
console.log('ia-version B',V.B.IA.version,'SX',V.SX.IA.version);
function cfgOf(goal,exp,seed,mile,age){
  const g={id:goal,label:goal,baselineDist:'',baseline:''};
  if(goal==='run_pace_goal'){g.targetDist='1.5';g.targetMins='12';g.targetSecs='0';}
  if(mile){g.mileBestMins=String(Math.floor(mile/60));g.mileBestSecs=String(mile%60);g.mileBestSrc={kind:'entered'};}
  const race=['run_5k','run_10k','run_half'].includes(goal);
  const c={name:'M',primaryPath:race?'event':'hybrid',cardioTypes:['run'],cardioGoals:{run:g},liftingFocus:'balanced',experience:exp,ageBracket:age||'18-35',
    equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed};
  if(race){c.eventTargeted=true;c.raceDate='2027-01-31';}
  return c; }
function strs(o,acc=[]){if(o==null)return acc;if(typeof o==='string')acc.push(o);else if(Array.isArray(o))o.forEach(x=>strs(x,acc));else if(typeof o==='object')Object.values(o).forEach(x=>strs(x,acc));return acc;}
const strip=s=>s.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,'');
function w1(p){ const out=[]; const W=p.weeks['1']||{}; DAYS.forEach(d=>{ const day=W[d]; if(!day||!day.cardio) return; [].concat(day.cardio).forEach(c=>{ if(!c||c.type!=='run') return;
  const txt=strs(c).map(strip).join(' || '); const toks=(txt.match(/\d{1,2}:\d{2}\/mi/g)||[]); out.push({d,st:c.subtype||c.type,name:c.name||c.title||'',toks:[...new Set(toks)],txt}); }); }); return out; }
function build(arm,cfg){ const IA=V[arm].IA; const p=IA.buildProgram(JSON.parse(JSON.stringify(cfg))); IA.window.__C=cfg;
  const a=IA.eval('runAnchorInfo(__C)'); const sent=a?strip(IA.eval('runAnchorSentence(runAnchorInfo(__C))')):null;
  return {dg:H.progDigest(p),L:p.totalWeeks,w1:w1(p),anc:a?{raw:a.rawSec,row:a.row.mile,kind:a.kind,cl:a.clamped}:null,sent}; }
const mileEntry=(arm,g,exp)=>{ V[arm].IA.window.__G=g; V[arm].IA.window.__E=exp; return V[arm].IA.eval('JSON.stringify(_mileEntryState(__G,__E))'); };
// ---------- 0. HALF_MANNY + self-identity
console.log('\n== 0. HALF_MANNY digest (expect 0ac7da6b1691a8e1)');
for(const arm of ['B','SX','SV']){ const d1=H.progDigest(V[arm].IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)))); const d2=H.progDigest(V[arm].IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)))); console.log(' ',arm,d1,'self-equal',d1===d2); }
// ---------- 2. premise reprint: beginner no mile seed 1000 W1
console.log('\n== 2. premise: beginner, no mile, seed 1000, W1 run cards (B)');
for(const goal of ['run_pace_goal','run_5k','run_base']){ const r=build('B',cfgOf(goal,'beginner',1000,0)); console.log('--',goal,'L',r.L,'anchor',JSON.stringify(r.anc)); r.w1.forEach(x=>console.log('  ',x.d,x.st,'|',x.name,'| toks',x.toks.join(' '),'|',x.txt.slice(0,260))); }
console.log('\n== 2b. same W1, beginner mile 13:00 and 9:00: B vs SX (tokens per card)');
for(const goal of ['run_pace_goal','run_5k','run_base']) for(const m of [780,540]){ const b=build('B',cfgOf(goal,'beginner',1000,m)), x=build('SX',cfgOf(goal,'beginner',1000,m));
  console.log('--',goal,'mile',clk(m),'L B/SX',b.L,x.L); b.w1.forEach((c,i)=>console.log('  ',c.d,c.st,'B:',c.toks.join(' ')||'(none)','| SX:',(x.w1[i]||{toks:[]}).toks.join(' ')||'(none)')); }
// ---------- 3. M1 seed path + fixtures
console.log('\n== 3. M1. harness fixtures:',Object.keys(H.fixtures).map(k=>k+'('+H.fixtures[k].experience+', mileBest='+(H.fixtures[k].cardioGoals.run||{}).mileBestMins+')').join(', '));
const gd=path.resolve(__dirname,'..','gates'); let gl=0; const gf=new Set(); fs.readdirSync(gd).filter(f=>f.endsWith('.js')).forEach(f=>fs.readFileSync(path.join(gd,f),'utf8').split('\n').forEach((l,i)=>{ if(/beginner/.test(l)&&/mileBest|mileSec/.test(l)){gl++;gf.add(f+':'+(i+1));} }));
console.log('  gate lines with beginner AND mileBest|mileSec on one line:',gl,[...gf].join(' '));
function wizGen(arm,o){ const {IA,els}=V[arm]; IA.window.__O=o; els.clear(); IA.localStorage._map.clear();
  IA.eval(`WD={primaryPath:__O.pp,cardioTypes:['run'],experience:__O.exp,ageBracket:'18-35',eventTargeted:__O.ev,raceDate:__O.race,liftingFocus:'balanced',equipment:'crossfit',restDays:['sun','wed'],unit:'lbs',seed:1000,name:'M',cardioGoals:{run:__O.run},startDate:undefined}; activeProg=null;`);
  if(o.seedMile){ IA.eval(`WD._seed={mileSec:${o.seedMile},maxDist:2,progName:'PRIOR',n:6}; applySeedData();`); }
  let body=''; try{ IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep()'); body=els.get('wizardBody').innerHTML; }catch(e){ body='RENDER THREW '+e.message; }
  const st=IA.eval('JSON.stringify(_mileEntryState())');
  try{IA.eval('doGenerate()');}catch(e){return {body,st,err:'threw '+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval('activeProg'); const toast=(els.get('toast')||{textContent:''}).textContent;
  if(!p) return {body,st,err:'no program',toast}; return {body,st,p,src:JSON.stringify(p.cfg.cardioGoals.run.mileBestSrc||null),mb:p.cfg.cardioGoals.run.mileBestMins+':'+p.cfg.cardioGoals.run.mileBestSecs}; }
const goalRun=g=>{ const r={id:g,label:g,baselineDist:'',baseline:''}; if(g==='run_pace_goal'){r.targetDist='1.5';r.targetMins='12';r.targetSecs='0';} return r; };
const wo=(g,exp,extra)=>Object.assign({pp:['run_5k','run_10k','run_half'].includes(g)?'event':'hybrid',exp,ev:['run_5k','run_10k','run_half'].includes(g),race:['run_5k','run_10k','run_half'].includes(g)?'2027-01-31':null,run:goalRun(g)},extra||{});
for(const g of ['run_pace_goal','run_5k','run_base']) for(const sm of [540,780]){ for(const arm of ['B','SX']){ const r=wizGen(arm,wo(g,'beginner',{seedMile:sm}));
  if(r.err){ console.log('  M1',g,'seed',clk(sm),arm,'ERR',r.err,r.toast||''); continue; }
  const W=w1(r.p); console.log('  M1',g,'seeded',clk(sm),arm,'cfg mile',r.mb,'src',r.src,'L',r.p.totalWeeks,'dg',H.progDigest(r.p),'| W1',W.map(c=>c.st+'['+c.toks.join(' ')+']').join(' ')); } }
// ---------- 5. wizard render per goal/exp/arm, validator on blank, doGenerate on blank pace goal
console.log('\n== 5. wizard mile field + validator on a BLANK mile');
const GOALS=['run_pace_goal','run_5k','run_base','run_10k','run_half'];
for(const g of GOALS) for(const exp of ['beginner','intermediate']) for(const arm of ['B','SX','SV']){ const r=wizGen(arm,wo(g,exp));
  const has=/Current mile time/.test(r.body); const lab=(r.body.match(/Current mile time <span[^>]*>([^<]*)</)||[])[1]||'';
  console.log(' ',g.padEnd(13),exp.padEnd(12),arm.padEnd(2),'field',has?'YES':'no ','label',JSON.stringify(lab),'validator',r.st,'build',r.err?('REFUSED '+r.err+' toast='+JSON.stringify(r.toast)):('ok L'+r.p.totalWeeks)); }
console.log('  validator probes (explicit args): beginner pace blank B',mileEntry('B',{id:'run_pace_goal'},'beginner'),'SX',mileEntry('SX',{id:'run_pace_goal'},'beginner'),'SV',mileEntry('SV',{id:'run_pace_goal'},'beginner'));
console.log('  beginner 13:00 advisory: B',mileEntry('B',{id:'run_5k',mileBestMins:'13',mileBestSecs:'0'},'beginner'),'SX',mileEntry('SX',{id:'run_5k',mileBestMins:'13',mileBestSecs:'0'},'beginner'));
console.log('  D116 sheet shape (no id) beginner blank SX',mileEntry('SX',{mileBestMins:'',mileBestSecs:''},'beginner'),'| intermediate 13:00 B',mileEntry('B',{mileBestMins:'13',mileBestSecs:'0'},'intermediate'));
// projection card reader :17396 (ungated): does the intake line print a beginner's mile?
const pc=V.B.IA.eval(`(function(){var ee={weekly:{1:{secs:900,n:3},2:{secs:890,n:3}}}; try{return buildProjectionCard(ee,11,780);}catch(e){return 'THREW '+e.message;}})()`);
console.log('  buildProjectionCard(ee,11,780) contains "your 13:00 mile":',/your 13:00 mile/.test(pc),'len',pc.length);
// ---------- 4. M4 lattice
console.log('\n== 4. M4 lattice');
const SEEDS=Array.from({length:20},(_,i)=>1000+i*37), MILES=[0,540,690,780];
const rows=[]; let self=0, selfN=0; const t0=R.now();
for(const g of GOALS) for(const m of MILES) for(const s of SEEDS){ const c=cfgOf(g,'beginner',s,m); const b=build('B',c), b2=build('B',c), x=build('SX',c); selfN++; if(b.dg===b2.dg) self++;
  const xi=build('B',cfgOf(g,'intermediate',s,m)), xi2=build('SX',cfgOf(g,'intermediate',s,m)); rows.push({g,m,s,b,x,ib:xi,ix:xi2}); }
console.log('  cells',rows.length,'secs',((R.now()-t0)/1000).toFixed(0),'| B self-identity',self+'/'+selfN);
const seg={}; const inc=(k,p)=>{seg[k]=seg[k]||[0,0]; seg[k][1]++; if(p) seg[k][0]++;};
rows.forEach(r=>{ const k=r.g+' mile '+(r.m?clk(r.m):'none');
  inc('(a) beginner B==SX digest | '+k, r.b.dg===r.x.dg);
  inc('(i) intermediate B==SX digest | '+r.g, r.ib.dg===r.ix.dg);
  if(r.m){ const tb=JSON.stringify(r.x.w1.map(c=>[c.st,c.toks])), ti=JSON.stringify(r.ib.w1.map(c=>[c.st,c.toks]));
    inc('(c) beginner-SX W1 run tokens == intermediate-B | '+k, tb===ti); inc('(c) L beginner-SX == L intermediate-B | '+k, r.x.L===r.ib.L);
    const pB=r.x.w1.map(c=>c.toks.join(',')).sort().join('|'), pI=r.ib.w1.map(c=>c.toks.join(',')).sort().join('|'); inc('(c) W1 pace token multiset equal (ignoring day/subtype) | '+k, pB===pI); } });
Object.keys(seg).sort().forEach(k=>console.log('  ',k.padEnd(78),seg[k][0]+'/'+seg[k][1]));
console.log('\n  (b) anchor/row/kind per goal x mile (seed 1000), B vs SX; hand default 690, hand chart floor 12:00');
GOALS.forEach(g=>MILES.forEach(m=>{ const r=rows.find(x=>x.g===g&&x.m===m&&x.s===1000); console.log('   ',g.padEnd(13),(m?clk(m):'none').padEnd(5),'B',JSON.stringify(r.b.anc),'| SX',JSON.stringify(r.x.anc),'| L B/SX',r.b.L+'/'+r.x.L); }));
console.log('\n  (b) card sentence seed 1000 run_5k: B none:',rows.find(x=>x.g==='run_5k'&&!x.m&&x.s===1000).b.sent,'\n      SX none:',rows.find(x=>x.g==='run_5k'&&!x.m&&x.s===1000).x.sent,'\n      SX 13:00:',rows.find(x=>x.g==='run_5k'&&x.m===780&&x.s===1000).x.sent);
console.log('\n  (c) examples of beginner-SX vs intermediate-B W1 differences (first 2 per goal x mile):');
const shown={}; rows.filter(r=>r.m).forEach(r=>{ const k=r.g+r.m; const tb=JSON.stringify(r.x.w1.map(c=>[c.st,c.toks])), ti=JSON.stringify(r.ib.w1.map(c=>[c.st,c.toks])); if(tb===ti) return; shown[k]=(shown[k]||0)+1; if(shown[k]>2) return;
  console.log('   ',r.g,clk(r.m),'seed',r.s,'L beg/int',r.x.L+'/'+r.ib.L,'\n      BEG-SX',r.x.w1.map(c=>c.d+' '+c.st+'['+c.toks.join(' ')+']').join(' ; '),'\n      INT-B ',r.ib.w1.map(c=>c.d+' '+c.st+'['+c.toks.join(' ')+']').join(' ; ')); });
// age axis for (c) on run_pace_goal 9:00
console.log('\n  (c-age) run_pace_goal 9:00, beginner-SX vs intermediate-B, W1 tokens equal and L equal, per age (20 seeds):');
for(const age of ['18-35','36-54','55+']){ let t=0,l=0; const ex=[]; SEEDS.forEach(s=>{ const a=build('SX',cfgOf('run_pace_goal','beginner',s,540,age)), b=build('B',cfgOf('run_pace_goal','intermediate',s,540,age));
  const eq=JSON.stringify(a.w1.map(c=>c.toks))===JSON.stringify(b.w1.map(c=>c.toks)); if(eq)t++; if(a.L===b.L)l++; if(!eq&&ex.length<1) ex.push('seed '+s+' L '+a.L+'/'+b.L+' BEG '+a.w1.map(c=>c.st+'['+c.toks.join(' ')+']').join(' ')+' INT '+b.w1.map(c=>c.st+'['+c.toks.join(' ')+']').join(' ')); });
  console.log('   ',age,'tokens equal',t+'/20','L equal',l+'/20',ex.join('')); }
console.log('\nDONE');
