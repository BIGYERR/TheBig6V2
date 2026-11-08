// MEASURE (Post-v0.255.2, 2026-11-07): the leg day against the peak long run on race programs.
// Question: on NRC race programs, where does the squat-and-armor leg day land against the week's long run,
// how many sets does it carry in the peak long-run week against week 1, and does the lifting volume move
// with the running volume before the taper? Reported after Mario's week 11 peak long run (20K) was cut
// short at 5.5 miles two days after the 25-set Thursday leg day. Run: node tests/measure/leg-day-volume_peak-week.js
// [index.html]. Prints a per-program table to tests/measure/leg-day-volume_peak-week.csv and a summary.
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const IA = H.load(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const BASE = IA.fixtures.HALF_MANNY;
const GOALS = {
  run_5k:       { id:'run_5k', label:'5K', mileBestMins:'8', mileBestSecs:'00', baselineDist:'3', baseline:'3mi' },
  run_10k:      { id:'run_10k', label:'10K', mileBestMins:'8', mileBestSecs:'30', baselineDist:'4', baseline:'4mi' },
  run_half:     BASE.cardioGoals.run,
  run_marathon: { id:'run_marathon', label:'Marathon', mileBestMins:'9', mileBestSecs:'00', baselineDist:'8', baseline:'8mi' },
};
const REST = [['sun','wed'],['sun','mon'],['sun','thu'],['mon','fri'],['sun'],['sun','tue','thu']];
const FOCI = ['support_prevention','support_strength','support_athletic','hypertrophy'];
const EXPER = ['beginner','intermediate','advanced'];
const EQUIP = ['crossfit','commercial','bodyweight'];
const SEEDS = [1013, 76308];
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const nSets = det => { let m=/^(\d+)\s*[x×]/.exec(det||''); if(m) return +m[1]; m=/\b(\d+)\s*sets?\b/i.exec(det||''); return m?+m[1]:1; };
const LEG = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|soleus|glute|nordic|jump|bound|skater|wall ball|sled|pistol|carry/i;
const daySets = d => { let t=0, l=0; for (const s of (d.sections||[])) { const r=(s.superset&&s.rounds)?s.rounds:null; for (const it of (s.items||[])) { const n = r||nSets(it.detail); t+=n; if (LEG.test(it.name||'')) l+=n; } } return {t,l}; };
const longMins = c => { if(!c||!c.dose) return 0; const d=c.dose; return d.k==='time' ? (+d.mins||0) : (+d.mi||0)*(+d.tgt||0)/60; };
const dist = (a,b) => { const r=Math.abs(ORDER.indexOf(a)-ORDER.indexOf(b)); return Math.min(r,7-r); };
const rows = [];
for (const g of Object.keys(GOALS)) for (const rest of REST) for (const liftingFocus of FOCI) for (const experience of EXPER) for (const equipment of EQUIP) for (const seed of SEEDS) {
  const cfg = { ...BASE, cardioGoals:{ run: GOALS[g] }, restDays: rest, liftingFocus, experience, equipment, seed, name: g };
  let prog; try { prog = IA.buildProgram(cfg); } catch (e) { rows.push({ g, rest: rest.join('+'), liftingFocus, experience, equipment, seed, error: String(e).slice(0,80) }); continue; }
  const wks = Object.keys(prog.weeks).sort((a,b)=>+a-+b);
  let peak = null;
  const perWeek = wks.map(wk => {
    const w = prog.weeks[wk]; let legsDay=null, longDay=null, longM=0, legs={t:0,l:0}, total=0, eveRunMins=0;
    for (const dk of ORDER) { const d=w[dk]; if(!d||d.rest) continue; const c=[].concat(d.cardio||[])[0];
      const s=daySets(d); total+=s.t;
      if (/^Leg Strength|^Legs$/.test(d.title||'')) { legsDay=dk; legs=s; }
      if (c && /^long run/i.test(c.subtype||'')) { longDay=dk; longM=longMins(c); } }
    if (longDay) { const eve = ORDER[(ORDER.indexOf(longDay)+6)%7]; const e=w[eve]; const c=e&&[].concat(e.cardio||[])[0]; eveRunMins = c ? Math.round(longMins(c)) : 0; }
    const gap = (legsDay&&longDay) ? ((ORDER.indexOf(longDay)-ORDER.indexOf(legsDay)+7)%7) : null;   // days from legs to the long run, forward
    return { wk:+wk, legsDay, longDay, longM, gap, legsSets:legs.t, legsLegSets:legs.l, total, eveRunMins, taper: (prog.taperWeeks||[]).includes(+wk), recov: (prog.liftRecoveryWeeks||[]).includes(+wk) };
  });
  const build = perWeek.filter(x=>!x.taper);
  peak = build.reduce((a,x)=> (!a||x.longM>a.longM)?x:a, null);
  const w1 = perWeek[0];
  const nonDeload = build.filter(x=>!x.recov);
  const med = arr => { const s=[...arr].sort((a,b)=>a-b); return s.length? s[Math.floor(s.length/2)] : 0; };
  rows.push({ g, rest: rest.join('+'), liftingFocus, experience, equipment, seed, weeks: wks.length,
    legsDay: w1.legsDay, longDay: w1.longDay, gap: w1.gap, peakWk: peak&&peak.wk, peakLongMin: peak&&Math.round(peak.longM), peakTier: peak ? (peak.longM>=75?'A':peak.longM>=45?'B':'C') : '',
    peakGap: peak&&peak.gap, peakEveRunMins: peak&&peak.eveRunMins, peakLegsSets: peak&&peak.legsSets, peakLegsLegSets: peak&&peak.legsLegSets, w1LegsSets: w1.legsSets,
    peakTotal: peak&&peak.total, w1Total: w1.total, medTotalNonDeload: med(nonDeload.map(x=>x.total)), maxTotal: Math.max(...build.map(x=>x.total)),
    legsSetsMedNonDeload: med(nonDeload.map(x=>x.legsSets)), tapers: (prog.taperWeeks||[]).join('+'), recovs: (prog.liftRecoveryWeeks||[]).join('+') });
}
const cols = Object.keys(rows.find(r=>!r.error));
fs.writeFileSync(path.join(__dirname, 'leg-day-volume_peak-week.csv'), [cols.join(',')].concat(rows.map(r=>cols.map(c=>r[c]===undefined||r[c]===null?'':r[c]).join(','))).join('\n'));
const ok = rows.filter(r=>!r.error), err = rows.filter(r=>r.error);
const pct = (n,d) => `${n}/${d} (${d?Math.round(100*n/d):0}%)`;
console.log(`built ${ok.length} race programs, ${err.length} errors`);
const withLegs = ok.filter(r=>r.peakGap!=null);
console.log(`programs with a legs day and a long run: ${pct(withLegs.length, ok.length)}`);
const byGap = {}; withLegs.forEach(r=>{ byGap[r.peakGap]=(byGap[r.peakGap]||0)+1; }); console.log('legs day → long run gap in the PEAK week (days):', JSON.stringify(byGap));
const tierA = withLegs.filter(r=>r.peakTier==='A');
console.log(`peak long run is tier A (≥75 min at the prescribed pace): ${pct(tierA.length, withLegs.length)}`);
console.log(`  of those, legs day exactly 2 days before it: ${pct(tierA.filter(r=>r.peakGap===2).length, tierA.length)}; 3 days: ${pct(tierA.filter(r=>r.peakGap===3).length, tierA.length)}; 4+: ${pct(tierA.filter(r=>r.peakGap>=4).length, tierA.length)}`);
console.log(`  legs day 2 days before AND a recovery run ≥30 min on the eve: ${pct(tierA.filter(r=>r.peakGap===2&&r.peakEveRunMins>=30).length, tierA.length)}`);
const flat = withLegs.filter(r=>r.peakLegsSets>=r.legsSetsMedNonDeload);
console.log(`peak-week leg day carries at least the median non-deload leg-day set count: ${pct(flat.length, withLegs.length)}`);
const peakIsMax = withLegs.filter(r=>r.peakTotal>=r.medTotalNonDeload);
console.log(`peak-week total lift sets ≥ median non-deload week: ${pct(peakIsMax.length, withLegs.length)}`);
const peakRecov = withLegs.filter(r=>{ return r.recovs.split('+').map(Number).includes(r.peakWk); });
console.log(`peak long-run week is a lift recovery (deload) week: ${pct(peakRecov.length, withLegs.length)}`);
for (const g of Object.keys(GOALS)) { const rs=withLegs.filter(r=>r.g===g); if(!rs.length) continue; const a=rs.filter(r=>r.peakTier==='A'); console.log(`  ${g}: n=${rs.length} peakWk=${[...new Set(rs.map(r=>r.peakWk))].join('/')} peakLong=${[...new Set(rs.map(r=>r.peakLongMin))].join('/')}min tierA=${pct(a.length,rs.length)} gap2=${pct(rs.filter(r=>r.peakGap===2).length,rs.length)} legsSets peak med=${med2(rs.map(r=>r.peakLegsSets))} w1 med=${med2(rs.map(r=>r.w1LegsSets))}`); }
function med2(arr){ const s=[...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; }
const byFocus = {}; withLegs.forEach(r=>{ (byFocus[r.liftingFocus]=byFocus[r.liftingFocus]||[]).push(r.peakLegsSets); }); console.log('peak-week leg-day sets, median by focus:', JSON.stringify(Object.fromEntries(Object.entries(byFocus).map(([k,v])=>[k,med2(v)]))));
const byExp = {}; withLegs.forEach(r=>{ (byExp[r.experience]=byExp[r.experience]||[]).push(r.peakLegsSets); }); console.log('peak-week leg-day sets, median by experience:', JSON.stringify(Object.fromEntries(Object.entries(byExp).map(([k,v])=>[k,med2(v)]))));
if (err.length) console.log('errors:', err.slice(0,3));
