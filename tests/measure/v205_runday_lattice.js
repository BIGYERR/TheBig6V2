// v205 — BEFORE-PICTURE for D125 (run_pace_goal ceiling 3 -> 4) and D127 (long-run
// protection on the pace goal). READ-ONLY. Nothing here is a ruling.
//
// ORACLES, all independent of the functions under suspicion:
//  - NSW weekly template: PTG 2020 p.20 = 2 LSD + 1 LI + 1 SI => FOUR run days.
//  - capDays->type list transcribed BY HAND from the authoring contract at
//    index.html:5146 (`if(nDays === 4) return ['lsd_easy','int','chi','lsd_long'];`).
//    Not called from the engine: getSessionTypes is nested inside engineB.
//  - the D125 objective (collision-free > speed-after-rest > recovery-pads-long >
//    canonical) is re-implemented here from the ruling text + the comment block at
//    index.html:5236-5249. It is NOT _nrcSpacedRunDays.
//  - the D127 cost table is transcribed by hand from the comment at index.html:6444-6446,
//    not read from _nrcLegCost.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load } = H;

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const ALL = ['sun','mon','tue','wed','thu','fri','sat'];   // ALL_DAYS_ORDER
const say = (...a)=>console.log(...a);

// ── cfg factory ──────────────────────────────────────────────────────────────
function cfg(o={}){
  return Object.assign({
    name:'M', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0',
      mileBestMins:'8', mileBestSecs:'0', baseline:'' } },
    eventTargeted:false,
    liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
    equipment:'full_gym', unit:'lbs',
    restDays:['sun','wed'], days:ALL.slice(),
    bench:185, squat:255, deadlift:315, seed:76308,
  }, o);
}
// classify a built day's run from what the engine PRINTS (subtype + legLoad), not from
// the type map. LSD prints one subtype for easy and long; legLoad separates them
// (index.html:5518 sets legLoad for int/chi/lsd_long only).
function runClass(day){
  const c = day && day.cardio; if(!c) return null;
  const a = Array.isArray(c)?c:[c]; const r = a.find(x=>x.type==='run'); if(!r) return null;
  const s = String(r.subtype||'');
  if(/Interval \(INT\)/.test(s)) return 'INT';
  if(/Tempo|Threshold|CHI|Continuous High/i.test(s)) return 'CHI';
  if(/LSD|Long Slow|Easy|Recovery/i.test(s)) return r.legLoad ? 'LSD_LONG' : 'LSD_EASY';
  return 'OTHER:'+s;
}
const ROLE_OF_TITLE = {'Posterior Chain':'pull','Leg Strength + Mobility':'legs',
  'Strength Support':'push','Recovery Lift':'push_light','Full Body Support':'full',
  'Active Recovery':'active','Pull':'pull','Legs':'legs','Push':'push',
  'Push (light)':'push_light','Full Body':'full'};
function roleOf(day){ if(!day||day.rest) return day&&day.rest?'REST':null;
  return ROLE_OF_TITLE[day.title] || ('?'+day.title); }

function weekRows(prog){
  const out=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    const wk=prog.weeks[w]; const row={w:+w, days:{}, runs:0, census:{}};
    ALL.forEach(d=>{ const day=wk[d]; if(!day) return;
      const rc = day.rest?null:runClass(day);
      row.days[d] = {rest:!!day.rest, run:rc, role:roleOf(day), title:day.title||''};
      if(rc){ row.runs++; row.census[rc]=(row.census[rc]||0)+1; } });
    out.push(row);
  });
  return out;
}

// ════ PART 1 — MARIO'S CONFIG ════════════════════════════════════════════════
say('════ PART 1 — Mario: run_pace_goal 1.5mi/10:00, intermediate, 5 train days, rest SUN+WED, seed 76308');
say('artifact under test: '+ART+'  (ia-version '+IA.version+')');
{
  const prog = IA.buildProgram(cfg());
  say('weeks='+prog.totalWeeks+'  legRecoveryNote='+JSON.stringify(prog.legRecoveryNote));
  weekRows(prog).forEach(r=>{
    say('W'+String(r.w).padStart(2)+'  '+ALL.map(d=>{
      const x=r.days[d]; if(!x) return d.toUpperCase()+':--';
      return d.toUpperCase()+':'+(x.rest?'REST':((x.run||'norun')+'/'+x.role));
    }).join('  ')+'   runs='+r.runs+' '+JSON.stringify(r.census));
  });
  // long-run eve check
  let eveHits=0, evesChecked=0;
  weekRows(prog).forEach(r=>{
    const longD = ALL.find(d=>r.days[d] && r.days[d].run==='LSD_LONG'); if(!longD) return;
    const eve = ALL[(ALL.indexOf(longD)+6)%7]; const e=r.days[eve]; evesChecked++;
    if(e && !e.rest && (e.role==='pull'||e.role==='legs')) eveHits++;
  });
  say('long-run EVE carrying pull/legs: '+eveHits+' / '+evesChecked+' weeks');
}

// ════ PART 2 — the D125 chooser as an ORACLE, over every calendar ════════════
// type list for capDays, hand-transcribed from index.html:5146/5150 (protectInt=true path)
const TYPES_BY_CAP = {
  1:['lsd_long'], 2:['int','lsd_long'], 3:['lsd_easy','int','lsd_long'],
  4:['lsd_easy','int','chi','lsd_long'], 5:['lsd_easy','int','lsd_easy','chi','lsd_long'],
};
const HARD = new Set(['int','chi','lsd_long']);
const pos = d=>ALL.indexOf(d);
const circ = (a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevDay = d=>ALL[(pos(d)+6)%7];

function chooser(trainDays, capDays){
  const types = TYPES_BY_CAP[capDays]; const n=trainDays.length;
  const inTrain=new Set(trainDays);
  const subsets=[]; (function sub(s,acc){ if(acc.length===capDays){ if(acc[acc.length-1]===n-1) subsets.push(acc.slice()); return;} for(let i=s;i<n;i++){acc.push(i);sub(i+1,acc);acc.pop();} })(0,[]);
  const perms=[]; (function pm(rem,pre){ if(!rem.length){perms.push(pre.slice());return;} for(let i=0;i<rem.length;i++){pre.push(rem[i]);pm(rem.slice(0,i).concat(rem.slice(i+1)),pre);pre.pop();} })(types.slice(),[]);
  let best=null;
  for(const idxs of subsets){
    const days=idxs.map(i=>trainDays[i]);
    for(const p of perms){
      if(p.includes('lsd_long') && p[p.length-1]!=='lsd_long') continue;
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const hd=days.filter(d=>HARD.has(typeOf[d]));
      let coll=0; for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      const speeds=days.filter(d=>typeOf[d]==='int'||typeOf[d]==='chi');
      const speedsAfterRest=speeds.filter(d=>!inTrain.has(prevDay(d))).length;
      const longDay=days.find(d=>typeOf[d]==='lsd_long');
      const recBeforeLong = longDay && days.some(d=>typeOf[d]==='lsd_easy'&&circ(d,longDay)===1&&pos(d)<pos(longDay))?1:0;
      const s1=days.find(d=>typeOf[d]==='int'), s2=days.find(d=>typeOf[d]==='chi');
      const canonical=(s1&&s2&&pos(s1)<pos(s2))?1:0;
      const c={days,typeOf,coll,speedsAfterRest,recBeforeLong,canonical};
      if(!best||c.coll<best.coll
        ||(c.coll===best.coll&&c.speedsAfterRest>best.speedsAfterRest)
        ||(c.coll===best.coll&&c.speedsAfterRest===best.speedsAfterRest&&c.recBeforeLong>best.recBeforeLong)
        ||(c.coll===best.coll&&c.speedsAfterRest===best.speedsAfterRest&&c.recBeforeLong===best.recBeforeLong&&c.canonical>best.canonical)) best=c;
    }
  }
  // does ANY layout reach coll==0 (existence, independent of the tiebreaks)?
  let anyClean=false;
  for(const idxs of subsets){ const days=idxs.map(i=>trainDays[i]);
    for(const p of perms){ if(p.includes('lsd_long')&&p[p.length-1]!=='lsd_long') continue;
      const t={}; days.forEach((d,i)=>t[d]=p[i]);
      const hd=days.filter(d=>HARD.has(t[d])); let coll=0;
      for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      if(coll===0){anyClean=true;break;} } if(anyClean) break; }
  return {best, anyClean, nSubsets:subsets.length};
}
// current engine's even-spread chooser (index.html:5190), for contrast
function evenSpread(trainDays, capDays){
  const n=trainDays.length; const idx=[];
  if(capDays>=n) for(let i=0;i<n;i++) idx.push(i);
  else if(capDays===1) idx.push(n-1);
  else for(let k=0;k<capDays;k++) idx.push(Math.round(k*(n-1)/(capDays-1)));
  const days=[...new Set(idx)].map(i=>trainDays[i]);
  const types=TYPES_BY_CAP[capDays]; const typeOf={}; days.forEach((d,i)=>typeOf[d]=types[i]);
  const hd=days.filter(d=>HARD.has(typeOf[d])); let coll=0;
  for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
  return {days,typeOf,coll};
}
// D127 placement, cost table transcribed from index.html:6444-6446
function d127(typeOf, trainDays){
  const longD = Object.keys(typeOf).find(d=>typeOf[d]==='lsd_long');
  const eve = ALL[(pos(longD)+6)%7], after=ALL[(pos(longD)+1)%7];
  const speed=new Set(Object.keys(typeOf).filter(d=>typeOf[d]==='int'||typeOf[d]==='chi'));
  const easy=new Set(Object.keys(typeOf).filter(d=>typeOf[d]==='lsd_easy'));
  const forbidden=new Set([longD,eve]);
  const cost=(role,d)=>{ if(forbidden.has(d)) return Infinity;
    const pv=ALL[(pos(d)+6)%7], nx=ALL[(pos(d)+1)%7]; let c=0;
    if(speed.has(d)) c+= role==='pull'?0.5:1.5;
    if(easy.has(d)) c+=1;
    if(speed.has(pv)) c+=1;
    if(speed.has(nx)) c+=2;
    if(d===after) c+=2; return c; };
  const dist=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
  let best=null;
  trainDays.forEach(p=>trainDays.forEach(l=>{ if(p===l) return;
    const c=cost('pull',p)+cost('legs',l); if(!isFinite(c)) return; const sp=dist(p,l);
    if(!best||c<best.c||(c===best.c&&sp>best.sp)||(c===best.c&&sp===best.sp&&pos(l)<pos(best.legs)))
      best={c,sp,pull:p,legs:l}; }));
  return {best, longD, eve, legalHinge: trainDays.some(d=>!forbidden.has(d))};
}

function combos(k){ const out=[]; (function r(s,acc){ if(acc.length===k){out.push(acc.slice());return;} for(let i=s;i<7;i++){acc.push(ALL[i]);r(i+1,acc);acc.pop();} })(0,[]); return out; }

say('\n════ PART 2 — D125 oracle chooser over EVERY calendar (capDays=min(4,trainDays))');
const table=[];
[0,1,2,3].forEach(nRest=>{
  const pats = nRest===0?[[]]:combos(nRest);
  pats.forEach(rest=>{
    const trainDays = ALL.filter(d=>!rest.includes(d));
    const nTrain=trainDays.length; const cap=Math.min(4,nTrain);
    if(cap<2) return;
    const ch=chooser(trainDays,cap);
    const es=evenSpread(trainDays,cap);
    const pl=d127(ch.best.typeOf,trainDays);
    table.push({rest:rest.join('+')||'(none)', nTrain, cap, clean:ch.anyClean,
      bestColl:ch.best.coll, sar:ch.best.speedsAfterRest, rec:ch.best.recBeforeLong,
      layout: ch.best.days.map(d=>d.toUpperCase()+':'+ch.best.typeOf[d]).join(' '),
      evenColl: es.coll, evenLayout: es.days.map(d=>d.toUpperCase()+':'+es.typeOf[d]).join(' '),
      pull: pl.best?pl.best.pull:null, legs: pl.best?pl.best.legs:null,
      cost: pl.best?pl.best.c:null, legalHinge: pl.legalHinge, longD: pl.longD, eve: pl.eve});
  });
});
[7,6,5,4].forEach(n=>{
  const rows=table.filter(r=>r.nTrain===n);
  const clean=rows.filter(r=>r.clean).length;
  say('\n--- '+n+' training days ('+(7-n)+' rest) : '+rows.length+' calendars, capDays='+rows[0].cap
    +' | collision-free layout EXISTS: '+clean+'/'+rows.length
    +' | even-spread(current chooser) clean: '+rows.filter(r=>r.evenColl===0).length+'/'+rows.length
    +' | legal hinge day: '+rows.filter(r=>r.legalHinge).length+'/'+rows.length);
  rows.forEach(r=>say('  rest='+r.rest.padEnd(11)+' clean='+(r.clean?'Y':'N')+' coll='+r.bestColl
    +' sar='+r.sar+' rec='+r.rec+' | '+r.layout.padEnd(52)
    +' | D127 pull='+String(r.pull).toUpperCase()+' legs='+String(r.legs).toUpperCase()+' cost='+r.cost
    +' | even-spread coll='+r.evenColl+' ['+r.evenLayout+']'));
});
say('\nLOSERS after D125 (no collision-free layout at cap 4, 5-7 train days):');
const losers=table.filter(r=>r.nTrain>=5 && !r.clean);
losers.forEach(r=>say('  '+r.nTrain+'d rest='+r.rest+'  best coll='+r.bestColl+'  '+r.layout));
say('  count: '+losers.length+' / '+table.filter(r=>r.nTrain>=5).length+' calendars at 5-7 training days');
say('LOSERS by ceiling-withheld (4 training days, ruling keeps 3): '
  +table.filter(r=>r.nTrain===4).length+' / '+table.length+' calendars total');

// ════ PART 4 — every goal, actual run-day count today ════════════════════════
// ceiling table hand-transcribed from index.html:4877-4879
const CEIL = {run_5k:4,run_10k:4,run_base:4,run_pace_goal:3,run_mile_time:3,run_15_under10:3,
  run_half:4,run_marathon:4,bike_base:3,bike_ftp:3,bike_cals:3,bike_50:3,bike_century:4,
  swim_base:3,swim_100_time:3,swim_500_time:3,swim_mile:4,swim_tri:4};
say('\n════ PART 4 — cardio-day count actually produced, every goal x training-day count');
const GOALS = {
  run_pace_goal:{id:'run_pace_goal',targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0'},
  run_mile_time:{id:'run_mile_time',targetDist:'1',paceUnit:'mi',targetMins:'6',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0'},
  run_15_under10:{id:'run_15_under10',targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0'},
  run_base:{id:'run_base',baselineDist:'3'},
  run_5k:{id:'run_5k',mileBestMins:'8',mileBestSecs:'0',baselineDist:'3'},
  run_10k:{id:'run_10k',mileBestMins:'8',mileBestSecs:'0',baselineDist:'4'},
  run_half:{id:'run_half',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5'},
  run_marathon:{id:'run_marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'8'},
  bike_base:{id:'bike_base',baselineDist:'10'}, bike_ftp:{id:'bike_ftp',baselineDist:'10'},
  swim_base:{id:'swim_base',baselineDist:'0.5'},
};
const RESTPAT = {7:[[]],6:[['sun']],5:[['sun','wed']],4:[['sun','wed','fri']],3:[['sun','tue','wed','fri']]};
const EXPS=['beginner','intermediate','advanced']; const SEEDS=[76308,11111,4242];
let nBuilds=0;
Object.keys(GOALS).forEach(gid=>{
  const line=[];
  [3,4,5,6,7].forEach(nd=>{
    const obs=new Set(); let ok=0;
    EXPS.forEach(exp=>SEEDS.forEach(seed=>{
      const sport = gid.startsWith('bike')?'bike':gid.startsWith('swim')?'swim':'run';
      const c = cfg({cardioTypes:[sport], cardioGoals:{[sport]:GOALS[gid]},
        restDays:RESTPAT[nd][0], experience:exp, seed});
      let p; try{ p=IA.buildProgram(c); }catch(e){ obs.add('CRASH:'+e.message.slice(0,30)); return; }
      nBuilds++;
      const counts = weekRows(p).map(r=>ALL.filter(d=>{const x=p.weeks[r.w][d];
        return x && !x.rest && x.cardio;}).length);
      obs.add(Math.max(...counts)+'/'+Math.min(...counts)); ok++;
    }));
    line.push(nd+'d:'+[...obs].join(',')); 
  });
  say('  '+gid.padEnd(16)+' ceiling='+CEIL[gid]+'  maxRuns/minRuns per week -> '+line.join('  '));
});
say('  builds: '+nBuilds);

// alias proof: same run-day layout as run_pace_goal?
say('\n  ALIAS check (5 train days, rest sun+wed, seed 76308, intermediate):');
['run_pace_goal','run_mile_time','run_15_under10'].forEach(gid=>{
  const p=IA.buildProgram(cfg({cardioGoals:{run:GOALS[gid]}}));
  const r=weekRows(p)[0];
  say('    '+gid.padEnd(16)+' W1 '+ALL.map(d=>r.days[d]?d.toUpperCase()+':'+(r.days[d].rest?'REST':(r.days[d].run||'norun')):'').join(' ')
    +'  runs='+r.runs+'  weeks='+p.totalWeeks);
});

// ════ PART 5 — what the CURRENT code does with leg lifts on these calendars ══
say('\n════ PART 5 — CURRENT engine: pull/legs vs long-run day+eve, pace goal, all calendars 4-7 days');
let wkTot=0, eveHit=0, longHit=0; const byRest={};
[[],['sun'],['sun','wed']].concat(combos(1)).concat(combos(2)).concat(combos(3)).forEach(rest=>{
  const nTrain=7-rest.length; if(nTrain<4) return;
  EXPS.forEach(exp=>SEEDS.forEach(seed=>{
    let p; try{ p=IA.buildProgram(cfg({restDays:rest.slice(),experience:exp,seed})); }catch(e){ return; }
    weekRows(p).forEach(r=>{
      const longD=ALL.find(d=>r.days[d]&&r.days[d].run==='LSD_LONG'); if(!longD) return;
      const eve=ALL[(ALL.indexOf(longD)+6)%7]; wkTot++;
      const e=r.days[eve], L=r.days[longD];
      const k=(rest.join('+')||'none');
      byRest[k]=byRest[k]||{n:0,eve:0,long:0}; byRest[k].n++;
      if(e&&!e.rest&&(e.role==='pull'||e.role==='legs')){ eveHit++; byRest[k].eve++; }
      if(L&&(L.role==='pull'||L.role==='legs')){ longHit++; byRest[k].long++; }
    });
  }));
});
say('  weeks with a long run: '+wkTot+' | pull/legs on the long-run EVE: '+eveHit
  +' ('+(100*eveHit/wkTot).toFixed(1)+'%) | on the long-run DAY: '+longHit
  +' ('+(100*longHit/wkTot).toFixed(1)+'%)');
Object.keys(byRest).sort().forEach(k=>{const v=byRest[k];
  if(v.eve||v.long) say('    rest='+k.padEnd(12)+' eve '+v.eve+'/'+v.n+'  day '+v.long+'/'+v.n);});
say('  (rest patterns with 0 eve and 0 day hits are omitted; '+Object.keys(byRest).length+' patterns measured)');
