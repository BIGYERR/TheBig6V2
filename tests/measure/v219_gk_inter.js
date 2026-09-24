'use strict';
// gatekeeper: per changed day, which single rulings move it alone, and does the chain card equal the lone single's card.
const fs=require('fs');const REPO='/Users/CanasBangin/Desktop/TheBig6V2';const {load}=require(REPO+'/tests/harness.js');
const U=require('/tmp/v219_gk_U.js');const SH=+process.argv[2],NS=+process.argv[3];const cl=o=>JSON.parse(JSON.stringify(o));
const A={base:'/tmp/base_V218.html',cand:REPO+'/index.html',g1:'/tmp/v219_cf_step1.html'};for(let k=2;k<=7;k++)A['g'+k]='/tmp/v219_single'+k+'.html';
const IA={};for(const k in A)IA[k]=load(A[k]);const T={};const bump=k=>T[k]=(T[k]||0)+1;
const strip=p=>JSON.parse(JSON.stringify(p,(k,v)=>(k==='id'||k==='created')?undefined:v));const J=o=>JSON.stringify(o===undefined?null:o);
const ORD=['mon','tue','wed','thu','fri','sat','sun'];
for(let ui=SH;ui<U.length;ui+=NS){const x=U[ui];const P={};for(const k in IA)P[k]=strip(IA[k].buildProgram(cl(x.c)));
 const L={W:'WIDE',X:'extra',C:'D167lat'}[x.lat];
 Object.keys(P.base.weeks).forEach(w=>ORD.forEach(d=>{const b=P.base.weeks[w][d],c=P.cand.weeks[w][d];if(J(b)===J(c))return;
  const mv=[];for(let k=1;k<=7;k++)if(J(P['g'+k].weeks[w][d])!==J(b))mv.push(k);
  if(!mv.length){bump(L+' no-single');return;}
  if(mv.length>1){bump(L+' multi-single');if(!mv.some(k=>J(P['g'+k].weeks[w][d])===J(c)))bump(L+' multi, chain != any single');return;}
  if(J(P['g'+mv[0]].weeks[w][d])!==J(c))bump(L+' lone single '+mv[0]+', chain card differs');}));}
fs.writeFileSync('/tmp/v219_gk/in_'+SH+'.json',JSON.stringify(T));
