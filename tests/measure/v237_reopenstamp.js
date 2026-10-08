// v237_reopenstamp.js — MEASURE mB (Mode B, before-picture) for P-REOPENSTAMP, re-measured on V236.
//   node tests/measure/v237_reopenstamp.js [index.html] [--quick]
// Questions: (1) the V235 clear/reopen numbers through the V236 path (D218: DRAFT until Log; Log, Done, Skip commit; LIVE
//   after): does the stamped run_dist survive a reopened time-to-zero clear, does the card go back to DRAFT; (2) the stamp
//   as a fact base: what it writes, and whether anything distinguishes it from an athlete-rolled value of the same miles
//   (the collision a stamp-equal rule would misread); (3) the readers V235 left unmeasured: _benchmarkEntryFor,
//   seedFromPriorPrograms, restMoveCandidates, the D213 swap park, pre-V148-shaped entries; (4) what a reopened miles
//   wheel shows for a stamped, an athlete-rolled and a dose=time entry.
// Drive: mkEnv loaded verbatim from tests/gates/g236_d218_logbutton.js (g235/g233 lineage: real openDayKey, wheels' real
//   scroll settle, logCardio, handleDayStatus, closeDetail, setCardioSwap), plus the V235 measure's one addition: hidden
//   <input> .value coerced to a string as the DOM does.
// Oracles (independent of the suspect): logged values are what the hand rolled (0:47:13 -> "47.22"); the stamp oracle is
//   the plan off the dose strip, String(dose.mi); the wheel's byte format is read off the row values by hand (whole + '.' +
//   tenths + hundredths); reader credit is each reader's own predicate restated from its line (cited), cross-checked by
//   calling the real reader where it is callable (restMoveCandidates, _benchmarkEntryFor, seedFromPriorPrograms,
//   setCardioSwap, the rendered nudge).
// Read-only measure; writes nothing but stdout.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const load = H.load;
const ARGS = process.argv.slice(2).filter(a => !/^--/.test(a));
const CAND = path.resolve(ARGS[0] || path.join(ROOT, 'index.html'));
const QUICK = process.argv.includes('--quick');
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const J = JSON.stringify, P = s => console.log(s);
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g236_d218_logbutton.js'), 'utf8');
  const a = src.indexOf('function mkEnv(file){'), b = src.indexOf('\n  return E;\n}', a);
  if(a < 0 || b < 0) throw new Error('mkEnv not found in g236_d218_logbutton.js');
  eval('global.mkEnv = ' + src.slice(a, b + '\n  return E;\n}'.length)); }
const t0 = Date.now();
const C = mkEnv(CAND); const VER = +C.IA.version;
P('candidate ' + CAND + ' ia-version ' + VER + (QUICK ? ' (QUICK)' : ''));
const NUDGE = 'You logged this one but never marked it.';
const STR_IDS = ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe', 'log_swim_yards', 'log_notes'];
const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
  Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
const open = (w, d) => { C.open(w, d); STR_IDS.forEach(strv); };
const back = () => { C.ev('closeDetail()'); C.advance(200); };
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const W = hid => C.need(hid);
const mv = (hid, pairs) => { const wh = W(hid); const need = pairs.filter(([ci, v]) => colv(wh, ci) !== v); if(need.length) C.roll(wh, need); };
const rowsOf = hid => { const wh = C.wheel(hid); return wh ? wh._cols.map((c, i) => colv(wh, i)) : null; };
// hand byte format of a dist wheel face: whole '.' tenths hundredths, '' when col0 is the dash (read off the rows)
const handDist = r => r ? (r[0] === '' ? '' : r[0] + '.' + (r[1] === '' ? '0' : r[1]) + (r[2] == null || r[2] === '' ? '0' : r[2])) : null;
const handOfMi = mi => { const s = (Math.round(mi * 100) / 100).toFixed(2); return s; }; // what the miles wheel writes for mi, by hand
const KEYS = 'g236';
const hist = () => JSON.parse(C.LS.getItem('ia_hist_' + KEYS) || '{}');
const st = (w, d) => C.ev("statusOf(" + w + ",'" + d + "')");
const strip = e => e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'ts').sort()) : null;
const cardioKeys = e => e ? { run_mins:e.run_mins, run_dist:e.run_dist, run_pace:e.run_pace, rpe:e.rpe } : null;
// readers restated from their own lines (V236 line numbers, comment-stripped grep in §6)
const RD = {
  weekMiles: e => { const v = parseFloat((e || {}).run_dist); return isNaN(v) ? 0 : v; },                        // :12213 renderWeekView
  progRun:   e => (e && e.run_dist && +e.run_dist > 0) ? +e.run_dist : 0,                                       // :17598 renderProgressScreen
  pvl:       e => (e && +e.run_dist > 0) ? +e.run_dist : 0,                                                     // :16744 plannedVsLogged
  ladder:    e => (e && +e.run_dist > 0) ? 1 : 0,                                                               // :16674 ladderWeekly
  hasLog:    e => !!(e && ((e.notes && e.notes.trim()) || e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time || e.bike_mins || e.swim_yards)), // :14194
  session:   e => !!(e && (e.rpe || e.run_dist || e.bike_mins || e.swim_yards || e.notes)),                     // :17605
  live:      e => !!(e && (e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time)),            // :14754 cardioEntryLive(run)
  restBlock: e => !!(e && (e.rpe || e.notes || e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time || e.bike_mins || e.swim_yards)), // :1543
  seedMax:   e => (e && e.run_dist && +e.run_dist > 0) ? +e.run_dist : 0,                                       // :16422 seedFromPriorPrograms
  bench:     e => !!(e && !e.swapTo && parseFloat(e.run_dist) > 0)                                              // :13055 _benchmarkEntryFor
};
const mkCfg = (sports, f, ex, eq, sd) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd }; };
const PROGS = [['HALF_MANNY|fixture', JSON.parse(J(H.fixtures.HALF_MANNY))]];
const GOALS = [['bike', 'bike_century'], ['bike', 'bike_50'], ['bike', 'bike_base'], ['bike', 'bike_ftp'], ['bike', 'bike_cals'],
  ['run', 'run_5k'], ['run', 'run_10k'], ['run', 'run_half'], ['run', 'run_marathon'], ['run', 'run_base'], ['run', 'run_pace_goal']];
const FOC = QUICK ? ['balanced'] : ['balanced', 'strength'], EXP = QUICK ? ['intermediate'] : ['beginner', 'advanced'], SEEDS = QUICK ? [76308] : [76308, 24865];
for(const g of GOALS) for(const f of FOC) for(const ex of EXP) for(const sd of SEEDS) PROGS.push([g[1] + '|' + f + '|' + ex + '|' + sd, mkCfg([g], f, ex, 'commercial', sd)]);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const bump = (o, k, n) => { o[k] = (o[k] || 0) + (n || 1); };
const LOGT = () => mv('log_run_mins', [[0, '0'], [1, '47'], [2, '13']]);
const G = {
  T_zero: () => mv('log_run_mins', [[0, '0'], [1, '0'], [2, '0']]),
  M_dash: () => mv('log_run_dist', [[0, '']]),
  M_zero: () => mv('log_run_dist', [[0, '0'], [1, '0'], [2, '0']])
};
const GEST = ['T_zero', 'M_dash', 'M_zero', 'T_zero+M_dash', 'M_dash+T_zero'];
const commit = (S, d) => { if(S === 'log'){ C.log(); back(); } else if(S === 'done') C.tap(d, 'complete'); };
const finish = (X, d) => { if(X === 'back') back(); else if(X === 'log'){ C.log(); back(); } else if(X === 'done') C.tap(d, 'complete'); };
const RES = [], ERR = [], X1 = {}, X2 = {}, X3 = {}, X4 = {}, BENCH = [], SEEDX = [], PRE = {}, PARK = {}, FMT = {}, REPRO = [];
let nP = 0; const nDays = {};
for(const [name, cfg] of PROGS){
  let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  nP++; C.use(p);
  const stampOnly = []; // stamped-only entries produced by the real clear, for the seed experiment
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || ct !== 'run') continue;
    const dose = C.ev('__realDFC')(x.cardio); if(!dose) continue;
    const sub = x.cardio.subtype || '';
    if(/^Benchmark Run/.test(sub)) BENCH.push({ name, w, d, sub, k:dose.k });
    bump(nDays, dose.k);
    try {
      if(dose.k === 'time'){
        // §4c dose=time: miles wheel seed on a fresh open and on a reopen of an athlete-rolled 3.10
        C.wipe(); open(w, d); const wh = C.wheel('log_run_dist');
        bump(X4, 'time | fresh open | miles wheel data-plan ' + (wh ? J(wh.plan) : 'NO WHEEL') + ' hidden ' + J(C.els.log_run_dist && C.els.log_run_dist.value) + ' face ' + J(handDist(rowsOf('log_run_dist'))));
        mv('log_run_dist', [[0, '3'], [1, '1'], [2, '0']]); C.log(); const e1 = C.entry(w, d); back(); open(w, d);
        bump(X4, 'time | reopen after rolling 3.10 + Log | stored run_dist ' + J(e1 && e1.run_dist) + ' hidden ' + J(C.els.log_run_dist.value) + ' face ' + J(handDist(rowsOf('log_run_dist'))) + ' label ' + J(C.label()));
        continue;
      }
      if(dose.k !== 'dist') continue;
      const mi = dose.mi, stampOracle = String(mi), wheelOracle = handOfMi(mi);
      bump(FMT, 'plan mi decimals ' + ((String(mi).split('.')[1] || '').length) + ' | String(mi)===wheel bytes ' + (stampOracle === wheelOracle));
      // ── §0 the V236 log step: DRAFT roll writes nothing; the Log tap stamps
      C.wipe(); open(w, d);
      const fresh = { hidden:C.els.log_run_dist.value, face:handDist(rowsOf('log_run_dist')), plan:C.wheel('log_run_dist').plan, label:C.label() };
      LOGT(); const draft = C.entry(w, d); const lblDraft = C.label();
      C.log(); const logged = C.entry(w, d); const lblLog = C.label(); back();
      bump(X1, 'fresh open: hidden ' + J(fresh.hidden) + ', face==wheelOracle ' + (fresh.face === wheelOracle) + ', data-plan==String(mi) ' + (fresh.plan === stampOracle) + ', label ' + J(fresh.label));
      bump(X1, 'after time roll (DRAFT): entry ' + (draft ? J(cardioKeys(draft)) : 'none') + ', label ' + J(lblDraft));
      bump(X1, 'after Log tap: run_mins "47.22" ' + (logged && logged.run_mins === '47.22') + ', run_dist===String(mi) (stamp) ' + (logged && logged.run_dist === stampOracle) + ', run_pace set ' + !!(logged && logged.run_pace) + ', label ' + J(lblLog));
      // ── §4a/b reopen seed: stamped vs athlete-rolled (to the plan, and to plan+0.30), bytes and faces
      open(w, d);
      bump(X4, 'dist | reopen STAMPED: hidden===String(mi) ' + (C.els.log_run_dist.value === stampOracle) + ' face==wheelOracle ' + (handDist(rowsOf('log_run_dist')) === wheelOracle) + ' label ' + J(C.label()));
      back();
      C.wipe(); open(w, d); LOGT();
      const r0 = rowsOf('log_run_dist'); const away = r0[1] === '5' ? '6' : '5';
      mv('log_run_dist', [[1, away]]); mv('log_run_dist', [[1, r0[1]]]);
      C.log(); const rolledPlan = C.entry(w, d); back();
      bump(FMT, 'athlete rolled miles away and back to plan, Log: run_dist ' + (rolledPlan.run_dist === wheelOracle ? '== wheel bytes' : 'OTHER ' + J(rolledPlan.run_dist)) + ' | ==String(mi) ' + (rolledPlan.run_dist === stampOracle) + ' | numeric== ' + (+rolledPlan.run_dist === mi));
      open(w, d);
      bump(X4, 'dist | reopen ROLLED-TO-PLAN: hidden==wheel bytes ' + (C.els.log_run_dist.value === wheelOracle) + ' face==wheelOracle ' + (handDist(rowsOf('log_run_dist')) === wheelOracle) + ' label ' + J(C.label()));
      back();
      C.wipe(); open(w, d); LOGT(); mv('log_run_dist', [[1, away]]); C.log(); const rolledOff = C.entry(w, d); back(); open(w, d);
      bump(X4, 'dist | reopen ROLLED-OFF-PLAN: hidden==stored ' + (C.els.log_run_dist.value === rolledOff.run_dist) + ' face==stored ' + (handDist(rowsOf('log_run_dist')) === rolledOff.run_dist) + ' label ' + J(C.label()));
      // reopened ROLLED-OFF entry, time to zero, Back: what survives (the athlete-rolled-miles case)
      G.T_zero(); back(); const ro = C.entry(w, d);
      bump(X4, 'dist | ROLLED-OFF reopened, time to zero, Back: run_dist kept ' + (ro && ro.run_dist === rolledOff.run_dist) + ' run_mins ' + J(ro && ro.run_mins) + ' run_pace ' + J(ro && ro.run_pace));
      // ── §1 the clear flows
      for(const S of ['log', 'done']) for(const g of GEST) for(const X of ['back', 'log', 'done']){
        C.wipe(); open(w, d); LOGT(); commit(S, d); open(w, d);
        const seed = { hidden:C.els.log_run_dist.value, label:C.label() };
        let mid = null, lblMid = null;
        g.split('+').forEach((k, i) => { G[k](); });
        mid = C.entry(w, d); lblMid = C.label();
        finish(X, d);
        const e = C.entry(w, d), status = st(w, d);
        open(w, d); const nudge = C.els.detailBody.innerHTML.includes(NUDGE), lblRe = C.label(), hidRe = C.els.log_run_dist.value;
        const rm = JSON.parse(C.ev('JSON.stringify(restMoveCandidates(' + w + '))')).some(c => c.day === d);
        back();
        const r = { name, w, d, mi, sub, flow:S + '>' + g + '>' + X, S, g, X, seed, mid, lblMid, e, status, nudge, lblRe, hidRe, rm, stampOracle };
        RES.push(r);
        if(name.startsWith('HALF_MANNY') && !REPRO.length && S === 'log' && g === 'T_zero' && X === 'back') REPRO.push(r);
        if(S === 'log' && g === 'T_zero' && X === 'back' && e && e.run_dist && !e.run_mins) stampOnly.push({ w, d, e });
      }
      // control: within one open (no reopen) after the Log tap
      for(const g of GEST) for(const X of ['back', 'log']){
        C.wipe(); open(w, d); LOGT(); C.log(); g.split('+').forEach(k => G[k]()); const lblMid = C.label(); finish(X, d);
        RES.push({ name, w, d, mi, sub, flow:'ctl:log>' + g + '>' + X, S:'ctl', g, X, e:C.entry(w, d), status:st(w, d), lblMid, stampOracle });
      }
      // draft control: roll time, Back, no Log
      C.wipe(); open(w, d); LOGT(); back(); bump(X1, 'roll time then Back, no Log: entry ' + (C.entry(w, d) ? J(cardioKeys(C.entry(w, d))) : 'none'));
      // ── §3c swap park on a stamped entry, cleared and uncleared
      for(const clr of [false, true]){
        C.wipe(); open(w, d); LOGT(); C.log(); back(); open(w, d); if(clr) G.T_zero();
        C.ev("setCardioSwap('bike')"); C.advance(200);
        const e1 = C.entry(w, d) || {}; const note = (C.els.cardioSwapNote && C.els.cardioSwapNote.textContent) || '';
        C.ev("setCardioSwap('run')"); C.advance(200); const e2 = C.entry(w, d) || {};
        bump(PARK, (clr ? 'stamped then time cleared' : 'stamped (time 47:13)') + ' -> chip bike: parked.run.run_dist===String(mi) ' + !!(e1.parked && e1.parked.run && e1.parked.run.run_dist === stampOracle)
          + ', parked.run.run_mins ' + J(e1.parked && e1.parked.run && e1.parked.run.run_mins) + ', note says numbers kept ' + /numbers are kept/.test(note) + ' | chip run: run_dist restored===String(mi) ' + (e2.run_dist === stampOracle) + ', label ' + J(C.label()));
        back();
      }
      // ── §3e pre-V148 / V148-V231 typed shape (text box, no run_mins): typed equal to plan and typed off plan
      for(const [lab, dist] of [['typed == String(mi)', stampOracle], ['typed off plan', String(+(mi + 0.4).toFixed(1))]]){
        C.wipe(); C.setLog(w, d, { rpe:'6', run_dist:dist, run_pace:'9:15', notes:'', week:w, ts:C.ev('Date.now()') }); C.ev('snapshotDay(' + w + ",'" + d + "')");
        open(w, d); const hid = C.els.log_run_dist.value, lab0 = C.label(), nud = C.els.detailBody.innerHTML.includes(NUDGE);
        C.rpe('7'); const e1 = C.entry(w, d);
        bump(PRE, lab + ': reopen hidden==typed ' + (hid === dist) + ', label ' + J(lab0) + ', nudge ' + nud + ', after RPE move run_dist==typed ' + (e1.run_dist === dist) + ' run_pace kept ' + (e1.run_pace === '9:15') + ' | byte-equal to a stamp ' + (dist === stampOracle));
        back();
      }
    } catch(err){ ERR.push(name + ' W' + w + ' ' + d + ' ' + dose.k + ': ' + String(err.message).slice(0, 160)); }
  }
  // ── §3b seedFromPriorPrograms: real call, three scaffolded recovery runs (snapshot + run_pace + ts) so the program qualifies,
  //    then maxDist with and without the stamped-only entries the real clear produced (ts = now)
  try {
    const rec = []; for(const w of weeksOf(p)) for(const d of DAYS){ const x = p.weeks[w][d]; if(x && !x.rest && ctOf(x) === 'run' && /recovery/i.test(x.cardio.subtype || '')) rec.push([w, d]); }
    if(rec.length >= 3 && stampOnly.length){
      const now = +C.ev('Date.now()');
      const base = () => { C.wipe(); rec.slice(0, 3).forEach(([w, d]) => { C.ev('snapshotDay(' + w + ",'" + d + "')"); C.setLog(w, d, { run_pace:'10:30/mi', run_dist:'1.00', run_mins:'10.50', ts:now - 1000, week:w }); }); };
      base(); const s0 = JSON.parse(C.ev('JSON.stringify(seedFromPriorPrograms(' + now + '))'));
      const recK = new Set(rec.slice(0, 3).map(([w, d]) => w + '_' + d)); const SO = stampOnly.filter(o => !recK.has(o.w + '_' + o.d));
      SO.forEach(o => C.setLog(o.w, o.d, Object.assign({}, o.e, { ts:now - 500 })));
      const s1 = JSON.parse(C.ev('JSON.stringify(seedFromPriorPrograms(' + now + '))'));
      const maxStamp = Math.max(...SO.map(o => +o.e.run_dist));
      SEEDX.push({ name, n:SO.length, s0:s0 && s0.maxDist, s1:s1 && s1.maxDist, hand:+maxStamp.toFixed(1) });
    } else SEEDX.push({ name, n:stampOnly.length, skip:'recovery runs ' + rec.length });
  } catch(err){ ERR.push(name + ' seed: ' + err.message); }
  // ── §3a _benchmarkEntryFor: every benchmark day; stamped-only only reachable where dose=dist
  for(const b of BENCH.filter(b => b.name === name && b.k === 'dist')){
    try { C.wipe(); open(b.w, b.d); LOGT(); C.log(); back(); open(b.w, b.d); G.T_zero(); back();
      const e = C.entry(b.w, b.d); b.e = cardioKeys(e); b.ret = JSON.parse(C.ev('JSON.stringify(_benchmarkEntryFor(' + b.w + '))')); } catch(err){ ERR.push(name + ' bench: ' + err.message); }
  }
}
P('§L LATTICE: ' + nP + '/' + PROGS.length + ' programs; run dose days ' + J(nDays) + '; drives ' + RES.length + '; errors ' + ERR.length + '; ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 10).forEach(e => P('  ERR ' + e));
const dump = (t, o) => { P('\n' + t); Object.keys(o).sort().forEach(k => P('  ' + k + ' : ' + o[k])); };
if(REPRO[0]){ const r = REPRO[0]; P('\n§R REPRO ' + r.name + ' W' + r.w + ' ' + r.d + ' "' + r.sub + '" mi ' + r.mi + ': roll 0:47:13, Log, Back, reopen (hidden log_run_dist ' + J(r.seed.hidden) + ', label ' + J(r.seed.label)
  + '), roll time to 0:00:00 -> stored at the settle ' + J(strip(r.mid)) + ', label ' + J(r.lblMid) + '; Back -> stored ' + J(strip(r.e)) + ', status ' + J(r.status) + '; reopen label ' + J(r.lblRe) + ', hidden ' + J(r.hidRe) + ', nudge ' + r.nudge); }
dump('§0 V236 LOG STEP on dose=dist (denominator = dose=dist days ' + (nDays.dist || 0) + ')', X1);
P('\n§1 CLEAR FLOWS S>gesture>X (S = commit before reopen; X = finishing tap). full = run_mins, run_dist, run_pace all empty');
const seg = {};
for(const r of RES){ const k = r.flow; const s = seg[k] = seg[k] || { n:0, full:0, distSurv:0, stamp:0, live:0, lblMid:{}, st:{}, nudge:0, rm:0, rd:{ weekMiles:0, progRun:0, pvl:0, hasLog:0, session:0 }, ex:null };
  s.n++; const e = r.e; if(e && !e.run_mins && !e.run_dist && !e.run_pace) s.full++; if(e && e.run_dist) s.distSurv++; if(e && e.run_dist === r.stampOracle) s.stamp++;
  if(RD.live(e)) s.live++; bump(s.lblMid, r.lblMid); bump(s.st, String(r.status)); if(r.nudge) s.nudge++; if(r.S !== 'ctl' && !r.rm) s.rm++;
  for(const k2 of Object.keys(s.rd)) if(RD[k2](e)) s.rd[k2]++; if(!s.ex) s.ex = r; }
for(const k of Object.keys(seg).sort()){ const s = seg[k];
  P('  ' + k.padEnd(26) + ' n ' + s.n + ' | full ' + s.full + ' | run_dist survives ' + s.distSurv + ' (==String(mi) ' + s.stamp + ') | label at settle ' + J(s.lblMid) + ' | LIVE after ' + s.live + ' | status ' + J(s.st)
    + (s.ex.S !== 'ctl' ? ' | nudge on reopen ' + s.nudge + ' | restMove withholds ' + s.rm : '') + ' | weekMiles ' + s.rd.weekMiles + ' progRun ' + s.rd.progRun + ' pvl ' + s.rd.pvl + ' _hasLog ' + s.rd.hasLog + ' session ' + s.rd.session
    + '  [ex ' + J(cardioKeys(s.ex.e)) + ']'); }
P('\n§1h HEADLINE: reopened T_zero (one gesture) and the two-gesture clear, all reopened flows pooled');
for(const g of GEST){ const L = RES.filter(r => r.S !== 'ctl' && r.g === g); const full = L.filter(r => r.e && !r.e.run_mins && !r.e.run_dist && !r.e.run_pace).length;
  P('  ' + g.padEnd(14) + ' fully cleared ' + full + '/' + L.length + ', run_dist survives ' + L.filter(r => r.e && r.e.run_dist).length + '/' + L.length + ', card LIVE at the settle ' + L.filter(r => r.lblMid === 'Logged ✓').length + '/' + L.length); }
{ const hd = RES.filter(r => r.flow === 'log>T_zero>back');
  const by = f => { const o = {}; hd.forEach(r => { const k = f(r); o[k] = o[k] || [0, 0]; o[k][1]++; if(r.e && r.e.run_dist) o[k][0]++; }); return Object.entries(o).map(([k, v]) => k + ' ' + v[0] + '/' + v[1]).join(', '); };
  P('  segment log>T_zero>back run_dist survives, by goal: ' + by(r => r.name.split('|')[0]));
  P('  by focus: ' + by(r => r.name.split('|')[1]) + ' | by exp: ' + by(r => r.name.split('|')[2]) + ' | by seed: ' + by(r => r.name.split('|')[3] || 'fixture'));
  P('  by week: ' + by(r => 'W' + r.w)); }
dump('§2 STAMP BYTES vs ATHLETE-ROLLED BYTES (denominator = dose=dist days)', FMT);
dump('§3a _benchmarkEntryFor: benchmark days by dose kind', (() => { const o = {}; BENCH.forEach(b => bump(o, b.k + ' "' + b.sub.slice(0, 40) + '"')); return o; })());
BENCH.filter(b => b.k === 'dist').slice(0, 6).forEach(b => P('    ' + b.name + ' W' + b.w + ' ' + b.d + ' after clear ' + J(b.e) + ' -> _benchmarkEntryFor ' + J(b.ret)));
P('  dist benchmark days with a stamped-only entry credited by the real reader: ' + BENCH.filter(b => b.k === 'dist' && b.ret && b.ret.dist > 0 && b.e && !b.e.run_mins).length + '/' + BENCH.filter(b => b.k === 'dist').length);
P('\n§3b seedFromPriorPrograms (real call): maxDist without -> with the stamped-only entries, hand = max planned miles among them');
{ let moved = 0, eligible = 0; SEEDX.forEach(s => { if(s.skip) return; eligible++; if(s.s1 !== s.s0 && s.s1 === s.hand) moved++; });
  P('  programs where the stamped-only entries set maxDist (== hand): ' + moved + '/' + eligible + ' eligible (skipped ' + SEEDX.filter(s => s.skip).length + ': ' + J([...new Set(SEEDX.filter(s => s.skip).map(s => s.skip))]) + ')');
  SEEDX.filter(s => !s.skip).slice(0, 4).forEach(s => P('    ' + s.name + ' n ' + s.n + ' maxDist ' + J(s.s0) + ' -> ' + J(s.s1) + ' hand ' + s.hand)); }
dump('§3c swap park (setCardioSwap on a reopened stamped entry)', PARK);
P('\n§3d restMoveCandidates (real call) on a day left unmarked after the clear: see "restMove withholds" in §1 (count of reopened drives where the day is NOT offered)');
dump('§3e pre-V148 / V148-V231 text-box shape {rpe, run_dist typed, run_pace typed, no run_mins} on dose=dist days', PRE);
dump('§4 REOPENED MILES WHEEL SEED (hidden input value and face)', X4);
P('\n§6 call sites (comment-stripped): run_dist, log_run_dist, CARDIO_PARK_FIELDS, cardioEntryLive');
const stripC = t => t.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, '')).replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');
const LINES = stripC(fs.readFileSync(CAND, 'utf8')).split('\n');
const fnOf = n => { for(let i = n - 1; i >= 0; i--){ const m = LINES[i].match(/^\s*(?:async )?function ([A-Za-z_$][\w$]*)|^(?:const|let|var) ([A-Za-z_$][\w$]*)=/); if(m) return m[1] || m[2]; } return '?'; };
for(const tok of ['run_dist', 'log_run_dist', 'CARDIO_PARK_FIELDS', 'cardioEntryLive(']){ const hits = []; LINES.forEach((l, i) => { if(l.includes(tok)) hits.push((i + 1) + ':' + fnOf(i + 1)); }); P('  ' + tok + ' (' + hits.length + '): ' + hits.join(', ')); }
P('\nruntime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | drives ' + RES.length + ' | errors ' + ERR.length + ' | app errors ' + C.errs.length + (C.errs.length ? ' first ' + J(C.errs[0]) : ''));
