// active-program: what the day-after reminder ("UNFINISHED BUSINESS") asks when the athlete comes back to a program after
// training on another one. Read-only (measure). Reported by Mario on 2026-10-18, Week 8 of THE HALF MANNY: the pop-up
// asked about Saturday, Wk 7, a day he spent on another program.
// Usage: node tests/measure/active-program_reminder-switch.ts > <scratch>/active-program_reminder-switch.out 2>&1
// Part 1 is the switch (v0.240.1, D238); part 2, at the foot, is the backlog behind a marked day (v0.241.1, D240).
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// The scenario, for each length of time away: HALF_MANNY (seeded fixture, week 1 back-dated so Race Day lands on its
// raceDate, as tests/integration/pop-ups.test.ts does) is trained day for day up to the switch, every training day after
// it is left unmarked (the athlete trained another program), then HALF_MANNY is active again and the app opens once a
// day at 10:00. Each day the athlete trains that day's session after the pop-up and closes the pop-up by tapping
// outside it (popClose: nothing written). Printed: what each day's pop-up names, and how many days it keeps asking.
import { loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const Q = loadApp() as any;
const LS = Q.localStorage;
const PID = 'hm';
const DOM_STUB = "__pcMk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',className:'',style:{},dataset:{},children:[],"
  + 'classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},'
  + 'setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},'
  + 'appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},'
  + 'replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},'
  + 'addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},'
  + 'closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},'
  + 'offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};'
  + '__pcEls={};document.getElementById=function(id){if(!__pcEls[id])__pcEls[id]=__pcMk(id);return __pcEls[id];};';
Q.eval('(function(){ var RD=Date; globalThis.__pcRD=RD; globalThis.__pcNow=RD.now();'
  + ' function FD(){ if(!(this instanceof FD)) return new RD(globalThis.__pcNow).toString();'
  + ' if(!arguments.length) return new RD(globalThis.__pcNow);'
  + ' return new (Function.prototype.bind.apply(RD,[null].concat([].slice.call(arguments))))(); }'
  + ' FD.prototype=RD.prototype; FD.now=function(){return globalThis.__pcNow;}; FD.parse=RD.parse; FD.UTC=RD.UTC;'
  + ' globalThis.Date=FD; })();');
const setNow = (d: Date) => Q.eval('globalThis.__pcNow=new __pcRD(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ',10,0,0).getTime()');
const el = (id: string) => Q.eval('__pcEls.' + id + ' ? __pcEls.' + id + '.textContent : null');
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

out('page ia-version ' + Q.version);
const prog = Q.buildProgram(JSON.parse(JSON.stringify(Q.fixtures.HALF_MANNY)));
const again = Q.buildProgram(JSON.parse(JSON.stringify(Q.fixtures.HALF_MANNY)));
out('HALF_MANNY built twice equal: ' + (JSON.stringify(prog.weeks) === JSON.stringify(again.weeks)));
let race: { w: number; d: string } | null = null;
Object.keys(prog.weeks).forEach((w) => DAYS.forEach((d) => {
  const y = prog.weeks[w][d]; const c = y && !y.rest && y.cardio;
  const sub = c ? (Array.isArray(c) ? c.map((x: any) => x.subtype || '').join(' ') : c.subtype || '') : '';
  if (/race day/i.test(sub)) race = { w: +w, d };
}));
if (!race) throw new Error('no Race Day');
const r = race as { w: number; d: string };
const rd = Q.fixtures.HALF_MANNY.raceDate.split('-').map(Number);
const wk1Mon = new Date(rd[0], rd[1] - 1, rd[2]); wk1Mon.setDate(wk1Mon.getDate() - ((r.w - 1) * 7 + DAYS.indexOf(r.d)));
prog.startDate = iso(wk1Mon); prog.id = PID;
out('startDate ' + prog.startDate + ', race W' + r.w + ' ' + r.d + ' ' + Q.fixtures.HALF_MANNY.raceDate + ', totalWeeks ' + prog.totalWeeks);
// Every training day of the program with its date, ascending.
const train: { w: number; d: string; date: Date; title: string }[] = [];
Object.keys(prog.weeks).map(Number).sort((a, b) => a - b).forEach((w) => DAYS.forEach((d, i) => {
  const y = prog.weeks[w][d]; if (!y || y.rest) return;
  train.push({ w, d, date: addDays(wk1Mon, (w - 1) * 7 + i), title: y.title || 'Workout' });
}));
const at = (dt: Date) => train.find((x) => iso(x.date) === iso(dt));
const label = (x: { w: number; d: string; date: Date }) => 'W' + x.w + ' ' + x.d + ' ' + iso(x.date);
const back = new Date(2026, 9, 18); // the reported morning: Sunday 2026-10-18
out('2026-10-18 is ' + (() => { const off = Math.round((back.getTime() - wk1Mon.getTime()) / 864e5); return 'W' + (Math.floor(off / 7) + 1) + ' ' + DAYS[off % 7]; })());

function run(awayDays: number, answer: 'outside' | 'skip') {
  LS.clear();
  Q.eval("activeProgId='" + PID + "'");
  Q.eval('activeProg=' + JSON.stringify(prog));
  Q.eval(DOM_STUB);
  const switchDay = addDays(back, -awayDays); // the first day on the other program
  const comp: Record<string, unknown> = {};
  train.filter((x) => x.date < switchDay).forEach((x) => { comp['w' + x.w + '_' + x.d] = { title: x.title, ts: 1, status: 'complete' }; });
  LS.setItem('ia_comp_' + PID, JSON.stringify(comp));
  const away = train.filter((x) => x.date >= switchDay && x.date < back);
  out('');
  out('away ' + awayDays + ' days (' + iso(switchDay) + ' to ' + iso(addDays(back, -1)) + '), back on HALF_MANNY ' + iso(back) + ', answer: ' + answer);
  out('  HALF_MANNY training days in the away window: ' + away.length + ' [' + away.map(label).join(', ') + ']');
  let asked = 0; let askedAway = 0;
  for (let n = 0; n < 28; n++) {
    const today = addDays(back, n); setNow(today);
    Q.eval("__pcEls={}");
    Q.eval('maybeShowReminder()'); Q.flushTimers();
    const kick = el('popKicker'); const sub = el('popSub');
    const shown = kick === 'UNFINISHED BUSINESS';
    if (shown) {
      asked++;
      const hit = away.find((x) => sub && sub.startsWith(Q.eval('DAY_FULL.' + x.d) + ', Wk ' + x.w + ' '));
      if (hit) askedAway++;
      const msg = el('popMsg') || '';
      if (answer === 'skip' && hit) { const c = JSON.parse(LS.getItem('ia_comp_' + PID)); c['w' + hit.w + '_' + hit.d] = { title: hit.title, ts: 2, status: 'skipped' }; LS.setItem('ia_comp_' + PID, JSON.stringify(c)); }
      if (n < 10 || hit) out('  ' + iso(today) + ' asks: ' + sub + (msg.startsWith('More than a week') ? '  [re-entry copy]' : '') + (hit ? '  <- a day spent on the other program' : ''));
    }
    // the athlete trains today's HALF_MANNY session after the pop-up
    const t = at(today);
    if (t) { const c = JSON.parse(LS.getItem('ia_comp_' + PID)); c['w' + t.w + '_' + t.d] = { title: t.title, ts: 3, status: 'complete' }; LS.setItem('ia_comp_' + PID, JSON.stringify(c)); }
    Q.eval('popClose()');
  }
  out('  over 28 days back: ' + asked + ' pop-ups, ' + askedAway + ' about away days (of ' + away.length + ')' + ', streak after: ' + Q.eval('computeStreak()'));
}
[3, 8, 14].forEach((a) => run(a, 'outside'));
run(8, 'skip');

// Part 2 (2026-10-19, Mario's second screenshot: Week 9, the pop-up asking about Thursday, Wk 7). A program that was
// already active when v0.240.1 landed: no switch marks its backlog. Weeks 1 to 5 marked, week 6 (2026-10-05 to 10-11,
// the fixture's place for Mario's week 7) left unmarked on the other program, and the athlete back from Monday 2026-10-12,
// training and marking each day after the pop-up. Printed for the current page and for a surgery copy where the walk
// stops at the first marked day (`continue` becomes `break` on the resolved check).
function backlog(label: string) {
  LS.clear();
  Q.eval("activeProgId='" + PID + "'");
  Q.eval('activeProg=' + JSON.stringify(prog));
  Q.eval(DOM_STUB);
  const away0 = new Date(2026, 9, 5), back0 = new Date(2026, 9, 12);
  const comp: Record<string, unknown> = {};
  train.filter((x) => x.date < away0).forEach((x) => { comp['w' + x.w + '_' + x.d] = { title: x.title, ts: 1, status: 'complete' }; });
  LS.setItem('ia_comp_' + PID, JSON.stringify(comp));
  const away = train.filter((x) => x.date >= away0 && x.date < back0);
  let asked = 0, askedAway = 0; const lines: string[] = [];
  for (let n = 0; n < 21; n++) {
    const today = addDays(back0, n); setNow(today);
    Q.eval('__pcEls={}'); Q.eval('maybeShowReminder()'); Q.flushTimers();
    if (el('popKicker') === 'UNFINISHED BUSINESS') {
      asked++; const sub = el('popSub') || '';
      const hit = away.find((x) => sub.startsWith(Q.eval('DAY_FULL.' + x.d) + ', Wk ' + x.w + ' '));
      if (hit) askedAway++;
      lines.push('  ' + iso(today) + ' asks: ' + sub.split('.')[0] + (hit ? '  <- a day on the other program' : ''));
    }
    const t = at(today);
    if (t) { const c = JSON.parse(LS.getItem('ia_comp_' + PID)); c['w' + t.w + '_' + t.d] = { title: t.title, ts: 3, status: 'complete' }; LS.setItem('ia_comp_' + PID, JSON.stringify(c)); }
    Q.eval('popClose()');
  }
  out('');
  out('backlog, ' + label + ': away 2026-10-05 to 10-11 (' + away.length + ' training days), back 2026-10-12, opened daily for 21 days');
  lines.forEach(out);
  out('  ' + asked + ' pop-ups, ' + askedAway + ' about days on the other program');
}
backlog('current page');
const SRC = Q.eval('maybeShowReminder.toString()');
const CUT = 'if(statusOf(x.week,x.d)) continue;';
if (SRC.split(CUT).length !== 2) throw new Error('surgery anchor not found once');
Q.eval(SRC.replace(CUT, 'if(statusOf(x.week,x.d)) break;'));
backlog('surgery: the walk stops at the first marked day');
