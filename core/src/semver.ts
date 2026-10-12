/**
 * Versions as MAJOR.MINOR.PATCH, held as three integers, never one number or a raw string. The TypeScript form of
 * tests/semver.js, with the same behaviour; that file stays for the frozen legacy tools, and
 * tests/unit/semver.test.ts holds the two in step.
 *
 * Legacy rule: an integer N (every build through V239, every artifact in git history) reads as 0.N.0, so 239 equals
 * 0.239.0. Compare versions only through `cmp`: a SemVer refuses `<`, `>=`, unary `+` and `v - 1` (it throws), so an
 * unconverted compare is loud.
 */

const BRAND = Symbol.for('ironasylum.semver');
const LEGACY_RE = /^[Vv]?(0|[1-9][0-9]*)$/;
const DOTTED_RE = /^[Vv]?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const META_RE = /<meta name="ia-version" content="([^"]*)"/;

/** What a bump moves. */
export type BumpKind = 'patch' | 'minor' | 'major';

/** A value as an error message names it. */
function describe(v: unknown): string {
  try {
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'symbol') return v.toString();
    return typeof v + ' ' + JSON.stringify(v);
  } catch {
    return typeof v;
  }
}

function bad(v: unknown): TypeError {
  return new TypeError('semver: cannot parse ' + describe(v) + ' as a version (want N, VN, M.m.p or vM.m.p)');
}

function int(s: string | undefined, v: unknown): number {
  const n = Number(s);
  if (s === undefined || !Number.isSafeInteger(n)) throw bad(v);
  return n;
}

/** One parsed version. Frozen; `legacy` is true for a pre-semver integer N, which prints as N. */
export class SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly legacy: boolean;

  constructor(major: number, minor: number, patch: number, legacy: boolean) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.legacy = legacy;
    Object.freeze(this);
  }

  toString(): string {
    if (this.major === Infinity) return 'Infinity';
    if (this.major === -Infinity) return '-Infinity';
    return this.legacy ? String(this.minor) : this.major + '.' + this.minor + '.' + this.patch;
  }

  toJSON(): string {
    return this.toString();
  }

  [Symbol.toPrimitive](hint: string): string {
    if (hint === 'number') {
      throw new TypeError('semver: compare versions with SV.cmp, not a numeric operator (' + this.toString() + ')');
    }
    return this.toString();
  }
}
Object.defineProperty(SemVer.prototype, BRAND, { value: true });
Object.freeze(SemVer.prototype);

const INF = new SemVer(Infinity, Infinity, Infinity, false);
const NINF = new SemVer(-Infinity, -Infinity, -Infinity, false);

/** A SemVer from this module or from tests/semver.js (both carry the same brand). */
export function isSemVer(v: unknown): v is SemVer {
  return v instanceof SemVer || (v !== null && typeof v === 'object' && (v as Record<symbol, unknown>)[BRAND] === true);
}

/**
 * Reads N, VN, M.m.p or vM.m.p (a string, or a safe non-negative integer), Infinity and -Infinity (the open ends of a
 * range) or a SemVer, which comes back as it is. Anything else throws a TypeError that names the input.
 */
export function parse(v: unknown): SemVer {
  if (isSemVer(v)) return v;
  if (typeof v === 'number') {
    if (v === Infinity) return INF;
    if (v === -Infinity) return NINF;
    if (Number.isSafeInteger(v) && v >= 0) return new SemVer(0, v === 0 ? 0 : v, 0, true);
    throw bad(v);
  }
  if (typeof v === 'string') {
    let m = LEGACY_RE.exec(v);
    if (m) return new SemVer(0, int(m[1], v), 0, true);
    m = DOTTED_RE.exec(v);
    if (m) return new SemVer(int(m[1], v), int(m[2], v), int(m[3], v), false);
  }
  throw bad(v);
}

/** -1, 0 or 1: components compare as integers, never as text, and a legacy N equals 0.N.0. */
export function cmp(a: unknown, b: unknown): -1 | 0 | 1 {
  const x = parse(a);
  const y = parse(b);
  for (const k of ['major', 'minor', 'patch'] as const) {
    if (x[k] < y[k]) return -1;
    if (x[k] > y[k]) return 1;
  }
  return 0;
}

/**
 * The row of `table` whose key parses equal to `v`, or undefined. A key that does not parse, or two keys naming one
 * version, throw: a typo in an era table is loud.
 */
export function lookup<T>(table: Readonly<Record<string, T>>, v: unknown): T | undefined {
  if (table === null || typeof table !== 'object') {
    throw new TypeError('semver: lookup wants a table object, got ' + describe(table));
  }
  const want = parse(v);
  let hitKey: string | undefined;
  let hit: T | undefined;
  for (const k of Object.keys(table)) {
    let kv: SemVer;
    try {
      kv = parse(k);
    } catch (e) {
      throw new TypeError('semver: lookup table key ' + JSON.stringify(k) + ' does not parse as a version (' + (e as Error).message + ')');
    }
    if (cmp(kv, want) !== 0) continue;
    if (hitKey !== undefined) {
      throw new TypeError('semver: lookup table keys ' + JSON.stringify(hitKey) + ' and ' + JSON.stringify(k) + ' name one version (' + str(want) + ')');
    }
    hitKey = k;
    hit = table[k];
  }
  return hit;
}

/** The version in an html file's `<meta name="ia-version">`; throws when there is none or it does not parse. */
export function fromHtml(html: string): SemVer {
  const m = META_RE.exec(String(html));
  if (!m) throw new Error('semver: no <meta name="ia-version" content="..."> in the html');
  return parse(m[1]);
}

/** Canonical M.m.p: 239 prints 0.239.0, v1.2.3 prints 1.2.3. */
export function str(v: unknown): string {
  const x = parse(v);
  if (x.major === Infinity || x.major === -Infinity) return x.toString();
  return x.major + '.' + x.minor + '.' + x.patch;
}

/** The version one PATCH, MINOR or MAJOR step on: bump(239, 'patch') is 0.239.1. */
export function bump(v: unknown, kind: BumpKind): SemVer {
  const x = parse(v);
  if (x.major === Infinity || x.major === -Infinity) throw new TypeError('semver: cannot bump a range sentinel (' + x + ')');
  if (kind === 'patch') return new SemVer(x.major, x.minor, x.patch + 1, false);
  if (kind === 'minor') return new SemVer(x.major, x.minor + 1, 0, false);
  if (kind === 'major') return new SemVer(x.major + 1, 0, 0, false);
  throw new TypeError('semver: bump kind must be patch, minor or major, got ' + describe(kind));
}

/**
 * Of the lines that parse, the greatest strictly below `v`, returned exactly as written (undefined when none). The
 * previous version of a candidate is the greatest tag strictly below it, never N - 1. Of two lines naming one version
 * the first wins.
 */
export function below(lines: Iterable<string>, v: unknown): string | undefined {
  const want = parse(v);
  let hit: string | undefined;
  let hitV: SemVer | undefined;
  for (const line of lines) {
    let x: SemVer;
    try {
      x = parse(line);
    } catch {
      continue;
    }
    if (cmp(x, want) >= 0) continue;
    if (hitV === undefined || cmp(x, hitV) > 0) {
      hit = line;
      hitV = x;
    }
  }
  return hit;
}

/**
 * A version as a label prints it (CLAUDE.md, PRIORITY 1): a pre-semver build is V<N> (V239), a dotted version is
 * v<M.m.p> (v0.239.1). Display only: never compare or key on it. A value that does not parse prints as 'V' + value,
 * exactly what the old `'V' + version` displays printed, so a log line never throws.
 */
export function tag(v: unknown): string {
  let x: SemVer;
  try {
    x = parse(v);
  } catch {
    return 'V' + String(v);
  }
  if (x.major === Infinity || x.major === -Infinity) return x.toString();
  return x.legacy ? 'V' + x.minor : 'v' + str(x);
}
