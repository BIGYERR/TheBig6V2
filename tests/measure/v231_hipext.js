// v231_hipext.js — MEASURE M15 (before-picture, read-only), base V230 (HEAD 71c76d8).
// Question: D195 P-HIPEXT (ruled on V228, tests/measure/v228_rulings/d194_hipext_ruling.md) re-printed on V230,
//   its five "numbers measure must print before builder" from source-surgery copies of A and B, plus the
//   overlap with P-BWFALLBACK (bodyweightSweep / _bwFallback) and the injury plans.
//   SCR=<scratch> PART=prep|work|single|report [SL=i/N] node tests/measure/v231_hipext.js
// ORACLES: the hand C1..C5 name classifier copied verbatim from v228_hip_volume.js (never _pattern); the ruling's
//   own A/B text for the surgery; section labels the builder writes ('Leg circuit — runner armor', carry, calf);
//   recovery weeks = weeks where the __DELOAD_OFF counterfactual differs from the shipped build; the five-name
//   sweep table is read from today's engine maps ONLY because the question is "what does today's sweep do",
//   and it is cross-checked against the post-sweep cards.
// Trees (scratch only, index.html untouched): HOOK (V230 + global-gated logging hooks, proven neutral),
//   B (HOOK + _cost membership lens), A (HOOK + prevention pool subset + 4th circuit item), AB (both).
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PART = process.env.PART || 'none';
const P = s => console.log(s);
const clone = x => JSON.parse(JSON.stringify(x));
const DAYS = H.DAYS;
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
// ── hand classifier, verbatim from v228_hip_volume.js ──
const C4 = /stretch|90\/90 hip switch(?!.*weighted)|hip flexor|pigeon|worlds? greatest|frog stretch|hip circles|leg swings|hip opener|couch|lunge stretch|cossack.*(mobility)|hip cars/i;
const C1 = /hip thrust|glute bridge|frog pump|pull-?through|glute kickback|reverse hyper|hip extension machine/i;
const C3 = /clamshell|band(ed)? (side|lateral|monster)|monster walk|side steps|copenhagen|abduction|adduction|adductor|abductor|lateral lunge|side lunge|cossack|weighted 90\/90|hip airplane|fire hydrant|side.?lying (leg|hip)|lateral band|curtsy/i;
const C2 = /deadlift|\brdl\b|good morning|swing|back extension|glute-ham|\bghr\b|ghd|hip hinge|kettlebell clean|power clean|hang clean|snatch|nordic/i;
const C5 = /hip flexion|hip flexor (march|raise|lift)|psoas march/i;
const NOTE = /^(Taper|Race week)\b/;
function cls(nm){ if(/weighted 90\/90/i.test(nm)) return 3; if(C5.test(nm)) return 5; if(C4.test(nm)) return 4; if(C1.test(nm)) return 1; if(C3.test(nm)) return 3; if(C2.test(nm)) return 2; return 0; }
const CIRC = 'Leg circuit — runner armor', CALF = 'Calf — achilles armor';
const FALLBACK_NAMES = ['Burpees','Pushups (slow 3s eccentric)','Inverted row (under a table)','Squat (slow 3s tempo)','Single-leg Romanian deadlift (bodyweight)','Inverted row (supinated, under a table)','Prone Y-T-W raises'];
const A_NAMES = ['Single-leg hip thrust','Banded hip thrust','Single-leg glute bridge (weighted)','Single-leg glute bridge','Single-leg hip thrust (shoulders on bed)'];
const liveSecs = day => (day && !day.rest && day.sections || []).filter(s => (s.items || []).length);
const dayItems = day => { const o = []; liveSecs(day).forEach(s => s.items.forEach(it => { if(it && it.name) o.push({ lab:s.label || s.coreHeader || '', n:clean(it.name), d:clean(it.detail || '') }); })); return o; };
const daySig = day => JSON.stringify(liveSecs(day).map(s => [s.label || '', s.coreHeader || '', s.rounds || '', !!s.superset, s.items.map(it => [clean(it.name), clean(it.detail || '')])]));
const card = day => liveSecs(day).map(s => (s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: ' + s.items.map(it => clean(it.name) + ' ' + clean(it.detail || '')).join(' | ')).join('\n        ');
const circ = day => liveSecs(day).find(s => s.label === CIRC) || null;
const msetDiff = (a, b) => { const m = {}; a.forEach(x => m[x] = (m[x] || 0) + 1); const o = []; b.forEach(x => { if(m[x]) m[x]--; }); Object.keys(m).forEach(k => { for(let i = 0; i < m[k]; i++) o.push(k); }); return o; }; // a minus b
// ── lattices ──
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const TIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const EXPS = ['beginner','intermediate','advanced'], SEEDS = [87747, 76308, 1234, 4242], RESTS = [['sun','wed'],['sat','sun']];
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], ITIERS = ['workaround','protect'];
function lattice(){ const out = [];
  // FULL: v228_hip_volume.js section D lattice verbatim (3,024)
  for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ei = 0; ei < 3; ei++) for(let si = 0; si < SEEDS.length; si++) for(let ri = 0; ri < 2; ri++){
    const g = FAM[fam][(si + ei) % FAM[fam].length];
    const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
      eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
    out.push({ L:'FULL', f, fam, eq, exp:EXPS[ei], rest:RESTS[ri].join(','), inj:'none', c }); }
  // L432 and LBW: v230_postsweep_reject.js lattices() verbatim (cfg.injury direct = fixture presentation)
  for(const g of REGS) for(const t of ITIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', f:fo, fam:'none', eq, exp:ex, rest:'sun,wed', inj:g + '/' + t, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  for(const g of REGS) for(const t of ITIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', f:fo, fam:'none', eq, exp:ex, rest:rd.join(','), inj:g + '/' + t, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  return out; }
const base = { primaryPath:'event', cardioTypes:['run'], eventTargeted:true, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185 };
const PRT = Object.assign({}, base, { name:'PRT TING', liftingFocus:'support_athletic', raceDate:'2026-10-20', seed:87747,
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30' } } });
const MANNY_PASTED = Object.assign({}, base, { name:'THE HALF MANNY', liftingFocus:'support_prevention', raceDate:'2026-12-06', seed:76308,
  cardioGoals:{ run:{ id:'run_half', label:'Half Marathon', mileBestMins:'8', mileBestSecs:'0', baselineDist:'5', baseline:'5mi' } } });
// ── surgery ──
function rep(html, anchor, repl, tag){ const n = html.split(anchor).length - 1; P('  anchor ' + tag + ' count ' + n + (n === 1 ? '' : '  <-- MUST BE 1')); if(n !== 1) throw new Error('anchor ' + tag + ' count ' + n); return html.replace(anchor, () => repl); }
const AN = {
  H1: "const _isRunner = (cfg.cardioTypes||[]).indexOf('run') >= 0;",
  H2a: "_day.sections=capSessionBudget(_day.sections,_day.cardio);",
  H2b: "const cap=Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(cardio)*2));",
  H3: "  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');",
  H4: "applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)",
  B: "const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
  A1: "    :_bw(['Single-leg glute bridge','Bodyweight back extension','Single-leg hip thrust (shoulders on bed)','Nordic hamstring curl (anchored)'],['Banded hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension']);",
  A2: "          {name:ex.hinge[0],detail:'2×8'}]});",
};
const BS = "buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext})";
function hooks(h){
  h = rep(h, AN.H1, AN.H1 + " if(globalThis.__HIPLOG) globalThis.__HIPLOG.push({w:w, hipExt:ex.hipExt||null, prev:!!preventionSupport, pool:hipExtPool.slice(), hinge0:ex.hinge[0], lunge0:ex.lunge[0], kneeStab:ex.kneeStab});", 'H1 legs-site log');
  h = rep(h, AN.H2a, "_day.sections=(globalThis.__BDAY=w+'|'+_d, capSessionBudget(_day.sections,_day.cardio));", 'H2a budget day key');
  h = rep(h, AN.H2b, AN.H2b + " if(globalThis.__BLOG) globalThis.__BLOG.push({day:globalThis.__BDAY,t:_total(sections),cap:cap});", 'H2b budget view');
  h = rep(h, AN.H3, "  if(globalThis.__PRESWEEP&&cfg.equipment==='bodyweight') globalThis.__PRESWEEP.push(JSON.stringify(weeks));\n" + AN.H3, 'H3 pre-sweep snapshot');
  h = rep(h, AN.H4, "(globalThis.__IFW?globalThis.__IFW(" + BS + ",cfg,w,d,applyInjuryFilter):applyInjuryFilter(" + BS + ",cfg))", 'H4 injury filter wrap');
  return h; }
const surgB = h => rep(h, AN.B, "const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };", 'B _cost membership');
const surgA = h => { h = rep(h, AN.A1, AN.A1 + "\n  if(preventionSupport) hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through');", 'A1 prevention pool subset');
  return rep(h, AN.A2, "          {name:ex.hinge[0],detail:'2×8'}].concat((ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});", 'A2 fourth circuit item'); };
const TREES = { V:F('hook230.html'), B:F('B.html'), A:F('A.html'), AB:F('AB.html'), PRISTINE:F('v230.html') };
const IFWDEF = "globalThis.__IFWDEF=function(secs,cfg,w,d,f){var hx=null;(secs||[]).forEach(function(s,si){if(s&&s.label===" + JSON.stringify(CIRC) + "&&s.items&&s.items.length===4){hx={si:si,name:s.items[3].name,detail:s.items[3].detail};s.items[3]=Object.assign({},s.items[3],{__hx:1});}});"
  + "var out=f(secs,cfg);if(hx){var got=null,cn=null;(out||[]).forEach(function(s){if(s&&s.label===" + JSON.stringify(CIRC) + ")cn=(s.items||[]).map(function(i){return i.name+' '+(i.detail||'');});(s.items||[]).forEach(function(it){if(it&&it.__hx)got=it;});});"
  + "globalThis.__IFLOG.push({w:w,d:d,pre:hx,post:got?{name:got.name,detail:got.detail}:null,circ:cn});(out||[]).forEach(function(s){(s.items||[]).forEach(function(it){if(it&&it.__hx)delete it.__hx;});});}return out;};";
const _L = {}; function L(t){ if(!_L[t]){ _L[t] = H.load(TREES[t]); _L[t].eval(IFWDEF); } return _L[t]; }
function build(t, c, flags, ifw){ const X = L(t), E = s => X.eval(s);
  E('globalThis.__HIPLOG=[];globalThis.__BLOG=[];globalThis.__PRESWEEP=[];globalThis.__IFLOG=[];globalThis.__IFW=' + (ifw ? 'globalThis.__IFWDEF' : 'null') + ';');
  (flags || []).forEach(f => E('globalThis.' + f + '=true'));
  let p = null, err = null; try { p = X.buildProgram(clone(c)); } catch(e){ err = String(e && e.message || e); }
  (flags || []).forEach(f => E('globalThis.' + f + '=false'));
  const r = { p, err, hip:JSON.parse(E('JSON.stringify(globalThis.__HIPLOG)')), blog:JSON.parse(E('JSON.stringify(globalThis.__BLOG)')), pre:JSON.parse(E('JSON.stringify(globalThis.__PRESWEEP)')), ifl:JSON.parse(E('JSON.stringify(globalThis.__IFLOG)')) };
  E('globalThis.__HIPLOG=null;globalThis.__BLOG=null;globalThis.__PRESWEEP=null;globalThis.__IFLOG=null;globalThis.__IFW=null;');
  if(p) r.p = JSON.parse(JSON.stringify(p));
  return r; }
const wkeys = p => Object.keys((p && p.weeks) || {}).sort((a, b) => a - b);
const weekNames = (p, w) => { const s = new Set(); DAYS.forEach(d => dayItems(p.weeks[w] && p.weeks[w][d]).forEach(i => s.add(i.n))); return s; };
// ════════ PREP ════════
if(PART === 'prep'){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ver = (html.match(/name="ia-version" content="(\d+)"/) || [])[1]; P('index.html ia-version ' + ver); if(ver !== '230') throw new Error('expected 230');
  Object.values(TREES).forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
  fs.writeFileSync(TREES.PRISTINE, html);
  P('HOOK tree:'); const hk = hooks(html); fs.writeFileSync(TREES.V, hk);
  P('B tree:'); fs.writeFileSync(TREES.B, surgB(hk));
  P('A tree:'); const a = surgA(hk); fs.writeFileSync(TREES.A, a);
  P('AB tree (B on A):'); fs.writeFileSync(TREES.AB, surgB(a));
  // neutrality: pristine vs hook (logging ON) on fixture, PRT, pasted MANNY and a spread sample of the lattice
  const Xp = H.load(TREES.PRISTINE); const lat = lattice(); let same = 0, n = 0, selfSame = 0; const bad = [];
  const sample = [{ c:H.fixtures.HALF_MANNY }, { c:PRT }, { c:MANNY_PASTED }].concat(lat.filter((_, i) => i % 61 === 0));
  for(const s of sample){ const p0 = Xp.buildProgram(clone(s.c)), p0b = Xp.buildProgram(clone(s.c)); const r = build('V', s.c, [], true);
    n++; if(H.progDigest(p0) === H.progDigest(p0b)) selfSame++; if(H.progDigest(p0) === H.progDigest(r.p)) same++; else bad.push((s.L || 'named') + ' ' + (s.k || s.c.name)); }
  P('baseline == itself (pristine, built twice): ' + selfSame + '/' + n);
  P('HOOK (logging + IFW on) == pristine, progDigest: ' + same + '/' + n + (bad.length ? ' BAD ' + bad.slice(0, 5).join(' ; ') : ''));
  P('HALF_MANNY fixture digest pristine ' + H.progDigest(Xp.buildProgram(clone(H.fixtures.HALF_MANNY))) + ' (expect 0ac7da6b1691a8e1); HOOK ' + H.progDigest(build('V', H.fixtures.HALF_MANNY).p));
  // IFW neutrality on the A tree (the wrapper tags and untags the 4th item)
  let ifs = 0, ifn = 0; for(const s of lat.filter(x => x.f === 'support_prevention' && x.L !== 'LBW').filter((_, i) => i % 9 === 0)){ ifn++; if(H.progDigest(build('A', s.c, [], true).p) === H.progDigest(build('A', s.c, [], false).p)) ifs++; }
  P('A tree, IFW wrapper on == off: ' + ifs + '/' + ifn);
  const t0 = Date.now(); for(let i = 0; i < 10; i++) build('V', lat[i * 300].c); P('ms/build ~' + ((Date.now() - t0) / 10).toFixed(0));
  P('PREP DONE');
}
// ════════ WORK ════════
if(PART === 'work'){
  const [si, sn] = (process.env.SL || '0/1').split('/').map(Number);
  const lat = lattice().filter((_, i) => i % sn === si);
  const C = {}, EX = {}; const add = (m, segs, k = 1) => segs.forEach(s => { const key = m + '|' + s; C[key] = (C[key] || 0) + k; });
  const ex = (m, s) => { (EX[m] = EX[m] || []); if(EX[m].length < 12) EX[m].push(s); };
  const tally = (m, k) => { const key = 'T:' + m + '|' + k; C[key] = (C[key] || 0) + 1; };
  for(const row of lat){
    const segs = ['ALL', 'L ' + row.L, 'FOCUS ' + row.f, 'TIER ' + row.eq, 'FAM ' + row.fam, 'EXP ' + row.exp, 'REST ' + row.rest, 'INJ ' + row.inj, 'FT ' + row.L + '/' + row.f + '/' + row.eq];
    const prev = row.f === 'support_prevention';
    const R = { V:build('V', row.c), Vbo:build('V', row.c, ['__BUDGET_OFF']), B:build('B', row.c), A:build('A', row.c, [], true), AB:build('AB', row.c, [], true) };
    if(prev){ Object.assign(R, { Vdl:build('V', row.c, ['__DELOAD_OFF']), Areg:build('A', row.c, ['__REGIONAL_OFF']), Abo:build('A', row.c, ['__BUDGET_OFF']), ABreg:build('AB', row.c, ['__REGIONAL_OFF']), Adl:build('A', row.c, ['__DELOAD_OFF']) }); }
    const errs = Object.keys(R).filter(k => R[k].err); if(errs.length){ add('crash', segs); ex('crash', row.L + ' ' + row.inj + ' ' + row.eq + ' ' + row.f + ' ' + errs.map(k => k + ':' + R[k].err).join(';')); continue; }
    add('builds', segs); if(prev) add('prevBuilds', segs);
    if(si === 0 || Math.random() < 0.02){ add('selfChk', ['ALL']); if(H.progDigest(build('V', row.c).p) === H.progDigest(R.V.p)) add('selfSame', ['ALL']); }
    // which builds run bodyweightSweep (pre-sweep snapshot fires only inside the sweep's own predicate)
    if(R.V.pre.length) add('sweepRan', segs);
    // ── 0. C1 printed anywhere (builds >= 1 C1), per tree ──
    for(const t of ['V','Vbo','B','A','AB']){ let hit = 0, c1s = 0; wkeys(R[t].p).forEach(w => DAYS.forEach(d => dayItems(R[t].p.weeks[w][d]).forEach(i => { if(!NOTE.test(i.n) && cls(i.n) === 1){ hit = 1; c1s++; } }))); if(hit) add('c1hit.' + t, segs); add('c1items.' + t, segs, c1s); }
    // ── legs-site draw vs print (v228 method: drawn name printed anywhere that week) ──
    for(const t of ['V','Vbo','B','A','AB']){ for(const e of R[t].hip){ add('legs.' + t + '.calls', segs); if(e.prev){ add('legs.' + t + '.prev', segs); if(e.hipExt){ add('legs.' + t + '.prevDrawn', segs); if(weekNames(R[t].p, e.w).has(clean(e.hipExt))) add('legs.' + t + '.prevPrinted', segs); } continue; }
      if(!e.hipExt) continue; const c1 = cls(e.hipExt) === 1; add('legs.' + t + '.drawn', segs); if(c1) add('legs.' + t + '.drawnC1', segs);
      if(weekNames(R[t].p, e.w).has(clean(e.hipExt))){ add('legs.' + t + '.printed', segs); if(c1) add('legs.' + t + '.printedC1', segs); } } }
    // ── 2. program diffs ──
    function diff(tag, P0, P1, PBO){ let changed = 0;
      wkeys(P0).forEach(w => DAYS.forEach(d => { const a = P0.weeks[w][d], b = P1.weeks[w] && P1.weeks[w][d]; if(!a || a.rest || !liveSecs(a).length) return; add(tag + '.cells', segs);
        if(daySig(a) === daySig(b)) return; changed = 1; add(tag + '.cellChanged', segs); add(tag + '.cellChanged', ['WEEK ' + w]);
        const ia = dayItems(a), ib = dayItems(b); const na = ia.map(i => i.n), nb = ib.map(i => i.n);
        const rem = msetDiff(na, nb), addn = msetDiff(nb, na);
        rem.forEach(n => { add(tag + '.removed', segs); tally(tag + '.removed', n); ex(tag + '.removed', row.L + ' ' + row.inj + ' ' + row.eq + ' ' + row.f + ' ' + row.exp + ' s' + row.c.seed + ' W' + w + ' ' + d + ': ' + n); });
        const bo = PBO ? dayItems(PBO.weeks[w] && PBO.weeks[w][d]).map(i => i.n) : null;
        addn.forEach(n => { add(tag + '.added', segs); tally(tag + '.added', n); if(bo){ if(bo.includes(n)) add(tag + '.addedInBudgetOff', segs); else { add(tag + '.addedNovel', segs); ex(tag + '.addedNovel', row.L + ' ' + row.eq + ' ' + row.f + ' W' + w + ' ' + d + ': ' + n); } } });
        const da = {}; ia.forEach(i => (da[i.n] = da[i.n] || []).push(i.d)); ib.forEach(i => { if(da[i.n] && !da[i.n].includes(i.d) && !addn.includes(i.n)) { add(tag + '.redetail', segs); ex(tag + '.redetail', row.L + ' ' + row.eq + ' W' + w + ' ' + d + ': ' + i.n + ' [' + da[i.n].join('/') + '] -> [' + i.d + ']'); } });
        const la = liveSecs(a).map(s => s.label || ''), lb = liveSecs(b).map(s => s.label || ''); msetDiff(la, lb).forEach(l => { add(tag + '.secRemoved', segs); tally(tag + '.secRemoved', l); });
      }));
      add(tag + '.progs', segs); if(changed) add(tag + '.progChanged', segs); }
    diff('VB', R.V.p, R.B.p, R.Vbo.p); diff('VA', R.V.p, R.A.p, null); diff('BAB', R.B.p, R.AB.p, null); diff('VAB', R.V.p, R.AB.p, null);
    // ── 1 / 6 / 7. prevention leg days ──
    if(prev){
      const rec = new Set(wkeys(R.V.p).filter(w => DAYS.some(d => daySig(R.V.p.weeks[w][d]) !== daySig(R.Vdl.p.weeks[w] && R.Vdl.p.weeks[w][d]))));
      for(const [arm, ref, reg, bo, dl] of [['A','V','Areg','Abo','Adl'], ['AB','B','ABreg',null,null], ['AB','V',null,null,null]]){
        const tag = arm + 'vs' + ref; const PA = R[arm].p, PR = R[ref].p; const logW = {}; R[arm].hip.forEach(e => { if(e.prev) logW[e.w] = e; });
        const preW = R[arm].pre.length ? JSON.parse(R[arm].pre[R[arm].pre.length - 1]) : null;
        wkeys(PR).forEach(w => DAYS.forEach(d => { const dr = PR.weeks[w][d], da = PA.weeks[w] && PA.weeks[w][d]; const cr = circ(dr); if(!cr) return;
          const ws = segs.concat(['WEEK ' + w]); add(tag + '.legDays', ws); const e = logW[w] || null; const ca = circ(da);
          const newN = ca ? msetDiff(ca.items.map(i => clean(i.name)), cr.items.map(i => clean(i.name))) : [];
          const gained = !!(ca && ca.items.length > cr.items.length);
          if(gained){ add(tag + '.gained', ws); const it = ca.items[ca.items.length - 1]; tally(tag + '.grammar', row.eq + ' :: ' + clean(it.name) + ' ' + clean(it.detail)); tally(tag + '.newName', row.inj + ' ' + row.eq + ' :: ' + (e && e.hipExt) + ' -> ' + clean(it.name)); }
          else { const why = !e ? 'nolog' : !e.hipExt ? 'hipExt null' : e.hipExt === e.hinge0 ? 'hipExt==hinge0' : 'drawn, not on card'; add(tag + '.notGained', ws); tally(tag + '.notGainedWhy', row.inj + ' ' + row.eq + ' ' + row.exp + ' :: ' + why + (e && e.hipExt ? ' (' + e.hipExt + ')' : '') + ' pool=' + (e ? JSON.stringify(e.pool) : '-')); }
          if(rec.has(w)){ add(tag + '.recLegDays', ws); if(gained) add(tag + '.recGained', ws); }
          const hasSec = (day, re) => liveSecs(day).some(s => re.test(s.label || ''));
          if(hasSec(dr, /carry/i) && !hasSec(da, /carry/i)) { add(tag + '.carryLost', ws); ex(tag + '.carryLost', row.L + ' ' + row.inj + ' ' + row.eq + ' ' + row.fam + ' ' + row.exp + ' s' + row.c.seed + ' W' + w + ' ' + d); }
          if(hasSec(dr, /^Calf — achilles/) && !hasSec(da, /^Calf — achilles/)) { add(tag + '.calfLost', ws); ex(tag + '.calfLost', row.L + ' ' + row.eq + ' W' + w + ' ' + d); }
          const other = msetDiff(dayItems(dr).filter(i => !/carry/i.test(i.lab) && !/^Calf — achilles/.test(i.lab)).map(i => i.n), dayItems(da).map(i => i.n));
          other.forEach(n => { add(tag + '.otherRemoved', ws); tally(tag + '.otherRemoved', n); ex(tag + '.otherRemoved', row.L + ' ' + row.inj + ' ' + row.eq + ' W' + w + ' ' + d + ': ' + n); });
          if(gained && reg){ const g2 = circ(R[reg].p.weeks[w] && R[reg].p.weeks[w][d]); const nm = clean(ca.items[ca.items.length - 1].name); void g2; }
          if(e && e.hipExt && reg){ const has = P2 => { const c2 = circ(P2.weeks[w] && P2.weeks[w][d]); return !!(c2 && c2.items.length >= 4); };
            if(has(R[reg].p) && !gained){ add(tag + '.regionalHit', ws); ex(tag + '.regionalHit', row.L + ' ' + row.inj + ' ' + row.eq + ' W' + w + ' ' + d); }
            if(bo && has(R[bo].p) && !gained){ add(tag + '.budgetHit', ws); }
            if(dl && has(R[dl].p) && !gained){ add(tag + '.deloadHit', ws); } }
          // same-day doubles of the new item against the day's other C1 / identical names (final card)
          if(gained){ const nm = clean(ca.items[ca.items.length - 1].name); const others = dayItems(da).filter(i => !(i.lab === CIRC && i.n === nm)); const others2 = dayItems(da); let k = 0; others2.forEach(i => { if(i.n === nm) k++; });
            if(k > 1){ add(tag + '.dblExact', ws); ex(tag + '.dblExact', row.L + ' ' + row.inj + ' ' + row.eq + ' W' + w + ' ' + d + ': ' + nm); }
            const c1o = others.filter(i => cls(i.n) === 1); if(c1o.length){ add(tag + '.dblC1', ws); tally(tag + '.dblC1', row.inj + ' ' + row.eq + ' :: ' + nm + ' + ' + c1o.map(i => '[' + i.lab + '] ' + i.n).join(', ')); }
            if(cls(nm) === 1 && cls(clean(ca.items[2] ? ca.items[2].name : '')) === 1) add(tag + '.circHingeAlsoC1', ws); }
          // pre-sweep view (bodyweight): what the new item was before bodyweightSweep, and what it became
          if(preW && e && e.hipExt){ const cp = circ(preW[w] && preW[w][d]); if(cp){ const pi = cp.items.findIndex((it, ii) => ii >= 3 && it.name === e.hipExt); if(pi >= 0){ add(tag + '.sweepSeen', ws); const after = gained ? clean(ca.items[ca.items.length - 1].name) : '(absent after sweep)';
            tally(tag + '.sweepMap', e.hipExt + ' -> ' + after); if(FALLBACK_NAMES.includes(after) && after !== e.hipExt) { add(tag + '.sweepFallback', ws); ex(tag + '.sweepFallback', row.L + ' ' + row.inj + ' ' + row.exp + ' W' + w + ' ' + d + ' ' + e.hipExt + ' -> ' + after); }
            const preOthers = dayItems(preW[w][d]).filter(i => !(i.lab === CIRC && i.n === e.hipExt)); if(preOthers.some(i => i.n === e.hipExt)) add(tag + '.preDblExact', ws); if(preOthers.some(i => cls(i.n) === 1)) { add(tag + '.preDblC1', ws); tally(tag + '.preDblC1', row.inj + ' :: ' + e.hipExt + ' + ' + preOthers.filter(i => cls(i.n) === 1).map(i => '[' + i.lab + '] ' + i.n).join(', ')); } } }
            // every circuit item the sweep renamed onto a fallback name (all positions), arm tree
            cp && cp.items.forEach((it, ii) => { const post = ca && ca.items[ii] ? clean(ca.items[ii].name) : null; if(post && post !== clean(it.name)) tally(tag + '.sweepCircAny', 'pos' + ii + ' ' + it.name + ' -> ' + post); }); }
        }));
        // injury filter on the 4th item (IFW log, arm trees only; ref V/B has no 4th item)
        if(tag !== 'ABvsV') R[arm].ifl.forEach(r => { const k = !r.post ? 'drop' : r.post.name !== r.pre.name ? 'rename' : r.post.detail !== r.pre.detail ? 'redetail' : 'kept'; add(tag + '.if.' + k, segs.concat(['WEEK ' + r.w])); add(tag + '.if.all', segs);
          if(k !== 'kept') tally(tag + '.if.' + k, row.inj + ' ' + row.eq + ' :: ' + r.pre.name + ' ' + r.pre.detail + ' -> ' + (r.post ? r.post.name + ' ' + r.post.detail : '(gone) circuit now: ' + JSON.stringify(r.circ))); });
      }
      // non-prevention control rides in diff('VA') with FOCUS segments
    }
  }
  fs.writeFileSync(F('v231_w' + si + '.json'), JSON.stringify({ C, EX, n:lat.length }));
  P('WORK ' + si + '/' + sn + ' configs ' + lat.length + ' DONE');
}
// ════════ SINGLE ════════
if(PART === 'single'){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split('\n');
  P('==== 0a. RE-LOCATE on V230 (line numbers in index.html)');
  [['ex.hipExt draw (_slot)', /const hipExtSel= hipExtPool\.length/], ['ex.hipExt assigned', /^\s*hipExt:\s*hipExtSel,/], ['hipExtPool decl', /let hipExtPool=hasBarbell/], ['hipExtBW decl', /const hipExtBW=_bw\(/],
   ['prevention branch (never reads ex.hipExt)', /if\(preventionSupport\)\{\s*$/], ['runner-armor circuit push', /label:'Leg circuit — runner armor'/], ['non-prevention Leg superset B reads ex.hipExt', /if\(ex\.hipExt\)\{/], ['hipExtBW reader (full-body lowerHipExt)', /pick\(hipExtBW/],
   ['preventionSupport decl', /const preventionSupport = /], ['capSessionBudget', /^function capSessionBudget/], ['_isHalf', /const _isHalf=/], ['_cost', /const _cost=it=>/], ['SESSION_SET_BUDGET', /^const SESSION_SET_BUDGET/], ['recoveryDeload', /^function recoveryDeload/], ['capRegionalFatigue', /^function capRegionalFatigue/],
   ['pass order (buildSections->applyInjuryFilter->recoveryDeload->capRegionalFatigue)', /sections:capRegionalFatigue\(/], ['capSessionBudget caller', /_day\.sections=capSessionBudget\(/], ['bodyweightSweep caller', /bodyweightSweep\(weeks, cfg\.experience/], ['bodyweightSweep def', /^function bodyweightSweep/],
   ['_BW_SUBS', /^const _BW_SUBS=/], ['_BW_GEAR', /^const _BW_GEAR=/], ['_bwFallback', /^function _bwFallback/], ['_bwFallback catch-all Burpees', /^\s*return 'Burpees';/], ['HIP-EXTENSION RESERVATION', /HIP-EXTENSION RESERVATION/], ['reservation filter _left', /const _left=hipExtPool\.filter/],
   ['substitute overlay patch (equipment)', /type:'substitute',from,to,patch:\{equipment/], ['applyOverlays', /^function applyOverlays/], ['_isHalf readers', /_isHalf\(/]].forEach(([k, re]) => { const ls = []; html.forEach((l, i) => { if(re.test(l)) ls.push(i + 1); }); P('  ' + k.padEnd(70) + ' :' + ls.join(', :')); });
  const bview = (r, w, d) => { const e = r.blog.filter(x => x.day === w + '|' + d); return e.length ? e.map(x => x.t + '/' + x.cap).join(',') : 'n/a'; };
  const R = {}; for(const t of ['V','B','A','AB']){ R[t] = { FIX:build(t, H.fixtures.HALF_MANNY), PAS:build(t, MANNY_PASTED), PRT:build(t, PRT) }; }
  R.V.PRTbo = build('V', PRT, ['__BUDGET_OFF']); R.V.FIXbo = build('V', H.fixtures.HALF_MANNY, ['__BUDGET_OFF']);
  P('\n==== 0b/5. HALF_MANNY digests (fixture): ' + ['V','B','A','AB'].map(t => t + '=' + H.progDigest(R[t].FIX.p)).join('  ') + '  | expect V=0ac7da6b1691a8e1; B==V byte-identical: ' + (JSON.stringify(R.V.FIX.p) === JSON.stringify(R.B.FIX.p)));
  P('  pasted MANNY (mile 8:00) digests: ' + ['V','B','A','AB'].map(t => t + '=' + H.progDigest(R[t].PAS.p)).join('  ') + ' | lift sequence fixture==pasted (V): ' + (JSON.stringify(wkeys(R.V.FIX.p).map(w => DAYS.map(d => dayItems(R.V.FIX.p.weeks[w][d]).map(i => i.n + i.d)))) === JSON.stringify(wkeys(R.V.PAS.p).map(w => DAYS.map(d => dayItems(R.V.PAS.p.weeks[w][d]).map(i => i.n + i.d))))));
  P('  HALF_MANNY hipExt draw per week (V hook log): ' + R.V.FIX.hip.map(e => 'W' + e.w + '=' + e.hipExt + (e.prev ? '' : '(nonprev)')).join(' ; '));
  P('  HALF_MANNY A-tree hipExt pool/draw: ' + R.A.FIX.hip.map(e => 'W' + e.w + '=' + e.hipExt + ' hinge0=' + e.hinge0 + ' pool=' + JSON.stringify(e.pool)).slice(0, 3).join(' ; ') + ' ...');
  P('\n==== 0c/5. HALF_MANNY fixture, every Tue W1..W' + wkeys(R.V.FIX.p).length + ': card per arm, budget view t/cap');
  wkeys(R.V.FIX.p).forEach(w => { const d = 'tue'; P('  W' + w + ' tue  [V ' + bview(R.V.FIX, w, d) + ' | B ' + bview(R.B.FIX, w, d) + ' | A ' + bview(R.A.FIX, w, d) + ' | AB ' + bview(R.AB.FIX, w, d) + ']  budgetOff==V: ' + (daySig(R.V.FIXbo.p.weeks[w][d]) === daySig(R.V.FIX.p.weeks[w][d])));
    P('    V   ' + card(R.V.FIX.p.weeks[w][d]));
    for(const t of ['B','A','AB']){ const s = daySig(R[t].FIX.p.weeks[w][d]) === daySig(R.V.FIX.p.weeks[w][d]); P('    ' + t.padEnd(3) + ' ' + (s ? '(identical to V)' : card(R[t].FIX.p.weeks[w][d]))); } });
  P('\n==== 0d/3. PRT TING (seed 87747): Tue budget views W1..W' + wkeys(R.V.PRT.p).length);
  wkeys(R.V.PRT.p).forEach(w => P('  W' + w + ' tue V ' + bview(R.V.PRT, w, 'tue') + ' | B ' + bview(R.B.PRT, w, 'tue') + ' | mon V ' + bview(R.V.PRT, w, 'mon') + ' B ' + bview(R.B.PRT, w, 'mon')));
  for(const [w, d] of [[9, 'tue'], [9, 'mon'], [1, 'mon'], [2, 'mon']]){ P('  PRT W' + w + ' ' + d + ':'); P('    V    ' + card(R.V.PRT.p.weeks[w][d])); P('    V-bo ' + card(R.V.PRTbo.p.weeks[w][d])); P('    B    ' + card(R.B.PRT.p.weeks[w][d])); P('    A==V ' + (daySig(R.A.PRT.p.weeks[w][d]) === daySig(R.V.PRT.p.weeks[w][d])) + ' AB==B ' + (daySig(R.AB.PRT.p.weeks[w][d]) === daySig(R.B.PRT.p.weeks[w][d]))); }
  P('  PRT hipExt draws (V): ' + R.V.PRT.hip.map(e => 'W' + e.w + '=' + e.hipExt).join(' ; '));
  P('  PRT whole-program day cells changed V->B: ' + (() => { let n = 0, t = 0; wkeys(R.V.PRT.p).forEach(w => DAYS.forEach(d => { t++; if(daySig(R.V.PRT.p.weeks[w][d]) !== daySig(R.B.PRT.p.weeks[w][d])) n++; })); return n + '/' + t; })());
  P('\n==== 6a. today\'s sweep on the five A-arm names (engine maps, V230)');
  const X = L('V'); A_NAMES.forEach(n => P('  ' + n.padEnd(42) + ' -> ' + X.eval('(function(n){return _BW_SUBS[n]?"_BW_SUBS: "+_BW_SUBS[n]:_BW_GEAR.test(n)?"_BW_GEAR hit ("+(n.match(_BW_GEAR)||[])[0]+") -> _bwFallback: "+_bwFallback(n):"no gear token: kept as is";})(' + JSON.stringify(n) + ')')));
  P('  EXLIB prehab pools (B membership): ' + X.eval('JSON.stringify({hip:EXLIB.hip_stability,knee:EXLIB.knee_stability,fa:EXLIB.foot_ankle,fabw:EXLIB.foot_ankle_bw})'));
  P('  newly half-priced by B (members _isHalf misses): ' + X.eval('(function(){var re=/carry|wall sit|\\bhold\\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i;return [].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw).filter(function(n,i,a){return a.indexOf(n)===i&&!re.test(n);}).join(" | ");})()'));
  P('SINGLE DONE');
}
// ════════ REPORT ════════
if(PART === 'report'){
  const files = fs.readdirSync(SCR).filter(f => /^v231_w\d+\.json$/.test(f)); const C = {}, EX = {}; let n = 0;
  files.forEach(f => { const j = JSON.parse(fs.readFileSync(F(f), 'utf8')); n += j.n; Object.entries(j.C).forEach(([k, v]) => C[k] = (C[k] || 0) + v); Object.entries(j.EX).forEach(([k, v]) => { EX[k] = (EX[k] || []).concat(v).slice(0, 12); }); });
  const g = (m, s) => C[m + '|' + s] || 0; const segsOf = pre => [...new Set(Object.keys(C).filter(k => !k.startsWith('T:')).map(k => k.split('|')[1]).filter(s => s.startsWith(pre)))].sort();
  const T = (m, top = 40) => Object.entries(C).filter(([k]) => k.startsWith('T:' + m + '|')).sort((a, b) => b[1] - a[1]).slice(0, top).map(([k, v]) => '      ' + v + '  ' + k.slice(('T:' + m + '|').length));
  P('workers ' + files.length + ' configs ' + n + ' | builds ok ' + g('builds', 'ALL') + ' crash ' + g('crash', 'ALL') + (EX.crash ? ' :: ' + EX.crash.join(' ; ') : '') + ' | self-identity ' + g('selfSame', 'ALL') + '/' + g('selfChk', 'ALL'));
  P('\n==== 6b. which builds ran bodyweightSweep (pre-sweep hook fires inside its predicate)'); segsOf('TIER').concat(segsOf('L ')).forEach(s => P('  ' + s.padEnd(22) + ' ' + g('sweepRan', s) + '/' + g('builds', s)));
  P('\n==== 0e. C1 printed anywhere: builds >= 1 C1 item, support_prevention FULL lattice, per tree (V230 / B / A / AB; v228 read 0/360 loaded, 34/72 bodyweight)');
  ['TIER commercial','TIER crossfit','TIER home_full','TIER home_basic','TIER minimal','TIER bodyweight'].forEach(s => { const k = x => C[x + '|' + s + '#prev'] ; void k; });
  // segmented prevention counts are recomputed from FOCUS x TIER via the legs table below; per-tree hit rows by FOCUS:
  P('  FOCUS support_prevention (432 FULL + 144 L432): ' + ['V','Vbo','B','A','AB'].map(t => t + ' ' + g('c1hit.' + t, 'FOCUS support_prevention') + '/' + g('builds', 'FOCUS support_prevention')).join(' | '));
  segsOf('FT FULL/support_prevention').forEach(s => P('  ' + s.padEnd(44) + ['V','Vbo','B','A','AB'].map(t => t + ' ' + g('c1hit.' + t, s) + '/' + g('builds', s)).join(' | ')));
  P('  FULL sun,wed-equivalent legs row: see L FULL (both rests); v228 C2 used sun/wed only');
  P('  ALL: ' + ['V','Vbo','B','A','AB'].map(t => t + ' ' + g('c1hit.' + t, 'ALL') + '/' + g('builds', 'ALL') + ' (items ' + g('c1items.' + t, 'ALL') + ')').join(' | '));
  P('\n==== 0f/2. legs-site hipExt draw vs print (v228 method). Segments; v228 ALL(sun/wed FULL) read C1 printed 3,551/6,298, budget-off 4,969');
  const LS = s => ['V','Vbo','B','A','AB'].map(t => t + ' C1 ' + g('legs.' + t + '.printedC1', s) + '/' + g('legs.' + t + '.drawnC1', s) + ' all ' + g('legs.' + t + '.printed', s) + '/' + g('legs.' + t + '.drawn', s) + ' prevSlot ' + g('legs.' + t + '.prevPrinted', s) + '/' + g('legs.' + t + '.prevDrawn', s) + '(of ' + g('legs.' + t + '.prev', s) + ')').join(' || ');
  ['ALL','L FULL','REST sun,wed','L L432','L LBW'].concat(segsOf('TIER'), segsOf('FOCUS'), segsOf('FAM')).forEach(s => P('  ' + s.padEnd(26) + LS(s)));
  P('  NOTE: "REST sun,wed" mixes FULL + injured lattices; the v228-comparable row is printed by the report for L FULL x sun,wed below.');
  P('\n==== 2. diffs (cells = non-rest lifting days of the reference). tags: VB = B alone on V230, VA = A alone, BAB = A on top of B, VAB = both');
  for(const t of ['VB','VA','BAB','VAB']){ P('  -- ' + t + ' --');
    ['ALL','L FULL','L L432','L LBW'].concat(segsOf('FOCUS'), segsOf('TIER'), segsOf('FAM')).forEach(s => P('    ' + s.padEnd(26) + ' progs changed ' + g(t + '.progChanged', s) + '/' + g(t + '.progs', s) + ' | cells changed ' + g(t + '.cellChanged', s) + '/' + g(t + '.cells', s) + ' | items removed ' + g(t + '.removed', s) + ' added ' + g(t + '.added', s) + (t === 'VB' ? ' (in V budget-off ' + g(t + '.addedInBudgetOff', s) + ', novel ' + g(t + '.addedNovel', s) + ')' : '') + ' redetail ' + g(t + '.redetail', s) + ' sections removed ' + g(t + '.secRemoved', s)));
    P('    by week (cells changed): ' + segsOf('WEEK').sort((a, b) => +a.slice(5) - +b.slice(5)).map(s => s.slice(5) + ':' + g(t + '.cellChanged', s)).join(' '));
    P('    top added:'); T(t + '.added', 15).forEach(x => P(x)); P('    top removed:'); T(t + '.removed', 15).forEach(x => P(x)); P('    sections removed:'); T(t + '.secRemoved', 10).forEach(x => P(x));
    if(EX[t + '.removed']) P('    removed ex: ' + EX[t + '.removed'].join('\n                ')); if(EX[t + '.addedNovel']) P('    novel ex: ' + EX[t + '.addedNovel'].join(' ; ')); if(EX[t + '.redetail']) P('    redetail ex: ' + EX[t + '.redetail'].slice(0, 6).join(' ; ')); }
  P('\n==== 1/6/7. prevention leg days (reference day carries ' + CIRC + ')');
  for(const t of ['AvsV','ABvsB','ABvsV']){ P('  -- ' + t + ' --');
    const row = s => 'legDays ' + g(t + '.legDays', s) + ' | gained ' + g(t + '.gained', s) + ' notGained ' + g(t + '.notGained', s) + ' | carryLost ' + g(t + '.carryLost', s) + ' calfLost ' + g(t + '.calfLost', s) + ' otherRemoved ' + g(t + '.otherRemoved', s) + ' | recovery legDays ' + g(t + '.recLegDays', s) + ' gained ' + g(t + '.recGained', s) + ' | regionalHit ' + g(t + '.regionalHit', s) + ' budgetHit ' + g(t + '.budgetHit', s) + ' deloadHit ' + g(t + '.deloadHit', s) + ' | dblExact ' + g(t + '.dblExact', s) + ' dblC1 ' + g(t + '.dblC1', s) + ' | sweepSeen ' + g(t + '.sweepSeen', s) + ' sweepFallback ' + g(t + '.sweepFallback', s) + ' preDblExact ' + g(t + '.preDblExact', s) + ' preDblC1 ' + g(t + '.preDblC1', s) + ' | IF kept/redetail/rename/drop ' + ['kept','redetail','rename','drop'].map(k => g(t + '.if.' + k, s)).join('/') + ' of ' + g(t + '.if.all', s);
    ['ALL','L FULL','L L432'].concat(segsOf('TIER'), segsOf('FAM'), segsOf('EXP'), segsOf('INJ')).forEach(s => { if(g(t + '.legDays', s)) P('    ' + s.padEnd(26) + row(s)); });
    P('    by week: ' + segsOf('WEEK').sort((a, b) => +a.slice(5) - +b.slice(5)).map(s => s.slice(5) + ':' + g(t + '.gained', s) + '/' + g(t + '.legDays', s) + (g(t + '.carryLost', s) ? ' c-' + g(t + '.carryLost', s) : '') + (g(t + '.calfLost', s) ? ' k-' + g(t + '.calfLost', s) : '')).join('  '));
    P('    printed grammar of the new item (tier :: name detail):'); T(t + '.grammar', 20).forEach(x => P(x));
    P('    drawn -> printed name (inj tier):'); T(t + '.newName', 30).forEach(x => P(x));
    P('    not gained, why:'); T(t + '.notGainedWhy', 30).forEach(x => P(x));
    P('    other removed:'); T(t + '.otherRemoved', 12).forEach(x => P(x)); if(EX[t + '.otherRemoved']) P('      ex: ' + EX[t + '.otherRemoved'].slice(0, 8).join(' ; '));
    if(EX[t + '.carryLost']) P('    carryLost ex: ' + EX[t + '.carryLost'].join(' ; ')); if(EX[t + '.calfLost']) P('    calfLost ex: ' + EX[t + '.calfLost'].join(' ; ')); if(EX[t + '.regionalHit']) P('    regionalHit ex: ' + EX[t + '.regionalHit'].join(' ; '));
    P('    same-day C1 doubles (final card):'); T(t + '.dblC1', 20).forEach(x => P(x)); if(EX[t + '.dblExact']) P('    exact-name doubles ex: ' + EX[t + '.dblExact'].join(' ; '));
    P('    circuit hinge also C1 (two glute-max items in the round): ' + g(t + '.circHingeAlsoC1', 'ALL'));
    P('    sweep map of the new item (pre -> post):'); T(t + '.sweepMap', 20).forEach(x => P(x)); if(EX[t + '.sweepFallback']) P('    sweepFallback ex: ' + EX[t + '.sweepFallback'].join(' ; '));
    P('    pre-sweep C1 doubles:'); T(t + '.preDblC1', 12).forEach(x => P(x));
    P('    any circuit item renamed by the sweep (pos, pre -> post):'); T(t + '.sweepCircAny', 20).forEach(x => P(x));
    P('    injury filter on the new item (non-kept):'); ['redetail','rename','drop'].forEach(k => T(t + '.if.' + k, 20).forEach(x => P('   ' + k + ' ' + x))); }
  P('REPORT DONE');
}
// ════════ PROBE (attribution of what A displaces; knee/protect gap; v228-comparable legs row; B==V JSON key) ════════
if(PART === 'probe'){
  const lat = lattice();
  // (g) B vs V on HALF_MANNY: which keys differ in raw JSON while progDigest agrees
  { const a = build('V', H.fixtures.HALF_MANNY).p, b = build('B', H.fixtures.HALF_MANNY).p; const dk = Object.keys(Object.assign({}, a, b)).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    const a2 = build('V', H.fixtures.HALF_MANNY).p; const dk2 = Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(a2[k]));
    P('==== P1. HALF_MANNY raw JSON keys differing B vs V: ' + JSON.stringify(dk) + ' | V vs V rebuilt: ' + JSON.stringify(dk2) + ' | weeks identical B vs V: ' + (JSON.stringify(a.weeks) === JSON.stringify(b.weeks))); }
  // (a) MANNY A-arm calf: which pass removes it
  { const R = { V:build('V', H.fixtures.HALF_MANNY), A:build('A', H.fixtures.HALF_MANNY), Areg:build('A', H.fixtures.HALF_MANNY, ['__REGIONAL_OFF']), Abo:build('A', H.fixtures.HALF_MANNY, ['__BUDGET_OFF']), Vreg:build('V', H.fixtures.HALF_MANNY, ['__REGIONAL_OFF']), AB:build('AB', H.fixtures.HALF_MANNY), ABreg:build('AB', H.fixtures.HALF_MANNY, ['__REGIONAL_OFF']) };
    const has = (r, w) => liveSecs(r.p.weeks[w].tue).some(s => s.label === CALF);
    P('\n==== P2. HALF_MANNY Tue calf line present (W1..W12): ' + ['V','Vreg','A','Areg','Abo','AB','ABreg'].map(t => t + ' ' + [1,2,3,4,5,6,7,8,9,10,11,12].map(w => has(R[t], w) ? 'Y' : '-').join('')).join(' | '));
    P('  W6 tue A with __REGIONAL_OFF:\n        ' + card(R.Areg.p.weeks[6].tue)); }
  // (b) prevention FULL + L432: attribute every section the A arm loses vs V (same day) to a pass by ablation
  const att = {}, attEx = {}; let days = 0;
  const T = (k) => att[k] = (att[k] || 0) + 1;
  for(const row of lat.filter(r => r.f === 'support_prevention')){
    const V = build('V', row.c).p, A = build('A', row.c).p, Areg = build('A', row.c, ['__REGIONAL_OFF']).p, Abo = build('A', row.c, ['__BUDGET_OFF']).p, Vreg = build('V', row.c, ['__REGIONAL_OFF']).p;
    const AB = build('AB', row.c).p, ABreg = build('AB', row.c, ['__REGIONAL_OFF']).p, B = build('B', row.c).p;
    wkeys(V).forEach(w => DAYS.forEach(d => { const lv = liveSecs(V.weeks[w][d]).map(s => s.label || ''); if(!lv.length) return; days++;
      for(const [arm, ref, reg, bo] of [['A', V, Areg, Abo], ['AB', B, ABreg, null]]){ const P1 = arm === 'A' ? A : AB; const la = liveSecs(P1.weeks[w][d]).map(s => s.label || ''); const lr = liveSecs(ref.weeks[w][d]).map(s => s.label || '');
        msetDiff(lr, la).forEach(l => { const inReg = liveSecs(reg.weeks[w][d]).some(s => s.label === l), inBo = bo && liveSecs(bo.weeks[w][d]).some(s => s.label === l);
          const why = inReg ? 'capRegionalFatigue' : inBo ? 'capSessionBudget' : 'other'; T(arm + ' | ' + l + ' | ' + why + ' | ' + row.L + ' ' + row.fam); if(why === 'other') { (attEx[arm] = attEx[arm] || []); if(attEx[arm].length < 6) attEx[arm].push(row.L + ' ' + row.inj + ' ' + row.eq + ' ' + row.exp + ' s' + row.c.seed + ' W' + w + ' ' + d + ' lost ' + l); } }); }
      // whole-day item-level: calf/leg-isolation items lost by A that Vreg also... (controls: does V itself lose them with regional ON?)
    }));
  }
  P('\n==== P3. sections the arm loses vs its reference (A vs V, AB vs B), attributed by ablation (present with __REGIONAL_OFF => capRegionalFatigue; else present with __BUDGET_OFF => capSessionBudget), over ' + days + ' prevention day cells (576 builds: 432 FULL + 144 L432)');
  Object.entries(att).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => P('  ' + String(v).padStart(5) + '  ' + k)); Object.entries(attEx).forEach(([k, v]) => P('  other ex ' + k + ': ' + v.join(' ; ')));
  // (c) knee/protect and lowback: what the A tree drew and built
  for(const k of [['knee/protect','commercial','beginner'], ['knee/protect','bodyweight','intermediate'], ['lowback/workaround','commercial','beginner'], ['lowback/protect','bodyweight','beginner'], ['ankle/protect','commercial','beginner'], ['hip/protect','commercial','beginner']]){
    const row = lat.find(r => r.L === 'L432' && r.inj === k[0] && r.eq === k[1] && r.exp === k[2] && r.f === 'support_prevention');
    const rA = build('A', row.c, [], true), rV = build('V', row.c), rAreg = build('A', row.c, ['__REGIONAL_OFF'], true);
    const e = rA.hip.filter(x => x.prev)[0]; const lw = rA.hip.filter(x => x.prev).map(x => 'W' + x.w + ' ' + x.hipExt + ' (hinge0 ' + x.hinge0 + ')').slice(0, 4);
    P('\n==== P4. ' + k.join(' ') + ' support_prevention (MARIO base, no run): A pool ' + JSON.stringify(e && e.pool) + ' draws ' + lw.join(' ; ') + ' | IFW log ' + JSON.stringify(rA.ifl.slice(0, 2)));
    const w = 1; DAYS.forEach(d => { if(circ(rV.p.weeks[w][d])) { P('  W1 ' + d + ' V   ' + card(rV.p.weeks[w][d])); P('  W1 ' + d + ' A   ' + card(rA.p.weeks[w][d])); P('  W1 ' + d + ' Areg ' + card(rAreg.p.weeks[w][d])); } });
  }
  // (d) 'Calves' / 'Leg isolation' example (non-runner prevention)
  { const row = lat.find(r => r.L === 'FULL' && r.f === 'support_prevention' && r.fam === 'none' && r.eq === 'commercial' && r.exp === 'beginner' && r.c.seed === 4242);
    const V = build('V', row.c).p, A = build('A', row.c).p, Ar = build('A', row.c, ['__REGIONAL_OFF']).p; P('\n==== P5. non-runner prevention leg day (FULL none commercial beginner s4242 ' + row.rest + ') W1 thu:\n  V    ' + card(V.weeks[1].thu) + '\n  A    ' + card(A.weeks[1].thu) + '\n  Areg ' + card(Ar.weeks[1].thu)); }
  // (e) v228-comparable legs-site row: FULL lattice, rest sun/wed only (v228 C2: 1,512 builds)
  { const o = {}; let nb = 0; for(const row of lat.filter(r => r.L === 'FULL' && r.rest === 'sun,wed')){ nb++; for(const [t, tr, fl] of [['V','V',[]], ['Vbo','V',['__BUDGET_OFF']], ['B','B',[]]]){ const r = build(tr, row.c, fl); for(const e of r.hip){ if(e.prev || !e.hipExt) continue; const c1 = cls(e.hipExt) === 1; const pr = weekNames(r.p, e.w).has(clean(e.hipExt));
      const x = o[t] = o[t] || { d:0, dc:0, p:0, pc:0 }; x.d++; if(c1) x.dc++; if(pr){ x.p++; if(c1) x.pc++; } } } }
    P('\n==== P6. legs-site, FULL x rest sun/wed (' + nb + ' builds, the v228 C2 lattice): ' + Object.entries(o).map(([t, x]) => t + ' C1 printed ' + x.pc + '/' + x.dc + ' all ' + x.p + '/' + x.d).join(' | ') + '   (v228: C1 3,551/6,298, budget-off 4,969/6,298, all 5,553/10,260)'); }
  // (f) not-gained reasons grouped by injury (from worker JSON)
  { const files = fs.readdirSync(SCR).filter(f => /^v231_w\d+\.json$/.test(f)); const G = {};
    files.forEach(f => { const j = JSON.parse(fs.readFileSync(F(f), 'utf8')); Object.entries(j.C).forEach(([k, v]) => { const m = k.match(/^T:(AvsV|ABvsB)\.notGainedWhy\|(\S+) (\S+) (\S+) :: ([^(]*?)(?: \(|$| pool)/); if(m){ const key = m[1] + ' | ' + m[2] + ' | ' + m[5].trim() + ' | ' + m[3]; G[key] = (G[key] || 0) + v; } }); });
    P('\n==== P7. not-gained prevention leg days grouped (arm | injury | reason | tier):'); Object.entries(G).sort().forEach(([k, v]) => P('  ' + String(v).padStart(5) + '  ' + k)); }
  P('PROBE DONE');
}
// ════════ DRIFT (A on the V228 tree the ruling was written on; B's 14 redetail cells) ════════
if(PART === 'drift'){
  const cp = require('child_process'); const f228 = F('v228.html'), f228A = F('v228_A.html'); [f228, f228A].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
  fs.writeFileSync(f228, cp.execSync('git -C ' + ROOT + ' show 2c1a89c:index.html', { maxBuffer:1 << 26 }));
  P('V228 tree: '); fs.writeFileSync(f228A, surgA(fs.readFileSync(f228, 'utf8')));
  const X0 = H.load(f228), XA = H.load(f228A); const E = (X, s) => X.eval(s);
  const b = (X, fl) => { (fl || []).forEach(x => E(X, 'globalThis.' + x + '=true')); const p = JSON.parse(JSON.stringify(X.buildProgram(clone(H.fixtures.HALF_MANNY)))); (fl || []).forEach(x => E(X, 'globalThis.' + x + '=false')); return p; };
  const p0 = b(X0), pA = b(XA), pAr = b(XA, ['__REGIONAL_OFF']);
  const has = (p, w) => liveSecs(p.weeks[w].tue).some(s => s.label === CALF);
  P('  V228 ia-version ' + X0.version + ' HALF_MANNY digest ' + H.progDigest(p0) + ' | A on V228 ' + H.progDigest(pA));
  P('  V228 Tue calf W1..W12: V228 ' + [1,2,3,4,5,6,7,8,9,10,11,12].map(w => has(p0, w) ? 'Y' : '-').join('') + ' | A on V228 ' + [1,2,3,4,5,6,7,8,9,10,11,12].map(w => has(pA, w) ? 'Y' : '-').join('') + ' | A on V228, __REGIONAL_OFF ' + [1,2,3,4,5,6,7,8,9,10,11,12].map(w => has(pAr, w) ? 'Y' : '-').join(''));
  P('  A on V228 W6 tue:\n        ' + card(pA.weeks[6].tue));
  // B redetail cells: the 14 Landmine rotational press rows
  const lat = lattice(); let shown = 0, cnt = 0;
  for(const row of lat.filter(r => r.L === 'FULL' && r.f === 'support_prevention' && ['commercial','crossfit','home_full'].includes(r.eq))){
    const V = build('V', row.c), B = build('B', row.c), Vbo = build('V', row.c, ['__BUDGET_OFF']);
    wkeys(V.p).forEach(w => DAYS.forEach(d => { const a = dayItems(V.p.weeks[w][d]), c = dayItems(B.p.weeks[w][d]); a.forEach(i => { const j = c.find(x => x.n === i.n); if(j && j.d !== i.d){ cnt++; if(shown < 2){ shown++;
      P('\n  B redetail ' + row.eq + ' ' + row.fam + ' ' + row.exp + ' s' + row.c.seed + ' ' + row.rest + ' W' + w + ' ' + d + ': ' + i.n + ' [' + i.d + '] -> [' + j.d + ']  budget view V ' + V.blog.filter(x => x.day === w + '|' + d).map(x => x.t + '/' + x.cap).join(',') + ' B ' + B.blog.filter(x => x.day === w + '|' + d).map(x => x.t + '/' + x.cap).join(','));
      P('    V    ' + card(V.p.weeks[w][d])); P('    B    ' + card(B.p.weeks[w][d])); P('    V-bo ' + card(Vbo.p.weeks[w][d])); } } }); }));
  }
  P('  B redetail rows (loaded prevention FULL): ' + cnt);
  P('DRIFT DONE');
}
