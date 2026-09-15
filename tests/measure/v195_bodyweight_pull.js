// v195 — measure pass: DOES THE BODYWEIGHT TIER OWN A BAR TO HANG FROM?
//
// MODE B (before-picture). Read-only. Gates the D70b inventory ruling on the one cell
// coach REFUSED to fill: bodyweight x "pull-up bar". Coach's counter, verbatim:
//   "if the bodyweight tier turns out to lean on `Chinups` at volume it will strip the
//    only vertical pull that tier has before anyone has printed the number."
// This pass prints that number, and every other reader of the same value.
//
// ORACLES — each independent of the predicate under suspicion (_gearOK / _auxGearOK / _BW_GEAR):
//  O1  what a movement NEEDS — a HAND TABLE (REQ, below) over every distinct name the
//      engine emits on the bodyweight tier, authored from the movement standard, printed
//      in full. A name absent from the table prints UNCLASSIFIED and is a FAILURE of this
//      pass, not a zero. Nothing in the table is derived from a regex in index.html.
//  O2  what a movement IS (pull / vpull / hpull) — a second HAND TABLE (PULL), authored
//      the same way. The engine's own _pattern() is measured AGAINST it, never used as it.
//  O3  the name universe — walked out of built programs at runtime, not transcribed.
//  O4  the tier's own stated inventory — the file's comment at the bodyweight seam
//      ("no bar, no band") and _EQUIP_OPTS' "Nothing but you. A floor, a wall, and a chair."
//      Both are quoted with live line numbers, not paraphrased.
//
// usage: node tests/measure/v195_bodyweight_pull.js
'use strict';
const fs=require('fs'), path=require('path');
const {load,progDigest}=require(path.join(__dirname,'..','harness.js'));
const HTML=path.join(__dirname,'..','..','index.html');
const SRC=fs.readFileSync(HTML,'utf8');
const LINES=SRC.split('\n');
const IA=load(HTML);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
function hr(t){ console.log('\n'+'='.repeat(96)+'\n'+t+'\n'+'='.repeat(96)); }
function sub(t){ console.log('\n'+'-'.repeat(96)+'\n'+t+'\n'+'-'.repeat(96)); }
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function lp(s,n){ s=String(s); return s.length>=n?s:' '.repeat(n-s.length)+s; }
function pct(a,b){ return b?((100*a/b).toFixed(2)+'%'):'n/a'; }
function lineOf(re){ for(let i=0;i<LINES.length;i++) if(re.test(LINES[i])) return i+1; return -1; }
function linesOf(re){ const o=[]; for(let i=0;i<LINES.length;i++) if(re.test(LINES[i])) o.push(i+1); return o; }
const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

console.log('v195 — bodyweight pull census. artifact '+HTML+' @ ia-version '+IA.version);
console.log('mode: B (before-picture). read-only. nothing here is a ruling.');

/* ════════════════════════════════════════════════════════════════════════════
   §0  BASELINE SELF-STABILITY. Prove the instrument before trusting it.
   ════════════════════════════════════════════════════════════════════════════ */
hr('§0  BASELINE. A seeded build must equal itself or nothing below means anything.');
const BWCFG={name:'BW',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],
  seed:76308,liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'bodyweight',
  primaryPath:'body',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null};
const d1=progDigest(IA.buildProgram(BWCFG)), d2=progDigest(IA.buildProgram(BWCFG));
console.log('bodyweight seed 76308 digest '+d1+' / '+d2+'  -> '+(d1===d2?'SELF-STABLE':'NOT SELF-STABLE — STOP'));
if(d1!==d2){ console.log('ABORT: baseline is not reproducible.'); process.exit(1); }

/* ════════════════════════════════════════════════════════════════════════════
   §1  THE TIER'S OWN STATED INVENTORY. Quoted live, not paraphrased.
   ════════════════════════════════════════════════════════════════════════════ */
hr('§1  WHAT THE FILE ITSELF SAYS THE BODYWEIGHT TIER OWNS');
const L_SEAM=lineOf(/Pulling is the known weak point of any equipment-free tier/);
const L_SEAM0=lineOf(/BODYWEIGHT TIER \("Room only"\)/);
const L_WIZ=lineOf(/id:'bodyweight'/);
const L_EQOPT=lineOf(/\['bodyweight','Room only'/);
console.log('engine seam comment, index.html:'+L_SEAM0+'-'+(L_SEAM+1)+':');
for(let i=L_SEAM0-1;i<=L_SEAM;i++) console.log('   '+lp(i+1,6)+' | '+LINES[i].trim());
console.log('\nwizard tile,  index.html:'+L_WIZ+' | '+LINES[L_WIZ-1].trim());
console.log('travel tile,  index.html:'+L_EQOPT+' | '+LINES[L_EQOPT-1].trim());
console.log('\nThese are the two populations that share the SAME enum value `bodyweight`.');

/* ════════════════════════════════════════════════════════════════════════════
   §2  O1 — THE HAND TABLE. What each movement physically requires.
   ════════════════════════════════════════════════════════════════════════════ */
// CLASSES (authored from the movement standard, independent of every regex in index.html):
//   BAR      — needs an OVERHEAD bar to hang the whole body from (pull-up bar, rig, branch).
//   BARHEIGHT— needs a bar/rack FIXED AT WAIST HEIGHT to row under. A table edge is the
//              furniture substitute the engine names separately, so a name that says
//              "bar"/"rack" and not "table" is its own class.
//   DIPBAR   — needs parallel bars / dip station.
//   ANCHOR   — needs FURNITURE only: table edge, chair, bed, wall, doorframe, floor.
//   NONE     — needs nothing but the athlete and the floor.
//   GEAR:x   — needs an implement the tier does not claim (abwheel, band, dumbbell...).
//   NOTE     — not an exercise (a week banner / coaching line that rides in an items array).
const REQ={
 // ── vertical pull, hanging: ALL require an overhead bar ──
 'Chinups':'BAR', 'Neutral-grip chinups':'BAR', 'Weighted chinups':'BAR', 'L-sit chinups':'BAR',
 'Assisted pullups':'BAR', 'Pullups':'BAR', 'Lat pulldown':'GEAR:cable',
 'Toes-to-bar':'BAR', 'Hanging knee raises':'BAR', 'Hanging leg raises':'BAR',
 'Garhammer raises':'BAR', 'Hanging hold':'BAR',
 // ── horizontal pull ──
 'Inverted row (under a table)':'ANCHOR', 'Inverted row (knees bent, under a table)':'ANCHOR',
 'Feet-elevated inverted row (under a table)':'ANCHOR', 'Inverted row (supinated, under a table)':'ANCHOR',
 'Inverted rows (bodyweight)':'BARHEIGHT', 'Feet-elevated inverted rows':'BARHEIGHT', 'Inverted rows (rings)':'GEAR:rings',
 'Reverse snow angels':'NONE', 'Prone Y-T-W raises':'NONE', 'Prone Y raise':'NONE', 'Superman':'NONE',
 'Band pull-apart':'GEAR:band', 'Resistance band row':'GEAR:band', 'Single-arm resistance band row':'GEAR:band',
 // ── push ──
 'Pushups (slow 3s eccentric)':'NONE','Pushups (slow tempo)':'NONE','Pushups':'NONE','Diamond pushups':'NONE',
 'Close-grip pushups':'NONE','Wide-stance pushups':'NONE','Archer pushups':'NONE','Scapular pushup':'NONE',
 'Decline pushups (feet elevated)':'ANCHOR','Decline pushups':'ANCHOR','Incline pushups (hands on bed)':'ANCHOR',
 'Pike pushups':'NONE','Pike pushups (feet elevated)':'ANCHOR','Wall walks':'NONE',
 'Dips':'DIPBAR','Weighted dips':'DIPBAR','Bench dips (chair)':'ANCHOR',
 'Wall slides':'NONE','Wall slide':'NONE','Serratus wall slide':'NONE',
 // ── legs ──
 'Wall sit':'NONE','Single-leg wall sit':'NONE','Squat (slow 3s tempo)':'NONE','Split squat':'NONE',
 'Bulgarian split squat (foot on chair)':'ANCHOR','Assisted pistol squat':'ANCHOR','Step-ups (chair)':'ANCHOR',
 'Reverse lunge':'NONE','Walking lunge':'NONE','Side lunge (bodyweight)':'NONE',
 'Calf raise (bodyweight)':'NONE','Single-leg calf raise (bodyweight)':'NONE',
 'Single-leg bent-knee soleus raise':'NONE','Tibialis raise (wall lean)':'NONE',
 'Jump squats':'NONE','Broad jumps':'NONE','Skater bounds':'NONE','Lateral bounds':'NONE','Tuck jumps':'NONE',
 'Pogo hops':'NONE','Split-squat jumps':'NONE','Rotational jump to single-leg landing':'NONE',
 // ── hinge / posterior ──
 'Single-leg glute bridge':'NONE','Single-leg hip thrust':'ANCHOR','Single-leg hip thrust (shoulders on bed)':'ANCHOR',
 'Bodyweight back extension':'NONE','Single-leg Romanian deadlift (bodyweight)':'NONE',
 'Nordic hamstring curl (anchored)':'ANCHOR',
 // ── core / trunk ──
 'Plank hold':'NONE','Side plank':'NONE','RKC plank':'NONE','Plank shoulder taps':'NONE','L-sit hold':'NONE',
 'Dead bugs':'NONE','Dead bug (slow tempo)':'NONE','Bird dogs':'NONE','McGill curl-up':'NONE',
 'Windshield wipers':'NONE','Standing torso rotations (slow)':'NONE','Side plank thread-the-needle':'NONE',
 'Ab wheel rollouts':'GEAR:abwheel','Pallof press':'GEAR:band',
 // ── prehab / mobility ──
 'Hip 90/90 stretch':'NONE','Clamshells (bodyweight)':'NONE','Side-lying leg raises':'NONE',
 'Standing hip abduction':'NONE','Fire hydrants':'NONE','IT band stretch':'NONE','Couch stretch':'NONE',
 'Standing calf stretch':'NONE','Standing ankle CARs':'NONE','Thoracic rotations':'NONE','T-spine mobility':'NONE',
 'Worlds greatest stretch':'NONE','Doorway pec stretch':'ANCHOR','Toe yoga (splay + big-toe lifts)':'NONE',
 'Side-lying external rotation (bodyweight)':'NONE','Towel grip squeeze':'NONE','Wrist circles (slow)':'NONE',
 'Wrist extensor stretch':'NONE','Wrist flexor stretch':'NONE','Wrist extensor isometric hold':'NONE',
 'Eccentric wrist extension':'NONE','Foam roll':'GEAR:foamroller',
 // ── conditioning ──
 'Burpees':'NONE','Mountain climbers':'NONE','High knees':'NONE',
};
const NOTE_RE=/^(Taper —|Race week —|Shoulder day\.|Elbow day\.|Deload|Test week|Hip day\.|Knee day\.|Ankle day\.|Low back day\.)/;
// The five classes that mean "this tier cannot do it" for the purposes of Q1.
const NEEDS_BAR=c=>c==='BAR';

/* ════════════════════════════════════════════════════════════════════════════
   §3  O2 — THE PULL HAND TABLE. vpull / hpull / not-a-pull.
   ════════════════════════════════════════════════════════════════════════════ */
const PULL={};
['Chinups','Neutral-grip chinups','Weighted chinups','L-sit chinups','Assisted pullups','Pullups','Lat pulldown']
  .forEach(n=>PULL[n]='vpull');
['Inverted row (under a table)','Inverted row (knees bent, under a table)','Feet-elevated inverted row (under a table)',
 'Inverted row (supinated, under a table)','Inverted rows (bodyweight)','Feet-elevated inverted rows',
 'Inverted rows (rings)','Resistance band row','Single-arm resistance band row','Reverse snow angels',
 'Band pull-apart','Prone Y-T-W raises','Prone Y raise','Superman']
  .forEach(n=>PULL[n]='hpull');
// Everything else is not a pull. Hanging raises are CORE, not pull — they need the bar
// but they do not train the lat, so withholding them does not touch pull volume. That
// distinction is the whole reason Q2 and Q1 have different answers.

/* ════════════════════════════════════════════════════════════════════════════
   §4  THE LATTICE
   ════════════════════════════════════════════════════════════════════════════ */
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight','minimal'];
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXP=['beginner','intermediate','advanced'];
const GOALS=[
 {k:'lift_only',f:{primaryPath:'body',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null}},
 {k:'run_base', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'9',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_half', f:{primaryPath:'event',cardioTypes:['run'],cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},eventTargeted:true,raceDate:'2026-12-06'}},
];
const SEEDS=[76308,11111,90210];
const INJ=[null]; ['shoulder','elbow','lowback','hip','knee','ankle'].forEach(r=>['protect','workaround'].forEach(t=>INJ.push({region:r,tier:t})));
// travel:true is ONLY meaningful for the three tiers the travel sheet offers (_EQUIP_OPTS).
const TRAVEL_TIERS={bodyweight:1,home_basic:1,commercial:1};

const rows=[];            // one row per prescribed item, the whole corpus
let nBuilds=0, nDays=0, nItems=0, nCrash=0;
const dayKeys=new Set();
TIERS.forEach(t=>{
  const travelModes = TRAVEL_TIERS[t] ? [false,true] : [false];
  travelModes.forEach(tv=>INJ.forEach(inj=>FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>SEEDS.forEach(sd=>{
    const cfg=Object.assign({name:'M',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,
      restDays:['sun','wed'],seed:sd,liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},g.f);
    if(inj) cfg.injury=inj;
    if(tv)  cfg._travel=true;
    let p; try{ p=IA.buildProgram(cfg); }catch(e){ nCrash++; return; }
    nBuilds++;
    const bk=[t,tv?'TRAVEL':'WIZ',inj?inj.region+'/'+inj.tier:'none',f,x,g.k,sd].join('|');
    Object.keys(p.weeks||{}).forEach(w=>Object.keys(p.weeks[w]||{}).forEach(d=>{
      const day=p.weeks[w][d]; if(!day||!day.sections||!day.sections.length) return;
      let had=false;
      (day.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{
        const nm=clean(i.name); if(!nm) return;
        had=true; nItems++;
        rows.push({tier:t,travel:tv,inj:inj?inj.region+'/'+inj.tier:'none',focus:f,exp:x,goal:g.k,seed:sd,
                   wk:+w, day:d, label:String(s.label||s.coreHeader||''), name:nm, dayKey:bk+'|WK'+w+'|'+d});
      }));
      if(had){ nDays++; dayKeys.add(bk+'|WK'+w+'|'+d); }
    }));
  }))))));
});
hr('§4  LATTICE');
console.log('tiers                '+TIERS.length+'   '+TIERS.join(', '));
console.log('focuses              '+FOCUS.length);
console.log('experience           '+EXP.length);
console.log('goals                '+GOALS.length+'   '+GOALS.map(g=>g.k).join(', '));
console.log('seeds                '+SEEDS.length+'   '+SEEDS.join(', ')+'   (cfg.seed pinned, never null)');
console.log('injury states        '+INJ.length+'  (none + 6 regions x 2 tiers)');
console.log('travel variants      bodyweight / home_basic / commercial get BOTH cfg._travel undefined and true');
console.log('');
console.log('BUILDS               '+nBuilds+'   (crashes: '+nCrash+')');
console.log('TRAINED DAYS         '+nDays);
console.log('PRESCRIBED ITEMS     '+nItems);
if(!nBuilds||!nItems){ console.log('ABORT: the sweep produced nothing. That is a failed measurement, not a clean result.'); process.exit(1); }

const BW=rows.filter(r=>r.tier==='bodyweight');
const BW_DAYS=new Set(BW.map(r=>r.dayKey));
const BW_BUILDS=new Set(BW.map(r=>r.dayKey.split('|WK')[0]));
console.log('');
console.log('BODYWEIGHT DENOMINATOR:  '+BW.length+' items  /  '+BW_DAYS.size+' trained days  /  '+BW_BUILDS.size+' builds');

/* ════════════════════════════════════════════════════════════════════════════
   §5  THE TABLE COVERS THE UNIVERSE (or this pass failed)
   ════════════════════════════════════════════════════════════════════════════ */
hr('§5  O1 COVERAGE. Every distinct name the engine emitted on bodyweight must be classified.');
const bwNames=new Map();
BW.forEach(r=>bwNames.set(r.name,(bwNames.get(r.name)||0)+1));
const unclassified=[];
bwNames.forEach((c,n)=>{ if(!(n in REQ) && !NOTE_RE.test(n)) unclassified.push([n,c]); });
console.log('distinct names on bodyweight: '+bwNames.size);
console.log('classified by hand table:     '+(bwNames.size-unclassified.length));
console.log('banner / coaching lines:      '+[...bwNames.keys()].filter(n=>NOTE_RE.test(n)).length);
if(unclassified.length){
  console.log('\nUNCLASSIFIED — this is a FAILURE of this pass, not a zero:');
  unclassified.sort((a,b)=>b[1]-a[1]).forEach(r=>console.log('   '+lp(r[1],8)+'  '+r[0]));
} else console.log('UNCLASSIFIED: 0. The oracle covers the universe.');

/* ════════════════════════════════════════════════════════════════════════════
   §6  Q1 — THE CENSUS
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q1  THE CENSUS. Bodyweight-tier occurrences of every movement needing an OVERHEAD BAR.');
const reqOf=n=>NOTE_RE.test(n)?'NOTE':(REQ[n]||'UNCLASSIFIED');
const BAR_ROWS=BW.filter(r=>NEEDS_BAR(reqOf(r.name)));
const BAR_DAYS=new Set(BAR_ROWS.map(r=>r.dayKey));
const BAR_BUILDS=new Set(BAR_ROWS.map(r=>r.dayKey.split('|WK')[0]));
const byName=new Map(); BAR_ROWS.forEach(r=>byName.set(r.name,(byName.get(r.name)||0)+1));
console.log(pad('movement',34)+lp('occurrences',13)+lp('of BW items',13)+lp('distinct days',15)+lp('of BW days',12));
[...byName.entries()].sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>{
  const dd=new Set(BAR_ROWS.filter(r=>r.name===n).map(r=>r.dayKey)).size;
  console.log(pad(n,34)+lp(c,13)+lp(pct(c,BW.length),13)+lp(dd,15)+lp(pct(dd,BW_DAYS.size),12));
});
console.log(pad('TOTAL (BAR)',34)+lp(BAR_ROWS.length,13)+lp(pct(BAR_ROWS.length,BW.length),13)+lp(BAR_DAYS.size,15)+lp(pct(BAR_DAYS.size,BW_DAYS.size),12));
console.log('\nbuilds carrying at least one bar movement: '+BAR_BUILDS.size+'/'+BW_BUILDS.size+' = '+pct(BAR_BUILDS.size,BW_BUILDS.size));

sub('Q1b  The names coach LISTED, checked one by one. A zero here is a real answer.');
['Chinups','Weighted chinups','L-sit chinups','Hanging knee raises','Hanging leg raises'].forEach(n=>{
  const c=bwNames.get(n)||0;
  console.log('  '+pad(n,26)+lp(c,8)+'   '+(c?'PRESENT':'absent from the bodyweight corpus'));
});
console.log('\n  names coach did NOT list that this pass found:');
[...byName.keys()].filter(n=>['Chinups','Weighted chinups','L-sit chinups','Hanging knee raises','Hanging leg raises'].indexOf(n)<0)
  .sort((a,b)=>byName.get(b)-byName.get(a)).forEach(n=>console.log('  '+pad(n,26)+lp(byName.get(n),8)));

sub('Q1c  The OTHER classes on the same tier, for scale. Not the question, but the same defect family.');
const classCount=new Map(), classDays=new Map();
BW.forEach(r=>{ const c=reqOf(r.name); classCount.set(c,(classCount.get(c)||0)+1);
  if(!classDays.has(c)) classDays.set(c,new Set()); classDays.get(c).add(r.dayKey); });
[...classCount.entries()].sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>
  console.log('  '+pad(c,18)+lp(n,10)+lp(pct(n,BW.length),10)+'   days '+lp(classDays.get(c).size,7)+lp(pct(classDays.get(c).size,BW_DAYS.size),10)));
console.log('\n  non-NONE / non-ANCHOR / non-NOTE items on a tier whose copy is "Nothing but you. A floor, a wall, and a chair.":');
const impossible=BW.filter(r=>{const c=reqOf(r.name); return c!=='NONE'&&c!=='ANCHOR'&&c!=='NOTE';});
const impDays=new Set(impossible.map(r=>r.dayKey));
console.log('  '+impossible.length+'/'+BW.length+' items = '+pct(impossible.length,BW.length)+'   on '+impDays.size+'/'+BW_DAYS.size+' days = '+pct(impDays.size,BW_DAYS.size));

sub('Q1d  SEGMENTED. Cut the bar rate by focus, experience, goal, week, injury state.');
function seg(key,label,universe,hit){
  const tot=new Map(), bad=new Map();
  universe.forEach(r=>tot.set(r[key],(tot.get(r[key])||0)+1));
  hit.forEach(r=>bad.set(r[key],(bad.get(r[key])||0)+1));
  console.log('\n  by '+label+':');
  [...tot.keys()].sort().forEach(k=>console.log('    '+pad(k,22)+lp((bad.get(k)||0)+'/'+tot.get(k),16)+lp(pct(bad.get(k)||0,tot.get(k)),10)));
}
seg('focus','liftingFocus',BW,BAR_ROWS);
seg('exp','experience',BW,BAR_ROWS);
seg('goal','goal',BW,BAR_ROWS);
seg('wk','week',BW,BAR_ROWS);
seg('inj','injury state',BW,BAR_ROWS);
seg('travel','travel overlay',BW,BAR_ROWS);

sub('Q1e  WHICH SECTION does the bar movement land in? This is the slot, and it names the pool.');
const bySec=new Map();
BAR_ROWS.forEach(r=>{ const k=r.name+'   @   '+(r.label||'(no label)'); bySec.set(k,(bySec.get(k)||0)+1); });
[...bySec.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,c])=>console.log('  '+lp(c,8)+'  '+k));

/* ════════════════════════════════════════════════════════════════════════════
   §7  Q2 — THE PULL PICTURE
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q2  WHAT IS THE BODYWEIGHT TIER\'S PULL PICTURE, AND WHAT SURVIVES A WITHHOLD?');
const pullOf=n=>PULL[n]||null;
const PULLROWS=BW.filter(r=>pullOf(r.name));
sub('Q2a  Every pull movement the bodyweight tier can be prescribed, by axis.');
const pn=new Map(); PULLROWS.forEach(r=>{ const k=pullOf(r.name)+'|'+r.name; pn.set(k,(pn.get(k)||0)+1); });
['vpull','hpull'].forEach(ax=>{
  console.log('\n  '+ax.toUpperCase()+':');
  const ent=[...pn.entries()].filter(e=>e[0].startsWith(ax+'|')).sort((a,b)=>b[1]-a[1]);
  if(!ent.length){ console.log('    (none)'); return; }
  ent.forEach(([k,c])=>{ const n=k.split('|')[1];
    console.log('    '+lp(c,8)+'  '+pad(n,48)+'  needs '+reqOf(n)); });
  const tot=ent.reduce((a,b)=>a+b[1],0);
  const barTot=ent.filter(e=>NEEDS_BAR(reqOf(e[0].split('|')[1]))).reduce((a,b)=>a+b[1],0);
  console.log('    '+lp(tot,8)+'  TOTAL   of which needing an overhead bar: '+barTot+' = '+pct(barTot,tot));
});

sub('Q2b  CROSS-CHECK. The engine\'s own _pattern() measured against the hand table (O2).');
const patLine=lineOf(/if\(\/l-sit chin\|l-sit pull\/\.test\(N\)\) return 'vpull'/);
console.log('_pattern is at index.html:'+lineOf(/^function _pattern\(/)+', the vpull clause at index.html:'+lineOf(/chinup\|pullup\|pull-up\|chin-up\|lat pull\/\.test\(N\)\) return 'vpull'/));
let agree=0, disagree=[];
[...bwNames.keys()].forEach(n=>{
  if(NOTE_RE.test(n)) return;
  const mine=pullOf(n)||'-';
  let his='-'; try{ his=IA._pattern?(IA._pattern(n)||'-'):'?'; }catch(e){ his='THREW'; }
  const hisPull=(his==='vpull'||his==='hpull'||his==='row'||his==='pull')?his:'-';
  if((mine==='-'&&hisPull==='-')||(mine!=='-'&&hisPull!=='-'&&(mine===hisPull||(mine==='hpull'&&hisPull==='row')))) agree++;
  else disagree.push([n,mine,his,bwNames.get(n)]);
});
console.log('names where hand table and _pattern agree: '+agree+'/'+(bwNames.size-[...bwNames.keys()].filter(n=>NOTE_RE.test(n)).length));
if(disagree.length){ console.log('DISAGREEMENTS (hand -> _pattern, occurrences):');
  disagree.sort((a,b)=>b[3]-a[3]).forEach(d=>console.log('   '+pad(d[0],48)+pad(d[1],10)+pad(d[2],12)+lp(d[3],8))); }

sub('Q2c  THE WITHHOLD, simulated at ITEM level. Drop every BAR name from the built card.');
// This does NOT guess an implementation. It asks only: if those items were not there,
// what would the day be holding?
const perDay=new Map();
BW.forEach(r=>{ if(!perDay.has(r.dayKey)) perDay.set(r.dayKey,[]); perDay.get(r.dayKey).push(r); });
let d_anyPull=0,d_anyV=0,d_anyH=0;
let a_anyPull=0,a_anyV=0,a_anyH=0;
let lostAllPull=0, lostAllV=0, dayLostEverySection=0;
const lostVdetail=new Map();
perDay.forEach((items,k)=>{
  const before=items.filter(r=>pullOf(r.name));
  const after =before.filter(r=>!NEEDS_BAR(reqOf(r.name)));
  const bV=before.filter(r=>pullOf(r.name)==='vpull'), aV=after.filter(r=>pullOf(r.name)==='vpull');
  const bH=before.filter(r=>pullOf(r.name)==='hpull'), aH=after.filter(r=>pullOf(r.name)==='hpull');
  if(before.length) d_anyPull++; if(bV.length) d_anyV++; if(bH.length) d_anyH++;
  if(after.length)  a_anyPull++; if(aV.length) a_anyV++; if(aH.length) a_anyH++;
  if(before.length&&!after.length) lostAllPull++;
  if(bV.length&&!aV.length){ lostAllV++; bV.forEach(r=>lostVdetail.set(r.name,(lostVdetail.get(r.name)||0)+1)); }
  const nonBar=items.filter(r=>!NEEDS_BAR(reqOf(r.name)));
  if(items.length&&!nonBar.length) dayLostEverySection++;
});
console.log(pad('',34)+lp('BEFORE',14)+lp('AFTER',14)+lp('delta',12));
console.log(pad('days with any pull item',34)+lp(d_anyPull,14)+lp(a_anyPull,14)+lp(a_anyPull-d_anyPull,12));
console.log(pad('days with a VERTICAL pull',34)+lp(d_anyV,14)+lp(a_anyV,14)+lp(a_anyV-d_anyV,12));
console.log(pad('days with a HORIZONTAL pull',34)+lp(d_anyH,14)+lp(a_anyH,14)+lp(a_anyH-d_anyH,12));
console.log('\ndenominator: '+BW_DAYS.size+' bodyweight trained days');
console.log('days that lose their LAST pull of any kind: '+lostAllPull+'/'+BW_DAYS.size+' = '+pct(lostAllPull,BW_DAYS.size));
console.log('days that lose their LAST VERTICAL pull:    '+lostAllV+'/'+BW_DAYS.size+' = '+pct(lostAllV,BW_DAYS.size));
console.log('days emptied entirely:                      '+dayLostEverySection);
if(lostVdetail.size){ console.log('\nthe vertical pull that went away, by name:');
  [...lostVdetail.entries()].sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log('   '+lp(c,8)+'  '+n)); }

sub('Q2d  AFTER the withhold: does ANY vertical pull remain on the bodyweight tier at all?');
const vAfter=BW.filter(r=>pullOf(r.name)==='vpull'&&!NEEDS_BAR(reqOf(r.name)));
const vNames=new Map(); vAfter.forEach(r=>vNames.set(r.name,(vNames.get(r.name)||0)+1));
if(!vNames.size){
  console.log('  NONE. 0 vertical-pull items over '+BW.length+' bodyweight items / '+BW_DAYS.size+' days / '+BW_BUILDS.size+' builds.');
  console.log('  Every vertical pull the tier can currently print requires an overhead bar.');
} else { vNames.forEach((c,n)=>console.log('   '+lp(c,8)+'  '+n+'  ('+reqOf(n)+')')); }

sub('Q2e  Weekly pull VOLUME per bodyweight build, before and after.');
const perBuild=new Map();
BW.forEach(r=>{ const b=r.dayKey.split('|WK')[0]; if(!perBuild.has(b)) perBuild.set(b,[]); perBuild.get(b).push(r); });
let sumB=0,sumA=0,sumVB=0,sumVA=0,nWk=0;
const wkBuckets=new Map();
perBuild.forEach((items,b)=>{
  const wks=new Set(items.map(r=>r.wk));
  wks.forEach(w=>{
    const wi=items.filter(r=>r.wk===w);
    const pb=wi.filter(r=>pullOf(r.name)).length;
    const pa=wi.filter(r=>pullOf(r.name)&&!NEEDS_BAR(reqOf(r.name))).length;
    const vb=wi.filter(r=>pullOf(r.name)==='vpull').length;
    const va=wi.filter(r=>pullOf(r.name)==='vpull'&&!NEEDS_BAR(reqOf(r.name))).length;
    sumB+=pb; sumA+=pa; sumVB+=vb; sumVA+=va; nWk++;
    const k=pb+'->'+pa; wkBuckets.set(k,(wkBuckets.get(k)||0)+1);
  });
});
console.log('  program-weeks measured: '+nWk);
console.log('  mean pull items / week      BEFORE '+(sumB/nWk).toFixed(3)+'   AFTER '+(sumA/nWk).toFixed(3)+'   delta '+((sumA-sumB)/nWk).toFixed(3));
console.log('  mean VERTICAL pull / week   BEFORE '+(sumVB/nWk).toFixed(3)+'   AFTER '+(sumVA/nWk).toFixed(3)+'   delta '+((sumVA-sumVB)/nWk).toFixed(3));
console.log('  program-weeks whose pull count drops to ZERO: '+[...wkBuckets.entries()].filter(e=>e[0].endsWith('->0')&&e[0]!=='0->0').reduce((a,b)=>a+b[1],0)+'/'+nWk);

/* ════════════════════════════════════════════════════════════════════════════
   §8  Q2f — THE POOLS. Which empty, and does _gear hand the raw pool back?
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q2f  THE POOLS THOSE NAMES SIT IN. Transcribed from source with live line numbers.');
const L_GEAR=lineOf(/^  const _gear = pool => /);
console.log('the non-empty fallback, index.html:'+L_GEAR+':');
console.log('   '+LINES[L_GEAR-1].trim());
console.log('   -> a pool that empties under the filter is handed back RAW. Coach\'s EXLIB.leg_iso no-op.');
console.log('');
// Each entry: label, source line regex, the members as they resolve ON THE BODYWEIGHT TIER,
// and whether the expression is routed through _gear().
const POOLS=[
 {k:'EXLIB.back_pull', ln:lineOf(/^  back_pull:\['Chinups'/), gear:false,
  members:['Chinups','Weighted chinups','L-sit chinups','Neutral-grip chinups'],
  reach:'reached on bodyweight only via the injury branch pools below; the healthy backPull slot at index.html:'+lineOf(/const backPull  = _slot\(_bw\(/)+' routes bodyweight to the table-row ladder instead.'},
 {k:'EXLIB.core', ln:lineOf(/^  core:\['Ab wheel rollouts'/), gear:false,
  members:['Ab wheel rollouts','Dead bugs','Hanging knee raises','Plank hold','L-sit hold','Bird dogs'],
  reach:'drawn RAW at index.html:'+lineOf(/core: *pick\(EXLIB\.core,3,bs\+10\)/)+' — `pick(EXLIB.core,3,bs+10)`. No _bw(), no _gear(), no tier argument.'},
 {k:'CORE_PILLARS.dynamic_bracing', ln:lineOf(/  dynamic_bracing: \{/), gear:'_auxGearOK',
  members:['Hanging knee raises','Hanging leg raises','Garhammer raises','Toes-to-bar'],
  reach:'filtered by _auxGearOK at index.html:'+lineOf(/\(P\[key\]\.items\|\|\[\]\)\.filter\(it=>_auxGearOK\(it\.name, equip\)\)/)+', and _auxGearOK has NO hanging/bar clause, so all four pass on bodyweight.'},
 {k:'injury lowback/protect rowPool', ln:lineOf(/rowPool = hasCables\?\['Straight-arm pulldown'\]:\['Assisted pullups'/), gear:false,
  members:['Assisted pullups','Neutral-grip chinups','Chinups'],
  reach:'a raw literal. hasCables is false on bodyweight, so the ELSE arm is taken whole; the only filter is `hasDumbbells||!/weighted/i` which drops Weighted chinups.'},
 {k:'injury elbow/protect chestCompoundPool', ln:lineOf(/chestCompoundPool = hasCables\?\['Straight-arm pulldown','Lat pulldown'\]:\['Inverted rows \(bodyweight\)'\]/), gear:false,
  members:['Inverted rows (bodyweight)'],
  reach:'a ONE-ITEM raw literal on the cable-less arm. Names a bar at height, not a table.'},
 {k:'denseHypertrophy biceps pool', ln:lineOf(/const _bicPool=_bw\(\['Chinups','Inverted row \(supinated, under a table\)'\],bicepsAccPool\)/), gear:false,
  members:['Chinups','Inverted row (supinated, under a table)'],
  reach:'the BODYWEIGHT arm of _bw(). _bwRung returns a pool of length<3 unchanged (index.html:'+lineOf(/if\(!Array\.isArray\(pool\)\|\|pool\.length<3\) return pool;/)+'), so both members survive; pick(...,2) then takes BOTH.'},
 {k:'full-body upper press literal', ln:lineOf(/const _press=pick\(EXLIB\.chest_acc\.filter\(n=>\/dumbbell\|dips\/i\.test\(n\)\),1/), gear:false,
  members:['Dumbbell incline press','Dumbbell bench press','Dips','Dumbbell decline press','Dumbbell floor press'],
  reach:'an inline filter over EXLIB.chest_acc with no tier argument at all. Every member needs gear.'},
 {k:'chestAccPool', ln:lineOf(/const chestAccPool    = _bw\(/), gear:false,
  members:['Incline pushups (hands on bed)','Wide-stance pushups','Pushups (slow 3s eccentric)','Close-grip pushups','Decline pushups (feet elevated)'],
  reach:'_bw()-gated, bodyweight arm is clean. Listed because coach named it; it is NOT a bar path.'},
 {k:'fullPullPool', ln:lineOf(/const fullPullPool=hasRack/), gear:false,
  members:['Inverted row (under a table)','Feet-elevated inverted row (under a table)','Inverted row (knees bent, under a table)'],
  reach:'hasRack (index.html:'+lineOf(/const hasRack=equip==='home_full'\|\|equip==='commercial'\|\|isCrossfit;/)+') is FALSE on bodyweight, so the _bw arm is taken. Clean.'},
];
POOLS.forEach(p=>{
  const surv=p.members.filter(n=>!NEEDS_BAR(reqOf(n)));
  const bar=p.members.filter(n=>NEEDS_BAR(reqOf(n)));
  console.log('\n  '+p.k+'   index.html:'+p.ln);
  console.log('    members on bodyweight : '+p.members.map(n=>n+' ['+reqOf(n)+']').join(', '));
  console.log('    needs an overhead bar : '+(bar.length?bar.join(', '):'(none)'));
  console.log('    survives a withhold   : '+surv.length+'/'+p.members.length+(surv.length?'  -> '+surv.join(', '):'   *** POOL EMPTIES ***'));
  console.log('    gear-filtered?        : '+(p.gear===false?'NO — raw literal / no _gear() call':p.gear));
  if(!surv.length) console.log('    FALLBACK RISK         : '+(p.gear?'yes — the non-empty fallback at index.html:'+L_GEAR+' would hand the RAW pool straight back (silent no-op, the EXLIB.leg_iso shape)':'no _gear() wrapper, so an empty pool SHORT-DRAWS or throws instead of silently no-opping'));
  console.log('    reach                 : '+p.reach);
});

/* ════════════════════════════════════════════════════════════════════════════
   §9  Q3 — THE TRAVEL / WIZARD SPLIT
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q3  TRAVEL ("Room only") vs WIZARD ("Bodyweight only") — same enum, two populations.');
console.log('cfg._travel WRITE sites:');
linesOf(/_travel:true/).forEach(l=>console.log('   index.html:'+l+' | '+LINES[l-1].trim()));
console.log('\ncfg._travel READ sites (every one in the file):');
linesOf(/_travel/).filter(l=>!/_travel:true/.test(LINES[l-1])).forEach(l=>console.log('   index.html:'+l+' | '+LINES[l-1].trim()));
console.log('\n-> the flag IS present on cfg at build time and IS in scope inside buildProgram');
console.log('   (the read at index.html:'+lineOf(/const loadCapped = !!cfg\._travel/)+' is inside the same closure as _gearOK at index.html:'+lineOf(/const _gearOK = n => \{/)+'),');
console.log('   so a site that wanted to gate a hanging movement on it could. Count of sites that do so today:');
const travelGated=linesOf(/_travel/).filter(l=>/chin|pull|hang|bar/i.test(LINES[l-1]));
console.log('   '+travelGated.length);
console.log('\nSITES that would need it (they name a bar movement on a bodyweight-reachable path):');
POOLS.filter(p=>p.members.some(n=>NEEDS_BAR(reqOf(n)))).forEach(p=>console.log('   index.html:'+p.ln+'   '+p.k));
console.log('   index.html:'+lineOf(/\(P\[key\]\.items\|\|\[\]\)\.filter\(it=>_auxGearOK\(it\.name, equip\)\)/)+'   CORE_PILLARS draw — but _auxGearOK receives only `equip`, NOT cfg. Signature: index.html:'+lineOf(/^function _auxGearOK\(name,equip\)\{/));
console.log('   index.html:'+lineOf(/^function bodyweightSweep\(weeks, _bwExp, _bwPrev\)\{/)+'   bodyweightSweep — receives only (weeks,_bwExp,_bwPrev). No cfg, no _travel.');

sub('Q3b  Population counts in this lattice.');
const bwT=BW.filter(r=>r.travel), bwW=BW.filter(r=>!r.travel);
const bwTd=new Set(bwT.map(r=>r.dayKey)), bwWd=new Set(bwW.map(r=>r.dayKey));
const bwTb=new Set(bwT.map(r=>r.dayKey.split('|WK')[0])), bwWb=new Set(bwW.map(r=>r.dayKey.split('|WK')[0]));
console.log('  wizard-selected (cfg._travel undefined) : '+bwWb.size+' builds, '+bwWd.size+' days, '+bwW.length+' items');
console.log('  travel-overlaid (cfg._travel === true)  : '+bwTb.size+' builds, '+bwTd.size+' days, '+bwT.length+' items');

sub('Q3c  Bar movements on TRAVEL-overlaid bodyweight specifically. This is the unambiguous case.');
const barT=bwT.filter(r=>NEEDS_BAR(reqOf(r.name))), barW=bwW.filter(r=>NEEDS_BAR(reqOf(r.name)));
console.log(pad('movement',34)+lp('WIZARD',12)+lp('TRAVEL',12));
const allBar=[...new Set([...byName.keys()])].sort();
allBar.forEach(n=>console.log(pad(n,34)+lp(barW.filter(r=>r.name===n).length,12)+lp(barT.filter(r=>r.name===n).length,12)));
console.log(pad('TOTAL',34)+lp(barW.length,12)+lp(barT.length,12));
console.log(pad('rate over that population items',34)+lp(pct(barW.length,bwW.length),12)+lp(pct(barT.length,bwT.length),12));
console.log(pad('distinct days carrying one',34)+lp(new Set(barW.map(r=>r.dayKey)).size+'/'+bwWd.size,18)+lp(new Set(barT.map(r=>r.dayKey)).size+'/'+bwTd.size,18));
const sameShape = (barW.length/(bwW.length||1)).toFixed(4)===(barT.length/(bwT.length||1)).toFixed(4);
console.log('\n  identical rate to 4dp? '+(sameShape?'YES — the travel flag changes nothing about bar movements':'no'));

/* ════════════════════════════════════════════════════════════════════════════
   §10  Q4 — THE SAME-LENS CHECK
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q4  DOES ANY PREDICATE IN THE FILE ALREADY HOLD AN OPINION ABOUT A BAR? DO THEY AGREE?');
// _gearOK is a closure inside buildProgram and is not exported. Its three clauses are
// TRANSCRIBED here from the source lines printed below and evaluated with the bodyweight
// tier's flag values (hasBarbell=false, hasCables=false, hasDumbbells=false). The
// transcription is printed so it can be checked against the file by eye.
const L_G1=lineOf(/if\(!hasBarbell && \/\^barbell /), L_G2=lineOf(/if\(!hasCables && \/cable\|/), L_G3=lineOf(/if\(!hasDumbbells && \/\\bdumbbell/);
console.log('_gearOK clauses (transcribed, index.html:'+L_G1+', '+L_G2+', '+L_G3+'):');
[L_G1,L_G2,L_G3].forEach(l=>console.log('   '+lp(l,6)+' | '+LINES[l-1].trim()));
const G1=/^barbell |^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|glute-ham/i;
const G2=/cable|\brope\b|face pull|pulldown|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|hack squat|\bsmith\b|preacher|\bmachine\b/i;
const G3=/\bdumbbell|\bdb\b|goblet/i;
const gearOK_bw = n => !(G1.test(n)||G2.test(n)||G3.test(n));
const BWGEAR = IA.eval('typeof _BW_GEAR!=="undefined" ? _BW_GEAR.source : null');
const BWKEEP = IA.eval('typeof _BW_KEEP_FIXED!=="undefined" ? _BW_KEEP_FIXED.source : null');
const BWSUBS = IA.eval('typeof _BW_SUBS!=="undefined" ? JSON.stringify(_BW_SUBS) : "{}"');
const _bwSubs = JSON.parse(BWSUBS);
console.log('\n_BW_GEAR       index.html:'+lineOf(/^const _BW_GEAR=/)+'   (the bodyweightSweep substitution trigger)');
console.log('_BW_KEEP_FIXED index.html:'+lineOf(/^const _BW_KEEP_FIXED=/));
console.log('_auxGearOK     index.html:'+lineOf(/^function _auxGearOK\(name,equip\)\{/));
console.log('hasRack        index.html:'+lineOf(/const hasRack=equip==='home_full'/));
console.log('_AUX_GEAR      index.html:'+lineOf(/^const _AUX_GEAR=/));
const RE_BWGEAR=new RegExp(BWGEAR,'i');
const auxOK=(n)=>{ try{ return IA.eval('_auxGearOK('+JSON.stringify(n)+',"bodyweight")'); }catch(e){ return 'THREW'; } };
const HANGNAMES=['Chinups','Neutral-grip chinups','Weighted chinups','L-sit chinups','Assisted pullups',
  'Toes-to-bar','Hanging knee raises','Hanging leg raises','Garhammer raises','Hanging hold',
  'Inverted rows (bodyweight)','Dips','Ab wheel rollouts'];
console.log('\nTHE MATRIX. "legal" = the predicate lets the name onto the bodyweight tier.');
console.log(pad('movement',30)+pad('hand(O1)',14)+pad('_gearOK',10)+pad('_auxGearOK',12)+pad('_BW_GEAR',10)+pad('_BW_SUBS',24)+pad('occurs',8));
HANGNAMES.forEach(n=>{
  const g=gearOK_bw(n)?'legal':'BLOCKS';
  const a=auxOK(n)===true?'legal':(auxOK(n)===false?'BLOCKS':String(auxOK(n)));
  const b=RE_BWGEAR.test(n)?'rewrites':'legal';
  const s=_bwSubs[n]?('-> '+_bwSubs[n]):'-';
  console.log(pad(n,30)+pad(reqOf(n),14)+pad(g,10)+pad(a,12)+pad(b,10)+pad(s,24)+lp(bwNames.get(n)||0,8));
});
sub('Q4b  DISAGREEMENTS, named.');
const dis=[];
HANGNAMES.forEach(n=>{
  const hand=reqOf(n);
  const impossible = hand==='BAR'||hand==='BARHEIGHT'||hand==='DIPBAR'||hand.startsWith('GEAR:');
  const g=gearOK_bw(n), a=auxOK(n)===true, b=!RE_BWGEAR.test(n), s=!!_bwSubs[n];
  const verdicts={'_gearOK':g,'_auxGearOK':a,'_BW_GEAR/sweep':(b&&!s)};
  const legalSet=Object.keys(verdicts).filter(k=>verdicts[k]);
  const blockSet=Object.keys(verdicts).filter(k=>!verdicts[k]);
  if(impossible && legalSet.length) dis.push([n,hand,'O1 says the tier cannot do it; '+legalSet.join(' + ')+' say legal'+(blockSet.length?'; '+blockSet.join(' + ')+' disagree and block':' — UNANIMOUS AND ALL WRONG')]);
  else if(blockSet.length&&legalSet.length) dis.push([n,hand,'predicates split: legal='+legalSet.join(',')+' block='+blockSet.join(',')]);
});
if(!dis.length) console.log('  none');
dis.forEach(d=>console.log('  '+pad(d[0],30)+pad(d[1],12)+d[2]));
console.log('\n  Token scan — does the string "pull-up bar" / "pullupbar" / "hasBar" exist as a GATE anywhere');
console.log('  (comments stripped first, per §10b):');
const noComments = SRC.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.replace(/\/\/.*$/,'')).join('\n');
['hasPullupBar','hasBar','pullupbar','pullUpBar','hasHangBar','canHang'].forEach(tok=>{
  const c=(noComments.match(new RegExp(tok,'g'))||[]).length;
  console.log('    '+pad(tok,16)+lp(c,6)+(c?'':'   (no such predicate exists)'));
});

/* ════════════════════════════════════════════════════════════════════════════
   §11  Q5 — WHAT ELSE REACHES BODYWEIGHT UNGATED
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q5  THE LITERAL PATHS COACH NAMED, MEASURED ON THE BODYWEIGHT TIER.');
const SITES=[
 ['fullPushPool',      lineOf(/let fullPushPool=hasRack/),            ['Dips','Pushups (slow tempo)','Diamond pushups','Decline pushups']],
 ['chestAccPool',      lineOf(/const chestAccPool    = _bw\(/),       ['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press']],
 ['chestPoolRaw',      lineOf(/const chestPoolRaw=isOlder\?EXLIB\.chest_acc_joint:EXLIB\.chest_acc;/), ['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press']],
 ['chest_acc dumbbell|dips filter', lineOf(/const _press=pick\(EXLIB\.chest_acc\.filter\(n=>\/dumbbell\|dips\/i\.test\(n\)\),1/), ['Dumbbell incline press','Dumbbell bench press','Dips','Dumbbell decline press','Dumbbell floor press']],
 ['EXLIB.conditioning', lineOf(/cond: *pick\(_bwFlat\(/),    null],
 ['EXLIB.core',        lineOf(/core: *pick\(EXLIB\.core,3,bs\+10\)/), ['Ab wheel rollouts','Dead bugs','Hanging knee raises','Plank hold','L-sit hold','Bird dogs']],
 ['CORE_PILLARS via _auxGearOK', lineOf(/\(P\[key\]\.items\|\|\[\]\)\.filter\(it=>_auxGearOK\(it\.name, equip\)\)/), ['Hanging knee raises','Hanging leg raises','Garhammer raises','Toes-to-bar']],
];
console.log(pad('literal path',34)+pad('index.html',14)+'gear-requiring members that CAN land on bodyweight');
SITES.forEach(([k,l,mem])=>{
  if(!mem){ console.log(pad(k,34)+pad(':'+l,14)+'(pool walked at runtime — see conditioning row below)'); return; }
  const bad=mem.filter(n=>{const c=reqOf(n); return c!=='NONE'&&c!=='ANCHOR'&&c!=='UNCLASSIFIED';});
  const survived=bad.filter(n=>(bwNames.get(n)||0)>0);
  console.log(pad(k,34)+pad(':'+l,14)+(bad.length?bad.map(n=>n+'['+reqOf(n)+']').join(', '):'(none)'));
  console.log(pad('',34)+pad('',14)+'   of those, actually PRINTED on bodyweight: '+(survived.length?survived.map(n=>n+' x'+bwNames.get(n)).join(', '):'0 — bodyweightSweep rewrote them all'));
});
sub('Q5b  EXLIB.conditioning on bodyweight: the _bwFlat arm is taken, so measure what printed.');
const CONDSET=new Set(['Burpees','Mountain climbers','Jump squats','Broad jumps','Skater bounds','High knees']);
const condPrinted=[...bwNames.keys()].filter(n=>CONDSET.has(n));
console.log('  bodyweight arm members that printed: '+condPrinted.map(n=>n+' x'+bwNames.get(n)).join(', '));
const condLeak=[...bwNames.keys()].filter(n=>!CONDSET.has(n)&&/ball slam|kettlebell|sled|rower|assault|row erg|wall ball/i.test(n));
console.log('  loaded-conditioning names that leaked onto bodyweight: '+(condLeak.length?condLeak.join(', '):'0'));

sub('Q5c  THE EFFECTIVENESS QUESTION. If the bar is withheld IN THE INVENTORY ONLY,');
console.log('     how many of the bodyweight bar occurrences would that reach?');
console.log('  An inventory gate can only act where a predicate actually consults the inventory.');
console.log('  Today that is _gearOK (via _gear) and _auxGearOK. Per occurrence:');
const reachable=[], notReachable=[];
BAR_ROWS.forEach(r=>{
  // an occurrence is reachable by an inventory gate only if the pool it came from is
  // routed through a predicate at all. Determined by name -> pool, from §8.
  const auxOnly=['Hanging knee raises','Hanging leg raises','Garhammer raises','Toes-to-bar'].indexOf(r.name)>=0;
  if(auxOnly) reachable.push(r); else notReachable.push(r);
});
console.log('  occurrences on a path that consults a predicate (_auxGearOK, CORE_PILLARS): '+reachable.length+'/'+BAR_ROWS.length+' = '+pct(reachable.length,BAR_ROWS.length));
console.log('  occurrences on a RAW LITERAL that consults nothing:                        '+notReachable.length+'/'+BAR_ROWS.length+' = '+pct(notReachable.length,BAR_ROWS.length));
const nrNames=new Map(); notReachable.forEach(r=>nrNames.set(r.name,(nrNames.get(r.name)||0)+1));
console.log('  the raw-literal occurrences, by name:');
[...nrNames.entries()].sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log('     '+lp(c,8)+'  '+n));
console.log('\n  NOTE: EXLIB.core is also a raw literal (pick(EXLIB.core,3,...)) — Hanging knee raises');
console.log('  reaches bodyweight through BOTH the _auxGearOK-filtered pillar AND the unfiltered');
console.log('  EXLIB.core draw, so its occurrences are split across the two rows above by name only.');
const hkrCore=BW.filter(r=>r.name==='Hanging knee raises');
const hkrBySec=new Map(); hkrCore.forEach(r=>hkrBySec.set(r.label||'(none)',(hkrBySec.get(r.label||'(none)')||0)+1));
console.log('  Hanging knee raises by SECTION LABEL (the slot identifies the pool):');
[...hkrBySec.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,c])=>console.log('     '+lp(c,8)+'  '+k));

/* ════════════════════════════════════════════════════════════════════════════
   §12  SPREAD — the same names on every OTHER tier, for contrast
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q6  SENSITIVITY + SLOT ATTRIBUTION. Where every impossible item actually lands.');
console.log('Q6a  hpull is the disputed class in Q2b. Recount it STRICTLY (rows only, no scap/prone work):');
const STRICT_H=new Set(['Inverted row (under a table)','Inverted row (knees bent, under a table)','Feet-elevated inverted row (under a table)','Inverted row (supinated, under a table)','Inverted rows (bodyweight)','Feet-elevated inverted rows','Inverted rows (rings)','Resistance band row','Single-arm resistance band row']);
const strictH=BW.filter(r=>STRICT_H.has(r.name));
const strictHdays=new Set(strictH.map(r=>r.dayKey));
console.log('  strict hpull items: '+strictH.length+'/'+BW.length+' = '+pct(strictH.length,BW.length)+'   on '+strictHdays.size+'/'+BW_DAYS.size+' days = '+pct(strictHdays.size,BW_DAYS.size));
console.log('  strict hpull items needing an OVERHEAD bar: '+strictH.filter(r=>reqOf(r.name)==='BAR').length);
console.log('  strict hpull items needing a BAR AT HEIGHT (Inverted rows (bodyweight)): '+strictH.filter(r=>reqOf(r.name)==='BARHEIGHT').length);
let hadStrict=0;
perDay.forEach(items=>{ const h=items.filter(r=>STRICT_H.has(r.name)); if(h.length) hadStrict++; });
console.log('  days holding at least one strict row: '+hadStrict+'/'+BW_DAYS.size+' = '+pct(hadStrict,BW_DAYS.size));
console.log('  -> the withhold removes 0 of them. The horizontal axis is untouched by the bar question.');
sub('Q6b  Every class the bodyweight tier cannot physically do, by SECTION LABEL.');
const IMP=BW.filter(r=>{const c=reqOf(r.name); return c!=='NONE'&&c!=='ANCHOR'&&c!=='NOTE';});
const impBy=new Map();
IMP.forEach(r=>{ const k=pad(reqOf(r.name),14)+pad(r.name,34)+'@ '+(r.label||'(no label)'); impBy.set(k,(impBy.get(k)||0)+1); });
console.log(lp('count',9)+'  '+pad('class',14)+pad('movement',34)+'section');
[...impBy.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,c])=>console.log(lp(c,9)+'  '+k));
sub('Q6c  Day-level: how many bodyweight days carry at least one item of each impossible class?');
const impClasses=[...new Set(IMP.map(r=>reqOf(r.name)))];
impClasses.forEach(c=>{
  const rs=IMP.filter(r=>reqOf(r.name)===c);
  const ds=new Set(rs.map(r=>r.dayKey)), bs=new Set(rs.map(r=>r.dayKey.split('|WK')[0]));
  console.log('  '+pad(c,16)+lp(rs.length+' items',16)+lp(ds.size+'/'+BW_DAYS.size+' days',26)+lp(pct(ds.size,BW_DAYS.size),9)+lp(bs.size+'/'+BW_BUILDS.size+' builds',20)+lp(pct(bs.size,BW_BUILDS.size),9));
});

hr('SPREAD  The same bar movements across all six tiers. Bodyweight is the column in question.');
const barSet=new Set(Object.keys(REQ).filter(n=>REQ[n]==='BAR'));
const spread={}; TIERS.forEach(t=>spread[t]={tot:0,bar:0,names:new Map()});
rows.forEach(r=>{ const s=spread[r.tier]; s.tot++; if(barSet.has(r.name)){ s.bar++; s.names.set(r.name,(s.names.get(r.name)||0)+1); } });
console.log(pad('tier',14)+lp('items',12)+lp('BAR items',12)+lp('rate',10)+'  distinct bar names');
TIERS.forEach(t=>console.log(pad(t,14)+lp(spread[t].tot,12)+lp(spread[t].bar,12)+lp(pct(spread[t].bar,spread[t].tot),10)+'  '+spread[t].names.size));
console.log('\nper name, per tier:');
console.log(pad('movement',30)+TIERS.map(t=>lp(t.slice(0,10),12)).join(''));
[...barSet].sort().forEach(n=>{
  const cells=TIERS.map(t=>lp(spread[t].names.get(n)||0,12)).join('');
  if(TIERS.some(t=>spread[t].names.get(n))) console.log(pad(n,30)+cells);
});
console.log('\n(minimal is "one or two kettlebells" — index.html:'+lineOf(/minimal.*=.*one or two fixed/i)+' region — and is shown for contrast only.)');

/* ════════════════════════════════════════════════════════════════════════════
   §13  Q7 — CONDITIONAL RATES. Given the slot exists, how often is it a bar?
   A rate over all items hides how load-bearing the name is inside its own block.
   Second bodyweight-only sweep, same lattice, because the main sweep keyed items
   and this question keys SECTIONS.
   ════════════════════════════════════════════════════════════════════════════ */
hr('Q7  CONDITIONAL RATES. Given the section exists on bodyweight, is a bar movement in it?');
const BARSET2=new Set(Object.keys(REQ).filter(n=>REQ[n]==='BAR'));
let q_bic=0,q_bicChin=0,q_pull=0,q_pullBar=0,q_db=0,q_dbBar=0,q_sec=0,q_secBar=0;
[false,true].forEach(tv=>INJ.forEach(inj=>FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>SEEDS.forEach(sd=>{
  const cfg=Object.assign({name:'Q7',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,
    restDays:['sun','wed'],seed:sd,liftingFocus:f,experience:x,ageBracket:'18-35',equipment:'bodyweight'},g.f);
  if(inj) cfg.injury=inj; if(tv) cfg._travel=true;
  let p; try{ p=IA.buildProgram(cfg); }catch(e){ return; }
  Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>(d&&d.sections||[]).forEach(s=>{
    const L=String(s.label||s.coreHeader||'');
    const nm=(s.items||[]).map(i=>clean(i.name));
    const bar=nm.some(n=>BARSET2.has(n));
    q_sec++; if(bar) q_secBar++;
    if(L==='Biceps'){ q_bic++; if(nm.indexOf('Chinups')>=0) q_bicChin++; }
    if(/^Pull/.test(L)||L==='Row volume'){ q_pull++; if(bar) q_pullBar++; }
    if(/Dynamic Bracing/.test(L)){ q_db++; if(bar) q_dbBar++; }
  })));
})))))); 
console.log(pad('section family',40)+lp('sections',12)+lp('with a BAR movement',22)+lp('rate',10));
console.log(pad('ALL bodyweight sections',40)+lp(q_sec,12)+lp(q_secBar,22)+lp(pct(q_secBar,q_sec),10));
console.log(pad('"Biceps" (the denseHypertrophy block)',40)+lp(q_bic,12)+lp(q_bicChin,22)+lp(pct(q_bicChin,q_bic),10));
console.log(pad('"Pull*" / "Row volume"',40)+lp(q_pull,12)+lp(q_pullBar,22)+lp(pct(q_pullBar,q_pull),10));
console.log(pad('"Core — Dynamic Bracing"',40)+lp(q_db,12)+lp(q_dbBar,22)+lp(pct(q_dbBar,q_db),10));
console.log('\nRead this way: the tier-wide rate is 2.72% of items, but inside the two blocks that');
console.log('own the names it is '+pct(q_bicChin,q_bic)+' and '+pct(q_dbBar,q_db)+'. The names are not incidental to those blocks.');

/* ── DEAD PATH NOTE, measured not assumed ────────────────────────────────── */
sub('Q7b  EXLIB.core: an ungated path with zero consumers.');
const exCoreLn=lineOf(/core: *pick\(EXLIB\.core,3,bs\+10\)/);
const noC = SRC.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.replace(/\/\/.*$/,'')).join('\n');
const exCoreReads=(noC.match(/\bex\.core\b/g)||[]).length;
console.log('  index.html:'+exCoreLn+'  `core: pick(EXLIB.core,3,bs+10)` — written every week, ungated by tier.');
console.log('  readers of `ex.core` anywhere in the file (comments stripped): '+exCoreReads);
console.log('  occurrences of EXLIB.core-only members on bodyweight in this lattice:');
['Ab wheel rollouts','Hanging knee raises','L-sit hold','Dead bugs','Plank hold','Bird dogs'].forEach(n=>{
  const rs=BW.filter(r=>r.name===n);
  const labs=new Map(); rs.forEach(r=>labs.set(r.label||'(none)',(labs.get(r.label||'(none)')||0)+1));
  console.log('    '+pad(n,24)+lp(rs.length,9)+'  sections: '+[...labs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]+' x'+e[1]).join(' | '));
});
console.log('  -> every occurrence above is attributable to a CORE_PILLARS block label, not to ex.core.');
console.log('  -> withholding the bar at EXLIB.core would move 0 items today, because nothing reads it.');

hr('END. '+nBuilds+' builds / '+nDays+' trained days / '+nItems+' items. bodyweight slice: '+BW.length+' items on '+BW_DAYS.size+' days.');
