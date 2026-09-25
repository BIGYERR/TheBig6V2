// v221_swap_frozen.js — MEASURE (read-only). Is a session swap durable across a reboot, by day state?
// Question: P-SWAPFLOOR gate-scope item 2 claims a frozen-day re-swap "survives a reboot". Builder refuted it (G7-2b).
// This sweeps day state x touch kind x order x other-day touch x dated/dateless x pair x tree.
//   node tests/measure/v221_swap_frozen.js <V220.html> <D177tree.html>
// ORACLE: durability = the card at W5 Thu Main after reboot carries the name the athlete swapped TO (the athlete's own
// edit; the claim under test). Clock is pinned by a Date subclass in the VM; day state is date arithmetic from a fixed
// startDate 2026-08-24 (a Monday) so W5 Thu = 2026-09-24. Nothing asks the engine what the answer should be.
const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const TREES = { V220: process.argv[2], D177: process.argv[3] };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function MARIO(){ return { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null,
  liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308,
  injury:{ region:'knee', tier:'workaround' } }; }
const START = '2026-08-24', W = 5, D = 'thu', DONOR = 'Barbell box squat';
const PAIRS = { goblet:'Dumbbell goblet squat', verbatim:'Front squat' };
const CLOCKS = { future_prevwk:'2026-09-17', future_samewk:'2026-09-21', today:'2026-09-24', past_samewk:'2026-09-26', past_nextwk:'2026-09-29' };
function pin(IA, iso){ const T = new Date(iso + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  IA.ctx.Date = FD; }
const ctxs = {}; for(const k in TREES) ctxs[k] = load(TREES[k]);
const E = (IA, c) => IA.eval(c);
function setup(IA, dated){
  IA.localStorage.clear(); pin(IA, CLOCKS.today);
  const cfg = MARIO(), p = IA.buildProgram(cfg), st = JSON.parse(JSON.stringify(p));
  Object.assign(st, { id:'PM', name:'M', created:1, startDate:dated ? START : null, cfg:MARIO() });
  IA.ctx.__SP = st; E(IA, 'savePrograms([__SP]);');
  return p;
}
function boot(IA){ return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA){ E(IA, "currentWeek=" + W + ";currentDayKey='" + D + "';"); }
function day(IA){ return E(IA, 'activeProg.weeks[' + W + '].' + D); }
function loc(dy, name){ const ss = dy.sections || []; for(let si = 0; si < ss.length; si++){ const it = ss[si].items || []; for(let ii = 0; ii < it.length; ii++) if(clean(it[ii].name) === name) return { si, ii }; } return null; }
let L0 = null;   // Main slot of the donor on the build
function cardAt(IA){ const dy = day(IA); const it = dy && dy.sections && dy.sections[L0.si] && dy.sections[L0.si].items[L0.ii]; return it ? { name:clean(it.name), detail:it.detail } : { name:'(none)', detail:'' }; }
function swap(IA, from, to){ view(IA); const dy = day(IA), l = loc(dy, from); if(!l) return false;
  const it = dy.sections[l.si].items[l.ii]; IA.ctx.__c = { secIdx:l.si, itemIdx:l.ii, name:it.name, detail:it.detail }; IA.ctx.__to = to;
  E(IA, '_swapCtx=__c;applySwapChoice(__to);'); return true; }
function touch(IA, kind){ view(IA); const c = cardAt(IA); IA.ctx.__n = c.name; IA.ctx.__det = c.detail; IA.ctx.__title = day(IA).title || 'T';
  if(kind === 'draft') E(IA, "writeSetDraft(exStoreKey(__n),['5','5'],['95','95'],'');");
  if(kind === 'tick')  E(IA, "logExerciseWeight(__n,95,__det," + W + ",[5,5,5,5],[95,95,95,95],'" + D + "');");
  if(kind === 'done')  E(IA, "handleDayStatus('" + D + "',__title,'complete');");
  return c.name; }
function otherTouch(IA){ const wk = boot(IA); E(IA, "currentWeek=" + wk + ";currentDayKey='mon';writeSetDraft('zz_other',['1'],['1'],'');"); }
function readout(IA, target, loggedAs){
  const c = cardAt(IA), LS = IA.localStorage, J = k => JSON.parse(LS.getItem(k) || '{}');
  const sw = J('ia_swaps_PM')['w' + W + '_' + D], hs = J('ia_hist_PM')['w' + W + '_' + D];
  const hsIt = hs && hs.sections && hs.sections[L0.si] && hs.sections[L0.si].items[L0.ii];
  const exw = J('ia_exw_PM'), logs = J('ia_logs_PM')['w' + W + '_' + D];
  const exwKeys = Object.keys(exw).filter(k => (exw[k].entries || []).some(e => +e.week === W && (e.day === D)));
  const draftKeys = logs && logs.sets ? Object.keys(logs.sets) : [];
  const cardKey = E(IA, 'exStoreKey(' + JSON.stringify(c.name) + ')');
  const recKeys = exwKeys.concat(draftKeys);
  const st = E(IA, "getPrograms()[0].weeks[" + W + "]." + D); const stIt = st.sections[L0.si].items[L0.ii];
  return { card:c.name + ' :: ' + c.detail, durable:c.name === target, record:sw ? sw.map(e => e.from + '->' + e.to).join(',') : 'none',
    hist:hsIt ? clean(hsIt.name) + ' :: ' + hsIt.detail : 'none', exw:exwKeys.join(',') || '-', drafts:draftKeys.join(',') || '-',
    logsOnCard:recKeys.length ? recKeys.includes(cardKey) : null, orphan:recKeys.filter(k => k !== cardKey).join(',') || '-',
    comp:!!J('ia_comp_PM')['w' + W + '_' + D], storedGrid:clean(stIt.name) };
}
function run(tree, o){
  const IA = ctxs[tree]; const p = setup(IA, o.dated);
  if(!L0){ L0 = loc(p.weeks[W][D], DONOR); if(!L0) throw new Error('fixture moved: no ' + DONOR + ' on W5 Thu'); }
  pin(IA, CLOCKS[o.clock]); boot(IA);
  if(o.other) otherTouch(IA);
  boot(IA);                                   // athlete opens the app, then the day
  const to = PAIRS[o.pair]; let loggedAs = null, ok = true;
  if(o.touch === 'none'){ ok = swap(IA, DONOR, to); }
  else if(o.order === 'swap_then_touch'){ ok = swap(IA, DONOR, to); loggedAs = touch(IA, o.touch); }
  else { loggedAs = touch(IA, o.touch); ok = swap(IA, DONOR, to); }
  if(!ok) return { err:'donor not on card before swap' };
  const live = cardAt(IA).name;
  let undoLive = null;
  if(o.undo){ view(IA); E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); undoLive = cardAt(IA).name; }
  pin(IA, CLOCKS[o.reboot || o.clock]); const wk = boot(IA);
  const r = readout(IA, o.undo ? DONOR : to, loggedAs);
  return Object.assign({ live, undoLive, bootWk:wk, loggedAs }, r);
}
const out = [];
const P = s => { out.push(s); console.log(s); };
// Self-check: baseline equals itself (same config twice, same readout).
{ const o = { dated:true, clock:'today', pair:'goblet', touch:'draft', order:'swap_then_touch', other:false };
  const a = JSON.stringify(run('V220', o)), b = JSON.stringify(run('V220', o)); P('SELFCHECK V220 identical: ' + (a === b)); }
// ── SWEEP ──
const rows = [];
for(const tree of Object.keys(TREES)) for(const dated of [true, false]) for(const clock of Object.keys(CLOCKS))
  for(const pair of Object.keys(PAIRS)) for(const other of [false, true])
    for(const [touchK, order] of [['none', '-'], ['draft', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['done', 'swap_then_touch'], ['done', 'touch_then_swap']])
      for(const reboot of [null, 'past_nextwk']){
        if(reboot === clock) continue;
        const o = { tree, dated, clock, pair, other, touch:touchK, order, reboot };
        let r; try { r = run(tree, o); } catch(e){ r = { err:'CRASH ' + e.message }; }
        rows.push({ o, r });
      }
const crashes = rows.filter(x => x.r.err);
P('\nRUNS ' + rows.length + '  crashes/errors ' + crashes.length + (crashes.length ? ' e.g. ' + crashes[0].r.err + ' ' + JSON.stringify(crashes[0].o) : ''));
const good = rows.filter(x => !x.r.err);
const seg = (label, keyf) => { const m = new Map(); good.forEach(x => { const k = keyf(x.o); const v = m.get(k) || [0, 0]; v[1]++; if(x.r.durable) v[0]++; m.set(k, v); });
  P('\n-- durable by ' + label + ' (survived/total)'); [...m.keys()].sort().forEach(k => P('  ' + k.padEnd(62) + m.get(k)[0] + '/' + m.get(k)[1])); };
seg('tree', o => o.tree);
seg('tree|clock (reboot same day)', o => o.reboot ? '~' : o.tree + '|' + o.clock);
seg('tree|dated|clock|touch|order (reboot same day, no other-day touch, goblet)', o => (o.reboot || o.other || o.pair !== 'goblet') ? '~' : o.tree + '|' + (o.dated ? 'dated' : 'dateless') + '|' + o.clock + '|' + o.touch + '|' + o.order);
seg('other-day touch in the clock week (dated, reboot same day, touch none)', o => (o.reboot || !o.dated || o.touch !== 'none') ? '~' : o.tree + '|' + o.clock + '|other=' + o.other);
seg('reboot next week (dated, W6 Tue), by act clock|touch', o => (!o.reboot || !o.dated || o.other || o.pair !== 'goblet') ? '~' : o.tree + '|' + o.clock + '|' + o.touch + '|' + o.order);
seg('pair', o => o.tree + '|' + o.pair);
// Treatment of the record: how often is the swap record pruned, and when a reverted card is shown, where did it come from
const rev = good.filter(x => !x.r.durable);
P('\nREVERTED ' + rev.length + '/' + good.length + '; of those: record pruned ' + rev.filter(x => x.r.record === 'none').length +
  ', hist holds donor ' + rev.filter(x => /^Barbell box squat/.test(x.r.hist)).length + ', no hist ' + rev.filter(x => x.r.hist === 'none').length +
  ', logs orphaned against the card (records exist, none keyed to the card name) ' + rev.filter(x => x.r.logsOnCard === false).length +
  ', stored grid ever carries target ' + good.filter(x => x.r.storedGrid !== DONOR).length + '/' + good.length);
const SURV = good.filter(x => x.r.durable);
P('DURABLE ' + SURV.length + '/' + good.length + '; of those record kept ' + SURV.filter(x => x.r.record !== 'none').length + ', hist holds target ' + SURV.filter(x => x.r.hist !== 'none' && !/^Barbell box squat/.test(x.r.hist)).length);
// ── STATE TABLE (Mario's pair, dated, reboot same day, no other-day touch) ──
P('\n== STATE TABLE (goblet pair, dated, reboot same clock, no other-day touch) ==');
const show = x => P('  ' + [x.o.tree, x.o.clock, x.o.touch, x.o.order].join('|').padEnd(46) + ' live=' + x.r.live + ' | BOOT wk' + x.r.bootWk + ' ' + (x.r.durable ? 'SURVIVES' : 'REVERTS ') + ' card=' + x.r.card +
  ' | rec=' + x.r.record + ' | hist=' + x.r.hist + ' | exw=' + x.r.exw + ' drafts=' + x.r.drafts + ' onCard=' + x.r.logsOnCard + ' orphan=' + x.r.orphan + ' comp=' + x.r.comp);
good.filter(x => x.o.dated && !x.o.reboot && !x.o.other && x.o.pair === 'goblet').forEach(show);
P('\n== SAME, other-day touch in the clock week (Mon draft) ==');
good.filter(x => x.o.dated && !x.o.reboot && x.o.other && x.o.pair === 'goblet' && x.o.tree === 'V220').forEach(show);
P('\n== DATELESS (builder G7-2 construction), V220 ==');
good.filter(x => !x.o.dated && !x.o.reboot && !x.o.other && x.o.pair === 'goblet' && x.o.tree === 'V220' && x.o.clock === 'today').forEach(show);
// ── UNDO ──
P('\n== UNDO on W5 Thu, today, dated, goblet, reboot same day ==');
for(const tree of Object.keys(TREES)) for(const [t, ord] of [['none', '-'], ['draft', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['done', 'swap_then_touch'], ['done', 'touch_then_swap']]){
  const r = run(tree, { dated:true, clock:'today', pair:'goblet', other:false, touch:t, order:ord, undo:true });
  P('  ' + [tree, t, ord].join('|').padEnd(34) + ' afterSwap=' + r.live + ' afterUndo=' + r.undoLive + ' | BOOT card=' + r.card + ' (undo ' + (r.durable ? 'SURVIVES' : 'LOST') + ') rec=' + r.record + ' hist=' + r.hist);
}
// ── MARIO: act on V220, update to the D177 tree, reboot there ──
P('\n== MARIO: act on V220 today, carry localStorage to D177 tree, reboot (dated) ==');
for(const [t, ord] of [['none', '-'], ['draft', 'swap_then_touch'], ['tick', 'swap_then_touch'], ['done', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['done', 'touch_then_swap']]){
  const o = { dated:true, clock:'today', pair:'goblet', other:false, touch:t, order:ord };
  const A = ctxs.V220; const ra = run('V220', o);
  const snap = new Map(A.localStorage._map);
  const Bc = ctxs.D177; Bc.localStorage.clear(); snap.forEach((v, k) => Bc.localStorage.setItem(k, v)); pin(Bc, CLOCKS.today); boot(Bc);
  const rb = readout(Bc, PAIRS.goblet, null);
  P('  ' + [t, ord].join('|').padEnd(26) + ' V220 boot: ' + ra.card + '  ||  D177 boot: ' + rb.card + ' | rec=' + rb.record + ' | hist=' + rb.hist);
}
// fresh D177 swap at the same seam, for comparison
{ const r = run('D177', { dated:true, clock:'today', pair:'goblet', other:false, touch:'none', order:'-' }); P('  D177 fresh swap, untouched: live=' + r.live + ' boot=' + r.card); }
require('fs').writeFileSync(process.env.OUT || '/dev/null', out.join('\n') + '\n');
console.log('\nDONE');
