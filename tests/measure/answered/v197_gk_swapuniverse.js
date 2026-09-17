// GATEKEEPER: _swapUniverse is stripped by progDigest, so a change here reports clean.
// Diff it explicitly, per tier, plus Mario's fixture.
'use strict';
const { load, fixtures } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const TIERS=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const FOCUS=['support_prevention','hypertrophy'];
const EXPER=['intermediate','advanced'];
const SEEDS=[1013,76308];
const cfgs=[];
for(const equipment of TIERS)for(const liftingFocus of FOCUS)for(const experience of EXPER)for(const seed of SEEDS)
  cfgs.push({key:[equipment,liftingFocus,experience,seed].join('|'),tier:equipment,
    cfg:Object.assign({},fixtures.HALF_MANNY,{equipment,liftingFocus,experience,seed})});
function uni(p){
  const su=p._swapUniverse;
  if(!su) return null;
  return (Array.isArray(su)?su.slice():Object.keys(su)).map(String).sort();
}
function dump(f){const ia=load(f);const m={};
  for(const c of cfgs) m[c.key]=uni(ia.buildProgram(JSON.parse(JSON.stringify(c.cfg))));
  m.__MARIO=uni(ia.buildProgram(fixtures.HALF_MANNY));
  const byk=ia.buildProgram(fixtures.HALF_MANNY)._swapUniverseByKey;
  m.__MARIO_BYKEY=byk?JSON.stringify(Object.keys(byk).sort()):null;
  return m;}
const A=dump(process.argv[2]),B=dump(process.argv[3]);
const perTier={};
for(const c of cfgs){
  const a=A[c.key]||[],b=B[c.key]||[];
  const as=new Set(a),bs=new Set(b);
  const lost=a.filter(x=>!bs.has(x)), gain=b.filter(x=>!as.has(x));
  perTier[c.tier]=perTier[c.tier]||{n:0,changed:0,lens:new Set(),lost:{},gain:{},lostOnly:0};
  const T=perTier[c.tier]; T.n++;
  if(lost.length||gain.length) T.changed++;
  T.lens.add(a.length+'->'+b.length);
  lost.forEach(x=>T.lost[x]=(T.lost[x]||0)+1); gain.forEach(x=>T.gain[x]=(T.gain[x]||0)+1);
}
for(const t of TIERS){const T=perTier[t];
  console.log(t.padEnd(12)+' configs '+T.n+'  changed '+T.changed+'  sizes '+[...T.lens].join(',')
   +'\n    LOST  '+JSON.stringify(T.lost)+'\n    GAIN  '+JSON.stringify(T.gain));}
console.log('\nMARIO _swapUniverse: base len '+(A.__MARIO?A.__MARIO.length:'null')+'  cand len '+(B.__MARIO?B.__MARIO.length:'null')
  +'   identical: '+(JSON.stringify(A.__MARIO)===JSON.stringify(B.__MARIO)));
if(JSON.stringify(A.__MARIO)!==JSON.stringify(B.__MARIO)){
  const as=new Set(A.__MARIO||[]),bs=new Set(B.__MARIO||[]);
  console.log('   lost '+JSON.stringify((A.__MARIO||[]).filter(x=>!bs.has(x)))+'  gained '+JSON.stringify((B.__MARIO||[]).filter(x=>!as.has(x))));
}
console.log('MARIO _swapUniverseByKey identical: '+(A.__MARIO_BYKEY===B.__MARIO_BYKEY));
