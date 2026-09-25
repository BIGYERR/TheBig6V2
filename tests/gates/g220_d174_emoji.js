// g220_d174_emoji.js -- GATE for D174 (P-EMOJI), shipped in V220.
//
//   node tests/gates/g220_d174_emoji.js [candidate.html]
//
// THE RULING THIS DEFENDS: tests/measure/v220_rulings/p_emoji_ruling.md (amended 2026-09-23), with Mario's decision
// and the P-RECOVBANNER amendment at its tail:
//   "Pop-ups: emoji STAY on celebration tiers (workout, streak, season, Wildcard), incl. dismiss labels, kicker,
//    confetti trophy. All dash fixes IN. Reminder tier and injury calls: ICONS (notebook / shield / warning), coach
//    recommendation accepted. 25-edit variant. Outside the pop-up: emoji removed as ruled."
//   P-RECOVBANNER: the week-view recovery banner is deleted outright; the recovery-banner row and sabotage (1) are VOID
//   (25 -> 24). Interaction ruled in this build: D175 removed the short-gap reminder string ("This one got away from
//   you...") outright, so s3 row 2 is satisfied by removal, not by a dash fix.
//
// ORACLES (none asks the engine what it should be):
//   - the pictograph classifier is COPIED from measure's tests/measure/v220_emoji_chrome.js (tokenizer, comment
//     stripper, decoder of \u escapes / surrogate pairs / \u{..} / \x / HTML entities / CSS escapes, and the
//     Unicode-property class oracle \p{Emoji_Presentation} / \p{Extended_Pictographic}). Class A and A2 are counted
//     whether the source stores the literal glyph or its backslash-u escape text.
//   - hand tables typed from the ruling's s2/s3/s4/s5 After (and Before) text;
//   - the V219 artifact (git show 920fa0a:index.html) for pool and dismiss ORDER, never for the edited rows;
//   - rendered output from the artifact's own site expressions, graded against the ruling's shape (an <svg> where
//     the emoji was, the celebration emoji as text).
// This file is ASCII only: every non-ASCII glyph and every backslash-u escape text is built in code.
//
// ROW A ALLOWLIST MECHANISM (s6). A class A/A2 hit in a non-comment token is allowed only if one of these holds:
//   (a1) it lies inside the bracket extent of POP_POOLS.workout, .streak or .season (NOT .reminder);
//   (a2) it is the string token right after `<workout|streak|season>: {icon:` inside POP_CFG (NOT reminder);
//   (a3) it lies inside the bracket extent of POP_DISMISS;
//   (a4) it is the string token after `kicker: streak+` whose text is exactly "-DAY STREAK <fire>";
//   (a5) it is the string token after `p.textContent=` inside function popConfetti whose text is exactly <trophy>;
//   (a6) it is the HTML text right after `<span class="pop-icon" id="popIcon">` and is <party popper>;
//   (b)  it is a key (string token followed by `:`) inside the ASY_EMOJI object;
//   (c1) it is a string token inside the FIRST argument of an asyIcon( call (token-aware paren walk), the token is a
//        bare pictograph and its VS16-stripped form is an ASY_EMOJI key whose value is an ASY_ICON_PATHS key (so it
//        renders SVG; an unmapped emoji through asyIcon is returned raw and is NOT allowed);
//   (c2) routed data: a bare pictograph that is the value of `icon:` (option arrays) or of `run:/bike:/swim:` (icon
//        maps) inside the bracket extent of one of eight hand-listed literals whose consumer passes that field to
//        asyIcon (consumer anchors asserted present exactly once), with the same SVG-mapping condition as (c1).
//   The four injury icon values, POP_CFG.reminder and POP_POOLS.reminder are deliberately NOT allowlisted (s5 went
//   to the recommendation). Every anchor must resolve exactly once and every mechanism must allow at least one hit
//   (a dead allowlist entry fails A2; standing ruling 3).
//
// VERSION PREDICATE (standing rulings 2 and 4). Keyed to D174: ia-version < 220 REFUSES and every row FAILS by name;
// 220 and above run every row.
// ROWS
//   A0 scanner sane  A1 zero non-allowlisted A/A2 pictographs  A2 allowlist anchors resolve once, every mechanism live
//   B1-B9 s2 After texts exactly once (token equality)  B10 s3 >=7 text  B11 Before texts gone  B12 short-gap string
//   gone  B13 wizard seed caption
//   C0 V219 readable  C1 pool tiers and counts  C2 unedited rows equal V219  C3 edited rows = hand table (and V219 =
//   Before)  C4 POP_DISMISS  C5 reminder pool ASCII
//   D1 POP_CFG.reminder.icon  D2a-d injury icons from source  D3a-c popFire render (DOM stub)  D4a-d chrome renders
//   E1-E3 allowlist self-check on in-memory copies (NOT probes)
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), vm = require('vm');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASE_REF = '920fa0a';   // V219 commit ("V219: D167/D171/D159/D164/D170/D165/D166")

const CP = (...a) => String.fromCodePoint(...a);
const BS = String.fromCharCode(92);
const MD = CP(0x2014), LQ = CP(0x201C), RQ = CP(0x201D);
const cnt = (h, n) => { if(!n) return 0; let c = 0, i = 0; while((i = h.indexOf(n, i)) >= 0){ c++; i += n.length; } return c; };
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => BS + m);
function decodeEsc(s){
  return s.replace(new RegExp(BS + BS + 'u' + BS + '{([0-9a-fA-F]+)' + BS + '}', 'g'), (m, h) => CP(parseInt(h, 16)))
          .replace(new RegExp(BS + BS + 'u([0-9a-fA-F]{4})', 'g'), (m, h) => String.fromCharCode(parseInt(h, 16)));
}

// ---------- class oracle (verbatim logic, measure v220_emoji_chrome.js klass) ----------
const reEP = /\p{Emoji_Presentation}/u, reXP = /\p{Extended_Pictographic}/u;
function klass(cp, nextCp){
  const ch = String.fromCodePoint(cp);
  if(cp === 0xD7 || cp === 0x2014) return 'C';
  if(reEP.test(ch)) return 'A';
  if(reXP.test(ch) && nextCp === 0xFE0F) return 'A';
  if(reXP.test(ch)) return 'A2';
  if((cp >= 0x2190 && cp <= 0x21FF) || (cp >= 0x2300 && cp <= 0x23FF) || (cp >= 0x25A0 && cp <= 0x25FF) || (cp >= 0x2600 && cp <= 0x27BF) ||
     (cp >= 0x2B00 && cp <= 0x2BFF) || cp === 0x2022 || cp === 0x2023 || (cp >= 0x1F000)) return 'B';
  return null;
}
function pictos(str){ const a = [...String(str)].map(c => c.codePointAt(0)), out = [];
  for(let k = 0; k < a.length; k++){ if(a[k] === 0xFE0F || a[k] === 0x200D) continue; const kl = klass(a[k], a[k + 1]); if(kl === 'A' || kl === 'A2') out.push(CP(a[k])); }
  return out; }
function bare(txt){ const a = [...String(txt)].map(c => c.codePointAt(0)); if(!a.length) return false; let n = 0;
  for(let k = 0; k < a.length; k++){ const c = a[k]; if(c === 0xFE0F || c === 0x200D || (c >= 0x1F3FB && c <= 0x1F3FF)) continue;
    const kl = klass(c, a[k + 1]); if(kl === 'A' || kl === 'A2') n++; else return false; }
  return n > 0; }

// ---------- scanner (measure's tokenizer + decoder, parameterised on the source) ----------
const NAMED = { amp:38, lt:60, gt:62, quot:34, apos:39, nbsp:0xA0, times:0xD7, mdash:0x2014, ndash:0x2013, rarr:0x2192, larr:0x2190,
  uarr:0x2191, darr:0x2193, harr:0x2194, bull:0x2022, middot:0xB7, hellip:0x2026, check:0x2713, cross:0x2717, star:0x2606, starf:0x2605,
  hearts:0x2665, deg:0xB0, frac12:0xBD, rsquo:0x2019, lsquo:0x2018, ldquo:0x201C, rdquo:0x201D, copy:0xA9, reg:0xAE, trade:0x2122,
  minus:0x2212, divide:0xF7, plusmn:0xB1, laquo:0xAB, raquo:0xBB, para:0xB6, sect:0xA7, dagger:0x2020, loz:0x25CA, spades:0x2660,
  clubs:0x2663, diams:0x2666 };
function scan(src){
  const lineStarts = [0]; for(let i = 0; i < src.length; i++) if(src[i] === '\n') lineStarts.push(i + 1);
  const lineOf = off => { let lo = 0, hi = lineStarts.length - 1; while(lo < hi){ const m = (lo + hi + 1) >> 1; if(lineStarts[m] <= off) lo = m; else hi = m - 1; } return lo + 1; };
  const regions = [];
  { const re = /<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi; let m, last = 0;
    while((m = re.exec(src))){ const inner = m.index + m[0].indexOf('>') + 1; const end = inner + m[3].length;
      regions.push({ kind:'html', a:last, b:inner }); regions.push({ kind:m[1].toLowerCase() === 'script' ? 'js' : 'css', a:inner, b:end }); last = end; }
    regions.push({ kind:'html', a:last, b:src.length }); }
  const toks = [], comments = [];
  function tokJS(a, b){
    let i = a, codeStart = a; const tplStack = []; let braceDepth = 0; let lastSig = '(';
    const kw = /(?:return|typeof|case|else|in|of|new|delete|void|throw|yield|await|do)$/;
    function flushCode(end){ if(end > codeStart) toks.push({ type:'code', a:codeStart, b:end }); }
    function readTpl(start){ let j = start;
      while(j < b){ const c = src[j];
        if(c === BS){ j += 2; continue; }
        if(c === '`'){ toks.push({ type:'tpl', a:start, b:j }); return { end:j + 1, open:false }; }
        if(c === '$' && src[j + 1] === '{'){ toks.push({ type:'tpl', a:start, b:j }); return { end:j + 2, open:true }; }
        j++; }
      throw new Error('unterminated template at line ' + lineOf(start)); }
    while(i < b){
      const c = src[i], n = src[i + 1];
      if(c === '/' && n === '/'){ flushCode(i); let j = i; while(j < b && src[j] !== '\n') j++; comments.push([i, j]); i = j; codeStart = i; continue; }
      if(c === '/' && n === '*'){ flushCode(i); const j = src.indexOf('*/', i + 2); if(j < 0 || j > b) throw new Error('unterminated block comment line ' + lineOf(i)); comments.push([i, j + 2]); i = j + 2; codeStart = i; continue; }
      if(c === '"' || c === "'"){ flushCode(i); let j = i + 1; while(j < b && src[j] !== c){ if(src[j] === BS) j++; if(src[j] === '\n') throw new Error('newline in string line ' + lineOf(j)); j++; }
        toks.push({ type:'str', a:i + 1, b:j }); i = j + 1; codeStart = i; lastSig = '"'; continue; }
      if(c === '`'){ flushCode(i); const r = readTpl(i + 1); i = r.end; if(r.open) tplStack.push(braceDepth); codeStart = i; lastSig = '`'; continue; }
      if(c === '/'){
        const prev = lastSig; const before = src.slice(Math.max(a, i - 12), i).replace(/\s+$/, '');
        const isRe = /[(,=:\[!&|?{};+\-*%<>~^]$/.test(prev) || kw.test(before) || prev === '}';
        if(isRe){ flushCode(i); let j = i + 1, cls = false; while(j < b){ const d = src[j]; if(d === BS){ j += 2; continue; } if(d === '\n') throw new Error('newline in regex line ' + lineOf(i)); if(cls){ if(d === ']') cls = false; } else { if(d === '[') cls = true; else if(d === '/') break; } j++; }
          toks.push({ type:'re', a:i + 1, b:j }); j++; while(/[a-z]/i.test(src[j])) j++; i = j; codeStart = i; lastSig = 'r'; continue; }
      }
      if(c === '{'){ braceDepth++; }
      if(c === '}'){ if(tplStack.length && tplStack[tplStack.length - 1] === braceDepth){ flushCode(i); tplStack.pop(); const r = readTpl(i + 1); i = r.end; if(r.open) tplStack.push(braceDepth); codeStart = i; lastSig = '`'; continue; } braceDepth--; }
      if(!/\s/.test(c)) lastSig = c;
      if(/[A-Za-z0-9_$]/.test(c)) lastSig = 'a';
      i++;
    }
    flushCode(b);
    if(tplStack.length) throw new Error('template stack not empty');
  }
  function tokCSS(a, b){ let i = a; while(i < b){ const j = src.indexOf('/*', i); if(j < 0 || j >= b){ toks.push({ type:'css', a:i, b }); break; } toks.push({ type:'css', a:i, b:j }); const k = src.indexOf('*/', j + 2); comments.push([j, k + 2]); i = k + 2; } }
  function tokHTML(a, b){ let i = a; while(i < b){ const j = src.indexOf('<!--', i); if(j < 0 || j >= b){ toks.push({ type:'html', a:i, b }); break; } toks.push({ type:'html', a:i, b:j }); const k = src.indexOf('-->', j + 4); comments.push([j, k + 3]); i = k + 3; } }
  for(const r of regions){ if(r.kind === 'js') tokJS(r.a, r.b); else if(r.kind === 'css') tokCSS(r.a, r.b); else tokHTML(r.a, r.b); }
  function decode(a, b, mode){
    const out = []; let i = a; const push = (cp, off) => out.push({ cp, off });
    while(i < b){
      const c = src[i];
      if(mode === 'js' && c === BS){
        const n = src[i + 1];
        if(n === 'u' && src[i + 2] === '{'){ const j = src.indexOf('}', i); push(parseInt(src.slice(i + 3, j), 16), i); i = j + 1; continue; }
        if(n === 'u'){ let cu = parseInt(src.slice(i + 2, i + 6), 16); let adv = 6;
          if(cu >= 0xD800 && cu <= 0xDBFF && src[i + 6] === BS && src[i + 7] === 'u'){ const lo = parseInt(src.slice(i + 8, i + 12), 16); if(lo >= 0xDC00 && lo <= 0xDFFF){ cu = 0x10000 + ((cu - 0xD800) << 10) + (lo - 0xDC00); adv = 12; } }
          push(cu, i); i += adv; continue; }
        if(n === 'x'){ push(parseInt(src.slice(i + 2, i + 4), 16), i); i += 4; continue; }
        push(n.codePointAt(0), i); i += 2; continue;
      }
      if(mode === 'css' && c === BS && /[0-9a-f]/i.test(src[i + 1])){ const m = /^[0-9a-f]{1,6}\s?/i.exec(src.slice(i + 1, i + 8)); push(parseInt(m[0], 16), i); i += 1 + m[0].length; continue; }
      if(c === '&' && mode !== 'css'){ const m = /^&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]+);/i.exec(src.slice(i, i + 12));
        if(m){ const t = m[1]; let cp = null; if(t[0] === '#') cp = (t[1] === 'x' || t[1] === 'X') ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10); else if(NAMED[t]) cp = NAMED[t];
          if(cp != null){ push(cp, i); i += m[0].length; continue; } } }
      const cp = src.codePointAt(i); push(cp, i); i += cp > 0xFFFF ? 2 : 1;
    }
    return out;
  }
  const modeOf = t => (t.type === 'css' ? 'css' : t.type === 'html' ? 'html' : 'js');
  const txtCache = new Map();
  const tokText = ti => { if(!txtCache.has(ti)){ const t = toks[ti]; txtCache.set(ti, decode(t.a, t.b, modeOf(t)).map(x => String.fromCodePoint(x.cp)).join('')); } return txtCache.get(ti); };
  const hits = [];
  toks.forEach((t, ti) => {
    if(t.type === 'code') return;   // measure decodes code too; no pictograph lives in a code token (asserted by A0)
    const cps = decode(t.a, t.b, modeOf(t));
    for(let k = 0; k < cps.length; k++){
      const { cp, off } = cps[k]; if(cp === 0xFE0F || cp === 0x200D) continue;
      if(k > 0 && cps[k - 1].cp === 0x200D) continue;
      const kl = klass(cp, cps[k + 1] && cps[k + 1].cp); if(kl !== 'A' && kl !== 'A2') continue;
      const all = cps.map(x => String.fromCodePoint(x.cp)).join(''), pos = cps.slice(0, k).map(x => String.fromCodePoint(x.cp)).join('').length;
      hits.push({ cls:kl, seq:String.fromCodePoint(cp), cp:'U+' + cp.toString(16).toUpperCase(), off, ti, line:lineOf(off), tok:t.type,
        ctx:all.slice(Math.max(0, pos - 45), pos + 35).replace(/\s+/g, ' ') });
    }
  });
  let codeHits = 0;
  toks.forEach(t => { if(t.type !== 'code') return; for(const x of decode(t.a, t.b, 'js')){ const kl = klass(x.cp, null); if(kl === 'A' || kl === 'A2') codeHits++; } });
  let stripped = '', last = 0; comments.slice().sort((p, q) => p[0] - q[0]).forEach(([a, b]) => { stripped += src.slice(last, a) + src.slice(a, b).replace(/[^\n]/g, ' '); last = b; });
  stripped += src.slice(last);
  const tbl = name => { const m = new RegExp('const ' + name + '=(' + BS + '{.*?' + BS + '});').exec(src); try { return m ? JSON.parse(m[1]) : null; } catch(e){ return null; } };
  return { src, toks, hits, lineOf, stripped, tokText, codeHits, PATHS:tbl('ASY_ICON_PATHS'), EMAP:tbl('ASY_EMOJI') };
}
function tokIdxFrom(S, off){ let lo = 0, hi = S.toks.length; while(lo < hi){ const m = (lo + hi) >> 1; if(S.toks[m].b <= off) lo = m + 1; else hi = m; } return lo; }
// First [ or { in a CODE token at/after off; bracket-matched over code tokens only (literals are atomic).
function extentAt(S, off){
  let depth = 0, open = -1;
  for(let i = tokIdxFrom(S, off); i < S.toks.length; i++){ const t = S.toks[i]; if(t.type !== 'code') continue;
    for(let j = Math.max(t.a, off); j < t.b; j++){ const c = S.src[j];
      if(open < 0){ if(c === '[' || c === '{'){ open = j; depth = 1; } continue; }
      if(c === '[' || c === '{' || c === '(') depth++;
      else if(c === ']' || c === '}' || c === ')'){ depth--; if(depth === 0) return [open, j + 1]; } } }
  return null;
}
const within = (ext, off) => !!ext && off >= ext[0] && off < ext[1];
const prevCode = (S, ti) => (ti > 0 && S.toks[ti - 1].type === 'code') ? S.src.slice(S.toks[ti - 1].a, S.toks[ti - 1].b) : '';
const nextCode = (S, ti) => (ti + 1 < S.toks.length && S.toks[ti + 1].type === 'code') ? S.src.slice(S.toks[ti + 1].a, S.toks[ti + 1].b) : '';
const mapsToSvg = (S, txt) => { const k = String(txt).split(CP(0xFE0F)).join(''); return !!(S.EMAP && S.PATHS && S.EMAP[k] && S.PATHS[S.EMAP[k]]); };
function uniq(S, needle, errs, label){ const c = cnt(S.stripped, needle); if(c !== 1){ errs.push(label + ': anchor ' + JSON.stringify(needle) + ' found ' + c + 'x'); return -1; } return S.stripped.indexOf(needle); }
// String tokens inside the FIRST argument of every asyIcon( call.
function asyArgTokens(S){
  const set = new Set();
  S.toks.forEach((t, ti) => { if(t.type !== 'code') return; const txt = S.src.slice(t.a, t.b); const re = /\basyIcon\s*\(/g; let m;
    while((m = re.exec(txt))){ if(/function\s+$/.test(txt.slice(0, m.index))) continue;
      let depth = 0, done = false, start = t.a + m.index + m[0].length;
      for(let k = ti; k < S.toks.length && !done; k++){ const u = S.toks[k];
        if(u.type !== 'code'){ if(k !== ti) set.add(k); continue; }
        for(let j = (k === ti ? start : u.a); j < u.b; j++){ const c = S.src[j];
          if(c === '(' || c === '[' || c === '{') depth++;
          else if(c === ')' || c === ']' || c === '}'){ if(depth === 0){ done = true; break; } depth--; }
          else if(c === ',' && depth === 0){ done = true; break; } } } } });
  return set;
}
// (c2) hand-listed routed literals: [name, declaration anchor (the literal is the first bracket after it), field form, consumer chain]
const ROUTES = [
  ['LIFTING_OPTIONS (support_prevention etc.)', 'const LIFTING_OPTIONS =', 'icon', ["const opts = LIFTING_OPTIONS[isEvent ? 'event' : 'body'];", 'asyIcon(o.icon,28)'], true],
  ['wizard primary path', 'This shapes everything! Program length, lifting focus, and cardio structure.', 'icon', ['asyIcon(p.icon,30)']],
  ['wizard experience', 'Training experience</div>', 'icon', ['<div style="flex-shrink:0">${asyIcon(e.icon,26)}</div>']],
  ['wizard age', 'Age range</div>', 'icon', ['asyIcon(a.icon,24)']],
  ['wizard equipment', 'The program only prescribes exercises you can actually do.', 'icon', ['<div class="cardio-type-icon">${asyIcon(e.icon,26)}</div>']],
  ['sportIcon map', 'const sportIcon =', 'map', ["asyIcon(sportIcon[sport] || '"]],
  ['sportIcons map', 'const sportIcons =', 'map', ['asyIcon(sportIcons[t],24)']],
  ['icons map', 'const icons=', 'map', ['asyIcon(icons[t],22)']],
];
const MECHS = ['a1 POP_POOLS.workout/.streak/.season', 'a2 POP_CFG celebration icons', 'a3 POP_DISMISS', 'a4 streak kicker', 'a5 confetti particle',
  'a6 popIcon HTML default', 'b ASY_EMOJI keys', 'c1 asyIcon argument (renders SVG)', 'c2 routed icon data (renders SVG)'];
function classify(S){
  const errs = [], allow = {}; MECHS.forEach(m => allow[m] = 0);
  const pOff = uniq(S, 'const POP_POOLS=', errs, 'a1'), pools = pOff < 0 ? null : extentAt(S, pOff);
  const tierExt = {};
  ['workout', 'reminder', 'streak', 'season'].forEach(tier => { if(!pools) return;
    const re = new RegExp('(^|[^A-Za-z0-9_$])' + tier + BS + 's*:' + BS + 's*' + BS + '[', 'g'); const seg = S.stripped.slice(pools[0], pools[1]); const ms = [...seg.matchAll(re)];
    if(ms.length !== 1){ errs.push('a1: POP_POOLS.' + tier + ' array found ' + ms.length + 'x'); return; }
    tierExt[tier] = extentAt(S, pools[0] + ms[0].index + ms[0][1].length); });
  const cOff = uniq(S, 'const POP_CFG=', errs, 'a2'), cfgExt = cOff < 0 ? null : extentAt(S, cOff);
  const dOff = uniq(S, 'const POP_DISMISS=', errs, 'a3'), disExt = dOff < 0 ? null : extentAt(S, dOff);
  const fOff = uniq(S, 'function popConfetti(count)', errs, 'a5'), confExt = fOff < 0 ? null : extentAt(S, fOff);
  const eOff = uniq(S, 'const ASY_EMOJI=', errs, 'b'), emExt = eOff < 0 ? null : extentAt(S, eOff);
  const ICON_HTML = '<span class="pop-icon" id="popIcon">';
  if(cnt(S.stripped, ICON_HTML) !== 1) errs.push('a6: popIcon span found ' + cnt(S.stripped, ICON_HTML) + 'x');
  const argSet = asyArgTokens(S);
  const routes = ROUTES.map(([name, decl, form, cons, far]) => { const o = uniq(S, decl, errs, 'c2 ' + name); if(o < 0) return null;
    const ext = extentAt(S, o + decl.length); if(!ext){ errs.push('c2 ' + name + ': no literal after the anchor'); return null; }
    let at = ext[1];
    for(let q = 0; q < cons.length; q++){ const co = uniq(S, cons[q], errs, 'c2 ' + name + ' consumer'); if(co < 0) return null;
      if(co < at || (!(far && q === 0) && co - at > 4000)){ errs.push('c2 ' + name + ': consumer ' + JSON.stringify(cons[q]) + ' not within 4000 chars after the literal/previous link'); return null; }
      at = co; }
    return { name, ext, form, n:0 }; });
  const tierCfg = { workout:0, streak:0, season:0 };
  const offenders = [];
  for(const h of S.hits){
    const t = S.toks[h.ti], txt = S.tokText(h.ti), pc = prevCode(S, h.ti);
    let m = null;
    if(t.type === 'str' && ['workout', 'streak', 'season'].some(k => within(tierExt[k], h.off))) m = MECHS[0];
    else if(t.type === 'str' && within(cfgExt, h.off) && /(^|[^A-Za-z0-9_$])(workout|streak|season)\s*:\s*\{\s*icon\s*:\s*$/.test(pc)){ m = MECHS[1]; tierCfg[/(workout|streak|season)\s*:\s*\{\s*icon\s*:\s*$/.exec(pc)[1]]++; }
    else if(t.type === 'str' && within(disExt, h.off)) m = MECHS[2];
    else if(t.type === 'str' && /kicker\s*:\s*streak\s*\+\s*$/.test(pc) && txt === '-DAY STREAK ' + CP(0x1F525)) m = MECHS[3];
    else if(t.type === 'str' && within(confExt, h.off) && /(^|[^A-Za-z0-9_$.])p\.textContent\s*=\s*$/.test(pc) && txt === CP(0x1F3C6)) m = MECHS[4];
    else if(t.type === 'html' && S.src.slice(h.off - ICON_HTML.length, h.off) === ICON_HTML && h.seq === CP(0x1F389)) m = MECHS[5];
    else if(t.type === 'str' && within(emExt, h.off) && /^\s*:/.test(nextCode(S, h.ti))) m = MECHS[6];
    else if(argSet.has(h.ti) && bare(txt) && mapsToSvg(S, txt)) m = MECHS[7];
    else { const r = routes.find(r => r && within(r.ext, h.off));
      if(r && t.type === 'str' && bare(txt) && mapsToSvg(S, txt) &&
         (r.form === 'icon' ? /(^|[^A-Za-z0-9_$])icon\s*:\s*$/.test(pc) : /(^|[^A-Za-z0-9_$])(run|bike|swim)\s*:\s*$/.test(pc))){ m = MECHS[8]; r.n++; } }
    if(m) allow[m]++; else offenders.push(h);
  }
  Object.keys(tierCfg).forEach(k => { if(tierCfg[k] !== 1) errs.push('a2: POP_CFG.' + k + ' icon allowed ' + tierCfg[k] + 'x (want 1)'); });
  if(allow[MECHS[3]] !== 1) errs.push('a4: streak kicker allowed ' + allow[MECHS[3]] + 'x (want 1)');
  if(allow[MECHS[4]] !== 1) errs.push('a5: confetti particle allowed ' + allow[MECHS[4]] + 'x (want 1)');
  if(allow[MECHS[5]] !== 1) errs.push('a6: popIcon default allowed ' + allow[MECHS[5]] + 'x (want 1)');
  MECHS.forEach(k => { if(!allow[k]) errs.push('DEAD mechanism ' + k + ' allowed 0 hits'); });
  routes.forEach(r => { if(r && !r.n) errs.push('DEAD route ' + r.name + ' allowed 0 hits'); });
  return { offenders, allow, errs, pass: offenders.length === 0 && errs.length === 0, tierExt, routes };
}

// ---------- hand tables (typed from the ruling) ----------
const T = (s, ...cps) => s + (cps.length ? ' ' + CP(...cps) : '');
// [pool, index, After (s2), Before (s2; null = s5 strip: V219 is After + ' ' + emoji tail)]
const EDITED = [
  ['workout', 0,  T('Congrats... you actually showed up. Just, you know, faster next time.', 0x1F389),
                  T('Congrats... you actually showed up. Just, you know ' + MD + ' faster next time.', 0x1F389)],
  ['workout', 2,  T('Look at you. Vertical, sweaty, and useful. Goddamn miracle.', 0x1FAE1),
                  T('Look at you ' + MD + ' vertical, sweaty, and useful. Goddamn miracle.', 0x1FAE1)],
  ['workout', 7,  T('Sweat now or be wheezing up eight flights of stairs later.', 0x1F6B6, 0x1F624),
                  T('Sweat now or be wheezing on the way up to your 8-story walk-up.', 0x1F6B6, 0x1F624)],
  ['workout', 18, T("Quit looking for a medal. It's under your tetas, find it later.", 0x1F947),
                  T("Quit looking for a medal " + MD + " it's under your tetas, find it later.", 0x1F947)],
  ['workout', 25, T('You did the whole thing. Looked dead ugly on that last set, but you finished.', 0x1F480),
                  T('You did the whole thing ' + MD + ' looked dead ugly on that last set, but you finished.', 0x1F480)],
  ['workout', 26, T('Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay, "workout complete."', 0x1F3A7),
                  T('Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay ' + MD + ' "workout complete."', 0x1F3A7)],
  ['reminder', 0, 'Yo, you ghosted a session. Mark it or own the skip.', null],
  ['reminder', 1, 'Left a day hanging unmarked. Did you train or nah?', null],
  ['reminder', 2, 'Unfinished business sitting on your calendar. Settle up.', null],
  ['reminder', 3, "That day didn't log itself, champ. Complete it or call it.", null],
  ['reminder', 4, 'You disappeared on a workout. Your record, your call. Fix it.',
                  T('You disappeared on a workout. Your record, your call ' + MD + ' fix it.', 0x1F4CB)],
  ['season', 3,   T('You saw it through. Rare as fuck. Most quit at week two like little bitches.', 0x1F414),
                  T('You saw it through. Rare as fuck ' + MD + ' most quit at week two like little bitches.', 0x1F414)],
  ['season', 7,   T('You outlasted every weak ass excuse your brain coughed up. Respect, animal.', 0x1F9E0, 0x274C),
                  T('You outlasted every weak-ass excuse your brain coughed up. Respect, animal.', 0x1F9E0, 0x274C)],
];
const S2_ROWS = EDITED.filter(e => e[3] !== null);   // the nine s2 strings (reminder[4] carries no emoji after s5)
const GE7 = 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.';
const OLD_GONE = ['you know ' + MD + ' faster', 'Look at you ' + MD, '8-story walk-up', 'medal ' + MD, 'whole thing ' + MD, 'But okay ' + MD,
  'your call ' + MD, 'Rare as fuck ' + MD, 'weak-ass', 'ease back in ' + MD, MD + ' edit if you know better'];
const COUNTS = { workout:27, reminder:5, streak:5, season:9 };
const INJURY = [['Good. One week to prove it.', 'shield'], ['Good. Two weeks to full send.', 'shield'], ['Good sign.', 'shield'], ['Two weeks and trending worse.', 'warning']];

// ---------- rows ----------
const ROWS = [
  ['A0', 'scanner sane: tokenizer ran, >10,000 literal tokens, ASY_ICON_PATHS and ASY_EMOJI parsed, no pictograph in a code token'],
  ['A1', 's6: zero class A/A2 pictographs in athlete-facing chrome outside the allowlist (literal glyph or backslash-u escape)'],
  ['A2', 's6: every allowlist anchor resolves exactly once and every mechanism allows at least one hit (no dead entry)'],
  ['B1', 's2 workout[0] After text exactly once'], ['B2', 's2 workout[2] After text exactly once'], ['B3', 's2 workout[7] After text exactly once'],
  ['B4', 's2 workout[18] After text exactly once'], ['B5', 's2 workout[25] After text exactly once'], ['B6', 's2 workout[26] After text exactly once'],
  ['B7', 's2+s5 reminder[4] After text exactly once, no emoji'], ['B8', 's2 season[3] After text exactly once'], ['B9', 's2 season[7] After text exactly once'],
  ['B10', 's3 row 1: the >=7 re-entry message After text exactly once'],
  ['B11', 's2/s3/s4 Before texts gone from the comment-stripped source (raw and escape-decoded)'],
  ['B12', 's3 row 2 (D175 interaction): the short-gap string "This one got away from you" is gone'],
  ['B13', 's4: wizard seed caption reads Estimated from <q>X<q>. Edit if you know better. with no em-dash'],
  ['C0', 'V219 artifact (git show ' + BASE_REF + ':index.html) readable and stamped 219'],
  ['C1', 'POP_POOLS tiers workout/reminder/streak/season with 27/5/5/9 entries, on V219 and on the candidate'],
  ['C2', 'every unedited POP_POOLS entry reads exactly as on V219 (order unchanged; ia_pop_idx_ stores indices)'],
  ['C3', 'the 13 edited POP_POOLS entries read the hand table After text, and V219 read the Before text'],
  ['C4', 'POP_DISMISS: 7 labels, order and text unchanged from V219 (emoji kept)'],
  ['C5', 's5: the reminder pool holds no codepoint above U+007F'],
  ['D1', "s5: POP_CFG.reminder.icon === 'notebook', an ASY_ICON_PATHS name"],
  ['D2a', "s5: injury BACK IN 'Good. One week to prove it.' icon 'shield'"], ['D2b', "s5: injury BACK IN 'Good. Two weeks to full send.' icon 'shield'"],
  ['D2c', "s5: injury CHECK IN 'Good sign.' icon 'shield'"], ['D2d', "s5: injury CHECK IN 'Two weeks and trending worse.' icon 'warning'"],
  ['D3a', "s5: popFire('reminder') writes asyIcon('notebook',52) SVG into popIcon via innerHTML, no text write"],
  ['D3b', "s5: popFire with icon 'shield' and icon 'warning' writes SVG into popIcon via innerHTML"],
  ['D3c', 's1: popFire workout/streak/season write the party popper/fire/trophy as popIcon TEXT; no emoji reaches asyIcon'],
  ['D4a', "s4: wizard seed caption renders asyIcon('chart') SVG where the chart emoji was"],
  ['D4b', "s4: wizard seed header renders asyIcon('chart') SVG where the chart emoji was"],
  ['D4c', "s4: day-card log nudge renders asyIcon('notebook') SVG where the clipboard emoji was"],
  ['D4d', "s4: archived program chip renders asyIcon('history') SVG where the file-cabinet emoji was"],
  ['E1', 'allowlist self-check: an extra emoji inside POP_POOLS.season must leave row A PASSING'],
  ['E2', 'allowlist self-check: the clipboard escape re-inserted in the log nudge must make row A FAIL on that line'],
  ['E3', 'allowlist self-check: an emoji inside POP_POOLS.reminder must make row A FAIL (s5 went to the recommendation)'],
];
const DESC = {}; ROWS.forEach(([id, d]) => DESC[id] = d);
let pass = 0, fail = 0; const seen = new Set();
function ok(id, c, got){ seen.add(id); const l = id + ' ' + (DESC[id] || '');
  if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (got === undefined ? '' : ' (got ' + got + ')')); } }
function family(ids, fn){ try { fn(); } catch(e){ ids.filter(i => !seen.has(i)).forEach(i => ok(i, false, 'CRASH ' + String((e && e.message) || e).slice(0, 200))); } }
const popText = e => (e && typeof e === 'object') ? e.t : e;
function literalAt(S, needle){ const o = S.stripped.indexOf(needle); if(o < 0 || cnt(S.stripped, needle) !== 1) return null; const ext = extentAt(S, o + needle.length);
  return ext ? JSON.parse(JSON.stringify(vm.runInNewContext('(' + S.src.slice(ext[0], ext[1]) + ')', {}))) : null; }
function lineOfNeedle(S, needle){ const c = cnt(S.stripped, needle); if(c !== 1) return { err:'anchor ' + JSON.stringify(needle) + ' found ' + c + 'x' };
  const o = S.stripped.indexOf(needle), a = S.stripped.lastIndexOf('\n', o) + 1, b = S.stripped.indexOf('\n', o); return { line:S.stripped.slice(a, b < 0 ? undefined : b) }; }

function main(){
  let IA; try { IA = load(ART); } catch(e){ fail++; console.log('FAIL BOOT harness load of ' + ART + ': ' + ((e && e.message) || e)); return; }
  const VER = +IA.version;
  console.log('g220_d174_emoji: candidate ' + ART + ' ia-version ' + VER + ' era ' + (VER >= 220 ? 'D174 (>=220): every row runs' : 'REFUSED (<220)'));
  if(!(VER >= 220)){ console.log('REFUSED: ia-version ' + VER + ' predates D174 P-EMOJI (V220). No row may pass on it.');
    ROWS.forEach(([id, d]) => { fail++; seen.add(id); console.log('FAIL ' + id + ' ' + d + ' REFUSED: ia-version ' + VER + ' predates D174 (V220)'); }); return; }
  const src = IA.html; let S, A;

  family(['A0', 'A1', 'A2'], () => {
    S = scan(src); A = classify(S);
    const lit = S.toks.filter(t => t.type !== 'code').length;
    ok('A0', lit > 10000 && !!S.PATHS && !!S.EMAP && Object.keys(S.PATHS).length > 20 && S.codeHits === 0, 'literals ' + lit + ', paths ' + (S.PATHS ? Object.keys(S.PATHS).length : '-') + ', code-token pictographs ' + S.codeHits);
    console.log('   A/A2 hits ' + S.hits.length + '; allowed by mechanism ' + JSON.stringify(A.allow) + '; routes ' + A.routes.map(r => r ? r.name + ':' + r.n : 'DEAD').join(', '));
    A.offenders.slice(0, 12).forEach(h => console.log('   offender L' + h.line + ' ' + h.seq + ' ' + h.cp + ' ' + h.cls + ' ' + h.tok + ' | ' + h.ctx));
    ok('A1', A.offenders.length === 0, A.offenders.length + ' offender(s): ' + A.offenders.map(h => 'L' + h.line + ' ' + h.cp).join(' '));
    ok('A2', A.errs.length === 0, A.errs.join(' | '));
  });

  family(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13'], () => {
    if(!S) S = scan(src);
    const strs = []; S.toks.forEach((t, ti) => { if(t.type === 'str') strs.push(S.tokText(ti)); });
    const nTok = s => strs.filter(x => x === s).length;
    const ids = { 'workout0':'B1', 'workout2':'B2', 'workout7':'B3', 'workout18':'B4', 'workout25':'B5', 'workout26':'B6', 'reminder4':'B7', 'season3':'B8', 'season7':'B9' };
    S2_ROWS.forEach(([pool, i, after]) => { const n = nTok(after); ok(ids[pool + i], n === 1 && (pool !== 'reminder' || pictos(after).length === 0), n + 'x ' + JSON.stringify(after)); });
    ok('B10', nTok(GE7) === 1, nTok(GE7) + 'x');
    const dec = decodeEsc(S.stripped), left = OLD_GONE.filter(o => cnt(S.stripped, o) + cnt(dec, o) > 0);
    ok('B11', left.length === 0, left.map(o => JSON.stringify(o)).join(', '));
    const g = cnt(S.stripped, 'This one got away from you') + cnt(dec, 'This one got away from you');
    ok('B12', g === 0, g + 'x');
    const L = lineOfNeedle(S, 'Estimated from ');
    if(L.err) ok('B13', false, L.err);
    else { const a = L.line.indexOf('`'), b = L.line.lastIndexOf('`'), tpl = a >= 0 && b > a ? L.line.slice(a, b + 1) : '', d = decodeEsc(tpl);
      ok('B13', cnt(d, 'Estimated from ' + LQ + '${s.progName}' + RQ + '. Edit if you know better.') === 1 && cnt(d, MD) === 0 && cnt(tpl, BS + 'u2014') === 0, JSON.stringify(d.slice(0, 200))); }
  });

  family(['C0', 'C1', 'C2', 'C3', 'C4', 'C5'], () => {
    if(!S) S = scan(src);
    let base = null, why = '';
    try { base = cp.execFileSync('git', ['-C', ROOT, 'show', BASE_REF + ':index.html'], { maxBuffer:64 << 20, stdio:['ignore', 'pipe', 'pipe'] }).toString('utf8'); } catch(e){ why = String((e && e.message) || e).slice(0, 160); }
    const bver = base ? (/<meta name="ia-version" content="(\d+)"/.exec(base) || [])[1] : null;
    ok('C0', bver === '219', base ? 'ia-version ' + bver : why);
    const B = bver === '219' ? scan(base) : null;
    const tp = literalAt(S, 'const POP_POOLS='), bp = B ? literalAt(B, 'const POP_POOLS=') : null;
    const tiers = ['workout', 'reminder', 'streak', 'season'];
    const shape = p => p ? Object.keys(p).join(',') + ' ' + Object.keys(p).map(k => (p[k] || []).length).join('/') : 'null';
    const want = tiers.join(',') + ' ' + tiers.map(k => COUNTS[k]).join('/');
    ok('C1', shape(tp) === want && shape(bp) === want, 'candidate ' + shape(tp) + ' | V219 ' + shape(bp));
    const edited = new Set(EDITED.map(e => e[0] + e[1]));
    let n = 0; const diff = [];
    if(tp && bp) tiers.forEach(k => (bp[k] || []).forEach((e, i) => { if(edited.has(k + i)) return; n++; if(!tp[k] || popText(tp[k][i]) !== popText(e)) diff.push(k + '[' + i + ']'); }));
    ok('C2', !!(tp && bp) && n === 33 && diff.length === 0, 'compared ' + n + ', differ ' + diff.join(' '));
    const bad = [];
    if(tp && bp) EDITED.forEach(([k, i, after, before]) => {
      if(popText((tp[k] || [])[i]) !== after) bad.push('candidate ' + k + '[' + i + '] ' + JSON.stringify(popText((tp[k] || [])[i])));
      const b0 = popText((bp[k] || [])[i]);
      const bOk = before !== null ? b0 === before : (typeof b0 === 'string' && b0.indexOf(after + ' ') === 0 && b0.length > after.length + 1 && [...b0.slice(after.length + 1)].every(ch => ch.codePointAt(0) > 0x7F));
      if(!bOk) bad.push('V219 ' + k + '[' + i + '] ' + JSON.stringify(b0)); });
    ok('C3', !!(tp && bp) && bad.length === 0, bad.slice(0, 3).join(' | '));
    const td = literalAt(S, 'const POP_DISMISS='), bd = B ? literalAt(B, 'const POP_DISMISS=') : null;
    ok('C4', !!(td && bd) && td.length === 7 && JSON.stringify(td) === JSON.stringify(bd), 'candidate ' + JSON.stringify(td) + ' | V219 ' + (bd ? bd.length : '-'));
    const hi = tp ? (tp.reminder || []).map(popText).filter(s => [...String(s)].some(ch => ch.codePointAt(0) > 0x7F)) : ['(no pool)'];
    ok('C5', !!tp && tp.reminder.length === 5 && hi.length === 0, hi.map(s => JSON.stringify(s)).join(' '));
  });

  family(['D1', 'D2a', 'D2b', 'D2c', 'D2d', 'D3a', 'D3b', 'D3c'], () => {
    if(!S) S = scan(src);
    let ri = null; try { ri = IA.eval('POP_CFG.reminder.icon'); } catch(e){ ri = 'ERR ' + e.message; }
    ok('D1', ri === 'notebook' && !!S.PATHS && Object.prototype.hasOwnProperty.call(S.PATHS, 'notebook'), JSON.stringify(ri));
    INJURY.forEach(([msg, want], q) => {
      const re = new RegExp("popFire" + BS + "('workout'," + BS + "{icon:'([^']*)',kicker:'(BACK IN|CHECK IN)',msg:'" + reEsc(msg) + "'", 'g');
      const ms = [...S.stripped.matchAll(re)];
      ok('D2' + 'abcd'[q], ms.length === 1 && ms[0][1] === want, ms.length + ' call(s), icon ' + (ms[0] ? JSON.stringify(ms[0][1]) : '-')); });
    // DOM stub: popIcon records every innerHTML / textContent write; asyIcon is spied, not replaced.
    let els = {};
    const mk = id => { const w = []; let html = '', text = '';
      const e = { id, className:'', style:{}, offsetWidth:0, writes:w, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
        appendChild(c){ return c; }, removeChild(c){ return c; }, remove(){}, setAttribute(){}, addEventListener(){} };
      Object.defineProperty(e, 'innerHTML', { get(){ return html; }, set(v){ html = String(v); w.push(['html', html]); } });
      Object.defineProperty(e, 'textContent', { get(){ return text; }, set(v){ text = String(v); w.push(['text', text]); } });
      return e; };
    IA.window.document.getElementById = id => (els[id] = els[id] || mk(id));
    IA.eval('(function(){ var real = asyIcon; globalThis.__g220calls = []; asyIcon = function(k, s){ globalThis.__g220calls.push([String(k), s]); return real(k, s); }; })()');
    const popFire = IA.eval('popFire');
    const fire = (tier, opts) => { els = {}; IA.eval('__g220calls.length = 0'); popFire(tier, opts);
      return { w:(els.popIcon ? els.popIcon.writes : []).slice(), calls:JSON.parse(JSON.stringify(IA.eval('__g220calls'))) }; };
    const svgOnly = r => r.w.length === 1 && r.w[0][0] === 'html' && r.w[0][1].indexOf('<svg') === 0;
    const r1 = fire('reminder', { msg:'m', sub:'s', dismiss:'ok' });
    ok('D3a', svgOnly(r1) && r1.calls.some(c => c[0] === 'notebook' && c[1] === 52), JSON.stringify(r1.w).slice(0, 90) + ' calls ' + JSON.stringify(r1.calls));
    const r2 = fire('workout', { icon:'shield', kicker:'BACK IN', msg:'m', dismiss:'ok' }), r3 = fire('workout', { icon:'warning', kicker:'CHECK IN', msg:'m', dismiss:'ok' });
    ok('D3b', svgOnly(r2) && svgOnly(r3), JSON.stringify([r2.w, r3.w]).slice(0, 160));
    const cel = [['workout', CP(0x1F389)], ['streak', CP(0x1F525)], ['season', CP(0x1F3C6)]].map(([t, e]) => { const r = fire(t, { msg:'m', dismiss:'ok' });
      return { t, good:r.w.length === 1 && r.w[0][0] === 'text' && r.w[0][1] === e && !r.calls.some(c => pictos(c[0]).length), r }; });
    ok('D3c', cel.every(c => c.good), cel.filter(c => !c.good).map(c => c.t + ' writes ' + JSON.stringify(c.r.w).slice(0, 80) + ' calls ' + JSON.stringify(c.r.calls)).join(' | '));
  });

  family(['D4a', 'D4b', 'D4c', 'D4d'], () => {
    if(!S) S = scan(src);
    const clean = r => pictos(r).length === 0;
    const Q = LQ + 'Old Program' + RQ;
    const cases = [
      ['D4a', 'Estimated from ', "asyIcon('chart',", L => { const a = L.indexOf('`'), b = L.lastIndexOf('`'); return '(function(s){ return ' + L.slice(a, b + 1) + '; })({progName:"Old Program"})'; },
        r => { const k = r.indexOf('</svg> Estimated from ' + Q + '. Edit if you know better.</div>'); return k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
      ['D4b', 'Seed from ' + BS + 'u201C${s.progName}', "asyIcon('chart',", L => '(function(s){ return `' + L.trim() + '`; })({progName:"Old Program"})',
        r => { const k = r.indexOf('</svg> Seed from ' + Q + '?</div>'); return k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
      ['D4c', 'You logged this one but never marked it.', "asyIcon('notebook',", L => { const a = L.indexOf('html+='), b = L.lastIndexOf(';'); return '(function(dayKey, escTitle){ return (' + L.slice(a + 6, b) + '); })("mon", "Leg day")'; },
        r => { const k = r.indexOf('</svg> You logged this one but never marked it.'); return r.indexOf('<div class="log-nudge">') === 0 && k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
      ['D4d', 'const label=(p.archived?', "asyIcon('history',", L => { const a = L.indexOf('const label='), b = L.lastIndexOf(';'); const ex = L.slice(a + 12, b);
          return 'JSON.stringify([(function(p){ return ' + ex + '; })({archived:true, name:"Old Program"}), (function(p){ return ' + ex + '; })({archived:false, name:"New"})])'; },
        r => { const v = JSON.parse(r); return /^<svg[\s\S]*<\/svg> Old Program$/.test(v[0]) && v[1] === 'New' && clean(v[0]); }],
    ];
    cases.forEach(([id, needle, name, mkExpr, good]) => {
      const L = lineOfNeedle(S, needle); if(L.err) return ok(id, false, L.err);
      let r; try { r = String(IA.eval(mkExpr(L.line))); } catch(e){ return ok(id, false, 'render threw ' + e.message); }
      ok(id, cnt(L.line, name) === 1 && good(r), 'source names ' + name + ' ' + cnt(L.line, name) + 'x; rendered ' + JSON.stringify(r.slice(0, 120))); });
  });

  family(['E1', 'E2', 'E3'], () => {
    if(!S) S = scan(src); if(!A) A = classify(S);
    const firstStr = ext => { if(!ext) return null; for(let i = tokIdxFrom(S, ext[0]); i < S.toks.length && S.toks[i].a < ext[1]; i++) if(S.toks[i].type === 'str') return S.toks[i]; return null; };
    const t1 = firstStr(A.tierExt.season);
    if(!t1) ok('E1', false, 'POP_POOLS.season has no string entry');
    else { const R = classify(scan(src.slice(0, t1.b) + ' ' + CP(0x1F984) + src.slice(t1.b)));
      ok('E1', R.pass && R.allow[MECHS[0]] === A.allow[MECHS[0]] + 1, 'offenders ' + R.offenders.length + ', errs ' + R.errs.length); }
    const NUDGE = "'<div class=\"log-nudge\"><span>'+asyIcon('notebook',14)+' You logged this one";
    if(cnt(src, NUDGE) !== 1) ok('E2', false, 'nudge anchor found ' + cnt(src, NUDGE) + 'x');
    else { const R = classify(scan(src.replace(NUDGE, "'<div class=\"log-nudge\"><span>" + BS + 'ud83d' + BS + "udccb You logged this one")));
      ok('E2', !R.pass && R.offenders.some(h => /You logged this one/.test(h.ctx) && h.seq === CP(0x1F4CB)), 'offenders ' + R.offenders.map(h => 'L' + h.line + ' ' + h.cp).join(' ')); }
    const t3 = firstStr(A.tierExt.reminder);
    if(!t3) ok('E3', false, 'POP_POOLS.reminder has no string entry');
    else { const R = classify(scan(src.slice(0, t3.b) + ' ' + CP(0x1F440) + src.slice(t3.b)));
      ok('E3', !R.pass && R.offenders.some(h => h.seq === CP(0x1F440)), 'offenders ' + R.offenders.map(h => 'L' + h.line + ' ' + h.cp).join(' ')); }
  });

  ROWS.forEach(([id]) => { if(!seen.has(id)) ok(id, false, 'row not evaluated'); });
}
try { main(); } catch(e){ fail++; console.log('FAIL CRASH ' + String((e && e.stack) || e).slice(0, 600)); }
console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
