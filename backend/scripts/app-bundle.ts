#!/usr/bin/env node
// Writes the app into app-web/, which the server serves at /app/: the page built from the app's source files
// (frontends/app/src/legacy/src, by frontends/app/scripts/build-index.mjs, the one builder; exactly what GitHub Pages
// deploys) and its icon. So one backend gives the website, the admin and the app itself, until the store builds exist.
// app-web/ is git-ignored: it is made here for local runs and the docker image (npm run docker:up and mac-local-backend
// run this first), and scripts/heroku.sh deploy adds the same two files, built from the commit it deploys. Nothing is
// written outside app-web/ (the dev container mounts the repo read-only).
//
//   node scripts/app-bundle.ts        (npm run app:bundle)
//
// APP_SOURCE_DIR is the repo root (the folder above backend/ by default). With the builder there, the page is built;
// with a ready index.html there instead (the deploy test's folder), it is copied; on Heroku, with neither, the
// app-web/ the deploy brought is kept, and it says so. APP_BUNDLE_DIR moves app-web/.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BACKEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(process.env.APP_SOURCE_DIR || join(BACKEND, '..'));
const OUT = resolve(process.env.APP_BUNDLE_DIR || join(BACKEND, 'app-web'));
const APP_FILES = ['index.html', 'apple-touch-icon.png'];

/** The ia-version the page declares, as written (239 before the semver switch, 0.239.1 and on after it), or ''. */
function appVersionOf(html: string): string {
  return /<meta name="ia-version" content="([^"]*)"/.exec(html)?.[1] ?? '';
}

const say = (msg: string) => console.log(`app-bundle: ${msg}`);

/** The one builder, beside the sources in a checkout (absent on Heroku, where backend/ is deployed alone). */
const BUILDER = join(SOURCE, 'frontends', 'app', 'scripts', 'build-index.mjs');
interface Builder {
  buildIndex(srcDir?: string): Buffer;
  SOURCES: string;
  ICON: string;
}

if (existsSync(BUILDER)) {
  const { buildIndex, SOURCES, ICON } = (await import(pathToFileURL(BUILDER).href)) as Builder;
  const page = buildIndex(SOURCES);
  // Refreshed in place, each file written beside itself and renamed over the old one (see below).
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'index.html.tmp'), page);
  renameSync(join(OUT, 'index.html.tmp'), join(OUT, 'index.html'));
  copyFileSync(ICON, join(OUT, 'apple-touch-icon.png.tmp'));
  renameSync(join(OUT, 'apple-touch-icon.png.tmp'), join(OUT, 'apple-touch-icon.png'));
  for (const stale of readdirSync(OUT).filter((f) => !APP_FILES.includes(f))) rmSync(join(OUT, stale), { recursive: true, force: true });
  say(`built app ${appVersionOf(page.toString('utf8')) || '(no ia-version)'} from the source files into ${OUT}`);
  process.exit(0);
}

if (!existsSync(join(SOURCE, 'index.html'))) {
  if (existsSync(join(OUT, 'index.html'))) {
    say(`no ${join(SOURCE, 'index.html')} here; keeping the bundled app ${appVersionOf(readFileSync(join(OUT, 'index.html'), 'utf8'))}`);
  } else {
    say(`no app to bundle (${join(SOURCE, 'index.html')} is missing); /app/ will answer 503`);
  }
  process.exit(0);
}

// The folder is refreshed in place, never deleted and made again. npm run dev's container mounts app-web/ from this
// Mac, and a mount holds the folder it was given, not its path: delete it and the container keeps the deleted, empty
// one, so /app/ answers 503 while the files sit right here. Each file is copied beside itself and renamed over the old
// one, so the server never reads half a page.
mkdirSync(OUT, { recursive: true });
for (const file of APP_FILES) {
  if (existsSync(join(SOURCE, file))) {
    copyFileSync(join(SOURCE, file), join(OUT, `${file}.tmp`));
    renameSync(join(OUT, `${file}.tmp`), join(OUT, file));
  } else if (file === 'index.html') {
    throw new Error(`missing ${file}`);
  } else {
    rmSync(join(OUT, file), { force: true });
  }
}
for (const stale of readdirSync(OUT).filter((f) => !APP_FILES.includes(f))) rmSync(join(OUT, stale), { recursive: true, force: true });
say(`bundled app ${appVersionOf(readFileSync(join(OUT, 'index.html'), 'utf8')) || '(no ia-version)'} into ${OUT}`);
