import express from 'express';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdminAuth } from './auth.js';
import { installDevReload } from './dev.js';
import { cors, jsonBody } from './middleware.js';
import { normalizeVersion } from './versions.js';

const ADMIN_DIR = fileURLToPath(new URL('../dist/admin', import.meta.url));
const CLIENT_DIR = fileURLToPath(new URL('../client', import.meta.url));
const SITE_DIR = fileURLToPath(new URL('../dist/site', import.meta.url));
const APP_DIR = fileURLToPath(new URL('../app-web', import.meta.url));

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
export function createApp({ config, store, adminDir = ADMIN_DIR, siteDir = SITE_DIR, appDir = APP_DIR, startedAt = Date.now(), log = null }) {
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

  // Which backend answered: the app's debug section and the admin header show it, so a phone or a test run always
  // says whether it reached a local server, docker or Heroku.
  const backend = { kind: config.backendKind, name: config.backendName, version: config.version, commit: config.commit };

  // The app this backend serves at /app/ (scripts/app-bundle.mjs), and its ia-version as the page declares it, read
  // again whenever the file changes, so a fresh bundle shows without a restart. Unless APP_LATEST_VERSION says
  // otherwise, that is the newest version: a device below it runs an old build.
  const appPage = join(appDir, 'index.html');
  let appSeen = { mtimeMs: -1, version: '' };
  const appVersion = () => {
    let mtimeMs;
    try {
      mtimeMs = statSync(appPage).mtimeMs;
    } catch {
      return '';
    }
    if (mtimeMs !== appSeen.mtimeMs) {
      appSeen = { mtimeMs, version: /<meta name="ia-version" content="([^"]*)"/.exec(readFileSync(appPage, 'utf8'))?.[1] ?? '' };
    }
    return appSeen.version;
  };
  const latestGiven = () => config.latestAppVersion || appVersion();
  const latestFrom = config.latestAppVersion ? 'config' : 'app';

  // Liveness for Heroku, docker's HEALTHCHECK and scripts/heroku.sh verify. No auth, nothing about devices.
  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store').json({
      ok: true,
      service: 'iron-asylum-backend',
      backend: config.backendKind,
      name: config.backendName,
      app: appVersion(),
      version: config.version,
      commit: config.commit,
      release: config.release,
      uptimeS: Math.round((Date.now() - startedAt) / 1000),
    });
  });

  // npm run dev only: the three pages carry a live reload script (server/dev.js). Before the routers, so it answers
  // for /, /admin/ and /app/ first.
  if (config.dev) {
    installDevReload(
      app,
      { '/': siteDir, '/index.html': siteDir, '/admin/': adminDir, '/admin/index.html': adminDir, '/app/': appDir, '/app/index.html': appDir },
      log ?? (() => {}),
    );
  }

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
      backend,
    });
  });

  // Sent by navigator.sendBeacon when the app is hidden or closed.
  api.post('/bye', (req, res) => {
    store.bye(req.body.uid);
    res.status(204).end();
  });

  api.use((req, res) => res.status(404).json({ ok: false, error: 'not found' }));
  app.use('/api', api);

  // ── Admin vision: the staff login, the dashboard and the API it reads ─────────
  // The page itself is public (it holds no data and draws the login form); every /admin/api route but login and
  // logout needs a session or Basic auth (server/auth.js).
  const auth = createAdminAuth(config);
  const admin = express.Router();
  admin.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  admin.post('/api/login', express.json({ limit: '2kb' }), auth.login);
  admin.post('/api/logout', auth.logout);
  admin.use('/api', auth.guard);

  admin.get('/api/me', (req, res) => {
    res.json({ ok: true, user: req.admin.user, via: req.admin.via, expiresAt: req.admin.expires });
  });

  admin.get('/api/stats', (req, res) => {
    const versions = store.versions(latestGiven(), latestFrom);
    res.json({
      ...store.stats(),
      latestApp: versions.latest,
      outdated: versions.outdated,
      server: {
        kind: config.backendKind,
        name: config.backendName,
        version: config.version,
        commit: config.commit,
        release: config.release,
        node: process.versions.node,
        uptimeS: Math.round((Date.now() - startedAt) / 1000),
        persistent: Boolean(config.dataFile),
        beatMs: config.beatMs,
        connectedWindowMs: config.connectedWindowMs,
        maxDevices: config.maxDevices,
        corsOrigins: config.corsOrigins,
        sessionMinutes: Math.round(config.sessionTtlMs / 60_000),
        appVersion: appVersion(),
        appSemver: normalizeVersion(appVersion()),
      },
    });
  });

  admin.get('/api/versions', (req, res) => res.json(store.versions(latestGiven(), latestFrom)));

  admin.get('/api/devices', (req, res) => {
    const q = req.query;
    const flag = (v) => v === '1' || v === 'true';
    res.json(
      store.list({
        q: String(q.q ?? ''),
        name: String(q.name ?? ''),
        connected: flag(q.connected),
        outdated: flag(q.outdated),
        latest: store.latestVersion(latestGiven()),
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
    res.json(store.view(d, undefined, store.latestVersion(latestGiven())));
  });

  admin.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'not found' }));

  // Built folders are read per request, never checked once at boot, so a build that lands while the server runs
  // (npm run dev) is served at once. A route below a static folder answers only when that folder has no such file.
  admin.use(express.static(adminDir, { index: 'index.html', setHeaders: cacheFor('private') }));
  admin.get('/', (req, res) =>
    res.status(503).type('text').send('The admin UI is not built. Run `npm run build` in backend/.'),
  );
  app.use('/admin', admin);

  // ── The app itself: the single file PWA that GitHub Pages serves, so one backend can hand people the app before the
  // store builds exist. Its own origin here, so its data on this server is separate from the Pages copy's. ─────────
  app.use('/app', express.static(appDir, { index: 'index.html', setHeaders: cacheFor('public') }));
  app.get(['/app', '/app/'], (req, res) =>
    res.status(503).type('text').send('The app is not bundled. Run `npm run app:bundle` in backend/.'),
  );

  // The connection indicator on a page of its own, for trying it before it ships in the app.
  if (config.clientDemo) app.use('/client', express.static(CLIENT_DIR, { index: 'demo.html' }));

  // ── The website: everything else at the root. Its footer's Staff Login is a plain link to /admin/ above, so
  // the site and the backend are one server, one deploy, one origin. ─────────────────────────────────────────
  app.use(express.static(siteDir, { index: 'index.html', setHeaders: cacheFor('public') }));
  app.get('/', (req, res) =>
    res.status(503).type('text').send('The website is not built. Run `npm run build` in backend/.'),
  );

  // A browser asking for a page gets the site's 404 page; everything else (fetch, curl, the app) gets JSON.
  // Sent relative to its root: with an absolute path, sendFile refuses any dot folder on the way (.claude/...).
  app.use((req, res) => {
    if (req.method === 'GET' && req.accepts(['json', 'html']) === 'html' && existsSync(join(siteDir, '404.html'))) {
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

// Cache rules for every built folder. A name with a content hash (main-ABCD1234.js, the production build) never
// changes, so it caches for a year. Pages, and scripts or styles without a hash (a development build), are revalidated
// on every load, so a rebuild shows at once. Anything else (icons, robots.txt) for an hour. The admin's files are
// `private`: kept by the browser, never by a shared cache.
const HASHED = /-[A-Z0-9]{8}\.(?:js|css)$/;
function cacheFor(scope) {
  return (res, path) => {
    const value = HASHED.test(path)
      ? `${scope}, max-age=31536000, immutable`
      : /\.(?:html|js|css)$/.test(path)
        ? 'no-cache'
        : `${scope}, max-age=3600`;
    res.setHeader('Cache-Control', value);
  };
}
