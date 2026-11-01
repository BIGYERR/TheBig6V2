// The routes. createApp returns the server unstarted, so the tests listen on a port of their own. Swap node:http for a
// framework when the project needs one; keep /healthz's shape, which the deploy proof reads.
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { Config } from './config.ts';

export function createApp(config: Config, log: ((line: string) => void) | null = null): Server {
  const startedAt = Date.now();
  return createServer((req, res) => {
    const t0 = Date.now();
    res.on('finish', () => log?.(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - t0}ms`));
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;

    // Liveness for Heroku, Docker's HEALTHCHECK and tools/deploy-check.mjs: which build is live. No auth, never cached.
    if (path === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(
        JSON.stringify({
          ok: true,
          service: '__SLUG__',
          backend: config.backendKind,
          name: config.backendName,
          version: config.version,
          commit: config.commit,
          release: config.release,
          uptimeS: Math.round((Date.now() - startedAt) / 1000),
        }),
      );
      return;
    }

    if (path === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><meta charset="utf-8"><title>__PROJECT__</title><h1>__PROJECT__</h1><p>${config.version}</p>`);
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
  });
}
