// day-edits: which objects of a built program are shared, anywhere in it, and where do they come from?
// Read-only (measure), before the fix for the engine's shared items (tests/measure/day-edits_shared-items.md).
// Today's page in the VM harness. For each program, buildProgram is called twice on one config and every object and
// array the two grids reach is walked:
//
//   within one build   an object reached by two paths is one object in two places;
//   across two builds  an object of the first build found in the second is one of the engine's own (a table's
//                      entry, or anything else it keeps and hands out).
//
// A. The 864-config lattice (tests/lattice193.js FULL, HALF_MANNY overlaid, as tests/sweeps/program-output.test.ts
//    builds it) and the ten seeded programs.
// B. The same after each writer that edits a day in place has run on one program: which of them writes to a shared
//    object (read from the code, listed by hand; the count is of the objects they can reach).
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/day-edits_shared-objects.ts
//        (writes tests/measure/day-edits_shared-objects.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const LATTICE: { FULL: { tag: string; over: Record<string, unknown> }[] } = createRequire(import.meta.url)('../lattice193.js');
const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));

/** A path with its numbers taken out, so places of one kind count together. */
const kind = (path: string): string => path.replace(/^weeks\.\d+\.[a-z]+/, 'weeks.W.day').replace(/\.\d+/g, '[n]');
interface Found { within: Record<string, number>; across: Record<string, number>; names: Record<string, number>; objects: number }

function walk(root: unknown, each: (o: object, path: string) => void): void {
  const go = (v: unknown, path: string): void => {
    if (!v || typeof v !== 'object') return;
    each(v as object, path);
    if (Array.isArray(v)) v.forEach((x, i) => go(x, path + '.' + i));
    else for (const k of Object.keys(v as object)) go((v as Record<string, unknown>)[k], path ? path + '.' + k : k);
  };
  go(root, '');
}
function shared(cfg: Record<string, unknown>, F: Found): void {
  const a = IA.buildProgram(cfg) as { weeks: unknown }, b = IA.buildProgram(cfg) as { weeks: unknown };
  const seen = new Map<object, string>();
  walk({ weeks: a.weeks }, (o, path) => {
    F.objects++;
    const was = seen.get(o);
    if (was !== undefined) { F.within[kind(was) + ' and ' + kind(path)] = (F.within[kind(was) + ' and ' + kind(path)] || 0) + 1; return; }
    seen.set(o, path);
  });
  const once = new Set<object>();
  walk({ weeks: b.weeks }, (o, path) => {
    if (!seen.has(o) || once.has(o)) return;
    once.add(o);
    F.across[kind(path)] = (F.across[kind(path)] || 0) + 1;
    const name = (o as { name?: unknown }).name;
    if (typeof name === 'string') F.names[name] = (F.names[name] || 0) + 1;
  });
}
const found = (): Found => ({ within: {}, across: {}, names: {}, objects: 0 });
const list = (m: Record<string, number>): string => Object.keys(m).sort((x, y) => m[y]! - m[x]!).map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';

say('# Every object a built program shares: where, and whose');
say();
say('Read-only measure, today\'s page in the VM harness, `buildProgram` called twice on each config.');
say();
say('## A. The lattice and the ten programs');
say();
{
  const F = found();
  let programs = 0, withShared = 0;
  for (const { over } of LATTICE.FULL) {
    const before = Object.keys(F.across).reduce((n, k) => n + F.across[k]!, 0);
    shared({ ...fixtures.HALF_MANNY, ...over }, F);
    programs++;
    if (Object.keys(F.across).reduce((n, k) => n + F.across[k]!, 0) > before) withShared++;
  }
  say('- **The 864 lattice programs:** ' + F.objects.toLocaleString('en-US') + ' objects and arrays walked. ' + withShared + ' of ' + programs + ' programs hand back at least one object of the engine\'s own.');
  say('  - One of the engine\'s own objects, by where it stands: ' + list(F.across) + '.');
  say('  - One object in two places of one build, by the two places: ' + list(F.within) + '.');
  say('  - Their names, by how many programs hold each: ' + list(F.names) + '.');
  say();
}
{
  const F = found();
  for (const cfg of Object.values(PROGRAMS)) shared(cfg as unknown as Record<string, unknown>, F);
  say('- **The ten seeded programs:** ' + F.objects.toLocaleString('en-US') + ' objects and arrays walked.');
  say('  - One of the engine\'s own objects, by where it stands: ' + list(F.across) + '.');
  say('  - One object in two places of one build, by the two places: ' + list(F.within) + '.');
  say('  - Their names: ' + list(F.names) + '.');
  say();
}

writeFileSync(join(import.meta.dirname, 'day-edits_shared-objects.md'), out.join('\n') + '\n');
console.log('wrote day-edits_shared-objects.md, ' + out.length + ' lines');
