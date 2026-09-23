// v205 — what the ATHLETE-FACING run_base quality card prints, V204 vs V205.
// Read-only. Two artifacts loaded in one process, same instrument on both.
//   node tests/measure/v205_runbase_cards.js <v204.html> <v205.html>
//
// ORACLE / independence: nothing here calls getCHI, chiFromTable6 or any
// interpolator. The instrument is the CARD as stored on the built week grid:
// subtype, the verbatim detail string, and the dose object. The magnitude is
// read out of those strings, not out of the function under suspicion.
// The tw=8 config is FOUND by scanning for totalWeeks===8, not assumed.
'use strict';
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const {load,fixtures}=H;
const A204=process.argv[2], A205=process.argv[3];
const P=(...a)=>console.log(...a);
const IA={};
IA['204']=load(A204); IA['205']=load(A205);
P('ARTIFACTS  V204='+A204+' (IA_VERSION '+IA['204'].IA_VERSION+')   V205='+A205+' (IA_VERSION '+IA['205'].IA_VERSION+')');

function mkCfg(exp,age,b,evt){
  const g={id:'run_base',label:'Running Base'};
  if(b!==null){g.baselineDist=String(b);g.baseline=b+'mi';}
  return Object.assign({}, fixtures.HALF_MANNY, {
    name:'RUNBASE', primaryPath:'fitness', cardioTypes:['run'], cardioGoals:{run:g},
    eventTargeted:evt, raceDate: evt?'2027-06-01':'', experience:exp, ageBracket:age,
    seed:76308
  });
}
// pull every quality (CHI-limb) card off a built program, in week order
function cards(ia,cfg){
  const p=ia.buildProgram(cfg);
  const out=[];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    Object.keys(p.weeks[wk]).forEach(d=>{
      const day=p.weeks[wk][d];
      const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
      cs.forEach(c=>{
        const st=String(c.subtype||'');
        if(!/Steady Aerobic Run|CHI|Continuous High Intensity/i.test(st)) return;
        out.push({wk:+wk, day:d, subtype:st, detail:String(c.detail||''),
                  dose:JSON.stringify(c.dose||c._dose||null)});
      });
    });
  });
  return {tw:p.totalWeeks, cards:out};
}
// the printed magnitude, read out of the DETAIL STRING only
const minsOf = det => { const m=det.match(/^(\d+)\s*min\b/); return m?+m[1]:null; };

function sideBySide(title,cfg){
  const a=cards(IA['204'],cfg), b=cards(IA['205'],cfg);
  P('\n======== '+title+' ========');
  P('cfg: '+JSON.stringify({exp:cfg.experience,age:cfg.ageBracket,
      baselineDist:cfg.cardioGoals.run.baselineDist,eventTargeted:cfg.eventTargeted,seed:cfg.seed}));
  P('totalWeeks  V204='+a.tw+'  V205='+b.tw+'   quality cards V204='+a.cards.length+' V205='+b.cards.length);
  const wks=[...new Set(a.cards.map(c=>c.wk).concat(b.cards.map(c=>c.wk)))].sort((x,y)=>x-y);
  const sA=[],sB=[];
  wks.forEach(w=>{
    const ca=a.cards.filter(c=>c.wk===w), cb=b.cards.filter(c=>c.wk===w);
    const n=Math.max(ca.length,cb.length);
    for(let i=0;i<n;i++){
      const x=ca[i],y=cb[i];
      P('--- W'+w+(n>1?(' ['+(i+1)+'/'+n+']'):'')+' ---');
      P('  V204 day='+(x?x.day:'-')+' subtype='+(x?JSON.stringify(x.subtype):'(none)'));
      P('       detail='+(x?JSON.stringify(x.detail):'(none)'));
      P('       dose  ='+(x?x.dose:'(none)'));
      P('  V205 day='+(y?y.day:'-')+' subtype='+(y?JSON.stringify(y.subtype):'(none)'));
      P('       detail='+(y?JSON.stringify(y.detail):'(none)'));
      P('       dose  ='+(y?y.dose:'(none)'));
      P('  IDENTICAL='+(!!x&&!!y&&x.subtype===y.subtype&&x.detail===y.detail&&x.dose===y.dose));
      if(i===0){ sA.push(x?minsOf(x.detail):null); sB.push(y?minsOf(y.detail):null); }
    }
  });
  P('\n  PRINTED MINUTES by week (from the detail string, first card per week):');
  P('    weeks : '+wks.join(' '));
  P('    V204  : '+sA.join(' '));
  P('    V205  : '+sB.join(' '));
  const rng=s=>{const v=s.filter(x=>x!=null); return v.length?Math.min(...v)+'-'+Math.max(...v)+' min (first '+v[0]+', last '+v[v.length-1]+')':'n/a';};
  P('    V204 range: '+rng(sA));
  P('    V205 range: '+rng(sB));
  const mono=s=>{const v=s.filter(x=>x!=null);let up=0,dn=0;for(let i=1;i<v.length;i++){if(v[i]>v[i-1])up++;else if(v[i]<v[i-1])dn++;}return 'rises '+up+', falls '+dn+', flat '+(v.length-1-up-dn);};
  P('    V204 shape: '+mono(sA));
  P('    V205 shape: '+mono(sB));
  return {wks,sA,sB};
}

// ---- Q1: tw=8, FOUND not assumed --------------------------------------
P('\n### locating a run_base config with totalWeeks===8 on BOTH artifacts');
// widened: raceDate distance drives length when eventTargeted, so sweep it too.
const RD=['','2026-10-20','2026-11-17','2026-12-15','2027-01-12','2027-02-09','2027-03-09','2027-06-01'];
let found=null; const seen={};
outer:
for(const exp of ['beginner','intermediate','advanced'])
 for(const age of ['18-29','30-39','40-49','50-54','55+'])
  for(const b of [null,0,0.1,0.5,1,1.5,2,3,4,5,8,10])
   for(const evt of [false,true])
    for(const rd of RD){
     if(evt&&!rd) continue; if(!evt&&rd) continue;
     const cfg=mkCfg(exp,age,b,evt); cfg.raceDate=rd;
     let t4,t5;
     try{ t4=IA['204'].buildProgram(cfg).totalWeeks; t5=IA['205'].buildProgram(cfg).totalWeeks; }catch(e){ continue; }
     seen[t4]=(seen[t4]||0)+1;
     if(t4===8&&t5===8&&!found){ found=cfg; P('  found: exp='+exp+' age='+age+' baselineDist='+b+' evt='+evt+' raceDate='+rd); }
    }
P('  totalWeeks(V204) reachable over the scan: '+JSON.stringify(seen));
if(!found) P('  tw=8 is NOT REACHABLE for run_base in this scan (1,440 configs). Substituting the nearest sub-13 blocks.');
else sideBySide('Q1  run_base, tw=8', found);

// Q1b: the nearest reachable sub-13 lengths, found the same way.
function findTw(t){
  for(const exp of ['beginner','intermediate','advanced'])
   for(const age of ['18-29','30-39','40-49','50-54','55+'])
    for(const b of [null,0,0.1,0.5,1,1.5,2,3,4,5,8,10])
     for(const evt of [false,true])
      for(const rd of RD){
        if(evt&&!rd) continue; if(!evt&&rd) continue;
        const cfg=mkCfg(exp,age,b,evt); cfg.raceDate=rd;
        let t4,t5; try{ t4=IA['204'].buildProgram(cfg).totalWeeks; t5=IA['205'].buildProgram(cfg).totalWeeks; }catch(e){ continue; }
        if(t4===t&&t5===t) return cfg;
      }
  return null;
}
[7,9].forEach(t=>{ const c=findTw(t); if(!c) P('  no config at tw='+t); else sideBySide('Q1b  run_base, tw='+t+' (nearest reachable to 8)', c); });
// compact series for the rest of the sub-13 population
P('\n=== Q1c  printed-minute series, every other reachable sub-13 length ===');
[6,10,11,12].forEach(t=>{ const c=findTw(t); if(!c){P('  tw='+t+': none');return;}
  const a=cards(IA['204'],c), b=cards(IA['205'],c);
  const f=x=>x.cards.map(z=>'W'+z.wk+':'+minsOf(z.detail)).join(' ');
  P('  tw='+t+'  V204 '+f(a));
  P('  tw='+t+'  V205 '+f(b));
  P('  tw='+t+'  cards differing: '+a.cards.filter((z,i)=>!b.cards[i]||z.detail!==b.cards[i].detail).length+'/'+a.cards.length);
});

// ---- Q3/Q4: the 16-week config ----------------------------------------
const c16=mkCfg('intermediate','55+',0.1,true);
const r=sideBySide('Q3  run_base, 16-week config {intermediate, 55+, baselineDist 0.1, eventTargeted:true}', c16);
P('\n=== Q4 does V204 CLIMB where V205 DIPS? ===');
const v=(s)=>s.filter(x=>x!=null);
const a=v(r.sA), b=v(r.sB);
for(let i=1;i<Math.max(a.length,b.length);i++){
  const d4=(a[i]!=null&&a[i-1]!=null)?a[i]-a[i-1]:null;
  const d5=(b[i]!=null&&b[i-1]!=null)?b[i]-b[i-1]:null;
  if(d4!==d5) P('  W'+r.wks[i-1]+'->W'+r.wks[i]+'  V204 delta='+d4+'  V205 delta='+d5);
}
P('  V204 ever falls: '+(a.some((x,i)=>i>0&&x<a[i-1])));
P('  V205 ever falls: '+(b.some((x,i)=>i>0&&x<b[i-1])));
