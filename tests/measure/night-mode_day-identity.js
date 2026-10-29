#!/usr/bin/env node
// Night mode proof (D261): the day look is unchanged. Each page's colours are resolved against its own day palette
// (every var(--x) and rgba(var(--x-rgb), a) replaced by the :root value), every colour written as rgb(...) or rgba(...),
// and the two pages compared rule by rule (CSS) and line by line (markup and script). What differs must be only what
// the ruling adds: the night palettes, the Look row, theme.ts, the version, comments.
// Usage: node tests/measure/night-mode_day-identity.js <previous page> <this page>
'use strict';
const fs = require('fs');

function dayTokens(html) {
  const css = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
  const root = css.slice(css.indexOf(':root{') + 6, css.indexOf('}', css.indexOf(':root{')));
  const t = {};
  for (const d of root.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const i = d.indexOf(':');
    if (i > 0 && d.trim().startsWith('--')) t[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  }
  return t;
}
const hexToRgb = (h) => {
  let x = h.slice(1);
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return `rgb(${[0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(',')})`;
};
function resolve(html) {
  const tok = dayTokens(html);
  let s = html;
  for (let pass = 0; pass < 4; pass++) {
    s = s.replace(/var\((--[\w-]+)(?:,[^()]*)?\)/g, (m, name) => (name in tok ? tok[name] : m));
  }
  s = s.replace(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}(?![0-9A-Za-z])/g, hexToRgb);
  s = s.replace(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(?:,\s*([0-9.]+)\s*)?\)/g, (m, r, g, b, a) =>
    a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${Number(a)})`);
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}
function units(html) {
  const s = resolve(html);
  const css = s.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
  const rest = s.replace(css, '');
  return [
    ...css.split('}').map((r) => 'css ' + r.replace(/\s+/g, ' ').trim()),
    ...rest.split('\n').map((l) => 'txt ' + l.replace(/\/\/.*$/, '').trim()),
  ].filter((u) => u.length > 4);
}

const [prevFile, thisFile] = process.argv.slice(2);
const prev = units(fs.readFileSync(prevFile, 'utf8'));
const next = units(fs.readFileSync(thisFile, 'utf8'));
const count = (arr) => arr.reduce((m, u) => m.set(u, (m.get(u) || 0) + 1), new Map());
const P = count(prev), N = count(next);
const gone = [], added = [];
for (const [u, n] of P) for (let i = 0; i < n - (N.get(u) || 0); i++) gone.push(u);
for (const [u, n] of N) for (let i = 0; i < n - (P.get(u) || 0); i++) added.push(u);
console.log(`units: previous ${prev.length}, this ${next.length}; only in previous ${gone.length}, only in this ${added.length}`);
console.log('\nonly in previous:');
for (const u of gone) console.log('  - ' + u.slice(0, 220));
console.log('\nonly in this:');
for (const u of added) console.log('  + ' + u.slice(0, 220));
