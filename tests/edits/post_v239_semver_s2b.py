#!/usr/bin/env python3
# Post-V239 semver pass, slice 2b (the last): CI and tools/ read and compare ia-version through tests/semver.js.
# Ruling: tests/measure/post_v239_semver/design.md. Tests-only pass, no build: index.html is not edited.
#   .github/workflows/pipeline.yml  meta reads -> `node tests/semver.js meta` + `str` validation (named ::error::);
#                                   baselines -> the greatest tag strictly below the candidate (`semver.js below`);
#                                   licence path uses the meta as written (239 -> v239_rulings, 0.239.1 -> v0.239.1_rulings)
#   tools/check.mjs                 meta read validated through SV.parse; baseline through SV.below over `git tag --list`
#   tools/deploy-check.mjs          meta regex takes any non-quote content; --expect and live-vs-remote compare via SV.cmp
#   tools/runlog.mjs                meta read takes any non-quote content, kept as written only when SV.parse accepts it
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

EDITS = {}

# ---------------------------------------------------------------- pipeline.yml
EDITS['.github/workflows/pipeline.yml'] = [
    # gates job: baseline (the only one with the "candidate ... baseline" echo line)
    ('''          set -euo pipefail
          N=$(grep -oE 'name="ia-version" content="[0-9]+"' index.html | grep -oE '[0-9]+')
          git show "V$((N - 1)):index.html" > "$RUNNER_TEMP/base.html"
          echo "BASE=$RUNNER_TEMP/base.html" >> "$GITHUB_ENV"
          echo "candidate ia-version $N, baseline V$((N - 1))"
''',
     '''          set -euo pipefail
          META=$(node tests/semver.js meta index.html) || { echo "::error::index.html has no ia-version meta"; exit 1; }
          node tests/semver.js str "$META" > /dev/null || { echo "::error::index.html ia-version '$META' is not a version (want N or M.m.p)"; exit 1; }
          PREV=$(git tag --list 'v*' 'V*' | node tests/semver.js below "$META") || { echo "::error::no version tag below ia-version $META, so there is no baseline"; exit 1; }
          git show "$PREV:index.html" > "$RUNNER_TEMP/base.html"
          echo "BASE=$RUNNER_TEMP/base.html" >> "$GITHUB_ENV"
          echo "candidate ia-version $META, baseline $PREV"
'''),
    # gates job: the row licence path, meta as written
    ('''          N=$(grep -oE 'name="ia-version" content="[0-9]+"' index.html | grep -oE '[0-9]+')
          LICENCE="tests/measure/v${N}_rulings/v${N}_row_ruled.txt"
''',
     '''          META=$(node tests/semver.js meta index.html) || { echo "::error::index.html has no ia-version meta"; exit 1; }
          node tests/semver.js str "$META" > /dev/null || { echo "::error::index.html ia-version '$META' is not a version (want N or M.m.p)"; exit 1; }
          LICENCE="tests/measure/v${META}_rulings/v${META}_row_ruled.txt"
'''),
    # fuzz job: baseline (anchored on the step that follows it)
    ('''          set -euo pipefail
          N=$(grep -oE 'name="ia-version" content="[0-9]+"' index.html | grep -oE '[0-9]+')
          git show "V$((N - 1)):index.html" > "$RUNNER_TEMP/base.html"
          echo "BASE=$RUNNER_TEMP/base.html" >> "$GITHUB_ENV"
      - name: Identity fuzz
''',
     '''          set -euo pipefail
          META=$(node tests/semver.js meta index.html) || { echo "::error::index.html has no ia-version meta"; exit 1; }
          node tests/semver.js str "$META" > /dev/null || { echo "::error::index.html ia-version '$META' is not a version (want N or M.m.p)"; exit 1; }
          PREV=$(git tag --list 'v*' 'V*' | node tests/semver.js below "$META") || { echo "::error::no version tag below ia-version $META, so there is no baseline"; exit 1; }
          git show "$PREV:index.html" > "$RUNNER_TEMP/base.html"
          echo "BASE=$RUNNER_TEMP/base.html" >> "$GITHUB_ENV"
      - name: Identity fuzz
'''),
]

# ---------------------------------------------------------------- tools/check.mjs
EDITS['tools/check.mjs'] = [
    ('''import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, setPriority } from 'node:os';
import { basename, join } from 'node:path';
import { REPO, ROOT, attachRun, duration, startRun } from './runlog.mjs';
''',
     '''import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism, setPriority } from 'node:os';
import { basename, join } from 'node:path';
import { REPO, ROOT, attachRun, duration, startRun } from './runlog.mjs';

/** ia-version is read and compared only through tests/semver.js (CommonJS): MAJOR.MINOR.PATCH, a bare N reads as 0.N.0. */
const SV = createRequire(import.meta.url)('../tests/semver.js');
'''),
    ('''  const version = /<meta name="ia-version" content="(\\d+)"/.exec(html)?.[1];
  if (!version) {
    failures.push('gates: index.html has no ia-version meta');
    return;
  }
''',
     '''  const version = /<meta name="ia-version" content="([^"]*)"/.exec(html)?.[1];
  if (version === undefined) {
    failures.push('gates: index.html has no ia-version meta');
    return;
  }
  try {
    SV.parse(version);
  } catch (err) {
    failures.push(`gates: index.html ia-version "${version}" is not a version (${err.message})`);
    return;
  }
'''),
    ('''  // The baseline gates compare against: the previous version, as tagged.
  const scratch = join(ROOT, 'check');
  mkdirSync(scratch, { recursive: true });
  let base = '';
  try {
    base = join(scratch, `base_v${Number(version) - 1}.html`);
    writeFileSync(base, execFileSync('git', ['-C', REPO, 'show', `V${Number(version) - 1}:index.html`], { maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    base = '';
    note('gates', `no V${Number(version) - 1} tag here; gates run without a baseline`);
  }
''',
     '''  // The baseline gates compare against: the previous version, as tagged, which is the greatest tag strictly below this
  // one (tests/semver.js below), never N - 1. base_v<previous>.html names it as tagged, less its v: base_v238.html.
  const scratch = join(ROOT, 'check');
  mkdirSync(scratch, { recursive: true });
  let base = '';
  let prev;
  try {
    prev = SV.below(execFileSync('git', ['-C', REPO, 'tag', '--list', 'v*', 'V*'], { encoding: 'utf8' }).split(/\\r?\\n/), version);
    if (prev === undefined) throw new Error(`no version tag below ia-version ${version}`);
    base = join(scratch, `base_v${prev.replace(/^[Vv]/, '')}.html`);
    writeFileSync(base, execFileSync('git', ['-C', REPO, 'show', `${prev}:index.html`], { maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    base = '';
    note('gates', prev === undefined ? `no version tag below ia-version ${version} here; gates run without a baseline` : `${prev}:index.html does not read here; gates run without a baseline`);
  }
'''),
]

# ---------------------------------------------------------------- tools/deploy-check.mjs
EDITS['tools/deploy-check.mjs'] = [
    ('''//   node tools/deploy-check.mjs --expect 240       and that it is ia-version 240
''',
     '''//   node tools/deploy-check.mjs --expect 0.240.0   and that it is ia-version 0.240.0 (a bare 240 reads as 0.240.0)
'''),
    ('''import { execFileSync } from 'node:child_process';
import { attachRun, startRun } from './runlog.mjs';
''',
     '''import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { attachRun, startRun } from './runlog.mjs';

/** ia-version is read and compared only through tests/semver.js (CommonJS): MAJOR.MINOR.PATCH, a bare N reads as 0.N.0. */
const SV = createRequire(import.meta.url)('../tests/semver.js');
'''),
    ('''const VERSION = /<meta name="ia-version" content="(\\d+)"/;
''',
     '''const VERSION = /<meta name="ia-version" content="([^"]*)"/;
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
'''),
    ('''  if (!remoteVersion) return done(1, `origin/main:index.html has no ia-version meta`);
  if (expect && remoteVersion !== expect) return done(1, `origin/main is ia-version ${remoteVersion}, not ${expect}`);
''',
     '''  if (remoteVersion === undefined) return done(1, `origin/main:index.html has no ia-version meta`);
  if (!parses(remoteVersion)) return done(1, `origin/main:index.html ia-version "${remoteVersion}" is not a version (want N or M.m.p)`);
  if (expect && !parses(expect)) return done(1, `--expect ${expect} is not a version (want N or M.m.p)`);
  if (expect && !same(remoteVersion, expect)) return done(1, `origin/main is ia-version ${remoteVersion}, not ${expect}`);
'''),
    ('''    if (liveVersion === remoteVersion) break;
''',
     '''    if (same(liveVersion, remoteVersion)) break;
'''),
    ('''  if (liveVersion !== remoteVersion) return done(1, `${live} serves ia-version ${liveVersion ?? 'none'}, not ${remoteVersion}`);
''',
     '''  if (!same(liveVersion, remoteVersion)) return done(1, `${live} serves ia-version ${liveVersion ?? 'none'}, not ${remoteVersion}`);
'''),
]

# ---------------------------------------------------------------- tools/runlog.mjs
EDITS['tools/runlog.mjs'] = [
    ('''} from 'node:fs';
import { homedir, hostname } from 'node:os';
''',
     '''} from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, hostname } from 'node:os';
'''),
    ('''    version = readFileSync(join(REPO, 'index.html'), 'utf8').slice(0, 20000).match(/name="ia-version" content="(\\d+)"/)?.[1] ?? '';
  } catch {
    // No index.html here (a container): leave it out.
  }
''',
     '''    const raw = readFileSync(join(REPO, 'index.html'), 'utf8').slice(0, 20000).match(/name="ia-version" content="([^"]*)"/)?.[1] ?? '';
    // Kept as written (239 stays "239", 0.239.1 stays "0.239.1"), and only when tests/semver.js parses it: parse throws.
    createRequire(import.meta.url)('../tests/semver.js').parse(raw);
    version = raw;
  } catch {
    // No index.html here (a container), no meta, or a meta that is not a version: leave it out.
  }
'''),
]


def main():
    staged = {}
    for rel, pairs in EDITS.items():
        path = os.path.join(ROOT, rel)
        with open(path, 'r', encoding='utf-8', newline='') as f:
            text = f.read()
        for i, (old, new) in enumerate(pairs, 1):
            n = text.count(old)
            if n != 1:
                print('ABORT %s anchor %d: count %d, want 1:\n%s' % (rel, i, n, old.splitlines()[0]))
                sys.exit(1)
            text = text.replace(old, new, 1)
        staged[rel] = text
    for rel, text in staged.items():
        with open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        print('wrote %s (%d anchors)' % (rel, len(EDITS[rel])))
    print('post_v239_semver_s2b: %d files, %d anchors, all count==1' % (len(staged), sum(len(p) for p in EDITS.values())))


if __name__ == '__main__':
    main()
