// measure v224 — before-picture: the full shape of HALF_MANNY at ia-version 224, plus
// one training week printed field by field for a design mockup. Read-only, no oracle claim:
// this is a transcription pass. Superset round counts come from the app's own resolver
// (_secRounds, index.html:12154, the same call buildSectionsHTML:12222 makes) and the log
// dose kind from doseFromCardio + cardioFieldHTML's branch ladder (index.html:13618).
const path = require('path');
const H = require(path.resolve(__dirname,'../harness.js'));
const IA = H.load(path.resolve(__dirname,'../../index.html'));
const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));
const prog = IA.buildProgram(cfg);

const WD = {sun:'Sunday',mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday'};
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const strip = s => String(s==null?'':s).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/\s+/g,' ').trim();
const secRounds = sec => IA.eval('_secRounds')(sec);
const dose = c => IA.eval('doseFromCardio')(c);

// cardioFieldHTML branch ladder, transcribed from index.html:13618-13655.
function doseKind(c){
  if(!c) return 'none (no cardio field)';
  const sport=(c.type||'').toLowerCase();
  if(sport!=='run'&&sport!=='bike'&&sport!=='swim') return 'none ('+sport+')';
  const d=dose(c);
  if(sport==='run'&&d&&['time','dist','reps_dist','reps_time'].includes(d.k)) return d.k;
  if(sport==='run') return 'generic (dist+pace wheels)';
  return sport==='bike'?'bike mins':'swim yards';
}

const weeks = prog.weeks||{};
const wkNums = Object.keys(weeks).sort((a,b)=>+a-+b);
console.log('=== PROGRAM HEADER ===');
console.log('ia-version under test: '+IA.version);
console.log('cfg.seed: '+cfg.seed+'   raceDate: '+cfg.raceDate+'   goal: '+cfg.cardioGoals.run.id);
console.log('prog top-level keys: '+Object.keys(prog).join(', '));
['length','weeksCount','startDate','raceWeek','goal','phase','phases','meta'].forEach(k=>{
  if(prog[k]!==undefined) console.log('prog.'+k+' = '+JSON.stringify(prog[k]).slice(0,400));
});
console.log('total weeks: '+wkNums.length+'  (keys '+wkNums.join(',')+')');
wkNums.forEach(w=>{
  const extra=Object.keys(weeks[w]).filter(k=>!ORDER.includes(k));
  if(extra.length) console.log('  week '+w+' non-day keys: '+JSON.stringify(extra.map(k=>[k,weeks[w][k]])));
});

console.log('\n=== PART 1: GRID (one line per day, rest days included) ===');
const flags={deload:[],taper:[],race:[]};
let dayN=0, restN=0, liftN=0, cardioN=0;
wkNums.forEach(w=>{
  ORDER.forEach(d=>{
    const day=weeks[w][d]; if(!day) return;
    dayN++;
    const c=day.cardio, cA=Array.isArray(c)?c:(c?[c]:[]);
    const cs=cA.map(x=>(x.type||'')+'/'+(x.subtype||'')).join(' + ');
    const tags=(day.tags||[]).join(',');
    const secs=(day.sections||[]).map(s=>(s.label||s.coreHeader||'?')+'['+(s.items||[]).length+']').join(' | ');
    if(day.rest) restN++;
    if((day.sections||[]).length) liftN++;
    if(cA.length) cardioN++;
    const blob=(tags+' '+(day.title||'')+' '+(day.note||'')+' '+cs).toLowerCase();
    if(/deload/.test(blob)) flags.deload.push('W'+w+' '+d);
    if(/taper/.test(blob)) flags.taper.push('W'+w+' '+d);
    if(cA.some(x=>/race/i.test(x.subtype||''))) flags.race.push('W'+w+' '+d);
    console.log(('W'+w).padEnd(4)+d.toUpperCase()+'  '+(day.rest?'[REST] ':'')+(day.title||'(no title)')
      +(cs?'  {'+cs+'}':'')+(tags?'  <'+tags+'>':'')+(secs?'  :: '+secs:''));
  });
});
console.log('\ndays printed: '+dayN+'  rest days: '+restN+'/'+dayN+'  days with >=1 section: '+liftN+'/'+dayN+'  days with cardio: '+cardioN+'/'+dayN);
console.log('deload-marked days: '+(flags.deload.join(', ')||'none'));
console.log('taper-marked days: '+(flags.taper.join(', ')||'none'));
console.log('race-subtype days: '+(flags.race.join(', ')||'none'));

// Week-level deload/taper: any day in the week carrying the marker.
const wkClass={};
wkNums.forEach(w=>{
  const ds=ORDER.map(d=>weeks[w][d]).filter(Boolean);
  const blob=JSON.stringify(ds).toLowerCase();
  wkClass[w]=[/deload/.test(blob)?'deload':null,/taper/.test(blob)?'taper':null,
              ds.some(x=>[].concat(x.cardio||[]).some(y=>/race/i.test(y.subtype||'')))?'RACE':null].filter(Boolean).join('+')||'normal';
});
console.log('\nweek classification (marker anywhere in the week JSON): ');
wkNums.forEach(w=>console.log('  W'+w+': '+wkClass[w]));

// Candidate detail weeks: normal, holds a long-run day and a non-long-run lift day.
const isLong = day => [].concat(day.cardio||[]).some(c=>/long/i.test(c.subtype||''));
const cands = wkNums.filter(w=>{
  if(wkClass[w]!=='normal') return false;
  const ds=ORDER.map(d=>weeks[w][d]).filter(Boolean);
  return ds.some(isLong) && ds.some(d=>!d.rest && !isLong(d) && (d.sections||[]).some(s=>/main/i.test(s.label||'')));
});
console.log('\ncandidate detail weeks (normal + long-run day + a main-lift day that is not the long run): '+cands.join(',')+'  ('+cands.length+'/'+wkNums.length+' weeks qualify)');
const W = process.env.IA_WEEK || cands[Math.floor(cands.length/2)];
console.log('\n=== PART 2: WEEK '+W+' IN FULL ===');
const dsel=ORDER.map(d=>[d,weeks[W][d]]).filter(x=>x[1]);
let lift=0,ss=0,secTot=0;
dsel.forEach(([d,day])=>{
  console.log('\n---------------------------------------------');
  console.log('DAY '+d+'  ('+WD[d]+')   week '+W);
  console.log('  day.rest  : '+!!day.rest);
  console.log('  day.title : '+JSON.stringify(day.title));
  console.log('  day.tags  : '+JSON.stringify(day.tags||null));
  if(day.date!==undefined) console.log('  day.date  : '+JSON.stringify(day.date));
  const secs=day.sections||[];
  console.log('  sections  : '+secs.length);
  if(secs.length) lift++;
  secs.forEach((s,si)=>{
    secTot++;
    const isSS=!!(s.superset||s.type==='superset');
    const fl=[isSS?'superset':null,s.core?'core':null,s.hip?'hip':null,s._added?'_added':null].filter(Boolean).join(' ')||'(none)';
    let r='';
    if(isSS){ ss++; const n=secRounds(s); r='  rounds='+(n==null?'null (no honest round count)':n); }
    console.log('    ['+si+'] label: '+JSON.stringify(s.label)+(s.coreHeader?'  coreHeader: '+JSON.stringify(s.coreHeader):'')
      +'  flags: '+fl+r+'  items: '+(s.items||[]).length);
    (s.items||[]).forEach((it,ii)=>{
      console.log('        '+(ii+1)+'. '+strip(it.name)+'  ||  '+(it.detail==null?'(no detail)':it.detail));
      const ex=Object.keys(it).filter(k=>!['name','detail'].includes(k));
      if(ex.length) console.log('           (other item fields: '+ex.map(k=>k+'='+JSON.stringify(it[k])).join(' ')+')');
    });
  });
  const cA=Array.isArray(day.cardio)?day.cardio:(day.cardio?[day.cardio]:[]);
  if(!cA.length) console.log('  day.cardio: null');
  cA.forEach((c,ci)=>{
    console.log('  day.cardio['+ci+']:');
    Object.keys(c).forEach(k=>console.log('      '+k+' = '+(typeof c[k]==='object'?JSON.stringify(c[k]):JSON.stringify(c[k]))));
    console.log('      -> doseFromCardio: '+JSON.stringify(dose(c)));
    console.log('      -> cardioFieldHTML dose kind: '+doseKind(c));
  });
  if(day.note) console.log('  day.note  : '+JSON.stringify(day.note));
  Object.keys(day).filter(k=>!['rest','title','tags','sections','cardio','note','date'].includes(k))
    .forEach(k=>console.log('  day.'+k+' = '+JSON.stringify(day[k]).slice(0,300)));
});
console.log('\nWEEK '+W+' COUNTS: days='+dsel.length+'  rest='+dsel.filter(x=>x[1].rest).length+'/'+dsel.length
  +'  days with a lift block='+lift+'/'+dsel.length+'  sections='+secTot+'  superset sections='+ss+'/'+secTot
  +'  days with cardio='+dsel.filter(x=>[].concat(x[1].cardio||[]).length).length+'/'+dsel.length);
console.log('\ndigest(prog) = '+H.progDigest(prog)+'   pinned MANNY_DIGEST_BY_VERSION['+IA.version+'] = '+H.MANNY_DIGEST_BY_VERSION[IA.version]);

// ── addendum: program-level phase fields + the dose kind of every run day ──
console.log('\n=== ADDENDUM: PHASE FIELDS ===');
['totalWeeks','raceDateWeeks','taperWeeks','liftRecoveryWeeks','legRecoveryNote'].forEach(k=>
  console.log('prog.'+k+' = '+JSON.stringify(prog[k])));
const d0=new Date(cfg.raceDate+'T12:00:00Z');
console.log('raceDate '+cfg.raceDate+' is a '+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d0.getUTCDay()]+' (date arithmetic, independent of the engine)');
console.log('\n=== ADDENDUM: DOSE KIND, EVERY RUN DAY (all weeks) ===');
const tally={};
wkNums.forEach(w=>ORDER.forEach(d=>{
  const day=weeks[w][d]; if(!day) return;
  [].concat(day.cardio||[]).forEach(c=>{
    const k=doseKind(c); tally[k]=(tally[k]||0)+1;
    console.log(('W'+w).padEnd(4)+d.toUpperCase()+'  '+(c.subtype||c.type)+'  -> '+k+'  dose='+JSON.stringify(dose(c)));
  });
}));
console.log('\ndose-kind tally over '+Object.values(tally).reduce((a,b)=>a+b,0)+' cardio sessions: '+JSON.stringify(tally));
