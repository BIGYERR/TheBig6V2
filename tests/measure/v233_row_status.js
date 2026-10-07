// Post-V233 measure (mR): before-picture for "no gate row goes dark".
// Usage: node tests/measure/v233_row_status.js <gatesDir> <outputsDir> [harness.js]
//   gatesDir   : snapshot of tests/gates/*.js
//   outputsDir : per-gate outputs named R0__<gate>.js.out (one full run per gate at one artifact)
// Static half reads gate source with comments stripped. Empirical half reads the outputs.
// Oracle: the printed text itself (status-line grammar) and the gate's own summary line; never the engine.
'use strict';
const fs = require('fs'), path = require('path');
const [GD, OD, HJ] = process.argv.slice(2);
if(!GD || !OD){ console.log('usage: gatesDir outputsDir [harness]'); process.exit(2); }

function strip(src){ // comments out, strings/templates/regex kept
  let o = '', i = 0, n = src.length, prev = '';
  const rxPrev = /[(,=:\[!&|?{};+\-*%<>~^\n]|^$|return$|typeof$/;
  while(i < n){
    const c = src[i], d = src[i+1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const e = src.indexOf('*/', i+2); i = e < 0 ? n : e+2; o += ' '; continue; }
    if(c === '"' || c === "'" || c === '`'){
      let j = i+1; while(j < n && src[j] !== c){ if(src[j] === '\\') j++; j++; }
      o += src.slice(i, j+1); i = j+1; prev = c; continue; }
    if(c === '/'){
      const t = o.replace(/\s+$/, ''); const last = t.slice(-1); const word = (t.match(/[A-Za-z_$]+$/)||[''])[0];
      if(rxPrev.test(last) || word === 'return' || word === 'typeof' || t === ''){
        let j = i+1, cls = false; while(j < n){ const ch = src[j]; if(ch === '\\'){ j += 2; continue; } if(ch === '[') cls = true; else if(ch === ']') cls = false; else if(ch === '/' && !cls) break; else if(ch === '\n') break; j++; }
        o += src.slice(i, j+1); i = j+1; continue; }
    }
    o += c; i++;
  }
  return o;
}
// blank out string/regex contents (same length) so brace matching is not fooled
function blank(s){
  return s.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, m => m[0] + m.slice(1,-1).replace(/[^\n]/g,'_') + m.slice(-1));
}
function matchOpen(b, pos){ // index of the unmatched '{' enclosing pos
  let depth = 0; for(let k = pos-1; k >= 0; k--){ const ch = b[k]; if(ch === '}') depth++; else if(ch === '{'){ if(depth === 0) return k; depth--; } } return -1; }
function matchClose(b, open){ let depth = 0; for(let k = open; k < b.length; k++){ if(b[k] === '{') depth++; else if(b[k] === '}'){ depth--; if(depth === 0) return k; } } return -1; }

const gates = fs.readdirSync(GD).filter(f => /^g.*\.js$/.test(f)).sort();
const S = {}; const tally = (k, g) => { (S[k] = S[k] || []).push(g); };
const per = []; const BIF = []; const OTHER = {}; const BAREIF = []; const EXITS = [];
const STATUS_HELPERS = /\b(ok|row|okB|okRow|check|claim|skipRow|scopedOut|scoped|refuse|t)\s*\(/;

for(const g of gates){
  const raw = fs.readFileSync(path.join(GD, g), 'utf8');
  const s = strip(raw), b = blank(s);
  const r = { g };
  // ---------- Q4 helpers
  r.ownOk = /(?:function\s+(?:ok|check)\s*\(|(?:const|let|var)\s+(?:ok|check)\s*=)/.test(s);
  r.ownRow = /(?:function\s+row\s*\(|(?:const|let|var)\s+row\s*=\s*\()/.test(s);
  r.ownSkip = /(?:function\s+skipRow\s*\(|(?:const|let|var)\s+skipRow\s*=)/.test(s);
  r.ownSummary = /(?:function\s+summary\s*\(|(?:const|let|var)\s+summary\s*=)/.test(s);
  r.reqHarness = /require\([^)]*harness(\.js)?['"]?\s*\)/.test(s);
  r.harnessImports = ((s.match(/const\s*\{([^}]*)\}\s*=\s*require\([^)]*harness/)||[])[1]||'').replace(/\s+/g,'');
  r.reqOther = (s.match(/require\([^)]*'(?:\.\.|\.)\/?[^']*'\)|require\(path\.join\([^)]*'([a-z0-9_]+\.js)'\)/g)||[]).filter(x => !/harness/.test(x)).map(x => (x.match(/'([^']+\.js)'/)||[])[1]).filter(Boolean);
  // ok() print format
  const okDef = (s.match(/(?:function\s+(?:ok|check)\s*\([^)]*\)\s*\{|(?:const|let|var)\s+(?:ok|check)\s*=\s*\([^)]*\)\s*=>\s*\{?|(?:const|let|var)\s+(?:ok|check)\s*=\s*[A-Za-z_]+\s*=>\s*\{?)[\s\S]{0,400}/)||[''])[0];
  r.okFmt = !okDef ? (r.ownOk ? 'other' : 'none')
    : /'PASS\s/.test(okDef) ? 'PASS/FAIL col0'
    : /'ok\s+/.test(okDef) ? 'ok/FAIL col0'
    : /'pass\s+/.test(okDef) ? 'pass col0 (lower)'
    : /if\s*\(\s*c\s*\)\s*PASS\+\+/.test(okDef) || /=>\s*PASS\+\+/.test(okDef) ? 'silent pass'
    : /'\s+ok\s+/.test(okDef) && /if\s*\(\s*m\s*\)/.test(okDef) ? '  ok (only if msg)'
    : /'\s+ok\s+/.test(okDef) ? '  ok / FAIL indented'
    : /PASS\+\+\s*;\s*\}/.test(okDef) ? 'silent pass' : 'other';
  // ---------- Q1 declaration
  r.labelMap = null;
  { const mre = /(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=\s*\{\s*(['"]?[A-Za-z0-9_.\-]+['"]?\s*:\s*['"`])/g; let mm;
    while((mm = mre.exec(s)) && !r.labelMap){ const nm = mm[1];
      const used = new RegExp('\\b(?:ok|row|skipRow|okB|check|skip)\\s*\\(\\s*' + nm + '\\[').test(s) || new RegExp(nm + '\\[\\s*(?:key|k|id)\\s*\\]').test(s);
      if(!used) continue;
      const open = b.indexOf('{', mm.index); const close = matchClose(b, open); const body = s.slice(open, close);
      const pairs = []; { const pre = /^\s*['"]?([A-Za-z0-9_.\-]+)['"]?\s*:\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/gm; let pm; while((pm = pre.exec(body))) pairs.push({ k: pm[1], v: pm[3] }); }
      r.labelMap = { name: nm, ids: pairs.map(x => x.k), vals: pairs.map(x => x.v) }; } }
  r.idArray = /(?:const|let|var)\s+(ROW_ORDER|ROW_KEYS|ROW_IDS|QROWS|DECLARED|EXPECTED_ROWS)\s*=\s*\[/.test(s) ? s.match(/(ROW_ORDER|ROW_KEYS|ROW_IDS|QROWS|DECLARED|EXPECTED_ROWS)\s*=\s*\[/)[1] : null;
  r.manifest = /console\.log\([^)]*\b(rows?|ROWS)\b[^)]*(join|length)/.test(s);
  // call sites
  const calls = []; const re = /\b(ok|row|okB|skipRow|check)\s*\(/g; let m;
  while((m = re.exec(b))){ const before = b.slice(Math.max(0,m.index-12), m.index);
    if(/function\s+$|\.\s*$|[A-Za-z_$]$/.test(before)) continue;           // definitions / methods / other names
    if(/(?:const|let|var)\s+$/.test(b.slice(Math.max(0,m.index-8), m.index))) continue;
    const argStart = m.index + m[0].length; const arg = s.slice(argStart, argStart + 80).trimStart();
    calls.push({ fn: m[1], at: m.index, lit: /^['"`]/.test(arg), mapped: /^[A-Z][A-Z0-9_]*\[/.test(arg) }); }
  // drop the calls inside the helper definitions themselves
  r.calls = calls.length; r.litCalls = calls.filter(c => c.lit).length; r.mapCalls = calls.filter(c => c.mapped).length;
  r.decl = r.labelMap ? 'label map (' + r.labelMap.name + ')' : r.idArray ? 'id array (' + r.idArray + ')' : 'ad hoc';
  // ---------- Q3 silent-skip shapes (static)
  let bareIf = 0, shortCirc = 0, inLoop = 0, contInLoop = 0;
  for(const c of calls){
    if(c.fn === 'skipRow') continue;
    const pre = b.slice(Math.max(0, c.at-6), c.at); if(/(&&|\|\|)\s*$/.test(pre) || /\?\s*$/.test(pre)) shortCirc++;
    const open = matchOpen(b, c.at); if(open < 0) continue;
    const head = b.slice(Math.max(0, open-300), open);
    const close = matchClose(b, open); const after = b.slice(close+1, close+40);
    let li = -1; { const rr = /\bif\s*\(/g; let mm; while((mm = rr.exec(head))) li = mm.index; }
    let condOk = false; if(li >= 0){ const hb = blank(head); let k = hb.indexOf('(', li), dep = 0; for(; k < hb.length; k++){ if(hb[k] === '(') dep++; else if(hb[k] === ')'){ dep--; if(dep === 0) break; } } condOk = k < hb.length && /^\s*$/.test(hb.slice(k+1)); }
    if(li >= 0 && condOk && !/else\s*$/.test(head.slice(Math.max(0,li-8), li)) && !/^\s*else\b/.test(after)){ bareIf++; const cond = s.slice(open - (head.length - li), open).replace(/\s+/g,' '); const callTxt = s.slice(c.at, c.at + 600); BAREIF.push(g + ' :: ' + cond.slice(0,110)); BIF.push({ g, cond, failBranch: /,\s*false\s*[,)]/.test(callTxt.split(';')[0]) }); }
    if(/\b(for|while)\s*\([^{]*\)\s*$|forEach\s*\([^{]*=>\s*$/.test(head.slice(-200))) inLoop++;
  }
  // loops whose body both prints a row and can `continue`
  const loopRe = /\b(for|while)\s*\(/g; while((m = loopRe.exec(b))){ const open = b.indexOf('{', m.index); if(open < 0) continue; const close = matchClose(b, open); const body = b.slice(open, close);
    if(/\bcontinue\b/.test(body) && /\b(ok|row)\s*\(/.test(body)) contInLoop++; }
  // early exits before the last row print
  const lastCall = calls.length ? calls[calls.length-1].at : -1;
  const exits = []; const exRe = /process\.exit\s*\(|\breturn\b/g;
  while((m = exRe.exec(b))){ if(m.index < lastCall){ const open = matchOpen(b, m.index); const fnHead = open < 0 ? '' : b.slice(Math.max(0, open-160), open);
      const isFnBody = open >= 0 && (/=>\s*$|function\s*[A-Za-z0-9_$]*\s*\([^)]*\)\s*$/.test(fnHead)); // a helper's own return
      const inMainIIFE = open >= 0 && matchOpen(b, open) === -1 && /(async\s*)?\(\s*\)\s*=>\s*$|async\s+function\s+main\s*\(\s*\)\s*$|function\s+main\s*\(\s*\)\s*$/.test(fnHead);
      const ownFn = /function\s+[A-Za-z0-9_$]+\s*\([^)]*\)\s*$|(?:const|let|var)\s+[A-Za-z0-9_$]+\s*=\s*(?:\([^)]*\)|[A-Za-z_$]+)\s*=>\s*$/.test(fnHead) && !inMainIIFE;
      if(m[0].startsWith('process') && !ownFn){ const code = (s.slice(m.index, m.index+20).match(/exit\s*\(\s*([^)]*)\)/)||[])[1]; const ctx = s.slice(Math.max(0, m.index-600), m.index); const printed = /FAIL|ok\([^;]*false|summary\(|REFUS|console\.log|\bP\(/.test(ctx); exits.push('exit'); EXITS.push({ g, code: (code||'').trim(), printed, ctx: ctx.replace(/\s+/g,' ').slice(-120) }); }
      else if(inMainIIFE && m[0] === 'return'){ const ctx = s.slice(Math.max(0, m.index-220), m.index); exits.push('return'); EXITS.push({ g, code: 'return', printed: /FAIL|ok\([^;]*false|summary\(|console\.log|skipRow|\bP\(/.test(ctx), ctx: ctx.replace(/\s+/g,' ').slice(-120) }); } } }
  { const rr = /\bif\s*\(/g; let mm; while((mm = rr.exec(b))){ let k = mm.index + mm[0].length - 1, dep = 0; for(; k < b.length; k++){ if(b[k] === '(') dep++; else if(b[k] === ')'){ dep--; if(dep === 0) break; } }
      const nx = b.slice(k+1, k+40); if(/^\s*(ok|row|check|okB)\s*\(/.test(nx)){ const e = b.indexOf(';', k); const after = b.slice(e+1, e+30); if(!/^\s*else\b/.test(after) && !/else\s*$/.test(b.slice(Math.max(0, mm.index-8), mm.index))){ bareIf++; const cond = s.slice(mm.index, k+1).replace(/\s+/g,' '); BAREIF.push(g + ' :: [braceless] ' + cond.slice(0,110)); BIF.push({ g, cond, failBranch: /,\s*false\s*[,)]/.test(s.slice(k+1, e)) }); } } } }
  r.bareIf = bareIf; r.shortCirc = shortCirc; r.okInLoop = inLoop; r.contInLoop = contInLoop;
  r.earlyExit = exits.filter(x => x === 'exit').length; r.earlyReturn = exits.filter(x => x === 'return').length;
  r.skipCalls = calls.filter(c => c.fn === 'skipRow').length;
  r.scopedText = (s.match(/SCOPED OUT/g)||[]).length; r.skipText = (s.match(/['"`]\s*SKIP\b/g)||[]).length;
  // ---------- Q2 empirical: the output
  const of = path.join(OD, 'R0__' + g + '.out'); r.out = fs.existsSync(of);
  if(r.out){
    const L = fs.readFileSync(of, 'utf8').split('\n');
    const sum = L.map(x => x.match(/^PASS (\d+) FAIL (\d+)(.*)$/)).filter(Boolean).pop();
    r.sumPass = sum ? +sum[1] : null; r.sumFail = sum ? +sum[2] : null; r.sumTail = sum ? sum[3].trim() : '';
    const cls = { okCol0:0, PASS0:0, FAIL0:0, FAILin:0, okIn:0, SKIP:0, SCOPED:0, REFUSED:0, INFO:0, NA:0, DEFER:0, RETIRED:0, conj:0, other:0 };
    const firstTok = []; let multi = 0;
    for(const x of L){ if(!x.trim() || /^PASS \d+ FAIL \d+/.test(x)) continue;
      if(/^PASS\b/.test(x)){ cls.PASS0++; firstTok.push(x.slice(5)); }
      else if(/^FAIL\b/.test(x)){ cls.FAIL0++; firstTok.push(x.slice(5)); }
      else if(/^\s+FAIL\b/.test(x) && !/ FAIL :: /.test(x)){ cls.FAILin++; firstTok.push(x.trim().slice(5)); }
      else if(/^\s+[\w.\-]+ [\w.\-]+ (ok|FAIL) :: /.test(x)){ cls.conj++; }
      else if(/^(ok|pass)\s/.test(x)){ cls.okCol0++; firstTok.push(x.replace(/^(ok|pass)\s+/,'')); }
      else if(/^\s+ok\b/.test(x)){ cls.okIn++; firstTok.push(x.trim().slice(3).trim()); }
      else if(/^\s*SKIP RETIRED|RETIRED/.test(x) && /^\s*(SKIP|RETIRED)/.test(x)){ cls.RETIRED++; firstTok.push(x); }
      else if(/^\s*SKIP\b/.test(x)){ cls.SKIP++; firstTok.push(x.trim().slice(5)); }
      else if(/^\s*SCOPED OUT\b/.test(x)){ cls.SCOPED++; firstTok.push(x.trim().slice(11)); }
      else if(/^\s*REFUSED\b/.test(x)){ cls.REFUSED++; }
      else if(/^\s*INFO\b/.test(x)){ cls.INFO++; }
      else if(/^\s*N\/A\b/.test(x)){ cls.NA++; }
      else if(/^\s*DEFER/.test(x)){ cls.DEFER++; }
      else { cls.other++; const pf = x.replace(/^(\s*)(\S{0,9}).*/, (a,sp,w) => (sp.length?'_'+sp.length:'') + w.replace(/[0-9]/g,'#')); OTHER[pf] = (OTHER[pf]||0)+1; }
      if((x.match(/\b(PASS|FAIL|SKIP)\b/g)||[]).length >= 2 && !/^PASS \d+ FAIL/.test(x)) multi++;
    }
    r.cls = cls; r.multi = multi;
    const passLines = cls.PASS0 + cls.okIn + cls.okCol0; const failLines = cls.FAIL0 + cls.FAILin;
    r.passLines = passLines; r.failLines = failLines;
    r.silentPass = r.sumPass != null && passLines < r.sumPass ? r.sumPass - passLines : 0;
    r.extraPass = r.sumPass != null && passLines > r.sumPass ? passLines - r.sumPass : 0;
    // id parse: leading token of each status line
    const ids = firstTok.map(t => { const mm = t.trim().replace(/^row\s+/, '').match(/^([A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*|D\d+[A-Za-z0-9.\-]*)[:\s]/); return mm ? mm[1] : null; });
    r.idTok = ids.filter(Boolean).length; r.statusLines = firstTok.length;
    const seen = {}; ids.filter(Boolean).forEach(x => seen[x] = (seen[x]||0)+1); r.dupIds = Object.values(seen).filter(v => v > 1).length;
    // declared ids (label map) with no status line
    if(r.labelMap){ const st = L.filter(x => /^\s*(PASS|FAIL|SKIP|SCOPED OUT|ok|pass|RETIRED|N\/A)\b/.test(x) && !/^PASS \d+ FAIL \d+/.test(x));
      r.darkDeclared = r.labelMap.ids.filter((id, i) => { const v = (r.labelMap.vals[i] || '').replace(/\\(.)/g, '$1').replace(/\$\{[\s\S]*$/, '').slice(0, 28); if(v.length < 6) return false; return !st.some(x => x.includes(v)); });
      r.multiDeclared = r.labelMap.ids.filter((id, i) => { const v = (r.labelMap.vals[i] || '').replace(/\\(.)/g, '$1').replace(/\$\{[\s\S]*$/, '').slice(0, 28); return v.length >= 6 && st.filter(x => x.includes(v)).length > 1; }); }
  }
  per.push(r);
}

// ---------- report
const N = per.length; const cnt = f => per.filter(f).length; const names = f => per.filter(f).map(r => r.g.replace(/\.js$/,''));
console.log('GATES ' + N + '  outputs found ' + cnt(r => r.out));
console.log('\n== Q1 DECLARATION');
console.log('label map keyed by id (ok(R[key]) / row(key,…)) : ' + cnt(r => r.labelMap) + '/' + N);
console.log('id array only (ROW_ORDER/ROW_KEYS…)             : ' + cnt(r => !r.labelMap && r.idArray) + '/' + N);
console.log('ad hoc (literal or computed label at call site)  : ' + cnt(r => !r.labelMap && !r.idArray) + '/' + N);
console.log('  of which every call literal-labelled          : ' + cnt(r => !r.labelMap && !r.idArray && r.calls && r.litCalls === r.calls));
console.log('  of which some call computed (label built at runtime): ' + cnt(r => !r.labelMap && !r.idArray && r.litCalls < r.calls));
console.log('  of which row call inside a loop               : ' + cnt(r => !r.labelMap && !r.idArray && r.okInLoop));
console.log('gates with ok/row call sites in loops (any decl) : ' + cnt(r => r.okInLoop) + '/' + N + ' (sites ' + per.reduce((a,r)=>a+r.okInLoop,0) + ')');
console.log('labelMap gates: ' + names(r => r.labelMap).join(' '));
console.log('idArray gates : ' + names(r => !r.labelMap && r.idArray).join(' '));
console.log('declared ids total (label maps): ' + per.reduce((a,r)=>a+(r.labelMap?r.labelMap.ids.length:0),0));
console.log('call sites total ' + per.reduce((a,r)=>a+r.calls,0) + ', literal-label ' + per.reduce((a,r)=>a+r.litCalls,0) + ', map-keyed ' + per.reduce((a,r)=>a+r.mapCalls,0));
console.log('\n== Q2 STATUS-LINE FORMATS (helper definition, static)');
const fm = {}; per.forEach(r => (fm[r.okFmt] = fm[r.okFmt] || []).push(r.g.replace(/\.js$/,'')));
Object.entries(fm).sort((a,b)=>b[1].length-a[1].length).forEach(([k,v]) => console.log('  ' + k.padEnd(22) + v.length + '/' + N + (v.length <= 12 ? '  ' + v.join(' ') : '')));
console.log('own row() helper ' + cnt(r=>r.ownRow) + '/' + N + ', own skipRow ' + cnt(r=>r.ownSkip) + '/' + N + ', SKIP text ' + cnt(r=>r.skipText) + ', SCOPED OUT text ' + cnt(r=>r.scopedText));
console.log('\n== Q2 STATUS LINES IN OUTPUT (V233 run, R0)');
const K = ['okCol0','PASS0','FAIL0','FAILin','okIn','conj','SKIP','SCOPED','RETIRED','REFUSED','INFO','NA','DEFER','other'];
const withOut = per.filter(r => r.out && r.cls);
K.forEach(k => { const gs = withOut.filter(r => r.cls[k] > 0); console.log('  ' + k.padEnd(8) + ' lines ' + String(withOut.reduce((a,r)=>a+r.cls[k],0)).padStart(6) + '  gates ' + gs.length + '/' + withOut.length + (gs.length && gs.length <= 10 ? '  ' + gs.map(r=>r.g.replace(/\.js$/,'')).join(' ') : '')); });
console.log('no summary line in output: ' + names(r => r.out && r.sumPass == null).join(' '));
console.log('passing rows printed as nothing (summary PASS n > pass lines): ' + cnt(r => r.silentPass > 0) + '/' + withOut.length + ', rows ' + per.reduce((a,r)=>a+r.silentPass,0));
per.filter(r => r.silentPass > 0).forEach(r => console.log('    ' + r.g.replace(/\.js$/,'').padEnd(36) + 'summary PASS ' + r.sumPass + ' / pass lines ' + r.passLines + ' (fmt ' + r.okFmt + ')'));
console.log('more pass lines than summary PASS n (one row over several lines or helper lines): ' + cnt(r => r.extraPass > 0));
per.filter(r => r.extraPass > 0).forEach(r => console.log('    ' + r.g.replace(/\.js$/,'').padEnd(36) + 'summary PASS ' + r.sumPass + ' / pass lines ' + r.passLines + ' conj ' + r.cls.conj));
console.log('conjunct sub-lines (`key name ok|FAIL ::`) under one row: gates ' + cnt(r => r.cls && r.cls.conj) + ', lines ' + withOut.reduce((a,r)=>a+r.cls.conj,0));
console.log('lines carrying >=2 status words: gates ' + cnt(r => r.multi) + ', lines ' + withOut.reduce((a,r)=>a+r.multi,0) + '  ' + names(r=>r.multi).slice(0,12).join(' '));
const SL = withOut.reduce((a,r)=>a+r.statusLines,0), ID = withOut.reduce((a,r)=>a+r.idTok,0);
console.log('status lines with a leading id token: ' + ID + '/' + SL + '; gates where every status line has one: ' + cnt(r => r.out && r.statusLines && r.idTok === r.statusLines) + '/' + withOut.length + '; gates with 0: ' + cnt(r => r.out && r.statusLines && r.idTok === 0));
console.log('gates with duplicate leading id tokens: ' + cnt(r => r.dupIds > 0));
console.log('\n== Q3 SILENT-SKIP SHAPES (static, approximate)');
console.log('row call inside bare if (no else)      : gates ' + cnt(r=>r.bareIf) + '/' + N + ', sites ' + per.reduce((a,r)=>a+r.bareIf,0));
{ const cat = x => x.failBranch ? 'fail-branch (prints FAIL/REFUSED, not silent)' : /VER|ERA|version/.test(x.cond) ? 'version guard (dark by version)' : /SKIP|err|crash|__err|!S\.ok|!Q\b|!BF|setup|!G\b|typeof/.test(x.cond) ? 'setup/crash guard (dark when setup failed)' : 'data/config guard (dark when condition false)';
  const agg = {}; BIF.forEach(x => { const k = cat(x); agg[k] = agg[k] || { sites: 0, gates: new Set() }; agg[k].sites++; agg[k].gates.add(x.g.replace(/\.js$/,'')); });
  Object.entries(agg).forEach(([k, v]) => console.log('    ' + k.padEnd(48) + 'sites ' + String(v.sites).padStart(3) + ' gates ' + v.gates.size + (v.gates.size <= 16 ? '  ' + [...v.gates].join(' ') : ''))); }
console.log('row call behind && / || / ?           : gates ' + cnt(r=>r.shortCirc) + '/' + N + ', sites ' + per.reduce((a,r)=>a+r.shortCirc,0));
console.log('loop body with continue + row call     : gates ' + cnt(r=>r.contInLoop) + '/' + N + ', loops ' + per.reduce((a,r)=>a+r.contInLoop,0));
console.log('process.exit before last row call      : gates ' + cnt(r=>r.earlyExit) + '/' + N + ', sites ' + per.reduce((a,r)=>a+r.earlyExit,0));
console.log('main-body return before last row call  : gates ' + cnt(r=>r.earlyReturn) + '/' + N + ', sites ' + per.reduce((a,r)=>a+r.earlyReturn,0));
console.log('any of the above                       : gates ' + cnt(r=>r.bareIf||r.shortCirc||r.contInLoop||r.earlyExit||r.earlyReturn) + '/' + N);
console.log('declared label-map ids with NO status line in the V233 output: ' + per.reduce((a,r)=>a+((r.darkDeclared||[]).length),0) + '/' + per.reduce((a,r)=>a+(r.labelMap?r.labelMap.ids.length:0),0));
per.filter(r => r.darkDeclared && r.darkDeclared.length).forEach(r => console.log('    ' + r.g + ' dark: ' + r.darkDeclared.join(' ')));
console.log('declared label-map ids with >1 status line: ' + per.reduce((a,r)=>a+((r.multiDeclared||[]).length),0)); per.filter(r => r.multiDeclared && r.multiDeclared.length).forEach(r => console.log('    ' + r.g + ' multi: ' + r.multiDeclared.join(' ')));
console.log('early exits by kind: ' + JSON.stringify(EXITS.reduce((a,e)=>{ const k = e.code + (e.printed ? ' (print within 220 chars before)' : ' (NO print before)'); a[k]=(a[k]||0)+1; return a; },{})));
console.log('early exits with no print before: gates ' + new Set(EXITS.filter(e=>!e.printed).map(e=>e.g)).size + '  ' + [...new Set(EXITS.filter(e=>!e.printed).map(e=>e.g.replace(/\.js$/,'')))].join(' '));
fs.writeFileSync(process.env.MR_SITES || '/dev/null', BAREIF.join('\n') + '\n==EXITS\n' + EXITS.map(e => e.g + ' [' + e.code + (e.printed?' printed':' SILENT') + '] ' + e.ctx).join('\n') + '\n==OTHER\n' + Object.entries(OTHER).sort((a,b)=>b[1]-a[1]).map(([k,v])=>v+' '+k).join('\n'));
console.log('\n== Q4 SHARED HELPERS');
if(HJ){ const h = strip(fs.readFileSync(HJ, 'utf8')); const ex = (h.match(/module\.exports\s*=\s*\{([\s\S]*?)\}/)||[])[1]||''; console.log('harness exports: ' + ex.replace(/\s+/g,' ').trim());
  console.log('harness defines ok/summary/skipRow/declare: ' + ['ok','summary','skipRow','declare','row'].map(n => n + '=' + new RegExp('(function\\s+' + n + '\\s*\\(|(const|let|var)\\s+' + n + '\\s*=)').test(h)).join(' ')); }
console.log('require harness ' + cnt(r=>r.reqHarness) + '/' + N + '; own ok ' + cnt(r=>r.ownOk) + '/' + N + '; own summary ' + cnt(r=>r.ownSummary) + '/' + N);
const imp = {}; per.forEach(r => r.harnessImports.split(',').filter(Boolean).forEach(x => imp[x] = (imp[x]||0)+1)); console.log('harness names imported: ' + JSON.stringify(imp));
const oth = {}; per.forEach(r => r.reqOther.forEach(x => oth[x] = (oth[x]||0)+1)); console.log('other local modules required: ' + JSON.stringify(oth));
const okDefs = {}; per.forEach(r => (okDefs[r.okFmt] = (okDefs[r.okFmt]||0)+1));
console.log('no harness require: ' + names(r=>!r.reqHarness).join(' '));
console.log('\n== PER GATE (decl | fmt | calls lit/map | loop | bareIf/short/cont/exit/ret | out: sumP/passLines skip scoped)');
per.forEach(r => console.log([r.g.replace(/\.js$/,'').padEnd(34), r.decl.padEnd(22), r.okFmt.padEnd(20), (r.calls + ' ' + r.litCalls + '/' + r.mapCalls).padEnd(10), String(r.okInLoop).padEnd(3), [r.bareIf,r.shortCirc,r.contInLoop,r.earlyExit,r.earlyReturn].join('/').padEnd(12), r.out ? (r.sumPass + '/' + r.passLines + ' s' + r.cls.SKIP + ' so' + r.cls.SCOPED + ' oth' + r.cls.other) : 'no-out'].join(' ')));
console.log('\nPASS 1 FAIL 0 (measure printed)');
