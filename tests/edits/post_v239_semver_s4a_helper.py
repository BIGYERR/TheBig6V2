#!/usr/bin/env python3
# Post-V239 semver, slice 4, part A: the app-local version reader (app/scripts/version.mjs) and its unit test.
# New files only; each must be absent. Literal bytes, no escapes.
import os, sys
WT = '/Users/CanasBangin/Desktop/TheBig6V2/.claude/worktrees/semver'

VERSION_MJS = r'''// The root index.html's ia-version, read one way across app/ (Post-V239, Mario): MAJOR.MINOR.PATCH, or the legacy
// integer N every build through V239 carries, which reads as 0.N.0 (239 is 0.239.0). The rule is tests/semver.js's, and
// test/unit/version.test.ts holds the two to the same answer for every input. It lives here as well because the Docker
// e2e images are built from app/ and index.html alone and never see tests/.
//
//   metaVersion(html)              the ia-version meta's content as written ('239' stays '239'); null when the page has
//                                  no meta; throws when the meta holds anything that is not a version
//   parseVersion('239')            { major: 0, minor: 239, patch: 0, legacy: true }; throws on anything else
//   isVersion(text)                parseVersion's answer without the throw
//   canonical('239')               '0.239.0'; canonical('0.239.1') is '0.239.1'
//   sameVersion('239', '0.239.0')  true
//   withNativeVersion(xml, v)      config.xml with version and ios-CFBundleVersion both set to canonical(v)
// Displays print a version as written; only the native build number is canonical.

const LEGACY_RE = /^[Vv]?(0|[1-9][0-9]*)$/;
const DOTTED_RE = /^[Vv]?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const META_RE = /<meta name="ia-version" content="([^"]*)"/;
const WANT = 'want N, VN, M.m.p or vM.m.p';

/**
 * @param {unknown} text
 * @returns {{ major: number, minor: number, patch: number, legacy: boolean } | null}
 */
function read(text) {
  if (typeof text !== 'string') return null;
  const legacy = LEGACY_RE.exec(text);
  const parts = legacy ? [0, Number(legacy[1]), 0] : (DOTTED_RE.exec(text) || []).slice(1).map(Number);
  if (parts.length !== 3 || !parts.every((n) => Number.isSafeInteger(n))) return null;
  return { major: parts[0], minor: parts[1], patch: parts[2], legacy: legacy !== null };
}

/**
 * The version `text` names. Throws a TypeError naming `text` when it is not one.
 * @param {string} text
 * @returns {{ major: number, minor: number, patch: number, legacy: boolean }}
 */
export function parseVersion(text) {
  const v = read(text);
  if (v === null) throw new TypeError(`${JSON.stringify(text)} is not an ia-version (${WANT})`);
  return v;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isVersion(text) {
  return read(text) !== null;
}

/**
 * The canonical M.m.p of `text`: a legacy N gives 0.N.0.
 * @param {string} text
 * @returns {string}
 */
export function canonical(text) {
  const { major, minor, patch } = parseVersion(text);
  return `${major}.${minor}.${patch}`;
}

/**
 * True when `a` and `b` name one version (239 and 0.239.0 do). Throws when either is not a version.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function sameVersion(a, b) {
  return canonical(a) === canonical(b);
}

/**
 * The first ia-version meta's content, as written; null when there is none. Throws when it is not a version.
 * @param {string} html
 * @returns {string | null}
 */
export function metaVersion(html) {
  const m = META_RE.exec(html);
  if (m === null) return null;
  if (!isVersion(m[1])) throw new Error(`the <meta name="ia-version"> holds ${JSON.stringify(m[1])}, which is not a version (${WANT})`);
  return m[1];
}

/**
 * config.xml with the widget's version (CFBundleShortVersionString) and ios-CFBundleVersion (CFBundleVersion) both
 * set to the canonical M.m.p of `version`: 239 gives 0.239.0, 0.239.1 gives 0.239.1. The app is pre-1.0 (Mario), so
 * this replaces the old 1.0.N scheme. Throws when `version` is not a version or either attribute is missing.
 * @param {string} xml
 * @param {string} version
 * @returns {string}
 */
export function withNativeVersion(xml, version) {
  const native = canonical(version);
  let out = xml;
  for (const attr of ['version', 'ios-CFBundleVersion']) {
    const re = new RegExp(`(<widget[^>]*\\s${attr}=")[^"]*(")`);
    if (!re.test(out)) throw new Error(`config.xml has no <widget ${attr}="...">`);
    out = out.replace(re, (_, open, close) => open + native + close);
  }
  return out;
}
'''

VERSION_TEST = r'''// scripts/version.mjs, the app's one reader of the root index.html's ia-version, against a hand table, the real
// config.xml and the live index.html, and against tests/semver.js (the gates' reader): both give every input one answer.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonical, isVersion, metaVersion, parseVersion, sameVersion, withNativeVersion } from '../../scripts/version.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Hand table: the text, its canonical M.m.p, and whether it is a legacy integer. */
const ACCEPTS: [string, string, boolean][] = [
  ['239', '0.239.0', true],
  ['7', '0.7.0', true],
  ['0', '0.0.0', true],
  ['V239', '0.239.0', true],
  ['v239', '0.239.0', true],
  ['0.239.0', '0.239.0', false],
  ['0.239.1', '0.239.1', false],
  ['v0.239.1', '0.239.1', false],
  ['0.240.0', '0.240.0', false],
  ['1.0.0', '1.0.0', false],
  ['10.20.30', '10.20.30', false],
];
const REJECTS = ['', '0.239', '0.239.1-rc1', '1.2.3.4', '-1', '1.5', '0239', '0.0239.0', ' 239', '239 ', 'x239', 'Infinity', 'unknown',
  '1.0.239 ', '99999999999999999999'];

const page = (content: string) => `<head><meta charset="utf-8"><meta name="ia-version" content="${content}"><title>T</title></head>`;

describe('version: parse', () => {
  for (const [text, want, legacy] of ACCEPTS) {
    it(`reads "${text}" as ${want}${legacy ? ' (legacy)' : ''}`, () => {
      const v = parseVersion(text);
      assert.equal(`${v.major}.${v.minor}.${v.patch}`, want);
      assert.equal(v.legacy, legacy);
      assert.equal(canonical(text), want);
      assert.equal(isVersion(text), true);
    });
  }

  it('refuses every text that is not N, VN, M.m.p or vM.m.p, naming it', () => {
    for (const text of REJECTS) {
      assert.equal(isVersion(text), false, JSON.stringify(text));
      assert.throws(() => parseVersion(text), (err: Error) => err instanceof TypeError && err.message.startsWith(`${JSON.stringify(text)} is not an ia-version`));
      assert.throws(() => canonical(text), TypeError);
    }
  });

  it('names one version with 239 and 0.239.0, and two with 239 and 0.239.1', () => {
    assert.equal(sameVersion('239', '0.239.0'), true);
    assert.equal(sameVersion('V239', 'v0.239.0'), true);
    assert.equal(sameVersion('239', '0.239.1'), false);
    assert.equal(sameVersion('0.239.1', '0.240.0'), false);
    assert.throws(() => sameVersion('239', '0.239'), TypeError);
  });
});

describe('version: metaVersion', () => {
  it('returns a legacy meta as written: "239" stays "239"', () => {
    assert.equal(metaVersion(page('239')), '239');
  });

  it('returns a dotted meta as written: "0.239.1"', () => {
    assert.equal(metaVersion(page('0.239.1')), '0.239.1');
  });

  it('returns null for a page with no meta', () => {
    assert.equal(metaVersion('<head><title>T</title></head>'), null);
  });

  it('throws on a meta that is not a version, naming what it holds', () => {
    assert.throws(() => metaVersion(page('0.239')), /holds "0\.239", which is not a version/);
    assert.throws(() => metaVersion(page('')), /holds "", which is not a version/);
  });

  it('reads the live index.html: a legacy integer or a dotted M.m.p, as written', () => {
    const html = readFileSync(join(APP, '..', 'index.html'), 'utf8');
    const meta = /<meta name="ia-version" content="([^"]*)"/.exec(html);
    assert.ok(meta, 'index.html carries an ia-version meta');
    assert.match(meta[1]!, /^(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*))?$/);
    assert.equal(metaVersion(html), meta[1]);
  });
});

describe('version: native (config.xml)', () => {
  const xml = readFileSync(join(APP, 'config.xml'), 'utf8');
  const widgetLine = (s: string) => s.split('\n').findIndex((l) => l.startsWith('<widget '));

  for (const [given, native] of [['239', '0.239.0'], ['0.239.1', '0.239.1'], ['0.240.0', '0.240.0']]) {
    it(`maps ia-version ${given} to version ${native} and build ${native}, touching nothing else`, () => {
      const out = withNativeVersion(xml, given!);
      const at = widgetLine(xml);
      assert.ok(at >= 0, 'config.xml has a <widget line');
      assert.equal(out.split('\n')[at], `<widget id="com.bigyerr.ironasylum" version="${native}" ios-CFBundleVersion="${native}"`);
      const rest = (s: string) => s.split('\n').filter((_, i) => i !== at);
      assert.deepEqual(rest(out), rest(xml));
    });
  }

  it('is idempotent: a second pass writes the same file', () => {
    const once = withNativeVersion(xml, '0.239.1');
    assert.equal(withNativeVersion(once, '0.239.1'), once);
  });

  it('refuses a version that is not one, and a config.xml missing either attribute', () => {
    assert.throws(() => withNativeVersion(xml, '0.239'), TypeError);
    assert.throws(() => withNativeVersion(xml.replace(/\sios-CFBundleVersion="[^"]*"/, ''), '239'), /no <widget ios-CFBundleVersion=/);
    assert.throws(() => withNativeVersion(xml.replace(/(<widget[^>]*)\sversion="[^"]*"/, '$1'), '239'), /no <widget version=/);
  });
});

describe('version: one rule with tests/semver.js', () => {
  const SV = createRequire(import.meta.url)(join(APP, '..', 'tests', 'semver.js')) as { str(v: string): string };

  it('accepts and refuses the same texts, and gives the same canonical M.m.p', () => {
    for (const text of [...ACCEPTS.map(([t]) => t), ...REJECTS]) {
      let theirs: string | null;
      try {
        theirs = SV.str(text);
      } catch {
        theirs = null;
      }
      assert.equal(isVersion(text) ? canonical(text) : null, theirs, JSON.stringify(text));
    }
  });
});
'''

for rel, body in [('app/scripts/version.mjs', VERSION_MJS), ('app/test/unit/version.test.ts', VERSION_TEST)]:
    p = os.path.join(WT, rel)
    if os.path.exists(p):
        sys.exit('ABORT: ' + rel + ' already exists')
for rel, body in [('app/scripts/version.mjs', VERSION_MJS), ('app/test/unit/version.test.ts', VERSION_TEST)]:
    with open(os.path.join(WT, rel), 'w', encoding='utf-8') as fh:
        fh.write(body)
    print('wrote', rel, len(body.encode('utf-8')), 'bytes')
