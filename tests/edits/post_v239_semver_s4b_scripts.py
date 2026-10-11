#!/usr/bin/env python3
# Post-V239 semver, slice 4, part B: the app/ scripts that read the root index.html's ia-version go through
# scripts/version.mjs (sync-legacy, pwa-check, ios, e2e/run.ts), and the e2e runner image carries that module.
# Every anchor asserted count==1 before anything is written; the first miss aborts the whole script.
import os, sys
WT = '/Users/CanasBangin/Desktop/TheBig6V2/.claude/worktrees/semver'

EDITS = {
'app/scripts/sync-legacy.mjs': [
  ("//   head    every <meta>, <link> and <title> (ia-version included, so the update check reads the same number)\n",
   "//   head    every <meta>, <link> and <title> (ia-version included, so the update check reads the same version)\n"),
  ("import { fileURLToPath } from 'node:url';\n",
   "import { fileURLToPath } from 'node:url';\nimport { metaVersion } from './version.mjs';\n"),
  ("""  const version = (headRest.match(/<meta name="ia-version" content="(\\d+)"/) || [])[1];
  if (!version) fail('no <meta name="ia-version"> in <head>');
""",
   """  // As written ("239" stays "239", "0.239.1" stays "0.239.1"); a meta that is not a version throws (scripts/version.mjs).
  const version = metaVersion(headRest);
  if (version === null) fail('no <meta name="ia-version"> in <head>');
"""),
],
'app/scripts/pwa-check.mjs': [
  ("import { join } from 'node:path';\n",
   "import { join } from 'node:path';\nimport { isVersion, metaVersion, sameVersion } from './version.mjs';\n"),
  ("""  const version = (root.match(/<meta name="ia-version" content="(\\d+)"/) || [])[1];
  if (!version) fail('the root index.html has no <meta name="ia-version">');
""",
   """  const version = metaVersion(root);
  if (version === null) fail('the root index.html has no <meta name="ia-version">');
"""),
  ("""  const banner = index.match(/from \\.\\.\\/index\\.html \\(ia-version (\\d+), sha256 ([0-9a-f]{64})\\)/);
  if (!banner) fail(`${name}index.html has no generated banner; ${rerun}`);
  if (banner[2] !== sha256) {
    const built = banner[1] === version ? `an older copy of ia-version ${version}` : `ia-version ${banner[1]}`;
""",
   """  const banner = index.match(/from \\.\\.\\/index\\.html \\(ia-version ([^,\\s]+), sha256 ([0-9a-f]{64})\\)/);
  if (!banner || !isVersion(banner[1])) fail(`${name}index.html has no generated banner; ${rerun}`);
  if (banner[2] !== sha256) {
    const built = sameVersion(banner[1], version) ? `an older copy of ia-version ${version}` : `ia-version ${banner[1]}`;
"""),
],
'app/scripts/ios.mjs': [
  ("import { attachRun } from '../../tools/runlog.mjs';\n",
   "import { attachRun } from '../../tools/runlog.mjs';\nimport { canonical, withNativeVersion } from './version.mjs';\n"),
  ("""/** Keeps the native version in step with the root index.html's ia-version (238 -> 1.0.238, build 238). */
function syncNativeVersion() {
  const manifest = join(APP, 'src', 'legacy', 'generated', 'legacy-manifest.json');
  if (!existsSync(manifest)) fail('no generated legacy manifest; run npm run sync (or drop --no-web)');
  const { version } = JSON.parse(readFileSync(manifest, 'utf8'));
  const { xml } = readConfig();
  const next = xml
    .replace(/(<widget[^>]*\\sversion=")[^"]*(")/, `$11.0.${version}$2`)
    .replace(/(<widget[^>]*\\sios-CFBundleVersion=")[^"]*(")/, `$1${version}$2`);
  if (next !== xml) {
    writeFileSync(CONFIG_XML, next);
    console.log(`ios: config.xml now version 1.0.${version} (build ${version})`);
  }
  return version;
}
""",
   """/**
 * Keeps the native version in step with the root index.html's ia-version: version and build are both its canonical
 * M.m.p (239 -> 0.239.0, 0.239.1 -> 0.239.1; scripts/version.mjs). Returns that M.m.p.
 */
function syncNativeVersion() {
  const manifest = join(APP, 'src', 'legacy', 'generated', 'legacy-manifest.json');
  if (!existsSync(manifest)) fail('no generated legacy manifest; run npm run sync (or drop --no-web)');
  const { version } = JSON.parse(readFileSync(manifest, 'utf8'));
  const { xml } = readConfig();
  let native, next;
  try {
    native = canonical(version);
    next = withNativeVersion(xml, version);
  } catch (err) {
    fail(`${err.message} (the generated legacy manifest and config.xml)`);
  }
  if (next !== xml) {
    writeFileSync(CONFIG_XML, next);
    console.log(`ios: config.xml now version ${native} (build ${native})`);
  } else {
    console.log(`ios: config.xml already version ${native} (build ${native})`);
  }
  return native;
}
"""),
  ("  console.log(`\\nios: The Asylum 1.0.${version} is running on ${sim.name}.`);\n",
   "  console.log(`\\nios: The Asylum ${version} is running on ${sim.name}.`);\n"),
  ("  console.log(`\\nios: The Asylum 1.0.${version} is running on ${target.name}.`);\n",
   "  console.log(`\\nios: The Asylum ${version} is running on ${target.name}.`);\n"),
],
'app/e2e/run.ts': [
  ("import { stepLabel } from './types.ts';\n",
   "import { stepLabel } from './types.ts';\nimport { metaVersion } from '../scripts/version.mjs';\n"),
  ("""  const version = served.match(/name="ia-version" content="(\\d+)"/)?.[1] ?? 'unknown';
""",
   """  // As written ("239" or "0.239.1"); 'unknown' only when the page has no meta. A meta that is not a version fails the run.
  const version = metaVersion(served) ?? 'unknown';
"""),
],
'app/e2e/Dockerfile': [
  ("""COPY app/tsconfig.node.json ./
COPY app/e2e/ ./e2e/
""",
   """COPY app/tsconfig.node.json ./
COPY app/e2e/ ./e2e/
# e2e/run.ts reads the served page's ia-version with the app's one version reader.
COPY app/scripts/version.mjs ./scripts/
"""),
],
}

texts = {}
for rel, pairs in EDITS.items():
    with open(os.path.join(WT, rel), encoding='utf-8') as fh:
        src = fh.read()
    for old, new in pairs:
        n = src.count(old)
        if n != 1:
            sys.exit('ABORT: %s: anchor found %d times: %r' % (rel, n, old[:90]))
        src = src.replace(old, new)
    texts[rel] = src
for rel, src in texts.items():
    with open(os.path.join(WT, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('edited', rel, len(EDITS[rel]), 'hunks')
