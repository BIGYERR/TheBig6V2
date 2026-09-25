// V220 rebase measure — re-baseline P-RECOVBANNER, P-EMOJI, P-POPCOND, P-BARERX on HEAD.
// usage: node tests/measure/v220_rebase_build1.js <head.html> <v209.html> <v207.html> <outdir>
// Oracle: raw source text of the ruling-era tag vs HEAD (anchor counts), the rulings' own quoted
// strings (hand-copied below), and the v212_ scripts' printed numbers. Never asks the engine what is right.
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process');
const [HEADF,V209F,V207F,OUT]=process.argv.slice(2);
const R=path.resolve(__dirname,'..','..');
const H=require(path.join(R,'tests','harness.js'));
const src={HEAD:fs.readFileSync(HEADF,'utf8'),V209:fs.readFileSync(V209F,'utf8'),V207:fs.readFileSync(V207F,'utf8')};
function cnt(s,n){let c=0,i=0;while((i=s.indexOf(n,i))>=0){c++;i+=n.length;}return c;}
function lines(s,n){const o=[];let i=0;while((i=s.indexOf(n,i))>=0){o.push(s.slice(0,i).split('\n').length);i+=n.length;}return o;}
function stripJS(s){ // crude comment strip of inline JS for token counts: drop //... to EOL outside strings, /* */
  let o='',i=0,q=null;while(i<s.length){const c=s[i],n=s[i+1];
    if(q){o+=c;if(c==='\\'){o+=n;i+=2;continue;}if(c===q)q=null;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;o+=c;i++;continue;}
    if(c==='/'&&n==='/'){while(i<s.length&&s[i]!=='\n')i++;continue;}
    if(c==='/'&&n==='*'){const j=s.indexOf('*/',i+2);i=j<0?s.length:j+2;continue;}
    o+=c;i++;}return o;}
const js={};for(const k of Object.keys(src)) js[k]=stripJS(H.extractInlineJS?H.extractInlineJS(src[k]):src[k]);
function A(rule,label,needle,expect){ // expect: expected HEAD count (default 1)
  const e=expect==null?1:expect;
  const t=cnt(src.V209,needle), n=cnt(src.HEAD,needle), L=lines(src.HEAD,needle);
  const st=n===e?'OK':(n===0?'GONE':(n>e?'DOUBLED':'MOVED'));
  console.log(`ANCHOR ${rule} | ${st} | V209 ${t} HEAD ${n} (want ${e}) | L${L.join(',')} | ${label}`);
  return st;
}
console.log('ia-version HEAD',(src.HEAD.match(/ia-version" content="(\d+)"/)||[])[1],'V209',(src.V209.match(/ia-version" content="(\d+)"/)||[])[1]);

console.log('\n=== P-RECOVBANNER anchors');
A('RB','E1 comment','// ── leg-recovery note (kept) ──');
A('RB','E1 let',"  let leg='';");
A('RB','E1 if','if(activeProg.legRecoveryNote){ leg=');
A('RB','E1 if (bare)','if(activeProg.legRecoveryNote){');
A('RB','E1 glyph escape','\\u267b\\ufe0f <b');
A('RB','E2 join','list.innerHTML=strip+hero+_wcTag+stats+leg;');
A('RB','field write','legRecoveryNote:_liftDay ? legRecoveryNote : null');
for(const [k,s] of Object.entries(js)) console.log(`RB comment-stripped ${k}: "Recovery spacing" ${cnt(s,'Recovery spacing')} | activeProg.legRecoveryNote ${cnt(s,'activeProg.legRecoveryNote')} | ♻ literal ${cnt(s,'♻')} + \\u267b ${cnt(s.toLowerCase(),'\\u267b')} | legRecoveryNote total ${cnt(s,'legRecoveryNote')}`);
console.log('RB legRecoveryNote HEAD sites:');
src.HEAD.split('\n').forEach((l,i)=>{if(l.includes('legRecoveryNote'))console.log('   L'+(i+1)+': '+l.trim().slice(0,150));});
console.log('RB legRecoveryNote V209 sites: L'+lines(src.V209,'legRecoveryNote').join(','));

console.log('\n=== P-EMOJI anchors (pool dash strings, rider, inline chrome, pop icons)');
const POOL_OLD=[
 'Congrats... you actually showed up. Just, you know — faster next time. 🎉',
 'Look at you — vertical, sweaty, and useful. Goddamn miracle. 🫡',
 'Sweat now or be wheezing on the way up to your 8-story walk-up. 🚶😤',
 "Quit looking for a medal — it's under your tetas, find it later. 🥇",
 'You did the whole thing — looked dead ugly on that last set, but you finished. 💀',
 'ten minutes lifting. But okay — ',
 'You disappeared on a workout. Your record, your call — fix it. 📋',
 'You saw it through. Rare as fuck — most quit at week two like little bitches. 🐔',
 'You outlasted every weak-ass excuse your brain coughed up. Respect, animal. 🧠❌'];
POOL_OLD.forEach((s,i)=>A('EM','§2 pool '+(i+1)+': '+s.slice(0,40),s));
A('EM','§3 rider >=7','More than a week off. Mark what happened, then ease back in — first sessions back at reduced effort. Never chase missed work.');
A('EM','§3 rider <7','This one got away from you. Mark it and move on — the week ahead stays as written. Never cram a missed session back in.');
A('EM','§4 wizard caption line (Estimated from)','Estimated from');
A('EM','§4 wizard header (Seed from)','Seed from');
A('EM','§4 log nudge 📋 escape','\\ud83d\\udccb You logged this one but never marked it.');
A('EM','§4 progress chip 🗄 escape',"(p.archived?'\\uD83D\\uDDC4 ':'')");
A('EM','§5 POP_CFG.reminder icon',"reminder:{icon:'👀'");
A('EM','§5 BACK IN shield (x2 by design)',"icon:'\\uD83D\\uDEE1\\uFE0F',kicker:'BACK IN'",2);
A('EM','§5 BACK IN one-week msg',"kicker:'BACK IN',msg:'Good. One week to prove it.'");
A('EM','§5 BACK IN two-week msg',"kicker:'BACK IN',msg:'Good. Two weeks to full send.'");
A('EM','§5 CHECK IN better',"icon:'\\uD83D\\uDEE1\\uFE0F',kicker:'CHECK IN',msg:'Good sign.'");
A('EM','§5 CHECK IN worse',"icon:'\\u26A0\\uFE0F',kicker:'CHECK IN'");
A('EM','§5 popIcon slot textContent',"document.getElementById('popIcon').textContent=opts.icon||cfg.icon;");
A('EM','§1 streak kicker','-DAY STREAK 🔥');
A('EM','§1 POP_CFG.workout 🎉',"workout: {icon:'🎉'");
A('EM','.pop-icon css font-size 52','.pop-icon{');
const m=src.HEAD.match(/\.pop-icon\{[^}]*\}/);console.log('   css:',m&&m[0].slice(0,160));
for(const k of ['notebook','shield','warning','chart','history']){const re=new RegExp("['\"]?"+k+"['\"]?\\s*:");const blk=src.HEAD.slice(src.HEAD.indexOf('ASY_ICON_PATHS'),src.HEAD.indexOf('ASY_ICON_PATHS')+60000);console.log(`EM ASY_ICON_PATHS key ${k}: ${re.test(blk)}`);}

console.log('\n=== P-POPCOND anchors');
for(const f of ['function popContext(){','function popEligible(e,ctx){','function popPick(tier){','function popFire(tier,opts){','function dayDateFor(','function fireWorkoutPopup(','function fireCompletionPopup(','function maybeShowReminder(','function resolveReminder(','function computeStreak(','function handleDayStatus(','const _remMsg=','_gap<7','_gap>=7','if(when===\'weekend\') return ctx.weekend;','const ctx=popContext();',"var liftSections=(day.sections||[]).some(",'/taper/i.test(sec.label',"label:'Post-run mobility'"]) A('PC',f,f,null);
// pool tags
function evalConst(s,name){const i=s.indexOf('const '+name+'=');let d=0,j=s.indexOf('{',i);const a=j;for(;j<s.length;j++){if(s[j]==='{')d++;else if(s[j]==='}'){d--;if(!d)break;}}return Function('return '+s.slice(a,j+1))();}
const PP={HEAD:evalConst(src.HEAD,'POP_POOLS'),V207:evalConst(src.V207,'POP_POOLS')};
for(const k of ['HEAD','V207']) console.log(`PC POP_POOLS ${k} sizes: `+Object.entries(PP[k]).map(([t,a])=>t+' '+a.length).join(' / '));
PP.HEAD.workout.forEach((e,i)=>{const t=typeof e==='object'?e.t:e;const tag=typeof e==='object'?JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='t'))):'';if(tag||[1,3,4,8,12,15,18,19,25,26].includes(i))console.log(`   [${i}] ${tag||'untagged'} ${t.slice(0,70)}`);});
console.log('   reminder pool:',PP.HEAD.reminder.map(s=>s.slice(-6)).join(' | '));
console.log('PC POP_POOLS identical V207->HEAD:',JSON.stringify(PP.HEAD)===JSON.stringify(PP.V207));
// popFire callers census
for(const k of ['V207','V209','HEAD']){const L=src[k].split('\n');const c={};const sites=[];L.forEach((l,i)=>{const re=/popFire\('(\w+)'/g;let mm;while((mm=re.exec(l))){c[mm[1]]=(c[mm[1]]||0)+1;sites.push(mm[1]+':'+l.slice(mm.index,mm.index+70).replace(/\s+/g,' '));}});console.log(`PC popFire callers ${k}: `+JSON.stringify(c));if(k!=='V207')fs.writeFileSync(path.join(OUT,'rb_popfire_'+k+'.txt'),sites.map(s=>s.replace(/\d+/g,'#')).sort().join('\n'));}
for(const fn of ['fireCompletionPopup(','fireWorkoutPopup(','maybeShowReminder(','popPick(','popContext(']) for(const k of ['V207','HEAD']) console.log(`PC calls ${fn} ${k}: ${cnt(stripJS(src[k]),fn)}`);

console.log('\n=== P-BARERX anchors');
A('BX','_dispDetail line (v190 M4 anchor)',"const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||''):(i.detail||'');");
A('BX','buildExItem signature','function buildExItem(i,secIdx,itemIdx,_ssRounds){');
A('BX','_stripLeadingSets def','function _stripLeadingSets(');
A('BX','Leg circuit writer label',"s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[");
A('BX','preset library 12 reps',"'12 reps'",null);
const lc=src.HEAD.indexOf("label:'Leg circuit — runner armor'");console.log('   leg circuit block:',src.HEAD.slice(lc,lc+420).replace(/\s+/g,' '));
// jump regex site cited by D172
for(const n of ['JUMPS','noJumps']){console.log(`BX ${n} HEAD L${lines(src.HEAD,n).slice(0,8).join(',')}`);}

console.log('\n=== tests side: gates and sabotage anchors on HEAD');
const T=path.join(R,'tests');
function sab(f){const j=JSON.parse(fs.readFileSync(path.join(T,'sabotage',f),'utf8'));return Array.isArray(j)?j:(j.mutations||Object.values(j).find(Array.isArray));}
for(const f of ['v190.json','v192_d42c_shoulder_side.json','v201.json','v205.json','v208_d104a.json']){let a;try{a=sab(f);}catch(e){console.log('SAB',f,'UNREADABLE',e.message);continue;}
  a.forEach(mu=>{const nm=(mu.name||mu.id||'').slice(0,60);const an=mu.anchor||mu.find||'';const c=cnt(src.HEAD,an);const s=JSON.stringify(mu);const rel=/_dispDetail|legRecoveryNote|hinge day rides|×8|'\+'×|vsets/.test(s);if(rel||c!==1)console.log(`SAB ${f} | ${c===1?'OK':'COUNT '+c} | ${nm} | gate ${mu.gate}`);});}
const g190=fs.readFileSync(path.join(T,'gates','g190_rounds.js'),'utf8');
console.log('G190 G11b at L'+lines(g190,"tryCheck('G11b").join(',')+'; version predicate in file:',/IA\.version|ia-version|\.version\s*[<>=]/.test(g190));
const g205=fs.readFileSync(path.join(T,'gates','g205_pace_eve.js'),'utf8');
for(const t of ["ok('P3a","ok('P4a","ok('P4b","ok('P4c"]) console.log('G205 '+t+' L'+lines(g205,t).join(','));
const g208=fs.readFileSync(path.join(T,'gates','g208_d104a_runbase.js'),'utf8');
for(const t of ['ok(`R2','ok(`R3','ok(`R8a']) console.log('G208 '+t+' L'+lines(g208,t).join(','));
// every gate that reads a ruled token
const toks=['legRecoveryNote','Recovery spacing','_dispDetail','_stripLeadingSets','popContext','popEligible','popPick','POP_POOLS','POP_CFG','log-nudge','You logged this one','Estimated from','DAY STREAK','UNFINISHED BUSINESS','popIcon','reps\''];
for(const g of fs.readdirSync(path.join(T,'gates')).filter(x=>x.endsWith('.js'))){const s=fs.readFileSync(path.join(T,'gates',g),'utf8');const hit=toks.filter(t=>s.includes(t));if(hit.length)console.log('GATE-READS '+g+': '+hit.join(', '));}
for(const g of fs.readdirSync(path.join(T,'sabotage')).filter(x=>x.endsWith('.json'))){const s=fs.readFileSync(path.join(T,'sabotage',g),'utf8');const hit=toks.filter(t=>s.includes(t));if(hit.length)console.log('SAB-READS '+g+': '+hit.join(', '));}

console.log('\n=== HALF_MANNY');
const IA=H.load(HEADF);const d=H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
const d2=H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
console.log('HALF_MANNY HEAD digest',d,'self-equal',d===d2,'| table[219]',H.MANNY_DIGEST_BY_VERSION[219],'| table[207]',H.MANNY_DIGEST_BY_VERSION[207],'| rulings record 0ac7da6b1691a8e1 ->',d==='0ac7da6b1691a8e1');
console.log('MANNY table versions:',Object.keys(H.MANNY_DIGEST_BY_VERSION).join(','));
