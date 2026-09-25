// V212 measure — emoji / pictograph inventory in athlete-facing chrome.
// Usage: node tests/measure/v220_emoji_chrome.js <file.html> [--json out.json] [--table out.txt]
// Oracle: Unicode properties (\p{Emoji_Presentation}, \p{Extended_Pictographic}) from the JS
// regex engine, NOT the app's ASY_EMOJI table. Comments are stripped by a tokenizer before scanning
// (JS // and /* */, CSS /* */, HTML <!-- -->). Every string/template/regex literal is decoded:
// \uXXXX (surrogate pairs joined), \u{...}, \xNN, HTML entities (&#x..; &#..; named), CSS \XXXX.
'use strict';
const fs=require('fs');
const file=process.argv[2]; if(!file){console.error('usage');process.exit(2);}
const argv=process.argv.slice(3); const opt=k=>{const i=argv.indexOf(k);return i>=0?argv[i+1]:null;};
const src=fs.readFileSync(file,'utf8');
const lineStarts=[0]; for(let i=0;i<src.length;i++) if(src[i]==='\n') lineStarts.push(i+1);
function lineOf(off){let lo=0,hi=lineStarts.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(lineStarts[m]<=off)lo=m;else hi=m-1;}return lo+1;}

// ---------- regions ----------
const regions=[]; // {kind:'js'|'css'|'html', a, b}
{ const re=/<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi; let m, last=0;
  while((m=re.exec(src))){ const inner=m.index+m[0].indexOf('>')+1; const end=inner+m[3].length;
    regions.push({kind:'html',a:last,b:inner}); regions.push({kind:m[1].toLowerCase()==='script'?'js':'css',a:inner,b:end}); last=end; }
  regions.push({kind:'html',a:last,b:src.length}); }

// ---------- JS tokenizer ----------
const toks=[]; // {type:'str'|'tpl'|'re'|'code', a, b}  offsets into src
let commentChars=0;
function tokJS(a,b){
  let i=a, codeStart=a; const tplStack=[]; let braceDepth=0; let lastSig='(';
  const kw=/(?:return|typeof|case|else|in|of|new|delete|void|throw|yield|await|do)$/;
  function flushCode(end){ if(end>codeStart) toks.push({type:'code',a:codeStart,b:end}); }
  function readTpl(start){ // start points just after ` or }
    let j=start;
    while(j<b){ const c=src[j];
      if(c==='\\'){j+=2;continue;}
      if(c==='`'){ toks.push({type:'tpl',a:start,b:j}); return {end:j+1,open:false}; }
      if(c==='$'&&src[j+1]==='{'){ toks.push({type:'tpl',a:start,b:j}); return {end:j+2,open:true}; }
      j++; }
    throw new Error('unterminated template at line '+lineOf(start));
  }
  while(i<b){
    const c=src[i], n=src[i+1];
    if(c==='/'&&n==='/'){ flushCode(i); let j=i; while(j<b&&src[j]!=='\n')j++; commentChars+=j-i; i=j; codeStart=i; continue; }
    if(c==='/'&&n==='*'){ flushCode(i); const j=src.indexOf('*/',i+2); if(j<0||j>b) throw new Error('unterminated block comment line '+lineOf(i)); commentChars+=j+2-i; i=j+2; codeStart=i; continue; }
    if(c==='"'||c==="'"){ flushCode(i); let j=i+1; while(j<b&&src[j]!==c){ if(src[j]==='\\')j++; if(src[j]==='\n') throw new Error('newline in string line '+lineOf(j)); j++; }
      toks.push({type:'str',a:i+1,b:j}); i=j+1; codeStart=i; lastSig='"'; continue; }
    if(c==='`'){ flushCode(i); const r=readTpl(i+1); i=r.end; if(r.open){tplStack.push(braceDepth);} codeStart=i; lastSig='`'; continue; }
    if(c==='/'){ // regex or divide
      const prev=lastSig; const before=src.slice(Math.max(a,i-12),i).replace(/\s+$/,'');
      const isRe= /[(,=:\[!&|?{};+\-*%<>~^]$/.test(prev) || kw.test(before) || prev==='}';
      if(isRe){ flushCode(i); let j=i+1, cls=false; while(j<b){ const d=src[j]; if(d==='\\'){j+=2;continue;} if(d==='\n') throw new Error('newline in regex line '+lineOf(i)); if(cls){ if(d===']')cls=false; } else { if(d==='[')cls=true; else if(d==='/')break; } j++; }
        toks.push({type:'re',a:i+1,b:j}); j++; while(/[a-z]/i.test(src[j]))j++; i=j; codeStart=i; lastSig='r'; continue; }
    }
    if(c==='{'){ braceDepth++; }
    if(c==='}'){ if(tplStack.length&&tplStack[tplStack.length-1]===braceDepth){ flushCode(i); tplStack.pop(); const r=readTpl(i+1); i=r.end; if(r.open)tplStack.push(braceDepth); codeStart=i; lastSig='`'; continue; } braceDepth--; }
    if(!/\s/.test(c)) lastSig=c;
    if(/[A-Za-z0-9_$]/.test(c)) lastSig='a';
    i++;
  }
  flushCode(b);
  if(tplStack.length) throw new Error('template stack not empty');
}
function tokCSS(a,b){ let i=a; while(i<b){ const j=src.indexOf('/*',i); if(j<0||j>=b){toks.push({type:'css',a:i,b});break;} toks.push({type:'css',a:i,b:j}); const k=src.indexOf('*/',j+2); commentChars+=k+2-j; i=k+2; } }
function tokHTML(a,b){ let i=a; while(i<b){ const j=src.indexOf('<!--',i); if(j<0||j>=b){toks.push({type:'html',a:i,b});break;} toks.push({type:'html',a:i,b:j}); const k=src.indexOf('-->',j+4); commentChars+=k+3-j; i=k+3; } }
for(const r of regions){ if(r.kind==='js')tokJS(r.a,r.b); else if(r.kind==='css')tokCSS(r.a,r.b); else tokHTML(r.a,r.b); }

// ---------- decoder: returns [{ch, off}] codepoints with raw offset ----------
const NAMED={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0',times:'\u00d7',mdash:'\u2014',ndash:'\u2013',rarr:'\u2192',larr:'\u2190',uarr:'\u2191',darr:'\u2193',harr:'\u2194',bull:'\u2022',middot:'\u00b7',hellip:'\u2026',check:'\u2713',cross:'\u2717',star:'\u2606',starf:'\u2605',hearts:'\u2665',deg:'\u00b0',frac12:'\u00bd',rsquo:'\u2019',lsquo:'\u2018',ldquo:'\u201c',rdquo:'\u201d',copy:'\u00a9',reg:'\u00ae',trade:'\u2122',minus:'\u2212',divide:'\u00f7',plusmn:'\u00b1',laquo:'\u00ab',raquo:'\u00bb',para:'\u00b6',sect:'\u00a7',dagger:'\u2020',loz:'\u25ca',spades:'\u2660',clubs:'\u2663',diams:'\u2666'};
function decode(a,b,mode){ // mode: js | css | html
  const out=[]; let i=a;
  const pushCP=(cp,off)=>out.push({cp,off});
  while(i<b){
    const c=src[i];
    if(mode==='js'&&c==='\\'){
      const n=src[i+1];
      if(n==='u'&&src[i+2]==='{'){ const j=src.indexOf('}',i); pushCP(parseInt(src.slice(i+3,j),16),i); i=j+1; continue; }
      if(n==='u'){ let cu=parseInt(src.slice(i+2,i+6),16); let adv=6;
        if(cu>=0xD800&&cu<=0xDBFF&&src[i+6]==='\\'&&src[i+7]==='u'){ const lo=parseInt(src.slice(i+8,i+12),16); if(lo>=0xDC00&&lo<=0xDFFF){ cu=0x10000+((cu-0xD800)<<10)+(lo-0xDC00); adv=12; } }
        pushCP(cu,i); i+=adv; continue; }
      if(n==='x'){ pushCP(parseInt(src.slice(i+2,i+4),16),i); i+=4; continue; }
      pushCP(n.codePointAt(0),i); i+=2; continue;
    }
    if(mode==='css'&&c==='\\'&&/[0-9a-f]/i.test(src[i+1])){ const m=/^[0-9a-f]{1,6}\s?/i.exec(src.slice(i+1,i+8)); pushCP(parseInt(m[0],16),i); i+=1+m[0].length; continue; }
    if(c==='&'&&mode!=='css'){ const m=/^&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]+);/i.exec(src.slice(i,i+12));
      if(m){ const t=m[1]; let cp=null; if(t[0]==='#') cp=t[1]==='x'||t[1]==='X'?parseInt(t.slice(2),16):parseInt(t.slice(1),10); else if(NAMED[t]) cp=NAMED[t].codePointAt(0);
        if(cp!=null){ pushCP(cp,i); i+=m[0].length; continue; } } }
    const cp=src.codePointAt(i); pushCP(cp,i); i+=cp>0xFFFF?2:1;
  }
  return out;
}

// ---------- classification (Unicode property oracle) ----------
const reEP=/\p{Emoji_Presentation}/u, reXP=/\p{Extended_Pictographic}/u;
function klass(cp,nextCp){
  const ch=String.fromCodePoint(cp);
  if(cp===0xD7||cp===0x2014) return 'C';
  if(reEP.test(ch)) return 'A';
  if(reXP.test(ch)&&nextCp===0xFE0F) return 'A';
  if(reXP.test(ch)) return 'A2'; // text-default pictograph, no VS16 (iOS commonly still renders colour)
  if((cp>=0x2190&&cp<=0x21FF)||(cp>=0x2300&&cp<=0x23FF)||(cp>=0x25A0&&cp<=0x25FF)||(cp>=0x2600&&cp<=0x27BF)||(cp>=0x2B00&&cp<=0x2BFF)||cp===0x2022||cp===0x2023||(cp>=0x2700&&cp<=0x27BF)||(cp>=0x1F000)) return 'B';
  return null;
}

// ---------- enclosing function index ----------
const fnMarks=[]; { const re=/^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=|^\s{0,2}([A-Za-z0-9_$]+)\s*:\s*[\[{(]/gm; let m; while((m=re.exec(src))) fnMarks.push({off:m.index,name:m[1]||m[2]||m[3]}); }
function fnAt(off){ let lo=0,hi=fnMarks.length-1,r='?'; while(lo<=hi){const m=(lo+hi)>>1; if(fnMarks[m].off<=off){r=fnMarks[m].name;lo=m+1;}else hi=m-1;} return r; }

// ---------- scan ----------
const hits=[]; const denom={literals:0,jsStr:0,jsTpl:0,jsRe:0,css:0,html:0,codeTokens:0};
for(const t of toks){
  const mode=t.type==='css'?'css':t.type==='html'?'html':'js';
  if(t.type==='code'){denom.codeTokens++;} else denom.literals++;
  if(t.type==='str')denom.jsStr++; if(t.type==='tpl')denom.jsTpl++; if(t.type==='re')denom.jsRe++; if(t.type==='css')denom.css++; if(t.type==='html')denom.html++;
  const cps=decode(t.a,t.b,t.type==='code'||t.type==='re'?'js':mode==='js'?'js':mode);
  // JS strings also go through innerHTML: decode entities there too (decode handles & in js mode)
  for(let k=0;k<cps.length;k++){
    const {cp,off}=cps[k]; if(cp===0xFE0F||cp===0x200D) continue;
    // skip ZWJ-joined tails (count the sequence once at its head)
    if(k>0&&cps[k-1].cp===0x200D) continue;
    const kl=klass(cp,cps[k+1]&&cps[k+1].cp); if(!kl) continue;
    // build the decoded sequence (ZWJ chains)
    let seq=String.fromCodePoint(cp), e=k+1; while(e<cps.length&&(cps[e].cp===0xFE0F||cps[e].cp===0x200D||(cps[e-1].cp===0x200D))){ seq+=String.fromCodePoint(cps[e].cp); e++; }
    const ctxStr=cps.map(x=>String.fromCodePoint(x.cp)).join('');
    const pos=cps.slice(0,k).map(x=>String.fromCodePoint(x.cp)).join('').length;
    const ctx=ctxStr.slice(Math.max(0,pos-45),pos+35).replace(/\s+/g,' ');
    const lineTxt=src.slice(lineStarts[lineOf(off)-1], (src.indexOf('\n',off)+1||src.length));
    const pre=src.slice(Math.max(0,t.a-40),t.a);
    const raw=src.slice(off,off+14);
    hits.push({cls:kl,seq,cp:'U+'+cp.toString(16).toUpperCase(),line:lineOf(off),tok:t.type,fn:fnAt(off),ctx,
      encoding: raw.startsWith('\\u')?'js-escape':raw.startsWith('&#')?'html-entity':raw.startsWith('&')?'named-entity':raw.startsWith('\\')?'css-escape':'literal',
      viaAsyIcon: /asyIcon\(\s*['"`]?$/.test(pre),
      reader: t.type==='re' || /(===|!==|==|\.indexOf\(|\.includes\(|\.startsWith\(|\.endsWith\(|\.split\(|\.replace\(|\.match\(|case\s*$)\s*['"`]?$/.test(pre),
      lineFlags: ['showToast','alert(','confirm(','popFire','navigator.share','clipboard','localStorage','setItem','Notification','textContent','innerHTML','asyIcon'].filter(s=>lineTxt.includes(s)).join(',')});
  }
}
// ASY tables parsed from source (JSON bodies)
function tbl(name){ const m=new RegExp('const '+name+'=(\\{.*?\\});').exec(src); return m?JSON.parse(m[1]):null; }
const PATHS=tbl('ASY_ICON_PATHS'), EMAP=tbl('ASY_EMOJI');
const asyLine=lineOf(src.indexOf('const ASY_ICON_PATHS=')), emapLine=lineOf(src.indexOf('const ASY_EMOJI='));

// Disposition: hand table from reading each consumer (V205 base). popFire writes popIcon, popKicker
// and popMsg with textContent (so these are raw glyphs, never SVG). The reminder pool is unreachable
// because its only caller (maybeShowReminder, popFire at 17344 in V205) passes opts.msg. Everything else is decided by asyIcon.
const POP_FNS=new Set(['workout','reminder','streak','season','POP_DISMISS','p','fireStreakPopup']);
function disposition(h){
  if(h.fn==='ASY_EMOJI') return 'LOOKUP KEY (asyIcon map, not displayed)';
  if(h.fn==='reminder'&&h.ctx.length>3) return 'POP-UP msg pool (DEAD: only caller passes msg)';
  if(POP_FNS.has(h.fn)||/popFire/.test(h.lineFlags)) return 'POP-UP raw (textContent)';
  if(h.tok==='html'&&/popIcon/.test(h.ctx)) return 'POP-UP raw (static default, overwritten each fire)';
  if(h.fn==='_hasLog') return 'DAY CARD log-nudge raw (innerHTML)';
  if(h.fn==='leg') return 'WEEK VIEW recovery-spacing banner raw';
  if(h.fn==='s'||h.fn==='distLine') return 'WIZARD seed banner raw';
  if(h.fn==='label') return 'PROGRESS program chip raw';
  if(h.fn==='fireWorkoutPopup') return 'POP-UP stat label via asyIcon (innerHTML) -> SVG';
  return 'via asyIcon -> SVG';
}
hits.forEach(h=>h.disp=disposition(h));
const by=(arr,f)=>arr.reduce((o,x)=>{const k=f(x);o[k]=(o[k]||0)+1;return o;},{});
const out=[];
out.push('FILE '+file+'  ia-version '+((/ia-version" content="(\d+)"/.exec(src)||[])[1]));
out.push('DENOM lines '+lineStarts.length+'  literal tokens '+denom.literals+' '+JSON.stringify(denom)+'  comment chars stripped '+commentChars);
out.push('TOTALS by class '+JSON.stringify(by(hits,h=>h.cls)));
out.push('A by encoding '+JSON.stringify(by(hits.filter(h=>h.cls==='A'),h=>h.encoding)));
out.push('A by disposition '+JSON.stringify(by(hits.filter(h=>h.cls==='A'),h=>h.disp)));
out.push('A2 by disposition '+JSON.stringify(by(hits.filter(h=>h.cls==='A2'),h=>h.disp)));
out.push('A by token '+JSON.stringify(by(hits.filter(h=>h.cls==='A'),h=>h.tok)));
out.push('ASY_ICON_PATHS @'+asyLine+' ('+Object.keys(PATHS).length+'): '+Object.keys(PATHS).join(' '));
out.push('ASY_EMOJI @'+emapLine+' ('+Object.keys(EMAP).length+'): '+Object.entries(EMAP).map(([k,v])=>k+'>'+v+(PATHS[v]?'':'(NO PATH)')).join(' '));
for(const k of ['A','A2','B']){
  out.push('\n=== CLASS '+k+' ('+hits.filter(h=>h.cls===k).length+') ===');
  for(const h of hits.filter(h=>h.cls===k)) out.push([h.line,h.seq,h.cp,h.tok,h.encoding,h.fn,h.viaAsyIcon?'VIA_ASYICON':'',h.reader?'READER':'',h.lineFlags,h.disp,'| '+h.ctx].join('\t'));
}
out.push('\n=== CLASS C by char '+JSON.stringify(by(hits.filter(h=>h.cls==='C'),h=>h.seq)));
const txt=out.join('\n');
if(opt('--table')) fs.writeFileSync(opt('--table'),txt+'\n');
if(opt('--json')) fs.writeFileSync(opt('--json'),JSON.stringify(hits));
console.log(txt);

// ---------- --harness: (1) run the artifact's own asyIcon on every distinct A/A2 sequence,
// (2) sweep a cfg lattice and scan every string in the built program (prog.weeks is persisted
// to ia_programs) for pictographs. Oracle for (2) is the Unicode property, not the engine.
if(argv.includes('--harness')){
  const vm=require('vm'); const path=require('path');
  const code=[/const ASY_ICON_PATHS=\{.*?\};/, /const ASY_EMOJI=\{.*?\};/, /function asyIcon\(key,size\)\{[\s\S]*?\n/].map(r=>{const m=r.exec(src); if(!m) throw new Error('asy extract failed '+r); return m[0];}).join('\n')+'\nthis.asyIcon=asyIcon;';
  const ctx={}; vm.createContext(ctx); vm.runInContext(code,ctx);
  const seqs=[...new Set(hits.filter(h=>h.cls==='A'||h.cls==='A2').map(h=>h.seq))];
  const rendered=seqs.map(s=>({s,cp:'U+'+s.codePointAt(0).toString(16).toUpperCase(),svg:String(ctx.asyIcon(s)).startsWith('<svg')}));
  console.log('\n=== asyIcon(seq) renders SVG: '+rendered.filter(r=>r.svg).length+' / '+rendered.length+' distinct sequences');
  console.log('  SVG:    '+rendered.filter(r=>r.svg).map(r=>r.s).join(' '));
  console.log('  NO SVG: '+rendered.filter(r=>!r.svg).map(r=>r.s+' '+r.cp).join('  '));
  const {load}=require(path.join(__dirname,'..','harness.js'));
  const IA=load(file);
  const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight"], FOCUS=["support_prevention","support_strength","hypertrophy","strength","fatloss","balanced"], EXPS=["beginner","intermediate","advanced"];
  const GOALS=[{k:"liftonly",id:null},{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"},{k:"5k",id:"run_5k"},{k:"10k",id:"run_10k"},{k:"mar",id:"run_marathon"},{k:"base",id:"run_base"}];
  const INJ=[null,{region:"knee",tier:"protect"}], SEEDS=[76308,1013];
  let cfgs=0,crash=0,strings=0,pict=0; const pictSeen={}; const crashes={};
  const walk=(o,f)=>{ if(typeof o==='string'){strings++; for(const ch of o){ const cp=ch.codePointAt(0); const k=klass(cp,null); if(k==='A'||k==='A2'||k==='B'){pict++; pictSeen[k+' '+ch+' U+'+cp.toString(16).toUpperCase()]=(pictSeen[k+' '+ch+' U+'+cp.toString(16).toUpperCase()]||0)+1;} } } else if(o&&typeof o==='object') for(const k in o) walk(o[k]); };
  for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const inj of INJ)for(const sd of SEEDS){
    const isRace=!!g.id&&/half|5k|10k|marathon/.test(g.id);
    const cfg={name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],
      cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},
      eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",
      restDays:["sun","wed"],days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,...(inj?{injury:inj}:{})};
    try{ walk(IA.buildProgram(cfg)); cfgs++; }catch(e){ crash++; crashes[g.k]=(crashes[g.k]||0)+1; }
  }
  console.log('\n=== ENGINE OUTPUT SWEEP: '+cfgs+' programs built, '+crash+' crashes '+JSON.stringify(crashes)+', '+strings+' strings scanned, '+pict+' A/A2/B chars');
  console.log('  by char: '+JSON.stringify(pictSeen));
}
