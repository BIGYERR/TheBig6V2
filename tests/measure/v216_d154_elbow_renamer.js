// V216 measure (Mode B, before-picture) — D154: injuryPlan swapNames renamer vs the gear lens.
// Run: node tests/measure/v216_d154_elbow_renamer.js [index.html]
// Copies (source surgery, anchors asserted count==1):
//   BASE   = artifact as shipped
//   NOSWAP = swapNames line removed (count of rename events = source names surviving here)
//   CF     = coach's shape: a swapNames target failing the tier's gear lens -> item dropped
// Oracles: (1) hand inventory table OWNS/CLASS copied from g210 O1/O2 (typed from the tier copy);
//          (2) _gearOK's own body extracted from source and evaluated per tier (the lens coach names).
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const SCR = process.env.SCR || require('os').tmpdir();
const html = fs.readFileSync(SRC, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const ANCH = 'if(P.swapNames&&P.swapNames[name]) name=P.swapNames[name];';
const ANCH2 = 'function applyInjuryFilter(sections,cfg){';
if(cnt(html, ANCH) !== 1 || cnt(html, ANCH2) !== 1){ console.log('ANCHOR FAIL', cnt(html, ANCH), cnt(html, ANCH2)); process.exit(2); }
// _gearOK body, verbatim from source
const gm = html.match(/const _gearOK = n => \{([\s\S]*?)\n  \};\n  const _gear = /);
if(!gm){ console.log('ANCHOR FAIL _gearOK body'); process.exit(2); }
const flagsSrc = (html.match(/const hasBarbell=_tierHasBarbell\(equip\);[\s\S]{0,600}?const hasDumbbells=[^;]*;/) || [''])[0];
console.log('tier flags at source:\n' + flagsSrc + '\n');
const GEAROK_FACTORY = 'function(equip){ var isCrossfit=equip===\'crossfit\'; var hasBarbell=(equip===\'home_full\'||equip===\'commercial\'||equip===\'crossfit\'); var hasCables=equip===\'commercial\'; var hasGHD=equip===\'commercial\'||isCrossfit; var hasDumbbells=equip!==\'bodyweight\'; return function(n){' + gm[1] + '\n}; }';
const gearFactory = eval('(' + GEAROK_FACTORY + ')');
// function replacements: the _gearOK body carries `$` in its regexes
const cfHtml = html.replace(ANCH2, () => 'var __CF_GEARF=' + GEAROK_FACTORY + ';\n' + ANCH2)
  .replace(ANCH, () => 'if(P.swapNames&&P.swapNames[name]){ if(!__CF_GEARF(cfg&&cfg.equipment)(P.swapNames[name])) return; name=P.swapNames[name]; }');
const nsHtml = html.replace(ANCH, () => '/*noswap*/');
const wr = (n, s) => { const f = path.join(SCR, n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const IA = load(SRC), CF = load(wr('v216_d154_cf.html', cfHtml)), NS = load(wr('v216_d154_ns.html', nsHtml));
console.log('ia-version base ' + IA.version + ' cf ' + CF.version + ' ns ' + NS.version);

// ── hand oracle (g210 O1/O2) ──
const OWNS = {
  commercial: { BARBELL:1, DUMBBELL:1, CABLE:1, MACHINE:1, GHD:1, KETTLEBELL:1, BAND:1, MEDBALL:1, WEIGHTED:1 },
  crossfit:   { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:1, KETTLEBELL:1, BAND:1, MEDBALL:1, WEIGHTED:1 },
  home_full:  { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1, BAND:1, MEDBALL:null, WEIGHTED:null },
  home_basic: { BARBELL:0, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1, BAND:1, MEDBALL:null, WEIGHTED:null },
  bodyweight: { BARBELL:0, DUMBBELL:0, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:0, BAND:0, MEDBALL:0, WEIGHTED:0 },
};
function CLASS(name){ const N = String(name).toLowerCase(), c = new Set();
  if(/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if(/\bbarbell\b|^back squat|^front squat|^bench press|close-grip bench|trap bar|power clean|hang clean|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^deadlift|^pendlay|^hip thrust$/.test(N)) c.add('BARBELL');
  if(/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if(/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if(/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|preacher/.test(N)) c.add('MACHINE');
  if(/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  return c; }
const TIERS = Object.keys(OWNS);
const handDenied = (t, n) => [...CLASS(n)].filter(c => OWNS[t][c] === 0);

// ── 1. every swapNames pair in every plan, and each target through both lenses per tier ──
const injuryPlan = IA.eval('injuryPlan');
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
const PAIRS = [];
console.log('\n=== 1. swapNames pairs per plan (12 plans) ===');
for(const r of REG) for(const t of ITIER){ const P = injuryPlan({injury:{region:r,tier:t}}); const sw = P && P.swapNames;
  console.log(r + '/' + t + ': ' + (sw ? JSON.stringify(sw) : 'none'));
  if(sw) Object.entries(sw).forEach(([a,b]) => PAIRS.push({plan:r+'/'+t, from:a, to:b})); }
console.log('\ntarget lens verdicts (FAIL = denied). cols: ' + TIERS.join(' | '));
PAIRS.forEach(p => { const row = TIERS.map(t => { const g = gearFactory(t)(p.to), h = handDenied(t, p.to); const gs = gearFactory(t)(p.from);
  return (g ? 'ok' : 'FAIL') + '/' + (h.length ? 'FAIL(' + h.join('+') + ')' : 'ok') + ' [src ' + (gs ? 'ok' : 'FAIL') + ']'; });
  console.log(p.plan + '  ' + p.from + ' -> ' + p.to + '\n    _gearOK/hand: ' + row.join(' | ')); });
// the other rename path in the same function
const spine = (html.match(/const SPINE_SWAP=(\{[^}]*\})/) || [])[1];
console.log('\nSPINE_SWAP (lowback, second rename path): ' + spine);
if(spine){ const S = eval('(' + spine + ')'); Object.entries(S).forEach(([a,b]) => { if(!b) return;
  console.log('  ' + a + ' -> ' + b + ': ' + TIERS.map(t => t + ' ' + (gearFactory(t)(b) ? 'ok' : 'FAIL') + '/' + (handDenied(t,b).length ? 'FAIL' : 'ok')).join(', ')); }); }

// ── 2. the copy ──
console.log('\n=== 2. athlete copy for the swap plans ===');
const eff = IA.eval('_INJ_EFFECT');
console.log('elbow/workaround: "' + eff.elbow.workaround + '"');
console.log('shoulder/workaround: "' + eff.shoulder.workaround + '"');
const noComm = IA.js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1'));
noComm.forEach((l, i) => { if(/pushdown|skullcrush/i.test(l) && /['"`][^'"`]*\b(become|swap|out|pushdown)/i.test(l) && l.length < 600 && /[A-Z][a-z]+ [a-z]+ [a-z]+/.test(l)) console.log('  copy-ish js line ' + (i+1) + ': ' + l.trim().slice(0, 220)); });

// ── 3. lattices ──
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
function mk(eq, focus, exp, age, si, inj){ const [g, x] = GOALS[(si + FOC.indexOf(focus)) % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(focus) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:focus, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj; return c; }
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const setsOf = d => { let m = /^(\d+)\s*[x×]/.exec(d || ''); if(m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(d || ''); return m ? +m[1] : 1; };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
function walk(p, fn){ Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => { const y = p.weeks[w][d]; if(y) fn(y, w, d); })); }
function run(label, cells){
  const R = { cfg:0, crash:0, days:0, daysChanged:{}, itemsRemoved:{}, setsRemoved:{}, secsRemoved:{}, dayEmptied:{}, events:{}, denied:{}, deniedCF:{}, sectEmptyEx:[], nonSwapPlanDiff:0, cfOtherDiff:0, labelRemoved:{}, otherBy:{}, labelAdded:{}, exBy:{} };
  cells.forEach(C => {
    let b, c, n; try { b = IA.buildProgram(JSON.parse(JSON.stringify(C.cfg))); c = CF.buildProgram(JSON.parse(JSON.stringify(C.cfg))); n = NS.buildProgram(JSON.parse(JSON.stringify(C.cfg))); } catch(e){ R.crash++; return; }
    R.cfg++;
    const plan = C.cfg.injury ? C.cfg.injury.region + '/' + C.cfg.injury.tier : 'none';
    const P = C.cfg.injury && injuryPlan(C.cfg); const sw = P && P.swapNames || {};
    const eq = C.cfg.equipment;
    const K = eq + '|' + plan;
    walk(n, y => (y.sections || []).forEach(s => (s.items || []).forEach(it => { const nm = clean(it.name); if(sw[nm]) bump(R.events, K + '|' + nm + ' -> ' + sw[nm] + (gearFactory(eq)(sw[nm]) ? ' [target ok]' : ' [target DENIED]')); })));
    walk(b, (y, w, d) => { R.days++;
      (y.sections || []).forEach(s => (s.items || []).forEach(it => { const nm = clean(it.name); if(Object.values(sw).includes(nm) && handDenied(eq, nm).length) bump(R.denied, K + '|' + nm); }));
      const y2 = c.weeks[w][d];
      (y2 && y2.sections || []).forEach(s => (s.items || []).forEach(it => { const nm = clean(it.name); if(handDenied(eq, nm).length && Object.values(sw).includes(nm)) bump(R.deniedCF, K + '|' + nm); }));
      if(JSON.stringify(y) === JSON.stringify(y2)) return;
      if(!Object.keys(sw).length){ R.nonSwapPlanDiff++; return; }
      bump(R.daysChanged, K);
      const bi = [].concat(...(y.sections || []).map(s => s.items || [])), ci = [].concat(...(y2.sections || []).map(s => s.items || []));
      bump(R.itemsRemoved, K, bi.length - ci.length);
      bump(R.setsRemoved, K, bi.reduce((a, it) => a + setsOf(it.detail), 0) - ci.reduce((a, it) => a + setsOf(it.detail), 0));
      const bs = (y.sections || []).length, cs = (y2 && y2.sections || []).length; bump(R.secsRemoved, K, bs - cs);
      if(bs !== cs){ const cl = new Set((y2.sections || []).map(s => s.label || s.coreHeader || '')); (y.sections || []).forEach(s => { const L = s.label || s.coreHeader || ''; if(!cl.has(L)) bump(R.labelRemoved, eq + '|' + L.replace(/ — .*/, ' — …')); });
        if(R.sectEmptyEx.length < 2) R.sectEmptyEx.push(C.k + ' W' + w + ' ' + d + ' "' + y.title + '"\n      before: ' + (y.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => clean(i.name)).join(', ') + ']').join(' | ') + '\n      after:  ' + (y2.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => clean(i.name)).join(', ') + ']').join(' | ')); }
      const liftB = (y.sections || []).length, liftC = (y2 && y2.sections || []).length; if(liftB && !liftC) bump(R.dayEmptied, K);
      // anything changed other than removal of a denied-target item?
      const bn = bi.map(i => clean(i.name)).filter(nm => !(Object.values(sw).includes(nm) && !gearFactory(eq)(nm))).join('|'), cn = ci.map(i => clean(i.name)).join('|');
      if(bn !== cn){ R.cfOtherDiff++; bump(R.otherBy, K); }
      { const bl = new Set((y.sections || []).map(s => s.label || s.coreHeader || '')); (y2 && y2.sections || []).forEach(s => { const L = s.label || s.coreHeader || ''; if(!bl.has(L)) bump(R.labelAdded, eq + '|' + L.replace(/ — .*/, ' — …')); }); }
      if(!R.exBy[K]) R.exBy[K] = C.k + ' W' + w + ' ' + d + ' "' + y.title + '" / "' + (y2 && y2.title) + '"\n      before: ' + (y.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => clean(i.name) + ' ' + i.detail).join(', ') + ']').join(' | ') + '\n      after:  ' + (y2 && y2.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => clean(i.name) + ' ' + i.detail).join(', ') + ']').join(' | ');
    });
  });
  console.log('\n--- ' + label + ': ' + R.cfg + ' configs built, ' + R.crash + ' crashed, ' + R.days + ' days ---');
  const pr = (t, o) => { const ks = Object.keys(o).sort(); console.log(t + (ks.length ? '' : ' (none)')); ks.forEach(k => console.log('   ' + k + ': ' + o[k])); };
  pr('rename events (source items that reach the renamer, from NOSWAP output):', R.events);
  pr('BASE: items named a swap target that the tier denies (hand table):', R.denied);
  pr('CF:   same count:', R.deniedCF);
  pr('CF vs BASE days changed:', R.daysChanged); pr('items removed:', R.itemsRemoved); pr('sets removed:', R.setsRemoved);
  pr('sections removed (emptied):', R.secsRemoved); pr('removed section labels:', R.labelRemoved); pr('days left with zero sections:', R.dayEmptied);
  console.log('days changed under a plan with no swapNames: ' + R.nonSwapPlanDiff + '   changed days where the diff is not just the denied-target item: ' + R.cfOtherDiff);
  pr('changed days where the diff is more than dropping the denied target, by tier|plan:', R.otherBy);
  pr('section labels ADDED in CF (downstream refill):', R.labelAdded);
  Object.keys(R.exBy).sort().forEach(k => console.log('   first changed day ' + k + ': ' + R.exBy[k]));
  return R;
}
// L1: g210's injury cells verbatim (5 tiers x 8 seeds x 6 regions x 2 tiers, hypertrophy) — reproduces O3r
const L1 = []; for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++) for(const r of REG) for(const t of ITIER)
  L1.push({ k:[eq,'inj',r,t,si].join('|'), cfg: mk(eq,'hypertrophy',EXPS[si % 3],AGES[si % 3],si,{region:r,tier:t}) });
run('L1 g210 injury cells (all 12 plans)', L1);
// L2: the two swap plans across every focus x experience x seed x tier
const L2 = []; for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++) for(const f of FOC) for(const e of EXPS) for(const r of ['elbow','shoulder'])
  L2.push({ k:[eq,f,e,r,si].join('|'), cfg: mk(eq,f,e,AGES[(si + EXPS.indexOf(e)) % 3],si,{region:r,tier:'workaround'}) });
run('L2 elbow+shoulder workaround x 7 focuses x 3 exp x 8 seeds x 5 tiers', L2);

// ── 4. HALF_MANNY ──
const hm = x => progDigest(x.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
console.log('\n=== HALF_MANNY: base ' + hm(IA) + '  cf ' + hm(CF) + '  noswap ' + hm(NS) + '  (shipped pin 0ac7da6b1691a8e1)');
console.log('HALF_MANNY injury: ' + JSON.stringify(fixtures.HALF_MANNY.injury || null));
// self-stability
console.log('base self-stable: ' + (hm(IA) === hm(IA)));
