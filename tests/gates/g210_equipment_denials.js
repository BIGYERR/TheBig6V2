// g210_equipment_denials.js — GATE for D70c (coach re-ruling of D70b, Mario concurred) and D150
// (the swap universe passes the lens), with the rows D149 (the GHD is a station) will own when its
// slices land.
//
//   node tests/gates/g210_equipment_denials.js [candidate] [baseline V209]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   The inventory's denial binds. What a tier does not own never prints on it: no barbell on
//   home_basic or bodyweight, no cable or machine off commercial, no dumbbell, kettlebell, band,
//   medicine ball or added weight on bodyweight, and (D149) no GHD station off commercial and
//   crossfit. Older and hypertrophy athletes on crossfit and home_full get goblet squats, dumbbell
//   presses and close-grip bench instead of machines. home_basic 18 to 35 hypertrophy's secondary
//   compound becomes the one dumbbell press the main did not take. D150: the swap universe a
//   program carries, which swapCandidates and deconflictAdjacentDupes read, passes the same lens
//   before anyone reads it, travel variants included. A ruling that SELECTS is not a ruling that
//   DELETES: every name the lens removes from a denied tier still prints on commercial, no section
//   is lost, no name is undefined. HALF_MANNY (commercial) is unmoved.
//
// ORACLES, independent of the engine. _gearOK, _auxGearOK, _BW_GEAR, _BW_SUBS, hasBarbell and
// hasCables are never called or read:
//   O1  the inventory, typed here from the ruling and the tier copy the athlete reads. 1 owns,
//       0 denied, null UNRULED (never checked: medicine ball and added weight on the home tiers
//       are D151, queued). Bodyweight's BAND=0 is doctrine ("bodyweight tier assumes no bands"),
//       not copy. O1 rows check the typed table against the LIVE wizard copy.
//   O2  the implement class of a movement, typed here from the movement name. GHR, glute-ham and
//       45° back extension are the GHD station (D149), not the barbell. O2f rows are fixture
//       guards on the typed table itself: artifact-independent, they cannot fail for any
//       index.html (the g196 A0/B0 kind), and are counted apart in the summary line.
//   O3  zero denied items per tier (O1 x O2) on a lattice of 5 tiers x 7 focuses x 3
//       experiences x 3 ages x 8 seeds plus 6 injury regions x 2 injury tiers per tier and
//       seed: 3,000 builds.
//   O4  D150. O4a: every program's _swapUniverse carries no denied name. O4b: swapCandidates,
//       called once per distinct prescribed name per build on the healthy seeds 0 and 1 (630
//       builds), offers no denied name. O4t: a travel variant (cfg._travel, built by
//       buildProgram exactly as the overlay splice builds it before storing its universe in
//       _swapUniverseByKey) carries no denied name, 5 tiers x 8 seeds x 2 focuses. GHD names
//       are counted apart in O4g (D149, slice 4). Each O4 row carries a vacuity guard.
//   O5  selects, not deletes: the ruling's removed names still print on commercial; the ruling's
//       named replacements print on crossfit and home_full older hypertrophy; 0 undefined
//       names; section counts per config and day equal V209's (build pair 210/209 only),
//       DIRECTION-LOCKED (coach, slice 2): a day's count may RISE only to the same config's
//       healthy count (an injured card getting back the section V209's injury filter took), and
//       may FALL only by a same-card duplicate collapse (every lost section's movements print
//       elsewhere on the new card, and no section stem is gained). Both cards print.
//   O6  HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved; coach's surgery copy).
//
// SLICES. D70c + D150 + D149 ship on ONE ia-version (210) in five builder slices. A row owned by
// a slice not yet built prints NOT YET BUILT with its live count, never PASS. The status is a
// predicate on SLICES_BUILT below (each slice's builder moves it by one when that slice lands),
// and it EXPIRES: above ia-version 210 every row enforces, so a dropped slice fails loudly.
//   1  D70c-A1..A4  the barbell clause, the older hypertrophy chest, the squat pool, chest_acc
//   2  D70c-B1, B2  the Secondary compound and the Arms/Delts finisher
//      2b           advanced 55+ front squat (per-program draw) and the shoulder/elbow front rack
//                   withhold; its rows O5d' and O5g enforce at every slice, since 2b landed
//                   before this gate's slice 3 count moved
//   3  D150         the swap universe passes the lens
//   4  D149-D1..D3  the GHD station: HELD out of V210 (coach); its rows sit under the D149 licence
//   5  D149-D4a,D4b the two injury literals (ankle/protect, hip/protect): HELD with slice 4
//   FINAL = 3       V210's scope ends at slice 3: the whole-tier totals (O3z) and the HALF_MANNY
//                   era-table row (O6r) ENFORCE on V210
//
// O3 BUCKETS (attribution only: which slice owes the zero). Keyed on the ITEM and its day:
//   S2  an item in a Secondary compound or an Arms/Delts finisher section (slice 2)
//   G   an item whose class is GHD (D149, slice 4)
//   G5  a GHD item on an ankle/protect or hip/protect cell, where the literals live (slice 5)
//   R   the elbow workaround renamer: injuryPlan's swapNames (:7813 at V209) turns Dumbbell
//       skullcrushers into Cable pushdown after the draw, with no gear check. Measured on this
//       lattice: crossfit 33, home_basic 29, home_full 37 cable items, and they SURVIVE the full
//       D70c + D150 surgery. Coach queued the fix as D154 (measure first, not V210). Its
//       Preacher curl -> Cable curl twin is dead on no-cable tiers once slice 2 lenses the
//       biceps pool, so only Cable pushdown is bucketed here; a Cable curl lands in S1 and fails.
//   S1  everything else (slice 1)
//
// D154 LICENCE (standing ruling 2, a predicate, not prose). While ia-version <= D154_SCOPED_TO
// (212, renewed at V212) the R bucket is SCOPED OUT: O3r prints SCOPED OUT with its live count
// (never PASS) and O3z leaves R out of its total. Above it the licence expires, O3r enforces and
// O3z counts R, so the gap stays loud on the first build after it unless D154 has shipped.
//
// D149 LICENCE (standing ruling 2, a predicate, not prose). D149 is HELD out of V210 by coach:
// slice 4 met its lens targets but lost home_full sections on long-run tier B days and injured
// cells (O5b); it is parked for a ruling. While ia-version <= D149_HELD_TO (212, renewed at V212)
// the GHD rows (O3g, O3g5, O4g) print SCOPED OUT (D149 held) with their live counts, never PASS,
// and O3z leaves the GHD share out of its total. Above it they enforce and fail loudly. RENEW BY ONE PER BUILD until D149
// ships (g202's D142 pattern), always keyed on a number that exists today.
//
// VERSION PREDICATE (standing ruling 4). D70c ships on ia-version 210.
//   below 210: NOT APPLICABLE, every row skipped by name, clean exit.
//   O5b is scoped to the build pair (candidate 210, baseline 209); any other pair skips it.
'use strict';
const path = require('path');
const { load, progDigest, MANNY_DIGEST_BY_VERSION, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const D70C_ERA = 210;
const SLICES_BUILT = 3;          // slices 1 (D70c-A1..A4), 2 (D70c-B1, B2), 2b, 3 (D150): V210's whole scope. D149 is HELD (licence below).
const FINAL = 3;                 // V210's scope ends at slice 3: O3z and O6r enforce now
const EXPIRED = VER > D70C_ERA;  // a later build runs this gate: no row may hide as NOT YET BUILT
const D154_SCOPED_TO = 213; // D154 queued
const D149_HELD_TO = 213; // D149 builds next
const D154_SCOPED = VER <= D154_SCOPED_TO;  // the D154 licence: the elbow renamer is out of scope through D154_SCOPED_TO only
const D149_HELD = VER <= D149_HELD_TO;      // the D149 licence: the GHD station is HELD. Renew by one per build until D149 ships.

let pass = 0, fail = 0, skip = 0, nyb = 0, fixt = 0, scoped = 0, held = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function owned(slice, label, cond, got){
  if(slice > SLICES_BUILT && !EXPIRED){ nyb++; console.log('NOT YET BUILT ' + label + ' [slice ' + (slice >= FINAL ? 'FINAL' : slice) + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function heldRow(label, cond, got){
  if(D149_HELD){ held++; console.log('SCOPED OUT (D149 held) ' + label + ' [D149 licence, ia-version <= ' + D149_HELD_TO + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
function summary(){
  console.log('\nNOT YET BUILT ' + nyb + ' (SLICES_BUILT ' + SLICES_BUILT + ' of ' + FINAL + ')  SCOPED OUT ' + scoped + ' (D154 licence, ia-version <= ' + D154_SCOPED_TO + ')  SCOPED OUT (D149 held) ' + held + ' (D149 licence, ia-version <= ' + D149_HELD_TO + ')  SKIP ' + skip + '  fixture guards ' + fixt);
  console.log('PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}
if(!(VER >= D70C_ERA)){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D70c (V' + D70C_ERA + ').');
  ['O1','O2f','O2x','O3a','O3n','O3b','O3g','O3g5','O3r','O3z','O4a','O4b','O4t','O4g','O5a','O5b','O5c','O5d','O5e',"O5d'",'O5g','O6','O6u','O6r']
    .forEach(r => skipRow(r + ' skipped below the D70c era'));
  summary();
}

// ── O1: the inventory, typed ─────────────────────────────────────────────────────────────
const OWNS = {
  commercial: { BARBELL:1, DUMBBELL:1, CABLE:1, MACHINE:1, GHD:1, KETTLEBELL:1, BAND:1, MEDBALL:1,    WEIGHTED:1    },
  crossfit:   { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:1, KETTLEBELL:1, BAND:1, MEDBALL:1,    WEIGHTED:1    },
  home_full:  { BARBELL:1, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1, BAND:1, MEDBALL:null, WEIGHTED:null },
  home_basic: { BARBELL:0, DUMBBELL:1, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:1, BAND:1, MEDBALL:null, WEIGHTED:null },
  bodyweight: { BARBELL:0, DUMBBELL:0, CABLE:0, MACHINE:0, GHD:0, KETTLEBELL:0, BAND:0, MEDBALL:0,    WEIGHTED:0    },
};
const den = (t, c) => OWNS[t][c] === 0;
const TIERS = Object.keys(OWNS);
const DENIED_TIERS = TIERS.filter(t => Object.keys(OWNS[t]).some(c => den(t, c)));
const CLASSES = Object.keys(OWNS.commercial);
// the live tier copy: every token it states must agree with the typed table
const copyOf = id => { const m = IA.html.match(new RegExp("\\{id:'" + id + "',[^}]*desc:'([^']*)'")); return m ? m[1] : null; };
[
  ['home_basic', /No barbell\./, 'BARBELL', 0],
  ['home_basic', /Dumbbells/, 'DUMBBELL', 1],
  ['home_basic', /kettlebells/, 'KETTLEBELL', 1],
  ['home_basic', /bands/, 'BAND', 1],
  ['home_full',  /^Barbell\b/, 'BARBELL', 1],
  ['home_full',  /dumbbells/, 'DUMBBELL', 1],
  ['home_full',  /kettlebells/, 'KETTLEBELL', 1],
  ['home_full',  /bands/, 'BAND', 1],
  ['commercial', /cables, machines/, 'CABLE', 1],
  ['commercial', /cables, machines/, 'MACHINE', 1],
  ['crossfit',   /^Barbells\b/, 'BARBELL', 1],
  ['crossfit',   /kettlebells/, 'KETTLEBELL', 1],
  ['crossfit',   /wall balls/, 'MEDBALL', 1],
  ['crossfit',   /bands/, 'BAND', 1],
  ['bodyweight', /No weights\./, 'DUMBBELL', 0],
  ['bodyweight', /No weights\./, 'KETTLEBELL', 0],
  ['bodyweight', /No weights\./, 'MEDBALL', 0],
  ['bodyweight', /No weights\./, 'WEIGHTED', 0],
].forEach(([t, rx, c, v]) => { const d = copyOf(t);
  ok('O1 ' + t + ' tier copy states ' + rx.source + ' and the inventory has ' + c + '=' + v, d !== null && rx.test(d) && OWNS[t][c] === v, d); });
['home_full', 'crossfit'].forEach(t => { const d = copyOf(t);
  ok('O1 ' + t + ' tier copy names no cable or machine (inventory CABLE=0 MACHINE=0)', d !== null && !/cable|machine/i.test(d), d); });

// ── O2: the implement class, typed from the movement name ────────────────────────────────
function CLASS(name){
  const N = String(name).toLowerCase(), c = new Set();
  if(/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if(/\bbarbell\b|^back squat|^front squat|^paused (back|front) squat|^bench press|close-grip bench|trap bar|power clean|hang clean|^hang power|^power snatch|^snatch|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^overhead squat|^deadlift|^sumo deadlift|^romanian deadlift$|^conventional deadlift|^push press$|^overhead press$|^pin press|^bent[- ]over row$|^pendlay|^zercher|^hip thrust$/.test(N)) c.add('BARBELL');
  if(/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if(/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if(/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|belt squat|reverse hyper|preacher/.test(N)) c.add('MACHINE');
  if(/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  if(/\bbands?\b|banded/.test(N) && !/band stretch|\bit band/.test(N)) c.add('BAND');
  if(/med(icine)? ?ball|wall ball|ball slam|slam ball/.test(N)) c.add('MEDBALL');
  if(/\bweighted\b|weight vest|sandbag|rucksack|\bsled\b|\bplate\b/.test(N)) c.add('WEIGHTED');
  return c;
}
const cls = n => [...CLASS(n)].sort().join('+');
[
  ['Close-grip bench press', 'BARBELL'], ['Incline barbell press', 'BARBELL'], ['Barbell box squat', 'BARBELL'],
  ['Glute-ham raise', 'GHD'], ['45° back extension', 'GHD'], ['Bodyweight back extension', ''],
  ['Machine chest press', 'MACHINE'], ['Leg press', 'MACHINE'], ['Hack squat (machine)', 'MACHINE'], ['Pec deck', 'MACHINE'],
  ['Cable crossover', 'CABLE'], ['Cable pushdown', 'CABLE'], ['Face pull', 'CABLE'], ['Rope tricep extension', 'CABLE'],
  ['Dumbbell goblet squat', 'DUMBBELL'], ['Kettlebell goblet squat', 'KETTLEBELL'], ['Step-ups (KB)', 'KETTLEBELL'],
  ['Band pull-aparts', 'BAND'], ['Banded hip thrust', 'BAND'], ['Hamstring band stretch', ''], ['Preacher curl', 'MACHINE'],
  ['Medicine ball slam', 'MEDBALL'], ['Wall balls', 'MEDBALL'], ['Pushup variation (weighted)', 'WEIGHTED'], ['Pushups (slow tempo)', ''],
].forEach(([n, want]) => { fixt++; ok('O2f fixture: ' + n + ' is ' + (want || 'unclassed'), cls(n) === want, cls(n)); });
const deniedOn = (t, n) => [...CLASS(n)].filter(c => den(t, c));

// ── the lattice ──────────────────────────────────────────────────────────────────────────
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, focus, exp, age, si, inj){
  const [g, x] = GOALS[(si + FOC.indexOf(focus)) % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(focus) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:focus, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
const cells = [];
for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++){
  for(const f of FOC) for(const e of EXPS) for(const a of AGES) cells.push({ k:[eq,f,e,a,si].join('|'), eq, f, a, si, cfg: mk(eq,f,e,a,si,null) });
  for(const r of REG) for(const t of ITIER) cells.push({ k:[eq,'inj',r,t,si].join('|'), eq, f:'hypertrophy', a:AGES[si % 3], si, inj:{region:r,tier:t}, cfg: mk(eq,'hypertrophy',EXPS[si % 3],AGES[si % 3],si,{region:r,tier:t}) });
}
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const SURF2 = /^Secondary compound|^(Arms?|Delts?) finisher/i;
const RENAMED = new Set(['Cable pushdown']);   // injuryPlan elbow workaround swapNames target (D154)
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const B = { S1:{}, S2:{}, G:{}, G5:{}, R:{}, ALL:{} }, NAMES = {}, SECS = {};
const U = { size:{}, bad:{}, ghd:{}, badNames:{} };           // O4a
const SW = { calls:{}, cands:{}, bad:{}, ghd:{}, badNames:{} }; // O4b
const IMPL = /barbell|dumbbell|cable|machine|pec deck|leg press|hack squat|glute-ham|preacher|pulldown|face pull|smith/i;
const unclassed = {};
const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
const candNames = r => { const out = []; if(!r) return out;
  (Array.isArray(r) ? [r] : Object.values(r).filter(Array.isArray)).forEach(a => a.forEach(c => { const n = clean(typeof c === 'string' ? c : (c && c.name)); if(n) out.push(n); })); return out; };
function universe(p, eq, acc){
  const u = p._swapUniverse || []; bump(acc.size, eq, u.length);
  u.forEach(n0 => { const n = clean(n0), d = deniedOn(eq, n); if(!d.length) return;
    if(d.every(c => c === 'GHD')) bump(acc.ghd, eq); else { bump(acc.bad, eq); bump(acc.badNames, eq + '|' + n); } });
}
let builds = 0, crash = 0, undef = 0, swCrash = 0, olderHyp = { crossfit:{}, home_full:{} }, hbSecond = { n:0, bad:0 };
for(const C of cells){
  let p; try { p = IA.buildProgram(C.cfg); } catch(e){ crash++; continue; }
  builds++;
  const sc = [];
  const renamerCell = C.inj && C.inj.region === 'elbow' && C.inj.tier === 'workaround';
  const literalCell = C.inj && C.inj.tier === 'protect' && (C.inj.region === 'ankle' || C.inj.region === 'hip');
  const swapThis = !C.inj && C.si < 2, asked = new Set();
  Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d]; sc.push(day && day.sections ? day.sections.length : -1);
    (day && day.sections || []).forEach(s => (s.items || []).forEach(it => {
      const raw = it && it.name, n = clean(raw);
      if(raw == null || !n || /\bundefined\b|\bnull\b|\bNaN\b/.test(n)){ undef++; return; }
      bump(NAMES, C.eq + '|' + n);
      if(IMPL.test(n) && !CLASS(n).size && !/bodyweight|band/i.test(n)) bump(unclassed, n);
      const lab = String(s.label || s.coreHeader || '');
      if((C.eq === 'crossfit' || C.eq === 'home_full') && C.f === 'hypertrophy' && C.a !== '18-35' && !C.inj) bump(olderHyp[C.eq], n);
      if(C.eq === 'home_basic' && C.f === 'hypertrophy' && C.a === '18-35' && !C.inj && /^Secondary compound/i.test(lab)){ hbSecond.n++; if(!/^Dumbbell (bench|incline) press$/.test(n)) hbSecond.bad++; }
      deniedOn(C.eq, n).forEach(c => {
        const key = C.eq + '|' + c;
        const bucket = c === 'GHD' ? (literalCell ? 'G5' : 'G') : SURF2.test(lab) ? 'S2' : (renamerCell && RENAMED.has(n)) ? 'R' : 'S1';
        bump(B[bucket], key); bump(B[bucket], C.eq + '|*|' + n); bump(B.ALL, C.eq);
      });
      if(swapThis && !asked.has(n)){ asked.add(n);
        let cs; try { cs = candNames(swapCandidates(raw, day, w, p)); } catch(e){ swCrash++; return; }
        bump(SW.calls, C.eq); bump(SW.cands, C.eq, cs.length);
        cs.forEach(cn => { const dd = deniedOn(C.eq, cn); if(!dd.length) return;
          if(dd.every(c => c === 'GHD')) bump(SW.ghd, C.eq); else { bump(SW.bad, C.eq); bump(SW.badNames, C.eq + '|' + cn); } });
      }
    }));
  }));
  SECS[C.k] = sc.join(',');
  universe(p, C.eq, U);
}
console.log('lattice: ' + builds + ' of ' + cells.length + ' built, ' + crash + ' crashed');
ok('O3 lattice built whole (3,000 configs, 0 crashes)', builds === 3000 && crash === 0, builds + ' built, ' + crash + ' crashed');

// ── O2x: the class table covers every implement-named item the lattice printed ───────────
ok('O2x every printed name carrying an implement token has an O2 class', !Object.keys(unclassed).length, JSON.stringify(unclassed));

// ── O3: zero denied items, per tier, per bucket ──────────────────────────────────────────
const g = (b, k) => B[b][k] || 0;
DENIED_TIERS.forEach(t => CLASSES.filter(c => den(t, c) && c !== 'GHD').forEach(c =>
  owned(1, 'O3a ' + t + ' prints no ' + c + ' item outside the slice 2 and renamer surfaces', g('S1', t + '|' + c) === 0, g('S1', t + '|' + c))));
// the ruling's named machines, by name, on every tier that denies them
[['Machine chest press','MACHINE'],['Leg press','MACHINE'],['Hack squat (machine)','MACHINE'],['Pec deck','MACHINE'],['Cable crossover','CABLE']].forEach(([n, c]) => {
  const ts = DENIED_TIERS.filter(t => den(t, c)); const got = ts.map(t => t + '=' + g('S1', t + '|*|' + n)).join(' ');
  owned(1, 'O3n ' + n + ' prints on no ' + c + '-denied tier (outside slice 2 surfaces)', ts.every(t => g('S1', t + '|*|' + n) === 0), got);
});
DENIED_TIERS.forEach(t => { const got = CLASSES.filter(c => den(t, c)).reduce((a, c) => a + g('S2', t + '|' + c), 0);
  owned(2, 'O3b ' + t + ': the Secondary compound and the Arms/Delts finisher print no denied item', got === 0, got); });
DENIED_TIERS.filter(t => den(t, 'GHD')).forEach(t => heldRow('O3g ' + t + ' prints no GHD station item (D149), the ankle/protect and hip/protect literals apart', g('G', t + '|GHD') === 0, g('G', t + '|GHD')));
DENIED_TIERS.filter(t => den(t, 'GHD')).forEach(t => heldRow('O3g5 ' + t + ' prints no GHD station item on an ankle/protect or hip/protect day (D149 literals)', g('G5', t + '|GHD') === 0, g('G5', t + '|GHD')));
const rOf = t => CLASSES.reduce((a, c) => a + g('R', t + '|' + c), 0);
DENIED_TIERS.forEach(t => { const got = rOf(t), label = 'O3r ' + t + ': the elbow workaround renamer prints no denied item (D154)';
  if(D154_SCOPED){ scoped++; console.log('SCOPED OUT ' + label + ' [D154 licence, ia-version <= ' + D154_SCOPED_TO + '] (now ' + got + ')'); }
  else ok(label, got === 0, got); });
const ghdOf = t => g('G', t + '|GHD') + g('G5', t + '|GHD');
DENIED_TIERS.forEach(t => { const got = (B.ALL[t] || 0) - (D154_SCOPED ? rOf(t) : 0) - (D149_HELD ? ghdOf(t) : 0);
  const out = [D154_SCOPED ? 'D154 renamer' : '', D149_HELD ? 'D149 GHD share' : ''].filter(Boolean).join(' and ');
  owned(FINAL, 'O3z ' + t + ' prints no denied item at all, injury cells included' + (out ? ' (' + out + ' scoped out)' : ''), got === 0,
        got + (D149_HELD ? '; GHD share held ' + ghdOf(t) : '') + (D154_SCOPED ? '; renamer scoped ' + rOf(t) : '')); });

// ── O4: the swap universe (D150) ─────────────────────────────────────────────────────────
const top = (o, t) => Object.entries(o).filter(([k]) => k.startsWith(t + '|')).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, c]) => k.slice(t.length + 1) + '×' + c).join(', ');
DENIED_TIERS.forEach(t => owned(3, 'O4a ' + t + ': every program’s swap universe carries no denied name (GHD apart)',
  (U.size[t] || 0) > 0 && (U.bad[t] || 0) === 0, (U.bad[t] || 0) + ' denied entries of ' + (U.size[t] || 0) + ' ' + top(U.badNames, t)));
DENIED_TIERS.forEach(t => owned(3, 'O4b ' + t + ': swapCandidates offers no denied name (GHD apart)',
  (SW.calls[t] || 0) > 0 && (SW.cands[t] || 0) > 0 && (SW.bad[t] || 0) === 0 && swCrash === 0,
  (SW.bad[t] || 0) + ' denied offers in ' + (SW.cands[t] || 0) + ' candidates over ' + (SW.calls[t] || 0) + ' calls, ' + swCrash + ' crashes ' + top(SW.badNames, t)));
const T = { size:{}, bad:{}, ghd:{}, badNames:{} }; let tBuilt = 0, tCrash = 0;
for(const eq of TIERS) for(let si = 0; si < SEEDS.length; si++) for(const f of ['hypertrophy','balanced']){
  const cfg = mk(eq, f, EXPS[si % 3], AGES[si % 3], si, null); cfg._travel = true;
  let p; try { p = IA.buildProgram(cfg); } catch(e){ tCrash++; continue; } tBuilt++; universe(p, eq, T); }
DENIED_TIERS.forEach(t => owned(3, 'O4t ' + t + ': a travel variant’s universe (what _swapUniverseByKey stores) carries no denied name (GHD apart)',
  tCrash === 0 && (T.size[t] || 0) > 0 && (T.bad[t] || 0) === 0, (T.bad[t] || 0) + ' denied entries of ' + (T.size[t] || 0) + ', ' + tBuilt + ' built, ' + tCrash + ' crashed ' + top(T.badNames, t)));
DENIED_TIERS.filter(t => den(t, 'GHD')).forEach(t => { const got = (U.ghd[t] || 0) + (SW.ghd[t] || 0) + (T.ghd[t] || 0);
  heldRow('O4g ' + t + ': no GHD station name in the universe, the swap sheet or a travel universe (D149)', got === 0, got); });

// ── O5: selects, not deletes ─────────────────────────────────────────────────────────────
['Machine chest press','Leg press','Hack squat (machine)','Pec deck','Cable crossover'].forEach(n =>
  ok('O5a ' + n + ' still prints on commercial', (NAMES['commercial|' + n] || 0) > 0, NAMES['commercial|' + n] || 0));
ok('O5c no item prints an undefined, null or empty name', undef === 0, undef);
// The ruling's shorthand is "goblet and box squats". Barbell box squat is in the pool but never
// prints on a hypertrophy main: REP_AFFINITY caps it at 6 reps (standing doctrine, positional
// strength) and _repFit drops it from a hypertrophy rep range, on V209 commercial as well. What
// the ruling selects that PRINTS is the goblet squat, so the box squat is not an O5d row.
['crossfit','home_full'].forEach(t => ['Dumbbell goblet squat','Dumbbell bench press','Dumbbell incline press','Close-grip bench press'].forEach(n =>
  ok('O5d ' + t + ' older hypertrophy prints ' + n + ' (the ruling’s replacement)', (olderHyp[t][n] || 0) > 0, olderHyp[t][n] || 0)));
owned(2, 'O5e home_basic 18 to 35 hypertrophy: the Secondary compound is a dumbbell press', hbSecond.n > 0 && hbSecond.bad === 0, hbSecond.bad + ' of ' + hbSecond.n + ' not a dumbbell press');

// ── O5d': slice 2b (coach re-ruled, Mario informed) ──────────────────────────────────────
// Advanced 55+ older hypertrophy on crossfit and home_full draws goblet OR front squat ONCE for
// the whole program (hypertrophy is locked). Beginner, intermediate and 36 to 54: goblet only.
// Commercial untouched (its older pool never held a front squat). Under any shoulder or elbow
// plan, protect or workaround, every tier: no front squat on a card, in the universe or on the
// swap sheet, and the slot is not lost (the goblet or another squat stays). Squat mains are read
// off the card: a Main or Primer section whose item is a squat or leg press.
const SQ = /squat|leg press/i;
const squatMains = p => { const per = {}; Object.keys(p.weeks || {}).forEach(w => DAYS.forEach(d => (p.weeks[w][d] && p.weeks[w][d].sections || []).forEach(s => {
  const it = (s.items || [])[0], n = clean(it && it.name); if(/^(Main|Primer) — /.test(s.label || '') && SQ.test(n)) bump(per, n); }))); return per; };
const mk2 = (eq, f, e, a, seed, inj) => { const c = mk(eq, f, e, a, 0, inj); c.seed = seed; return c; };
['crossfit','home_full'].forEach(t => {
  const seen = {}; let bad = 0, multi = 0;
  SEEDS.forEach(sd => { const m = squatMains(IA.buildProgram(mk2(t, 'hypertrophy', 'advanced', '55+', sd))), ks = Object.keys(m);
    if(ks.length !== 1) multi++; ks.forEach(k => { bump(seen, k); if(k !== 'Dumbbell goblet squat' && k !== 'Front squat') bad++; }); });
  ok("O5d' " + t + ' advanced 55+ hypertrophy: one squat per program, goblet or front squat, and both appear across the 8 seeds',
     bad === 0 && multi === 0 && seen['Dumbbell goblet squat'] > 0 && seen['Front squat'] > 0, JSON.stringify(seen) + ', ' + multi + ' programs with more than one');
  const other = {}; [['beginner','55+'],['intermediate','55+'],['beginner','36-54'],['intermediate','36-54'],['advanced','36-54']].forEach(([e, a]) => SEEDS.forEach(sd =>
    Object.keys(squatMains(IA.buildProgram(mk2(t, 'hypertrophy', e, a, sd)))).forEach(k => bump(other, k))));
  ok("O5d' " + t + ' older hypertrophy below advanced 55+: goblet squat only', Object.keys(other).length === 1 && other['Dumbbell goblet squat'] > 0, JSON.stringify(other));
});
{ const com = {}; EXPS.forEach(e => ['36-54','55+'].forEach(a => SEEDS.forEach(sd => Object.keys(squatMains(IA.buildProgram(mk2('commercial', 'hypertrophy', e, a, sd)))).forEach(k => bump(com, k)))));
  ok("O5d' commercial older hypertrophy never draws a front squat (its pool is untouched)", !com['Front squat'] && Object.keys(com).length > 0, JSON.stringify(com)); }
{ let fsCard = 0, fsUni = 0, fsSheet = 0, lost = 0, n = 0, calls = 0; const where = [];
  for(const eq of ['commercial','crossfit','home_full']) for(const r of ['shoulder','elbow']) for(const tr of ['workaround','protect'])
    for(const [f, e, a] of [['strength','intermediate','18-35'],['balanced','advanced','18-35'],['hypertrophy','beginner','18-35'],['hypertrophy','advanced','55+']]) for(const sd of SEEDS){
      const hc = mk2(eq, f, e, a, sd), ic = mk2(eq, f, e, a, sd, {region:r, tier:tr}); const ph = IA.buildProgram(hc), pi = IA.buildProgram(ic); n++;
      const mi = squatMains(pi), mh = squatMains(ph);
      if(mi['Front squat']){ fsCard += mi['Front squat']; if(where.length < 3) where.push(ic.equipment + '/' + r + '-' + tr + '/' + f + '/seed ' + sd); }
      const sumI = Object.values(mi).reduce((x, y) => x + y, 0), sumH = Object.values(mh).reduce((x, y) => x + y, 0); if(sumI !== sumH) lost++;
      if((pi._swapUniverse || []).includes('Front squat')) fsUni++;
      Object.keys(pi.weeks).forEach(w => DAYS.forEach(d => (pi.weeks[w][d] && pi.weeks[w][d].sections || []).forEach(s => { const it = (s.items || [])[0];
        if(/^Main — /.test(s.label || '') && it && SQ.test(clean(it.name))){ calls++; if(candNames(swapCandidates(it.name, pi.weeks[w][d], w, pi)).includes('Front squat')) fsSheet++; } })));
    }
  ok("O5d' shoulder and elbow plans (protect and workaround, 3 barbell tiers, 4 goals, 8 seeds): no front squat on a card", fsCard === 0 && n === 384, fsCard + ' front squat mains in ' + n + ' programs ' + where.join('; '));
  ok("O5d' shoulder and elbow plans: the squat slot is never lost (squat mains equal the healthy twin’s, day for day in total)", lost === 0, lost + ' of ' + n + ' programs lost a squat main');
  ok("O5d' shoulder and elbow plans: no front squat in the swap universe", fsUni === 0, fsUni + ' of ' + n + ' universes');
  ok("O5d' shoulder and elbow plans: the swap sheet never offers a front squat on a squat main", calls > 0 && fsSheet === 0, fsSheet + ' of ' + calls + ' calls'); }
// O5g isolates the NAME-level withhold, the rule the swap sheet itself applies: a healthy
// program whose universe holds the front squat, read with each shoulder or elbow plan on its
// cfg, must not offer it; with no plan it must (the control that keeps this row honest).
{ let seedUsed = null, prog = null, day = null, wk = null, main = null;
  for(const sd of SEEDS){ const p = IA.buildProgram(mk2('crossfit', 'strength', 'intermediate', '18-35', sd)); if(!(p._swapUniverse || []).includes('Front squat')) continue;
    Object.keys(p.weeks).some(w => DAYS.some(d => (p.weeks[w][d] && p.weeks[w][d].sections || []).some(s => { const it = (s.items || [])[0];
      if(/^Main — /.test(s.label || '') && it && SQ.test(clean(it.name)) && clean(it.name) !== 'Front squat'){ prog = p; day = p.weeks[w][d]; wk = w; main = it.name; return true; } return false; })));
    if(prog){ seedUsed = sd; break; } }
  const offer = cfgPatch => candNames(swapCandidates(main, day, wk, Object.assign({}, prog, { cfg: Object.assign({}, prog.cfg, cfgPatch) }))).includes('Front squat');
  const control = prog ? offer({}) : false;
  const plans = [['shoulder','workaround'],['shoulder','protect'],['elbow','workaround'],['elbow','protect']];
  const leaks = prog ? plans.filter(([r, t]) => offer({ injury:{ region:r, tier:t } })).map(x => x.join('-')) : ['no fixture'];
  ok("O5g the swap sheet's injury test withholds the front squat under every shoulder and elbow plan (control: offered with no plan)",
     prog !== null && control === true && leaks.length === 0, 'seed ' + seedUsed + ', main ' + clean(main) + ', control ' + control + ', offered under ' + (leaks.join(', ') || 'none')); }
if(BASEFILE){
  const BA = load(BASEFILE);
  if(VER === D70C_ERA && +BA.version === D70C_ERA - 1){
    const stem = s => String(s.label || s.coreHeader || '').split(' — ')[0];
    const nm = s => (s.items || []).map(i => clean(i && i.name));
    const card = day => (day && day.sections || []).map(s => '      [' + (s.label || s.coreHeader || '') + '] ' + nm(s).join(' | ')).join('\n');
    const cnt = day => day && day.sections ? day.sections.length : -1;
    let diffCfg = 0, rise = 0, fall = 0, bad = 0, bcrash = 0; const badAt = [];
    for(const C of cells){ let pb; try { pb = BA.buildProgram(C.cfg); } catch(e){ bcrash++; continue; }
      const sc = []; Object.keys(pb.weeks || {}).forEach(w => DAYS.forEach(d => sc.push(cnt(pb.weeks[w][d]))));
      if(sc.join(',') === SECS[C.k]) continue;
      diffCfg++;
      const pc = IA.buildProgram(C.cfg);
      let ph = null; if(C.inj){ const h = JSON.parse(JSON.stringify(C.cfg)); delete h.injury; ph = IA.buildProgram(h); }
      Object.keys(pc.weeks || {}).forEach(w => DAYS.forEach(d => {
        const x = pb.weeks[w] && pb.weeks[w][d], y = pc.weeks[w][d], nx = cnt(x), ny = cnt(y);
        if(nx === ny) return;
        let verdict, fine;
        if(ny > nx){
          const nh = ph ? cnt(ph.weeks[w] && ph.weeks[w][d]) : null;
          fine = ph !== null && ny === nh;
          verdict = fine ? 'RISE to the same config’s healthy count (' + nh + ')' : 'RISE NOT EXCUSED (healthy count ' + nh + ')';
          if(fine) rise++;
        } else {
          const left = (y.sections || []).map(stem), yNames = new Set((y.sections || []).flatMap(nm)), lost = [];
          (x.sections || []).forEach(s => { const i = left.indexOf(stem(s)); if(i >= 0) left.splice(i, 1); else lost.push(s); });
          fine = left.length === 0 && lost.length === nx - ny && lost.every(s => nm(s).length > 0 && nm(s).every(n => yNames.has(n)));
          verdict = fine ? 'FALL by same-card duplicate collapse (' + lost.map(s => stem(s) + ': ' + nm(s).join('+')).join('; ') + ')'
                         : 'FALL NOT EXCUSED (lost ' + lost.map(stem).join(', ') + '; gained ' + left.join(', ') + ')';
          if(fine) fall++;
        }
        if(!fine){ bad++; if(badAt.length < 4) badAt.push(C.k + ' W' + w + ' ' + d); }
        console.log('  O5b card ' + C.k + ' W' + w + ' ' + d + ': sections ' + nx + ' -> ' + ny + ', ' + verdict);
        console.log('    V209:\n' + card(x) + '\n    candidate:\n' + card(y));
      }));
    }
    ok('O5b section counts equal V209’s per config and day, except a rise to the healthy count or a fall by same-card duplicate collapse (3,000 configs)',
       bad === 0 && bcrash === 0, diffCfg + ' configs differ; ' + rise + ' rises, ' + fall + ' falls excused; ' + bad + ' not excused ' + badAt.join(' ; ') + '; ' + bcrash + ' baseline crashes');
  } else skipRow('O5b section counts vs V209: pair ' + VER + '/' + BA.version + ' is not the 210/209 build pair');
} else skipRow('O5b section counts vs V209: no baseline given');

// ── O6: HALF_MANNY ───────────────────────────────────────────────────────────────────────
const MANNY = '0ac7da6b1691a8e1';
const mp = IA.buildProgram(IA.fixtures.HALF_MANNY), md = progDigest(mp);
ok('O6 HALF_MANNY digest is ' + MANNY + ' (ruled unmoved)', md === MANNY, md);
ok('O6u HALF_MANNY’s swap universe holds 86 names (commercial owns everything; the lens removes none)', (mp._swapUniverse || []).length === 86, (mp._swapUniverse || []).length);
owned(FINAL, 'O6r the harness era row for ia-version ' + VER + ' exists and reads ' + MANNY, MANNY_DIGEST_BY_VERSION[VER] === MANNY, MANNY_DIGEST_BY_VERSION[VER]);
summary();
