// Landing: a chat's branch reaches origin/dev through local dev in one step, and a push of dev carries one chat's commits
// (CLAUDE.md Pipeline, "One chat per worktree"; Mario, Post-v0.256.0). The judges in tools/land.mjs are pure; the hand
// tables below are the rule as written, never read from git.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Landing { chatOf(m: string): string | null; distinctChats(m: string[]): string[]; judgePush(m: string[], o?: { all?: boolean }): { ok: boolean; chats: string[]; reason?: string }; judgeLanding(s: Record<string, unknown>, o?: { all?: boolean }): { ok: boolean; reason?: string; chats?: string[]; n?: number } }
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
