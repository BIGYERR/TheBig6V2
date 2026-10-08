// v237_paceface.js — MEASURE mC (Mode B before-picture for a parked gate row, standing ruling 7), V237.
//   node tests/measure/v237_paceface.js <candidate.html> <base_v236.html>
// Question: g237 D220-open conjunct generic-pace-face expects the blank pace face "—:—" (ruling text). What does the
//   athlete actually see on each file, which call sites render a pace wheel, and how many lattice days reach them?
// Oracle: the rendered DOM (row the real iaWheelInit lands on, its printed face text), the raw HTML bytes, and the
//   ruling's own strings. The expected "—:—" comes from the ruling, never from _iawParse/_iawFormat.
// Env: env() from tests/measure/v236_pace_premise.js on mkEnv from v235_clear_reopen.js (same slicing as v237_distzero.js).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const FILES = process.argv.slice(2).map(f => path.resolve(f));
if(FILES.length !== 2) throw new Error('usage: v237_paceface.js <cand> <base>');
const load = H.load, RealDate = Date;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], J = JSON.stringify, P = s => console.log(s);
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v235_clear_reopen.js'), 'utf8');
  const a = src.indexOf('function mkEnv(file){'), b = src.indexOf('\n  return E;\n}', a);
  if(a < 0 || b < 0) throw new Error('mkEnv not found'); eval('global.mkEnv = ' + src.slice(a, b + '\n  return E;\n}'.length)); }
{ const src = fs.readFileSync(path.join(ROOT, 'tests', 'measure', 'v236_pace_premise.js'), 'utf8');
  const a = src.indexOf('const STR_IDS = '), b = src.indexOf('\n  return C; }', a);
  if(a < 0 || b < 0) throw new Error('env not found'); eval(src.slice(a, b + '\n  return C; }'.length).replace('const STR_IDS', 'global.STR_IDS').replace('function env(file){', 'global.env = function(file){')); }
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1').replace(/\s+/g, ' ').trim();
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
const mkCfg = (sports, f, ex, sd, inj) => { const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  const c = { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
  if(inj) c.injury = inj; return c; };
// same lattice as v237_distzero.js (full, not --quick)
const GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'];
const PROGS = [['HALF_MANNY|fixture', JSON.parse(J(H.fixtures.HALF_MANNY))]];
for(const g of GOALS) for(const f of ['balanced', 'strength']) for(const ex of ['beginner', 'advanced']) for(const sd of [76308, 24865]) PROGS.push([g + '|' + f + '|' + ex + '|' + sd, mkCfg([['run', g]], f, ex, sd)]);
for(const sd of [76308, 24865]) PROGS.push(['multi run_half+bike+swim|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', sd)]);
for(const reg of ['knee', 'ankle', 'lowback']) PROGS.push(['injury ' + reg + ' run_10k+bike', mkCfg([['run', 'run_10k'], ['bike', 'bike_base']], 'balanced', 'intermediate', 76308, { region:reg, tier:'protect' })]);
const RESULT = {};
for(const FILE of FILES){
  const html = fs.readFileSync(FILE, 'utf8'); const C = env(FILE); const R = RESULT[FILE] = {};
  P('\n==================== ' + FILE + ' | ia-version ' + C.VER);
  // §1a static pace machinery
  const SP = JSON.parse(C.ev('JSON.stringify(_IAW_SPEC)'));
  P('§1a _IAW_SPEC.pace ' + J(SP.pace));
  const rows = SP.pace.cols.map((c, i) => JSON.parse(C.ev('JSON.stringify(_iawRows(' + J(c) + '))')));
  rows.forEach((r, i) => P('   pace col' + i + ' rows ' + r.length + ' first ' + J(r.slice(0, 3)) + ' last ' + J(r.slice(-1)) + ' nil-row ' + r.includes('') + ' wraps ' + C.ev('_iawWraps(' + J(SP.pace.cols[i]) + ')') + ' home ' + C.ev('_iawHome(' + J(SP.pace.cols[i]) + ')')));
  R.static = { spec:J(SP.pace), rows:J(rows) };
  for(const inp of ['', 'abc', '8:30']){ const pa = C.ev('JSON.stringify(_iawParse("pace",' + J(inp) + '))'); const fo = C.ev('_iawFormat("pace",' + pa + ')');
    const hm = C.ev('iaWheelHTML("pace","log_run_pace",' + J(inp) + ')');
    P('   input ' + J(inp).padEnd(7) + ' parse ' + pa + ' format(parse) ' + J(fo) + ' iaWheelHTML sha ' + sha(hm) + ' len ' + hm.length);
    R.static['in' + inp] = pa + '|' + fo + '|' + sha(hm); }
  const FN = ['_iawRows', '_iawWraps', '_iawHome', '_iawList', '_iawFace', '_iawParse', '_iawFormat', 'iaWheelHTML', 'iaWheelInit', '_iawCommit', '_iawSel', 'cardioFieldHTML', 'setCardioSwap'];
  R.fn = {}; for(const f of FN){ let s; try { s = strip(C.ev(f + '.toString()')); } catch(e){ s = 'ERR ' + e.message; } R.fn[f] = sha(s); R['src_' + f] = s; }
  P('   fn sha (comments stripped) ' + J(R.fn));
  // §1b the rendered face via the real open + iaWheelInit, generic form forced (g232 __FORCE hook), HALF_MANNY
  const HM = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))); C.use(HM);
  let host = null; for(const w of Object.keys(HM.weeks).map(Number).sort((a, b) => a - b)) { for(const d of DAYS){ const x = HM.weeks[w][d]; if(x && !x.rest && x.cardio && !Array.isArray(x.cardio) && (x.cardio.type || '').toLowerCase() === 'run'){ host = [w, d]; break; } } if(host) break; }
  P('§1b rendered pace wheel, HALF_MANNY host W' + host[0] + ' ' + host[1] + ', dose forced null (generic form)');
  R.face = {};
  for(const inp of ['', 'abc', '8:30']){
    C.force(null); C.wipe(); if(inp !== '') C.setLog(host[0], host[1], { run_pace:inp, rpe:'5' }); C.op(host[0], host[1]);
    const wh = C.wheel('log_run_pace');
    if(!wh){ P('   input ' + J(inp) + ' NO PACE WHEEL RENDERED'); R.face[inp] = 'none'; continue; }
    const sel = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? { v:it.v, face:it.face } : null; });
    const hid = C.els.log_run_pace ? C.els.log_run_pace.value : '?';
    const nItems = wh._cols.map(c => c.items.length);
    P('   stored ' + J(inp).padEnd(7) + ' column faces ' + J(sel.map(s => s && s.face)) + ' values ' + J(sel.map(s => s && s.v)) + ' items/col ' + J(nItems) + ' hidden ' + J(hid) + ' entry after open ' + J((C.entry(host[0], host[1]) || {}).run_pace));
    R.face[inp] = J(sel) + '|' + J(nItems) + '|' + hid;
  }
  // the markup between the two pace columns (is there a separator glyph?)
  const gm = C.ev('cardioFieldHTML("run",{},null,"")');
  const pm = gm.slice(gm.indexOf('data-kind="pace"')); const between = pm.replace(/<div class="iaw-it[^>]*>[^<]*<\/div>/g, '').replace(/\s+/g, ' ').slice(0, 400);
  P('   pace markup with rows removed: ' + between);
  P('   CSS colon/separator rules on .iaw: ' + J((html.match(/\.iaw[^{]*\{[^}]*content:[^}]*\}/g) || []).slice(0, 5)));
  // §1c real path to the generic form without the hook: a bike day swapped to run (setCardioSwap)
  { const MP = C.IA.buildProgram(mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', 76308)); C.use(MP); C.unforce();
    let bh = null; for(const w of Object.keys(MP.weeks).map(Number).sort((a, b) => a - b)){ for(const d of DAYS){ const x = MP.weeks[w][d]; if(x && !x.rest && x.cardio && !Array.isArray(x.cardio) && /bike|swim/i.test(x.cardio.type || '')){ bh = [w, d, x.cardio.type]; break; } } if(bh) break; }
    if(!bh) P('§1c no bike/swim day in multi'); else { C.wipe(); C.op(bh[0], bh[1]); let err = null; try { C.ev("setCardioSwap('run')"); C.advance(200); } catch(e){ err = e.message; }
      let wh = C.wheel('log_run_pace');
      const inMk = (C.els.detailBody.innerHTML + ((C.els.cardioFields || {}).innerHTML || '') + ((C.els.cardioFields || {})._html || '')).includes('data-kind="pace"');
      const sel = wh ? wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.face : '?'; }) : null;
      P('§1c real path: multi seed 76308 W' + bh[0] + ' ' + bh[1] + ' (' + bh[2] + ') -> setCardioSwap(run) ' + (err ? 'ERR ' + err : 'ok') + ' | pace markup present ' + inMk + ' | wheel model ' + (wh ? 'faces ' + J(sel) : 'not initialised by env'));
      R.swap = J(sel) + '|' + inMk; } }
  // §2 lattice reach (engine dose, no hook)
  C.unforce(); const T = {}; const bump = k => { T[k] = (T[k] || 0) + 1; }; let nP = 0; const ERR = [];
  for(const [name, cfg] of PROGS){ let p; try { p = C.IA.buildProgram(cfg); } catch(e){ ERR.push(name + ' ' + e.message); continue; } nP++;
    for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const x = p.weeks[w][d]; if(!x || x.rest || !x.cardio) continue;
      const cs = Array.isArray(x.cardio) ? x.cardio : [x.cardio]; if(Array.isArray(x.cardio)) bump('cardio ARRAY days');
      for(const c of cs){ const t = (c.type || '').toLowerCase(); bump('sessions ' + t);
        if(t === 'run'){ const dz = C.ev('__realDFC')(c); bump('run dose ' + (dz ? dz.k : 'NULL -> generic form (pace wheel)')); if(!dz) bump('generic subtype "' + c.subtype + '"'); }
        else if(t === 'bike' || t === 'swim') bump('non-run cardio (swap-to-run reaches generic form)'); } } }
  P('§2 lattice ' + nP + ' programs built (' + PROGS.length + ' configs), errors ' + ERR.length + ' ' + J(ERR.slice(0, 3)));
  Object.keys(T).sort().forEach(k => P('   ' + k.padEnd(60) + T[k]));
  R.T = J(T);
  // §3 does "—:—" exist anywhere; every kind's blank face
  const DASH = '\u2014';
  const lit = (html.split(DASH + ':' + DASH).length - 1), esc = (html.split('\\u2014:\\u2014').length - 1), ent = (html.split('&mdash;:&mdash;').length - 1);
  P('§3 literal "—:—" in file: ' + lit + ' | "\\u2014:\\u2014": ' + esc + ' | "&mdash;:&mdash;": ' + ent);
  for(const k of Object.keys(SP)){ const nil = SP[k].cols.map((c, i) => c.nil ? i : -1).filter(i => i >= 0);
    for(const inp of ['', 'abc']){ const pa = JSON.parse(C.ev('JSON.stringify(_iawParse(' + J(k) + ',' + J(inp) + '))'));
      // landed face per column = row iaWheelInit lands on: the seed value if that column has the row, else the home row
      const faces = SP[k].cols.map((c, i) => { const r = JSON.parse(C.ev('JSON.stringify(_iawRows(' + J(c) + '))')); const list = JSON.parse(C.ev('JSON.stringify(_iawList(' + J(c) + '))')); const home = +C.ev('_iawHome(' + J(c) + ')');
        let idx = home; for(let q = home; q < list.length; q++) if(list[q] === pa[i]){ idx = q; break; } return C.ev('_iawFace(' + J(c) + ',' + J(list[idx]) + ')'); });
      P('   kind ' + k.padEnd(5) + ' nil cols ' + J(nil) + ' blank ' + J(inp).padEnd(6) + ' parse ' + J(pa) + ' landed faces ' + J(faces)); } }
}
// §4 identical?
const [A, B] = FILES.map(f => RESULT[f]);
P('\n§4 candidate vs base');
P('   pace spec equal ' + (A.static.spec === B.static.spec) + ' | rows equal ' + (A.static.rows === B.static.rows));
for(const k of ['in', 'inabc', 'in8:30']) P('   static ' + k + ' equal ' + (A.static[k] === B.static[k]) + '  ' + A.static[k] + ' vs ' + B.static[k]);
for(const k of Object.keys(A.fn)) P('   fn ' + k.padEnd(16) + (A.fn[k] === B.fn[k] ? 'same' : 'DIFF'));
for(const k of Object.keys(A.face)) P('   rendered face stored ' + J(k).padEnd(7) + (A.face[k] === B.face[k] ? 'same ' : 'DIFF ') + A.face[k] + (A.face[k] === B.face[k] ? '' : ' vs ' + B.face[k]));
P('   swap path ' + (A.swap === B.swap ? 'same ' : 'DIFF ') + A.swap + ' / ' + B.swap);
P('   lattice counts ' + (A.T === B.T ? 'same' : 'DIFF'));
P('DONE');
