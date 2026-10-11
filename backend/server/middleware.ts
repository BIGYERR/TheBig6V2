import type { NextFunction, Request, RequestHandler, Response } from 'express';

// CORS for the public API. Patterns are exact origins; `*` stands for any run of characters without a slash
// (`http://localhost:*` covers every port). A request from a browser origin outside the list is refused; a
// request with no Origin (curl, a health probe, a native client) passes.
export function cors(patterns: string[]): RequestHandler {
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
export function jsonBody(req: Request, res: Response, next: NextFunction) {
  if (typeof req.body !== 'string' || !req.body) {
    req.body = {};
    return next();
  }
  try {
    const parsed: unknown = JSON.parse(req.body);
    req.body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    next();
  } catch {
    res.status(400).json({ ok: false, error: 'body is not JSON' });
  }
}
