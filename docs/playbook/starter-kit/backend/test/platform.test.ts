// The platform files agree with each other: Heroku, Docker and CI run one Node line, and Heroku starts the compiled
// server. Each of these drifted apart once somewhere; a test is cheaper than the outage.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const json = (path: string) => JSON.parse(read(path)) as { engines?: { node?: string }; scripts?: Record<string, string> };

describe('platform', () => {
  const engine = json('backend/package.json').engines?.node ?? '';
  const major = /^(\d+)\.x$/.exec(engine)?.[1];

  test('backend/package.json pins one Node major line', () => {
    assert.ok(major, `engines.node is "${engine}"; write it as <major>.x`);
  });

  test("Heroku's manifest (the root package.json) runs the same Node line", () => {
    assert.equal(json('package.json').engines?.node, engine);
  });

  test('every Docker image is built FROM that Node line', () => {
    for (const file of ['backend/Dockerfile', 'backend/Dockerfile.dev']) {
      const froms = read(file).match(/^FROM\s+\S+/gm) ?? [];
      assert.ok(froms.length > 0, `${file} has no FROM`);
      for (const from of froms) assert.match(from, new RegExp(`^FROM\\s+node:${major}-`), `${file}: ${from}`);
    }
  });

  test('the pipeline runs that Node line', () => {
    assert.match(read('.github/workflows/pipeline.yml'), new RegExp(`NODE_VERSION: '${major}'`));
  });

  test("Heroku's web process starts the compiled server, the same command as the root start script", () => {
    const web = /^web:\s*(.+)$/m.exec(read('Procfile'))?.[1]?.trim();
    assert.ok(web, 'the Procfile has no web process');
    assert.match(web, /dist\/server\/server\.js/);
    assert.equal(json('package.json').scripts?.start, web);
  });
});
