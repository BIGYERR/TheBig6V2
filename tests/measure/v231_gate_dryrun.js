// V231 M16 measure pass: full gate.sh dry run on copies stamped ia-version 231 (Handoff §10b V230 lesson).
// Record of what ran. The shell below is byte-for-byte the scripts executed in the measure3 scratch
// (setup.sh, run.sh gate.sh part, run2.sh per-gate, mkgx.py alias tree, run3.sh, summ.sh). This wrapper was not
// re-executed end to end (runtime ~70 min). Usage: node tests/measure/v231_gate_dryrun.js <scratchdir> <coach t_ALL.html>
// Copies: STAMP = index.html (V230) 230->231; ALL231 = coach1/t_ALL.html 230->231; baseline = git show HEAD:index.html.
// Each copy asserts anchor count 1 and a one-line diff. gate.sh stops at the first red, so every gate is also run alone.
// The alias tree (scratch only) appends X[231]=X[230] after every `X[230] =` table line in harness.js and gates/*.js and gives
// g199/g200_pull an ALL231 variant of the A_PIPE anchor, so each NO-ROW gate prints the figure it measures at 231.
const {execSync}=require('child_process'), fs=require('fs'), path=require('path');
const S=process.argv[2], C1=process.argv[3], R=path.join(__dirname,'..','..');
if(!S||!C1){ console.error('usage: node v231_gate_dryrun.js <scratch> <t_ALL.html>'); process.exit(2); }
const sh=c=>execSync("bash -c 'set -eo pipefail; "+c.replace(/'/g,"'\\''")+"'",{stdio:'inherit',maxBuffer:1<<28});
fs.mkdirSync(S,{recursive:true});
const A='<meta name="ia-version" content="230">', B='<meta name="ia-version" content="231">';
sh(`git -C ${R} show HEAD:index.html > ${S}/base_v230.html; cp ${R}/index.html ${S}/v230ctl.html`);
for(const [src,dst] of [[R+'/index.html',S+'/stamp231.html'],[C1,S+'/all231.html']]){
  const d=fs.readFileSync(src,'utf8'); const n=d.split(A).length-1; console.log(dst,'anchor count',n); if(n!==1) throw new Error('anchor');
  fs.writeFileSync(dst,d.replace(A,B));
  const diff=execSync(`diff ${src} ${dst} || true`).toString(); const n2=(diff.match(/^[<>]/mg)||[]).length; console.log('diff lines',n2); if(n2!==2) throw new Error('diff');
}
for(const c of ['v230ctl','stamp231','all231']) sh(`rm -f ${S}/gate_${c}.out; bash ${R}/tests/gate.sh ${S}/${c}.html ${S}/base_v230.html > ${S}/gate_${c}.out 2>&1 || echo "EXIT $?" >> ${S}/gate_${c}.out`);
fs.writeFileSync(S+'/worker.sh','#!/usr/bin/env bash\nnode "$1" "$W_CAND" "$W_BASE" > "$W_OUT/$(basename "$1").out" 2>&1; echo "EXIT $?" >> "$W_OUT/$(basename "$1").out"; exit 0\n',{mode:0o755});
const gl=fs.readdirSync(R+'/tests/gates').filter(f=>f.endsWith('.js')).map(f=>R+'/tests/gates/'+f).join('\0')+'\0'; fs.writeFileSync(S+'/gatelist',gl);
for(const c of ['stamp231','all231']) sh(`rm -rf ${S}/per_${c}; mkdir -p ${S}/per_${c}; W_CAND=${S}/${c}.html W_BASE=${S}/base_v230.html W_OUT=${S}/per_${c} xargs -0 -n1 -P8 ${S}/worker.sh < ${S}/gatelist`);
// alias tree
const G=S+'/gx'; sh(`rm -rf ${G}; mkdir -p ${G}; cd ${R}/tests; tar cf - --exclude='*.out.txt' --exclude='*.html' . | (cd ${G}; tar xf -)`);
for(const fn of ['harness.js',...fs.readdirSync(G+'/gates').filter(f=>f.endsWith('.js')).map(f=>'gates/'+f)]){
  const p=G+'/'+fn; let s=fs.readFileSync(p,'utf8').split('\n').flatMap(l=>{const m=l.match(/^([A-Za-z_][A-Za-z0-9_]*)\[230\]\s*=/);return m?[l,`${m[1]}[231]=${m[1]}[230];`]:[l];}).join('\n');
  if(/g199_deload|g200_pull/.test(fn)){ const a="function pipeFor(RAW){ return RAW.split(A_PIPE_D155).length-1===1?[A_PIPE_D155,A_PIPE_R_D155]:[A_PIPE,A_PIPE_R]; }";
    if(s.split(a).length!==2) throw new Error('pipeFor anchor '+fn);
    s=s.replace(a,"const A_PIPE_231=A_PIPE_D155.replace(\",role,cardio,goal)};\",\",role,cardio,goal,cfg.liftingFocus==='support_prevention')};\");const A_PIPE_R_231=A_PIPE_R_D155.replace('capRegionalFatigue(__p2,role,cardio,goal)',\"capRegionalFatigue(__p2,role,cardio,goal,cfg.liftingFocus==='support_prevention')\");function pipeFor(RAW){ if(RAW.split(A_PIPE_231).length-1===1) return [A_PIPE_231,A_PIPE_R_231]; return RAW.split(A_PIPE_D155).length-1===1?[A_PIPE_D155,A_PIPE_R_D155]:[A_PIPE,A_PIPE_R]; }"); }
  fs.writeFileSync(p,s);
}
const G3=['g193_samecard','g197a_pool_static','g197b_sweep','g198_posterior_floor','g199_deload_arbitration','g200_core_tier','g200_pull_arbitration','g202_d108_touchset_freeze','g219_samecard_draws','g203_mile_pencil','g204_clock_limb','g210_equipment_denials'];
fs.writeFileSync(S+'/gl3',G3.map(g=>G+'/gates/'+g+'.js').join('\0')+'\0');
for(const c of ['stamp231','all231']) sh(`rm -rf ${S}/gx_${c}; mkdir -p ${S}/gx_${c}; W_CAND=${S}/${c}.html W_BASE=${S}/base_v230.html W_OUT=${S}/gx_${c} xargs -0 -n1 -P8 ${S}/worker.sh < ${S}/gl3`);
// summary: a gate with no PASS n FAIL n line is a crash
for(const c of ['stamp231','all231']){ let n=0,f=0,cr=0,rf=0; for(const o of fs.readdirSync(S+'/per_'+c)){ const t=fs.readFileSync(S+'/per_'+c+'/'+o,'utf8'); n++;
  const m=t.match(/^PASS (\d+) FAIL (\d+)/m); const r=(t.match(/^REFUSED/mg)||[]).length; if(!m){cr++;console.log('CRASH',c,o);continue;} if(+m[2])f++; if(r)rf++;
  if(+m[2]||r) console.log(c,o,m[0],'REFUSED',r); }
  console.log(`TOTAL ${c}: gates ${n}, failing ${f}, crashed ${cr}, refusing ${rf}`); }
