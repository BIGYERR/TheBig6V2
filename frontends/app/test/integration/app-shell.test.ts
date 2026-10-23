// The Angular shell's skeleton (src/app/legacy/legacy-host.ts, architecture phase E step 33) against the page it
// replaces: the same top-level elements, in the same order, with the same tag, classes and id, and a tap handler on the
// same elements calling the same legacy function. The page is the one the app is built from (scripts/build-index.mjs),
// split as the build splits it; the shell is read from its template.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { buildIndex } from '../../scripts/build-index.mjs';
import { split } from '../../scripts/sync-legacy.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** One top-level element: its tag, classes, id, and the legacy function its tap calls (or none). */
type Box = [tag: string, cls: string, id: string, tap: string | null];

/** The page's top-level elements, its divs and navs counted so only depth 0 is read. */
function pageBoxes(markup: string): Box[] {
  const out: Box[] = [];
  let depth = 0;
  const tag = /<(\/?)(div|nav|span|button|i|svg)\b([^>]*)>/g;
  for (let m = tag.exec(markup); m; m = tag.exec(markup)) {
    const [, close, name, attrs] = m;
    if (name !== 'div' && name !== 'nav') continue;
    if (close) {
      depth--;
      continue;
    }
    if (depth === 0) {
      const at = (a: string) => (new RegExp(`\\b${a}="([^"]*)"`).exec(attrs!) || [])[1] ?? '';
      const tap = /^\s*([A-Za-z_$][\w$]*)\(/.exec(at('onclick').replace(/^event\.stopPropagation\(\);/, ''));
      out.push([name!, at('class'), at('id'), tap ? tap[1]! : null]);
    }
    if (!/\/\s*$/.test(attrs!)) depth++;
  }
  return out;
}

/** The shell's top-level elements, read off its template's lines. */
function shellBoxes(source: string): Box[] {
  const template = source.slice(source.indexOf('template: `') + 'template: `'.length, source.indexOf('`,', source.indexOf('template: `')));
  return template.split('\n').map((l) => l.trim()).filter((l) => /^<(div|nav)\b/.test(l)).map((l) => {
    const open = /^<(div|nav)\b([^>]*)>/.exec(l)!;
    const at = (a: string) => (new RegExp(`(?:^|\\s)${a}="([^"]*)"`).exec(open[2]!) || [])[1] ?? '';
    const tap = /\(click\)="call\('([A-Za-z_$][\w$]*)'/.exec(open[2]!);
    return [open[1]!, at('class'), at('id'), tap ? tap[1]! : null] as Box;
  });
}

describe('the app shell', () => {
  const page = pageBoxes(split(buildIndex().toString('utf8')).markup);
  const shell = shellBoxes(readFileSync(join(APP, 'src', 'app', 'legacy', 'legacy-host.ts'), 'utf8'));

  it('draws the page\'s top-level elements, in order, with their tags, classes, ids and taps', () => {
    assert.ok(page.length >= 20, `read ${page.length} elements off the page`);
    assert.deepEqual(shell, page);
  });

  it('keeps the three taps the page puts on its containers: the update banner, the RPE card\'s backdrop, the pop-up\'s backdrop', () => {
    assert.deepEqual(page.filter((b) => b[3]).map((b) => [b[2], b[3]]), [['iaUpdateBanner', 'iaDoUpdate'], ['rpeInfoOverlay', 'hideRpeInfo'], ['popOverlay', 'popDismissBg']]);
  });
});
