// Live reload for npm run dev (scripts/dev-watch.ts). On only when IA_DEV=1 (the watcher sets it for the server),
// never in the image's own config or on Heroku.
//
// - The website, the admin and the app pages are served with one extra script tag, /__dev/reload.js, which listens
//   on /__dev/events and reloads the page when told to.
// - The watcher POSTs /__dev/reload after each successful rebuild, and every open page reloads.
// - A restarted server (a change under server/) has a new boot id; a page that reconnects and sees it reloads too.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Express, Response } from 'express';

const TAG = '<script src="/__dev/reload.js"></script>';

const CLIENT = `// npm run dev: reload this page when the dev server says a rebuild landed, or when it restarted.
(function () {
  var boot = null;
  var events = new EventSource('/__dev/events');
  events.addEventListener('hello', function (e) {
    if (boot && boot !== e.data) location.reload();
    boot = e.data;
  });
  events.addEventListener('reload', function () { location.reload(); });
})();
`;

/** pages: request path to the folder whose index.html it serves, e.g. { '/app/': appDir }. */
export function installDevReload(app: Express, pages: Record<string, string>, log: (line: string) => void = () => {}) {
  const boot = randomUUID();
  const clients = new Set<Response>();

  app.get('/__dev/reload.js', (req, res) => res.type('js').set('Cache-Control', 'no-store').send(CLIENT));

  app.get('/__dev/events', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.flushHeaders();
    // retry: a page whose server restarted reconnects in half a second, not the browser's default three or more.
    res.write(`retry: 500\nevent: hello\ndata: ${boot}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    req.on('close', () => {
      clearInterval(ping);
      clients.delete(res);
    });
  });

  // On shutdown, end the open event streams, or the server waits on them before it can exit (a slow restart).
  process.once('SIGTERM', () => {
    for (const c of clients) c.end();
  });

  // The reply says how many pages it reached, for the watcher's log.
  app.post('/__dev/reload', (req, res) => {
    for (const c of clients) c.write(`event: reload\ndata: ${Date.now()}\n\n`);
    log(`dev: reloaded ${clients.size} page${clients.size === 1 ? '' : 's'}`);
    res.json({ ok: true, pages: clients.size });
  });

  // The pages themselves, with the reload script added at the end of the body. Never cached.
  app.get(Object.keys(pages), (req, res, next) => {
    let html: string;
    try {
      html = readFileSync(join(pages[req.path], 'index.html'), 'utf8');
    } catch {
      return next(); // not built yet: the normal 503 answers
    }
    const end = html.lastIndexOf('</body>');
    html = end >= 0 ? html.slice(0, end) + TAG + html.slice(end) : html + TAG;
    res.set('Cache-Control', 'no-cache').type('html').send(html);
  });

  return { clients };
}
