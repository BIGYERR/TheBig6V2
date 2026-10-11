import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { basicAuth, cors, jsonBody } from './middleware.js';

const ADMIN_DIR = fileURLToPath(new URL('../dist/admin', import.meta.url));
const CLIENT_DIR = fileURLToPath(new URL('../client', import.meta.url));
const SITE_DIR = fileURLToPath(new URL('../dist/site', import.meta.url));

/** The kind of device a user agent names, for the request log. */
export function deviceOf(ua = '') {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh/.test(ua)) return 'Mac';
  return ua ? 'other' : 'no-user-agent';
}

// Built as a function of config and store so the tests can run it on a random port with a fake clock.
// `log` gets one line per response once it is sent (server.js passes console.log; tests pass nothing, so stay quiet):
//   request POST /api/heartbeat 200 3 ms 192.168.1.20 iPhone
export function createApp({ config, store, adminDir = ADMIN_DIR, siteDir = SITE_DIR, startedAt = Date.now(), log = null }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) {
    // Behind Heroku's router: req.ip is the caller, not the router, and req.secure reflects the caller's scheme.
    app.set('trust proxy', 1);
    // Heroku answers plain http too. Send every request to https, so the admin password never travels in clear.
    app.use((req, res, next) => (req.secure ? next() : res.redirect(308, `https://${req.get('host')}${req.originalUrl}`)));
  }
  // One line per response, the same everywhere it runs: a logged run's output locally (npm run dev), docker's logs,
  // Heroku's log stream. Never the request body or headers, so no password or device payload is ever printed.
  if (log) {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on('finish', () =>
        log(`request ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started} ms ${(req.ip ?? '?').replace(/^::ffff:/, '')} ${deviceOf(req.get('user-agent'))}`),
      );
      next();
    });
  }

  // Liveness for Heroku, docker's HEALTHCHECK and scripts/heroku.sh verify. No auth, nothing about devices.
  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store').json({
      ok: true,
      service: 'iron-asylum-backend',
      version: config.version,
      commit: config.commit,
      release: config.release,
      uptimeS: Math.round((Date.now() - startedAt) / 1000),
    });
  });

  // ── Public API: what the app calls ────────────────────────────────────────────
  const api = express.Router();
  api.use(cors(config.corsOrigins));
  api.use(express.text({ type: ['text/plain', 'application/json'], limit: '2kb' }), jsonBody);
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // The health check with a UID. The app sends the UID it holds (none on first run), what kind of device it is,
  // and the round trip it measured on its previous beat. The reply carries the UID to keep.
  api.post('/heartbeat', (req, res) => {
    const { uid, issued } = store.heartbeat(req.body, { ua: req.get('user-agent') });
    res.json({
      ok: true,
      uid,
      issued,
      serverTime: Date.now(),
      nextBeatMs: config.beatMs,
    });
  });

  // Sent by navigator.sendBeacon when the app is hidden or closed.
  api.post('/bye', (req, res) => {
    store.bye(req.body.uid);
    res.status(204).end();
  });

  api.use((req, res) => res.status(404).json({ ok: false, error: 'not found' }));
  app.use('/api', api);

  // ── Admin vision: the dashboard and the API it reads, behind one static login ─
  const admin = express.Router();
  admin.use(basicAuth(config));
  admin.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  admin.get('/api/stats', (req, res) => {
    res.json({
      ...store.stats(),
      server: {
        version: config.version,
        commit: config.commit,
        release: config.release,
        uptimeS: Math.round((Date.now() - startedAt) / 1000),
        persistent: Boolean(config.dataFile),
      },
    });
  });

  admin.get('/api/devices', (req, res) => {
    const q = req.query;
    res.json(
      store.list({
        q: String(q.q ?? ''),
        name: String(q.name ?? ''),
        connected: q.connected === '1' || q.connected === 'true',
        page: q.page,
        pageSize: q.pageSize,
      }),
    );
  });

  admin.patch('/api/devices/:uid', express.json({ limit: '2kb' }), (req, res) => {
    // Without this, a body express.json skipped (wrong content type) would read as "no name" and clear it.
    if (typeof req.body?.name !== 'string') {
      return res.status(400).json({ ok: false, error: 'send {"name": "..."} as application/json' });
    }
    const d = store.rename(req.params.uid, req.body.name);
    if (!d) return res.status(404).json({ ok: false, error: 'no such device' });
    res.json(store.view(d));
  });

  admin.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'not found' }));

  if (existsSync(adminDir)) {
    admin.use(express.static(adminDir, { index: 'index.html', setHeaders: adminCache }));
  } else {
    admin.get('/', (req, res) =>
      res.status(503).type('text').send('The admin UI is not built. Run `npm run build` in backend/.'),
    );
  }
  app.use('/admin', admin);

  // The connection indicator on a page of its own, for trying it before it ships in the app.
  if (config.clientDemo) app.use('/client', express.static(CLIENT_DIR, { index: 'demo.html' }));

  // ── The website: everything else at the root. Its footer's Staff Login is a plain link to /admin/ above, so
  // the site and the backend are one server, one deploy, one origin. ─────────────────────────────────────────
  const siteBuilt = existsSync(join(siteDir, 'index.html'));
  if (siteBuilt) {
    app.use(express.static(siteDir, { index: 'index.html', setHeaders: siteCache }));
  } else {
    app.get('/', (req, res) =>
      res.status(503).type('text').send('The website is not built. Run `npm run build` in backend/.'),
    );
  }

  // A browser asking for a page gets the site's 404 page; everything else (fetch, curl, the app) gets JSON.
  // Sent relative to its root: with an absolute path, sendFile refuses any dot folder on the way (.claude/...).
  const hasNotFoundPage = existsSync(join(siteDir, '404.html'));
  app.use((req, res) => {
    if (hasNotFoundPage && req.method === 'GET' && req.accepts(['json', 'html']) === 'html') {
      return res.status(404).set('Cache-Control', 'no-cache').sendFile('404.html', { root: siteDir });
    }
    res.status(404).json({ ok: false, error: 'not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ ok: false, error: status >= 500 ? 'server error' : err.message });
  });

  return app;
}

// Hashed bundles cache for an hour, in the browser only (they sit behind the login); index.html is revalidated
// every time, so a new deploy shows on the next load.
function adminCache(res, path) {
  res.setHeader('Cache-Control', path.endsWith('index.html') ? 'no-cache' : 'private, max-age=3600');
}

// The site's bundles carry a content hash in their names (main-ABCD1234.js), so a deploy changes the name and a
// year of caching is safe. Pages are revalidated every time; the favicon and robots.txt for an hour.
const HASHED = /-[A-Z0-9]{8}\.(?:js|css)$/;
function siteCache(res, path) {
  const value = path.endsWith('.html') ? 'no-cache' : HASHED.test(path) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
  res.setHeader('Cache-Control', value);
}
