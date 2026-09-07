// Gate G192b — V192 slice 4: D42-b (shoulderAccPool equipment gate) and D43
// ('Dumbbell floor press' in chest_acc / chest_acc_joint / shoulder-workaround swap).
//
// Contract under test:
//   D42-b  A landmine is a barbell with one end anchored, so it is barbell-tier
//          equipment. shoulderAccPool gates on hasBarbell. The no-barbell branch is
//          EXLIB.shoulder minus 'Landmine rotational press', member for member and in
//          order — a GATE ADDITION, not a content removal. Barbell tiers keep the name.
//   D43-a  EXLIB.chest_acc and EXLIB.chest_acc_joint each gain 'Dumbbell floor press'
//          exactly once, appended, with the six prior members unchanged in order.
//   D43-b  The name is a horizontal press ('hpress') and is NOT leg work: it must not
//          match _D18_LEG_RX, which is why the name omits 'glute-bridge'.
//   D43-c  shoulder/workaround swaps 'Dumbbell bench press' -> 'Dumbbell floor press'.
//          No self-map, no chain, the swap target is not eaten by that tier's own
//          dropNames, and the hpress cap still prints an RPE clamp.
//
// ── ORACLE INDEPENDENCE ────────────────────────────────────────────────────────
//   (a) Every expected list is a HAND LIST typed out of the ruling, never read back
//       from EXLIB and compared to itself.
//   (b) The barbell-tier table is hand-typed from the equipment doctrine
//       (home_full / commercial / crossfit own a barbell; bodyweight / minimal /
//       home_basic do not). Nothing reads `hasBarbell` out of the source.
//   (c) The leg-work check is a TOKEN scan: the printed name is split to words and
//       tested against a hand list of the leg tokens the D18 long-run pass looks for,
//       independently of _D18_LEG_RX's own source.
//   (d) The RPE clamp is asserted on the athlete-facing detail string, not on P.cap.
//
// Baseline behaviour on the pre-slice artifact: G1 (landmine on minimal/home_basic),
// G2, G3, G5 and G6 MUST fail.
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));
const FILE = process.argv[2] || path.join(ROOT, 'index.html');
const IA = load(FILE);

let PASS = 0, FAIL = 0;
function ok(m){ PASS++; console.log('  ok   ' + m); }
function bad(m, extra){ FAIL++; console.log('  FAIL ' + m + (extra ? '  [' + extra + ']' : '')); }

const FP = 'Dumbbell floor press';
const LM = 'Landmine rotational press';

// ── hand tables ───────────────────────────────────────────────────────────────
// Typed from the ruling. Order is part of the claim: appended last, prior members
// untouched.
const WANT_CHEST_ACC = ['Dumbbell incline press','Dumbbell bench press','Dips',
  'Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press'];
const WANT_CHEST_ACC_JOINT = ['Dumbbell incline press','Dumbbell bench press','Machine chest press',
  'Cable crossover','Pec deck','Dumbbell decline press','Dumbbell floor press'];
// The no-barbell shoulder branch, typed out of the ruling: EXLIB.shoulder minus the landmine.
const WANT_SHOULDER_NOBAR = ['Barbell overhead press','Dumbbell Arnold press',
  'Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press'];
// Equipment doctrine, hand-typed: which tiers own a barbell.
const BARBELL_TIERS = ['home_full','commercial','crossfit'];
const NO_BARBELL_TIERS = ['bodyweight','minimal','home_basic'];

// ── G0. pool membership ───────────────────────────────────────────────────────
function eqList(got, want, label){
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if(g === w) ok(label); else bad(label, 'got ' + g);
}
eqList(IA.EXLIB && IA.EXLIB.chest_acc, WANT_CHEST_ACC, 'G0a EXLIB.chest_acc matches the hand list');
eqList(IA.EXLIB && IA.EXLIB.chest_acc_joint, WANT_CHEST_ACC_JOINT, 'G0b EXLIB.chest_acc_joint matches the hand list');
[['chest_acc', IA.EXLIB.chest_acc], ['chest_acc_joint', IA.EXLIB.chest_acc_joint]].forEach(function(row){
  const n = row[1].filter(function(x){ return x === FP; }).length;
  if(n === 1) ok('G0c ' + row[0] + ' carries the floor press exactly once');
  else bad('G0c ' + row[0] + ' carries the floor press exactly once', 'count=' + n);
});

// ── G0d. copy rule on the new athlete-facing name ─────────────────────────────
if(!/\S[-—–]\S/.test(FP) && !/nike/i.test(FP)) ok('G0d the new name carries no mid-word hyphen, dash, or brand');
else bad('G0d the new name carries no mid-word hyphen, dash, or brand', FP);

// ── G2. classification ────────────────────────────────────────────────────────
// hpress by doctrine: a press whose bar path is horizontal to the torso.
const pat = IA._pattern(FP);
if(pat === 'hpress') ok("G2a _pattern('Dumbbell floor press') === 'hpress'");
else bad("G2a _pattern('Dumbbell floor press') === 'hpress'", 'got ' + JSON.stringify(pat));
if(pat !== 'vpress' && pat !== 'hinge' && pat !== 'hip_ext')
  ok('G2b the floor press is not classified vertical or as hip extension');
else bad('G2b the floor press is not classified vertical or as hip extension', 'got ' + pat);

// ── G3. NOT leg work (the reason the name omits 'glute-bridge') ───────────────
// Independent oracle: a hand list of the tokens the D18 long-run leg pass hunts for.
const D18_LEG_TOKENS = ['swing','clean','snatch','deadlift','romanian','rdl','good morning',
  'hip thrust','hip extension','glute bridge','squat','lunge','step-up','stepup','leg','calf',
  'calves','glute','nordic','broad jump','box jump','jump','bound','skater','wall ball','sled','pistol'];
const lower = FP.toLowerCase();
const hits = D18_LEG_TOKENS.filter(function(t){ return lower.indexOf(t) !== -1; });
if(!hits.length) ok('G3a the name contains no leg token from the hand list');
else bad('G3a the name contains no leg token from the hand list', hits.join(','));
const legRx = (function(){ try { return IA.eval('_D18_LEG_RX'); } catch(e){ return null; } })();
if(legRx && legRx.test(FP) === false) ok('G3b _D18_LEG_RX does not match the floor press');
else if(!legRx) bad('G3b _D18_LEG_RX does not match the floor press', '_D18_LEG_RX unreachable');
else bad('G3b _D18_LEG_RX does not match the floor press', 'matched');
// Control: the regex is live and still matches real leg work.
if(legRx && legRx.test('Barbell hip thrust')) ok('G3c control: _D18_LEG_RX still matches hip thrust');
else bad('G3c control: _D18_LEG_RX still matches hip thrust');

// ── G4/G5. shoulder/workaround swap ───────────────────────────────────────────
function planFor(region, tier){
  try { return IA.eval('injuryPlan')({ injury: { region: region, tier: tier } }); }
  catch(e){ return null; }
}
const shWA = planFor('shoulder', 'workaround');
if(shWA && shWA.swapNames && shWA.swapNames['Dumbbell bench press'] === FP)
  ok('G4a shoulder/workaround swaps the dumbbell bench to the floor press');
else bad('G4a shoulder/workaround swaps the dumbbell bench to the floor press', JSON.stringify(shWA && shWA.swapNames));
if(shWA && shWA.swapNames){
  const keys = Object.keys(shWA.swapNames);
  const self = keys.filter(function(k){ return shWA.swapNames[k] === k; });
  const chain = keys.filter(function(k){ return Object.prototype.hasOwnProperty.call(shWA.swapNames, shWA.swapNames[k]); });
  if(!self.length) ok('G4b no swap row self-maps'); else bad('G4b no swap row self-maps', self.join(','));
  if(!chain.length) ok('G4c no swap row chains'); else bad('G4c no swap row chains', chain.join(','));
  const eaten = keys.filter(function(k){ return shWA.dropNames && shWA.dropNames.test(shWA.swapNames[k]); });
  if(!eaten.length) ok('G4d the swap target is not eaten by the same tier dropNames');
  else bad('G4d the swap target is not eaten by the same tier dropNames', eaten.join(','));
} else { bad('G4b no swap row self-maps', 'no swapNames'); bad('G4c no swap row chains', 'no swapNames'); bad('G4d the swap target is not eaten by the same tier dropNames', 'no swapNames'); }
// Drive the real post-filter with a one-item section.
function filterOne(name, region, tier){
  const out = IA.applyInjuryFilter([{ label: 'T', items: [{ name: name, detail: '3×10' }] }],
    { injury: { region: region, tier: tier } });
  const it = out && out[0] && out[0].items && out[0].items[0];
  return it || null;
}
const swapped = filterOne('Dumbbell bench press', 'shoulder', 'workaround');
if(swapped && swapped.name === FP) ok('G5a applyInjuryFilter rewrites the bench to the floor press');
else bad('G5a applyInjuryFilter rewrites the bench to the floor press', swapped ? swapped.name : 'dropped');
if(swapped && /RPE/.test(swapped.detail || '')) ok('G5b the swapped item still prints an RPE clamp');
else bad('G5b the swapped item still prints an RPE clamp', swapped ? String(swapped.detail) : 'dropped');
// The protect tier drops hpress wholesale — the floor press must NOT survive there.
const prot = filterOne(FP, 'shoulder', 'protect');
if(!prot) ok('G5c shoulder/protect still drops the floor press with the whole hpress pattern');
else bad('G5c shoulder/protect still drops the floor press with the whole hpress pattern', prot.name);
// Healthy control: no injury, the bench is untouched.
const healthy = IA.applyInjuryFilter([{ label:'T', items:[{ name:'Dumbbell bench press', detail:'3×10' }] }], {});
const hn = healthy && healthy[0] && healthy[0].items && healthy[0].items[0];
if(hn && hn.name === 'Dumbbell bench press') ok('G5d control: no injury leaves the bench alone');
else bad('G5d control: no injury leaves the bench alone', hn ? hn.name : 'dropped');

// ── G1/G6. the equipment gate, measured on built programs ─────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
function cfgFor(equip, focus, seed){
  return { name:'GATE', experience:'intermediate', ageBracket:'18-35', equipment:equip, unit:'lbs',
    liftingFocus:focus, restDays:['sun'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:seed,
    primaryPath:'event', cardioTypes:['run'], eventTargeted:false,
    cardioGoals:{ run:{ id:'run_base', label:'Build Running Base', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } } };
}
const SEEDS = [76308, 11111, 4242, 909, 1234, 5678];
const FOCI = ['support_strength','support_athletic'];
const landmineBy = {}, floorBy = {};
let builds = 0, crashes = 0;
BARBELL_TIERS.concat(NO_BARBELL_TIERS).forEach(function(eq){
  landmineBy[eq] = 0; floorBy[eq] = 0;
  FOCI.forEach(function(f){ SEEDS.forEach(function(s){
    let prog;
    try { prog = IA.buildProgram(cfgFor(eq, f, s)); } catch(e){ crashes++; return; }
    builds++;
    const wk = prog.weeks || {};
    Object.keys(wk).forEach(function(w){ Object.keys(wk[w]).forEach(function(d){
      const day = wk[w][d]; if(!day || day.rest) return;
      (day.sections || []).forEach(function(sec){ (sec.items || []).forEach(function(it){
        const n = it && it.name || '';
        if(n === LM) landmineBy[eq]++;
        if(n === FP) floorBy[eq]++;
      }); });
    }); });
  }); });
});
if(!crashes) ok('G6a lattice built clean (' + builds + ' builds)');
else bad('G6a lattice built clean', crashes + ' crashes');
NO_BARBELL_TIERS.forEach(function(eq){
  if(landmineBy[eq] === 0) ok('G1 no landmine press on the no-barbell tier ' + eq);
  else bad('G1 no landmine press on the no-barbell tier ' + eq, landmineBy[eq] + ' occurrences');
});
BARBELL_TIERS.forEach(function(eq){
  if(landmineBy[eq] > 0) ok('G6b the landmine press survives on the barbell tier ' + eq + ' (' + landmineBy[eq] + ')');
  else bad('G6b the landmine press survives on the barbell tier ' + eq, 'gate deleted the content');
});
// D43 reachability: the floor press must actually print on loaded tiers.
const loadedFloor = ['home_basic','home_full','commercial'].reduce(function(a,e){ return a + floorBy[e]; }, 0);
if(loadedFloor > 0) ok('G6c the floor press reaches loaded tiers from the pool (' + loadedFloor + ')');
else bad('G6c the floor press reaches loaded tiers from the pool', '0 occurrences');
if(floorBy['bodyweight'] === 0) ok('G6d the floor press never prints on the bodyweight tier');
else bad('G6d the floor press never prints on the bodyweight tier', floorBy['bodyweight'] + ' occurrences');

// ── G7. source shape: the no-barbell shoulder branch is the hand list ─────────
const SRC = fs.readFileSync(FILE, 'utf8');
const line = (SRC.split('\n').filter(function(l){ return /const shoulderAccPool\s*=/.test(l); })[0] || '');
const inner = (line.match(/\[([^\]]*)\]/) || [null, ''])[1];
const got = inner ? inner.split(',').map(function(x){ return x.trim().replace(/^'|'$/g, ''); }) : [];
eqList(got, WANT_SHOULDER_NOBAR, 'G7a the no-barbell shoulder branch is the hand list, in order');
if(/hasBarbell\?EXLIB\.shoulder/.test(line.replace(/\s/g, ''))) ok('G7b the barbell branch is EXLIB.shoulder untouched');
else bad('G7b the barbell branch is EXLIB.shoulder untouched', line.trim().slice(0, 120));

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
