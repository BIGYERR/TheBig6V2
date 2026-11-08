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
//
// A chat is named by its branch: chat/<work> writes the trailer `Chat: <work>` on every commit (.githooks/prepare-commit-msg).
// The judges below are pure and tested by hand tables in tests/unit/landing.test.ts; the git calls are at the bottom.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

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

// ── git ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const messages = (range, cwd) => git(['log', '--format=%B%x00', range], cwd).split('\0').map((m) => m.trim()).filter(Boolean);

function main(argv) {
  const all = process.env.IA_PUSH_ALL === '1';
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
