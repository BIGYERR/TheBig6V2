// v205_d125_chooser.js — measure pass for D125 (amended), the chooser half.
// Extracts the chooser by source surgery and answers: the 64-calendar table at capDays=4,
// the pin-vs-relaxed delta, Mario's layout, and whether capDays=3 output MOVES today.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const NEW = process.argv[2] || path.join(ROOT, 'index.html');
const OLD = process.argv[3] || '/tmp/base_V205_slice2.html';

function grab(src, name){
  const sig = 'function ' + name + '(';
  const i = src.indexOf(sig);
  if(i < 0) throw new Error('not found: ' + name);
  let j = src.indexOf('{', i), d = 0, k = j, mode = null;
  for(; k < src.length; k++){
    const c = src[k], n = src[k+1];
    if(mode === 'line'){ if(c === '\n') mode = null; continue; }
    if(mode === 'block'){ if(c === '*' && n === '/'){ mode = null; k++; } continue; }
    if(mode){ if(c === '\\'){ k++; continue; } if(c === mode) mode = null; continue; }
    if(c === '/' && n === '/'){ mode = 'line'; k++; continue; }
    if(c === '/' && n === '*'){ mode = 'block'; k++; continue; }
    if(c === '"' || c === "'" || c === '`'){ mode = c; continue; }
    if(c === '{') d++;
    else if(c === '}'){ d--; if(d === 0) return src.slice(i, k+1); }
  }
  throw new Error('unbalanced: ' + name);
}
function chooserOf(file){
  const src = fs.readFileSync(file, 'utf8');
  const parts = ['const ALL_DAYS_ORDER=' + JSON.stringify(['sun','mon','tue','wed','thu','fri','sat']) + ';'];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n => {
    try { parts.push(grab(src, n)); } catch(e){ parts.push('/* missing ' + n + ' */'); }
  });
  const ctx = { out: null };
  vm.runInNewContext(parts.join('\n') + '\nout = {c:_nrcSpacedRunDays, gs:typeof getSessionTypes==="function"?getSessionTypes:null, gn:getNRCSessionTypes};', ctx);
  return ctx.out;
}
const NEWC = chooserOf(NEW), OLDC = chooserOf(OLD);

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const pos = d => DAYS.indexOf(d);
const circ = (a,b) => { const r = Math.abs(pos(a)-pos(b)); return Math.min(r, 7-r); };
const prevDay = d => DAYS[(pos(d)+6)%7];
function combos(arr,k){ if(k===0) return [[]]; if(arr.length<k) return []; const [h,...t]=arr; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }

// ── INDEPENDENT ORACLE: exhaustive, written here, no engine code ──────────────
function space(train, capDays, types, T, pinned){
  const inTrain = new Set(train), last = train[train.length-1], out = [];
  combos(train, capDays).forEach(days => {
    if(pinned && days[days.length-1] !== last) return;
    perms(types).forEach(p => {
      const typeOf = {}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const longDay = days.find(d=>typeOf[d]===T.long);
      // `pinned` is the PRE-D125 control: both halves of the old long-run pin, the subset
      // rule above and this permutation rule. D125 drops both for the pace family.
      if(pinned && longDay && longDay !== days[days.length-1]) return;
      const HARD = [T.s1,T.s2,T.long];
      const hd = days.filter(d=>HARD.indexOf(typeOf[d])>=0);
      let coll=0; for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      const sp = days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
      const sar = sp.filter(d=>!inTrain.has(prevDay(d))).length;
      const rbl = longDay && days.some(d=>typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay)) ? 1 : 0;
      const ll = (!longDay || longDay===last) ? 1 : 0;
      const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
      const can = (s1&&s2&&pos(s1)<pos(s2))?1:0;
      out.push({days, typeOf, rank:[-coll, ll, sar, rbl, can], coll, sar, rbl, ll});
    });
  });
  return out;
}
const cmp = (a,b)=>{ for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]-b[i]; } return 0; };
const bestRank = list => list.reduce((m,c)=>cmp(c.rank,m)>0?c.rank:m, list[0].rank);

const TP = {long:'lsd_long', rec:'lsd_easy', s1:'int', s2:'chi'};
const TN = {long:'nrc_long', rec:'nrc_recovery', s1:'nrc_speed1', s2:'nrc_speed2'};
const layout = (train,pick) => pick.idxs.map(i=>train[i].toUpperCase()+':'+pick.typeOf[train[i]]).join(' ');

// ── Q1/Q2: the 64-calendar table at capDays=4, relaxed vs pinned ─────────────
const tally = {}, pinTally = {}, rescued = [];
let optBad = 0, lexBad = 0;
[0,1,2,3].forEach(nRest => combos(DAYS,nRest).forEach(rest => {
  const train = DAYS.filter(d=>rest.indexOf(d)<0); const n = train.length;
  if(n < 4) return;
  const types = NEWC.gs(4, true, false, false);
  const pick = NEWC.c(train, 4, 'run_pace_goal', true);
  const all = space(train, 4, types, TP, false);
  const pinned = space(train, 4, types, TP, true);
  // engine optimality against the oracle's own exhaustive space
  const got = all.find(c => c.days.join()===pick.idxs.map(i=>train[i]).join()
                          && c.days.every(d=>c.typeOf[d]===pick.typeOf[d]));
  if(!got){ optBad++; console.log('  ORPHAN layout not in oracle space:', rest.join('+'), layout(train,pick)); }
  else if(cmp(got.rank, bestRank(all)) !== 0){ lexBad++; console.log('  NOT LEX-OPTIMAL:', rest.join('+'), got.rank.join(','), 'best', bestRank(all).join(',')); }
  const rc = Math.min(...all.map(c=>c.coll)), pc = Math.min(...pinned.map(c=>c.coll));
  tally[n] = tally[n] || {n:0, zero:0}; tally[n].n++; if(rc===0) tally[n].zero++;
  pinTally[n] = pinTally[n] || {n:0, zero:0}; pinTally[n].n++; if(pc===0) pinTally[n].zero++;
  if(rc===0 && pc>0) rescued.push((rest.join('+')||'none') + ' [' + n + '-day]');
}));
console.log('=== Q1 capDays=4, relaxed (D125 objective): coll=0 by training days ===');
let z=0, t=0; Object.keys(tally).sort().forEach(k=>{ z+=tally[k].zero; t+=tally[k].n; console.log('  ' + k + ' days: ' + tally[k].zero + '/' + tally[k].n); });
console.log('  TOTAL ' + z + '/' + t);
console.log('=== Q2 pinned control ===');
let pz=0, pt=0; Object.keys(pinTally).sort().forEach(k=>{ pz+=pinTally[k].zero; pt+=pinTally[k].n; console.log('  ' + k + ' days: ' + pinTally[k].zero + '/' + pinTally[k].n); });
console.log('  TOTAL ' + pz + '/' + pt + ' | rescued by relaxing the pin: ' + rescued.length);
rescued.forEach(r=>console.log('    rest ' + r));
console.log('  engine-vs-oracle: orphan ' + optBad + ', not-lex-optimal ' + lexBad);
// losers
const losers = [];
[3].forEach(nRest => combos(DAYS,nRest).forEach(rest => {
  const train = DAYS.filter(d=>rest.indexOf(d)<0);
  const all = space(train, 4, NEWC.gs(4,true,false,false), TP, false);
  const rc = Math.min(...all.map(c=>c.coll));
  if(rc>0) losers.push(rest.join('+')+'(coll='+rc+')');
}));
console.log('  four-day losers (' + losers.length + '): ' + losers.join(' '));

// ── Q3: Mario ────────────────────────────────────────────────────────────────
{
  const train = DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const p4 = NEWC.c(train, 4, 'run_pace_goal', true);
  const all = space(train,4,NEWC.gs(4,true,false,false),TP,false);
  const g = all.find(c=>c.days.join()===p4.idxs.map(i=>train[i]).join() && c.days.every(d=>c.typeOf[d]===p4.typeOf[d]));
  console.log('=== Q3 Mario (rest sun+wed) capDays=4 ===');
  console.log('  ' + layout(train,p4) + '  | rank[-coll,longLast,speedAfterRest,recPadsLong,canon]=' + g.rank.join(','));
  const p3 = NEWC.c(train, 3, 'run_pace_goal', true);
  console.log('  capDays=3 (today\'s ceiling): ' + layout(train,p3));
}

// ── Q4: does capDays=3 MOVE? new chooser vs old even-spread ──────────────────
console.log('=== Q4 capDays=3 movement (today\'s ceiling) ===');
let moved=0, tot=0, dayMoved=0; const ex=[];
[0,1,2,3].forEach(nRest => combos(DAYS,nRest).forEach(rest => {
  const train = DAYS.filter(d=>rest.indexOf(d)<0); const n = train.length;
  if(n <= 3) return;  // capDays<nCardio is the routing gate
  tot++;
  const types = NEWC.gs(3, true, false, false);
  const oldDays = []; for(let k=0;k<3;k++){ const i = Math.round(k*(n-1)/2); if(oldDays.indexOf(i)<0) oldDays.push(i); }
  const oldLay = oldDays.map((i,s)=>train[i].toUpperCase()+':'+(s===oldDays.length-1?'lsd_long':types[s])).join(' ');
  const pick = NEWC.c(train, 3, 'run_pace_goal', true);
  const newLay = layout(train, pick);
  const dm = oldDays.join() !== pick.idxs.join();
  if(dm) dayMoved++;
  if(oldLay !== newLay){ moved++; if(ex.length<40) ex.push('  rest ' + (rest.join('+')||'none') + ' [' + n + 'd]  OLD ' + oldLay + '   NEW ' + newLay + (dm?'   (days moved)':'   (types only)')); }
}));
console.log('  layouts moved ' + moved + '/' + tot + ' calendars; day-SET moved ' + dayMoved + '/' + tot);
ex.forEach(e=>console.log(e));

// ── Q5: NRC invariance, old chooser vs new, every calendar/capDays/goal ──────
let nrcDiff = 0, nrcTot = 0, pinBroken = 0;
['run_5k','run_10k','run_half','run_marathon'].forEach(g => {
  [0,1,2,3,4,5].forEach(nRest => combos(DAYS,nRest).forEach(rest => {
    const train = DAYS.filter(d=>rest.indexOf(d)<0); const n = train.length;
    for(let cap=2; cap<n; cap++){
      const a = OLDC.c(train, cap, g), b = NEWC.c(train, cap, g, false);
      nrcTot++;
      if(JSON.stringify(a.idxs)!==JSON.stringify(b.idxs) || JSON.stringify(a.typeOf)!==JSON.stringify(b.typeOf)){
        nrcDiff++; if(nrcDiff<5) console.log('  NRC DIFF', g, rest.join('+'), cap, JSON.stringify(a.typeOf), JSON.stringify(b.typeOf));
      }
      const longDay = Object.keys(b.typeOf).find(d=>b.typeOf[d]==='nrc_long');
      if(longDay && longDay !== train[n-1]) pinBroken++;
    }
  }));
});
console.log('=== Q5 NRC ===');
console.log('  old-vs-new identical on ' + (nrcTot-nrcDiff) + '/' + nrcTot + ' (goal x calendar x capDays); hard pin broken ' + pinBroken + ' times');
