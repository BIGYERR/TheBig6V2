// scripts/version.mjs, the app's one reader of the root index.html's ia-version, against a hand table, the real
// config.xml and the live index.html, and against tests/semver.js (the gates' reader): both give every input one answer.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonical, isVersion, metaVersion, parseVersion, sameVersion, tag, withNativeVersion } from '../../scripts/version.mjs';

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

describe('version: tag', () => {
  it('prints a legacy build as V<N> and a dotted version as v<M.m.p>', () => {
    assert.equal(tag('239'), 'V239');
    assert.equal(tag('V239'), 'V239');
    assert.equal(tag('0.239.1'), 'v0.239.1');
    assert.equal(tag('v0.240.0'), 'v0.240.0');
  });

  it('never throws: what is not a version prints as V and the text', () => {
    assert.equal(tag('unknown'), 'Vunknown');
    assert.equal(tag(''), 'V');
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
  const SV = createRequire(import.meta.url)(join(APP, '..', 'tests', 'semver.js')) as { str(v: string): string; tag(v: unknown): string };

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

  it('prints the same label for every text, version or not', () => {
    for (const text of [...ACCEPTS.map(([t]) => t), ...REJECTS]) assert.equal(tag(text), SV.tag(text), JSON.stringify(text));
  });
});
