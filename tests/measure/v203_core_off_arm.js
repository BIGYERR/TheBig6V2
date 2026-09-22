// ════════════════════════════════════════════════════════════════════════════════════
// v203_core_off_arm.js — D120 provenance for MANNY_CORE_OFF_DIGEST_BY_VERSION.
//
// D120 repointed g200_core_tier F1a off the literal 6e32421331693437 and onto the
// harness era table, because D117 moved BOTH arms on V203. This is the script that
// printed the numbers those rows carry. It walks the V199 to V203 tag artifacts and
// prints, for each one, the shipped HALF_MANNY digest and the counterfactual digest
// with the core clause stripped, so both arms of every era row are reproducible from
// the artifacts themselves rather than read back off the build that pinned them.
//
// Standing ruling 5: the V203 row was printed by coach from SOURCE SURGERY on a copy,
// BEFORE the pin was written into tests/harness.js. It is not a digest read off the
// built artifact after the fact.
//
// Copied VERBATIM from coach's pass. Logic unaltered; only this header was added.
//
// usage: node tests/measure/v203_core_off_arm.js <dir holding v199.html .. v203.html>
//        (artifacts extracted with `git show V<N>:index.html > <dir>/v<N>.html`)
// ════════════════════════════════════════════════════════════════════════════════════
const fs=require('fs'), path=require('path');
const {load, fixtures, weekGrid, progDigest, MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const S=process.argv[2];
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const cfg=()=>JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
const out={};
for(const v of [199,200,201,202,203]){
  const p=path.join(S,'v'+v+'.html'); const RAW=fs.readFileSync(p,'utf8');
  const ver=(RAW.match(/ia-version" content="(\d+)"/)||[])[1];
  const n=RAW.split(CLAUSE).length-1;
  const IA=load(p); const digC=progDigest(IA.buildProgram(cfg()));
  const mp=path.join(S,'ct'+v+'.html'); fs.writeFileSync(mp, RAW.replace(CLAUSE,''));
  const MO=load(mp); const digM=progDigest(MO.buildProgram(cfg()));
  out[v]={IA,MO};
  console.log(`V${v} (artifact says ${ver})  clause_count=${n}  shipped=${digC}  era_row=${MANNY_DIGEST_BY_VERSION[v]}  counterfactual(clause stripped)=${digM}  arms_differ=${digC!==digM}`);
}
// V203: which cards differ between the two arms
const gC=weekGrid(out[203].IA.buildProgram(cfg())), gM=weekGrid(out[203].MO.buildProgram(cfg()));
const lc=(typeof gC==='string'?gC.split('\n'):gC), lm=(typeof gM==='string'?gM.split('\n'):gM);
console.log(`\nV203 arm diff: ${lc.length} grid lines shipped vs ${lm.length} counterfactual`);
let d=0; for(let i=0;i<Math.max(lc.length,lm.length);i++){ if(lc[i]!==lm[i]){ d++; if(d<=12){ console.log('  SHIP  '+lc[i]); console.log('  CTF   '+lm[i]); } } }
console.log(`  differing lines: ${d} of ${lc.length}`);
