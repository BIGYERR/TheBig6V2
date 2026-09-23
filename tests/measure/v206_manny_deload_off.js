'use strict';
// V206 (D109 digest correction): HALF_MANNY's deload-off digest read with g199's OWN method
// (A_PIPE -> A_PIPE_R instrument, __DELOAD_OFF=true, progDigest of buildProgram(HALF_MANNY)) on the
// V205 tag, the pre-build source-surgery copy, and the built artifact. Provenance of
// MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206]; the V205 line must reproduce 8fe23ae9eadde78c first.
// usage: node tests/measure/v206_manny_deload_off.js <dir>  where <dir> holds v205.html
// (git show V205:index.html) and v206cf.html (from v206_d109_d137_surgery.js); instr_*.html land there.
const fs=require('fs'),path=require('path'); const {load,fixtures,progDigest}=require(path.join(__dirname,'..','harness.js'));
const G=fs.readFileSync(path.join(__dirname,'..','gates','g199_deload_arbitration.js'),'utf8');
const A_PIPE=eval(G.match(/const A_PIPE=(".*");/)[1]);
const A_PIPE_R=eval('['+G.match(/const A_PIPE_R=\[([\s\S]*?)\]\.join\("\\n"\);/)[1]+'].join("\\n")');
const SNAP_FN=eval(G.match(/const SNAP_FN=("[\s\S]*?");\nfunction instrument/)[1]);
const S=process.argv[2];
for(const [k,art] of [['V205 tag',path.join(S,'v205.html')],['surgery',path.join(S,'v206cf.html')],['artifact 206',path.join(__dirname,'..','..','index.html')]]){
  const RAW=fs.readFileSync(art,'utf8'); const n=RAW.split(A_PIPE).length-1; const ip=path.join(S,'instr_'+k.replace(/\W/g,'')+'.html'); fs.writeFileSync(ip,RAW.replace(A_PIPE,A_PIPE_R));
  const IP=load(ip); IP.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
  const on=progDigest(IP.buildProgram(fixtures.HALF_MANNY)); IP.eval("globalThis.__DELOAD_OFF=true;"); const off=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
  console.log(k,'ia',IP.version,'A_PIPE count',n,'| ON',on,'| DELOAD_OFF (g199 method)',off);
}
