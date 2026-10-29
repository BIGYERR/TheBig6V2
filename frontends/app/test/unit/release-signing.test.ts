// Release signing for TestFlight (scripts/signing.mjs, used by `scripts/ios.mjs release`): a provisioning profile is
// read and checked before anything builds, the Release configuration of the app and its widget extension is set to
// manual signing with each one's own profile (Debug keeps automatic signing for device-ios), and the export options
// send the archive to App Store Connect with the same profiles. Expected values are typed by hand: the SHA-1 of "abc"
// is the FIPS 180 test vector, the plist is Apple's ExportOptions format.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { exportOptions, profileProblems, readProfile, signForRelease } from '../../scripts/signing.mjs';

const TEAM = 'ABCDE12345';

/** A decoded App Store profile as `security cms -D -i` prints one, trimmed to the keys that matter. */
function profilePlist({ name = 'Asylum App Store', bundle = 'com.bigyerr.ironasylum', expires = '2027-10-28T12:00:00Z', extra = '' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AppIDName</key>
	<string>XC com bigyerr ironasylum</string>
	<key>CreationDate</key>
	<date>2026-10-28T12:00:00Z</date>
	<key>DeveloperCertificates</key>
	<array>
		<data>YWJj</data>
	</array>
	<key>Entitlements</key>
	<dict>
		<key>application-identifier</key>
		<string>${TEAM}.${bundle}</string>
		<key>beta-reports-active</key>
		<true/>
		<key>com.apple.developer.team-identifier</key>
		<string>${TEAM}</string>
		<key>get-task-allow</key>
		<false/>
	</dict>
	<key>ExpirationDate</key>
	<date>${expires}</date>
	<key>Name</key>
	<string>${name}</string>
${extra}	<key>TeamIdentifier</key>
	<array>
		<string>${TEAM}</string>
	</array>
	<key>UUID</key>
	<string>11111111-2222-3333-4444-555555555555</string>
</dict>
</plist>
`;
}

const NOW = new Date('2026-10-28T12:00:00Z');

describe('a provisioning profile is read and checked before the archive', () => {
  it('reads the name, UUID, team, bundle id, expiry and certificate hash of an App Store profile', () => {
    const p = readProfile(profilePlist());
    assert.equal(p.name, 'Asylum App Store');
    assert.equal(p.uuid, '11111111-2222-3333-4444-555555555555');
    assert.equal(p.team, TEAM);
    assert.equal(p.bundleId, 'com.bigyerr.ironasylum');
    assert.equal(p.expires?.toISOString(), '2027-10-28T12:00:00.000Z');
    assert.equal(p.appStore, true);
    assert.deepEqual(p.certs, ['A9993E364706816ABA3E25717850C26C9CD0D89D'], 'SHA-1 of the DER bytes, as security find-identity prints it');
  });

  it('decodes XML entities in the profile name', () => {
    assert.equal(readProfile(profilePlist({ name: 'Asylum &amp; Widget' })).name, 'Asylum & Widget');
  });

  it('passes a valid App Store profile with no errors or warnings', () => {
    assert.deepEqual(profileProblems(readProfile(profilePlist()), NOW), { errors: [], warnings: [] });
  });

  it('refuses a development profile (it lists devices and allows a debugger)', () => {
    const dev = profilePlist({ extra: '\t<key>ProvisionedDevices</key>\n\t<array>\n\t\t<string>00008110-000A</string>\n\t</array>\n' })
      .replace('<key>get-task-allow</key>\n\t\t<false/>', '<key>get-task-allow</key>\n\t\t<true/>');
    const p = readProfile(dev);
    assert.equal(p.appStore, false);
    assert.match(profileProblems(p, NOW).errors.join('\n'), /development or ad hoc profile/);
  });

  it('refuses an expired profile', () => {
    const { errors } = profileProblems(readProfile(profilePlist({ expires: '2026-10-27T12:00:00Z' })), NOW);
    assert.match(errors.join('\n'), /expired on 2026-10-27/);
  });

  it('warns 30 days ahead of expiry, and not 31', () => {
    const at29 = profileProblems(readProfile(profilePlist({ expires: '2026-11-26T12:00:00Z' })), NOW);
    assert.deepEqual(at29.errors, []);
    assert.match(at29.warnings.join('\n'), /expires on 2026-11-26/);
    const at31 = profileProblems(readProfile(profilePlist({ expires: '2026-11-28T12:00:00Z' })), NOW);
    assert.deepEqual(at31.warnings, []);
  });

  it('refuses a wildcard profile', () => {
    const { errors } = profileProblems(readProfile(profilePlist({ bundle: '*' })), NOW);
    assert.match(errors.join('\n'), /wildcard/);
  });

  it('refuses a file that is not a profile', () => {
    const { errors } = profileProblems(readProfile('<plist><dict></dict></plist>'), NOW);
    assert.ok(errors.length >= 5, errors.join('\n'));
  });
});

/** The parsed project.pbxproj objects the xcode package yields, trimmed to what signing reads: values keep their quotes. */
function project() {
  const config = (name: string, bundle: string) => ({
    isa: 'XCBuildConfiguration',
    name,
    buildSettings: { CODE_SIGN_STYLE: 'Automatic', PRODUCT_BUNDLE_IDENTIFIER: `"${bundle}"`, SWIFT_VERSION: '5.0' } as Record<string, string>,
  });
  return {
    PBXNativeTarget: {
      T1: { name: 'App', productType: '"com.apple.product-type.application"', buildConfigurationList: 'L1' },
      T1_comment: 'App',
      T2: { name: 'RestTimerWidget', productType: '"com.apple.product-type.app-extension"', buildConfigurationList: 'L2' },
      T2_comment: 'RestTimerWidget',
      T3: { name: 'Helpers', productType: '"com.apple.product-type.framework"', buildConfigurationList: 'L3' },
    },
    XCConfigurationList: {
      L1: { buildConfigurations: [{ value: 'C1' }, { value: 'C2' }] },
      L2: { buildConfigurations: [{ value: 'C3' }, { value: 'C4' }] },
      L3: { buildConfigurations: [{ value: 'C5' }] },
    },
    XCBuildConfiguration: {
      C1: config('Debug', 'com.bigyerr.ironasylum'),
      C2: config('Release', 'com.bigyerr.ironasylum'),
      C3: config('Debug', 'com.bigyerr.ironasylum.RestTimerWidget'),
      C4: config('Release', 'com.bigyerr.ironasylum.RestTimerWidget'),
      C5: config('Release', 'com.bigyerr.helpers'),
    },
  };
}

const PROFILES = [
  { name: 'Asylum App Store', bundleId: 'com.bigyerr.ironasylum', uuid: 'AAAA-1' },
  { name: 'Asylum Widget App Store', bundleId: 'com.bigyerr.ironasylum.RestTimerWidget', uuid: 'BBBB-2' },
];

describe('the Release configuration signs by hand, each target with its own profile', () => {
  it('sets the app and the widget extension to manual signing with their own profiles', () => {
    const objects = project();
    const signed = signForRelease(objects, TEAM, PROFILES);
    assert.deepEqual(signed, [
      { target: 'App', bundleId: 'com.bigyerr.ironasylum', profile: 'Asylum App Store' },
      { target: 'RestTimerWidget', bundleId: 'com.bigyerr.ironasylum.RestTimerWidget', profile: 'Asylum Widget App Store' },
    ]);
    assert.deepEqual(objects.XCBuildConfiguration.C2.buildSettings, {
      CODE_SIGN_STYLE: 'Manual',
      PRODUCT_BUNDLE_IDENTIFIER: '"com.bigyerr.ironasylum"',
      SWIFT_VERSION: '5.0',
      DEVELOPMENT_TEAM: TEAM,
      CODE_SIGN_IDENTITY: '"Apple Distribution"',
      PROVISIONING_PROFILE_SPECIFIER: '"Asylum App Store"',
    });
    assert.equal(objects.XCBuildConfiguration.C4.buildSettings.PROVISIONING_PROFILE_SPECIFIER, '"Asylum Widget App Store"');
  });

  it('leaves Debug on automatic signing (npm run device-ios) and a framework untouched', () => {
    const objects = project();
    signForRelease(objects, TEAM, PROFILES);
    const untouched = project();
    for (const id of ['C1', 'C3', 'C5'] as const) {
      assert.deepEqual(objects.XCBuildConfiguration[id], untouched.XCBuildConfiguration[id], id);
    }
  });

  it('refuses to archive a signed target that has no profile', () => {
    assert.throws(() => signForRelease(project(), TEAM, PROFILES.slice(0, 1)), /no App Store profile for com\.bigyerr\.ironasylum\.RestTimerWidget/);
  });

  it('refuses a profile no target uses', () => {
    const stray = [...PROFILES, { name: 'Old', bundleId: 'com.bigyerr.old', uuid: 'CCCC-3' }];
    assert.throws(() => signForRelease(project(), TEAM, stray), /no target has the bundle id of "Old" \(com\.bigyerr\.old\)/);
  });
});

describe('the export options send the archive to App Store Connect', () => {
  it('writes the upload plist with both profiles by bundle id', () => {
    assert.equal(
      exportOptions({ team: TEAM, profiles: [PROFILES[1], PROFILES[0]], upload: true }),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>destination</key>
	<string>upload</string>
	<key>manageAppVersionAndBuildNumber</key>
	<false/>
	<key>method</key>
	<string>app-store-connect</string>
	<key>provisioningProfiles</key>
	<dict>
		<key>com.bigyerr.ironasylum</key>
		<string>AAAA-1</string>
		<key>com.bigyerr.ironasylum.RestTimerWidget</key>
		<string>BBBB-2</string>
	</dict>
	<key>signingCertificate</key>
	<string>Apple Distribution</string>
	<key>signingStyle</key>
	<string>manual</string>
	<key>teamID</key>
	<string>ABCDE12345</string>
	<key>uploadSymbols</key>
	<true/>
</dict>
</plist>
`,
    );
  });

  it('exports to disk instead with --no-upload', () => {
    const plist = exportOptions({ team: TEAM, profiles: PROFILES, upload: false });
    assert.match(plist, /<key>destination<\/key>\n\t<string>export<\/string>/);
  });
});
