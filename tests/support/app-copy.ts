// A counterfactual copy of the app under test: the same file (index.html, or the one IA_APP names) with a few exact
// text replacements, written to a private temp folder that is removed when the process exits. For tests that need the
// engine with one clause taken out (the core-off digest), or with a stage recorder spliced in (the deload stages).
//
// Every anchor must occur exactly once in the app, or appCopy throws and the test that asked for it fails by name: a
// copy built from an anchor that moved would compare the app with itself.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP } from './app.ts';

let dir: string | null = null;
let n = 0;
function tempDir(): string {
  if (!dir) {
    const made = mkdtempSync(join(tmpdir(), 'ia-app-copy-'));
    dir = made;
    process.on('exit', () => {
      try {
        rmSync(made, { recursive: true, force: true });
      } catch {
        // nothing to clean
      }
    });
  }
  return dir;
}

/** Occurrences of `needle` in `hay`. */
export function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

/**
 * Writes the app with each [anchor, replacement] applied once and returns the copy's path. `name` labels the file.
 * Throws when an anchor does not occur exactly once.
 */
export function appCopy(name: string, edits: [string, string][], from: string = APP): string {
  let text = readFileSync(from, 'utf8');
  for (const [anchor, replacement] of edits) {
    const c = count(text, anchor);
    if (c !== 1) throw new Error(`appCopy(${name}): anchor occurs ${c} times in ${from} (want 1): ${anchor.slice(0, 120)}`);
    text = text.replace(anchor, () => replacement);
  }
  const file = join(tempDir(), `${name}-${process.pid}-${++n}.html`);
  writeFileSync(file, text);
  return file;
}
