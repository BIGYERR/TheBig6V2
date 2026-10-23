#!/usr/bin/env node
// The pwa-local build path: the same web build as pwa-pages (scripts/pwa-pages.mjs), served from this Mac instead of
// GitHub Pages. Nothing is committed or pushed.
//
//   npm run pwa-local                    sync from the page (the build of src/legacy/src), build into dist/pwa-local/,
//                                        check it, serve it
//   npm run pwa-local -- --port 4401     pick the port (default: PWA_LOCAL_PORT or 4400)
//   npm run pwa-local -- --no-build      serve the last build as it is (still refused if it is stale)
//
// The server listens on every interface, so an iPhone on the same Wi-Fi can open it and add it to the home screen.
// Use the http://<name>.local address it prints, not the IP: the address is the origin, and the origin owns the
// storage, so a home screen app saved on a DHCP address loses its programs when the Mac's IP changes.
//
// Like pwa-pages, no Cordova and no native plugins, so the rest stopwatch runs without the Dynamic Island. The page
// is plain http on the phone, which Safari does not treat as a secure context. The app's one live clipboard copy
// (copyProgSel) falls back to a textarea copy when navigator.clipboard is missing, so nothing it does needs https.
//
// Every session is a logged run (tools/runlog.mjs), temp/runs/<stamp>-server-pwa-local/: the build, the addresses,
// every request served (method, path, status, time, which device), and the stop, in events.log as they happen. Follow
// it live with npm run logs -- follow server-pwa-local.
//
// createStaticServer() and resolveRequest() are exported for test/; nothing builds or listens unless this file is run
// as a script.
import { execFileSync, spawnSync } from 'node:child_process';
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { hostname, networkInterfaces } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachRun, duration, startRun } from '../../../tools/runlog.mjs';
import { checkPwaBuild } from './pwa-check.mjs';
import { PAGES_DIR, writePages } from './build-index.mjs';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'dist', 'pwa-local');
const BASE_HREF = '/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

/** Angular's output hashing names a file by its content (main-AB12CD34.js), so it can be cached for good. */
const HASHED = /-[A-Z0-9]{8}\.(?:js|css)$/;

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Maps a request URL to the file under `root` that answers it, or null for a 404. A directory answers with its
 * index.html, and a path with no extension falls back to the root index.html, as nginx's try_files does in e2e/.
 * Nothing outside `root` is ever returned.
 */
export function resolveRequest(root, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  const base = resolve(root);
  const file = resolve(base, `.${pathname}`);
  if (file !== base && !file.startsWith(base + sep)) return null;
  if (isFile(file)) return file;
  if (isFile(join(file, 'index.html'))) return join(file, 'index.html');
  if (!extname(pathname)) return isFile(join(base, 'index.html')) ? join(base, 'index.html') : null;
  return null;
}

/**
 * Who asked: the address (IPv4 when it is one) and the kind of device the user agent names.
 * @param {import('node:http').IncomingMessage} req
 */
export function clientOf(req) {
  const ip = (req.socket?.remoteAddress ?? '?').replace(/^::ffff:/, '');
  const ua = req.headers?.['user-agent'] ?? '';
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : ua ? 'other' : 'no user agent';
  return `${ip} ${device}`;
}

/**
 * A static file server for `root`. Hashed bundles are cached for good; everything else is revalidated every load.
 * `log` gets one line per response once it is sent: "GET /index.html 200 3 ms 192.168.1.20 iPhone".
 * @param {string} root
 * @param {(line: string) => void} [log]
 */
export function createStaticServer(root, log = () => {}) {
  return createServer((req, res) => {
    const started = Date.now();
    res.on('finish', () => log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - started} ms ${clientOf(req)}`));
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const file = resolveRequest(root, req.url ?? '/');
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found\n');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': statSync(file).size,
      'Cache-Control': HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(res);
  });
}

/** Interfaces a phone on the Wi-Fi never reaches: VM and Docker bridges, VPN tunnels, AirDrop. */
const PRIVATE_IF = /^(?:bridge|vmnet|vboxnet|docker|utun|awdl|llw)/;

/** Every address the phone could use for this Mac: the Bonjour name first (it never changes), then each LAN IPv4. */
function addresses(port) {
  const urls = [];
  let bonjour;
  try {
    bonjour = execFileSync('scutil', ['--get', 'LocalHostName'], { encoding: 'utf8' }).trim();
  } catch {
    bonjour = hostname().replace(/\.local$/, '');
  }
  if (bonjour) urls.push(`http://${bonjour}.local:${port}/`);
  for (const [name, list] of Object.entries(networkInterfaces())) {
    if (PRIVATE_IF.test(name)) continue;
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal) urls.push(`http://${a.address}:${port}/`);
    }
  }
  return urls;
}

function main() {
  const args = process.argv.slice(2);
  // The run this session belongs to: npm run pwa-local wraps it in one; run directly, it opens its own.
  const attached = attachRun();
  let session = attached;
  if (!session) {
    try {
      session = startRun('server-pwa-local', { command: ['node scripts/pwa-local.mjs', ...args].join(' '), cwd: APP });
    } catch {
      session = null;
    }
  }
  const startedAt = Date.now();
  let requests = 0;
  const phones = new Set();
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
  };
  const fail = (msg) => {
    console.error(`\npwa-local: ${msg}`);
    session?.event('error', msg, { global: true });
    if (session && !attached) session.finish({ exitCode: 1 });
    process.exit(1);
  };
  const run = (cmd, cmdArgs) => {
    const t = Date.now();
    session?.event('build', `${cmd} ${cmdArgs.join(' ')}`);
    const res = spawnSync(cmd, cmdArgs, { cwd: APP, stdio: 'inherit' });
    if (res.status !== 0) fail(`${cmd} ${cmdArgs.join(' ')} failed (exit ${res.status ?? res.signal})`);
    session?.event('build', `done in ${duration(Date.now() - t)}`);
  };

  const portText = flag('port') ?? process.env.PWA_LOCAL_PORT ?? '4400';
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`--port ${portText} is not a port number`);

  if (!args.includes('--no-build')) {
    run('node', ['scripts/sync-legacy.mjs']);
    run('npx', ['ng', 'build', '--configuration', 'production,local']);
  }
  let version;
  try {
    writePages();
    version = checkPwaBuild({
      pageFile: join(PAGES_DIR, 'index.html'),
      out: OUT,
      name: 'dist/pwa-local/',
      baseHref: BASE_HREF,
      rerun: 'run npm run pwa-local',
    });
  } catch (err) {
    fail(err.message);
  }

  const server = createStaticServer(OUT, (line) => {
    console.log(`  ${new Date().toTimeString().slice(0, 8)} ${line}`);
    session?.event('request', line);
    requests++;
    if (/ (iPhone|iPad)$/.test(line)) phones.add(line.split(' ').at(-2));
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') fail(`port ${port} is in use; pick another with npm run pwa-local -- --port <n>`);
    fail(err.message);
  });
  server.listen(port, () => {
    const [phone, ...rest] = addresses(port);
    console.log(`\npwa-local: serving ia-version ${version} from dist/pwa-local/`);
    console.log(`  this Mac   http://localhost:${port}/`);
    if (phone) console.log(`  iPhone     ${phone}   (same Wi-Fi; Share > Add to Home Screen)`);
    for (const url of rest) console.log(`  also       ${url}`);
    console.log('  Ctrl-C to stop. The home screen app works only while this runs and the phone is on this network.\n');
    session?.event('server', `serving ia-version ${version} on http://localhost:${port}/${phone ? ` and ${phone}` : ''}`, { global: true });
  });
  process.on('SIGINT', () => {
    server.close();
    server.closeAllConnections();
    console.log('\npwa-local: stopped');
    session?.event('server', `stopped after ${duration(Date.now() - startedAt)}; served ${requests} requests${phones.size ? ` (iPhone or iPad from ${[...phones].join(', ')})` : ''}`, { global: true });
    if (session && !attached) session.finish({ stopped: true, signal: 'SIGINT' });
    process.exit(0);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
