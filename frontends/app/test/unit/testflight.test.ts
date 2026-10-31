// The TestFlight lane's App Store Connect side (scripts/testflight.mjs) and its config: the gate skips cleanly while
// any secret is unset and when App Store Connect already holds the build (a version goes up once; a fix is the next
// PATCH), the wait ends only on a processed or failed build, the API token is an ES256 JWT in the raw signature form
// Apple reads, the gate's secret list is the one the pipeline passes, and config.xml answers the export compliance
// question, and the deploy picture's TestFlight leg names a TestFlight job that failed instead of the last notice before
// it. Expected values are typed by hand or checked by Node's own verifier, never asked of the script.
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SECRETS, ascToken, gateDecision, legLine, nativeRelease, processingVerdict } from '../../scripts/testflight.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = join(APP, '..', '..');
const config = readFileSync(join(APP, 'config.xml'), 'utf8');
const pipeline = readFileSync(join(REPO, '.github', 'workflows', 'pipeline.yml'), 'utf8');

describe('the gate uploads a version once, and only with every secret set', () => {
  it('skips, naming the unset secrets, while any is missing', () => {
    const d = gateDecision({ version: '0.251.1', missing: ['IOS_PROFILE_APP', 'IOS_PROFILE_WIDGET'], builds: [] });
    assert.equal(d.upload, false);
    assert.equal(d.notice, 'testflight skipped: secrets not set (IOS_PROFILE_APP, IOS_PROFILE_WIDGET)');
  });

  it('skips a version App Store Connect already holds, saying what state it is in', () => {
    const d = gateDecision({ version: '0.251.1', missing: [], builds: [{ state: 'VALID' }] });
    assert.equal(d.upload, false);
    assert.equal(d.notice, 'testflight 0.251.1 processed (uploaded before this run; a version goes up once, a fix is the next PATCH)');
  });

  it('skips a version whose earlier upload failed processing: the fix is the next PATCH', () => {
    const d = gateDecision({ version: '0.251.1', missing: [], builds: [{ state: 'INVALID' }] });
    assert.equal(d.upload, false);
    assert.match(d.notice, /^testflight 0\.251\.1 invalid /);
  });

  it('uploads a version App Store Connect does not hold', () => {
    assert.equal(gateDecision({ version: '0.251.2', missing: [], builds: [] }).upload, true);
  });
});

describe('the wait ends on a processed or failed build', () => {
  it('keeps waiting while the build is not listed or still processing', () => {
    assert.equal(processingVerdict('0.251.1', []).done, false);
    assert.equal(processingVerdict('0.251.1', [{ state: 'PROCESSING' }]).done, false);
  });

  it('ends well on VALID, with the notice rhythm step 7 reads', () => {
    assert.deepEqual(processingVerdict('0.251.1', [{ state: 'VALID' }]), { done: true, ok: true, notice: 'testflight 0.251.1 processed' });
  });

  it('ends badly on FAILED or INVALID', () => {
    assert.deepEqual(processingVerdict('0.251.1', [{ state: 'FAILED' }]), { done: true, ok: false, notice: 'testflight 0.251.1 failed processing' });
    assert.equal(processingVerdict('0.251.1', [{ state: 'INVALID' }]).ok, false);
  });
});

describe('the leg names a failed TestFlight job, never the notice before it', () => {
  // Run #48 (v0.253.0's merge, 803baf3): the gate wrote "uploading", then the upload job failed on App Store Connect's
  // orientation rule, and the leg still printed "uploading" twenty minutes after the run had ended.
  const run48 = {
    run: 41202156759, sha: '803baf3c', completed: true,
    jobs: [{ name: 'TestFlight (gate)', conclusion: 'success' }, { name: 'TestFlight (upload)', conclusion: 'failure' }, { name: 'TestFlight (processed)', conclusion: 'skipped' }],
    notices: ['testflight 0.253.0 is not in App Store Connect yet; uploading'],
  };

  it('a failed upload reads as failed, naming the job, after the gate\'s notice', () => {
    assert.equal(legLine(run48), 'testflight failed in TestFlight (upload), after: testflight 0.253.0 is not in App Store Connect yet; uploading (run 41202156759, 803baf3)');
  });

  it('a cancelled job reads as cancelled', () => {
    const jobs = [{ name: 'TestFlight (gate)', conclusion: 'success' }, { name: 'TestFlight (upload)', conclusion: 'success' }, { name: 'TestFlight (processed)', conclusion: 'cancelled' }];
    assert.equal(legLine({ ...run48, jobs }), 'testflight cancelled in TestFlight (processed), after: testflight 0.253.0 is not in App Store Connect yet; uploading (run 41202156759, 803baf3)');
  });

  // The three below guard what the leg printed before this change, and must keep printing.
  it('a processed build reads as its last notice', () => {
    const jobs = run48.jobs.map((j) => ({ ...j, conclusion: 'success' }));
    assert.equal(legLine({ ...run48, jobs, notices: [...run48.notices, 'testflight 0.253.0 processed'] }), 'testflight 0.253.0 processed (run 41202156759, 803baf3)');
  });

  it('a skipped upload reads as the gate\'s skip notice', () => {
    const jobs = [{ name: 'TestFlight (gate)', conclusion: 'success' }, { name: 'TestFlight (upload)', conclusion: 'skipped' }, { name: 'TestFlight (processed)', conclusion: 'skipped' }];
    const notices = ['testflight 0.252.0 processed (uploaded before this run; a version goes up once, a fix is the next PATCH)'];
    assert.equal(legLine({ ...run48, jobs, notices }), 'testflight 0.252.0 processed (uploaded before this run; a version goes up once, a fix is the next PATCH) (run 41202156759, 803baf3)');
  });

  it('a run still going with no notice yet says so', () => {
    const jobs = [{ name: 'TestFlight (gate)', conclusion: '' }];
    assert.equal(legLine({ ...run48, completed: false, jobs, notices: [] }), 'testflight no notice yet (run 41202156759, 803baf3, still running)');
  });
});

describe('the App Store Connect token', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);
  const token = ascToken({ keyId: 'KEY1234567', issuerId: '00000000-1111-2222-3333-444444444444', privateKey: pem, now });
  const [header, payload, signature] = token.split('.');
  const json = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

  it('names the key and the ES256 algorithm', () => {
    assert.deepEqual(json(header), { alg: 'ES256', kid: 'KEY1234567', typ: 'JWT' });
  });

  it('claims the issuer and App Store Connect for 15 minutes', () => {
    const iat = Date.UTC(2026, 9, 28, 12, 0, 0) / 1000;
    assert.deepEqual(json(payload), { iss: '00000000-1111-2222-3333-444444444444', iat, exp: iat + 900, aud: 'appstoreconnect-v1' });
  });

  it('is signed in the 64-byte raw form, which verifies against the public key', () => {
    const raw = Buffer.from(signature, 'base64url');
    assert.equal(raw.length, 64, 'r and s, 32 bytes each; a DER signature would be about 70');
    assert.ok(verify('sha256', Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, raw));
  });
});

describe('the pipeline and config.xml agree with the gate', () => {
  const testflightJobs = pipeline.slice(pipeline.indexOf('\n  testflight-gate:'));

  it('the TestFlight jobs read exactly the secrets the gate checks', () => {
    assert.ok(testflightJobs.length > 1, 'pipeline.yml has a testflight-gate job');
    const read = new Set([...testflightJobs.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]));
    assert.deepEqual([...read].sort(), [...SECRETS].sort());
  });

  it('the gate is told whether each secret is set, never given the signing ones', () => {
    const gate = testflightJobs.slice(0, testflightJobs.indexOf('\n  testflight:'));
    const flags = [...gate.matchAll(/HAS_([A-Z0-9_]+): \$\{\{ secrets\.([A-Z0-9_]+) != '' \}\}/g)];
    assert.deepEqual(flags.map((m) => m[1]).sort(), [...SECRETS].sort());
    assert.ok(flags.every((m) => m[1] === m[2]), 'each HAS_ flag reads its own secret');
    for (const name of ['IOS_DIST_CERT_P12', 'IOS_DIST_CERT_PASSWORD', 'IOS_PROFILE_APP', 'IOS_PROFILE_WIDGET']) {
      assert.doesNotMatch(gate, new RegExp(`^\\s+${name}: \\$\\{\\{ secrets\\.`, 'm'), `${name}'s value stays out of the gate`);
    }
  });

  it('config.xml carries the bundle id, version and build the gate looks up', () => {
    const r = nativeRelease(config);
    assert.equal(r.bundleId, 'com.bigyerr.ironasylum');
    assert.equal(r.build, r.version, 'the build number is the version (scripts/ios.mjs)');
  });

  it('config.xml answers the export compliance question: no non-exempt encryption', () => {
    assert.match(config, /<config-file target="\*-Info\.plist" parent="ITSAppUsesNonExemptEncryption">\s*<false \/>\s*<\/config-file>/);
  });

  it('config.xml makes the app iPhone only, so its portrait-only screens pass App Store Connect', () => {
    // App Store Connect refused 0.252.0 (pipeline run #45): an iPad-capable bundle must list all four orientations.
    // The app is portrait only by design, so it is iPhone only; Cordova writes TARGETED_DEVICE_FAMILY "1" from this.
    const ios = (config.match(/<platform name="ios">([\s\S]*?)<\/platform>/) || [])[1] || '';
    assert.match(ios, /<preference name="target-device" value="handset" \/>/);
    assert.match(ios, /<preference name="Orientation" value="portrait" \/>/);
  });
});
