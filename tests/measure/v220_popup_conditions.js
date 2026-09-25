// v212 measure: do the celebration pop-ups fire inside their recorded windows?
// Usage: node tests/measure/v220_popup_conditions.js <artifact.html>
// Oracle: the record (handoff :322 "Context-aware copy pools ({t,when} weekend/morning)",
// intro commit a0effa9 comment "'weekend' = Sat/Sun, 'morning' = before 9am, evaluated at fire time",
// handoff :322 milestone tiers 3/7/14/30 then every 30, season = final scheduled day once, day-after reminder).
// Expected windows come from those words, never from popEligible.
process.env.TZ = 'America/New_York';
const path = require('path'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(ART);
const ctx = IA.ctx, ev = IA.eval;
console.log('artifact', ART, 'ia-version', IA.version);

// ---- 0. provenance: is the pop-up block byte-identical to its V50 introduction? ----
function popBlock(src){ const a = src.indexOf('const POP_POOLS'), b = src.indexOf('function popFire'); return (a<0||b<0)?null:src.slice(a,b); }
let intro=''; try{ intro = cp.execSync('git show a0effa9:iron_asylum_v4RUNNINGV50.html',{cwd:path.join(__dirname,'..','..'),maxBuffer:1<<26}).toString(); }catch(e){}
const bI = popBlock(intro), bA = popBlock(IA.html);
console.log('popBlock(a0effa9 V50) === popBlock(artifact):', bI===bA, '| lens', bI&&bI.length, bA&&bA.length);
if(bI!==bA){ const L1=bI.split('\n'), L2=bA.split('\n'); for(let i=0;i<Math.max(L1.length,L2.length);i++) if(L1[i]!==L2[i]) console.log('  diff line',i,'\n   V50:',L1[i],'\n   ART:',L2[i]); }

// ---- fake clock + retaining DOM ----
const RealDate = Date; let NOW = RealDate.now();
class FakeDate extends RealDate { constructor(...a){ if(a.length===0) super(NOW); else super(...a); } static now(){ return NOW; } }
const els = {}; const doc = ctx.document; const origGet = doc.getElementById;
doc.getElementById = id => (els[id] || (els[id] = origGet(id)));
const text = id => (els[id] ? els[id].textContent : undefined);
// count which tiers popPick is asked for
ctx.popConfetti = function(){}; // cosmetic only; unstubbed it queues 72+ nodes/timers per fire and OOMs the lattice
const pickCalls = {}; const origPick = ctx.popPick;
ctx.popPick = function(tier){ pickCalls[tier]=(pickCalls[tier]||0)+1; return origPick(tier); };

// ---- program ----
const fx = typeof H.fixtures==='function' ? H.fixtures() : H.fixtures;
const cfg = Object.values(fx)[0];
const prog = IA.buildProgram(cfg);
prog.startDate = '2026-08-03';  // a Monday
ctx.Date = FakeDate;
ev('activeProgId="measure"; activeProg=globalThis.__P;'.replace('globalThis.__P','globalThis.__P'));
ctx.__P = prog; ev('activeProg=globalThis.__P; activeProgId="measure";');
const LS = IA.localStorage;
const clearKeys = () => { for(const k of Object.keys(LS._data||{})) {} ; ['ia_comp_','ia_pop_idx_','ia_pop_dismiss_','ia_season_shown_','ia_reminded_','ia_remind_last_','ia_wild_'].forEach(p=>LS.removeItem(p+'measure')); };
const DOW = ['sun','mon','tue','wed','thu','fri','sat'];
const setClock = (y,m,d,h,mi=30) => { NOW = new RealDate(y,m-1,d,h,mi).getTime(); };
const weekOf = dt => { const mon = new RealDate(2026,7,3); return Math.floor((dt - mon)/864e5/7)+1; };

// ---- oracle for the workout pool (record words, hand-coded) ----
const POOLS = ev('POP_POOLS'); const DISMISS = ev('POP_DISMISS');
const intended = { weekend: (dow,h)=> dow===0||dow===6, morning: (dow,h)=> h<9 };
const RECORD_NOTE = { weekend:'handoff :322 + a0effa9 comment: Sat/Sun', morning:'handoff :322 + a0effa9 comment: before 9am' };

// ---- 3. lattice: 7 weekdays x 24 hours x {marking today, marking yesterday} via the real dispatcher ----
const DRAWS = 400;
const seen = {}; // idx -> {today:Set, past:Set}
POOLS.workout.forEach((e,i)=> seen[i]={today:new Set(),past:new Set()});
let fires=0, nonWorkout=0;
for(let dd=0; dd<7; dd++){           // Aug 17 (Mon) .. Aug 23 (Sun), program week 3
  const day = 17+dd;
  for(let h=0; h<24; h++){
    setClock(2026,8,day,h);
    const dt = new RealDate(NOW); const dow = dt.getDay();
    for(const mode of ['today','past']){
      const target = new RealDate(2026,7,day - (mode==='past'?1:0));
      const wk = weekOf(target), dk = DOW[target.getDay()];
      ev('currentWeek='+wk);
      for(let r=0;r<DRAWS;r++){
        LS.removeItem('ia_comp_measure');
        ctx.fireCompletionPopup(wk, dk); fires++;
        if(text('popKicker')!=='WORKOUT COMPLETE'){ nonWorkout++; continue; }
        const msg = text('popMsg');
        const i = POOLS.workout.findIndex(e => (typeof e==='object'?e.t:e)===msg);
        if(i<0) { console.log('UNKNOWN MSG', msg); continue; }
        seen[i][mode].add(dow+':'+h);
      }
    }
  }
}
console.log(`\nLATTICE workout: ${fires} fires (7 dow x 24 h x 2 modes x ${DRAWS}), non-workout kicker ${nonWorkout}`);
const cellsAll = []; for(let d=0;d<7;d++) for(let h=0;h<24;h++) cellsAll.push([d,h]);
const describe = set => { const byDow = [0,1,2,3,4,5,6].map(d=>cellsAll.filter(([x,h])=>x===d&&set.has(d+':'+h)).map(c=>c[1]));
  return byDow.map((hs,d)=> hs.length===0?null: DOW[d]+(hs.length===24?'':'['+hs[0]+'-'+hs[hs.length-1]+'h]')).filter(Boolean).join(' ') || 'NEVER'; };
const IMPLY = /hungover|hangover|brunch|weekend|saturday|sunday|monday|tuesday|wednesday|thursday|friday|morning|asleep|night|tonight|dawn|sunrise|midnight|breakfast|lunch|dinner|evening|afternoon|early|late/i;
const TYPE  = /cardio|run\b|lifting|last set|\bset\b|mirror|flex/i;
const rows = [];
console.log('\nPER-ENTRY TABLE (workout pool; window = cells where the real dispatcher produced it)');
console.log('idx | tag | text[0:40] | intended (record) | actual window marking today | same, marking yesterday | cells today/168 | mismatch | text implies');
POOLS.workout.forEach((e,i)=>{
  const t = typeof e==='object'?e.t:e, tag = typeof e==='object'?e.when:null;
  const want = new Set(cellsAll.filter(([d,h])=> tag? intended[tag](d,h) : true).map(([d,h])=>d+':'+h));
  const eq = (a,b)=> a.size===b.size && [...a].every(x=>b.has(x));
  const mis = !eq(seen[i].today,want) || !eq(seen[i].past,want);
  const imp = (t.match(IMPLY)||[])[0]||''; const typ=(t.match(TYPE)||[])[0]||'';
  rows.push({i,tag,t,mis,imp,typ});
  console.log([i, tag||'-', JSON.stringify(t.slice(0,40)), tag?RECORD_NOTE[tag]:'no recorded intent (untagged)', describe(seen[i].today), describe(seen[i].past), seen[i].today.size, mis?'MISMATCH':'ok', (imp?'time:'+imp:'')+(typ?' type:'+typ:'')].join(' | '));
});
// fire-time vs completed-day: does the completed day ever enter?
let divergent=0; for(const i in seen){ if(seen[i].today.size!==seen[i].past.size) divergent++; }
console.log('entries whose window differs between marking today and marking yesterday:', divergent, '/', POOLS.workout.length);
// frequency per cell for the untagged hungover line and tagged hangover line
function freq(dow,h,N=20000){ setClock(2026,8,16+(dow===0?7:dow),h); LS.removeItem('ia_pop_idx_measure'); const c={}; for(let r=0;r<N;r++){ const m=ctx.popPick('workout'); c[m]=(c[m]||0)+1; } return c; }
const HUNG = POOLS.workout.find(e=>typeof e==='string'&&/hungover/.test(e));
const HANG = POOLS.workout.find(e=>typeof e==='object'&&/Hangover/.test(e.t)).t;
for(const [d,h] of [[6,10],[0,10],[1,10],[1,7],[3,20]]){ const c=freq(d,h); console.log(`freq ${DOW[d]} ${h}:30 n=20000 eligible=${Object.keys(c).length} hungover=${c[HUNG]||0} hangover=${c[HANG]||0} asleep=${Object.entries(c).filter(([k])=>/asleep/.test(k)).map(x=>x[1])[0]||0}`); }
// rotation: consecutive repeats and starvation over a long weekday run
setClock(2026,8,19,12); LS.removeItem('ia_pop_idx_measure'); let prev=null, rep=0; const cnt={};
for(let r=0;r<50000;r++){ const m=ctx.popPick('workout'); if(m===prev) rep++; prev=m; cnt[m]=(cnt[m]||0)+1; }
console.log('rotation Wed 12:30, 50000 draws: back-to-back repeats', rep, '| distinct', Object.keys(cnt).length, '| min', Math.min(...Object.values(cnt)), 'max', Math.max(...Object.values(cnt)));
// rotation memory carried across a context flip: last = a weekend entry, now a weekday
setClock(2026,8,22,10); LS.setItem('ia_pop_idx_measure', JSON.stringify({workout: POOLS.workout.findIndex(e=>typeof e==='object'&&e.when==='weekend')}));
setClock(2026,8,24,12); let okFlip=true; for(let r=0;r<2000;r++){ const m=ctx.popPick('workout'); if(!m) okFlip=false; }
console.log('stale weekend idx in ia_pop_idx_, weekday draw x2000: all returned text =', okFlip);

// ---- text-implication scan over every pool, dismiss and fixed msgs ----
console.log('\nTEXT IMPLIES A CONDITION (all pools + dismiss):');
for(const tier of Object.keys(POOLS)) POOLS[tier].forEach((e,i)=>{ const t=typeof e==='object'?e.t:e, tag=typeof e==='object'?e.when:null; const m=t.match(IMPLY), y=t.match(TYPE); if(m||y) console.log(`  ${tier}[${i}] tag=${tag||'none'} implies=${m?m[0]:''}${y?' type:'+y[0]:''} :: ${t.slice(0,60)}`); });
DISMISS.forEach((t,i)=>{ const m=t.match(IMPLY); if(m) console.log(`  dismiss[${i}] implies=${m[0]} :: ${t}`); });
const tagCounts={}; for(const tier of Object.keys(POOLS)) POOLS[tier].forEach(e=>{ const k=tier+':'+((typeof e==='object'&&e.when)||'none'); tagCounts[k]=(tagCounts[k]||0)+1; });
console.log('tag census', JSON.stringify(tagCounts));

// ---- other tiers: who ever asks popPick for them ----
for(const k in pickCalls) delete pickCalls[k];
// streak trigger sweep
const sched = ctx.scheduledDays(); const final = ctx.finalScheduledDay();
console.log(`\nSTREAK: scheduled days ${sched.length}, final ${final.week}/${final.d}`);
const streakFired=[]; const streakSeen=new Set();
for(let n=1;n<sched.length;n++){
  const x=sched[n-1]; const c={}; for(let k=0;k<n;k++) c['w'+sched[k].week+'_'+sched[k].d]={status:'complete',ts:1};
  LS.setItem('ia_comp_measure', JSON.stringify(c)); LS.removeItem('ia_season_shown_measure');
  NOW = new RealDate(x.date.getTime()).setHours(19,0,0,0);
  ctx.fireCompletionPopup(x.week, x.d);
  if(/STREAK/.test(text('popKicker'))){ streakFired.push(n); streakSeen.add(text('popMsg')); }
}
const expectStreak=[]; for(let n=1;n<sched.length;n++) if(n===3||n===7||n===14||n===30||(n>30&&n%30===0)) expectStreak.push(n);
console.log('streak popup fired at n =', JSON.stringify(streakFired), '| record 3/7/14/30/+30 within range =', JSON.stringify(expectStreak), '| distinct streak lines seen', streakSeen.size, '/', POOLS.streak.length);
// repeat fire at the same milestone (re-mark same day)
{ const x=sched[2]; const c={}; for(let k=0;k<3;k++) c['w'+sched[k].week+'_'+sched[k].d]={status:'complete',ts:1}; LS.setItem('ia_comp_measure',JSON.stringify(c)); NOW=new RealDate(x.date.getTime()).setHours(19); let r=0; for(let k=0;k<5;k++){ ctx.fireCompletionPopup(x.week,x.d); if(/STREAK/.test(text('popKicker'))) r++; } console.log('streak 3 re-fired on 5 repeated completion calls:', r, '/5'); }
// retro mark of an OLD day while streak sits at 3 (clock today, marking 10 days back)
// season
{ const c={}; sched.forEach(x=>c['w'+x.week+'_'+x.d]={status:'complete',ts:1}); LS.setItem('ia_comp_measure',JSON.stringify(c)); LS.removeItem('ia_season_shown_measure');
  NOW=new RealDate(final.date.getTime()).setHours(19); const k=[]; const seasonLines=new Set();
  ctx.fireCompletionPopup(final.week,final.d); k.push(text('popKicker')); seasonLines.add(text('popMsg'));
  ctx.fireCompletionPopup(final.week,final.d); k.push(text('popKicker'));
  ctx.releaseSeasonShown(); ctx.fireCompletionPopup(final.week,final.d); k.push(text('popKicker'));
  // season with every earlier day skipped
  const c2={}; sched.forEach(x=>c2['w'+x.week+'_'+x.d]={status:'skipped',ts:1}); c2['w'+final.week+'_'+final.d]={status:'complete',ts:1}; LS.setItem('ia_comp_measure',JSON.stringify(c2)); LS.removeItem('ia_season_shown_measure');
  ctx.fireCompletionPopup(final.week,final.d); k.push(text('popKicker'));
  // completing the final day logged a day late
  LS.removeItem('ia_season_shown_measure'); NOW=new RealDate(final.date.getTime()+864e5).setHours(9); ctx.fireCompletionPopup(final.week,final.d); k.push(text('popKicker'));
  // completing a NON-final day (penultimate)
  LS.removeItem('ia_season_shown_measure'); const pen=sched[sched.length-2]; ctx.fireCompletionPopup(pen.week,pen.d); k.push(text('popKicker'));
  console.log('SEASON kickers [first, repeat, after release, all-skipped-but-final, final logged next day, penultimate]:', JSON.stringify(k));
  for(let r=0;r<400;r++){ LS.removeItem('ia_season_shown_measure'); ctx.fireCompletionPopup(final.week,final.d); seasonLines.add(text('popMsg')); }
  console.log('distinct season lines over 400 fires:', seasonLines.size, '/', POOLS.season.length); }
// reminder
{ const out=[]; LS.removeItem('ia_comp_measure');
  for(const dayOff of [1,3,8,15]){ // clock = start + dayOff days, fresh reminder state
    ['ia_reminded_','ia_remind_last_'].forEach(p=>LS.removeItem(p+'measure')); els.popSub && (els.popSub.textContent='');
    NOW=new RealDate(2026,7,3+dayOff,8).getTime(); ctx.maybeShowReminder();
    out.push(`day+${dayOff}(${DOW[new RealDate(NOW).getDay()]}): sub=${JSON.stringify(text('popSub'))} msg=${JSON.stringify((text('popMsg')||'').slice(0,30))}`);
  }
  out.forEach(s=>console.log('REMINDER fresh', s));
  // athlete opens the app daily for 10 days and never answers: which day does each nag name?
  ['ia_reminded_','ia_remind_last_'].forEach(p=>LS.removeItem(p+'measure'));
  const seq=[]; for(let d=0; d<10; d++){ NOW=new RealDate(2026,7,17+d,8).getTime(); els.popSub&&(els.popSub.textContent='-'); ctx.maybeShowReminder(); ctx.maybeShowReminder(); seq.push(DOW[new RealDate(NOW).getDay()]+'->'+text('popSub')); }
  console.log('REMINDER daily sequence (2 boots/day):', JSON.stringify(seq));
}
// wildcard
{ NOW=new RealDate(2026,8,22,10).getTime(); LS.removeItem('ia_wild_measure'); try{ ctx.completeWildcard('Measure WC'); IA.flushTimers(); }catch(e){ console.log('wildcard threw', e.message); }
  console.log('WILDCARD kicker', JSON.stringify(text('popKicker')), 'msg', JSON.stringify(text('popMsg'))); }
console.log('popPick tier requests during streak/season/reminder/wildcard section:', JSON.stringify(pickCalls));
// dismiss labels: per-day hold, no repeat of stored, all reachable
{ LS.removeItem('ia_pop_dismiss_measure'); const perDay=[]; let held=true, repeatYesterday=0; const reach=new Set(); let prev=null;
  for(let d=0; d<365; d++){ const base=new RealDate(2026,0,1+d); const labs=new Set(); for(const h of [0,8,13,23]){ NOW=new RealDate(base.getFullYear(),base.getMonth(),base.getDate(),h,59).getTime(); labs.add(ctx.popDismissText()); } if(labs.size!==1) held=false; const l=[...labs][0]; reach.add(l); if(l===prev) repeatYesterday++; prev=l; }
  console.log(`DISMISS 365 days x 4 fires: held all day=${held}, same as yesterday=${repeatYesterday}/364, reachable=${reach.size}/${DISMISS.length}`); }
// reach of untagged tiers through the selector itself (independent of whether a caller asks)
for(const tier of ['streak','season','reminder']){ const got=new Set(); for(let r=0;r<3000;r++) got.add(origPick(tier)); console.log(`selector reach ${tier}: ${got.size}/${POOLS[tier].length} over 3000 draws`); }
// callers that ask popFire for a tier WITHOUT a fixed msg (only those reach popPick)
{ const js=IA.js; const re=/popFire\('(\w+)',\{([\s\S]{0,260})/g; let m; while((m=re.exec(js))){ const line=js.slice(0,m.index).split('\n').length; console.log(`popFire caller tier=${m[1]} jsline=${line} fixedMsg=${/\bmsg\s*:/.test(m[2].split('});')[0])}`); } }
// V207 working tree: is the whole pop-up region byte-identical?
{ const fs=require('fs'); const wt=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8'); const reg=src=>{const a=src.indexOf('/* ===== REINFORCEMENT POPUPS'),b=src.indexOf('UPDATE CHECK — detects');return src.slice(a,b);};
  const v=(wt.match(/ia-version" content="(\d+)"/)||[])[1]; console.log(`working-tree index.html ia-version ${v}: pop region identical to artifact = ${reg(wt)===reg(IA.html)} (len ${reg(wt).length})`);
  const wc=s=>{const a=s.indexOf('function fireWildcardPopup'),b=s.indexOf('function closeRandom');return s.slice(a,b);}; console.log('  wildcard popup region identical =', wc(wt)===wc(IA.html)); }
console.log('\nDONE');
