// native-run-cards: today's eight run cards on Progress, before the Expo app draws them (MIGRATION.md phase 3, row 4,
// the second session). Read-only (measure). The card specs are the beta's own view, held equal to today's page by the
// walker at every tap (tests/support/native-progress.ts), so what is counted here is what today's ChartCard draws
// (frontends/app/src/app/screens/progress/charts/chart-card.ts).
//
// A. Which card each walk draws, on the ten programs: one, two and three weeks of runs logged with a pace, and the
//    standard history's last stretch.
// B. The markup a card's title, head, body and footer hold: each tag with its inline style, the entities, and the
//    characters outside ASCII.
// C. The SVG: each element, its attributes, its paints in both palettes, and what SvgPicture.tsx and paint.ts do
//    with each today.
// D. What is drawn outside the viewBox (the page's svg is overflow: visible).
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-run-cards_today.ts
//        (writes tests/measure/native-run-cards_today.md)
process.env['TZ'] = 'America/New_York';
import '../support/native-launch.ts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { cardKind, openBoth, progressTally, runsLife } from '../support/native-progress.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';
import { paint, svgProps } from '../../frontends/native/src/progress/paint.ts';
import { DAY, NIGHT, type Palette } from '../../frontends/native/src/theme.ts';

interface El { el: string; a: Record<string, string>; text?: string }
interface Spec { title: string; color: string; titleGap: number; head: string | null; svg: { w: number; h: number; els: El[] } | null; body: string | null; foot: string | null }

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const CREATED = '2026-08-29T09:00:00';
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };
const rows = (m: Record<string, number>): [string, number][] => Object.entries(m).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));

// ── gather ──
const KINDS = ['Long Run Ladder', 'Is Your Easy Actually Easy?', 'Is Your Easy Actually Easy? (the easy bands)', 'Recovery Pace — Easy-Effort Trend', 'Same Effort, More Speed',
  'Same Effort, More Speed (its empty state)', 'Where This Is Heading', 'Mileage — Drift From Plan'];
const walks = ['1 week of runs', '2 weeks of runs', '3 weeks of runs', 'standard history'];
const byWalk: Record<string, Record<string, number>> = {};
const byProgram: Record<string, Record<string, string[]>> = {};
const cards: { kind: string; spec: Spec; where: string }[] = [];
const names = Object.keys(PROGRAMS);
let screens = 0;
for (const name of names) {
  const cfg = walkable(PROGRAMS[name]!);
  byProgram[name] = {};
  const take = (walk: string, phone: any): void => {
    const two = openBoth(phone, progressTally(), name + ', ' + walk);
    screens++;
    const kinds: string[] = [];
    for (const c of two.view!.charts) {
      if (c.kind !== 'card') continue;
      const kind = cardKind(c.spec);
      kinds.push(kind);
      bump((byWalk[walk] = byWalk[walk] || {}), kind);
      cards.push({ kind, spec: c.spec as unknown as Spec, where: name + ', ' + walk });
    }
    byProgram[name]![walk] = kinds;
  };
  for (const weeks of [1, 2, 3]) take(weeks + ' week' + (weeks === 1 ? '' : 's') + ' of runs', runsLife(cfg, CREATED, weeks).phone);
  take('standard history', life(cfg, CREATED).phone);
}

// ── A ──
say('# Today\'s run cards, before the Expo app draws them');
say();
say('Measured ' + new Date().toISOString().slice(0, 10) + ' by `tests/measure/native-run-cards_today.ts` on the working tree. ' + screens + ' screens of the ten programs (' + walks.join('; ')
  + '), each held equal to today\'s page by the walker before it is read. ' + cards.length + ' run cards drawn.');
say();
say('## A. Which card each walk draws');
say();
say('| card | ' + walks.join(' | ') + ' | all |');
say('|---|' + walks.map(() => '---:|').join('') + '---:|');
for (const k of KINDS) say('| ' + k + ' | ' + walks.map((w) => (byWalk[w] || {})[k] || 0).join(' | ') + ' | ' + cards.filter((c) => c.kind === k).length + ' |');
const stray = [...new Set(cards.map((c) => c.kind))].filter((k) => !KINDS.includes(k));
say();
say('Kinds outside the eight: ' + (stray.length ? stray.join(', ') : 'none') + '.');
say();
say('Distinct specs per kind (as JSON): ' + KINDS.map((k) => k + ' ' + new Set(cards.filter((c) => c.kind === k).map((c) => JSON.stringify(c.spec))).size).join('; ') + '.');
say();
say('Programs that draw each kind: ' + KINDS.map((k) => k + ' ' + names.filter((n) => Object.values(byProgram[n]!).some((ks) => ks.includes(k))).length + ' of ' + names.length).join('; ') + '.');
say();
say('The parts a card holds, per kind (cards with a head / an svg / a body / a footer, the title gap, the card\'s colour):');
say();
say('| card | cards | head | svg | body | foot | title gap | colour |');
say('|---|---:|---:|---:|---:|---:|---|---|');
for (const k of KINDS) {
  const cs = cards.filter((c) => c.kind === k).map((c) => c.spec);
  const n = (f: (s: Spec) => unknown): number => cs.filter((s) => !!f(s)).length;
  say('| ' + k + ' | ' + cs.length + ' | ' + n((s) => s.head) + ' | ' + n((s) => s.svg) + ' | ' + n((s) => s.body) + ' | ' + n((s) => s.foot) + ' | ' + [...new Set(cs.map((s) => s.titleGap))].join(', ')
    + ' | ' + [...new Set(cs.map((s) => s.color))].map((c) => '`' + c + '`').join(', ') + ' |');
}

// ── B ──
say();
say('## B. The markup');
say();
const PARTS = ['title', 'head', 'body', 'foot'] as const;
for (const part of PARTS) {
  const tags: Record<string, number> = {}, ents: Record<string, number> = {}, chars: Record<string, number> = {}, nests: Record<string, number> = {};
  let n = 0, withTags = 0, svgIcons = 0;
  const icons = new Set<string>();
  for (const c of cards) {
    let html = c.spec[part];
    if (html === null) continue;
    n++;
    html = html.replace(/<svg[\s\S]*?<\/svg>/g, (m) => { svgIcons++; icons.add(m); return ''; });
    if (/<[a-z]/i.test(html)) withTags++;
    const stack: string[] = [];
    for (const m of html.matchAll(/<(\/?)([a-zA-Z0-9]+)((?:\s+[^>]*)?)>/g)) {
      if (m[1]) { stack.pop(); continue; }
      const style = /style="([^"]*)"/.exec(m[3] || '');
      const other = (m[3] || '').replace(/\s*style="[^"]*"/, '').trim();
      bump(tags, '<' + m[2] + '>' + (style ? ' `' + style[1] + '`' : ' (no style)') + (other ? ' other attributes: `' + other + '`' : ''));
      bump(nests, (stack.length ? stack.join(' > ') + ' > ' : '') + m[2]);
      stack.push(m[2]!);
    }
    const text = html.replace(/<[^>]*>/g, '');
    for (const m of text.matchAll(/&[a-zA-Z0-9#]+;/g)) bump(ents, m[0]);
    for (const ch of text) if (ch.charCodeAt(0) > 126) bump(chars, ch + ' (U+' + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0') + ')');
  }
  say('### ' + part + ' (' + n + ' of ' + cards.length + ' cards; ' + withTags + ' hold a tag' + (svgIcons ? '; ' + svgIcons + ' open with an icon, ' + icons.size + ' distinct' : '') + ')');
  say();
  if (Object.keys(tags).length) { for (const [k, v] of rows(tags)) say('- ' + v + ' × ' + k); } else say('- no tag');
  say('- nesting: ' + (rows(nests).map(([k, v]) => k + ' ' + v).join('; ') || 'none'));
  say('- entities: ' + (rows(ents).map(([k, v]) => '`' + k + '` ' + v).join('; ') || 'none'));
  say('- characters outside ASCII: ' + (rows(chars).map(([k, v]) => k + ' ' + v).join('; ') || 'none'));
  say();
}
// The style properties, over head, body and foot together.
const props: Record<string, Record<string, number>> = {};
for (const c of cards) for (const part of ['head', 'body', 'foot'] as const) {
  const html = c.spec[part];
  if (!html) continue;
  for (const m of html.matchAll(/style="([^"]*)"/g)) for (const decl of m[1]!.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    bump((props[decl.slice(0, i).trim()] = props[decl.slice(0, i).trim()] || {}), decl.slice(i + 1).trim());
  }
}
say('Every inline style property in head, body and foot, with its values:');
say();
for (const p of Object.keys(props).sort()) say('- `' + p + '`: ' + rows(props[p]!).map(([k, v]) => '`' + k + '` ' + v).join('; '));
say();
say('What `markupParts` (the titles\' and footers\' reader so far) makes of these: it strips every tag, so a `<b>` loses its weight and colour and two `<div>`s run together with nothing between them.');

// ── C ──
say();
say('## C. The SVG');
say();
const HANDLED_EL = ['line', 'rect', 'circle', 'path', 'polygon', 'text'];
const RENAMED: Record<string, string> = { 'stroke-width': 'strokeWidth', 'stroke-dasharray': 'strokeDasharray', 'stroke-linecap': 'strokeLinecap', 'font-size': 'fontSize', 'font-weight': 'fontWeight', 'text-anchor': 'textAnchor', 'font-family': 'fontFamily' };
const els: Record<string, number> = {}, attrs: Record<string, Record<string, number>> = {}, paints: Record<string, number> = {}, sizes: Record<string, number> = {};
const vals: Record<string, Record<string, number>> = {};
let total = 0, textNoFace = 0, textNoFill = 0, texts = 0, emptyPath = 0, dashed = 0;
const dashedNames: Record<string, number> = {}, textChars: Record<string, number> = {};
for (const c of cards) {
  const g = c.spec.svg;
  if (!g) continue;
  bump(sizes, g.w + ' × ' + g.h);
  for (const e of g.els) {
    total++;
    bump(els, e.el);
    const mine = svgProps(e as never, DAY, 'X');
    for (const k of Object.keys(e.a)) {
      bump((attrs[e.el] = attrs[e.el] || {}), k);
      if (k === 'fill' || k === 'stroke') bump(paints, e.a[k]!);
      if (['opacity', 'stroke-dasharray', 'stroke-width', 'font-size', 'font-weight', 'text-anchor', 'font-family', 'rx', 'r'].includes(k)) bump((vals[k] = vals[k] || {}), e.a[k]!);
    }
    for (const k of Object.keys(mine)) if (k.includes('-')) { dashed++; bump(dashedNames, k); }
    if (e.el === 'text') {
      texts++;
      if (!('font-family' in e.a)) textNoFace++;
      if (!('fill' in e.a)) textNoFill++;
      for (const ch of e.text || '') if (ch.charCodeAt(0) > 126) bump(textChars, ch + ' (U+' + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0') + ')');
    }
    if (e.el === 'path' && !String(e.a['d'] || '').trim()) emptyPath++;
  }
}
say(total + ' elements in ' + Object.values(sizes).reduce((a, b) => a + b, 0) + ' pictures. The viewBoxes: ' + rows(sizes).map(([k, v]) => k + ' (' + v + ')').join('; ') + '. Every picture is laid `width:100%;height:auto;overflow:visible`.');
say();
say('| element | count | SvgPicture.tsx draws it | its attributes (count) |');
say('|---|---:|---|---|');
for (const [k, v] of rows(els)) say('| ' + k + ' | ' + v + ' | ' + (HANDLED_EL.includes(k) ? 'yes' : '**no**') + ' | ' + rows(attrs[k]!).map(([a, n]) => a + ' ' + n).join(', ') + ' |');
say();
const allAttrs = [...new Set(Object.values(attrs).flatMap((m) => Object.keys(m)))].sort();
say('Attribute names: ' + allAttrs.length + '. paint.ts renames ' + allAttrs.filter((a) => RENAMED[a]).map((a) => '`' + a + '`').join(', ') + '; the rest carry react-native-svg\'s own spelling ('
  + allAttrs.filter((a) => !RENAMED[a]).map((a) => '`' + a + '`').join(', ') + '). Names still dashed after `svgProps`: ' + (dashed ? rows(dashedNames).map(([k, v]) => '`' + k + '` ' + v).join(', ') : 'none') + '.');
say();
say('The values of the attributes that are not a position or a size:');
say();
for (const k of Object.keys(vals).sort()) say('- `' + k + '`: ' + rows(vals[k]!).map(([a, n]) => '`' + a + '` ' + n).join('; '));
say();
say('Paints (fill and stroke), and what `paint` makes of each by day and by night:');
say();
say('| as the page writes it | count | day | night | a token of the palette |');
say('|---|---:|---|---|---|');
const has = (css: string, p: Palette): string => {
  if (css === 'none') return 'none';
  const tint = /^rgba\(var\(--([a-z]+)-rgb\)/.exec(css);
  if (tint) return typeof (p as any)[tint[1] + 'Rgb'] === 'string' ? 'yes' : '**no**';
  const token = /^var\(--([a-z0-9-]+)\)$/.exec(css);
  if (!token) return 'plain colour';
  return typeof (p as any)[token[1]!.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase())] === 'string' ? 'yes' : '**no**';
};
for (const [k, v] of rows(paints)) say('| `' + k + '` | ' + v + ' | ' + (k === 'none' ? 'none' : paint(k, DAY)) + ' | ' + (k === 'none' ? 'none' : paint(k, NIGHT)) + ' | ' + has(k, DAY) + ' |');
say();
const colours = [...new Set(cards.map((c) => c.spec.color))];
say('The card\'s own colour (its title): ' + colours.map((c) => '`' + c + '` (' + has(c, DAY) + ')').join(', ') + '.');
const inline = new Set<string>();
for (const c of cards) for (const part of ['head', 'body', 'foot'] as const) for (const m of (c.spec[part] || '').matchAll(/color:([^;"]+)/g)) inline.add(m[1]!.trim());
say('Colours named in the markup: ' + [...inline].map((c) => '`' + c + '` (' + has(c, DAY) + ')').join(', ') + '.');
say();
say('Text: ' + texts + ' elements; ' + textNoFace + ' name no font-family (the page gives them the body\'s face; `svgProps` sets the app\'s face only where one is named); ' + textNoFill + ' name no fill. '
  + 'Characters outside ASCII in a picture\'s text: ' + (rows(textChars).map(([k, v]) => k + ' ' + v).join('; ') || 'none') + '. Paths with an empty `d`: ' + emptyPath + '.');

// ── D ──
say();
say('## D. Outside the viewBox');
say();
const over: Record<string, number> = {};
let worst = 0, worstWhere = '';
const overBy: Record<string, number> = {};
for (const c of cards) {
  const g = c.spec.svg;
  if (!g) continue;
  for (const e of g.els) {
    const a = e.a, num = (k: string): number => +a[k]!;
    let box: [number, number, number, number] | null = null;   // x0, y0, x1, y1
    if (e.el === 'line') box = [Math.min(num('x1'), num('x2')), Math.min(num('y1'), num('y2')), Math.max(num('x1'), num('x2')), Math.max(num('y1'), num('y2'))];
    else if (e.el === 'rect') box = [num('x'), num('y'), num('x') + num('width'), num('y') + num('height')];
    else if (e.el === 'circle') box = [num('cx') - num('r'), num('cy') - num('r'), num('cx') + num('r'), num('cy') + num('r')];
    else if (e.el === 'polygon' || e.el === 'path') {
      const ns = [...String(a['points'] || a['d'] || '').matchAll(/(-?[0-9.]+),(-?[0-9.]+)/g)].map((m) => [+m[1]!, +m[2]!] as const);
      if (ns.length) box = [Math.min(...ns.map((p) => p[0])), Math.min(...ns.map((p) => p[1])), Math.max(...ns.map((p) => p[0])), Math.max(...ns.map((p) => p[1]))];
    } else if (e.el === 'text') {
      // A text's width is not known without its face: 0.6 of its size a character is a wide guess.
      const size = +(a['font-size'] || 8), wide = 0.6 * size * String(e.text || '').length, x = num('x'), anchor = a['text-anchor'] || 'start';
      const x0 = anchor === 'end' ? x - wide : anchor === 'middle' ? x - wide / 2 : x;
      box = [x0, num('y') - size, x0 + wide, num('y') + 0.25 * size];
    }
    if (!box) continue;
    const by = Math.max(-box[0], -box[1], box[2] - g.w, box[3] - g.h);
    if (by > 0.05) {
      bump(over, c.kind + ', ' + e.el + (e.el === 'text' ? ' (width guessed)' : ''));
      const key = c.kind + ', ' + e.el;
      overBy[key] = Math.max(overBy[key] || 0, by);
      if (by > worst) { worst = by; worstWhere = c.where + ', ' + e.el + (e.text ? ' "' + e.text + '"' : ''); }
    }
  }
}
if (Object.keys(over).length) {
  for (const [k, v] of rows(over)) say('- ' + v + ' × ' + k + ', by up to ' + overBy[k.replace(' (width guessed)', '')]!.toFixed(1) + ' units');
  say();
  say('The furthest: ' + worst.toFixed(1) + ' units (' + worstWhere + ').');
} else say('No element reaches past its viewBox.');
say();

writeFileSync(join(REPO, 'tests/measure/native-run-cards_today.md'), out.join('\n') + '\n');
console.log('wrote tests/measure/native-run-cards_today.md: ' + screens + ' screens, ' + cards.length + ' cards');
