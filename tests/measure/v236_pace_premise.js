// v236_pace_premise.js — MEASURE m2 (V236, standing ruling 7): the D218-log row's run_pace conjunct.
//   node tests/measure/v236_pace_premise.js <candidate.html> <base_v235.html> [--quick]
// Q1: run_pace stored per run form shape x case (a) minutes only, (b) miles only, (c) both [+ pace only / rep time only
//     where the shape has that field], candidate (stored at the Log tap; checked null before it) vs V235 (stored at settle);
//     and after Done on both. Oracle: hand arithmetic pace = minutes*60/miles, where miles is the logged miles, else the
//     plan's miles if the session has them; minutes is the logged minutes, else the plan's minutes. "No plan miles and no
//     logged miles" = no pace derivable by hand. Plan figures read from the session's dose (doseFromCardio, the plan, not
//     the suspect writer).
// Q2: HALF_MANNY W1 day shapes for every D218/D219 fixture day.
// Q3: every reader of `sessions` (comment-stripped) in both trees.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const ARGS = process.argv.slice(2).filter(a => !/^--/.test(a));
const CAND = path.resolve(ARGS[0] || path.join(ROOT, 'index.html')), BASE = path.resolve(ARGS[1]);
const QUICK = process.argv.includes('--quick');
const load = H.load, RealDate = Date;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], J = JSON.stringify, P = s => console.log(s);
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v235_clear_reopen.js'), 'utf8');
  const a = src.indexOf('function mkEnv(file){'), b = src.indexOf('\n  return E;\n}', a);
  if(a < 0 || b < 0) throw new Error('mkEnv not found'); eval('global.mkEnv = ' + src.slice(a, b + '\n  return E;\n}'.length)); }
const STR_IDS = ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe', 'log_swim_yards', 'log_notes'];
function env(file){ // m1's stub additions, verbatim in effect
  const C = mkEnv(file); C.VER = +C.IA.version; C.TOASTS = [];
  C.ev('var __rs=showToast; showToast=function(m){ globalThis.__toast(m); };'); C.ctx.__toast = m => C.TOASTS.push(String(m));
  const doc = C.ctx.document, qsa0 = doc.querySelectorAll, gid0 = doc.getElementById;
  const effHtml = () => { let b = (C.els.detailBody && C.els.detailBody._html) || ''; const cf = C.els.cardioFields && C.els.cardioFields._html;
    if(cf){ const a = b.indexOf('<div id="cardioFields">'), z = b.indexOf('<button type="button" id="cardioSwapLink"'); if(a >= 0 && z > a) b = b.slice(0, a) + '<div id="cardioFields">' + cf + '</div>' + b.slice(z); } return b; };
  const inMarkup = id => effHtml().includes('id="' + id + '"'); C.inMarkup = inMarkup;
  doc.getElementById = id => (/^(log_|exset_|exsetw_|exw_|excard_|exbadge_|doseRepVal|doseDerived|cardioSwapWrap|cardioPicker|cardioSwapNote|cardioLogBtn)/.test(id) && !inMarkup(id)) ? null : gid0(id);
  doc.querySelectorAll = sel => { const m = /^input\[id\^="([^"]+)"\]$/.exec(sel); if(m) return Object.values(C.els).filter(e => e.id.startsWith(m[1]) && !/_d$/.test(e.id)); return qsa0(sel); };
  const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
    Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
  C.op = (w, d) => { if(C.els.cardioFields) C.els.cardioFields._html = ''; C.open(w, d); STR_IDS.forEach(strv); };
  C.wipe = () => { [...C.LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => C.LS.removeItem(k)); };
  return C; }
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const mv = (C, hid, ci, v) => { const w = C.wheel(hid); if(!w) throw new Error('no wheel ' + hid); if(colv(w, ci) !== v) C.move(w, ci, v); };
const G = { // gestures: 47:13, 3.10 mi, pace 9:30, rep time 1:55
  mins: C => { mv(C, 'log_run_mins', 0, '0'); mv(C, 'log_run_mins', 1, '47'); mv(C, 'log_run_mins', 2, '13'); },
  miles: C => { mv(C, 'log_run_dist', 0, '3'); mv(C, 'log_run_dist', 1, '1'); mv(C, 'log_run_dist', 2, '0'); },
  pace: C => { mv(C, 'log_run_pace', 0, '9'); mv(C, 'log_run_pace', 1, '30'); },
  rept: C => { mv(C, 'log_run_rep_time', 0, '1'); mv(C, 'log_run_rep_time', 1, '55'); } };
const CASES = { 'a mins only':['mins'], 'b miles only':['miles'], 'c mins+miles':['mins', 'miles'], 'p pace only':['pace'], 'pm miles+pace':['miles', 'pace'], 'r rep time only':['rept'] };
const NEED = { mins:'log_run_mins', miles:'log_run_dist', pace:'log_run_pace', rept:'log_run_rep_time' };
const MINS = 47 + 13 / 60, MI = 3.1;
const secOf = s => { const m = /^(\d+):(\d\d)/.exec(String(s || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; };
function handPace(dose, gs){ // independent oracle
  if(gs.includes('pace')) return 570;               // the typed pace is the pace
  if(gs.includes('rept')) return dose && dose.m ? 115 / (dose.m / 1609.34) : null;
  const mins = gs.includes('mins') ? MINS : (dose && dose.mins && dose.k === 'time' ? dose.mins : null);
  const mi = gs.includes('miles') ? MI : (dose && dose.mi ? dose.mi : null);
  if(dose && dose.k === 'reps_time' && gs.includes('miles')) return (dose.reps * dose.mins) * 60 / MI;
  return (mins && mi) ? mins * 60 / mi : null; }
// lattice = m1's
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
for(const sd of SEEDS) PROGS.push(['multi|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', sd)]);
for(const reg of ['shoulder', 'knee', 'ankle', 'hip', 'lowback']) for(const sports of [[['run', 'run_10k'], ['bike', 'bike_base']], [['run', 'run_10k'], ['swim', 'swim_base']], [['swim', 'swim_base'], ['bike', 'bike_base']]])
  PROGS.push(['injury ' + reg + ' ' + sports.map(s => s[0]).join('+'), mkCfg(sports, 'balanced', 'intermediate', 76308, { region:reg, tier:'protect' })]);
const ctOf = x => (x && x.cardio && !Array.isArray(x.cardio) && x.cardio.type || '').toLowerCase();
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const t0 = Date.now();
const CE = env(CAND), BE = env(BASE);
P('candidate ' + CAND + ' ia-version ' + CE.VER + ' | base ' + BASE + ' ia-version ' + BE.VER);
const T = {}, ERR = [], EX = {}; const bump = (k, n) => { T[k] = (T[k] || 0) + (n || 1); };
let nP = 0, nDays = 0, nCommits = 0;
const shapeOf = (C, x) => { const dose = C.ev('__realDFC')(x.cardio); return { dose, shape:(/Cross-Train/.test(x.cardio.subtype || '') ? 'xtrain ' : '') + (dose ? dose.k : 'generic') }; };
for(const [name, cfg] of PROGS){
  let p; try { p = CE.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  const pb = BE.IA.buildProgram(cfg);
  if(J(p.weeks) !== J(pb.weeks)) ERR.push(name + ' grids differ cand vs base');
  nP++; CE.use(p); CE.unforce(); BE.use(pb); BE.unforce();
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; if(!x || x.rest || ctOf(x) !== 'run') continue;
    const { dose, shape } = shapeOf(CE, x); nDays++; bump(shape + ' | DAYS');
    for(const [cn, gs] of Object.entries(CASES)){
      try {
        CE.wipe(); CE.op(w, d); if(gs.some(g => !CE.inMarkup(NEED[g]))){ bump(shape + ' | ' + cn + ' | n/a (field absent)'); continue; }
        BE.wipe(); BE.op(w, d);
        gs.forEach(g => { G[g](CE); G[g](BE); });
        const cPre = CE.entry(w, d), bSettle = BE.entry(w, d);
        CE.TOASTS.length = 0; CE.ev('logCardio()'); CE.advance(500);
        const cLog = CE.entry(w, d);
        CE.ev("handleDayStatus('" + d + "','x','complete')"); CE.advance(500); BE.ev("handleDayStatus('" + d + "','x','complete')"); BE.advance(500);
        const cDone = CE.entry(w, d), bDone = BE.entry(w, d);
        nCommits++;
        const k = shape + ' | ' + cn;
        const rp = e => e ? (e.run_pace || '') : null;
        bump(k + ' | n');
        if(cPre) bump(k + ' | CAND entry before Log (draft leaked)');
        if(rp(cLog)) bump(k + ' | CAND run_pace non-empty at Log');
        if(rp(bSettle)) bump(k + ' | V235 run_pace non-empty at settle');
        if(rp(cDone)) bump(k + ' | CAND run_pace non-empty after Done');
        if(rp(bDone)) bump(k + ' | V235 run_pace non-empty after Done');
        if(rp(cLog) !== rp(bSettle)) bump(k + ' | DELTA run_pace CAND@Log != V235@settle');
        if(rp(cDone) !== rp(bDone)) bump(k + ' | DELTA run_pace CAND@Done != V235@Done');
        const strip = e => e ? J(Object.fromEntries(Object.entries(e).filter(([q]) => !['ts', 'rpe'].includes(q)).sort())) : 'null';
        if(strip(cLog) !== strip(bSettle)) bump(k + ' | DELTA entry (ts,rpe stripped) CAND@Log != V235@settle');
        const hp = handPace(dose, gs), sp = secOf(rp(cLog));
        if(hp == null){ bump(k + ' | hand: no pace derivable'); if(sp != null) bump(k + ' | hand none but stored ' ); }
        else { bump(k + ' | hand: pace derivable'); if(sp == null) bump(k + ' | hand pace but stored empty'); else if(Math.abs(sp - hp) <= 1) bump(k + ' | stored == hand (±1 s)'); else bump(k + ' | stored != hand'); }
        if(!EX[k]) EX[k] = name + ' W' + w + ' ' + d + ' "' + x.cardio.subtype + '" dose ' + J(dose && { k:dose.k, mins:dose.mins, mi:dose.mi, reps:dose.reps, m:dose.m }) + ' | CAND@Log ' + J(cLog && { run_mins:cLog.run_mins, run_dist:cLog.run_dist, run_pace:cLog.run_pace }) + ' | V235@settle ' + J(bSettle && { run_mins:bSettle.run_mins, run_dist:bSettle.run_dist, run_pace:bSettle.run_pace }) + ' | hand ' + (hp == null ? 'none' : (Math.floor(hp / 60) + ':' + String(Math.round(hp % 60)).padStart(2, '0')));
      } catch(err){ ERR.push(name + ' W' + w + ' ' + d + ' ' + shape + ' ' + cn + ': ' + String(err.message).slice(0, 140)); }
    }
  }
}
P('§0 LATTICE ' + nP + '/' + PROGS.length + ' programs, ' + nDays + ' run days, ' + nCommits + ' commits per tree; errors ' + ERR.length + '; ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 10).forEach(e => P('  ERR ' + e));
P('\n§1 PER SHAPE x CASE (counts; denominator = the "| n" line)'); Object.keys(T).sort().forEach(k => P('  ' + k + ' : ' + T[k]));
P('\n§1x FIRST EXAMPLE per shape x case'); Object.keys(EX).sort().forEach(k => P('  ' + k + ' : ' + EX[k]));
const dT = Object.entries(T).filter(([k]) => /DELTA run_pace/.test(k)).reduce((a, [, n]) => a + n, 0);
P('\n§1t TOTAL run_pace deltas CAND vs V235 (both moments): ' + dT + ' over ' + nCommits + ' commits');
// ── §2 HALF_MANNY W1 shapes, the ruling's fixture days ──
P('\n§2 HALF_MANNY W1 day shapes (cand) — cardioTypes ' + J(H.fixtures.HALF_MANNY.cardioTypes));
{ const p = CE.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); CE.use(p); CE.unforce();
  for(const d of DAYS){ const x = p.weeks[1][d]; const ct = ctOf(x);
    if(!x || x.rest || !ct){ P('  W1 ' + d + ' : ' + (x && x.rest ? 'rest' : 'no cardio (lift ' + !!(x && (x.lift || x.exercises || x.blocks)) + ')')); 
      if(x && !x.rest){ CE.wipe(); CE.op(1, d); P('     #cardioLogBtn in markup ' + CE.inMarkup('cardioLogBtn') + ', log_rpe ' + CE.inMarkup('log_rpe')); } continue; }
    const s = shapeOf(CE, x); CE.wipe(); CE.op(1, d);
    P('  W1 ' + d + ' : ' + ct + ' "' + x.cardio.subtype + '" shape ' + s.shape + ' dose ' + J(s.dose && { k:s.dose.k, mins:s.dose.mins, mi:s.dose.mi, reps:s.dose.reps, m:s.dose.m, tgt:s.dose.tgt })
      + ' | fields ' + STR_IDS.filter(i => CE.inMarkup(i)).join(',') + ' | wheels ' + CE.wheels().map(q => q.kind + ':' + q.hid + (q.plan != null ? '(plan ' + q.plan + ')' : '')).join(','));
  }
  // count weeks of HALF_MANNY per shape
  const by = {}; for(const w of weeksOf(p)) for(const d of DAYS){ const x = p.weeks[w][d]; if(x && !x.rest && ctOf(x) === 'run'){ const s = shapeOf(CE, x).shape; by[s] = (by[s] || 0) + 1; } }
  P('  HALF_MANNY all weeks run days by shape: ' + J(by));
}
// ── §3 sessions readers ──
function stripComments(src){ let o = '', i = 0, n = src.length, st = null;
  while(i < n){ const c = src[i], c2 = src[i + 1];
    if(st){ o += c; if(c === '\\'){ o += c2 || ''; i += 2; continue; } if(c === st) st = null; i++; continue; }
    if(c === '/' && c2 === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && c2 === '*'){ const e = src.indexOf('*/', i + 2); const blk = src.slice(i, e < 0 ? n : e + 2); o += blk.replace(/[^\n]/g, ''); i = e < 0 ? n : e + 2; continue; }
    if(c === '"' || c === "'" || c === '`'){ st = c; o += c; i++; continue; }
    o += c; i++; }
  return o; }
for(const [lab, f] of [['CAND', CAND], ['V235', BASE]]){
  const html = fs.readFileSync(f, 'utf8'); const a = html.indexOf('<script>'), b = html.lastIndexOf('</script>');
  const pre = html.slice(0, a).split('\n').length - 1; const lines = stripComments(html.slice(a, b)).split('\n');
  const hits = [], wd = [];
  lines.forEach((l, i) => { if(/\bsessions\b/.test(l)) hits.push((i + pre + 1) + ': ' + l.trim().slice(0, 150)); if(/weeklyData/.test(l)) wd.push(i + pre + 1); });
  P('\n§3 ' + lab + ' comment-stripped lines with token `sessions`: ' + hits.length); hits.forEach(h => P('    ' + h));
  P('   weeklyData lines: ' + wd.join(','));
  const rpeR = []; lines.forEach((l, i) => { if(/\.rpe\b|\['rpe'\]/.test(l)) rpeR.push((i + pre + 1) + ': ' + l.trim().slice(0, 150)); });
  P('   ' + lab + ' lines reading .rpe: ' + rpeR.length); rpeR.forEach(h => P('    ' + h));
}
P('\nDONE ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
