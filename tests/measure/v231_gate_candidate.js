// V231 M18 measure pass: every HEAD gate, one at a time, on the real V231 candidate and on part trees, V230 baseline.
// Usage: node tests/measure/v231_gate_candidate.js <scratch>   (scratch must already hold cand.html, v230.html,
//   t_B.html, t_ABx.html, t_PREx.html copied from coach2/). Gates run from a fresh `git clone` of HEAD into the scratch
//   (doctrine/ copied in), so gate files a concurrent builder writes or edits in the working tree cannot reach the run.
// Trees: v230 (control), cand (231), stamp (v230 stamped 231: version-only), B231/ABx231/PREx231 (part trees stamped 231).
// Alias clone repoX: appends X[231]=X[230] after every `X[230] =` table line in harness.js and gates/*.js (M16's method),
//   so a gate red only for a missing [231] row prints the figure it measures at 231.
const {execSync}=require('child_process'), fs=require('fs'), path=require('path');
const S=process.argv[2], R=path.join(__dirname,'..','..');
if(!S) { console.error('usage: node v231_gate_candidate.js <scratch>'); process.exit(2); }
const sh=c=>execSync("bash -c 'set -eo pipefail; "+c.replace(/'/g,"'\\''")+"'",{stdio:'inherit',maxBuffer:1<<28});
const A='<meta name="ia-version" content="230">', B='<meta name="ia-version" content="231">';
for (const [src,dst] of [['v230','stamp'],['t_B','B231'],['t_ABx','ABx231'],['t_PREx','PREx231']]) {
  const d=fs.readFileSync(`${S}/${src}.html`,'utf8'); if (d.split(A).length!==2) throw new Error('anchor '+src);
  fs.writeFileSync(`${S}/${dst}.html`, d.replace(A,B));
}
sh(`rm -rf ${S}/repo ${S}/repoX; git clone -q ${R} ${S}/repo; mkdir -p ${S}/repo/doctrine; cp ${R}/doctrine/*.txt ${S}/repo/doctrine/ 2>/dev/null || true; git clone -q ${R} ${S}/repoX; mkdir -p ${S}/repoX/doctrine; cp ${R}/doctrine/*.txt ${S}/repoX/doctrine/ 2>/dev/null || true`);
const X=S+'/repoX/tests';
for (const fn of ['harness.js',...fs.readdirSync(X+'/gates').filter(f=>f.endsWith('.js')).map(f=>'gates/'+f)]) {
  const p=X+'/'+fn; const s=fs.readFileSync(p,'utf8').split('\n').flatMap(l=>{const m=l.match(/^([A-Za-z_][A-Za-z0-9_]*)\[230\]\s*=/);return m?[l,`${m[1]}[231]=${m[1]}[230];`]:[l];}).join('\n');
  fs.writeFileSync(p,s);
}
fs.writeFileSync(S+'/worker.sh','#!/usr/bin/env bash\nnode "$1" "$W_CAND" "$W_BASE" > "$W_OUT/$(basename "$1").out" 2>&1; echo "EXIT $?" >> "$W_OUT/$(basename "$1").out"; exit 0\n',{mode:0o755});
const gates=execSync(`git -C ${S}/repo ls-tree --name-only HEAD tests/gates/`).toString().trim().split('\n').filter(f=>f.endsWith('.js')).map(f=>path.basename(f));
console.log('HEAD gates', gates.length);
const runSet=(repo,tree,out,list)=>{ fs.writeFileSync(`${S}/gl_${out}`,list.map(g=>`${S}/${repo}/tests/gates/${g}`).join('\0')+'\0');
  sh(`rm -rf ${S}/${out}; mkdir -p ${S}/${out}; W_CAND=${S}/${tree}.html W_BASE=${S}/v230.html W_OUT=${S}/${out} xargs -0 -n1 -P8 ${S}/worker.sh < ${S}/gl_${out}`); };
const summ=(out)=>{ const r={}; for (const o of fs.readdirSync(S+'/'+out)) { const t=fs.readFileSync(S+'/'+out+'/'+o,'utf8');
  const m=t.match(/^PASS (\d+) FAIL (\d+)/m); r[o.replace(/\.out$/,'')]= m?{p:+m[1],f:+m[2],ref:(t.match(/^REFUSED/mg)||[]).length}:{crash:true}; } return r; };
const which=(process.argv[3]||'all');
const sets=[['repo','v230','per_v230'],['repo','cand','per_cand'],['repo','stamp','per_stamp']];
for (const [repo,tree,out] of sets) if (which==='all'||which===out) runSet(repo,tree,out,gates);
const red=r=>Object.keys(r).filter(k=>r[k].crash||r[k].f||r[k].ref);
let candRed=red(summ('per_cand')); let stampRed=red(summ('per_stamp'));
const reds=[...new Set([...candRed,...stampRed])]; // keys already end in .js (out files are <gate>.js.out)
for (const t of ['B231','ABx231','PREx231']) if (which==='all'||which==='parts') runSet('repo',t,'per_'+t,reds);
for (const t of ['stamp','cand','B231','ABx231','PREx231']) if (which==='all'||which==='alias') runSet('repoX',t,'gx_'+t,reds);
for (const out of ['per_v230','per_stamp','per_cand','per_B231','per_ABx231','per_PREx231','gx_stamp','gx_B231','gx_ABx231','gx_PREx231','gx_cand']) {
  if (!fs.existsSync(S+'/'+out)) continue; const r=summ(out); const k=Object.keys(r); const rr=red(r);
  console.log(`TOTAL ${out}: gates ${k.length}, failing ${rr.filter(g=>!r[g].crash&&r[g].f).length}, crashed ${rr.filter(g=>r[g].crash).length}, refusing ${rr.filter(g=>!r[g].crash&&r[g].ref).length}`);
  for (const g of rr) console.log(`  ${out} ${g} ${r[g].crash?'CRASH':`PASS ${r[g].p} FAIL ${r[g].f} REFUSED ${r[g].ref}`}`);
}
