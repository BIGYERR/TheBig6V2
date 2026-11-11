// The next D-code and the version a release may take, read across every place one can be held (CLAUDE.md, Session
// rhythm: never name a D-code before it is in the registry; Versioning: never two sessions on one number).
//
// A chat issues its D-code and writes its version on its own branch (chat/<work>), and they reach dev only when
// tools/land.mjs lands it, so the registry and the meta on dev are not the whole story. Post-v0.259.3: the iOS 15 chat
// read D280 and 0.259.2 on dev and wrote D281 and 0.259.3, while chat/swipe-deck had held both since 18:51; it landed at
// 21:20 and both were renumbered before any push. Every chat branch lives in the one repository, so this reads them all:
// origin/dev, local dev, each refs/heads/chat/*, and this working tree.
//
//   node tools/claims.mjs        prints the next free D-code, the highest version and who holds each
//
// The judge is pure (tests/unit/claims.test.ts); readClaims does the git reads. Versions go through tests/semver.js.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gitFreeEnv } from './worktree-deps.mjs';

const SV = createRequire(import.meta.url)('../tests/semver.js');

export const REGISTRY_FILE = 'IRON_ASYLUM_HANDOFF_1_1.md';
export const META_FILE = 'frontends/app/src/legacy/src/html/head.html';
export const WORKING_TREE = 'working tree';

/** The highest D-code the handoff's registry line assigns, or null when the text has no registry line. */
export function highestDCode(handoff) {
  const m = /D-CODE REGISTRY[^\n]*?highest assigned = D(\d+)\./.exec(handoff);
  return m ? Number(m[1]) : null;
}

/** The ia-version a head.html carries, as written, or null. */
export function metaVersion(head) {
  try {
    return SV.str(SV.fromHtml(head));
  } catch {
    return null;
  }
}

/**
 * What is free, given each place's claims.
 * @param {{ ref: string, dcode: number | null, version: string | null }[]} rows
 * @param {string} base the ref everything lands on (origin/dev)
 */
export function judgeClaims(rows, base = 'origin/dev') {
  const withD = rows.filter((r) => r.dcode !== null);
  const withV = rows.filter((r) => r.version !== null);
  if (!withD.length || !withV.length) throw new Error('claims: no registry line or no ia-version meta was read');
  const topD = Math.max(...withD.map((r) => r.dcode));
  let topV = withV[0].version;
  for (const r of withV) if (SV.cmp(r.version, topV) > 0) topV = r.version;
  const baseRow = rows.find((r) => r.ref === base);
  const ahead = rows.filter((r) => r.ref !== base && baseRow && (
    (r.dcode !== null && baseRow.dcode !== null && r.dcode > baseRow.dcode) ||
    (r.version !== null && baseRow.version !== null && SV.cmp(r.version, baseRow.version) > 0)));
  return {
    nextD: topD + 1,
    dHolders: withD.filter((r) => r.dcode === topD).map((r) => r.ref),
    version: topV,
    vHolders: withV.filter((r) => SV.cmp(r.version, topV) === 0).map((r) => r.ref),
    nextPatch: SV.str(SV.bump(topV, 'patch')),
    nextMinor: SV.str(SV.bump(topV, 'minor')),
    ahead: ahead.map((r) => ({ ref: r.ref, dcode: r.dcode, version: r.version })),
  };
}

/** The lines `node tools/claims.mjs` prints for a verdict. */
export function claimLines(v, base = 'origin/dev') {
  const lines = [
    `claims: next free D-code D${v.nextD} (D${v.nextD - 1} on ${v.dHolders.join(', ')})`,
    `claims: highest version ${v.version} on ${v.vHolders.join(', ')}; a PATCH would be ${v.nextPatch}, a MINOR ${v.nextMinor}`,
  ];
  lines.push(v.ahead.length
    ? `claims: held ahead of ${base}: ${v.ahead.map((r) => `${r.ref} (${r.dcode === null ? 'no registry' : `D${r.dcode}`}, ${r.version ?? 'no version'})`).join('; ')}`
    : `claims: nothing is held ahead of ${base}`);
  return lines;
}

/** Each place's claims in the repository at `repo`: origin/dev, dev, every chat branch, and the working tree. */
export function readClaims(repo) {
  const env = gitFreeEnv();
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], {
    encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024, // the handoff is over 1 MB
  });
  const show = (ref, file) => {
    try {
      return git('show', `${ref}:${file}`);
    } catch {
      return '';
    }
  };
  const refs = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/dev', 'refs/heads/dev', 'refs/heads/chat/')
    .split('\n').filter(Boolean);
  const rows = refs.map((ref) => ({ ref, dcode: highestDCode(show(ref, REGISTRY_FILE)), version: metaVersion(show(ref, META_FILE)) }));
  const read = (file) => (existsSync(join(repo, file)) ? readFileSync(join(repo, file), 'utf8') : '');
  rows.push({ ref: WORKING_TREE, dcode: highestDCode(read(REGISTRY_FILE)), version: metaVersion(read(META_FILE)) });
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (const line of claimLines(judgeClaims(readClaims(repo)))) console.log(line);
}
