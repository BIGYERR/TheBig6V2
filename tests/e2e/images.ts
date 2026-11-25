// Which e2e images may go. Every checkout builds its own three images, under a compose project named after a hash of
// its e2e folder (launch.ts), so two chats never share containers, images or a port. A chat's worktree is removed when
// the chat is done (CLAUDE.md, A finished chat closes its worktree), and nothing else ever touched its images again:
// on 2026-11-24, 273 images and the 45 GB of build cache behind them had piled up and the disk filled. launch.ts asks
// these functions which projects no checkout owns any more, and removes their images before it builds its own.
import { createHash } from 'node:crypto';
import { join } from 'node:path';

/** Every e2e compose project's name starts with this; nothing else's does. */
export const E2E_PREFIX = 'iron-asylum-e2e-';

/** The compose project of the checkout whose e2e folder this is. */
export function e2eProject(e2eDir: string): string {
  return `${E2E_PREFIX}${createHash('sha256').update(e2eDir).digest('hex').slice(0, 8)}`;
}

/**
 * The projects of every checkout git still knows, read from `git worktree list --porcelain` (one `worktree <path>`
 * line per checkout, the main one first), and always the running checkout's own, whatever git says.
 */
export function liveProjects(worktreeList: string, current: string): Set<string> {
  const live = new Set<string>([current]);
  for (const line of worktreeList.split('\n')) {
    if (line.startsWith('worktree ')) live.add(e2eProject(join(line.slice('worktree '.length), 'tests', 'e2e')));
  }
  return live;
}

/**
 * The e2e projects among these image labels (`com.docker.compose.project`, one per image) that no live checkout owns,
 * each once, in order. Another compose project's images (the dev container's) are never named.
 */
export function staleProjects(labels: string[], live: Set<string>): string[] {
  const stale = new Set<string>();
  for (const raw of labels) {
    const label = raw.trim();
    if (label.startsWith(E2E_PREFIX) && !live.has(label)) stale.add(label);
  }
  return [...stale].sort();
}
