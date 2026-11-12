#!/usr/bin/env node
// Landing: a chat's branch reaches origin/dev through local dev in ONE step (CLAUDE.md Pipeline, "One chat per worktree";
// Mario, Post-v0.256.0: "i only want to push to dev changes that are made in the chat i built it in").
//
//   node tools/land.mjs            from the chat's worktree, on its chat/<work> branch, when Mario says push:
//                                  fetch, refuse if local dev holds unpushed commits or the branch is not on top of dev
//                                  or its commits come from more than one chat, then fast-forward local dev to the
//                                  branch and push origin dev, as one step. Nothing unpushed is ever left on dev.
//   node tools/land.mjs --dry-run  the same checks, nothing moved.
//   node tools/land.mjs --guard <remote_sha> <local_sha>
//                                  what .githooks/pre-push runs on a push of dev: the new commits must come from one
//                                  chat (their `Chat:` trailers), or IA_PUSH_ALL=1 says Mario wants them together.
//   node tools/land.mjs --tag v<version>
//                                  after Mario has merged the release into main: tag what merged and push the tag, from
//                                  the main checkout (a worktree never pushes, and the push hook lets a tag through only
//                                  there; Mario, Post-v0.261.5). Makes the tag on origin/main when there is none, and
//                                  refuses unless the commit it names carries that version and is on main. A tag GitHub
//                                  already holds is never moved. --dry-run checks and moves nothing.
//
// A chat is named by its branch: chat/<work> writes the trailer `Chat: <work>` on every commit (.githooks/prepare-commit-msg).
// The judges below are pure and tested by hand tables in tests/unit/landing.test.ts; the git calls are at the bottom.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

// The version rule (CLAUDE.md PRIORITY 1): a version is read and compared only through tests/semver.js.
const SV = createRequire(import.meta.url)('../tests/semver.js');

/** The chat a commit message names, or null. */
export function chatOf(message) {
  const m = /^Chat:[ \t]*(.+?)[ \t]*$/m.exec(message || '');
  return m ? m[1] : null;
}
/** The distinct chats a list of commit messages comes from; a message with no trailer counts as its own chat. */
export function distinctChats(messages) {
  return [...new Set(messages.map((m) => chatOf(m) || '(no Chat trailer)'))];
}
/** A push of dev carries one chat's work, unless `all` (IA_PUSH_ALL=1) says Mario wants several together. */
export function judgePush(messages, opts = {}) {
  const chats = distinctChats(messages);
  if (chats.length <= 1 || opts.all) return { ok: true, chats };
  return { ok: false, chats, reason: `these ${messages.length} commits come from ${chats.length} chats (${chats.join(', ')}); a push carries one chat's work. IA_PUSH_ALL=1 pushes them together on purpose.` };
}
/**
 * Whether a chat branch may land on dev now. `s`: { branch, isChatBranch, devSha, originDevSha, devAhead, devBehind,
 * branchHasDev, newMessages }.
 */
export function judgeLanding(s, opts = {}) {
  if (!s.isChatBranch) return { ok: false, reason: `${s.branch} is not a chat branch; a chat works on chat/<work> in its own worktree` };
  if (s.devSha !== s.originDevSha && !opts.all) {
    return { ok: false, reason: `local dev is not origin/dev (${s.devAhead} ahead, ${s.devBehind} behind): it holds commits that were never pushed. Land them from their own chat first, or IA_PUSH_ALL=1 to carry them with yours on purpose.` };
  }
  if (!s.branchHasDev) return { ok: false, reason: `${s.branch} is not on top of dev; rebase first (git rebase dev), run the check, then land again` };
  if (!s.newMessages.length) return { ok: false, reason: 'nothing to land: the branch has no commits dev lacks' };
  const p = judgePush(s.newMessages, opts);
  return p.ok ? { ok: true, chats: p.chats, n: s.newMessages.length } : p;
}

/** A release tag is a lowercase v and three dotted integers (v0.261.5): never V<N>, never a bare number. */
export function isReleaseTag(name) {
  return /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(String(name));
}
const sameVersion = (a, b) => { try { return SV.cmp(SV.parse(a), SV.parse(b)) === 0; } catch { return false; } };
const short = (sha) => String(sha).slice(0, 7);
/**
 * Whether a release tag may be made and pushed now. `s`: { name, mainSha, mainVersion (the ia-version origin/main
 * carries, as written, or null), local (the tag in this clone: { sha, version, onMain }, or null), remoteSha (the commit
 * GitHub's tag names, or null) }. Returns { ok, action: 'create' | 'push' | 'none', sha }, or { ok: false, reason }.
 */
export function judgeTag(s) {
  if (!isReleaseTag(s.name)) return { ok: false, reason: `${s.name} is not a release tag; a release is tagged v<MAJOR.MINOR.PATCH>, as v0.261.5` };
  if (s.remoteSha) {
    if (s.local && s.local.sha === s.remoteSha) return { ok: true, action: 'none', sha: s.remoteSha };
    return { ok: false, reason: `GitHub already holds ${s.name} at ${short(s.remoteSha)}, and ${s.local ? `the tag here names ${short(s.local.sha)}` : 'there is no such tag here'}; a pushed tag is never moved` };
  }
  if (s.local) {
    if (!sameVersion(s.local.version, s.name)) return { ok: false, reason: `the tag ${s.name} here names ${short(s.local.sha)}, which carries ia-version ${s.local.version ?? 'none'}; a tag names a commit that carries its version` };
    if (!s.local.onMain) return { ok: false, reason: `the tag ${s.name} here names ${short(s.local.sha)}, which is not on origin/main; a release is tagged on what Mario merged` };
    return { ok: true, action: 'push', sha: s.local.sha };
  }
  if (!sameVersion(s.mainVersion, s.name)) return { ok: false, reason: `origin/main (${short(s.mainSha)}) carries ia-version ${s.mainVersion ?? 'none'}, not ${s.name.slice(1)}; a release is tagged after Mario has merged it` };
  return { ok: true, action: 'create', sha: s.mainSha };
}

// ── git ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const messages = (range, cwd) => git(['log', '--format=%B%x00', range], cwd).split('\0').map((m) => m.trim()).filter(Boolean);

const HEAD_HTML = 'frontends/app/src/legacy/src/html/head.html';
const quiet = (args, cwd) => { try { return git(args, cwd) || null; } catch { return null; } };

/** `--tag v<version>`: tags what merged and pushes the tag from the main checkout. */
function tagRelease(name, dry) {
  if (!isReleaseTag(name)) { console.error(`land: refused. ${judgeTag({ name: String(name) }).reason}`); return 1; }
  const here = git(['rev-parse', '--show-toplevel']);
  const main = dirname(resolve(here, git(['rev-parse', '--git-common-dir'])));
  const ref = `refs/tags/${name}`;
  git(['fetch', 'origin', '--quiet'], main);
  const mainSha = git(['rev-parse', 'refs/remotes/origin/main'], main);
  const versionAt = (sha) => { const html = quiet(['show', `${sha}:${HEAD_HTML}`], main); try { return html ? SV.str(SV.fromHtml(html)) : null; } catch { return null; } };
  const localSha = quiet(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], main);
  let onMain = false;
  if (localSha) { try { execFileSync('git', ['merge-base', '--is-ancestor', localSha, mainSha], { cwd: main, stdio: 'ignore' }); onMain = true; } catch { onMain = false; } }
  // An annotated tag lists twice, the second line (ref^{}) naming its commit; a lightweight one lists once.
  const listed = (quiet(['ls-remote', '--tags', 'origin', ref, `${ref}^{}`], main) || '').split('\n').filter(Boolean).map((l) => l.split(/\s+/));
  const remoteSha = (listed.find((l) => l[1] === `${ref}^{}`) || listed[0] || [null])[0];
  const v = judgeTag({ name, mainSha, mainVersion: versionAt(mainSha), local: localSha ? { sha: localSha, version: versionAt(localSha), onMain } : null, remoteSha });
  if (!v.ok) { console.error(`land: refused. ${v.reason}`); return 1; }
  if (v.action === 'none') { console.log(`land: ${name} is already on GitHub at ${short(v.sha)}; nothing to do`); return 0; }
  console.log(`land: ${name} ${v.action === 'create' ? 'will name' : 'names'} ${short(v.sha)} on origin/main${dry ? ' (dry run, nothing moved)' : ''}`);
  if (dry) return 0;
  if (v.action === 'create') git(['tag', name, v.sha], main);
  execFileSync('git', ['push', 'origin', ref], { cwd: main, stdio: 'inherit', env: { ...process.env } });
  console.log(`land: ${name} is pushed.`);
  return 0;
}

function main(argv) {
  const all = process.env.IA_PUSH_ALL === '1';
  const t = argv.indexOf('--tag');
  if (t !== -1) return tagRelease(argv[t + 1], argv.includes('--dry-run'));
  if (argv[0] === '--guard') {
    const [, remote, local] = argv;
    const range = /^0+$/.test(remote || '') ? local : `${remote}..${local}`;
    const v = judgePush(messages(range, process.cwd()), { all });
    if (!v.ok) { console.error(`pre-push: refused. ${v.reason}`); return 1; }
    return 0;
  }
  const dry = argv.includes('--dry-run');
  const here = git(['rev-parse', '--show-toplevel']);
  const common = resolve(here, git(['rev-parse', '--git-common-dir']));
  const main = dirname(common);
  if (resolve(main) === resolve(here)) { console.error('land: run this from the chat\'s worktree, not the main checkout; the main checkout holds dev and nothing else'); return 1; }
  const branch = git(['branch', '--show-current']);
  git(['fetch', 'origin', '--quiet'], main);
  const devSha = git(['rev-parse', 'refs/heads/dev'], main), originDevSha = git(['rev-parse', 'refs/remotes/origin/dev'], main);
  const [devAhead, devBehind] = git(['rev-list', '--left-right', '--count', 'dev...origin/dev'], main).split(/\s+/).map(Number);
  let branchHasDev = true; try { execFileSync('git', ['merge-base', '--is-ancestor', devSha, 'HEAD'], { cwd: here, stdio: 'ignore' }); } catch { branchHasDev = false; }
  const v = judgeLanding({ branch, isChatBranch: /^chat\//.test(branch), devSha, originDevSha, devAhead, devBehind, branchHasDev, newMessages: messages(`${devSha}..HEAD`, here) }, { all });
  if (!v.ok) { console.error(`land: refused. ${v.reason}`); return 1; }
  console.log(`land: ${v.n} commit(s) from ${v.chats.join(', ')} on ${branch}${dry ? ' (dry run, nothing moved)' : ''}`);
  if (dry) return 0;
  git(['merge', '--ff-only', branch], main);
  execFileSync('git', ['push', 'origin', 'dev'], { cwd: main, stdio: 'inherit', env: { ...process.env } });
  console.log(`land: dev is ${git(['rev-parse', '--short', 'dev'], main)}, pushed. Mario reviews CI and opens the pull request himself.`);
  return 0;
}

if (process.argv[1] && /land\.mjs$/.test(process.argv[1])) process.exit(main(process.argv.slice(2)));
