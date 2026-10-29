// Release signing for the iOS app: what `scripts/ios.mjs release` (the pipeline's TestFlight upload job) needs, kept
// apart from ios.mjs so the unit tests can import it (test/unit/release-signing.test.ts).
//
// Plain signing (Mario, Post-v0.251.1): one Apple Distribution certificate and one App Store profile per signed target,
// the app (com.bigyerr.ironasylum) and its RestTimerWidget extension, made once by Mario and held as GitHub secrets.
// No fastlane and no certificates repo. Not Xcode's cloud signing either: that needs an Admin-role API key, and a fresh
// runner would still need a stored development certificate to sign the archive.
//
//   readProfile(plist)                        a decoded .mobileprovision (the XML `security cms -D -i` prints):
//                                             { name, uuid, team, bundleId, expires, appStore, certs }
//   profileProblems(profile, now)             { errors, warnings }: why the profile cannot sign a TestFlight build, and
//                                             whether it expires within 30 days
//   signForRelease(objects, team, profiles)   the Release configuration of the app and every app extension set to
//                                             manual signing with its own profile (the parsed project.pbxproj's objects)
//   exportOptions({ team, profiles, upload }) the ExportOptions.plist for xcodebuild -exportArchive
//
// The Debug configuration is left alone, so npm run device-ios keeps Xcode's automatic signing.
import { createHash } from 'node:crypto';

/** The product types that carry a signature and a profile of their own. */
const SIGNED_TYPES = ['com.apple.product-type.application', 'com.apple.product-type.app-extension'];
const IDENTITY = 'Apple Distribution';
/** How far ahead an expiring profile is warned about. */
export const RENEW_DAYS = 30;

const unquote = (v) => (typeof v === 'string' ? v.replace(/^"(.*)"$/, '$1') : v);
const quote = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const decode = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The value of a <key> followed by an element of this tag, the first in document order. */
function value(plist, key, tag) {
  const m = new RegExp(`<key>${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</key>\\s*<${tag}>([^<]*)</${tag}>`).exec(plist);
  return m ? decode(m[1]) : undefined;
}

/**
 * A provisioning profile, read from its decoded plist. `certs` holds the SHA-1 of each certificate the profile signs
 * with, upper-case hex: the hash `security find-identity` prints, so a keychain identity can be matched to it.
 * @param {string} plist
 */
export function readProfile(plist) {
  const team = /<key>TeamIdentifier<\/key>\s*<array>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1];
  const appId = value(plist, 'application-identifier', 'string');
  const expires = value(plist, 'ExpirationDate', 'date');
  const certBlock = /<key>DeveloperCertificates<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(plist)?.[1] ?? '';
  const certs = [...certBlock.matchAll(/<data>([^<]*)<\/data>/g)].map((m) =>
    createHash('sha1').update(Buffer.from(m[1].replace(/\s+/g, ''), 'base64')).digest('hex').toUpperCase(),
  );
  const devices = /<key>(ProvisionedDevices|ProvisionsAllDevices)<\/key>/.test(plist);
  const debuggable = /<key>get-task-allow<\/key>\s*<true\s*\/>/.test(plist);
  return {
    name: value(plist, 'Name', 'string'),
    uuid: value(plist, 'UUID', 'string'),
    team,
    bundleId: appId && team && appId.startsWith(`${team}.`) ? appId.slice(team.length + 1) : appId,
    expires: expires ? new Date(expires) : undefined,
    appStore: !devices && !debuggable,
    certs,
  };
}

/**
 * @param {ReturnType<typeof readProfile>} profile
 * @param {Date} now
 */
export function profileProblems(profile, now) {
  const errors = [];
  const warnings = [];
  const label = profile.name ? `"${profile.name}"` : 'a profile';
  for (const field of ['name', 'uuid', 'team', 'bundleId', 'expires']) {
    if (profile[field] === undefined) errors.push(`${label} has no ${field}; is it a .mobileprovision file?`);
  }
  if (!profile.appStore) {
    errors.push(`${label} is a development or ad hoc profile; TestFlight needs a Distribution profile of type App Store Connect`);
  }
  if (profile.bundleId?.endsWith('*')) errors.push(`${label} is a wildcard profile; each target needs its own App ID`);
  if (profile.certs.length === 0) errors.push(`${label} lists no certificate`);
  if (profile.expires && !Number.isNaN(profile.expires.getTime())) {
    const day = profile.expires.toISOString().slice(0, 10);
    if (profile.expires <= now) errors.push(`${label} expired on ${day}; renew the certificate and both profiles`);
    else if (profile.expires.getTime() - now.getTime() < RENEW_DAYS * 86_400_000) {
      warnings.push(`${label} expires on ${day}; renew the certificate and both profiles before then`);
    }
  }
  return { errors, warnings };
}

/**
 * Sets each signed target's Release configuration to manual signing with the profile for its bundle id. Throws when a
 * signed target has no profile, or a profile matches no target, so a new extension cannot ship unsigned or a stale
 * secret go unnoticed. Returns what it signed, one { target, bundleId, profile } per target.
 * @param {Record<string, any>} objects  project.hash.project.objects of the parsed project.pbxproj
 * @param {string} team
 * @param {Array<{ name: string, bundleId: string }>} profiles
 */
export function signForRelease(objects, team, profiles) {
  const byId = new Map(profiles.map((p) => [p.bundleId, p]));
  const used = new Set();
  const signed = [];
  const targets = Object.entries(objects.PBXNativeTarget ?? {}).filter(([key]) => !key.endsWith('_comment'));
  for (const [, target] of targets) {
    if (!SIGNED_TYPES.includes(unquote(target.productType))) continue;
    const name = unquote(target.name);
    const list = objects.XCConfigurationList?.[target.buildConfigurationList];
    const release = (list?.buildConfigurations ?? [])
      .map((ref) => objects.XCBuildConfiguration?.[ref.value])
      .find((c) => c && unquote(c.name) === 'Release');
    if (!release) throw new Error(`the ${name} target has no Release configuration`);
    const bundleId = unquote(release.buildSettings.PRODUCT_BUNDLE_IDENTIFIER);
    const profile = byId.get(bundleId);
    if (!profile) throw new Error(`no App Store profile for ${bundleId} (the ${name} target)`);
    Object.assign(release.buildSettings, {
      CODE_SIGN_STYLE: 'Manual',
      DEVELOPMENT_TEAM: team,
      CODE_SIGN_IDENTITY: quote(IDENTITY),
      PROVISIONING_PROFILE_SPECIFIER: quote(profile.name),
    });
    used.add(bundleId);
    signed.push({ target: name, bundleId, profile: profile.name });
  }
  const unused = profiles.filter((p) => !used.has(p.bundleId));
  if (unused.length) {
    throw new Error(`no target has the bundle id of ${unused.map((p) => `"${p.name}" (${p.bundleId})`).join(', ')}`);
  }
  return signed;
}

/**
 * The export options: App Store Connect, manual signing with the same profiles, and `destination` upload (straight to
 * App Store Connect) or export (an .ipa on disk, for a local proof). The build number is config.xml's, never Xcode's.
 * @param {{ team: string, profiles: Array<{ bundleId: string, uuid: string }>, upload: boolean }} opts
 */
export function exportOptions({ team, profiles, upload }) {
  const entries = [...profiles]
    .sort((a, b) => a.bundleId.localeCompare(b.bundleId))
    .map((p) => `\t\t<key>${escape(p.bundleId)}</key>\n\t\t<string>${escape(p.uuid)}</string>\n`)
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
    '<plist version="1.0">\n<dict>\n' +
    `\t<key>destination</key>\n\t<string>${upload ? 'upload' : 'export'}</string>\n` +
    '\t<key>manageAppVersionAndBuildNumber</key>\n\t<false/>\n' +
    '\t<key>method</key>\n\t<string>app-store-connect</string>\n' +
    `\t<key>provisioningProfiles</key>\n\t<dict>\n${entries}\t</dict>\n` +
    `\t<key>signingCertificate</key>\n\t<string>${IDENTITY}</string>\n` +
    '\t<key>signingStyle</key>\n\t<string>manual</string>\n' +
    `\t<key>teamID</key>\n\t<string>${escape(team)}</string>\n` +
    '\t<key>uploadSymbols</key>\n\t<true/>\n' +
    '</dict>\n</plist>\n'
  );
}
