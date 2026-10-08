// g234_d213_swapkeep.js — GATE for D213 (P-SWAPKEEP: the sport chip credits, it never erases), D213 Amendment 1
// (the picker is the property, not the rest day: a moved-in day parks under its own key) and D214 (the swap note
// says what is kept).
//
//   node tests/gates/g234_d213_swapkeep.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v234_rulings/v234_ruling_d213_d214.md: D213 "Semantics" 1-4, the Before/After
// table, "Does not change"; D214 (both copy variants, both sites); Mario's concurrence; D213 Amendment 1 (restated
// reader property and its moved-in row). Session siting (V234 brief): key `parked`, shape
// parked:{run:{run_dist,run_pace,run_mins,run_reps,run_rep_time}, bike:{bike_mins}, swim:{swim_yards}}; a leaving set
// parks only when one of its fields is non-blank; arrival restores and deletes parked[arriving]; no empty parked:{}.
//
// ORACLES. Hand values, never asked of the engine (no CARDIO_PARK_FIELDS, cardioSwapNoteText, doseDerived, _fmtPaceMi):
//   the typed numbers 45 (minutes), 5 (miles), bike 40, swim 1000, reps 4, rep time 1:30, pace 9:00 (the ruling's table
//   and measure m1's constants); the derived pace 45 min / 5 mi = 9:00/mi and 45 min / 6 mi = 7:30/mi by hand; the
//   W1 SAT Long Run dose "3.1 mi" (the ruling's repro line); the sport field sets typed below from D213 Semantics 2;
//   the four D214 strings typed below verbatim from the ruling; W1 MILES 5 / 0 and DONE 1/5 by hand (one 5 mi log on the
//   week, HALF_MANNY W1 rests sun and wed, so 5 training days).
//   The engine is used only to drive the app (openDetail, setCardioSwap, persistLogFields, handleDayStatus,
//   renderWeekView, applyRestMove) and, in L1, to pick one representative day per (planned sport, dose kind).
//
// METHOD. The harness VM with the clock pinned to 2026-10-03 (a Saturday; program start 2026-09-28, so W1 SAT is
// today) and a DOM registry stub (measure m1's method, tests/measure/v234_swapkeep.js, extended with appendChild so
// renderWeekView runs): innerHTML is parsed for ids, so the form's hidden inputs are real registry nodes. Typing is a
// write to the hidden node followed by the input listener's body (persistLogFields). The wheel face is Mario's device
// check, not this gate's.
//
// VERSION PREDICATE (standing rulings 2 and 4). D213 and D214 ship at ia-version 234.
//   below 234      REFUSED, every row FAILS by name.
//   234 and up     every row asserts (a minimum, never one exact version).
//
// ROWS (W1 SAT Long Run on HALF_MANNY seed 76308, entry w1_sat, unless the row says otherwise)
//   K1   park on swap: run_* '' at top, swapTo bike, parked is {run} and parked.run's non-blank fields are exactly
//        {run_dist 5, run_mins 45, run_pace 9:00/mi}.
//   K2   typed target kept: bike 40 typed while swapped sits at top, then parks as parked.bike {bike_mins 40} on the
//        swap back (bike_mins '' at top).
//   K3   restore: the swap back puts 45 / 5 / 9:00/mi at top, swapFrom/swapTo '', parked has no run key; the hidden
//        inputs read 45 and 5, the strip is back (plan-strip, "3.1 mi"), the note is hidden.
//   K4   reopen: buildLogHTML from the stored entry gives the same form (run 45 / 5 after the swap back; bike 40 while
//        swapped), and opening writes nothing.
//   K5   Mark Done carry: handleDayStatus while swapped leaves the entry byte-identical but for ts; ia_comp_ complete.
//   K6   saved first: Mark Done with 45 / 5, then swap: parked.run kept, run_* '' at top, ia_comp_ still complete,
//        week DONE 1/5 and MILES 0.
//   K7   three hops: run, bike 40, swim 1000, run: run back at top, parked exactly {bike 40, swim 1000}; then bike:
//        bike 40 back at top, parked {run, swim}.
//   K8   active chip: tapping the active sport changes nothing in the store but ts (on the planned and on a swapped sport).
//   K9   nothing typed: a swap (and two more hops and the swap back) leaves no `parked` key at all; clearing the run in
//        its own form, then swapping, parks nothing.
//   K10  moved-in day: the W1 SAT run moved onto the W1 rest day WED; the swap parks under w1_wed (not w1_sat) and the
//        swap back restores it there.
//   K11  wheel flush: a wheel still inside its settle window at the tap (miles 6, not yet committed) parks as 6, with
//        pace 7:30/mi.
//   N1   D214 variant one, exact, at both sites (setCardioSwap's note and the buildLogHTML render of a stored swap).
//   N2   D214 variant two, exact, at both sites; hidden at both sites once the swap is undone.
//   N3   D214 for a swim swap: both variants, exact, both sites.
//   N4   copy clean: no "Swapped from" or the old phrasing in the comment-stripped candidate; no em-dash, en-dash or
//        hyphen in any note text the app printed in N1-N3.
//   C1   credit: W1 MILES reads 5 with the run logged, 0 while swapped to bike (run parked, bike 40 typed), 5 after the
//        swap back (read from the rendered week stats).
//   L1   matrix: measure m1's 96-row shape (6 planned cells x 2 targets x typed/saved x back/3-hop/reopen/
//        type-target-then-back); every typed field parks on the swap and returns on return (store and form); a typed
//        target parks under its own sport; a saved day stays complete.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const S = require('../status')('g234_d213_swapkeep');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 234;

const ROWS = [
  ['K1', 'K1 park on swap: run_* blank at top, swapTo bike, parked.run is exactly {run_dist 5, run_mins 45, run_pace 9:00/mi}'],
  ['K2', 'K2 typed target kept: bike 40 typed while swapped parks as parked.bike {bike_mins 40} on the swap back'],
  ['K3', 'K3 restore: swap back puts 45 / 5 / 9:00/mi at top, swapTo blank, no parked.run, hidden 45 and 5, strip back, note hidden'],
  ['K4', 'K4 reopen: buildLogHTML from the stored entry gives the same form values, and opening writes nothing'],
  ['K5', 'K5 Mark Done while swapped keeps the entry byte-identical but for ts; ia_comp_ complete'],
  ['K6', 'K6 saved first: Mark Done with 45 / 5 then swap to bike: parked.run kept, still complete, DONE 1/5, MILES 0'],
  ['K7', 'K7 three hops run, bike 40, swim 1000, run keep every typed set and restore run; then bike restores bike 40'],
  ['K8', 'K8 tapping the active chip changes nothing in the store but ts'],
  ['K9', 'K9 nothing typed: swaps leave no parked key at all; clearing the run in its own form then swapping parks nothing'],
  ['K10', 'K10 moved-in day: a run moved onto the rest day parks under the rest day key and comes back there'],
  ['K11', 'K11 a wheel still settling at the tap parks its pending value (miles 6, pace 7:30/mi)'],
  ['N1', 'N1 D214 variant one exact at both sites: "Counts toward Bike, not Run."'],
  ['N2', 'N2 D214 variant two exact at both sites, hidden at both once the swap is undone'],
  ['N3', 'N3 D214 for a swim swap: both variants exact at both sites'],
  ['N4', 'N4 copy clean: no "Swapped from" in the stripped source; no dash or hyphen in any printed note'],
  ['C1', 'C1 credit: W1 MILES 5 logged, 0 while swapped to bike, 5 after the swap back'],
  ['L1', 'L1 swap matrix (measure m1 shape, 96 rows): every typed field parks on the swap and returns on return'],
];
S.declare(ROWS.map(r => r[0]));
const failAll = (why, detail) => { for(const [id, l] of ROWS) S.fail(id, l + ' (' + why + ')', detail); S.summary(); };

// ── hand oracles ────────────────────────────────────────────────────────────────────────────────────────────────
const SETS = { run:['run_dist','run_pace','run_mins','run_reps','run_rep_time'], bike:['bike_mins'], swim:['swim_yards'] };
const ALLF = SETS.run.concat(SETS.bike, SETS.swim);
const RUN_PARKED = { run_dist:'5', run_mins:'45', run_pace:'9:00/mi' };          // 45 min / 5 mi = 9:00/mi
const RUN_PARKED6 = { run_dist:'6', run_mins:'45', run_pace:'7:30/mi' };         // 45 min / 6 mi = 7:30/mi
const NOTE = {
  bike1:'Counts toward Bike, not Run.',
  bike2:'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.',
  swim1:'Counts toward Swim, not Run.',
  swim2:'Counts toward Swim, not Run. Your Run numbers are kept. Switch back and they return.',
};
const TYPED = { run_mins:'45', run_dist:'5', run_pace:'9:00', run_reps:'4', run_rep_time:'1:30', bike_mins:'40', swim_yards:'1000' };
const PLAN_FACE = '3.1 mi';     // W1 SAT Long Run dose, the ruling's repro line
const CLOCK = '2026-10-03', START = '2026-09-28';
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const J = JSON.stringify;
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');

// ── version predicate ───────────────────────────────────────────────────────────────────────────────────────────
let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }
console.log('g234 D213/D214 swapkeep | candidate ' + ART + ' ia-version ' + STAMP);
if(!(STAMP >= ERA)){
  console.log('REFUSED: ia-version ' + STAMP + ' predates D213 P-SWAPKEEP and D214 (V' + ERA + '). No row may pass on it.');
  failAll('REFUSED');
}

// ── VM with a DOM registry stub ─────────────────────────────────────────────────────────────────────────────────
let IA, E, LS, REG;
function boot(){
  IA = H.load(ART); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  IA.ctx.Date = FD; E = IA.eval; LS = IA.localStorage; REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal)/;
  function mk(id){ const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'',
      children:[], childNodes:[], offsetLeft:0, offsetWidth:0, clientWidth:0,
      classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){},
      appendChild(c){ this.children.push(c); return c; }, removeChild(c){ return c; }, insertBefore(c){ return c; },
      getBoundingClientRect(){ return { left:0, top:0, width:0, height:0, right:0, bottom:0 }; }, scrollTo(){}, scrollIntoView(){},
      querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
      get innerHTML(){ return this._html; }, set innerHTML(h){ setHTML(this, String(h)); } }; return el; }
  function setHTML(el, h){
    const drop = k => { const c = REG.get(k); if(c){ c._kids.forEach(drop); REG.delete(k); } };
    el._kids.forEach(drop); el._kids = []; el._html = h;
    const re = /<(input|textarea|div|button|span|select)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(h))){ const id = m[3], attrs = m[2] + ' ' + m[4]; const c = mk(id);
      const v = /\bvalue="([^"]*)"/.exec(attrs); if(v) c.value = v[1].replace(/&quot;/g, '"');
      if(m[1] === 'textarea') c.value = h.slice(re.lastIndex, h.indexOf('</textarea>', re.lastIndex));
      attrs.replace(/\bdata-([a-z]+)="([^"]*)"/g, (a, k, val) => { c.dataset[k] = val; });
      REG.set(id, c); el._kids.push(id);
      if(id === 'cardioFields'){ const end = h.indexOf('id="cardioSwapLink"', re.lastIndex); const inner = h.slice(re.lastIndex, end < 0 ? undefined : end);
        c._html = inner; const re2 = /\bid="([^"]+)"/g; let m2; while((m2 = re2.exec(inner))) c._kids.push(m2[1]); }
    }
  }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); if(NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };
}
const tryv = f => { try { return f(); } catch(e){ return { threw:String(e && e.message || e) }; } };
const logs = pid => JSON.parse(LS.getItem('ia_logs_' + pid) || '{}');
const entry = (pid, k) => logs(pid)[k] || null;
const noTs = L => { if(!L) return L; const o = Object.assign({}, L); delete o.ts; return J(o); };
const comp = (pid, k) => (JSON.parse(LS.getItem('ia_comp_' + pid) || '{}')[k] || {}).status || null;
const nonBlank = o => { const r = {}; Object.keys(o || {}).forEach(f => { if(o[f] !== '' && o[f] != null) r[f] = o[f]; }); return r; };
const sameMap = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return J(ka) === J(kb) && ka.every(k => String(a[k]) === String(b[k])); };
const topBlank = (L, sport) => !!L && SETS[sport].every(f => (L[f] == null ? '' : L[f]) === '');
function install(cfg, pid){
  const prog = IA.buildProgram(JSON.parse(J(cfg)));
  prog.id = pid; prog.name = pid; prog.created = 1; prog.startDate = START; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(J(cfg)); prog.overlays = [];
  ['ia_logs_','ia_comp_','ia_hist_','ia_moves_'].forEach(k => LS.removeItem(k + pid));
  LS.setItem('ia_programs', J([prog])); LS.setItem('ia_active', pid);
  IA.ctx.__P = prog; E('activeProgId="' + pid + '"; activeProg=__P; currentWeek=1;'); return prog;
}
function open(dk){ REG.clear(); return tryv(() => E('openDetail("' + dk + '", activeProg.weeks[currentWeek]["' + dk + '"])')); }
const swap = s => tryv(() => E('setCardioSwap("' + s + '")'));
// V236 (D218 "Existing rows that flip": type() wrote the node then persisted in DRAFT, which stores no cardio number):
// from VER 236 the helper's write is the commit the Log tap makes (persistLogFields(day,true)); on a LIVE card that is
// byte-for-byte the listener's own write. VER <= 235 is unchanged. Setup only: no claim moves.
const persist = dk => tryv(() => E('persistLogFields("' + dk + '"' + (STAMP >= 236 ? ',true' : '') + ')'));
function type(dk, vals){ for(const f of Object.keys(vals)){ const el = REG.get('log_' + f); if(!el) return 'no input log_' + f; el.value = vals[f]; } persist(dk); return ''; }
const hid = f => { const el = REG.get('log_' + f); return el ? el.value : null; };
const fieldIds = () => ((REG.get('cardioFields') || {})._kids || []).filter(id => /^log_(run|bike|swim)_/.test(id));
const fieldsHTML = () => (REG.get('cardioFields') || {})._html || '';
const active = () => ((REG.get('cardioSwapWrap') || {}).dataset || {}).active;
function renderNote(){   // the note as buildLogHTML rendered it (right after open)
  for(const el of REG.values()){ const m = /id="cardioSwapNote"[^>]*display:(\w+)[^>]*>([^<]*)</.exec(el._html || ''); if(m) return { display:m[1], text:m[2] }; }
  return null; }
function liveNote(){ const n = REG.get('cardioSwapNote'); return n ? { display:n.style.display, text:n.textContent || '' } : null; }
function weekStats(){ const r = tryv(() => E('renderWeekView()')); const out = { threw:r && r.threw };
  for(const el of REG.values()){ const h = el._html || '';
    const mi = /<div class="wk-stat-num" style="color:var\(--run\)">([^<]*)<\/div><div class="wk-stat-lbl">MILES<\/div>/.exec(h);
    const dn = /<div class="wk-stat-num">(\d+)<span class="den">\/(\d+)<\/span><\/div><div class="wk-stat-lbl">DONE<\/div>/.exec(h);
    if(mi) out.miles = mi[1]; if(dn) out.done = dn[1] + '/' + dn[2]; }
  return out; }
const markDone = dk => tryv(() => E('handleDayStatus("' + dk + '","Long Run","complete")'));

boot();
const MANNY = JSON.parse(J(H.fixtures.HALF_MANNY)), PID = 'p_g234', K = 'w1_sat';
function fresh(){ install(MANNY, PID); return open('sat'); }
const ROWCHK = (id, list) => { const bad = list.filter(c => !c[0]).map(c => c[1]); S.check(id, !bad.length, ROWS.find(r => r[0] === id)[1], bad.slice(0, 4).join(' | ')); };
const NOTES_SEEN = [];

// precondition: the repro day is the ruling's (W1 SAT Long Run, planned run, dose 3.1 mi)
fresh();
const PRE = { sub:E('activeProg.weeks[1].sat.cardio && activeProg.weeks[1].sat.cardio.subtype'), wrap:J((REG.get('cardioSwapWrap') || {}).dataset), strip:/class="plan-strip"/.test(fieldsHTML()) && fieldsHTML().includes(PLAN_FACE) };
console.log('INFO repro day W1 SAT ' + J(PRE.sub) + ' wrap ' + PRE.wrap + ' strip ' + PRE.strip);
// D218/D219 Amendment 1 (d): from VER 236 the wrap carries the regime attribute at every render, '0' on an empty store
// (D218 item 1); the exact-dataset compare is kept.
const preOk = PRE.sub === 'Long Run' && PRE.wrap === J(STAMP >= 236 ? { planned:'run', active:'run', logged:'0' } : { planned:'run', active:'run' }) && PRE.strip;
const preWhy = preOk ? '' : 'precondition: W1 SAT is not the ruling\'s Long Run run day with a 3.1 mi strip (' + J(PRE) + ')';

// ── K1, K2, K3, K4, N2 (live), C1: the repro walk ───────────────────────────────────────────────────────────────
{
  fresh(); const c1 = [], k1 = [], k2 = [], k3 = [], k4 = [], n2 = [];
  const t = type('sat', { run_mins:'45', run_dist:'5' });
  const L0 = entry(PID, K);
  k1.push([preOk, preWhy], [!t, t], [!!L0 && L0.run_mins === '45' && L0.run_dist === '5' && L0.run_pace === '9:00/mi', 'typed 45 / 5 did not store 45 / 5 / 9:00/mi: ' + J(L0)]);
  const w0 = weekStats(); c1.push([w0.miles === '5', 'logged: MILES ' + J(w0.miles) + (w0.threw ? ' (renderWeekView threw ' + w0.threw + ')' : '') + ' want 5']);
  const s1 = swap('bike'); const L1 = entry(PID, K), n1 = liveNote(); NOTES_SEEN.push(n1 && n1.text);
  k1.push([!(s1 && s1.threw), 'setCardioSwap threw ' + J(s1)],
    [topBlank(L1, 'run'), 'run_* not blank at top after the swap: ' + J(L1)],
    [!!L1 && L1.swapTo === 'bike' && L1.swapFrom === 'run', 'swapFrom/swapTo ' + J(L1 && [L1.swapFrom, L1.swapTo]) + ' want run/bike'],
    [!!L1 && !!L1.parked && J(Object.keys(L1.parked)) === J(['run']), 'parked keys ' + J(L1 && L1.parked && Object.keys(L1.parked)) + ' want ["run"]'],
    [!!L1 && !!L1.parked && sameMap(nonBlank(L1.parked.run), RUN_PARKED), 'parked.run non-blank ' + J(L1 && L1.parked && nonBlank(L1.parked.run)) + ' want ' + J(RUN_PARKED)],
    [active() === 'bike' && hid('bike_mins') === '' && !/plan-strip/.test(fieldsHTML()), 'bike form: active ' + J(active()) + ' hidden bike ' + J(hid('bike_mins')) + ' strip ' + /plan-strip/.test(fieldsHTML())]);
  n2.push([!!n1 && n1.display === 'block' && n1.text === NOTE.bike2, 'setCardioSwap note ' + J(n1) + ' want block ' + J(NOTE.bike2)]);
  const w1 = weekStats(); c1.push([w1.miles === '0', 'swapped, nothing on bike: MILES ' + J(w1.miles) + ' want 0']);
  const t2 = type('sat', { bike_mins:'40' }); const L2 = entry(PID, K);
  k2.push([!t2, t2], [!!L2 && L2.bike_mins === '40' && !!L2.parked && sameMap(nonBlank(L2.parked.run), RUN_PARKED), 'bike 40 typed while swapped: ' + J(L2)]);
  const w2 = weekStats(); c1.push([w2.miles === '0', 'swapped, bike 40: MILES ' + J(w2.miles) + ' want 0']);
  // reopen while swapped (K4 b; N2 render site)
  open('sat'); const rn = renderNote(); NOTES_SEEN.push(rn && rn.text);
  k4.push([active() === 'bike' && hid('bike_mins') === '40' && noTs(entry(PID, K)) === noTs(L2) && entry(PID, K).ts === L2.ts, 'reopen while swapped: active ' + J(active()) + ' hidden bike ' + J(hid('bike_mins')) + ' stored ' + J(entry(PID, K))]);
  n2.push([!!rn && rn.display === 'block' && rn.text === NOTE.bike2, 'buildLogHTML note ' + J(rn) + ' want block ' + J(NOTE.bike2)]);
  swap('run'); const L3 = entry(PID, K), n3 = liveNote();
  k2.push([!!L3 && !!L3.parked && sameMap(nonBlank(L3.parked.bike), { bike_mins:'40' }) && (L3.bike_mins || '') === '', 'swap back: parked.bike ' + J(L3 && L3.parked && L3.parked.bike) + ' top bike_mins ' + J(L3 && L3.bike_mins)]);
  k3.push([!!L3 && L3.run_mins === '45' && L3.run_dist === '5' && L3.run_pace === '9:00/mi', 'top after swap back ' + J(L3 && [L3.run_mins, L3.run_dist, L3.run_pace]) + ' want 45 / 5 / 9:00/mi'],
    [!!L3 && (L3.swapTo || '') === '' && (L3.swapFrom || '') === '', 'swapFrom/swapTo ' + J(L3 && [L3.swapFrom, L3.swapTo]) + ' want blank'],
    [!!L3 && !(L3.parked && 'run' in L3.parked), 'parked still has run: ' + J(L3 && L3.parked)],
    [hid('run_mins') === '45' && hid('run_dist') === '5', 'hidden inputs ' + J([hid('run_mins'), hid('run_dist')]) + ' want 45, 5'],
    [/class="plan-strip"/.test(fieldsHTML()) && fieldsHTML().includes(PLAN_FACE), 'the 3.1 mi plan strip is not back on the run form'],
    [!!n3 && n3.display === 'none' && n3.text === '', 'note after swap back ' + J(n3) + ' want hidden']);
  n2.push([!!n3 && n3.display === 'none' && n3.text === '', 'setCardioSwap note after swap back ' + J(n3) + ' want hidden']);
  const w3 = weekStats(); c1.push([w3.miles === '5', 'swapped back: MILES ' + J(w3.miles) + ' want 5']);
  open('sat'); const rn2 = renderNote(), L4 = entry(PID, K);
  k4.push([active() === 'run' && hid('run_mins') === '45' && hid('run_dist') === '5' && /plan-strip/.test(fieldsHTML()), 'reopen after swap back: active ' + J(active()) + ' hidden ' + J([hid('run_mins'), hid('run_dist')])],
    [!!L4 && L4.ts === L3.ts && noTs(L4) === noTs(L3), 'opening wrote the entry: ' + J(L4)]);
  n2.push([!!rn2 && rn2.display === 'none' && rn2.text === '', 'buildLogHTML note after swap back ' + J(rn2) + ' want hidden']);
  ROWCHK('K1', k1); ROWCHK('K2', k2); ROWCHK('K3', k3); ROWCHK('K4', k4); ROWCHK('C1', c1);
  // N2 is closed below with its own walk added
  var N2LIST = n2;
}

// ── K5 Mark Done while swapped ──────────────────────────────────────────────────────────────────────────────────
{
  fresh(); const k5 = [];
  type('sat', { run_mins:'45', run_dist:'5' }); swap('bike'); type('sat', { bike_mins:'40' });
  const before = entry(PID, K); const r = markDone('sat'); const after = entry(PID, K);
  if(r && r.threw) console.log('INFO K5 handleDayStatus threw after its save (stub): ' + r.threw);
  k5.push([!!before && !!before.parked && sameMap(nonBlank(before.parked.run), RUN_PARKED), 'precondition parked.run ' + J(before && before.parked)],
    [noTs(after) === noTs(before), 'entry changed beyond ts: before ' + noTs(before) + ' after ' + noTs(after)],
    [comp(PID, K) === 'complete', 'ia_comp_ ' + J(comp(PID, K)) + ' want complete']);
  ROWCHK('K5', k5);
}

// ── K6 saved first ──────────────────────────────────────────────────────────────────────────────────────────────
{
  fresh(); const k6 = [];
  type('sat', { run_mins:'45', run_dist:'5' }); const r = markDone('sat');
  if(r && r.threw) console.log('INFO K6 handleDayStatus threw after its save (stub): ' + r.threw);
  k6.push([comp(PID, K) === 'complete', 'Mark Done: ia_comp_ ' + J(comp(PID, K))]);
  open('sat'); swap('bike'); const L = entry(PID, K);
  k6.push([!!L && !!L.parked && sameMap(nonBlank(L.parked.run), RUN_PARKED), 'parked.run ' + J(L && L.parked) + ' want ' + J(RUN_PARKED)],
    [topBlank(L, 'run') && L.swapTo === 'bike', 'top after swap ' + J(L)],
    [comp(PID, K) === 'complete', 'after swap ia_comp_ ' + J(comp(PID, K)) + ' want complete']);
  const w = weekStats();
  k6.push([w.done === '1/5' && w.miles === '0', 'week stats DONE ' + J(w.done) + ' MILES ' + J(w.miles) + ' want 1/5 and 0']);
  ROWCHK('K6', k6);
}

// ── K7 three hops ───────────────────────────────────────────────────────────────────────────────────────────────
{
  fresh(); const k7 = [];
  type('sat', { run_mins:'45', run_dist:'5' }); swap('bike'); type('sat', { bike_mins:'40' }); swap('swim');
  const La = entry(PID, K);
  k7.push([!!La && !!La.parked && sameMap(nonBlank(La.parked.run), RUN_PARKED) && sameMap(nonBlank(La.parked.bike), { bike_mins:'40' }) && J(Object.keys(La.parked).sort()) === J(['bike','run']), 'at swim: parked ' + J(La && La.parked)]);
  type('sat', { swim_yards:'1000' }); swap('run'); const Lb = entry(PID, K);
  k7.push([!!Lb && Lb.run_mins === '45' && Lb.run_dist === '5' && Lb.run_pace === '9:00/mi' && (Lb.swapTo || '') === '', 'back at run: top ' + J(Lb)],
    [!!Lb && !!Lb.parked && J(Object.keys(Lb.parked).sort()) === J(['bike','swim']) && sameMap(nonBlank(Lb.parked.bike), { bike_mins:'40' }) && sameMap(nonBlank(Lb.parked.swim), { swim_yards:'1000' }), 'back at run: parked ' + J(Lb && Lb.parked) + ' want {bike 40, swim 1000}'],
    [hid('run_mins') === '45' && hid('run_dist') === '5', 'run form hidden ' + J([hid('run_mins'), hid('run_dist')])]);
  swap('bike'); const Lc = entry(PID, K);
  k7.push([!!Lc && Lc.bike_mins === '40' && topBlank(Lc, 'run') && hid('bike_mins') === '40', 'at bike again: top ' + J(Lc) + ' hidden bike ' + J(hid('bike_mins'))],
    [!!Lc && !!Lc.parked && J(Object.keys(Lc.parked).sort()) === J(['run','swim']) && sameMap(nonBlank(Lc.parked.run), RUN_PARKED) && sameMap(nonBlank(Lc.parked.swim), { swim_yards:'1000' }), 'at bike again: parked ' + J(Lc && Lc.parked)]);
  ROWCHK('K7', k7);
}

// ── K8 active chip ──────────────────────────────────────────────────────────────────────────────────────────────
{
  fresh(); const k8 = [];
  type('sat', { run_mins:'45', run_dist:'5' }); const a0 = entry(PID, K); swap('run'); const a1 = entry(PID, K);
  k8.push([noTs(a0) === noTs(a1), 'tap run on run: ' + noTs(a0) + ' -> ' + noTs(a1)]);
  swap('bike'); type('sat', { bike_mins:'40' }); const b0 = entry(PID, K); swap('bike'); const b1 = entry(PID, K);
  k8.push([noTs(b0) === noTs(b1), 'tap bike on bike: ' + noTs(b0) + ' -> ' + noTs(b1)], [hid('bike_mins') === '40', 'bike form after tap: ' + J(hid('bike_mins'))]);
  ROWCHK('K8', k8);
}

// ── K9 nothing typed, and clearing ──────────────────────────────────────────────────────────────────────────────
{
  fresh(); const k9 = [];
  const steps = ['bike', 'swim', 'run', 'bike', 'run'];
  for(const s of steps){ swap(s); const L = entry(PID, K); k9.push([!!L && !('parked' in L), 'nothing typed, after swap to ' + s + ': ' + J(L)]); }
  fresh(); type('sat', { run_mins:'45', run_dist:'5' }); swap('bike'); swap('run');
  type('sat', { run_mins:'', run_dist:'' }); const Lc = entry(PID, K);
  k9.push([!!Lc && topBlank(Lc, 'run') && !('parked' in Lc), 'cleared in the run form: ' + J(Lc)]);
  swap('bike'); const Ld = entry(PID, K);
  k9.push([!!Ld && !('parked' in Ld) && Ld.swapTo === 'bike', 'cleared run then swap to bike: ' + J(Ld)]);
  ROWCHK('K9', k9);
}

// ── K10 moved-in day ────────────────────────────────────────────────────────────────────────────────────────────
{
  install(MANNY, PID); const k10 = [];
  const REST = 'wed', KW = 'w1_' + REST;   // HALF_MANNY W1 rests sun and wed (g000); the first in week order is wed
  const isRest = E('!!(activeProg.weeks[1].wed && activeProg.weeks[1].wed.rest)');
  const mv = tryv(() => E('openRestSheet(1,"' + REST + '","move"); _restDraft.pick="sat"; applyRestMove();'));
  if(mv && mv.threw) console.log('INFO K10 applyRestMove threw after the move (stub): ' + mv.threw);
  const moved = E('JSON.stringify({t:(activeProg.weeks[1].wed.cardio||{}).type, from:activeProg.weeks[1].wed.movedFrom})');
  k10.push([isRest && moved === J({ t:'run', from:'sat' }), 'precondition: wed rest ' + isRest + ', after the move ' + moved + ' want run from sat']);
  open(REST); const t = type(REST, { run_mins:'45', run_dist:'5' });
  k10.push([!t && (REG.get('cardioSwapWrap') || { dataset:{} }).dataset.planned === 'run', 'moved-in form: ' + (t || J((REG.get('cardioSwapWrap') || {}).dataset))]);
  swap('bike'); const Lw = entry(PID, KW), Ls = entry(PID, K);
  k10.push([!!Lw && Lw.swapTo === 'bike' && topBlank(Lw, 'run') && !!Lw.parked && sameMap(nonBlank(Lw.parked.run), RUN_PARKED), KW + ' after swap: ' + J(Lw)],
    [!(Ls && Ls.parked), 'w1_sat carries parked: ' + J(Ls)]);
  swap('run'); const Lr = entry(PID, KW);
  k10.push([!!Lr && Lr.run_mins === '45' && Lr.run_dist === '5' && Lr.run_pace === '9:00/mi' && !('parked' in Lr) && (Lr.swapTo || '') === '', KW + ' after swap back: ' + J(Lr)],
    [hid('run_mins') === '45' && hid('run_dist') === '5', 'moved-in form hidden ' + J([hid('run_mins'), hid('run_dist')])]);
  ROWCHK('K10', k10);
}

// ── K11 a wheel still settling at the tap ───────────────────────────────────────────────────────────────────────
{
  fresh(); const k11 = [];
  type('sat', { run_mins:'45', run_dist:'5' });
  // A column with a live settle timer, as iaWheelInit leaves one mid-coast: its settle writes the hidden node and
  // fires the input listener's body (_iawCommit -> 'input' -> persistLogFields + updateDoseDerived).
  const col = { _iawT:1, ran:0, _iawSettle(){ this._iawT = 0; this.ran++; const h = REG.get('log_run_dist'); if(h) h.value = '6'; E('persistLogFields(currentDayKey); updateDoseDerived();'); } };
  const wrap = REG.get('cardioSwapWrap'); const q0 = wrap.querySelectorAll;
  wrap.querySelectorAll = sel => /iaw-col/.test(sel) ? [col] : q0.call(wrap, sel);
  swap('bike'); const L = entry(PID, K);
  k11.push([col.ran === 1, 'the pending settle ran ' + col.ran + ' times before the park, want 1'],
    [!!L && !!L.parked && sameMap(nonBlank(L.parked.run), RUN_PARKED6), 'parked.run ' + J(L && L.parked && nonBlank(L.parked.run)) + ' want ' + J(RUN_PARKED6)],
    [topBlank(L, 'run'), 'run_* at top ' + J(L)]);
  ROWCHK('K11', k11);
}

// ── N1, N2, N3 the D214 copy at both sites ──────────────────────────────────────────────────────────────────────
function noteWalk(target, typed){
  fresh(); if(typed) type('sat', { run_mins:'45', run_dist:'5' });
  swap(target); const live = liveNote(); open('sat'); const ren = renderNote();
  NOTES_SEEN.push(live && live.text, ren && ren.text); return { live, ren };
}
{
  const n1 = [], n3 = [];
  const a = noteWalk('bike', false);
  n1.push([!!a.live && a.live.display === 'block' && a.live.text === NOTE.bike1, 'setCardioSwap ' + J(a.live) + ' want ' + J(NOTE.bike1)],
    [!!a.ren && a.ren.display === 'block' && a.ren.text === NOTE.bike1, 'buildLogHTML ' + J(a.ren) + ' want ' + J(NOTE.bike1)]);
  const b = noteWalk('bike', true);
  N2LIST.push([!!b.live && b.live.text === NOTE.bike2 && !!b.ren && b.ren.text === NOTE.bike2, 'second walk: ' + J(b)]);
  for(const [typed, want] of [[false, NOTE.swim1], [true, NOTE.swim2]]){ const w = noteWalk('swim', typed);
    n3.push([!!w.live && w.live.display === 'block' && w.live.text === want, (typed ? 'typed' : 'nothing typed') + ' setCardioSwap ' + J(w.live) + ' want ' + J(want)],
      [!!w.ren && w.ren.display === 'block' && w.ren.text === want, (typed ? 'typed' : 'nothing typed') + ' buildLogHTML ' + J(w.ren) + ' want ' + J(want)]); }
  ROWCHK('N1', [[preOk, preWhy]].concat(n1)); ROWCHK('N2', N2LIST); ROWCHK('N3', n3);
}

// ── N4 copy clean ───────────────────────────────────────────────────────────────────────────────────────────────
{
  const src = stripComments(fs.readFileSync(ART, 'utf8'));
  const old = (src.match(/Swapped from/g) || []).length, old2 = (src.match(/progress, not /g) || []).length;
  const seen = NOTES_SEEN.filter(x => x), dirty = seen.filter(x => /[\u2014\u2013-]/.test(x));
  ROWCHK('N4', [[old === 0 && old2 === 0, '"Swapped from" ' + old + ', "progress, not " ' + old2 + ' in the stripped candidate (want 0, 0)'],
    [seen.length >= 10, 'only ' + seen.length + ' note texts collected'], [!dirty.length, 'dash or hyphen in ' + J(dirty.slice(0, 2))]]);
}

// ── L1 the swap matrix (measure m1's shape) ─────────────────────────────────────────────────────────────────────
{
  const L = S.loop('L1', ROWS.find(r => r[0] === 'L1')[1]);
  const goalObj = (id, extra) => Object.assign({ id, label:id }, { mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, extra || {});
  function mkCfg(sports, f, ex, eq, rd, sd){
    const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
    const cg = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[1], s[2]); });
    return { name:'L', primaryPath:/^support_/.test(f) ? 'event' : 'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg,
      eventTargeted:race, raceDate:race ? '2026-12-20' : null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
      restDays:rd.slice(), days:H.DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
  }
  const SRC = [ ['HALF_MANNY', MANNY],
    ['run_10k+bike', mkCfg([['run','run_10k',{}],['bike','bike_base',{}]], 'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['run_pace', mkCfg([['run','run_pace_goal',{ targetDist:'1.5', targetMins:'10', targetSecs:'30' }]], 'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['run_base', mkCfg([['run','run_base',{}]], 'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['swim_base', mkCfg([['swim','swim_base',{}]], 'balanced','intermediate','commercial',['sun','wed'],76308)],
    ['bike_ftp', mkCfg([['bike','bike_ftp',{}]], 'balanced','intermediate','commercial',['sun','wed'],76308)] ];
  const WANT_CELLS = ['run:generic','run:time','run:dist','run:reps_dist','bike:dosed','swim:none'];
  const ctOf = d => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
  const DF = IA.eval('doseFromCardio'); const cells = {};
  for(const [nm, cfg] of SRC){ const p = IA.buildProgram(JSON.parse(J(cfg)));
    for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of ORDER){ const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || !ct) continue;
      const dose = DF(x.cardio); const kind = ct + ':' + (ct === 'run' ? (dose ? dose.k : 'generic') : (dose ? 'dosed' : 'none'));
      if(!cells[kind]) cells[kind] = { nm, cfg, w, d }; } }
  L.check(WANT_CELLS.every(k => cells[k]), 'cells', 'missing cells ' + J(WANT_CELLS.filter(k => !cells[k])) + ' of ' + J(Object.keys(cells)));
  let n = 0;
  for(const kind of WANT_CELLS){ const c = cells[kind]; if(!c) continue; const P = kind.split(':')[0];
    for(const saved of [false, true]) for(const T of ['run','bike','swim'].filter(s => s !== P)) for(const hop of ['back','3hop','reopen','typeT']){
      const pid = 'p_l' + (n++); install(c.cfg, pid); E('currentWeek=' + c.w); const key = 'w' + c.w + '_' + c.d; const bad = [];
      open(c.d);
      const typed = fieldIds().map(id => id.slice(4)).filter(f => TYPED[f] != null);
      const tv = {}; typed.forEach(f => { tv[f] = TYPED[f]; }); type(c.d, tv);
      if(!typed.length) bad.push('no typed field on the form');
      if(saved){ markDone(c.d); open(c.d); }
      swap(T); const sT = entry(pid, key) || {};
      typed.forEach(f => { if((sT[f] || '') !== '') bad.push('on swap ' + f + ' still at top'); if(!(sT.parked && sT.parked[P] && sT.parked[P][f] === TYPED[f])) bad.push('on swap parked.' + P + '.' + f + ' = ' + J(sT.parked && sT.parked[P] && sT.parked[P][f])); });
      let tf = null;
      if(hop === 'typeT'){ const ids = fieldIds().map(id => id.slice(4)).filter(f => TYPED[f] != null && SETS[T].includes(f)); tf = ids[0] || null;
        if(tf) type(c.d, { [tf]:TYPED[tf] }); else bad.push('no ' + T + ' field to type'); swap(P); }
      else if(hop === 'back') swap(P);
      else if(hop === '3hop'){ const T2 = ['run','bike','swim'].find(s => s !== P && s !== T); swap(T2); swap(P); }
      else if(hop === 'reopen'){ open(c.d); if(active() !== T) bad.push('reopen while swapped shows ' + J(active())); swap(P); }
      const sB = entry(pid, key) || {};
      typed.forEach(f => { if(sB[f] !== TYPED[f]) bad.push('back: top ' + f + ' = ' + J(sB[f])); if(hid(f) !== TYPED[f]) bad.push('back: form ' + f + ' = ' + J(hid(f))); });
      if(sB.parked && P in sB.parked) bad.push('back: parked.' + P + ' left behind');
      if((sB.swapTo || '') !== '') bad.push('back: swapTo ' + J(sB.swapTo));
      if(tf && !(sB.parked && sB.parked[T] && sB.parked[T][tf] === TYPED[tf])) bad.push('typed ' + T + ' ' + tf + ' not parked: ' + J(sB.parked));
      if(saved && comp(pid, key) !== 'complete') bad.push('saved day status ' + J(comp(pid, key)));
      L.check(!bad.length, kind + ' ' + (saved ? 'saved' : 'typed') + ' ->' + T + ' ' + hop, bad.slice(0, 3).join('; '));
    } }
  L.check(n === 96, 'count', n + ' matrix rows driven, want 96');
  console.log('INFO L1 drove ' + n + ' matrix rows over ' + Object.keys(cells).filter(k => WANT_CELLS.includes(k)).length + ' cells ' + J(WANT_CELLS.map(k => k + '=' + (cells[k] ? cells[k].nm + '/W' + cells[k].w + '/' + cells[k].d : 'MISSING'))));
  L.done();
}

S.summary();
