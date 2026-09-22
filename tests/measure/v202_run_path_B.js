// V202 measure part B — NSW test-goal run path.
// Q3: is there a Long-Interval (LI) session at all?  Q4: taper/ramp keyed to program length or event date?
// Read-only. Oracle for Q3 = doctrine/physicaltrainingguide2020.txt p15 (lines 279-303):
//   LI = 1-4 reps of 7-20 min continuous at 90-95% max pace, start 2 x 1 mile, 7-10 min ACTIVE recovery.
// Oracle for Q4 = date arithmetic on cfg.raceDate vs the program's Monday-anchored week grid.
const path = require('path');
const { load } = require(path.join(__dirname,'..','harness.js'));
const IA = load(path.join(__dirname,'..','..','index.html'));
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const ISO  = ['mon','tue','wed','thu','fri','sat','sun'];

// ── THE PINNED CFG (PRT TING) ───────────────────────────────────────────────
// Fields and defaults read from index.html:1988 (WD literal), 2790-2810 (pace-goal
// target inputs), 2824-2850 (mile-best anchor inputs), 2869-2877 (race date),
// 2455 (trainDays = ALL_DAYS_ORDER minus restDays), 6602 doGenerate(buildProgram(WD)).
function pinned(over){
  return Object.assign({
    primaryPath:'event', eventTargeted:true, raceDate:'2026-10-19',
    cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'},
      targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } },
    liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35',
    equipment:'home_full', unit:'lbs',
    restDays:['sun','wed'],                 // 5 training days
    days:DAYS.slice(),
    bench:185, squat:255, deadlift:315,
    name:'PRT TING', startDate:'2026-09-21', seed:24865
  }, over||{});
}

function runDays(prog){
  const out=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    ISO.forEach(d=>{
      const day=prog.weeks[w][d]; if(!day) return;
      let cs=day.cardio; if(!cs) return; if(!Array.isArray(cs)) cs=[cs];
      cs.forEach(c=>{ if(c && c.type==='run') out.push({w:+w,d,sub:c.subtype||'',detail:c.detail||'',dose:c.dose||null,legLoad:!!c.legLoad}); });
    });
  });
  return out;
}
// INDEPENDENT ORACLE: does this session meet the PTG Long-Interval definition?
// reps 1-4, each rep >= 7 min of continuous work, recovery 7-10 min.
// Applied to the shipped prescription STRING, never to the engine's own type label.
function isLongInterval(s){
  const t = (s.sub+' '+s.detail);
  // rep length in minutes, explicit
  let m = t.match(/(\d+)\s*x\s*(\d+)\s*min/i);
  if(m){ const reps=+m[1], mins=+m[2]; if(reps>=1&&reps<=4&&mins>=7) return true; }
  m = t.match(/(\d+)\s*min continuous/i);
  if(m && +m[1]>=7) return true;          // 1 rep >= 7 min continuous
  // distance reps of >= 1 mile / >= 1600m
  m = t.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(mile|mi|m)\b/i);
  if(m){ const reps=+m[1]; const v=+m[2]; const unit=m[3].toLowerCase();
    const miles = (unit==='m') ? v/1609.34 : v;
    if(reps>=1&&reps<=4&&miles>=1) return true; }
  return false;
}
// The same string, tested for the PTG's 7-10 min ACTIVE recovery clause.
function hasLIRecovery(s){ const m=(s.detail||'').match(/(\d+)\s*min easy/i); return !!(m && +m[1]>=7 && +m[1]<=10); }

function eventWeekOf(prog,cfg){
  // date arithmetic, independent of the engine's taper code
  const start = prog.startDate || cfg.startDate;
  const sd = new Date(start+'T00:00:00'); const rd = new Date(cfg.raceDate+'T00:00:00');
  const sMon = new Date(sd); sMon.setDate(sd.getDate() - ((sd.getDay()+6)%7));
  const rMon = new Date(rd); rMon.setDate(rd.getDate() - ((rd.getDay()+6)%7));
  return Math.round((rMon-sMon)/86400000/7) + 1;
}

const out=[];const P=s=>{out.push(s);console.log(s);};

// ── Q3b / Q4c : the pinned config, both anchor readings ─────────────────────
[['mileBest 8:15 (anchor = current best)',{}],
 ['target 8:15/mi  (anchor = goal pace)',{cardioGoals:{run:{id:'run_pace_goal',mileBestMins:'',mileBestSecs:'',targetDist:'1',targetMins:'8',targetSecs:'15',paceUnit:'mi'}}}],
 ['run_base, mileBest 8:15',{cardioGoals:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15'}}}]
].forEach(([label,ov])=>{
  const cfg=pinned(ov); const prog=IA.buildProgram(cfg);
  P('\n===== PINNED: '+label+' =====');
  P('totalWeeks='+prog.totalWeeks+'  startDate='+(prog.startDate||cfg.startDate)+'  raceDate='+cfg.raceDate+'  eventWeek(date arithmetic)='+eventWeekOf(prog,cfg));
  const rs=runDays(prog);
  P('run sessions: '+rs.length+'   LI-by-doctrine: '+rs.filter(isLongInterval).length+'/'+rs.length);
  rs.forEach(s=>P(`  W${s.w} ${s.d.toUpperCase()} [${s.sub}] legLoad=${s.legLoad} LI=${isLongInterval(s)} :: ${s.detail.replace(/\n/g,' | ').slice(0,180)}`));
  // Q3e siting: heavy-lower / hinge days vs run days
  P('  -- day roles / lower-lift collision surface (week 1 and event week) --');
  [1, eventWeekOf(prog,cfg), prog.totalWeeks].filter((v,i,a)=>a.indexOf(v)===i && v>=1 && v<=prog.totalWeeks).forEach(w=>{
    ISO.forEach(d=>{ const day=prog.weeks[w] && prog.weeks[w][d]; if(!day) return;
      const names=(day.sections||[]).flatMap(s=>(s.items||[]).map(i=>String(i.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'')));
      const heavy=names.filter(n=>/Deadlift|Squat|RDL|Good Morning|Hip Thrust|Lunge|Step-?Up|Clean|Snatch|Swing/i.test(n));
      let cs=day.cardio; if(cs&&!Array.isArray(cs))cs=[cs];
      P(`   W${w} ${d.toUpperCase()} role=${day.title||day.role||''} cardio=${(cs||[]).map(c=>c.subtype).join('+')||'-'} heavyLower=${heavy.join(', ')||'-'}`);
    });
  });
});

// ── Q3c / Q4d : the lattice ─────────────────────────────────────────────────
const SEEDS=[24865,1,7,101,4242,90210];
const REST=[['sun','wed','sat','thu'],['sun','wed','sat'],['sun','wed'],['sun'],[]]; // 3,4,5,6,7 train days
const ANCH=[['5','30'],['6','45'],['8','15'],['10','0'],['12','30'],['',''] ];
const WKOUT=[2,4,6,8,12,16,26];
const EXP=['beginner','intermediate','advanced'];
const GOALS=['run_pace_goal','run_base'];
let N=0,withLI=0,withLIrec=0,intN=0,chiN=0;
let evInside=0, evInsideTapered=0, evInsideRampAfter=0, evAtEnd=0, noTaper=0;
const byGoal={},byDays={},byExp={};
function bump(o,k,hit){ o[k]=o[k]||[0,0]; o[k][0]+=hit?1:0; o[k][1]++; }
GOALS.forEach(gid=>SEEDS.forEach(seed=>REST.forEach(rest=>ANCH.forEach(([mm,ss])=>WKOUT.forEach(wo=>EXP.forEach(exp=>{
  const race=new Date('2026-09-21T00:00:00'); race.setDate(race.getDate()+wo*7);
  const iso=race.toISOString().slice(0,10);
  const goal = gid==='run_pace_goal'
    ? {id:gid,mileBestMins:mm,mileBestSecs:ss,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}
    : {id:gid,mileBestMins:mm,mileBestSecs:ss,baseline:'2.5 miles'};
  const cfg=pinned({seed,restDays:rest,experience:exp,raceDate:iso,cardioGoals:{run:goal}});
  let prog; try{ prog=IA.buildProgram(cfg);}catch(e){ P('CRASH '+gid+' seed'+seed+' '+e.message); return; }
  const rs=runDays(prog); N++;
  const li=rs.some(isLongInterval); if(li)withLI++;
  if(rs.some(s=>isLongInterval(s)&&hasLIRecovery(s)))withLIrec++;
  intN+=rs.filter(s=>/Interval \(INT\)/.test(s.sub)).length;
  chiN+=rs.filter(s=>/Continuous High Intensity/.test(s.sub)).length;
  bump(byGoal,gid,li); bump(byDays,String(7-rest.length),li); bump(byExp,exp,li);
  // Q4d
  const ew=eventWeekOf(prog,cfg); const tw=prog.totalWeeks;
  const taperWeeks=[]; Object.keys(prog.weeks).forEach(w=>{ISO.forEach(d=>{const dy=prog.weeks[w][d];let cs=dy&&dy.cardio;if(cs&&!Array.isArray(cs))cs=[cs];(cs||[]).forEach(c=>{if(c&&/Taper/.test(c.subtype||''))taperWeeks.push(+w);});});});
  const tset=[...new Set(taperWeeks)].sort((a,b)=>a-b);
  if(!tset.length) noTaper++;
  if(ew>=1 && ew<tw){ evInside++;
    if(tset.includes(ew)) evInsideTapered++;
    // does volume keep climbing after the event week?
    const after=rs.filter(s=>s.w>ew); const before=rs.filter(s=>s.w===ew);
    if(after.length && before.length) evInsideRampAfter++;
  } else if(ew>=tw) evAtEnd++;
  if(N===1) P('\n(lattice sample) tw='+tw+' eventWeek='+ew+' taperWeeks='+JSON.stringify(tset));
})))))); 
P('\n===== Q3c LATTICE =====');
P('builds: '+N);
P('programs containing a doctrine-shaped Long Interval session: '+withLI+'/'+N);
P('  ... with the PTG 7-10 min active recovery:              '+withLIrec+'/'+N);
P('INT sessions emitted across the lattice: '+intN+'   CHI sessions: '+chiN);
P('segmented by goal:  '+JSON.stringify(byGoal));
P('segmented by train days: '+JSON.stringify(byDays));
P('segmented by experience: '+JSON.stringify(byExp));
P('\n===== Q4d LATTICE =====');
P('event date strictly INSIDE the program (eventWeek < totalWeeks): '+evInside+'/'+N);
P('  of those, taper lands on the event week:                       '+evInsideTapered+'/'+evInside);
P('  of those, run sessions still scheduled AFTER the event week:   '+evInsideRampAfter+'/'+evInside);
P('event at or past the final week: '+evAtEnd+'/'+N+'   programs with NO taper at all: '+noTaper+'/'+N);
P('\nPRINTED '+out.length+' LINES');

// ════════════════════════════════════════════════════════════════════════════
// PART 2 — refined instruments.
// Part 1's isLongInterval() keyed on STRUCTURE alone (1-4 reps x >=7 min) and so
// counted CHI, which is structurally LI-shaped. The PTG's LI is structure AND
// intensity AND recovery (p15, lines 286-303): 90-95% of maximal pace for the
// duration, 7-10 min ACTIVE recovery, opening dose "2 x 1 mile", total work
// building to 4-4.5 miles. Three separate predicates, each printed.
// ════════════════════════════════════════════════════════════════════════════
function liStructure(s){ return isLongInterval(s); }                                   // 1-4 reps, >=7 min each
function liDistanceReps(s){ const m=(s.sub+' '+s.detail).match(/(\d)\s*x\s*(\d(?:\.\d)?)\s*(?:mile|mi)\b/i); return !!(m && +m[2]>=1); }  // "2 x 1 mile" shape
function liIntensity(s){ return /90\s*[-–]\s*95%|maximal pace/i.test(s.detail||''); }  // the PTG's own intensity words
function liRecovery(s){ return hasLIRecovery(s); }                                     // 7-10 min recovery
function isCHI(s){ return /Continuous High Intensity/.test(s.sub); }
function isINT(s){ return /Interval \(INT\)/.test(s.sub); }

let L={n:0,struct:0,dist:0,inten:0,rec:0,all3:0,chi:0,int:0,sessN:0};
let Q={inside:0,insideTaper:0,weeksPastEvent:[],taperAtEnd:0,eventAfterEnd:0};
const segF={},segD={},segE={},segW={};
function sb(o,k,h){o[k]=o[k]||[0,0];o[k][0]+=h?1:0;o[k][1]++;}
SEEDS.forEach(seed=>REST.forEach(rest=>ANCH.forEach(([mm,ss])=>WKOUT.forEach(wo=>EXP.forEach(exp=>{
  const race=new Date('2026-09-21T00:00:00'); race.setDate(race.getDate()+wo*7);
  const iso=race.toISOString().slice(0,10);
  const cfg=pinned({seed,restDays:rest,experience:exp,raceDate:iso,
    cardioGoals:{run:{id:'run_pace_goal',mileBestMins:mm,mileBestSecs:ss,targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}}});
  let prog; try{prog=IA.buildProgram(cfg);}catch(e){P('CRASH '+e.message);return;}
  const rs=runDays(prog); L.n++; L.sessN+=rs.length;
  const hS=rs.some(liStructure), hD=rs.some(liDistanceReps), hI=rs.some(liIntensity), hR=rs.some(liRecovery);
  L.struct+=hS?1:0; L.dist+=hD?1:0; L.inten+=hI?1:0; L.rec+=hR?1:0;
  L.all3+=(hS&&hI&&hR)?1:0;
  L.chi+=rs.filter(isCHI).length; L.int+=rs.filter(isINT).length;
  sb(segD,String(7-rest.length),hS&&hI&&hR); sb(segE,exp,hS&&hI&&hR); sb(segW,String(wo),hS&&hI&&hR);
  const ew=eventWeekOf(prog,cfg), tw=prog.totalWeeks;
  const tset=[...new Set(rs.filter(s=>/Taper/.test(s.sub)).map(s=>s.w))].sort((a,b)=>a-b);
  if(tset.length) Q.taperAtEnd += (Math.max(...tset)===tw)?1:0;
  if(ew>tw) Q.eventAfterEnd++;
  else if(ew<tw){ Q.inside++; if(tset.includes(ew))Q.insideTaper++; Q.weeksPastEvent.push(tw-ew); }
}))))); 
P('\n===== PART 2 — LI, three predicates (run_pace_goal only) =====');
P('builds: '+L.n+'   run sessions: '+L.sessN);
P('programs with a session of LI STRUCTURE  (1-4 reps x >=7 min): '+L.struct+'/'+L.n+'   (all of them are CHI)');
P('programs with LI DISTANCE reps ("N x 1 mile" or longer):        '+L.dist+'/'+L.n);
P('programs quoting LI INTENSITY (90-95% / maximal pace):          '+L.inten+'/'+L.n);
P('programs with LI RECOVERY (7-10 min active):                    '+L.rec+'/'+L.n);
P('programs meeting structure AND intensity AND recovery:          '+L.all3+'/'+L.n);
P('total CHI sessions: '+L.chi+'   total INT sessions: '+L.int);
P('all3 by train days: '+JSON.stringify(segD));
P('all3 by experience: '+JSON.stringify(segE));
P('all3 by weeks-out : '+JSON.stringify(segW));
P('\n===== PART 2 — Q4 taper vs event date (run_pace_goal only) =====');
const wp=Q.weeksPastEvent;
P('event strictly inside the program: '+Q.inside+'/'+L.n);
P('  taper lands ON the event week:   '+Q.insideTaper+'/'+Q.inside);
P('  weeks of programming AFTER the event week: min='+Math.min(...wp)+' max='+Math.max(...wp)+' mean='+(wp.reduce((a,b)=>a+b,0)/wp.length).toFixed(2));
P('event falls AFTER the final week: '+Q.eventAfterEnd+'/'+L.n);
P('programs whose LAST taper week == final week: '+Q.taperAtEnd+'/'+L.n);
P('\nPRINTED '+out.length+' LINES');
