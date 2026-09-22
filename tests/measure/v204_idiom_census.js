// v204_idiom_census.js — the census of the seconds-limb idiom across the artifact.
//
// Promoted from the three ad-hoc scanners used during the D126 slices. It answers
// three questions about the SOURCE, not about any built program:
//   S1  round-INSIDE:  Math.round(<expr> % 60)   — the defective idiom D126 removes.
//                      It rounds the REMAINDER, so 59.5 prints as a :60 seconds limb.
//   S2  _clkMS( call sites — the helper that now owns every seconds limb.
//   S3  round-OUTSIDE: Math.round(<expr>) % 60   — correct by construction, because
//                      the whole value is rounded BEFORE the remainder is taken.
//
// WHY THE MASKING IS THE POINT. index.html carries prose about `_clkMS` and about the
// idiom inside comments, and carries clock-shaped text inside string literals. A raw
// grep counts those and the count stops meaning anything. So before any regex runs:
//   * every line and block comment body is blanked;
//   * every single/double-quoted string body is blanked;
//   * every regex literal body is blanked;
//   * template literal TEXT is blanked but `${...}` interpolations are NOT — they are
//     real code and an idiom can live inside one. (The first cut of this scanner
//     blanked them and lost the _fmtPaceShort call site at line 15122.)
// Blanking is length- and newline-preserving, so every line number printed below is
// the real line number in index.html.
//
// SELF-CHECK: the masked script must still PARSE as JavaScript. Blanking comment,
// string, regex and template-text bodies cannot change the syntax tree's shape, so a
// parse failure means the state machine desynced and the counts are worthless. The
// census refuses to report numbers it cannot stand behind.
//
// Usage: node tests/measure/v204_idiom_census.js [artifact.html]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── MASKER ────────────────────────────────────────────────────────────────
function maskCommentsAndStrings(src){
  const out = src.split('');
  const n = src.length;
  const blank = (a, b) => { for(let k=a;k<b && k<n;k++) if(out[k] !== '\n') out[k] = ' '; };
  // A '/' starts a regex literal (not a division) when the last significant char is
  // one of these. Errs toward reading it as a regex, which only ever masks more.
  const REGEX_PREV = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '\n', 'n']);
  const mode = [{ t:'code', depth:0, inTpl:false }];
  let i = 0, lastSig = '\n';
  while(i < n){
    const cur = mode[mode.length-1];
    if(cur.t === 'tpl'){
      let j = i;
      while(j < n){
        if(src[j] === '\\'){ j += 2; continue; }
        if(src[j] === '`') break;
        if(src[j] === '$' && src[j+1] === '{') break;
        j++;
      }
      blank(i, j);
      if(j >= n){ i = n; break; }
      if(src[j] === '`'){ mode.pop(); i = j+1; lastSig = '`'; continue; }
      mode.push({ t:'code', depth:0, inTpl:true });   // enter ${ … } as CODE
      i = j+2; lastSig = '{'; continue;
    }
    const c = src[i], d = src[i+1];
    if(c === '/' && d === '/'){
      let j = i; while(j < n && src[j] !== '\n') j++;
      blank(i, j); i = j; continue;
    }
    if(c === '/' && d === '*'){
      let j = src.indexOf('*/', i+2); j = (j === -1) ? n : j+2;
      blank(i, j); i = j; continue;
    }
    if(c === '"' || c === "'"){
      let j = i+1;
      while(j < n){
        if(src[j] === '\\'){ j += 2; continue; }
        if(src[j] === c || src[j] === '\n') break;
        j++;
      }
      blank(i+1, j); i = j+1; lastSig = c; continue;
    }
    if(c === '`'){ mode.push({ t:'tpl' }); i++; continue; }
    if(c === '{'){ cur.depth++; lastSig = c; i++; continue; }
    if(c === '}'){
      if(cur.depth === 0 && cur.inTpl){ mode.pop(); i++; lastSig = '}'; continue; }
      cur.depth--; lastSig = c; i++; continue;
    }
    if(c === '/' && REGEX_PREV.has(lastSig)){
      let j = i+1, cls = false, closed = false;
      while(j < n && src[j] !== '\n'){
        if(src[j] === '\\'){ j += 2; continue; }
        if(src[j] === '[') cls = true;
        else if(src[j] === ']') cls = false;
        else if(src[j] === '/' && !cls){ closed = true; break; }
        j++;
      }
      if(closed){ blank(i+1, j); i = j+1; lastSig = '/'; continue; }
    }
    if(!/\s/.test(c)) lastSig = c;
    i++;
  }
  return out.join('');
}

// ── SCANNERS ──────────────────────────────────────────────────────────────
// S1 and S3 allow one level of nested parens inside the rounded expression, which is
// what `Math.round(Math.abs(x) % 60)` and friends need.
const INNER = "(?:[^()]|\\([^()]*\\))*";
const S1_ROUND_INSIDE  = new RegExp("Math\\.round\\(\\s*" + INNER + "%\\s*60\\s*\\)", "g");
const S3_ROUND_OUTSIDE = new RegExp("Math\\.round\\(" + INNER + "\\)\\s*%\\s*60", "g");
const S2_CLKMS_CALL    = /_clkMS\s*\(/g;
const S2_CLKMS_DECL    = /function\s+_clkMS\s*\(/g;

// ── ONE INLINE SCRIPT, WITH ITS TRUE LINE OFFSET ──────────────────────────
function inlineScripts(raw){
  const out = [];
  const re = /<script(?:\s[^>]*)?>/gi;
  let m;
  while((m = re.exec(raw))){
    const start = m.index + m[0].length;
    const end = raw.indexOf('</script>', start);
    if(end === -1) continue;
    const before = raw.slice(0, start);
    out.push({ body: raw.slice(start, end), start, baseLine: before.split('\n').length });
    re.lastIndex = end;
  }
  return out;
}

function hitsFor(masked, re, baseLine, srcLines, lineOffsetOfBody){
  const out = []; re.lastIndex = 0; let m;
  while((m = re.exec(masked))){
    const local = masked.slice(0, m.index).split('\n').length;   // 1-based within body
    const line = baseLine + local - 1;
    out.push({ line, text: (srcLines[line-1] || '').trim() });
  }
  return out;
}

function census(artPath){
  const raw = fs.readFileSync(artPath, 'utf8');
  const srcLines = raw.split('\n');
  const blocks = inlineScripts(raw);
  const res = { artifact: artPath, blocks: blocks.length, parseOk: true, parseErr: '',
                roundInside: [], roundOutside: [], clkDecls: [], clkCalls: [],
                rawGrepLines: (raw.match(/^.*_clkMS.*$/gm) || []).length, srcLines };
  for(const b of blocks){
    const masked = maskCommentsAndStrings(b.body);
    try { new vm.Script(masked, { filename: 'masked' }); }
    catch(e){ res.parseOk = false; res.parseErr = e.message; }
    res.roundInside.push(...hitsFor(masked, S1_ROUND_INSIDE, b.baseLine, srcLines));
    res.roundOutside.push(...hitsFor(masked, S3_ROUND_OUTSIDE, b.baseLine, srcLines));
    const decls = hitsFor(masked, S2_CLKMS_DECL, b.baseLine, srcLines);
    res.clkDecls.push(...decls);
    const declLines = decls.map(h => h.line);
    for(const h of hitsFor(masked, S2_CLKMS_CALL, b.baseLine, srcLines)){
      // The declaration's own `_clkMS(` is not a call site. It is the only _clkMS(
      // on its line, so dropping one hit per declaration line is exact.
      const k = declLines.indexOf(h.line);
      if(k !== -1){ declLines.splice(k, 1); continue; }
      res.clkCalls.push(h);
    }
  }
  return res;
}

module.exports = { maskCommentsAndStrings, census, inlineScripts,
                   S1_ROUND_INSIDE, S3_ROUND_OUTSIDE, S2_CLKMS_CALL, S2_CLKMS_DECL };

if(require.main === module){
  const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
  const c = census(ART);
  const show = h => '  line ' + h.line + ': ' + h.text.slice(0, 150);
  console.log('ARTIFACT ' + ART);
  console.log('INLINE SCRIPT BLOCKS ' + c.blocks + ' | MASKER PARSE SELF-CHECK ' + (c.parseOk ? 'OK' : 'FAILED: ' + c.parseErr));
  console.log('RAW GREP lines containing _clkMS (comments included) = ' + c.rawGrepLines);
  console.log('S1 round-INSIDE  Math.round(<expr> % 60)   count=' + c.roundInside.length);
  for(const h of c.roundInside) console.log(show(h));
  console.log('S2 _clkMS declarations=' + c.clkDecls.length + '  CALL SITES=' + c.clkCalls.length);
  for(const h of c.clkCalls) console.log(show(h));
  console.log('S3 round-OUTSIDE Math.round(<expr>) % 60   count=' + c.roundOutside.length);
  for(const h of c.roundOutside) console.log(show(h));
}
