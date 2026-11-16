// day-edits: what D291 moves for a program whose config holds a preference for a core, trunk or carry move.
// Read-only (measure). Before D291 a preference that named one of the engine's shared items renamed the table's own
// member part way through the build, so the weeks after it were drawn from a table that already held the new name.
// With D291 the table stays as written and the trade is made on each day's own copy.
//
// For each of HALF_MANNY and the ten seeded programs, and each core pillar member the program holds, the config is
// given one preference (that member for another member of the same program) and built on a fresh page of the release
// before and on a fresh page of this one. A fresh page each time: the release before keeps the rename for the rest
// of a launch.
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/day-edits_core-preference.ts <the page of the release before>
//        (node tools/app-at.mjs <its commit> <file> writes that page; writes tests/measure/day-edits_core-preference.md)
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';

const BEFORE = process.argv[2]!;
const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const TODAY = new Date(2026, 9, 11, 12, 0, 0);
const build = (file: string | null, cfg: Record<string, unknown>): any => { const IA = file ? loadApp({ file }) : loadApp(); pinClock(IA, TODAY); return JSON.parse(JSON.stringify(IA.buildProgram(cfg).weeks)); };
const coreNames = (weeks: any): string[] => {
  const names = new Set<string>();
  for (const w of Object.keys(weeks)) for (const d of Object.keys(weeks[w])) for (const s of ((weeks[w][d] || {}).sections || [])) if (s.core) for (const it of (s.items || [])) names.add(it.name);
  return [...names].sort();
};
const daysOff = (a: any, b: any): string[] => {
  const off: string[] = [];
  for (const w of Object.keys(a)) for (const d of Object.keys(a[w])) if (JSON.stringify(a[w][d]) !== JSON.stringify((b[w] || {})[d])) off.push('w' + w + ' ' + d);
  return off;
};

say('# A preference for a core move: what D291 moves');
say();
say('Read-only measure. Each config built on a fresh page of the release before (`' + BEFORE.split('/').pop() + '`) and on a fresh page of this one.');
say();
say('| program | core members it holds | preferences tried | same program on both | differ | days that differ, at most | the plain program with the trade made: before | now |');
say('|---|---|---|---|---|---|---|---|');
/** Every section's names, with the trade made on the plain program's: what a preference is ruled to give. */
const names = (g: any, from?: string, to?: string): string => JSON.stringify(Object.keys(g).map((w) => Object.keys(g[w]).map((d) => ((g[w][d] || {}).sections || []).map((x: any) => (x.items || []).map((it: any) => (it.name === from ? to : it.name))))));
let tried = 0, same = 0, plain = 0, tradedBefore = 0, tradedNow = 0;
const examples: string[] = [];
for (const [name, cfg] of [['half-manny, the fixture', fixtures.HALF_MANNY] as [string, unknown], ...Object.entries(PROGRAMS)]) {
  const c = cfg as Record<string, unknown>;
  const a0 = build(BEFORE, c), b0 = build(null, c);
  if (JSON.stringify(a0) === JSON.stringify(b0)) plain++;
  let t = 0, s = 0, most = 0, tb = 0, tn = 0;
  const members = coreNames(b0);
  members.forEach((from, i) => {
    const to = members[(i + 1) % members.length]!;
    if (to === from) return;
    const withPref = { ...c, exSwapPrefs: { [from]: to } };
    const a = build(BEFORE, withPref), b = build(null, withPref);
    t++;
    if (names(a) === names(a0, from, to)) tb++;
    if (names(b) === names(b0, from, to)) tn++;
    const off = daysOff(a, b);
    if (!off.length) s++;
    else {
      most = Math.max(most, off.length);
      if (examples.length < 4) {
        const [w, d] = off[0]!.slice(1).split(' ') as [string, string];
        const core = (g: any): string => ((g[w][d].sections || []).filter((x: any) => x.core)[0]?.items || []).map((it: any) => it.name + ' (' + it.detail + ')').join(' + ');
        examples.push(name + ', ' + from + ' for ' + to + ', week ' + w + ' ' + d + ': before `' + core(a) + '`, now `' + core(b) + '`');
      }
    }
  });
  tried += t; same += s; tradedBefore += tb; tradedNow += tn;
  say('| ' + name + ' | ' + members.length + ' | ' + t + ' | ' + s + ' | ' + (t - s) + ' | ' + most + ' | ' + tb + ' | ' + tn + ' |');
}
say();
say('- With no preference, the program is the same on both pages for ' + plain + ' of 11.');
say('- ' + tried + ' preferences tried; ' + same + ' build the same program on both pages, ' + (tried - same) + ' do not.');
say('- The program a preference is ruled to give is the plain program with the trade made wherever the move stands (every section\'s names compared): ' + tradedBefore + ' of ' + tried + ' on the release before, ' + tradedNow + ' of ' + tried + ' now.');
say();
if (examples.length) { say('Where they differ, the first day of each of the first few:'); say(); for (const e of examples) say('- ' + e); say(); }
writeFileSync(join(import.meta.dirname, 'day-edits_core-preference.md'), out.join('\n') + '\n');
console.log('wrote day-edits_core-preference.md, ' + out.length + ' lines');
