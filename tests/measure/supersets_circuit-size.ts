// supersets: how many movements a program's circuits hold. Read-only (measure).
// Asked by Mario on 2026-10-26 after the week 9 leg day (Leg circuit — runner armor, four movements, two rounds): "for a
// user its alot to set up at a commercial gym...so maybe keep circuits in a program to like 3 workouts? willing to hear
// pushback".
// Usage: node tests/measure/supersets_circuit-size.ts (IA_APP=<page> for another body)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// The census: HALF_MANNY and every program on the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY).
// A circuit is a section the renderer draws as a superset: superset flag (or type 'superset') and two or more items.
import { createRequire } from 'node:module';
import { fixtures, loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const LATTICE = createRequire(import.meta.url)('../lattice193.js');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const A = loadApp() as any;
const bySize: Record<number, number> = {};
const bigByLabel: Record<string, number> = {};
const fourthName: Record<string, number> = {};
const progsWithBig = new Set<string>();
let progs = 0, days = 0, daysWithBig = 0;
let hmBig = '';
const cfgs: { tag: string; cfg: any }[] = [{ tag: 'HALF_MANNY', cfg: clone(fixtures.HALF_MANNY) }]
  .concat(LATTICE.FULL.map((c: any) => ({ tag: c.tag, cfg: { ...clone(fixtures.HALF_MANNY), ...c.over } })));
for (const { tag, cfg } of cfgs) {
  const p = A.buildProgram(clone(cfg));
  progs++;
  for (const wk of Object.keys(p.weeks)) for (const dk of DAYS) {
    const day = p.weeks[wk][dk];
    if (!day || day.rest || !day.sections) continue;
    days++;
    let big = false;
    for (const s of day.sections) {
      const n = (s.items || []).length;
      if (!((s.superset || s.type === 'superset') && n > 1)) continue;
      bySize[n] = (bySize[n] || 0) + 1;
      if (n >= 4) {
        big = true;
        const lbl = String(s.label || '').replace(/\s+[A-Z]$/, '');
        bigByLabel[lbl] = (bigByLabel[lbl] || 0) + 1;
        s.items.slice(3).forEach((it: any) => { fourthName[it.name] = (fourthName[it.name] || 0) + 1; });
        if (tag === 'HALF_MANNY') hmBig += `  W${wk} ${dk} ${day.title} :: ${s.label} :: ${s.items.map((i: any) => i.name).join(', ')}\n`;
      }
    }
    if (big) { daysWithBig++; progsWithBig.add(tag); }
  }
}
const top = (o: Record<string, number>, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
out(`programs ${progs}; training days ${days}`);
out('circuits by movement count: ' + Object.entries(bySize).map(([k, v]) => `${k}: ${v}`).join(', '));
out(`days with a circuit of 4+: ${daysWithBig}/${days}; programs with one: ${progsWithBig.size}/${progs}`);
out('4+ circuits by label:'); top(bigByLabel, 10).forEach(([k, v]) => out(`  ${v}  ${k}`));
out('movements in slot 4 and later:'); top(fourthName, 12).forEach(([k, v]) => out(`  ${v}  ${k}`));
out('HALF_MANNY 4+ circuits:\n' + (hmBig || '  none'));
