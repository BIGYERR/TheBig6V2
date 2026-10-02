// v227_d190_premises_post.js — MEASURE (read-only). Post-pass over v227_d190_premises.js output in SCR:
// gate FAIL lines at 227, the P1 sample residue vs V226, class (iii) by capped end, the ruling's table rows by content,
// and the exSwapPrefs dose probe.
'use strict';
const fs = require('fs'), path = require('path'); const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const F = n => path.join(SCR, n); const CUE = ' — hold RPE 7, two in the tank';
const CAP = { 'knee/workaround':['squat','lunge','leg_iso'], 'ankle/workaround':['squat','lunge'], 'hip/workaround':['hinge','lunge','hip_ext','squat'],
  'lowback/workaround':['hinge','squat','row','hip_ext'], 'shoulder/workaround':['hpress','vpress','delt_iso'], 'elbow/workaround':['hpress','tri_iso','bi_iso','row','vpull'] };
const CKI = { mario:'knee/workaround', ankle_wa:'ankle/workaround', hip_wa:'hip/workaround', lowback_wa:'lowback/workaround', shoulder_wa:'shoulder/workaround', elbow_wa:'elbow/workaround', knee_protect:'knee/protect' };
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
console.log('\n=== POST: gate lines at D190@227 that are not PASS (gates whose counts moved)');
for(const g of ['g193_samecard.js','g198_posterior_floor.js','g199_deload_arbitration.js','g200_core_tier.js','g200_pull_arbitration.js','g202_d108_touchset_freeze.js','g202_pace_anchor.js','g202_pace_copy.js','g203_mile_pencil.js']){
  const t = fs.readFileSync(F('job_G__' + g + '__D190_227.out'), 'utf8').split('\n');
  const bad = t.filter(x => /FAIL|REFUSED|Error|NO ROW|NO ERA/.test(x) && !/^PASS \d+ FAIL \d+$/.test(x));
  console.log('  ' + g + ': ' + bad.length + ' lines' + (bad.length ? '' : ' | tail: ' + t.slice(-4).join(' / ').slice(0, 300)));
  bad.slice(0, 3).forEach(x => console.log('    ' + x.trim().slice(0, 260)));
}
const rd = (t, ck) => JSON.parse(fs.readFileSync(F('res_' + t + '_' + ck + '.json'), 'utf8'));
const CK = ['mario','manny','mario_noinj','knee_protect','ankle_wa','hip_wa','lowback_wa','shoulder_wa','elbow_wa'];
const B = new Map(), D = new Map(); CK.forEach(ck => { rd('BASE', ck).forEach(r => B.set(r.id, r)); rd('D190', ck).forEach(r => D.set(r.id, r)); });
console.log('\n=== POST P1: D190 sample residue rows against V226');
const dres = [...D.values()].filter(r => !r.unreach && ['hop3','cyc3','collide2','exch3'].includes(r.cls) && (r.bootSig !== r.liveSig || r.slotBoot.d !== r.slotLive.d));
const bres = [...B.values()].filter(r => !r.unreach && ['hop3','cyc3','collide2','exch3'].includes(r.cls) && (r.bootSig !== r.liveSig || r.slotBoot.d !== r.slotLive.d));
console.log('  D190 residue ' + dres.length + ', of them V226 residue with identical live AND boot slot ' + dres.filter(r => { const b = B.get(r.id); return b.slotLive.d === r.slotLive.d && b.slotBoot.d === r.slotBoot.d && b.bootSig !== b.liveSig; }).length
  + ' | V226 sample residue ' + bres.length + ', healed by D190 ' + bres.filter(r => { const d = D.get(r.id); return d.bootSig === d.liveSig; }).length + ' ' + fmt(tally(bres.filter(r => D.get(r.id).bootSig === D.get(r.id).liveSig), r => r.ck + '|' + r.cls)));
dres.forEach(r => { const b = B.get(r.id); console.log('  ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' "' + r.label + '"\n    ' + r.pre.n + ' (' + r.pre.d + ')' + r.hops.map((h, k) => ' > ' + h + ' [' + JSON.stringify(r.steps[k].d) + ']').join('')
  + '\n    D190 live ' + JSON.stringify(r.slotLive.d) + ' boot ' + JSON.stringify(r.slotBoot.d) + '\n    V226 live ' + JSON.stringify(b.slotLive.d) + ' boot ' + JSON.stringify(b.slotBoot.d) + ' | donor cued ' + r.pre.d.endsWith(CUE) + ' | any step cued ' + r.steps.some(s => s.d.endsWith(CUE))); });
console.log('\n=== POST P3: class (iii) (RPE 7 form -> RPE 8 form) by whether the end pattern is capped (cap table typed from the ruling; knee/protect not in it)');
{ const iii = [...D.values()].filter(r => !r.unreach && ['hop1','hop2','cyc2'].includes(r.cls) && B.get(r.id).slotLive.d !== r.slotLive.d && /RPE 8 \(stop 2 reps short of failure\)/.test(r.slotLive.d) && /RPE 7 \(leave 3 or more in reserve\)/.test(B.get(r.id).slotLive.d));
  console.log('  (iii) ' + iii.length + ' | ' + fmt(tally(iii, r => r.ck + '|' + (CAP[CKI[r.ck]] ? (CAP[CKI[r.ck]].includes(r.pat) ? 'END CAPPED (plan wants 7, card 8)' : 'end uncapped') : 'no hand table') + '|' + r.pat)));
  const ii = [...D.values()].filter(r => !r.unreach && ['hop1','hop2','cyc2'].includes(r.cls) && B.get(r.id).slotLive.d === r.slotLive.d + CUE);
  console.log('  (ii) ' + ii.length + ' | ' + fmt(tally(ii, r => r.ck + '|' + (CAP[CKI[r.ck]] ? (CAP[CKI[r.ck]].includes(r.pat) ? 'END CAPPED' : 'end uncapped') : 'no hand table'))));
  const ex = iii.filter(r => r.ck === 'elbow_wa').slice(0, 2).concat(ii.filter(r => r.ck === 'lowback_wa').slice(0, 1));
  ex.forEach(r => console.log('    e.g. ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' ' + r.pre.n + ' (' + r.pre.d + ') > ' + r.hops.join(' > ') + ' [' + r.pat + '] V226 ' + JSON.stringify(B.get(r.id).slotLive.d) + ' -> D190 ' + JSON.stringify(r.slotLive.d)));
}
console.log('\n=== POST: the ruling\'s before/after table rows, found by content (D190 tree)');
const find = (ck, w, d, chain) => [...D.values()].filter(r => r.ck === ck && r.w === w && r.d === d && [r.pre.n].concat(r.hops).join(' > ') === chain);
for(const [ck, w, d, chain] of [['mario',5,'thu','Kettlebell swing > Dumbbell split-stance deadlift > Dumbbell goblet squat'],['mario',5,'thu','Kettlebell swing > Dumbbell split-stance deadlift > Reverse lunge (KB)'],
  ['mario',5,'thu','Kettlebell swing > Dumbbell split-stance deadlift > Leg press'],['mario',5,'thu','Kettlebell swing > Barbell hip thrust > Leg extension'],['mario',5,'sat','Kettlebell swing > Dumbbell split-stance deadlift > Dumbbell goblet squat'],
  ['ankle_wa',3,'thu','Kettlebell swing > Dumbbell goblet squat > Dumbbell split-stance deadlift'],['ankle_wa',3,'thu','Kettlebell swing > Dumbbell goblet squat > Nordic hamstring curl (anchored)']]){
  const rr = find(ck, w, d, chain); if(!rr.length){ console.log('  ' + ck + ' W' + w + ' ' + d + ' ' + chain + ': (not on lattice)'); continue; }
  rr.forEach(r => { const b = B.get(r.id); console.log('  ' + r.id + ' ' + ck + ' W' + w + ' ' + d + ' "' + r.label + '" ' + chain + ' (' + r.pre.d + ')\n    D190 steps ' + r.steps.map(s => JSON.stringify(s.d)).join(' , ') + ' | boot ' + JSON.stringify(r.slotBoot.d) + ' | toasts ' + r.toasts.map(x => x.replace(/^.* out\. /, '')).join(' + ')
    + '\n    V226 steps ' + b.steps.map(s => JSON.stringify(s.d)).join(' , ') + ' | boot ' + JSON.stringify(b.slotBoot.d)); }); }
console.log('\n=== POST P5c probe: where the exSwapPrefs build moves the dose');
{ const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
  for(const [t, f] of [['HEAD', 'base_v226.html'], ['D190', 'd190_226.html']]){ const X = load(F(f));
    console.log('  ' + t + ' _swapDetailFor(DB split-stance DL, "2×10 each") = ' + JSON.stringify(X.eval('_swapDetailFor("Dumbbell split-stance deadlift","2×10 each")'))
      + ' | (…, "2×10 each' + CUE + '") = ' + JSON.stringify(X.eval('_swapDetailFor("Dumbbell split-stance deadlift",' + JSON.stringify('2×10 each' + CUE) + ')')));
    const cfg = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
    const p = X.buildProgram(JSON.parse(JSON.stringify(cfg)));
    const rows = []; Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach(s => (s.items || []).forEach(it => { if(it.name === 'Reverse lunge (KB)') rows.push('W' + w + ' ' + d + ' ' + JSON.stringify(it.detail)); })); }));
    console.log('    no-pref build, every Reverse lunge (KB): ' + rows.join(' ; '));
  }
}
