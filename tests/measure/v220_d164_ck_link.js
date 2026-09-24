// v220_d164_ck_link.js — MEASURE, D164 follow-up, base V216 (3dc0146). Two preconditions coach set on the D164(a) ruling.
//   node tests/measure/v220_d164_ck_link.js <base.html> <scratchdir> --ck
//   node tests/measure/v220_d164_ck_link.js <base.html> <scratchdir> --blast <k> <n>   (shard k of n, writes JSON)
//   node tests/measure/v220_d164_ck_link.js <base.html> <scratchdir> --merge <n>       (reads shards, prints, HALF_MANNY)
// (1) --ck: every shoulder/workaround 'Chest + knee' section that prints no chest movement, linked to the name the
//     draw produced (tagged on the section at draw time, _ckd) and to the pass that removed it. Lattice and oracle are
//     coach_d164_ck.js's, verbatim: 1,008 shoulder/workaround configs; "no chest" = no item matching
//     /press|pushup|dips|crossover|pec deck|fly/i. Removal is attributed by WRAPPING each pipeline pass in the VM and
//     diffing the tagged section's item names across the call (innermost pass wins). Reasons inside applyInjuryFilter
//     are read off injuryPlan(cfg)'s own sets (drop pattern / dropNames token / seen). Instrument proven inert
//     (weeks JSON with _ckid/_ckd stripped == uninstrumented build) per config.
// (2) --blast: slice 2 = the Biceps draw (bis :9185, _ssPair :9188) sees through the injury rename. Whole-output diff
//     on the D159 WIDE lattice (13,104 configs) for s2 alone, (a) alone, and (a)+(s2), plus the union test:
//     moved-day set of (a+s2) == moved(a) U moved(s2), and every such day equals the single-slice day that moved it.
//     Clock fields prog.id / prog.created stripped.
'use strict';
const path = require('path'), fs = require('fs');
const { load, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const argv = process.argv.slice(2);
const BASE = argv[0], SCR = argv[1];
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const top = (o, n = 40) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v + '  ' + k).join('\n') || '    (none)';
const B = c => JSON.parse(JSON.stringify(c));
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const PRESS = /press|pushup|dips|crossover|pec deck|fly/i;

// ── lattices ──
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){
  const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
// coach_d164_ck.js lattice, verbatim (goal offset 1+fi+ei+si)
const LAT_CK = [];
TIERS6.forEach(eq => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, 1 + fi + ei + si, f, e, AGES[(fi + si) % 3], si, { region:'shoulder', tier:'workaround' }); c.restDays = RESTS[ri].slice(); LAT_CK.push({ eq, f, cfg:c }); })))));
// D159 WIDE lattice, verbatim
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const LAT_W = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj); c.restDays = RESTS[ri].slice(); LAT_W.push({ eq, inj, f, cfg: c }); })))));
const ik = x => x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy';

// ── surgery ──
const RAW = fs.readFileSync(BASE, 'utf8');
function apply(src, pairs, tag){
  let out = src;
  pairs.forEach(([a, b], i) => { const n = out.split(a).length - 1; if(n !== 1) throw new Error(tag + ' anchor ' + i + ' count ' + n + ': ' + a.slice(0, 90)); out = out.replace(a, () => b); });
  return out;
}
function save(src, tag){ const f = path.join(SCR, 'v220ck_' + tag + '_' + process.pid + '.html'); if(fs.existsSync(f)) fs.rmSync(f); fs.writeFileSync(f, src); return f; }
const A_AIF = "function applyInjuryFilter(sections,cfg){";
const VIEW = "function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n";
// slice 1 = counterfactual (a) of v220_d164_floorpress_twice.js, same anchors, same replacement text
const S1 = [
  ["        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)t[it.name]=1;});});\n        for(let i=0;i<prefs.length;i++){ if(prefs[i]&&!t[prefs[i]]) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(chestAccPool[i]&&!t[chestAccPool[i]]) return chestAccPool[i]; }",
   "        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name){t[it.name]=1;t[_injViewName(it.name,cfg)]=1;}});});\n        const _fr=function(n){return n&&!t[n]&&!t[_injViewName(n,cfg)];};\n        for(let i=0;i<prefs.length;i++){ if(_fr(prefs[i])) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(_fr(chestAccPool[i])) return chestAccPool[i]; }"],
  ["        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain);", "        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain&&_injViewName(x,cfg)!==_injViewName(ex.chestMain,cfg));"],
  ["        const chest2=pick(chestPool.filter(x=>x!==secondary),2,blockSeed(w)+101);", "        const chest2=pick(chestPool.filter(x=>x!==secondary&&_injViewName(x,cfg)!==_injViewName(secondary,cfg)),2,blockSeed(w)+101);"]];
// slice 2 = Biceps draw sees through the rename: a second pick whose view equals the first's is re-drawn from the
// pool minus that view, and the _ssPair b-walk excludes it too. Uncontested draws are untouched.
const S2 = [
  ["        const bis=pick(_bicPool,2,blockSeed(w)+104);",
   "        const bis=pick(_bicPool,2,blockSeed(w)+104);\n        if(bis[1]&&_injViewName(bis[1],cfg)===_injViewName(bis[0],cfg)){ const _alt=_bicPool.filter(n=>n!==bis[0]&&_injViewName(n,cfg)!==_injViewName(bis[0],cfg)); if(_alt.length) bis[1]=pick(_alt,1,blockSeed(w)+104)[0]; }"],
  ["        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool);", "        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool.filter(n=>_injViewName(n,cfg)!==_injViewName(bis[0],cfg)));"]];
const CKTAG = [["if(_ckA) s.push({label:'Chest + knee',", "if(_ckA) s.push({_ckid:(globalThis.__CKN=(globalThis.__CKN||0)+1),_ckd:_ckA,_ckw:w,label:'Chest + knee',"]];
const withView = src => apply(src, [[A_AIF, VIEW + A_AIF]], 'view');

const lines = RAW.split('\n'); const ln = re => lines.map((l, i) => re.test(l) ? (i + 1) : 0).filter(Boolean).join(',');
console.log('base ia-version ' + load(BASE).version + ' | sites: bis pick ' + ln(/const bis=pick\(_bicPool/) + ' | _bicPool ' + ln(/const _bicPool=/) + ' | Biceps _ssPair ' + ln(/const _sp=_ssPair\(bis\[0\]/) + ' | Biceps push ' + ln(/label:'Biceps',superset:_sp\.ok/) +
  ' | bicepsAccPool ' + ln(/const bicepsAccPool/) + ' | EXLIB.biceps ' + ln(/^\s*biceps:\[/) + ' | _ckA ' + ln(/const _ckA=_accFresh/) + ' | Chest+knee push ' + ln(/if\(_ckA\) s\.push/) + ' | elbow swapNames ' + ln(/P\.swapNames=\{'Dumbbell skullcrushers'/) + ' | shoulder dropNames ' + ln(/P\.dropNames=\/overhead\|arnold/));

function mannyArms(file){
  const PINS = ['0ac7da6b1691a8e1', '1069cd7f86eed204', '9d14801a63111081'];
  const X = load(file); const H = () => B(X.fixtures.HALF_MANNY);
  const plain = progDigest(X.buildProgram(H())); const again = progDigest(X.buildProgram(H()));
  X.eval('globalThis.__DELOAD_OFF=true;'); const dOff = progDigest(X.buildProgram(H())); X.eval('globalThis.__DELOAD_OFF=false;');
  const R = fs.readFileSync(file, 'utf8'); const CL = "  if(_auxFamily(name)==='core') return 0;\n"; const n = R.split(CL).length - 1;
  let cOff = 'CLAUSE count ' + n;
  if(n === 1){ const tmp = path.join(SCR, 'v220ck_coreoff_' + process.pid + '.html'); fs.writeFileSync(tmp, R.replace(CL, '')); cOff = progDigest(load(tmp).buildProgram(H())); fs.rmSync(tmp); }
  const got = [plain, dOff, cOff];
  console.log('  HALF_MANNY ' + path.basename(file) + ' self-stable ' + (plain === again) + ': plain ' + plain + ' | deload_off ' + dOff + ' | core_off ' + cOff + ' | vs pins ' + got.map((g, i) => g === PINS[i] ? 'EQ' : 'MOVED').join('/'));
}

// ────────────────────────────── (1) --ck ──────────────────────────────
const PASSES = ['applyInjuryFilter','capRegionalFatigue','recoveryDeload','capSessionBudget','injectDynamicCore','bodyweightSweep','d18LongRunDayPass','raceEveLiftPass',
  'unloadableRxSweep','singletonSupersetSweep','preventionDoseSweep','hotNextHingeClampSweep','deconflictAdjacentDupes','accessoryGrammarSweep','applySwapPrefs'];
function instrument(X){
  const ctx = { ev: [], calls: {}, depth: 0, meta: {} };
  const P = X.eval('injuryPlan'), PAT = X.eval('_pattern');
  function walk(o, m, dep){
    if(!o || typeof o !== 'object' || dep > 5) return m;
    if(o._ckid && Array.isArray(o.items)){ m[o._ckid] = o.items.map(i => clean(i && i.name)); ctx.meta[o._ckid] = { w: o._ckw, drawn: o._ckd }; return m; }
    if(Array.isArray(o)) o.forEach(v => walk(v, m, dep + 1)); else Object.keys(o).forEach(k => { const v = o[k]; if(v && typeof v === 'object') walk(v, m, dep + 1); });
    return m;
  }
  PASSES.forEach(nm => {
    const orig = X.eval('typeof ' + nm + '==="function"?' + nm + ':null');
    if(!orig){ ctx.calls[nm] = 'ABSENT'; return; }
    ctx.calls[nm] = 0;
    const wrap = function(){
      ctx.calls[nm]++;
      const snap = {}; Array.prototype.forEach.call(arguments, a => walk(a, snap, 0));
      const ids = Object.keys(snap);
      const start = ctx.ev.length;
      const r = orig.apply(this, arguments);
      if(ids.length){
        const after = {}; if(r && typeof r === 'object') walk(r, after, 0); else Array.prototype.forEach.call(arguments, a => walk(a, after, 0));
        const inner = new Set(ctx.ev.slice(start).map(e => e.id + '|' + e.name));
        ids.forEach(id => {
          const was = snap[id], now = after[id];
          was.forEach(n => {
            if(now && now.indexOf(n) >= 0) return;
            if(inner.has(id + '|' + n)) return;
            let why = nm;
            if(nm === 'applyInjuryFilter'){
              const Pl = P(arguments[1]); const pat = PAT(n);
              why += (pat && Pl.drop.has(pat)) ? ' / P.drop ' + pat : (Pl.dropNames && Pl.dropNames.test(n)) ? ' / dropNames "' + n.match(Pl.dropNames)[0] + '"' : ' / other';
            }
            const added = now ? now.filter(x => was.indexOf(x) < 0) : [];
            ctx.ev.push({ id: +id, name: n, pass: why + (now ? (added.length ? ' (renamed to ' + added.join(',') + ')' : '') : ' (whole section removed)') });
          });
        });
      }
      return r;
    };
    X.eval('globalThis.__W_' + nm + '=null;'); X.ctx['__W_' + nm] = wrap; X.eval(nm + '=globalThis.__W_' + nm + ';');
  });
  return ctx;
}
function ckScan(file, tag){
  const plain = load(file), X = load(save(apply(fs.readFileSync(file, 'utf8'), CKTAG, 'cktag'), tag + '_ck'));
  const ctx = instrument(X);
  const R = { tag, ck:0, no:0, inertFail:0, noBy:{}, byTier:{}, byTierCause:{}, byDrawn:{}, byCause:{}, lost:{}, unattrib:0, keys:{}, ids:0 };
  LAT_CK.forEach((x, li) => {
    X.eval('globalThis.__CKN=0;'); ctx.ev.length = 0;
    const p = X.buildProgram(B(x.cfg)), q = plain.buildProgram(B(x.cfg));
    const strip = o => JSON.stringify(o, (k, v) => (k === '_ckid' || k === '_ckd' || k === '_ckw') ? undefined : v);
    if(strip(p.weeks) !== strip(q.weeks)){ R.inertFail++; return; }
    const evBy = {}; ctx.ev.forEach(e => (evBy[e.id] = evBy[e.id] || []).push(e));
    const seenIds = new Set();
    Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const day = p.weeks[w][d]; ((day && day.sections) || []).forEach(s => {
      if(s && s._ckid) seenIds.add(s._ckid);
      if(!/^Chest \+ knee/.test(String(s.label || ''))) return; const it = (s.items || []).map(i => clean(i.name)); if(!it.length) return;
      R.ck++; if(it.some(n => PRESS.test(n))) return;
      R.no++;
      const drawn = s._ckd || '(untagged section)';
      const evs = (evBy[s._ckid] || []).filter(e => e.name === drawn);
      const cause = s._ckid ? (evs.length ? evs.map(e => e.pass).join(' ; ') : 'UNATTRIBUTED') : 'UNTAGGED';
      if(cause === 'UNATTRIBUTED' || cause === 'UNTAGGED') R.unattrib++;
      bump(R.byTier, x.eq); bump(R.byDrawn, drawn); bump(R.byCause, cause); bump(R.byTierCause, x.eq + ' | drawn ' + drawn + ' | ' + cause);
      R.keys[li + '|' + w + '|' + d] = { eq:x.eq, f:x.f, drawn, cause, items:it.join(' + ') };
    }); }));
    // whole-section losses: tagged sections that some pass removed and that no final day carries
    ctx.ev.filter(e => /whole section removed/.test(e.pass) && !seenIds.has(e.id)).forEach(e => bump(R.lost, x.eq + ' | ' + e.name + ' | ' + e.pass));
  });
  R.calls = ctx.calls;
  return R;
}
// sections present on a plain base day and absent on the plain s1 day, linked through s1 events of the same week
function lostLink(fA){
  const P0 = load(BASE), X = load(save(apply(fs.readFileSync(fA, 'utf8'), CKTAG, 'cktag'), 's1_ck_lost')); const ctx = instrument(X); const out = [];
  LAT_CK.forEach((x, li) => {
    const a = P0.buildProgram(B(x.cfg)); X.eval('globalThis.__CKN=0;'); ctx.ev.length = 0; ctx.meta = {}; const b = X.buildProgram(B(x.cfg));
    const has = (p, w, d) => (p.weeks[w][d].sections || []).find(s => /^Chest \+ knee/.test(String(s.label || '')) && (s.items || []).length);
    Object.keys(a.weeks).forEach(w => DAYS.forEach(d => { const s0 = has(a, w, d); if(!s0 || has(b, w, d)) return;
      const ids = {}; ctx.ev.forEach(e => { (ids[e.id] = ids[e.id] || []).push(e); });
      const cand = []; const walk = o => { if(!o || typeof o !== 'object') return; if(o._ckid && o._ckw === +w) cand.push(o); (Array.isArray(o) ? o : Object.values(o)).forEach(v => { if(v && typeof v === 'object' && !v._ckid) walk(v); }); };
      out.push({ eq:x.eq, f:x.f, exp:x.cfg.experience, seed:x.cfg.seed, rest:x.cfg.restDays.join('/'), w, d, title:b.weeks[w][d].title, base:s0.items.map(i => clean(i.name)).join(' + '),
        s1day: live(b.weeks[w][d]).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '),
        ev: Object.keys(ids).filter(id => ctx.meta[id] && ctx.meta[id].w === +w).map(id => 'id ' + id + ' drawn ' + ctx.meta[id].drawn + ': ' + ids[id].map(e => e.name + ' <- ' + e.pass).join(' ; ')) });
    }));
  });
  return out;
}
if(argv.includes('--ck')){
  const fA = save(withView(apply(RAW, S1, 's1')), 's1');
  const RB = ckScan(BASE, 'base'), RA = ckScan(fA, 's1');
  [RB, RA].forEach(R => {
    console.log(`\n=== --ck ${R.tag}: ${LAT_CK.length} shoulder/workaround configs; instrument NOT inert ${R.inertFail}; Chest + knee sections ${R.ck}; with no chest item ${R.no}; unattributed ${R.unattrib}`);
    console.log('  pass wrappers called: ' + JSON.stringify(R.calls));
    console.log('  no-chest by tier:\n' + top(R.byTier) + '\n  by drawn name:\n' + top(R.byDrawn) + '\n  by cause:\n' + top(R.byCause) + '\n  tier | drawn | cause:\n' + top(R.byTierCause, 60));
    console.log('  whole Chest + knee sections removed (tier | drawn/knee name | pass):\n' + top(R.lost, 30));
  });
  const onlyA = Object.keys(RA.keys).filter(k => !RB.keys[k]), onlyB = Object.keys(RB.keys).filter(k => !RA.keys[k]);
  const g = {}, gB = {};
  onlyA.forEach(k => { const v = RA.keys[k]; bump(g, v.eq + ' | drawn ' + v.drawn + ' | ' + v.cause); });
  onlyB.forEach(k => { const v = RB.keys[k]; bump(gB, v.eq + ' | drawn ' + v.drawn + ' | ' + v.cause); });
  console.log(`\n=== delta s1 vs base: no-chest ${RB.no} -> ${RA.no} (net ${RA.no - RB.no}); days no-chest ONLY under s1 ${onlyA.length}; ONLY on base ${onlyB.length}; both ${Object.keys(RA.keys).length - onlyA.length}`);
  console.log('  ONLY under s1 (tier | drawn under s1 | cause):\n' + top(g, 40));
  console.log('  ONLY on base (tier | drawn on base | cause):\n' + top(gB, 40));
  // what base drew on the s1-only days
  const gx = {}; onlyA.forEach(k => { const [li, w, d] = k.split('|'); bump(gx, 'base printed: ' + (function(){ const x = LAT_CK[+li]; const day = load.__b = load.__b || load(BASE); const p = day.buildProgram(B(x.cfg)); const s = (p.weeks[w][d].sections || []).find(z => /^Chest \+ knee/.test(String(z.label || ''))); return s ? s.items.map(i => clean(i.name)).join(' + ') : '(no Chest + knee)'; })()); });
  console.log('  s1-only days, what base printed in Chest + knee:\n' + top(gx, 20));
  const L = lostLink(fA); console.log('\n=== Chest + knee present on base, absent under s1: ' + L.length + ' days');
  L.forEach(o => console.log('  ' + o.eq + ' ' + o.f + ' ' + o.exp + ' seed ' + o.seed + ' rest ' + o.rest + ' W' + o.w + ' ' + o.d + ' "' + o.title + '" base Chest + knee [' + o.base + ']\n    s1 day: ' + o.s1day + '\n    s1 removal events on Chest + knee sections drawn for W' + o.w + ' (all passes):\n      ' + o.ev.join('\n      ')));
}

// ────────────────────────────── (2) --blast ──────────────────────────────
const bi = argv.indexOf('--blast');
if(bi >= 0){
  const k = +argv[bi + 1], n = +argv[bi + 2];
  const fS2 = save(withView(apply(RAW, S2, 's2')), 's2'), fS1 = save(withView(apply(RAW, S1, 's1')), 's1'), fS12 = save(withView(apply(apply(RAW, S1, 's1'), S2, 's2')), 's12');
  const X0 = load(BASE), X1 = load(fS1), X2 = load(fS2), X12 = load(fS12);
  const strip = p => JSON.stringify(Object.assign({}, p, { id:0, created:0 }));
  const out = { k, n, cfgs:0, crash:0, prog:{ s1:0, s2:0, s12:0 }, uni:{ s1:0, s2:0, s12:0 }, days:{ s1:0, s2:0, s12:0 }, movedBy:{ s1:{}, s2:{}, s12:{} },
    union:{ s12NotInUnion:0, unionNotInS12:0, onlyS1Mismatch:0, onlyS2Mismatch:0, both:0, bothMismatch:0 }, s2repl:{}, s2super:{}, s2other:{}, s2secLost:0, s2itemLost:0, s2ex:[], s2resid:{ base:0, s2:0 } };
  const dupBic = day => { const s = live(day).find(z => z.label === 'Biceps'); return s ? s.items.length : -1; };
  LAT_W.forEach((x, li) => {
    if(li % n !== k) return;
    let P0, P1, P2, P12;
    try { P0 = X0.buildProgram(B(x.cfg)); P1 = X1.buildProgram(B(x.cfg)); P2 = X2.buildProgram(B(x.cfg)); P12 = X12.buildProgram(B(x.cfg)); } catch(e){ out.crash++; return; }
    out.cfgs++;
    const base = strip(P0), U0 = JSON.stringify([P0._swapUniverse || null, P0._swapUniverseByKey || null]);
    [['s1', P1], ['s2', P2], ['s12', P12]].forEach(([t, P]) => { if(strip(P) !== base){ out.prog[t]++; bump(out.movedBy[t], x.eq + ' ' + ik(x)); } if(JSON.stringify([P._swapUniverse || null, P._swapUniverseByKey || null]) !== U0) out.uni[t]++; });
    Object.keys(P0.weeks).forEach(w => DAYS.forEach(d => {
      const j0 = JSON.stringify(P0.weeks[w][d]), j1 = JSON.stringify(P1.weeks[w][d]), j2 = JSON.stringify(P2.weeks[w][d]), j12 = JSON.stringify(P12.weeks[w][d]);
      const m1 = j1 !== j0, m2 = j2 !== j0, m12 = j12 !== j0;
      if(m1) out.days.s1++; if(m2) out.days.s2++; if(m12) out.days.s12++;
      if(ik(x) === 'elbow/workaround'){ const b0 = live(P0.weeks[w][d]).find(z => z.label === 'Biceps'); if(b0 && b0.items.length === 1) out.s2resid.base++; const b2 = live(P2.weeks[w][d]).find(z => z.label === 'Biceps'); if(b2 && b2.items.length === 1) out.s2resid.s2++; }
      if(m12 && !(m1 || m2)) out.union.s12NotInUnion++;
      if(!m12 && (m1 || m2)) out.union.unionNotInS12++;
      if(m1 && !m2 && j12 !== j1) out.union.onlyS1Mismatch++;
      if(m2 && !m1 && j12 !== j2) out.union.onlyS2Mismatch++;
      if(m1 && m2){ out.union.both++; out.union.bothMismatch++; }
      if(m2){
        const La = live(P0.weeks[w][d]), Lb = live(P2.weeks[w][d]);
        const na = La.reduce((q, s) => q + s.items.length, 0), nb = Lb.reduce((q, s) => q + s.items.length, 0); if(nb < na) out.s2itemLost++;
        const sb = new Set(Lb.map(s => s.label)); if(La.some(s => !sb.has(s.label))) out.s2secLost++;
        La.forEach(s => { const t = Lb.find(u => u.label === s.label);
          if(!t){ bump(out.s2other, ik(x) + ' section gone ' + s.label); return; }
          if(JSON.stringify(s) === JSON.stringify(t)) return;
          if(s.label !== 'Biceps'){ bump(out.s2other, ik(x) + ' ' + s.label + ' changed'); return; }
          bump(out.s2repl, ik(x) + ' ' + x.eq + ' Biceps [' + s.items.map(i => clean(i.name)).join(', ') + '] superset ' + !!s.superset + ' -> [' + t.items.map(i => clean(i.name)).join(', ') + '] superset ' + !!t.superset);
          bump(out.s2super, 'superset ' + !!s.superset + ' -> ' + !!t.superset + ', items ' + s.items.length + ' -> ' + t.items.length);
        });
        Lb.forEach(s => { if(!La.find(u => u.label === s.label)) bump(out.s2other, ik(x) + ' section added ' + s.label); });
        if(JSON.stringify(Object.assign({}, P0.weeks[w][d], { sections:0 })) !== JSON.stringify(Object.assign({}, P2.weeks[w][d], { sections:0 }))) bump(out.s2other, 'non-section day field');
        if(out.s2ex.length < 3) out.s2ex.push(x.eq + ' ' + ik(x) + ' ' + x.f + ' ' + x.cfg.experience + ' seed ' + x.cfg.seed + ' rest ' + x.cfg.restDays.join('/') + ' W' + w + ' ' + d + '\n      before: ' + La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ') + '\n      after:  ' + Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
      }
    }));
  });
  const f = path.join(SCR, 'v220ck_shard_' + k + '.json'); if(fs.existsSync(f)) fs.rmSync(f); fs.writeFileSync(f, JSON.stringify(out));
  console.log('shard ' + k + '/' + n + ' done cfgs ' + out.cfgs + ' crash ' + out.crash);
}
const mi = argv.indexOf('--merge');
if(mi >= 0){
  const n = +argv[mi + 1]; const T = { cfgs:0, crash:0, prog:{}, uni:{}, days:{}, movedBy:{ s1:{}, s2:{}, s12:{} }, union:{}, s2repl:{}, s2super:{}, s2other:{}, s2secLost:0, s2itemLost:0, s2ex:[], s2resid:{} };
  const add = (a, b) => Object.keys(b).forEach(k => { a[k] = (a[k] || 0) + b[k]; });
  for(let k = 0; k < n; k++){ const o = JSON.parse(fs.readFileSync(path.join(SCR, 'v220ck_shard_' + k + '.json'), 'utf8'));
    T.cfgs += o.cfgs; T.crash += o.crash; T.s2secLost += o.s2secLost; T.s2itemLost += o.s2itemLost; add(T.prog, o.prog); add(T.uni, o.uni); add(T.days, o.days); add(T.union, o.union);
    ['s1','s2','s12'].forEach(t => add(T.movedBy[t], o.movedBy[t])); add(T.s2repl, o.s2repl); add(T.s2super, o.s2super); add(T.s2other, o.s2other); add(T.s2resid, o.s2resid); T.s2ex = T.s2ex.concat(o.s2ex); }
  console.log(`\n=== --blast merged: ${T.cfgs}/${LAT_W.length} configs, crashes ${T.crash}`);
  ['s1','s2','s12'].forEach(t => console.log(`  ${t}: programs moved ${T.prog[t]}/${T.cfgs}; swap universe moved ${T.uni[t]}/${T.cfgs}; days moved ${T.days[t]}\n` + top(T.movedBy[t], 20)));
  console.log('  union test: ' + JSON.stringify(T.union));
  console.log(`  s2: days that lost a section ${T.s2secLost}; days that lost an item ${T.s2itemLost}; elbow/workaround 1-item Biceps days base ${T.s2resid.base} -> s2 ${T.s2resid.s2}`);
  console.log('  s2 Biceps before -> after:\n' + top(T.s2repl, 30) + '\n  s2 superset flag / item count:\n' + top(T.s2super) + '\n  s2 anything else:\n' + top(T.s2other));
  console.log('  s2 examples:\n    ' + T.s2ex.slice(0, 3).join('\n    '));
  mannyArms(save(withView(apply(RAW, S2, 's2')), 's2')); mannyArms(save(withView(apply(RAW, S1, 's1')), 's1')); mannyArms(save(withView(apply(apply(RAW, S1, 's1'), S2, 's2')), 's12'));
}
