// g224_d185_wctoday.js — the gate for D185 (build P-WCTODAY, target V224).
//
// D185: the Wildcard flame+W mark and the completion tick both declare their own
// `color` and so escape the `.wk-day.today` override, rendering orange-on-orange
// (wc-mark, contrast 1.00) and green-on-orange (chk, contrast 1.13) on the one cell
// the athlete is looking at. Fix: one new CSS rule
//   .wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}
// inserted after index.html:645 (`.wc-mark{...}` base rule), zero removals.
//
// ORACLE: a small CSS cascade resolver written HERE, independent of the app. It
// parses the raw <style> text (selector, declarations, specificity, source order),
// matches selectors against hand-built element trees that mirror the real markup
// (renderWeekView's `.wk-day[.today] > .wk-day-num > span.chk|span.wc-mark`,
// wildcardMarkHTML's `span.wc-mark`), and resolves `color` by cascade rules
// (specificity, then source order; `!important` and inline style do not occur on
// these selectors so are not modelled). It never calls the app's render functions
// and never asks the engine what colour anything is. WCAG contrast is computed from
// the resolved hex against the hand-typed :root token values, independently derived
// from THE_ASYLUM_DS_REFERENCE.md / D185's finding, not read back from the file's
// own --signal/--on-signal/--run values (those ARE read from :root, since they are
// data, not the thing under test; the thing under test is which rule WINS).
//
// VERSION PREDICATE (standing ruling 4). D185 ships on ia-version 224. At 224 and
// above the new rule MUST exist: its absence is a named FAIL. Below 224, absence is
// not-applicable (declines rather than fails); presence below 224 (mid-slice working
// artifact) still runs the rows, since the surface is there to test.
//
// SECTION 1 SCOPE (V232, D199; session call 17 in tests/measure/v232_rulings/v232_session_calls.md).
// Section 1's five positional rows ("line 643".."line 647") carry the V224 build's own
// file layout as their premise (standing ruling 4). It held through V231 because no CSS
// landed above :643; V232's D199 `.iaw-solo` rule and its comment (6 lines at :335) moved
// the five lines to 649-653, byte-identical and in order. So the positional rows run only
// at ia-version <= 231 and, above it, each prints a SKIP naming the reason (never PASS,
// never FAIL). Their indices are NOT re-pointed (standing ruling 3: a re-pointed pin looks
// freshly maintained and breaks on the next insertion). Section 1b carries the same claim
// position-free on every version this gate runs on (>= 224, or a mid-slice surface): each
// of the five hand-typed lines occurs exactly once in the <style> text (comments
// stripped), and they are contiguous in V224's order, located by content, never by line
// number.

const fs = require('fs');
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const SRC = fs.readFileSync(FILE, 'utf8');
const IA = H.load(FILE);

let pass = 0, fail = 0, na = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function eq(name, got, want) { ok(name, got === want, 'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); }

console.log('g224_d185_wctoday  (D185 today-cell color fold: .wc-mark + .chk -> --on-signal)  artifact ia-version ' + IA.version);

// ── version predicate ─────────────────────────────────────────────────────────
const RULING_V = 224;
const artifactV = +IA.version;
const NEW_RULE = '.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}';
const SURFACE_PRESENT = SRC.indexOf(NEW_RULE) >= 0;

if (artifactV < RULING_V && !SURFACE_PRESENT) {
  na++;
  console.log('  n/a  artifact predates V224 and carries no D185 surface — declining (not a fail)');
  console.log('\nPASS 0 FAIL 0');
  process.exit(0);
}
ok('D185 surface present at ia-version >= 224 (or mid-slice)', SURFACE_PRESENT || artifactV < RULING_V, 'new rule missing: ' + NEW_RULE);

// ── 1. guardrail: lines 643/644/645/646 stay byte-identical, new line lands right after 645 ──
// The five hand-typed lines of the V224 block, in V224's order (the literals these rows always carried).
const V224_BLOCK = [
  '.wk-day-num .chk{color:var(--run);}',
  '.wk-day-num .wc-mark{color:var(--signal);}',
  '.wc-mark{display:inline-flex;align-items:center;gap:1px;color:var(--signal);line-height:1;}',
  NEW_RULE,
  '.wc-mark-w{font-family:var(--font-display);font-weight:800;font-size:11px;letter-spacing:0;}',
];
const V224_NAMES = ['.wk-day-num .chk', '.wk-day-num .wc-mark', '.wc-mark base', 'the D185 rule', '.wc-mark-w'];
// Positional rows: the V224 layout premise (standing ruling 4), scoped to ia-version <= 231 (V232 D199, session
// call 17). Indices are NOT re-pointed (standing ruling 3). Above 231 each prints a SKIP: never PASS, never FAIL.
const POSITIONAL_MAX_V = 231;
const POSITIONAL = [   // [label, 0-based line index in the V224 layout]
  ['line 643 unchanged (.wk-day-num .chk)', 642],
  ['line 644 unchanged (.wk-day-num .wc-mark)', 643],
  ['line 645 unchanged (.wc-mark base)', 644],
  ['line 646 is the new D185 rule (inserted immediately after :645)', 645],
  ['line 647 unchanged (.wc-mark-w), pushed down by exactly one', 646],
];
const POSITIONAL_SKIP_WHY = 'scoped to ia-version <= ' + POSITIONAL_MAX_V + ', the V224 layout premise (standing ruling 4); '
  + "V232's D199 `.iaw-solo` CSS (6 lines at :335) shifted the block by 6 lines; the position-free successor rows 1b "
  + 'below carry the claim (session call 17). Never PASS, never FAIL.';
const lines = SRC.split('\n');
let skip1 = 0;
POSITIONAL.forEach(([label, ix], k) => {
  if (artifactV <= POSITIONAL_MAX_V) eq(label, lines[ix], V224_BLOCK[k]);
  else { skip1++; console.log('  SKIP ' + label + ' at ia-version ' + artifactV + ': ' + POSITIONAL_SKIP_WHY); }
});
if (skip1) console.log('  ' + skip1 + ' positional rows SKIPPED at ia-version ' + artifactV + ', counted in neither PASS nor FAIL');

// ── 1b. position-free successor (V232 D199, session call 17): the same five lines, located by content ──
const styleText = [...SRC.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const styleLines = styleText.split('\n');
V224_BLOCK.forEach((s, k) => eq('1b ' + V224_NAMES[k] + ' occurs exactly once in the <style> text (comments stripped), located by content', styleText.split(s).length - 1, 1));
const blockAt = styleLines.indexOf(V224_BLOCK[0]);
const blockGot = blockAt < 0 ? [] : styleLines.slice(blockAt, blockAt + V224_BLOCK.length);
ok('1b the five lines are contiguous in V224 order (' + V224_NAMES.join(', ') + '; the D185 rule immediately after the .wc-mark base, .wc-mark-w immediately after it), located by content, never by line number',
   blockAt >= 0 && blockGot.length === V224_BLOCK.length && blockGot.every((l, k) => l === V224_BLOCK[k]),
   blockAt < 0 ? 'the first line is not a whole line of the <style> text' : 'got ' + JSON.stringify(blockGot));

// ── 2. CSS cascade resolver (independent oracle) ────────────────────────────────
const cssText = [...SRC.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = []; let order = 0;
(function parse(txt, media) {
  let i = 0;
  while (i < txt.length) {
    const ob = txt.indexOf('{', i); if (ob < 0) break;
    const head = txt.slice(i, ob).split(';').pop().trim();
    let depth = 1, j = ob + 1;
    while (j < txt.length && depth) { if (txt[j] === '{') depth++; else if (txt[j] === '}') depth--; j++; }
    const body = txt.slice(ob + 1, j - 1);
    if (head.startsWith('@media')) parse(body, head);
    else if (head.startsWith('@')) { /* keyframes/font-face: no colour cascade */ }
    else {
      const decls = [];
      body.split(';').forEach(d => { const k = d.indexOf(':'); if (k < 0) return; let v = d.slice(k + 1).trim(); const imp = /!important\s*$/.test(v); v = v.replace(/!important\s*$/, '').trim(); decls.push({ p: d.slice(0, k).trim().toLowerCase(), v, imp }); });
      head.split(',').map(s => s.trim()).filter(Boolean).forEach(sel => rules.push({ sel, decls, media, order: order++ }));
    }
    i = j;
  }
})(cssText, null);
const rootVars = {};
rules.filter(r => r.sel === ':root' && !r.media).forEach(r => r.decls.forEach(d => { if (d.p.startsWith('--')) rootVars[d.p] = d.v; }));
function resolveVar(v, depth) { depth = depth || 0; if (depth > 5) return v; return v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (m, n, fb) => rootVars[n] !== undefined ? resolveVar(rootVars[n], depth + 1) : (fb || m)); }

function parseCompound(c) {
  const o = { tag: null, ids: [], cls: [], attrs: [], pseudo: [] };
  const re = /([#.]?[\w-]+|\*|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?)/g; let m;
  while ((m = re.exec(c))) { const t = m[1];
    if (t === '*') continue; if (t[0] === '#') o.ids.push(t.slice(1)); else if (t[0] === '.') o.cls.push(t.slice(1));
    else if (t[0] === '[') o.attrs.push(t); else if (t[0] === ':') o.pseudo.push(t); else o.tag = t.toLowerCase(); }
  return o;
}
function specificity(sel) { let a = 0, b = 0, c = 0; sel.replace(/[>+~]/g, ' ').split(/\s+/).filter(Boolean).forEach(x => { const o = parseCompound(x); a += o.ids.length; b += o.cls.length + o.attrs.length + o.pseudo.filter(p => !p.startsWith('::')).length; c += (o.tag ? 1 : 0) + o.pseudo.filter(p => p.startsWith('::')).length; }); return [a, b, c]; }
function matchCompound(o, el) {
  if (o.tag && o.tag !== el.tag) return false;
  if (o.ids.some(i => el.id !== i)) return false;
  if (o.cls.some(k => el.cls.indexOf(k) < 0)) return false;
  if (o.pseudo.length) return false; // :active/:hover never hold at rest, none used on these selectors
  return true;
}
function matches(sel, el) {
  const parts = sel.replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
  function rec(pi, node) {
    const o = parseCompound(parts[pi]); if (!node || !matchCompound(o, node)) return false;
    if (pi === 0) return true;
    const comb = parts[pi - 1];
    if (comb === '>') return pi - 2 >= 0 && rec(pi - 2, node.parent);
    let p = node.parent; while (p) { if (rec(pi - 1, p)) return true; p = p.parent; } return false;
  }
  return rec(parts.length - 1, el);
}
function winningColor(el) {
  const cands = [];
  rules.forEach(r => { if (r.media) return; // light mode, matches the ruling's "light == dark" hand cascade
    r.decls.forEach(d => { if (d.p === 'color' && matches(r.sel, el)) cands.push({ sel: r.sel, v: d.v, imp: d.imp, spec: specificity(r.sel), order: r.order }); }); });
  cands.sort((x, y) => (y.imp - x.imp) || (y.spec[0] - x.spec[0]) || (y.spec[1] - x.spec[1]) || (y.spec[2] - x.spec[2]) || (y.order - x.order));
  return cands[0] || null;
}
function el(tag, cls, parent) { return { tag, cls, id: null, parent: parent || null }; }

// hand-built element trees mirroring renderWeekView / wildcardMarkHTML markup:
//   .wk-day[.today] > .wk-day-num > span.wc-mark | span.chk | (bare text, skip glyph)
function cell(today) { let n = el('div', ['wk-day'].concat(today ? ['today'] : [])); return el('div', ['wk-day-num'], n); }
const todayNum = cell(true), notTodayNum = cell(false);
const nodes = {
  'today wc-mark': el('span', ['wc-mark'], todayNum),
  'today chk': el('span', ['chk'], todayNum),
  'today wk-day-num (skip glyph, bare text)': todayNum,
  'not-today wc-mark': el('span', ['wc-mark'], notTodayNum),
  'not-today chk': el('span', ['chk'], notTodayNum),
};

function lum(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(c => c + c).join(''); const c = [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

// :root token values, read as data (not derived from the resolver's own verdict).
const SIGNAL = resolveVar(rootVars['--signal']);
const ON_SIGNAL = resolveVar(rootVars['--on-signal']);
const RUN = resolveVar(rootVars['--run']);
ok('token sanity: --signal is #CF4E1A per D185 finding', SIGNAL.toLowerCase() === '#cf4e1a', SIGNAL);
ok('token sanity: --on-signal is #FBF6EE per D185 finding', ON_SIGNAL.toLowerCase() === '#fbf6ee', ON_SIGNAL);
ok('token sanity: --run is #5e8c54 per D185 finding', RUN.toLowerCase() === '#5e8c54', RUN);

const results = {};
for (const k in nodes) { const w = winningColor(nodes[k]); results[k] = { sel: w && w.sel, hex: w && resolveVar(w.v) }; }

// today: both glyphs must resolve to --on-signal, winning selector must be the new D185 rule
eq('today + wc-mark resolves color to --on-signal', results['today wc-mark'].hex, ON_SIGNAL);
eq('today + wc-mark cascade winner is the D185 rule', results['today wc-mark'].sel, '.wk-day.today .wc-mark');
eq('today + chk resolves color to --on-signal', results['today chk'].hex, ON_SIGNAL);
eq('today + chk cascade winner is the D185 rule', results['today chk'].sel, '.wk-day.today .chk');

// non-today: both glyphs keep their pre-existing colours, untouched
eq('not-today + wc-mark still resolves to --signal (unchanged)', results['not-today wc-mark'].hex, SIGNAL);
eq('not-today + chk still resolves to --run (unchanged)', results['not-today chk'].hex, RUN);

// skip glyph on today: no span, no declared colour of its own; inherits the
// .wk-day.today .wk-day-num color (--on-signal), same as before this ruling.
const skipEl = nodes['today wk-day-num (skip glyph, bare text)'];
const skipWin = winningColor(skipEl);
// real check: walk every color-declaring rule that matches the bare .wk-day-num host
// and confirm none of them is a .chk/.wc-mark rule (the skip glyph is plain text, not
// a span, so a .chk/.wc-mark selector should never even be a candidate for this node).
const skipCandSels = [];
rules.forEach(r => { if (r.media) return; r.decls.forEach(d => { if (d.p === 'color' && matches(r.sel, skipEl)) skipCandSels.push(r.sel); }); });
const skipHasGlyphSelector = skipCandSels.some(s => { const last = s.trim().split(/\s+/).pop(); const o = parseCompound(last); return o.cls.indexOf('chk') >= 0 || o.cls.indexOf('wc-mark') >= 0; });
ok('skip glyph carries no rule of its own on .chk/.wc-mark (none matches a bare wk-day-num)', !skipHasGlyphSelector, skipCandSels.join(' | '));
eq('today wk-day-num itself (skip glyph host) resolves to --on-signal via :618, unchanged', resolveVar(skipWin.v), ON_SIGNAL);
ok('skip glyph winner is :618, not the new D185 rule', skipWin.sel === '.wk-day.today .wk-day-num');

// ── 3. WCAG contrast: today cases now readable, matching the ✕ baseline; non-today unchanged ──
const crTodayMark = contrast(results['today wc-mark'].hex, SIGNAL);   // background of .wk-day.today is --signal (:616)
const crTodayChk = contrast(results['today chk'].hex, SIGNAL);
const crSkipToday = contrast(ON_SIGNAL, SIGNAL);   // the ✕-today baseline, same two hexes, unchanged by this ruling
const crNotTodayMark = contrast(results['not-today wc-mark'].hex, '#f4f1e8'); // --bg backdrop per ruling's before-table
const crNotTodayChk = contrast(results['not-today chk'].hex, '#f4f1e8');
// ruling's After table: "same as ✕ today" for both fixed glyphs — same two hexes, so
// the contrast MUST equal the pre-existing ✕-today value exactly, computed by the
// same WCAG formula (not the ruling's rounded "5.6+" prose figure).
eq('today + wc-mark contrast now equals the ✕-today baseline ("same as ✕ today")', +crTodayMark.toFixed(4), +crSkipToday.toFixed(4));
eq('today + chk contrast now equals the ✕-today baseline ("same as ✕ today")', +crTodayChk.toFixed(4), +crSkipToday.toFixed(4));
ok('today + wc-mark contrast clears WCAG AA large-text/UI floor (3:1), was 1.00', crTodayMark >= 3, crTodayMark.toFixed(2));
ok('today + chk contrast clears WCAG AA large-text/UI floor (3:1), was 1.13', crTodayChk >= 3, crTodayChk.toFixed(2));
ok('not-today + wc-mark contrast unchanged (~3.9, still not the fix target)', Math.abs(crNotTodayMark - 3.91) < 0.05, crNotTodayMark.toFixed(2));
ok('not-today + chk contrast unchanged (~3.4)', crNotTodayChk > 3 && crNotTodayChk < 3.6, crNotTodayChk.toFixed(2));

// ── 4. guardrails: no JS moved, dark media untouched, no removals elsewhere ──
ok('wildcardMarkHTML untouched', SRC.indexOf('function wildcardMarkHTML(size){') >= 0);
ok('renderWeekView chk/wc-mark center logic untouched', SRC.indexOf("center='<span class=\"chk\">\\u2713</span>'") >= 0);
ok('no third selector folded in beyond .chk,.wc-mark (diff class stays one insertion)', (SRC.match(/\.wk-day\.today \.chk,\.wk-day\.today \.wc-mark\{color:var\(--on-signal\);\}/g) || []).length === 1);
// real check: the .chk/.wc-mark "color" rule family (as parsed by this resolver,
// comma lists split into one entry per selector) is exactly the three pre-existing
// rules (:643 .wk-day-num .chk, :644 .wk-day-num .wc-mark, :645 .wc-mark base) plus
// the two selectors carried by the new one-line D185 rule at :646 (.wk-day.today .chk,
// .wk-day.today .wc-mark) — five entries total, not more, not fewer.
const glyphColorFamily = rules.filter(r => !r.media && r.decls.some(d => d.p === 'color') && /\.(chk|wc-mark)(?![\w-])/.test(r.sel));
eq('rule count for the anchor family did not grow beyond the licensed insertion (3 pre-existing + 2 from the new comma rule = 5)', glyphColorFamily.length, 5);

console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail > 0 ? 1 : 0);
