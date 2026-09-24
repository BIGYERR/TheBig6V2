// g215_d149_ghd.js — GATE for D149 (coach; Mario: no GHD at a home gym): THE GHD IS A STATION,
// and coach's two floors that keep knee/protect whole on the tier that loses it.
//
//   node tests/gates/g215_d149_ghd.js [candidate] [baseline V214]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D149  Glute-ham raise, GHR and 45° back extension are the GHD station. Commercial and crossfit
//         own one; home_full, home_basic and bodyweight do not. No GHD name prints, sits in the swap
//         universe, is offered by the swap sheet or reaches a travel variant on a tier without the
//         station. The sidecar lens (the aux swap sheet's gear check) agrees. The ankle/protect and
//         hip/protect literals read the station too: hip/protect gets Bodyweight back extension off it.
//   floor (a)  knee/protect squat pool on a barbell tier: the gear-filtered list gets Single-leg glute
//         bridge appended ONLY when it holds fewer than 2 names.
//   floor (b)  the knee/protect hip-extension reservation: when it empties, Bodyweight back extension
//         is appended instead of the slot vanishing. The lunge literal holds the same name, so _slot's
//         drop still removes it on a same-day collision. Coach: empty is worse than a duplicate drop.
//         Coach ruled the drop rate stands (69.1% of home_full knee/protect reads at V215): "a floor
//         is a floor, not a draw". P1 prints it and never asserts it.
//
// ORACLES, independent of the engine. _gearOK is never called; hasGHD is never read:
//   OWNS   the inventory typed from the ruling: GHD 1 on commercial and crossfit, 0 elsewhere.
//          BARBELL and CABLE typed from the tier copy g210 O1 checks.
//   CLASS  a GHD name by its NAME: /glute[- ]ham|ghr|ghd|45° back extension|roman chair/ (g210 O2).
//   FIRE   where each floor must fire, computed HERE from OWNS and the ruled literals typed by hand
//          (the knee/protect squat literal and each tier's hip-extension inventory). Both come out
//          {home_full}; F0 pins that the hand table says so.
//   FIRES  observed by counterfactual: a copy of the candidate with ONE floor written out
//          (append nothing). The floor fired on a config iff the two programs differ. A floor that
//          is not in the candidate as ruled fails its row loudly (anchor count printed).
//   EMPTY  observed by a probe copy: one line after the reservation is read records the pool's length
//          and whether the slot drew. The probe copy is proven digest-identical to the candidate.
//   LENS   the aux lens (_auxGearOK) asked directly for each GHD name on each tier, OWNS the answer.
//          Asked because no aux family or core pillar holds a GHD name today, so no card can show it.
//   V214   the shipped artifact (argv[3] when it reads 214, else git 978b0b5) for the pair rows.
//
// ROWS
//   G1   no GHD item prints on a GHD-denied tier (every lattice, travel included), per tier.
//   G1v  GHD items still print on commercial and on crossfit (a ruling that selects does not delete).
//   G1h  hip/protect (D149-D4b). The plan sits hip extension out on the card, so its literal reaches
//        the athlete through the swap universe only: 45° back extension is in the hip/protect universe
//        on commercial and crossfit, and Bodyweight back extension (never a GHD name) on each denied tier.
//   G2   no GHD name in a denied tier's _swapUniverse; the universe is non-empty; commercial and
//        crossfit universes still carry one.
//   G3   swapCandidates offers no GHD name on a denied tier (healthy and injured cells); calls and
//        candidates non-zero; commercial and crossfit still offer one.
//   G4   travel variants (cfg._travel): no GHD item or universe name on a denied tier; all build.
//   L1   the aux lens answers every GHD name per OWNS on every tier.
//   F0   fixture: the hand table puts floor (a) and floor (b) on {home_full} and nowhere else.
//   F1   floor (a) fires on every FIRE tier and on no other (counterfactual, knee/protect lattice).
//   F1o  knee/protect legs Main on the barbell tiers is in the hand set (owned literal, floored to 2);
//        home_full reaches Single-leg glute bridge there.
//   F2   floor (b) fires on every FIRE tier and on no other (counterfactual, knee/protect lattice).
//   F2o  knee/protect Leg superset B's hip-extension item is in the tier's hand remainder (floored);
//        home_full reaches it.
//   P1   knee/protect: the hip-extension reservation is never empty on any tier (probe). The slot's
//        collision drop rate is printed per tier, never asserted: coach ruled it acceptable.
//   K1   PAIR. knee/protect: no section lost vs V214 on any tier (label counts per day).
//   K2   PAIR. commercial and crossfit programs byte-identical to V214 (progDigest), knee/protect
//        lattice and the GHD lattice.
//   K3   knee/protect: no day prints the same movement twice.
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (crossfit owns the station; ruled unmoved).
//
// VERSION PREDICATE (standing ruling 4). D149 ships on ia-version 215.
//   below 215: NOT APPLICABLE, every row skipped by name, clean exit.
//   K1 and K2 say "this build moved only what D149 moves", so they run only on candidate 215 against
//   baseline 214 and SKIP by name on every other pair. Every other row is ruling-level from 215 up.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 215, V214_COMMIT = '978b0b56bd5c2470972146d618d64292ca48a241';
const HM_DIGEST = '0ac7da6b1691a8e1';
const ROWS = ['G1','G1v','G1h','G2','G3','G4','L1','F0','F1','F1o','F2','F2o','P1','K1','K2','K3','HM'];
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D149 (V' + ERA + ').'); ROWS.forEach(r => skipRow(r + ' below the D149 era')); done(); }

// ── oracles ──────────────────────────────────────────────────────────────────────────────
const OWNS = {
  commercial: { BARBELL:1, CABLE:1, GHD:1 },
  crossfit:   { BARBELL:1, CABLE:0, GHD:1 },
  home_full:  { BARBELL:1, CABLE:0, GHD:0 },
  home_basic: { BARBELL:0, CABLE:0, GHD:0 },
  bodyweight: { BARBELL:0, CABLE:0, GHD:0 },
};
const TIERS = Object.keys(OWNS), DENIED = TIERS.filter(t => !OWNS[t].GHD), HAS = TIERS.filter(t => OWNS[t].GHD);
const BAR_TIERS = TIERS.filter(t => OWNS[t].BARBELL);
const GHD = n => /glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/i.test(n);
// the ruled literals, each name's implement typed by hand (null = no implement to own)
const KP_SQUAT_BAR = [['Barbell hip thrust','BARBELL'],['45° back extension','GHD'],['Cable pull-through','CABLE']];
const KP_SQUAT_NOBAR = ['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];
const HIPEXT_INV = { // each tier's hip-extension inventory before the injury plan (the ruled pools)
  bar:   [['Barbell hip thrust','BARBELL'],['Glute-ham raise','GHD'],['45° back extension','GHD'],['Cable pull-through','CABLE'],['Single-leg hip thrust',null]],
  home_basic: [['Banded hip thrust',null],['Single-leg glute bridge (weighted)',null],['Nordic hamstring curl (anchored)',null],['Bodyweight back extension',null]],
  bodyweight: [['Single-leg glute bridge',null],['Bodyweight back extension',null],['Single-leg hip thrust (shoulders on bed)',null],['Nordic hamstring curl (anchored)',null]],
};
const owned = (t, list) => list.filter(([, c]) => c === null || OWNS[t][c] === 1).map(([n]) => n);
const handA = t => { if(!OWNS[t].BARBELL) return { set: KP_SQUAT_NOBAR, fires: false };
  const s = owned(t, KP_SQUAT_BAR); return s.length < 2 ? { set: s.concat(['Single-leg glute bridge']), fires: true } : { set: s, fires: false }; };
const handB = t => { const inv = owned(t, OWNS[t].BARBELL ? HIPEXT_INV.bar : HIPEXT_INV[t]);
  const left = inv.filter(n => !/nordic|glute-ham|\bghr\b/i.test(n)).filter(n => !/hip thrust|glute bridge/i.test(n));
  return left.length ? { set: left, fires: false } : { set: ['Bodyweight back extension'], fires: true }; };
const FIRE_A = TIERS.filter(t => handA(t).fires), FIRE_B = TIERS.filter(t => handB(t).fires);

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const clone = v => JSON.parse(JSON.stringify(v));
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
// the GHD lattice: 5 tiers x 8 seeds x (7 healthy foci + 6 regions x 2 injury tiers) = 760
const LAT_G = [];
for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++){
  FOC.forEach((f, fi) => LAT_G.push({ eq, si, inj:null, cfg: mk(eq, si + fi, f, EXPS[(si + fi) % 3], AGES[(si + 2 * fi) % 3], si, null) }));
  REG.forEach((r, ri) => ITIER.forEach((t, ti) => LAT_G.push({ eq, si, inj:{ region:r, tier:t },
    cfg: mk(eq, si + ri, FOC[(si + ri + ti) % 7], EXPS[(si + ri) % 3], AGES[(si + ti) % 3], si, { region:r, tier:t }) })));
}
// the knee/protect lattice: 5 tiers x 6 goals x 7 foci x 3 experiences = 630 (seed, age, rest alternate)
const LAT_K = [];
for(const eq of TIERS) GOALS.forEach((_, gi) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => { const si = (gi + fi + ei) % 2;
  LAT_K.push({ eq, cfg: mk(eq, gi, f, e, si ? '55+' : '18-35', si, { region:'knee', tier:'protect' }) }); })));
// travel: 5 tiers x 8 seeds x 2 foci healthy, plus seeds 0-1 x the three literal-bearing protect plans
const LAT_T = [];
for(const eq of TIERS){ for(let si = 0; si < SEEDS.length; si++) ['hypertrophy','balanced'].forEach((f, fi) => LAT_T.push({ eq, cfg: mk(eq, si + fi, f, EXPS[si % 3], AGES[si % 3], si, null) }));
  for(let si = 0; si < 2; si++) ['ankle','hip','knee'].forEach(r => LAT_T.push({ eq, cfg: mk(eq, si, 'hypertrophy', EXPS[si], AGES[si], si, { region:r, tier:'protect' }) })); }
LAT_T.forEach(x => { x.cfg._travel = true; });

// ── artifacts: the candidate, two counterfactuals, the probe, V214 ───────────────────────
TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g215-'));
const cnt = (s, a) => s.split(a).length - 1;
const FA_FROM = "_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge')";
const FA_TO   = "_gear(['Barbell hip thrust','45° back extension','Cable pull-through'])";
const FB_FROM = "(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left";
const FB_TO   = "_left";
const PR_AT   = "    const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,'lower',true)[0]||null):null;";
const PR_ADD  = "\n    if(globalThis.__G215) globalThis.__G215.push([hipExtPool.length, hipExtSel===null?0:1]);";
function variant(tag, from, to){
  const c = cnt(IA.html, from); if(c !== 1) return { c };
  const f = path.join(TMP, tag + '.html'); fs.writeFileSync(f, IA.html.replace(from, () => to)); return { c, IA: load(f) };
}
const CF_A = variant('cfA', FA_FROM, FA_TO), CF_B = variant('cfB', FB_FROM, FB_TO), PROBE = variant('probe', PR_AT, PR_AT + PR_ADD);
let V214 = null, v214err = '';
if(VER === ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 214) V214 = b; }
    if(!V214){ const f = path.join(TMP, 'v214.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V214_COMMIT + ':index.html'], { cwd: ROOT, maxBuffer: 1 << 26 }));
      V214 = load(f); if(+V214.version !== 214){ v214err = 'git ' + V214_COMMIT.slice(0, 7) + ' reads ' + V214.version; V214 = null; } }
  } catch(e){ v214err = String(e.message).slice(0, 160); V214 = null; }
}
const PAIR = VER === ERA;
console.log('candidate ia-version ' + VER + '; pair rows ' + (PAIR ? (V214 ? 'against V214' : 'UNAVAILABLE: ' + v214err) : 'skipped (pair 215/214 only)'));
console.log('hand FIRE_A ' + JSON.stringify(FIRE_A) + ' FIRE_B ' + JSON.stringify(FIRE_B));
const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
const candNames = r => { const out = []; if(!r) return out;
  (Array.isArray(r) ? [r] : Object.values(r).filter(Array.isArray)).forEach(a => a.forEach(c => { const n = clean(typeof c === 'string' ? c : (c && c.name)); if(n) out.push(n); })); return out; };

// ── the GHD lattice + travel ─────────────────────────────────────────────────────────────
const S = { items:{}, uni:{}, uniSize:{}, sw:{}, swCalls:{}, swCands:{}, hip:{}, tItems:{}, tUni:{}, tUniSize:{}, ex:{} };
let built = 0, crash = 0, swCrash = 0, tBuilt = 0, tCrash = 0, k2g = 0, k2gN = 0; const k2gEx = [];
function scanItems(p, eq, into){
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => live(p.weeks[w][d]).forEach(s => s.items.forEach(it => { const n = clean(it.name);
    if(GHD(n)){ bump(into, eq); if(!OWNS[eq].GHD && !S.ex[eq]) S.ex[eq] = n + ' W' + w + ' ' + d; }
  }))));
}
for(const x of LAT_G){
  let p; try { p = IA.buildProgram(clone(x.cfg)); } catch(e){ crash++; continue; } built++;
  scanItems(p, x.eq, S.items);
  const u = p._swapUniverse || []; bump(S.uniSize, x.eq, u.length); u.forEach(n => { if(GHD(clean(n))) bump(S.uni, x.eq); });
  if(x.inj && x.inj.region === 'hip' && x.inj.tier === 'protect') u.forEach(n => { n = clean(n); if(/back extension/i.test(n)) bump(S.hip, x.eq + '|' + n); });
  if(x.si < 2){ const asked = new Set();
    Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => { const day = p.weeks[w][d]; live(day).forEach(s => s.items.forEach(it => { const n = clean(it.name);
      if(asked.has(n)) return; asked.add(n); let cs; try { cs = candNames(swapCandidates(it.name, day, w, p)); } catch(e){ swCrash++; return; }
      bump(S.swCalls, x.eq); bump(S.swCands, x.eq, cs.length); cs.forEach(c => { if(GHD(c)) bump(S.sw, x.eq); }); })); })); }
  if(PAIR && V214 && OWNS[x.eq].GHD){ k2gN++; let b; try { b = V214.buildProgram(clone(x.cfg)); } catch(e){ b = null; }
    if(!b || progDigest(b) !== progDigest(p)){ k2g++; if(k2gEx.length < 3) k2gEx.push(x.eq + ' ' + (x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy') + ' seed ' + SEEDS[x.si]); } }
}
for(const x of LAT_T){
  let p; try { p = IA.buildProgram(clone(x.cfg)); } catch(e){ tCrash++; continue; } tBuilt++;
  scanItems(p, x.eq, S.tItems);
  const u = p._swapUniverse || []; bump(S.tUniSize, x.eq, u.length); u.forEach(n => { if(GHD(clean(n))) bump(S.tUni, x.eq); });
}
console.log('GHD lattice ' + built + ' of ' + LAT_G.length + ' built (' + crash + ' crashed); travel ' + tBuilt + ' of ' + LAT_T.length + ' (' + tCrash + ' crashed)');

// ── the knee/protect lattice ─────────────────────────────────────────────────────────────
const K = { cfg:{}, crash:0, fa:{}, fb:{}, probeBad:0, pr:{}, loss:{}, lossEx:[], dup:{}, dupEx:[], k2:0, k2N:0, k2Ex:[],
            main:{}, mainBad:{}, mainEx:[], lsb:{}, lsbBad:{}, lsbEx:[], hx:{} };
const HX = /hip thrust|glute bridge|back extension|glute-ham|pull-through/i;
for(const x of LAT_K){
  const t = x.eq; bump(K.cfg, t);
  let p; try { p = IA.buildProgram(clone(x.cfg)); } catch(e){ K.crash++; continue; }
  const dg = progDigest(p);
  if(CF_A.IA){ try { if(progDigest(CF_A.IA.buildProgram(clone(x.cfg))) !== dg) bump(K.fa, t); } catch(e){ bump(K.fa, t + '|CRASH'); } }
  if(CF_B.IA){ try { if(progDigest(CF_B.IA.buildProgram(clone(x.cfg))) !== dg) bump(K.fb, t); } catch(e){ bump(K.fb, t + '|CRASH'); } }
  if(PROBE.IA){ PROBE.IA.ctx.__G215 = []; let q; try { q = PROBE.IA.buildProgram(clone(x.cfg)); } catch(e){ q = null; }
    if(!q || progDigest(q) !== dg) K.probeBad++;
    PROBE.IA.ctx.__G215.forEach(([len, drew]) => { bump(K.pr, t + '|calls'); if(!len) bump(K.pr, t + '|empty'); else if(!drew) bump(K.pr, t + '|dropped'); }); }
  let b = null; if(PAIR && V214){ try { b = V214.buildProgram(clone(x.cfg)); } catch(e){ b = null; } }
  if(PAIR && V214 && OWNS[t].GHD){ K.k2N++; if(!b || progDigest(b) !== dg){ K.k2++; if(K.k2Ex.length < 3) K.k2Ex.push(t + ' ' + x.cfg.liftingFocus + ' ' + x.cfg.cardioGoals.run.id); } }
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d], secs = live(day), names = [];
    secs.forEach(s => s.items.forEach(it => names.push(clean(it.name))));
    bump(K.hx, t, names.filter(n => HX.test(n)).length);
    const seen = {}; const dn = names.find(n => { const r = seen[n]; seen[n] = 1; return r; });
    if(dn){ bump(K.dup, t); if(K.dupEx.length < 3) K.dupEx.push(t + ' W' + w + ' ' + d + ' ' + dn); }
    if(b){ const d0 = b.weeks[w] && b.weeks[w][d]; const m = {}; live(d0).forEach(s => bump(m, stem(s), -1)); secs.forEach(s => bump(m, stem(s), 1));
      Object.entries(m).forEach(([l, v]) => { if(v < 0){ bump(K.loss, t, -v); if(K.lossEx.length < 4) K.lossEx.push(t + ' W' + w + ' ' + d + ' lost ' + l); } }); }
    const lsb = secs.find(s => s.label === 'Leg superset B'); if(!lsb) return;
    bump(K.lsb, t + '|' + lsb.items.length);
    if(lsb.items[1]){ const n = clean(lsb.items[1].name); if(!handB(t).set.includes(n)){ bump(K.lsbBad, t); if(K.lsbEx.length < 3) K.lsbEx.push(t + ' ' + n); } }
    if(OWNS[t].BARBELL){ const mn = secs.find(s => /^Main — /.test(s.label || '')); if(mn){ const n = clean(mn.items[0].name); bump(K.main, t + '|' + n);
      if(!handA(t).set.includes(n)){ bump(K.mainBad, t); if(K.mainEx.length < 3) K.mainEx.push(t + ' ' + n); } } }
  }));
}
console.log('knee/protect lattice ' + LAT_K.length + ' configs, ' + K.crash + ' crashed');

// ── rows ─────────────────────────────────────────────────────────────────────────────────
const g = (o, k) => o[k] || 0;
DENIED.forEach(t => ok('G1 ' + t + ' prints no GHD station item (GHD lattice, knee/protect lattice and travel)',
  crash === 0 && g(S.items, t) === 0 && g(S.tItems, t) === 0, g(S.items, t) + ' + travel ' + g(S.tItems, t) + (S.ex[t] ? ' e.g. ' + S.ex[t] : '') + ', ' + crash + ' crashed'));
HAS.forEach(t => ok('G1v ' + t + ' still prints GHD station items', g(S.items, t) > 0, g(S.items, t)));
const hipOf = t => JSON.stringify(Object.keys(S.hip).filter(k => k.startsWith(t + '|')).map(k => k + '=' + S.hip[k]));
HAS.forEach(t => ok('G1h ' + t + ' hip/protect universe carries 45° back extension (D149-D4b, the station owned)', g(S.hip, t + '|45° back extension') > 0, hipOf(t)));
DENIED.forEach(t => ok('G1h ' + t + ' hip/protect universe carries Bodyweight back extension and no 45° (D149-D4b, no station)', g(S.hip, t + '|Bodyweight back extension') > 0 && g(S.hip, t + '|45° back extension') === 0,
  hipOf(t)));
DENIED.forEach(t => ok('G2 ' + t + ': no GHD name in the swap universe', g(S.uniSize, t) > 0 && g(S.uni, t) === 0, g(S.uni, t) + ' of ' + g(S.uniSize, t)));
HAS.forEach(t => ok('G2 ' + t + ': the swap universe still carries the station', g(S.uni, t) > 0, g(S.uni, t) + ' of ' + g(S.uniSize, t)));
DENIED.forEach(t => ok('G3 ' + t + ': swapCandidates offers no GHD name', swCrash === 0 && g(S.swCalls, t) > 0 && g(S.swCands, t) > 0 && g(S.sw, t) === 0,
  g(S.sw, t) + ' GHD offers in ' + g(S.swCands, t) + ' candidates over ' + g(S.swCalls, t) + ' calls, ' + swCrash + ' crashed'));
HAS.forEach(t => ok('G3 ' + t + ': swapCandidates still offers the station', g(S.sw, t) > 0, g(S.sw, t) + ' of ' + g(S.swCands, t)));
DENIED.forEach(t => ok('G4 ' + t + ': travel variants print and carry no GHD name', tCrash === 0 && g(S.tUniSize, t) > 0 && g(S.tItems, t) === 0 && g(S.tUni, t) === 0,
  'items ' + g(S.tItems, t) + ', universe ' + g(S.tUni, t) + ' of ' + g(S.tUniSize, t) + ', ' + tBuilt + ' built, ' + tCrash + ' crashed'));
const lens = IA._auxGearOK || IA.eval('typeof _auxGearOK==="function"?_auxGearOK:null');
TIERS.forEach(t => { const got = ['Glute-ham raise','45° back extension'].map(n => lens ? !!lens(n, t) : null);
  ok('L1 the aux lens reads the GHD station on ' + t + ' as the inventory does (' + (OWNS[t].GHD ? 'owned' : 'denied') + ')', lens && got.every(v => v === !!OWNS[t].GHD), JSON.stringify(got)); });
ok('F0 fixture: the hand table fires floor (a) on home_full only', JSON.stringify(FIRE_A) === '["home_full"]', JSON.stringify(FIRE_A));
ok('F0 fixture: the hand table fires floor (b) on home_full only', JSON.stringify(FIRE_B) === '["home_full"]', JSON.stringify(FIRE_B));
TIERS.forEach(t => { const f = FIRE_A.includes(t), n = g(K.fa, t), c = g(K.fa, t + '|CRASH');
  ok('F1 floor (a) ' + (f ? 'fires' : 'never fires') + ' on ' + t + ' knee/protect (counterfactual: floor written out)', CF_A.c === 1 && c === 0 && (f ? n > 0 : n === 0),
    CF_A.c !== 1 ? 'floor (a) not in the candidate as ruled: anchor count ' + CF_A.c : n + ' of ' + g(K.cfg, t) + ' programs differ' + (c ? ', ' + c + ' crashed' : '')); });
BAR_TIERS.forEach(t => ok('F1o ' + t + ' knee/protect legs Main is in the hand set ' + JSON.stringify(handA(t).set), g(K.mainBad, t) === 0 && Object.keys(K.main).some(k => k.startsWith(t + '|')),
  g(K.mainBad, t) + ' outside' + (K.mainEx.length ? ' e.g. ' + K.mainEx.join('; ') : '')));
ok('F1o home_full knee/protect legs Main reaches Single-leg glute bridge (floor a prints)', g(K.main, 'home_full|Single-leg glute bridge') > 0, g(K.main, 'home_full|Single-leg glute bridge'));
TIERS.forEach(t => { const f = FIRE_B.includes(t), n = g(K.fb, t), c = g(K.fb, t + '|CRASH');
  ok('F2 floor (b) ' + (f ? 'fires' : 'never fires') + ' on ' + t + ' knee/protect (counterfactual: floor written out)', CF_B.c === 1 && c === 0 && (f ? n > 0 : n === 0),
    CF_B.c !== 1 ? 'floor (b) not in the candidate as ruled: anchor count ' + CF_B.c : n + ' of ' + g(K.cfg, t) + ' programs differ' + (c ? ', ' + c + ' crashed' : '')); });
TIERS.forEach(t => ok('F2o ' + t + ' knee/protect Leg superset B hip-extension item is in ' + JSON.stringify(handB(t).set), g(K.lsbBad, t) === 0,
  g(K.lsbBad, t) + (K.lsbEx.length ? ' e.g. ' + K.lsbEx.join('; ') : '')));
ok('F2o home_full knee/protect Leg superset B carries the hip-extension item (floor b prints)', g(K.lsb, 'home_full|2') > 0, 'two-item ' + g(K.lsb, 'home_full|2') + ' of ' + (g(K.lsb, 'home_full|1') + g(K.lsb, 'home_full|2')));
TIERS.forEach(t => { const calls = g(K.pr, t + '|calls'), e = g(K.pr, t + '|empty'), dr = g(K.pr, t + '|dropped');
  console.log('   P1 ' + t + ': reservation reads ' + calls + ', empty ' + e + ', collision drops ' + dr + ' (' + (calls - e ? (100 * dr / (calls - e)).toFixed(1) : '0.0') + '% of non-empty reads); Leg superset B two-item ' + g(K.lsb, t + '|2') + ' of ' + (g(K.lsb, t + '|1') + g(K.lsb, t + '|2')) + '; hip-ext items ' + g(K.hx, t));
  ok('P1 ' + t + ' knee/protect: the hip-extension reservation is never empty', PROBE.c === 1 && K.probeBad === 0 && calls > 0 && e === 0,
    PROBE.c !== 1 ? 'probe anchor count ' + PROBE.c : e + ' empty of ' + calls + ' reads, probe copy digest mismatches ' + K.probeBad); });
if(PAIR){
  TIERS.forEach(t => ok('K1 ' + t + ' knee/protect loses no section vs V214', !!V214 && K.crash === 0 && g(K.loss, t) === 0,
    V214 ? g(K.loss, t) + ' lost' + (K.lossEx.length ? ' e.g. ' + K.lossEx.join('; ') : '') : v214err));
  ok('K2 commercial and crossfit programs byte-identical to V214 (knee/protect lattice)', !!V214 && K.k2N > 0 && K.k2 === 0, V214 ? K.k2 + ' of ' + K.k2N + ' differ ' + K.k2Ex.join('; ') : v214err);
  ok('K2 commercial and crossfit programs byte-identical to V214 (GHD lattice, every plan)', !!V214 && k2gN > 0 && k2g === 0, V214 ? k2g + ' of ' + k2gN + ' differ ' + k2gEx.join('; ') : v214err);
} else { skipRow('K1 pair 215/214 only'); skipRow('K2 pair 215/214 only'); }
TIERS.forEach(t => ok('K3 ' + t + ' knee/protect: no day prints the same movement twice', g(K.dup, t) === 0, g(K.dup, t) + (K.dupEx.length ? ' e.g. ' + K.dupEx.join('; ') : '')));
const hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));
ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', hm === HM_DIGEST, hm);
done();
