// pwa-local's request log: one line per response, once it is sent, with the time it took and who asked. These lines
// become the server-pwa-local run's request events.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createStaticServer } from '../../scripts/pwa-local.mjs';

describe('pwa-local request log', () => {
  const lines: string[] = [];
  let server: Server;
  let base = '';
  before(async () => {
    const root = mkdtempSync(join(tmpdir(), 'ia-pwa-log-'));
    writeFileSync(join(root, 'index.html'), '<!doctype html><title>t</title>');
    server = createStaticServer(root, (line: string) => lines.push(line));
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

  it('logs a served page with its status, time and the device that asked', async () => {
    await (await fetch(`${base}/`, { headers: { 'user-agent': IPHONE } })).text();
    await new Promise((r) => setTimeout(r, 20));
    assert.match(lines.at(-1)!, /^GET \/ 200 \d+ ms 127\.0\.0\.1 iPhone$/);
  });

  it('logs refusals too', async () => {
    await (await fetch(`${base}/missing.png`)).text();
    await (await fetch(`${base}/`, { method: 'POST' })).text();
    await new Promise((r) => setTimeout(r, 20));
    assert.match(lines.at(-2)!, /^GET \/missing\.png 404 \d+ ms 127\.0\.0\.1 other$/);
    assert.match(lines.at(-1)!, /^POST \/ 405 \d+ ms 127\.0\.0\.1 other$/);
  });
});
