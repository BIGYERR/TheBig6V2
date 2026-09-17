// MEASURE — V193 slice 5. WHERE the four registered same-card duplicate classes live.
//
//   node tests/measure/v193_slice5_dupclasses.js <file.html>
//
// Same WIDE lattice as tests/measure/v193_samecard_wide.js (864 builds / 59,781 day-builds):
// 8 injury paths x 6 tiers x 2 lifting focuses x 3 experience levels x 3 seeds. Adds, for
// every duplicated movement, the SECTION PAIR it straddles and the tier/injury/role split,
// so a fix can be aimed at a seam instead of a name. Also re-prints coach's six-item bar and
// a prescription fingerprint (name+detail multiset per card) so a draw fix can be shown to
// have moved no dose.
const {load, fixtures, DAYS} = require(require('path').join(__dirname, '..', 'harness.js'));
const IA = load(process.argv[2] || 'index.html');
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

const EQUIP  = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const FOCUS  = ['support_prevention','hypertrophy'];
const EXPER  = ['beginner','intermediate','advanced'];
const SEEDS  = [1013, 3039, 76308];
const INJ = [
  {tag:'healthy',            injury:null},
  {tag:'shoulder/protect',   injury:{region:'shoulder',tier:'protect'}},
  {tag:'elbow/protect',      injury:{region:'elbow',   tier:'protect'}},
  {tag:'lowback/protect',    injury:{region:'lowback', tier:'protect'}},
  {tag:'knee/protect',       injury:{region:'knee',    tier:'protect'}},
  {tag:'hip/workaround',     injury:{region:'hip',     tier:'workaround'}},
  {tag:'ankle/workaround',   injury:{region:'ankle',   tier:'workaround'}},
  {tag:'lowback/workaround', injury:{region:'lowback', tier:'workaround'}},
];
const PREHAB_POOLS = ['Spanish squat hold (KB)','Wall sit','Terminal knee extension (band)','Single-leg wall sit',
  'Dumbbell lateral raise','Cable lateral raise','Dumbbell front raise','Dumbbell rear delt fly','Face pull',
  'Prone Y-T-W raises','Wall slides'];

let builds=0, days=0, coreSections=0, emptySections=0, thinCore=0, prehabItems=0, nonOptSections=0, sections=0;
const dup={}, mainDup={}, pairs={}, detail={};
const rxLines=[];
for (const inj of INJ) for (const equipment of EQUIP) for (const liftingFocus of FOCUS)
for (const experience of EXPER) for (const seed of SEEDS){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, {equipment, seed, liftingFocus, experience, injury: inj.injury});
  let prog; try { prog = IA.buildProgram(cfg); builds++; } catch(e){ console.log('THREW', inj.tag, equipment, liftingFocus, experience, seed, e.message); continue; }
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks)) for (const d of DAYS){
    const day = weeks[wk][d]; if (!day || day.rest) continue;
    const all = day.sections || [];
    all.forEach(s => {
      if (!s) return;
      sections++;
      const n = (s.items||[]).length;
      if (n === 0) emptySections++;
      if (s.core){ coreSections++; if (n === 1) thinCore++; }
      if (!s.optional) nonOptSections++;
      (s.items||[]).forEach(it => { if (it && it.name && PREHAB_POOLS.indexOf(clean(it.name)) >= 0) prehabItems++; });
      if (s.hip) (s.items||[]).forEach(() => prehabItems++);
    });
    const secs = all.filter(s => s && (s.items||[]).length);
    if (!secs.length) continue;
    days++;
    // prescription fingerprint: every name+detail on the card, sorted
    const fp=[];
    secs.forEach(s => (s.items||[]).forEach(it => { if(it&&it.name) fp.push(clean(it.name)+' @@ '+clean(it.detail)); }));
    rxLines.push(inj.tag+'|'+equipment+'|'+liftingFocus+'|'+experience+'|'+seed+'|W'+wk+'|'+d+'|'+fp.slice().sort().join(' ;; '));
    const where = {};
    secs.forEach(s => { const lbl = clean(s.label) || clean(s.coreHeader) || '(unlabelled)';
      (s.items||[]).forEach(it => { if (it && it.name){ const n = clean(it.name); (where[n] = where[n] || []).push(lbl); } }); });
    Object.keys(where).forEach(n => {
      if (where[n].length < 2) return;
      dup[n] = (dup[n]||0) + 1;
      const key = where[n].slice().sort().map(l=>l.replace(/^Main —.*/,'Main — *')).join(' ++ ');
      (pairs[n] = pairs[n] || {}); pairs[n][key] = (pairs[n][key]||0)+1;
      (detail[n] = detail[n] || {}); const dk = inj.tag+' / '+equipment+' / '+experience+' / '+d;
      detail[n][dk] = (detail[n][dk]||0)+1;
      if (where[n].some(l => /^Main —/.test(l))) mainDup[n] = (mainDup[n]||0) + 1;
    });
  }
}
const sum = o => Object.values(o).reduce((a,b)=>a+b,0);
console.log('FILE            ' + (process.argv[2]||'index.html'));
console.log('lattice         ' + builds + ' builds / ' + days + ' day-builds / ' + sections + ' sections');
console.log('ANY same-card duplicate      ' + sum(dup) + ' / ' + days);
Object.keys(dup).sort((a,b)=>dup[b]-dup[a]).forEach(n => {
  console.log('    ' + String(dup[n]).padStart(5) + '  ' + n);
  Object.keys(pairs[n]).sort((a,b)=>pairs[n][b]-pairs[n][a]).forEach(k => console.log('             ' + String(pairs[n][k]).padStart(5) + '  [' + k + ']'));
  Object.keys(detail[n]).sort((a,b)=>detail[n][b]-detail[n][a]).slice(0,8).forEach(k => console.log('             ' + String(detail[n][k]).padStart(5) + '  ' + k));
});
console.log('MAIN repeated elsewhere      ' + sum(mainDup) + ' / ' + days);
Object.keys(mainDup).sort((a,b)=>mainDup[b]-mainDup[a]).forEach(n => console.log('    ' + String(mainDup[n]).padStart(5) + '  ' + n));
console.log('B1 core sections             ' + coreSections);
console.log('B2 empty sections            ' + emptySections);
console.log('B3 prehab items              ' + prehabItems);
console.log('B4 non-optional sections     ' + nonOptSections);
console.log('B5 thin core (1 item)        ' + thinCore + ' / ' + coreSections);
if (process.env.IA_RX_OUT) require('fs').writeFileSync(process.env.IA_RX_OUT, rxLines.join('\n')+'\n');
