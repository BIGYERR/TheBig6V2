// Where the native build puts its products (scripts/build-root.mjs; CLAUDE.md, Native): ~/Library/Caches/iron-asylum-ios
// for the main checkout and CI, a folder of its own for each chat's worktree, IOS_BUILD_DIR over both. Post-v0.259.4: two
// checkouts built into the one shared folder, and the chat read the other checkout's bundle under its own log line.
// Expected paths are typed by hand.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildRoot, worktreeName } from '../../scripts/build-root.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOME = '/Users/m';
const MAIN_APP = '/Users/m/Developer/TheBig6V2/frontends/app';
const CHAT_APP = '/Users/m/Developer/TheBig6V2/.claude/worktrees/chat+ios-15-floor/frontends/app';

describe('each checkout builds the native app into a folder of its own', () => {
  it('the main checkout and CI keep the shared folder', () => {
    assert.equal(buildRoot({ env: {}, home: HOME, app: MAIN_APP }), '/Users/m/Library/Caches/iron-asylum-ios');
    assert.equal(buildRoot({ env: {}, home: '/Users/runner', app: '/Users/runner/work/TheBig6V2/TheBig6V2/frontends/app' }),
      '/Users/runner/Library/Caches/iron-asylum-ios');
  });

  it("a chat's worktree builds into worktrees/<its name> inside it", () => {
    assert.equal(worktreeName(CHAT_APP), 'chat+ios-15-floor');
    assert.equal(worktreeName(MAIN_APP), null);
    assert.equal(buildRoot({ env: {}, home: HOME, app: CHAT_APP }),
      '/Users/m/Library/Caches/iron-asylum-ios/worktrees/chat+ios-15-floor');
    const other = CHAT_APP.replace('chat+ios-15-floor', 'chat+swipe-deck');
    assert.notEqual(buildRoot({ env: {}, home: HOME, app: other }), buildRoot({ env: {}, home: HOME, app: CHAT_APP }),
      'two chats never share one');
  });

  it('IOS_BUILD_DIR wins over both', () => {
    const env = { IOS_BUILD_DIR: '/tmp/x/ios-build' };
    assert.equal(buildRoot({ env, home: HOME, app: MAIN_APP }), '/tmp/x/ios-build');
    assert.equal(buildRoot({ env, home: HOME, app: CHAT_APP }), '/tmp/x/ios-build');
  });

  it('scripts/ios.mjs takes its folder from buildRoot, with no path of its own', () => {
    const ios = readFileSync(join(APP, 'scripts', 'ios.mjs'), 'utf8');
    assert.match(ios, /const BUILD_ROOT = buildRoot\(\{ env: process\.env, home: homedir\(\), app: APP \}\);/);
    assert.doesNotMatch(ios, /'Caches', 'iron-asylum-ios'/);
  });
});
