// supersets: what a superset's last live member prints and logs once its partner is skipped. Read-only (measure).
// Reported by Mario on 2026-10-26 with a screenshot: week 10 Monday, Posterior Chain, "Pull superset A — reduced to
// straight sets", Barbell row skipped, Chinups printed "2×2 sets — RPE 7 (leave 3 or more in reserve)" and logged its
// two sets in seconds ("7 / 5 sec", +5 and +3 against a target of 2): "why is chinups in seconds? tf does that mean".
// Usage: node tests/measure/supersets_survivor-straight-sets.ts (IA_APP=<page> for another body)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// Part A, the census: every program on the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY) plus
// HALF_MANNY itself. For every superset section of two or more items, each member in turn is left the one live member
// (the others skipped), and the card the renderer draws is read back: its detail string and what parseRx makes of it.
// Part B, the parser's unit token: every item detail the lattice prescribes, and every Wildcard detail, that the strict
// N×M grammar reads as seconds or yards off a word that is not a unit ("2×2 sets", "3×8 slow").
import { createRequire } from 'node:module';
import { fixtures, loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const LATTICE = createRequire(import.meta.url)('../lattice193.js');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const A = loadApp() as any;
const parseRx = A.eval('parseRx');
const render = A.eval('buildSectionsHTML');
const rounds = A.eval('_secRounds');

// The card's detail as drawn: the line under the movement name. buildExItem prints it in an element whose class names
// the detail; read every such line in order and pair it with the item names the HTML carries.
function drawnDetails(html: string): string[] {
  const got: string[] = [];
  const re = /class="ex-detail[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) got.push(m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim());
  return got;
}

const t = { progs: 0, ss: 0, ssRounds: 0, members: 0, drawn: 0, garbled: 0, asSec: 0, ownSec: 0, setsWord: 0,
  setsWordRoundsEq: 0, setsWordRoundsNe: 0 };
const garbledEx: Record<string, number> = {};
const asSecEx: Record<string, number> = {};
const detailsSeen = new Set<string>();
const cfgs: { tag: string; cfg: any }[] = [{ tag: 'HALF_MANNY', cfg: clone(fixtures.HALF_MANNY) }]
  .concat(LATTICE.FULL.map((c: any) => ({ tag: c.tag, cfg: { ...clone(fixtures.HALF_MANNY), ...c.over } })));
let probeShown = false;
for (const { cfg } of cfgs) {
  const p = A.buildProgram(clone(cfg));
  t.progs++;
  for (const wk of Object.keys(p.weeks)) for (const dk of DAYS) {
    const day = p.weeks[wk][dk];
    if (!day || day.rest || !day.sections) continue;
    day.sections.forEach((sec: any) => (sec.items || []).forEach((it: any) => it && it.detail && detailsSeen.add(it.detail)));
    day.sections.forEach((sec: any) => {
      if (!((sec.superset || sec.type === 'superset') && (sec.items || []).length > 1)) return;
      t.ss++;
      const R = rounds(sec);
      if (R != null) t.ssRounds++;
      sec.items.forEach((it: any, k: number) => {
        t.members++;
        const s2 = clone(sec);
        s2.items.forEach((x: any, j: number) => { if (j !== k) x._skipped = true; });
        const html = String(render([s2]));
        const ds = drawnDetails(html);
        if (!probeShown) { out('probe html (first survivor card):\n' + html.slice(0, 1200) + '\n'); probeShown = true; }
        const d = ds.find(x => x && !/^$/.test(x) && x !== '') ?? null;
        if (d == null) return;
        t.drawn++;
        const own = it.detail || '';
        const ownRx = parseRx(own, it.name);
        const rx = parseRx(d, it.name);
        if (/^\d+\s*sets?\b/i.test(own)) {
          t.setsWord++;
          const n = +(/^(\d+)/.exec(own) as RegExpExecArray)[1];
          if (R === n) t.setsWordRoundsEq++; else t.setsWordRoundsNe++;
        }
        if (/^\d+\s*[×x]\s*\d+\s*sets?\b/i.test(d)) { t.garbled++; const key = it.name + ' | ' + d; garbledEx[key] = (garbledEx[key] || 0) + 1; }
        if (ownRx && ownRx.kind === 'sec') t.ownSec++;
        if (rx && rx.kind === 'sec' && !(ownRx && ownRx.kind === 'sec')) {
          t.asSec++; const key = it.name + ' | ' + own + '  =>  ' + d; asSecEx[key] = (asSecEx[key] || 0) + 1;
        }
      });
    });
  }
}
out('== Part A: a superset reduced to one live member');
out(`programs ${t.progs}; superset sections ${t.ss} (${t.ssRounds} with a round count); members tried ${t.members}; cards read ${t.drawn}`);
out(`survivor's own detail opens "N sets": ${t.setsWord} (round count equal to N: ${t.setsWordRoundsEq}, different: ${t.setsWordRoundsNe})`);
out(`drawn as "R×N sets ...": ${t.garbled}`);
out(`logged in seconds though its own detail is not: ${t.asSec} (own detail already in seconds: ${t.ownSec})`);
const top = (o: Record<string, number>, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
out('-- distinct garbled cards (count, name | drawn detail):');
for (const [k, v] of top(garbledEx, 25)) out(`  ${v}  ${k}`);
out(`   (${Object.keys(garbledEx).length} distinct)`);
out('-- distinct cards logged in seconds by mistake:');
for (const [k, v] of top(asSecEx, 25)) out(`  ${v}  ${k}`);
out(`   (${Object.keys(asSecEx).length} distinct)`);

// ── Part B ──────────────────────────────────────────────────────────────────
const pools = A.eval('RAND_POOLS');
const wild = new Set<string>();
Object.values(pools).flat().forEach((w: any) => (w.sections || []).forEach((s: any) => (s.items || []).forEach((it: any) => it && it.detail && wild.add(it.detail))));
const sloppy = (d: string) => {
  const m = d.toLowerCase().match(/^(\d+)\s*[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(sec|s|yd)?/);
  if (!m || !m[4]) return false;
  const after = d.toLowerCase().slice(m[0].length);
  return /^[a-z]/.test(after);   // the unit token ran on into a longer word
};
out('\n== Part B: details the strict grammar reads as a unit off a longer word');
for (const [label, set] of [['lattice', detailsSeen], ['wildcard', wild]] as [string, Set<string>][]) {
  const hits = [...set].filter(sloppy);
  out(`${label}: ${set.size} distinct details, ${hits.length} misread`);
  hits.slice(0, 20).forEach(h => out('  ' + h + '  -> ' + JSON.stringify(parseRx(h, ''))));
}
