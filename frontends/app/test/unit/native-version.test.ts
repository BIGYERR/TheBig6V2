// The native app carries the page's version: config.xml's version and ios-CFBundleVersion equal the canonical M.m.p of
// the ia-version meta in src/legacy/src/html/head.html, the one the release writes. scripts/ios.mjs rewrites config.xml
// on every build, so the two only drift in git; this holds a release commit to carrying both (`npm run version-ios`
// writes it). The 60-second check runs it in the app lane, so a bumped meta with a stale config.xml never commits.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonical, metaVersion, withNativeVersion } from '../../scripts/version.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const head = readFileSync(join(APP, 'src', 'legacy', 'src', 'html', 'head.html'), 'utf8');
const xml = readFileSync(join(APP, 'config.xml'), 'utf8');

describe('the native app carries the page version', () => {
  const meta = metaVersion(head);
  assert.ok(meta !== null, 'html/head.html has an ia-version meta');
  const want = canonical(meta);

  it(`config.xml version is the page's ia-version (${want})`, () => {
    const version = xml.match(/<widget[^>]*\sversion="([^"]+)"/)?.[1];
    assert.equal(version, want, 'config.xml <widget version> (run npm run version-ios in frontends/app)');
  });

  it(`config.xml ios-CFBundleVersion is the same version (${want})`, () => {
    const build = xml.match(/<widget[^>]*\sios-CFBundleVersion="([^"]+)"/)?.[1];
    assert.equal(build, want, 'config.xml <widget ios-CFBundleVersion> (run npm run version-ios in frontends/app)');
  });

  it('a build would leave config.xml as it is', () => {
    assert.equal(withNativeVersion(xml, meta), xml, 'scripts/ios.mjs would rewrite config.xml on the next build');
  });
});
