// App versions as the app reports them in each heartbeat (IA_VERSION). Before the semver switch ia-version was a bare
// integer N, which reads as 0.N.0; after it, MAJOR.MINOR.PATCH. Anything else cannot be compared, so it is never
// called old. The backend ships without the repo beside it (Heroku, the docker image), so it carries its own copy of
// the rule in tests/semver.js instead of requiring that file.

// The same reading as tests/semver.js (test/semver-parity.test.js proves they agree): N, VN or vN is 0.N.0;
// M.m.p or vM.m.p is semver; no leading zeros, no pre-release or build suffix, no spaces.
const LEGACY_RE = /^[Vv]?(0|[1-9][0-9]*)$/;
const DOTTED_RE = /^[Vv]?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

/** [major, minor, patch], or null when the value is not a version. */
export function parseVersion(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? [0, value, 0] : null;
  if (typeof value !== 'string') return null;
  const legacy = LEGACY_RE.exec(value);
  const dotted = legacy ? null : DOTTED_RE.exec(value);
  const parts = legacy ? [0, Number(legacy[1]), 0] : dotted ? [Number(dotted[1]), Number(dotted[2]), Number(dotted[3])] : null;
  return parts && parts.every(Number.isSafeInteger) ? parts : null;
}

/** MAJOR.MINOR.PATCH, or '' when the text is not a version. */
export function normalizeVersion(value) {
  const v = parseVersion(value);
  return v ? v.join('.') : '';
}

/** Negative when a is older than b. A version that cannot be read sorts below every one that can. */
export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) return Number(Boolean(va)) - Number(Boolean(vb));
  for (let i = 0; i < 3; i++) if (va[i] !== vb[i]) return va[i] - vb[i];
  return 0;
}

/** True only when both read as versions and `value` is below `latest`. */
export function isOutdated(value, latest) {
  return Boolean(parseVersion(value) && parseVersion(latest)) && compareVersions(value, latest) < 0;
}
