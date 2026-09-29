// v223_wctoday.js — measure pass (P-WCTODAY before-picture / Mode A proof).
// Question: is the Wildcard flame-W mark signal-on-signal on the today cell of the week strip?
// Instruments (independent of the suspect CSS):
//   1. RENDER: the real renderWeekView / openDetail / completeWildcard are called on a HAND fixture;
//      the stamped day is checked against hand calendar arithmetic, not wildcardDayFor.
//   2. CASCADE: a small CSS cascade resolver written here (specificity, source order, !important,
//      inline style, inheritance, var()) runs over the raw <style> text and the rendered HTML tree.
//      It does not ask any app function what colour anything is.
//   3. CONTRAST: WCAG 2.x relative-luminance ratio, from the resolved hex.
// Usage: node tests/measure/v223_wctoday.js [index.html]
const fs = require('fs'), path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const SRC = fs.readFileSync(FILE, 'utf8');
const IA = load(FILE);
let crashes = 0;

// ── CSS parse ────────────────────────────────────────────────────────────────
const cssText = [...SRC.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = []; let order = 0;
(function parse(txt, media) {
  let i = 0;
  while (i < txt.length) {
    const ob = txt.indexOf('{', i); if (ob < 0) break;
    const head = txt.slice(i, ob).split(';').pop().trim();   // drop brace-less at-rules (@import/@charset) that precede a block
    let depth = 1, j = ob + 1;
    while (j < txt.length && depth) { if (txt[j] === '{') depth++; else if (txt[j] === '}') depth--; j++; }
    const body = txt.slice(ob + 1, j - 1);
    if (head.startsWith('@media')) parse(body, head);
    else if (head.startsWith('@')) { /* keyframes, font-face: no colour cascade */ }
    else {
      const decls = [];
      body.split(';').forEach(d => { const k = d.indexOf(':'); if (k < 0) return; let v = d.slice(k + 1).trim(); const imp = /!important\s*$/.test(v); v = v.replace(/!important\s*$/, '').trim(); decls.push({ p: d.slice(0, k).trim().toLowerCase(), v, imp }); });
      head.split(',').map(s => s.trim()).filter(Boolean).forEach(sel => rules.push({ sel, decls, media, order: order++, line: null }));
    }
    i = j;
  }
})(cssText, null);
// source line of each selector (first occurrence of selector text followed by { or , in the file)
function lineOf(sel) { const idx = SRC.indexOf(sel); return idx < 0 ? '?' : SRC.slice(0, idx).split('\n').length; }
const rootVars = {};
rules.filter(r => r.sel === ':root' && !r.media).forEach(r => r.decls.forEach(d => { if (d.p.startsWith('--')) rootVars[d.p] = d.v; }));
const varRedefs = rules.filter(r => r.decls.some(d => d.p === '--signal' || d.p === '--on-signal')).map(r => (r.media || '-') + ' ' + r.sel);
function resolveVar(v, depth) { depth = depth || 0; if (depth > 5) return v; return v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (m, n, fb) => rootVars[n] !== undefined ? resolveVar(rootVars[n], depth + 1) : (fb || m)); }

// ── selector matching ────────────────────────────────────────────────────────
const skippedPseudo = new Set();
function parseCompound(c) {
  const o = { tag: null, ids: [], cls: [], attrs: [], pseudo: [] };
  const re = /([#.]?[\w-]+|\*|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?)/g; let m;
  while ((m = re.exec(c))) { const t = m[1];
    if (t === '*') continue; if (t[0] === '#') o.ids.push(t.slice(1)); else if (t[0] === '.') o.cls.push(t.slice(1));
    else if (t[0] === '[') o.attrs.push(t); else if (t[0] === ':') o.pseudo.push(t); else o.tag = t.toLowerCase(); }
  return o;
}
function specificity(sel) { let a = 0, b = 0, c = 0; sel.replace(/[>+~]/g, ' ').split(/\s+/).filter(Boolean).forEach(x => { const o = parseCompound(x); a += o.ids.length; b += o.cls.length + o.attrs.length + o.pseudo.filter(p => !p.startsWith('::')).length; c += (o.tag ? 1 : 0) + o.pseudo.filter(p => p.startsWith('::')).length; }); return [a, b, c]; }
function matchCompound(o, el, sel) {
  if (o.tag && o.tag !== el.tag) return false;
  if (o.ids.some(i => el.id !== i)) return false;
  if (o.cls.some(k => el.cls.indexOf(k) < 0)) return false;
  if (o.attrs.length) { for (const a of o.attrs) { const m = a.match(/^\[([\w-]+)(?:([~^$*|]?=)"?([^"\]]*)"?)?\]$/); if (!m) return false; const v = el.attrs[m[1]]; if (v === undefined) return false; if (m[2] === '=' && v !== m[3]) return false; if (m[2] && m[2] !== '=') return false; } }
  if (o.pseudo.length) { skippedPseudo.add(sel); return false; }  // :active/:hover etc. never hold at rest
  return true;
}
function matches(sel, el) {
  const parts = sel.replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
  function rec(pi, node) {
    const o = parseCompound(parts[pi]); if (!node || !matchCompound(o, node, sel)) return false;
    if (pi === 0) return true;
    const comb = parts[pi - 1];
    if (comb === '>') return pi - 2 >= 0 && rec(pi - 2, node.parent);
    let p = node.parent; while (p) { if (rec(pi - 1, p)) return true; p = p.parent; } return false;
  }
  return rec(parts.length - 1, el);
}
// ── HTML → tree ──────────────────────────────────────────────────────────────
const VOID = new Set(['br', 'img', 'input', 'meta', 'hr', 'path', 'circle', 'line', 'rect', 'polyline', 'polygon']);
function tree(html, ancestors) {
  const root = { tag: '#root', cls: [], attrs: {}, children: [], parent: null };
  let cur = root;
  ancestors.forEach(a => { const n = Object.assign({ children: [], parent: cur, attrs: {} }, a); cur.children.push(n); cur = n; });
  const re = /<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g; let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) { if (m[4].trim()) cur.children.push({ text: m[4].trim(), parent: cur }); continue; }
    const tag = m[1].toLowerCase(); if (m[0][1] === '/') { let p = cur; while (p && p.tag !== tag) p = p.parent; if (p) cur = p.parent; continue; }
    const attrs = {}; (m[2].match(/[\w:-]+="[^"]*"|[\w:-]+='[^']*'/g) || []).forEach(a => { const k = a.indexOf('='); attrs[a.slice(0, k)] = a.slice(k + 2, -1); });
    const n = { tag, attrs, id: attrs.id, cls: (attrs.class || '').split(/\s+/).filter(Boolean), children: [], parent: cur };
    cur.children.push(n); if (!VOID.has(tag) && !m[3]) cur = n;
  }
  return root;
}
function* walk(n) { yield n; for (const c of (n.children || [])) if (!c.text) yield* walk(c); }
function inlineDecl(el, prop) { const s = el.attrs && el.attrs.style; if (!s) return null; for (const d of s.split(';')) { const k = d.indexOf(':'); if (k > 0 && d.slice(0, k).trim().toLowerCase() === prop) return d.slice(k + 1).trim(); } return null; }
// winning declaration for a property on an element (null = none, inherit / transparent)
function winning(el, props, dark) {
  const cands = [];
  rules.forEach(r => { if (r.media && !(dark && /prefers-color-scheme:\s*dark/.test(r.media))) return; r.decls.forEach(d => { if (props.indexOf(d.p) >= 0 && matches(r.sel, el)) cands.push({ sel: r.sel, v: d.v, imp: d.imp, spec: specificity(r.sel), order: r.order, media: r.media }); }); });
  props.forEach(p => { const v = inlineDecl(el, p); if (v) cands.push({ sel: '[inline style]', v, imp: /!important/.test(v), spec: [9, 9, 9], order: 1e9 }); });
  cands.sort((x, y) => (y.imp - x.imp) || (y.spec[0] - x.spec[0]) || (y.spec[1] - x.spec[1]) || (y.spec[2] - x.spec[2]) || (y.order - x.order));
  return { win: cands[0] || null, all: cands };
}
function colorOf(el, dark) { const trail = []; let n = el; while (n && n.tag !== '#root') { const w = winning(n, ['color'], dark); if (w.win && w.win.v !== 'inherit') { trail.push(n.tag + '.' + n.cls.join('.') + ' <- ' + w.win.sel); return { hex: resolveVar(w.win.v), from: w.win.sel, owner: n, losers: w.all.slice(1).map(c => c.sel + '{' + c.v + '}'), trail }; } trail.push(n.tag + '.' + n.cls.join('.') + ' (inherits)'); n = n.parent; } return { hex: '?', trail }; }
function bgOf(el, dark) { let n = el; while (n && n.tag !== '#root') { const w = winning(n, ['background', 'background-color'], dark); if (w.win) { const v = resolveVar(w.win.v); const hx = (v.match(/#[0-9a-fA-F]{3,6}\b/) || [null])[0]; if (hx && !/transparent|none/.test(v)) return { hex: hx, from: w.win.sel, owner: n.tag + '.' + n.cls.join('.') }; } n = n.parent; } return { hex: '?', from: 'none' }; }
function lum(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(c => c + c).join(''); const c = [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { if (!/^#/.test(a) || !/^#/.test(b)) return NaN; const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

// ── fixture (hand calendar) ──────────────────────────────────────────────────
const DK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => midnight(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const TODAY = midnight(new Date()); const TKEY = DK[(TODAY.getDay() + 6) % 7];
const PID = 'm223';
function mkProg(startOffset, rest) { const weeks = {}; for (let w = 1; w <= 6; w++) { weeks[w] = {}; DK.forEach(d => { weeks[w][d] = rest.indexOf(d) >= 0 ? { title: 'Rest', rest: true, tags: ['rest'] } : { title: 'Base Lift', sections: [], tags: ['lift'], cardio: null }; }); } return { id: PID, name: 'M', totalWeeks: 6, startDate: iso(addDays(TODAY, startOffset)), weeks, goal: 'balanced', cfg: {} }; }
const DOM_STUB = "__mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__els={};document.getElementById=function(id){if(!__els[id])__els[id]=__mk(id);return __els[id];};document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";
function install(prog, week) { IA.localStorage.clear(); IA.eval("activeProgId='" + PID + "'"); IA.eval('activeProg=' + JSON.stringify(prog)); IA.eval('currentWeek=' + week); IA.eval(DOM_STUB);
  IA.eval('popFire=function(){};showToast=function(){};closeRandom=function(){};updateRandCounter=function(){};'); }
const ANC = [{ tag: 'html', cls: [] }, { tag: 'body', cls: [] }, { tag: 'div', cls: ['screen', 'active'] }, { tag: 'div', cls: [], id: 'daysList' }];

// ── 1. completeWildcard stamp vs hand calendar over a start-offset lattice ────
// offset = start date relative to today, -60..+7. Hand oracle: week = floor(days since start-Monday / 7)+1 in [1,6], day not before start.
const stampRows = { n: 0, stamped: 0, stampedOnToday: 0, stampedElsewhere: 0, nullStamp: 0, oracleMismatch: 0, markOnTodayCell: 0, markCellsRendered: 0 };
for (let off = -60; off <= 7; off++) {
  for (const restToday of [false, true]) {
    stampRows.n++;
    try {
      const rest = restToday ? [TKEY] : [TKEY === 'sun' ? 'sat' : 'sun'];
      const prog = mkProg(off, rest);
      const start = addDays(TODAY, off); const smon = addDays(start, -((start.getDay() + 6) % 7));
      const dd = Math.round((TODAY - smon) / 864e5); const hw = Math.floor(dd / 7) + 1;
      const expect = (TODAY >= start && hw >= 1 && hw <= 6) ? { week: hw, dayKey: TKEY } : null;
      install(prog, expect ? expect.week : 1);
      IA.eval('completeWildcard("Chaos ' + off + '")');
      const recs = JSON.parse(IA.localStorage.getItem('ia_wild_' + PID) || '[]');
      const r = recs[0] || {};
      const got = r.week ? { week: r.week, dayKey: r.dayKey } : null;
      if (JSON.stringify(got) !== JSON.stringify(expect)) stampRows.oracleMismatch++;
      if (!got) { stampRows.nullStamp++; continue; }
      stampRows.stamped++;
      if (got.dayKey === TKEY && expect && got.week === expect.week) stampRows.stampedOnToday++; else stampRows.stampedElsewhere++;
      // completeWildcard itself calls renderWeekView; re-render the stamped week and find the cell carrying the mark
      IA.eval('currentWeek=' + got.week); IA.eval('renderWeekView()');
      const h = IA.eval('__els.daysList?__els.daysList.innerHTML:""') || '';
      const t = tree(h, ANC);
      for (const el of walk(t)) if (el.cls && el.cls.indexOf('wc-mark') >= 0) { let c = el.parent; while (c && c.cls.indexOf('wk-day') < 0) c = c.parent; if (c && c.parent && c.parent.cls.indexOf('wk-strip') >= 0) { stampRows.markCellsRendered++; if (c.cls.indexOf('today') >= 0) stampRows.markOnTodayCell++; } }
    } catch (e) { crashes++; console.log('CRASH stamp off=' + off + ' ' + e.message); }
  }
}
console.log('STAMP LATTICE', JSON.stringify(stampRows));

// ── 2. surface cascade over the render cases ─────────────────────────────────
function caseRender(name, setup) {
  const prog = mkProg(-14, setup.rest || [TKEY === 'sun' ? 'sat' : 'sun']);
  const start = addDays(TODAY, -14); const smon = addDays(start, -((start.getDay() + 6) % 7)); const W = Math.floor(Math.round((TODAY - smon) / 864e5) / 7) + 1;
  install(prog, W);
  if (setup.comp) IA.localStorage.setItem('ia_comp_' + PID, JSON.stringify({ ['w' + W + '_' + TKEY]: { title: 'Base Lift', ts: 1, status: setup.comp } }));
  if (setup.wildDay) IA.localStorage.setItem('ia_wild_' + PID, JSON.stringify([{ title: 'Chaos', ts: 1, week: setup.wildDay(W).week, dayKey: setup.wildDay(W).dayKey }]));
  else IA.eval('completeWildcard("Chaos")');
  const RW = setup.wildDay ? setup.wildDay(W).week : W;   // render the week that holds the stamp
  IA.eval('currentWeek=' + RW); IA.eval('renderWeekView()');
  const wk = IA.eval('__els.daysList?__els.daysList.innerHTML:""') || '';
  let det = '';
  try { { const DKEY = setup.wildDay ? setup.wildDay(W).dayKey : TKEY; IA.eval('openDetail(' + JSON.stringify(DKEY) + ',activeProg.weeks[' + RW + '][' + JSON.stringify(DKEY) + '])'); } det = IA.eval('__els.detailBody?__els.detailBody.innerHTML:""') || ''; } catch (e) { det = 'THREW ' + e.message; }
  return { name, wk, det, W: RW };
}
const yKey = (W) => { const y = addDays(TODAY, -1); const k = DK[(y.getDay() + 6) % 7]; return { week: k === 'sun' ? W - 1 : W, dayKey: k }; };
const cases = [
  caseRender('A today=train, completeWildcard', {}),
  caseRender('B today=rest, completeWildcard', { rest: [TKEY] }),
  caseRender('C today=train skipped + completeWildcard', { comp: 'skipped' }),
  caseRender('D today=train complete + completeWildcard', { comp: 'complete' }),
  caseRender('E wildcard stamped YESTERDAY (next-day view)', { wildDay: yKey }),
];
const surf = [];
function probe(caseName, surface, html, ancestors, dark) {
  const t = tree(html, ancestors); let found = 0;
  for (const el of walk(t)) {
    const isMark = el.cls && el.cls.indexOf('wc-mark') >= 0;
    const isChk = el.cls && el.cls.indexOf('chk') >= 0;
    if (!isMark && !isChk) continue;
    let cell = el.parent; while (cell && cell.tag !== '#root' && !(cell.cls.indexOf('wk-day') >= 0) && !(cell.cls.indexOf('wc-tag') >= 0)) cell = cell.parent;
    const where = cell && cell.cls ? cell.tag + '.' + cell.cls.join('.') : '?';
    const targets = isMark ? [['wc-mark span', el], ['flame svg (stroke=currentColor)', el.children.find(c => c.tag === 'svg')], ['W glyph span', el.children.find(c => c.cls && c.cls.indexOf('wc-mark-w') >= 0)]] : [['chk span', el]];
    targets.forEach(([lbl, node]) => { if (!node) { console.log('MISSING ' + lbl); return; } const c = colorOf(node, dark), b = bgOf(node, dark); const cr = contrast(c.hex, b.hex);
      surf.push({ caseName, surface, where, lbl, color: c.hex, colorFrom: c.from, losers: c.losers, bg: b.hex, bgFrom: b.from + ' @' + b.owner, contrast: +cr.toFixed(2), dark }); found++; });
  }
  return found;
}
for (const c of cases) {
  for (const dark of [false, true]) {
    const strip = c.wk.slice(0, Math.max(0, c.wk.indexOf('<div class="wk-hero')) || c.wk.length);
    const rest = c.wk.slice(strip.length);
    const n1 = probe(c.name, 'week strip', strip, ANC, dark);
    const n2 = probe(c.name, 'week view below strip (hero/tag)', rest, ANC, dark);
    const n3 = probe(c.name, 'day detail', c.det, [{ tag: 'html', cls: [] }, { tag: 'body', cls: [] }, { tag: 'div', cls: ['overlay'], id: 'detailOverlay' }, { tag: 'div', cls: [], id: 'detailBody' }], dark);
    if (!dark) console.log('CASE ' + c.name + ' W=' + c.W + ' marks/checks probed: strip=' + n1 + ' belowStrip=' + n2 + ' detail=' + n3 + (c.det.startsWith('THREW') ? ' DETAIL ' + c.det : ''));
  }
}
console.log('--- surfaces (fg, bg, WCAG contrast) ---');
surf.forEach(s => console.log([s.dark ? 'DARK ' : 'LIGHT', s.caseName, '|', s.surface, '|', s.where, '|', s.lbl, '| fg', s.color, 'from', JSON.stringify(s.colorFrom), '| bg', s.bg, 'from', JSON.stringify(s.bgFrom), '| CR', s.contrast, s.losers && s.losers.length ? '| losers: ' + s.losers.join(' ; ') : ''].join(' ')));
const light = surf.filter(s => !s.dark);
const fail3 = light.filter(s => s.contrast < 3), eq1 = light.filter(s => s.contrast === 1);
console.log('SUMMARY light probes=' + light.length + ' CR==1.00:' + eq1.length + ' CR<3:' + fail3.length + ' | dark probes=' + surf.filter(s => s.dark).length + ' dark-differs-from-light:' + surf.filter(s => s.dark).filter((s, i) => { const l = light[i]; return !l || l.color !== s.color || l.bg !== s.bg; }).length);
console.log('TOKENS --signal=' + rootVars['--signal'] + ' --on-signal=' + rootVars['--on-signal'] + ' --surface=' + rootVars['--surface'] + ' --bg=' + rootVars['--bg'] + ' --run=' + rootVars['--run'] + ' | rules (re)defining --signal/--on-signal: ' + varRedefs.join(' | '));
console.log('RULES touching wc-mark or wk-day.today: ' + rules.filter(r => /wc-mark|wk-day\.today|\.today /.test(r.sel)).map(r => r.sel + '{' + r.decls.map(d => d.p + ':' + d.v + (d.imp ? '!' : '')).join(';') + '}' + (r.media ? ' [' + r.media + ']' : '')).join('  ||  '));
console.log('PSEUDO selectors skipped that otherwise hit a probed element: ' + ([...skippedPseudo].filter(s => /wc-|wk-day|chk|svg/.test(s)).join(' | ') || 'none'));
console.log('CRASHES ' + crashes);
