// v237_distzero.js — MEASURE mA (Mode A) for P-DISTZERO, V237, on the V236 tree.
//   node tests/measure/v237_distzero.js [index.html] [--quick]
// Report (Mario, device, V236): "still doesnt register a time if the dash is in the first wheel" (handoff: the Miles wheel,
//   whole miles on the dash, tenths and hundredths rolled).
// Drive: the real open path and the real V236 commit paths (logCardio, handleDayStatus complete/skipped, the LIVE autosave).
//   DOM stub + virtual clock = mkEnv from tests/measure/v235_clear_reopen.js; stub additions = env() from
//   tests/measure/v236_pace_premise.js (both sliced verbatim, one source).
// Oracle: the face the athlete leaves, by hand: dash read as 0 (dist w + t/10 + h/100; rept m*60+s); plan miles from the
//   session's dose (the plan, not the writer). Never _iawFormat/_iawParse for the expected value.
// Read-only measure; writes nothing but stdout.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const ARGS = process.argv.slice(2).filter(a => !/^--/.test(a));
const CAND = path.resolve(ARGS[0] || path.join(ROOT, 'index.html'));
const QUICK = process.argv.includes('--quick');
const load = H.load, RealDate = Date;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], J = JSON.stringify, P = s => console.log(s);
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v235_clear_reopen.js'), 'utf8');
  const a = src.indexOf('function mkEnv(file){'), b = src.indexOf('\n  return E;\n}', a);
  if(a < 0 || b < 0) throw new Error('mkEnv not found'); eval('global.mkEnv = ' + src.slice(a, b + '\n  return E;\n}'.length)); }
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v236_pace_premise.js'), 'utf8');
  const a = src.indexOf('const STR_IDS = '), b = src.indexOf('\n  return C; }', a);
  if(a < 0 || b < 0) throw new Error('env not found'); eval(src.slice(a, b + '\n  return C; }'.length).replace('const STR_IDS', 'global.STR_IDS').replace('function env(file){', 'global.env = function(file){')); }
const t0 = Date.now();
const C = env(CAND);
P('v237 measure mA P-DISTZERO | ' + CAND + ' ia-version ' + C.VER);
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const W = hid => C.wheel(hid);
const mv = (hid, ci, v) => { const w = W(hid); if(!w) throw new Error('no wheel ' + hid); if(colv(w, ci) !== v) C.move(w, ci, v); };
const face = hid => { const w = W(hid); if(!w) return null; const v = w._cols.map((c, i) => colv(w, i)); const f = v.map(x => x === '' ? '—' : x);
  return w.kind === 'dist' ? f[0] + '.' + f[1] + f[2] : w.kind === 'hms' ? f[0] + ':' + String(f[1]).padStart(2, '0') + ':' + String(f[2]).padStart(2, '0') : f[0] + ':' + String(f[1]).padStart(2, '0'); };
const SEVEN = ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time', 'bike_mins', 'swim_yards'];
const seven = e => e ? Object.fromEntries(SEVEN.concat(['rpe']).map(k => [k, e[k]])) : null;
const label = () => { const b = C.els.cardioLogBtn; if(b && b.textContent) return b.textContent; const m = C.els.detailBody.innerHTML.match(/id="cardioLogBtn"[^>]*>([^<]*)</); return m ? m[1] : null; };
const logTap = () => { C.TOASTS.length = 0; C.ev('logCardio()'); C.advance(500); return C.TOASTS.slice(-1)[0] || null; };
const status = (w, d) => C.ev("statusOf(" + w + ",'" + d + "')");
const tap = (d, s) => { C.TOASTS.length = 0; C.ev("handleDayStatus('" + d + "','x','" + s + "')"); C.advance(500); return C.TOASTS.slice(-1)[0] || null; };
// gestures
const SUBJ = { // the column-0-dash gesture per wheel, its hand intent, and a real "first log" value for LIVE
  log_run_dist:     { kind:'dist', key:'run_dist',     dash:() => { mv('log_run_dist', 0, ''); mv('log_run_dist', 1, '7'); mv('log_run_dist', 2, '5'); }, hand:0.75,
                      zero:() => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '0'); mv('log_run_dist', 2, '0'); },
                      real:() => { mv('log_run_dist', 0, '4'); mv('log_run_dist', 1, '2'); mv('log_run_dist', 2, '0'); } }, // 4.20: never a plan face in the lattice (checked: plan miles printed in §1)
  log_run_rep_time: { kind:'rept', key:'run_rep_time', dash:() => { mv('log_run_rep_time', 0, ''); mv('log_run_rep_time', 1, '45'); }, hand:45,
                      zero:() => { mv('log_run_rep_time', 0, '0'); mv('log_run_rep_time', 1, '0'); },
                      real:() => { mv('log_run_rep_time', 0, '1'); mv('log_run_rep_time', 1, '55'); } },
  log_run_pace:     { kind:'pace', key:'run_pace',     dash:() => { mv('log_run_pace', 0, ''); mv('log_run_pace', 1, '30'); }, hand:null,
                      zero:null, real:() => { mv('log_run_pace', 0, '9'); mv('log_run_pace', 1, '30'); } } };
const COMP = { // the other field the athlete may also log, per shape and subject
  time:  { log_run_dist:['time 0:47:13', () => { mv('log_run_mins', 0, '0'); mv('log_run_mins', 1, '47'); mv('log_run_mins', 2, '13'); }] },
  dist:  { log_run_dist:['time 0:47:13', () => { mv('log_run_mins', 0, '0'); mv('log_run_mins', 1, '47'); mv('log_run_mins', 2, '13'); }] },
  reps_time: { log_run_dist:['reps +1', () => { C.ev('doseRep(1)'); C.advance(50); }] },
  reps_dist: { log_run_rep_time:['reps +1', () => { C.ev('doseRep(1)'); C.advance(50); }] },
  generic: { log_run_dist:['pace 9:30', () => { mv('log_run_pace', 0, '9'); mv('log_run_pace', 1, '30'); }],
             log_run_pace:['miles 3.10', () => { mv('log_run_dist', 0, '3'); mv('log_run_dist', 1, '1'); mv('log_run_dist', 2, '0'); }] } };
const classify = (sj, sv, dose) => { if(sv == null) return 'no entry'; if(sv === '') return "''";
  if(sj.kind === 'dist'){ const n = parseFloat(sv); if(Math.abs(n - sj.hand) < 0.005) return 'hand(0.75)'; if(dose && dose.mi && Math.abs(n - dose.mi) < 0.005) return 'PLAN STAMP(' + sv + ')'; if(Math.abs(n - 4.2) < 0.005) return 'prior 4.20 kept'; return 'other(' + sv + ')'; }
  if(sj.kind === 'rept'){ const m = /^(\d+):(\d\d)$/.exec(sv); if(m && (+m[1]) * 60 + (+m[2]) === sj.hand) return 'hand(0:45)'; if(sv === '1:55') return 'prior 1:55 kept'; return 'other(' + sv + ')'; }
  return 'stored(' + sv + ')'; };
// ── §0 the dash rows per kind ──
P('\n§0 _IAW_SPEC column 0 per kind (nil = dash row; wrap = data-wrap)');
const SP = JSON.parse(C.ev('JSON.stringify(_IAW_SPEC)'));
for(const k of Object.keys(SP)) P('  ' + k.padEnd(5) + ' fmt ' + SP[k].fmt.padEnd(6) + SP[k].cols.map((c, i) => ' col' + i + ' ' + c.min + '..' + c.max + (c.nil ? ' DASH' : '') + ' wrap=' + C.ev('_iawWraps(' + J(c) + ')')).join(' |'));
// ── §1 REPRO at Mario's case ──
P('\n§1 REPRO, HALF_MANNY (seed ' + H.fixtures.HALF_MANNY.seed + '), every W1..W2 run day by dose shape');
const HM = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); C.use(HM); C.unforce();
const doseOf = x => C.ev('__realDFC')(x.cardio);
const shapeOf = x => { const d = doseOf(x); return d ? d.k : 'generic'; };
const firstOf = {};
for(const w of Object.keys(HM.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){ const x = HM.weeks[w][d]; if(!x || x.rest || (x.cardio && x.cardio.type || '').toLowerCase() !== 'run') continue;
  const s = shapeOf(x); if(!firstOf[s]) firstOf[s] = { w, d, sub:x.cardio.subtype, dose:doseOf(x) }; }
P('  first host per shape: ' + J(Object.fromEntries(Object.entries(firstOf).map(([k, v]) => [k, 'W' + v.w + ' ' + v.d + ' "' + v.sub + '" ' + J(v.dose && { mi:v.dose.mi, mins:v.dose.mins, reps:v.dose.reps })]))));
{ const h = firstOf.dist; const { w, d } = h;
  const run = (title, steps, end) => { C.wipe(); C.op(w, d); const f0 = face('log_run_dist'), t0f = face('log_run_mins');
    steps(); const fA = face('log_run_dist'), tA = face('log_run_mins'), hid = C.els.log_run_dist.value, hidT = C.els.log_run_mins.value, pre = C.entry(w, d);
    const toast = end(); const e = C.entry(w, d);
    P('  ' + title + '\n     opened miles ' + f0 + ' time ' + t0f + ' -> left miles ' + fA + ' time ' + tA + ' | hidden log_run_dist ' + J(hid) + ' log_run_mins ' + J(hidT) + ' | entry before tap ' + J(seven(pre))
      + '\n     toast ' + J(toast) + ' label ' + J(label()) + ' status ' + J(status(w, d)) + ' | ia_logs_ w' + w + '_' + d + ' ' + J(seven(e))); return e; };
  P('  HOST dose=dist ' + 'W' + w + ' ' + d + ' "' + h.sub + '" plan ' + h.dose.mi + ' mi');
  run('A1 DRAFT, miles to —.75, time untouched, Log', () => SUBJ.log_run_dist.dash(), logTap);
  run('A2 DRAFT, miles to —.75, time rolled 0:47:13, Log', () => { SUBJ.log_run_dist.dash(); COMP.dist.log_run_dist[1](); }, logTap);
  run('A3 DRAFT, time 0:47:13 then miles to —.75, Log', () => { COMP.dist.log_run_dist[1](); SUBJ.log_run_dist.dash(); }, logTap);
  run('A4 DRAFT, miles to 0.75 (column 0 on 0), time 0:47:13, Log [control]', () => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '7'); mv('log_run_dist', 2, '5'); COMP.dist.log_run_dist[1](); }, logTap);
  run('A5 DRAFT, miles to —.75, time untouched, Done', () => SUBJ.log_run_dist.dash(), () => tap(d, 'complete'));
  run('A6 DRAFT, miles to —.75, time 0:47:13, Done', () => { SUBJ.log_run_dist.dash(); COMP.dist.log_run_dist[1](); }, () => tap(d, 'complete'));
  run('A7 DRAFT, miles to —.75, time 0:47:13, Skip', () => { SUBJ.log_run_dist.dash(); COMP.dist.log_run_dist[1](); }, () => tap(d, 'skipped'));
  run('A8 LIVE (time 0:47:13 + miles 4.20 logged), then miles to —.75 (autosave), no tap', () => { COMP.dist.log_run_dist[1](); SUBJ.log_run_dist.real(); logTap(); SUBJ.log_run_dist.dash(); }, () => null);
  run('A9 LIVE (miles 4.20 only logged), then miles to —.75 (autosave), then Log', () => { SUBJ.log_run_dist.real(); logTap(); SUBJ.log_run_dist.dash(); }, logTap);
  if(firstOf.time){ const t = firstOf.time;
    const runT = (title, steps, end) => { C.wipe(); C.op(t.w, t.d); const f0 = face('log_run_dist'), tf0 = face('log_run_mins'); steps(); const fA = face('log_run_dist'), tA = face('log_run_mins'); const toast = end(); const e = C.entry(t.w, t.d);
      P('  ' + title + '\n     opened miles ' + f0 + ' time ' + tf0 + ' -> left miles ' + fA + ' time ' + tA + ' | toast ' + J(toast) + ' label ' + J(label()) + ' status ' + J(status(t.w, t.d)) + ' | ia_logs_ ' + J(seven(e))); };
    P('  HOST dose=time W' + t.w + ' ' + t.d + ' "' + t.sub + '" plan ' + t.dose.mins + ' min');
    runT('B1 DRAFT, time on plan face untouched, miles —.75 (opens on dash), Log', () => SUBJ.log_run_dist.dash(), logTap);
    runT('B2 DRAFT, time rolled 0:47:13, miles —.75, Log', () => { COMP.time.log_run_dist[1](); SUBJ.log_run_dist.dash(); }, logTap);
    runT('B3 DRAFT, time untouched, miles 0.75 [control], Log', () => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '7'); mv('log_run_dist', 2, '5'); }, logTap); }
  // hms after D215: can the time wheel still lose a time to a column-0 dash?
  C.wipe(); C.op(w, d); const hw = W('log_run_mins'); const rows0 = hw._cols[0].items.map(i => i.v);
  P('  hms (run_mins) column 0 rows: ' + J([...new Set(rows0)]) + ' -> dash row present: ' + rows0.includes('') + '; opened face ' + face('log_run_mins'));
  let hmsErr = null; try { mv('log_run_mins', 0, ''); } catch(e){ hmsErr = e.message; } P('  move hms column 0 to the dash: ' + (hmsErr ? 'impossible (' + hmsErr + ')' : 'MOVED'));
}
// ── §2 SWEEP ──
const mkCfg = (sports, f, ex, sd, inj) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  const c = { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
  if(inj) c.injury = inj; return c; };
const GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'];
const FOC = QUICK ? ['balanced'] : ['balanced', 'strength'], EXP = QUICK ? ['intermediate'] : ['beginner', 'advanced'], SEEDS = QUICK ? [76308] : [76308, 24865];
const PROGS = [['HALF_MANNY|fixture', JSON.parse(J(H.fixtures.HALF_MANNY))]];
for(const g of GOALS) for(const f of FOC) for(const ex of EXP) for(const sd of SEEDS) PROGS.push([g + '|' + f + '|' + ex + '|' + sd, mkCfg([['run', g]], f, ex, sd)]);
for(const sd of SEEDS) PROGS.push(['multi run_half+bike+swim|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', sd)]);
for(const reg of ['knee', 'ankle', 'lowback']) PROGS.push(['injury ' + reg + ' run_10k+bike', mkCfg([['run', 'run_10k'], ['bike', 'bike_base']], 'balanced', 'intermediate', 76308, { region:reg, tier:'protect' })]);
const NRC = n => /run_(5k|10k|half|marathon)|HALF_MANNY|multi|injury/.test(n) ? 'NRC' : 'NSW';
const T = {}, EX = {}, ERR = []; const bump = (k, n) => { T[k] = (T[k] || 0) + (n || 1); };
let nP = 0, nDays = 0, nDrives = 0;
const PATHS = ['draft-Log', 'draft-Done', 'draft-Skip', 'live-autosave', 'live-then-Log', 'zero-face-Log'];
for(const [name, cfg] of PROGS){
  let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  nP++; C.use(p); C.unforce();
  for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){
    const x = p.weeks[w][d]; if(!x || x.rest || !x.cardio || Array.isArray(x.cardio) || (x.cardio.type || '').toLowerCase() !== 'run') continue;
    const dose = doseOf(x), shape = (/Cross-Train/.test(x.cardio.subtype || '') ? 'xtrain ' : '') + shapeOf(x); nDays++; bump('DAYS | ' + shape);
    C.wipe(); C.op(w, d);
    const subs = Object.keys(SUBJ).filter(h => W(h));
    for(const hid of subs){ const sj = SUBJ[hid]; const comp = (COMP[shape.replace('xtrain ', '')] || {})[hid];
      const opened = (() => { C.wipe(); C.op(w, d); return colv(W(hid), 0) === '' ? 'opens-dash' : 'opens-plan'; })();
      for(const withC of comp ? [false, true] : [false]) for(const pth of PATHS){
        if(pth === 'zero-face-Log' && (!sj.zero || withC)) continue;
        try {
          C.wipe(); C.op(w, d); let toast = null, mid = null;
          if(pth.startsWith('live')){ if(withC) comp[1](); sj.real(); logTap(); sj.dash(); mid = C.entry(w, d); if(pth === 'live-then-Log') toast = logTap(); }
          else if(pth === 'zero-face-Log'){ sj.zero(); toast = logTap(); }
          else { sj.dash(); if(withC) comp[1](); toast = pth === 'draft-Log' ? logTap() : tap(d, pth === 'draft-Done' ? 'complete' : 'skipped'); }
          const e = C.entry(w, d); const sv = e ? e[sj.key] : null;
          const cls = pth === 'zero-face-Log' ? (sv == null ? 'no entry' : J(sv)) : classify(sj, sv, dose);
          const k = sj.kind + ':' + hid.replace('log_', '') + ' | ' + shape + ' | ' + opened + ' | ' + (withC ? '+' + comp[0] : 'alone') + ' | ' + pth;
          nDrives++; bump(k + ' | n'); bump(k + ' | ' + cls + ' | toast ' + J(toast) + ' | live ' + C.ev("cardioLive('" + d + "')"));
          bump('BY ' + sj.kind + ' | ' + pth + ' | ' + (withC ? 'with' : 'alone') + ' | ' + (/hand/.test(cls) ? 'KEPT' : (pth === 'zero-face-Log' ? 'zero:' + cls : 'LOST ' + cls.replace(/\(.*\)/, '()'))));
          bump('TOAST ' + sj.kind + ' | ' + shape + ' | ' + pth + ' | ' + (withC ? 'with' : 'alone') + ' | ' + J(toast));
          bump('SEG ' + sj.kind + ' | ' + NRC(name) + ' | ' + name.split('|')[0] + ' | ' + (/hand/.test(cls) || pth === 'zero-face-Log' ? 'ok' : 'lost'));
          if(!EX[k]) EX[k] = name + ' W' + w + ' ' + d + ' "' + x.cardio.subtype + '" left ' + face(hid) + ' mid ' + J(mid && seven(mid)) + ' final ' + J(seven(e)) + ' toast ' + J(toast);
        } catch(err){ ERR.push(name + ' W' + w + ' ' + d + ' ' + hid + ' ' + pth + ': ' + String(err.message).slice(0, 140)); }
      }
    }
  }
}
P('\n§2 SWEEP ' + nP + '/' + PROGS.length + ' programs, ' + nDays + ' run days, ' + nDrives + ' drives, errors ' + ERR.length + ', ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 10).forEach(e => P('  ERR ' + e));
P('  §2a headline: kind | path | companion | outcome : count');
Object.keys(T).filter(k => /^BY /.test(k)).sort().forEach(k => P('    ' + k + ' : ' + T[k]));
P('  §2a2 toast: kind | shape | path | companion | toast : count');
Object.keys(T).filter(k => /^TOAST /.test(k)).sort().forEach(k => P('    ' + k + ' : ' + T[k]));
P('  §2b segment: kind | doctrine | goal | ok/lost : count');
Object.keys(T).filter(k => /^SEG /.test(k)).sort().forEach(k => P('    ' + k + ' : ' + T[k]));
P('  §2c days by shape: ' + J(Object.fromEntries(Object.entries(T).filter(([k]) => /^DAYS/.test(k)))));
P('  §2d detail: wheel | shape | open | companion | path | outcome | toast | live after : count');
Object.keys(T).filter(k => !/^(BY|SEG|DAYS|TOAST) /.test(k) && !/^DAYS/.test(k)).sort().forEach(k => P('    ' + k + ' : ' + T[k]));
P('  §2e first example per detail key'); Object.keys(EX).sort().forEach(k => P('    ' + k + ' : ' + EX[k]));
// ── §3 fact base ──
P('\n§3 FACT BASE');
for(const [k, v] of [['dist', ''], ['rept', ''], ['pace', ''], ['dist', '0.00'], ['rept', '0:00'], ['dist', '0'], ['dist', '.75']]) P('  _iawParse(' + J(k) + ',' + J(v) + ') = ' + C.ev('JSON.stringify(_iawParse(' + J(k) + ',' + J(v) + '))'));
for(const [k, v] of [['dist', ['0', '0', '0']], ['rept', ['0', '0']], ['dist', ['', '7', '5']], ['dist', ['0', '7', '5']], ['rept', ['', '45']], ['rept', ['0', '45']], ['pace', ['', '30']], ['dist', ['', '0', '0']]]) P('  _iawFormat(' + J(k) + ',' + J(v) + ') = ' + J(C.ev('_iawFormat(' + J(k) + ',' + J(v) + ')')));
P('  readers on a stored zero face (each reader called as shipped):');
for(const [k, v] of [['run_dist', '0.00'], ['run_rep_time', '0:00'], ['run_dist', '']]){ const e = { [k]:v };
  P('    ' + k + '=' + J(v) + ': cardioEntryLive(run) ' + C.ev('cardioEntryLive(' + J(e) + ",'run')") + ' | truthy (_hasLog / restMove / session style) ' + !!v + ' | parseFloat>0 (charts, pvl, ladder, bench) ' + (parseFloat(v) > 0)
    + (k === 'run_rep_time' ? ' | _parseClock ' + J(C.ev('_parseClock(' + J(v) + ')')) : '') + ' | logCardio empty test (=== "") ' + (v === '')); }
// ── §4 reopened LIVE dose=dist two-gesture clear ──
P('\n§4 REOPENED LIVE dose=dist clear (HALF_MANNY host), time logged 0:47:13 then Log then Done; reopen; clear');
C.use(HM); C.unforce();
{ const { w, d } = firstOf.dist;
  const setup = () => { C.wipe(); C.op(w, d); COMP.dist.log_run_dist[1](); const t1 = logTap(); const e1 = seven(C.entry(w, d)); tap(d, 'complete'); const e2 = seven(C.entry(w, d)); C.op(w, d); return [t1, e1, e2]; };
  const [t1, e1, e2] = setup();
  P('  setup: Log toast ' + J(t1) + ' stored ' + J(e1) + ' | after Done ' + J(e2) + ' | reopen faces miles ' + face('log_run_dist') + ' time ' + face('log_run_mins') + ' label ' + J(label()));
  const seqs = { 'A time->zero, then miles->dash': [['time->0:00:00', () => { mv('log_run_mins', 1, '0'); mv('log_run_mins', 2, '0'); }], ['miles->dash', () => mv('log_run_dist', 0, '')]],
    'B miles->dash, then time->zero': [['miles->dash', () => mv('log_run_dist', 0, '')], ['time->0:00:00', () => { mv('log_run_mins', 1, '0'); mv('log_run_mins', 2, '0'); }]],
    'C time->zero, then miles->0.00 (today\'s zero row)': [['time->0:00:00', () => { mv('log_run_mins', 1, '0'); mv('log_run_mins', 2, '0'); }], ['miles->0.00', () => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '0'); mv('log_run_dist', 2, '0'); }]],
    'D time->zero only': [['time->0:00:00', () => { mv('log_run_mins', 1, '0'); mv('log_run_mins', 2, '0'); }]] };
  for(const [sn, steps] of Object.entries(seqs)){ setup(); P('  ' + sn);
    for(const [stn, fn] of steps){ fn(); P('    ' + stn.padEnd(16) + ' faces miles ' + face('log_run_dist') + ' time ' + face('log_run_mins') + ' | stored ' + J(seven(C.entry(w, d))) + ' | live ' + C.ev("cardioLive('" + d + "')") + ' label ' + J(label())); }
    C.ev('closeDetail()'); C.advance(200); C.op(w, d); P('    reopen: faces miles ' + face('log_run_dist') + ' time ' + face('log_run_mins') + ' status ' + J(status(w, d)) + ' nudge ' + C.els.detailBody.innerHTML.includes('You logged this one but never marked it.')); }
}
// ── §5 readers, comment-stripped whole file (string-aware), every hit ──
P('\n§5 READERS (comment-stripped, every hit, line numbers)');
function stripComments(src){ let o = '', i = 0; const n = src.length; let st = null;
  while(i < n){ const c = src[i], c2 = src[i + 1];
    if(st){ o += c; if(c === '\\'){ o += c2 || ''; i += 2; continue; } if(c === st) st = null; i++; continue; }
    if(c === '"' || c === "'" || c === '`'){ st = c; o += c; i++; continue; }
    if(c === '/' && c2 === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && c2 === '*'){ i += 2; while(i < n && !(src[i] === '*' && src[i + 1] === '/')){ if(src[i] === '\n') o += '\n'; i++; } i += 2; continue; }
    o += c; i++; }
  return o; }
const raw = fs.readFileSync(CAND, 'utf8'); const sOpen = raw.indexOf('<script>', raw.indexOf('<body')); 
const lineStrip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1'); // v235's per-line strip (the string-aware pass stalled on a regex literal: raw == stripped)
const L = raw.split('\n').map(lineStrip); const RL = raw.split('\n');
if(L.length !== RL.length) P('  WARN stripped line count ' + L.length + ' != raw ' + RL.length);
for(const tok of ['log_run_dist', 'log_run_rep_time', 'log_run_pace', 'run_dist', 'run_rep_time', "'dist'", "'rept'", "if(vals[0]==='') return '';"]){
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (/^\w+$/.test(tok) ? '(?![A-Za-z0-9_])' : ''), 'g');
  const hits = []; let cnt = 0; L.forEach((l, i) => { const m = l.match(re); if(m){ hits.push(i + 1); cnt += m.length; } });
  const rawCnt = (raw.match(re) || []).length;
  P('  ' + tok + ' : ' + cnt + ' code hits on ' + hits.length + ' lines (raw incl. comments ' + rawCnt + '): ' + hits.join(', ')); }
P('  context per run_dist / run_rep_time line:');
for(const tok of ['run_dist', 'run_rep_time']){ const re = new RegExp('(?<![A-Za-z0-9_])' + tok + '(?![A-Za-z0-9_])');
  L.forEach((l, i) => { if(re.test(l)){ let fn = ''; for(let j = i; j >= 0 && j > i - 400; j--){ const m = L[j].match(/function\s+([A-Za-z0-9_$]+)\s*\(/); if(m){ fn = m[1]; break; } }
    P('    :' + (i + 1) + ' [' + tok + '] in ' + (fn || '?') + ' | ' + l.trim().slice(0, 150)); } }); }
P('\nruntime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | drives ' + nDrives + ' | errors ' + ERR.length);
