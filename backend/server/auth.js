import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// The staff login for /admin. A sign in creates a session: a random id in an HttpOnly, SameSite=Strict cookie scoped
// to /admin, held in memory here. Log out deletes it on the server, so the cookie is dead even if a copy survives.
// A restart signs everyone out, which is acceptable for one small staff. Scripts may still send HTTP Basic auth on
// each request (curl -u). No 401 carries WWW-Authenticate, so a browser never shows its own login box: the admin
// page draws the form.
//
// Ten wrong passwords from one address within ten minutes lock that address out for the rest of the window, whether
// they came through the form or through Basic auth.

const COOKIE = 'ia_admin';
const WINDOW_MS = 10 * 60_000;
const MAX_FAILS = 10;
const MAX_SESSIONS = 200;

export function createAdminAuth({ adminUser, adminPassword, sessionTtlMs = 12 * 3_600_000, now = () => Date.now() }) {
  const fails = new Map(); // ip -> { count, since }
  const sessions = new Map(); // id -> { user, created, expires }
  const off = !adminUser || !adminPassword;

  function lockedOut(ip, t) {
    // An address is forgotten when it returns after its window. Sweep the rest too, so many one-off guessers cannot
    // grow the map without limit.
    if (fails.size > 1_000) {
      for (const [key, r] of fails) if (t - r.since > WINDOW_MS) fails.delete(key);
    }
    const record = fails.get(ip);
    if (record && t - record.since > WINDOW_MS) fails.delete(ip);
    return (fails.get(ip)?.count ?? 0) >= MAX_FAILS;
  }

  function fail(ip, t) {
    const r = fails.get(ip) ?? { count: 0, since: t };
    r.count += 1;
    fails.set(ip, r);
  }

  function matches(user, password) {
    // Both compared every time, in constant time whatever the lengths.
    const userOk = same(String(user ?? ''), adminUser);
    const passOk = same(String(password ?? ''), adminPassword);
    return userOk && passOk;
  }

  function session(req, t) {
    const id = readCookie(req, COOKIE);
    const s = id ? sessions.get(id) : undefined;
    if (!s) return null;
    if (t >= s.expires) {
      sessions.delete(id);
      return null;
    }
    return { id, ...s };
  }

  function refuse(res, status, error) {
    return res.status(status).json({ ok: false, error });
  }

  function cookie(req, value, maxAgeS) {
    return [`${COOKIE}=${value}`, 'Path=/admin', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeS}`, req.secure ? 'Secure' : '']
      .filter(Boolean)
      .join('; ');
  }

  return {
    sessions,

    // Every /admin/api route but login and logout sits behind this.
    guard(req, res, next) {
      if (off) return refuse(res, 503, 'Admin is off. Set ADMIN_USER and ADMIN_PASSWORD.');
      const t = now();
      const ip = req.ip || 'unknown';
      if (lockedOut(ip, t)) return refuse(res, 429, 'Too many wrong passwords. Try again in ten minutes.');
      const s = session(req, t);
      if (s) {
        req.admin = { user: s.user, via: 'session', expires: s.expires };
        return next();
      }
      const [scheme, token] = (req.get('authorization') || '').split(' ');
      if (scheme?.toLowerCase() === 'basic' && token) {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const colon = decoded.indexOf(':');
        if (colon >= 0 && matches(decoded.slice(0, colon), decoded.slice(colon + 1))) {
          fails.delete(ip);
          req.admin = { user: adminUser, via: 'basic', expires: 0 };
          return next();
        }
        fail(ip, t);
      }
      refuse(res, 401, 'Sign in required.');
    },

    // POST /admin/api/login {"user", "password"} as application/json. A cross site form cannot send that type
    // without a preflight, and /admin answers no CORS, so the login cannot be forged from another page.
    login(req, res) {
      if (off) return refuse(res, 503, 'Admin is off. Set ADMIN_USER and ADMIN_PASSWORD.');
      const t = now();
      const ip = req.ip || 'unknown';
      if (lockedOut(ip, t)) return refuse(res, 429, 'Too many wrong passwords. Try again in ten minutes.');
      const { user, password } = req.body ?? {};
      if (typeof user !== 'string' || typeof password !== 'string') {
        return refuse(res, 400, 'Send {"user", "password"} as application/json.');
      }
      if (!matches(user, password)) {
        fail(ip, t);
        return refuse(res, 401, 'Wrong username or password.');
      }
      fails.delete(ip);
      for (const [id, s] of sessions) if (t >= s.expires) sessions.delete(id);
      // Oldest first out when the cap is reached; Map keeps insertion order.
      while (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
      const id = randomBytes(32).toString('base64url');
      const expires = t + sessionTtlMs;
      sessions.set(id, { user: adminUser, created: t, expires });
      res.set('Set-Cookie', cookie(req, id, Math.round(sessionTtlMs / 1000)));
      res.json({ ok: true, user: adminUser, expiresAt: expires });
    },

    // POST /admin/api/logout: ends the session on the server and clears the cookie. Safe to repeat.
    logout(req, res) {
      const id = readCookie(req, COOKIE);
      if (id) sessions.delete(id);
      res.set('Set-Cookie', cookie(req, '', 0));
      res.json({ ok: true });
    },
  };
}

function readCookie(req, name) {
  for (const part of (req.get('cookie') || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return '';
}

// Constant time whatever the lengths: compare digests, not the strings.
function same(a, b) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
