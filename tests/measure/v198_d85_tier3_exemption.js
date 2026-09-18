// ════════════════════════════════════════════════════════════════════════════════════
// v198_d85_tier3_exemption.js — MEASURE PASS (read-only, rules nothing)
//
// §12 records: "capSessionBudget's tier-3 barbell exemption is asserted by NO gate.
// Removing the exemption entirely eats 34 additional leg-compound sections and trips
// nothing." This prints, on the SAME injury-carrying lattice as
// v198_d85_posterior_floor.js, what the exemption protects and what its removal costs.
// It is MEASUREMENT ONLY. The exemption is not ruled on and is not part of D85's edit.
//
// METHOD: text surgery on a COPY of the artifact, anchor asserted count==1, removing
// only the guard line at index.html:9512. Both artifacts are swept on the identical
// lattice with cfg.seed pinned; every difference is attributable to that one line.
// index.html is never written.
// ════════════════════════════════════════════════════════════════════════════════════
const path = require('path');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

// ── the lattice (verbatim from tests/gates/g197c_d84_cmp.js) ───────────────────────
const E_TIERS = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS = ['hypertrophy','balanced'];
const E_EXPS  = ['beginner','advanced'];
const E_GOALS = [ { k:'liftonly', id:null }, { k:'pace', id:'run_pace_goal' }, { k:'half', id:'run_half' } ];
const E_INJ   = [ { k:'healthy', v:null },
                  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' } },
                  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' } },
                  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' } } ];
const E_RESTS = [ { k:'sun', v:['sun'] }, { k:'sun+wed', v:['sun','wed'] }, { k:'sat+sun', v:['sat','sun'] } ];
const E_SEEDS = [1013, 3039];
function eCfg(tier, focus, exp, g, inj, rest, seed) {
  const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
  return {
    name:'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30',
                                baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: tier, unit:'lbs', restDays: rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
  };
}
const LAT = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS) {
    const c = eCfg(t,f,x,g,i,r,sd);
    if (i.v) c.injury = { region:i.v.region, tier:i.v.tier };
    LAT.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,
               tier:t, focus:f, exp:x, goal:g.k, inj:i.k, rest:r.k, seed:sd, cfg:c });
  }

// ── HAND ORACLE: posterior chain by name. Never _pattern(). ────────────────────────
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);   // calf_iso is NOT posterior chain
const isLegCell = labels => labels.indexOf('Calves') >= 0 || labels.indexOf('Leg isolation') >= 0;
const postCount = names => names.reduce((a,n) => a + (E_POSTERIOR.has(ePat(n)) ? 1 : 0), 0);

// ── HAND ORACLE: the budget's own cost rule ────────────────────────────────────────
const eSets    = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const eStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf    = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost    = items => items.reduce((a,it) => a + (eStretch(it.n) ? 0 : (eHalf(it.n) ? eSets(it.d)*0.5 : eSets(it.d))), 0);

// ── HAND ORACLE: does this name carry an explicit implement token? Used ONLY to split
// the tier-3 population into "named barbell/loaded" vs "reached 3 by the fall-through".
const hasImplementTok = n => /barbell|trap bar|weighted|loaded|smith|dumbbell|kettlebell|\bdb\b|\bkb\b|machine|cable|band/i.test(n||'');


const GUARD = "        if(_compoundTier(it.name)===3) return;            // barbell compounds are never budget fodder\n";

function snap(sections){
  const labels = [], names = [], pairs = [];
  (sections||[]).forEach(sec => { const L=String((sec&&sec.label)||''); labels.push(L);
    ((sec&&sec.items)||[]).forEach(it => { const n=String((it&&it.name)||'');
      names.push(n); pairs.push(L+'\u0001'+n); }); });
  return { labels, names, pairs };
}
function scan(artifact, mine){
  const IA = load(artifact);
  const out = {};
  mine.forEach(L => {
    const p = IA.buildProgram(L.cfg); const W = p.weeks||{};
    Object.keys(W).forEach(w => Object.keys(W[w]).forEach(d => {
      const day = W[w][d]; if(!day||day.rest||!Array.isArray(day.sections)) return;
      out[L.key+'#W'+w+'/'+d] = snap(day.sections);
    }));
  });
  return out;
}
const LEG_LABEL = /leg|calves|squat|lunge|hinge|posterior|glute|hamstring/i;

if(process.env.MSHARD !== undefined){
  const si=parseInt(process.env.MSHARD,10), sn=parseInt(process.env.MSHARDS,10);
  const mine = LAT.filter((_,i)=>i%sn===si);
  const A = scan(process.argv[2], mine), B = scan(process.argv[3], mine);
  const R = { cells:0, changedCells:0, itemsA:0, itemsB:0, lostNames:{}, lostSecLabels:{},
              legCompoundSecsLost:0, legSecLostLabels:{}, postFreeA:0, postFreeB:0,
              legCellsA:0, legCellsB:0, sectionsA:0, sectionsB:0 };
  Object.keys(A).forEach(k => {
    const a=A[k], b=B[k]||{labels:[],names:[],pairs:[]};
    R.cells++; R.itemsA+=a.names.length; R.itemsB+=b.names.length;
    R.sectionsA+=a.labels.length; R.sectionsB+=b.labels.length;
    if(isLegCell(a.labels)){ R.legCellsA++; if(postCount(a.names)===0) R.postFreeA++; }
    if(isLegCell(b.labels)){ R.legCellsB++; if(postCount(b.names)===0) R.postFreeB++; }
    if(a.pairs.join('|')===b.pairs.join('|')) return;
    R.changedCells++;
    const bc={}; b.pairs.forEach(p=>bc[p]=(bc[p]||0)+1);
    a.pairs.forEach(p=>{ if(bc[p]){bc[p]--; return;} const [lab,n]=p.split('\u0001');
      R.lostNames[n]=(R.lostNames[n]||0)+1; });
    const bl={}; b.labels.forEach(l=>bl[l]=(bl[l]||0)+1);
    a.labels.forEach(l=>{ if(bl[l]){bl[l]--; return;}
      R.lostSecLabels[l]=(R.lostSecLabels[l]||0)+1;
      if(LEG_LABEL.test(l)){ R.legCompoundSecsLost++; R.legSecLostLabels[l]=(R.legSecLostLabels[l]||0)+1; } });
  });
  fs.writeFileSync(process.env.MOUT, JSON.stringify(R)); process.exit(0);
}

const base = process.argv[2] || path.join(__dirname,'..','..','index.html');
const RAW = fs.readFileSync(base,'utf8');
const n = RAW.split(GUARD).length - 1;
console.log('ANCHOR tier-3 guard line count = ' + n + ' (must be 1)');
if(n!==1){ console.log('FAIL: anchor not unique, measurement aborted'); process.exit(2); }
const ver=(RAW.match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'v198t3-'));
const mut = path.join(tmp,'no_t3.html');
fs.writeFileSync(mut, RAW.replace(GUARD,''));
console.log('ARTIFACT ' + base + ' ia-version=' + ver + '  vs  same file with :9512 removed');
console.log('LATTICE  ' + LAT.length + ' config keys');
const SH = parseInt(process.argv[3]||String(Math.min(8,os.cpus().length)),10);
let done=0; const outs=[];
for(let i=0;i<SH;i++){ const o=path.join(tmp,'s'+i+'.json'); outs.push(o);
  const ch=fork(__filename,[base,mut],{env:Object.assign({},process.env,{MSHARD:String(i),MSHARDS:String(SH),MOUT:o}),stdio:'inherit'});
  ch.on('exit',c=>{ if(c!==0){console.log('FAIL: shard '+i+' exit '+c); process.exit(4);} if(++done===SH) rep(); });
}
function top(o,k){ return Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,k).map(x=>x+' '+o[x]); }
function rep(){
  const R={cells:0,changedCells:0,itemsA:0,itemsB:0,legCompoundSecsLost:0,postFreeA:0,postFreeB:0,
           legCellsA:0,legCellsB:0,sectionsA:0,sectionsB:0,lostNames:{},lostSecLabels:{},legSecLostLabels:{}};
  outs.forEach(o=>{ const x=JSON.parse(fs.readFileSync(o,'utf8'));
    Object.keys(x).forEach(k=>{ if(typeof x[k]==='number') R[k]+=x[k];
      else Object.keys(x[k]).forEach(kk=>R[k][kk]=(R[k][kk]||0)+x[k][kk]); }); });
  console.log('\n── BLAST RADIUS OF REMOVING THE TIER-3 EXEMPTION ────────────────────────');
  console.log('day cells compared        ' + R.cells);
  console.log('cells that change         ' + R.changedCells + ' (' + (100*R.changedCells/R.cells).toFixed(3) + '%)');
  console.log('items:    with guard ' + R.itemsA + '   without ' + R.itemsB + '   delta ' + (R.itemsB-R.itemsA));
  console.log('sections: with guard ' + R.sectionsA + '   without ' + R.sectionsB + '   delta ' + (R.sectionsB-R.sectionsA));
  console.log('leg cells:            ' + R.legCellsA + ' -> ' + R.legCellsB);
  console.log('posterior-free leg cells: ' + R.postFreeA + ' -> ' + R.postFreeB);
  console.log('leg-ish sections lost:    ' + R.legCompoundSecsLost);
  console.log('  ' + top(R.legSecLostLabels,12).join('  |  '));
  console.log('all section labels lost:  ' + top(R.lostSecLabels,14).join('  |  '));
  console.log('item names the exemption was protecting (lost when it goes):');
  top(R.lostNames,25).forEach(x=>console.log('   ' + x));
  console.log('\nMEASURED ' + R.cells + ' day cells. No ruling. No edit to index.html.');
  try{ outs.forEach(o=>fs.unlinkSync(o)); fs.unlinkSync(mut); }catch(e){}
}
