#!/usr/bin/env node
// v233_slow_gates.js — measure pass mSG (Post-V233, no build). What does each slow gate cost ALONE, and why.
//   node tests/measure/v233_slow_gates.js <scratch> --phase alone|fuzz|trip|report
// Instrument (independent of every gate): a --require preload (written to <scratch>/sg_preload.js) wraps the
// harness's load() and, inside every booted VM context, buildProgram and the swap/render entry points, counting calls
// and timing buildProgram (depth-guarded: nested calls are not double counted). Each node process (gate parent, its
// workers, its self-spawns) writes one <pid>.json with its own wall interval, CPU (process.cpuUsage), max RSS
// (process.resourceUsage), boots, buildProgram calls and ms, and the time of the first column-0 FAIL line it printed.
// Gates are run as gate.sh runs them: node <gate> <candidate> <baseline>. Whole-tree wall/CPU/RSS from /usr/bin/time -l.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const SG = path.resolve(process.argv[2] || '.');
const PHASE = (process.argv.indexOf('--phase') > 0) ? process.argv[process.argv.indexOf('--phase') + 1] : 'alone';
const CAND = path.join(ROOT, 'index.html'), BASE = path.join(SG, 'base_V232.html');
const SIX = ['g230_d194_lens2', 'g217_d160_dedupe_view', 'g222_d181_chain', 'g227_d190_seam', 'g228_d192_undokey', 'g227_d190_cuecap'];
const FOUR = ['g213_d113a', 'g211_d153_d155', 'g223_d184_testlen', 'g216_d156_longday'];
const PRELOAD = path.join(SG, 'sg_preload.js');
fs.writeFileSync(PRELOAD, `'use strict';
const fs = require('fs'), path = require('path');
const DIR = process.env.SG_DIR, HP = process.env.SG_HARNESS;
const T0 = Date.now(), hr = () => Number(process.hrtime.bigint()) / 1e6;
const st = { pid:process.pid, ppid:process.ppid, argv:process.argv.slice(1).map(a => path.basename(a)), start:T0, end:0,
  boots:0, tLoad:0, bp:0, tBp:0, calls:{}, firstFail:null, fails:0, cpu:null, maxRSS:0, ctxs:0 };
let last = 0;
function flush(){ if(!DIR) return; st.end = Date.now(); st.cpu = process.cpuUsage(); try { st.maxRSS = process.resourceUsage().maxRSS; } catch(e){}
  try { fs.writeFileSync(path.join(DIR, process.pid + '.json'), JSON.stringify(st)); } catch(e){} }
const WR = ['buildProgram', 'refreshProgram', 'applySwapChoice', 'undoSwap', 'applySessionSwaps', 'applySwapPrefs', 'applyOverlays',
  'applyInjuryFilter', 'swapCandidates', 'auxSwapCandidates', 'doGenerate', 'renderToday', 'renderWeek', 'renderProgram', 'renderAll', 'boot'];
let inBp = 0;
function wrapCtx(ctx, IA){ st.ctxs++; WR.forEach(n => { let o; try { o = ctx[n]; } catch(e){ return; } if(typeof o !== 'function' || o.__sg) return;
  const f = n === 'buildProgram' ? function(){ st.calls[n] = (st.calls[n] || 0) + 1; if(inBp) return o.apply(this, arguments); inBp = 1; const t = hr();
      try { return o.apply(this, arguments); } finally { inBp = 0; st.tBp += hr() - t; st.bp++; const now = Date.now(); if(now - last > 2000){ last = now; flush(); } } }
    : function(){ st.calls[n] = (st.calls[n] || 0) + 1; return o.apply(this, arguments); };
  f.__sg = 1; try { ctx[n] = f; } catch(e){} if(IA && IA[n] === o) IA[n] = f; }); }
try { const H = require(HP); const ol = H.load;
  H.load = function(){ const t = hr(); const IA = ol.apply(this, arguments); st.tLoad += hr() - t; st.boots++; try { if(IA && IA.ctx) wrapCtx(IA.ctx, IA); } catch(e){} return IA; }; } catch(e){}
const ow = process.stdout.write.bind(process.stdout);
process.stdout.write = function(c){ try { const s = String(c); const m = s.match(/^FAIL /mg); if(m){ st.fails += m.length; if(!st.firstFail){ st.firstFail = { ms:Date.now() - T0, bp:st.bp, boots:st.boots,
  line:(s.split('\\n').find(l => l.startsWith('FAIL ')) || '').slice(0, 160) }; flush(); } } } catch(e){} return ow.apply(null, arguments); };
process.on('exit', flush);
`);
const sh = (c, o) => cp.execSync(c, Object.assign({ encoding:'utf8', maxBuffer:1 << 28 }, o || {}));
if(!fs.existsSync(BASE)) fs.writeFileSync(BASE, cp.execFileSync('git', ['-C', ROOT, 'show', '6ee30ea:index.html'], { maxBuffer:1 << 28 }));
const la = () => os.loadavg().map(x => x.toFixed(2)).join(' ');
function parseTime(err){ const g = re => { const m = re.exec(err); return m ? +m[1] : null; };
  return { wall:g(/([\d.]+) real/), user:g(/([\d.]+) user/), sys:g(/([\d.]+) sys/), maxrssB:g(/(\d+)\s+maximum resident set size/) }; }
function runGate(g, dir, cand, extraEnv){ fs.rmSync(dir, { recursive:true, force:true }); fs.mkdirSync(dir, { recursive:true });
  const env = Object.assign({}, process.env, { NODE_OPTIONS:'--require ' + PRELOAD, SG_DIR:dir, SG_HARNESS:path.join(ROOT, 'tests', 'harness.js') }, extraEnv || {});
  const before = la(), t = Date.now();
  const r = cp.spawnSync('/usr/bin/time', ['-l', 'node', path.join(ROOT, 'tests', 'gates', g + '.js'), cand, BASE], { env, encoding:'utf8', maxBuffer:1 << 28 });
  fs.writeFileSync(path.join(dir, 'stdout.txt'), r.stdout || ''); fs.writeFileSync(path.join(dir, 'stderr.txt'), r.stderr || '');
  const tm = parseTime(r.stderr || ''); const sum = (/^PASS (\d+) FAIL (\d+)/m.exec(r.stdout || '') || []).slice(1).join('/');
  const procs = fs.readdirSync(dir).filter(f => /^\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  return { g, loadBefore:before, wallMs:Date.now() - t, time:tm, summary:sum || 'NO SUMMARY', exit:r.status, procs }; }
function procStats(R){ const P = R.procs, root = P.find(p => p.ppid === process.pid) || P.reduce((a, b) => a.start < b.start ? a : b, P[0] || {});
  const kids = P.filter(p => p !== root);
  // peak concurrency of node processes, from each process's own wall interval
  const ev = []; P.forEach(p => { ev.push([p.start, 1]); ev.push([p.end, -1]); }); ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); let c = 0, pk = 0; ev.forEach(e => { c += e[1]; pk = Math.max(pk, c); });
  const tot = k => P.reduce((s, p) => s + (p[k] || 0), 0), cpu = p => p.cpu ? (p.cpu.user + p.cpu.system) / 1e6 : 0;
  const calls = {}; P.forEach(p => Object.keys(p.calls || {}).forEach(n => { calls[n] = (calls[n] || 0) + p.calls[n]; }));
  return { nproc:P.length, kids:kids.length, peakConc:pk, boots:tot('boots'), loadS:tot('tLoad') / 1e3, bp:tot('bp'), bpS:tot('tBp') / 1e3, cpuS:P.reduce((s, p) => s + cpu(p), 0),
    rootCpuS:cpu(root), maxRssMB:Math.max(...P.map(p => p.maxRSS || 0)) / 1024, kidWall:kids.map(p => (p.end - p.start) / 1e3).sort((a, b) => b - a), calls,
    firstFail:root.firstFail || null, rootWallS:root.end ? (root.end - root.start) / 1e3 : null }; }
const OUT = path.join(SG, 'alone.json');
if(PHASE === 'alone'){ const list = (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : SIX.concat(FOUR));
  const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for(const g of list){ const R = runGate(g, path.join(SG, 'alone', g), CAND); R.stats = procStats(R); delete R.procs; res[g] = R; fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
    console.log(g + ' load[' + R.loadBefore + '] wall ' + R.time.wall + ' s user ' + R.time.user + ' sys ' + R.time.sys + ' maxrss ' + (R.time.maxrssB / 1048576).toFixed(0) + ' MB | ' + R.summary + ' exit ' + R.exit
      + ' | procs ' + R.stats.nproc + ' peak ' + R.stats.peakConc + ' | boots ' + R.stats.boots + ' (' + R.stats.loadS.toFixed(1) + ' s) bp ' + R.stats.bp + ' (' + R.stats.bpS.toFixed(1) + ' s) cpu ' + R.stats.cpuS.toFixed(1) + ' s | calls ' + JSON.stringify(R.stats.calls)); } }
module.exports = { runGate, procStats, SIX, FOUR, CAND, BASE, PRELOAD };

// ── FUZZ: gatekeeper's V233 identity fuzz, re-run exactly as fuzzrun.sh ran it (4 shards of fuzz.js V232 base vs V233 cand,
//    plus the live control V230 vs V232 1/40 and the base self-check 1/40, all concurrent), then tests/fuzz.sh (8 shards).
if(PHASE === 'fuzz'){
  const GK = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/b82cbfbd-5831-4ae1-91fa-14396a9a31d5/scratchpad/gatekeeper_ship/fuzz.js';
  const FD = path.join(SG, 'fuzz'); fs.rmSync(FD, { recursive:true, force:true }); fs.mkdirSync(FD, { recursive:true });
  fs.copyFileSync(GK, path.join(FD, 'fuzz.js'));
  const V230 = path.join(FD, 'v230.html'); fs.writeFileSync(V230, cp.execFileSync('git', ['-C', ROOT, 'show', '71c76d8:index.html'], { maxBuffer:1 << 28 }));
  const jobs = [0, 1, 2, 3].map(s => ['shard' + s, [BASE, CAND, s, 4, path.join(FD, 'fuzz_' + s + '.json')]])
    .concat([['live', [V230, BASE, 0, 40, path.join(FD, 'fuzz_live.json')]], ['selfbase', [BASE, BASE, 1, 40, path.join(FD, 'fuzz_selfbase.json')]]]);
  const before = la(), t0 = Date.now();
  const ps = jobs.map(([nm, a]) => new Promise(fin => { const t = Date.now(); const ch = cp.spawn('/usr/bin/time', ['-l', 'node', path.join(FD, 'fuzz.js')].concat(a.map(String)));
    let err = '', out = ''; ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { err += d; });
    ch.on('close', code => fin({ nm, code, wallS:(Date.now() - t) / 1000, time:parseTime(err), out:out.trim().slice(-200) })); }));
  Promise.all(ps).then(rs => { const wall = (Date.now() - t0) / 1000;
    const sum = {}; [0, 1, 2, 3].forEach(s => { const j = JSON.parse(fs.readFileSync(path.join(FD, 'fuzz_' + s + '.json'), 'utf8')); Object.keys(j).forEach(k => { if(typeof j[k] === 'number') sum[k] = (k === 'total' ? j[k] : (sum[k] || 0) + j[k]); }); });
    console.log('GKFUZZ load[' + before + '] wall ' + wall.toFixed(1) + ' s (6 processes concurrent) | merged ' + JSON.stringify(sum));
    rs.forEach(r => console.log('  ' + r.nm + ' exit ' + r.code + ' wall ' + r.wallS.toFixed(1) + ' s user ' + r.time.user + ' sys ' + r.time.sys + ' maxrss ' + (r.time.maxrssB / 1048576).toFixed(0) + ' MB | ' + r.out));
    const lv = JSON.parse(fs.readFileSync(path.join(FD, 'fuzz_live.json'), 'utf8')), sb = JSON.parse(fs.readFileSync(path.join(FD, 'fuzz_selfbase.json'), 'utf8'));
    console.log('  live ' + JSON.stringify(lv).slice(0, 300) + '\n  selfbase ' + JSON.stringify(sb).slice(0, 300));
    // tests/fuzz.sh, the repo driver (full lattice, 8 shards)
    const FO = path.join(FD, 'fuzzsh'); fs.mkdirSync(FO, { recursive:true }); const b2 = la(), t2 = Date.now();
    const r = cp.spawnSync('/usr/bin/time', ['-l', 'bash', path.join(ROOT, 'tests', 'fuzz.sh'), CAND, BASE], { env:Object.assign({}, process.env, { FUZZ_OUT:FO }), encoding:'utf8', maxBuffer:1 << 28 });
    fs.writeFileSync(path.join(FD, 'fuzzsh.out'), (r.stdout || '') + '\n' + (r.stderr || ''));
    const tm = parseTime(r.stderr || '');
    console.log('FUZZSH load[' + b2 + '] exit ' + r.status + ' wall ' + ((Date.now() - t2) / 1000).toFixed(1) + ' s user ' + tm.user + ' sys ' + tm.sys + ' | tail: ' + (r.stdout || '').trim().split('\n').slice(-6).join(' // ')); }); }

// ── TRIP: for each sabotage mutation naming one of the six, the smallest prefix fraction F of the gate's own executed
//    population (gate order, per population) at which the mutant trips. Gate copies get one knob (SG_FRAC) at the
//    population site, anchor count==1 asserted; __dirname is pinned to tests/gates so harness/ROOT resolve as before.
//    Gates run as sabotage.py runs them: node <gate> <html> (no baseline). Trip at F<1 is DIFFERENTIAL against the clean
//    copy at the same F (row ordinal i FAILs in the mutant and not in clean, or FAILs in both with different text),
//    because truncation alone fails rows pinned to full-lattice counts. At F=1, trip = FAIL>0 with the clean copy at F=1
//    PASS-only (inertness control, run lazily).
if(PHASE === 'trip'){
  const FR = '(+(process.env.SG_FRAC || 1))', GD = path.join(ROOT, 'tests', 'gates');
  const KNOB = {
    g217_d160_dedupe_view:[['\nL.forEach(x => {', '\nL.splice(Math.ceil(L.length * ' + FR + '));\nL.forEach(x => {'], ['KL.forEach((x, idx) => {', 'KL.splice(Math.ceil(KL.length * ' + FR + ')); KL.forEach((x, idx) => {']],
    g222_d181_chain:[['function run(ck, mode, chains){', 'function run(ck, mode, chains){ chains = chains.slice(0, Math.ceil(chains.length * ' + FR + '));']],
    g227_d190_seam:[['function run(tg, ck, chains, withUndo){', 'function run(tg, ck, chains, withUndo){ chains = chains.slice(0, Math.ceil(chains.length * ' + FR + '));']],
    // cuecap: the knob sits on POP (not inside run()), because row b reads RES.C[ck][c.id] for every c of POP[ck]; a
    // run()-level slice crashed every cuecap run at F 0.02 in the first trip pass (clean and mutant alike).
    g227_d190_cuecap:[["\nconsole.log('  enumerated | ' + secs());", "\nObject.keys(POP).forEach(k => { POP[k] = POP[k].slice(0, Math.ceil(POP[k].length * " + FR + ")); });\nconsole.log('  enumerated | ' + secs());"]],
    g228_d192_undokey:[["for(const c of ALL) c.r = act('C', c);", "{ const by = {}; ALL.forEach(c => (by[c.pop] = by[c.pop] || []).push(c)); ALL.length = 0; Object.values(by).forEach(a => ALL.push(...a.slice(0, Math.ceil(a.length * " + FR + ")))); }\nfor(const c of ALL) c.r = act('C', c);"]],
    g230_d194_lens2:[['\nconst ENUM = {};', '\nJOBS.forEach(j => { if(j.cis) j.cis = j.cis.slice(0, Math.ceil(j.cis.length * ' + FR + ')); });\nconst ENUM = {};'], ['latShards(r.chains)', 'latShards(r.chains.slice(0, Math.ceil(r.chains.length * ' + FR + ')))']] };
  const TD = path.join(SG, process.env.SG_TRIP_DIR || 'trip'); fs.mkdirSync(path.join(TD, 'gates'), { recursive:true }); fs.mkdirSync(path.join(TD, 'mut'), { recursive:true }); fs.mkdirSync(path.join(TD, 'runs'), { recursive:true });
  const cnt = (s, a) => s.split(a).length - 1;
  for(const g of SIX){ let s = fs.readFileSync(path.join(GD, g + '.js'), 'utf8');
    for(const [a, b] of KNOB[g]){ if(cnt(s, a) !== 1){ console.log('KNOB NOT-APPLIED ' + g + ' anchor count ' + cnt(s, a)); process.exit(1); } s = s.replace(a, () => b); }
    s = s.split('__dirname').join(JSON.stringify(GD)); fs.writeFileSync(path.join(TD, 'gates', g + '.js'), s); }
  // mutations naming one of the six
  const html = fs.readFileSync(CAND, 'utf8'); const MUTS = [];
  fs.readdirSync(path.join(ROOT, 'tests', 'sabotage')).filter(f => f.endsWith('.json')).sort().forEach(f => {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'sabotage', f), 'utf8')); (Array.isArray(d) ? d : []).forEach((m, i) => {
      const g = SIX.find(x => String(m.gate || '').indexOf(x + '.js') >= 0); if(!g) return; if(process.env.SG_TRIP_GATES && process.env.SG_TRIP_GATES.split(',').indexOf(g) < 0) return;
      const id = f.replace('.json', '') + '_' + i; const n = cnt(html, m.anchor);
      if(n !== 1){ MUTS.push({ id, g, name:m.name, na:'anchor count ' + n }); return; }
      const mf = path.join(TD, 'mut', id + '.html'); fs.writeFileSync(mf, html.replace(m.anchor, () => m.replacement)); MUTS.push({ id, g, name:m.name, file:mf }); }); });
  const ORDER = SIX; MUTS.sort((a, b) => ORDER.indexOf(a.g) - ORDER.indexOf(b.g));
  console.log('mutations naming the six: ' + MUTS.length + ' (' + MUTS.filter(m => m.na).length + ' not applied) ' + JSON.stringify(SIX.map(g => g + ':' + MUTS.filter(m => m.g === g).length)));
  const LADDER = [0.02, 0.1, 0.3, 1], CAP_MS = +(process.env.SG_CAP_MIN || 88) * 60e3, T0 = Date.now(), SLOTS = 7;
  let used = 0; const waitq = [];
  const acquire = w => new Promise(res => { const go = () => { if(used + w <= SLOTS || used === 0){ used += w; res(); return true; } return false; }; if(!go()) waitq.push(go); });
  const release = w => { used -= w; for(let i = 0; i < waitq.length; i++) if(waitq[i]()){ waitq.splice(i, 1); i--; } };
  const rowsOf = out => out.split('\n').filter(l => /^(PASS|FAIL) /.test(l) && !/^PASS \d+ FAIL \d+\s*$/.test(l));
  async function runOne(g, file, F, tag){ const w = g === 'g230_d194_lens2' ? 4 : 1; await acquire(w);
    try { if(Date.now() - T0 > CAP_MS) return { capped:true };
      const dir = path.join(TD, 'runs', tag); fs.rmSync(dir, { recursive:true, force:true }); fs.mkdirSync(dir, { recursive:true });
      const env = Object.assign({}, process.env, { NODE_OPTIONS:'--require ' + PRELOAD, SG_DIR:dir, SG_HARNESS:path.join(ROOT, 'tests', 'harness.js'), SG_FRAC:String(F) });
      const t = Date.now(); const r = await new Promise(fin => { const ch = cp.spawn('node', [path.join(TD, 'gates', g + '.js'), file], { env }); let o = '';
        ch.stdout.on('data', d => { o += d; }); ch.stderr.on('data', d => { o += d; }); ch.on('close', code => fin({ code, out:o })); });
      fs.writeFileSync(path.join(dir, 'out.txt'), r.out);
      const m = /^PASS (\d+) FAIL (\d+)\s*$/m.exec(r.out); const procs = fs.readdirSync(dir).filter(f => /^\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
      return { wallS:(Date.now() - t) / 1000, sum:m ? [+m[1], +m[2]] : null, rows:rowsOf(r.out), bp:procs.reduce((s, p) => s + (p.bp || 0), 0), boots:procs.reduce((s, p) => s + (p.boots || 0), 0) }; }
    finally { release(w); } }
  const CLEAN = {}; const clean = (g, F) => CLEAN[g + F] || (CLEAN[g + F] = runOne(g, CAND, F, 'clean_' + g + '_' + F));
  const RES = path.join(SG, (process.env.SG_TRIP_DIR || 'trip') + '.json'); const out = {};
  async function ladder(m){ if(m.na){ out[m.id] = { g:m.g, name:m.name, result:'NOT-APPLIED ' + m.na }; return; }
    const steps = [];
    for(const F of LADDER){ const [c, r] = await Promise.all([clean(m.g, F), runOne(m.g, m.file, F, m.id + '_' + F)]);
      if(r.capped || c.capped){ steps.push({ F, capped:true }); out[m.id] = { g:m.g, name:m.name, steps, result:'NOT MEASURED (90-min cap) after F ' + (steps.length > 1 ? steps[steps.length - 2].F : 'none') }; return; }
      if(!r.sum){ steps.push({ F, crash:true, wallS:r.wallS }); out[m.id] = { g:m.g, name:m.name, steps, result:'CRASH at F ' + F }; return; }
      const trip = [];
      if(F < 1){ r.rows.forEach((l, i) => { const cl = c.rows[i] || ''; if(l.startsWith('FAIL') && (!cl.startsWith('FAIL') || cl !== l)) trip.push(i + ':' + l.slice(0, 110)); }); }
      else if(r.sum[1] > 0) r.rows.forEach((l, i) => { if(l.startsWith('FAIL')) trip.push(i + ':' + l.slice(0, 110)); });
      steps.push({ F, wallS:r.wallS, bp:r.bp, boots:r.boots, sum:r.sum, cleanSum:c.sum, cleanWallS:c.wallS, cleanBp:c.bp, trip:trip.slice(0, 4), nTrip:trip.length, rowsAligned:r.rows.length === c.rows.length });
      fs.writeFileSync(RES, JSON.stringify(out, null, 1));
      if(trip.length){ out[m.id] = { g:m.g, name:m.name, steps, result:'TRIPS at F ' + F }; return; } }
    out[m.id] = { g:m.g, name:m.name, steps, result:'SURVIVES at F 1' }; }
  Promise.all(MUTS.map(ladder)).then(() => { fs.writeFileSync(RES, JSON.stringify({ out, clean:Object.keys(CLEAN) }, null, 1));
    Promise.all(Object.values(CLEAN)).then(cs => { const ks = Object.keys(CLEAN); ks.forEach((k, i) => console.log('CLEAN ' + k + ' sum ' + JSON.stringify(cs[i].sum) + ' wall ' + (cs[i].wallS || 0).toFixed(1) + ' bp ' + cs[i].bp));
      Object.keys(out).forEach(k => { const o = out[k], s = (o.steps || []).slice(-1)[0] || {}; console.log(o.g.padEnd(22) + ' ' + k.padEnd(18) + ' ' + o.result + (s.trip ? ' | ' + s.nTrip + ' rows | bp ' + s.bp + ' | ' + s.wallS + ' s | ' + (s.trip[0] || '') : '')); });
      console.log('trip phase wall ' + ((Date.now() - T0) / 1000).toFixed(0) + ' s'); }); }); }

// ── PREDICT: gate.sh's gate phase on 8 cores / 8 xargs slots, from the alone-times. Measured alone: the 10 gates above.
//    Every other gate: its T1 time (measure_T1/v233_time.out, 8 in parallel under contention) x r, r = median alone/T1
//    over the 9 single-process gates measured alone. Model: processor sharing; gate i asks k_i cores (g230: POOL 4, else 1);
//    when the running gates ask for more than 8 cores every gate slows by 8/sum(k). Work = alone wall x k (variant W) or
//    alone CPU user+sys (variant C, counts GC threads). xargs keeps 8 gates running; order glob (today) or longest-first.
if(PHASE === 'predict'){
  const T1 = path.join(SG, '..', 'measure_T1', 'v233_time.out'); const t1 = {};
  fs.readFileSync(T1, 'utf8').split('\n').forEach(l => { const m = /^\s+([\d.]+)s\s+(\S+)\.js\s/.exec(l); if(m) t1[m[2]] = +m[1]; });
  const A = JSON.parse(fs.readFileSync(OUT, 'utf8')); const names = Object.keys(t1).sort();
  const ratios = Object.keys(A).filter(g => g !== 'g230_d194_lens2').map(g => A[g].time.wall / t1[g]).sort((a, b) => a - b); const r = ratios[ratios.length >> 1];
  console.log('T1 gates ' + names.length + ' | measured alone ' + Object.keys(A).length + ' | r (median alone/T1, n ' + ratios.length + ') ' + r.toFixed(3) + ' range ' + ratios[0].toFixed(3) + '..' + ratios[ratios.length - 1].toFixed(3));
  const job = (g, v) => { const a = A[g]; const k = g === 'g230_d194_lens2' ? 4 : 1;
    if(a){ const cpu = a.time.user + a.time.sys; return { g, k, w:v === 'C' ? cpu : a.time.wall * k, alone:a.time.wall }; }
    return { g, k, w:t1[g] * r * (v === 'C' ? 1.1 : 1), alone:t1[g] * r }; };
  function sim(order, v, cores, slots, override){ let q = order.map(g => Object.assign(job(g, v), override && override[g] ? override[g] : {})), run = [], t = 0, done = [];
    while(q.length || run.length){ while(run.length < slots && q.length) run.push(Object.assign({ st:t }, q.shift()));
      const K = run.reduce((s, j) => s + j.k, 0), f = Math.min(1, cores / K); let dt = Infinity; run.forEach(j => { dt = Math.min(dt, j.w / (j.k * f)); });
      t += dt; run.forEach(j => { j.w -= dt * j.k * f; }); run = run.filter(j => { if(j.w <= 1e-6){ done.push([j.g, j.st, t]); return false; } return true; }); }
    return { t, last:done.slice(-3).map(d => d[0] + '@' + d[2].toFixed(0)) }; }
  const sumAlone = names.reduce((s, g) => s + job(g, 'W').alone, 0);
  const lf = names.slice().sort((a, b) => job(b, 'W').alone - job(a, 'W').alone);
  console.log('sum of alone gate times ' + sumAlone.toFixed(0) + ' s (measured 10: ' + Object.keys(A).reduce((s, g) => s + A[g].time.wall, 0).toFixed(0) + ' s)');
  for(const v of ['W', 'C']) for(const [nm, ord] of [['glob', names], ['longest-first', lf]]){ const s = sim(ord, v, 8, 8); console.log('  ' + v + ' ' + nm.padEnd(14) + ' makespan ' + s.t.toFixed(0) + ' s (' + (s.t / 60).toFixed(1) + ' min) | last ' + s.last.join(', ')); }
  const cpuAll = names.reduce((s, g) => s + job(g, 'C').w, 0); console.log('  CPU lower bound (variant C work / 8 cores) ' + (cpuAll / 8).toFixed(0) + ' s; longest single gate alone ' + Math.max(...names.map(g => job(g, 'W').alone)).toFixed(0) + ' s');
  // g230 with its pool width changed (what a pool change would have to move): critical path = longest lat shard alone
  for(const P of [4, 6, 8]){ const s = sim(lf, 'W', 8, 8, { g230_d194_lens2:{ k:P, w:A.g230_d194_lens2.time.wall * 4 } }); console.log('  W longest-first, g230 POOL ' + P + ' (same work, ' + P + ' cores) makespan ' + s.t.toFixed(0) + ' s | last ' + s.last.join(', ')); } }
