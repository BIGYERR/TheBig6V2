#!/usr/bin/env node
// The deploy picture and the deploy proof (CLAUDE.md, session rhythm step 7). A push is not a deploy, and a merge is not
// a deploy: each leg is read from its own source, never inferred from another.
//
//   local    backend/package.json's version, the branch, HEAD, and how far HEAD is from origin/dev
//   dev      origin/dev's version          main     origin/main's version
//   heroku   what the live /healthz reports (cache-busted): its version and commit, and whether that is origin/main
//
//   node tools/deploy-check.mjs --picture         print the picture, wait for nothing
//   node tools/deploy-check.mjs                   and wait until Heroku serves origin/main
//   node tools/deploy-check.mjs --commit <sha>    wait until Heroku serves that commit (the pipeline passes its own)
//   --timeout <s> (default 600)   --no-fetch (read the remote refs as they are)
//
// The live URL is HEROKU_URL, else this clone's git config deploy.herokuUrl (backend/scripts/heroku.sh setup writes it).
// In CI with no HEROKU_URL it says so and passes, so the pipeline stays green until Heroku is set up.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const PICTURE = args.includes('--picture');
const TIMEOUT_S = Number(opt('--timeout')) || 600;

const git = (...a) => {
  try {
    return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};
const versionAt = (ref) => {
  const text = ref ? git('show', `${ref}:backend/package.json`) : existsSync(join(REPO, 'backend/package.json')) ? readFileSync(join(REPO, 'backend/package.json'), 'utf8') : '';
  try {
    return JSON.parse(text).version ?? 'none';
  } catch {
    return 'none';
  }
};
const short = (sha) => (sha ? sha.slice(0, 7) : 'none');

if (!args.includes('--no-fetch')) git('fetch', '--quiet', 'origin');
const url = (process.env.HEROKU_URL || git('config', '--get', 'deploy.herokuUrl')).replace(/\/$/, '');
const main = git('rev-parse', '--verify', '--quiet', 'origin/main');
const want = opt('--commit') || main;

async function live() {
  if (!url) return null;
  try {
    const res = await fetch(`${url}/healthz?cb=${Date.now()}`, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const h = await res.json();
    return { version: h.version ?? '?', commit: h.commit ?? '' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function picture(h) {
  const branch = git('branch', '--show-current') || 'detached';
  const counts = git('rev-list', '--left-right', '--count', 'HEAD...origin/dev').split(/\s+/);
  const near = counts.length === 2 ? `+${counts[0]}/-${counts[1]} origin/dev` : 'no origin/dev';
  const heroku = !url
    ? 'heroku (HEROKU_URL unset)'
    : h?.error
      ? `heroku unreachable (${h.error})`
      : `heroku ${h.version} ${short(h.commit)}${h.commit && h.commit === main ? ' (= main)' : h.commit ? ' (not main)' : ' (no commit: is runtime-dyno-metadata on?)'}`;
  return `DEPLOY  local ${versionAt(null)} (${branch} ${short(git('rev-parse', 'HEAD'))}, ${near})  dev ${versionAt('origin/dev')}  main ${versionAt('origin/main')}  ${heroku}`;
}

let h = await live();
console.log(picture(h));
if (PICTURE) process.exit(0);

if (!url) {
  if (process.env.CI) {
    console.log('::notice::HEROKU_URL is not set (gh variable set HEROKU_URL --body <url>), so there is no deploy to prove yet.');
    process.exit(0);
  }
  console.error('deploy: no live URL. Run bash backend/scripts/heroku.sh setup, or set HEROKU_URL.');
  process.exit(1);
}
if (!want) {
  console.error('deploy: no commit to wait for (no origin/main, and no --commit).');
  process.exit(1);
}

const stopAt = Date.now() + TIMEOUT_S * 1000;
while (h?.commit !== want) {
  if (Date.now() > stopAt) {
    console.error(`deploy: Heroku did not serve ${short(want)} within ${TIMEOUT_S} s; it serves ${h?.commit ? short(h.commit) : h?.error ?? 'nothing'}. Check: bash backend/scripts/heroku.sh logs`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 10_000));
  h = await live();
}
console.log(`deploy: live. ${url}/healthz reports ${short(want)}, version ${h.version}.`);
