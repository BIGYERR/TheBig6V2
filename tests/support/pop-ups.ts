// The emoji scanner for tests/integration/pop-ups.test.ts: where a pictograph may appear in the app's source, and
// where it may not (ruling D174: emoji stay on the celebration pop-ups; reminders, injury calls and the chrome use the
// asyIcon SVG icons).
//
// scan(src) tokenizes the whole index.html (HTML, CSS, and the inline script's strings, templates, regexes and code),
// decodes every literal (backslash-u escapes, surrogate pairs, backslash-u-brace, backslash-x, HTML entities, CSS
// escapes) and lists every class A / A2 pictograph by the Unicode property oracle (Emoji_Presentation,
// Extended_Pictographic). classify(S) sorts each hit into an allowance or an offender:
//   a1  inside POP_POOLS.workout, .streak or .season (never .reminder);
//   a2  the icon of POP_CFG.workout, .streak or .season (never .reminder);
//   a3  inside POP_DISMISS;
//   a4  the streak kicker "-DAY STREAK <fire>";
//   a5  the confetti particle <trophy> in popConfetti;
//   a6  the popIcon span's default <party popper>;
//   b   a key of ASY_EMOJI;
//   c1  a bare pictograph passed to asyIcon that maps to an SVG path (an unmapped one renders raw and is an offender);
//   c2  routed icon data: the icon: field, or the run/bike/swim value, of eight hand-listed literals whose consumer
//       passes it to asyIcon, with the same SVG condition.
// Every anchor must resolve exactly once and every allowance must allow at least one hit (a dead entry is an error).
// The logic is the one measure wrote for the D174 census (tests/measure/v220_emoji_chrome.js). This file is ASCII
// only: every non-ASCII glyph and every backslash-u escape text is built in code.
import { createRequire } from 'node:module';
import type * as VM from 'node:vm';

/** The same node:vm module object harness.js calls, so a hook placed on it reaches the harness. */
const vm: typeof VM = createRequire(import.meta.url)('node:vm');

/** A token of the scanned source: code, a string, a template part, a regex, CSS or HTML, as [a, b) offsets. */
export interface Tok {
  type: string;
  a: number;
  b: number;
}
/** One pictograph found in a literal. */
export interface Hit {
  cls: string;
  seq: string;
  cp: string;
  off: number;
  ti: number;
  line: number;
  tok: string;
  ctx: string;
}
/** What scan() returns. */
export interface Scan {
  src: string;
  toks: Tok[];
  hits: Hit[];
  lineOf(off: number): number;
  stripped: string;
  tokText(ti: number): string;
  codeHits: number;
  PATHS: Record<string, string> | null;
  EMAP: Record<string, string> | null;
}
/** A [start, end) span of the source. */
type Extent = [number, number];

const CP = (...a: number[]) => String.fromCodePoint(...a);
const BS = String.fromCharCode(92);
const MD = CP(0x2014), LQ = CP(0x201C), RQ = CP(0x201D);
const cnt = (h: string, n: string) => { if(!n) return 0; let c = 0, i = 0; while((i = h.indexOf(n, i)) >= 0){ c++; i += n.length; } return c; };
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, m => BS + m);
function decodeEsc(s: string){
  return s.replace(new RegExp(BS + BS + 'u' + BS + '{([0-9a-fA-F]+)' + BS + '}', 'g'), (m, h) => CP(parseInt(h, 16)))
          .replace(new RegExp(BS + BS + 'u([0-9a-fA-F]{4})', 'g'), (m, h) => String.fromCharCode(parseInt(h, 16)));
}

// ---------- class oracle (verbatim logic, measure v220_emoji_chrome.js klass) ----------
const reEP = /\p{Emoji_Presentation}/u, reXP = /\p{Extended_Pictographic}/u;
function klass(cp: number, nextCp: number | null | undefined){
  const ch = String.fromCodePoint(cp);
  if(cp === 0xD7 || cp === 0x2014) return 'C';
  if(reEP.test(ch)) return 'A';
  if(reXP.test(ch) && nextCp === 0xFE0F) return 'A';
  if(reXP.test(ch)) return 'A2';
  if((cp >= 0x2190 && cp <= 0x21FF) || (cp >= 0x2300 && cp <= 0x23FF) || (cp >= 0x25A0 && cp <= 0x25FF) || (cp >= 0x2600 && cp <= 0x27BF) ||
     (cp >= 0x2B00 && cp <= 0x2BFF) || cp === 0x2022 || cp === 0x2023 || (cp >= 0x1F000)) return 'B';
  return null;
}
function pictos(str: unknown){ const a = [...String(str)].map(c => c.codePointAt(0) as number), out: string[] = [];
  for(let k = 0; k < a.length; k++){ if(a[k] === 0xFE0F || a[k] === 0x200D) continue; const kl = klass(a[k], a[k + 1]); if(kl === 'A' || kl === 'A2') out.push(CP(a[k])); }
  return out; }
function bare(txt: unknown){ const a = [...String(txt)].map(c => c.codePointAt(0) as number); if(!a.length) return false; let n = 0;
  for(let k = 0; k < a.length; k++){ const c = a[k]; if(c === 0xFE0F || c === 0x200D || (c >= 0x1F3FB && c <= 0x1F3FF)) continue;
    const kl = klass(c, a[k + 1]); if(kl === 'A' || kl === 'A2') n++; else return false; }
  return n > 0; }

// ---------- scanner (measure's tokenizer + decoder, parameterised on the source) ----------
const NAMED: Record<string, number> = { amp:38, lt:60, gt:62, quot:34, apos:39, nbsp:0xA0, times:0xD7, mdash:0x2014, ndash:0x2013, rarr:0x2192, larr:0x2190,
  uarr:0x2191, darr:0x2193, harr:0x2194, bull:0x2022, middot:0xB7, hellip:0x2026, check:0x2713, cross:0x2717, star:0x2606, starf:0x2605,
  hearts:0x2665, deg:0xB0, frac12:0xBD, rsquo:0x2019, lsquo:0x2018, ldquo:0x201C, rdquo:0x201D, copy:0xA9, reg:0xAE, trade:0x2122,
  minus:0x2212, divide:0xF7, plusmn:0xB1, laquo:0xAB, raquo:0xBB, para:0xB6, sect:0xA7, dagger:0x2020, loz:0x25CA, spades:0x2660,
  clubs:0x2663, diams:0x2666 };
function scan(src: string): Scan {
  const lineStarts = [0]; for(let i = 0; i < src.length; i++) if(src[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (off: number) => { let lo = 0, hi = lineStarts.length - 1; while(lo < hi){ const m = (lo + hi + 1) >> 1; if(lineStarts[m] <= off) lo = m; else hi = m - 1; } return lo + 1; };
  const regions: { kind: string; a: number; b: number }[] = [];
  { const re = /<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi; let m, last = 0;
    while((m = re.exec(src))){ const inner = m.index + m[0].indexOf('>') + 1; const end = inner + m[3].length;
      regions.push({ kind:'html', a:last, b:inner }); regions.push({ kind:m[1].toLowerCase() === 'script' ? 'js' : 'css', a:inner, b:end }); last = end; }
    regions.push({ kind:'html', a:last, b:src.length }); }
  const toks: Tok[] = [], comments: Extent[] = [];
  function tokJS(a: number, b: number){
    let i = a, codeStart = a; const tplStack: number[] = []; let braceDepth = 0; let lastSig = '(';
    const kw = /(?:return|typeof|case|else|in|of|new|delete|void|throw|yield|await|do)$/;
    function flushCode(end: number){ if(end > codeStart) toks.push({ type:'code', a:codeStart, b:end }); }
    function readTpl(start: number): { end: number; open: boolean } { let j = start;
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
  function tokCSS(a: number, b: number){ let i = a; while(i < b){ const j = src.indexOf('/*', i); if(j < 0 || j >= b){ toks.push({ type:'css', a:i, b }); break; } toks.push({ type:'css', a:i, b:j }); const k = src.indexOf('*/', j + 2); comments.push([j, k + 2]); i = k + 2; } }
  function tokHTML(a: number, b: number){ let i = a; while(i < b){ const j = src.indexOf('<!--', i); if(j < 0 || j >= b){ toks.push({ type:'html', a:i, b }); break; } toks.push({ type:'html', a:i, b:j }); const k = src.indexOf('-->', j + 4); comments.push([j, k + 3]); i = k + 3; } }
  for(const r of regions){ if(r.kind === 'js') tokJS(r.a, r.b); else if(r.kind === 'css') tokCSS(r.a, r.b); else tokHTML(r.a, r.b); }
  function decode(a: number, b: number, mode: string){
    const out: { cp: number; off: number }[] = []; let i = a; const push = (cp: number, off: number) => out.push({ cp, off });
    while(i < b){
      const c = src[i];
      if(mode === 'js' && c === BS){
        const n = src[i + 1];
        if(n === 'u' && src[i + 2] === '{'){ const j = src.indexOf('}', i); push(parseInt(src.slice(i + 3, j), 16), i); i = j + 1; continue; }
        if(n === 'u'){ let cu = parseInt(src.slice(i + 2, i + 6), 16); let adv = 6;
          if(cu >= 0xD800 && cu <= 0xDBFF && src[i + 6] === BS && src[i + 7] === 'u'){ const lo = parseInt(src.slice(i + 8, i + 12), 16); if(lo >= 0xDC00 && lo <= 0xDFFF){ cu = 0x10000 + ((cu - 0xD800) << 10) + (lo - 0xDC00); adv = 12; } }
          push(cu, i); i += adv; continue; }
        if(n === 'x'){ push(parseInt(src.slice(i + 2, i + 4), 16), i); i += 4; continue; }
        push(n.codePointAt(0) as number, i); i += 2; continue;
      }
      if(mode === 'css' && c === BS && /[0-9a-f]/i.test(src[i + 1])){ const m = /^[0-9a-f]{1,6}\s?/i.exec(src.slice(i + 1, i + 8)) as RegExpExecArray; push(parseInt(m[0], 16), i); i += 1 + m[0].length; continue; }
      if(c === '&' && mode !== 'css'){ const m = /^&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]+);/i.exec(src.slice(i, i + 12));
        if(m){ const t = m[1]; let cp = null; if(t[0] === '#') cp = (t[1] === 'x' || t[1] === 'X') ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10); else if(NAMED[t]) cp = NAMED[t];
          if(cp != null){ push(cp, i); i += m[0].length; continue; } } }
      const cp = src.codePointAt(i) as number; push(cp, i); i += cp > 0xFFFF ? 2 : 1;
    }
    return out;
  }
  const modeOf = (t: Tok) => (t.type === 'css' ? 'css' : t.type === 'html' ? 'html' : 'js');
  const txtCache = new Map<number, string>();
  const tokText = (ti: number): string => { if(!txtCache.has(ti)){ const t = toks[ti]; txtCache.set(ti, decode(t.a, t.b, modeOf(t)).map(x => String.fromCodePoint(x.cp)).join('')); } return txtCache.get(ti) as string; };
  const hits: Hit[] = [];
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
  // A table's type annotation (a TypeScript file in @ia/core) strips to spaces between its name and the `=`.
  const tbl = (name: string) => { const m = new RegExp('const ' + name + BS + 's*=(' + BS + '{.*?' + BS + '});').exec(src); try { return m ? JSON.parse(m[1]) : null; } catch(e){ return null; } };
  return { src, toks, hits, lineOf, stripped, tokText, codeHits, PATHS:tbl('ASY_ICON_PATHS'), EMAP:tbl('ASY_EMOJI') };
}
function tokIdxFrom(S: Scan, off: number){ let lo = 0, hi = S.toks.length; while(lo < hi){ const m = (lo + hi) >> 1; if(S.toks[m].b <= off) lo = m + 1; else hi = m; } return lo; }
// First [ or { in a CODE token at/after off; bracket-matched over code tokens only (literals are atomic).
function extentAt(S: Scan, off: number): Extent | null {
  let depth = 0, open = -1;
  for(let i = tokIdxFrom(S, off); i < S.toks.length; i++){ const t = S.toks[i]; if(t.type !== 'code') continue;
    for(let j = Math.max(t.a, off); j < t.b; j++){ const c = S.src[j];
      if(open < 0){ if(c === '[' || c === '{'){ open = j; depth = 1; } continue; }
      if(c === '[' || c === '{' || c === '(') depth++;
      else if(c === ']' || c === '}' || c === ')'){ depth--; if(depth === 0) return [open, j + 1]; } } }
  return null;
}
const within = (ext: Extent | null | undefined, off: number) => !!ext && off >= ext[0] && off < ext[1];
const prevCode = (S: Scan, ti: number) => (ti > 0 && S.toks[ti - 1].type === 'code') ? S.src.slice(S.toks[ti - 1].a, S.toks[ti - 1].b) : '';
const nextCode = (S: Scan, ti: number) => (ti + 1 < S.toks.length && S.toks[ti + 1].type === 'code') ? S.src.slice(S.toks[ti + 1].a, S.toks[ti + 1].b) : '';
const mapsToSvg = (S: Scan, txt: unknown) => { const k = String(txt).split(CP(0xFE0F)).join(''); return !!(S.EMAP && S.PATHS && S.EMAP[k] && S.PATHS[S.EMAP[k]]); };
// An anchor `const NAME=` also finds `const NAME   =`: a type annotation in a TypeScript file strips to spaces there.
function uniq(S: Scan, needle: string, errs: string[], label: string){
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, BS + '$&').replace(/=$/, BS + 's*='), 'g');
  const at = [...S.stripped.matchAll(re)].map(m => m.index);
  if(at.length !== 1){ errs.push(label + ': anchor ' + JSON.stringify(needle) + ' found ' + at.length + 'x'); return -1; }
  return at[0]!;
}
// String tokens inside the FIRST argument of every asyIcon( call.
function asyArgTokens(S: Scan){
  const set = new Set<number>();
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
const ROUTES: [string, string, string, string[], boolean?][] = [
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
function classify(S: Scan){
  const errs: string[] = [], allow: Record<string, number> = {}; MECHS.forEach(m => allow[m] = 0);
  const pOff = uniq(S, 'const POP_POOLS=', errs, 'a1'), pools = pOff < 0 ? null : extentAt(S, pOff);
  const tierExt: Record<string, Extent | null> = {};
  ['workout', 'reminder', 'streak', 'season'].forEach(tier => { if(!pools) return;
    const re = new RegExp('(^|[^A-Za-z0-9_$])' + tier + BS + 's*:' + BS + 's*' + BS + '[', 'g'); const seg = S.stripped.slice(pools[0], pools[1]); const ms = [...seg.matchAll(re)];
    if(ms.length !== 1){ errs.push('a1: POP_POOLS.' + tier + ' array found ' + ms.length + 'x'); return; }
    tierExt[tier] = extentAt(S, pools[0] + (ms[0].index as number) + ms[0][1].length); });
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
  const tierCfg: Record<string, number> = { workout:0, streak:0, season:0 };
  const offenders: Hit[] = [];
  for(const h of S.hits){
    const t = S.toks[h.ti], txt = S.tokText(h.ti), pc = prevCode(S, h.ti);
    let m = null;
    if(t.type === 'str' && ['workout', 'streak', 'season'].some(k => within(tierExt[k], h.off))) m = MECHS[0];
    else if(t.type === 'str' && within(cfgExt, h.off) && /(^|[^A-Za-z0-9_$])(workout|streak|season)\s*:\s*\{\s*icon\s*:\s*$/.test(pc)){ m = MECHS[1]; tierCfg[(/(workout|streak|season)\s*:\s*\{\s*icon\s*:\s*$/.exec(pc) as RegExpExecArray)[1]]++; }
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
const popText = (e: any) => (e && typeof e === 'object') ? e.t : e;
function literalAt(S: Scan, needle: string){ const o = S.stripped.indexOf(needle); if(o < 0 || cnt(S.stripped, needle) !== 1) return null; const ext = extentAt(S, o + needle.length);
  return ext ? JSON.parse(JSON.stringify(vm.runInNewContext('(' + S.src.slice(ext[0], ext[1]) + ')', {}))) : null; }
/** The source line holding `needle`, or err when it is not there exactly once (line is read only when err is absent). */
function lineOfNeedle(S: Scan, needle: string): { err?: string; line: string } { const c = cnt(S.stripped, needle); if(c !== 1) return { err:'anchor ' + JSON.stringify(needle) + ' found ' + c + 'x' } as { err: string; line: string };
  const o = S.stripped.indexOf(needle), a = S.stripped.lastIndexOf('\n', o) + 1, b = S.stripped.indexOf('\n', o); return { line:S.stripped.slice(a, b < 0 ? undefined : b) }; }

export { CP, BS, MD, LQ, RQ, cnt, reEsc, decodeEsc, pictos, scan, classify, extentAt, tokIdxFrom, literalAt, lineOfNeedle, popText, MECHS };
