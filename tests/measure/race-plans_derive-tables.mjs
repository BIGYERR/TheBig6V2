// D270 P-OWNPLANS (docs/decisions/race-plans.md): writes the four derived race tables into a copy of
// core/src/engine/nrc-race-bike-swim.ts. The builder's starting point: the 39-session library is read out of the file as
// it stands (each speed object's text, keyed by its headline, numbered in traversal order 5K -> 10K -> half -> marathon),
// and only the rows (long run, which sessions, recovery) are re-authored, from SPEC below, which is the decision file's
// After tables as code. The session objects are reused byte for byte.
//   node tests/measure/race-plans_derive-tables.mjs <in: nrc-race-bike-swim.ts> <out: nrc-race-bike-swim.ts>
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) { console.error('usage: node race-plans_derive-tables.mjs <in.ts> <out.ts>'); process.exit(2); }
const src = readFileSync(inPath, 'utf8');

// ---- read the tables ------------------------------------------------------------------------------------------------
const TABLE_ORDER = ['NRC_5K_TABLE', 'NRC_10K_TABLE', 'NRC_HALF_TABLE', 'NRC_MARATHON_TABLE'];
function tableSpan(name) {
  const open = src.indexOf(`const ${name}: NrcWeek[] = [`);
  if (open < 0) throw new Error(`no ${name}`);
  const bodyStart = src.indexOf('\n', open) + 1;            // first row line
  const close = src.indexOf('\n];', bodyStart);               // the closing bracket on its own line
  if (close < 0) throw new Error(`no close for ${name}`);
  return { name, start: bodyStart, end: close + 1 };          // [start, end): the row lines, each ending in \n
}
/** Splits a table body into rows: a row starts at a line beginning with `  {long:` and runs to the next such line. */
function rows(body) {
  const lines = body.split('\n');
  const out = [];
  for (const line of lines) {
    if (/^  \{long:/.test(line)) out.push(line);
    else if (out.length && line.length) out[out.length - 1] += '\n' + line;
  }
  return out;
}
/** The speed objects of a row, as text, by scanning brackets outside single-quoted strings. */
function speedObjects(row) {
  const at = row.indexOf('speed:[');
  if (at < 0) return [];
  let i = at + 'speed:['.length, depth = 0, inStr = false, objStart = -1;
  const objs = [];
  for (; i < row.length; i++) {
    const c = row[i];
    if (inStr) { if (c === '\\') i++; else if (c === "'") inStr = false; continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '{') { if (depth === 0) objStart = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0) objs.push(row.slice(objStart, i + 1)); }
    else if (c === ']' && depth === 0) break;
  }
  return objs;
}
const headline = (obj) => { const m = obj.match(/detail:'((?:[^'\\]|\\.)*?)(?:\\n|')/); if (!m) throw new Error('no detail in ' + obj.slice(0, 60)); return m[1]; };

const LIB = [];                       // id -> { headline, text }
const byHeadline = new Map();
const spans = TABLE_ORDER.map(tableSpan);
for (const sp of spans) {
  for (const row of rows(src.slice(sp.start, sp.end))) {
    for (const obj of speedObjects(row)) {
      const h = headline(obj);
      if (!byHeadline.has(h)) { LIB.push({ headline: h, text: obj }); byHeadline.set(h, LIB.length); }
    }
  }
}
if (LIB.length !== 39) throw new Error(`library holds ${LIB.length} sessions, expected 39`);

// ---- the derived rows (D270; the 5K re-authored for a first time runner, Mario 2026-11-11) ---------------------------
const mi = (n, label) => ({ mi: n, label });
function R(val, label, speed, recovery, flags = {}) {
  if (Array.isArray(label)) { flags = recovery || {}; recovery = speed; speed = label; label = `${val} Mile Run`; }
  return { val, label, speed, recovery, flags };
}
const cutback = { cutback: true }, peak = { peak: true }, taper = { taper: true }, race = { race: true };
const SPEC = {
  NRC_5K_TABLE: [
    R(1.5, '1.5 Mile Run', [1, 3], [10, 12]), R(2, [6, 4], [12, 15]), R(2.5, [5, 8], [15, 20]), R(2, [13, 21], [15, 15], cutback),
    R(3, [9, 16], [20, 20]), R(3.5, [22, 12], [20, 25], peak), R(3, [11, 7], [20, 15], taper),
    R(3.1, 'THE RACE', [17], [20, 15, mi(1, '1 Mile')], race),
  ],
  NRC_10K_TABLE: [
    R(4, [23, 2], [25, 25]), R(5, [24, 21], [25, 30]), R(6, [35, 25], [30, 30]), R(4.5, [20, 10], [25, 25], cutback),
    R(7, [19, 18], [30, 35]), R(8, [33, 38], [35, 35], peak), R(6, [14, 29], [30, 25], taper),
    R(6.2, 'THE RACE', [15], [mi(3, '3 Mile'), 25, mi(1, '1 Mile')], race),
  ],
  NRC_HALF_TABLE: [
    R(4, [29, 23], [25, 30]), R(5, [2, 21], [25, 30]), R(6, [16, 13], [30, 35]), R(7, [26, 12], [30, 35]), R(5, [30, 5], [25, 30], cutback),
    R(8, [35, 28], [30, 40]), R(9, [31, 10], [35, 40]), R(10, [22, 33], [35, 45]), R(7, [20, 36], [30, 35], cutback),
    R(11, [19, 37], [40, 45]), R(12, [32, 34], [40, 50], peak), R(9, '9 Mile Dress Rehearsal', [25, 15], [30, 40], { cutback: true, rehearsal: true }),
    R(7, [27, 17], [30, mi(3, '3 Mile')], taper), R(13.1, 'THE RACE', [39], [25, 20, mi(2, '2 Mile')], race),
  ],
  NRC_MARATHON_TABLE: [
    R(6, [6], [25, 30, 25]), R(7, [1], [30, 30, 30]), R(8, [21], [30, 35, 30]), R(6, [13], [25, 30, 25], cutback),
    R(9, [2], [30, 40, 30]), R(10, [12], [35, 40, 35]), R(12, [35], [35, 45, 35]), R(8, [23], [30, 35, 30], cutback),
    R(13, [19], [40, 45, 40]), R(14, [33], [40, 50, 40]), R(16, [22], [45, 50, 45]), R(10, [20], [35, 40, 35], cutback),
    R(17, [28], [45, 55, 45]), R(18, [10], [45, 60, 45]), R(20, [31], [45, 60, 45], peak), R(14, [36], [40, 45, 35], taper),
    R(10, [17], [35, mi(4, '4 Mile'), 30], taper), R(26.2, 'THE RACE', [24], [30, mi(3, '3 Mile'), mi(1, '1 Mile')], race),
  ],
};
const recText = (r) => typeof r === 'number' ? String(r) : `{mi:${r.mi},label:'${r.label}'}`;
function rowText(r) {
  const flags = Object.keys(r.flags).map((f) => `,${f}:true`).join('');
  const speed = r.speed.map((id) => { const s = LIB[id - 1]; if (!s) throw new Error(`no session ${id}`); return s.text; }).join(', ');
  return `  {long:{val:${r.val},unit:'mi',label:'${r.label}'${flags}}, speed:[${speed}], recovery:[${r.recovery.map(recText).join(',')}]},\n`;
}

// ---- splice, last span first so earlier offsets hold --------------------------------------------------------------------
let out = src;
for (const sp of [...spans].sort((a, b) => b.start - a.start)) {
  const body = SPEC[sp.name].map(rowText).join('');
  out = out.slice(0, sp.start) + body + out.slice(sp.end);
}
writeFileSync(outPath, out);
const used = new Set(Object.values(SPEC).flat().flatMap((r) => r.speed));
console.log(`library ${LIB.length} sessions, ${used.size} used; rows ${Object.values(SPEC).reduce((n, t) => n + t.length, 0)}; wrote ${outPath}`);
console.log(LIB.map((s, i) => `${i + 1} ${s.headline}`).join('\n'));
