'use strict';
// A counterfactual copy of the app under test: the same file (index.html, or the one IA_APP names) with a few exact
// text replacements, written to a private temp folder that is removed when the process exits. For tests that need the
// engine with one clause taken out (the core-off digest), or with a stage recorder spliced in (the deload stages).
//
// Every anchor must occur exactly once in the app, or appCopy throws and the test that asked for it fails by name: a
// copy built from an anchor that moved would compare the app with itself.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APP } = require('./app.js');

let dir = null;
let n = 0;
function tempDir() {
  if (!dir) {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-app-copy-'));
    process.on('exit', () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // nothing to clean
      }
    });
  }
  return dir;
}

/** Occurrences of `needle` in `hay`. */
function count(hay, needle) {
  return hay.split(needle).length - 1;
}

/**
 * Writes the app with each [anchor, replacement] applied once and returns the copy's path. `name` labels the file.
 * Throws when an anchor does not occur exactly once.
 */
function appCopy(name, edits, from = APP) {
  let text = fs.readFileSync(from, 'utf8');
  for (const [anchor, replacement] of edits) {
    const c = count(text, anchor);
    if (c !== 1) throw new Error(`appCopy(${name}): anchor occurs ${c} times in ${from} (want 1): ${anchor.slice(0, 120)}`);
    text = text.replace(anchor, () => replacement);
  }
  const file = path.join(tempDir(), `${name}-${process.pid}-${++n}.html`);
  fs.writeFileSync(file, text);
  return file;
}

module.exports = { appCopy, count };
