// The check both web build paths share (scripts/pwa-pages.mjs and scripts/pwa-local.mjs): proves a build folder is a
// complete build of the app's page (the build of the sources, dist-github-pages/index.html) for one base href. It
// throws; the caller decides how to exit.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isVersion, metaVersion, sameVersion } from './version.mjs';

function countOf(haystack, needle) {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) n++;
  return n;
}

/**
 * Throws unless `out` holds a complete build of the page in `pageFile` with `<base href="${baseHref}">`. `name` is how messages
 * refer to the folder and `rerun` is the command that rebuilds it. Returns the ia-version it found.
 */
export function checkPwaBuild({ pageFile, out, name, baseHref, rerun }) {
  const fail = (msg) => {
    throw new Error(msg);
  };
  const root = readFileSync(pageFile, 'utf8');
  const sha256 = createHash('sha256').update(root).digest('hex');
  const version = metaVersion(root);
  if (version === null) fail('the page has no <meta name="ia-version">');

  const indexPath = join(out, 'index.html');
  if (!existsSync(indexPath)) fail(`no build in ${name}; ${rerun}`);
  const index = readFileSync(indexPath, 'utf8');

  // sync-legacy.mjs stamps the source's version and sha256 into the page it generates.
  const banner = index.match(/from the page built from src\/legacy\/src \(ia-version ([^,\s]+), sha256 ([0-9a-f]{64})\)/);
  if (!banner || !isVersion(banner[1])) fail(`${name}index.html has no generated banner; ${rerun}`);
  if (banner[2] !== sha256) {
    const built = sameVersion(banner[1], version) ? `an older copy of ia-version ${version}` : `ia-version ${banner[1]}`;
    fail(`${name} was built from ${built}, but the page is ia-version ${version} as it stands; ${rerun}`);
  }
  if (countOf(index, `<meta name="ia-version" content="${version}">`) !== 1) fail(`${name}index.html carries the wrong ia-version`);
  if (countOf(index, `<base href="${baseHref}">`) !== 1) fail(`${name}index.html does not set <base href="${baseHref}">`);

  // Every file the page loads must be in the build: a partial build would 404 on the phone.
  const refs = [...index.matchAll(/\s(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => ref !== baseHref && !/^[a-z]+:/.test(ref));
  for (const ref of refs) {
    if (!existsSync(join(out, ref.split(/[?#]/)[0]))) fail(`${name}index.html loads ${ref}, which is not in ${name}; ${rerun}`);
  }

  // The app script is the page's inline <script>, byte for byte, and the bundle asks for this version of it.
  const appJsPath = join(out, 'legacy', 'app.js');
  if (!existsSync(appJsPath)) fail(`no ${name}legacy/app.js; ${rerun}`);
  if (countOf(root, `<script>${readFileSync(appJsPath, 'utf8')}</script>`) !== 1) {
    fail(`${name}legacy/app.js is not the page's script; ${rerun}`);
  }
  const scriptUrl = `legacy/app.js?v=${version}-${sha256.slice(0, 12)}`;
  const bundles = readdirSync(out).filter((f) => /^main-[A-Z0-9]+\.js$/.test(f));
  if (bundles.length !== 1) fail(`expected one main-*.js in ${name}, found ${bundles.length}; ${rerun}`);
  if (!readFileSync(join(out, bundles[0]), 'utf8').includes(scriptUrl)) {
    fail(`${bundles[0]} does not load ${scriptUrl}; ${rerun}`);
  }
  return version;
}
