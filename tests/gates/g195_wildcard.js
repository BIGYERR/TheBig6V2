// g195_wildcard — V195 (D64/D71/D71b): a Wildcard is a substitute the athlete chose, not a
// session they finished; and a Wildcard is attendance, so it rescues a skipped day's streak.
//
// V195 SECOND PASS — WHY THIS GATE WAS REBUILT.
// The first cut asserted the new functions in ISOLATION and then checked their call sites by
// grepping renderWeekView.toString() for identifiers. It never called renderWeekView and never
// called openDetail, so four mutations that broke the athlete-visible surfaces while leaving the
// identifiers in place all returned PASS 52 FAIL 0. It also carried 9 assertions that ran the
// copy rule over a hand-typed array declared inside the gate: independent of index.html and
// unable to fail for any artifact (the §10b "reads as coverage" defect).
// This cut:
//   - RENDERS. renderWeekView and openDetail are called and their innerHTML is read back.
//   - Sweeps wildcardDayFor across a DST lattice in seven timezones, by re-execing itself
//     per zone, so Math.round -> Math.floor cannot survive.
//   - HARVESTS every copy string out of rendered output and runs the copy rule over what was
//     harvested, then compares the harvest to the hand-typed ruled text. Nothing in the copy
//     section is self-referential any more.
//
// ORACLES (all independent of the code under test):
//   - the program is a HAND-BUILT fixture (never buildProgram), so the calendar, the rest days
//     and the session titles are known to the gate by construction;
//   - day resolution is checked against pure calendar arithmetic (new Date(y, m, d + n), which
//     never divides milliseconds and so is immune to the bug being hunted), then round-tripped;
//   - every streak number is a hand walk over the fixture stated in the comment above the case;
//   - every expected string is typed out by hand from the ruling.
//
// Usage: node tests/gates/g195_wildcard.js <candidate.html> [baseline.html]
//        G195_TZ_CHILD=<IANA zone> node tests/gates/g195_wildcard.js <candidate.html>   (DST child)
const path = require('path');
const cp = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const TZ_CHILD = process.env.G195_TZ_CHILD || '';
const IA = load(FILE);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function tryOk(name, fn) {
  try { const r = fn(); ok(name, r === true || (r && r.cond === true), r && r.detail); }
  catch (e) { fail++; console.log('FAIL ' + name + '  -> threw: ' + e.message); }
}

// ── hand date math (the gate's own, not the app's) ───────────────────────────
// addDays goes through the Date(y, m, d + n) constructor on purpose: it is calendar
// arithmetic, never a millisecond division, so it cannot share a DST bug with the code
// under test.
const DK = ['mon','tue','wed','thu','fri','sat','sun'];      // index = days after Monday
const monIdx = d => (d.getDay() + 6) % 7;                    // Mon=0 … Sun=6
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
function midnight(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); x.setHours(0,0,0,0); return x; }
function mondayOf(d){ return addDays(midnight(d), -monIdx(midnight(d))); }
function dayCount(a, b){ return Math.round((midnight(b).getTime() - midnight(a).getTime()) / 86400000); }

const TODAY = midnight(new Date());
const TODAY_KEY = DK[monIdx(TODAY)];

// ── hand-built fixture ───────────────────────────────────────────────────────
// Start is 14 days before today, so today sits in week 3 of a 6-week block whatever
// weekday the gate is run on. restDays is the gate's own list; the fixture is the oracle.
const PID = 'g195';
const TOTAL_WEEKS = 6;
const START = addDays(TODAY, -14);
const START_MON = mondayOf(START);
const EXP_WEEK = Math.floor(dayCount(START_MON, TODAY) / 7) + 1;
const VIEWED_WEEK = 6;                                       // deliberately NOT EXP_WEEK
// Rest sets that guarantee the shape the case needs whatever weekday the gate runs on.
const REST_TODAY_TRAINS = [TODAY_KEY === 'sun' ? 'sat' : 'sun', TODAY_KEY === 'wed' ? 'thu' : 'wed'];
const REST_TODAY_RESTS  = [TODAY_KEY, TODAY_KEY === 'sun' ? 'wed' : 'sun'];

function mkProg(restDays, title){
  const weeks = {};
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    weeks[w] = {};
    DK.forEach(d => {
      weeks[w][d] = restDays.indexOf(d) >= 0
        ? { title: 'Rest', rest: true, tags: ['rest'] }
        : { title: title, sections: [], tags: ['lift'] };
    });
  }
  return { id: PID, name: 'GATE BLOCK', totalWeeks: TOTAL_WEEKS, startDate: iso(START), weeks, goal: 'balanced', cfg: {} };
}
// Every non-rest day of the fixture with date <= today, ascending. Hand walk.
function handScheduled(restDays){
  const out = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    DK.forEach((d, off) => {
      if (restDays.indexOf(d) >= 0) return;
      const dt = addDays(START_MON, (w - 1) * 7 + off);
      if (dt < midnight(START)) return;          // before the start date: outside the block
      if (dt > TODAY) return;
      out.push({ week: w, d: d, date: dt });
    });
  }
  out.sort((a, b) => a.date - b.date);
  return out;
}

// A DOM stub that RETAINS what was written to it, so a render can be read back.
// The harness's own getElementById hands out a fresh element every call, which would
// silently swallow innerHTML; that is exactly how the first cut of this gate went blind.
const DOM_STUB = "__g195mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g195els={};document.getElementById=function(id){if(!__g195els[id])__g195els[id]=__g195mk(id);return __g195els[id];};"
  + "document.querySelectorAll=function(){return[];};";

function install(prog, comp, viewWeek){
  IA.localStorage.clear();
  IA.eval("activeProgId='" + PID + "'");
  IA.eval('activeProg=' + JSON.stringify(prog));
  IA.eval('currentWeek=' + (viewWeek === undefined ? VIEWED_WEEK : viewWeek));
  if (comp) IA.localStorage.setItem('ia_comp_' + PID, JSON.stringify(comp));
  IA.eval(DOM_STUB);
  IA.eval('popFire=function(t,o){ __g195cap=JSON.stringify({tier:t,opts:o}); }');
  IA.eval('fireSeasonPopup=function(){ __g195season=1; }');
  IA.eval('fireCompletionPopup=function(){ __g195completion=1; }');
  IA.eval('__g195cap=null; __g195season=0; __g195completion=0;');
}
const cap = () => { const s = IA.eval('__g195cap'); return s ? JSON.parse(s) : null; };
const weekHTML = () => IA.eval('__g195els.daysList ? __g195els.daysList.innerHTML : ""') || '';
const detailHTML = () => IA.eval('__g195els.detailBody ? __g195els.detailBody.innerHTML : ""') || '';
const barHTML = () => IA.eval('__g195els.randFilterBar ? __g195els.randFilterBar.innerHTML : ""') || '';
function setWild(records){ IA.localStorage.setItem('ia_wild_' + PID, JSON.stringify(records)); }
// Split the rendered week strip into one blob per weekday, keyed by the day label the
// strip prints. Lets the gate say WHICH cell carries the mark, not merely that one does.
function stripOf(html){
  const a = html.indexOf('<div class="wk-strip">'), b = html.indexOf('<div class="wk-hero');
  return (a < 0 || b < 0) ? '' : html.slice(a, b);
}
// Split on a LOOKAHEAD for a cell opener. The class is followed by a space or the closing
// quote on a real cell, never by a hyphen, so the child divs (wk-day-lbl, wk-day-num …)
// cannot split the blob.
function stripCells(html){
  const cells = {};
  stripOf(html).split(/(?=<div class="wk-day[ "])/).forEach(p => {
    const m = p.match(/<div class="wk-day-lbl">([A-Z]{3})<\/div>/);
    if (m) cells[m[1].toLowerCase()] = p;
  });
  return cells;
}

// ════════════════════════════════════════════════════════════════════════════
// DST LATTICE on wildcardDayFor. Runs in the parent's zone when re-exec'd as a child.
// ════════════════════════════════════════════════════════════════════════════
const TZ_LATTICE = ['America/New_York','Europe/London','Australia/Sydney','Australia/Lord_Howe','Pacific/Chatham','UTC','Asia/Kolkata'];

function runDstLattice(){
  const DPID = 'g195dst';
  const call = d => IA.eval('JSON.stringify(wildcardDayFor(new Date(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ',12,0,0)))');
  function mk(startIso, tw, rest){
    const weeks = {};
    for (let w = 1; w <= tw; w++) { weeks[w] = {}; DK.forEach(d => { weeks[w][d] = rest.indexOf(d) >= 0 ? { title:'Rest', rest:true } : { title:'Session', sections:[] }; }); }
    return { id: DPID, name:'DST', totalWeeks: tw, startDate: startIso, weeks, goal:'balanced', cfg:{ seed:1 } };
  }
  function put(prog){
    IA.localStorage.clear();
    IA.eval("activeProgId='" + DPID + "'"); IA.eval('activeProg=' + JSON.stringify(prog)); IA.eval('currentWeek=1');
  }
  // Windows chosen so that a DST transition falls INSIDE the program, and so that some
  // programs START on a transition date. 2026 transitions used:
  //   US spring 2026-03-08, US fall 2026-11-01, EU spring 2026-03-29, EU fall 2026-10-25,
  //   AU (southern) autumn 2026-04-05, AU spring 2026-10-04, Chatham/Lord Howe track NZ/AU.
  const CASES = [
    ['spring-forward inside the window (US)', '2026-02-16', 12],
    ['fall-back inside the window (US)',      '2026-10-05', 12],
    ['spring-forward inside the window (EU)', '2026-03-09', 8],
    ['fall-back inside the window (EU)',      '2026-10-05', 8],
    ['southern autumn inside the window',     '2026-03-16', 8],
    ['southern spring inside the window',     '2026-09-14', 8],
    ['startDate ON the US spring boundary',   '2026-03-08', 10],
    ['startDate ON the US fall boundary',     '2026-11-01', 10],
    ['startDate ON the EU spring boundary',   '2026-03-29', 10],
    ['startDate ON the southern boundary',    '2026-04-05', 10],
    ['start mid-week (Thu)',                  '2026-04-02', 6],
    ['start on a Saturday',                   '2026-04-04', 6],
    ['year boundary',                         '2025-12-15', 8],
    ['leap February',                         '2028-02-14', 6],
  ];
  CASES.forEach(([name, start, tw]) => {
    put(mk(start, tw, ['sun']));
    const SD = new Date(+start.slice(0,4), +start.slice(5,7) - 1, +start.slice(8,10));
    const SMON = mondayOf(SD);
    const bad = [];
    for (let off = -10; off < tw * 7 + 10; off++) {
      const d = addDays(SMON, off);
      const got = JSON.parse(call(d));
      // HAND EXPECTATION: pure calendar arithmetic, no millisecond division.
      const w = Math.floor(off / 7) + 1, dk = DK[((off % 7) + 7) % 7];
      const exp = (off >= 0 && w >= 1 && w <= tw && d >= midnight(SD)) ? { week: w, dayKey: dk } : null;
      const g = got ? got.week + '/' + got.dayKey : 'null';
      const e = exp ? exp.week + '/' + exp.dayKey : 'null';
      if (g !== e) bad.push(iso(d) + ' got ' + g + ' exp ' + e);
      if (got) {   // round-trip through the app's own forward map
        IA.eval('currentWeek=' + got.week);
        const fwd = IA.eval("(function(){var x=dayDateFor(" + got.week + ",'" + got.dayKey + "');return x?x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2):null;})()");
        if (fwd !== iso(d)) bad.push('roundtrip ' + iso(d) + ' -> ' + got.week + '/' + got.dayKey + ' -> ' + fwd);
      }
    }
    ok('dst[' + name + ' start ' + start + ']: every day of the block resolves to the hand calendar', bad.length === 0,
       bad.length + ' wrong days: ' + bad.slice(0, 6).join(' | ') + (bad.length > 6 ? ' ...+' + (bad.length - 6) : ''));
  });
  // Sunday wrap: weekday index 6 is the one a modulo slip drops off the end.
  { put(mk('2026-04-06', 4, ['wed']));
    const got = JSON.parse(call(new Date(2026, 3, 12)));
    ok('dst: Sunday wrap — index 6 resolves to sun of week 1', !!got && got.week === 1 && got.dayKey === 'sun', JSON.stringify(got)); }
  // A rest day still RESOLVES here; it is scheduledDays, later, that drops it.
  { put(mk('2026-04-06', 4, ['wed','sun']));
    const got = JSON.parse(call(new Date(2026, 3, 8)));
    ok('dst: a rest day still resolves (the streak filter is scheduledDays, not this)', !!got && got.week === 1 && got.dayKey === 'wed', JSON.stringify(got));
    const sched = IA.eval("JSON.stringify(scheduledDays(new Date(2026,3,30)).filter(function(x){return x.d==='wed';}))");
    ok('dst: scheduledDays really drops rest days', sched === '[]', sched); }
  // Edges.
  { put(mk('2026-04-08', 4, ['sun']));                     // Wednesday start: week 1 is short
    ok('dst: the day before the start resolves to null', call(new Date(2026, 3, 7)) === 'null', call(new Date(2026, 3, 7)));
    ok('dst: the Monday of week 1 before the start resolves to null', call(new Date(2026, 3, 6)) === 'null', call(new Date(2026, 3, 6)));
    const first = JSON.parse(call(new Date(2026, 3, 8)) || 'null');
    ok('dst: the first day of the program resolves to its own weekday', !!first && first.week === 1 && first.dayKey === 'wed', JSON.stringify(first));
    const last = JSON.parse(call(addDays(new Date(2026, 3, 6), 27)) || 'null');
    ok('dst: the last day of the block resolves to the last week', !!last && last.week === 4 && last.dayKey === 'sun', JSON.stringify(last));
    ok('dst: the day after the final week resolves to null', call(addDays(new Date(2026, 3, 6), 28)) === 'null', call(addDays(new Date(2026, 3, 6), 28))); }
  // Degenerate program shapes.
  { const p = mk('2026-04-06', 4, ['sun']); delete p.weeks[2].thu; put(p);
    ok('dst: a missing day object resolves to null', call(new Date(2026, 3, 16)) === 'null', call(new Date(2026, 3, 16)));
    const p2 = mk('2026-04-06', 4, ['sun']); delete p2.startDate; put(p2);
    ok('dst: no startDate resolves to null', call(new Date(2026, 3, 8)) === 'null', call(new Date(2026, 3, 8)));
    IA.eval('activeProg=null');
    ok('dst: no activeProg resolves to null', call(new Date(2026, 3, 8)) === 'null', call(new Date(2026, 3, 8))); }
}

// ── DST CHILD MODE ───────────────────────────────────────────────────────────
if (TZ_CHILD) {
  console.log('# g195 DST child TZ=' + TZ_CHILD + ' offsetNow=' + new Date().getTimezoneOffset());
  runDstLattice();
  console.log('G195_TZ_SUMMARY ' + pass + ' ' + fail);
  process.exit(0);
}

console.log('# g195_wildcard on ' + path.basename(FILE) + ' (ia-version ' + IA.version + ')');
console.log('# today=' + iso(TODAY) + ' ' + TODAY_KEY + ' | start=' + iso(START) + ' | expected week=' + EXP_WEEK + ' | viewed week=' + VIEWED_WEEK);

// ═══ 1. REST-DAY WILDCARD ═══════════════════════════════════════════════════
{
  const prog = mkProg(REST_TODAY_RESTS, 'Recovery Lift');
  const sched = handScheduled(REST_TODAY_RESTS);
  // hand-seed two completes on the two most recent scheduled days (neither is today)
  const seed = {};
  sched.slice(-2).forEach(x => { seed['w' + x.week + '_' + x.d] = { title: 'Recovery Lift', ts: 1, status: 'complete' }; });
  install(prog, seed);

  const compBefore = IA.localStorage.getItem('ia_comp_' + PID);
  const streakBefore = IA.eval('computeStreak()');
  const countBefore = IA.eval('completedCount()');
  let threw = null;
  try { IA.eval("completeWildcard('Chaos Workout')"); } catch (e) { threw = e.message; }
  IA.flushTimers();

  ok('rest: completeWildcard runs', threw === null, threw);
  ok('rest: ia_comp_ is byte-identical after the Wildcard',
     IA.localStorage.getItem('ia_comp_' + PID) === compBefore,
     IA.localStorage.getItem('ia_comp_' + PID));
  ok('rest: ia_hist_ was never written (no snapshotDay on this path)',
     IA.localStorage.getItem('ia_hist_' + PID) === null,
     IA.localStorage.getItem('ia_hist_' + PID));
  const wild = JSON.parse(IA.localStorage.getItem('ia_wild_' + PID) || '[]');
  ok('rest: ia_wild_ holds exactly one record for the title', wild.length === 1 && wild[0].title === 'Chaos Workout', JSON.stringify(wild));
  ok('rest: the record carries a week and a day key', !!(wild[0] && wild[0].week && wild[0].dayKey), JSON.stringify(wild[0]));
  ok('rest: the day is resolved by DATE, not by the viewed week',
     !!wild[0] && wild[0].week === EXP_WEEK && wild[0].dayKey === TODAY_KEY && wild[0].week !== VIEWED_WEEK,
     JSON.stringify(wild[0]) + ' expected week ' + EXP_WEEK + ' day ' + TODAY_KEY);
  // round-trip: rebuild the calendar date from the stamped (week, dayKey) and compare to today
  if (wild[0] && wild[0].week && wild[0].dayKey) {
    const back = addDays(START_MON, (wild[0].week - 1) * 7 + DK.indexOf(wild[0].dayKey));
    ok('rest: the stamped day round-trips to today’s calendar date', iso(back) === iso(TODAY), iso(back) + ' vs ' + iso(TODAY));
  } else { fail++; console.log('FAIL rest: the stamped day round-trips to today’s calendar date  -> no stamp'); }
  ok('rest: the streak does not extend and does not break',
     IA.eval('computeStreak()') === streakBefore && streakBefore === 2,
     'before ' + streakBefore + ' after ' + IA.eval('computeStreak()') + ' (hand walk expects 2)');
  ok('rest: completedCount is unmoved', IA.eval('completedCount()') === countBefore && countBefore === 2,
     'before ' + countBefore + ' after ' + IA.eval('completedCount()'));
  const c = cap();
  ok('rest: the celebration fired with the ruled kicker and line',
     !!c && c.opts.kicker === 'WILDCARD DONE' && c.opts.msg === 'You showed up. That is the whole game.', JSON.stringify(c));
  ok('rest: the celebration says "Streak holds."', !!c && c.opts.sub === 'Streak holds.', JSON.stringify(c && c.opts.sub));
  ok('rest: the season banner cannot fire from this path',
     IA.eval('__g195season') === 0 && IA.eval('__g195completion') === 0,
     'season=' + IA.eval('__g195season') + ' completion=' + IA.eval('__g195completion'));
  ok('rest: the celebration claims no PR and no progress',
     !!c && !(c.opts.stats && c.opts.stats.length), JSON.stringify(c && c.opts.stats));
}

// ═══ 2. TRAINING-DAY WILDCARD ═══════════════════════════════════════════════
{
  const prog = mkProg(REST_TODAY_TRAINS, 'Recovery Lift');
  const sched = handScheduled(REST_TODAY_TRAINS);
  const last = sched[sched.length - 1];
  // hand walk: today IS a scheduled day here, and the two scheduled days before it are complete
  const seed = {};
  sched.slice(-3, -1).forEach(x => { seed['w' + x.week + '_' + x.d] = { title: 'Recovery Lift', ts: 1, status: 'complete' }; });
  install(prog, seed);

  const compBefore = IA.localStorage.getItem('ia_comp_' + PID);
  const streakBefore = IA.eval('computeStreak()');
  let threw = null;
  try { IA.eval("completeWildcard('Chaos Workout')"); } catch (e) { threw = e.message; }
  IA.flushTimers();

  const c = cap();          // read the celebration BEFORE any later sub-case reinstalls the fixture
  const seasonAfter = IA.eval('__g195season'), completionAfter = IA.eval('__g195completion');
  ok('train: today is the last scheduled day of the hand walk',
     !!last && last.d === TODAY_KEY && last.week === EXP_WEEK, JSON.stringify(last));
  ok('train: completeWildcard runs', threw === null, threw);
  ok('train: ia_comp_ is byte-identical after the Wildcard',
     IA.localStorage.getItem('ia_comp_' + PID) === compBefore, IA.localStorage.getItem('ia_comp_' + PID));
  ok('train: ia_hist_ was never written', IA.localStorage.getItem('ia_hist_' + PID) === null,
     IA.localStorage.getItem('ia_hist_' + PID));
  ok('train: the prescribed session is still pending',
     IA.eval("statusOf(" + EXP_WEEK + ",'" + TODAY_KEY + "')") === null,
     IA.eval("JSON.stringify(statusOf(" + EXP_WEEK + ",'" + TODAY_KEY + "'))"));
  ok('train: the streak was 2 before and extends to 3',
     streakBefore === 2 && IA.eval('computeStreak()') === 3,
     'before ' + streakBefore + ' after ' + IA.eval('computeStreak()'));
  ok('train: completedCount still counts only the two hand-written completes',
     IA.eval('completedCount()') === 2, String(IA.eval('completedCount()')));
  ok('train: the celebration says "Streak: 3."', !!c && c.opts.sub === 'Streak: 3.', JSON.stringify(c && c.opts.sub));
  ok('train: the season banner cannot fire from this path',
     seasonAfter === 0 && completionAfter === 0,
     'season=' + seasonAfter + ' completion=' + completionAfter);
}

// ═══ 3. OFF THE CALENDAR ════════════════════════════════════════════════════
{
  const prog = mkProg(['sun'], 'Recovery Lift');
  prog.startDate = iso(addDays(TODAY, -400));      // today is far past week 6
  install(prog, null);
  let threw = null;
  try { IA.eval("completeWildcard('Chaos Workout')"); } catch (e) { threw = e.message; }
  IA.flushTimers();
  const wild = JSON.parse(IA.localStorage.getItem('ia_wild_' + PID) || '[]');
  ok('outside: completeWildcard runs', threw === null, threw);
  ok('outside: the Wildcard still logs to the counter', wild.length === 1 && wild[0].title === 'Chaos Workout', JSON.stringify(wild));
  ok('outside: it refuses to stamp a day rather than stamping the wrong one',
     !!wild[0] && !wild[0].week && !wild[0].dayKey, JSON.stringify(wild[0]));
  ok('outside: nothing reached ia_comp_ or ia_hist_',
     IA.localStorage.getItem('ia_comp_' + PID) === null && IA.localStorage.getItem('ia_hist_' + PID) === null,
     IA.localStorage.getItem('ia_comp_' + PID) + ' / ' + IA.localStorage.getItem('ia_hist_' + PID));
  tryOk('outside: an unstamped record renders no mark on any day', () => {
    const h = IA.eval("wildcardTagHTML(1,'mon')") + IA.eval("wildcardTagHTML(3,'tue')");
    return { cond: h === '', detail: h };
  });
}

// ═══ 4. THE WEEK STRIP IS RENDERED, NOT REASONED ABOUT ══════════════════════
// renderWeekView is CALLED and daysList.innerHTML is read back. Identifiers surviving in
// the source is not evidence; a W in the cell for the Wildcard day is.
{
  const prog = mkProg(REST_TODAY_TRAINS, 'Recovery Lift');
  install(prog, null, EXP_WEEK);
  setWild([{ title: 'Chaos Workout', ts: 1, week: EXP_WEEK, dayKey: TODAY_KEY }]);
  IA.eval('renderWeekView()');
  const h = weekHTML();
  ok('strip: renderWeekView actually wrote a week strip to daysList', h.indexOf('wk-strip') >= 0, h.slice(0, 160));
  const cells = stripCells(h);
  ok('strip: the rendered strip has a cell for all seven weekdays', Object.keys(cells).length === 7, Object.keys(cells).join(','));
  ok('strip: the Wildcard day (' + TODAY_KEY + ') renders the W mark',
     !!cells[TODAY_KEY] && cells[TODAY_KEY].indexOf('wc-mark') >= 0 && cells[TODAY_KEY].indexOf('>W<') >= 0,
     cells[TODAY_KEY]);
  ok('strip: every other day of the week renders no W mark',
     DK.filter(d => d !== TODAY_KEY).every(d => !cells[d] || cells[d].indexOf('wc-mark') < 0),
     DK.filter(d => d !== TODAY_KEY && cells[d] && cells[d].indexOf('wc-mark') >= 0).join(','));
  ok('strip: exactly one W mark in the whole strip',
     (stripOf(h).match(/class="wc-mark"/g) || []).length === 1,
     String((stripOf(h).match(/class="wc-mark"/g) || []).length));
  ok('strip: the W replaced the date number in that cell, it is not printed alongside it',
     !!cells[TODAY_KEY] && /<div class="wk-day-num">\s*<span class="wc-mark"/.test(cells[TODAY_KEY]),
     (cells[TODAY_KEY] || '').match(/<div class="wk-day-num">[\s\S]{0,60}/));
  ok('strip: the Wildcard day is NOT marked with the completion check',
     !!cells[TODAY_KEY] && cells[TODAY_KEY].indexOf('class="chk"') < 0, cells[TODAY_KEY]);
  // A future week the athlete is merely browsing must carry nothing.
  IA.eval('currentWeek=' + VIEWED_WEEK); IA.eval('renderWeekView()');
  const hv = weekHTML();
  ok('strip: a browsed future week renders neither a W mark nor a tag',
     hv.indexOf('wc-mark') < 0 && hv.indexOf('wc-tag') < 0, hv.slice(0, 160));
  // A completion on the same day wins the cell: the check, not the W.
  IA.localStorage.setItem('ia_comp_' + PID, JSON.stringify({ ['w' + EXP_WEEK + '_' + TODAY_KEY]: { title: 'Recovery Lift', ts: 1, status: 'complete' } }));
  IA.eval('currentWeek=' + EXP_WEEK); IA.eval('renderWeekView()');
  const hc = stripCells(weekHTML());
  ok('strip: a completed day shows the check, not the W, even when it also holds a Wildcard',
     !!hc[TODAY_KEY] && hc[TODAY_KEY].indexOf('class="chk"') >= 0 && hc[TODAY_KEY].indexOf('wc-mark') < 0, hc[TODAY_KEY]);
}

// ═══ 5. THE WEEK-VIEW TAG IS RENDERED ═══════════════════════════════════════
// P2 dropped _wcTag out of the innerHTML concatenation while leaving the variable in place.
{
  // rest variant
  const progR = mkProg(REST_TODAY_RESTS, 'Recovery Lift');
  install(progR, null, EXP_WEEK);
  setWild([{ title: 'Chaos Workout', ts: 1, week: EXP_WEEK, dayKey: TODAY_KEY }]);
  IA.eval('renderWeekView()');
  const hr = weekHTML();
  ok('weekview/rest: the week view emits a .wc-tag block', hr.indexOf('class="wc-tag"') >= 0, hr.slice(0, 200));
  ok('weekview/rest: the tag carries the ruled rest copy', hr.indexOf('Rest day. The streak sits this one out.') >= 0, 'copy missing from rendered output');
  ok('weekview/rest: the tag sits BELOW the hero and ABOVE the stat tiles',
     hr.indexOf('wc-tag') > hr.indexOf('wk-hero') && hr.indexOf('wc-tag') < hr.indexOf('wk-stats'),
     'hero@' + hr.indexOf('wk-hero') + ' tag@' + hr.indexOf('wc-tag') + ' stats@' + hr.indexOf('wk-stats'));
  ok('weekview/rest: the tag label reads WILDCARD DONE', /<div class="wc-tag-lbl">WILDCARD DONE<\/div>/.test(hr), 'label missing');

  // training variant, and it must name the REAL title
  const progT = mkProg(REST_TODAY_TRAINS, 'Tempo Run');
  install(progT, null, EXP_WEEK);
  setWild([{ title: 'Chaos Workout', ts: 1, week: EXP_WEEK, dayKey: TODAY_KEY }]);
  IA.eval('renderWeekView()');
  const ht = weekHTML();
  ok('weekview/train: the week view emits a .wc-tag block', ht.indexOf('class="wc-tag"') >= 0, ht.slice(0, 200));
  ok('weekview/train: the tag names the real prescribed session, not a constant',
     ht.indexOf('Tempo Run is still on the board.') >= 0 && ht.indexOf('Your session is still on the board.') < 0,
     ht.slice(ht.indexOf('wc-tag'), ht.indexOf('wc-tag') + 260));
  ok('weekview/train: the rest copy is NOT used on a training day',
     ht.indexOf('Rest day. The streak sits this one out.') < 0, 'rest copy leaked onto a training day');
  // no Wildcard at all: no tag anywhere
  IA.localStorage.removeItem('ia_wild_' + PID);
  IA.eval('renderWeekView()');
  ok('weekview: with an empty Wildcard store the week view emits no tag', weekHTML().indexOf('wc-tag') < 0, weekHTML().slice(0, 160));
}

// ═══ 6. THE DAY-DETAIL TAG IS RENDERED ══════════════════════════════════════
// P3 replaced the prepend with `if(false)`. Only a real openDetail call catches it.
// Titles with an apostrophe and an ampersand are kept: esc() handles them and that must
// not silently regress into broken markup.
[
  ['Recovery Lift'],
  ["Farmer's & Rower's Day"],
  ['Push & Pull'],
  ["Coach's Choice"]
].forEach(([title]) => {
  const prog = mkProg(REST_TODAY_TRAINS, title);
  install(prog, null, EXP_WEEK);
  setWild([{ title: 'Chaos Workout', ts: 1, week: EXP_WEEK, dayKey: TODAY_KEY }]);
  let threw = null;
  try { IA.eval('openDetail(' + JSON.stringify(TODAY_KEY) + ', activeProg.weeks[' + EXP_WEEK + '][' + JSON.stringify(TODAY_KEY) + '])'); }
  catch (e) { threw = e.message; }
  const d = detailHTML();
  ok('detail[' + title + ']: openDetail ran and wrote the body', threw === null && d.length > 0, threw || 'empty body');
  ok('detail[' + title + ']: the body emits a .wc-tag block', d.indexOf('class="wc-tag"') >= 0, d.slice(0, 200));
  ok('detail[' + title + ']: the tag is the FIRST thing in the body', d.indexOf('<div class="wc-tag"') === 0, d.slice(0, 120));
  // Independent oracle for the escaped form: HTML entity rules, written out by hand here,
  // not read back from esc().
  const handEsc = (title + ' is still on the board.')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  ok('detail[' + title + ']: the tag interpolates the real title, escaped by hand-checked entity rules',
     d.indexOf(handEsc) >= 0, handEsc + ' || ' + d.slice(d.indexOf('wc-tag'), d.indexOf('wc-tag') + 260));
  ok('detail[' + title + ']: no raw apostrophe or bare ampersand survived into the tag',
     (() => { const t = d.slice(d.indexOf('<div class="wc-tag"'), d.indexOf('</div></div>') + 12);
              return t.indexOf("'") < 0 && !/&(?!amp;|#39;|quot;|lt;|gt;|nbsp;|#\d+;)/.test(t); })(),
     d.slice(d.indexOf('<div class="wc-tag"'), d.indexOf('<div class="wc-tag"') + 240));
  // Same day, no Wildcard: the tag must be absent, so the assertion above is not a constant.
  IA.localStorage.removeItem('ia_wild_' + PID);
  IA.eval('openDetail(' + JSON.stringify(TODAY_KEY) + ', activeProg.weeks[' + EXP_WEEK + '][' + JSON.stringify(TODAY_KEY) + '])');
  ok('detail[' + title + ']: with no Wildcard the body carries no tag', detailHTML().indexOf('wc-tag') < 0, detailHTML().slice(0, 120));
});

// ═══ 7. STREAK PRECEDENCE, INCLUDING THE V195 SKIP RESCUE ═══════════════════
// Ruling (D71b): the skip describes the PRESCRIBED SESSION, the Wildcard describes what the
// athlete actually did. The streak measures attendance, so a Wildcard counts even on a day
// marked skipped. A skipped day with NO Wildcard still breaks: that is the control.
{
  const SCHED = handScheduled(REST_TODAY_TRAINS);
  const today = SCHED[SCHED.length - 1];
  const prev  = SCHED[SCHED.length - 2];
  const prev2 = SCHED[SCHED.length - 3];
  const K = x => 'w' + x.week + '_' + x.d;
  const C = { title: 'Recovery Lift', ts: 1, status: 'complete' };
  const S = { title: 'Recovery Lift', ts: 1, status: 'skipped' };
  const W = x => ({ title: 'Chaos Workout', ts: 1, week: x.week, dayKey: x.d });

  ok('streak: the hand walk puts today last in the scheduled list',
     today.d === TODAY_KEY && today.week === EXP_WEEK && prev.date < today.date, JSON.stringify([prev, today]));

  // CONTROL. today skipped, no Wildcard, two priors complete. Walk from the end: skip breaks.
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), { [K(today)]: S, [K(prev)]: C, [K(prev2)]: C }, EXP_WEEK);
  ok('streak/control: a skipped day with NO Wildcard still breaks the streak to 0',
     IA.eval('computeStreak()') === 0, String(IA.eval('computeStreak()')));
  ok('streak/control: skippedCount is 1 and completedCount is 2',
     IA.eval('skippedCount()') === 1 && IA.eval('completedCount()') === 2,
     IA.eval('skippedCount()') + '/' + IA.eval('completedCount()'));

  // THE RESCUE. Same state, plus a Wildcard on the skipped day.
  // Hand walk backwards: today (skipped + Wildcard) counts 1, prev complete 2, prev2 complete 3,
  // everything earlier is pending and transparent. Expect 3.
  setWild([W(today)]);
  ok('streak/rescue: a Wildcard on a SKIPPED day rescues the streak, 0 -> 3',
     IA.eval('computeStreak()') === 3, String(IA.eval('computeStreak()')));
  ok('streak/rescue: completedCount and skippedCount are unmoved by the rescue',
     IA.eval('completedCount()') === 2 && IA.eval('skippedCount()') === 1,
     IA.eval('completedCount()') + '/' + IA.eval('skippedCount()'));

  // ORDER OF EVENTS IS IRRELEVANT. Both sequences land on the same stored state.
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), null, EXP_WEEK);
  setWild([W(today)]);                                                            // Wildcard first
  IA.localStorage.setItem('ia_comp_' + PID, JSON.stringify({ [K(today)]: S, [K(prev)]: C, [K(prev2)]: C }));
  const wildFirst = IA.eval('computeStreak()');
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), { [K(today)]: S, [K(prev)]: C, [K(prev2)]: C }, EXP_WEEK);
  setWild([W(today)]);                                                            // skip first
  const skipFirst = IA.eval('computeStreak()');
  ok('streak/rescue: skip-then-Wildcard and Wildcard-then-skip give the same streak (3)',
     wildFirst === 3 && skipFirst === 3, 'wildcard-first ' + wildFirst + ' skip-first ' + skipFirst);

  // A skip BEHIND the rescued day still breaks there. The rescue is per day, not a blanket.
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), { [K(today)]: S, [K(prev)]: S, [K(prev2)]: C }, EXP_WEEK);
  setWild([W(today)]);
  ok('streak/rescue: the rescue is per day — an unrescued skip behind it still breaks, streak 1',
     IA.eval('computeStreak()') === 1, String(IA.eval('computeStreak()')));

  // Both days rescued: the walk carries through two skips.
  setWild([W(today), W(prev)]);
  ok('streak/rescue: two consecutive rescued skips both count, streak 3',
     IA.eval('computeStreak()') === 3, String(IA.eval('computeStreak()')));

  // PRECEDENCE. complete + Wildcard on one day counts ONCE.
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), { [K(today)]: C }, EXP_WEEK);
  const beforeDouble = IA.eval('computeStreak()');
  setWild([W(today)]);
  ok('streak/precedence: a day holding BOTH a completion and a Wildcard counts once, 1 -> 1',
     beforeDouble === 1 && IA.eval('computeStreak()') === 1, beforeDouble + ' -> ' + IA.eval('computeStreak()'));

  // Wildcard alone on a pending day still extends (the V195 first-pass behaviour, kept).
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), null, EXP_WEEK);
  setWild([W(today)]);
  ok('streak: a Wildcard on a pending day starts a streak of 1', IA.eval('computeStreak()') === 1, String(IA.eval('computeStreak()')));
  ok('streak: it did so without writing a completion', IA.eval('completedCount()') === 0, String(IA.eval('completedCount()')));

  // REST DAY. scheduledDays drops it before any status lookup, so it neither extends nor breaks.
  const SR = handScheduled(REST_TODAY_RESTS);
  install(mkProg(REST_TODAY_RESTS, 'Recovery Lift'), { [K(SR[SR.length-1])]: C, [K(SR[SR.length-2])]: C }, EXP_WEEK);
  const restBefore = IA.eval('computeStreak()');
  setWild([{ title: 'Chaos Workout', ts: 1, week: EXP_WEEK, dayKey: TODAY_KEY }]);
  ok('streak/rest: a rest-day Wildcard neither extends nor breaks, 2 -> 2',
     restBefore === 2 && IA.eval('computeStreak()') === 2, restBefore + ' -> ' + IA.eval('computeStreak()'));
  ok('streak/rest: today’s rest day is absent from scheduledDays entirely',
     IA.eval("scheduledDays(new Date()).filter(function(x){return x.week===" + EXP_WEEK + "&&x.d==='" + TODAY_KEY + "';}).length") === 0,
     'rest day reached the streak walk');
  // A rest day marked skipped by hand plus a Wildcard is still invisible.
  IA.localStorage.setItem('ia_comp_' + PID, JSON.stringify({ [K(SR[SR.length-1])]: C, [K(SR[SR.length-2])]: C, ['w' + EXP_WEEK + '_' + TODAY_KEY]: S }));
  ok('streak/rest: a skipped rest day carrying a Wildcard is still invisible to the streak',
     IA.eval('computeStreak()') === 2, String(IA.eval('computeStreak()')));
}

// ═══ 8. THE FLOW NEVER TOUCHES THE COMPLETION WRITERS ═══════════════════════
{
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  tryOk('source: completeWildcard calls no completion writer', () => {
    const src = strip(IA.eval('completeWildcard.toString()'));
    const banned = ['markDayComplete', 'snapshotDay', 'ia_comp_', 'saveCompleted', 'fireCompletionPopup', 'fireSeasonPopup', 'skipped'];
    const hit = banned.filter(b => src.indexOf(b) >= 0);
    return { cond: hit.length === 0, detail: 'contains ' + hit.join(', ') };
  });
  tryOk('source: the Wildcard celebration cannot escalate', () => {
    const src = strip(IA.eval('fireWildcardPopup.toString()'));
    const calls = (src.match(/\b[A-Za-z_$][\w$]*\s*\(/g) || []).map(x => x.replace(/\s*\($/, ''));
    const bad = calls.filter(c => /[Ss]eason|Completion|markDayComplete|snapshot/.test(c));
    return { cond: bad.length === 0 && calls.filter(c => c === 'popFire').length === 1, detail: 'calls=' + calls.join(',') };
  });
  tryOk('source: completedCount never reads the Wildcard store', () => {
    const src = strip(IA.eval('completedCount.toString()'));
    return { cond: src.indexOf('ia_wild_') < 0 && src.indexOf('ildcard') < 0, detail: src };
  });
  tryOk('source: skippedCount never reads the Wildcard store', () => {
    const src = strip(IA.eval('skippedCount.toString()'));
    return { cond: src.indexOf('ia_wild_') < 0 && src.indexOf('ildcard') < 0, detail: src };
  });
  tryOk('source: refreshProgram cannot see a Wildcard day as trained', () => {
    const src = strip(IA.eval('refreshProgram.toString()'));
    return { cond: src.indexOf('ia_wild_') < 0 && src.indexOf('ildcard') < 0, detail: 'refreshProgram reads the Wildcard store' };
  });
  tryOk('source: no "skipped" string in the Wildcard flow (comments stripped)', () => {
    const fns = ['completeWildcard','fireWildcardPopup','wildcardDayFor','wildcardDaySet','wildcardOn','wildcardMarkHTML','wildcardTagHTML'];
    const hits = fns.filter(f => strip(IA.eval(f + '.toString()')).indexOf('skipped') >= 0);
    return { cond: hits.length === 0, detail: hits.join(',') };
  });
}

// ═══ 9. THE MARK ════════════════════════════════════════════════════════════
{
  const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
  tryOk('mark: flame plus a W, inline SVG, never emoji', () => {
    const h = IA.eval('wildcardMarkHTML(14)');
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(h);
    return { cond: h.indexOf('<svg') >= 0 && h.indexOf(FLAME) >= 0 && h.indexOf('>W<') >= 0 && !emoji, detail: h };
  });
  ok('mark: the W is painted in signal orange #CF4E1A',
     /\.wc-mark\{[^}]*color:var\(--signal\)/.test(IA.html) && /--signal:#CF4E1A/.test(IA.html),
     'missing .wc-mark signal rule');
  ok('mark: no new glyph was authored (flame comes from the icon table)',
     (IA.html.match(/"flame":/g) || []).length === 1, 'flame key count');
}

// ═══ 10. COPY — HARVESTED OUT OF THE ARTIFACT, NEVER HAND-TYPED INTO A LOCAL ═
// Every string below is EXTRACTED from rendered output or from a captured popup payload,
// so it is a fact about index.html. It is then (a) compared to the ruled text, typed by
// hand from the ruling, and (b) run through the copy rule. The first cut of this gate ran
// the copy rule over a literal array declared here, which could not fail for any artifact.
{
  const harvest = {};
  const sub = h => { const m = h.match(/<div class="wc-tag-sub">([\s\S]*?)<\/div>/); return m ? m[1] : null; };
  const lbl = h => { const m = h.match(/<div class="wc-tag-lbl">([\s\S]*?)<\/div>/); return m ? m[1] : null; };

  // rest tag + rest popup
  install(mkProg(REST_TODAY_RESTS, 'Recovery Lift'), null, EXP_WEEK);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  IA.eval('currentWeek=' + EXP_WEEK); IA.eval('renderWeekView()');
  harvest.tagLabel = lbl(weekHTML());
  harvest.restSub = sub(weekHTML());
  let c = cap();
  harvest.popKicker = c && c.opts.kicker;
  harvest.popMsg = c && c.opts.msg;
  harvest.popSubRest = c && c.opts.sub;

  // training tag + training popup (two priors complete, so the sub reads "Streak: 3.")
  const ST = handScheduled(REST_TODAY_TRAINS);
  const seedT = {};
  ST.slice(-3, -1).forEach(x => { seedT['w' + x.week + '_' + x.d] = { title: 'Recovery Lift', ts: 1, status: 'complete' }; });
  install(mkProg(REST_TODAY_TRAINS, 'Recovery Lift'), seedT, EXP_WEEK);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  IA.eval('currentWeek=' + EXP_WEEK); IA.eval('renderWeekView()');
  harvest.trainSub = sub(weekHTML());
  c = cap();
  harvest.popSubTrain = c && c.opts.sub;

  // the filter-bar label, rendered
  IA.eval("randFilter='mine'; buildRandFilterBar();");
  const bm = barHTML().match(/setRandFilter\('mine'\)">([\s\S]*?)<\/button>/);
  harvest.filterLabel = bm ? bm[1] : null;

  // (a) the harvest IS the ruled text. Right-hand sides typed by hand from the ruling.
  const RULED = {
    tagLabel:    'WILDCARD DONE',
    restSub:     'Rest day. The streak sits this one out.',
    trainSub:    'Recovery Lift is still on the board.',
    popKicker:   'WILDCARD DONE',
    popMsg:      'You showed up. That is the whole game.',
    popSubRest:  'Streak holds.',
    popSubTrain: 'Streak: 3.',
    filterLabel: 'My Goal'
  };
  Object.keys(RULED).forEach(k => {
    ok('copy/harvest: ' + k + ' reads exactly the ruled text', harvest[k] === RULED[k],
       JSON.stringify(harvest[k]) + ' expected ' + JSON.stringify(RULED[k]));
  });

  // (b) the copy rule, applied to what was harvested.
  const HARVESTED = Object.keys(RULED).map(k => harvest[k]).filter(s => typeof s === 'string');
  ok('copy: every ruled string was actually harvested from the artifact', HARVESTED.length === Object.keys(RULED).length,
     HARVESTED.length + '/' + Object.keys(RULED).length + ' harvested');
  HARVESTED.forEach(s => {
    ok('copy: no mid-sentence hyphen or dash in the rendered string "' + s + '"', !/\S\s*[—–-]\s*\S/.test(s), s);
  });
  ok('copy: no user-facing "Nike" in any rendered Wildcard string', HARVESTED.every(s => s.indexOf('Nike') < 0),
     HARVESTED.filter(s => s.indexOf('Nike') >= 0).join(' | '));
  ok('copy: the word "skipped" appears in no rendered Wildcard string',
     HARVESTED.every(s => s.toLowerCase().indexOf('skipped') < 0),
     HARVESTED.filter(s => s.toLowerCase().indexOf('skipped') >= 0).join(' | '));
  ok('copy: no rendered Wildcard string claims a completion or a PR',
     HARVESTED.every(s => !/\b(complete|completed|PR\b|personal record)\b/i.test(s)),
     HARVESTED.filter(s => /\b(complete|completed|PR\b|personal record)\b/i.test(s)).join(' | '));

  // The filter-bar label lie, checked against the artifact rather than against a local.
  ok('label: the rendered filter bar says "My Goal" with no parenthetical',
     harvest.filterLabel === 'My Goal' && barHTML().indexOf('My Goal (') < 0, barHTML());
  ok('label: RAND_POOLS still has no endurance key and getActivePool still falls back',
     IA.RAND_POOLS && !IA.RAND_POOLS.endurance, 'D66 is a later version; V195 only stops the label lying');
}

// ═══ 11. THE THREE EXISTING ia_wild_ READERS SURVIVE THE WIDENED RECORD ═════
// The store now holds {title, ts, week, dayKey}; pre-V195 entries hold {title, ts}.
// Both shapes must still drive the "Done Before" badge and the x/y counter, which read
// TITLES only.
{
  install(mkProg(['sun'], 'Recovery Lift'), null, EXP_WEEK);
  const pool = IA.RAND_POOLS.balanced.map(w => w.title);
  const mixed = [
    { title: pool[0], ts: 1 },
    { title: pool[1], ts: 2, week: EXP_WEEK, dayKey: TODAY_KEY }
  ];
  setWild(mixed);
  tryOk('readers: the x/y counter counts both record shapes', () => {
    IA.eval('updateRandCounter()');
    const txt = IA.eval('__g195els.randCounter.textContent');
    return { cond: txt === '2/' + pool.length, detail: txt + ' expected 2/' + pool.length };
  });
  tryOk('readers: the Done Before badge still fires off the title, whatever the shape', () => {
    setWild(pool.map((t, i) => (i % 2 ? { title: t, ts: i } : { title: t, ts: i, week: EXP_WEEK, dayKey: TODAY_KEY })));
    IA.eval("randFilter='mine'; reroll();");
    const h = IA.eval('__g195els.randBody.innerHTML');
    return { cond: h.indexOf('Done Before') >= 0 && h.indexOf('wildcard-complete-btn') < 0, detail: h.slice(0, 200) };
  });
  tryOk('readers: an empty store still offers the Complete button', () => {
    IA.localStorage.removeItem('ia_wild_' + PID);
    IA.eval("randFilter='mine'; reroll();");
    const h = IA.eval('__g195els.randBody.innerHTML');
    return { cond: h.indexOf('wildcard-complete-btn') >= 0 && h.indexOf('Done Before') < 0, detail: h.slice(0, 200) };
  });
}

// ═══ 12. DST LATTICE ACROSS SEVEN TIMEZONES ═════════════════════════════════
// Re-exec of this file, once per zone, with only the lattice enabled. The child's counts
// are folded into this run's totals so the single PASS/FAIL summary covers all of them.
// A child that dies without a summary is counted as one FAIL, never as silence.
{
  TZ_LATTICE.forEach(tz => {
    let out = '', died = null;
    try {
      out = cp.execFileSync(process.execPath, [__filename, FILE], {
        env: Object.assign({}, process.env, { TZ: tz, G195_TZ_CHILD: tz }),
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000,
        stdio: ['ignore', 'pipe', 'pipe']          // capture stderr; do not leak a trace over the gate's output
      });
    } catch (e) { died = String((e && e.stderr) || (e && e.message) || 'child died').trim().split('\n')[0]; out = (e && (e.stdout || '')) || ''; }
    const m = out.match(/^G195_TZ_SUMMARY (\d+) (\d+)$/m);
    if (!m) {
      fail++;
      console.log('FAIL dst[' + tz + ']: the lattice child printed no summary (crash is not a pass)  -> ' + (died || out.slice(-300)));
      return;
    }
    const cPass = +m[1], cFail = +m[2];
    out.split('\n').filter(l => l.indexOf('FAIL ') === 0).forEach(l => console.log('     [' + tz + '] ' + l));
    pass += cPass; fail += cFail;
    console.log('     dst[' + tz + ']: ' + cPass + ' pass / ' + cFail + ' fail (folded in)');
    ok('dst[' + tz + ']: the whole lattice is clean in this zone', cFail === 0, cFail + ' failing assertions');
  });
}

console.log('PASS ' + pass + ' FAIL ' + fail);
