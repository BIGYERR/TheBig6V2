#!/usr/bin/env node
// Night mode measure: every colour the app writes as a literal instead of a token, so would not flip with the palette.
// Reads the app's sources (the legacy page and the Angular app the native build ships), never index.html.
// Usage: node tests/measure/night-mode_colour-literals.js [--list]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const LEGACY = path.join(ROOT, 'frontends/app/src/legacy/src');
const NG = path.join(ROOT, 'frontends/app/src/app');
const LIST = process.argv.includes('--list');

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.includes(path.extname(e.name)) && !e.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

const LITERAL = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[0-9.]+\s*)?\)/g;

function rgbOf(lit) {
  if (lit[0] === '#') {
    let h = lit.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  return lit.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number);
}

// Classes, by the colour's own RGB: what it is in the day palette decides what night mode must do with it.
const NAMED = {
  '24,23,18': 'ink', '22,22,24': 'ink', '10,10,10': 'ink', '40,34,22': 'ink shadow',
  '244,241,232': 'bone', '251,250,245': 'bone', '251,246,238': 'bone', '236,231,218': 'paper tone',
  '224,218,202': 'paper tone', '213,206,189': 'paper tone', '188,178,155': 'paper tone',
  '207,78,26': 'signal', '174,63,18': 'signal',
  '94,140,84': 'modality', '63,110,150': 'modality', '188,106,67': 'modality', '126,94,150': 'modality',
  '166,130,47': 'modality', '158,51,40': 'modality', '240,160,80': 'modality',
  '95,95,98': 'grey', '125,118,104': 'grey', '107,101,87': 'grey', '190,192,194': 'grey',
};
const classOf = (lit) => NAMED[rgbOf(lit).join(',')] || 'other';

const files = [
  ...walk(path.join(LEGACY, 'css'), ['.css']).map((f) => ['legacy css', f]),
  ...walk(path.join(LEGACY, 'js'), ['.ts']).map((f) => ['legacy js', f]),
  ...walk(path.join(LEGACY, 'html'), ['.html']).map((f) => ['legacy html', f]),
  ...walk(NG, ['.ts', '.html', '.css']).map((f) => ['angular', f]),
];

const rows = [];
for (const [area, f] of files) {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n');
  let inRoot = false;
  lines.forEach((line, i) => {
    if (/^\s*:root\s*\{/.test(line)) inRoot = true;
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/^\s*\/\/.*$/, '');
    for (const m of code.matchAll(LITERAL)) {
      const before = code.slice(0, m.index);
      const isFallback = /var\(--[\w-]+,\s*$/.test(before);
      const isToken = inRoot || /--[\w-]+\s*:\s*[^;]*$/.test(before.slice(before.lastIndexOf(';') + 1));
      rows.push({
        area, file: path.relative(ROOT, f), line: i + 1, lit: m[0].replace(/\s+/g, ''),
        cls: classOf(m[0]), kind: isToken ? 'token' : isFallback ? 'fallback' : 'literal',
      });
    }
    if (inRoot && line.includes('}')) inRoot = false;
  });
}

const count = (pred) => rows.filter(pred).length;
const lits = rows.filter((r) => r.kind === 'literal');
console.log(`files read: ${files.length}; colour occurrences: ${rows.length} (tokens ${count((r) => r.kind === 'token')}, var() fallbacks ${count((r) => r.kind === 'fallback')}, literals ${lits.length})`);
const varUses = files.reduce((n, [, f]) => n + (fs.readFileSync(f, 'utf8').match(/var\(--/g) || []).length, 0);
console.log(`var(--…) uses: ${varUses}`);
console.log('\nliterals by area and class:');
const areas = [...new Set(lits.map((r) => r.area))];
const classes = [...new Set(lits.map((r) => r.cls))].sort();
console.log(['area'.padEnd(12), ...classes.map((c) => c.padStart(11))].join(''));
for (const a of areas) console.log([a.padEnd(12), ...classes.map((c) => String(count((r) => r.kind === 'literal' && r.area === a && r.cls === c)).padStart(11))].join(''));
console.log('\nliterals by file:');
const byFile = {};
for (const r of lits) byFile[r.file] = (byFile[r.file] || 0) + 1;
for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${f}`);
if (LIST) {
  console.log('\nevery literal:');
  for (const r of lits) console.log(`  ${r.file}:${r.line}  ${r.cls.padEnd(10)} ${r.lit}`);
}
