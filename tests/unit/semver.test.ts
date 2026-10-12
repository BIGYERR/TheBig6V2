// Versions as MAJOR.MINOR.PATCH (CLAUDE.md, PRIORITY 1): @ia/core's semver (core/src/semver.ts), the release version
// in core/src/version.ts, and their agreement with the two places that held them before, tests/semver.js (kept for the
// frozen legacy tools) and index.html's <meta name="ia-version">.
//
// Oracles: hand-typed versions, orders and labels, the rows of tests/semver.js's own selftest carried across (S1 to
// S11 and S13; S12 is its command line, which only that file has). The meta is read out of index.html as text.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { VERSION, semver } from '@ia/core';
import { REPO } from '../support/app.ts';

const { SemVer, below, bump, cmp, fromHtml, isSemVer, lookup, parse, str, tag } = semver;
/** The legacy tests/semver.js (CommonJS), for the agreement checks only. */
const LEGACY: typeof semver = createRequire(import.meta.url)('../semver.js');

/** The TypeError a call throws, or a note that it did not throw one. */
function thrown(fn: () => unknown): TypeError | string {
  try {
    fn();
  } catch (e) {
    return e instanceof TypeError ? e : `threw ${(e as Error).name}`;
  }
  return 'no throw';
}

describe('the release version', () => {
  test('core/src/version.ts holds the version as MAJOR.MINOR.PATCH', () => {
    assert.match(VERSION, /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/);
  });

  test("core/src/version.ts equals index.html's ia-version meta, so a release writes both", () => {
    const html = readFileSync(join(REPO, 'index.html'), 'utf8');
    const metas = [...html.matchAll(/<meta name="ia-version" content="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(metas.length, 1, 'index.html carries one ia-version meta');
    assert.equal(metas[0], VERSION, 'the meta is written exactly as core/src/version.ts writes it');
  });
});

describe('parse', () => {
  test('reads N, VN, M.m.p and vM.m.p, legacy N as 0.N.0 (S1)', () => {
    const rows: [unknown, number, number, number, boolean][] = [
      [239, 0, 239, 0, true], [0, 0, 0, 0, true], ['239', 0, 239, 0, true], ['V239', 0, 239, 0, true], ['v239', 0, 239, 0, true],
      ['0.239.1', 0, 239, 1, false], ['v0.239.1', 0, 239, 1, false], ['V1.0.0', 1, 0, 0, false], ['0.0.0', 0, 0, 0, false],
      ['10.20.30', 10, 20, 30, false],
    ];
    for (const [v, major, minor, patch, legacy] of rows) {
      const x = parse(v);
      assert.deepEqual({ major: x.major, minor: x.minor, patch: x.patch, legacy: x.legacy }, { major, minor, patch, legacy }, String(v));
      assert.ok(Object.isFrozen(x), `${String(v)} parses to a frozen value`);
    }
  });

  test('Infinity and -Infinity are the open ends of a range (S2)', () => {
    assert.equal(parse(Infinity).major, Infinity);
    assert.equal(parse(Infinity).patch, Infinity);
    assert.equal(parse(-Infinity).major, -Infinity);
    assert.equal(parse(-Infinity).patch, -Infinity);
  });

  test('a SemVer comes back as it is (S3)', () => {
    const v = parse('0.239.1');
    assert.equal(parse(v), v);
  });

  test('anything else throws a TypeError naming the input (S4)', () => {
    const rows: [unknown, string][] = [
      [NaN, 'NaN'], [null, 'null'], [undefined, 'undefined'], ['', '""'], ['1.2', '"1.2"'], ['0.239.1-rc1', '"0.239.1-rc1"'],
      [-1, '-1'], ['-1', '"-1"'], [1.5, '1.5'], ['1.5', '"1.5"'], ['0239', '"0239"'], ['0.0239.0', '"0.0239.0"'],
      ['1.2.3.4', '"1.2.3.4"'], ['x239', '"x239"'], [' 239', '" 239"'], ['239 ', '"239 "'], ['Infinity', '"Infinity"'],
      [true, 'boolean true'], [{}, 'object {}'], [[239], 'object [239]'],
      [{ major: 0, minor: 239, patch: 0 }, 'object {"major":0,"minor":239,"patch":0}'],
    ];
    for (const [v, named] of rows) {
      const e = thrown(() => parse(v));
      assert.ok(e instanceof TypeError, `${named}: ${String(e)}`);
      assert.ok(e.message.includes('cannot parse ' + named + ' as a version'), e.message);
    }
  });
});

describe('printing', () => {
  test('a legacy version prints its integer, a dotted one M.m.p, and toJSON is toString (S5)', () => {
    assert.equal(String(parse(239)), '239');
    assert.equal(String(parse('V239')), '239');
    assert.equal(String(parse('v0.239.1')), '0.239.1');
    assert.equal(JSON.stringify({ v: parse(239), w: parse('0.239.1') }), '{"v":"239","w":"0.239.1"}');
  });

  test('str is canonical M.m.p: 239 gives 0.239.0, v1.2.3 gives 1.2.3 (S5)', () => {
    assert.equal(str(239), '0.239.0');
    assert.equal(str('V239'), '0.239.0');
    assert.equal(str('v1.2.3'), '1.2.3');
  });

  test('tag prints V<N> for a pre-semver build and v<M.m.p> for a dotted one, and never throws (S13)', () => {
    assert.equal(tag(239), 'V239');
    assert.equal(tag('239'), 'V239');
    assert.equal(tag('V239'), 'V239');
    assert.equal(tag('0.239.1'), 'v0.239.1');
    assert.equal(tag('V0.239.1'), 'v0.239.1');
    assert.equal(tag(parse('0.240.0')), 'v0.240.0');
    assert.equal(tag(undefined), 'Vundefined');
    assert.equal(tag(null), 'Vnull');
    assert.equal(tag(NaN), 'VNaN');
  });
});

describe('cmp', () => {
  test('orders -Infinity < 0 < 220 < 0.239.0 < 0.239.1 < 0.240.0 < 1.0.0 < 1.0.1 < 1.1.0 < Infinity, both ways (S6)', () => {
    const chain = [-Infinity, 0, 220, '0.239.0', '0.239.1', 'v0.240.0', '1.0.0', '1.0.1', '1.1.0', Infinity];
    chain.forEach((a, i) => chain.forEach((b, j) => assert.equal(cmp(a, b), i < j ? -1 : i > j ? 1 : 0, `cmp(${a}, ${b})`)));
  });

  test('a legacy N equals 0.N.0, and components compare as integers, never as text (S6)', () => {
    assert.equal(cmp(239, '0.239.0'), 0);
    assert.equal(cmp('V239', 'v0.239.0'), 0);
    assert.equal(cmp(239, '0.239.1'), -1);
    assert.equal(cmp('0.239.1', 240), -1);
    assert.equal(cmp(10, 9), 1);
    assert.equal(cmp('0.10.0', '0.9.0'), 1);
    assert.equal(cmp('0.0.10', '0.0.9'), 1);
    assert.ok(thrown(() => cmp('0.239', 239)) instanceof TypeError);
  });

  test('a SemVer refuses numeric operators and is frozen (S8)', () => {
    const v = parse(239);
    const w = parse('0.239.1');
    const n = (x: unknown): number => x as number;
    for (const [what, fn] of [
      ['v >= 220', () => n(v) >= 220], ['v < w', () => n(v) < n(w)], ['+v', () => +n(v)], ['v - 1', () => n(v) - 1], ['Number(w)', () => Number(w)],
    ] as const) {
      const e = thrown(fn);
      assert.ok(e instanceof TypeError && /SV\.cmp/.test(e.message), `${what}: ${String(e)}`);
    }
    assert.equal('x' + v, 'x239');
    assert.equal(`${w}`, '0.239.1');
    // A property key reads the toString text: P[v] and P[w].
    const P: Record<string, string> = { 239: 'c', '0.239.1': 'y' };
    assert.equal(P[v as unknown as string], 'c');
    assert.equal(P[w as unknown as string], 'y');
    assert.ok(Object.isFrozen(v));
    assert.ok(thrown(() => ((v as { minor: number }).minor = 240)) instanceof TypeError);
  });
});

describe('lookup', () => {
  test('integer keys: 239, "239" and "0.239.0" all find the [239] row; an absent version is undefined (S7)', () => {
    const T = { 200: 'a', 238: 'b', 239: 'c' };
    assert.equal(lookup(T, 239), 'c');
    assert.equal(lookup(T, '239'), 'c');
    assert.equal(lookup(T, '0.239.0'), 'c');
    assert.equal(lookup(T, parse('V239')), 'c');
    assert.equal(lookup(T, '0.239.1'), undefined);
    assert.equal(lookup(T, 240), undefined);
  });

  test('dotted keys: 239 finds 0.239.0, and 0.239.1 and v1.0.0 find their rows (S7)', () => {
    const D = { '0.239.0': 'x', '0.239.1': 'y', '1.0.0': 'z' };
    assert.equal(lookup(D, 239), 'x');
    assert.equal(lookup(D, '0.239.1'), 'y');
    assert.equal(lookup(D, 'v1.0.0'), 'z');
  });

  test('a key that does not parse, or two keys naming one version, throw (S7)', () => {
    const bad = thrown(() => lookup({ 239: 'c', '23 9': 'd' }, 239));
    assert.ok(bad instanceof TypeError && /does not parse/.test(bad.message), String(bad));
    const twice = thrown(() => lookup({ 239: 'c', '0.239.0': 'd' }, 239));
    assert.ok(twice instanceof TypeError && /name one version/.test(twice.message), String(twice));
  });
});

describe('fromHtml, bump and below', () => {
  test('fromHtml reads a legacy or a dotted meta and throws on none or a bad one (S9)', () => {
    assert.equal(String(fromHtml('<meta name="ia-version" content="239"><!-- x -->')), '239');
    assert.equal(fromHtml('<meta name="ia-version" content="239">').legacy, true);
    assert.equal(str(fromHtml('<head><meta name="ia-version" content="0.239.1"></head>')), '0.239.1');
    assert.throws(() => fromHtml('<head></head>'), /no <meta/);
    const e = thrown(() => fromHtml('<meta name="ia-version" content="0.239">'));
    assert.ok(e instanceof TypeError && /cannot parse "0\.239"/.test(e.message), String(e));
  });

  test('bump: 239 patch is 0.239.1, 0.239.1 minor is 0.240.0 and major is 1.0.0; an unknown kind throws (S10)', () => {
    assert.equal(str(bump(239, 'patch')), '0.239.1');
    assert.equal(bump(239, 'patch').legacy, false);
    assert.equal(str(bump('0.239.1', 'minor')), '0.240.0');
    assert.equal(str(bump('0.239.1', 'major')), '1.0.0');
    assert.ok(thrown(() => bump(239, 'build' as 'patch')) instanceof TypeError);
  });

  test('below gives the greatest line strictly below, as written (S11)', () => {
    const TAGS = ['V237', 'V238', 'V239', 'v0.239.1', 'v0.240.0', 'junk'];
    assert.equal(below(TAGS, 239), 'V238');
    assert.equal(below(TAGS, '0.239.1'), 'V239');
    assert.equal(below(TAGS, '0.240.0'), 'v0.239.1');
    assert.equal(below(TAGS, 238), 'V237');
    assert.equal(below(TAGS, 237), undefined);
    assert.equal(below(['v0.240.0', 'junk', 'V239', 'V237', 'v0.239.1', 'V238'], '0.240.0'), 'v0.239.1', 'every line is read');
    assert.equal(below(['V239', 'v0.239.0', '239'], '0.239.1'), 'V239', 'of two lines naming one version the first wins');
    assert.equal(below([' 238', '238 ', 'V200'], 239), 'V200', 'a padded number is skipped');
    assert.ok(thrown(() => below(TAGS, '0.239')) instanceof TypeError);
  });
});

describe('agreement with tests/semver.js', () => {
  const INPUTS: unknown[] = [
    0, 1, 239, '239', 'V239', 'v239', '0.239.0', '0.239.1', 'v0.239.1', 'V1.0.0', '10.20.30', Infinity, -Infinity,
    NaN, null, undefined, '', '1.2', '0239', ' 239', 'junk', -1, 1.5, true, {},
  ];
  const outcome = (fn: () => unknown): string => {
    try {
      return 'ok ' + JSON.stringify(fn());
    } catch (e) {
      return `${(e as Error).name}: ${(e as Error).message}`;
    }
  };

  test('parse, str and tag give the same result or the same error for every input', () => {
    for (const v of INPUTS) {
      for (const f of ['parse', 'str', 'tag'] as const) {
        assert.equal(outcome(() => semver[f](v)), outcome(() => LEGACY[f](v)), `${f}(${String(v)})`);
      }
    }
  });

  test('cmp agrees on every pair of inputs, and a SemVer from either side is recognised by both', () => {
    for (const a of INPUTS) for (const b of INPUTS) assert.equal(outcome(() => cmp(a, b)), outcome(() => LEGACY.cmp(a, b)), `cmp(${String(a)}, ${String(b)})`);
    assert.ok(isSemVer(LEGACY.parse('0.239.1')));
    assert.ok(LEGACY.isSemVer(parse('0.239.1')));
    assert.ok(parse('0.239.1') instanceof SemVer);
  });
});
