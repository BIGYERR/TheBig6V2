#!/usr/bin/env node
// The GitHub Pages deploy proof (CLAUDE.md, session rhythm step 7) as one logged run, temp/runs/<stamp>-deploy-pages/.
// A push is not a deploy: this proves, in order, and never infers a later step from an earlier one,
//   1. the remote has it:   origin/main's page carries the ia-version (its meta, in html/head.html of the sources; an
//                           older main's root index.html), since work happens on dev and reaches main only by a pull
//                           request, so origin/main is what deploys; a local main may lag behind it
//   2. Pages deployed THAT commit: with the source "GitHub Actions", the pipeline's Pages deployment of it succeeded;
//                           with the source "branch main" (until the switch, handoff §12), Pages built it (if its last
//                           build is another commit, it asks for a build); either way it waits, up to 5 minutes
//   3. the live URL serves it (cache-busted, since Pages answers with max-age=600)
// and reports the live number it read back.
//
//   node tools/deploy-check.mjs                    prove the current origin/main is live
//   node tools/deploy-check.mjs --expect 0.240.0   and that it is ia-version 0.240.0 (a bare 240 reads as 0.240.0)
//   node tools/deploy-check.mjs --no-force         never ask Pages for a build; a stale build fails instead
//
// Exit 0 only when all three hold. Needs git, and gh logged in (gh auth status); in GitHub Actions, GH_TOKEN.
// The pipeline runs it after every merge into main (.github/workflows/pipeline.yml, "deploy proof").
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { attachRun, startRun } from './runlog.mjs';

/** ia-version is read and compared only through tests/semver.js (CommonJS): MAJOR.MINOR.PATCH, a bare N reads as 0.N.0. */
const SV = createRequire(import.meta.url)('../tests/semver.js');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const expect = (() => {
  const i = args.indexOf('--expect');
  return i >= 0 ? args[i + 1] : null;
})();

const attached = attachRun();
let run = attached;
if (!run) {
  try {
    run = startRun('deploy-pages', { command: ['node tools/deploy-check.mjs', ...args].join(' ') });
  } catch {
    run = null;
  }
}

const say = (subject, text, global = false) => {
  console.log(`deploy: ${text}`);
  run?.event(subject, text, { global });
};
const sh = (cmd, cmdArgs) =>
  execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, maxBuffer: 64 * 1024 * 1024 }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (sha) => sha.slice(0, 7);
const VERSION = /<meta name="ia-version" content="([^"]*)"/;
const parses = (v) => {
  try {
    SV.parse(v);
    return true;
  } catch {
    return false;
  }
};
/** Both sides parse and name one version (SV.cmp === 0): 239 and 0.239.0 are the same. Messages print them as written. */
const same = (a, b) => parses(a) && parses(b) && SV.cmp(a, b) === 0;

function done(code, text) {
  say(code === 0 ? 'deploy' : 'fail', text, true);
  if (run && !attached) run.finish({ exitCode: code, details: [text] });
  process.exit(code);
}

async function main() {
  // The repo on GitHub, from origin's URL: github.com[:/]owner/repo(.git)
  const origin = sh('git', ['remote', 'get-url', 'origin']);
  const m = /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/.exec(origin);
  if (!m) return done(1, `origin is not a GitHub repo (${origin})`);
  const [, owner, repo] = m;
  const live = `https://${owner.toLowerCase()}.github.io/${repo}/`;

  // 1. the remote has it
  sh('git', ['fetch', '--quiet', 'origin', 'main']);
  const remote = sh('git', ['rev-parse', 'origin/main']);
  // In GitHub Actions (the deploy proof after a merge) a newer merge may already be on main; this proves main as it is.
  const pushed = process.env.GITHUB_ACTIONS === 'true' ? process.env.GITHUB_SHA : '';
  if (pushed && pushed !== remote) say('remote', `main moved on since ${short(pushed)}; proving ${short(remote)}, its newest commit`);
  const showable = (path) => {
    try {
      return sh('git', ['show', `origin/main:${path}`]);
    } catch {
      return null;
    }
  };
  const HEAD_HTML = 'frontends/app/src/legacy/src/html/head.html';
  const [where, text] = showable(HEAD_HTML) !== null ? [HEAD_HTML, showable(HEAD_HTML)] : ['index.html', showable('index.html') ?? ''];
  const remoteVersion = VERSION.exec(text)?.[1];
  if (remoteVersion === undefined) return done(1, `origin/main:${where} has no ia-version meta`);
  if (!parses(remoteVersion)) return done(1, `origin/main:${where} ia-version "${remoteVersion}" is not a version (want N or M.m.p)`);
  if (expect && !parses(expect)) return done(1, `--expect ${expect} is not a version (want N or M.m.p)`);
  if (expect && !same(remoteVersion, expect)) return done(1, `origin/main is ia-version ${remoteVersion}, not ${expect}`);
  say('remote', `origin/main ${short(remote)} carries ia-version ${remoteVersion}`);

  // 2. Pages deployed THAT commit
  const source = sh('gh', ['api', `repos/${owner}/${repo}/pages`, '--jq', '.build_type']);
  if (source === 'workflow') {
    // The pipeline's "Pages" job deploys dist-github-pages/; its deployment of origin/main must have succeeded.
    const deployed = () => {
      const [id, sha] = sh('gh', ['api', `repos/${owner}/${repo}/deployments?environment=github-pages&per_page=1`, '--jq', '.[0] | "\(.id) \(.sha)"']).split(' ');
      const state = id && id !== 'null' ? sh('gh', ['api', `repos/${owner}/${repo}/deployments/${id}/statuses?per_page=1`, '--jq', '.[0].state // "pending"']) : 'none';
      return { sha, state };
    };
    const until = Date.now() + 5 * 60_000;
    let d = deployed();
    while (!(d.sha === remote && d.state === 'success')) {
      if (d.sha === remote && (d.state === 'failure' || d.state === 'error')) return done(1, `the Pages deployment of ${short(remote)} ended ${d.state}`);
      if (Date.now() > until) return done(1, `Pages did not deploy ${short(remote)} within 5 minutes (last: ${short(d.sha ?? '')} ${d.state})`);
      await sleep(10_000);
      d = deployed();
    }
    say('pages', `Pages deployed ${short(remote)} from GitHub Actions`);
    return proveLive(live, remote, remoteVersion);
  }
  const api = `repos/${owner}/${repo}/pages/builds`;
  const latest = () => {
    const [status, commit] = sh('gh', ['api', `${api}/latest`, '--jq', '.status + " " + .commit']).split(' ');
    return { status, commit };
  };
  let b = latest();
  if (b.commit !== remote) {
    if (has('--no-force')) return done(1, `Pages last built ${short(b.commit)} (${b.status}), not origin/main ${short(remote)}`);
    say('pages', `Pages last built ${short(b.commit)} (${b.status}), not ${short(remote)}; asking for a build`, true);
    sh('gh', ['api', '-X', 'POST', api]);
  }
  const deadline = Date.now() + 5 * 60_000;
  while (!(b.commit === remote && b.status === 'built')) {
    if (b.status === 'errored') return done(1, `the Pages build of ${short(b.commit)} errored`);
    if (Date.now() > deadline) return done(1, `Pages did not finish building ${short(remote)} within 5 minutes (last: ${short(b.commit)} ${b.status})`);
    await sleep(10_000);
    b = latest();
  }
  say('pages', `Pages built ${short(remote)}`);
  return proveLive(live, remote, remoteVersion);
}

/** 3. the live URL serves it */
async function proveLive(live, remote, remoteVersion) {
  let liveVersion;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${live}?cb=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } });
    liveVersion = VERSION.exec(await res.text())?.[1];
    if (same(liveVersion, remoteVersion)) break;
    await sleep(10_000);
  }
  if (!same(liveVersion, remoteVersion)) return done(1, `${live} serves ia-version ${liveVersion ?? 'none'}, not ${remoteVersion}`);
  return done(0, `live: ${live} serves ia-version ${liveVersion} (commit ${short(remote)})`);
}

main().catch((err) => done(1, `the check itself failed: ${String(err.message ?? err).split('\n')[0]}`));
