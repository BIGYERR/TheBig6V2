// v205_nrc_eve_built.js — PART 2 of the D129 NRC before-picture. READ-ONLY on index.html.
// Builds REAL programs for the four NRC goals on every 1- and 2-rest-day calendar,
// under (a) the shipped artifact and (b) a source-surgery copy in the scratchpad whose
// recBeforeLong predicate is `d===prevDay(longDay)`. index.html is never written.
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..','..');
const H=require(path.join(ROOT,'tests','harness.js'));
const ART=process.argv[2]||path.join(ROOT,'index.html');
const SCRATCH=process.argv[3];
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const say=(...a)=>console.log(...a);

const SHIP=fs.readFileSync(ART,'utf8');
const OLD="typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay)";
const NEW="typeOf[d]===T.rec && d===prevDay(longDay)";
const n=SHIP.split(OLD).length-1;
say('anchor count for the shipped predicate: '+n+'  (must be 1)');
if(n!==1) throw new Error('anchor not unique: '+n);
const FIXPATH=path.join(SCRATCH,'v205_eve_fixed.html');
if(fs.existsSync(FIXPATH)) fs.unlinkSync(FIXPATH);      // delete before regenerating
fs.writeFileSync(FIXPATH, SHIP.replace(OLD,NEW));
say('surgery copy: '+FIXPATH);

const A=H.load(ART), B=H.load(FIXPATH);

function cfg(goal,rest){
  return { name:'M', primaryPath:'event', cardioTypes:['run'],
    cardioGoals:{ run:{ id:goal, label:goal, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } },
    eventTargeted:true, raceDate:'2026-12-06',
    liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
    equipment:'crossfit', unit:'lbs', restDays:rest.slice(), days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed:76308 };
}
function runRow(prog, wk){
  const w=prog.weeks&&prog.weeks[String(wk)]; if(!w) return 'NOWEEK';
  return DAYS.map(d=>{ const day=w[d]; if(!day||day.rest) return null;
    const c=day.cardio; if(!c) return null; const arr=Array.isArray(c)?c:[c];
    const r=arr.find(x=>x.type==='run'); if(!r) return null;
    return d+':'+String(r.subtype||r.type); }).filter(Boolean).join(' | ');
}
const GOALS=['run_5k','run_10k','run_half','run_marathon'];
const cals=[]; DAYS.forEach(d=>cals.push([d]));
for(let i=0;i<7;i++) for(let j=i+1;j<7;j++) cals.push([DAYS[i],DAYS[j]]);
say('\nrest calendars: '+cals.length+' (7 one-rest-day + 21 two-rest-day)  x 4 goals = '+(cals.length*4)+' builds per artifact');

// baseline equals itself
let self=0; GOALS.forEach(g=>cals.forEach(r=>{ const c=cfg(g,r);
  if(runRow(A.buildProgram(c),1)===runRow(A.buildProgram(c),1)) self++; }));
say('baseline==itself on week 1 run rows: '+self+' / '+(cals.length*4));

let tot=0, movers=0; const names=[];
GOALS.forEach(g=>cals.forEach(r=>{
  tot++;
  const a=runRow(A.buildProgram(cfg(g,r)),1), b=runRow(B.buildProgram(cfg(g,r)),1);
  if(a!==b){ movers++; names.push({g,r:r.join('+'),a,b}); }
}));
say('\n════ PART 2 — built week-1 run day set + subtypes, ship vs corrected predicate');
say('  builds compared: '+tot);
say('  builds whose week-1 run row differs: '+movers+' / '+tot);
const seg={}; names.forEach(x=>seg[x.g]=(seg[x.g]||0)+1);
say('  segmented by goal: '+JSON.stringify(seg));
names.forEach(x=>{ say('   MOVER '+x.g+'  rest='+x.r); say('     ship: '+x.a); say('     fix : '+x.b); });
if(!movers) say('   (no movers to name)');

// ── ADDENDUM: how many movers move the LONG RUN day itself ──────────────────
const longOf=row=>{ const m=String(row).split(' | ').find(x=>/Long Run/.test(x)); return m?m.split(':')[0]:'-'; };
let longMoved=0; const lm=[];
names.forEach(x=>{ if(longOf(x.a)!==longOf(x.b)){ longMoved++; lm.push(x.g+' rest='+x.r+'  long '+longOf(x.a)+' -> '+longOf(x.b)); } });
say('\n  of the '+movers+' movers, builds where the LONG RUN day itself moves: '+longMoved);
lm.forEach(x=>say('   LONGMOVE '+x));
