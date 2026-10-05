const fs=require('fs'),path=require('path');const SCR=process.cwd();
const loadRes=pre=>{const R=[];fs.readdirSync(SCR).filter(f=>new RegExp('^res_'+pre+'_.*\\.json$').test(f)).forEach(f=>JSON.parse(fs.readFileSync(path.join(SCR,f),'utf8')).forEach(x=>R.push(x)));return R;};
const tally=(rows,key)=>{const m={};rows.forEach(r=>{const k=key(r);m[k]=(m[k]||0)+1;});return m;};
const fmt=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||(a<b?-1:1)).map(k=>k+' '+m[k]).join(' | ')||'(none)';
const reg=k=>k.split('|')[0];
const W3=loadRes('W3'),W4=loadRes('W4');
console.log('W4 stem doubles involving the bed thrust, by plan x names: '+fmt(tally(W4.flatMap(r=>r.stemA.filter(x=>/shoulders on bed/.test(x.names)).map(x=>({k:r.k,x}))),o=>reg(o.k)+' :: '+o.x.names)));
console.log('W4 stem doubles involving the bed thrust, by plan x W/day: '+fmt(tally(W4.flatMap(r=>r.stemA.filter(x=>/shoulders on bed/.test(x.names)).map(x=>({k:r.k,x}))),o=>reg(o.k)+' W'+o.x.w+o.x.d)));
const V3=W3.flatMap(r=>r.adjA.filter(x=>/glute bridge/i.test(x.n)).map(x=>({k:r.k,L:r.L,x})));
console.log('W3 adjacent-day bridge pairs (arm) '+V3.length+' by plan x focus: '+fmt(tally(V3,o=>reg(o.k)+' '+o.k.split('|')[3])));
console.log('W3 adjacent-day bridge pairs by (day of first) x week: '+fmt(tally(V3,o=>o.x.d+' W'+o.x.w)));
// V230 adjacent bridge pairs for comparison
console.log('V230 adjacent-day bridge pairs: '+W3.reduce((a,r)=>a+r.hipAdjV,0));
// non-landing day changes on W3 by plan x week/day
const DN=W3.flatMap(r=>r.diff.filter(x=>!x.landing).map(x=>({k:r.k,L:r.L,x})));
console.log('W3 non-landing day changes by plan x day: '+fmt(tally(DN,o=>reg(o.k)+' '+o.x.d)));
console.log('W3 non-landing day changes, change signature: '+fmt(tally(DN,o=>'-'+o.x.lost.join(',')+' +'+o.x.gained.join(','))).slice(0,1200));
// W3 landing-day section losses by plan
const DL=W3.flatMap(r=>r.diff.filter(x=>x.landing).map(x=>({k:r.k,L:r.L,x})));
console.log('W3 landing days: Calves/Leg isolation section lost by plan x focus: '+fmt(tally(DL.filter(o=>o.x.secLost.some(s=>/Calves|Leg isolation/.test(s))),o=>reg(o.k)+' '+o.k.split('|')[3]+' '+o.x.secLost.filter(s=>/Calves|Leg isolation/.test(s)).join(','))));
const ex=DL.find(o=>o.x.secLost.some(s=>/Calves/.test(s)));if(ex){console.log('  example Calves lost: '+ex.L+' '+ex.k+' W'+ex.x.w+ex.x.d);console.log('   V : '+ex.x.cardV.join(' | '));console.log('   W3: '+ex.x.cardA.join(' | '));}
const ex2=DL.find(o=>o.x.secLost.some(s=>/Leg isolation/.test(s)));if(ex2){console.log('  example Leg isolation lost: '+ex2.L+' '+ex2.k+' W'+ex2.x.w+ex2.x.d);console.log('   V : '+ex2.x.cardV.join(' | '));console.log('   W3: '+ex2.x.cardA.join(' | '));}
// W4: landing days where the Main bed-thrust sits beside Single-leg hip thrust: by plan/section
const D4=W4.flatMap(r=>r.diff.filter(x=>x.landing).map(x=>({k:r.k,L:r.L,x})));
console.log('W4 landing days whose card also carries "Single-leg hip thrust" (floor name): '+D4.filter(o=>o.x.cardA.some(c=>/: Single-leg hip thrust (?!\(shoulders)/.test(c))).length+'/'+D4.length+' by plan: '+fmt(tally(D4.filter(o=>o.x.cardA.some(c=>/: Single-leg hip thrust (?!\(shoulders)/.test(c))),o=>reg(o.k))));
// W3 landing days: list of W3 card shapes for ankle/protect and knee/protect (first 2 each)
for(const pl of ['ankle/protect','knee/protect','lowback/protect','lowback/workaround']){const e=DL.filter(o=>reg(o.k)===pl).slice(0,1);e.forEach(o=>{console.log('W3 landing example '+pl+' '+o.k+' W'+o.x.w+o.x.d);console.log('   V : '+o.x.cardV.join(' | '));console.log('   W3: '+o.x.cardA.join(' | '));});}
// prevention: 4th item on knee/protect ABp (which name) and non-runner prevention leg day removed items by inj
const PR=loadRes('prev');const legs=PR.flatMap(r=>r.legs.map(x=>Object.assign({k:r.k,L:r.L,inj:r.inj,eq:r.eq,fam:r.fam},x)));
console.log('ABp vs B removed items by inj x eq x fam: '+fmt(tally(legs.flatMap(x=>x.ABp_vs_B.rem.map(n=>x.inj+' '+x.eq+' '+x.fam+' -'+n)),x=>x)).slice(0,1500));
console.log('ABp vs B: leg days with calf lost by fam x eq: '+fmt(tally(legs.filter(x=>x.calf.B&&!x.calf.ABp),x=>x.fam+' '+x.eq)));
console.log('ABp vs B: leg days with calf lost by seed-key sample: '+legs.filter(x=>x.calf.B&&!x.calf.ABp).slice(0,6).map(x=>x.k+' W'+x.w).join(' ; '));
console.log('ABp circuit<4 on uninjured bodyweight: by exp: '+fmt(tally(legs.filter(x=>x.circ.ABp<4&&x.inj==='none'),x=>x.eq+' '+x.k.split('|')[3])));
