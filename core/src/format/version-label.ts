/**
 * The version as people read it: 'v' plus MAJOR.MINOR.PATCH. The same rules as the app's iaVersionLabel (index.html,
 * next to IA_VERSION; docs/decisions/version-label.md, D236):
 * - one leading v or V is dropped first, so the label never reads vv;
 * - a pre-semver integer N reads 0.N.0, so 239 prints v0.239.0;
 * - anything else prints as given after one v, so the label never throws.
 */
export function versionLabel(ver: unknown): string {
  const s = String(ver);
  const t = /^[vV]/.test(s) ? s.slice(1) : s;
  return /^(0|[1-9][0-9]*)$/.test(t) ? 'v0.' + t + '.0' : 'v' + t;
}
