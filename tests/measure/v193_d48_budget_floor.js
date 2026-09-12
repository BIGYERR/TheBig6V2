// MEASURE v193 slice 4 (D48). Read-only census of one artifact: per tier and per seed,
// counts of core sections, empty sections, thin (1-item) core sections, non-optional
// sections by label, and prehab item counts under three candidate definitions.
// usage: node tests/measure/v193_d48_budget_floor.js <file.html> [--json out.json]
const path = require('path'); const fs = require('fs');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html';
const JSONOUT = (process.argv.indexOf('--json') > 0) ? process.argv[process.argv.indexOf('--json') + 1] : null;
const IA = load(FILE);
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// candidate prehab definitions
const NAME_PREHAB = /clamshell|side-lying|side steps|banded|band pull|face pull|external rotation|scap|wall sit|spanish squat|calf raise|tibialis|toe |ankle|monster walk|glute bridge|bird dog|dead bug|pallof|lateral raise|cuff|y-raise|w-raise|t-raise/i;
const LABEL_PREHAB = /hip|foot|ankle|knee stability|prehab|shoulder health|cuff|activation/i;

const out = { file: FILE, tiers: {} };
for (const equipment of EQUIP){
  const T = { days:0, sections:0, items:0, coreSec:0, coreItems:0, thinCore:0, emptySec:0,
              emptyByType:{}, optSec:0, nonOptSec:0, nonOptByLabel:{}, secLabels:{},
              prehabHip:0, prehabLabel:0, prehabName:0, byName:{} };
  for (const seed of SEEDS){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed }));
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        T.days++;
        for (const s of (day.sections || [])){
          if(!s) continue;
          T.sections++;
          const L = clean(s.label);
          const n = (s.items||[]).length;
          T.secLabels[L] = (T.secLabels[L]||0)+1;
          if (s.core){ T.coreSec++; T.coreItems += n; if (n===1) T.thinCore++; }
          if (s.optional) T.optSec++; else { T.nonOptSec++; T.nonOptByLabel[L]=(T.nonOptByLabel[L]||0)+1; }
          if (n===0){ T.emptySec++; const k=(s.core?'core':s.hip?'hip':s.optional?'optional':'other')+':'+L; T.emptyByType[k]=(T.emptyByType[k]||0)+1; }
          if (s.hip) T.prehabHip += n;
          if (LABEL_PREHAB.test(L)) T.prehabLabel += n;
          for (const it of (s.items||[])){
            const nm = clean(it.name);
            T.items++; T.byName[nm]=(T.byName[nm]||0)+1;
            if (NAME_PREHAB.test(nm) || s.hip) T.prehabName++;
          }
        }
      }
  }
  out.tiers[equipment] = T;
}
console.log('FILE ' + FILE);
console.log('tier          days  sect  items  coreSec coreItems thin empty  optSec nonOpt  pHip pLabel pName');
let agg={coreSec:0,thin:0,empty:0,nonOpt:0,pHip:0,pLabel:0,pName:0,items:0,sections:0};
for (const e of EQUIP){ const T=out.tiers[e];
  console.log(e.padEnd(13)+String(T.days).padStart(5)+String(T.sections).padStart(6)+String(T.items).padStart(7)+
    String(T.coreSec).padStart(8)+String(T.coreItems).padStart(10)+String(T.thinCore).padStart(5)+
    String(T.emptySec).padStart(6)+String(T.optSec).padStart(8)+String(T.nonOptSec).padStart(7)+
    String(T.prehabHip).padStart(6)+String(T.prehabLabel).padStart(7)+String(T.prehabName).padStart(6));
  agg.coreSec+=T.coreSec; agg.thin+=T.thinCore; agg.empty+=T.emptySec; agg.nonOpt+=T.nonOptSec;
  agg.pHip+=T.prehabHip; agg.pLabel+=T.prehabLabel; agg.pName+=T.prehabName; agg.items+=T.items; agg.sections+=T.sections;
}
console.log('AGG ' + JSON.stringify(agg));
if (JSONOUT){ fs.writeFileSync(JSONOUT, JSON.stringify(out)); console.log('wrote ' + JSONOUT); }
