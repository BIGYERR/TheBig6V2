// v236_rpe_readers.js — MEASURE m3 (V236, standing ruling 7): D218/D219 Amendment 1, items 2 and 3 premises.
//   node tests/measure/v236_rpe_readers.js <candidate.html> <base_v235.html> [--quick]
// Q2 (rest-move): per cardio day x single-field gesture the form has: candidate = gesture, Log tap (logCardio), no slider,
//   no note, no Done; V235 = the same gesture, its settle write. Read restMoveCandidates(w) on each tree: is the day offered?
//   Oracle: the athlete's own act. A day the athlete committed with a number is "logged"; the instrument is the observable
//   offer list plus the rendered rest-sheet line (_renderRestMove), not the predicate under test.
// Q3 (journal swap): HALF_MANNY W1 SAT chip Bike, nothing else, renderProgressScreen on both trees, journal W1 text printed.
//   Lattice: every cardio day x every other-sport chip, fresh store, one render per swap; journal read off progressBody.
// Q4: every comment-stripped line reading the token `rpe`, with its enclosing function, both trees.
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
function env(file){ // m1/m2 stub additions
  const C = mkEnv(file); C.VER = +C.IA.version; C.TOASTS = [];
  C.ev('var __rs=showToast; showToast=function(m){ globalThis.__toast(m); };'); C.ctx.__toast = m => C.TOASTS.push(String(m));
  const doc = C.ctx.document, qsa0 = doc.querySelectorAll, gid0 = doc.getElementById;
  const effHtml = () => { let b = (C.els.detailBody && C.els.detailBody._html) || ''; const cf = C.els.cardioFields && C.els.cardioFields._html;
    if(cf){ const a = b.indexOf('<div id="cardioFields">'), z = b.indexOf('<button type="button" id="cardioSwapLink"'); if(a >= 0 && z > a) b = b.slice(0, a) + '<div id="cardioFields">' + cf + '</div>' + b.slice(z); } return b; };
  const inMarkup = id => effHtml().includes('id="' + id + '"'); C.inMarkup = inMarkup; C.effHtml = effHtml;
  doc.getElementById = id => (/^(log_|exset_|exsetw_|exw_|excard_|exbadge_|doseRepVal|doseDerived|cardioSwapWrap|cardioPicker|cardioSwapNote|cardioLogBtn)/.test(id) && !inMarkup(id)) ? null : gid0(id);
  doc.querySelectorAll = sel => { const m = /^input\[id\^="([^"]+)"\]$/.exec(sel); if(m) return Object.values(C.els).filter(e => e.id.startsWith(m[1]) && !/_d$/.test(e.id)); return qsa0(sel); };
  const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
    Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
  C.op = (w, d) => { if(C.els.cardioFields) C.els.cardioFields._html = ''; C.open(w, d); STR_IDS.forEach(strv); };
  C.wipe = () => { [...C.LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => C.LS.removeItem(k)); };
  C.offered = w => C.ev('restMoveCandidates(' + w + ')').map(c => c.day);
  C.journal = () => { C.ev('renderProgressScreen()'); const h = String(C.els.progressBody.innerHTML || C.els.progressBody._html || '');
    const i = h.indexOf('Session Journal'); if(i < 0) return { found:false, text:'' };
    return { found:true, html:h.slice(i), text:h.slice(i).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }; };
  return C; }
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const mv = (C, hid, ci, v) => { const w = C.wheel(hid); if(!w) throw new Error('no wheel ' + hid); if(colv(w, ci) !== v) C.move(w, ci, v); };
const fire = (C, id, v) => { const el = C.els[id]; el.value = v; el.dispatchEvent(new C.ctx.Event('input')); C.advance(50); };
// single-field gestures; NEED = the node the form must carry
const G = {
  'mins 47:13': [ 'log_run_mins', C => { mv(C, 'log_run_mins', 0, '0'); mv(C, 'log_run_mins', 1, '47'); mv(C, 'log_run_mins', 2, '13'); } ],
  'miles 3.10': [ 'log_run_dist', C => { mv(C, 'log_run_dist', 0, '3'); mv(C, 'log_run_dist', 1, '1'); mv(C, 'log_run_dist', 2, '0'); } ],
  'pace 9:30': [ 'log_run_pace', C => { mv(C, 'log_run_pace', 0, '9'); mv(C, 'log_run_pace', 1, '30'); } ],
  'rep time 1:55': [ 'log_run_rep_time', C => { mv(C, 'log_run_rep_time', 0, '1'); mv(C, 'log_run_rep_time', 1, '55'); } ],
  'reps +1 (stepper)': [ 'log_run_reps', C => { C.ev('doseRep(1)'); C.advance(50); } ],
  'bike 47:13': [ 'log_bike_mins', C => { mv(C, 'log_bike_mins', 1, '47'); mv(C, 'log_bike_mins', 2, '13'); } ],
  'swim 1500 yd': [ 'log_swim_yards', C => { ['1', '15', '150', '1500'].forEach(v => fire(C, 'log_swim_yards', v)); } ] };
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
const shapeOf = (C, x) => { const ct = ctOf(x); const dose = C.ev('__realDFC')(x.cardio); const xt = /Cross-Train/.test(x.cardio.subtype || '') ? 'xtrain ' : '';
  return xt + (ct === 'run' ? (dose ? dose.k : 'generic') : ct); };
const T2 = {}, T3 = {}, ERR = [], EX2 = {}, EX3 = {}; const bump = (T, k) => { T[k] = (T[k] || 0) + 1; };
let nP = 0, nDays = 0, nC2 = 0, nC3 = 0, exposedSample = null;
const SKIP3 = QUICK ? 1 : 1;
for(const [name, cfg] of PROGS){
  let p; try { p = CE.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' build ' + e.message); continue; }
  const pb = BE.IA.buildProgram(cfg); if(J(p.weeks) !== J(pb.weeks)) ERR.push(name + ' grids differ');
  nP++; CE.use(p); CE.unforce(); BE.use(pb); BE.unforce();
  for(const w of weeksOf(p)) for(const d of DAYS){
    const x = p.weeks[w][d]; const ct = ctOf(x); if(!x || x.rest || !['run', 'bike', 'swim'].includes(ct)) continue;
    const shape = shapeOf(CE, x); nDays++; bump(T2, shape + ' | DAYS');
    // ── Q2 ──
    for(const [gn, [need, fn]] of Object.entries(G)){
      try {
        CE.wipe(); CE.op(w, d); if(!CE.inMarkup(need)) continue;
        BE.wipe(); BE.op(w, d);
        const k = shape + ' | ' + gn; nC2++; bump(T2, k + ' | n');
        if(!CE.offered(w).includes(d)) bump(T2, k + ' | (control) CAND fresh day NOT offered');
        fn(CE); fn(BE);
        if(CE.offered(w).includes(d)) bump(T2, k + ' | CAND offered after gesture, before Log (draft)');
        CE.TOASTS.length = 0; CE.ev('logCardio()'); CE.advance(500);
        const ce = CE.entry(w, d), be = BE.entry(w, d);
        const committed = !!ce && !CE.TOASTS.some(t => /Nothing to log/.test(t));
        if(!committed){ bump(T2, k + ' | CAND Log refused / no entry'); continue; }
        bump(T2, k + ' | CAND committed');
        const btn = String((CE.els.cardioLogBtn && CE.els.cardioLogBtn.textContent) || '');
        const cOff = CE.offered(w).includes(d), bOff = BE.offered(w).includes(d);
        if(cOff) bump(T2, k + ' | CAND OFFERED after Log');
        if(cOff && /Logged/.test(btn)) bump(T2, k + ' | CAND OFFERED while button reads Logged');
        if(!be) bump(T2, k + ' | V235 no entry after settle');
        if(bOff) bump(T2, k + ' | V235 OFFERED after settle');
        if(be && be.rpe === '5') bump(T2, k + ' | V235 rpe "5" stamped');
        if(ce.rpe) bump(T2, k + ' | CAND rpe non-empty');
        const keys = e => Object.keys(e).filter(q => !['ts', 'week', 'rpe'].includes(q) && e[q] !== '' && e[q] != null).sort().join(',');
        bump(T2, k + ' | CAND keys {' + keys(ce) + '}');
        if(cOff && !EX2[k]) EX2[k] = name + ' W' + w + ' ' + d + ' "' + x.cardio.subtype + '" CAND entry ' + J(Object.fromEntries(Object.entries(ce).filter(([q]) => q !== 'ts'))) + ' btn "' + btn + '" | V235 entry rpe ' + J(be && be.rpe) + ' offered ' + bOff;
        if(cOff && !exposedSample){ const html = CE.ev("_renderRestMove(" + w + ",'wed','Wednesday')");
          const lab = CE.ev('DAY_FULL')[d]; const m = html.match(new RegExp('<div class="ov-eq-name">([^<]*)</div><div class="ov-eq-desc"[^>]*>(' + lab + '[^<]*)</div>'));
          exposedSample = name + ' W' + w + ' ' + d + ' [' + gn + '] rest-sheet row: ' + (m ? '"' + m[1] + '" / "' + m[2] + '"' : 'NOT FOUND in render') + ' | card button "' + btn + '" data-logged ' + J(CE.els.cardioSwapWrap && CE.els.cardioSwapWrap.dataset.logged); }
      } catch(err){ ERR.push('Q2 ' + name + ' W' + w + ' ' + d + ' ' + gn + ': ' + String(err.message).slice(0, 140)); }
    }
    // ── Q3 ──
    for(const bg of [false, true]) for(const to of ['run', 'bike', 'swim'].filter(s => s !== ct)){
      try {
        const od = DAYS.find(q => q !== d), BG = { rpe:'7', notes:'', week:w, ts:1 };
        CE.wipe(); BE.wipe(); if(bg){ CE.setLog(w, od, BG); BE.setLog(w, od, BG); } CE.op(w, d); BE.op(w, d);
        if(!CE.inMarkup('cardioSwapWrap')){ bump(T3, shape + ' | no chip wrap'); continue; }
        if(!CE.effHtml().includes("setCardioSwap('" + to + "')")){ bump(T3, shape + ' -> ' + to + ' | chip absent'); continue; }
        CE.ev("setCardioSwap('" + to + "')"); CE.advance(200); BE.ev("setCardioSwap('" + to + "')"); BE.advance(200);
        const k = (bg ? '[bg: other day same week rpe 7] ' : '[swap only] ') + shape + ' -> ' + to; nC3++; bump(T3, k + ' | n');
        const ce = CE.entry(w, d), be = BE.entry(w, d);
        if(ce && ce.swapFrom && ce.swapTo) bump(T3, k + ' | CAND entry carries swapFrom/swapTo');
        if(ce && !ce.rpe && !ce.notes) bump(T3, k + ' | CAND entry rpe and notes empty');
        if(be && be.rpe === '5') bump(T3, k + ' | V235 entry rpe "5"');
        const cj = CE.journal(), bj = BE.journal();
        const cRow = cj.found && /Swapped/.test(cj.text), bRow = bj.found && /Swapped/.test(bj.text);
        if(cRow) bump(T3, k + ' | CAND journal shows swap row'); else bump(T3, k + ' | CAND journal NO swap row' + (cj.found ? '' : ' (no journal section)'));
        if(bRow) bump(T3, k + ' | V235 journal shows swap row'); else bump(T3, k + ' | V235 journal NO swap row');
        if(bRow && /RPE 5/.test(bj.text)) bump(T3, k + ' | V235 journal shows RPE 5');
        if(!cRow) bump(T3, k + ' | CAND progress body reads No data yet: ' + /No data yet/.test(String(CE.els.progressBody.innerHTML)));
        if(!EX3[k]) EX3[k] = name + ' W' + w + ' ' + d + ' | CAND entry ' + J(ce && { rpe:ce.rpe, notes:ce.notes, swapFrom:ce.swapFrom, swapTo:ce.swapTo }) + ' journal ' + J(cj.text.slice(0, 160)) + ' | V235 journal ' + J(bj.text.slice(0, 160));
      } catch(err){ ERR.push('Q3 ' + name + ' W' + w + ' ' + d + ' ->' + to + ': ' + String(err.message).slice(0, 140)); }
    }
  }
}
P('§0 LATTICE ' + nP + '/' + PROGS.length + ' programs, ' + nDays + ' cardio days; Q2 ' + nC2 + ' gesture cases; Q3 ' + nC3 + ' swaps; errors ' + ERR.length + '; ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
ERR.slice(0, 12).forEach(e => P('  ERR ' + e));
P('\n§2 REST-MOVE per shape x gesture'); Object.keys(T2).sort().forEach(k => P('  ' + k + ' : ' + T2[k]));
P('\n§2x first exposed example per shape x gesture'); Object.keys(EX2).sort().forEach(k => P('  ' + k + ' : ' + EX2[k]));
P('\n§2r rendered rest sheet: ' + (exposedSample || 'no exposed day'));
P('\n§3 JOURNAL SWAP per shape -> chip'); Object.keys(T3).sort().forEach(k => P('  ' + k + ' : ' + T3[k]));
P('\n§3x first example per shape -> chip'); Object.keys(EX3).sort().forEach(k => P('  ' + k + ' : ' + EX3[k]));
// §3f the fixture: HALF_MANNY W1 SAT chip Bike
for(const bg of [false, true]) for(const [lab0, C] of [['CAND', CE], ['V235', BE]]){ const lab = lab0 + (bg ? ' [bg: W1 FRI rpe 7 entry]' : ' [swap only]');
  const p = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); C.use(p); C.unforce(); C.wipe(); if(bg) C.setLog(1, 'fri', { rpe:'7', notes:'', week:1, ts:1 }); C.op(1, 'sat');
  C.ev("setCardioSwap('bike')"); C.advance(200); const e = C.entry(1, 'sat'); const jr = C.journal();
  P('\n§3f ' + lab + ' HALF_MANNY W1 SAT "' + p.weeks[1].sat.cardio.subtype + '" chip Bike: entry ' + J(e && Object.fromEntries(Object.entries(e).filter(([q]) => q !== 'ts'))));
  P('     journal section found ' + jr.found + ' text: ' + J(jr.text.slice(0, 300)));
  const empty = String(C.els.progressBody.innerHTML || '').match(/Log sessions to see[^<]*/); if(empty) P('     progressBody empty-state: ' + J(empty[0]));
}
// §4 rpe readers
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
  let fnName = '?'; const hits = [];
  lines.forEach((l, i) => { const m = /^\s*(?:async\s+)?function\s+([\w$]+)/.exec(l); if(m) fnName = m[1];
    if(/\brpe\b/.test(l.replace(/log_rpe|_restDraft\.rpe|RPE_LABELS/g, ''))) hits.push((i + pre + 1) + ' [' + fnName + '] ' + l.trim().slice(0, 170)); });
  P('\n§4 ' + lab + ' comment-stripped lines with token rpe (log_rpe, _restDraft.rpe, RPE_LABELS removed): ' + hits.length); hits.forEach(h => P('    ' + h));
}
P('\nDONE ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
