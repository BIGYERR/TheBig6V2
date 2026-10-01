// v226_sabotage_map.js — MEASURE, build 5 (V226), parked slice 7b. Read-only over index.html.
//   node tests/measure/v226_sabotage_map.js <candidate.html> <base_v225.html> <scratchdir>
// Quantifies, for coach's re-ruling of D188/D189 gate G5 and sabotage S1-S19:
//   P1 every 'beginner' token in the comment-stripped candidate (the g226 G5 stripper, verbatim) with file line and
//      the smallest G5-style window that reaches mileBest / arguments[12] / mileBestSecs); the same for each mutant's
//      restored token(s).
//   P2 each ruled mutation S1-S19: anchor count, behaviour fingerprint vs the candidate (independent lattice, not a
//      gate), and which rows of g226_d188, g226_d189, g222_d181_chain newly FAIL (vs the candidate's own FAIL set).
//   P3 every tests/sabotage/*.json anchor counted on the candidate and on V225.
//   P4 NSW SI W1 oracle by hand: doctrine row 12:00 (nikerunclub5k.txt:160) + the log-distance read + A's 16 s/mi.
// Oracles: mutations are typed from the ruling's Sabotage section (restorations of the V225 text); the fingerprint
// asks each artifact for its own output and only COMPARES artifacts; P4's expected value is hand arithmetic.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const REPO = path.join(__dirname, '..', '..');
const H = require(path.join(REPO, 'tests', 'harness.js'));

// ── fingerprint child mode ─────────────────────────────────────────────────────────────────────
if(process.argv[2] === '--fp'){
  const RealDate = Date; const NOW = new RealDate(2026, 8, 30, 9, 0, 0).getTime();
  class PD extends RealDate { constructor(...a){ if(a.length === 0) super(NOW); else super(...a); } static now(){ return NOW; } }
  globalThis.Date = PD;
  const IA = H.load(process.argv[3]);
  const out = { progs:{}, anchor:{}, card:{}, validator:{}, wizard:{}, ceiling:{} };
  const RACE = new Set(['run_5k','run_10k','run_half','run_marathon']);
  const ALL6 = ['run_pace_goal','run_5k','run_10k','run_half','run_marathon','run_base'];
  const WIZ = ['run_pace_goal','run_5k','run_10k','run_half','run_base'];
  const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
  function cfgOf(goal, exp, seed, mileSec, tgt){
    const g = { id: goal, label: goal, baselineDist: '', baseline: '' };
    if(goal === 'run_pace_goal'){ g.targetDist = '1.5'; g.targetMins = tgt ? tgt[0] : '12'; g.targetSecs = tgt ? tgt[1] : '0'; }
    if(mileSec){ g.mileBestMins = String(Math.floor(mileSec / 60)); g.mileBestSecs = String(mileSec % 60); g.mileBestSrc = { kind: 'entered' }; }
    const c = { name: 'M226', primaryPath: RACE.has(goal) ? 'event' : 'hybrid', cardioTypes: ['run'], cardioGoals: { run: g },
      liftingFocus: 'balanced', experience: exp, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
      restDays: ['sun','wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed };
    if(RACE.has(goal)){ c.eventTargeted = true; c.raceDate = '2027-01-31'; }
    return c;
  }
  const T = f => { try { const v = f(); return typeof v === 'string' ? v : JSON.stringify(v); } catch(e){ return 'THREW ' + e.message; } };
  const J = o => JSON.parse(JSON.stringify(o));
  for(const exp of ['beginner','intermediate']) for(const goal of ALL6) for(const mile of [0, 540, 780]) for(const seed of [1000, 1037]){
    const k = [exp, goal, mile, seed].join('|'), cfg = cfgOf(goal, exp, seed, mile);
    let p = null; out.progs[k] = T(() => { p = IA.buildProgram(J(cfg)); return H.progDigest(p) + ' L' + p.totalWeeks; });
    if(seed !== 1000) continue;
    out.anchor[k] = T(() => { const a = IA.eval('runAnchorInfo')(J(cfg)); return a ? a.kind + ' || ' + IA.eval('runAnchorSentence')(a) + ' || ' + IA.eval('runAnchorLine')(a) : 'null'; });
    out.card[k] = T(() => IA.eval('progDetailHTML')({ id: 'mQ', name: 'n', totalWeeks: 14, startDate: '2026-09-28', cfg: J(cfg) }));
  }
  const mileIn = { blank: null, '2:30': [2,30], '30:00': [30,0], '13:00': [13,0], '4:30': [4,30], '9:00': [9,0] };
  for(const exp of ['beginner','intermediate','advanced']) for(const goal of WIZ) for(const [mk, mv] of Object.entries(mileIn)){
    const g = { id: goal }; if(mv){ g.mileBestMins = String(mv[0]); g.mileBestSecs = String(mv[1]); }
    out.validator[[exp, goal, mk].join('|')] = T(() => IA.eval('_mileEntryState')(g, exp));
  }
  out.validator['sheet|beginner|30:00'] = T(() => IA.eval('_mileEntryState')({ mileBestMins: '30', mileBestSecs: '0' }, 'beginner'));
  const els = new Map(), mkEl = IA.window.document.createElement;
  IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mkEl('div'); e.id = id; els.set(id, e); } return els.get(id); };
  for(const exp of ['beginner','intermediate','advanced']) for(const goal of WIZ) for(const mile of [0, 540]) for(const tgt of (goal === 'run_pace_goal' ? [['12','0'], ['10','30']] : [null])){
    const run = { id: goal, label: goal, baselineDist: '', baseline: '' };
    if(goal === 'run_pace_goal'){ run.targetDist = '1.5'; run.targetMins = tgt[0]; run.targetSecs = tgt[1]; }
    if(mile){ run.mileBestMins = String(Math.floor(mile / 60)); run.mileBestSecs = String(mile % 60); run.mileBestSrc = { kind: 'entered' }; }
    const wd = { primaryPath: RACE.has(goal) ? 'event' : 'hybrid', cardioTypes: ['run'], experience: exp, ageBracket: '18-35',
      eventTargeted: RACE.has(goal), raceDate: RACE.has(goal) ? '2027-01-31' : null, liftingFocus: 'balanced', equipment: 'crossfit',
      restDays: ['sun','wed'], unit: 'lbs', seed: 1000, name: 'M226', cardioGoals: { run } };
    const k = [exp, goal, mile, tgt ? tgt.join(':') : '-'].join('|');
    out.wizard[k] = T(() => { els.clear();
      IA.eval('WD = ' + JSON.stringify(wd) + '; activeProg = null; wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();');
      let r = 'BODY ' + ((els.get('wizardBody') || {}).innerHTML || '');
      try { IA.eval('updateRaceDateFeedback()'); } catch(e){ r += ' URDF THREW ' + e.message; }
      r += ' || LEN ' + ((els.get('progLenLine') || {}).innerHTML || '') + ' || FEAS ' + ((els.get('paceFeasLine') || {}).innerHTML || '') + ' || ADV ' + ((els.get('mileAdvisory') || {}).innerHTML || '');
      return r; });
    out.ceiling[k] = T(() => [6, 12].map(L => JSON.stringify(IA.eval('assessRunPaceCeiling')(L))).join(' ; '));
  }
  fs.writeFileSync(process.argv[4], JSON.stringify(out));
  process.exit(0);
}

// ── main ───────────────────────────────────────────────────────────────────────────────────────
const CAND = path.resolve(process.argv[2]), BASE = path.resolve(process.argv[3]), SC = path.resolve(process.argv[4]);
fs.mkdirSync(SC, { recursive: true });
const cand = fs.readFileSync(CAND, 'utf8'), base = fs.readFileSync(BASE, 'utf8');
const cnt = (s, a) => { let n = 0, i = s.indexOf(a); while(i >= 0){ n++; i = s.indexOf(a, i + 1); } return n; };
const log = (...a) => console.log(...a);

// Ruled mutations S1-S19, typed from the ruling's Sabotage section (V225 text restored / D189 surface removed).
const btnStart = cand.indexOf(`Run paces<button onclick="event.stopPropagation();openMileSheet('\${p.id}')"`);
const btnEnd = btnStart >= 0 ? cand.indexOf('</button>', btnStart) + '</button>'.length : -1;
const BTN = btnStart >= 0 ? cand.slice(btnStart + 'Run paces'.length, btnEnd) : '<<button not found>>';
const S = [
  ['S1', 'E4 :3815 restore beginner clause (buildRunSession)', 'const _mileBestSecs = arguments[12] ? arguments[12] : null;', "const _mileBestSecs = (experience !== 'beginner' && arguments[12]) ? arguments[12] : null;"],
  ['S2', 'E5 :4376 restore beginner clause (buildNRCSession)', 'const anchorSec = mileBestSecs ? mileBestSecs : expCurrentPace;', "const anchorSec = (experience !== 'beginner' && mileBestSecs) ? mileBestSecs : expCurrentPace;"],
  ['S3', 'E3 :3179 restore beginner clause (calcProgramLength)', 'var _mileBestSecs = (goal.mileBestMins', "var _mileBestSecs = (experience !== 'beginner' && goal.mileBestMins"],
  ['S4', 'E1 :2433 restore beginner clause (assessRunPaceCeiling)', 'const mileBest = (g.mileBestMins', "const mileBest = (exp !== 'beginner' && g.mileBestMins"],
  ['S5', 'E6 restore if(!g||exp===beginner) early return', '  if(!g) return {ok:true};\n  if(g.mileBestMins===undefined', "  if(!g||exp==='beginner') return {ok:true};\n  if(g.mileBestMins===undefined"],
  ['S6', 'E6 drop && exp!==beginner from R3', "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true", "if(g.id==='run_pace_goal') return {ok:false, blank:true"],
  ['S7', 'E9 :2876 restore wizard guard', "${(t==='run') ? `<div class=\"input-group\"", "${(t==='run' && WD.experience !== 'beginner') ? `<div class=\"input-group\""],
  ['S8', 'E10 restore pencil guard kind!==beginner', 'Run paces' + BTN, "Run paces${s.runAnchor.kind!=='beginner'?`" + BTN + "`:''}"],
  ['S9', 'E7 restore kind===beginner branch', "const kind = !entered ? 'default'", "const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default'"],
  ['S10', 'D189 remove d189DefaultAnchorNote( call', 'd189DefaultAnchorNote(weeks, {...cfg, cardioTypes, cardioGoals});', ';'],
  ['S11', 'D189 delete return; after the append', "rebuilds off it.';\n      return; } }", "rebuilds off it.';\n      } }"],
  ['S12', "D189 weeks['1'] -> weeks['2']", "const w1 = weeks['1'] || weeks[1];", "const w1 = weeks['2'] || weeks[2];"],
  ['S13', "D189 'run_base' out of _CHART_RUN_GOALS", "'run_15_under10','run_base']);", "'run_15_under10']);"],
  ['S14', 'D189 run_base chips branch removed', "const list = a.goalId==='run_base' ? [['Mile',r.mile]] : ", 'const list = '],
  ['S15', 'D189 D9 >25:00 old string', "Over 25:00 reads as a walk, not a run. Check the entry.'", "Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.'"],
  ['S16', 'D189 F5 header branch removed', 'if(!(p && p.tw) && _ms.blank) return ', 'if(false) return '],
  ['S17', 'D189 helper returns V225 label', 'function _mileFieldHelp(){', "function _mileFieldHelp(){ return 'Optional. It sets your training paces.';"],
  ['S18', 'D189 _mileEntryState().blank ? null : removed', 'const _f = _mileEntryState().blank ? null : assessRunPaceCeiling(', 'const _f = assessRunPaceCeiling('],
];
const G222 = path.join(REPO, 'tests', 'gates', 'g222_d181_chain.js');
const g222src = fs.readFileSync(G222, 'utf8');
const S19 = ['S19', 'LIC5L_ERAS without 226 (gate file)', 'const LIC5L_ERAS = [222, 223, 224, 225, 226]', 'const LIC5L_ERAS = [222, 223, 224, 225]'];

log('== P2a anchor counts (candidate ' + CAND + ')');
const muts = [];
for(const [id, what, a, r] of S){
  const n = cnt(cand, a); log(id.padEnd(4) + ' anchor count ' + n + (n === 1 ? '' : '  NOT-APPLIED') + '  ' + what);
  if(n === 1){ const f = path.join(SC, 'mut_' + id + '.html'); fs.writeFileSync(f, cand.replace(a, () => r)); muts.push({ id, what, file: f }); }
}
const n19 = cnt(g222src, S19[2]); log('S19  anchor count ' + n19 + ' in tests/gates/g222_d181_chain.js' + (n19 === 1 ? '' : '  NOT-APPLIED') + '  ' + S19[1]);
// S19 tree: mutated gate beside a symlinked harness so require(__dirname/../harness.js) resolves
const TREE = path.join(SC, 'tree', 'tests');
fs.rmSync(path.join(SC, 'tree'), { recursive: true, force: true }); fs.mkdirSync(path.join(TREE, 'gates'), { recursive: true });
fs.symlinkSync(path.join(REPO, 'tests', 'harness.js'), path.join(TREE, 'harness.js'));
const G222_S19 = path.join(TREE, 'gates', 'g222_S19.js');
if(n19 === 1) fs.writeFileSync(G222_S19, g222src.replace(S19[2], S19[3]));
const V221 = path.join(SC, 'base_v221.html');
if(!fs.existsSync(V221)) fs.writeFileSync(V221, cp.execFileSync('git', ['show', '57b9dee80269743a40b350aa399351661dd9c06b:index.html'], { cwd: REPO, maxBuffer: 1 << 27 }));

// ── async pool ────────────────────────────────────────────────────────────────────────────────
function run(cmd, args, outFile){ return new Promise(res => { const t = Date.now();
  const ch = cp.spawn(cmd, args, { cwd: REPO }); const buf = [];
  ch.stdout.on('data', d => buf.push(d)); ch.stderr.on('data', d => buf.push(d));
  ch.on('close', code => { const s = Buffer.concat(buf).toString(); fs.writeFileSync(outFile, s + '\nrc=' + code + ' secs=' + ((Date.now() - t) / 1000).toFixed(1) + '\n'); res({ code, s }); }); }); }
async function pool(jobs, k){ const out = new Array(jobs.length); let i = 0;
  await Promise.all(Array.from({ length: k }, async () => { while(i < jobs.length){ const j = i++; out[j] = await jobs[j](); } })); return out; }

const GATES = { d188: path.join(REPO, 'tests/gates/g226_d188_beginnermile.js'), d189: path.join(REPO, 'tests/gates/g226_d189_pacedisclose.js'), g222: G222 };
function parse(s){ const m = s.match(/PASS (\d+) FAIL (\d+)/g); const last = m ? m[m.length - 1] : null;
  const fails = s.split('\n').filter(l => /^FAIL /.test(l)).map(l => l.replace(/ \(got [\s\S]*$/, '').slice(0, 150));
  return { summary: last, crash: !last, fails }; }
const rowId = l => { const m = l.match(/^FAIL (G\d+|row \w+|5L|\w+)/); return m ? m[1] : l.slice(5, 30); };

(async () => {
  // fingerprints: candidate twice (self-equality), each mutant once
  const fpJobs = [['candA', CAND], ['candB', CAND], ...muts.map(m => [m.id, m.file])].map(([id, f]) => () =>
    run('node', [__filename, '--fp', f, path.join(SC, 'fp_' + id + '.json')], path.join(SC, 'fp_' + id + '.log')).then(r => ({ id, code: r.code })));
  const fpRes = await pool(fpJobs, 8);
  const FP = {}; for(const r of fpRes){ try { FP[r.id] = JSON.parse(fs.readFileSync(path.join(SC, 'fp_' + r.id + '.json'), 'utf8')); } catch(e){ FP[r.id] = null; log('FP CRASH ' + r.id + ' rc ' + r.code); } }
  const cmpFP = (a, b) => { const o = {}; let tot = 0, diff = 0; for(const cls of Object.keys(a)){ const ks = Object.keys(a[cls]); let d = 0, th = 0;
      for(const k of ks){ if(a[cls][k] !== b[cls][k]) d++; if(/^THREW/.test(b[cls][k] || '')) th++; } o[cls] = d + '/' + ks.length + (th ? ' (threw ' + th + ')' : ''); tot += ks.length; diff += d; }
    return { o, tot, diff }; };
  log('\n== P2b behaviour fingerprint (independent lattice: 72 builds, 36 anchor strings, 36 cards, 91 validator calls, 42 wizard renders, 42 ceiling calls)');
  const self = FP.candA && FP.candB ? cmpFP(FP.candA, FP.candB) : null;
  log('candidate == itself: ' + (self ? self.diff + ' differing of ' + self.tot + ' ' + JSON.stringify(self.o) : 'CRASH'));
  const beh = {};
  for(const m of muts){ if(!FP[m.id] || !FP.candA){ beh[m.id] = 'CRASH'; log(m.id.padEnd(4) + ' CRASH'); continue; }
    const c = cmpFP(FP.candA, FP[m.id]); beh[m.id] = c.diff; log(m.id.padEnd(4) + (c.diff ? ' MOVES ' : ' NO-OP ') + c.diff + '/' + c.tot + ' ' + JSON.stringify(c.o));
    // first differing key per class, for the record
    for(const cls of Object.keys(FP.candA)) { const k = Object.keys(FP.candA[cls]).find(k => FP.candA[cls][k] !== FP[m.id][cls][k]); if(k) log('       first ' + cls + ' ' + k); }
  }

  // gates
  const gJobs = [];
  const add = (id, gate, art, extra) => gJobs.push(() => run('node', [gate, art, ...extra], path.join(SC, 'gate_' + id + '_' + path.basename(gate, '.js') + '.out')).then(r => ({ id, gate: path.basename(gate, '.js'), ...parse(r.s) })));
  for(const t of [{ id: 'cand', file: CAND }, ...muts]){ add(t.id, GATES.d188, t.file, [BASE]); add(t.id, GATES.d189, t.file, [BASE]); add(t.id, GATES.g222, t.file, [V221]); }
  if(n19 === 1) add('S19', G222_S19, CAND, [V221]);
  const gr = await pool(gJobs, 8);
  const byId = {}; for(const r of gr){ (byId[r.id] = byId[r.id] || {})[r.gate.replace('g222_S19', 'g222_d181_chain')] = r; }
  const cf = byId.cand;
  log('\n== P2c gate trips (new FAIL rows vs the candidate; candidate FAIL set shown first)');
  for(const g of Object.keys(cf)) log('cand ' + g + ' ' + cf[g].summary + ' fails: ' + (cf[g].fails.map(rowId).join(', ') || 'none'));
  for(const id of [...muts.map(m => m.id), 'S19']){ const R = byId[id]; if(!R){ log(id + ' not run'); continue; }
    const parts = [];
    for(const g of ['g226_d188_beginnermile', 'g226_d189_pacedisclose', 'g222_d181_chain']){ const r = R[g]; if(!r) continue;
      if(r.crash){ parts.push(g.slice(0, 9) + ' CRASH'); continue; }
      const base0 = new Set((cf[g] || { fails: [] }).fails); const nw = r.fails.filter(f => !base0.has(f)); const gone = [...base0].filter(f => !r.fails.includes(f));
      parts.push(g.slice(0, 9) + ' ' + r.summary + ' new[' + (nw.map(rowId).join(',') || '-') + ']' + (gone.length ? ' healed[' + gone.map(rowId).join(',') + ']' : '')); }
    log(id.padEnd(4) + ' beh ' + String(beh[id] === undefined ? 'n/a(gate)' : beh[id]).padEnd(4) + ' | ' + parts.join(' | '));
    for(const g of Object.keys(R)){ const base0 = new Set((cf[g.replace('g222_S19','g222_d181_chain')] || { fails: [] }).fails); R[g].fails.filter(f => !base0.has(f)).forEach(f => log('       ' + f)); }
  }

  // P1 token scan
  log('\n== P1 G5 token scan');
  const BS = String.fromCharCode(92);
  // stripper lifted verbatim from g226_d188 G5; keepNL=true only rewrites a block comment as its newlines (line mapping)
  function stripComments(src, keepNL){
    const out = [], n = src.length, tpl = [];
    let i = 0, depth = 0, prevSig = '', prevWord = '';
    const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
    const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
    const readTemplate = () => { while(i < n){ const c = src[i];
        if(c === BS){ out.push(src.substr(i, 2)); i += 2; continue; }
        if(c === '`'){ out.push(c); i++; return; }
        if(c === '$' && src[i + 1] === '{'){ out.push('${'); i += 2; tpl.push(depth); depth++; return; }
        out.push(c); i++; } };
    while(i < n){
      const c = src[i], d = src[i + 1];
      if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
      if(c === '/' && d === '*'){ const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; out.push(keepNL ? ' ' + '\n'.repeat((src.slice(i, e).match(/\n/g) || []).length) : ' '); i = e; continue; }
      if(c === "'" || c === '"'){ let j = i + 1; while(j < n && src[j] !== c && src[j] !== '\n'){ if(src[j] === BS) j++; j++; }
        out.push(src.slice(i, j + 1)); i = j + 1; prevSig = c; prevWord = ''; continue; }
      if(c === '`'){ out.push(c); i++; readTemplate(); prevSig = '`'; prevWord = ''; continue; }
      if(c === '{'){ depth++; out.push(c); i++; prevSig = c; prevWord = ''; continue; }
      if(c === '}'){ depth--; out.push(c); i++; prevWord = '';
        if(tpl.length && tpl[tpl.length - 1] === depth){ tpl.pop(); readTemplate(); prevSig = '`'; } else prevSig = '}'; continue; }
      if(c === '/'){
        if(prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)){
          let j = i + 1, cls = false;
          while(j < n && src[j] !== '\n'){ const x = src[j]; if(x === BS){ j += 2; continue; }
            if(cls){ if(x === ']') cls = false; } else if(x === '[') cls = true; else if(x === '/') break; j++; }
          j++; while(j < n && /[a-z]/i.test(src[j])) j++;
          out.push(src.slice(i, j)); i = j; prevSig = 'r'; prevWord = ''; continue; }
        out.push(c); i++; prevSig = c; prevWord = ''; continue; }
      if(/[A-Za-z0-9_$]/.test(c)){ let j = i; while(j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; const w = src.slice(i, j);
        out.push(w); i = j; prevWord = w; prevSig = 'w'; continue; }
      out.push(c); i++; if(!/\s/.test(c)){ prevSig = c; prevWord = ''; }
    }
    return out.join('');
  }
  const TOK = "'beginner'", ANCH = ['mileBest', 'arguments[12]', 'mileBestSecs)'];
  function scan(html){
    const js = H.extractInlineJS(html); const off = html.indexOf(js); const line0 = off >= 0 ? html.slice(0, off).split('\n').length : NaN;
    const CS = stripComments(js, false), CN = stripComments(js, true);
    const idx = s => { const r = []; for(let i = s.indexOf(TOK); i >= 0; i = s.indexOf(TOK, i + 1)) r.push(i); return r; };
    const a = idx(CS), b = idx(CN); const toks = [];
    a.forEach((i, k) => { let best = Infinity, bestA = null;
      for(const an of ANCH){ for(let j = CS.indexOf(an); j >= 0; j = CS.indexOf(an, j + 1)){
          const need = j < i ? i - j : Math.max(0, j + an.length - (i + TOK.length)); if(need < best){ best = need; bestA = an; } } }
      const fl = (b[k] !== undefined) ? line0 + CN.slice(0, b[k]).split('\n').length - 1 : NaN;
      toks.push({ fl, need: best, anchor: bestA, ctx: CS.slice(Math.max(0, i - 50), i + TOK.length + 20).replace(/\s+/g, ' ') }); });
    return { toks, n: a.length, nNL: b.length, CS };
  }
  const sc = scan(cand);
  log('candidate: ' + sc.n + " 'beginner' tokens in comment-stripped source (newline-preserving pass agrees: " + (sc.n === sc.nNL) + ')');
  sc.toks.slice().sort((x, y) => x.need - y.need).forEach(t => log('  index.html:' + t.fl + '  window-needed ' + String(t.need).padStart(6) + ' (' + t.anchor + ')  ' + (t.need <= 120 ? 'IN-120 ' : '       ') + t.ctx));
  const key = t => t.ctx;
  for(const id of ['S1','S2','S3','S4','S5','S6','S7','S8','S9']){ const m = muts.find(x => x.id === id); if(!m) continue;
    const ms = scan(fs.readFileSync(m.file, 'utf8')); const pool0 = sc.toks.map(key);
    const added = ms.toks.filter(t => { const k = pool0.indexOf(key(t)); if(k >= 0){ pool0.splice(k, 1); return false; } return true; });
    log(id + ': tokens ' + ms.n + ' (+' + (ms.n - sc.n) + '); restored/changed: ' + (added.map(t => 'line ' + t.fl + ' need ' + t.need + ' (' + t.anchor + ') ' + t.ctx).join(' || ') || 'none'));
    const kinds = [/kind\s*===?\s*'beginner'/g, /kind\s*!==?\s*'beginner'/g, /'beginner default'/g, /beginner default of/g].map(r => (ms.CS.match(r) || []).length);
    log('     G5 literal tokens [kind===, kind!==, \'beginner default\', beginner default of]: ' + kinds.join(','));
  }

  // P3 old specs
  log('\n== P3 old sabotage specs: anchors not count==1 on the candidate (and their count on V225)');
  let totalM = 0, bad = 0;
  for(const f of fs.readdirSync(path.join(REPO, 'tests/sabotage')).filter(f => f.endsWith('.json')).sort()){
    let d; try { d = JSON.parse(fs.readFileSync(path.join(REPO, 'tests/sabotage', f), 'utf8')); } catch(e){ log('  ' + f + ' PARSE FAIL ' + e.message); continue; }
    const L = Array.isArray(d) ? d : (d.mutations || []);
    L.forEach((m, k) => { if(!m || typeof m.anchor !== 'string') return; totalM++; const nc = cnt(cand, m.anchor), nb = cnt(base, m.anchor);
      if(nc !== 1){ bad++; log('  ' + f + ' #' + (k + 1) + ' cand ' + nc + ' v225 ' + nb + ' gate ' + m.gate + ' | ' + String(m.name).slice(0, 110)); } });
  }
  log('  ' + bad + ' of ' + totalM + ' mutations NOT count==1 on the candidate');

  // P4 SI oracle
  log('\n== P4 NSW SI W1 hand oracle, beginner run_pace_goal 1.5 mi 12:00, mile 13:00, seed 1000');
  const row = { mile: 720, fiveK: 760 };  // doctrine/nikerunclub5k.txt:160, typed: 12:00 | 39:30/12:40
  const init = row.mile + (row.fiveK - row.mile) * Math.log(1.5) / Math.log(3.107);
  const clk = s => { const r = Math.round(s); return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); };
  log('  hand: initialPace = 720 + 40*ln1.5/ln3.107 = ' + init.toFixed(2) + ' (' + clk(init) + '); SI = init - 16 = ' + (init - 16).toFixed(2) + ' (' + clk(init - 16) + '); row.mile - 2 = 718 (' + clk(718) + ')');
  { const RealDate = Date; const NOW = new RealDate(2026, 8, 30, 9, 0, 0).getTime();
    class PD extends RealDate { constructor(...a){ if(a.length === 0) super(NOW); else super(...a); } static now(){ return NOW; } } globalThis.Date = PD;
    for(const [lab, f] of [['cand', CAND], ['v225', BASE]]){ const IA = H.load(f);
      for(const [mm, tg] of [[780, ['12','0']], [780, ['13','30']], [540, ['12','0']]]){
        const g = { id: 'run_pace_goal', label: 'p', targetDist: '1.5', targetMins: tg[0], targetSecs: tg[1], mileBestMins: String(Math.floor(mm / 60)), mileBestSecs: String(mm % 60), mileBestSrc: { kind: 'entered' } };
        const cfg = { name: 'M', primaryPath: 'hybrid', cardioTypes: ['run'], cardioGoals: { run: g }, liftingFocus: 'balanced', experience: 'beginner', ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: ['sun','wed'], days: ['sun','mon','tue','wed','thu','fri','sat'], bench: 135, squat: 155, deadlift: 185, seed: 1000 };
        const p = IA.buildProgram(cfg); const w = p.weeks['1'] || p.weeks[1]; const si = [];
        for(const d of ['mon','tue','wed','thu','fri','sat','sun']){ const day = w[d]; if(!day) continue; [].concat(day.cardio || []).forEach(c => { if(c && /Short Interval/.test(c.subtype || '')) si.push(d + ' ' + (String(c.detail).match(/^[^.]*\.[^.]*\./) || [''])[0]); }); }
        log('  ' + lab + ' mile ' + clk(mm) + ' goal 1.5 in ' + tg.join(':') + ' L' + p.totalWeeks + ': ' + (si.join(' | ') || 'no SI in W1'));
      } }
  }
})().catch(e => { console.log('SCRIPT CRASH ' + e.stack); process.exit(2); });
