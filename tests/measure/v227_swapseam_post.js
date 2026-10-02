// v227_swapseam_post.js — MEASURE (read-only). Post-pass over v227_swapseam.js worker output (res_<tree>_<cfg>.json in SCR):
// the S1 survivors in full, whether they were BASE residue, and where the boot re-filter still writes after the surgery.
'use strict';
const fs = require('fs'), path = require('path'); const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const CUE = ' — hold RPE 7, two in the tank';
const rd = (t, ck) => JSON.parse(fs.readFileSync(path.join(SCR, 'res_' + t + '_' + ck + '.json'), 'utf8'));
for(const ck of ['ankle_wa', 'mario']){
  const B = new Map(rd('BASE', ck).map(r => [r.id, r])), S = rd('S1', ck);
  const surv = S.filter(r => r.slotBoot.d !== r.slotLive.d);
  console.log('== ' + ck + ' S1 survivors ' + surv.length + ' | of them BASE residue ' + surv.filter(r => B.get(r.id).slotBoot.d !== B.get(r.id).slotLive.d).length);
  surv.forEach(r => { const b = B.get(r.id); console.log('  ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' [' + r.si + '][' + r.ii + '] "' + r.label + '"\n    donor ' + r.pre.n + ' (' + r.pre.d + ')'
    + r.hops.map((h, i) => '\n    hop' + (i + 1) + ' -> ' + h + ' | S1 live ' + JSON.stringify(r.steps[i].d) + ' | BASE live ' + JSON.stringify(b.steps[i].d) + ' | toast S1 ' + r.toasts[i].replace(/^.* out\. /, '')).join('')
    + '\n    S1 boot ' + JSON.stringify(r.slotBoot.d) + ' | BASE boot ' + JSON.stringify(b.slotBoot.d) + ' | BASE live ' + JSON.stringify(b.slotLive.d)); });
  // where does the boot re-filter still write in S1? compare the BASE bfDiff item-level
  const ch = S.filter(r => r.bfCh > 0);
  const where = {}; ch.forEach(r => { const [bf, af] = r.bfDiff.split('  ==>  '); const bi = bf.split(/[{};]/), ai = af.split(/[{};]/); const diffs = ai.filter((x, i) => x !== bi[i]);
    const k = diffs.map(x => x.endsWith(CUE) ? 'cue added on ' + (x.split('|')[0] === r.slotLive.n ? 'the swapped item' : 'another item') : 'other').join('+') || 'none'; where[k] = (where[k] || 0) + 1; });
  console.log('  S1 boot re-filter writes ' + ch.length + ': ' + JSON.stringify(where));
  // RPE-bearing donor chains on capped targets: how many end in a capped pattern with RPE in the detail (cue never appended)
  const capRPE = S.filter(r => /RPE/.test(r.pre.d) && r.slotLive.d === B.get(r.id).slotLive.d && r.hops.length > 0).length;
  console.log('  chains with RPE-bearing donor: ' + S.filter(r => /RPE/.test(r.pre.d)).length + ' / ' + S.length + ', live unchanged by S1 among them ' + capRPE + ' | live moved by S1 among RPE-bearing donors ' + S.filter(r => /RPE/.test(r.pre.d) && r.slotLive.d !== B.get(r.id).slotLive.d).length);
}
