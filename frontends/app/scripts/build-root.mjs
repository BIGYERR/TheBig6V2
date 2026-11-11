// Where scripts/ios.mjs puts its build products (CLAUDE.md, Native): ~/Library/Caches/iron-asylum-ios, never the repo,
// and a folder of its own for each chat's worktree. Post-v0.259.4: a chat's simulator build wrote the shared folder, and
// another session's build from the main checkout overwrote it two minutes later, so the bundle the chat read was the
// other checkout's (iOS 13.0, version 0.259.2) under a log that said its own. IOS_BUILD_DIR still wins over both.
import { join } from 'node:path';

/** A chat's worktree name when `app` (the frontends/app folder) sits inside one, else null. */
export function worktreeName(app) {
  const m = /[\\/]\.claude[\\/]worktrees[\\/]([^\\/]+)[\\/]/.exec(app);
  return m ? m[1] : null;
}

/**
 * The build folder for the app checked out at `app`.
 * @param {{ env: Record<string, string | undefined>, home: string, app: string }} s
 */
export function buildRoot({ env, home, app }) {
  if (env.IOS_BUILD_DIR) return env.IOS_BUILD_DIR;
  const shared = join(home, 'Library', 'Caches', 'iron-asylum-ios');
  const name = worktreeName(app);
  return name ? join(shared, 'worktrees', name) : shared;
}
