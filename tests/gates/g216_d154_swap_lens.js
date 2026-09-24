// g216_d154_swap_lens.js — GATE for D154 (coach, re-ruled): THE INJURY RENAMER READS THE GEAR LENS.
//
//   node tests/gates/g216_d154_swap_lens.js [candidate] [baseline V215]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D154  injuryPlan's swapNames (shoulder/workaround, elbow/workaround) is read by applyInjuryFilter.
//         The copy promises a swap, so the swap stays, judged by the tier's gear lens:
//         (1) a swap TARGET the tier does not own falls to its family's gear legal member from the
//             file's own tricep list: Cable pushdown -> Close-grip pushups (crossfit, home_full, home_basic);
//         (2) a SOURCE the tier does not own is not renamed; bodyweightSweep converts it as before, so
//             bodyweight prints byte-identical to V215;
//         (3) Cable curl never fires off commercial (its source is a cable/machine name): no fallback row;
//         (4) the elbow/workaround copy says so, in short sentences with no mid-sentence dash.
//
// ORACLES, independent of the engine. _gearLens / _gearOK are never called:
//   OWNS   the inventory per tier, copied from g210 O1 (typed from the tier copy the athlete reads).
//   CLASS  a name's implement by its NAME, copied from g210 O2.
//   SWAPS  the swapNames pairs typed from the ruling; FALLBACK typed from the ruling.
//   EXPECT per tier and source, computed HERE from OWNS/CLASS/SWAPS/FALLBACK by the ruled rule
//          (legal source ? (legal target ? target : fallback) : source), and the cells the ruling
//          names are ALSO typed literally (LIT) so the rule itself is pinned.
//   COPY   the ruled sentence, typed.
//   V215   the shipped artifact (argv[3] when it reads 215, else git 7474f06) for the pair rows.
//
// ROWS
//   U0   fixture: the hand table denies Cable pushdown on crossfit/home_full/home_basic/bodyweight and
//        owns Close-grip pushups everywhere; LIT agrees with the computed EXPECT.
//   U1   injuryPlan's swapNames equal SWAPS (a new pair the gate does not know fails here).
//   U2   applyInjuryFilter, one item per tier x source: the name (and the heading) is EXPECT.
//   U3   per tier: every rename output of a gear legal source is gear legal (hand table).
//   P1   per denied tier, elbow/shoulder workaround programs: no item the hand table denies prints.
//   P2   per denied tier: Close-grip pushups prints on elbow/workaround cards and Dumbbell skullcrushers
//        never does (the swap still lands; nothing reverts to the skullcrusher).
//   P3   commercial: Cable pushdown still prints on elbow/workaround cards (a ruling that selects
//        is not a ruling that deletes).
//   P4   no day on any tier prints Close-grip pushups twice (swap cells).
//   Q1   PAIR. every bodyweight program (both swap plans and the no-swap plans) byte-identical to V215∘D156.
//   Q2   PAIR. every commercial program byte-identical to V215∘D156.
//   Q3   PAIR. every program under a plan with no swapNames byte-identical to V215∘D156, every tier.
//   Q4   PAIR. per no-cable tier, every elbow/workaround day that differs from V215∘D156 is one of the
//        three classes coach ruled on, and class A is present (the swap as ruled is ASSERTED):
//          A  the swap as ruled: same title, same sections, same labels once Cable pushdown reads
//             Close-grip pushups, every other item name and detail unchanged; only the swapped
//             item's name and prescription move.
//          B  ACCEPTED (coach): the swapped item is trimmed downstream. V215 printed Cable pushdown;
//             this build prints no Close-grip pushups and one press in its place (the press
//             capRegionalFatigue cut in V215); everything else unchanged. The pushups' press
//             classification is D161, queued measure first; this gate does not judge it.
//          C  ACCEPTED (coach): V215's adjacent-day spacing pass renamed Cable pushdown to another
//             triceps name; this build prints Close-grip pushups there, and the previous calendar
//             day prints Close-grip pushups too (the spacing pass skips unloaded movements on purpose).
//        B and C are counted and printed as named classes, never failures. Anything else FAILS.
//   C1   _INJ_EFFECT.elbow.workaround is the ruled sentence, exactly.
//   C2   that sentence carries no hyphen or dash.
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (no injury on the fixture; ruled unmoved).
//
// V215∘D156. V216 carries D154 AND D156 (slice 2: the loaded full-body day's _longDay also reads
// dose.key 'long'). The pair rows isolate D154, so their baseline is V215 with D156's predicate grafted
// in by source surgery (anchor count==1, else every pair row FAILS). D156's own rows live in
// tests/gates/g216_d156_longday.js. A later V216 slice that moves these lattices needs its graft here too.
//
// VERSION PREDICATE (standing ruling 4). D154 ships on ia-version 216.
//   below 216: NOT APPLICABLE, every row skipped by name, clean exit.
//   Q1..Q4 say "this build moved only what D154 moves", so they run only on candidate 216 against
//   baseline 215 and SKIP by name on every other pair. Every other row is ruling-level from 216 up.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 216, V215_COMMIT = '7474f0607bfdf50b768e95221a1f7e9ef52067b6';
const HM_DIGEST = '0ac7da6b1691a8e1';
const ROWS = ['U0','U1','U2','U3','P1','P2','P3','P4','Q1','Q2','Q3','Q4','C1','C2','HM'];
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D154 (V' + ERA + ').'); ROWS.forEach(r => skipRow(r + ' below the D154 era')); done(); }

// ── oracles ──────────────────────────────────────────────────────────────────────────────
const OWNS = {   // g210 O1
  commercial: { BARBELL:1, DUMBBELL:1, CABLE:1, MACHINE:1, GHD:1, KETTLEBELL:1 },
  crossfit:   { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:1, KETTLEBELL:1 },
  home_full:  { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1 },
  home_basic: { BARBELL:0, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1 },
  bodyweight: { BARBELL:0, DUMBBELL:0, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:0 },
};
function CLASS(name){ const N = String(name).toLowerCase(), c = new Set();   // g210 O2
  if(/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if(/\bbarbell\b|^back squat|^front squat|^bench press|close-grip bench|trap bar|power clean|hang clean|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^deadlift|^pendlay|^hip thrust$/.test(N)) c.add('BARBELL');
  if(/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if(/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if(/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|preacher/.test(N)) c.add('MACHINE');
  if(/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  return c; }
const TIERS = Object.keys(OWNS);
const denied = (t, n) => [...CLASS(n)].filter(c => OWNS[t][c] === 0);
const legal = (t, n) => denied(t, n).length === 0;
const DENIED_T = ['crossfit', 'home_full', 'home_basic'];   // own dumbbells, not cables: where the fallback lands
const SWAPS = { shoulder: { 'Dumbbell bench press':'Dumbbell floor press' },
                elbow:    { 'Dumbbell skullcrushers':'Cable pushdown', 'Barbell curl':'Dumbbell hammer curl', 'Preacher curl':'Cable curl' } };
const FALLBACK = { 'Cable pushdown':'Close-grip pushups' };
const EXPECT = (t, s, to) => legal(t, s) ? (legal(t, to) ? to : (FALLBACK[to] || to)) : s;
const LIT = [   // the cells the ruling names, typed
  ['commercial', 'Dumbbell skullcrushers', 'Cable pushdown'], ['crossfit', 'Dumbbell skullcrushers', 'Close-grip pushups'],
  ['home_full', 'Dumbbell skullcrushers', 'Close-grip pushups'], ['home_basic', 'Dumbbell skullcrushers', 'Close-grip pushups'],
  ['bodyweight', 'Dumbbell skullcrushers', 'Dumbbell skullcrushers'], ['bodyweight', 'Dumbbell bench press', 'Dumbbell bench press'],
  ['home_basic', 'Dumbbell bench press', 'Dumbbell floor press'], ['crossfit', 'Preacher curl', 'Preacher curl'],
  ['commercial', 'Preacher curl', 'Cable curl'], ['home_basic', 'Barbell curl', 'Barbell curl'], ['home_full', 'Barbell curl', 'Dumbbell hammer curl'] ];
const COPY = 'Straight bar work moves to neutral grips. Skullcrushers become pushdowns, or close grip pushups where there is no cable. Dips and carries are out. Pressing holds RPE 7.';

// ── U: the renamer, one item at a time ───────────────────────────────────────────────────
{ const bad = [];
  ['crossfit','home_full','home_basic','bodyweight'].forEach(t => { if(legal(t, 'Cable pushdown')) bad.push(t + ' owns Cable pushdown'); });
  if(!legal('commercial', 'Cable pushdown')) bad.push('commercial denies Cable pushdown');
  TIERS.forEach(t => { if(!legal(t, 'Close-grip pushups')) bad.push(t + ' denies Close-grip pushups'); });
  LIT.forEach(([t, s, want]) => { const r = Object.keys(SWAPS).find(k => SWAPS[k][s]); const e = EXPECT(t, s, SWAPS[r][s]); if(e !== want) bad.push(t + ' ' + s + ' computes ' + e + ' typed ' + want); });
  ok('U0 fixture: the hand table puts the fallback on the no-cable tiers and the typed cells agree with the rule', !bad.length, bad.join('; ')); }
{ const injuryPlan = IA.eval('injuryPlan'); const got = {};
  Object.keys(SWAPS).forEach(r => { const P = injuryPlan({ injury:{ region:r, tier:'workaround' } }); got[r] = P && P.swapNames; });
  const others = []; ['lowback','hip','knee','ankle','shoulder','elbow'].forEach(r => ['workaround','protect'].forEach(ti => {
    if(ti === 'workaround' && SWAPS[r]) return; const P = injuryPlan({ injury:{ region:r, tier:ti } }); if(P && P.swapNames) others.push(r + '/' + ti); }));
  ok('U1 injuryPlan swapNames are exactly the ruled pairs (shoulder and elbow workaround, nowhere else)',
     JSON.stringify(got) === JSON.stringify(SWAPS) && !others.length, JSON.stringify(got) + ' others ' + others.join(',')); }
{ const fl = (t, r, s) => { const o = IA.applyInjuryFilter([{ label:'Main — ' + s, items:[{ name:s, detail:'3×10' }] }], { equipment:t, injury:{ region:r, tier:'workaround' } });
    const it = o && o[0] && o[0].items && o[0].items[0]; return it ? { name:it.name, label:o[0].label } : { name:'(dropped)', label:'' }; };
  const u3bad = {};
  TIERS.forEach(t => { const bad = [];
    Object.keys(SWAPS).forEach(r => Object.keys(SWAPS[r]).forEach(s => { const want = EXPECT(t, s, SWAPS[r][s]), g = fl(t, r, s);
      if(g.name !== want || g.label !== 'Main — ' + want) bad.push(s + ' -> ' + g.name + ' [' + g.label + '] want ' + want);
      if(legal(t, s) && !legal(t, g.name)) (u3bad[t] = u3bad[t] || []).push(s + ' -> ' + g.name); }));
    ok('U2 ' + t + ': every swap source prints as the ruled rule says, and the heading follows it', !bad.length, bad.join('; ')); });
  TIERS.forEach(t => ok('U3 ' + t + ': every rename of a gear legal source is gear legal', !u3bad[t], (u3bad[t] || []).join('; '))); }

// ── lattice ──────────────────────────────────────────────────────────────────────────────
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const clone = v => JSON.parse(JSON.stringify(v));
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
const CELLS = [];
// L1: g210's injury cells (every plan, hypertrophy). L2: both swap plans x 7 focuses x 3 exp x 8 seeds.
for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++) for(const r of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const ti of ['workaround','protect'])
  CELLS.push({ k:['L1',eq,r,ti,si].join('|'), eq, plan:r + '/' + ti, cfg:mk(eq,'hypertrophy',EXPS[si % 3],AGES[si % 3],si,{ region:r, tier:ti }) });
for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++) for(const f of FOC) for(const e of EXPS) for(const r of ['elbow','shoulder'])
  CELLS.push({ k:['L2',eq,f,e,r,si].join('|'), eq, plan:r + '/workaround', cfg:mk(eq,f,e,AGES[(si + EXPS.indexOf(e)) % 3],si,{ region:r, tier:'workaround' }) });
const isSwap = c => c.plan === 'elbow/workaround' || c.plan === 'shoulder/workaround';

// baseline for the pair rows
const PAIR = VER === ERA;
let V215 = null, v215err = null;
if(PAIR){
  try {
    let srcFile = null;
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 215) srcFile = BASEFILE; else v215err = 'argv[3] reads ' + b.version; }
    TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g216-'));
    if(!srcFile){ srcFile = path.join(TMP, 'v215.html');
      fs.writeFileSync(srcFile, cp.execFileSync('git', ['show', V215_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 26 })); }
    // graft D156 (the ruling's predicate, typed) onto V215 so the pair rows see D154 alone
    const src = fs.readFileSync(srcFile, 'utf8');
    const A = 'const _longDay=!!(_c&&_c.subtype&&(', n = src.split(A).length - 1;
    if(n !== 1) v215err = 'D156 graft anchor count ' + n + ' in ' + srcFile;
    else { const g = path.join(TMP, 'v215_d156.html');
      fs.writeFileSync(g, src.replace(A, () => "const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&("));
      V215 = load(g); if(+V215.version !== 215){ v215err = 'V215 graft reads ' + V215.version; V215 = null; } }
  } catch(e){ v215err = String(e && e.message || e).slice(0, 200); V215 = null; }
}

const DEN = {}, CGP = {}, SKULL = {}, CPC = {}, DUP = {}, DUPEX = [], Q = { bw:[0,0], com:[0,0], noswap:[0,0] }, QEX = { bw:[], com:[], noswap:[] };
let built = 0, crashed = 0; const crashEx = [];
const flat = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => clean(i.name))));
// Q4 classes, by name and detail only (see the header). CAL is the calendar order the spacing pass walks.
const CAL = ['sun','mon','tue','wed','thu','fri','sat'];
const prevDay = (p, w, d) => { const i = CAL.indexOf(d); return i > 0 ? (p.weeks[w] || {})[CAL[i - 1]] : (p.weeks[+w - 1] || {}).sat; };
const itemsOf = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => ({ n:clean(i.name), d:String(i.detail || '') }))));
const labelsOf = y => ((y && y.sections) || []).map(s => String(s.label || ''));
const sub = t => t.split('Cable pushdown').join('Close-grip pushups');
function klass(x, y, prevY){
  if(x.title !== y.title) return null;
  const ix = itemsOf(x), iy = itemsOf(y), nx = ix.map(a => a.n), ny = iy.map(a => a.n);
  const same = (a, b) => a.n === b.n && a.d === b.d;
  if(ix.length === iy.length && nx.includes('Cable pushdown') && JSON.stringify(labelsOf(x).map(sub)) === JSON.stringify(labelsOf(y))
     && ix.every((a, i) => a.n === 'Cable pushdown' ? iy[i].n === 'Close-grip pushups' : same(a, iy[i]))) return 'A';
  // B: take V215's Cable pushdown out and the one press V215 did not print out of this build's day
  // (capRegionalFatigue kept it once the pushups took the cut); the rest must match in order.
  if(ix.length === iy.length && nx.includes('Cable pushdown') && !ny.includes('Close-grip pushups') && JSON.stringify(labelsOf(x)) === JSON.stringify(labelsOf(y))){
    const rx = ix.filter((a, i) => i !== nx.indexOf('Cable pushdown')).map(a => a.n + '|' + a.d);
    const adds = iy.map((a, j) => j).filter(j => /press|pushups?\b/i.test(ny[j]) && !nx.includes(ny[j]));
    if(adds.length === 1 && JSON.stringify(rx) === JSON.stringify(iy.filter((a, j) => j !== adds[0]).map(a => a.n + '|' + a.d))) return 'B';
  }
  if(ix.length === iy.length && !nx.includes('Cable pushdown') && JSON.stringify(labelsOf(x)) === JSON.stringify(labelsOf(y))){
    const diff = ix.map((a, i) => i).filter(i => !same(ix[i], iy[i]));
    if(diff.length === 1 && ny[diff[0]] === 'Close-grip pushups' && /tricep|extension/i.test(nx[diff[0]])
       && prevY && itemsOf(prevY).some(a => a.n === 'Close-grip pushups')) return 'C';
  }
  return null;
}
const Q4 = {}, Q4X = [];
CELLS.forEach(c => {
  let p; try { p = IA.buildProgram(clone(c.cfg)); built++; } catch(e){ crashed++; if(crashEx.length < 3) crashEx.push(c.k + ': ' + e.message); return; }
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => { const y = p.weeks[w][d]; if(!y) return; const nm = flat(y);
    if(isSwap(c)){
      nm.forEach(n => { if(!legal(c.eq, n)) bump(DEN, c.eq); });
      if(nm.filter(n => n === 'Close-grip pushups').length > 1){ bump(DUP, c.eq); if(DUPEX.length < 3) DUPEX.push(c.k + ' W' + w + ' ' + d); }
      if(c.plan === 'elbow/workaround'){ nm.forEach(n => { if(n === 'Close-grip pushups') bump(CGP, c.eq); if(n === 'Dumbbell skullcrushers') bump(SKULL, c.eq); if(n === 'Cable pushdown') bump(CPC, c.eq); }); }
    } }));
  if(!PAIR || !V215) return;
  const lane = c.eq === 'bodyweight' ? 'bw' : c.eq === 'commercial' ? 'com' : !isSwap(c) ? 'noswap' : null;
  if(lane === null && !(c.plan === 'elbow/workaround' && DENIED_T.includes(c.eq))) return;
  let b; try { b = V215.buildProgram(clone(c.cfg)); } catch(e){ if(lane){ Q[lane][1]++; QEX[lane].push(c.k + ' V215 crash'); } return; }
  if(lane){ Q[lane][0]++; if(JSON.stringify(b.weeks) !== JSON.stringify(p.weeks)){ Q[lane][1]++; if(QEX[lane].length < 3) QEX[lane].push(c.k); } return; }
  // Q4: every changed elbow/workaround day on the three no-cable tiers is class A, B or C
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => { const y = p.weeks[w][d], x = b.weeks[w] && b.weeks[w][d]; if(!y && !x) return;
    if(JSON.stringify(x) === JSON.stringify(y)) return;
    const k = (x && y) ? klass(x, y, prevDay(p, w, d)) : null;
    bump(Q4, c.eq + '|' + (k || 'X')); if(!k && Q4X.filter(e => e.indexOf('|' + c.eq + '|') >= 0).length < 3) Q4X.push(c.k + ' W' + w + ' ' + d); }));
});
ok('P0 every lattice config builds (' + CELLS.length + ')', built === CELLS.length && !crashed, crashed + ' crashed ' + crashEx.join('; '));
DENIED_T.concat(['bodyweight']).forEach(t => ok('P1 ' + t + ': elbow and shoulder workaround programs print no item the tier does not own', !DEN[t], DEN[t] || 0));
DENIED_T.forEach(t => ok('P2 ' + t + ': the elbow swap lands as Close-grip pushups and Dumbbell skullcrushers never prints',
  (CGP[t] || 0) > 0 && !SKULL[t] && !CPC[t], 'Close-grip pushups ' + (CGP[t] || 0) + ', skullcrushers ' + (SKULL[t] || 0) + ', Cable pushdown ' + (CPC[t] || 0)));
ok('P3 commercial: Cable pushdown still prints on elbow workaround cards', (CPC.commercial || 0) > 0, CPC.commercial || 0);
ok('P4 no day prints Close-grip pushups twice (swap cells, every tier)', !Object.keys(DUP).length, JSON.stringify(DUP) + ' ' + DUPEX.join('; '));
if(!PAIR){ ['Q1','Q2','Q3','Q4'].forEach(r => skipRow(r + ' pair row: candidate ' + VER + ' is not 216')); }
else if(!V215){ ['Q1','Q2','Q3','Q4'].forEach(r => ok(r + ' pair row needs V215∘D156', false, v215err)); }
else {
  ok('Q1 PAIR bodyweight: every program byte-identical to V215∘D156 (' + Q.bw[0] + ' configs)', Q.bw[0] > 0 && !Q.bw[1], Q.bw[1] + ' differ ' + QEX.bw.join('; '));
  ok('Q2 PAIR commercial: every program byte-identical to V215∘D156 (' + Q.com[0] + ' configs)', Q.com[0] > 0 && !Q.com[1], Q.com[1] + ' differ ' + QEX.com.join('; '));
  ok('Q3 PAIR plans with no swapNames: every program byte-identical to V215∘D156 (' + Q.noswap[0] + ' configs)', Q.noswap[0] > 0 && !Q.noswap[1], Q.noswap[1] + ' differ ' + QEX.noswap.join('; '));
  const q = (t, k) => Q4[t + '|' + k] || 0;
  DENIED_T.forEach(t => ok('Q4 PAIR ' + t + ': every changed elbow/workaround day is the swap as ruled (A ' + q(t, 'A') + ') or a coach-accepted class (B trimmed downstream ' + q(t, 'B') + ', C spacing pass skips the pushups ' + q(t, 'C') + ')',
    q(t, 'A') > 0 && !q(t, 'X'), 'unclassified ' + q(t, 'X') + ' ' + Q4X.filter(e => e.indexOf('|' + t + '|') >= 0).join('; ')));
  console.log('CENSUS (named classes, B and C accepted by coach, not failures):');
  DENIED_T.forEach(t => console.log('   ' + t + ': A ' + q(t, 'A') + '  B ' + q(t, 'B') + '  C ' + q(t, 'C') + '  unclassified ' + q(t, 'X')));
}

// ── copy ─────────────────────────────────────────────────────────────────────────────────
{ let s = null; try { s = IA.eval('_INJ_EFFECT').elbow.workaround; } catch(e){ s = 'ERR ' + e.message; }
  ok('C1 elbow/workaround copy is the ruled sentence', s === COPY, JSON.stringify(s));
  ok('C2 elbow/workaround copy carries no hyphen or dash', typeof s === 'string' && !/[-‐‑–—]/.test(s), JSON.stringify(s)); }

// ── fixture ──────────────────────────────────────────────────────────────────────────────
{ const d = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));
  ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', d === HM_DIGEST, d); }
done();
