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
//   HM   HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a
//        conjunct (no injury on the fixture; ruled unmoved; V231 absorb ruling section 4).
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
const { load, progDigest, fixtures, DAYS, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const IA = load(ART);
const VER = +IA.version, ERA = 216;
const ROWS = ['U0','U1','U2','U3','P1','P2','P3','P4','C1','C2','HM'];
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

const DEN = {}, CGP = {}, SKULL = {}, CPC = {}, DUP = {}, DUPEX = [];
let built = 0, crashed = 0; const crashEx = [];
const flat = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => clean(i.name))));
CELLS.forEach(c => {
  let p; try { p = IA.buildProgram(clone(c.cfg)); built++; } catch(e){ crashed++; if(crashEx.length < 3) crashEx.push(c.k + ': ' + e.message); return; }
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => { const y = p.weeks[w][d]; if(!y) return; const nm = flat(y);
    if(isSwap(c)){
      nm.forEach(n => { if(!legal(c.eq, n)) bump(DEN, c.eq); });
      if(nm.filter(n => n === 'Close-grip pushups').length > 1){ bump(DUP, c.eq); if(DUPEX.length < 3) DUPEX.push(c.k + ' W' + w + ' ' + d); }
      if(c.plan === 'elbow/workaround'){ nm.forEach(n => { if(n === 'Close-grip pushups') bump(CGP, c.eq); if(n === 'Dumbbell skullcrushers') bump(SKULL, c.eq); if(n === 'Cable pushdown') bump(CPC, c.eq); }); }
    } }));
});
ok('P0 every lattice config builds (' + CELLS.length + ')', built === CELLS.length && !crashed, crashed + ' crashed ' + crashEx.join('; '));
DENIED_T.concat(['bodyweight']).forEach(t => ok('P1 ' + t + ': elbow and shoulder workaround programs print no item the tier does not own', !DEN[t], DEN[t] || 0));
DENIED_T.forEach(t => ok('P2 ' + t + ': the elbow swap lands as Close-grip pushups and Dumbbell skullcrushers never prints',
  (CGP[t] || 0) > 0 && !SKULL[t] && !CPC[t], 'Close-grip pushups ' + (CGP[t] || 0) + ', skullcrushers ' + (SKULL[t] || 0) + ', Cable pushdown ' + (CPC[t] || 0)));
ok('P3 commercial: Cable pushdown still prints on elbow workaround cards', (CPC.commercial || 0) > 0, CPC.commercial || 0);
ok('P4 no day prints Close-grip pushups twice (swap cells, every tier)', !Object.keys(DUP).length, JSON.stringify(DUP) + ' ' + DUPEX.join('; '));
// Q1, Q2, Q3 and Q4 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). They defended D154: bodyweight, commercial and no-swap programs byte-identical to V215 with D156 grafted, and every changed elbow/workaround day on a no-cable tier is the swap as ruled or a coach-accepted class.

// ── copy ─────────────────────────────────────────────────────────────────────────────────
{ let s = null; try { s = IA.eval('_INJ_EFFECT').elbow.workaround; } catch(e){ s = 'ERR ' + e.message; }
  ok('C1 elbow/workaround copy is the ruled sentence', s === COPY, JSON.stringify(s));
  ok('C2 elbow/workaround copy carries no hyphen or dash', typeof s === 'string' && !/[-‐‑–—]/.test(s), JSON.stringify(s)); }

// ── fixture ──────────────────────────────────────────────────────────────────────────────
// V231 MAINTENANCE (tests/measure/v231_rulings/v231_absorb_ruling.md section 4; standing rulings 3, 4 and 5):
// this row defends D154's claim "my ruling did not move HALF_MANNY". The literal it compared
// against went: the only object that carries that claim across later rulings is the era table that
// standing ruling 5 governs, so the row reads MANNY_DIGEST_BY_VERSION[+IA.version], fails loudly when that
// row is absent (row existence is a conjunct), and compares the built digest to it. Re-pointing the literal
// to a later digest would be the vacuous line standing ruling 3 forbids; the row stays keyed to
// D154 (standing ruling 4).
{ const hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));
  const eraV = +IA.version, eraHas = Object.prototype.hasOwnProperty.call(MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? MANNY_DIGEST_BY_VERSION[eraV] : undefined;
  ok('HM HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[' + eraV + '] = ' + eraRow + ' (ruled unmoved)',
     eraHas && typeof eraRow === 'string' && /^[0-9a-f]{16}$/.test(eraRow) && hm === eraRow, hm + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT')); }
done();
