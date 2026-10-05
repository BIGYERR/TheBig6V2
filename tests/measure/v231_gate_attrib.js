// v231_gate_attrib.js — MEASURE M17 (read-only). V231: attribute every figure M16 saw move on the whole-V231 surgery
// copy (coach1/t_ALL.html) to the part that moved it, and test each underlying card change against the ruling's diff
// classes (tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md).
//   TR=<dir holding t_V.html t_B.html t_A.html t_AB.html t_Ap.html t_Ar.html t_ABp.html t_W5.html t_FL.html t_PRE.html t_ALL.html>
//   OUT=<scratch dir> PART=uni|floor|cls|clsw|report node tests/measure/v231_gate_attrib.js
// Trees are coach's surgery copies (all ia-version 230; t_V == HEAD index.html). Gate runs per part tree are a separate
// shell step (measure4/wk.sh: node <gate> <tree> <base_v230>, from the repo; g199/g200_pull from M16's anchor-variant copy).
// ORACLES, never the suspect function:
//   classes  typed from the ruling's diff-class list (labels, names, detail shapes, plan/tier/focus scope), applied per
//            changed day along the slice chain V -> B -> ABp (A1..A4) -> PRE (+W5 = D196) -> ALL (+FL = D197).
//   B-1      "items present in V230's __BUDGET_OFF build": the V tree built with globalThis.__BUDGET_OFF (the ruling's own oracle).
//   universe the stored prog._swapUniverse (what swapUniverseFor hands swapCandidates) compared tree to tree by name.
//   floor(b) g215's own counterfactual (FB_FROM -> FB_TO written out of a copy of each tree): fired iff the digests differ.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const TR = process.env.TR, OUT = process.env.OUT, PART = process.env.PART || 'none';
if(!TR || !OUT) throw new Error('TR and OUT required');
const P = s => console.log(s), clone = x => JSON.parse(JSON.stringify(x)), DAYS = H.DAYS;
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const liveSecs = day => (day && !day.rest && day.sections || []).filter(s => (s.items || []).length);
const items = day => { const o = []; liveSecs(day).forEach(s => s.items.forEach(it => { if(it && it.name) o.push({ lab:clean(s.label || s.coreHeader || ''), n:clean(it.name), d:clean(it.detail || '') }); })); return o; };
const daySig = day => JSON.stringify(liveSecs(day).map(s => [s.label || '', s.coreHeader || '', s.rounds || '', !!s.superset, s.items.map(it => [clean(it.name), clean(it.detail || '')])]));
const card = day => liveSecs(day).map(s => clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: ' + s.items.map(it => clean(it.name) + ' ' + clean(it.detail || '')).join(' | ')).join('\n        ');
const TREES = {}; const T = t => TREES[t] || (TREES[t] = H.load(path.join(TR, 't_' + t + '.html')));
function build(t, cfg, flags){ const IA = T(t); (flags || []).forEach(f => IA.ctx[f] = true); let p; try { p = IA.buildProgram(clone(cfg)); } catch(e){ p = { __crash:String(e && e.message || e).slice(0, 200) }; } (flags || []).forEach(f => delete IA.ctx[f]); return p; }
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

// ── lattices (cfg.seed pinned everywhere) ──
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const TIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const EXPS = ['beginner','intermediate','advanced'], SEEDS = [87747, 76308, 1234, 4242], RESTS = [['sun','wed'],['sat','sun']];
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], ITIERS = ['workaround','protect'];
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:76308 };
function mk(f, fam, eq, ei, si, ri, inj){ const g = FAM[fam][(si + ei) % FAM[fam].length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
    eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
  if(inj) c.injury = inj; return c; }
function lattice(){ const out = [];
  // FULL (M15's, 3,024 uninjured)
  for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ei = 0; ei < 3; ei++) for(let si = 0; si < 4; si++) for(let ri = 0; ri < 2; ri++)
    out.push({ L:'FULL', f, fam, eq, exp:EXPS[ei], rest:RESTS[ri].join(','), inj:'none', c:mk(f, fam, eq, ei, si, ri, null) });
  // INJ (this pass): every plan x tier x focus x family, experience and seed rotated, both rests (3,024 injured)
  let k = 0; for(const r of REGS) for(const t of ITIERS) for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ri = 0; ri < 2; ri++){ const ei = k % 3, si = (k >> 1) % 4; k++;
    out.push({ L:'INJ', f, fam, eq, exp:EXPS[ei], rest:RESTS[ri].join(','), inj:r + '/' + t, c:mk(f, fam, eq, ei, si, ri, { region:r, tier:t }) }); }
  // L432 and LBW (M13/M14/M15 verbatim)
  for(const g of REGS) for(const t of ITIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', f:fo, fam:'none', eq, exp:ex, rest:'sun,wed', inj:g + '/' + t, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  for(const g of REGS) for(const t of ITIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', f:fo, fam:'none', eq, exp:ex, rest:rd.join(','), inj:g + '/' + t, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  return out; }

// ── day diff into ops ──
function ops(X, Y){ const a = items(X), b = items(Y); const key = i => i.lab + '\u0001' + i.n + '\u0001' + i.d;
  const m = {}; b.forEach(i => (m[key(i)] = m[key(i)] || []).push(i)); const rem = [];
  a.forEach(i => { const l = m[key(i)]; if(l && l.length) l.pop(); else rem.push(i); }); const add = []; Object.values(m).forEach(l => l.forEach(i => add.push(i)));
  const o = [];
  const take = (pred, kind) => { for(let i = rem.length - 1; i >= 0; i--){ const r = rem[i]; const j = add.findIndex(x => pred(r, x)); if(j >= 0){ o.push({ k:kind, r, a:add[j] }); add.splice(j, 1); rem.splice(i, 1); } } };
  take((r, x) => r.lab === x.lab && r.n === x.n, 'redetail'); take((r, x) => /^Main/.test(r.lab) && /^Main/.test(x.lab), 'rename');
  take((r, x) => r.n === x.n, 'relabel'); take((r, x) => r.lab === x.lab, 'rename');
  rem.forEach(r => o.push({ k:'drop', r })); add.forEach(x => o.push({ k:'add', a:x })); return o; }
const opStr = o => o.k + ' ' + (o.r ? '[' + o.r.lab + '] ' + o.r.n + ' ' + o.r.d : '') + (o.r && o.a ? ' -> ' : '') + (o.a ? '[' + o.a.lab + '] ' + o.a.n + ' ' + o.a.d : '');
const BRIDGE = 'Single-leg glute bridge', BEDHT = 'Single-leg hip thrust (shoulders on bed)';
const setsOf = d => { const m = String(d).match(/^(\d+)\s*(×|sets)/); return m ? +m[1] : null; };
// class of one op, given the step and the row; returns a class code or 'UNCLASSIFIED:<why>'
function classify(step, row, o, ctx){
  const eq = row.c.equipment, f = row.c.liftingFocus, inj = row.c.injury ? row.c.injury.region + '/' + row.c.injury.tier : 'none';
  const lab = (o.a || o.r).lab, labR = o.r ? o.r.lab : '', labA = o.a ? o.a.lab : '';
  const runner = !!(row.c.cardioTypes && row.c.cardioTypes.includes('run'));
  if(o.r && /^Calf|calves|carry/i.test(o.r.lab) && (o.k === 'drop' || o.k === 'rename')){ if(!(step === 'W5' && inj === 'knee/protect' && /^Calves/i.test(o.r.lab) && o.k === 'drop')) return 'UNCLASSIFIED:calf-or-carry-removed'; }
  if(step === 'B'){
    if(o.k === 'redetail' && o.r.n === 'Landmine rotational press' && /^3×15/.test(o.r.d) && /^2×15/.test(o.a.d)) return 'B-2';
    if(o.k === 'drop' || o.k === 'rename') return ctx.inBo(o.r) ? 'UNCLASSIFIED:B-removal(in budget-off)' : 'UNCLASSIFIED:B-removal';
    return ctx.inBo(o.a) ? 'B-1' : 'UNCLASSIFIED:B-not-in-budget-off';
  }
  if(step === 'A'){
    if(f !== 'support_prevention') return 'UNCLASSIFIED:A-outside-prevention';
    if(o.k === 'add' && labA === 'Leg circuit — runner armor') return 'A-1';
    if(/^Leg isolation/.test(lab)){ if(runner) return 'UNCLASSIFIED:A-2-on-runner-day';
      if(o.k === 'redetail' && setsOf(o.a.d) != null && setsOf(o.r.d) != null && setsOf(o.a.d) < setsOf(o.r.d)) return 'A-3';
      return 'A-2'; }
    return 'UNCLASSIFIED:A-other';
  }
  if(step === 'W5'){
    const PL = ['ankle/protect','knee/protect','lowback/protect','lowback/workaround'];
    if(eq !== 'bodyweight' || !PL.includes(inj)) return 'UNCLASSIFIED:D196-outside-scope';
    if(o.k === 'rename' && /^Main/.test(labR) && o.r.n === 'Burpees' && [BRIDGE, BEDHT].includes(o.a.n)) return o.r.d === o.a.d ? 'D196-1' : 'UNCLASSIFIED:D196-1-detail-changed';
    if(/^(ankle|knee)/.test(inj)){
      if(/^Leg superset [AB]|^Leg isolation/.test(labR || labA) && /^Leg superset [AB]|^Leg isolation/.test(labA || labR)) return 'D196-2';
      if(inj === 'knee/protect' && o.k === 'drop' && /^(Leg isolation|Calves)/.test(labR)) return 'D196-5';
      return 'UNCLASSIFIED:D196-ak-other';
    }
    if(o.k === 'add' && o.a.n === 'Burpees' && /^\d×10$/.test(o.a.d) && /^Pull/.test(labA)) return /^2×10$/.test(o.a.d) ? 'D196-3' : 'D196-3(dose N×10, N!=2)';
    if(o.k === 'relabel' && labR === 'Pull' && labA === 'Pull superset B') return 'D196-3';
    if(o.k === 'rename' && o.r.n === 'Burpees' && o.a.n === BEDHT && /^\d+ sets — RPE 7 \(leave 3 or more in reserve\)$/.test(o.a.d)) return 'D196-4';
    if(o.k === 'rename' && o.r.n === 'Burpees' && o.a.n === BEDHT && o.r.d === o.a.d) return 'D196-L(accessory landing, detail verbatim)';
    return 'UNCLASSIFIED:D196-lb-other';
  }
  if(step === 'FL'){
    if(eq !== 'bodyweight' || inj === 'none') return 'UNCLASSIFIED:D197-outside-scope';
    if(o.k === 'redetail' && /RPE 8/.test(o.r.d) && /RPE 7/.test(o.a.d) && !/RPE 8/.test(o.a.d)) return 'D197-1';
    return 'UNCLASSIFIED:D197-other';
  }
  return 'UNCLASSIFIED:?';
}
// row source: the lattice, or a gate's own cfgs captured by the observation hook on the ALL tree (ROWS=<json>)
const TAG = process.env.TAG || '';
function SRC(){ if(!process.env.ROWS) return lattice(); return JSON.parse(fs.readFileSync(process.env.ROWS, 'utf8')); }
if(PART === 'gprep'){ // HOOK=<dir of jsonl>; writes rows_<gate>.json (plain builds only, flags beyond __IA_HARNESS excluded), evenly capped at CAP
  const CAP = +(process.env.CAP || 1500);
  fs.readdirSync(process.env.HOOK).filter(f => /^g.*\.jsonl$/.test(f)).forEach(f => { const seen = new Set(), rows = []; let tot = 0, flagged = 0;
    fs.readFileSync(path.join(process.env.HOOK, f), 'utf8').split('\n').filter(Boolean).forEach(l => { let o; try { o = JSON.parse(l); } catch(e){ return; } tot++;
      if(o.fl.some(k => k !== '__IA_HARNESS')){ flagged++; return; } const k = JSON.stringify(o.cfg); if(seen.has(k)) return; seen.add(k); const c = o.cfg;
      const run = c.cardioGoals && c.cardioGoals.run && c.cardioGoals.run.id; const fam = !run ? 'none' : /run_(5k|10k|half|marathon)/.test(run) ? 'race' : 'test';
      rows.push({ L:f.replace('.jsonl', ''), f:c.liftingFocus, fam, eq:c.equipment, exp:c.experience, rest:(c.restDays || []).join(','), inj:c.injury ? c.injury.region + '/' + c.injury.tier : 'none', c }); });
    const step = Math.max(1, Math.ceil(rows.length / CAP)); const kept = rows.filter((_, i) => i % step === 0);
    fs.writeFileSync(path.join(OUT, 'rows_' + f.replace('.jsonl', '') + '.json'), JSON.stringify(kept));
    P(f + ': logged ' + tot + ', with test flags ' + flagged + ', unique plain cfgs ' + rows.length + ', kept ' + kept.length + ' (every ' + step + ')'); }); }
const eq0 = row => /^(home_basic|minimal|bodyweight)$/.test(row.eq) ? row.eq : 'loaded';
const CHAIN = [['B','V','B'], ['A','B','ABp'], ['W5','ABp','PRE'], ['FL','PRE','ALL']];

if(PART === 'clsw'){ // worker: SL=i/N
  const [si, sn] = process.env.SL.split('/').map(Number); const lat = SRC().filter((_, i) => i % sn === si);
  const R = { builds:0, crash:{}, days:{}, chg:{}, cls:{}, ex:{}, progs:{}, progChg:{}, vall:{}, vallDays:{}, ident:{ VV:0, VVn:0 } };
  const seg = row => ['ALL', 'L ' + row.L, 'FOCUS ' + row.f, 'TIER ' + row.eq, 'FAM ' + row.fam, 'INJ ' + row.inj, 'EXP ' + row.exp, 'REST ' + row.rest];
  lat.forEach((row, ix) => {
    const P0 = {}; for(const t of ['V','B','ABp','PRE','ALL']) P0[t] = build(t, row.c);
    if(ix % 50 === 0){ const v2 = build('V', row.c); R.ident.VVn++; if(H.progDigest(v2) === H.progDigest(P0.V)) R.ident.VV++; }
    const crashT = Object.keys(P0).filter(t => P0[t].__crash); if(crashT.length){ crashT.forEach(t => bump(R.crash, t)); return; }
    R.builds++;
    const Vbo = build('V', row.c, ['__BUDGET_OFF']); const ABL = {};
    const changedProg = { B:false, A:false, W5:false, FL:false }; let vallChanged = false;
    Object.keys(P0.V.weeks || {}).forEach(w => DAYS.forEach(d => {
      seg(row).forEach(s => bump(R.days, s));
      const sV = daySig(P0.V.weeks[w][d]), sALL = daySig(P0.ALL.weeks[w] && P0.ALL.weeks[w][d]);
      if(sV !== sALL){ vallChanged = true; seg(row).forEach(s => bump(R.vallDays, s)); }
      for(const [step, x, y] of CHAIN){
        const X = P0[x].weeks[w] && P0[x].weeks[w][d], Y = P0[y].weeks[w] && P0[y].weeks[w][d];
        if(daySig(X) === daySig(Y)) continue; changedProg[step] = true;
        const boItems = items(Vbo.weeks && Vbo.weeks[w] && Vbo.weeks[w][d]);
        const ctx = { inBo: it => boItems.some(z => z.n === it.n && z.d === it.d && z.lab === it.lab) || boItems.some(z => z.n === it.n && z.d === it.d) };
        const os = ops(X, Y); const cs = os.map(o => classify(step, row, o, ctx));
        os.forEach((o, i) => { if(!/^UNCLASSIFIED/.test(cs[i]) || !o.r || (o.k !== 'drop' && o.k !== 'rename')) return;
          const fl = {}; for(const F of ['__REGIONAL_OFF','__BUDGET_OFF']){ const kk = y + F; ABL[kk] = ABL[kk] || build(y, row.c, [F]); const Z = ABL[kk].weeks && ABL[kk].weeks[w] && ABL[kk].weeks[w][d]; fl[F] = items(Z).some(z => z.n === o.r.n); }
          const why = fl.__REGIONAL_OFF ? 'capRegionalFatigue' : fl.__BUDGET_OFF ? 'capSessionBudget' : 'other';
          bump(R.cls, step + '|' + cs[i] + '|PASS ' + why); bump(R.cls, step + '|' + cs[i] + '|LOST ' + o.r.lab.replace(/ — .*$/, '') + ': ' + o.r.n); });
        cs.forEach((c, i) => { if(c === 'A-1') bump(R.cls, step + '|A-1|NAME ' + os[i].a.n + (row.inj !== 'none' ? ' @' + row.inj : '') + ' [' + eq0(row) + ']'); });
        const dayCls = cs.some(c => /^UNCLASSIFIED/.test(c)) ? 'UNCLASSIFIED' : 'classified';
        seg(row).forEach(s => { bump(R.chg, step + '|' + s); bump(R.chg, step + '|' + dayCls + '|' + s); });
        cs.forEach((c, i) => { bump(R.cls, step + '|' + c); bump(R.cls, step + '|' + c + '|FOCUS ' + row.f); bump(R.cls, step + '|' + c + '|TIER ' + row.eq); bump(R.cls, step + '|' + c + '|INJ ' + row.inj); bump(R.cls, step + '|' + c + '|FAM ' + row.fam);
          const k = step + '|' + c; R.ex[k] = R.ex[k] || []; if(R.ex[k].length < 3) R.ex[k].push(row.L + ' ' + row.f + ' ' + row.fam + ' ' + row.eq + ' ' + row.inj + ' ' + row.exp + ' s' + row.c.seed + ' ' + row.rest + ' W' + w + ' ' + d + ' :: ' + opStr(os[i]) + (/^UNCLASSIFIED/.test(c) && R.ex[k].length === 1 ? '\n          ' + x + ': ' + card(X) + '\n          ' + y + ': ' + card(Y) : '')); });
      }
    }));
    seg(row).forEach(s => { bump(R.progs, s); if(vallChanged) bump(R.vall, s); Object.keys(changedProg).forEach(st => { if(changedProg[st]) bump(R.progChg, st + '|' + s); }); });
  });
  fs.writeFileSync(path.join(OUT, TAG + 'cls_' + si + '.json'), JSON.stringify(R)); P('worker ' + si + ' done ' + R.builds);
}

if(PART === 'cls'){ const N = +(process.env.N || 4); const kids = [];
  for(let i = 0; i < N; i++) kids.push(new Promise(res => { const k = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { PART:'clsw', SL:i + '/' + N }), stdio:['ignore', 'pipe', 'pipe'] });
    let e = ''; k.stderr.on('data', d => e += d); k.on('exit', c => { if(c) console.log('WORKER ' + i + ' EXIT ' + c + ' ' + e.slice(-500)); res(c); }); }));
  Promise.all(kids).then(cs => { if(cs.some(c => c)) { console.log('CLS FAILED'); process.exit(1); }
    const R = { builds:0, crash:{}, days:{}, chg:{}, cls:{}, ex:{}, progs:{}, progChg:{}, vall:{}, vallDays:{}, ident:{ VV:0, VVn:0 } };
    for(let i = 0; i < N; i++){ const r = JSON.parse(fs.readFileSync(path.join(OUT, TAG + 'cls_' + i + '.json'), 'utf8')); R.builds += r.builds; R.ident.VV += r.ident.VV; R.ident.VVn += r.ident.VVn;
      for(const k of ['crash','days','chg','cls','progs','progChg','vall','vallDays']) Object.entries(r[k]).forEach(([a, b]) => bump(R[k], a, b));
      Object.entries(r.ex).forEach(([a, b]) => { R.ex[a] = (R.ex[a] || []).concat(b).slice(0, 4); }); }
    P('==== CLS ' + (TAG || 'LATTICE') + ': ' + SRC().length + ' configs; built on all five trees ' + R.builds + '; crashes ' + JSON.stringify(R.crash) + '; V==V self-identity ' + R.ident.VV + '/' + R.ident.VVn);
    P('  V->ALL: programs changed ' + (R.vall.ALL || 0) + '/' + R.progs.ALL + '; days changed ' + (R.vallDays.ALL || 0) + '/' + R.days.ALL);
    for(const s of ['ALL','L FULL','L INJ','L L432','L LBW'].filter(s => R.progs[s])) P('    ' + s.padEnd(10) + ' progs ' + (R.vall[s] || 0) + '/' + (R.progs[s] || 0) + '  days ' + (R.vallDays[s] || 0) + '/' + (R.days[s] || 0));
    for(const [step] of CHAIN){ P('\n  STEP ' + step + ': programs changed ' + (R.progChg[step + '|ALL'] || 0) + '/' + R.progs.ALL + ', days changed ' + (R.chg[step + '|ALL'] || 0) + ' (classified ' + (R.chg[step + '|classified|ALL'] || 0) + ', UNCLASSIFIED ' + (R.chg[step + '|UNCLASSIFIED|ALL'] || 0) + ')');
      const segs = Object.keys(R.chg).filter(k => k.startsWith(step + '|') && k.split('|').length === 2).map(k => k.split('|')[1]).filter(s => s !== 'ALL' && !/^EXP|^REST/.test(s)).sort();
      P('    days changed by segment (changed/days in segment): ' + segs.map(s => s + ' ' + R.chg[step + '|' + s] + '/' + R.days[s] + (R.chg[step + '|UNCLASSIFIED|' + s] ? ' [U ' + R.chg[step + '|UNCLASSIFIED|' + s] + ']' : '')).join('; '));
      const cl = Object.keys(R.cls).filter(k => k.startsWith(step + '|') && k.split('|').length === 2).sort();
      cl.forEach(k => { const c = k.split('|')[1]; const sg = Object.keys(R.cls).filter(z => z.startsWith(k + '|')).map(z => z.slice(k.length + 1) + ' ' + R.cls[z]).filter(z => !/^FAM/.test(z) || true);
        P('    op ' + c.padEnd(48) + String(R.cls[k]).padStart(7) + '   ' + sg.join(', ')); (R.ex[k] || []).forEach(e => P('        e.g. ' + e)); }); }
  }); }

// ── PART uni: g210 O6u ──
if(PART === 'uni'){
  const MANNY = H.fixtures.HALF_MANNY; const tl = ['V','B','A','AB','Ap','Ar','ABp','W5','FL','PRE','ALL'];
  const MP = {}; tl.forEach(t => { MP[t] = build(t, MANNY); });
  const uV = new Set(MP.V._swapUniverse || []);
  P('==== U1. HALF_MANNY (seed ' + MANNY.seed + ') swap universe size per tree; names lost / gained vs V; digest');
  tl.forEach(t => { const u = new Set(MP[t]._swapUniverse || []); P('  ' + t.padEnd(4) + ' size ' + u.size + '  digest ' + H.progDigest(MP[t]) + '  lost ' + JSON.stringify([...uV].filter(n => !u.has(n))) + '  gained ' + JSON.stringify([...u].filter(n => !uV.has(n)))); });
  // where the lost names live on V: which pool of the engine source literally names them (grep, printed for the report)
  // per-day swap options, V vs ALL, every week and day, every item whose name is on both cards
  const sc = t => T(t).swapCandidates || T(t).eval('swapCandidates');
  const candNames = r => { const o = []; if(!r) return o; (Array.isArray(r) ? [r] : Object.values(r).filter(Array.isArray)).forEach(a => a.forEach(c => { const n = clean(typeof c === 'string' ? c : (c && c.name)); if(n) o.push(n); })); return o; };
  for(const t of ['A','ALL']){ let asked = 0, shrunk = 0, grew = 0; const lostBy = {}, days = {}, ex = [];
    Object.keys(MP.V.weeks).forEach(w => DAYS.forEach(d => { const a = MP.V.weeks[w][d], b = MP[t].weeks[w] && MP[t].weeks[w][d]; const nb = new Set(items(b).map(i => i.n));
      const seen = new Set(); items(a).forEach(i => { if(!nb.has(i.n) || seen.has(i.n)) return; seen.add(i.n); asked++;
        let ca, cb; try { ca = candNames(sc('V')(i.n, a, w, MP.V)); cb = candNames(sc(t)(i.n, b, w, MP[t])); } catch(e){ ca = ['CRASH']; cb = []; }
        const lost = ca.filter(n => !cb.includes(n)), gain = cb.filter(n => !ca.includes(n));
        if(lost.length){ shrunk++; bump(days, 'W' + w + ' ' + d); lost.forEach(n => bump(lostBy, i.lab + ' :: ' + i.n + ' -> ' + n)); if(ex.length < 6) ex.push('W' + w + ' ' + d + ' [' + i.lab + '] ' + i.n + ' loses ' + JSON.stringify(lost)); }
        if(gain.length) grew++; }); }));
    P('\n==== U2. HALF_MANNY swap options, V vs ' + t + ' (swapCandidates on the same name, same week/day): items asked ' + asked + '; lose >= 1 option ' + shrunk + '; gain >= 1 ' + grew);
    P('  days with a lost option (' + Object.keys(days).length + '): ' + Object.entries(days).map(([k, v]) => k + ' x' + v).join(', '));
    Object.entries(lostBy).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => P('    ' + String(v).padStart(4) + '  ' + k)); ex.forEach(e => P('  e.g. ' + e)); }
  // lattice sweep: universe size and names, V vs A vs W5 vs ALL; FULL prevention 432 + L432 prevention 144; control = everything else in FULL + L432
  const lat = lattice().filter(r => r.L === 'FULL' || r.L === 'L432');
  const S = {}; const nm = {};
  lat.forEach(row => { const cls = row.f === 'support_prevention' ? 'PREV' : 'CTRL'; const pv = build('V', row.c); if(pv.__crash) { bump(S, cls + '|crash'); return; } const uv = new Set(pv._swapUniverse || []);
    for(const t of ['A','W5','ALL']){ const pt = build(t, row.c); if(pt.__crash){ bump(S, cls + '|' + t + '|crash'); continue; } const ut = new Set(pt._swapUniverse || []);
      const lost = [...uv].filter(n => !ut.has(n)), gain = [...ut].filter(n => !uv.has(n)); bump(S, cls + '|' + t + '|n');
      if(lost.length || gain.length){ bump(S, cls + '|' + t + '|chg'); bump(S, cls + '|' + t + '|chg|' + row.eq); }
      bump(S, cls + '|' + t + '|n|' + row.eq);
      lost.forEach(n => bump(nm, cls + '|' + t + '|-' + n + '|' + row.eq)); gain.forEach(n => bump(nm, cls + '|' + t + '|+' + n + '|' + row.eq)); } });
  P('\n==== U3. swap-universe change by tree, prevention (FULL 432 + L432 144) vs control (FULL non-prevention 2,592 + L432 non-prevention 288)');
  for(const c of ['PREV','CTRL']) for(const t of ['A','W5','ALL']) P('  ' + c + ' ' + t.padEnd(3) + ' programs whose universe changed ' + (S[c + '|' + t + '|chg'] || 0) + '/' + (S[c + '|' + t + '|n'] || 0) + '  by tier: ' + TIERS.map(e => e + ' ' + (S[c + '|' + t + '|chg|' + e] || 0) + '/' + (S[c + '|' + t + '|n|' + e] || 0)).join(', ') + (S[c + '|' + t + '|crash'] ? ' crash ' + S[c + '|' + t + '|crash'] : ''));
  const byName = {}; Object.entries(nm).forEach(([k, v]) => { const [c, t, n, eq] = k.split('|'); const kk = c + ' ' + t + ' ' + n; byName[kk] = byName[kk] || {}; byName[kk][eq] = v; });
  Object.keys(byName).sort().forEach(k => P('    ' + k.padEnd(52) + ' ' + Object.entries(byName[k]).map(([e, v]) => e + ' ' + v).join(', ')));
}

// ── PART floor: g215 F2 ──
if(PART === 'floor'){
  const FB_FROM = "(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left", FB_TO = '_left';
  const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
  const KT = ['commercial','crossfit','home_full','home_basic','bodyweight'], KS = [76308, 1234];
  const mkK = (eq, gi, f, e, si) => { const [g, x] = GOALS[gi]; return { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) }, eventTargeted:false, liftingFocus:f, experience:e, ageBracket: si ? '55+' : '18-35', equipment:eq, unit:'lbs', restDays: si ? ['sat','sun'] : ['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:KS[si], injury:{ region:'knee', tier:'protect' } }; };
  const LK = []; for(const eq of KT) GOALS.forEach((_, gi) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => LK.push({ eq, f, e, gi, cfg:mkK(eq, gi, f, e, (gi + fi + ei) % 2) }))));
  const tl = ['V','B','A','AB','Ap','ABp','W5','FL','PRE','ALL']; const CF = {};
  tl.forEach(t => { const html = T(t).html; const c = html.split(FB_FROM).length - 1; if(c !== 1){ P('  ' + t + ' FB anchor count ' + c); return; } const f = path.join(OUT, 'cfB_' + t + '.html'); fs.writeFileSync(f, html.replace(FB_FROM, () => FB_TO)); CF[t] = H.load(f); });
  P('==== F1. g215 F2 replica: floor (b) fires iff the tree differs from the same tree with floor (b) written out (g215 FB_FROM -> FB_TO); knee/protect lattice ' + LK.length + ' (g215 LAT_K verbatim)');
  const fire = {}, n = {}, exs = {};
  LK.forEach(x => { bump(n, x.eq); tl.forEach(t => { if(!CF[t]) return; const p = build(t, x.cfg); let q; try { q = CF[t].buildProgram(clone(x.cfg)); } catch(e){ q = { __crash:1 }; }
    if(H.progDigest(p) !== H.progDigest(q)){ bump(fire, t + '|' + x.eq); bump(fire, t + '|' + x.eq + '|' + x.f); if(t === 'ALL'){ exs[x.eq] = exs[x.eq] || []; exs[x.eq].push(x); } } }); });
  tl.forEach(t => P('  ' + t.padEnd(4) + KT.map(e => e + ' ' + (fire[t + '|' + e] || 0) + '/' + n[e]).join(', ') + '   by focus on ALL-firing tiers: ' + KT.map(e => FOC.filter(f => fire[t + '|' + e + '|' + f]).map(f => e + ':' + f + ' ' + fire[t + '|' + e + '|' + f]).join(' ')).filter(Boolean).join(' ')));
  // what the athlete sees: V vs ALL and ALL vs ALL-floor-out on every firing config; card deltas tallied
  P('\n==== F2. firing configs on ALL: day-level effect, V vs ALL, and ALL vs ALL-without-floor (b)');
  const tally = {}; const shown = {};
  Object.entries(exs).forEach(([eq, xs]) => xs.forEach(x => { const pv = build('V', x.cfg), pa = build('ALL', x.cfg), pq = CF.ALL.buildProgram(clone(x.cfg)), pab = build('ABp', x.cfg), pw = build('W5', x.cfg);
    let dVA = 0, dAQ = 0, dVQ = 0; Object.keys(pa.weeks).forEach(w => DAYS.forEach(d => { const a = pa.weeks[w][d], v = pv.weeks[w] && pv.weeks[w][d], q = pq.weeks[w] && pq.weeks[w][d];
      if(daySig(v) !== daySig(a)){ dVA++; ops(v, a).forEach(o => bump(tally, eq + ' | V->ALL | ' + opStr(o).replace(/ \d+×\d+.*$/, '').slice(0, 140))); }
      if(daySig(q) !== daySig(a)){ dAQ++; ops(q, a).forEach(o => bump(tally, eq + ' | noFloor->ALL | ' + opStr(o).slice(0, 140))); if(!shown[eq] || shown[eq] < 1){ shown[eq] = (shown[eq] || 0) + 1;
        P('  ' + eq + ' ' + x.f + ' ' + x.e + ' ' + x.cfg.cardioGoals.run.id + ' s' + x.cfg.seed + ' W' + w + ' ' + d + '\n      V230      ' + card(v) + '\n      ALL       ' + card(a) + '\n      ALL-noFb  ' + card(q)); } }
      if(daySig(v) !== daySig(q)) dVQ++; }));
    bump(tally, eq + ' | programs'); bump(tally, eq + ' | days V->ALL', dVA); bump(tally, eq + ' | days noFloor->ALL', dAQ); bump(tally, eq + ' | days V->ALL-noFloor', dVQ);
    // hipExt selection itself, via the circuit 4th item or anywhere: is 'Bodyweight back extension' on any card V vs ALL
    const has = (p, nmx) => Object.keys(p.weeks).some(w => DAYS.some(d => items(p.weeks[w][d]).some(i => i.n === nmx)));
    if(has(pa, 'Bodyweight back extension') && !has(pv, 'Bodyweight back extension')) bump(tally, eq + ' | BW back extension newly printed'); }));
  Object.keys(tally).sort().forEach(k => P('    ' + String(tally[k]).padStart(5) + '  ' + k));
}
if(PART === 'none') P('set PART');

// ── PART probe: HALF_MANNY option loss split by cause; the D196 Primer rename count ──
if(PART === 'probe'){
  const MANNY = H.fixtures.HALF_MANNY; const pv = build('V', MANNY), pa = build('ALL', MANNY);
  const uA = new Set(pa._swapUniverse || []); const U3 = (pv._swapUniverse || []).filter(n => !uA.has(n));
  const sc = t => T(t).swapCandidates || T(t).eval('swapCandidates');
  const candNames = r => { const o = []; if(!r) return o; (Array.isArray(r) ? [r] : Object.values(r).filter(Array.isArray)).forEach(a => a.forEach(c => { const n = clean(typeof c === 'string' ? c : (c && c.name)); if(n) o.push(n); })); return o; };
  const rowsU = [], rowsC = [], gains = {}; let sameCard = 0, chCard = 0;
  Object.keys(pv.weeks).forEach(w => DAYS.forEach(d => { const a = pv.weeks[w][d], b = pa.weeks[w] && pa.weeks[w][d]; const same = daySig(a) === daySig(b); const nb = new Set(items(b).map(i => i.n)); const seen = new Set();
    items(a).forEach(i => { if(!nb.has(i.n) || seen.has(i.n)) return; seen.add(i.n); const ca = candNames(sc('V')(i.n, a, w, pv)), cb = candNames(sc('ALL')(i.n, b, w, pa));
      const lost = ca.filter(n => !cb.includes(n)); cb.filter(n => !ca.includes(n)).forEach(n => bump(gains, n));
      const lu = lost.filter(n => U3.includes(n)), lc = lost.filter(n => !U3.includes(n));
      if(lu.length){ rowsU.push('W' + w + ' ' + d + (same ? ' (card unchanged)' : ' (card changed)') + ' [' + i.lab + '] ' + i.n + ' loses ' + lu.join(', ')); same ? sameCard++ : chCard++; }
      if(lc.length) rowsC.push('W' + w + ' ' + d + ' [' + i.lab + '] ' + i.n + ' loses ' + lc.join(', ') + (items(b).some(z => lc.includes(z.n)) ? '  (now on the ALL card)' : '')); }); }));
  P('==== PR1. HALF_MANNY: options lost because the name left the universe (' + U3.join(', ') + '): ' + rowsU.length + ' item lists (' + sameCard + ' on days whose card is byte-identical V vs ALL, ' + chCard + ' on changed days)');
  rowsU.forEach(r => P('    ' + r));
  P('  options lost for another reason: ' + rowsC.length); rowsC.forEach(r => P('    ' + r));
  P('  options gained V -> ALL (name: lists): ' + JSON.stringify(gains));
  // were the three names ever on a HALF_MANNY card on V?  (on-card vs swap-only)
  const onCard = n => Object.keys(pv.weeks).filter(w => DAYS.some(d => items(pv.weeks[w][d]).some(i => i.n === n))).length;
  P('  weeks where each lost name is on a V230 card: ' + U3.map(n => n + ' ' + onCard(n)).join(', '));
}

/* RECORD of the shell steps run in the measure4 scratch (not executed by this file):
== wk.sh (per tree x gate worker; xargs -0 -n1 -P7 over 11 trees x 14 gates; Ar/PRE and late g230 skipped for time) ==
#!/usr/bin/env bash
set -- $1
t=$1; g=$2; mkdir -p /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t
case "$t" in Ar|PRE) echo "SKIPPED (time)" > /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out; echo EXIT skip >> /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out; exit 0;; esac
case "$t:$(basename $g)" in Ap:g230*|ABp:g230*|ALL:g230*) echo "SKIPPED (time)" > /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out; echo EXIT skip >> /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out; exit 0;; esac
cd /Users/CanasBangin/Desktop/TheBig6V2
if [ "$t" = "ALL" ]; then rm -f /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/hook/$(basename $g .js).jsonl; export HOOK_OUT=/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/hook/$(basename $g .js).jsonl NODE_OPTIONS="--require /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/hook/hook.js"; fi
node "$g" /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/trees/t_$t.html /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/base_v230.html > /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out 2>&1; echo "EXIT $?" >> /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/measure4/per_$t/$(basename $g).out; exit 0
== hook/hook.js (NODE_OPTIONS --require on the ALL tree: logs every buildProgram cfg, observes only; HALF_MANNY digest under the hook 2d35e8f743680cfa) ==
// M17 observation hook: wraps harness.load so every buildProgram on the ALL tree logs its cfg (deduped) and the ctx flags set.
const Module = require("module"), fs = require("fs"), path = require("path");
const OUTF = process.env.HOOK_OUT, MATCH = process.env.HOOK_MATCH || "t_ALL.html";
const seen = new Set(); const orig = Module.prototype.require;
Module.prototype.require = function(id){ const ex = orig.apply(this, arguments);
  try { if(ex && typeof ex.load === "function" && !ex.__m17 && /harness(\.js)?$/.test(id)){ const L = ex.load; ex.__m17 = true;
    ex.load = function(p, o){ const IA = L.apply(this, arguments); if(String(p).indexOf(MATCH) >= 0 && IA && IA.buildProgram){ const B = IA.buildProgram;
      IA.buildProgram = function(cfg){ try { const fl = Object.keys(IA.ctx).filter(k => /^__[A-Z]/.test(k) && IA.ctx[k] === true); const s = JSON.stringify({ fl, cfg }); if(!seen.has(s)){ seen.add(s); fs.appendFileSync(OUTF, s + "\n"); } } catch(e){} return B.apply(this, arguments); }; } return IA; }; } } catch(e){}
  return ex; };
== summ.js (per-tree row extractor) ==
const fs=require("fs"),path=require("path");const M4=process.argv[2];
const TREES=["V","B","A","AB","Ap","Ar","ABp","W5","FL","PRE","ALL"];
const ROWS=[["g193_pool_overlay",/stale debt|^PASS \d+ FAIL/],["g197d_d84_base",/^\s*(PASS|FAIL) E5/],["g199_deload_arbitration",/^\s*(PASS|FAIL|REFUSED) (A1|C1|C3|D2|E6|F2|F3|I2) /],["g200_pull_arbitration",/^\s*(REFUSED|FAIL)|^PASS \d+ FAIL/],
["g210_equipment_denials",/^\s*(PASS|FAIL) O6u/],["g215_d149_ghd",/^\s*(PASS|FAIL) F2 /],["g221_d177_swapfloor",/^\s*(PASS|FAIL) (G3a|G3c|G3e|G6a) /],["g225_d187_pacerate",/^\s*(PASS|FAIL) CONFINEMENT/],
["g226_d188_beginnermile",/^\s*(PASS|FAIL) (G2 .*digest for digest|G1h-P2b|G1h-P5)/],["g226_d189_pacedisclose",/^\s*(PASS|FAIL) G6b/],["g227_d190_cuecap",/^\s*(PASS|FAIL) row c-(UNINJ|DIGEST|MANNY)/],
["g229_d193_build",/^\s*(PASS|FAIL) row (b|d-BWSETS|j|f) /],["g229_d194_lens",/^\s*(PASS|FAIL) row p-(SWAP|AUX|ADD|UNSTAMPED)/],["g230_d194_lens2",/^\s*(PASS|FAIL|REFUSED) (row )?(d194-fixture|d193-k|d193-l|d194-postsweep)/]];
for(const [g,re] of ROWS){ console.log("\n######## "+g);
 for(const t of TREES){ const f=path.join(M4,"per_"+t,g+".js.out"); if(!fs.existsSync(f)){console.log("  "+t.padEnd(4)+" (not run yet)");continue;}
  const s=fs.readFileSync(f,"utf8"); const done=/^EXIT/m.test(s); const sm=(s.match(/^PASS \d+ FAIL \d+/m)||["NO SUMMARY"])[0];
  const ls=s.split("\n").filter(l=>re.test(l)).map(l=>{ const m=l.match(/^\s*(PASS|FAIL|REFUSED)\s+(\S+(?: \S+)?)/); const got=l.indexOf("(got ")>=0?l.slice(l.indexOf("(got ")).slice(0,230):l.slice(0,200); return (m?m[1]+" "+m[2]:"")+" :: "+got; });
  console.log("  "+t.padEnd(4)+" ["+sm+(done?"":" RUNNING")+"]"); ls.slice(0,8).forEach(l=>console.log("       "+l)); } }
*/
