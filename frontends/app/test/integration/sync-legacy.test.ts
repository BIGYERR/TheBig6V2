// sync-legacy against the real root index.html (the live PWA), and its command line.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { render, split } from '../../scripts/sync-legacy.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(APP, '..', '..', 'index.html');
const html = readFileSync(SOURCE, 'utf8');

describe('sync-legacy on the live index.html', () => {
  const parts = split(html);

  it('reads the same ia-version as the page meta', () => {
    const meta = /<meta name="ia-version" content="([^"]*)">/.exec(html);
    assert.ok(meta, 'index.html carries an ia-version meta');
    assert.match(meta[1]!, /^(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?$/, 'a legacy integer or a dotted M.m.p');
    assert.equal(parts.version, meta[1]);
  });

  it('extracts the app script exactly as the HTML parser would: first <script> to first </script>', () => {
    // Independent of split(): the head holds no script, so the page's first "<script>" opens the app script.
    const expected = html.split('<script>')[1]!.split('</script>')[0];
    assert.equal(parts.js, expected);
  });

  it('extracts a script that compiles', () => {
    assert.doesNotThrow(() => new Script(parts.js, { filename: 'app.js' }));
  });

  it('extracts the stylesheet whole', () => {
    assert.equal(html.split(`<style>${parts.css}</style>`).length, 2, 'the style block occurs once, whole');
  });

  it('stamps the sha256 of the exact source bytes', () => {
    const sha = createHash('sha256').update(html).digest('hex');
    const manifest = Object.entries(render(html)).find(([p]) => p.endsWith('legacy-manifest.json'))![1];
    assert.deepEqual(JSON.parse(manifest), { version: parts.version, sha256: sha });
  });

  it('reads the live page relabelled to a dotted ia-version (0.239.1) and stamps it as written', () => {
    const meta = /<meta name="ia-version" content="[^"]*">/.exec(html);
    assert.ok(meta, 'index.html carries an ia-version meta');
    const relabelled = html.replace(meta[0], '<meta name="ia-version" content="0.239.1">');
    assert.equal(split(relabelled).version, '0.239.1');
    const files = Object.entries(render(relabelled));
    const pick = (suffix: string): string => files.find(([path]) => path.endsWith(suffix))![1];
    const sha = createHash('sha256').update(relabelled).digest('hex');
    assert.deepEqual(JSON.parse(pick('legacy-manifest.json')), { version: '0.239.1', sha256: sha });
    assert.ok(pick('legacy-markup.ts').includes(`export const LEGACY_SCRIPT_URL = "legacy/app.js?v=0.239.1-${sha.slice(0, 12)}";`));
  });
});

describe('sync-legacy command line', () => {
  it('runs as a script, and --check reports without writing', () => {
    const res = spawnSync(process.execPath, ['scripts/sync-legacy.mjs', '--check'], { cwd: APP, encoding: 'utf8' });
    const line = `${res.stdout}${res.stderr}`.trim();
    if (res.status === 0) assert.match(line, /^sync-legacy: up to date with ia-version (?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?$/);
    else assert.match(line, /^sync-legacy: stale: .+ \(run npm run sync\)$/);
  });
});
