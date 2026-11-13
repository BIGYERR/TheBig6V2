#!/usr/bin/env node
// Writes core/src/engine/engine-check-digests.ts, the digests the engine check on the phone compares against (D286,
// docs/decisions/engine-check.md), from the golden files CI pins: tests/snapshots/program-output-lattice.json (the 864
// lattice programs, in tests/lattice193.js FULL's order) and tests/snapshots/program-output.json (HALF_MANNY).
//
//   node tools/engine-check-digests.mjs           write the file
//   node tools/engine-check-digests.mjs --check   exit 1 unless the file is what it would write
//
// Run it whenever a ruling regenerates program output; tests/unit/engine-check.test.ts is red until it has run.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const LATTICE = require(join(REPO, 'tests', 'lattice193.js'));
const OUT = join(REPO, 'core', 'src', 'engine', 'engine-check-digests.ts');

export function engineCheckDigestsText() {
  const lattice = JSON.parse(readFileSync(join(REPO, 'tests', 'snapshots', 'program-output-lattice.json'), 'utf8'));
  const programs = JSON.parse(readFileSync(join(REPO, 'tests', 'snapshots', 'program-output.json'), 'utf8')).programs;
  const manny = programs['half-manny (Mario, NRC half, crossfit)']?.digest;
  if (!/^[0-9a-f]{16}$/.test(manny || '')) throw new Error('program-output.json holds no HALF_MANNY digest');
  const digests = LATTICE.FULL.map((c) => {
    const d = lattice[c.tag];
    if (!/^[0-9a-f]{16}$/.test(d || '')) throw new Error(`program-output-lattice.json holds no digest for ${c.tag}`);
    return d;
  });
  if (digests.length !== 864 || Object.keys(lattice).length !== 864) throw new Error('the lattice is not 864 programs');
  const rows = [];
  for (let i = 0; i < digests.length; i += 6) rows.push('  ' + digests.slice(i, i + 6).map((d) => `'${d}'`).join(',') + ',');
  return [
    '// The digests the engine check compares against (D286, docs/decisions/engine-check.md). Written by',
    '// node tools/engine-check-digests.mjs from tests/snapshots/program-output-lattice.json and program-output.json;',
    '// never edited by hand. tests/unit/engine-check.test.ts is red when they differ.',
    `const ENGINE_CHECK_MANNY_DIGEST='${manny}';`,
    '// The 864 lattice programs, in tests/lattice193.js FULL order (injury, equipment, focus, level, seed).',
    'const ENGINE_CHECK_LATTICE_DIGESTS: readonly string[]=[',
    ...rows,
    '];',
    '',
    '// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)',
    'export { ENGINE_CHECK_LATTICE_DIGESTS, ENGINE_CHECK_MANNY_DIGEST };',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = engineCheckDigestsText();
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(OUT, 'utf8'); } catch { have = ''; }
    if (have !== text) {
      console.error('engine-check-digests: core/src/engine/engine-check-digests.ts is not the golden files; run node tools/engine-check-digests.mjs');
      process.exit(1);
    }
    console.log('engine-check-digests: up to date');
  } else {
    writeFileSync(OUT, text);
    console.log('engine-check-digests: wrote', OUT.slice(REPO.length + 1));
  }
}
