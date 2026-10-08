// v236_logbutton.js — MEASURE m1 (Mode B, before-picture) for P-LOGBUTTON, V236.
//   node tests/measure/v236_logbutton.js [index.html] [--quick]
// Question: every auto-save path on the cardio card today (field, element, event, handler, keys), the side effects of the
//   first write and every reader of it, what Done does, V182 D3's hazard counted (a face showing a value while the store holds
//   nothing), the two explicit-log precedents, and the lifecycle paths off the session log.
// Drive: the real open path (openDayKey -> openDetail -> buildLogHTML -> cardioFieldHTML -> listener arrays -> iaWheelInit),
//   the wheels' real scroll settle, real handleDayStatus / closeDetail / setCardioSwap / doseRep / applyRestCardio /
//   saveExWeight. DOM stub + virtual clock = mkEnv, loaded verbatim from tests/measure/v235_clear_reopen.js (one source).
// Oracles (independent of the suspect): faces are read off the wheel rows' data-v by hand arithmetic (h*3600+m*60+s;
//   whole.tenths hundredths; m:ss); "stored" is the raw ia_logs_ entry; reader credit is each reader's predicate restated
//   from its own line (cited), cross-checked against the rendered nudge and Progress charts on first hosts.
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
{ // mkEnv, verbatim from the V235 measure
  const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v235_clear_reopen.js'), 'utf8');
  const a = src.indexOf('function mkEnv(file){'), b = src.indexOf('\n  return E;\n}', a);
  if(a < 0 || b < 0) throw new Error('mkEnv not found in v235_clear_reopen.js');
  eval('global.mkEnv = ' + src.slice(a, b + '\n  return E;\n}'.length));
}
const t0 = Date.now();
const C = mkEnv(CAND); const VER = +C.IA.version;
P('candidate ' + CAND + ' ia-version ' + VER);
// stub additions: placeholder parse + prefix selector (saveExWeight reads input[id^="exset_<k>_"]); toast capture
const TOASTS = []; C.ev('var __rs=showToast; showToast=function(m){ globalThis.__toast(m); };'); C.ctx.__toast = m => TOASTS.push(String(m));
const doc = C.ctx.document, qsa0 = doc.querySelectorAll, gid0 = doc.getElementById;
const effHtml = () => { let b = (C.els.detailBody && C.els.detailBody._html) || ''; const cf = C.els.cardioFields && C.els.cardioFields._html;
  if(cf){ const a = b.indexOf('<div id="cardioFields">'), z = b.indexOf('<button type="button" id="cardioSwapLink"'); if(a >= 0 && z > a) b = b.slice(0, a) + '<div id="cardioFields">' + cf + '</div>' + b.slice(z); }
  return b; }; // the markup a real DOM would hold after setCardioSwap re-rendered #cardioFields
const inMarkup = id => effHtml().includes('id="' + id + '"');
doc.getElementById = id => (/^(log_|exset_|exsetw_|exw_|excard_|exbadge_|doseRepVal|doseDerived|cardioSwapWrap|cardioPicker|cardioSwapNote)/.test(id) && !inMarkup(id)) ? null : gid0(id);
// stub note: mkEnv creates any element on demand; a real DOM returns null for an id not in the markup. Without this, rawSetVals
// loops forever (exset_<k>_<n> never ends) and a pending wheel settle finds a phantom node on a day that has no such field.
doc.querySelectorAll = sel => { const m = /^input\[id\^="([^"]+)"\]$/.exec(sel); if(m) return Object.values(C.els).filter(e => e.id.startsWith(m[1]) && !/_d$/.test(e.id)); return qsa0(sel); };
const fixPlaceholders = () => { const html = C.els.detailBody.innerHTML; const re = /<input[^>]*?\sid="([^"]+)"[^>]*>/g; let m;
  while((m = re.exec(html))){ const ph = m[0].match(/\splaceholder="([^"]*)"/); if(ph && C.els[m[1]]) C.els[m[1]].placeholder = ph[1]; } };
const STR_IDS = ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe', 'log_swim_yards', 'log_notes'];
const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
  Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
const open = (w, d) => { if(C.els.cardioFields) C.els.cardioFields._html = ''; C.open(w, d); STR_IDS.forEach(strv); fixPlaceholders(); };
const wipe = () => { [...C.LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => C.LS.removeItem(k)); };
const hist = () => JSON.parse(C.LS.getItem('ia_hist_measure') || '{}');
const comp = () => JSON.parse(C.LS.getItem('ia_comp_measure') || '{}');
const st = (w, d) => C.ev("statusOf(" + w + ",'" + d + "')");
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const W = hid => C.wheel(hid);
const mv = (hid, ci, v) => { const w = W(hid); if(!w) throw new Error('no wheel ' + hid); if(colv(w, ci) !== v) C.move(w, ci, v); };
const fire = (id, v) => { const el = C.els[id]; if(!el) throw new Error('no el ' + id); el.value = v; el.dispatchEvent(new C.ctx.Event('input')); C.advance(50); };
const done = (d, s) => { C.ev("handleDayStatus('" + d + "','x','" + (s || 'complete') + "')"); C.advance(500); };
const strip = e => e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'ts').sort()) : null;
// ── hand face oracle: what the wheel shows, from its rows, no app function ──
function faceOf(wh){ const v = wh._cols.map((c, i) => colv(wh, i));
  if(wh.kind === 'hms'){ const t = (+v[0] || 0) * 3600 + (+v[1] || 0) * 60 + (+v[2] || 0); return { show:t > 0, txt:v.join(':'), sec:t }; }
  if(wh.kind === 'dist'){ if(v[0] === '') return { show:false, txt:'-.' + v[1] + v[2], dashDigits:(v[1] !== '0' || v[2] !== '0'), num:null };
    const n = +v[0] + (+v[1]) / 10 + (+v[2]) / 100; return { show:n > 0, txt:v[0] + '.' + v[1] + v[2], num:n }; }
  // pace / rept: m:ss
  if(v[0] === '') return { show:false, txt:'-:' + v[1], dashDigits:v[1] !== '0' && v[1] !== '' };
  const t = (+v[0]) * 60 + (+v[1] || 0); return { show:t > 0, txt:v[0] + ':' + String(v[1]).padStart(2, '0'), sec:t }; }
const KEY = { log_run_mins:'run_mins', log_run_dist:'run_dist', log_run_pace:'run_pace', log_run_rep_time:'run_rep_time', log_bike_mins:'bike_mins', log_swim_yards:'swim_yards', log_run_reps:'run_reps', log_notes:'notes', log_rpe:'rpe' };
// stored equals face, by hand
function agrees(wh, f, sv){ if(sv == null || sv === '') return false;
  if(wh.kind === 'hms') return Math.abs(parseFloat(sv) * 60 - f.sec) <= 1;
  if(wh.kind === 'dist') return Math.abs(parseFloat(sv) - f.num) < 0.005;
  const m = String(sv).match(/^(\d+):(\d\d)/); return !!m && (+m[1]) * 60 + (+m[2]) === f.sec; }
// every visible field on the card and its face-vs-store class
function scan(w, d){
  const e = C.entry(w, d) || {}; const out = [];
  for(const wh of C.wheels()){ const f = faceOf(wh), sv = e[KEY[wh.hid]];
    const stored = sv != null && sv !== '';
    let cls;
    if(f.show && !stored) cls = (wh.plan != null && C.els[wh.hid] && C.els[wh.hid].value === '') ? 'plan-face(D202)' : 'value-face,nothing-stored';
    else if(f.show && stored) cls = agrees(wh, f, sv) ? 'agree' : 'face!=store';
    else if(!f.show && stored) cls = 'blank-face,stored(' + sv + ')';
    else cls = f.dashDigits ? 'dash-with-digits(P-DISTZERO)' : (wh.kind === 'hms' ? 'zero-face(D215)' : 'blank');
    out.push({ fld:wh.kind + ':' + wh.hid.replace('log_', ''), cls, face:f.txt }); }
  const _rh = effHtml(); const _rm = _rh.match(/id="doseRepVal">([^<]*)</);
  if(_rm && inMarkup('log_run_reps')){ const rv = C.els.doseRepVal; const shown = (rv && rv.textContent !== '' ? String(rv.textContent) : _rm[1]), sv = e.run_reps;
    out.push({ fld:'stepper:run_reps', cls:(sv == null || sv === '') ? (+shown > 0 ? 'plan-count,nothing-stored' : 'blank') : (String(sv) === shown ? 'agree' : 'face!=store') }); }
  if(inMarkup('log_swim_yards')){ const v = C.els.log_swim_yards.value, sv = e.swim_yards; out.push({ fld:'box:swim_yards', cls:v === '' ? (sv ? 'blank-face,stored' : 'blank') : (String(sv) === v ? 'agree' : 'value-face,nothing-stored') }); }
  if(C.els.log_rpe){ const disp = String(C.els.rpeDisplay ? C.els.rpeDisplay.textContent : ''); const sv = e.rpe;
    const shownLabel = /Move slider/.test(C.els.detailBody.innerHTML.match(/id="rpeDisplay"[^>]*>([^<]*)</) ? C.els.detailBody.innerHTML.match(/id="rpeDisplay"[^>]*>([^<]*)</)[1] : '');
    out.push({ fld:'slider:rpe', cls:(sv == null || sv === '') ? 'thumb-at-5,nothing-stored' : (shownLabel ? 'label"Move slider",stored(' + sv + ')' : 'agree') }); }
  return out;
}
// readers restated from their own lines
const RD = {
  hasLog:    e => !!(e && ((e.notes && e.notes.trim()) || e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time || e.bike_mins || e.swim_yards)), // :14175 openDetail
  session:   e => !!(e && (e.rpe || e.run_dist || e.bike_mins || e.swim_yards || e.notes)),             // :17520 renderProgressScreen
  restMoveBlock: e => !!(e && (e.rpe || e.notes || e.run_dist || e.bike_mins || e.swim_yards)),       // :1536 restMoveCandidates
  weekMiles: e => { const v = parseFloat((e || {}).run_dist); return isNaN(v) ? 0 : v; },              // :12206 renderWeekView
  progRun:   e => (e && e.run_dist && +e.run_dist > 0) ? +e.run_dist : 0,                              // :17513
  progBike:  e => (e && e.bike_mins && +e.bike_mins > 0) ? +e.bike_mins : 0,                           // :17514
  progSwim:  e => (e && e.swim_yards && +e.swim_yards > 0) ? +e.swim_yards : 0,                        // :17515
  pvl:       e => (e && +e.run_dist > 0) ? +e.run_dist : 0,                                            // :16659 plannedVsLogged
  ladder:    e => (e && +e.run_dist > 0) ? 1 : 0,                                                      // :16589 ladderWeekly
  bench:     e => !!(e && parseFloat(e.run_dist) > 0)                                                  // :13048 _benchmarkEntryFor
};
// ── lattice ──
const mkCfg = (sports, f, ex, sd, inj) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  const c = { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
  if(inj) c.injury = inj; return c; };
const GOALS = [['run', 'run_5k'], ['run', 'run_10k'], ['run', 'run_half'], ['run', 'run_marathon'], ['run', 'run_base'], ['run', 'run_pace_goal'],
  ['bike', 'bike_century'], ['bike', 'bike_50'], ['bike', 'bike_base'], ['bike', 'bike_ftp'], ['bike', 'bike_cals'],
  ['swim', 'swim_100_time'], ['swim', 'swim_500_time'], ['swim', 'swim_base'], ['swim', 'swim_mile'], ['swim', 'swim_tri']];
const FOC = QUICK ? ['balanced'] : ['balanced', 'strength'], EXP = QUICK ? ['intermediate'] : ['beginner', 'advanced'], SEEDS = QUICK ? [76308] : [76308, 24865];
const PROGS = [['HALF_MANNY|fixture', JSON.parse(J(H.fixtures.HALF_MANNY))]];
for(const g of GOALS) for(const f of FOC) for(const ex of EXP) for(const sd of SEEDS) PROGS.push([g[1] + '|' + f + '|' + ex + '|' + sd, mkCfg([g], f, ex, sd)]);
for(const sd of SEEDS) PROGS.push(['multi run_half+bike_base+swim_base|balanced|intermediate|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', sd)]);
for(const reg of ['shoulder', 'knee', 'ankle', 'hip', 'lowback']) for(const sports of [[['run', 'run_10k'], ['bike', 'bike_base']], [['run', 'run_10k'], ['swim', 'swim_base']], [['swim', 'swim_base'], ['bike', 'bike_base']]])
  PROGS.push(['injury ' + reg + ' ' + sports.map(s => s[0]).join('+') + '|balanced|intermediate|76308', mkCfg(sports, 'balanced', 'intermediate', 76308, { region:reg, tier:'protect' })]);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const variantOf = (x, ct) => { const sub = (x.cardio.subtype || ''); const dose = C.ev('__realDFC')(x.cardio);
  const base = ct === 'run' ? (dose ? 'run:' + dose.k : 'run:generic') : ct + (ct === 'bike' && dose ? ':' + dose.k : ct === 'bike' ? ':nodose' : '');
  return (/Cross-Train/.test(sub) ? 'xtrain ' : '') + base; };
// the "free field" gesture per variant: the one number the athlete logs
const LOGG = {
  'run:time': () => { mv('log_run_dist', 0, '3'); mv('log_run_dist', 1, '1'); mv('log_run_dist', 2, '0'); },
  'run:dist': () => { mv('log_run_mins', 1, '47'); mv('log_run_mins', 2, '13'); },
  'run:reps_time': () => { mv('log_run_dist', 0, '0'); mv('log_run_dist', 1, '8'); mv('log_run_dist', 2, '6'); },
  'run:reps_dist': () => { mv('log_run_rep_time', 0, '1'); mv('log_run_rep_time', 1, '55'); },
  'run:generic': () => { mv('log_run_dist', 0, '3'); mv('log_run_dist', 1, '1'); mv('log_run_dist', 2, '0'); },
  bike: () => { mv('log_bike_mins', 1, '47'); mv('log_bike_mins', 2, '13'); },
  swim: () => { ['1', '15', '150', '1500'].forEach(v => fire('log_swim_yards', v)); }
};
const logKind = v => { const b = v.replace(/^xtrain /, ''); return /^bike/.test(b) ? 'bike' : b === 'swim' ? 'swim' : b; };
const HZ3 = {}; const VAR = {}, HZ = {}, HZ1 = {}, HZ2 = {}, FW = {}, DONE0 = {}, ERR = [], FIRSTHOST = {};
const bump = (o, k, n) => { o[k] = (o[k] || 0) + (n || 1); };
let nP = 0, nDays = 0;
for(const [name, cfg] of PROGS){
  let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  nP++; C.use(p); C.unforce();
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || !['run', 'bike', 'swim'].includes(ct)) continue;
    const v = variantOf(x, ct); nDays++; bump(VAR, v);
    try {
      // S0: fresh open, nothing stored
      wipe(); TOASTS.length = 0; open(w, d);
      const in0 = C.inputs(), ls0 = C.LS.getItem('ia_logs_measure');
      scan(w, d).forEach(r => bump(HZ, v + ' | ' + r.fld + ' | ' + r.cls));
      if(in0 || ls0) bump(FW, v + ' | OPEN WROTE');
      // S1: one gesture on the free field (settled)
      LOGG[logKind(v)]();
      const e1 = C.entry(w, d), h1 = !!hist()['w' + w + '_' + d];
      bump(FW, v + ' | after free-field gesture: entry ' + !!e1 + ', ia_hist_ snapshot ' + h1 + ', status ' + st(w, d) + ', rpe stored ' + J(e1 && e1.rpe) + ', inputs ' + (C.inputs() > 0));
      scan(w, d).forEach(r => bump(HZ1, v + ' | ' + r.fld + ' | ' + r.cls));
      // S2: Done, reopen
      done(d); open(w, d);
      scan(w, d).forEach(r => bump(HZ2, v + ' | ' + r.fld + ' | ' + r.cls));
      if(!FIRSTHOST[v]) FIRSTHOST[v] = { name, w, d, sub:x.cardio.subtype, e1:strip(e1), form:C.form().replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/\s+/g, ' ').slice(0, 160) };
      // D0: Done on the untouched form
      wipe(); open(w, d); done(d);
      const e0 = C.entry(w, d);
      bump(DONE0, v + ' | Done on untouched form: entry ' + !!e0 + (e0 ? ' keys non-empty ' + J(Object.keys(strip(e0)).filter(k => e0[k] !== '' && k !== 'week')) : '') + ', status ' + st(w, d) + ', hist ' + !!hist()['w' + w + '_' + d]
        + ', session ' + RD.session(e0) + ', _hasLog ' + RD.hasLog(e0));
      // S3: the column-0 dash gesture (P-DISTZERO) on every miles / rep-time / pace wheel the form shows
      for(const [hid, seq] of [['log_run_dist', [['0', '0'], ['1', '8'], ['2', '6'], ['0', '']]], ['log_run_rep_time', [['0', '0'], ['1', '55'], ['0', '']]], ['log_run_pace', [['0', '9'], ['1', '30'], ['0', '']]]]){
        wipe(); open(w, d); const wh = W(hid); if(!wh) continue;
        seq.forEach(([ci, val]) => mv(hid, +ci, val));
        const r = scan(w, d).find(q => q.fld.endsWith(':' + hid.replace('log_', '')));
        bump(HZ3, v + ' | ' + r.fld + ' rolled then whole to dash | ' + r.cls + ' face ' + faceOf(W(hid)).txt + ' stored ' + J((C.entry(w, d) || {})[KEY[hid]]));
      }
    } catch(err){ ERR.push(name + ' W' + w + ' ' + d + ' ' + v + ': ' + String(err.message).slice(0, 160)); }
  }
}
P('§0 LATTICE: ' + nP + ' programs built (' + (PROGS.length - nP) + ' failed), ' + nDays + ' cardio days opened; errors ' + ERR.length + '; ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 8).forEach(e => P('  ERR ' + e));
P('  days by form variant: ' + J(VAR));
const dump = (title, o) => { P('\n' + title); Object.keys(o).sort().forEach(k => P('  ' + k + ' : ' + o[k])); };
dump('§1a FIRST HOST per variant (form markup head, entry after the free-field gesture, ts stripped)', Object.fromEntries(Object.entries(FIRSTHOST).map(([k, v]) => [k, v.name + ' W' + v.w + ' ' + v.d + ' "' + v.sub + '" entry ' + J(v.e1)])));
dump('§1b OPEN and FIRST WRITE per variant (denominator = days of that variant)', FW);
dump('§4a HAZARD S0 fresh open, empty store: field | face-vs-store class : count (denominator = days of the variant)', HZ);
dump('§4b HAZARD S1 after the one free-field gesture (settled)', HZ1);
dump('§4c HAZARD S2 after Done and reopen', HZ2);
dump('§3a DONE on an untouched form', DONE0);
dump('§4e HAZARD S3 column-0 dash gesture (P-DISTZERO), one per wheel per day', HZ3);
// totals for the hazard
const tot = o => { const t = {}; for(const [k, n] of Object.entries(o)){ const cls = k.split(' | ')[2]; bump(t, cls, n); } return t; };
P('\n§4d HAZARD totals by class (field-instances): S0 ' + J(tot(HZ)) + '\n   S1 ' + J(tot(HZ1)) + '\n   S2 ' + J(tot(HZ2)));
{ const t3 = {}; for(const [k, n] of Object.entries(HZ3)) bump(t3, k.split(' | ')[2].replace(/ face .*/, ''), n); P('   S3 ' + J(t3)); }
// ── §1c per-field write table on hand hosts ──
P('\n§1c PER-FIELD WRITE TABLE (one fresh open per field gesture; keys = non-empty keys of the entry after; ev = input events)');
const HOSTS = {}; for(const [v, h] of Object.entries(FIRSTHOST)) HOSTS[v] = h;
const reb = (h) => { const cfg = PROGS.find(q => q[0] === h.name)[1]; const p = C.IA.buildProgram(cfg); C.use(p); C.unforce(); return p; };
const GEST = {
  'wheel hms log_run_mins': () => { mv('log_run_mins', 1, '30'); }, 'wheel dist log_run_dist': () => { mv('log_run_dist', 0, '2'); },
  'wheel pace log_run_pace': () => { mv('log_run_pace', 0, '9'); }, 'wheel rept log_run_rep_time': () => { mv('log_run_rep_time', 0, '1'); },
  'wheel hms log_bike_mins': () => { mv('log_bike_mins', 1, '30'); }, 'box log_swim_yards (type 1,15,150,1500)': () => { ['1', '15', '150', '1500'].forEach(v => fire('log_swim_yards', v)); },
  'stepper doseRep(+1)': () => { C.ev('doseRep(1)'); C.advance(50); }, 'slider log_rpe -> 7': () => fire('log_rpe', '7'), 'textarea log_notes "ok"': () => { fire('log_notes', 'o'); fire('log_notes', 'ok'); },
  'chip setCardioSwap(other)': null, 'Done': () => done(C.__d), 'Skip': () => done(C.__d, 'skipped')
};
for(const [v, h] of Object.entries(HOSTS)){
  for(const [g, fn] of Object.entries(GEST)){
    try {
      reb(h); wipe(); open(h.w, h.d); C.__d = h.d;
      const ids = { 'wheel hms log_run_mins':W('log_run_mins') && W('log_run_mins').kind === 'hms', 'wheel dist log_run_dist':!!W('log_run_dist'), 'wheel pace log_run_pace':!!W('log_run_pace'),
        'wheel rept log_run_rep_time':!!W('log_run_rep_time'), 'wheel hms log_bike_mins':!!W('log_bike_mins'), 'box log_swim_yards (type 1,15,150,1500)':!!C.els.log_swim_yards && /log_swim_yards/.test(C.els.detailBody.innerHTML),
        'stepper doseRep(+1)':/doseRep\(1\)/.test(C.els.detailBody.innerHTML), 'slider log_rpe -> 7':true, 'textarea log_notes "ok"':true, 'chip setCardioSwap(other)':true, Done:true, Skip:true };
      if(!ids[g]) continue;
      let cnt = 0; const before = C.inputs(); const wr0 = C.LS.getItem('ia_logs_measure');
      let writes = 0; const LSset = C.LS.setItem.bind(C.LS); C.LS.setItem = (k, val) => { if(k === 'ia_logs_measure') writes++; return LSset(k, val); };
      if(g === 'chip setCardioSwap(other)'){ const planned = C.els.cardioSwapWrap.dataset.planned; C.ev("setCardioSwap('" + (planned === 'bike' ? 'run' : 'bike') + "')"); C.advance(200); }
      else fn();
      C.LS.setItem = LSset;
      const e = C.entry(h.w, h.d); const ne = e ? Object.keys(strip(e)).filter(k => e[k] !== '' && k !== 'week') : null;
      P('  ' + v.padEnd(18) + ' ' + g.padEnd(40) + ' ev ' + (C.inputs() - before) + ' | ia_logs_ writes ' + writes + ' | entry ' + (e ? J(Object.fromEntries(ne.map(k => [k, e[k]]))) : 'none')
        + ' | hist ' + !!hist()['w' + h.w + '_' + h.d] + ' | status ' + st(h.w, h.d));
    } catch(err){ P('  ' + v + ' ' + g + ' ERR ' + err.message); }
  }
}
// ── §2 readers of a first write, across the free-field gesture and the no-number writes ──
P('\n§2 READERS of a log written by each path (restated predicates; nudge and Progress rendered on the host)');
const runHost = HOSTS['run:dist'] || HOSTS['run:time'];
const PATHS = { 'free field (dist form 47:13)':() => LOGG[logKind(Object.keys(HOSTS).find(k => HOSTS[k] === runHost))](), 'RPE only -> 7':() => fire('log_rpe', '7'), 'notes only':() => fire('log_notes', 'ok'),
  'chip tap only (run->bike->run)':() => { C.ev("setCardioSwap('bike')"); C.ev("setCardioSwap('run')"); C.advance(200); }, 'Done on untouched':() => done(runHost.d), 'fixed miles wheel nudged 3.1 -> 3.5':() => { mv('log_run_dist', 1, '5'); } };
for(const [pn, fn] of Object.entries(PATHS)){
  reb(runHost); wipe(); open(runHost.w, runHost.d); fn(); const { w, d } = runHost; const e = C.entry(w, d);
  const status = st(w, d); if(status){ /* reopen check uses pending only */ }
  C.ev('closeDetail()'); C.advance(100); open(w, d); const nudge = C.els.detailBody.innerHTML.includes('You logged this one but never marked it.');
  const rmc = JSON.parse(C.ev('JSON.stringify(restMoveCandidates(' + w + '))')).some(c => c.day === d);
  C.ctx.__dots.length = 0; try { C.ev('renderProgressScreen')(); } catch(err){}
  const ch = {}; C.ctx.__dots.forEach(a => { const t = String(a[0]).replace(/<svg[\s\S]*?<\/svg>/, '').replace(/^\W+/, '').trim().slice(0, 22); const wk = Array.from(a[1]), dat = Array.from(a[2]); ch[t] = dat[wk.indexOf(w)]; });
  P('  ' + pn.padEnd(36) + ' entry ' + !!e + ' | freeze-touched (ia_logs_ key, :16058) ' + !!e + ' | ia_hist_ ' + !!hist()['w' + w + '_' + d] + ' | status ' + status
    + ' | _hasLog ' + RD.hasLog(e) + ' nudge rendered ' + nudge + ' | session(:17520) ' + RD.session(e) + ' | restMove still offers day ' + rmc + ' (:1536 blocks ' + RD.restMoveBlock(e) + ')'
    + ' | weekMiles ' + RD.weekMiles(e) + ' progRun ' + RD.progRun(e) + ' pvl ' + RD.pvl(e) + ' | charts ' + J(ch) + ' | rpe ' + J(e && e.rpe));
}
// ── §3 Done behaviour on the run host ──
P('\n§3b DONE flows on ' + runHost.name + ' W' + runHost.w + ' ' + runHost.d);
{ const { w, d } = runHost; const K = LOGG[logKind(Object.keys(HOSTS).find(k => HOSTS[k] === runHost))];
  reb(runHost); wipe(); open(w, d); K(); const pre = J(strip(C.entry(w, d))); done(d); const post = J(strip(C.entry(w, d)));
  P('  filled then Done: entry byte-equal but ts ' + (pre === post) + ', status ' + st(w, d) + ', overlay open ' + C.els.detailOverlay.classList.contains('open'));
  open(w, d); mv('log_run_mins', 1, '50'); const e3 = C.entry(w, d);
  P('  reopen a Done day, move time to 0:50:13, no tap: stored run_mins ' + J(e3.run_mins) + ' status ' + st(w, d) + ' (edit after Done saves with no tap)');
  const foot = C.els.detailStatusRow.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  done(d); P('  then tap the primary button (reads "' + foot + '"): status ' + st(w, d) + ', run_mins ' + J(C.entry(w, d).run_mins) + ', toast ' + J(TOASTS.slice(-1)));
  open(w, d); mv('log_run_mins', 1, '55'); C.ev('closeDetail()'); C.advance(200);
  P('  pending day, move to 0:55:13, ‹ Back: stored ' + J(C.entry(w, d).run_mins) + ' status ' + st(w, d));
  wipe(); open(w, d); K(); done(d, 'skipped'); P('  filled then Skip: entry kept ' + !!C.entry(w, d) + ' run_mins ' + J(C.entry(w, d).run_mins) + ' status ' + st(w, d));
  // pending settle at Done: flushed?
  wipe(); open(w, d); const wh = W('log_run_mins'); const c = wh._cols[1]; const cur = Math.round(c.scrollTop / 44); let best = -1;
  for(let k = 0; k < c.items.length; k++) if(c.items[k].v === '40' && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
  c.scrollTop = best * 44; C.advance(20); done(d); P('  minutes rolled to 40, Done 20 ms later (inside the 90 ms settle): stored ' + J(C.entry(w, d) && C.entry(w, d).run_mins) + ' status ' + st(w, d));
  // nudge path
  wipe(); open(w, d); K(); C.ev('closeDetail()'); C.advance(100); open(w, d); const hasN = /handleDayStatus\('[a-z]+','[^']*','complete'\)">Mark Done/.test(C.els.detailBody.innerHTML);
  P('  logged, ‹ Back, reopen: nudge with Mark Done ✓ ' + hasN);
}
// ── §6 lifecycle ──
P('\n§6 LIFECYCLE: move then leave');
{ const { w, d } = runHost; const nudgeCol = (hid, ci, v) => { const wh = W(hid), c = wh._cols[ci]; const cur = Math.round(c.scrollTop / 44); let best = -1;
    for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k; c.scrollTop = best * 44; };
  const other = DAYS.find(x => { const y = C.ctx.__P.weeks[w][x]; if(x === d || !y || y.rest || ctOf(y) !== 'run') return false; const k = C.ev('__realDFC')(y.cardio); return !!k && (k.k === 'time' || k.k === 'dist'); });
  reb(runHost); wipe(); open(w, d); nudgeCol('log_run_mins', 1, '33'); C.advance(10); C.ev('closeDetail()'); C.advance(500);
  P('  L1 roll minutes to 33, ‹ Back 10 ms later (no flush on close): stored after the timer ' + J(C.entry(w, d) && C.entry(w, d).run_mins) + ', overlay open ' + C.els.detailOverlay.classList.contains('open'));
  wipe(); open(w, d); nudgeCol('log_run_mins', 1, '33'); C.advance(10); C.ev('closeDetail()'); C.ev('currentWeek=' + w + ';'); C.els.detailOverlay.classList.remove('open'); C.ev("openDayKey('" + other + "')"); C.advance(500);
  P('  L2 roll minutes to 33 on ' + d + ', ‹ Back and open ' + other + ' within 10 ms: ' + d + ' entry ' + J(C.entry(w, d) && strip(C.entry(w, d))) + ' | ' + other + ' entry ' + J(C.entry(w, other) && strip(C.entry(w, other))));
  wipe(); open(w, d); nudgeCol('log_run_mins', 1, '33'); C.advance(10); const oldW = C.wheels().slice(); C.ev('closeDetail()'); C.ev('currentWeek=' + w + ';'); C.els.detailOverlay.classList.remove('open'); C.ev("openDayKey('" + other + "')");
  oldW.forEach(wh => wh._cols.forEach(c => Object.defineProperty(c, 'scrollTop', { get(){ return 0; }, set(){}, configurable:true }))); C.advance(500);
  P('  L2d same, with the replaced nodes detached (scrollTop reads 0, WebKit has no box for them): ' + d + ' ' + J(C.entry(w, d) && strip(C.entry(w, d))) + ' | ' + other + ' ' + J(C.entry(w, other) && strip(C.entry(w, other))));
  wipe(); open(w, d); mv('log_run_mins', 1, '33'); const tabs = ['screenProgress', 'screenWeek'].filter(s => C.els[s]);
  try { C.ev("showScreen('screenProgress')"); } catch(e){}
  C.advance(200); P('  L3 settled, then showScreen(Progress): stored ' + J(C.entry(w, d).run_mins) + ', detail overlay still open ' + C.els.detailOverlay.classList.contains('open'));
  const src = fs.readFileSync(CAND, 'utf8');
  P('  L4 static: pagehide ' + (src.match(/pagehide/g) || []).length + ', beforeunload ' + (src.match(/beforeunload/g) || []).length + ', visibilitychange ' + (src.match(/visibilitychange/g) || []).length
    + ' (listener body: ' + (src.match(/addEventListener\('visibilitychange'[^\n]*/) || [''])[0].slice(0, 110) + '), focusout/blur on log ids ' + (src.match(/log_[a-z_]+'[^\n]{0,80}(blur|focusout|change)'/g) || []).length
    + ', location.reload ' + (src.match(/location\.reload/g) || []).length + ', listener events on the cardio ids: ' + J([...new Set((src.match(/forEach\(function\(id\)\{\s*(?:var|const) el=document\.getElementById\(id\);\s*if\(el\) el\.addEventListener\('(\w+)'/g) || []).map(s => s.match(/addEventListener\('(\w+)'/)[1]))]));
}
// ── §1d swapped-in via the chip, and a moved-in day ──
P('\n§1d CHIP-SWAPPED FORMS (every lattice host, all three sports) and a MOVED-IN day');
{ const SW = {}; let n = 0;
  for(const [v, h] of Object.entries(HOSTS)){ const planned = /swim/.test(v) ? 'swim' : /bike/.test(v) ? 'bike' : 'run';
    for(const to of ['run', 'bike', 'swim'].filter(s => s !== planned)){ reb(h); wipe(); open(h.w, h.d); C.ev("setCardioSwap('" + to + "')"); C.advance(200); n++;
      const e = C.entry(h.w, h.d); const ids = ['log_run_dist', 'log_run_pace', 'log_run_mins', 'log_bike_mins', 'log_swim_yards'].filter(inMarkup);
      bump(SW, v + ' -> ' + to + ' | fields ' + ids.join(',') + ' | entry after tap ' + J(e && Object.fromEntries(Object.entries(strip(e)).filter(([k, x]) => x !== '' && k !== 'week'))) + ' | hist ' + !!hist()['w' + h.w + '_' + h.d]);
      scan(h.w, h.d).forEach(r => bump(SW, '   hazard ' + to + ' form | ' + r.fld + ' | ' + r.cls)); } }
  Object.keys(SW).sort().forEach(k => P('  ' + k + ' : ' + SW[k])); P('  (' + n + ' chip taps)');
  const p = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); C.use(p); wipe();
  const moves = { w1_wed:{ from:'sat', ts:1 } }; C.LS.setItem('ia_moves_measure', J(moves)); C.ev('applyRestDayMoves(activeProg,' + J(moves) + ')');
  open(1, 'wed'); const fl = ['log_run_dist', 'log_run_mins', 'log_run_pace'].filter(inMarkup); mv('log_run_mins', 1, '47');
  P('  moved-in W1 sat -> wed: fields ' + fl.join(',') + ' | after minutes 47: w1_wed ' + J(C.entry(1, 'wed') && { run_mins:C.entry(1, 'wed').run_mins, run_dist:C.entry(1, 'wed').run_dist }) + ' w1_sat ' + J(C.entry(1, 'sat')) + ' hist w1_wed ' + !!hist().w1_wed);
}
// ── §5 precedents ──
P('\n§5a PRECEDENT rest sheet Log cardio');
{ const cfg = mkCfg([['run', 'run_10k'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', 76308); const p = C.IA.buildProgram(cfg); C.use(p); wipe();
  C.advance(2 * 86400000 + 3600000); // Wednesday of W1, 11:00: the rest day is today
  TOASTS.length = 0; C.ev("openRestSheet(1,'wed','cardio')"); const b = C.els.restBody.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  P('  sheet open ' + C.els.restOverlay.classList.contains('open') + ' toasts ' + J(TOASTS) + ' | body: ' + b.slice(0, 420));
  C.ev("_restDraft.mins=0"); C.ev('applyRestCardio()'); P('  Log it with 0 min: toast ' + J(TOASTS.slice(-1)) + ' entry ' + J(C.entry(1, 'wed')));
  C.ev("_restDraft.type='run'; _restDraft.mins=30; _restDraft.dist='3'"); C.ev('applyRestCardio()');
  P('  Log it run 30 min 3 mi: toast ' + J(TOASTS.slice(-1)) + ' sheet open ' + C.els.restOverlay.classList.contains('open') + ' entry ' + J(strip(C.entry(1, 'wed'))) + ' hist ' + !!hist().w1_wed + ' status ' + st(1, 'wed'));
  C.ev("openRestSheet(1,'wed','cardio')"); C.ev("_restDraft.type='run'; _restDraft.mins=30; _restDraft.dist='3'"); C.ev('applyRestCardio()');
  P('  Log it again, same numbers: run_dist ' + J(C.entry(1, 'wed').run_dist) + ' rest_mins ' + J(C.entry(1, 'wed').rest_mins) + ' (additive; hand 3+3=6)');
  C.ev("_restDraft.type='swim'; _restDraft.mins=20; _restDraft.dist='800'"); C.ev('applyRestCardio()'); P('  Log swim 20 min 800 yd: swim_yards ' + J(C.entry(1, 'wed').swim_yards) + ' rest_type ' + J(C.entry(1, 'wed').rest_type));
  try { C.ev('renderWeekView()'); } catch(e){}
  const all = Object.values(C.els).map(e => e.innerHTML || '').join(' '); P('  week view hero button reads: ' + J((all.match(/'cardio'\)">([^<]+)</) || [])[1] || null));
}
P('\n§5b PRECEDENT per-exercise lift Log');
{ const p = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); C.use(p); wipe(); C.advance(0);
  const dl = DAYS.find(x => p.weeks[1][x] && !p.weeks[1][x].rest && (p.weeks[1][x].sections || []).length);
  open(1, dl); const m = C.els.detailBody.innerHTML.match(/onclick="saveExWeight\('([^']+)','([^']*)','([^']*)'\)">Log</);
  if(!m) P('  no Log button found on W1 ' + dl); else {
    const exKey = m[1]; const ex0 = C.LS.getItem('ia_exw_measure');
    const w0 = C.els['exw_' + exKey]; P('  host W1 ' + dl + ' ' + m[2] + ' | before: ia_exw_ ' + (ex0 ? 'present' : 'none') + ', card class ' + J(C.els['excard_' + exKey] && C.els['excard_' + exKey].className) + ', load box ' + J(w0 && w0.value) + ' ph ' + J(w0 && w0.placeholder));
    const setId = Object.keys(C.els).find(k => k.startsWith('exset_' + exKey + '_') && !/_d$/.test(k));
    if(setId){ C.ev("stepSet('" + setId + "',1)"); }
    const dr = C.entry(1, dl); P('  a set stepper tap before Log: ia_logs_ draft ' + J(dr && dr.sets ? Object.keys(dr.sets) : null) + ', ia_exw_ ' + (C.LS.getItem('ia_exw_measure') ? 'present' : 'none') + ', hist ' + !!hist()['w1_' + dl]);
    TOASTS.length = 0; C.ev("saveExWeight('" + exKey + "','" + m[2] + "','" + m[3] + "')");
    const st2 = JSON.parse(C.LS.getItem('ia_exw_measure') || '{}'); const ent = st2[exKey] && st2[exKey].entries;
    P('  tap Log: toast ' + J(TOASTS) + ', card class ' + J(C.els['excard_' + exKey] && C.els['excard_' + exKey].className) + ', badge ' + J(C.els['exbadge_' + exKey] && C.els['exbadge_' + exKey].textContent)
      + ', ia_exw_ entries ' + (ent ? ent.length : 0) + ' ' + J(ent && ent[0] && { week:ent[0].week, day:ent[0].day, weight:ent[0].weight, setsDone:ent[0].setsDone }) + ', draft cleared ' + !(C.entry(1, dl) && C.entry(1, dl).sets && C.entry(1, dl).sets[exKey]) + ', hist ' + !!hist()['w1_' + dl] + ', status ' + st(1, dl));
    C.ev("saveExWeight('" + exKey + "','" + m[2] + "','" + m[3] + "')"); const ent2 = JSON.parse(C.LS.getItem('ia_exw_measure'))[exKey].entries;
    P('  tap Log again: entries ' + ent2.length + ' (one per exercise per day, overwrite)');
    open(1, dl); P('  reopen: counter ' + J(C.els.detailCounter && C.els.detailCounter.textContent) + ', card logged ' + new RegExp('<[^>]*class="[^"]*\\blogged\\b[^"]*"[^>]*id="excard_' + exKey + '"|<[^>]*id="excard_' + exKey + '"[^>]*class="[^"]*\\blogged\\b').test(C.els.detailBody.innerHTML));
  }
}
P('\nruntime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | errors ' + ERR.length);
