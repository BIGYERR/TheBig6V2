// Landing: a chat's branch reaches origin/dev through local dev in one step, and a push of dev carries one chat's commits
// (CLAUDE.md Pipeline, "One chat per worktree"; Mario, Post-v0.256.0). The judges in tools/land.mjs are pure; the hand
// tables below are the rule as written, never read from git.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Landing { chatOf(m: string): string | null; distinctChats(m: string[]): string[]; judgePush(m: string[], o?: { all?: boolean }): { ok: boolean; chats: string[]; reason?: string }; judgeLanding(s: Record<string, unknown>, o?: { all?: boolean }): { ok: boolean; reason?: string; chats?: string[]; n?: number }; isReleaseTag(name: unknown): boolean; judgeTag(s: Record<string, unknown>): { ok: boolean; action?: string; sha?: string; reason?: string }; installsAfter(files: string[]): string[] }
const L = (await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'land.mjs')).href)) as Landing;

const A = 'v0.256.0: the leg day before a tier A long run is a maintenance day\n\nBody.\n\nChat: leg-day-volume';
const A2 = 'docs: Post-v0.256.0 D274 ruled\n\nChat: leg-day-volume\n';
const B = 'docs: the deck opens Lift first\n\nChat: swipe-deck';
const NONE = 'docs: an old commit with no trailer';

test('the Chat trailer is read from the last line and nowhere else', () => {
  assert.equal(L.chatOf(A), 'leg-day-volume');
  assert.equal(L.chatOf(A2), 'leg-day-volume');
  assert.equal(L.chatOf('a title\n\nnot a trailer: Chat: x in the body'), null);
  assert.equal(L.chatOf(NONE), null);
  assert.equal(L.chatOf(''), null);
});

test('distinct chats: one chat twice is one; a commit without a trailer is its own chat', () => {
  assert.deepEqual(L.distinctChats([A, A2]), ['leg-day-volume']);
  assert.deepEqual(L.distinctChats([A, B]), ['leg-day-volume', 'swipe-deck']);
  assert.deepEqual(L.distinctChats([A, NONE]), ['leg-day-volume', '(no Chat trailer)']);
  assert.deepEqual(L.distinctChats([]), []);
});

test('a push carries one chat: two of one chat pass, two chats refuse, IA_PUSH_ALL passes them together, no trailers at all pass', () => {
  assert.equal(L.judgePush([A, A2]).ok, true);
  const r = L.judgePush([A, B]);
  assert.equal(r.ok, false);
  assert.match(String(r.reason), /2 chats \(leg-day-volume, swipe-deck\)/);
  assert.match(String(r.reason), /IA_PUSH_ALL=1/);
  assert.equal(L.judgePush([A, B], { all: true }).ok, true);
  assert.equal(L.judgePush([NONE, NONE]).ok, true, 'the transition: commits made before the trailer existed');
  assert.equal(L.judgePush([]).ok, true, 'an empty push is not refused here; git itself has nothing to send');
});

const S = (over: Record<string, unknown> = {}) => ({ branch: 'chat/leg-day-volume', isChatBranch: true, devSha: 'aaa', originDevSha: 'aaa', devAhead: 0, devBehind: 0, branchHasDev: true, newMessages: [A, A2], ...over });

test('landing: a chat branch on top of a pushed dev with its own commits lands', () => {
  const r = L.judgeLanding(S());
  assert.deepEqual(r, { ok: true, chats: ['leg-day-volume'], n: 2 });
});

test('landing refuses: not a chat branch; dev holds unpushed commits; the branch is behind dev; nothing new; two chats on the branch', () => {
  assert.match(String(L.judgeLanding(S({ branch: 'dev', isChatBranch: false })).reason), /not a chat branch/);
  const unp = L.judgeLanding(S({ originDevSha: 'bbb', devAhead: 3, devBehind: 0 }));
  assert.equal(unp.ok, false);
  assert.match(String(unp.reason), /3 ahead, 0 behind/);
  assert.match(String(L.judgeLanding(S({ branchHasDev: false })).reason), /rebase first/);
  assert.match(String(L.judgeLanding(S({ newMessages: [] })).reason), /nothing to land/);
  assert.match(String(L.judgeLanding(S({ newMessages: [A, B] })).reason), /2 chats/);
});

test('IA_PUSH_ALL=1 is the one deliberate exception: unpushed dev commits and a second chat ride along, but a stale branch still rebases first', () => {
  assert.equal(L.judgeLanding(S({ originDevSha: 'bbb', devAhead: 3, devBehind: 0, newMessages: [A, B] }), { all: true }).ok, true);
  assert.equal(L.judgeLanding(S({ branchHasDev: false }), { all: true }).ok, false);
});

// The release tag (Mario, Post-v0.261.5): after his merge, `land.mjs --tag v<version>` tags what merged and pushes the tag
// from the main checkout. Shas here are made up; the versions are the ones a head.html would carry.
const MAIN = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const T = (over: Record<string, unknown> = {}) => ({ name: 'v0.261.5', mainSha: MAIN, mainVersion: '0.261.5', local: null, remoteSha: null, ...over });

test('a release tag is a lowercase v and three dotted integers, nothing else', () => {
  for (const ok of ['v0.261.5', 'v1.0.0', 'v0.240.0', 'v10.20.30']) assert.equal(L.isReleaseTag(ok), true, ok);
  for (const bad of ['V240', 'v240', '0.261.5', 'V0.261.5', 'v0.261', 'v0.261.5.1', 'v0.261.5-rc1', 'v01.2.3', '--force', 'v0.261.5 ', '', undefined]) {
    assert.equal(L.isReleaseTag(bad), false, String(bad));
  }
});

test('tag: with no tag anywhere and main carrying the version, the tag is made on origin/main', () => {
  assert.deepEqual(L.judgeTag(T()), { ok: true, action: 'create', sha: MAIN });
});

test('tag: a tag already made here on main, carrying its version, is pushed where it is', () => {
  assert.deepEqual(L.judgeTag(T({ local: { sha: MAIN, version: '0.261.5', onMain: true } })), { ok: true, action: 'push', sha: MAIN });
  // Main has moved on by a docs merge since: the tag still names the merge that carried the release.
  assert.deepEqual(L.judgeTag(T({ mainVersion: '0.261.6', local: { sha: OLD, version: '0.261.5', onMain: true } })), { ok: true, action: 'push', sha: OLD });
});

test('tag: one GitHub already holds at the same commit needs nothing', () => {
  assert.deepEqual(L.judgeTag(T({ local: { sha: MAIN, version: '0.261.5', onMain: true }, remoteSha: MAIN })), { ok: true, action: 'none', sha: MAIN });
});

test('tag refuses: before the merge; a name that is not a release tag; a tag off main; a tag on another version; a pushed tag that would move', () => {
  const unmerged = L.judgeTag(T({ mainVersion: '0.261.4' }));
  assert.equal(unmerged.ok, false);
  assert.match(String(unmerged.reason), /origin\/main \(aaaaaaa\) carries ia-version 0\.261\.4, not 0\.261\.5/);
  assert.match(String(L.judgeTag(T({ mainVersion: null })).reason), /carries ia-version none/);
  assert.match(String(L.judgeTag(T({ name: 'V262' })).reason), /V262 is not a release tag/);
  assert.match(String(L.judgeTag(T({ local: { sha: OLD, version: '0.261.5', onMain: false } })).reason), /bbbbbbb, which is not on origin\/main/);
  assert.match(String(L.judgeTag(T({ local: { sha: OLD, version: '0.261.4', onMain: true } })).reason), /bbbbbbb, which carries ia-version 0\.261\.4/);
  const moved = L.judgeTag(T({ local: { sha: MAIN, version: '0.261.5', onMain: true }, remoteSha: OLD }));
  assert.equal(moved.ok, false);
  assert.match(String(moved.reason), /GitHub already holds v0\.261\.5 at bbbbbbb.*a pushed tag is never moved/);
  assert.match(String(L.judgeTag(T({ remoteSha: OLD })).reason), /there is no such tag here/);
});

// Post-v0.262.0: the native spike chat added a package to the Expo app. Its worktree had installed it; the main
// checkout, which every other worktree borrows from, had not, and nothing said so. The landing now names each folder.
test('a landing names every folder whose lockfile it changed, and no other', () => {
  assert.deepEqual(L.installsAfter(['frontends/native/package-lock.json', 'frontends/native/package.json', 'tests/unit/native-shell.test.ts']), ['frontends/native']);
  assert.deepEqual(L.installsAfter(['tests/package-lock.json', 'package-lock.json', 'backend/package-lock.json', 'backend/package-lock.json']), ['.', 'backend', 'tests']);
  assert.deepEqual(L.installsAfter(['frontends/native/package.json', 'docs/package-lock.json.md', 'tools/my-package-lock.json', 'IRON_ASYLUM_HANDOFF_1_1.md']), []);
  assert.deepEqual(L.installsAfter([]), []);
});
