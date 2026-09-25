// g220_d175_popcond.js — GATE for D175 (P-POPCOND): the pop-up judges the day the athlete trained, not the minute he tapped.
//
//   node tests/gates/g220_d175_popcond.js [candidate]
//
// THE RULING THIS DEFENDS: tests/measure/v220_rulings/p_popcond_ruling.md (1a, 1b, 1c, 2a, 3, 5, 6, RE-BASELINE).
//   1c  tags: [1] weekend, [3] morning, [8] weekend + cardio, [15] weekend, [25] lift, [26] lift. 27 lines, 21 untagged.
//   2a  weekend = the TRAINED day (dayDateFor(week,dayKey)) is Sat/Sun; morning = hour < 9 AND the trained day is today.
//       cardio = !!day.cardio; lift = dayCode's liftSections test (!s.core && !s.hip && items.length) minus sections
//       whose label matches /mobility|taper/i. Threaded fireCompletionPopup(w,d) -> fireWorkoutPopup -> popFire -> popPick.
//   1b  reminder: _gap < 7 draws a reminder-pool line, sub = day identity + ". The week ahead stays as written.";
//       _gap >= 7 keeps the fixed re-entry message whole with the old sub.
//   SESSION CALL (recorded at build): no resolvable trained day (no week/dayKey, startDate null, no day object) makes
//       every TAGGED entry ineligible; untagged stay eligible.
//   3   unchanged: pool order and count 27/5/5/9, rotation (last-index exclusion), streak/season pools untagged,
//       the Wildcard passes its own msg.
//
// ORACLE. Hand-typed, never asked of the engine. HAND_TAGS is the 1c tag table; SHAPE is the 1c lens verdict per day
// shape; DATES/PAST are a hand calendar (2026-09-14 is a Monday); COUNT_1C is the 1c eligible-size table typed
// literally, and row E1-0 proves the hand rule reproduces it before any cell is graded. No row calls popEligible or
// popContext for an expectation. The real HALF_MANNY days are classified by the ruling's lens text re-typed here (the
// same classifier measure used in tests/measure/v220_popcond_census.js), anchored by the ruling's census 14/45/9/2.
//
// OBSERVATION. The draw path itself: popPick(tier,week,dayKey) (E1, E4, E5) and fireCompletionPopup(week,dayKey) /
// maybeShowReminder() read back from a retaining DOM stub (#popMsg, #popSub, #popKicker). The eligible set is read
// EXACTLY, not sampled: Math.random is pinned to (k+0.5)/64 for k = 0..63 with the rotation memory cleared before each
// draw, so choices[floor(r*len)] visits every eligible index (len <= 27 < 64). Rotation rows use a seeded LCG.
// The clock is pinned inside the VM (a Date wrapper whose no-arg form reads __g220now); all dates are local.
//
// VERSION PREDICATE (standing rulings 2 and 4). D175 ships at 220. Below 220 every row is REFUSED and FAILS by name.
// ROWS
//   S0  the host calendar agrees with the hand calendar the oracle is typed on.
//   S1  HALF_MANNY builds with a startDate; the ruling's census by lens is 14/45/9/2; the long run is a Saturday
//       carrying "Post-run mobility".
//   E1-0 the hand rule reproduces the 1c count table in every today cell; past cells equal the >=9h column.
//   E1  hand-built day shapes, {wed, sat, sun} x {today, past} x {07h, 10h} x {liftOnly, runLift, runMob, runOnly}:
//       popPick's eligible set == the hand set.
//   E1r the same on a real HALF_MANNY day of each shape x {today, past} x {07h, 10h}.
//   E2  threading through fireCompletionPopup: a run-only weekday shows no tagged line; a Monday mark of Saturday's
//       long run can draw the weekend lines [1] [8] [15]; a lift-only Saturday never draws [8].
//   E3  reminder: gap 3 is a reminder-pool line + doctrine sub, rotating; gap 8 is the fixed re-entry text + bare sub.
//   E4  no-day edge: popPick with no day, no startDate, no day object: untagged only, at a Saturday 07:00 tap.
//   E5  unchanged: 27/5/5/9, tagged lines at their indices, other pools untagged, last-index exclusion, Wildcard msg.
'use strict';
const path = require('path');
const { load, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const ERA = 220;
const cl = o => JSON.parse(JSON.stringify(o));
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
// 1c tag table (workout pool index -> tag). The other 21 lines are untagged.
const HAND_TAGS = { 1:{ when:'weekend' }, 3:{ when:'morning' }, 8:{ when:'weekend', type:'cardio' },
                    15:{ when:'weekend' }, 25:{ type:'lift' }, 26:{ type:'lift' } };
const TAGGED = [1, 3, 8, 15, 25, 26];
const UNTAGGED = [...Array(27).keys()].filter(i => !TAGGED.includes(i));
// Text that pins each tagged index to its line (lower-cased; untouched by the D174 copy edits).
const TAG_ANCHOR = { 1:'hangover said stay down', 3:"half the city's still asleep", 8:'talk all the shit you want at brunch',
                     15:"showed up hungover, didn't die", 25:'dead ugly on that last set', 26:'ten minutes lifting' };
// 1c lens verdict per day shape.
const SHAPE = { liftOnly:{ cardio:false, lift:true }, runLift:{ cardio:true, lift:true },
                runMob:{ cardio:true, lift:false }, runOnly:{ cardio:true, lift:false } };
const SHAPES = Object.keys(SHAPE);
// 1c eligible-size table, typed literally: weekday>=9h, weekday<9h, weekend>=9h, weekend<9h (trained day today).
const COUNT_1C = { liftOnly:[23,24,25,26], runLift:[23,24,26,27], runMob:[21,22,24,25], runOnly:[21,22,24,25] };
function handElig(i, cell){
  const t = HAND_TAGS[i]; if(!t) return true;
  if(!cell.known) return false;
  if(t.when === 'weekend' && !cell.weekend) return false;
  if(t.when === 'morning' && !(cell.hour < 9 && cell.today)) return false;
  if(t.type === 'cardio' && !cell.cardio) return false;
  if(t.type === 'lift' && !cell.lift) return false;
  return true;
}
const handSet = cell => [...Array(27).keys()].filter(i => handElig(i, cell));

// Hand calendar. 2026-09-14 is a Monday. Week k (1..4) holds one shape on wed, sat and sun; week 5 sat is the final day.
const HAND_WEEK = { liftOnly:1, runLift:2, runMob:3, runOnly:4 };
const DATES = { 1:{ wed:[2026,9,16], sat:[2026,9,19], sun:[2026,9,20] },  2:{ wed:[2026,9,23], sat:[2026,9,26], sun:[2026,9,27] },
                3:{ wed:[2026,9,30], sat:[2026,10,3], sun:[2026,10,4] },  4:{ wed:[2026,10,7], sat:[2026,10,10], sun:[2026,10,11] } };
// Past tap: wed + 3 = a Saturday, sat + 2 = a Monday, sun + 1 = a Monday (a tap-clock weekend points the wrong way both ways).
const PAST  = { 1:{ wed:[2026,9,19], sat:[2026,9,21], sun:[2026,9,21] },  2:{ wed:[2026,9,26], sat:[2026,9,28], sun:[2026,9,28] },
                3:{ wed:[2026,10,3], sat:[2026,10,5], sun:[2026,10,5] },  4:{ wed:[2026,10,10], sat:[2026,10,12], sun:[2026,10,12] } };
const WEEKEND_KEY = { wed:false, sat:true, sun:true };
const DOW = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 }, OFF = { mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6 };
const PID = 'g220pc';

// Hand-built day shapes (the four 1c classes; runMob carries D18's tier-A "Post-run mobility" plus core, hip and an
// empty lift section, so every clause of the lens is exercised; runLift is a race-week Primer, which IS lifting).
const CORE = { label:'Core', core:true, coreHeader:'Core', items:[{ name:'Plank', rx:'3×30s' }] };
const HIP = { label:'Hip', hip:true, items:[{ name:'Clamshell', rx:'2×15' }] };
const RUN = sub => ({ type:'run', subtype:sub, label:'Run' });
const DAY = {
  liftOnly: { title:'Upper Strength', sections:[{ label:'Main', items:[{ name:'Bench press', rx:'4×5' }] }, CORE] },
  runLift:  { title:'Easy Run + Primer', cardio:RUN('easy'), sections:[{ label:'Race-week Primer', items:[{ name:'Goblet squat', rx:'2×8' }] }, CORE] },
  runMob:   { title:'Long Run', cardio:RUN('long'), sections:[{ label:'Post-run mobility', items:[{ name:'Couch stretch', rx:'2×45s' }] }, CORE, HIP, { label:'Main', items:[] }] },
  runOnly:  { title:'Shakeout', cardio:RUN('shakeout'), sections:[] } };
function handProg(){
  const weeks = {};
  for(let w = 1; w <= 5; w++){ weeks[w] = {}; DAYS.forEach(d => { weeks[w][d] = { rest:true, title:'Rest', sections:[] }; }); }
  SHAPES.forEach(sh => ['wed','sat','sun'].forEach(d => { weeks[HAND_WEEK[sh]][d] = cl(DAY[sh]); }));
  weeks[5].sat = cl(DAY.runOnly); weeks[5].sat.title = 'Final Run';
  return { id:PID, name:'G220', startDate:'2026-09-14', totalWeeks:5, weeks };
}
// Reminder program: every day an Easy Run + Lower, W1 Mon 2026-09-14; clock Thu 2026-10-01 (W3 thu).
const REM_TITLE = 'Easy Run + Lower';
function remProg(){
  const weeks = {};
  for(let w = 1; w <= 4; w++){ weeks[w] = {}; DAYS.forEach(d => { weeks[w][d] = cl(DAY.runLift); weeks[w][d].title = REM_TITLE; }); }
  return { id:PID, name:'G220R', startDate:'2026-09-14', totalWeeks:4, weeks };
}
const comp = keys => { const c = {}; keys.forEach(k => { c[k] = { title:REM_TITLE, ts:1, status:'complete' }; }); return c; };
const WK = ['mon','tue','wed','thu','fri','sat','sun'];
// gap 3: W1 and W2 complete; W3 mon/tue/wed unresolved.  gap 8: W1 and W2 mon/tue complete; W2 wed..sun + W3 mon..wed unresolved.
const COMP_GAP3 = comp(WK.map(d => 'w1_' + d).concat(WK.map(d => 'w2_' + d)));
const COMP_GAP8 = comp(WK.map(d => 'w1_' + d).concat(['w2_mon', 'w2_tue']));
const REM_SUB = 'Wednesday, Wk 3 · ' + REM_TITLE;
const REM_DOCTRINE = '. The week ahead stays as written.';
const REM_FIXED = 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.';
const REM_ANCHOR = ['you ghosted a session', 'left a day hanging unmarked', 'unfinished business sitting on your calendar',
                    "that day didn't log itself", 'you disappeared on a workout'];
const WILD_MSG = 'You showed up. That is the whole game.';

// Gate-side lens, re-typed from the ruling's 1c text (measure's census classifier), for the real HALF_MANNY days.
function classify(day){
  const C = !!day.cardio, secs = day.sections || [];
  const raw = secs.filter(s => !s.core && !s.hip && (s.items || []).length);
  const lift = raw.filter(s => !/mobility|taper/i.test(s.label || ''));
  if(C && lift.length) return 'runLift'; if(C && raw.length) return 'runMob'; if(C) return 'runOnly';
  if(lift.length) return 'liftOnly'; return 'UNPLACEABLE';
}
function monOf(iso){ const p = iso.split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2]); const w = d.getDay();
  d.setDate(d.getDate() - (w === 0 ? 6 : w - 1)); return d; }
const tup = d => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
function addDays(t, n){ const d = new Date(t[0], t[1] - 1, t[2]); d.setDate(d.getDate() + n); return tup(d); }

// ── VM plumbing ──────────────────────────────────────────────────────────────
const DOM_STUB = "__g220mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',className:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g220els={};document.getElementById=function(id){if(!__g220els[id])__g220els[id]=__g220mk(id);return __g220els[id];};";
// Pinned clock: new Date() / Date.now() read __g220now; every other form is the real Date. instanceof still holds.
const CLOCK = "(function(){ if(globalThis.__g220RD) return; var RD=Date; globalThis.__g220RD=RD; globalThis.__g220now=RD.now();"
  + "function FD(){ if(!(this instanceof FD)) return new RD(globalThis.__g220now).toString();"
  + " if(!arguments.length) return new RD(globalThis.__g220now);"
  + " return new (Function.prototype.bind.apply(RD,[null].concat([].slice.call(arguments))))(); }"
  + "FD.prototype=RD.prototype; FD.now=function(){return globalThis.__g220now;}; FD.parse=RD.parse; FD.UTC=RD.UTC;"
  + "globalThis.Date=FD; })();";
// Math.random: __g220fix when set (exact sweep), else a seeded Park-Miller LCG. A fresh Math object, so the host is untouched.
const RNG = "(function(){ if(globalThis.__g220M) return; var M=Object.create(Math); globalThis.__g220fix=null; globalThis.__g220s=76308;"
  + "M.random=function(){ if(globalThis.__g220fix!==null) return globalThis.__g220fix;"
  + " globalThis.__g220s=(globalThis.__g220s*16807)%2147483647; return globalThis.__g220s/2147483647; };"
  + "globalThis.__g220M=M; globalThis.Math=M; })();";

let IA = null, LS = null, WTXT = null;
const MEMKEY = 'ia_pop_idx_' + PID;
const setNow = (t, h) => IA.eval('globalThis.__g220now=new __g220RD(' + t[0] + ',' + (t[1] - 1) + ',' + t[2] + ',' + h + ',0,0).getTime()');
function install(prog, c){
  LS.clear();
  IA.eval("activeProgId='" + PID + "'");
  IA.eval('activeProg=' + JSON.stringify(prog));
  if(c) LS.setItem('ia_comp_' + PID, JSON.stringify(c));
  IA.eval(DOM_STUB);
}
const el = id => IA.eval('__g220els.' + id + ' ? __g220els.' + id + '.textContent : null');
const idxOf = t => WTXT.indexOf(t);
// Exact eligible set: 64 draws at r = (k+0.5)/64 with the rotation memory reset before each (or preset to `mem`).
function sweep(drawExpr, mem, readMsg){
  const got = new Set();
  for(let k = 0; k < 64; k++){
    if(mem) LS.setItem(MEMKEY, JSON.stringify(mem)); else LS.removeItem(MEMKEY);
    IA.eval('globalThis.__g220fix=' + ((k + 0.5) / 64));
    const r = IA.eval(drawExpr);
    got.add(readMsg ? el('popMsg') : r);
    IA.flushTimers();
  }
  IA.eval('globalThis.__g220fix=null');
  return [...got].map(idxOf).sort((a, b) => a - b);
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function diff(got, exp){ const plus = got.filter(i => !exp.includes(i)), minus = exp.filter(i => !got.includes(i));
  return got.length + ' lines' + (plus.length ? ' +[' + plus.join(',') + ']' : '') + (minus.length ? ' -[' + minus.join(',') + ']' : ''); }

// ── ROWS (declared statically so a refused era fails every one by name) ──────
const ROWS = [];
const row = (id, fn) => ROWS.push({ id, fn });

row('S0 host calendar agrees with the hand calendar (2026-09-14 Mon; wed/sat/sun and past taps as typed)', () => {
  const bad = [];
  if(new Date(2026, 8, 14).getDay() !== 1) bad.push('2026-09-14');
  Object.keys(DATES).forEach(w => Object.keys(DATES[w]).forEach(d => {
    const t = DATES[w][d], p = PAST[w][d];
    if(new Date(t[0], t[1] - 1, t[2]).getDay() !== DOW[d]) bad.push('W' + w + ' ' + d);
    const pd = new Date(p[0], p[1] - 1, p[2]).getDay();
    if(pd !== (d === 'wed' ? 6 : 1)) bad.push('past W' + w + ' ' + d); }));
  if(new Date(2026, 8, 30).getDay() !== 3 || new Date(2026, 9, 1).getDay() !== 4) bad.push('reminder dates');
  return [!bad.length, bad.join(' ')];
});

let REAL = null;   // { prog, pick:{shape:{w,d,date}} }
row('S1 HALF_MANNY: one Race Day by subtype, W14 sun, anchoring a Monday start; census by lens 14/45/9/2 of 70; the long run is a Saturday with Post-run mobility', () => {
  const P = REAL.prog, n = { liftOnly:0, runLift:0, runMob:0, runOnly:0, UNPLACEABLE:0 };
  Object.keys(P.weeks).forEach(w => DAYS.forEach(d => { const y = P.weeks[w][d]; if(y && !y.rest) n[classify(y)]++; }));
  const m = REAL.pick.runMob, lr = m && P.weeks[m.w][m.d];
  const sd = P.startDate ? P.startDate.split('-').map(Number) : null;
  const c = !!sd && new Date(sd[0], sd[1] - 1, sd[2]).getDay() === 1 && REAL.race && REAL.race.w === 14 && REAL.race.d === 'sun' && n.liftOnly === 14 && n.runLift === 45 && n.runMob === 9 && n.runOnly === 2 && n.UNPLACEABLE === 0
    && SHAPES.every(s => REAL.pick[s]) && m.d === 'sat' && (lr.sections || []).some(s => s.label === 'Post-run mobility');
  return [c, 'race ' + JSON.stringify(REAL.race) + ' built startDate ' + REAL.built + ' anchored ' + P.startDate + ' ' + JSON.stringify(n) + ' longrun ' + (m ? 'W' + m.w + ' ' + m.d : 'none')];
});

row('E1-0 the hand rule reproduces the 1c count table (today cells) and past cells equal the >=9h column', () => {
  const bad = [];
  SHAPES.forEach(sh => [false, true].forEach(we => [10, 7].forEach(h => [true, false].forEach(today => {
    const col = (we ? 2 : 0) + (today && h < 9 ? 1 : 0);
    const n = handSet(Object.assign({ known:true, weekend:we, hour:h, today }, SHAPE[sh])).length;
    if(n !== COUNT_1C[sh][col]) bad.push(sh + (we ? ' we' : ' wd') + ' ' + h + 'h ' + (today ? 'today' : 'past') + ' ' + n); }))));
  return [!bad.length, bad.join('; ')];
});

// E1 hand cells
SHAPES.forEach(sh => ['wed','sat','sun'].forEach(d => [['today', DATES], ['past', PAST]].forEach(([when, TAB]) => [7, 10].forEach(h => {
  const w = HAND_WEEK[sh];
  const cell = Object.assign({ known:true, weekend:WEEKEND_KEY[d], hour:h, today:when === 'today' }, SHAPE[sh]);
  const exp = handSet(cell);
  const lbl = 'E1 ' + sh + ' ' + d + ' ' + when + ' ' + String(h).padStart(2, '0') + 'h: popPick eligible == hand (' + exp.length + ' lines)';
  row(lbl, () => {
    install(handProg()); setNow(TAB[w][d], h);
    const got = sweep("popPick('workout'," + w + ",'" + d + "')");
    return [same(got, exp), diff(got, exp)];
  });
}))));

// E1r real HALF_MANNY days
SHAPES.forEach(sh => ['today', 'past'].forEach(when => [7, 10].forEach(h => {
  row('E1r HALF_MANNY ' + sh + ' ' + when + ' ' + String(h).padStart(2, '0') + 'h: popPick eligible == hand', () => {
    const p = REAL.pick[sh];
    const cell = Object.assign({ known:true, weekend:(p.d === 'sat' || p.d === 'sun'), hour:h, today:when === 'today' }, SHAPE[sh]);
    const exp = handSet(cell);
    install(REAL.prog); setNow(when === 'today' ? p.date : addDays(p.date, 2), h);
    const got = sweep("popPick('workout'," + p.w + ",'" + p.d + "')");
    return [same(got, exp), 'W' + p.w + ' ' + p.d + ' ' + diff(got, exp)];
  });
})));

// E2 threading through the completion dispatcher
row('E2a fireCompletionPopup, run-only weekday (W4 wed) today 10h: no tagged line over 64 draws; exactly the 21 untagged', () => {
  install(handProg()); setNow(DATES[4].wed, 10);
  const got = sweep("fireCompletionPopup(4,'wed')", null, true);
  const kick = el('popKicker');
  return [same(got, UNTAGGED) && kick === 'WORKOUT COMPLETE', kick + ' ' + diff(got, UNTAGGED)];
});
row('E2b fireCompletionPopup, Monday mark of HALF_MANNY Saturday long run, 10h: draws [1] [8] [15], never [3] [25] [26]', () => {
  const p = REAL.pick.runMob; install(REAL.prog); setNow(addDays(p.date, 2), 10);
  const got = sweep("fireCompletionPopup(" + p.w + ",'" + p.d + "')", null, true);
  const exp = handSet(Object.assign({ known:true, weekend:true, hour:10, today:false }, SHAPE.runMob));
  const c = [1, 8, 15].every(i => got.includes(i)) && ![3, 25, 26].some(i => got.includes(i)) && same(got, exp);
  return [c, 'W' + p.w + ' ' + p.d + ' ' + diff(got, exp)];
});
row('E2c fireCompletionPopup, lift-only Saturday (W1 sat) today 10h: never [8]; draws [1] [15] [25] [26]', () => {
  install(handProg()); setNow(DATES[1].sat, 10);
  const got = sweep("fireCompletionPopup(1,'sat')", null, true);
  const exp = handSet(Object.assign({ known:true, weekend:true, hour:10, today:true }, SHAPE.liftOnly));
  const c = !got.includes(8) && [1, 15, 25, 26].every(i => got.includes(i)) && same(got, exp);
  return [c, diff(got, exp)];
});

// E3 reminder
function reminder(c){ install(remProg(), c); setNow([2026, 10, 1], 10); IA.eval('maybeShowReminder()'); IA.flushTimers();
  return { msg:el('popMsg'), sub:el('popSub'), kick:el('popKicker') }; }
row('E3a reminder gap 3: msg is a reminder-pool line; sub is the day identity + ". The week ahead stays as written."', () => {
  const r = reminder(COMP_GAP3), pool = JSON.parse(IA.eval('JSON.stringify(POP_POOLS.reminder)'));
  const hits = REM_ANCHOR.filter(a => String(r.msg).toLowerCase().includes(a)).length;
  const c = hits === 1 && pool.includes(r.msg) && r.sub === REM_SUB + REM_DOCTRINE && String(r.sub).endsWith(REM_DOCTRINE);
  return [c, JSON.stringify(r)];
});
row('E3b reminder gap 3 rotates: 12 fires, no line twice in a row, 2+ distinct, ia_pop_idx_.reminder written', () => {
  install(remProg(), COMP_GAP3); setNow([2026, 10, 1], 10); IA.eval('globalThis.__g220s=76308');
  const seen = [];
  for(let k = 0; k < 12; k++){
    LS.removeItem('ia_remind_last_' + PID); LS.removeItem('ia_reminded_' + PID); IA.eval(DOM_STUB);
    IA.eval('maybeShowReminder()'); IA.flushTimers(); seen.push(el('popMsg')); }
  let mem = {}; try { mem = JSON.parse(LS.getItem(MEMKEY) || '{}'); } catch(e){}
  const rep = seen.some((m, i) => i && m === seen[i - 1]);
  const c = !rep && new Set(seen).size >= 2 && typeof mem.reminder === 'number' && seen.every(m => m && !/week off/.test(m));
  return [c, 'distinct ' + new Set(seen).size + ' repeat ' + rep + ' mem ' + JSON.stringify(mem)];
});
row('E3c reminder gap 8: msg is the fixed re-entry text; sub is the bare day identity (no doctrine suffix)', () => {
  const r = reminder(COMP_GAP8);
  return [r.msg === REM_FIXED && r.sub === REM_SUB, JSON.stringify(r)];
});

// E4 no-day edge (Saturday 07:00 tap, where a tap-clock context would open every tagged line)
row('E4a popPick(workout) with no week/dayKey: the 21 untagged only', () => {
  install(handProg()); setNow(DATES[1].sat, 7);
  const got = sweep("popPick('workout')"); return [same(got, UNTAGGED), diff(got, UNTAGGED)];
});
row('E4b popPick(workout,1,sat) with startDate null: the 21 untagged only', () => {
  const P = handProg(); P.startDate = null; install(P); setNow(DATES[1].sat, 7);
  const got = sweep("popPick('workout',1,'sat')"); return [same(got, UNTAGGED), diff(got, UNTAGGED)];
});
row('E4c popPick(workout,9,sat), no day object (week 9 absent): the 21 untagged only', () => {
  install(handProg()); setNow(DATES[1].sat, 7);
  const got = sweep("popPick('workout',9,'sat')"); return [same(got, UNTAGGED), diff(got, UNTAGGED)];
});

// E5 unchanged (3)
row('E5a pool counts 27/5/5/9 (workout/reminder/streak/season)', () => {
  const n = JSON.parse(IA.eval('JSON.stringify([POP_POOLS.workout.length,POP_POOLS.reminder.length,POP_POOLS.streak.length,POP_POOLS.season.length])'));
  return [n.join('/') === '27/5/5/9', n.join('/')];
});
row('E5b order unchanged: each tagged line sits at its hand index [1] [3] [8] [15] [25] [26]', () => {
  const bad = TAGGED.filter(i => !String(WTXT[i] || '').toLowerCase().includes(TAG_ANCHOR[i])
    || WTXT.filter(t => String(t).toLowerCase().includes(TAG_ANCHOR[i])).length !== 1);
  return [!bad.length, bad.join(',')];
});
row('E5c reminder, streak and season pools carry no tags (every entry a plain string)', () => {
  const t = JSON.parse(IA.eval("JSON.stringify(['reminder','streak','season'].map(function(k){return POP_POOLS[k].filter(function(e){return typeof e!=='string';}).length;}))"));
  return [t.every(x => x === 0), t.join('/')];
});
row('E5d rotation keeps last-index exclusion: last=4 on an all-open cell (runLift sat today 07h) leaves 26; the draw is stored', () => {
  install(handProg()); setNow(DATES[2].sat, 7);
  const exp = [...Array(27).keys()].filter(i => i !== 4);
  const got = sweep("popPick('workout',2,'sat')", { workout:4 });
  LS.setItem(MEMKEY, JSON.stringify({ workout:4 })); IA.eval('globalThis.__g220fix=0.5');
  const t = IA.eval("popPick('workout',2,'sat')"); IA.eval('globalThis.__g220fix=null');
  const mem = JSON.parse(LS.getItem(MEMKEY) || '{}');
  return [same(got, exp) && mem.workout === idxOf(t) && mem.workout !== 4, diff(got, exp) + ' stored ' + mem.workout];
});
row('E5e the Wildcard passes its own msg (and kicker WILDCARD DONE)', () => {
  install(handProg()); setNow(DATES[1].sat, 7);
  IA.eval('fireWildcardPopup(true)'); IA.flushTimers();
  return [el('popMsg') === WILD_MSG && el('popKicker') === 'WILDCARD DONE', el('popKicker') + ' / ' + el('popMsg')];
});
row('E5f streak and season tiers still draw from their own untagged pools', () => {
  install(handProg()); setNow(DATES[1].sat, 7);
  const P = JSON.parse(IA.eval('JSON.stringify({s:POP_POOLS.streak,z:POP_POOLS.season})'));
  IA.eval('fireStreakPopup(7)'); const s = el('popMsg'); IA.eval('fireSeasonPopup()'); const z = el('popMsg'); IA.flushTimers();
  return [P.s.includes(s) && P.z.includes(z), s + ' / ' + z];
});

// ── RUN ───────────────────────────────────────────────────────────────────────
function main(){
  let VER = NaN;
  try { IA = load(ART); VER = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); }
  if(!(VER >= ERA)){
    console.log('REFUSED: ia-version ' + VER + ' predates D175 P-POPCOND (V' + ERA + '). No row may pass on it.');
    ROWS.forEach(r => { fail++; console.log('FAIL ' + r.id + ' (REFUSED)'); });
    return done();
  }
  LS = IA.localStorage;
  IA.eval(CLOCK);
  setNow([2026, 9, 24], 10);
  WTXT = JSON.parse(IA.eval("JSON.stringify(POP_POOLS.workout.map(function(e){return (e&&typeof e==='object')?e.t:e;}))"));
  // Real HALF_MANNY days: first day of each shape by the gate-side lens, never the final scheduled day.
  try {
    const prog = IA.buildProgram(cl(IA.fixtures.HALF_MANNY)); const pick = {};
    // buildProgram leaves startDate to doGenerate. Anchor the gate's copy to its own calendar by hand date math:
    // Race Day is found by subtype, and week 1's Monday is back-dated so Race Day lands on the fixture's raceDate.
    let race = null;
    Object.keys(prog.weeks).forEach(w => DAYS.forEach(d => { const y = prog.weeks[w][d], c = y && !y.rest && y.cardio;
      const sub = c ? (Array.isArray(c) ? c.map(x => x.subtype || '').join(' ') : (c.subtype || '')) : '';
      if(/race day/i.test(sub)) race = race ? 'many' : { w:+w, d }; }));
    const built = prog.startDate;
    if(race && race !== 'many'){ const rd = IA.fixtures.HALF_MANNY.raceDate.split('-').map(Number);
      const m = new Date(rd[0], rd[1] - 1, rd[2]); m.setDate(m.getDate() - ((race.w - 1) * 7 + OFF[race.d]));
      prog.startDate = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(m.getDate()).padStart(2, '0'); }
    const all = [];
    if(prog.startDate){ const mon = monOf(prog.startDate);
      Object.keys(prog.weeks).map(Number).sort((a, b) => a - b).forEach(w => DAYS.forEach(d => { const y = prog.weeks[w][d];
        if(!y || y.rest) return; const dt = new Date(mon); dt.setDate(mon.getDate() + (w - 1) * 7 + OFF[d]);
        all.push({ w, d, date:tup(dt), t:dt.getTime(), k:classify(y) }); })); }
    all.sort((a, b) => a.t - b.t); const body = all.slice(0, -1);
    SHAPES.forEach(s => { const x = body.find(z => z.k === s); if(x) pick[s] = x; });
    REAL = { prog, pick, race, built };
    console.log('info HALF_MANNY startDate ' + prog.startDate + ' (race ' + JSON.stringify(race) + ') picks ' + SHAPES.map(s => s + '=' + (pick[s] ? 'W' + pick[s].w + ' ' + pick[s].d + ' ' + pick[s].date.join('-') : 'none')).join(' '));
  } catch(e){ console.log('info HALF_MANNY build threw: ' + e.message); REAL = { prog:{ weeks:{} }, pick:{}, race:null, built:null }; }
  IA.eval(RNG);
  ROWS.forEach(r => { let res; try { res = r.fn(); } catch(e){ res = [false, 'threw ' + (e && e.message)]; } ok(r.id, res[0], res[0] ? undefined : res[1]); });
  return done();
}
function done(){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }
main();
