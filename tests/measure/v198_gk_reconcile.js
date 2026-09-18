// GATEKEEPER reconciliation sweep, V198 / D85. Read-only on the artifact.
// Adjudicates: (1) 3219 vs 1989 footprint, (2) zero-posterior WEEK census per
// injury state, (3) over-cap against the INTERFERENCE-ADJUSTED cap.
// Two posterior definitions are carried side by side, on purpose:
//   DEF_ENGINE = {hinge, hip_ext}          — what index.html's _isPost actually tests
//   DEF_COACH  = {hinge, hip_ext, leg_iso} — measure's E_POSTERIOR, which counts
//                                            'Leg extension' as posterior chain
// Hand regexes throughout. The engine's _pattern is never called.
const path = require('path'), fs = require('fs'), os = require('os'), crypto = require('crypto');
const { fork } = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

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
  return { name:'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30',
      baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: tier, unit:'lbs', restDays: rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed };
}
const LAT = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS) {
    const c = eCfg(t,f,x,g,i,r,sd);
    if (i.v) c.injury = { region:i.v.region, tier:i.v.tier };
    LAT.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`, inj:i.k, cfg:c });
  }

const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
const DEF_ENGINE = new Set(['hinge','hip_ext']);
const DEF_COACH  = new Set(['hinge','hip_ext','leg_iso']);
const nPost = (names, D) => names.reduce((a,n) => a + (D.has(ePat(n)) ? 1 : 0), 0);
const isLegLabelCell = labels => labels.indexOf('Calves') >= 0 || labels.indexOf('Leg isolation') >= 0;
const LEG_MOVE = /squat|lunge|step-?up|leg press|deadlift|hip thrust|glute|hamstring|leg curl|leg extension|calf|calves|wall sit|nordic|split squat|bridge|\bswing\b|good morning|romanian|back extension|hip airplane/i;
const isLegDay = names => names.some(n => LEG_MOVE.test(String(n||'')));

const eSets    = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const eStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf    = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost    = items => items.reduce((a,it) => a + (eStretch(it.n) ? 0 : (eHalf(it.n) ? eSets(it.d)*0.5 : eSets(it.d))), 0);

function snap(sections){
  const labels = [], names = [], items = [];
  (sections||[]).forEach(sec => { labels.push(String((sec&&sec.label)||''));
    ((sec&&sec.items)||[]).forEach(it => { const n = String((it&&it.name)||'');
      names.push(n); items.push({ n, d:String((it&&it.detail)||'') }); }); });
  return { labels, names, items };
}

function sweep(artifact, mine){
  const IA = load(artifact);
  IA.eval("var __INTERF=function(c){try{return _cardioInterference(c);}catch(e){return 0;}};");
  const INTERF = IA.eval('__INTERF');
  const BUDGET = parseInt((IA.html.match(/const SESSION_SET_BUDGET = (\d+);/)||[])[1], 10);
  const R = { budget:BUDGET, configs:0, dayCells:0, legLabelCells:0, legDays:0,
              overCapAdj:0, overCapAdjGE:0, overCapAdjCeil:0, overCapFlat:0, cells:{},
              zwEngine:{}, zwCoach:{}, weeks:{}, legWeeks:{},
              pfEngine:0, pfCoach:0, pfEngineLegDay:0, pfCoachLegDay:0,
              pfEngineLegLabel:0, pfCoachLegLabel:0 };
  mine.forEach(L => {
    R.configs++;
    const prog = IA.buildProgram(L.cfg);
    const W = prog.weeks || {};
    Object.keys(W).forEach(w => {
      let wPostE = 0, wPostC = 0, wLeg = false, wCells = 0;
      Object.keys(W[w]).forEach(d => {
        const day = W[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) return;
        R.dayCells++; wCells++;
        const s = snap(day.sections);
        // per-cell fingerprint, keyed on (config, week, day) and hashing
        // (label, movement, detail) in order — never position alone.
        const pe = nPost(s.names, DEF_ENGINE), pc = nPost(s.names, DEF_COACH);
        R.cells[L.key + '|W' + w + '|' + d] =
          crypto.createHash('sha1').update(JSON.stringify([s.labels, s.items])).digest('hex').slice(0,12)
          + ':' + pe + ':' + (isLegLabelCell(s.labels)?1:0) + ':' + (isLegDay(s.names)?1:0) + ':' + L.inj;
        wPostE += pe; wPostC += pc;
        const legLbl = isLegLabelCell(s.labels), legDay = isLegDay(s.names);
        if(legLbl) R.legLabelCells++;
        if(legDay){ R.legDays++; wLeg = true; }
        if(pe === 0){ R.pfEngine++; if(legDay) R.pfEngineLegDay++; if(legLbl) R.pfEngineLegLabel++; }
        if(pc === 0){ R.pfCoach++;  if(legDay) R.pfCoachLegDay++;  if(legLbl) R.pfCoachLegLabel++; }
        // over cap, against the cap the engine actually computes
        const capAdj = Math.max(12, BUDGET - Math.round(INTERF(day.cardio)*2));
        const cost = eCost(s.items);
        if(cost > capAdj) R.overCapAdj++;
        if(cost >= capAdj) R.overCapAdjGE++;
        if(Math.ceil(cost) > capAdj) R.overCapAdjCeil++;
        if(cost > BUDGET) R.overCapFlat++;
      });
      if(!wCells) return;
      R.weeks[L.inj] = (R.weeks[L.inj]||0) + 1;
      if(wLeg) R.legWeeks[L.inj] = (R.legWeeks[L.inj]||0) + 1;
      if(wPostE === 0) R.zwEngine[L.inj] = (R.zwEngine[L.inj]||0) + 1;
      if(wPostC === 0) R.zwCoach[L.inj] = (R.zwCoach[L.inj]||0) + 1;
    });
  });
  return R;
}

if(process.env.MSHARD !== undefined){
  const si = parseInt(process.env.MSHARD,10), sn = parseInt(process.env.MSHARDS,10);
  fs.writeFileSync(process.env.MOUT, JSON.stringify(sweep(process.argv[2], LAT.filter((_,i)=>i%sn===si))));
  process.exit(0);
}
const artifact = process.argv[2], outFile = process.argv[3];
const SHARDS = parseInt(process.argv[4] || '8', 10);
const ver = (fs.readFileSync(artifact,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('ARTIFACT ' + artifact + '  ia-version=' + ver + '  lattice=' + LAT.length + ' configs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'v198gk-'));
let done = 0; const outs = [];
for(let i=0;i<SHARDS;i++){
  const o = path.join(tmp,'s'+i+'.json'); outs.push(o);
  fork(__filename, [artifact], { env: Object.assign({}, process.env,
    { MSHARD:String(i), MSHARDS:String(SHARDS), MOUT:o }), stdio:'inherit' })
  .on('exit', c => { if(c!==0){ console.log('FAIL shard '+i+' exit '+c); process.exit(4); }
    if(++done===SHARDS){
      let R = null;
      outs.forEach(o => { const s = JSON.parse(fs.readFileSync(o,'utf8'));
        if(!R){ R = s; return; }
        for(const k of Object.keys(s)){
          if(typeof s[k] === 'number'){ if(k!=='budget') R[k] += s[k]; }
          else Object.keys(s[k]).forEach(kk => R[k][kk] = (R[k][kk]||0) + s[k][kk]); }
      });
      R.version = ver; R.artifact = artifact;
      fs.writeFileSync(outFile, JSON.stringify(R));
      console.log('configs='+R.configs+' dayCells='+R.dayCells+' cellKeys='+Object.keys(R.cells).length);
      console.log('legLabelCells='+R.legLabelCells+' legDays='+R.legDays);
      console.log('overCapAdj gt='+R.overCapAdj+' ge='+R.overCapAdjGE+' ceilgt='+R.overCapAdjCeil+' flatgt='+R.overCapFlat);
      console.log('posterior-free day cells  ENGINE{hinge,hip_ext}='+R.pfEngine+'  COACH{+leg_iso}='+R.pfCoach);
      console.log('  of which leg-DAY        ENGINE='+R.pfEngineLegDay+'  COACH='+R.pfCoachLegDay);
      console.log('  of which leg-LABEL      ENGINE='+R.pfEngineLegLabel+'  COACH='+R.pfCoachLegLabel);
      console.log('weeks per injury          '+JSON.stringify(R.weeks));
      console.log('ZERO-POSTERIOR weeks ENGINE '+JSON.stringify(R.zwEngine));
      console.log('ZERO-POSTERIOR weeks COACH  '+JSON.stringify(R.zwCoach));
      process.exit(0);
    }});
}
