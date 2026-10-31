#!/usr/bin/env node
// Data backup measure (D264): what a backup has to carry. Lists every localStorage key family the app's sources name
// (a string literal starting ia_), the files that name it, and every storage call whose key is not such a literal, so
// each can be traced by hand to the family it builds. Covers the legacy app, the engine and the Angular screens.
// Usage: node tests/measure/data-backup_stored-keys.js
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const ROOTS = ['frontends/app/src/legacy/src/js', 'core/src', 'frontends/app/src/app', 'frontends/app/plugins-src'];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|js|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

const families = new Map();
const indirect = [];
let calls = 0;
for (const root of ROOTS) {
  for (const file of walk(path.join(REPO, root), [])) {
    const rel = path.relative(REPO, file);
    const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/['"`](ia_[a-z_]+)/g)) {
      if (!families.has(m[1])) families.set(m[1], new Set());
      families.get(m[1]).add(rel);
    }
    for (const m of src.matchAll(/(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*([^,)]{0,40})/g)) {
      calls++;
      if (!/^['"`]ia_/.test(m[3].trim())) indirect.push(`${rel}: ${m[1]}.${m[2]}(${m[3].trim()}`);
    }
    if (/indexedDB|caches\.open|document\.cookie\s*=/.test(src)) indirect.push(`${rel}: other browser storage`);
  }
}

console.log(`storage calls: ${calls}; key families named as ia_ literals: ${families.size}\n`);
for (const [k, files] of [...families].sort()) console.log(`  ${k.padEnd(18)} ${[...files].join(', ')}`);
console.log(`\ncalls whose key is not an ia_ literal (${indirect.length}), each traced by hand in the ruling:`);
for (const l of indirect) console.log('  ' + l);
