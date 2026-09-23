// V205 slice 8 — measure: the three HALF_MANNY era arms, built on any artifact given on argv.
// Arms are constructed EXACTLY as their consuming gates construct them:
//   shipped   — g197a/g198/g199 B1: pristine load, buildProgram(HALF_MANNY)
//   deloadOff — g199 B2: pristine load, globalThis.__DELOAD_OFF=true, then build
//   coreOff   — g200_core_tier F1a: source-surgery copy with the one V200
//               family-core clause line removed, then build
// Usage: node tests/measure/v205_slice8_era_arms.js <artifact.html> [more.html ...]
const fs=require('fs'), os=require('os'), path=require('path');
const {load, fixtures, progDigest,
       MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
       MANNY_CORE_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));

const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";

function arms(ART){
  const RAW=fs.readFileSync(ART,'utf8');
  const n=RAW.split(CLAUSE).length-1;
  if(n!==1) throw new Error('core clause count '+n+' in '+ART+': counterfactual not constructible');
  const I=load(ART);
  const shipped=progDigest(I.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  I.eval("globalThis.__DELOAD_OFF=true;");
  const deloadOff=progDigest(I.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  I.eval("globalThis.__DELOAD_OFF=false;");
  const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'v205era-'));
  const MP=path.join(TMP,'counterfactual.html');
  fs.writeFileSync(MP, RAW.replace(CLAUSE,''));
  const M=load(MP);
  const coreOff=progDigest(M.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  return {version:I.version, shipped, deloadOff, coreOff};
}

const files=process.argv.slice(2);
const rows=files.map(f=>({file:f, a:arms(f)}));
rows.forEach(r=>{
  console.log('ARTIFACT '+r.file+'  ia-version '+r.a.version);
  console.log('  shipped    '+r.a.shipped+'   [table row for '+r.a.version+': '+(MANNY_DIGEST_BY_VERSION[r.a.version]||'NO ROW')+']');
  console.log('  deloadOff  '+r.a.deloadOff+'   [table row for '+r.a.version+': '+(MANNY_DELOAD_OFF_DIGEST_BY_VERSION[r.a.version]||'NO ROW')+']');
  console.log('  coreOff    '+r.a.coreOff+'   [table row for '+r.a.version+': '+(MANNY_CORE_OFF_DIGEST_BY_VERSION[r.a.version]||'NO ROW')+']');
});
if(rows.length===2){
  const [a,b]=rows.map(r=>r.a);
  ['shipped','deloadOff','coreOff'].forEach(k=>{
    console.log('CROSS '+k+': '+(a[k]===b[k]?'IDENTICAL':'MOVED '+a[k]+' -> '+b[k]));
  });
}
