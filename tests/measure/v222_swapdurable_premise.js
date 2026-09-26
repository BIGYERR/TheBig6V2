// v222_swapdurable_premise.js — MEASURE (read-only). Before-picture + premise test for P-SWAPDURABLE.
//   SCR=<scratch> OUT=<file> node tests/measure/v222_swapdurable_premise.js <V220.html> <V221.html>
// Builds two source-surgery copies of V221 in SCR (never index.html):
//   COPY  = R1 + R2 + R3 as the ruling words it (pruneSwaps call, function, `let _swapCut`, `_swapCut = _cut` all deleted)
//   COPYa = R1 + R2 + only the pruneSwaps CALL deleted (_swapCut kept, so pruneDayEdits still runs)
// ORACLE: the athlete's own last action. Durable = the card after reboot carries the name the athlete last chose
// (swap target, or donor after undo); an add/skip is durable when the rebooted day equals the live day the athlete
// left. Clock pinned by a Date subclass; day state by date arithmetic from startDate 2026-08-24 (Mon), W5 Thu = 2026-09-24.
const path = require('path'), fs = require('fs');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const out = []; const P = s => { out.push(s); console.log(s); };
// ── source surgery ──
function surg(src, edits, tag){ let s = src; for(const [a, b] of edits){ const n = s.split(a).length - 1; if(n !== 1) throw new Error(tag + ' anchor count ' + n + ': ' + a.slice(0, 60)); s = s.replace(a, b); } return s; }
const V221src = fs.readFileSync(process.argv[3], 'utf8');
const R1 = [
  ["  const nudge=bumpSwapCount(activeProgId,from,to);\n  closeSwapSheet();\n", "  const nudge=bumpSwapCount(activeProgId,from,to);\n  resnapshotDayEdit(currentWeek,currentDayKey);\n  closeSwapSheet();\n"],
  ["  clearSwap(activeProgId,currentWeek,currentDayKey,from);\n  openDetail(currentDayKey,day);\n", "  clearSwap(activeProgId,currentWeek,currentDayKey,from);\n  resnapshotDayEdit(currentWeek,currentDayKey);\n  openDetail(currentDayKey,day);\n"] ];
const R2 = [["  const dk = dayKey||(typeof currentDayKey!=='undefined'?currentDayKey:'')||'';\n", "  const dk = dayKey||(typeof currentDayKey!=='undefined'?currentDayKey:'')||'';\n  if(/^(sun|mon|tue|wed|thu|fri|sat)$/.test(dk)) snapshotDay(w, dk);\n"]];
const R3call = [["      if(typeof _swapCut==='number') pruneSwaps(prog.id,_swapCut);\n", ""]];
const R3rest = [["  let _swapCut=null;\n", ""], ["        _swapCut = _cut;   // frozen weeks bake the swap in; the record is then dead weight\n", ""],
  ["function pruneSwaps(pid,cutWeek){\n  const s=getSwaps(pid); let changed=false;\n  Object.keys(s).forEach(k=>{const m=/^w(\\d+)_/.exec(k);if(m&&+m[1]<cutWeek){delete s[k];changed=true;}});\n  if(changed) saveSwaps(pid,s);\n}\n", ""]];
const COPYsrc = surg(V221src, R1.concat(R2, R3call, R3rest), 'COPY');
const COPYasrc = surg(V221src, R1.concat(R2, R3call), 'COPYa');
fs.writeFileSync(path.join(SCR, 'copy_r123.html'), COPYsrc); fs.writeFileSync(path.join(SCR, 'copy_r12_callonly.html'), COPYasrc);
P('SURGERY ok: COPY ' + (COPYsrc.length - V221src.length) + ' bytes, COPYa ' + (COPYasrc.length - V221src.length) + ' bytes; COPY `_swapCut` tokens left ' + (COPYsrc.match(/_swapCut/g) || []).length);
const TREES = { V220: process.argv[2], V221: process.argv[3], COPY: path.join(SCR, 'copy_r123.html'), COPYa: path.join(SCR, 'copy_r12_callonly.html') };
const ctxs = {}; for(const k in TREES) ctxs[k] = load(TREES[k]);
P('versions: ' + Object.keys(ctxs).map(k => k + '=' + ctxs[k].version).join(' '));
// ── fixture (identical to v221_swap_frozen.js) ──
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const head = d => (String(d || '').match(/^\s*[^\s—]+/) || [''])[0].trim();
function MARIO(){ return { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null,
  liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308,
  injury:{ region:'knee', tier:'workaround' } }; }
const START = '2026-08-24', W = 5, D = 'thu', DONOR = 'Barbell box squat', GOB = 'Dumbbell goblet squat';
const PAIRS = { goblet:GOB, verbatim:'Front squat' };
const CLOCKS = { future_prevwk:'2026-09-17', future_samewk:'2026-09-21', today:'2026-09-24', past_samewk:'2026-09-26', past_nextwk:'2026-09-29' };
function pin(IA, iso){ const T = new Date(iso + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
function setup(IA, dated, mutateStored){
  IA.localStorage.clear(); pin(IA, CLOCKS.today);
  const p = IA.buildProgram(MARIO()), st = JSON.parse(JSON.stringify(p));
  Object.assign(st, { id:'PM', name:'M', created:1, startDate:dated ? START : null, cfg:MARIO() });
  if(mutateStored) mutateStored(st);
  IA.ctx.__SP = st; E(IA, 'savePrograms([__SP]);'); return p; }
function boot(IA){ return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA){ E(IA, "currentWeek=" + W + ";currentDayKey='" + D + "';"); }
function day(IA){ return E(IA, 'activeProg.weeks[' + W + '].' + D); }
function loc(dy, name){ const ss = dy.sections || []; for(let si = 0; si < ss.length; si++){ const it = ss[si].items || []; for(let ii = 0; ii < it.length; ii++) if(clean(it[ii].name) === name) return { si, ii }; } return null; }
let L0 = null;
function cardAt(IA){ const dy = day(IA); const it = dy && dy.sections && dy.sections[L0.si] && dy.sections[L0.si].items[L0.ii]; return it ? { name:clean(it.name), detail:it.detail, skip:!!it._skipped } : { name:'(none)', detail:'' }; }
function swapAt(IA, to){ view(IA); const dy = day(IA); const it = dy.sections[L0.si].items[L0.ii];
  IA.ctx.__c = { secIdx:L0.si, itemIdx:L0.ii, name:it.name, detail:it.detail }; IA.ctx.__to = to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); }
function touch(IA, kind){ view(IA); const c = cardAt(IA); IA.ctx.__n = c.name; IA.ctx.__det = c.detail; IA.ctx.__title = day(IA).title || 'T';
  if(kind === 'draft') E(IA, "writeSetDraft(exStoreKey(__n),['5','5'],['95','95'],'');");
  if(kind === 'tick')  E(IA, "logExerciseWeight(__n,95,__det," + W + ",[5,5,5,5],[95,95,95,95],'" + D + "');");
  if(kind === 'done')  E(IA, "handleDayStatus('" + D + "',__title,'complete');");
  return c.name; }
function otherTouch(IA){ const wk = boot(IA); E(IA, "currentWeek=" + wk + ";currentDayKey='mon';writeSetDraft('zz_other',['1'],['1'],'');"); }
const J = (IA, k) => JSON.parse(IA.localStorage.getItem(k) || '{}');
function recs(IA){ const sw = J(IA, 'ia_swaps_PM')['w' + W + '_' + D]; return sw ? sw.map(e => e.from + '->' + e.to).join(',') : 'none'; }
function histAt(IA){ const hs = J(IA, 'ia_hist_PM')['w' + W + '_' + D]; const it = hs && hs.sections && hs.sections[L0.si] && hs.sections[L0.si].items[L0.ii]; return it ? clean(it.name) + ' ' + head(it.detail) : 'none'; }
function readout(IA, target){
  const c = cardAt(IA), exw = J(IA, 'ia_exw_PM'), logs = J(IA, 'ia_logs_PM')['w' + W + '_' + D];
  const exwKeys = Object.keys(exw).filter(k => (exw[k].entries || []).some(e => +e.week === W && e.day === D));
  const draftKeys = logs && logs.sets ? Object.keys(logs.sets) : [];
  const cardKey = E(IA, 'exStoreKey(' + JSON.stringify(c.name) + ')'); const recKeys = exwKeys.concat(draftKeys);
  const st = E(IA, "getPrograms()[0].weeks[" + W + "]." + D); const stIt = st.sections[L0.si].items[L0.ii];
  return { card:c.name + ' ' + head(c.detail), durable:c.name === target, record:recs(IA), hist:histAt(IA), hasHist:histAt(IA) !== 'none',
    logsOnCard:recKeys.length ? recKeys.includes(cardKey) : null, exwN:exwKeys.length, storedGrid:clean(stIt.name) }; }
// ── M0: the V221 lattice, unchanged ──
function run(tree, o){
  const IA = ctxs[tree]; const p = setup(IA, o.dated);
  if(!L0){ L0 = loc(p.weeks[W][D], DONOR); if(!L0) throw new Error('fixture moved'); }
  pin(IA, CLOCKS[o.clock]); boot(IA); if(o.other) otherTouch(IA); boot(IA);
  const to = PAIRS[o.pair]; view(IA); if(cardAt(IA).name !== DONOR) return { err:'donor not on card' };
  if(o.touch === 'none') swapAt(IA, to);
  else if(o.order === 'swap_then_touch'){ swapAt(IA, to); touch(IA, o.touch); } else { touch(IA, o.touch); swapAt(IA, to); }
  const histBeforeBoot = histAt(IA), exwBefore = Object.keys(J(IA, 'ia_exw_PM')).length;
  pin(IA, CLOCKS[o.reboot || o.clock]); boot(IA);
  return Object.assign({ histBeforeBoot, exwBefore, exwAfter:Object.keys(J(IA, 'ia_exw_PM')).length }, readout(IA, to)); }
const ORD = [['none', '-'], ['draft', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['done', 'swap_then_touch'], ['done', 'touch_then_swap']];
{ const o = { dated:true, clock:'today', pair:'goblet', touch:'draft', order:'swap_then_touch', other:false };
  P('SELFCHECK V221 identical: ' + (JSON.stringify(run('V221', o)) === JSON.stringify(run('V221', o)))); }
const rows = [];
for(const tree of Object.keys(TREES)) for(const dated of [true, false]) for(const clock of Object.keys(CLOCKS)) for(const pair of Object.keys(PAIRS))
  for(const other of [false, true]) for(const [touchK, order] of ORD) for(const reboot of [null, 'past_nextwk']){
    if(reboot === clock) continue; const o = { tree, dated, clock, pair, other, touch:touchK, order, reboot };
    let r; try { r = run(tree, o); } catch(e){ r = { err:'CRASH ' + e.message }; } rows.push({ o, r }); }
P('\n== M0 LATTICE ==  cells ' + rows.length + ', crashes/errors ' + rows.filter(x => x.r.err).length);
function summ(label, set){ const g = set.filter(x => !x.r.err), rev = g.filter(x => !x.r.durable), sv = g.filter(x => x.r.durable);
  P('  ' + label.padEnd(12) + ' DURABLE ' + sv.length + '/' + g.length + ' (rec kept ' + sv.filter(x => x.r.record !== 'none').length + ', hist holds target ' + sv.filter(x => x.r.hasHist && !x.r.hist.startsWith(DONOR)).length + ')'
    + ' | REVERTED ' + rev.length + '/' + g.length + ' (rec pruned ' + rev.filter(x => x.r.record === 'none').length + ', hist donor ' + rev.filter(x => x.r.hist.startsWith(DONOR)).length + ', no hist ' + rev.filter(x => !x.r.hasHist).length
    + ', orphaned logs ' + rev.filter(x => x.r.logsOnCard === false).length + ') | orphaned logs all cells ' + g.filter(x => x.r.logsOnCard === false).length + '/' + g.length
    + ' | stored grid carries target ' + g.filter(x => x.r.storedGrid !== DONOR).length + '/' + g.length); }
summ('V220+V221', rows.filter(x => x.o.tree === 'V220' || x.o.tree === 'V221'));
for(const t of Object.keys(TREES)) summ(t, rows.filter(x => x.o.tree === t));
P('  -- per tree x touch|order (survived/total)');
for(const [t, ord] of ORD){ P('    ' + (t + '|' + ord).padEnd(22) + Object.keys(TREES).map(tr => { const s = rows.filter(x => x.o.tree === tr && x.o.touch === t && x.o.order === ord && !x.r.err); return tr + ' ' + s.filter(x => x.r.durable).length + '/' + s.length; }).join('   ')); }
P('  -- COPY reverted cells (first 12):'); rows.filter(x => x.o.tree === 'COPY' && !x.r.err && !x.r.durable).slice(0, 12).forEach(x => P('    ' + JSON.stringify(x.o) + ' card=' + x.r.card + ' rec=' + x.r.record + ' hist=' + x.r.hist));
for(const t of ['V221', 'COPY', 'COPYa']){ const s = rows.filter(x => x.o.tree === t && x.o.touch === 'none' && !x.o.other && !x.r.err);
  P('  neg-control (a) ' + t + ': swap on untouched day wrote ia_hist_ before boot ' + s.filter(x => x.r.histBeforeBoot !== 'none').length + '/' + s.length); }
for(const t of ['V221','COPY']){ const m = {}; rows.filter(x => x.o.tree === t && !x.r.err && x.r.logsOnCard === false).forEach(x => { const k = x.o.touch + '|' + x.o.order; m[k] = (m[k] || 0) + 1; }); P('  orphaned-log cells by touch|order ' + t + ': ' + JSON.stringify(m)); }
for(const t of Object.keys(TREES)){ const s = rows.filter(x => x.o.tree === t && !x.r.err); P('  exw slug count equal across reboot ' + t + ': ' + s.filter(x => x.r.exwBefore === x.r.exwAfter).length + '/' + s.length); }
// ── M2: undo after reboot ──
P('\n== M2 UNDO AFTER REBOOT (dated, clock today, goblet; act, reboot, undo, reboot, reboot) ==');
for(const tree of Object.keys(TREES)) for(const [t, ord] of ORD){
  const IA = ctxs[tree]; setup(IA, true); boot(IA); view(IA);
  if(t === 'none') swapAt(IA, GOB); else if(ord === 'swap_then_touch'){ swapAt(IA, GOB); touch(IA, t); } else { touch(IA, t); swapAt(IA, GOB); }
  boot(IA); view(IA); const b1 = cardAt(IA); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(GOB) + ')');
  E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); const u = cardAt(IA); const recU = recs(IA), histU = histAt(IA);
  boot(IA); const b2 = cardAt(IA), hist2 = histAt(IA), rec2 = recs(IA); boot(IA); const b3 = cardAt(IA);
  P('  ' + (tree + '|' + t + '|' + ord).padEnd(30) + ' boot1=' + b1.name + ' ' + head(b1.detail) + ' chip=' + (chip || '-') + ' | undo-> ' + u.name + ' ' + head(u.detail) + ' rec=' + recU + ' hist=' + histU
    + ' | boot2=' + b2.name + ' ' + head(b2.detail) + ' hist=' + hist2 + ' rec=' + rec2 + ' | boot3=' + b3.name + ' ' + head(b3.detail)); }
// ── M3: add / skip x swap on a frozen day ──
const ADDN = 'Dumbbell hammer curl';
function daySig(IA){ const dy = day(IA); const ss = dy.sections || [];
  const main = cardAt(IA); const skipped = [], added = []; let gobN = 0, donN = 0;
  ss.forEach(s => { if(s._skipped) skipped.push('ss'); (s.items || []).forEach(it => { const n = clean(it.name); if(n === GOB) gobN++; if(n === DONOR) donN++; if(it._skipped) skipped.push(n); if(s._added) added.push(n); }); });
  return main.name + ' ' + head(main.detail) + (main.skip ? '[x]' : '') + ' | skip=' + (skipped.join(',') || '-') + ' | add=' + (added.join(',') || '-') + ' | nGob=' + gobN + ' nDonor=' + donN; }
P('\n== M3 ADD/SKIP x SWAP on W5 Thu (dated, clock today, reboot same day, then a second reboot at past_nextwk) ==');
const m3 = { total:0, ok1:0, ok2:0, byTree:{} };
for(const tree of Object.keys(TREES)){ const agg = { n:0, ok1:0, ok2:0, dbl:0, fails:[] };
  for(const tk of ['draft', 'tick']) for(const seq of [['swap', 'add'], ['add', 'swap'], ['swap', 'skipslot'], ['skipslot', 'swap'], ['swap', 'skipother'], ['skipother', 'swap'], ['add', 'swapadded']])
    for(const tpos of [0, 1, 2]){
      const IA = ctxs[tree]; setup(IA, true); boot(IA); view(IA);
      const other = (() => { const dy = day(IA); for(const s of dy.sections) for(const it of (s.items || [])) if(clean(it.name) !== DONOR && it.name && !s.superset) return it.name; })();
      const ops = seq.slice(); ops.splice(tpos, 0, 'touch'); let note = '';
      for(const op of ops){ view(IA);
        if(op === 'touch') touch(IA, tk);
        else if(op === 'swap') swapAt(IA, GOB);
        else if(op === 'add') E(IA, 'applyAddChoice(' + JSON.stringify(ADDN) + ');');
        else if(op === 'skipslot') E(IA, 'skipExercise(' + JSON.stringify(E(IA, 'activeProg.weeks[5].thu.sections[' + L0.si + '].items[' + L0.ii + '].name')) + ');');
        else if(op === 'skipother') E(IA, 'skipExercise(' + JSON.stringify(other) + ');');
        else if(op === 'swapadded'){ const dy = day(IA); const si = dy.sections.findIndex(s => s._added); if(si < 0){ note = 'no added bucket'; continue; }
          const ii = dy.sections[si].items.findIndex(it => it.name === ADDN); const fl = E(IA, 'exControlFlags(activeProg.weeks[5].thu.sections[' + si + '],' + ii + ',activeProg.weeks[5].thu.sections[' + si + '].items[' + ii + '])');
          note = 'addedCanSwap=' + !!(fl && fl.canSwap); IA.ctx.__c = { secIdx:si, itemIdx:ii, name:ADDN, detail:dy.sections[si].items[ii].detail }; E(IA, "_swapCtx=__c;applySwapChoice('Dumbbell biceps curl');"); } }
      view(IA); const live = daySig(IA); boot(IA); view(IA); const b1 = daySig(IA); pin(IA, CLOCKS.past_nextwk); boot(IA); view(IA); const b2 = daySig(IA);
      agg.n++; if(b1 === live) agg.ok1++; if(b2 === live) agg.ok2++; if(/nGob=[2-9]/.test(b1 + b2) || /add=[^|]*,/.test(b1 + b2) && !/add=[^|]*,/.test(live)) agg.dbl++;
      const tag = tree + '|' + tk + '|' + ops.join('>');
      if(b1 !== live || b2 !== live) agg.fails.push('    ' + tag.padEnd(46) + ' LIVE ' + live + '\n' + ' '.repeat(52) + 'BOOT ' + b1 + '\n' + ' '.repeat(52) + 'NXWK ' + b2 + (note ? '  (' + note + ')' : '') + ' rec=' + recs(IA) + ' edits=' + JSON.stringify(J(IA, 'ia_edits_PM')['w5_thu'] || null));
      else if(note) agg.fails.push('    ' + tag + ' OK ' + note);
    }
  P('  ' + tree.padEnd(6) + ' live==boot ' + agg.ok1 + '/' + agg.n + '  live==next-week boot ' + agg.ok2 + '/' + agg.n + '  double-apply ' + agg.dbl + '/' + agg.n); agg.fails.forEach(f => P(f)); }
// ── M4: second swap on the same slot ──
P('\n== M4 SECOND SWAP box->goblet->X, then undo X, undo goblet (dated, clock today) ==');
let LP = null;
for(const tree of Object.keys(TREES)) for(const [t, pos] of [['none', '-'], ['draft', 'first'], ['draft', 'between'], ['draft', 'last']]){
  const IA = ctxs[tree]; setup(IA, true); boot(IA); view(IA);
  if(pos === 'first') touch(IA, t); swapAt(IA, GOB); if(pos === 'between') touch(IA, t);
  if(!LP){ const c = E(IA, 'swapCandidates(' + JSON.stringify(GOB) + ',activeProg.weeks[5].thu,5,activeProg)'); const all = (c.tier1 || []).concat(c.tier2 || []); LP = all.find(n => /leg press/i.test(n)) || all[0]; P('  second-swap target: ' + LP + ' (of ' + all.length + ' candidates)'); }
  swapAt(IA, LP); if(pos === 'last') touch(IA, t);
  const live = cardAt(IA).name, rec0 = recs(IA); boot(IA); view(IA); const b1 = cardAt(IA), rec1 = recs(IA), h1 = histAt(IA), chip1 = E(IA, 'swapOriginOf(' + JSON.stringify(b1.name) + ')');
  E(IA, 'undoSwap(' + JSON.stringify(GOB) + ');'); const u1 = cardAt(IA); boot(IA); view(IA); const b2 = cardAt(IA), rec2 = recs(IA), chip2 = E(IA, 'swapOriginOf(' + JSON.stringify(b2.name) + ')');
  E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); const u2 = cardAt(IA); boot(IA); view(IA); const b3 = cardAt(IA), rec3 = recs(IA);
  P('  ' + (tree + '|' + t + '|' + pos).padEnd(22) + ' live=' + live + ' rec=' + rec0 + '\n' + ' '.repeat(26) + 'BOOT1 ' + b1.name + ' ' + head(b1.detail) + ' rec=' + rec1 + ' hist=' + h1 + ' chip=' + (chip1 || '-')
    + '\n' + ' '.repeat(26) + 'undo(goblet)->' + u1.name + ' BOOT2 ' + b2.name + ' ' + head(b2.detail) + ' rec=' + rec2 + ' chip=' + (chip2 || '-')
    + '\n' + ' '.repeat(26) + 'undo(box)->' + u2.name + ' ' + head(u2.detail) + ' BOOT3 ' + b3.name + ' ' + head(b3.detail) + ' rec=' + rec3); }
// boot-time chain probe: both records present, untouched day, no live edit
P('  -- applySessionSwaps with both records injected, W5 Thu untouched vs hist-restored');
for(const tree of Object.keys(TREES)) for(const hist of [null, DONOR, GOB, LP]){
  const IA = ctxs[tree]; setup(IA, true); boot(IA); view(IA);
  if(hist){ if(hist !== DONOR){ const dy = day(IA); const it = dy.sections[L0.si].items[L0.ii]; it.name = hist; } E(IA, "(function(){var h=getDayHist();delete h['w5_thu'];saveDayHist(h);snapshotDay(5,'thu');})()"); }
  IA.localStorage.setItem('ia_swaps_PM', JSON.stringify({ w5_thu:[{ from:DONOR, to:GOB, ts:1 }, { from:GOB, to:LP, ts:2 }] }));
  pin(IA, CLOCKS.past_nextwk); E(IA, "writeSetDraft('zz',['1'],['1'],'')"); boot(IA); view(IA);
  P('    ' + (tree + '|hist=' + (hist || 'none')).padEnd(44) + ' boot W5 Thu slot=' + cardAt(IA).name + ' rec=' + recs(IA)); }
// ── M5: stale stored grid ──
P('\n== M5 STALE GRID: stored W5 Thu slot renamed to Barbell back squat; swap made live at W5, reboot at W6 with W6 touched ==');
for(const tree of Object.keys(TREES)) for(const stale of [false, true]){
  const IA = ctxs[tree]; setup(IA, true, st => { if(stale){ const it = st.weeks[W][D].sections[L0.si].items[L0.ii]; it.name = 'Barbell back squat'; } });
  boot(IA); view(IA); const pre = cardAt(IA).name; swapAt(IA, GOB); const live = cardAt(IA).name;
  pin(IA, CLOCKS.past_nextwk); boot(IA); const wk = E(IA, 'currentWeek'); E(IA, "currentDayKey='mon';writeSetDraft('zz',['1'],['1'],'')"); boot(IA); view(IA);
  const b = cardAt(IA); pin(IA, CLOCKS.today);
  P('  ' + (tree + '|stale=' + stale).padEnd(18) + ' shown at W5=' + pre + ' live=' + live + ' | W' + wk + ' boot: slot=' + b.name + ' ' + head(b.detail) + ' rec=' + recs(IA) + ' hist=' + histAt(IA)); }
// ── M6: store readers (source, comments stripped) + accumulation ──
P('\n== M6 SWAP STORE READERS (V221, comments stripped) ==');
const code = ctxs.V221.js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1'));
for(const tok of ['ia_swaps_', 'swapStoreKey(', 'getSwaps(', 'saveSwaps(', 'ia_swapct_', 'getSwapCounts(', 'ia_edits_', 'getDayEdits(', 'localStorage.length', 'localStorage.key(', 'Object.keys(localStorage', "'ia_'", 'JSON.stringify(localStorage'])
  P('  ' + tok.padEnd(26) + ' code sites ' + code.filter(l => l.indexOf(tok) >= 0).length + ': ' + code.map((l, i) => l.indexOf(tok) >= 0 ? (i + 1) : null).filter(Boolean).join(','));
P('  (line numbers above are inline-JS lines, not index.html lines)');
// accumulation: swap every swappable item on every day of every week, on COPY, no pruning
for(const tree of ['V221', 'COPY']){
  const IA = ctxs[tree]; setup(IA, true); boot(IA);
  const nW = E(IA, 'Math.max.apply(null,Object.keys(activeProg.weeks).map(Number).filter(function(n){return n>0;}))'); let nSw = 0, nDays = 0, perDayMax = 0, oneEach = 0;
  for(let w = 1; w <= nW; w++) for(const d of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']){
    const dy = E(IA, 'activeProg.weeks[' + w + '] && activeProg.weeks[' + w + '].' + d); if(!dy || !dy.sections) continue; let k = 0;
    dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => {
      const fl = E(IA, 'exControlFlags(activeProg.weeks[' + w + '].' + d + '.sections[' + si + '],' + ii + ',activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '])');
      if(!fl || !fl.canSwap) return; const c = E(IA, 'swapCandidates(activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '].name,activeProg.weeks[' + w + '].' + d + ',' + w + ',activeProg)');
      const to = ((c && c.tier1) || [])[0]; if(!to) return;
      E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); IA.ctx.__c = { secIdx:si, itemIdx:ii, name:it.name, detail:it.detail }; IA.ctx.__to = to;
      E(IA, '_swapCtx=__c;applySwapChoice(__to);'); k++; nSw++; }));
    if(k){ nDays++; perDayMax = Math.max(perDayMax, k); } }
  const all = IA.localStorage.getItem('ia_swaps_PM') || '{}', S = JSON.parse(all), nRec = Object.values(S).reduce((a, l) => a + l.length, 0);
  const oneRec = Object.values(S).map(l => JSON.stringify(l[0]).length); const avg1 = oneRec.reduce((a, b) => a + b, 0) / oneRec.length;
  pin(IA, '2026-12-01'); E(IA, "currentWeek=" + nW + ";currentDayKey='mon';writeSetDraft('zz',['1'],['1'],'')"); boot(IA);
  const afterBoot = JSON.parse(IA.localStorage.getItem('ia_swaps_PM') || '{}'); const nAfter = Object.values(afterBoot).reduce((a, l) => a + l.length, 0);
  const progBytes = (IA.localStorage.getItem('ia_programs') || '').length;
  P('  ' + tree.padEnd(5) + ' weeks=' + nW + ' lifting days with a swappable item=' + nDays + ' swaps made=' + nSw + ' (max/day ' + perDayMax + ') | records ' + nRec + ', ia_swaps_ ' + all.length + ' bytes, one record avg ' + Math.round(avg1) + ' bytes'
    + ' | one swap per day = ' + nDays + ' records ~' + Math.round(nDays * avg1) + ' bytes | after boot at program end: ' + nAfter + ' records kept | ia_programs ' + progBytes + ' bytes'); pin(IA, CLOCKS.today); }
fs.writeFileSync(process.env.OUT || '/dev/null', out.join('\n') + '\n'); console.log('\nDONE');
