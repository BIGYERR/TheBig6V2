import { createHash, timingSafeEqual } from 'node:crypto';

// CORS for the public API. Patterns are exact origins; `*` stands for any run of characters without a slash
// (`http://localhost:*` covers every port). A request from a browser origin outside the list is refused; a
// request with no Origin (curl, a health probe, a native client) passes.
export function cors(patterns) {
  const allowed = patterns.map((p) => {
    const escaped = p.replace(/[.+?^$|()[\]{}\\]/g, '\\$&').replace(/\*/g, '[^/]*');
    return new RegExp('^' + escaped + '$', 'i');
  });
  return (req, res, next) => {
    const origin = req.get('origin');
    if (origin) {
      if (!allowed.some((re) => re.test(origin))) {
        return res.status(403).json({ ok: false, error: 'origin not allowed' });
      }
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      res.vary('Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  };
}

// The app posts JSON as text/plain on purpose: a "simple" CORS request skips the preflight, so one beat is one
// round trip and the latency it measures is the real one. Accept either content type here.
export function jsonBody(req, res, next) {
  if (typeof req.body !== 'string' || !req.body) {
    req.body = {};
    return next();
  }
  try {
    const parsed = JSON.parse(req.body);
    req.body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    next();
  } catch {
    res.status(400).json({ ok: false, error: 'body is not JSON' });
  }
}

// HTTP Basic auth with one static username and password from the environment.
// Ten wrong tries from one address within ten minutes locks that address out for the rest of the window.
export function basicAuth({ adminUser, adminPassword, now = () => Date.now() }) {
  const WINDOW_MS = 10 * 60_000;
  const MAX_FAILS = 10;
  const fails = new Map(); // ip -> { count, since }

  return (req, res, next) => {
    if (!adminUser || !adminPassword) {
      return res.status(503).type('text').send('Admin is off. Set ADMIN_USER and ADMIN_PASSWORD.');
    }
    const t = now();
    // An address is forgotten when it returns after its window. Sweep the rest too, so many one-off
    // guessers cannot grow the map without limit.
    if (fails.size > 1_000) {
      for (const [key, r] of fails) if (t - r.since > WINDOW_MS) fails.delete(key);
    }
    const ip = req.ip || 'unknown';
    const record = fails.get(ip);
    if (record && t - record.since > WINDOW_MS) fails.delete(ip);
    if (fails.get(ip)?.count >= MAX_FAILS) {
      return res.status(429).type('text').send('Too many wrong passwords. Try again in ten minutes.');
    }

    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme?.toLowerCase() === 'basic' && token) {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const colon = decoded.indexOf(':');
      if (colon >= 0) {
        const userOk = same(decoded.slice(0, colon), adminUser);
        const passOk = same(decoded.slice(colon + 1), adminPassword);
        if (userOk && passOk) {
          fails.delete(ip);
          return next();
        }
      }
      const r = fails.get(ip) ?? { count: 0, since: t };
      r.count += 1;
      fails.set(ip, r);
    }
    res.set('WWW-Authenticate', 'Basic realm="Iron Asylum admin", charset="UTF-8"');
    res.status(401).type('text').send('Sign in required.');
  };
}

// Constant time whatever the lengths: compare digests, not the strings.
function same(a, b) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
