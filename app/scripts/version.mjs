// The root index.html's ia-version, read one way across app/ (Post-V239, Mario): MAJOR.MINOR.PATCH, or the legacy
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
