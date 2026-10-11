// The request log (server/app.js): one line per response, once it is sent, never a header or a body.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp, deviceOf } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { DeviceStore } from '../server/store.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const AUTH = 'Basic ' + Buffer.from('admin:secret').toString('base64');

describe('request log', () => {
  const lines = [];
  let server;
  let base;
  before(async () => {
    const config = loadConfig({ NODE_ENV: 'production', ADMIN_USER: 'admin', ADMIN_PASSWORD: 'secret' });
    const store = new DeviceStore(config);
    server = createApp({ config, store, adminDir: '/nonexistent', log: (line) => lines.push(line) }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => new Promise((resolve) => server.close(resolve)));

  const settle = () => new Promise((r) => setTimeout(r, 20));

  test('logs a heartbeat with its status, time, address and device', async () => {
    await fetch(`${base}/api/heartbeat`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': IPHONE }, body: '{}' });
    await settle();
    assert.match(lines.at(-1), /^request POST \/api\/heartbeat 200 \d+ ms 127\.0\.0\.1 iPhone$/);
  });

  test('logs refusals and admin calls, and never the password', async () => {
    await fetch(`${base}/nope`);
    await fetch(`${base}/admin/api/stats`, { headers: { authorization: AUTH } });
    await settle();
    assert.match(lines.at(-2), /^request GET \/nope 404 \d+ ms 127\.0\.0\.1 other$/);
    assert.match(lines.at(-1), /^request GET \/admin\/api\/stats 200 /);
    assert.ok(lines.every((l) => !l.includes('secret') && !l.includes(AUTH)));
  });

  test('stays quiet when no log is given (the tests elsewhere, LOG_REQUESTS=0)', () => {
    assert.equal(loadConfig({ LOG_REQUESTS: '0' }).logRequests, false);
    assert.equal(loadConfig({}).logRequests, true);
  });

  test('names the device from the user agent', () => {
    assert.equal(deviceOf(IPHONE), 'iPhone');
    assert.equal(deviceOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)'), 'Mac');
    assert.equal(deviceOf(''), 'no-user-agent');
  });
});
